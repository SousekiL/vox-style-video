// Motion primitives with the numbers measured in references/notes. See style/collage-motion/05-motion.md.
import {Easing, interpolate, spring, type SpringConfig} from 'remotion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ---- Easings (all fitted from tracked frames) ----
export const EASE = {
  expoOut: Easing.bezier(0.16, 1, 0.3, 1), // v01 camera settle, v06 bar hop
  slideStop: Easing.bezier(0.3, 0.6, 0.5, 1), // v02 car slide-stop
  riseOut: Easing.bezier(0.2, 0.6, 0.35, 1), // v03 road / note rise
  longGlide: Easing.bezier(0.25, 0.4, 0.1, 1), // v07 car park (48 f for 91 %W)
  carriage: Easing.bezier(0.2, 0.5, 0.4, 1), // v07 stepped slide-stop
  unfold: Easing.bezier(0.2, 0.7, 0.3, 1), // v04a shoebox slide
  inOut: Easing.bezier(0.65, 0, 0.35, 1), // v01 end-card shrink-and-rise
  mosaic: Easing.bezier(0.45, 0, 0.55, 1), // v04b tile swap S-curve
  windowGrow: Easing.bezier(0.2, 0.8, 0.2, 1), // v04b duotone square
  recede: Easing.in(Easing.cubic), // v04a recede-to-cut
  linear: Easing.linear,
};

// ---- Springs ----
export const SPRING: Record<string, Partial<SpringConfig>> = {
  stamp: {mass: 0.2, stiffness: 350, damping: 6}, // v08 rubber stamp: +26 % / −8 %, settles in 6 f
  pop: {mass: 1, stiffness: 130, damping: 8.5}, // v01 prop pop (use POP table for exact shape)
  snapPush: {mass: 0.6, stiffness: 260, damping: 26}, // v04a zoom-to-sheet, no overshoot
  eyeSettle: {mass: 1, stiffness: 180, damping: 14}, // v03 corner pop
};

// ---- Keyframe tables (one entry per drawing on the layer's clock) ----
/** v01 laptop pop-in, scale relative to final, one value per 12 fps step. Peak +28 %, settles in 15–20 f. */
export const POP = [0.28, 0.81, 1.21, 1.28, 1.17, 1.07, 1.0, 0.98, 1.0];
/** v01 grid-circle pop (gentler, +20 %). */
export const POP_SOFT = [0.79, 1.15, 1.2, 1.13, 1.06, 1.01, 0.98, 1.0];
/** v08 stamp, per 30 fps frame. */
export const STAMP = [0.78, 1.26, 1.15, 0.95, 0.92, 0.97, 1.0];
/** v08 asterisk pulse, each state held 5 frames, period 20. */
export const PULSE = [1, 0.79, 0.7, 0.79];
/** v01 pre-cut push poses, per source frame for the last 5 frames, then hard cut. */
export const PRECUT_PUSH = [1.065, 1.065, 1.065, 1.4, 1.4];

/** Read a per-drawing table. `steps` = drawings since start (negative = not yet visible → 0). */
export const table = (values: number[], steps: number, before = 0): number =>
  steps < 0 ? before : values[Math.min(Math.floor(steps), values.length - 1)];

// ---- Common moves ----
/** Spring sampled on any clock (pass the posterized frame). */
export const springAt = (t: number, start: number, fps: number, config: Partial<SpringConfig>) =>
  t < start ? 0 : spring({frame: t - start, fps, config});

/** Post-cut camera settle: offset/scale decays with expo-out over `dur` frames (v01: 12–15 f). */
export const settle = (t: number, start: number, dur = 15) =>
  interpolate(t, [start, start + dur], [0, 1], {...clamp, easing: EASE.expoOut});

/**
 * Recede-to-cut (v04a): slow linear shrink (−0.06 %/frame) then an accelerating collapse to 0.75
 * over the last 8 frames before a hard cut.
 */
export const recedeToCut = (t: number, sceneStart: number, cut: number) => {
  const slow = interpolate(t, [sceneStart, cut - 8], [1, 1 - 0.0006 * (cut - 8 - sceneStart)], clamp);
  const fast = interpolate(t, [cut - 8, cut], [1, 0.75], {...clamp, easing: EASE.recede});
  return slow * fast;
};

/** Pendulum (v01 hanging house): ±5.5° with a 60-frame period, no decay. */
export const pendulum = (t: number, amplitude = 5.5, period = 60) =>
  amplitude * Math.sin((2 * Math.PI * t) / period);

/** Linear card spin (v06): constant 15°/frame at 12 fps from −75° to +75°. */
export const cardSpin = (local: number, frames = 11) => interpolate(local, [0, frames - 1], [-75, 75]);

// ---- Text timing ----
/** Glyphs visible for a type-on at `perChar` frames per character (v04a: 2, v08: 2, signature: 4). */
export const charsShown = (frame: number, start: number, perChar: number) =>
  frame < start ? 0 : Math.floor((frame - start) / perChar) + 1;

/** Words visible for a word-stamp at `perWord` frames per word (v04b: 3, v04a: 4). */
export const wordsShown = (frame: number, start: number, perWord: number) =>
  frame < start ? 0 : Math.floor((frame - start) / perWord) + 1;

// ---- Whip-pan around a cut (v01 part A) ----
/** Cumulative board offset (fraction of W) per drawing in the last 4 steps before a cut: ×4 per step, ease-in. */
export const WHIP_OUT = [0, -0.006, -0.025, -0.1, -0.18];
/** Remaining offset after a cut: starts ~40 % W behind and decays ×0.6 per drawing. */
export const whipIn = (stepsSinceCut: number, startOffset = 0.4, ratio = 0.6) =>
  stepsSinceCut < 0 ? startOffset : startOffset * Math.pow(ratio, stepsSinceCut);

/** Zoom-out settle on scene open: ×1.217 → 1.0, expo decay τ ≈ 4 source frames (v01 f1–f19). */
export const zoomOutSettle = (localFrame: number, excess = 0.217, tau = 4) => 1 + excess * Math.exp(-localFrame / tau);

/** Slam-and-step-down (v01 "Be the Bank."): appears ~1.8× big, then two held poses. Frames are 30 fps source frames. */
export const SLAM = [
  {at: 0, scale: 1.8},
  {at: 8, scale: 1.25},
  {at: 13, scale: 1.0},
];

/** Pump-pulse growth (v01 balloon): +24 % per 20-frame stroke, relax −5 % after each, ×2.7 over 4 pulses. */
export const pumpPulse = (t: number, period = 20) => {
  const pulses = Math.floor(t / period);
  const p = (t % period) / period;
  const grow = interpolate(p, [0, 0.35, 0.5, 0.6], [0, 1, 1, 0.78], {extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return Math.pow(1.19, pulses) * (1 + 0.24 * grow);
};
