# NovaSky Website

Static foundation for the official NovaSky landing website.

## Structure

```text
website/
  index.html
  assets/images/
  pages/
  scripts/
  styles/
```

## Current scope

- Landing page with hero, problem, solution, compatibility, experience, roadmap, and footer.
- **Mission Map Premium** (`pages/mission-map.html`) — real-sky astronomy engine, immersive targets, narrative card, mission timeline.
- Italian-first localization with `data-i18n` keys and locale placeholders in `locales/`.
- Responsive layout for desktop and mobile.
- Local generated hero image.
- Lightweight JavaScript for navigation behavior.
- Placeholder routes for future Docs, Blog, and Support pages.

## Run locally

Open `index.html` directly in a browser, or serve the `website` folder with any static server.

Mission Map (ES modules): use a local server — e.g. `python3 -m http.server 8080` from the `website` folder, then open `http://localhost:8080/pages/mission-map.html`.

Real target photos are fetched from Wikimedia Commons. To refresh assets:

```bash
python3 website/scripts/fetch-target-photos.py
```

Astronomy engine tests:

```bash
node website/scripts/mission-map/tests/run-tests.mjs
```

See `website/scripts/mission-map/astro/README.md` for formulas and limitations.

No backend is required.
