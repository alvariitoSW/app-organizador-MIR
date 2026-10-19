---
name: bitacora
description: La bitácora del proyecto en tres listas cortas: lo hecho, lo que falta pulir en la app y lo que el usuario ha dicho que hay que hacer (encargos, recordatorios y cosas de futuro). Úsala cuando el usuario escriba «/bitacora», «/bitácora», «bitácora», «¿qué hemos hecho?», «¿qué nos queda?» o «recuérdame lo que te dije», normalmente después de un /plan-socialista o tras unos días sin tocar la app. También cuando diga «apúntame…» o «recuérdame…» algo para más adelante: va a «Para recordarte» del registro. NO es el parte: no mira despliegues, ramas ni pruebas (eso es /plan-socialista).
---

# Bitácora: lo hecho, lo que falta y lo que dijiste

Tres listas y nada más. Sin buscarle el enfoque: leer, ordenar, contar.

## De dónde sale cada cosa

| Lista | Fuentes |
|---|---|
| **1. Lo hecho** | `.claude/plan-socialista/registro.md`: lo marcado «HECHA» o «desplegado» y la sección «Contado» (lo que tenga estado `hecha`/`success`). Los títulos `## …` de `docs/DECISIONS.md` (cada uno es una tanda, con su fecha). |
| **2. Lo que falta pulir en la app** | En `registro.md`: los `[aparc-…]` abiertos y los «Siguen por hacer» de los encargos en marcha; los «Supuestos sin confirmar» (en una sola línea: cuántos y el más reciente). |
| **3. Lo que dijiste que hay que hacer** | En `registro.md`: «A futuro (sin fecha)», los `[enc-…]` que no estén hechos (en `Contado`, los que digan `propuesto`) y la sección **«Para recordarte»**. |

Lee también la nota de sesión más reciente de `.claude/plan-socialista/sesiones/` por si quedó algo dicho que no pasó al registro; si lo hay, añádelo al registro (paso de abajo) antes de contarlo.

## Cómo se entrega

En el chat, en español y sin jerga, con este esquema:

```
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

## Apuntar un recordatorio

Si el usuario dice «apúntame», «recuérdame» o «para más adelante» algo, añádelo en `registro.md`,
sección **«Para recordarte»**, con id `[rec-<AAAA-MM-DD>-<tema>]`, la frase como la dijo (resumida si es
larga) y la fecha. Se tacha cuando se hace o lo descarta. Commit solo de `.claude/plan-socialista/` en la
rama de trabajo y push.

## Límites

- Solo lee y cuenta; no cambia el estado de nada salvo para apuntar un recordatorio.
- No toca `preferencias.md` ni código.
