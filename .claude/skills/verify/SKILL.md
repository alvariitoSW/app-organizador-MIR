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

La barra son **tres grupos** y un cajón: «Calendario» (modos Mes/Semana/Hoy),
«Entreno», «Comer» (modos Hoy/Menú/Cocina/Compra) y «☰ Más» para lo que no es
ninguna de las tres. La segunda fila (`#calModes`) sirve a los dos grupos que
tienen modos, y se oculta en Entreno y en el cajón.

```js
// Calendario (hoy/week/month):
await page.click('[data-a="nav-cal"]');
await page.click('#calModes button[data-t="week"]'); // o "month" / "hoy"

// Entreno:
await page.click('[data-a="tab"][data-t="gym"]');

// Comer (food/types/shop/batches/import son pestañas internas del mismo grupo):
await page.click('[data-a="nav-comer"]');              // portada: el día
await page.click('#calModes button[data-t="types"]');  // Menú
await page.click('#calModes button[data-v="cocina-panel"]'); // Cocina
await page.click('#calModes button[data-t="shop"]');   // Compra
await page.click('[data-a="cocina-tab"][data-t="lote"]');    // Cocina → Tandas

// El cajón, que ya solo lleva lo que no es calendario, entreno ni comida:
await page.click('[data-a="drawer-toggle"]');
await page.click('[data-a="drawer-nav"][data-t="data"]'); // notas/habitos/cfg/data/ajustes
```

Vistas dentro de Comer, por `ui.foodVista`: `''` (el día), `buscar`, `cantidad`,
`productos`, `micros`, `platos`, `alimentos`, `ficha`, `cocina-panel`, `plato`,
`alimnuevo`, `add`, `cocina`. Y `ui.cocinaTab` (`''`/`nevera`/`lote`),
`ui.platosTab` (`''`/`antojo`/`importar`), `ui.shopVista` (`''`/`listas`).

**Trampa al sembrar menús**: un plato dentro de una toma solo cuenta si lleva
`kind:'dish'` — `dishQty()` filtra por ahí, así que `{id,portions}` a secas no
suma kcal ni entra en las tandas ni en la compra, y no da ningún error.

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

## Probar secuencias, no caminos sueltos

La suite llegó a 133 pruebas en verde con seis fallos reales vivos en la pantalla de
importar recetas. Todos aparecían al **encadenar dos gestos**, y ninguno al probar cada
camino por separado desde un estado limpio:

- leer una receta → «limpiar»: la previa y su botón de guardar seguían ahí;
- traer un enlace con receta → traer otro sin receta: se quedaba la primera, y guardabas
  el plato del enlace anterior;
- un 200 que no es JSON se culpaba a CORS y mandaba al usuario a montar un proxy.

Antes de dar por buena una pantalla nueva, condúcela en cadena: haz, deshaz, repite con
otra entrada, vuelve atrás. Y comprueba lo que queda **en pantalla**, no solo el estado.

Dos trampas de Playwright que salieron en eso:

- `page.fill()` **no** dispara `change` en un `<input>` de texto. Si el manejador está en
  el listener de `change` (la app tiene dos switch: uno de clics y otro de `change`),
  hay que salir del campo: `await page.keyboard.press('Tab')`.
- `page.evaluate(() => ({p: unaPromesa}))` devuelve `{}`: la promesa no sobrevive a la
  serialización. Hay que esperarla dentro: `evaluate(async () => ({v: await ...}))`.

Un `case` en el switch que no toca no se dispara nunca y no da error: al añadir una
acción, comprueba si el elemento es un botón (clic) o un `input`/`select` (`change`), y
**pulsa el botón de verdad en la prueba** en vez de comprobar solo que existe.

## Regression suite (not a substitute for driving the UI, but keep it green)

`node tests/regression.test.js` — custom Playwright script (not Jest), same
`executablePath` pinning as above already baked in.
