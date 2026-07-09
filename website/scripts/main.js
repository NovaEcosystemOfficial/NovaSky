const header = document.querySelector("[data-site-header]");
const navToggle = document.querySelector("[data-nav-toggle]");
const navMenu = document.querySelector("[data-nav-menu]");
const missionClock = document.querySelector("[data-mission-clock]");
const missionBadge = document.querySelector("[data-mission-badge]");
const missionTarget = document.querySelector("[data-mission-target]");
const missionTargetNote = document.querySelector("[data-mission-target-note]");
const missionTargetPanel = document.querySelector(".mission-target");
const missionSky = document.querySelector("[data-mission-sky]");
const missionProgress = document.querySelector("[data-mission-progress]");
const missionProgressLabel = document.querySelector("[data-mission-progress-label]");

const supportedLocales = {
  it: "Italiano",
  en: "English",
};

function getInitialLocale() {
  const params = new URLSearchParams(window.location.search);
  const requestedLocale = params.get("lang");
  return supportedLocales[requestedLocale] ? requestedLocale : "it";
}

function updateHeaderState() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 12);
}

function closeMenu() {
  if (!navToggle || !navMenu) return;
  navToggle.setAttribute("aria-expanded", "false");
  navMenu.classList.remove("is-open");
}

function formatMissionTime(minutesFromStart) {
  const baseHour = 22;
  const baseMinute = 10;
  const total = baseHour * 60 + baseMinute + minutesFromStart;
  const hour = Math.floor(total / 60) % 24;
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function startMissionSimulation() {
  if (!missionClock) return;

  let missionMinutes = 0;
  let targetIndex = 0;
  let progress = 34;
  const badges = ["Anteprima live", "Cielo stabile", "Target pronto", "Finestra utile"];
  const targets = [
    {
      name: "NGC 7000",
      note: "Nebulosa Nord America · alta nel cielo",
      sky: "Trasparenza buona",
    },
    {
      name: "M27",
      note: "Manubrio · ottima prima di mezzanotte",
      sky: "Luna gestibile",
    },
    {
      name: "IC 1396",
      note: "Nebulosa Elefante · lunga finestra utile",
      sky: "Cielo stabile",
    },
  ];
  let badgeIndex = 0;

  window.setInterval(() => {
    missionMinutes = (missionMinutes + 1) % 206;
    missionClock.classList.add("is-ticking");
    window.setTimeout(() => {
      missionClock.textContent = formatMissionTime(missionMinutes);
      missionClock.classList.remove("is-ticking");
    }, 160);
  }, 8000);

  if (missionBadge) {
    window.setInterval(() => {
      badgeIndex = (badgeIndex + 1) % badges.length;
      missionBadge.textContent = badges[badgeIndex];
    }, 5200);
  }

  if (missionTarget && missionTargetNote) {
    window.setInterval(() => {
      targetIndex = (targetIndex + 1) % targets.length;
      const nextTarget = targets[targetIndex];
      missionTargetPanel?.classList.add("is-changing");
      window.setTimeout(() => {
        missionTarget.textContent = nextTarget.name;
        missionTargetNote.textContent = nextTarget.note;
        if (missionSky) missionSky.textContent = nextTarget.sky;
        missionTargetPanel?.classList.remove("is-changing");
      }, 180);
    }, 9800);
  }

  if (missionProgress && missionProgressLabel) {
    window.setInterval(() => {
      progress = progress >= 92 ? 28 : progress + 7;
      missionProgress.style.width = `${progress}%`;
      missionProgressLabel.textContent = `${progress}%`;
    }, 6200);
  }
}

document.documentElement.dataset.locale = getInitialLocale();

updateHeaderState();
startMissionSimulation();

window.addEventListener("scroll", updateHeaderState, { passive: true });

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!isOpen));
    navMenu.classList.toggle("is-open", !isOpen);
  });

  navMenu.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      closeMenu();
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}
