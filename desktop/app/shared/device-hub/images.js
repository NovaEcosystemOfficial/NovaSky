/** Mappa imageKey → asset placeholder (sostituibile con foto reali via imageUrl). */

const BASE = "nova://desktop/assets/devices/";

export const DEVICE_IMAGE_CATALOG = {
  seestar: `${BASE}seestar.svg`,
  canon_dslr: `${BASE}canon-dslr.svg`,
  mount: `${BASE}mount.svg`,
  eagle: `${BASE}eagle.svg`,
  guide_camera: `${BASE}guide-camera.svg`,
  focuser: `${BASE}focuser.svg`,
  filter_wheel: `${BASE}filter-wheel.svg`,
  telescope: `${BASE}telescope.svg`,
  generic: `${BASE}generic.svg`,
};

export function resolveDeviceImage(device) {
  if (!device) return DEVICE_IMAGE_CATALOG.generic;
  if (device.imageUrl) return device.imageUrl;
  const key = device.imageKey || device.metadata?.imageKey || "generic";
  return DEVICE_IMAGE_CATALOG[key] || DEVICE_IMAGE_CATALOG.generic;
}
