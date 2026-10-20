// Flat paper shapes, tape, ink marks and doodles. See style/collage-motion/04-textures.md §shapes.
import React from 'react';
import {random, useVideoConfig} from 'remotion';

type Box = {x: number; y: number; w: number; h: number}; // all in % of frame

const boxStyle = (b: Box, rot = 0): React.CSSProperties => ({
  position: 'absolute',
  left: `${b.x}%`,
  top: `${b.y}%`,
  width: `${b.w}%`,
  height: `${b.h}%`,
  transform: rot ? `rotate(${rot}deg)` : undefined,
});

/**
 * Flat pastel disc / half-disc / quarter-fan / wedge. Multiply blend so paper creases show through (v01).
 * Grain is a fine noise multiplied at 8 %.
 */
export const FlatShape: React.FC<{
  kind: 'disc' | 'half' | 'quarter' | 'wedge';
  color: string;
  box: Box;
  rot?: number;
  opacity?: number;
  wedgeDeg?: number;
  style?: React.CSSProperties;
}> = ({kind, color, box, rot = 0, opacity = 0.92, wedgeDeg = 70, style}) => {
  let d = 'M50,50 m-50,0 a50,50 0 1,0 100,0 a50,50 0 1,0 -100,0';
  if (kind === 'half') d = 'M0,100 A50,50 0 0,1 100,100 Z';
  if (kind === 'quarter') d = 'M0,100 L0,0 A100,100 0 0,1 100,100 Z';
  if (kind === 'wedge') {
    const a = (wedgeDeg * Math.PI) / 180;
    d = `M50,50 L100,50 A50,50 0 ${wedgeDeg > 180 ? 1 : 0},1 ${50 + 50 * Math.cos(a)},${50 + 50 * Math.sin(a)} Z`;
  }
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{...boxStyle(box, rot), mixBlendMode: 'multiply', opacity, overflow: 'visible', ...style}}>
      <path d={d} fill={color} />
    </svg>
  );
};

/** Pink grid circle with watercolour blotches and a 2–3 px feather (v01). */
export const GridCircle: React.FC<{box: Box; fill?: string; line?: string; gridRot?: number; seed?: number; style?: React.CSSProperties}> = ({
  box,
  fill = '#ffdfd2',
  line = '#e88a7a',
  gridRot = 45,
  seed = 2,
  style,
}) => (
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{...boxStyle(box), mixBlendMode: 'multiply', overflow: 'visible', ...style}}>
    <defs>
      <pattern id={`g${seed}`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform={`rotate(${gridRot})`}>
        <path d="M7,0 L0,0 0,7" fill="none" stroke={line} strokeWidth="0.35" opacity="0.8" />
      </pattern>
      <filter id={`blot${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed={seed} />
        <feColorMatrix type="matrix" values={`0 0 0 0 0.91  0 0 0 0 0.54  0 0 0 0 0.48  1.6 0 0 0 -0.75`} />
      </filter>
      <radialGradient id={`feather${seed}`}>
        <stop offset="0.96" stopColor="#fff" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <mask id={`m${seed}`}>
        <circle cx="50" cy="50" r="50" fill={`url(#feather${seed})`} />
      </mask>
    </defs>
    <g mask={`url(#m${seed})`}>
      <rect width="100" height="100" fill={fill} />
      <rect width="100" height="100" filter={`url(#blot${seed})`} opacity="0.3" />
      <rect width="100" height="100" fill={`url(#g${seed})`} />
    </g>
  </svg>
);

/** Olive-lime tape strip with jagged short ends and a 2 px feather (v01; v04a uses translucent beige). */
export const Tape: React.FC<{x: number; y: number; w: number; h: number; rot?: number; color?: string; seed?: number}> = ({
  x,
  y,
  w,
  h,
  rot = -8,
  color = '#b8b670',
  seed = 0,
}) => {
  const jag = (side: 'l' | 'r') =>
    new Array(5)
      .fill(0)
      .map((_, i) => `${side === 'l' ? 3 * random(`t${seed}${side}${i}`) : 100 - 3 * random(`t${seed}${side}${i}`)},${(i / 4) * 100}`)
      .join(' ');
  const pts = `${jag('l').split(' ').reverse().join(' ')} ${jag('r')}`;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{...boxStyle({x, y, w, h}, rot), filter: 'blur(0.6px)'}}>
      <polygon points={pts} fill={color} opacity={0.92} />
    </svg>
  );
};

/** Jagged torn strip polygon (v07 white tear through the photo, v01 red torn strip). */
export const TornStrip: React.FC<{box: Box; rot?: number; color?: string; seed?: number; jag?: number; children?: React.ReactNode}> = ({
  box,
  rot = 0,
  color = '#f6f7e4',
  seed = 0,
  jag = 4,
  children,
}) => {
  const n = 18;
  const top = new Array(n + 1).fill(0).map((_, i) => `${(i / n) * 100},${random(`ts${seed}t${i}`) * jag}`);
  const bot = new Array(n + 1).fill(0).map((_, i) => `${100 - (i / n) * 100},${100 - random(`ts${seed}b${i}`) * jag}`);
  return (
    <div style={{...boxStyle(box, rot)}}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
        <polygon points={[...top, ...bot].join(' ')} fill={color} />
      </svg>
      <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center'}}>{children}</div>
    </div>
  );
};

/**
 * Ink line that draws on (v01 arrow grows in 2 steps; dotted arcs extend 2–3 dashes per step).
 * `points` are [x%, y%] pairs; quantise `progress` on the layer clock yourself.
 */
export const InkLine: React.FC<{
  points: Array<[number, number]>;
  progress: number; // 0..1
  color?: string;
  widthPctH?: number;
  dashed?: boolean;
  arrow?: boolean;
}> = ({points, progress, color = '#161616', widthPctH = 0.28, dashed, arrow}) => {
  const {width, height} = useVideoConfig();
  const sw = Math.max(1, (widthPctH / 100) * height);
  const px = points.map(([x, y]) => [(x / 100) * width, (y / 100) * height] as const);
  // smooth quadratic path through midpoints
  let d = `M${px[0][0]},${px[0][1]}`;
  for (let i = 1; i < px.length - 1; i++) {
    const mx = (px[i][0] + px[i + 1][0]) / 2;
    const my = (px[i][1] + px[i + 1][1]) / 2;
    d += ` Q${px[i][0]},${px[i][1]} ${mx},${my}`;
  }
  d += ` L${px[px.length - 1][0]},${px[px.length - 1][1]}`;
  const [ex, ey] = px[px.length - 1];
  const [bx, by] = px[px.length - 2] ?? px[0];
  const ang = (Math.atan2(ey - by, ex - bx) * 180) / Math.PI;
  return (
    <svg width={width} height={height} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <mask id={`reveal-${points.length}-${Math.round(px[0][0])}`}>
        <path d={d} fill="none" stroke="#fff" strokeWidth={sw * 3} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - progress} />
      </mask>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={dashed ? `${sw * 2.5} ${sw * 2.5}` : undefined}
        mask={`url(#reveal-${points.length}-${Math.round(px[0][0])})`}
      />
      {arrow && progress >= 1 ? (
        <path d={`M${-sw * 5},${-sw * 3} L0,0 L${-sw * 5},${sw * 3}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" transform={`translate(${ex} ${ey}) rotate(${ang})`} />
      ) : null}
    </svg>
  );
};

/**
 * Red pencil scribble that is fully REDRAWN every drawing (v04a: new curves every 2 frames, 3–6 strokes alive).
 * Pass `seed = drawingIndex` so it boils; pass a constant seed to freeze it.
 */
export const Scribble: React.FC<{box: Box; seed: number; color?: string; strokes?: number; widthPx?: number}> = ({
  box,
  seed,
  color = '#e74c1d',
  strokes = 4,
  widthPx = 4,
}) => {
  const paths = new Array(strokes).fill(0).map((_, s) => {
    const r = (k: string) => random(`sc-${seed}-${s}-${k}`);
    let x = 10 + r('x') * 80;
    let y = 10 + r('y') * 80;
    const pts = [`M${x.toFixed(1)},${y.toFixed(1)}`];
    const n = 4 + Math.floor(r('n') * 5);
    for (let i = 0; i < n; i++) {
      const cx = x + (r(`cx${i}`) - 0.5) * 60;
      const cy = y + (r(`cy${i}`) - 0.5) * 60;
      x = Math.min(98, Math.max(2, x + (r(`dx${i}`) - 0.5) * 50));
      y = Math.min(98, Math.max(2, y + (r(`dy${i}`) - 0.5) * 50));
      pts.push(`Q${cx.toFixed(1)},${cy.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  });
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{...boxStyle(box), overflow: 'visible', filter: 'url(#pencil)'}}>
      {paths.map((p, i) => (
        <path key={i} d={p} fill="none" stroke={color} strokeWidth={widthPx} vectorEffect="non-scaling-stroke" strokeLinecap="round" opacity={0.9} />
      ))}
    </svg>
  );
};

/** Chalky yellow asterisk (v08), pulse it with PULSE on 5s. */
export const Asterisk: React.FC<{cx: number; cy: number; sizePctW: number; scale?: number; color?: string}> = ({
  cx,
  cy,
  sizePctW,
  scale = 1,
  color = '#f9e961',
}) => {
  const {width, height} = useVideoConfig();
  const s = (sizePctW / 100) * width;
  return (
    <svg
      viewBox="-50 -50 100 100"
      width={s}
      height={s}
      style={{position: 'absolute', left: (cx / 100) * width - s / 2, top: (cy / 100) * height - s / 2, transform: `scale(${scale})`, filter: 'url(#crayon)', overflow: 'visible'}}
    >
      {[0, 60, 120].map((a) => (
        <rect key={a} x={-46} y={-7} width={92} height={14} rx={7} fill={color} transform={`rotate(${a})`} />
      ))}
    </svg>
  );
};

/** 4-point sparkle star (v01, about 3 %H). */
export const Sparkle: React.FC<{cx: number; cy: number; sizePctH?: number; color?: string}> = ({cx, cy, sizePctH = 3, color = '#161616'}) => {
  const {height, width} = useVideoConfig();
  const s = (sizePctH / 100) * height;
  return (
    <svg
      viewBox="-10 -10 20 20"
      width={s}
      height={s}
      style={{position: 'absolute', left: (cx / 100) * width - s / 2, top: (cy / 100) * height - s / 2}}
    >
      <path d="M0,-10 C1,-2 2,-1 10,0 C2,1 1,2 0,10 C-1,2 -2,1 -10,0 C-2,-1 -1,-2 0,-10Z" fill={color} />
    </svg>
  );
};

/** Black brush-marker stroke label, revealed left→right in coarse steps (v01: 3 steps of ~11 %W). */
export const MarkerLabel: React.FC<{box: Box; reveal: number; rot?: number; children: React.ReactNode}> = ({box, reveal, rot = -3, children}) => (
  <div style={{...boxStyle(box, rot), clipPath: `inset(0 ${(1 - reveal) * 100}% 0 0)`}}>
    <svg viewBox="0 0 100 20" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', filter: 'url(#torn)'}}>
      <path d="M1,4 C20,1 60,2 99,3 L98,17 C60,19 25,18 2,16 Z" fill="#111" />
    </svg>
    <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center'}}>{children}</div>
  </div>
);
