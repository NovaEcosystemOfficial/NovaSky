/**
 * Manifest asset fotografici — sostituibile con file reali senza modificare le viste.
 * Priorità: imageUrl dispositivo → manifest → catalogo hub.
 */

import { resolveDeviceImage } from "./device-registry.js";

const BASE = "nova://desktop/assets/observatory/photos/";

export const PRIMARY_SETUP_ID = "setup-deep-sky";

export const PHOTO_ASSETS = {
  panorama: `${BASE}panorama.jpg`,
  setups: {
    [PRIMARY_SETUP_ID]: `${BASE}setup-deep-sky.jpg`,
    "setup-seestar-s50": `${BASE}seestar-s50.jpg`,
    "setup-seestar-s30": `${BASE}seestar-s30.jpg`,
  },
  devices: {
    "dev-mount-eq6": `${BASE}eq6.jpg`,
    "dev-telescope-ota": `${BASE}ota-deep-sky.jpg`,
    "dev-canon-80d": `${BASE}canon-80d.jpg`,
    "dev-canon-2000d": `${BASE}canon-2000d.jpg`,
    "dev-guide-camera": `${BASE}guide-camera.jpg`,
    "dev-focuser": `${BASE}focuser.jpg`,
    "dev-filter-wheel": `${BASE}filter-wheel.jpg`,
    "dev-eagle-core": `${BASE}eagle-core.jpg`,
    "dev-seestar-s50": `${BASE}seestar-s50.jpg`,
    "dev-seestar-s30-pro": `${BASE}seestar-s30.jpg`,
  },
};

/** Catena ottica verticale + rami laterali per setup. */
export const SETUP_CHAIN_LAYOUT = {
  [PRIMARY_SETUP_ID]: {
    main: [
      "dev-mount-eq6",
      "dev-telescope-ota",
      "dev-focuser",
      "dev-filter-wheel",
      "dev-canon-80d",
    ],
    branches: {
      left: ["dev-guide-camera"],
      right: ["dev-eagle-core"],
    },
  },
};

export const SMART_TELESCOPE_IDS = ["dev-seestar-s50", "dev-seestar-s30-pro"];

/** Hotspot panorama (% container) — sostituibile con coordinate da servizio foto reale. */
export const PANORAMA_HOTSPOTS = [
  { id: "hs-eq6", deviceId: "dev-mount-eq6", label: "Montatura EQ6-R", x: 46, y: 54 },
  { id: "hs-ota", deviceId: "dev-telescope-ota", label: "Imaging train", x: 50, y: 42 },
  { id: "hs-seestar", deviceId: "dev-seestar-s50", label: "Seestar S50", x: 70, y: 48 },
  { id: "hs-eagle", deviceId: "dev-eagle-core", label: "Eagle Core", x: 84, y: 62 },
  { id: "hs-pc", deviceId: null, label: "Postazione PC", x: 88, y: 74, future: true },
  { id: "hs-roof", deviceId: null, label: "Tetto osservatorio", x: 50, y: 14, future: true },
  { id: "hs-motor", deviceId: null, label: "Motorizzazione cupola", x: 58, y: 10, future: true },
];

export function resolveSetupPhoto(setupId) {
  return PHOTO_ASSETS.setups[setupId] || `${BASE}setup-deep-sky.jpg`;
}

export function resolveDevicePhoto(device) {
  if (!device) return resolveDeviceImage(device);
  if (device.imageUrl) return device.imageUrl;
  return PHOTO_ASSETS.devices[device.id] || resolveDeviceImage(device);
}

export function resolvePanoramaPhoto() {
  return PHOTO_ASSETS.panorama;
}
