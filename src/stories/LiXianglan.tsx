// 李香兰 · 一生 (1080×1920, 24 fps, ≈3:16): vox-collage biography cut to her own 《夜来香》 (1944, 黎锦光 作曲), in the
// layout of the 阮玲玉 film: grey paper, black date strips with red tags, cut-out names, halftone prints with torn
// edges, a year ruler along the bottom, film strips for moving footage, a dark interlude, closing portrait + credit.
// Song structure (data/lixianglan-beats.json, aubiotrack ≈110 bpm): instrumental intro 0–28 s = title, photos and
// the five names; verses and choruses 28–120 s = 1920–1945; the instrumental interlude 120–150 s = arrest, trial,
// leaving China; the last choruses 150–189 s = life as 山口淑子 / 大鹰淑子; the outro = closing card. No lyrics on screen.
// Facts: OpenMontage projects/li-xianglan-vox/artifacts/FACTCHECK.md (中新网 2014 obituaries, 文春オンライン, AFP and
// Washington Post obituaries). Photos: Wikimedia Commons (public domain in Japan/China, credited on screen).
// Footage: 《サヨンの鐘》 1943 (Internet Archive, public domain mark). Song: the 1944 recording, supplied by the user;
// photos, footage and song are third-party material kept local only (.gitignore).
import React from 'react';
import {AbsoluteFill, Audio, Freeze, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
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
import beatData from './data/lixianglan-beats.json';
import assetData from './data/lixianglan-assets.json';

const F: number[] = beatData.beats; // frame of every beat
// 思源黑体 / 思源宋体 / 霞鹜文楷 / 志莽行书 (all OFL), subset to this film's characters
const LX_SANS = 'LX Sans';
loadLocalFont(LX_SANS, 'fonts/lx-sans-Regular.woff', '400');
loadLocalFont(LX_SANS, 'fonts/lx-sans-Bold.woff', '700');
loadLocalFont(LX_SANS, 'fonts/lx-sans-Heavy.woff', '900');
const LX_SERIF = loadLocalFont('LX Serif', 'fonts/lx-serif-black.woff', '900');
const LX_KAI = loadLocalFont('LX Kai', 'fonts/lx-kai.woff', '500');
const LX_BRUSH = loadLocalFont('LX Brush', 'fonts/lx-brush.woff', '400');

// ---- fonts by role (one font per element) ----
const ROLE = {
  chip: {font: LX_SANS, weight: 900}, // 剪贴大字: 黑体
  strip: LX_SANS, // 信息条: 黑体
  film: LX_SERIF, // 片名、书名: 宋体
  brush: LX_BRUSH, // 片头/片尾姓名: 行书
  num: VOX_FONT.sans, // 日期数字、英文名: Libre Franklin
  quote: LX_KAI, // 回忆录大意: 文楷
  label: LX_SANS,
};

// ---- palette (as the 阮玲玉 film): grey paper, stone, ink, crimson, slate blue ----
const P = {paper: '#DCD8D1', stone: '#A9A6A0', rice: '#F2EFE8', ink: '#1D1C1B', red: '#B0313B', slate: '#56636F', pale: '#CFC9BF'};
const DARK = new Set([P.ink, P.slate, P.red]);
const chips = (pairs: Array<[string, string]>): ChipStyle[] => pairs.map(([bg, fg]) => ({bg, fg, font: ROLE.chip.font, weight: ROLE.chip.weight}));
const POP = chips([[P.ink, P.rice], [P.rice, P.red], [P.red, P.rice]]);
const ON_DARK = chips([[P.rice, P.ink], [P.red, P.rice], [P.pale, P.ink]]);

const ASSETS = assetData as Record<string, {file: string; aspect: number}>;
const img = (n: string) => {
  const a = ASSETS[n];
  if (!a) throw new Error(`missing asset ${n}`);
  return {src: staticFile(a.file), aspect: a.aspect};
};
const clip = (n: string) => staticFile(`evidence/lixianglan/${n}.mp4`);

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
const DateStrip: React.FC<{k: number; text: string; x?: number; y?: number; size?: number}> = ({k, text, x = 7, y = 6.5, size = 5.4}) => (
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
  return <CutLetters text={text} step={st(k)} perChar={per} sizePctH={size} styles={dark ? ON_DARK : POP} x={x} y={y} seed={seed ?? text} />;
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

/** a film strip: black base, sprocket holes left and right, the footage greyscale, a 剧情 caption, torn ends */
const FilmStrip: React.FC<{k: number; src: string; len: number; rate?: number; x: number; y: number; w: number; rot?: number; caption?: string}> = ({k, src, len, rate = 1, x, y, w, rot = 0, caption}) => {
  const {f, B, W, H, st} = useB();
  const s = st(k);
  if (s < 0) return null;
  const at = B(k);
  const fw = (w / 100) * W;
  const fh = fw * 0.75 + fw * 0.0;
  const pad = fw * 0.075;
  const holes = 9;
  const local = f - at;
  const shown = Math.round(len / rate) - 1;
  const video = <OffthreadVideo src={src} muted playbackRate={rate} style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.12) brightness(1.02)'}} />;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: fw + pad * 2, height: fh + pad * 0.5, transform: `rotate(${rot}deg) scale(${SLAP[Math.min(s, 3)]})`, filter: `url(#stickerTorn) drop-shadow(0 ${H * 0.008}px ${H * 0.012}px rgba(0,0,0,.55))`}}>
      <div style={{position: 'absolute', inset: 0, background: '#0E0E0D'}} />
      {[0, 1].map((side) =>
        new Array(holes).fill(0).map((_, i) => (
          <div key={`${side}-${i}`} style={{position: 'absolute', left: side ? fw + pad * 1.3 : pad * 0.3, top: (i + 0.25) * ((fh + pad * 0.5) / holes), width: pad * 0.42, height: (fh / holes) * 0.42, background: '#E9E5DC', borderRadius: pad * 0.06}} />
        )),
      )}
      <div style={{position: 'absolute', left: pad, top: pad * 0.25, width: fw, height: fh, overflow: 'hidden', background: '#111'}}>
        <Sequence from={at} layout="none">
          {local < shown ? video : <Freeze frame={shown}>{video}</Freeze>}
        </Sequence>
      </div>
      {caption && s >= 3 ? (
        <div style={{position: 'absolute', left: pad * 0.8, bottom: pad * 0.55, padding: `${H * 0.003}px ${H * 0.008}px`, background: P.rice, fontFamily: ROLE.label, fontWeight: 700, fontSize: H * 0.019, color: P.ink, whiteSpace: 'nowrap'}}>
          {caption}
        </div>
      ) : null}
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
      <span style={{fontFamily: ROLE.label, fontWeight: 700, fontSize: H * 0.021, color: 'rgba(242,239,232,.92)'}}>制作</span>
      <Img src={staticFile('brand/zeno-mark-dark.svg')} style={{width: H * 0.03, height: H * 0.03}} />
      <span style={{fontFamily: ROLE.num, fontWeight: 500, fontSize: H * 0.021, color: 'rgba(242,239,232,.92)', letterSpacing: '0.02em'}}>zeno.yczc</span>
    </div>
  );
};

type ShotDef = {
  b: number; // first beat
  bg: string;
  dots?: 'tl' | 'tr' | 'bl' | 'br' | 'none';
  year?: number;
  age?: string;
  cam?: {from: [number, number, number]; to: [number, number, number]};
  src?: string;
  sfx?: Array<[number, SfxEvent]>;
  pace?: number;
  C: React.FC;
};

const SRC_PHOTO = '图：维基共享资源（公有领域）';
const SRC_BIO = '据中新网 2014 年讣闻报道等';

// ---------------------------------------------------------------- the shots

const SHOTS: ShotDef[] = [
  // ── title: the night-flower song's name in brush, her portrait, her name (full on frame 0 → thumbnail)
  {b: 0, bg: P.stone, dots: 'none', cam: {from: [50, 50, 1.0], to: [50, 48, 1.05]}, sfx: [[0, 'titleHit']],
    C: () => {
      const {W} = useB();
      return (
        <>
          <Brush k={0} text="夜来香" x={6} y={4} size={15} color="rgba(242,239,232,.55)" />
          <div style={{position: 'absolute', left: '50%', top: '42%', width: W * 0.78, height: W * 0.78, marginLeft: -W * 0.39, marginTop: -W * 0.39, borderRadius: '50%', background: 'rgba(242,239,232,.18)'}} />
          <Photo k={0} name="hero" w={74} x={13} y={20} enter="none" pitch={0.3} />
          <Brush k={0} text="李香兰" x={12} y={76} size={13} />
        </>
      );
    }},
  // ── her faces, one print per beat
  {b: 14, bg: P.paper, dots: 'br', src: SRC_PHOTO, sfx: [[0, 'printLand'], [2, 'printLand'], [4, 'printLand'], [6, 'printLand'], [8, 'printLand'], [10, 'printLand'], [12, 'printLand']],
    C: () => (
      <>
        <Photo k={0} name="p1940" w={30} x={5} y={4} rot={-4} />
        <Photo k={1} name="orchid01" w={46} x={42} y={6} rot={3} />
        <Photo k={2} name="taiwan1941" w={28} x={62} y={22} rot={5} />
        <Photo k={3} name="china_nights01" w={44} x={4} y={26} rot={2} />
        <Photo k={4} name="manei_cards" w={40} x={52} y={40} rot={-3} />
        <Photo k={5} name="singers" w={46} x={6} y={46} rot={-2} />
        <Photo k={6} name="yy1950" w={30} x={64} y={58} rot={4} />
        <Photo k={7} name="zhang_ailing" w={24} x={40} y={56} rot={-5} />
        <Photo k={8} name="domon1952" w={34} x={4} y={63} rot={3} />
        <Photo k={9} name="orchid02" w={36} x={34} y={70} rot={-2} />
        <Photo k={10} name="portrait_hand" w={22} x={74} y={74} rot={6} />
        <Print k={11} name="wanshi_poster" w={22} x={74} y={2} rot={-6} />
        <Print k={12} name="yingchunhua" w={20} x={2} y={82} rot={5} />
      </>
    )},
  // ── five names
  {b: 30, bg: P.paper, dots: 'tl', src: SRC_BIO, sfx: [[0, 'slam'], [1, 'popIn'], [3, 'slide'], [6, 'slide'], [9, 'slide'], [12, 'slide'], [15, 'slide']],
    C: () => (
      <>
        <Strip k={0} text="她一生用过" x={7} y={7} size={3.6} />
        <Cut k={1} text="五个名字" x={7} y={13} size={8.4} per={1} />
        {[
          ['山口淑子', '出生时的本名'],
          ['李香兰', '中国艺名'],
          ['潘淑华', '北平求学时'],
          ['Shirley Yamaguchi', '好莱坞'],
          ['大鹰淑子', '婚后'],
        ].map(([n, why], i) => (
          <React.Fragment key={n}>
            <Strip k={3 + i * 3} text={n} x={i % 2 ? 22 : 9} y={30 + i * 10.4} size={i === 3 ? 4 : 5} bg={i === 1 ? P.red : P.rice} fg={i === 1 ? P.rice : P.ink} rot={i % 2 ? 1.5 : -1.5} font={i === 3 ? ROLE.num : ROLE.strip} />
            <Tag k={3.5 + i * 3} text={why} x={i % 2 ? 24 : 11} y={36.6 + i * 10.4} size={2.1} bg={P.ink} rot={i % 2 ? -1 : 1} />
          </React.Fragment>
        ))}
      </>
    )},
  // ── verse 1: 1920 born in Manchuria, Japanese
  {b: 50, bg: P.paper, dots: 'br', year: 1920, age: '0 岁', src: SRC_BIO, sfx: [[0, 'slam'], [2, 'slide'], [4, 'popIn'], [8, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1920.2.12" />
        <Tag k={2} text="生于奉天北烟台（今辽宁灯塔）" x={8} y={16.5} size={2.8} />
        <Cut k={4} text="山口淑子" x={8} y={24} size={9.6} per={1} />
        <Strip k={8} text="日本人 · 父亲任职于“满铁”" x={9} y={40} size={3} bg={P.ink} rot={1} />
        <Bits k={6} seed="b1" items={[{kind: 'half', x: 76, y: 62, size: 6, rot: 8, color: P.slate}, {kind: 'star', x: 82, y: 9, size: 4, color: P.red}]} />
      </>
    )},
  // ── 1933 her Chinese name
  {b: 62, bg: P.stone, dots: 'tr', year: 1933, age: '13 岁', src: `${SRC_BIO} · ${SRC_PHOTO}`, sfx: [[0, 'slam'], [2, 'slide'], [4, 'popIn'], [7, 'printLand']],
    C: () => (
      <>
        <DateStrip k={0} text="1933 · 13 岁" />
        <Tag k={2} text="父亲的结拜兄弟李际春收她为义女" x={8} y={16} size={2.6} />
        <Cut k={4} text="李香兰" x={8} y={23} size={11} per={1} />
        <Photo k={7} name="p1940" w={44} x={50} y={36} rot={3} />
        <Strip k={9} text="中文名由此而来" x={9} y={46} size={3} bg={P.ink} rot={-1} />
      </>
    )},
  // ── 1934–37 Beijing school
  {b: 74, bg: P.paper, dots: 'bl', year: 1934, age: '14 岁', src: SRC_BIO, sfx: [[0, 'slam'], [2, 'slide'], [3, 'popIn'], [6, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1934 — 1937" />
        <Tag k={2} text="又认天津市长潘毓桂为义父" x={8} y={16} size={2.6} />
        <Cut k={3} text="潘淑华" x={8} y={23} size={10} per={1} />
        <Strip k={6} text="以此名就读北平翊教女中" x={9} y={38} size={3.2} bg={P.ink} rot={1} />
        <Bits k={5} seed="b3" items={[{kind: 'zigzag', x: 74, y: 52, size: 6, rot: -10, color: P.red}, {kind: 'dot', x: 82, y: 22, size: 3, color: P.slate}]} />
      </>
    )},
  // ── 1938 Manchukuo Film Association debut
  {b: 82, bg: P.paper, dots: 'br', year: 1938, age: '18 岁', src: `${SRC_BIO} · ${SRC_PHOTO}`, sfx: [[0, 'slam'], [2, 'slide'], [3, 'printLand'], [6, 'slide'], [9, 'slam']],
    C: () => (
      <>
        <DateStrip k={0} text="1938 · 18 岁" />
        <Tag k={2} text="进入“满映”（满洲映画协会）" x={8} y={16} size={2.6} />
        <Photo k={3} name="manei_cards" w={84} x={8} y={24} rot={-2} />
        <Film k={6} title="《蜜月快车》" note="银幕处女作" x={9} y={60} size={4.2} />
        <Strip k={9} text="宣传身份：“中国少女影星”" x={9} y={73} size={3.2} bg={P.red} rot={1.5} />
      </>
    )},
  // ── 1939–40 the 'continent' films with 长谷川一夫
  {b: 94, bg: P.stone, dots: 'tl', year: 1940, age: '20 岁', src: `${SRC_PHOTO} · 《白兰之歌》1939、《支那之夜》1940 剧照与广告`, sfx: [[0, 'slam'], [2, 'printLand'], [4, 'printLand'], [6, 'printLand'], [9, 'slide'], [12, 'slam']],
    C: () => (
      <>
        <DateStrip k={0} text="1939 — 1940" />
        <Photo k={2} name="orchid01" w={62} x={4} y={15} rot={-2} />
        <Film k={3} title="《白兰之歌》" x={62} y={18} size={3.4} rot={2} />
        <Photo k={4} name="china_nights01" w={60} x={36} y={36} rot={3} />
        <Film k={5} title="《支那之夜》" x={6} y={44} size={3.4} rot={-2} />
        <Print k={6} name="shina_ad" w={62} x={6} y={58} rot={-2} />
        <Strip k={9} text="与长谷川一夫合演“大陆三部曲”" x={6} y={75} size={2.9} bg={P.ink} rot={1} />
        <Strip k={12} text="片中，她演爱上日本男人的中国姑娘" x={8} y={80.5} size={2.6} bg={P.red} rot={-1} />
      </>
    )},
  // ── 1941 Tokyo, the crowd at the Nichigeki
  {b: 110, bg: P.paper, dots: 'br', year: 1941, age: '21 岁', src: '图：1941 年东京日本剧场外（公有领域）· 据文春オンライン', sfx: [[0, 'slam'], [2, 'printLand'], [5, 'popIn'], [9, 'slide'], [12, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1941.2.11" />
        <Photo k={2} name="nichigeki1941" w={58} x={38} y={14} rot={2} pitch={0.3} />
        <Tag k={1} text="东京 · 日本剧场" x={8} y={16} size={2.6} />
        <Cut k={5} text="七圈半" x={6} y={24} size={10} per={1} />
        <Strip k={9} text="据称约十万人围住剧场" x={6} y={63} size={3.4} bg={P.ink} rot={-1} />
        <Strip k={12} text="“七圈半”是后来流传的说法" x={8} y={69.5} size={2.5} bg={P.rice} fg={P.ink} rot={1} />
      </>
    )},
  // ── 1943 《万世流芳》, 《卖糖歌》
  {b: 126, bg: P.red, dots: 'tr', year: 1943, age: '23 岁', src: `${SRC_PHOTO} · ${SRC_BIO}`, sfx: [[0, 'slam'], [2, 'printLand'], [5, 'slide'], [8, 'slam']],
    C: () => (
      <>
        <DateStrip k={0} text="1943" />
        <Print k={2} name="wanshi_poster" w={50} x={46} y={8} rot={3} />
        <Film k={4} title="《万世流芳》" x={6} y={18} size={4.4} rot={-2} />
        <Strip k={6} text="主唱《卖糖歌》" x={8} y={30} size={3.6} bg={P.rice} fg={P.ink} rot={1} />
        <Cut k={8} text="红遍中国" x={6} y={58} size={7} per={1} dark />
      </>
    )},
  // ── 1943 《莎韵之钟》: moving pictures, in film strips
  {b: 138, bg: P.ink, dots: 'none', year: 1943, age: '23 岁', src: '影片：《莎韵之钟》（サヨンの鐘），松竹 / 台湾总督府 / 满映，1943（Internet Archive，公有领域）', sfx: [[0, 'slam'], [1, 'printLand'], [9, 'printLand'], [15, 'slide']],
    C: () => (
      <>
        <Film k={0} title="《莎韵之钟》" note="1943 · 主演莎韵" x={6} y={5} size={4} />
        <FilmStrip k={1} src={clip('sayon_smile')} len={100} rate={0.8} x={2} y={17} w={82} rot={-1.5} caption="剧情｜台湾山村少女莎韵" />
        <FilmStrip k={9} src={clip('sayon_glow')} len={76} rate={0.8} x={10} y={47} w={82} rot={1.5} caption="剧情｜她在山间唱歌" />
        <Strip k={15} text="台湾总督府等出资的“国策电影”" x={6} y={78} size={2.8} bg={P.red} rot={-1} />
      </>
    )},
  // ── 1944 《夜来香》 — the song we are hearing
  {b: 158, bg: P.paper, dots: 'tl', year: 1944, age: '24 岁', src: '据中新网 2014 年报道 · 《李香兰：我的半生》', sfx: [[0, 'slam'], [2, 'popIn'], [6, 'slide'], [9, 'slide'], [13, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1944 · 上海" />
        <Cut k={2} text="夜来香" x={8} y={16} size={12} per={1} />
        <Strip k={6} text="黎锦光作曲 · 百代唱片为她录制" x={8} y={34} size={3} bg={P.ink} rot={1} />
        <Strip k={9} text="就是你正在听的这首" x={10} y={40.5} size={3.4} bg={P.red} rot={-1.5} />
        <Note k={13} text={'回忆录里，她说听众最爱的三首：\n《何日君再来》《苏州夜曲》《夜来香》'} by="—— 大意，据《李香兰：我的半生》" x={6} y={52} w={88} size={3} />
      </>
    )},
  // ── 1945 Shanghai: first solo concert; with 张爱玲
  {b: 178, bg: P.stone, dots: 'br', year: 1945, age: '25 岁', src: `${SRC_PHOTO} · ${SRC_BIO}`, sfx: [[0, 'slam'], [2, 'slide'], [4, 'printLand'], [8, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1945 · 上海" />
        <Strip k={2} text="大光明戏院，首次个人演唱会" x={8} y={16} size={3.2} bg={P.red} rot={-1} />
        <Photo k={4} name="zhang_ailing" w={52} x={40} y={24} rot={3} />
        <Tag k={8} text="同年，与张爱玲合影" x={8} y={58} size={2.8} bg={P.ink} />
        <Mark k={9} kind="arrow" box={{x: 30, y: 62, w: 18, h: 6}} />
      </>
    )},
  // ── the films' purpose
  {b: 194, bg: P.paper, dots: 'tr', year: 1945, age: '25 岁', src: `${SRC_PHOTO} · 《迎春花》1942 海报`, sfx: [[0, 'printLand'], [3, 'slam'], [7, 'slide']],
    C: () => (
      <>
        <Print k={0} name="yingchunhua" w={48} x={48} y={8} rot={3} />
        <Photo k={1} name="orchid02" w={52} x={4} y={30} rot={-3} />
        <Cut k={3} text="国策电影" x={6} y={8} size={7.4} per={1} />
        <Strip k={7} text="她的银幕形象，为日本的侵华宣传服务" x={5} y={66} size={2.9} bg={P.ink} rot={-1} />
      </>
    )},
  // ── interlude: 1945 surrender and arrest
  {b: 206, bg: P.ink, dots: 'none', year: 1945, age: '25 岁', src: SRC_BIO, sfx: [[0, 'titleHit'], [3, 'slam']],
    C: () => (
      <>
        <DateStrip k={0} text="1945.8.15" />
        <Strip k={2} text="日本宣布投降" x={8} y={16} size={3.6} bg={P.red} rot={-1} />
        <Cut k={5} text="战败" x={8} y={30} size={14} per={1} dark />
      </>
    )},
  {b: 217, bg: P.ink, dots: 'none', year: 1945, age: '25 岁', src: SRC_BIO, sfx: [[0, 'slam'], [3, 'slam'], [8, 'slide'], [12, 'slide']],
    C: () => (
      <>
        <Strip k={0} text="她以“文化汉奸”罪名被捕" x={7} y={8} size={3.8} bg={P.rice} fg={P.ink} rot={-1.5} />
        <Cut k={3} text="汉奸" x={10} y={22} size={18} per={2} dark />
        <Mark k={6} kind="underline" box={{x: 10, y: 22, w: 46, h: 13}} />
        <Strip k={8} text="被关进上海的集中营" x={8} y={46} size={3.2} bg={P.slate} rot={1} />
        <Strip k={12} text="检方主张判处死刑" x={8} y={54} size={4} bg={P.red} rot={-1} />
      </>
    )},
  {b: 238, bg: P.slate, dots: 'none', year: 1946, age: '26 岁', src: SRC_BIO, sfx: [[0, 'slam'], [2, 'popIn'], [7, 'slide'], [11, 'stamp']],
    C: () => (
      <>
        <Strip k={0} text="她拿出证据：自己是日本人" x={7} y={8} size={3.4} bg={P.rice} fg={P.ink} rot={-1.5} />
        <Cut k={2} text="山口淑子" x={8} y={18} size={10} per={1} dark />
        <DateStrip k={7} text="1946.2" x={8} y={36} size={4.6} />
        <Strip k={9} text="法庭确认国籍，宣告无罪" x={8} y={44} size={3.6} bg={P.red} rot={1} />
        <Note k={12} text={'法官：以中国人的艺名\n拍这些电影，令人遗憾。'} by="—— 大意，据中新网报道" x={8} y={56} w={80} size={3.4} />
      </>
    )},
  {b: 254, bg: P.ink, dots: 'none', year: 1946, age: '26 岁', src: SRC_BIO, sfx: [[0, 'slam'], [4, 'scribble'], [8, 'slide']],
    C: () => (
      <>
        <Strip k={0} text="1946 年春，遣返日本" x={7} y={8} size={3.6} bg={P.rice} fg={P.ink} rot={-1.5} />
        <Cut k={2} text="李香兰" x={10} y={22} size={14} per={1} dark />
        <Mark k={4} kind="strike" box={{x: 10, y: 22, w: 64, h: 12}} />
        <Strip k={8} text="这个名字，从此留在了中国" x={10} y={46} size={3.4} bg={P.red} rot={1} />
      </>
    )},
  // ── last choruses: Japan, Hollywood, marriage, the Diet
  {b: 270, bg: P.paper, dots: 'br', year: 1947, age: '27 岁', src: `${SRC_PHOTO} · ${SRC_BIO}`, sfx: [[0, 'slam'], [2, 'printLand'], [5, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1947" />
        <Photo k={2} name="yy1950" w={56} x={40} y={14} rot={3} />
        <Strip k={4} text="改回本名" x={8} y={18} size={3.4} bg={P.red} rot={-1} />
        <Cut k={5} text="山口淑子" x={6} y={26} size={8} per={1} />
        <Strip k={9} text="在日本重新拍片" x={8} y={58} size={3.2} bg={P.ink} rot={1} />
      </>
    )},
  {b: 282, bg: P.stone, dots: 'tl', year: 1951, age: '31 岁', src: `${SRC_PHOTO} · 据 AFP、《华盛顿邮报》讣闻`, sfx: [[0, 'slam'], [2, 'printLand'], [5, 'slide'], [9, 'slide'], [12, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1950 年代" />
        <Photo k={2} name="domon1952" w={50} x={46} y={12} rot={3} />
        <Strip k={4} text="Shirley Yamaguchi" x={6} y={18} size={3.8} bg={P.rice} fg={P.ink} rot={-1.5} font={ROLE.num} />
        <Tag k={5} text="闯荡好莱坞与百老汇" x={8} y={25} size={2.6} />
        <Film k={8} title="《竹屋》" note="1955 · 好莱坞" x={8} y={34} size={3.6} />
        <Strip k={12} text="1951 年嫁雕塑家野口勇，1956 年离婚" x={6} y={64} size={2.6} bg={P.ink} rot={-1} />
      </>
    )},
  {b: 298, bg: P.paper, dots: 'br', year: 1958, age: '38 岁', src: `${SRC_PHOTO} · ${SRC_BIO}`, sfx: [[0, 'slam'], [2, 'slide'], [4, 'popIn'], [8, 'printLand']],
    C: () => (
      <>
        <DateStrip k={0} text="1958" />
        <Strip k={2} text="嫁给外交官大鹰弘，息影" x={8} y={16} size={3.2} bg={P.red} rot={-1} />
        <Cut k={4} text="大鹰淑子" x={6} y={24} size={9} per={1} />
        <Photo k={8} name="portrait_hand" w={40} x={52} y={40} rot={3} />
      </>
    )},
  {b: 310, bg: P.stone, dots: 'tr', year: 1974, age: '54 岁', src: SRC_BIO, sfx: [[0, 'slam'], [2, 'slide'], [4, 'slam'], [8, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1974" />
        <Strip k={2} text="当选日本参议院议员" x={8} y={16} size={3.6} bg={P.ink} rot={-1} />
        <Cut k={4} text="18 年" x={8} y={26} size={14} per={1} />
        <Strip k={8} text="连任三届，至 1992 年" x={10} y={47} size={3.2} bg={P.red} rot={1} />
      </>
    )},
  {b: 322, bg: P.ink, dots: 'none', year: 2014, age: '94 岁', src: `${SRC_BIO} · 影片：《莎韵之钟》，1943（公有领域）`, sfx: [[0, 'slam'], [1, 'printLand']],
    C: () => (
      <>
        <DateStrip k={0} text="2014.9.7 · 东京" />
        <FilmStrip k={1} src={clip('sayon_close')} len={240} x={6} y={18} w={80} rot={-1} />
        <Strip k={5} text="去世，享年 94 岁" x={8} y={52} size={3.8} bg={P.red} rot={1} />
      </>
    )},
  // ── closing card: portrait, name, years, credit
  {b: 334, bg: P.slate, dots: 'none', cam: {from: [50, 50, 1.0], to: [50, 49, 1.04]}, sfx: [[0, 'printLand'], [3, 'seal']],
    C: () => (
      <>
        <Photo k={0} name="hero" w={74} x={13} y={8} enter="drop" pitch={0.3} />
        <Brush k={2} text="李香兰" x={12} y={64} size={13} color={P.ink} />
        <Strip k={3} text="1920 — 2014" x={30} y={78} size={4.2} bg={P.rice} fg={P.ink} rot={-1} font={ROLE.num} />
        <Credit k={6} />
      </>
    )},
];

// ---------------------------------------------------------------- year ruler

const EVENT_YEARS = [1933, 1938, 1940, 1941, 1943, 1944, 1945, 1946, 1947, 1951, 1958, 1974, 2014];
const Y0 = 1920;
const Y1 = 2014;
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
  const ink = dark ? 'rgba(242,239,232,.85)' : 'rgba(29,28,27,.8)';
  const x0 = W * 0.08;
  const x1 = W * 0.92;
  const X = (y: number) => x0 + ((y - Y0) / (Y1 - Y0)) * (x1 - x0);
  const yLine = H * 0.885;
  return (
    <svg width={W} height={H} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <line x1={x0} x2={x1} y1={yLine} y2={yLine} stroke={ink} strokeWidth={H * 0.0018} />
      {[1920, 1940, 1960, 1980, 2000, 2014].map((y) => (
        <g key={y}>
          <line x1={X(y)} x2={X(y)} y1={yLine - H * 0.006} y2={yLine + H * 0.006} stroke={ink} strokeWidth={H * 0.0016} />
          {y !== 2000 ? <text x={X(y)} y={yLine + H * 0.022} textAnchor="middle" fontFamily={ROLE.num} fontWeight={600} fontSize={H * 0.0135} fill={ink}>{y}</text> : null}
        </g>
      ))}
      {EVENT_YEARS.filter((y) => y <= year + 0.01).map((y) => (
        <rect key={y} x={X(y) - H * 0.002} y={yLine - H * 0.016} width={H * 0.004} height={H * 0.012} fill={dark ? '#E58A92' : P.red} />
      ))}
      <rect x={x0} y={yLine - H * 0.0018} width={X(year) - x0} height={H * 0.0036} fill={P.red} />
      <circle cx={X(year)} cy={yLine} r={H * 0.0075} fill={P.red} stroke={dark ? P.rice : P.paper} strokeWidth={H * 0.002} />
      <text x={X(year)} y={yLine - H * 0.024} textAnchor="middle" fontFamily={ROLE.num} fontWeight={800} fontSize={H * 0.019} fill={ink}>{Math.round(year)}</text>
      {shot.age ? (
        <text x={X(year)} y={yLine - H * 0.045} textAnchor="middle" fontFamily={ROLE.label} fontWeight={700} fontSize={H * 0.016} fill={dark ? '#E58A92' : P.red}>{shot.age}</text>
      ) : null}
    </svg>
  );
};

// ---------------------------------------------------------------- composition

const SONG_END = 4672; // 194.67 s
export const LIXIANGLAN_DURATION = SONG_END + 36; // hold the closing card 1.5 s after the last note
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
        <ColorField color={def.bg} dots={def.dots ?? 'br'} seed={def.b + 1} />
        <VoxCamera frame={f} fps={fps} drift={cam ? 0 : drift} keys={keys}>
          <C />
        </VoxCamera>
        {def.src ? <SourceLine frame={f} at={6} onDark={DARK.has(def.bg)} font={ROLE.label} text={def.src} /> : null}
      </AbsoluteFill>
    </ShotCtx.Provider>
  );
};

export const LiXianglan: React.FC = () => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: P.ink}}>
      <CollageFilters scale={height / 1080} seed={9} />
      <Audio src={staticFile('audio/raw/lixianglan/yelaixiang.wav')} volume={(fr) => interpolate(fr, [0, 2, SONG_END - 24, SONG_END], [0, 1, 1, 0.9], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />
      <SfxTrack cues={CUES} />
      {SHOTS.map((s, i) => {
        const from = i === 0 ? 0 : F[s.b];
        const to = i + 1 < SHOTS.length ? F[SHOTS[i + 1].b] : LIXIANGLAN_DURATION;
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
