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
