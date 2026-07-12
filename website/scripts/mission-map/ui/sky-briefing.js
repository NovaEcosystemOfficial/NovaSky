/**
 * Sky Briefing UI — sezione espandibile nella scheda target.
 * "Perché stasera" deriva dai dati già calcolati dal motore (senza modificarlo).
 */

import { getSkyBriefing } from "../data/sky-briefings.js";
import { SKY_LIMITS } from "../data/config.js";

const LEVEL_LABELS = [
  { key: "ease", label: "Facilità" },
  { key: "visualImpact", label: "Impatto visivo" },
  { key: "photogenic", label: "Fotogenia" },
  { key: "beginnerFriendly", label: "Consigliato ai principianti" },
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
 * Testo naturale per PERCHÉ STASERA — usa alt, Luna, finestra e NovaScore.
 * @param {object} target - target calcolato dal motore
 * @returns {string}
 */
export function buildTonightBriefing(target) {
  if (!target) return PLACEHOLDER;

  if (!target.aboveHorizon) {
    return "Il target è sotto l'orizzonte in questo momento. Avanza l'orario simulato per trovare la finestra in cui sorge e culmina.";
  }

  const sentences = [];
  const alt = target.alt ?? 0;
  const culmAlt = target.culmination?.alt ?? 0;
  const { OPTIMAL_ALT, MIN_ALT } = SKY_LIMITS;

  if (alt >= OPTIMAL_ALT) {
    sentences.push(
      `In questo istante è alto ${alt}°: una quota comoda, lontana dalla turbolenza del bordo orizzonte.`,
    );
  } else if (alt >= MIN_ALT) {
    sentences.push(
      `Sta a ${alt}° — osservabile, con margine di miglioramento verso la culminazione a ${culmAlt}°.`,
    );
  } else {
    sentences.push(
      `È basso sull'orizzonte (${alt}°): conviene attendere che salga prima di puntare il Seestar.`,
    );
  }

  const moonSep = target.moonSeparation ?? 0;
  if (moonSep >= 70) {
    sentences.push("La Luna resta lontana dal campo: il contrasto del cielo profondo resta favorevole.");
  } else if (moonSep >= 45) {
    sentences.push(
      `La Luna è a ${moonSep}° dal target: interferenza moderata, gestibile con filtri o attendendo un'ora più buia.`,
    );
  } else if (moonSep > 0) {
    sentences.push(
      `La Luna è vicina (${moonSep}°): il chiarore riduce il contrasto — preferisci filtri o un momento senza Luna nel campo.`,
    );
  }

  const dur = windowDurationMinutes(target);
  if (dur != null) {
    if (dur >= 120) {
      sentences.push(
        `Hai una finestra ampia (${target.window.start} – ${target.window.end}): oltre ${Math.round(dur / 60)} ore sopra ${MIN_ALT}°.`,
      );
    } else if (dur >= 45) {
      sentences.push(
        `Finestra utile dalle ${target.window.start} alle ${target.window.end} — circa ${dur} minuti sopra l'orizzonte utile.`,
      );
    } else if (dur > 0) {
      sentences.push(
        `Finestra stretta (${target.window.start} – ${target.window.end}): pianifica l'inquadratura con precisione.`,
      );
    }
  }

  const score = target.novaScore ?? 50;
  if (score >= 72) {
    sentences.push("Il NovaScore indica condizioni solide per stanotte: tra le migliori disponibili adesso.");
  } else if (score >= 50) {
    sentences.push("Condizioni accettabili: il cielo permette un tentativo, con qualche compromesso su contrasto o altezza.");
  } else {
    sentences.push("Condizioni impegnative stasera: valuta un altro orario o un target alternativo nel deck.");
  }

  return sentences.join(" ");
}

function buildQuickData(target) {
  const meta = target.skyMeta ?? {};
  return [
    { label: "Tipo", value: target.category ?? "—" },
    { label: "Costellazione", value: meta.constellation ?? "—" },
    { label: "Distanza", value: meta.distance ?? "—" },
    { label: "Dimensione", value: formatArcmin(target.sizeArcmin) },
    { label: "Magnitudine", value: target.magnitude != null ? String(target.magnitude) : "—" },
    { label: "Migliore periodo osservativo", value: meta.bestSeason ?? "—", wide: true },
  ];
}

function renderLevelBars(container, levels) {
  container.replaceChildren();
  if (!levels) {
    const p = document.createElement("p");
    p.className = "briefing-placeholder";
    p.textContent = PLACEHOLDER;
    container.appendChild(p);
    return;
  }

  for (const { key, label } of LEVEL_LABELS) {
    const value = Math.max(0, Math.min(100, Math.round(levels[key] ?? 0)));
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

function renderQuickData(container, target) {
  container.replaceChildren();
  for (const item of buildQuickData(target)) {
    const div = document.createElement("div");
    if (item.wide) div.className = "briefing-quick-wide";
    div.innerHTML = `<dt>${item.label}</dt><dd>${item.value}</dd>`;
    container.appendChild(div);
  }
}

function setText(el, text, fallback = PLACEHOLDER) {
  if (!el) return;
  el.textContent = text?.trim() ? text : fallback;
}

/**
 * Popola la sezione Sky Briefing nella scheda target.
 * @param {HTMLElement} root - elemento [data-sky-briefing]
 * @param {object} target - target calcolato
 */
export function populateSkyBriefing(root, target) {
  if (!root || !target) return;

  const briefing = getSkyBriefing(target.id);

  setText(root.querySelector("[data-briefing-observing]"), briefing.observing);
  setText(root.querySelector("[data-briefing-tonight]"), buildTonightBriefing(target));
  setText(root.querySelector("[data-briefing-seestar]"), briefing.seestar);
  setText(root.querySelector("[data-briefing-curiosity]"), briefing.curiosity);

  renderQuickData(root.querySelector("[data-briefing-quick]"), target);
  renderLevelBars(root.querySelector("[data-briefing-levels]"), briefing.levels);

  root.dataset.briefingComplete = briefing.complete ? "true" : "false";
}

export { formatArcmin, buildQuickData };
