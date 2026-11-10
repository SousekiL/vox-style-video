// 南京大屠杀，到底是哪一天？ (1080×1920, 24 fps, 4:30): Vox "bold" dark editorial cut to the ElevenLabs voice-over
// (vo_v4.mp3, 266.45 s). Every board starts on the second the narration reaches it (word times from faster-whisper,
// scratch words.json). Facts and sources: /mnt/project-files/nanjing-1937/口播稿_v1.md (source table rows 1–23).
// Evidence images (Commons, PD / CC) live in public/evidence/nanjing/ and stay out of git; the manifest
// data/nanjing-assets.json lists what is on disk and the film skips any picture that is missing.
// Map: the 金陵 geo layers (terrain hillshade, water, Ming wall) in data px: x = (lon−118.3)·3778, y = (32.65−lat)·4437.9.
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Annotate, CollageFilters, FilmLook, LabelBox, SfxTrack, VOX_FONT, VoxCamera, dbToGain, loadLocalFont, type CamKey, type SfxEvent} from '../collage';
import mapData from './data/nanjing-map.json';
import dotData from './data/nanjing-dots.json';
import assetData from './data/nanjing-assets.json';

const FPS = 24;
export const NANJING_DURATION = 270 * FPS;

// 思源黑体 / 思源宋体 (OFL) subset to this film's characters (scripts/fonts: nj-*.woff)
const SANS = 'NJ Sans';
loadLocalFont(SANS, 'fonts/nj-sans-Regular.woff', '400');
loadLocalFont(SANS, 'fonts/nj-sans-Bold.woff', '700');
loadLocalFont(SANS, 'fonts/nj-sans-Heavy.woff', '900');
const SERIF = loadLocalFont('NJ Serif', 'fonts/nj-serif-Black.woff', '900');
const NUM = `${VOX_FONT.sans}, '${SANS}'`;

// somber palette: charcoal stage, bone paper, one red
const P = {
  stage: '#16181b',
  stage2: '#1f2226',
  paper: '#EDE8DD',
  ink: '#16181b',
  red: '#D13A3F',
  white: '#F2F2F2',
  grey: '#8B9096',
  dim: 'rgba(242,242,242,.55)',
  river: '#5E87A3',
  hl: '#FFE14D',
};

// ---------------------------------------------------------------- assets
const ASSETS = assetData as Record<string, {file: string; aspect: number}>;
const has = (k: string) => Boolean(ASSETS[k]);
const pick = (...keys: string[]) => keys.find(has);

// ---------------------------------------------------------------- board clock
const Ctx = React.createContext({s0: 0, dur: 0});
const useB = () => {
  const f = useCurrentFrame();
  const {s0, dur} = React.useContext(Ctx);
  const {width: W, height: H} = useVideoConfig();
  const T = (s: number) => Math.round((s - s0) * FPS);
  return {f, W, H, T, dur};
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const fmt = (n: number) => n.toLocaleString('en-US');

// ---------------------------------------------------------------- building blocks
const Tag: React.FC<{at: number; text: React.ReactNode; x: number; y: number; bg?: string; color?: string; size?: number; font?: string; weight?: number}> = ({at, text, x, y, bg = P.red, color = P.white, size = 2.4, font = SANS, weight = 700}) => {
  const {f, T} = useB();
  return <LabelBox frame={f} at={T(at)} text={text} bg={bg} color={color} font={font} sizePctH={size} weight={weight} tracking="0.04em" style={{left: `${x}%`, top: `${y}%`}} />;
};

/** big type that settles in (scale 1.12 → 1) */
const Big: React.FC<{at: number; text: React.ReactNode; x: number; y: number; size: number; color?: string; font?: string; weight?: number; align?: 'left' | 'center'; out?: number; spacing?: string}> = ({at, text, x, y, size, color = P.white, font = SERIF, weight = 900, align = 'left', out, spacing = '0.02em'}) => {
  const {f, H, T} = useB();
  const p = ease((f - T(at)) / 7);
  if (f < T(at)) return null;
  const o = out !== undefined ? interpolate(f, [T(out), T(out) + 8], [1, 0], clamp) : 1;
  return (
    <div style={{position: 'absolute', left: align === 'center' ? 0 : `${x}%`, right: align === 'center' ? 0 : undefined, top: `${y}%`, textAlign: align, fontFamily: font, fontWeight: weight, fontSize: (size / 100) * H, lineHeight: 1.08, color, opacity: p * o, letterSpacing: spacing, transform: `scale(${1.12 - 0.12 * p})`, transformOrigin: align === 'center' ? '50% 50%' : '0 50%', whiteSpace: 'pre'}}>
      {text}
    </div>
  );
};

/** small plain text */
const Note: React.FC<{at: number; text: React.ReactNode; x: number; y: number; size?: number; color?: string; weight?: number; w?: number; align?: 'left' | 'center' | 'right'}> = ({at, text, x, y, size = 1.9, color = P.dim, weight = 400, w, align = 'left'}) => {
  const {f, H, T} = useB();
  const o = interpolate(f, [T(at), T(at) + 8], [0, 1], clamp);
  return <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: w ? `${w}%` : undefined, textAlign: align, fontFamily: SANS, fontWeight: weight, fontSize: (size / 100) * H, lineHeight: 1.4, color, opacity: o, whiteSpace: 'pre-line'}}>{text}</div>;
};

/** archival print: B/W, bone border, slides up 2 %H and settles */
const Print: React.FC<{name?: string; at: number; x?: number; y?: number; w?: number; rot?: number; color?: boolean; caption?: string; full?: boolean; dark?: number}> = ({name, at, x = 0, y = 0, w = 50, rot = -1.5, color = false, caption, full = false, dark = 0}) => {
  const {f, W, H, T, dur} = useB();
  if (!name || !has(name)) return null;
  const a = ASSETS[name];
  const p = ease((f - T(at)) / 9);
  if (f < T(at)) return null;
  const kb = interpolate(f, [T(at), dur], [1, 1.06], clamp);
  const filter = color ? 'saturate(.85) contrast(1.04)' : 'grayscale(1) contrast(1.1) brightness(.95)';
  if (full) {
    return (
      <AbsoluteFill style={{opacity: p, overflow: 'hidden'}}>
        <Img src={staticFile(a.file)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${kb})`, filter}} />
        <AbsoluteFill style={{background: `rgba(10,11,13,${dark})`}} />
      </AbsoluteFill>
    );
  }
  const iw = (w / 100) * W;
  const border = H * 0.012;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, padding: border, paddingBottom: caption ? H * 0.04 : border, background: '#ECE6D9', boxShadow: `0 ${H * 0.008}px ${H * 0.022}px rgba(0,0,0,.55)`, transform: `translateY(${(1 - p) * H * 0.02}px) rotate(${rot}deg)`, opacity: p}}>
      <div style={{overflow: 'hidden', width: iw, height: iw / a.aspect}}>
        <Img src={staticFile(a.file)} style={{width: '100%', height: '100%', display: 'block', transform: `scale(${kb})`, filter}} />
      </div>
      {caption ? <div style={{position: 'absolute', left: border, bottom: H * 0.009, fontFamily: SANS, fontWeight: 700, fontSize: H * 0.016, color: '#2a2a2a'}}>{caption}</div> : null}
    </div>
  );
};

type HL = {at: number; b: [number, number, number, number]}; // box in % of the page: x0 y0 x1 y1
/** document page (IMTFE judgment scan) with highlighter sweeps; `crop` shows only y0–y1 % of the page */
const Doc: React.FC<{page: string; at: number; x: number; y: number; w: number; crop?: [number, number]; marks?: HL[]; rot?: number}> = ({page, at, x, y, w, crop = [0, 100], marks = [], rot = 0}) => {
  const {f, W, H, T} = useB();
  if (!has(page)) return null;
  const a = ASSETS[page];
  const pw = (w / 100) * W;
  const ph = pw / a.aspect;
  const top = (crop[0] / 100) * ph;
  const vh = ((crop[1] - crop[0]) / 100) * ph;
  const p = ease((f - T(at)) / 9);
  if (f < T(at)) return null;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: pw, height: vh, overflow: 'hidden', background: '#FBFAF6', boxShadow: `0 ${H * 0.008}px ${H * 0.024}px rgba(0,0,0,.5)`, opacity: p, transform: `translateY(${(1 - p) * H * 0.02}px) rotate(${rot}deg)`}}>
      <div style={{position: 'absolute', left: 0, top: -top, width: pw, height: ph}}>
        {marks.map((m, i) => {
          const q = interpolate(f, [T(m.at), T(m.at) + 14], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 2)});
          if (q <= 0) return null;
          const [x0, y0, x1, y1] = m.b;
          return (
            <div key={i} style={{position: 'absolute', left: `${x0 - 0.6}%`, top: `${y0 - 0.15}%`, width: `${x1 - x0 + 1.2}%`, height: `${y1 - y0 + 0.4}%`, background: P.hl, opacity: 0.85, clipPath: `inset(0 ${(1 - q) * 100}% 0 0)`, filter: 'url(#markerEdge)'}} />
          );
        })}
        <Img src={staticFile(a.file)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', mixBlendMode: 'multiply'}} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- map
const G = mapData.G;
const LX = (lon: number) => (lon - G.W) * (G.w / (G.E - G.W));
const LY = (lat: number) => (G.N - lat) * (G.h / (G.N - G.S));
const VB = {x: 1480, y: 2050, w: 570, h: (570 * 16) / 9};
/** data px → % of frame */
const SX = (x: number) => ((x - VB.x) / VB.w) * 100;
const SY = (y: number) => ((y - VB.y) / VB.h) * 100;
const pt = (lat: number, lon: number) => ({x: LX(lon), y: LY(lat)});

const PLACES = {
  zhonghuamen: pt(32.0125, 118.7745),
  guanghuamen: pt(32.0318, 118.8135),
  zhongshanmen: pt(32.0405, 118.8255),
  yijiangmen: pt(32.0835, 118.7535),
  xiaguan: pt(32.0915, 118.7330),
  hanzhongmen: pt(32.044, 118.763),
  center: pt(32.048, 118.782),
};

const MONUMENTS: Array<{name: string; n: number; text: string; lat: number; lon: number; at: number; dx: number; dy: number; est?: boolean}> = [
  {name: '草鞋峡', n: 57000, text: '57,000余', lat: 32.11868, lon: 118.76619, at: 108.2, dx: -28, dy: -6},
  {name: '燕子矶', n: 50000, text: '50,000余', lat: 32.14953, lon: 118.81313, at: 110.92, dx: -14, dy: 6.5},
  {name: '上新河', n: 28730, text: '28,730余', lat: 32.015, lon: 118.711, at: 112.96, dx: 3, dy: -4.5, est: true},
  {name: '中山码头', n: 10000, text: '10,000以上', lat: 32.0915, lon: 118.7345, at: 115.76, dx: -24, dy: 0.6, est: true},
  {name: '江东门', n: 10000, text: '10,000余', lat: 32.035, lon: 118.744, at: 118.32, dx: -24, dy: -1.3, est: true},
  {name: '鱼雷营', n: 9000, text: '9,000余', lat: 32.111, lon: 118.76, at: 120.16, dx: -21, dy: -1.6, est: true},
  {name: '煤炭港', n: 3000, text: '3,000余', lat: 32.1035, lon: 118.7495, at: 122.08, dx: -21, dy: 0.4, est: true},
  {name: '汉中门', n: 2000, text: '2,000余', lat: 32.044, lon: 118.763, at: 123.98, dx: 2.2, dy: -1.2, est: true},
];
const R_MAX = 62; // data px for 57,000 (area ∝ count)
const rOf = (n: number) => R_MAX * Math.sqrt(n / 57000);

const ZONE = [[32.0418, 118.7843], [32.0430, 118.7630], [32.0640, 118.7600], [32.0700, 118.7700], [32.0640, 118.7800]].map(([la, lo]) => pt(la, lo));

/** the map stage: dark hillshade, water, Ming wall; `children` draw in data px on top */
const MapBase: React.FC<{wall?: number; river?: number; children?: React.ReactNode}> = ({wall = 1, river = 0, children}) => {
  const {W, H} = useB();
  const L = mapData.L as Record<string, string>;
  const Hh = mapData.H as Record<string, string>;
  const water = `rgb(${Math.round(40 + 54 * river)},${Math.round(58 + 77 * river)},${Math.round(72 + 91 * river)})`;
  return (
    <svg width={W} height={H} viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} style={{position: 'absolute', inset: 0}}>
      <rect x={VB.x - 2000} y={VB.y - 2000} width={VB.w + 4000} height={VB.h + 4000} fill={P.stage} />
      <image href={staticFile('evidence/nanjing/terrain.jpg')} x={0} y={0} width={G.w} height={G.h} preserveAspectRatio="none" style={{filter: 'grayscale(1) brightness(.27) contrast(1.25)'}} />
      <path d={L.water_area} fill={water} stroke="none" />
      <path d={L.water_lake} fill={water} fillOpacity={0.85} stroke="none" />
      {river > 0 ? <path d={L.water_area} fill="none" stroke={P.river} strokeOpacity={0.9 * river} strokeWidth={2.2} /> : null}
      {['r_秦淮河', 'r_外秦淮河', 'r_内秦淮河', 'r_护城河', 'r_金川河'].map((k) => (L[k] ? <path key={k} d={L[k]} fill="none" stroke="rgb(70,96,116)" strokeWidth={1.4} strokeLinecap="round" /> : null))}
      <path d={Hh.ming} fill="none" stroke="rgba(236,230,217,.82)" strokeWidth={2.6} strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - wall} />
      {children}
    </svg>
  );
};

/** label on the map at a data point (HTML, so it uses the subset fonts) */
const MapLabel: React.FC<{at: number; p: {x: number; y: number}; text: React.ReactNode; dx?: number; dy?: number; size?: number; bg?: string; color?: string}> = ({at, p, text, dx = 1.5, dy = -1.2, size = 1.9, bg = 'rgba(16,18,20,.82)', color = P.white}) => (
  <Tag at={at} text={text} x={SX(p.x) + dx} y={SY(p.y) + dy} size={size} bg={bg} color={color} />
);

const Arrow: React.FC<{at: number; dur?: number; from: {x: number; y: number}; to: {x: number; y: number}; color: string; bend?: number; dash?: boolean; w?: number}> = ({at, dur = 16, from, to, color, bend = 0.15, dash = false, w = 4.5}) => {
  const {f, T} = useB();
  const p = interpolate(f, [T(at), T(at) + dur], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
  if (p <= 0) return null;
  const mx = (from.x + to.x) / 2 - (to.y - from.y) * bend;
  const my = (from.y + to.y) / 2 + (to.x - from.x) * bend;
  // arrow head direction from the curve's end tangent
  const ang = Math.atan2(to.y - my, to.x - mx);
  const hl = w * 3.2;
  const head = `M${to.x - hl * Math.cos(ang - 0.5)},${to.y - hl * Math.sin(ang - 0.5)} L${to.x},${to.y} L${to.x - hl * Math.cos(ang + 0.5)},${to.y - hl * Math.sin(ang + 0.5)}`;
  return (
    <g style={{filter: 'url(#markerEdge)'}}>
      <path d={`M${from.x},${from.y} Q${mx},${my} ${to.x},${to.y}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" pathLength={1} strokeDasharray={dash ? undefined : '1 1'} strokeDashoffset={dash ? undefined : 1 - p} opacity={dash ? p : 1} style={dash ? {strokeDasharray: `${w * 2.2} ${w * 1.6}`} : undefined} />
      {p > 0.92 ? <path d={head} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" /> : null}
    </g>
  );
};

const Pulse: React.FC<{at: number; p: {x: number; y: number}; r?: number; color?: string}> = ({at, p, r = 9, color = P.red}) => {
  const {f, T} = useB();
  if (f < T(at)) return null;
  const k = (f - T(at)) % 36;
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={r} fill={color} />
      <circle cx={p.x} cy={p.y} r={r + k * 0.9} fill="none" stroke={color} strokeWidth={2} opacity={1 - k / 36} />
    </g>
  );
};

// ---------------------------------------------------------------- the boards
type Board = {from: number; to: number; src?: string; chapter?: string; C: React.FC};

/** 0 · the sirens */
const Opening: React.FC = () => {
  const {f, H, T} = useB();
  const ring = interpolate(f, [T(7.4), T(9.6)], [0, 1], clamp);
  const waves = f >= T(3.4) ? [0, 1, 2].map((i) => ((f - T(3.4) + i * 14) % 42) / 42) : [];
  return (
    <AbsoluteFill>
      <Print name="siren" at={3.3} x={8} y={51} w={52} rot={-2} caption="手摇防空警报器（示意）" />
      <svg width="100%" height="100%" style={{position: 'absolute', inset: 0}}>
        {waves.map((w, i) => (
          <circle key={i} cx="50%" cy="27%" r={H * (0.12 + w * 0.2)} fill="none" stroke={P.red} strokeWidth={H * 0.003} opacity={(1 - w) * 0.5} />
        ))}
        <circle cx="50%" cy="27%" r={H * 0.13} fill="none" stroke="rgba(242,242,242,.15)" strokeWidth={H * 0.006} />
        <circle cx="50%" cy="27%" r={H * 0.13} fill="none" stroke={P.white} strokeWidth={H * 0.006} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - ring} transform={`rotate(-90 540 ${H * 0.27})`} />
      </svg>
      <Big at={0.6} text="10:01" x={0} y={22.2} size={9.5} font={NUM} align="center" />
      <Tag at={0.98} text="每年 12月13日" x={33} y={13} size={2.6} />
      <Tag at={7.42} text="原地默哀 1 分钟" x={63} y={74} size={2.2} bg={P.paper} color={P.ink} />
      <Tag at={5.62} text="车辆鸣笛" x={63} y={68.5} size={2.2} bg="rgba(242,242,242,.14)" />
    </AbsoluteFill>
  );
};

/** 0 · tear-off calendar: 1937, 13 December, a Monday */
const Calendar1937: React.FC = () => {
  const {f, W, H, T} = useB();
  const p = ease((f - T(10.1)) / 10);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: W * 0.2, top: H * 0.2, width: W * 0.6, height: H * 0.44, background: P.paper, boxShadow: '0 20px 50px rgba(0,0,0,.6)', transform: `translateY(${(1 - p) * 40}px) rotate(-1.2deg)`, opacity: p, textAlign: 'center', color: P.ink}}>
        <div style={{background: P.red, color: P.white, fontFamily: SANS, fontWeight: 700, fontSize: H * 0.026, padding: `${H * 0.012}px 0`, letterSpacing: '0.08em', whiteSpace: 'nowrap'}}>一九三七年 · 十二月</div>
        <div style={{fontFamily: NUM, fontWeight: 800, fontSize: H * 0.2, lineHeight: 1.05, marginTop: H * 0.015}}>13</div>
        <div style={{fontFamily: SANS, fontWeight: 700, fontSize: H * 0.034, letterSpacing: '0.3em', marginTop: H * 0.005}}>星期一</div>
        <div style={{fontFamily: SANS, fontWeight: 400, fontSize: H * 0.019, color: '#555', marginTop: H * 0.012}}>民国二十六年</div>
      </div>
      <Annotate frame={f} at={T(11.2)} dur={12} kind="circle" box={{x: 34, y: 28.5, w: 32, h: 12}} color={P.red} widthPctH={0.5} seed="cal" />
    </AbsoluteFill>
  );
};

/** 一 · the fall: wall, 中华门, attack and retreat arrows, the city taken */
const Fall: React.FC = () => {
  const {f, T} = useB();
  const wall = interpolate(f, [T(15.5), T(16.8)], [0, 1], clamp);
  const fill = interpolate(f, [T(22.6), T(24.2)], [0, 0.3], clamp);
  const cam: CamKey[] = [
    {at: 0, cx: 52, cy: 55, scale: 1.05},
    {at: T(16.9), cx: 52, cy: 63, scale: 1.45},
    {at: T(18.4), cx: 52, cy: 63, scale: 1.45},
    {at: T(19.6), cx: 48, cy: 50, scale: 1.05},
  ];
  const s = (lat: number, lon: number) => pt(lat, lon);
  return (
    <AbsoluteFill>
      <VoxCamera frame={f} fps={FPS} keys={cam} drift={0.004}>
        <MapBase wall={wall}>
          <path d={(mapData.H as Record<string, string>).ming + 'Z'} fill={P.red} fillOpacity={fill} stroke="none" />
          <Arrow at={16.94} from={s(31.955, 118.772)} to={PLACES.zhonghuamen} color={P.red} bend={0.05} w={5} />
          <Arrow at={17.3} from={s(31.975, 118.835)} to={PLACES.guanghuamen} color={P.red} bend={0.1} w={4} />
          <Arrow at={17.6} from={s(32.03, 118.842)} to={PLACES.zhongshanmen} color={P.red} bend={0.05} w={4} />
          <Pulse at={16.94} p={PLACES.zhonghuamen} r={7} />
          <Arrow at={19.88} from={PLACES.center} to={PLACES.yijiangmen} color={P.white} bend={-0.1} dash w={4} />
          <Arrow at={20.3} from={PLACES.yijiangmen} to={s(32.105, 118.715)} color={P.white} bend={0.1} dash w={4} />
          <Arrow at={21.14} from={s(32.035, 118.775)} to={s(32.028, 118.712)} color={P.white} bend={0.1} dash w={4} />
        </MapBase>
        <MapLabel at={16.94} p={PLACES.zhonghuamen} text="中华门" dx={2} dy={-0.6} />
                <MapLabel at={19.9} p={pt(32.064, 118.722)} text="守军撤离（示意）" dx={0} dy={0} />
        <MapLabel at={15.6} p={pt(32.035, 118.70)} text="长江" bg="transparent" color={P.river} size={2.4} />
        <MapLabel at={15.6} p={pt(32.068, 118.79)} text="明城墙" bg="transparent" color="rgba(236,230,217,.85)" size={1.8} dx={6} />
      </VoxCamera>
      <Tag at={15.72} text="1937.12.12 夜  日军攻城" x={6} y={12} size={2.8} bg={P.paper} color={P.ink} />
      <Tag at={22.54} text="12.13 晨  日军进城" x={6} y={18} size={2.8} />
      <Big at={24.6} text="南京沦陷" x={6} y={63} size={6.2} />
      <Print name="entry_parade" at={23.6} x={50} y={9} w={42} rot={2} caption="1937.12.17 日军入城式" />
    </AbsoluteFill>
  );
};

/** 一 · a million people, more than half gone (1 icon = 1万人) */
const Population: React.FC = () => {
  const {f, W, H, T} = useB();
  const size = W * 0.074;
  return (
    <AbsoluteFill>
      <Tag at={26.7} text="沦陷前  约 100 万人" x={6} y={12} size={2.8} bg={P.paper} color={P.ink} />
      <Note at={26.9} text="1 个 = 1 万人" x={6} y={18} size={1.8} />
      {Array.from({length: 100}, (_, i) => {
        const r = Math.floor(i / 10);
        const c = i % 10;
        const appear = T(26.75) + i * 0.35;
        const gone = i >= 45; // "一半以上已经逃走"
        const leave = T(29.1) + (99 - i) * 0.6;
        const o = interpolate(f, [appear, appear + 4], [0, 1], clamp) * (gone ? interpolate(f, [leave, leave + 8], [1, 0.12], clamp) : 1);
        return (
          <svg key={i} width={size * 0.6} height={size} viewBox="0 0 20 34" style={{position: 'absolute', left: W * 0.1 + c * size * 0.82, top: H * 0.24 + r * size * 1.12, opacity: o}}>
            <circle cx={10} cy={6} r={5.2} fill={gone ? P.grey : P.white} />
            <path d="M2,34 L2,19 Q2,13 8,13 L12,13 Q18,13 18,19 L18,34 Z" fill={gone ? P.grey : P.white} />
          </svg>
        );
      })}
      <Big at={29.1} text="一半以上逃离" x={6} y={68} size={4.8} color={P.grey} />
    </AbsoluteFill>
  );
};

/** 一 · the Safety Zone committee */
const Committee: React.FC = () => (
  <AbsoluteFill>
    <Print name={pick('committee_1213', 'committee')} at={31.0} x={5} y={14} w={86} rot={-1} />
    <Tag at={31.6} text="南京安全区国际委员会部分成员 · 1937.12.13" x={6} y={9.5} size={2.0} bg={P.paper} color={P.ink} />
    <Print name={pick('shelter_jinling', 'vautrin_refugees', 'shelter_wutaishan')} at={35.4} x={48} y={50} w={44} rot={2} caption="安全区内的难民收容所" />
    <Big at={35.36} text={'外国人划出\n收容难民'} x={6} y={53} size={4.2} />
  </AbsoluteFill>
);

/** 一 · the zone on the map: 3.86 km², ≈25万人 */
const Zone: React.FC = () => {
  const {f, T} = useB();
  const p = interpolate(f, [T(39.0), T(40.2)], [0, 1], clamp);
  const zc = {x: ZONE.reduce((a, b) => a + b.x, 0) / 5, y: ZONE.reduce((a, b) => a + b.y, 0) / 5};
  const cam: CamKey[] = [{at: 0, cx: 48, cy: 50, scale: 1.05}, {at: T(40), cx: SX(zc.x), cy: SY(zc.y) + 6, scale: 2.4}];
  const n = Math.round(interpolate(f, [T(41.3), T(43.4)], [0, 25], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)}));
  return (
    <AbsoluteFill>
      <VoxCamera frame={f} fps={FPS} keys={cam} drift={0.003}>
        <MapBase>
          <path d={(mapData.H as Record<string, string>).ming + 'Z'} fill={P.red} fillOpacity={0.3} stroke="none" />
          <polygon points={ZONE.map((q) => `${q.x},${q.y}`).join(' ')} fill={P.paper} fillOpacity={0.55 * p} stroke={P.paper} strokeWidth={2} strokeDasharray="5 3" opacity={p > 0 ? 1 : 0} />
        </MapBase>
        <MapLabel at={39.6} p={zc} text="安全区（范围示意）" dx={-10} dy={-1} size={1.1} bg={P.paper} color={P.ink} />
      </VoxCamera>
      <Tag at={39.04} text="面积 约 3.86 km²" x={6} y={12} size={3} bg={P.paper} color={P.ink} />
      {f >= T(41.26) ? (
        <div style={{position: 'absolute', left: '6%', top: '58%', fontFamily: SERIF, fontWeight: 900, color: P.white, fontSize: 1920 * 0.075, lineHeight: 1}}>
          <span style={{fontFamily: NUM, fontWeight: 800}}>{n}</span>万人
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: 1920 * 0.022, marginTop: 14, color: P.dim}}>最多时挤在这里（约数）</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** 一 · the judgment: 12,000 and 20,000 */
const Judgment1: React.FC = () => (
  <AbsoluteFill>
    <Tag at={44.48} text="远东国际军事法庭判决书 · 1948" x={6} y={8} size={2.3} />
    <Doc page="imtfe_p13" at={44.3} x={9} y={13.5} w={82} crop={[30, 74]} rot={-0.6}
      marks={[{at: 46.7, b: [16.3, 35.8, 82.6, 37.2]}, {at: 47.6, b: [16.3, 38.4, 82.6, 39.8]}, {at: 48.6, b: [16.3, 41.0, 60, 42.4]}, {at: 50.92, b: [16.6, 67.1, 81.2, 68.5]}, {at: 51.8, b: [16.6, 69.7, 60, 71.1]}]} />
    <Big at={47.4} text="≥12,000" x={6} y={60} size={5.4} font={NUM} weight={800} color={P.red} />
    <Note at={47.6} text={'头两三天\n被杀的平民'} x={58} y={60.3} size={2} color={P.white} weight={700} />
    <Big at={51.4} text="≈20,000" x={6} y={68} size={5.4} font={NUM} weight={800} color={P.red} />
    <Note at={51.6} text={'第一个月\n强奸案'} x={58} y={68.3} size={2} color={P.white} weight={700} />
  </AbsoluteFill>
);

/** 一 · six weeks of fire, a third of the city */
const Judgment2: React.FC = () => {
  const {f, W, H, T} = useB();
  const cells = 30;
  return (
    <AbsoluteFill>
      <Doc page="imtfe_p14" at={53.8} x={6} y={11} w={88} crop={[20, 31]} marks={[{at: 53.94, b: [17.4, 23.6, 63.1, 25.0]}, {at: 56.2, b: [17.5, 26.2, 65.5, 27.5]}]} />
      <Tag at={54.0} text="放火烧房 持续六个星期" x={6} y={34} size={2.6} bg={P.paper} color={P.ink} />
      {Array.from({length: cells}, (_, i) => {
        const r = Math.floor(i / 6);
        const c = i % 6;
        const burnt = i % 3 === 1;
        const at = T(56.3) + i * 0.6;
        const k = burnt ? interpolate(f, [at, at + 6], [0, 1], clamp) : 0;
        const col = `rgb(${Math.round(70 + 139 * k)},${Math.round(74 - 16 * k)},${Math.round(80 - 17 * k)})`;
        return <div key={i} style={{position: 'absolute', left: W * 0.2 + c * W * 0.1, top: H * 0.4 + r * W * 0.1, width: W * 0.088, height: W * 0.088, background: col, opacity: interpolate(f, [T(54.3) + i * 0.4, T(54.3) + i * 0.4 + 5], [0, 1], clamp)}} />;
      })}
      <Big at={56.4} text="约 1/3 被毁" x={6} y={69} size={5} color={P.white} />
    </AbsoluteFill>
  );
};

/** 一 · not one day: six weeks from 13 December */
const SixWeeks: React.FC = () => {
  const {f, W, H, T} = useB();
  const cell = W * 0.118;
  const x0 = W * 0.09;
  const y0 = H * 0.27;
  const days = Array.from({length: 42}, (_, i) => {
    const d = new Date(Date.UTC(1937, 11, 13 + i));
    return {day: d.getUTCDate(), month: d.getUTCMonth()};
  });
  return (
    <AbsoluteFill>
      <Tag at={58.72} text="不是某一天" x={6} y={9} size={3} bg={P.paper} color={P.ink} />
      {['一', '二', '三', '四', '五', '六', '日'].map((d, i) => (
        <div key={d} style={{position: 'absolute', left: x0 + i * cell, top: y0 - H * 0.035, width: cell, textAlign: 'center', fontFamily: SANS, fontWeight: 700, fontSize: H * 0.017, color: P.dim}}>{d}</div>
      ))}
      {days.map((d, i) => {
        const r = Math.floor(i / 7);
        const c = i % 7;
        const lit = i === 0 ? interpolate(f, [T(58.9), T(59.3)], [0, 1], clamp) : interpolate(f, [T(61.3) + i * 1.6, T(61.3) + i * 1.6 + 5], [0, 1], clamp);
        const bg = `rgba(209,58,63,${0.12 + 0.88 * lit})`;
        return (
          <div key={i} style={{position: 'absolute', left: x0 + c * cell + 3, top: y0 + r * cell + 3, width: cell - 6, height: cell - 6, background: bg, color: lit > 0.5 ? P.white : P.dim, fontFamily: NUM, fontWeight: 700, fontSize: H * 0.02, padding: 6, boxSizing: 'border-box', opacity: interpolate(f, [T(58.6) + i * 0.15, T(58.6) + i * 0.15 + 4], [0, 1], clamp)}}>
            {d.day === 1 ? <span style={{fontFamily: SANS}}>1月</span> : d.day}
          </div>
        );
      })}
      <Note at={58.8} text="1937.12" x={9} y={19.5} size={2} color={P.white} weight={700} />
      <Big at={62.0} text="六个星期" x={6} y={67} size={7} />
      <Note at={62.3} text="1937.12.13 — 1938.1.24（东京审判判决书所说的「头六个星期」）" x={6} y={75} size={1.7} w={88} />
    </AbsoluteFill>
  );
};

/** 二 · how to count: count the bodies */
const Count: React.FC = () => {
  const {f, W, H, T} = useB();
  const p = ease((f - T(72.8)) / 10);
  const rows = ['团体', '月份', '地点', '具数'];
  return (
    <AbsoluteFill>
      <Big at={66.0} text={'没有人能\n挨家挨户统计'} x={6} y={12} size={4.4} color={P.dim} />
      <Big at={70.6} text="数尸体" x={6} y={28} size={10} />
      <Print name={pick('files_victims')} at={72.8} x={42} y={44} w={50} rot={2} caption="南京大屠杀遇难者档案（纪念馆藏）" />
      <div style={{position: 'absolute', left: W * 0.06, top: H * 0.47, width: W * 0.42, height: H * 0.26, background: P.paper, opacity: p, transform: `rotate(-1.5deg) translateY(${(1 - p) * 30}px)`, boxShadow: '0 14px 40px rgba(0,0,0,.5)', padding: H * 0.014, boxSizing: 'border-box'}}>
        <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: H * 0.026, color: P.ink, borderBottom: `2px solid ${P.ink}`, paddingBottom: 6}}>收埋记录</div>
        <div style={{display: 'flex', fontFamily: SANS, fontWeight: 700, fontSize: H * 0.014, color: '#444', marginTop: 8}}>
          {rows.map((r) => <div key={r} style={{flex: 1}}>{r}</div>)}
        </div>
        {Array.from({length: 7}, (_, i) => (
          <div key={i} style={{height: 2, background: 'rgba(0,0,0,.18)', marginTop: H * 0.022}} />
        ))}
      </div>
    </AbsoluteFill>
  );
};

/** 二 · the burial ledger as bars (孙宅巍 2021), then the part with no ledger */
const LEDGER: Array<{name: string; n: number; text: string; at: number; tone?: string}> = [
  {name: '世界红卍字会南京分会', n: 43123, text: '43,123', at: 77.68},
  {name: '崇善堂', n: 112266, text: '112,266', at: 81.48},
  {name: '中国红十字会南京分会', n: 22691, text: '22,691', at: 83.82},
  {name: '同善堂、代葬局等', n: 20000, text: '约 2 万', at: 86.0, tone: P.grey},
  {name: '市民自组掩埋队', n: 42000, text: '约 4.2 万', at: 86.92, tone: P.grey},
  {name: '伪政权收尸', n: 16000, text: '约 1.6 万', at: 88.6, tone: P.grey},
];
const Ledger: React.FC = () => {
  const {f, W, H, T} = useB();
  const x0 = W * 0.06;
  const max = 112266;
  const bw = W * 0.6;
  const y0 = H * 0.15;
  const gap = H * 0.062;
  const total = Math.round(interpolate(f, [T(91.1), T(94.4)], [0, 246000], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)}));
  const showDoc = f >= T(99.3);
  const up = interpolate(f, [T(99.3), T(100.3)], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, transform: `translateY(${-up * H * 0.3}px)`}}>
        {LEDGER.map((r, i) => {
          const p = interpolate(f, [T(r.at), T(r.at) + 14], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
          if (p <= 0) return null;
          const y = y0 + i * gap;
          return (
            <div key={r.name} style={{position: 'absolute', left: x0, top: y, opacity: Math.min(1, p * 2) * (1 - up)}}>
              <div style={{fontFamily: SANS, fontWeight: 700, fontSize: H * 0.018, color: r.tone ? P.dim : P.white, marginBottom: 6}}>{r.name}</div>
              <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
                <div style={{width: bw * (r.n / max) * p, height: H * 0.026, background: r.tone ?? P.paper}} />
                <div style={{fontFamily: NUM, fontWeight: 800, fontSize: H * 0.024, color: r.tone ? P.dim : P.white}}>{r.text}</div>
              </div>
            </div>
          );
        })}
        {f >= T(91.08) ? (
          <div style={{position: 'absolute', left: x0, top: y0 + 6 * gap + H * 0.01}}>
            <div style={{fontFamily: SANS, fontWeight: 700, fontSize: H * 0.018, color: P.dim}}>去掉重复（约 1 万）后合计</div>
            <div style={{fontFamily: NUM, fontWeight: 800, fontSize: H * 0.072, color: P.white, lineHeight: 1.1}}>
              {fmt(total)}<span style={{fontFamily: SANS, fontSize: H * 0.03}}> 余具</span>
            </div>
          </div>
        ) : null}
        {f >= T(95.72) ? (
          <div style={{position: 'absolute', left: x0, top: y0 + 7.75 * gap + H * 0.02, width: W * 0.88}}>
            <div style={{height: H * 0.026, width: `${interpolate(f, [T(95.72), T(97.2)], [0, 100], clamp)}%`, backgroundImage: `repeating-linear-gradient(90deg, ${P.red} 0 22px, transparent 22px 36px)`}} />
            <div style={{fontFamily: SANS, fontWeight: 700, fontSize: H * 0.024, color: P.red, marginTop: 10, opacity: interpolate(f, [T(96.4), T(97.2)], [0, 1], clamp)}}>焚尸 · 抛入长江 —— 没有账</div>
          </div>
        ) : null}
      </div>
      {showDoc ? <Doc page="imtfe_p16" at={99.3} x={5} y={43} w={90} crop={[42.6, 52]} marks={[{at: 99.6, b: [17, 44.1, 84, 45.5]}, {at: 100.4, b: [17, 46.7, 84, 48.1]}, {at: 101.1, b: [17, 49.3, 50, 50.6]}]} /> : null}
      {showDoc ? <Note at={99.6} text="判决书：这些数字没有计入被焚烧、被抛入长江的尸体" x={6} y={53} size={1.9} color={P.white} weight={700} w={88} /> : null}
    </AbsoluteFill>
  );
};

/** 三 · where: the monuments as proportional circles on the map, then the river */
const Monuments: React.FC = () => {
  const {f, T} = useB();
  const river = interpolate(f, [T(126.72), T(128)], [0, 1], clamp);
  const docUp = f >= T(129.3);
  const cam: CamKey[] = [
    {at: 0, cx: 50, cy: 50, scale: 1.0},
    {at: T(107.6), cx: 47, cy: 47, scale: 0.92},
    {at: T(126.5), cx: 47, cy: 47, scale: 0.95},
    {at: T(129.3), cx: 45, cy: 44, scale: 1.05},
  ];
  return (
    <AbsoluteFill>
      <VoxCamera frame={f} fps={FPS} keys={cam} drift={0.002}>
        <MapBase river={river}>
          {MONUMENTS.map((m) => {
            const p = interpolate(f, [T(m.at), T(m.at) + 10], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 3)});
            if (p <= 0) return null;
            const q = pt(m.lat, m.lon);
            const fresh = interpolate(f, [T(m.at), T(m.at) + 30], [1, 0], clamp);
            return (
              <g key={m.name}>
                <circle cx={q.x} cy={q.y} r={rOf(m.n) * p} fill={P.red} fillOpacity={0.42 + 0.3 * fresh} stroke={P.red} strokeWidth={1.6} />
                <circle cx={q.x} cy={q.y} r={2.2} fill={P.white} />
              </g>
            );
          })}
        </MapBase>
        {MONUMENTS.map((m) => (
          <MapLabel key={m.name} at={m.at + 0.15} p={pt(m.lat, m.lon)} dx={m.dx} dy={m.dy} size={1.75} text={<span>{m.name} <span style={{fontFamily: NUM, fontWeight: 800}}>{m.text}</span></span>} />
        ))}
      </VoxCamera>
      <Tag at={103.48} text="纪念碑上刻的数字" x={6} y={9} size={2.8} bg={P.paper} color={P.ink} />
      <Note at={104.4} text="圆面积 ∝ 碑文人数；带「示意」的点位为估计位置" x={6} y={14.5} size={1.6} />
      <Tag at={126.72} text="一大半在长江边" x={56} y={9} size={2.6} bg={P.river} />
      {docUp ? <AbsoluteFill style={{background: P.stage, opacity: interpolate(f, [T(129.3), T(130)], [0, 0.82], clamp)}} /> : null}
      {docUp ? (
        <>
          <Doc page="imtfe_p16" at={129.3} x={5} y={30} w={90} crop={[13.6, 17.6]} marks={[{at: 129.8, b: [17.2, 15.0, 74.7, 16.4]}]} />
          <Doc page="imtfe_p15" at={132.6} x={5} y={38} w={90} crop={[16.4, 25]} marks={[{at: 132.9, b: [14.4, 17.4, 76.7, 18.7]}, {at: 134.0, b: [14.4, 20.0, 76.7, 21.3]}, {at: 134.9, b: [14.4, 22.6, 76.7, 23.9]}]} />
          <Big at={130.4} text=">30,000" x={6} y={20} size={5.6} font={NUM} weight={800} color={P.red} />
          <Note at={130.6} text="放下武器的中国士兵" x={50} y={21.5} size={2.2} color={P.white} weight={700} />
          <Note at={133.2} text="投降后 72 小时内 · 长江边 · 机枪射杀" x={6} y={48} size={2} color={P.white} weight={700} w={88} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

/** 四 · fallback for the 1947 board: the case in three dates (D2 in the data plan) */
const CaseTimeline: React.FC = () => {
  const {f, W, H, T} = useB();
  const rows: Array<[number, string, string, string?]> = [
    [138.2, '1946.12.31', '起诉书', '屠杀总数当在 34 万人以上'],
    [139.4, '1947.3.10', '判决', '被害总数达 30 万人以上'],
    [140.6, '1947.4.26', '雨花台执行'],
  ];
  const line = interpolate(f, [T(138.0), T(141.0)], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: W * 0.1, top: H * 0.17, width: 4, height: H * 0.3 * line, background: P.red}} />
      {rows.map(([at, d, what, note], i) => {
        const o = interpolate(f, [T(at), T(at) + 8], [0, 1], clamp);
        return (
          <div key={d} style={{position: 'absolute', left: W * 0.085, top: H * (0.17 + i * 0.11), opacity: o, display: 'flex', gap: W * 0.04, alignItems: 'flex-start'}}>
            <div style={{width: W * 0.035, height: W * 0.035, borderRadius: '50%', background: P.red, marginTop: H * 0.008}} />
            <div>
              <div style={{fontFamily: NUM, fontWeight: 800, fontSize: H * 0.03, color: P.white}}>{d} <span style={{fontFamily: SANS, fontWeight: 700}}>{what}</span></div>
              {note ? <div style={{fontFamily: SANS, fontWeight: 400, fontSize: H * 0.02, color: P.dim, marginTop: 6}}>{note}</div> : null}
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

/** 五 · fallback for the 1985 board: the memorial stands on the 江东门 site */
const JiangdongmenMap: React.FC = () => {
  const {f, T} = useB();
  const jd = pt(32.035, 118.744);
  const cam: CamKey[] = [{at: 0, cx: 50, cy: 50, scale: 1.0}, {at: T(213.2), cx: SX(jd.x), cy: SY(jd.y) + 4, scale: 2.2}];
  return (
    <AbsoluteFill>
      <VoxCamera frame={f} fps={FPS} keys={cam} drift={0.002}>
        <MapBase>
          <circle cx={jd.x} cy={jd.y} r={rOf(10000)} fill={P.red} fillOpacity={0.35} stroke={P.red} strokeWidth={1.2} />
          <Pulse at={211.9} p={jd} r={4} />
        </MapBase>
        <MapLabel at={212.3} p={jd} text="江东门 · 纪念馆" dx={2} dy={-1.6} size={1.2} />
      </VoxCamera>
      <Note at={212.8} text="纪念馆建在江东门遗址上：碑文「万余人」" x={6} y={15} size={2} color={P.white} weight={700} w={88} />
    </AbsoluteFill>
  );
};

/** 四 · Nanjing tribunal 1947 */
const Tribunal1947: React.FC = () => (
  <AbsoluteFill>
    {pick('tani_trial_open', 'tani_trial_judge', 'tani_on_trial') ? (
      <Print name={pick('tani_trial_open', 'tani_trial_judge', 'tani_on_trial')} at={137.7} x={5} y={14} w={86} rot={-1} />
    ) : (
      <CaseTimeline />
    )}
    <Tag at={137.88} text="1947 · 南京 国防部审判战犯军事法庭" x={6} y={9} size={2.2} bg={P.paper} color={P.ink} />
    <Tag at={140.2} text="被告：日军第六师团师团长 谷寿夫" x={6} y={53} size={2.1} />
    <Print name={pick('tani_indictment')} at={141.0} x={56} y={56} w={36} rot={3} color caption="谷寿夫案起诉书" />
    <Note at={142.3} text="判决书：被害总数达" x={6} y={60} size={2.4} color={P.white} weight={700} />
    <Big at={142.9} text="30万人以上" x={6} y={64} size={7.6} color={P.red} />
  </AbsoluteFill>
);

/** 四 · Tokyo tribunal 1948 */
const Tribunal1948: React.FC = () => (
  <AbsoluteFill>
    {pick('imtfe_chamber', 'imtfe_judges') ? (
      <Print name={pick('imtfe_chamber', 'imtfe_judges')} at={145.8} x={5} y={14} w={86} rot={1} />
    ) : (
      <Doc page="imtfe_p12" at={145.8} x={9} y={15} w={82} crop={[6, 30]} rot={0.6} marks={[{at: 146.6, b: [36.2, 11.6, 58.5, 13.0]}]} />
    )}
    <Tag at={145.96} text="1948 · 东京 远东国际军事法庭" x={6} y={9} size={2.2} bg={P.paper} color={P.ink} />
    <Doc page="imtfe_p16" at={149.7} x={5} y={48} w={90} crop={[23.4, 32]} marks={[{at: 150.2, b: [17.1, 24.4, 84, 25.8]}, {at: 151.2, b: [17.1, 27.0, 84, 28.4]}, {at: 152.4, b: [17.1, 29.6, 83.2, 30.9]}]} />
    <Note at={149.8} text="占领头六个星期 · 南京及附近 · 平民和战俘" x={6} y={65} size={2} color={P.white} weight={700} w={88} />
    <Big at={152.8} text="超过20万" x={6} y={69} size={7.6} color={P.red} />
  </AbsoluteFill>
);

/** 四 · the two numbers don't contradict: 20万 is a floor */
const TwoNumbers: React.FC = () => {
  const {f, W, H, T} = useB();
  const base = H * 0.66;
  const unit = H * 0.0013; // px per 1,000
  const a = ease((f - T(155.6)) / 14);
  const b = ease((f - T(156.0)) / 14);
  const dash = ease((f - T(159.34)) / 18);
  const colW = W * 0.24;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: W * 0.14, top: base - 300 * unit * a, width: colW, height: 300 * unit * a, background: P.paper}} />
      <div style={{position: 'absolute', left: W * 0.56, top: base - 200 * unit * b, width: colW, height: 200 * unit * b, background: P.red}} />
      {dash > 0 ? (
        <div style={{position: 'absolute', left: W * 0.56, top: base - 200 * unit - H * 0.16 * dash, width: colW, height: H * 0.16 * dash, border: `3px dashed ${P.red}`, borderBottom: 'none', boxSizing: 'border-box', background: 'rgba(209,58,63,.08)'}} />
      ) : null}
      <div style={{position: 'absolute', left: W * 0.08, right: W * 0.08, top: base, height: 3, background: P.dim}} />
      <Big at={155.7} text="30万以上" x={13} y={21} size={3.6} />
      <Big at={156.1} text="20万以上" x={57} y={41.5} size={3.2} color={P.white} />
      <Note at={155.8} text={'南京审判\n1947'} x={14} y={67.5} size={2} color={P.white} weight={700} />
      <Note at={156.2} text={'东京审判\n1948'} x={56} y={67.5} size={2} color={P.white} weight={700} />
      <Tag at={157.32} text="只算头六个星期" x={56} y={49} size={1.9} bg={P.paper} color={P.ink} />
      <Note at={160.0} text={'未计入：\n焚尸、抛江'} x={58} y={27} size={1.9} color={P.red} weight={700} />
      <Tag at={162.76} text="最少的数" x={6} y={10} size={3.4} />
      {f >= T(165.26) ? (
        <div style={{position: 'absolute', left: W * 0.42, top: H * 0.085, padding: `${H * 0.01}px ${H * 0.02}px`, border: `${H * 0.004}px solid ${P.red}`, color: P.red, fontFamily: SERIF, fontWeight: 900, fontSize: H * 0.04, transform: `rotate(-6deg) scale(${1.4 - 0.4 * ease((f - T(166.86)) / 5)})`, opacity: ease((f - T(166.86)) / 5), filter: 'url(#crayon)'}}>日本至今没有认</div>
      ) : null}
    </AbsoluteFill>
  );
};

/** 四 · MOFA's wording (Japanese original + our translation) */
const Mofa: React.FC = () => {
  const {f, W, H, T} = useB();
  const p = ease((f - T(169.5)) / 10);
  const M: React.FC<{at: number; children: string}> = ({at, children}) => {
    const q = interpolate(f, [T(at), T(at) + 12], [0, 1], clamp);
    return (
      <span style={{position: 'relative', display: 'inline'}}>
        <span style={{backgroundImage: `linear-gradient(${P.hl}, ${P.hl})`, backgroundRepeat: 'no-repeat', backgroundSize: `${q * 100}% 62%`, backgroundPosition: '0 90%'}}>{children}</span>
      </span>
    );
  };
  return (
    <AbsoluteFill>
      <Tag at={169.66} text="日本外务省网站《历史问题 Q&A》" x={6} y={9} size={2.3} bg={P.paper} color={P.ink} />
      <div style={{position: 'absolute', left: W * 0.06, top: H * 0.15, width: W * 0.88, background: P.paper, padding: H * 0.024, boxSizing: 'border-box', opacity: p, transform: `translateY(${(1 - p) * 30}px)`, boxShadow: '0 14px 40px rgba(0,0,0,.5)', fontFamily: SERIF, fontWeight: 900, fontSize: H * 0.0225, lineHeight: 1.75, color: P.ink}}>
        日本政府としては、日本軍の南京入城（1937年）後、非戦闘員の殺害や略奪行為等があったことは<M at={171.6}>否定できない</M>と考えています。しかしながら、被害者の具体的な人数については<M at={174.6}>諸説あり</M>、政府としてどれが正しい数かを<M at={176.4}>認定することは困難</M>であると考えています。
      </div>
      <Note at={171.6} text={<>杀害非战斗人员、抢劫：<b style={{color: P.white}}>「无法否认」</b></>} x={6} y={57} size={2.6} color={P.dim} />
      <Note at={174.6} text={<>具体人数：<b style={{color: P.white}}>「诸说并存」「难以认定」</b></>} x={6} y={62.5} size={2.6} color={P.dim} />
    </AbsoluteFill>
  );
};

/** 四 · Nagoya 2012, and the exchange that hasn't come back */
const Nagoya: React.FC = () => {
  const {f, W, H, T} = useB();
  const x0 = W * 0.08;
  const x1 = W * 0.92;
  const yr = (y: number) => x0 + ((y - 2012) / (2025 - 2012)) * (x1 - x0);
  const p = interpolate(f, [T(189.62), T(192.6)], [0, 1], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 2)});
  const ty = H * 0.62;
  return (
    <AbsoluteFill>
      <Tag at={178.98} text="2012.2.20 · 名古屋市长 河村隆之" x={6} y={9} size={2.3} bg={P.paper} color={P.ink} />
      <Note at={179.4} text="会见南京市访问团时说：" x={6} y={15.5} size={2.2} color={P.white} weight={700} />
      <Big at={182.6} text={'南京事件\n「恐怕没有发生过」'} x={6} y={20} size={5.2} />
      <Note at={183.4} text="原话：いわゆる南京事件はなかったのではないか（据日本媒体报道）" x={6} y={34.5} size={1.7} w={88} />
      <Tag at={186.18} text="2.21  南京宣布暂停与名古屋的官方交流" x={6} y={42} size={2.2} />
      {f >= T(189.4) ? (
        <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
          <line x1={x0} x2={x0 + (x1 - x0) * p} y1={ty} y2={ty} stroke={P.red} strokeWidth={H * 0.006} strokeDasharray={`${H * 0.012} ${H * 0.008}`} />
          {[2012, 2015, 2018, 2021, 2025].map((y) => (
            <g key={y} opacity={yr(y) <= x0 + (x1 - x0) * p + 1 ? 1 : 0.25}>
              <line x1={yr(y)} x2={yr(y)} y1={ty - 14} y2={ty + 14} stroke={P.white} strokeWidth={3} />
              <text x={yr(y)} y={ty + 52} textAnchor="middle" fontFamily={NUM} fontWeight={700} fontSize={H * 0.019} fill={P.white}>{y}</text>
            </g>
          ))}
        </svg>
      ) : null}
      <Note at={190.4} text="两市官方往来：至 2025 年仍未恢复" x={6} y={67} size={2.2} color={P.white} weight={700} />
    </AbsoluteFill>
  );
};

/** 五 · the name of the memorial */
const MemorialName: React.FC = () => {
  const {f, H, T} = useB();
  const strike = f >= T(200.8);
  return (
    <AbsoluteFill>
      <Print name={pick('memorial_entrance', 'victims_300000')} at={193.9} full dark={0.62} />
      <Tag at={194.16} text="我在南京生活了很多年" x={6} y={9} size={2.3} bg={P.paper} color={P.ink} />
      <Big at={196.6} text="“南京大屠杀纪念馆”" x={6} y={22} size={4.6} color={strike ? P.grey : P.white} />
      <Annotate frame={f} at={T(200.8)} dur={10} kind="strike" box={{x: 6, y: 22.5, w: 82, h: 4.5}} color={P.red} widthPctH={0.55} seed="name" />
      <Note at={202.3} text="全名" x={6} y={34} size={2.2} color={P.dim} weight={700} />
      <div style={{position: 'absolute', left: '6%', top: '37.5%', fontFamily: SERIF, fontWeight: 900, fontSize: H * 0.05, lineHeight: 1.25, color: P.white, opacity: interpolate(f, [T(202.6), T(203.4)], [0, 1], clamp)}}>
        侵华日军南京大屠杀
        <br />
        <span style={{backgroundImage: `linear-gradient(${P.red}, ${P.red})`, backgroundRepeat: 'no-repeat', backgroundSize: `${interpolate(f, [T(207.5), T(208.4)], [0, 100], clamp)}% 40%`, backgroundPosition: '0 92%'}}>遇难同胞</span>纪念馆
      </div>
      <Big at={208.4} text={'纪念的是同胞\n不是屠杀'} x={6} y={58} size={4.4} />
    </AbsoluteFill>
  );
};

/** 五 · the wall of names: 10,665 of 300,000, and the one */
const Wall: React.FC = () => {
  const {f, W, H, T} = useB();
  const D = dotData as {size: number; N: number; S: number; one: [number, number]; off: number; win: {r0: number; c0: number; rows: string[]}};
  const side = W * 0.8;
  const left = W * 0.1;
  const top = H * 0.25;
  const k = side / D.size;
  const one = {x: left + D.one[0] * k, y: top + D.one[1] * k};
  const gridIn = interpolate(f, [T(218.3), T(219.2)], [0, 1], clamp);
  const lit = interpolate(f, [T(219.0), T(222.5)], [0, 1], clamp);
  const n = Math.round(interpolate(f, [T(219.0), T(222.5)], [0, 10665], {...clamp, easing: (t) => 1 - Math.pow(1 - t, 2)}));
  const zoom = interpolate(f, [T(231.8), T(234.2)], [1, 22], {...clamp, easing: (t) => t * t * (3 - 2 * t)});
  const camCx = interpolate(zoom, [1, 22], [50, (one.x / W) * 100]);
  const camCy = interpolate(zoom, [1, 22], [50, (one.y / H) * 100]);
  const fine = interpolate(zoom, [4, 9], [0, 1], clamp);
  const R = (D.win.rows.length - 1) / 2;
  const sp = D.S * k;
  const photo = f < T(218.3);
  return (
    <AbsoluteFill>
      {photo && pick('victims_number', 'victims_300000', 'memorial_entrance') ? <Print name={pick('victims_number', 'victims_300000', 'memorial_entrance')} at={211.7} x={5} y={18} w={86} rot={-1} /> : null}
      {photo && !pick('victims_number', 'victims_300000', 'memorial_entrance') ? <JiangdongmenMap /> : null}
      {photo ? <Tag at={211.82} text="1985 · 江东门  纪念馆建成" x={6} y={9} size={2.4} bg={P.paper} color={P.ink} /> : null}
      {photo ? <Tag at={214.54} text="“哭墙”：一个一个刻着遇难者的名字" x={6} y={62} size={2.2} /> : null}
      {!photo ? (
        <AbsoluteFill style={{transformOrigin: '0 0', transform: `translate(${50 - zoom * camCx}%, ${50 - zoom * camCy}%) scale(${zoom})`}}>
          <Img src={staticFile('evidence/nanjing/dots_dim.png')} style={{position: 'absolute', left, top, width: side, height: side, opacity: gridIn * (1 - fine), imageRendering: 'pixelated'}} />
          <Img src={staticFile('evidence/nanjing/dots_lit.png')} style={{position: 'absolute', left, top, width: side, height: side, opacity: lit * (1 - fine), filter: 'drop-shadow(0 0 1.2px rgba(255,250,235,.9))', clipPath: `inset(0 0 ${(1 - lit) * 100}% 0)`, imageRendering: 'pixelated'}} />
          {fine > 0 ? (
            <svg width={W} height={H} style={{position: 'absolute', inset: 0, opacity: fine}}>
              {D.win.rows.map((row, r) =>
                row.split('').map((ch, c) => (
                  <circle key={`${r}-${c}`} cx={one.x + (c - R) * sp} cy={one.y + (r - R) * sp} r={sp * 0.32} fill={ch === '1' ? '#F2ECE0' : 'rgba(150,150,150,.6)'} />
                )),
              )}
              <circle cx={one.x} cy={one.y} r={sp * 0.32} fill={P.red} />
              <circle cx={one.x} cy={one.y} r={sp * 0.72} fill="none" stroke={P.red} strokeWidth={sp * 0.08} />
            </svg>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {!photo && zoom < 2 ? (
        <>
          <Tag at={218.3} text="1 个点 = 1 位遇难者 · 共 300,000" x={6} y={9} size={2.2} bg={P.paper} color={P.ink} />
          <div style={{position: 'absolute', left: '6%', top: '15.5%', fontFamily: NUM, fontWeight: 800, fontSize: H * 0.04, color: P.white}}>
            {fmt(n)} <span style={{fontFamily: SANS, fontWeight: 700, fontSize: H * 0.02}}>个名字刻在墙上（2026.4）</span>
          </div>
          <Big at={222.6} text="≈3.55%" x={6} y={19.6} size={3.2} font={NUM} weight={800} color={P.red} />
          <Note at={224.72} text="剩下的，大多数连名字都没有留下" x={6} y={70.5} size={2.1} color={P.dim} weight={700} />
        </>
      ) : null}
      {zoom > 6 ? <div style={{position: 'absolute', left: 0, right: 0, top: '64%', height: '12%', background: 'rgba(22,24,27,.88)'}} /> : null}
      {zoom > 6 ? <Big at={233.0} text="三十万分之一" x={0} y={66.5} size={5.2} align="center" color={P.white} /> : null}
    </AbsoluteFill>
  );
};

/** 五 · living survivors */
const SURV: Array<[number, number, string?]> = [
  [1985, 1756, '1,756'], [1997, 1200, '1,200余'], [2006, 400, '约400'], [2016.95, 107, '107'], [2017.9, 97], [2021.6, 64], [2023.5, 39], [2024.95, 32], [2025.2, 28], [2025.85, 24], [2026.05, 22], [2026.3, 21], [2026.8, 20, '20'],
];
const Survivors: React.FC = () => {
  const {f, W, H, T} = useB();
  const x0 = W * 0.1;
  const x1 = W * 0.9;
  const y0 = H * 0.66;
  const y1 = H * 0.24;
  const X = (y: number) => x0 + ((y - 1984) / (2027 - 1984)) * (x1 - x0);
  const Y = (v: number) => y0 - (v / 1800) * (y0 - y1);
  // the line reaches each year as the voice says it
  const reach = interpolate(f, [T(237.6), T(240.6), T(242.72), T(244.4), T(245.3), T(248.0)], [1984, 1985, 1985, 2016.95, 2016.95, 2026.8], clamp);
  const pts = SURV.filter((s) => s[0] <= reach + 0.001);
  const d = pts.map((s, i) => `${i ? 'L' : 'M'}${X(s[0])},${Y(s[1])}`).join(' ');
  const blink = f >= T(249.5) ? 0.55 + 0.45 * Math.cos(((f - T(249.5)) / 24) * Math.PI * 2) : 1;
  return (
    <AbsoluteFill>
      <Tag at={237.58} text="登记在册的幸存者" x={6} y={9} size={2.6} bg={P.paper} color={P.ink} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        <line x1={x0} x2={x1} y1={y0} y2={y0} stroke={P.dim} strokeWidth={2} />
        {[1985, 1995, 2005, 2015, 2026].map((y) => (
          <text key={y} x={X(y)} y={y0 + H * 0.028} textAnchor="middle" fontFamily={NUM} fontWeight={600} fontSize={H * 0.016} fill={P.dim}>{y === 1985 ? '80年代' : y}</text>
        ))}
        <path d={d} fill="none" stroke={P.white} strokeWidth={H * 0.003} strokeLinejoin="round" />
        {pts.map((s) => (
          <g key={s[0]} opacity={s[1] === 20 ? blink : 1}>
            <circle cx={X(s[0])} cy={Y(s[1])} r={s[2] ? H * 0.006 : H * 0.0035} fill={s[1] === 20 ? P.red : P.white} />
            {s[2] && s[1] > 100 ? <text x={X(s[0]) + H * 0.012} y={Y(s[1]) - H * 0.012} fontFamily={NUM} fontWeight={800} fontSize={H * 0.024} fill={P.white}>{s[2]}</text> : null}
          </g>
        ))}
      </svg>
      {reach >= 2026.7 ? (
        <div style={{position: 'absolute', right: '8%', top: '14%', textAlign: 'right', fontFamily: NUM, fontWeight: 800, color: P.red, fontSize: H * 0.11, lineHeight: 1, opacity: blink}}>
          20
          <div style={{fontFamily: SANS, fontWeight: 700, fontSize: H * 0.022, color: P.white}}>2026 年 10 月</div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

/** 尾声 · the city, the siren again */
const Ending: React.FC = () => {
  const {f, W, H, T} = useB();
  const waves = f >= T(255.6) ? [0, 1, 2, 3].map((i) => ((f - T(255.6) + i * 12) % 48) / 48) : [];
  const endO = interpolate(f, [T(263.9), T(264.6)], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <Print name={pick('skyline')} at={252.5} full dark={0.5} />
      <Big at={252.74} text="生生不息" x={6} y={12} size={6} />
      <svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
        {waves.map((w, i) => (
          <circle key={i} cx={W / 2} cy={H * 0.45} r={H * (0.08 + w * 0.3)} fill="none" stroke={P.red} strokeWidth={H * 0.003} opacity={(1 - w) * 0.6} />
        ))}
      </svg>
      <Big at={255.52} text="12·13  10:01" x={0} y={42} size={6.4} font={NUM} weight={800} align="center" />
      <div style={{position: 'absolute', left: 0, right: 0, top: '58%', textAlign: 'center', opacity: endO, fontFamily: SERIF, fontWeight: 900, fontSize: H * 0.04, color: P.white, lineHeight: 1.5}}>
        这段历史
        <br />
        我们会一直记着
      </div>
      <Credit at={265.0} />
    </AbsoluteFill>
  );
};

const Credit: React.FC<{at: number}> = ({at}) => {
  const {f, H, W, T} = useB();
  const o = interpolate(f, [T(at), T(at) + 14], [0, 1], clamp);
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: '74%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: H * 0.01, opacity: o}}>
      <div style={{display: 'flex', alignItems: 'center', gap: W * 0.02}}>
        <span style={{fontFamily: SANS, fontWeight: 700, fontSize: H * 0.02, color: P.white}}>制作</span>
        <Img src={staticFile('brand/zeno-mark-dark.svg')} style={{width: H * 0.03, height: H * 0.03}} />
        <span style={{fontFamily: NUM, fontWeight: 600, fontSize: H * 0.02, color: P.white}}>zeno.yczc</span>
      </div>
      <span style={{fontFamily: SANS, fontWeight: 400, fontSize: H * 0.016, color: P.dim}}>资料来源见正文</span>
    </div>
  );
};

const BOARDS: Board[] = [
  {from: 0, to: 10.0, C: Opening, src: '南京每年 12 月 13 日 10:01 鸣防空警报（南京市通告）；图：Wikimedia Commons, CC0'},
  {from: 10.0, to: 15.4, C: Calendar1937},
  {from: 15.4, to: 26.4, chapter: '一 · 时间', C: Fall, src: '据远东国际军事法庭判决书（1948）；行军箭头为示意；图：1937.12.17 入城式（公有领域）'},
  {from: 26.4, to: 30.9, chapter: '一 · 时间', C: Population, src: '据远东国际军事法庭判决书：约 100 万居民过半逃离'},
  {from: 30.9, to: 38.8, chapter: '一 · 时间', C: Committee, src: '图：Wikimedia Commons（公有领域）'},
  {from: 38.8, to: 44.2, chapter: '一 · 时间', C: Zone, src: '面积、人数为报道中的约数；范围为示意'},
  {from: 44.2, to: 53.7, chapter: '一 · 时间', C: Judgment1, src: '远东国际军事法庭判决书第八章，原书第 1012 页'},
  {from: 53.7, to: 58.5, chapter: '一 · 时间', C: Judgment2, src: '远东国际军事法庭判决书，原书第 1013 页'},
  {from: 58.5, to: 65.6, chapter: '一 · 时间', C: SixWeeks, src: '据远东国际军事法庭判决书 “the first six weeks”'},
  {from: 65.6, to: 77.4, chapter: '二 · 怎么数', C: Count, src: '战后收埋记录，原件藏中国第二历史档案馆、南京市档案馆'},
  {from: 77.4, to: 103.2, chapter: '二 · 怎么数', C: Ledger, src: '数据：孙宅巍（2021）对收埋记录的整理；判决书原书第 1015 页'},
  {from: 103.2, to: 137.6, chapter: '三 · 在哪里', C: Monuments, src: '碑文：南京大屠杀遗址纪念碑；判决书原书第 1014–1015 页；底图：地形与水系据开放数据'},
  {from: 137.6, to: 145.7, chapter: '四 · 两个法庭', C: Tribunal1947, src: `谷寿夫案起诉书（1946.12.31）、判决（1947.3.10）${pick('tani_trial_open', 'tani_trial_judge', 'tani_on_trial') ? '；图：Wikimedia Commons（公有领域）' : ''}`},
  {from: 145.7, to: 155.5, chapter: '四 · 两个法庭', C: Tribunal1948, src: `远东国际军事法庭判决书，原书第 ${pick('imtfe_chamber', 'imtfe_judges') ? '1015 页；图：Wikimedia Commons（公有领域）' : '1011、1015 页'}`},
  {from: 155.5, to: 169.4, chapter: '四 · 两个法庭', C: TwoNumbers, src: '两个法庭的判决书'},
  {from: 169.4, to: 178.7, chapter: '四 · 两个法庭', C: Mofa, src: '日本外务省网站《历史问题 Q&A》；中文为本片翻译'},
  {from: 178.7, to: 193.8, chapter: '四 · 两个法庭', C: Nagoya, src: '读卖新闻 2012.2.22；新浪 2012.2.21；2025 年 8 月报道'},
  {from: 193.8, to: 211.6, chapter: '五 · 名字', C: MemorialName, src: pick('memorial_entrance', 'victims_300000') ? '图：Wikimedia Commons（CC BY-SA）' : undefined},
  {from: 211.6, to: 237.3, chapter: '五 · 名字', C: Wall, src: '哭墙名字数：新华社 2026.4.3；点阵为示意，亮点随机分布；江东门遗址碑文'},
  {from: 237.3, to: 252.4, chapter: '五 · 名字', C: Survivors, src: '南京大屠杀幸存者援助协会登记数，经新华社、新京报（2026.10.20）等报道；1997、2006 年为约数'},
  {from: 252.4, to: 270, C: Ending, src: pick('skyline') ? '图：南京新街口，Wikimedia Commons（CC BY-SA 4.0）' : undefined},
];

// ---------------------------------------------------------------- subtitles (script text, voice timing)
const SUBS: Array<[number, number, string]> = [
  [0.0, 3.3, '每年12月13日上午10点01分，'], [3.4, 5.5, '南京会拉响防空警报。'], [5.62, 7.3, '路上的车停下来鸣笛，'], [7.42, 9.6, '走路的人原地站一分钟。'],
  [10.24, 12.2, '1937年的这一天，'], [12.48, 14.8, '南京城里发生了什么？'],
  [15.72, 18.4, '前一天夜里，日军攻打中华门。'], [18.62, 22.3, '守城的中国军队，大部分从北面和西面撤走了。'], [22.54, 25.9, '13日早上，日军进城，南京沦陷。'],
  [26.7, 29.0, '沦陷之前，南京有一百来万人，'], [29.04, 30.9, '一半以上已经逃走。'], [31.06, 35.25, '留下来的人，很多挤进了城西北一片叫“安全区”的街区。'], [35.36, 38.9, '这是留在南京的一些外国人划出来收容难民的地方，'], [39.04, 41.15, '面积大概3.86平方公里，'], [41.26, 44.0, '最多的时候，挤了二十五万人左右。'],
  [44.48, 46.5, '东京审判的判决书里写：'], [46.68, 50.7, '进城头两三天，至少一万两千名平民被杀；'], [50.92, 53.8, '第一个月，强奸案大约两万起；'], [53.94, 56.1, '放火烧房持续了六个星期，'], [56.2, 58.3, '全城大约三分之一被毁。'],
  [58.72, 61.2, '南京大屠杀不是某一天，'], [61.3, 65.0, '而是从12月13日开始，惨烈的六个星期。'],
  [65.96, 69.75, '那时的南京，没有人能挨家挨户统计死了多少人。'], [69.86, 72.6, '战后用的办法很朴素：数尸体。'], [72.8, 77.2, '哪个团体埋的，埋了多少，都记了账，这叫“收埋记录”。'],
  [77.68, 81.3, '世界红卍字会南京分会，记了四万三千多具；'], [81.48, 83.7, '崇善堂，十一万两千多具；'], [83.82, 86.9, '中国红十字会南京分会，两万两千多具。'], [86.92, 90.95, '再加上市民自己组织的掩埋队和伪政府的收尸，'], [91.08, 95.3, '研究者去掉重复的，算出来是二十四万六千多具。'],
  [95.72, 99.3, '被烧掉的、被扔进长江的，账上都没有。'], [99.5, 102.6, '东京审判的判决书专门写明了这一点。'],
  [103.48, 108.0, '后来，南京城里城外立了一圈纪念碑，碑上刻着数字：'], [108.2, 110.7, '草鞋峡，五万七千余人。'], [110.92, 112.8, '燕子矶，五万余人。'], [112.96, 115.65, '上新河，两万八千七百三十余人。'], [115.76, 118.2, '中山码头，万人以上。'], [118.32, 119.95, '江东门，万余人。'], [120.16, 121.95, '鱼雷营，九千余人。'], [122.08, 123.85, '煤炭港，三千余人。'], [123.98, 125.9, '汉中门，两千余人。'],
  [126.72, 129.2, '这些地名，一大半在长江边上。'], [129.34, 132.6, '判决书里写，三万多名放下武器的中国士兵，'], [132.72, 136.9, '投降后七十二小时内，在江边被机枪成批射杀。'],
  [137.88, 142.2, '1947年，南京的军事法庭审判日军师团长谷寿夫，'], [142.3, 145.8, '判决书写：被害总数达三十万人以上。'], [145.96, 149.65, '1948年，东京的远东国际军事法庭写的是：'], [149.7, 155.2, '占领头六个星期，南京及附近被杀的平民和战俘，超过二十万。'],
  [155.78, 157.2, '这两个数并不矛盾。'], [157.32, 159.25, '东京只算了头六个星期，'], [159.34, 162.6, '被烧成灰的、被扔进长江的，也没算进去。'], [162.76, 165.1, '二十万，是一个最少的数。'], [165.26, 168.9, '就是这样一个最少的数，日本到今天也没有认。'],
  [169.66, 171.45, '日本政府现在的说法是：'], [171.52, 174.5, '杀害非战斗人员、抢劫，“无法否认”；'], [174.52, 178.3, '杀了多少人，“诸说并存”，“难以认定”。'],
  [178.98, 181.45, '2012年，名古屋市长河村隆之'], [181.48, 186.0, '当着南京来访的客人说，南京事件“恐怕没有发生过”。'], [186.18, 189.5, '第二天，南京宣布暂停和名古屋的官方交流。'], [189.62, 193.2, '到去年，两座城市的官方往来还未恢复。'],
  [194.16, 196.1, '我在南京生活了很多年。'], [196.2, 200.6, '常听外地来的朋友图省事，说想去参观“南京大屠杀纪念馆”。'], [200.8, 202.2, '每次我都会多说一句：'], [202.26, 207.3, '它的全名是“侵华日军南京大屠杀遇难同胞纪念馆”。'], [207.5, 211.0, '我们纪念的，是遇难的同胞，不是那场屠杀。'],
  [211.82, 214.4, '纪念馆1985年在江东门建成。'], [214.54, 218.2, '馆里有一面“哭墙”，一个一个刻着遇难者的名字。'], [218.3, 224.6, '到今年四月，刻了一万零六百六十五个，大概是三十万的百分之三点五。'], [224.72, 227.5, '剩下的，大多数连名字都没有留下。'], [227.6, 232.1, '哭墙上的名字，大多是遇难者的家人和幸存者报出来的。'], [232.34, 236.6, '记得他们名字的人，很多也成了这三十万分之一。'],
  [237.58, 242.6, '上世纪八十年代，南京第一次统计幸存者，有1756位。'], [242.72, 245.2, '2016年底，还有107位。'], [245.34, 248.9, '到今年10月，登记在册的，只剩20位。'], [249.5, 251.9, '这个数字，还会越来越小。'],
  [252.74, 255.4, '可南京这座城，生生不息。'], [255.52, 259.55, '今年12月13日，10点01分，警报还会再响。'], [259.62, 263.2, '听见它的人，会一年比一年多。'],
];
const Subtitle: React.FC<{frame: number}> = ({frame}) => {
  const {width: W, height: H} = useVideoConfig();
  const t = frame / FPS;
  const cue = SUBS.find(([a, b]) => t >= a - 0.05 && t < b);
  if (!cue) return null;
  const o = Math.min(1, (t - cue[0] + 0.05) * 10, (cue[1] - t) * 10);
  return (
    <div style={{position: 'absolute', left: W * 0.07, right: W * 0.07, top: H * 0.815, textAlign: 'center', opacity: o}}>
      <span style={{fontFamily: SANS, fontWeight: 700, fontSize: H * 0.0235, lineHeight: 1.55, color: P.white, background: 'rgba(8,9,10,.66)', padding: `${H * 0.003}px ${W * 0.018}px`, boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone'}}>{cue[2]}</span>
    </div>
  );
};

// ---------------------------------------------------------------- chrome: chapter, brand, source
const Chrome: React.FC<{frame: number}> = ({frame}) => {
  const {width: W, height: H} = useVideoConfig();
  const t = frame / FPS;
  const b = BOARDS.find((x) => t >= x.from && t < x.to) ?? BOARDS[BOARDS.length - 1];
  const local = frame - Math.round(b.from * FPS);
  const so = interpolate(local, [6, 14], [0, 1], clamp);
  return (
    <>
      {b.chapter ? (
        <div style={{position: 'absolute', left: W * 0.06, top: H * 0.035, display: 'flex', alignItems: 'center', gap: W * 0.016}}>
          <div style={{width: H * 0.005, height: H * 0.026, background: P.red}} />
          <span style={{fontFamily: SANS, fontWeight: 700, fontSize: H * 0.019, color: P.white, letterSpacing: '0.12em'}}>{b.chapter}</span>
        </div>
      ) : null}
      <div style={{position: 'absolute', right: W * 0.06, top: H * 0.035, fontFamily: SERIF, fontWeight: 900, fontSize: H * 0.019, color: 'rgba(242,242,242,.8)', letterSpacing: '0.12em', lineHeight: `${H * 0.026}px`}}>一尺之棰</div>
      {b.src ? (
        <div style={{position: 'absolute', left: W * 0.06, bottom: H * 0.035, maxWidth: W * 0.66, fontFamily: SANS, fontWeight: 400, fontSize: W * 0.021, lineHeight: 1.35, color: 'rgba(242,242,242,.62)', opacity: so}}>{b.src}</div>
      ) : null}
      {t < 264 ? (
        <div style={{position: 'absolute', right: W * 0.06, bottom: H * 0.035, display: 'flex', alignItems: 'center', gap: W * 0.012, opacity: 0.8}}>
          <Img src={staticFile('brand/zeno-mark-dark.svg')} style={{width: H * 0.022, height: H * 0.022}} />
          <span style={{fontFamily: NUM, fontWeight: 600, fontSize: H * 0.015, color: P.white}}>zeno.yczc</span>
        </div>
      ) : null}
    </>
  );
};

// ---------------------------------------------------------------- sfx (quiet: this is not a pop piece)
const CUE_S: Array<[number, SfxEvent]> = [
  [0.6, 'titleHit'], [3.3, 'printLand'], [10.1, 'pageTurn'], [15.5, 'mapFly'], [16.94, 'slam'], [24.6, 'titleHit'], [31.0, 'printLand'], [35.4, 'printLand'],
  [39.0, 'mapFly'], [44.3, 'pageTurn'], [46.7, 'highlight'], [50.92, 'highlight'], [53.8, 'pageTurn'], [53.94, 'highlight'], [56.2, 'highlight'], [70.6, 'titleHit'],
  [72.8, 'printLand'], [77.68, 'slide'], [81.48, 'slide'], [83.82, 'slide'], [86.92, 'slide'], [91.1, 'titleHit'], [99.3, 'pageTurn'], [103.4, 'mapFly'],
  ...MONUMENTS.map((m) => [m.at, 'shapePop'] as [number, SfxEvent]),
  [129.3, 'pageTurn'], [137.7, 'printLand'], [142.9, 'titleHit'], [145.8, 'printLand'], [152.8, 'titleHit'], [166.86, 'stamp'], [169.5, 'pageTurn'], [182.6, 'titleHit'],
  [193.9, 'printLand'], [200.8, 'scribble'], [211.7, 'printLand'], [218.3, 'shapePop'], [233.0, 'titleHit'], [252.5, 'printLand'],
];
const CUES = CUE_S.map(([s, event]) => ({at: Math.round(s * FPS), event, db: -26}));

// ---------------------------------------------------------------- composition
const BoardView: React.FC<{b: Board}> = ({b}) => {
  const dur = Math.round((b.to - b.from) * FPS);
  const C = b.C;
  return (
    <Ctx.Provider value={{s0: b.from, dur}}>
      <AbsoluteFill style={{background: P.stage}}>
        <C />
      </AbsoluteFill>
    </Ctx.Provider>
  );
};

export const Nanjing1937: React.FC = () => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: P.stage}}>
      <CollageFilters scale={height / 1080} seed={13} />
      <Audio src={staticFile('audio/raw/nanjing/vo_v4.mp3')} />
      {/* synthesized bed (scripts/audio/nanjing_bed.py): −24 dBFS RMS file, played ≈ 16 dB under the voice */}
      <Audio src={staticFile('audio/raw/nanjing/bed.wav')} volume={dbToGain(-15)} />
      <SfxTrack cues={CUES} />
      {BOARDS.map((b) => {
        const from = Math.round(b.from * FPS);
        const to = Math.round(b.to * FPS);
        return (
          <Sequence key={b.from} from={from} durationInFrames={to - from}>
            <BoardView b={b} />
          </Sequence>
        );
      })}
      <Chrome frame={frame} />
      <Subtitle frame={frame} />
      <FilmLook frame={frame} grain={0.07} vignette={0.45} />
    </AbsoluteFill>
  );
};

// one still per board, taken late in the board (after its entrances)
export const NANJING_KEYFRAMES = BOARDS.map((b) => Math.round((b.from + Math.min(b.to - b.from - 0.5, (b.to - b.from) * 0.8)) * FPS));
