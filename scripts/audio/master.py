"""Master the final mix to a delivery loudness with two-pass EBU R128 loudnorm; the video stream is copied.

Usage:
  python3 -I scripts/audio/master.py out/render.mp4 out/render_master.mp4 [--lufs -14] [--tp -1.5]

Targets (12-audio.md §2): YouTube / web −14 LUFS integrated, true peak ≤ −1.5 dBTP (target −2.0 leaves headroom for the linear pass).
Prints before/after measurements so the QA step can record them.
"""
import argparse
import json
import re
import subprocess


def measure(path):
    e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    i = re.findall(r"I:\s+(-?[\d.]+) LUFS", e)
    p = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)
    lra = re.findall(r"LRA:\s+([\d.]+) LU", e)
    return {"lufs": float(i[-1]) if i else None, "true_peak": float(p[-1]) if p else None, "lra": float(lra[-1]) if lra else None}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("inp")
    ap.add_argument("out")
    ap.add_argument("--lufs", type=float, default=-14.0)
    ap.add_argument("--tp", type=float, default=-2.0)
    ap.add_argument("--lra", type=float, default=11.0)
    a = ap.parse_args()

    before = measure(a.inp)
    first = subprocess.run(["ffmpeg", "-hide_banner", "-i", a.inp, "-af",
                            f"loudnorm=I={a.lufs}:TP={a.tp}:LRA={a.lra}:print_format=json", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
    stats = json.loads(first[first.rindex("{"): first.rindex("}") + 1])
    af = (f"loudnorm=I={a.lufs}:TP={a.tp}:LRA={a.lra}:measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
          f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:offset={stats['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", a.inp, "-c:v", "copy", "-af", af, "-ar", "48000", "-c:a", "aac",
                    "-b:a", "256k", a.out], check=True)
    after = measure(a.out)
    print(json.dumps({"before": before, "after": after, "target": {"lufs": a.lufs, "true_peak": a.tp}}, indent=2))


if __name__ == "__main__":
    main()
