/**
 * Sky Briefing UI — briefing astronomico NovaSky nella scheda target.
 * PERCHÉ STANOTTE deriva dal motore (nessuna modifica al motore).
 */

import { getSkyBriefing } from "../data/sky-briefings.js";
import { resolveBriefingProfile } from "../data/sky-briefing-schema.js";
import { SKY_LIMITS } from "../data/config.js";

const RATING_LABELS = [
  { key: "ease", label: "Facilità" },
  { key: "visualImpact", label: "Impatto visivo" },
  { key: "photogenic", label: "Fotogenia" },
  { key: "beginnerFriendly", label: "Ideale per principianti" },
];

const PLACEHOLDER = "Briefing in preparazione — i dati di base restano disponibili sopra.";

function formatArcmin(arcmin) {
  if (arcmin == null || Number.isNaN(arcmin)) return "—";
  if (arcmin >= 60) {
    const deg = (arcmin / 60).toFixed(1);
    return `${deg}° (${Math.round(arcmin)}′)`;
  }
  if (arcmin < 2) return `${arcmin.toFixed(1)}′`;
  return `${Math.round(arcmin)}′`;
}

function windowDurationMinutes(target) {
  if (!target.window?.startDate || !target.window?.endDate) return null;
  return Math.round((target.window.endDate - target.window.startDate) / 60_000);
}

/**
 * PERCHÉ STANOTTE — linguaggio naturale da alt, Luna, finestra, NovaScore.
 * @param {object} target
 * @returns {string}
 */
export function buildTonightBriefing(target) {
  if (!target) return PLACEHOLDER;

  if (!target.aboveHorizon) {
    return "Stanotte il target è ancora sotto l'orizzonte. Avanza l'orario simulato per individuare la finestra in cui sorge e culmina.";
  }

  const sentences = [];
  const alt = target.alt ?? 0;
  const culmAlt = target.culmination?.alt ?? 0;
  const { OPTIMAL_ALT, MIN_ALT } = SKY_LIMITS;

  if (alt >= OPTIMAL_ALT) {
    sentences.push(
      `Stanotte raggiunge un'ottima altezza (${alt}°): lontano dalla turbolenza del bordo orizzonte, in condizione favorevole per il Seestar.`,
    );
  } else if (alt >= MIN_ALT) {
    sentences.push(
      `In questo momento è a ${alt}° — osservabile, con margine di miglioramento verso la culminazione prevista a ${culmAlt}°.`,
    );
  } else {
    sentences.push(
      `Per ora resta basso sull'orizzonte (${alt}°): conviene attendere che salga prima di inquadrarlo.`,
    );
  }

  const moonSep = target.moonSeparation ?? 0;
  if (moonSep >= 70) {
    sentences.push("La Luna disturba poco il contrasto: resta lontana dal campo.");
  } else if (moonSep >= 45) {
    sentences.push(
      `La Luna è a ${moonSep}° dal target — interferenza moderata, gestibile con filtri o attendendo un'ora più buia.`,
    );
  } else if (moonSep > 0) {
    sentences.push(
      `La Luna è vicina (${moonSep}°) e il chiarore riduce il contrasto: preferisci filtri o un momento senza Luna nel campo.`,
    );
  }

  const dur = windowDurationMinutes(target);
  if (dur != null) {
    if (dur >= 120) {
      sentences.push(
        `La finestra utile va dalle ${target.window.start} alle ${target.window.end}: oltre ${Math.round(dur / 60)} ore sopra ${MIN_ALT}°.`,
      );
    } else if (dur >= 45) {
      sentences.push(
        `Hai circa ${dur} minuti utili tra ${target.window.start} e ${target.window.end} per osservarlo comodamente.`,
      );
    } else if (dur > 0) {
      sentences.push(
        `Finestra stretta (${target.window.start} – ${target.window.end}): serve pianificazione precisa.`,
      );
    }
  }

  const score = target.novaScore ?? 50;
  if (score >= 72) {
    sentences.push("Nel complesso, le condizioni calcolate per stanotte sono tra le più favorevoli disponibili adesso.");
  } else if (score >= 50) {
    sentences.push("Le condizioni permettono un tentativo credibile, con qualche compromesso su contrasto o quota.");
  } else {
    sentences.push("Stanotte è impegnativo: valuta un altro orario o un target alternativo nel deck.");
  }

  return sentences.join(" ");
}

/** @param {import("../data/sky-briefing-schema.js").SkyBriefingProfile} profile */
function buildIdentityRows(profile) {
  return [
    { label: "Tipo", value: profile.type ?? "—" },
    { label: "Costellazione", value: profile.constellation ?? "—" },
    { label: "Distanza", value: profile.distance ?? "—" },
    { label: "Magnitudine", value: profile.magnitude != null ? String(profile.magnitude) : "—" },
    { label: "Dimensione apparente", value: formatArcmin(profile.sizeArcmin) },
    { label: "Periodo migliore", value: profile.bestSeason ?? "—", wide: true },
  ];
}

function renderIdentity(container, profile) {
  container.replaceChildren();
  for (const item of buildIdentityRows(profile)) {
    const div = document.createElement("div");
    if (item.wide) div.className = "briefing-quick-wide";
    div.innerHTML = `<dt>${item.label}</dt><dd>${item.value}</dd>`;
    container.appendChild(div);
  }
}

function renderRatings(container, ratings) {
  container.replaceChildren();
  if (!ratings) {
    const p = document.createElement("p");
    p.className = "briefing-placeholder";
    p.textContent = PLACEHOLDER;
    container.appendChild(p);
    return;
  }

  for (const { key, label } of RATING_LABELS) {
    const value = Math.max(0, Math.min(100, Math.round(ratings[key] ?? 0)));
    const row = document.createElement("div");
    row.className = "briefing-level";
    row.innerHTML = `
      <div class="briefing-level-head">
        <span>${label}</span>
        <span class="briefing-level-value">${value}</span>
      </div>
      <div class="briefing-level-track" role="meter" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100" aria-label="${label}">
        <div class="briefing-level-fill" style="width: ${value}%"></div>
      </div>
    `;
    container.appendChild(row);
  }
}

function setText(el, text, fallback = PLACEHOLDER) {
  if (!el) return;
  el.textContent = text?.trim() ? text : fallback;
}

/**
 * @param {HTMLElement} root
 * @param {object} target — target calcolato + campi catalogo
 */
export function populateSkyBriefing(root, target) {
  if (!root || !target) return;

  const editorial = getSkyBriefing(target.id);
  const profile = resolveBriefingProfile(target, editorial);

  setText(root.querySelector("[data-briefing-observing]"), profile.description);
  setText(root.querySelector("[data-briefing-tonight]"), buildTonightBriefing(target));
  setText(root.querySelector("[data-briefing-seestar]"), profile.seestarView);
  setText(root.querySelector("[data-briefing-curiosity]"), profile.curiosity);

  renderIdentity(root.querySelector("[data-briefing-identity]"), profile);
  renderRatings(root.querySelector("[data-briefing-levels]"), profile.ratings);

  root.dataset.briefingComplete = profile.complete ? "true" : "false";
}

export { formatArcmin, buildIdentityRows };
