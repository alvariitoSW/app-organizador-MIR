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
