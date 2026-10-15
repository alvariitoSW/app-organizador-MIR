# Auditoría visual · 4 · Entreno y Sueño

Fase 0 del rediseño artístico. Solo se ha mirado: no se ha tocado `app.js`, `styles.css`, `fig/` ni las pruebas.

**Cómo se ha hecho.** La app se ha conducido con `.claude/skills/verify/driver.mjs` a **412×915**, con datos
inventados: dos rutinas de fuerza («Torso A», «Pierna B») y una de agua («Piscina técnica»), 8 sesiones y
120 series en cuatro semanas, y 10 noches apuntadas (una de ellas de guardia, a ratos y con siesta). No hay
ningún dato real del usuario. Se han hecho capturas en el tema por defecto (Noche HUD, oscuro), en **Papel**
(claro), en **Magenta** y en **Arena**, y se han medido cosas con `getBoundingClientRect()`.

> En algunas capturas sale un aviso flotante: «💡 Mantén pulsado un día…». Es la pista del calendario,
> que aparece porque el driver pasa por el Mes. No es de estas secciones.

## Capturas (en esta carpeta)

| captura | qué es |
|---|---|
| `e01-portada.png` | Entreno, la portada entera (1.849 px, unas 2 pantallas) |
| `e02-rutina.png` | Una rutina abierta (Torso A, pestaña Info) |
| `e03-progreso.png` | Progreso entero (**3.420 px, casi 4 pantallas**) |
| `e04b-cardio.png` | Cardio: las cuatro fichas con emoji (la piscina no se llegó a sembrar bien: sale vacía) |
| `e05-sesion-vivo.png` | La sesión en vivo, serie a serie, al empezar |
| `e07-vivo-tras-ejercicio.png` | La sesión con el descanso corriendo (1:30) y la barra de discos |
| `e08-terminar-esfuerzo.png` | «¿Qué tal de dura?» al terminar |
| `e09-informe-sesion.png` · `e09b-informe-muneco.png` | El resumen de la sesión y el muñeco de músculos |
| `e06-muneco-musculos.png` | El muñeco en Progreso y la tabla «Tus marcas» |
| `s01-sueno-hoy.png` · `s01b-reloj-arena.png` | Sueño · Hoy, con el reloj de arena (`fig/sueno.html` en un iframe) |
| `s02-sueno-mejorar.png` | Sueño · Mejorar (Luz y café) |
| `s03-sueno-datos.png` | Sueño · Datos |
| `s04-anotar-noche.png` | Anotar la noche dibujándola (la hoja de abajo) |
| `s05b-modo-noche-completo.png` · `s05c-modo-noche-respira.png` | El modo noche, antes y durante |
| `s06-ciencia.png` | La hoja de la Ciencia (24 hallazgos) |
| `s07-banco-piezas.png` | «Qué es cada pieza» del reloj de arena |
| `c01…c04-*-papel.png` | Entreno, sesión, Sueño y anotar en el tema claro Papel |
| `c05-entreno-magenta.png` · `c07-sueno-arena.png` | Los mismos sitios en Magenta y Arena |

---

## Lo que está bien y hay que conservar

1. **El reloj de arena del sueño** (`fig/sueno.html`, `s01b`, `s07`). Es la única pieza de estas dos
   secciones con oficio de verdad: isométrico, de latón y madera, con la regla de alerta, el sol y la luna,
   y la arena que se mueve con tu sueño real. Se explica con «Qué es cada pieza». Es el modelo a seguir.
2. **La sesión en vivo, serie a serie** (`e05`, `e07`). La estructura funciona: la serie activa resaltada,
   «ANTES» al lado, botones de ±2,5 kg y ±1 rep grandes (44 px de alto), la **barra de discos por lado**
   (un dibujo pequeño que se entiende de un vistazo) y el descanso arriba con su barra. No hay que perderlo.
3. **El modo noche** (`s05b`, `s05c`). Rojo oscuro sobre negro puro, sin reloj y con el círculo que respira
   (10 s, se para con «reducir movimiento»). Bien pensado para no despertar. Conservar la idea y el color.
4. **Los iconos de línea propios de Entreno** (`gymIco`: chispa, barras, pulso, lupa, atrás). Trazo de
   1,75, puntas redondas, `currentColor`: son coherentes y cambian con el tema. Es la base para los
   iconos nuevos.
5. **La franja para dibujar la noche** (`s04`). De 18:00 a 18:00, arrastrando el dedo, con las horas
   escritas debajo como alternativa. La idea de «dibujar lo que dormiste» es muy buena.
6. **Los niveles de evidencia de la Ciencia** (`s06`): fuerte (verde), moderada (ámbar) y baja (gris),
   repetidos como chapitas en todo Sueño. Claro y consistente.
7. **La escala 1–9 de lo despejado que estás** (`s01`, `s04`): un degradado de gris a azul en nueve
   casillas. Se lee sola.
8. **«Listo al 91 %»** en la portada de Entreno: el anillo con el número dentro es claro y tiene peso.

## Lo que se ve pobre, plano, incoherente o anticuado

### En las dos secciones

- **Todo es la misma tarjeta.** `.card` (radio 16, borde de 1 px, un brillo diagonal de marca al 9 % y
  sombra) se repite en todo: la semana, el aviso, el «Listo», el héroe, las rutinas, las fichas. La
  jerarquía sale solo del tamaño de letra; no hay una tarjeta que mande. (`styles.css` l. 92–99; `e01`).
- **Emojis mezclados con iconos dibujados.** En Entreno: 🏋️ 💪 🧗 🏊 ⏱ 🤸 (`ejIcono`, `app.js` ~l. 15968),
  🔥 en «semanas seguidas», 📋 en «plan», 📊 en el informe, 🔔 en el aviso, 🏆 en «Tus marcas», 🍽 y 🌙
  en «la próxima vez»; en Cardio 🏊 🏃 🚴 🤸 enormes (`e04b`). En Sueño: 😴 en el título del código,
  ✎, 🛏 Dormido, ☀️ Siesta, 🩺 En la guardia (`snTipo`, `app.js` ~l. 6918). Cada emoji tiene su propia
  luz, su color y su perspectiva, y en Android cambian de aspecto con cada versión. Se ven baratos al lado
  del reloj de arena y de los iconos de línea.
- **Demasiados radios y pesos.** En `styles.css` hay **15 radios distintos** muy usados (2, 3, 5, 6, 7, 8, 9,
  10, 11, 12, 14, 16, 18, 99, 999 px) y casi todo el texto va en **800 o 900** (357 reglas frente a 6 en
  400). Cuando todo va en negrita, nada destaca. Solo en Entreno conviven 10 (`.gck`), 11 (`.btn`), 14
  (`.gbig2`), 16 (`.grt`), 18 (`.ghero2`) y 99 (`.hoyseg`).
- **37 tamaños de letra distintos** y una sola familia (la del sistema). No hay una letra con carácter para
  los números grandes (kg, horas dormidas, 1RM), que son el corazón de las dos secciones.
- **Casi no hay movimiento.** Fuera del modo noche, lo único que se mueve es la entrada de la vista
  (`viewIn`, 0,3 s) y el `translateY(-1px)` de las fichas. Marcar una serie, batir un récord o acabar la
  sesión no tiene ningún gesto; apuntar la noche tampoco.
- **El color del sueño no es el mismo en toda la app.** Cada tema define su «sueño» (`TEMAS[].f.sleep`:
  violeta #7c5cff en HUD, #6d5dfc en Magenta, #4f46e5 en Arena…), pero Sueño usa su propio azul fijo
  `--sns` (#4f7fe0 / #2f63d6) y su naranja `--dsu`. En Arena (`c07`) las barras de las tres noches son el
  mismo azul eléctrico que en HUD y desentonan con la paleta de tierra.
- **La barra de arriba se sale durante una sesión.** Con la chapita «8 series» junto a «Entreno», «☰ Más»
  queda de 352 a **425 px** en una pantalla de 412: se corta («☰ Má», `e07`, `e08`, `c02`). Además la chapita
  sigue ahí después de guardar la sesión (`e09`).

### Entreno

- **La portada no tiene imagen propia** (`e01`). Es una lista de tarjetas oscuras iguales; nada dice
  «gimnasio» salvo un emoji de pesa. La semana son siete círculos vacíos de contorno.
- **El héroe sin plan es flojo** (`e01`): «Hoy no toca nada.» en letra normal y un botón de contorno.
  Es la tarjeta más importante de la pantalla y es la más vacía.
- **Las tarjetas de rutina se cortan** a 412 px: «Extensión de tríceps e… ×.», «Zancadas con mancu… ×..»
  (el «×3» queda en «×.»). Dos columnas de 190 px no dan para nombres de ejercicio en castellano.
- **El muñeco de músculos es un robot de rectángulos** (`e06`, `e09b`; `svgCuerpo`, `app.js` l. 9251).
  Cabeza redonda, tronco y miembros de bloques, solo de frente (la espalda, los glúteos y los
  isquiotibiales no se ven aunque se «resalten»), en cian plano. Va escondido dentro de un `<details>`
  («▸ músculos de esta sesión»). Es la pieza que más pide un rediseño.
- **Progreso es un muro** (`e03`): 3.420 px con 1RM, «Tus básicos», bloque, descanso, evolución, volumen
  por músculo, mapa de días, historial y una **tabla** de marcas con columnas estrechas («SERI ES» partido
  en dos líneas). Las barras de volumen (`e03`) son líneas de degradado cian→violeta todas iguales; el
  mapa de días son cuadrados de colores sin más.
- **El cierre de la sesión no celebra nada** (`e09`): un ✓ verde, «Torso A, a medias» y cuatro casillas
  de números. Es el mejor momento emocional de la sección y se ve como un formulario.
- **«¿Qué tal de dura?»** (`e08`): diez botones grises idénticos del 1 al 10. El esfuerzo no tiene color
  ni forma (debería ir de frío a caliente).
- **Cardio y la piscina** (`e04b`): cuatro fichas con emoji gigante. La piscina, que es parte del plan de
  la semana, no tiene ninguna imagen propia (ni agua, ni calles, ni largos).
- **Papel (claro)** (`c01`, `c02`): funciona, pero los botones de serie hecha pasan a un verde sólido
  pesado y las tarjetas blancas con borde gris se ven a formulario de oficina.

### Sueño

- **El reloj de arena va metido en una tarjeta dentro de otra** (`s01b`): la tarjeta de la app, y dentro
  la tarjeta de la figura con «Fig 1» y su propio borde. En los temas claros (`c03`) asoma una **franja
  oscura de ~17 px** bajo la figura (el iframe mide 440 px y el contenido 423); en oscuro se ve como una
  raya clara.
- **El reloj de arena vive en otro mundo de color**: latón, madera y fondo marrón, mientras la tarjeta de
  alrededor es cian y azul marino. Queda como una foto pegada, no como parte de la pantalla.
- **La tarjeta «Justo»** (`s01`): el estado del día es una carita «~» en un círculo amarillo, que parece
  un emoji genérico. Las tres noches son tres rectángulos azules sin gracia.
- **La franja de anotar la noche es plana** (`s04`): un rectángulo azul con «23:45–6:45» encima de una
  rejilla gris. No hay noche, ni luna, ni amanecer; las rayas de la guardia son lo único con textura.
  (En el navegador de prueba las horas salen «11:45 PM» porque el idioma del navegador es inglés; en el
  móvil en castellano saldrán en 24 h.)
- **Mejorar** (`s02`): la gráfica de «Luz y café» es un diagrama de Gantt de barras de colores sueltas
  (luz amarilla, café marrón claro, cena verde, luz baja gris, dormir azul). Las cinco casillas de
  «hechas hoy» son cuadrados vacíos sin icono.
- **Datos** (`s03`): «6h48» grande está bien, pero las barras de la semana (azul, rojo, azul) son bloques
  sin redondeo distinto, y las cuatro tarjetas de cifras son idénticas.
- **Modo noche** (`s05c`): el anillo de 20 minutos y el círculo que respira son casi invisibles
  (#140606 sobre negro). Está bien que sea tenue, pero la forma podría ser mucho más bonita sin dar más luz.

## Tres ideas ambiciosas para Entreno

1. **El gimnasio isométrico vivo (figura tipo /anatomy, tamaño «Hero»).** Una planta de gimnasio en
   isométrico, con el mismo oficio que el reloj de arena: rack de sentadilla con sus ganchos y discos de
   colores por peso (rojo 25, azul 20, amarillo 15, verde 10), banco plano, poleas con cable y pila de
   placas, mancuernero, una calle de piscina al fondo con su corchera y el reloj de ritmo. **Cada aparato
   es una rutina o un grupo muscular**: el de la rutina que toca hoy está iluminado; los que llevas días
   sin tocar, con polvo (más apagados). En la sesión en vivo, la barra del rack lleva **los discos reales
   por lado** que la app ya calcula, y al marcar una serie la barra sube y baja una vez. Sustituye a la
   cabecera plana de la portada; en Progreso, el gimnasio se va «llenando» de discos según subes el 1RM.
2. **Un muñeco de músculos de verdad, de frente y de espaldas, que se calienta.** Un cuerpo dibujado
   (no robot), con los músculos como piezas separadas (pectoral, deltoides, dorsal, glúteo, cuádriceps,
   isquios, gemelos…), que **se ponen rojos como un mapa de calor** según las series de la semana frente
   a tu objetivo (frío = gris azulado, en su punto = ámbar, pasado = rojo). Gira con el dedo de frente a
   espalda. Sale ya desplegado en la portada en lugar de las barras «Series por músculo», y en el resumen
   de la sesión late una vez en los músculos que acabas de trabajar.
3. **Iconos con vida y una sesión que celebra.** Cambiar todos los emojis por iconos de línea propios
   animados que reaccionan al estado: la mancuerna se inclina cuando la serie está activa; el
   cronómetro del descanso gira su aguja y **late en los últimos 10 s**; la llama de «semanas seguidas»
   crece con la racha y se apaga si la pierdes; la gota de la piscina ondula. Al batir un récord, la
   barra de discos del rack se dobla un poco y sale un destello; al terminar, un **podio isométrico** con
   los kg movidos, el % frente a la anterior y las marcas como medallas, en vez de cuatro casillas. El
   «¿qué tal de dura?» como un termómetro de 1 a 10 que se calienta según tocas.

## Tres ideas ambiciosas para Sueño

1. **El dormitorio de noche isométrico (figura tipo /anatomy, «Hero»).** Una habitación en isométrico: la
   cama con su edredón, la mesilla con el despertador, la ventana con la persiana, el radiador o el
   ventilador, el móvil boca abajo y una taza. **Todo cuenta tu noche**: la persiana baja según lo oscuro
   que tengas el cuarto (los seis puntos de «Dormitorio»), por la ventana se ve el cielo de la hora de
   ahora (con la luna o el amanecer reales), la taza humea si aún te queda cafeína, el móvil se enciende si
   no has hecho «pantallas fuera», y el bulto de la cama es más o menos grande según lo que has dormido.
   La víspera de guardia, la bata y el fonendo cuelgan de la puerta. Comparte el mismo latón y la misma
   madera que el reloj de arena, para que las dos figuras sean un solo mundo.
2. **Anotar la noche como un cielo que se dibuja.** La franja de 18:00 a 18:00 se convierte en un
   **horizonte**: de izquierda a derecha el cielo va del atardecer a la noche estrellada y al amanecer, con
   la luna en su sitio. Arrastrar el dedo «tapa» el cielo con un edredón (o pinta la noche dormida en azul
   profundo con estrellas); lo dormido en la guardia, en las rayas naranjas de la guardia; la siesta, con
   el sol de mediodía. Al guardar, la noche se pliega y cae como un grano de arena dentro del reloj de
   arena de abajo: las dos piezas quedan conectadas.
3. **Un Sueño de un solo color y con iconos que respiran.** Que Sueño use el color «sueño» del tema
   (`TEMAS[].f.sleep`) y no un azul fijo, y que el reloj de arena tome los colores del tema (latón en HUD,
   rosa en Magenta, verde en Bosque, papel en Papel, terracota en Arena). Iconos vivos en lugar de la
   carita «~» y los emojis: una **luna que cambia de fase** según tu deuda de sueño (llena = descansado,
   menguante = falta), un **despertador cuyos martillos tiemblan** cuando falta poco para tu hora de
   cama, la taza que humea hasta tu último café, la persiana que baja en «luz baja». En el modo noche, el
   círculo que respira como una **luna de brasa** con un halo que crece y encoge (sin subir la luz), y el
   anillo de 20 minutos como el borde de la luna que se va llenando.

## Los tokens visuales que usan estas secciones

**Colores base** (`styles.css` l. 2–14; los temas los cambian desde `app.js` `TEMAS`, l. 369):

| token | oscuro (HUD) | claro (Papel) | uso aquí |
|---|---|---|---|
| `--bg` / `--bg2` | #070b14 / #0b1120 | #eef2f9 / #e6ecf7 | fondo, celdas (`.gvotro .ic`) |
| `--card` | #111a2b | #ffffff | tarjetas, rutinas, fichas |
| `--ink` / `--ink2` | #e9f2ff / #8fa6c6 | #0d1729 / #5a6d8a | texto / texto apagado |
| `--line` | #1e2b44 | #dbe4f2 | bordes de todo |
| `--brand` / `--brand2` | #38e1ff / #7c5cff | #2563eb / #7c3aed | degradado de `.gbig2`, `.hoyseg .on`, «HOY», rutinas fuerza / agua |
| `--accent` | #a3e635 | #15803d | calistenia, chips de récord, ✓ final |
| `--ok` / `--warn` / `--bad` | #34d399 / #fbbf24 / #fb7185 | #15803d / #b45309 / #be123c | serie hecha (`.gck.on`), choque con guardia, alertas |

**Colores propios de Sueño** (l. 2533–2534, 3559): `--sns` #4f7fe0 (claro #2f63d6) para lo dormido,
`--sng` #d9702f (claro #c4561a) y `--sn-rayas` para la guardia a rayas, `--dsu` #d95926 para los avisos,
`--snlib` #a78bfa (claro #6d28d9). **Modo noche** (l. 2608–2615): fondo #000, texto #b3392f, botones
#140606 / #3a1210 / #c4463b, anillo #5a1712, círculo #2a0b08. El reloj de arena trae su propia paleta
`--anatomy-*` (marrón #120e0b / #18130f, texto #b3a594) dentro de `fig/sueno*.html`.

**Radios:** `--r` 16 px (tarjetas); `.ghero2` 18; `.grt` 16; `.gbig2` 14; `.gvotro` 14; `.btn` 11;
`.gck` 10; `.gvchip` 10; `.sntr .sntipo` 10; `.hoyseg` y chips 99; `.snluna` 22 (círculo).

**Sombras y brillos:** `--shadow` (raya interior de 4 % + sombra de 40 px hacia abajo); `--glow`
(anillo de marca al 26 % + halo); `.card::before` (brillo diagonal de marca al 9 %); `.card>h2::before`
(la rayita vertical de degradado con halo); `.card` con `backdrop-filter: blur(10px)`; fondo de página
con dos manchas de luz y una rejilla de 44 px (`body::before/::after`).

**Letra:** `system-ui` a 15 px / 1,5 para todo, con números tabulares; `ui-monospace` solo en los
`textarea`. Títulos de tarjeta 14 px en 800; héroe 22 px; botón grande 16 px en 900; etiquetas en
mayúsculas de 9,5–10,5 px en 900 con espaciado .1–.14 em (`.ghero2 .k`, `.grtb .ty`, `.dsucap`, `.gsec b`).

**Movimiento:** `viewIn` (0,3 s al entrar), `hsube`/`hfade` (las hojas de abajo), `nocheResp` (10 s,
modo noche), `translateY(-1px)` al pasar por las fichas; todo se para con «reducir movimiento».

## Lo que no se pudo comprobar

- La **piscina en Cardio** sale vacía: la forma con que sembré las sesiones de natación no coincide con
  la que espera la app, así que no vi la ficha de piscina con datos. Sí se ve la rutina de agua.
- El **resumen marcó 0 récords** aunque el press banca subió de 60 a 62,5 kg × 8 con «todas como están».
  Puede ser que ese botón no cuente récords a propósito; no lo he investigado (no es visual).
- No he probado el **tema Bosque** en Sueño ni el **test de reacción** (PVT) por dentro.
- Las capturas son de Chromium sin cabeza: los emojis salen con la fuente del contenedor, no con la de
  Android.
