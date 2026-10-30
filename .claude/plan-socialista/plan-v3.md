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

**La Gran Ley está hecha (G1-G12 en main; G13 a medias).** «Los Remates» también (main 42b230d, 30/10). «El Cierre» también (C1-C4, 30/10): iconos en la mañana y el cajón, horas de comer que siguen a la guardia. **El plan está terminado.**

## Por hacer

### «El Cierre» (lo último del plan) · **HECHA · 30/10** · delegada el 2026-10-30 · sesión «El Cierre · iconos y horas de comer»

[v3-cierre] «terminamos de una vez ya la app entera» (2026-10-30). **Aprobada por delegación**: ~3,5 M; el Consejo elige
la maqueta, decide y pasa a `main`.

| # | Sesión | Tipo | Quién hace qué | Presupuesto |
|---|---|---|---|---|
| ~~C1~~ | ✅ Maqueta de iconos: `ico()` (fig/iconos.js) en la barra de abajo y en la tabla `ICO` de Hoy (~10 iconos), con el muestrario de `design/arte/direccion/iconos/` y la letra nueva de los Remates; el Consejo elige [aparc-arte-iconos] | maqueta | sonnet | ~0,9 M |
| ~~C2~~ | ✅ Construir los iconos (sin romper las pruebas que buscan emoji: cambiarlas solo en el icono) | construir | sonnet con ficha | ~1,0 M |
| ~~C3~~ | ✅ Horas de comer que siguen a guardias y salientes (desayuno, comida, cena según jornada/guardia/saliente que ya conoce la app) [v3-horas-guardia] | construir | sonnet con ficha | ~1,0 M |
| ~~C4~~ | ✅ Cierre: verificador a 412×915, suite completa, sella, main, Actions | arreglo | sonnet | ~0,6 M |

### «Los Remates» (lo que quedaba aparcado) · Consejo 2026-10-30 (3.ª) · acta `consejo/2026-10-30-3.md`

[v3-remates] «que me digan cómo lo van a solucionar; lo que quede por aprobar, que lo debatan en sesión» (2026-10-30).
**HECHA · main 42b230d · 30/10** (aprobada por delegación: ~4,8 M, L2 entera, supuestos decididos en el acta). Sesiones «Remates · L<n> · …».

| # | Sesión | Tipo | Quién hace qué | Presupuesto |
|---|---|---|---|---|
| ~~L1~~ | ✅ 396a-f · Arreglos: «100 g de ajo» → ración real [aparc-vit-b6-ajo]; Fintonic presupuesto y miles [aparc-fin-presupuesto]; noches sin dato de la barrita de Sueño como botón, 7 noches [aparc-sueno-noche-olvidada] | arreglo | sonnet con ficha | ~1,4 M |
| ~~L2~~ | ✅ `maquetas/remates.html` · Maqueta: letra ≥11 px y botones 44 px [aparc-rotulos-10px] [aparc-entreno-letra]; línea «Te faltan N noches» en Hoy [aparc-sueno-sitio]; viaje a mano + enlaces [v3-viajes]; casilla «minutos de móvil» [enc-bienestar-digital] — lo que apruebe el usuario | maqueta | sonnet | ~0,9 M |
| ~~L3~~ | ✅ 397a-d · Construir lo aprobado en L2 (y ninguna letra del 4:20 bajo 11 px) | construir | sonnet con ficha | ~1,5 M |
| ~~L4~~ | ✅ registro al día · Supuestos: ratificar 18, revisar 4 (r5-comer, r4-fintonic, comer-reloj1, nutri) | arreglo | haiku/sonnet | ~0,3 M |
| ~~L5~~ | ✅ 3 min 58 s, 5 trozos y `tests/siembra-70.js` · Suite con siembra, tope 1 sesión, meta 3,5-4 min [aparc-suite-siembra] | herramientas | opus | ~0,7 M |

Vigilar sin sesión: [aparc-reloj-324] [aparc-lloret-suite]. Aplazado hasta después de L3: [aparc-arte-iconos]. Descartado: leer el uso de pantalla automáticamente (una web no puede).

### «La Gran Ley» (todo lo pendiente) · Consejo 2026-10-30 · acta `consejo/2026-10-30.md`

[v3-gran-ley] «todas las mejoras de bitácora y todo lo que quedaba por hacer quiero que se haga ya» (2026-10-30).
**Delegada en el Consejo** (~20 M, incluye los ~15 M de La Reforma): maquetas, qué se quita y paso a `main`.
**Parte aprobado por el usuario (30/10)** (`consejo/2026-10-30-parte.md`): Gmail fuera; 4:20 con cortina de PIN (G10);
sin pantallas 45 min antes de la cama, fijo en el código (G11); parte lunes y jueves 7:40 (se programa en la G1). Absorbe R4-R10, S6,
S7, v3-entrenador, v3-coach, aparc-arte-energia, v3-420-*, v3-viajes (sin red), el lector, comida-entreno,
sueño-vistas, bienestar digital, suite-2min, png-design, tu-mes-r2 y hoy-plantilla. Aplazados: iconos y Gmail.
Sesiones «Gran Ley · G<n> · …»; 6 supuestos se preguntan en cada cierre de G1-G4.

| # | Sesión | Tipo | Quién hace qué | Presupuesto |
|---|---|---|---|---|
| ~~G1~~ | ✅ main 0d867cf · 30/10 · 1,7 M (se pasó: todo en opus) · vaso con muestra a rayas, aviso de plantilla con aire, pizza sin coma y vitaminas sin dulces, «Anotar anoche» en Reloj y Línea, R4 comprobada, parte programado (lu y ju 7:40) · pruebas 372-375 | arreglo | sonnet; haiku textos | ~1,0 M |
| ~~G2~~ | ✅ 30/10 · `maquetas/comer-g2.html` · **completa la R5** (`comer-reforma.html`, que manda en proteína, receta, compra y nevera): «Escribir lo comido» arriba en Hoy y el antojo de microondas S7 (≤5 min · ≥20 g, dos alternativas, «Apuntar que me lo he comido») · sin concurso (Consejo por delegación, acta `consejo/2026-10-30-g2.md`) · ~0,6 M | maqueta | sonnet monta, haiku textos | ~1,5 M |
| ~~G3~~ | ✅ main 56f30af · 30/10 · adelantada (sesión R6, con la maqueta R5) · compra base con un toque restando la casa, semana por caducidad, hoja del reparto según tu semana, zona ❄ Congelador, pescado 4 × 250 g, 8 platos que congelan bien (lista), `dishes[].congela` · pruebas 376-379 · ficha `fichas/reforma-r6-compra-congelador.md` | construir | sonnet con ficha | ~2,0 M |
| ~~G4~~ | ✅ 30/10 · proteína en Hoy a 1,6 g/kg (solo si faltan >30 g, una sugerencia de la nevera; guardia «lo que se pueda»), aviso tras entreno (2 h), la frase arriba en Comer → Hoy con lupa (una sola caja), barra de Comer con el mismo número · S6 ya cubierta (no se construye) · pruebas 380-383 · ~2,1 M (se pasó: dos suites completas y retoques) | construir | sonnet | ~1,2 M |
| ~~G5~~ | ✅ 30/10 · página de receta (hoja de Comer: tachar ingredientes, Añadir a la compra, Ver en TikTok fuera, Compartir sin datos), cola de TikTok en Importar, antojo de microondas (7 recetas ≤5 min · 23-31 g) en Hoy y Comer · pruebas 384-386 · 1,0 M | construir | sonnet | ~1,5 M |
| ~~G6~~ | ✅ 30/10 · `maquetas/entreno-g6.html` · Lo que toca hoy, 3 dibujos de dos posturas, una serie por toque, +2,5 kg, récord discreto, día saliente · sin concurso (Consejo por delegación) · ~0,3 M | maqueta | sonnet | ~1,0 M |
| ~~G7~~ | ✅ 30/10 · 12 ejercicios dibujados con ficha (`fig/ejercicios.js`, «Cómo se hace» en la sesión), reps de la vez anterior, «Prueba +X kg» en Lo que toca hoy (progresión doble con `progresionDe`), récord discreto, saliente 25 min al 65 % / movilidad / descanso, guardia «Hoy no toca» · pruebas 387-391 · ~1,4 M | construir | sonnet dibujos y obra | ~2,0 M |
| ~~G8~~ | ✅ 30/10 · lector de comida rápida: 12 productos y «Menú Big Tasty» nuevos (100 Montaditos, Happy Meal, Big Tasty…), «menú … con coca cola zero» cambia la bebida, menú del día ~1110 kcal, «un paquete de» = paquete individual · 50 frases nuevas (891) · prueba 392 · la 244 ya no depende de la hora | construir | sonnet | ~0,8 M |
| ~~G9~~ | ✅ 30/10 · `maquetas/la-noche-2.html` · energía y coach, sin pantallas fijo, cortina con PIN, descanso del 4:20, ajustes · sin concurso (Consejo por delegación) · ~0,2 M | maqueta | sonnet | ~1,5 M |
| ~~G10~~ | ✅ 30/10 · cortina con PIN (solo hash con sal; 5 fallos = 30 s; se cierra al salir, al cerrar y tras 2 min) y neutro fuera del 4:20 (Más, Hoy, Tu semana, hábitos, conductor), quitarla desde Copia de seguridad; descanso 7/14/21 o a la mitad con «seguimos desde aquí» · pruebas 393a-d · revisión de seguridad hecha | construir | sonnet | ~1,5 M |
| ~~G11~~ | ✅ 30/10 · energía del día (4 tramos) y UNA recomendación del coach en Hoy (sin puntuar), sin pantallas 45 min antes de la cama, fijo y sin botón, aviso al empezar, ✓ por la mañana sin racha, guía de «Hora de dormir» · pruebas 394a-c | construir | sonnet | ~2,0 M |
| ~~G12~~ | ✅ 30/10 · modo viaje sin red en Ajustes → YO: rachas en pausa (hábitos, entreno, sin pantallas, coach), Hoy en viaje, salida a mano con aviso, billete como gasto en «viajes» 🧳, resumen al volver · pruebas 395a-c · maqueta `maquetas/modo-viaje.html` | maqueta → construir | sonnet | ~2,5 M |
| ~~G13~~ | ½ 30/10 · PNG ✅ (70 → 22 MB, `design/` fuera de la caché de sw.js) · **suite en ~2 min NO conseguida**: más trozos no acelera (12 trozos 272 s y `actualiza` cae; cada navegador gasta CPU) y la cadena 1-201 no se parte sin siembra → aparcado [aparc-suite-siembra] · DECISIONS «Gran Ley · G13» | herramientas | sonnet + haiku | ~1,4 M |

Las tablas de abajo (Comer, La Reforma, «Después») quedan como historia: lo que falta de ellas está en esta cola.

### Tanda Comer (+ las pruebas y Dinero) · planificada el 2026-10-27 · al día el 2026-10-28: 7 de 9 hechas

Las tareas 1, 2, 3, 4, 5, 9 y 13 de la lista anterior, agrupadas en **8 sesiones** para gastar menos. Cada una
empieza con su ficha (skill `ficha-de-tarea`) y se mide al cerrar. Presupuestos en equivalentes (ver `gastos.md`):
son **estimaciones** hasta tener medidas; las dos primeras sesiones calibran el resto.

| # | Sesión | Tareas | Tipo | Quién hace qué | Presupuesto |
|---|---|---|---|---|---|
| ~~S1~~ | ✅ Las pruebas de la fecha: se pusieron verdes solas al pasar el día 27 (751/751) | [aparc-pruebas-fecha] | arreglo | sesión en sonnet, sin ayudantes; suite con `verificador` | ~0,4 M |
| ~~S2~~ | ✅ El mapa de Comer: concurso de 4 escuelas, gana **El reloj** (`maquetas/comer-debate-1-reloj.html` + `comer-escribir.html`; buscador y ficha de `comer-mapa.html`) · DECISIONS «El mapa de Comer» · 3,5 M (el concurso lo pidió el usuario) | [v3-comer-perdido] + dónde van [v3-cantidades], [v3-boceto-semana], [v3-antojos] y [comida-ri-A/D] | maqueta | — | ~1,5 M |
| ~~S2b~~ | ✅ main 2e30a00 · 2,3 M · **El lector de frases a fondo**: lo que escribes («he comido…») lo entiende casi siempre; banco de ~300 frases reales (bares, hospital, cadenas, Mercadona, listas con comas), clasificar fallos y arreglarlos por tipo, cada uno con su caso en `tests/frases.json`; que cada cosa diga su seguridad (✓ / ≈ / ?) para la pantalla de `comer-escribir.html` | [v3-lector] | construir | haiku escribe las frases; opus clasifica y decide; constructor sonnet arregla `fraseLeer` (app.js:9795) por tipos; `verificador` pasa `npm run test:frases` | ~2,0 M |
| ~~S3~~ | ✅ main 9b53fd3 · 3,1 M + 12,1 M · Construir el Comer del reloj (línea del día, semana a mano con compra sacada de lo apuntado, nevera dibujada, escribir lo comido; buscador y ficha con vitaminas) — empieza con su ficha (`ficha-de-tarea`); quizá en 2 sesiones | [v3-comer-perdido] + [v3-boceto-semana] + [comida-ri-A] | construir | opus dirige con la ficha; constructor sonnet; `verificador` | ~1,8 M ×2 |
| ~~S4~~ | ✅ Cantidades y ración de verdad · main 3b7a617 · sin medir | [v3-cantidades] + [comida-ri-B] | construir | constructor sonnet; `verificador` | ~1,2 M |
| ~~S5~~ | ✅ (D) Nutri-Score, NOVA y aditivos · main 2416c99 · sin medir; (A) vitaminas y minerales hechas en la S3b | [comida-ri-A] | construir | constructor sonnet | ~0,5 M |
| S6 | La semana en borrador (ojo: la S3b ya hizo la semana a mano y «¿Me la propones?»; al abrir, decidir qué queda) | [v3-boceto-semana] | construir | constructor sonnet; `verificador` | ~1,3 M |
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
| ~~V0~~ | ✅ Concurso «La Vuelta» hecho: jurado 1.º La Sobremesa (10), luego Reloj de Sol, Tortuga y Sofá (9) · 2.ª ronda (6 sonnet, explicación en 45 s, bases `consejo/2026-10-28-la-vuelta-ronda2.md`) · **espera tus notas** · 3,9 M + ~2,4 M | [v3-vuelta-maqueta] | maqueta | escuelas sonnet/haiku; jurado haiku a ciegas | ~3,2 M |
| ~~V1~~ | ✅ main 3170dc0 · Entreno: franja fija 15:00-16:00 entre semana (`gymHoraDe`, `ENT_HORAS`), parque el finde con rutina sin material de openGym, sesión mínima de 25 min, guardia/saliente sin fallo; la vuelta al 35 % +10/semana (`REGRESO_RITMO`, sin romper un plan en curso) y racha por semanas | [v3-entreno-franja] + [v3-vuelta-35] | construir | sonnet con ficha; `verificador` | ~1,8 M |
| ~~V2~~ | ✅ main 3170dc0 · objetivo de peso + **dos dibujos (Teide y Bancales) en Ajustes** · V1+V2 ~3,7 M · Comer: objetivo de peso (kg y fecha, 0,5 kg/sem por defecto, tope 1 %/sem, suelo basal y 1.500 kcal, media de 7 días, sin sumar kcal del entreno) atado al plan semanal; gráfica del peso; `/revisa-seguridad` | [v3-peso-objetivo] | construir | sonnet con ficha; `verificador` | ~1,0 M |

Orden (Consejo, 2026-10-28): V0 → el usuario elige → **S3b** (ya aprobada) → V1 → V2. [aparc-comida-entreno] se cierra en V1
(con entreno a las 15:00 la comida de después pasa a ~16:30). V1 es el primer trozo de [v3-entrenador].

### Tanda «Ley de La Noche» (los tiempos del día: Lloret, cama, despertar y salir) · Consejo 2026-10-29 · acta `consejo/2026-10-29.md`

[v3-calendario-sueno] «mejorar la parte principal del calendario… me estoy yendo al Lloret a fumar tarde, me acuesto
tarde y me cuesta despertarme a las 6:45, llego tarde al curro; que la app me ayude con los tiempos» (2026-10-29).
**Aprobada por delegación** (29/10): arriba (c), cama (b) 15 min cada 3 días, avisos (a) alarmas del móvil; ~4,5 M;
el Consejo elige la maqueta y pasa a main. Sesiones tituladas «Ley de La Noche · N<n> · …». Va antes de [v3-coach].

| # | Sesión | Tipo | Quién hace qué | Presupuesto |
|---|---|---|---|---|
| ~~N0~~ | ✅ 29/10 · gana **A · El cartel** (`maquetas/la-noche-a-cartel.html`, acta «N0 · la maqueta elegida») · Maquetas de arriba de Hoy (próxima hora + cadena Lloret → casa → cama → despertador → bus) en Conductor y en lista; «He vuelto» / «He llegado»; pantalla de alarmas del móvil · sin concurso | maqueta | opus dirige, sonnet maqueta; `verificador` | ~1,5 M |
| N1 | Construir la cuenta atrás (un componente para los 4 modos; sustituye a `horasSuenoHTML` y `suenoHoyCardHTML`) | construir | sonnet con ficha | ~1,2 M |
| N2 | Medir y avisar: vuelta del Lloret, llegada al trabajo, 3 diferencias de la semana, alarmas, `.ics` opcional apagado | construir | sonnet con ficha; haiku textos y pruebas | ~1,2 M |
| N3 | Cierre: suite, sella, main, capturas a 412×915 | arreglo | sonnet | ~0,6 M |

### Tanda «La Reforma» (Dinero, Comer y Entreno) · Consejo 2026-10-29 (2.ª) · acta `consejo/2026-10-29-2.md`

[v3-reforma] «nueva reforma y hacerla ya»: fijos más bonitos y «te queda», gasto grande frente al ahorro, Fintonic
mal («300 y pico en belleza»), la compra base (pollo, lomo, pescado de 1 kg) hecha semana con platos congelables,
proteína, recetas de TikTok con su página, ejercicios con dibujo que enganchen, Hoy con dinero y trabajo (2026-10-29).
**Aprobada por delegación** (29/10): ~15 M; el Consejo elige maquetas y pasa a main; Bosque y Ahorro juntos del todo; recetas con botón Compartir. Sesiones «La Reforma · R<n> · …».

| # | Sesión | Tipo | Quién hace qué | Presupuesto |
|---|---|---|---|---|
| ~~R1~~ | ✅ 29/10 · gana **El Vaso** → `maquetas/dinero-tu-mes.html` (acta 2026-10-29-2, «R1») · **Concurso de Dinero** (antes R2): 4-5 escuelas baratas (sonnet/haiku) maquetan «Tu mes» moderno: con cuánto empiezas el mes, los fijos, lo que te queda, con cuánto acabarás y cuánto ahorras **este mes**; el gasto grande; Bosque y Ahorro juntos; la línea de Hoy. Jurado a ciegas y el Consejo elige (por delegación) | maqueta | escuelas sonnet/haiku; jurado haiku; Artes Visuales opus deja la ganadora navegable | ~2,5 M |
| ~~R2~~ | ✅ main 7942d02 · 30/10 · sin medir · Construir «Tu mes» con la maqueta `maquetas/dinero-tu-mes.html` (El Vaso): vaso y cadena 2.380 − 728 − 750, fijos → te queda, «acabarás con» y «ahorras este mes» + línea en Hoy. El gasto grande y el Bosque quedan para R3 | construir | sonnet con ficha | ~1,2 M |
| ~~R3~~ | ✅ main 0561783 · 30/10 · 2,2 M · Construir gasto grande + Bosque y Ahorro juntos, mirando a meses (ficha `fichas/reforma-r3-gasto-grande.md`) | construir | sonnet con ficha | ~1,8 M |
| ~~R4~~ | ✅ main 8786ed2 · 30/10 · 1,2 M (con parte y salud) · Fintonic en pequeño: renombrar y quitar filas en la revisión, aviso si no cuadra (ficha `fichas/reforma-r4-fintonic.md`) | arreglo | sonnet | ~0,8 M |
| ~~R5~~ | ✅ rama claude/magical-clarke-dlp8mb-r5 · 30/10 · maqueta aprobada `maquetas/comer-reforma.html` (ficha `fichas/reforma-r5-comer.md`) | maqueta | opus + sonnet | ~1,5 M |
| ~~R6~~ | ✅ main 56f30af · 30/10 (= G3) · Construir compra base + congelador | construir | opus dirige, sonnet | ~2,0 M |
| R7 | Construir proteína en Hoy + semana básica (absorbe la S6) | construir | sonnet | ~1,2 M |
| R8 | TikTok: enlace guardado, cola, compartir a la app, página de receta | construir | sonnet con ficha | ~1,2 M |
| R9 | Maqueta de Entreno: 3 ejercicios dibujados + «Lo que toca hoy» | maqueta | opus + sonnet | ~1,0 M |
| R10 | Construir Entreno: 12 dibujos, un toque por serie, «prueba +2,5 kg», récord (absorbe el primer trozo de [v3-entrenador]) | construir | haiku dibujos, sonnet obra | ~2,0 M |

Orden (Consejo, 2026-10-29; rehecho el mismo día tras hablar el usuario): Dinero primero y Fintonic en pequeño detrás; R1 → R10, antes de «Después». S6 y S7 de la tanda Comer: S6 entra en R7; S7 sigue aparte.

### Tanda «El Chef» (Consejo, 2026-10-30 · acta `consejo/2026-10-30-chef.md`) · **espera al usuario** (presupuesto ~10 M y 3 preguntas)

Recetario sin gluten (España, Italia, Grecia, Mediterráneo), semana con esos platos, modo cocina que enseña, compra, y
la app que sigue a su cocina («la continuidad»: hoy micro + vitro pequeña, sin horno ni freidora de aire). Maqueta
general aprobada: `maquetas/recetario.html`. **El Chef I** = CH1-CH8 (~6,9 M, a `main` al cerrar la CH8) · **El Chef II** = CH9-CH11 (~2,7 M).

| Clave | Qué | Tipo | Quién | Presupuesto |
|---|---|---|---|---|
| CH1 | Ficha, esquema del JSON (equipo, cocina, dificultad, días, por qué, error, `tmp`), `tests/recetario.test.js`, alimentos que faltan, catálogo corregido y ampliado | datos | sonnet con ficha | ~0,7 M |
| CH2 | «A la compra» desde la receta → compra de la semana (pasillos, sin gluten, «ya lo tengo») | construir | sonnet con ficha | ~0,9 M |
| CH3 | Maqueta corta: modo cocina, «Tu cocina», filtro Cocina, «Estoy reventado», aviso «Cambiado» de TikTok | maqueta | opus + sonnet | ~0,6 M |
| CH4 | Primeros ~60 platos enteros, para micro + vitro | datos | sonnet (+ haiku en arreglos) | ~0,6 M |
| CH5 | Recetario navegable (JSON de carga perezosa en `sw.js`, filtros) + «Tu cocina» ampliando `cocinaPref` | construir | sonnet con ficha | ~0,9 M |
| CH6 | Modo cocina: temporizadores, pantalla encendida, «tenlo a mano», por qué, conservación | construir | sonnet con ficha | ~0,9 M |
| CH7 | Semana con el recetario + reglas de Sanidad + 1 fuego / ≤6 raciones por olla + «Estoy reventado» | construir | sonnet con ficha | ~0,9 M |
| CH8 | TikTok → sin gluten al importar + «Mis marcas seguras» (según la respuesta) | construir | sonnet con ficha | ~0,9 M |
| CH9 | Resto del catálogo entero (~270 platos), por lotes | datos | sonnet ×5 | ~1,5 M |
| CH10 | Ruta de 8 técnicas + «Ahora puedes hacer N platos más» al ganar horno | construir | sonnet con ficha | ~0,6 M |
| CH11 | Cierre: verificador, suite, sella, `main`, Actions | arreglo | sonnet | ~0,6 M |

### Después (sin planificar todavía)

0. [v3-viajes] **Viajes y vacaciones** (2026-10-29, «un poco más adelante»), con su propio Consejo (Sanidad + Bienestar): el vuelo (hora, aeropuerto), a qué hora salir de casa, bus o taxi y cómo está la carretera, el billete apuntado como gasto (y si va a Madrid a menudo, como fijo); y **la rutina en vacaciones**: la app es para la continuidad, y en vacaciones no se usa ni hace falta apuntar: debatir cómo ayudar sin romper rachas y cómo volver. Primeras notas en el acta `consejo/2026-10-29-2.md` · maqueta → construir
1. [v3-420-clave] 4:20 con contraseña (solo esa parte, cambiable desde dentro) · construir
2. [v3-420-descanso] 4:20 que relacione lo que fumas con el descanso y la energía, y ayude a bajar · maqueta → construir
3. [v3-entrenador] Entreno como entrenador propio basado en ciencia (la vuelta tras un parón ya está) · maqueta → construir
4. [v3-coach] La app como entrenador de tu persona (descanso, comida, entreno, el día de Lloret) · maqueta → construir
5. [aparc-arte-energia] Arte: la energía del día que se gasta y se recarga · maqueta → construir
6. ~~[aparc-arte-iconos]~~ ✅ El Cierre C1-C2

## Ideas (dichas, sin ordenar ni aclarar)

- [v3-mapa-comidas] (2026-10-30) Un mapamundi tipo Google Maps que vea dónde estoy ahora, poder decir «en este sitio he comido aquí» y guardar una foto de lo que he comido (de vacaciones o al salir de trabajar). A futuro. Ojo, regla 3: la ubicación y las fotos se quedan en el móvil (IndexedDB, no localStorage); los mosaicos del mapa (OpenStreetMap) se piden por red y dejan ver por dónde andas, así que decide el usuario.
- (de la S3b) «pizza barbacoa 3 porciones» sin coma no la entiende; la sugerencia de vitaminas sin nevera propone el alimento más rico (p. ej. chocolate negro): afinar · DECISIONS «El Comer del reloj, sesión 2»
- ~~(→ El Cierre C3) [v3-horas-guardia]~~ ✅ hecho 30/10 · Que las horas de comer (desayuno 9:00, cena 21:30…) sigan a guardias y salientes (Consejo 30/10, 3.ª)
- [v3-lector-resto] Lo que el lector aún no sabe (S2b): cartas que faltan (Happy Meal, Big Tasty, Double Cheeseburger, tacos de carne de Taco Bell), «menú del día de X: sándwich club» pone el pan dos veces, «un paquete de…» (¿entero?). DECISIONS «El lector de frases a fondo».

- ~~[v3-gmail]~~ fuera del plan (parte aprobado 30/10)
- [aparc-comida-entreno] Los días de entreno a las 18:30, ¿la comida después del entreno?
- [aparc-sueno-vistas] / [aparc-sueno-sitio] Apuntar el sueño en Estación, Reloj y Línea; dónde vive el sueño en Hoy
- [enc-bienestar-digital] Uso real de pantalla y un hábito «sin pantallas» fijo
- [aparc-parte-diario] El parte cada mañana solo (falta la hora)
- [aparc-suite-2min] La suite en ~2 minutos
- [aparc-regleta-pisa] En la regleta de la mañana de Hoy, «Vestirse» y «Salir de casa» se pisan un poco (visto en El Cierre, 30/10)
- [aparc-png-design] Comprimir los PNG de `design/` (74 MB)

## Hecha

- [v3-cierre] El Cierre C1-C4: iconos dibujados en los pasos de la mañana y el cajón «Más» (ducha y camiseta nuevos), horas de comer que siguen a la guardia y al saliente · pruebas 398-399 · 2026-10-30

- [v3-remates] Los Remates L1-L5: ración real en vitaminas, Fintonic (presupuesto, miles, quitar fila), sin compensar en guardia, 7 noches tocables, letra ≥11 px y botones 44 px, «Te faltan N noches» en Hoy, vuelo a mano con Maps/DGT, minutos de móvil, suite en ~4 min · main 42b230d · 2026-10-30

- [v3-reforma-r1] La Reforma · R1 · Concurso «Tu mes»: 5 escuelas sonnet, jurado haiku a ciegas, gana El Vaso; navegable en `maquetas/dinero-tu-mes.html` · rama ccr-874ee141-nk8306 (maqueta, no va a main) · 2026-10-29
- [v3-ley-noche] Ley de La Noche N1-N3 · main ec1370b · 2026-10-29
- [v3-la-vuelta] La Vuelta: entreno 15-16 y parque, sesión mínima, vuelta al 35 %, objetivo de peso con topes, lámina del Teide o de los Bancales con «Explícamelo · 45 s» · main 3170dc0 · ~11,7 M la sesión entera (Consejo + 2 rondas + obra) · 2026-10-29

- [v3-dinero] Tanda Dinero D1-D6 por delegación al Consejo: el Bosque (portada), Gastos, Ahorro con objetivo a fecha y «Ya ha llegado la nómina», Compras con espera de 30 días; lo viejo quitado (−664 líneas) sin borrar datos; migración `dinero3Migra` · main · ~10 M (presupuesto 4,9) · 2026-10-28

- [v3-gobierno] El gobierno del repositorio y el Consejo de Ministros (copiado de fiebres-neutropenias); primer
  Consejo: la reforma de Dinero; feria (3 rondas) y concurso «La Rara» (2 rondas): gana La Laurisilva · 2026-10-28

- [v3-comer-reloj] S3 · El Comer del reloj en 2 sesiones: línea del día, escribir lo comido con rueda por fila; Comer en Hoy · Semana · Casa (semana a mano, compra con origen, nevera dibujada), vitaminas «% diario» e investigar · main 9b53fd3 (run 40759212824) · 3,1 M + 12,1 M · 2026-10-28
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
