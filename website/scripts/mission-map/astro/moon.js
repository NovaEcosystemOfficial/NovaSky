/** Moon position and phase (Meeus Ch. 45 — ~0.5° accuracy). */

import { deg2rad, rad2deg, normalizeDeg, angularSeparationDeg } from "./math.js";
import { julianDate } from "./time.js";
import { raDecToAltAz } from "./coords.js";
import { sunCoords } from "./sun.js";

export function moonCoords(date) {
  const jd = julianDate(date);
  const T = (jd - 2451545.0) / 36525;

  const Lp = normalizeDeg(218.316 + 481267.881 * T);
  const D = normalizeDeg(297.850 + 445267.111 * T);
  const M = normalizeDeg(357.529 + 35999.050 * T);
  const Mp = normalizeDeg(134.963 + 477198.868 * T);
  const F = normalizeDeg(93.272 + 483202.018 * T);

  const Dr = deg2rad(D);
  const Mr = deg2rad(M);
  const Mpr = deg2rad(Mp);

  let lambda =
    Lp +
    6.289 * Math.sin(Mpr) +
    1.274 * Math.sin(2 * Dr - Mpr) +
    0.658 * Math.sin(2 * Dr) +
    0.214 * Math.sin(2 * Mpr) -
    0.186 * Math.sin(Mr) -
    0.114 * Math.sin(2 * deg2rad(F));

  let beta =
    5.128 * Math.sin(deg2rad(F)) +
    0.281 * Math.sin(Mpr + deg2rad(F)) +
    0.278 * Math.sin(Mpr - deg2rad(F));

  const epsilon = deg2rad(23.439 - 0.0000004 * (jd - 2451545.0));
  const lambdaRad = deg2rad(lambda);
  const betaRad = deg2rad(beta);

  const ra = rad2deg(
    Math.atan2(
      Math.sin(lambdaRad) * Math.cos(epsilon) - Math.tan(betaRad) * Math.sin(epsilon),
      Math.cos(lambdaRad),
    ),
  ) / 15;
  const dec = rad2deg(
    Math.asin(
      Math.sin(betaRad) * Math.cos(epsilon) +
        Math.cos(betaRad) * Math.sin(epsilon) * Math.sin(lambdaRad),
    ),
  );

  return { ra: ((ra % 24) + 24) % 24, dec };
}

export function moonAltAz(latDeg, lonDeg, date) {
  const { ra, dec } = moonCoords(date);
  return { ...raDecToAltAz(ra, dec, latDeg, lonDeg, date), ra, dec };
}


/** Illuminated fraction 0–1 and phase label. */
export function moonPhase(date) {
  const sun = sunCoords(date);
  const moon = moonCoords(date);
  const elong = angularSeparationDeg(sun.ra, sun.dec, moon.ra, moon.dec);
  const illuminated = (1 - Math.cos(deg2rad(elong))) / 2;

  let label = "Calante";
  if (illuminated < 0.05) label = "Nuova";
  else if (illuminated < 0.45) label = "Crescente";
  else if (illuminated < 0.55) label = "Piena";
  else if (illuminated < 0.95) label = "Gibbosa";
  else label = "Piena";

  return {
    illuminated: clamp01(illuminated),
    illuminationPct: Math.round(illuminated * 100),
    label,
    elongationDeg: elong,
  };
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function moonSeparationFromTarget(targetRa, targetDec, date) {
  const moon = moonCoords(date);
  return angularSeparationDeg(targetRa, targetDec, moon.ra, moon.dec);
}
