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
- **Mission Map Premium** (`pages/mission-map.html`) — transparent PNG targets suspended in space with category glow, cosmic sky with parallax, narrative dossier card, connected mission timeline.
- Italian-first localization with `data-i18n` keys and locale placeholders in `locales/`.
- Responsive layout for desktop and mobile.
- Local generated hero image.
- Lightweight JavaScript for navigation behavior.
- Placeholder routes for future Docs, Blog, and Support pages.

## Run locally

Open `index.html` directly in a browser, or serve the `website` folder with any static server.

Mission Map (ES modules): use a local server — e.g. `python3 -m http.server 8080` from the `website` folder, then open `http://localhost:8080/pages/mission-map.html`.

No backend is required.
