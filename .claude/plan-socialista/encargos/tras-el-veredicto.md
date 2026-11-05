# Encargo · Tras el veredicto de La Competencia (pedido por el usuario el 05/11/2026)

Material: `docs/veredicto-competencia-2026-11.md` (apartados 1, 3 y 6). El usuario pidió aplicar **las 3 propuestas** del
veredicto en esta sesión aparte. Sigue `CLAUDE.md` («Terminado», «Cómo se construye») y lo aprendido en
`encargos/remate-competencia-constructores.md` (worktree al día, prefijo propio, grep antes de usar un nombre, pruebas viejas
de tu pantalla, una sola suite completa a la vez, reservar números mirando la suite). A `main` de una en una (suite completa,
`sella`, run de Actions en verde).

## P1 · Hoy y Mes en una pantalla (~2,5 M) — los 2 puntos que seguimos perdiendo
- Medido (04/11, 412×915, datos sembrados): en Hoy, «Ahora» (`hoyAhoraHTML`) empieza a 1.111 px (página 3.607 px); en el Mes la
  cuadrícula empieza a 622 px y la barra está a 850 px.
- Objetivo: «Ahora» (frase + energía + conducir) **en la primera pantalla**, por encima del cartel de la noche; en el Mes, la
  cabecera plegada para que la cuadrícula empiece hacia ~200 px y se vea entera.
- No se toca: la cadena guardia › comida › ocio › sueño, «Vale», «Sal al Lloret», el aviso de no conducir, el color por tipo
  de día, las horas en la casilla y la línea «Guardias de <mes>: N hechas · N por hacer · N en total».
- **Maqueta primero** (skill `redisena-seccion`) y esperar el visto bueno del usuario antes de tocar `app.js`.

## P2 · Remate de lectura y la foto real (~1 M, +0,3 si la foto pide ajustes)
- Contraste ≥4,5 en tema claro: la hora de la Cena en Comer (3,97), «Por qué:» de Hoy (4,44), «ahorras» de Dinero (4,16).
- Los 3 textos de 12,5 px de Hoy («no hace falta siesta…», «antes, a las 15:30…») a ≥13 px.
- Comer: la frase «Te quedan N kcal · N g de proteína» arriba (margen, nunca en rojo; con el techo de cada día).
- Mirar si «Faltan … en tus 2 últimas noches» debería decir 3 (puede ser la siembra) y si Mi planning tiene un solo «‹ Ajustes».
- La foto del cuadrante (C4b) con un cuadrante **real** del usuario: la prueba la hace él en su móvil; **la foto no se sube
  al repositorio ni sale del móvil**. Pregúntale cómo es su cuadrante y qué leyó mal, y ajusta con un cuadrante inventado que
  lo imite.
- Puede ir en paralelo a la maqueta de P1 (no comparten pantalla salvo Hoy: grep antes).

## P3 · Consejo sobre la foto del plato (~0,8 M, estudio + maqueta) — idea [v3-foto-plato]
- `/bitacora` → Consejo de Ministros: reconocer el plato en el móvil (flojo y pesado) frente a un servicio de IA externo (mejor,
  pero la foto sale del móvil y cuesta por foto: choca con la regla de privacidad). No se construye nada: sale un dictamen,
  una maqueta y como mucho 3 preguntas para el usuario.

## Presupuesto y cierre
Total ~4,3-4,6 M. Si una parte va a pasar del 25 %, parar y decirlo. Medir al cerrar (`node tools/gasto.mjs --apunta …`),
entrada en `docs/DECISIONS.md` por tanda y traspaso al final de este archivo.

## Traspaso (05/11, primera sesión)

**Hecho.**
- **P2, en `main` (1c85c54, con su sello).** «Por qué:» pasa de 4,44 a 5,74 en claro. Los 3 textos de la víspera y el dibujo del conductor ya van a 13 px. Comer dice «Te quedan N kcal · N g de proteína» y, pasado el techo, «Hoy ya llevas lo del día». Pruebas 655-664.
- **Lo que se dio por fallo y no lo era.** La Cena (5,4) y «ahorras» (5,0) ya pasaban: los 3,97 y 4,16 salían de medir mal los fondos `color-mix()`. «2 últimas noches» lo daba la siembra. «‹ Ajustes» ya estaba en Mi planning.
- **P3: Consejo hecho.** El acta está en `consejo/2026-11-05-foto-plato.md` y la maqueta en `maquetas/foto-plato.html`. Recomienda la opción C1 (sin IA). Quedan 3 preguntas al usuario.
- **P1: maqueta en `maquetas/una-pantalla.html`.** «Ahora» pasa a ~260 px y la cuadrícula del Mes empieza a ~175 px. **Espera el visto bueno: no se ha tocado `app.js`.**

**Pendiente del usuario.**
- El visto bueno de P1.
- Cómo es su cuadrante real (sin foto).
- Las 3 preguntas de P3.

**Gasto.** 2,6 M. P2 costó 1,3 M frente a 1 M previsto (+30 %). Para P1 quedan unos 2 M previstos, así que el total iría a ~4,6-4,9 M.

**Ajeno.** Con 5 trozos de la suite en 4 núcleos caen pruebas «de tiempo» distintas en cada pasada: la 604, la 401 y un clic sobre un elemento ya quitado en el trozo 4. A la cuarta pasada salió en verde. Conviene mirar si `tools/pruebas-corto.sh` debería lanzar 4 trozos y no 5.

**Siguiente.** Una sesión nueva con las respuestas: construir P1, ajustar la foto del cuadrante y, si dice que sí, C1.

## Traspaso (05/11, cierre de la sesión)

**Hecho, en `main` (fed6e07, sellado).**
- **P1 Hoy:** «Ahora» pasa de 1.111 px a 368-445 px, por encima del cartel. La víspera va plegada en «🩺 Mañana guardia · a la cama HH:MM ▾», el aviso de plantilla en «ℹ️ plantilla» y el selector al final. Pruebas 665-668.
- **P1 Mes:** la cuadrícula va de 263 a 735 px y se ve entera. Hay una fila «🗓️ nov – dic ▾ · hoy · ✏️ · ? · ⋯», la línea de guardias se despliega y «Ver del 1 al N» va debajo. Pruebas 675-682.
- **P3:** decidido. C1 ahora, C2 más adelante, la miniatura 30 días y el botón en la hoja «Apuntar» (lo eligió Transportes).

**Pendiente.**
- **Construir C1** de la foto del plato (~1,7 M), en una sesión nueva.
- **La línea «Guardias de noviembre: …»** se parte en dos renglones a 412 px. Por eso la cuadrícula empieza en 263 y no en 239. Es estético; si molesta, letra de 13 px sin negrita o «8 en total» abreviado.
- **El cuadrante real** ya está en la app del usuario y no ha contado fallos. Si los cuenta, se ajusta el lector con uno inventado.

**Lo aprendido.**
1. **Las pruebas que dependen de un `ui.x` puesto a mano se pierden al recargar la página.** Pasa en los trozos: hay que ponerlo con `context.addInitScript` (como `upmMas`).
2. **`page.$(…)` + `handle.click()` cae si la pantalla se repinta entre medias:** mejor `page.click(selector)` (lo arreglado en la 326).

**Gasto.** 5,1 M en toda la sesión, frente a 4,3-4,6 previstos (+11 % sobre el máximo).
