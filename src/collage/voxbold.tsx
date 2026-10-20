// Vox "bold" look, measured from real Vox frames (Atlas, Darkroom, Earworm, Borders; local study only —
// see 13-vox-editorial.md §9). Dark stage, saturated flat fills, labels in boxes, oversized cropped type,
// hand-drawn annotations, film grain + vignette. Original implementations; no Vox assets or logos.
import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, useVideoConfig} from 'remotion';
import {EASE} from './motion';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Colours sampled from Vox frames (k-means on 160×90 frames, local study). */
export const VOX_DARK = {
  stage: '#1c2128', // Atlas map background (slate charcoal)
  stage2: '#242a31',
  stage3: '#2d343c',
  black: '#0b0e11', // vignette / Earworm-like black
  grid: '#181818',
  white: '#F2F2F2',
  green: '#7FB08C', // region fills
  coral: '#E09897',
  ochre: '#C8934A',
  brick: '#854937',
  blue: '#6A9BD1',
  neon: '#D7DE20', // Earworm yellow-green highlight
  red: '#E2373F', // Darkroom-style caption tag red
  highlighter: '#FFF200', // vox.com brand yellow
  river: '#7FB3C9',
};

/** Dark stage: flat charcoal, optional fine grid, everything else layered on top. */
export const DarkStage: React.FC<{grid?: boolean; color?: string; children?: React.ReactNode}> = ({grid = false, color = VOX_DARK.stage, children}) => {
  const {height} = useVideoConfig();
  const cell = height * 0.055;
  return (
    <AbsoluteFill style={{background: color}}>
      {grid ? (
        <AbsoluteFill
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, rgba(255,255,255,.045) 0 1px, transparent 1px ${cell}px), repeating-linear-gradient(90deg, rgba(255,255,255,.045) 0 1px, transparent 1px ${cell}px)`,
          }}
        />
      ) : null}
      {children}
    </AbsoluteFill>
  );
};

/**
 * Film look on top of everything: per-frame grain, vignette, and an optional edge-only chromatic
 * aberration hint. Grain re-seeds every frame (footage-like), unlike collage paper boil.
 */
export const FilmLook: React.FC<{frame: number; grain?: number; vignette?: number}> = ({frame, grain = 0.09, vignette = 0.55}) => (
  <>
    <AbsoluteFill style={{mixBlendMode: 'overlay', opacity: grain, pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id={`fg-${frame % 24}`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={frame % 24} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#fg-${frame % 24})`} />
      </svg>
    </AbsoluteFill>
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(0,0,0,${vignette}) 100%)`,
      }}
    />
  </>
);

/** Reveal 0→1 over `dur` frames from `at`, eased. */
const reveal = (frame: number, at: number, dur: number) => interpolate(frame, [at, at + dur], [0, 1], {...clamp, easing: EASE.highlight});

/**
 * Label in a colour box (Atlas "Ukrainian forces" style, Darkroom red caption tag): the box wipes in
 * left→right with a slightly jagged edge, the text follows 2 frames later.
 */
export const LabelBox: React.FC<{
  frame: number;
  at: number;
  text: React.ReactNode;
  bg?: string;
  color?: string;
  font?: string;
  sizePctH?: number;
  weight?: number;
  tracking?: string;
  style?: React.CSSProperties;
}> = ({frame, at, text, bg = VOX_DARK.red, color = '#fff', font, sizePctH = 2.6, weight = 700, tracking = '0.06em', style}) => {
  const {height, fps} = useVideoConfig();
  const p = reveal(frame, at, Math.round((7 * fps) / 24));
  const t = interpolate(frame, [at + 2, at + 5], [0, 1], clamp);
  if (frame < at) return null;
  return (
    <div style={{position: 'absolute', display: 'inline-block', ...style}}>
      <div style={{position: 'absolute', inset: 0, background: bg, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`, filter: 'url(#markerEdge)'}} />
      <div
        style={{
          position: 'relative',
          padding: `${height * 0.006}px ${height * 0.012}px`,
          fontFamily: font,
          fontWeight: weight,
          fontSize: height * (sizePctH / 100),
          letterSpacing: tracking,
          color,
          opacity: t,
          whiteSpace: 'nowrap',
          lineHeight: 1.15,
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** Year in an outlined box (Atlas "2014" tag). */
export const YearBox: React.FC<{frame: number; at: number; text: string; font?: string; style?: React.CSSProperties}> = ({frame, at, text, font, style}) => {
  const {height} = useVideoConfig();
  const o = interpolate(frame, [at, at + 4], [0, 1], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        border: `${Math.max(2, height * 0.0025)}px solid rgba(242,242,242,.85)`,
        padding: `${height * 0.004}px ${height * 0.014}px`,
        fontFamily: font,
        fontWeight: 600,
        fontSize: height * 0.042,
        color: VOX_DARK.white,
        background: 'rgba(0,0,0,.25)',
        opacity: o,
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/** Red vertical bar + year + title, lower-left (Atlas chapter caption). */
export const BarCaption: React.FC<{frame: number; at: number; year: string; title: string; font?: string; style?: React.CSSProperties}> = ({
  frame,
  at,
  year,
  title,
  font,
  style,
}) => {
  const {height} = useVideoConfig();
  const bar = reveal(frame, at, 6);
  const t1 = interpolate(frame, [at + 3, at + 7], [0, 1], clamp);
  const t2 = interpolate(frame, [at + 6, at + 10], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', display: 'flex', gap: height * 0.012, alignItems: 'stretch', ...style}}>
      <div style={{width: height * 0.006, background: VOX_DARK.red, transform: `scaleY(${bar})`, transformOrigin: 'top'}} />
      <div style={{fontFamily: font, color: VOX_DARK.white, lineHeight: 1.15}}>
        <div style={{fontSize: height * 0.026, fontWeight: 500, opacity: t1}}>{year}</div>
        <div style={{fontSize: height * 0.034, fontWeight: 800, letterSpacing: '0.04em', opacity: t2}}>{title}</div>
      </div>
    </div>
  );
};

/** Oversized label that bleeds off the frame (Atlas "RUS", "INE"), slow slide while on screen. */
export const GiantLabel: React.FC<{
  frame: number;
  text: string;
  font?: string;
  sizePctH?: number;
  x: number; // % of width (left edge, may be negative)
  y: number; // % of height (top)
  drift?: number; // % of width per second
  color?: string;
  opacity?: number;
  at?: number;
}> = ({frame, text, font, sizePctH = 34, x, y, drift = -0.6, color = 'rgba(242,242,242,.92)', opacity = 1, at = 0}) => {
  const {height, fps} = useVideoConfig();
  const o = interpolate(frame, [at, at + 5], [0, opacity], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: `${x + (drift * Math.max(0, frame - at)) / fps}%`,
        top: `${y}%`,
        fontFamily: font,
        fontWeight: 900,
        fontSize: height * (sizePctH / 100),
        lineHeight: 1,
        color,
        opacity: o,
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
      }}
    >
      {text}
    </div>
  );
};

/** Rough hand-drawn path points for a circle around a box (one slightly overlapping loop). */
const roughEllipse = (cx: number, cy: number, rx: number, ry: number, seed: string, n = 40) => {
  const pts: string[] = [];
  for (let i = 0; i <= n + 4; i++) {
    const a = -Math.PI * 0.6 + (i / n) * Math.PI * 2;
    const j = 1 + (random(`${seed}${i}`) - 0.5) * 0.06 + (i > n ? 0.05 : 0);
    pts.push(`${(cx + Math.cos(a) * rx * j).toFixed(1)},${(cy + Math.sin(a) * ry * j).toFixed(1)}`);
  }
  return `M${pts.join(' L')}`;
};

/**
 * Hand-drawn annotation that draws on: 'circle' around a box, 'strike' through a box, 'underline', or 'arrow'
 * from (x1,y1) to (x2,y2). Coordinates in % of frame. Marker texture via url(#markerEdge).
 */
export const Annotate: React.FC<{
  frame: number;
  at: number;
  dur?: number;
  kind: 'circle' | 'strike' | 'underline' | 'arrow';
  box: {x: number; y: number; w: number; h: number};
  color?: string;
  widthPctH?: number;
  seed?: string;
}> = ({frame, at, dur = 10, kind, box, color = VOX_DARK.red, widthPctH = 0.6, seed = 'a'}) => {
  const {width, height} = useVideoConfig();
  const p = reveal(frame, at, dur);
  const X = (v: number) => (v / 100) * width;
  const Y = (v: number) => (v / 100) * height;
  const d = useMemo(() => {
    const x = X(box.x);
    const y = Y(box.y);
    const w = X(box.w);
    const h = Y(box.h);
    if (kind === 'circle') return roughEllipse(x + w / 2, y + h / 2, w * 0.62, h * 0.72, seed);
    if (kind === 'strike') return `M${x - w * 0.05},${y + h * 0.62} C${x + w * 0.3},${y + h * 0.48} ${x + w * 0.7},${y + h * 0.44} ${x + w * 1.05},${y + h * 0.36}`;
    if (kind === 'underline') return `M${x},${y + h * 1.05} C${x + w * 0.35},${y + h * 1.12} ${x + w * 0.7},${y + h * 1.0} ${x + w},${y + h * 1.08}`;
    return `M${x},${y} Q${x + w * 0.2},${y + h * 0.9} ${x + w},${y + h}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, box.x, box.y, box.w, box.h, width, height, seed]);
  if (frame < at) return null;
  const sw = (widthPctH / 100) * height;
  const head =
    kind === 'arrow' && p >= 1 ? (
      <path
        d={`M${X(box.x + box.w) - sw * 6},${Y(box.y + box.h) - sw * 4} L${X(box.x + box.w)},${Y(box.y + box.h)} L${X(box.x + box.w) - sw * 1.5},${Y(box.y + box.h) - sw * 7}`}
        fill="none"
        stroke={color}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ) : null;
  return (
    <svg width={width} height={height} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: 'url(#markerEdge)'}}>
      <path d={d} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
      {head}
    </svg>
  );
};

/** Brushy neon bar that wipes in behind a word (Earworm-like): striped dry-brush texture. */
export const BrushBar: React.FC<{frame: number; at: number; dur?: number; color?: string; style?: React.CSSProperties}> = ({frame, at, dur = 8, color = VOX_DARK.neon, style}) => {
  const p = reveal(frame, at, dur);
  if (frame < at) return null;
  return (
    <div style={{position: 'absolute', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`, ...style}}>
      <svg viewBox="0 0 100 20" preserveAspectRatio="none" width="100%" height="100%" style={{display: 'block', filter: 'url(#torn)'}}>
        <rect x="0" y="1" width="100" height="18" fill={color} />
        {[3, 6.5, 9.5, 13, 16].map((y, i) => (
          <path key={i} d={`M0,${y} C30,${y - 0.8} 60,${y + 0.9} 100,${y - 0.4}`} stroke="rgba(0,0,0,.14)" strokeWidth={0.35} fill="none" />
        ))}
      </svg>
    </div>
  );
};

/** Rolling counter with tabular figures (data beats). */
export const Counter: React.FC<{frame: number; at: number; dur: number; from: number; to: number; font?: string; sizePctH?: number; color?: string; suffix?: string; style?: React.CSSProperties}> = ({
  frame,
  at,
  dur,
  from,
  to,
  font,
  sizePctH = 20,
  color = VOX_DARK.white,
  suffix = '',
  style,
}) => {
  const {height} = useVideoConfig();
  const v = Math.round(interpolate(frame, [at, at + dur], [from, to], {...clamp, easing: EASE.voxCamera}));
  return (
    <div style={{position: 'absolute', fontFamily: font, fontWeight: 900, fontSize: height * (sizePctH / 100), color, fontVariantNumeric: 'tabular-nums', lineHeight: 1, ...style}}>
      {v}
      {suffix}
    </div>
  );
};
