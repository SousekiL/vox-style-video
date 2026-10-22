"""Subset a CJK font to exactly the characters a story uses (keeps renders fast and repos small).

Usage:
  python3 -I scripts/fonts/subset_cjk.py <font.ttf> <out.woff> <source files...>

Collects every CJK character + CJK punctuation found in the given source files (e.g. the story .tsx),
adds ASCII and common full-width punctuation, and writes a WOFF subset with pyftsubset (fonttools).
WOFF2 would need the `brotli` module; WOFF (zlib) needs nothing extra.
"""
import re
import subprocess
import sys
from pathlib import Path

font, out, *sources = sys.argv[1:]
chars = set()
for src in sources:
    text = Path(src).read_text(encoding="utf-8")
    chars |= set(re.findall(r"[　-〿㐀-鿿＀-￯《》「」“”‘’·—…]", text))
chars |= set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ×?!.,:;()-=%+/≠")
tmp = Path(out).with_suffix(".chars.txt")
tmp.write_text("".join(sorted(chars)), encoding="utf-8")
subprocess.run(["pyftsubset", font, f"--text-file={tmp}", "--flavor=woff", f"--output-file={out}", "--layout-features=*"], check=True)
print(f"ok {out} chars={len(chars)} size={Path(out).stat().st_size // 1024} KB")
