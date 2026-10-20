// 商鞅立木为信: a 12 s Vox-style editorial story (24 fps, 288 frames) built only from real evidence:
// a Qin bamboo-slip law photo (CC0), a land-only Natural Earth map, and the Shiji text typeset by us.
// No generated "archival" images (09-assets.md / 13-vox-editorial.md). Cuts land on beats of the 120 bpm bed.
import React from 'react';
import {AbsoluteFill, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  ArchivalPrint,
  Bgm,
  CollageFilters,
  DocumentPage,
  FlatPaper,
  Grain,
  LandMap,
  LineReveal,
  Mark,
  STAMP,
  Seal,
  SfxTrack,
  SourceLine,
  VOX,
  VOX_FONT,
  VoxCamera,
  loadLocalFont,
  table,
  type SfxEvent,
} from '../collage';

const FANGSONG = loadLocalFont('Zhuque Fangsong', 'fonts/zhuque-qin.woff');
const B = 72; // board length: 3 s at 24 fps, cuts on beats (120 bpm → a beat every 12 frames)

const Paper: React.FC<{frame: number}> = ({frame}) => (
  <>
    <AbsoluteFill style={{background: VOX.page}} />
    <FlatPaper color={VOX.page} mottle={0.05} seed={4} />
    <Grain seed={Math.floor(frame / 10)} opacity={0.05} />
  </>
);

// ---------- B1 cold open: the evidence + the question ----------
const Board1: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  return (
    <AbsoluteFill>
      <Paper frame={frame} />
      <VoxCamera frame={frame} fps={fps} drift={0.01}>
        <ArchivalPrint
          src={staticFile('evidence/qin/qin_slips.jpg')}
          frame={frame}
          dur={B}
          width={width * 0.5}
          rot={-1.2}
          kenBurns={[1, 1.05]}
          origin="40% 45%"
          style={{left: '5%', top: '15%'}}
        />
        <div style={{position: 'absolute', left: '62%', top: '30%', width: '34%'}}>
          <div style={{fontFamily: VOX_FONT.cjkSans, fontSize: height * 0.022, letterSpacing: '0.12em', color: 'rgba(20,20,20,.7)', marginBottom: height * 0.025}}>
            战国 · 秦孝公时期
          </div>
          <LineReveal frame={frame} inAt={6}>
            <div style={{fontFamily: VOX_FONT.cjkSans, fontWeight: 700, fontSize: height * 0.054, lineHeight: 1.35, color: VOX.ink}}>
              一根木头，
              <br />
              怎么让百姓
              <Mark frame={frame} start={28} dur={12}>
                相信
              </Mark>
              新法？
            </div>
          </LineReveal>
        </div>
      </VoxCamera>
      <SourceLine frame={frame} at={4} font={VOX_FONT.cjkSans} text="图：睡虎地秦简《秦律十八种》（局部），Gary Todd 摄，CC0" />
    </AbsoluteFill>
  );
};

// ---------- B2 where: map fly-to (land only, no borders) ----------
const Board2: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  return (
    <AbsoluteFill>
      <LandMap
        frame={frame}
        fps={fps}
        keys={[
          {at: 0, lon: 108, lat: 35, scale: 1.05},
          {at: 44, lon: 110.5, lat: 35.2, scale: 1.9},
        ]}
        rivers
        points={[
          {lon: 109.22, lat: 34.66, label: '栎阳', sub: '秦国都城 · 今西安市阎良区'},
          {lon: 111.4, lat: 38.6, label: '黄河', size: 0, dx: 0, dy: -0.6},
        ]}
        pointsAt={38}
        labelFont={VOX_FONT.cjkSans}
      />
      <FlatPaper color="#FFFFFF" mottle={0.08} seed={9} style={{mixBlendMode: 'multiply', opacity: 0.6}} />
      <Grain seed={Math.floor(frame / 10)} opacity={0.05} />
      <div style={{position: 'absolute', left: '4%', top: '6%', fontFamily: VOX_FONT.cjkSans, fontSize: height * 0.022, letterSpacing: '0.12em', color: 'rgba(20,20,20,.75)'}}>
        秦国 · 公元前4世纪
      </div>
      <SourceLine frame={frame} at={4} font={VOX_FONT.cjkSans} text="底图：Natural Earth（仅示陆地，不示国界）" />
    </AbsoluteFill>
  );
};

// ---------- B3 the source: Shiji passage, push in, dim, highlight ----------
const COLS = ['立三丈之木于国都市南门', '募民有能徙置北门者予十金', '民怪之，莫敢徙', '复曰：能徙者|予五十金', '有一人徙之，辄予五十金', '以明不欺'];
// column x positions (% of frame), right to left as in vertical writing; '|' marks where the highlight starts
const COL_X = [62, 56.5, 51, 45.5, 40, 34.5];
const FOCUS = 3;

const Board3: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const fs = height * 0.042;
  return (
    <AbsoluteFill>
      <Paper frame={frame} />
      <VoxCamera
        frame={frame}
        fps={fps}
        drift={0.006}
        keys={[
          {at: 0, cx: 50, cy: 50, scale: 1},
          {at: 6, cx: 50, cy: 50, scale: 1},
          {at: 34, cx: 47, cy: 48, scale: 1.45},
        ]}
      >
        <DocumentPage
          frame={frame}
          dimAt={30}
          focus={{x: 34, y: 36, w: 16, h: 60}}
          width={width * 0.42}
          height={height * 0.8}
          style={{left: '29%', top: '10%'}}
        >
          <></>
        </DocumentPage>
        {COLS.map((c, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${COL_X[i]}%`,
              top: '18%',
              writingMode: 'vertical-rl',
              fontFamily: FANGSONG,
              fontSize: fs,
              letterSpacing: '0.1em',
              color: VOX.ink,
              opacity: frame >= 30 && i !== FOCUS ? 0.38 : 1,
            }}
          >
            {c.includes('|') ? (
              <>
                {c.split('|')[0]}
                <Mark frame={frame} start={36} dur={12} vertical>
                  {c.split('|')[1]}
                </Mark>
              </>
            ) : (
              c
            )}
          </div>
        ))}
      </VoxCamera>
      <SourceLine frame={frame} at={4} font={VOX_FONT.cjkSans} text="来源：司马迁《史记·商君列传》" />
    </AbsoluteFill>
  );
};

// ---------- B4 title card + seal ----------
const Board4: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const sealScale = frame < 18 ? 0 : table(STAMP, frame - 18);
  return (
    <AbsoluteFill>
      <Paper frame={frame} />
      <VoxCamera frame={frame} fps={fps} drift={0.008}>
        <AbsoluteFill style={{display: 'grid', placeItems: 'center'}}>
          <div style={{textAlign: 'center', position: 'relative'}}>
            <div style={{fontFamily: VOX_FONT.cjkSans, fontSize: height * 0.024, letterSpacing: '0.16em', color: 'rgba(20,20,20,.7)', marginBottom: height * 0.03}}>
              秦 · 商鞅变法
            </div>
            <div style={{fontFamily: VOX_FONT.cjkSerif, fontWeight: 900, fontSize: height * 0.12, letterSpacing: '0.06em', color: VOX.ink, lineHeight: 1.1}}>
              立木为
              <Mark frame={frame} start={8} dur={10}>
                信
              </Mark>
            </div>
            <LineReveal frame={frame} inAt={24}>
              <div style={{fontFamily: VOX_FONT.cjkSans, fontWeight: 500, fontSize: height * 0.03, letterSpacing: '0.1em', color: VOX.ink, marginTop: height * 0.035}}>
                以明不欺，新法自此推行
              </div>
            </LineReveal>
            <Seal text="秦" sizePx={height * 0.075} scale={sealScale} font={VOX_FONT.cjkSerif} style={{right: -height * 0.11, top: height * 0.07}} />
          </div>
        </AbsoluteFill>
      </VoxCamera>
      <SourceLine frame={frame} at={0} font={VOX_FONT.cjkSans} text="据《史记·商君列传》" />
    </AbsoluteFill>
  );
};

// SFX cue sheet (absolute frames @24). BGM = one `dynasty` bed for the whole piece.
const CUES: Array<{at: number; event: SfxEvent; db?: number}> = [
  {at: 2, event: 'printLand'},
  {at: 28, event: 'highlight'},
  {at: B, event: 'mapFly'},
  {at: B + 38, event: 'poseJump', db: -22}, // dot + label appear
  {at: 2 * B, event: 'pageTurn'},
  {at: 2 * B + 36, event: 'highlight'},
  {at: 3 * B, event: 'titleHit'},
  {at: 3 * B + 8, event: 'highlight'},
  {at: 3 * B + 18, event: 'seal'},
];

export const QinPole: React.FC = () => {
  const {height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: VOX.page}}>
      <CollageFilters scale={height / 1080} seed={2} />
      <Bgm src="audio/bgm/qin_dynasty.wav" levelDb={-6} fadeIn={4} fadeOut={30} />
      <SfxTrack cues={CUES} />
      <Sequence durationInFrames={B}>
        <Board1 />
      </Sequence>
      <Sequence from={B} durationInFrames={B}>
        <Board2 />
      </Sequence>
      <Sequence from={2 * B} durationInFrames={B}>
        <Board3 />
      </Sequence>
      <Sequence from={3 * B} durationInFrames={B}>
        <Board4 />
      </Sequence>
    </AbsoluteFill>
  );
};

export const QIN_DURATION = 4 * B;
