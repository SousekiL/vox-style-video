# 00 · Principles: the non-negotiables

These 12 rules hold in at least 6 of the 8 references. Break one only when a preset in [07-presets.md](07-presets.md) explicitly says so.

## 1. Pick a clock per layer, and never mix clocks inside one layer
Collage motion is defined by **when** frames change, not only by how far things move.
- Default graphic clock: **12 drawings/s** (v01, v06, v07 old objects), **12.5** at 25 fps (v04a), **10** with a 3-3-3-4-2 slip (v03).
- At 30 fps, 12 fps produces holds of **3,2,3,2** frames. Implement this with `posterize(frame, fps, 12)` from `src/collage/time.ts`.
- Grain, paper boil, scribble redraws and camera moves ride the **same** clock as the shot. A free-running grain timer breaks the cadence; the QA check in [11](11-qa-checklist.md) catches it.
- Smooth 30/50/60 fps is a *deliberate contrast*. Use it only for live footage, the "modern" object in `thenNow`, the scroll in `scroll`, and loops in `postcard`.

## 2. Exactly one saturated accent per frame
Measured in v01, v03, v04, v06, v07, v08. Everything else is greyscale or sepia photo, neutral paper and flat pastels.
- Explainer: red-orange `#e85f34`. Earth: blood red `#9e2522`. Then-and-now: car red `#d52943`.
- A second hot colour is either **held back** for the payoff (v08 stamp `#f8510a` appears only in the last 0.8 s) or used tiny (< 0.5 % of the frame).

## 3. Photos are cut out cleanly, with no outline and no drop shadow
v01, v02, v03, v04 and v06 all measure **0 px** stroke and no shadow on photo cut-outs.
- Exceptions belong to presets: sticker borders on *objects* (v08), a cream feathered halo on *architecture* (v07), an RGB fringe (v04b).
- Drop shadows appear only under flat **paper props** (a check, a contract): down-right, soft, about 0.55 opacity (v01a).

## 4. Photos are treated, never raw
The photo is always graded: greyscale with contrast lifted (v01, v06), newsprint halftone (v04a 0.74 %H at 45°), duotone in the paper's own hue (v04b), sepia (v07, v08) or muted warm (v02). The accent object may keep its colour, or one part of it gets hand-tinted (the bank door in v01).

## 5. Paper is real material, and it boils while photos hold still
Backgrounds are scans: crumpled, graph, newsprint, plaster, felt. On stepped presets the **paper** re-rolls every 7–15 frames (v01) or every 3 frames on quiet pages (v04a), with ±7° jitter on flat shapes. The **hero photo never boils**: v01 measured 0.000 drift on cut-outs during holds. Smooth presets (v02, v05, v07, v08) have no boil at all.

## 6. Overshoot belongs to props, never to text
- Props pop in at 28 % scale, peak at **+15–28 %**, undershoot about 2 % and settle in 15–20 frames (v01 `POP` table).
- Discs and pastel shapes overshoot only about **3 %** (v01a).
- Text never overshoots. It types on, stamps word by word, or **jumps between 2–3 held poses** (v01, v08).

## 7. Text arrives as physical pieces
Per glyph at 2 frames/char (v04a, v08), per word every 3–4 frames (v04b), as a whole block jumping poses (v01), or line by line with fade, unblur and rise (only in `thenNow`). Never a smooth typewriter-with-cursor or a fade-in of a paragraph.

## 8. Scene changes are cuts or physical paper, never dissolves
Across ~60 measured scene changes, the only dissolves are inside v02's AI-generated diorama. Use:
- a hard cut with camera beats: a whip out (×4 per step) and settle in (×0.6 per step) (v01a), or a push pose ×1.065 → ×1.4 then an expo settle (v01b);
- paper: crumple, unfold, ink scribble blackout, a slanted sheet slide, a tile mosaic, a disc iris (v04, v05).

## 9. The camera moves only around cuts (or never)
During holds the frame is locked (ORB fits measure ×1.000 and 0 px). Camera energy is spent in the 5 frames before a cut and the 12–25 frames after it. There is no handheld shake in any reference.

## 10. Hard stops, short moves
Moves take 3–8 drawings (0.2–0.8 s). Translations stop hard or ease out; long glides (1.6 s) appear only in `thenNow`. Moves are often **linear** on the stepped clock (v03 slides, v06 spins): the stepping supplies the character.

## 11. Leave paper showing
- Explainer and archive boards leave **30–60 %** of the frame as plain paper or white page, and the collage does not fill the frame edge to edge.
- Dense presets (earth, postcard) fill the frame, but add **one new focal prop at a time**, roughly every 0.5–0.8 s.

## 12. Numbers in % of the frame
Specify sizes and positions in % of frame width (W) or height (H), and convert to px at render time. All references were measured that way, so the system scales cleanly from 1080p to 2160p and between 16:9 and 9:16.

## The 10-second smell test
Pause on any frame and check: is there one saturated colour? Are the photos treated and edge-clean? Is paper visible? Then step frame by frame: do pixels change only on the clock (every 2–3 frames)? If all four hold, it reads as collage motion.
