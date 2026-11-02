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
  Bienestar y el ministerio del asunto) que estudia y decide antes de construir. **Qué aprueba solo y qué le llega
  siempre al usuario** está en una lista cerrada en `gobierno.md` (Consejo del 02/11/2026). El Consejo se reúne solo
  para tandas de ~2 M o más o cuando cambia lo que ve. Actas en `.claude/plan-socialista/consejo/`.
- **El plan de la 3.0** está en `.claude/plan-socialista/plan-v3.md` (lo cuenta `/bitacora`). **Cada tarea se mide
  al cerrarla** (`node tools/gasto.mjs --apunta …`, en `gastos.md`) para que la siguiente del mismo tipo cueste menos.

## Ramas y despliegue

- Trabaja en **la rama que te asigna la sesión** (`git branch --show-current`). Commit y `git push -u origin <esa rama>`.
- Las pruebas, en corto: **`npm run test:corto`** (o `tools/pruebas-corto.sh tests/x.test.js`) enseña solo
  lo que falla y un resumen por banco; el registro entero queda en `.claude/.ultima-suite.log`. Mientras
  trabajas, solo las tuyas: `tools/pruebas-corto.sh --solo 274 320` (menos de un minuto frente a ~4 de la completa, que va en 5 trozos a la vez).
- A `main` solo con la **suite completa en verde** (`npm run test:corto`), y antes **`npm run sella`** + commit de
  `version.json` (si no, el móvil no se actualiza; el hook `sella-antes-de-main` lo impide). Después,
  `git push origin HEAD:main` y comprobar que el run de Actions en `main` acaba en `success`.
- El detalle está en la skill `cierra-y-despliega`.
- En los commits no van identificadores de modelo.

## «Terminado» (a la primera, sin segundas vueltas)

Nada se da por bueno ni se dice «hecho» sin estos 7 puntos (también al final de cada ficha). Los marcados con
**hook** los vigila un hook; el resto, quien dirige la tarea.
1. `git fetch origin main` al empezar y otra vez antes de la suite final; las pruebas nuevas, numeradas detrás de
   las de `main`. **Hook** `main-al-dia`: no deja lanzar la suite completa si `main` va por delante.
2. Mientras trabajas, solo tus pruebas (`--solo`); al final, la **suite completa en verde** una vez. **Hook**
   `sella-antes-de-main`: no deja subir código a `main` sin una suite completa en verde sobre ese mismo código.
3. **Prueba encadenada** que **cae al revertir** el arreglo, y ninguna otra cae. En DECISIONS: «cae con X revertido».
4. **Fecha fija** (`await fijaHoy()`) en toda prueba que mire el día, el mes o la hora. **Hook** `fecha-en-pruebas`.
5. **Capturas a 412×915 por el `verificador`**, con las frases exactas que deben salir escritas en el encargo.
6. Si falla algo **ajeno**: una línea en el traspaso y seguir; no investigarlo más de ~0,2 M.
7. Repasar la ficha: lo que se **añade**, lo que se **quita** y lo que **no se toca**.

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
