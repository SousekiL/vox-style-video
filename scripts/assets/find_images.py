"""Search openly licensed, high-resolution photos for collage cut-outs.

Sources: Wikimedia Commons (search + categories), Wikidata (named people/landmarks → P18 + Commons category),
Art Institute of Chicago (CC0), Library of Congress (archival), Openverse (needs OPENVERSE_TOKEN).
Only licences that allow reuse are kept: public domain, CC0, CC BY, CC BY-SA.

Usage:
  python3 -I scripts/assets/find_images.py "vintage cash register" --min 1600 --limit 12 --out public/assets/raw/register
  python3 -I scripts/assets/find_images.py "1920s banker portrait" --preview --out ...   (then --pick)

Writes <out>/candidates.json (url, size, licence, author, page) and, with --download N,
the top N files plus <out>/CREDITS.md. Pick the best candidate by LOOKING at it before cutting out.
"""
import argparse
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

UA = "collage-motion-asset-finder/1.0 (personal research; contact via repo owner)"
OK_LICENCES = re.compile(r"(public domain|pd|cc0|cc[- ]by(?![- ]nc)(?:[- ]sa)?)", re.I)


def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode("utf-8"))


def strip_html(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


def search_commons(query, limit):
    params = {
        "action": "query", "format": "json", "generator": "search", "gsrnamespace": "6",
        "gsrsearch": f"{query} filetype:bitmap", "gsrlimit": str(min(50, limit * 3)),
        "prop": "imageinfo", "iiprop": "url|size|extmetadata|mime", "iiurlwidth": "2400",
    }
    data = get_json("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params))
    out = []
    for page in (data.get("query", {}).get("pages", {}) or {}).values():
        ii = (page.get("imageinfo") or [{}])[0]
        meta = ii.get("extmetadata", {})
        lic = strip_html(meta.get("LicenseShortName", {}).get("value", ""))
        if not OK_LICENCES.search(lic) or ii.get("mime") not in ("image/jpeg", "image/png", "image/tiff"):
            continue
        out.append({
            "source": "commons", "title": page.get("title"), "width": ii.get("width"), "height": ii.get("height"),
            "url": ii.get("url"), "thumb": ii.get("thumburl"), "license": lic,
            "author": strip_html(meta.get("Artist", {}).get("value", ""))[:120],
            "page": ii.get("descriptionurl"),
        })
    return out


def commons_file_info(filename):
    params = {"action": "query", "format": "json", "titles": f"File:{filename}", "prop": "imageinfo",
              "iiprop": "url|size|extmetadata|mime", "iiurlwidth": "600"}
    data = get_json("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params))
    for page in (data.get("query", {}).get("pages", {}) or {}).values():
        ii = (page.get("imageinfo") or [{}])[0]
        meta = ii.get("extmetadata", {})
        return {
            "source": "wikidata-p18", "title": page.get("title"), "width": ii.get("width"), "height": ii.get("height"),
            "url": ii.get("url"), "thumb": ii.get("thumburl"),
            "license": strip_html(meta.get("LicenseShortName", {}).get("value", "")),
            "author": strip_html(meta.get("Artist", {}).get("value", ""))[:120], "page": ii.get("descriptionurl"),
        }
    return None


def search_wikidata(query, limit):
    """Named people, landmarks, objects: the entity's canonical image (P18). Best for real portraits."""
    ents = get_json("https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode(
        {"action": "wbsearchentities", "search": query, "language": "en", "format": "json", "limit": str(limit)}))
    out = []
    for e in ents.get("search", []):
        claims = get_json("https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode(
            {"action": "wbgetclaims", "entity": e["id"], "property": "P18", "format": "json"}))
        for c in claims.get("claims", {}).get("P18", [])[:2]:
            fn = c.get("mainsnak", {}).get("datavalue", {}).get("value")
            if fn:
                info = commons_file_info(fn)
                if info and OK_LICENCES.search(info["license"] or ""):
                    info["title"] = f"{e.get('label')} ({e.get('description', '')}) — {info['title']}"
                    out.append(info)
        cat = get_json("https://www.wikidata.org/w/api.php?" + urllib.parse.urlencode(
            {"action": "wbgetclaims", "entity": e["id"], "property": "P373", "format": "json"}))
        for c in cat.get("claims", {}).get("P373", [])[:1]:
            name = c.get("mainsnak", {}).get("datavalue", {}).get("value")
            if name:
                out += search_commons_category(name, limit)
        if out:
            break  # first matching entity is almost always the intended one
    return out


def search_aic(query, limit):
    """Art Institute of Chicago: CC0 public-domain images via IIIF (objects, photographs, prints)."""
    data = get_json("https://api.artic.edu/api/v1/artworks/search?" + urllib.parse.urlencode(
        {"q": query, "limit": str(limit * 2), "fields": "id,title,image_id,is_public_domain,artist_display,thumbnail"}))
    out = []
    for r in data.get("data", []):
        if not r.get("is_public_domain") or not r.get("image_id"):
            continue
        th = r.get("thumbnail") or {}
        out.append({"source": "aic", "title": r.get("title"), "width": th.get("width"), "height": th.get("height"),
                    "url": f"https://www.artic.edu/iiif/2/{r['image_id']}/full/3000,/0/default.jpg",
                    "thumb": f"https://www.artic.edu/iiif/2/{r['image_id']}/full/400,/0/default.jpg",
                    "license": "CC0 (AIC public domain)", "author": (r.get("artist_display") or "")[:120],
                    "page": f"https://www.artic.edu/artworks/{r['id']}"})
    return out[:limit]


def search_commons_category(category, limit):
    """All files in a Commons category (e.g. a person's category from Wikidata P373), largest first."""
    params = {"action": "query", "format": "json", "generator": "categorymembers", "gcmtitle": f"Category:{category}",
              "gcmtype": "file", "gcmlimit": "100", "prop": "imageinfo", "iiprop": "url|size|extmetadata|mime",
              "iiurlwidth": "600"}
    data = get_json("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(params))
    out = []
    for page in (data.get("query", {}).get("pages", {}) or {}).values():
        ii = (page.get("imageinfo") or [{}])[0]
        meta = ii.get("extmetadata", {})
        lic = strip_html(meta.get("LicenseShortName", {}).get("value", ""))
        if not OK_LICENCES.search(lic) or ii.get("mime") not in ("image/jpeg", "image/png", "image/tiff"):
            continue
        out.append({"source": "commons-cat", "title": page.get("title"), "width": ii.get("width"), "height": ii.get("height"),
                    "url": ii.get("url"), "thumb": ii.get("thumburl"), "license": lic,
                    "author": strip_html(meta.get("Artist", {}).get("value", ""))[:120], "page": ii.get("descriptionurl")})
    out.sort(key=lambda r: -(r["width"] or 0) * (r["height"] or 0))
    return out[:limit]


def search_loc(query, limit):
    """Library of Congress photos: archival, mostly 'no known restrictions'. Check rights per item."""
    data = get_json("https://www.loc.gov/photos/?" + urllib.parse.urlencode({"q": query, "fo": "json", "c": str(limit * 2)}))
    out = []
    for r in data.get("results", []):
        urls = [u for u in (r.get("image_url") or []) if u.startswith("http")]
        if not urls:
            continue
        best = urls[-1].split("#")[0]
        m = re.search(r"#h=(\d+)&w=(\d+)", urls[-1])
        h, w = (int(m.group(1)), int(m.group(2))) if m else (None, None)
        rights = " ".join(r.get("rights_information", []) if isinstance(r.get("rights_information"), list) else [str(r.get("rights_information", ""))])
        out.append({"source": "loc", "title": r.get("title"), "width": w, "height": h, "url": best, "thumb": urls[0].split("#")[0],
                    "license": "LoC: " + (rights[:60] or "check rights"), "author": "", "page": r.get("url") or r.get("id")})
    return out[:limit]


def search_openverse(query, limit):
    # Openverse requires an OAuth token now: export OPENVERSE_TOKEN=... (https://api.openverse.org/v1/#tag/auth)
    import os
    token = os.environ.get("OPENVERSE_TOKEN")
    if not token:
        raise RuntimeError("OPENVERSE_TOKEN not set; skipping Openverse")
    params = {"q": query, "page_size": str(min(50, limit * 3)), "license": "pdm,cc0,by,by-sa", "size": "large"}
    req = urllib.request.Request("https://api.openverse.org/v1/images/?" + urllib.parse.urlencode(params),
                                 headers={"User-Agent": UA, "Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read().decode("utf-8"))
    out = []
    for r in data.get("results", []):
        out.append({
            "source": "openverse:" + (r.get("source") or ""), "title": r.get("title"), "width": r.get("width"),
            "height": r.get("height"), "url": r.get("url"), "thumb": r.get("thumbnail"),
            "license": f"{r.get('license', '')} {r.get('license_version', '') or ''}".strip(),
            "author": (r.get("creator") or "")[:120], "page": r.get("foreign_landing_url"),
        })
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("query")
    ap.add_argument("--source", choices=["commons", "wikidata", "aic", "loc", "openverse"], action="append",
                    help="repeatable; default: commons + wikidata")
    ap.add_argument("--min", type=int, default=1600, help="minimum long side in px")
    ap.add_argument("--limit", type=int, default=12)
    ap.add_argument("--download", type=int, default=0)
    ap.add_argument("--preview", action="store_true", help="write preview.jpg: numbered thumbnails to choose from")
    ap.add_argument("--pick", default="", help="comma list of candidate indices to download (implies --download)")
    ap.add_argument("--max-width", type=int, default=2560, help="Commons/Wikidata: download this thumbnail width (0 = original)")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    sources = a.source or ["commons", "wikidata"]
    fns = {"commons": search_commons, "wikidata": search_wikidata, "aic": search_aic, "loc": search_loc,
           "openverse": search_openverse}
    res = []
    for src in sources:
        try:
            res += fns[src](a.query, a.limit)
        except Exception as e:  # one failing source must not kill the others
            print(f"{src} failed: {e}", file=sys.stderr)

    # Unknown sizes (loc) are kept; verify after download with treat.py's size warning.
    res = [r for r in res if r.get("url") and (r.get("width") is None or max(r["width"], r.get("height") or 0) >= a.min)]
    res.sort(key=lambda r: -((r["width"] or 3000) * (r["height"] or 3000)))
    res = res[: a.limit]
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    (out / "candidates.json").write_text(json.dumps(res, indent=2, ensure_ascii=False))
    for i, r in enumerate(res):
        print(f"[{i}] {r['width']}x{r['height']} {r['license']:<12} {r['source']:<20} {r['title']}")

    if a.preview and res:
        from io import BytesIO
        from PIL import Image, ImageDraw
        tiles = []
        for i, r in enumerate(res):
            try:
                req = urllib.request.Request(r.get("thumb") or r["url"], headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=60) as resp:
                    im = Image.open(BytesIO(resp.read())).convert("RGB")
                im.thumbnail((400, 400))
                tile = Image.new("RGB", (400, 430), (30, 30, 30))
                tile.paste(im, ((400 - im.width) // 2, 30 + (400 - im.height) // 2))
                ImageDraw.Draw(tile).text((6, 6), f"[{i}] {r['width']}x{r['height']} {r['license'][:14]}", fill=(255, 220, 0))
                tiles.append(tile)
            except Exception as e:
                print(f"thumb {i} failed: {e}", file=sys.stderr)
        cols = 4
        rows = (len(tiles) + cols - 1) // cols
        sheet = Image.new("RGB", (cols * 400, rows * 430), (20, 20, 20))
        for i, t in enumerate(tiles):
            sheet.paste(t, ((i % cols) * 400, (i // cols) * 430))
        sheet.save(out / "preview.jpg", quality=85)
        print(f"preview {out / 'preview.jpg'}")

    if a.pick and not a.download:
        a.download = 1
    if a.download:
        credits = ["# Credits", ""]
        picks = [int(x) for x in a.pick.split(",")] if a.pick else list(range(a.download))
        import time
        for n, i in enumerate(picks):
            r = res[i]
            url = r["url"]
            if r["source"].startswith(("commons", "wikidata")) and a.max_width:
                # Wikimedia rate-limits scripted downloads of originals (HTTP 429); standard thumbnail
                # widths are the sanctioned route (https://w.wiki/GHai). 2560 px covers 4K cut-outs.
                title = r["title"].split(" — ")[-1]
                info = get_json("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(
                    {"action": "query", "format": "json", "titles": title, "prop": "imageinfo",
                     "iiprop": "url", "iiurlwidth": str(a.max_width)}))
                page = next(iter(info.get("query", {}).get("pages", {}).values()), {})
                url = ((page.get("imageinfo") or [{}])[0]).get("thumburl") or url
            ext = Path(urllib.parse.urlparse(url).path).suffix.lower() or ".jpg"
            dest = out / f"cand_{i:02d}{ext}"
            for attempt in range(4):
                try:
                    req = urllib.request.Request(url, headers={"User-Agent": UA})
                    with urllib.request.urlopen(req, timeout=120) as resp:
                        dest.write_bytes(resp.read())
                    break
                except urllib.error.HTTPError as e:
                    if e.code != 429 or attempt == 3:
                        raise
                    time.sleep(10 * (attempt + 1))
            credits.append(f"- `{dest.name}`: {r['title']} by {r['author'] or 'unknown'}, {r['license']}, {r['page']}")
            print(f"downloaded {dest} ({dest.stat().st_size // 1024} KB)")
            if n < len(picks) - 1:
                time.sleep(1.5)
        (out / "CREDITS.md").write_text("\n".join(credits) + "\n")


if __name__ == "__main__":
    main()
