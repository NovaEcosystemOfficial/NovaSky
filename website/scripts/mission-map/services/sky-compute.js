/** Orchestrates astronomy engine for a single observer instant. */

import { CATALOG } from "../data/catalog.js";
import { astronomicalTwilight } from "../astro/sun.js";
import { moonAltAz, moonPhase } from "../astro/moon.js";
import { computeTargetSky, filterSkyTargets, pickDefaultTarget } from "../astro/visibility.js";
import { buildNightVerdict, buildExpectation } from "../astro/recommendation.js";
import { formatDateLocal, formatTimeLocal, formatTimeRange } from "../astro/time.js";

function formatLat(lat) {
  return lat >= 0 ? `${lat.toFixed(1)}°N` : `${Math.abs(lat).toFixed(1)}°S`;
}

/**
 * @param {object} observer - { lat, lon, label, source }
 * @param {Date} when - simulated local instant
 */
export function computeSkySession(observer, when) {
  const twilight = astronomicalTwilight(observer.lat, observer.lon, when);
  const moonPos = moonAltAz(observer.lat, observer.lon, when);
  const phase = moonPhase(when);

  const moonContext = {
    alt: moonPos.alt,
    illuminationPct: phase.illuminationPct,
    phaseLabel: phase.label,
  };

  const targets = CATALOG.map((entry) => {
    const computed = computeTargetSky(entry, observer, when, twilight, moonContext);
    return { ...computed, expectation: buildExpectation(entry) };
  });

  const visible = filterSkyTargets(targets);

  const twilightLabel =
    twilight.evening && twilight.morning
      ? formatTimeRange(twilight.evening, twilight.morning)
      : "—";

  return {
    observer,
    when,
    targets,
    visibleTargets: visible,
    defaultTarget: pickDefaultTarget(targets),
    meta: {
      date: formatDateLocal(when),
      time: formatTimeLocal(when),
      location: `${observer.label} · ${formatLat(observer.lat)}`,
      verdict: buildNightVerdict(targets),
      window: twilightLabel,
      moon: `Luna ${phase.label.toLowerCase()} · ${phase.illuminationPct}% · ${Math.round(moonPos.alt)}° alt.`,
      twilight: {
        evening: twilight.evening,
        morning: twilight.morning,
        label: twilightLabel,
      },
    },
  };
}

/** Build night hour options for time slider (local). */
export function buildNightHours(baseDate, twilight) {
  const hours = [];
  const start = twilight?.evening ?? new Date(baseDate);
  if (!twilight?.evening) start.setHours(21, 0, 0, 0);

  let t = new Date(start);
  const end = twilight?.morning ?? new Date(start.getTime() + 8 * 3600_000);

  while (t <= end) {
    hours.push(new Date(t));
    t = new Date(t.getTime() + 30 * 60_000);
  }
  return hours;
}

export function findNearestNightStep(steps, when) {
  if (!steps.length) return when;
  let best = steps[0];
  let bestD = Math.abs(steps[0] - when);
  for (const s of steps) {
    const d = Math.abs(s - when);
    if (d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}
