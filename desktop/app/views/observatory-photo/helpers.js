import {
  deviceStatusLabel,
  devicePowerLabel,
  deviceConnectionLabel,
  deviceDisplayName,
  DEVICE_CATEGORIES,
} from "../../shared/device-registry.js";
import { resolveDevicePhoto } from "../../shared/observatory-photo-manifest.js";

export {
  deviceStatusLabel,
  devicePowerLabel,
  deviceConnectionLabel,
  deviceDisplayName,
  DEVICE_CATEGORIES,
};

export function esc(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function statusTone(device) {
  const s = device?.connectionState;
  if (s === "connected" || s === "operational") return "online";
  if (s === "attention" || s === "error") return "warn";
  return "idle";
}

export function deviceById(hub, id) {
  return hub.devices.find((d) => d.id === id) || null;
}

export function setupById(hub, id) {
  return hub.setups.find((s) => s.id === id) || null;
}

export function photoStyle(deviceOrUrl) {
  const url = typeof deviceOrUrl === "string" ? deviceOrUrl : resolveDevicePhoto(deviceOrUrl);
  return `background-image:url('${url}')`;
}
