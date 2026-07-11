#!/usr/bin/env python3
"""
Fetch real astronomical photos from Wikimedia Commons and build NovaSky target assets.

Usage (from repo root):
  python3 website/scripts/fetch-target-photos.py

Outputs:
  website/assets/targets/hero/{id}.jpg
  website/assets/targets/mini/{id}.png
  website/assets/targets/credits.json
"""

from __future__ import annotations

import json
import math
import sys
import time
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image, ImageEnhance, ImageDraw

Image.MAX_IMAGE_PIXELS = 200_000_000

ROOT = Path(__file__).resolve().parents[1]
HERO_DIR = ROOT / "assets" / "targets" / "hero"
MINI_DIR = ROOT / "assets" / "targets" / "mini"
CREDITS_PATH = ROOT / "assets" / "targets" / "credits.json"

API = "https://commons.wikimedia.org/w/api.php"
HEADERS = {
    "User-Agent": "NovaSkyAssetBot/1.0 (https://github.com/NovaEcosystemOfficial/NovaSky; educational asset pipeline)",
}

HERO_SIZE = (1600, 1000)
MINI_SIZE = (256, 200)

# Curated Wikimedia Commons filenames — verified public-domain / CC with attribution.
SOURCES: dict[str, str] = {
    "ngc7000": "Cygnus Wall, NGC 7000.jpg",
    "ic1396": "Elephant's Trunk Nebula, IC 1396A.png",
    "m27": "M27, NGC 6853, Dumbbell Nebula (noao-02184).jpg",
    "m57": "Hubble image of the Ring Nebula (Messier 57).jpg",
    "m13": "Globular Cluster Messier 13 (M13).jpg",
    "m31": "Andromeda Galaxy (with h-alpha).jpg",
    "m51": "Messier51.jpg",
    "m101": "M101 The Pinwheel galaxy.png",
    "m81": "Bode and Cigar galaxies.jpg",
    "m17": "The Omega Nebula, M17 (noao-m17).jpg",
    "m16": "Eagle Nebula from ESO.jpg",
    "m20": "Trifid Nebula (M20).jpg",
    "m8": "Lagoon Nebula (ESO).jpg",
    "ic1805": "Heart Nebula (2020-08-11).jpg",
    "ngc2244": "The Rosette Nebula, otherwise known as NGC 2244.jpg",
    "m92": "M92, NGC 6341 (noao-m92).jpg",
    "m3": "Globular Cluster Messier 3 (M3).jpg",
    "m97": "Owl Nebula, M97, NGC 3587 (noao0310a).jpg",
    "m33": "M33 - The Triangulum Galaxy.jpg",
    "m42": "Orion Nebula (M42) part HST 4800px.jpg",
    "m45": "Pleiades large.jpg",
    "b33": "Barnard 33.jpg",
    "ngc6992": "Ultraviolet image of the Cygnus Loop Nebula crop.jpg",
    "m104": "M104 ngc4594 sombrero galaxy hi-res.jpg",
    "m78": "Messier 78.jpg",
    "saturn": "PIA17218 – A Farewell to Saturn, Brightened Version.jpg",
    "m1": "A Giant Hubble Mosaic of the Crab Nebula DVIDS693637.jpg",
}


def wiki_file_info(filename: str) -> dict:
    title = filename if filename.startswith("File:") else f"File:{filename}"
    r = requests.get(
        API,
        params={
            "action": "query",
            "titles": title,
            "prop": "imageinfo",
            "iiprop": "url|extmetadata|size",
            "format": "json",
        },
        headers=HEADERS,
        timeout=30,
    )
    r.raise_for_status()
    pages = r.json()["query"]["pages"]
    page = next(iter(pages.values()))
    if page.get("missing") == "":
        raise FileNotFoundError(f"Wikimedia file not found: {filename}")
    info = page["imageinfo"][0]
    meta = info.get("extmetadata", {})
    return {
        "title": page["title"].replace("File:", ""),
        "url": info["url"],
        "width": info["width"],
        "height": info["height"],
        "artist": meta.get("Artist", {}).get("value", ""),
        "credit": meta.get("Credit", {}).get("value", ""),
        "license": meta.get("LicenseShortName", {}).get("value", "Unknown"),
        "source_url": meta.get("ObjectName", {}).get("value", info["url"]),
    }


def download_image(url: str) -> Image.Image:
    r = requests.get(url, headers=HEADERS, timeout=120)
    r.raise_for_status()
    img = Image.open(BytesIO(r.content))
    img = img.convert("RGBA")
    # Downscale very large sources before processing — faster and lighter output.
    max_side = 3200
    w, h = img.size
    if max(w, h) > max_side:
        scale = max_side / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    return img


def luminance(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def content_bbox(img: Image.Image, threshold: float = 18.0) -> tuple[int, int, int, int]:
    px = img.load()
    w, h = img.size
    min_x, min_y, max_x, max_y = w, h, 0, 0
    found = False
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            if luminance(r, g, b) > threshold:
                found = True
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if not found:
        return 0, 0, w, h
    pad_x = int((max_x - min_x) * 0.06)
    pad_y = int((max_y - min_y) * 0.06)
    return (
        max(0, min_x - pad_x),
        max(0, min_y - pad_y),
        min(w, max_x + pad_x),
        min(h, max_y + pad_y),
    )


def crop_hero(img: Image.Image) -> Image.Image:
    x0, y0, x1, y1 = content_bbox(img)
    cropped = img.crop((x0, y0, x1, y1))
    cw, ch = cropped.size
    target_ratio = HERO_SIZE[0] / HERO_SIZE[1]
    current_ratio = cw / ch
    if current_ratio > target_ratio:
        new_w = int(ch * target_ratio)
        left = (cw - new_w) // 2
        cropped = cropped.crop((left, 0, left + new_w, ch))
    else:
        new_h = int(cw / target_ratio)
        top = (ch - new_h) // 2
        cropped = cropped.crop((0, top, cw, top + new_h))
    hero = cropped.resize(HERO_SIZE, Image.Resampling.LANCZOS)
    hero = ImageEnhance.Contrast(hero).enhance(1.04)
    hero = ImageEnhance.Color(hero).enhance(0.92)
    # Soft vignette via radial mask
    overlay = Image.new("RGBA", HERO_SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    cx, cy = HERO_SIZE[0] / 2, HERO_SIZE[1] / 2
    max_r = math.hypot(cx, cy)
    steps = 48
    for i in range(steps, 0, -1):
        t = i / steps
        r = max_r * t
        alpha = int(max(0, (t - 0.55) / 0.45) ** 1.6 * 90)
        draw.ellipse((cx - r, cy - r * 0.82, cx + r, cy + r * 0.82), fill=(0, 0, 0, alpha))
    hero = Image.alpha_composite(hero, overlay)
    return hero


def make_mini(img: Image.Image) -> Image.Image:
    x0, y0, x1, y1 = content_bbox(img, threshold=14.0)
    cropped = img.crop((x0, y0, x1, y1))
    cw, ch = cropped.size
    scale = min(MINI_SIZE[0] / cw, MINI_SIZE[1] / ch) * 0.88
    nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)

    # Remove dark background for suspended-in-space look
    px = resized.load()
    for y in range(nh):
        for x in range(nw):
            r, g, b, a = px[x, y]
            lum = luminance(r, g, b)
            if lum < 12:
                px[x, y] = (r, g, b, 0)
            elif lum < 28:
                fade = (lum - 12) / 16
                px[x, y] = (r, g, b, int(a * fade))

    canvas = Image.new("RGBA", MINI_SIZE, (0, 0, 0, 0))
    ox = (MINI_SIZE[0] - nw) // 2
    oy = (MINI_SIZE[1] - nh) // 2
    canvas.paste(resized, (ox, oy), resized)
    return canvas


def strip_html(text: str) -> str:
    import re

    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def process_target(target_id: str, filename: str) -> dict:
    print(f"  → {target_id}: {filename}")
    info = wiki_file_info(filename)
    img = download_image(info["url"])
    hero = crop_hero(img)
    mini = make_mini(img)

    hero_path = HERO_DIR / f"{target_id}.jpg"
    mini_path = MINI_DIR / f"{target_id}.png"
    hero.convert("RGB").save(hero_path, "JPEG", quality=86, optimize=True)
    mini.save(mini_path, "PNG", optimize=True)

    return {
        "id": target_id,
        "file": info["title"],
        "source": "Wikimedia Commons",
        "artist": strip_html(info["artist"])[:200],
        "credit": strip_html(info["credit"])[:300],
        "license": info["license"],
        "url": info["url"],
    }


def main() -> int:
    HERO_DIR.mkdir(parents=True, exist_ok=True)
    MINI_DIR.mkdir(parents=True, exist_ok=True)

    only = [a for a in sys.argv[1:] if not a.startswith("-")]
    targets = {k: v for k, v in SOURCES.items() if not only or k in only}

    credits: dict[str, dict] = {}
    if CREDITS_PATH.exists() and not only:
        credits = json.loads(CREDITS_PATH.read_text(encoding="utf-8"))
    elif CREDITS_PATH.exists() and only:
        credits = json.loads(CREDITS_PATH.read_text(encoding="utf-8"))

    errors: list[str] = []

    print(f"Fetching {len(targets)} real astronomical photos…")
    for i, (target_id, filename) in enumerate(targets.items(), 1):
        print(f"[{i}/{len(targets)}]", end=" ")
        try:
            credits[target_id] = process_target(target_id, filename)
        except Exception as exc:
            errors.append(f"{target_id}: {exc}")
            print(f"  ✗ FAILED: {exc}")
        time.sleep(0.4)

    CREDITS_PATH.write_text(json.dumps(credits, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    js_path = ROOT / "scripts" / "mission-map" / "data" / "photo-credits.js"
    js_lines = ["/** Auto-generated by fetch-target-photos.py — do not edit manually. */", "", "export const PHOTO_CREDITS = {"]
    for tid, c in credits.items():
        artist = c.get("artist", "").replace("\\", "\\\\").replace('"', '\\"')
        license_ = c.get("license", "").replace('"', '\\"')
        js_lines.append(f'  "{tid}": {{ artist: "{artist}", license: "{license_}" }},')
    js_lines.append("};")
    js_lines.append("")
    js_path.write_text("\n".join(js_lines), encoding="utf-8")
    print(f"Credits JS → {js_path}")

    print(f"\nDone. Credits → {CREDITS_PATH}")
    if errors:
        print("\nErrors:")
        for e in errors:
            print(" ", e)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
