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
await page.click('[data-a="drawer-nav"][data-t="data"]'); // notas/habitos/dinero/eventos/cfg/data/ajustes
```

**Turno y rotación, Ajustes y Datos son portada + una pantalla por tarea.** Para
llegar a una tarjeta hay que abrir su puerta:

```js
await page.click('[data-a="cfg-vista"][data-v="rotacion"]');    // dias|horas|semana|rotacion|notas
await page.click('[data-a="aju-vista"][data-v="calendario"]');  // calendario|sol|aspecto|lector|comida
await page.click('[data-a="datos-vista"][data-v="copia"]');     // planning|dieta|horas|copia|texto
```

Y «Eventos» ya no es una tarjeta de Ajustes: es su propia sección del cajón, con
una pantalla por evento (`ui.evVista` = `''` | `'nuevo'` | el id del evento).

**Trampa de los enlaces profundos**: `irACard(tab,cfg)` hace `if(!c)return;`, así
que si la tarjeta que busca está dentro de una vista que no está abierta, el
botón **no hace nada y no da ningún error**. Por eso existe `CFG_DONDE`, que dice
en qué vista vive cada `data-cfg` enlazable. Si mueves una tarjeta con
`data-cfg` a otra pantalla y no la das de alta ahí, rompes el atajo en silencio.

**Trampa del primer arranque**: con `localStorage` vacío —que es como arranca
cualquier contexto nuevo de Playwright— la app abre el **asistente** y
`renderNow()` vuelve antes de pintar la barra, el cajón y todo lo demás. Una
prueba que dé por hecho que arranca en «Hoy» se queda esperando a botones que no
existen. Al abrir un contexto nuevo, o se conduce el asistente, o se salta:

```js
await page.evaluate(() => { window.PG.store.meta.montada = true;
  window.PG.ui.arranque = null; window.PG.save(); window.PG.render(); });
```

**Trampa de `drawer-nav` fuera del cajón**: `[data-a="drawer-nav"]` tiene que
existir **solo** dentro de `#drawer`. Un botón con esa acción en `#main` hace que
`page.click('[data-a="drawer-nav"][data-t="x"]')` coja ese, que queda debajo del
scrim del cajón, y el clic se pasa 30 s reintentando. Para saltar de sección
desde dentro de una pantalla está `data-a="ir-tab"`, que hace lo mismo.

**Trampa de `normalize()`**: el `map` de `o.eventos` (y los de al lado)
**descarta cualquier campo que no esté en su lista**. Un campo nuevo que no se dé
de alta ahí se pierde en la siguiente carga sin ningún aviso — y una prueba que
lo lea justo después de guardarlo pasará igual. Para probarlo de verdad hay que
dar la vuelta completa: `PG.store = JSON.parse(JSON.stringify(PG.store))`.

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

## Imprimir NO se prueba con capturas

`page.emulateMedia({media:'print'})` + captura de pantalla **no es imprimir**: compone al
ancho de la ventana, pinta todos los fondos y no pagina. Con eso la suite daba verde
mientras en el móvil del usuario salía una hoja casi en blanco.

Lo que sí prueba el papel es `page.pdf({format:'Letter', printBackground:false})` —el
`printBackground:false` importa: es lo que viene marcado por defecto en el diálogo de
Chrome, y hay fallos que solo salen así.

Y para mirarlo hay que contar **píxeles**, no texto: el fallo de septiembre tenía las 30
casillas en el PDF, con su texto y en su sitio, tapadas por una capa blanca. Contar
glifos daba el mismo número con el fallo y sin él. La suite abre el PDF en el propio
Chromium (`file://…#toolbar=0&zoom=page-fit`), lo captura y cuenta los píxeles que no son
blancos.

Trampa de la que salió: **cualquier `::before`/`::after` absoluto que cubra a su padre**
(`position:absolute;inset:0`) se pinta como un rectángulo blanco opaco al imprimir sin
gráficos de fondo, y se lleva por delante todo lo que haya debajo. Si añades una capa así
de adorno, escóndela en `@media print`.

## Una prueba que TUMBA la suite no es una prueba que falla

Ha pasado **tres veces** en este repositorio, y siempre al revertir el arreglo para validar —que es
justo cuando hace falta que la prueba hable—:

- `page.click('[data-a="…"]')` sobre un botón que sin el arreglo no existe: 30 s de espera y la
  suite entera abortada, sin decir qué se ha roto. Guarda el clic:
  `const el=await page.$(sel); if(el) await el.click();` y mete ese booleano en el `check`.
- `P.loQueSea(x).campo` cuando sin el arreglo `loQueSea()` devuelve `null`: excepción y suite
  abortada. Lee siempre con red: `(P.loQueSea(x)||{}).campo`.

Regla: **en una prueba, todo lo que el arreglo crea puede no existir**. Si no existe, la prueba
tiene que FALLAR y enseñar qué faltaba, no reventar la corrida.

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
