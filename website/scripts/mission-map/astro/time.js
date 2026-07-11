/** Julian date, sidereal time, and local formatting. */

import { normalizeDeg, normalizeHours } from "./math.js";

/** Julian Date (UTC) from a JavaScript Date. */
export function julianDate(date) {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d =
    date.getUTCDate() +
    (date.getUTCHours() +
      (date.getUTCMinutes() + date.getUTCSeconds() / 60) / 60) /
      24;

  let yr = y;
  let mo = m;
  if (mo <= 2) {
    yr -= 1;
    mo += 12;
  }

  const A = Math.floor(yr / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (yr + 4716)) + Math.floor(30.6001 * (mo + 1)) + d + B - 1524.5;
}

/** Greenwich Mean Sidereal Time in degrees (IAU 1982, good to ~0.1 s). */
export function gmstDegrees(date) {
  const jd = julianDate(date);
  const T = (jd - 2451545.0) / 36525;
  let g =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * T * T -
    (T * T * T) / 38710000;
  return normalizeDeg(g);
}

/** Local sidereal time in degrees. */
export function lstDegrees(date, lonDeg) {
  return normalizeDeg(gmstDegrees(date) + lonDeg);
}

/** LST in decimal hours. */
export function lstHours(date, lonDeg) {
  return lstDegrees(date, lonDeg) / 15;
}

export function formatTimeLocal(date, locale = "it-IT") {
  return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

export function formatDateLocal(date, locale = "it-IT") {
  return date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTimeRange(startDate, endDate) {
  return `${formatTimeLocal(startDate)} – ${formatTimeLocal(endDate)}`;
}

/** Minutes from local midnight for a Date in local TZ. */
export function localMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

/** Build a Date on the same local calendar day with given hour/minute. */
export function setLocalTime(baseDate, hours, minutes = 0) {
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

/** Add minutes to a Date. */
export function addMinutes(date, mins) {
  return new Date(date.getTime() + mins * 60_000);
}

/** Decimal hours (0–24) from a Date, local. */
export function localDecimalHours(date) {
  return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
}

export function hoursToLabel(h) {
  const hh = Math.floor(normalizeHours(h));
  const mm = Math.round((normalizeHours(h) - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
