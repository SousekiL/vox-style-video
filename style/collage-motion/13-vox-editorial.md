# 13 · Vox editorial preset (`vox`)

The collage presets in 00–12 were measured from 8 non-Vox references. This file defines what makes a video read as **Vox**: evidence on screen, sourced and highlighted, mapped, with a camera that never freezes, at 24 fps. Collage and stop-motion are an *art-direction option* layered on top (Vox's art director picks a different anchor per video: construction paper for one, protest posters for another). Sources are tagged: **[P]** primary (vox.com, Vox YouTube descriptions and format data, a creator's own tutorial), **[I]** interview, **[T]** third-party tutorial, **[O]** reviewer observation to verify against the named video. Full citations are at the end.

Code: `src/collage/editorial.tsx`, `camera.tsx`, `map.tsx`; tokens `VOX`, `VOX_FONT`, `CLOCK.vox`, `EASE.voxCamera`/`aeEasy`/`highlight`, `SPRING.vox`, `POP_VOX`, `readingFrames`. Worked example: `src/stories/QinPole.tsx` (composition `VoxQinPole`).

## 1. Ground rules (override 00-principles for `vox`)
| # | Rule | Source |
|---|---|---|
| V1 | **24 fps composition.** Camera, maps, charts, documents, highlights and text run on 1s. Optional stepped layers (cut-out puppets) on 2s = 12 drawings/s, clean holds of 2. Paper/grain overlay re-rolls every 8–12 f. | 13/14 sampled Vox uploads are 24 fps [P S13]; 12 fps graphics "often" [T S17] |
| V2 | **One attention colour: highlighter `#FFF200`** (multiply over paper, so it reads ≈ `#F1DF00`; don't "fix" that). Inside a map or chart only, up to 2 extra data colours. A per-video accent is allowed for one motif (e.g. seal red `#B7332A` in a Chinese piece). | vox.com logo fill `#fff200` [P S1]; "highlighter-yellow" launch cards [P S2] |
| V3 | **Evidence, not illustration.** Each board shows one piece of evidence (document, archival image, map, dataset, footage, quote) and names its source on screen. Illustrative props are allowed only on boards that make no factual claim. | Atlas, Darkroom [P S12, I S9] |
| V4 | **Evidence keeps its tonality.** A photo or document under analysis gets at most one uniform levels/contrast adjustment (±10 %). Duotone/halftone only on decorative layers. | journalism practice; reviewer |
| V5 | **The camera is alive.** During holds the camera drifts (push-in 2–5 % per 5 s, linear); it only stops on a cut. Moves between focus points are eased (`EASE.voxCamera`), 1.5–7 s for camera/map moves; props 0.3–0.8 s. | Harris map workflow: eased null, 7 s fly-to, "pitch down a titch" while holding [P S11] |
| V6 | **Hard cut between arguments.** Dissolve (10–12 f@30, 8–10 f@24, linear) only between two states of the *same geometry* (a map across years, a photo → its annotated version, then/now) or inside archival montage. Never dissolve two different layouts. | [O, verify on r5Ps1TZXAN8] |
| V7 | **No generated "archival" images.** Image generators may make generic props (studio product photos) only; never anything that looks like a historical photo or document, never on a board that makes a historical claim. Label "示意 / illustration" if in doubt. | journalism; 09-assets |
| V8 | **Legibility first.** Smallest text 1.9 %H. Scale ratio ≤ 4:1. Reading time: Latin `max(2 s, words/3 + 1 s)`, CJK `max(2 s, chars/6 + 1 s)` (`readingFrames`). Don't crop headlines. | reviewer |
| V9 | **Overshoot is barely there.** Entrances use `SPRING.vox` (≤ 4 %); collage pops (+28 %), pose jumps, slams, card spins and glitches are not vox defaults. | reviewer |
| V10 | **Sound is restrained.** BGM: `documentary` (piano/strings) or a per-video style; music may drop out under reveals. SFX: marker, page turn, shutter, typewriter, map whoosh, low hit, all quiet (12-audio §3b). | [I S10, O] |

## 2. Board types
| Board | Use for | Components | Must have |
|---|---|---|---|
| **Document** | a quote from a text, a law, an article, a screenshot | `DocumentPage` + `VoxCamera` keys + `Mark` + `SourceLine` | page at rest 75–85 %H; push ×1.4–3.0 onto the passage over 45–60 f@30 (36–48@24); everything else dims to 35–40 %; highlight starts ≈ 6 f before the push ends |
| **Archival print** | a historical photo, painting, artifact photo | `ArchivalPrint` (`edge="print"` look) + `SourceLine` | cream border 2.5 %H `#F3EEE2`, shadow `0 0.6%H 1.8%H rgba(0,0,0,.35)`, ±1–3° rotation, Ken Burns 1.00 → 1.06 across its time on screen, never stopping |
| **Map** | "where" | `LandMap` (+ `rivers`, `points`) + `SourceLine` | land `#E8E2D4`, water `#C9D5D9`, strokes 0.12 %H; labels we set (no basemap labels); fly-to eased; drift during hold; **land-only by default — draw borders only from a cited historical source** |
| **Chart** | numbers | (P1: `chart.tsx`) | no frame box; baseline 0.15 %H; direct labels; key value on a highlight band; SourceLine |
| **Title card** | after the cold open, or the closing line | headline + `Mark` on one keyword + eyebrow | cut in on a music downbeat; hold 60–90 f@30; hard cut out |
| **Quote** | a speaking voice | serif 4.2–5 %H, ≤ 28 Latin / ≤ 16 CJK chars per line, lines reveal 8 f each, key phrase highlighted after the last line | attribution in mono caps |
| **Lower third** | a named person on screen | `LowerThird` | name 3.4 %H, title 2.2 %H mono, optional highlight band, hold ≥ 90 f@30 |
| **Collage (optional)** | art-directed interludes | any 00–12 collage preset, at 24 fps (stepped layers on 2s) | still sourced if it shows evidence |

## 3. Devices (specs; f@30 with f@24 in brackets)
**Highlight `<Mark>`.** `#FFF200`, multiply, opacity 0.88, slightly rough edge (`url(#markerEdge)`), −0.6…+0.4° tilt. Band: Latin from baseline −0.10 em to +0.60 em; CJK lower ~62 % of the em box; vertical CJK covers the column and sweeps top → bottom. Duration `clamp(6 + 0.6·chars, 8, 24)` f@30 (`highlightDur`), ease `EASE.highlight`, finishing on the stressed syllable. SFX `highlight` (marker, −22 dB).

**SourceLine.** 1.9 %H, mono (Latin) or Noto Sans SC (CJK), ink 70 % / white 75 %, baseline 94 %H at x 4 %W (top-left at y 4 % when burned-in subtitles are present). Fades in over 6 f after its board, no motion. Format: `Source: …` / `来源：司马迁《史记·商君列传》` / `图：… 摄，CC0` / `底图：Natural Earth`.

**Camera (`VoxCamera`, `camAt`).** Keys `{at, cx, cy, scale}` in % of the content, eased with `EASE.voxCamera`, zoom interpolated geometrically; `drift` adds a linear push (default 0.008/s ≈ 4 % per 5 s). Zoom-through (`zoomThrough`): ×1 → ×3–5 over 18–24 f, ease-in, cut on the last frame, with motion blur (`@remotion/motion-blur`).

**Map fly-to.** 60–120 f@30, `EASE.aeEasy` or `voxCamera`; points/labels fade in near the end; labels stay screen-size while the map scales. Historical borders: dashed (0.6 %H dash / 0.4 %H gap) and only from a cited source; year changes crossfade 10–12 f.

## 4. Typography
| Role | Latin | CJK (free, commercial OK) | Size |
|---|---|---|---|
| Headline / title | Libre Franklin 700–800 (≈ Balto) | Noto Serif SC 900 (history) / Noto Sans SC 700 | board 4.5–5.5 %H, title 7–12 %H; CJK tracking +4–8 %, never negative; no 。 in titles |
| Body / quote | Libre Baskerville (≈ Harriet) | LXGW WenKai (quote voice) | 4.2–5 %H |
| Classical / official text | — | **朱雀仿宋 Zhuque Fangsong** (OFL, self-hosted subset), `writing-mode: vertical-rl` | 3.4–4.5 %H |
| Labels / eyebrow / source | Roboto Mono | Noto Sans SC 400–700 | 1.9–3.4 %H |
| Subtitles | — | Noto Sans SC 500, white, 0.18 %H dark outline | 4.4 %H, baseline 92 %H, ≤ 18 chars |

vox.com loads Balto, Harriet and Roboto Mono [P S1]; inside videos the type follows each video's art direction, so the free stand-ins above are the default. CJK loading: `@remotion/google-fonts` serves CJK as unicode-range slices (only used slices download). For long scripts or offline renders, subset with `pyftsubset <font> --text-file=script.txt --flavor=woff --output-file=public/fonts/x.woff` and load with `loadLocalFont` (WOFF2 needs the `brotli` module). CJK type-on: 1 char per 3 f@30 (≈ 10 chars/s).

## 5. Beat sheet (Vox explainer)
cold open (a question + one striking piece of evidence) → title card → context (map or timeline) → evidence beats (document, archive, chart; each 3–10 s) → complication → resolution → last line → end screen 5–20 s. Social cuts compress this to hook → 2–3 evidence beats → line (the 12 s Qin piece is: evidence+question → map → document highlight → title line).

## 6. Worked example: `VoxQinPole` (12 s, 24 fps)
| Frames | Board | Evidence / source | Moves | SFX |
|---|---|---|---|---|
| 0–71 | Archival print + question | Shuihudi Qin bamboo slips, Gary Todd, CC0 (levels only) | Ken Burns 1.00→1.05, camera drift 1 %/s, highlight 相信 | printLand, highlight |
| 72–143 | Map | Natural Earth land + Yellow River / Yangtze (no borders) | fly-to ×1.05→×1.9, 栎阳 dot + label | mapFly, tick |
| 144–215 | Document | 《史记·商君列传》 typeset in Zhuque Fangsong, vertical | push ×1.45, dim other columns to 38 %, vertical highlight 予五十金 | pageTurn, highlight |
| 216–287 | Title card | — | 立木为信 with highlight on 信, seal 秦 springs on, line reveal | titleHit, highlight, seal |
Cuts at 72/144/216 land on beats of the 120 bpm `dynasty` bed. Master: −14.1 LUFS / −2.0 dBTP. QA: every board moves every frame or drifts sub-threshold (MAD over 20–24 f = 0.7–2.5); 8/9 SFX within 2 frames of their motion (the marker's soft attack reads ≈ 4 f late).

## 7. QA additions for `vox`
- Every factual visual has a SourceLine (or a citation in the description for footage); map borders match the year shown; no generated image on a historical-claim board.
- Text ≥ 1.9 %H and on screen ≥ its reading time.
- Cadence: expect run length 1 on camera/map/chart/document layers; long "holds" in `cadence.py` can be sub-threshold drift — verify with a 20–24 f MAD > 0.3 on the same board. Run length 2 only on layers declared stepped.

## 8. Not yet built (from the review, P1/P2)
`chart.tsx` (ChartBoard), QuoteCard component, HostFrame (live plate, graphics in the free third), ScreenCapture (generic window chrome), YearCounter without ghosting, 2.5D parallax inside ArchivalPrint, optional lens pass (CA ≤ 1.5 px@1080 at edges), 9:16 vox social layout, and measuring 4–6 Vox videos locally to replace proposed values with measured ones.

## Sources
S1 vox.com HTML (logo `#fff200`; Balto, Harriet, Roboto Mono) · S2 TheWrap 2014 (highlighter-yellow cards) · S3 Balto (Typographica, Fonts In Use) · S4 Harriet (Typewolf) · S5 The Long Story, "former Vox employees" · S6 Nieman Lab on Joe Posner · S7 Video Consortium, Joe Posner · S8 Storybench 2024, Joey Sendaydiego · S9 Storybench 2022, Vox Atlas · S10 Film Independent 2018, Estelle Caswell · S11 Johnny Harris, "How I Make My Maps" (youtu.be/GsojLuJpe_0) · S12 Vox YouTube descriptions (Darkroom g9bkQ7OiEdQ, P8QVBt2hh9M; Atlas cyayif_nla8, Fb9U1uoYCOc; Sahara twAP3buj9Og; Almanac 2gEwEcYnewE; Earworm p_IHotHxIl8) · S13 YouTube format metadata (`yt-dlp -F`, no download) · S14 Tubefilter, Glad You Asked · S15 SPJ, Vox Missing Chapter · S16 RNDR on Harris/Vox visuals · S17 PremiumBeat, "Replicating the VOX motion graphic look" · S20 YouTube end screens · S21 Google Fonts metadata · S22 Zhuque Fangsong, Smiley Sans, LXGW WenKai (GitHub).
