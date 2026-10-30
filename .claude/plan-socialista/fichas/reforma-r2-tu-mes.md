# Ficha · La Reforma · R2 · Construir «Tu mes» (El Vaso)

Maqueta aprobada (Consejo por delegación, acta 2026-10-29-2 «R1»): `maquetas/dinero-tu-mes.html`, pestaña «Tu mes» y vista
«Hoy». **Fuera de R2** (van a R3): el gasto grande (hoja del portátil, «apartando/de lo ahorrado»), el Bosque y Ahorro juntos,
la ficha «150 + 550». Presupuesto: ~1,2 M (constructor sonnet).

## 1. Qué y para qué
- **H1 · El mes de un vistazo.** Dado que hay nómina del mes (épocas) y fijos apuntados, cuando abro Dinero, entonces la
  portada es «Tu mes»: arriba manda «Acabarás con ~X € · ahorras Y»; debajo el vaso por capas (fijos abajo, gastos, margen,
  ahorro arriba) y la cadena en fichas «empiezas − fijos − gastos = acabas».
- **H2 · Tocar los fijos.** Dado H1, cuando toco el vaso o la ficha «Fijos», entonces los fijos se separan, sale «Te quedan
  N € tras los fijos» y la lista de fijos con ✓ pagado / ○ por pagar (fecha); otro toque lo pliega. El estado vive en `ui`.
- **H3 · La línea de Hoy.** Dado que es hoy y aporta (un fijo sin pagar mañana, o el ritmo de gasto en «ojo»/«pasa»), cuando
  abro Hoy, entonces debajo del cartel de la noche sale una línea «💶 Te quedan N € · M €/día hasta fin de mes» (+ «· mañana
  pagas X (I €)»); tocarla abre Dinero · Tu mes. Si no aporta, no sale nada.
- **H4 · Sin datos.** Dado que no hay nómina ni fijos, cuando abro Tu mes, entonces un vaso vacío y dos botones: «Apuntar mis
  fijos» (vista `fijos`) y «Mi nómina» (lo que ya exista para épocas/nómina).

## 2. Dudas (resueltas por el Consejo, por delegación)
- El mes: **el del calendario**, como `d6Mes` y el resto de Dinero (la maqueta decía nómina a nómina; se cambia para no tener
  dos meses distintos en la app).
- «Puedes ahorrar» = acabarás − margen; **margen = 10 % de lo que te queda tras los fijos**, redondeado a 10 €.
- Pestañas: «Tu mes» pasa a portada (`''`); el Bosque se mueve a la pestaña `bosque` hasta que R3 lo junte con Ahorro.
  Orden: Tu mes · Bosque · Gastos · Ahorro · Compras.

## 3. Dónde se toca (app.js, 30/10)
- Cifras: `d6Mes(mk)` 21247 → `ingreso` (empiezas), `fijos`, `gastado`, `dia`, `dim`, `dias`, `est`. `mesTipo()` 21298 →
  `vars` (gasto variable de un mes típico). `gastosFijos()` 20400, `gastoPagado(g,y,m)` 20412, `diaDelMes` 20403.
  **Ningún cálculo nuevo salvo `tuMesDatos()`**: variables previstas = max(gastado, mesTipo().vars ||
  round(gastado/dia·dim)); acabas = ingreso − fijos − previstas; margen; ahorras = max(0, acabas − margen);
  paraGastar = max(0, ingreso − fijos − gastado − ahorras); porDia = floor(paraGastar/dias).
- Pestañas: `din8Tabs(on)` 21826, `dinTabDe()` 21832 (añadir `bosque`), `renderDinero()` 20500 (el `''` pinta
  `dinTuMesHTML()`, `bosque` pinta `dinBosqueHTML()`), acción `d6-tab` (ya existe). Botones de `dinBosqueHTML` y otros que
  vuelven a `''` pensando en el Bosque: revisar con `grep -n 'data-v=""' app.js` y `'d6-tab'`.
- Hoy: `hoyDiaHTML` 5562, tras cada `nocheHTML(key,esHoy)` (líneas 5569-5572) añadir `dinHoyLineaHTML(key,esHoy)`.
  No repetir «Hoy toca pagar» (`pagosHoyHTML` 20480 y Para hoy ya lo dicen): la línea solo habla de mañana.
- Toques: los dos switches de `app.js` (`act()` de clicks y el de `change`); nuevo `data-a="tumes-fijos"` en `act()`.
- CSS: `styles.css`, prefijo `.tm-` (vaso SVG en línea, capas con rayas para «por pagar», nada solo por color, ≥44 px,
  `prefers-reduced-motion`). Copiar el dibujo y medidas de la maqueta (vaso ~170×236). [aparc-tu-mes-r2]: las etiquetas de
  capa van **fuera** de la capa, a ≥14 px.
- Pruebas parecidas: `tests/regression.test.js`, buscar `d6-tab` (55 usos) y `dinBosque`/`lau-` para las que dan por hecho
  que la portada es el Bosque: se cambian a la pestaña `bosque` (no se borran).

## 4. Pasos
- [x] ~~P1 Pruebas encadenadas que fallan: (a) Dinero → vaso → toca fijos → «Te quedan 1.652 €» → toca otra vez → se pliega;~~
  (b) Hoy con un fijo sin pagar mañana → sale la línea → tocarla abre Tu mes; sin nada que aporte → no sale; (c) sin nómina ni
  fijos → vaso vacío con «Apuntar mis fijos». Sembrar con `window.PG`/store como las de `d6-tab` · tests/regression.test.js ·
  constructor sonnet · ~10 pasos
- [x] ~~P2 `tuMesDatos()` + `dinTuMesHTML()` + pestañas (`din8Tabs`, `dinTabDe`, `renderDinero`) + `act('tumes-fijos')` + CSS ·~~
  app.js, styles.css · constructor sonnet · ~20 pasos
- [x] ~~P3 `dinHoyLineaHTML()` en `hoyDiaHTML` · app.js · mismo constructor · ~6 pasos~~
- [x] ~~P4 Arreglar las pruebas viejas que daban la portada por Bosque (a `bosque`) · tests · mismo constructor · ~6 pasos~~
- [ ] P5 Comprobar que las de P1 caen al revertir y ninguna otra; `tools/pruebas-corto.sh --solo …`; luego `npm run test:corto` ·
  verificador sonnet
- [ ] P6 Capturas a 412×915: Tu mes plegado y desplegado, sin datos, Hoy con y sin línea; medir altos (Tu mes ≤915 sin
  scroll horizontal) · verificador sonnet · ~10 pasos
- [ ] P7 DECISIONS «La Reforma · R2», sello, main (Consejo por delegación), traspaso · principal

## 5. Comprobación
H1→P1a,P2 · H2→P1a,P2 · H3→P1b,P3 · H4→P1c,P2. Sin `[ACLARAR]` abiertas. Maqueta aprobada; prueba que cae al revertir (P5);
412×915 (P6). No borra datos (el Bosque sigue, cambia de pestaña).
