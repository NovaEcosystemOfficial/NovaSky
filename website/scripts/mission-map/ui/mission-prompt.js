/**
 * UI non invasiva per missione di un giorno precedente.
 */

/** @returns {Promise<"continue"|"new">} */
export function promptPreviousMission(missionDate) {
  return new Promise((resolve) => {
    const overlay = document.querySelector("[data-mission-rollover]");
    if (!overlay) {
      resolve("continue");
      return;
    }

    const dateEl = overlay.querySelector("[data-mission-rollover-date]");
    if (dateEl) dateEl.textContent = formatItalianDate(missionDate);

    overlay.hidden = false;
    overlay.classList.add("is-visible");

    const finish = (choice) => {
      overlay.classList.remove("is-visible");
      overlay.hidden = true;
      resolve(choice);
    };

    overlay.querySelector("[data-mission-rollover-continue]")?.addEventListener(
      "click",
      () => finish("continue"),
      { once: true },
    );
    overlay.querySelector("[data-mission-rollover-new]")?.addEventListener(
      "click",
      () => finish("new"),
      { once: true },
    );
  });
}

function formatItalianDate(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
