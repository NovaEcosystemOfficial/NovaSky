/** Natural sky projection — panoramic alt/az view (not radar). */

const DEG = Math.PI / 180;

/**
 * Maps altitude/azimuth to normalized screen coordinates.
 * Horizon sits low; zenith high. Azimuth wraps with camera pan.
 *
 * @param {number} alt - 0–90°
 * @param {number} az - 0–360°
 * @param {{ azCenter: number, fov: number, lift: number }} camera
 */
export function altAzToSky(alt, az, camera) {
  const safeAlt = Number.isFinite(alt) ? alt : 0;
  const safeAz = Number.isFinite(az) ? az : 0;
  const azCenter = Number.isFinite(camera.azCenter) ? camera.azCenter : 25;
  const zoom = Number.isFinite(camera.zoom) && camera.zoom > 0 ? camera.zoom : 1;
  const lift = Number.isFinite(camera.lift) ? camera.lift : 0;

  let dAz = safeAz - azCenter;
  while (dAz > 180) dAz -= 360;
  while (dAz < -180) dAz += 360;

  const fov = (Number.isFinite(camera.fov) ? camera.fov : 118) / zoom;
  const x = 0.5 + (dAz / fov) * 0.92;

  const altNorm = Math.pow(Math.max(0, safeAlt) / 90, 0.82);
  const y = 0.94 - altNorm * 0.78 + lift * 0.001;

  const depth = 0.15 + (Math.max(0, safeAlt) / 90) * 0.85;

  return { x, y, depth, visible: x > -0.08 && x < 1.08 && safeAlt >= 0 };
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

/** Seeded pseudo-random for star field consistency. */
export function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateStarField(count = 2800, seed = 42) {
  const rand = seededRandom(seed);
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      alt: 3 + rand() * 87,
      az: rand() * 360,
      mag: 0.3 + rand() * 6.2,
      layer: rand() < 0.2 ? 0 : rand() < 0.5 ? 1 : 2,
      phase: rand() * Math.PI * 2,
      tint: rand() < 0.12 ? "warm" : rand() < 0.08 ? "cool" : "neutral",
    });
  }
  return stars;
}
