# Registro del plan socialista

Lo ya contado (para no repetirlo) y lo abierto (hasta que se cierre). Lo escribe Claude en el paso 8;
tú puedes añadir o tachar a mano.

## Encargos aparcados
- [hecho 31/10, main] [aparc-pruebas-dia-31] Eran fallos de las pruebas, no de la app: la 315 dejaba una guardia en el último día del mes (el 31 era hoy) y la de Compras sumaba 6 meses al 31 y saltaba a mayo · tests/regression.test.js
- [aparc-compra-linea-escrita] En la compra, una línea escrita a mano de una receta («100 g de tomate triturado») no se suma con el mismo alimento de la tabla que pide la semana («300 g Tomate triturado»): salen dos líneas. Ya era así; visto en la CH2 de El Chef (30/10) · docs/DECISIONS.md «El Chef · CH2»
- [hecho 31/10, rama] [aparc-vuelo-medianoche] La prueba 397c (vuelo en el modo viaje) cae si la suite corre de noche: pone el vuelo a «ahora + 4 h» y a las 21:40 UTC cae pasada la medianoche (visto en la suite de la CH1 de El Chef, 30/10; lo demás, 879/880 en verde). Arreglar la prueba (hora fija) antes del `main` de la CH8 · tests/regression.test.js:15501
- [enc-chef] Tanda «El Chef» aprobada el 30/10 (~10 M, delegada al Consejo): recetario sin gluten (España, Italia, Grecia, Mediterráneo), semana, modo cocina que enseña, compra, la app que sigue a su cocina (hoy micro + vitro). Rama `ccr-583d2075-nzi0uc`. **CH1 hecha** (30/10: ficha `fichas/chef.md`, `data/recetario.json` con la fabada, `tests/recetario.test.js`, 11 alimentos, catálogo de 344). Siguiente: **CH2** («A la compra» desde la receta) · plan-v3 «Tanda El Chef» · 2026-10-30
- ~~[aparc-suite-siembra]~~ HECHO 2026-10-30 (Remates L5, main 42b230d): 5 trozos y siembra del trozo 70, ~4 min · La suite en ~2 min (G13): partir la cadena 1-201 con una siembra por `window.PG` (jornada 8-15, `guardiaTipos` con relevo 08:00, rutinas con sesiones, platos y menú) al arrancar cada trozo; cortes válidos ya probados tras la 270: 282, 292, 302, 312, 322, 331, 333, 352, 362, 372, 382, 392 (y 200, 202). Más de 6 trozos con 4 núcleos no acelera y tira `actualiza`. El reparto por tiempo que se probó no se guardó (habría que reescribirlo) · DECISIONS «Gran Ley · G13» · 2026-10-30
- ~~[aparc-rotulos-10px]~~ HECHO 2026-10-30 (Remates L3): ≥11 px, botones 44 px, casillas 16 px · Los rótulos en mayúsculas `.cap`/`.k` de toda la app van a 10,5 px y algunos `.mini` a 11,5 (Dinero, Sano, Entreno, 4:20); en 4:20 los botones de potencia miden 36 px de ancho y las casillas de privacidad y guardia 13 px. Es un estilo de toda la app: decidir en una tanda propia · verificador G7 y G10 · 2026-10-30
- ~~[aparc-entreno-letra]~~ HECHO 2026-10-30 (Remates L3) · Portada de Entreno: `.ghero2 .k` a 10,5 px y `.glnk` a 12,5 px (ya eran así antes de la G7) · verificador G7 · 2026-10-30
- ~~[aparc-sueno-noche-olvidada]~~ HECHO 2026-10-30 (Remates L1): 7 noches tocables en Sueño · Una noche sin anotar solo se alcanza 2 días (barrita de Sueño, 3 noches); al tercero no hay ruta visible · verificador G2 · 2026-10-30

- [aparc-reloj-324] La prueba 324 (tocar la sesión en «lo que viene» del reloj) cayó una vez en la suite completa (10:0x del 30/10, quedaba abierto «¿Quitar este evento?») y pasa sola, en su trozo y en la siguiente suite entera · tests/regression.test.js:12883
- [aparc-lloret-suite] La prueba 205 del Lloretazo falló una vez en la suite completa (08:44 del 30/10); en las dos suites completas de la R6 (09:47 y 10:00 del 30/10) pasó. Se vigila; si no vuelve a caer, se cierra · tests/regression.test.js:7247
- ~~[aparc-tu-mes-r2]~~ HECHO 2026-10-30 (G1, main 0d867cf): muestra a rayas, cifras fuera a 14 px, contraste 5,7:1
- ~~[aparc-hoy-plantilla]~~ HECHO 2026-10-30 (G1, main 0d867cf): 10 px de aire arriba y abajo
- ~~[aparc-vit-b6-ajo]~~ HECHO 2026-10-30 (Remates L1): ración real, fuera lo que aporta <10 % · La sugerencia de vitamina B6 puede decir «100 g de ajo» (cantidad absurda) · DECISIONS «Gran Ley · G1» · 2026-10-30
- ~~[aparc-comer-eje-frase]~~ HECHO G4 (30/10): la frase arriba en Comer → Hoy, con lupa (Consejo 30/10: en Hoy, arriba) · La vista `eje` de Comer (la que abre la pestaña) no tiene la caja de la frase `#frIn` (visto por el verificador) · ¿a propósito? · 2026-10-30

- ~~[aparc-s3-a-main]~~ HECHO 2026-10-28: la S3 entera (sesión 1 + S3b) en main 9b53fd3 (run 40759212824)
- ~~[aparc-s2b-a-main]~~ HECHO 2026-10-28: el lector de frases (S2b) en main 2e30a00 (run 40732849988)
- ~~[aparc-s2-a-main]~~ HECHO 2026-10-28: las maquetas de la S2 ya están en main (eddb09d)
- ~~[aparc-desplegar-sello]~~ HECHO 2026-10-27: en main 2416c99 (run 40591125346) · Pasar a main el sello de OFF

Del repaso de supuestos del 2026-10-14 (respuestas del usuario). Orden elegido: **tanda 1, lo rápido
primero; tanda 2, lo visual con maquetas primero**.

### Tanda 1 · reglas y arreglos rápidos — HECHA (desplegada el 2026-10-14)

Vacaciones a mano + días gastados, horas de servicio solo de trabajo, todos los eventos en el Mes, carretera
del mes natural, otro día a la hora de levantarte, noche hasta levantarte, un toque en días pasados, bus con
hora real, taxi con su precio, tiempos de la mañana en Ajustes, cafés, siesta del saliente a mano y platos sin
pasos inventados. Ver docs/DECISIONS.md («Repaso de supuestos, tanda 1»).

### Tanda 2 · lo visual — HECHA (desplegada el 2026-10-14)

Ciudad «Trabajo» con entrada y salida hacia el pueblo o el parque, Lloretazo de ida y vuelta, comer en la
cabina, habitaciones de casa al mirar a los lados y más sitio en el quiosco y el poste. Ver docs/DECISIONS.md
(«Repaso de supuestos, tanda 2»).

### Rediseño artístico (en marcha desde el 2026-10-14)

- [enc-arte] Llevar el aspecto visual de la app a otro nivel con varios agentes: fase 0 auditoría (5 agentes) →
  fase 1 dirección de arte (estilo: «sorpréndeme») → fase 2 maquetas por sección (+ /anatomy) → fase 3 construir,
  empezando por **lo común de toda la app**. Iconos: «algo con vida propia, sorpréndeme».
  · F0 y F1 hechas (2026-10-14): dirección «La jornada» con visto bueno; barra abajo, guardia 65 % rojo, claros
    suavizados. Tandas 1 (cielo de la hora y barra abajo) y 2 (las piezas, 44 px) de lo común: desplegadas
    (0f2765e, 2026-10-17). Siguen por hacer:
  · [aparc-arte-energia] tanda 3 de lo común: el cálculo de la energía del día (que se gasta y se recarga, ver
    design/arte/continuidad.md).
  · ~~[aparc-arte-iconos]~~ HECHO (El Cierre C1-C2, 2026-10-30): iconos en la mañana de Hoy y en el cajón «Más».
- [enc-continuidad] **Continuidad** como filosofía del arte: el tiempo pasa, la energía se gasta y se recarga, lo que
  haces deja huella; un solo hilo de tiempo sin cortes a medianoche. Ver design/arte/continuidad.md · 2026-10-14

- [aparc-comida-entreno] Los días de entreno a las 18:30 la comida sale a las 18:00 (ventana fija de Sueño): falta
  decidir si debe ir después del entreno · DECISIONS.md:948 · desde 2026-10-15
- ~~[aparc-aviso-mes]~~ HECHO 2026-10-19 (prueba 322) · El aviso «Mantén pulsado un día…» del Mes se queda unos segundos tapando Hoy o Comer · Plan si
  cambias de pantalla justo al abrir (lo vio la revisión de salud del 2026-10-19; se va solo a los ~9 s)
- [aparc-png-design] `design/` pesa 74 MB en PNG de maquetas: comprimirlos (no afecta a la app, solo al repositorio)
- [enc-plan-comidas] Montar la semana de comidas: ideas de contenido y diseño dadas el 2026-10-17 (días pasados,
  2 platos repetidos, desayuno vacío, sin cambiar casillas, cuándo cocinas, 4 formas de llenar la semana). Maquetas de 3
  direcciones en design/comer-plan/; el usuario pidió combinarlas → design/comer-plan/combinada.png, aprobada y construida
  (Plan · Días · Nevera · Compra, Montar en dos pasos, fijar con 📌): desplegada 2026-10-19. Arreglos sueltos y el aviso del
  Mes en Comer: hechos y desplegados (5ec269c).

- [enc-nutricionista] Nutricionista integral (2026-10-17): compensar picos repartiendo en 2–3 días con techo diario;
  días de Lloret cena saciante lista antes + kit de vuelta; chocolate con tope semanal y alternativas; la semana siempre
  visible arriba en Comer → Hoy e informe del domingo (bien · falta · a cambiar, metas, semana a semana). Maquetas en
  design/nutricionista/ aprobadas y construidas: desplegado en main (aaa1805). Bebidas en ml: hecho y desplegado.

### Versión 3.0

Todo lo de la 3.0 (lo que está en marcha, el orden de lo que falta, las ideas y lo hecho) vive ahora en
**`plan-v3.md`**, desde el 2026-10-27. Aquí ya no se apunta: así no hay dos listas que se contradigan.

### A futuro (sin fecha)

- ~~[enc-bienestar-digital]~~ HECHO en lo posible 2026-10-30 (Remates L3): minutos de móvil a mano; leerlo solo es imposible desde una web · Leer el **uso real de pantalla** (Bienestar digital del móvil) para hábitos y pantallas, y un hábito **«sin pantallas» fijo**, que no se pueda quitar desde la app (solo pidiéndoselo a Claude Code) · sup. 22
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

### Sueño: no se podía apuntar bien desde la radio  ·  [enc-sueno-radio]  (pedido el 2026-10-27)
Arreglo e informe hechos y desplegados el 2026-10-27 (main a5bec28 · `docs/informe-sueno-2026-10.md`, DECISIONS «Apuntar el sueño desde la radio del conductor»).
- ~~[aparc-sueno-vistas]~~ HECHO 2026-10-30 (G1, main 0d867cf): «Anotar anoche» a la vista en Reloj y Línea (Estación ya lo ofrecía el conductor)
- ~~[aparc-sueno-sitio]~~ HECHO 2026-10-30 (Remates L3): «Te faltan N noches · anotar» en Hoy · Si sigue costando encontrarlo: rediseñar dónde vive el sueño en Hoy (maquetas primero) · desde 2026-10-27

- ~~[aparc-fin-presupuesto]~~ HECHO 2026-10-30 (Remates L1) · Fintonic: una línea «Presupuesto de 300 288,00 €» se lee como categoría de 300.288 (`finParse`, el filtro `de\s*\d+\s*€` no la quita) y `eur()` pinta «1000 €» sin punto de miles en la revisión · DECISIONS «La Reforma · R4» · desde 2026-10-30

## Para recordarte

<!-- - [rec-AAAA-MM-DD-tema] lo que pediste que te recordara · AAAA-MM-DD (lo escribe /bitacora) -->
- ~~[rec-2026-10-23-leanrea]~~ HECHO 2026-10-23 · Repositorio https://github.com/aicodeking/leanrea guardado e instalado como skill `/ingenieria-reversa` (`.claude/skills/ingenieria-reversa/`, commit 09ba4aa del original, MIT)
- [rec-2026-10-27-gasto] En cada parte, planificar el gasto: tokens estimados por tarea y en qué se puede ahorrar · 2026-10-27

## Supuestos sin confirmar
- [sup-2026-10-30-chef-ch2] «Añadir a la compra» mete la receta entera (sus raciones), sin selector; volver a pulsar la actualiza; «ya lo tengo» = tachar en la receta o tocar la línea en la compra; la lista «A mano» que ya tengas se queda como está · DECISIONS «El Chef · CH2»

- [sup-2026-10-30-chef-ch1] (El Chef CH1, por delegación) · «X sin gluten» solo para lo procesado (panceta y azafrán, con su nombre); los embutidos van con su nombre y en ámbar; 93 platos en ámbar (no ~70-80) y 95 de fuera (no ~85) · DECISIONS «El Chef · CH1»
- [sup-2026-10-30-chef] (Consejo «El Chef», acta `consejo/2026-10-30-chef.md`) · Vitro de 2 fuegos y olla de 5-6 L; micro sin grill (se cambia en «Tu cocina»); whisky y sidra cuentan como sin gluten (criterio FACE); «mediterránea» = norte de África, Oriente Próximo y sur de Francia; la «ciudadanía» es una consulta a 5 usuarios simulados · 2026-10-30
- [sup-2026-10-30-comer-reloj2] (Consejo por delegación, acta `consejo/2026-10-30-cierre.md`) · Horas de comer: post-entreno 15 min tras acabar el entreno; comida del saliente 15:00 fija; sin paso «café», desayuno = levantarse + 20 min; guardia tras guardia sigue las reglas de guardia · DECISIONS «El Cierre · horas de comer…»
- [sup-2026-10-30-iconos] (Consejo por delegación) · Iconos: levantarse = reloj; iconos decorativos (el texto ya nombra); el 🔥 de la racha y los emojis de comida se quedan · DECISIONS «El Cierre · iconos…»

- ~~[sup-2026-10-30-r5-comer]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · Maqueta de Comer: contestado en la R6 (30/10): reparto **según tu semana** (no 2 fijos), compra base al tocar el botón, platos base solo como lista. Sigue sin «vale»: ❄ 3 meses (merluza y fajitas 2) y una sola sugerencia de proteína · DECISIONS «La Reforma · R5/R6»
- ~~[sup-2026-10-30-r4-fintonic]~~ CAMBIADO (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`): quitar una fila sí baja el total del mes; lo demás, tal cual · Fintonic en pequeño (R4): «gasto a gasto» = fila a fila de las categorías de la captura; quitar una fila no baja el total del mes (cuenta como variable sin categoría); nombre vacío = se queda el de antes; ya no sale «en otra captura: X». Visto y pendiente: «Presupuesto de 300 288,00 €» se lee como 300.288 y `eur()` pinta «1000 €» sin punto · DECISIONS «La Reforma · R4» · contado el 2026-10-30
- ~~[sup-2026-10-29-tu-mes]~~ CONFIRMADO por el usuario 2026-10-30 (cierre G1): tal cual
- ~~[sup-2026-10-29-la-vuelta]~~ CONFIRMADO por el usuario 2026-10-30 (cierre G1): tal cual
- ~~[sup-2026-10-28-dinero]~~ CONFIRMADO por el usuario 2026-10-30 (cierre G1): tal cual
- ~~[sup-2026-10-28-comer-reloj2]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · Comer del reloj (S3b): el montar sigue de lunes a domingo; «Cocino ese día» solo marca el 🍳; en guardia no hay texto libre; el pie de Semana cuenta solo cenas; «a ojo» = 250/450/700 kcal con 15/50/35 y no se memoriza; sin nevera la sugerencia de vitaminas propone el alimento más rico; el congelador dibuja una caja por plato; la barra Hoy·Semana·Casa solo en pantallas sueltas · DECISIONS «El Comer del reloj, sesión 2» · contado el 2026-10-28
- ~~[sup-2026-10-28-comer-reloj1]~~ SUSTITUIDO por sup-2026-10-30-comer-reloj2 (El Cierre C3) · antes VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · Comer del reloj (S3 sesión 1): horas fijas sin ajuste (desayuno 9:00, cena 21:30, post-entreno 18:30, picoteo 17:00); merienda y picoteo no son «lo siguiente»; teclear gramos pone la fila en ✓; la cantidad de la rueda no se recuerda; «investigar» sin cambios hasta la S3b · DECISIONS.md:1505 · contado el 2026-10-28
- ~~[sup-2026-10-28-lector]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · Lector (S2b): las kcal esperadas del banco se ajustaron a lo que lee la app (±35 %) cuando la lectura era buena; valores por 100 g de los 27 alimentos nuevos de tablas típicas; «un cacho / un pedazo» = una ración; «de primero…, de segundo…» = comida; la seguridad (✓/≈) se calcula al momento · DECISIONS «El lector de frases a fondo» · contado el 2026-10-28
- ~~[sup-2026-10-28-comer-mapa]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · Comer (maquetas S2): cifras de ejemplo; % de vitaminas sobre la referencia europea; «investigar» sin IA externa (solo Open Food Facts y tablas propias); dictado del teclado del móvil; las pantallas que solo se abren desde el «Hoy» antiguo se recolocan, no se quitan · DECISIONS «El mapa de Comer» · contado el 2026-10-28
- ~~[sup-2026-10-27-cantidad]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · Cantidad: en mg no hay ficha (los datos no traen nada en mg); por ración, ± de media ración; la rueda se abre dentro de la ficha; el paso se recuerda; sin unidad en la etiqueta va en g (salvo nombres tipo leche/zumo); los productos ya guardados no tienen ración hasta volver a traerlos de OFF · DECISIONS «Comer: la hoja de cantidad…» · contado el 2026-10-27
- ~~[sup-2026-10-27-sueno-radio]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · Sueño: toda la pantalla verde de la radio abre la hoja de anotar, la radio baja a la vista al abrirse y la pista dice «toca para apuntar» si falta la noche · DECISIONS «Apuntar el sueño desde la radio del conductor» · contado el 2026-10-27
- ~~[sup-2026-10-19-mes-colores]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · Mes: saliente gris oscuro con número blanco, vacaciones en arena, el día de trabajo con entreno va marrón con chapa azul, el color de cada evento en el borde de su chapa, y las «Reglas de oro» (solo se editaban en Semana) quedan guardadas pero sin editar · DECISIONS «El Mes con el día entero de su color» · contado el 2026-10-19
- ~~[sup-2026-10-20-conductor]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · conductor: el cartel verde solo para eventos (no comidas, entreno ni turnos), el subtítulo nombra lo siguiente si falta ≤ 3 h, «¿Qué estoy viendo?» plegado, narrador solo en el Conductor (no en la Estación) · DECISIONS «Hoy: el conductor que cuenta lo que ves» · contado el 2026-10-20
- ~~[sup-2026-10-20-mes-pasado]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · Mes: el botón «Ver del 1 al N» se recuerda mientras la app está abierta (al abrirla empieza en la semana de hoy); «hecha» = guardia de un día anterior a hoy; la lista de guardias sale en la hoja del abono de cualquier mes · DECISIONS «Mes: lo ya pasado…» · contado el 2026-10-20
- ~~[sup-2026-10-20-ordenador]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · modo ordenador: solo se corrige en pantallas táctiles de 600 px o menos con la ventana un 30 % más ancha; tabletas y PC no se tocan · DECISIONS «El móvil en modo ordenador» · contado el 2026-10-20
- ~~[sup-2026-10-20-frontera]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · Mes: la frontera entre meses es amarilla de 4 px y sale en todos los meses · DECISIONS «Mes: la frontera entre meses» · contado el 2026-10-20
- ~~[sup-2026-10-20-plan-vuelta]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · plan de vuelta: el peso de antes es el más alto de trabajo del último día de ese ejercicio; de la semana 2 en adelante, tu mínimo semanal de Entreno (o 3 días); «duro» = esfuerzo 8 o más · DECISIONS.md:1174 · contado el 2026-10-20

<!-- - [sup-AAAA-MM-DD-tema] el supuesto · DECISIONS.md:línea · contado el AAAA-MM-DD -->
- ~~[sup-2026-10-14-quita-urg]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · las 4 guardias que te quitas salen de Urgencias · DECISIONS.md (guardias R1) · contado el 2026-10-14
- ~~[sup-2026-10-14-guardia-hoy]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · una guardia de hoy cuenta como «puesta» hasta mañana · DECISIONS.md (guardias R1) · contado el 2026-10-14
- ~~[sup-2026-10-14-sin-vac]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · ya no se resta una guardia por semana de vacaciones · DECISIONS.md (guardias R1) · contado el 2026-10-14
- ~~[sup-2026-10-14-t1t2]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · 6 más de las tandas 1 y 2 (cafés, café de otro día, siesta de guardia, Lloretazo 0,6 h, cartel azul, «+N más») · DECISIONS.md · contado el 2026-10-14 (solo el número)
- ~~[sup-2026-10-17-nutri]~~ CAMBIADO (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`): el día de guardia y el saliente no se compensa; lo demás, tal cual · nutricionista: pico = más de 300 kcal o del 15 % sobre el objetivo, se compensa en 3 días (máx. 300/día), suelo 80 % (mín. 1.500), chocolate tope 2/semana, cena del Lloret 380–700 kcal y ≥22 g, «solo café» < 150 kcal · DECISIONS «Tu nutricionista, más presente» · contado el 2026-10-17
- ~~[sup-2026-10-19-plan]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · Plan: cocinas una hora después de salir (o a mediodía si libras), ollas de 2–6 raciones, los días de entreno valen para cocinar si no hay otros, se quitó «la semana con tus platos» · DECISIONS «El Plan, las tres en una» · contado el 2026-10-19
- ~~[sup-2026-10-19-auditoria]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · limpieza: una clase CSS está viva si su nombre aparece en app.js/index/sw/fig; las compuestas al vuelo ('t-', 'ev') se quedan; lo de dentro de :is()/:not() no se toca · DECISIONS «Lo mínimo primero» · contado el 2026-10-19
- ~~[sup-2026-10-19-pruebas]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-3.md`) · pruebas en corto: no para en el primer banco que falla y guarda el registro en .claude/.ultima-suite.log · contado el 2026-10-19

- ~~[sup-2026-10-29-la-noche]~~ CONFIRMADO por el usuario 2026-10-30 (cierre G1): tal cual

- ~~[sup-2026-10-30-r3]~~ CONFIRMADO por el usuario 2026-10-30 (cierre G1): tal cual
- ~~[sup-2026-10-30-g1]~~ VALE (Consejo por delegación, 2026-10-30, acta `consejo/2026-10-30-g2.md`; el usuario: «que decida el congreso») · G1: «alimentos de verdad» por grupo y por nombre (fuera chocolate, cacao, galletas, bollería, tarta, helado, cremas de untar); el botón de sueño solo sale el día de hoy; en Conductor no se añade · DECISIONS «Gran Ley · G1» · 2026-10-30
- ~~[sup-2026-10-30-r4]~~ CONFIRMADO por el usuario 2026-10-30 (cierre G1): tal cual

## Cerrados
- ~~[sup-2026-10-27-sello]~~ VALE (usuario, 2026-10-27) Sello OFF: nombres de aditivos de una tabla propia de 113 (el que falta, solo el código); sin `additives_tags` = «sin dato», lista vacía = «0»; productos sin código de barras real, las tres casillas en «sin dato»; tabla y platos sin sello; en el buscador sin dato no hay letra · DECISIONS «Comer: el sello de Open Food Facts…» · contado el 2026-10-27

- 2026-10-14 · **Valen:** 1 (R1: semana = 5 laborables), 9 (cabina de guardia también de día), 10 (manda lo que acaba más tarde), 13 (sin hora no es parada), 15 (taxi solo por la mañana), 26–30 (internos)
- 2026-10-14 · **No valen → encargos de arriba:** 2, 3, 4, 5, 6, 7, 8, 11, 12, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25

## Contado

- [enc-la-vuelta] 2026-10-29 · Consejo de deporte + concurso «La Vuelta» (2 rondas, eligió Teide y Bancales) + obra: entreno 15-16, parque, mínima, vuelta al 35 %, objetivo de peso y dos dibujos en Ajustes · hecha y en main 3170dc0

<!-- - [id] AAAA-MM-DD · qué se dijo · estado en ese momento -->
- [run-38605035020] 2026-10-14 · último despliegue de main (cfac5e9) · success
- [sello-2227c57] 2026-10-14 · main sellado, nada sin sellar · ok
- [rama-cfac5e9] 2026-10-14 · main y rama iguales · ok
- [issues-0] 2026-10-14 · ningún issue ni PR abierto · ok
- [aparc-parte-diario] 2026-10-14 · recordado: falta la hora · abierto
- [tanda1-repaso] 2026-10-14 · tanda 1 del repaso desplegada (724/724 pruebas) · hecha
- [tanda2-repaso] 2026-10-14 · tanda 2 del repaso (el conductor) desplegada · hecha
- [run-38642732419] 2026-10-14 · despliegue de main (adca9d1, guardias de R1) · success
- [run-38709963353] 2026-10-17 · despliegue de main (0f2765e: «La jornada» tandas 1–2, R1 con el mes en curso) · success
- [rama-0f2765e] 2026-10-17 · main y rama iguales, sellado · ok
- [run-39032390614] 2026-10-17 · despliegue de main (aaa1805, tu nutricionista) · success
- [run-39275746140] 2026-10-19 · despliegue de main (acd3948, el Plan, las tres en una) · success
- [enc-ponytail] 2026-10-19 · «Lo mínimo primero» en CLAUDE.md + auditoría: 7 funciones, 4 acciones, 2 copias y 404 reglas CSS fuera (main 84e7253) · hecha
- [rama-b9adda8] 2026-10-19 · rama un commit por delante de main (solo el traspaso, sin código); main 84e7253 desplegado y sellado (run 39318216522 success) · ok
- [enc-v3] 2026-10-19 · el usuario abre la «versión 3.0»: la parte isométrica (Comer · Plan) da por buena; quiere revisión a fondo (arte, visual, técnico), ampliar funcionalidad, mejorar procesos artísticos y valorar cambiar de tema visual. Propuesto: fase 0 de auditoría + decidir tema con maquetas, y recoger los aparcados (arte-energia, arte-iconos, comida-entreno, aviso-mes, png-design) · propuesto
- [enc-mes-colores] 2026-10-19 · Mes con el día entero de color (B suaves), sin Semana, sin Isométrica ni Carretera del Mes, aviso del Mes arreglado (main 4c09f09, run 39334245811) · hecha
- [run-39334245811] 2026-10-19 · despliegue de main (4c09f09, Mes de colores) · success; sellado (version.json con b05d05e, último código) · ok
- [rama-c993d4e] 2026-10-19 · rama un commit por delante de main (solo el traspaso, sin código); 0 issues/PR; DECISIONS sin líneas nuevas (1153) · ok
- [run-39378000493] 2026-10-20 · despliegue de main (28e97b3, plan de vuelta de Entreno) · success; sellado (version.json con 28d85cb, posterior al último código 2ac63d3) · ok
- [enc-plan-vuelta] 2026-10-20 · Entreno: «Tu vuelta al gimnasio» tras 2+ semanas parado (prueba 323) · hecha y desplegada
- [rama-28e97b3] 2026-10-20 · main y rama iguales; 0 issues/PR; DECISIONS 1176 líneas · ok
- [main-12-nuevos] 2026-10-26 · main sumó 12 commits desde 28e97b3: Mes (raya y frontera entre meses), suite completa en 5 min y «modo ordenador» · hecha y desplegada
- [run-39489124341] 2026-10-26 · despliegue de main (bfa711c, «modo ordenador») · success; main sellado (version.json 18a4f04 = último código) · ok
- [rama-beaad8a] 2026-10-26 · rama 6 commits por delante de main: skills /ingenieria-reversa (leanrea) y revisa-seguridad + enc-comida-ri + traspaso; son herramientas, no van a Pages · ok
- [issues-0] 2026-10-26 · 0 issues/PR · ok
- [parte-comer-2026-10-26] 2026-10-26 · parte enfocado en Comer (sesión nueva): enc-comida-ri abierto para esta sesión; supuestos nutri (17-10) y plan (19-10) sin cerrar; aparcados v3-comer-perdido, v3-cantidades, v3-boceto-semana, v3-antojos y aparc-comida-entreno · contado; salud sin pasar (verificador no cargado en esta sesión)
- [parte-comer-2026-10-26b] 2026-10-26 · segundo parte de Comer: sin cambios desde el anterior (main bfa711c sellado y success; rama a4e52bf, 7 por delante, solo .claude/tools/docs; 0 issues); no se repiten los abiertos de Comer · ok
- [run-40510302838] 2026-10-27 · despliegue de main (3bce73b, REA instalado) · success; main sellado y rama = main; 0 issues/PR · ok
- [parte-lista-2026-10-27] 2026-10-27 · parte enfocado en hacer TODA la lista de la bitácora; propuesto orden (cantidades+ración → Nutri-Score → micros → Comer perdido → boceto → antojos → entrenador → dinero → coach → 4:20 ×2 → gmail → bienestar → continuidad → parte diario) · propuesto
- [parte-cantidades-2026-10-27] 2026-10-27 · parte con tarea ya elegida: v3-cantidades + mejora B (ración) de enc-comida-ri; main = 3bce73b sin cambios (run 40510302838 success), rama 555c3f6 (3 commits de ahorro de tokens sin pasar a main), 0 issues; cierre con «Gasto» · ok
- [run-40583207598] 2026-10-27 · despliegue de main (3b7a617: cantidades, ración y buscador) · success; sellado (version.json = último código); 0 issues/PR · ok
- [parte-nutriscore-2026-10-27] 2026-10-27 · parte con tarea D de enc-comida-ri (Nutri-Score/NOVA/aditivos); propuesto decidir dónde va el sello y gasto media 200-350k · propuesto
- [run-40591125346] 2026-10-27 · despliegue de main (2416c99, sello Nutri-Score/NOVA/aditivos) · success; sellado (version.json 2416c99); rama 2 por delante solo con registro y traspaso; 0 issues/PR · ok
- [parte-orden-2026-10-27] 2026-10-27 · parte de una línea: todo en orden, sin cambios de estado · ok
- [run-40732849988] 2026-10-28 · despliegue de main (2e30a00, sello del lector de frases) · success; sellado; 0 issues/PR · ok
- [rama-ebe7052] 2026-10-28 · rama ccr-c4997bb6-02fys3: 14 commits por detrás de main (Comer S2/S2b, app.js tocado) y 28 por delante (Dinero/Consejo); traer main antes de construir D1 · abierto
- [parte-dinero-2026-10-28] 2026-10-28 · parte de la Tanda Dinero (D1-D6 delegada en el Consejo): pendiente qué se quita de Dinero; siguiente D1 ~0,4 M sonnet · propuesto
- [run-40714087144] 2026-10-28 · despliegue de main (7d874f8, plan 3.0 y gastos; solo herramientas) · success; código sellado (version.json 2416c99 posterior al último código 66a7d0d); rama = main; 0 issues/PR · ok
- [parte-s2-2026-10-28] 2026-10-28 · parte con la S2 (mapa de Comer, maqueta) ya elegida; propuesto decidir antes qué entra en el mapa y juntar con las dudas de A/D · propuesto
- [run-40725644165] 2026-10-28 · despliegue de main (eddb09d, maquetas S2 y plan; sin código de app) · success; sellado (version.json 2416c99 posterior al último código); rama 7d874f8 = 10 commits por detrás de main; 0 issues/PR · ok
- [parte-s2b-2026-10-28] 2026-10-28 · parte: siguiente S2b (lector de frases), sin presupuesto medido de construir · propuesto
- [run-40732849988] 2026-10-28 · despliegue de main (2e30a00, lector de frases S2b) · success; sellado (version.json 2e30a00 posterior al código f7dc69b); rama 1 por delante (solo plan); 0 issues/PR · ok
- [parte-s3-2026-10-28] 2026-10-28 · parte con la S3 (Comer del reloj) elegida; presupuesto ~2,1 M medido (plan 1,8 M ×2); propuesto decidir antes qué entra en la sesión 1 · propuesto
- [parte-s3b-2026-10-28] 2026-10-28 · parte: rama con la S3 sesión 1 (12 commits, app.js/styles.css sin sellar, suite 754/754) sin pasar a main; main 2e30a00 success; siguiente S3b (~2,8 M); el usuario pide S3b y luego pasar todo a main · propuesto
- [run-40877861030] 2026-10-29 · despliegue de main (ec1370b, Ley de La Noche N3) · success; sellado (version.json ec1370b posterior al código 27b8b68); 0 issues/PR · ok
- [rama-706d99d] 2026-10-29 · rama ccr-874ee141-nk8306 = main + 4 commits solo de plan/acta (La Reforma); la rama magical-clarke tiene 6 docs médicos sin pasar a main (no son de la app) · ok
- [parte-reforma-r1-2026-10-29] 2026-10-29 · parte con R1 (concurso de Dinero, maqueta) elegida; presupuesto ~2,5 M del plan (medida: 1,5 M sin concurso, 3,2 con) · propuesto

- [parte-2026-10-30] Contado: main ec1370b desplegado y sin cambios; rama f2b7893 (R1) 13 commits por delante de main, sin código; siguiente R2 «Tu mes» (~1,2 M sonnet; ~0,9 M con ficha).
- [parte-2026-10-30-b] Contado: R2 «Tu mes» en main 7942d02 (run 40983394688 success, sellado); R2 sin fila en gastos.md (sin medir); supuestos R2 (margen 10 %, línea de Hoy no ocultable, franja de casillas a mirar en el móvil) abiertos; ahora va R3 Gasto grande + Bosque y Ahorro (~1,8 M).
- [parte-2026-10-30-c] Contado: R3 en main ed50e3a (run 41024716095 success, sellado); R3 medida 2,2 M; siguiente R4 Fintonic en pequeño (~0,8 M sonnet) elegida; 0 issues.
- [parte-2026-10-30-f] Contado: G1 en main 29374b9 (success, sellado); siguiente G2 maqueta de Comer; rama con docs médicos sin pasar a main.
