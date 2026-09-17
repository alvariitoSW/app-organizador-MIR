---
name: prueba-de-secuencia
description: Escribir una prueba de regresión tras arreglar un fallo de interfaz. Úsala siempre que arregles un bug en app.js o sw.js y toque fijarlo en `tests/`. NO la uses para lógica pura sin interfaz, que se prueba directamente.
---

# Probar secuencias, no caminos sueltos

## Por qué

En una auditoría se encontraron **seis fallos reales con 133 pruebas en verde**.
Todas las pruebas arrancaban de cero y tocaban un solo camino. Los seis fallos
solo aparecían al **encadenar dos gestos**: leer una receta y luego cambiar el
enlace, pulsar «limpiar» y luego guardar, compartir y luego recargar.

Una prueba que hace una sola cosa desde un estado limpio no prueba la app: prueba
la función.

## Cómo se escribe

1. **Encadena**. Mínimo dos gestos reales seguidos, sin resetear el estado entre
   ellos. Lo que se busca es lo que queda sucio del gesto anterior.
2. **Conduce la interfaz**, no la API. `page.click('[data-a="..."]')`, no
   `window.PG.loQueSea()`. Lo segundo pasa por encima de los dos switches de
   acciones, que es donde se esconden los fallos mudos.
3. **Parte del estado que deja la prueba anterior** cuando sea realista. La suite
   es una sola función `async`: mete tu bloque entre llaves `{ ... }` para que
   tus `const` no choquen con los de arriba.
4. **Nombre en español** diciendo el comportamiento esperado, no el nombre de la
   función.
5. **Comenta el porqué**: qué fallo concreto fija, en una o dos líneas.

## Trampas de Playwright en este repositorio

- `page.fill()` **no dispara `change`** en un campo de texto. Si la acción vive
  en el listener de `change`, hay que hacer `keyboard.press('Tab')`.
- `page.evaluate(() => ({p: unaPromesa}))` devuelve `{}`. Hay que esperar la
  promesa **dentro** de la página.
- Para el service worker o el modo sin conexión hace falta servir desde un
  subdirectorio (como GitHub Pages) y `context.setOffline(true)`:
  eso vive aparte, en `tests/compartir.test.js`.

## Validación obligatoria

**Revierte el arreglo y comprueba que cae exactamente tu prueba.** Una prueba que
pasa igual con el bug dentro no vale nada.

```bash
# con el arreglo revertido a propósito
npm test   # tiene que caer LA TUYA, y ninguna otra
# restaurado
npm test   # todo verde
```

Di en el mensaje de commit cuántas caen al revertir («con el service worker
anterior caen 4 de esas 6»).
