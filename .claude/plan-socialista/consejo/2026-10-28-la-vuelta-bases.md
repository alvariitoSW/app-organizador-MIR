# Concurso «La Vuelta» · Entreno + Objetivo de peso · bases (28/10/2026)

Convocan Sanidad + Bienestar + Educación y Artes Visuales (dictamen opus) con Interior + Justicia (sonnet). Lo pidió
el gobierno central: «un concurso con varios modelos baratos… modelos opuestos de lo que se quiere conseguir para darle
más originalidad a la parte visual… a ver quién es el mejor». Gana **la más original que siga sirviendo**.

## 1. Reglas fijas (romper una = fuera)
1. **Datos inventados**: solo las cifras de abajo. Nada del usuario real.
2. **Un solo archivo HTML** en `maquetas/`, sin librerías ni recursos externos (ni fuentes web). SVG y Canvas en línea, sí.
   JS en línea para tocar, sin guardar nada (ni localStorage).
3. **412 px de ancho** (`body{width:412px;margin:0}`), nada se sale. **P1 ≤915 px de alto**; P2 y P3 ≤1.300 px cada una.
4. Tres pantallas, una debajo de otra, con rótulo pequeño encima: «Pantalla 1 · Hoy toca», «Pantalla 2 · La vuelta»,
   «Pantalla 3 · Tu objetivo de peso». Encima de todo, un cartel con el nombre de la escuela y 2 líneas de la idea.
5. **Accesible**: contraste AA (4,5:1 en texto), todo lo que se toca ≥44 px, nada se distingue solo por color, SVG con
   `<title>` o `aria-label`.
6. **Español llano**, sin jerga. **El dibujo grande es la información; poco texto.**
7. **5 segundos tras una guardia**: mirando P1 se sabe qué toca hoy, a qué hora y dónde (o «hoy no: guardia»).
8. **Nunca riñe**: fallar una semana se cuenta como «se repite», no como fracaso.
9. Prohibido: filas con flecha, barras de progreso, tarjetas oscuras, la piel de la app (`comun.css`), anillos de actividad
   tipo reloj deportivo.
10. Libre todo lo demás: paleta, tipografía (del sistema o genéricas), forma, metáfora, tono.

## 2. Cifras comunes (todas cuentan lo mismo)
- Varón de 27 años, 178 cm. **82 kg → objetivo 75 kg.** Hoy 81,4 kg (semana 2 de 14 del objetivo).
- Basal ~1.800 kcal, gasto ~2.500 → **~2.000 kcal/día y 140 g de proteína, −0,5 kg/semana → 14 semanas, hacia el
  8 de febrero de 2027.** Las kcal del entreno no se suman para comer más. Guardia y saliente no cuentan en la media.
- El plan semanal de comidas se cuadra contra esas cifras (cada día, ~2.000 kcal; se marca el que se pasa).
- **Horario:** entre semana, gimnasio **solo de 15:00 a 16:00** (50 min de trabajo + ir y venir). Fin de semana,
  **parque** 40 min sin material (sentadilla, flexiones inclinadas en banco, remo invertido en barra baja, zancadas,
  plancha, escalones). Si no llega a las 15:00, **sesión mínima de 25 min a las 15:30** (3 ejercicios × 2 series).
- **Cargas de antes (100 %):** sentadilla 80 kg 3×8 · press de banca 60 kg 3×8 · peso muerto 90 kg 3×5 · remo 50 kg 3×10 ·
  press militar 35 kg 3×8.
- **La vuelta:** semana 1 al 35 %, +10 puntos por semana: 35 · 45 · 55 · 65 · 75 · 85 · 95 · 100 (8 semanas), 2 series,
  esfuerzo suave (que sobren ~4 repeticiones). Si falla una semana, la repite al mismo %; si falla dos, baja un escalón.
- **Esta semana = semana 3 de la vuelta, al 55 %:** sentadilla 45 · banca 32,5 · muerto 50 · remo 27,5 · militar 20 kg.
- **La semana:** L gimnasio 15:00 · M guardia · X saliente (paseo de 20 min o nada) · **J gimnasio 15:00 (hoy)** ·
  V mínima 25 min a las 15:30 · S parque 10:00, 40 min · D descanso. Meta: 3 sesiones (2 en semana con guardia).
- **Racha: 2 semanas cumplidas seguidas** (cuenta la semana con ≥2 sesiones; la de guardia, con 1). La mínima cuenta.

## 3. Cómo se elige
**Paso 1 · Oficio (Playwright a 412 px):** sin errores de JS, nada fuera del ancho, altos dentro del límite, sin cargas
externas. Si falla: un arreglo por el mismo modelo; si vuelve a fallar, fuera.
**Paso 2 · Filtro «¿sigue sirviendo?» (sí/no; un «no» descalifica):** a) P1 dice en 5 s qué toca hoy, a qué hora y dónde;
b) P2 enseña el % de esta semana con las cargas y qué pasa si falla una semana; c) P3 enseña 82 → 75, el ritmo, ~2.000 kcal,
140 g, la fecha y cómo encaja el plan semanal de comidas; d) las cifras cuadran; e) la sesión mínima está a un toque.
**Paso 3 · Jurado haiku a ciegas (0-10):** distancia a una app de fitness (0-3) + metáfora propia (0-3) + utilidad para un
vago saliente de guardia (0-4). Una línea por maqueta.
**Paso 4 · El gobierno central** pone nota 1-5. Gana la mejor del jurado entre las que él puntúe ≥3; si elige otra, manda él.
Nada entra en `app.js` sin su visto bueno.

## 4. Escuelas (opuestas a «gimnasio y fuerza»)
| n | Escuela | Modelo | Archivo |
|---|---|---|---|
| 1 | El Reloj de Sol | sonnet | `maquetas/deporte-1-reloj-de-sol.html` |
| 2 | El Sofá | sonnet | `maquetas/deporte-2-sofa.html` |
| 3 | El Teide paso a paso | sonnet | `maquetas/deporte-3-teide.html` |
| 4 | El Drago de Icod | sonnet | `maquetas/deporte-4-drago.html` |
| 5 | La Tortuga | haiku | `maquetas/deporte-5-tortuga.html` |
| 6 | La Sobremesa | haiku | `maquetas/deporte-6-sobremesa.html` |

Opuestos: la siesta (1) / el sofá del vago (2); la montaña que se sube (3) / el árbol que crece quieto (4); la lentitud
animal (5) / el placer de comer (6).
