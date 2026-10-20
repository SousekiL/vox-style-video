// 2026 台北市長選情（截至 2026/10/20）: vertical vox-collage explainer in Traditional Chinese (14-vox-collage.md).
// Portrait-only (1080×1920): positions are % of the frame, sizes % of frame height.
// Neutral data rules: 蔣萬安 is always blue and on the left of a split bar, 沈伯洋 always green and on the right,
// undecided grey in the middle; both candidates get the same portrait size and the same number of shots;
// every poll shows its pollster, fieldwork dates, sample and margin of error; backgrounds avoid party colours.
//
// Facts (checked 2026-10-20):
// - 信民協會 poll (released 10/20): 戴立安 design, 畢肯市場研究 fieldwork, 10/14–16, n=1,075 (landline 753 + mobile 322),
//   ±3.0. 沈 50.3 · 蔣 33.3 · others 1.2 · undecided 15.2. Same pollster 9/16–18 (n=1,076): 蔣 41.7 · 沈 40.5.
//   KMT councillor 楊植斗 questioned the association's impartiality (聯合報 2026/10/20).
// - TVBS (own funds): 10/3 and 10/5–7, 1,120 adults, likely voters n=1,054, landline only, ±2.9.
//   蔣 49 · 沈 41 · undecided 11 (May: 58 · 30). Regions, swing groups, satisfaction: TVBS release pp. 1–2.
// - Earlier polls: 新台灣國策智庫 5/4–5 52.9·29.7; TVBS 5/21–26 58·30; 山水 6/21–22 55.2·27.5; TPOC 8/5–7 48.4·33.0.
// - 6 registered candidates (中央社 2026/9/4); vote 2026/11/28; polls may not be published from 11/18.
import React from 'react';
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {geoMercator, geoPath} from 'd3-geo';
import type {FeatureCollection, Geometry} from 'geojson';
import {
  Annotate,
  Bgm,
  ColorField,
  CollageFilters,
  CutLetters,
  FilmLook,
  HeadlineStrip,
  PrintCutout,
  SLAP,
  STAMP,
  Scraps,
  SfxTrack,
  SourceLine,
  Tape,
  VOX_COLLAGE as C,
  VOX_FONT,
  VOX_FONT_TC,
  VoxCamera,
  table,
  type ChipStyle,
  type SfxEvent,
} from '../collage';
import districts from '../collage/data/taipei-districts.json';

// ---- fonts by role (one font per element) ----
const ROLE = {
  chip: {font: VOX_FONT_TC.sans, weight: 900}, // 剪貼大字: 黑體
  title: {font: VOX_FONT_TC.serif, weight: 900}, // 收尾標題: 宋體
  strip: {font: VOX_FONT_TC.sans, weight: 900}, // 資訊條
  label: {font: VOX_FONT_TC.sans, weight: 700}, // 方法卡、標籤、出處
  num: {font: VOX_FONT.sans, weight: 800}, // 數字: Libre Franklin
};

// ---- colours: party colours only for data; shot backgrounds stay neutral ----
const BLUE = '#1F56A8'; // 蔣萬安（國民黨）
const GREEN = '#1E8C45'; // 沈伯洋（民進黨）
const GREY = '#9A958A'; // 未決定 / 其他
const CREAM = '#E8DFC9';
const chipSet = (pairs: Array<[string, string]>, role = ROLE.chip): ChipStyle[] => pairs.map(([bg, fg]) => ({bg, fg, font: role.font, weight: role.weight}));
const POP = chipSet([[C.ink, C.paper], [C.paper, C.red], [C.red, C.paper]]);
const ON_DARK = chipSet([[C.yellow, C.ink], [C.paper, C.ink], [C.red, C.paper]]);

const img = (n: string) => staticFile(`cutouts/taipei/${n}.png`);
const ASPECT = {chiang: 885 / 1080, shen: 855 / 1080};
const useShot = () => {
  const f = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  return {f, fps, W: width, H: height, s: Math.floor(f / 2)};
};
/** count up on the collage clock: eased over `n` drawings, then holds */
const countUp = (step: number, target: number, n = 8, digits = 1) => {
  const p = Math.max(0, Math.min(1, step / n));
  return (target * (1 - (1 - p) ** 3)).toFixed(digits);
};
/** dot screen over a flat colour, so bars read as printed paper */
const dotScreen = (H: number, ink = 'rgba(0,0,0,.22)') => ({
  backgroundImage: `radial-gradient(circle, ${ink} 30%, transparent 33%)`,
  backgroundSize: `${H * 0.0075}px ${H * 0.0075}px`,
});

// ---------------------------------------------------------------- data pieces

/** paper card: torn sticker edge + shadow */
const PaperCard: React.FC<{x: number; y: number; w: number; h: number; rot?: number; step: number; color?: string; children?: React.ReactNode}> = ({x, y, w, h, rot = 0, step, color = C.paper, children}) => {
  const {H} = useShot();
  if (step < 0) return null;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, transform: `rotate(${rot}deg) scale(${SLAP[Math.min(step, 3)]})`, filter: `url(#stickerTorn) drop-shadow(0 ${H * 0.007}px ${H * 0.009}px rgba(0,0,0,.4))`}}>
      <div style={{position: 'absolute', inset: 0, background: color}} />
      {children}
    </div>
  );
};

/** big number on a torn chip (Libre Franklin; one font for the whole element) */
const NumChip: React.FC<{step: number; value: number; suffix?: string; digits?: number; x: number; y: number; size: number; bg: string; fg: string; rot?: number; prefix?: string}> = ({step, value, suffix = '%', digits = 1, x, y, size, bg, fg, rot = -2, prefix = ''}) => {
  const {H} = useShot();
  if (step < 0) return null;
  const fs = (size / 100) * H;
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, transform: `rotate(${rot}deg) scale(${SLAP[Math.min(step, 3)]})`, transformOrigin: '0 50%', filter: `drop-shadow(0 ${H * 0.006}px ${H * 0.007}px rgba(0,0,0,.4))`}}>
      <div style={{position: 'absolute', inset: 0, background: bg, clipPath: 'polygon(1% 4%, 98% 0%, 100% 96%, 0% 100%)'}} />
      <div style={{position: 'relative', padding: `${fs * 0.04}px ${fs * 0.16}px`, fontFamily: ROLE.num.font, fontWeight: ROLE.num.weight, fontSize: fs, lineHeight: 1.0, color: fg, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums'}}>
        {prefix}
        {countUp(step, value, 8, digits)}
        {suffix}
      </div>
    </div>
  );
};

/** one candidate's bar: a printed paper strip that grows on the clock, number chip riding its end */
const Bar: React.FC<{step: number; name: string; pct: number; color: string; y: number; scale?: number; onDark?: boolean; digits?: number}> = ({step, name, pct, color, y, scale = 1.1, onDark = false, digits = 1}) => {
  const {H} = useShot();
  if (step < 0) return null;
  const grow = 1 - (1 - Math.min(1, step / 7)) ** 3;
  const w = pct * scale * grow;
  return (
    <>
      <HeadlineStrip text={name} step={step} sizePctH={3.2} x={8} y={y} bg={onDark ? C.paper : C.ink} fg={onDark ? C.ink : C.paper} rot={-2} font={ROLE.strip.font} />
      <div style={{position: 'absolute', left: '8%', top: `${y + 5}%`, width: `${w}%`, height: '6.4%', filter: `url(#torn) drop-shadow(0 ${H * 0.006}px ${H * 0.007}px rgba(0,0,0,.4))`}}>
        <div style={{position: 'absolute', inset: 0, background: color}} />
        <div style={{position: 'absolute', inset: 0, ...dotScreen(H)}} />
      </div>
      <NumChip step={step - 2} value={pct} digits={digits} x={8 + w + 2} y={y + 5.6} size={4.6} bg={onDark ? C.yellow : C.paper} fg={C.ink} />
    </>
  );
};

type Seg = {label: string; pct: number; color: string};
/** split bar: 蔣 (blue) left · grey middle · 沈 (green) right, labels inside each segment */
const SplitBar: React.FC<{step: number; segs: Seg[]; x: number; y: number; w: number; h: number}> = ({step, segs, x, y, w, h}) => {
  const {H} = useShot();
  if (step < 0) return null;
  const total = segs.reduce((a, b) => a + b.pct, 0);
  const shown = Math.min(segs.length, Math.floor(step / 2) + 1);
  return (
    <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%`, display: 'flex', filter: `url(#torn) drop-shadow(0 ${H * 0.005}px ${H * 0.006}px rgba(0,0,0,.35))`}}>
      {segs.map((sg, i) => (
        <div key={i} style={{position: 'relative', width: `${(sg.pct / total) * 100}%`, height: '100%', opacity: i < shown ? 1 : 0}}>
          <div style={{position: 'absolute', inset: 0, background: sg.color}} />
          <div style={{position: 'absolute', inset: 0, ...dotScreen(H, 'rgba(0,0,0,.16)')}} />
          {sg.label ? (
            <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ROLE.label.font, fontWeight: 900, fontSize: H * h * 0.0055, color: C.paper, whiteSpace: 'nowrap'}}>{sg.label}</div>
          ) : null}
        </div>
      ))}
    </div>
  );
};

/** method card text: one font (label role), several lines */
const MethodCard: React.FC<{step: number; y: number; lines: string[]; h?: number; dark?: boolean}> = ({step, y, lines, h = 15, dark = false}) => {
  const {H} = useShot();
  return (
    <PaperCard x={7} y={y} w={86} h={h} rot={1} step={step} color={dark ? '#2A2A2A' : C.paper}>
      <div style={{position: 'absolute', inset: 0, padding: `${H * 0.014}px ${H * 0.02}px`, fontFamily: ROLE.label.font, fontWeight: 700, fontSize: H * 0.021, lineHeight: 1.5, color: dark ? C.paper : C.ink}}>
        {lines.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </PaperCard>
  );
};

// ---------------------------------------------------------------- shots

// ① hook: two portraits, one question
const S1: React.FC = () => {
  const {f, fps, s, W} = useShot();
  return (
    <AbsoluteFill>
      <ColorField color={C.yellow} dots="tr" seed={1} />
      <VoxCamera frame={f} fps={fps} drift={0.03}>
        <Scraps step={s} appearStep={3} seed="a1" items={[{kind: 'star', x: 80, y: 5, size: 6, rot: 8, color: C.red}, {kind: 'zigzag', x: 4, y: 33, size: 5, rot: -10, color: C.ink}, {kind: 'dot', x: 86, y: 34, size: 3, color: C.pink}]} />
        <CutLetters text="台北市長" step={s} perChar={1} sizePctH={7} styles={POP} x={8} y={7} seed="h1" />
        <HeadlineStrip text="2026 誰領先？" step={s - 6} sizePctH={4.6} x={10} y={17} bg={C.ink} fg={C.paper} rot={-3} font={ROLE.strip.font} />
        <HeadlineStrip text="11.28 投票" step={s - 9} sizePctH={2.8} x={60} y={27} bg={C.red} fg={C.paper} rot={4} font={ROLE.strip.font} />
        <PrintCutout src={img('chiang')} aspect={ASPECT.chiang} widthPx={W * 0.52} x={-1} y={40} rot={-2} step={s - 11} enter="slide" paperColor="#EEF1F6" />
        <PrintCutout src={img('shen')} aspect={ASPECT.shen} widthPx={W * 0.52} x={49} y={41} rot={2} step={s - 14} enter="drop" paperColor="#EEF6F0" />
        <CutLetters text="VS" step={s - 17} perChar={1} sizePctH={4.4} styles={chipSet([[C.red, C.paper], [C.ink, C.yellow]], ROLE.num)} x={41} y={56} seed="vs1" />
        <HeadlineStrip text="蔣萬安" step={s - 13} sizePctH={3.6} x={7} y={76} bg={BLUE} fg={C.paper} rot={-3} font={ROLE.strip.font} />
        <HeadlineStrip text="沈伯洋" step={s - 16} sizePctH={3.6} x={57} y={80} bg={GREEN} fg={C.paper} rot={3} font={ROLE.strip.font} />
      </VoxCamera>
      <SourceLine frame={f} at={24} font={ROLE.label.font} text="肖像：臺北市政府、立法院（維基共享資源）" />
    </AbsoluteFill>
  );
};

// ② who: incumbent vs challenger, six on the ballot
const S2: React.FC = () => {
  const {f, fps, s, W} = useShot();
  return (
    <AbsoluteFill>
      <ColorField color={C.rice} dots="bl" seed={2} />
      <VoxCamera frame={f} fps={fps} drift={0.02} keys={[{at: 0, cx: 50, cy: 50, scale: 1.0}, {at: 96, cx: 50, cy: 50, scale: 1.05}]}>
        <PrintCutout src={img('chiang')} aspect={ASPECT.chiang} widthPx={W * 0.4} x={4} y={10} rot={-2} step={s} enter="slap" paperColor="#EEF1F6" />
        <CutLetters text="蔣萬安" step={s - 3} perChar={1} sizePctH={5.2} styles={chipSet([[BLUE, C.paper], [C.paper, BLUE]])} x={47} y={10} seed="n1" />
        <HeadlineStrip text="中國國民黨" step={s - 7} sizePctH={2.8} x={48} y={20} bg={C.ink} fg={C.paper} rot={-2} font={ROLE.strip.font} />
        <HeadlineStrip text="現任市長・爭取連任" step={s - 9} sizePctH={2.5} x={48} y={25.5} bg={C.paper} fg={C.ink} rot={1} font={ROLE.strip.font} />
        <CutLetters text="VS" step={s - 12} perChar={1} sizePctH={5} styles={chipSet([[C.red, C.paper], [C.ink, C.yellow]], ROLE.num)} x={42} y={39} seed="vs2" />
        <PrintCutout src={img('shen')} aspect={ASPECT.shen} widthPx={W * 0.4} x={56} y={50} rot={2} step={s - 14} enter="slap" paperColor="#EEF6F0" />
        <CutLetters text="沈伯洋" step={s - 17} perChar={1} sizePctH={5.2} styles={chipSet([[GREEN, C.paper], [C.paper, GREEN]])} x={6} y={52} seed="n2" />
        <HeadlineStrip text="民主進步黨" step={s - 21} sizePctH={2.8} x={7} y={62} bg={C.ink} fg={C.paper} rot={2} font={ROLE.strip.font} />
        <HeadlineStrip text="不分區立委・挑戰者" step={s - 23} sizePctH={2.5} x={7} y={67.5} bg={C.paper} fg={C.ink} rot={-1} font={ROLE.strip.font} />
        <HeadlineStrip text="共 6 人登記參選" step={s - 30} sizePctH={3.4} x={10} y={83} bg={C.yellow} fg={C.ink} rot={-3} font={ROLE.strip.font} />
      </VoxCamera>
      <SourceLine frame={f} at={10} font={ROLE.label.font} text="登記：中央社 2026/9/4 ・ 肖像：臺北市政府、立法院" />
    </AbsoluteFill>
  );
};

// ③ the 10/20 poll
const S3: React.FC = () => {
  const {f, fps, s} = useShot();
  return (
    <AbsoluteFill>
      <ColorField color={C.ink} dots="tr" seed={3} />
      <VoxCamera frame={f} fps={fps} drift={-0.02} keys={[{at: 0, cx: 50, cy: 50, scale: 1.06}, {at: 96, cx: 50, cy: 50, scale: 1.0}]}>
        <CutLetters text="10/20" step={s} perChar={1} sizePctH={6.6} styles={chipSet([[C.yellow, C.ink], [C.paper, C.ink], [C.red, C.paper]], ROLE.num)} x={8} y={5} seed="d3" />
        <HeadlineStrip text="最新民調" step={s - 5} sizePctH={4.6} x={10} y={15.5} bg={C.yellow} fg={C.ink} rot={-3} font={ROLE.strip.font} />
        <Bar step={s - 8} name="沈伯洋" pct={50.3} color={GREEN} y={25} onDark />
        <Bar step={s - 12} name="蔣萬安" pct={33.3} color={BLUE} y={39} onDark />
        <HeadlineStrip text="差 17 個百分點" step={s - 22} sizePctH={2.6} x={44} y={36.4} bg={C.red} fg={C.paper} rot={4} font={ROLE.strip.font} />
        <HeadlineStrip text="未決定 15.2%・其他 1.2%" step={s - 18} sizePctH={2.2} x={8} y={54} bg="#2A2A2A" fg={C.paper} rot={0} font={ROLE.label.font} />
        <MethodCard step={s - 26} y={62} h={17} lines={['委託：信民協會（戴立安 設計）', '執行：畢肯市場研究', '10/14–16 ・ 1,075 人', '市話 753 ＋ 手機 322 ・ 誤差 ±3.0']} />
      </VoxCamera>
      <SourceLine frame={f} at={30} onDark font={ROLE.label.font} text="資料：信民協會 2026/10/20 公布（聯合報、Taipei Times 報導）" />
    </AbsoluteFill>
  );
};

// ④ same pollster, one month: the lines cross
const Slope: React.FC<{step: number}> = ({step}) => {
  const {H, W} = useShot();
  const w = W * 0.86;
  const h = H * 0.46;
  const X0 = w * 0.2;
  const X1 = w * 0.72;
  const Y = (v: number) => h * 0.9 - ((v - 28) / (54 - 28)) * h * 0.78;
  const p = Math.max(0, Math.min(1, (step - 4) / 8));
  const ease = 1 - (1 - p) ** 3;
  const line = (a: number, b: number, color: string, label: string, delta: string, i: number) => {
    const xe = X0 + (X1 - X0) * ease;
    const ye = Y(a) + (Y(b) - Y(a)) * ease;
    return (
      <g key={label}>
        <line x1={X0} y1={Y(a)} x2={xe} y2={ye} stroke={color} strokeWidth={H * 0.009} strokeLinecap="round" />
        <circle cx={X0} cy={Y(a)} r={H * 0.012} fill={color} stroke={C.paper} strokeWidth={H * 0.003} />
        <text x={X0 - H * 0.02} y={Y(a) + H * (i ? 0.03 : -0.01)} textAnchor="end" fontFamily={ROLE.num.font} fontWeight={800} fontSize={H * 0.028} fill={color}>
          {a}
        </text>
        {p >= 1 ? (
          <>
            <circle cx={X1} cy={Y(b)} r={H * 0.014} fill={color} stroke={C.paper} strokeWidth={H * 0.003} />
            <text x={X1 + H * 0.022} y={Y(b) + H * 0.012} fontFamily={ROLE.num.font} fontWeight={800} fontSize={H * 0.034} fill={color}>
              {b}
            </text>
            {step >= 14 + i * 2 ? (
              <text x={X1 + H * 0.022} y={Y(b) + H * 0.045} fontFamily={ROLE.num.font} fontWeight={800} fontSize={H * 0.022} fill={C.ink}>
                {delta}
              </text>
            ) : null}
          </>
        ) : null}
      </g>
    );
  };
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
      {[30, 40, 50].map((v) => (
        <line key={v} x1={w * 0.08} x2={w * 0.96} y1={Y(v)} y2={Y(v)} stroke="rgba(0,0,0,.12)" strokeWidth={2} />
      ))}
      <text x={X0} y={h * 0.98} textAnchor="middle" fontFamily={ROLE.label.font} fontWeight={700} fontSize={H * 0.022} fill={C.ink}>
        9月
      </text>
      <text x={X1} y={h * 0.98} textAnchor="middle" fontFamily={ROLE.label.font} fontWeight={700} fontSize={H * 0.022} fill={C.ink}>
        10月
      </text>
      {line(41.7, 33.3, BLUE, '蔣萬安', '−8.4', 0)}
      {line(40.5, 50.3, GREEN, '沈伯洋', '+9.8', 1)}
    </svg>
  );
};
const S4: React.FC = () => {
  const {f, fps, s} = useShot();
  return (
    <AbsoluteFill>
      <ColorField color={C.pink} dots="bl" seed={4} />
      <VoxCamera frame={f} fps={fps} drift={0.02} keys={[{at: 0, cx: 48, cy: 50, scale: 1.04}, {at: 96, cx: 52, cy: 50, scale: 1.04}]}>
        <HeadlineStrip text="同一機構・一個月" step={s} sizePctH={4.4} x={8} y={7.5} bg={C.ink} fg={C.paper} rot={-3} font={ROLE.strip.font} />
        <PaperCard x={7} y={16} w={86} h={50} rot={-1} step={s - 3}>
          <div style={{position: 'absolute', left: 0, top: '4%'}}>
            <Slope step={s - 3} />
          </div>
        </PaperCard>
        <HeadlineStrip text="蔣萬安" step={s - 12} sizePctH={2.4} x={10} y={18} bg={BLUE} fg={C.paper} rot={-2} font={ROLE.strip.font} />
        <HeadlineStrip text="沈伯洋" step={s - 13} sizePctH={2.4} x={30} y={18} bg={GREEN} fg={C.paper} rot={2} font={ROLE.strip.font} />
        <CutLetters text="黃金交叉" step={s - 22} perChar={1} sizePctH={7} styles={POP} x={9} y={72} seed="x4" />
        <Scraps step={s} appearStep={24} seed="a4" items={[{kind: 'triangle', x: 84, y: 86, size: 5, rot: 14, color: C.yellow}]} />
      </VoxCamera>
      <SourceLine frame={f} at={8} font={ROLE.label.font} text="資料：信民協會 9/16–18（1,076 人）、10/14–16（1,075 人）" />
    </AbsoluteFill>
  );
};

// ⑤ but: TVBS, a week earlier, says the opposite
const S5: React.FC = () => {
  const {f, fps, s} = useShot();
  return (
    <AbsoluteFill>
      <ColorField color={C.yellow} dots="br" seed={5} />
      <VoxCamera frame={f} fps={fps} drift={0.03}>
        <CutLetters text="但是⋯" step={s} perChar={1} sizePctH={7.4} styles={POP} x={8} y={5} seed="b5" />
        <HeadlineStrip text="TVBS 10月初民調" step={s - 5} sizePctH={4} x={10} y={16} bg={C.ink} fg={C.paper} rot={-3} font={ROLE.strip.font} />
        <Bar step={s - 8} name="蔣萬安" pct={49} digits={0} color={BLUE} y={25} />
        <Bar step={s - 12} name="沈伯洋" pct={41} digits={0} color={GREEN} y={39} />
        <HeadlineStrip text="蔣領先 8 個百分點" step={s - 22} sizePctH={2.6} x={44} y={36.4} bg={C.red} fg={C.paper} rot={4} font={ROLE.strip.font} />
        <HeadlineStrip text="未決定 11%" step={s - 18} sizePctH={2.2} x={8} y={54} bg={C.ink} fg={C.paper} rot={0} font={ROLE.label.font} />
        <MethodCard step={s - 26} y={62} h={17} lines={['TVBS 民調中心（自行出資）', '10/3、10/5–7', '有投票意願 1,054 人', '市話隨機抽樣 ・ 誤差 ±2.9']} />
      </VoxCamera>
      <SourceLine frame={f} at={30} font={ROLE.label.font} text="資料：TVBS 民調中心 2026/10" />
    </AbsoluteFill>
  );
};

// ⑥ seven polls since May
const POLLS = [
  {d: 3.5, c: 52.9, sh: 29.7, by: '國策'},
  {d: 22.5, c: 58, sh: 30, by: 'TVBS'},
  {d: 51.5, c: 55.2, sh: 27.5, by: '山水'},
  {d: 97, c: 48.4, sh: 33.0, by: 'TPOC'},
  {d: 139, c: 41.7, sh: 40.5, by: '信民'},
  {d: 157, c: 49, sh: 41, by: 'TVBS'},
  {d: 167, c: 33.3, sh: 50.3, by: '信民'},
]; // d = days since 5/1 (fieldwork midpoint)
const MONTHS = [
  {d: 0, t: '5月'},
  {d: 31, t: '6月'},
  {d: 61, t: '7月'},
  {d: 92, t: '8月'},
  {d: 123, t: '9月'},
  {d: 153, t: '10月'},
  {d: 184, t: '11月'},
];
const Trend: React.FC<{step: number}> = ({step}) => {
  const {H, W} = useShot();
  const w = W * 0.88;
  const h = H * 0.5;
  const X = (d: number) => w * 0.1 + (d / 215) * w * 0.84;
  const Y = (v: number) => h * 0.82 - ((v - 20) / (62 - 20)) * h * 0.74;
  const n = Math.max(0, Math.min(POLLS.length, Math.floor(step / 2) + 1));
  const shown = POLLS.slice(0, n);
  const path = (k: 'c' | 'sh') => shown.map((p, i) => `${i ? 'L' : 'M'}${X(p.d)},${Y(p[k])}`).join(' ');
  const fs = H * 0.019;
  return (
    <svg width={w} height={h} style={{position: 'absolute', left: 0, top: 0}}>
      {[30, 40, 50, 60].map((v) => (
        <g key={v}>
          <line x1={X(0)} x2={X(215)} y1={Y(v)} y2={Y(v)} stroke="rgba(0,0,0,.12)" strokeWidth={2} />
          <text x={X(0) - fs * 0.5} y={Y(v) + fs * 0.35} textAnchor="end" fontFamily={ROLE.num.font} fontWeight={800} fontSize={fs} fill="rgba(0,0,0,.5)">
            {v}
          </text>
        </g>
      ))}
      {MONTHS.map((m) => (
        <text key={m.t} x={X(m.d)} y={h * 0.88} fontFamily={ROLE.label.font} fontWeight={700} fontSize={fs} fill={C.ink}>
          {m.t}
        </text>
      ))}
      <line x1={X(211)} x2={X(211)} y1={Y(62)} y2={h * 0.84} stroke={C.red} strokeWidth={H * 0.003} strokeDasharray={`${H * 0.008} ${H * 0.006}`} />
      <text x={X(211)} y={Y(62) - fs * 0.4} textAnchor="end" fontFamily={ROLE.label.font} fontWeight={700} fontSize={fs} fill={C.red}>
        投票日
      </text>
      <path d={path('c')} fill="none" stroke={BLUE} strokeWidth={H * 0.004} strokeDasharray={`${H * 0.01} ${H * 0.006}`} />
      <path d={path('sh')} fill="none" stroke={GREEN} strokeWidth={H * 0.004} strokeDasharray={`${H * 0.01} ${H * 0.006}`} />
      {shown.map((p, i) => (
        <g key={i}>
          <circle cx={X(p.d)} cy={Y(p.c)} r={H * 0.011} fill={BLUE} stroke={C.paper} strokeWidth={H * 0.0025} />
          <circle cx={X(p.d)} cy={Y(p.sh)} r={H * 0.011} fill={GREEN} stroke={C.paper} strokeWidth={H * 0.0025} />
          <text x={X(p.d)} y={h * (i % 2 ? 0.995 : 0.955)} textAnchor="middle" fontFamily={ROLE.label.font} fontWeight={700} fontSize={fs * 0.8} fill="rgba(0,0,0,.6)">
            {p.by}
          </text>
        </g>
      ))}
    </svg>
  );
};
const S6: React.FC = () => {
  const {f, fps, s} = useShot();
  return (
    <AbsoluteFill>
      <ColorField color={C.rice} dots="tl" seed={6} />
      <VoxCamera frame={f} fps={fps} drift={0.01} keys={[{at: 0, cx: 50, cy: 50, scale: 1.0}, {at: 144, cx: 52, cy: 49, scale: 1.04}]}>
        <HeadlineStrip text="五月以來 7 份民調" step={s} sizePctH={4.4} x={8} y={6.5} bg={C.ink} fg={C.paper} rot={-3} font={ROLE.strip.font} />
        <PaperCard x={5} y={15} w={90} h={54} rot={0.6} step={s - 3}>
          <div style={{position: 'absolute', left: 0, top: '3%'}}>
            <Trend step={s - 6} />
          </div>
        </PaperCard>
        <Annotate frame={f} at={52} dur={10} kind="circle" box={{x: 54, y: 27, w: 22, h: 23}} widthPctH={0.5} color={C.red} seed="c6" />
        <HeadlineStrip text="蔣萬安" step={s - 6} sizePctH={2.6} x={10} y={73} bg={BLUE} fg={C.paper} rot={-2} font={ROLE.strip.font} />
        <HeadlineStrip text="沈伯洋" step={s - 7} sizePctH={2.6} x={32} y={73} bg={GREEN} fg={C.paper} rot={2} font={ROLE.strip.font} />
        <HeadlineStrip text="差距一路縮小，10 月兩份打架" step={s - 34} sizePctH={3} x={8} y={79} bg={C.yellow} fg={C.ink} rot={-2} font={ROLE.strip.font} />
      </VoxCamera>
      <SourceLine frame={f} at={10} font={ROLE.label.font} text="資料：新台灣國策智庫、TVBS、山水民調、TPOC、信民協會（各家方法不同，僅看趨勢）" />
    </AbsoluteFill>
  );
};

// ⑦ why so different
const Reason: React.FC<{step: number; n: string; head: string; sub: string; y: number}> = ({step, n, head, sub, y}) => (
  <>
    <CutLetters text={n} step={step} perChar={1} sizePctH={5} styles={chipSet([[C.yellow, C.ink]], ROLE.num)} x={6} y={y} seed={`r${n}`} />
    <HeadlineStrip text={head} step={step - 1} sizePctH={3.4} x={20} y={y + 0.3} bg={C.paper} fg={C.ink} rot={-1.5} font={ROLE.strip.font} />
    <HeadlineStrip text={sub} step={step - 3} sizePctH={2.2} x={21} y={y + 6.4} bg={C.ink} fg={C.paper} rot={0.5} font={ROLE.label.font} />
  </>
);
const S7: React.FC = () => {
  const {f, fps, s} = useShot();
  return (
    <AbsoluteFill>
      <ColorField color={C.wine} dots="br" seed={7} />
      <VoxCamera frame={f} fps={fps} drift={0.02} keys={[{at: 0, cx: 50, cy: 48, scale: 1.03}, {at: 96, cx: 50, cy: 52, scale: 1.03}]}>
        <CutLetters text="差這麼多？" step={s} perChar={1} sizePctH={7} styles={ON_DARK} x={6} y={7.5} seed="w7" />
        <Reason step={s - 6} n="1" head="抽樣：TVBS 只打市話" sub="信民協會另加約 3 成手機樣本" y={22} />
        <Reason step={s - 12} n="2" head="時間：相隔約一週" sub="TVBS 10/3–7 ・ 信民 10/14–16" y={38} />
        <Reason step={s - 18} n="3" head="委託方：立場受質疑" sub="國民黨議員質疑信民協會的中立性" y={54} />
        <HeadlineStrip text="看民調，先看方法" step={s - 28} sizePctH={5} x={8} y={75} bg={C.yellow} fg={C.ink} rot={-3} font={ROLE.title.font} />
      </VoxCamera>
      <SourceLine frame={f} at={12} onDark font={ROLE.label.font} text="資料：TVBS、信民協會調查說明；聯合報 2026/10/20" />
    </AbsoluteFill>
  );
};

// ⑧ TVBS by district
const GROUP: Record<string, string> = {
  中正區: '中正萬華', 萬華區: '中正萬華', 松山區: '松山信義', 信義區: '松山信義', 大安區: '大安文山', 文山區: '大安文山',
  中山區: '中山大同', 大同區: '中山大同', 士林區: '士林北投', 北投區: '士林北投', 內湖區: '內湖南港', 南港區: '內湖南港',
};
const REGIONS = [
  {g: '中正萬華', c: 59, sh: 32},
  {g: '松山信義', c: 57, sh: 32},
  {g: '大安文山', c: 53, sh: 35},
  {g: '內湖南港', c: 49, sh: 42},
  {g: '士林北投', c: 39, sh: 50},
  {g: '中山大同', c: 35, sh: 54},
]; // sorted by 蔣 lead (TVBS 10/3–7 cross-tab)
const LABEL_NUDGE: Record<string, [number, number]> = {中正萬華: [-0.06, 0.03], 中山大同: [-0.02, -0.03], 松山信義: [0.02, 0.0], 大安文山: [0.0, 0.04], 士林北投: [0, 0], 內湖南港: [0.03, 0]};
const fc = districts as unknown as FeatureCollection<Geometry, {name: string}>;
const DistrictMap: React.FC<{step: number; w: number; h: number}> = ({step, w, h}) => {
  const {H} = useShot();
  const proj = geoMercator().fitExtent([[w * 0.04, h * 0.04], [w * 0.96, h * 0.96]], fc);
  const path = geoPath(proj);
  const order = REGIONS.map((r) => r.g);
  const cent: Record<string, [number, number, number]> = {};
  fc.features.forEach((ft) => {
    const g = GROUP[ft.properties.name];
    const [x, y] = path.centroid(ft);
    const a = path.area(ft);
    const c = cent[g] ?? [0, 0, 0];
    cent[g] = [c[0] + x * a, c[1] + y * a, c[2] + a];
  });
  return (
    <div style={{position: 'absolute', inset: 0}}>
      <svg width={w} height={h} style={{position: 'absolute', inset: 0, overflow: 'visible', filter: `url(#stickerTorn) drop-shadow(0 ${H * 0.007}px ${H * 0.008}px rgba(0,0,0,.4))`}}>
        <defs>
          <pattern id="dotsMap" width={H * 0.0075} height={H * 0.0075} patternUnits="userSpaceOnUse">
            <circle cx={H * 0.00375} cy={H * 0.00375} r={H * 0.0012} fill="rgba(0,0,0,.25)" />
          </pattern>
        </defs>
        {fc.features.map((ft) => {
          const g = GROUP[ft.properties.name];
          const r = REGIONS.find((x) => x.g === g)!;
          const k = step - order.indexOf(g) * 2;
          const lead = r.c > r.sh ? BLUE : GREEN;
          const margin = Math.abs(r.c - r.sh);
          const fill = k < 0 ? '#D8D0BC' : lead;
          const d = path(ft) ?? '';
          return (
            <g key={ft.properties.name} style={{transformBox: 'fill-box', transformOrigin: 'center', transform: k >= 0 ? `scale(${SLAP[Math.min(k, 3)]})` : undefined}}>
              <path d={d} fill={fill} opacity={k < 0 ? 1 : margin < 10 ? 0.62 : 1} stroke={C.paper} strokeWidth={H * 0.0025} />
              {k >= 0 ? <path d={d} fill="url(#dotsMap)" /> : null}
            </g>
          );
        })}
      </svg>
      {REGIONS.map((r, i) => {
        const c = cent[r.g];
        if (!c || step - i * 2 < 1) return null;
        const [nx, ny] = LABEL_NUDGE[r.g];
        return (
          <div key={r.g} style={{position: 'absolute', left: c[0] / c[2] + nx * w, top: c[1] / c[2] + ny * h, transform: 'translate(-50%,-50%) rotate(-2deg)', padding: `${H * 0.003}px ${H * 0.008}px`, background: C.paper, fontFamily: ROLE.label.font, fontWeight: 900, fontSize: H * 0.017, color: C.ink, whiteSpace: 'nowrap', boxShadow: `0 ${H * 0.003}px ${H * 0.004}px rgba(0,0,0,.35)`}}>
            {r.g}
          </div>
        );
      })}
    </div>
  );
};
const S8: React.FC = () => {
  const {f, fps, s, W, H} = useShot();
  return (
    <AbsoluteFill>
      <ColorField color={CREAM} dots="tr" seed={8} />
      <VoxCamera frame={f} fps={fps} drift={0.01} keys={[{at: 0, cx: 50, cy: 44, scale: 1.06}, {at: 144, cx: 50, cy: 52, scale: 1.0}]}>
        <HeadlineStrip text="TVBS 分區：誰領先？" step={s} sizePctH={4} x={8} y={6} bg={C.ink} fg={C.paper} rot={-3} font={ROLE.strip.font} />
        <div style={{position: 'absolute', left: W * 0.1, top: H * 0.12, width: W * 0.8, height: H * 0.4}}>{s >= 3 ? <DistrictMap step={s - 3} w={W * 0.8} h={H * 0.4} /> : null}</div>
        {REGIONS.map((r, i) => {
          const k = s - 20 - i * 2;
          const y = 55 + i * 5.4;
          return (
            <React.Fragment key={r.g}>
              <HeadlineStrip text={r.g} step={k} sizePctH={2.4} x={6} y={y} bg={C.ink} fg={C.paper} rot={0} font={ROLE.strip.font} />
              <SplitBar step={k} x={30} y={y + 0.2} w={64} h={3.8} segs={[{label: `蔣 ${r.c}`, pct: r.c, color: BLUE}, {label: '', pct: 100 - r.c - r.sh, color: GREY}, {label: `沈 ${r.sh}`, pct: r.sh, color: GREEN}]} />
            </React.Fragment>
          );
        })}
      </VoxCamera>
      <SourceLine frame={f} at={10} font={ROLE.label.font} text="資料：TVBS 2026/10 分區交叉（樣本小、誤差大）；區界：內政部國土測繪中心" />
    </AbsoluteFill>
  );
};

// ⑨ the swing voters
const S9: React.FC = () => {
  const {f, fps, s} = useShot();
  return (
    <AbsoluteFill>
      <ColorField color={C.pink} dots="tl" seed={9} />
      <VoxCamera frame={f} fps={fps} drift={0.03}>
        <CutLetters text="關鍵少數" step={s} perChar={1} sizePctH={7} styles={POP} x={8} y={5} seed="k9" />
        <NumChip step={s - 5} value={24} digits={0} x={8} y={17} size={12} bg={C.yellow} fg={C.ink} />
        <HeadlineStrip text="中立選民還沒決定" step={s - 9} sizePctH={3.4} x={10} y={31} bg={C.ink} fg={C.paper} rot={-2} font={ROLE.strip.font} />
        <HeadlineStrip text="上屆投黃珊珊的選民" step={s - 14} sizePctH={2.8} x={8} y={42} bg={C.paper} fg={C.ink} rot={-1} font={ROLE.strip.font} />
        <SplitBar step={s - 16} x={8} y={48} w={84} h={5} segs={[{label: '蔣 39', pct: 39, color: BLUE}, {label: '', pct: 8, color: GREY}, {label: '沈 53', pct: 53, color: GREEN}]} />
        <HeadlineStrip text="20–29 歲" step={s - 22} sizePctH={2.8} x={8} y={58} bg={C.paper} fg={C.ink} rot={1} font={ROLE.strip.font} />
        <SplitBar step={s - 24} x={8} y={64} w={84} h={5} segs={[{label: '蔣 44', pct: 44, color: BLUE}, {label: '', pct: 4, color: GREY}, {label: '沈 52', pct: 52, color: GREEN}]} />
        <HeadlineStrip text="中立選民：蔣 40 ・ 沈 36" step={s - 30} sizePctH={2.6} x={8} y={75} bg={C.ink} fg={C.paper} rot={-2} font={ROLE.strip.font} />
      </VoxCamera>
      <SourceLine frame={f} at={10} font={ROLE.label.font} text="資料：TVBS 民調中心 2026/10（10/3、10/5–7）" />
    </AbsoluteFill>
  );
};

// ⑩ report cards (both candidates)
const S10: React.FC = () => {
  const {f, fps, s, W} = useShot();
  return (
    <AbsoluteFill>
      <ColorField color={C.yellow} dots="bl" seed={10} />
      <VoxCamera frame={f} fps={fps} drift={0.02} keys={[{at: 0, cx: 50, cy: 48, scale: 1.03}, {at: 96, cx: 50, cy: 52, scale: 1.03}]}>
        <HeadlineStrip text="兩人的成績單" step={s} sizePctH={4.4} x={8} y={6.5} bg={C.ink} fg={C.paper} rot={-3} font={ROLE.strip.font} />
        <PrintCutout src={img('chiang')} aspect={ASPECT.chiang} widthPx={W * 0.3} x={66} y={13} rot={3} step={s - 2} enter="slap" paperColor="#EEF1F6" />
        <HeadlineStrip text="蔣萬安施政滿意度" step={s - 4} sizePctH={2.8} x={7} y={15} bg={BLUE} fg={C.paper} rot={-1} font={ROLE.strip.font} />
        <NumChip step={s - 6} value={52} digits={0} x={7} y={20} size={9} bg={C.paper} fg={C.ink} />
        <HeadlineStrip text="5 月 59% → 10 月 52%" step={s - 12} sizePctH={2.2} x={8} y={31} bg={C.ink} fg={C.paper} rot={1} font={ROLE.label.font} />
        <HeadlineStrip text="營養午餐事件處理" step={s - 14} sizePctH={2.4} x={7} y={37} bg={C.paper} fg={C.ink} rot={0} font={ROLE.strip.font} />
        <SplitBar step={s - 16} x={7} y={42} w={86} h={4.2} segs={[{label: '滿意 32', pct: 32, color: C.ink}, {label: '沒意見 29', pct: 29, color: GREY}, {label: '不滿意 39', pct: 39, color: C.red}]} />
        <PrintCutout src={img('shen')} aspect={ASPECT.shen} widthPx={W * 0.3} x={66} y={53} rot={-3} step={s - 22} enter="slap" paperColor="#EEF6F0" />
        <HeadlineStrip text="對沈伯洋規劃市政" step={s - 24} sizePctH={2.8} x={7} y={56} bg={GREEN} fg={C.paper} rot={1} font={ROLE.strip.font} />
        <NumChip step={s - 26} value={40} digits={0} x={7} y={61} size={9} bg={C.paper} fg={C.ink} />
        <HeadlineStrip text="有信心" step={s - 30} sizePctH={2.6} x={46} y={65} bg={C.ink} fg={C.paper} rot={-2} font={ROLE.strip.font} />
        <SplitBar step={s - 32} x={7} y={74} w={86} h={4.2} segs={[{label: '有信心 40', pct: 40, color: C.ink}, {label: '沒意見 23', pct: 23, color: GREY}, {label: '沒信心 38', pct: 38, color: C.red}]} />
      </VoxCamera>
      <SourceLine frame={f} at={10} font={ROLE.label.font} text="資料：TVBS 民調中心 2026/10" />
    </AbsoluteFill>
  );
};

// ⑪ payoff: 39 days, then the blackout
const S11: React.FC = () => {
  const {f, fps, s, W} = useShot();
  const stamp = f < 50 ? 0 : table(STAMP, f - 50);
  return (
    <AbsoluteFill>
      <ColorField color={C.ink} dots="br" seed={11} />
      <VoxCamera frame={f} fps={fps} drift={0.008}>
        <HeadlineStrip text="距離投票" step={s} sizePctH={4.6} x={9} y={11} bg={C.yellow} fg={C.ink} rot={-3} font={ROLE.strip.font} />
        <CutLetters text="39天" step={s - 3} perChar={2} sizePctH={15} styles={ON_DARK} x={8} y={19} seed="d11" />
        <HeadlineStrip text="11/18 起 禁止發布民調" step={s - 12} sizePctH={3.4} x={10} y={44} bg={C.red} fg={C.paper} rot={2} font={ROLE.strip.font} />
        <HeadlineStrip text="11.28 開票見真章" step={s - 18} sizePctH={5.4} x={7} y={58} bg={C.paper} fg={C.ink} rot={-2} font={ROLE.title.font} />
        <PaperCard x={62} y={68} w={30} h={17} rot={4} step={s - 22}>
          {/* 圈選章 (File:Vote1.svg, public domain) stamped on blank ballot paper: no candidate, no winner implied */}
          <Img src={staticFile('evidence/taipei/vote1.svg')} style={{position: 'absolute', left: '50%', top: '50%', width: W * 0.22, height: W * 0.22, marginLeft: -W * 0.11, marginTop: -W * 0.11, transform: `rotate(-8deg) scale(${stamp})`, opacity: stamp ? 0.9 : 0, filter: 'url(#inkBleed)'}} />
        </PaperCard>
        {s >= 18 ? <Tape x={12} y={56.5} w={12} h={1.6} rot={-24} color="rgba(236,226,196,.9)" seed={11} /> : null}
      </VoxCamera>
      <SourceLine frame={f} at={12} onDark font={ROLE.label.font} text="投票日 2026/11/28；依選罷法，投票日前 10 日起不得發布民調" />
    </AbsoluteFill>
  );
};

const SHOTS: Array<{C: React.FC; d: number}> = [
  {C: S1, d: 96},
  {C: S2, d: 96},
  {C: S3, d: 96},
  {C: S4, d: 96},
  {C: S5, d: 96},
  {C: S6, d: 144},
  {C: S7, d: 96},
  {C: S8, d: 144},
  {C: S9, d: 96},
  {C: S10, d: 96},
  {C: S11, d: 96},
];
const START = SHOTS.reduce<number[]>((a, sh, i) => [...a, i ? a[i - 1] + SHOTS[i - 1].d : 0], []);
const at = (shot: number, local: number) => START[shot] + local;
// cues land on the drawing frame where the motion changes (local frame = 2 × step)
const CUES: Array<{at: number; event: SfxEvent; db?: number}> = [
  {at: at(0, 0), event: 'slam', db: -10},
  ...[1, 2, 3].map((k) => ({at: at(0, k * 2), event: 'poseJump' as const, db: -17})),
  {at: at(0, 12), event: 'slam', db: -14},
  {at: at(0, 22), event: 'slide', db: -13},
  {at: at(0, 28), event: 'printLand', db: -14},
  {at: at(0, 34), event: 'popIn', db: -14},
  {at: at(1, 0), event: 'printLand', db: -14},
  {at: at(1, 28), event: 'printLand', db: -14},
  {at: at(1, 60), event: 'highlight', db: -18},
  {at: at(2, 0), event: 'titleHit', db: -10},
  {at: at(2, 16), event: 'slide', db: -14},
  {at: at(2, 24), event: 'slide', db: -14},
  {at: at(2, 44), event: 'slam', db: -12},
  {at: at(2, 52), event: 'pageTurn', db: -16},
  {at: at(3, 0), event: 'slam', db: -14},
  {at: at(3, 6), event: 'pageTurn', db: -16},
  {at: at(3, 14), event: 'scribble', db: -18},
  {at: at(3, 44), event: 'slam', db: -10},
  {at: at(4, 0), event: 'whip', db: -12},
  {at: at(4, 16), event: 'slide', db: -14},
  {at: at(4, 24), event: 'slide', db: -14},
  {at: at(4, 44), event: 'slam', db: -12},
  {at: at(4, 52), event: 'pageTurn', db: -16},
  {at: at(5, 0), event: 'slam', db: -14},
  {at: at(5, 6), event: 'pageTurn', db: -16},
  ...[0, 1, 2, 3, 4, 5, 6].map((k) => ({at: at(5, 12 + k * 4), event: 'poseJump' as const, db: -16})),
  {at: at(5, 52), event: 'scribble', db: -16},
  {at: at(5, 68), event: 'highlight', db: -18},
  {at: at(6, 0), event: 'slam', db: -12},
  {at: at(6, 12), event: 'popIn', db: -14},
  {at: at(6, 24), event: 'popIn', db: -14},
  {at: at(6, 36), event: 'popIn', db: -14},
  {at: at(6, 56), event: 'titleHit', db: -12},
  {at: at(7, 0), event: 'slam', db: -14},
  {at: at(7, 6), event: 'mapFly', db: -16},
  ...[0, 1, 2, 3, 4, 5].map((k) => ({at: at(7, 6 + k * 4), event: 'shapePop' as const, db: -15})),
  ...[0, 1, 2, 3, 4, 5].map((k) => ({at: at(7, 40 + k * 4), event: 'slide' as const, db: -18})),
  {at: at(8, 0), event: 'slam', db: -12},
  {at: at(8, 10), event: 'burst', db: -14},
  {at: at(8, 32), event: 'slide', db: -15},
  {at: at(8, 48), event: 'slide', db: -15},
  {at: at(9, 0), event: 'slam', db: -14},
  {at: at(9, 4), event: 'printLand', db: -15},
  {at: at(9, 12), event: 'popIn', db: -14},
  {at: at(9, 44), event: 'printLand', db: -15},
  {at: at(9, 52), event: 'popIn', db: -14},
  {at: at(10, 0), event: 'titleHit', db: -10},
  {at: at(10, 6), event: 'slam', db: -10},
  {at: at(10, 10), event: 'slam', db: -12},
  {at: at(10, 24), event: 'slam', db: -13},
  {at: at(10, 36), event: 'slide', db: -14},
  {at: at(10, 44), event: 'slide', db: -15},
  {at: at(10, 50), event: 'seal', db: -8},
];

export const TaipeiPoll2026: React.FC = () => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: '#141414'}}>
      <CollageFilters scale={height / 1080} seed={5} />
      <Bgm src="audio/bgm/taipei_poll.wav" levelDb={-5} fadeIn={2} fadeOut={24} />
      <SfxTrack cues={CUES} />
      {SHOTS.map(({C: Shot, d}, i) => (
        <Sequence key={i} from={START[i]} durationInFrames={d}>
          <Shot />
        </Sequence>
      ))}
      <FilmLook frame={frame} grain={0.08} vignette={0.28} />
    </AbsoluteFill>
  );
};
export const TAIPEI_POLL_DURATION = SHOTS.reduce((a, b) => a + b.d, 0);
