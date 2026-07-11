/** Backward-compatible re-exports — use catalog + sky-compute for live data. */

export { CATALOG as TARGETS, RECOMMENDATION } from "./catalog.js";

/** Constellation overlays removed in Sprint 8 (real sky uses computed positions). */
export const CONSTELLATIONS = [];

export const TONIGHT_META = {};
