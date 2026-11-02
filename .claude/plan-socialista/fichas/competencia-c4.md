# Ficha · La Competencia · C4 Mes (guardias, pegar el planning, «‹ Ajustes»)

## Qué y para qué
- Dado el Mes, cuando miro las guardias, entonces una sola frase: «Guardias de noviembre: 2 hechas · 3 por hacer · 5 en total» (con 0, el porqué y «Poner mis guardias»).
- Dado Importar mi planning, cuando toco «Pegar lo copiado», entonces el cuadrante copiado abre la vista previa de siempre; si el móvil no deja, la caja de texto ya está abierta y con el cursor.
- Dado Ajustes, cuando abro una pantalla, entonces un único «‹ Ajustes» a la vista.
- Dado el tema claro, entonces «20 Urg» y «12 UMI» ≥4,5:1.

## Dónde se toca
- app.js: `mesAbono` (+porHacer, total), `mesCarneHTML`/`mesAbonoHTML` (cupo), `mesGuardiasCuentaTxt`, `mesGuardiasLineaHTML`, `mesGuardiasHTML`, `renderMonth`; `planningAnaliza`, `planningVistaPrevia`, `planningPegar`, acciones `draft` y `plan-pegar` (solo en `act()`); `renderData` (planning); `navTras`.
- styles.css: `.mesgl`, `.pegar-copiado`, `.r1p` en claro.
- Pruebas 490-496.

## Añade
Frase única de guardias; «Poner mis guardias»; «Pegar lo copiado»; `planningVistaPrevia(texto)` para C4b.

## Quita
El «hechas/cupo» del carné y el «N hecha de M» de la hoja del mes; el «‹ atrás» de la cabecera dentro de las pantallas de Ajustes.

## No toca
Color por tipo de día, horas en la casilla, guardia + saliente de una vez, motor de rotación, importar .ics, `.dline` (excepción de C1), cabecera plegada y pincel de la maqueta.

## Frases para el verificador
«Guardias de noviembre: 2 hechas · 3 por hacer · 5 en total», «Marca 0 porque tu semana está en modo plantilla», «Poner mis guardias», «Pegar lo copiado», «‹ Ajustes» (y sin «‹ atrás» arriba), «CUPO».

## Pasos
- [x] P1 pruebas 490-496 · [x] P2 Mes · [x] P3 pegar · [x] P4 Ajustes · [x] P5 contraste claro · [x] P6 viejas (277)
