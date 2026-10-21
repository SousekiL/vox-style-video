// 张爱玲 · 一生与作品 (1080×1920, 24 fps, 3:39): vox-collage biography cut to 刘若英《原来你也在这里》.
// Every element enters on a beat (data/eileen-beats.json: a fitted 71.98 bpm grid to 176 s, aubio beats after), shots
// cut on beats and chapters follow the song: quiet verse = childhood, first chorus = fame, the long loud middle = leaving
// and the rewrites, the drop at 172 s = her death, the last lines = after her.
// Facts: dataviz-studio/projects/culture-language/eileen-chang-vox/FACTCHECK.md. Rewrites and changed endings
// are called out (十八春→半生缘, 金锁记→怨女, 色，戒, 小团圆, 不了情→多少恨, Stale Mates→五四遗事).
// Photos: USC Libraries Eileen Chang Papers (CC BY 4.0), Wikimedia Commons, a 1995 自由时报 clipping and a web
// copy of the 1994 photo; non-commercial piece, credited on the end card. No lyrics on screen.
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
import beatData from './data/eileen-beats.json';
import voiceData from './data/eileen-voice.json';

const F: number[] = beatData.beats; // frame of every detected beat
const KAI = loadLocalFont('Kai Eileen', 'fonts/kai-eileen.woff', '500'); // subset of LXGW WenKai Medium (OFL)
// 思源黑体 (Source Han Sans SC, OFL) and 思源宋体 (Noto Serif SC Black, OFL) subset to this film's characters and loaded
// before rendering: Google's on-demand CJK slices could paint some frames in a fallback font (footnotes flickered).
const EC_SANS = 'EC Sans';
loadLocalFont(EC_SANS, 'fonts/ec-sans-Regular.woff', '400');
loadLocalFont(EC_SANS, 'fonts/ec-sans-Bold.woff', '700');
loadLocalFont(EC_SANS, 'fonts/ec-sans-Heavy.woff', '900');
const EC_SERIF = loadLocalFont('EC Serif', 'fonts/ec-serif-black.woff', '900');

// ---- fonts by role (one font per element) ----
const ROLE = {
  chip: {font: EC_SANS, weight: 900}, // 剪贴大字: 黑体
  strip: EC_SANS, // 信息条: 黑体
  book: EC_SERIF, // 书名: 宋体
  latin: VOX_FONT.serif, // 英文书名: Libre Baskerville
  num: VOX_FONT.sans, // 日期数字: Libre Franklin
  quote: KAI, // 原文引语: 文楷
  label: EC_SANS,
};

// ---- 海上 palette: rice paper, peacock blue (《传奇》1944 cover), vermilion, ink, faded pink ----
const P = {rice: '#EDE4CF', paper: '#F7F2E6', peacock: '#306F80', red: '#C8352B', ink: '#1B1A18', pink: '#D9A6A0', mustard: '#C99A2E'};
const COVER_BG = '#306F80'; // measured from the 《传奇》1944 cover
const DARK = new Set([P.ink, P.peacock, P.red, COVER_BG]);
const chips = (pairs: Array<[string, string]>): ChipStyle[] => pairs.map(([bg, fg]) => ({bg, fg, font: ROLE.chip.font, weight: ROLE.chip.weight}));
const POP = chips([[P.ink, P.rice], [P.rice, P.red], [P.red, P.rice]]);
const ON_DARK = chips([[P.rice, P.ink], [P.red, P.rice], [P.pink, P.ink]]);

const cut = (n: string) => staticFile(`cutouts/eileen/${n}.png`);
const ev = (n: string) => staticFile(`evidence/eileen/${n}`);
const A = {
  p1944a: 0.793, p1944b: 0.543, p1944c: 0.755, p1950: 0.947, p1954: 0.691, p1955: 0.708, p1961: 1.067, p1966: 0.645, p1994: 0.595,
  child1924: 0.73, grandfather: 0.716, grandmother: 0.716, mother1930: 0.716, hku1912: 0.993, li1945: 0.666, ltn1995: 0.75,
};

// ---- shot clock: k = beats since the shot's first beat ----
const ShotCtx = React.createContext({b0: 0, pace: 1});
/** frame of (fractional) beat index i, interpolated between detected beats */
const beatAt = (i: number) => {
  const a = Math.max(0, Math.min(F.length - 2, Math.floor(i)));
  return F[a] + (F[a + 1] - F[a]) * Math.min(1, Math.max(0, i - a));
};
const useB = () => {
  const f = useCurrentFrame();
  const {b0, pace} = React.useContext(ShotCtx);
  const {width: W, height: H, fps} = useVideoConfig();
  const B = (k: number) => Math.round(beatAt(b0 + k * pace)) - F[b0]; // pace < 1 squeezes a shot's entrances into fewer beats
  const st = (k: number) => Math.floor((f - B(k)) / 2); // drawings since beat k (collage clock on 2s)
  return {f, fps, W, H, B, st};
};

// ---------------------------------------------------------------- building blocks

const Strip: React.FC<{k: number; text: string; x: number; y: number; size?: number; bg?: string; fg?: string; rot?: number; font?: string}> = ({k, text, x, y, size = 3.2, bg = P.ink, fg = P.rice, rot = -2, font = ROLE.strip}) => {
  const {st} = useB();
  return <HeadlineStrip text={text} step={st(k)} sizePctH={size} x={x} y={y} bg={bg} fg={fg} rot={rot} font={font} />;
};

const Cut: React.FC<{k: number; text: string; x: number; y: number; size: number; dark?: boolean; per?: number; seed?: string}> = ({k, text, x, y, size, dark = false, per = 8, seed}) => {
  const {st} = useB();
  return <CutLetters text={text} step={st(k)} perChar={per} sizePctH={size} styles={dark ? ON_DARK : POP} x={x} y={y} seed={seed ?? text} />;
};

/** a book: title on a paper slip (宋体; Latin titles in Libre Baskerville) + a note strip under it */
const Book: React.FC<{k: number; title: string; note?: string; x: number; y: number; size?: number; rot?: number; latin?: boolean; noteBg?: string}> = ({k, title, note, x, y, size = 4, rot = -2, latin = false, noteBg = P.ink}) => (
  <>
    <Strip k={k} text={title} x={x} y={y} size={size} bg={P.paper} fg={P.ink} rot={rot} font={latin ? ROLE.latin : ROLE.book} />
    {note ? <Strip k={k + 0.5} text={note} x={x + 1.5} y={y + size * 1.45} size={2.1} bg={noteBg} fg={P.rice} rot={rot * -0.5} font={ROLE.label} /> : null}
  </>
);

/** original words: 文楷 on a paper card, wraps inside w% */
const Quote: React.FC<{k: number; text: string; by?: string; x: number; y: number; w: number; size?: number; rot?: number}> = ({k, text, by, x, y, w, size = 4.6, rot = -1}) => {
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

const Photo: React.FC<{k: number; src: string; aspect: number; w: number; x: number; y: number; rot?: number; enter?: 'slap' | 'drop' | 'slide' | 'none'; pitch?: number}> = ({k, src, aspect, w, x, y, rot = 0, enter = 'slap', pitch = 0.4}) => {
  const {st, W} = useB();
  return <PrintCutout src={src} aspect={aspect} widthPx={(w / 100) * W} x={x} y={y} rot={rot} step={st(k)} enter={enter} pitchPctH={pitch} paperColor="#F2EEE4" wobble={0.5} />;
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
  b: number; // first beat
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

// ---------------------------------------------------------------- the shots

const SHOTS: ShotDef[] = [
  // ── cover: the 1944 《传奇》 first edition (peacock blue, 隶书) — full on frame 0 so it works as the thumbnail
  {b: 0, bg: COVER_BG, dots: 'none', sfx: [[1, 'titleHit']], cam: {from: [50, 50, 1.0], to: [50, 47, 1.05]},
    C: () => <Cover />},
  // ── her photos across seventy years, one per beat, until the voice comes in (≈15.6 s)
  {b: 3, bg: P.rice, dots: 'none', src: '图：USC Libraries 张爱玲档案（CC BY 4.0）、香港大学档案馆、维基共享资源等', sfx: [[0, 'printLand'], [1.1, 'printLand'], [2.2, 'printLand'], [3.3, 'printLand'], [4.4, 'printLand'], [5.5, 'printLand'], [6.6, 'printLand'], [7.7, 'printLand'], [8.8, 'printLand'], [9.9, 'printLand'], [11, 'printLand']],
    C: () => <Montage />},
  // ── verse 1: origins 1920–1938
  {b: 16, bg: P.rice, dots: 'tr', year: 1920, age: '0 岁', src: '图：USC Libraries 张爱玲档案（CC BY 4.0）', sfx: [[0, 'slam'], [2, 'slide'], [3, 'popIn'], [4, 'popIn'], [6, 'printLand']],
    C: () => (
      <>
        <Strip k={0} text="1920.9.30" x={7} y={7} size={6} bg={P.ink} fg={P.rice} font={ROLE.num} />
        <Strip k={2} text="生于上海" x={8} y={17.5} size={3.4} bg={P.red} />
        <Cut k={3} text="张煐" x={8} y={25} size={10} />
        <Strip k={5} text="原名" x={52} y={28} size={2.8} />
        <Photo k={6} src={ev('child1924.jpg')} aspect={A.child1924} w={48} x={46} y={38} rot={3} />
        <Strip k={7} text="约 1924 年" x={50} y={79} size={2.4} bg={P.ink} rot={1} />
      </>
    )},
  {b: 25, pace: 0.76, bg: P.pink, dots: 'bl', year: 1920, age: '0 岁', src: '图：USC Libraries 张爱玲档案（CC BY 4.0）', sfx: [[0, 'slam'], [2, 'printLand'], [4, 'printLand'], [6, 'slide'], [7, 'slam']],
    C: () => (
      <>
        <Cut k={0} text="名门之后" x={7} y={5} size={7} per={4} />
        <Photo k={2} src={ev('grandfather.jpg')} aspect={A.grandfather} w={40} x={6} y={21} rot={-3} pitch={0.32} />
        <Strip k={3} text="祖父 张佩纶" x={8} y={53} size={2.8} />
        <Photo k={4} src={ev('grandmother.jpg')} aspect={A.grandmother} w={40} x={54} y={27} rot={3} pitch={0.32} />
        <Strip k={5} text="祖母 李菊耦" x={55} y={59} size={2.8} />
        <Strip k={6} text="李鸿章之女" x={57} y={64.5} size={2.6} bg={P.red} rot={2} />
        <Strip k={7} text="她是李鸿章的曾外孙女" x={7} y={74} size={3.3} bg={P.ink} />
      </>
    )},
  {b: 31, pace: 0.90, bg: P.rice, dots: 'br', year: 1930, age: '10 岁', src: '图：USC Libraries 张爱玲档案（CC BY 4.0）', sfx: [[0, 'slam'], [1, 'slide'], [2, 'printLand'], [4, 'popIn'], [5, 'popIn'], [6, 'slide']],
    C: () => (
      <>
        <Strip k={0} text="1930" x={7} y={7} size={6} bg={P.ink} fg={P.rice} font={ROLE.num} />
        <Strip k={1} text="父母离婚" x={8} y={17} size={4.2} bg={P.red} />
        <Photo k={2} src={ev('mother1930.jpg')} aspect={A.mother1930} w={42} x={54} y={8} rot={2} pitch={0.32} />
        <Strip k={3} text="母亲黄逸梵，约 1930" x={52} y={41} size={2.2} rot={1} />
        <Cut k={4} text="爱玲" x={9} y={50} size={10} />
        <Strip k={5} text="入学时，母亲为她改名" x={9} y={64} size={3} bg={P.ink} />
        <Strip k={6} text="Eileen" x={11} y={70.5} size={4.4} bg={P.red} font={ROLE.latin} />
        <Strip k={7} text="「爱玲」取自英文名" x={46} y={72} size={2.6} bg={P.ink} rot={1} />
      </>
    )},
  {b: 38, pace: 0.90, bg: P.red, dots: 'tl', year: 1938, age: '17 岁', src: '据陈子善、止庵等整理的年谱', sfx: [[0, 'slam'], [2, 'slide'], [3, 'popIn'], [4, 'slam'], [5, 'slam'], [6, 'slide'], [7, 'burst']],
    C: () => (
      <>
        <Strip k={0} text="1937 — 1938" x={7} y={7} size={5} bg={P.ink} fg={P.rice} font={ROLE.num} />
        <Strip k={2} text="被父亲殴打、软禁约半年" x={7} y={15.5} size={3.3} bg={P.rice} fg={P.ink} />
        <Strip k={3} text="其间患上痢疾" x={9} y={21.5} size={2.6} bg={P.ink} rot={1} />
        <Cut k={4} text="出逃" x={10} y={32} size={14} dark />
        <Strip k={6} text="1938 年初，投奔母亲" x={10} y={53} size={3.4} bg={P.ink} />
        <Cut k={7} text="17岁" x={50} y={62} size={8} per={3} dark />
        <Bits k={1} seed="e5" items={[{kind: 'zigzag', x: 74, y: 8, size: 7, rot: 10, color: P.ink}, {kind: 'triangle', x: 8, y: 70, size: 5, rot: -14, color: P.rice}]} />
      </>
    )},

  // ── chorus 1: 出名要趁早 1939–1944
  {b: 45, pace: 0.88, bg: P.peacock, dots: 'br', year: 1939, age: '18 岁', src: '图：香港大学档案馆（HKU Archives）学籍卡', sfx: [[0, 'slam'], [1, 'slide'], [2, 'printLand'], [3, 'printLand'], [4, 'slide'], [5, 'scribble'], [6, 'slide']],
    C: () => (
      <>
        <Strip k={0} text="1939" x={7} y={6} size={6} bg={P.rice} fg={P.ink} font={ROLE.num} />
        <Strip k={1} text="入读香港大学" x={8} y={15.5} size={4.4} bg={P.red} />
        <Photo k={2} src={ev('hku_record.jpg')} aspect={0.806} w={56} x={40} y={22} rot={3} pitch={0.3} />
        <Photo k={3} src={ev('hku_id.jpg')} aspect={0.634} w={38} x={5} y={25} rot={-3} pitch={0.34} />
        <Strip k={4} text="学籍卡：1939.8.29 注册" x={44} y={60} size={2.4} bg={P.ink} rot={1} />
        <Strip k={4} text="考取伦敦大学" x={6} y={66} size={2.8} bg={P.rice} fg={P.ink} rot={0} />
        <Mark k={5} kind="strike" box={{x: 5, y: 65.6, w: 30, h: 4.4}} />
        <Strip k={6} text="因欧战，改入港大" x={40} y={71} size={2.8} bg={P.ink} rot={1} />
      </>
    )},
  {b: 51, bg: P.rice, dots: 'tl', year: 1940, age: '19 岁', src: '《天才梦》，《西风》第 48 期，1940', sfx: [[0, 'slam'], [1, 'slide'], [2, 'popIn'], [3, 'pageTurn']],
    C: () => (
      <>
        <Book k={0} title="《天才梦》" x={7} y={8} size={5.4} />
        <Strip k={1} text="1940 ·《西风》征文" x={8} y={20} size={2.8} bg={P.ink} />
        <Strip k={2} text="获「名誉奖第三名」" x={9} y={25.5} size={2.6} bg={P.red} rot={1} />
        <Quote k={3} text={"「生命是一袭华美的袍，\n　爬满了蚤子。」"} by="——《天才梦》末句" x={6} y={36} w={88} size={4} />
        <Strip k={5} text="写于港大时期" x={8} y={60} size={2.8} bg={P.ink} />
        <Bits k={1} seed="e7" items={[{kind: 'half', x: 78, y: 10, size: 9, rot: 20, color: P.peacock}, {kind: 'dot', x: 82, y: 70, size: 4, color: P.red}]} />
      </>
    )},
  {b: 59, bg: P.pink, dots: 'tr', year: 1942, age: '21 岁', src: '图：常德公寓（维基共享资源，CC0）；文出《公寓生活记趣》，《天地》1943.12', sfx: [[0, 'slam'], [1, 'slide'], [2, 'printLand'], [4, 'pageTurn']],
    C: () => (
      <>
        <Strip k={0} text="1942 · 回到上海" x={6} y={6} size={3.8} bg={P.ink} />
        <Strip k={1} text="与姑姑张茂渊住进常德公寓" x={7} y={13} size={2.9} bg={P.red} rot={1} />
        <Photo k={2} src={ev('changde.jpg')} aspect={1.501} w={84} x={8} y={21} rot={-2} pitch={0.32} />
        <Strip k={3} text="原爱丁顿公寓 · 今常德路 195 号" x={10} y={53.5} size={2.2} bg={P.ink} rot={1} />
        <Quote k={4} text={"「我喜欢听市声。\n　……我是非得听见电车响\n　才睡得着觉的。」"} by="——《公寓生活记趣》，1943" x={6} y={60} w={88} size={3.6} />
      </>
    )},
  {b: 66, bg: P.ink, dots: 'tr', year: 1943, age: '22 岁', src: '刊期据止庵《张爱玲年表》', sfx: [[0, 'slam'], [1, 'slide'], [2, 'popIn'], [3, 'popIn'], [4, 'popIn'], [5, 'popIn'], [6, 'popIn']],
    C: () => (
      <>
        <Strip k={0} text="1943 年" x={7} y={6} size={4.6} bg={P.rice} fg={P.ink} />
        <Strip k={1} text="七个月，五篇小说" x={8} y={13} size={3.6} bg={P.red} />
        <Book k={2} title="《沉香屑·第一炉香》" note="5 月 ·《紫罗兰》" x={7} y={22} size={3.8} rot={-2} />
        <Book k={3} title="《茉莉香片》" note="7 月 ·《杂志》" x={36} y={33} size={3.8} rot={2} />
        <Book k={4} title="《心经》" note="8 月 ·《万象》" x={9} y={44} size={3.8} rot={-1} />
        <Book k={5} title="《倾城之恋》" note="9 月 ·《杂志》" x={42} y={55} size={3.8} rot={2} />
        <Book k={6} title="《金锁记》" note="11 月 ·《杂志》" x={8} y={66} size={4.6} rot={-3} noteBg={P.red} />
      </>
    )},
  {b: 73, bg: P.peacock, dots: 'bl', year: 1944, age: '23 岁', src: '文出《爱》，《杂志》1944.4；后收入《流言》；图：1944 年（维基共享资源）', sfx: [[0, 'popIn'], [2, 'pageTurn'], [7, 'slam'], [8, 'slide']],
    C: () => (
      <>
        <Book k={0} title="《爱》" note="1944 · 散文" x={5} y={6} size={5} />
        <Quote k={2} text={"「于千万人之中遇见你所遇见的人，\n　于千万年之中，时间的无涯的荒野里，\n　没有早一步，也没有晚一步，\n　刚巧赶上了，那也没有别的话可说，\n　惟有轻轻的问一声：\n　『噢，你也在这里吗？』」"} x={4} y={19} w={92} size={2.7} />
        <Strip k={7} text="这首歌的歌词，就取意于此" x={6} y={50} size={3} bg={P.red} />
        <Strip k={8} text="《原来你也在这里》· 作词 姚谦" x={7} y={56} size={2.3} bg={P.rice} fg={P.ink} rot={1} />
        <Photo k={9} src={cut('p1944c')} aspect={A.p1944c} w={36} x={58} y={58} rot={3} />
      </>
    )},
  {b: 84, bg: P.red, dots: 'tl', year: 1944, age: '23 岁', src: '文出《红玫瑰与白玫瑰》，《杂志》1944.5—7', sfx: [[0, 'popIn'], [2, 'pageTurn']],
    C: () => (
      <>
        <Book k={0} title="《红玫瑰与白玫瑰》" note="1944.5—7 ·《杂志》" x={5} y={7} size={4.6} />
        <Quote k={2} text={"「娶了红玫瑰，久而久之，\n　红的变了墙上的一抹蚊子血，\n　白的还是『床前明月光』；\n　娶了白玫瑰，\n　白的便是衣服上沾的一粒饭黏子，\n　红的却是心口上一颗朱砂痣。」"} x={4} y={22} w={93} size={3} />
        <Bits k={1} seed="rose" items={[{kind: 'dot', x: 80, y: 6, size: 6, color: P.paper}, {kind: 'dot', x: 86, y: 12, size: 4, color: P.ink}]} />
      </>
    )},
  {b: 93, bg: P.rice, dots: 'br', year: 1944, age: '23 岁', src: '图：USC Libraries 张爱玲档案（CC BY 4.0）；初版日期据陈子善', sfx: [[0, 'printLand'], [1, 'slam'], [2, 'slide'], [3, 'slam'], [4, 'pageTurn']],
    C: () => (
      <>
        <Photo k={0} src={cut('p1944a')} aspect={A.p1944a} w={54} x={-3} y={30} rot={-2} />
        <Book k={1} title="《传奇》" x={52} y={8} size={6.4} rot={-3} />
        <Strip k={2} text="1944.8.15 初版" x={53} y={19} size={3} bg={P.ink} />
        <Cut k={3} text="数日售罄" x={50} y={26} size={4.6} per={3} />
        <Quote k={4} text="「出名要趁早呀！」" by="——《传奇》再版自序，1944.9" x={44} y={40} w={56} size={3.1} rot={2} />
      </>
    )},

  // ── verse 2: 胡兰成, the new era 1944–1952
  {b: 99, bg: P.pink, dots: 'tr', year: 1944, age: '23 岁', src: '图：USC Libraries 张爱玲档案（CC BY 4.0）', sfx: [[0, 'slam'], [1, 'slide'], [2, 'printLand'], [4, 'pageTurn']],
    C: () => (
      <>
        <Strip k={0} text="1944 · 与胡兰成秘密结婚" x={6} y={7} size={3.3} bg={P.ink} />
        <Strip k={1} text="没有仪式，只立一纸婚书" x={7} y={13.5} size={2.9} bg={P.rice} fg={P.ink} rot={1} />
        <Photo k={2} src={cut('p1944b')} aspect={A.p1944b} w={40} x={57} y={22} rot={-2} />
        <Quote k={4} text={"「愿使岁月静好，\n　现世安稳」"} by="——胡兰成" x={5} y={30} w={57} size={3.4} />
      </>
    )},
  {b: 105, bg: P.rice, dots: 'bl', year: 1947, age: '26 岁', src: '图：《杂志》1945（维基共享资源，公有领域）', sfx: [[0, 'printLand'], [2, 'popIn'], [3, 'popIn'], [4, 'popIn'], [5, 'popIn']],
    C: () => (
      <>
        <Photo k={0} src={ev('li_xianglan_1945.jpg')} aspect={A.li1945} w={44} x={4} y={10} rot={-3} pitch={0.34} />
        <Strip k={1} text="1945 · 与李香兰" x={6} y={50} size={2.4} bg={P.ink} />
        <Book k={2} title="《流言》" note="1944.12 · 散文集" x={54} y={12} size={4.2} rot={2} />
        <Book k={3} title="《不了情》" note="1947 · 编剧" x={54} y={25} size={4.2} rot={-2} />
        <Book k={4} title="《太太万岁》" note="1947 · 编剧" x={50} y={38} size={4.2} rot={1} />
        <Book k={5} title="《多少恨》" note="由《不了情》改写成小说" x={30} y={60} size={4.6} rot={-2} noteBg={P.red} />
      </>
    )},
  {b: 111, pace: 0.88, bg: P.ink, dots: 'br', year: 1947, age: '26 岁', src: '信文据胡兰成《今生今世》', sfx: [[0, 'slam'], [1, 'slide'], [3, 'pageTurn'], [5, 'slide']],
    C: () => (
      <>
        <Strip k={0} text="1947.6.10" x={7} y={9} size={5.4} bg={P.rice} fg={P.ink} font={ROLE.num} />
        <Strip k={1} text="致胡兰成诀别信" x={8} y={18.5} size={3.8} bg={P.red} />
        <Quote k={3} text={"「我已经\n　不喜欢你了。」"} x={7} y={31} w={86} size={5.4} />
        <Strip k={5} text="随信附上两部剧本的稿费" x={8} y={52} size={3} bg={P.rice} fg={P.ink} />
        <Strip k={6} text="三十万元" x={10} y={58} size={4.4} bg={P.red} rot={2} />
        <Bits k={2} seed="e12" items={[{kind: 'star', x: 78, y: 70, size: 7, color: P.red}, {kind: 'bar', x: 66, y: 9, size: 9, rot: -12, color: P.pink}]} />
      </>
    )},
  {b: 117, pace: 0.88, bg: P.peacock, dots: 'tl', year: 1950, age: '29 岁', src: '图：USC Libraries 张爱玲档案（约 1950—51，CC BY 4.0）', sfx: [[0, 'slam'], [1, 'popIn'], [3, 'popIn'], [4, 'printLand'], [6, 'slam']],
    C: () => (
      <>
        <Strip k={0} text="1950 · 笔名「梁京」" x={6} y={7} size={3.6} bg={P.rice} fg={P.ink} />
        <Book k={1} title="《十八春》" note="上海《亦报》连载，1950—51" x={6} y={15} size={5} rot={-2} />
        <Book k={3} title="《小艾》" note="1951" x={8} y={29} size={4} rot={2} />
        <Photo k={4} src={cut('p1950')} aspect={A.p1950} w={56} x={40} y={30} rot={2} />
        <Strip k={6} text="1952 · 离开上海，去香港" x={6} y={67} size={3.4} bg={P.red} />
      </>
    )},

  // ── chorus 2: leaving 1952–1967
  {b: 123, pace: 0.88, bg: P.rice, dots: 'tr', year: 1954, age: '34 岁', src: '图：USC Libraries 张爱玲档案（CC BY 4.0）', sfx: [[0, 'printLand'], [1, 'slam'], [2, 'slide'], [4, 'popIn'], [6, 'popIn']],
    C: () => (
      <>
        <Photo k={0} src={cut('p1954')} aspect={A.p1954} w={60} x={34} y={10} rot={-1} />
        <Strip k={1} text="1954 · 香港" x={5} y={8} size={3.6} bg={P.ink} />
        <Strip k={2} text="兰心照相馆" x={6} y={14.5} size={3} bg={P.red} rot={1} />
        <Book k={4} title="《秧歌》" note="先写英文，中文本 1954 年先出" x={5} y={58} size={4.4} rot={-2} />
        <Book k={6} title="《赤地之恋》" note="英文版 Naked Earth，1956" x={34} y={67.5} size={4} rot={2} noteBg={P.peacock} />
      </>
    )},
  {b: 129, bg: P.ink, dots: 'bl', year: 1955, age: '35 岁', src: '图：USC Libraries 张爱玲档案（约 1955，CC BY 4.0）；日期据 1955.10.25 致邝文美信', sfx: [[0, 'printLand'], [1, 'slam'], [2, 'slide'], [3, 'slam'], [4, 'slam'], [5, 'slide']],
    C: () => (
      <>
        <Photo k={0} src={cut('p1955')} aspect={A.p1955} w={54} x={44} y={13} />
        <Strip k={1} text="1955.10" x={6} y={8} size={5.4} bg={P.rice} fg={P.ink} font={ROLE.num} />
        <Strip k={2} text="乘「克利夫兰总统号」" x={6} y={17} size={2.9} bg={P.red} />
        <Cut k={3} text="赴美" x={6} y={60} size={11} dark />
        <Strip k={5} text="宋淇夫妇到码头送行" x={8} y={74} size={2.6} bg={P.rice} fg={P.ink} rot={1} />
      </>
    )},
  {b: 135, pace: 0.76, bg: P.rice, dots: 'tl', year: 1956, src: '据 Renditions 第 27—28 期、MacDowell 档案', sfx: [[0, 'slam'], [1, 'popIn'], [3, 'slide'], [4, 'slide'], [5, 'popIn'], [6, 'popIn'], [7, 'slide']],
    C: () => (
      <>
        <Strip k={0} text="1956.8.14 · 纽约" x={6} y={7} size={3.6} bg={P.ink} />
        <Cut k={1} text="嫁给赖雅" x={6} y={14.5} size={7} per={3} />
        <Strip k={3} text="Ferdinand Reyher" x={8} y={28} size={3.4} bg={P.pink} fg={P.ink} font={ROLE.latin} />
        <Book k={5} title="Stale Mates" note="1956 · 先写英文" x={7} y={46} size={4} latin />
        <Mark k={6} kind="arrow" box={{x: 30, y: 54, w: 14, h: 6}} color={P.ink} />
        <Book k={6} title="《五四遗事》" note="1957 · 自译成中文" x={44} y={57} size={4.2} rot={2} />
        <Strip k={7} text="1960 · 入美国籍" x={7} y={73} size={2.8} bg={P.ink} />
      </>
    )},
  {b: 141, bg: P.pink, dots: 'br', year: 1967, age: '47 岁', src: '图：USC Libraries 张爱玲档案（约 1961，CC BY 4.0）', sfx: [[0, 'printLand'], [1, 'slide'], [3, 'slam'], [4, 'slide'], [5, 'popIn']],
    C: () => (
      <>
        <Photo k={0} src={cut('p1961')} aspect={A.p1961} w={50} x={46} y={10} rot={2} />
        <Strip k={1} text="1961 · 访台，再赴港" x={5} y={9} size={3} bg={P.ink} />
        <Strip k={3} text="1967.10.8 · 赖雅去世" x={6} y={42} size={3.4} bg={P.ink} />
        <Strip k={4} text="这一年她 47 岁" x={8} y={48.5} size={3} bg={P.red} rot={1} />
        <Book k={5} title="The Rouge of the North" note="1967 · 伦敦出版" x={6} y={60} size={3.4} latin />
      </>
    )},

  // ── bridge: the rewrites
  {b: 147, bg: P.rice, dots: 'tr', src: '据 Renditions、USC 致夏志清信件', sfx: [[0, 'popIn'], [1, 'scribble'], [2, 'popIn'], [3, 'scribble'], [4, 'popIn'], [5, 'popIn'], [6, 'slam']],
    C: () => (
      <>
        <Strip k={0} text="她反复改写自己的作品" x={6} y={3.5} size={2.8} bg={P.red} />
        <Book k={0.5} title="《金锁记》" note="1943 · 中文" x={6} y={9.5} size={4.6} />
        <Mark k={1} kind="arrow" box={{x: 30, y: 17.5, w: 8, h: 6}} color={P.ink} />
        <Book k={2} title="Pink Tears" note="1956—57 · 英文重写，被退稿" x={14} y={25} size={4} latin />
        <Mark k={3} kind="strike" box={{x: 13, y: 24.5, w: 30, h: 5}} />
        <Book k={4} title="The Rouge of the North" note="1967 · 英文出版" x={6} y={40} size={3.6} latin />
        <Book k={5} title="《怨女》" note="1966 连载 · 1968 出书" x={36} y={53} size={4.6} rot={2} />
        <Strip k={6} text="十年间，中英文来回改" x={7} y={69} size={3.6} bg={P.red} />
      </>
    )},
  {b: 155, bg: P.peacock, dots: 'bl', src: '改写细节据中文维基「半生缘」条目（转述学界说法）', sfx: [[0, 'popIn'], [2, 'scribble'], [3, 'popIn'], [4, 'slide'], [5, 'slide'], [6, 'pageTurn']],
    C: () => (
      <>
        <Book k={0} title="《十八春》" note="原结尾：去东北参加革命工作" x={6} y={6} size={4.6} />
        <Mark k={2} kind="strike" box={{x: 7, y: 12.6, w: 54, h: 4}} />
        <Book k={3} title="《半生缘》" note="1969 · 删去这段，止于重逢" x={6} y={22} size={4.6} rot={2} noteBg={P.red} />
        <Strip k={4} text="叔惠：去延安 → 赴美留学" x={6} y={38} size={2.9} bg={P.ink} />
        <Strip k={5} text="十八年 → 十四年" x={8} y={44.5} size={3.2} bg={P.rice} fg={P.ink} rot={1} />
        <Quote k={6} text={"「日子过得真快，\n　尤其对于中年以后的人，\n　十年八年都好像是指顾间的事。\n　可是对于年轻人，\n　三年五载就可以是一生一世。」"} by="——《半生缘》第一章" x={6} y={53} w={88} size={3.1} />
      </>
    )},
  {b: 164, bg: P.pink, dots: 'tr', src: '据《惘然记》序（1983）', sfx: [[0, 'popIn'], [2, 'slide'], [3, 'pageTurn'], [5, 'slam'], [6, 'slide']],
    C: () => (
      <>
        <Book k={0} title="《色，戒》" note="英文原稿 Spy Ring · 1950 年代起稿" x={6} y={6} size={5.4} />
        <Strip k={2} text="1977—78 刊出 · 1983 收入《惘然记》" x={6} y={21} size={2.6} bg={P.ink} />
        <Quote k={3} text={"「此情可待成追忆，\n　只是当时已惘然」"} by="——李商隐；她在《惘然记》序中引用" x={6} y={29} w={88} size={4.4} />
        <Cut k={5} text="三十年" x={7} y={55} size={8} per={3} />
        <Strip k={6} text="一遍遍改写" x={10} y={67.5} size={3.4} bg={P.red} rot={2} />
      </>
    )},
  {b: 172, bg: P.ink, dots: 'br', src: '据止庵；宋以朗《小团圆》前言', sfx: [[0, 'popIn'], [2, 'slide'], [3, 'pageTurn'], [4, 'scribble'], [5, 'slam']],
    C: () => (
      <>
        <Book k={0} title="《小团圆》" note="1975.9 完稿" x={6} y={8} size={6} />
        <Strip k={2} text="1992 年，遗嘱信里写着：" x={6} y={25} size={2.9} bg={P.rice} fg={P.ink} />
        <Quote k={3} text={"「《小团圆》\n　小说要销毁」"} x={6} y={32} w={88} size={4.8} />
        <Strip k={5} text="2009 年，还是出版了" x={6} y={52} size={3.8} bg={P.red} />
        <Strip k={6} text="宋以朗决定出版 1976 年原稿" x={8} y={59} size={2.4} bg={P.rice} fg={P.ink} rot={1} />
      </>
    )},

  // ── final chorus: late years 1969–1995
  {b: 179, bg: P.rice, dots: 'tl', year: 1972, age: '52 岁', src: '图：USC Libraries 张爱玲档案（约 1966，CC BY 4.0）', sfx: [[0, 'printLand'], [1, 'slide'], [3, 'slam'], [4, 'slide']],
    C: () => (
      <>
        <Photo k={0} src={cut('p1966')} aspect={A.p1966} w={48} x={48} y={16} rot={2} />
        <Strip k={1} text="1969 · 柏克莱" x={5} y={8} size={3.4} bg={P.ink} />
        <Strip k={2} text="中国研究中心" x={6} y={14} size={2.6} bg={P.peacock} rot={1} />
        <Strip k={3} text="1972 · 移居洛杉矶" x={5} y={60} size={3.4} bg={P.red} />
        <Strip k={4} text="此后深居简出" x={7} y={66.5} size={3} bg={P.ink} rot={1} />
      </>
    )},
  {b: 185, bg: P.rice, dots: 'tl', year: 1977, src: '文出《红楼梦魇·红楼梦未完》，皇冠，1977', sfx: [[0, 'popIn'], [2, 'pageTurn']],
    C: () => (
      <>
        <Book k={0} title="《红楼梦魇》" note="1977 · 考证《红楼梦》" x={6} y={7} size={5} />
        <Quote k={2} text={"「有人说过『三大恨事』是\n　『一恨鲥鱼多刺，\n　　二恨海棠无香』，\n　第三件不记得了，\n　也许因为我下意识的觉得应当是\n　『三恨红楼梦未完』。」"} by="——〈红楼梦未完〉" x={4} y={22} w={93} size={2.8} />
      </>
    )},
  {b: 193, bg: P.peacock, dots: 'br', year: 1983, age: '62 岁', src: '书目据皇冠版与 Renditions', sfx: [[0, 'popIn'], [1, 'popIn'], [2, 'popIn']],
    C: () => (
      <>
        <Book k={0} title="《惘然记》" note="1983" x={6} y={10} size={4.6} />
        <Book k={1} title="《海上花》" note="1983 · 把吴语原著译成国语" x={6} y={26} size={4.6} rot={-1} noteBg={P.red} />
        <Book k={2} title="The Sing-song Girls of Shanghai" note="英译 · 2005 年身后出版" x={6} y={43} size={2.6} latin />
      </>
    )},
  {b: 199, pace: 0.90, bg: P.ink, dots: 'tr', year: 1994, age: '73 岁', src: '图：张爱玲 1994 年近照（网络翻拍）；图说据《自由时报》副刊转引', sfx: [[0, 'printLand'], [1, 'popIn'], [2, 'slide'], [4, 'slam'], [5, 'slide'], [6, 'scribble'], [7, 'slam']],
    C: () => (
      <>
        <Photo k={0} src={cut('p1994')} aspect={A.p1994} w={52} x={46} y={14} />
        <Book k={1} title="《对照记》" note="1994 · 看老照片簿" x={4} y={8} size={4.6} />
        <Strip k={2} text="获时报文学奖" x={4} y={25} size={2.7} bg={P.rice} fg={P.ink} />
        <Strip k={3} text="特别成就奖" x={5} y={30.5} size={2.7} bg={P.rice} fg={P.ink} rot={1} />
        <Strip k={4} text="她没去领奖" x={4} y={40} size={3.2} bg={P.red} />
        <Strip k={5} text="寄去这张照片" x={5} y={46.5} size={3.2} bg={P.red} rot={1} />
        <Mark k={6} kind="circle" box={{x: 75, y: 39, w: 16, h: 13.4}} />
        <Strip k={6.5} text="主席金日成昨猝逝" x={50} y={64.5} size={2.4} bg={P.rice} fg={P.ink} rot={3} />
        <Strip k={7} text="用报纸证明：她当天还活着" x={5} y={69} size={2.8} bg={P.rice} fg={P.ink} />
      </>
    )},
  {b: 206, bg: P.rice, dots: 'bl', year: 1995, age: '74 岁', src: '剪报：《自由时报》1995.9.10', sfx: [[0, 'printLand'], [1, 'slam'], [2, 'slide'], [3, 'slide'], [4, 'slide'], [5, 'slide']],
    C: () => (
      <>
        <Photo k={0} src={ev('ltn_1995.jpg')} aspect={A.ltn1995} w={50} x={46} y={11} rot={3} pitch={0.3} />
        <Strip k={1} text="1995.9.8" x={5} y={8} size={5.4} bg={P.ink} fg={P.rice} font={ROLE.num} />
        <Strip k={2} text="洛杉矶寓所" x={6} y={17.5} size={3.2} bg={P.red} />
        <Strip k={3} text="被发现已去世，享年 74 岁" x={5} y={55} size={3} bg={P.ink} />
        <Strip k={4} text="9.30，她 75 岁冥诞那天" x={6} y={61.5} size={3} bg={P.red} rot={1} />
        <Strip k={5} text="骨灰撒入太平洋" x={5} y={68} size={3.4} bg={P.ink} />
      </>
    )},

  // ── outro: after her
  {b: 220, pace: 0.91, bg: P.ink, dots: 'tl', src: '出版信息据中新网、港大出版社、皇冠', sfx: [[0, 'titleHit'], [2, 'popIn'], [4, 'popIn'], [6, 'popIn'], [8, 'popIn']],
    C: () => (
      <>
        <Cut k={0} text="身后" x={8} y={7} size={10} dark />
        <Book k={2} title="《小团圆》" note="2009" x={8} y={28} size={4.2} />
        <Book k={4} title="The Fall of the Pagoda" note="2010 · 中译《雷峰塔》" x={8} y={40} size={3.4} latin rot={2} />
        <Book k={6} title="The Book of Change" note="2010 · 中译《易经》" x={8} y={52} size={3.4} latin rot={-1} />
        <Book k={8} title="《少帅》" note="2014 · 未完稿" x={8} y={64} size={4.2} rot={2} noteBg={P.red} />
      </>
    )},
  {b: 228, bg: P.rice, dots: 'tr', src: '据各片公映资料；威尼斯影展', sfx: [[0, 'slam'], [1, 'popIn'], [2, 'popIn'], [3, 'popIn'], [4, 'popIn'], [5, 'popIn']],
    C: () => (
      <>
        <Strip k={0} text="她的小说，被拍成电影" x={6} y={6} size={3.6} bg={P.ink} />
        <Book k={1} title="《倾城之恋》" note="1984 · 许鞍华" x={6} y={15} size={4} rot={-2} />
        <Book k={2} title="《红玫瑰白玫瑰》" note="1994 · 关锦鹏" x={30} y={27} size={4} rot={2} />
        <Book k={3} title="《半生缘》" note="1997 · 许鞍华" x={8} y={39} size={4} rot={-1} />
        <Book k={4} title="《色，戒》" note="2007 · 李安 · 威尼斯金狮奖" x={30} y={51} size={4.4} rot={2} noteBg={P.red} />
        <Book k={5} title="《第一炉香》" note="2020 · 许鞍华" x={8} y={64} size={4} rot={-2} />
      </>
    )},
  // ── ending: the music ducks (3:20–3:22) and her own voice speaks over it
  {b: 237, bg: P.ink, dots: 'none', C: () => <VoiceEnding />},
];

// ---------------------------------------------------------------- cover
// After the 1944 first edition of 《传奇》 (cover designed by Eileen Chang, calligraphy by 邓散木), as a Vox thumbnail:
// 「傳奇」 and 「張愛玲」 are the original calligraphy extracted from the cover (ink masks, strokes unaltered); 「傳奇」 sits
// back at 42 %, the 1954 兰心 portrait is a halftone cut-out on a disc, and 「一生」 is set small in 宋体.
const Cover: React.FC = () => {
  const {H, W} = useB();
  const g = (n: string) => staticFile(`evidence/eileen/glyph_${n}.png`);
  const col = W * 0.27; // width of each title glyph
  return (
    <AbsoluteFill>
      {/* 傳奇: the original 邓散木 calligraphy from the cover, a little smaller and pushed back */}
      <Img src={staticFile('evidence/eileen/chuanqi_glyphs.png')} style={{position: 'absolute', left: W * 0.05, top: H * 0.03, width: W * 0.5, height: (W * 0.5) / 0.6336, opacity: 0.42}} />
      <div style={{position: 'absolute', left: W * 0.3, top: H * 0.2, width: W * 0.8, height: W * 0.8, borderRadius: '50%', background: '#3E8494'}} />
      {/* the 1954 兰心 portrait as a printed cut-out (step 4 = already landed on frame 0) */}
      <PrintCutout src={cut('p1954')} aspect={A.p1954} widthPx={W * 0.74} x={34} y={19} rot={-1} step={4} enter="none" pitchPctH={0.38} paperColor="#F2EEE4" wobble={0} />
      {/* 張愛玲: the original title calligraphy, stacked; 「一生」 small in 宋体 */}
      <div style={{position: 'absolute', left: W * 0.055, top: H * 0.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: H * 0.012}}>
        <Img src={g('zhang')} style={{width: col, height: col / 1.5109}} />
        <Img src={g('ai')} style={{width: col * 0.82, height: (col * 0.82) / 1.1595}} />
        <Img src={g('ling')} style={{width: col, height: col / 1.6417}} />
        <div style={{fontFamily: ROLE.book, fontWeight: 900, fontSize: W * 0.07, letterSpacing: '0.18em', color: '#141413', marginTop: H * 0.008}}>一生</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- opening montage: her photos, one per beat
const MONTAGE: Array<{src: string; aspect: number; label: string; x: number; y: number; rot: number}> = [
  {src: ev('child_chair.jpg'), aspect: 0.752, label: '童年', x: 3, y: 2, rot: -3},
  {src: ev('child1924.jpg'), aspect: 0.73, label: '约 1924', x: 36, y: 4, rot: 2},
  {src: ev('hku_id.jpg'), aspect: 0.634, label: '1939', x: 68, y: 1, rot: -2},
  {src: cut('p1944a'), aspect: A.p1944a, label: '1944', x: 2, y: 23, rot: 2},
  {src: cut('p1944c'), aspect: A.p1944c, label: '1944', x: 35, y: 25, rot: -2},
  {src: ev('li_xianglan_1945.jpg'), aspect: A.li1945, label: '1945', x: 68, y: 22, rot: 3},
  {src: cut('p1950'), aspect: A.p1950, label: '约 1950', x: 3, y: 44, rot: -2},
  {src: cut('p1954'), aspect: A.p1954, label: '1954', x: 35, y: 44, rot: 1},
  {src: cut('p1955'), aspect: A.p1955, label: '1955', x: 68, y: 43, rot: -3},
  {src: cut('p1966'), aspect: A.p1966, label: '约 1966', x: 14, y: 65, rot: 2},
  {src: cut('p1994'), aspect: A.p1994, label: '1994', x: 52, y: 65, rot: -2},
];
const Montage: React.FC = () => {
  const {st} = useB();
  return (
    <>
      {MONTAGE.map((m, i) => (
        <React.Fragment key={i}>
          <Photo k={i * 1.1} src={m.src} aspect={m.aspect} w={m.aspect > 0.9 ? 31 : 26} x={m.x} y={m.y} rot={m.rot} pitch={0.3} />
          {st(i * 1.1 + 1) >= 0 ? <Strip k={i * 1.1 + 1} text={m.label} x={m.x + 1} y={m.y + 17.5} size={1.9} bg={P.ink} rot={0} font={ROLE.label} /> : null}
        </React.Fragment>
      ))}
    </>
  );
};

// ---------------------------------------------------------------- ending: her voice
// Radcliffe Institute seminar talk, "Chinese Translation: A Vehicle of Cultural Influence" (dated 1 Apr 1969 by scholars;
// catalogued undated), Schlesinger Library RA.T-106. English as heard; Chinese translation ours.
const VOICE_AT = 202 * 24; // music ducks 200–202 s (to −11 dB) and keeps playing under her voice
const VOICE_CUES: Array<{from: number; to: number; en: string; zh: string}> = [
  {from: 0.1, to: 3.35, en: 'We need literature that\'s more relevant to our life.', zh: '我们需要和自己的生活更相关的文学。'},
  {from: 3.45, to: 7.25, en: 'The old things are there, as good as ever,', zh: '旧的东西还在，依然很好，'},
  {from: 7.35, to: 10.9, en: 'but like old clothes, no longer fit.', zh: '只是像旧衣服一样，不再合身了。'},
];
const VoiceEnding: React.FC = () => {
  const {f, H, W} = useB();
  const g = useCurrentFrame() + 0; // local frame inside the shot
  const shotStart = F[SHOTS[SHOTS.length - 1].b];
  const t = (shotStart + g - VOICE_AT) / 24; // seconds into the voice
  const fade = (a: number) => Math.min(1, Math.max(0, a));
  const cue = VOICE_CUES.find((c) => t >= c.from && t < c.to + 0.35);
  const env = voiceData.env;
  const k = Math.max(0, Math.min(env.length - 1, Math.round(t * 24)));
  const bars = 41;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: '8%', top: '12%', opacity: fade(f / 12)}}>
        <HeadlineStrip text="她的声音" step={Math.floor(f / 2)} sizePctH={4.2} x={0} y={0} bg={P.rice} fg={P.ink} rot={-2} font={ROLE.strip} />
      </div>
      <div style={{position: 'absolute', left: '8%', top: '19.5%', opacity: fade((f - 8) / 12), fontFamily: ROLE.num, fontWeight: 600, fontSize: H * 0.017, letterSpacing: '0.14em', color: P.pink}}>ORIGINAL VOICE · 1969</div>
      <svg width={W} height={H * 0.12} style={{position: 'absolute', left: 0, top: H * 0.3}}>
        {Array.from({length: bars}).map((_, i) => {
          const j = Math.max(0, Math.min(env.length - 1, k - (bars >> 1) + i));
          const a = t < 0 || t > 11 ? 0.04 : env[j];
          const h = Math.max(H * 0.004, a * H * 0.1);
          const x = W * 0.08 + (i / (bars - 1)) * W * 0.84;
          return <rect key={i} x={x - W * 0.006} y={H * 0.06 - h / 2} width={W * 0.012} height={h} rx={W * 0.006} fill={i === bars >> 1 ? P.red : P.rice} opacity={i === bars >> 1 ? 1 : 0.55} />;
        })}
      </svg>
      {cue ? (
        <div style={{position: 'absolute', left: '8%', right: '8%', top: '47%', opacity: fade(Math.min((t - cue.from) * 6, (cue.to + 0.35 - t) * 6))}}>
          <div style={{fontFamily: ROLE.latin, fontSize: H * 0.03, lineHeight: 1.35, color: P.rice}}>{cue.en}</div>
          <div style={{fontFamily: ROLE.quote, fontWeight: 500, fontSize: H * 0.027, lineHeight: 1.45, color: P.pink, marginTop: H * 0.016}}>{cue.zh}</div>
        </div>
      ) : null}
      <div style={{position: 'absolute', left: '8%', right: '8%', top: '80%', opacity: fade((f - 12) / 12), fontFamily: ROLE.label, fontWeight: 400, fontSize: H * 0.0165, lineHeight: 1.5, color: 'rgba(237,228,207,.7)'}}>
        原声馆藏：哈佛大学施莱辛格图书馆 · RA.T-106 / Reyher
        <br />
        1969 年拉德克利夫研究所讲座（英文）
      </div>
      <Credit k={0} at={VOICE_AT + 11.6 * 24 - shotStart} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- credit + year ruler

/** producer credit, bottom of the closing shot: 制作 + mark + zeno.yczc (no sources card, no watermark elsewhere) */
const Credit: React.FC<{k: number; at?: number}> = ({k, at}) => {
  const {f, B, H, W} = useB();
  const o = Math.min(1, Math.max(0, (f - (at ?? B(k))) / 14));
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: '90.5%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: W * 0.02, opacity: o}}>
      <span style={{fontFamily: ROLE.label, fontWeight: 700, fontSize: H * 0.021, color: 'rgba(237,228,207,.92)'}}>制作</span>
      <Img src={staticFile('brand/zeno-mark-dark.svg')} style={{width: H * 0.03, height: H * 0.03}} />
      <span style={{fontFamily: ROLE.num, fontWeight: 500, fontSize: H * 0.021, color: 'rgba(237,228,207,.92)', letterSpacing: '0.02em'}}>zeno.yczc</span>
    </div>
  );
};

// works shown as ticks on the ruler once their year has passed
const WORK_YEARS = [1940, 1943, 1944, 1947, 1950, 1954, 1956, 1957, 1966, 1967, 1968, 1969, 1977, 1983, 1994];
const Y0 = 1920;
const Y1 = 1995;
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
  const ink = dark ? 'rgba(237,228,207,.85)' : 'rgba(27,26,24,.8)';
  const x0 = W * 0.08;
  const x1 = W * 0.92;
  const X = (y: number) => x0 + ((y - Y0) / (Y1 - Y0)) * (x1 - x0);
  const yLine = H * 0.885;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <line x1={x0} x2={x1} y1={yLine} y2={yLine} stroke={ink} strokeWidth={H * 0.0018} />
      {[1920, 1940, 1960, 1980].map((y) => (
        <g key={y}>
          <line x1={X(y)} x2={X(y)} y1={yLine - H * 0.006} y2={yLine + H * 0.006} stroke={ink} strokeWidth={H * 0.0016} />
          <text x={X(y)} y={yLine + H * 0.022} textAnchor="middle" fontFamily={ROLE.num} fontWeight={600} fontSize={H * 0.0135} fill={ink}>{y}</text>
        </g>
      ))}
      <line x1={X(1995)} x2={X(1995)} y1={yLine - H * 0.006} y2={yLine + H * 0.006} stroke={ink} strokeWidth={H * 0.0016} />
      <text x={X(1995)} y={yLine + H * 0.022} textAnchor="middle" fontFamily={ROLE.num} fontWeight={600} fontSize={H * 0.0135} fill={ink}>1995</text>
      {WORK_YEARS.filter((y) => y <= year + 0.01).map((y) => (
        <rect key={y} x={X(y) - H * 0.002} y={yLine - H * 0.016} width={H * 0.004} height={H * 0.012} fill={dark ? P.pink : P.red} />
      ))}
      <rect x={x0} y={yLine - H * 0.0018} width={X(year) - x0} height={H * 0.0036} fill={P.red} />
      <circle cx={X(year)} cy={yLine} r={H * 0.0075} fill={P.red} stroke={dark ? P.rice : P.paper} strokeWidth={H * 0.002} />
      <text x={X(year)} y={yLine - H * 0.024} textAnchor="middle" fontFamily={ROLE.num} fontWeight={800} fontSize={H * 0.019} fill={ink}>{Math.round(year)}</text>
      {shot.age ? (
        <text x={X(year)} y={yLine - H * 0.045} textAnchor="middle" fontFamily={ROLE.label} fontWeight={700} fontSize={H * 0.016} fill={dark ? P.pink : P.red}>{shot.age}</text>
      ) : null}
    </svg>
  );
};

// ---------------------------------------------------------------- composition

export const EILEEN_DURATION = 5208; // 217 s: song to 200 s, fade to 202 s, her voice to ~213 s, credit
const CUES = SHOTS.flatMap((s) => (s.sfx ?? []).map(([k, event]) => ({at: Math.round(beatAt(s.b + k * (s.pace ?? 1))), event, db: -24})));

const ShotView: React.FC<{def: ShotDef; dur: number}> = ({def, dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {C, cam} = def;
  const drift = Math.min(0.015, (0.05 * fps) / dur); // a whole shot pushes in ≤ 5 %
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

export const EileenChang: React.FC = () => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: P.ink}}>
      <CollageFilters scale={height / 1080} seed={7} />
      <Audio src={staticFile('audio/raw/eileen/yuanlai.mp3')} volume={(fr) => interpolate(fr, [200 * 24, 202 * 24], [1, 0.28], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      <Sequence from={VOICE_AT}>
        <Audio src={staticFile('audio/raw/eileen/voice.wav')} volume={1.5} />
      </Sequence>
      <SfxTrack cues={CUES} />
      {SHOTS.map((s, i) => {
        const from = i === 0 ? 0 : F[s.b];
        const to = i + 1 < SHOTS.length ? F[SHOTS[i + 1].b] : EILEEN_DURATION;
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
