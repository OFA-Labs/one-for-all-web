/** Startup feedback timing. The heart video owns its native playback cadence. */
export const REACTOR_STARTUP_MS = 3500;
export const REACTOR_SHUTDOWN_MS = 4200;

// Retain the existing startup surface feedback, independently of video playback.
const LOOP_START_MS = 5500;
const LOOP_END_MS = 7292;
const LOOP_MS = LOOP_END_MS - LOOP_START_MS;
// The primary CSS contraction peaks 55 ms after its start. Align it to the
// measured expansion/light peaks in the supplied footage, including the intro.
const INTRO_BEATS = [750, 1208, 1958, 2792, 3583, 4375, 5083].map(
  (peak) => peak - 55,
);
const LOOP_BEATS = [5750, 6375, 6958].map((peak) => peak - 55);

export function reactorBeatAt(elapsedMs: number) {
  const elapsed = Math.max(0, elapsedMs);
  let at = -1000;
  let index = 0;
  for (const time of INTRO_BEATS) {
    if (time > elapsed) break;
    at = time;
    index++;
  }
  // The first pass and all subsequent loops use the measured footage peaks.
  if (elapsed >= LOOP_START_MS) {
    const cycle = Math.max(0, Math.floor((elapsed - LOOP_START_MS) / LOOP_MS));
    for (let pass = Math.max(0, cycle - 1); pass <= cycle; pass++) {
      for (let beat = 0; beat < LOOP_BEATS.length; beat++) {
        const time = LOOP_BEATS[beat] + pass * LOOP_MS;
        if (time <= elapsed) {
          at = time;
          index = INTRO_BEATS.length + pass * LOOP_BEATS.length + beat;
        }
      }
    }
  }
  return { index, at, since: elapsed - at };
}

/** A soft "lub-dub" pulse, 0 at rest and just under 1 at its peak. */
export function reactorPump(sinceMs: number) {
  const lobe = (start: number, duration: number) => {
    const phase = (sinceMs - start) / duration;
    return phase > 0 && phase < 1 ? Math.sin(Math.PI * phase) ** 2 : 0;
  };
  return 0.9 * lobe(0, 110) + 0.45 * lobe(115, 120);
}
