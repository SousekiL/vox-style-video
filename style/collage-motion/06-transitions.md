# 06 · Transitions

Code: `src/collage/transitions.tsx`. Across the 8 references there are **zero** whole-scene cross-dissolves outside v02's generated diorama. Every scene change is one of the following.

## 1. Catalogue
| # | Transition | Frame-by-frame | Duration | Component | Source |
|---|---|---|---|---|---|
| T1 | **Split whip-pan** | Out: cumulative offset `0, −0.6, −2.5, −10, −18 % W` per drawing (×4 per step), sharp, no blur. Hard cut. In: the new board starts ≈ 40 % W behind and decays ×0.6 per drawing (e.g. −23.5, −14.1, −6.7… % W) | 5–8 f out, 18–25 f in | `<WhipBoard step steps dirIn dirOut>` | v01a |
| T2 | **Push pose + settle** | Last 5 f: ×1.065 held 3 f, ×1.40 held 2 f (text layer may scale ×1.33 while props scale ×1.07). Hard cut. First 12–15 f: expo-out from ×0.64–0.82 or a 25 % W offset | 5 + 15 f | `<CutCamera t dur fromScale fromX>` | v01b |
| T3 | Zoom-out settle (scene open) | ×1.217 → 1.0, per-step factors 0.94, 0.94, 0.966, 0.98, 0.99… (τ ≈ 4 f) | 18 f | `zoomOutSettle()` | v01a |
| T4 | **Recede to cut** | Slow shrink, then ease-in collapse to 0.75 over 8 f, hard cut | 8 f | `recedeToCut()` | v04a |
| T5 | **Ink scribble blackout** | Black brush coverage 12 → 14 → 22 → 31 → 31 → 44 → 71 → 99 %, accelerating, on 2s; cut at 99 % to a black page | 14 f | `<InkBlackout frame start/>` | v04a |
| T6 | Slanted sheet slide-over | Sheet with its edge 15° off vertical; edge at 74.4 % (hold 4) → 68.9 → 57.4 % (hold 5) → 10 % W; irregular holds read as hand-pushed | 11–13 f | `<SlantedSheet frame start/>` | v04a |
| T7 | Unfold reveal | A crumpled ball rises from bottom centre and unfolds into the next photo; reveal area 8.7 → 15.6 → 27.7 → 40.5 → 60 → 100 % on 2s | 9 f | image sequence of a real crumple (no procedural shortcut looks right) | v04a |
| T8 | Crumple away | The collage peels and crumples towards a corner over ≈ 12 f on 2s; the next scene is already underneath | 12 f | image sequence | v04a |
| T9 | **Tile mosaic swap** | Random grid-aligned rectangles snap from A to B; progress 2, 4, 15, 26, 39, 62, 70, 80, 86, 100 % (S-curve, 50 % at ≈ 5.5 f) | 10 f | `<TileMosaic frame start dur cols rows>` | v04b |
| T10 | Window grow + scatter | A duotone square opens from a point (3 → 59 % W in 5 f) while props fly out and a tile grid assembles | 8 f | `EASE.windowGrow` + M21 | v04b |
| T11 | Staircase / strip wipes | Duotone blocks step in diagonally or as vertical strips at 1–2 f intervals | 5–7 f | variant of `TileMosaic` with ordered ranks | v04b |
| T12 | **Disc iris** | Flat concentric bands grow from the centre, t^1.5 over 11 f, each band 2 f behind; closing variant ease-in over 30 f, then the label circle opens ease-out over 12 f to 70 %H | 11–42 f | `<DiscIris frame start bands/>` | v05 |
| T13 | Card-spin edge-on swap | Object A reaches ≈ 75° (edge-on); on the next frame object B is at −75° on the other side, often with a ring strobe | 1 f | `cardSpin()` | v06 |
| T14 | Slice / block glitch | 6–10 full-width bands offset up to ±150 px, some greyed; or block rects in dark red, black and white covering 2 → 45 → 3 % | 2–8 f | seeded rect lists per frame (`references/notes/v06.md` §7) | v06 |
| T15 | Slide-over cover | A full-frame layer slides down over the previous one, linear, ≈ 17 %H per drawing; the layer below does not move | 15 f | `interpolate` on `stepped()` | v03 |
| T16 | Matte iris from a photo | A photo with a hole (the mouth) frames the collage; the hole closes in steps, then a hard swap | 21 f | PNG with an alpha hole, animated in steps | v03 |
| T17 | Object relay (in place) | The old object exits while the new one enters on the same spot, overlapping by 13 f; the background never cuts | 40–50 f | two layers with overlapping windows | v07 |
| T18 | Lunge-to-lens occlusion | A foreground object rushes at the lens and fills > 90 % of the frame for 4–7 f; the next state is revealed behind it | 4–7 f | scale ×6 with ease-in on a cut-out, then cut | v04b |
| T19 | Hard cut | Always available. On stepped presets, cut on a grid frame | 0 | `<Sequence>` boundaries | all |

## 2. Picking a transition
| Situation | Use |
|---|---|
| Explainer, next argument | T1 whip (lateral story progress) or T2 push (zooming into detail) |
| Explainer, change of topic | T5 ink blackout or T19 cut to a pure white board (palette reset) |
| Archive or editorial chapter | T4 recede to cut, T6 slanted sheet, T7 unfold |
| Fast montage or a burst of facts | T9 tile mosaic every 0.4–0.8 s; T10 for an emphasis beat |
| Chapter with a new colour | T12 disc iris (the disc carries the new background hue) |
| Loop or ident | T13 edge-on swap + T14 glitch back to frame 0 |
| Same place, different era | T17 object relay |
| Ending | T16 matte iris, or the stamp spring (M22) followed by a hard cut to 11 f of black (v08) |

## 3. Cut hygiene on stepped presets
- Cut on a frame where the clock changes. A cut that lands mid-hold creates a stray 1-frame image.
- The **first frame after a cut is already in motion**. v04b's dolly starts at peak speed, and v01's board starts 40 % W offset. Don't ease in from rest after a cut.
- There is no transition frame blending. Every frame of every transition is sharp.
