# Guardias · rotación y cocina — cómo se trabaja aquí

App de una sola página para el móvil del usuario (residente R1): calendario de guardias y rotaciones,
comer, entreno, sueño, dinero y hábitos. **Sin build**: `index.html` + `app.js` + `styles.css` + `sw.js`,
y los dibujos en `fig/`. Se publica en GitHub Pages desde `main`. Los datos viven en el móvil
(`localStorage`): nunca salen de él.

## Conversación

- Responde siempre en **español**, claro y sin jerga.
- Al final de cada respuesta, los **«Supuestos»** que hayas hecho sin preguntar.
- Para empezar una sesión: `/plan-socialista` (el parte de lo que pide atención).

## Ramas y despliegue

- Trabaja en `claude/magical-clarke-dlp8mb`. Commit y `git push -u origin claude/magical-clarke-dlp8mb`.
- A `main` solo con la **suite completa en verde** (`npm test`), y antes **`npm run sella`** + commit de
  `version.json` (si no, el móvil no se actualiza; el hook `sella-antes-de-main` lo impide). Después,
  `git push origin HEAD:main` y comprobar que el run de Actions en `main` acaba en `success`.
- El detalle está en la skill `cierra-y-despliega`.
- En los commits no van identificadores de modelo.

## Cómo se construye

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
