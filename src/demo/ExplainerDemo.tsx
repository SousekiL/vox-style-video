// A 12 s, three-shot proof that the style system is buildable in code.
// Shot A = "explainer" preset (v01), shot B = "archive" preset (v04a), shot C = "duotoneBurst" + stamp (v04b/v08).
import React from 'react';
import {AbsoluteFill, Img, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {
  Bgm,
  BrokenLine,
  CollageFilters,
  CrumpledPaper,
  Cutout,
  CutCamera,
  FONT,
  FlatPaper,
  FlatShape,
  GraphPaper,
  Grain,
  GridCircle,
  Halftone,
  InkBlackout,
  InkLine,
  PALETTES,
  POP,
  POP_SOFT,
  PoseJump,
  STAMP,
  SfxTrack,
  type SfxEvent,
  Scribble,
  Tape,
  TileMosaic,
  TornStrip,
  TypeOn,
  WordStamp,
  boilState,
  drawingIndex,
  irregularHold,
  pendulum,
  poseAt,
  posterize,
  recedeToCut,
  table,
} from '../collage';

const SHOT = 120; // frames per shot at 30 fps

// ---------- Shot A: explainer (v01 grammar) ----------
const ShotExplainer: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const pal = PALETTES.explainer;
  const t = posterize(frame, fps, 12); // every animated value rides the 12 fps clock
  const step = drawingIndex(frame, fps, 12);
  const paperSeed = 10 + (boilState(frame, 15) % 4); // background re-rolls every 15 frames
  const jit = (k: string) => ((boilState(frame, 15) * 7919 + k.length * 31) % 13) / 13 - 0.5; // ±0.5 deterministic
  const houseScale = table(POP, step - 3);
  const circleScale = table(POP_SOFT, step - 1);
  const swing = step > 12 ? pendulum(t - 36) : 0;
  const arrow = step < 16 ? 0 : step < 17 ? 0.5 : 1; // draw-on in 2 coarse steps

  return (
    <CutCamera t={t} dur={SHOT} fromScale={0.82} settleFrames={15}>
      <AbsoluteFill style={{background: pal.page}} />
      {/* scanned paper sheet that does not fill the frame; white page shows at the sides */}
      <div style={{position: 'absolute', left: '11%', top: '5%', width: '78%', height: '100%', transform: `rotate(${jit('sheet') * 1.2}deg)`}}>
        <CrumpledPaper color={pal.paper} seed={paperSeed} />
      </div>
      <GraphPaper style={{left: '4%', top: '52%', width: '26%', height: '44%', transform: `rotate(${-4 + jit('graph') * 3}deg)`}} />
      <FlatShape kind="half" color={pal.pastels[1]} box={{x: 66, y: 58, w: 30, h: 26}} rot={jit('half') * 14} />
      <FlatShape kind="disc" color={pal.pastels[0]} box={{x: 4, y: 8, w: 15, h: 26.7}} />
      <div style={{position: 'absolute', left: '33%', top: '18%', width: '36%', height: '64%', transform: `scale(${circleScale})`}}>
        <GridCircle box={{x: 0, y: 0, w: 100, h: 100}} seed={4} />
      </div>
      {/* hero: greyscale cut-out, no outline, no shadow, hanging from the one red accent */}
      <div
        style={{
          position: 'absolute',
          left: '51%',
          top: '0%',
          width: 0,
          height: '100%',
          transformOrigin: '0 0',
          transform: `rotate(${swing}deg)`,
        }}
      >
        <div style={{position: 'absolute', left: -height * 0.006, top: 0, width: height * 0.012, height: height * 0.36, background: pal.accent}} />
        <Cutout style={{left: -width * 0.15, top: height * 0.34, transform: `scale(${houseScale})`, transformOrigin: '50% 0%'}}>
          <Img src={staticFile('cutouts/house.png')} style={{width: width * 0.3, display: 'block'}} />
        </Cutout>
      </div>
      <Tape x={9} y={49} w={9} h={3} rot={-12} seed={1} />
      <Tape x={27} y={88} w={8} h={2.6} rot={20} seed={2} />
      <InkLine points={[[78, 92], [79, 70], [74, 55]]} progress={arrow} arrow />
      {/* hand enters in 2 held poses, first half off-frame (v08 hold-jump), then holds pixel-still */}
      {(() => {
        const hp = poseAt(t, [
          {at: 55, x: -22, y: 64},
          {at: 63, x: -6, y: 60},
        ]);
        return hp ? (
          <Img src={staticFile('cutouts/hand.png')} style={{position: 'absolute', left: `${hp.x}%`, top: `${hp.y}%`, width: width * 0.3}} />
        ) : null;
      })()}
      {/* caption: 3-pose jump, no tween */}
      <PoseJump
        frame={t}
        poses={[
          {at: 24, x: 46, y: 60, scale: 2},
          {at: 32, x: -6, y: 66, scale: 2},
          {at: 37, x: 4, y: 7, scale: 1},
        ]}
        style={{fontFamily: FONT.grotesk, fontWeight: 700, fontSize: height * 0.068, lineHeight: 0.93, letterSpacing: '-0.02em', color: pal.ink}}
      >
        Why banks
        <br />
        want your house.
      </PoseJump>
      <Grain opacity={0.06} seed={step} />
    </CutCamera>
  );
};

// ---------- Shot B: archive editorial (v04a grammar) ----------
const ShotArchive: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const pal = PALETTES.archive;
  const t2 = Math.floor(frame / 2) * 2; // on 2s
  const scale = recedeToCut(t2, 0, SHOT - 14); // shrink, then collapse into the blackout
  return (
    <AbsoluteFill style={{background: pal.page}}>
      <FlatPaper color={pal.page} mottle={0.05} seed={1 + (Math.floor(frame / 2) % 3)} />
      <AbsoluteFill style={{transform: `scale(${scale})`}}>
        {/* giant serif headline cropped by the top edge, typed 2 f/char */}
        <div
          style={{
            position: 'absolute',
            left: '1.5%',
            top: -height * 0.03,
            fontFamily: FONT.heroSerif,
            fontWeight: 400,
            fontSize: height * 0.23,
            lineHeight: 0.86,
            letterSpacing: '-0.01em',
            color: pal.ink,
            whiteSpace: 'nowrap',
          }}
        >
          <TypeOn text="LEVERAGE" frame={t2} start={6} perChar={2} />
        </div>
        <div style={{position: 'absolute', left: '1.5%', top: '20%', fontFamily: FONT.heroSerif, fontSize: height * 0.12, color: pal.ink}}>
          <WordStamp text="IS BORROWED TIME" frame={t2} start={24} perWord={4} wordStyle={(i) => (i === 1 ? {filter: 'url(#inkBleed)', display: 'inline-block'} : {})} />
        </div>
        {/* halftone archive photo of the hero object */}
        <div style={{position: 'absolute', left: '38%', top: '36%', width: width * 0.42}}>
          <Halftone pitchPctH={0.74} angle={45}>
            <Img src={staticFile('cutouts/bank.png')} style={{width: width * 0.42, display: 'block'}} />
          </Halftone>
        </div>
        {/* red pencil scribble, fully redrawn every 2 frames */}
        <Scribble box={{x: 62, y: 38, w: 22, h: 30}} seed={Math.floor(frame / 2)} strokes={4} widthPx={height * 0.004} />
        {/* tiny 2-column metadata grid */}
        <div style={{position: 'absolute', left: '2%', top: '78%', display: 'grid', gridTemplateColumns: 'auto auto', columnGap: height * 0.03, fontFamily: FONT.meta, fontSize: height * 0.03, lineHeight: 1.4, color: pal.ink}}>
          <span>Year:</span>
          <TypeOn text="1971" frame={t2} start={40} />
          <span>Story:</span>
          <TypeOn text="Debt, repackaged" frame={t2} start={50} />
        </div>
      </AbsoluteFill>
      <InkBlackout frame={frame} start={SHOT - 14} />
    </AbsoluteFill>
  );
};

// ---------- Shot C: duotone collage burst + stamp payoff (v04b, v08) ----------
const ShotBurst: React.FC = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const pal = PALETTES.duotoneBurst;
  const hold = irregularHold(frame, 'card', 1, 5); // hand-pushed boil on 1–5 frame holds
  const jx = ((hold * 37) % 11) / 11 - 0.5;
  const jy = ((hold * 53) % 7) / 7 - 0.5;
  const paperB = 1 - (((Math.floor(frame / 2) * 13) % 7) / 7) * 0.05;
  const stampScale = frame < 84 ? 0 : table(STAMP, frame - 84);
  const card = (variant: 'duo' | 'bw') => (
    <div
      style={{
        position: 'absolute',
        left: '30%',
        top: '18%',
        width: '40%',
        height: '64%',
        background: variant === 'duo' ? '#e84b2d' : '#f5f5f0',
        transform: `translate(${jx * height * 0.008}px, ${jy * height * 0.008}px)`,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
      }}
    >
      {variant === 'duo' ? (
        <Img src={staticFile('cutouts/piggy_duo.png')} style={{width: width * 0.3}} />
      ) : (
        <Halftone pitchPctH={0.47} angle={45}>
          <Img src={staticFile('cutouts/piggy.png')} style={{width: width * 0.3, display: 'block'}} />
        </Halftone>
      )}
    </div>
  );
  return (
    <AbsoluteFill style={{background: pal.paper, filter: `brightness(${paperB})`}}>
      <GraphPaper bg="transparent" line="#ab2306" cellPctH={1.8} style={{left: 0, top: '6%', width: '45%', height: '26%'}} />
      {card('duo')}
      <TileMosaic frame={frame} start={52} dur={10} cols={6} rows={8}>
        {card('bw')}
      </TileMosaic>
      <div style={{position: 'absolute', top: '6%', width: '100%', textAlign: 'center', fontFamily: FONT.titleSerif, fontWeight: 500, color: pal.ink, fontSize: height * 0.065, lineHeight: 1.0}}>
        <WordStamp text="THIS IS" frame={frame} start={8} perWord={3} />
        <br />
        <BrokenLine>
          <WordStamp text="A PROMISE" frame={frame} start={14} perWord={3} />
        </BrokenLine>
      </div>
      <TornStrip box={{x: 58, y: 70, w: 30, h: 7}} rot={-5} seed={3} color="#f6f2e6">
        <span style={{fontFamily: FONT.meta, fontSize: height * 0.028, color: '#c0341f'}}>paid back with interest</span>
      </TornStrip>
      <div style={{position: 'absolute', left: '64%', top: '18%', width: height * 0.2, height: height * 0.2, transform: `rotate(-12deg) scale(${stampScale})`}}>
        <svg viewBox="-50 -50 100 100" width="100%" height="100%" style={{filter: 'url(#crayon)'}}>
          <circle r="46" fill="none" stroke="#fffff5" strokeWidth="5" />
          <circle r="36" fill="none" stroke="#fffff5" strokeWidth="2" />
          <text textAnchor="middle" y="7" fontSize="19" fontFamily={FONT.grotesk} fontWeight={700} fill="#fffff5">
            OWED
          </text>
        </svg>
      </div>
      <Grain opacity={0.12} seed={Math.floor(frame / 2)} />
    </AbsoluteFill>
  );
};

// SFX cue sheet: every cue sits on the frame its motion starts (12-audio.md §3). Absolute comp frames.
// BGM is separate: one bed for the whole film, composed at 120 bpm so the cuts at 120/240 land on downbeats.
const CUES: Array<{at: number; event: SfxEvent; db?: number}> = [
  // shot A (explainer, 12 fps grid)
  {at: 3, event: 'shapePop'}, // grid circle POP_SOFT, drawing 1
  {at: 8, event: 'popIn'}, // house POP, drawing 3
  {at: 25, event: 'slam'}, // caption pose 1 (2x, first grid frame >= 24)
  {at: 33, event: 'poseJump'},
  {at: 38, event: 'poseJump'},
  {at: 40, event: 'poseJump', db: -22}, // arrow draw-on step 1
  {at: 55, event: 'slide'}, // hand pose 1
  {at: 65, event: 'poseJump'}, // hand pose 2
  {at: 115, event: 'whip'}, // pre-cut push pose
  // shot B (archive, on 2s)
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => ({at: 126 + i * 2, event: 'typeOn' as const})), // LEVERAGE, 2 f/glyph
  {at: 144, event: 'poseJump'},
  {at: 148, event: 'slam'}, // ink-bleed word
  {at: 152, event: 'poseJump'},
  {at: 162, event: 'scribble'},
  {at: 226, event: 'inkBlackout'},
  // shot C (duotone burst)
  {at: 248, event: 'poseJump'},
  {at: 251, event: 'poseJump'},
  {at: 254, event: 'poseJump'},
  {at: 257, event: 'slam'}, // broken line lands
  {at: 292, event: 'mosaic'},
  {at: 324, event: 'stamp'},
];

export const ExplainerDemo: React.FC = () => {
  const {height} = useVideoConfig();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <CollageFilters scale={height / 1080} seed={1 + Math.floor(frame / 2) % 5} />
      <Bgm src="audio/bgm/demo_curious.wav" levelDb={-3} fadeOut={30} />
      <SfxTrack cues={CUES} />
      <Sequence durationInFrames={SHOT}>
        <ShotExplainer />
      </Sequence>
      <Sequence from={SHOT} durationInFrames={SHOT}>
        <ShotArchive />
      </Sequence>
      <Sequence from={SHOT * 2} durationInFrames={SHOT}>
        <ShotBurst />
      </Sequence>
    </AbsoluteFill>
  );
};

export const DEMO_DURATION = SHOT * 3;
