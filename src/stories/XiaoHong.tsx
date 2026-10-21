// 萧红 · 一生 (1080×1920, 24 fps, ≈3:50): vox-collage biography in the layout of EileenChang.tsx, cut to 《只得一生》.
// Opening: her life in one breath, the monologue from the film 《黄金时代》 (2014) laid over the music's intro (sound
// only; the pictures are her own photographs). The intro
// is lengthened by six bars (song_ext.wav = song[0:26.89] + song[7.94:], a repeat of bars B C A' whose seam mirrors
// the original A→B join) so the singing starts after the last word. Then the chronology, one shot per two bars:
// verse 1 = 呼兰 childhood, chorus 1 = Harbin and 《跋涉》, the loud hook = 鲁迅 and 《生死场》, verse 2 = Tokyo and the
// 「黄金时代」 letter, chorus 2 = war years, the second hook = Hong Kong and 《呼兰河传》, the dip at 207 s = her death.
// Beats: 6/8 feel, 114 bpm eighth pulse (data/xiaohong-beats.json; bars start at pulse 3 + 6n).
// Facts: dataviz-studio/projects/culture-language/xiao-hong-vox/FACTCHECK.md. Quotes checked against Wikisource (鲁迅
// 《生死场》序; 《呼兰河传》; 《永久的憧憬和追求》) and 中国作家网 (1936-11-19 letter). No lyrics on screen.
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  Annotate,
  CollageFilters,
  CutLetters,
  FilmLook,
  HeadlineStrip,
  PrintCutout,
  SLAP,
  Scraps,
  SfxTrack,
  SourceLine,
  VOX_FONT,
  VoxCamera,
  ColorField,
  loadLocalFont,
  type ChipStyle,
  type Scrap,
  type SfxEvent,
} from '../collage';
import beatData from './data/xiaohong-beats.json';
import assetData from './data/xiaohong-assets.json';

const F: number[] = beatData.beats; // frame of every pulse
const bar = (n: number) => 3 + 6 * n; // pulse index of bar n
// 思源黑体 / 思源宋体 / 文楷 (all OFL) subset to this film's characters, loaded before rendering
const XH_SANS = 'XH Sans';
loadLocalFont(XH_SANS, 'fonts/xh-sans-Regular.woff', '400');
loadLocalFont(XH_SANS, 'fonts/xh-sans-Bold.woff', '700');
loadLocalFont(XH_SANS, 'fonts/xh-sans-Heavy.woff', '900');
const XH_SERIF = loadLocalFont('XH Serif', 'fonts/xh-serif-black.woff', '900');
const XH_KAI = loadLocalFont('XH Kai', 'fonts/xh-kai.woff', '500');

// ---- fonts by role (one font per element) ----
const ROLE = {
  chip: {font: XH_SANS, weight: 900}, // 剪贴大字: 黑体
  strip: XH_SANS, // 信息条: 黑体
  book: XH_SERIF, // 书名: 宋体
  num: VOX_FONT.sans, // 日期数字: Libre Franklin
  quote: XH_KAI, // 原文引语: 文楷
  label: XH_SANS,
};

// ---- 呼兰 palette: snow paper, the red of her 1935 《生死场》 cover, ink, river blue-grey, sunflower ochre ----
const P = {rice: '#ECE6D8', paper: '#F7F3EA', red: '#BD3B34', ink: '#1A1917', river: '#4F6E7C', ochre: '#C9973A', pale: '#C9B9A4'};
const DARK = new Set([P.ink, P.red, P.river]);
const chips = (pairs: Array<[string, string]>): ChipStyle[] => pairs.map(([bg, fg]) => ({bg, fg, font: ROLE.chip.font, weight: ROLE.chip.weight}));
const POP = chips([[P.ink, P.rice], [P.rice, P.red], [P.red, P.rice]]);
const ON_DARK = chips([[P.rice, P.ink], [P.red, P.rice], [P.pale, P.ink]]);

const ASSETS = assetData as Record<string, {file: string; aspect: number}>;
const img = (n: string) => {
  const a = ASSETS[n];
  if (!a) throw new Error(`missing asset ${n}`);
  return {src: staticFile(a.file), aspect: a.aspect};
};

// ---- shot clock: k = pulses since the shot's first pulse ----
const ShotCtx = React.createContext({b0: 0, pace: 1});
const beatAt = (i: number) => {
  const a = Math.max(0, Math.min(F.length - 2, Math.floor(i)));
  return F[a] + (F[a + 1] - F[a]) * Math.min(1, Math.max(0, i - a));
};
const useB = () => {
  const f = useCurrentFrame();
  const {b0, pace} = React.useContext(ShotCtx);
  const {width: W, height: H, fps} = useVideoConfig();
  const B = (k: number) => Math.round(beatAt(b0 + k * pace)) - F[b0];
  const st = (k: number) => Math.floor((f - B(k)) / 2); // drawings since pulse k (collage clock on 2s)
  return {f, fps, W, H, B, st};
};

// ---------------------------------------------------------------- building blocks

const Strip: React.FC<{k: number; text: string; x: number; y: number; size?: number; bg?: string; fg?: string; rot?: number; font?: string}> = ({k, text, x, y, size = 3.2, bg = P.ink, fg = P.rice, rot = -2, font = ROLE.strip}) => {
  const {st} = useB();
  return <HeadlineStrip text={text} step={st(k)} sizePctH={size} x={x} y={y} bg={bg} fg={fg} rot={rot} font={font} />;
};

const Cut: React.FC<{k: number; text: string; x: number; y: number; size: number; dark?: boolean; per?: number; seed?: string}> = ({k, text, x, y, size, dark = false, per = 4, seed}) => {
  const {st} = useB();
  return <CutLetters text={text} step={st(k)} perChar={per} sizePctH={size} styles={dark ? ON_DARK : POP} x={x} y={y} seed={seed ?? text} />;
};

/** a work: title on a paper slip (宋体) + a note strip under it */
const Book: React.FC<{k: number; title: string; note?: string; x: number; y: number; size?: number; rot?: number; noteBg?: string}> = ({k, title, note, x, y, size = 4, rot = -2, noteBg = P.ink}) => (
  <>
    <Strip k={k} text={title} x={x} y={y} size={size} bg={P.paper} fg={P.ink} rot={rot} font={ROLE.book} />
    {note ? <Strip k={k + 1} text={note} x={x + 1.5} y={y + size * 1.45} size={2.1} bg={noteBg} fg={P.rice} rot={rot * -0.5} font={ROLE.label} /> : null}
  </>
);

/** original words: 文楷 on a paper card, wraps inside w% */
const Quote: React.FC<{k: number; text: string; by?: string; x: number; y: number; w: number; size?: number; rot?: number}> = ({k, text, by, x, y, w, size = 4.2, rot = -1}) => {
  const {st, H} = useB();
  const s = st(k);
  if (s < 0) return null;
  const fs = (size / 100) * H;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, maxWidth: `${w}%`, transform: `rotate(${rot}deg) scale(${SLAP[Math.min(s, 3)]})`, transformOrigin: '0 0', filter: `url(#stickerTorn) drop-shadow(0 ${H * 0.007}px ${H * 0.008}px rgba(0,0,0,.4))`}}>
      <div style={{position: 'absolute', inset: 0, background: P.paper}} />
      <div style={{position: 'relative', padding: `${fs * 0.32}px ${fs * 0.42}px`, fontFamily: ROLE.quote, fontWeight: 500, fontSize: fs, lineHeight: 1.38, color: P.ink, whiteSpace: 'pre-line'}}>{text}</div>
      {by && s >= 4 ? (
        <div style={{position: 'relative', padding: `0 ${fs * 0.42}px ${fs * 0.3}px`, fontFamily: ROLE.label, fontWeight: 700, fontSize: H * 0.019, color: P.red}}>{by}</div>
      ) : null}
    </div>
  );
};

const Photo: React.FC<{k: number; name: string; w: number; x: number; y: number; rot?: number; enter?: 'slap' | 'drop' | 'slide' | 'none'; pitch?: number; color?: boolean}> = ({k, name, w, x, y, rot = 0, enter = 'slap', pitch = 0.36, color = false}) => {
  const {st, W, H} = useB();
  const a = img(name);
  if (!color) return <PrintCutout src={a.src} aspect={a.aspect} widthPx={(w / 100) * W} x={x} y={y} rot={rot} step={st(k)} enter={enter} pitchPctH={pitch} paperColor="#F2EEE4" wobble={0.5} />;
  // covers, manuscripts and letters keep their own colours: a flat print with a torn sticker edge
  const s = st(k);
  if (s < 0) return null;
  const iw = (w / 100) * W;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: iw, height: iw / a.aspect, transform: `rotate(${rot}deg) scale(${SLAP[Math.min(s, 3)]})`, filter: `url(#stickerTorn) drop-shadow(0 ${H * 0.008}px ${H * 0.01}px rgba(0,0,0,.42))`}}>
      <Img src={a.src} style={{width: '100%', height: '100%', display: 'block', filter: 'saturate(0.9) contrast(1.04)'}} />
    </div>
  );
};

const Mark: React.FC<{k: number; kind: 'circle' | 'strike' | 'underline' | 'arrow'; box: {x: number; y: number; w: number; h: number}; color?: string}> = ({k, kind, box, color = P.red}) => {
  const {f, B} = useB();
  return <Annotate frame={f} at={B(k)} dur={8} kind={kind} box={box} widthPctH={0.55} color={color} seed={`${kind}${box.x}${box.y}`} />;
};

const Bits: React.FC<{k: number; items: Scrap[]; seed: string}> = ({k, items, seed}) => {
  const {st} = useB();
  return <Scraps step={st(k)} appearStep={0} seed={seed} items={items} />;
};

type ShotDef = {
  b: number; // first pulse
  bg: string;
  dots?: 'tl' | 'tr' | 'bl' | 'br' | 'none';
  year?: number; // drives the year ruler (hidden when undefined)
  age?: string;
  cam?: {from: [number, number, number]; to: [number, number, number]};
  src?: string;
  sfx?: Array<[number, SfxEvent]>;
  pace?: number;
  C: React.FC;
};

// ---------------------------------------------------------------- the monologue
// Clip placed at pulse 3 (1.62 s); speech segments measured from the clip (seconds, clip time).
const MONO_AT = F[3];
const MONO: Array<{from: number; to: number; text: string}> = [
  {from: 1.9, to: 2.8, text: '我叫萧红'},
  {from: 4.65, to: 6.2, text: '原名张乃莹'},
  {from: 7.95, to: 9.9, text: '1911年6月1日'},
  {from: 10.8, to: 11.9, text: '农历端午节'},
  {from: 13.0, to: 16.7, text: '出生于黑龙江呼兰县的一个地主家庭'},
  {from: 18.85, to: 20.1, text: '1942年'},
  {from: 20.75, to: 23.4, text: '1月22日 中午11时'},
  {from: 24.5, to: 25.3, text: '病逝于'},
  {from: 26.45, to: 31.35, text: '香港红十字会设于圣士提反女校的临时医院'},
  {from: 33.3, to: 34.05, text: '享年'},
  {from: 35.0, to: 35.95, text: '31岁'},
];
/** pulse index (fractional) at clip time t */
const monoPulse = (t: number) => (t + MONO_AT / 24 - 0.04) / 0.5264;
const MonoSubtitle: React.FC<{frame: number}> = ({frame}) => {
  const {width: W, height: H} = useVideoConfig();
  const t = (frame - MONO_AT) / 24;
  const cue = MONO.find((c) => t >= c.from - 0.1 && t < c.to + 0.5);
  if (!cue) return null;
  const o = Math.min(1, Math.max(0, Math.min((t - cue.from + 0.1) * 8, (cue.to + 0.5 - t) * 8)));
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: H * 0.905, textAlign: 'center', opacity: o}}>
      <span style={{fontFamily: ROLE.label, fontWeight: 700, fontSize: H * 0.022, color: P.paper, background: 'rgba(20,20,19,.72)', padding: `${H * 0.004}px ${W * 0.02}px`, letterSpacing: '0.04em'}}>{cue.text}</span>
    </div>
  );
};

// ---------------------------------------------------------------- the shots

const SHOTS: ShotDef[] = [
  // ── cover (frame 0 = thumbnail)
  {b: 0, bg: P.red, dots: 'none', sfx: [[1, 'titleHit']], cam: {from: [50, 50, 1.0], to: [50, 47, 1.05]}, C: () => <Cover />},
  // ── the monologue: 「我叫萧红，原名张乃莹」
  {b: 6, bg: P.ink, dots: 'none', src: '独白（声音）：电影《黄金时代》（2014）片头；图：萧红，约 1937', sfx: [[0, 'printLand'], [5, 'slam'], [9.5, 'slide']],
    C: () => (
      <>
        <Photo k={0} name="p1937" w={56} x={22} y={6} rot={-1.5} />
        <Cut k={monoPulse(1.9) - 6} text="萧红" x={9} y={62} size={11} dark />
        <Strip k={monoPulse(4.65) - 6} text="原名 张乃莹" x={10} y={74.5} size={3.6} bg={P.red} rot={2} />
      </>
    )},
  // 「1911年6月1日，农历端午节」
  {b: 18, bg: P.rice, dots: 'tr', src: '图：萧红与生母姜玉兰，约 1916', sfx: [[0, 'slam'], [1, 'printLand'], [5.4, 'popIn']],
    C: () => (
      <>
        <Strip k={0} text="1911.6.1" x={7} y={8} size={7} bg={P.ink} fg={P.rice} font={ROLE.num} />
        <Photo k={1} name="mother1916" w={46} x={50} y={20} rot={3} pitch={0.32} />
        <Cut k={monoPulse(10.8) - 18} text="端午" x={6} y={30} size={12} />
        <Strip k={monoPulse(10.8) - 17} text="农历五月初五" x={8} y={50} size={3.2} bg={P.red} rot={-1} />
      </>
    )},
  // 「出生于黑龙江呼兰县的一个地主家庭」
  {b: 27, bg: P.river, dots: 'bl', src: '图：呼兰萧红故居正房（今貌，维基共享资源）', sfx: [[0, 'printLand'], [2, 'slam'], [4, 'slide']],
    C: () => (
      <>
        <Photo k={0} name="house" w={86} x={7} y={12} rot={-2} pitch={0.3} />
        <Strip k={2} text="黑龙江 · 呼兰县" x={8} y={60} size={4.4} bg={P.rice} fg={P.ink} />
        <Strip k={4} text="一个地主家庭" x={12} y={67.5} size={3.6} bg={P.ink} rot={1} />
      </>
    )},
  // 「1942年1月22日，中午11时，病逝于」
  {b: 38, bg: P.ink, dots: 'none', sfx: [[0, 'slam'], [4, 'slide'], [11.5, 'popIn']],
    C: () => (
      <>
        <Strip k={0} text="1942.1.22" x={8} y={20} size={8} bg={P.rice} fg={P.ink} font={ROLE.num} />
        <Strip k={monoPulse(20.75) - 38} text="中午 11 时" x={10} y={32} size={4.2} bg={P.red} rot={1} />
        <Cut k={monoPulse(24.5) - 38} text="病逝" x={10} y={46} size={13} dark />
      </>
    )},
  // 「香港红十字会设于圣士提反女校的临时医院」
  {b: 52, bg: P.rice, dots: 'tl', src: '图：香港圣士提反女校校门（维基共享资源）', sfx: [[0, 'printLand'], [2, 'slam'], [4, 'slide']],
    C: () => (
      <>
        <Photo k={0} name="ststephen" w={86} x={7} y={10} rot={2} pitch={0.3} />
        <Strip k={2} text="香港 · 圣士提反女校" x={7} y={54} size={4} bg={P.ink} />
        <Strip k={4} text="红十字会设在这里的临时医院" x={10} y={61} size={3.2} bg={P.red} rot={1} />
      </>
    )},
  // 「享年31岁」
  {b: 65, bg: P.red, dots: 'br', sfx: [[2, 'slam'], [4, 'burst'], [7, 'slide']],
    C: () => (
      <>
        <Strip k={monoPulse(33.3) - 65} text="享年" x={10} y={24} size={5} bg={P.rice} fg={P.ink} />
        <Cut k={monoPulse(35.0) - 65} text="31岁" x={8} y={34} size={14} dark per={3} />
        <Strip k={monoPulse(35.0) - 63} text="（虚岁；实足 30 岁）" x={14} y={62} size={2.6} bg={P.ink} rot={1} />
      </>
    )},
  // ── her photographs, one per pulse (bars 12–14), as the music turns back to its opening phrase
  {b: bar(12), bg: P.rice, dots: 'none', src: '图：萧红照片，约 1918—1940（多为《萧红书简》、鲁迅博物馆旧藏的翻拍）', sfx: [[0, 'titleHit'], ...Array.from({length: 11}, (_, i) => [1 + i, 'printLand'] as [number, SfxEvent])],
    C: () => <Montage />},

  // ── verse 1: 呼兰 1911–1929
  {b: bar(14), bg: P.rice, dots: 'tr', year: 1911, age: '0 岁', src: '文出《永久的憧憬和追求》，1936', sfx: [[0, 'slam'], [2, 'pageTurn'], [8, 'printLand']],
    C: () => (
      <>
        <Strip k={0} text="1911" x={7} y={6} size={6} bg={P.ink} fg={P.rice} font={ROLE.num} />
        <Quote k={2} text={'「一九一一年，\n　在一个小县城里边，\n　我生在一个小地主的家里。\n　……一年之中，\n　倒有四个月飘着白雪。」'} by="——萧红《永久的憧憬和追求》" x={5} y={15} w={90} size={3.3} />
        <Photo k={8} name="child" w={46} x={48} y={52} rot={2} />
        <Strip k={9} text="童年" x={50} y={78} size={2.4} bg={P.ink} rot={1} />
      </>
    )},
  {b: bar(16), bg: P.ochre, dots: 'bl', year: 1915, age: '4 岁', src: '文出《呼兰河传》第三章；图：祖父', sfx: [[0, 'printLand'], [2, 'slam'], [4, 'pageTurn']],
    C: () => (
      <>
        <Photo k={0} name="grandfather" w={46} x={50} y={8} rot={2} />
        <Cut k={2} text="祖父" x={8} y={12} size={9} />
        <Strip k={3} text="和她最亲的人" x={9} y={26} size={3} bg={P.ink} rot={1} />
        <Quote k={4} text={'「我家有一个大花园，\n　这花园里蜂子、蝴蝶、\n　蜻蜓、蚂蚱，样样都有。」'} by="——《呼兰河传》第三章" x={5} y={46} w={90} size={3.6} />
      </>
    )},
  {b: bar(18), bg: P.rice, dots: 'tl', year: 1919, age: '8 岁', src: '文出《永久的憧憬和追求》，1936', sfx: [[0, 'slam'], [2, 'slide'], [4, 'pageTurn'], [9, 'popIn']],
    C: () => (
      <>
        <Strip k={0} text="1919 · 母亲去世" x={7} y={7} size={4} bg={P.ink} />
        <Strip k={2} text="父亲待她冷淡" x={8} y={14} size={3} bg={P.red} rot={1} />
        <Quote k={4} text={'「祖父时时把多纹的两手\n　放在我的肩上……\n　“快快长吧！长大就好了。”」'} x={5} y={24} w={90} size={3.4} />
        <Quote k={9} text={'「“长大”是“长大”了，\n　而没有“好”。」'} by="——《永久的憧憬和追求》" x={8} y={50} w={90} size={3.8} rot={1.5} />
      </>
    )},
  {b: bar(20), bg: P.river, dots: 'br', year: 1927, age: '16 岁', src: '图：约 1928 年，与同学', sfx: [[0, 'printLand'], [1, 'slam'], [3, 'slide'], [6, 'slam']],
    C: () => (
      <>
        <Photo k={0} name="classmates" w={78} x={14} y={20} rot={2} pitch={0.32} />
        <Strip k={1} text="1927" x={6} y={7} size={6} bg={P.rice} fg={P.ink} font={ROLE.num} />
        <Strip k={3} text="到哈尔滨读女子中学，学画画" x={6} y={56} size={3} bg={P.ink} />
        <Strip k={6} text="1929 · 祖父去世" x={8} y={63} size={3.8} bg={P.red} rot={1} />
      </>
    )},

  // ── chorus 1: 出走 1930–1933
  {b: bar(22), bg: P.red, dots: 'tl', year: 1930, age: '19 岁', src: '文出《永久的憧憬和追求》', sfx: [[0, 'slam'], [2, 'slam'], [4, 'slide'], [6, 'pageTurn']],
    C: () => (
      <>
        <Strip k={0} text="1930 · 父亲为她订婚" x={7} y={7} size={3.6} bg={P.ink} />
        <Cut k={2} text="出走" x={8} y={16} size={15} dark />
        <Strip k={4} text="逃婚，去北平读书" x={10} y={40} size={3.6} bg={P.rice} fg={P.ink} rot={1} />
        <Quote k={6} text={'「二十岁那年，\n　我就逃出了父亲的家庭。\n　直到现在还是\n　过着流浪的生活。」'} by="——《永久的憧憬和追求》" x={6} y={52} w={88} size={3.4} />
      </>
    )},
  {b: bar(24), bg: P.rice, dots: 'br', year: 1932, age: '20 岁', src: '图：哈尔滨东兴顺旅馆（展览图片）', sfx: [[0, 'printLand'], [1, 'slam'], [3, 'slide'], [5, 'slam'], [7, 'slide']],
    C: () => (
      <>
        <Photo k={0} name="dongxingshun" w={78} x={16} y={22} rot={2} pitch={0.3} />
        <Strip k={1} text="1932 · 哈尔滨" x={5} y={6} size={4.4} bg={P.ink} />
        <Strip k={3} text="困在东兴顺旅馆，欠下食宿费" x={6} y={13} size={2.9} bg={P.red} rot={1} />
        <Strip k={5} text="写信向《国际协报》求助" x={6} y={60} size={3.2} bg={P.ink} />
        <Strip k={7} text="来探望她的编辑之一，是萧军" x={8} y={66.5} size={3} bg={P.rice} fg={P.ink} rot={1} />
      </>
    )},
  {b: bar(26), bg: P.river, dots: 'tr', year: 1932, age: '21 岁', src: '图：1932 年哈尔滨大水；萧红与萧军在道里公园，1932', sfx: [[0, 'printLand'], [1, 'slam'], [3, 'printLand'], [5, 'slide']],
    C: () => (
      <>
        <Photo k={0} name="flood1932" w={84} x={8} y={14} rot={-2} pitch={0.3} />
        <Strip k={1} text="1932.8 · 松花江决堤" x={6} y={6} size={3.8} bg={P.rice} fg={P.ink} />
        <Photo k={3} name="park1932" w={40} x={54} y={42} rot={3} />
        <Strip k={5} text="她从大水里乘船逃出" x={6} y={50} size={3.2} bg={P.ink} />
        <Strip k={6} text="与萧军走到一起" x={8} y={56.5} size={3.2} bg={P.red} rot={1} />
      </>
    )},
  {b: bar(28), bg: P.ink, dots: 'tr', year: 1933, age: '22 岁', src: '图：萧红与萧军，1934 年离开哈尔滨前', sfx: [[0, 'slam'], [2, 'popIn'], [4, 'printLand'], [6, 'popIn'], [7, 'scribble']],
    C: () => (
      <>
        <Strip k={0} text="1933 · 笔名「悄吟」" x={6} y={6} size={3.8} bg={P.rice} fg={P.ink} />
        <Book k={2} title="《王阿嫂的死》" note="她的第一篇小说" x={6} y={14} size={4.2} />
        <Photo k={4} name="farewell1934" w={42} x={54} y={26} rot={3} />
        <Book k={6} title="《跋涉》" note="1933.10 · 与萧军合集，自费印" x={6} y={34} size={4.6} rot={1} noteBg={P.red} />
        <Strip k={7.5} text="不久即遭查禁" x={8} y={47} size={3} bg={P.red} rot={-1} />
      </>
    )},

  // ── hook: 青岛, 鲁迅 and 《生死场》 1934–1935
  {b: bar(30), bg: P.river, dots: 'bl', year: 1934, age: '23 岁', src: '图：青岛中山公园，1934；观象一路 1 号旧居（维基共享资源）', sfx: [[0, 'printLand'], [1, 'printLand'], [3, 'slam'], [5, 'popIn'], [7, 'slide']],
    C: () => (
      <>
        <Photo k={0} name="qd_house" w={70} x={4} y={18} rot={-2} pitch={0.3} />
        <Photo k={1} name="qd1934" w={28} x={68} y={14} rot={3} />
        <Strip k={3} text="1934 · 青岛" x={6} y={7} size={4.6} bg={P.rice} fg={P.ink} />
        <Book k={5} title="《生死场》" note="在这里写完" x={6} y={56} size={5} rot={-2} />
        <Strip k={7} text="和萧军给鲁迅写信" x={8} y={69} size={3.2} bg={P.red} rot={1} />
      </>
    )},
  {b: bar(32), bg: P.rice, dots: 'tr', year: 1934, age: '23 岁', src: '图：鲁迅，1933（公有领域）；内山书店（维基共享资源）', sfx: [[0, 'slam'], [1, 'printLand'], [3, 'printLand'], [5, 'slide']],
    C: () => (
      <>
        <Strip k={0} text="1934.11.30 · 上海" x={6} y={6} size={3.8} bg={P.ink} />
        <Photo k={1} name="luxun" w={50} x={46} y={12} rot={2} />
        <Photo k={3} name="uchiyama" w={46} x={4} y={18} rot={-3} pitch={0.32} />
        <Strip k={5} text="在内山书店，第一次见到鲁迅" x={6} y={58} size={3.2} bg={P.red} />
      </>
    )},
  {b: bar(34), bg: P.red, dots: 'bl', year: 1935, age: '24 岁', src: '图：《生死场》初版封面，萧红自己设计，1935.12', sfx: [[0, 'printLand'], [1, 'popIn'], [3, 'slam'], [5, 'slam'], [7, 'slide']],
    C: () => (
      <>
        <Photo k={0} name="ssc_cover" w={52} x={42} y={12} rot={2} color />
        <Book k={1} title="《生死场》" note="1935.12 · 鲁迅编「奴隶丛书」之三" x={5} y={8} size={5.2} />
        <Strip k={3} text="第一次署名" x={6} y={56} size={3.4} bg={P.ink} />
        <Cut k={5} text="萧红" x={6} y={62} size={11} dark />
        <Strip k={7} text="封面是她自己画的" x={46} y={50} size={2.8} bg={P.rice} fg={P.ink} rot={-2} />
      </>
    )},
  {b: bar(36), pace: 0.9, bg: P.rice, dots: 'tl', year: 1935, age: '24 岁', src: '文出鲁迅《萧红作〈生死场〉序》，1935.11.14；手稿：北京鲁迅博物馆', sfx: [[0, 'popIn'], [1, 'printLand'], [3, 'pageTurn'], [9, 'scribble']],
    C: () => (
      <>
        <Strip k={0} text="鲁迅为她作序" x={6} y={6} size={4} bg={P.ink} />
        <Photo k={1} name="preface_ms" w={40} x={56} y={4} rot={3} color />
        <Quote k={3} text={'「北方人民的对于生的坚强，\n　对于死的挣扎，\n　却往往已经力透纸背；\n　女性作者的细致的观察\n　和越轨的笔致，\n　又增加了不少明丽和新鲜。」'} by="——鲁迅《萧红作〈生死场〉序》" x={5} y={30} w={90} size={3.4} />
        <Mark k={9} kind="underline" box={{x: 12, y: 51.2, w: 30, h: 3}} />
      </>
    )},

  // ── verse 2: 1936
  {b: bar(39), bg: P.ochre, dots: 'br', year: 1936, age: '25 岁', src: '图：萧红与萧军，上海，1935 春；《商市街》初版，1936.8', sfx: [[0, 'printLand'], [1, 'printLand'], [3, 'popIn'], [6, 'slide']],
    C: () => (
      <>
        <Photo k={0} name="pipe1935" w={46} x={4} y={14} rot={-2} />
        <Photo k={1} name="ssj_cover" w={40} x={56} y={20} rot={3} color />
        <Book k={3} title="《商市街》" note="1936.8 · 散文集，写哈尔滨的饥寒日子" x={5} y={6} size={5} />
        <Strip k={6} text="署名「悄吟」" x={56} y={58} size={3.2} bg={P.ink} rot={1} />
      </>
    )},
  {b: bar(41), bg: P.river, dots: 'tl', year: 1936, age: '25 岁', src: '图：萧红在鲁迅家门前，1936；东京时期照片，1936', sfx: [[0, 'printLand'], [1, 'slam'], [3, 'slam'], [5, 'printLand'], [6, 'slide']],
    C: () => (
      <>
        <Photo k={0} name="steps1936" w={38} x={4} y={30} rot={-2} />
        <Strip k={1} text="1936.7" x={6} y={7} size={6} bg={P.rice} fg={P.ink} font={ROLE.num} />
        <Cut k={3} text="独赴东京" x={6} y={15} size={7} dark per={3} />
        <Photo k={5} name="portrait" w={44} x={52} y={30} rot={2} />
        <Strip k={6} text="一个人去日本，安心写作" x={6} y={70} size={3} bg={P.ink} />
      </>
    )},
  {b: bar(43), bg: P.ink, dots: 'br', year: 1936, age: '25 岁', src: '图：鲁迅，1936（公有领域）；文出萧红《回忆鲁迅先生》，1939', sfx: [[0, 'printLand'], [1, 'slam'], [3, 'slide'], [5, 'pageTurn']],
    C: () => (
      <>
        <Photo k={0} name="luxun1936" w={50} x={46} y={8} rot={-2} />
        <Strip k={1} text="1936.10.19" x={6} y={9} size={6} bg={P.rice} fg={P.ink} font={ROLE.num} />
        <Strip k={2} text="鲁迅逝世" x={7} y={19} size={4.4} bg={P.red} />
        <Strip k={3} text="她远在东京" x={7} y={27} size={3} bg={P.rice} fg={P.ink} rot={1} />
        <Quote k={5} text={'「鲁迅先生的笑声是明朗的，\n　是从心里的欢喜。」'} by="——萧红《回忆鲁迅先生》" x={5} y={52} w={90} size={3.4} />
      </>
    )},
  {b: bar(45), pace: 0.92, bg: P.rice, dots: 'tr', year: 1936, age: '25 岁', src: '信文据《萧红书简》，1936.11.19 致萧军；图：东京来信手迹', sfx: [[0, 'slam'], [1, 'printLand'], [3, 'pageTurn'], [12, 'slam']],
    C: () => (
      <>
        <Strip k={0} text="1936.11.19 · 东京来信" x={6} y={6} size={3.6} bg={P.ink} />
        <Photo k={1} name="letter" w={32} x={5} y={66} rot={-4} color />
        <Quote k={3} text={'「自由和舒适，平静和安闲，\n　经济一点也不压迫，\n　这真是黄金时代，\n　但又是多么寂寞的\n　黄金时代呀！\n　别人的黄金时代\n　是舒展着翅膀过的，\n　而我的黄金时代，\n　是在笼子过的。」'} by="——萧红致萧军" x={4} y={20} w={92} size={3.3} />
        <Cut k={12} text="黄金时代" x={42} y={71} size={6} per={3} />
      </>
    )},

  // ── chorus 2: 战乱 1937–1940
  {b: bar(48), bg: P.red, dots: 'bl', year: 1937, age: '26 岁', src: '图：在鲁迅墓前，1937；萧红与萧军最后的合影，1937', sfx: [[0, 'slam'], [1, 'printLand'], [3, 'slide'], [4, 'printLand'], [6, 'popIn']],
    C: () => (
      <>
        <Strip k={0} text="1937.1 · 回到上海" x={6} y={6} size={4} bg={P.ink} />
        <Photo k={1} name="grave1937" w={48} x={4} y={14} rot={-2} />
        <Strip k={3} text="抗战爆发，转去武汉" x={6} y={52} size={3.2} bg={P.rice} fg={P.ink} rot={1} />
        <Photo k={4} name="last1937" w={42} x={54} y={16} rot={3} />
        <Book k={6} title="《七月》" note="为胡风主编的刊物写稿" x={6} y={60} size={4.6} rot={-2} />
      </>
    )},
  {b: bar(50), bg: P.rice, dots: 'tl', year: 1938, age: '26 岁', src: '图：萧红与丁玲等，西安，1938；文出聂绀弩《在西安》', sfx: [[0, 'slam'], [1, 'slide'], [2, 'printLand'], [4, 'pageTurn']],
    C: () => (
      <>
        <Strip k={0} text="1938 · 临汾、西安" x={6} y={6} size={3.8} bg={P.ink} />
        <Strip k={1} text="与萧军分手" x={7} y={13} size={3.2} bg={P.red} rot={1} />
        <Photo k={2} name="dingling1938" w={38} x={56} y={12} rot={3} pitch={0.32} />
        <Quote k={4} text={'「女性的天空是低的，\n　羽翼是稀薄的，\n　而身边的累赘又是笨重的！」\n　……\n　「不错，我要飞，\n　但同时觉得……我会掉下来。」'} by="——萧红对聂绀弩说，见聂绀弩《在西安》" x={5} y={46} w={90} size={3.4} />
      </>
    )},
  {b: bar(52), bg: P.river, dots: 'br', year: 1939, age: '27 岁', src: '图：萧红与端木蕻良，1938；重庆，1939', sfx: [[0, 'printLand'], [1, 'slam'], [3, 'slide'], [4, 'printLand'], [6, 'slide']],
    C: () => (
      <>
        <Photo k={0} name="duanmu1938" w={44} x={52} y={8} rot={2} />
        <Strip k={1} text="1938.5 · 武汉" x={6} y={9} size={4.4} bg={P.rice} fg={P.ink} />
        <Strip k={3} text="与端木蕻良结婚" x={7} y={17} size={3.6} bg={P.red} rot={1} />
        <Photo k={4} name="cq1939" w={46} x={6} y={36} rot={-2} />
        <Strip k={6} text="1939 · 随战事迁居重庆" x={6} y={66} size={3.2} bg={P.ink} />
      </>
    )},
  {b: bar(54), bg: P.ochre, dots: 'bl', year: 1940, age: '28 岁', src: '图：香港，1940（报纸翻印）', sfx: [[0, 'printLand'], [1, 'slam'], [3, 'slide'], [4, 'slide'], [5, 'slide']],
    C: () => (
      <>
        <Photo k={0} name="hk1940" w={48} x={46} y={8} rot={-2} />
        <Strip k={1} text="1940.1 · 飞抵香港" x={5} y={8} size={4} bg={P.ink} />
        <Strip k={3} text="她走过的地方" x={5} y={56} size={2.8} bg={P.red} rot={-1} />
        <Strip k={4} text="呼兰 → 哈尔滨 → 北平 → 青岛 → 上海 → 东京" x={5} y={62} size={2.2} bg={P.rice} fg={P.ink} rot={0} />
        <Strip k={5} text="→ 武汉 → 临汾 → 西安 → 重庆 → 香港" x={9} y={66.5} size={2.2} bg={P.rice} fg={P.ink} rot={0} />
      </>
    )},
  {b: bar(56), bg: P.red, dots: 'tr', year: 1940, age: '29 岁', src: '图：《星岛日报》，1940 年连载《呼兰河传》', sfx: [[0, 'printLand'], [1, 'slam'], [3, 'popIn'], [5, 'slide']],
    C: () => (
      <>
        <Photo k={0} name="singtao" w={62} x={34} y={22} rot={2} pitch={0.3} />
        <Strip k={1} text="1940.12.20" x={5} y={6} size={5} bg={P.ink} fg={P.rice} font={ROLE.num} />
        <Book k={3} title="《呼兰河传》" note="在香港完稿" x={5} y={14} size={5} rot={-2} />
        <Strip k={5} text="先在《星岛日报》连载" x={5} y={64} size={3.2} bg={P.ink} />
      </>
    )},

  // ── second hook: 《呼兰河传》 and the end 1941–1942
  {b: bar(58), pace: 0.92, bg: P.rice, dots: 'bl', year: 1941, age: '29 岁', src: '文出《呼兰河传》第三章', sfx: [[0, 'pageTurn'], [12, 'slam']],
    C: () => (
      <>
        <Quote k={0} text={'「花开了，就像花睡醒了似的。\n　鸟飞了，就像鸟上天了似的。\n　虫子叫了，就像虫子在说话似的。\n　一切都活了。……都是自由的。\n　倭瓜愿意爬上架就爬上架，\n　愿意爬上房就爬上房。」'} by="——《呼兰河传》第三章" x={3} y={9} w={94} size={3.0} />
        <Cut k={12} text="自由" x={56} y={50} size={9} per={3} />
      </>
    )},
  {b: bar(61), bg: P.ink, dots: 'tr', year: 1941, age: '30 岁', src: '图：《呼兰河传》初版版权页，上海杂志公司，1941.5；《马伯乐》初版，1941', sfx: [[0, 'printLand'], [1, 'printLand'], [3, 'popIn'], [5, 'pageTurn']],
    C: () => (
      <>
        <Photo k={0} name="colophon" w={40} x={4} y={6} rot={-2} pitch={0.32} />
        <Photo k={1} name="mabole" w={34} x={60} y={6} rot={3} color />
        <Strip k={3} text="1941.5 · 初版，印 2000 册" x={6} y={44} size={3} bg={P.rice} fg={P.ink} />
        <Quote k={5} text={'「它是一篇叙事诗，\n　一幅多彩的风土画，\n　一串凄婉的歌谣。」'} by="——茅盾《呼兰河传》序，1946" x={6} y={52} w={88} size={4} />
      </>
    )},
  {b: bar(64), bg: P.river, dots: 'tl', year: 1942, age: '30 岁', src: '遗言据骆宾基《萧红小传》', sfx: [[0, 'slam'], [2, 'slide'], [4, 'scribble']],
    C: () => (
      <>
        <Strip k={0} text="1941.12 · 香港沦陷" x={6} y={7} size={3.8} bg={P.rice} fg={P.ink} />
        <Strip k={2} text="1942.1 · 被误诊开刀" x={6} y={14} size={3.2} bg={P.red} rot={1} />
        <Strip k={3} text="从此不能说话" x={8} y={20} size={3.2} bg={P.ink} rot={-1} />
        <Quote k={4} text={'「半生尽遭白眼冷遇……\n　身先死，不甘，不甘。」'} by="——临终写在纸上，据骆宾基《萧红小传》" x={5} y={32} w={90} size={3.8} />
      </>
    )},
  // ── the dip: her death, and the garden without her
  {b: bar(66), bg: P.ink, dots: 'none', year: 1942, age: '30 岁', src: '文出《呼兰河传》尾声；图：呼兰萧红故居（今貌）', sfx: [[0, 'slam'], [3, 'pageTurn'], [7, 'printLand']],
    C: () => (
      <>
        <Strip k={0} text="1942.1.22 · 病逝于香港" x={6} y={8} size={3.8} bg={P.rice} fg={P.ink} />
        <Quote k={3} text={'「从前那后花园的主人，\n　而今不见了。\n　老主人死了，\n　小主人逃荒去了。」'} by="——《呼兰河传》尾声" x={4} y={20} w={92} size={3.4} />
        <Photo k={7} name="house" w={68} x={16} y={50} rot={1} pitch={0.3} />
      </>
    )},
  {b: bar(69), bg: P.rice, dots: 'none', C: () => <Ending />},
];

// ---------------------------------------------------------------- cover
// Thumbnail: her own cover for the 1935 《生死场》 — the black wedge with the red 「生死场」 left open — extracted as an
// ink mask from the first edition and laid on its measured red (#BD3B34); the 1936 portrait as a printed cut-out on a
// darker disc; 「萧红」 in big 宋体.
const Cover: React.FC = () => {
  const {H, W} = useB();
  const a = img('portrait');
  const ink = img('ssc_ink');
  return (
    <AbsoluteFill>
      <Img src={ink.src} style={{position: 'absolute', left: W * -0.08, top: H * 0.0, width: W * 1.16, height: (W * 1.16) / ink.aspect, opacity: 0.9}} />
      <PrintCutout src={a.src} aspect={a.aspect} widthPx={W * 0.62} x={4} y={36} rot={-2} step={4} enter="none" pitchPctH={0.38} paperColor="#F2EEE4" wobble={0} />
      <div style={{position: 'absolute', right: W * 0.06, top: H * 0.55, display: 'flex', flexDirection: 'column', alignItems: 'flex-end'}}>
        <div style={{fontFamily: ROLE.book, fontWeight: 900, fontSize: W * 0.25, lineHeight: 1.0, color: P.paper}}>萧</div>
        <div style={{fontFamily: ROLE.book, fontWeight: 900, fontSize: W * 0.25, lineHeight: 1.0, color: P.paper}}>红</div>
        <div style={{fontFamily: ROLE.book, fontWeight: 900, fontSize: W * 0.07, letterSpacing: '0.18em', color: P.ink, marginTop: H * 0.012}}>一生</div>
        <div style={{fontFamily: ROLE.num, fontWeight: 700, fontSize: W * 0.036, letterSpacing: '0.1em', color: P.ink, marginTop: H * 0.006}}>1911—1942</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- montage: her photos, one per pulse
const MONTAGE: Array<{name: string; label: string; x: number; y: number; rot: number; w?: number}> = [
  {name: 'child', label: '童年', x: 3, y: 3, rot: -3},
  {name: 'classmates', label: '约 1928', x: 35, y: 5, rot: 2, w: 34},
  {name: 'park1932', label: '1932', x: 71, y: 2, rot: -2, w: 26},
  {name: 'farewell1934', label: '1934', x: 2, y: 23, rot: 2, w: 26},
  {name: 'qd1934', label: '1934', x: 30, y: 24, rot: -2, w: 18},
  {name: 'pipe1935', label: '1935', x: 50, y: 22, rot: 3, w: 24},
  {name: 'steps1936', label: '1936', x: 75, y: 24, rot: -3, w: 22},
  {name: 'portrait', label: '1936', x: 3, y: 46, rot: -2},
  {name: 'p1937', label: '约 1937', x: 36, y: 46, rot: 1, w: 24},
  {name: 'xa1938', label: '1938', x: 62, y: 44, rot: -3, w: 14},
  {name: 'cq1939', label: '1939', x: 76, y: 49, rot: 2, w: 22},
];
const Montage: React.FC = () => {
  const {st} = useB();
  return (
    <>
      {MONTAGE.map((m, i) => (
        <React.Fragment key={i}>
          <Photo k={1 + i} name={m.name} w={m.w ?? 28} x={m.x} y={m.y} rot={m.rot} pitch={0.3} />
          {st(1.5 + i) >= 0 ? <Strip k={1.5 + i} text={m.label} x={m.x + 1} y={m.y + 15} size={1.8} bg={P.ink} rot={0} font={ROLE.label} /> : null}
        </React.Fragment>
      ))}
      <Strip k={0} text="萧红 · 1911—1942" x={8} y={72} size={4.6} bg={P.red} rot={-2} />
    </>
  );
};

// ---------------------------------------------------------------- ending
const Ending: React.FC = () => {
  const {f, H} = useB();
  const fade = (a: number) => Math.min(1, Math.max(0, a));
  return (
    <AbsoluteFill>
      <Photo k={0} name="grave_rb" w={44} x={5} y={8} rot={-2} />
      <Photo k={2} name="tomb_gz" w={44} x={52} y={16} rot={2} pitch={0.32} />
      <Strip k={4} text="她葬在香港浅水湾" x={6} y={48} size={3} bg={P.ink} />
      <Strip k={4.5} text="图：戴望舒在浅水湾萧红墓前" x={6} y={43.5} size={1.7} bg={P.rice} fg={P.ink} rot={0} font={ROLE.label} />
      <Strip k={5} text="1957 年迁葬广州银河公墓" x={8} y={54} size={3} bg={P.red} rot={1} />
      <div style={{position: 'absolute', left: '8%', top: '66%', opacity: fade((f - 60) / 18), fontFamily: ROLE.book, fontWeight: 900, fontSize: H * 0.034, color: P.ink}}>萧红 1911—1942</div>
      <Credit at={72} />
    </AbsoluteFill>
  );
};

/** producer credit, bottom of the closing shot */
const Credit: React.FC<{at: number}> = ({at}) => {
  const {f, H, W} = useB();
  const o = Math.min(1, Math.max(0, (f - at) / 14));
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: '90.5%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: W * 0.02, opacity: o}}>
      <span style={{fontFamily: ROLE.label, fontWeight: 700, fontSize: H * 0.021, color: P.ink}}>制作</span>
      <Img src={staticFile('brand/zeno-mark.svg')} style={{width: H * 0.03, height: H * 0.03}} />
      <span style={{fontFamily: ROLE.num, fontWeight: 500, fontSize: H * 0.021, color: P.ink, letterSpacing: '0.02em'}}>zeno.yczc</span>
    </div>
  );
};

// ---------------------------------------------------------------- year ruler 1911–1942
const WORK_YEARS = [1933, 1935, 1936, 1939, 1940, 1941];
const Y0 = 1911;
const Y1 = 1942;
const YearRuler: React.FC<{frame: number}> = ({frame}) => {
  const {width: W, height: H} = useVideoConfig();
  let idx = 0;
  for (let i = 0; i < SHOTS.length; i++) if (frame >= F[SHOTS[i].b]) idx = i;
  const shot = SHOTS[idx];
  if (shot.year === undefined) return null;
  let prevYear = shot.year;
  for (let i = idx - 1; i >= 0; i--) if (SHOTS[i].year !== undefined) { prevYear = SHOTS[i].year!; break; }
  const t = Math.min(1, (frame - F[shot.b]) / 10);
  const e = t * t * (3 - 2 * t);
  const year = prevYear + (shot.year - prevYear) * e;
  const dark = DARK.has(shot.bg);
  const ink = dark ? 'rgba(236,230,216,.85)' : 'rgba(26,25,23,.8)';
  const x0 = W * 0.08;
  const x1 = W * 0.92;
  const X = (y: number) => x0 + ((y - Y0) / (Y1 - Y0)) * (x1 - x0);
  const yLine = H * 0.885;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <line x1={x0} x2={x1} y1={yLine} y2={yLine} stroke={ink} strokeWidth={H * 0.0018} />
      {[1911, 1920, 1930, 1942].map((y) => (
        <g key={y}>
          <line x1={X(y)} x2={X(y)} y1={yLine - H * 0.006} y2={yLine + H * 0.006} stroke={ink} strokeWidth={H * 0.0016} />
          <text x={X(y)} y={yLine + H * 0.022} textAnchor="middle" fontFamily={ROLE.num} fontWeight={600} fontSize={H * 0.0135} fill={ink}>{y}</text>
        </g>
      ))}
      {WORK_YEARS.filter((y) => y <= year + 0.01).map((y) => (
        <rect key={y} x={X(y) - H * 0.002} y={yLine - H * 0.016} width={H * 0.004} height={H * 0.012} fill={dark ? P.pale : P.red} />
      ))}
      <rect x={x0} y={yLine - H * 0.0018} width={X(year) - x0} height={H * 0.0036} fill={P.red} />
      <circle cx={X(year)} cy={yLine} r={H * 0.0075} fill={P.red} stroke={dark ? P.rice : P.paper} strokeWidth={H * 0.002} />
      <text x={X(year)} y={yLine - H * 0.024} textAnchor="middle" fontFamily={ROLE.num} fontWeight={800} fontSize={H * 0.019} fill={ink}>{Math.round(year)}</text>
      {shot.age ? (
        <text x={X(year)} y={yLine - H * 0.045} textAnchor="middle" fontFamily={ROLE.label} fontWeight={700} fontSize={H * 0.016} fill={dark ? P.pale : P.red}>{shot.age}</text>
      ) : null}
    </svg>
  );
};

// ---------------------------------------------------------------- composition

export const XIAOHONG_DURATION = Math.round(229.6 * 24); // song_ext.wav to its last sample
const CUES = SHOTS.flatMap((s) => (s.sfx ?? []).map(([k, event]) => ({at: Math.round(beatAt(s.b + k * (s.pace ?? 1))), event, db: -24})));

const ShotView: React.FC<{def: ShotDef; dur: number}> = ({def, dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {C, cam} = def;
  const drift = Math.min(0.015, (0.05 * fps) / dur);
  const keys = cam ? [{at: 0, cx: cam.from[0], cy: cam.from[1], scale: cam.from[2]}, {at: 150, cx: cam.to[0], cy: cam.to[1], scale: cam.to[2]}] : undefined;
  return (
    <ShotCtx.Provider value={{b0: def.b, pace: def.pace ?? 1}}>
      <AbsoluteFill>
        <ColorField color={def.bg} dots={def.dots ?? 'br'} seed={def.b + 1} />
        <VoxCamera frame={f} fps={fps} drift={drift} keys={keys}>
          <C />
        </VoxCamera>
        {def.src ? <SourceLine frame={f} at={6} onDark={DARK.has(def.bg)} font={ROLE.label} text={def.src} /> : null}
      </AbsoluteFill>
    </ShotCtx.Provider>
  );
};

export const XiaoHong: React.FC = () => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();
  // the song opens on the cover, dips to −8 dB under the monologue (voice ≥ 8 dB above it) and comes up as the
  // singing starts (bar 14)
  const songVol = (fr: number) =>
    interpolate(fr, [0, MONO_AT + 1.2 * 24, MONO_AT + 1.8 * 24, MONO_AT + 36.2 * 24, F[bar(14)]], [0.6, 0.6, 0.38, 0.38, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{background: P.ink}}>
      <CollageFilters scale={height / 1080} seed={11} />
      <Audio src={staticFile('audio/raw/xiaohong/song_ext.wav')} volume={songVol} />
      <Sequence from={MONO_AT}>
        <Audio src={staticFile('audio/raw/xiaohong/golden_voice.wav')} />
      </Sequence>
      <SfxTrack cues={CUES} />
      {SHOTS.map((s, i) => {
        const from = i === 0 ? 0 : F[s.b];
        const to = i + 1 < SHOTS.length ? F[SHOTS[i + 1].b] : XIAOHONG_DURATION;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <ShotView def={s} dur={to - from} />
          </Sequence>
        );
      })}
      <YearRuler frame={frame} />
      <MonoSubtitle frame={frame} />
      <FilmLook frame={frame} grain={0.08} vignette={0.3} />
    </AbsoluteFill>
  );
};

// storyboard: one frame per shot, after its last entrance
export const XIAOHONG_SHOT_STARTS = SHOTS.map((s, i) => (i === 0 ? 0 : F[s.b]));
