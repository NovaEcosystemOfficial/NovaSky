/** Geolocation with explicit consent — no persistence without approval. */

import { DEMO_OBSERVER } from "../data/config.js";

/**
 * @typedef {{ lat: number, lon: number, label: string, source: 'gps'|'demo' }} ObserverLocation
 */

export class LocationService {
  constructor() {
    /** @type {ObserverLocation|null} */
    this.current = null;
    this.consentGiven = false;
  }

  /** @returns {Promise<ObserverLocation>} */
  async requestLocation() {
    if (!navigator.geolocation) {
      return this.useDemo();
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.consentGiven = true;
          this.current = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            label: `GPS · ${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E`,
            source: "gps",
          };
          resolve(this.current);
        },
        () => resolve(this.useDemo()),
        { enableHighAccuracy: false, timeout: 8_000, maximumAge: 60_000 },
      );
    });
  }

  /** @returns {ObserverLocation} */
  useDemo() {
    this.current = {
      lat: DEMO_OBSERVER.lat,
      lon: DEMO_OBSERVER.lon,
      label: DEMO_OBSERVER.label,
      source: "demo",
    };
    return this.current;
  }

  /** @returns {ObserverLocation} */
  getLocation() {
    return this.current ?? this.useDemo();
  }
}
