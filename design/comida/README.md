# Maquetas: Comida, rehecha

Siete pantallas. **Son maquetas, no la app.**

| archivo | pantalla | alto |
|---|---|---|
| `Dia.dc.html` | Comida: el día, y una sola puerta | 1.2 pantallas |
| `Buscar.dc.html` | el buscador, sin escribir nada | 1.0 |
| `BuscarEscribiendo.dc.html` | escribiendo «pollo»: todo junto, agrupado | 1.0 |
| `Cantidad.dc.html` | la hoja de cantidad, con la previa en vivo | 1.0 |
| `Cocina.dc.html` | qué hago hoy + nevera + lote, en una | 1.0 |
| `Productos.dc.html` | mis productos, rescatados de las 27 pantallas | 1.1 |
| `Micros.dc.html` | micronutrientes, fuera de la portada | 1.2 |

## Medido en el móvil, 412×915, con el catálogo importado y comida apuntada

| pantalla | alto | botones | campos |
|---|---|---|---|
| **Apuntar → mis productos** | **24 882 px = 27,19 pantallas** | **570** | **189** |
| Ideas | 2 260 px (2,47) | 15 | 0 |
| Comida, portada | 1 971 px (2,15) | 43 | 1 |
| Alimentos | 1 245 px (1,36) | 26 | 1 |
| Qué cocino | 1 102 px (1,20) | 13 | 0 |
| Ficha de un alimento | 1 114 px (1,22) | 9 | 2 |
| Apuntar → a mano | 909 px (0,99) | 6 | 10 |
| Apuntar → buscar | 769 px (0,84) | 5 | 1 |
| Mi nevera | 548 px (0,60) | 14 | 1 |
| Apuntar → escanear | 543 px (0,59) | 9 | 3 |

**La «lista infinita» es «mis productos».** Con el catálogo local importado son 188
productos, y la pantalla los pinta **todos**, cada uno con su campo numérico y sus
tres botones, dentro de una tabla con scroll lateral. Una captura entera de esa
pantalla mide 50 000 píxeles de alto.

No es un fallo de rendimiento: pintarla cuesta 3,6 ms. Es de diseño.

## Lo que falla de verdad, y no es solo el largo

**Hay 290 cosas que puedes apuntar, repartidas en tres pantallas distintas**:
86 alimentos en «Alimentos», 188 productos en «Mis productos» y 16 platos en
«Días y menús». Antes de buscar nada tienes que acertar en cuál de los tres
mundos vive lo que quieres. Eso es lo que hay que rehacer.

Y en la portada hay **seis puertas** (Alimentos, Mi nevera, Ideas, Qué cocino,
Mis productos, Importar), más la tarjeta de micronutrientes, que son nueve
casillas y ocupa el 25 % de la página con información que se consulta, no se usa.

## Lo que se conserva porque funciona

- El anillo de kcal y los tres macros.
- «Lo de hoy», agrupado por momento.
- La tira de la semana.
- Apuntar un plátano cuesta **4 toques** hoy, y eso está bien: la maqueta no lo
  empeora (3 con el `+`, 4 si quieres cambiar la cantidad).

## Lo que cambia

1. **Una sola puerta: el buscador.** Una barra grande en la portada. Dentro, un
   campo y una lista con **todo** —alimentos, productos y platos— agrupado por
   tipo y filtrable por chips. Sin escribir nada no sale una lista: salen **seis**
   cosas, las que más apuntas.
2. **Cada resultado tiene dos gestos**: el `+` lo apunta con la cantidad de
   siempre (3 toques en total); tocar el nombre abre la hoja de cantidad.
3. **La hoja de cantidad** trae raciones de verdad («1 filete · 120 g»), la previa
   de kcal y macros en vivo, el momento del día y, en el propio botón, lo que te
   quedará después.
4. **Mis productos pasa de 27 pantallas a 1**: buscador primero, ocho filas, y
   nada de campos numéricos por fila.
5. **Micronutrientes sale de la portada** a su pantalla, y en la portada deja una
   línea con nueve puntos de color y «4 por debajo de la mitad».
6. **Cocina absorbe Nevera, Ideas y Qué cocino** en una pantalla con pestañas: de
   tres destinos a uno.
7. **Seis puertas pasan a tres**: Cocina, Mis platos, Alimentos.

## Decisiones que hay que confirmar antes de construir

1. **Las tres puertas de abajo**: ¿Cocina / Mis platos / Alimentos, o prefieres
   otra terna?
2. **El `+` que apunta directo** con la cantidad por defecto: ¿te vale, o
   prefieres que siempre pase por la hoja de cantidad?
3. **«Importar receta de un vídeo»** ya no tiene puerta propia en la portada.
   Puede vivir dentro de «Mis platos». ¿De acuerdo?

## Cómo se regeneran

```
node pantallas.mjs   # escribe los .dc.html desde build.mjs
node preview.mjs     # los mira a 390×844 y avisa de desbordes
```
