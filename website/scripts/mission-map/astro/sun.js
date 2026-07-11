/** Sun position and twilight times (low-precision, Meeus Ch. 25). */

import { deg2rad, rad2deg, normalizeDeg } from "./math.js";
import { julianDate, addMinutes } from "./time.js";
import { raDecToAltAz } from "./coords.js";

function sunCoords(date) {
  const jd = julianDate(date);
  const n = jd - 2451545.0;
  const L = normalizeDeg(280.46 + 0.9856474 * n);
  const g = deg2rad(normalizeDeg(357.528 + 0.9856003 * n));
  const lambda = deg2rad(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
  const epsilon = deg2rad(23.439 - 0.0000004 * n);
  const ra = rad2deg(Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda))) / 15;
  const dec = rad2deg(Math.asin(Math.sin(epsilon) * Math.sin(lambda)));
  return { ra: ((ra % 24) + 24) % 24, dec };
}

export function sunAltAz(latDeg, lonDeg, date) {
  const { ra, dec } = sunCoords(date);
  const { alt, az } = raDecToAltAz(ra, dec, latDeg, lonDeg, date);
  return { alt, az, ra, dec };
}

function findCrossing(latDeg, lonDeg, startDate, targetAlt, direction, maxSteps = 200) {
  let t = new Date(startDate);
  let prev = sunAltAz(latDeg, lonDeg, t).alt;
  for (let i = 0; i < maxSteps; i++) {
    t = addMinutes(t, 5);
    const cur = sunAltAz(latDeg, lonDeg, t).alt;
    if (direction === "down" && prev > targetAlt && cur <= targetAlt) return t;
    if (direction === "up" && prev < targetAlt && cur >= targetAlt) return t;
    prev = cur;
  }
  return null;
}

/**
 * Astronomical night bounds that contain `date` (even after midnight).
 * @returns {{ evening: Date|null, morning: Date|null }}
 */
export function astronomicalTwilight(latDeg, lonDeg, date) {
  const at = sunAltAz(latDeg, lonDeg, date).alt;

  // Walk backward to find start of current/previous night
  let probe = new Date(date);
  let evening = null;
  for (let i = 0; i < 288; i++) {
    probe = addMinutes(probe, -10);
    const alt = sunAltAz(latDeg, lonDeg, probe).alt;
    if (alt > -18) {
      evening = findCrossing(latDeg, lonDeg, probe, -18, "down");
      break;
    }
  }

  // Walk forward to find end of night
  probe = new Date(date);
  let morning = null;
  for (let i = 0; i < 288; i++) {
    probe = addMinutes(probe, 10);
    const alt = sunAltAz(latDeg, lonDeg, probe).alt;
    if (alt > -18) {
      morning = findCrossing(latDeg, lonDeg, addMinutes(probe, -10), -18, "up");
      break;
    }
  }

  // Daytime fallback: next night
  if (!evening && at > -18) {
    const noon = new Date(date);
    noon.setHours(12, 0, 0, 0);
    evening = findCrossing(latDeg, lonDeg, noon, -18, "down");
    if (evening) {
      morning = findCrossing(latDeg, lonDeg, addMinutes(evening, 360), -18, "up");
    }
  }

  return { evening, morning };
}

export { sunCoords };
