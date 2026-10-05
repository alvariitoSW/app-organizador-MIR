---
name: verify
description: Arrancar, conducir y hacer capturas de la app (Guardias · rotación y cocina) en un navegador headless para ver un cambio funcionando de verdad, no solo la suite. Úsala para «ejecuta la app», «haz una captura», «comprueba que funciona en la app», «conduce la pantalla», «mide a 412×915», y antes de dar por bueno un cambio de interfaz. Incluye el driver (driver.mjs), cómo saltar el asistente, navegar, sembrar datos con window.PG y las trampas de Playwright de este repo.
---

# Verify: Guardias · rotación y cocina

App de una sola página, **sin build**: `index.html` + `app.js` + `styles.css` (+ `sw.js`). El estado
vive en `localStorage` vía `store` (se guarda) y `ui` (no se guarda). Rutas relativas a la raíz del repo.

## Conducirla (camino del agente): `driver.mjs`

Sirve el repo en un puerto libre, abre Chromium a **412×915** (el móvil del usuario), salta el
asistente de primer arranque y ejecuta **una orden por línea** de stdin; imprime el resultado de cada
paso y, al final, los errores de JS de la página. Sale con 1 si algo falló.

```bash
node .claude/skills/verify/driver.mjs --out /tmp/claude-0/drv <<'FIN'
nav comer
click [data-a="food-prev"]
text .h2nav
fill #frIn bocata de pollo con queso
press #frIn Enter
click [data-a="fr-ok"]
eval PG.foodLog(PG.ui.foodDate).map(x => x.nombre)
ss comer-ayer
nav consumo
back
eval PG.ui.tab
FIN
```

Órdenes: `nav <cal|mes|semana|hoy|entreno|comer|menu|nevera|compra>` (`menu` = la Semana de Comer) (o cualquier sección del cajón:
`consumo`, `dinero`, `habitos`, `notas`, `eventos`, `cfg`, `data`, `ajustes`…), `ui clave=valor …`
(pone `PG.ui` y pinta), `click <sel>`, `fill <sel> <texto>` (dispara `change`), `press <sel> <tecla>`,
`back` (atrás del móvil), `wait <ms>`, `eval <js>`, `text [sel]`, `ss <nombre>` (página completa,
desde arriba), `ssv <nombre>` (solo lo visible), `seed <fichero.js>` (código con `window.PG` para
sembrar datos; luego guarda y pinta). Opciones: `--out DIR` (capturas; por defecto
`/tmp/guardias-driver`), `--size 412x915`, `--wizard` (no salta el asistente).

Sembrar y conducir:

```bash
cat > /tmp/claude-0/seed.js <<'FIN'
const P = window.PG; P.store.food.log[P.iso(new Date())] = [{ id: 'e1', p: 'comida', nombre: 'Lentejas', kcal: 500, prot: 25, carb: 60, gresa: 10, rac: 1 }];
FIN
node .claude/skills/verify/driver.mjs --out /tmp/claude-0/drv <<'FIN'
seed /tmp/claude-0/seed.js
nav comer
click #main .h2en
back
eval !!document.querySelector('#hojaDia .hoja')
FIN
```

**Mira las capturas** (Read sobre el .png). Para medir alturas, `eval` con `getBoundingClientRect()`.

Si necesitas lógica que el driver no tiene (bucles, medir muchas cosas), escribe un script de
Playwright en el scratchpad con el mismo arranque:

```js
const { chromium } = require('/home/user/app-organizador-MIR/node_modules/playwright');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
```

(`npm install` primero si falta `node_modules/playwright`). El `playwright` de npm no casa con el
Chromium preinstalado: pasa **siempre** `executablePath`. No hace falta `xvfb` ni `apt-get`.

## Pruebas

```bash
npm run -s test:app          # la suite de regresión (Playwright propio, no Jest): ~10 min, sirve sus propios ficheros
npm run -s test:compartir    # 6
npm run -s test:enlaces      # 7
npm run -s test:actualiza    # 10
```

La suite imprime `PASS/FAIL — nombre (detalle)` y al final `N/M pruebas OK`. Lánzala en segundo plano
(`run_in_background`) y espera con un `until grep -q ...; do sleep 5; done`: tarda más que el límite
de una orden normal.

## Navigating the real UI

La barra son **tres grupos** y un cajón: «Calendario» (modos Mes/Semana/Hoy),
«Entreno», «Comer» (modos **Hoy · Semana · Nevera · Compra**) y «☰ Más» para lo que no es
ninguna de las tres. La segunda fila (`#calModes`) sirve a los dos grupos que
tienen modos, y se oculta en Entreno y en el cajón.

```js
// Calendario (hoy/week/month):
await page.click('[data-a="nav-cal"]');
await page.click('#calModes button[data-t="week"]'); // o "month" / "hoy"

// Entreno:
await page.click('[data-a="tab"][data-t="gym"]');

// Comer: portada (el día) y sus modos
await page.click('[data-a="nav-comer"]');
await page.click('#calModes button[data-t="types"]');   // Semana (ui.tab='types')
await page.click('#calModes button[data-v="nevera2"]'); // Nevera (ui.foodVista='nevera2')
await page.click('#calModes button[data-t="shop"]');    // Compra

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

Vistas dentro de Comer, por `ui.foodVista`: `''` (el día; `ui.foodDate` elige el día, `''` = hoy),
`buscar`, `cantidad`, `micros`, `quecomo`, `hoycocino`, `platos`, `alimentos`, `ficha`, `plato`… La
hoja de una toma se abre con `ui.feVer = <id de la entrada>`. En Menú, `ui.typesVista` (`''`,
`montar`, `protos`, `macros`, `rapido`, `elegir`, `semana`…). Consumo: `ui.cnVista` (`''`/`efectos`).
Dinero: `ui.dinTab` + `ui.dineroVista`.

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

**Mes lleva la semana de antes y la de después**: la cuadrícula ya no empieza en el día 1 con huecos
vacíos. Los días de fuera del mes son `.dbox.fuera`, clicables igual. Para contar «las casillas del
mes» filtra `:not(.fuera)`. Y `.cal.ext` tiene `min-height:100svh`: en `@media print` se anula,
porque si no la tarjeta no cabe en la hoja y la primera página sale en blanco.

**Semana va por días, no de lunes a domingo**: empieza en `ui.semDesde` (`''` = hoy) y enseña
`store.rotation.semanaDias` días (5/7/10/14); el de antes va plegado en `.dayer` (no es `.drow`).
`weekDays()` sigue siendo la semana de lunes de `weekDate` —la usan la cocina y la compra—; la lista
de Semana sale de `semanaVentana()`. Una prueba que prepare días «de esta semana» tiene que poner
`PG.ui.semDesde = lunes`, o la ventana empieza hoy y se los salta.

**Temas**: `PG.ponerTema(id)` (`hud|magenta|bosque|papel|arena`) cambia el modo claro/oscuro, las
variables de color y los colores de la franja de golpe. Si una prueba deja uno puesto, las
siguientes ven otro fondo: vuelve a `ponerTema('hud')` al terminar.

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

## Más trampas vividas al conducirla

- **`python3 -m http.server` en segundo plano se muere solo** en este contenedor: las capturas salen
  de «ERR_CONNECTION_REFUSED». El driver monta su propio servidor de Node en un puerto libre y lo
  cierra al acabar; usa eso.
- **Captura completa con la página desplazada**: la barra de arriba es fija y sale pintada a media
  altura. `ss` sube arriba antes; en tu propio script, `scrollTo(0,0)` antes de `fullPage`.
- **Una hoja abierta (`.fehoja` en `#hojaDia`) tapa todo con su `.hscrim`**: `click #navAtras` espera
  y falla («subtree intercepts pointer events»). Ciérrala con `back` (el atrás del móvil),
  `[data-a="fe-cerrar"]`, o tocando el scrim.
- **ElementHandle «not attached to the DOM»**: el buscador repinta con retardo; un nodo cogido con
  `page.$()` y pulsado después se suelta. Pulsa **por selector** (`page.click(sel)`), como el driver.
- **«‹ atrás» sube de nivel, no deshace pasos**: hoja → se cierra; sub‑pantalla → su `.volver`;
  portada de sección → la sección anterior; si no hay, el Mes (y el botón se oculta).
- **Pruebas con fecha fija**: el día 1 de mes se rompieron tres pruebas que usaban «el 15 de
  septiembre» o «el primer día visible». Calcula las fechas desde `new Date()`.
- **Desplegar**: el hook `sella-antes-de-main.sh` bloquea subir `main` sin sellar. `npm run -s sella`
  y su commit van en una orden **aparte** del push (juntos, el hook la rechaza).

## Regression suite (not a substitute for driving the UI, but keep it green)

`node tests/regression.test.js` (= `npm run -s test:app`) — custom Playwright script (not Jest), same
`executablePath` pinning as above already baked in.
