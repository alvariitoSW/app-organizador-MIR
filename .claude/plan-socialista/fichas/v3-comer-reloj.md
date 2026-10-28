# S3 · El Comer del reloj — sesión 1 de 2 (línea del día + escribir lo comido)

Maquetas aprobadas: `maquetas/comer-debate-1-reloj.html` (pantalla 1 · AHORA) y `maquetas/comer-escribir.html`
(pantallas 1–5). DECISIONS «El mapa de Comer» y «El lector de frases a fondo». La sesión 2 hace Mi semana a mano,
la compra de lo apuntado, la nevera dibujada y las vitaminas (pantallas 2, 3, 5 y 6 del reloj; antojo en la S7).

## 1 · Qué y para qué
- **H1 La línea del día** (lo mínimo desplegable). Dado que abro Comer, cuando miro, entonces en la pestaña «Hoy»
 veo de arriba abajo: la lupa «¿Qué has comido? o busca…»; «Ahora · día» con
  kcal/P/HC/G frente al objetivo; lo ya comido a su hora con ✓; **LO SIGUIENTE** (el próximo momento sin apuntar,
  con lo que tocaba: «✓ Hecho» lo apunta y «Otra cosa» abre escribir dirigido a ese momento); las demás comidas del
  día a su hora, en gris; al pie **la semana de un vistazo** (7 días con 🍳 cocino · 📦 táper · 🏥 guardia · 🍽️ fuera;
  un toque lleva a Plan). Cocina, Plan y Despensa siguen como pestañas.
- **H2 Escribir lo comido.** Dado que toco la lupa u «Otra cosa», cuando escribo una frase, entonces cada cosa sale
  en una fila con su marca **✓ / ≈ / ?** (`frSeg`) y, si es ≈, su «por» («supuse 200 g»); lo que pregunta va como chips
  en la misma fila; «Apuntar en Cena» vuelve a la línea con «✓ Cena apuntada · Editar · Deshacer».
- **H3 La rueda en cada fila.** Dado una fila «≈ supuse 200 g», cuando muevo su rueda a 150, entonces sus kcal y el
  total cambian al momento, la marca pasa a ✓ y se apuntan 150 g.
- **H4 Campo vacío.** «Lo de siempre a esta hora» (`fraseRecientes`) y «↺ Repetir lo de ayer», a un toque. Con una
  palabra, el buscador de siempre (con su letra Nutri-Score).

## 2 · Dudas (resueltas el 2026-10-28)
- Reparto: **línea + escribir** en esta sesión; semana, compra, nevera y vitaminas en la 2.
- Rueda: **sí, en cada fila** de escribir lo comido.
- Pestañas: **la línea sustituye «Hoy»**; Cocina, Plan y Despensa se quedan hasta la sesión 2.

## Supuestos
- Hora de cada momento: la de `comidasCfg()` / `posDeSlot`; «Lo siguiente» es el primer momento de hoy, a partir de
  `momentoAhora()`, sin nada apuntado. Sin plan para él: el primero de «lo de siempre a esta hora».
- El icono del día de la semana sale de `cjeSemana()` (guardia → 🏥, toca cocinar → 🍳, sobras/táper → 📦, fuera → 🍽️).
- «Investigar» lo desconocido (pantalla 3) se queda en lo que ya hay (opciones, buscar en OFF, quitar) + «a ojo»
  (Poco/Normal/Mucho). Las cinco fuentes de la maqueta, a la sesión 2 si sobra.
- Paradas de antojo (23 h) y vitaminas (cierre) no salen todavía.

## 3 · Dónde se toca
- Portada: `renderComerEje` (app.js:14451), rama `tab==='hoy'` (14460–14479): hoy pinta `cjbusca`, `cjdia`,
  `nutSemHTML`, `cjeTareas` (13794), `cjeMacrosHTML` (14496), `nutHoyHTML` (10994), `micro6HTML`, `cjeComidas` (13747) +
  `cjeComidaHTML` (13754). Momentos: `CJE_MOM` (13744), plan del día `cjeHoyPlan` (13729), `momentoAhora` (9340),
  `POS_ICO/POS_TXT` (9349). ✓ lo que tocaba: acción `cje-ok`; abrir comida: `cje-mom`; lupa: `cje-busca` (24412).
  Semana: `cjeSemana` (13582). «Para hacer hoy» (`cjeTareas`) se queda como parada a su hora o encima de LO SIGUIENTE.
- Escribir: `lecturaCardHTML(fr,ctx)` (10194) pinta las filas `.lecit` (cantidad hoy con `<input data-a="fr-gset">`);
  `fraseCardHTML` (10284), `frTeclea`/`frPintaLectura` (10302) repintan sin cerrar el teclado; `frSeg` (10074);
  `fraseRecientes` (10162); buscador `renderFoodBuscar` (11853) con ctx `fb`; `cjeHojaMom` (14504) lleva el campo.
- Rueda: `cantRuedaHTML(x,cant)` (11983) y su listener de scroll (12038) atados a **un solo** `#fcRueda` y a
  `ui.foodCant`: hay que generalizarlos (id o `data-i` por fila) sin romper la hoja de cantidad (prueba 330,
  tests/regression.test.js:13241). Ojo: dos switches de acciones (`act()` y el de `change`, `fr-gset` va en este).
- Pruebas parecidas: la de la hoja de cantidad (13200–13262) y las de `fr-` (buscar `fr-in` en el test).

## 4 · Pasos
- [x] P0 Ficha y dudas · esta ficha · opus (sesión principal)
- [x] P1 [P] H1: prueba encadenada que falla → la línea en `renderComerEje` (tab hoy) + CSS · general-purpose
  sonnet · ~45 pasos. Prueba nueva justo antes de la línea `check('sin errores de JavaScript…` (13330).
- [x] P2 [P] H2+H3+H4: prueba encadenada que falla → filas con marca y rueda por fila en `lecturaCardHTML`,
  `cantRuedaHTML` generalizada, cabecera «¿Qué has comido?» y campo vacío · general-purpose sonnet, en worktree ·
  ~50 pasos. Prueba nueva justo después del `check('la hoja de cantidad…` (13255–13262).
- [x] P3 Juntar P1+P2, `tools/pruebas-corto.sh --solo` de las nuevas y la 330 · opus · ~8 pasos
- [x] P4 Capturas a 412×915 (línea, frase del hospital, rueda movida) y suite completa · verificador sonnet · ~25 pasos
- [x] P5 DECISIONS (una entrada), plan, gasto y traspaso · opus · ~10 pasos

## 5 · Comprobación
H1→P1 · H2/H3/H4→P2 · cada paso con prueba que cae al revertir · maquetas aprobadas · medido a 412×915 en P4 ·
sin [ACLARAR] abiertas. Presupuesto: ~2,1 M (construir, 90 % de la última).

Medido: 3,1 M frente a ~2,1 M (P2 41 %; una vuelta más para quitar la lista repetida).

---

# S3b · El Comer del reloj — sesión 2 de 2 (Mi semana, Casa, vitaminas, investigar)

Maquetas aprobadas: `maquetas/comer-debate-1-reloj.html` pantallas 2 (MI SEMANA), 3 (APUNTAR UN HUECO), 5 (NEVERA Y
COMPRA) y 6 (VITAMINAS); `maquetas/comer-mapa.html` (FICHA, bloque «Vitaminas y minerales · por lata»);
`maquetas/comer-escribir.html` pantalla 3 (FRASE + INVESTIGAR).

## 1 · Qué y para qué
- **H5 Mi semana a mano.** Dado que abro Comer › Semana, entonces veo los 7 días (desde hoy) con su icono 🍳/📦/🏥/🍽️, y
  por día «comida: X» y la cena apuntada o «＋ apunta la cena». Arriba, «¿Me la propones?» rellena **solo los huecos
  vacíos**. Al pie, «🛒 De tus N cenas: M cosas · K ya las tienes · J sin apuntar · Ver compra ›».
- **H6 Apuntar un hueco.** Dado que toco «＋ apunta la cena» del jueves, se abre la hoja «Jueves · cena» con campo
  «Escribe lo que sea…», TUS PLATOS (chips), «📦 Táper de… · 🍽️ Fuera · 🏥 Hospital», «✓ Cocino ese día» (🍳 solo si es
  plato) y «Apuntar / Dejar vacío». Un plato pasa sus ingredientes a la compra menos lo que hay; el texto libre entra
  tal cual en la lista («“Algo de fruta” tu nota»).
- **H7 Casa: la nevera dibujada y la compra.** Dado que abro Comer › Casa, veo PARA ESTA SEMANA (táperes con «caduca
  mañana» / raciones), CRUDO Y VERDURA (lo que hay y lo que «falta»), CONGELADOR, «🛒 FALTAN N cosas», la compra con el
  **origen** de cada cosa («cena jue», «crema dom», «tu nota»), «Ya en casa, no entran: …», la barra «＋ A mano · ▥ Código
  · 🧾 Ticket» y al pie los botones 🍲 Lote · 📖 Recetas · ¿Qué cocino? · Comer fuera.
- **H8 Vitaminas.** Dado que toco «💊 Vitaminas de hoy» (parada «cierre» al final de la línea del día), veo la hoja «%
  diario» de los 9 que ya se cuentan (hierro, calcio, potasio, magnesio, C, D, B12, B6, fólico) sobre la referencia
  europea (`ALIM_VRN`), **«sin datos» y nunca 0** cuando ningún apunte lo trae, la sugerencia de la próxima comida que
  más lo sube («Falta vitamina D: la cena con huevos te sube un 20 %») y la media de 7 días. En la ficha del alimento,
  cada fila con su cantidad (µg/mg) y su %.
- **H9 Investigar.** Dado que escribo «pizza barbacoa del telepizza, 3 trozos» y no la conoce bien, debajo de la fila sale
  «NO LA CONOZCO BIEN · ELIGE DE DÓNDE SACARLA» con 5 fuentes: Open Food Facts por marca · carta de la cadena · parecido
  genérico (usar) · a ojo (pequeña/mediana/grande o kcal) · «enséñamelo una vez» (lo guarda como plato tuyo).
- **Arreglos de la sesión 1.** (a) En la frase del hospital el título de la tarjeta incluye el filete aunque no se haya
  elegido cuál (`fraseNombre` cuenta también `fr.dudas`). (b) «¿Qué has comido?» por la tarde abre en el momento que la
  línea llama LO SIGUIENTE (cena), no en «Merienda».

## 2 · Dudas (resueltas el 2026-10-28)
- Pestañas: **Hoy · Semana · Casa**.
- «¿Me la propones?»: **sí, solo rellena huecos vacíos**; nunca pisa lo apuntado a mano.
- Investigar: **las 5 fuentes** de la maqueta.
- Vitaminas: **los 9 que ya se cuentan** (sin zinc, yodo, selenio, fósforo ni sal).

## 3 · Qué se QUITA
- Pestañas **Cocina, Plan y Despensa** (`cje-tab` coc/sem/desp) y sus pintores: `plDiasHTML`, `plDiaHTML`, `plResHTML`,
  `plNutriHTML` (Plan › Días), `plIsoSVG` + `plNeveraHTML` (Plan › Nevera isométrica), el segmento Plan › Compra,
  `cjeDespensaHTML` (Despensa), `cjeCocinaHTML` como pestaña (sus botones pasan al pie de Casa), `cjeSemana7HTML` suelto
  (se queda la tira como «la semana de un vistazo» en Hoy, que ahora lleva a Semana).
- Botones **«Por macros»** (`cje-macros`) y **«Copiar a la siguiente»** (`cje-copiar`) de la semana.
- `compraSemanaHTML`/`semanaCubierta` (la cuenta paralela «qué semana sale de lo que tienes»): la sustituye el pie
  «De tus N cenas».
- La **vista vieja de micros** (`renderFoodMicros`) y el desplegable «micros de hoy» de Hoy (`micro6HTML` en `cjmic`):
  los sustituye la hoja «% diario».
- El botón suelto **«buscar»** (`fr-busca`) de la duda «No conozco»: lo sustituye Investigar.
- Las pruebas que miraban solo lo quitado se reescriben contra lo nuevo (no se saltan): se dice cuáles en DECISIONS.

## Supuestos
- Mi semana empieza **hoy** y enseña 7 días; el dato sigue en `store.semBase` (`sbPoner`). El texto libre es un item
  nuevo `{kind:'txt',t}` en el hueco; «Táper de…» reutiliza `cje-guardia`/táper, «Fuera» `dishFuera`, «Hospital» `dishHospital`.
- La compra sigue saliendo de `compraDatos` (necesidadProximos); lo nuevo es guardar el **origen** (día y comida) de cada
  ingrediente y añadir las notas de texto libre.
- La parada 💊 va al final de la línea («cierre»), con los 3 más bajos; la hoja «% diario» es una vista de Comer.
- Investigar reutiliza `buscarOffNombre`, `FUERA_CADENAS`, `r.sug`, `FUERA_OJO` y `fb-lec-receta`; Open Food Facts solo
  se consulta al tocar esa fuente (nada sale del móvil sin un toque, y solo el nombre del producto).
- Antojo (pantalla 4): fuera, va en la S7.

## 4 · Dónde se toca
- Pestañas y Hoy: `renderComerEje` (app.js:14502), `cje-tab` (24483), `cjeSemana7HTML` (14566), `cjeSiguiente` (14559).
- Semana: `store.semBase` y `sbPoner/sbPonerItems/sbCelda` (2055–2100), `cjeSemana` (13629), hoja `cjeHojaPlato`/
  `cjeHojaHTML` (14682…), montar `pl-montar`/`plmHTML`, `cje-guardia`, `cje-cambia`, `dishHospital/dishFuera` (10869).
- Casa: `compraDatos/compraDatos0` (19101), `necesidadProximos` (19089), `compraLineaHTML` (19347), `cjeHojaCompra`
  (14746), `despensaS` (4175), `cocinadoS` (12423), `frescoDias` (12248), `renderNevera2` (12341), barra ticket/código/a mano
  de `cjeDespensaHTML` (13833), `cjeCocinaHTML` (13818).
- Vitaminas: `ALIM_MICROS/ALIM_VRN` (2690/2696), `microTotales/microPct/microCortos` (4150–4167), `micro6HTML` (10431),
  `renderFoodMicros` (12674), `micHTML` (12893), ficha `renderAlimFicha` (12951), `alimRicosEn` (4167).
- Investigar: `fraseLeer` duda desconocido (9975), `lecturaCardHTML` (10207), `fr-busca` (24679), `buscarOffNombre` (4722),
  `FUERA_CADENAS` (3375) y `FR_CADENAS` (9547), `fb-lec-receta`/`fbLecturaReceta` (11795).
- Arreglos: `fraseNombre` (10087); `cje-busca` (24484) y `momentoAhora` (9340) frente a `cjeSiguiente` (14559).

## 5 · Pasos
- [x] P0 Ficha y dudas · esta ficha · opus (sesión principal)
- [ ] P1 [P] H5+H6+H7 + quitar pestañas: pruebas encadenadas que fallan → Semana y Casa · general-purpose sonnet, en
  worktree · ~70 pasos. Pruebas nuevas justo antes de `check('sin errores de JavaScript…`.
- [ ] P2 [P] H8+H9 + arreglos (a) y (b): pruebas encadenadas que fallan → vitaminas, investigar y los dos arreglos ·
  general-purpose sonnet, en worktree · ~60 pasos. Pruebas nuevas justo antes de la `check('sin errores…` también
  (al juntar, P2 va detrás de P1).
- [ ] P3 Juntar P1+P2, `--solo` de las nuevas y suite completa · opus · ~10 pasos
- [ ] P4 Capturas a 412×915 (Semana, hoja del hueco, Casa, % diario, investigar) · verificador sonnet · ~25 pasos
- [ ] P5 DECISIONS, plan, gasto, sellar y pasar a main (`cierra-y-despliega`) · opus · ~15 pasos

## 6 · Comprobación
H5/H6/H7→P1 · H8/H9/arreglos→P2 · cada paso con prueba que cae al revertir · maquetas aprobadas · medido a 412×915 en
P4 · sin [ACLARAR] abiertas. Presupuesto: ~2,8 M (construir, 90 % de la última).
