# Audio clips

Voice clips for the radio-dispatcher effect. Files in this folder are referenced from JavaScript as `/audio/<filename>`.

## Quick start

1. Save your recording as **MP3** (preferred for size) or **WAV** (preferred for quality) in this folder. Use kebab-case filenames: `dirty-door-here.mp3`.
2. Add the path to one of two arrays in `apps/web/app/page.tsx`:
   - `MY_DISPATCH_LINES` — played when **you** press the CTA. Your own voice.
   - `EXT_DISPATCH_LINES` — played randomly every 30–60s as background dispatcher chatter. "External" voices.
3. Refresh. Click the button (or wait for an auto-call). Hear it.

That's it — the radio effect (bandpass + saturation + compression) is applied automatically by `playRadio()` in `apps/web/lib/sound.ts`. No DAW work needed.

## File requirements

| Setting | Value | Notes |
|---|---|---|
| Format | MP3, WAV, M4A, or OGG | MP3 is the safe default. Universal, small. |
| Sample rate | 44.1 kHz | Default in any recorder / DAW. |
| Channels | Mono | Stereo wastes bytes on a voice clip. |
| Bit rate (MP3) | 192 kbps or higher | Below that the artifacts compound with the radio filter. |
| Length | 1–3 seconds | Sweet spot for a radio bark. |

## Recording tips

The chain in `apps/web/lib/sound.ts` already applies:
- Bandpass (400Hz–3kHz) — the radio band-limit
- Saturation — broadcast distortion
- Heavy compression — punch / "in your ear" presence
- Makeup gain — restores level after filtering

So **record dry**:
- Close mic (3–6 inches), mouth on it.
- Push consonants ("we GOT a DIRTY door HERE").
- **No** reverb, EQ, or compression on your end — the chain will compound it badly.
- Trim silence at the start so the click and your voice fire together.

## Wire it up

In `apps/web/app/page.tsx`:

```tsx
const MY_DISPATCH_LINES = [
  "/audio/dirty-door-here.mp3",     // played when you press the CTA
  "/audio/door-spotted.mp3",
];

const EXT_DISPATCH_LINES = [
  "/audio/code-7-laundromat.mp3",   // played by the auto-dispatcher (every 30–60s, 70% volume)
  "/audio/units-respond.mp3",
];
```

The button and the auto-dispatcher each pick a random line from their own array. Same clip can live in both arrays if you want it to be heard both ways. Empty out `EXT_DISPATCH_LINES` to silence the auto-dispatcher entirely.

## Preload (optional but smart)

The first call to `playRadio(url)` for a given file triggers fetch + decode, which adds a noticeable delay. Preload the pool on mount:

```tsx
import { useEffect } from "react";
import { preloadRadio } from "@/lib/sound";

useEffect(() => {
  [...MY_DISPATCH_LINES, ...EXT_DISPATCH_LINES].forEach(preloadRadio);
}, []);
```

After preload, plays are instant. Cached for the rest of the session.

## Tuning the radio sound per clip

`playRadio(url, options)` takes overrides:

```ts
playRadio("/audio/code-7-laundromat.mp3", {
  lowCut: 600,        // tighter "telephone" feel (default 450)
  highCut: 2000,      // softer / muffled (default 2400)
  distortion: 38,     // blown-out CB (default 28; range 0–50)
  noiseFloor: 0.05,   // more open-carrier hiss (default 0.025; 0 = clean)
  volume: 1.2,        // (default 1.0)
});
```

Defaults are a fuzzy walkie-talkie with subtle hiss. Override per-clip if a specific line should feel different — e.g. a far-away dispatcher: `{ lowCut: 800, highCut: 1800, distortion: 35, noiseFloor: 0.04 }`.

If you want **all** clips to share a different baseline, change the defaults at the top of `playRadio` in `apps/web/lib/sound.ts` instead.

## Files served publicly

Everything in this folder is reachable at `https://dirtydoor.com/audio/<filename>` — including this README. Don't put anything sensitive in here.
