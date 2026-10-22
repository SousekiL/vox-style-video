// 李香兰 · 五个名字 (1080×1920, 24 fps, ≈3:16): vox-collage biography cut to her own 《夜来香》 (1944, 黎锦光 作曲).
// Told through her five names: after the title, five identity cards (山口淑子 · 李香兰 · 潘淑华 · Shirley Yamaguchi ·
// 大鹰淑子); every later shot belongs to one name, and a name bar along the bottom fills in as she takes each name,
// marks the one in use and strikes 李香兰 when she is sent back to Japan in 1946. Night palette for the night flower.
// Song structure (data/lixianglan-beats.json, aubiotrack ≈110 bpm): instrumental intro 0–28 s = title + the five
// cards; verses and choruses 28–120 s = 1920–1945; the instrumental interlude 120–150 s = arrest, trial, leaving China;
// the last choruses 150–189 s = 山口淑子 again, Shirley Yamaguchi, 大鹰淑子, her visits to China and work between the two
// countries; the outro = closing card. No lyrics on screen.
// Facts: OpenMontage projects/li-xianglan-vox/artifacts/FACTCHECK.md (中新网 2014 obituaries, 文春オンライン, AFP and
// Washington Post obituaries). Photos: Wikimedia Commons (public domain, credited on screen). Footage, used sparingly
// (two strips): 《サヨンの鐘》 1943 (Internet Archive, public domain mark). Song: the 1944 recording, supplied by the user.
// Photos, footage and song are third-party material kept local only (.gitignore).
import React from 'react';
import {AbsoluteFill, Audio, Freeze, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  Annotate,
  DarkReliefMap,
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

// ---- palette: night for the night flower — midnight blue, cream paper, vermilion, ink, a cool mist grey ----
const P = {paper: '#EDE5D3', mist: '#BCB8B0', rice: '#F6F1E6', ink: '#1B1B1A', red: '#C23B2E', night: '#1E2638', pale: '#D9CFBC'};
const DARK = new Set([P.ink, P.night, P.red]);
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
      <span style={{fontFamily: ROLE.label, fontWeight: 700, fontSize: H * 0.021, color: 'rgba(246,241,230,.92)'}}>制作</span>
      <Img src={staticFile('brand/zeno-mark-dark.svg')} style={{width: H * 0.03, height: H * 0.03}} />
      <span style={{fontFamily: ROLE.num, fontWeight: 500, fontSize: H * 0.021, color: 'rgba(246,241,230,.92)', letterSpacing: '0.02em'}}>zeno.yczc</span>
    </div>
  );
};

// ---------------------------------------------------------------- her five names

const NAMES = [
  {name: '山口淑子', short: '山口淑子', year: 1920, note: '出生时的本名', photo: 'yy1950'},
  {name: '李香兰', short: '李香兰', year: 1933, note: '义父李际春所取的中文名', photo: 'p1940'},
  {name: '潘淑华', short: '潘淑华', year: 1934, note: '北平求学时用的名字', photo: 'youth1933'},
  {name: 'Shirley Yamaguchi', short: 'Shirley', year: 1950, note: '在好莱坞', photo: 'domon1952'},
  {name: '大鹰淑子', short: '大鹰淑子', year: 1958, note: '婚后的名字', photo: 'otaka_late'},
] as const;
const CIRCLED = ['①', '②', '③', '④', '⑤'];

/** an identity card for one name: photo slot, number, name, when and why */
const IdCard: React.FC<{k: number; i: number; x: number; y: number; w: number; h: number; rot?: number}> = ({k, i, x, y, w, h, rot = 0}) => {
  const {st, W, H} = useB();
  const s = st(k);
  if (s < 0) return null;
  const n = NAMES[i];
  const cw = (w / 100) * W;
  const ch = (h / 100) * H;
  const ph = ch * 0.78;
  const pw = ph * 0.78;
  const latin = i === 3;
  const a = n.photo ? img(n.photo) : null;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: cw, height: ch, transform: `rotate(${rot}deg) scale(${SLAP[Math.min(s, 3)]})`, filter: `url(#stickerTorn) drop-shadow(0 ${H * 0.007}px ${H * 0.009}px rgba(0,0,0,.45))`}}>
      <div style={{position: 'absolute', inset: 0, background: P.rice}} />
      <div style={{position: 'absolute', left: ch * 0.11, top: ch * 0.11, width: pw, height: ph, background: P.mist, overflow: 'hidden'}}>
        {a ? (
          <Img src={a.src} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 18%', filter: 'grayscale(1) contrast(1.2)'}} />
        ) : (
          <div style={{position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontFamily: ROLE.label, fontWeight: 700, fontSize: H * 0.016, color: 'rgba(27,27,26,.55)'}}>无存照</div>
        )}
      </div>
      <div style={{position: 'absolute', left: ch * 0.22 + pw, top: ch * 0.1, right: ch * 0.12}}>
        <div style={{fontFamily: ROLE.label, fontWeight: 700, fontSize: H * 0.019, color: P.red, letterSpacing: '0.06em'}}>名字 {CIRCLED[i]} · {n.year} 年起</div>
        <div style={{fontFamily: latin ? ROLE.num : ROLE.strip, fontWeight: latin ? 800 : 900, fontSize: H * (latin ? 0.036 : 0.046), lineHeight: 1.18, color: P.ink, whiteSpace: 'nowrap'}}>{n.name}</div>
        <div style={{fontFamily: ROLE.label, fontWeight: 400, fontSize: H * 0.019, color: 'rgba(27,27,26,.78)'}}>{n.note}</div>
      </div>
    </div>
  );
};

/** 1975 / 1978: the cities she went back to, on a land-only map (dots are schematic, no borders) */
const CITIES = [
  {name: '北京', lon: 116.4, lat: 39.9, side: 'l'},
  {name: '上海', lon: 121.5, lat: 31.2, side: 'r'},
  {name: '哈尔滨', lon: 126.6, lat: 45.8, side: 'r'},
  {name: '长春', lon: 125.3, lat: 43.9, side: 'l'},
] as const;
const Revisit: React.FC = () => {
  const {f, fps, st, H} = useB();
  return (
    <>
      <DarkReliefMap frame={f} fps={fps} box={[[97, 22], [146, 54]]} rivers drift={0.004} keys={[{at: 0, lon: 121.5, lat: 38.2, scale: 1.0}, {at: 90, lon: 121.5, lat: 38.2, scale: 1.05}]}>
        {(screen) =>
          CITIES.map((c, i) => {
            const s = st(7 + i);
            if (s < 0) return null;
            const [x, y] = screen(c.lon, c.lat);
            const dot = H * 0.007;
            return (
              <React.Fragment key={c.name}>
                <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: dot * 2, height: dot * 2, marginLeft: -dot, marginTop: -dot, borderRadius: '50%', background: P.red, boxShadow: `0 0 0 ${dot * 0.5}px ${P.rice}`}} />
                <div style={{position: 'absolute', left: `${x + (c.side === 'r' ? 1.8 : -1.8)}%`, top: `${y - 1.4}%`, transform: `translateX(${c.side === 'r' ? 0 : -100}%) scale(${SLAP[Math.min(s, 3)]})`, transformOrigin: c.side === 'r' ? '0 50%' : '100% 50%', padding: `${H * 0.003}px ${H * 0.008}px`, background: P.rice, fontFamily: ROLE.label, fontWeight: 900, fontSize: H * 0.024, color: P.ink, whiteSpace: 'nowrap'}}>
                  {c.name}
                </div>
              </React.Fragment>
            );
          })
        }
      </DarkReliefMap>
      <DateStrip k={0} text="1975 · 1978" />
      <Strip k={1} text="1975 年途经北京，廖承志设宴款待" x={7} y={16} size={2.9} bg={P.rice} fg={P.ink} rot={-1} />
      <Strip k={4} text="1978 年率日本环境访华团" x={7} y={22} size={2.8} bg={P.red} rot={1} />
      <Cut k={6} text="重访中国" x={7} y={73} size={6.4} per={1} dark />
    </>
  );
};

type ShotDef = {
  b: number; // first beat
  bg: string;
  dots?: 'tl' | 'tr' | 'bl' | 'br' | 'none';
  year?: number; // names taken by this year show in the name bar (hidden when undefined)
  name?: number; // the name in use
  struck?: boolean; // 李香兰 struck out (from 1946)
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
  // ── title on the night stage: the song's name in brush, her portrait, her name (full on frame 0 → thumbnail)
  {b: 0, bg: P.night, dots: 'none', cam: {from: [50, 50, 1.0], to: [50, 48, 1.05]}, sfx: [[0, 'titleHit'], [6, 'slide']],
    C: () => (
      <>
        <Brush k={0} text="夜来香" x={7} y={4} size={15} color="rgba(246,241,230,.3)" />
        <Photo k={0} name="hero" w={74} x={13} y={18} enter="none" pitch={0.3} />
        <Brush k={0} text="李香兰" x={12} y={73} size={13} color={P.rice} />
        <Tag k={6} text="《夜来香》原唱" x={58} y={70} size={2.6} rot={3} />
      </>
    )},
  // ── the five names, one identity card every 6 beats
  {b: 14, bg: P.paper, dots: 'br', src: `${SRC_BIO} · ${SRC_PHOTO} · 卡⑤照片：中时新闻网`, sfx: [[0, 'slam'], [2, 'printLand'], [8, 'printLand'], [14, 'printLand'], [20, 'printLand'], [26, 'printLand']],
    C: () => (
      <>
        <Strip k={0} text="唱这首歌的人，一生用过五个名字" x={5} y={3.4} size={2.8} rot={-1} />
        {NAMES.map((_, i) => (
          <IdCard key={i} k={2 + i * 6} i={i} x={i % 2 ? 9 : 5} y={10 + i * 15} w={86} h={13.4} rot={i % 2 ? 1.2 : -1.2} />
        ))}
      </>
    )},
  // ── ① 山口淑子: 1920
  {b: 50, bg: P.paper, dots: 'tr', year: 1920, name: 0, src: SRC_BIO, sfx: [[0, 'slam'], [2, 'slide'], [4, 'popIn'], [8, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1920.2.12" />
        <Tag k={2} text="生于奉天北烟台（今辽宁灯塔）" x={8} y={16.5} size={2.8} />
        <Cut k={4} text="山口淑子" x={8} y={24} size={9.6} per={1} />
        <Strip k={8} text="日本人 · 父亲任职于“满铁”" x={9} y={40} size={3} rot={1} />
        <Bits k={6} seed="b1" items={[{kind: 'half', x: 76, y: 62, size: 6, rot: 8, color: P.night}, {kind: 'star', x: 82, y: 9, size: 4, color: P.red}]} />
      </>
    )},
  // ── ② 李香兰: 1933
  {b: 62, bg: P.mist, dots: 'tl', year: 1933, name: 1, src: `${SRC_BIO} · 图：约 1933—1934 年，维基共享资源（公有领域）`, sfx: [[0, 'slam'], [2, 'slide'], [4, 'popIn'], [7, 'printLand']],
    C: () => (
      <>
        <DateStrip k={0} text="1933 · 13 岁" />
        <Tag k={2} text="父亲的结拜兄弟李际春收她为义女" x={8} y={16} size={2.6} />
        <Cut k={4} text="李香兰" x={8} y={23} size={11} per={1} />
        <Photo k={7} name="youth1933" w={44} x={50} y={36} rot={3} />
        <Strip k={9} text="她的中文名由此而来" x={9} y={46} size={3} rot={-1} />
      </>
    )},
  // ── ③ 潘淑华: 1934–37
  {b: 74, bg: P.paper, dots: 'bl', year: 1934, name: 2, src: SRC_BIO, sfx: [[0, 'slam'], [2, 'slide'], [3, 'popIn'], [6, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1934 — 1937" />
        <Tag k={2} text="又认天津市长潘毓桂为义父" x={8} y={16} size={2.6} />
        <Cut k={3} text="潘淑华" x={8} y={23} size={10} per={1} />
        <Strip k={6} text="以此名就读北平翊教女中" x={9} y={38} size={3.2} rot={1} />
        <Bits k={5} seed="b3" items={[{kind: 'zigzag', x: 74, y: 52, size: 6, rot: -10, color: P.red}, {kind: 'dot', x: 82, y: 22, size: 3, color: P.night}]} />
      </>
    )},
  // ── 李香兰 the star: 1938 Manchukuo Film Association
  {b: 82, bg: P.night, dots: 'none', year: 1938, name: 1, src: `${SRC_BIO} · ${SRC_PHOTO}`, sfx: [[0, 'slam'], [2, 'slide'], [3, 'printLand'], [6, 'slide'], [9, 'slam']],
    C: () => (
      <>
        <DateStrip k={0} text="1938 · 18 岁" />
        <Tag k={2} text="进入“满映”（满洲映画协会）" x={8} y={16} size={2.6} />
        <Photo k={3} name="manei_cards" w={84} x={8} y={24} rot={-2} />
        <Film k={6} title="《蜜月快车》" note="银幕处女作" x={9} y={60} size={4.2} />
        <Strip k={9} text="对外宣传：“中国少女影星”" x={9} y={73} size={3.2} bg={P.red} rot={1.5} />
      </>
    )},
  // ── 1939–40 the 'continent' films with 长谷川一夫
  {b: 94, bg: P.paper, dots: 'tl', year: 1940, name: 1, src: `${SRC_PHOTO} · 《白兰之歌》1939 剧照、《支那之夜》1940 广告`, sfx: [[0, 'slam'], [2, 'printLand'], [5, 'printLand'], [9, 'slide'], [12, 'slam']],
    C: () => (
      <>
        <DateStrip k={0} text="1939 — 1940" />
        <Photo k={2} name="orchid01" w={70} x={4} y={15} rot={-2} />
        <Film k={3} title="《白兰之歌》" x={60} y={44} size={3.4} rot={2} />
        <Print k={5} name="shina_ad" w={66} x={28} y={52} rot={2} />
        <Strip k={9} text="与长谷川一夫合演“大陆三部曲”" x={5} y={72} size={2.9} rot={-1} />
        <Strip k={12} text="她演爱上日本男人的中国姑娘" x={6} y={78} size={2.5} bg={P.red} rot={1} />
      </>
    )},
  // ── 1941 Tokyo, the crowd at the Nichigeki
  {b: 110, bg: P.mist, dots: 'br', year: 1941, name: 1, src: '据文春オンライン · 图：她演出时剧场外的人群，维基共享资源标注为 1943 年（公有领域）', sfx: [[0, 'slam'], [1, 'slide'], [2, 'printLand'], [5, 'popIn'], [9, 'slide'], [12, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1941.2.11" />
        <Tag k={1} text="东京 · 日本剧场" x={7} y={16} size={2.4} />
        <Photo k={2} name="nichigeki1941" w={52} x={44} y={14} rot={2} pitch={0.3} />
        <Tag k={3} text="照片：她演出时的人群（1943）" x={46} y={54} size={2} bg={P.ink} rot={1} />
        <Cut k={5} text="七圈半" x={6} y={24} size={10} per={1} />
        <Strip k={9} text="据称约十万人围住剧场" x={6} y={63} size={3.4} rot={-1} />
        <Strip k={12} text="“七圈半”是后来流传的说法" x={8} y={69.5} size={2.5} bg={P.rice} fg={P.ink} rot={1} />
      </>
    )},
  // ── 1943 《万世流芳》, 《卖糖歌》
  {b: 126, bg: P.red, dots: 'tr', year: 1943, name: 1, src: `${SRC_PHOTO} · ${SRC_BIO}`, sfx: [[0, 'slam'], [2, 'printLand'], [4, 'slide'], [6, 'slide'], [8, 'slam']],
    C: () => (
      <>
        <DateStrip k={0} text="1943" />
        <Print k={2} name="wanshi_poster" w={50} x={46} y={8} rot={3} />
        <Film k={4} title="《万世流芳》" x={6} y={18} size={4.4} rot={-2} />
        <Strip k={6} text="主唱《卖糖歌》" x={8} y={30} size={3.6} bg={P.rice} fg={P.ink} rot={1} />
        <Cut k={8} text="红遍中国" x={6} y={58} size={7} per={1} dark />
      </>
    )},
  // ── 1943 《莎韵之钟》: one film strip of moving pictures
  {b: 138, bg: P.ink, dots: 'none', year: 1943, name: 1, src: '影片：《莎韵之钟》（サヨンの鐘），松竹 / 台湾总督府 / 满映，1943（Internet Archive，公有领域）', sfx: [[0, 'slam'], [2, 'printLand'], [12, 'slide']],
    C: () => (
      <>
        <Film k={0} title="《莎韵之钟》" note="1943 · 她演台湾山村少女莎韵" x={6} y={7} size={4} />
        <FilmStrip k={2} src={clip('sayon_smile')} len={100} rate={0.7} x={2} y={24} w={82} rot={-1.5} />
        <Strip k={12} text="台湾总督府等出资的“国策电影”" x={6} y={62} size={2.9} bg={P.red} rot={-1} />
      </>
    )},
  // ── 1944 《夜来香》 — the song we are hearing
  {b: 158, bg: P.night, dots: 'none', year: 1944, name: 1, src: '据中新网 2014 年报道 · 《李香兰：我的半生》', sfx: [[0, 'slam'], [2, 'popIn'], [6, 'slide'], [9, 'slide'], [13, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1944 · 上海" />
        <Brush k={2} text="夜来香" x={8} y={15} size={16} color={P.rice} />
        <Strip k={6} text="黎锦光作曲 · 百代唱片为她录制" x={8} y={34} size={3} bg={P.rice} fg={P.ink} rot={1} />
        <Strip k={9} text="就是你正在听的这首" x={10} y={40.5} size={3.4} bg={P.red} rot={-1.5} />
        <Note k={13} text={'回忆录里，她说听众最爱的三首：\n《何日君再来》\n《苏州夜曲》《夜来香》'} by="—— 大意，据《李香兰：我的半生》" x={6} y={52} w={88} size={3} />
      </>
    )},
  // ── 1945 Shanghai: first solo concert; with 张爱玲
  {b: 178, bg: P.paper, dots: 'br', year: 1945, name: 1, src: `${SRC_PHOTO} · ${SRC_BIO}`, sfx: [[0, 'slam'], [2, 'slide'], [4, 'printLand'], [8, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1945 · 上海" />
        <Strip k={2} text="大光明戏院，首次个人演唱会" x={8} y={16} size={3.2} bg={P.red} rot={-1} />
        <Photo k={4} name="zhang_ailing" w={52} x={40} y={24} rot={3} />
        <Tag k={8} text="同年，与张爱玲合影" x={8} y={58} size={2.8} bg={P.ink} />
        <Mark k={9} kind="arrow" box={{x: 30, y: 62, w: 18, h: 6}} />
      </>
    )},
  // ── what the films were for
  {b: 194, bg: P.mist, dots: 'tr', year: 1945, name: 1, src: `${SRC_PHOTO} · 《迎春花》1942 海报`, sfx: [[0, 'printLand'], [3, 'slam'], [7, 'slide']],
    C: () => (
      <>
        <Print k={0} name="yingchunhua" w={46} x={50} y={14} rot={3} />
        <Cut k={3} text="国策电影" x={6} y={8} size={7.4} per={1} />
        <Strip k={7} text="她的银幕形象，" x={6} y={48} size={3.2} rot={-1} />
        <Strip k={8} text="为日本的侵华宣传服务" x={8} y={54} size={3.2} bg={P.red} rot={1} />
      </>
    )},
  // ── interlude: surrender, arrest, trial, leaving
  {b: 206, bg: P.night, dots: 'none', year: 1945, name: 1, src: SRC_BIO, sfx: [[0, 'titleHit'], [3, 'slam']],
    C: () => (
      <>
        <DateStrip k={0} text="1945.8.15" />
        <Strip k={2} text="日本宣布投降" x={8} y={16} size={3.6} bg={P.red} rot={-1} />
        <Cut k={5} text="战败" x={8} y={30} size={14} per={1} dark />
      </>
    )},
  {b: 217, bg: P.ink, dots: 'none', year: 1945, name: 1, src: SRC_BIO, sfx: [[0, 'slam'], [3, 'slam'], [8, 'slide'], [12, 'slide']],
    C: () => (
      <>
        <Strip k={0} text="她以“文化汉奸”罪名被捕" x={7} y={8} size={3.8} bg={P.rice} fg={P.ink} rot={-1.5} />
        <Cut k={3} text="汉奸" x={10} y={22} size={18} per={2} dark />
        <Mark k={6} kind="underline" box={{x: 10, y: 22, w: 46, h: 13}} />
        <Strip k={8} text="被关押在上海" x={8} y={46} size={3.2} bg={P.night} rot={1} />
        <Strip k={12} text="检方主张判处死刑" x={8} y={54} size={4} bg={P.red} rot={-1} />
      </>
    )},
  {b: 238, bg: P.night, dots: 'none', year: 1946, name: 0, src: SRC_BIO, sfx: [[0, 'slam'], [2, 'popIn'], [7, 'slide'], [11, 'stamp']],
    C: () => (
      <>
        <Strip k={0} text="她拿出证据：自己是日本人" x={7} y={8} size={3.4} bg={P.rice} fg={P.ink} rot={-1.5} />
        <Cut k={2} text="山口淑子" x={8} y={18} size={10} per={1} dark />
        <DateStrip k={7} text="1946.2" x={8} y={36} size={4.6} />
        <Strip k={9} text="法庭确认国籍，宣告无罪" x={8} y={44} size={3.6} bg={P.red} rot={1} />
        <Note k={12} text={'法官：以中国人的艺名\n拍这些电影，令人遗憾。'} by="—— 大意，据中新网报道" x={8} y={56} w={80} size={3.4} />
      </>
    )},
  {b: 254, bg: P.ink, dots: 'none', year: 1946, name: 0, struck: true, src: SRC_BIO, sfx: [[0, 'slam'], [4, 'scribble'], [8, 'slide']],
    C: () => (
      <>
        <Strip k={0} text="1946 年春，遣返日本" x={7} y={8} size={3.6} bg={P.rice} fg={P.ink} rot={-1.5} />
        <Cut k={2} text="李香兰" x={8} y={22} size={11.5} per={1} dark />
        <Mark k={4} kind="strike" box={{x: 8, y: 22, w: 70, h: 10}} />
        <Strip k={8} text="这个名字，从此留在了中国" x={10} y={46} size={3.4} bg={P.red} rot={1} />
      </>
    )},
  // ── last choruses: 山口淑子 again, Shirley Yamaguchi, 大鹰淑子, and her later years between Japan and China
  {b: 270, pace: 0.8, bg: P.paper, dots: 'br', year: 1947, name: 0, struck: true, src: `${SRC_PHOTO} · ${SRC_BIO}`, sfx: [[0, 'slam'], [1, 'printLand'], [2, 'slide'], [3, 'popIn'], [6, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1947" />
        <Photo k={1} name="yy1950" w={50} x={44} y={36} rot={3} />
        <Strip k={2} text="改回本名" x={8} y={16} size={3.4} bg={P.red} rot={-1} />
        <Cut k={3} text="山口淑子" x={6} y={23} size={8} per={1} />
        <Strip k={6} text="在日本重新拍片" x={6} y={46} size={3.2} rot={1} />
      </>
    )},
  {b: 279, pace: 0.85, bg: P.mist, dots: 'tl', year: 1951, name: 3, struck: true, src: `${SRC_PHOTO} · 据 AFP、《华盛顿邮报》讣闻`, sfx: [[0, 'slam'], [1, 'printLand'], [2, 'slide'], [5, 'slide'], [7, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1950 年代" />
        <Photo k={1} name="domon1952" w={50} x={46} y={40} rot={3} />
        <Strip k={2} text="Shirley Yamaguchi" x={6} y={18} size={3.8} bg={P.rice} fg={P.ink} rot={-1.5} font={ROLE.num} />
        <Tag k={3} text="闯荡好莱坞与百老汇" x={8} y={25} size={2.6} />
        <Film k={5} title="《竹屋》" note="1955 · 好莱坞" x={8} y={34} size={3.6} />
        <Strip k={7} text="1951 年嫁雕塑家野口勇，1956 年离婚" x={6} y={75} size={2.6} rot={-1} />
      </>
    )},
  {b: 288, bg: P.paper, dots: 'br', year: 1958, name: 4, struck: true, src: `${SRC_PHOTO} · ${SRC_BIO}`, sfx: [[0, 'slam'], [1, 'slide'], [2, 'popIn'], [4, 'printLand']],
    C: () => (
      <>
        <DateStrip k={0} text="1958" />
        <Strip k={1} text="嫁给外交官大鹰弘，息影" x={8} y={16} size={3.2} bg={P.red} rot={-1} />
        <Cut k={2} text="大鹰淑子" x={6} y={24} size={9} per={1} />
        <Photo k={4} name="portrait_hand" w={40} x={52} y={40} rot={3} />
      </>
    )},
  {b: 296, bg: P.night, dots: 'none', year: 1974, name: 4, struck: true, src: `${SRC_BIO} · 图：中时新闻网（晚年）`, sfx: [[0, 'slam'], [1, 'slide'], [2, 'slam'], [4, 'printLand'], [6, 'slide']],
    C: () => (
      <>
        <DateStrip k={0} text="1974" />
        <Strip k={1} text="当选日本参议院议员" x={8} y={16} size={3.6} bg={P.rice} fg={P.ink} rot={-1} />
        <Cut k={2} text="18年" x={8} y={26} size={14} per={1} dark />
        <Print k={4} name="otaka_late" w={34} x={60} y={52} rot={3} />
        <Tag k={5} text="晚年的大鹰淑子" x={10} y={53} size={2.4} bg={P.rice} fg={P.ink} rot={-1} />
        <Strip k={6} text="连任三届，至 1992 年" x={8} y={45} size={3.2} bg={P.red} rot={1} />
      </>
    )},
  // ── back to China: 1975 via Beijing, 1978 her old cities (land-only map, schematic dots)
  {b: 304, bg: P.night, dots: 'none', year: 1978, name: 4, struck: true, src: `${SRC_BIO} · 底图：Natural Earth（仅陆地，城市位置示意）`, sfx: [[0, 'mapFly'], [1, 'slide'], [4, 'slam'], [6, 'slide'], [7, 'poseJump'], [8, 'poseJump'], [9, 'poseJump'], [10, 'poseJump']],
    C: () => <Revisit />},
  {b: 316, pace: 0.85, bg: P.paper, dots: 'tr', year: 2005, name: 4, struck: true, src: `${SRC_BIO} · 据英文维基百科及讣闻报道`, sfx: [[0, 'slam'], [3, 'slide'], [4, 'popIn'], [6, 'slam'], [7, 'slide'], [9, 'slide']],
    C: () => (
      <>
        <Cut k={0} text="中日之间" x={6} y={6} size={8.4} per={1} />
        <Strip k={3} text="曾任“亚洲女性基金”副理事长" x={7} y={21} size={3.2} rot={-1} />
        <Tag k={4} text="为慰安妇问题奔走" x={9} y={27.5} size={2.6} />
        <DateStrip k={6} text="2005" x={7} y={37} size={4.6} />
        <Strip k={7} text="撰长文，劝小泉首相不要参拜靖国神社" x={6} y={45.5} size={2.8} bg={P.red} rot={1} />
        <Note k={9} text="理由：这会伤害中国人的感情。" by="—— 大意，据中新网报道" x={7} y={53} w={84} size={3} />
        <Bits k={2} seed="b2005" items={[{kind: 'half', x: 84, y: 16, size: 5, rot: 12, color: P.red}, {kind: 'dot', x: 86, y: 30, size: 3, color: P.night}]} />
      </>
    )},
  {b: 326, bg: P.ink, dots: 'none', year: 2014, name: 4, struck: true, src: `${SRC_BIO} · 影片：《莎韵之钟》，1943（公有领域）`, sfx: [[0, 'slam'], [1, 'printLand']],
    C: () => (
      <>
        <DateStrip k={0} text="2014.9.7 · 东京" />
        <FilmStrip k={1} src={clip('sayon_close')} len={240} x={6} y={18} w={80} rot={-1} />
        <Strip k={5} text="去世，享年 94 岁" x={8} y={52} size={3.8} bg={P.red} rot={1} />
      </>
    )},
  // ── closing: the name people remember, the other four beneath it, credit
  {b: 334, bg: P.night, dots: 'none', cam: {from: [50, 50, 1.0], to: [50, 49, 1.04]}, sfx: [[0, 'titleHit'], [4, 'slide']],
    C: () => {
      const {st, H} = useB();
      return (
        <>
          <div style={{position: 'absolute', inset: 0, opacity: 0.4}}>
            <Photo k={0} name="hero" w={84} x={8} y={6} enter="none" pitch={0.3} />
          </div>
          <Brush k={0} text="李香兰" x={12} y={50} size={16} color={P.rice} />
          <Strip k={2} text="1920 — 2014" x={30} y={67} size={4} bg={P.rice} fg={P.ink} rot={-1} font={ROLE.num} />
          {st(4) >= 0 ? (
            <div style={{position: 'absolute', left: '8%', right: '8%', top: '74.5%', textAlign: 'center', fontFamily: ROLE.label, fontWeight: 700, fontSize: H * 0.02, lineHeight: 1.6, color: 'rgba(246,241,230,.8)'}}>
              她也是
              <br />
              山口淑子 · 潘淑华
              <br />
              <span style={{fontFamily: ROLE.num, fontWeight: 600}}>Shirley Yamaguchi</span> · 大鹰淑子
            </div>
          ) : null}
          <Credit k={6} />
        </>
      );
    }},
];

// ---------------------------------------------------------------- the name bar

/** her names along the bottom: a name appears once she has taken it, the one in use is a red chip, 李香兰 is struck from 1946 */
const NameBar: React.FC<{frame: number}> = ({frame}) => {
  const {width: W, height: H} = useVideoConfig();
  let idx = 0;
  for (let i = 0; i < SHOTS.length; i++) if (frame >= F[SHOTS[i].b]) idx = i;
  const shot = SHOTS[idx];
  if (shot.year === undefined) return null;
  const local = frame - F[shot.b];
  const prev = idx > 0 ? SHOTS[idx - 1] : undefined;
  const dark = DARK.has(shot.bg);
  const fs = H * 0.019;
  const strikeP = shot.struck ? (prev?.struck ? 1 : Math.min(1, Math.max(0, (local - 24) / 10))) : 0;
  return (
    <div style={{position: 'absolute', left: '6%', right: '6%', top: '86.6%', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
      {NAMES.map((n, i) => {
        const known = (shot.year ?? 0) >= n.year;
        const active = shot.name === i;
        const fresh = active && prev?.name !== i;
        const sc = fresh ? SLAP[Math.min(3, Math.max(0, Math.floor(local / 2)))] : 1;
        const latin = i === 3;
        const color = active ? P.rice : dark ? 'rgba(246,241,230,.72)' : 'rgba(27,27,26,.62)';
        return (
          <div key={i} style={{position: 'relative', padding: `${fs * 0.22}px ${fs * 0.42}px`, transform: `scale(${sc}) rotate(${active ? -2 : 0}deg)`, opacity: known ? 1 : 0.5}}>
            {active ? <div style={{position: 'absolute', inset: 0, background: P.red, clipPath: 'polygon(1% 4%, 99% 0%, 100% 96%, 0% 100%)'}} /> : null}
            <div style={{position: 'relative', fontFamily: latin ? ROLE.num : ROLE.label, fontWeight: active ? 900 : 700, fontSize: fs, color, whiteSpace: 'nowrap', letterSpacing: '0.04em'}}>
              {known ? n.short : '？？'}
            </div>
            {i === 1 && strikeP > 0 ? (
              <div style={{position: 'absolute', left: '4%', top: '52%', height: H * 0.0028, width: `${92 * strikeP}%`, background: P.red, transform: 'rotate(-4deg)'}} />
            ) : null}
          </div>
        );
      })}
    </div>
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
      <NameBar frame={frame} />
      <FilmLook frame={frame} grain={0.08} vignette={0.3} />
    </AbsoluteFill>
  );
};
