/** NovaSky — cinematic visual layer (intro, living sky, micro-interactions). */

(function cinematicNovaSky() {
  "use strict";

  const INTRO_KEY = "novasky-intro-seen";
  const INTRO_LINES = [
    "Mission Control Online",
    "Analisi del cielo...",
    "Calcolo della finestra osservativa...",
    "Briefing pronto.",
  ];
  const INTRO_LINE_MS = 520;
  const INTRO_FADE_MS = 480;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── Intro ─────────────────────────────────────────────── */

  function buildIntroOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "cinematic-intro";
    overlay.setAttribute("role", "presentation");
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
      <div class="cinematic-intro__inner">
        <div class="cinematic-intro__brand brand" aria-hidden="true">
          <span class="brand-mark"><span></span></span>
          <span class="brand-word">NovaSky</span>
        </div>
        <p class="cinematic-intro__line" data-intro-line></p>
      </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  function runIntro() {
    if (sessionStorage.getItem(INTRO_KEY)) return Promise.resolve();

    const overlay = buildIntroOverlay();
    const lineEl = overlay.querySelector("[data-intro-line]");
    document.body.classList.add("is-intro-active");

    return new Promise((resolve) => {
      let step = 0;

      const showLine = () => {
        if (step >= INTRO_LINES.length) {
          overlay.classList.add("is-exiting");
          window.setTimeout(() => {
            overlay.remove();
            document.body.classList.remove("is-intro-active");
            sessionStorage.setItem(INTRO_KEY, "1");
            resolve();
          }, INTRO_FADE_MS);
          return;
        }

        lineEl.classList.remove("is-visible");
        void lineEl.offsetWidth;
        lineEl.textContent = INTRO_LINES[step];
        lineEl.classList.add("is-visible");
        step += 1;
        window.setTimeout(showLine, INTRO_LINE_MS);
      };

      window.requestAnimationFrame(() => {
        overlay.classList.add("is-active");
        window.setTimeout(showLine, 180);
      });
    });
  }

  /* ── Seeded random ─────────────────────────────────────── */

  function seededRandom(seed) {
    let s = seed;
    return () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  /* ── Cosmic background canvas ──────────────────────────── */

  function initCosmicBackground() {
    const canvas = document.createElement("canvas");
    canvas.className = "cosmic-bg-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.prepend(canvas);
    const ctx = canvas.getContext("2d", { alpha: true });

    const rand = seededRandom(42);
    const stars = [];
    const particles = [];
    const STAR_COUNT = 140;
    const PARTICLE_COUNT = 28;

    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push({
        x: rand(),
        y: rand(),
        r: rand() < 0.08 ? 1.4 : rand() < 0.25 ? 1 : 0.55,
        base: 0.15 + rand() * 0.55,
        phase: rand() * Math.PI * 2,
        speed: 0.4 + rand() * 1.2,
        tint: rand() < 0.12 ? "cyan" : "white",
      });
    }

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: rand(),
        y: rand(),
        vx: (rand() - 0.5) * 0.00008,
        vy: (rand() - 0.5) * 0.00006,
        size: 0.6 + rand() * 1.2,
        alpha: 0.08 + rand() * 0.18,
      });
    }

    let w = 0;
    let h = 0;
    let dpr = 1;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let nebulaOffsetX = 0;
    let nebulaOffsetY = 0;

    const shooting = { active: false, x: 0, y: 0, len: 0, angle: 0, progress: 0, speed: 0 };

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function scheduleShootingStar() {
      const delay = 20000 + Math.random() * 20000;
      window.setTimeout(() => {
        if (!shooting.active) {
          shooting.active = true;
          shooting.x = Math.random() * w * 0.7 + w * 0.1;
          shooting.y = Math.random() * h * 0.35 + h * 0.05;
          shooting.len = 80 + Math.random() * 120;
          shooting.angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.35;
          shooting.progress = 0;
          shooting.speed = 0.018 + Math.random() * 0.012;
        }
        scheduleShootingStar();
      }, delay);
    }

    function drawNebula(time) {
      const driftX = Math.sin(time * 0.00004) * 30 + nebulaOffsetX;
      const driftY = Math.cos(time * 0.00003) * 20 + nebulaOffsetY;

      const g1 = ctx.createRadialGradient(
        w * 0.72 + driftX,
        h * 0.22 + driftY,
        0,
        w * 0.72 + driftX,
        h * 0.22 + driftY,
        w * 0.55,
      );
      g1.addColorStop(0, "rgba(92, 199, 216, 0.045)");
      g1.addColorStop(0.45, "rgba(60, 120, 160, 0.018)");
      g1.addColorStop(1, "transparent");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(
        w * 0.18 - driftX * 0.5,
        h * 0.68 - driftY * 0.4,
        0,
        w * 0.18 - driftX * 0.5,
        h * 0.68 - driftY * 0.4,
        w * 0.42,
      );
      g2.addColorStop(0, "rgba(231, 184, 90, 0.028)");
      g2.addColorStop(0.55, "rgba(120, 90, 50, 0.012)");
      g2.addColorStop(1, "transparent");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);
    }

    function drawFrame(time) {
      ctx.clearRect(0, 0, w, h);
      drawNebula(time);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180, 210, 230, ${p.alpha})`;
        ctx.fill();
      }

      for (const star of stars) {
        const twinkle = star.base + Math.sin(time * 0.001 * star.speed + star.phase) * 0.22;
        const alpha = Math.max(0.06, Math.min(0.85, twinkle));
        const color =
          star.tint === "cyan"
            ? `rgba(140, 215, 230, ${alpha})`
            : `rgba(238, 244, 248, ${alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(star.x * w, star.y * h, star.r, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      if (shooting.active) {
        shooting.progress += shooting.speed;
        const t = shooting.progress;
        const headX = shooting.x + Math.cos(shooting.angle) * shooting.len * t;
        const headY = shooting.y + Math.sin(shooting.angle) * shooting.len * t;
        const tailX = headX - Math.cos(shooting.angle) * shooting.len * 0.35;
        const tailY = headY - Math.sin(shooting.angle) * shooting.len * 0.35;
        const fade = 1 - t;

        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.strokeStyle = `rgba(220, 235, 255, ${fade * 0.75})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(headX, headY, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${fade * 0.9})`;
        ctx.fill();
        ctx.restore();

        if (t >= 1) shooting.active = false;
      }

      window.requestAnimationFrame(drawFrame);
    }

    window.addEventListener(
      "mousemove",
      (e) => {
        mouseX = e.clientX / w;
        mouseY = e.clientY / h;
        nebulaOffsetX = (mouseX - 0.5) * 18;
        nebulaOffsetY = (mouseY - 0.5) * 12;
      },
      { passive: true },
    );

    resize();
    window.addEventListener("resize", resize, { passive: true });
    scheduleShootingStar();
    window.requestAnimationFrame(drawFrame);
  }

  /* ── Hero deep sky (behind title) ──────────────────────── */

  function initHeroSky() {
    const heroCopy = document.querySelector(".hero-copy");
    const heroTitle = document.querySelector("#hero-title");
    if (!heroCopy || !heroTitle) return;

    const wrap = document.createElement("div");
    wrap.className = "hero-sky-wrap";
    wrap.setAttribute("aria-hidden", "true");

    const canvas = document.createElement("canvas");
    canvas.className = "hero-sky-canvas";
    wrap.appendChild(canvas);
    heroCopy.insertBefore(wrap, heroCopy.firstChild);

    const ctx = canvas.getContext("2d", { alpha: true });
    const rand = seededRandom(7);
    const stars = [];

    for (let i = 0; i < 55; i++) {
      stars.push({
        x: rand(),
        y: rand(),
        r: 0.4 + rand() * 1.1,
        phase: rand() * Math.PI * 2,
        drift: (rand() - 0.5) * 0.000015,
        baseY: rand(),
      });
    }

    function resize() {
      const rect = heroTitle.getBoundingClientRect();
      const padX = 40;
      const padY = 30;
      const width = rect.width + padX * 2;
      const height = rect.height + padY * 2;
      wrap.style.width = `${width}px`;
      wrap.style.height = `${height}px`;
      wrap.style.left = `${rect.left - heroCopy.getBoundingClientRect().left - padX}px`;
      wrap.style.top = `${rect.top - heroCopy.getBoundingClientRect().top - padY}px`;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(time) {
      const width = canvas.width / Math.min(window.devicePixelRatio || 1, 2);
      const height = canvas.height / Math.min(window.devicePixelRatio || 1, 2);
      ctx.clearRect(0, 0, width, height);

      const neb = ctx.createRadialGradient(
        width * 0.55,
        height * 0.45,
        0,
        width * 0.55,
        height * 0.45,
        width * 0.65,
      );
      neb.addColorStop(0, "rgba(92, 199, 216, 0.12)");
      neb.addColorStop(0.5, "rgba(40, 80, 120, 0.06)");
      neb.addColorStop(1, "transparent");
      ctx.fillStyle = neb;
      ctx.fillRect(0, 0, width, height);

      for (const star of stars) {
        star.x += star.drift;
        if (star.x < 0) star.x = 1;
        if (star.x > 1) star.x = 0;
        const twinkle = 0.35 + Math.sin(time * 0.0008 + star.phase) * 0.25;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(230, 240, 255, ${twinkle})`;
        ctx.fill();
      }

      window.requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize, { passive: true });
    if ("ResizeObserver" in window) {
      const ro = new ResizeObserver(resize);
      ro.observe(heroTitle);
    }
    window.requestAnimationFrame(draw);
  }

  /* ── Card scroll reveal ────────────────────────────────── */

  function initScrollReveal() {
    const cards = document.querySelectorAll(
      ".question-card, .feature-card, .flow-line article, .roadmap-list li, .device-stack article",
    );

    cards.forEach((card, i) => {
      card.classList.add("cinematic-reveal");
      card.style.setProperty("--reveal-delay", `${Math.min(i * 40, 320)}ms`);
    });

    if (reducedMotion || !("IntersectionObserver" in window)) {
      cards.forEach((c) => c.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    cards.forEach((c) => io.observe(c));
  }

  /* ── Button click pulse ────────────────────────────────── */

  function initButtonPulse() {
    document.querySelectorAll(".button").forEach((btn) => {
      btn.addEventListener(
        "click",
        (e) => {
          if (reducedMotion) return;
          const rect = btn.getBoundingClientRect();
          const ripple = document.createElement("span");
          ripple.className = "button-pulse";
          ripple.style.left = `${e.clientX - rect.left}px`;
          ripple.style.top = `${e.clientY - rect.top}px`;
          btn.appendChild(ripple);
          ripple.addEventListener("animationend", () => ripple.remove());
        },
        { passive: true },
      );
    });
  }

  function initParallaxVars() {
    document.body.classList.add("cosmic-parallax");
    window.addEventListener(
      "mousemove",
      (e) => {
        const mx = e.clientX / window.innerWidth - 0.5;
        const my = e.clientY / window.innerHeight - 0.5;
        document.body.style.setProperty("--mx", String(mx * 2));
        document.body.style.setProperty("--my", String(my * 2));
      },
      { passive: true },
    );
  }

  /* ── Boot ──────────────────────────────────────────────── */

  function boot() {
    initScrollReveal();
    initButtonPulse();

    if (reducedMotion) {
      sessionStorage.setItem(INTRO_KEY, "1");
      return;
    }

    initParallaxVars();
    initCosmicBackground();

    if (sessionStorage.getItem(INTRO_KEY)) {
      initHeroSky();
      return;
    }

    runIntro().then(() => initHeroSky());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
