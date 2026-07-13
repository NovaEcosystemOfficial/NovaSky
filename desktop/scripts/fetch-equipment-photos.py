#!/usr/bin/env python3
"""
Scarica foto attrezzatura da Wikimedia Commons in desktop/app/assets/observatory/photos/.

Uso (dalla root del repo):
  python3 desktop/scripts/fetch-equipment-photos.py
"""

from __future__ import annotations

import json
import math
import re
import sys
import time
from io import BytesIO
from pathlib import Path

import requests
from PIL import Image, ImageEnhance

Image.MAX_IMAGE_PIXELS = 200_000_000

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "app" / "assets" / "observatory" / "photos"
CREDITS_PATH = OUT_DIR / "credits.json"

API = "https://commons.wikimedia.org/w/api.php"
HEADERS = {
    "User-Agent": "NovaSkyAssetBot/1.0 (https://github.com/NovaEcosystemOfficial/NovaSky; equipment photo pipeline)",
}

# File Wikimedia curati — licenze libere / CC con attribuzione.
SOURCES: dict[str, str] = {
    "seestar-s50": "Seestar S50 smart telescope.jpg",
    "seestar-s30": "Seestar S50 smart telescope.jpg",
    "canon-80d": "Canon EOS 80D 1.JPG",
    "canon-2000d": "Left side view of Canon EOS Rebel T7 or 2000D Body.jpg",
    "eq6": "90mm Apochromatic Refractor on NEQ6 Pro German Equatorial mount.jpg",
    "eagle-core": "Intel NUC.png",
    "guide-camera": "Webcam astrophotography 2007 09 15.jpg",
    "focuser": "First Light for a new scope - Equinox 120ED (17798969953).jpg",
    "filter-wheel": "Ritchey–Chrétien at Kickapoo Valley Reserve 2-b.jpg",
    "ota-deep-sky": "ED120.jpg",
    "setup-deep-sky": "90mm Apochromatic Refractor on NEQ6 Pro German Equatorial mount.jpg",
    "panorama": "Imaging IC 10 at Kickapoo Valley Reserve.jpg",
    "default": "ApoRef.png",
}

CARD_SIZE = (1200, 800)
HERO_SIZE = (1600, 900)
PANORAMA_SIZE = (1920, 720)


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
    page = next(iter(r.json()["query"]["pages"].values()))
    if page.get("missing") == "":
        raise FileNotFoundError(f"File non trovato: {filename}")
    info = page["imageinfo"][0]
    meta = info.get("extmetadata", {})
    return {
        "title": page["title"].replace("File:", ""),
        "url": info["url"],
        "artist": meta.get("Artist", {}).get("value", ""),
        "credit": meta.get("Credit", {}).get("value", ""),
        "license": meta.get("LicenseShortName", {}).get("value", "Unknown"),
    }


def download_image(url: str) -> Image.Image:
    r = requests.get(url, headers=HEADERS, timeout=120)
    r.raise_for_status()
    img = Image.open(BytesIO(r.content)).convert("RGBA")
    max_side = 2800
    w, h = img.size
    if max(w, h) > max_side:
        scale = max_side / max(w, h)
        img = img.resize((int(w * scale), int(h * scale)), Image.Resampling.LANCZOS)
    return img


def luminance(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def content_bbox(img: Image.Image, threshold: float = 16.0) -> tuple[int, int, int, int]:
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
    pad_x = int((max_x - min_x) * 0.05)
    pad_y = int((max_y - min_y) * 0.05)
    return (
        max(0, min_x - pad_x),
        max(0, min_y - pad_y),
        min(w, max_x + pad_x),
        min(h, max_y + pad_y),
    )


def fit_cover(img: Image.Image, size: tuple[int, int]) -> Image.Image:
    x0, y0, x1, y1 = content_bbox(img)
    cropped = img.crop((x0, y0, x1, y1))
    cw, ch = cropped.size
    target_w, target_h = size
    scale = max(target_w / cw, target_h / ch)
    nw, nh = max(1, int(cw * scale)), max(1, int(ch * scale))
    resized = cropped.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - target_w) // 2
    top = (nh - target_h) // 2
    out = resized.crop((left, top, left + target_w, top + target_h))
    out = ImageEnhance.Contrast(out).enhance(1.03)
    out = ImageEnhance.Color(out).enhance(0.95)
    return out


def strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def process_asset(asset_id: str, filename: str) -> dict:
    print(f"  → {asset_id}: {filename}")
    info = wiki_file_info(filename)
    img = download_image(info["url"])

    if asset_id == "panorama":
        out = fit_cover(img, PANORAMA_SIZE)
    elif asset_id.startswith("setup-"):
        out = fit_cover(img, HERO_SIZE)
    else:
        out = fit_cover(img, CARD_SIZE)

    out_path = OUT_DIR / f"{asset_id}.jpg"
    out.convert("RGB").save(out_path, "JPEG", quality=86, optimize=True)

    return {
        "id": asset_id,
        "file": info["title"],
        "source": "Wikimedia Commons",
        "artist": strip_html(info["artist"])[:240],
        "credit": strip_html(info["credit"])[:320],
        "license": info["license"],
        "localPath": f"photos/{asset_id}.jpg",
    }


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    only = [a for a in sys.argv[1:] if not a.startswith("-")]
    targets = {k: v for k, v in SOURCES.items() if not only or k in only}

    credits: dict[str, object] = {
        "version": 1,
        "updatedAt": time.strftime("%Y-%m-%d"),
        "note": "Foto rappresentative da Wikimedia Commons — sostituibili con scatti dell'osservatorio reale.",
        "assets": {},
    }

    for asset_id, filename in targets.items():
        try:
            entry = process_asset(asset_id, filename)
            credits["assets"][asset_id] = entry
            time.sleep(0.35)
        except Exception as exc:
            print(f"  ✗ {asset_id}: {exc}", file=sys.stderr)
            return 1

    CREDITS_PATH.write_text(json.dumps(credits, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\n✓ {len(targets)} asset in {OUT_DIR}")
    print(f"✓ Crediti: {CREDITS_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
