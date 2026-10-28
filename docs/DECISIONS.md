# Decisiones

Qué se eligió, qué se consideró y se descartó, y por qué. Una entrada por tarea, la más reciente
arriba. Lo lleva la habilidad `tarea-a-fondo`.

## 2026-10-27 · Gastar menos tokens por sesión

**Elegido** (visto bueno del usuario): REA deja de cargarse en cada sesión (`.mcp.json` → `tools/rea.mcp.json`;
se usa por terminal con `npx -y rea-agents@6.8.0` o se vuelve a activar para una sesión de ingeniería inversa);
el parte cierra con «Gasto» (tokens estimados, qué decidir antes, con qué juntar) y la revisión de salud solo
corre si `main` cambió; reglas de «Gastar poco» en `CLAUDE.md`. **Descartado:** borrar la lista de tareas (en
esta sesión ya estaba vacía: es de cada sesión) y quitar Google Drive y Claude Docs desde el repositorio (son
conectores de la cuenta: se apagan en claude.ai). **Supuestos:** las cifras de gasto son estimaciones a partir
del estudio de Comer (~150–250 mil por sesión), no mediciones.

## 2026-10-27 · REA instalado para las sesiones futuras

**Elegido** (lo eligió el usuario): REA como servidor siempre conectado (`.mcp.json`, `rea-agents@6.8.0`)
y su skill `reverse-engineer-anything` copiada en `.claude/skills/`. **Descartado:** usarlo solo por terminal
desde `/ingenieria-reversa` (no gastaba nada hasta usarlo). **Supuestos:** activarlo sin que pregunte
(`enabledMcpjsonServers` en `.claude/settings.json`) lo decide el usuario; no se ha tocado.

## 2026-10-27 · Apuntar el sueño desde la radio del conductor

**Elegido:** que toda la pantalla verde de la radio abra la hoja de anotar (antes solo una pastilla de
81×16 px), y que al abrirse la radio la página baje lo justo para que no la tape la barra de abajo.
La pista dice «toca para apuntar» cuando falta la noche. Informe completo: `docs/informe-sueno-2026-10.md`.
**Descartado:** que tocar la radio cerrada abra directamente la hoja (se perderían el café y el
«¿cómo amaneces?» de un toque), y rediseñar dónde vive el sueño en Hoy (es un rediseño: maquetas primero).
**Supuestos:** el fallo al pulsar era el dedo cayendo fuera de la pastilla. La hoja en sí funcionaba
(lo comprobado). También se arregló la prueba 221 de Dinero, que caía en `main` a final de mes por la
fecha (con la nómina ya cobrada, el mes en curso cuenta como cerrado): congela «hoy» al día 15, como la 263.

## 2026-10-11 · Las cuatro decisiones pendientes del informe

**Hábitos que no existían.** Elegido: un hábito «toca» desde que existe, que es el día en que se
creó o el primero que se marcó, si fue antes. Los hábitos de antes de guardar la fecha de creación
recibieron la del día de la migración; por eso manda lo marcado y no se pierde historia.
Descartado: dejarlo como estaba (bajaba el % de «Tu semana» y el «antes» de los experimentos), y
usar solo la fecha de creación (habría borrado historia real).

**Nota pasada a evento.** Elegido: el evento manda. Moverlo desde Eventos mueve su nota y en Google
sale solo el evento. Quitarlo quita también su nota, y la confirmación lo dice antes: «¿Quitar este
evento y su nota de la libreta?». Lo cambió el usuario en el cuestionario: la primera versión dejaba
la nota suelta en su fecha y él esperaba que se borrara. Descartado: dejar la nota suelta, fusionar
nota y evento al convertirla, y dejarlos separados (salían dos veces y en fechas distintas).

**«Cuándo llegas» de las huchas.** Elegido: la hoja, la lista y el Excel usan la cuenta del
asistente (metaHucha), en la que la fecha («para julio») y la lista de casa mandan. Con fecha, la
línea dice «para <mes> · X €/mes». Descartado: mantener la cuenta propia de cada pantalla.

**Aviso de copia.** Elegido: 13 días, que es lo que ya hacía la app. El 7 «una vez a la semana» del
código nunca se usaba, porque normalize guarda 13. Descartado: 7 y 3 días.

## 2026-10-11 · Escáner de códigos de barras

**Elegido:** pedir a Open Food Facts los nombres en español y otros idiomas (manda el español; sin
ninguno, la marca), y enseñar una ficha con el nombre editable antes de guardar. Los ya guardados
como «… sin nombre» pasan a llamarse por su marca al cargar.

**Descartado:**
- Guardar al momento y dejar renombrar después: el fallo era precisamente no ver el nombre.
- Traducir el nombre portugués o inglés: sin red de traducción en el móvil; se prefiere el que
  Open Food Facts ya tiene en español.
- Renombrar «Salmão com legumes» ya guardado: no se sabe su nombre en español sin volver a consultar.

## 2026-10-12 · El banco del sueño con tu guardia

**Elegido:** la figura isométrica (fig/sueno.html, hecha con la skill anatomy) vive dentro de la app
y se abre con «cómo funciona» en Sueño → Guardia. Recibe el plan de la guardia elegida (horas, lo
dormido, los cafés, la siesta que hayas movido) detrás de «#p=», que el navegador nunca manda a
ningún servidor: no sale del móvil. Si la guardia está en marcha, abre en la hora de ahora. Va en una
capa propia, fuera de #main y de la hoja del día, para que un repintado no recargue la figura; «atrás»
y «Cerrar» la quitan sin salir de Guardia. Sigue el tema: claro u oscuro.

**Descartado:**
- Pintarla dentro de la tarjeta del simulador: se rehace en cada render y la figura se recargaría.
- Pasar el plan por «?…»: viajaría en la petición; además el service worker trata esa URL aparte.
- Leer la guardia desde la figura (localStorage compartido): la ataría al formato de los datos de la
  app; con el plan ya calculado por snPlanSim la figura no repite la lógica de turnos.
- La guardia típica fija (la maqueta A): el usuario pidió su guardia real.

## 2026-10-12 · Del banco de pruebas al reloj de arena

**Elegido:** la figura de Sueño → Guardia pasa a ser un reloj de arena de madera y latón
(design/sueno-reloj/). El usuario eligió esta máquina porque el banco «no se entiende» y era
«frío»; la quiere para entender, no para planear. Cada pieza es una parte del modelo:
- la arena es el cansancio: cae al bulbo de la tapa de latón despierto; al dormir el bastidor gira
  y ese bulbo se vacía (más rápido de lo que se llenó);
- una esfera de día y noche tras un horizonte es el reloj interno: el sol asoma de 11:00 a 23:00,
  cuando el término principal del ritmo es positivo, y está en lo más alto a las 17:00;
- el café es un manguito de latón translúcido que tapa parte de la arena (enmascara, no quita);
- la regla de la izquierda, con zonas roja, ámbar y verde, es la alerta.
Mismo modelo que la app; los colores (madera, latón, arena, cielo) son lo que se explica.

**Descartado:** la balanza (lee bien la alerta pero no el sueño como vaciado), el riel con levas
(mejor para planear, y el usuario quiere entender) y el cuadro de mandos (otra vez abstracto).
La esfera no dibuja el bajón de después de comer ni la inercia al despertar: están en la cifra.

## 2026-10-12 · Sin pestaña Guardia: tres órdenes y tu reloj de ahora

**Contexto:** el usuario no usaba la pestaña Guardia ni le encontraba sentido a sus cifras («19 → 26»,
«tuyo → mejor»). El reloj de arena le gustaba, pero «debería tener algo de importancia».

**Elegido:**
- Sueño tiene tres pestañas: Hoy, Mejorar y Datos. Un enlace viejo a Guardia cae en Hoy.
- La víspera y el día de guardia, la tarjeta de Sueño (en Hoy y en Sueño → Hoy) da tres órdenes con
  hora, sin cifras: la siesta antes de entrar (o «esta noche, a la cama a tu hora»), el último café y
  la salida (siesta antes de conducir si conduces y hace falta; si no, la siesta al llegar). Salen
  del mejor plan de la app, o del tuyo si ya lo guardaste. «Avisarme a esas horas» guarda ese plan y
  enciende sus avisos (suenan con la app abierta y van al calendario suscrito).
- Tu reloj de ahora sustituye a la curva «Tu energía hoy» en Sueño → Hoy: el reloj de arena con lo que
  has dormido de verdad (lo apuntado), parado en la hora de ahora; el día de guardia y el saliente,
  con tu guardia. «Qué es cada pieza» lo abre entero con su leyenda.
- Fuera el simulador (gráfico arrastrable, cifras con flecha, tabla, paso a paso con «Avisar» por
  paso) y su CSS: unas 290 líneas.

**Descartado:** dejar la pestaña con otra cara (el usuario dijo que no la usa), un aviso de una sola
línea, y el reloj solo como botón en el aviso de guardia (no le daba importancia).

**Supuestos:** los días normales el reloj no lleva cafés (la app no apunta la cafeína que tomas); la
siesta del saliente es la que elige el mejor plan (de 2 a 4 h).

## 2026-10-12 · Tus platos por el nombre → semana prototipo → compra

**Contexto:** el usuario quiere escribir platos con texto, que la app los entienda con sus ingredientes
y su preparación, montar con ellos una semana prototipo y sacar de ahí la compra («qué hay que tener»).
Respuestas: solo el nombre; la preparación la propone la app; desayuno, comida y cena; la compra de
las dos formas (con cantidades y sin ellas). Maqueta aprobada («Me vale, móntalo»).

**Elegido:**
- Vive en **Comer → Plan**, al pie de la semana: una tarjeta «Tus platos» con un campo de texto (un
  plato por línea). No es una pestaña nueva: el plan ya es donde se monta la semana.
- La app lee cada línea sin conexión, en tres escalones: un recetario de 44 platos de casa (con
  cantidades por ración y pasos escritos); si no está, los ~85 platos que ya conoce el lector de frases
  (con pasos según cómo se cocinan); y si tampoco, patrones («crema de X», «X al horno con Y», «X con
  Y»), que deducen ingredientes y pasos. Lo que no reconoce no se lo inventa: lo dice y va a la compra
  tal cual.
- La lectura se puede corregir antes de guardar: para qué comida va, ± gramos, quitar o añadir un
  ingrediente, contestar la duda (el curry: ¿leche de coco, nata o nada?) y cambiar los pasos.
- Los platos guardados son platos normales de la app (con macros, pasos e ingredientes) con la marca
  «tuyo»; volver a escribir uno no lo duplica, lo actualiza.
- La semana prototipo se enseña antes de usarla, con tres opciones: cocinar para 2 días (el segundo
  son sobras), no repetir en días seguidos y, en guardia, táper para la comida (la cena es del
  hospital). «Otra combinación» baraja. «Usar esta semana» la escribe en el plan de esa semana (lo de
  Cocina y la compra se recalculan solos) y te lleva a la compra.
- La compra tiene un tercer modo, «Qué tener»: los mismos ingredientes sin cantidades, con lo que ya
  hay en casa tachado. Marcar ahí es lo mismo que marcar en «Comprar».

**Descartado:** usar una IA externa para entender los platos (los datos no salen del móvil), una
pestaña nueva en Comer (son cuatro y Plan ya es la semana) y escribir los ingredientes a mano (el
usuario eligió «solo el nombre»).

**Supuestos:** las cantidades son por ración de adulto y aproximadas; los pasos de los platos fuera
del recetario son una propuesta genérica según el método (horno, plancha, guiso…); el desayuno se
repite en rotación con los platos de desayuno que tengas.

## 2026-10-13 · «Hoy» desde el asiento del conductor

**Contexto:** el usuario quería que «Hoy» entero fuera algo visual y vivo con los eventos del día,
el sueño y lo demás («una estación de autobuses indicando los eventos mientras se pone la hora»).
Se probaron tres maquetas: un panel de lamas (le hizo gracia, no le convenció), la estación vista
desde fuera (mejor, pero «tan alejada») y la vista del conductor: «Me gusta… súbela a main y vamos
modificándola».

**Elegido:**
- «Hoy» abre de serie en **🚌 Conductor**; «Reloj» y «Línea» siguen en el mismo interruptor y la
  elección se recuerda (clave nueva, para que el conductor le salga también a quien tenía el reloj).
- La vista vive en `fig/conductor.html` (va en la caché sin conexión) y recibe el día por la
  dirección: la agenda de Hoy (cada cosa con su índice), la hora (avanza sola con la app abierta),
  lo dormido anoche y el objetivo, el sol y cuántas cosas quedan en «Para hoy».
- Cada cosa es una parada con su letrero; el autobús está parado en la de ahora y va de camino en
  los ratos libres. Salpicadero: hora y lo que queda, depósito de sueño, próxima parada y lo de
  ahora; arriba la línea de hoy, en el retrovisor la última parada. De noche, en la cochera.
- Tocar un letrero, el visor o el retrovisor abre la hoja de esa cosa (la misma de siempre); el
  depósito abre Sueño; la máquina de billetes lleva a «Para hoy». Llega por postMessage y solo se
  acepta de nuestra página y de ese marco.
- Con el conductor, la tarjeta de Sueño no se repite debajo (está en el salpicadero).

**Descartado por ahora:** dibujarlo dentro de app.js sin marco (más trabajo; se hará si el parpadeo
al repintar molesta); la tira corta de «¿Cómo amaneces?» (sigue la tarjeta de siempre).

**Supuestos:** en otros días que no son hoy, el conductor se pone a las 10:00; la noche dura tu
objetivo de sueño si «a la cama» no tiene hora de fin; las cosas sin hora (un entreno sin hora) no
son parada.

## 2026-10-13 · El conductor, con el informe aplicado

**Contexto:** «Aplica todas las mejoras del documento»: el informe de errores, errores de concepto,
fallos, mejoras y partes que faltan del conductor (C1–C6, F1–F7, P1–P7, M1–M7).

**Elegido:**
- **Sin marco.** El conductor es un módulo (`fig/conductor.js`) que se pinta dentro de la página y
  se crea una sola vez: volver a pintar Hoy mueve el mismo dibujo a su hueco y le pasa los datos.
  Se acaba el parpadeo, el postMessage y la dirección larga. `fig/conductor.html` queda como
  envoltorio para la maqueta.
- **El modelo del día es el de la app:** la guardia o el turno de ayer que acaban hoy son el primer
  servicio (el saliente empieza de servicio hasta el relevo); de guardia por la noche el autobús va
  de «SERVICIO NOCTURNO ☾», no a la cochera; la siesta del saliente es «SIESTA EN LA COCHERA»;
  anoche va de tu hora de cama de ayer a la de levantarte.
- **Dos cosas a la vez** (una comida dentro del turno): el autobús se queda en la parada mientras
  dure algo y el visor dice las dos («Comida · en trabajo hasta 15:00»).
- **Un toque hace lo rápido:** en el cartel de una comida con platos que ya toca, la apunta; en el
  de un entreno con rutina, lo empieza. Mantener pulsado abre la hoja. Lo hecho lleva ✓ y lo que
  pasó sin apuntar pregunta «¿la apuntas?» (también en el retrovisor).
- **Lo que faltaba:** comida del día (kcal frente al plan) en el salpicadero, señales en la cuneta
  (las órdenes de la guardia o el último café), la nota con el entreno sin hora, «viendo las HH:MM ·
  volver» al arrastrar, día pasado («DÍA TERMINADO, n de m hechas») y futuro, tema claro, teclado y
  lector de pantalla (las paradas también como botones), y a las 24:00 pasa solo al día siguiente.
- Con el conductor, «¿Cómo amaneces?» va en una fila (solo la escala); «ánimo y lo que te propones»
  la abre entera.
- **Arreglo de paso:** la guardia de la agenda siempre sale al día siguiente. Antes, si la hora de
  salida era igual o mayor que la de entrada (la de 24 h de 09:00 a 09:00, la UMI de sábado de 10:00
  a 11:15) se leía como del mismo día: duraba un cuarto de hora, el reloj no la daba por «en curso»
  y el saliente no empezaba de servicio.

**Descartado:** mantener el marco (cada repintado lo recargaba y no compartía el tema ni el
teclado); una tercera pestaña para la vista (sigue el interruptor de tres).

**Supuestos:** «lo rápido» solo desde una hora antes de la parada y en el día de hoy; las cosas de
madrugada son de la guardia de esta noche si caen dentro de ella y si no, no son parada; las
señales sin guardia son solo el último café, seis horas antes de la cama.

## 2026-10-13 · Doble vista en Hoy y paisaje según lo que toca

**Contexto:** «se podría añadir doble visión, que se pueda cambiar con un botón, primero la del
autobusero y luego la del /anatomy… cuando tengo que trabajar que se vea la ciudad, cuando me toque
entrenar que se vea algo, cuando esté libre que se vea en un bosque… diferencia entre por la mañana y
por la tarde-noche».

**Elegido:**
- Un botón encima de la vista («⇄ 🏗 Estación» / «⇄ 🚌 Conductor») cambia entre el conductor (de
  serie) y la estación isométrica; se recuerda (clave propia). La estación se genera con el kit de
  /anatomy (`design/hoy-estacion/app.mjs` → `fig/estacion.js`) y se carga la primera vez que se
  elige, porque el dibujo pesa ~400 KB; va en la caché sin conexión.
- **El paisaje sale de las paradas.** Cada parada tiene su ambiente: la jornada es la ciudad, la
  guardia el hospital (fachada blanca, cruz roja, ventanas encendidas, helipuerto en la estación),
  el entreno el polideportivo (campo, valla, focos y el gimnasio violeta) y lo libre el bosque (pinos,
  árboles de copa, luciérnagas de noche). En el conductor cada tramo de carretera toma el de su
  parada y entre dos se mezclan manzana a manzana; en la estación el decorado de detrás del andén se
  funde con el de la hora.
- **La hora se nota:** el sol cruza el cielo (bajo y naranja por la mañana y por la tarde), de noche la
  luna y las estrellas; en la estación los materiales se templan de tarde y se apagan de noche, y se
  encienden ventanas, farolas y focos.

**Descartado:** que el ambiente lo elija el tipo de día entero (un día de trabajo con entreno por la
tarde perdería el polideportivo) y un decorado distinto para comidas (van dentro de lo que toque).

**Supuestos:** una comida dentro de la jornada es ciudad; fuera, bosque; la noche y la siesta son
bosque; el polideportivo se ve también en el rato de antes de entrenar (tres cuartos de hora).

## 2026-10-13 · El Lloretazo, en el acantilado

**Contexto:** «El LLORETAZO tiene que ser un poco diferente, tiene que salirse el conductor del
camión e irse a un acantilado con vistas al mar mientras se echa un cigarro».

**Elegido:**
- **Conductor:** mientras dura el Lloretazo, por el parabrisas se ve un mirador sobre el mar
  (apartadero de grava, barandilla abierta en el centro, el cabo con su faro y su haz de noche, el
  brillo del sol o de la luna en el agua). El conductor (camisa azul, chaleco con franja, gorra) baja
  del autobús y anda hasta el borde (el primer 12 % del rato), se queda fumando de cara al mar con la
  brasa y el humo vivos, y al final vuelve ya sin el cigarro. La carretera que lleva hasta allí va por
  la costa: mar a la izquierda tras un murete, roca a la derecha.
- **Estación:** el decorado pasa a «acantilado»: mar con olas, un acantilado de dos escalones con
  hierba y matas, el conductor fumando en el borde y el faro, que se enciende de noche.
- El Lloretazo se reconoce por su nombre en la agenda (marca `ll` en los datos del conductor).

**Supuestos:** todo el rato del Lloretazo (también la ida y la vuelta que lleva dentro) es la escena
del acantilado; el humo y la brasa se quedan quietos con «reducir movimiento».

## 2026-10-13 · Semana y Mes con el lenguaje del conductor

**Contexto:** con las maquetas planas e isométricas a la vista: «Sí a las tres, monta Semana y Mes»
(las dos vistas con un botón y la plana de serie; la guardia en azul noche en las dos; un toque en un
andén o una baldosa abre ese día en Hoy).

**Elegido:**
- **Semana, plana:** el tablón de la cochera sustituye a la tira de días y a las tarjetas. Una fila por
  día (más ayer) en la misma escala de 6 a 2: el autobús del tipo de día, sellos de hábitos, la jornada
  roja, la guardia azul noche, las paradas (en ámbar las que pasaron sin apuntar), la noche y al final lo
  dormido o lo que toca dormir. Debajo, la tarjeta de siempre del día que tocas (de serie, hoy).
- **Semana, isométrica:** la cochera con siete andenes desde el primer día de la ventana.
- **Mes, plano:** la rejilla de siempre (se edita igual), con la ficha del día en lugar del icono y el
  nombre: búho «☾ URG/UMI» la guardia, autobús rojo la jornada (violeta la de fuerza), flecha a la
  cochera el saliente, «F/S» el libre, autocar las vacaciones. El abono del mes arriba (guardias hechas
  de las que tocan, horas de servicio, findes libres); en «Este mes» se quita la barra de guardias.
- **Mes, isométrico:** el tablero de fichas con la canceladora (seis semanas).
- Las isométricas se generan con el kit de /anatomy (`design/semana-mes-iso/app.mjs` →
  `fig/calendario-iso.js`); lo fijo va dibujado y lo del día lo pinta el móvil con el kit dentro. Se
  cargan la primera vez que se eligen.

**Descartado:** mantener la tira de días encima del tablón (sería lo mismo dos veces).

**Supuestos:** las horas de servicio del abono son las de la guardia (de entrar a salir) y las de la
jornada; un finde libre es sábado y domingo libres o de vacaciones dentro del mes; un turno llamado
«Vacaciones» cuenta como vacaciones aunque no esté en un rango.

## 2026-10-13 · Propuestas para Calendario: fichas, carné y la carretera del mes

**Contexto:** «Propuestas de cambios visuales en el apartado calendario basándote en modelos estáticos
de /anatomy y construyendo un modelo alternativo como el de la visión en primera persona del conductor.
Evalúa qué se puede cambiar, qué se puede mejorar y cómo, y eliminar las partes largas y sobreinformadas».
Solo informe y maquetas: la app no se toca hasta el visto bueno.

**Medido (412 px, octubre de ejemplo):** Mes 1 911 px, 2,1 pantallas, 62 botones; Semana 1 224 px, 28
botones; Hoy 1 586 px, 37 botones. Lo que sobra: las guardias contadas tres veces en Mes, los eventos en
tres sitios, 845 px de cuadrícula con el 70 % vacío, «8–15» escrito 20 veces, los hábitos en cuatro
sitios, mandos apilados (118 px en Semana, 80 en Hoy) y un asistente de 482 px más alto que el día.

**Propuesto (`design/calendario-propuestas/`, informe publicado):**
- **Fig 1, las fichas estáticas** (`fichas.mjs`): los seis objetos del tablero como `<symbol>` fijos
  (73 KB) para la casilla, el tablón, la cabecera de Hoy y la leyenda; las horas solo cuando no son las de
  siempre.
- **Fig 2, el carné de abono** (`carne.mjs`): una tarjeta con el mes y el servicio grabados, las tres
  cifras, la regla del mes con la aguja de hoy y, en la versión completa, el mes en 5×7 con un agujero
  por día pasado. Tocarlo abre la hoja del mes (lo que hoy es «Este mes»). Recomendada la corta encima
  de la cuadrícula de cinco semanas.
- **Fig 3, la carretera del mes** (`carretera.mjs`): el modelo en primera persona. Los días como mojones,
  la guardia un túnel, el finde libre un área de descanso, las vacaciones la salida a la playa, los
  eventos señales azules; el salpicadero con la próxima guardia y la tira del mes arriba. Sustituye a la
  cuenta atrás, a «Próximos» y a «Eventos de octubre».
- **Recortes medidos sobre la app real:** Mes 1 911 → 645 px (32 botones); Semana 1 224 → 804 (10);
  Hoy 1 586 → 1 393 con la carretera dentro (18), 1 059 sin ella.

**Pendiente de decidir:** Mes A (carné corto + cuadrícula) o B (carné completo como vista); la carretera
en Hoy, en Mes o en los dos; si «Hábitos de la semana» sale de Semana; si el tablero isométrico de Mes se
queda.

**Supuestos:** las cifras de «después» son la app con bloques ocultos o sustituidos por CSS/DOM (±20 px al
construir); «las horas de siempre» son las de la jornada de diario de ajustes; la hoja del mes conserva
«Este mes» entero.

## 2026-10-13 · Calendario, tanda 1: Mes con las fichas estáticas, el carné y la hoja del mes

**Contexto:** del informe de propuestas, el usuario eligió la A («carné corto encima de la cuadrícula»),
la carretera en Hoy y en Mes, los hábitos plegados y que el tablero isométrico se quede.

**Elegido:**
- **Las fichas, estáticas** (`fig/calendario.js`, generado por `design/calendario-propuestas/build-fig.mjs`):
  los seis objetos como `<symbol>` y cada casilla un `<use>`. Las horas de la jornada de diario ya no se
  escriben: solo salen las que no son las de siempre («15→8», «→8», «10→11:15»).
- **El carné corto** en el sitio del abono: el mes y el servicio grabados, las tres cifras y la regla del
  mes con la aguja de hoy. Tocarlo abre **la hoja del mes**, que es «Este mes» tal cual (cupo, servicio,
  vacaciones, repartir, ⋯), fuera de la pantalla hasta que se pide. «+ vacaciones» cierra la hoja.
- **Cinco semanas desde la de hoy**, sin la semana pasada delante, y la casilla mide lo que su contenido
  (mínimo 92 px): la cuadrícula ya no se estira a la pantalla. Los otros meses van del 1 al último.
- **El aviso de mantener pulsado** es un aviso que sale una vez; **la leyenda** va detrás de un «?».
- Mes (412 px, octubre de ejemplo): 1 911 → 1 175 px con «Eventos de octubre» todavía (se va en la tanda 3
  con la carretera); la cuadrícula 845 → 585 px.

**Descartado:** cargar las fichas en diferido como la vista isométrica (parpadeaban al abrir la app en Mes);
van en un script fijo de 113 KB que el service worker guarda.

**Supuestos:** «las horas de siempre» son las de la jornada de diario de Ajustes; el `<use>` toma los
estilos del documento (Chrome y Firefox lo hacen; comprobado en claro y oscuro).

## 2026-10-13 · Calendario, tanda 2: Semana y Hoy con una fila de mandos, hábitos y asistente plegados

**Elegido:**
- **Semana:** una sola fila «▦ Tablón · 🏗 Cochera · ◷ Por horas» (el tablón y la cochera son dos formas de la
  misma agenda; eran tres filas de mandos, 118 px). La leyenda del tablón y «mi rutina por tipo de día» van en el
  ⓘ de la cabecera. **Hábitos de la semana** se pliega a una fila por hábito con «editar ›» en la cabecera
  (273 → 178 px con tres hábitos): se marcan en «Para hoy» y en la tarjeta del día. 1 224 → 986 px.
- **Hoy:** «🚌 Conductor · 🏗 Estación · ◷ Reloj · ☰ Línea» en una fila: la estación es un modo más, no una
  vista dentro de un modo (eran dos selectores apilados). El asistente deja abierta la tarjeta de hábitos y las
  de dinero y 4:20 van en una línea con el texto recortado, que se abre al tocar (482 → 399 px). 1 586 → 1 459 px;
  la cuenta atrás y «Próximos» se van en la tanda 3 con la carretera.

**Descartado:** plegar también la tarjeta de hábitos del asistente (sus botones son lo que se toca cada mañana) y
quitar del todo «Hábitos de la semana» (el usuario prefirió plegarlo).

**Supuestos:** el texto recortado de una tarjeta plegada sigue en el DOM (la prueba del dinero lo lee); «Estación»
guarda las dos claves (modo y vista) para que el conductor y la estación sigan siendo la misma cosa por dentro.

## 2026-10-13 · Calendario, tanda 3: la carretera del mes en Hoy y en Mes

**Elegido:**
- **`fig/carretera.js`**, un módulo como el conductor: la misma cabina y cámara, pero la carretera son los días
  que vienen. Mojones con el número y el color del tipo; la guardia es un túnel con su cartel (tipo, horas y
  «en N días»); el finde libre, un área de descanso; las vacaciones, la salida a la playa; cada evento con
  fecha, una señal azul. El salpicadero dice la fecha, la próxima guardia, el finde y la playa; la tira de
  arriba es el mes entero. Se arrastra (hacia delante = avanzar días), tocar un mojón, un cartel o una marca
  abre ese día en Hoy, y con el teclado van las flechas. Se carga la primera vez que hace falta.
- **En Hoy**, la tarjeta «Lo que viene» en el sitio de «Próximos»; la cuenta atrás se va (la lleva el
  salpicadero). **En Mes**, el tercer chip «▦ Plana · 🏗 Isométrica · 🛣 Carretera»; «Eventos de …» se va
  (los eventos están en la casilla, con el nombre entero en el title, y en la carretera).
- Solo los eventos con fecha van como señal: los semanales son rutina y saldrían cada semana.
- Medido (412 px, octubre de ejemplo): Hoy 1 586 → 1 560 px con la carretera dentro (48 botones de los que 14
  son los de la carretera); Mes plana 1 911 → 783 px; Mes carretera 585 px.

**Descartado:** meter la carretera en Semana (la semana ya es el tablón y a siete días la carretera queda vacía).

**Supuestos:** la carretera enseña 31 días desde hoy (desde el día 1 si miras otro mes); dentro del túnel
(cuando avanzas hasta el día de la guardia) no se pinta el portal, para no ver negro.

## 2026-10-13 · Carretera: lo que falta para salir del túnel y lo del día (del cuestionario de la tanda 3)

**Pedido:** «dentro del túnel que se vea cada x tiempo tantos km/tiempo para salir (terminar la guardia)» y «que
salten los eventos del Día, incluso que aparezcan algo también para hábitos, comida y entreno cuando toque».

**Elegido:**
- **El túnel de hoy.** De guardia (o saliente de madrugada, hasta el relevo), la carretera de Hoy empieza dentro
  del túnel: paredes, techo, lámparas y al fondo la boca de salida, que se acerca según pasan las horas (su
  distancia es lo que falta entre lo que dura la guardia). En la boca, «SALIDA · 9:15 / 6 h 40»; y cada 3 m, un
  cartel colgado «SALIDA · 3 h 35 / a las 9:15» con lo que faltará al llegar a ese punto. El salpicadero dice
  «guardia URG · sales 9:15». Si avanzas días, el túnel de hoy queda atrás. Los túneles de guardias futuras
  llevan los mismos carteles con lo que dura la guardia entera.
- **Lo del día, cuando toca.** El entreno de cada día es una señal violeta baja a la derecha («ENTRENO · 17:30 /
  Fuerza»), sacada del mismo bus que Hoy; las comidas de mañana y pasado, una verde baja a la izquierda
  («3 COMIDAS / 8:00 · 14:00 · 21:00»); los hábitos que tocan esos dos días, un banderín amarillo con el número en
  el mojón. Solo dos días de comidas y hábitos: más lejos son rutina y llenarían la carretera de lo mismo.
- Prueba 280 (en cadena con la 279): con el módulo cargado, la escena con una guardia en marcha (900 de 1 095 min)
  pinta la boca y tres carteles que bajan hasta «2 h 49», las señales de entreno y comidas y el banderín; en la
  app, la guardia de mañana lleva sus carteles. Sin los carteles caen 2 de las 3.

**Descartado:** señales de comida y hábitos para los 31 días (ruido), y un cartel por hora (a 11 m de túnel
caben tres como mucho antes de que se solapen).

**Supuestos:** «faltan» se calcula con la hora del teléfono al pintar; la carretera no se repinta sola cada minuto
(al volver a Hoy sí). Los carteles se saltan si en pantalla miden menos de 7 px o más de 330 px.

## 2026-10-13 · Mes: la guardia en rojo chillón con un tren grande; casa con jardín; dos autobuses distintos

**Pedido:** «los días de guardia tienen que aparecer con un color rojo chillón e incluso pon un tren de tamaño mucho
mayor al resto, y el día de saliente y las vacaciones en vez de un autobús deberías poner una casa con un jardín, y
los días de entreno y de trabajo un autobús pero que se diferencien».

**Elegido:**
- **La guardia es un tren rojo** (`#ff2b3a`, baldosa roja, borde rojo de la casilla): locomotora con la caldera,
  la chimenea con el humo, la cabina con el aro del tipo (ámbar URG, violeta UMI) y un vagón detrás. Es más largo
  que la baldosa y en la casilla va a 46 px frente a los 30 de las demás fichas (se sale de su sitio a propósito).
  El mismo rojo en el tablero isométrico, en la leyenda y en el mojón de la carretera; el túnel sigue como estaba.
- **Saliente y vacaciones, la casa con jardín**: césped, tejado a dos aguas, puerta, ventana, seto y árbol. El
  saliente lleva la luna sobre el tejado y la flecha que entra por la puerta (vienes de la guardia a dormir); las
  vacaciones, la misma casa de día con la piscina y la sombrilla.
- **Dos autobuses**: la jornada es el urbano, largo y claro con el letrero rojo-naranja; el entreno, el microbús
  violeta, más corto, con la barra de pesas en la baca.
- Las piezas viven una sola vez: `fichasDe(P, C)` en `design/calendario-propuestas/fichas.mjs` las da para
  cualquier proyección, y el tablero isométrico (`design/semana-mes-iso/app.mjs`) las toma de ahí. Generados:
  `fig/calendario.js` (159 KB; las fichas 112 KB, antes 73) y `fig/calendario-iso.js` (350 KB).
- Prueba 281 en cadena: borde y tren rojos y 46 px frente a 30, casa en saliente y vacaciones, microbús distinto del
  urbano, y el tablero isométrico sin el búho azul. Con las fichas anteriores caen las 3.

**Descartado:** un tren también en la carretera (ahí la guardia ya es el túnel) y escalar el tren con CSS en el
tablero isométrico (se dibuja grande de origen y se sale de la baldosa como en la casilla).

**Supuestos:** el tren se pinta por encima de la casilla vecina solo dentro de su propia casilla (la casilla
recorta); en el tablero, la baldosa siguiente tapa la cola del vagón, que es lo que se ve en una vía.

## 2026-10-13 · Ajustes: los colores del calendario (el tren, los autobuses, la casa, el árbol)

**Pedido:** «pon en ajustes para que se pueda cambiar el color de los días de la semana o del autobús y de la casa y eso».

**Elegido:**
- En **Ajustes → Cómo se ve → Calendario**, seis colores con su ficha delante: Guardia · el tren, Jornada · el
  autobús (su letrero), Entreno · el microbús, Saliente · el tejado, Vacaciones · el tejado, Libre · el árbol; y
  «colores de serie». Se guardan en `store.calcol` (solo los que cambias; lo demás, los de serie).
- Cada color tiñe **el mismo material del kit** en todas partes: la ficha de Mes y la leyenda (`.cf`), el tablero
  isométrico (`.ci`) y el mojón de la carretera (`D.col`), más el borde de la casilla y la variable `--cal-*`
  para el CSS. `aplicarColoresCal()` calcula las mismas sombras que `comun.mjs` al generar las figuras (con el
  tono oscuro del tren derivado del color) y las mete en `<style id="cal-col">`, con `html` delante para ganar al
  CSS generado. Para que el saliente y las vacaciones puedan ir de distinto color, cada casa lleva su tejado
  (`m-tejsal`, `m-tejvac`) y el árbol del libre es `m-arbol`.
- **Fallo que salió al hacerlo:** un `<use>` se tiñe según dónde está el símbolo original, no dónde se usa. Los
  símbolos vivían en un `div` sin `.cf`, así que ni la piel clara ni ningún color de contexto llegaban a las
  fichas (en modo claro salían con la baldosa oscura). El contenedor de símbolos lleva ahora `.cf`.
- Prueba 282 en cadena: la tarjeta con sus seis colores, el cambio llega a Mes, al tablero y a la carretera, y
  «de serie» lo devuelve. Con el ajuste quitado caen las 3.

**Descartado:** colores por día de la semana (lunes, martes…): el usuario habla de los tipos de día (guardia,
jornada…) y es lo que cambia la ficha; un color por tipo de guardia (URG/UMI) ya lo lleva el aro.

**Supuestos:** el color del autobús de la jornada es el del letrero del techo (la carrocería sigue clara para que
se lea en las dos pieles); las dos pieles usan el mismo color tuyo, con las sombras de cada una.

## 2026-10-13 · Rediseño de Hoy (conductor y estación): plan en cinco tandas, y la tanda 0

**Pedido:** rediseñar Hoy con /anatomy y /redisena-seccion manteniendo el autobús: la mañana real (ducha, café,
vestirse, salir 7:31, bus 7:35 o taxi), el taxi como hábito que desaparece si se quita, la cochera por dentro
(cama, ducha, móvil, estudio, play), la cabina con manos y la rotación, la sesión que no dura todo el día, la bici
a las 15:00, el parque de entrenamiento. Nunca andando (está lejos); dos duchas solo cuando hay gym.

**Elegido (plan):** tanda 0 el fallo de la sesión y las medidas; tanda 1 `estadoDe(día, minuto)`, modelo puro
del día; tanda 2 hoja de escenas con /anatomy y visto bueno; tanda 3 conductor; tanda 4 estación por dentro;
tanda 5 hábitos dentro del dibujo + pruebas + despliegue. Es un «Epic» de /anatomy (6 h o más) troceado en
tandas de 2–4 h que se despliegan solas.

**Tanda 0, hecha.** No era diseño: el autobús se quedaba aparcado en el cartel «10:00 Sesión» hasta las 15:00
(la parada tenía «hold» hasta el fin de la unión de intervalos) aunque el salpicadero dijera «Ahora: Trabajo».
Ahora `ruta()` añade, tras cada cosa que cae dentro de un turno, una parada de vuelta al turno (`cont`, con
`padre`), y en la línea de hoy esa vuelta no es otra bolita (el autobús vuelve a la del turno). Prueba 283
(módulo, en cadena con el conductor cargado); con la ruta anterior cae.

**Medido antes (412 px, jornada con sesión, 14:00):** Hoy 1 580 px (1,73 pantallas), 50 botones, 0 campos;
tarjetas: conductor 449, asistente 399, para hoy 332, lo que viene 333.

**Supuestos:** una vuelta de menos de 15 min no cuenta (dos sesiones seguidas son una parada y otra).

## 2026-10-13 · Tanda 1 · `diaEscenas` y `estadoDe`: el modelo del día que moverá el conductor y la estación

**Elegido:**
- `diaEscenas(día)` ordena en escenas lo que la app ya sabe, sin decidir nada nuevo: la cama (las noches y la
  siesta), la mañana de un turno (ducha salvo de libre o saliente, café si no hay desayuno apuntado, vestirse,
  parada desde «salir de casa» 7:31, bus 7:35 con el último bus 2 min después, o taxi si el hábito «Taxi» está
  marcado ese día; nunca andando), el turno (cabina o guardia) con lo que cae dentro (sesión, comida), la bici al
  acabar (y la ducha al llegar de saliente o de guardia), la ducha tras el gym, la rutina del tipo de día
  (estudio → escritorio, paseo, «pantallas fuera»), la ducha de libre en el último hueco de la tarde-noche, y
  lo demás en casa: salón (la play) de tarde, el móvil en la cama la última media hora o «sin pantallas» si las
  apagas. La jornada y la guardia que empieza al acabar son un solo bloque (no hay bici a las 15:00).
- `estadoDe(día, hora)`: la escena más concreta que contiene esa hora (la sesión manda sobre la jornada).
- `mananaRegleta(día)`: la cadena que explica por qué llegar a las 8 es salir a las 7:31 (levantarse, ducha,
  café, vestirse, salir, bus o taxi, último bus, hospital).
- `habitosEscena(día)`: qué hábitos tienen sitio en el dibujo, por su nombre o su automatismo (taxi, fumar/4:20,
  estudio, pantallas, agua, cama). Si quitas el hábito, su escena desaparece sola.
- Prueba 284 en cadena con cuatro días (jornada con sesión y taxi, guardia, saliente, libre).

**Descartado:** inventar la hora de salir de casa: sale de Ajustes → Ir y volver, que ya existía.

**Supuestos:** el último bus que te vale pasa 2 min después del tuyo; la ducha dura 15 min y el café 15; la bici
tarda lo que el viaje (20 min); «sin pantallas» solo si tienes el hábito o la rutina lo dice; de madrugada sin
noche apuntada no se inventa nada.

## 2026-10-13 · Tanda 2 · La hoja de escenas de Hoy (maquetas con /anatomy, a la espera del visto bueno)

**Elegido:** `design/hoy-escenas/build.mjs` genera `escenas.html` y `escenas-light.html` (390 px): la casa por dentro
en seis momentos (con el móvil en la cama, durmiendo, la ducha con vapor y mampara, el café en la encimera, el
estudio con el flexo, el salón con la play), la parada con el poste (línea, 7:35, último 7:37), el reloj, la
marquesina, tú con la mochila y el taxi detrás (solo si el hábito existe), la cabina en primera persona (manos a
las 10 y a las 2, el cartel de la rotación «Rayos», la radio con la sesión), el manillar de la bici con la mochila
en la cesta, el parque de calistenia (barra con el conductor colgado, paralelas, banco, mancuernas) y la regleta de
la mañana (de levantarse a las 6:50 al hospital a las 8:00, con el tramo de taxi en rojo). La figura es un
conductor de bloques con gorra, en cuatro posturas (de pie, tumbado, sentado, colgado), compartida por todas las
escenas. Capturas en `design/hoy-escenas/shots/`.

**Descartado:** dibujar la cabina y la bici en isométrico: en la app son primera persona (el conductor de ahora) y
la maqueta sigue ese estilo.

**Supuestos:** el conductor es una figura entera (no solo manos) en las escenas isométricas; en la cabina, solo
manos. El tamaño del conjunto es un «Epic» de /anatomy repartido en tandas: cada escena aquí es una Figure
(40–80 piezas), no un Hero.

## 2026-10-13 · Tanda 3a · La mañana en corto: la tira de levantarte a salir, «he salido» y los hábitos «salir a tiempo» y «taxi»

**Pedido:** «enfatizar bien sobre el tiempo antes de salir de casa, que es un hábito que fallo … como algo muy
minimalista simplista».

**Elegido:**
- En Hoy, encima del conductor y solo de mañana (de media hora antes de levantarte hasta llegar), una tira con
  los hitos (levantarse, ducha, café, vestirse, puerta 7:31, bus 7:35, último 7:37), el tramo bueno en verde y el
  de taxi en rojo, la marca de ahora, «Ahora vistiéndote · sales en 19 min» y un botón **«he salido»** que guarda
  la hora del móvil en `store.manana[día]`. Después: «Saliste a las 7:29 · a tiempo» (o «9 min tarde: taxi») y
  «deshacer». Debajo, «esta semana: 3 de 4 a tiempo · 1 taxi».
- Dos automatismos nuevos de hábito (`HAB_AUTO`): **salir de casa a tiempo** (ok ≤ 7:31, mínimo hasta el último
  bus) y **taxi al trabajo, a reducir** (marcado si saliste después del último bus). Salen de la hora apuntada y
  del plan del viaje, sin pasar por las escenas: las escenas leen los hábitos y se formaba un bucle (la app se
  quedaba colgada al pintar Hoy).
- La hora apuntada manda en las escenas: la parada empieza a esa hora y, si fue después del último bus, el viaje
  es en taxi.
- Prueba 285 en cadena (tira, hábitos automáticos, deshacer, «he salido»).

**Descartado:** un cronómetro por paso (ducha 15 min, café…): es la versión simplista que ha pedido; cada paso
sale de la hora de levantarte y el reparto es orientativo.

**Supuestos:** las clases de la tira llevan prefijo `mn` porque `.mbar` ya existía (la barra de dinero, con
`overflow:hidden`, se comía las horas).

## 2026-10-13 · Tanda 3b · El conductor con las escenas: manos, rotación, taxi, bici y barra

**Elegido:**
- **Cabina:** las manos en el volante (guantes de piel y manga azul) y, en el parasol, el cartel de la rotación con
  el servicio del mes («📷 RAYOS · RADIOLOGÍA», de `monthService`).
- **Taxi:** si hoy saliste después del último bus (hora apuntada) o el hábito está marcado, un taxi amarillo con la
  luz del techo delante de ti mientras vas hacia la primera parada.
- **Bici:** en los tramos de vuelta a casa (`diaEscenas` → `bici`), el volante y las manos se cambian por el
  manillar con los puños, el timbre y «🚲 a casa en bici».
- **Parque:** parado en el polideportivo, a la izquierda de la carretera (a la derecha lo tapaba la marquesina), la
  barra de dominadas con el conductor colgado subiendo y bajando.
- Las banderas llegan en `D.esc` (`conductorEscenas`, calculado en `hoyBusHTML`, no dentro de `hoyBusDatos`:
  las escenas leen `hoyBusDatos` y sería un bucle). Prueba 286 (módulo, en cadena con el conductor cargado).

**Descartado:** cambiar el paisaje de la parada por una marquesina nueva (ya la hay) y el taxi en la propia
parada (la cámara ya está encima: iba fuera de plano).

**Supuestos:** la rotación cabe en 22 letras; el taxi solo antes de llegar a la primera parada; la barra solo
mientras estás parado en un entreno.

## 2026-10-13 · Tanda 4 · La casa encima de la cochera (la estación por dentro)

**Elegido:**
- La cochera de la estación es ahora **un piso sobre la cochera**: abajo sigue entrando el autobús por la persiana;
  arriba, sin tejado y con un pretil bajo, la casa como una casa de muñecas: dormitorio (cama, mesilla con la
  lámpara y el móvil), baño (plato de ducha con mampara y vapor, lavabo), cocina (encimera con la cafetera y la
  taza, nevera, perchero con la chaqueta del uniforme), y delante el escritorio con el flexo y la silla, y el sofá
  con la tele y la play. Tabiques bajos para que la cámara vea por encima; la pared de la puerta solo llega al
  pretil del piso (más alta tapaba la cocina y el sofá). El indicador del sueño y el LCD «ANOCHE» pasan a la pared
  de la puerta.
- **El conductor está donde dice `estadoDe`**: cinco posturas dibujadas una vez (en la cama, en la ducha, en la
  cocina, en el perchero, en el escritorio, en el sofá) y la parte viva enseña la que toca por `D.esc.casa`;
  con él se encienden la lámpara y el móvil (móvil en la cama), el flexo (estudio), la tele (salón), la taza
  (café) y el vapor (ducha); la manta se quita cuando está acostado. Fuera de casa no se le ve: va en el autobús.
- La figura vive en `design/hoy-escenas/piezas.mjs`, compartida con la hoja de escenas. Prueba 287 (módulo, en
  cadena con la estación cargada).

**Descartado:** la casa en la planta baja detrás del autobús (lo tapaba entero) y quitar el autobús de la cochera
(es la metáfora de estar en casa: ahora se ven los dos).

**Supuestos:** `fig/estacion.js` pasa de 506 a 623 KB (se carga solo al elegir Estación); las luces de la
casa no cambian el decorado de fuera.

## 2026-10-13 · Tanda 5 · Los hábitos dentro del dibujo, y cierre del rediseño de Hoy

**Elegido:**
- **Fumar:** el cigarro del Lloretazo solo sale si fumar es cosa tuya (el hábito «Fumar…» o 4:20 apuntado en las
  dos últimas semanas); si lo dejas, desaparece del dibujo. **Taxi:** además de la semana, la tira de la mañana
  cuenta los taxis del mes (`mananaMes`). **Pantallas:** con el hábito, la última media hora en la cama es «sin
  pantallas»; sin él, el móvil encendido. **Estudio y paseo** salen de la rutina del tipo de día. Prueba 288.
- **Medido después (412 px, jornada con sesión, 11:00):** Hoy 1 580 px (1,73 pantallas), 50 botones, igual que
  antes: el rediseño cambia lo que se ve dentro del dibujo, no el largo de la pantalla. De mañana, la tira añade
  132 px (y se va al llegar al hospital).

**Descartado:** un hábito de agua en el dibujo (una botella en el escritorio): no aporta sin la cuenta de vasos.

**Supuestos:** el conductor no bebe ni come en el dibujo: las comidas ya son paradas.

## 2026-10-14 · Tanda A · La tira de la mañana, más contada, y el taxi de serie

**Elegido:**
- **El taxi se da por hecho** (`viajeCfg().taxi`, de serie `true`): cada día de jornada cuenta como taxi en el
  hábito automático, en la escena de la mañana, en la semana y en el mes, salvo que apuntes que saliste a tiempo.
  Se quita en Ajustes → Ir y volver («de serie voy en taxi») y en la hoja del hábito «taxi»; el botón «he salido»
  sigue, pero en secundario. Pasado el último bus, y en un día de jornada pasado sin hora, el botón es
  «🚌 fui en bus»: apunta la hora del plan (7:31) y el taxi deja de contar.
- **La tira, más contada:** debajo de la regleta, una ficha por paso (⏰ levantarse · 🚿 ducha · 👕 vestirse ·
  🚪 puerta · 🚕/🚌 · 🏥 hospital) con su hora; la de ahora encendida, las pasadas tachadas. La línea dice el paso
  de ahora, los minutos que le quedan (o los que vas tarde), la hora de la puerta y el bus, y una frase de qué pasa
  de serie. Prueba 289 (en cadena, conduce Hoy y Ajustes; con el taxi de serie revertido caen sus 3
  comprobaciones y ninguna otra).

**Descartado:** un hábito «taxi» marcado a mano cada día (justo lo que no se hacía) y esconder «he salido»
cuando el taxi es lo normal (sin el botón no hay forma de que un día cuente como bus).

**Supuestos:** «fui en bus» apunta la hora del plan, no una real: el dato vale para el hábito y la cuenta, no para
medir cuánto tardaste. La prueba 284 acepta la comida de las 14:00 dentro del hospital (según el menú del día de
la semana).

## 2026-10-14 · Tanda B · El taxi es un gasto

**Elegido:**
- **Un precio por viaje** en Ajustes → Ir y volver («un taxi al hospital (€)», `viajeCfg().taxiEur`, de serie
  10 €). `taxisMes(mes)` cuenta los taxis del mes (los apuntados y los de serie) y los pasa a euros.
- **Dinero → Hoy:** tarjeta «🚕 Taxis al hospital» con los del mes, lo que cuestan y el mes anterior, con el
  precio como enlace a Ajustes. **Dinero → Mes:** una línea en «Este mes». **La tira de la mañana:** «este mes:
  7 taxis (≈ 70 €)». Prueba 290 (en cadena: conduce el menú lateral → Dinero, Dinero → Mes y el campo del precio
  en Ajustes; sin la tarjeta cae solo ella).

**Descartado:** restar los taxis de «te queda para gastar» (el saldo del banco ya los lleva descontados: sería
contarlos dos veces) y meterlos como categoría de Fintonic (eso sale de la captura, no de la app).

**Supuestos:** el precio es uno fijo por viaje; si un día cuesta otra cosa no hay dónde apuntarlo.

## 2026-10-14 · Tanda C · La estación, más grande

**Elegido:** la cámara encuadra la franja de delante (calzada, andén y casa) en vez de la placa entera, y el
lienzo pasa de 600×400 a 600×480. Lo que mandaba el tamaño era el ancho de la placa (486 unidades): la casa salía
diminuta y encima el cielo ocupaba un tercio. **Medido a 380 px de ancho:** escala 1,10 → 1,38; la casa 74 × 47
px → 94 × 59 px; la figura 253 → 304 px de alto. Prueba 287 sigue en verde.

**Descartado:** cambiar el azimut (cambiaba qué pared de la casa se ve y toda la composición) y recortar la
placa (medio mundo con coordenadas colgando de ella).

**Supuestos:** las esquinas de atrás de la placa se salen del marco a propósito, como una maqueta que sigue
fuera de la foto.

## 2026-10-14 · Tanda D · La cabina cambia con la guardia

**Elegido:** dentro de la guardia la raíz del conductor lleva la clase `guardia`: las mangas pasan a bata blanca,
el panel y la pantalla de la próxima parada se tiñen de rojo (los coches de guardia de noche), el parasol dice
«☾ GUARDIA · sales 08:00» en vez de la rotación, y en el salpicadero aparece el busca con un LED que late y las
horas hechas y las que quedan («5 h · quedan 12 h»). La penumbra de noche de antes se queda. Prueba 291 (banco
del módulo en cadena con Hoy; sin la clase cae solo ella).

**Descartado:** cambiar el paisaje (el hospital ya es el ambiente de la guardia desde la tanda del paisaje) y un
contador de minutos en el busca (no cabe y no aporta: la carretera ya enseña las señales de salida).

**Supuestos:** la guardia es el turno `k:'guard'`; una guardia de día (sin noche) también enciende la cabina.

## 2026-10-14 · Tanda E · La cabina alta: sueño, hábitos, eventos y lo que viene dentro del salpicadero (maqueta)

**Medido antes (412 px, jornada con sesión, 11:00):** Hoy 1 580 px (1,73 pantallas), 50 botones. Debajo del
conductor van tres tarjetas: check-in y asistente (399 px: «¿Cómo amaneces?» KSS, ánimo, propósito, señales),
«Para hoy» (332 px: copia, recibos, notas, suplementos, hábitos con ✓) y «Lo que viene» (333 px: la carretera).

**Propuesto (maquetas en `design/hoy-cabina/maqueta.html`, capturas en `shots/`):**
- **E1 · Salpicadero largo:** debajo del volante el salpicadero continúa (600×330) con cuatro instrumentos:
  **Anoche** (lo dormido como aguja, la deuda, y «¿cómo amaneces?» KSS 1–9 a un toque), **GPS** (los eventos de
  hoy con hora y ✓, y «próximo importante»: el examen en 12 d, la guardia en 4 d), **Hábitos de hoy**
  (interruptores con LED; el taxi en ámbar porque de serie cuenta) y **Para hoy** (copia, recibos, notas con su
  casilla). Se van las tres tarjetas: la vista pasa de 1 580 a ≈ 1 050 px y la cabina ocupa 440 px más.
- **E2 · Guantera:** lo mismo en una franja de 176 unidades (≈ 115 px): Anoche + KSS en una línea, el GPS con
  el próximo evento y lo importante, los hábitos en una fila; «Para hoy» sigue como tarjeta. ≈ 1 250 px.

**Pendiente:** el visto bueno (E1 o E2, o mezcla) antes de tocar `fig/conductor.js` y `renderHoy`.

## 2026-10-14 · Arreglo · La sesión que empieza a la vez que la jornada, y el día de mañana ya levantado

**Elegido:** en la ruta del conductor, lo que empieza a la misma hora que el turno (la sesión general de las
8:00 con la jornada de las 8:00) va primero y el cartel del turno se pone donde acaba: antes la vuelta solo se
calculaba para lo que empezaba *después* del turno, y el autobús se quedaba en «8:00 Sesión general» hasta las
15:00. Y al mirar otro día, el conductor arranca seis minutos después de levantarse (de camino al desayuno),
no cinco minutos antes dentro de la cochera a oscuras. Prueba 292 (en cadena; revertida la ruta cae solo ella).

**Supuestos:** si dos cosas empiezan a la vez que el turno, manda la que acaba más tarde.

## 2026-10-14 · Mes: las horas vuelven a la casilla, con el entreno y los eventos a su hora

**Elegido:** cada casilla lleva otra vez la hora del día en UNA línea («8–15»; la guardia «15→8»; el saliente
«→8»): con las fichas la jornada de siempre había dejado de escribirse. El entreno sale con su hora (la misma
que pinta Hoy: la del día de fuerza, al salir del trabajo o la del gym), «🏋 17:30» en vez de «🏋 Fuerza»; el
nombre de la rutina va en el título. Cada evento lleva su hora en su color delante del nombre, donde iba el
punto («8:15 S. clínica»). Todo en una línea por cosa, recortado con «…». **Medido a 412 px:** casilla 92 →
100 px, cuadrícula 479 → 503 px, ninguna casilla desborda. Prueba 293 (en cadena; con el código anterior cae
solo ella); 46, 113 y 277 adaptadas (la marca del evento es el punto o la hora).

**Descartado:** poner jornada y entreno en la misma línea («8–15 · 🏋17:30» no cabe en 50 px).

**Supuestos:** el nombre del evento se recorta más («8:15 S. c…»): la hora es lo que no se adivina y el nombre
entero está al tocar el día y en el título.

## 2026-10-14 · Tanda E, segunda maqueta · La cabina con mandos de verdad (las de salpicadero, descartadas)

**Lo que pidió:** ninguna de las dos (E1, E2): ventana más alta y no un salpicadero lleno de datos, sino una
cabina que se parezca a la de verdad, con mandos que se tocan, y mirar a los lados para ver el resto del día.

**Propuesto (`design/hoy-cabina2/`, capturas en `shots/`):**
- **F · Al frente:** la ventana el doble de alta (la carretera llega al volante). Abajo solo mandos: el reloj del
  cuadro (la hora y cuánto queda de lo de ahora), la máquina de los billetes con «Para hoy», la palanca de
  cambios (R ayer · N hoy · D mañana), la radio y las dos manos en el volante.
- **I · Retrovisor izquierdo:** mira a la izquierda, la ciudad: cada evento de hoy es un cartel en su edificio;
  al fondo, más pálidas, las vallas de lo importante que viene (examen, guardia); en la acera, el quiosco de
  «Para hoy».
- **D · Retrovisor derecho:** mira a la derecha, el campo: el polideportivo en la ladera con el entreno y la
  cuenta de la semana, el merendero junto al río con la comida y las kcal, y el poste de madera con una flecha
  por hábito y su luz.
- **R · La radio:** «Radio Sueño» con lo dormido; los botones de emisora 1–9 son el «¿cómo amaneces?», el
  volumen el ánimo y el dial lo que te propones.

**Pendiente:** el visto bueno antes de tocar `fig/conductor.js`.

## 2026-10-14 · Tanda E, construida · La cabina con mandos de verdad

**Elegido (con el visto bueno a la maqueta `design/hoy-cabina2/`):**
- **Ventana el doble de alta:** el horizonte baja (HY 150 → 255) y el dibujo pasa de 600×440 a 600×900. El
  paisaje, la cochera, las paradas y el acantilado del Lloretazo son los mismos: solo cambia el encuadre.
- **Abajo, solo mandos:** el reloj del cuadro (lo de ahora con su barra, lo siguiente), la máquina de billetes
  con «Para hoy» (lleva al quiosco), la palanca de cambios (R el día de antes · N hoy · D el de después), la radio
  y el volante con las manos. El busca de la guardia y la nota «hoy toca» van a la derecha, bajo la radio.
- **Los retrovisores miran a los lados:** el izquierdo enseña la ciudad (los eventos del día en sus fachadas, las
  vallas de lo importante que viene y el quiosco de «Para hoy» con su ✓); el derecho, el campo (el entreno en
  el polideportivo con la cuenta de la semana, la comida en el merendero con las kcal y el poste con un hábito
  por flecha). Tocar marca o abre lo mismo que la tarjeta de antes, y la vista se queda donde estaba.
- **La radio es el sueño:** lo dormido anoche y ayer, la cama y el último café; los botones de emisora 1–9 son
  el «¿cómo amaneces?», las caras el ánimo y el dial lo que te propones; «abrir Sueño» lleva a Sueño.
- **Hoy, más corto:** con el conductor ya no salen debajo la tarjeta del check-in ni «Para hoy» (siguen en las
  vistas Reloj y Línea). `paraHoyItems()` da la lista como datos y la leen la tarjeta y la cabina.
- **Medido (412 px, jornada a las 11:00):** Hoy 1 580 → 1 379 px (1,73 → 1,51 pantallas), 50 → 35 botones; el
  dibujo 279 → 564 px de alto. Prueba 294 (en cadena: retrovisor izquierdo → nota marcada desde el quiosco,
  retrovisor derecho → hábito marcado en el poste, radio → 6 y 🙂, palanca D → mañana y N → hoy; con el
  conductor anterior caen sus 4 comprobaciones y ninguna otra); 275 adaptada (la radio en vez del depósito).

**Descartado:** la cabina con un salpicadero lleno de paneles (E1 y E2) y girar la cámara en 3D al mirar a los
lados (la ventana enseña directamente la vista lateral: se lee mejor en un móvil).

**Supuestos:** la palanca dice «ayer» y «mañana» aunque lleve al día anterior o siguiente al que miras; en el
quiosco caben 3 cosas y en el poste 4 hábitos (el resto se cuenta como «+N»).

## Tanda F · el conductor no se queda pillado, la casa en primera persona y la cámara que gira (2026-10-14)

**Elegido:**
- **La cama pasada la medianoche es la noche de hoy:** con «A la cama» a las 00:30 (24:30), `hoyBusDatos`
  descartaba ese punto por caer después de las 24:00 y el día se quedaba sin noche: el autobús se paraba en el
  último evento (el Lloretazo) hasta la mañana. Ahora la cama de hasta 12 h después de medianoche cuenta como la
  noche de hoy y `diaEscenas` la usa como hora de acostarse.
- **En casa, en primera persona:** cuando no hay nada en marcha (ni turno, ni evento; comer sí) y las escenas
  del día dicen que estás en casa, el conductor deja la cabina: desaparecen marco, volante y retrovisores y la
  ventana grande enseña la habitación de esa escena vista desde tus ojos — la cama (con el despertador y las
  Z si duermes, el móvil en las manos antes de dormir), la ducha, el café, vestirte, el escritorio con el flexo,
  el sofá con el mando y la mesa con el plato (desayuno con la taza). El cartel dice «EN CASA» y lo que haces
  hasta qué hora; dormido, «Te levantas a las …». El salpicadero (radio, palanca, «Para hoy») sigue.
- **Las comidas fuera de un turno se ven en casa** (escena «mesa»; en la estación, la cocina), y un día libre
  empieza con el café al levantarte: la rutina de estudio de las 10 ya no pisa la cama si te levantas a las 10:30.
- **La cámara gira al mirar a los lados:** el frente y la vista lateral se desplazan juntos en 0,55 s (la
  ciudad entra por la izquierda, el campo por la derecha, y de un lado al otro la cámara cruza por el frente);
  «volver al frente» la trae de vuelta. Con «reducir movimiento» el cambio es directo.
- **Pruebas:** 295 (en cadena: día libre con cama a las 00:30 → noche a las 24:30 y escenas de casa → conductor
  a las 21:00 en la carretera, a las 22:30 EN CASA y a las 3:00 durmiendo) y 296 (conduce Hoy: ◀ eventos →
  entreno ▶ → volver al frente, midiendo la posición de la cámara). Revirtiendo cada arreglo cae solo su
  comprobación. 294 adaptada (toca las etiquetas, no los retrovisores, que en casa no están; espera al giro).

**Descartado:** un giro 3D de la cabina (en el móvil se lee peor que un barrido lateral) y enseñar la casa también
de guardia (la guardia es trabajo aunque duermas allí).

**Supuestos:** si una comida cae fuera del turno, la comes en casa; mirar a los lados desde casa sigue enseñando
la ciudad y el campo (los eventos y el entreno), no otras habitaciones.

## Las guardias que te quedan de R1, en Mes (2026-10-14)

**Elegido:**
- **Una línea bajo el abono del mes:** «🩺 Quedan de R1 **43** · 28 Urg · 15 UMI · −2 🏖️». Al tocarla se abre
  mes a mes (Urg + UMI, con «cupo» en los meses que aún no has pintado) y cómo se cuenta.
- **Hasta el 31 de mayo de 2027**, cambiable en Ajustes → Rotación («Último día de R1»).
- **Cómo se cuenta:** los meses que ya has pintado, las guardias puestas de hoy en adelante; los que no, el cupo
  de ese mes repartido como lo repartes tú (4 Urgencias + 2 UMI); el mes en curso sin pintar, la parte que queda.
- **Vacaciones:** cada 5 días laborables de un mismo periodo de vacaciones ya puesto en el calendario, en un mes
  sin pintar, quitan una guardia de Urgencias (si no quedan, del siguiente tipo). En un mes pintado no se
  descuenta: al pintarlo ya has puesto las que haces de verdad.
- **Prueba 297** (en cadena: Ajustes fija el último día → Mes enseña la cuenta → pintar el mes siguiente con
  1 Urg + 1 UMI la cambia → dos semanas de vacaciones quitan 2 de Urgencias → al tocar, mes a mes). Sin el
  descuento o sin la línea, cae solo ella.

**Descartado:** un total fijo de R1 a mano (hay que saberlo y mantenerlo), descontar ya las vacaciones aún no
puestas o enseñar «si gastas tus 4 semanas» (preferiste solo lo puesto), y repartir el descuento entre Urgencias
y UMI.

**Supuestos:** una semana son 5 días laborables (lunes a viernes) del mismo periodo; las semanas sueltas de
menos de 5 laborables no descuentan; las guardias de días ya pasados no cuentan como «quedan».

## El conductor llega a la cama pasada la medianoche (2026-10-14)

**Elegido:** la línea del día acaba media hora después de la cama de esta noche cuando es pasada la medianoche
(cama a las 00:45 → se puede arrastrar hasta la 01:15); antes se cortaba a las 23:59 y, tras el Lloretazo, el
conductor se quedaba en el sofá sin irse nunca a la cama. De paso, las flechas del teclado en el conductor ya no
cambian también el día de la app. Prueba 298 (en cadena: 23:30 en el sofá → seis flechas → durmiendo pasada
la medianoche sin cambiar de día → la hora 00:55 de los datos no se corta); con el conductor anterior cae solo ella.

**Descartado:** seguir la línea hasta la mañana siguiente (eso ya es el día de mañana, con la palanca en D).

## Repaso de supuestos, tanda 1: reglas y arreglos rápidos (2026-10-14)

Del repaso de los 30 supuestos de la semana con el plan socialista: los que no valían pasan a esta tanda (lo
visual va en la tanda 2, con maquetas primero).

**Elegido:**
- **Vacaciones solo a mano.** Las pones tú: un periodo en Mes (🏖️) o un día pintado como «Vacaciones». El ciclo
  ya no pone vacaciones (un día «V» del ciclo es de trabajo, o libre en finde), el calendario de Google y el texto
  pegado solo avisan («ponlas tú en Mes»). Bajo «Quedan de R1»: **«🏖️ N de 22 días de vacaciones · quedan M (L–V)»**,
  contando de lunes a viernes, sin festivos, en el año de residencia que acaba el último día de R1; el 22 se
  cambia en Ajustes → Rotación.
- **Horas de servicio = solo trabajo:** la guardia desde que entras (con la jornada de ese día) hasta que sales, y
  la jornada de los días de trabajo. Saliente, vacaciones, festivos y libres no suman.
- **Mes: todo lo que tiene su día se ve.** Cada evento con fecha y cada nota del día en su línea, sin «+N» (la
  casilla crece). Lo de cada semana va aparte, como chapitas de color con su inicial (el nombre al tocar).
- **La carretera del mes es el mes natural** (del 1 al último día) y la cámara arranca en hoy.
- **Otro día, a la hora de levantarte** (antes y después), y **la noche dura hasta la hora de levantarte** del
  tipo de día de mañana, no tu objetivo de sueño.
- **Un toque apunta también lo de días pasados** (las comidas que se te olvidaron); un entreno solo se empieza hoy.
- **«Fui en bus»** guarda la hora del plan (para el hábito y la cuenta de taxis) **y se puede apuntar la hora
  real**. **El taxi de cada día tiene su precio** (de serie el de Ajustes) y Dinero suma lo de cada día.
- **Tiempos de la mañana en Ajustes → Ir y volver:** ducha, café, bici de vuelta y cuánto después pasa el último
  bus. Si un paso no cabe entero (te levantas tarde), se acorta en vez de desaparecer.
- **Cafés:** 2 de serie por la mañana (al levantarte y antes de la puerta) y los que sumes; en la radio del
  conductor, «☕ N · hora del último» con − y +, en rojo si el último es a menos de 6 h de la cama.
- **La siesta del saliente se apunta a mano:** hasta que la apuntas hay un hueco «Siesta · apúntala» al llegar,
  sin hora de fin; con lo apuntado (p. ej. 3 h) dura eso. Al dibujar la noche ya no se rellena una siesta de 6 h.
- **Platos fuera del recetario, sin pasos inventados:** solo sus ingredientes (los pasos, los del recetario o los
  tuyos).
- **Pruebas 299–303** (en cadena; al revertir cada arreglo cae solo la suya): vacaciones a mano y días gastados,
  todos los eventos en el Mes, la palanca R/D a la hora de levantarte y el toque de ayer, la mañana (ducha en
  Ajustes, bus con hora real, taxi de 14 €), cafés + siesta a mano + platos sin pasos.

**Descartado:** contar las vacaciones por año natural (se cuentan por año de residencia, como «Quedan de R1»),
borrar los periodos de vacaciones que ya trajo el calendario (siguen: los pusiste tú al importarlos), y planear
una siesta «sugerida» con duración.

**Supuestos:** los 2 cafés de serie van a la hora de levantarte (+6 min) y 9 min antes de salir (o media hora
después de levantarte si no sales); un café sumado en un día que no es hoy se pone a las 14:00; el plan de las
tres órdenes de guardia (Sueño) sigue proponiendo una siesta al llegar, como consejo, no como dato.

## Repaso de supuestos, tanda 2 · el conductor (2026-10-14)

Maquetas primero (`design/hoy-tanda2/`, 13 capturas a 412×915) y visto bueno («Sube a la app»).

**Elegido:**
- **El trabajo es una ciudad, «Trabajo».** Mientras dura la jornada el autobús avanza despacio entre los
  edificios (media manzana en todo el turno) en vez de quedarse parado. Cartel de entrada «TRABAJO · hasta las
  HH:MM»; en la **última media hora**, el cartel tachado de salida y uno azul de dirección: «→ 🍽 PUEBLO · comida»,
  «→ 🌳 PARQUE · entreno» o «→ 🏠 CASA». Si el turno va en trozos (una sesión o la comida dentro), la salida va al
  final del último trozo.
- **Comer fuera de la jornada es un pueblecito** (casas encaladas, teja, contraventanas verdes, campanario) y
  **entrenar, un parque rural** (camino de tierra, valla, árboles y barras), que rodea también la parada del entreno.
- **Lloretazo de ida y vuelta:** la ida y la vuelta son carretera de costa; el acantilado con el faro, solo el
  rato de estar allí. Al acabar, «LLORET» tachado y «→ 🏠 CASA».
- **Comer en la cabina:** en la parada de una comida dentro del trabajo o de la guardia, las manos sueltan el
  volante y sujetan el táper con el tenedor.
- **Desde casa, los lados son habitaciones:** a la izquierda la cocina (eventos de hoy en pósits en la nevera,
  «Para hoy» en una libreta, «Lo que viene» en el calendario); a la derecha la entrada y el dormitorio (entreno y
  comida en la puerta, con la bolsa y la fiambrera; la hoja de hábitos en la pared). Todo se toca como en la cabina.
- **Más sitio:** el quiosco de «Para hoy» enseña 6 cosas (antes 3) y el poste 7 hábitos (antes 4); el cartel del
  entreno, en lo alto del poste; el segundo evento se aparta a la izquierda del quiosco.
- **Pruebas:** 304 nueva (en cadena: avanza dentro de la ciudad, salida al final aunque el turno vaya en trozos,
  táper, cocina y dormitorio, 6 y 7) y 275 ampliada (Lloretazo: ida y vuelta en carretera). Con el conductor
  anterior caen esas dos; quitando solo el arreglo de los trozos, cae solo la 304.

**Descartado:** convertir también el Lloretazo en ciudad (es carretera y mirador), enseñar los carteles de salida
todo el turno (desde dentro no parecía que estuvieras en la ciudad) y dibujar habitaciones distintas según la hora.

**Supuestos:** la ida y la vuelta del Lloretazo ocupan como mucho 0,6 h cada una (el 27 % de lo que dure); el
cartel azul deja de pintarse cuando lo tienes casi al lado (salía enorme y cortado); con más de 6 cosas, 7 hábitos
o 4 eventos en la nevera sale «+N más».

## Las guardias de R1 bien contadas y sin guardias del ciclo (2026-10-14)

**Elegido:**
- **El año de R1 son los 12 meses que acaban el último día de R1** (de serie, de junio de 2026 a mayo de 2027).
  Lo que toca: el cupo de cada mes (4 Urgencias + 2 UMI → 48 + 24) **menos las 4 que te puedes quitar al año,
  de Urgencias** → **44 + 24 = 68**. Las 4 se cambian en Ajustes → Rotación («Guardias que te puedes quitar al año»).
- **Llevas:** los meses pasados cuentan lo que pintaste; uno pasado sin pintar cuenta **su cupo entero** (antes de
  usar la app); el mes en curso, lo pintado hasta ayer. **Quedan** = lo que toca − lo que llevas, por tipo, y de
  eso cuántas ya están **puestas** y cuántas faltan **por poner**.
- **Un mes que viene sin pintar no se rellena:** sale «sin poner» en el mes a mes (antes contaba el cupo).
- **El ciclo de semanas ya no pone guardias ni salientes en ningún modo.** Con las semanas tipo (el modo de
  serie) seguía poniéndolas en los meses que aún no habías pintado; solo se quitaban en el modo por fecha.
- En Mes: «🩺 R1 llevas/toca · quedan N» con Urgencias y UMI aparte; al tocar, el detalle por tipo y el mes a mes.
- **Prueba 297 rehecha** (en cadena: Ajustes 4 → 6, mes pasado sin pintar y pintado, mes por venir sin pintar y
  sin guardias del ciclo, y pintado). Al quitar solo el arreglo del ciclo cae solo ella; con el recuento anterior,
  también solo ella.

**Descartado:** seguir descontando una guardia por semana de vacaciones (las 4 que te quitas ya lo cubren) y
contar 0 en los meses pasados sin pintar.

**Supuestos:** las 4 que te quitas salen de Urgencias (si no hubiera, del siguiente tipo); una guardia del día
de hoy cuenta como «puesta», no como hecha, hasta mañana; el cupo de cada mes es el de «Guardias este mes» (6 de
serie, repartidas 4 + 2).

## Rediseño artístico · fases 0 y 1 (2026-10-14)

**Elegido:**
- **Fase 0:** auditoría visual con 5 agentes (Hoy, Calendario, Comer, Entreno y Sueño, Más y lo común), informes y
  capturas en `design/arte/auditoria/`.
- **Continuidad** como filosofía (palabras del usuario en `design/arte/continuidad.md`): el tiempo pasa, la energía se
  gasta y se recarga, lo hecho deja huella, sin cortes a medianoche.
- **Dirección «La jornada»** (`design/arte/direccion/`), con visto bueno: el cielo de la hora como fondo de toda la
  app; los 5 temas como tintes; el hilo de 24 h arriba (huella sólida, lo que viene punteado, el ahora que late); el
  depósito de energía; las tarjetas como piezas de maqueta; escalas cortas de letra, esquinas, espacio y movimiento;
  46 iconos vivos propios (`ico(nombre, estado)`).
- **Decisiones del usuario:** barra de secciones **abajo**; de guardia, el rojo al **65 %**; en los temas claros el
  cielo de la hora **suavizado** (lavado al 38 %).
- **Orden de construcción:** lo común primero, por tandas: (1) fichas y temas + cielo de la hora + barra abajo;
  (2) componentes únicos (botón, selector, chip, tarjeta, fila, hoja, aviso); (3) el hilo y la energía; (4) iconos vivos.

**Descartado:** el estilo «premium sobrio» y el «ilustrado cálido» (el usuario dejó elegir); seguir con el cajón lateral
de Más (pasa a hoja desde abajo).

**Supuestos:** la energía es de momento solo un dibujo, sin cálculo (se decide con el usuario antes de darle números);
los emojis de comida se quedan porque son datos.
## Fallos de la auditoría visual, arreglados con lo mínimo (2026-10-14)

**Elegido:**
- **Cajón «Más»:** las reglas de la pestaña activa (`nav button.on`, y su `:hover`) pasan a `#tabs`; el cajón también es
  un `<nav>` y le pintaban el degradado de marca con la línea gris encima. El recuadro activo se queda con su borde.
- **Franja gris a la derecha (temas claros):** comprobado quitando la sombra: era la del cajón cerrado. La sombra va
  solo con el cajón abierto.
- **Pantallita del conductor en temas claros:** «Ahora: …» en tinta oscura y lo siguiente en ámbar oscuro (#9a6700);
  de guardia la pantallita sigue oscura y no cambia.
- **Mirar a los lados:** el cielo es el de la hora (la misma `luz()` que de frente); el sol solo de día y las nubes se
  apagan de noche.
- **Barra con «8 series»:** con chapita, 9 px de relleno a los lados en vez de 13: «☰ Más» acaba en 393 px.
- **Carretera:** la letra de cada cartel se calcula con el ancho real de lo que dice (también la línea de debajo); un
  nombre que ni a letra mínima cabe se corta con «…» (entero en su `<title>`), y si pasado mañana también hay cartel
  de comidas, el de mañana va más bajo para no taparlo.
- **Pruebas 307–312**, una por arreglo; al quitar cada arreglo cae solo la suya.

**Descartado:** reescribir los estilos de las pestañas por clase (rediseño), cambiar el texto de la chapita («8»),
y separar todos los carteles de días seguidos (con perspectiva no hay una altura que valga para una cadena larga).

**No son fallos (investigado):** el récord que no salió (60 × 8 dejando 2 reps vale 80 de 1RM estimado; 62,5 × 8 sin
decir cuántas te quedaban, 79,2) y la comida a las 18:00 con el entreno a las 18:30 (es la ventana fija «si entrenas,
18:00–18:30» de Sueño → a qué hora comes; queda pendiente de decidir si debe seguir al fin del entreno).

**Supuestos:** «8 series» que sigue después de guardar es lo que se hizo hoy y está bien; los carteles de menos de
40 px de ancho no se miran (son puntos lejanos).

## «La jornada» · tanda 1 de lo común: el cielo de la hora y la barra abajo (2026-10-15)

**Elegido:**
- **El fondo de toda la app es el cielo de ahora**, con los colores del cielo del conductor (alba, día, tarde,
  anochecer, noche), un sol que recorre el día y estrellas de noche. Lo pinta `pintaCielo()` al pintar y cada minuto.
- **Un velo del fondo del tema** encima del cielo (52 % en los temas oscuros, 62 % en los claros: el cielo «lavado»)
  para que el texto que va directamente sobre el fondo se lea a cualquier hora; así el tema sigue tiñendo el cielo.
- **De guardia, rojo al 65 %**, solo dentro de las horas de la guardia (de que empieza a que sales, con el pase), no
  todo el día; en los temas claros el rojo es un rosa claro para que el texto oscuro siga leyéndose.
- **La barra de secciones, abajo**, fija y fuera de la cabecera (la cabecera se esconde al bajar y se la llevaría):
  botones de 52 px con su icono vivo (`fig/iconos.js`, `ico(nombre, estado)`; el calendario lleva el número de hoy).
- **Prueba 313** (en cadena): barra abajo con iconos y 44 px, ir a Entreno y volver, cielo de la hora y guardia en sus
  horas. Al devolver la barra a la cabecera cae solo ella; al no pintar el cielo, también solo ella.

**Descartado:** la rejilla «HUD» del fondo (la sustituye el cielo); teñir de rojo todo el día de guardia (solo sus
horas); pasar ya todas las tarjetas a «piezas de maqueta» (es la tanda 2, componentes).

**Supuestos:** las horas del sol son fijas (sale a las 7:00, se pone a las 19:20), como en la maqueta; las tarjetas
siguen siendo las de antes hasta la tanda 2.

## «La jornada» · tanda 2 de lo común: las piezas (2026-10-15)

**Elegido:**
- **Fichas del sistema** en `styles.css` (esquinas 4·8·12·16·24·redondo, letra 11·12,5·14·16·20·28·44, espacio,
  movimiento 120·200·320 ms, `--toque: 44px`, superficies 1·2·3, cara, estados, sombras 1·2·3) **sacadas de las 9
  variables de cada tema**, así siguen al tema y al rojo de guardia solas. Se definen por fin `--muted` y `--card2`,
  que se usaban sin existir.
- **La tarjeta es una pieza de maqueta**: opaca (el cielo nunca lleva texto), filo de luz arriba, cara lateral de 3 px y
  sombra que cae según el sol (`cieloDe` da ahora `luz`, `soldx`, `soldy`; `pintaCielo` los pone cada minuto). Fuera el
  brillo en diagonal, el desenfoque y la barrita de neón del título.
- **Un solo botón** (normal · principal liso · verde · peligro · borrar · pequeño) con cara de tecla que se hunde; **un
  solo selector** para las ~15 familias de pestañas (carril hundido y la elegida levantada con raya de la marca);
  chips, campos, hoja de abajo (la primera `.hoja`, pisada entera por la segunda, fuera) y aviso (rectángulo de 16 px
  al 92 %, en negativo) del mismo juego. Sin degradados cian→violeta en botones.
- **Nada tocable por debajo de 44 px**: de 135 de 276 en 9 pantallas a 0; un recorrido por todas las secciones y sus
  pestañas con datos deja solo un enlace dentro de una frase (Estudio) y una casilla dentro de su etiqueta (4:20).
- Las filas de día de la Semana y el resumen de cada sesión de cocina son listas apretadas a propósito: su zona de toque
  crece por fuera, invisible, sin engordar la fila (la Semana sigue cabiendo en poco más de dos pantallas).
- **Prueba 314** (en cadena): Comer → Hoy → abrir la hoja de una comida → «Apuntar» vacío (sale el aviso) → Más →
  Dinero → Mes: 44 px, piezas opacas, hoja de 24 px, aviso y sombra según el sol. Con el CSS de antes cae solo ella.
- **La prueba 308 (borde derecho en tema claro) compara ahora con la misma pantalla sin cajón**, no con el borde
  izquierdo: desde la tanda 1 el cielo lleva el sol, que por la mañana ilumina más la izquierda, y la prueba caía o no
  según la hora. Con la sombra del cajón cerrado asomando sigue cayendo (146 frente a 208).

**Descartado:** cambiar ya todos los tamaños de letra a la escala (39 tamaños, muchos dentro de dibujos y celdas del
calendario: va sección a sección); agrandar las casillas de la cuadrícula de hábitos de la Semana y los bloques del
carril de horas (su tamaño es dato: días y duración); el desplazamiento de sombra entero de la maqueta (con el sol
bajo llegaba al borde y en los temas claros se veía como una franja gris).

**Supuestos:** la cabecera crece unos 30 px por los botones de 44 (Hoy pasa de 1456 a 1508 px de alto); el aviso en
negativo (claro sobre oscuro y al revés) como en la maqueta.

## Guardias de R1: el mes en curso cuenta entero (2026-10-15)

**Elegido:** «R1 llevas/toca» cuenta los meses pasados **y el mes en curso entero**: lo que hayas pintado ese mes
(aunque el día no haya llegado) o su cupo si aún no lo has pintado. Las guardias van por meses: a mitad de octubre, con
6 al mes desde junio, sale 30 (no 24) y quedan 38. El texto lo dice: «a fin de octubre, 20 de 44 Urgencias…». Los meses
que vienen siguen contando solo lo que tú pongas. Prueba 315 en cadena (Ajustes → Mes → pintar el último día del mes):
con el código de antes cae solo ella.

**Descartado:** contar solo las guardias de días ya pasados (era lo de antes: a mitad de mes faltaban las del resto).

**Supuestos:** si a mitad de mes has pintado menos guardias que el cupo, cuenta lo pintado (lo que pintas manda).

## Montar la semana de comidas: arreglos sueltos y bebidas en ml (2026-10-17)

**Elegido:**
- **La semana con tus platos no propone los días que ya pasaron** ni los toca al usarla: el sábado proponía de lunes a
  domingo (5 días ya comidos). Salen solo de hoy en adelante, con una línea «N días ya pasaron» y, si quedan pocos,
  «La semana que viene ›».
- **El desayuno lleva los de la casa** (los mismos de Comer → Hoy) si no has escrito ninguno tuyo, en vez de «—».
- **El aviso «Mantén pulsado un día…» del Mes solo sale en el Mes**: salía a los 400 ms aunque ya estuvieras en Comer.
- **Las bebidas se cuentan en ml** (leche, zumo, cerveza, café, refrescos, caldos…): la base va por 100 g y en un
  líquido 1 g ≈ 1 ml, así que la cifra es la misma y cambia la unidad en «Te leo», en lo apuntado y en la ficha.
- Pruebas 316 (semana con tus platos + aviso del Mes) y 317 (ml) en cadena; con el código de antes caen solo ellas.
  Dos pruebas antiguas dependían del día: la 273 no aceptaba la «á» de «sáb» y la 274 suponía que toda la semana en
  curso estaba por venir (ahora usa la semana que viene).
- Maquetas de tres direcciones para montar la semana en `design/comer-plan/` (por cocinadas, asistente de 3 pasos,
  nevera viva): esperan elección.

**Descartado:** pintar los días pasados con «ya pasó» (ocupaban media pantalla); cambiar a ml las líneas de la compra
y de los ingredientes de los platos (se leen y suman por unidad; va aparte).

**Supuestos:** qué es bebida lo dice el grupo «bebida» o el nombre (leche, zumo, batido, café, caldo, gazpacho…); los
yogures líquidos y el kéfir siguen en g salvo «kéfir líquido».

## Tu nutricionista, más presente (2026-10-17)

**Elegido** (maquetas en `design/nutricionista/`, con visto bueno):
- **Tu semana, siempre arriba en Comer → Hoy**: las kcal de cada día de lunes a domingo frente al objetivo (el pico en
  rojo; lo que queda, rayado con lo que te propongo), el **techo de hoy** y cuatro indicadores: verdura al día,
  legumbre, chocolate frente al tope y desayunos de solo café. El domingo, un botón para cerrar la semana.
- **Compensar un pico repartiéndolo**: un día con más de max(300 kcal, 15 % del objetivo) de exceso se reparte en los
  3 días siguientes, como mucho 300 kcal menos al día y nunca por debajo de un suelo (80 % del objetivo, mínimo
  1.500). Lo dice con sus números: «Hoy, no pases de 1.900: el jueves te pasaste 950…».
- **Chocolate con tope semanal** (2, ajustable en `food.nutChocoTope`): al ir a apuntarlo, «Te leo» dice qué vez sería
  y ofrece el kit (yogur con fresas, palomitas, verdura con hummus); tocar una opción cambia la frase. Sin regañinas.
- **Día de Lloret** (la rutina de cada noche que ya existe): antes de salir, «deja la cena hecha» con una cena que
  llena y engorda poco (380–700 kcal, 22 g de proteína o más: lo cocinado en la nevera, uno de tus platos o una
  propuesta con cantidades) y «Ponerla en la cena»; el kit para la vuelta con sus kcal y «el kit, a la compra». Al
  volver, el aviso cambia a «primero la cena, luego el kit».
- **El informe de la semana** (Tu nutricionista, con ‹ › por semanas): kcal/día, exceso de la semana, proteína, y
  **bien · falta · a cambiar** con la causa (noches de Lloret frente a las otras —o frente al 45 % del día si vas casi
  a diario—, desayunos de solo café y lo que cenas esos días, chocolate y a qué hora). **Dos metas** para la semana
  siguiente a la que miras; «Ponerlas en el plan» escribe la cena saciante en las noches de Lloret que quedan y un
  desayuno con proteína donde no hay. **Semana a semana**: 4 semanas de kcal, verdura, chocolate y desayunos.
- Pruebas 318 (tu semana + techo + chocolate) y 319 (informe + metas al plan), en cadena; con el código de antes caen
  solo ellas.

**Descartado:** un presupuesto semanal (elegiste repartir en 2–3 días); avisos de chocolate durante el día (solo al
apuntarlo); compensar bajando de golpe al día siguiente.

**Supuestos:** el pico, el suelo y el tope son los de arriba; «chocolate» es lo que lo nombra (bombones, Nutella,
Kinder…); «solo café» es no apuntar desayuno o solo café/infusión de menos de 150 kcal; la hora del chocolate es la
de cuando lo apuntas.

## El Plan, las tres en una (2026-10-19)

**Elegido.** Plan tiene tres vistas con las flechas de la semana arriba: **Días** (resumen de 4 cifras —cocinadas,
táperes, proteína/día, a comprar—, tu nutricionista en una línea con las kcal previstas, el Lloret y la verdura, y una
tarjeta por día con sus tres comidas y su sello: 🍳 cocinas · ♻️ sobras · 🧊 descongelar · 🥡 táper · 🏥 · ⚡ rápido · 🌿
cena del Lloret · 📌 fijada), **Nevera** (la semana vista como táperes en una nevera isométrica, una balda por
cocinada, el congelador abajo, qué sacas hoy y qué caduca) y **Compra** (la de siempre, que estaba escondida en
Despensa). «Montar la semana» va en dos pasos: cuándo y qué cocinas (los días propuestos entre los que puedes, la
guardia y el saliente tachados, una olla por día con sus raciones repartidas y el nutricionista diciendo qué grupo
faltaba y que la cena del Lloret va hecha) y revisar y usar (la semana en pequeño con las cifras para tu objetivo;
tocar una casilla la fija). Lo fijado (📌, desde la hoja de cada comida o en el paso 2) no lo toca ni «Montar» ni
«Rellenar huecos» ni «Otra combinación». Si cocinas por la tarde, la tanda se hace el día de antes que se pueda: la
comida de ese día no puede ser la olla recién hecha. Las cenas propuestas por el nutricionista se guardan con su nombre
de plato y con sus alimentos (la migración de platos de texto les quitaba el aceite y bajaban de las 380 kcal).

**Descartado.** La rejilla de 7 filas con cocinas · compra · proteína arriba, el asistente de 3 pasos de la lámina B
(cuántas veces y qué días ahora van juntos), la «semana con tus platos» (sus opciones «cocinar para 2 días», «sin
repetir», «guardias: táper» se quedan dentro de Montar) y el kit del Lloret repetido en cada día (va una vez, en la
línea del nutricionista).

**Supuestos.** Cocinas una hora después de salir del trabajo, o a mediodía si libras; cada olla da para 2–6
raciones según los días que quedan; los días que dijiste que no cocinas (⚙️) valen si no hay otros, salvo la guardia y
el saliente; una cena de Lloret de una olla solo si llena y engorda poco (380–700 kcal y ≥22 g); el color de la olla
es su proteína principal (legumbre, pescado, carne, huevo); la nevera dibuja hasta 3 baldas y 4 táperes por balda.

## Lo mínimo primero y una auditoría de código muerto (2026-10-19)

**Elegido.** De Ponytail (un complemento de Claude Code para escribir menos código) se copia la idea, no el
complemento: una regla en `CLAUDE.md`, «Lo mínimo primero» (¿hace falta? → ¿ya existe en `app.js`? → ¿lo trae
el navegador? → ¿basta una línea?), y una auditoría de lo que sobra:
- `app.js`: 7 definiciones que nadie usaba (`hoyCuentaAtras`, `anilloHTML`, `jornadaDeSiempre`, `cjeCelda`,
  `plmCand`, `COCINA_GUIA` y `consumoEfectos`, que solo usaba una prueba: ahora lee lo mismo de `cnAfecta`),
  4 acciones que ningún botón disparaba (`hoy-busv`, `pulsar-visto`, `sem-ir`, `sem-pasados`) y 3 copias de la
  misma función de pantalla de Ajustes (`ajuPantalla`, `datosPantalla` → `cfgPantalla`). 27 647 → 27 595 líneas.
- `styles.css`: 404 reglas y 15 selectores que solo podían casar con clases que ya no pinta nadie (los
  restos de la rejilla vieja del Plan, Dinero v4–v7, el banco del sueño, la guía de cocina…). 4 223 → 3 838
  líneas, 361 → 328 KB.
- Comprobado: 14 pantallas a 412×915 con el código de antes y el de ahora, **idénticas píxel a píxel**
  (Mes, Semana, Hoy, Comer en sus cuatro pestañas, nutricionista, Entreno, Dinero, Hábitos, 4:20, Ajustes y
  Datos), y la suite completa en verde.

**Descartado.** Instalar Ponytail: su instrucción se carga en cada sesión (gasta lo que dice ahorrar), es de
un tercero y puede traer hooks, y lo útil ya lo hacen `/simplify` y la regla nueva. Quitar el CSS «a ojo»:
solo sale lo que se puede probar que no casa con nada.

**Supuestos.** Una clase CSS está viva si su nombre aparece entero en `app.js`, `index.html`, `sw.js` o `fig/`;
las que se componen al vuelo (`'t-'+tipo`, `'ev'+nivel`) se comprobaron a mano y se quedan. Un selector dentro
de `:is()`, `:where()`, `:not()` o `:has()` no se toca aunque lleve una clase muerta.

## El Mes con el día entero de su color, y sin «Semana» (2026-10-19)

**Elegido.** Lo primero de la versión 3.0. Con maquetas (`design/mes-colores/`), variante **B · colores suaves**:
- Cada casilla del Mes va **entera** del color de lo que toca: guardia rojo suave con un borde rojo fuerte y
  «🚨 UMI/URG», saliente gris oscuro (con el número en blanco), trabajo marrón, entreno azul, libre verde claro y
  vacaciones arena. El número del día pasa de 11–13 px a **24 px** y en negro. El día de trabajo con entreno va
  marrón con el entreno en una chapa azul. Los eventos, en chapas blancas legibles sobre cualquier color. La
  leyenda del «?» enseña los seis colores. Las fichas dibujadas (el «coche rojo») salen de la casilla.
- **Fuera la vista Semana** («ni la uso»): Calendario se queda en Mes · Hoy. Quien llegue a ella (un enlace
  viejo, la última pestaña guardada) cae en Mes. Lo único suyo que no estaba en otro sitio, **«Mi rutina» por
  tipo de día, pasa a Ajustes → YO**.
- **Fuera las vistas Isométrica y Carretera del Mes** (elegido por ti al quitar Semana): el Mes es la cuadrícula.
  La carretera sigue en Hoy («Lo que viene»). Se borra `fig/calendario-iso.js`.
- Limpieza de lo que solo usaban esas vistas: unas 35 funciones y constantes (renderWeek, el tablón, la
  cochera…), 11 acciones sin botón y 184 reglas de CSS. `app.js` 27 595 → 27 080 líneas; `styles.css` 3 838 → 3 719.
- De paso, un fallo pequeño: con el teclado, la flecha sobre la carretera de «Lo que viene» cambiaba de día en
  vez de avanzar la carretera.
- Y el pendiente [aparc-aviso-mes]: el aviso «Mantén pulsado un día…» del Mes ya no se queda tapando Hoy o Comer
  si cambias de pantalla mientras se ve (prueba 322: sin el arreglo, el aviso sigue en Comer y en Hoy).
- El color de cada evento en el Mes va en el borde izquierdo de su chapa blanca (la hora, en oscuro, para que se
  lea sobre cualquier color de evento).
- Prueba encadenada 321 (Calendario solo con Mes y Hoy → tocar un día → «✏️ editar» → guardia → la casilla entera
  de guardia con 🚨 y número ≥ 22 px y el día siguiente saliente → volver a Trabajo → la rutina desde Ajustes). Con
  los colores quitados caen 2 de sus 4 comprobaciones. Las pruebas de Semana y de las vistas quitadas se retiran
  o se pasan a Mes/Hoy.

**Descartado.** Variante A (colores llenos): más chillona, sobre todo de noche. Dejar Isométrica y Carretera con
la cuadrícula de colores. Hacer que los colores del Mes sigan los de Ajustes → Calendario (esos tiñen los
dibujos): pediste colores concretos para cada tipo.

**Supuestos.** Saliente = gris oscuro con el número en blanco (en negro no se leería). Vacaciones en arena (no
lo dijiste). El día de trabajo con entreno manda el trabajo (marrón) y el entreno va en su chapa azul. Las
«Reglas de oro», que solo se editaban desde Semana, se quedan guardadas y salen en «Exportar en texto», pero ya
no se editan desde la app. El selector de mes sale en inglés solo en el navegador de pruebas: en tu móvil en
español sale en español.

## Entreno: el plan de vuelta tras un parón (2026-10-19)

**Elegido.** Lo segundo de la 3.0 (v3-plan-vuelta), con las maquetas de `design/entreno-vuelta/` tal cual:
- Con **2 semanas o más** sin apuntar una serie (y con historial detrás), Entreno abre con «Tu vuelta al gimnasio ·
  Semana 1 de N»: la escalera de semanas (70 → 80 → 90 → 100 %), qué toca esta semana (días, series, % y cuántas
  repeticiones te tienen que sobrar), el progreso y «Empezar … (vuelta)».
- **N = la mitad de las semanas parado** (entre 2 y 6). Ritmo «más suave» (+2 semanas, desde el 60 %), «normal»
  (desde el 70 %) o «más rápido» (−1 semana, desde el 75 %). Semana 1: 2 días; luego tu mínimo semanal (o 3).
- **La sesión ya viene ajustada:** el peso es el % de lo que movías antes de parar (no lo de la última vez a secas),
  con las series que tocan y su porqué. La semana no avanza hasta hacer sus entrenos; si la última sesión fue
  «dura» (esfuerzo 8 o más), la semana va un 5 % más abajo; si vuelves a parar 2 semanas, el plan se rehace.
- **El «listo» cuenta el parón:** −25 % la semana 1, −15 % la 2, −5 % después, con «Hoy versión de vuelta».
- «Ver el plan entero y el porqué» (tabla, ritmo, la ciencia en tres líneas) y «no lo necesito: quitar el plan».
- Antes, tras dos meses parado: «Listo al 100 % · Entrena normal» y «Sube a 85 kg» con lo de hace dos meses.
- Prueba encadenada 323 (portada → plan → más suave → empezar → quitar). Sin el plan caen 3 de sus 4 comprobaciones.

**Descartado.** Activarlo solo a mano; esperar a 3 semanas (elegiste 2). Que la descarga o la «versión corta» se
sumen encima del plan (se recortaría dos veces).

**Supuestos.** El peso de antes es el más alto de trabajo del último día de ese ejercicio antes de parar. La semana
2 en adelante usa tu mínimo semanal de Entreno (o 3 días si no tienes). «Duro» = esfuerzo de la sesión 8 o más.
Se guarda en `gym.regreso` (`gym.vuelta` ya eran los minutos de volver a casa).

## Hoy: el conductor que cuenta lo que ves (2026-10-20)

**Elegido.** Lo tercero de la 3.0 (v3-conductor), con las maquetas de `design/hoy-narrador/`: elegiste **A + B**
y los tres extras.
- **El cartel verde:** el próximo evento cruza la carretera por arriba con su hora, su nombre y lo que falta
  («10:00 SESIÓN CLÍNICA · en 20 min»). Asoma 3 horas antes y se acerca con el reloj; tocarlo abre el evento.
- **El subtítulo** dentro del parabrisas, en una o dos frases («En 20 min, Sesión clínica. Sigues en el trabajo hasta
  las 15:00.») y una línea de lo de después. Se quita al mirar a los lados o con la radio; «más ›» baja al narrador.
- **El narrador** debajo del dibujo: qué haces y hasta cuándo, en frases normales (y qué es lo que ves: la ciudad
  es tu jornada, el acantilado el Lloretazo, el cartel verde el evento), lo que te falta apuntar (lo que pregunta el
  retrovisor) y **lo que viene** con su cuenta atrás, incluida la cama de esta noche. Cada fila abre lo suyo.
- **El porqué:** por la tarde, por qué a la cama a esa hora (la de levantarte al día siguiente y tus horas de
  sueño); hora y media antes del último café, por qué ese café es el último (6 h antes de la cama).
- **«¿Qué estoy viendo?»**, plegado: once líneas con lo que significa cada cosa del dibujo.
- Todo sigue a la hora que mueves con el dedo o las flechas, no solo a la de ahora.
- Prueba encadenada 324 (9:40 → flechas a las 10:40 → mirar a la izquierda y Escape → leyenda → tocar la sesión).
  Sin el cambio caen sus 6 comprobaciones.
- De paso, dos pruebas viejas que solo pasaban en lunes (239 y 274) ya no dependen del día de la semana.

**Descartado.** Poner el cartel en su parada de la ruta (salía al fondo, diminuto: el autobús está parado en la
ciudad toda la jornada). El narrador en la Estación (solo el Conductor, que es el que pediste). Leyenda abierta de
serie (alarga la pantalla).

**Supuestos.** El cartel es solo para eventos (no comidas, entreno ni turnos). El subtítulo nombra lo siguiente si
falta 3 horas o menos. «¿Qué estoy viendo?» va plegado. En días pasados no hay subtítulo y el narrador cuenta
cuántas cosas marcaste.

## Mes: lo ya pasado del mes en el que estás, y la lista de guardias (2026-10-20)

**Elegido.** Arreglo de un fallo que te pasó de verdad: en secretaría te preguntaron por las guardias de octubre y la
app no las enseñaba. El Mes del mes en el que estás empieza en la semana de hoy, y septiembre llega solo hasta el 4
de octubre: **del 5 al 18 de octubre no salía en ningún sitio.**
- Encima de la cuadrícula, **«▲ Ver del 1 al 18 de octubre»** hace que empiece en la semana del día 1 (los días del mes
  anterior van apagados). «▼ Ocultar» vuelve a empezar en la semana de hoy. Elegiste esto frente al mes entero del 1 al 31.
- **Al tocar el abono**, la hoja del mes empieza con «GUARDIAS DE OCTUBRE · 3 hechas de 4» y una línea por guardia:
  día, tipo, horas y «✓ hecha» o «por hacer». Se puede enseñar tal cual.
- Prueba encadenada 325 (ver del 1 al N → abono → lista → ocultar). Sin el arreglo caen sus 2 comprobaciones.

**Descartado.** El mes entero del 1 al 31 y «del 1 hasta 4 semanas por delante» (elegiste el botón). Un botón de copiar
la lista (de momento basta con enseñarla).

**Supuestos.** El botón se queda como lo dejes mientras la app está abierta; al volver a abrirla, empieza en la semana
de hoy. «Hecha» es una guardia de un día anterior a hoy, como en el abono.

## Mes: la frontera entre meses (2026-10-20)

**Elegido.** Una línea amarilla en escalera que dibuja la frontera entre meses en la cuadrícula del Mes: a la izquierda
del día 1 (si no cae en lunes) y encima de los días que tienen arriba el mes anterior. Así se ve de un vistazo dónde
acaba septiembre, octubre o noviembre. El color de cada casilla sigue siendo el tipo de día. La leyenda («?») lo dice.
Se pinta en el hueco entre casillas (con su sombra), y la sombra de la guardia y la de hoy van en variables para poder
sumarse. Prueba encadenada 326 (ver del 1 → frontera de los dos meses → › al mes siguiente). Sin la línea caen sus 2
comprobaciones.

**Descartado.** Una raya de color por mes arriba de cada casilla (la primera versión: no era lo que pedías, que era la
frontera). Blanco para la línea: se confundía con el anillo de «hoy».

**Supuestos.** Amarillo (el color de aviso de la app), 4 px. Vale en todos los meses, no solo en el actual.

## La suite en 5 minutos: el banco grande en 3 trozos a la vez (2026-10-20)

**Elegido.** `npm run test:corto` parte el banco grande (`regression`, ~11 min en fila) en 3 trozos seguidos que corren
a la vez, cada uno en su navegador, junto con los 6 bancos pequeños: **de ~12 min a 308 s**, todo en verde, medido dos
veces. Solo se corta donde las pruebas pasan arrancando de cero (delante de la 202 y de la 270), así que ninguna cadena
de pruebas se rompe (`tools/pruebas-reparto.py`). `TROZOS=1` la vuelve a correr en fila. La 275 ya no depende de que la
semana esté «con fechas» (lo pone ella si hace falta).

**Descartado.** Acortar todas las esperas fijas a la vez (×0,4): se cae la lectura en vivo, que espera a propósito.
Arrancar cada trozo con una «foto» de los datos del corte: los datos llevan fechas y la foto no valdría al día siguiente.
Partir las 201 primeras: van en cadena (jornada 8–15, tipos de guardia, platos, menú) y habría que darles sus datos a mano.

**Supuestos.** Las pruebas del arranque (antes de la 1) se repiten en cada trozo: por eso el total sale 746 y no 730.
Para bajar a ~2 min falta que las 201 primeras preparen sus propios datos (se apunta para otra sesión).

## El móvil en «modo ordenador» (2026-10-20)

**Elegido.** Arreglo de un fallo que te pasó: con «Sitio de escritorio» activado en Brave (o Chrome), el navegador no hace
caso al ancho del móvil y pinta la app a 980 px; todo salía diminuto y, con la app instalada, no había menú para
quitarlo. Ahora la app lo detecta (pantalla de móvil táctil, de 600 px o menos, y ventana al menos un 30 % más ancha
que ella), se amplía para caber justo (zoom ≈ 2,4) y decide las reglas de móvil de `styles.css` con el ancho de verdad
de la pantalla. Se ve igual que en modo normal (comparado a 412×915) y los toques caen en su sitio. Al quitar el modo
ordenador, todo vuelve a como siempre. Prueba encadenada 327 (980 en pantalla de 412 → tocar un día → volver a 412).
Sin el arreglo cae.

**Descartado.** Cambiar la etiqueta de ancho al vuelo (en modo ordenador el navegador la ignora). Solo un aviso con
instrucciones (no arregla nada si no encuentras el menú).

**Supuestos.** Un ordenador de verdad (pantalla ancha) o una tableta (más de 600 px) no se toca. Si amplías con dos
dedos, la app no lo confunde con el modo ordenador (se mira la pantalla, no el zoom).

## Comer: estudio de fuentes de alimentación con ingeniería inversa (2026-10-26)

Encargo [enc-comida-ri]. Solo estudio (ni una línea de `app.js`): entender bien las fuentes que ya usa Comer para
proponer mejoras después, cada una en su sesión con maqueta y prueba. Con el visto bueno del usuario (4 fuentes, en
Opus). La red del contenedor solo llega a npm y GitHub, así que OFF/USDA no se pudieron pedir en vivo.

**Elegido.** Estudiar cuatro fuentes y quedarnos con estos patrones:
- **Repos abiertos** (fuente con evidencia vista): `simonoppowa/OpenNutriTracker` (GPLv3) y `brandonp2412/FitBook`
  (MIT), ambos usan OFF + USDA FDC. Solo se aprendió el patrón, sin copiar código. Lecciones: (a) el buscador de texto
  de OFF moderno es Search-a-licious (`search.openfoodfacts.org/search`), con `/cgi/search.pl` de reserva, y el código
  de barras rehidrata desde `api/v2/product`; (b) conviene pedir ~100 candidatos y reordenar fusionando relevancia con
  `popularity_key`, no quedarse con el orden crudo; (c) **los micros de OFF llegan en gramos**: los minerales hay que
  pasarlos ×1000 (mg) y las vitaminas A/D/B12 ×1.000.000 (µg), o se guardan ridículamente pequeños; (d) modelo de
  ración = base por 100 g + lista de porciones (de FDC `foodPortions`: descripción + gramaje), con conmutador «por
  100 g / por ración».
- **Worker de recetas** (evidencia vista, `tools/worker-recetas.js`): es del usuario, lista blanca de sitios (no es
  proxy abierto), oEmbed con reserva `og:description`, devuelve `{texto, autor, via}` en crudo; el troceado lo hace la app.
- **OFF y USDA** (sabido por documentación + el propio código de la app, sin muestra en vivo): se documentó la forma de
  los campos que hoy no se usan (`nutriscore_grade`, `nova_group`, `additives_tags`, micros de `nutriments`,
  `serving_size`/`serving_quantity`, `quantity`; en USDA `foodNutrients`, `servingSize`/`servingSizeUnit`, `foodPortions`).

**Descartado.** Ingeniería inversa de apps propietarias de terceros (MyFitnessPal y similares): descompilar, interceptar
su API privada o copiar su base — lo prohíbe el disclaimer de la propia skill y choca con la privacidad de esta app.
Instalar el toolkit MCP `morluto/rea` (necesita Ghidra/IDA y no funciona en este contenedor). Tocar algo de `app.js`
en esta sesión (el estudio no construye nada).

**Supuestos.** Ningún dato del usuario entró en el estudio: solo formatos públicos, código abierto y el worker propio.
Los dos repos quedaron clonados fuera del repositorio (`/home/user/...`), no se suben y se borran al cerrar. Las mejoras
concretas que salgan (ver registro, [enc-comida-ri]) irán cada una en su sesión, con maqueta si cambian lo que se ve,
prueba encadenada, suite en verde y sello antes de main.

## Comer: el buscador de Open Food Facts, ordenado por popularidad (2026-10-26)

Primera mejora del estudio [enc-comida-ri] (la «C»). Open Food Facts devolvía los resultados solo por relevancia del
endpoint clásico (`/cgi/search.pl`), que es flojo: entierra productos muy usados y bien cuidados bajo fichas casi vacías
o duplicadas. Lección de las apps abiertas estudiadas (OpenNutriTracker): pedir un pool mayor y reordenar fusionando
relevancia con `popularity_key` (cuánto se escanea un producto).

**Elegido.** `buscarOffNombre` ahora pide 50 candidatos (antes 16) y el campo `popularity_key`, y los reordena con
`offOrdena`: puntuación = rango de relevancia + rango de popularidad (menor, mejor); al empatar gana el más popular, y
si aún empatan, el orden original. Así un producto muy usado sube aunque OFF no lo pusiera primero, sin que un producto
popular pero poco relevante arrase (ambas señales pesan igual). Una ficha nueva sin `popularity_key` cuenta como poco
popular y baja. Cambio localizado: **no toca** el «Hacendado primero», que lo sigue dando la doble consulta de
`offBuscarEnVivo` (primero con filtro de marca, luego el resto); `offOrdena` solo ordena dentro de cada consulta.
Prueba encadenada 328 (escribir en el buscador → pulsar «buscar en Open Food Facts» con OFF fingido: el popular sube).
Cae solo ella al revertir el reordenado.

**Descartado.** Ordenar solo por popularidad (un producto popular pero que no es lo que buscas arrasaría). Mover la
búsqueda de texto a Search-a-licious (lo que hace OFF hoy): es más cambio del que pide esta mejora; se deja anotado
como posible siguiente paso. Tocar `mapOffProduct` (el reordenado va sobre el crudo, antes de mapear).

**Supuestos.** El endpoint clásico devuelve `popularity_key` cuando se pide en `fields`; si no llega (ficha sin él),
cuenta como 0 y el orden queda como la relevancia de OFF (sin empeorar nada). No desplegado a main en esta sesión: la
suite tiene 2 rojos ajenos sensibles a la fecha (Mes y Dinero, víspera de nómina) y a main solo se pasa con todo verde.

## Comer: la hoja de cantidad con pasos, rueda, unidad y ración de verdad (2026-10-27)

Contexto: ± iba siempre de 10 en 10 (o de 5 por debajo de 30) y en «gramos» para todo, la leche incluida; un producto
de Open Food Facts abría en 150 g aunque la etiqueta dijera «1 yogur = 125 g». Maquetas en `maquetas/comer-cantidad.html`,
con visto bueno.

**Elegido.** (1) Debajo del número, «paso 10 · 50 · 100»; el último elegido se recuerda (`food().pasoCant`).
(2) Mantener ± pulsado: a los 0,45 s empieza a correr, y cada vez más rápido (260 → 130 → 60 ms). (3) Tocar el número
abre una rueda (41 valores con el paso elegido, el actual en medio); al parar de deslizar se queda el del centro, y
con la rueda abierta el número pasa a escribirse a mano como antes. (4) Cada cosa en su unidad: ml para lo que se bebe
(la etiqueta de OFF manda: `serving_quantity_unit`/`product_quantity_unit`, o «ml/cl/l» en el envase; si no, el
nombre o el grupo «bebida» de la tabla), g para lo demás; también en el mensaje de «añadido». (5) Ración de verdad:
OFF pide `serving_size` y `serving_quantity`; si hay ración, la hoja empieza en «1 · ración · 125 g» con el conmutador
«por ración / por 100 g» (± de media ración; los botones ½ · 1 · 1½ · 2) y el + rápido del buscador apunta una
ración. De USDA se guardan hasta 3 porciones (`foodPortions` o `foodMeasures`, traducidas lo justo: «1 taza · 158 g»)
y se suman a los botones del alimento. La cantidad se sigue guardando en g/ml: el modo solo cambia cómo se cuenta.
Prueba encadenada 330; la 233 ahora toca el número antes de escribir. Caen al revertir la ración, el mantener pulsado,
la rueda y la unidad de OFF.

**Descartado.** Seis botones −100 −50 −10 / +10 +50 +100 (no caben a 412 px junto al número). Una rueda a pantalla
completa (tapa la previa de macros). Un selector g/ml/mg en cada ficha (se eligió «según el producto»).

**Supuestos.** mg no aparece en los datos de la app (ni OFF ni la tabla traen cosas en mg para apuntar), así que no hay
ficha en mg; si llega una ración en mg se ignora. Los productos guardados antes no tienen ración ni unidad hasta que se
vuelvan a traer de OFF (los que se llaman «leche…», «zumo…» ya salen en ml por el nombre). Las porciones de USDA solo
llegan al volver a consultar un alimento. La guarda contra el click de más al soltar tras mantener es defensiva:
Chromium no manda ese click (el botón se repinta), así que la prueba no la puede hacer caer.

## Comer: el sello de Open Food Facts, Nutri-Score · NOVA · aditivos — mejora D (2026-10-27)

Contexto: OFF ya daba `nutriscore_grade`, `nova_group` y `additives_tags`, pero la app no los pedía. El usuario eligió
de una vez, al abrir la sesión: sello en la ficha y en el buscador (solo la letra), aditivos «cuántos y al tocar, la
lista», los guardados se completan al abrir su ficha y, si falta un dato, «sin dato». Maquetas en
`maquetas/comer-sello.html`, con visto bueno.

**Elegido.** (1) `OFF_CAMPOS` pide los tres campos; `selloDe()` los pasa a `ns` (A–E), `nova` (1–4) y `adit`
(«en:e322i» → «E322i»); `sello:1` marca que ya se preguntó. (2) En la hoja de cantidad de un producto, bajo el nombre,
tres casillas: Nutri-Score (las cinco letras con la suya grande, colores oficiales), Procesado (NOVA con su palabra) y
Aditivos (cuántos; si hay, es un botón que despliega código + nombre en castellano y otro toque lo cierra). Lo que OFF
no sabe: «sin dato» con borde a rayas. (3) Un producto guardado antes, con código de barras de verdad, pide el sello a
OFF al abrir su ficha (solo los tres campos), lo guarda y repinta solo el sello; mientras, «trayendo…»; sin red, lo dice
y vuelve a intentarlo al abrirlo otra vez pasado un minuto. Si OFF no lo conoce (404), queda como «sin dato» y no se
vuelve a pedir. (4) En el buscador, la letra pequeña junto al nombre en tus productos y en la lista de OFF. Prueba
encadenada 331; cae al revertir.

**Descartado.** NOVA y aditivos también en la lista del buscador (más ruido por fila). «Sin dato» en las filas del
buscador. Pedir los nombres de los aditivos a la taxonomía de OFF (otra consulta a la red por producto). Un botón
«Actualizar de OFF» (se eligió que se complete solo).

**Supuestos.** Los nombres de los aditivos salen de una tabla de los 113 más comunes (`ADITIVOS` en `app.js`); el que
no está sale solo con el código. Si OFF no trae `additives_tags`, es «sin dato»; si trae la lista vacía, «0». Los
productos sin código de barras real (catálogo local sin EAN, creados a mano) salen con las tres casillas en «sin dato».
Los alimentos de la tabla y los platos no llevan sello (no son de OFF).

## Plan global de la 3.0 y gasto por tarea (2026-10-27)

**Elegido.** Un tablero único de la 3.0 en `.claude/plan-socialista/plan-v3.md` (en marcha · por hacer en orden ·
ideas · hecha), que cuenta `/bitacora` y al que van las cosas nuevas que diga el usuario. El apartado **Gastos** en
`/plan-socialista`, traído de `fiebres-neutropenias` (REGLAS §4.7 y `autonomo/gasto.mjs`): `tools/gasto.mjs` mide la
sesión (principal y cada ayudante, en tokens equivalentes por modelo) y con `--apunta` deja la fila en
`.claude/plan-socialista/gastos.md`; el presupuesto de la siguiente tarea de un tipo es el 90 % de la última. Se mide en
el traspaso (paso 7 de `cierra-y-despliega`) y el parte dice la siguiente tarea con su presupuesto.

**Descartado.** Repartir el gasto por claves `[tarea]` como en el otro repositorio: aquí es una sesión por tarea. Dar
el gasto en euros: los precios cambian y no se deben dar de memoria; se compara en equivalentes y siempre en el mismo
modelo. Dejar la lista de la 3.0 también en `registro.md`: dos listas acabarían diciendo cosas distintas.

**Supuestos.** El orden de «Por hacer» lo propuse yo (lo que bloquea, luego Comer, luego lo grande) y lo cambia el
usuario. Solo se puede medir la sesión en curso (el contenedor es nuevo cada vez): si no se mide al cerrar, se pierde.

## spec-kit y el plan de la tanda de Comer (2026-10-27)

**Elegido.** De [spec-kit](https://github.com/github/spec-kit) (MIT) solo la forma de trabajar, en una skill corta en
español, `ficha-de-tarea`: qué y cómo se sabe que está bien (Dado/cuando/entonces), como mucho 3 dudas, dónde se toca,
pasos con archivo, ayudante, modelo y tope, y una comprobación antes de construir. Las tareas 1, 2, 3, 4, 5, 9 y 13 del
plan, agrupadas en 8 sesiones (S1–S8 en `plan-v3.md`) con una sola ronda de maquetas para todo Comer: ~10 M
equivalentes estimados frente a ~14 M una a una.

**Descartado.** Instalar `specify` (programa en Python) y sus plantillas: unas 3.000 líneas en inglés pensadas para
proyectos con varias carpetas y contratos de API; leerlas en cada tarea costaría más de lo que ahorran y repiten lo que
ya hacen `tarea-a-fondo`, `redisena-seccion` y DECISIONS.

**Supuestos.** Los presupuestos son estimaciones (solo hay una tarea medida); se corrigen con S1 y S2. Las tareas 1
(pruebas) y 9 (Dinero) no son de Comer pero entran en la tanda porque las pediste en la misma lista.

## 2026-10-28 · El gobierno del repositorio y el Consejo de Dinero

**Elegido.** Copiar de fiebres-neutropenias el gobierno (papeles por skill) y el Consejo de Ministros, adaptados:
Educación pasa a ser **Bienestar** (si le sirve al R1 en el móvil); un **ministerio del asunto** se invita según el tema
(Economía para Dinero); Hacienda cuenta tokens con `tools/gasto.mjs`; tope por reunión 0,6 M. Reservado al usuario:
presupuesto total, lo que cambia lo que ve, los datos y pasar a `main`. Primer Consejo: reforma de Dinero en 6
sesiones (D1-D6, ≈5,0 M), método «págate primero + bolsillos» con un solo disponible; acta en
`.claude/plan-socialista/consejo/2026-10-28.md`.
**Descartado.** Copiar Exteriores (`/radar`) y los jueces automáticos (aquí no existen; Justicia es la suite, los hooks
y `/revisa-seguridad`). Hacer el informe de la S8 aparte (el acta lo sustituye).
**Supuestos.** Que «el repositorio de fiebres neutropenias» es `fiebres-neutropenias` (el más reciente) y no
`urgencias-fiebre-neutropenica`. Que pedir instalarlo equivale a aprobar la constitución adaptada.
