/** Observer and sky computation defaults — no UI logic here. */

export const DEMO_OBSERVER = {
  lat: 45.4642,
  lon: 9.19,
  label: "Demo · Milano",
  source: "demo",
};

export const SKY_LIMITS = {
  /** Minimum altitude for “observable” window (degrees). */
  MIN_ALT: 20,
  /** Altitude considered “optimal”. */
  OPTIMAL_ALT: 45,
  /** Below this but above 0 = “low”. */
  LOW_ALT: 20,
  /** Sampling step for rise/set / window search (minutes). */
  SAMPLE_MINUTES: 10,
};

/** Hour range for the night-time slider (local civil evening → dawn). */
export const NIGHT_HOUR_RANGE = { start: 19, end: 6 };
