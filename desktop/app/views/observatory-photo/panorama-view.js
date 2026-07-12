import { PANORAMA_HOTSPOTS, resolvePanoramaPhoto } from "../../shared/observatory-photo-manifest.js";
import { esc, photoStyle } from "./helpers.js";

export function renderPanoramaView(hotspotsVisible = true) {
  const panorama = resolvePanoramaPhoto();

  return `
    <div class="oph-panorama" data-oph-panorama>
      <header class="oph-panorama-head">
        <div>
          <p class="oph-kicker">Vista sperimentale</p>
          <h1>Vista Osservatorio</h1>
        </div>
        <div class="oph-panorama-tools">
          <button type="button" class="oph-btn oph-btn--ghost" data-oph-tab="home">Il mio Osservatorio</button>
          <button type="button" class="oph-btn" data-toggle-hotspots>
            ${hotspotsVisible ? "Nascondi hotspot" : "Mostra hotspot"}
          </button>
        </div>
      </header>

      <div class="oph-panorama-stage ${hotspotsVisible ? "is-hotspots-visible" : "is-hotspots-hidden"}">
        <div class="oph-panorama-bg" style="${photoStyle(panorama)}" role="img" aria-label="Panoramica osservatorio placeholder"></div>
        <div class="oph-panorama-hotspots" data-hotspots-layer>
          ${PANORAMA_HOTSPOTS.map(
            (hs) => `
            <button
              type="button"
              class="oph-hotspot ${hs.future ? "oph-hotspot--future" : ""}"
              data-hotspot-id="${hs.id}"
              ${hs.deviceId ? `data-device-detail="${hs.deviceId}"` : ""}
              ${hs.future ? 'data-hotspot-future="1"' : ""}
              style="--hx:${hs.x}%;--hy:${hs.y}%"
            >
              <span class="oph-hotspot-dot"></span>
              <span class="oph-hotspot-label">${esc(hs.label)}</span>
            </button>
          `
          ).join("")}
        </div>
      </div>

      <p class="oph-panorama-note">Layout placeholder — sostituibile con fotografia panoramica reale senza modificare il codice.</p>

      <div data-setup-registry style="display:none" aria-hidden="true">
        <span data-setup-id="setup-deep-sky"></span>
        <span data-setup-id="setup-seestar-s50"></span>
        <span data-setup-id="setup-seestar-s30"></span>
      </div>
    </div>
  `;
}
