/** Alt/az (degrees) → normalized polar map coordinates. */

const DEG = Math.PI / 180;

/**
 * @param {number} alt - altitude 0–90
 * @param {number} az - azimuth 0–360 (N=0, E=90)
 * @param {number} maxAlt - horizon mapping edge (default 90)
 * @returns {{ x: number, y: number, r: number }}
 */
export function altAzToMap(alt, az, maxAlt = 90) {
  const clampedAlt = Math.max(0, Math.min(maxAlt, alt));
  const r = (maxAlt - clampedAlt) / maxAlt;
  const theta = (az - 90) * DEG;
  return {
    x: 0.5 + r * 0.5 * Math.cos(theta),
    y: 0.5 + r * 0.5 * Math.sin(theta),
    r,
  };
}

/**
 * @param {number} x - normalized 0–1
 * @param {number} y - normalized 0–1
 * @returns {{ alt: number, az: number }}
 */
export function mapToAltAz(x, y) {
  const dx = (x - 0.5) * 2;
  const dy = (y - 0.5) * 2;
  const r = Math.min(1, Math.hypot(dx, dy));
  const alt = 90 - r * 90;
  let az = (Math.atan2(dy, dx) / DEG + 90) % 360;
  if (az < 0) az += 360;
  return { alt, az };
}

/**
 * @param {number} minutes - "22:10" → minutes from midnight
 */
export function parseTime(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function formatTime(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function sortByWindowStart(a, b) {
  return parseTime(a.window.start) - parseTime(b.window.start);
}
