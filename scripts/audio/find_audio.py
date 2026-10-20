"""Search free, reusable audio. BGM (background music) and SFX (sound effects) are separate kinds
with separate sources and filters — never mix them in one search.

  --kind bgm : the video's music bed. Sources: incompetech, ccmixter, fma, commons. Default ≥ 60 s.
  --kind sfx : short cues on specific motion events. Sources: freesound (needs FREESOUND_API_KEY), commons. Default ≤ 6 s.

Licences kept: CC0 / public domain / CC BY / CC BY-SA. NonCommercial (NC) and NoDerivatives (ND) are
dropped unless --allow-nc (personal, non-monetised use only).

Usage:
  python3 -I scripts/audio/find_audio.py --kind bgm "playful pizzicato light quirky" --bpm 90-125 --out public/audio/raw/bgm
  python3 -I scripts/audio/find_audio.py --kind sfx "paper swoosh" --out public/audio/raw/sfx-paper
  python3 -I scripts/audio/find_audio.py --kind sfx "paper swoosh" --pick 0,3 --out public/audio/raw/sfx-paper

Writes <out>/candidates.json and <out>/listen.md (numbered table with preview links). --pick downloads the
chosen indices, measures duration / loudness / tempo, and writes <out>/CREDITS.md with ready-to-paste attribution.
Pixabay Music has no API and blocks scripts: search it in the browser and record the licence by hand.
"""
import argparse
import html
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

UA = "collage-motion-audio-finder/1.0 (personal video research)"
BAD = re.compile(r"(non[- ]?commercial|\bnc\b|no ?deriv|\bnd\b|sampling)", re.I)
PRONUNCIATION = re.compile(r"^File:(LL-Q\d+|[A-Z][a-z]{1,2}(-[a-z]{2,4})?-[^ ]+\.(ogg|wav|mp3|oga)$)")
SPOKEN = re.compile(r"(-article|spoken|pronunciation|wikipedia|interview|speech|lecture)", re.I)
GOOD = re.compile(r"(cc0|creative commons 0|public domain|\bpd\b|attribution|cc[- ]?by)", re.I)


def get(url, headers=None, raw=False):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
        with urllib.request.urlopen(req, timeout=40) as r:
            data = r.read()
    except Exception as e:
        if "header line" not in str(e):
            raise
        # some servers (ccMixter) send header lines longer than Python's http.client accepts; curl copes
        ua = (headers or {}).get("User-Agent", UA)
        data = subprocess.run(["curl", "-sL", "--max-time", "60", "-A", ua, url], capture_output=True, check=True).stdout
    return data if raw else data.decode("utf-8", "replace")


def licence_ok(lic, allow_nc):
    if not lic:
        return False
    if BAD.search(lic) and not allow_nc:
        return False
    return bool(GOOD.search(lic)) or allow_nc


def mmss(s):
    try:
        parts = [int(p) for p in str(s).split(":")]
    except ValueError:
        return None
    sec = 0
    for p in parts:
        sec = sec * 60 + p
    return sec


# ---------------- BGM sources ----------------
_INC = None


def search_incompetech(q, limit, a):
    """Kevin MacLeod catalogue (CC BY 4.0). Local keyword scoring over the full piece list."""
    global _INC
    if _INC is None:
        _INC = json.loads(get("https://incompetech.com/music/royalty-free/pieces.json"))
    words = [w.lower() for w in re.findall(r"\w+", q)]
    out = []
    for p in _INC:
        text = " ".join(str(p.get(k) or "") for k in ("title", "description", "feel", "instruments")).lower()
        score = sum(text.count(w) for w in words)
        if score == 0:
            continue
        bpm = int(p["bpm"]) if str(p.get("bpm", "")).isdigit() else None
        if a.bpm and bpm and not (a.bpm[0] <= bpm <= a.bpm[1]):
            continue
        fn = p["filename"]
        out.append({
            "kind": "bgm", "source": "incompetech", "title": p["title"], "artist": "Kevin MacLeod",
            "duration": mmss(p.get("length")), "bpm": bpm, "tags": f"{p.get('feel', '')} | {p.get('instruments', '')}",
            "license": "CC BY 4.0", "preview": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/" + urllib.parse.quote(fn),
            "download": "https://incompetech.com/music/royalty-free/mp3-royaltyfree/" + urllib.parse.quote(fn),
            "page": "https://incompetech.com/music/royalty-free/music.html",
            "credit": f'"{p["title"]}" Kevin MacLeod (incompetech.com). Licensed under Creative Commons: By Attribution 4.0 License, http://creativecommons.org/licenses/by/4.0/',
            "_score": score,
        })
    out.sort(key=lambda r: -r["_score"])
    return out[:limit]


def search_ccmixter(q, limit, a):
    """ccMixter query API; licence per track."""
    tags = ",".join(re.findall(r"\w+", q.lower())[:3]) or "instrumental"
    data = json.loads(get("https://ccmixter.org/api/query?" + urllib.parse.urlencode(
        {"f": "json", "tags": tags, "type": "any", "limit": str(limit * 4), "sort": "rank"})))
    out = []
    for r in data:
        files = r.get("files") or []
        mp3 = next((f for f in files if str(f.get("download_url", "")).endswith(".mp3")), files[0] if files else None)
        if not mp3:
            continue
        lic = r.get("license_name", "")
        if not licence_ok(lic, a.allow_nc):
            continue
        out.append({
            "kind": "bgm", "source": "ccmixter", "title": r.get("upload_name"), "artist": r.get("user_name"),
            "duration": mmss((mp3.get("file_format_info") or {}).get("ps")), "bpm": None,
            "tags": r.get("upload_tags", "")[:120], "license": lic, "preview": mp3.get("download_url"),
            "download": mp3.get("download_url"), "page": r.get("file_page_url"),
            "credit": f'"{r.get("upload_name")}" by {r.get("user_name")} (ccmixter.org), {lic}, {r.get("file_page_url")}',
        })
    return out[:limit]


def search_fma(q, limit, a):
    """Free Music Archive: search page embeds track JSON; licence is read from each track page."""
    page = get("https://freemusicarchive.org/search?" + urllib.parse.urlencode({"quicksearch": q}),
               headers={"User-Agent": "Mozilla/5.0"})
    out = []
    for m in re.finditer(r"data-track-info='([^']*)'", page):
        t = json.loads(html.unescape(m.group(1)))
        try:
            tp = get(t["url"], headers={"User-Agent": "Mozilla/5.0"})
        except Exception:
            continue
        lm = re.search(r"creativecommons\.org/(licenses/[a-z-]+/[0-9.]+|publicdomain/zero/[0-9.]+)", tp)
        lic = ("CC " + lm.group(1).split("/")[1].upper() + " " + lm.group(1).split("/")[2]) if lm else ""
        if lm and "publicdomain" in lm.group(1):
            lic = "CC0 1.0"
        if not licence_ok(lic.replace("CC BY-NC", "noncommercial").replace("CC BY-ND", "no deriv"), a.allow_nc):
            continue
        out.append({
            "kind": "bgm", "source": "fma", "title": t.get("title"), "artist": t.get("artistName"), "duration": None,
            "bpm": None, "tags": "", "license": lic, "preview": t.get("playbackUrl"), "download": t.get("downloadUrl"),
            "fallback": t.get("playbackUrl"), "page": t.get("url"),
            "credit": f'"{t.get("title")}" by {t.get("artistName")} (freemusicarchive.org), {lic}, {t.get("url")}',
        })
        if len(out) >= limit:
            break
    return out


# ---------------- shared / SFX sources ----------------
def search_commons(q, limit, a):
    params = {"action": "query", "format": "json", "generator": "search", "gsrnamespace": "6",
              "gsrsearch": f"{q} filetype:audio", "gsrlimit": str(min(50, limit * 4)),
              "prop": "imageinfo", "iiprop": "url|size|extmetadata|mime"}
    data = json.loads(get("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params)))
    out = []
    for p in (data.get("query", {}).get("pages", {}) or {}).values():
        if PRONUNCIATION.search(p.get("title", "")) or SPOKEN.search(p.get("title", "")):
            continue  # word-pronunciation recordings (Lingua Libre etc.) are not sound effects or music
        ii = (p.get("imageinfo") or [{}])[0]
        meta = ii.get("extmetadata", {})
        lic = re.sub(r"<[^>]+>", "", meta.get("LicenseShortName", {}).get("value", ""))
        if not licence_ok(lic, a.allow_nc):
            continue
        artist = re.sub(r"<[^>]+>", "", meta.get("Artist", {}).get("value", ""))[:80]
        out.append({
            "kind": a.kind, "source": "commons", "title": p.get("title"), "artist": artist,
            "duration": round(ii.get("duration") or 0, 2) or None, "bpm": None, "tags": "", "license": lic,
            "preview": ii.get("url"), "download": ii.get("url"), "page": ii.get("descriptionurl"),
            "credit": f'{p.get("title")} by {artist or "unknown"}, {lic}, via Wikimedia Commons, {ii.get("descriptionurl")}',
        })
    return out[:limit]


def search_freesound(q, limit, a):
    key = os.environ.get("FREESOUND_API_KEY")
    if not key:
        raise RuntimeError("FREESOUND_API_KEY not set (https://freesound.org/apiv2/apply/)")
    lic = '("Creative Commons 0" OR "Attribution")' if not a.allow_nc else '("Creative Commons 0" OR "Attribution" OR "Attribution NonCommercial")'
    lo, hi = a.dur
    params = {"query": q, "page_size": str(min(150, limit * 2)), "token": key,
              "filter": f"duration:[{lo} TO {hi}] license:{lic}", "sort": "rating_desc",
              "fields": "id,name,username,license,duration,previews,avg_rating,num_downloads,url,tags"}
    data = json.loads(get("https://freesound.org/apiv2/search/text/?" + urllib.parse.urlencode(params)))
    out = []
    for r in data.get("results", []):
        lic_url = r.get("license", "")
        lic_name = "CC0 1.0" if "zero" in lic_url else ("CC BY " + (re.search(r"/by/([0-9.]+)", lic_url) or [None, "4.0"])[1]) if "/by/" in lic_url else lic_url
        out.append({
            "kind": "sfx", "source": "freesound", "title": r.get("name"), "artist": r.get("username"),
            "duration": round(r.get("duration") or 0, 2), "bpm": None,
            "tags": ",".join((r.get("tags") or [])[:8]) + f" | ★{r.get('avg_rating', 0):.1f} ↓{r.get('num_downloads', 0)}",
            "license": lic_name, "preview": (r.get("previews") or {}).get("preview-hq-mp3"),
            "download": (r.get("previews") or {}).get("preview-hq-mp3"), "page": r.get("url"),
            "credit": f'"{r.get("name")}" by {r.get("username")} (freesound.org), {lic_name}, {r.get("url")}',
        })
    return out[:limit]


SOURCES = {
    "bgm": {"incompetech": search_incompetech, "ccmixter": search_ccmixter, "fma": search_fma, "commons": search_commons},
    "sfx": {"freesound": search_freesound, "commons": search_commons},
}


def analyse(path):
    """duration, integrated loudness (LUFS), true peak, and tempo (aubio if installed)."""
    info = {}
    try:
        info["duration"] = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                                                 "csv=p=0", str(path)], capture_output=True, text=True).stdout.strip())
        e = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
                           capture_output=True, text=True).stderr
        m = re.findall(r"I:\s+(-?[\d.]+) LUFS", e)
        p = re.findall(r"Peak:\s+(-?[\d.]+) dBFS", e)
        info["lufs"] = float(m[-1]) if m else None
        info["true_peak"] = float(p[-1]) if p else None
    except Exception as ex:
        info["error"] = str(ex)
    if shutil.which("aubio") and info.get("duration", 0) > 8:
        t = subprocess.run(["aubio", "tempo", str(path)], capture_output=True, text=True).stdout.strip()
        m = re.search(r"([\d.]+)\s*bpm", t)
        info["bpm_detected"] = float(m.group(1)) if m else None
    return info


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("query")
    ap.add_argument("--kind", choices=["bgm", "sfx"], required=True)
    ap.add_argument("--source", action="append", help="repeatable; default: all sources for the kind")
    ap.add_argument("--limit", type=int, default=8, help="per source")
    ap.add_argument("--bpm", default="", help="bgm only, e.g. 90-125 (incompetech filters on it)")
    ap.add_argument("--min-dur", type=float, default=None)
    ap.add_argument("--max-dur", type=float, default=None)
    ap.add_argument("--allow-nc", action="store_true")
    ap.add_argument("--pick", default="", help="comma list of candidate indices to download")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()
    a.bpm = tuple(int(x) for x in a.bpm.split("-")) if a.bpm else None
    lo = a.min_dur if a.min_dur is not None else (60 if a.kind == "bgm" else 0)
    hi = a.max_dur if a.max_dur is not None else (900 if a.kind == "bgm" else 6)
    a.dur = (lo, hi)

    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    cand_file = out / "candidates.json"

    if a.pick and cand_file.exists():
        res = json.loads(cand_file.read_text())
    else:
        res = []
        for name, fn in SOURCES[a.kind].items():
            if a.source and name not in a.source:
                continue
            try:
                res += fn(a.query, a.limit, a)
            except Exception as e:
                print(f"{name} failed: {e}", file=sys.stderr)
        res = [r for r in res if r.get("duration") is None or lo <= r["duration"] <= hi]
        for r in res:
            r.pop("_score", None)
        cand_file.write_text(json.dumps(res, indent=2, ensure_ascii=False))
        rows = ["| # | kind | source | title | artist | dur s | bpm | licence | tags | preview |", "|---|---|---|---|---|---|---|---|---|---|"]
        for i, r in enumerate(res):
            rows.append(f"| {i} | {r['kind']} | {r['source']} | {r['title']} | {r['artist']} | {r['duration'] or '?'} | {r['bpm'] or ''} | {r['license']} | {r['tags'][:60]} | {r['preview']} |")
            print(f"[{i}] {r['kind']} {r['source']:<11} {str(r['duration'] or '?'):>6}s {str(r['bpm'] or ''):>4} {r['license']:<12} {r['title']}")
        (out / "listen.md").write_text(f"# {a.kind.upper()} candidates: {a.query}\n\n" + "\n".join(rows) + "\n")
        print(f"wrote {out / 'listen.md'}")

    if a.pick:
        credits_path = out / "CREDITS.md"
        credits = credits_path.read_text().splitlines() if credits_path.exists() else [f"# Credits ({a.kind})", ""]
        for i in (int(x) for x in a.pick.split(",")):
            r = res[i]
            ext = ".ogg" if "ogg" in (r["download"] or "") else ".mp3"
            dest = out / f"{a.kind}_{i:02d}{ext}"
            try:
                data = get(r["download"], raw=True)
                if data[:15].lstrip().lower().startswith(b"<!doctype") or data[:5].lower() == b"<html":
                    raise RuntimeError("got an HTML page (login wall)")
            except Exception as e:
                if not r.get("fallback"):
                    print(f"download {i} failed: {e}", file=sys.stderr)
                    continue
                data = get(r["fallback"], raw=True)
            dest.write_bytes(data)
            info = analyse(dest)
            r["file"] = dest.name
            r["measured"] = info
            credits.append(f"- `{dest.name}` ({a.kind}): {r['credit']}")
            print(f"downloaded {dest} {info}")
        credits_path.write_text("\n".join(dict.fromkeys(credits)) + "\n")
        cand_file.write_text(json.dumps(res, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
