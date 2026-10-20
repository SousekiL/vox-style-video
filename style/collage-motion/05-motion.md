# 05 · Motion

Code: `src/collage/time.ts` (clocks) and `src/collage/motion.ts` (tables, easings, springs). Frame counts are at **30 fps** unless noted. "Drawing" means one held image on the layer's clock.

## 1. Clocks (decide these first)
| Clock | How | Hold pattern @30 | Used for | Source |
|---|---|---|---|---|
| 12 fps grid | `posterize(frame, 30, 12)` | 3,2,3,2 | everything in `explainer`, including camera, springs and pose jumps | v01 (373/416 changes on the grid) |
| On 2s | `Math.floor(frame/2)*2` | 2 | `archive` graphics, scribbles, type-on | v04a |
| 10 fps with slip | `patterned(frame,[3,3,3,4,2])` | 3,3,3,4,2 | `earth` | v03 |
| Native 12 fps comp | composition `fps: 12` | 1 | `redIdent` | v06 |
| On 5s pulse | `Math.floor(frame/5)` | 5 | postcard asterisks (6 fps) | v08 |
| Irregular hand | `irregularHold(frame, seed, 1, 5)` | 1–5 random | `duotoneBurst` card boil, `scroll` stutter | v04b, v05 |
| Smooth | raw `frame` | 1 | live footage, `thenNow` text + modern object, `scroll`, `diorama`, postcard loops | v02, v05, v07, v08 |

**Rule:** compute every animated value of a layer from that layer's held frame `t`, *including* the frames in pose tables. A pose at frame 24 is off the 12 fps grid (grid frames are 0, 3, 5, 8, 10, 13, 15, 18, 20, 23, 25…) and produces a stray 1-frame hold. Pass `t`, not `frame`, to `<PoseJump>`.

**Mixed cadence as storytelling (v07):** the old object (horse carriage) runs at 12 fps while the modern car runs smoothly at 30 fps with motion blur. Use a cadence contrast like this only when it carries meaning.

## 2. Motion primitives (measured)
| # | Name | Numbers | Code | Source |
|---|---|---|---|---|
| M1 | **Pop-in with overshoot** (props) | Scale per 12 fps step `0.28, 0.81, 1.21, 1.28, 1.17, 1.07, 1.0, 0.98, 1.0`: +28 % peak 7 f after first sight, settled at 15–20 f. Next prop starts 10 f later | `table(POP, step - start)` | v01b |
| M2 | Soft pop (discs, pastel shapes) | `0.49, 0.84, 0.97, 1.03, 1.0`, +3 % over 10 f (part A); grid circle `POP_SOFT` +20 % (part B) | `table(POP_SOFT, …)` | v01a/b |
| M3 | Slide-in with overshoot (big prop) | 47 % W travel, overshoots 19 % of the travel at 10 f, settles at 23 f; `{stiffness:120, damping:11}` on the grid | `springAt(t, …)` | v01b |
| M4 | Slide-stop, pure ease-out | Deltas shrink ×0.6 per step, 20 f, no overshoot (balloon); v02 `bezier(.3,.6,.5,1)` 20 f | `EASE.slideStop` | v01a, v02 |
| M5 | Rise-in, ease-out | From below: +25 %H → +10 %H → 0 over 3 drawings (9 f) | `EASE.riseOut` | v03 |
| M6 | Linear slide, hard stop | 16–18 %H per drawing, 3–6 drawings, no ease (the stepping is the character) | `interpolate` linear on `t` | v03 |
| M7 | **Pose jump** | 2–3 held poses, 5–8 f each, no in-betweens; first pose often half off-frame | `<PoseJump>` / `poseAt()` | v01, v08 |
| M8 | Slam and step down | 1.8× → 1.25× → 1.0×, holds 8 / 5 f | `SLAM` | v01a |
| M9 | Pendulum | ±5.5°, period 60 f, no decay, pivot at the rope top | `pendulum(t)` | v01b |
| M10 | Pump-pulse growth | +20–25 % per 20 f stroke, relax −4–6 % after each, ×2.7 over 4 pulses, then a 2-drawing burst | `pumpPulse(t)` | v01a |
| M11 | Toss-in with rotation settle | Width 25 → 69 → 57 % W, angle −6.6° → +2.7° → 0° over 22 f | poses on the grid | v01a |
| M12 | Lift-out (ease-in exit) | Steps 2.7, 5.4, 9.2, 15.6, 19.2 %H, exits through a corner, 10 f | `bezier(.55,0,1,.45)` | v01a |
| M13 | Pop-on stacking | Items appear fully formed, one every 3–8 f, at most a 1-step drop | conditional render | v01a, v04a |
| M14 | Shrink and rise (end card) | ×0.67 and up 13 %H over 11 f, ease-in-out | `EASE.inOut` | v01b |
| M15 | Snap push to a sheet | 31.7 → 57.8 → 73.5 → 75 % W over 5 f, no overshoot | `SPRING.snapPush` | v04a |
| M16 | **Recede to cut** | Slow shrink −0.06 %/frame, then ease-in to 0.75 over the last 8 f, hard cut | `recedeToCut(t, start, cut)` | v04a |
| M17 | Medium swap | The same shape redrawn in a different medium every 2 f (outline, stipple, brush, hatch), scale 60–250 %, position ±10 % | asset array indexed by `Math.floor(frame/2)` | v04a |
| M18 | Scribble boil | 3–6 pencil strokes fully redrawn every 2 f | `<Scribble seed={Math.floor(frame/2)}/>` | v04a |
| M19 | Echo trail / step-repeat | 3–6 copies at a constant offset, one per 2 f | map with an index cutoff | v04a |
| M20 | Window grow | Square 3 → 59 % W in 5 f, ease-out, no overshoot | `EASE.windowGrow` | v04b |
| M21 | Scatter out | Props fly off the centre, ease-in, ≈ 22–25 %H in 4 f, ×1.3 | `Easing.in(quad)` | v04b |
| M22 | **Stamp spring** | Scale `0.78, 1.26, 1.15, 0.95, 0.92, 0.97, 1.0` per frame, 6 f; `{mass:.2, stiffness:350, damping:6}` | `STAMP` / `SPRING.stamp` | v08 |
| M23 | Asterisk pulse | Scale `1, .79, .70, .79` each held 5 f (period 20 f) | `PULSE` | v08 |
| M24 | Slow spin / wobble loops | Sun 18°/s clockwise, globe 16.5°/s; car rocks 0–8° at ≈ 0.6 Hz (`noise2D`) | `@remotion/noise` | v08 |
| M25 | Linear card spin | Constant 15°/frame at 12 fps from −75° to +75° (11 f); swap the object at the edge-on frame | `cardSpin(local)` | v06 |
| M26 | Scale punch | Jumps to 2.0× for 2 frames (1.99, 1.83), hard cut back | conditional | v06 |
| M27 | Bar hop | Expo ease-out on one axis at a time, ≈ 50 % of the distance on the first frame, 5–7 f | `EASE.expoOut` | v06 |
| M28 | Long glide park | 91 % W in 48 f, `bezier(.25,.4,.1,1)`, motion blur | `EASE.longGlide` + `@remotion/motion-blur` | v07 |
| M29 | Continuous push-in | ×1.43 over 10 s, anchor at (29 %, 54 %), never settles | `bezier(.45,-.1,.45,.6)` | v02 |
| M30 | Scroll + stutter | Ease-in to 2.2–2.6 %H/frame over 25 f, then freeze 1–3 f every 10–25 f and catch up | `references/notes/v05.md` §11A | v05 |

## 3. Easing table
| Key | Bezier | Feel |
|---|---|---|
| `expoOut` | 0.16, 1, 0.3, 1 | camera settle, UI bar hop |
| `slideStop` | 0.3, 0.6, 0.5, 1 | prop slides to a stop |
| `riseOut` | 0.2, 0.6, 0.35, 1 | rises from below |
| `longGlide` | 0.25, 0.4, 0.1, 1 | calm vehicle park |
| `unfold` | 0.2, 0.7, 0.3, 1 | crumpled box slides in |
| `inOut` | 0.65, 0, 0.35, 1 | end-card shrink |
| `mosaic` | 0.45, 0, 0.55, 1 | tile swap progress |
| `recede` | `Easing.in(cubic)` | collapse into a cut |

## 4. Choreography rules
- **One major action at a time.** A new beat starts every 0.5–1.5 s, and beats may overlap by a few frames (v02, v03, v08).
- **Stagger:** props about 4 f apart for a build (v08 entries at 9, 15, 17, 18, 25, 33, 36, 39), 10 f apart for a pair (v01 laptop → phone), 13 f between marker labels.
- **Entries come from the nearest edge, and exits leave the way they came** (v03).
- **Hold long enough to read:** text blocks hold at least 1.5 s; the then-and-now loop holds 3.5 s or more between beats.
- Held layers stay **pixel-still**. Life comes from the boil (explainer, archive) or from small loops (postcard), never from global camera drift.
