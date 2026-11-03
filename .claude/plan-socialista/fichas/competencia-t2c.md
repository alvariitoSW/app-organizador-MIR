# Ficha · La Competencia · T2c Flechas de día

## Qué y para qué
- Dado Hoy (conductor, reloj o línea), cuando toco «mié ›» (56 px), entonces veo mañana y el centro dice «volver a hoy»; «‹ lun» va al día anterior.
- Dado «De viaje», cuando toco la flecha, entonces veo un día normal; «volver a hoy» devuelve a lo esencial.
- Sin deslizar con el dedo y sin «+» flotante.

## Dónde se toca
- app.js: `diaNavHTML` (nueva), `renderHoy`, `renderHoyViaje`; reutiliza `ui.diaHoy`, `moverDiaHoy`, acciones `dia-prev/dia-next/dia-hoy`.
- styles.css: `#main .diasnav2`.
- Pruebas 560-564.

## Añade
Fila de flechas de 56 px encima de la tarjeta, también en «De viaje».

## Quita
Los botones ‹ / volver a hoy / › de dentro de la tarjeta.

## No toca
`ui.diaHoy`, las flechas de la barra de arriba, el reloj, la línea, el conductor.

## Frases para el verificador
«‹ mar», «Hoy · mié», «jue ›», «volver a hoy», «MAÑANA».

## Pasos
- [x] P1 pruebas 560-564 · [x] P2 diaNavHTML + CSS · [x] P3 viejas de Hoy
