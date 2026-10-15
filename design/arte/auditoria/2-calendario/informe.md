# Auditoría visual 2/5 · Calendario: Semana y Mes

Fase 0 del rediseño artístico. Aquí solo se mira: no se ha tocado `app.js`, `styles.css`, `fig/` ni las pruebas.

**Cómo se miró.** Con el navegador sin ventana, a 412×915 (el tamaño del móvil) y con densidad ×2. El 14 de
octubre de 2026 es miércoles. Los datos son inventados:

- 17 guardias pintadas a mano (septiembre, octubre y noviembre, de Urgencias y de UMI).
- Dos vacaciones: puente del 2 al 6 de noviembre y Navidad.
- Servicio del mes: Cardiología, con un cupo de 6.
- 6 eventos con fecha y un pádel semanal.
- 3 notas con día y 3 hábitos.

Se miró en los temas Noche HUD (el de serie), Papel (claro), Arena (claro) y Magenta. Las medidas salen de
`getBoundingClientRect` y `getComputedStyle`.

Capturas en esta carpeta:

| Captura | Qué enseña |
|---|---|
| `01-mes-plana-hud.png` | Mes en la vista plana, página entera |
| `03-mes-cuenta-r1-abierta.png` | La cuenta de guardias de R1, abierta |
| `04-mes-leyenda.png` | La leyenda «?» del mes |
| `05-mes-hoja-del-mes.png` | La hoja del mes (se abre al tocar el carné) |
| `06-hoja-dia-guardia.png` | La hoja de un día de guardia (mantener pulsado) |
| `06b-hoja-dia-mas.png` | La misma hoja, con «más…» abierto |
| `06c-hoja-dia-con-evento-y-nota.png` | Hoja de un día con eventos y una nota |
| `06d-hoja-dia-nuevo-evento.png` | Hoja de un día: «Nuevo evento» |
| `07-dia-tocado.png` | Toque corto en un día: el panel que sale debajo del mes |
| `08-mes-isometrica-hud.png` | Mes en el tablero isométrico |
| `09-mes-carretera-hud.png` | Mes en la carretera |
| `09b-mes-carretera-avanzada.png` | La carretera, tras arrastrarla hacia delante |
| `10-semana-tablon-hud.png` | Semana en el tablón |
| `11-semana-tablon-dia-guardia.png` | El tablón con el día de guardia elegido |
| `12-semana-cochera-hud.png` | Semana en la cochera |
| `13-semana-por-horas-hud.png` | Semana «Por horas» |
| `14-semana-tablon-papel.png` | El tablón en el tema claro Papel |
| `15-mes-plana-papel.png` | Mes plano en Papel |
| `16-mes-isometrica-papel.png` | Mes isométrico en Papel |
| `17-mes-plana-arena-visible.png` | Mes plano en Arena (solo lo que se ve) |
| `18-mes-plana-magenta-visible.png` | Mes plano en Magenta (solo lo que se ve) |

---

## 1. Lo que está bien y hay que conservar

- **Las fichas isométricas del cuadrante** (`fig/calendario.js`, que se pintan con `<use>`): dicen el tipo de día
  sin texto.
  - El tren rojo de la guardia, más grande que el resto, salta a la vista: de un golpe se ven las 6 guardias del
    mes (`01`).
  - Es lo más original de la sección y el mejor punto de partida.
- **El carné de abono**: tiene mucha personalidad. Es un objeto de verdad, con chip, regla del mes y aguja de
  hoy, y un número dorado para lo importante. Sus tres cifras (guardias, horas de servicio, findes) son lo que un
  residente quiere saber del mes. Funciona igual de bien en oscuro y en claro (`01`, `15`).
- **La casilla dice lo que importa en una línea**: «8-15», «15→9:15», «→8». Las horas de entrada y salida de la
  guardia son lo primero que se busca, y están.
- **El tablón de Semana** (`10`): es la mejor pieza de información de toda la sección.
  - Siete filas en la misma escala de 6 a 2 de la noche, así que se comparan de un vistazo.
  - Al final de cada fila, la «cochera» con las horas dormidas.
  - El aviso en amarillo de la noche corta (7,3 h) y la aguja de «ahora».
  - Es claro, denso y bonito.
- **La hoja de un día** (`06`): está muy bien de tamaños.
  - Botones de 44 px, el número del día en una ficha de 48 px que toma el color del tipo de día.
  - Mayúsculas espaciadas para las secciones («QUÉ ES ESTE DÍA», «AÑADIR», «YA HAY»).
  - Se maneja bien con el pulgar.
- **La carretera** (`09`): la idea es muy buena. Se ve el mes desde el asiento del conductor, la guardia es un
  túnel y el finde libre un área de descanso. Las píldoras «PARA HOY · 3» y «5 EVENTOS» tienen un acabado de
  salpicadero que encaja.
- **Los colores por tipo de día ya son tokens** (`--cal-guardia`, `--cal-trabajo`, `--cal-fuerza`, `--cal-saliente`,
  `--cal-vac`, `--cal-libre`, en `app.js` líneas 36-60). Se pueden cambiar en Ajustes y tiñen fichas, tablero y
  carretera. Es la base correcta para un sistema de color.
- **El fondo de la app**: rejilla fina con un degradado de luz arriba (`body::before`/`::after`). Da profundidad
  sin molestar.

## 2. Lo que se ve pobre, plano, incoherente o anticuado

### 2.1 Letra

- **Todo está en `system-ui`.** Hay tres familias mezcladas sin intención: `system-ui` en la interfaz,
  `ui-sans-serif` en las fichas, el tablón y el tablero, y `ui-monospace` en el «MIÉ 14» de la carretera.
  - No hay una letra con carácter para los números, que en esta sección lo son todo: días, horas, cuentas.
  - El carné, que es lo más cuidado, usa la misma letra que un botón.
- **Letra demasiado pequeña** (medido a 412 px):
  - Nombre de evento y de nota en la casilla: **8,5 px** (`.dbox .dev`, styles.css:288 y 1369).
  - Horas: 10 px.
  - Números del día en el tablero isométrico: unos **8 px** de alto (`08`).
  - En la cochera, las etiquetas de los autobuses («MIÉ 14», «SERVICIO», «8,2 h») miden **6,3–8 px**: no se leen
    (`12`).
  - En el tablón, «de guardia» va a 7,5 px.
- **Salta de tamaño sin escala.** En `#main` del Mes se cuentan 12 tamaños de letra distintos: 8,5 · 10 · 10,83 ·
  11 · 11,5 · 12 · 13 · 14 · 15 · 17 · 20 · 21 px. No hay una escala tipográfica.
- **Textos cortados con «…» que no informan**: «S. c…», «Ce…», «Llevar …», «C. RC…», «Cumpl…», «Pedir c…»
  (`01`). Se midieron 9 de 9 nombres cortados en el mes. Además, la hora «10→11:15» del 14 de noviembre no cabe
  en su casilla y se corta.

### 2.2 Iconos y emojis

- **Emojis del sistema mezclados con las figuras dibujadas.** En la cabecera del Mes: 🗓️ junto al título, ✏️ en
  «editar», 🖨, 🩺 en la cuenta de R1, 🏖️ en vacaciones. En la vista: ▦ 🏗 🛣. En la casilla: 🏋 6:30. En la hoja
  del día: 📅 📝 🌿 💪 ⏰ 🔁 📤 🎓 📚 🎂 🍽️.
  - Al lado del tren y los autobuses hechos con el kit de /anatomy, los emojis parecen pegatinas de otra app.
- **El emoji 📅 pone «July 17»** (`06`, `06c`): en octubre sale un calendario que dice julio, en inglés. Es la
  fuente de emojis del sistema (Noto). Es probable que en Android se vea igual, pero no lo he comprobado en el
  móvil.
- **El 🛣 de «Carretera» y el 🏗 de «Isométrica/Cochera» salen como glifos grises y borrosos** en la barra de
  vistas (`01`). Parecen iconos rotos.
- **El pádel semanal es una bolita verde con una «P»** (`.dsem`). Sale en todas las casillas de los jueves,
  también en las vacaciones (5 de noviembre, `03`). Es el único marcador que no se parece a nada del resto.

### 2.3 Color: incoherencias

- **Urgencias y UMI tienen tres colores distintos según dónde mires**:
  - en la cuenta de R1: rojo `#e5484d` y azul `#3b82f6`, puestos a mano en `styles.css:3737`;
  - en la hoja del mes: amarillo `--warn` y violeta `--brand2` (`mesResumenHTML`, `app.js`, `COL=[...]`) (`05`);
  - en las fichas: el mismo tren rojo para las dos, solo cambia un detalle del techo (`guardiaUmi`).

  El usuario no puede aprender un código si cambia cada vez.
- **«Hoy» tiene tres colores**: borde cian `--brand` en Mes (`.dbox.today`), ámbar `--warn` en el tablón
  (`.tb-fondo.hoy`, `.tb-dia.hoy`) y amarillo en el tablero isométrico. El día elegido va en violeta (`--brand2`) en
  Mes y en cian en el tablón.
- **La jornada y la guardia casi se confunden en el tablón**: rojo teja `#d9573f` frente a rojo `#ff2b3a` (`10`). El
  comentario del código dice «guardia azul noche», pero la guardia ya es roja y el saliente es el azul.
- **La raya de color de arriba de cada casilla** (`border-top: 3px`) usa los colores de los turnos (`sh.color`:
  cian, verde, violeta, ámbar, azul). No son los de las fichas (`--cal-*`), así que cada día lleva dos colores que
  no casan: raya cian y autobús rojo teja.
- **El tema no llega a todo**:
  - En Magenta (`18`), el carné sigue gris azulado, las rayas siguen cian y verde, y los rojos de R1 no cambian.
  - En Papel (`14`), las píldoras de sueño del tablón pierden su «z».
  - `--muted` y `--chip` se usan en `.r1g` y `.r1v` (`styles.css:3732-3744`) pero **no están definidas en ningún
    sitio**. El texto cae a «heredado» por casualidad.
- **Sombra gris en el borde derecho en los temas claros** (`14`, `15`, `16`, `17`). Es la sombra del cajón cerrado:
  `#drawer` está fuera de la pantalla (x = 412, `translateX(330px)`) con `box-shadow: -18px 0 50px -20px
  rgba(0,0,0,.7)` y la proyecta hacia dentro. En oscuro casi no se nota; en Papel y Arena es una franja sucia de
  arriba abajo. Es un fallo pequeño, no de diseño.

### 2.4 Jerarquía y espacio

- **Antes de ver un solo día hay 340 px de mandos.** Las cosas empiezan en:

  | y (px) | Qué hay |
  |---|---|
  | 0–121 | Cabecera fija |
  | 150 | Título |
  | 179 | Selector de mes + 4 botones |
  | 220 | Carné (116 px) |
  | 338 | Cuenta de R1 (42 px) |
  | 384 | Vacaciones (31 px) |
  | 423 | Selector de vista (42 px) |
  | **474** | La cuadrícula |

  En el móvil, la cuadrícula empieza por debajo de la mitad de la pantalla. El mes se ve entero a partir de
  y = 1003, cuando la pantalla mide 915.
- **El mes del título y el del selector se contradicen**: «octubre – noviembre de 2026» frente a «October 2026».
  El selector nativo `<input type=month>` sale en inglés en el navegador de prueba. En el móvil del usuario
  dependerá del idioma del teléfono, y no lo he comprobado.
- **Las casillas son altas y se llenan a medias**: miden 92–113 px y su contenido llega a 57–109 px. La de un día
  normal («8-15» y el autobús) usa 57 de 101 px. El aire está repartido sin ritmo: abajo de cada casilla queda un
  hueco variable.
- **El tren de la guardia se sale de su sitio a propósito** (46×41 px contra 30×27, `styles.css:3722`). En la
  vista plana se monta sobre la raya de arriba y empuja el texto (`01`, 17 y 22 de octubre). Destaca, pero se ve
  más torpe que intencionado, porque las demás fichas van alineadas.
- **El tablero isométrico repite lo que ya está encima.** Lleva su propia máquina de abono («167 h ABONO OCT») a
  la derecha, y el carné está 250 px más arriba. Los textos del pie repiten las mismas cifras. Además, más o menos
  la mitad de la bandeja está vacía: la esquina de abajo a la izquierda y la de la derecha (`08`).
- **Semana tiene tres lenguajes para lo mismo**:
  - Tablón: barras en SVG plano.
  - Cochera: andenes isométricos.
  - Por horas: una rejilla de bloques tipo Google Calendar, con los violetas del Lloretazo y una columna roja
    entera para la guardia (`13`).

  La tercera parece de otra app: otra letra, otros colores (Lloretazo en violeta, «Cocinar» en verde) y otra
  manera de marcar los días.

### 2.5 Sombras, bordes y radios

- **Radios sin escala**: 6 (ficha de texto), 9 (filas del tablón), 12 (botones, R1, selector), 14 (carné, iconos de
  la hoja), 16 (`--r`, tarjetas), 18 (hoja) y 999 (píldoras). Siete radios en una pantalla.
- **La cuadrícula del mes es una tabla con contorno de 0,5 px** (`outline:.5px solid var(--line)`), sin radio, metida
  en una tarjeta de 16 px de radio. Se ve plana y de oficina al lado del carné en 3D y de las fichas con sombra.
- **Las tarjetas del calendario no tienen relieve.** Solo llevan la sombra genérica `--shadow`, que en oscuro casi
  no se ve. El carné tiene sombra propia y perspectiva; lo demás está pegado al fondo.
- **El foco de la carretera tras arrastrarla es un aro blanco grueso** (`09b`) que no se parece a ningún otro foco
  de la app (los demás usan `--brand`).

### 2.6 Movimiento

- **El calendario no se mueve.** Medido: `document.getAnimations()` da 0 en el tablero isométrico, 0 en la cochera
  y 0 en la carretera. La única animación es `viewIn`, la entrada de la página.
- `fig/calendario-iso.js` trae preparadas dos animaciones (`iso-flow`, el flujo de líneas, e `iso-pulse`, el
  latido de puntos, en las líneas 649-652). Pero **ningún elemento pintado lleva `data-flow` ni `data-pulse`**, así
  que no se usan.
- El tren de la guardia no tiene humo, la aguja del carné está quieta y la luz de «hoy» no late. Todo lo dibujado
  como máquina está apagado.
- Cambiar de Plana a Isométrica a Carretera es un salto en seco, sin transición.

### 2.7 Fallos de verdad vistos por el camino (no son de diseño)

- **La carretera del mes cuenta los días desde el día 1, no desde hoy.** `fig/carretera.js:145` hace
  `en = "en " + i + " días"`, con `i` contado desde el principio del mes y no desde `D.cam0` (hoy).
  - En la captura `09b`, «GUARDIA URG · jue 22 · en 21 días» sale el 14 de octubre, cuando son 8 días.
  - Debajo, en la misma pantalla, «sáb 17 · en 3 días» sí está bien, porque sale de `carreteraDatos` en
    `app.js`, que resta `c0`.
- La sombra del cajón en los temas claros (ver 2.3).
- `--muted` y `--chip` sin definir (ver 2.3).
- «1 findes libres» en el pie del tablero isométrico (`app.js`, `renderMonth`, `pie:`): no cambia a singular, cuando
  el carné sí lo hace («1 FINDE»).

## 3. Las figuras isométricas frente a la interfaz que las rodea

- **Dos mundos de luz.** Las figuras tienen cuatro tonos de sombra, cara de arriba clara y volumen. La interfaz que
  las enmarca es plana: tarjetas de un color, bordes de 1 px y emojis. El carné y el tablero parecen objetos
  pegados encima de un formulario.
- **Cuatro perspectivas distintas en la misma sección**:

  | Pieza | Perspectiva |
  |---|---|
  | Carné | Inclinado unos 6°, plano en perspectiva |
  | Fichas y tablero | Isométrica de verdad (45° de giro, 30° de altura) |
  | Carretera | Perspectiva cónica de 1 punto, edificios de pocos polígonos con relleno plano, un túnel que es un rectángulo negro |
  | Tablón | Plano, en 2D |

  La carretera es la que menos casa: no tiene el sombreado de cuatro tonos del kit, tiene cielo negro y fachadas
  lisas (`09`).
- **Las paletas no coinciden.**
  - El tablero usa el gris pizarra del kit (`m-steel`) para la bandeja; la interfaz usa el azul noche de `--card`.
  - En Papel, la bandeja se vuelve blanca, pero los tejados y los trenes conservan su rojo saturado.
  - Los colores del tablón (`#d9573f`, `#3c5590`, `#7a5cf0`, `#2f9e6b`, `#1fa6c4`) están escritos a mano en
    `styles.css:3685-3698` y no salen de `--cal-*` salvo la guardia.
- **Escala de detalle.** Las fichas se dibujaron para verse a 120×108 y se pintan a 30×27 px. A ese tamaño, el
  saliente (casa con jardín) y las vacaciones (casa con piscina) son casi iguales (`03`, 2–6 de noviembre frente
  a 19 de octubre). La diferencia está en un píxel azul.
- **La letra dentro de las figuras** (números de 6–8 px en el tablero y la cochera) es más pequeña que cualquier
  texto de la interfaz. Dentro de la figura, la información se vuelve decoración.
- **Hay figuras que no se tocan como la interfaz.** El tablero «toca una baldosa», pero no hay estado de pulsado
  ni de seleccionado en la baldosa. La cuadrícula plana sí lo tiene (`.dbox.sel`, `.dbox.pulsando`).

## 4. Tres ideas para llevar esta sección a otro nivel

Las tres usan el kit de /anatomy (sombreado de cuatro tonos, orden correcto de pintado, muchas piezas pequeñas
de verdad) y piden **un solo mundo**: la ciudad de transporte que ya está empezada (tren, autobús, cochera,
carretera), llevada hasta el final.

### Idea 1 · «La maqueta del mes»: una ciudad viva que sustituye a la cuadrícula plana

El mes es una maqueta de tren sobre una mesa de taller. Cada semana es una calle; cada día, una parcela.

- **Las piezas del día, a escala de maqueta.** La guardia es un tren con su andén y una farola encendida. La
  jornada, un autobús en su parada con marquesina. El saliente, la cochera con la persiana a medio bajar. El libre,
  un parque con su árbol. Las vacaciones, una playa con sombrilla.
- **Detalle de /anatomy.** Tornillos en la mesa, una regla con los días grabada en el canto, los rótulos de cada
  calle con el número del día en un cartel legible de 11 px o más (no de 8 px), y los cables de la luz entre
  farolas.
- **Con vida propia.**
  - El tren de la guardia que viene echa humo suave, y el humo es más denso cuanto más cerca está.
  - La farola de hoy late despacio.
  - Al cruzar la medianoche, la maqueta pasa a luz de noche.
  - Las ventanas del hospital se encienden en los días de guardia.
  - Los días pasados quedan en tono sepia.
- **Sustituye a la tabla.** La cuadrícula plana queda como «modo editar» (el pincel). La maqueta es la portada
  del Mes: de un vistazo se ven las 6 guardias, los findes libres y lo que viene.
- **El carné de abono entra en la mesa**, como un ticket metido en una canceladora de verdad que **taladra un
  agujero** cada vez que pasa una guardia.

### Idea 2 · «El cuadro de mandos del conductor»: Semana como salpicadero

La semana se ve desde el asiento del conductor.

- **El tablón se queda como está** (es lo mejor de la sección), pero dentro de un salpicadero isométrico
  detallado.
- **Las piezas del salpicadero.**
  - Un tacógrafo de disco, el aparato que lleva un autobús de verdad, que dibuja las horas trabajadas de la semana
    como un disco de papel con su aguja.
  - Un cuentakilómetros de horas de servicio («56 h») con rodillos que giran al cambiar de semana.
  - Una luz de aviso ámbar que se enciende con la «noche corta».
- **Iconos con vida propia, en lugar de los emojis.**
  - El 🔥 de las rachas es una llama de piloto que crece con la racha.
  - El check del hábito es un sello de tinta que se estampa.
  - El ☾ de la guardia es un búho que abre los ojos al empezar la guardia y los cierra al salir.
  - El autobús de cada fila se mueve por su vía hasta la hora de «ahora» y frena en la parada.
- **La cochera isométrica pasa a ser el final de la semana**: los autobuses entran a dormir, cada uno en su plaza,
  con la cifra de horas pintada en el suelo de la plaza en letra legible.

### Idea 3 · «El año de R1 como línea de metro»: la cuenta de guardias hecha plano y objeto

La cuenta de R1 (hoy, un texto plegado de 282 px) pasa a ser un **plano de metro isométrico** de junio a mayo.

- **Dos líneas paralelas**: Urgencias en un color y UMI en otro, siempre los mismos en toda la app. Así se
  arregla de paso el lío de los tres colores.
- **Cada guardia es una estación.** Las hechas, con el andén iluminado. Las que faltan por poner, en obras, con
  vallas y un operario. Las 4 que te quitas, estaciones cerradas con tablones.
- **El tren de hoy circula** por la línea hasta la estación del día. Al tocar un mes, la cámara hace zoom isométrico
  a ese tramo.
- **Las vacaciones son un ramal** que sale hacia una playa, con su contador de días (15 de 22) como un panel de
  llegadas de aeropuerto, con fichas que giran.
- **Las rotaciones del año son los barrios** que cruza la línea (Cardiología, Medicina Interna…), cada uno con su
  edificio característico.
- **Con vida propia.** El panel de llegadas se recoloca con el efecto de fichas que giran al cambiar el número. El
  andén de la próxima guardia parpadea. Al pintar una guardia nueva con el pincel, se ve aparecer la estación.

**Común a las tres** (es lo mínimo para que no sea solo decorar):

- Una letra con números de ancho fijo y carácter para todas las cifras (horas, días, cuentas), tipo letrero de
  andén.
- Un único código de color por tipo de día y por tipo de guardia, que salga de `--cal-*` también en el tablón, la
  R1 y la hoja del mes.
- Fuera los emojis en esta sección: iconos dibujados con el mismo kit, a 2 tonos para tamaños pequeños.
- Las animaciones con `prefers-reduced-motion` y en pausa cuando no se ven, porque el móvil es de guardia y la
  batería cuenta.

## 5. Los tokens visuales que usa esta sección (`styles.css`)

**Colores de base** (`:root`, `styles.css:2-14`; los cambian los 5 temas desde `TEMAS` en `app.js:369`):

| Token | Uso en el calendario |
|---|---|
| `--bg` `#070b14` / `--bg2` `#0b1120` | fondo, botones de la hoja, carril del tablón |
| `--card` `#111a2b` | tarjeta del mes, casilla (`.dbox.on` al 94 %), R1 |
| `--ink` `#e9f2ff` / `--ink2` `#8fa6c6` | texto / número del día, horas, cabeceras |
| `--line` `#1e2b44` | contorno de la casilla, bordes, raya de las casillas sin tipo |
| `--brand` `#38e1ff` | «hoy» en Mes, foco, `--glow`, aviso de evento nuevo |
| `--brand2` `#7c5cff` | día elegido (`.dbox.sel`), UMI en la hoja del mes |
| `--accent` `#a3e635` | línea de entreno en la casilla (`.dline.gym`) |
| `--ok` `#34d399` / `--warn` `#fbbf24` / `--bad` `#fb7185` | sellos de hábitos / «hoy» y noche corta en el tablón, notas, Urgencias en la hoja del mes / botones de guardia en la hoja del día |

**Colores del calendario** (se ponen desde `app.js:36-60` `aplicarColoresCal`):
`--cal-guardia #ff2b3a` · `--cal-trabajo #d9573f` · `--cal-fuerza #7a5cf0` · `--cal-saliente #b3503a` ·
`--cal-vac #b3503a` · `--cal-libre #3f8a4f`. Y para el kit, `--anatomy-paper|shade-0..3|top|hi|mid|lo`.

**Colores escritos a mano, fuera de los tokens** (los candidatos a ordenar):

- Tablón (`styles.css:3685-3698`): `#d9573f`, `#3c5590`, `#7a5cf0`, `#2f9e6b`, `#1fa6c4`, `#5a6b8c`, `#e6ecff`,
  `#b9c7f3`, `#9fb2ea`, `#e8826e`, `#8fa3e0`, `#3b2a05` y `rgba(52,70,126,.35)`.
- R1 (`styles.css:3737, 3741`): `#e5484d`, `#3b82f6`.
- Fichas de texto (`styles.css:3704-3705`): `#7d93e0`, `#8fa3e0`.
- Abono antiguo (`styles.css:3708-3716`): `#fcd34d`, `#fbbf24`, `#f59e0b`, `#1b1406`.
- Colores de los turnos (`store.shifts[].color`, para la raya de arriba de la casilla): `#ef4444`, `#3b82f6`,
  `#22d3ee`, `#10b981`, `#a855f7`, `#f59e0b`.
- Hoja del mes (`app.js`, `mesResumenHTML`): `COL=['var(--warn)','var(--brand2)','var(--brand)','var(--accent)']`.
- **Sin definir**: `--muted` y `--chip` (en `.r1g` y `.r1v`).

**Radios**: `--r: 16px` (tarjetas) · 18 px (`.hoja`) · 14 px (`.hnum`, `.htile`, `.carne`) · 12 px (`.hchip`,
`.r1g`, `.semtog`) · 9 px (botones de `.semtog`, filas del tablón `rx=9`) · 6 px (`.mficha`) · 999 px (píldoras
`.r1p`) · 0 (`.dbox`).

**Sombras**:

- `--shadow`: `0 1px 0 rgba(255,255,255,.04) inset, 0 18px 40px -22px rgba(0,0,0,.9)`.
- `--glow`: un anillo de 1 px de `--brand` al 26 % más un halo de `--brand` (para «hoy» y al pasar el dedo).
- `.abono`: `0 14px 30px -18px #f59e0b`.
- Hoja: un fondo oscuro detrás, `.hscrim rgba(2,4,10,.62)`.
- Cajón: `-18px 0 50px -20px rgba(0,0,0,.7)` (la que se ve en los temas claros).

**Bordes**:

- `.dbox`: `border-top: 3px solid` con el color del turno, más `outline: .5px solid var(--line)`.
- Hoy: `outline 2px var(--brand)`. Elegido: `outline 2px var(--brand2)`.
- `.sdc`: `border-left: 4px solid var(--c)`.

**Letra**:

- `body`: `15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial`, con
  `font-variant-numeric: tabular-nums`.
- Fichas y abono: `ui-sans-serif`. Tablón: `ui-sans-serif, system-ui`. Carretera: además, `ui-monospace`.

| Pieza | Tamaño y peso |
|---|---|
| Título del mes | 14 px / 800 |
| Cabecera de los días de la semana | 11 px / 800 / espaciado .08em |
| Número del día en la casilla | 13 px / 800 |
| Horas en la casilla | 10 px / 700 |
| Evento en la casilla | 8,5 px / 600 |
| Número de la hoja del día | 20 px / 900 |
| Título de la hoja | 17 px / 700 |
| Secciones de la hoja | 10,5 px / 900 |
| Tablón | 7,5 a 11 px |

**Movimiento**:

- `viewIn`: entrada de la página, 7 px hacia arriba.
- `hsube`, `hfade`: la hoja que sube y su fondo.
- `.dbox.pulsando`: la casilla encoge a escala .94 mientras se mantiene pulsada, con un anillo `lpanillo`.
- En `fig/calendario-iso.js:649-652`, `iso-flow` e `iso-pulse` están definidas pero no se usan.
- Hay un bloque `prefers-reduced-motion` para la hoja, la casilla pulsada y las del kit.

## Supuestos

- La fecha de las capturas es la del contenedor (miércoles 14 de octubre de 2026). Los meses que se ven son octubre
  y noviembre.
- He capturado con densidad ×2 para ver el detalle. Las medidas en px son CSS a 412 de ancho, como en el móvil.
- No he podido comprobar en el móvil real cómo salen el emoji 📅 («July 17») ni el selector de mes
  («October 2026»). En el navegador de prueba salen en inglés.
- Los hábitos se sembraron a mano en `store.habitos`, no con su pantalla. Los días de saliente los puso la app
  sola al pintar las guardias.
- No he mirado la impresión del mes (se prueba con PDF, no con capturas) ni el pincel de pintar días.
