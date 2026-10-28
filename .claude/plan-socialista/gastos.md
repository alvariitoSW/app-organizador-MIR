# Gastos: lo que cuesta cada tarea

Para que cada tarea cueste un poco menos que la anterior del mismo tipo (idea traída de `fiebres-neutropenias`,
REGLAS §4.7). Lo escribe Claude al cerrar cada tarea con `node tools/gasto.mjs --apunta …` (paso 7 de
`cierra-y-despliega`); lo lee `/plan-socialista` para dar el presupuesto de la siguiente.

**Cómo se mide.** «Equivalente» = entrada ×1 + caché escrita ×1,25 + caché leída ×0,1 + salida ×5, en tokens de
entrada. No mezcla modelos: un token de opus cuesta más que uno de sonnet o haiku, por eso cada fila dice su modelo.
«Pasos» = herramientas usadas. El contenedor es nuevo en cada sesión: **solo se puede medir la sesión en la que
estás**, así que se mide antes de despedirse o se pierde.

**Por qué sube el gasto.** En cada paso se relee todo lo que lleva la conversación: 100 pasos cuestan mucho más
que el doble de 50. Lo que más encarece: sesiones largas con varias tareas, leer archivos enteros (`app.js`),
capturas mirándolas en la conversación principal y la suite completa repetida.

## Presupuestos vigentes (por tipo de tarea)

El presupuesto de la siguiente tarea de un tipo es el **90 % de la última medida** de ese tipo y modelo. Se dice al
empezar la tarea y a cada ayudante en su encargo («para en ~N pasos y entrega lo que tengas»). Si se pasa, el
traspaso explica por qué.

| Tipo | Modelo | Última medida | Presupuesto siguiente | De qué tarea |
|---|---|---|---|---|
| herramientas | opus | 439 k (26 pasos) | ~395 k | v3-plan-global (2026-10-27) |
| arreglo | — | sin medir | — | — |
| maqueta | — | sin medir | — | — |
| construir | — | sin medir | — | — |
| estudio | — | sin medir | — | — |
| parte (/plan-socialista) | — | sin medir | — | — |

## Tareas medidas

| Fecha | Tarea | Tipo | Modelos | Ayudantes | Pasos | Equivalente | Lo que más gastó | Qué encareció · cómo ahorrar |
|---|---|---|---|---|---|---|---|---|
| 2026-10-27 | v3-plan-global | herramientas | opus-5-5 | 0 | 26 | **439 k** | sesión principal (100 %) | leer el otro repositorio y las skills enteras; sin ayudantes |
| 2026-10-28 | v3-plan-global-2 | herramientas | opus-5-5 | 0 | 45 | **1,1 M** | sesión principal (100 %) | spec-kit, plan de Comer, puesta al día y unir ramas; sin ayudantes. Ahorro: no releer skills enteras |
<!-- fin de tareas medidas -->

## Ahorros que funcionan

Una línea por cosa aprendida, con la tarea donde se vio. Se aplican en las siguientes.

- Mandar las capturas y la suite a un ayudante (`verificador`): las imágenes y el registro se quedan en su lado.
- Leer `app.js` por trozos (`grep -n` y `sed -n`), nunca entero.
- Pruebas solo las tuyas mientras trabajas (`tools/pruebas-corto.sh --solo …`); la completa, una vez al final.
- Ayudantes de trabajo mecánico en sonnet o haiku; opus solo para decidir o diseñar algo nuevo.
- Un arreglo de una línea con el sitio ya localizado: sin ayudantes (lanzar uno cuesta más que hacerlo).
- Una ficha por tarea (skill `ficha-de-tarea`, idea de spec-kit): lo descubierto se escribe una vez y el
  constructor recibe la ficha, no la conversación.
- Una ronda de maquetas para una sección entera antes que una por cada función (plan de Comer, 2026-10-27).
- Abrir en sonnet las sesiones mecánicas (arreglos localizados, construir con ficha y maqueta aprobada).
