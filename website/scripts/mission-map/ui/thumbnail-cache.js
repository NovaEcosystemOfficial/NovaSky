/** Loads transparent PNG previews — falls back to procedural art. */

import { paintTargetArt } from "./target-art.js";

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export class ThumbnailCache {
  /** @param {object[]} targets @param {string} assetBase */
  constructor(targets, assetBase = "../assets/targets") {
    this.targets = targets;
    this.assetBase = assetBase;
    this.mini = new Map();
    this.hero = new Map();
    this.ready = false;
  }

  async load() {
    await Promise.all(
      this.targets.map(async (target) => {
        try {
          const [miniImg, heroImg] = await Promise.all([
            loadImage(`${this.assetBase}/mini/${target.id}.png`),
            loadImage(`${this.assetBase}/hero/${target.id}.png`),
          ]);
          this.mini.set(target.id, miniImg);
          this.hero.set(target.id, heroImg);
        } catch {
          const miniCanvas = document.createElement("canvas");
          miniCanvas.width = 128;
          miniCanvas.height = 100;
          paintTargetArt(miniCanvas, target, "mini", true);
          this.mini.set(target.id, miniCanvas);

          const heroCanvas = document.createElement("canvas");
          heroCanvas.width = 800;
          heroCanvas.height = 500;
          paintTargetArt(heroCanvas, target, "hero", true);
          this.hero.set(target.id, heroCanvas);
        }
      }),
    );
    this.ready = true;
  }

  getMini(id) {
    return this.mini.get(id) ?? null;
  }

  getHero(id) {
    return this.hero.get(id) ?? null;
  }
}
