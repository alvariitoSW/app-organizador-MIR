# Maquetas: rediseño de Entreno

Las cinco pantallas propuestas para rehacer la sección Entreno. **Son maquetas, no la app.**

| archivo | pantalla |
|---|---|
| `Main.dc.html` | portada: fichas de sección |
| `Sesion.dc.html` | entrenando: series del día y apuntar |
| `Rutinas.dc.html` | rutinas y segundo entreno |
| `Progreso.dc.html` | mapa de calor, volumen y marcas |
| `Biblioteca.dc.html` | buscador de ejercicios |

## Cómo se tocan

Los `.dc.html` **los genera `build.mjs`**: si editas uno a mano, el siguiente `node build.mjs`
se lo lleva por delante. Edita `build.mjs` (el contenido) o `_base.css` (la piel).

```bash
node build.mjs      # regenera los .dc.html y canvas.json
node preview.mjs    # los abre a 390px y avisa si algo se sale del marco
```

`_base.css` es una copia de los tokens de `../../styles.css`. Si cambian los de la app,
cópialos aquí o las maquetas dejarán de parecerse a lo que hay.

El `.html` sellado que se publica no se versiona (pesa 2,5 MB y sale de estos archivos).
