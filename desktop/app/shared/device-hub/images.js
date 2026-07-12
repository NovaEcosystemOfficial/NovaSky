/** Catalogo fotografico dispositivi — sostituibile con imageUrl per foto reali. */

const BASE = "nova://desktop/assets/observatory/photos/";

export const DEVICE_PHOTO_CATALOG = {
  seestar_s50: `${BASE}seestar-s50.svg`,
  seestar_s30: `${BASE}seestar-s30.svg`,
  canon_80d: `${BASE}canon-80d.svg`,
  canon_2000d: `${BASE}canon-2000d.svg`,
  eq6: `${BASE}eq6.svg`,
  eagle_core: `${BASE}eagle-core.svg`,
  guide_camera: `${BASE}guide-camera.svg`,
  focuser: `${BASE}focuser.svg`,
  filter_wheel: `${BASE}filter-wheel.svg`,
  ota_deep_sky: `${BASE}ota-deep-sky.svg`,
  default: `${BASE}default.svg`,
};

export function resolveDeviceImage(device) {
  if (!device) return DEVICE_PHOTO_CATALOG.default;
  if (device.imageUrl) return device.imageUrl;
  const key = device.imageKey || device.metadata?.imageKey;
  return DEVICE_PHOTO_CATALOG[key] || DEVICE_PHOTO_CATALOG.default;
}
