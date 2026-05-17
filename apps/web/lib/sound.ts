let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
const bufferCache = new Map<string, Promise<AudioBuffer>>();

/**
 * Shared AnalyserNode for the radio chain. Voice + noise both feed into it
 * on their way to the destination so the LCD waveform display can read from it.
 * Returns null in non-browser contexts (SSR).
 */
export function getAnalyser(): AnalyserNode | null {
  const audio = getCtx();
  if (!audio) return null;
  if (!analyser) {
    analyser = audio.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.35;
    analyser.connect(audio.destination);
  }
  return analyser;
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/**
 * Industrial control-panel button click.
 * Two layers: a low thunk (the body) + a filtered noise tick (the contact texture).
 * Tune the numbers below to taste.
 */
export function playClick() {
  const audio = getCtx();
  if (!audio) return;
  const now = audio.currentTime;

  // Low thunk
  const thunk = audio.createOscillator();
  thunk.type = "square";
  thunk.frequency.setValueAtTime(160, now);
  thunk.frequency.exponentialRampToValueAtTime(45, now + 0.06);
  const thunkGain = audio.createGain();
  thunkGain.gain.setValueAtTime(0.28, now);
  thunkGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
  thunk.connect(thunkGain).connect(audio.destination);
  thunk.start(now);
  thunk.stop(now + 0.1);

  // High tick (filtered noise)
  const tickBuf = audio.createBuffer(
    1,
    Math.floor(audio.sampleRate * 0.04),
    audio.sampleRate,
  );
  const data = tickBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const tick = audio.createBufferSource();
  tick.buffer = tickBuf;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2400;
  filter.Q.value = 5;
  const tickGain = audio.createGain();
  tickGain.gain.setValueAtTime(0.18, now);
  tickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
  tick.connect(filter).connect(tickGain).connect(audio.destination);
  tick.start(now);
  tick.stop(now + 0.04);
}

// -- radio voice ----------------------------------------------------------

export type RadioOptions = {
  /** Lower frequency of the radio band, in Hz. Default 450. Tighter = more "telephone". */
  lowCut?: number;
  /** Upper frequency of the radio band, in Hz. Default 2400. Lower = softer consonants. */
  highCut?: number;
  /** Saturation intensity, 0–50. Default 28. Higher = more distorted / grittier. */
  distortion?: number;
  /** Open-carrier hiss layered under the voice. 0 = silent, 0.05+ = noticeable. Default 0.025. */
  noiseFloor?: number;
  /** Output volume multiplier. Default 1.0. */
  volume?: number;
};

function loadBuffer(url: string): Promise<AudioBuffer> | null {
  const audio = getCtx();
  if (!audio) return null;
  let promise = bufferCache.get(url);
  if (!promise) {
    promise = (async () => {
      const res = await fetch(url);
      if (!res.ok)
        throw new Error(`[sound] failed to load ${url}: ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      return audio.decodeAudioData(arrayBuffer);
    })();
    bufferCache.set(url, promise);
    promise.catch(() => bufferCache.delete(url));
  }
  return promise;
}

/**
 * Fetch and decode an audio file ahead of time so the first play has no latency.
 * Call from a useEffect on mount for any clips you know you'll play.
 */
export async function preloadRadio(url: string): Promise<void> {
  try {
    await loadBuffer(url);
  } catch (e) {
    console.warn(e);
  }
}

/**
 * Play an audio file through a radio/walkie-talkie effects chain:
 *   bandpass → light saturation → compressor → makeup gain → destination
 * Files live in apps/web/public/audio and are referenced as e.g. "/audio/clip.mp3".
 */
export async function playRadio(
  url: string,
  options: RadioOptions = {},
): Promise<void> {
  const audio = getCtx();
  if (!audio) return;

  const {
    lowCut = 450,
    highCut = 2400,
    distortion = 28,
    noiseFloor = 0.025,
    volume = 1.0,
  } = options;

  let buffer: AudioBuffer;
  try {
    const promise = loadBuffer(url);
    if (!promise) return;
    buffer = await promise;
  } catch (e) {
    console.warn(e);
    return;
  }

  const source = audio.createBufferSource();
  source.buffer = buffer;

  // Bandpass via high-pass + low-pass (two-stage gives a cleaner cut than a single bandpass)
  const highpass = audio.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = lowCut;
  highpass.Q.value = 0.7;

  const lowpass = audio.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = highCut;
  lowpass.Q.value = 0.7;

  // Saturation — light tube-amp-style harmonic distortion
  const shaper = audio.createWaveShaper();
  shaper.curve = makeSaturationCurve(distortion);
  shaper.oversample = "2x";

  // Compressor — broadcast-style limiting; tight settings to clamp consonant transients
  const compressor = audio.createDynamicsCompressor();
  compressor.threshold.value = -25;
  compressor.knee.value = 4;
  compressor.ratio.value = 10;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.08;

  // Makeup gain — kept deliberately low so the radio sits well underneath UI / map
  const makeup = audio.createGain();
  makeup.gain.value = 0.45 * volume;

  const out = getAnalyser() ?? audio.destination;
  source
    .connect(highpass)
    .connect(lowpass)
    .connect(shaper)
    .connect(compressor)
    .connect(makeup)
    .connect(out);

  // Noise floor — looped filtered white noise gives that "open carrier" hiss under the voice.
  // Fades in/out so there's no click on start/end.
  let noiseSource: AudioBufferSourceNode | null = null;
  if (noiseFloor > 0) {
    const noiseLen = Math.floor(audio.sampleRate); // 1s loop
    const noiseBuf = audio.createBuffer(1, noiseLen, audio.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let i = 0; i < noiseData.length; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    noiseSource = audio.createBufferSource();
    noiseSource.buffer = noiseBuf;
    noiseSource.loop = true;

    const noiseHp = audio.createBiquadFilter();
    noiseHp.type = "highpass";
    noiseHp.frequency.value = 600;
    const noiseLp = audio.createBiquadFilter();
    noiseLp.type = "lowpass";
    noiseLp.frequency.value = 2200;

    const noiseGain = audio.createGain();
    const now = audio.currentTime;
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(noiseFloor * volume, now + 0.04);

    noiseSource
      .connect(noiseHp)
      .connect(noiseLp)
      .connect(noiseGain)
      .connect(out);
    noiseSource.start(now);

    source.onended = () => {
      const t = audio.currentTime;
      noiseGain.gain.cancelScheduledValues(t);
      noiseGain.gain.setValueAtTime(noiseGain.gain.value, t);
      noiseGain.gain.linearRampToValueAtTime(0, t + 0.05);
      noiseSource?.stop(t + 0.08);
    };
  }

  source.start();
}

function makeSaturationCurve(amount: number): Float32Array<ArrayBuffer> {
  // Classic WaveShaper curve — soft-clip tanh-style. amount=0 is identity, amount=50 is heavy.
  const samples = 1024;
  const curve = new Float32Array(new ArrayBuffer(samples * 4));
  const k = amount;
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}
