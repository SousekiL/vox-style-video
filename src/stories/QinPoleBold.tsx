// 立木为信 — bold Vox look (v2). Measured from real Vox frames (13-vox-editorial §9): dark stage, film grain,
// oversized cropped type, colour label boxes, red caption tags, hand-drawn annotations, dark relief map,
// a cut every 1.5–3 s on the beat. Evidence is real (CC0 Qin slips, Natural Earth, Shiji text).
import React from 'react';
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig, interpolate} from 'remotion';
import {
  Annotate,
  BarCaption,
  Bgm,
  BrushBar,
  CollageFilters,
  DarkReliefMap,
  DarkStage,
  DocumentPage,
  FilmLook,
  GiantLabel,
  LabelBox,
  Mark,
  STAMP,
  Seal,
  SfxTrack,
  SourceLine,
  VOX_DARK,
  VOX_FONT,
  VoxCamera,
  YearBox,
  loadLocalFont,
  table,
  type SfxEvent,
} from '../collage';

const FANGSONG = loadLocalFont('Zhuque Fangsong', 'fonts/zhuque-qin.woff');
// shot boundaries (frames @24); every cut is a multiple of 12 = a beat of the 120 bpm bed
const S = [0, 48, 96, 168, 216, 252, 288];
const len = (i: number) => S[i + 1] - S[i];
const SANS = VOX_FONT.cjkSans;
const SERIF = VOX_FONT.cjkSerif;

// ---------- S1 cold open: full-bleed evidence, giant cropped words ----------
const Shot1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const kb = interpolate(f, [0, len(0)], [1.12, 1.2]);
  return (
    <AbsoluteFill>
      <DarkStage color={VOX_DARK.black} />
      <AbsoluteFill style={{overflow: 'hidden'}}>
        <Img
          src={staticFile('evidence/qin/qin_slips.jpg')}
          style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1) contrast(1.25) brightness(.62)', transform: `scale(${kb}) rotate(-2deg)`}}
        />
      </AbsoluteFill>
      <VoxCamera frame={f} fps={fps} drift={0.02}>
        <GiantLabel frame={f} text="一根木头" font={SANS} sizePctH={30} x={34} y={30} drift={-3} at={2} />
        <div style={{position: 'absolute', left: '36%', top: '64%', fontFamily: SANS, fontWeight: 700, fontSize: height * 0.05, color: VOX_DARK.white, opacity: interpolate(f, [12, 17], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
          能让一国人
          <Mark frame={f} start={20} dur={9}>
            <span style={{color: '#141414'}}>相信</span>
          </Mark>
          法律？
        </div>
      </VoxCamera>
      <LabelBox frame={f} at={4} text="秦律竹简 · 湖北云梦睡虎地出土" font={SANS} sizePctH={2.3} style={{left: '4%', top: '6%'}} />
      <SourceLine frame={f} at={6} onDark font={SANS} text="图：睡虎地秦简《秦律十八种》，Gary Todd 摄，CC0" />
    </AbsoluteFill>
  );
};

// ---------- S2 title card: dark grid, giant title, neon brush bar, red-bar caption ----------
const Shot2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const pop = interpolate(f, [0, 6], [1.08, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <DarkStage grid color={VOX_DARK.grid} />
      <VoxCamera frame={f} fps={fps} drift={0.015}>
        <AbsoluteFill style={{display: 'grid', placeItems: 'center'}}>
          <div style={{position: 'relative', transform: `scale(${pop})`}}>
            <div style={{fontFamily: SANS, fontWeight: 700, fontSize: height * 0.026, letterSpacing: '0.4em', color: VOX_DARK.neon, textAlign: 'center', marginBottom: height * 0.02}}>
              战国 · 秦 · 商鞅变法
            </div>
            <div style={{position: 'relative', fontFamily: SERIF, fontWeight: 900, fontSize: height * 0.2, color: VOX_DARK.white, lineHeight: 1, letterSpacing: '0.04em'}}>
              <span style={{position: 'relative'}}>立木为</span>
              <span style={{position: 'relative', display: 'inline-block'}}>
                <BrushBar frame={f} at={6} dur={8} style={{left: '-12%', top: '8%', width: '124%', height: '90%'}} />
                <span style={{position: 'relative', color: f >= 10 ? '#141414' : VOX_DARK.white}}>信</span>
              </span>
            </div>
          </div>
        </AbsoluteFill>
      </VoxCamera>
      <BarCaption frame={f} at={10} year="公元前4世纪" title="秦国推行新法之前" font={SANS} style={{left: '5%', top: '76%'}} />
    </AbsoluteFill>
  );
};

// ---------- S3 where: dark relief map, giant cropped 秦, schematic focus disc ----------
const Shot3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  return (
    <AbsoluteFill>
      <DarkReliefMap
        frame={f}
        fps={fps}
        keys={[
          {at: 0, lon: 110, lat: 36, scale: 1.25},
          {at: 40, lon: 109.6, lat: 35.2, scale: 2.5},
        ]}
        drift={0.012}
        focus={{lon: 108.9, lat: 34.6, radiusPctH: 5.5, color: '#5FBF7A', at: 22}}
      >
        {(screen) => {
          const [x, y] = screen(109.22, 34.66);
          const [rx, ry] = screen(111.6, 38.2);
          return (
            <>
              <div style={{position: 'absolute', left: `${x}%`, top: `${y}%`, width: height * 0.014, height: height * 0.014, marginLeft: -height * 0.007, marginTop: -height * 0.007, borderRadius: '50%', background: VOX_DARK.white, opacity: f >= 26 ? 1 : 0}} />
              <LabelBox frame={f} at={28} text="栎阳 · 秦国都城" bg={VOX_DARK.white} color="#141414" font={SANS} sizePctH={2.8} style={{left: `calc(${x}% + ${height * 0.02}px)`, top: `calc(${y}% - ${height * 0.07}px)`}} />
              <div style={{position: 'absolute', left: `${rx}%`, top: `${ry}%`, fontFamily: SANS, fontWeight: 700, fontSize: height * 0.026, letterSpacing: '0.2em', color: VOX_DARK.river, opacity: interpolate(f, [18, 24], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
                黄河
              </div>
            </>
          );
        }}
      </DarkReliefMap>
      <GiantLabel frame={f} text="秦" font={SERIF} sizePctH={78} x={-9} y={8} drift={0.8} color="rgba(242,242,242,.88)" at={4} />
      <YearBox frame={f} at={8} text="约前4世纪" font={SANS} style={{right: '5%', top: '7%'}} />
      <LabelBox frame={f} at={34} text="示意范围" bg="rgba(127,176,140,.9)" color="#0b0e11" font={SANS} sizePctH={2} style={{right: '5%', top: '17%'}} />
      <SourceLine frame={f} at={6} onDark font={SANS} text="底图：Natural Earth（地形为示意，不示国界）" />
    </AbsoluteFill>
  );
};

// ---------- S4 the source: cut-out page on dark, push, highlight ----------
const COLS = ['立三丈之木于国都市南门', '募民有能徙置北门者予十金', '民怪之，莫敢徙', '复曰：能徙者|予五十金', '有一人徙之，辄予五十金', '以明不欺'];
const COL_X = [61, 56, 51, 46, 41, 36];
const FOCUS = 3;
const Shot4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  return (
    <AbsoluteFill>
      <DarkStage grid color={VOX_DARK.stage} />
      <VoxCamera
        frame={f}
        fps={fps}
        drift={0.01}
        keys={[
          {at: 0, cx: 50, cy: 50, scale: 1.05},
          {at: 22, cx: 47.5, cy: 50, scale: 1.7},
        ]}
      >
        <AbsoluteFill style={{transform: 'rotate(-2.5deg)'}}>
          <DocumentPage frame={f} dimAt={20} focus={{x: 39, y: 34, w: 15, h: 62}} width={width * 0.4} height={height * 0.84} style={{left: '30%', top: '8%', boxShadow: `0 ${height * 0.02}px ${height * 0.06}px rgba(0,0,0,.7)`}}>
            <></>
          </DocumentPage>
          {COLS.map((c, i) => (
            <div key={i} style={{position: 'absolute', left: `${COL_X[i]}%`, top: '16%', writingMode: 'vertical-rl', fontFamily: FANGSONG, fontSize: height * 0.042, letterSpacing: '0.1em', color: '#141414', opacity: f >= 20 && i !== FOCUS ? 0.3 : 1}}>
              {c.includes('|') ? (
                <>
                  {c.split('|')[0]}
                  <Mark frame={f} start={18} dur={10} vertical>
                    {c.split('|')[1]}
                  </Mark>
                </>
              ) : (
                c
              )}
            </div>
          ))}
        </AbsoluteFill>
      </VoxCamera>
      <LabelBox frame={f} at={2} text="《史记·商君列传》" font={SANS} sizePctH={2.6} style={{left: '4%', top: '6%'}} />
      <SourceLine frame={f} at={4} onDark font={SANS} text="来源：司马迁《史记·商君列传》" />
    </AbsoluteFill>
  );
};

// ---------- S5 the number: 十金 struck out → 五十金 slams in a neon box ----------
const Shot5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const slam = f < 14 ? 0 : interpolate(f, [14, 18], [1.25, 1], {extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill>
      <DarkStage grid color={VOX_DARK.grid} />
      <VoxCamera frame={f} fps={fps} drift={0.02}>
        <div style={{position: 'absolute', left: '8%', top: '20%', fontFamily: SANS, fontWeight: 900, fontSize: height * 0.2, color: 'rgba(242,242,242,.55)', lineHeight: 1}}>十金</div>
        <Annotate frame={f} at={5} dur={6} kind="strike" box={{x: 7, y: 21, w: 26, h: 18}} widthPctH={1.1} seed="s5" />
        {f >= 14 ? (
          <div style={{position: 'absolute', left: '36%', top: '36%', transform: `scale(${slam})`, transformOrigin: '30% 50%'}}>
            <div style={{position: 'relative', display: 'inline-block', padding: `0 ${height * 0.03}px`}}>
              <div style={{position: 'absolute', inset: 0, background: VOX_DARK.neon, filter: 'url(#markerEdge)'}} />
              <div style={{position: 'relative', fontFamily: SANS, fontWeight: 900, fontSize: height * 0.3, color: '#0b0e11', lineHeight: 1.05}}>五十金</div>
            </div>
          </div>
        ) : null}
        <div style={{position: 'absolute', left: '36%', top: '78%', fontFamily: SANS, fontWeight: 700, fontSize: height * 0.032, letterSpacing: '0.3em', color: VOX_DARK.white, opacity: f >= 20 ? 1 : 0}}>赏金 ×5</div>
      </VoxCamera>
      <SourceLine frame={f} at={0} onDark font={SANS} text="据《史记·商君列传》" />
    </AbsoluteFill>
  );
};

// ---------- S6 the point: giant line, red circle, seal ----------
const Shot6: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const sealScale = f < 16 ? 0 : table(STAMP, f - 16);
  return (
    <AbsoluteFill>
      <DarkStage color={VOX_DARK.black} />
      <VoxCamera frame={f} fps={fps} drift={0.02}>
        <div style={{position: 'absolute', left: '14%', top: '30%', fontFamily: SERIF, fontWeight: 900, fontSize: height * 0.2, color: VOX_DARK.white, lineHeight: 1, letterSpacing: '0.04em'}}>
          以明不欺
        </div>
        <Annotate frame={f} at={6} dur={9} kind="circle" box={{x: 36, y: 29.5, w: 24, h: 21}} widthPctH={0.8} seed="s6" />
        <Seal text="信" sizePx={height * 0.16} scale={sealScale} font={SERIF} style={{left: '70%', top: '58%'}} />
        <div style={{position: 'absolute', left: '14%', top: '62%', fontFamily: SANS, fontWeight: 500, fontSize: height * 0.034, letterSpacing: '0.12em', color: 'rgba(242,242,242,.8)', opacity: f >= 10 ? 1 : 0}}>
          新法，自此推行
        </div>
      </VoxCamera>
    </AbsoluteFill>
  );
};

const CUES: Array<{at: number; event: SfxEvent; db?: number}> = [
  {at: 0, event: 'titleHit', db: -14},
  {at: 4, event: 'printLand'},
  {at: 20, event: 'highlight'},
  {at: S[1], event: 'titleHit'},
  {at: S[1] + 6, event: 'highlight', db: -18},
  {at: S[2], event: 'mapFly', db: -16},
  {at: S[2] + 28, event: 'poseJump', db: -20},
  {at: S[3], event: 'pageTurn', db: -15},
  {at: S[3] + 18, event: 'highlight'},
  {at: S[4], event: 'slam', db: -14},
  {at: S[4] + 5, event: 'scribble', db: -16},
  {at: S[4] + 14, event: 'slam', db: -9},
  {at: S[5] + 6, event: 'scribble', db: -18},
  {at: S[5] + 16, event: 'seal', db: -9},
];

const SHOTS = [Shot1, Shot2, Shot3, Shot4, Shot5, Shot6];

export const QinPoleBold: React.FC = () => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: VOX_DARK.black}}>
      <CollageFilters scale={height / 1080} seed={2} />
      <Bgm src="audio/bgm/qin_dynasty.wav" levelDb={-4} fadeIn={2} fadeOut={24} />
      <SfxTrack cues={CUES} />
      {SHOTS.map((Shot, i) => (
        <Sequence key={i} from={S[i]} durationInFrames={len(i)}>
          <Shot />
        </Sequence>
      ))}
      <FilmLook frame={frame} grain={0.1} vignette={0.6} />
    </AbsoluteFill>
  );
};

export const QIN_BOLD_DURATION = S[S.length - 1];
