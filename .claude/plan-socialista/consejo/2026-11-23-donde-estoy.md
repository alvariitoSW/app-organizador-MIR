# Consejo de Ministros · 23/11/2026 · «Dónde estoy»

## Orden del día
1. Que el Lanzador vigile en segundo plano la entrada y salida de 3 sitios (hospital, asoci, Lloret): ¿se puede en su Xiaomi (HyperOS, Android 14-15, fuera de la tienda)?
2. Cómo se guardan los sitios, radio y cómo llegan las visitas a la web.
3. Privacidad: la asoci, solo en clave dentro de Schumacher.
4. Qué ve en Hoy, dónde van las horas y la pregunta del calendario.

## El mapa (Explore, sonnet)
- Hash: `usoEntrante` (app.js ~30534) solo acepta `#uso=` con `{v:1,d:[1..14]}`, tope 12000; `accionLee`. Guarda en `store.uso[f]` pisando el día entero.
- Sitios con lat/lon solo para el sol (`addSitio`, `sitio-gps` rellena inputs). Sin geovallas.
- Schumacher: `store.consumo`, PIN con sal+SHA-256, NO cifra; `cnTapado`/`cnOculta` esconden fuera.
- Lloret: rutina nocturna (`lloretCfg`, `lloretAuto`, `nocheHTML`); botón 🌿 en `.hoycab`.
- Calendario: `store.rotation.daySet`, `setDayOverride`; tarjetas con botones en `asistHoyHTML`.
- Android: `MainActivity` (lee uso y abre Brave), `Uso.java` (pura, `UsoTest`), `Atajos.java`; único permiso PACKAGE_USAGE_STATS; el workflow solo vigila INTERNET.

## Asunto 1 · ¿Se puede en HyperOS?
| Ministerio | Dictamen | Voto |
|---|---|---|
| Interior | Ubicación precisa y notificaciones son permisos normales de pedir; «Permitir todo el tiempo» solo desde Ajustes y es lo más probable que HyperOS tape; servicio en primer plano tipo `location` (permisos normales) que arranca tras reiniciar solo si tiene «todo el tiempo». Ajustes de Xiaomi a mano: batería «Sin restricciones», «Inicio automático», candado en Recientes, y «Permitir ajustes restringidos» si sale. | Sí, condicionado a probarlo en el móvil antes de la web |
| Justicia | Ningún permiso nuevo cae en la lista de «ajustes restringidos» de Android puro, pero HyperOS ya tapó uno que no estaba: no se da nada por bueno sin verlo en el móvil. | Sí |
**Acuerdo:** servicio propio en primer plano con el proveedor de RED (+PASIVO) cada 5 min y geovalla propia (radio, histéresis ×1,5, 2 lecturas seguidas, descarta precisión >300 m). Descartado `addProximityAlert` (obsoleto, se pierde al reiniciar, opaco). Sin Play Services y sin INTERNET (la ubicación por red la resuelve el sistema, no la app: se le dice). Batería estimada 1-3 %/día (sin medir). El servicio anota su última lectura para distinguir «no fui» de «estaba muerto».
**Recomendación al gobierno central (aceptada):** por tandas; primero el Lanzador solo, con su propia pantalla de «último registro».

## Asunto 2 · Sitios, radio, enlace
- Interior + Trabajo: guardar «estando allí» con un botón en el Lanzador (3 lecturas, se queda la mejor). Radio 150 m por defecto (100/150/250 a elegir). Descartado `intent://` desde la web (exportaría otra pantalla a cualquier página).
- Enlace: las visitas NO van en `store.uso` (se pisaría el día) ni en un `&donde=` suelto (rompe el JSON de uso): van como campo nuevo dentro del mismo JSON (la web vieja lo ignora) y la web las guarda en una clave propia. Tanda 2.
**Acuerdo** (técnico, lo aprueba el Consejo).

## Asunto 3 · Privacidad
- Justicia: el Lanzador solo conoce nombres neutros «Sitio 1/2/3»; notificación fija neutra («Lanzador activo»), secreta en la pantalla de bloqueo; el historial de Brave puede guardar el enlace con `#uso=…`. Lista cerrada de permisos y búsqueda de «hospital|asoci|lloret|schumacher» en `android/` dentro del workflow.
**Recomendación (aceptada por el usuario):** las visitas de la asoci viajan **cifradas** (AES-GCM, clave que escribe una vez en el Lanzador y otra en Schumacher) · Tanda 2.

## Asunto 4 · Lo que ve
- Trabajo + Bienestar: horas en una línea de «Este mes» (Mes), desplegable por días, editables (✎ gana a lo detectado); visitas <10 min fuera, huecos <20 min se juntan. Pregunta del calendario como tarjeta de `asistHoyHTML`, una vez al día, nunca sin preguntar.
**Recomendación (aceptada): maqueta A · solo un chip** en `.hoycab` («🏥 desde 08:02», «🌿 desde 20:14» que enciende el modo Lloret). La asoci, nada fuera de Schumacher.

## Lo que entra en el plan
- `[v3-donde-estoy]` T1 Lanzador vigila (~1,5 M, esta sesión) · T2 web: enlace cifrado, horas, chip, Schumacher, calendario (~2,5 M, sesión nueva, tras probar T1 en el móvil).

## Lo que espera al usuario
- Instalar T1, dar permisos y comprobar 1-2 días que registra. Si «Permitir todo el tiempo» no se puede, se para.

## Gasto de la reunión
Medido al cerrar la tanda (`node tools/gasto.mjs`).
