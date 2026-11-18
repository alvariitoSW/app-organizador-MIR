# Encargo · «Que la app me estudie y me monte la semana» (pedido por el usuario el 18/11/2026)

El usuario: «la app está estancada». Diagnóstico de la sesión del 18/11: no faltan funciones; (1) todo depende de que él
lo apunte y cuando peor va (llega tarde, saliente) no apunta; (2) las piezas no se hablan: ninguna pantalla dice «esta semana,
con estas guardias, tu plan es este». Lo que le duele ahora: se acuesta tarde, se levanta cansado, tarda en salir de casa,
va casi todas las tardes a la asoci, vuelve tarde del Lloret, cena de monchis sin apuntar, y **aún no ha conseguido ni un
prototipo de menú semanal**.

## Decidido por el usuario (18/11)
1. **Orden: primero La Semana**, después Los sensores, después El Espejo.
2. **Sí a instalar un APK a mano** y dar «acceso al uso» y ubicación «siempre». Condición: «hay que hacerlo muy bien y que
   funcione perfectamente, que ya lo intentamos una vez y salió regular».
3. **Avisos: «todo lo necesario para cumplir los objetivos que me ponga»**: avisar en el momento, no solo el repaso. Los
   objetivos los pone él (hora de cama, tardes de asoci, hora de vuelta del Lloret, días sin fumar).

## Pieza 1 · La Semana (va primero; no necesita permisos)
- Al cambiar el cuadrante (o el domingo), **un plan único** hecho con las guardias y salientes de esa semana: hora de cama y de
  pie de cada día, entreno, **menú ya montado** con su compra, cuántas tardes de asoci y hasta qué hora el Lloret. Él solo
  cambia lo que no le cuadre.
- **Antes de la maqueta, estudiar por qué lo que hay no le ha servido** (~0,3 M): `menuAutoDia`/`menuAutoSemana`/
  `aplicarMenuAuto` (app.js ~2496-2545), `renderMiSemana` (~13201), `renderSemanaSimple` (~14110), «Tu semana» de Las Mañanas,
  `nocheSemanaDatos` (~6288). Conducir la app sembrada con una semana de guardias y ver qué menú sale y cuántos toques pide.
  Preguntarle a él (máx. 3 preguntas) qué intentó y dónde se quedó.
- **Maqueta primero** (skill `redisena-seccion`), la elige él. Reutilizar lo que ya calcula la app; no escribir otro motor.
- Asunto para Consejo (`/bitacora`): cambia lo que ve y pasa de 2 M.

## Contestado por el usuario (18/11, tras la maqueta `maquetas/la-semana.html`)
- **Maqueta: ninguna de las tres tal cual.** Dijo: «Habría que rehacer Hoy entero para hacer una buena maqueta». O sea: La Semana no
  se cuelga de Hoy como una tarjeta más; **el siguiente paso es una maqueta de Hoy rehecho entero con La Semana dentro** (skill
  `redisena-seccion`: medir Hoy a 412×915 antes; maquetas primero; esperar su visto bueno). Sin tocar `app.js` hasta entonces.
- **Asoci: solo un contador** («este mes: X de 3»), sin días fijos ni escalones. **Tras el PIN del 4:20** (con la cortina, palabras discretas).
- **Presupuesto:** «los millones que sean necesarios para hacerlo bien de una vez y sin divergir». Aprobado sin tope fijo para La Semana;
  a cambio, no abrir frentes nuevos ni salirse del encargo, y comparecer si una pieza se pasa un 25 %.
- **Sin contestar:** si se retiran «✨ Móntamela» y «✨ Montar la semana sola» cuando esté (preguntárselo con la maqueta de Hoy).
- Antes: cama = la necesaria para ≥8 h (se calcula); Lloret sin hora propia (sale de la cama); con el menú «no encontré por dónde» y «me cansé a mitad».

## Maqueta de Hoy rehecho (18/11, segunda sesión) · `maquetas/hoy-rehecho.html` · ESPERA SU VISTO BUENO
- Él contestó: «Deberías hacer tú la reforma y ver qué es lo mejor para conservar, actualizar, fusionar»; «Hoy tiene ya muchísimas
  cosas, me gustaría hacer esa parte minimalista para no abrumarme»; **retirar los dos botones: sí**.
- Medido antes (verificador, 412×915, modo Conductor): mañana 3.034 px (3,3 pantallas), noche 2.754, saliente 2.768. «Ahora» sale
  3 veces, el sueño 3, la lista del día 3; el bus (`hoyBusHTML`) mide ~1.075 px. No hay tarjeta de entreno ni nombre de los platos.
- La maqueta (6 marcos, todos caben en 915 con 134-388 px libres): tira de 7 días → «Ahora» (frase + un paso con hora) → Dormir ·
  Moverse · Comer → compra → «Más de hoy». Tocar otro día enseña su plan en la misma pantalla. «Comer» abre una hoja con los platos,
  «Cambiar» y «Volver a montar el menú de la semana» (el único camino). Asoci: «Tardes fuera · este mes: 1 de 3» dentro de «Más de
  hoy», solo con el 4:20 abierto con PIN.
- Cambio respecto al Consejo: La Semana no es una vista aparte (`ui.hoyVista='semana'`) con tarjeta de entrada: **es la tira de Hoy**.
  S5 pasa a ser «rehacer `renderHoy`» y crece; rehacer la ficha y el reparto con su visto bueno.
- Ojo al construir: hoy `nocheCadena` con Lloret da cama 00:30 (menos de 8 h); la maqueta enseña lo decidido (la salida del Lloret
  sale de la cama: 22:40 → en casa 22:25 → vete 21:50). Es un cambio de cálculo, no solo de pantalla.

## Pieza 2 · Los sensores (reabre «El Lanzador», K2-K4 aparcados el 03/11)
- Qué pide: horas de móvil; último apagado y primer encendido de pantalla (hora real de dormir y despertar); la próxima
  alarma; dónde está (casa, gym, Lloret, asoci) con entrada y salida; avisos en el momento.
- **Ojo: el diseño aprobado el 01/11 no llega.** Era una lanzadora sin INTERNET que lee el uso al abrir y lo pasa a la web
  en `#uso=…` (K1, en `main` 09c5151). Eso solo trae datos cuando él abre la app desde la lanzadora: no vale para la
  ubicación en segundo plano ni para avisar a la hora. Hace falta decidir de nuevo: lanzadora con servicio propio (geocercas,
  alarma, avisos nativos) que guarda en el móvil y entrega al abrir, frente a envolver la web (TWA/Capacitor). Acta
  `consejo/2026-11-01.md`.
- **Primero un estudio** (tipo `estudio`): qué salió regular la otra vez (preguntárselo: instalación, HyperOS matando la app,
  Brave, datos que no llegaban…), qué permite HyperOS en segundo plano y batería, y un plan de prueba en su móvil paso a paso.
  No construir nada hasta tener eso y su visto bueno.
- Privacidad: ubicación y uso **solo en el móvil**; `/revisa-seguridad` obligatoria (entra dato no fiable por el enlace).

## Pieza 3 · El Espejo
- Repaso semanal que cruza: tarde de asoci → hora de llegada → cena de monchis sin apuntar → hora de cama → lo que tarda en
  salir de casa. Depende de la pieza 2 para no pedirle que apunte.
- Plan anti-porro: CBD + melatonina unos días hasta una semana sin fumar. Las primeras noches sin fumar se duerme peor: que
  la app cuente con ello y no lo marque como fracaso. Vive dentro del 4:20 (cortina con PIN, G10).

## Siguiente paso
**Maqueta `maquetas/hoy-rehecho.html` APROBADA tal cual por el usuario (18/11, tercera sesión)**, con: el bus a «Más de hoy» y fuera
Estación, Reloj y Línea; un solo botón «He salido». Ficha: `fichas/la-semana.md` (8 pasos, ~4,8 M en 3 sesiones). Siguiente: sesión
nueva → `/plan-socialista` → construir P1-P3 (S1 `planSemana` y el cambio de `nocheCadena`, S3 dato de asoci). Después P4-P5 (S2) y
P6-P8 (S5 = rehacer Hoy y poner al día sus pruebas). El Consejo del 18/11 ya está hecho; no repetirlo.
