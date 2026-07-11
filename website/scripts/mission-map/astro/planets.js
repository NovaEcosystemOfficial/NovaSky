/** Low-precision planetary ephemerides (Paul Schlyter / Meeus). */

import { deg2rad, rad2deg, normalizeDeg } from "./math.js";
import { julianDate } from "./time.js";

function kepler(Mdeg, e) {
  let E = deg2rad(Mdeg);
  let delta = 1;
  for (let i = 0; i < 12 && Math.abs(delta) > 1e-6; i++) {
    delta = (E - e * Math.sin(E) - deg2rad(Mdeg)) / (1 - e * Math.cos(E));
    E -= delta;
  }
  return E;
}

function eclipticToEquatorial(lambdaDeg, betaDeg, epsilonDeg) {
  const lambda = deg2rad(lambdaDeg);
  const beta = deg2rad(betaDeg);
  const eps = deg2rad(epsilonDeg);
  const ra = rad2deg(
    Math.atan2(
      Math.sin(lambda) * Math.cos(eps) - Math.tan(beta) * Math.sin(eps),
      Math.cos(lambda),
    ),
  );
  const dec = rad2deg(
    Math.asin(Math.sin(beta) * Math.cos(eps) + Math.cos(beta) * Math.sin(eps) * Math.sin(lambda)),
  );
  return { ra: ((ra / 15 % 24) + 24) % 24, dec };
}

/** Saturn geocentric equatorial coordinates (J2000 ecliptic of date). */
export function saturnCoords(date) {
  const jd = julianDate(date);
  const d = jd - 2451543.5;

  const N = 113.665 + 0.877088 * (d / 365.25);
  const i = 2.488;
  const w = 339.3919 + 0.086408 * (d / 365.25);
  const a = 9.55475;
  const e = 0.055723;
  const M = normalizeDeg(316.967 + 0.033444 * d);

  const E = kepler(M, e);
  const xv = a * (Math.cos(E) - e);
  const yv = a * (Math.sqrt(1 - e * e) * Math.sin(E));
  const v = rad2deg(Math.atan2(yv, xv));
  const r = Math.sqrt(xv * xv + yv * yv);

  const lon = v + w;
  const xh = r * (Math.cos(deg2rad(N)) * Math.cos(deg2rad(lon)) - Math.sin(deg2rad(N)) * Math.sin(deg2rad(lon)) * Math.cos(deg2rad(i)));
  const yh = r * (Math.sin(deg2rad(N)) * Math.cos(deg2rad(lon)) + Math.cos(deg2rad(N)) * Math.sin(deg2rad(lon)) * Math.cos(deg2rad(i)));
  const zh = r * Math.sin(deg2rad(lon)) * Math.sin(deg2rad(i));

  const lonecl = rad2deg(Math.atan2(yh, xh));
  const latecl = rad2deg(Math.atan2(zh, Math.sqrt(xh * xh + yh * yh)));

  const earthLon = normalizeDeg(100.461 + 0.985647 * d);
  const xhE = Math.cos(deg2rad(earthLon));
  const yhE = Math.sin(deg2rad(earthLon));

  const xs = xh - xhE;
  const ys = yh - yhE;
  const rs = Math.sqrt(xs * xs + ys * ys);
  const lam = rad2deg(Math.atan2(ys, xs));
  const b = rad2deg(Math.asin(zh / rs));

  const epsilon = 23.439 - 3.563e-7 * d;
  return eclipticToEquatorial(lam, b, epsilon);
}

/** Resolve catalog entry to RA/Dec at a given instant. */
export function resolveEquatorial(entry, date) {
  if (entry.ephemeris === "saturn") return saturnCoords(date);
  return { ra: entry.ra, dec: entry.dec };
}
