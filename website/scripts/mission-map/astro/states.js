/** Altitude classification labels — shared by visibility and recommendation. */

export const TARGET_STATE = {
  BELOW: "below_horizon",
  LOW: "low",
  OBSERVABLE: "observable",
  OPTIMAL: "optimal",
};

export function classifyAltitude(alt, limits) {
  const { MIN_ALT, OPTIMAL_ALT } = limits;
  if (alt < 0) return TARGET_STATE.BELOW;
  if (alt < MIN_ALT) return TARGET_STATE.LOW;
  if (alt < OPTIMAL_ALT) return TARGET_STATE.OBSERVABLE;
  return TARGET_STATE.OPTIMAL;
}

export function stateLabel(state) {
  const labels = {
    below_horizon: "Sotto orizzonte",
    low: "Basso",
    observable: "Osservabile",
    optimal: "Ottimale",
  };
  return labels[state] ?? state;
}
