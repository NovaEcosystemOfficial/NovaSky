import { getDeviceHub } from "../../shared/device-registry.js";
import {
  PRIMARY_SETUP_ID,
  SETUP_CHAIN_LAYOUT,
  resolveSetupPhoto,
  resolveDevicePhoto,
} from "../../shared/observatory-photo-manifest.js";
import {
  esc,
  deviceById,
  setupById,
  deviceDisplayName,
  deviceStatusLabel,
  statusTone,
  photoStyle,
} from "./helpers.js";

function renderChainNode(device) {
  const tone = statusTone(device);
  return `
    <button type="button" class="oph-chain-node" data-device-detail="${device.id}">
      <span class="oph-chain-node-thumb" style="${photoStyle(resolveDevicePhoto(device))}"></span>
      <span class="oph-chain-node-label">${esc(deviceDisplayName(device))}</span>
      <span class="oph-chain-node-status oph-card-badge--${tone}">${esc(deviceStatusLabel(device))}</span>
    </button>
  `;
}

export function renderSetupChain(setupId) {
  const hub = getDeviceHub();
  const setup = setupById(hub, setupId);
  const layout = SETUP_CHAIN_LAYOUT[setupId];

  if (!setup || !layout) {
    return `<div class="oph-empty"><p>Setup non configurato.</p><button type="button" class="oph-btn" data-oph-back>← Indietro</button></div>`;
  }

  const mainNodes = layout.main.map((id) => deviceById(hub, id)).filter(Boolean);
  const leftNodes = (layout.branches?.left || []).map((id) => deviceById(hub, id)).filter(Boolean);
  const rightNodes = (layout.branches?.right || []).map((id) => deviceById(hub, id)).filter(Boolean);

  return `
    <div class="oph-chain" data-oph-chain data-setup-id="${setupId}">
      <button type="button" class="oph-back" data-oph-back>← Il mio Osservatorio</button>

      <header class="oph-chain-head">
        <div class="oph-chain-hero" style="${photoStyle(resolveSetupPhoto(setupId))}">
          <div class="oph-card-overlay oph-card-overlay--hero"></div>
          <div class="oph-chain-hero-text">
            <p class="oph-kicker">Catena ottica</p>
            <h1>${esc(setup.name)}</h1>
          </div>
        </div>
      </header>

      <div class="oph-chain-layout">
        <aside class="oph-chain-branch oph-chain-branch--left">
          ${leftNodes.map(renderChainNode).join("")}
        </aside>

        <div class="oph-chain-main">
          ${mainNodes
            .map(
              (node, i) => `
            <div class="oph-chain-step">
              ${renderChainNode(node)}
              ${i < mainNodes.length - 1 ? '<span class="oph-chain-line" aria-hidden="true"></span>' : ""}
            </div>
          `
            )
            .join("")}
        </div>

        <aside class="oph-chain-branch oph-chain-branch--right">
          ${rightNodes.map(renderChainNode).join("")}
        </aside>
      </div>
    </div>
  `;
}

export function renderSetupChainDefault() {
  return renderSetupChain(PRIMARY_SETUP_ID);
}
