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

## Lo que NO está decidido y hay que mirar al construir

- Cuántos micros se siguen. En las maquetas van 6 en el día y 6 por alimento
  (hierro, calcio, potasio, magnesio, vit. C, D, B12, B6, folato). Hay que
  cerrar la lista antes de escribir la tabla.
- Las ingestas de referencia son de adulto genérico. No es una pauta médica y la
  app tiene que decirlo donde se vean los porcentajes.

## Cómo se regeneran

```
node pantallas.mjs   # escribe los .dc.html desde build.mjs
node preview.mjs     # los mira a 390×844 y avisa de desbordes
```
