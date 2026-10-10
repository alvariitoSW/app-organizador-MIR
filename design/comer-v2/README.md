# Maquetas: Comer v2, una app de comida dentro de la app

Ocho pantallas a 390 px. **Son maquetas, no la app.** Vienen del informe «Comer, versión nueva»:
la receta pasa a ser la única verdad, y de ella salen la semana, la compra, lo cocinado, la nevera
y lo apuntado. Cinco pestañas: Hoy · Cocinar · Recetas · Nevera · Semana.

| archivo | pantalla | alto |
|---|---|---|
| `Main.dc.html` | ficha de receta: etiquetas, macros por ración, raciones, qué hay en casa y qué falta, pasos | 1240 px |
| `Cocina.dc.html` | modo cocina: un paso por pantalla, temporizador, lo que usas en ese paso | 844 px |
| `CocinaFin.dc.html` | al terminar: repartir las raciones entre ahora, nevera y congelador; lo que sale de la nevera | 844 px |
| `Nevera.dc.html` | nevera con cantidades: lo que caduca y la receta que lo gasta, tápers, «con lo que tienes», a ojo hay/poco/no | 1300 px |
| `Hoy.dc.html` | seguimiento del día: kcal y P/H/G frente al objetivo, lo que queda, la frase, las tres comidas, 7 días | 1260 px |
| `Buscar.dc.html` | buscador: destino a la vista, filtros, resultados agrupados con «+» de un toque | 1040 px |
| `Alimento.dc.html` | ficha de alimento: cantidad, macros, de dónde salen las kcal, micros frente a un día | 1060 px |
| `Semana.dc.html` | la semana real con la rotación: comida y cena por día, de qué táper sale, kcal frente al objetivo, cuándo se cocina | 1420 px |

## Qué datos son reales

- Las recetas (lentejas 470 kcal · 26 g P para 4 con sus pasos, pollo al curry 520 · 34, salmón
  al horno 540 · 36), el desayuno fijo (401 kcal · 22 g P), el salmón de la tabla (208 kcal por
  100 g, 20 g P, 13 g G, vitamina D 11 µg, B12 3,2 µg) y el objetivo de 2.166 kcal salen de la app.
- La rotación de la semana (12 y 15 guardia, 13 y 16 saliente) es la del Mes.
- Son de ejemplo: lo comido en los últimos 7 días, el objetivo de 130 g de proteína y los de
  hidratos y grasa, y las cantidades de la nevera. Lo que no se sabe va entre corchetes.

## Cómo se abren

`canvas.json` es el lienzo (dos filas: cocinar arriba; seguimiento, alimentos y semana abajo). Los
`.dc.html` son el formato del lienzo de diseño de claude.ai y llaman a `./support.js`, que pone el
editor: fuera de él se ven sin estilos de editor pero con todo su contenido.
