// Time models. The single most important rule of the style: decide which clock each layer runs on.
// See style/collage-motion/05-motion.md §1.
import {random, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Hold the current drawing when animating at `animFps` inside a comp running at `fps`.
 * Returns a comp-frame number (may be fractional) to feed to interpolate()/spring().
 * 12 fps in a 30 fps comp gives holds of 3,2,3,2… exactly like v01 and v07.
 */
export const posterize = (frame: number, fps: number, animFps: number): number => {
  if (!Number.isFinite(animFps) || animFps >= fps) return frame;
  return (Math.floor((frame * animFps) / fps) * fps) / animFps;
};

/** Index of the drawing (0, 1, 2…) at `animFps`. */
export const drawingIndex = (frame: number, fps: number, animFps: number): number =>
  Number.isFinite(animFps) ? Math.floor((frame * animFps) / fps) : frame;

/**
 * Hold pattern clock, for cadences that are not a clean ratio.
 * v03 uses [3,3,3,4,2] at 30 fps (10 drawings per second with a regular slip).
 */
export const patterned = (frame: number, pattern: number[]): number => {
  const period = pattern.reduce((a, b) => a + b, 0);
  const block = Math.floor(frame / period) * period;
  let r = frame - block;
  let held = block;
  for (const len of pattern) {
    if (r < len) return held;
    r -= len;
    held += len;
  }
  return held;
};

/**
 * Irregular hand-pushed holds: returns the start frame of the hold that contains `frame`.
 * v04b collage boil uses holds of 1–5 frames; v05 stutter freezes 1–3 frames every 10–25.
 */
export const irregularHold = (frame: number, seed: string, minLen = 1, maxLen = 5): number => {
  let start = 0;
  let i = 0;
  while (true) {
    const len = minLen + Math.floor(random(`${seed}-${i}`) * (maxLen - minLen + 1));
    if (frame < start + len) return start;
    start += len;
    i++;
  }
};

/** Re-roll counter for boiling textures: changes every `every` frames (v01 paper: 15, v04a quiet page: 3). */
export const boilState = (frame: number, every: number): number => Math.floor(frame / every);

/** Hook form: the held comp frame for this layer's clock. */
export const useClock = (animFps: number = Infinity) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return {frame, fps, t: posterize(frame, fps, animFps), step: drawingIndex(frame, fps, animFps)};
};

export type Pose = {at: number; x: number; y: number; rot?: number; scale?: number; opacity?: number};

/**
 * Hold-jump: discrete poses, no interpolation between them (v01 captions, v08 entries).
 * Returns null before the first pose.
 */
export const poseAt = (frame: number, poses: Pose[]): Pose | null => {
  let p: Pose | null = null;
  for (const q of poses) if (frame >= q.at) p = q;
  return p;
};
