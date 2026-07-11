# Meridian

An interactive prototype for Meridian, a personal wealth-management app — dashboard, portfolio, budget, goals, connected accounts, and settings, with a login flow gating access.

Built as plain HTML/CSS/JS with no build step or dependencies. All data is seeded on first load and persisted to `localStorage` in the browser, so edits (budget changes, new goals, connected accounts, etc.) survive page reloads.

## Running it

```
node server.js
```

Then open `http://localhost:8935` in your browser. Any email/password will log you in (this is a prototype — there's no real backend or account system).

## Structure

- `index.html`, `portfolio.html`, `budget.html`, `goals.html`, `accounts.html`, `settings.html`, `login.html` — pages
- `js/store.js` — seeded app data + localStorage persistence
- `js/auth.js` — session/login gating (separate from app data, so logging out never touches it)
- `js/charts.js` — dependency-free SVG line and donut chart rendering
- `js/nav.js` — shared sidebar / bottom tab bar / top bar, responsive at 900px
- `js/icons.js` — inline SVG icon set
- `css/styles.css` — design tokens and shared component styles
