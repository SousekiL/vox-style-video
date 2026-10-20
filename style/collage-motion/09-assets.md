# 09 · Assets: photo cut-outs and paper

The look depends on **photographic** cut-outs. Hand-drawn SVG stand-ins (`src/collage/placeholders.tsx`) are for tests only. Production assets come from this pipeline, and quality wins over speed: never ship a rough drawing where a photo belongs.

```
search (licensed) ──► pick by eye ──► cut out (Vision) ──► grade + size check ──► public/cutouts/*.png
      │ nothing good
      ▼
generate (MX, plain backdrop) ──► cut out ──► grade ──► public/cutouts/*.png
```

## 1. Decide the route per asset
| Asset type | Route | Why |
|---|---|---|
| A **real, named** person (politician, scientist, founder) | **Search only**: `--source wikidata`, then Commons category. Never generate | Likeness must be real and licensed. AI-generating a real person is off-limits |
| A real landmark or building | Search first (Wikidata P18 / Commons category); generate a generic stand-in only if the specific building doesn't matter | Viewers recognise real places |
| A historical document, artwork or archival photo | Search: `--source loc`, `--source aic`, Commons | Authenticity is the point |
| A generic object (piggy bank, house, safe, phone, coins, hand, tool) | Search Commons for an isolated photo; if the top results are cluttered scenes (usual), **generate with MX** | Generic search returns busy scenes that cut out badly; MX on a plain backdrop cuts out perfectly |
| An anonymous person (a worker, a crowd, a hand) | Generate with MX, or use an archival photo | No likeness rights involved |
| Brand logos, product designs, copyrighted characters | **Don't** reproduce them. Use a generic stand-in or a blank label | IP |

## 2. Search
```bash
python3 -I scripts/assets/find_images.py "<subject>" --source commons --source wikidata --min 1600 --limit 12 --preview --out public/assets/raw/<slug>
```
```bash
python3 -I scripts/assets/find_images.py "<subject>" --pick 3 --out public/assets/raw/<slug>
```
- `--preview` writes `preview.jpg` with numbered thumbnails. **Open it and look** before picking. Reject cluttered scenes, heavy crops, watermarks, motion blur, low light and busy edges around the subject.
- Licences kept: public domain, CC0, CC BY, CC BY-SA. Every download writes `CREDITS.md`. Carry it into the video's description or end card (CC BY/BY-SA require attribution; BY-SA also means a derived image is shared alike).
- Sources:
  - `commons`: general search.
  - `wikidata`: the entity's P18 image plus every file in its Commons category, largest first. Best for named people and landmarks.
  - `loc`: Library of Congress archival photos. Check each item's rights line.
  - `aic`: Art Institute of Chicago, CC0.
  - `openverse`: needs `OPENVERSE_TOKEN`.
- **Query craft:** add "isolated", "white background", "studio", "museum object", "archival photograph", or a period ("1950s"). Prefer frontal or three-quarter views with the whole subject in frame.
- If no licensed search result is good enough, fall back to the browser (WebSearch) only for **finding** a licensed original (museum, government archive, Unsplash/Pexels licence). Record its licence in `CREDITS.md`. Never use an image whose licence you cannot state.

## 3. Generate (MX fallback)
```bash
mx-image "<prompt>" -o public/assets/gen/<slug>.png --size 1536x1024 --quality high --provider mx
```
**Never generate anything that looks like a historical photo or document, and never put a generated image on a board that makes a factual or historical claim** (13-vox-editorial V7). Generated images are generic props only; label them "示意 / illustration" if there is any doubt. For history pieces use real evidence (archival photos, artifacts, documents, maps) found by search.

Prompt template for generic props (proven here: house, piggy bank, hand and bank facade cut out cleanly on the first try):
> *[Studio product photograph] of [subject, specific: material, view], three-quarter view, the entire [subject] fully in frame with generous margin, isolated on a plain seamless light grey studio backdrop, no ground, no shadows on the backdrop, no people, no text, sharp focus, rich photographic detail [and subtle film grain], photorealistic.*

Rules:
- Use `--quality high` only. The `--size` should match the subject's aspect (1536×1024 landscape, 1024×1536 portrait, 1024×1024 compact).
- Generate **2–3 variants** (`-n 3`) for hero assets and pick the best by eye.
- Ask for "archival black-and-white" when the preset is greyscale. It gives better tonal range than desaturating a colour render.
- Hands: "a single adult human hand reaching in from the left edge, palm down… white shirt cuff". Check fingers count and joints before use.
- No real people, logos, brand names or readable text in prompts.
- Size limit: MX outputs are at most 1536 px on the long side. After cropping, a subject is about 900–1150 px. That covers about 50 %H at 1080p or about 25 %H at 2160p sharply. For a large 4K hero, generate the subject filling more of the frame (less margin), or show it at smaller size, or put it under a halftone/duotone treatment (the dot screen hides softness).

## 4. Cut out (on device, no model download)
```bash
swiftc -O scripts/assets/cutout.swift -o scripts/assets/cutout
```
```bash
./scripts/assets/cutout public/assets/gen/<slug>.png public/assets/gen/<slug>_cut.png
```
- Uses Apple Vision `VNGenerateForegroundInstanceMaskRequest` (macOS 14+). It keeps the largest instance by default; pass `--all` to keep every instance (a person holding an object).
- Works best on plain backdrops. On busy archival photos, check the mask edge closely. If the matte is wrong, crop tighter around the subject first, or regenerate.

## 5. Grade and size-check
```bash
python3 -I scripts/assets/treat.py <cut.png> public/cutouts/<slug>.png --grade greyscale --contrast 1.2 --target-h 0.5 --frame-h 2160
```
- Trims to the alpha box (+2 % pad), erodes the matte 1 px and feathers 0.6 px, which removes background fringe.
- `--grade`: `greyscale` (explainer, redIdent), `sepia` (postcard, thenNow), `duotone --dark --light` (duotoneBurst), `muted` (diorama), `keep` (the accent object), `archival` (**vox evidence: levels only, ±10 %**, tonality untouched).
- Wikimedia rate-limits scripted downloads of originals (HTTP 429): `find_images.py --pick` downloads a 2560 px standard thumbnail (`--max-width`) with backoff.
- Contrast is applied around the subject's own median, so dark and light objects both keep detail.
- **Prints a WARNING if the cut-out would be upscaled on screen.** Treat that as a failure for hero assets.
- `--grain 0.25` adds the photocopy speckle seen on v01a photos.
- Halftone is applied at render time (`<Halftone>`), not baked in, so the dot pitch stays correct at any resolution.

## 6. Accent parts
For "one hand-tinted part" (the red bank door, the red safe dial):
1. Grade the whole object `greyscale`.
2. Make a second copy with `--grade keep`.
3. Mask the accent part (a quick polygon in the editor, or MX edit with `--image` + `--mask`), then stack the colour part over the greyscale one in React.
4. Re-colour the part to the palette accent with `filter: url(#duoRed)`-style mapping if needed.

## 7. Paper and texture scans
- Procedural paper (`CrumpledPaper`, `FlatPaper`, `GraphPaper`) is good enough for 1080p.
- For hero 4K boards, use real scans: generate with MX ("top-down flat scan of a crumpled sheet of white printer paper, even lighting, full frame, no background visible") or photograph paper yourself. Store 3–4 boil states per paper under `public/paper/`.
- Use real image sequences for physical transitions (crumple, unfold). No procedural shortcut matches them.

## 8. File layout
```
public/assets/raw/<slug>/   candidates.json, preview.jpg, cand_XX.*, CREDITS.md   (search)
public/assets/gen/          <slug>.png (MX), <slug>_cut.png (Vision)               (generate + cut)
public/cutouts/             <slug>.png  ← graded, size-checked, used by scenes
public/paper/               crumple_0..3.png, graph.png …
```
Keep `public/assets/raw` and `public/assets/gen` out of git if they are large. `public/cutouts` plus `CREDITS.md` is what a project ships.
