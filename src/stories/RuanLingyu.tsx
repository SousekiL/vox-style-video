// 阮玲玉 · 一生 (1080×1920, 24 fps, ≈4:12): vox-collage biography cut to 黄莺莺《葬心》 (from 0:40; the theme song of
// 关锦鹏's 1991 film 《阮玲玉》). Beats: a fitted 84 bpm grid (data/ruan-beats.json); shots cut on beats and the chapters
// follow the song: verse = childhood and debut, rise = 联华 years, first climax = 《神女》《新女性》, the quiet stretch at
// 129 s = her death and the two disputed notes, the last climax = funeral, film and legacy.
// Facts: dataviz-studio/projects/culture-language/ruan-lingyu-vox/FACTCHECK.md. 「人言可畏」 is shown as disputed.
// Photos and film clips are 1920s–30s Chinese works, public domain in China (50 years from publication); film clips are
// muted, cropped clear of modern watermarks; intertitles keep their original traditional characters. No lyrics on screen.
import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
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
import beatData from './data/ruan-beats.json';

const F: number[] = beatData.beats; // frame of every beat on the 84 bpm grid
const KAI = loadLocalFont('Kai Eileen', 'fonts/kai-eileen.woff', '500'); // subset of LXGW WenKai Medium (OFL)
const EC_SANS = 'EC Sans'; // Source Han Sans SC subset (OFL)
loadLocalFont(EC_SANS, 'fonts/ec-sans-Regular.woff', '400');
loadLocalFont(EC_SANS, 'fonts/ec-sans-Bold.woff', '700');
loadLocalFont(EC_SANS, 'fonts/ec-sans-Heavy.woff', '900');
const EC_SERIF = loadLocalFont('EC Serif', 'fonts/ec-serif-black.woff', '900'); // Noto Serif SC Black subset (OFL)

// ---- fonts by role (one font per element) ----
const ROLE = {
  chip: {font: EC_SANS, weight: 900},
  strip: EC_SANS,
  book: EC_SERIF, // film titles: 宋体
  num: VOX_FONT.sans,
  quote: KAI, // original words: 文楷
  label: EC_SANS,
};

// ---- silver-screen palette: silver, charcoal, ivory, lipstick red, slate ----
const P = {ivory: '#EFE9DD', paper: '#F6F1E6', silver: '#BDB8AE', ink: '#1E1D1B', red: '#A3333D', slate: '#55626B', pink: '#D6A2A0'};
const COVER_BG = '#9C9C9C'; // measured from the 《神女》 portrait background
const DARK = new Set([P.ink, P.red, P.slate]);
const chips = (pairs: Array<[string, string]>): ChipStyle[] => pairs.map(([bg, fg]) => ({bg, fg, font: ROLE.chip.font, weight: ROLE.chip.weight}));
const POP = chips([[P.ink, P.ivory], [P.ivory, P.red], [P.red, P.ivory]]);
const ON_DARK = chips([[P.ivory, P.ink], [P.red, P.ivory], [P.silver, P.ink]]);

const cut = (n: string) => staticFile(`cutouts/ruan/${n}.png`);
const ev = (n: string) => staticFile(`evidence/ruan/${n}`);
const clip = (n: string) => staticFile(`assets/raw/ruan/clips/${n}.mp4`);
const A: Record<string, number> = {
  goddess: 0.734, portrait9: 0.688, portrait7: 0.564,
  liangyou1928: 0.732, liangyou030: 0.709, liangyou099: 0.7, portraitA: 0.694, portraitB: 0.772, portrait5: 0.746, gudu: 0.928,
  taohua: 1.169, xiaowanyi: 1.108, shennv1: 1.291, xinnvxing1: 1.328, funeral1: 0.686, funeral2: 0.984, ad1935: 0.577, debut: 0.864,
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
  const st = (k: number) => Math.floor((f - B(k)) / 2);
  return {f, fps, W, H, B, st};
};

// ---------------------------------------------------------------- building blocks

const Strip: React.FC<{k: number; text: string; x: number; y: number; size?: number; bg?: string; fg?: string; rot?: number; font?: string}> = ({k, text, x, y, size = 3.2, bg = P.ink, fg = P.ivory, rot = -2, font = ROLE.strip}) => {
  const {st} = useB();
  return <HeadlineStrip text={text} step={st(k)} sizePctH={size} x={x} y={y} bg={bg} fg={fg} rot={rot} font={font} />;
};
const Cut: React.FC<{k: number; text: string; x: number; y: number; size: number; dark?: boolean; per?: number}> = ({k, text, x, y, size, dark = false, per = 8}) => {
  const {st} = useB();
  return <CutLetters text={text} step={st(k)} perChar={per} sizePctH={size} styles={dark ? ON_DARK : POP} x={x} y={y} seed={text} />;
};
const Film: React.FC<{k: number; title: string; note?: string; x: number; y: number; size?: number; rot?: number; noteBg?: string}> = ({k, title, note, x, y, size = 4, rot = -2, noteBg = P.ink}) => (
  <>
    <Strip k={k} text={title} x={x} y={y} size={size} bg={P.paper} fg={P.ink} rot={rot} font={ROLE.book} />
    {note ? <Strip k={k + 0.5} text={note} x={x + 1.5} y={y + size * 1.45} size={2.1} bg={noteBg} fg={P.ivory} rot={rot * -0.5} font={ROLE.label} /> : null}
  </>
);
const Quote: React.FC<{k: number; text: string; by?: string; x: number; y: number; w: number; size?: number; rot?: number; head?: string}> = ({k, text, by, x, y, w, size = 4.6, rot = -1, head}) => {
  const {st, H} = useB();
  const s = st(k);
  if (s < 0) return null;
  const fs = (size / 100) * H;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, maxWidth: `${w}%`, transform: `rotate(${rot}deg) scale(${SLAP[Math.min(s, 3)]})`, transformOrigin: '0 0', filter: `url(#stickerTorn) drop-shadow(0 ${H * 0.007}px ${H * 0.008}px rgba(0,0,0,.4))`}}>
      <div style={{position: 'absolute', inset: 0, background: P.paper}} />
      {head ? <div style={{position: 'relative', padding: `${fs * 0.28}px ${fs * 0.42}px 0`, fontFamily: ROLE.label, fontWeight: 700, fontSize: H * 0.0185, color: P.red}}>{head}</div> : null}
      <div style={{position: 'relative', padding: `${fs * 0.32}px ${fs * 0.42}px`, fontFamily: ROLE.quote, fontWeight: 500, fontSize: fs, lineHeight: 1.38, color: P.ink, whiteSpace: 'pre-line'}}>{text}</div>
      {by && s >= 4 ? <div style={{position: 'relative', padding: `0 ${fs * 0.42}px ${fs * 0.3}px`, fontFamily: ROLE.label, fontWeight: 700, fontSize: H * 0.019, color: P.red}}>{by}</div> : null}
    </div>
  );
};
const Photo: React.FC<{k: number; src: string; aspect: number; w: number; x: number; y: number; rot?: number; enter?: 'slap' | 'drop' | 'slide' | 'none'; pitch?: number; wobble?: number; halftone?: boolean}> = ({k, src, aspect, w, x, y, rot = 0, enter = 'slap', pitch = 0.36, wobble = 0.5, halftone = true}) => {
  const {st, W} = useB();
  return <PrintCutout src={src} aspect={aspect} widthPx={(w / 100) * W} x={x} y={y} rot={rot} step={st(k)} enter={enter} pitchPctH={pitch} paperColor="#F2EEE4" wobble={wobble} halftone={halftone} />;
};
const Mark: React.FC<{k: number; kind: 'circle' | 'strike' | 'underline' | 'arrow'; box: {x: number; y: number; w: number; h: number}; color?: string}> = ({k, kind, box, color = P.red}) => {
  const {f, B} = useB();
  return <Annotate frame={f} at={B(k)} dur={8} kind={kind} box={box} widthPctH={0.55} color={color} seed={`${kind}${box.x}${box.y}`} />;
};
const Bits: React.FC<{k: number; items: Scrap[]; seed: string}> = ({k, items, seed}) => {
  const {st} = useB();
  return <Scraps step={st(k)} appearStep={0} seed={seed} items={items} />;
};

/** a one-line plot caption under a 《神女》 clip, in small type */
const Plot: React.FC<{k: number; text: string; x?: number; y: number; rot?: number}> = ({k, text, x = 7, y, rot = -1}) => (
  <Strip k={k} text={`剧情｜${text}`} x={x} y={y} size={2.15} bg={P.ivory} fg={P.ink} rot={rot} font={ROLE.label} />
);

/** a film clip in a strip of film stock (sprocket holes), slapped in on beat k, playing muted from `from` seconds */
const Clip: React.FC<{k: number; name: string; aspect: number; w: number; x: number; y: number; rot?: number; from?: number}> = ({k, name, aspect, w, x, y, rot = 0, from = 0}) => {
  const {st, B, W, H, fps} = useB();
  const s = st(k);
  if (s < 0) return null;
  const iw = (w / 100) * W;
  const ih = iw / aspect;
  const rail = iw * 0.075;
  const holes = Math.round(ih / (rail * 0.9));
  const railEl = (side: 'l' | 'r') => (
    <div style={{position: 'absolute', top: 0, bottom: 0, [side === 'l' ? 'left' : 'right']: 0, width: rail, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', alignItems: 'center'}}>
      {Array.from({length: holes}).map((_, i) => (
        <div key={i} style={{width: rail * 0.46, height: rail * 0.34, borderRadius: rail * 0.07, background: '#E9E4D8'}} />
      ))}
    </div>
  );
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: iw + rail * 2, height: ih + rail * 0.6, transform: `rotate(${rot}deg) scale(${SLAP[Math.min(s, 3)]})`, filter: `url(#stickerTorn) drop-shadow(0 ${H * 0.008}px ${H * 0.01}px rgba(0,0,0,.5))`}}>
      <div style={{position: 'absolute', inset: 0, background: '#121110'}} />
      {railEl('l')}
      {railEl('r')}
      <div style={{position: 'absolute', left: rail, top: rail * 0.3, width: iw, height: ih, overflow: 'hidden'}}>
        <Sequence from={B(k)} layout="none">
          <OffthreadVideo src={clip(name)} muted trimBefore={Math.round(from * fps)} style={{width: iw, height: ih, objectFit: 'cover', filter: 'grayscale(1) contrast(1.08)'}} />
        </Sequence>
      </div>
    </div>
  );
};

/** all 29 films in release order (zh.wikipedia filmography) as named tiles; the 9 that survive light up */
const FILMS: Array<[string, number, boolean?]> = [
  ['挂名的夫妻', 1927], ['北京杨贵妃', 1927], ['血泪碑', 1927], ['蔡状元建造洛阳桥', 1928], ['情欲宝鉴', 1929],
  ['珍珠冠', 1929], ['劫后孤鸿', 1929], ['银幕之花', 1929], ['大破九龙山', 1929], ['火烧九龙山', 1929],
  ['妇人心', 1929], ['自杀合同', 1930], ['野草闲花', 1930], ['故都春梦', 1930], ['恋爱与义务', 1931, true],
  ['一剪梅', 1931, true], ['桃花泣血记', 1931, true], ['玉堂春', 1931], ['续故都春梦', 1932], ['小玩意', 1933, true],
  ['三个摩登女性', 1933], ['城市之夜', 1934], ['归来', 1934, true], ['神女', 1934, true], ['人生', 1934],
  ['香雪海', 1934], ['再会吧，上海', 1934, true], ['新女性', 1935, true], ['国风', 1935, true],
];
const FilmGrid: React.FC<{k: number}> = ({k}) => {
  const {st, H} = useB();
  const cols = 5;
  return (
    <>
      {FILMS.map(([title, year, kept], i) => {
        const s = st(k + i * 0.18);
        if (s < 0) return null;
        const on = !!kept && st(k + 6) >= 0;
        const x = 6 + (i % cols) * 17.8;
        const y = 22 + Math.floor(i / cols) * 9.6;
        return (
          <div key={i} style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: '16%', height: '8.4%', transform: `rotate(${((i * 37) % 7) - 3}deg) scale(${SLAP[Math.min(s, 3)] * (on ? 1.06 : 1)})`, background: on ? P.ivory : '#3A3936', border: `${H * (on ? 0.003 : 0.002)}px solid ${on ? P.red : '#55534F'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: H * 0.003, padding: H * 0.004, boxSizing: 'border-box', boxShadow: `0 ${H * 0.004}px ${H * 0.006}px rgba(0,0,0,.4)`, zIndex: on ? 1 : 0}}>
            <span style={{fontFamily: ROLE.book, fontWeight: 900, fontSize: H * (title.length > 5 ? 0.0145 : 0.0158), color: on ? P.ink : '#8F8B84', textAlign: 'center', lineHeight: 1.15}}>{title}</span>
            <span style={{fontFamily: ROLE.num, fontWeight: 600, fontSize: H * 0.011, color: on ? P.red : '#6E6B66'}}>{year}</span>
          </div>
        );
      })}
    </>
  );
};

type ShotDef = {
  b: number;
  bg: string;
  dots?: 'tl' | 'tr' | 'bl' | 'br' | 'none';
  year?: number;
  age?: string;
  cam?: {from: [number, number, number]; to: [number, number, number]};
  src?: string;
  sfx?: Array<[number, SfxEvent]>;
  pace?: number;
  fade?: number; // beats to dissolve in over the previous shot
  C: React.FC;
};

// ---------------------------------------------------------------- the shots

const SHOTS: ShotDef[] = [
  // ── cover: the 《神女》 portrait, the film's own title and credit calligraphy
  {b: 0, bg: COVER_BG, dots: 'none', sfx: [[1, 'titleHit']], cam: {from: [50, 50, 1.0], to: [50, 47, 1.04]}, C: () => <Cover />},
  // ── her faces, one per beat
  {b: 4, bg: P.ivory, dots: 'none', src: '图：《良友》画报、联华影业剧照及维基共享资源（公有领域）', sfx: [[0, 'printLand'], [1, 'printLand'], [2, 'printLand'], [3, 'printLand'], [4, 'printLand'], [5, 'printLand'], [6, 'printLand'], [7, 'printLand'], [8, 'printLand'], [9, 'printLand'], [10, 'printLand'], [11, 'printLand']],
    C: () => <Montage />},

  // ── verse: 1910–1928
  {b: 18, bg: P.ivory, dots: 'tr', year: 1910, age: '0 岁', src: '据《民国人物传》、Meyer《阮玲玉：上海的女神》', sfx: [[0, 'slam'], [2, 'popIn'], [3, 'popIn'], [5, 'slide'], [6, 'slide']],
    C: () => (
      <>
        <Strip k={0} text="1910.4.26" x={7} y={7} size={6} bg={P.ink} fg={P.ivory} font={ROLE.num} />
        <Strip k={1} text="生于上海" x={8} y={17} size={3.4} bg={P.red} />
        <Cut k={2} text="阮凤根" x={8} y={25} size={9} />
        <Strip k={4} text="学名阮玉英 · 祖籍广东香山" x={9} y={40} size={2.8} bg={P.ink} rot={1} />
        <Strip k={5} text="约 1916 · 父亲病逝" x={8} y={52} size={3.2} bg={P.slate} />
        <Strip k={6} text="母亲在张家帮佣" x={10} y={58.5} size={3.2} bg={P.ink} rot={1} />
        <Bits k={3} seed="r1" items={[{kind: 'star', x: 78, y: 10, size: 6, color: P.red}, {kind: 'half', x: 74, y: 64, size: 8, rot: 20, color: P.slate}]} />
      </>
    )},
  {b: 26, bg: P.silver, dots: 'bl', year: 1926, src: '图：《良友》1928.4.30（公有领域）', sfx: [[0, 'slam'], [1, 'slide'], [2, 'popIn'], [3, 'printLand'], [5, 'slide']],
    C: () => (
      <>
        <Strip k={0} text="1926 · 16 岁" x={7} y={7} size={4.4} bg={P.ink} />
        <Strip k={1} text="考入明星影片公司" x={8} y={15} size={3.4} bg={P.red} rot={1} />
        <Film k={2} title="《挂名的夫妻》" note="1927 · 处女作 · 卜万苍导演" x={6} y={24} size={4.4} />
        <Photo k={3} src={ev('debut_luoyang.jpg')} aspect={A.debut} w={56} x={38} y={38} rot={3} />
        <Strip k={5} text="1928 年的剧照" x={40} y={81} size={2.4} bg={P.ink} rot={1} />
      </>
    )},
  {b: 34, bg: P.ivory, dots: 'tl', year: 1928, src: '图：《良友》第 30 期封面，1928（公有领域）', sfx: [[0, 'printLand'], [1, 'slam'], [2, 'slide'], [4, 'printLand']],
    C: () => (
      <>
        <Photo k={0} src={ev('liangyou030.jpg')} aspect={A.liangyou030} w={58} x={36} y={10} rot={2} pitch={0.3} />
        <Strip k={1} text="1928" x={6} y={9} size={5.6} bg={P.ink} fg={P.ivory} font={ROLE.num} />
        <Strip k={2} text="登上《良友》封面" x={6} y={19} size={3.2} bg={P.red} />
        <Photo k={4} src={ev('liangyou1928.jpg')} aspect={A.liangyou1928} w={36} x={4} y={44} rot={-3} pitch={0.3} />
        <Strip k={5} text="转入大中华百合" x={6} y={81} size={2.6} bg={P.ink} rot={1} />
      </>
    )},

  // ── the 联华 years 1930–1933
  {b: 41, bg: P.slate, dots: 'br', year: 1930, src: '图：《故都春梦》剧照（公有领域）', sfx: [[0, 'slam'], [1, 'slide'], [2, 'printLand'], [4, 'popIn'], [5, 'popIn']],
    C: () => (
      <>
        <Strip k={0} text="1930 · 加入联华" x={6} y={7} size={4.4} bg={P.ivory} fg={P.ink} />
        <Strip k={1} text="一举走红" x={7} y={15} size={3.4} bg={P.red} rot={1} />
        <Photo k={2} src={ev('gudu.jpg')} aspect={A.gudu} w={62} x={33} y={20} rot={2} pitch={0.32} />
        <Film k={4} title="《故都春梦》" note="1930 · 孙瑜" x={5} y={63} size={4.2} />
        <Film k={5} title="《野草闲花》" note="1930 · 孙瑜" x={42} y={72} size={4.2} rot={2} />
      </>
    )},
  {b: 48, bg: P.ivory, dots: 'tr', year: 1931, src: '图：《桃花泣血记》剧照（公有领域）', sfx: [[0, 'printLand'], [2, 'popIn'], [3, 'popIn'], [4, 'popIn']],
    C: () => (
      <>
        <Photo k={0} src={ev('taohua.jpg')} aspect={A.taohua} w={84} x={8} y={8} rot={-2} pitch={0.32} />
        <Film k={2} title="《恋爱与义务》" note="1931 · 卜万苍" x={5} y={50} size={4} />
        <Film k={3} title="《一剪梅》" note="1931 · 卜万苍" x={44} y={60} size={4} rot={2} />
        <Film k={4} title="《桃花泣血记》" note="1931 · 卜万苍" x={8} y={70} size={4} rot={-1} noteBg={P.red} />
      </>
    )},
  {b: 55, bg: P.silver, dots: 'bl', year: 1933, src: '图：《小玩意》剧照（公有领域）', sfx: [[0, 'printLand'], [2, 'popIn'], [4, 'popIn']],
    C: () => (
      <>
        <Photo k={0} src={ev('xiaowanyi.jpg')} aspect={A.xiaowanyi} w={82} x={9} y={10} rot={2} pitch={0.32} />
        <Film k={2} title="《小玩意》" note="1933 · 孙瑜" x={6} y={58} size={4.4} />
        <Film k={4} title="《三个摩登女性》" note="1933 · 卜万苍 · 已失传" x={30} y={70} size={4} rot={2} noteBg={P.slate} />
      </>
    )},
  {b: 62, bg: P.ink, dots: 'none', src: '片目据中文维基百科；《归来》《再会吧，上海》为残本', sfx: [[0, 'slam'], [6, 'burst']],
    C: () => (
      <>
        <Strip k={0} text="一生拍了 29 部电影" x={6} y={7} size={4} bg={P.ivory} fg={P.ink} />
        <Strip k={1} text="今天能看到的，只剩 9 部" x={7} y={14} size={3} bg={P.red} rot={1} />
        <FilmGrid k={1.5} />
      </>
    )},

  // ── 《神女》 1934
  {b: 72, bg: P.slate, dots: 'tr', year: 1934, age: '24 岁', src: '影片：《神女》，联华，1934（公有领域）', sfx: [[0, 'slam'], [1, 'slide'], [3, 'printLand']],
    C: () => (
      <>
        <Film k={0} title="《神女》" note="1934.12 · 吴永刚导演处女作" x={6} y={7} size={5.4} />
        <Strip k={2} text="她演一个为养育孩子而卖身的母亲" x={6} y={22} size={2.7} bg={P.ink} rot={1} />
        <Clip k={3} name="g_opencard" aspect={4 / 3} w={84} x={4} y={32} rot={-1} />
      </>
    )},
  {b: 84, bg: P.ink, dots: 'none', src: '影片：《神女》，联华，1934（公有领域）', sfx: [[0, 'printLand'], [4, 'printLand']],
    C: () => (
      <>
        <Clip k={0} name="s_street" aspect={4 / 3} w={84} x={4} y={9} rot={-1} />
        <Plot k={1} text="为养活幼子，她夜里上街" y={41.5} />
        <Clip k={4} name="s_zhan" aspect={4 / 3} w={84} x={4} y={48} rot={1} />
        <Plot k={5} text="躲警察时，她闯进流氓“老大”的屋子" y={80.5} rot={1} />
      </>
    )},
  {b: 94, bg: P.ink, dots: 'none', src: '影片：《神女》，联华，1934（公有领域）；部分片段来自 1905 电影网', sfx: [[0, 'printLand'], [7, 'printLand']],
    C: () => (
      <>
        <Clip k={0} name="g_jianzhong" aspect={4 / 3} w={84} x={4} y={9} rot={-1} />
        <Plot k={1.5} text="孩子被邻居骂作“贱种”" y={41.5} />
        <Clip k={7} name="s_wall" aspect={4 / 3} w={84} x={4} y={48} rot={1} />
        <Plot k={8.5} text="她把积蓄藏进墙洞，供孩子上学" y={80.5} rot={1} />
      </>
    )},

  // ── 《新女性》 1935 (based on 艾霞)
  {b: 110, bg: P.ivory, dots: 'tl', year: 1935, age: '24 岁', src: '图：《新女性》剧照（公有领域）；艾霞生平据维基百科', sfx: [[0, 'printLand'], [1, 'slam'], [3, 'slide'], [5, 'slide'], [7, 'slide']],
    C: () => (
      <>
        <Photo k={0} src={ev('xinnvxing1.jpg')} aspect={A.xinnvxing1} w={86} x={7} y={22} rot={-2} pitch={0.32} />
        <Film k={1} title="《新女性》" note="1935 · 蔡楚生" x={6} y={6} size={5.2} />
        <Strip k={3} text="原型：女演员、编剧艾霞" x={6} y={60} size={3} bg={P.ink} />
        <Strip k={5} text="1934 年 2 月，艾霞服毒自尽" x={8} y={66.5} size={3} bg={P.red} rot={1} />
        <Strip k={7} text="年仅 21 岁" x={9} y={72.5} size={3} bg={P.ink} rot={-1} />
      </>
    )},
  {b: 119, bg: P.ink, dots: 'none', src: '影片：《新女性》，联华，1935（公有领域）', sfx: [[0, 'printLand'], [3, 'slide'], [5, 'slide']],
    C: () => (
      <>
        <Clip k={0} name="n_news" aspect={884 / 564} w={86} x={3} y={14} rot={-1} />
        <Strip k={2} text="片中，小报争相叫卖女主角之死" x={5} y={56} size={2.8} bg={P.ivory} fg={P.ink} />
        <Strip k={3.5} text="上映后，上海新闻记者公会抗议" x={6} y={63} size={2.8} bg={P.red} rot={1} />
        <Strip k={5} text="联华登报道歉" x={7} y={69.5} size={2.8} bg={P.ivory} fg={P.ink} rot={-1} />
      </>
    )},
  {b: 126, bg: P.ink, dots: 'none', src: '影片：《新女性》，联华，1935（公有领域）', sfx: [[0, 'printLand']],
    C: () => (
      <>
        <Clip k={0} name="n_live" aspect={884 / 564} w={92} x={0} y={24} rot={0} from={6} />
        <Plot k={1.5} text="朋友读出小报的污蔑，想激起她求生的念头" x={5} y={61} />
        <Strip k={8.5} text="韦明的最后一句" x={6} y={12} size={3.4} bg={P.ivory} fg={P.ink} />
      </>
    )},

  // ── the storm, early 1935: who 张达民 and 唐季珊 were, then the lawsuit
  {b: 140, bg: P.silver, dots: 'tl', year: 1935, age: '24 岁', src: '据中文维基百科、Meyer《阮玲玉：上海的女神》', sfx: [[0, 'slam'], [2, 'slide'], [4, 'slide'], [6, 'slide'], [8, 'slam'], [9, 'slide']],
    C: () => (
      <>
        <Photo k={0} src={ev('portraitB.jpg')} aspect={A.portraitB} w={36} x={60} y={38} rot={3} pitch={0.32} />
        <Cut k={0} text="张达民" x={5} y={7} size={7} per={3} />
        <Strip k={2} text="母亲帮佣那户人家的少爷" x={5} y={19} size={2.8} bg={P.ink} />
        <Strip k={4} text="1926 年，16 岁的她与他同居" x={6} y={25} size={2.8} bg={P.ink} rot={1} />
        <Strip k={6} text="1933 年分开，约定每月付他 100 元" x={5} y={31} size={2.6} bg={P.red} />
        <Cut k={8} text="唐季珊" x={5} y={54} size={7} per={3} />
        <Strip k={9} text="茶商，1933 年起与她同居" x={6} y={66} size={2.8} bg={P.ink} rot={-1} />
      </>
    )},
  {b: 153, bg: P.ivory, dots: 'br', year: 1935, age: '24 岁', src: '据中文维基百科、Meyer《阮玲玉：上海的女神》', sfx: [[0, 'printLand'], [1, 'slam'], [3, 'slide'], [5, 'slide'], [6, 'slide'], [7, 'slide']],
    C: () => (
      <>
        <Strip k={1} text="1935 年初" x={5} y={8} size={4.4} bg={P.ink} />
        <Strip k={3} text="张达民提起诉讼" x={5} y={17} size={3.2} bg={P.red} />
        <Strip k={5} text="告她侵占财物" x={6} y={24} size={2.8} bg={P.ink} rot={1} />
        <Strip k={6} text="告她与唐季珊“妨害家庭”" x={5} y={30} size={2.8} bg={P.ink} rot={-1} />
        <Strip k={7} text="定于 3 月 9 日开庭" x={6} y={36} size={2.8} bg={P.slate} rot={1} />
        <Photo k={0} src={ev('portraitA.jpg')} aspect={A.portraitA} w={40} x={54} y={44} rot={3} pitch={0.32} />
      </>
    )},
  {b: 162, bg: P.ink, dots: 'none', year: 1935, age: '24 岁', src: '影片：《神女》，联华，1934（公有领域）', sfx: [[0, 'slam'], [3, 'printLand'], [6, 'slide']],
    C: () => (
      <>
        <Cut k={0} text="小报连日渲染" x={4} y={6} size={6.4} per={3} dark />
        <Strip k={1.5} text="她的私生活成了街谈巷议" x={6} y={20} size={2.8} bg={P.red} />
        <Clip k={3} name="s_gossip" aspect={4 / 3} w={84} x={4} y={30} rot={-1} />
        <Plot k={5} text="《神女》里，家长们也这样议论她" y={62.5} />
      </>
    )},
  {b: 170, bg: P.silver, dots: 'tl', year: 1935, age: '24 岁', src: '图：维基共享资源（公有领域）', sfx: [[0, 'printLand'], [2, 'popIn'], [4, 'slide']],
    C: () => (
      <>
        <Photo k={0} src={cut('portrait7')} aspect={A.portrait7} w={46} x={48} y={8} rot={-2} />
        <Film k={2} title="《国风》" note="1935 · 遗作" x={6} y={14} size={4.6} />
        <Strip k={4} text="这是她的最后一部电影" x={6} y={30} size={2.8} bg={P.ink} rot={1} />
      </>
    )},

  // ── the quiet stretch: her death and the two notes
  {b: 181, bg: P.ink, dots: 'none', year: 1935, age: '24 岁', src: '据 Meyer《阮玲玉：上海的女神》', sfx: [[0, 'titleHit'], [3, 'slide'], [5, 'slide']],
    C: () => (
      <>
        <Photo k={0} src={cut('portrait9')} aspect={A.portrait9} w={58} x={38} y={12} rot={1} />
        <Strip k={1} text="1935.3.8" x={5} y={10} size={5.6} bg={P.ivory} fg={P.ink} font={ROLE.num} />
        <Strip k={3} text="开庭前一天，国际妇女节" x={6} y={20} size={3} bg={P.red} />
        <Strip k={5} text="服安眠药离世，年仅 24 岁" x={5} y={72} size={3} bg={P.ivory} fg={P.ink} />
      </>
    )},
  {b: 192, bg: P.silver, dots: 'none', src: '据《联华画报》1935.4.1、《思明商学报》1935.4.26；Meyer', sfx: [[0, 'slam'], [2, 'pageTurn'], [6, 'pageTurn'], [10, 'slam']],
    C: () => (
      <>
        <Cut k={0} text="两份遗书" x={6} y={5} size={6.6} per={3} />
        <Quote k={2} head="唐季珊公布 · 1935.4.1《联华画报》" text={"「……还是怕\n　人言可畏，\n　人言可畏罢了。」"} x={4} y={18} w={62} size={3.2} rot={-2} />
        <Quote k={6} head="另一版本 · 1935.4.26《思明商学报》" text={"「没有你那晚打我，\n　今晚又打我，\n　我大约不会\n　这样做吧！」"} x={36} y={40} w={62} size={3.2} rot={2} />
        <Strip k={10} text="但哪一份才出自她手，" x={6} y={71} size={3.6} bg={P.ink} />
        <Strip k={11} text="至今未见笔迹鉴定" x={8} y={78} size={2.6} bg={P.red} rot={1} />
      </>
    )},
  {b: 208, bg: P.ivory, dots: 'tr', src: '文出鲁迅《论“人言可畏”》，《太白》1935.5.20', sfx: [[0, 'popIn'], [2, 'slide'], [3, 'pageTurn'], [10, 'pageTurn']],
    C: () => (
      <>
        <Film k={0} title="《论“人言可畏”》" note="1935.5.20 ·《太白》· 署名赵令仪" x={5} y={6} size={4.4} />
        <Strip k={2} text="鲁迅撰文，矛头指向报刊" x={6} y={19} size={3} bg={P.ink} />
        <Quote k={3} text={"「于是阮玲玉之流，\n　就成了发扬余威的\n　好材料了，\n　因为她颇有名，却无力。」"} x={5} y={26} w={86} size={3.4} rot={-1} />
        <Quote k={10} text={"「她的以为\n　“人言可畏”，\n　是真的」"} by="——鲁迅" x={30} y={55} w={64} size={4.2} rot={2} />
      </>
    )},

  // ── last climax: funeral, the films, the legacy
  {b: 226, bg: P.ink, dots: 'none', src: '图：1935 年葬礼（维基共享资源，公有领域）；人数据 Meyer', sfx: [[0, 'printLand'], [2, 'printLand'], [3, 'slam'], [5, 'slide']],
    C: () => (
      <>
        <Strip k={0} text="1935.3.14 · 出殡" x={5} y={6} size={3.6} bg={P.ivory} fg={P.ink} />
        <Photo k={1} src={ev('funeral1.jpg')} aspect={A.funeral1} w={48} x={4} y={20} rot={-2} pitch={0.3} />
        <Photo k={2} src={ev('funeral2.jpg')} aspect={A.funeral2} w={46} x={50} y={30} rot={3} pitch={0.3} />
        <Cut k={4} text="十余万人" x={50} y={13} size={5} per={3} dark />
        <Strip k={6} text="金焰、孙瑜、费穆、蔡楚生等抬棺" x={4} y={76} size={2.7} bg={P.red} />
      </>
    )},
  {b: 244, bg: P.ivory, dots: 'bl', src: '图：1935 年《神女》重映报纸广告（维基共享资源，公有领域）', sfx: [[0, 'printLand'], [2, 'slide'], [4, 'slide']],
    C: () => (
      <>
        <Photo k={0} src={ev('ad1935.jpg')} aspect={A.ad1935} w={46} x={50} y={7} rot={2} pitch={0.28} />
        <Strip k={2} text="她死后，影院重映《神女》" x={4} y={12} size={2.8} bg={P.ink} />
        <Strip k={3} text="广告上印着《阮玲玉哀荣生死录》" x={4} y={18.5} size={2.4} bg={P.red} rot={1} />
        <Strip k={6} text="1966 · 墓地被毁" x={5} y={74} size={3} bg={P.slate} />
      </>
    )},
  {b: 258, bg: P.red, dots: 'tr', src: '剧照：关锦鹏《阮玲玉》，1991；据第 42 届柏林影展、金马奖资料', sfx: [[0, 'slam'], [2, 'popIn'], [4, 'slide'], [5, 'printLand'], [7, 'slam'], [9, 'slide']],
    C: () => (
      <>
        <Film k={0} title="《阮玲玉》" note="1991 · 关锦鹏导演" x={6} y={9} size={5.6} />
        <Strip k={2} text="张曼玉饰演阮玲玉" x={6} y={22} size={3.2} bg={P.ink} />
        <Strip k={4} text="获柏林影展银熊奖最佳女演员" x={7} y={28.5} size={2.8} bg={P.ivory} fg={P.ink} rot={1} />
        <Photo k={5} src={staticFile('evidence/ruan-1991/maggie_ruan.jpg')} aspect={1} w={50} x={44} y={36} rot={2} halftone={false} />
        <Cut k={7} text="葬心" x={6} y={44} size={10} dark />
        <Strip k={9} text="电影主题曲 · 黄莺莺演唱" x={6} y={78} size={2.8} bg={P.ink} />
      </>
    )},
  {b: 276, bg: P.ink, dots: 'none', src: '影片：《神女》，联华，1934（公有领域）；部分片段来自 1905 电影网', sfx: [[0, 'printLand'], [7, 'printLand']],
    C: () => (
      <>
        <Strip k={0} text="回到《神女》：故事的结局" x={5} y={6.5} size={2.8} bg={P.ivory} fg={P.ink} />
        <Clip k={0.5} name="s_notice" aspect={4 / 3} w={84} x={4} y={12.5} rot={-1} />
        <Plot k={1.5} text="家长联名告状，校董会开除了孩子" y={45} />
        <Clip k={7} name="s_bottle" aspect={4 / 3} w={84} x={4} y={51} rot={1} />
        <Plot k={8.5} text="积蓄被老大偷光，她在争执中打死了他" y={83.5} rot={1} />
      </>
    )},
  {b: 295, bg: P.ink, dots: 'none', src: '影片：《神女》，联华，1934（公有领域）；部分片段来自 1905 电影网', sfx: [[0, 'printLand'], [6, 'printLand']],
    C: () => (
      <>
        <Clip k={0} name="s_court" aspect={4 / 3} w={84} x={4} y={9} rot={1} />
        <Plot k={1.5} text="她被判入狱十二年" y={41.5} />
        <Clip k={6} name="g_childcard" aspect={4 / 3} w={84} x={4} y={48} rot={-1} />
        <Plot k={7.5} text="她托校长抚养孩子：就说母亲已经死了" y={80.5} rot={1} />
      </>
    )},
  {b: 309, bg: P.ink, dots: 'none', src: '影片：《神女》结尾，联华，1934（公有领域）；部分片段来自 1905 电影网', sfx: [[0, 'printLand'], [5, 'printLand']],
    C: () => (
      <>
        <Clip k={0} name="s_turn" aspect={4 / 3} w={84} x={4} y={9} rot={-1} />
        <Clip k={5} name="s_son" aspect={4 / 3} w={84} x={4} y={48} rot={1} />
        <Plot k={7} text="狱中，她想象着孩子长大" y={80.5} rot={1} />
      </>
    )},
  {b: 330, bg: P.slate, dots: 'none', fade: 3, sfx: [[4, 'slam'], [9, 'payoff']],
    C: () => (
      <>
        <Photo k={0} src={cut('goddess')} aspect={A.goddess} w={70} x={15} y={6} enter="none" wobble={0} />
        <NameGlyph k={4} y={60} w={74} />
        <Strip k={6} text="1910 — 1935" x={30} y={71} size={4} bg={P.ivory} fg={P.ink} font={ROLE.num} />
        <Credit k={10} />
      </>
    )},
];

// ---------------------------------------------------------------- cover, glyphs, montage, credit

/** 「阮玲玉」 from the 《神女》 cast card (the film's own lettering), in ink */
const NameGlyph: React.FC<{k: number; y: number; w: number; color?: string}> = ({k, y, w, color = '#141413'}) => {
  const {st, W} = useB();
  const s = st(k);
  if (s < 0) return null;
  const width = (w / 100) * W;
  return (
    <div style={{position: 'absolute', left: (W - width) / 2, top: `${y}%`, width, height: width / 4.5394, transform: `scale(${SLAP[Math.min(s, 3)]})`, background: color, maskImage: `url(${ev('glyph_ruanlingyu.png')})`, WebkitMaskImage: `url(${ev('glyph_ruanlingyu.png')})`, maskSize: '100% 100%', WebkitMaskSize: '100% 100%'}} />
  );
};

const Cover: React.FC = () => {
  const {W, H} = useB();
  return (
    <AbsoluteFill>
      {/* 「神女」 from the film's title card, white, pushed back */}
      <Img src={ev('glyph_shennv.png')} style={{position: 'absolute', left: W * 0.06, top: H * 0.035, width: W * 0.88, height: (W * 0.88) / 2.7296, opacity: 0.6}} />
      <div style={{position: 'absolute', left: W * 0.2, top: H * 0.27, width: W * 0.74, height: W * 0.74, borderRadius: '50%', background: '#B2B1AE'}} />
      <PrintCutout src={cut('goddess')} aspect={A.goddess} widthPx={W * 0.66} x={22} y={25} rot={-1} step={4} enter="none" pitchPctH={0.26} paperColor="#F2EEE4" wobble={0} />
      {/* 「阮玲玉」 from the cast card */}
      <div style={{position: 'absolute', left: W * 0.08, top: H * 0.83, width: W * 0.84, height: (W * 0.84) / 4.5394, background: '#141413', maskImage: `url(${ev('glyph_ruanlingyu.png')})`, WebkitMaskImage: `url(${ev('glyph_ruanlingyu.png')})`, maskSize: '100% 100%', WebkitMaskSize: '100% 100%'}} />
    </AbsoluteFill>
  );
};

const MONTAGE: Array<{src: string; aspect: number; label: string; x: number; y: number; rot: number; w?: number}> = [
  {src: ev('portraitA.jpg'), aspect: A.portraitA, label: '1930 年代', x: 3, y: 2, rot: -3},
  {src: ev('liangyou1928.jpg'), aspect: A.liangyou1928, label: '1928', x: 36, y: 4, rot: 2},
  {src: ev('liangyou030.jpg'), aspect: A.liangyou030, label: '《良友》', x: 68, y: 1, rot: -2},
  {src: ev('gudu.jpg'), aspect: A.gudu, label: '故都春梦', x: 2, y: 23, rot: 2, w: 30},
  {src: ev('portrait5.jpg'), aspect: A.portrait5, label: '1930 年代', x: 35, y: 24, rot: -2},
  {src: ev('taohua.jpg'), aspect: A.taohua, label: '桃花泣血记', x: 66, y: 25, rot: 3, w: 32},
  {src: ev('xiaowanyi.jpg'), aspect: A.xiaowanyi, label: '小玩意', x: 2, y: 45, rot: -2, w: 32},
  {src: ev('shennv1.jpg'), aspect: A.shennv1, label: '神女', x: 35, y: 46, rot: 1, w: 32},
  {src: ev('portraitB.jpg'), aspect: A.portraitB, label: '1930 年代', x: 69, y: 43, rot: -3},
  {src: ev('xinnvxing1.jpg'), aspect: A.xinnvxing1, label: '新女性', x: 6, y: 66, rot: 2, w: 34},
  {src: ev('liangyou099.jpg'), aspect: A.liangyou099, label: '《良友》1934', x: 44, y: 63, rot: -2},
  {src: cut('portrait9'), aspect: A.portrait9, label: '', x: 72, y: 62, rot: 2},
];
const Montage: React.FC = () => {
  const {st} = useB();
  return (
    <>
      {MONTAGE.map((m, i) => (
        <React.Fragment key={i}>
          <Photo k={i} src={m.src} aspect={m.aspect} w={m.w ?? 26} x={m.x} y={m.y} rot={m.rot} pitch={0.28} />
          {m.label && st(i + 1) >= 0 ? <Strip k={i + 1} text={m.label} x={m.x + 1} y={m.y + 15.5} size={1.9} bg={P.ink} rot={0} font={ROLE.label} /> : null}
        </React.Fragment>
      ))}
    </>
  );
};

const Credit: React.FC<{k: number}> = ({k}) => {
  const {f, B, H, W} = useB();
  const o = Math.min(1, Math.max(0, (f - B(k)) / 14));
  if (o <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top: '90.5%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: W * 0.02, opacity: o}}>
      <span style={{fontFamily: ROLE.label, fontWeight: 700, fontSize: H * 0.021, color: 'rgba(239,233,221,.92)'}}>制作</span>
      <Img src={staticFile('brand/zeno-mark-dark.svg')} style={{width: H * 0.03, height: H * 0.03}} />
      <span style={{fontFamily: ROLE.num, fontWeight: 500, fontSize: H * 0.021, color: 'rgba(239,233,221,.92)', letterSpacing: '0.02em'}}>zeno.yczc</span>
    </div>
  );
};

// ---------------------------------------------------------------- year ruler (her 24 years)
const FILM_YEARS = [1927, 1930, 1931, 1933, 1934, 1935];
const Y0 = 1910;
const Y1 = 1935;
const YearRuler: React.FC<{frame: number}> = ({frame}) => {
  const {width: W, height: H} = useVideoConfig();
  let idx = 0;
  for (let i = 0; i < SHOTS.length; i++) if (frame >= F[SHOTS[i].b]) idx = i;
  const shot = SHOTS[idx];
  if (shot.year === undefined) return null;
  let prevYear = shot.year;
  for (let i = idx - 1; i >= 0; i--) if (SHOTS[i].year !== undefined) { prevYear = SHOTS[i].year!; break; }
  const t = Math.min(1, (frame - F[shot.b]) / 10);
  const year = prevYear + (shot.year - prevYear) * (t * t * (3 - 2 * t));
  const dark = DARK.has(shot.bg);
  const ink = dark ? 'rgba(239,233,221,.85)' : 'rgba(30,29,27,.8)';
  const x0 = W * 0.08;
  const x1 = W * 0.92;
  const X = (y: number) => x0 + ((y - Y0) / (Y1 - Y0)) * (x1 - x0);
  const yLine = H * 0.885;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <line x1={x0} x2={x1} y1={yLine} y2={yLine} stroke={ink} strokeWidth={H * 0.0018} />
      {[1910, 1915, 1920, 1925, 1930, 1935].map((y) => (
        <g key={y}>
          <line x1={X(y)} x2={X(y)} y1={yLine - H * 0.006} y2={yLine + H * 0.006} stroke={ink} strokeWidth={H * 0.0016} />
          <text x={X(y)} y={yLine + H * 0.022} textAnchor="middle" fontFamily={ROLE.num} fontWeight={600} fontSize={H * 0.0135} fill={ink}>{y}</text>
        </g>
      ))}
      {FILM_YEARS.filter((y) => y <= year + 0.01).map((y) => (
        <rect key={y} x={X(y) - H * 0.002} y={yLine - H * 0.016} width={H * 0.004} height={H * 0.012} fill={dark ? P.pink : P.red} />
      ))}
      <rect x={x0} y={yLine - H * 0.0018} width={X(year) - x0} height={H * 0.0036} fill={P.red} />
      <circle cx={X(year)} cy={yLine} r={H * 0.0075} fill={P.red} stroke={dark ? P.ivory : P.paper} strokeWidth={H * 0.002} />
      <text x={X(year)} y={yLine - H * 0.024} textAnchor="middle" fontFamily={ROLE.num} fontWeight={800} fontSize={H * 0.019} fill={ink}>{Math.round(year)}</text>
      {shot.age ? <text x={X(year)} y={yLine - H * 0.045} textAnchor="middle" fontFamily={ROLE.label} fontWeight={700} fontSize={H * 0.016} fill={dark ? P.pink : P.red}>{shot.age}</text> : null}
    </svg>
  );
};

// ---------------------------------------------------------------- composition

export const RUAN_DURATION = 6060; // 252.5 s: 《葬心》 from 0:40 to its end
const CUES = SHOTS.flatMap((s) => (s.sfx ?? []).map(([k, event]) => ({at: Math.round(beatAt(s.b + k * (s.pace ?? 1))), event, db: -26})));

const ShotView: React.FC<{def: ShotDef; dur: number}> = ({def, dur}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {C, cam} = def;
  const drift = Math.min(0.015, (0.05 * fps) / dur);
  const keys = cam ? [{at: 0, cx: cam.from[0], cy: cam.from[1], scale: cam.from[2]}, {at: 150, cx: cam.to[0], cy: cam.to[1], scale: cam.to[2]}] : undefined;
  const fadeLen = def.fade ? beatAt(def.b + def.fade) - F[def.b] : 0;
  const t = fadeLen ? Math.min(1, f / fadeLen) : 1;
  return (
    <ShotCtx.Provider value={{b0: def.b, pace: def.pace ?? 1}}>
      <AbsoluteFill style={{opacity: t * t * (3 - 2 * t)}}>
        <ColorField color={def.bg} dots={def.dots ?? 'br'} seed={def.b + 1} />
        <VoxCamera frame={f} fps={fps} drift={drift} keys={keys}>
          <C />
        </VoxCamera>
        {def.src ? <SourceLine frame={f} at={6} onDark={DARK.has(def.bg)} font={ROLE.label} text={def.src} /> : null}
      </AbsoluteFill>
    </ShotCtx.Provider>
  );
};

export const RuanLingyu: React.FC = () => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: P.ink}}>
      <CollageFilters scale={height / 1080} seed={11} />
      <Audio src={staticFile('audio/raw/ruan/zangxin_from40.wav')} />
      <SfxTrack cues={CUES} />
      {SHOTS.map((s, i) => {
        const from = i === 0 ? 0 : F[s.b];
        const next = SHOTS[i + 1];
        // a shot that dissolves in sits on top while the previous one keeps playing underneath
        const to = next ? Math.round(beatAt(next.b + (next.fade ?? 0))) : RUAN_DURATION;
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
