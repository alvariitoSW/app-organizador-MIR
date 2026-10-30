# Guardias · rotación y cocina — cómo se trabaja aquí

App de una sola página para el móvil del usuario (residente R1): calendario de guardias y rotaciones,
comer, entreno, sueño, dinero y hábitos. **Sin build**: `index.html` + `app.js` + `styles.css` + `sw.js`,
y los dibujos en `fig/`. Se publica en GitHub Pages desde `main`. Los datos viven en el móvil
(`localStorage`): nunca salen de él.

## Conversación

- Responde siempre en **español**, claro y sin jerga.
- Al final de cada respuesta, los **«Supuestos»** que hayas hecho sin preguntar.
- **Una sesión por tarea.** Cada sesión arrastra todo lo hablado y cada mensaje lo vuelve a leer: una
  sesión larga gasta mucho más. Al terminar una tarea, haz el **traspaso** (paso 7 de `cierra-y-despliega`)
  y dile que la siguiente va en una sesión nueva. Si en la misma sesión pide otra tarea distinta, hazla, pero
  recuérdaselo en una línea.
- **Gastar poco:** las decisiones de la tarea, al abrir la sesión (no a mitad); juntar lo que comparte
  material; capturas siempre por el ayudante `verificador`; lo mecánico (textos, pruebas, la hora del parte)
  vale en un modelo más barato.
- Para empezar una sesión: `/plan-socialista` (el parte de lo que pide atención y lo que quedó del traspaso).
- **El gobierno del repositorio** (`.claude/plan-socialista/gobierno.md`, copiado de fiebres-neutropenias): el
  usuario es el gobierno central; `/bitacora` preside el **Consejo de Ministros** (Interior, Hacienda, Justicia,
  Bienestar y el ministerio del asunto) que estudia y decide antes de construir. Lo que cambia lo que ve, el
  presupuesto total, los datos y pasar a `main` siguen siendo del usuario. Actas en `.claude/plan-socialista/consejo/`.
- **El plan de la 3.0** está en `.claude/plan-socialista/plan-v3.md` (lo cuenta `/bitacora`). **Cada tarea se mide
  al cerrarla** (`node tools/gasto.mjs --apunta …`, en `gastos.md`) para que la siguiente del mismo tipo cueste menos.

## Ramas y despliegue

- Trabaja en `claude/magical-clarke-dlp8mb`. Commit y `git push -u origin claude/magical-clarke-dlp8mb`.
- Las pruebas, en corto: **`npm run test:corto`** (o `tools/pruebas-corto.sh tests/x.test.js`) enseña solo
  lo que falla y un resumen por banco; el registro entero queda en `.claude/.ultima-suite.log`. Mientras
  trabajas, solo las tuyas: `tools/pruebas-corto.sh --solo 274 320` (menos de un minuto frente a ~4 de la completa, que va en 5 trozos a la vez).
- A `main` solo con la **suite completa en verde** (`npm run test:corto`), y antes **`npm run sella`** + commit de
  `version.json` (si no, el móvil no se actualiza; el hook `sella-antes-de-main` lo impide). Después,
  `git push origin HEAD:main` y comprobar que el run de Actions en `main` acaba en `success`.
- El detalle está en la skill `cierra-y-despliega`.
- En los commits no van identificadores de modelo.

## Cómo se construye

- **Lo mínimo primero** (antes de escribir código, en este orden): ¿hace falta de verdad? → ¿ya hay algo en
  `app.js` que lo haga? (búscalo antes de escribir otro) → ¿lo trae el navegador o JavaScript? → ¿basta con
  cambiar una línea? Solo entonces, código nuevo. Sin recortar validación, accesibilidad ni pruebas: lo que
  se ahorra es código repetido o que no hace falta, no cuidado.
- **Rediseños: maquetas primero** y esperar el visto bueno antes de tocar `app.js` (skill `redisena-seccion`).
- **Cada arreglo con su prueba encadenada** (dos gestos o más, conduciendo la interfaz) en
  `tests/regression.test.js`, y comprobar que **cae al revertir el arreglo** y ninguna otra (skill
  `prueba-de-secuencia`).
- **Medir a 412×915** (el móvil del usuario) y mirar las capturas antes de dar algo por bueno (skill `verify`).
- Si se decide algo que cambia lo que ve, preguntar antes con opciones concretas (skill `tarea-a-fondo`).
- **Una entrada en `docs/DECISIONS.md` por tanda**: Elegido · Descartado · Supuestos.
- Ojo: en `app.js` hay **dos switches de acciones** (`act()` para clicks y el del listener de `change`).

## Privacidad

- **Nunca** subir capturas de Fintonic ni fotos del usuario (el hook `sin-capturas` bloquea imágenes fuera
  de `maquetas/` y `design/`).
- Nada de datos personales del usuario en el repositorio ni en servicios externos.
