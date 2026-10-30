# Ficha · La Reforma · R3 · Gasto grande + Ahorro y Bosque juntos

Maqueta aprobada (Consejo por delegación, acta 2026-10-29-2 «R1»): `maquetas/dinero-tu-mes.html`: la hoja «Apuntar gasto
grande» (`#hoja`, l. 209-216), los chips de Tu mes (`#chAp`/`#chSa`, l. 125-126) y la pestaña «Ahorro y Bosque» (`#pAho`,
l. 165-184; dibujo `bosque()`/`meses()`, l. 277-295). Tu mes ya está en main (R2). Presupuesto: ~1,8 M (constructor sonnet).

## 1. Qué y para qué
- **H1 · Apuntar un gasto grande.** Dado Tu mes con datos, cuando toco «Apuntar gasto grande», entonces sale la hoja con
  ¿Qué es? · Precio · Para qué mes · y dos opciones (aria-pressed): «Lo voy apartando» (X € al mes hasta ese mes) o «Sale de
  lo ahorrado»; una línea de previsión («Este mes: 150 € al colchón + 550 apartados.»); «Quitar» y «Listo». Se guarda como una
  compra de `compras[]` con `grande:'apartando'|'ahorrado'` (campo opcional; ausente = no es grande), `estado:'plan'`.
- **H2 · Tu mes lo resta.** Dado un grande «apartando» con cuota C, cuando miro Tu mes, entonces bajo «ahorras» sale el chip
  «🟩 N € al colchón + 💻 C apartados» (N = ahorras − C, ≥0) y en el vaso una capa roja a rayas de C entre margen y ahorro.
  Con «ahorrado»: chip «💻 <nombre> sale de lo ahorrado en <mes>» y `d3Datos().pide` sube (lo que tendrá que reponer).
  La línea de Hoy añade «· apartas C a <nombre>». Debajo del botón, cada grande en una fila que abre su hoja.
- **H3 · Quitar y vuelve todo.** Dado H2, cuando abro su hoja y toco «Quitar», entonces la compra pasa a `estado:'no'`
  (no se borra) y Tu mes, `pide`, el vaso y Hoy vuelven a las cifras de antes.
- **H4 · Ahorro y Bosque, una pestaña.** Pestañas: **Tu mes · Ahorro y Bosque · Gastos · Compras**. `ui.dinTab` `bosque`
  o `ahorro` (datos viejos) abren la nueva. Arriba «Colchón a fin de mes» (guardado + lo que va al colchón este mes) en € y
  meses; «Hoy X € · Y meses de vida»; chip del mes. «Tu Bosque»: un árbol por mes de colchón hasta el objetivo (máx. 12
  dibujados), lleno lo crecido, plantón punteado lo que falta; cada grande es un fruto rojo (lleno si apartando). «Lo que
  ahorraste cada mes»: barras de los 4 meses anteriores + este (rayas rojas lo apartado). Debajo, sin rehacer cuentas: el
  objetivo/plazo (`sw` de `d4AhorroHTML`), `d4NominaHTML`, `d3GuardarHTML`, `d4AjustesHTML` y el botón «Apuntar gasto grande».
- **H5 · Datos viejos.** Dado un store con `store.ahorro` (huchas, meta), `store.dinero` y `dinero3` sin `grande`, cuando cargo,
  entonces nada se pierde, ninguna compra es grande y `normalize` conserva `grande` válido y descarta uno inválido.

## 2. Dudas (resueltas por el Consejo, por delegación; van a Supuestos de DECISIONS)
- Cuota «apartando» = la misma que ya usa Compras: `ceil((precio−llevas)/max(1,mkEntre(mkHoy,mes)))` (sacarla de `d5Fila`
  a `d5Cuota(c,mkH)` y usarla en los dos sitios). Sin mes, apartando pide el mes (no se guarda sin él).
- «pide lo resta»: «apartando» quita C de lo que va al colchón este mes; «ahorrado» suma precio−llevas a `falta` (el colchón
  tendrá que reponerlo), luego `pide` sube. Ningún otro cálculo nuevo.
- Quitar = `estado:'no'` (como «Ya no lo quiero»). El laurisilva (`d3EscenaSVG`) deja de pintarse; la función puede quedar.

## 3. Dónde se toca (app.js, 30/10)
- Datos: `dinero3Limpia` 20634 (conservar `grande` si es 'apartando'|'ahorrado'), `D3_ESTADOS` 20627, `dinero3S` 20662.
  `d3Datos` 21521 (+`grandes`, `aparta`, `deAhorro`; `falta` con deAhorro). `d5Fila` 21781 y `d5ListaHTML` 21801 (cuota →
  `d5Cuota`). `tuMesDatos` 21836 (+`aparta`=min(ahorras, D3.aparta), `colchon`=ahorras−aparta), `tmVasoSVG` 21857 (capa),
  `dinTuMesHTML` 21875 (chips, botón, filas), `dinHoyLineaHTML` 21907.
- Pestañas: `din8Tabs` 21826, `dinTabDe` 21917 (`bosque`→`ahorro`), `renderDinero` 20500; nueva `dinAhoBosqueHTML()` en lugar
  de `dinBosqueHTML` 21592 + `d4AhorroHTML` 21671 (botones `data-v="bosque"` → `ahorro`; `grep -n 'data-v="bosque"' app.js`).
- Hoja: `hojaMarco(cerrarA,cls,label,cuerpo)` 8060; ver cómo se pinta `ui.solHoja` (grep `solHoja`) y hacer igual con
  `ui.tmGrande={id|''}`. Acciones nuevas en `act()` (cerca de `d5-add`, 24697): `tg-abre`, `tg-modo`, `tg-listo`, `tg-quita`,
  `tg-cerrar`; inputs `#tgNom #tgPre #tgMes` (leer con `leeImporte`, como `d5-add`). Ojo: dos switches (`act()` y `change`).
- CSS: `styles.css`, prefijos `.tm-` (chips, capa) y `.ab-` (pestaña nueva); ≥44 px, texto ≥14 px fuera de las capas
  [aparc-tu-mes-r2], nada solo por color (rayas + texto), `prefers-reduced-motion`.
- Pruebas parecidas: 365-367 (Tu mes, l. 14386), 341 (migración, l. 13247), d5 (13377-13403). Las que miran `.lau-baya`,
  `#lauT`, `.lau-musgo` o `d6-tab` `bosque` se pasan a la pestaña nueva (no se borran).

## 4. Pasos
- [x] P1 Pruebas 368-370 que fallan: (368) Tu mes → Apuntar gasto grande → Portátil 1.100 para dentro de 2 meses → «Lo voy
  apartando» → Listo → chip «… al colchón + 550 apartados», `ahorras` baja, Hoy dice «apartas» → abrir la fila → Quitar →
  cifras como al principio; y con «Sale de lo ahorrado» `pide` sube; (369) migración: store viejo (huchas+meta+dinero+dinero3
  sin grande) → nada perdido, 0 grandes; `normalize` conserva/descarta `grande`; (370) Ahorro y Bosque: 4 pestañas, `dinTab`
  `bosque` abre la nueva, árboles = objetivo, fruto con un grande · tests/regression.test.js · constructor sonnet · ~12 pasos
- [x] P2 Datos: `grande` en Limpia, `d5Cuota`, `d3Datos`, `tuMesDatos` · app.js · constructor · ~8 pasos
- [x] P3 Hoja + acciones + chips + capa del vaso + filas + línea de Hoy + CSS · app.js, styles.css · constructor · ~18 pasos
- [x] P4 `dinAhoBosqueHTML` + pestañas + CSS `.ab-` · app.js, styles.css · constructor · ~16 pasos
- [x] P5 Pasar las pruebas viejas a la pestaña nueva; P1 cae al revertir; `tools/pruebas-corto.sh --solo …` · constructor · ~8
- [ ] P6 Capturas 412×915: Tu mes con apartando y con ahorrado, la hoja, Ahorro y Bosque con fruto y sin datos · verificador sonnet
- [ ] P7 Suite completa, DECISIONS «La Reforma · R3», sello, main (Consejo por delegación), gasto y traspaso R4 · principal

## 5. Comprobación
H1→P1(368),P3 · H2→P1(368),P2,P3 · H3→P1(368),P3 · H4→P1(370),P4 · H5→P1(369),P2. Sin dudas abiertas. Maqueta aprobada;
prueba que cae al revertir (P5); 412×915 (P6). No borra `store.ahorro`/`store.dinero` ni compras (quitar = `no`).
