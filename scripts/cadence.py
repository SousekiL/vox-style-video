"""Cadence check: hold run-length histogram per frame range, from prep_reference.py's motion.csv.

Usage: python3 -I scripts/cadence.py out/qa/motion.csv 20:110 130:225 ...
A 12 fps grid at 30 fps should read mostly {2, 3}; on 2s should read {2}; smooth should read {1}.
"""
import csv
import sys

d = [float(r["mean_abs_diff"]) for r in csv.DictReader(open(sys.argv[1]))]
for rng in sys.argv[2:] or [f"0:{len(d)}"]:
    a, b = (int(x) for x in rng.split(":"))
    runs, cur = [], 1
    for x in d[a + 1:b]:
        if x < 0.15:
            cur += 1
        else:
            runs.append(cur)
            cur = 1
    runs.append(cur)
    hist = {}
    for r in runs:
        hist[r] = hist.get(r, 0) + 1
    ones = hist.get(1, 0) / max(1, len(runs))
    print(f"frames {rng}: runs {dict(sorted(hist.items()))}  stray-1-frame share {ones:.0%}")
