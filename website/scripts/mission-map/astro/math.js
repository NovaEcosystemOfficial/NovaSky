/** Shared angle / clamp helpers for the astronomy engine. */

export const DEG = Math.PI / 180;
export const RAD = 180 / Math.PI;

export function deg2rad(d) {
  return d * DEG;
}

export function rad2deg(r) {
  return r * RAD;
}

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

/** 0–360° */
export function normalizeDeg(angle) {
  return ((angle % 360) + 360) % 360;
}

/** -180…+180° */
export function normalizeSignedDeg(angle) {
  let a = normalizeDeg(angle);
  if (a > 180) a -= 360;
  return a;
}

/** 0–24h */
export function normalizeHours(h) {
  return ((h % 24) + 24) % 24;
}

/** Signed hour angle in degrees (−180…+180). */
export function hourAngleDeg(lstDeg, raDeg) {
  return normalizeSignedDeg(lstDeg - raDeg);
}

export function raHoursToDeg(raHours) {
  return raHours * 15;
}

export function angularSeparationDeg(ra1h, dec1, ra2h, dec2) {
  const a1 = deg2rad(dec1);
  const a2 = deg2rad(dec2);
  const dRa = deg2rad(raHoursToDeg(ra1h - ra2h));
  const cosD =
    Math.sin(a1) * Math.sin(a2) + Math.cos(a1) * Math.cos(a2) * Math.cos(dRa);
  return rad2deg(Math.acos(clamp(cosD, -1, 1)));
}
