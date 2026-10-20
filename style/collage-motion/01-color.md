# 01 · Colour

Code: `PALETTES` in `src/collage/tokens.ts`. All hex values were sampled on native frames (median of a patch, not k-means centroids, unless noted).

## 1. Colour roles
Every preset fills the same six roles. Only the values change.

| Role | Job | Typical area |
|---|---|---|
| `page` | The outermost ground, visible around the collage | 15–35 % (explainer), 0 % (dense presets) |
| `paper` | Scanned sheets the collage is built on | 25–45 % |
| `ink` | Type, line work, arrows. Never pure `#000` unless the preset is `archive` night pages or `redIdent` | 1–12 % |
| `accent` | **The one saturated colour in the frame** | 1–8 % (up to 18 % as a paper in `earth`) |
| `pastels` | Flat semi-transparent shapes (discs, wedges, fans), multiplied over paper | 5–15 % |
| photo | Greyscale, sepia, duotone or halftone cut-outs | 10–45 % |

## 2. Palettes (measured)
| Preset | page | paper | ink | accent | pastels / extras | Photo grade | Source |
|---|---|---|---|---|---|---|---|
| explainer | `#fdfdfd` | `#e5e4e7`–`#ececec` crumpled | `#111310` | `#e55f3c` / `#ed5f2d` / `#f56d41` | green `#dbeed1` `#aed1a4`, pink grid `#ffdfd2` lines `#e88a7a`, salmon `#f4a493`, lime tape `#b8b670` | greyscale, contrast ×1.25; portrait duotone `#421d14`→`#eacec7` | v01 |
| archive | `#fbfbfb` | cream sheet `#ebe9db`–`#f1efdf`; night `#010101` | `#0e0d0d`; chalk `#cbcbcb` on black | `#e74c1d` (reads `#bc4621` on black) | graph green, tape beige α 0.7 | newsprint halftone 45°, 0.74 %H | v04a |
| earth | `#efe6db` cream sky | olive crumple `#797648` | `#212020` | felt red `#9e2522` (15–18 % area) | khaki `#c2af91` `#9b8e70`, note paper `#decbb2` | natural colour chosen to sit at saturation ≤ 0.45 | v03 |
| postcard | sky teal `#76b7b2` | card `#ecdfc5` | sepia `#46381f` | yellow `#f9e961` (doodles only) | cloud cream `#f8ebd2`, sea `#96bdb2` / `#527979`; payoff `#f8510a` | warm vintage curve, white→`#f8ebd2`, black→`#4a3d2c` | v08 |
| thenNow | sky plaster `#e6dfd8` | ground `#cdc2ba` | `#1f1f22` | car red `#d52943` (≈ 6 %) | ochre stripe `#ccba92`, halo cream `#f6f7e4` | sepia architecture; old objects pure greyscale | v07 |
| diorama | flat `#ece9e0` | parchment `#d4c6b3` | warm black `#3a3328` (never pure) | ochre `#c9913a` | brick `#b82717`, teal `#47707f` (each ≤ 1 %) | muted warm (sat 0.8, sepia 0.25) | v02 |
| scroll | `#e1decf` | card border `#bfb8a3` | `#2f2d2f` | mauve `#9d8082` (deepens to `#7c6668`) | `#b09c9b`, `#bfb2ad`, `#d8cec0`; ghosts at 45 % / 18 % ink | B/W, faded colour, sepia | v05 |
| redIdent | `#d8332f` field | none | `#0d0c0c` | white `#ffffff` | glitch red `#b01010`, ring glow `#f26c63`–`#f6a093` | greyscale, contrast ×1.35 | v06 |
| duotoneBurst | pillarbox `#000` | red stock `#d73d25`–`#e6432a` | warm white `#fffff5` | duotone red `#e84b2d` | orange `#e84c26`, pink duo `#a55051`, green duo `#20380c` | duotone `#5a0d05`→`#e84b2d`, halftone 0.47 %H | v04b |

## 3. Rules
1. **One accent per frame.** If two hot colours appear, one of them must be < 0.5 % of the area or held back for the payoff.
2. **Pastels are flat, multiplied and never photos.** Paper creases must show through them (`mix-blend-mode: multiply`, opacity 0.85–0.95).
3. **Neutrals lean warm or cool by preset, never both.** The explainer paper is cool grey (`#e5e4e7`, B ≥ R). Earth, postcard, diorama and thenNow paper is warm (R > G > B by 10–12 levels). Don't put a cream sheet in the explainer preset.
4. **No pure white or pure black inside the collage**, except on `archive` night pages and in `redIdent`. Clouds are cream, ink is sepia or warm black.
5. **The accent can be a part of a photo.** Hand-tint one part (the bank door, the safe dial) instead of colouring the whole object (v01a).
6. **Background hue changes only at a transition.** Disc iris (v05), cut (v04b one-colour studios), or a palette reset to pure white (v01a f846).
7. **Duotones use the paper's own hue family** (v04b). A red duotone on red stock reads as print; a blue duotone on red stock reads as a mistake.

## 4. Photo grade recipes
| Grade | CSS / SVG | In code |
|---|---|---|
| Greyscale | `grayscale(1) contrast(1.25)` | `treatment={{kind:'greyscale', contrast:1.25}}` |
| Sepia warm | SVG duotone `#4a3d2c`→`#f8ebd2` | `url(#sepiaWarm)` |
| Duotone red | `#5a0d05`→`#e84b2d` | `url(#duoRed)` |
| Portrait duotone | `#421d14`→`#eacec7` | `url(#duoMaroon)` |
| Muted warm | `saturate(.8) sepia(.25) contrast(.95)` | `{kind:'muted', saturate:0.8, sepia:0.25}` |
| Halftone | SVG threshold filter (see 04 §3) | `<Halftone pitchPctH={0.74} angle={45}>` |

## 5. Area budget for a typical explainer board (v01)
paper 40 % · white page 25 % · pastel shapes 12 % · greyscale photos 15 % · ink 4 % · accent 3 % · tape 1 %.
