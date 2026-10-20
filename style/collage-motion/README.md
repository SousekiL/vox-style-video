# Collage Motion: a style system for paper-collage explainer animation

This is a code-first instruction system for building high-resolution, mixed-media **paper-collage motion graphics** (explainers, brand stories, social loops) in Remotion. It was reverse-engineered from 8 reference videos. Each was analysed frame by frame, and every number below traces back to a measurement in `references/notes/`.

## How to use these files

| Step | Read | You get |
|---|---|---|
| 1. Pick a preset | [07-presets.md](07-presets.md) | One of 9 tested looks, with its palette, clock, textures and moves |
| 2. Learn the non-negotiables | [00-principles.md](00-principles.md) | 12 rules that make any preset read as "collage motion" |
| 3. Build | [08-remotion-implementation.md](08-remotion-implementation.md) | Architecture, the `src/collage` API, render settings |
| 4. Fill the details | [01-color](01-color.md) · [02-typography](02-typography.md) · [03-layout](03-layout.md) · [04-textures](04-textures.md) · [05-motion](05-motion.md) · [06-transitions](06-transitions.md) | Exact values and recipes |
| 5. Get assets | [09-assets.md](09-assets.md) | How to source and treat photo cut-outs and paper scans |
| 6. Script the explainer | [10-explainer-playbook.md](10-explainer-playbook.md) | Beat sheet, scene templates, pacing |
| 7. Verify | [11-qa-checklist.md](11-qa-checklist.md) | Measurable checks, including the cadence test on your own render |

## The style in one paragraph
Photographs are cut out of their backgrounds and pasted, without outlines or shadows, onto real paper: crumpled sheets, graph paper, newsprint, plaster. Each frame carries **one** saturated accent against greyscale or sepia photos and flat pastel shapes. Everything moves on a **stepped clock** (10–12.5 drawings per second), so motion reads as hand-placed stop motion: props pop in with overshoot, captions teleport between held poses, and the paper re-rolls its texture a few times a second while the photos stay pixel-still. Scenes change by hard cut, carried by camera beats (a whip or push before the cut, an expo settle after it) or by physical paper (ink blackout, a sliding sheet, a tile mosaic). Nothing cross-dissolves.

## Where things live
| Path (repo / bootstrapped project) | In the installed skill | What |
|---|---|---|
| `style/collage-motion/` | `references/` | these docs (this file becomes `references/00-index.md`) |
| `references/notes/` | `references/notes/` | the 10 per-video analyses, the source of every number |
| `src/collage/` | `template/src/collage/` | the primitive library the docs reference (TypeScript, Remotion 4) |
| `src/demo/` | `template/src/demo/` | `ExplainerDemo` (12 s, 3 presets) and the `TextureSheet` still |
| `scripts/prep_reference.py`, `scripts/cadence.py` | `scripts/` | frame/cadence/palette analyser; run it on references AND your renders |
| `scripts/assets/` | `scripts/assets/` | `find_images.py` (licensed search), `cutout.swift` (Apple Vision), `treat.py` (grade + size check) |
| `skill/` | `SKILL.md`, `scripts/new_project.sh` | the Claude Code skill; install with `bash scripts/install_skill.sh` |

Run the demo:
```bash
npm run studio
```
```bash
npx remotion render src/index.ts ExplainerDemo out/demo.mp4
```
```bash
npx remotion render src/index.ts ExplainerDemo4K out/demo-4k.mp4
```

## Reference index
| id | Source | What it contributes | Preset |
|---|---|---|---|
| v01 | Collage-style finance explainer (70 s, 30 fps) | The core explainer grammar: 12 fps grid, pop-ins, pose-jump captions, whip-pan cuts, paper re-roll boil | `explainer` |
| v02 | Rome collage diorama (10 s, 24 fps) | A smooth diorama variant: one cluster on a flat page, a slow push-in, dissolves | `diorama` |
| v03 | "Collage" (5 s, 30 fps) | Earth palette, 10 fps 3-3-3-4-2 cadence, depth slots, a mouth-matte ending | `earth` |
| v04 | Brand anniversary film (89 s, 25 fps) | Part A: archive editorial pages, type-on, pencil scribble boil, paper transitions. Part B: duotone burst, tile mosaic | `archive`, `duotoneBurst` |
| v05 | Brand timeline story (6 s, 50 fps) | A scroll-story variant: year counter in many typefaces, ghost echo glitch, vinyl disc iris | `scroll` |
| v06 | Bird & cameras ident (15 s, 12 fps) | A one-hue ident: linear card spins, ring strobes, film dust | `redIdent` |
| v07 | AE collage, filmed off a monitor (13 s) | "Then and now": a 12 fps old object next to a smooth modern one, line reveals | `thenNow` |
| v08 | Travel postcard (17 s, 30 fps) | Hold-jump entries, mixed loop cadences, handwriting, stamp payoff | `postcard` |
