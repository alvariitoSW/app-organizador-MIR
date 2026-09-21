# Maquetas: Compra + Menú + Comida, en una sola sección

Siete pantallas. **Son maquetas, no la app.**

| archivo | pantalla | alto |
|---|---|---|
| `Main.dc.html` | la portada: el día arriba, la cadena de la semana debajo | 1,31 pantallas |
| `Menu.dc.html` | el menú: qué toca esta semana y tus tipos de día | 1,00 |
| `MenuDia.dc.html` | el menú de un día, por tomas | 1,00 |
| `Cocina.dc.html` | cocina: qué hago hoy / nevera / tandas | 1,11 |
| `Tandas.dc.html` | las tandas de la semana (era «cocina en lote») | 1,00 |
| `Compra.dc.html` | la compra, por secciones y con el origen de cada cosa | 1,37 |
| `Platos.dc.html` | mis platos: una pantalla donde hoy hay dos | 1,00 |

## Medido en el móvil, 412×915, con el catálogo importado y comida apuntada

Lo que hoy son **tres destinos y doce pantallas**:

| pantalla | hoy | botones | campos |
|---|---|---|---|
| Cocina en lote | **5 356 px (5,85)** | 7 | 0 |
| Compra | **3 005 px (3,28)** | 27 | **59** |
| Menú · comidas armadas | 2 299 px (2,51) | 38 | 0 |
| Comida · Cocina | 2 013 px (2,20) | 16 | 0 |
| Comida · mis platos | 1 307 px (1,43) | 38 | 1 |
| Comida · alimentos | 1 245 px (1,36) | 26 | 1 |
| Menú · catálogo de platos | 1 196 px (1,31) | 4 | 1 |
| Comida · portada | 1 190 px (1,30) | 28 | 1 |
| Menú · un día | 1 018 px (1,11) | 27 | 14 |
| Importar receta | 963 px (1,05) | 3 | 2 |
| Menú · lista | 764 px (0,83) | 4 | 0 |
| Comida · buscador | 720 px (0,79) | 20 | 1 |
| **total** | **21 076 px = 23 pantallas** | **238** | **80** |

## Lo que falla de verdad, y no es el largo

**1. Tres puertas para una sola pregunta.** Compra está en la barra (1 toque);
Comida y Días y menús están enterrados en el cajón (2 toques). Ninguna de las
tres nombra a las otras dos — y sin embargo el código ya las encadena: la lista
de la compra se calcula a partir de las tandas, y las tandas salen del menú de
cada tipo de día. La app sabe que son lo mismo; la pantalla, no.

**2. Los mismos 16 platos, en dos pantallas.** «Catálogo de platos» (dentro de
Días y menús) y «Mis platos» (dentro de Comida) pintan `store.dishes` los dos,
cada uno con su buscador y sus botones de crear e importar. Medido: 16 y 16.

**3. «Cocina en lote» está dos veces**: como entrada del cajón (5 356 px, casi
seis pantallas) y como pestaña dentro de Cocina, que lo único que hace es un
botón para saltar a la otra. «Importar receta» está tres veces.

**4. La compra son 59 casillas de una tirada**, sin agrupar y sin decir de dónde
sale cada cosa, y con la tarjeta «Mis listas» encima de la propia lista — que es
lo que miras en el supermercado.

**Fallo de verdad encontrado midiendo**: «Días y menús → un tipo de día» se
desborda a lo ancho (415 px en una pantalla de 412). La culpa es de un
`span.tag` dentro de la fila-tabla de cada toma. En la maqueta cada toma es una
tarjeta y no una fila, así que ya no hay nada que se salga.

## La idea: la cadena

Lo que convierte esto en UNA sección y no en una carpeta con tres cosas dentro
es la tarjeta **«Esta semana»** de la portada:

```
Menú     6 tipos de día · 2 400 kcal/día planificadas   →
  ↓
Cocina   5 tandas · 23 raciones · 2 platos te salen hoy →
  ↓
Compra   18 cosas · 7 ya las tienes                     →
```

Los tres eslabones están unidos por una línea porque **lo de arriba manda en lo
de abajo**: cambias lo que come un tipo de día y se recalculan las tandas y la
compra. Cada eslabón es una puerta y lleva su cifra, así que la portada ya
contesta «¿qué me falta esta semana?» sin entrar en ninguna.

Y debajo, lo del día a día tal y como quedó en el rediseño anterior: el anillo,
los macros, la línea de micros, el buscador y lo apuntado hoy.

## Cómo queda repartido

| antes | ahora |
|---|---|
| barra: Compra · cajón: Comida · cajón: Días y menús | **barra: Comida** (una sola) |
| cajón: Cocina en lote | Comida → Cocina → pestaña «Tandas» |
| cajón: Importar receta | Comida → Mis platos → pestaña «Importar» |
| Catálogo de platos + Mis platos | **Mis platos**, una |
| Días y menús | **Menú**, dentro de Comida |

## Lo que hay que decidir antes de construir

1. **El sitio en la barra.** «Comida» ocupa el hueco de «Compra». La compra pasa
   a estar a dos toques (Comida → Compra). A cambio, Comida —lo que más se
   usa— pasa de dos toques a uno. Si la compra tiene que seguir a un toque, la
   alternativa es una barra de cinco.
2. **El nombre**: «Comida» o «Cocina».
3. **Las comidas armadas** (los bloques reutilizables tipo «táper de guardia»):
   ¿se quedan como pantalla propia dentro de Menú, o se funden con Mis platos?
