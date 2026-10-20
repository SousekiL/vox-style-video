# Reference analysis brief (shared by all analysis agents)

## Goal
We are reverse-engineering one visual style from 8 Pinterest reference videos. Most of them are mixed-media **paper-collage motion graphics** for explainer videos: cut-out photos, paper textures, hand-made shapes, stop-motion-like movement. Your notes will be merged into a style system that a developer uses to rebuild this look **in code** (Remotion / React + SVG/CSS/WebGL, rendered at 1920×1080 or 2160×3840). Every observation must end up as something a programmer can set, measure, or build. Avoid vague words like "dynamic" or "organic" unless you add numbers.

## Your material (already prepared; do not re-download)
For a video `vNN`, everything is in `references/analysis/vNN/`:
- `frames/NNNNN.jpg`: **every** source frame, long side 540 px. Frame N is at time (N-1)/fps.
- `sheets_all/`: every-frame contact sheets, 24 consecutive frames each (6×4), labelled `f<frame> <time>`.
- `sheets_overview/`: sampled sheets at ~4 fps, good for orientation first.
- `keyframes/`: native-resolution PNGs at the start and middle of each detected shot. Use these for texture, edge and typography detail.
- `stats.json`: fps, size, detected shots with k-means palettes, `held_frame_ratio`, `identical_run_length_hist`. Run length 2 or 3 means the animation is stepped "on twos/threes" (stop-motion cadence).
- `motion.csv`: per-frame mean absolute difference to the previous frame (0–255). Spikes are cuts or big moves; zeros are held frames.
- Source video: `references/videos/vNN_*.mp4` (play it with ffmpeg/ffprobe if you need native frames: `ffmpeg -ss <t> -i <video> -frames:v 1 out.png`).

## Method (do all of it)
1. Read `stats.json` and skim the overview sheets to get the structure.
2. **Go frame by frame**: open every sheet in `sheets_all/` that belongs to your range, in order. Where something moves or transitions, open the individual `frames/` images and check consecutive frames one by one.
3. **Measure**. For at least 4 characteristic moves (more if the video is long), track an element across consecutive frames: write down its position, scale and rotation per frame, in % of frame width/height. From that, work out duration in frames and seconds, the easing curve (linear / ease-out / overshoot-and-settle / stepped), overshoot %, and settle frames. You may write small Python helpers (numpy and PIL are available; run them with `python3 -I`) in `references/analysis/vNN/work/` to crop, diff or track. Never put scripts inside `frames/`.
4. Measure texture details on the native keyframes: border width of cut-outs (px at native res and % of frame height), drop-shadow offset, blur and opacity, grain size, paper colour (sample hex values from the PNG with PIL), halftone dot pitch.
5. Check cadence: from `motion.csv` and the run-length histogram, decide whether motion is stepped (on 2s/3s), at what effective fps, and whether elements "boil" (jitter while still). If so, give the amplitude in px and % of frame.

## Write your notes to `references/notes/<id>.md` with exactly these sections
1. **Summary**: 3–5 sentences. What the piece is, overall look, what makes it recognisable.
2. **Format**: resolution, aspect, fps, duration, effective animation fps, shot count.
3. **Shot list**: table of time range | frames | what is on screen | layout | entry/exit move.
4. **Colour**: palette with hex values and roles (paper background, ink/black, accent 1/2, photo treatment such as greyscale, duotone or tinted). Give approximate % of screen area for each. State the rules you see (for example, "only one saturated accent per frame").
5. **Typography**: every text style you see. Classification (serif/grotesk/typewriter/hand-lettered/cut-out ransom letters), weight, case, tracking, size as % of frame height, colour, background treatment (label, tape, torn strip), and how text animates in and out (per-letter? per-word? stamped? typed?). Name the closest free Google Font for each style.
6. **Layout and composition**: grid, focal placement, number of depth layers, overlap rules, margins, how much of the frame is empty, framing devices (frames, circles, grids, arrows).
7. **Textures and materials**: paper types (crumpled, kraft, newsprint, graph paper), grain, halftone, torn and cut edges, outlines/stroke around cut-outs, shadows (numbers), tape, stamps, scribbles, light leaks or vignettes. For each one, say how to make it in code (SVG `feTurbulence` + `feDisplacementMap`, a noise PNG overlay with blend mode, a CSS mask, and so on).
8. **Motion vocabulary**: a numbered list of named motion primitives (for example "pop-in with overshoot", "slide-stop", "wiggle boil", "hand-place", "scale-punch"). For each: what it looks like, measured duration in frames @ source fps and in seconds, easing with a cubic-bezier or spring guess (`damping`, `stiffness`, `mass`), stagger between elements, stepped or smooth, and the frames you measured it on.
9. **Transitions**: every scene change, broken down frame by frame (what happens on frame 0, 1, 2…). Classify them: hard cut, wipe by paper, push, match-cut on shape, zoom-through, circle mask, and so on.
10. **Camera**: pans, zooms, parallax between layers, shake. Give speeds in % of frame per second.
11. **Code recipes**: how to rebuild the 3–6 most distinctive things in Remotion (TypeScript/React). Use concrete `interpolate`/`spring` parameters, SVG filter snippets and stepping logic, for example `const stepped = Math.floor(frame / 2) * 2`. Keep the snippets short and correct.
12. **Signature details and anti-patterns**: what MUST be there for the look to read correctly, and what would break it.
13. **Confidence**: what you measured versus what you guessed.

## Rules
- Describe the style. Don't transcribe long on-screen copy or reproduce logos. A short phrase that shows a type treatment is fine.
- Numbers beat adjectives. Cite frame numbers as evidence (for example "f312–f318").
- Write only inside `references/notes/` and `references/analysis/<your video>/work/`. Do not edit other files.
- Your final reply to the orchestrator should be the path of your notes plus 5 one-line headline findings. The notes file holds the detail.
