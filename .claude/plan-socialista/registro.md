# Registro del plan socialista

Lo ya contado (para no repetirlo) y lo abierto (hasta que se cierre). Lo escribe Claude en el paso 8;
tú puedes añadir o tachar a mano.

## Encargos aparcados

Del repaso de supuestos del 2026-10-14 (respuestas del usuario). Orden elegido: **tanda 1, lo rápido
primero; tanda 2, lo visual con maquetas primero**.

### Tanda 1 · reglas y arreglos rápidos — HECHA (desplegada el 2026-10-14)

Vacaciones a mano + días gastados, horas de servicio solo de trabajo, todos los eventos en el Mes, carretera
del mes natural, otro día a la hora de levantarte, noche hasta levantarte, un toque en días pasados, bus con
hora real, taxi con su precio, tiempos de la mañana en Ajustes, cafés, siesta del saliente a mano y platos sin
pasos inventados. Ver docs/DECISIONS.md («Repaso de supuestos, tanda 1»).

### Tanda 2 · lo visual — HECHA (desplegada el 2026-10-14)

Ciudad «Trabajo» con entrada y salida hacia el pueblo o el parque, Lloretazo de ida y vuelta, comer en la
cabina, habitaciones de casa al mirar a los lados y más sitio en el quiosco y el poste. Ver docs/DECISIONS.md
(«Repaso de supuestos, tanda 2»).

### Rediseño artístico (en marcha desde el 2026-10-14)

- [enc-arte] Llevar el aspecto visual de la app a otro nivel con varios agentes: fase 0 auditoría (5 agentes) →
  fase 1 dirección de arte (estilo: «sorpréndeme») → fase 2 maquetas por sección (+ /anatomy) → fase 3 construir,
  empezando por **lo común de toda la app**. Iconos: «algo con vida propia, sorpréndeme».
  · F0 y F1 hechas (2026-10-14): dirección «La jornada» con visto bueno; barra abajo, guardia 65 % rojo, claros
    suavizados. Tandas 1 (cielo de la hora y barra abajo) y 2 (las piezas, 44 px) de lo común: desplegadas
    (0f2765e, 2026-10-17). Siguen por hacer:
  · [aparc-arte-energia] tanda 3 de lo común: el cálculo de la energía del día (que se gasta y se recarga, ver
    design/arte/continuidad.md).
  · [aparc-arte-iconos] tanda 4 de lo común: los iconos con vida propia (design/arte/direccion/iconos).
- [enc-continuidad] **Continuidad** como filosofía del arte: el tiempo pasa, la energía se gasta y se recarga, lo que
  haces deja huella; un solo hilo de tiempo sin cortes a medianoche. Ver design/arte/continuidad.md · 2026-10-14

- [aparc-comida-entreno] Los días de entreno a las 18:30 la comida sale a las 18:00 (ventana fija de Sueño): falta
  decidir si debe ir después del entreno · DECISIONS.md:948 · desde 2026-10-15
- ~~[aparc-aviso-mes]~~ HECHO 2026-10-19 (prueba 322) · El aviso «Mantén pulsado un día…» del Mes se queda unos segundos tapando Hoy o Comer · Plan si
  cambias de pantalla justo al abrir (lo vio la revisión de salud del 2026-10-19; se va solo a los ~9 s)
- [aparc-png-design] `design/` pesa 74 MB en PNG de maquetas: comprimirlos (no afecta a la app, solo al repositorio)
- [enc-plan-comidas] Montar la semana de comidas: ideas de contenido y diseño dadas el 2026-10-17 (días pasados,
  2 platos repetidos, desayuno vacío, sin cambiar casillas, cuándo cocinas, 4 formas de llenar la semana). Maquetas de 3
  direcciones en design/comer-plan/; el usuario pidió combinarlas → design/comer-plan/combinada.png, aprobada y construida
  (Plan · Días · Nevera · Compra, Montar en dos pasos, fijar con 📌): desplegada 2026-10-19. Arreglos sueltos y el aviso del
  Mes en Comer: hechos y desplegados (5ec269c).

- [enc-nutricionista] Nutricionista integral (2026-10-17): compensar picos repartiendo en 2–3 días con techo diario;
  días de Lloret cena saciante lista antes + kit de vuelta; chocolate con tope semanal y alternativas; la semana siempre
  visible arriba en Comer → Hoy e informe del domingo (bien · falta · a cambiar, metas, semana a semana). Maquetas en
  design/nutricionista/ aprobadas y construidas: desplegado en main (aaa1805). Bebidas en ml: hecho y desplegado.

### Versión 3.0 (lo que pediste el 2026-10-19)

Cada uno, maquetas primero y una sesión por tarea. **Primero, elegido el 2026-10-19: v3-mes-colores + v3-sin-semana.**

- ~~[v3-mes-colores]~~ HECHO y desplegado 2026-10-19 (main 4c09f09, variante B suaves) · **Mes:** el día entero pintado por tipo, no solo la raya: guardia rojo entero con 🚨 y el número
  grande en negro; saliente oscuro; libre verde claro; trabajo marrón; entreno azul. Los eventos, más visibles en el
  Mes. Y el selector de fecha en español (sale «October 2026» y pegado al icono, lo vio la revisión de salud)
- ~~[v3-sin-semana]~~ HECHO 2026-10-19 (también Isométrica y Carretera del Mes; «Mi rutina» a Ajustes) · **Quitar la vista Semana** del Calendario entera: no la usas
- ~~[v3-conductor]~~ HECHO y desplegado 2026-10-20 (main e1aaeda, run 39453952330; A + B con cartel verde, porqué y «¿Qué estoy viendo?») · **Hoy / el conductor:** más arte y que explique lo que se ve (eventos, qué toca y por qué), con una
  descripción más grande, no solo «se ve el autobús»
- ~~[fallo-mes-pasado]~~ ARREGLADO y desplegado 2026-10-20 (main e1aaeda) · El Mes en curso no enseñaba del 1 al 18 (no podías ver las guardias de octubre para secretaría): botón «▲ Ver del 1 al N» y lista de guardias al tocar el abono · DECISIONS «Mes: lo ya pasado del mes en el que estás»
- ~~[fallo-modo-ordenador]~~ ARREGLADO y desplegado 2026-10-20 (main bfa711c, run 39489124341) · Con «Sitio de escritorio» en Brave la app se veía a 980 px y sin forma de quitarlo: ahora se amplía y usa las reglas de móvil · DECISIONS «El móvil en modo ordenador»
- ~~[mes-frontera]~~ HECHO y desplegado 2026-10-20 (main 008fd0d) · Línea amarilla en escalera entre meses en el Mes
- [aparc-suite-2min] La suite ya va en ~5 min (3 trozos a la vez, 2026-10-20). Para bajar a ~2: que las 201 primeras pruebas de regression preparen sus propios datos (jornada 8–15, tipos de guardia, platos, menú, despensa) y así poder partirlas; luego, acortar esperas fijas que no sean de lectura en vivo · DECISIONS «La suite en 5 minutos»
- [aparc-auditoria-contexto] Gastar menos contexto: borrar las ~196 tareas ya hechas de la lista (se reenvía entera cada pocos pasos) y, si quieres, desactivar Google Drive y Claude Docs si no los usas. Headroom descartado (no aplica a sesiones en la nube y pasa todo por un tercero). Pedido el 2026-10-20
- [v3-cantidades] **Comer · apuntar:** cantidades con pasos (5, 20, 50), rueda o mantener pulsado para que corra el
  número, y cada cosa en su unidad (g, ml, mg: la leche en ml)
- [v3-comer-perdido] **Comer:** funciona pero está «muy perdido»: ordenar para que se encuentre cada función
- [v3-boceto-semana] **Plan de comidas:** montar una semana a mano como **boceto** (poner, cambiar, quitar platos),
  guardarla y que el asistente de la semana ayude sobre ese boceto
- [v3-entrenador] (la parte de volver tras un parón ya está: v3-plan-vuelta) **Entreno, otra vuelta entera:** como una app de entrenador propio basada en ciencia. Ejemplo: si
  llevas 2 meses sin entrenar, que sobre tu rutina te diga «baja un X %» y te suba poco a poco hasta volver (hoy no
  existe nada de vuelta tras un parón)
- [v3-dinero-compras] **Dinero:** planear compras de los próximos meses (cosas que quizá compres), decidir qué sí y
  qué no, y cuánto puedes apartar cada mes para ellas; «una app dentro de la app». Hoy hay deseos dentro de cada
  hucha, pero no un plan de compras
- [v3-gmail] **«La función de Gmail»:** sin aclarar qué es (¿la de Google Calendar?) · pendiente de que lo digas
- ~~[v3-plan-vuelta]~~ HECHO y desplegado 2026-10-20 (main 28e97b3, run 39378000493; 2ac63d3, suite 720/720) · **Entreno · plan para volver a tu rutina** (va con v3-entrenador): tienes una rutina pero ahora no
  puedes hacerla tras un parón; la app te monta el camino («tantos días a la semana, tantas semanas, así») con
  seguimiento y continuidad, como un entrenador, no un menú de opciones
- [v3-coach] **La app como entrenador de tu persona:** descansar, comer bien, verdura y fruta, entreno; que te guíe
  y lo note, en vez de tener funciones sueltas. Y que cuente el día de Lloret, que también cambia las cosas
- [v3-420-descanso] **4:20 que ayude a bajar:** que relacione lo que fumas con el descanso y la energía de la mañana
  («aunque duermas bien, puede que no descanses») y te ayude a reducir
- [v3-420-clave] **4:20 con contraseña:** algo de esa parte con clave para entrar, que se puede cambiar desde dentro
  · aclarado 2026-10-19: **solo la parte 4:20** pide la clave al entrar; se cambia desde dentro
- [v3-antojos] **Antojo de chocolate:** que tenga en cuenta lo que ya cenaste y te proponga alternativas saciantes y
  proteicas hechas en casa solo con microondas, con pocas calorías pero buenas. Hoy hay un tope semanal de chocolate
  con un «kit para cambiarlo» del nutricionista: ampliarlo con recetas de verdad

### A futuro (sin fecha)

- [enc-bienestar-digital] Leer el **uso real de pantalla** (Bienestar digital del móvil) para hábitos y pantallas, y un hábito **«sin pantallas» fijo**, que no se pueda quitar desde la app (solo pidiéndoselo a Claude Code) · sup. 22
- [aparc-parte-diario] Programar el parte para que salga solo cada mañana (falta decidir la hora) · desde 2026-10-14

## Para recordarte

<!-- - [rec-AAAA-MM-DD-tema] lo que pediste que te recordara · AAAA-MM-DD (lo escribe /bitacora) -->

## Supuestos sin confirmar
- [sup-2026-10-19-mes-colores] Mes: saliente gris oscuro con número blanco, vacaciones en arena, el día de trabajo con entreno va marrón con chapa azul, el color de cada evento en el borde de su chapa, y las «Reglas de oro» (solo se editaban en Semana) quedan guardadas pero sin editar · DECISIONS «El Mes con el día entero de su color» · contado el 2026-10-19
- [sup-2026-10-20-conductor] conductor: el cartel verde solo para eventos (no comidas, entreno ni turnos), el subtítulo nombra lo siguiente si falta ≤ 3 h, «¿Qué estoy viendo?» plegado, narrador solo en el Conductor (no en la Estación) · DECISIONS «Hoy: el conductor que cuenta lo que ves» · contado el 2026-10-20
- [sup-2026-10-20-mes-pasado] Mes: el botón «Ver del 1 al N» se recuerda mientras la app está abierta (al abrirla empieza en la semana de hoy); «hecha» = guardia de un día anterior a hoy; la lista de guardias sale en la hoja del abono de cualquier mes · DECISIONS «Mes: lo ya pasado…» · contado el 2026-10-20
- [sup-2026-10-20-ordenador] modo ordenador: solo se corrige en pantallas táctiles de 600 px o menos con la ventana un 30 % más ancha; tabletas y PC no se tocan · DECISIONS «El móvil en modo ordenador» · contado el 2026-10-20
- [sup-2026-10-20-frontera] Mes: la frontera entre meses es amarilla de 4 px y sale en todos los meses · DECISIONS «Mes: la frontera entre meses» · contado el 2026-10-20
- [sup-2026-10-20-plan-vuelta] plan de vuelta: el peso de antes es el más alto de trabajo del último día de ese ejercicio; de la semana 2 en adelante, tu mínimo semanal de Entreno (o 3 días); «duro» = esfuerzo 8 o más · DECISIONS.md:1174 · contado el 2026-10-20

<!-- - [sup-AAAA-MM-DD-tema] el supuesto · DECISIONS.md:línea · contado el AAAA-MM-DD -->
- [sup-2026-10-14-quita-urg] las 4 guardias que te quitas salen de Urgencias · DECISIONS.md (guardias R1) · contado el 2026-10-14
- [sup-2026-10-14-guardia-hoy] una guardia de hoy cuenta como «puesta» hasta mañana · DECISIONS.md (guardias R1) · contado el 2026-10-14
- [sup-2026-10-14-sin-vac] ya no se resta una guardia por semana de vacaciones · DECISIONS.md (guardias R1) · contado el 2026-10-14
- [sup-2026-10-14-t1t2] 6 más de las tandas 1 y 2 (cafés, café de otro día, siesta de guardia, Lloretazo 0,6 h, cartel azul, «+N más») · DECISIONS.md · contado el 2026-10-14 (solo el número)
- [sup-2026-10-17-nutri] nutricionista: pico = más de 300 kcal o del 15 % sobre el objetivo, se compensa en 3 días (máx. 300/día), suelo 80 % (mín. 1.500), chocolate tope 2/semana, cena del Lloret 380–700 kcal y ≥22 g, «solo café» < 150 kcal · DECISIONS «Tu nutricionista, más presente» · contado el 2026-10-17
- [sup-2026-10-19-plan] Plan: cocinas una hora después de salir (o a mediodía si libras), ollas de 2–6 raciones, los días de entreno valen para cocinar si no hay otros, se quitó «la semana con tus platos» · DECISIONS «El Plan, las tres en una» · contado el 2026-10-19
- [sup-2026-10-19-auditoria] limpieza: una clase CSS está viva si su nombre aparece en app.js/index/sw/fig; las compuestas al vuelo ('t-', 'ev') se quedan; lo de dentro de :is()/:not() no se toca · DECISIONS «Lo mínimo primero» · contado el 2026-10-19
- [sup-2026-10-19-pruebas] pruebas en corto: no para en el primer banco que falla y guarda el registro en .claude/.ultima-suite.log · contado el 2026-10-19

## Cerrados

- 2026-10-14 · **Valen:** 1 (R1: semana = 5 laborables), 9 (cabina de guardia también de día), 10 (manda lo que acaba más tarde), 13 (sin hora no es parada), 15 (taxi solo por la mañana), 26–30 (internos)
- 2026-10-14 · **No valen → encargos de arriba:** 2, 3, 4, 5, 6, 7, 8, 11, 12, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25

## Contado

<!-- - [id] AAAA-MM-DD · qué se dijo · estado en ese momento -->
- [run-38605035020] 2026-10-14 · último despliegue de main (cfac5e9) · success
- [sello-2227c57] 2026-10-14 · main sellado, nada sin sellar · ok
- [rama-cfac5e9] 2026-10-14 · main y rama iguales · ok
- [issues-0] 2026-10-14 · ningún issue ni PR abierto · ok
- [aparc-parte-diario] 2026-10-14 · recordado: falta la hora · abierto
- [tanda1-repaso] 2026-10-14 · tanda 1 del repaso desplegada (724/724 pruebas) · hecha
- [tanda2-repaso] 2026-10-14 · tanda 2 del repaso (el conductor) desplegada · hecha
- [run-38642732419] 2026-10-14 · despliegue de main (adca9d1, guardias de R1) · success
- [run-38709963353] 2026-10-17 · despliegue de main (0f2765e: «La jornada» tandas 1–2, R1 con el mes en curso) · success
- [rama-0f2765e] 2026-10-17 · main y rama iguales, sellado · ok
- [run-39032390614] 2026-10-17 · despliegue de main (aaa1805, tu nutricionista) · success
- [run-39275746140] 2026-10-19 · despliegue de main (acd3948, el Plan, las tres en una) · success
- [enc-ponytail] 2026-10-19 · «Lo mínimo primero» en CLAUDE.md + auditoría: 7 funciones, 4 acciones, 2 copias y 404 reglas CSS fuera (main 84e7253) · hecha
- [rama-b9adda8] 2026-10-19 · rama un commit por delante de main (solo el traspaso, sin código); main 84e7253 desplegado y sellado (run 39318216522 success) · ok
- [enc-v3] 2026-10-19 · el usuario abre la «versión 3.0»: la parte isométrica (Comer · Plan) da por buena; quiere revisión a fondo (arte, visual, técnico), ampliar funcionalidad, mejorar procesos artísticos y valorar cambiar de tema visual. Propuesto: fase 0 de auditoría + decidir tema con maquetas, y recoger los aparcados (arte-energia, arte-iconos, comida-entreno, aviso-mes, png-design) · propuesto
- [enc-mes-colores] 2026-10-19 · Mes con el día entero de color (B suaves), sin Semana, sin Isométrica ni Carretera del Mes, aviso del Mes arreglado (main 4c09f09, run 39334245811) · hecha
- [run-39334245811] 2026-10-19 · despliegue de main (4c09f09, Mes de colores) · success; sellado (version.json con b05d05e, último código) · ok
- [rama-c993d4e] 2026-10-19 · rama un commit por delante de main (solo el traspaso, sin código); 0 issues/PR; DECISIONS sin líneas nuevas (1153) · ok
- [run-39378000493] 2026-10-20 · despliegue de main (28e97b3, plan de vuelta de Entreno) · success; sellado (version.json con 28d85cb, posterior al último código 2ac63d3) · ok
- [enc-plan-vuelta] 2026-10-20 · Entreno: «Tu vuelta al gimnasio» tras 2+ semanas parado (prueba 323) · hecha y desplegada
- [rama-28e97b3] 2026-10-20 · main y rama iguales; 0 issues/PR; DECISIONS 1176 líneas · ok
