/**
 * Manifest asset fotografici — sostituibile con file reali senza modificare le viste.
 * Priorità: imageUrl dispositivo → manifest → fallback hub SVG.
 */

import { resolveDeviceImage } from "./device-registry.js";

const BASE = "nova://desktop/assets/observatory/";

export const PRIMARY_SETUP_ID = "setup-deep-sky";

export const PHOTO_ASSETS = {
  panorama: `${BASE}panoramiche/observatory-wide.svg`,
  setups: {
    [PRIMARY_SETUP_ID]: `${BASE}setup/deep-sky.svg`,
  },
  devices: {
    "dev-mount-eq6": `${BASE}montature/mount.svg`,
    "dev-telescope-ota": `${BASE}telescopi/ota.svg`,
    "dev-canon-80d": `${BASE}camere/camera.svg`,
    "dev-canon-2000d": `${BASE}camere/camera-alt.svg`,
    "dev-guide-camera": `${BASE}camere/guide-camera.svg`,
    "dev-focuser": `${BASE}accessori/focuser.svg`,
    "dev-filter-wheel": `${BASE}accessori/filter-wheel.svg`,
    "dev-eagle-core": `${BASE}controller/eagle.svg`,
    "dev-seestar-s50": `${BASE}camere/seestar.svg`,
    "dev-seestar-s30-pro": `${BASE}camere/seestar-compact.svg`,
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
  return PHOTO_ASSETS.setups[setupId] || `${BASE}setup/deep-sky.svg`;
}

export function resolveDevicePhoto(device) {
  if (!device) return resolveDeviceImage(device);
  if (device.imageUrl) return device.imageUrl;
  return PHOTO_ASSETS.devices[device.id] || resolveDeviceImage(device);
}

export function resolvePanoramaPhoto() {
  return PHOTO_ASSETS.panorama;
}
