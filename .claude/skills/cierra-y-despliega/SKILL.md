---
name: cierra-y-despliega
description: Cerrar un cambio terminado y dejarlo en el móvil del usuario. Úsala cuando diga «fusiona a main», «haz merge», «que se actualice en el móvil», «despliégalo», o cuando hayas terminado una tarea que él ha pedido explícitamente que llegue a la app. NO la uses con pruebas en rojo ni si no ha pedido que se despliegue.
---

# Cerrar un cambio y dejarlo desplegado

La app es estática en GitHub Pages desde `main`. Lo que entra en `main` sale en
el móvil del usuario en cuanto la abra con red (el service worker va a red
primero). Por eso este paso no es mecánico del todo: es publicar.

## 1. Pruebas, enteras

```bash
npm test        # regression + compartir + enlaces + lector
```

Verde del todo o no se sigue. Si algo falla, se arregla antes: no se despliega
con una prueba en rojo ni se «desactiva un momento».

## 2. Sellar la versión — SIN ESTO NO SE ACTUALIZA NADA

```bash
npm run sella      # reescribe version.json con la marca del despliegue
```

La app instalada se entera de que hay algo nuevo **solo** porque `version.json`
cambia: al volver a primer plano lo relee y compara. Y el service worker usa esa
misma marca para colgarla de `app.js?v=…` y `styles.css?v=…`, que es lo único
que vence a la caché en memoria del navegador.

Si te saltas este paso, el usuario sigue viendo la versión vieja y encima le
dices que ya está desplegada. Ya pasó dos veces.

## 3. Commit

Mensaje en español. Título en minúscula diciendo el **efecto**, no el archivo.
Cuerpo: la causa raíz, las cifras medidas y una línea de pruebas al final.
Nunca metas identificadores de modelo en el repositorio.

Cierra siempre con:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
Claude-Session: <la URL de esta sesión>
```

## 4. A la rama, y de ahí a main

```bash
git push -u origin claude/app-main-branch-bnim1i
git checkout main && git merge --ff-only claude/app-main-branch-bnim1i
git push origin main
git checkout claude/app-main-branch-bnim1i
```

Si el push falla por red, reintenta con espera creciente (2 s, 4 s, 8 s, 16 s).

## 5. Verificar el despliegue DE VERDAD

No basta con que el push haya ido bien. Comprueba el workflow «pages build and
deployment» de la rama `main` y espera a `conclusion: success`. Herramienta:
`mcp__github__actions_list` con `method: list_workflow_runs`, filtro
`{"branch":"main"}`.

Un despliegue en verde es lo único que autoriza a decirle al usuario que ya lo
tiene. **Nunca digas «desplegado» sin haberlo mirado**: una vez se dio por
hecho y el usuario respondió «no he visto el rediseño en el link».

Y «está en main y Pages ha desplegado» NO es lo mismo que «le ha llegado al
móvil». Lo segundo depende del paso 2 y del service worker. Si dudas, dile que
mire la versión que pone en «Datos».

## 6. Salida

Una línea con qué hay ahora en el móvil y, si toca, qué tiene que hacer él
(«ábrela una vez con wifi para que se actualice el service worker»).
