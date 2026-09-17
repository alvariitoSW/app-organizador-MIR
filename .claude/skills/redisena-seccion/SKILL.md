---
name: redisena-seccion
description: Rediseñar una sección de la app para el móvil. Úsala cuando el usuario diga «rediseña X», «esto se puede optimizar», «se podría aprovechar mejor la pantalla», «alargar las casillas», «la parte de X está muy cargada», «esta parte habría que diseñarla de otra manera» o mande una captura del móvil señalando una pantalla. Si algo se ve vacío, gris o apagado cuando debería tener datos, comprueba PRIMERO que no sea un fallo: el usuario lo cuenta como problema de diseño y a veces no lo es. NO la uses para arreglar un fallo ya identificado como tal.
---

# Rediseñar una sección para el móvil

El patrón que ha funcionado en Cardio, Entreno, Comida, Días y menús y Mes.
No te saltes el paso 1: sin números, el rediseño es opinión.

## 0. ¿Seguro que es diseño?

**Si algo se ve vacío, gris o apagado cuando debería tener datos, comprueba
primero que no sea un fallo.** El usuario lo cuenta como problema de diseño
—lo vive así— y a veces no lo es.

Pasó con el muñeco de las rutinas: «no se ve qué músculos haces, esta parte
habría que diseñarla de otra manera». Con tres ejercicios puestos el muñeco
seguía gris porque los músculos solo salían de la biblioteca de openGym, que
está en inglés y solo casa con nombre exacto. Ninguna maqueta lo habría
arreglado.

Regla práctica: antes de medir nada, mete datos de verdad en esa pantalla y
mira si se comporta. Si con datos sigue vacía, es un fallo — arréglalo primero y
vuelve a mirar: puede que la queja de diseño se caiga sola. Dile al usuario cuál
de las dos cosas era.

## 1. Medir ANTES de tocar nada

Conduce la app de verdad a 412×915 (el móvil del usuario) y saca:

- alto total de la vista en px y en «pantallas» (÷915)
- número de botones y de campos visibles de una sentada
- para una cuadrícula: alto de celda **y cuánto de ese alto lleva contenido**
- qué % del alto de la ventana ocupa lo importante

Guión mínimo: servidor estático propio, Chromium de `/opt/pw-browsers/chromium`,
`page.evaluate` con `getBoundingClientRect()`. Apunta las cifras: van al mensaje
de commit y a la respuesta al usuario.

## 2. Maquetas primero

El usuario ha elegido «maquetas primero» todas las veces. Usa `/design` con
artboards `.dc.html` a 390×844, la piel sacada de `styles.css` (mismos tokens,
mismas medidas de tarjeta y botón). Enseña las maquetas y **espera el visto
bueno** antes de tocar `app.js`.

## 3. Construir

El patrón de la app: una portada que se lee sin scroll + una pantalla por tarea
con botón de volver, despachadas por una variable de `ui`:

```js
function renderX(){
  const v=ui.xVista||'';
  if(v==='a')return renderXa();
  return renderXPortada();}
```

Trampas de este repositorio, todas vividas:

- **Hay DOS switches de acciones**: `act()` para clicks y otro dentro del
  listener de `change` para `<select>`/`<input>`/ficheros. Un `case` en el
  equivocado no falla: simplemente no ocurre nunca.
- `render()` reemplaza `#main.innerHTML` entero y **desmonta el campo que se
  está tecleando**. Para previsualizaciones en vivo, escribe en el nodo a mano
  o usa el retardo + refoco que ya usan `dish-q` y `food-busca`.
- El bloque `@media(max-width:560px)` está **encima** de las reglas base, así
  que los overrides de móvil necesitan más especificidad (`.dbox .dnm`, no `.dnm`).
- `.bgfx`/`.gridfx` son `position:absolute`: cualquier hermano estático se pinta
  debajo y parece que no está. Necesita `position:relative;z-index:1`.
- **Solo lleva barra de progreso lo que de verdad es progreso.** «Te quedan» o
  «cocinado hoy» son cifras, no barras.

## 4. Volver a medir y conducir

Repite las medidas del paso 1 y **conduce la pantalla nueva** (no solo la
suite): entra, vuelve, toca los botones nuevos, comprueba que no hay errores de
JavaScript. Haz una captura y míralas.

## 5. Salida

Responde con las cifras antes/después («96 px con 28 de contenido → 114 px,
del 54 % al 64 % de pantalla»), no con adjetivos. Si algo no se pudo verificar,
dilo.
