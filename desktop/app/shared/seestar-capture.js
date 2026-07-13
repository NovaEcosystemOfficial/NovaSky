/** Stato sessione cattura Seestar — desktop only (simulazione fino ad adapter reale). */

export const CAPTURE_STORAGE_KEY = "novasky.seestar.capture.v1";
export const CAPTURE_EVENT = "novasky-capture-updated";

const DEFAULT = {
  deviceId: null,
  targetId: null,
  phase: "idle",
  frameCount: 0,
  totalFrames: 24,
  simulated: true,
  updatedAt: null,
};

function read() {
  try {
    const raw = localStorage.getItem(CAPTURE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT,
      ...parsed,
      phase: ["idle", "goto", "capturing", "stacking", "complete"].includes(parsed.phase)
        ? parsed.phase
        : "idle",
    };
  } catch {
    return { ...DEFAULT };
  }
}

function write(state) {
  const next = { ...state, updatedAt: new Date().toISOString() };
  localStorage.setItem(CAPTURE_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(CAPTURE_EVENT, { detail: next }));
  return next;
}

export function getCaptureState() {
  return read();
}

export function resetCaptureState(deviceId = null) {
  return write({ ...DEFAULT, deviceId });
}

export function setCaptureTarget(targetId, deviceId = null) {
  const cur = read();
  return write({
    ...cur,
    targetId,
    deviceId: deviceId || cur.deviceId,
    phase: cur.phase === "capturing" ? "capturing" : "idle",
    frameCount: cur.phase === "capturing" ? cur.frameCount : 0,
  });
}

export function startCapture({ targetId, deviceId, totalFrames = 24, simulated = true } = {}) {
  const cur = read();
  return write({
    ...cur,
    deviceId: deviceId || cur.deviceId,
    targetId: targetId || cur.targetId,
    phase: "capturing",
    frameCount: 0,
    totalFrames,
    simulated,
  });
}

export function stopCapture() {
  const cur = read();
  return write({ ...cur, phase: "idle", frameCount: 0 });
}

export async function gotoTarget(targetId, deviceId = null) {
  const cur = read();
  write({
    ...cur,
    deviceId: deviceId || cur.deviceId,
    targetId,
    phase: "goto",
    frameCount: 0,
  });
  await new Promise((r) => setTimeout(r, 1400));
  return write({ ...read(), phase: "idle" });
}

export function tickCapture() {
  const cur = read();
  if (cur.phase !== "capturing") return cur;

  const nextCount = cur.frameCount + 1;
  if (nextCount >= cur.totalFrames) {
    return write({ ...cur, frameCount: nextCount, phase: "stacking" });
  }
  return write({ ...cur, frameCount: nextCount });
}

export function finishStacking() {
  const cur = read();
  if (cur.phase !== "stacking") return cur;
  return write({ ...cur, phase: "complete" });
}

export function capturePhaseLabel(phase) {
  const map = {
    idle: "Pronto",
    goto: "Slewing…",
    capturing: "Cattura in corso",
    stacking: "Stacking…",
    complete: "Cattura completata",
  };
  return map[phase] || "Pronto";
}
