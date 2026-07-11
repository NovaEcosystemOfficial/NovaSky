/** Pre-rendered astronomical preview thumbnails for sky & card. */

import { buildThumbnailCache } from "./target-art.js";

export class ThumbnailCache {
  /** @param {object[]} targets */
  constructor(targets) {
    const { mini, hero } = buildThumbnailCache(targets);
    this.mini = mini;
    this.hero = hero;
  }

  getMini(id) {
    return this.mini.get(id) ?? null;
  }

  getHero(id) {
    return this.hero.get(id) ?? null;
  }
}
