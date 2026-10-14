# Auditoría visual · 1 · Hoy (conductor, estación, carretera y tarjetas)

Fase 0 del rediseño artístico. Este informe solo mira: no se ha tocado `app.js`, `styles.css`, `fig/` ni las pruebas.

**Cómo se ha mirado.** Navegador sin pantalla a **412×915** (el móvil del usuario), con el reloj del navegador fijado a
distintas horas del miércoles 14 de octubre de 2026 y datos **inventados**: un día de trabajo de 8 a 15, desayuno
apuntado, entreno «Torso A» a las 18:30, «Inglés online» a las 21:00, 4 hábitos (agua, leer, estirar, sin móvil en la
cama) con 2 semanas de registro, guardias el 16, el 25 y el 1, un curso dentro de 9 días y una cena con amigos dentro de 3.
Se han capturado los 5 temas. Las capturas están en esta misma carpeta (lista al final).

---

## 1. Lo que se ve bien y hay que conservar

**El conductor (`fig/conductor.js`) es la pieza con más alma de la app, y la idea aguanta muy bien.**

- **La metáfora es redonda**: el día es una línea de autobús, cada cosa es una parada con su letrero, las noches son la
  cochera, la guardia es servicio nocturno. Se entiende sin explicación (capturas `02`, `04`, `08`).
- **Los mandos son la interfaz**: la **palanca R · N · D** para ayer, hoy y mañana es la mejor idea de toda la pantalla; la
  **máquina de billetes** es «Para hoy», la **radio** es el sueño (KSS, ánimo, cafés) (`07`), los **retrovisores** sirven para
  mirar a los lados. Arrastrar el parabrisas para mover la hora es un gesto natural.
- **El modo guardia** cambia la cabina de verdad: panel y parasol en rojo, mangas de bata blanca, el busca con su LED que
  parpadea, el letrero «☾ GUARDIA · sales 09:00» (`14`). Es el estado mejor resuelto de la app.
- **La luz del día es creíble**: sol, luna, estrellas, farolas que se encienden, ventanas iluminadas por la noche (`04`, `08`, `14`).
- **Mirar a los lados en casa** (cocina con la nevera y sus pósits, el tablón «Lo que viene», el dormitorio con el
  tablón de hábitos y la bolsa del gimnasio) tiene encanto y personalidad (`21`, `22`).
- **Los colores de las paradas dentro del dibujo** forman una familia coherente: jornada rojo teja, guardia azul noche,
  comida verde, entreno violeta, planes turquesa, y el ámbar para «lo que toca ahora».
- **Movimiento tranquilo**: la hora sigue al dedo con un seguimiento exponencial (0,45 s), el humo y la ascua del mirador,
  el LED del busca; y todo se para con «reducir movimiento». Se respeta.

**La estación isométrica (`fig/estacion.js`)** ya está hecha con el kit de /anatomy: sombreado a cuatro tonos, orden de
pintado correcto, casa en corte con el conductor dentro, autobuses-evento aparcados en sus andenes, de noche un faro y la
ciudad apagada (`11`, `12`). Es lo más «premium» de la sección.

**La carretera del mes (`fig/carretera.js`)**: la guardia como **túnel**, el finde libre como **área de descanso**, cada
día un **mojón**, la tira del mes arriba. Metáforas buenas y coherentes con el conductor (`13`, `27`).

---

## 2. Lo que se ve pobre, plano, incoherente o anticuado

### 2.1 Encima del dibujo hay demasiado texto y demasiado «botón»
- Antes de que empiece el dibujo hay **344 px** (el 38 % de la pantalla): la barra fija (121 px), el título
  «☀️ Hoy · Miércoles 14 de octubre», «‹ Mar / Jue ›», el botón 🌿, «＋ Añadir», un **aviso permanente** «ℹ️ «Semana» está
  en modo plantilla…» con su botón, el estado «💼 Día de trabajo · 8–15» y el selector de cuatro modos (`02`).
- Por la mañana la tira de la salida (6:50 → 7:31) empuja el dibujo hasta **y = 627**: en la primera pantalla solo se ven
  **288 px** del conductor (`01b`).
- **Cuatro píldoras con el mismo degradado cian→violeta** a la vez (Calendario, Hoy, 🌿 ✓, Conductor) compiten con el
  dibujo por la atención (`02`). El degradado se usa en `nav button.on`, `.calmodes button.on`, `.btn.p` y `.hoyseg button.on`:
  pierde fuerza porque está en todo.

### 2.2 Iconos: cuatro familias distintas en un mismo sitio
- El selector mezcla un emoji a color (🚌), otro emoji que no casa con la idea (🏗, una grúa de obra para «Estación») y
  dos símbolos de texto monocromos (◷, ☰) (`02`, `styles.css` `.hoyseg`).
- En la pantalla hay emojis en el título (☀️), en el estado (💼), en el asistente (🧘, 🏦, 💧) y **dentro del propio
  dibujo** (📻 RADIO SUEÑO, ☕, 🚲 «a casa en bici», 😣😕😐🙂😄 del ánimo). Los emojis salen con la fuente del móvil
  (en Android, la de Google), así que dentro del dibujo parecen pegatinas de otro estilo (`07`).

### 2.3 Letra demasiado pequeña dentro del dibujo
El dibujo está hecho a 600 px de ancho y se pinta a 376: todo se encoge al **62,7 %**. Tamaños reales en el móvil:

| Texto del salpicadero | Tamaño en pantalla |
|---|---|
| «LÍNEA DE HOY», «PRÓXIMA PARADA», «anoche 6,7 h» | **6,0 px** |
| «PARA HOY · 2», «0 de 2 hechas», «📻 RADIO SUEÑO», «✓ 07:00 Desayuno» | **6,9 px** |
| «Ahora: Trabajo · hasta 15:00», «18:00 Comida en casa» | 7,5–7,8 px |
| «◀ eventos», «entreno ▶» | 8,1 px |
| R · N · D | 9,4 px |
| La hora grande | 18,8 px |

El resto de la interfaz va a 11,5–16 px. Lo que más se lee del salpicadero está **por debajo de 8 px**. En la carretera,
la mayoría de rótulos va entre 1,8 y 7,5 px (`27`).

### 2.4 Fallos visibles (no son gusto: conviene comprobarlos como fallos)
- **Tema claro: la línea «Ahora: Trabajo · hasta 15:00» desaparece**: texto casi blanco sobre la pantalla blanca, y la
  línea ámbar de debajo apenas se lee (`26-zoom-lcd-claro-papel`, también `15`, `16`, `19`). Pasa en Papel y en Arena.
- **Mirar a los lados ignora la hora**: a las 21:40, de frente es de noche con estrellas, pero a la izquierda y a la derecha
  hay **sol y cielo azul** (`09`, `10`).
- **Rótulos que se pisan en la carretera**: «3 COMIDAS» tapa otro cartel («…MIDAS»), la línea «7:00 · 18:00 · 19:15» se
  sale de su placa y el cartel de la guardia roza los bordes (`27`).
- **Abajo de la carretera sobran ~100 px** de salpicadero vacío con medio volante que no hace nada (`13`).
- **La burbuja «💡 Mantén pulsado un día para cambiar qué es o añadir algo»** se pone encima de la palanca y del salpicadero
  (`14`, y la primera captura sin datos). Es un globo genérico, con la letra del sistema, encima del dibujo.
- Tras tocar el dibujo aparece **un marco blanco** alrededor (`05`, `06`, `07`). En la captura viene del clic simulado; hay que
  mirar si en el móvil también sale.
- **«PRÓXIMA PARADA» con «Ahora: Trabajo»**: a las 11:00 la pantallita dice «PRÓXIMA PARADA · 11:00» (la hora actual) y
  debajo «Ahora: Trabajo», con la carretera vacía delante. Se lee como si fueras de camino, no en el trabajo (`02`).
- *Dato raro, fuera del dibujo*: con el entreno a las 18:30, «Comida en casa» se pone a las **18:00** (sin entreno salía a las
  15:20). Conviene que lo mire quien lleve Comer.

### 2.5 Los temas no llegan al dibujo, y los colores de las cosas cambian según la vista
- **Magenta y Bosque** solo cambian la ropa de alrededor (botones, bordes, fondo); el conductor es idéntico (`17`, `18`).
  En los temas claros el dibujo se pone gris azulado claro, pero el parabrisas y la escena siguen igual (`15`, `16`).
- **El mismo entreno tiene dos colores**: violeta `#7a5cf0` en el conductor y cian `#22d3ee` en el Reloj del tema HUD
  (`24`). La jornada es rojo teja `#d9573f` en el conductor y ámbar `#f59e0b` en el Reloj. Al cambiar de modo, el código de
  colores cambia.
- «💼 Día de trabajo · 8–15» va en el color del turno (cian claro): en los temas claros apenas contrasta (`15`).

### 2.6 Dos estilos que no se hablan: dibujo cálido y detallado frente a una interfaz «HUD» genérica
- **La interfaz es «ciencia ficción de panel»**: fondo con rejilla de 44 px y dos manchas de luz (`body::before/::after`),
  tarjetas de cristal esmerilado con un brillo diagonal (`.card::before`), una raya con resplandor delante de cada título
  (`.card>h2::before`), degradados cian→violeta. **El dibujo es un mundo ilustrado**: ladrillo, teja, asfalto, madera,
  bata blanca. Son dos idiomas distintos.
- **Una tarjeta dentro de otra**: el dibujo va dentro de la tarjeta grande de Hoy, con su borde y su esquina de 14 px, dentro
  de otra esquina de 16 px. El dibujo no llega al borde: queda «enmarcado como una foto» en vez de ser la pantalla.
- **Debajo del dibujo, tarjetas sin personalidad**: el asistente («Dos días sin estirar…», «¿Cuánto tienes en el banco?»)
  son filas de texto con un emoji delante, chips redondos y una × cuadrada (`01b`, `02b`). No tienen nada del mundo del conductor.
- **La estación sí usa el idioma de /anatomy (líneas finas, sombreado a cuatro tonos)**, el conductor usa formas planas con
  degradados de perspectiva, y la interfaz usa cristal y neón: **tres lenguajes** en una sola pantalla (`11b`).
- **La estación, de día, va sobre un rectángulo azul pálido** con el borde cortado a pico y un pie de foto en texto plano
  («11:00 · Trabajo · hasta las 15:00…») (`11`). El dibujo es bueno, el marco no.

### 2.7 Letra, peso y jerarquía
- Solo hay una familia: la del sistema (`system-ui`). Dentro de los dibujos, `ui-sans-serif` y `ui-monospace`. **No hay una
  letra con carácter** ni una letra de «pantalla digital» para las horas.
- **Casi todo va en negrita**: títulos 800, botones 700, selector 800, letreros 800–900. Si todo grita, nada destaca: la hora
  y lo que toca ahora no se separan del resto.
- Muchos títulos en MAYÚSCULAS espaciadas pequeñas («PRÓXIMA PARADA», «LÍNEA DE HOY», «RADIO SUEÑO»), que a 6 px no se leen.

### 2.8 Escenas más pobres que el resto
- **La casa en primera persona** (desayuno, comida) es una caja en perspectiva con pocas cosas: una ventana, un armario, una
  cafetera, un plato y dos manos (`01b`, `03`). Al lado de la calle o de la guardia se queda corta.
- **La casa de noche, durmiendo** es casi negra, con unas «Z z z» grises enormes y planas, de dibujo prediseñado (`23`).
- **Movimiento**: fuera de arrastrar la hora, el dibujo está casi quieto: el autobús no vibra, la carretera no corre, las
  manos no se mueven, los indicadores no «respiran». Solo se mueven el humo, la ascua y el LED. *(Esto se ha visto leyendo el
  código y con capturas fijas: no se ha grabado vídeo.)*
- **Peso**: `fig/estacion.js` pesa **642 KB** (el dibujo entero va dentro como texto) y por eso sale «montando la estación…»
  la primera vez. `conductor.js` 121 KB, `carretera.js` 28 KB. El conductor tiene ~830 elementos dibujados a las 11:00.

---

## 3. Tres ideas ambiciosas para llevar Hoy «a otro nivel»

### Idea 1 · «La cabina es la app»: un solo idioma, el del salpicadero
Que **la interfaz alrededor salga del mismo mundo que el dibujo**, en vez de ser cristal y neón.
- Las tarjetas de debajo pasan a ser **piezas del salpicadero**: chapa lacada con tornillos en las esquinas, cristales de LCD,
  etiquetas de rotuladora (Dymo) para los títulos, testigos de luz. El asistente sería **un papel que sale de la máquina de
  billetes**; el banco, **una hucha en la guantera**.
- El selector Conductor · Estación · Reloj · Línea se convierte en **un mando giratorio de cuatro posiciones** dibujado, con su
  «clic».
- **Una letra digital de verdad** para horas y números (por ejemplo, una tipografía de pantalla tipo LCD/segmentos, o una mono
  con carácter de Google Fonts) y una sans humanista para el texto. Menos negrita: la hora y «lo que toca» como únicas voces altas.
- **El dibujo a sangre**: sin tarjeta alrededor, de borde a borde, y la cabecera de Hoy reducida a una línea (fecha + palanca
  R·N·D) porque la palanca ya hace de «‹ Mar / Jue ›». El aviso de «modo plantilla» se va a Ajustes.
- **Letra mínima de 11 px reales** dentro del dibujo: el salpicadero se dibuja a la escala del móvil (o se agranda su parte
  baja), no a 600 px encogidos.

### Idea 2 · «La maqueta del día»: la estación como pieza Hero de /anatomy, que se desmonta
Llevar la estación al nivel de los ejemplos del kit (test-rig, arcade, Raptor): **una maqueta de verdad sobre un banco de
trabajo**, de 80–150 piezas.
- El día como **una plataforma giratoria** (como las de las cocheras de tren) con 24 andenes-hora: al arrastrar, gira la
  plataforma y el autobús de «ahora» entra en el andén iluminado. La hora se lee en **un reloj de estación con aguja real**.
- **Se desmonta** como el motor Raptor: un toque largo separa la maqueta en capas — el **sótano-cochera** (sueño, con la
  persiana a la altura de lo dormido), la **planta del hospital** (jornada o guardia), la **cantina** (comidas, con táperes
  que se llenan al apuntar), el **parque** (entreno, con discos en la barra según las series hechas).
- **Luz real**: el sol sale y se pone a su hora (ya se sabe `sol`), y de noche una capa de luz (WebGL, como el «lamp light»
  del kit) enciende farolas y ventanas en la misma perspectiva. Sin WebGL o con «reducir movimiento», la versión SVG fija.
- **La carretera del mes en el mismo idioma isométrico**: una **maqueta alargada** con mojones de piedra, el túnel de la
  guardia excavado en una montaña, el área de descanso con sus mesas; se desliza con el dedo como una cinta.
- Un detalle importante: hacerla **más ligera** que ahora (geometría fija precalculada y comprimida, o cargada por partes) para
  no volver a los 642 KB.

### Idea 3 · «Iconos con vida propia» y una pantalla que cambia de clima con tu día
Sustituir **todos los emojis** por una familia de iconos dibujados en el mismo estilo (sombreado a cuatro tonos, pequeños
objetos isométricos), y que **reaccionen al estado**:
- **Sueño** = un **depósito de combustible** con aguja: se llena con lo dormido, tiembla en reserva tras una guardia.
- **Café** = una taza con vapor: un hilo por café; a partir del «último café» el vapor se vuelve gris y la taza se enfría.
- **Entreno** = una mancuerna que **rebota** suave cuando falta menos de una hora y se queda quieta, con un ✓ grabado, cuando
  está hecho.
- **Hábitos** = **testigos del salpicadero** (como los del coche): apagados, en ámbar parpadeando cuando toca, verdes fijos al
  marcarlos; la racha como un **cuentakilómetros** de rodillos que gira.
- **Comida** = un táper que se llena por capas con las kcal y la proteína.
- **Guardia** = el busca, que vibra (no solo el LED) en la víspera.
- **El clima de la pantalla entera sigue al día**: el fondo de la app (hoy rejilla y manchas cian) pasa a ser **el cielo de la
  hora** (alba, mediodía, atardecer, noche), y en guardia **toda la interfaz** —no solo la cabina— entra en modo servicio
  nocturno, con el rojo de la bata.
- **Los temas mandan también en el dibujo**: las variables `--cd-*` y `--anatomy-*` se derivan de `--brand`/`--bg` del tema, y
  **los colores de cada cosa se fijan una vez** (jornada, guardia, comida, entreno, planes) para que sean iguales en Conductor,
  Estación, Reloj, Línea, Semana y Mes.
- Todo con movimiento tranquilo y **quieto con «reducir movimiento»**, como ya hace el conductor.

---

## 4. Tokens visuales que usa esta sección (tal como están)

### `styles.css` · variables generales (`:root`, tema oscuro de serie «Noche HUD»)
```
--bg:#070b14  --bg2:#0b1120  --card:#111a2b  --ink:#e9f2ff  --ink2:#8fa6c6  --line:#1e2b44
--brand:#38e1ff  --brand2:#7c5cff  --accent:#a3e635  --ok:#34d399  --warn:#fbbf24  --bad:#fb7185
--r:16px
--shadow:0 1px 0 rgba(255,255,255,.04) inset,0 18px 40px -22px rgba(0,0,0,.9)
--glow:0 0 0 1px color-mix(in srgb,var(--brand) 26%,transparent),0 14px 34px -20px color-mix(in srgb,var(--brand) 60%,transparent)
```
### `styles.css` · tema claro (`html:not(.dark)`)
```
--bg:#eef2f9  --bg2:#e6ecf7  --card:#ffffff  --ink:#0d1729  --ink2:#5a6d8a  --line:#dbe4f2
--brand:#2563eb  --brand2:#7c3aed  --accent:#15803d  --ok:#15803d  --warn:#b45309  --bad:#be123c
--shadow:0 1px 2px rgba(15,23,42,.05),0 10px 26px -16px rgba(15,23,42,.22)
```
### Los 5 temas (`app.js`, `TEMAS`): `v` = interfaz, `f` = colores de la franja (sueño · trabajo · guardia · comida · entreno · evento)
```
hud      bg #070b14 card #111a2b brand #38e1ff brand2 #7c5cff | f #7c5cff #f59e0b #ef4444 #10b981 #22d3ee #e879f9
magenta  bg #12081a card #1f1230 brand #f050c8 brand2 #8b5cf6 | f #6d5dfc #f59e0b #f43f5e #34d399 #38bdf8 #f050c8
bosque   bg #06120e card #10241c brand #34d399 brand2 #2dd4bf | f #818cf8 #fb923c #f87171 #facc15 #2dd4bf #f0abfc
papel    bg #eef2f9 card #ffffff brand #2563eb brand2 #7c3aed | f #6366f1 #d97706 #dc2626 #059669 #0891b2 #c026d3   (claro)
arena    bg #f5efe4 card #fffcf6 brand #c2410c brand2 #0f766e | f #4f46e5 #ea580c #b91c1c #15803d #0e7490 #a21caf   (claro)
```
### Fondo, tarjetas, botones y piezas de Hoy (`styles.css`)
```
body          font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,…; tabular-nums
body::before  dos radial-gradient (brand 22 %, brand2 18 %) + linear-gradient(bg→bg2)
body::after   rejilla de 44 px en brand 9 %, opacidad .5, con máscara radial
.card         fondo card 88 %, borde 1px var(--line), radio var(--r)=16px, var(--shadow), padding 14px 15px, blur(10px)
.card::before brillo diagonal linear-gradient(160deg, brand 9 %, transparente 42 %)
.card>h2      14px, peso 800, letter-spacing .03em; ::before raya 3×15 px con degradado brand→brand2 y resplandor
.btn          13px/700, padding 7px 13px, radio 11px; .btn.s 12px, padding 5px 9px, radio 9px
.btn.p        linear-gradient(94deg, brand, brand2 80 %), texto #051018 (blanco en claro)
nav button.on / .calmodes button.on   el mismo degradado; radio 999px / 10px
.hoyseg       fondo card, borde line, radio 99px, padding 3px; botones 13px/800 (12.5px en .h4), min-height 36px
.hoyseg button.on  linear-gradient(90deg, brand, brand2), texto #04121c
.hoyest       16px/800 (color del turno)
.tag          11px/700, radio 999px; b1 bad 18 %, b2 brand 18 %, b3 ok 18 %, b4 warn 18 %
.mini         11.5px, var(--ink2)
.astj p 13px · .astj b 14px · .astj .x 30×30 radio 8px · .hlab 11px/900 letter-spacing .12em
.hoybus       margin-top 6px; min-height 120px · .carrslot margin-top 6px
```
### Paleta propia del conductor (`fig/conductor.js`, no sigue al tema)
```
cabina   --cd-frame #0a0e16  --cd-pillar #111724  --cd-visor #161d2c  --cd-dash #151c2a  --cd-dashe #2a3448
pantallas --cd-panel #04131a --cd-panele #1d3340 --cd-disp #060a10
tinta    --cd-ink #e9f2ff  --cd-ink2 #8fa6c6  --cd-ink3 #5d7394
acentos  --cd-amb #ffd66b  --cd-cyan #7fecff  --cd-ok #4ad08a  --cd-wheel #263044
claro    frame #c9d2df pillar #b8c2d1 visor #aeb9c9 dash #dbe2ec panel #f6f9fd ink #0d1726 cyan #0a7f99
guardia  panel #1c0a0f panele #7a2a35 disp #140608 cyan #ff8c7a visor #3a1017
paradas  trabajo #d9573f  guardia #34467e  comida #2f9e6b  entreno #7a5cf0  plan #1fa6c4
calle    suelo #3b4352 asfalto #262c36 acera #59616f bordillo #9aa3b2 edificios #4b5a78/#3a4763/#5b6a8a ventana encendida #ffd98a
letras   ui-sans-serif 800 · ui-monospace 700 · hora 30px mono · etiquetas 9–11.5px · svg con border-radius 14px
```
### Paleta de la carretera (`fig/carretera.js`): las mismas variables con prefijo `--ct-*` (idénticas a las del conductor),
mojón `#e9eef5`, cartel ámbar `#ffd66b` sobre `#0b1020`, verde `#1f6b3a`, azul `#1a3f8a`, entreno `#4b3f7a`/`#9c86ff`.

### Paleta de la estación (`fig/estacion.js`, generada con el kit de /anatomy)
Variables `--anatomy-*` (`--anatomy-paper`, `--anatomy-face`, `--anatomy-top`, `--anatomy-lit-top`, `--anatomy-lit-shade`,
`--anatomy-lo`, `--anatomy-halo`, `--anatomy-weight`, `--anatomy-mono`, `--anatomy-ease: cubic-bezier(.32,.72,0,1)`), con un
material por pieza (`.m-asphalt`, `.m-roof`, `.m-sea`, `.m-pine`, `.m-guard`, `.m-meal`, `.m-plan`…) en versión día, noche,
oscura y clara. Tampoco lee las variables del tema.

---

## 5. Capturas (412×915, datos inventados)

| Archivo | Qué enseña |
|---|---|
| `01-manana-0710.png`, `01b-…-pagina.png` | 7:10, tira de la salida encima; casa en primera persona desayunando; página entera |
| `02-trabajo-1100.png`, `02b-…-pagina.png` | 11:00 en jornada; página entera con asistente y «Lo que viene» |
| `03-comida-1810.png` | comida en casa |
| `04-entreno-1900.png` | atardecer, parada del entreno |
| `05` / `06` | mirar a la izquierda (la ciudad: eventos y «Para hoy») / derecha (el campo: entreno y hábitos) |
| `07-radio-sueno.png` | la radio abierta (sueño, KSS, ánimo, cafés) |
| `08-noche-casa-2140.png` | 21:40, de noche en la parada de «Inglés online» |
| `09` / `10` | mirar a los lados a las 21:40: **sale de día** |
| `11`, `11b`, `12` | la estación de día (con la página) y de noche |
| `13-carretera-lo-que-viene.png` | la carretera del mes en Hoy |
| `14-guardia-noche-2310.png` | viernes 16 de guardia, a las 23:10 |
| `15`–`20` | temas Papel (con página), Arena, Bosque, Magenta, Papel de noche y estación en Papel |
| `21` / `22` | en casa: mirar a la cocina / a la entrada y el dormitorio |
| `23-casa-cama-2255.png` | durmiendo |
| `24-modo-reloj-comparar.png` | el modo Reloj, para comparar colores y tarjetas |
| `25`–`28` | detalles ampliados ×3: pantallita oscura, pantallita en tema claro (fallo), carretera, máquina de billetes |

## Lo que no se ha podido comprobar
- El **movimiento** se ha juzgado leyendo el código y con capturas fijas, sin grabar vídeo.
- El **marco blanco** al tocar puede ser cosa del clic simulado: falta verlo en un móvil de verdad.
- Los **emojis** se han visto con la fuente del navegador de pruebas, no con la del móvil del usuario.
- No se ha probado en un móvil real ni con letra grande del sistema.
