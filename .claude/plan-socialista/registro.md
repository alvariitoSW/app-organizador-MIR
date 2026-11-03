# Registro del plan socialista

Lo ya contado (para no repetirlo) y lo abierto (hasta que se cierre). Lo escribe Claude en el paso 8;
tú puedes añadir o tachar a mano.

## Encargos aparcados
- [aparc-competencia-fase-3] La Competencia fase 2 en `main` (02/11, ab1be8d). Fase 3 en marcha (03/11): T1 en la rama `claude/la-competencia` (abfa699, 9 commits por delante de `main`); falta subirla a `main` tras arreglar 2 pruebas de fecha. Ver `plan-v3.md`.
- ~~[aparc-competencia-construir]~~ ✅ cubierto por las fases 1 y 2 (en main ab1be8d, 02/11). Antes: Maquetas A y B de La Competencia aprobadas por el usuario (02/11, rama `claude/la-competencia`; opciones recomendadas, a confirmar). Pide `/plan-socialista` con el Consejo para aprobar cómo se construye: `encargos/competencia-construir.md`. No se ha tocado `app.js`.
- ~~[aparc-consejo-competencia]~~ ✅ Consejo hecho (02/11, acta `consejo/2026-11-02-competencia.md`, rama `claude/la-competencia`, 929 k). Aprobado: plan en 3 fases (~38 M, máx. ~50 M), sin Consejo por tanda; PDF y Excel «más adelante»; widget = K4 del Lanzador. **Siguiente:** fase 1, `encargos/competencia-fase-1.md` (02/11); fase 2 el 03/11; fase 3 el 04/11.
- [aparc-pruebas-dia-1] 6 pruebas de la regresión caen el día 1 de mes (vistas el 01/11/2026, también en el commit e87af01 de antes de la CH4): saliente, Lloretazo/taxi ×3, vacaciones a mano y la línea entre meses del Mes. El 01/11 (CH5) cae también la 83 («Hoy» junta las cinco patas), igual con el código de antes de la CH5 (c9e4c07): misma causa de fecha u hora. Dependen de la fecha, no del código; arreglarlas (fecha fija) antes del `main` de la CH8 · tests/regression.test.js
- [aparc-lanzador] Tanda «El Lanzador» aprobada (01/11, acta `consejo/2026-11-01.md`): Brave, lanzadora (C), todo plegado, ~2,6 M con delegación al Consejo. **K1 hecha** (01/11, rama `claude/plan-socialista-q4sp1t`, commits 70929a0 + ddb8562, **en `main` 09c5151 el 01/11** (run 41337590763 success): `#uso=` validado, `store.uso` a 30 días, relleno de la noche y del «sin pantallas», caso C; pruebas 445-448; formato del enlace documentado encima de `usoEntrante`). Clave de firma creada el 01/11 y guardada por el usuario en Secrets (`LANZADOR_KEYSTORE` en base64 de un PKCS12, `LANZADOR_PASSWORD` = contraseña del almacén y de la clave, `LANZADOR_ALIAS` = `lanzador`); el workflow de K2 usa esos nombres. Siguiente: **K2** (la lanzadora Android).
- [aparc-compra-linea-escrita] En la compra, una línea escrita a mano de una receta («100 g de tomate triturado») no se suma con el mismo alimento de la tabla que pide la semana («300 g Tomate triturado»): salen dos líneas. Ya era así; visto en la CH2 de El Chef (30/10) · docs/DECISIONS.md «El Chef · CH2»

- [aparc-reloj-324] La prueba 324 (tocar la sesión en «lo que viene» del reloj) cayó una vez en la suite completa (10:0x del 30/10, quedaba abierto «¿Quitar este evento?») y pasa sola, en su trozo y en la siguiente suite entera · tests/regression.test.js:12883
- [aparc-lloret-suite] La prueba 205 del Lloretazo falló una vez en la suite completa (08:44 del 30/10); en las dos suites completas de la R6 (09:47 y 10:00 del 30/10) pasó. Se vigila; si no vuelve a caer, se cierra · tests/regression.test.js:7247

### Rediseño artístico (en marcha desde el 2026-10-14)

- [enc-arte] Llevar el aspecto visual de la app a otro nivel con varios agentes: fase 0 auditoría (5 agentes) →
  fase 1 dirección de arte (estilo: «sorpréndeme») → fase 2 maquetas por sección (+ /anatomy) → fase 3 construir,
  empezando por **lo común de toda la app**. Iconos: «algo con vida propia, sorpréndeme».
  · F0 y F1 hechas (2026-10-14): dirección «La jornada» con visto bueno; barra abajo, guardia 65 % rojo, claros
    suavizados. Tandas 1 (cielo de la hora y barra abajo) y 2 (las piezas, 44 px) de lo común: desplegadas
    (0f2765e, 2026-10-17). Siguen por hacer:
  · [aparc-arte-energia] tanda 3 de lo común: el cálculo de la energía del día (que se gasta y se recarga, ver
    design/arte/continuidad.md).
- [enc-continuidad] **Continuidad** como filosofía del arte: el tiempo pasa, la energía se gasta y se recarga, lo que
  haces deja huella; un solo hilo de tiempo sin cortes a medianoche. Ver design/arte/continuidad.md · 2026-10-14

- [aparc-comida-entreno] Los días de entreno a las 18:30 la comida sale a las 18:00 (ventana fija de Sueño): falta
  decidir si debe ir después del entreno · DECISIONS.md:948 · desde 2026-10-15
- [aparc-png-design] `design/` pesa 74 MB en PNG de maquetas: comprimirlos (no afecta a la app, solo al repositorio)

### Versión 3.0

Todo lo de la 3.0 (lo que está en marcha, el orden de lo que falta, las ideas y lo hecho) vive ahora en
**`plan-v3.md`**, desde el 2026-10-27. Aquí ya no se apunta: así no hay dos listas que se contradigan.

### A futuro (sin fecha)

- [aparc-parte-diario] Programar el parte para que salga solo cada mañana (falta decidir la hora) · desde 2026-10-14

### Comida: ingeniería inversa para mejorar SOLO ese apartado  ·  [enc-comida-ri]  (pedido el 2026-10-26)

Usar la skill `/ingenieria-reversa` para estudiar fuentes de alimentación y mejorar **únicamente** la parte de
Comer. Pediste prepararlo en una sesión nueva con el coste que supondría.

**Qué se estudia (y nada más):**
- Una **respuesta real** de Open Food Facts y de USDA (campos que hoy no se usan: nutriscore_grade, nova_group,
  additives_tags, micros de `nutriments`, `serving_size`, `quantity`).
- El worker de recetas (`*.workers.dev`), su forma.
- 1–2 **repos abiertos** de apps de nutrición en GitHub: cómo modelan alimento, ración y el orden del buscador
  (aprender el patrón, no copiar código; respetar su licencia).

**Límites (no negociables):**
- Solo Comer. No se toca Entreno, Dinero, Sueño, Hábitos ni Notificaciones en este encargo.
- Ningún dato del usuario sale del móvil: se estudian las APIs/formatos/repos, nunca tu registro de comida.
- Solo APIs públicas dentro de su ToS, datos abiertos y archivos tuyos. Nada de atacar ni saltarse nada.
- Cada mejora, con su maqueta si cambia lo que ves (redisena-seccion), su prueba encadenada y la suite en verde.

**Coste estimado (gasto):** una sola sesión enfocada, ~150–250k tokens de trabajo. Referencia dura: el propio
benchmark de leanrea (~2,17 $ por 4 tareas de ingeniería inversa completas en Sonnet). Aquí son 3–4 fuentes más
ligeras y con muestras pegadas, así que: **del orden de 0,5–2 € en Sonnet, bastante más en Opus**, como
estimación, no presupuesto. Lo que más sube el coste es leer un repo de GitHub grande: acotar a 1–2 y a los
archivos del buscador/modelo de alimento. La red de aquí solo llega a npm y GitHub, así que las respuestas de
OFF/USDA las pega el usuario (una muestra pesa poco: barato).

**Estudio HECHO (2026-10-26, en Opus, visto bueno del usuario a las 4 fuentes).** Ver DECISIONS «Comer: estudio de
fuentes… (2026-10-26)». Evidencia vista: repos (OpenNutriTracker GPLv3, FitBook MIT; patrón, sin copiar) y el worker
propio (`tools/worker-recetas.js`). OFF y USDA: por documentación + el propio código (sin muestra en vivo; la red no
llega y el usuario no tiene clave USDA). **Mejoras candidatas que salen del estudio (cada una en su sesión):**
- (A) **Micros de OFF/USDA en la ficha**: pedir y mostrar vitaminas/minerales. OJO: convertir g→mg/µg o se guardan mal.
- ~~(B)~~ HECHA y desplegada 2026-10-27 (3b7a617) (con [v3-cantidades], prueba 330). **Ración de verdad**: usar `serving_size`/`serving_quantity` (OFF) y `foodPortions` (USDA) + conmutador «por 100 g
  / por ración». Enlaza con [v3-cantidades].
- ~~(C) **Buscador mejor**~~: HECHA y desplegada 2026-10-27 (3b7a617). `offOrdena` reordena OFF por relevancia +
  `popularity_key` (pool 50); conserva «Hacendado primero». Prueba encadenada 328 (cae al revertir). Ver DECISIONS
  «Comer: el buscador… ordenado por popularidad». No pasó a main: 2 rojos de fecha ajenos (ver abajo). Enlaza con [v3-comer-perdido].
- ~~(D)~~ HECHA y desplegada 2026-10-27 (main 2416c99, run 40591125346; suite 752/752). Sello Nutri-Score · NOVA · aditivos en la ficha + letra en el buscador; los guardados lo piden solos al abrirlos. Prueba 331. DECISIONS «Comer: el sello de Open Food Facts… (2026-10-27)», maquetas `maquetas/comer-sello.html`.
Pendiente del usuario: elegir cuál construir primero y, si quiere micros/Nutri-Score reales, pegar una muestra de OFF.

## Para recordarte

<!-- - [rec-AAAA-MM-DD-tema] lo que pediste que te recordara · AAAA-MM-DD (lo escribe /bitacora) -->
- ~~[rec-2026-10-23-leanrea]~~ HECHO 2026-10-23 · Repositorio https://github.com/aicodeking/leanrea guardado e instalado como skill `/ingenieria-reversa` (`.claude/skills/ingenieria-reversa/`, commit 09ba4aa del original, MIT)
- [rec-2026-10-27-gasto] En cada parte, planificar el gasto: tokens estimados por tarea y en qué se puede ahorrar · 2026-10-27

## Supuestos sin confirmar
Retirada el 02/11/2026 (Consejo, asunto 3): los supuestos van al final de cada respuesta y en docs/DECISIONS.md; lo que importa se pregunta en el momento. Las 46 que quedaban, en `archivo/registro-hasta-2026-11-02.md`.

## Cerrados
Hasta el 02/11/2026, en `archivo/registro-hasta-2026-11-02.md`.

## Contado
Hasta el 02/11/2026, en `archivo/registro-hasta-2026-11-02.md`.
