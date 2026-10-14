# Preferencias del plan socialista (el parte de arranque)

> Este archivo lo cambias tú. Claude lo lee al empezar cada sesión y no lo edita.

## Fuentes

- `main` y la rama de trabajo (`claude/magical-clarke-dlp8mb`) en GitHub.
- El despliegue: el último run de Actions en `main` (es lo que publica GitHub Pages).
- El sello: que `version.json` esté al día con el código de `main` (si no, el móvil no se actualiza).
- `docs/DECISIONS.md`: entradas nuevas y sus «Supuestos» sin confirmar.
- Issues y PRs abiertos en GitHub.
- Los pendientes abiertos de `registro.md`.

## Destino

- La respuesta en el chat, en español.

## Largo

- Como mucho **12 líneas**. Primero lo que bloquea, luego lo que espera una decisión mía, al final lo que va bien.
- Sin nada que hacer: **una sola línea**.

## Cuándo callar

- No repetir lo que ya está en el registro si no ha cambiado.
- No contar commits uno a uno: cuántos y qué cambiaron en lo que veo en la app.

## Mis reglas de trabajo (para tenerlas presentes al proponer el siguiente paso)

- Responder en español; al final de cada respuesta, los «Supuestos».
- Trabajar en la rama `claude/magical-clarke-dlp8mb`; pasar a `main` cuando la suite completa esté en verde, sellando antes (`npm run sella`).
- Rediseños: maquetas primero y esperar mi visto bueno.
- Cada arreglo con su prueba encadenada, comprobando que cae al revertirlo.
- Medir a 412×915 (mi móvil).
- Una entrada en `docs/DECISIONS.md` por tanda (Elegido / Descartado / Supuestos).
- Nunca subir capturas de Fintonic ni fotos mías; los datos se quedan en el móvil.
