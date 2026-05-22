let ctx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
const bufferCache = new Map<string, Promise<AudioBuffer>>();

/**
 * Shared AnalyserNode used purely for visualization. Sources tap into it in
 * parallel with their normal audio path, so the wave display reads the signal
 * at full pre-gain amplitude regardless of how quiet playback actually is.
 * Returns null in non-browser contexts (SSR).
 */
export function getAnalyser(): AnalyserNode | null {
  const audio = getCtx();
  if (!audio) return null;
  if (!analyser) {
    analyser = audio.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.35;
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
 * Play an audio file straight through. Effects are baked into the source files.
 * Files live in apps/web/public/audio and are referenced as e.g. "/audio/clip.mp3".
 */
export async function playRadio(
  url: string,
  options: RadioOptions = {},
): Promise<void> {
  const audio = getCtx();
  if (!audio) return;

  const { volume = 1.0 } = options;

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

  const gain = audio.createGain();
  gain.gain.value = volume;

  source.connect(gain).connect(audio.destination);

  // Parallel tap into the analyser at full amplitude so the LCD wave moves
  // regardless of how low the playback volume is.
  const analyserNode = getAnalyser();
  if (analyserNode) source.connect(analyserNode);

  source.start();
}
