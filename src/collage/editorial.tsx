// Vox editorial devices (13-vox-editorial.md): evidence on screen, sourced and highlighted.
import React from 'react';
import {Img, interpolate, useVideoConfig} from 'remotion';
import {EASE} from './motion';
import {VOX} from './tokens';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/** Highlighter sweep duration in frames for `chars` characters (spec A), at the comp fps. */
export const highlightDur = (chars: number, fps: number) => {
  const f30 = Math.min(24, Math.max(8, 6 + 0.6 * chars));
  return Math.round((f30 * fps) / 30);
};

/**
 * <Mark>: yellow highlighter behind inline text.
 * Latin band covers baseline−0.10em … baseline+0.60em; CJK band covers the lower ~62 % of the em box.
 * Vertical CJK (writing-mode: vertical-rl) sweeps top → bottom and covers the column.
 */
export const Mark: React.FC<{
  frame: number;
  start: number;
  dur?: number;
  cjk?: boolean;
  vertical?: boolean;
  color?: string;
  children: React.ReactNode;
}> = ({frame, start, dur, cjk = true, vertical = false, color = VOX.highlight, children}) => {
  const {fps} = useVideoConfig();
  const text = typeof children === 'string' ? children : '';
  const d = dur ?? highlightDur(text.length || 6, fps);
  const p = interpolate(frame, [start, start + d], [0, 1], {...clamp, easing: EASE.highlight});
  const band: React.CSSProperties = vertical
    ? {left: '-0.18em', right: '-0.12em', top: '-0.2em', bottom: '-0.2em', clipPath: `inset(0 0 ${(1 - p) * 100}% 0)`}
    : cjk
      ? {left: '-0.18em', right: '-0.18em', top: '0.36em', bottom: '-0.04em', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`}
      : {left: '-0.25em', right: '-0.25em', top: '0.32em', bottom: '0.02em', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`};
  return (
    <span style={{position: 'relative', display: 'inline-block'}}>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          ...band,
          background: color,
          opacity: 0.88,
          mixBlendMode: 'multiply',
          filter: 'url(#markerEdge)',
          transform: `rotate(${vertical ? 0.3 : -0.5}deg)`,
          zIndex: 0,
        }}
      />
      <span style={{position: 'relative', zIndex: 1}}>{children}</span>
    </span>
  );
};

/** On-screen citation (spec C): 1.9 %H, bottom-left baseline 94 %H; fades in over 6 f@30 after `at`. */
export const SourceLine: React.FC<{frame: number; at: number; text: string; onDark?: boolean; top?: boolean; font?: string}> = ({
  frame,
  at,
  text,
  onDark = false,
  top = false,
  font,
}) => {
  const {height, fps} = useVideoConfig();
  const o = interpolate(frame, [at, at + Math.round((6 * fps) / 30)], [0, 1], clamp);
  return (
    <div
      style={{
        position: 'absolute',
        left: '4%',
        ...(top ? {top: '4%'} : {bottom: '4.6%'}),
        maxWidth: '64%',
        fontFamily: font,
        fontSize: height * 0.019,
        fontWeight: 400,
        letterSpacing: '0.02em',
        color: onDark ? 'rgba(242,242,242,.75)' : 'rgba(20,20,20,.7)',
        opacity: o,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

/**
 * Archival print (spec I): the photo keeps its tonality, sits in a cream border with a soft shadow,
 * rotated ±1–3°, and pushes in linearly 1.00 → 1.06 across its time on screen.
 */
export const ArchivalPrint: React.FC<{
  src: string;
  frame: number;
  dur: number;
  width: number; // px
  rot?: number;
  kenBurns?: [number, number];
  origin?: string;
  style?: React.CSSProperties;
  imgStyle?: React.CSSProperties;
}> = ({src, frame, dur, width, rot = -1.5, kenBurns = [1, 1.06], origin = '50% 50%', style, imgStyle}) => {
  const {height} = useVideoConfig();
  const kb = interpolate(frame, [0, dur], kenBurns, clamp);
  const border = height * 0.025;
  return (
    <div
      style={{
        position: 'absolute',
        padding: border,
        background: '#F3EEE2',
        boxShadow: `0 ${height * 0.006}px ${height * 0.018}px rgba(0,0,0,.35)`,
        transform: `rotate(${rot}deg)`,
        ...style,
      }}
    >
      <div style={{overflow: 'hidden', width, lineHeight: 0}}>
        <Img src={src} style={{width, display: 'block', transform: `scale(${kb})`, transformOrigin: origin, ...imgStyle}} />
      </div>
    </div>
  );
};

/**
 * Document page (spec B): paper page with a 1 px border and shadow; everything outside `focus`
 * (a rect in % of the page) dims to `dim` over 10 f@30 starting at `dimAt`, with a 2 %H feather.
 */
export const DocumentPage: React.FC<{
  frame: number;
  dimAt?: number;
  focus?: {x: number; y: number; w: number; h: number};
  dim?: number;
  width: number;
  height: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({frame, dimAt = Infinity, focus, dim = 0.65, width, height, style, children}) => {
  const {height: H, fps} = useVideoConfig();
  const d = Number.isFinite(dimAt) ? interpolate(frame, [dimAt, dimAt + Math.round((10 * fps) / 30)], [0, dim], clamp) : 0;
  const feather = H * 0.02;
  return (
    <div
      style={{
        position: 'absolute',
        width,
        height,
        background: '#FBFAF6',
        border: '1px solid rgba(0,0,0,.12)',
        boxShadow: `0 ${H * 0.008}px ${H * 0.024}px rgba(0,0,0,.28)`,
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
      {focus && d > 0 ? (
        <svg width={width} height={height} style={{position: 'absolute', inset: 0}}>
          <defs>
            <filter id="docFeather" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation={feather / 2} />
            </filter>
            <mask id="docDim">
              <rect width={width} height={height} fill="#fff" />
              <rect
                x={(focus.x / 100) * width}
                y={(focus.y / 100) * height}
                width={(focus.w / 100) * width}
                height={(focus.h / 100) * height}
                fill="#000"
                filter="url(#docFeather)"
              />
            </mask>
          </defs>
          <rect width={width} height={height} fill="#FBFAF6" opacity={d} mask="url(#docDim)" />
        </svg>
      ) : null}
    </div>
  );
};

/** Lower third (spec D): optional highlight band sweeps in, name rises 0.6 %H, title follows 4 f@30 later. */
export const LowerThird: React.FC<{frame: number; at: number; name: string; title?: string; band?: boolean; nameFont?: string; titleFont?: string}> = ({
  frame,
  at,
  name,
  title,
  band = true,
  nameFont,
  titleFont,
}) => {
  const {height, fps} = useVideoConfig();
  const f = (n: number) => Math.round((n * fps) / 30);
  const b = interpolate(frame, [at, at + f(8)], [0, 1], {...clamp, easing: EASE.highlight});
  const n = interpolate(frame, [at + f(4), at + f(10)], [0, 1], clamp);
  const t = interpolate(frame, [at + f(8), at + f(14)], [0, 1], clamp);
  return (
    <div style={{position: 'absolute', left: '5%', top: '78.5%'}}>
      <div style={{position: 'relative', display: 'inline-block', padding: `0 ${height * 0.008}px`}}>
        {band ? (
          <div style={{position: 'absolute', inset: 0, background: VOX.highlight, mixBlendMode: 'multiply', clipPath: `inset(0 ${(1 - b) * 100}% 0 0)`, filter: 'url(#markerEdge)'}} />
        ) : null}
        <div style={{position: 'relative', fontFamily: nameFont, fontWeight: 700, fontSize: height * 0.034, color: VOX.ink, opacity: n, transform: `translateY(${(1 - n) * height * 0.006}px)`}}>
          {name}
        </div>
      </div>
      {title ? (
        <div style={{fontFamily: titleFont, fontSize: height * 0.022, letterSpacing: '0.04em', color: 'rgba(20,20,20,.75)', marginTop: height * 0.008, opacity: t}}>{title}</div>
      ) : null}
    </div>
  );
};

/** Red seal stamp for Chinese pieces: square vermilion seal with white characters, lands with a spring. */
export const Seal: React.FC<{text: string; sizePx: number; scale: number; rot?: number; font?: string; style?: React.CSSProperties}> = ({
  text,
  sizePx,
  scale,
  rot = -4,
  font,
  style,
}) => (
  <div
    style={{
      position: 'absolute',
      width: sizePx,
      height: sizePx,
      background: VOX.seal,
      borderRadius: sizePx * 0.06,
      display: 'grid',
      placeItems: 'center',
      transform: `rotate(${rot}deg) scale(${scale})`,
      filter: 'url(#crayon)',
      mixBlendMode: 'multiply',
      opacity: scale > 0 ? 0.95 : 0,
      ...style,
    }}
  >
    <div style={{fontFamily: font, fontWeight: 900, fontSize: sizePx * 0.62, color: '#F7F4EE', lineHeight: 1}}>{text}</div>
  </div>
);
