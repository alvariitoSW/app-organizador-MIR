# Concurso «La Vuelta» · 2.ª ronda · bases (28/10/2026)

**Notas del gobierno central a la 1.ª ronda:** le gustan **El Teide**, **El Reloj de Sol** y **El Drago** (las tres de
sonnet). No le convencen La Sobremesa (la que puso primera el jurado), La Tortuga ni El Sofá.
**Pide:** 6 participantes nuevos, todos completamente distintos entre sí, que mezclen lo que funcionó en esas tres. Cada
uno presenta **la app que ya existe** con otro modelo ilustrativo y **la explica en 45 segundos**.

## Lo que funcionó (hay que mezclarlo)
- **El Teide:** un lugar real de Canarias dibujado grande. La vuelta es un camino que se sube por etapas con nombre, y la
  guardia es «una noche en el refugio».
- **El Reloj de Sol:** la luz y la sombra dicen la hora. La franja de 15:00 a 16:00 se ve sin leer.
- **El Drago:** el crecimiento lento. Fallar no seca nada: la rama espera. Estilo de lámina antigua.
- Las tres: **el dibujo grande es la información y lleva poco texto**, y cada dato tiene su sitio en el mundo.

## Reglas
Las de la 1.ª ronda (`2026-10-28-la-vuelta-bases.md`, secciones 1 y 2): un HTML a 412 px, sin nada externo, accesible AA,
cifras comunes, nunca riñe, sin filas con flecha ni barras de progreso. Se añaden:

11. **Pantalla 0 · «En 45 segundos»**, la primera, ≤915 px de alto: la explicación de la app. Lleva un texto de
    **100-120 palabras** (lo que se lee en voz alta en 45 s), en frases cortas del tipo «esto sirve para…», «esto te
    ayuda a…». Cubre estos cinco puntos, en este orden:
    1. **Para qué sirve:** organizar el entreno y el peso alrededor de las guardias, sin pensar.
    2. **El día a día:** qué miras al abrirla (hoy toca, a qué hora y dónde), la sesión con sus cargas y descansos, la
       mínima de 25 min si vas justo, y el parque el finde.
    3. **Cuando lo dejas y vuelves:** tras dos semanas parado, la app arranca la vuelta al 35 % y sube 10 puntos cada
       semana; si fallas, repites sin castigo; la racha se cuenta por semanas.
    4. **El peso:** de 82 a 75 kg, unas 2.000 kcal y 140 g de proteína, y el plan semanal de comidas cuadrado con eso.
    5. **Por qué este dibujo:** qué es cada cosa del mundo (la sombra es la hora, el camino es la vuelta…) y por qué
       ayuda a seguir.
    Junto al texto, un **botón «Explícamelo · 45 s»** (≥44 px) que recorre el dibujo resaltando cada parte mientras
    aparece su frase. En total dura 45 s (unos 9 s por punto), se puede parar, y con `prefers-reduced-motion` no anima:
    solo enseña el texto completo.
12. **La app que ya existe:** la explicación nombra solo cosas que la app tiene o tendrá con esta tanda. Son la
    rutina del día, la sesión en vivo con descanso entre series, la subida de peso cuando sacas todas las series, el
    cambio de un ejercicio por otro del mismo músculo (biblioteca openGym), la racha, el plan de vuelta, la hora
    15:00-16:00, el parque, la sesión mínima y el objetivo de peso. Nada inventado fuera de eso.
13. **Mezcla obligatoria:** un lugar real de Canarias (distinto en cada escuela), la luz o la sombra como la hora, y
    algo que crece o se sube despacio como la vuelta. Cada escuela usa una **técnica de ilustración distinta**.
14. Pantallas: 0 · En 45 segundos (≤915) · 1 · Hoy toca (≤915) · 2 · La vuelta (≤1.300) · 3 · Tu objetivo de peso (≤1.300).

## Cómo se elige (Hacienda recorta el jurado: el usuario ya decidió contra él)
1. **Oficio (quien preside, Playwright a 412 px):** sin errores de JS, ancho 412, altos, sin cargas externas, que el
   texto de la Pantalla 0 tenga entre 100 y 120 palabras y que el recorrido dure 45 s (±3).
2. **El gobierno central** pone nota 1-5 y elige. No hay jurado de modelo.

## Escuelas (las seis en sonnet: las tres que gustaron eran de sonnet)
| n | Escuela | Lugar | Técnica | Mezcla | Archivo |
|---|---|---|---|---|---|
| 1 | La Sombra del Teide | Las Cañadas, Tenerife, al atardecer | aguatinta / grabado al aguafuerte en sepias y violetas | Teide + Reloj de Sol: la sombra triangular del Teide sobre el mar de nubes marca la hora | `maquetas/deporte2-1-sombra-teide.html` |
| 2 | El Pino que Rebrota | Pinar de Vilaflor, Tenerife | xilografía a dos tintas (negro y verde pino) | Drago + Teide: el pino canario rebrota tras el fuego, que es volver tras el parón | `maquetas/deporte2-2-pino.html` |
| 3 | Risco Caído | Artenara, Gran Canaria | pintura rupestre geométrica (ocre, almagre, blanco, negro) | Reloj de Sol: la luz entra por el agujero de la cueva y recorre los grabados | `maquetas/deporte2-3-risco-caido.html` |
| 4 | El Faro de Orchilla | El Hierro, el meridiano cero | carta náutica de línea fina (azul de Prusia sobre papel) | Reloj de Sol + Teide: el haz del faro gira como un reloj; la costa se recorre por cabos | `maquetas/deporte2-4-faro.html` |
| 5 | Los Bancales | Valle Gran Rey, La Gomera | papel recortado en capas con sombra real | Teide + Drago: un bancal más cada semana, barranco arriba, con palmeras que crecen | `maquetas/deporte2-5-bancales.html` |
| 6 | La Geria | Lanzarote | vista aérea en mosaico (ceniza negra, verde viña, piedra) | Drago + Reloj de Sol: cada hoyo con su muro de piedra es un día; la sombra del muro marca la hora | `maquetas/deporte2-6-geria.html` |
