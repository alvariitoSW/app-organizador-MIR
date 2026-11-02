# C1 · Letra y calma (La Competencia, fase 1)

**Qué y para qué.** Que la letra no cueste leer en el móvil y que Hoy no apile avisos.
- Dado Hoy, Mes, Comer o Dinero a 412 px, cuando se mide el texto visible, entonces nada baja de 13 px (Dinero 14), salvo casillas del Mes, línea del día, SVG y franjas de guardia/saliente/conducir.
- Dado modo plantilla + copia + «Tu semana pasada» a la vez, entonces sale uno; «Ahora no» lo aparta 14 días y sale el siguiente.
- Dado el tema oscuro, entonces «ahorras» es #4ade80 y «Apuntar gasto grande» es una tarjeta oscura con borde cian.

**Decidido por el usuario:** suelo 13 (Dinero 14); cola de uno en uno con «Ahora no» = 14 días (regla `asist-sil`); contraste en oscuro.

**Dónde se toca.** `tools/suelo-letra.mjs` (nuevo, repetible); `styles.css` (`--t-13`, `--suelo`, regla `body[data-tab="dinero"]`, `small`); `app.js`: `avisoCola()`/`ahoraNoBtn()` junto a `modoAvisoHTML`, `paraHoyItems` (copia y conflicto de entreno), `informeTocaHTML`, `nocheSugHTML`, `asistHoyHTML`, `asistTjHTML` (× → «Ahora no»). Pruebas 470-474.

## Añade
- La pila de avisos de mantenimiento: un solo aviso a la vez, en el orden modo plantilla › copia › cierra el mes › hábitos › conflicto de entreno › cama «Vale, 23:15» › Tu semana pasada › dinero › 4:20.
- «Ahora no» visible en cada uno (14 días). El script del suelo y la variable `--suelo`.
## Quita
- Los tamaños sueltos por debajo de 13 px; la × del asistente (ahora «Ahora no»); la tarjeta clara de «Apuntar gasto grande» en oscuro; las tarjetas plegadas de dinero y 4:20 en Hoy.
## No toca
- Los avisos de protección (guardia, saliente, no conducir, choque, sin pantallas, 4:20 «mañana guardia»), casillas del Mes, `fig/`, línea del día, SVG, la cadena de Hoy, la cara de la app, «Vale, 23:15» (solo entra en la cola).

**Frases para el verificador:** «Ahora no», «ahorras».

- [x] P1 script · [x] P2 cola · [x] P3 contraste · [x] P4 pruebas 470-474 · [x] P5 suite y capturas
