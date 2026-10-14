# Auditoría visual · 3 · Comer

Fase 0 del rediseño artístico. Solo se ha mirado: no se ha tocado `app.js`, `styles.css`, `fig/` ni
las pruebas. Todas las capturas son a **412×915** (el móvil), con datos **inventados** sembrados con
`window.PG`: desayuno de avena, plátano y yogur; tortilla de patata a mediodía; café con leche;
la cena (bocata de pollo) apuntada con una frase; ocho cosas en la nevera (huevos, pollo, leche,
tomates, espinacas, queso fresco, brócoli, yogur) y la semana de ejemplo que trae la app.

Las capturas están en esta misma carpeta. El tema por defecto es **HUD** (oscuro); también se han
mirado **Papel** y **Arena** (claros), **Magenta** y **Bosque**.

| captura | qué enseña |
|---|---|
| `01-hoy-oscuro-completa.png` · `02-…visible` | pestaña Hoy entera y lo que se ve sin desplazar |
| `03-buscador-pollo.png` | el buscador con «pollo» |
| `04-hoja-cena-te-leo.png` | hoja de la cena escribiendo una frase: la tarjeta «Te leo» |
| `05-hoja-cena-apuntado.png` | la misma hoja tras apuntar, con el aviso «Deshacer» |
| `06-ficha-toma.png` | la ficha de una toma (copos de avena) |
| `07-cocina.png` · `12-cocina-plato-con-nevera.png` | Cocina y «¿Qué como?» → Plato |
| `08-plan.png` · `10-plan-hoja-plato.png` · `26-plan-receta.png` | Plan, la hoja de un plato y su receta |
| `09-despensa-compra.png` · `20-…que-tener` · `21-…en-casa` | Despensa: Comprar, Qué tener, En casa |
| `11-nevera.png` | la nevera «a mano» (por caducidad) |
| `22-compra-lista-completa.png` | la compra por pasillos (lista completa) |
| `18-hoy-micros-y-comidas.png` | micros desplegados y las cuatro comidas |
| `19-hoja-como-cocinas.png` | hoja «Cómo cocinas» (⚙️) |
| `23-hoja-lo-que-toca-cocinar.png` · `24/25-hoja-tus-recetas` | cocinar en lote y el recetario |
| `13/14/15-*-papel` · `*-arena` · `16-cocina-magenta` · `17-hoy-bosque` | otros temas |

---

## 1 · Lo que se ve bien y hay que conservar

- **La lista de las comidas del día** (`01`, `18`; `.cjmm`, styles.css:3141). Es lo mejor de la
  sección: etiqueta pequeña en mayúsculas (DESAYUNO), el plato en grande, las kcal a la derecha y la
  proteína debajo; lo pendiente en gris; «en vez de ~~Lentejas~~» tachado. Se entiende de un vistazo
  qué comiste frente a lo que tocaba. El círculo discontinuo (pendiente) → círculo lleno con ✓ es un
  buen gesto. Hay que conservar esta jerarquía.
- **La tarjeta «Te leo»** (`04`). Muy buena idea y buena ejecución: las palabras que ha entendido en
  píldoras verdes (pollo · queso · tomate), el nombre limpio del plato, cada ingrediente con gramos
  editables y «¿era pollo entero? cambiar», Poco/Normal/Mucho y las cuatro cifras. Es la pieza más
  «de app de verdad» de la sección.
- **El buscador agrupado** (`03`): «Tus platos · Lo que compras · Alimentos · Comer fuera», cada uno
  con ración, kcal, proteína y un «+» claro. Las etiquetas «tuyo» y «Hacendado» ayudan.
- **La compra por pasillos** (`22`): Fruta y verdura abierta, el resto plegado con su contador
  «1/2», «0/6»; «ya en casa» en verde y apagado. La lógica de pasillos está bien resuelta.
- **«En casa» con los días que aguanta** (`21`): pechuga «2 d» en ámbar, el resto en gris. Sobrio y útil.
- **La barra de reparto de una toma** (`06`, `.festk`): proteína/hidratos/grasa en azul, ocre y verde,
  con su texto debajo. Los tres colores de macros (`--bp`, `--bc`, `--bg3`) son buenos, distinguibles
  y tienen su versión para tema claro.
- **Los cinco temas funcionan** en lo básico: Bosque y Magenta recolorean bien (`16`, `17`), y Papel y
  Arena se leen limpios (`13-hoy-papel`, `13-hoy-arena`).
- **La hoja que sube desde abajo** (`.hoja`, radio 18 px, asa arriba, fondo oscurecido): es el patrón
  correcto en el móvil y está bien usado en la comida, la ficha, el plato y la receta.

## 2 · Lo que se ve pobre, plano, incoherente o anticuado

### Coherencia y navegación

1. **Dos barras de pestañas distintas para la misma sección.** En la portada se ven
   «Hoy · Cocina · Plan · Despensa» (`.cjseg2`, segmentado dentro de la página). Pero al entrar en
   el buscador, la nevera «a mano», «¿Qué como?» o la lista completa de la compra, aparece **otra**
   fila en la cabecera: «Hoy · Semana · Nevera · Compra» (`#calModes`) con otros nombres y otro
   estilo (botón con degradado) — `03`, `11`, `12`, `22`. Para quien la usa parecen dos apps
   pegadas. Además esa fila se come 42 px más de cabecera (la página empieza en y=121 en vez de 79).
2. **Cada pantalla trae su propio «atrás»**: «‹ atrás» arriba del todo, «‹ Comer», «‹ Hoy», «‹ Plan»
   en la subcabecera… con estilos parecidos pero no iguales.
3. **Tres maneras de dibujar «hecho»**: el círculo con ✓ de las comidas, la casilla cuadrada de la
   compra (`09`) y las píldoras con «✗ / ✓» escritos como texto en «Qué tener» (`20`), donde lo que
   **ya tienes** sale **tachado** (parece borrado o cancelado, al revés de lo que se espera).
4. **Los títulos de tarjeta no siguen una regla**: «PARA HACER HOY», «RACIONES DE HOY», «TU
   NUTRICIONISTA», «EN LOTE», «TUS RECETAS · 16» van en mayúsculas finas de 15 px; «Te sale
   entero», «Combinaciones», «Te falta poco» llevan una rayita de color a la izquierda (`07`);
   «LLEVA» / «PASOS» de la receta, otro tamaño (`25`, `26`). Y los rótulos pequeños de la compra
   («CÓMELO PRIMERO · 1», `11`) van espaciados y en negrita: otro estilo más.

### Letra

5. **Demasiados tamaños de letra.** Solo la pestaña Hoy usa **14 tamaños distintos** entre 9,5 y
   20 px (9,5 · 11 · 11,25 · 11,5 · 12 · 12,5 · 13 · 13,5 · 14 · 14,5 · 15 · 15,5 · 16 · 20); el
   buscador, 10. No hay escala, hay ajustes sueltos. La letra es la del sistema (`system-ui`), sin
   personalidad: nada distingue a Comer de cualquier formulario.
6. **Las cifras no tienen protagonismo.** Las kcal del día (`01`, «639 / 30 g / 68 g / 28 g») son
   texto de 16 px en una fila plana, igual que un pie de página. No hay nada que diga «vas por aquí»
   (ni anillo, ni barra contra el objetivo). La tarjeta del Plan dice «proteína: sin objetivo» en el
   sitio donde debería estar el número más importante (`08`).
7. **Texto que se parte mal:** en «Cocinar esta semana» la palabra «raciones» se rompe en
   «raci / one / s» por falta de ancho (`23`). En «Tus recetas», «16 g P» salta de línea y deja la
   «P» sola (`07`).

### El Plan se corta

8. **Las casillas del Plan cortan justo lo que importa** (`08`): «Lentejas estof…», «Salmón al
   horno …», «Pollo al curry con…». Las 14 casillas miden 134×33 px y **todas** están cortadas
   (medido). Los números de la derecha (154, 140, 118) no llevan unidad: hay que leer la leyenda de
   abajo («g proteína») para saber qué son. Los puntitos de color (cocinas / táper / congelado)
   miden 6 px y son difíciles de distinguir.

### Iconos: emoji por todas partes

9. **Los iconos son emoji del sistema** (🛒 🍳 🎯 📖 🍔 🥡 🧊 ❄️ ⚙️ 📷 ✍️ 🥬 🍗…). En el buscador hay
   22 emoji en una pantalla y en la compra completa 19 (`03`, `22`). Problemas:
   - cambian según el móvil (Android, iPhone, la versión), así que el diseño no es nuestro;
   - no siguen el tema: en Papel o en Magenta siguen siendo los mismos dibujos de colores;
   - se repiten sin informar: en la compra cada fila de fruta lleva el mismo 🥬 a la derecha;
     en el buscador, todo lo que es pollo lleva el mismo muslo 🍗 (pollo asado, alitas, pollo al
     limón);
   - conviven con los iconos dibujados de la app (la lupa y las flechas de `gymIco`, que sí son
     trazo fino y siguen el color). Hay dos familias de iconos a la vez.
   - El **⚙️** de la esquina de las pestañas es un emoji en color sobre un botón oscuro: es lo que
     más «canta» en la cabecera y es lo menos importante.

### Colores, sombras y bordes

10. **Colores fijos que no obedecen al tema.** En la zona de Comer de `styles.css` (líneas 3028–3200)
    aparecen a mano `#34d399` (12 veces), `#fbbf24` (5), `#f87171`, `#04121c`… en vez de `--ok`,
    `--warn`, `--bad`. Por eso el ✓ de las comidas es siempre verde menta, también en Arena o
    Bosque, y la tarjeta «Para hacer hoy» tiene siempre el borde ámbar.
11. **Todo es la misma tarjeta.** Fondo `--card` al 88 %, borde de 1 px `--line`, radio 16 px y la
    misma sombra difusa. La comida del día, una lista de 20 cosas que comprar y un botón de
    preferencias pesan lo mismo. Solo «Tu nutricionista» se distingue (borde del color de marca).
12. **Radios a ojo.** En esa misma zona hay 12 radios distintos (5, 7, 8, 10, 11, 12, 13, 14, 16, 18
    px, 50 % y 99 px). Se nota en los botones: «Foto del ticket» (14), el segmentado (13/10),
    «Montar los huecos» (12), las píldoras (99).
13. **El degradado de marca se usa para todo.** Cian→violeta en «Añadir a la cena», «Añadir fruta»,
    «Apuntar», «Me lo hago», «Ya he comprado», «Montar los huecos», la pestaña activa… Cuando todo
    brilla, nada destaca. En Arena el degradado naranja→verde petróleo de «Añadir fruta» se ve sucio
    (`13-hoy-arena`).
14. **Fallo visual (global, se ve en Comer):** en los temas claros aparece una **franja gris
    sucia en el borde derecho** de toda la pantalla (`13-hoy-papel`, `14-plan-papel`,
    `15-despensa-papel`). Es la sombra del cajón «Más» cerrado (`#drawer`, `box-shadow:
    -18px 0 50px -20px rgba(0,0,0,.7)`), que asoma aunque esté fuera de la pantalla. En oscuro no
    se nota; en claro sí.
15. **La ficha de una toma tiene un hueco vacío** en la fila de botones de abajo: «− tamaño +» ·
    «mover a…» · **[caja vacía]** · «borrar» (`06`). Es el `<span>` que deja sitio a «guardar
    plato» cuando la toma no viene de una frase, y se pinta como un botón sin texto.

### Espaciado, densidad y tacto

16. **Botones pequeños para el dedo.** En Hoy, 14 de 23 botones miden menos de 44 px en algún lado:
    el círculo de cada comida es de **28×28**, «Añadir a la cena» y «Añadir fruta» **30 px** de
    alto, las flechas del día 38×38. En «Qué tener» son 42 de 45; en la hoja del plato, 30 de 40.
17. **Pantallas largas sin ritmo.** Hoy ocupa 1,6 pantallas; el buscador, 2; la compra completa, 1,9;
    Despensa → Comprar, 1,6 para 20 renglones casi idénticos («120 g Boniato», «30 g Cebolla»…) de
    45 px cada uno. Es una tabla, no una lista de la compra: no hay agrupación ni nada que dé gusto
    tachar.
18. **Las comidas, que son lo principal, empiezan por debajo del primer pantallazo** (`02`): antes
    van el buscador, el día, «Para hacer hoy», las cifras, las raciones y el nutricionista. Lo que
    has comido hoy aparece a 870 px.
19. **Los micros** (`18`) son seis barritas de 28 px de alto con etiquetas de 9,5 px; como casi
    todo está bajo, se ven seis rayas naranjas casi iguales. Plano e ilegible.
20. **La receta es un muro de texto** (`25`, `26`): «LLEVA» con nueve renglones y «PASOS» numerados
    con un «1» en negrita. Ni una imagen, ni tiempo por paso, ni cantidades destacadas.

### Movimiento

21. **Casi no hay movimiento, y el que hay no cuenta nada.** La página entra con un fundido
    (`#main.in`) y las hojas suben; nada más. Marcar una comida, apuntar una frase o tachar algo de
    la compra no tiene ninguna respuesta visual salvo el aviso de abajo. En todo `styles.css` hay 7
    animaciones definidas; ninguna es de Comer. Sí se respeta «reducir movimiento» (6 reglas): hay
    que mantenerlo.
22. **El aviso de abajo tapa lo que acabas de tocar**: «Mantén pulsado un día…» y «añadido: Bocata…
    Deshacer» salen como una cápsula oscura encima de los botones de la tarjeta (`05`, y en la
    primera pasada salía sobre «Añadir fruta»).

## 3 · Tres ideas para llevar Comer «a otro nivel»

Las tres reutilizan lo que ya existe en el repositorio: la app ya mete figuras isométricas hechas con
la skill **anatomy** (el sueño, la estación de Hoy, la cochera de Semana, el tablero del Mes en
`fig/`). Comer es la única sección grande que no tiene ninguna.

### Idea 1 · «La cocina por dentro»: la nevera isométrica como portada de Despensa

Sustituir la cabecera de Despensa (los tres botones «Foto del ticket / Código / A mano») por **una
nevera isométrica abierta**, dibujada con la skill anatomy al estilo del armario de cajones o de la
máquina recreativa de sus ejemplos: carcasa con cuatro tonos de sombra, bisagras, burletes, baldas
de cristal, cajón de verduras, puerta con estantes, y el congelador abajo.

- **Cada cosa de «En casa» es una pieza pequeña en su balda**: el cartón de huevos, la bandeja de
  pollo, el brick de leche, los tápers con su tapa de color. Las cantidades salen del mismo dato
  (`despensaS()`): si quedan 2 huevos de 6, se ven 2 huecos llenos y 4 vacíos.
- **Lo que caduca brilla**: la pechuga de «2 d» lleva un halo ámbar que late despacio; lo que
  caduca hoy, rojo. Tocar una pieza abre su hoja (gastar, cuánto queda, qué cocinar con ella).
- **Los tápers de lo cocinado** van en su balda con una etiqueta de día («lun», «mar»), y los que
  están en el congelador, con escarcha (un brillo frío, sin texto).
- **La lectura en vivo** de la figura (la tarjeta de la skill lleva título, pista y una lectura):
  «8 cosas · 1 caduca en 2 días · te sale: pechuga con brócoli».
- **Abrir la puerta** es el gesto de entrar: la puerta gira con una curva suave y se enciende la
  luz de dentro (la skill trae luces de lámpara en WebGL; aquí bastaría un degradado). Con
  «reducir movimiento», la nevera sale ya abierta.
- La compra por pasillos puede tener su gemela: **un carro o una bolsa** que se va llenando a medida
  que tachas, y que al pulsar «Ya he comprado» vacía su contenido en las baldas.

### Idea 2 · Iconos con vida propia: un juego de 30 iconos dibujados que reaccionan al estado

Cambiar todos los emoji de Comer por **una familia propia de iconos** de trazo fino (la misma línea
que la lupa y las flechas de `gymIco`), que siguen el color del tema y **se mueven según lo que
pasa**, siempre corto (≤ 1 s) y nunca en bucle salvo que haya algo pendiente:

- **La taza del café humea** mientras es la hora del desayuno y no lo has apuntado; al apuntarlo,
  el humo se va y la taza queda llena.
- **El plato se llena**: el círculo de cada comida (hoy un ○ de 28 px) pasa a ser un plato visto
  desde arriba, más grande (44 px), que se rellena por sectores del color de cada macro al apuntar
  (azul proteína, ocre hidratos, verde grasa). Vacío = pendiente; lleno = hecho; con otro dibujo
  = «otra cosa». Es el mismo dato de `.festk`, hecho dibujo.
- **El táper** cierra la tapa con un clic al cocinar en lote; con escarcha si va al congelador.
- **La sartén** chisporrotea en «Lo que toca cocinar» el día que toca.
- **El carro** se inclina y suelta un «+1» al añadir a la compra; **la bolsa** se cierra al
  terminarla.
- **La nevera pequeña** de la pestaña Despensa entreabre la puerta si algo caduca hoy.
- **Grupos de alimento con dibujo propio** (ave, pescado, legumbre, huevo, lácteo, verdura, fruta,
  pan, cereal, bebida…) en vez de un 🍗 para todo lo que es pollo.
- **El ⚙️ de color** se sustituye por un icono de trazo, en gris, que no compita.

Esto, además, arregla el punto 9 (que cada móvil pinte otros emoji) y el 10 (colores fijos).

### Idea 3 · «El plato del día»: la portada de Hoy como una mesa puesta

Hoy es una pila de tarjetas iguales. Propuesta: arriba del todo, **una figura de la mesa del día en
isométrico**: un mantel con cuatro sitios (desayuno, comida, cena y picoteo) y el objetivo del día
como **una bandeja-medidor** (o una balanza de cocina con aguja, en la línea del reloj comparador de
los ejemplos de anatomy).

- **Cada sitio tiene su plato real a escala**: vacío, con la sombra de lo que tocaba (el plan, en
  gris transparente), o lleno con lo que comiste. Tocar un plato abre la hoja de esa comida.
- **La balanza o el medidor** marca kcal y proteína frente al objetivo: la aguja se mueve con una
  curva suave al apuntar algo, y la cifra grande («1.225 de 2.166 kcal · 72 g de proteína») pasa a
  ser el número protagonista que hoy no existe (punto 6).
- **Las raciones de verdura y fruta** (hoy dos barras planas) se ven como piezas en un frutero:
  3 huecos de verdura, 2 de fruta; se llenan al comerlas.
- **La hora del día cambia la luz** de la escena (mañana fría, mediodía blanca, noche cálida), como
  ya hace la franja del sol en el Calendario.
- Los días de **guardia**, la mesa se convierte en una bandeja de hospital con el táper: el mismo
  dibujo, otro decorado. Es el detalle que la hace suya.
- Debajo, la lista de comidas de siempre (`.cjmm`, que funciona), para leer con detalle.

Las tres ideas se pueden hacer por tandas (iconos primero, luego la nevera, luego la mesa) y las dos
figuras tendrían versión clara y oscura, como `fig/sueno.html` y `fig/sueno-light.html`.

### Arreglos de base que conviene hacer sea cual sea la idea

- Una sola barra de pestañas en Comer (quitar la segunda fila de la cabecera en sus sub‑pantallas).
- Escala de letra de 5–6 tamaños y radios de 3 (pequeño, medio, hoja).
- Colores de estado siempre desde `--ok`, `--warn`, `--bad`.
- Plan con los nombres enteros (dos líneas o nombre corto) y la unidad en el número.
- Botones de 44 px mínimo, empezando por el ✓ de cada comida y los «Añadir…».
- Quitar la sombra del cajón cerrado y la caja vacía de la ficha de una toma.

## 4 · Los tokens visuales que usa Comer (styles.css)

**Colores generales** (`:root`, líneas 2–7; claro en `html:not(.dark)`, 9–14; cada tema los cambia
desde `app.js:379` y siguientes con `ponerTema`):

| token | HUD (oscuro) | claro por defecto | para qué |
|---|---|---|---|
| `--bg` / `--bg2` | `#070b14` / `#0b1120` | `#eef2f9` / `#e6ecf7` | fondo y fondo de botones |
| `--card` | `#111a2b` | `#ffffff` | tarjetas (al 88 % de opacidad) |
| `--ink` / `--ink2` | `#e9f2ff` / `#8fa6c6` | `#0d1729` / `#5a6d8a` | texto y texto secundario |
| `--line` | `#1e2b44` | `#dbe4f2` | bordes y separadores |
| `--brand` / `--brand2` | `#38e1ff` / `#7c5cff` | `#2563eb` / `#7c3aed` | marca y degradado de botones |
| `--accent` | `#a3e635` | `#15803d` | apenas se usa en Comer |
| `--ok` / `--warn` / `--bad` | `#34d399` / `#fbbf24` / `#fb7185` | `#15803d` / `#b45309` / `#be123c` | estados (Comer los repite a mano) |

**Colores de macros** (styles.css:2686–2687, en `.cje`, `.fehoja`, `.h2`…):
`--bp` proteína `#3987e5` (claro `#2a6fc4`) · `--bc` hidratos `#c98500` (`#946200`) ·
`--bg3` grasa `#199e70` (`#127a56`) · `--bx` «por debajo» `#d95926` (`#b8461a`).

**Colores fijos dentro de Comer** (3028–3200, sin token): `#34d399` ×12, `#fbbf24` ×5, `#04121c` ×4
(texto sobre botón lleno), `#f87171` ×2, y sueltos `#fcd34d`, `#fca5a5`, `#fb7185`, `#c4b5fd`,
`#93c5fd`, `#6ee7b7`, `#4a1d24`, `#3b2f14`, `#2a2440`.

**Radios:** `--r: 16px` en `.card`; en Comer además 5, 7, 8, 10, 11, 12, 13, 14, 18 px, 50 % y
99 px. Hojas, 18 px.

**Sombras:**
- `--shadow` (oscuro): `0 1px 0 rgba(255,255,255,.04) inset, 0 18px 40px -22px rgba(0,0,0,.9)`;
  claro: `0 1px 2px rgba(15,23,42,.05), 0 10px 26px -16px rgba(15,23,42,.22)`.
- `--glow`: aro de 1 px del color de marca + resplandor; lo llevan «Tu nutricionista», el buscador y
  los botones con degradado.
- Botón activo de la barra: `0 8px 22px -12px` del color de marca.

**Fondo de página:** dos manchas radiales de `--brand` y `--brand2` y una rejilla de 44 px que se
desvanece hacia abajo (`body::before` / `body::after`). Da el aire «HUD».

**Letra:** `system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial` a 15 px/1,5, con cifras
de ancho fijo (`tabular-nums`). Sin fuente propia. Rótulos en mayúsculas con espaciado `.12em`
(`.cjmm .k`). Tamaños medidos en Hoy: de 9,5 a 20 px, 14 distintos.

**Clases propias de la sección:** `.cjtop`/`.cjseg2.c4` (pestañas), `.cjbusca`, `.cjdia`,
`.cjtodo`/`.cjtd`, `.cjml`/`.cjmm`/`.cjq` (comidas), `.cjwk` (Plan), `.cjq3`/`.cjalt` (Cocina),
`.cjdsp`/`.cjdsph` (Despensa), `.frase`/`.frlect` (frase y «Te leo»), `.buscador`/`.ftab`/`.chipx`
(buscador), `.fehoja`/`.festk` (ficha), `.h2mic6` (micros), `.hoja` (hojas).

**Movimiento:** fundido de entrada de `#main`, subida de las hojas y transiciones de color de
0,18 s en botones. Nada propio de Comer. 6 reglas de «reducir movimiento».

---

### Lo que no se pudo comprobar

- La **foto del ticket** y el **escáner de código** (necesitan cámara) y la búsqueda en Open Food
  Facts (sin red en este entorno): solo se vieron sus botones.
- No se probó en un móvil real, solo en Chromium a 412×915; los emoji pueden verse distintos en el
  teléfono del usuario (es justo uno de los problemas señalados).

### Supuestos

- «La compra por pasillos» es la lista completa que abre «ver la lista completa ›» (`22`); en la
  pestaña Despensa → Comprar la lista sale por orden alfabético, sin pasillos.
- Se tomó HUD como tema principal porque es el que viene por defecto; los demás se miraron por encima.
- Los 44 px como tamaño mínimo para el dedo es la referencia habitual de los móviles; la app no fija
  ninguna.
