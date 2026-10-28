# Plan de la versión 3.0

El tablero de la reestructuración. **Una tarea = una sesión** (CLAUDE.md). Lo lee `/bitacora` (para contarlo) y
`/plan-socialista` (para proponer la siguiente); lo escribe Claude al cerrar cada tarea (traspaso, paso 7 de
`cierra-y-despliega`) y cuando el usuario dice algo nuevo («apunta en el plan…»). El usuario puede tocarlo a mano.

- **Estados:** `en marcha` (hay una sesión con ella) · `por hacer` (en orden: la primera es la siguiente) · `hecha`
  (con commit de `main` y fecha) · `idea` (dicha, sin ordenar ni aclarar).
- **Tipo** (para el gasto, ver `gastos.md`): `arreglo` · `maqueta` (diseño para elegir) · `construir` (llevar una
  maqueta aprobada a la app) · `estudio` · `herramientas` (skills, pruebas, nada que vea el usuario).
- **Coste:** el presupuesto del tipo en `gastos.md` antes de empezar; lo medido, al cerrar.

## En marcha

**La Tanda Dinero está hecha y en main** (D1-D6, por delegación; acta `consejo/2026-10-28-dinero-ejecucion.md`).
**S3, sesión 1 hecha** en la rama `claude/magical-clarke-dlp8mb` (línea del día + escribir lo comido con rueda por fila; suite 754/754), **sin pasar a main**. Ficha: `fichas/v3-comer-reloj.md`. **La siguiente: S3b** (sesión nueva: «/plan-socialista y haz la S3b»): Mi semana a mano, compra de lo apuntado, nevera dibujada, vitaminas, e «investigar» lo desconocido.

## Por hacer

### Tanda Comer (+ las pruebas y Dinero) · planificada el 2026-10-27 · al día el 2026-10-28: 5 de 9 hechas

Las tareas 1, 2, 3, 4, 5, 9 y 13 de la lista anterior, agrupadas en **8 sesiones** para gastar menos. Cada una
empieza con su ficha (skill `ficha-de-tarea`) y se mide al cerrar. Presupuestos en equivalentes (ver `gastos.md`):
son **estimaciones** hasta tener medidas; las dos primeras sesiones calibran el resto.

| # | Sesión | Tareas | Tipo | Quién hace qué | Presupuesto |
|---|---|---|---|---|---|
| ~~S1~~ | ✅ Las pruebas de la fecha: se pusieron verdes solas al pasar el día 27 (751/751) | [aparc-pruebas-fecha] | arreglo | sesión en sonnet, sin ayudantes; suite con `verificador` | ~0,4 M |
| ~~S2~~ | ✅ El mapa de Comer: concurso de 4 escuelas, gana **El reloj** (`maquetas/comer-debate-1-reloj.html` + `comer-escribir.html`; buscador y ficha de `comer-mapa.html`) · DECISIONS «El mapa de Comer» · 3,5 M (el concurso lo pidió el usuario) | [v3-comer-perdido] + dónde van [v3-cantidades], [v3-boceto-semana], [v3-antojos] y [comida-ri-A/D] | maqueta | — | ~1,5 M |
| ~~S2b~~ | ✅ main 2e30a00 · 2,3 M · **El lector de frases a fondo**: lo que escribes («he comido…») lo entiende casi siempre; banco de ~300 frases reales (bares, hospital, cadenas, Mercadona, listas con comas), clasificar fallos y arreglarlos por tipo, cada uno con su caso en `tests/frases.json`; que cada cosa diga su seguridad (✓ / ≈ / ?) para la pantalla de `comer-escribir.html` | [v3-lector] | construir | haiku escribe las frases; opus clasifica y decide; constructor sonnet arregla `fraseLeer` (app.js:9795) por tipos; `verificador` pasa `npm run test:frases` | ~2,0 M |
| S3 | Construir el Comer del reloj (línea del día, semana a mano con compra sacada de lo apuntado, nevera dibujada, escribir lo comido; buscador y ficha con vitaminas) — empieza con su ficha (`ficha-de-tarea`); quizá en 2 sesiones | [v3-comer-perdido] + [v3-boceto-semana] + [comida-ri-A] | construir | opus dirige con la ficha; constructor sonnet; `verificador` | ~1,8 M ×2 |
| ~~S4~~ | ✅ Cantidades y ración de verdad · main 3b7a617 · sin medir | [v3-cantidades] + [comida-ri-B] | construir | constructor sonnet; `verificador` | ~1,2 M |
| S5 | ✅ (D) Nutri-Score, NOVA y aditivos · main 2416c99 · sin medir — **falta (A) vitaminas y minerales** | [comida-ri-A] | construir | constructor sonnet | ~0,5 M |
| S6 | La semana en borrador | [v3-boceto-semana] | construir | constructor sonnet; `verificador` | ~1,3 M |
| S7 | Antojos con recetas de microondas | [v3-antojos] | construir | recetas: opus breve (criterio de nutrición); pantalla: constructor sonnet | ~0,9 M |
| ~~S8~~ | → **Tanda Dinero** (D1-D6, Consejo 28/10) | [v3-dinero-compras] | **informe primero** (tú das tus ideas → informe de cómo resolverlo → tu visto bueno) → maqueta → construir | informe y maquetas opus; constructor sonnet | ~0,4 M informe + ~2,0 M |

**Total: ~10 M** frente a **~14 M** haciéndolas una a una (cinco rondas de maquetas por separado y cada sesión
descubriendo Comer desde cero).

De dónde sale el ahorro:
- **S1 primero:** con la suite en rojo no se puede pasar nada a `main`; cada sesión acabaría rehaciendo pruebas.
- **Una sola ronda de maquetas (S2) para todo Comer** en vez de cinco: ordenar Comer después de meterle cosas
  obligaría a rediseñarlas. Ahorra ~3 M.
- **Juntar lo que toca lo mismo:** cantidades con ración (S4), vitaminas con Nutri-Score (S5, la misma petición a
  Open Food Facts).
- **La ficha de cada tarea** guarda lo descubierto: quien construye no relee `app.js`.
- **Sonnet para construir, haiku para buscar, opus solo para diseñar y dirigir.** Y las sesiones mecánicas (S1)
  se pueden abrir directamente en sonnet.
- Pruebas solo las tuyas mientras se trabaja; la suite completa una vez, al final, con el `verificador`.

### Tanda La Vuelta (Entreno + objetivo de peso) · Consejo 2026-10-28 · acta `consejo/2026-10-28-deporte.md`

| # | Sesión | Tareas | Tipo | Quién hace qué | Presupuesto |
|---|---|---|---|---|---|
| V0 | Concurso «La Vuelta» (6 escuelas: 4 sonnet + 2 haiku) · bases `consejo/2026-10-28-la-vuelta-bases.md` · en marcha 2026-10-28 | [v3-vuelta-maqueta] | maqueta | escuelas sonnet/haiku; jurado haiku a ciegas | ~3,2 M |
| V1 | Entreno: franja fija 15:00-16:00 entre semana (`gymHoraDe`, `ENT_HORAS`), parque el finde con rutina sin material de openGym, sesión mínima de 25 min, guardia/saliente sin fallo; la vuelta al 35 % +10/semana (`REGRESO_RITMO`, sin romper un plan en curso) y racha por semanas | [v3-entreno-franja] + [v3-vuelta-35] | construir | sonnet con ficha; `verificador` | ~1,8 M |
| V2 | Comer: objetivo de peso (kg y fecha, 0,5 kg/sem por defecto, tope 1 %/sem, suelo basal y 1.500 kcal, media de 7 días, sin sumar kcal del entreno) atado al plan semanal; gráfica del peso; `/revisa-seguridad` | [v3-peso-objetivo] | construir | sonnet con ficha; `verificador` | ~1,0 M |

Orden (Consejo, 2026-10-28): V0 → el usuario elige → **S3b** (ya aprobada) → V1 → V2. [aparc-comida-entreno] se cierra en V1
(con entreno a las 15:00 la comida de después pasa a ~16:30). V1 es el primer trozo de [v3-entrenador].

### Después (sin planificar todavía)

1. [v3-420-clave] 4:20 con contraseña (solo esa parte, cambiable desde dentro) · construir
2. [v3-420-descanso] 4:20 que relacione lo que fumas con el descanso y la energía, y ayude a bajar · maqueta → construir
3. [v3-entrenador] Entreno como entrenador propio basado en ciencia (la vuelta tras un parón ya está) · maqueta → construir
4. [v3-coach] La app como entrenador de tu persona (descanso, comida, entreno, el día de Lloret) · maqueta → construir
5. [aparc-arte-energia] Arte: la energía del día que se gasta y se recarga · maqueta → construir
6. [aparc-arte-iconos] Arte: los iconos con vida propia · maqueta → construir

## Ideas (dichas, sin ordenar ni aclarar)

- [v3-lector-resto] Lo que el lector aún no sabe (S2b): cartas que faltan (Happy Meal, Big Tasty, Double Cheeseburger, tacos de carne de Taco Bell), «menú del día de X: sándwich club» pone el pan dos veces, «un paquete de…» (¿entero?). DECISIONS «El lector de frases a fondo».

- [v3-gmail] «La función de Gmail»: falta que digas qué es
- [aparc-comida-entreno] Los días de entreno a las 18:30, ¿la comida después del entreno?
- [aparc-sueno-vistas] / [aparc-sueno-sitio] Apuntar el sueño en Estación, Reloj y Línea; dónde vive el sueño en Hoy
- [enc-bienestar-digital] Uso real de pantalla y un hábito «sin pantallas» fijo
- [aparc-parte-diario] El parte cada mañana solo (falta la hora)
- [aparc-suite-2min] La suite en ~2 minutos
- [aparc-png-design] Comprimir los PNG de `design/` (74 MB)

## Hecha

- [v3-dinero] Tanda Dinero D1-D6 por delegación al Consejo: el Bosque (portada), Gastos, Ahorro con objetivo a fecha y «Ya ha llegado la nómina», Compras con espera de 30 días; lo viejo quitado (−664 líneas) sin borrar datos; migración `dinero3Migra` · main · ~10 M (presupuesto 4,9) · 2026-10-28

- [v3-gobierno] El gobierno del repositorio y el Consejo de Ministros (copiado de fiebres-neutropenias); primer
  Consejo: la reforma de Dinero; feria (3 rondas) y concurso «La Rara» (2 rondas): gana La Laurisilva · 2026-10-28
- [v3-lector] S2b · El lector de frases a fondo: 838 frases en el banco (antes entendía 61 de 299 nuevas) y `frSeg` (✓/≈/?) para la S3 · main 2e30a00 (run 40732849988) · 2,3 M · 2026-10-28

- [v3-comer-mapa] S2 · El mapa de Comer: gana El reloj (concurso de 4 escuelas) · maquetas en la rama `claude/plan-socialista-s2-hl27a0` · 2026-10-28

- [v3-plan-global] El plan 3.0, los gastos (`tools/gasto.mjs`) y la skill `ficha-de-tarea`, en main · 2026-10-28

- [comida-ri-D] Comer: sello Nutri-Score, NOVA y aditivos en la ficha y la letra en el buscador · main 2416c99 · 2026-10-27
- [v3-cantidades] + [comida-ri-B] Comer: hoja de cantidad (pasos 10·50·100, mantener pulsado, rueda, g/ml, ración de
  la etiqueta) · main 3b7a617 · 2026-10-27
- [aparc-pruebas-fecha] Las 2 pruebas de la fecha, en verde (751/751) · 2026-10-27
- [aparc-auditoria-contexto] Menos contexto: REA fuera de cada sesión, salud solo si cambia main · 2026-10-27

- [comida-ri-C] Comer: el buscador ordenado por popularidad · en main (3bce73b) · 2026-10-27
- [enc-sueno-radio] Sueño: apuntar desde la radio del conductor · main a5bec28 · 2026-10-27
- [v3-plan-vuelta] Entreno: plan para volver tras un parón · main 28e97b3 · 2026-10-20
- [v3-conductor] Hoy: el conductor que explica lo que se ve · main e1aaeda · 2026-10-20
- [fallo-mes-pasado] · [fallo-modo-ordenador] · [mes-frontera] · main e1aaeda / bfa711c / 008fd0d · 2026-10-20
- [v3-mes-colores] + [v3-sin-semana] Mes con el día de su color y sin vista Semana · main 4c09f09 · 2026-10-19
