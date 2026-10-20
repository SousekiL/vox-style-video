"""Turn one reference video into analysable material.

Usage: python3 -I scripts/prep_reference.py <video.mp4> <out_dir>

Writes into out_dir:
  frames/NNNNN.jpg      every source frame, long side 540px
  sheets_all/          every-frame contact sheets (6x4 = 24 consecutive frames each)
  sheets_overview/     sampled contact sheets (~4 fps, 6x4 tiles)
  keyframes/           native-resolution PNGs at each shot start/middle
  stats.json           fps, size, duration, cuts, hold-frame stats, palettes per shot
  motion.csv           per-frame mean abs difference to the previous frame (0-255)
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

FONT = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", 15)
LONG_SIDE = 540
COLS, ROWS = 6, 4


def probe(video):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height,r_frame_rate:format=duration",
         "-of", "json", str(video)], capture_output=True, text=True, check=True).stdout
    d = json.loads(out)
    s = d["streams"][0]
    num, den = s["r_frame_rate"].split("/")
    return int(s["width"]), int(s["height"]), float(num) / float(den), float(d["format"]["duration"])


def extract_frames(video, frames_dir, w, h):
    frames_dir.mkdir(parents=True, exist_ok=True)
    scale = f"scale={LONG_SIDE}:-2" if w >= h else f"scale=-2:{LONG_SIDE}"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(video), "-fps_mode", "passthrough",
                    "-vf", scale, "-q:v", "3", str(frames_dir / "%05d.jpg")], check=True)
    return sorted(frames_dir.glob("*.jpg"))


def kmeans_palette(pixels, k=6, iters=12, seed=0):
    rng = np.random.default_rng(seed)
    centers = pixels[rng.choice(len(pixels), k, replace=False)].astype(float)
    for _ in range(iters):
        d = ((pixels[:, None, :] - centers[None]) ** 2).sum(-1)
        lab = d.argmin(1)
        for i in range(k):
            m = pixels[lab == i]
            if len(m):
                centers[i] = m.mean(0)
    counts = np.bincount(lab, minlength=k)
    order = counts.argsort()[::-1]
    return [{"hex": "#%02x%02x%02x" % tuple(int(c) for c in centers[i]),
             "share": round(float(counts[i] / counts.sum()), 3)} for i in order]


def make_sheet(paths, labels, out_path):
    tiles = [Image.open(p).convert("RGB") for p in paths]
    tw, th = tiles[0].size
    scale = 300 / max(tw, th)
    tw, th = int(tw * scale), int(th * scale)
    sheet = Image.new("RGB", (COLS * tw, ROWS * (th + 20)), (20, 20, 20))
    draw = ImageDraw.Draw(sheet)
    for i, (t, lab) in enumerate(zip(tiles, labels)):
        x, y = (i % COLS) * tw, (i // COLS) * (th + 20)
        sheet.paste(t.resize((tw, th)), (x, y + 20))
        draw.text((x + 4, y + 2), lab, fill=(255, 220, 0), font=FONT)
    sheet.save(out_path, quality=88)


def main():
    video, out = Path(sys.argv[1]), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    w, h, fps, dur = probe(video)
    frames = extract_frames(video, out / "frames", w, h)
    n = len(frames)

    # Per-frame difference: finds cuts, holds (animating on 2s/3s) and motion energy.
    small = [np.asarray(Image.open(p).convert("L").resize((96, 96)), dtype=np.int16) for p in frames]
    diffs = [0.0] + [float(np.abs(small[i] - small[i - 1]).mean()) for i in range(1, n)]
    with open(out / "motion.csv", "w") as f:
        f.write("frame,time_s,mean_abs_diff\n")
        for i, d in enumerate(diffs):
            f.write(f"{i + 1},{i / fps:.3f},{d:.2f}\n")

    arr = np.array(diffs[1:])
    cut_thresh = max(25.0, float(np.percentile(arr, 99))) if len(arr) else 25.0
    cuts = [i for i in range(1, n) if diffs[i] >= cut_thresh]
    # Collapse cut runs (a multi-frame transition counts once).
    shots_start = [0]
    for c in cuts:
        if c - shots_start[-1] > max(3, int(fps * 0.25)):
            shots_start.append(c)
    holds = sum(1 for d in diffs[1:] if d < 0.6)
    runs, cur = [], 1
    for d in diffs[1:]:
        if d < 0.6:
            cur += 1
        else:
            runs.append(cur)
            cur = 1
    runs.append(cur)
    run_hist = {str(k): runs.count(k) for k in sorted(set(runs))[:8]}

    # Every-frame sheets.
    sa = out / "sheets_all"
    sa.mkdir(exist_ok=True)
    per = COLS * ROWS
    for s in range(0, n, per):
        chunk = frames[s:s + per]
        labels = [f"f{s + j + 1}  {(s + j) / fps:.2f}s" for j in range(len(chunk))]
        make_sheet(chunk, labels, sa / f"sheet_{s + 1:05d}-{s + len(chunk):05d}.jpg")

    # Overview sheets at ~4 fps.
    so = out / "sheets_overview"
    so.mkdir(exist_ok=True)
    step = max(1, round(fps / 4))
    idx = list(range(0, n, step))
    for s in range(0, len(idx), per):
        chunk = idx[s:s + per]
        make_sheet([frames[i] for i in chunk], [f"f{i + 1}  {i / fps:.2f}s" for i in chunk],
                   so / f"overview_{chunk[0] / fps:06.2f}s.jpg")

    # Native-resolution keyframes and palettes per shot.
    kd = out / "keyframes"
    kd.mkdir(exist_ok=True)
    shots = []
    bounds = shots_start + [n]
    for si in range(len(shots_start)):
        a, b = bounds[si], bounds[si + 1]
        mid = (a + b) // 2
        for tag, fi in (("start", min(a + 2, b - 1)), ("mid", mid)):
            t = fi / fps
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(video),
                            "-frames:v", "1", str(kd / f"shot{si + 1:02d}_{tag}_{t:06.2f}s.png")], check=True)
        px = np.asarray(Image.open(frames[mid]).convert("RGB").resize((120, 120))).reshape(-1, 3)
        shots.append({"shot": si + 1, "start_frame": a + 1, "end_frame": b, "start_s": round(a / fps, 3),
                      "dur_s": round((b - a) / fps, 3), "palette": kmeans_palette(px)})

    allpx = np.concatenate([np.asarray(Image.open(frames[i]).convert("RGB").resize((60, 60))).reshape(-1, 3)
                            for i in range(0, n, max(1, n // 40))])
    stats = {
        "video": video.name, "width": w, "height": h, "fps": fps, "duration_s": round(dur, 3), "frames": n,
        "cut_threshold": round(cut_thresh, 2), "shots": shots,
        "held_frame_ratio": round(holds / max(1, n - 1), 3),
        "identical_run_length_hist": run_hist,
        "global_palette": kmeans_palette(allpx, k=10),
    }
    (out / "stats.json").write_text(json.dumps(stats, indent=2))
    print(f"{video.name}: {n} frames, {len(shots)} shots, held={stats['held_frame_ratio']}")


if __name__ == "__main__":
    main()
