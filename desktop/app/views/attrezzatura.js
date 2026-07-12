import { isPhotoRedesignEnabled } from "../shared/ui-preferences.js";
import { mountDigitalObservatory } from "./observatory/index.js";
import { mountPhotoObservatory, UI_PREFS_EVENT } from "./observatory-photo/index.js";

function loadStylesheet(href, dataAttr) {
  if (document.querySelector(`link[${dataAttr}]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  link.setAttribute(dataAttr, "1");
  document.head.appendChild(link);
}

export function mountAttrezzatura(container, ctx) {
  let activeUnmount = null;

  const remount = () => {
    if (activeUnmount) {
      activeUnmount();
      activeUnmount = null;
    }
    container.innerHTML = "";

    if (isPhotoRedesignEnabled()) {
      loadStylesheet("nova://desktop/styles/observatory-photo.css", "data-oph-css");
      loadStylesheet("nova://desktop/styles/observatory-premium.css", "data-obs-css");
      const result = mountPhotoObservatory(container, ctx, { onLayoutToggle: remount });
      activeUnmount = result?.unmount || null;
    } else {
      loadStylesheet("nova://desktop/styles/observatory-premium.css", "data-obs-css");
      const result = mountDigitalObservatory(container, ctx);
      activeUnmount = result?.unmount || null;
    }
  };

  const onUiPref = () => remount();
  window.addEventListener(UI_PREFS_EVENT, onUiPref);

  remount();

  return {
    unmount: () => {
      window.removeEventListener(UI_PREFS_EVENT, onUiPref);
      if (activeUnmount) activeUnmount();
      activeUnmount = null;
    },
  };
}
