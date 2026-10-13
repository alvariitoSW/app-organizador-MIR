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
