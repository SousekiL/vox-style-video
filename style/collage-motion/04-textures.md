# 04 · Textures and materials

Code: `src/collage/materials.tsx`, `src/collage/shapes.tsx`, `src/collage/filters.tsx` (render `<CollageFilters scale={height/1080} seed={…}/>` once per composition). Check them visually with the still `TextureSheet` (`npx remotion still src/index.ts TextureSheet out/sheet.png`).

## 1. Material table
| Material | Measured | Build in code | Component |
|---|---|---|---|
| Crumpled paper | neutral `#e5e4e7`, crease σ ≈ 7 levels, facets 30–80 px | `feTurbulence` (0.012, 4 oct) → `feDiffuseLighting` (az 225°, el 52°) → multiplied onto a flat colour | `<CrumpledPaper color seed strength/>` |
| Real crumple scans | preferred for hero boards | 3–4 scans, cycle per boil state | `PAPER_SCANS[boil % n]` |
| Flat / plaster paper | σ ≤ 1 (v02, v05) or ±4 % low-frequency stains (v07) | `feTurbulence` 0.006 → alpha spots over a flood | `<FlatPaper color mottle/>` |
| Graph paper | cell 2.7–3 %H, blue-grey lines on `#e8edf4` (v01); 1.8 %H dark-red lines on red stock (v04b); pale green (v04a) | two `repeating-linear-gradient`s | `<GraphPaper cellPctH line bg rotate/>` |
| Newsprint halftone | pitch **0.74 %H @ 45°** (v04a), **0.47 %H @ 45°** (v04b), **0.58–0.83 %H @ 17–18°** (v01) | SVG filter: luma + tiled radial dot field, arithmetic threshold (`k2=k3=gain`, `k4=0.5−gain`), ink-tinted, masked by source alpha | `<Halftone pitchPctH angle ink/>` |
| Duotone | two inks mapped from luminance | `feColorMatrix saturate 0` → `feComponentTransfer` tables | `url(#duoRed)` etc. |
| Torn edge | wavy at a 20–40 px scale, 1 px AA, **no white core, no shadow** (v03) | `feTurbulence` 0.018 → `feDisplacementMap` scale 14 | `filter: url(#torn)` |
| Torn edge with fibre | 1–2 px lighter rim (paper core), v03 note paper | displaced alpha + dilated rim flood under the body | `url(#tornFibre)` |
| Torn strip | jagged polygon, period ≈ 1 %H, 2–3 % W wide | seeded polygon points | `<TornStrip/>` |
| Tape | olive-lime `#b8b670`, 1.5–3 %H thick, 2 px feather, jagged short ends (v01); translucent beige α 0.7 (v04a) | polygon + `blur(0.6px)` | `<Tape/>` |
| Pink grid circle | fill `#ffdfd2`, grid lines `#e88a7a` at 45° (pitch ≈ 3 %H), watercolour blots, 2–3 px feather | pattern + turbulence blots + radial-gradient mask | `<GridCircle/>` |
| Flat pastel shapes | multiply, ±4 levels grain | SVG path, `mix-blend-mode: multiply` | `<FlatShape kind/>` |
| Sticker border | 0.4 %H hand-cut cream `#f5ecd9`, no shadow (v08 objects only) | dilate alpha → roughen → flood → merge under | `edge="sticker"` |
| Feathered halo | 1–1.4 % W, cream `#f6f7e4`, soft (v07 architecture only) | dilate 8 → blur 3 → flood → merge under | `edge="halo"` |
| RGB fringe | 2–3 px magenta top-left, blue bottom-right (v04b) | offset alpha copies, flooded | `edge="fringe"` |
| Red pencil | grainy waxy stroke 3–5 px, broken | stroke + turbulence alpha mask | `<Scribble/>` + `url(#pencil)` |
| Marker strip | black dry-brush, ragged ends | path + `url(#torn)` | `<MarkerLabel/>` |
| Chalk / crayon doodle | streaky, rough ends (v08 asterisks) | displacement scale 2.5 | `url(#crayon)` |
| Ink-bleed type | swollen, blobby terminals | dilate → displace → blur → hard alpha threshold | `url(#inkBleed)` / `<BrokenLine/>` |
| Grain | ±4 levels on flats, multiplied 6–12 % | turbulence 0.85, **seeded from the shot clock** | `<Grain seed/>` |
| Film dust | ≈ 1,500 specks (median 2 px, p90 14 px) + hairs, screen-blended (v06) | seeded dots + rotated thin rects; plates on holds 4,4,3,4 | `<Dust plate/>` |
| Warp boil | re-seeded displacement, mean 0.25 %H, p90 0.55 %H (v01a) | `url(#warp)` with `seed` changing every 7–8 f | `CollageFilters seed` |
| Paper-prop drop shadow | down-right only, ≈ 0.55 opacity at the edge, fades over ≈ 13 %H (v01a check/contract) | `drop-shadow(1.6%H 2.2%H 3.5%H rgba(0,0,0,.55))` | CSS |
| Card shadow (scroll) | very soft, ≈ 10 % darken | `drop-shadow(0 4px 15px rgba(60,50,40,.18))` | CSS |
| Photo card border | aged cream `#bfb8a3`, 3.7 %H, 2 px dark inner line (v05) | padding + inset box-shadow | CSS |

## 2. What is NOT in the style
No vignettes (measured in v02, v04, v06 and v07). No light leaks, no lens flares, no chromatic aberration on the whole frame (v04b's fringe is per cut-out only). No gradients on paper. No glossy bevels, rounded UI cards or glow, except the v06 ring strobe.

## 3. Halftone details
`<Halftone>` filters its children as follows:
1. Luminance L via `feColorMatrix`.
2. A dot field D ∈ [0, 1]: a radial gradient tile, `feImage` + `feTile`, at the pitch in px.
3. `feComposite arithmetic`: out = gain·(L + D − 1) + 0.5. Pixels go ink where L + D < 1, so dark areas get bigger dots.
4. Tint to `ink`, then mask by source alpha (transparent stays transparent).
5. The wrapper rotates by `angle` and the child counter-rotates, so only the screen is angled.

Use `gain` 10–14 for crisp print and 4–6 for a softer photocopy. Give the halftone child a mid-grey background card (`#9a9a9a`) to get the "printed photo rectangle" look from v04a.

## 4. Boil: how often and on what
| Preset | What boils | Interval |
|---|---|---|
| explainer | paper scans, flat shapes (±7°, ±1 % W, ±2 %H), tape | 7–8 f (busy boards), 15 f (calm boards) |
| archive | paper mottle | every 3 f on quiet pages, 2 f with motion; scribbles redraw every 2 f |
| duotoneBurst | paper brightness ±3 %, card edges ±0.5 %H | irregular holds of 1–5 f |
| redIdent | dust plates | holds 4,4,3,4 at 12 fps |
| earth, postcard, thenNow, diorama, scroll | **nothing**; held layers are pixel-still | — |

## 5. Performance at 4K
SVG filters cost GPU and CPU time in headless Chrome. At 3840×2160:
- `CrumpledPaper` is the most expensive. Pre-render 4 boil states to PNG once (`npx remotion still` on a `PaperPlate` comp) and swap them with `<Img>`.
- Pass `scale={height/1080}` to `CollageFilters` so displacement and dilate radii scale with resolution.
- Use `--concurrency` equal to half your cores. Filters are CPU-bound in software rendering.
