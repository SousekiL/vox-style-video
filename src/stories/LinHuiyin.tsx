// 林徽因 (1080×1920, 24 fps, ≈3:21): vox-collage biography with the weight on her architecture: Penn, the Society for
// Research in Chinese Architecture, the Tang hall at 佛光寺, the national emblem, cloisonné, the reliefs of the Monument to the
// People's Heroes; the poetry stays in, briefly. Told plainly, in order; the 2024 posthumous Penn degree comes last.
// Year ruler 1904–1955.
// Song: supplied by the user (Bilibili audio, 200.6 s); compound-time feel, shots cut on tracked beats
// (data/linhuiyin-beats.json): 0–75 s = title and 1904–1931; the quieter verse 75–125 s =
// fieldwork, the poem, 佛光寺, 李庄, Tsinghua; the loud chorus 125–150 s = emblem, cloisonné, monument; 150 s on = 1955, the
// 金岳霖's elegy, the tombstone, the 2024 degree, closing card. No lyrics on screen.
// Facts: OpenMontage projects/lin-huiyin-vox/artifacts/FACTCHECK.md. Photos: Wikimedia Commons; the user clears rights.
// Photos and song are kept local only (.gitignore).
import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
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
  SfxTrack,
  SourceLine,
  VOX_FONT,
  VoxCamera,
  loadLocalFont,
  type ChipStyle,
  type Scrap,
  type SfxEvent,
} from '../collage';
import beatData from './data/linhuiyin-beats.json';
import assetData from './data/linhuiyin-assets.json';

const F: number[] = beatData.beats; // frame of every beat
// 思源黑体 / 思源宋体 / 霞鹜文楷 / 志莽行书 (all OFL), subset to this film's characters
const LH_SANS = 'LH Sans';
loadLocalFont(LH_SANS, 'fonts/lh-sans-Regular.woff', '400');
loadLocalFont(LH_SANS, 'fonts/lh-sans-Bold.woff', '700');
loadLocalFont(LH_SANS, 'fonts/lh-sans-Heavy.woff', '900');
const LH_SERIF = loadLocalFont('LH Serif', 'fonts/lh-serif-black.woff', '900');
const LH_KAI = loadLocalFont('LH Kai', 'fonts/lh-kai.woff', '500');
const LH_BRUSH = loadLocalFont('LH Brush', 'fonts/lh-brush.woff', '400');

// ---- fonts by role (one font per element) ----
const ROLE = {
  chip: {font: LH_SANS, weight: 900}, // 剪贴大字: 黑体
  strip: LH_SANS, // 信息条: 黑体
  film: LH_SERIF, // 片名、书名: 宋体
  brush: LH_BRUSH, // 片头/片尾姓名: 行书
  num: VOX_FONT.sans, // 日期数字、英文名: Libre Franklin
  quote: LH_KAI, // 回忆录大意: 文楷
  label: LH_SANS,
};

// ---- palette: spring for 《你是人间的四月天》 and old timber for the buildings — paper, celadon tile, vermilion, ink ----
// Themes for the bake-off gate (14-vox-collage §4): the same keys, different values; the film reads one at render time.
type Pal = {paper: string; mist: string; rice: string; ink: string; red: string; jade: string; pale: string; slate: string};
export const LH_THEMES: Record<string, Pal & {name: string}> = {
  spring: {name: '四月天（宣纸 · 青瓷 · 朱红）', paper: '#EFE9DC', mist: '#C9C4B6', rice: '#F7F3EA', ink: '#1E1E1C', red: '#B8432F', jade: '#4F6F62', pale: '#DCD3BF', slate: '#4A5A6A'},
  series: {name: '系列灰（同阮玲玉 · 李香兰）', paper: '#DCD8D1', mist: '#A9A6A0', rice: '#F2EFE8', ink: '#1D1C1B', red: '#B0313B', jade: '#56636F', pale: '#CFC9BF', slate: '#2E3238'},
  blueprint: {name: '蓝图（晒图蓝 · 米白 · 朱红）', paper: '#E8E4D8', mist: '#BFC6CC', rice: '#F5F2EA', ink: '#1C2430', red: '#C0392B', jade: '#24476B', pale: '#D6D2C4', slate: '#33414F'},
  timber: {name: '木构（米黄 · 木褐 · 黛青）', paper: '#ECE3CF', mist: '#C8B79A', rice: '#F6F0E2', ink: '#221C16', red: '#A8432C', jade: '#5C4632', pale: '#DDCFB2', slate: '#3D4A4C'},
};
const P: Pal = {...LH_THEMES.blueprint}; // picked at the bake-off
type BgKey = keyof Pal;
const DARK_KEYS = new Set<BgKey>(['ink', 'jade', 'slate', 'red']);
const chips = (pairs: Array<[string, string]>): ChipStyle[] => pairs.map(([bg, fg]) => ({bg, fg, font: ROLE.chip.font, weight: ROLE.chip.weight}));
const pop = () => chips([[P.ink, P.rice], [P.rice, P.red], [P.jade, P.rice]]);
const onDark = () => chips([[P.rice, P.ink], [P.red, P.rice], [P.pale, P.ink]]);

const ASSETS = assetData as Record<string, {file: string; aspect: number}>;
const img = (n: string) => {
  const a = ASSETS[n];
  if (!a) throw new Error(`missing asset ${n}`);
  return {src: staticFile(a.file), aspect: a.aspect};
};

// ---- shot clock: k = beats since the shot's first beat ----
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
  const st = (k: number) => Math.floor((f - B(k)) / 2); // drawings since beat k (collage clock on 2s)
  return {f, fps, W, H, B, st};
};

// ---------------------------------------------------------------- building blocks

const Strip: React.FC<{k: number; text: string; x: number; y: number; size?: number; bg?: string; fg?: string; rot?: number; font?: string}> = ({k, text, x, y, size = 3.2, bg = P.ink, fg = P.rice, rot = -2, font = ROLE.strip}) => {
  const {st} = useB();
  return <HeadlineStrip text={text} step={st(k)} sizePctH={size} x={x} y={y} bg={bg} fg={fg} rot={rot} font={font} />;
};
const DateStrip: React.FC<{k: number; text: string; x?: number; y?: number; size?: number}> = ({k, text, x = 7, y = 8, size = 5.4}) => (
  <Strip k={k} text={text} x={x} y={y} size={size} bg={P.ink} fg={P.rice} rot={-1.5} font={ROLE.num} />
);
const Tag: React.FC<{k: number; text: string; x: number; y: number; size?: number; bg?: string; fg?: string; rot?: number}> = ({k, text, x, y, size = 2.6, bg = P.red, fg = P.rice, rot = -1}) => (
  <Strip k={k} text={text} x={x} y={y} size={size} bg={bg} fg={fg} rot={rot} />
);
const Film: React.FC<{k: number; title: string; note?: string; x: number; y: number; size?: number; rot?: number}> = ({k, title, note, x, y, size = 3.8, rot = -2}) => (
  <>
    <Strip k={k} text={title} x={x} y={y} size={size} bg={P.rice} fg={P.ink} rot={rot} font={ROLE.film} />
    {note ? <Strip k={k + 0.5} text={note} x={x + 1.5} y={y + size * 1.45} size={2.1} bg={P.ink} fg={P.rice} rot={rot * -0.5} font={ROLE.label} /> : null}
  </>
);
const Cut: React.FC<{k: number; text: string; x: number; y: number; size: number; dark?: boolean; per?: number; seed?: string}> = ({k, text, x, y, size, dark = false, per = 2, seed}) => {
  const {st} = useB();
  return <CutLetters text={text} step={st(k)} perChar={per} sizePctH={size} styles={dark ? onDark() : pop()} x={x} y={y} seed={seed ?? text} />;
};
/** a photograph as a printed halftone clipping with a torn white edge */
const Photo: React.FC<{k: number; name: string; w: number; x: number; y: number; rot?: number; enter?: 'slap' | 'drop' | 'slide' | 'none'; pitch?: number}> = ({k, name, w, x, y, rot = 0, enter = 'slap', pitch = 0.34}) => {
  const {st, W} = useB();
  const a = img(name);
  return <PrintCutout src={a.src} aspect={a.aspect} widthPx={(w / 100) * W} x={x} y={y} rot={rot} step={st(k)} enter={enter} pitchPctH={pitch} paperColor="#F2EEE4" wobble={0.5} />;
};
/** a poster or printed ad keeps its own (faded) colours: flat print with a torn sticker edge */
const Print: React.FC<{k: number; name: string; w: number; x: number; y: number; rot?: number}> = ({k, name, w, x, y, rot = 0}) => {
  const {st, W, H} = useB();
  const s = st(k);
  if (s < 0) return null;
  const a = img(name);
  const iw = (w / 100) * W;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: iw, height: iw / a.aspect, transform: `rotate(${rot}deg) scale(${SLAP[Math.min(s, 3)]})`, filter: `url(#stickerTorn) drop-shadow(0 ${H * 0.008}px ${H * 0.01}px rgba(0,0,0,.42))`}}>
      <Img src={a.src} style={{width: '100%', height: '100%', display: 'block', filter: 'saturate(0.55) sepia(0.2) contrast(1.05)'}} />
    </div>
  );
};
/** paraphrase card (文楷), clearly marked as 大意 when it is not a verbatim quote */
const Note: React.FC<{k: number; text: string; by?: string; x: number; y: number; w: number; size?: number; rot?: number}> = ({k, text, by, x, y, w, size = 3.4, rot = -1}) => {
  const {st, H} = useB();
  const s = st(k);
  if (s < 0) return null;
  const fs = (size / 100) * H;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, maxWidth: `${w}%`, transform: `rotate(${rot}deg) scale(${SLAP[Math.min(s, 3)]})`, transformOrigin: '0 0', filter: `url(#stickerTorn) drop-shadow(0 ${H * 0.007}px ${H * 0.008}px rgba(0,0,0,.4))`}}>
      <div style={{position: 'absolute', inset: 0, background: P.rice}} />
      <div style={{position: 'relative', padding: `${fs * 0.36}px ${fs * 0.46}px`, fontFamily: ROLE.quote, fontWeight: 500, fontSize: fs, lineHeight: 1.42, color: P.ink, whiteSpace: 'pre-line'}}>{text}</div>
      {by && s >= 4 ? <div style={{position: 'relative', padding: `0 ${fs * 0.46}px ${fs * 0.34}px`, fontFamily: ROLE.label, fontWeight: 700, fontSize: H * 0.019, color: P.red}}>{by}</div> : null}
    </div>
  );
};
const Mark: React.FC<{k: number; kind: 'circle' | 'strike' | 'underline' | 'arrow'; box: {x: number; y: number; w: number; h: number}; color?: string}> = ({k, kind, box, color = P.red}) => {
  const {f, B} = useB();
  return <Annotate frame={f} at={B(k)} dur={8} kind={kind} box={box} widthPctH={0.6} color={color} seed={`${kind}${box.x}${box.y}`} />;
};
const Bits: React.FC<{k: number; items: Scrap[]; seed: string}> = ({k, items, seed}) => {
  const {st} = useB();
  return <Scraps step={st(k)} appearStep={0} seed={seed} items={items} />;
};
const Brush: React.FC<{k: number; text: string; x: number; y: number; size: number; color?: string; opacity?: number; spacing?: string}> = ({k, text, x, y, size, color = P.ink, opacity = 1, spacing = '0.08em'}) => {
  const {f, B, H} = useB();
  const o = Math.min(1, Math.max(0, (f - B(k)) / 8)) * opacity;
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, fontFamily: ROLE.brush, fontSize: H * (size / 100), lineHeight: 1, color, opacity: o, letterSpacing: spacing, whiteSpace: 'nowrap'}}>
      {text}
    </div>
  );
};

/** producer credit on the closing card: 制作 + mark + zeno.yczc */
const Credit: React.FC<{k: number}> = ({k}) => {
  const {f, B, H, W} = useB();
  const o = Math.min(1, Math.max(0, (f - B(k)) / 14));
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: '92%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: W * 0.02, opacity: o}}>
      <span style={{fontFamily: ROLE.label, fontWeight: 700, fontSize: H * 0.021, color: 'rgba(247,243,234,.92)'}}>制作</span>
      <Img src={staticFile('brand/zeno-mark-dark.svg')} style={{width: H * 0.03, height: H * 0.03}} />
      <span style={{fontFamily: ROLE.num, fontWeight: 500, fontSize: H * 0.021, color: 'rgba(247,243,234,.92)', letterSpacing: '0.02em'}}>zeno.yczc</span>
    </div>
  );
};

/** the seven characters on her tombstone, cut in stone, vertical */
const Stone: React.FC<{k: number; x: number; y: number; w: number; h: number}> = ({k, x, y, w, h}) => {
  const {st, W, H} = useB();
  const s = st(k);
  if (s < 0) return null;
  const chars = [...'建筑师林徽因墓'];
  const shown = Math.min(chars.length, Math.max(0, s - 2));
  const fs = (h / 100) * H * 0.105;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: (w / 100) * W, height: (h / 100) * H, transform: `scale(${SLAP[Math.min(s, 3)]})`, filter: `drop-shadow(0 ${H * 0.01}px ${H * 0.014}px rgba(0,0,0,.5))`}}>
      <div style={{position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #8E8C86, #6E6C66)', filter: 'url(#torn)'}} />
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: fs * 0.18}}>
        {chars.map((c, i) => (
          <div key={i} style={{fontFamily: ROLE.film, fontWeight: 900, fontSize: fs, lineHeight: 1, color: i < shown ? '#2A2926' : 'transparent', textShadow: i < shown ? '0 1px 0 rgba(255,255,255,.25), 0 -1px 0 rgba(0,0,0,.35)' : 'none'}}>
            {c}
          </div>
        ))}
      </div>
    </div>
  );
};

/** a large rolling number on the collage clock */
const Count: React.FC<{k: number; to: number; prefix?: string; suffix?: string; x: number; y: number; size: number; color?: string}> = ({k, to, prefix = '', suffix = '', x, y, size, color = P.ink}) => {
  const {f, B, H} = useB();
  const at = B(k);
  if (f < at) return null;
  const p = Math.min(1, (Math.floor((f - at) / 2) * 2) / 30);
  const v = Math.round(to * (1 - Math.pow(1 - p, 3)));
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, fontFamily: ROLE.num, fontWeight: 800, fontSize: H * (size / 100), lineHeight: 1, color, fontVariantNumeric: 'tabular-nums'}}>
      {prefix}
      {v}
      <span style={{fontFamily: ROLE.strip, fontWeight: 900, fontSize: H * (size / 100) * 0.42}}>{suffix}</span>
    </div>
  );
};

type ShotDef = {
  b: number; // first beat
  bg: BgKey;
  dots?: 'tl' | 'tr' | 'bl' | 'br' | 'none';
  year?: number; // drives the year ruler (hidden when undefined)
  age?: number; // override the ruler's age label (completed years)
  cam?: {from: [number, number, number]; to: [number, number, number]};
  src?: string;
  sfx?: Array<[number, SfxEvent]>;
  pace?: number;
  C: React.FC;
};

const SRC_PHOTO = '图：维基共享资源';
const SRC_PENN = '据宾夕法尼亚大学 Penn Today、《宾大日报》2023—2024 年报道';
const SRC_THU = '据清华大学新闻网等';

// ---------------------------------------------------------------- the shots

const SHOTS: ShotDef[] = [
  // ── title (full on frame 0 → thumbnail)
  {b: 0, bg: 'jade', dots: 'none', cam: {from: [50, 50, 1.0], to: [50, 48, 1.05]}, sfx: [[0, 'titleHit']],
    C: () => (
      <>
        <Brush k={0} text="人间四月天" x={6} y={4} size={11} color="rgba(247,243,234,.3)" />
        <Photo k={0} name="hero" w={64} x={18} y={14} enter="none" pitch={0.3} />
        <Brush k={0} text="林徽因" x={16} y={73} size={12} color={P.rice} />
      </>
    )},
  // ── verse 1: 1904 born
  {b: 14, bg: 'paper', dots: 'tr', year: 1904, src: `${SRC_PHOTO} · 据中新网等`, sfx: [[0, 'slam'], [2, 'slide'], [4, 'popIn'], [7, 'printLand']],
    C: () => (
      <>
        <DateStrip k={0} text="1904.6.10" />
        <Tag k={2} text="生于浙江杭州" x={8} y={16.5} size={2.8} />
        <Cut k={4} text="林徽因" x={8} y={24} size={10} per={1} />
        <Photo k={7} name="child" w={44} x={50} y={38} rot={3} />
        <Strip k={9} text="原名林徽音，后改“徽因”" x={8} y={42} size={2.8} rot={-1} />
      </>
    )},
  // ── 1920 Europe with her father
  {b: 35, bg: 'mist', dots: 'tl', year: 1920, src: SRC_PHOTO, sfx: [[0, 'slam'], [2, 'slide'], [4, 'printLand'], [8, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1920 · 16 岁" />
        <Strip k={2} text="随父亲林长民游历欧洲，旅居伦敦" x={7} y={16} size={2.9} bg={P.red} rot={-1} />
        <Photo k={4} name="father" w={70} x={15} y={25} rot={-2} />
        <Strip k={8} text="在伦敦，她开始对建筑产生兴趣" x={8} y={70} size={3.2} rot={1} />
      </>
    )},
  // ── 1924 Tagore in Beijing (the literary circle, briefly)
  {b: 59, bg: 'paper', dots: 'br', year: 1924, src: SRC_PHOTO, sfx: [[0, 'slam'], [2, 'printLand'], [6, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1924 · 北京" />
        <Photo k={2} name="tagore" w={84} x={8} y={18} rot={2} />
        <Strip k={6} text="泰戈尔访华，她与徐志摩随行" x={7} y={60} size={3} rot={-1} />
      </>
    )},
  // ── 1924 Penn: the architecture school did not admit women
  {b: 76, bg: 'slate', dots: 'none', year: 1924, src: SRC_PENN, sfx: [[0, 'slam'], [2, 'slide'], [5, 'slam'], [9, 'slide'], [12, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1924 · 宾大" />
        <Strip k={2} text="她和梁思成一起赴美留学" x={8} y={16} size={3} bg={P.rice} fg={P.ink} rot={-1} />
        <Cut k={5} text="建筑系不收女生" x={5} y={25} size={5.2} per={1} dark />
        <Mark k={7} kind="strike" box={{x: 5, y: 25, w: 84, h: 5.6}} />
        <Strip k={9} text="她注册进美术学院" x={8} y={40} size={3.2} bg={P.red} rot={1} />
        <Strip k={12} text="主要选修的，是建筑系的课" x={10} y={46.5} size={3.2} bg={P.rice} fg={P.ink} rot={-1} />
      </>
    )},
  // ── 1927 graduation
  {b: 107, bg: 'paper', dots: 'tr', year: 1927, src: `${SRC_PHOTO} · ${SRC_PENN}`, sfx: [[0, 'slam'], [1, 'printLand'], [5, 'slide'], [8, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1927" />
        <Photo k={1} name="penn" w={52} x={42} y={12} rot={3} />
        <Strip k={5} text="美术学士毕业" x={7} y={18} size={3.6} bg={P.red} rot={-1} />
        <Note k={8} text={'离建筑学学位，\n只差一门\n不对女生开放的\n课程。'} x={6} y={28} w={42} size={2.7} />
      </>
    )},
  // ── 1928 marriage, back to China, teaching
  {b: 123, bg: 'mist', dots: 'bl', year: 1928, src: `${SRC_PHOTO} · ${SRC_THU}`, sfx: [[0, 'slam'], [1, 'printLand'], [5, 'slide'], [8, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1928" />
        <Photo k={1} name="wedding" w={56} x={40} y={12} rot={3} />
        <Strip k={5} text="与梁思成在渥太华结婚" x={6} y={18} size={3.2} bg={P.red} rot={-1} />
        <Strip k={8} text="回国，在东北大学建筑系任教" x={6} y={64} size={3} rot={1} />
      </>
    )},
  // ── 1931 the Society for Research in Chinese Architecture
  {b: 136, bg: 'jade', dots: 'none', year: 1931, src: SRC_THU, sfx: [[0, 'slam'], [2, 'slide'], [4, 'popIn'], [7, 'popIn']],
    C: () => (
      <>
        <DateStrip k={0} text="1931" />
        <Strip k={2} text="加入中国营造学社" x={8} y={16} size={3.6} bg={P.rice} fg={P.ink} rot={-1} />
        <Count k={4} to={200} prefix="近" suffix=" 个县" x={8} y={27} size={10} color={P.rice} />
        <Count k={7} to={1000} prefix="近" suffix=" 处古建筑" x={8} y={40} size={8.6} color={P.rice} />
        <Strip k={10} text="学社 1930—1946 年间的田野调查" x={8} y={53} size={2.6} bg={P.red} rot={1} />
      </>
    )},
  // ── in the field
  {b: 160, bg: 'paper', dots: 'tr', year: 1934, src: SRC_PHOTO, sfx: [[0, 'printLand'], [3, 'printLand'], [6, 'printLand'], [9, 'slam']],
    C: () => (
      <>
        <Photo k={0} name="survey1" w={70} x={4} y={6} rot={-2} />
        <Photo k={3} name="survey2" w={66} x={30} y={30} rot={3} />
        <Photo k={6} name="survey3" w={32} x={6} y={46} rot={-3} />
        <Strip k={9} text="实地测绘古建筑" x={38} y={70} size={3.4} bg={P.red} rot={1} />
      </>
    )},
  // ── verse 2: 1934, the poem
  {b: 173, bg: 'jade', dots: 'none', year: 1934, src: '诗：发表于《学文》1 卷 1 期，1934', sfx: [[0, 'slam'], [3, 'slide'], [8, 'slide'], [12, 'printLand']],
    C: () => (
      <>
        <DateStrip k={0} text="1934" />
        <Film k={3} title="《你是人间的四月天》" x={7} y={17} size={4.2} rot={-1} />
        <Strip k={8} text="她最为人熟知的诗" x={9} y={28} size={3} bg={P.red} rot={1} />
        <Photo k={12} name="adult" w={50} x={44} y={36} rot={3} />
        <Strip k={15} text="同年发表小说《九十九度中》" x={7} y={50} size={2.6} bg={P.rice} fg={P.ink} rot={-1} />
      </>
    )},
  // ── 1937 Foguang Temple: a Tang timber hall
  {b: 194, bg: 'paper', dots: 'br', year: 1937, src: `${SRC_PHOTO} · 据梁思成《记五台山佛光寺的建筑》`, sfx: [[0, 'slam'], [2, 'slide'], [4, 'printLand'], [9, 'printLand'], [14, 'slide'], [18, 'slam']],
    C: () => (
      <>
        <DateStrip k={0} text="1937.6 · 五台山" />
        <Strip k={2} text="循敦煌壁画《五台山图》的线索" x={7} y={16} size={2.8} bg={P.red} rot={-1} />
        <Photo k={4} name="foguang_lin" w={48} x={48} y={30} rot={3} />
        <Photo k={9} name="foguang" w={54} x={4} y={48} rot={-2} />
        <Strip k={14} text="梁下题记，施主“宁公遇”" x={6} y={76} size={2.8} rot={1} />
        <Cut k={18} text="唐857年" x={6} y={21.5} size={6} per={1} />
      </>
    )},
  {b: 223, bg: 'slate', dots: 'none', year: 1937, src: '据清华大学新闻网', sfx: [[0, 'slam'], [5, 'slide'], [8, 'slam']],
    C: () => (
      <>
        <Strip k={0} text="此前，日本学者认为" x={6} y={10} size={2.8} bg={P.rice} fg={P.ink} rot={-1} />
        <Strip k={1} text="中国已没有唐代木构建筑" x={8} y={15.5} size={2.8} bg={P.rice} fg={P.ink} rot={1} />
        <Strip k={5} text="佛光寺东大殿，是当时在中国发现的" x={6} y={24} size={2.8} bg={P.red} rot={-1} />
        <Cut k={8} text="第一座唐代木构" x={5} y={31} size={5.2} per={1} dark />
      </>
    )},
  // ── 1940 Lizhuang: ill, still writing
  {b: 237, bg: 'mist', dots: 'tl', year: 1940, src: `${SRC_PHOTO} · ${SRC_THU}`, sfx: [[0, 'slam'], [2, 'slide'], [4, 'printLand'], [9, 'slide'], [13, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1940 · 四川李庄" />
        <Strip k={2} text="战乱中，营造学社内迁" x={7} y={16} size={3} bg={P.red} rot={-1} />
        <Photo k={4} name="family" w={50} x={44} y={24} rot={3} />
        <Strip k={9} text="她肺病缠身" x={7} y={30} size={3.4} rot={1} />
        <Note k={13} text={'仍主导撰写\n《中国建筑史》\n宋辽金部分'} x={6} y={38} w={46} size={3} />
      </>
    )},
  // ── back to Beijing: Tsinghua
  {b: 268, bg: 'paper', dots: 'br', year: 1946, src: `${SRC_PHOTO} · ${SRC_THU}`, sfx: [[0, 'slam'], [2, 'printLand'], [6, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1946 · 北平" />
        <Photo k={2} name="xinlin" w={84} x={8} y={18} rot={-2} />
        <Strip k={6} text="回到清华园，参与清华建筑系的建设" x={6} y={58} size={2.8} rot={1} />
      </>
    )},
  // ── chorus 2: the national emblem
  {b: 290, bg: 'red', dots: 'tr', year: 1950, src: `${SRC_PHOTO} · ${SRC_THU}`, sfx: [[0, 'titleHit'], [2, 'printLand'], [6, 'printLand'], [10, 'slide'], [12, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1950" />
        <Photo k={2} name="emblem_draft" w={46} x={4} y={16} rot={-3} pitch={0.3} />
        <Photo k={6} name="emblem" w={48} x={48} y={22} rot={3} pitch={0.3} />
        <Cut k={8} text="国徽" x={8} y={52} size={12} per={1} dark />
        <Strip k={10} text="清华营建系梁思成、林徽因等设计" x={6} y={66} size={2.7} bg={P.rice} fg={P.ink} rot={-1} />
        <Strip k={12} text="1950 年 6 月全国政协会议通过" x={8} y={71.5} size={2.7} bg={P.ink} rot={1} />
      </>
    )},
  // ── cloisonné
  {b: 304, bg: 'jade', dots: 'none', year: 1951, src: '据中国非物质文化遗产网、清华大学新闻网', sfx: [[0, 'slam'], [2, 'popIn'], [6, 'slide'], [9, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1951" />
        <Cut k={2} text="景泰蓝" x={8} y={17} size={12} per={1} dark />
        <Strip k={6} text="在清华组织抢救景泰蓝工艺" x={7} y={36} size={3} bg={P.rice} fg={P.ink} rot={-1} />
        <Strip k={9} text="设计民族风格的新图案" x={9} y={42} size={3} bg={P.red} rot={1} />
        <Bits k={4} seed="b1951" items={[{kind: 'dot', x: 74, y: 56, size: 8, color: '#2F6F9F'}, {kind: 'star', x: 62, y: 66, size: 6, color: '#D9A441'}, {kind: 'half', x: 80, y: 70, size: 6, rot: 20, color: P.red}]} />
      </>
    )},
  // ── the Monument to the People's Heroes
  {b: 319, bg: 'paper', dots: 'tl', year: 1952, src: `${SRC_PHOTO} · 据新华网、中国作家网`, sfx: [[0, 'slam'], [1, 'printLand'], [6, 'slide'], [9, 'slam']],
    C: () => (
      <>
        <DateStrip k={0} text="1952" />
        <Photo k={1} name="monument" w={44} x={50} y={9} rot={2} />
        <Strip k={6} text="参与设计" x={7} y={18} size={3.4} bg={P.red} rot={-1} />
        <Cut k={9} text="人民英雄纪念碑" x={4} y={62} size={5.2} per={1} />
      </>
    )},
  {b: 335, bg: 'jade', dots: 'none', year: 1953, src: `${SRC_PHOTO} · 据中国作家网 2022`, sfx: [[0, 'slam'], [1, 'printLand'], [5, 'printLand'], [9, 'slide'], [12, 'slide']],
    C: () => (
      <>
        <Photo k={1} name="relief1" w={86} x={7} y={8} rot={-1} />
        <Photo k={5} name="relief2" w={72} x={22} y={32} rot={2} />
        <Tag k={6} text="图为碑座（须弥座），浮雕另由雕塑家创作" x={6} y={52} size={2} bg={P.ink} rot={-1} />
        <Strip k={9} text="碑座花饰的主要设计者" x={6} y={58} size={3.4} bg={P.rice} fg={P.ink} rot={-1} />
        <Strip k={12} text="牡丹 · 荷花 · 菊花" x={8} y={64.5} size={3.4} bg={P.red} rot={1} />
      </>
    )},
  // ── 1955
  {b: 353, bg: 'ink', dots: 'none', year: 1955, age: 50, src: `${SRC_PHOTO} · 据中新网 2024`, sfx: [[0, 'slam'], [2, 'printLand'], [7, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1955.4.1 · 北京" />
        <Photo k={2} name="late" w={58} x={21} y={16} rot={2} />
        <Strip k={7} text="病逝，未满 51 岁" x={8} y={66} size={3.8} bg={P.red} rot={-1} />
      </>
    )},
  // ── Jin Yuelin's elegy
  {b: 371, bg: 'paper', dots: 'tr', src: '挽联：金岳霖', sfx: [[0, 'slide'], [6, 'slide']],
    C: () => (
      <>
        <Note k={0} text="一身诗意千寻瀑" x={14} y={20} w={80} size={5} rot={-1} />
        <Note k={6} text="万古人间四月天" by="—— 金岳霖挽林徽因" x={22} y={38} w={80} size={5} rot={1} />
      </>
    )},
  // ── the tombstone: seven characters
  {b: 389, bg: 'mist', dots: 'none', year: 1955, age: 50, src: '据新浪、界面新闻报道 · 墓碑为示意', sfx: [[0, 'slam'], [2, 'stamp'], [14, 'slide']],
    C: () => (
      <>
        <Stone k={0} x={30} y={8} w={40} h={58} />
        <Strip k={14} text="墓在北京八宝山" x={8} y={70} size={3.2} rot={-1} />
      </>
    )},
  // ── 2024: the degree
  {b: 412, bg: 'slate', dots: 'none', src: SRC_PENN, sfx: [[0, 'slam'], [2, 'slide'], [5, 'printLand'], [9, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="2024.5.18" />
        <Strip k={2} text="宾夕法尼亚大学追授她建筑学学士学位" x={6} y={16} size={2.9} bg={P.rice} fg={P.ink} rot={-1} />
        <Photo k={5} name="penn" w={46} x={48} y={26} rot={3} />
        <Strip k={9} text="证书上的毕业年份：1927" x={6} y={30} size={3} bg={P.red} rot={1} />
      </>
    )},
  // ── closing card
  {b: 435, bg: 'jade', dots: 'none', cam: {from: [50, 50, 1.0], to: [50, 49, 1.04]}, sfx: [[0, 'titleHit']],
    C: () => (
      <>
        <div style={{position: 'absolute', inset: 0, opacity: 0.45}}>
          <Photo k={0} name="hero" w={80} x={10} y={6} enter="none" pitch={0.3} />
        </div>
        <Brush k={0} text="林徽因" x={14} y={54} size={15} color={P.rice} />
        <Strip k={2} text="1904 — 1955" x={30} y={70} size={4} bg={P.rice} fg={P.ink} rot={-1} font={ROLE.num} />
        <Strip k={4} text="建筑学家 · 诗人" x={32} y={77} size={2.8} bg={P.red} rot={1} />
        <Credit k={6} />
      </>
    )},
];

// ---------------------------------------------------------------- year ruler

const EVENT_YEARS = [1920, 1924, 1927, 1928, 1931, 1934, 1937, 1940, 1946, 1950, 1951, 1952, 1955];
const Y0 = 1904;
const Y1 = 1955;
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
  const dark = DARK_KEYS.has(shot.bg);
  const ink = dark ? 'rgba(247,243,234,.85)' : 'rgba(30,30,28,.8)';
  const accent = dark ? '#F0A08C' : P.red;
  const x0 = W * 0.08;
  const x1 = W * 0.92;
  const X = (y: number) => x0 + ((y - Y0) / (Y1 - Y0)) * (x1 - x0);
  const yLine = H * 0.885;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <line x1={x0} x2={x1} y1={yLine} y2={yLine} stroke={ink} strokeWidth={H * 0.0018} />
      {[1904, 1915, 1925, 1935, 1945, 1955].map((y) => (
        <g key={y}>
          <line x1={X(y)} x2={X(y)} y1={yLine - H * 0.006} y2={yLine + H * 0.006} stroke={ink} strokeWidth={H * 0.0016} />
          <text x={X(y)} y={yLine + H * 0.022} textAnchor="middle" fontFamily={ROLE.num} fontWeight={600} fontSize={H * 0.0135} fill={ink}>{y}</text>
        </g>
      ))}
      {EVENT_YEARS.filter((y) => y <= year + 0.01).map((y) => (
        <rect key={y} x={X(y) - H * 0.002} y={yLine - H * 0.016} width={H * 0.004} height={H * 0.012} fill={accent} />
      ))}
      <rect x={x0} y={yLine - H * 0.0018} width={X(year) - x0} height={H * 0.0036} fill={P.red} />
      <circle cx={X(year)} cy={yLine} r={H * 0.0075} fill={P.red} stroke={dark ? P.rice : P.paper} strokeWidth={H * 0.002} />
      <text x={X(year)} y={yLine - H * 0.024} textAnchor="middle" fontFamily={ROLE.num} fontWeight={800} fontSize={H * 0.019} fill={ink}>{Math.round(year)}</text>
      <text x={X(year)} y={yLine - H * 0.045} textAnchor="middle" fontFamily={ROLE.label} fontWeight={700} fontSize={H * 0.016} fill={accent}>{shot.age ?? shot.year - 1904} 岁</text>
    </svg>
  );
};

// ---------------------------------------------------------------- composition

const SONG_END = 4814; // 200.57 s
export const LINHUIYIN_DURATION = SONG_END;
const CUES = SHOTS.flatMap((s) => (s.sfx ?? []).map(([k, event]) => ({at: Math.round(beatAt(s.b + k * (s.pace ?? 1))), event, db: -24})));

const ShotView: React.FC<{def: ShotDef; dur: number}> = ({def, dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {C, cam} = def;
  const drift = Math.min(0.015, (0.05 * fps) / dur); // a whole shot pushes in ≤ 5 %
  const keys = cam ? [{at: 0, cx: cam.from[0], cy: cam.from[1], scale: cam.from[2]}, {at: dur, cx: cam.to[0], cy: cam.to[1], scale: cam.to[2]}] : undefined;
  return (
    <ShotCtx.Provider value={{b0: def.b, pace: def.pace ?? 1}}>
      <AbsoluteFill>
        <ColorField color={P[def.bg]} dots={def.dots ?? 'br'} seed={def.b + 1} />
        <VoxCamera frame={f} fps={fps} drift={cam ? 0 : drift} keys={keys}>
          <C />
        </VoxCamera>
        {def.src ? <SourceLine frame={f} at={6} onDark={DARK_KEYS.has(def.bg)} font={ROLE.label} text={def.src} /> : null}
      </AbsoluteFill>
    </ShotCtx.Provider>
  );
};

export const LinHuiyin: React.FC<{theme?: string; mute?: boolean}> = ({theme = 'blueprint', mute = false}) => {
  Object.assign(P, LH_THEMES[theme] ?? LH_THEMES.blueprint);
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: P.ink}}>
      <CollageFilters scale={height / 1080} seed={11} />
      {mute ? null : <Audio src={staticFile('audio/raw/linhuiyin/siyuetian.wav')} volume={(fr) => interpolate(fr, [0, 2], [0, 1], {extrapolateRight: 'clamp'})} />}
      <SfxTrack cues={CUES} />
      {SHOTS.map((s, i) => {
        const from = i === 0 ? 0 : F[s.b];
        const to = i + 1 < SHOTS.length ? F[SHOTS[i + 1].b] : LINHUIYIN_DURATION;
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <ShotView def={s} dur={to - from} />
          </Sequence>
        );
      })}
      <YearRuler frame={frame} />
      <FilmLook frame={frame} grain={0.08} vignette={0.3} />
    </AbsoluteFill>
  );
};
