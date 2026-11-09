// 「她」字是谁造的 (story-video pipeline; see skill story-video).
// Narration only here; the quiet BGM + SFX mix is made by scripts/audio/make_quiet_bed.py and muxed with ffmpeg.
// 「她」字是谁造的 (1080×1920, 24 fps, 283.4 s): vox-collage explainer cut to the narration (script.mp3).
// No subtitles. Every archival image / news screenshot carries a source line; typeset cards are graphics, not scans.
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  Annotate,
  CollageFilters,
  ColorField,
  CutLetters,
  FilmLook,
  HeadlineStrip,
  PrintCutout,
  SLAP,
  Scraps,
  SourceLine,
  VoxCamera,
  type ChipStyle,
  type Scrap,
} from '../../collage';
import ASPECT from '../../../public/evidence/tazi/aspects.json';
import './fonts';

export const FPS = 24;
export const TAZI_DURATION = Math.ceil(284.6 * FPS);
const T = (s: number) => Math.round(s * FPS);
const A = ASPECT as Record<string, number>;
// Third-party news screenshots and the Unicode chart glyph are NOT in git (public repo): they live in the
// gitignored public/assets/tazi/ and are re-fetched per CREDITS.md. Public-domain / CC archival scans are in evidence/.
const LOCAL_ONLY = new Set(['cnn', 'dq_fig', 'dq_head', 'huxiu', 'unwire', 'moe', 'uni_ctx']);
const ev = (n: string) => staticFile(LOCAL_ONLY.has(n) ? `assets/tazi/${n}.jpg` : `evidence/tazi/${n}.jpg`);

// ---- fonts by role ----
export const SERIF = 'Noto Serif SC'; // 900: glyphs, book titles
export const SANS = 'Noto Sans SC'; // 400/700/900: strips, labels
export const KAI = 'LXGW WenKai'; // quotes (original words)
export const NUM = "'Libre Franklin', 'Noto Sans SC'"; // years, pinyin
export const JP = 'Noto Serif JP';

// ---- palette ----
const P = {
  paper: '#F2ECDF',
  ivory: '#F7F3EA',
  ink: '#1B1A18',
  red: '#C8352B',
  yellow: '#F5EC0C',
  blue: '#2B6A99',
  rose: '#C54C65',
  slate: '#55626B',
  sand: '#D9CBB0',
};
const DARK = new Set([P.ink, P.red, P.blue, P.rose, P.slate]);
const chips = (pairs: Array<[string, string]>): ChipStyle[] => pairs.map(([bg, fg]) => ({bg, fg, font: SANS, weight: 900}));
const POP = chips([[P.ink, P.ivory], [P.ivory, P.red], [P.red, P.ivory]]);
const ON_DARK = chips([[P.ivory, P.ink], [P.yellow, P.ink], [P.red, P.ivory]]);

// ---- shot clock ----
const ShotCtx = React.createContext({t0: 0});
const useS = () => {
  const local = useCurrentFrame();
  const {t0} = React.useContext(ShotCtx);
  const {width: W, height: H, fps} = useVideoConfig();
  const f = local + T(t0);
  /** drawings (on 2s) since absolute second `at`; negative = not yet */
  const st = (at: number) => Math.floor((f - T(at)) / 2);
  return {f, local, fps, W, H, st};
};

// ---------------------------------------------------------------- building blocks

const Strip: React.FC<{at: number; text: string; x: number; y: number; size?: number; bg?: string; fg?: string; rot?: number; font?: string}> = ({at, text, x, y, size = 3.2, bg = P.ink, fg = P.ivory, rot = -2, font = SANS}) => {
  const {st} = useS();
  return <HeadlineStrip text={text} step={st(at)} sizePctH={size} x={x} y={y} bg={bg} fg={fg} rot={rot} font={font} />;
};
const Book: React.FC<{at: number; title: string; note?: string; x: number; y: number; size?: number; rot?: number; noteBg?: string}> = ({at, title, note, x, y, size = 4, rot = -2, noteBg = P.ink}) => (
  <>
    <Strip at={at} text={title} x={x} y={y} size={size} bg={P.ivory} fg={P.ink} rot={rot} font={SERIF} />
    {note ? <Strip at={at + 0.4} text={note} x={x + 1.5} y={y + size * 1.5} size={2.1} bg={noteBg} fg={P.ivory} rot={rot * -0.5} /> : null}
  </>
);
const Cut: React.FC<{at: number; text: string; x: number; y: number; size: number; dark?: boolean; per?: number}> = ({at, text, x, y, size, dark = false, per = 2}) => {
  const {st} = useS();
  return <CutLetters text={text} step={st(at)} perChar={per} sizePctH={size} styles={dark ? ON_DARK : POP} x={x} y={y} seed={text} />;
};
const Photo: React.FC<{at: number; src: string; w: number; x: number; y: number; rot?: number; pitch?: number; halftone?: boolean; enter?: 'slap' | 'drop' | 'slide' | 'none'}> = ({at, src, w, x, y, rot = 0, pitch = 0.34, halftone = true, enter = 'slap'}) => {
  const {st, W} = useS();
  return <PrintCutout src={ev(src)} aspect={A[src]} widthPx={(w / 100) * W} x={x} y={y} rot={rot} step={st(at)} enter={enter} pitchPctH={pitch} paperColor="#F2EEE4" wobble={0.4} halftone={halftone} />;
};
/** A document / screenshot print that keeps its tones and colour: paper border, tape, real shadow. */
const Doc: React.FC<{at: number; src: string; w: number; x: number; y: number; rot?: number; tape?: boolean; border?: number; children?: React.ReactNode}> = ({at, src, w, x, y, rot = 0, tape = true, border = 0.9, children}) => {
  const {st, W, H} = useS();
  const s = st(at);
  if (s < 0) return null;
  const iw = (w / 100) * W;
  const ih = iw / A[src];
  const b = (border / 100) * H;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: iw + 2 * b, height: ih + 2 * b, transform: `rotate(${rot}deg) scale(${SLAP[Math.min(s, 3)]})`, filter: `drop-shadow(0 ${H * 0.008}px ${H * 0.012}px rgba(0,0,0,.42))`}}>
      <div style={{position: 'absolute', inset: 0, background: '#FAF7F0', filter: 'url(#stickerTorn)'}} />
      <Img src={ev(src)} style={{position: 'absolute', left: b, top: b, width: iw, height: ih}} />
      <div style={{position: 'absolute', left: b, top: b, width: iw, height: ih}}>{children}</div>
      {tape ? (
        <>
          <div style={{position: 'absolute', left: '42%', top: -H * 0.012, width: '16%', height: H * 0.026, background: 'rgba(236,226,196,.82)', transform: 'rotate(-4deg)', boxShadow: '0 1px 2px rgba(0,0,0,.15)'}} />
        </>
      ) : null}
    </div>
  );
};
/** yellow highlighter band over part of a Doc (coords in % of the image) */
const Hi: React.FC<{at: number; x: number; y: number; w: number; h: number; color?: string; dur?: number}> = ({at, x, y, w, h, color = P.yellow, dur = 10}) => {
  const {f} = useS();
  const p = Math.max(0, Math.min(1, (f - T(at)) / dur));
  if (p <= 0) return null;
  return <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${w * p}%`, height: `${h}%`, background: color, opacity: 0.55, mixBlendMode: 'multiply', filter: 'url(#markerEdge)'}} />;
};
const Mark: React.FC<{at: number; kind: 'circle' | 'strike' | 'underline' | 'arrow'; box: {x: number; y: number; w: number; h: number}; color?: string; width?: number}> = ({at, kind, box, color = P.red, width = 0.6}) => {
  const {f} = useS();
  return <Annotate frame={f} at={T(at)} dur={8} kind={kind} box={box} widthPctH={width} color={color} seed={`${kind}${box.x}${box.y}`} />;
};
const Bits: React.FC<{at: number; items: Scrap[]; seed: string}> = ({at, items, seed}) => {
  const {st} = useS();
  return <Scraps step={st(at)} appearStep={0} seed={seed} items={items} />;
};
/** Quote on a torn paper sticker (KAI = original words) */
const Quote: React.FC<{at: number; text: string; by?: string; x: number; y: number; w: number; size?: number; rot?: number; head?: string}> = ({at, text, by, x, y, w, size = 3.8, rot = -1, head}) => {
  const {st, H} = useS();
  const s = st(at);
  if (s < 0) return null;
  const fs = (size / 100) * H;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, maxWidth: `${w}%`, transform: `rotate(${rot}deg) scale(${SLAP[Math.min(s, 3)]})`, transformOrigin: '0 0', filter: `drop-shadow(0 ${H * 0.007}px ${H * 0.008}px rgba(0,0,0,.4))`}}>
      <div style={{position: 'absolute', inset: 0, background: P.ivory, filter: 'url(#stickerTorn)'}} />
      {head ? <div style={{position: 'relative', padding: `${fs * 0.3}px ${fs * 0.45}px 0`, fontFamily: SANS, fontWeight: 700, fontSize: H * 0.0185, color: P.red}}>{head}</div> : null}
      <div style={{position: 'relative', padding: `${fs * 0.32}px ${fs * 0.45}px`, fontFamily: KAI, fontWeight: 400, fontSize: fs, lineHeight: 1.4, color: P.ink, whiteSpace: 'pre-line'}}>{text}</div>
      {by && s >= 4 ? <div style={{position: 'relative', padding: `0 ${fs * 0.45}px ${fs * 0.32}px`, fontFamily: SANS, fontWeight: 700, fontSize: H * 0.019, color: P.red, textAlign: 'right'}}>{by}</div> : null}
    </div>
  );
};
/** One big character on a paper chip */
const Glyph: React.FC<{at: number; ch: string; x: number; y: number; size: number; bg?: string; fg?: string; rot?: number; font?: string; weight?: number; sub?: string; subColor?: string; children?: React.ReactNode}> = ({at, ch, x, y, size, bg = P.ivory, fg = P.ink, rot = 0, font = SERIF, weight = 900, sub, subColor = P.red, children}) => {
  const {st, H} = useS();
  const s = st(at);
  if (s < 0) return null;
  const fs = (size / 100) * H;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${SLAP[Math.min(s, 3)]})`, filter: `drop-shadow(0 ${H * 0.008}px ${H * 0.01}px rgba(0,0,0,.42))`}}>
      {bg !== 'none' ? <div style={{position: 'absolute', inset: 0, background: bg, clipPath: 'polygon(2% 1%, 98% 3%, 100% 97%, 0% 99%)'}} /> : null}
      <div style={{position: 'relative', padding: `${fs * 0.06}px ${fs * 0.14}px ${sub ? 0 : fs * 0.06}px`, fontFamily: font, fontWeight: weight, fontSize: fs, lineHeight: 1.12, color: fg, textAlign: 'center', whiteSpace: 'nowrap'}}>
        {children ?? ch}
      </div>
      {sub ? <div style={{position: 'relative', textAlign: 'center', padding: `0 ${fs * 0.1}px ${fs * 0.08}px`, fontFamily: NUM, fontWeight: 700, fontSize: fs * 0.24, color: subColor}}>{sub}</div> : null}
    </div>
  );
};
/** 㐅也 from the official Unicode chart glyph (U+323BF), as a mask in any colour */
const XyeGlyph: React.FC<{at: number; x: number; y: number; h: number; color?: string; bg?: string; rot?: number}> = ({at, x, y, h, color = P.ink, bg, rot = 0}) => {
  const {st, H} = useS();
  const s = st(at);
  if (s < 0) return null;
  const hp = (h / 100) * H;
  const wp = hp * A.glyph_xye;
  const src = staticFile('assets/tazi/glyph_xye.png');
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${SLAP[Math.min(s, 3)]})`, filter: `drop-shadow(0 ${H * 0.008}px ${H * 0.01}px rgba(0,0,0,.42))`}}>
      {bg ? <div style={{position: 'absolute', inset: -hp * 0.12, background: bg, clipPath: 'polygon(2% 1%, 98% 3%, 100% 97%, 0% 99%)'}} /> : null}
      <div style={{position: 'relative', width: wp, height: hp, background: color, maskImage: `url(${src})`, WebkitMaskImage: `url(${src})`, maskSize: '100% 100%', WebkitMaskSize: '100% 100%'}} />
    </div>
  );
};
/** arrow drawn on (absolute % coords) */
const Arrow: React.FC<{at: number; x1: number; y1: number; x2: number; y2: number; color?: string}> = ({at, x1, y1, x2, y2, color = P.red}) => (
  <Mark at={at} kind="arrow" box={{x: x1, y: y1, w: x2 - x1, h: y2 - y1}} color={color} width={0.55} />
);
/** a plain label (no chip) */
const Label: React.FC<{at: number; text: string; x: number; y: number; size?: number; color?: string; font?: string; weight?: number; align?: 'left' | 'center'}> = ({at, text, x, y, size = 2.2, color = P.ink, font = SANS, weight = 700, align = 'left'}) => {
  const {st, H} = useS();
  if (st(at) < 0) return null;
  return <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, transform: align === 'center' ? 'translateX(-50%)' : undefined, fontFamily: font, fontWeight: weight, fontSize: (size / 100) * H, color, whiteSpace: 'pre', lineHeight: 1.25, textAlign: align}}>{text}</div>;
};

/** Ticket graphic (an illustration of the 1924 metaphor, not a real ticket) */
const Ticket: React.FC<{at: number; cls: string; ch: string; x: number; y: number; rot?: number; color: string}> = ({at, cls, ch, x, y, rot = 0, color}) => {
  const {st, H, W} = useS();
  const s = st(at);
  if (s < 0) return null;
  const w = W * 0.44;
  const h = H * 0.17;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: w, height: h, transform: `rotate(${rot}deg) scale(${SLAP[Math.min(s, 3)]})`, filter: `drop-shadow(0 ${H * 0.008}px ${H * 0.01}px rgba(0,0,0,.45))`}}>
      <div style={{position: 'absolute', inset: 0, background: color, clipPath: 'polygon(0 0, 100% 0, 100% 40%, 97% 50%, 100% 60%, 100% 100%, 0 100%, 0 60%, 3% 50%, 0 40%)'}} />
      <div style={{position: 'absolute', inset: H * 0.01, border: `${H * 0.002}px dashed rgba(27,26,24,.45)`}} />
      <div style={{position: 'absolute', left: '9%', top: '16%', fontFamily: SANS, fontWeight: 900, fontSize: H * 0.03, color: P.ink}}>{cls}</div>
      <div style={{position: 'absolute', left: '9%', top: '58%', fontFamily: NUM, fontWeight: 700, fontSize: H * 0.016, color: 'rgba(27,26,24,.7)', letterSpacing: '0.12em'}}>No. 1924</div>
      <div style={{position: 'absolute', right: '7%', top: '14%', fontFamily: SERIF, fontWeight: 900, fontSize: H * 0.085, lineHeight: 1.1, color: P.ink}}>{ch}</div>
    </div>
  );
};

/** a simple person icon (head + body) */
const Person: React.FC<{x: number; y: number; s: number; color: string}> = ({x, y, s, color}) => {
  const {H} = useS();
  const u = (s / 100) * H;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: u, height: u * 1.6}}>
      <div style={{position: 'absolute', left: u * 0.28, top: 0, width: u * 0.44, height: u * 0.44, borderRadius: '50%', background: color}} />
      <div style={{position: 'absolute', left: u * 0.08, top: u * 0.52, width: u * 0.84, height: u * 1.0, borderRadius: `${u * 0.42}px ${u * 0.42}px ${u * 0.08}px ${u * 0.08}px`, background: color}} />
    </div>
  );
};

/** input-method box: what you type → a tofu box */
const InputBox: React.FC<{at: number; x: number; y: number; w: number; typed: string; dark?: boolean}> = ({at, x, y, w, typed, dark = false}) => {
  const {st, f, H, W} = useS();
  const s = st(at);
  if (s < 0) return null;
  const blink = Math.floor(f / 12) % 2 === 0;
  const fs = H * 0.045;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: (w / 100) * W, transform: `scale(${SLAP[Math.min(s, 3)]})`, filter: `drop-shadow(0 ${H * 0.008}px ${H * 0.01}px rgba(0,0,0,.4))`}}>
      <div style={{background: dark ? '#2A2926' : '#FFFFFF', border: `${H * 0.002}px solid ${dark ? '#55534F' : '#BDB6A6'}`, borderRadius: H * 0.012, padding: `${H * 0.016}px ${H * 0.02}px`, display: 'flex', alignItems: 'center', gap: H * 0.012}}>
        <span style={{fontFamily: NUM, fontWeight: 600, fontSize: fs * 0.62, color: dark ? '#C9C3B6' : '#6C675C'}}>{typed}</span>
        <span style={{display: 'inline-block', width: fs * 0.82, height: fs * 0.98, border: `${H * 0.0025}px solid ${P.red}`, boxSizing: 'border-box'}} />
        <span style={{display: 'inline-block', width: H * 0.003, height: fs, background: blink ? (dark ? P.ivory : P.ink) : 'transparent'}} />
      </div>
    </div>
  );
};

/** spoken-sound bars (identical shapes for 他 and 她) */
const Wave: React.FC<{at: number; x: number; y: number; w: number; color: string}> = ({at, x, y, w, color}) => {
  const {f, W, H} = useS();
  if (f < T(at)) return null;
  const n = 18;
  const p = Math.min(1, (f - T(at)) / 10);
  const bw = ((w / 100) * W) / (n * 1.6);
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, display: 'flex', gap: bw * 0.6, alignItems: 'center', height: H * 0.06}}>
      {Array.from({length: n}).map((_, i) => {
        const env = Math.sin((Math.PI * (i + 0.5)) / n);
        const hh = H * 0.06 * env * (0.45 + 0.55 * Math.abs(Math.sin(i * 1.7))) * p;
        return <div key={i} style={{width: bw, height: Math.max(2, hh), background: color, borderRadius: bw / 2}} />;
      })}
    </div>
  );
};

// ---------------------------------------------------------------- shots

type ShotDef = {
  t: number; // start, seconds
  bg: string;
  dots?: 'tl' | 'tr' | 'bl' | 'br' | 'none';
  src?: string;
  cam?: Array<[number, number, number, number]>; // [sec, cx, cy, scale]
  tex?: boolean;
  C: React.FC;
  Over?: React.FC; // drawn outside the camera
};

const SHOTS: ShotDef[] = [
  // ── 0 hook
  {t: 0, bg: P.red, dots: 'none', C: () => (
    <>
      <Glyph at={0.15} ch="她" x={50} y={40} size={30} bg={P.ivory} fg={P.ink} rot={-3} />
      <Cut at={1.0} text="谁造的？" x={18} y={62} size={7.2} dark />
      <Bits at={0.6} seed="h" items={[{kind: 'star', x: 74, y: 16, size: 9, color: P.yellow}, {kind: 'zigzag', x: 8, y: 80, size: 10, rot: -8, color: P.ink}]} />
    </>
  )},
  {t: 2.6, bg: P.paper, dots: 'tr', src: '图：刘半农像（维基共享资源，公有领域）', C: () => (
    <>
      <Photo at={2.65} src="liu" w={62} x={30} y={16} rot={2} />
      <Cut at={2.9} text="刘半农？" x={6} y={9} size={6.4} />
      <Strip at={3.6} text="很多人脱口而出的答案" x={6} y={74} size={2.8} bg={P.ink} rot={-1} />
      <Bits at={3.2} seed="q" items={[{kind: 'dot', x: 8, y: 30, size: 4, color: P.red}, {kind: 'half', x: 12, y: 58, size: 8, rot: 15, color: P.yellow}]} />
    </>
  )},
  {t: 4.7, bg: P.ink, dots: 'none', src: '图：原本《玉篇》卷二十七残卷，日本石山寺藏（维基共享资源，公有领域）', cam: [[4.7, 50, 46, 1.0], [9.9, 56, 44, 1.12]], C: () => (
    <>
      <Doc at={4.75} src="yupian" w={150} x={-25} y={33} rot={-1} tape={false} />
      <Book at={5.2} title="《玉篇》" note="南朝梁 · 顾野王 · 543 年" x={6} y={9} size={5.6} />
      <Strip at={7.2} text="“她”早就在里面了" x={8} y={70} size={3.6} bg={P.yellow} fg={P.ink} rot={1} />
    </>
  )},
  {t: 9.9, bg: P.paper, dots: 'none', src: '图：《康熙字典》武英殿本 女部（kangxizidian.com 影像，公有领域）', cam: [[9.9, 50, 50, 1.0], [10.6, 50, 50, 1.0], [11.6, 15.5, 73, 2.3], [16.6, 16.5, 72, 2.4]], C: () => (
    <>
      <Doc at={9.95} src="kx1204" w={90} x={4} y={11.5} tape={false} border={0.6} />
      <Mark at={11.8} kind="circle" box={{x: 10, y: 69.5, w: 10, h: 7}} width={0.35} />
    </>
  ), Over: () => (
    <>
      <Glyph at={11.9} ch="她" sub="jiě" x={72} y={20} size={12} bg={P.yellow} fg={P.ink} rot={2} />
      <Glyph at={12.6} ch="姐" sub="jiě" x={72} y={42} size={9} bg={P.ivory} fg={P.ink} rot={-2} />
      <Strip at={12.7} text="《玉篇》：古文“姐”字" x={6} y={56} size={3.2} bg={P.ink} rot={-1} />
      <Strip at={14.1} text="跟女性无关" x={8} y={63} size={4} bg={P.red} rot={1} />
    </>
  )},
  {t: 16.6, bg: P.yellow, dots: 'br', C: () => (
    <>
      <Cut at={16.7} text="没有造字" x={8} y={8} size={8} />
      <Strip at={17.4} text="刘半农并没有发明这个字" x={8} y={22} size={2.8} bg={P.ink} rot={-1} />
      <Glyph at={19.1} ch="她" sub="jiě · 姐" x={27} y={47} size={15} bg={P.ivory} fg={'#8A8478'} rot={-3} />
      <Label at={19.3} text="旧字" x={27} y={33.5} size={2.6} align="center" />
      <Mark at={20.4} kind="strike" box={{x: 14, y: 52, w: 26, h: 4}} />
      <Arrow at={21.2} x1={42} y1={47} x2={56} y2={49} color={P.ink} />
      <Glyph at={21.8} ch="她" sub="tā · 女性" x={74} y={49} size={17} bg={P.ink} fg={P.ivory} subColor={P.yellow} rot={2} />
      <Label at={22.2} text="新工作" x={74} y={33.5} size={2.6} align="center" color={P.red} />
    </>
  )},
  // ── why
  {t: 24.4, bg: P.ink, dots: 'none', C: () => (
    <>
      <Strip at={24.6} text="为什么需要？" x={8} y={10} size={4.4} bg={P.yellow} fg={P.ink} />
      <Glyph at={26.7} ch="他" x={50} y={46} size={28} bg={P.ivory} fg={P.ink} />
      <Glyph at={27.6} ch="男" x={20} y={72} size={7} bg={P.blue} fg={P.ivory} rot={-4} />
      <Glyph at={27.9} ch="女" x={80} y={72} size={7} bg={P.rose} fg={P.ivory} rot={4} />
      <Arrow at={27.8} x1={24} y1={67} x2={38} y2={60} color={P.ivory} />
      <Arrow at={28.1} x1={76} y1={67} x2={62} y2={60} color={P.ivory} />
      <Strip at={28.2} text="原本不分男女" x={28} y={84} size={3.2} bg={P.red} rot={-1} />
    </>
  )},
  {t: 29.0, bg: P.ivory, dots: 'tl', C: () => (
    <>
      <Strip at={29.1} text="翻译西方小说" x={8} y={8} size={4} bg={P.ink} />
      <Strip at={30.6} text="一到翻译就乱了" x={10} y={16} size={2.8} bg={P.red} rot={1} />
      <EnLine at={29.8} />
      <Glyph at={33.4} ch="he" x={24} y={42} size={10} bg={P.blue} fg={P.ivory} font={NUM} weight={800} rot={-3} />
      <Glyph at={34.6} ch="she" x={24} y={63} size={10} bg={P.rose} fg={P.ivory} font={NUM} weight={800} rot={2} />
      <Arrow at={33.8} x1={38} y1={43} x2={58} y2={49} color={P.ink} />
      <Arrow at={35.0} x1={40} y1={61} x2={58} y2={53} color={P.ink} />
      <Glyph at={33.9} ch="他" x={74} y={52} size={20} bg={P.ink} fg={P.ivory} rot={1} />
    </>
  )},
  {t: 36.0, bg: P.blue, dots: 'br', C: () => <Tangle />},
  {t: 40.6, bg: P.paper, dots: 'tr', src: '图：马礼逊像，George Chinnery 绘（维基共享资源，公有领域）', C: () => (
    <>
      <Photo at={40.7} src="morrison" w={50} x={46} y={8} rot={2} halftone={false} />
      <Strip at={41.0} text="1823" x={6} y={9} size={6} bg={P.ink} font={NUM} />
      <Strip at={41.6} text="传教士 马礼逊" x={6} y={19} size={3.2} bg={P.red} rot={1} />
      <Book at={43.4} title="《英国文语凡例传》" note="给中国学生的英语语法书" x={5} y={27} size={3.6} />
      <Strip at={45.9} text="办法：加个括号" x={6} y={50} size={3.2} bg={P.ink} rot={-1} />
      <TypeCard at={48.2} />
    </>
  )},
  {t: 52.8, bg: P.ink, dots: 'none', src: '图：《新青年》第 2 卷第 2 号封面，1916（维基共享资源，公有领域）', C: () => (
    <>
      <Doc at={52.85} src="xqn" w={58} x={36} y={14} rot={2} />
      <Cut at={53.0} text="五四" x={6} y={10} size={10} dark />
      <Strip at={54.4} text="翻译越来越多" x={6} y={30} size={3.2} bg={P.ivory} fg={P.ink} rot={-1} />
      <Strip at={55.3} text="问题越来越急" x={8} y={37} size={3.2} bg={P.red} rot={1} />
    </>
  )},
  // ── 1918–1919
  {t: 56.4, bg: P.ivory, dots: 'tl', src: '图：周作人像；斯特林堡像，Richard Bergh 绘（维基共享资源，公有领域）', C: () => (
    <>
      <Photo at={56.5} src="zhou" w={46} x={4} y={13} rot={-2} />
      <Strip at={56.6} text="1918" x={56} y={9} size={6} bg={P.ink} font={NUM} />
      <Strip at={57.3} text="周作人" x={56} y={19} size={4} bg={P.red} rot={1} />
      <Photo at={58.2} src="strindberg" w={34} x={58} y={29} rot={3} halftone={false} />
      <Label at={58.6} text="译瑞典作家斯特林堡小说" x={57} y={52} size={1.9} />
      <Quote at={61.1} head="译后附记（大意）" text={'「半农想造一个“她”字，\n　这原是极好的」'} x={6} y={60} w={86} size={4} rot={-1} />
    </>
  )},
  {t: 65.4, bg: P.yellow, dots: 'tr', src: '图：铅活字版，杭州国家版本馆藏（维基共享资源，CC BY 4.0）', C: () => (
    <>
      <Doc at={65.45} src="leadtype" w={86} x={6} y={8} rot={-1} />
      <Strip at={65.8} text="印刷所里没有“她”的铅字" x={6} y={39} size={3.2} bg={P.ink} rot={-1} />
      <Glyph at={67.8} ch="" x={50} y={66} size={20} bg={P.ivory} fg={P.ink} rot={2}>
        <span style={{display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1}}>
          <span>他</span>
          <span style={{fontSize: '0.32em', color: P.red, marginTop: '-0.02em'}}>女</span>
        </span>
      </Glyph>
      <Strip at={69.2} text="“他”字底下加个小“女”字" x={10} y={86} size={2.8} bg={P.red} rot={1} />
    </>
  )},
  {t: 72.1, bg: P.paper, dots: 'br', src: '图：钱玄同像、周作人像（维基共享资源，公有领域）', C: () => (
    <>
      <Strip at={72.2} text="1919" x={6} y={7} size={6} bg={P.ink} font={NUM} />
      <Photo at={72.4} src="qian" w={42} x={6} y={20} rot={-3} />
      <Photo at={72.9} src="zhou" w={42} x={52} y={22} rot={3} />
      <Label at={73.4} text="钱玄同" x={10} y={50} size={2.6} />
      <Label at={73.6} text="周作人" x={56} y={52} size={2.6} />
      <Book at={74.4} title="《新青年》6 卷 2 号" note="专门讨论：英文 she 该怎么译" x={8} y={62} size={4.2} rot={-1} />
    </>
  )},
  {t: 77.4, bg: P.ink, dots: 'none', C: () => (
    <>
      <Strip at={77.5} text="四个方案" x={8} y={8} size={4.4} bg={P.yellow} fg={P.ink} />
      <Glyph at={78.6} ch="" x={28} y={32} size={13} bg={P.ivory} rot={-3}><span>他<span style={{fontSize: '0.55em'}}>女</span></span></Glyph>
      <Glyph at={79.3} ch="" x={72} y={32} size={13} bg={P.ivory} rot={2}><span><span style={{fontSize: '0.55em'}}>女</span>他</span></Glyph>
      <Glyph at={80.1} ch="她" x={28} y={60} size={14} bg={P.ivory} rot={2} />
      <Glyph at={81.0} ch="伊" x={72} y={60} size={14} bg={P.ivory} rot={-2} />
      <Mark at={82.2} kind="circle" box={{x: 58, y: 51, w: 28, h: 18}} color={P.yellow} width={0.7} />
      <Mark at={83.4} kind="strike" box={{x: 14, y: 55, w: 28, h: 8}} />
      <Strip at={82.6} text="选中：伊" x={52} y={80} size={3.6} bg={P.yellow} fg={P.ink} rot={-1} />
    </>
  )},
  // ── the fight
  {t: 85.0, bg: P.blue, dots: 'tl', src: '图：刘半农像（维基共享资源，公有领域）；文章刊于《时事新报·学灯》1920.8.9', C: () => (
    <>
      <Strip at={85.1} text="1920 · 伦敦" x={6} y={8} size={5} bg={P.ivory} fg={P.ink} />
      <Photo at={85.6} src="liu" w={48} x={46} y={18} rot={3} />
      <Book at={87.4} title="《“她”字问题》" note="刘半农 作" x={5} y={22} size={5} />
      <Strip at={90.2} text="替这个字辩护" x={6} y={68} size={3.6} bg={P.red} rot={-1} />
    </>
  )},
  {t: 91.7, bg: P.red, dots: 'none', src: '寒冰《这是刘半农的错》，刊于《新人》1920', C: () => (
    <>
      <Strip at={91.8} text="在这之前，已有人撰文" x={6} y={12} size={3} bg={P.ink} />
      <Cut at={92.6} text="这是" x={8} y={24} size={9} dark />
      <Cut at={93.2} text="刘半农" x={8} y={37} size={9} dark />
      <Cut at={94.0} text="的错" x={8} y={50} size={9} dark />
      <Bits at={94.6} seed="err" items={[{kind: 'star', x: 70, y: 22, size: 10, color: P.yellow}, {kind: 'triangle', x: 74, y: 60, size: 9, rot: 20, color: P.ink}]} />
    </>
  )},
  {t: 96.9, bg: P.ivory, dots: 'br', C: () => (
    <>
      <Strip at={97.0} text="反对声音来自两个方向" x={6} y={8} size={3.4} bg={P.ink} />
      <Label at={98.3} text="其一" x={8} y={17} size={2.6} color={P.red} />
      <Cut at={98.6} text="多此一举" x={8} y={21} size={7.4} />
      <Glyph at={100.8} ch="你" x={19} y={46} size={11} bg={P.paper} rot={-3} />
      <Glyph at={101.5} ch="我" x={50} y={46} size={11} bg={P.paper} rot={2} />
      <Label at={102.0} text="都不分男女" x={36} y={57} size={2.6} align="center" color={P.slate} />
      <Glyph at={102.5} ch="她" x={81} y={46} size={11} bg={P.yellow} rot={-1} />
      <Strip at={103.0} text="凭什么偏偏第三人称要分？" x={12} y={68} size={3.4} bg={P.red} rot={-1} />
    </>
  )},
  {t: 104.3, bg: P.ink, dots: 'none', C: () => (
    <>
      <Glyph at={104.4} ch="他" sub="tā" x={28} y={34} size={18} bg={P.ivory} subColor={P.blue} rot={-2} />
      <Glyph at={104.8} ch="她" sub="tā" x={72} y={34} size={18} bg={P.ivory} subColor={P.rose} rot={2} />
      <Wave at={105.6} x={12} y={56} w={34} color={P.ivory} />
      <Wave at={105.6} x={56} y={56} w={34} color={P.ivory} />
      <Glyph at={106.2} ch="=" x={50} y={59} size={8} bg="none" fg={P.yellow} font={NUM} />
      <Strip at={106.6} text="嘴上根本分不出来" x={18} y={72} size={3.6} bg={P.yellow} fg={P.ink} rot={-1} />
    </>
  )},
  {t: 108.8, bg: P.yellow, dots: 'tl', C: () => (
    <>
      <Strip at={108.9} text="反对二：在划界线" x={6} y={8} size={4} bg={P.ink} />
      <Glyph at={110.6} ch="亻" sub="人字旁 · 男" x={27} y={42} size={18} bg={P.ivory} subColor={P.blue} rot={-2} />
      <Glyph at={112.2} ch="女" sub="女字旁 · 女" x={73} y={42} size={18} bg={P.ivory} subColor={P.rose} rot={2} />
      <RedLine at={111.6} />
      <Strip at={113.2} text="女人被单独标上一个偏旁" x={14} y={70} size={3.2} bg={P.red} rot={1} />
    </>
  )},
  {t: 115.3, bg: P.paper, dots: 'tr', C: () => (
    <>
      <Strip at={115.4} text="1924" x={6} y={8} size={6} bg={P.ink} font={NUM} />
      <Strip at={116.0} text="有人开会讨论这个字" x={6} y={18} size={3.2} bg={P.red} rot={1} />
      <Quote at={117.7} head="一位教师在会上说" text={'「女学生总不喜欢\n　这个“她”」'} x={8} y={34} w={84} size={5} rot={-2} />
      <Bits at={118.6} seed="cls" items={[{kind: 'dot', x: 80, y: 70, size: 6, color: P.rose}, {kind: 'bar', x: 10, y: 74, size: 14, rot: -6, color: P.ink}]} />
    </>
  )},
  {t: 120.8, bg: P.blue, dots: 'br', C: () => (
    <>
      <Strip at={120.9} text="一位老先生打圆场" x={6} y={8} size={3.6} bg={P.ivory} fg={P.ink} />
      <Ticket at={123.0} cls="三等车" ch="他" x={6} y={22} rot={-3} color={'#D8D2C2'} />
      <Ticket at={126.2} cls="二等车" ch="她" x={50} y={44} rot={3} color={'#E9C3B9'} />
      <Label at={126.8} text="“请女士们坐二等车，有什么不好呢？”" x={8} y={70} size={2.3} color={P.ivory} font={KAI} weight={400} />
      <Mark at={131.0} kind="strike" box={{x: 4, y: 30, w: 92, h: 22}} color={P.yellow} width={0.8} />
      <Strip at={131.4} text="这个比方，没能说服所有人" x={8} y={80} size={3.2} bg={P.red} rot={-1} />
    </>
  )},
  {t: 133.4, bg: P.rose, dots: 'tl', src: '图：《妇女共鸣》第 21 期封面，1930（维基共享资源，公有领域）', C: () => (
    <>
      <Doc at={133.45} src="fngm" w={56} x={40} y={14} rot={2} />
      <Strip at={133.6} text="1935" x={6} y={9} size={6} bg={P.ink} font={NUM} />
      <Book at={135.8} title="《妇女共鸣》" note="女性刊物" x={5} y={20} size={4.6} />
      <Strip at={136.6} text="登出启事：" x={5} y={52} size={3.4} bg={P.ink} rot={-1} />
      <Strip at={137.6} text="公开拒用“她”字" x={6} y={59} size={4} bg={P.yellow} fg={P.ink} rot={1} />
    </>
  )},
  {t: 139.3, bg: P.ink, dots: 'none', C: () => (
    <>
      <Glyph at={139.5} ch="亻" sub="归男人" x={28} y={30} size={16} bg={P.ivory} subColor={P.blue} rot={-2} />
      <Glyph at={140.6} ch="女" sub="归女人" x={72} y={30} size={16} bg={P.ivory} subColor={P.rose} rot={2} />
      <Strip at={143.2} text="暗含着：把女人当作" x={10} y={54} size={3.4} bg={P.ivory} fg={P.ink} rot={-1} />
      <Stamp at={144.0} text="非人" x={50} y={72} />
    </>
  )},
  // ── how 她 won
  {t: 145.9, bg: P.paper, dots: 'br', src: '图：周作人、钱玄同、鲁迅像（维基共享资源，公有领域）', C: () => (
    <>
      <Glyph at={146.0} ch="伊" x={26} y={22} size={22} bg={P.yellow} rot={-3} />
      <Strip at={146.8} text="当时更占上风" x={48} y={14} size={3.2} bg={P.ink} rot={1} />
      <Photo at={148.9} src="zhou" w={28} x={48} y={24} rot={2} />
      <Photo at={149.4} src="qian" w={28} x={70} y={27} rot={-3} />
      <Label at={149.9} text="周作人、钱玄同：选“伊”" x={50} y={52} size={2.1} />
      <Photo at={150.8} src="luxun" w={40} x={6} y={46} rot={-2} />
      <Strip at={151.6} text="鲁迅早期小说，女人也多写作“伊”" x={8} y={86} size={2.6} bg={P.red} rot={-1} />
    </>
  )},
  {t: 154.1, bg: P.yellow, dots: 'tl', C: () => <Flip />},
  {t: 165.3, bg: P.ink, dots: 'none', src: '图：刘半农像（维基共享资源，公有领域）', C: () => (
    <>
      <Photo at={165.4} src="liu" w={34} x={60} y={6} rot={3} />
      <Strip at={165.6} text="刘半农本人的主张" x={6} y={9} size={3.2} bg={P.ivory} fg={P.ink} />
      <Glyph at={167.6} ch="她" sub="tuó · 驼" x={24} y={36} size={13} bg={P.ivory} rot={-3} />
      <Glyph at={171.4} ch="她" sub="yī · 伊" x={56} y={46} size={13} bg={P.ivory} rot={2} />
      <Label at={172.0} text="也有人主张" x={45} y={60} size={2.2} color={P.ivory} />
      <Mark at={174.0} kind="strike" box={{x: 12, y: 36, w: 26, h: 8}} />
      <Mark at={174.4} kind="strike" box={{x: 44, y: 46, w: 26, h: 8}} />
      <Glyph at={175.6} ch="tā" x={50} y={78} size={11} bg={P.yellow} fg={P.ink} font={NUM} weight={800} rot={-2} />
      <Label at={176.4} text="大家照样念" x={50} y={88} size={2.6} color={P.ivory} align="center" />
    </>
  )},
  {t: 178.2, bg: P.ivory, dots: 'tr', src: '图：赵元任像（维基共享资源，公有领域）', C: () => (
    <>
      <Strip at={178.3} text="接下来的推手：作家和歌曲" x={6} y={7} size={3.2} bg={P.ink} />
      <Book at={181.0} title="《教我如何不想她》" note="刘半农 作诗 · 1920 年 · 伦敦" x={5} y={16} size={4.6} />
      <Photo at={185.2} src="zhao" w={40} x={52} y={36} rot={3} pitch={0.28} />
      <Strip at={185.6} text="赵元任 谱曲" x={8} y={46} size={3.6} bg={P.red} rot={-1} />
      <Strip at={186.6} text="一唱就是几十年" x={9} y={53} size={3} bg={P.ink} rot={1} />
      <Notes at={185.8} />
    </>
  )},
  {t: 188.8, bg: P.slate, dots: 'br', src: '图：鲁迅像，1930（维基共享资源，公有领域）', C: () => (
    <>
      <Photo at={188.85} src="luxun" w={54} x={40} y={14} rot={2} />
      <Strip at={188.9} text="1924" x={6} y={10} size={6} bg={P.ivory} fg={P.ink} font={NUM} />
      <Book at={189.4} title="《祝福》" note="鲁迅 ·《东方杂志》" x={5} y={21} size={5} />
      <Strip at={190.4} text="已改用“她”" x={6} y={64} size={4} bg={P.yellow} fg={P.ink} rot={-1} />
    </>
  )},
  {t: 191.9, bg: P.paper, dots: 'tl', src: '图：《国音常用字汇》书名页，教育部公布，1932（维基共享资源，公有领域）', C: () => (
    <>
      <Doc at={191.95} src="guoyin" w={58} x={38} y={12} rot={2} />
      <Strip at={192.0} text="1932" x={6} y={10} size={6} bg={P.ink} font={NUM} />
      <Strip at={192.8} text="教育部公布" x={6} y={20} size={3.4} bg={P.red} rot={1} />
      <Glyph at={194.4} ch="她" sub="tā" x={22} y={46} size={16} bg={P.yellow} rot={-3} />
      <Label at={194.8} text="收入字汇" x={22} y={59} size={2.6} align="center" />
      <Stamp at={196.6} text="落定" x={30} y={74} small />
    </>
  )},
  // ── a gender only on paper
  {t: 198.8, bg: P.blue, dots: 'br', C: () => (
    <>
      <Strip at={198.9} text="“她”是一个很特别的字" x={6} y={8} size={3.4} bg={P.ivory} fg={P.ink} />
      <Label at={200.6} text="英语" x={8} y={22} size={2.6} color={P.ivory} />
      <Glyph at={200.8} ch="he" sub="/hiː/" x={26} y={33} size={8} bg={P.ivory} font={NUM} weight={800} subColor={P.blue} rot={-2} />
      <Glyph at={201.5} ch="she" sub="/ʃiː/" x={70} y={33} size={8} bg={P.ivory} font={NUM} weight={800} subColor={P.rose} rot={2} />
      <Label at={203.7} text="日语" x={8} y={50} size={2.6} color={P.ivory} />
      <Glyph at={203.8} ch="彼" sub="kare" x={26} y={62} size={9} bg={P.ivory} font={JP} weight={700} subColor={P.blue} rot={2} />
      <Glyph at={204.5} ch="彼女" sub="kanojo" x={70} y={62} size={9} bg={P.ivory} font={JP} weight={700} subColor={P.rose} rot={-2} />
      <Strip at={205.4} text="读音都不一样" x={24} y={80} size={3.4} bg={P.yellow} fg={P.ink} rot={-1} />
    </>
  )},
  {t: 206.5, bg: P.ink, dots: 'none', C: () => (
    <>
      <Cut at={206.6} text="只在纸面上" x={8} y={9} size={7.4} dark />
      <Bubble at={210.0} />
      <Glyph at={212.0} ch="男？" x={30} y={72} size={7} bg={P.blue} fg={P.ivory} rot={-4} />
      <Glyph at={212.4} ch="女？" x={70} y={72} size={7} bg={P.rose} fg={P.ivory} rot={4} />
    </>
  )},
  {t: 213.9, bg: P.ivory, dots: 'tr', C: () => <Asym />},
  // ── today
  {t: 225.3, bg: P.yellow, dots: 'br', src: '图：虎嗅网转载果壳《为什么放着“他”和“她”不用，却要写成“TA”？》2019.9.10', C: () => (
    <>
      <Cut at={225.3} text="今天" x={8} y={6} size={8} />
      <Strip at={227.4} text="大陆" x={60} y={8} size={5} bg={P.red} />
      <Doc at={228.0} src="huxiu" w={80} x={10} y={20} rot={-1.5}>
        <Hi at={229.2} x={2} y={6} w={86} h={13} />
      </Doc>
      <Glyph at={230.1} ch="T" x={36} y={80} size={12} bg={P.ink} fg={P.yellow} font={NUM} weight={800} rot={-4} />
      <Glyph at={230.6} ch="A" x={58} y={80} size={12} bg={P.ink} fg={P.yellow} font={NUM} weight={800} rot={3} />
    </>
  )},
  {t: 232.2, bg: P.paper, dots: 'tl', src: '图：教育部《国语辞典简编本》“他”条（dict.concised.moe.edu.tw）', cam: [[232.2, 50, 50, 1.0], [233.2, 50, 50, 1.0], [234.2, 42, 64, 1.35], [235.7, 42, 64, 1.4]], C: () => (
    <>
      <Doc at={232.25} src="moe" w={84} x={8} y={18} rot={1}>
        <Hi at={233.6} x={3} y={70.5} w={62} h={3.5} />
      </Doc>
      <Strip at={232.3} text="台湾" x={6} y={7} size={5} bg={P.red} />
    </>
  ), Over: () => <Strip at={234.6} text="“他”至今可以泛指所有人" x={8} y={86} size={3.2} bg={P.ink} rot={-1} />},
  {t: 235.7, bg: P.ink, dots: 'none', src: '图：DQ 地球图辑队〈他、她一定要分清楚吗？〉2024.12.24（dq.yam.com/post/16367）', C: () => (
    <>
      <Strip at={235.8} text="2024 · 台湾网络媒体" x={6} y={6} size={3.2} bg={P.yellow} fg={P.ink} />
      <Doc at={236.0} src="dq_head" w={88} x={5} y={13} rot={-1}>
        <Hi at={239.0} x={19} y={63} w={60} h={6} />
      </Doc>
      <Strip at={238.9} text="男女一律写成“他”" x={8} y={39} size={3.4} bg={P.red} rot={1} />
      <Quote at={241.4} head="读者来信" text={'「你们是打错了，\n　还是懒得选字？」'} x={6} y={48} w={70} size={3.8} rot={-2} />
      <Strip at={244.9} text="编辑：是故意的" x={34} y={69} size={4.4} bg={P.yellow} fg={P.ink} rot={1} />
      <Strip at={246.6} text="不必一再提醒读者，这个人是女性" x={6} y={79} size={2.8} bg={P.ivory} fg={P.ink} rot={-1} />
    </>
  )},
  {t: 250.3, bg: P.yellow, dots: 'tr', src: '图：CNN〈Soon you may be able to type a new Chinese character〉2025.12.26', C: () => (
    <>
      <Strip at={250.3} text="香港" x={6} y={7} size={5} bg={P.red} />
      <Doc at={250.6} src="cnn" w={88} x={5} y={17} rot={1.5} />
      <Glyph at={252.6} ch="亻" x={18} y={65} size={10} bg={P.ivory} fg={'#8A8478'} rot={-3} />
      <Mark at={253.0} kind="strike" box={{x: 10, y: 61, w: 16, h: 6}} />
      <Arrow at={253.3} x1={25} y1={65} x2={33} y2={65} color={P.ink} />
      <Glyph at={253.6} ch="X" x={42} y={65} size={10} bg={P.ink} fg={P.yellow} font={NUM} weight={800} rot={2} />
      <Glyph at={254.2} ch="也" x={60} y={65} size={10} bg={P.ivory} rot={-1} />
      <Glyph at={254.8} ch="=" x={71} y={65} size={7} bg="none" fg={P.ink} font={NUM} />
      <XyeGlyph at={255.2} x={85} y={65} h={8.5} bg={P.ivory} rot={2} />
      <Strip at={256.0} text="不分性别的第三人称" x={14} y={80} size={3.6} bg={P.ink} rot={-1} />
    </>
  )},
  {t: 258.4, bg: P.paper, dots: 'br', src: '图：unwire.hk 2026.2.11；字形：Unicode 字符码表 U+323BF', C: () => (
    <>
      <Doc at={258.45} src="unwire" w={76} x={12} y={8} rot={-1.5} />
      <Strip at={258.6} text="2025 · 收进国际编码" x={6} y={52} size={3.6} bg={P.ink} rot={-1} />
      <XyeGlyph at={259.4} x={26} y={70} h={10} bg={P.yellow} rot={-2} />
      <Strip at={259.8} text="U+323BF" x={40} y={65} size={4} bg={P.ivory} fg={P.ink} font={NUM} rot={1} />
      <InputBox at={261.0} x={40} y={74.5} w={50} typed="ta" />
      <Strip at={261.8} text="多数输入法还打不出" x={34} y={84} size={3} bg={P.red} rot={1} />
    </>
  )},
  // ── ending
  {t: 264.4, bg: P.ink, dots: 'none', src: '图：铅活字版，杭州国家版本馆藏（维基共享资源，CC BY 4.0）', C: () => (
    <>
      <Strip at={264.4} text="100 多年前" x={6} y={7} size={4} bg={P.ivory} fg={P.ink} />
      <Doc at={264.5} src="leadtype" w={64} x={30} y={13} rot={2} tape={false} />
      <Label at={266.8} text="周作人想用“她”——印刷所里没有这个字" x={6} y={39} size={2.2} color={P.ivory} />
      <Strip at={268.9} text="100 年后" x={6} y={52} size={4} bg={P.yellow} fg={P.ink} />
      <XyeGlyph at={269.4} x={20} y={70} h={9} bg={P.ivory} rot={-3} />
      <InputBox at={271.2} x={38} y={64} w={54} typed="ta" dark />
      <Label at={272.0} text="有人想用这个新字——键盘上打不出来" x={6} y={83} size={2.2} color={P.ivory} />
    </>
  )},
  {t: 273.8, bg: P.red, dots: 'none', C: () => <Ending />},
];

// ---------------------------------------------------------------- special scenes

/** many 他 in one paragraph (illustrative sentence, set in type) */
const Tangle: React.FC = () => {
  const {f, H, st} = useS();
  const line = ['他', '对', '他', '说', '：', '他', '已', '经', '知', '道', '他', '在', '等', '他', '。'];
  const s = st(36.1);
  if (s < 0) return null;
  const fs = H * 0.05;
  let k = 0;
  return (
    <>
      <div style={{position: 'absolute', left: '6%', top: '22%', width: '88%', transform: `rotate(-1deg) scale(${SLAP[Math.min(s, 3)]})`, filter: `drop-shadow(0 ${H * 0.008}px ${H * 0.01}px rgba(0,0,0,.4))`}}>
        <div style={{position: 'absolute', inset: 0, background: P.ivory, filter: 'url(#stickerTorn)'}} />
        <div style={{position: 'relative', padding: `${fs * 0.6}px ${fs * 0.5}px`, fontFamily: SERIF, fontWeight: 900, fontSize: fs, lineHeight: 1.7, color: P.ink, display: 'flex', flexWrap: 'wrap'}}>
          {line.map((c, i) => {
            const isTa = c === '他';
            const on = isTa && f >= T(37.0) + (k++) * 5;
            return (
              <span key={i} style={{position: 'relative', display: 'inline-block'}}>
                {on ? <span style={{position: 'absolute', left: '-0.06em', right: '-0.06em', top: '0.2em', bottom: '0.05em', background: P.yellow, mixBlendMode: 'multiply'}} /> : null}
                <span style={{position: 'relative'}}>{c}</span>
              </span>
            );
          })}
        </div>
      </div>
      <Label at={36.3} text="示意" x={84} y={19} size={1.8} color={P.ivory} />
      <Cut at={38.6} text="谁是谁？" x={20} y={58} size={7} dark />
      <Strip at={39.4} text="读者得来回翻页" x={24} y={74} size={3} bg={P.ivory} fg={P.ink} rot={1} />
    </>
  );
};

/** Morrison's bracket trick, typeset */
const TypeCard: React.FC<{at: number}> = ({at}) => {
  const {st, H} = useS();
  const s = st(at);
  if (s < 0) return null;
  const fs = H * 0.04;
  return (
    <div style={{position: 'absolute', left: '6%', top: '58%', width: '88%', transform: `rotate(1deg) scale(${SLAP[Math.min(s, 3)]})`, filter: `drop-shadow(0 ${H * 0.008}px ${H * 0.01}px rgba(0,0,0,.4))`}}>
      <div style={{position: 'absolute', inset: 0, background: P.ivory, filter: 'url(#stickerTorn)'}} />
      <div style={{position: 'relative', padding: `${fs * 0.5}px ${fs * 0.6}px`}}>
        <div style={{fontFamily: NUM, fontWeight: 600, fontSize: fs * 0.9, color: P.slate}}>I saw her.</div>
        <div style={{fontFamily: SERIF, fontWeight: 900, fontSize: fs * 1.4, color: P.ink, marginTop: fs * 0.3}}>
          我见他<span style={{position: 'relative', display: 'inline-block'}}>
            {s >= 6 ? <span style={{position: 'absolute', left: 0, right: 0, top: '0.25em', bottom: '0.05em', background: P.yellow, mixBlendMode: 'multiply'}} /> : null}
            <span style={{position: 'relative', color: P.red}}>（妇人）</span>
          </span>
        </div>
      </div>
    </div>
  );
};

/** an English line from a novel (illustrative) with he / she picked out */
const EnLine: React.FC<{at: number}> = ({at}) => {
  const {st, f, H} = useS();
  const s = st(at);
  if (s < 0) return null;
  const on = f >= T(31.2);
  const w = (t: string, c: string) => <span style={{background: on ? c : 'transparent', color: on ? P.ivory : P.ink, padding: '0 0.12em'}}>{t}</span>;
  return (
    <div style={{position: 'absolute', left: '8%', top: '23.5%', width: '84%', transform: `rotate(-1deg) scale(${SLAP[Math.min(s, 3)]})`, filter: `drop-shadow(0 ${H * 0.006}px ${H * 0.008}px rgba(0,0,0,.35))`}}>
      <div style={{position: 'absolute', inset: 0, background: '#FFFFFF', filter: 'url(#stickerTorn)'}} />
      <div style={{position: 'relative', padding: `${H * 0.014}px ${H * 0.02}px`, fontFamily: NUM, fontWeight: 600, fontSize: H * 0.026, color: P.ink, lineHeight: 1.4}}>
        “{w('He', P.blue)} told {w('her', P.rose)} that {w('she', P.rose)} was right, and {w('he', P.blue)} left.”
      </div>
    </div>
  );
};

const RedLine: React.FC<{at: number}> = ({at}) => {
  const {f, W, H} = useS();
  const p = Math.max(0, Math.min(1, (f - T(at)) / 10));
  if (p <= 0) return null;
  return <div style={{position: 'absolute', left: W * 0.497, top: H * 0.24, width: W * 0.012, height: H * 0.36 * p, background: P.red, filter: 'url(#markerEdge)'}} />;
};

const Stamp: React.FC<{at: number; text: string; x: number; y: number; small?: boolean}> = ({at, text, x, y, small = false}) => {
  const {f, H} = useS();
  if (f < T(at)) return null;
  const STAMP = [0.78, 1.26, 1.15, 0.95, 0.92, 0.97, 1.0];
  const sc = STAMP[Math.min(f - T(at), STAMP.length - 1)];
  const fs = H * (small ? 0.05 : 0.09);
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, transform: `translate(-50%,-50%) rotate(-8deg) scale(${sc})`, border: `${fs * 0.08}px solid ${P.red}`, padding: `${fs * 0.08}px ${fs * 0.25}px`, borderRadius: fs * 0.08, background: 'rgba(247,243,234,.92)', filter: 'url(#crayon)'}}>
      <span style={{fontFamily: SERIF, fontWeight: 900, fontSize: fs, color: P.red, letterSpacing: '0.1em'}}>{text}</span>
    </div>
  );
};

/** 他 → 她: same sound, one radical apart */
const Flip: React.FC = () => {
  const {f, H} = useS();
  const swap = f >= T(158.6);
  return (
    <>
      <Cut at={154.1} text="怎么翻盘？" x={8} y={6} size={6.6} />
      <Glyph at={155.9} ch="" x={50} y={38} size={26} bg={P.ivory} rot={-2}>
        <span style={{position: 'relative', display: 'inline-block'}}>
          <span style={{color: swap ? P.red : P.ink}}>{swap ? '她' : '他'}</span>
        </span>
      </Glyph>
      <Strip at={156.4} text="读音一样：tā" x={8} y={56} size={3.4} bg={P.ink} rot={-1} font={NUM} />
      <Strip at={158.6} text="字形只差一个偏旁" x={12} y={63} size={3.4} bg={P.red} rot={1} />
      <Strip at={160.7} text="说话一个字都不用改" x={8} y={72} size={3} bg={P.ink} rot={-1} />
      <Strip at={162.4} text="几乎没有学习成本" x={14} y={80} size={4} bg={P.ivory} fg={P.ink} rot={1} />
      {swap && f < T(158.6) + 6 ? <div style={{position: 'absolute', left: '50%', top: '38%', width: H * 0.3, height: H * 0.3, marginLeft: -H * 0.15, marginTop: -H * 0.15, borderRadius: '50%', border: `${H * 0.006}px solid ${P.red}`, opacity: 1 - (f - T(158.6)) / 6}} /> : null}
    </>
  );
};

/** floating music notes */
const Notes: React.FC<{at: number}> = ({at}) => {
  const {f, H} = useS();
  if (f < T(at)) return null;
  const t = (f - T(at)) / 24;
  return (
    <>
      {['♪', '♫', '♪'].map((n, i) => (
        <div key={i} style={{position: 'absolute', left: `${12 + i * 13}%`, top: `${74 - ((t * 3 + i * 4) % 14)}%`, fontFamily: NUM, fontSize: H * 0.05, color: i === 1 ? P.red : P.ink, opacity: 0.85}}>{n}</div>
      ))}
    </>
  );
};

/** “tā lái le” speech bubble */
const Bubble: React.FC<{at: number}> = ({at}) => {
  const {st, H} = useS();
  const s = st(at);
  if (s < 0) return null;
  return (
    <div style={{position: 'absolute', left: '14%', top: '30%', width: '72%', transform: `rotate(-2deg) scale(${SLAP[Math.min(s, 3)]})`, filter: `drop-shadow(0 ${H * 0.008}px ${H * 0.01}px rgba(0,0,0,.45))`}}>
      <div style={{background: P.ivory, borderRadius: H * 0.04, padding: `${H * 0.03}px ${H * 0.03}px`, textAlign: 'center'}}>
        <div style={{fontFamily: NUM, fontWeight: 700, fontSize: H * 0.034, color: P.slate}}>tā lái le</div>
        <div style={{fontFamily: SANS, fontWeight: 900, fontSize: H * 0.07, color: P.ink, lineHeight: 1.2, whiteSpace: 'nowrap'}}>“TA 来了”</div>
      </div>
      <div style={{position: 'absolute', left: '22%', bottom: -H * 0.035, width: 0, height: 0, borderLeft: `${H * 0.025}px solid transparent`, borderRight: `${H * 0.025}px solid transparent`, borderTop: `${H * 0.04}px solid ${P.ivory}`}} />
    </div>
  );
};

/** the asymmetry: five women + one man = 他们 */
const Asym: React.FC = () => {
  const {f} = useS();
  const man = f >= T(217.6);
  const people = [P.rose, P.rose, P.rose, P.rose, P.rose];
  return (
    <>
      <Strip at={214.0} text="一个小小的不对称" x={6} y={7} size={3.6} bg={P.ink} />
      {f >= T(216.1) ? people.map((c, i) => <Person key={i} x={8 + i * 14} y={22} s={7.5} color={c} />) : null}
      {man ? <Person x={78} y={22} s={7.5} color={P.blue} /> : null}
      <Glyph at={216.4} ch="她们" x={34} y={46} size={9} bg={P.ivory} rot={-2} />
      <Mark at={218.4} kind="strike" box={{x: 18, y: 42, w: 32, h: 7}} />
      <Glyph at={218.6} ch="他们" x={70} y={46} size={9} bg={P.yellow} rot={2} />
      <Strip at={219.5} text="“他”：默认的那一个" x={8} y={62} size={3.4} bg={P.blue} rot={-1} />
      <Strip at={222.0} text="“她”：被单独标出的那一个" x={10} y={71} size={3.4} bg={P.rose} rot={1} />
    </>
  );
};

const Ending: React.FC = () => {
  const {f} = useS();
  const second = f >= T(278.1);
  return (
    <>
      <Strip at={273.9} text="100 年前，人们争的是：" x={6} y={7} size={3.2} bg={P.ink} />
      <Strip at={275.4} text="要不要给女性一个字" x={8} y={14} size={4} bg={P.ivory} fg={P.ink} rot={1} />
      {!second ? <Glyph at={274.4} ch="她" x={50} y={44} size={28} bg={P.ivory} rot={-2} /> : null}
      {second ? (
        <>
          <XyeGlyph at={278.2} x={50} y={44} h={24} bg={P.ivory} rot={2} />
          <Strip at={278.3} text="100 年后，人们开始问：" x={6} y={64} size={3.2} bg={P.ink} rot={-1} />
          <Strip at={280.2} text="能不能让一个人" x={8} y={71} size={4} bg={P.yellow} fg={P.ink} rot={1} />
          <Strip at={280.9} text="不必先被一个字分类" x={10} y={78.5} size={4} bg={P.yellow} fg={P.ink} rot={-1} />
        </>
      ) : null}
      <Credit at={283.2} />
    </>
  );
};

const Credit: React.FC<{at: number}> = ({at}) => {
  const {f, H, W} = useS();
  const o = Math.min(1, Math.max(0, (f - T(at)) / 10));
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: '89%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: W * 0.02, opacity: o}}>
      <span style={{fontFamily: SANS, fontWeight: 700, fontSize: H * 0.021, color: 'rgba(247,243,234,.95)'}}>制作</span>
      <Img src={staticFile('brand/zeno-mark-dark.svg')} style={{width: H * 0.03, height: H * 0.03}} />
      <span style={{fontFamily: NUM, fontWeight: 600, fontSize: H * 0.021, color: 'rgba(247,243,234,.95)'}}>zeno.yczc</span>
    </div>
  );
};

// ---------------------------------------------------------------- watermark + composition

const Watermark: React.FC<{dark: boolean}> = ({dark}) => {
  const {height: H, width: W} = useVideoConfig();
  const c = dark ? 'rgba(242,238,230,.78)' : 'rgba(27,26,24,.7)';
  return (
    <div style={{position: 'absolute', right: W * 0.045, bottom: H * 0.03, display: 'flex', alignItems: 'center', gap: W * 0.012}}>
      <Img src={staticFile(dark ? 'brand/zeno-mark-dark.svg' : 'brand/zeno-mark.svg')} style={{width: H * 0.024, height: H * 0.024, opacity: 0.9}} />
      <span style={{fontFamily: NUM, fontWeight: 600, fontSize: H * 0.0165, color: c, letterSpacing: '0.02em'}}>zeno.yczc</span>
    </div>
  );
};

const ShotView: React.FC<{def: ShotDef; dur: number}> = ({def, dur}) => {
  const f = useCurrentFrame();
  const {fps, width: W} = useVideoConfig();
  const {C, Over, cam} = def;
  const drift = Math.min(0.012, (0.05 * fps) / dur);
  const keys = cam ? cam.map(([s, cx, cy, scale]) => ({at: T(s) - T(def.t), cx, cy, scale})) : undefined;
  const dark = DARK.has(def.bg);
  return (
    <ShotCtx.Provider value={{t0: def.t}}>
      <AbsoluteFill>
        <ColorField color={def.bg} dots={def.dots ?? 'br'} seed={Math.round(def.t) + 1} />
        <VoxCamera frame={f} fps={fps} drift={cam ? 0 : drift} keys={keys}>
          <C />
        </VoxCamera>
        {Over ? <Over /> : null}
        {def.src ? (
          <div style={{position: 'absolute', inset: 0}}>
            <div style={{position: 'absolute', left: 0, bottom: 0, width: W * 0.7, height: '100%'}}>
              <SourceLine frame={f} at={6} onDark={dark} font={SANS} text={def.src} />
            </div>
          </div>
        ) : null}
        <Watermark dark={dark} />
      </AbsoluteFill>
    </ShotCtx.Provider>
  );
};

export const TaZi: React.FC = () => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: P.ink}}>
      <CollageFilters scale={height / 1080} seed={7} />
      <Audio src={staticFile('audio/raw/tazi/script.mp3')} />
      {SHOTS.map((s, i) => {
        const from = T(s.t);
        const next = SHOTS[i + 1];
        const to = next ? T(next.t) : TAZI_DURATION;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <ShotView def={s} dur={to - from} />
          </Sequence>
        );
      })}
      <FilmLook frame={frame} grain={0.07} vignette={0.25} />
    </AbsoluteFill>
  );
};

export const SHOT_STARTS = SHOTS.map((s) => s.t);
