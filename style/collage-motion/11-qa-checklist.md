# 11 · QA checklist

Run these on every render. Most can be measured. The analyser that measured the references works on your output too.

## 1. Frame checks (pause on 3 random frames per board)
- [ ] Exactly **one** saturated accent (or a second one < 0.5 % of the frame).
- [ ] Photos are graded per preset (greyscale / sepia / duotone / halftone), not raw.
- [ ] Cut-outs have **no halo, outline or drop shadow** (unless the preset is postcard, thenNow or duotoneBurst, or the item is a paper prop).
- [ ] Paper or white page is visible (≥ 30 % in explainer and archive).
- [ ] No rough SVG stand-ins where a photo belongs. Every hero is photographic.
- [ ] Text sits on paper or a physical strip, never in a box; it uses the preset's fonts and sizes (% H).
- [ ] No vignette, glow, lens flare or gradient on paper.
- [ ] Cut-outs are not upscaled (`treat.py` printed no WARNING for heroes). At 100 % zoom, edges are crisp.

## 2. Cadence check (measured)
```bash
python3 -I scripts/prep_reference.py out/your-render.mp4 out/qa
```
```bash
python3 -I scripts/cadence.py out/qa/motion.csv 0:120 120:240 240:360
```
Pass one `start:end` frame range per shot (cut frames excluded).

| Preset | Expected run lengths | Fail signal |
|---|---|---|
| explainer (12 fps @30) | mostly **2 and 3** | many 1s → some layer runs on a free timer or uses off-grid pose frames |
| archive (on 2s) | **2** | 1s or 3s → a boil timer is not aligned to 2s |
| earth (10 fps) | 3, 3, 3, 4, 2 | 1s or 2s outside hand/bird loops |
| smooth presets | 1 | long runs where something should move |

This repo's own demo failed the check twice before passing. The causes were a grain re-roll every 3 frames inside a 12 fps shot, a paper boil every 3 frames inside an on-2s shot, and caption poses at frames 24/32/37, which are off the 12 fps grid. Shot A went from {1: 4, 2: 17, 3: 14, 5: 2} to **{2: 18, 3: 18}** after the fixes, matching the reference's 3,2,3,2 pattern exactly. Shot B went from {1: 31, 2: 32} to {1: 1, 2: 47}.

## 3. Hold stillness
- [ ] Between boil re-rolls, held boards change **0 px**. Check two frames 4 apart inside a hold with `diff` in `motion.csv` (≈ 0).
- [ ] Hero photos never move during a boil; only paper and flat shapes jitter.
- [ ] No camera drift during holds.

## 4. Motion checks
- [ ] Prop pop-ins overshoot 15–28 % and settle in ≤ 20 frames; disc pops ≤ 3 %.
- [ ] Text never overshoots or fades in as a paragraph.
- [ ] Every cut lands on a clock frame; the first frame after a cut is already moving.
- [ ] No cross-dissolves between scenes (diorama in-shot swaps are the only exception).

## 5. Delivery
- [ ] 2160p master renders without frame timeouts (fonts self-hosted or `--timeout=120000`).
- [ ] `CREDITS.md` from every searched asset is carried into the description or end card.
- [ ] No logos, brand marks or real-person AI likenesses.
- [ ] Safe areas respected for 9:16 (text inside x 6–94 %, y 8–80 %).
