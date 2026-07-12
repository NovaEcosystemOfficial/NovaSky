import { mountDashboard, unmountDashboard } from "../views/dashboard.js";
import { mountMissionMap, unmountMissionMap } from "../views/mission-map.js";
import { mountAttrezzatura } from "../views/attrezzatura.js";
import { mountMissione, unmountMissione } from "../views/missione.js";
import { mountPlaceholder } from "../views/placeholder.js";

const ROUTES = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Centro di controllo della notte",
    panelTitle: "Stato operativo",
    mount: mountDashboard,
    unmount: unmountDashboard,
    missionMap: false,
  },
  "mission-map": {
    title: "Mission Map",
    subtitle: "Osservatorio personale",
    panelTitle: "Osservatorio",
    mount: mountMissionMap,
    unmount: unmountMissionMap,
    missionMap: true,
  },
  missione: {
    title: "Missione",
    subtitle: "Piano osservativo della serata",
    panelTitle: "Assistente NovaSky",
    mount: mountMissione,
    unmount: unmountMissione,
    missionMap: false,
  },
  catalogo: {
    title: "Catalogo",
    subtitle: "Target e oggetti del cielo",
    panelTitle: "Catalogo",
    mount: (el, ctx) => mountPlaceholder(el, ctx, "Catalogo", "Esplorazione del catalogo NovaSky con filtri e schede target."),
    unmount: null,
    missionMap: false,
  },
  attrezzatura: {
    title: "Osservatorio",
    subtitle: "Digital Observatory — centro di controllo",
    panelTitle: "Digital Observatory",
    mount: mountAttrezzatura,
    unmount: null,
    missionMap: false,
  },
  diario: {
    title: "Diario",
    subtitle: "Sessioni e note",
    panelTitle: "Diario",
    mount: (el, ctx) => mountPlaceholder(el, ctx, "Diario", "Registro delle sessioni osservative e note personali."),
    unmount: null,
    missionMap: false,
  },
  impostazioni: {
    title: "Impostazioni",
    subtitle: "Preferenze NovaSky",
    panelTitle: "Impostazioni",
    mount: (el, ctx) => mountPlaceholder(el, ctx, "Impostazioni", "Posizione, unità, tema e preferenze dell'applicazione."),
    unmount: null,
    missionMap: false,
  },
};

class NovaShell {
  constructor() {
    this.app = document.querySelector("[data-nova-app]");
    this.workspace = document.querySelector("[data-workspace]");
    this.nav = document.querySelector("[data-nav]");
    this.viewTitle = document.querySelector("[data-view-title]");
    this.viewSubtitle = document.querySelector("[data-view-subtitle]");
    this.panelTitle = document.querySelector("[data-panel-title]");
    this.panelBody = document.querySelector("[data-panel-body]");
    this.panelToggle = document.querySelector("[data-panel-toggle]");
    this.headerClock = document.querySelector("[data-header-clock]");
    this.headerDate = document.querySelector("[data-header-date]");
    this.route = null;
    this.activeUnmount = null;
    this.clockTimer = null;
  }

  init() {
    this.nav?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-route]");
      if (!btn) return;
      this.navigate(btn.dataset.route);
    });

    this.panelToggle?.addEventListener("click", () => {
      const collapsed = this.app.classList.toggle("is-panel-collapsed");
      this.panelToggle.setAttribute("aria-expanded", String(!collapsed));
      this.panelToggle.title = collapsed ? "Apri pannello" : "Chiudi pannello";
      if (this.route === "mission-map") {
        requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
      }
    });

    this.startClock();
    this.navigate("dashboard");
  }

  startClock() {
    const tick = () => {
      const now = new Date();
      if (this.headerClock) {
        this.headerClock.textContent = now.toLocaleTimeString("it-IT", {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      if (this.headerDate) {
        this.headerDate.textContent = now.toLocaleDateString("it-IT", {
          weekday: "long",
          day: "numeric",
          month: "long",
        });
      }
    };
    tick();
    this.clockTimer = setInterval(tick, 30_000);
  }

  async navigate(routeId) {
    const config = ROUTES[routeId];
    if (!config || routeId === this.route) return;

    if (this.activeUnmount) {
      await this.activeUnmount();
      this.activeUnmount = null;
    }

    this.route = routeId;
    this.nav.querySelectorAll("[data-route]").forEach((el) => {
      el.classList.toggle("is-active", el.dataset.route === routeId);
    });

    this.viewTitle.textContent = config.title;
    this.viewSubtitle.textContent = config.subtitle;
    this.panelTitle.textContent = config.panelTitle;

    this.app.classList.toggle("is-mission-map-view", config.missionMap);
    this.workspace.classList.toggle("is-mission-map", config.missionMap);
    this.workspace.innerHTML = "";

    const ctx = {
      panelBody: this.panelBody,
      navigate: (r) => this.navigate(r),
    };

    const result = await config.mount(this.workspace, ctx);
    if (result?.unmount) {
      this.activeUnmount = result.unmount;
    } else if (typeof config.unmount === "function") {
      this.activeUnmount = config.unmount;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new NovaShell().init();
});
