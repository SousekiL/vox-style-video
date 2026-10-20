---
name: vox-style-video
description: Vox-style editorial explainers in Remotion (24 fps; documents, highlights, archival prints, maps, sources) with optional paper-collage registers (photo cut-outs on paper, stepped stop-motion). Use when the user asks for a Vox-style / editorial / collage / cut-out / mixed-media explainer, history or brand story, wants to replicate this look, or needs evidence images, cut-outs, background music or sound effects for such a video.
---

# Vox-style video (collage motion)

Build mixed-media collage explainers in code: greyscale/treated **photo cut-outs** pasted on real paper, **one accent** colour per frame, everything on a stepped **clock**, scene changes by hard cut with camera beats or by physical paper. Every rule and number lives in `references/` (measured frame-by-frame from 8 references; sources in `references/notes/`). Read `references/00-index.md` once per task, then the files each step names.

Style, not brand: never reproduce Vox (or any) logos, idents, music or copy. Never AI-generate a real person's likeness.

## Steps

### 1. Brief → preset
"Vox" in the request → preset **`vox`**: read `references/13-vox-editorial.md` first, **§9 (the bold look, measured from real Vox videos) is the default**: dark stage, film grain, oversized cropped type, labels in colour boxes, red tags, hand-drawn annotations, dark relief maps, a cut every 1.5–3 s; plus 24 fps, evidence boards, highlights, source lines and a drifting camera. Use the light paper boards (`vox-light`) only for calm, document-heavy pieces. Paper collage / cut-out / stop-motion requests → a collage preset in `references/07-presets.md` (explainer, archive, earth, postcard, thenNow, diorama, scroll, redIdent, duotoneBurst) and `references/00-principles.md`. A vox film may use a collage preset as one art-directed register.
**Done when:** you can state the preset, fps (vox: 24) and clock per layer, attention colour, sourcing plan (what evidence each board shows and where it comes from), deliverable size and duration, and the user has seen that one-line choice.

### 2. Project
New project: `bash ~/.claude/skills/vox-style-video/scripts/new_project.sh <dir>` (copies `template/`, compiles the Vision cut-out tool, installs, typechecks). Existing project: copy `template/src/collage` and `scripts/` in by hand.
**Done when:** `npx tsc --noEmit` passes and `npx remotion still src/index.ts TextureSheet out/sheet.png` renders (look at it).

### 3. Shot list
Follow `references/10-explainer-playbook.md` (vox: the beat sheet in `13-vox-editorial.md §5`): one claim per **board** (vox 3–10 s; collage 2–5 s), each with its **evidence + source** (vox) or one **hero** noun you could photograph (collage), one verb from `references/05-motion.md`, a transition from `references/06-transitions.md`, text only on key phrases. Write it in the playbook's YAML format.
**Done when:** every second of the voice-over/duration is covered and every board names its hero asset, verb, transition and clock.

### 4. Assets — photographic, every one
Run the pipeline in `references/09-assets.md` for every hero and supporting object. **Evidence (anything historical or factual) is searched, never generated**; it keeps its tonality (`treat.py --grade archival`) and gets an on-screen `SourceLine`. Generated images are generic props only, never on a board making a claim. Route per its §1 table: real people/landmarks/archival → **search** licensed sources (`scripts/assets/find_images.py … --preview`, open the preview, `--pick`); generic objects, hands, anonymous people → search first, and when results are cluttered scenes, low-res or unlicensed, **generate with MX** (`mx-image … --quality high`, plain grey backdrop prompt from §3, 2–3 variants for heroes). Then `scripts/assets/cutout` → `scripts/assets/treat.py` with the preset's grade.
Quality bar: a hand-drawn/SVG stand-in is never an acceptable production asset; reject candidates with clutter, watermarks, blur, bad hands, wrong era; heroes must pass treat.py with no upscale WARNING (else regenerate larger/tighter or shrink on screen or halftone it).
**Done when:** `public/cutouts/` holds one graded PNG per asset in the shot list, you have looked at each one composited on the preset paper, and `CREDITS.md` exists for every searched asset.

### 5. Sound: BGM and SFX are separate jobs
Read `references/12-audio.md`. **BGM**: one music bed for the whole video. Search with `scripts/audio/find_audio.py --kind bgm` (Incompetech, ccMixter, FMA, Commons; Pixabay by hand). If nothing fits the mood, length or tempo, compose one with `scripts/audio/compose_bgm.py` (style per preset; pick the BPM so planned cuts land on bar lines, using `beats.json`). **SFX**: cues only on physical motion. Search with `--kind sfx` (Freesound with `FREESOUND_API_KEY`, Commons), else use the Tone.js palette (`node scripts/audio/tone_sfx.mjs`). Never use a music track as an SFX or a long SFX as the bed.
**Done when:** one BGM file (+ `beats.json` or a measured tempo) exists, the cut grid is snapped to its bars, every SFX event in the shot list has a sound, and every library pick has a `CREDITS.md` line with no NC/ND licence (unless the user confirmed personal use).

### 6. Build
Build boards with `src/collage` (API map: `references/08-remotion-implementation.md` §1–2; values: `01-color`, `02-typography`, `03-layout`, `04-textures`). Build ONE board end to end first and run step 7 on it before building the rest. Every animated value, pose frame, boil seed and grain seed of a board derives from that board's **clock** (`posterize`/`drawingIndex`), never from the raw frame.
**Done when:** all boards render, and stills at 3 points per board pass the frame checks in `references/11-qa-checklist.md` §1 (look at them).

### 7. QA — cadence and sound go green
Render, then `python3 -I scripts/prep_reference.py out/render.mp4 out/qa` and `python3 -I scripts/cadence.py out/qa/motion.csv <start:end per board>`.
Add `<Bgm>` once and an `<SfxTrack>` cue sheet built from the same pose/step tables as the visuals; render; `python3 -I scripts/audio/master.py out/render.mp4 out/master.mp4`.
**Done when:** each stepped board reads only its clock's hold lengths (12 fps grid → {2,3}; on 2s → {2}) with stray 1-frame runs ≤ 2 % — vox boards read run length 1, and any long "hold" shows a 20–24 f MAD > 0.3 (sub-threshold drift) — every vox board passes the journalism checks in `11-qa-checklist.md` §0, the master reads −14 LUFS ±1 / true peak ≤ −1.5 dBTP, SFX onsets (`aubio onset`) sit within 2 frames of their cues, and every item in `11-qa-checklist.md` §3–6 is ticked. A red check means a layer is off-clock or a cue is off-frame: fix it, re-render, re-measure.

### 8. Deliver
1080p proof, then the 2160p master (`ExplainerDemo4K` pattern; ProRes HQ for editors). Deliver the mastered file. Report the file paths, the cadence and loudness results, and the credits list (images + BGM + SFX).

## Analysing new references
To extend the style from new reference videos: download them, run `scripts/prep_reference.py` per video (every frame, contact sheets, keyframes, palette, cadence), and give parallel analysis agents `references/notes/ANALYSIS-BRIEF.md`. Fold measured results into the matching `references/` file and `template/src/collage` (with a `// source vNN fA–fB` comment).
