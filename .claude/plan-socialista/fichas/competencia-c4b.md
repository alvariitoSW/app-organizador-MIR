# Ficha · La Competencia · C4b Foto del cuadrante

## Qué y para qué
- Dado Importar planning, cuando toco «📷 Foto del cuadrante», entonces veo «Hacer foto» (56 px, con cámara), «Elegir de la galería» y «La foto no sale de tu móvil».
- Dada una foto, cuando se lee en el móvil (`ocrListo`, `vendor/ocr`), entonces veo «Leídos N días · M dudas»; la primera vez toco mi nombre en la cabecera y se recuerda.
- Dada una duda (celda ilegible), cuando la toco, entonces veo «Así sale en tu foto» y Guardia / Saliente / Trabajo / Libre / «Dejarlo como estaba»; sin elegir, se queda como estaba y se avisa.
- Cuando toco «Ver qué cambia», entonces se abre la vista previa de C4 (`planningVistaPrevia`) y la foto se suelta.

## Dónde se toca
- app.js: `fotoVista`, `fotoAnaliza`, `fotoCuenta`, `fotoSigue`, `fotoLee/fotoLeeReal`, `fotoElegida`, `fotoPintaCortes`, `fotoTexto`, `fotoSuelta` (y en `render()` se suelta si sales); `renderData` (vista `planfoto`); acciones `foto-*` en `act()` y `foto-cuad` en el switch de `change`.
- styles.css: `.foto-pant`, `.foto-btn`, `.foto-duda`, `.foto-fila`, `.foto-op`, `.foto-corte`, `.foto-barra`.
- Pruebas 520-529.

## Añade
Botón en Importar planning, pantalla de foto, lectura con avance y «Cancelar», nombre recordado (`store.planFoto.nombre`, solo cómo se escribe), hoja de dudas con recorte desde la memoria.

## Quita
Nada.

## No toca
Importar texto y .ics, «Pegar lo copiado», `sw.js`. Ni la foto ni sus textos van a `store`, localStorage ni red.

## Frases para el verificador
«📷 Foto del cuadrante», «Hacer foto», «Elegir de la galería», «La foto no sale de tu móvil», «¿Cuál eres tú?», «Leídos 7 días · 3 dudas», «Así sale en tu foto», «Dejarlo como estaba», «Ver qué cambia», «2 días sin cambiar».

## Pasos
- [x] P1 pruebas 520-529 (528 = única con el lector real) · tests/regression.test.js
- [x] P2 pantalla, lectura, nombre, dudas, vista previa
- [x] P3 viejas: 54, 491-495 en verde
