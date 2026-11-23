# Ficha · «Dónde estoy» T1: el Lanzador vigila los sitios (23/11/2026)

Acta: `consejo/2026-11-23-donde-estoy.md`. Presupuesto ~1,5 M (construir). Rama `claude/donde-estoy`.
Solo `android/` y `.github/workflows/android.yml`. **No se toca la web** (app.js, index.html…) ni `Uso.java`/`UsoTest.java`.

## Qué se quiere y cómo se sabe que está bien
El Lanzador guarda hasta 3 sitios (nombres NEUTROS «Sitio 1/2/3»; nunca «hospital», «asoci», «Lloret» ni «Schumacher» en
`android/`), los vigila siempre en segundo plano con un servicio en primer plano y apunta las visitas (entrada/salida) en
el propio móvil. Una pantalla «Sitios» enseña: vigilancia activa y hace cuánto fue la última lectura, cada sitio, las
últimas visitas («Sitio 1 · lun 23/11 · 08:02 → 15:10», o «… → dentro») y la lista de permisos con su botón.
Bien = `gradle test` verde (Geovalla con sus casos), la APK compila en el CI, el workflow pasa con la lista cerrada de
permisos, y lo comprueba el usuario en su Xiaomi (fuera de nuestro alcance).

## Pasos
1. `Geovalla.java` (pura, sin `android.*`, como `Uso.java`): `Sitio{n, lat, lon, radio}`, `Visita{sitio, entra, sale}`
   (sale=0: sigue dentro). `lectura(lat, lon, precision, t)`: descarta precisión >300 m; distancia haversine; dentro si
   d ≤ radio; fuera del sitio actual si d > radio×1,5 (histéresis); entrar o salir exige **2 lecturas seguidas**
   coherentes; la hora de entrada/salida es la de la PRIMERA de las dos. Guarda `ultima` (hora de la última lectura
   válida). Tope 300 visitas (se van las más antiguas). `aTexto()`/`deTexto(String)` para guardarlo (línea a línea,
   tolerante: una línea rota se ignora). Si cambian o se borran los sitios estando dentro, se cierra la visita.
2. `GeovallaTest.java` (JUnit 4, estilo `UsoTest`): entra con 2 lecturas; una lectura aislada no cuenta; un salto con
   precisión 800 m se ignora; rebote en el borde (140/160 m con radio 150) no sale; sale tras 2 lecturas a >225 m con la
   hora de la primera; visita que cruza medianoche; texto ida y vuelta (y línea rota); tope de 300.
3. `Vigia.java`: `Service` en primer plano (`foregroundServiceType="location"`, `startForeground` con tipo LOCATION en
   API 29+). `requestLocationUpdates` de NETWORK_PROVIDER (si está) cada 5 min, 0 m, y PASSIVE_PROVIDER; cada lectura →
   Geovalla → guardar en `SharedPreferences` privadas. Sin sitios o sin permiso → `stopSelf`. Notificación: canal de
   importancia BAJA, título «Lanzador activo», sin sitios ni horas, `VISIBILITY_SECRET`, `setOngoing`, al tocarla abre
   `SitiosActivity` (PendingIntent IMMUTABLE). `START_STICKY`.
4. `Arranque.java`: receptor de `BOOT_COMPLETED` y `MY_PACKAGE_REPLACED` → si hay sitios y «todo el tiempo» concedido,
   `startForegroundService(Vigia)`; si no, nada (y sin fallar: try/catch).
5. `SitiosActivity.java` (NO exportada; vistas en código como `MainActivity.pantalla`, mismos colores, desplazable):
   estado; por sitio «Estoy aquí: guardar» (lecturas de GPS y RED hasta 30 s o precisión ≤30 m, se queda la mejor; avisa
   si >80 m), radio que alterna 100/150/250 (por defecto 150) y «Borrar»; últimas 10 visitas; permisos: ubicación
   precisa, «Permitir todo el tiempo» (se pide después de la precisa), notificaciones (API 33+), y «Ajustes de la app»
   (`ACTION_APPLICATION_DETAILS_SETTINGS`) con el texto de lo que hay que tocar en Xiaomi; «Empezar a vigilar»/«Parar».
6. `MainActivity`: si el intent trae la acción `es.guardias.lanzador.SITIOS`, abre `SitiosActivity` y se cierra (antes
   de todo lo del uso). Atajo estático `res/xml/shortcuts.xml` «Sitios» (pulsación larga en el icono) con esa acción.
7. Manifest: + ACCESS_FINE/COARSE/BACKGROUND_LOCATION, FOREGROUND_SERVICE, FOREGROUND_SERVICE_LOCATION,
   POST_NOTIFICATIONS, RECEIVE_BOOT_COMPLETED. Sin INTERNET.
8. Workflow: lista cerrada de permisos (los de arriba + PACKAGE_USAGE_STATS; falla con cualquier otro) y falla si
   `grep -riE 'hospital|asoci|lloret|schumacher' android/` encuentra algo.
9. `android/LEEME.md` y `strings.xml`.

## Lo que se añade · se quita · no se toca
Añade: Geovalla, GeovallaTest, Vigia, Arranque, SitiosActivity, shortcuts.xml, permisos, comprobaciones del workflow.
Quita: «nada en segundo plano» del LEEME (cambia el principio: aprobado por el usuario). No toca: la web, Uso, el widget.
