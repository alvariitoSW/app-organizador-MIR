# Decisiones

Qué se eligió, qué se consideró y se descartó, y por qué. Una entrada por tarea, la más reciente
arriba. Lo lleva la habilidad `tarea-a-fondo`.

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
