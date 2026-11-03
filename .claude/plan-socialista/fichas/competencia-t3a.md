# Ficha · La Competencia · T3a Caja de frase (C7·b)

## Qué y para qué
- Dado Hoy, cuando toco «Apuntar algo…» y escribo «cena con Lucía el jueves a las 21», entonces veo Qué/Día/Hora/Tipo y, al «Guardar», queda un evento ese jueves a las 21:00.
- Dado una frase que no entiendo (sin día, «el otro jueves», dos días), entonces lo digo y no guardo hasta que elija el día.
- Dado un día con guardia, entonces aviso («Ese día tienes…») con «Otro día» / «Guardar igual». «guardia el 14» no se apunta aquí.

## Dónde se toca
- app.js: `fraseApuntarLee`, `fraseCajaHTML`, `fraseGuarda`, `fraseAct` (junto a `diaNavHTML`, que la pinta); `act()` (casos `frase-*`), listener `input` de `#fraseTxt`, `keydown` Enter; `window.PG.fraseApuntarLee`.
- styles.css: `.frase0`, `.frase`, `.frase .prev/.ln/.u/.duda` (con `--t-*` y `--toque`).
- Pruebas 570-577.

## Añade
Línea plegada bajo las flechas; caja con vista previa; lector de frases sin librería; aviso de guardia.

## Quita
Nada.

## No toca
La hoja del día, la pantalla de Eventos y Notas, las guardias, las flechas de día (T2c), Ajustes → Mi planning.

## Frases para el verificador
«Apuntar algo…», «Ver cómo lo entiendo», «Qué», «Día», «Hora», «Tipo», «cambiar», «Guardar», «Borrar», «Ese día tienes», «Guardar igual», «Otro día», «No sé qué día es».

## Pasos
- [x] P1 pruebas 570-577 · tests/regression.test.js
- [x] P2 lector + caja + acciones
- [x] P3 CSS
- [x] P4 prueba vieja 480 ajustada (el cartel «Ahora» baja 57 px)
