# S2b · El lector de frases a fondo · [v3-lector]

Tipo `construir` · presupuesto ~2,0 M (primera medida de su tipo) · 2026-10-28

## 1 · Qué y para qué
1. Dado «macarrones con tomate y atún» (o una de bar, hospital, cadena, Mercadona, lista con comas, con faltas),
   cuando lo escribo, entonces sale lo que comí con kcal razonables, sin cosas que no dije.
2. Dado cualquier trozo leído, entonces la app dice su seguridad: ✓ lo dije (qué y cuánto) o es un plato conocido;
   ≈ ella puso algo (gramos, pan, aceite, errata, lo más parecido) con su «supuse …»; ? lo pregunta. Para la S3.
3. Dado un fallo arreglado, entonces su frase queda en `tests/frases.json` y no vuelve.

## 2 · Dudas (resueltas el 2026-10-28)
- ≈ cuándo → **si adivina algo** (gramos, pan, aceite, errata, parecido). ✓ qué y cuánto dichos, o plato/cadena.
- Cuántas frases → **~300 nuevas**.

## 3 · Dónde se toca
- `app.js` `fraseLeer` (~9795), `frBusca`, `frCorrige`, `FR_PALABRAS`, `FR_CADENAS` (~9505); nueva `frSeg(x)` junto a
  `frNomItem`, expuesta en `window.PG`.
- `tests/frases.test.js`: campos `seguro`/`supuesto`, `--banco otro.json`, `--lee`.
- Sin cambio visible: la pantalla con ✓/≈/? es la S3 (`maquetas/comer-escribir.html`).

## 4 · Pasos
- [x] P1 `frSeg` + campos `seguro`/`supuesto` en el banco · app.js, tests/frases.test.js · yo
- [x] P2 [P] ~300 frases nuevas con lo esperado · tests/frases-nuevas.json · general-purpose haiku
- [x] P3 Pasarlas, clasificar fallos por tipo (y corregir expectativas mal puestas) · yo
- [x] P4 Arreglar por tipos en `fraseLeer` y vecinos · yo (o sonnet con esta ficha)
- [x] P5 Fundir en `tests/frases.json` + casos de ✓/≈ · suite completa · cerrar y medir

## 5 · Comprobación
Cada historia tiene paso y prueba (banco). Sin [ACLARAR] abiertas. Sin cambio visible → sin maqueta.

## Resultado
Antes 61/299 nuevas; ahora 292/292 + 536 viejas = 838 en el banco (con el lector viejo caen 121). Suite completa en verde.
Pendiente (aparcado): cartas que faltan (Happy Meal, Big Tasty, Double Cheeseburger, tacos de carne de Taco Bell),
«menú del día de X: sándwich club» (pan doble) y «un paquete de» (¿entero?). Detalle en DECISIONS «El lector de frases a fondo».
