# 12 · Audio: background music (BGM) and sound effects (SFX)

Code: `src/collage/audio.tsx` (`<Bgm>`, `<Sfx>`, `<SfxTrack>`, `SFX_FOR`), scripts in `scripts/audio/`.

## 1. Two different jobs: never mix them up
| | **BGM: background music** | **SFX: sound effects** |
|---|---|---|
| What | One continuous music bed for the **whole video** | Short sounds glued to **specific motion events** |
| Count | One track per film (one per register at most, crossfaded only at a hard cut) | Many, each 0.05–1.2 s |
| Sets | Mood and pace; the cut rhythm follows its bars | Physicality: paper, stamps, pops make the collage feel touchable |
| Placement | From frame 0 to the end, fade in 6 f and out 30–45 f | On the **same frame** the motion starts (a clock frame) |
| Level | Bed at −18 LUFS, played at −3 to −6 dB, ducked −8 dB under voice-over | Per event (see §3), peaks well under the voice |
| Sources | Incompetech, ccMixter, FMA, Commons, Pixabay (manual), or **compose with FluidSynth** | Freesound, Commons, or **synthesize with Tone.js** |
| Search | `find_audio.py --kind bgm` (≥ 60 s by default) | `find_audio.py --kind sfx` (≤ 6 s by default) |
| Component | `<Bgm src levelDb duck/>` once | `<Sfx at event/>` or `<SfxTrack cues/>` |

A sound that runs under several shots is BGM. A sound that exists because something moved is SFX. Ambience (room tone, crowd) is neither; use it only inside one shot, as an SFX bed at −28 dB.

## 2. Levels and loudness
| Element | Target |
|---|---|
| Voice-over (if any) | −16 to −18 LUFS short-term, always the loudest element |
| BGM bed file | −18 LUFS (`compose_bgm.py` normalises; run library tracks through `master.py --lufs -18` if needed) |
| BGM in the mix | `levelDb` −3 (no VO) to −6 (with VO); ducked **−8 dB** during VO ranges, 6-frame ramps |
| SFX | per-event dB in `SFX_FOR` (−9 for stamps and bursts … −26 for per-glyph ticks) |
| Final master | **−14 LUFS integrated, true peak ≤ −1.5 dBTP** (YouTube/web): `scripts/audio/master.py` |

The demo measured −20.8 LUFS after render, then −14.2 LUFS / −1.9 dBTP after `master.py`.

## 3. SFX ↔ motion map
The palette is synthesized by `scripts/audio/tone_sfx.mjs` (3 variants each; `<Sfx>` rotates variants by frame so repeats differ). Library picks can replace any entry via `src`.

| Event (`SFX_FOR` key) | Sound | dB | Motion primitive |
|---|---|---|---|
| `popIn` | pitched bloop + paper click | −14 | M1 prop pop-in |
| `shapePop` | soft low bloop | −18 | M2 disc / pastel shape |
| `slam` | low thump + body noise | −10 | M8 slam, heavy landing, broken title line |
| `stamp` | thump + paper slap | −9 | M22 stamp payoff |
| `whip` | band-passed noise sweep up | −12 | T1 whip-pan, T2 push pose |
| `slide` | crinkly paper | −16 | M4/M5 slides, T6 sheet, hand placing a prop |
| `poseJump` | tiny dry click | −18 | M7 pose change, word stamp |
| `typeOn` | the same click, very quiet | −26 | per glyph (archive type-on only) |
| `scribble` | gated high noise | −20 | M18 pencil scribble |
| `mosaic` | run of rising metallic ticks | −14 | T9 tile mosaic |
| `inkBlackout` | wet brush swell | −12 | T5 |
| `glitch` | crushed square bursts | −14 | T14 (`redIdent`) |
| `payoff` | soft FM chime | −14 | end card / M14 |
| `pump`, `burst` | air hiss; crack + thump | −14, −9 | M10 |

**Vox editorial set** (13-vox-editorial V10): `highlight` → marker −22 dB · `pageTurn` −18 · `printLand` → shutter −16 · `typewriter` −24 per glyph · `mapFly` → mapWhoosh −20 · `titleHit` → lowHit −12 · `seal` → stamp −12. Vox BGM default: `documentary` (or a per-video style such as `dynasty`: D-gong pentatonic, koto, shakuhachi, half-time taiko). Collage bloops (`popIn`, `shapePop`) are not vox defaults.

**SFX rules**
1. **Only physical moves get sound.** Paper boil, grain, slow drifts, loops (spins, wobble) and held frames are silent.
2. **At most one prominent cue per beat** (≈ 0.5 s). A build of 8 props gets 2–3 cues, not 8; let the rest ride the music.
3. **Same frame as the motion**, which on stepped presets is a clock frame. Soft-attack sounds (`slam`, `slide`, `inkBlackout`, `pump`) peak 1–2 frames after onset; start them 1–2 frames early if the hit must feel exact. The demo verified 28/28 cues within 2 frames of their motion and 23/28 within 1 (aubio onset detection on the mix).
4. **Text is quiet.** Per-glyph ticks at −26 dB or none at all; one `slam` for the key word.
5. **Smooth presets** (`diorama`, `scroll`, `thenNow`) use fewer, softer SFX: slides and an occasional pop. `redIdent` uses glitches and hits on the beat.

## 4. BGM rules
1. **Pick the bed by preset:** `curious` (explainer: pizzicato, marimba, side-stick), `documentary` (archive: piano, cello, strings), `lofi` (postcard / thenNow: e-piano, swung), `pulse` (duotoneBurst / redIdent: plucks, four-on-the-floor). These are the `compose_bgm.py --style` names, and the same words make good library search queries.
2. **Tempo serves the cut rhythm.** Choose the BPM so the planned cuts land on bar lines. 120 BPM gives a bar every 2 s = 60 frames, and the demo's cuts at frames 120/240 fall on downbeats. `compose_bgm.py` writes `beats.json` with `grid_cuts_30fps` (every downbeat snapped to the 12 fps drawing grid). For library tracks, run `aubio beat` or read the measured tempo from `find_audio.py --pick`.
3. **Structure follows the video:** intro bars under the title, the busiest section under the densest montage (`duotoneBurst`), and an outro/held chord under the end card. Compose to the exact duration rather than cutting a track mid-phrase.
4. **One bed per film.** Change register (e.g. explainer → archive) only at a hard cut, with a 6–12 frame crossfade or a beat of silence. Never cross-dissolve two songs under continuous picture.
5. **Duck, don't mute,** under voice-over.

## 5. Pipelines
**Library first (BGM and SFX):**
```bash
python3 -I scripts/audio/find_audio.py --kind bgm "playful pizzicato quirky" --bpm 95-125 --out public/audio/raw/bgm
```
```bash
python3 -I scripts/audio/find_audio.py --kind sfx "paper slide" --out public/audio/raw/sfx-paper
```
```bash
python3 -I scripts/audio/find_audio.py --kind bgm "playful pizzicato quirky" --pick 2 --out public/audio/raw/bgm
```
- Sources:
  - **BGM:** `incompetech` (CC BY 4.0, filterable by BPM and feel), `ccmixter` (CC BY only), `fma` (licence read from each track page; BY-NC and ND are dropped), `commons`.
  - **SFX:** `freesound` (needs `FREESOUND_API_KEY`), `commons`. Pronunciation and spoken-word recordings are filtered out.
  - **Pixabay Music** blocks scripts; search it in the browser and record the licence by hand.
- `listen.md` lists the candidates with preview links. `--pick` downloads them, measures duration, LUFS, true peak and tempo, and appends ready-to-paste attribution to `CREDITS.md`.
- NonCommercial or NoDerivatives licences are excluded unless `--allow-nc` (personal, unmonetised use only).

**Compose (BGM) when no track fits:**
```bash
python3 -I scripts/audio/compose_bgm.py --style curious --duration 72 --bpm 120 --out public/audio/bgm/film
```
This writes an original MIDI with chords, bass, arpeggio, motif and drums, renders it with FluidSynth + GeneralUser GS (free for commercial music; install it at `~/.local/share/soundfonts/`), normalises to −18 LUFS, and writes `film.beats.json`. Change `--seed` for a different melody and `--transpose` for another key.

**Synthesize (SFX) when no sound fits:**
```bash
node scripts/audio/tone_sfx.mjs --out public/audio/sfx/synth
```
Tone.js renders offline in Node through `node-web-audio-api`. AudioWorklet effects (e.g. `Tone.BitCrusher`) are unavailable there; use a stepped `WaveShaper` instead.

**Master:**
```bash
python3 -I scripts/audio/master.py out/render.mp4 out/render_master.mp4
```

## 6. Credits
Every library pick writes a line to `CREDITS.md` (BGM and SFX separately). CC BY tracks such as Incompetech must be credited in the video description or end card, using the exact line written. Composed BGM and synthesized SFX need no credit.
