// Vox camera (13-vox-editorial.md §camera): the camera is alive during holds (slow linear drift) and moves
// between focus points with eased pushes. Everything is a pure function of the frame (no timers).
import React from 'react';
import {AbsoluteFill, Easing, interpolate} from 'remotion';
import {EASE} from './motion';

export type CamKey = {at: number; cx: number; cy: number; scale: number}; // focus point in % of the content

/** Camera transform for a focus point (cx, cy in %) shown at the frame centre with zoom `s`. */
export const camTransform = (cx: number, cy: number, s: number) =>
  `translate(${50 - s * cx}%, ${50 - s * cy}%) scale(${s})`;

/** Interpolate camera keys with an ease between each pair (default EASE.voxCamera). */
export const camAt = (frame: number, keys: CamKey[], ease: (t: number) => number = EASE.voxCamera) => {
  if (frame <= keys[0].at) return keys[0];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (frame <= b.at) {
      const p = interpolate(frame, [a.at, b.at], [0, 1], {easing: ease});
      // interpolate zoom geometrically so pushes feel constant-speed
      const s = a.scale * Math.pow(b.scale / a.scale, p);
      return {at: frame, cx: a.cx + (b.cx - a.cx) * p, cy: a.cy + (b.cy - a.cy) * p, scale: s};
    }
  }
  return keys[keys.length - 1];
};

/**
 * <VoxCamera> wraps a board. `keys` define pushes; `drift` adds a linear push-in on top
 * (fraction per second, default 0.008 → ≈ 4 % per 5 s) so holds never freeze.
 */
export const VoxCamera: React.FC<{
  frame: number;
  fps: number;
  keys?: CamKey[];
  drift?: number;
  ease?: (t: number) => number;
  children: React.ReactNode;
}> = ({frame, fps, keys = [{at: 0, cx: 50, cy: 50, scale: 1}], drift = 0.008, ease, children}) => {
  const k = camAt(frame, keys, ease);
  const s = k.scale * (1 + (drift * Math.max(0, frame)) / fps);
  return <AbsoluteFill style={{transformOrigin: '0 0', transform: camTransform(k.cx, k.cy, s)}}>{children}</AbsoluteFill>;
};

/** Zoom-through into a detail: ×1 → ×`to` with ease-in over `dur` frames, cut on the last frame. */
export const zoomThrough = (frame: number, start: number, dur = 20, to = 4) =>
  interpolate(frame, [start, start + dur], [1, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
