// Paper, grain, halftone and photo treatments. See style/collage-motion/04-textures.md.
import React, {useMemo} from 'react';
import {AbsoluteFill, random, useVideoConfig} from 'remotion';
import type {PhotoTreatment} from './tokens';

/**
 * Crumpled paper sheet: turbulence lit as a height map, multiplied onto a flat colour.
 * `seed` drives the boil: v01 re-rolls every 15 frames, v04a quiet pages every 3. Keep it constant for a still sheet.
 */
export const CrumpledPaper: React.FC<{
  color: string;
  seed?: number;
  strength?: number; // 0..1, v01 crease σ ≈ 7 grey levels → ~0.55
  style?: React.CSSProperties;
  frequency?: number;
}> = ({color, seed = 1, strength = 0.55, style, frequency = 0.012}) => {
  const id = `crumple-${seed}-${Math.round(strength * 100)}`;
  return (
    <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', ...style}} preserveAspectRatio="none">
      <filter id={id} x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves={4} seed={seed} result="h" />
        <feDiffuseLighting in="h" surfaceScale={2.2} lightingColor="#ffffff" result="lit">
          <feDistantLight azimuth={225} elevation={52} />
        </feDiffuseLighting>
        <feComponentTransfer in="lit" result="soft">
          <feFuncR type="linear" slope={strength} intercept={1 - strength} />
          <feFuncG type="linear" slope={strength} intercept={1 - strength} />
          <feFuncB type="linear" slope={strength} intercept={1 - strength} />
        </feComponentTransfer>
        <feFlood floodColor={color} result="base" />
        <feBlend in="soft" in2="base" mode="multiply" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
};

/** Flat paper with an optional ultra-faint mottle (v02/v05: σ ≤ 1 level; v07 plaster: ±4 %). */
export const FlatPaper: React.FC<{color: string; mottle?: number; seed?: number; style?: React.CSSProperties}> = ({
  color,
  mottle = 0.04,
  seed = 3,
  style,
}) => (
  <svg style={{position: 'absolute', inset: 0, width: '100%', height: '100%', ...style}} preserveAspectRatio="none">
    <filter id={`mottle-${seed}`} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency={0.006} numOctaves={3} seed={seed} result="n" />
      <feColorMatrix in="n" type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${mottle * 3} 0 0 0 ${-mottle}`} result="spots" />
      <feFlood floodColor={color} result="base" />
      <feComposite in="spots" in2="base" operator="over" />
    </filter>
    <rect width="100%" height="100%" filter={`url(#mottle-${seed})`} />
  </svg>
);

/** Graph paper: thin blue-grey lines, cell ≈ 3 %H (v01) or 1.8 %H red-on-red (v04b). */
export const GraphPaper: React.FC<{
  cellPctH?: number;
  line?: string;
  bg?: string;
  rotate?: number;
  style?: React.CSSProperties;
}> = ({cellPctH = 3, line = 'rgba(90,110,140,.38)', bg = '#e8edf4', rotate = 0, style}) => {
  const {height} = useVideoConfig();
  const c = (cellPctH / 100) * height;
  const lw = Math.max(1, height / 1080);
  return (
    <div style={{position: 'absolute', overflow: 'hidden', background: bg, ...style}}>
      <div
        style={{
          position: 'absolute',
          inset: '-50%',
          transform: `rotate(${rotate}deg)`,
          backgroundImage: `repeating-linear-gradient(0deg, ${line} 0 ${lw}px, transparent ${lw}px ${c}px), repeating-linear-gradient(90deg, ${line} 0 ${lw}px, transparent ${lw}px ${c}px)`,
        }}
      />
    </div>
  );
};

/**
 * Full-frame monochrome grain, multiplied at low opacity.
 * Pass `seed` from the SAME clock as the shot (e.g. drawingIndex at 12 fps) so grain never
 * changes between drawings. A free-running grain timer breaks the stepped cadence.
 */
export const Grain: React.FC<{seed: number; opacity?: number; blend?: React.CSSProperties['mixBlendMode']}> = ({
  seed,
  opacity = 0.08,
  blend = 'multiply',
}) => {
  const s = ((seed % 97) + 97) % 97;
  return (
    <AbsoluteFill style={{mixBlendMode: blend, opacity, pointerEvents: 'none'}}>
      <svg width="100%" height="100%">
        <filter id={`grain-${s}`}>
          <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={1} seed={s} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${s})`} />
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Film dust / scratches on top of everything (v06): ~1,500 specks, a few hair strands,
 * plate swaps on holds of 4,4,3,4 drawings. Screen-blended white.
 */
export const Dust: React.FC<{plate: number; density?: number; opacity?: number}> = ({plate, density = 1, opacity = 0.85}) => {
  const {width, height} = useVideoConfig();
  const specks = useMemo(() => {
    const n = Math.round(900 * density);
    return new Array(n).fill(0).map((_, i) => {
      const r = random(`dust-${plate}-${i}`);
      const size = r < 0.9 ? 1 + r * 2 : 3 + r * 10; // median ≈ 2 px, p90 ≈ 14 px at 720 wide
      return {x: random(`dx-${plate}-${i}`) * width, y: random(`dy-${plate}-${i}`) * height, s: (size * width) / 720, o: 0.35 + r * 0.65};
    });
  }, [plate, density, width, height]);
  const hairs = useMemo(
    () =>
      new Array(4).fill(0).map((_, i) => ({
        x: random(`hx-${plate}-${i}`) * width,
        y: random(`hy-${plate}-${i}`) * height,
        len: (20 + random(`hl-${plate}-${i}`) * 60) * (width / 720),
        rot: random(`hr-${plate}-${i}`) * 180,
      })),
    [plate, width, height],
  );
  return (
    <AbsoluteFill style={{mixBlendMode: 'screen', opacity, pointerEvents: 'none'}}>
      <svg width={width} height={height}>
        {specks.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.s / 2} fill="#fff" opacity={s.o} />
        ))}
        {hairs.map((h, i) => (
          <rect key={`h${i}`} x={h.x} y={h.y} width={h.len} height={1.2 * (width / 720)} fill="#fff" opacity={0.7} transform={`rotate(${h.rot} ${h.x} ${h.y})`} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};

/**
 * Newsprint halftone as an SVG filter: ink where luma + dotField < 1, hard threshold.
 * pitchPctH: 0.74 %H at 45° (v04a), 0.47 %H (v04b), 0.58–0.83 %H at 17–18° (v01).
 * The output is ink-coloured dots on transparent, multiplied onto whatever paper is underneath.
 */
export const Halftone: React.FC<{
  pitchPctH?: number;
  angle?: number;
  ink?: string;
  gain?: number; // threshold hardness; lower = softer dot edges
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({pitchPctH = 0.74, angle = 45, ink = '#141414', gain = 14, style, children}) => {
  const {height} = useVideoConfig();
  const p = Math.max(3, (pitchPctH / 100) * height);
  const n = parseInt(ink.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => (v / 255).toFixed(3));
  const id = `ht-${Math.round(p * 100)}-${ink.slice(1)}-${gain}`;
  const tile =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='${p}' height='${p}'><defs><radialGradient id='g' cx='0.5' cy='0.5' r='0.7071'><stop offset='0' stop-color='#000'/><stop offset='1' stop-color='#fff'/></radialGradient></defs><rect width='${p}' height='${p}' fill='url(#g)'/></svg>`,
    );
  return (
    <div style={{position: 'relative', mixBlendMode: 'multiply', ...style}}>
      <svg width={0} height={0} style={{position: 'absolute'}} aria-hidden>
        <filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" result="luma" />
          <feImage href={tile} x={0} y={0} width={p} height={p} result="dot" />
          <feTile in="dot" result="dots" />
          <feComposite in="luma" in2="dots" operator="arithmetic" k1={0} k2={gain} k3={gain} k4={0.5 - gain} result="th" />
          <feColorMatrix in="th" type="matrix" values={`0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  -1 0 0 0 1`} result="dotsInk" />
          <feComposite in="dotsInk" in2="SourceAlpha" operator="in" />
        </filter>
      </svg>
      <div style={{filter: `url(#${id})`, transform: `rotate(${angle}deg)`}}>
        <div style={{transform: `rotate(${-angle}deg)`}}>{children}</div>
      </div>
    </div>
  );
};

/** CSS filter string for a photo treatment (non-halftone kinds). */
export const treatmentFilter = (t: PhotoTreatment): string => {
  switch (t.kind) {
    case 'greyscale':
      return `grayscale(1) contrast(${t.contrast})`;
    case 'sepia':
      return `url(#sepiaWarm) contrast(0.97)`;
    case 'muted':
      return `saturate(${t.saturate}) sepia(${t.sepia}) contrast(0.95)`;
    case 'duotone':
      return t.dark === '#5a0d05' ? 'url(#duoRed)' : 'url(#duoMaroon)';
    case 'halftone':
      return 'grayscale(1)';
  }
};

export type Edge = 'clean' | 'sticker' | 'halo' | 'fringe' | 'torn';

/**
 * A photo cut-out. Default edge is CLEAN: no outline, no drop shadow (true for v01, v02, v03, v04, v06).
 * Only v08 objects (sticker) and v07 architecture (halo) carry borders; v04b adds an RGB fringe.
 */
export const Cutout: React.FC<{
  treatment?: PhotoTreatment;
  edge?: Edge;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({treatment, edge = 'clean', style, children}) => {
  const edgeFilter = edge === 'clean' ? '' : `url(#${edge})`;
  if (treatment?.kind === 'halftone') {
    return (
      <div style={{position: 'absolute', filter: edgeFilter || undefined, ...style}}>
        <Halftone pitchPctH={treatment.pitchPctH} angle={treatment.angle}>
          {children}
        </Halftone>
      </div>
    );
  }
  const f = [treatment ? treatmentFilter(treatment) : '', edgeFilter].filter(Boolean).join(' ');
  return <div style={{position: 'absolute', filter: f || undefined, ...style}}>{children}</div>;
};
