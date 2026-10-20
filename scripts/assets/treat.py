"""Grade a cut-out PNG so it matches a collage preset, and check it is sharp enough for the target size.

Usage:
  python3 -I scripts/assets/treat.py in.png out.png --grade greyscale --contrast 1.25 --target-h 0.55 --frame-h 2160
  python3 -I scripts/assets/treat.py in.png out.png --grade duotone --dark 5a0d05 --light e84b2d
  python3 -I scripts/assets/treat.py in.png out.png --grade sepia
  python3 -I scripts/assets/treat.py in.png out.png --grade keep   # accent object stays in colour

Steps: trim to the alpha bbox (+2 % pad) → tighten the matte (erode 1 px, 0.6 px feather, kills halo fringes)
→ grade → optional photocopy grain → resize so the long side fits the target size on screen (never upscale
beyond 1.0×; warns when the source is too small).
"""
import argparse
import sys

import numpy as np
from PIL import Image, ImageFilter, ImageOps


def hex_rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], dtype=np.float32)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("inp")
    ap.add_argument("out")
    ap.add_argument("--grade", choices=["greyscale", "sepia", "duotone", "muted", "keep"], default="greyscale")
    ap.add_argument("--contrast", type=float, default=1.25)
    ap.add_argument("--dark", default="4a3d2c")
    ap.add_argument("--light", default="f8ebd2")
    ap.add_argument("--grain", type=float, default=0.0, help="photocopy grain strength 0..1 (v01a: 0.25)")
    ap.add_argument("--target-h", type=float, default=0.5, help="on-screen height as a fraction of frame height")
    ap.add_argument("--frame-h", type=int, default=2160)
    ap.add_argument("--erode", type=int, default=1)
    a = ap.parse_args()

    im = Image.open(a.inp).convert("RGBA")
    alpha = im.getchannel("A")
    bbox = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
    if not bbox:
        sys.exit("empty alpha: nothing to treat")
    pad = int(0.02 * max(im.size))
    bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(im.width, bbox[2] + pad), min(im.height, bbox[3] + pad))
    im = im.crop(bbox)

    # matte cleanup: erode then feather slightly, so no background halo survives on paper
    a_ch = im.getchannel("A")
    if a.erode > 0:
        a_ch = a_ch.filter(ImageFilter.MinFilter(2 * a.erode + 1))
    a_ch = a_ch.filter(ImageFilter.GaussianBlur(0.6))

    rgb = np.asarray(im.convert("RGB"), dtype=np.float32) / 255.0
    luma = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    if a.grade in ("greyscale", "sepia", "duotone"):
        # contrast around the subject's own median, so dark and light objects both keep detail
        mask = np.asarray(a_ch) > 128
        mid = float(np.median(luma[mask])) if mask.any() else 0.5
        luma = np.clip((luma - mid) * a.contrast + mid, 0, 1)
    if a.grade == "greyscale":
        out = np.repeat(luma[..., None], 3, axis=2)
    elif a.grade in ("sepia", "duotone"):
        d, l = hex_rgb(a.dark) / 255.0, hex_rgb(a.light) / 255.0
        out = d[None, None, :] + luma[..., None] * (l - d)[None, None, :]
    elif a.grade == "muted":
        grey = np.repeat(luma[..., None], 3, axis=2)
        out = grey + 0.8 * (rgb - grey)
        out = out * np.array([1.02, 1.0, 0.95], dtype=np.float32)
    else:
        out = rgb
    if a.grain > 0:
        rng = np.random.default_rng(7)
        n = rng.normal(0, 0.06 * a.grain, out.shape[:2]).astype(np.float32)
        out = np.clip(out + n[..., None], 0, 1)

    res = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8), "RGB")
    res.putalpha(a_ch)

    need = int(a.target_h * a.frame_h)
    if res.height < need:
        print(f"WARNING: source is {res.height}px tall but will be shown at {need}px ({need / res.height:.2f}x upscale). "
              f"Find a larger source or generate one at high quality.", file=sys.stderr)
    elif res.height > need * 1.25:
        res = res.resize((int(res.width * need * 1.25 / res.height), int(need * 1.25)), Image.LANCZOS)
    res.save(a.out, optimize=True)
    cov = (np.asarray(res.getchannel("A")) > 128).mean()
    print(f"ok {a.out} {res.width}x{res.height} alpha_coverage={cov:.2f} grade={a.grade}")


if __name__ == "__main__":
    main()
