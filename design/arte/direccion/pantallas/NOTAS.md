# Pantallas · «La jornada» (fase 1, maquetas)

Todo está en `maqueta.html` (una sola página, a mano, sin librerías ni red). Se abre en el navegador y enseña
todas las pantallas; con `?solo=f-hoy` (o `f-comer`, `f-mas`, `f-comp1`, `f-comp2`) enseña una sola a 412×915, y
admite `&h=3` (hora), `&tinte=papel` y `&barra=arriba`. Los iconos son los del juego definitivo
(`../iconos/iconos.js` + `iconos.css`); si ese fichero faltara, la página usa un juego provisional del mismo estilo.
Lo que no tiene todavía equivalente allí (flecha «›», volante, estación, línea, agua, estirar, móvil, charla) usa el
provisional. Datos inventados: un miércoles de trabajo de 8 a 15, entreno a las 18:30, cena, 4 hábitos, y una noche
de guardia del viernes 16 al sábado 17. No hay nada personal.

## Capturas (412×915, en esta carpeta)

| Fichero | Qué es |
|---|---|
| `00-vista-general.png` | La página entera, con todo |
| `0-fichas.png` · `0-tabla-contraste.png` | Las fichas de los 5 tintes y la tabla de contraste |
| `a-hoy-1200.png` · `a-hoy-1200-tarjetas.png` | Hoy al mediodía: primera pantalla y desplazada |
| `b-hoy-0700-alba.png` … `b-hoy-0300-guardia.png` · `b-cinco-horas.png` | La misma Hoy a 5 horas (y las tres dosis de rojo de guardia) |
| `c-comer-hoy.png` · `c-mas-cajon.png` | Comer · Hoy y la hoja «Más» |
| `d-componentes-1.png` · `d-componentes-2.png` · `d-componentes-1-papel.png` | Los componentes (oscuro y Papel) |
| `e-barra-arriba.png` · `e-barra-comparada.png` | La barra arriba frente a abajo |
| `f-tinte-*-1200.png` · `f-cinco-tintes.png` | Los 5 tintes a las 12:00 y a las 21:30 |

## Qué se ve en cada pantalla

**a · Hoy.** El fondo de toda la pantalla es el cielo de esa hora. Arriba va **la regla** (una sola pieza que se
queda pegada al desplazar): la fecha, «Ahora · trabajo · hasta las 15:00», el **depósito de energía** (pequeño, con
una palabra: llena, media, baja) y el botón «+». Debajo de esa fila, **el hilo de 24 h**: 8 horas hacia atrás y 16
hacia delante, con el ahora siempre en el mismo sitio. Lo hecho deja **huella** en trazo sólido con su color (sueño,
trabajo, comida, entreno); lo que viene va en **punteado**; lo que no se hizo es un aro hueco pequeño, sin castigo;
el ahora es un punto que late. **A medianoche no hay corte**: la marca de las 00 se llama «jue» y el hilo sigue.
Después, el selector Conductor · Estación · Reloj · Línea y el **hueco del conductor a sangre** (de borde a borde).
Al bajar: el asistente, «Para hoy» (filas de 52 px con su círculo de marcar), los hábitos como **testigos** (verde
fijo si está hecho, ámbar si toca ahora, apagado si es para luego) y la puerta de la próxima guardia.

**b · Cinco horas.** 07:00 alba (cielo violeta y naranja, sombra hacia la derecha), 12:00 día (azul, sombra corta),
18:30 tarde (naranja abajo, sombra hacia la izquierda, borde de luz cálido), 21:30 anochecer (azul noche, estrellas,
borde de luz frío) y 03:00 de guardia (cielo y piezas teñidos del rojo de la cabina, el hilo en rojo desde las 15:00
del viernes, energía «baja», el ahora late más despacio). Una segunda fila enseña las tarjetas, donde más cielo se ve.

**c · Comer · Hoy.** Regla igual que en Hoy (el hilo está en todas las secciones). Una pieza con «Comer» y el selector
Hoy · Cocina · Plan · Despensa (con el ajuste dentro, sin emoji). Buscador de 48 px. Las cifras del día como **cifra
grande**: 844 kcal a 44 px con su barra y la marca de la meta (2.300), y la proteína (40 de 120 g) al lado. Las
**comidas grandes se conservan tal cual** (etiqueta pequeña, plato a 16 px, kcal a la derecha, proteína debajo,
«en vez de» tachado, lo pendiente en gris) y **suben al primer pantallazo**. La compra y el nutricionista, debajo.

**c · Más.** Ya no es un cajón lateral: es **una hoja que sube desde la barra de abajo**, de la altura de lo que
lleva. Hábitos y Dinero son más grandes (Dinero con su cifra «54 €»); Estudio, 4:20, Eventos y Notas en dos
columnas; Ajustes a lo ancho con «copia: hace 12 días» en ámbar. **Cada recuadro conserva su línea en vivo.** La
sección en la que estás se marca con un borde de marca y la etiqueta «aquí», legible en los 5 tintes.

**d · Componentes.** Botón principal / normal / fantasma / peligro / de icono / grande, el selector único, chips
(normal, elegido, de estado), tarjeta normal / destacada (luz de marca arriba) / de aviso (luz ámbar), el aviso
con «Deshacer» (rectángulo de esquinas de 16 px, 92 % del ancho), filas de lista como las de Ajustes, puertas,
cifra grande, barra con meta (y pasada de meta, en rojo) y la hoja de abajo con su asa.

**e · Barra de secciones.** Propuesta: abajo, flotante, 4 botones de 97×64 px con icono y nombre. Comparación:
arriba, como ahora pero a 44 px.

**f · Tintes.** Noche HUD, Magenta, Bosque, Papel y Arena sobre la misma Hoy, a las 12:00 y a las 21:30.

## Qué cambia respecto a hoy (con cifras)

| Cosa | Hoy | En la maqueta |
|---|---|---|
| Lo que hay encima del dibujo | 344 px (38 % de la pantalla) | 178 px: regla 8–118 y selector 126–178 |
| Conductor en la primera pantalla | 565 px a las 11:00 (de 345 a 910); **288 px** por la mañana | **618 px, entero** (186–804), a cualquier hora |
| Ancho del conductor | 376 px dentro de dos tarjetas (escala 0,627) | 412 px a sangre (escala 0,687): su letra crece un 10 % (6,0 → 6,6 px) |
| Barra de secciones | arriba, píldoras de 35 px | abajo, botones de 97×64 px |
| Primera comida en Comer | a 870 px (fuera de la pantalla) | a **502 px**; se ven 3 comidas enteras y la cena asomando |
| Cifras del día en Comer | fila plana de 16 px | 844 a 44 px + barra con meta; proteína a 28 px |
| Cajón «Más» | 330×915, 58 % vacío | hoja de 412×553, sin hueco vacío |
| Marcar una comida o un pendiente | círculo de 28×28 | 44×44 |
| Botones de 44 px o más | casi solo en Ajustes | **todos** (medido: 0 por debajo en las 18 capturas) |
| Tamaños de letra | 39 distintos (8 a 40 px) | 7: 11 · 12,5 · 14 · 16 · 20 · 28 · 44; pesos 500 · 700 · 800 |
| Esquinas | 34 valores | 6: 4 · 8 · 12 · 16 · 24 · redondo |
| Sombras | ~50 | 3 (`--sombra-1/2/3`), y caen según el sol |
| Movimiento | 26 transiciones, 1 curva | 3 duraciones (120 · 200 · 320 ms), 2 curvas; todo quieto con «reducir movimiento» |
| Degradado cian→violeta | en 4+ sitios a la vez | ninguno: el principal es un color liso |

Las fichas están en `:root` (Noche HUD por defecto) y en `[data-tinte=…]`: superficies 1·2·3 + cara lateral + 2
bordes, texto 1·2·3 + «sobre marca», marca · marca 2 · acento, estado (bien · ojo · mal · info, **ahora por tema**),
las 6 categorías del hilo y una paleta de datos de 6 colores por tema. Las que dependen de la hora (cielo, luz del
borde, sombra) se calculan en cada pantalla.

## Medidas (hechas con Playwright a 412×915)

- **Tocable < 44 px: 0** en las 18 capturas (botones, pestañas, chips, testigos, filas).
- **Texto < 11 px: 0.** Excepción a vigilar: el número del día dentro del icono de calendario (barra de abajo) mide
  8,6 px; es decorativo (el botón dice «Calendario»), pero no cumple la regla si se cuenta como texto.
- **Contraste, barrido completo**: Hoy, Hoy desplazada, Comer y Más × 5 tintes × 5 horas = 100 pantallas, todos los
  textos medidos sobre su pieza: **ninguno por debajo de AA; el peor, 4,56** (texto 3 de Papel sobre la pieza
  teñida de guardia). Tabla de los peores casos por tinte (de las 5 horas):

| Tinte | texto | texto 2 | texto 3 | sobre marca / marca | marca | ojo | bien | hilo (peor color) |
|---|---|---|---|---|---|---|---|---|
| Noche HUD | 15,2 | 9,5 | 6,7 | 12,1 | 10,9 | 10,3 | 8,9 | 5,6 |
| Magenta | 15,4 | 10,2 | 7,0 | 6,2 | 5,5 | 10,4 | 9,0 | 5,8 |
| Bosque | 15,1 | 10,1 | 7,1 | 9,8 | 8,4 | 10,6 | 9,3 | 5,8 |
| Papel | 15,4 | 6,2 | 4,6 | 6,2 | 5,3 | 4,8 | 4,3 | 4,5 |
| Arena | 13,3 | 6,9 | 5,1 | 5,7 | 4,8 | 4,6 | 5,1 | 4,3 |

  «Bien», «ojo» y los colores del hilo se usan en trazos, barras y anillos (piden 3:1): todos lo pasan. «Bien» de
  Papel (4,3) no se usa para texto pequeño.
- **Regla de la maqueta: el cielo nunca lleva texto.** Todo el texto va sobre una pieza opaca, así el contraste no
  depende de la hora. Por eso las etiquetas sueltas de la lámina de componentes van en una pastilla.
- Para medir se han oscurecido los colores de varios temas respecto a los de hoy: marca de Papel `#2563eb` →
  `#2357d6`, de Arena `#c2410c` → `#b83c0a`; texto 2 de Noche HUD `#8fa6c6` → `#b0c2dc`; estados de los temas claros
  más oscuros (ojo `#b45309` → `#a35208` en Papel).

## Lo más fuerte y lo más dudoso

- **Fuerte:** el conductor entero en la primera pantalla a cualquier hora (hoy, por la mañana, se ve menos de la
  mitad); el hilo, que cuenta la continuidad sin explicarla (lo hecho sólido detrás, lo que viene punteado, «jue» en
  vez de un corte); y que la pantalla cambie sola con la hora sin perder contraste.
- **Dudoso:** con el conductor a sangre, **el cielo apenas se ve en la primera pantalla de Hoy** (solo arriba, entre
  piezas y en el parabrisas del propio dibujo); se nota al bajar y en Comer. El hilo a 364 px de ancho reparte 24 h:
  1 h = 15 px, así que las comidas son puntitos. El depósito de energía es ilustrativo: no hay cálculo detrás.
- El hueco del conductor lleva un esquema (parabrisas con el cielo de la hora, salpicadero, volante) solo para dar
  idea; **no es el dibujo** y no se ha montado `fig/conductor.js` dentro.

## Decisiones que necesita el usuario

1. **Barra de secciones: ¿abajo (propuesta) o arriba?** Abajo queda donde llega el pulgar. Arriba, a 44 px, también
   deja ver el conductor entero (246–864) porque abajo ya no hay barra, pero las tarjetas solo asoman 51 px y los
   botones quedan a 8–60 px, lejos de una mano.
2. **¿Cuánto rojo de guardia?** Hay tres dosis en la lámina b: **20 %** (se nota poco), **40 %** (propuesta: el cielo
   granate y las piezas apenas rosadas) y **65 %** (todo muy rojo; de noche puede cansar).
3. **¿El cielo cambia también en los temas claros?** Propuesta: sí, pero «lavado» un 38 % hacia el papel (de noche,
   tarjetas blancas sobre un azul grisáceo). Otras opciones: el mismo cielo que en los oscuros (más contraste de día
   y noche) o un cielo fijo claro que no cambia (pierde la idea de la hora).
4. **Colores fijos por cosa en toda la app**: la maqueta usa los del conductor (trabajo teja, comida verde, entreno
   violeta, eventos turquesa) y el **rojo** para la guardia (el conductor la pinta azul noche en sus paradas, pero su
   cabina es roja). ¿Guardia roja en todas partes?
5. **«Más» como hoja que sube desde abajo** en vez del cajón lateral: va con la barra abajo. Si la barra se queda
   arriba, tiene más sentido mantener el cajón (relleno como en la maqueta).
6. **La energía**: ¿una palabra (llena, media, baja), un porcentaje o solo el dibujo? Y qué la gasta y qué la recarga.
7. **El hilo**: ¿ventana de 8 h atrás y 16 delante (propuesta) o el día de 00 a 24 con el ahora moviéndose?

## Lo que no se ha podido comprobar

- **El conductor de verdad dentro del hueco**: solo hay un esquema. Falta ver cómo casan su cielo y el de la pantalla.
- **El móvil real**: Chromium sin pantalla; en Android la letra será Roboto y puede ocupar algo distinto.
- **El movimiento**: las capturas se hicieron con «reducir movimiento»; el latido del ahora y de la guardia se ha
  visto en el código, no grabado.
- **Contraste de las piezas contra el cielo** (borde de la tarjeta, no texto): no se ha medido; en Papel a mediodía
  las tarjetas blancas sobre el cielo lavado se distinguen sobre todo por la cara lateral y la sombra.
- El juego de iconos lo está cambiando otro agente mientras tanto; si cambia su función, la maqueta vuelve sola a
  los iconos provisionales.
