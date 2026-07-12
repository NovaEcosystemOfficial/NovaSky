import { mountDigitalObservatory } from "./observatory/index.js";

export function mountAttrezzatura(container, ctx) {
  if (!document.querySelector('link[href*="observatory-premium.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "nova://desktop/styles/observatory-premium.css";
    document.head.appendChild(link);
  }

  return mountDigitalObservatory(container, ctx);
}
