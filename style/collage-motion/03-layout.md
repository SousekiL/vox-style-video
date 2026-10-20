# 03 · Layout and composition

All positions are % of frame. 16:9 values come from v01, v02, v04a and v05; 9:16 values from v04b, v06, v07 and v08.

## 1. The layer stack (back to front)
Most boards use 5–6 flat layers. Order is the strongest stylistic cue after cadence.

| # | Layer | Examples | Boils? |
|---|---|---|---|
| 1 | Page | flat white `#fdfdfd`, teal sky, red field | archive: on 3s |
| 2 | Paper sheets | crumpled, graph, newsprint, kraft, plaster; rectangles that do not fill the frame | **yes** (every 7–15 f) |
| 3 | Flat shapes | disc, half-disc, fan, wedge, grid circle; multiplied | jitter ±7° on re-roll |
| 4 | Hero photo cut-out | greyscale object, centred on the shape behind it | **never** |
| 5 | Hands, tools, secondary props | hand placing a house, pump, magnifier | never |
| 6 | Marks | tape across edges, arrows, sparkles, scribbles, stamps, type | scribbles redraw on 2s |

**Depth slot rule (v03):** new decorative paper slides in *behind* the hero photo but *in front of* the sky, so the photo silhouette stays crisp against it. In React, insert new papers at a lower index than the hero; don't append them on top.

## 2. Compositions by preset
**Explainer board, 16:9 (v01)**
- The hero sits on the vertical centre line (x 45–52 %) in 4 of 5 shots, or as a two-subject split (left half / right half).
- A disc or wedge sits directly behind the hero at **1.2–1.6× its size**, often cropped by the frame or a sheet edge.
- Headline in the top-left (x 4–15 %, y 7–25 %) or the left third. Caption pairs go in the left and right thirds.
- Sheets meet at vertical seams around 15 %, 45 % and 80 % W. The white page shows on 1–3 sides.
- An optional horizon: a 1 px ruled line at y 35–55 % with a row of cut-out houses standing on it.

**Archive editorial page, 16:9 (v04a)**
- Headline glued to the top edge (0–31 %H). Hero in the middle band (40–75 %H). 2-column metadata bottom-left (x 2–35 %, y 76–92 %).
- 40–60 % empty paper. Margins: left 2 %, bottom about 8 %.
- Night page: one centred cluster 40–50 % W wide, with 50 % or more empty black around it.

**Diorama island, 16:9 (v02)**
- One compact cluster of 50–70 % W × 54–76 %H. At least 8 % margin left and right, at least 6 % top and bottom.
- A feathered cobble or ground patch under the objects (y 68–88 %) works as a plinth.
- Paper covers 73–83 % of the frame. The visual mass sits slightly left.

**Year chapter, 16:9 (v05)**
- Single centre axis: logo at 31 %H, numeral centred at 49.6 %H, caption at 66–70 %H. 75–80 % empty.
- Collage pairs: two photo cards tilted in opposite directions (−4…−9° and +10…+15°), the second overlapping the first's corner by about 25 %.

**Postcard, 9:16 (v08)**
- A card centred at (50 %, 50 %), 82 % W wide, rotated −10°.
- Satellites pin the card corners, so the outline is broken at 3 of 4 corners.
- Top arc of props (sun, plane, globe) rises diagonally to the right. Base plate in horizontal bands: sky 0–42 %, photo 42–83 %, sea 82–100 %.

**Then and now, 9:16 (v07)**
- Bands: sky 0–25 %, captions 12–25 %, building 25–64 %, vehicles 45–67 %, road 64–74 %, ground 75–100 %.
- Two caption columns frame a central landmark (keep x 43–61 % clear). The left column is right-aligned and the right column left-aligned, so both hug the axis.

**Pedestal / duotone panel, 9:16 inside 16:9 (v04b)**
- A 9:16 panel (31.6 % W) centred in black bars. Nothing crosses into the bars.
- Title band at 8–18 %H. Caption at about 51 %H, placed behind the object. Object top at 50–55 %H.
- Collage grid: 3×3 cells with 1 px gutters in the paper colour; the centre cell is larger.

**Ident, 9:16 (v06)**
- A single centred hero (31–52 % W) with at least 75 % empty field. Satellites orbit at different depths.

## 3. Overlap rules
- Tape always straddles a boundary between two layers.
- Hero photos overlap the shape behind them and are never fully contained by it.
- Corner props overlap card corners by 15–25 % of their size (v04b, v08).
- Text never overlaps the hero photo in `thenNow` or `scroll`. In `explainer` it may sit on paper next to the hero.
- In `duotoneBurst` the caption sits **behind** the object.

## 4. Converting between 16:9 and 9:16
Keep the layer stack and the % sizes relative to **H** for type. Re-flow positions:
- 16:9 thirds become 9:16 bands.
- A two-subject split (left/right) becomes top/bottom.
- Captions move from side columns into the 12–25 %H band.

To present a 9:16 piece inside a 16:9 deliverable, use the pillarbox panel from v04b (`references/notes/v04b.md` §11a).

## 5. Safe areas
For social 9:16, keep text inside x 6–94 % and y 8–80 % (platform UI covers the bottom 20 %). The references respect this: v07 captions sit at 12–25 %H, and v08 handwriting at 40–70 %H.
