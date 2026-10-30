# El Chef · CH1-CH11 · recetario sin gluten, semana, modo cocina y compra

Tipo `datos` + `construir` · presupuesto ~10 M (El Chef I CH1-CH8 ~6,9 M · El Chef II CH9-CH11 ~2,7 M) · 2026-10-30
Acta `consejo/2026-10-30-chef.md` · maqueta `maquetas/recetario.html` · delegación en `gobierno.md`.

## 1 · Qué y para qué
1. Dado que soy celíaco, cuando abro el recetario, entonces cada plato llega entero (gramos, pasos, kcal, proteína,
   días que aguanta) y sin gluten; lo que depende de la marca sale en ámbar con qué mirar en la etiqueta. (CH1, CH4, CH5, CH9)
2. Dada mi cocina de hoy (micro + vitro pequeña), cuando miro un plato, entonces sé si puedo hacerlo, o cómo se adapta;
   y si gano horno, la app se ajusta sola sin perder nada. (CH1, CH5, CH10)
3. Dada una receta, cuando toco «A la compra», entonces va a la compra de la semana por pasillos y sin gluten. (CH2)
4. Dado que cocino, cuando abro el modo cocina, entonces tengo temporizadores por paso, pantalla encendida, «tenlo a mano»,
   el por qué y el error típico plegables, y la conservación. (CH3, CH6)
5. Dada mi semana, cuando la monto, entonces usa el recetario con las reglas de Sanidad, 1 fuego / ≤6 raciones por olla,
   el táper de la guardia y «Estoy reventado». (CH7)
6. Dada una receta de TikTok con gluten, cuando la importo, entonces sale cambiada y se ve («Cambiado: …», deshacer),
   con «Mis marcas seguras». (CH8)

## 2 · Dudas (resueltas por el usuario el 30/10: «apruebo absolutamente todo»)
- Presupuesto y quién decide → **1 (a)** ~10 M, el Consejo decide la maqueta CH3 y pasar a `main`.
- TikTok y marcas → **2 (a)** cambio automático visible con deshacer + «Mis marcas seguras».
- Táper de guardia → **3 (a)** la semana reserva siempre una ración de tanda.

## 3 · Dónde se toca
- `app.js`: `TP_RECETAS` (~14631, tupla [n, e, alias, m, min, ing por ración, pasos, duda]), `tpLeer` (~14809),
  `glutenDe` (~2717), `ALIMENTOS` (~2833) / `ALIMENTOS_MAS` (~2934), `cocinaPref` (~14397), `platoConHorno`, `plmCands` /
  `plmApta`, `compraDatos0`, `renderFoodCocina`, `parseReceta` / `impGuardar`. Dos switches: `act()` y el de `change`.
- Datos: `data/recetario.json` (esquema dentro, campo `esquema`) · `sw.js` `BASE` + `CACHE` en la CH5.
- Pruebas: `tests/recetario.test.js` (node, sin navegador; lee tabla, `glutenDe` y `TP_RECETAS` de app.js con
  `tools/recetario-tabla.js`) · `tools/recetario-faltan.js` (los alimentos que faltan, con plantilla).
- Catálogo: `maquetas/recetario.html`, array `P` = [n, región, tipo, min, tanda, cambio, equipo, fiesta, adaptación].

## 4 · Pasos
- [x] CH1 Ficha, esquema + fabada, `tests/recetario.test.js`, `tools/recetario-faltan.js` + 11 alimentos, catálogo
      corregido (Sanidad) y ampliado (Italia 46, Grecia 28, Mediterráneo 21) con equipo · yo · ~0,7 M
- [ ] CH2 «A la compra» desde la receta → compra de la semana · app.js `rec-compra` → `compraDatos0` · sonnet · ~0,9 M
- [ ] CH3 Maqueta corta (modo cocina, «Tu cocina», filtro Cocina, «Estoy reventado», «Cambiado») · opus + sonnet · ~0,6 M
- [ ] CH4 ~60 platos enteros para micro + vitro (tanda y táper, legumbre, pescado, cenas de saliente), cada lote con
      `node tests/recetario.test.js` en verde y `node tools/recetario-faltan.js` vacío · sonnet (+ haiku) · ~0,6 M
- [ ] CH5 Recetario navegable: JSON perezoso en `sw.js`, filtros, «Tu cocina» ampliando `cocinaPref` · sonnet · ~0,9 M
- [ ] CH6 Modo cocina: `ui.cocinaTmp`, Wake Lock, plegables, conservación · sonnet · ~0,9 M
- [ ] CH7 Semana: `plmCands` + reglas de Sanidad + ollas + táper + «Estoy reventado» · sonnet · ~0,9 M
- [ ] CH8 TikTok sin gluten + «Mis marcas seguras» + `esc()` y prueba `<img onerror>` · sonnet · ~0,9 M → `main` (El Chef I)
- [ ] CH9 Resto del catálogo entero (~280), por lotes · sonnet ×5 · ~1,5 M
- [ ] CH10 Ruta de 8 técnicas + «Ahora puedes hacer N platos más» · sonnet · ~0,6 M
- [ ] CH11 Cierre: verificador 412×915, suite, sella, `main`, Actions · sonnet · ~0,6 M

## 5 · Comprobación
Cada historia tiene paso y prueba (1-2 → `tests/recetario.test.js`; 3-6 → prueba encadenada en `regression.test.js`
en su tarea). Sin [ACLARAR] abiertas. Lo que cambia lo que se ve pasa por la maqueta CH3 (delegada al Consejo).

## Para quien escriba recetas (CH4, CH9)
- Ingredientes con el nombre exacto de la tabla; lo procesado que de normal lleva gluten, como «X sin gluten».
- Embutidos, caldos, tomate frito, colorante, especias mezcladas, salsas: van en `etiqueta` con su `aviso`.
- Pasos para vitro (fuego 1-9) y micro (vatios y minutos); ≤6 raciones por olla de 5-6 L; si pide horno, `equipo.horno`.
- Texto propio (no copiado de webs). Fiesta y postres no entran solos en la semana.

## Resultado CH1
Fabada en verde (654 kcal, 34 g P). Catálogo: 344 platos, 327 con micro + vitro (293 tal cual, 34 adaptados), 17 esperan
horno, 93 con algo de etiqueta, 30 de fiesta.
