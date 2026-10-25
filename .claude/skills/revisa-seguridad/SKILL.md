---
name: revisa-seguridad
description: Revisar la seguridad y la privacidad de ESTA app (Guardias · rotación y cocina) antes de desplegar o tras tocar algo sensible. Úsala cuando el usuario escriba «/revisa-seguridad», «revisa la seguridad», «¿esto es seguro?», «¿se escapan mis datos?», «mira la privacidad» o cuando el cambio toque: texto que el usuario escribe y acaba en pantalla, algo que sale del móvil (fetch), el token de Google, el service worker o las dependencias. NO es para atacar sistemas ajenos: solo revisa el código de este repositorio.
---

# Revisa la seguridad de la app

La app es de una sola página, **sin servidor y sin cuentas**: todos los datos viven en el `localStorage`
del móvil del usuario (guardias, sueño, dinero, hábitos, 4:20). La regla de oro de `CLAUDE.md` es que
**esos datos nunca salen del móvil**. Esta skill comprueba que eso sigue siendo verdad y que nada abre
una puerta por descuido. Solo mira el código de este repositorio; no toca nada de fuera.

Revisa y, al final, entrega un informe corto: lo que está bien, lo que hay que arreglar (con su
`archivo:línea`) y lo que es duda. No arregles a lo loco: propón el cambio mínimo y, si cambia lo que el
usuario ve, pregunta antes.

## 1. XSS: el texto que escribe el usuario, escapado antes de pintarlo

`render()` reemplaza `#main.innerHTML` entero, y hay **~134 usos de `innerHTML`** en `app.js`. Todo lo
que el usuario escribe (título de un evento, una nota, el nombre de un plato, la frase de «Te leo», el
texto de un ticket) tiene que pasar por **`esc()`** (`app.js:5`) antes de ir a un `innerHTML` o a un
`title="…"`. Si no, un texto con `<img onerror=…>` se ejecutaría.

- Busca interpolaciones de datos del usuario sin escapar:
  ```sh
  rg -n "innerHTML" app.js | rg -v "esc\(" | head -40      # candidatos a mirar a mano
  rg -n "'\s*\+\s*[a-z].*\.(titulo|nombre|name|txt|nota|label|q)\b" app.js | rg -v "esc\(" | head
  ```
- Para cada uno, confirma que el valor o es fijo (lo pone el código) o va dentro de `esc(...)`. Lo que se
  pinte con `textContent=` ya es seguro (no interpreta HTML): eso está bien.
- Si falta un `esc()`, el arreglo es envolver el valor: `esc(x.titulo)`. Con su prueba encadenada
  (skill `prueba-de-secuencia`): escribe un evento llamado `<b>x</b>` y comprueba que en pantalla sale el
  texto, no una negrita.

## 2. Lo que sale del móvil: una puerta por fetch, y solo la justa

Inventario de las salidas (`rg -n "fetch\(" app.js`). Ahora mismo son:

| A dónde | Para qué | Qué puede salir |
|---|---|---|
| `world.openfoodfacts.org`, USDA (`api.nal.usda.gov`) | buscar un alimento | el **texto que buscas** (p. ej. «leche») |
| worker de recetas (`*.workers.dev`), `opengym...gitlab.io` (`GYM_URL`) | leer recetas / ejercicios | nada tuyo: solo descarga |
| `allorigins.win`, `api.codetabs.com` | proxy CORS para leer una web ajena | **la URL** que pидes leer |
| Google Calendar (fetch con `authorization: Bearer`) | exportar/borrar eventos | tus eventos y el **token** |

Reglas al revisar un fetch nuevo o cambiado:
- **Nada de sueño, dinero, hábitos, 4:20, peso ni notas personales sale nunca.** Solo salen: un término de
  búsqueda de comida, una URL que pides leer, y lo que exportas a Google si tú lo activas.
- Un **proxy CORS** (`allorigins`, `codetabs`) recibe la URL que le pasas: no le pases nunca una URL con un
  token ni con datos personales dentro.
- Todo fetch va por **HTTPS** y a un dominio de la tabla. Si aparece un dominio nuevo, pregunta para qué es.
- Nada de telemetría: busca que no haya `sendBeacon`, analíticas ni `fetch` a un dominio de medición.
  ```sh
  rg -n "sendBeacon|analytics|gtag|mixpanel|sentry|plausible" app.js sw.js index.html
  ```

## 3. El token de Google: ni se registra, ni se sube, ni va a otro sitio

El token de Google (`authorization: Bearer …`) vive en el `localStorage` y solo debe ir a Google.
- Que no se imprima: `rg -n "console\.(log|warn|error).*token" app.js` → vacío.
- Que no acabe en una URL de proxy ni en ningún fetch que no sea a Google.
- Que no se escriba a disco ni al repositorio (el `localStorage` es del móvil; el repo no guarda datos).

## 4. Privacidad: nada personal en el repositorio

`CLAUDE.md`: nada de capturas de Fintonic ni fotos del usuario, ni datos personales en el repo ni en
servicios externos. El hook `sin-capturas.sh` ya bloquea imágenes fuera de `maquetas/` y `design/` al hacer
`git add`/`commit`. Comprueba además que no se cuele nada de datos en texto:
```sh
git log --oneline -20                      # ningún commit con datos reales del usuario
rg -n "2766|Fintonic|Lloret.*\d{4}" docs/ .claude/ 2>/dev/null   # cifras/nombres reales sueltos
```

## 5. Service worker y dependencias

- **`sw.js`**: que cachee solo archivos propios de la app, no respuestas de terceros con token dentro, y
  que la marca de versión (`version.json`, `npm run sella`) siga siendo la que vence la caché. Lee `sw.js`
  entero (234 líneas) si tocaste el cacheo.
- **Dependencias**: el proyecto casi no tiene (solo `playwright` de desarrollo). Lo que llega de fuera en
  tiempo real son el dataset de ejercicios (`GYM_URL`, jsdelivr/gitlab) y los workers. No se ejecuta código
  de terceros en la app salvo lo que tú controlas; si algún día se añade un `<script src=cdn…>`, pon
  `integrity=` (SRI) y coméntalo.
- **CSP (opcional, mejora)**: `index.html` no lleva Content-Security-Policy. Se podría añadir una `<meta>`
  que limite `connect-src` a los dominios de la tabla y `script-src` a `'self'`. Es un cambio que conviene
  **proponer y medir** (skill `verify`), no colar: una CSP mal puesta rompe los fetch o el service worker.

## 6. Salida

Un informe en español, corto:
- **Bien:** lo que está correcto (p. ej. «los 134 `innerHTML` que pintan texto del usuario pasan por `esc()`»).
- **Arreglar:** cada fallo con su `archivo:línea`, el riesgo en una frase y el cambio mínimo. Si cambia lo
  que se ve, pregunta antes (skill `tarea-a-fondo`).
- **Duda:** lo que no has podido confirmar, dicho como duda, no como «está bien».
- Cada arreglo de código lleva su prueba encadenada y pasa por la suite antes de `main` (`CLAUDE.md`).
