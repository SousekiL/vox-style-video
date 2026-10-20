# 07 · Presets

Each preset is a tested combination of palette, clock, materials, moves and transitions, measured from one reference. The palette key matches `PALETTES` in `src/collage/tokens.ts`. Start from the closest preset and change as little as possible.

| Preset | Best for | Clock | Boil | Signature move | Signature transition |
|---|---|---|---|---|---|
| **`vox`** | **Vox-style editorial explainers: documents, archival prints, maps, charts, sources** | **24 fps on 1s (+ optional stepped layers on 2s)** | **paper overlay every 8–12 f** | **camera drift, highlight sweep, document push** | **hard cut; state dissolve; map fly-to** |
| `explainer` (collage, not Vox) | Collage explainers with narration (finance, science, how-it-works) | 12 fps grid | paper every 7–15 f | pop-in +28 %, pose-jump captions | whip-pan / push pose + settle |
| `archive` | Brand history, editorial, documentary chapters | on 2s | paper on 3s, scribbles on 2s | type-on 2 f/char, medium swap | recede to cut, ink blackout, slanted sheet |
| `earth` | Short poetic pieces, intros, emotional beats | 10 fps (3-3-3-4-2) | none | linear slides with hard stops, depth slots | slide-over cover, matte iris |
| `postcard` | Social loops, travel, product moments, greetings | smooth + per-loop cadences | none | hold-jump entries, handwriting 2 f/char | stamp payoff, then a cut to black |
| `thenNow` | Before/after, history, "how it changed" | 30 fps + 12 fps old object | none | line reveal, long glide | object relay in place |
| `diorama` | Calm establishing shots, places, museums | smooth 24/30 | none | continuous off-centre push-in | dissolves inside one shot (the only preset that allows them) |
| `scroll` | Timelines, chronologies, web-story recaps | smooth 50/60 + stutter | none | year counter in many typefaces, ghost echo | disc iris |
| `redIdent` | Logos, idents, credits, loops | native 12 fps | dust plates 4,4,3,4 | linear card spin 15°/frame | edge-on swap, block glitch |
| `duotoneBurst` | High-energy montage, fact bursts, launch teasers | 25 fps + irregular boil | cards on 1–5 f holds | word-stamp titles, broken serif | tile mosaic, window grow |

---

## explainer (v01)
- **Look:** white page, cool-grey crumpled sheets that do not fill the frame, graph strips, pastel discs (green, pink grid, salmon) behind greyscale photo heroes, one red-orange accent part, lime tape, thin black arrows and sparkles.
- **Type:** Inter Tight 700, sentence case, headline cap 8.2 %H; marker labels for keywords.
- **Motion:** everything on 12 fps. Props pop in (`POP`), captions jump between 3 poses, headlines slam and step down, heroes may swing (pendulum) or pump.
- **Camera:** locked during holds. Shots open with a zoom-out settle or a whip-in, and end with a whip-out or a push pose.
- **Pacing:** one shot every 2–5 s; a beat every 0.5–1 s inside a shot.
- **Demo:** `ExplainerDemo` shot A.

## archive (v04 part A)
- **Look:** near-white pages and black night pages. Newsprint halftone photos, cream design sheets, taped cards, torn rings, red-orange pencil scribbles, hand annotations.
- **Type:** a 16 %H serif cropped by the top edge, typed 2 f/char; tiny metadata grotesk; an ink-bleed second line.
- **Motion:** on 2s. Medium swap, scribble boil, echo trails, card swaps every ≈ 8 f, accelerating montage (holds 4–7 f, then nine 2-frame cuts).
- **Transitions:** recede to cut, unfold, crumple away, ink blackout, slanted sheet.
- **Demo:** `ExplainerDemo` shot B.

## earth (v03)
- **Look:** cream sky, olive crumpled and red felt torn papers slipped *behind* a colour landscape photo, khaki photos, a ransom-cut newsprint word, a real photographed hand puppeteering props, a rotoscoped figure walking in place.
- **Motion:** 10 fps, linear slides of 16–18 %H per drawing, ease-out rises, no boil, no camera. One prop at a time, entering from the nearest edge.
- **Ending:** a mouth photo whose opening closes over the collage (matte iris).

## postcard (v08)
- **Look:** a locked, dense base plate (teal sky, sepia photos, live sea footage), a tilted cream postcard, objects with cream sticker borders, chalky yellow doodles.
- **Motion:** entries as 2–3 hold-jump poses about 4 f apart; concurrent loops at different rates (spins 18°/s smooth, asterisks on 5s, car wobble); handwriting at 2 f/char sets the length of the piece.
- **Payoff:** a red-orange stamp springs on (+26 % / −8 %, 6 f) on the frame the signature ends; hard cut to black.

## thenNow (v07)
- **Look:** a sepia archive photo of a building with a cream feathered halo and a white torn strip, plaster paper sky and ground, the old object in greyscale and the new object as the only colour.
- **Type:** two caption columns framing the landmark; italic Didone numerals and heavy rounded display lines.
- **Motion:** line reveal (fade, unblur, 1.9 %H rise); the old object at 12 fps, the new one smooth with motion blur and a 48 f glide; holds of 3.5 s or more.

## diorama (v02)
- **Look:** a single museum-catalogue cluster on a flat warm page (73–83 % empty), ink connector lines with open circles, parchment scraps, a feathered cobble plinth, contact shadows.
- **Motion:** smooth 24 fps, a never-settling push-in ×1.4 over 10 s anchored left-low, a beat every 0.7–1.5 s, in-shot dissolves (8–16 f) and 1-frame jump swaps.
- **Note:** the reference is very likely image-to-video AI output. Rebuild its morphs as crossfades between prepared states or as 2.5D card turns.

## scroll (v05)
- **Look:** cream page and near-black ink, mauve as the only hue, photo cards with thick aged-cream borders, map silhouettes with grey echo copies, monospace captions.
- **Motion:** a year counter whose digits ghost-smear into a new typeface each year, accelerating (15 → 7 f per year); a smooth vertical scroll with freeze-and-jump stutter; ghost copies at 45 % / 18 %.
- **Transition:** vinyl disc iris carrying the next chapter's background colour.

## redIdent (v06)
- **Look:** one flat red field `#d8332f`, a white silhouette or fully greyscale photo hero, dashed orbit rings and letter cylinders as 2.5D satellites, white film dust over everything.
- **Motion:** native 12 fps; linear card spin at 15°/frame with swaps at edge-on; 2× scale punches on the beat; ring strobes that change radius every frame; scramble-decode credits; an expo bar hop.
- **Loop:** 44 f core loop, ending with a block glitch that leads back into frame 1.

## duotoneBurst (v04 part B)
- **Look:** red stock paper with faint folds, photo cards in red/pink/green duotone or 45° halftone, cut-outs with an RGB fringe, graph paper and line drawings, white serif titles with a melted second line.
- **Motion:** a 4-second burst: a tile mosaic every 0.4–0.8 s, window grow + scatter, cards boiling on 1–5 f holds. Titles stamp word by word every 3 f, or appear in a single frame.
- **Framing:** a 9:16 panel inside black bars when the deliverable is 16:9.
- **Demo:** `ExplainerDemo` shot C.

---

## Mixing presets in one film
v04 shows that a long film can switch registers. Keep these constant across the film: **type family, accent hue and transition family**. Switch the palette or clock only at a transition that "physically" changes material (blackout, disc iris, palette reset to white). A safe combination for a 2–4 minute explainer:
- `explainer` for the argument,
- `archive` for history or evidence beats,
- `duotoneBurst` for a 4–6 s statistics montage,
- back to `explainer` for the conclusion.
