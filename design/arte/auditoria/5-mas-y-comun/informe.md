# Auditoría visual · 5 de 5 · «Más» y lo común de toda la app

Fase 0 del rediseño artístico. Todo se ha mirado a **412×915** (el móvil del usuario) en Chromium sin
pantalla, con **datos inventados** (tres hábitos, tres capturas del banco con cifras redondas, seis
sesiones de 4:20, tres notas y un temario de prueba de cuatro temas). No se ha tocado `app.js`,
`styles.css`, `fig/` ni las pruebas.

## Capturas de esta carpeta

| Fichero | Qué enseña |
|---|---|
| `01-cajon-mas.png` | El cajón «Más» abierto, con datos |
| `02-dinero-hoy.png` · `03-dinero-ahorro.png` · `04-dinero-mes.png` | Dinero: sus tres pestañas |
| `05-habitos.png` | Hábitos con tres en marcha |
| `06-consumo-420.png` | 4:20 (portada «Hoy») |
| `07-notas.png` · `08-estudio.png` | Notas y Estudio |
| `09-ajustes.png` · `10-ajustes-aspecto.png` | Ajustes (los 4 grupos) y «Cómo se ve» (los temas) |
| `11-hoja-meta.png` | Una hoja que sube desde abajo (la del Colchón) |
| `12-aviso-flash.png` | Un aviso (el de «tema puesto») |
| `13-cajon-seccion-activa-ilegible.png` | **Fallo**: el recuadro de la sección en la que estás no se lee |
| `20-…`, `21-…`, `22-…` | Dinero·Ahorro, Hábitos y el cajón con cada uno de los 5 temas |
| `25-temas-comparados-dinero.png` · `…-habitos.png` · `…-cajon.png` | Los 5 temas uno al lado del otro |
| `30-asistente-paso0..4.png` | El asistente del primer arranque, paso a paso |

---

## A) «Más»

### Lo que hay, medido

- **El cajón** sale por la derecha y mide 330×915; deja una franja de 82 px de fondo oscurecido a la
  izquierda. Dentro: 6 recuadros de 147×82 px en dos columnas (Hábitos, Dinero, Estudio, 4:20, Eventos y
  Notas) y una fila ancha de «Ajustes» (55 px). Todo acaba a los **388 px**: los otros **527 px (58 %) del
  cajón están vacíos**.
- Cada recuadro lleva un emoji, el nombre y **una línea en vivo** («1 de 3 hoy · 🔥 18», «hoy puedes
  54 €», «2h05 esta semana», «1 esta semana», «mañana · 🌿 Lloretazo», «3 notas»). En Ajustes, «⚠ copia» si
  no hay copia de seguridad reciente. 4:20 tiene un modo discreto («🔒 Privado», sin cifras).
- **Dinero** (715 px Hoy · ~915 Ahorro · 1 098 px Mes): una gran cifra (42 px) por pestaña, «puedes gastar
  hoy», bolsillos con barra, barras de categorías contra tu media y un gráfico de barras mes a mes.
- **Hábitos** (653 px): una tarjeta de consejo arriba, «En marcha · 3 de 3» y una fila por hábito con
  barra hacia los ~66 días, botón «mín.» y un botón grande de marcar (48×75).
- **4:20** (1 210 px): cuatro pestañas, tres cifras, una pregunta de cómo sentó, un formulario de
  apuntar con **24 botones** (30 de 36 botones miden menos de 44 px de alto) y la semana en barras.
- **Ajustes** (1 255 px): 4 grupos («Mis turnos», «Yo», «La app», «Mis datos») de filas de 50 px, cada una
  con emoji, nombre, el valor actual en gris y «›». Es la pantalla más ordenada de la sección.
- **Notas** y **Estudio**: Notas es un campo de texto + filtros + grupos; Estudio mezcla tarjetas con
  barrita de color, el bloque del HUD y tres «puertas» con **iconos de línea en SVG** (las únicas de «Más»
  que no usan emoji).
- **Asistente**: 4 pasos (jornada, guardias, sueño, sitio) y un resumen «✓ Listo». Una tarjeta de
  bienvenida con 4 rayitas de progreso, una tarjeta por pregunta y «siguiente ›» / «saltar». Ocupa unos
  380–490 px: **la mitad de abajo de la pantalla queda vacía** en todos los pasos.

### Qué conservar

1. **La línea en vivo de cada recuadro del cajón.** Es la mejor idea de la sección: el cajón ya no es un
   menú, es un parte. Hay que conservarla en cualquier diseño.
2. **Ajustes en grupos de filas** (`.acap` + `.alst` + `.ali`): título pequeño, valor actual a la derecha,
   filas de 50 px. Es claro, se toca bien y es el patrón que debería copiar el resto de listas.
3. **La gran cifra de Dinero** («54 €», «2.315 €») con la frase que la explica debajo. Funciona.
4. **Hábitos con racha que aguanta un fallo y versión mínima**: la lógica es buena y pide un dibujo
   que la cuente (ver ideas).
5. **El modo discreto de 4:20** («🔒 Privado»): cualquier rediseño tiene que tener su versión neutra.
6. **El aviso de «Deshacer»** y las hojas que suben desde abajo: buenos gestos de móvil.

### Lo que se ve pobre o incoherente

1. **Fallo: el recuadro de la sección en la que estás no se lee** (`13-…png`). El cajón es un `<nav>` y la
   regla de las pestañas de arriba, `nav button.on`, le pinta el degradado de marca con texto oscuro;
   la línea en vivo sigue en gris y queda gris sobre cian. En Arena se ve naranja-verde con texto casi
   invisible (`22-tema-5-arena-cajon.png`). Es un estilo que se cuela, no una decisión.
2. **Fallo probable: sombra en el borde derecho en los temas claros** (`20-tema-4-papel-…`,
   `20-tema-5-arena-…`): una franja gris de ~40 px pegada a la derecha en todas las pantallas. Lo más
   probable es la sombra del cajón (`box-shadow:-18px 0 50px -20px`), que se sigue viendo aunque el cajón
   esté escondido fuera de la pantalla. En los temas oscuros no se nota porque el fondo ya es oscuro.
3. **El cajón está a medio llenar** (58 % vacío) y los recuadros son todos iguales: Dinero pesa lo mismo
   que Notas. No hay jerarquía ni nada que invite.
4. **Tres formas distintas de «pestañas» en tres pantallas seguidas**: Dinero usa píldoras a la derecha
   del título; 4:20 una barra de cajas a todo lo ancho; Notas píldoras con contador debajo de un campo. Y
   el calendario y Comer usan una cuarta (`.calmodes`).
5. **Tres formas de titular**: el título de sección con emoji («💶 Dinero», 18–20 px), el título de tarjeta
   con la rayita cian (`.card>h2::before`) y la etiqueta en mayúsculas espaciadas («PUEDES GASTAR HOY»,
   «EN MARCHA · 3 DE 3»). Conviven las tres en la misma pantalla sin regla clara.
6. **Los colores de Dinero, Hábitos y 4:20 no cambian con el tema**: las barras de los bolsillos (azul,
   verde, naranja), las de categorías y las de hábitos son las mismas en los cinco temas
   (`25-temas-comparados-dinero.png`). En Magenta o Arena parecen de otra app.
7. **4:20 es un formulario**, no una pantalla: 24 botones de 38 px en rejilla, todos iguales. Lo
   importante (cuántos días sin, cómo va la semana) queda debajo.
8. **Tarjetas de consejo arriba del todo** («¿Cuánto tienes en el banco?», «Llevas 31 días con agua…»):
   empujan el contenido principal hacia abajo en Dinero y Hábitos.
9. **Texto pequeño**: en estas pantallas el tamaño más repetido es **11,5–12 px** (en 4:20, 26 textos a
   12 px y 8 a 9,5 px). A 412 px de ancho se lee, pero cansado.
10. **El asistente** es correcto pero sin carácter: cuatro tarjetas grises para la primera impresión de la
    app, y medio móvil vacío. (Las horas salen como «08:00 AM» porque el navegador de prueba está en
    inglés; en el móvil del usuario saldrán en 24 h: no es un fallo de la app.)
11. Detalle: en Dinero·Mes pregunta «¿Cuánto gastaste en **julio**?» encima de «septiembre, cerrado» y
    «este mes, octubre»: con mis datos inventados (capturas de agosto a octubre) leer tres meses distintos
    en una pantalla despista. Puede ser correcto por la lógica, pero se lee raro.

### Tres ideas ambiciosas («sorpréndeme»)

Las tres siguen el método de `/anatomy`: **un objeto real cuyo funcionamiento es la explicación**,
isométrico, con muchas piezas pequeñas, que se mueve con calma y **cuyas cifras salen del mismo dato
que lo mueve**. El repositorio ya tiene el camino hecho: `design/<algo>/app.mjs` se monta con el kit y
deja un `fig/*.js` ya generado (como `fig/calendario-iso.js`), así que la app sigue **sin build**.

**1. El cajón «Más» como una estantería de residente.** En vez de seis recuadros iguales, un mueble
isométrico de baldas que llena la pantalla, con un objeto por sección, cada uno vivo:

- **Dinero → una hucha-caja fuerte** con tres tubos de monedas a la vista (Colchón, Viajes, Caprichos):
  la altura de cada tubo es su saldo y una muesca marca la meta. En la ranura, las monedas de «hoy
  puedes 54 €». Una lucecita verde/ámbar/roja dice si el mes va bien, justo o pasado (el `est` que ya
  calcula `d6Mes`).
- **Hábitos → una jardinera** con una planta por hábito (ver idea 3), en miniatura.
- **Estudio → una pila de libros** que crece con las horas de la semana, con un marcapáginas en el tema
  que toca repasar.
- **4:20 → un tarro con tapa** y un contador de días sin grabado; en modo discreto es una **caja con
  candado** y nada más.
- **Eventos → un corcho** con la chincheta del siguiente; **Notas → una libreta** con tantas hojas
  asomando como notas pendientes.
- **Ajustes → un cuadro de interruptores** en la balda de abajo, con un piloto ámbar si falta la copia.

Tocar un objeto hace un zoom suave hacia su sección. Se mantiene la línea en vivo debajo de cada uno
(como texto, para leerla rápido y para lectores de pantalla).

**2. Dinero como una caja fuerte que se abre por capas.** Las tres pestañas son tres vistas del mismo
objeto: **Hoy** = el dispensador frontal (cuántas monedas puedes sacar hoy, y las que quedan para los
18 días que faltan, como una columna que baja); **Ahorro** = la puerta abierta con los compartimentos de
cada bolsillo llenos hasta su altura, y «Repartir 1.581 €» como monedas que caen y se reparten con el %
de cada uno; **Mes** = una balanza: lo que entró en un platillo, lo fijo y el día a día en el otro, y la
diferencia (lo ahorrado) cae al cajón. Los colores de cada bolsillo saldrían del tema.

**3. Hábitos como un huerto que cuenta tu racha.** Cada hábito es una planta en su bancal: crece un nudo
por cada día hecho hacia los ~66 días; el **día malo (versión mínima) es riego a medias** (hoja más
pequeña, pero la planta sigue); **un fallo no la mata** y dos seguidos la dejan mustia (exactamente la
regla de la racha que ya tiene la app). Marcar «hecho» es una regadera que pasa; «ya te sale solo» es la
planta que florece y pasa al invernadero. «Tu semana» son siete macetas pequeñas. Es la idea que mejor
convierte una lógica buena pero invisible en algo que apetece mirar cada noche.

Extras más pequeños, por si sobran fuerzas: el **asistente** como una **maleta de R1** que se va
llenando con cada respuesta (el pijama de guardia, el reloj de la jornada, la almohada del sueño, la
postal del sitio) y se cierra en «✓ Listo»; y **4:20** como un **depósito que se vuelve a llenar** con los
días sin (la curva de tolerancia que ya calcula `cnTolerancia`), con el formulario plegado debajo.

---

## B) Lo común de toda la app

### Dónde está cada cosa

- La barra de pestañas **no está abajo: está arriba**, dentro de la cabecera fija (78 px de alto con la
  fila de modos oculta). Tres pestañas (Calendario, Entreno, Comer) y «☰ Más», en píldoras de **35 px de
  alto**; «‹ atrás» y el botón de modo día/noche miden **30 px**. La fila de modos (`#calModes`) suma otra
  fila en Calendario y Comer.
- `styles.css`: **3 791 líneas, ~3 460 reglas**, 43 `!important`, 9 bloques de impresión y 6 de
  «movimiento reducido» (bien).

### Inventario: colores y temas

- **9 colores por tema** (`--bg`, `--bg2`, `--card`, `--ink`, `--ink2`, `--line`, `--brand`, `--brand2`,
  `--accent`) + **6 colores de la franja** (sueño, trabajo, guardia, comida, gimnasio, eventos). Los temas
  viven en `TEMAS` (app.js, línea ~369) y se aplican escribiendo esas variables en `<html>`.
- Los 5 temas:

| Tema | Modo | Fondo | Tarjeta | Texto | Marca | Marca 2 | Acento |
|---|---|---|---|---|---|---|---|
| Noche HUD | oscuro | `#070b14` | `#111a2b` | `#e9f2ff` | `#38e1ff` cian | `#7c5cff` violeta | `#a3e635` lima |
| Magenta | oscuro | `#12081a` | `#1f1230` | `#f7eefe` | `#f050c8` | `#8b5cf6` | `#fbbf24` |
| Bosque | oscuro | `#06120e` | `#10241c` | `#eafbf2` | `#34d399` | `#2dd4bf` | `#facc15` |
| Papel | claro | `#eef2f9` | `#ffffff` | `#0d1729` | `#2563eb` | `#7c3aed` | `#15803d` |
| Arena | claro | `#f5efe4` | `#fffcf6` | `#2a2118` | `#c2410c` | `#0f766e` | `#4d7c0f` |

- **Estado** (`--ok`, `--warn`, `--bad`) **no los cambia ningún tema**: solo hay dos juegos, oscuro y
  claro.
- Hay además un **tema al azar** que comprueba el contraste antes de aceptarse, y hasta 5 temas
  guardados. Bien pensado.
- **Lo que no sigue al tema**: **309 colores escritos a mano en el CSS** (123 distintos) y **254 en
  app.js**; los de los gráficos de comida/dinero (`--bp`, `--bc`, `--bg3`, `--bx`) están fijos en azul,
  ámbar, verde y naranja; **33 reglas `html:not(.dark)`** pensadas para Papel (21 con colores fijos, p. ej.
  `.tag{background:#eef2f9}`) que **también se aplican a Arena**; el texto sobre botón de marca está fijo a
  `#04121c` en 20 sitios. Se usan dos variables que **no existen** (`--muted`, `--card2`) y `--bg3` es un
  verde de gráfico con nombre de fondo.
- **El modo claro/oscuro no sigue al del móvil**: arranca en oscuro salvo que se haya elegido claro.

### Inventario: forma, letra y movimiento

| Cosa | Hoy | Comentario |
|---|---|---|
| Radios de esquina | **34 valores distintos** (12 px ×61, 10 ×59, 99 ×56, 14 ×40, 999 ×38, 9, 11, 6, 8, 5, 3, 16, 7, 2, 13, 4, 18, 22…) | Existe `--r:16px` pero se usa **2 veces** |
| Sombras | ~**50** distintas, más `--shadow` y `--glow` (usadas 6 veces cada una) | |
| Tamaños de letra | **39 distintos**, de 8 a 40 px; los más usados 12, 13, 11, 12,5, 11,5, 10, 14, 10,5 | Medios píxeles por todas partes |
| Pesos | 400, 500, 600, 700, 800, 900 | El 800 domina: casi todo va en negrita |
| Espaciado de letras | 19 valores | Para las etiquetas en mayúsculas |
| Fuentes | la del sistema (`system-ui`) y monoespaciada para los `textarea` | En Android = Roboto |
| Capas (`z-index`) | 17 valores, de 0 a 9000 | Sin nombre ni orden |
| Animaciones | 7: `viewIn` (entrada de pantalla), `hsube`/`hfade` (hoja), `scanbar`, `girar`, `lpanillo`, `nocheResp` | Una sola curva (`cubic-bezier(.2,.8,.2,1)`), 26 transiciones distintas |
| Estilos en línea | **1 361** `style="…"` dentro de app.js | Mucho diseño no está en el CSS |

Fondo común: degradado con dos manchas de luz de la marca + **una rejilla de 44 px** que se desvanece
(el «HUD»), tarjetas semitransparentes con desenfoque y un brillo en diagonal. Es lo que da carácter al
tema oscuro, pero en los temas claros la rejilla y el brillo apenas se ven y queda «una app blanca».

### Inventario: componentes

| Familia | Cuántos estilos conviven | Ejemplos |
|---|---|---|
| Botón `.btn` | 1 base con **6 variantes** (normal, `p` principal, `g` verde, `bad`, `d` borrar, `s` pequeño) + `gbig` | 280 «btn s», 68 «btn p», 53 «btn s volver» |
| Otros elementos pulsables con estilo propio | **172 clases distintas** con `cursor:pointer` | `.ali`, `.cti`, `.chipx`, `.d7meta`, `.hbt`, `.hmin`, `.dlink`, `.puerta`, `.tick`… |
| Pestañas / interruptores de varias opciones | **~21 familias** | `.calmodes`, `.d6seg/.d7seg`, `.cnseg`, `.cntab`, `.hoyseg`, `.gseg`, `.gtabs3`, `.mseg`, `.snseg`, `.sntabs`, `.sptabs`, `.fseg`, `.ftabs`, `.dseg`, `.cjseg`, `.cjseg2`, `.bwseg`, `.hcseg`, `.h2seg`, `.tl-seg`, `.d4tab` |
| Chips / etiquetas | **~17 familias** | `.tag` (+`b1..b4`), `.chipx`, `.hchip`, `.hoychip`, `.gvchip`, `.racchip`, `.tpchip`, `.hrpill`, `.drtag`… |
| «Puertas» / recuadros que llevan a otra pantalla | **~20 familias** | `.cti`/`.ctil` (cajón) y `.ctile`/`.ctiles` (antiguos, casi el mismo nombre), `.puerta`, `.gpuerta`, `.infpuerta`, `.sanopuerta`, `.sbpuerta`, `.gtile`, `.htile`, `.dtile`, `.sntile`, `.inftile` |
| Tarjeta | `.card` + **223 selectores** con «aspecto de tarjeta» (esquina + borde + fondo) | `.alst`, `.hoja`, `.cnvis`, `.captura`… |
| Hoja de abajo | `.hoja` está definida **dos veces** con significados distintos (línea 850, tarjeta en línea; línea 2315, hoja fija) | La segunda pisa a la primera; `.hoja.hojain` la «deshace» |
| Aviso (`#flash`) | Una píldora de esquinas redondas al 100 % abajo en el centro; con «Deshacer» cambia a rectángulo | Con un texto de 3 líneas queda como un **óvalo de 206 px de ancho** que tapa el contenido (`12-…png`) |
| Volver | `.volver` (con el icono SVG «atrás») y `.hvolver` | Bien resuelto con «‹ Ajustes / ‹ Dinero» |

Medidas de toque: en las pantallas de «Más» **la mayoría de botones mide 26–38 px de alto** (Dinero·Hoy
8 de 9, Hábitos 10 de 17, 4:20 30 de 36, Notas 8 de 10). Solo Ajustes cumple los 44 px en todo.

### Inventario: iconos (emojis)

- **1 862 emojis** en el código de app.js (sin contar comentarios), **269 distintos**. La mayoría son de
  comida y vienen con los datos (🍽 83, 🍗 55, 🐟 54, 🍔 46, 🥗 36, 🍳 35, 🥛 34, 🍲 26…).
- **Como icono de interfaz** (en botones, títulos, chips y avisos): **~229 usos, 92 distintos**. Los más
  repetidos: 🍽 17 · 📷 11 · 📅 10 · 🛒 7 · ✨ 6 · ⚙ 6 · 📝 6 · 🍳 6 · 🩺 5 · 🎯 5 · 🗓 4 · 📊 4 · 📈 4 ·
  📖 4 · 💪 4 · 📋 4 · ⚠ 3 · ✏ 3 · 🚕 3 · 🔔 3 · ⏱ 3 · ⏰ 3 · 🔒 3 · 🏆 3.
- Por sección: cajón ✅ 💶 📚 🌿 📌 📝 ⚙️; Ajustes 🗓️ 🩺 🔁 📝 🧍 🛌 💶 🌾 🚌 📍 🎨 📅 🥗 🔗 💾 🗂️ ⏱️ 🖨️;
  barra de arriba ☰ y 🌙/☀️; tipos de día 💼 💪 🌿 🩺 🚪.
- **Un mismo concepto con varios emojis**: calendario 📅 19 / 🗓 7 / 📆 2; dormir 😴 12 / 🛌 12 / 🌙 9;
  editar ✎ 12 / ✏ 4 / ✍ 7 / 📝 15; hecho ✓ 117 / ✅ 14 / ✔ 1; cerrar × 96 / ✕ 6; 🌿 es a la vez «Libre»,
  «4:20» y «Lloretazo».
- **Ya existe un juego de iconos propio**: `GYM_ICO` (app.js ~14797), **38 iconos de línea en SVG** sobre
  rejilla de 24 (pesa, libro, calendario, cama, ajustes, sol, chincheta, aviso, lupa, cámara…), usado 110
  veces (sobre todo «atrás» ×54). Es la semilla natural del sistema nuevo. Y hay figuras isométricas
  generadas con `/anatomy` (`fig/calendario-iso.js`, el tren de la guardia, el autobús de la jornada…).
- Problema de fondo de los emojis: **cada móvil los dibuja distinto**, no siguen el color del tema, no
  pueden cambiar con el estado y mezclan estilos (fotos en miniatura junto a líneas finas).

### Qué está desordenado o duplicado (resumen)

1. **Estilos que se cuelan**: `nav button` y `nav button.on` (pensados para las pestañas) también pintan
   los recuadros del cajón porque el cajón es un `<nav>`. Hay que nombrar los componentes por clase, no por
   etiqueta.
2. **El tema solo llega a medias**: 9 variables bien hechas, pero cientos de colores fijos, gráficos con
   colores fijos y reglas «modo claro» pensadas solo para Papel.
3. **Sin escalas**: 34 radios, ~50 sombras, 39 tamaños de letra, 17 capas. Cada pantalla nueva ha
   inventado los suyos.
4. **Componentes repetidos con otro nombre**: ~21 pestañas, ~17 chips, ~20 puertas, `.ctile` y `.cti`, dos
   `.hoja`. Cada rediseño de sección ha hecho su versión.
5. **Diseño fuera del CSS**: 1 361 estilos en línea en app.js.
6. **Iconos mezclados**: emojis de 92 tipos + 38 SVG propios + figuras isométricas, sin regla de cuándo
   va cada uno.
7. **Tamaños de toque** por debajo de 44 px en casi todas las pantallas salvo Ajustes, incluida la
   barra principal (35 px) y «‹ atrás» (30 px).

### Propuesta de base para un sistema nuevo

**Variables (las «fichas» del diseño)**, todas en `:root` y redefinidas por tema, sin colores sueltos:

- **Superficies**: `--fondo`, `--fondo-2`, `--superficie-1/2/3` (tarjeta, tarjeta dentro de tarjeta,
  hoja), `--borde`, `--borde-fuerte`.
- **Texto**: `--texto`, `--texto-2` (apagado), `--texto-3` (pistas), `--sobre-marca` (el texto encima de
  un botón de marca: hoy está fijo a `#04121c` en 20 sitios).
- **Marca**: `--marca`, `--marca-2`, `--acento`, cada una con su versión suave (`--marca-suave` para
  fondos).
- **Estado**: `--bien`, `--ojo`, `--mal`, `--info`, con versión suave, **definidos por tema**.
- **Categorías**: los 6 de la franja (ya existen) + **una paleta de datos por tema** de 5–6 colores para
  bolsillos, categorías y hábitos (sustituye a `--bp/--bc/--bg3/--bx`).
- **Esquinas**: 6 valores — 4 · 8 · 12 · 16 · 24 · redondo.
- **Letra**: 7 tamaños — 11 · 12,5 · 14 · 16 · 20 · 28 · 44 (la gran cifra); 3 pesos — 500 · 700 · 800;
  una sola etiqueta en mayúsculas con un solo espaciado.
- **Espacio**: 4 · 8 · 12 · 16 · 24 · 32.
- **Sombras**: 3 alturas (`--sombra-1/2/3`) + `--brillo` de marca.
- **Movimiento**: 3 duraciones (120 · 200 · 320 ms), 2 curvas (salida suave y «muelle»), todo apagado con
  «movimiento reducido».
- **Capas con nombre**: contenido, cabecera, cajón, hoja, modal, aviso.
- Y que el modo **siga al del móvil** la primera vez (`prefers-color-scheme`), dejando el botón para
  cambiarlo.

**Componentes (uno por familia, con variantes, no uno por pantalla)**:

| Componente | Sustituye a | Notas |
|---|---|---|
| Botón: principal · normal · fantasma · peligro × pequeño · normal · grande | `.btn` y sus 6 variantes, `.gbig`, `.dlink`, `.mini2` | **mínimo 44 px de alto** de zona tocable aunque se vea más pequeño |
| Selector de opciones (pestañas) | las ~21 familias `*seg`/`*tabs` | uno, a todo lo ancho o en píldora |
| Chip | las ~17 familias | normal · elegido · de estado |
| Tarjeta | `.card` y parecidos | normal · destacada · aviso · lista agrupada (la de Ajustes) |
| Fila de lista | `.ali`, `.estado`, `.gfila`… | icono · texto · valor · «›» |
| Puerta | las ~20 familias de recuadros | icono vivo · nombre · línea en vivo |
| Cifra grande | las de Dinero, 4:20, Estudio | número · unidad · frase |
| Barra de progreso | `.bar`, `.d6t`, `.prog`… | con marca de meta |
| Hoja de abajo | `.hoja` (las dos) | con asa, cabecera y altura máxima |
| Aviso | `#flash` | rectángulo con esquinas de 16 px, ancho fijo (~92 % del móvil), opción de «Deshacer» |
| Cabecera de sección y subcabecera | los 3 tipos de título | una regla: título de pantalla, título de tarjeta, etiqueta |

**Iconos propios «con vida propia»** (sin librerías y sin build):

- Partir de `GYM_ICO` (38 iconos de línea, trazo 1,75, rejilla 24) y llevarlo a **~60 iconos** que cubran
  los ~92 emojis de interfaz. Los emojis de **comida** pueden quedarse (son datos, y ahí el emoji ayuda).
- **Una sola función** `ico(nombre, estado)` que pinte `<svg>` en línea, con `currentColor` para el trazo
  y `var(--marca)`/`var(--acento)` para un relleno suave: así **siguen al tema** solos.
- **Estado por atributos**, no por dibujos distintos: `data-nivel="0.6"`, `data-on`, `data-alerta`. El CSS
  mueve piezas del icono con `transform` y `stroke-dashoffset`. Ejemplos:
  - **Hucha**: se llena hasta el nivel del ahorro; tintinea una moneda al apuntar.
  - **Planta (hábitos)**: hojas que salen según cuántos hábitos llevas hoy; mustia si hay dos fallos.
  - **Calendario**: lleva el número del día de hoy dentro.
  - **Guardia (fonendo)**: late despacio mientras estás de guardia.
  - **Luna (sueño)**: su fase según las horas que dormiste.
  - **Libro (estudio)**: las páginas pasan al apuntar un rato.
  - **Campana/aviso**: se mueve una vez cuando aparece, y luego se queda quieta.
  - **Hecho ✓**: se dibuja el trazo al marcar (200 ms).
  - **4:20**: hoja que, en modo discreto, se cambia por un candado.
- Reglas: se mueven **solo cuando cambia algo** (nada de animaciones en bucle salvo «estás de guardia»),
  todo quieto con «movimiento reducido», y siempre con su texto al lado o en `aria-label`.
- Las **figuras isométricas grandes** (la estantería, la hucha, el huerto) se hacen aparte, con `/anatomy`
  en `design/…/app.mjs`, y se guardan ya generadas en `fig/`, como `fig/calendario-iso.js`.

**Orden sugerido**: (1) fichas de color, esquina, letra y espacio, con los 5 temas reescritos y la paleta de
datos por tema; (2) botón, selector, chip, tarjeta, fila, puerta, hoja y aviso, quitando las copias;
(3) iconos vivos; (4) las figuras grandes por sección. Y de paso: arreglar el recuadro activo del cajón y
la sombra del borde derecho, que se arreglan solos al hacer (1) y (2).

**Pregunta para el usuario antes de empezar**: la barra de pestañas está **arriba**. ¿La pasamos
**abajo** (donde llega el pulgar, y con botones de 44 px o más), o se queda arriba?

---

## Lo que no he podido comprobar

- **El móvil de verdad**: las capturas son de Chromium sin pantalla; en Android la letra será Roboto y los
  emojis serán los de Google, así que el tamaño y el aspecto pueden variar un poco.
- La **sombra del borde derecho** en los temas claros: la he visto en todas las capturas claras, pero la
  causa (la sombra del cajón escondido) es una deducción a partir del CSS; no la he aislado quitándola.
- El **modal** (`#modal`) y la pantalla de **Eventos** no los he capturado (Eventos solo como recuadro del
  cajón).
- Los recuentos de CSS (sombras, «aspecto de tarjeta», clases pulsables) son **aproximados**: salen de
  buscar patrones en el fichero, no de un análisis completo.
