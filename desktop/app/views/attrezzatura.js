import { DEVICE_REGISTRY } from "../shared/device-registry.js";

export function mountAttrezzatura(container, ctx) {
  if (!document.querySelector('link[href*="gear.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "nova://desktop/styles/gear.css";
    document.head.appendChild(link);
  }

  container.innerHTML = `
    <section class="gear-view">
      <header class="gear-head">
        <h2>Attrezzatura</h2>
        <p>Architettura dispositivi pronta per integrazioni future. Nessuna connessione attiva.</p>
      </header>
      <div class="gear-grid">
        ${DEVICE_REGISTRY.map(
          (d) => `
          <article class="gear-card" data-device-id="${d.id}">
            <div class="gear-card-icon" aria-hidden="true">${d.icon}</div>
            <div class="gear-card-body">
              <h3>${d.name}</h3>
              <span class="gear-status">Non collegato</span>
            </div>
            <button type="button" class="gear-detail-btn" data-device-detail="${d.id}">Dettagli</button>
          </article>
        `
        ).join("")}
      </div>
    </section>
  `;

  if (ctx.panelBody) {
    ctx.panelBody.innerHTML = `
      <p><strong>0</strong> dispositivi collegati su <strong>${DEVICE_REGISTRY.length}</strong>.</p>
      <p style="margin-top:12px;color:var(--quiet)">Seestar, montature SynScan, EAGLE, camere e osservatorio motorizzato saranno integrati qui.</p>
    `;
  }

  container.querySelectorAll("[data-device-detail]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.deviceDetail;
      const device = DEVICE_REGISTRY.find((d) => d.id === id);
      if (!device || !ctx.panelBody) return;
      ctx.panelBody.innerHTML = `
        <h3 style="margin:0 0 8px;font-size:1rem;color:var(--text)">${device.name}</h3>
        <p style="margin:0 0 12px"><span class="gear-status">Non collegato</span></p>
        <p style="margin:0;color:var(--quiet);font-size:0.8125rem">Driver e controllo hardware non ancora implementati. L'architettura è pronta per l'integrazione.</p>
      `;
      if (ctx.app && ctx.app.classList.contains("is-panel-collapsed")) {
        ctx.app.classList.remove("is-panel-collapsed");
      }
    });
  });
}
