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
- [ ] P1 [P] H1: prueba encadenada que falla → la línea en `renderComerEje` (tab hoy) + CSS · general-purpose
  sonnet · ~45 pasos. Prueba nueva justo antes de la línea `check('sin errores de JavaScript…` (13330).
- [ ] P2 [P] H2+H3+H4: prueba encadenada que falla → filas con marca y rueda por fila en `lecturaCardHTML`,
  `cantRuedaHTML` generalizada, cabecera «¿Qué has comido?» y campo vacío · general-purpose sonnet, en worktree ·
  ~50 pasos. Prueba nueva justo después del `check('la hoja de cantidad…` (13255–13262).
- [ ] P3 Juntar P1+P2, `tools/pruebas-corto.sh --solo` de las nuevas y la 330 · opus · ~8 pasos
- [ ] P4 Capturas a 412×915 (línea, frase del hospital, rueda movida) y suite completa · verificador sonnet · ~25 pasos
- [ ] P5 DECISIONS (una entrada), plan, gasto y traspaso · opus · ~10 pasos

## 5 · Comprobación
H1→P1 · H2/H3/H4→P2 · cada paso con prueba que cae al revertir · maquetas aprobadas · medido a 412×915 en P4 ·
sin [ACLARAR] abiertas. Presupuesto: ~2,1 M (construir, 90 % de la última).
