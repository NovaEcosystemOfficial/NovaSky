/**
 * Renderer bridge → IPC EQ6 ASCOM.
 */

const DESKTOP = typeof window !== "undefined" ? window.novaSkyDesktop : null;

export function isEq6AscomBridgeAvailable() {
  return Boolean(DESKTOP?.eq6Ascom?.discover && DESKTOP?.eq6Ascom?.snapshot);
}

export async function eq6AscomDiscover() {
  if (!isEq6AscomBridgeAvailable()) {
    return { ok: false, error: "bridge_unavailable", message: "IPC EQ6 ASCOM non disponibile (avvia NovaSky Desktop)." };
  }
  return DESKTOP.eq6Ascom.discover();
}

export async function eq6AscomSnapshot() {
  if (!isEq6AscomBridgeAvailable()) {
    return { ok: false, error: "bridge_unavailable", message: "IPC EQ6 ASCOM non disponibile (avvia NovaSky Desktop)." };
  }
  return DESKTOP.eq6Ascom.snapshot();
}

export async function eq6AscomDisconnect() {
  if (!isEq6AscomBridgeAvailable()) {
    return { ok: false, error: "bridge_unavailable" };
  }
  return DESKTOP.eq6Ascom.disconnect();
}

export async function eq6AscomMoveAxis(axis, rate) {
  if (!DESKTOP?.eq6Ascom?.moveAxis) {
    return { ok: false, error: "bridge_unavailable", message: "moveAxis IPC non disponibile.", motionCommandsSent: false };
  }
  return DESKTOP.eq6Ascom.moveAxis({ axis, rate });
}

export async function eq6AscomStopAxes() {
  if (!DESKTOP?.eq6Ascom?.stopAxes) {
    return { ok: false, error: "bridge_unavailable", message: "stopAxes IPC non disponibile.", motionCommandsSent: false };
  }
  return DESKTOP.eq6Ascom.stopAxes();
}
