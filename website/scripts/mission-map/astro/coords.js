/** Equatorial ↔ horizontal coordinate transforms (spherical astronomy). */

import {
  deg2rad,
  rad2deg,
  clamp,
  hourAngleDeg,
  raHoursToDeg,
} from "./math.js";
import { lstDegrees } from "./time.js";

/**
 * Topocentric alt/az from J2000 RA/Dec.
 * Azimuth: 0° = North, 90° = East.
 *
 * @param {number} raHours - Right ascension (hours)
 * @param {number} decDeg  - Declination (degrees)
 * @param {number} latDeg  - Observer latitude (degrees, N+)
 * @param {number} lonDeg  - Observer longitude (degrees, E+)
 * @param {Date} date      - Instant (UTC internally via Date)
 */
export function raDecToAltAz(raHours, decDeg, latDeg, lonDeg, date) {
  const lst = lstDegrees(date, lonDeg);
  const ra = raHoursToDeg(raHours);
  const ha = hourAngleDeg(lst, ra);

  const lat = deg2rad(latDeg);
  const dec = deg2rad(decDeg);
  const haRad = deg2rad(ha);

  const sinAlt =
    Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(haRad);
  const alt = rad2deg(Math.asin(clamp(sinAlt, -1, 1)));

  const cosAzNum = Math.sin(dec) - Math.sin(lat) * sinAlt;
  const cosAzDen = Math.cos(lat) * Math.cos(Math.asin(clamp(sinAlt, -1, 1)));
  let az = rad2deg(Math.acos(clamp(cosAzNum / (cosAzDen || 1e-12), -1, 1)));
  if (Math.sin(haRad) > 0) az = 360 - az;

  return { alt, az: ((az % 360) + 360) % 360, haDeg: ha, lstDeg: lst };
}
