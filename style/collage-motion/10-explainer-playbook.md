# 10 · Explainer playbook

How to turn a script into a collage-motion explainer. Pacing numbers come from v01 (a 70 s finance explainer) and v04 (a 90 s brand film).

## 1. From script to shots
1. **Split the voice-over into claims.** One claim is one board (shot), 2–5 s long. A 70 s explainer has about 15 boards (v01: 15 shots in 69.7 s).
2. **Give each board one hero object** that *is* the claim: a house for "your house", a safe for "savings", a balloon for "inflation". Write it as a noun you can photograph. That noun goes to the asset pipeline (09).
3. **Give each board one verb** from the motion vocabulary (05): pop-in, pump, swing, lift-out, toss-in, stack, scribble. The verb carries the argument ("inflation" = pump-pulse; "the bank takes it" = lift-out with a grabber).
4. **Pick the transition by the logic between claims** (06 §2): "and then" = whip; "zoom into detail" = push; "but actually" = ink blackout or palette reset; "list of facts" = tile mosaic.
5. **Headline only when the narration lands a key phrase.** Use 2–6 words, sentence case, ending with a full stop, entering with a slam or pose jump. Most boards carry no text at all.

## 2. Board template (explainer preset, 30 fps)
| Time in board | What happens | Primitive |
|---|---|---|
| 0–0.5 s | Board arrives: zoom-out settle or whip-in settle; pastel disc pops | T3 / T1, M2 |
| 0.1–0.7 s | Hero pops in with overshoot (or rises from the bottom) | M1 / M5 |
| 0.7–1.5 s | Secondary prop or hand enters in 2 held poses | M7 |
| on the key phrase | Headline slam and step-down, or marker label wipe | M8, marker |
| middle | The verb: pump, swing, scribble, stack, lift… | M9–M13 |
| last 0.3 s | Whip-out or push pose, then a hard cut on a grid frame | T1 / T2 |

Background: paper re-rolls every 7–8 frames on busy boards and every 15 frames on calm ones. Hero and text stay still between beats.

## 3. Audio (details: [12-audio.md](12-audio.md))
- **BGM** is one bed for the whole film. Pick or compose it before animating, with a BPM chosen so planned cuts land on bar lines (`compose_bgm.py` → `beats.json.grid_cuts_30fps`).
- **SFX** are cues on physical motion only: pops, slams, whips, stamps, slides, scribbles. At most one prominent cue per beat. Build the cue sheet from the same pose/step tables that drive the visuals.
- Cut on the narration's stressed syllable or a music downbeat, snapped to the 12 fps grid.
- v06 places its 2× punches on beats and moves them between loop passes. Treat punches as music-synced, not as part of the loop.

## 4. Longer films: registers
For films over 90 s, alternate registers the way v04 does:
- **argument** (`explainer`),
- **evidence / history** (`archive`: newsprint photos, typed headlines, pencil),
- **burst** (`duotoneBurst`: 4–6 s, a mosaic every 0.4–0.8 s for statistics or examples),
- **quiet beat** (an empty paper page with a small typed line; v04a holds 5 s of near-empty paper).

Keep the type family, the accent hue and the cut grammar constant across registers.

## 5. Shot list format (hand this to the build step)
```yaml
- id: s03
  dur: 3.2s
  vo: "Banks don't want your savings. They want your house."
  preset: explainer
  hero: {asset: cutouts/house.png, enter: pop, anchor: [50, 55], size_h: 0.45}
  support: [{asset: cutouts/hand.png, enter: pose-jump, from: left}]
  shapes: [{kind: gridCircle, behind: hero, scale: 1.4}]
  verb: swing (pendulum on a red rope = the one accent)
  text: {copy: "They want your house.", enter: slam, at: 1.6s}
  out: whip-left
  sfx: [popIn@hero, slam@text, whip@out]   # BGM is set once for the film, not per board
```

## 6. Production order
1. Shot list (above) → asset list with routes (search / generate) → run the asset pipeline (09) → choose or compose the BGM and fix the cut grid to its bars (12).
2. Build one board end to end. Run the cadence QA (11) on that board **before** building the rest.
3. Build the remaining boards from the same components; change content, not grammar.
4. Add the SFX cue sheet, render 1080p proofs, master loudness (`master.py`), then a 2160p master (ProRes HQ if it goes to an editor).
