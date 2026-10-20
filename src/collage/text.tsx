// Text animation primitives. See style/collage-motion/02-typography.md.
// Rule of the style: text never tweens smoothly unless the preset is "thenNow" (v07 line reveal).
import React from 'react';
import {Easing, interpolate, random, useVideoConfig} from 'remotion';
import {charsShown, wordsShown} from './motion';
import {poseAt, type Pose} from './time';

type TextStyle = React.CSSProperties;

/** Per-glyph type-on: one glyph every `perChar` frames, no fade, no slide (v04a 2 f/char, v08 handwriting 2 f/char). */
export const TypeOn: React.FC<{text: string; frame: number; start: number; perChar?: number; style?: TextStyle}> = ({
  text,
  frame,
  start,
  perChar = 2,
  style,
}) => {
  const n = charsShown(frame, start, perChar);
  // Keep layout stable: unrevealed glyphs stay in the flow but invisible.
  return (
    <span style={{whiteSpace: 'pre-wrap', ...style}}>
      <span>{text.slice(0, n)}</span>
      <span style={{visibility: 'hidden'}}>{text.slice(n)}</span>
    </span>
  );
};

/** Word stamp: each word cuts on at full opacity every `perWord` frames (v04b: 3 f, v04a second line: 4 f). */
export const WordStamp: React.FC<{text: string; frame: number; start: number; perWord?: number; style?: TextStyle; wordStyle?: (i: number) => TextStyle}> = ({
  text,
  frame,
  start,
  perWord = 3,
  style,
  wordStyle,
}) => {
  const words = text.split(' ');
  const n = wordsShown(frame, start, perWord);
  return (
    <span style={style}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span style={{visibility: i < n ? 'visible' : 'hidden', ...(wordStyle?.(i) ?? {})}}>{w}</span>
          {i < words.length - 1 ? ' ' : ''}
        </React.Fragment>
      ))}
    </span>
  );
};

/**
 * Pose-jump caption (v01): the whole block teleports between 2–3 held poses
 * (≈2× size, then moved/cropped, then final), 5–8 frames each, no in-betweens.
 * Pose x/y are % of frame for the block's top-left; scale is relative.
 */
export const PoseJump: React.FC<{frame: number; poses: Pose[]; style?: TextStyle; children: React.ReactNode}> = ({frame, poses, style, children}) => {
  const p = poseAt(frame, poses);
  if (!p) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: `${p.x}%`,
        top: `${p.y}%`,
        transform: `scale(${p.scale ?? 1}) rotate(${p.rot ?? 0}deg)`,
        transformOrigin: '0 0',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Line reveal (v07): opacity 0→1, blur ≈10 px@1080 → 0, rise 1.9 %H, 6–8 frames ease-out; exit faster in reverse. */
export const LineReveal: React.FC<{frame: number; inAt: number; outAt?: number; style?: TextStyle; children: React.ReactNode}> = ({
  frame,
  inAt,
  outAt = Infinity,
  style,
  children,
}) => {
  const {height} = useVideoConfig();
  const k = height / 1080;
  const i = interpolate(frame, [inAt, inAt + 8], [0, 1], {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const o = interpolate(frame, [outAt, outAt + 4], [0, 1], {easing: Easing.in(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const vis = i * (1 - o);
  return (
    <div
      style={{
        opacity: vis,
        filter: `blur(${((1 - i) * 10 + o * 8) * k}px)`,
        transform: `translateY(${(1 - i) * 0.019 * height + o * 0.016 * height}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/** Scramble decode (v06): one frame of random lowercase glyphs per line, then the final string. */
export const ScrambleLine: React.FC<{text: string; frame: number; at: number; style?: TextStyle}> = ({text, frame, at, style}) => {
  const {height} = useVideoConfig();
  if (frame < at) return null;
  if (frame === at) {
    return (
      <span style={style}>
        {[...text].map((_, j) => (
          <span
            key={j}
            style={{
              position: 'relative',
              top: (random(`sy${j}${frame}`) - 0.5) * 0.02 * height,
              left: (random(`sx${j}${frame}`) - 0.5) * 0.025 * height,
            }}
          >
            {'abcdefghijklmnopqrstuvwxyz'[Math.floor(random(`sg${j}${frame}`) * 26)]}
          </span>
        ))}
      </span>
    );
  }
  return <span style={style}>{text}</span>;
};

/** "Broken" second title line (v04b): same serif, swollen/melted via the inkBleed filter. */
export const BrokenLine: React.FC<{style?: TextStyle; children: React.ReactNode}> = ({style, children}) => (
  <span style={{filter: 'url(#inkBleed)', display: 'inline-block', ...style}}>{children}</span>
);
