# Ficha · v3-hoy-rediseno (Hoy en tres bloques)

Maqueta aprobada (18/11): **B · Tres bloques** — lienzo https://claude.ai/artifact/Bj5qKScwaUcz29YGVsysbt,
copia en `maquetas/hoy-tres-bloques.dc.html`. Objetivo confirmado por el usuario:
«Al abrir Hoy, sin bajar, ves: 1) qué toca ahora y hasta cuándo, 2) la noche (a qué hora irte, la cama y el
despertador) y 3) Para hoy. Debajo, sin nada repetido: lo que comes hoy (kcal y proteína) y el entreno si toca,
con un toque para empezar. Lo demás (energía y coach, Lo que viene, ¿cómo amaneces?) más abajo o plegado.»
Solo queda el modo Conductor, con su dibujo reducido a una franja.

## 1. Qué y para qué
- H1 (lo mínimo) · Dado hoy a las 21:00 de un día de trabajo, cuando abro Hoy a 412×915, entonces antes de y=850
  veo tres tarjetas en este orden: «Ahora» (qué toca y hasta cuándo, con la carretera ~90 px), «La noche» (cartel
  vete / casa / cama / despertador) y «Para hoy».
- H2 · Dado Hoy, entonces no sale el selector de modos (Conductor/Estación/Reloj/Línea) y no se repite nada:
  «Ahora» una vez, «Para hoy» una vez, la cena «sin apuntar» una vez.
- H3 · Dado Hoy, debajo de los tres bloques veo Comer («N de M kcal · N de M g proteína», próxima comida con
  «apúntala») y Entreno («Hoy toca X · Empezar» o «Hoy no toca») lado a lado; tocar Empezar abre el entreno.
- H4 · Energía y coach, Lo que viene y ¿Cómo amaneces? salen como filas de una línea plegadas; al tocar una se
  despliega su contenido de siempre.
- H5 · Víspera y saliente siguen diciendo lo suyo («Mañana guardia · a la cama HH:MM», «Saliente · hasta 8»).

## 2. Dudas — ninguna abierta (resueltas con el usuario el 18/11).

## 3. Dónde se toca (`app.js`)
- `renderHoy` 8739 (montaje en 8763-8805): `uphCorto`, `hoyAhoraHTML` 6405, `protHoyHTML` 12463, `hoyDiaHTML` 6418,
  `uphSegHTML` 5593 (selector, se quita de Hoy), `paraHoyHTML` 4978, `habTiraHTML`, `hoybusfuera`+`hoyBusHTML` 6750
  (dibujo grande: fuera de hoy-hoy; la carretera nueva es una franja propia), `coachHTML` 8182, `loQueVieneHTML` 9019.
- La noche: `nocheHTML` 6162 (cartel y fila 🏠›🛌›⏰; el «¿cómo amaneces?» 6214 va plegado).
- Modos: `hoyModo` 6104 (clave `guardias-hoymodo2`), `hoyBusVista` 6439, acción `hoy-modo` 27028.
- **Trampa:** la suite arranca en el modo reloj (`tests/regression.test.js:52`, init script con `guardias-hoymodo2`)
  y ~110 líneas de pruebas usan reloj/línea/estación. Decisión: el usuario ya no puede elegir modo (sin selector,
  y `hoyModo()` deja de leer la clave vieja: usa `guardias-hoymodo3`, que solo ponen las pruebas); la línea 52
  pasa a escribir `guardias-hoymodo3`. El código de reloj/línea/estación se queda hasta una tarea de limpieza
  aparte ([v3-hoy-limpia-modos]) que lo quite con sus pruebas.
- CSS: `styles.css` (tarjetas `.card`, `.hoybus*`); el bloque `@media(max-width:560px)` va encima de las bases.
- Pruebas parecidas: 275 (conductor), las de «uph»/P1 Hoy. Nuevas desde **700**.

## 4. Pasos
- [x] P1 Pruebas 700-704 encadenadas (H1-H5) con `await fijaHoy()` a las 21:00, que fallen hoy · tests/regression.test.js · general-purpose sonnet · ~15
- [x] P2 Clave de modo nueva + init de la suite · app.js:hoyModo, tests:52 · mismo · ~5
- [x] P3 Tres tarjetas Ahora / La noche / Para hoy en `renderHoy` cuando esHoy y modo bus; sin selector; sin dibujo grande; franja-carretera ~90 px con las paradas del día (reutilizar datos de `hoyBusDatos` 6450) · app.js, styles.css · mismo · ~40
- [x] P4 Comer + Entreno en dos columnas (reutilizar `foodTotals`/`planTotalsOf`, `protHoyHTML`, `entrenoContadorHTML`) · mismo · ~20
- [x] P5 Filas plegadas (energía y coach, Lo que viene, ¿cómo amaneces?) con `<details>` · mismo · ~10
- [ ] P6 Capturas 412×915 normal/víspera/saliente · verificador sonnet · ~15
- [ ] P7 DECISIONS, suite completa, sella, main, gasto · principal

## 5. Comprobación
H1→P3/700 · H2→P2,P3/701 · H3→P4/702 · H4→P5/703 · H5→P3/704. Maqueta aprobada antes de obra ✓; 412×915 ✓;
cada prueba debe caer al revertir su paso ✓. Presupuesto: ~1,2 M de obra (sin medida previa de este tipo de rediseño).
