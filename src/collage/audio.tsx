// Audio layer. Two separate kinds, never interchangeable (style/collage-motion/12-audio.md):
//   BGM  — the one music bed under the whole video: <Bgm/> once per composition, ducked under voice-over.
//   SFX  — short cues glued to specific motion events (a pop, a slam, a whip): <Sfx/> at that event's frame.
import React from 'react';
import {Audio, interpolate, Sequence, staticFile, useVideoConfig} from 'remotion';

export const dbToGain = (db: number) => Math.pow(10, db / 20);

// ---------- BGM ----------
export type DuckRange = {from: number; to: number}; // frames where voice-over (or a key SFX moment) plays

/**
 * The music bed. Levels from 12-audio.md §2: bed at −18 LUFS from compose_bgm/library prep,
 * played at `levelDb` (default −6 dB → about −24 LUFS under VO), ducked a further `duckDb`
 * during `duck` ranges with 6-frame ramps, faded in/out at the ends.
 */
export const Bgm: React.FC<{
  src: string; // path under public/, e.g. 'audio/bgm/explainer.wav'
  levelDb?: number;
  duck?: DuckRange[];
  duckDb?: number;
  fadeIn?: number; // frames
  fadeOut?: number; // frames
  startFrom?: number; // trim the head of the track (frames)
}> = ({src, levelDb = -6, duck = [], duckDb = -8, fadeIn = 6, fadeOut = 45, startFrom = 0}) => {
  const {durationInFrames} = useVideoConfig();
  const ramp = 6;
  return (
    <Audio
      src={staticFile(src)}
      startFrom={startFrom}
      volume={(f) => {
        const edge = Math.min(
          interpolate(f, [0, fadeIn], [0, 1], {extrapolateRight: 'clamp'}),
          interpolate(f, [durationInFrames - fadeOut, durationInFrames], [1, 0], {extrapolateLeft: 'clamp'}),
        );
        let duckAmt = 0;
        for (const d of duck) {
          duckAmt = Math.max(duckAmt, interpolate(f, [d.from - ramp, d.from, d.to, d.to + ramp], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
        }
        return dbToGain(levelDb + duckAmt * duckDb) * edge;
      }}
    />
  );
};

// ---------- SFX ----------
/** Which synthesized/library cue belongs to which motion primitive, and at what level (dB). */
export const SFX_FOR = {
  popIn: {name: 'pop', db: -14}, // M1 prop pop-in
  shapePop: {name: 'pop-soft', db: -18}, // M2 disc / pastel shape
  slam: {name: 'slam', db: -10}, // M8 headline slam, heavy landing
  stamp: {name: 'stamp', db: -9}, // M22 stamp spring payoff
  whip: {name: 'swish', db: -12}, // T1 whip-pan, T2 push pose
  slide: {name: 'paper', db: -16}, // M4/M5 slides, T6 sheet, hand-placed props
  poseJump: {name: 'tick', db: -18}, // M7 caption / prop pose change
  typeOn: {name: 'tick', db: -26}, // per glyph, very quiet (archive only)
  scribble: {name: 'pencil', db: -20}, // M18
  mosaic: {name: 'mosaic', db: -14}, // T9
  inkBlackout: {name: 'ink', db: -12}, // T5
  glitch: {name: 'glitch', db: -14}, // T14
  payoff: {name: 'chime', db: -14}, // end card / M14
  pump: {name: 'pump', db: -14}, // M10 stroke
  burst: {name: 'burst', db: -9}, // M10 end
} as const;
export type SfxEvent = keyof typeof SFX_FOR;

/**
 * One cue at frame `at` (put it on a clock frame — the same frame the motion changes).
 * `variant` defaults to a deterministic pick from `at`, so repeated pops do not sound identical.
 * `src` overrides the synthesized palette with a library file (e.g. a Freesound pick).
 */
export const Sfx: React.FC<{at: number; event: SfxEvent; variant?: number; db?: number; src?: string; dir?: string}> = ({
  at,
  event,
  variant,
  db,
  src,
  dir = 'audio/sfx/synth',
}) => {
  const cue = SFX_FOR[event];
  const v = variant ?? 1 + (Math.abs(Math.round(at)) % 3);
  return (
    <Sequence from={Math.round(at)} durationInFrames={90} layout="none" name={`sfx:${event}`}>
      <Audio src={staticFile(src ?? `${dir}/${cue.name}_${v}.wav`)} volume={dbToGain(db ?? cue.db)} />
    </Sequence>
  );
};

/** A list of cues, e.g. built from the same pose/step tables that drive the visuals. */
export const SfxTrack: React.FC<{cues: Array<{at: number; event: SfxEvent; variant?: number; db?: number; src?: string}>}> = ({cues}) => (
  <>
    {cues.map((c, i) => (
      <Sfx key={`${c.event}-${c.at}-${i}`} {...c} />
    ))}
  </>
);
