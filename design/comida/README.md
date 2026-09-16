# Maquetas: rediseño de Comida y Días y menús

Ocho pantallas propuestas. **Son maquetas, no la app.**

| archivo | pantalla |
|---|---|
| `Main.dc.html` | Comida: el día (anillo, proteína, registro, semana) |
| `Anadir.dc.html` | apuntar comida: buscar / escanear / mis productos / a mano |
| `DiasMenus.dc.html` | Días y menús: los seis tipos de día como lista |
| `MenuDia.dc.html` | el menú de un tipo de día |
| `QueCocino.dc.html` | qué puedo cocinar con lo que hay |
| `ModoCocina.dc.html` | paso a paso, con los ingredientes escalados |
| `Inventar.dc.html` | que Claude proponga una receta (solo en el Artifact) |
| `Catalogo.dc.html` | catálogo de platos |

## Lo que hay que arreglar en la app cuando se construya

En «Objetivo, semana a semana» (`renderFood`) la barra se fuerza al 100 % cuando no hay
objetivo puesto, se haya comido lo que se haya comido:

```js
width: x.ob ? (x.lg/x.ob*100) : (x.pl ? 100 : 0)
```

Lo suyo es medir lo comido contra el plan del día (`x.lg / x.pl`), que es lo que hacen estas
maquetas.

## Cómo se tocan

Los `.dc.html` **los genera `build.mjs`**: si editas uno a mano, el siguiente `node build.mjs`
se lo lleva por delante. Edita `build.mjs` (contenido) o `_base.css` (piel).

```bash
node build.mjs      # regenera los .dc.html y canvas.json
node preview.mjs    # los abre a 390px y avisa si algo se sale del marco
```

Dos trampas que costaron una vuelta y están resueltas en `_base.css`:

- una barra pegada abajo necesita `position:relative;z-index:1`, o el fondo decorativo
  (`.bgfx`, que es `position:absolute`) la tapa y parece que no se ha pintado;
- solo lleva barra de progreso lo que de verdad es progreso. Una barra al 100 % que no mide
  nada es justo el fallo que se arregla aquí.

`_base.css` es una copia de los tokens de `../../styles.css`. Si cambian los de la app,
cópialos aquí o las maquetas dejarán de parecerse.

El `.html` sellado que se publica no se versiona (2,5 MB y sale de estos archivos).
