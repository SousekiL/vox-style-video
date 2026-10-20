// vox-collage kit (13-vox-editorial.md §10): everything is a PRINTED paper cut-out.
// Measured from 120 Vox thumbnails (local study): greyscale/duotone cut-out photos with visible halftone and
// grain on saturated colour fields (yellow #F5EC0C, pink-reds #EB536B/#C54C65/#A83E4C, blue #2B6A99,
// red #C11314, purple #9F38C7), headlines in yellow highlighter boxes, torn white sticker borders.
// Look checklist borrowed (ideas only) from alisa0808/vox-director (MIT): torn edges, tape, halftone,
// clippings, paper-stencil scraps, real paper shadows, one bold flat colour per beat, cut-out headlines, seal.
import React from 'react';
import {AbsoluteFill, Img, random, useVideoConfig} from 'remotion';
import {Halftone} from './materials';

/** Palette measured from Vox thumbnails + Chinese-history accents. */
export const VOX_COLLAGE = {
  yellow: '#F5EC0C',
  pink: '#EB536B',
  rose: '#C54C65',
  wine: '#A83E4C',
  blue: '#2B6A99',
  red: '#C11314',
  purple: '#9F38C7',
  ink: '#141414',
  paper: '#F7F4EC', // sticker white
  rice: '#EDE4CF', // rice-paper cream
  vermilion: '#C8352B',
};

/** Shade a hex colour (factor < 1 darkens). */
const shade = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

/**
 * Bold flat colour field with paper fibre, a halftone dot gradient sweeping in from a corner
 * (Vox-thumbnail look) and an optional big disc behind the subject.
 */
export const ColorField: React.FC<{
  color: string;
  dots?: 'tl' | 'tr' | 'bl' | 'br' | 'none';
  disc?: {x: number; y: number; r: number; color?: string};
  seed?: number;
}> = ({color, dots = 'br', disc, seed = 1}) => {
  const {width, height} = useVideoConfig();
  const pitch = height * 0.018;
  const pos = {tl: '0% 0%', tr: '100% 0%', bl: '0% 100%', br: '100% 100%', none: '50% 50%'}[dots];
  return (
    <AbsoluteFill style={{background: color}}>
      {disc ? (
        <div
          style={{
            position: 'absolute',
            left: `${disc.x}%`,
            top: `${disc.y}%`,
            width: (disc.r / 100) * height * 2,
            height: (disc.r / 100) * height * 2,
            marginLeft: -(disc.r / 100) * height,
            marginTop: -(disc.r / 100) * height,
            borderRadius: '50%',
            background: disc.color ?? shade(color, 0.82),
          }}
        />
      ) : null}
      {dots !== 'none' ? (
        <AbsoluteFill
          style={{
            backgroundImage: `radial-gradient(circle, ${shade(color, 0.7)} 34%, transparent 36%)`,
            backgroundSize: `${pitch}px ${pitch}px`,
            maskImage: `radial-gradient(ellipse 70% 80% at ${pos}, #000 0%, transparent 70%)`,
            WebkitMaskImage: `radial-gradient(ellipse 70% 80% at ${pos}, #000 0%, transparent 70%)`,
            opacity: 0.8,
          }}
        />
      ) : null}
      {/* paper fibre: low-frequency mottle + fine tooth */}
      <svg width={width} height={height} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity: 0.35}}>
        <filter id={`fibre-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves={4} seed={seed} />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  -1.2 0 0 0 1.05" />
        </filter>
        <rect width={width} height={height} filter={`url(#fibre-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

/** Entrance tables, one value per drawing on the collage clock (on 2s at 24 fps). */
export const SLAP = [1.42, 1.12, 0.96, 1.0]; // hits big, settles
export const DROP_Y = [-38, -9, 2, 0]; // % of own height, falls in from above
export const SLIDE_X = [-60, -14, 3, 0]; // % of frame width from the left

/**
 * A printed cut-out: the image's silhouette filled with paper, coarse halftone dots in ink on top,
 * grain, a torn white sticker border and a real paper shadow. `step` = drawings since the entrance began.
 */
export const PrintCutout: React.FC<{
  src: string;
  aspect: number; // width / height of the PNG
  widthPx: number;
  x: number; // % of frame (left)
  y: number; // % of frame (top)
  rot?: number;
  step: number; // drawing index since entrance (negative = hidden)
  enter?: 'slap' | 'drop' | 'slide' | 'none';
  ink?: string;
  paperColor?: string;
  pitchPctH?: number;
  halftone?: boolean;
  wobble?: number; // ±deg boil per drawing
  shadow?: boolean;
  border?: boolean;
  style?: React.CSSProperties;
}> = ({src, aspect, widthPx, x, y, rot = 0, step, enter = 'slap', ink = '#141414', paperColor = '#F2EEE4', pitchPctH = 0.62, halftone = true, wobble = 0.8, shadow = true, border = true, style}) => {
  const {height} = useVideoConfig();
  if (step < 0) return null;
  const i = Math.min(step, 3);
  const sc = enter === 'slap' ? SLAP[i] : 1;
  const dy = enter === 'drop' ? DROP_Y[i] : 0;
  const dx = enter === 'slide' ? SLIDE_X[i] : 0;
  const boil = (random(`pc-${src}-${step}`) - 0.5) * 2 * wobble;
  const h = widthPx / aspect;
  const mask = `url(${src})`;
  return (
    <div
      style={{
        position: 'absolute',
        left: `calc(${x}% + ${dx}%)`,
        top: `${y}%`,
        width: widthPx,
        height: h,
        transform: `translateY(${(dy / 100) * h}px) rotate(${rot + boil}deg) scale(${sc})`,
        filter: [border ? 'url(#stickerTorn)' : '', shadow ? `drop-shadow(0 ${height * 0.008}px ${height * 0.01}px rgba(0,0,0,.42))` : ''].join(' ') || undefined,
        ...style,
      }}
    >
      <div style={{position: 'absolute', inset: 0, maskImage: mask, WebkitMaskImage: mask, maskSize: '100% 100%', WebkitMaskSize: '100% 100%'}}>
        <div style={{position: 'absolute', inset: 0, background: paperColor}} />
      </div>
      {halftone ? (
        <Halftone pitchPctH={pitchPctH} angle={45} ink={ink} gain={10} style={{position: 'absolute', inset: 0}}>
          <Img src={src} style={{width: widthPx, height: h, display: 'block', filter: 'grayscale(1) contrast(1.35)'}} />
        </Halftone>
      ) : (
        <Img src={src} style={{position: 'absolute', inset: 0, width: widthPx, height: h, filter: 'grayscale(1) contrast(1.2)'}} />
      )}
    </div>
  );
};

export type ChipStyle = {bg: string; fg: string; font?: string; weight?: number};

/**
 * Cut-out lettering: every character on its own torn paper chip, styles cycling, each chip slapping in
 * on the collage clock (`step` = drawings since start; `perChar` drawings apart).
 */
export const CutLetters: React.FC<{
  text: string;
  step: number;
  perChar?: number;
  sizePctH: number;
  styles: ChipStyle[];
  x: number;
  y: number;
  seed?: string;
  gap?: number; // em
  rotRange?: number;
}> = ({text, step, perChar = 1, sizePctH, styles, x, y, seed = 'cl', gap = 0.06, rotRange = 7}) => {
  const {height} = useVideoConfig();
  const fs = height * (sizePctH / 100);
  const chars = [...text];
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, display: 'flex', gap: fs * gap, alignItems: 'center'}}>
      {chars.map((ch, i) => {
        const s = step - i * perChar;
        if (s < 0) return <div key={i} style={{width: fs * 1.1, height: fs * 1.2}} />;
        const st = styles[i % styles.length];
        const r = (random(`${seed}-r-${i}`) - 0.5) * 2 * rotRange;
        const oy = (random(`${seed}-y-${i}`) - 0.5) * fs * 0.18;
        const sc = SLAP[Math.min(s, 3)];
        const k = (n: number) => (random(`${seed}-p-${i}-${n}`) * 6).toFixed(1);
        const clip = `polygon(${k(1)}% ${k(2)}%, ${100 - +k(3)}% ${k(4)}%, 100% ${100 - +k(5)}%, ${k(6)}% 100%)`;
        return (
          <div
            key={i}
            style={{
              position: 'relative',
              transform: `translateY(${oy}px) rotate(${r}deg) scale(${sc})`,
              filter: `drop-shadow(0 ${height * 0.006}px ${height * 0.006}px rgba(0,0,0,.4))`,
            }}
          >
            <div style={{position: 'absolute', inset: 0, background: st.bg, clipPath: clip}} />
            <div style={{position: 'relative', padding: `${fs * 0.06}px ${fs * 0.12}px`, fontFamily: st.font, fontWeight: st.weight ?? 900, fontSize: fs, lineHeight: 1.05, color: st.fg}}>
              {ch}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export type Scrap = {kind: 'zigzag' | 'triangle' | 'dot' | 'half' | 'bar' | 'star'; x: number; y: number; size: number; rot?: number; color: string};

/** Paper-stencil scraps (zigzags, triangles, dots, half-discs, bars, starbursts) that boil on the collage clock. */
export const Scraps: React.FC<{items: Scrap[]; step: number; appearStep?: number; seed?: string}> = ({items, step, appearStep = 0, seed = 'sc'}) => {
  const {height} = useVideoConfig();
  return (
    <>
      {items.map((it, i) => {
        if (step < appearStep + Math.floor(i / 2)) return null;
        const s = (it.size / 100) * height;
        const j = (random(`${seed}-${i}-${step}`) - 0.5) * 6;
        let shape: React.ReactNode = null;
        if (it.kind === 'zigzag') shape = <polyline points="0,60 15,20 30,60 45,20 60,60 75,20 90,60" fill="none" stroke={it.color} strokeWidth={12} strokeLinejoin="miter" />;
        if (it.kind === 'triangle') shape = <polygon points="50,6 94,90 6,90" fill={it.color} />;
        if (it.kind === 'dot') shape = <circle cx={50} cy={50} r={42} fill={it.color} />;
        if (it.kind === 'half') shape = <path d="M6,70 A44,44 0 0,1 94,70 Z" fill={it.color} />;
        if (it.kind === 'bar') shape = <rect x={4} y={36} width={92} height={28} fill={it.color} />;
        if (it.kind === 'star') {
          const pts = new Array(16).fill(0).map((_, k) => {
            const a = (k / 16) * Math.PI * 2;
            const rr = k % 2 ? 22 : 46;
            return `${50 + Math.cos(a) * rr},${50 + Math.sin(a) * rr}`;
          });
          shape = <polygon points={pts.join(' ')} fill={it.color} />;
        }
        return (
          <svg
            key={i}
            viewBox="0 0 100 100"
            width={s}
            height={s}
            style={{position: 'absolute', left: `${it.x}%`, top: `${it.y}%`, transform: `rotate(${(it.rot ?? 0) + j}deg)`, filter: `drop-shadow(0 ${height * 0.004}px ${height * 0.004}px rgba(0,0,0,.35))`, overflow: 'visible'}}
          >
            {shape}
          </svg>
        );
      })}
    </>
  );
};

/** Black or yellow headline strip (Vox thumbnail headline box): tilted, heavy, with a torn chip edge. */
export const HeadlineStrip: React.FC<{text: string; step: number; sizePctH: number; x: number; y: number; bg?: string; fg?: string; rot?: number; font?: string}> = ({
  text,
  step,
  sizePctH,
  x,
  y,
  bg = VOX_COLLAGE.yellow,
  fg = VOX_COLLAGE.ink,
  rot = -3,
  font,
}) => {
  const {height} = useVideoConfig();
  if (step < 0) return null;
  const fs = height * (sizePctH / 100);
  const sc = SLAP[Math.min(step, 3)];
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, transform: `rotate(${rot}deg) scale(${sc})`, transformOrigin: '0 50%', filter: `drop-shadow(0 ${height * 0.007}px ${height * 0.008}px rgba(0,0,0,.45))`}}>
      <div style={{position: 'absolute', inset: 0, background: bg, clipPath: 'polygon(0.6% 3%, 99% 0%, 100% 94%, 1% 100%)'}} />
      <div style={{position: 'relative', padding: `${fs * 0.08}px ${fs * 0.28}px`, fontFamily: font, fontWeight: 900, fontSize: fs, lineHeight: 1.08, color: fg, whiteSpace: 'nowrap'}}>{text}</div>
    </div>
  );
};
