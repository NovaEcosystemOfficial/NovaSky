/**
 * Sky Briefing — schema unificato NovaSky (Sprint 10).
 *
 * Separa dati scientifici (catalogo) da contenuti editoriali (sky-briefings.js).
 * Estendibile a centinaia di target: aggiungi un id al catalogo + voce in SKY_BRIEFINGS.
 *
 * @typedef {object} SkyBriefingScientific
 * @property {string} [constellation]
 * @property {string} [distance]
 * @property {string} [bestSeason]
 *
 * @typedef {object} SkyBriefingRatings
 * @property {number} ease — Facilità 0–100
 * @property {number} visualImpact — Impatto visivo 0–100
 * @property {number} photogenic — Fotogenia 0–100
 * @property {number} beginnerFriendly — Ideale per principianti 0–100
 *
 * @typedef {object} SkyBriefingEditorial
 * @property {string|null} description — COSA STAI OSSERVANDO
 * @property {string|null} seestarView — COSA VEDRAI CON IL SEESTAR
 * @property {string|null} curiosity — CURIOSITÀ
 * @property {SkyBriefingRatings|null} ratings — VALUTAZIONE OSSERVATIVA
 * @property {boolean} [complete]
 *
 * @typedef {object} SkyBriefingProfile
 * @property {string|null} description
 * @property {string|null} curiosity
 * @property {string|null} seestarView
 * @property {string|null} type
 * @property {string|null} constellation
 * @property {string|null} distance
 * @property {number|null} magnitude
 * @property {number|null} sizeArcmin
 * @property {string|null} bestSeason
 * @property {{ s50: string, s30: string }|null} seestarNotes
 * @property {SkyBriefingRatings|null} ratings
 * @property {boolean} complete
 */

/** @param {object} catalogEntry */
export function getScientificMeta(catalogEntry) {
  const fromBriefing = catalogEntry.briefing?.scientific;
  const fromLegacy = catalogEntry.skyMeta;
  return { ...fromLegacy, ...fromBriefing };
}

/**
 * Unisce catalogo + contenuti editoriali senza duplicare campi calcolati altrove.
 * @param {object} catalogEntry
 * @param {object} editorial — voce da sky-briefings.js
 * @returns {SkyBriefingProfile}
 */
export function resolveBriefingProfile(catalogEntry, editorial = {}) {
  const scientific = getScientificMeta(catalogEntry);
  const ratings = editorial.ratings ?? editorial.levels ?? null;

  return {
    description: editorial.description ?? editorial.observing ?? null,
    curiosity: editorial.curiosity ?? null,
    seestarView: editorial.seestarView ?? editorial.seestar ?? null,
    type: catalogEntry.category ?? null,
    constellation: scientific.constellation ?? null,
    distance: scientific.distance ?? null,
    magnitude: catalogEntry.magnitude ?? null,
    sizeArcmin: catalogEntry.sizeArcmin ?? null,
    bestSeason: scientific.bestSeason ?? null,
    seestarNotes: catalogEntry.seestar ?? null,
    ratings,
    complete: Boolean(editorial.complete && ratings && editorial.curiosity),
  };
}

/**
 * Report compilazione briefing vs catalogo.
 * @param {object[]} catalog
 * @param {Record<string, object>} briefings
 */
export function getBriefingCatalogReport(catalog, briefings) {
  const complete = [];
  const incomplete = [];

  for (const entry of catalog) {
    const editorial = briefings[entry.id];
    const profile = resolveBriefingProfile(entry, editorial ?? {});
    if (profile.complete) complete.push(entry.id);
    else incomplete.push(entry.id);
  }

  return {
    total: catalog.length,
    complete,
    incomplete,
  };
}
