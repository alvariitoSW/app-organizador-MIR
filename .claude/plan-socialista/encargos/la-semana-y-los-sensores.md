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
Sesión nueva: `/plan-socialista` → `/bitacora` convoca el Consejo sobre la pieza 1 con el estudio previo hecho → maqueta.
