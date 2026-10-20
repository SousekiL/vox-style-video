# 02 · Typography

Code: `FONT` in `src/collage/fonts.ts`, components in `src/collage/text.tsx`. Sizes are **% of frame height (H)**. Cap height ≈ 0.70 × font-size for the grotesks and ≈ 0.68–0.72 × for the serifs, so font-size ≈ cap height × 1.42.

## 1. Type roles
| Role | Classification | Size (cap height) | Case / tracking | Colour | Free font (closest) | Source |
|---|---|---|---|---|---|---|
| Explainer headline | Neo-grotesk Bold 700 | **8.2 %H** at rest (font-size ≈ 11.5 %H); line-height 0.92–0.93 | Sentence case, −1 to −2 % | `ink`, straight on paper, no box | Inter Tight 700 / Inter 700 | v01 |
| Explainer sub-headline | same | 4.5–4.8 %H | Sentence case, ends with a full stop | `ink` | Inter Tight 700 | v01 |
| Hero serif (cropped) | High-contrast Didone / transitional roman | **16 %H**, bleeds off the top edge by ≈ 2.4 %H, spans > 95 % W | CAPS, tracking 0, negative leading (gap 1.9 %H) | `#0e0d0d` | Playfair Display / Libre Caslon Display | v04a |
| Ink-bleed serif | Same roman, blotted, blobby terminals | 16 %H | CAPS | `ink` | Playfair + `url(#inkBleed)` | v04a |
| Title, clean + broken | Classical roman caps (Trajan-like) | 4.6 %H; line pitch 6.4 %H | CAPS, two lines centred at 8–18 %H; line 2 "melted" | `#fffff5` | Cormorant SC / Cinzel + `BrokenLine` | v04b |
| Night serif | Roman caps, eroded print edge | 7.5 %H, block 37 % W centred | CAPS | off-white on `#010101` | Cormorant Garamond SemiBold | v04a |
| Metadata | Neo-grotesk Regular | **2.1 %H**, leading 2.9 %H, 2-column label/value grid | Sentence case | `ink` | Inter / Arimo | v04a, v04b |
| Quirky grotesk | Geometric grotesk with alternate a/e | 6–7 %H | Mixed case | `ink` | Space Grotesk 500 | v04a |
| Caption (book) | Palatino-like serif + bold grotesk "not" | 2.4 %H | Sentence case | `#fffff5` | Crimson Pro + Inter Bold | v04b |
| Mono caption | Monospace, bold keywords | font-size 2.7 %H, pitch 3.7 %H, ≈ 26 chars/line | Sentence case | `ink` | Roboto Mono / IBM Plex Mono | v05 |
| Year numerals | A **different display face per year** | cap 19.3 %H | Numerals | `ink` | Abril Fatface, Archivo Black, Shrikhand, Alfa Slab One, Permanent Marker, Jost 800, Barlow 500, Manrope 800 | v05 |
| Numeral serif italic | Italic Didone, bold | 5.3 %H | Lining figures, −1 % | `#222` | Playfair Display Italic 700 | v07 |
| Display rounded | Heavy rounded display (3 sizes in a block: 1.9 / 4.5 / 3 %H) | 4.5 %H | Mixed | `#222` | Baloo 2 800 | v07 |
| Ransom word | Bold old-style serif on torn newsprint, cut into 2 pieces, the second rotated ≈ −15° | 5.3 %H on an 8.2 %H strip | CAPS | `#212020` on `#c3bfbb` | Libre Caslon Text Bold | v03 |
| Handwriting | Monoline, slight right slant | 2.0 %H, pitch 2.5 %H, **centre-aligned** | Mixed | sepia `#46381f` | Nothing You Could Do / Caveat | v08 |
| Red annotations | Engineering hand caps | 1.5–2 %H | CAPS | `accent` | Architects Daughter | v04a |
| Marker label | Grotesk SemiBold caps, white on a black dry-brush strip | 3.3 %H on a 9.3 %H strip, rotated ≈ −3° | CAPS, +8 % tracking | white | Inter 600 | v01 |
| Credits | Geometric sans caps, medium | 1.05 %H, pitch 1.45 × cap | CAPS, +20 tracking | white | Outfit / Montserrat Medium | v06 |

**Vox and Chinese (CJK) roles** — Libre Franklin / Libre Baskerville / Roboto Mono, Noto Sans SC, Noto Serif SC 900, Zhuque Fangsong (vertical classical text), LXGW WenKai, subsetting and CJK reading time: see [13-vox-editorial.md §4](13-vox-editorial.md). Rules below that say "no box", "crop on purpose", "8:1 scale" and "end with a full stop" apply to collage presets only.

## 2. Pairing rules
- **Scale contrast is the hierarchy.** Pair a 16 %H headline with 2.1 %H metadata (ratio ≈ 8:1, v04a). Avoid mid sizes for body copy.
- **Text never sits in a box or a pill.** It sits directly on paper, photo or a physical strip (torn paper, marker stroke, tape).
- **Crop on purpose.** Hero headlines touch or cross the top edge. Captions may be cropped by the frame edge during a pose jump (v01).
- **One family per preset, plus one "material" face**: grotesk + marker label (explainer), serif + metadata grotesk + hand annotations (archive), serif + broken serif (duotoneBurst).

## 3. Text animation primitives
| Primitive | Timing | Component | Source |
|---|---|---|---|
| Type-on per glyph | 1 glyph every **2 frames** (12.5–15 chars/s), no fade, occasional 3-frame hiccup. Long second lines pop whole words every 4 frames | `<TypeOn perChar={2}/>` | v04a, v08 |
| Signature write | 1 glyph per 4 frames, an 8-frame pause after a comma | `<TypeOn perChar={4}/>` | v08 |
| Word stamp | 1 word every **3 frames**, full opacity on arrival | `<WordStamp perWord={3}/>` | v04b |
| Single-frame title | A complete two-line title appears in 1 frame and holds | plain conditional render | v04b |
| Pose jump | 2–3 held poses: ≈ 2× size → moved and partly cropped → final. Holds 5–8 frames, total 13–15 | `<PoseJump poses=[…]/>` fed the **posterized** frame | v01 |
| Slam and step down | Enters ≈ 1.8×, then 1.25×, then 1.0×; holds 8 and 5 frames | `SLAM` table | v01a |
| Line reveal | Opacity 0→1, blur 10 px@1080→0, rise 1.9 %H, 6–8 frames ease-out; stagger 4–6 f between lines, 22–29 f between columns; exit reversed in 3–4 f | `<LineReveal/>` | v07 only |
| Scramble decode | 1 frame of random lowercase glyphs per line, then the final text; about 1 line per frame | `<ScrambleLine/>` | v06 |
| Ghost-smear digit | 2–4 copies at 45 % / 18 % opacity offset ±30–60 % of digit height; 9–10 f per digit, slowing to 3–4 f as the counter accelerates | recipe in `references/notes/v05.md` §11C | v05 |
| Marker wipe | The strip reveals left→right in 3 steps of ≈ 11 % W over 5 frames; the next label 13 frames later | `<MarkerLabel reveal/>` | v01 |

**Never:** a fade-in of a paragraph, a slide-up of a text block (outside `thenNow`), an overshoot spring on text, or a blinking cursor.

## 4. Loading fonts in Remotion
`src/collage/fonts.ts` loads every font through `@remotion/google-fonts`. Rendering fetches them over the network, and the first render can take 30 s or more. If a still render times out, pass `--timeout=120000`, or self-host the woff2 files under `public/fonts` with `@font-face` for offline renders.
