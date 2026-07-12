/** Sezioni osservatorio — raggruppamento automatico dispositivi. */

export const OBSERVATORY_SECTIONS = [
  {
    key: "mounts",
    label: "Montature",
    icon: "mount",
    categories: ["mount"],
    order: 1,
  },
  {
    key: "ota",
    label: "OTA",
    icon: "ota",
    categories: ["telescope", "ota"],
    order: 2,
  },
  {
    key: "guide_scopes",
    label: "Telescopi guida",
    icon: "guide_scope",
    categories: ["guide_scope"],
    order: 3,
  },
  {
    key: "cameras",
    label: "Camere",
    icon: "camera",
    categories: ["camera_main", "seestar", "camera_cooled"],
    order: 4,
  },
  {
    key: "guide_cameras",
    label: "Camere guida",
    icon: "guide_camera",
    categories: ["camera_guide"],
    order: 5,
  },
  {
    key: "controllers",
    label: "Controller",
    icon: "controller",
    categories: ["controller"],
    order: 6,
  },
  {
    key: "computers",
    label: "Computer",
    icon: "computer",
    categories: ["computer"],
    order: 7,
  },
  {
    key: "accessories",
    label: "Accessori",
    icon: "accessory",
    categories: ["focuser", "filter_wheel", "accessory", "rotator"],
    order: 8,
  },
  {
    key: "power",
    label: "Alimentazione",
    icon: "power",
    categories: ["power"],
    order: 9,
  },
  {
    key: "eyepieces",
    label: "Oculari",
    icon: "eyepiece",
    categories: ["eyepiece"],
    order: 10,
  },
];

const CATEGORY_TO_SECTION = new Map();
for (const section of OBSERVATORY_SECTIONS) {
  for (const cat of section.categories) {
    CATEGORY_TO_SECTION.set(cat, section.key);
  }
}

export function sectionForCategory(category) {
  return CATEGORY_TO_SECTION.get(category) || "accessories";
}

export function groupDevicesBySection(devices) {
  const groups = new Map(OBSERVATORY_SECTIONS.map((s) => [s.key, []]));
  for (const device of devices) {
    const key = sectionForCategory(device.category);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(device);
  }
  return OBSERVATORY_SECTIONS.filter((s) => groups.get(s.key)?.length)
    .map((s) => ({ section: s, devices: groups.get(s.key) }));
}

export function sectionIconSvg(iconKey) {
  const icons = {
    mount: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20V8M8 20h8M6 8h12l-2-4H8L6 8z"/></svg>',
    ota: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6" cy="12" r="4"/><rect x="10" y="10" width="12" height="4" rx="2"/></svg>',
    guide_scope: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="5" cy="12" r="3"/><rect x="8" y="11" width="14" height="2" rx="1"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="12" cy="12.5" r="4"/></svg>',
    guide_camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="7" width="16" height="11" rx="2"/><circle cx="12" cy="12.5" r="2.5"/><circle cx="17" cy="9" r="1" fill="currentColor"/></svg>',
    controller: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="4" y="5" width="16" height="14" rx="3"/><circle cx="9" cy="11" r="1.5" fill="currentColor"/><circle cx="15" cy="11" r="1.5" fill="currentColor"/></svg>',
    computer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
    accessory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/></svg>',
    power: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L4 14h7l-1 8 10-14h-7l1-6z"/></svg>',
    eyepiece: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="12" r="5"/><path d="M13 12h8M18 9v6"/></svg>',
  };
  return icons[iconKey] || icons.accessory;
}
