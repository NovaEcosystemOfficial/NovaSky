/** Target visibility, culmination, and observability windows. */

import { raDecToAltAz } from "./coords.js";
import { addMinutes, formatTimeLocal } from "./time.js";
import { resolveEquatorial } from "./planets.js";
import { moonSeparationFromTarget } from "./moon.js";
import { classifyAltitude, stateLabel } from "./states.js";
import { buildVerdict } from "./recommendation.js";
import { SKY_LIMITS } from "../data/config.js";

const { MIN_ALT, SAMPLE_MINUTES } = SKY_LIMITS;

function sampleAltitudes(entry, observer, start, end) {
  const samples = [];
  let t = new Date(start);
  while (t <= end) {
    const eq = resolveEquatorial(entry, t);
    const { alt, az } = raDecToAltAz(eq.ra, eq.dec, observer.lat, observer.lon, t);
    samples.push({ time: new Date(t), alt, az, ra: eq.ra, dec: eq.dec });
    t = addMinutes(t, SAMPLE_MINUTES);
  }
  return samples;
}

/** Find contiguous intervals where alt >= minAlt. */
function findWindows(samples, minAlt) {
  const windows = [];
  let start = null;
  for (const s of samples) {
    if (s.alt >= minAlt) {
      if (!start) start = s.time;
    } else if (start) {
      windows.push({ start, end: s.time });
      start = null;
    }
  }
  if (start && samples.length) {
    windows.push({ start, end: samples[samples.length - 1].time });
  }
  return windows;
}

function findCulmination(samples) {
  let best = samples[0];
  for (const s of samples) {
    if (s.alt > best.alt) best = s;
  }
  return best
    ? { time: best.time, alt: best.alt, az: best.az }
    : { time: null, alt: 0, az: 0 };
}

/**
 * Full computed sky state for one catalog entry.
 * @param {object} entry - catalog object
 * @param {object} observer - { lat, lon }
 * @param {Date} now - simulated instant
 * @param {{ evening: Date, morning: Date }} twilight
 * @param {object} moonContext - { alt, illuminationPct, phaseLabel }
 */
export function computeTargetSky(entry, observer, now, twilight, moonContext) {
  const eq = resolveEquatorial(entry, now);
  const current = raDecToAltAz(eq.ra, eq.dec, observer.lat, observer.lon, now);
  const state = classifyAltitude(current.alt, SKY_LIMITS);

  const nightStart = twilight.evening ?? addMinutes(now, -120);
  const nightEnd = twilight.morning ?? addMinutes(now, 360);
  const samples = sampleAltitudes(entry, observer, nightStart, nightEnd);
  const windows = findWindows(samples, MIN_ALT);
  const bestWindow = windows.sort((a, b) => {
    const durA = a.end - a.start;
    const durB = b.end - b.start;
    return durB - durA;
  })[0];

  const culmination = findCulmination(samples);
  const moonSep = moonSeparationFromTarget(eq.ra, eq.dec, now);

  const verdict = buildVerdict({
    entry,
    alt: current.alt,
    az: current.az,
    state,
    moonSep,
    moonAlt: moonContext.alt,
    moonIllum: moonContext.illuminationPct,
    bestWindow,
    culmination,
    now,
  });

  return {
    ...entry,
    ra: eq.ra,
    dec: eq.dec,
    alt: Math.round(current.alt * 10) / 10,
    az: Math.round(current.az * 10) / 10,
    state,
    stateLabel: stateLabel(state),
    window: bestWindow
      ? {
          start: formatTimeLocal(bestWindow.start),
          end: formatTimeLocal(bestWindow.end),
          startDate: bestWindow.start,
          endDate: bestWindow.end,
        }
      : { start: "—", end: "—", startDate: null, endDate: null },
    culmination: {
      time: culmination.time ? formatTimeLocal(culmination.time) : "—",
      alt: Math.round(culmination.alt * 10) / 10,
      az: Math.round(culmination.az * 10) / 10,
    },
    moonSeparation: Math.round(moonSep * 10) / 10,
    recommendation: verdict.level,
    reason: verdict.reason,
    novaScore: verdict.score,
    visibleTonight: windows.length > 0,
    aboveHorizon: current.alt >= 0,
  };
}

/** Targets to render on the map at the current instant. */
export function filterSkyTargets(computedTargets) {
  return computedTargets.filter((t) => t.aboveHorizon && t.visibleTonight);
}

/** Best target to auto-select on load. */
export function pickDefaultTarget(computedTargets) {
  const visible = filterSkyTargets(computedTargets);
  const ranked = visible.sort((a, b) => {
    const score = (t) =>
      (t.recommendation === "recommended" ? 3 : t.recommendation === "possible" ? 2 : 1) * 100 +
      t.alt;
    return score(b) - score(a);
  });
  return ranked[0] ?? visible[0] ?? null;
}

export { findWindows, sampleAltitudes };
