---
name: ficha-de-tarea
description: Escribir la ficha de una tarea del plan 3.0 antes de construirla: qué se quiere y cómo se sabe que está bien, las dudas para el usuario (como mucho 3), y la lista de pasos con archivo y función exactos, quién los hace (qué ayudante y qué modelo) y su presupuesto. Úsala al empezar una tarea de tipo `construir` o `maqueta` del plan (`.claude/plan-socialista/plan-v3.md`), cuando el usuario diga «haz la ficha», «planifica la tarea», «qué hay que hacer exactamente», o cuando una tarea vaya a repartirse entre varios ayudantes. NO para arreglos de una línea ni para el parte.
---

# Ficha de tarea: pensar una vez, construir barato

Idea tomada de [spec-kit](https://github.com/github/spec-kit) (MIT, de GitHub): especificar → aclarar → planear →
tareas → comprobar que todo cuadra → construir. Aquí, recortado a una sola ficha corta en español, porque lo caro
de una tarea es **descubrir** (leer `app.js`, 27.000 líneas) y si eso queda escrito, quien construye no lo repite.

La ficha vive en `.claude/plan-socialista/fichas/<id>.md` (el id del plan, p. ej. `v3-cantidades.md`) y **no pasa
de 80 líneas**.

## Las cinco partes

1. **Qué y para qué** (del usuario, sin código). Historias cortas con su prueba de que está bien, en el formato
   *Dado … cuando … entonces …* (spec-kit «acceptance scenarios»). Ordenadas por importancia: la primera sola ya
   tiene que valer (lo mínimo que se puede desplegar).
2. **Dudas `[ACLARAR]`**, como mucho **3**, cada una con 2–4 opciones concretas y la que recomiendas (spec-kit
   «clarify»). Se le preguntan **todas juntas** al usuario (skill `tarea-a-fondo`) y la respuesta se escribe en la
   ficha. Lo que tenga un valor razonable por defecto no es duda: va a «Supuestos».
3. **Dónde se toca** (lo descubierto): funciones y líneas de `app.js` (`grep -n`), CSS, pruebas parecidas que ya
   existen en `tests/regression.test.js` y maqueta aprobada si la hay. Es lo que ahorra releer.
4. **Pasos** (spec-kit «tasks»), uno por línea:
   `- [ ] P1 [P] <qué> · <archivo:función> · <ayudante y modelo> · ~N pasos`
   - `[P]` = se puede hacer a la vez que otro (archivos distintos, sin depender uno de otro).
   - Primero la prueba encadenada que debe fallar (skill `prueba-de-secuencia`), luego el cambio.
   - Ayudante: sin ayudante si es una línea ya localizada; `general-purpose` en **sonnet** para construir con la
     ficha delante; `verificador` para capturas y suite; `Explore` en **haiku** para buscar. Opus solo para decidir
     o diseñar algo nuevo.
   - El tope de pasos sale de `gastos.md` («Presupuestos vigentes»).
5. **Comprobación antes de construir** (spec-kit «analyze»): cada historia tiene al menos un paso y una prueba;
   ningún paso sin historia; ninguna `[ACLARAR]` abierta; nada contradice `CLAUDE.md` (maqueta antes si cambia lo
   que se ve, prueba que cae al revertir, 412×915). Si algo falla, se corrige la ficha, no el código.

## Cómo se usa

- **Al empezar la tarea:** escribir la ficha (o leerla si ya está), resolver las dudas con el usuario y decirle el
  presupuesto total. Commit de la ficha en la rama.
- **Al encargar a un ayudante:** pasarle **la ruta de la ficha y el número de paso**, no la conversación. Su
  encargo: «Lee `.claude/plan-socialista/fichas/<id>.md`, haz P3. Para en ~N pasos y entrega lo hecho y lo que
  falte.»
- **Al ir terminando:** tachar los pasos (`- [x]`). Si la tarea se queda a medias, la ficha es el traspaso.
- **Al cerrar:** medir el gasto (skill `plan-socialista`, «Gastos») y apuntar en la ficha lo que costó frente a lo
  previsto.

## Límites

- No sustituye a las maquetas (`redisena-seccion`) ni a `docs/DECISIONS.md`: la ficha es la lista de trabajo; la
  decisión de diseño y sus supuestos siguen yendo a DECISIONS.
- No se instala la herramienta `specify` ni sus plantillas (unas 3.000 líneas en inglés que se leerían en cada
  tarea): solo se usa esta forma de trabajar.
