# Informe · cómo se apunta el sueño (ingeniería inversa, 27-10-2026)

Encargo: «me falla cuando le pulso para añadir las horas de sueño y está como medio escondido».
Método: skill `ingenieria-reversa` + **REA** (`rea-agents` 6.8.0, de github.com/morluto/rea, etiqueta
`rea-agents-6.8.0`, instalado solo en la carpeta temporal de la sesión, fuera del repositorio) + conducir
la app a 412×915 con toques de dedo (Playwright con pantalla táctil).
Cada punto lleva **visto** (archivo:línea o medida), **deducido** o **desconocido**.

## 1. El camino para apuntar lo dormido (antes del arreglo)

1. Hoy abre en la vista **Conductor** (un dibujo SVG del autobús). Lo del sueño es solo una «radio»
   pequeña en el salpicadero con «📻 RADIO SUEÑO · anoche: sin apuntar · toca para oírla».
   **Visto**: `fig/conductor.js:276-279`; en pantalla, una caja de 89×58 px abajo a la derecha.
2. Tocar la radio abre un panel encima del salpicadero. **Visto**: `fig/conductor.js:1156`
   (`radio = !radio`) y `:818` (lo enseña).
3. Dentro del panel, lo único que lleva a anotar es la pastilla «abrir Sueño ›». **Visto**:
   `fig/conductor.js:300` (`data-o="sueno"`) y `:1151`, que llama a `onAbrir({tipo:'anotar'})`.
   Mide **81×16 px** en el móvil (medido).
4. `hoyBusAbrir` → `act('sn-hoja')` → la hoja «Anoche» con las dos horas y «Guardar».
   **Visto**: `app.js:5784`, `app.js:24653`, `suenoHojaHTML` en `app.js:6861`, `snTGuardar` en `app.js:6925`.

REA (análisis estático de `fig/conductor.js`, 23 006 nodos, 0 fallos de lectura) confirma la entrada
de los toques: los `addEventListener` de `pointerdown/move/up/cancel` en `conductor.js:1137-1146`, que
buscan el `[data-o]` más cercano (`target.closest`, `:1137`) y llaman a `onAbrir` (`:1136`). **Visto**.

## 2. Por qué fallaba

- **Medio escondido.** Con la página arriba del todo, el panel de la radio acaba en y=912 px y la barra
  de abajo (Calendario · Entreno · Comer · Más) empieza en y=850: **62 px del panel quedan debajo de la
  barra** (la fila de ánimo y la de intención). **Visto** (medido a 412×915, captura).
- **«Me falla al pulsar».** La frase grande del panel decía «Anoche: sin apuntar · toca «abrir Sueño»»,
  pero tocar esa frase **no hacía nada**. Solo abría la hoja la pastilla de 81×16 px. Con el dedo 9-12 px
  por encima del centro, la hoja no se abría. **Visto** (toques simulados). Que en el móvil se fallara
  así es **deducido**: un dedo cubre de 7 a 10 mm, más que los 16 px de alto de la pastilla.
- Una vez abierta la hoja, cambiar las horas y guardar **sí funcionaba**: 23:15 → 06:45 guardó 7 h 30.
  **Visto**.

## 3. Lo que se cambió (`fig/conductor.js`)

1. **Toda la pantalla verde de la radio** (la frase grande y la línea de debajo) lleva a Sueño, igual
   que la pastilla: a anotar si falta la noche, a la pantalla de Sueño si ya está. Los botones de café
   siguen siendo suyos.
2. Al abrir la radio, **la página baja lo justo para que se vea entera** por encima de la barra
   (medido: el panel acaba en 842 px y la barra empieza en 850). Sin animación si el móvil pide movimiento reducido.
3. La pista de la radio cerrada dice **«toca para apuntar»** cuando falta la noche («toca para oírla»
   cuando ya está), y la frase grande dice «Anoche: sin apuntar · toca aquí para apuntarla».

Prueba 329 en `tests/regression.test.js`: abre la radio, comprueba que se ve entera, toca la frase
grande, cambia las dos horas y guarda. Con el arreglo quitado cae ella sola (panel en 912 frente a la
barra en 850, y la hoja no se abre).

## 4. Límites

- REA no terminó con `app.js` (27 000 líneas). Corta cada archivo a los 5 min
  (`provider_timeout`, 300 000 ms). Lo de `app.js` se leyó a mano y conduciendo la app. **Visto**.
- Las otras vistas de Hoy (Estación, Reloj, Línea) no se revisaron en esta tanda. **Desconocido**
  si tienen el mismo problema.
- No se probó en un móvil de verdad, solo en Chromium con pantalla táctil simulada a 412×915.
