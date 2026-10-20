// Transitions. The style never cross-dissolves whole scenes; every change is a cut, a physical
// paper move, or a mask made of hard-edged pieces. See style/collage-motion/06-transitions.md.
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, useVideoConfig} from 'remotion';
import {EASE, PRECUT_PUSH, WHIP_OUT, settle, whipIn} from './motion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/**
 * Camera wrapper for a shot that starts on a hard cut and ends on one (v01):
 * - first `settleFrames`: expo-out settle from `fromScale` / `fromX` (%W)
 * - last 5 frames: discrete pre-cut push poses ×1.065 then ×1.4
 * Pass `t` = posterized frame relative to the shot start, `dur` = shot length in frames.
 */
export const CutCamera: React.FC<{
  t: number;
  dur: number;
  fromScale?: number;
  fromX?: number;
  settleFrames?: number;
  push?: boolean;
  origin?: string;
  children: React.ReactNode;
}> = ({t, dur, fromScale = 1, fromX = 0, settleFrames = 15, push = true, origin = '50% 50%', children}) => {
  const s = settle(t, 0, settleFrames);
  let scale = interpolate(s, [0, 1], [fromScale, 1]);
  const x = interpolate(s, [0, 1], [fromX, 0]);
  const fromEnd = dur - t;
  if (push && fromEnd <= PRECUT_PUSH.length && fromEnd > 0) scale *= PRECUT_PUSH[PRECUT_PUSH.length - Math.ceil(fromEnd)];
  return (
    <AbsoluteFill style={{transform: `translateX(${x}%) scale(${scale})`, transformOrigin: origin}}>{children}</AbsoluteFill>
  );
};

/**
 * Tile-mosaic swap (v04b): B replaces A in random grid-aligned rectangles that snap on (no fade).
 * 10 frames, S-curve, 50 % at frame ≈5.5. Render A underneath and wrap B in this mask.
 */
export const TileMosaic: React.FC<{frame: number; start: number; dur?: number; cols?: number; rows?: number; seed?: string; children: React.ReactNode}> = ({
  frame,
  start,
  dur = 10,
  cols = 8,
  rows = 6,
  seed = 'mosaic',
  children,
}) => {
  const tiles = useMemo(() => {
    const out: {x: number; y: number; w: number; h: number; r: number}[] = [];
    const used = new Set<string>();
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        if (used.has(`${x},${y}`)) continue;
        const w = Math.min(cols - x, 1 + Math.floor(random(`${seed}w${x}${y}`) * 3));
        const h = Math.min(rows - y, 1 + Math.floor(random(`${seed}h${x}${y}`) * 2));
        for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) used.add(`${x + i},${y + j}`);
        out.push({x, y, w, h, r: random(`${seed}r${x}${y}`)});
      }
    return out;
  }, [cols, rows, seed]);
  const p = interpolate(frame, [start, start + dur], [0, 1], {...clamp, easing: EASE.mosaic});
  if (p <= 0) return null;
  if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const rects = tiles
    .filter((tl) => tl.r < p)
    .map((tl) => `<rect x='${tl.x}' y='${tl.y}' width='${tl.w}' height='${tl.h}' fill='white'/>`)
    .join('');
  const svg = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${cols} ${rows}' preserveAspectRatio='none'>${rects}</svg>")`;
  return <AbsoluteFill style={{maskImage: svg, WebkitMaskImage: svg, maskSize: '100% 100%', WebkitMaskSize: '100% 100%'}}>{children}</AbsoluteFill>;
};

/**
 * Ink scribble blackout (v04a T3): black brush strokes accumulate, coverage 12 → 99 % over 14 frames,
 * accelerating, stepped on 2s. Cut to the next scene on the last frame.
 */
export const InkBlackout: React.FC<{frame: number; start: number; dur?: number; color?: string}> = ({frame, start, dur = 14, color = '#050505'}) => {
  const {width, height} = useVideoConfig();
  const t = Math.floor((frame - start) / 2) * 2;
  if (t < 0) return null;
  const cover = interpolate(t, [0, dur], [0.12, 1], {...clamp, easing: EASE.recede});
  const n = Math.round(cover * 26);
  const sw = height * 0.16;
  return (
    <AbsoluteFill>
      <svg width={width} height={height}>
        {new Array(n).fill(0).map((_, i) => {
          const y = random(`ib-y${i}`) * height;
          const x0 = -0.1 * width + random(`ib-x${i}`) * 0.3 * width;
          const x1 = x0 + (0.6 + random(`ib-l${i}`) * 0.8) * width;
          const tilt = (random(`ib-t${i}`) - 0.5) * height * 0.4;
          return (
            <path
              key={i}
              d={`M${x0},${y} Q${(x0 + x1) / 2},${y + tilt} ${x1},${y - tilt * 0.3}`}
              stroke={color}
              strokeWidth={sw * (0.6 + random(`ib-w${i}`) * 0.8)}
              strokeLinecap="round"
              fill="none"
              style={{filter: 'url(#torn)'}}
            />
          );
        })}
        {cover >= 0.99 ? <rect width={width} height={height} fill={color} /> : null}
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Slanted paper sheet slide-over (v04a T4): a sheet with an edge ≈15° off vertical jumps in from the right
 * in irregular hand-pushed holds. Edge x positions (%W) measured: 74.4 (hold 4) → 68.9 → 57.4 (hold 5) → 10.
 */
export const SlantedSheet: React.FC<{frame: number; start: number; color?: string; children?: React.ReactNode}> = ({frame, start, color = '#fbfbfb', children}) => {
  const POSES: [number, number][] = [
    [0, 74.4],
    [4, 68.9],
    [6, 57.4],
    [11, 10],
    [13, -20],
  ];
  const t = frame - start;
  if (t < 0) return null;
  let edge = POSES[0][1];
  for (const [at, x] of POSES) if (t >= at) edge = x;
  const lean = 15; // degrees
  const dx = Math.tan((lean * Math.PI) / 180) * 50; // half-height offset in %H→%W approx for 16:9
  return (
    <AbsoluteFill style={{clipPath: `polygon(${edge + dx * 0.56}% 0, 100% 0, 100% 100%, ${edge - dx * 0.56}% 100%)`, background: color}}>
      {children}
    </AbsoluteFill>
  );
};

/**
 * Vinyl disc iris (v05): flat concentric bands grow from the centre, ease-in t^1.5 over 11 frames,
 * each band 2 frames behind the previous. `mode="close"` covers the frame; "open" reveals from the centre.
 */
export const DiscIris: React.FC<{frame: number; start: number; bands?: string[]; dur?: number}> = ({
  frame,
  start,
  bands = ['#bfb2ad', '#9d8082', '#b09c9b', '#d8cec0'],
  dur = 11,
}) => {
  const {width, height} = useVideoConfig();
  const R = Math.hypot(width, height) / 2;
  return (
    <AbsoluteFill>
      <svg width={width} height={height}>
        {bands.map((c, i) => {
          const t = interpolate(frame, [start + i * 2, start + i * 2 + dur], [0, 1], clamp);
          return <circle key={i} cx={width / 2} cy={height / 2} r={Math.pow(t, 1.5) * R * (1.05 - i * 0.04)} fill={c} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Split whip-pan board (v01 part A): the new board decelerates in from `dirIn` (×0.6 per drawing),
 * holds, then shoves out toward `dirOut` in 4 accelerating drawings (×4 per step) and hard-cuts.
 * `step` = drawing index since the shot started; `steps` = shot length in drawings.
 * dir: -1 = moves left, +1 = moves right.
 */
export const WhipBoard: React.FC<{step: number; steps: number; dirIn?: -1 | 1; dirOut?: -1 | 1; children: React.ReactNode}> = ({
  step,
  steps,
  dirIn = -1,
  dirOut = -1,
  children,
}) => {
  const inX = -dirIn * whipIn(step) * 100; // starts behind, slides toward dirIn
  const k = step - (steps - WHIP_OUT.length);
  const outX = k >= 0 ? -dirOut * WHIP_OUT[Math.min(k, WHIP_OUT.length - 1)] * 100 : 0;
  return <AbsoluteFill style={{transform: `translateX(${inX + outX}%)`}}>{children}</AbsoluteFill>;
};
