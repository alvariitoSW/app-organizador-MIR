---
name: bitacora
description: La bitácora del proyecto: el plan de la versión 3.0 (en marcha, lo siguiente, ideas) y tres listas cortas (lo hecho, lo que falta pulir y lo que el usuario ha dicho que hay que hacer). Úsala cuando el usuario escriba «/bitacora», «/bitácora», «bitácora», «¿cuál es el plan?», «¿qué hemos hecho?», «¿qué nos queda?», «¿qué toca ahora?» o «recuérdame lo que te dije», normalmente después de un /plan-socialista o tras unos días sin tocar la app. También cuando diga algo nuevo que hacer en la app («apunta en el plan…», «para la 3.0…», «quiero que…» fuera de una tarea): va a «Ideas» de plan-v3.md; y «apúntame…» o «recuérdame…» algo que no es de la app: va a «Para recordarte» del registro. También cuando diga «Consejo de Ministros», «convoca el Consejo» o «consejo de ministros sobre X»: preside la reunión (sección «El Consejo de Ministros»). NO es el parte: no mira despliegues, ramas ni pruebas (eso es /plan-socialista).
---

# Bitácora: el plan, lo hecho, lo que falta y lo que dijiste

El plan de la 3.0 arriba y tres listas debajo, y nada más. Sin buscarle el enfoque: leer, ordenar, contar.

## De dónde sale cada cosa

| Lista | Fuentes |
|---|---|
| **0. El plan 3.0** | `.claude/plan-socialista/plan-v3.md`: «En marcha», las 3 primeras de «Por hacer» (la primera es la siguiente) y cuántas ideas hay. Con el **presupuesto** de su tipo de `gastos.md` («Presupuestos vigentes») si ya hay medida. |
| **1. Lo hecho** | `.claude/plan-socialista/registro.md`: lo marcado «HECHA» o «desplegado» y la sección «Contado» (lo que tenga estado `hecha`/`success`). Los títulos `## …` de `docs/DECISIONS.md` (cada uno es una tanda, con su fecha). |
| **2. Lo que falta pulir en la app** | En `registro.md`: los `[aparc-…]` abiertos y los «Siguen por hacer» de los encargos en marcha; los «Supuestos sin confirmar» (en una sola línea: cuántos y el más reciente). |
| **3. Lo que dijiste que hay que hacer** | En `registro.md`: «A futuro (sin fecha)», los `[enc-…]` que no estén hechos (en `Contado`, los que digan `propuesto`) y la sección **«Para recordarte»**. Lo de la 3.0 ya sale en la lista 0: no se repite. |

Lee también la nota de sesión más reciente de `.claude/plan-socialista/sesiones/` por si quedó algo dicho que no pasó al registro; si lo hay, añádelo al registro (paso de abajo) antes de contarlo.

## Cómo se entrega

En el chat, en español y sin jerga, con este esquema:

```
**Plan 3.0**
- En marcha: Comer · cantidades con pasos (maqueta) · [v3-cantidades]
- Lo siguiente: Comer ordenado · [v3-comer-perdido] · presupuesto ~1,2 M (maqueta, sonnet)
- Después: … · … · y 9 más · 7 ideas sin ordenar
**Lo hecho** (de lo más reciente a lo más antiguo)
- 2026-10-19 · El Plan de comidas, las tres en una
- …
**Lo que falta pulir**
- Energía del día que se gasta y se recarga (arte, tanda 3) · [aparc-arte-energia]
- …
**Lo que dijiste que hay que hacer**
- Versión 3.0: revisión a fondo de arte, visual y técnica · [enc-v3]
- …
```

- Una línea por cosa, con su fecha si la tiene y su id del registro entre corchetes.
- **Lo hecho:** como mucho las 10 últimas; si hay más, «y N más desde el <fecha>». Lo hecho no se repite
  en las otras dos listas.
- Nada de inventar: si no está en las fuentes, no sale. Si una lista está vacía, «Nada».
- Al final, una línea: «¿Empezamos por alguna?», y los «Supuestos» de siempre.

## Apuntar algo nuevo para la app (el plan 3.0)

Si el usuario dice algo que quiere en la app («apunta en el plan…», «para la 3.0…», «también quiero que…»)
y no es la tarea de esta sesión, añádelo en `plan-v3.md`, sección **«Ideas»**, con id `[v3-<tema>]`, la frase
como la dijo (resumida si es larga) y la fecha. **No lo ordenes tú:** pregúntale en una línea si va a «Por hacer»
y en qué puesto («¿la pongo después de X?»), o déjala en Ideas. Si cambia el orden de «Por hacer» o pasa una
idea a la lista, se mueve la línea (sin duplicarla). Commit solo de `.claude/plan-socialista/` en la rama de
trabajo y push.

## Apuntar un recordatorio

Si el usuario dice «apúntame», «recuérdame» o «para más adelante» algo, añádelo en `registro.md`,
sección **«Para recordarte»**, con id `[rec-<AAAA-MM-DD>-<tema>]`, la frase como la dijo (resumida si es
larga) y la fecha. Se tacha cuando se hace o lo descarta. Commit solo de `.claude/plan-socialista/` en la
rama de trabajo y push.

## El Consejo de Ministros

La bitácora es **Transportes** en el gobierno del repositorio (`.claude/plan-socialista/gobierno.md`): convoca el
Consejo, lo preside y escribe el acta. Pasos:
1. **Orden del día**: los asuntos, uno por línea (lo que pide el usuario o lo que en `plan-v3.md` está esperando
   decisión).
2. **Mapa**: un ayudante `Explore` en sonnet o haiku resume lo que ya hay (≤70 líneas). Nadie más relee `app.js`.
3. **Dictámenes**, en paralelo y con el mapa en el encargo: un agente para el ministerio del asunto + Bienestar
   (opus si hay que diseñar) y otro para Interior + Justicia (sonnet). ≤15 líneas por asunto, con voto.
   Hacienda y Transportes los das tú, sin agente.
4. **Acta** en `.claude/plan-socialista/consejo/AAAA-MM-DD.md` (formato en su `LEEME.md`): acuerdos, lo que entra en
   `plan-v3.md` con «(Consejo, fecha)» y lo reservado al usuario como preguntas con opciones (≤3).
5. Al usuario: el resumen corto y las preguntas. Lo reservado no se construye hasta que conteste.
Gasto de la reunión ≤0,6 M; se mide al cerrar (`node tools/gasto.mjs --apunta consejo-<tema> --tipo estudio`).

## Límites

- Solo lee y cuenta; no cambia el estado de nada salvo para apuntar un recordatorio o algo nuevo del plan.
- No toca `preferencias.md` ni código.
- En el Consejo escribe el acta y `plan-v3.md`; no construye.
