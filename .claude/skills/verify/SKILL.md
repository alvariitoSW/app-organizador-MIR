# Verify: Guardias · rotación y cocina

Static single-page app (no build step): `index.html` + `app.js` + `styles.css`.
State lives in `localStorage` via `store` (persisted) / `ui` (transient, not persisted).

## Launch

```bash
cd /home/user/app-organizador-MIR
python3 -m http.server <free-port>   # serves the repo root as-is, no build
```

Drive it with Playwright. The installed `playwright` npm version usually doesn't
match the pre-installed browser revision, so always pass the pinned binary:

```js
const { chromium } = require('/home/user/app-organizador-MIR/node_modules/playwright');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
```

(`npm install` first if `node_modules/playwright` is missing.)

## Navigating the real UI

Navigation was restructured into: a merged "Calendario" tab (Mes/Semana/Hoy modes),
fixed "Entreno"/"Compra" tabs, and a "☰ Más" side drawer for the rest (Comida, Días y
menús, Cocina en lote, Turno y rotación, Datos). To reach a tab from a cold load:

```js
// Calendario modes (hoy/week/month):
await page.click('[data-a="nav-cal"]');
await page.click('#calModes button[data-t="week"]'); // or "month" / "hoy"

// Fixed tabs:
await page.click('[data-a="tab"][data-t="gym"]');   // Entreno
await page.click('[data-a="tab"][data-t="shop"]');  // Compra

// Drawer tabs:
await page.click('[data-a="drawer-toggle"]');
await page.click('[data-a="drawer-nav"][data-t="data"]'); // food/types/batches/cfg/data
```

`window.PG` exposes most internals for seeding fixture state before driving the UI
(e.g. `window.PG.setDayOverride(dateStr, shiftId, guard)`, `window.PG.addVacation(...)`,
default shift ids are `sh-g` guardia, `sh-s` saliente, `sh-t` día de trabajo, `sh-f` día
de fuerza, `sh-l` día libre, `sh-v` vacaciones) — use this only to set up fixtures, then
click through the real UI for the actual check.

## Gotchas hit during verification

- The Google-calendar export preview lives in `<div id="txtIcs">` (not a `<textarea>`,
  despite looking like one) — read `.textContent`.
- `[data-a="cal-ver"]` **toggles** `ui.calView` — clicking it twice in a row while it's
  already open will hide it, not refresh it for a new date range. Check
  `window.PG.ui.calView` first, or close-then-reopen explicitly.
- Real file downloads (e.g. "descargar .ics") go through `dlTxt()` → a real
  browser download; capture with `page.waitForEvent('download')` +
  `download.saveAs(...)`, not by calling the generator function directly.
- `.claude/worktrees/` is gitignored (scratch copies for background agents); the
  rest of `.claude/` (this skill included) is tracked.

## Regression suite (not a substitute for driving the UI, but keep it green)

`node tests/regression.test.js` — custom Playwright script (not Jest), same
`executablePath` pinning as above already baked in.
