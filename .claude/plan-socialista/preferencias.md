# Preferencias del plan socialista

> Lo cambias tú. Claude lo lee entero al empezar cada parte y **no lo edita**.
> Las reglas de trabajo de siempre (idioma, rama, sellar, maquetas…) están en `CLAUDE.md`.

## 1. Fuentes

Lo que se mira, siempre desde el marcador de la última vez:

- **`main` y la rama de trabajo** (`claude/magical-clarke-dlp8mb`): si una va por delante de la otra.
- **El despliegue:** el último run de Actions en `main` (es lo que publica GitHub Pages).
- **El sello:** que `version.json` esté al día con el código de `main`.
- **Supuestos sin confirmar:** los «Supuestos» de `docs/DECISIONS.md` que no he dicho si valen.
- **Encargos aparcados:** lo que pedí y quedó para «después» (en `registro.md`).
- **GitHub:** issues y PRs abiertos.

## 2. Destino

- La respuesta en el chat, en español.

## 3. Largo máximo

- **12 líneas.** Orden: lo que bloquea → lo que espera una decisión mía → lo aparcado → una línea de lo que va bien.
- Sin nada que hacer: **una sola línea.**
- Los commits no se cuentan uno a uno: cuántos y qué cambió en lo que veo en la app.
- Como mucho **3 supuestos** por parte (los más recientes); el resto, «y N más».

## 4. Cuándo parar o callar

- No repetir lo que ya está en el registro si no ha cambiado de estado.
- Un supuesto se cierra cuando le contesto (vale / no vale); un aparcado, cuando se hace o lo descarto.
- Si una fuente no se puede leer, se dice («no he podido mirar X») y su marcador no avanza.
- El parte informa y propone; no arregla nada hasta que yo lo pida.
