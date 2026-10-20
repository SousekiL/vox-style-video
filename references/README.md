# References

The style was measured from 8 Pinterest reference videos. **The videos and every frame extracted from them are third-party copyrighted material and are not in this repo.** Only our own written analyses (`notes/`) and the analysis brief are published.

| id | Pin | What it is |
|---|---|---|
| v01 | https://jp.pinterest.com/pin/938508009830194823/ | collage-style finance explainer (70 s) |
| v02 | https://jp.pinterest.com/pin/1120129738625508713/ | Rome collage diorama (10 s) |
| v03 | https://jp.pinterest.com/pin/632122497727995055/ | "Collage" (5 s) |
| v04 | https://jp.pinterest.com/pin/650348002465079803/ | brand 50th-anniversary film (89 s) |
| v05 | https://jp.pinterest.com/pin/683280574723772946/ | brand timeline story (6 s) |
| v06 | https://jp.pinterest.com/pin/808818414317782154/ | bird & old cameras ident, 12 fps (15 s) |
| v07 | https://jp.pinterest.com/pin/794603928043376530/ | AE collage animation, filmed off a monitor (13 s) |
| v08 | https://jp.pinterest.com/pin/768004542745339452/ | travel postcard collage (17 s) |

Rebuild the analysis material locally (for personal study):
```bash
yt-dlp -f "bv*+ba/b" --merge-output-format mp4 -o "references/videos/v01_%(id)s.%(ext)s" "https://www.pinterest.com/pin/938508009830194823/"
```
```bash
python3 -I scripts/prep_reference.py references/videos/v01_938508009830194823.mp4 references/analysis/v01
```
That writes every frame, every-frame contact sheets, native keyframes, `stats.json` (cadence, palettes) and `motion.csv`. `analysis/BRIEF.md` is the brief given to the parallel analysis agents.
