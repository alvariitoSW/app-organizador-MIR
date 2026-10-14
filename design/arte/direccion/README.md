# Dirección de arte · «La jornada»

Encargo: «sorpréndeme», iconos «con vida propia» y, sobre todo, **continuidad** (design/arte/continuidad.md): el
tiempo pasa, la energía se gasta y se recarga, lo que haces deja huella. Base del sistema: el informe
design/arte/auditoria/5-mas-y-comun/informe.md (apartado «Propuesta de base»).

## La idea en una frase

**La app es la jornada vista a través de una ventana: siempre es «ahora», la luz es la de la hora, y todo cuelga
de un mismo hilo de tiempo que no se corta.** El conductor y la carretera son el corazón; el resto de la app se
viste con su mismo mundo.

## Cinco reglas

1. **El cielo es el fondo.** El fondo de toda la app es el cielo de la hora real (el mismo degradado que el
   conductor: alba, día, tarde, anochecer, noche). Cambia solo, despacio. Los temas de color (Noche HUD, Papel,
   Arena, Bosque, Magenta) pasan a ser **tintes** sobre ese cielo, no fondos fijos. De guardia, el cielo se tiñe del
   rojo de la cabina de guardia.
2. **El hilo.** Arriba, en todas las secciones, una línea fina de 24 h (el «hilo»): lo hecho deja **huella**
   (trazo sólido con su color: trabajo, comida, entreno, sueño), lo que viene va en **punteado**, y un punto que
   late marca el ahora. A medianoche el hilo continúa en el día siguiente (sin corte).
3. **La energía.** Un depósito pequeño y vivo junto al hilo (no una cifra): se vacía con lo que gasta (trabajo,
   guardia, cocinar, entrenar) y se llena con lo que recarga (dormir, comer bien, descansar). En las maquetas es
   ilustrativo; el cálculo se decide después con el usuario.
4. **Material: piezas de maqueta.** Las tarjetas dejan de ser cristal genérico: son **piezas** del mismo mundo
   isométrico (un borde superior con luz, una cara lateral más oscura de 3 px, sombra que cae según la hora del
   sol). Pocas formas: esquinas 4 · 8 · 12 · 16 · 24 · redondo. Letra con escala corta: 11 · 12,5 · 14 · 16 · 20 ·
   28 · 44; pesos 500 · 700 · 800 (no todo en negrita); cifras tabulares.
5. **Iconos vivos.** Un juego propio de iconos de línea (rejilla 24, trazo 1,75, `currentColor` + relleno suave de
   la marca) pintados por una sola función `ico(nombre, estado)`. Se mueven **solo cuando cambia algo** (salvo
   «estás de guardia», que late despacio), quietos con «movimiento reducido», siempre con su texto. Los emojis de
   comida se quedan (son datos).

## Lo que se mide antes de dar algo por bueno

- 412×915, nada tocable por debajo de 44 px, nada de texto por debajo de 11 px.
- Contraste AA en los 5 tintes y en las 5 luces del día (alba, día, tarde, anochecer, noche).
- Sin librerías ni build: SVG y CSS a mano, como el resto de la app.
