/** Preferenze UI desktop — separate dal Device Hub. */

export const UI_PREFS_KEY = "novasky.desktop.ui.v1";
export const UI_PREFS_EVENT = "novasky-ui-prefs-updated";

function read() {
  try {
    const raw = localStorage.getItem(UI_PREFS_KEY);
    if (!raw) return { digitalObservatoryRedesign: false };
    const parsed = JSON.parse(raw);
    return {
      digitalObservatoryRedesign: parsed.digitalObservatoryRedesign === true,
    };
  } catch {
    return { digitalObservatoryRedesign: false };
  }
}

function write(prefs) {
  localStorage.setItem(
    UI_PREFS_KEY,
    JSON.stringify({ ...prefs, updatedAt: new Date().toISOString() })
  );
  window.dispatchEvent(new CustomEvent(UI_PREFS_EVENT, { detail: prefs }));
}

export function getUiPreferences() {
  return read();
}

export function isPhotoRedesignEnabled() {
  return read().digitalObservatoryRedesign === true;
}

export function setPhotoRedesignEnabled(enabled) {
  write({ digitalObservatoryRedesign: Boolean(enabled) });
}

export function togglePhotoRedesign() {
  const next = !isPhotoRedesignEnabled();
  setPhotoRedesignEnabled(next);
  return next;
}
