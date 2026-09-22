# Informe de la app · septiembre de 2026

Escrito después de conducir la app entera a 412×915 (tu móvil) con datos de
verdad: el catálogo importado, la nevera llena, objetivo puesto y comida
apuntada. **29 pantallas medidas, 44 104 px = 48,2 pantallas de móvil, cero
errores de JavaScript en todo el recorrido.** Las pruebas: 204 + 6 + 7 + 10 + 13,
todas en verde.

El informe está escrito desde el uso que me pediste: alguien que acaba de
mudarse solo, paga alquiler, trabaja a turnos, hace la compra, estudia, entrena,
tiene eventos y proyectos, y quiere **una sola app**.

---

## 1. El fallo que hay que arreglar antes que nada

**La lista de la compra se deja fuera todo lo que no sea «de tanda», y no avisa.**

Comprobado midiendo: metí en el menú de un tipo de día un plato nuevo («Tostada
de aguacate», con pan de centeno y aguacate) **sin asignarlo a una sesión de
cocina**. Resultado:

| | líneas en la compra | ¿aparece el aguacate? |
|---|---|---|
| plato del menú **sin tanda** | 39 | **no** |
| el mismo plato **con tanda** | 41 | sí |

Un plato que te comes cada semana pero que no cocinas en lote —una tostada, unos
huevos, un yogur, una ensalada— **no aporta ni un ingrediente a la compra**. Y el
único parche que existe es un `staplesFor()` que rescata cosas por nombre con una
expresión regular: `whey|prote|Caf|fruta`. Si tu desayuno no se llama así, no
entra.

Por qué es el más caro de todos: te vas al supermercado con una lista
**incompleta y sin ninguna señal de que falte nada**. Y además contradice lo que
la app acaba de prometer en la portada de Comer («el menú manda en la compra»).

**Qué hacer**: que la compra se calcule del menú entero —lo de tanda por
sesiones, y lo que no es de tanda por raciones de la semana— y que cada línea
siga diciendo de dónde sale. Lo de «básicos del desayuno» con regex se cae solo.

---

## 2. Lo que está sobredimensionado · rediseñar

Medido a 412×915, ordenado por lo que ocupa:

| pantalla | alto | campos | qué pasa |
|---|---|---|---|
| **Turno y rotación** | **7 005 px (7,7 pantallas)** | **126** | la peor de la app, con diferencia |
| **Ajustes** | 4 864 px (5,3) | 44 | 13 tarjetas sin relación entre ellas |
| **Datos** | 4 317 px (4,7) | 15 | copias, Google, ejemplos, todo junto |
| Comidas armadas | 2 299 px (2,5) | 0 | cada comida, con su lista entera |
| Compra | 2 154 px (2,3) | 0 | 39 frescos: aquí el largo ya es la lista |
| Mes | 2 043 px (2,2) | 28 | el calendario + tres tarjetas de config |
| Semana | 2 117 px (2,3) | 0 | siete días con su franja |

**Turno y rotación** es lo primero que tocas al llegar a una ciudad nueva
(«¿cuándo trabajo?») y es una sola pantalla de casi ocho, con 126 campos
seguidos: las piezas del día, las horas de levantarse y acostarse, la estructura
semanal, la rotación por fecha y las notas del planning. Merece el mismo trato
que le dimos a Comida: una portada que se lee de un vistazo y una pantalla por
tarea.

**Ajustes** es un cajón de sastre: sueño, eventos, Google Calendar, lector de
enlaces, el sol, datos de alimentos, la franja del día, apariencia, copias de
seguridad y rotaciones. Y ahí dentro, **escondidos entre todo eso, están los
eventos** —«Presentación en rayos», el día que te toca pagar algo—, que es de lo
que más se usa y de lo que menos se encuentra.

---

## 3. Lo que está flaco · mejorar

| pantalla | alto | botones |
|---|---|---|
| Entreno · portada | **445 px (0,49 pantallas)** | 5 |
| Entreno · cardio | 414 px | 5 |
| Entreno · biblioteca | 282 px | 8 |
| Notas | 377 px | 6 |
| Hábitos | 471 px | 8 |

**Entreno está a medio hacer comparado con Comer.** Comer tiene doce pantallas
trabajadas; Entreno tiene una portada de media pantalla. Para que entrenar sea un
pilar de verdad le falta: la rutina de hoy en la portada (como Comer enseña lo
que llevas comido), la progresión de cada ejercicio a la vista, y que el entreno
salga en el calendario igual que sale la comida.

**Notas es una libreta plana.** Para «apuntar cosas, proyectos, cosas que hacer»
no llega: una nota solo puede estar suelta, con día, o hecha. No hay tarea con
estado, ni proyecto que agrupe, ni prioridad, ni nada que te diga «esto es para
esta semana».

---

## 4. Lo que no existe y esa vida necesita

Comprobado en el almacén: **no hay ni una línea de dinero, ni de tareas, ni de
estudio**. `store` tiene `rhythm, meta, patterns, rotation, tema, listas, franja,
notas, habitos, eventos, dishes, meals, menu, batches, shifts, food`.

1. **Dinero.** Alquiler, facturas, la compra. Cero. Es el primer estrés de vivir
   solo y la app no lo toca, aunque ya sabe casi todo: tiene tu lista de la
   compra y un catálogo de 188 productos de Mercadona, Carrefour y 100
   Montaditos. Con un precio por producto, la compra te diría **lo que te va a
   costar** antes de ir, y el mes te diría en qué se te va.
   *No hay ningún campo de precio en toda la app: `grep precio app.js` → 0.*
2. **Tareas y proyectos.** Nada. «Llamar a la gestoría», «pedir cita», «preparar
   la sesión del jueves» no tienen sitio salvo como nota suelta.
3. **Estudio.** Para un residente es media vida —sesiones, presentaciones,
   lecturas, cursos— y no hay nada: ni un registro de horas, ni temario, ni
   repaso.
4. **Una portada de «mi día».** Hoy, Comer, Entreno y Notas van cada uno por su
   lado. No existe la pantalla que conteste de una vez: *qué tengo hoy, qué como,
   qué entreno, qué tengo que hacer y qué tengo que pagar*.
5. **Avisos.** La app no avisa de nada: ni una notificación en todo el código
   (`Notification` → 0 apariciones en `app.js` y en `sw.js`). Para pagar el
   alquiler el día 1, o para acordarte de sacar el táper del congelador, hace
   falta.

---

## 5. Plan, por orden de lo que más cambia tu día

> **Estado, 22 de septiembre: los siete puntos están hechos.** Lo que hay debajo
> es el plan tal y como se escribió; al final de cada uno, lo que acabó siendo.


**Primero — que la compra no mienta** (§1). Es un fallo, no una mejora, y es el
que te deja tirado en el supermercado.

**Segundo — dinero, en pequeño.** No una app de finanzas: tres cosas. Gastos
fijos con su día del mes (alquiler, luz, móvil, gimnasio) que salgan en el Mes y
avisen; un precio opcional por producto para que la compra sume; y un «lo que
llevas este mes». Con eso, la app ya cubre el primer estrés de vivir solo.

**Tercero — tareas de verdad, dentro de Notas.** Una nota pasa a poder ser tarea:
estado, día, y opcionalmente proyecto. Y las de hoy salen en «Hoy».

**Cuarto — Turno y rotación, rediseñado** (§2). Siete pantallas y 126 campos es
lo que más pesa de toda la app, y es la puerta de entrada cuando cambias de
destino o de rotación.

**Quinto — Entreno al nivel de Comer** (§3): la rutina de hoy en la portada, la
progresión visible y el entreno en el calendario.

**Sexto — «Mi día» como pantalla de arranque**: lo de hoy de las cinco patas en
una sola pantalla.

**Séptimo — avisos** (alquiler, eventos, sacar el táper). Lo último porque
depende de que existan las cosas de las que avisar.

---

### Lo que acabó siendo cada punto

| # | hecho | resultado medido |
|---|---|---|
| 1 | la compra sale del menú entero | 54 → 62 cosas: 8 platos sueltos que no pedían nada |
| 2 | Dinero: fijos, lo apuntado y el mes | pantalla nueva, 0,66 pantallas · y un fallo: `type="number"` rechaza la coma |
| 3 | Notas por cuándo toca, con proyectos | cinco montones y las de hoy en «Hoy» |
| 4 | Turno y rotación partido | 7 005 px → portada de **472 px (0,52)** + 5 pantallas |
| 5 | Entreno sabe qué toca hoy | la rutina se pega al tipo de día, como los menús |
| 6 | «Mi día» | arranca en Hoy, y Hoy se lee de arriba abajo |
| 7 | Avisos | no hay push sin servidor: avisa el calendario del móvil desde el `.ics` |

**Y el §2, terminado.** Ajustes y Datos han recibido el mismo trato que Turno,
medido a 412×915 con datos de verdad:

| | antes | después |
|---|---|---|
| **Ajustes** | 5 150 px · 13 tarjetas · 1 176 palabras, todo del tirón | portada de **643 px** (0,70 pantallas) + 5 pantallas de 366 a 1 475 px |
| **Datos** | 4 317 px · 7 tarjetas · 870 palabras | portada de **539 px** (0,59) + 5 pantallas de 455 a 1 040 px |
| **Eventos** | la tarjeta 4 de 13, enterrada | **sección propia** de 467 px en el cajón |

Entre las dos pantallas de configuración pasan de **2 046 a 1 455 palabras**
(−29 %), y de ser el 32 % del texto de la app al 24 %.

Lo que se movió de sitio, y por qué:

- **Guardias y rotación** (544 px) y **Mis rotaciones** (495 px) vuelven a «Turno
  y rotación». La propia tarjeta admitía que era «lo mismo que ves dentro de Mes
  → configurar este mes».
- **El calendario de Google**, que ocupaba **tres tarjetas en dos secciones**
  (1 756 px, 522 palabras), es una sola pantalla de 1 475 px y 292 palabras. De
  paso se arregló un texto caduco: decía que el `.ics` llevaba «solo tres cosas»
  cuando desde el punto 7 exporta seis categorías. Ahora la lista de categorías
  **se cuenta desde el propio `.ics`**, así que no puede volver a desfasarse.
- **«Horarios de cada tipo de día»** (548 px) se cae: eran atajos a Turno. Los
  dos que servían («sus horas», «sus comidas») son ahora dos botones dentro de
  cada tipo de día, donde les toca.
- **«Sueño»** era un segundo editor a medias del mismo asunto —lo decía él
  mismo: «la ventana de la cena sigue en Turno y rotación → 2c»—. Fundido: los
  cuatro números del sueño están juntos, en Turno.
- **Copias de seguridad** baja de Ajustes a Datos, con el resto del guardado.

## 7. Los eventos, con cuánto duran

Un evento solo tenía hora de empezar. Consecuencias medidas:

- en el `.ics` **todos duraban 60 minutos** (`dur:60` fijo), así que una
  presentación de dos horas y media te reservaba una hora en el calendario;
- en la franja del día era **un punto**, durase lo que durase;
- en Mes, Semana y las listas solo se leía la hora de empezar.

Ahora un evento tiene `fin`, con atajos para no teclear en el móvil (`1 h`,
`2 h 30`, `toda la mañana`, `todo el día`). El `.ics` reserva el hueco de
verdad, la franja lo pinta como una banda y las listas dicen «08:30 – 11:00 ·
2 h 30». Si la hora de fin es anterior a la de empezar, se entiende que cruza la
medianoche — la misma regla que ya usaba la jornada de trabajo.

**Y la compra ahora mide 3 468 px (3,8 pantallas)**: es larga porque está
completa. Antes era más corta porque le faltaban cosas.

---

## 6. Lo que está bien y conviene no romper

- **Todo funciona sin red.** El sol se calcula en el móvil, el catálogo de
  alimentos es local, la nutrición no llama a ningún servicio. En una guardia sin
  cobertura la app entera sigue funcionando.
- **Cero errores de JavaScript** en las 29 pantallas, incluidas todas con el
  almacén vacío: cada pantalla vacía dice qué hacer en vez de quedarse en blanco.
- **La cadena de Comer** (menú → cocina → compra) es el patrón que le falta al
  resto de la app: enseñar que una cosa manda en la otra, con sus cifras.
- **Las pruebas.** 240 en total, y la costumbre de validar cada una revirtiendo
  el arreglo. Es lo que ha ido cazando los fallos de verdad (el arco del sol, el
  desborde del menú, el cuelgue del service worker).
