/** Catalogo fotografico dispositivi — JPG da Wikimedia Commons (vedi photos/credits.json). */

const BASE = "nova://desktop/assets/observatory/photos/";

export const DEVICE_PHOTO_CATALOG = {
  seestar_s50: `${BASE}seestar-s50.jpg`,
  seestar_s30: `${BASE}seestar-s30.jpg`,
  canon_80d: `${BASE}canon-80d.jpg`,
  canon_2000d: `${BASE}canon-2000d.jpg`,
  eq6: `${BASE}eq6.jpg`,
  eagle_core: `${BASE}eagle-core.jpg`,
  guide_camera: `${BASE}guide-camera.jpg`,
  focuser: `${BASE}focuser.jpg`,
  filter_wheel: `${BASE}filter-wheel.jpg`,
  ota_deep_sky: `${BASE}ota-deep-sky.jpg`,
  default: `${BASE}default.jpg`,
};

export function resolveDeviceImage(device) {
  if (!device) return DEVICE_PHOTO_CATALOG.default;
  if (device.imageUrl) return device.imageUrl;
  const key = device.imageKey || device.metadata?.imageKey;
  return DEVICE_PHOTO_CATALOG[key] || DEVICE_PHOTO_CATALOG.default;
}
