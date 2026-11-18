# El Lanzador (la lanzadora de Android)

Una mini-app que, al tocarla, lee el uso del móvil de los últimos días (`UsageStatsManager.queryEvents`, solo al
abrirla: nada en segundo plano) y abre la web en **Brave** con `index.html#uso=…`. El formato está documentado
encima de `usoEntrante()` en `app.js`. **No tiene permiso de internet**: los datos pasan de Android a Brave dentro
del móvil, y el workflow falla si alguna vez aparece ese permiso.

- `Uso.java`: la cuenta (minutos, desbloqueos, cuartos de hora y las 5 apps con más minutos), sin nada de Android.
  El día del primer evento que guarda Android se descarta (puede estar a medias) para no pisar con ceros lo que la
  web ya tiene. Pruebas en `app/src/test`.
- `MainActivity.java`: pide «Acceso al uso» si falta, lee, abre Brave y se cierra.
- Iconos en XML (icono adaptativo): el reloj de `icon.svg` con un «play».
- Compila y firma `.github/workflows/android.yml` (Secrets `LANZADOR_KEYSTORE`, `LANZADOR_PASSWORD`,
  `LANZADOR_ALIAS`). En `main` o lanzado a mano, la APK sale como Release `lanzador-v<n>`.

Probar la cuenta sin el SDK de Android (en el contenedor no se puede bajar):
`javac -cp /opt/gradle-8.14.3/lib/junit-4.13.2.jar -d /tmp/u app/src/main/java/es/guardias/lanzador/Uso.java app/src/test/java/es/guardias/lanzador/UsoTest.java`
y `java -cp /tmp/u:/opt/gradle-8.14.3/lib/junit-4.13.2.jar:/opt/gradle-8.14.3/lib/hamcrest-core-1.3.jar org.junit.runner.JUnitCore es.guardias.lanzador.UsoTest`.

## Widget (K4)
`Atajos.java` es un widget de inicio 2×2 con 4 botones: 😴 Anoche · 💶 + Gasto · 🏋️ Entreno · 🍽️ Comida
(`res/layout/widget_atajos.xml`, `res/xml/widget_atajos_info.xml`; se añade desde el menú de widgets del móvil). Cada botón
lanza `MainActivity` con el extra `accion`; esta (tras pedir/leer el uso, como siempre) lo añade al hash que abre en el
mismo Brave: `#accion=X` (sin uso) o `#uso=<datos>&accion=X`. La web (`accionLee`/`accionEjecuta` en `app.js`) solo acepta
`anoche`, `gasto`, `entreno` y `comida`, borra el hash y abre el gesto que ya existe. El versionCode lo pone el workflow.
