# Ficha · La Semana (pieza 1) · rehacer Hoy con la semana dentro
Encargo `encargos/la-semana-y-los-sensores.md` · acta `consejo/2026-11-18.md` · maqueta **`maquetas/hoy-rehecho.html`**
(6 marcos a 412×915). **ESTADO: la maqueta NO tiene el visto bueno. No se construye nada hasta que conteste la parte 2.**
Líneas de `app.js` comprobadas el 18/11 sobre la rama (= `main` 2c89126; `app.js` 30.854 líneas). Pruebas: la última es la 686.

## 1 · Qué y para qué
- **H1 (lo mínimo)** Dado un miércoles de trabajo con guardia el sábado, cuando abro Hoy a 412×915, entonces todo cabe sin
  deslizar: tira de 7 días desde hoy (guardia y saliente marcados) · «AHORA · 08:00» con una frase y un solo paso con hora ·
  «DORMIR Cama 22:40 · en pie 06:50» · «MOVERSE Fuerza · 17:00 · 60 min» · «COMER Comida: … / Cena: …» · compra · «Más de hoy».
- **H2** Dado Hoy, cuando toco el sábado de la tira, entonces la misma pantalla enseña «Sábado 21 · GUARDIA», «Noche de
  guardia: sin hora», «Sin entreno: es guardia», sin «Ahora» y con «‹ Volver a hoy»; al tocarlo vuelvo a hoy.
- **H3** Dado un día con Lloret y despertador 06:50, cuando son las 21:30, entonces «Ahora» dice «21:50 · Vete del Lloret ·
  en casa 22:25 · cama 22:40» (la salida sale de la cama de 8 h, no de las 00:30 de ahora) y el botón «Ya me voy».
- **H4** Dado la semana sin menú, cuando toco «Comer», entonces la hoja trae los platos ya puestos (motor de «¿Me la
  propones?»), «Cambiar» en cada uno y «Volver a montar el menú de la semana»; lo que cambié a mano no se pisa; en Comer ya
  no existen «✨ Móntamela» ni «✨ Montar la semana sola».
- **H5** Dado el 4:20 abierto con PIN, cuando toco «Más de hoy» → «Hoy he ido», entonces «Tardes fuera · este mes: 1 de 3»
  pasa a «2 de 3»; con el 4:20 cerrado (o sin PIN) esa fila no existe. «Más de hoy» lleva además energía, anoche, hábitos y
  «El día como línea» (el Conductor).
- **H6** Dado un saliente, entonces «Ahora» propone «Siesta hasta 13:00» y Dormir «Siesta hasta 13:00 · cama 22:40»; nada en rojo.
## 2 · Dudas `[ACLARAR]` (se preguntan juntas; sin respuesta no se construye)
1. ¿Vale la maqueta? (a) sí, tal cual (recomendada) · (b) sí con cambios · (c) no.
2. El bus (Conductor) deja de ser la portada y va a «Más de hoy», y se quitan Estación, Reloj y Línea: (a) las dos cosas
   (recomendada) · (b) el bus a «Más de hoy» pero conservar los otros modos allí · (c) el bus sigue de portada.
3. Salir de casa: (a) un solo botón «He salido» (recomendada; «Tu mañana por tramos» deja de medir En pie y Vestido) ·
   (b) conservar los cuatro dentro de «Más de hoy». **Respuesta:** _(pendiente)_
## 3 · Dónde se toca (`app.js`)
- **Hoy de ahora:** `renderHoy` 8739-8804 (montaje: `diaNavHTML` 5773, `hoyAhoraHTML` 6405, `protHoyHTML` 12572, `hoyDiaHTML`
  6418, `uphSegHTML` 5593 = selector de 4 modos, `coachHTML` 8182, `pantHTML` 8202, `informeTocaHTML` 8467, `asistHoyHTML`
  20449, `habTiraHTML` 6411, `paraHoyHTML` 4977, `hoyBusHTML` 6750, `loQueVieneHTML` 9019). De viaje: `renderHoyViaje` 8324 (no se toca).
- **Día elegido:** `fechaHoy()` 5770 ya lee `ui.diaHoy`; `esHoyDeVerdad` 5904. La tira solo cambia `ui.diaHoy`.
- **Sueño:** `nocheCadena` 8657 (devuelve `obj` = cama de 8 h y `cama` = escalón); `nocheEscalon` 8699 (interruptor `adelanto`,
  encendido de serie, 1566: sin camas apuntadas da 00:30 → de ahí la cama 00:30); salida del Lloret en 8664
  (`casa=cama-margen`, `vete=casa-ida`); `lloretPlan` 8642 ya calcula con la cama de 8 h; `acostarsePara` 1577; `suenoCfg` 1558.
- **Mañana:** fichas «En pie · Vestido · He salido» 6173-6178; «He vuelto / He llegado» 6180-6184; acciones `manana-sali`
  28045, `noche-hoja` 27130; frase y energía: `hoyFraseAhora` 6392, `energiaHoy` 8149.
- **Entreno:** `entrenoDe` 9990, `entrenoSemana` 9907. **Menú por fecha:** `mSemana` 21134, `mCeldas` 21138.
- **Asistente «¿Me la propones?»:** `plmNuevo` 16406, `plmDiasProp` 16362, `plmReparto` 16407, `plmUsar` 16476, pantallas
  `plmPaso1/2` 16508/16547, acción `pl-montar` 27473, botón 16688. Ojo: trabaja por semana lunes-domingo (`sbLun` 2128,
  `cjeSemana` 15602) y solo de hoy al domingo. **Compra:** `compraDatos` 21818 (`total`, `marcados`).
- **Se retiran (S2):** botón `ss-auto` 14123 + acción 27392 (`sbAuto` 14057); chip `types-vista`/`auto` 21195 + su pantalla
  21416 (`menuAutoDia` 2496, `menuAutoSemana` 2541, `aplicarMenuAuto` 2545). `grep -n` antes de borrar cada función.
- **4:20:** `cnPin()` 12206, `ui.cnAbierto` (12254), `cnOculta` 12209. **Datos:** `normalize` 539. Modos: `hoyModo` 6104,
  `hoyBusVista` 6439, acción `hoy-modo` 27142. Dos switches: `act()` y el de `change`.
- **Pruebas que dependen del Hoy de ahora** (`tests/regression.test.js`, 19.036 líneas): `hoyModo` 86 menciones, bus 89,
  `hoy-modo` 20, «Lo que viene» 21, salir de casa 12, «Móntamela» 8. Es el riesgo de S5 (ver P7).
## 4 · Pasos (cada uno: primero su prueba encadenada con `await fijaHoy()`, que falle; luego el cambio; solo `--solo`)
- [ ] **P1 · S1** `planSemana(desde)` pura, junto a `nocheCadena`: 7 días desde hoy, cada uno `{key, tipo, tn, pie, cama,
  siesta, entreno, comidas, cocina}` con `dayInfo`+`nocheCadena(k,20*60).obj`+`entrenoDe`+`mCeldas`; sin pintar ni guardar.
  Prueba 687 (por `window.PG`). · general-purpose **sonnet** · ~30 pasos · ~0,6 M
- [ ] **P2 · S1** Cambio de cálculo en `nocheCadena` 8662-8664: cama, «En casa» y «Vete del Lloret» salen de `obj` (8 h); el
  escalón queda solo como sugerencia en Sueño. Prueba 688 (21:30 con Lloret → «Vete» 21:50); rehacer las de La Noche que
  esperaban el escalón. · mismo constructor que P1 · ~15 pasos · ~0,3 M
- [ ] **P3 · S3** `store.semana={asociTope:3, asociTardes:{fecha:1}}` en `normalize` 539 (filtrar claves y valores) +
  `asociMes()` + acción `asoci-hoy` (poner/quitar hoy) en `act()`. Sin pantalla todavía. Prueba 689. · sonnet · ~20 pasos · ~0,4 M
- [ ] **P4 · S2** Montar solo: `semanaMontaSiFalta()` llama a `plmNuevo()`+`plmUsar()` solo si la semana tiene huecos y sin
  pisar casillas puestas a mano; «Volver a montar» = acción nueva que lo fuerza. Si montar la semana siguiente (lun-mar)
  pide más de ~30 líneas, se deja con la plantilla del tipo de día y se dice. Prueba 690. · sonnet · ~25 pasos · ~0,5 M
- [ ] **P5 · S2** Retirar «✨ Móntamela» y «✨ Montar la semana sola» (lista de la parte 3) y sus pruebas; «¿Me la propones?»
  se queda en Comer. Cierra de paso `[v3-menu-no-machaca]`. Prueba 691 (los dos botones no existen). · sonnet · ~15 pasos · ~0,3 M
- [ ] **P6 · S5a** Hoy nuevo: el cuerpo actual de `renderHoy` pasa tal cual a `renderHoyLinea()` (`ui.hoyVista='linea'`,
  con «‹ Hoy»); `renderHoy` nuevo pinta tira + leyenda + «Ahora» (de `nocheCadena().g` y `hoyFraseAhora`) + 3 filas + compra
  + «Más de hoy», con `planSemana`. Hojas «Comer» y «Más de hoy» en el registro de hojas (9246-9258). CSS de la maqueta a
  `styles.css` con prefijo `.hs-`. Pruebas 692-696 (H1-H6). · general-purpose **sonnet** · ~60 pasos · ~1,3 M
- [ ] **P7 · S5b** Poner al día las pruebas viejas: las que conducen el bus entran por «Más de hoy» (un ayudante de prueba
  `abreLinea()`); según la duda 2 y 3, borrar las de Estación/Reloj/Línea y las de En pie/Vestido. · sonnet · ~50 pasos · ~1,0 M
- [ ] **P8 · cierre** `verificador`: capturas 412×915 de los 6 marcos con las frases de la parte 1 y medida de alto (≤915);
  `git fetch origin main`; suite completa; `npm run sella`; `main`; run en `success`; DECISIONS («cae con X revertido»). · ~0,4 M
**Total: ~4,8 M en 3 sesiones** (A: P1-P3 ~1,3 M · B: P4-P5 ~0,8 M · C: P6-P8 ~2,7 M). El Consejo calculó 3,0 M cuando La
Semana era una vista aparte; rehacer Hoy y sus pruebas lo sube. Presupuesto aprobado sin tope; se comparece si una pieza pasa un 25 %.
## 5 · Comprobación antes de construir
- Historia → paso → prueba: H1 P1+P6 (692) · H2 P6 (693) · H3 P2+P6 (688, 694) · H4 P4+P5+P6 (690, 691, 695) · H5 P3+P6
  (689, 696) · H6 P1+P6 (687, 692). Ningún paso sin historia (P7 y P8 son de «Terminado»). **Abierto:** las 3 dudas de la parte 2 → no se puede construir todavía. P7 cambia según las respuestas 2 y 3.
## Qué se añade, qué se quita y qué no se toca
- **Se añade:** `planSemana`, `store.semana`, `asociMes`, `semanaMontaSiFalta`, el Hoy nuevo y sus dos hojas, CSS `.hs-`.
- **Se quita:** «✨ Móntamela», «✨ Montar la semana sola» y su pantalla; el selector de modos de la portada; (según dudas)
  Estación, Reloj y Línea, y las fichas «En pie» y «Vestido». El escalón deja de mover la cama del plan.
- **No se toca:** ningún dato guardado (nada se borra de `localStorage`); `renderHoyViaje`; Sueño, Entreno, Comer y Compra por
  dentro; el motor del asistente; el informe; la cortina del 4:20; `sw.js`; los avisos `.ics`.
- **Supuestos:** sin PIN puesto, el contador de tardes fuera no sale · el tope es 3 al mes · la tira no pasa de 7 días · «＋» sigue siendo «Apuntar algo» (`dia-add` 26645).
