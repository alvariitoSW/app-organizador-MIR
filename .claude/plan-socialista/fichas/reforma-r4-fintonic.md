# R4 · Fintonic en pequeño (arreglo · sonnet · ~0,8 M)

Acta `consejo/2026-10-29-2.md`, addenda acuerdo 2: revisión gasto a gasto editable (importe, categoría, quitar) antes
de guardar y aviso si la suma no cuadra con el total. Fuera «pegar texto» y las partidas con memoria.

## 1. Qué y para qué
- **H1 · Corregir la categoría.** Dado que subo una captura y sale «Belleza 312,00», cuando toco el nombre y escribo
  «Alquiler» (o elijo uno de la lista), entonces la fila se llama «Alquiler» y al guardar se guarda así.
- **H2 · Quitar una fila.** Dado una fila mal leída (el «de 300 €» del presupuesto), cuando pulso ✕, entonces
  desaparece, la suma «suman X de Y» baja y, si no cuadra, el aviso ⚠ dice cuánto falta o sobra.
- **H3 · Tu mes lo refleja.** Dado H1 y H2 guardados, cuando abro Dinero · Tu mes, entonces lo renombrado a
  «Alquiler» cuenta como fijo y lo quitado no está en las categorías del mes (el total de la captura no cambia).
- **H4 · Dos filas con el mismo nombre** (renombrar «Bares» a «Supermercado» que ya estaba): al guardar se **suman**,
  no se pisa una con otra (hoy `finGuardar` hace `cats[nombre]=v` y se pierde una).

## 2. Dudas
Ninguna: el Consejo lo decidió por delegación. Lo de por defecto, en Supuestos.

## 3. Dónde se toca (app.js, 30/10)
- `renderFintonic()` ~21013: `campo(k,txt,o,dec)` pinta `.finfila` (nombre en `<span class="t">`, importe
  `data-a="fin-v"`, ✓/⚠). Para las categorías (`k='cat:i'`), el nombre pasa a `<input data-a="fin-n" data-k="cat:i"
  list="finCats" aria-label="categoría">` y se añade `<button class="btn s fin-x" data-a="fin-quitar" data-k="i"
  aria-label="quitar <nombre>">✕</button>` (≥44 px). `<datalist id="finCats">` con los nombres de las capturas
  guardadas (`ahorroS().real[].cats`) + `gastosFijos()` nombres, sin repetir, escapados con `esc`.
  El aviso «⚠ No cuadran: sobran/faltan» ya existe y se recalcula en cada `render()`: no tocarlo salvo que falte.
- Switch de `change` ~27381 (`case 'fin-v'`): nuevo `case 'fin-n'`: `nombre=String(el.value).trim().slice(0,40)`;
  si vacío, no cambia; si no, `c.nombre=nombre`; `render()`.
- `act()` ~24246 (`case 'fin-guardar'`): nuevo `case 'fin-quitar'`: `ui.fin.res.cats.splice(+el.dataset.k,1)`; `render()`.
- `finGuardar()` ~21000: `cats[c.nombre]=(cats[c.nombre]||0)+c.v` redondeado a céntimos (H4).
- Tu mes lee `gastoMes(mk)` → `mesPartes` → `catEsFijo` (por nombre: /alquiler|seguro…/ o recibo de igual nombre).
- CSS `styles.css:1400` `.finfila`: el input de nombre `flex:1;min-width:0`; botón ✕ 44×44. Sin scroll lateral a 412.
- Pruebas parecidas: la de Fintonic de punta a punta ~`tests/regression.test.js:6000` (OCR real, lento) y la 365/368
  (Tu mes, fecha fija 29/10/2026, `siembra`, `lee`). Para «subir» sin OCR: `window.ocrTextos = (fs, cada) =>
  Promise.resolve([TEXTO_INVENTADO])` (las funciones de app.js son globales) y `setInputFiles` en
  `input[data-a="fin-fotos"]` con un PNG cualquiera. Texto inventado, nunca de capturas reales.

## 4. Pasos
- [ ] P1 Prueba 371 encadenada (412×915): subir (OCR simulado: «Gastos 1.000,00 €» + Supermercado 400,00 · Belleza
  312,00 · Presupuesto de 300 288,00) → renombrar Belleza a «Alquiler» → quitar la tercera → ve «faltan 288» →
  guardar → `gastoMes('2026-10').cats` = {Supermercado:400, Alquiler:312} y `mesPartes` cuenta 312 fijo; y H4 aparte.
  Debe fallar antes del cambio · `tests/regression.test.js` tras la 370 · general-purpose sonnet · ~10 pasos
- [ ] P2 El cambio (H1–H4) · `app.js` (renderFintonic, fin-n, fin-quitar, finGuardar) + `styles.css` · el mismo · ~10 pasos
- [ ] P3 Comprobar que la 371 cae al revertir P2 y que pasa con P2; `tools/pruebas-corto.sh --solo 371` y la de Fintonic
  · el mismo · ~4 pasos
- [ ] P4 Captura de la revisión a 412×915 (filas, ✕, aviso) · verificador · ~5 pasos
- [ ] P5 Suite completa, DECISIONS «La Reforma · R4», sello, main, gasto y traspaso · conversación principal

## 5. Comprobación
Cada historia tiene paso y prueba (H1–H3 en la 371 encadenada, H4 en su check). No cambia la estructura de la pantalla
(misma revisión, dos controles más): sin maqueta, como decidió el Consejo. Prueba que cae al revertir y 412×915: sí.

## Supuestos
- «Gasto a gasto» = fila a fila de lo que trae la captura (las categorías de Fintonic); no se leen movimientos sueltos.
- Quitar una fila no baja el total del mes (es el de la captura): lo quitado pasa a «sin categoría» (variable).
- No hay «añadir fila»: si falta algo, el aviso lo dice y se guarda lo que haya (como ya hacía).
