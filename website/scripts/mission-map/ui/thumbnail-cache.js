/** Loads transparent PNG previews — falls back to procedural art. */

import { paintTargetArt } from "./target-art.js";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

function proceduralMini(target) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 100;
  paintTargetArt(canvas, target, "mini", true);
  return canvas;
}

function proceduralHero(target) {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 500;
  paintTargetArt(canvas, target, "hero", true);
  return canvas;
}

/** @param {CanvasImageSource} source */
export function imageSourceToUrl(source) {
  if (source instanceof HTMLImageElement && source.src) return source.src;
  if (source instanceof HTMLCanvasElement) return source.toDataURL("image/png");
  return "";
}

export class ThumbnailCache {
  /** @param {object[]} targets @param {string} assetBase */
  constructor(targets, assetBase = "/assets/targets") {
    this.targets = targets;
    this.assetBase = assetBase;
    this.mini = new Map();
    this.hero = new Map();
    this.ready = false;
    this.loaded = 0;
    this.failed = 0;
  }

  async loadOne(target) {
    const miniPath = `${this.assetBase}/mini/${target.id}.png`;
    const heroPath = `${this.assetBase}/hero/${target.id}.jpg`;

    const miniResult = await loadImage(miniPath).catch(() => null);
    if (miniResult) {
      this.mini.set(target.id, miniResult);
    } else {
      this.mini.set(target.id, proceduralMini(target));
      this.failed += 1;
    }

    const heroResult = await loadImage(heroPath).catch(() => null);
    if (heroResult) {
      this.hero.set(target.id, heroResult);
    } else {
      this.hero.set(target.id, proceduralHero(target));
      this.failed += 1;
    }

    this.loaded += 1;
  }

  async load() {
    await Promise.all(this.targets.map((target) => this.loadOne(target)));
    this.ready = true;
    if (this.failed > 0) {
      console.warn(`NovaSky: ${this.failed} asset(s) used procedural fallback`);
    }
  }

  getMini(id) {
    return this.mini.get(id) ?? null;
  }

  getHero(id) {
    return this.hero.get(id) ?? null;
  }

  getMiniUrl(id) {
    const src = this.getMini(id);
    return src ? imageSourceToUrl(src) : "";
  }

  getHeroUrl(id) {
    const src = this.getHero(id);
    return src ? imageSourceToUrl(src) : "";
  }
}
