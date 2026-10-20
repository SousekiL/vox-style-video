// 立木为信 v3: aggressive vox-collage (14-vox-collage.md). Every object is a PRINTED cut-out (halftone, grain,
// torn white border, paper shadow) on one bold flat colour per shot; lettering is cut out character by character;
// collage elements step on 2s (12 drawings/s) while the camera moves smoothly at 24 fps.
// Type rule: fonts are assigned by ROLE and every text element uses ONE font throughout (a cut-out word never
// mixes typefaces; variety comes from chip colour and angle). Different roles may use different fonts.
// Figures and the gate are original woodblock-style illustrations (labelled 插画示意); artifacts are real (CC).
import React, {createContext, useContext} from 'react';
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  Annotate,
  Bgm,
  ColorField,
  CollageFilters,
  CutLetters,
  FilmLook,
  HeadlineStrip,
  LabelBox,
  PrintCutout,
  STAMP,
  Scraps,
  Seal,
  SfxTrack,
  SourceLine,
  Tape,
  VOX_COLLAGE as C,
  VOX_FONT,
  VoxCamera,
  loadLocalFont,
  table,
  type ChipStyle,
  type SfxEvent,
} from '../collage';

// ---- fonts by role (one font per element) ----
const KAI = loadLocalFont('Kai Subset', 'fonts/kai-qin.woff', '500'); // subset of LXGW WenKai Medium (OFL)
export const ROLE = {
  chip: {font: VOX_FONT.cjkSans, weight: 900}, // 剪贴大字: 黑体 Heavy
  title: {font: VOX_FONT.cjkSerif, weight: 900}, // 核心标题: 宋体 Heavy
  strip: {font: VOX_FONT.cjkSans, weight: 900}, // 问句/信息条: 黑体
  quote: {font: KAI, weight: 500}, // 古文原句/金句: 楷体
  label: {font: VOX_FONT.cjkSans, weight: 700}, // 标签/出处: 黑体
  seal: {font: KAI, weight: 500}, // 印章: 楷体
};

// ---- themes (bake-off): one bold flat colour per shot + chip colour pairs ----
export type CollageTheme = {
  name: string;
  bgs: [string, string, string, string, string, string];
  discs: [string?, string?, string?, string?, string?, string?];
  chips: Array<{bg: string; fg: string}>;
  strip: {bg: string; fg: string};
  dark: {bg: string; fg: string};
  accent: string;
  scraps: string[];
  onDark: boolean[];
};
export const THEMES: Record<string, CollageTheme> = {
  voxPop: {
    name: 'Vox pop（取自 Vox 封面实测色）',
    bgs: [C.yellow, C.wine, C.blue, C.pink, C.yellow, C.rice],
    discs: [undefined, '#B85563', '#3A7DB0', undefined, '#E2D30B', C.vermilion],
    chips: [
      {bg: C.ink, fg: C.paper},
      {bg: C.paper, fg: C.red},
      {bg: C.yellow, fg: C.ink},
      {bg: C.red, fg: C.paper},
    ],
    strip: {bg: C.yellow, fg: C.ink},
    dark: {bg: C.ink, fg: C.paper},
    accent: C.red,
    scraps: [C.red, C.blue, C.pink, C.ink, C.yellow, C.paper],
    onDark: [false, true, true, true, false, false],
  },
  chineseInk: {
    name: '水墨朱砂（宣纸 · 墨 · 朱红）',
    bgs: ['#E9DFC8', '#1F1E1C', '#E9DFC8', C.vermilion, '#1F1E1C', '#E9DFC8'],
    discs: ['#D9CBAE', '#2E2C29', C.vermilion, '#A52A22', '#3A3732', C.vermilion],
    chips: [
      {bg: '#1F1E1C', fg: '#E9DFC8'},
      {bg: '#E9DFC8', fg: C.vermilion},
      {bg: C.vermilion, fg: '#F4ECD9'},
    ],
    strip: {bg: '#F4ECD9', fg: '#1F1E1C'},
    dark: {bg: '#1F1E1C', fg: '#F4ECD9'},
    accent: C.vermilion,
    scraps: [C.vermilion, '#1F1E1C', '#B9A884', C.vermilion, '#E9DFC8', '#1F1E1C'],
    onDark: [false, true, false, true, true, false],
  },
  newsprint: {
    name: '旧报纸（米白 · 深红 · 芥黄 · 炭灰）',
    bgs: ['#E8DFC9', '#8E2B22', '#D9A441', '#3A3A3A', '#D9A441', '#E8DFC9'],
    discs: ['#D8CDB2', '#A3392E', '#C99231', '#4A4A4A', '#C99231', '#8E2B22'],
    chips: [
      {bg: '#2B2B2B', fg: '#F2EBDA'},
      {bg: '#F2EBDA', fg: '#8E2B22'},
      {bg: '#8E2B22', fg: '#F2EBDA'},
    ],
    strip: {bg: '#F2EBDA', fg: '#2B2B2B'},
    dark: {bg: '#2B2B2B', fg: '#F2EBDA'},
    accent: '#8E2B22',
    scraps: ['#8E2B22', '#2B2B2B', '#D9A441', '#F2EBDA', '#8E2B22', '#2B2B2B'],
    onDark: [false, true, false, true, false, false],
  },
  swissRed: {
    name: '瑞士红（红 · 白 · 黑）',
    bgs: ['#E30613', '#F2F2F2', '#111111', '#E30613', '#F2F2F2', '#111111'],
    discs: ['#C70511', '#E2E2E2', '#2A2A2A', '#C70511', '#E2E2E2', '#E30613'],
    chips: [
      {bg: '#111111', fg: '#FFFFFF'},
      {bg: '#FFFFFF', fg: '#E30613'},
      {bg: '#E30613', fg: '#FFFFFF'},
    ],
    strip: {bg: '#FFFFFF', fg: '#111111'},
    dark: {bg: '#111111', fg: '#FFFFFF'},
    accent: '#111111',
    scraps: ['#111111', '#FFFFFF', '#111111', '#FFFFFF', '#E30613', '#111111'],
    onDark: [true, false, true, true, false, true],
  },
};
const ThemeCtx = createContext<CollageTheme>(THEMES.voxPop);
/** bake-off frame override: every shot reads its frame from here when set (all child components take frame/step as props) */
const FrameCtx = createContext<number | null>(null);
const useTheme = () => useContext(ThemeCtx);
/** chip colours cycle per character; the font is the SAME for every character of the element */
const chips = (t: CollageTheme, role: {font: string; weight: number}, offset = 0): ChipStyle[] =>
  t.chips.map((_, i) => ({...t.chips[(i + offset) % t.chips.length], font: role.font, weight: role.weight}));

const SHOT = 48; // 2 s at 24 fps = one bar of the 120 bpm bed → every cut on a downbeat
const img = (n: string) => staticFile(`cutouts/qin3/${n}.png`);
const useShot = () => {
  const cf = useCurrentFrame();
  const override = useContext(FrameCtx);
  const f = override ?? cf;
  const {fps, width, height} = useVideoConfig();
  const V = height > width; // portrait (9:16) layout
  /** pick the landscape or the portrait value */
  const L = <T,>(h: T, v: T): T => (V ? v : h);
  return {f, fps, height, u: Math.min(width, height), V, L, s: Math.floor(f / 2), t: useTheme()};
};

// ① hook: a log, a question
const S1: React.FC = () => {
  const {f, fps, u, s, t, L} = useShot();
  return (
    <AbsoluteFill>
      <ColorField color={t.bgs[0]} dots="br" seed={1} />
      <VoxCamera frame={f} fps={fps} drift={0.03}>
        <Scraps
          step={s}
          appearStep={2}
          seed="s1"
          items={[
            {kind: 'zigzag', x: L(82, 74), y: L(8, 6), size: L(9, 5), rot: -12, color: t.scraps[0]},
            {kind: 'triangle', x: L(6, 8), y: L(74, 84), size: L(8, 4.5), rot: 18, color: t.scraps[1]},
            {kind: 'dot', x: L(90, 84), y: L(70, 64), size: L(5, 3), color: t.scraps[2]},
            {kind: 'star', x: L(70, 70), y: L(76, 86), size: L(10, 6), rot: 8, color: t.scraps[3]},
          ]}
        />
        <PrintCutout src={img('pole')} aspect={0.082} widthPx={u * L(0.075, 0.085)} x={L(60, 50)} y={L(0, 24)} rot={-58} step={s} enter="slap" />
        <Tape x={L(66, 60)} y={L(16, 33)} w={L(9, 14)} h={L(3.2, 1.8)} rot={30} color="rgba(236,226,196,.9)" seed={3} />
        <CutLetters text="一根木头" step={s - 3} perChar={1} sizePctH={L(13, 6.6)} styles={chips(t, ROLE.chip)} x={L(6, 8)} y={L(20, 10)} seed="t1" />
        <HeadlineStrip text="能值多少钱？" step={s - 9} sizePctH={L(5.6, 3.6)} x={L(7, 10)} y={L(60, 72)} bg={t.dark.bg} fg={t.dark.fg} rot={-3} font={ROLE.strip.font} />
      </VoxCamera>
    </AbsoluteFill>
  );
};

// ② where: Qin, before the reform — real Qin slips as a clipping
const S2: React.FC = () => {
  const {f, fps, u, s, t, L} = useShot();
  return (
    <AbsoluteFill>
      <ColorField color={t.bgs[1]} dots="tl" seed={2} disc={t.discs[1] ? {x: L(36, 50), y: L(62, 70), r: L(30, 20), color: t.discs[1]} : undefined} />
      <VoxCamera frame={f} fps={fps} drift={0.02} keys={[{at: 0, cx: 47, cy: 50, scale: 1.04}, {at: SHOT, cx: 53, cy: 50, scale: 1.04}]}>
        <PrintCutout src={img('gate')} aspect={1.538} widthPx={u * L(1.0, 0.96)} x={L(4, 2)} y={L(30, 50)} rot={-2} step={s} enter="slap" ink="#1a1a1a" paperColor="#EFE7D6" />
        <PrintCutout src={staticFile('evidence/qin/qin_slips.jpg')} aspect={1.796} widthPx={u * L(0.62, 0.66)} x={L(58, 28)} y={L(10, 20)} rot={4} step={s - 4} enter="drop" pitchPctH={L(0.5, 0.3)} paperColor="#F4EEDC" />
        <LabelBox frame={f} at={14} text="真实文物 · 睡虎地秦简" bg={t.accent} font={ROLE.label.font} sizePctH={L(2.4, 1.5)} style={{left: `${L(60, 32)}%`, top: `${L(64, 40)}%`}} />
        <HeadlineStrip text="秦国，变法前夕" step={s - 2} sizePctH={L(6.4, 3.8)} x={L(9, 8)} y={L(11, 8)} rot={-4} bg={t.strip.bg} fg={t.strip.fg} font={ROLE.strip.font} />
        <Scraps step={s} appearStep={6} seed="s2" items={[{kind: 'bar', x: L(84, 74), y: L(80, 88), size: L(12, 7), rot: -20, color: t.scraps[4]}, {kind: 'half', x: L(3, 6), y: L(82, 44), size: L(9, 5), rot: 10, color: t.scraps[3]}]} />
      </VoxCamera>
      <SourceLine frame={f} at={6} onDark={t.onDark[1]} font={ROLE.label.font} text="图：睡虎地秦简，Gary Todd 摄，CC0 · 城门为插画示意" />
    </AbsoluteFill>
  );
};

// ③ the offer: an official, the Shiji line (quote role), 予十金 (chip role)
const S3: React.FC = () => {
  const {f, fps, u, s, t, L} = useShot();
  return (
    <AbsoluteFill>
      <ColorField color={t.bgs[2]} dots="tr" seed={3} disc={t.discs[2] ? {x: L(22, 32), y: L(52, 60), r: L(36, 22), color: t.discs[2]} : undefined} />
      <VoxCamera frame={f} fps={fps} drift={-0.02} keys={[{at: 0, cx: 50, cy: 50, scale: 1.09}, {at: SHOT, cx: 50, cy: 50, scale: 1.0}]}>
        <PrintCutout src={img('official')} aspect={0.494} widthPx={u * L(0.44, 0.5)} x={L(6, 4)} y={L(8, 30)} rot={-1} step={s} enter="slide" />
        <HeadlineStrip text="募民有能徙置北门者" step={s - 4} sizePctH={L(5.6, 3.2)} x={L(38, 8)} y={L(20, 10)} rot={-2} bg={t.strip.bg} fg={t.strip.fg} font={ROLE.quote.font} />
        <CutLetters text="予十金" step={s - 8} perChar={1} sizePctH={L(15, 7.2)} styles={chips(t, ROLE.chip, 3)} x={L(44, 36)} y={L(40, 17)} seed="t3" />
        <Scraps step={s} appearStep={10} seed="s3" items={[{kind: 'star', x: L(86, 84), y: L(10, 42), size: L(9, 5), color: t.scraps[4]}, {kind: 'zigzag', x: L(44, 52), y: L(78, 70), size: L(10, 6), rot: 6, color: t.scraps[5]}]} />
      </VoxCamera>
      <SourceLine frame={f} at={8} onDark={t.onDark[2]} top={!L(false, true)} font={ROLE.label.font} text="原文：《史记·商君列传》 · 人物为插画示意" />
    </AbsoluteFill>
  );
};

// ④ nobody moves
const S4: React.FC = () => {
  const {f, fps, u, s, t, L} = useShot();
  return (
    <AbsoluteFill>
      <ColorField color={t.bgs[3]} dots="bl" seed={4} />
      <VoxCamera frame={f} fps={fps} drift={0.02} keys={[{at: 0, cx: 50, cy: 53, scale: 1.05}, {at: SHOT, cx: 50, cy: 47, scale: 1.05}]}>
        <PrintCutout src={img('crowd')} aspect={1.265} widthPx={u * L(0.98, 1.02)} x={L(36, -1)} y={L(22, 40)} rot={1.5} step={s} enter="drop" />
        <CutLetters text="没人敢搬" step={s - 3} perChar={1} sizePctH={L(12, 6.2)} styles={chips(t, ROLE.chip, 2)} x={L(4, 8)} y={L(10, 10)} seed="t4" />
        <HeadlineStrip text="？" step={s - 9} sizePctH={L(12, 6.4)} x={L(12, 62)} y={L(52, 24)} bg={t.dark.bg} fg={t.dark.fg} rot={-8} font={ROLE.strip.font} />
        <HeadlineStrip text="？" step={s - 11} sizePctH={L(8, 4.2)} x={L(24, 78)} y={L(66, 30)} bg={t.strip.bg} fg={t.strip.fg} rot={9} font={ROLE.strip.font} />
        <Scraps step={s} appearStep={4} seed="s4" items={[{kind: 'triangle', x: L(88, 84), y: L(8, 6), size: L(8, 4.5), rot: -14, color: t.scraps[3]}, {kind: 'dot', x: L(28, 12), y: L(86, 92), size: L(6, 3.5), color: t.scraps[4]}]} />
      </VoxCamera>
      <SourceLine frame={f} at={6} onDark={t.onDark[3]} top={L(true, false)} font={ROLE.label.font} text="插画示意" />
    </AbsoluteFill>
  );
};

// ⑤ ×5: 十金 struck, 五十金 slams, the gold
const S5: React.FC = () => {
  const {f, fps, u, s, t, L} = useShot();
  return (
    <AbsoluteFill>
      <ColorField color={t.bgs[4]} dots="tl" seed={5} disc={t.discs[4] ? {x: L(66, 50), y: L(56, 66), r: L(34, 22), color: t.discs[4]} : undefined} />
      <VoxCamera frame={f} fps={fps} drift={0.04}>
        <PrintCutout src={img('gold')} aspect={1.763} widthPx={u * L(0.95, 0.94)} x={L(44, 3)} y={L(34, 50)} rot={-3} step={s - 6} enter="slap" ink="#3E2604" paperColor="#E7B43E" pitchPctH={L(0.55, 0.32)} />
        <HeadlineStrip text="十金" step={s} sizePctH={L(9, 4.8)} x={L(10, 10)} y={L(14, 10)} bg={t.dark.bg} fg={t.dark.fg} rot={-3} font={ROLE.strip.font} />
        <Annotate frame={f} at={6} dur={6} kind="strike" box={L({x: 9, y: 14, w: 22, h: 16}, {x: 9, y: 10, w: 34, h: 8})} widthPctH={L(1.2, 0.7)} color={t.accent === '#111111' ? '#E30613' : t.accent} seed="x5" />
        <CutLetters text="五十金" step={s - 5} perChar={1} sizePctH={L(17, 8.4)} styles={chips(t, ROLE.chip, 3)} x={L(5, 8)} y={L(40, 26)} seed="t5" />
        <HeadlineStrip text="赏金 ×5" step={s - 12} sizePctH={L(4.6, 2.8)} x={L(8, 10)} y={L(80, 84)} bg={t.strip.bg} fg={t.strip.fg} rot={2} font={ROLE.strip.font} />
      </VoxCamera>
      <SourceLine frame={f} at={8} onDark={t.onDark[4]} font={ROLE.label.font} text="图：西汉金饼（示意），陕西历史博物馆，源義信 摄，CC BY 4.0" />
    </AbsoluteFill>
  );
};

// ⑥ payoff: someone carries it; trust becomes law
const PORTER_X_H = [-72, -48, -30, -18, -11, -8, -6.5, -5.6, -5, -4.6, -4.3, -4.1];
const PORTER_X_V = [-150, -110, -80, -60, -48, -41, -37, -35, -34, -33.4, -33, -32.8];
const S6: React.FC = () => {
  const {f, fps, u, s, t, L} = useShot();
  const X = L(PORTER_X_H, PORTER_X_V);
  const px = X[Math.min(s, X.length - 1)] + Math.max(0, s - X.length + 1) * 0.15;
  const sealScale = f < 30 ? 0 : table(STAMP, f - 30);
  return (
    <AbsoluteFill>
      <ColorField color={t.bgs[5]} dots="none" seed={6} disc={t.discs[5] ? {x: L(33, 50), y: L(50, 40), r: L(34, 21), color: t.discs[5]} : undefined} />
      <VoxCamera frame={f} fps={fps} drift={0.008}>
        <PrintCutout src={img('porter')} aspect={1.49} widthPx={u * L(1.15, 1.3)} x={px} y={L(14, 22)} rot={-1} step={s} enter="none" wobble={0.6} />
        <HeadlineStrip text="立木为信" step={s - 7} sizePctH={L(11, 6.2)} x={L(57, 12)} y={L(44, 74)} rot={-3} bg={t.strip.bg} fg={t.strip.fg} font={ROLE.title.font} />
        <CutLetters text="以明不欺" step={s - 10} perChar={1} sizePctH={L(7, 4)} styles={chips(t, ROLE.quote)} x={L(60, 16)} y={L(68, 85)} seed="t6" />
        <Seal text="信" sizePx={u * L(0.14, 0.2)} scale={sealScale} font={ROLE.seal.font} style={{left: `${L(86, 72)}%`, top: `${L(70, 83)}%`}} />
      </VoxCamera>
      <SourceLine frame={f} at={6} onDark={t.onDark[5]} font={ROLE.label.font} text="据《史记·商君列传》 · 人物为插画示意" />
    </AbsoluteFill>
  );
};

const SHOTS = [S1, S2, S3, S4, S5, S6];
const at = (shot: number, local: number) => shot * SHOT + local;
const CUES: Array<{at: number; event: SfxEvent; db?: number}> = [
  {at: at(0, 0), event: 'slam', db: -9},
  ...[0, 1, 2, 3].map((k) => ({at: at(0, 6 + k * 2), event: 'poseJump' as const, db: -16})),
  {at: at(0, 18), event: 'slide', db: -14},
  {at: at(1, 0), event: 'printLand', db: -12},
  {at: at(1, 4), event: 'poseJump', db: -16},
  {at: at(1, 8), event: 'pageTurn', db: -14},
  {at: at(2, 0), event: 'slide', db: -14},
  {at: at(2, 8), event: 'highlight', db: -16},
  ...[0, 1, 2].map((k) => ({at: at(2, 16 + k * 2), event: 'poseJump' as const, db: -14})),
  {at: at(3, 0), event: 'printLand', db: -14},
  ...[0, 1, 2, 3].map((k) => ({at: at(3, 6 + k * 2), event: 'poseJump' as const, db: -16})),
  {at: at(3, 18), event: 'slam', db: -14},
  {at: at(4, 0), event: 'slam', db: -12},
  {at: at(4, 6), event: 'scribble', db: -15},
  {at: at(4, 10), event: 'slam', db: -10},
  {at: at(4, 12), event: 'burst', db: -16},
  {at: at(5, 0), event: 'slide', db: -14},
  {at: at(5, 14), event: 'slam', db: -9},
  {at: at(5, 30), event: 'seal', db: -8},
];

export const QinPoleCollage: React.FC<{theme?: string}> = ({theme = 'voxPop'}) => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();
  return (
    <ThemeCtx.Provider value={THEMES[theme] ?? THEMES.voxPop}>
      <AbsoluteFill style={{background: '#141414'}}>
        <CollageFilters scale={height / 1080} seed={2} />
        <Bgm src="audio/bgm/qin_dynasty.wav" levelDb={-4} fadeIn={2} fadeOut={24} />
        <SfxTrack cues={CUES} />
        {SHOTS.map((Shot, i) => (
          <Sequence key={i} from={i * SHOT} durationInFrames={SHOT}>
            <Shot />
          </Sequence>
        ))}
        <FilmLook frame={frame} grain={0.09} vignette={0.32} />
      </AbsoluteFill>
    </ThemeCtx.Provider>
  );
};

export const QIN_COLLAGE_DURATION = SHOTS.length * SHOT;

/**
 * Style bake-off (gate): the same shot, frozen at the same frame, in four themes, 2×2.
 * npx remotion still src/index.ts VoxCollageBakeoff out/bakeoff.png --props='{"shot":0,"frame":40}'
 */
export const CollageBakeoff: React.FC<{shot?: number; frame?: number}> = ({shot = 0, frame = 40}) => {
  const {width, height} = useVideoConfig();
  const Shot = SHOTS[shot];
  const names = Object.keys(THEMES);
  return (
    <AbsoluteFill style={{background: '#111'}}>
      <CollageFilters scale={height / 1080} seed={2} />
      {names.map((n, i) => (
        <div key={n} style={{position: 'absolute', left: (i % 2) * (width / 2), top: Math.floor(i / 2) * (height / 2), width, height, transform: 'scale(0.5)', transformOrigin: '0 0', overflow: 'hidden'}}>
          <ThemeCtx.Provider value={THEMES[n]}>
            <FrameCtx.Provider value={frame}>
              <Shot />
            </FrameCtx.Provider>
          </ThemeCtx.Provider>
          <div style={{position: 'absolute', left: 24, top: 20, padding: '6px 14px', background: '#111', color: '#fff', fontFamily: ROLE.label.font, fontWeight: 700, fontSize: height * 0.045}}>{THEMES[n].name}</div>
        </div>
      ))}
    </AbsoluteFill>
  );
};
