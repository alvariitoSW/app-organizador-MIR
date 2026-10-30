# Concurso «Tu mes» · Dinero · bases (29/10/2026) · La Reforma · R1

Convoca el Consejo por delegación (acta `2026-10-29-2.md`, Addenda). Lo pide el usuario: «moderno y chulo», «doble
originalidad, frescura», **centrado en el mes de verdad**: con cuánto empiezo, los fijos que sé que voy a pagar, lo que
me queda (al tocar los fijos), con cuánto acabaré y cuánto puedo ahorrar **este mes**. Mes a mes y a corto plazo, no
ahorrar a 10 años. Un gasto grande (viaje, ordenador) se apunta y se ve cómo afecta al mes y al ahorro. Bosque y Ahorro
juntos en una sola pestaña. Una línea en Hoy, debajo del cartel de la noche, solo cuando aporte.

## 1. Reglas fijas (romper una = fuera)
1. **Datos inventados**: solo las cifras de abajo. Nada del usuario real.
2. **Un solo archivo HTML** en `maquetas/`, sin librerías, ni recursos ni fuentes externas. SVG/Canvas/JS en línea, sí; JS solo para tocar, sin guardar nada.
3. **412 px de ancho** (`body{width:412px;margin:0}`), nada se sale a lo ancho.
4. Tres pantallas, una debajo de otra, cada una en `<section data-pantalla="1|2|3">` con un rótulo pequeño encima:
   - **Pantalla 1 · Tu mes** (≤915 px de alto: una pantalla del móvil). La portada de Dinero.
   - **Pantalla 2 · Ahorro y Bosque** (≤1.300 px), una sola pestaña; se llega desde la 1 con un toque (salto a la 2).
   - **Pantalla 3 · La línea de Hoy** (≤400 px): un bloque gris que diga «El cartel de la noche» (no lo diseñes) y debajo tu línea, en dos estados: cuando aporta y cuando no (entonces no sale nada; ponlo como rótulo «sin línea hoy»).
   Encima de todo, un cartel con el nombre de la escuela y 2 líneas de la idea.
5. **Accesible**: contraste AA (4,5:1), todo lo tocable ≥44 px de alto, nada solo por color, SVG con `<title>` o `aria-label`, botones de verdad (`<button>`).
6. **Español llano**, sin jerga. Números grandes solo para lo del mes.
7. **5 segundos tras una guardia**: mirando la Pantalla 1 se sabe con cuánto acabarás el mes y cuánto puedes ahorrar.
8. **Los fijos se tocan y aparece «lo que te queda»** (al usuario le encanta ese gesto). Pagados y por pagar se distinguen por forma o texto, no solo por color.
9. **El gasto grande se apunta de verdad en la maqueta**: un botón «Apuntar gasto grande» abre algo (hoja, panel…) con el ejemplo del portátil, se elige «Lo voy apartando» o «Sale de lo ahorrado», y **cambian las cifras** de la Pantalla 1 y de la 2 según la elección. Se puede quitar y vuelve todo.
10. **Libre todo lo demás**: paleta, tipografía (del sistema), forma, metáfora, tono. Prohibido parecer una hoja de cálculo o Fintonic.

## 2. Cifras comunes (comprueba cada cuenta antes de escribirla)
- **El mes va de nómina a nómina: del 25 de octubre al 24 de noviembre. Hoy es miércoles 29 de octubre; quedan 27 días** (hoy incluido).
- **Empiezas el mes con 2.380 €** = 280 € que te quedaban + nómina 2.100 € (base 1.350 + 3 guardias 750).
- **Fijos 728 €/mes**: alquiler 550 (pagado el 1), luz+agua 60 (pagado el 27), móvil+internet 35 (el 5 nov), gimnasio 40 (el 1 nov), Spotify/Netflix 18 (el 10 nov), seguro 25 (el 15 nov). **Pagados 610 · por pagar 118.**
- **Te queda tras los fijos: 1.652 €.**
- Variables: llevas **140 €** gastados; un mes normal son **750 €** (súper 230, comer fuera 180, taxis 90, online 140, ocio 110).
- **Acabarás el mes con ~900 €** (2.380 − 728 − 750 = 902).
- **Puedes ahorrar este mes 700 €**, dejando ~200 € de margen.
- **Para gastar sin tocar ese ahorro: 812 € → unos 30 €/día** hasta el 24 (1.652 − 140 − 700 = 812; ÷27).
- **Colchón** (cuenta de ahorro) hoy **4.200 € = 2,8 meses** de vida (gasto normal 1.478 €/mes = 728 + 750). Con los 700 de este mes, **4.900 € = 3,3 meses**. Objetivo: 6 meses (8.868 €); sale como dato pequeño, no como protagonista.
- **Los últimos meses** (lo ahorrado cada mes): jul 100 · ago 450 · sep 800 · oct 650 (colchón jun 2.200 → jul 2.300 → ago 2.750 → sep 3.550 → oct 4.200).
- **Bosque**: un árbol por mes de colchón (2,8 → 3,3 con este mes); plantones lo que falta hasta 6; los gastos grandes, frutos o lo que encaje en tu mundo.
- **Gasto grande de ejemplo: portátil 1.100 € para diciembre.**
  - «Lo voy apartando»: 550 € en noviembre y 550 en diciembre → **este mes ahorras al colchón 150 €** (700 − 550); colchón 4.350 en nov y 4.500 en dic, con el portátil pagado.
  - «Sale de lo ahorrado»: este mes ahorras los 700 (colchón 4.900); en diciembre ahorras otros 700 y el portátil se lleva 1.100 → **colchón 4.500 € en dic (3,0 meses)**.
  - Las dos acaban en 4.500 € en diciembre; cambia cómo se nota el mes.
- **La línea de Hoy, cuando aporta** (ejemplo): «💶 Te quedan 812 € · 30 €/día hasta el 24» y, si toca, «· mañana pagas el gimnasio (40 €)». Cuando no aporta (todo en orden y nada que pagar), no sale.

## 3. Cómo se elige
**Paso 1 · Oficio (Playwright a 412×915, lo pasa quien preside):** sin errores de JS, nada fuera del ancho, altos de cada
pantalla, tocables ≥44 px, la 1 lleva a la 2, el gasto grande cambia cifras. Si falla, un arreglo por la misma escuela.
**Paso 2 · Filtro del mes (sí/no):** a) en 5 s se ve con cuánto acabas (~900) y cuánto ahorras (700); b) tocar los fijos
da los 1.652; c) el portátil cambia la cifra del ahorro del mes (150 apartando); d) Bosque y Ahorro en una sola pantalla;
e) las cifras cuadran.
**Paso 3 · Jurado haiku a ciegas** (copias `Y1…Y5` barajadas, sin cartel ni `<title>`, con captura de cada pantalla). 0-10:
  - **El mes en 5 segundos** (0-4): ¿se entiende empiezo → fijos → me queda → acabo → ahorro sin leer?
  - **Moderno y chulo, fresco** (0-3): ¿apetece abrirla? ¿se ha visto antes?
  - **El gasto grande se nota** (0-3): ¿se ve cómo el portátil cambia este mes y el ahorro?
**Paso 4 · El Consejo elige** (por delegación): la de más puntos que pase los pasos 1-2; desempata «El mes en 5 s».
Lo bueno de las demás pasa a la ganadora. Artes Visuales la deja navegable a 412×915 → `maquetas/dinero-tu-mes.html`.
