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
