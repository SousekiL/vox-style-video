# 14 · Vox collage (`vox-collage`): the default "Vox style"

**This is what "Vox style" means in this skill by default:** real objects and people turned into **printed paper cut-outs** (coarse halftone dots, grain, torn white sticker border, real paper shadow) on **one bold flat colour per shot**, with **cut-out lettering**, paper scraps, tape and seals; pieces slap in on a stop-motion clock while the camera keeps moving. The dark editorial look (§9 of `13-vox-editorial.md`: relief maps, documents, archival footage) is a *register* used inside a collage film for maps and evidence close-ups.

Worked example: `src/stories/QinPoleCollage.tsx` (composition `VoxQinPoleCollage`, theme bake-off `VoxCollageBakeoff`). Library: `src/collage/collagekit.tsx`.

## 1. Evidence this is Vox's look
- **Thumbnail survey** of 120 recent Vox uploads (local study, `references/vox-study/`, git-ignored): consistently greyscale/duotone cut-out photos with visible halftone and grain on saturated colour fields, large discs behind the subject, headlines in yellow highlighter boxes with black text, tilted and stacked, torn edges and white sticker borders. Measured saturated palette (k-means): yellow `#F5EC0C`, pink-reds `#EB536B` `#C54C65` `#A83E4C`, blue `#2B6A99`, red `#C11314`, purple `#9F38C7`; neutrals (the greyscale photos) ≈ 35 % of pixels.
- **Inside videos**: Earworm's collage interludes (grid paper, marbled paper, cut-out album covers); third-party breakdowns describe 5–6 paper textures and 12 fps graphics.
- **Community pipelines** built on the same look: `alisa0808/vox-director` (MIT) and `Anil-matcha/vox-ai-motion-graphics-generator` (no licence; ideas only). Both generate whole collage posters with an image model and animate them with an image-to-video model. We borrow their *checklist, theme axes, bake-off gate and story layer*, but build every piece in code (crisp text, exact timing, real evidence).

## 2. Look DNA checklist (every shot)
- [ ] One **bold flat background colour**, plus paper fibre and a halftone-dot gradient from one corner (`ColorField`). Optional big disc behind the subject.
- [ ] Every object is a **printed cut-out** (`PrintCutout`): paper-filled silhouette, coarse halftone 0.5–0.65 %H at 45°, grain, **torn white sticker border ≈ 0.8 %H** (`url(#stickerTorn)`), paper drop shadow, ±1° boil per drawing.
- [ ] **Cut-out lettering** (`CutLetters`, `HeadlineStrip`): characters on torn paper chips, colours cycling, ±7° angles, slapping in one per drawing.
- [ ] **Paper-stencil scraps** (`Scraps`): zigzags, triangles, dots, half-discs, bars, starbursts. 2–4 per shot, never on the subject.
- [ ] **Tape**, **seal** or **hand-drawn strike / circle** (`Annotate`) once per shot at most.
- [ ] **Film finish** over the whole frame: per-frame grain, light vignette (`FilmLook`).
- [ ] A **source line** whenever a real artifact or a quote appears; `插画示意` / "illustration" whenever a generated figure appears.
- [ ] Never: 3D/CGI renders, glossy photos, gradients on objects, more than one typeface inside one text element.

## 3. Typography: fonts by role, one font per element
**Rule: a text element (a word, a line, a cut-out word) uses ONE font for all its characters.** Variety inside an element comes only from chip colour and angle. Different roles may use different fonts, and a film keeps the same role → font mapping throughout.

| Role | Default (free, commercial OK) | Weight | Notes |
|---|---|---|---|
| Cut-out words (`CutLetters` chips) | **黑体 Noto Sans SC** | 900 | the loudest role; 12–17 %H |
| Key title (the film's line) | **宋体 Noto Serif SC** | 900 | 9–12 %H on a highlighter strip |
| Questions, info strips, numbers | 黑体 Noto Sans SC | 900 | 4.5–9 %H |
| Classical quotes, aphorisms, seals | **楷体 LXGW WenKai** (OFL; self-hosted subset) | 500 | quotes from ancient texts always in 楷体 |
| Official / documentary text (optional) | 仿宋 Zhuque Fangsong (OFL; subset) | 400 | vertical documents |
| Labels, source lines, tags | 黑体 Noto Sans SC | 400–700 | 1.9–2.6 %H |
| One expressive accent (optional, ≤ 1 element per film) | Ma Shan Zheng 毛笔 (OFL) | 400 | e.g. a single exclamation; never mixed into a chip word |

- Subset self-hosted CJK fonts per film: `python3 -I scripts/fonts/subset_cjk.py <font.ttf> public/fonts/<name>.woff <story files…>` (collects every CJK character in the sources). Load with `loadLocalFont('<neutral name>', 'fonts/<name>.woff')`; give subsets a neutral family name (OFL reserved-name rule) and keep the OFL text next to the file.
- Commercial fonts (e.g. 苍耳今楷) only after the user confirms the licence covers video use.
- Latin pieces: Libre Franklin 800 for chips, Libre Baskerville for quotes, Roboto Mono for labels.
- **繁體中文 films** use `VOX_FONT_TC` (Noto Sans TC 900 for chips and strips, Noto Serif TC 900 for the title, LXGW WenKai TC for seals and quotes) so glyphs take Taiwan forms; the role map stays the same. Big numbers get their own role (Libre Franklin 800).

## 3b. 9:16 (vertical) layout
- Portrait-only films: x in % of width, y and sizes in % of height; CJK chips 6–7.5 %H, strips 2.4–4.6 %H, numbers up to 15 %H.
- Keep titles at y ≥ 6.5 % and source lines clear of content from y 90 %: a camera push of 1.05× already clips anything nearer the edge. Check the LAST frame of every shot.
- Shared stories (landscape + portrait): `L(landscape, portrait)` from `useShot`, short-edge units `u = min(W, H)` for cut-out widths; `SourceLine` wraps in portrait.

## 3c. Data and politics (polls, elections)
- Every number on screen carries pollster, fieldwork dates, sample and margin of error (a method card or the source line).
- One colour and one side per candidate for the whole film (split bars: candidate A left, undecided grey middle, candidate B right); same portrait size and screen time for each; shot backgrounds avoid party colours.
- When polls disagree, show both and explain the method differences; never pick one as "the" result. Worked example: `src/stories/TaipeiPoll2026.tsx`.

## 4. Palette themes and the bake-off gate
Themes live in `THEMES` (`QinPoleCollage.tsx`); each gives six shot colours, disc tints, chip colour pairs, strip colours, an accent and scrap colours.

| Theme | Shot colours | Fits |
|---|---|---|
| `voxPop` (measured) | yellow · wine · blue · pink · yellow · rice + vermilion disc | default, explainers, social |
| `chineseInk` | rice paper · ink · rice · vermilion · ink · rice | Chinese history and culture |
| `newsprint` | cream · deep red · mustard · charcoal | news, economics, editorial |
| `swissRed` | red · white · black | tech, finance, punchy ads |

**Gate: before rendering a film, render the bake-off** (the same shot frozen at the same frame in all themes, 2×2) and let the user pick:
```bash
npx remotion still src/index.ts VoxCollageBakeoff out/bakeoff.png --props='{"shot":0,"frame":40}'
```
(It is a 1-frame 24 fps `Composition`, not a `<Still>`: Stills run at fps 1, which breaks drift and fades.) Add themes by composing the axes medium · era · palette · type · finish (vox-director's dimension bank is a good vocabulary).

## 5. Motion
- **Two clocks**: collage pieces on **2s** (`s = Math.floor(frame / 2)` at 24 fps = 12 drawings/s): entrances `SLAP` `[1.42, 1.12, 0.96, 1.0]`, `DROP_Y`, `SLIDE_X`, stepped walk cycles (pose tables). The camera moves **smoothly** on 1s (`VoxCamera` drift 1–4 %/s or keyed push/pan/tilt).
- **Vary the camera move between adjacent shots** (push-in → pan → pull-out → tilt → push-in → near-static payoff). One move per shot.
- **Stagger**: chips one per drawing; a new element every 2–4 drawings; at most one "hero" entrance per shot.
- **Boil**: cut-outs wobble ±0.6–1° per drawing; scraps ±3°; text chips hold still once landed.

## 6. Story layer (borrowed structure)
- **Hook ≤ 3 s**: a bold question or object (the Qin piece opens on "一根木头 / 能值多少钱？").
- **Arcs**: `hook_payoff` (default), `timeline` (history), `pas` / `bab` (ads), `how_it_works`, `man_in_hole`.
- **Shots**: 2 s for social cuts (one bar at 120 bpm); 3–6 s for narrated explainers; 2 shots per beat (wide with headline, detail without). Shot sizes: EST_WIDE · WIDE · MEDIUM · CLOSE · DETAIL.
- **Payoff**: the title line + a seal or stamp, held a bar.

## 7. Assets for collage
- **Real artifacts and documents first** (search; 09-assets): keep them recognisable, halftone allowed because they are presented as printed clippings, always with a source line.
- **People and scenes with no photos** (ancient history): generate **original woodblock / engraving-style illustrations** with MX, never photoreal, and label them `插画示意`. Prompt (proven): *"Traditional Chinese woodblock print illustration, bold black ink linework with flat cross-hatching, no gradients, high-contrast black and white, original artwork, isolated on a plain pure white background, no text, no seal, no border: {subject, full body, whole figure in frame with margin}"*. Generate 2 variants, pick by eye, cut out with Vision.
- **Generic props**: studio product photo on grey (09 §3), then halftone.
- Real named people: licensed photos only (never generated likenesses).

## 8. QA additions
- One font per text element; role map unchanged across the film.
- Every shot passes the §2 checklist; no text cropped by the frame edge after the camera move (check first and last frame of each shot).
- Source line not covered by a cut-out (move it to the top when needed).
- Cadence: collage layers show the 2s clock; with per-frame grain and camera drift the whole-frame `cadence.py` reads mostly 1s, which is correct.
- Master −14 LUFS / ≤ −1.5 dBTP; cuts on downbeats.
