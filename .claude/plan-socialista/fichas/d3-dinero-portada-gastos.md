# d3-dinero-portada-gastos · Tanda Dinero, D3 (construir: cambia lo que ve el usuario, ya diseñado en maqueta)

Decide el Consejo (acta `2026-10-28-dinero-ejecucion.md`; diseño: `maquetas/dinero-rara2-laurisilva.html` pantalla 1 y
`maquetas/dinero-laurisilva-gastos.html`). Sin dudas para el usuario. Presupuesto ~1,2 M (tope 1,5 M).

## 1. Qué y para qué
- Dado un móvil con huchas viejas (colchón con saldo, una hucha con objetivo, deseos), cuando abre Dinero por primera vez,
  entonces el Bosque enseña lo guardado y los frutos, y lo viejo (`store.dinero`, `store.ahorro`) sigue intacto.
- Dado el Bosque con gasto conocido, cuando toca el tocón de «El claro», entonces llega a Gastos con las cifras del mes y puede
  pasar al mes anterior (y desde Gastos siguen alcanzables recibos, fijos, hoja, Fintonic, categoría y taxis).
- Dado que no hay nada guardado, cuando abre Dinero, entonces ve un estado vacío amable que le pide escribir lo guardado.
- Dado Dinero, entonces las pestañas son Bosque · Gastos · Ahorro · Compras y ya no sale «Te queda / Puedes gastar hoy».

## 2. Dudas
Ninguna.

## 3. Dónde se toca
- `app.js`: `din8Tabs`, `dinTabDe`, `renderDinero` (l.~20025, ~21327), datos nuevos `dinero3S` + `dinero3Migra`
  (junto a `ahorroS`), `dinBosqueHTML`, `dinGastosHTML`, `dinComprasHTML`; acciones en `act()` (`d3-*`; el switch de `change` no
  hace falta: todo son botones). La copia de seguridad guarda el store entero (`storeParaCopia`), sin lista blanca.
- `styles.css`: tokens `--lau-*` (claro y `html.dark`) y clases `.lau-*`.
- Cálculos que se reutilizan: `mesTipo().gasto` (gasto de un mes típico), `mesPartes`, `gastoMes`, `catEsFijo`, `nominaMedia`, `metaPct`,
  `ahorroDeMes`, `d6Cats`, `recibosEntre`, `dinTaxisHTML`.
- Pruebas viejas que miran Hoy/Mes de Dinero: se ven al correr `--solo`; se cambia el camino, no la comprobación.

## 4. Pasos
- [x] P1 Ficha · este archivo
- [x] P2 Datos `dinero3` + migración que copia y no toca (try/catch) · app.js · ~15 pasos
- [x] P3 Pestañas + Bosque (SVG con etiquetas, estado vacío) · app.js, styles.css · ~30 pasos
- [x] P4 Gastos (mes, fijos/variables, dónde ahorrar, suscripciones, comparado, De dónde salen, enlaces a las subpantallas) · ~25 pasos
- [x] P5 Pruebas encadenadas (a) migración y (b) Bosque → tocón → Gastos → mes anterior; que caen al revertir · ~20 pasos
- [x] P6 Arreglar pruebas viejas por el camino · suite completa · DECISIONS.md · commit

## 5. Comprobación
Cada historia tiene su paso y su prueba; nada contradice CLAUDE.md (412×915, accesibilidad, texto del usuario escapado, sin sellar
ni pasar a main). El «Te queda / Puedes gastar hoy» queda sin vista (su código se quita en la D6).
