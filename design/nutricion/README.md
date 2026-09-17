# Maquetas: la app de comidas y nutrición dentro de la app

Seis pantallas. **Son maquetas, no la app.**

| archivo | pantalla | alto |
|---|---|---|
| `Dia.dc.html` | Comida: el día, ahora con los tres macros y los micronutrientes | 1.5 pantallas |
| `Alimentos.dc.html` | la tabla de alimentos: buscar, filtrar por tipo | 1.3 |
| `Ficha.dc.html` | ficha de un alimento: macros, micros y de dónde salen los datos | 1.1 |
| `Nevera.dc.html` | lo que tienes en casa | 1.0 |
| `Ideas.dc.html` | qué cocinar con eso, incluidas combinaciones nuevas | 1.2 |
| `CrearPlato.dc.html` | crear un plato con ingredientes, nutrición calculada sola | 1.3 |

## Decisiones tomadas con el usuario

1. **Micronutrientes: tabla propia + USDA.** Arranca con una tabla local para que
   funcione desde el primer día; con una clave de FoodData Central se completa y
   se corrige con datos oficiales. Cada ficha dice de dónde sale su dato.
2. **Se mejora lo que hay, en su sitio.** No hay pestaña nueva: Comida y Días y
   menús se quedan donde están y crecen por dentro.
3. **La nevera propone también combinaciones nuevas**, no solo platos guardados,
   con reglas locales (sin red).

## Lo que se construyó (y en qué se separó de la maqueta)

Construido en `app.js` + `styles.css`. Lo que cambió al bajarlo a la app:

- **Nueve micronutrientes, no seis**: hierro, calcio, potasio, magnesio, vit. C,
  vit. D, B12, B6 y folato. En la maqueta se enseñaban seis por hueco; en la app
  caben los nueve en la rejilla de dos columnas.
- **Las ingestas de referencia** son las VRN del etiquetado europeo, de adulto
  genérico. No es una pauta médica y la app lo dice en la ficha y en el día.
- **La tabla son 86 alimentos** con valores de referencia aproximados. Cada ficha
  lleva el sello de dónde sale el dato (`≈ tabla de la app`, `✓ USDA`, `✎ tuyo`).
  Con la clave de FoodData Central puesta en Ajustes, el alimento se corrige y se
  guarda corregido.
- **Las combinaciones apuntan a UNA comida**, no al hueco entero del día: con
  2 300 kcal por delante no se propone un plato de 2 300 kcal.
- **Los condimentos** (ajo, cebolla, puerro, caldo, aceite…) no entran como pieza
  principal: nadie se come una guarnición de 150 g de ajo.
- **Las cantidades por defecto** salen del tipo de alimento: 10 g de aceite,
  80 g de cereal o legumbre en crudo, 150 g de carne o verdura, 200 ml de lácteo.
- **Micros solo donde los hay**: un producto de código de barras trae macros y
  poco más, y la app lo dice en vez de sumar ceros.

Fijado en `tests/regression.test.js` (pruebas 55–64).

## Cómo se regeneran

```
node pantallas.mjs   # escribe los .dc.html desde build.mjs
node preview.mjs     # los mira a 390×844 y avisa de desbordes
```
