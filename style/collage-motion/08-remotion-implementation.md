# 08 · Remotion implementation

Stack: Remotion 4.0.537, React 19, TypeScript, `@remotion/google-fonts`, `@remotion/noise`; audio tooling: FluidSynth + GeneralUser GS, Tone.js + `node-web-audio-api` (dev), aubio, ffmpeg. Everything is under `src/collage/` and exported from `src/collage/index.ts`.

## 1. Module map
| File | Exports | Notes |
|---|---|---|
| `tokens.ts` | `PALETTES`, `TYPE`, `CLOCK`, types | one palette per preset |
| `time.ts` | `posterize`, `drawingIndex`, `patterned`, `irregularHold`, `boilState`, `useClock`, `poseAt`, `Pose` | all clocks |
| `motion.ts` | `EASE`, `SPRING`, `POP`, `POP_SOFT`, `STAMP`, `PULSE`, `PRECUT_PUSH`, `WHIP_OUT`, `SLAM`, `table`, `springAt`, `settle`, `recedeToCut`, `pendulum`, `pumpPulse`, `cardSpin`, `whipIn`, `zoomOutSettle`, `charsShown`, `wordsShown` | measured numbers |
| `filters.tsx` | `<CollageFilters scale seed/>` | SVG defs: `torn`, `tornFibre`, `sticker`, `halo`, `fringe`, `inkBleed`, `pencil`, `crayon`, `warp`, `duoRed`, `duoPink`, `duoGreen`, `duoMaroon`, `sepiaWarm` |
| `materials.tsx` | `CrumpledPaper`, `FlatPaper`, `GraphPaper`, `Grain`, `Dust`, `Halftone`, `Cutout`, `treatmentFilter` | paper and photo treatment |
| `shapes.tsx` | `FlatShape`, `GridCircle`, `Tape`, `TornStrip`, `InkLine`, `Scribble`, `Asterisk`, `Sparkle`, `MarkerLabel` | marks and flats |
| `text.tsx` | `TypeOn`, `WordStamp`, `PoseJump`, `LineReveal`, `ScrambleLine`, `BrokenLine` | text primitives |
| `transitions.tsx` | `CutCamera`, `WhipBoard`, `TileMosaic`, `InkBlackout`, `SlantedSheet`, `DiscIris` | transitions |
| `fonts.ts` | `FONT` | Google Fonts loader |
| `audio.tsx` | `Bgm`, `Sfx`, `SfxTrack`, `SFX_FOR`, `dbToGain` | BGM bed with ducking + SFX cues per motion event (12-audio.md) |
| `placeholders.tsx` | `HouseObject`, `BankObject`, `CoinStack`, `HandObject`, `TowerObject` | original SVG stand-ins; replace with real cut-outs |

## 2. Scene skeleton (explainer preset)
```tsx
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CollageFilters, CrumpledPaper, Cutout, CutCamera, FONT, FlatShape, Grain, PALETTES, POP,
  PoseJump, boilState, drawingIndex, posterize, table} from '../collage';

export const Shot: React.FC<{dur: number}> = ({dur}) => {
  const frame = useCurrentFrame();
  const {fps, height} = useVideoConfig();
  const pal = PALETTES.explainer;
  const t = posterize(frame, fps, 12);       // 1. one clock for the whole shot
  const step = drawingIndex(frame, fps, 12);
  return (
    <CutCamera t={t} dur={dur} fromScale={0.82}>   {/* 2. camera beats only around cuts */}
      <AbsoluteFill style={{background: pal.page}} />
      <div style={{position: 'absolute', left: '11%', top: '5%', width: '78%', height: '100%'}}>
        <CrumpledPaper color={pal.paper} seed={10 + (boilState(frame, 15) % 4)} />  {/* 3. paper boils */}
      </div>
      <FlatShape kind="disc" color={pal.pastels[0]} box={{x: 32, y: 16, w: 36, h: 64}} />
      <Cutout treatment={pal.photo} style={{left: '35%', top: '22%', transform: `scale(${table(POP, step - 3)})`}}>
        <Img src={staticFile('cutouts/house.png')} style={{width: height * 0.55}} />  {/* 4. hero never boils */}
      </Cutout>
      <PoseJump frame={t} poses={[{at: 25, x: 46, y: 60, scale: 2}, {at: 33, x: -6, y: 66, scale: 2}, {at: 38, x: 4, y: 7}]}
        style={{fontFamily: FONT.grotesk, fontWeight: 700, fontSize: height * 0.068, lineHeight: 0.93, color: pal.ink}}>
        Your headline here.
      </PoseJump>
      <Grain seed={step} opacity={0.06} />                {/* 5. grain on the same clock */}
    </CutCamera>
  );
};
// In the composition root: <CollageFilters scale={height / 1080} seed={...}/> once, then <Sequence>s per shot.
```

## 3. Composition settings
| Deliverable | Size | fps | Notes |
|---|---|---|---|
| YouTube / web explainer | 1920×1080 or **3840×2160** | 30 | stepped presets look right at 30 (12 fps → 3,2 holds) |
| Social vertical | 1080×1920 or 2160×3840 | 30 | layouts per 03 §2 |
| Ident loop | 1080×1920 | **12** | `redIdent`: author at 12 fps natively |
| Scroll story | 1920×1080 | 50 or 60 | smooth scroll needs a high frame rate |
| Archive film | 1920×1080 | 25 | on 2s = 12.5 drawings/s |

Everything is specified in % of frame, so 4K needs no layout change. Pass `scale={height/1080}` to `CollageFilters` so filter radii scale too. `ExplainerDemo4K` is the same component registered at 3840×2160.

## 4. Render commands
```bash
npx remotion render src/index.ts ExplainerDemo out/demo.mp4 --codec=h264 --crf=16 --concurrency=4
```
```bash
npx remotion render src/index.ts ExplainerDemo4K out/demo-4k.mp4 --codec=h264 --crf=18 --concurrency=4 --timeout=120000
```
```bash
npx remotion render src/index.ts ExplainerDemo out/demo.mov --codec=prores --prores-profile=hq
```
- Stepped animation compresses well. Use CRF 16–18 so paper grain survives.
- ProRes HQ is the right master if the piece goes to an editor.
- The first render downloads fonts. Use `--timeout=120000` if a frame times out with "Waiting for root component to load".

## 5. Gotchas found while building this
1. **SVG `feDisplacementMap` needs an explicit `in`.** Without `in="SourceGraphic"` (or a named result) it displaces the previous primitive, usually the turbulence noise, and you get a rainbow blob. Fixed in `inkBleed` and `crayon`.
2. **CSS-only halftone (contrast + screen-blended dots) washes out** on mid-greys. Use the SVG arithmetic threshold in `<Halftone>`.
3. **Pose and boil timers must sit on the shot's clock.** The cadence check (11 §2) found 1-frame holds caused by a grain timer every 3 f inside a 12 fps shot, a paper boil every 3 f inside an on-2s shot, and pose frames at 24/32/37, which are off the 12 fps grid.
4. **`useId()` ids contain colons** and break `url(#…)`. The library uses deterministic string ids instead.
5. **Don't use `vw`/`vh`.** In Studio the canvas is scaled. Use `useVideoConfig()` width and height.
6. Inline `filter: url(#id)` on HTML elements needs the `<svg><defs>` in the same document. `CollageFilters` renders it with zero size.
7. A `WordStamp` word wrapped in an inline-block filter swallows its trailing space. Keep the space outside the styled span.

## 6. Extending the library
- **A new preset:** add a palette to `PALETTES`, a clock to `CLOCK`, and a section to `07-presets.md` with its measured source.
- **A new move:** put the measured table or curve in `motion.ts` with a source comment (`// v0X fNNN–fMMM`), then add a row to `05-motion.md`.
- **Real assets:** keep `placeholders.tsx` for tests; production scenes use `<Img src={staticFile('cutouts/...png')}>` inside `<Cutout>`.
