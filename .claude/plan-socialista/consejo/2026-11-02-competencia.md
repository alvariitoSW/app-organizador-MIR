# Consejo de Ministros · 2026-11-02 · «La Competencia»: reformas para superar a la rival

Convocado por el usuario (encargo `encargos/consejo-competencia.md`). Material: `docs/informe-competencia-2026-11.md`,
leído **íntegro** por quien preside y por los dos ministerios que dictaminan. **No se construye nada**: sale un plan
de reformas con presupuesto, que aprueba el usuario. Preside Transportes (`/bitacora`).

## Orden del día

1. Dictamen de cada propuesta del informe (las 20 de la tabla, las 6 que quedaron fuera y las sueltas de §2 y §5).
2. Lo que no se puede romper («Donde la app actual gana»).
3. El estilo visual de la rival (§3).
4. Tandas, coste, tiempo y lo que decide el usuario.

## El mapa (ayudante sonnet, 11 búsquedas; Interior comprobó 1 más)

- **Sueño:** el cartel La Noche (`nocheHTML` L5899) sale en los 4 modos de Hoy; «Anotar anoche» solo en Reloj y Línea; la tanda
  **«Sueño de un toque» ya está aprobada** (02/11) y cubre la fila 1. El plan de guardia (`snOrdenesDe` L7073, «Avisarme a esas
  horas» `sn-avisa3`) solo vive en la vista Sueño.
- **Dinero:** «Apuntar a mano» en Gastos (L23460); la hoja (`dinero-apuntar` L26021) no recuerda la categoría.
- **Letra:** `styles.css` tiene 1.177 tamaños en px: **368 por debajo de 12 y 585 por debajo de 13**.
- **Hoy:** 4 modos (`hoyModo` L5842, Conductor por defecto), ~8 bloques (L8432-8447), sin franja única de avisos.
- **Mes:** abono `mesAbono` L9075 con dos cuentas (cupo del servicio / guardias puestas) y tres formatos; la cabecera
  (L9236-9250) va antes de la cuadrícula.
- **Turno:** ciclo (L1166/1515/1686); **importar y exportar .ics ya existen** (L24831, L27656) y pegar el planning (L25044).
  Tesseract local (`vendor/ocr`) existe, solo para pedidos de comida.
- **Entreno:** `gym-set` L17172; **no existen** «copiar mi último entreno» ni «guardar como rutina».
- **Comer:** objetivo y techo por día ya calculados (L12372-12408); «¿Me la propones?» `pl-montar` L16163.
- **4:20:** `cnTapado()` (L11828) solo tapa si hay PIN: sin PIN, «Lloretazo» se ve en Hoy (hueco real).

## Asunto 1 · Dictamen de cada propuesta

Votos: B = Bienestar + Sanidad (un agente sonnet), I = Interior + Justicia (un agente sonnet), H = Hacienda (preside).
Coste = solo construir; los totales con maqueta y cierre están en el asunto 4.

| # | Propuesta del informe | Dictamen | Tanda | Coste | B | I | Motivo |
|---|---|---|---|---|---|---|---|
| 1 | «¿Anoche…? [Sí] [Otra hora]» en Hoy | **Ya aprobada distinta**: fila «Anoche … ✓ Vale · cambiar» de «Sueño de un toque». Tras guardia, el camino propio de siempre | 0 | (1,7 M ya aprobado) | + | + | 2 → 1 toque |
| 2 | Plan de sueño de guardia en Hoy con «Avisarme» | **Se hace dentro de Sueño de un toque**: la línea de víspera del cartel lleva «cama · último café · siesta» y el botón «Avisarme», que ya existe | 0 | +0,3 | + | + | Mismo cartel y misma sesión: más barato que aparte |
| 3 | «+» en Tu mes que recuerda la última categoría | **Se hace distinto**: «+» dentro de la tarjeta (no flotante); la hoja de siempre con hoy y la última categoría | 3 | 0,5 | + | + | ~7 → 4-5 toques |
| 4 | Letra mínima 12-13 px (14-15 en Dinero) y contraste | **Se hace distinto**: un script sube un escalón todo lo <13 px con lista de excepciones (casillas del Mes, dibujos de `fig/`, línea del día), con variables en `:root`; contraste del verde «ahorras» y la tarjeta blanca en oscuro. Prueba que mide tamaños computados a 412 px | 1 | 1,0 | + | + | Con guardia y sueño la vista cansa; 585 reglas no se hacen a mano |
| 5 | Hoy «ahora» sin scroll | **Se hace distinto**: la tarjeta «Ahora» lleva siempre salida de guardia, energía y aviso de conducir (la rival los pierde). Reordenar, no esconder | 2 | 1,2 | + | + | 3,3 pantallas es demasiado |
| 6 | Un solo contador de guardias | **Se hace**: «hechas · por hacer · total» con una sola cuenta; en plantilla dice por qué marca 0 | 4 | 0,6 | + | + | El pago y los descansos dependen de esa cifra |
| 7 | Asistente «Tu guardia» sin ciclos | **Se aplaza** (tanda 7): el usuario ya tiene su turno puesto; el ciclo se queda como avanzado | 7 | 2,0 | ~ | + | Mucho coste para la primera vez de otro |
| 8 | Importar planning con vista previa | **Se hace distinto**: entrada «¿Cómo te dan las guardias?» + vista previa común sobre lo que ya hay (pegar texto y .ics). Foto (Tesseract local) **aplazada** a la tanda 7. **PDF y Excel no** (librería pesada, toca `sw.js`) | 4 / 7 | 1,0 (+2,5 foto) | ~ | + | .ics y pegar ya existen; falta la puerta y la vista previa |
| 9 | Plegar la cabecera del Mes | **Se hace**: cuadrícula arriba, resumen de 1 línea; horas, gym y aviso de cambio se quedan en la casilla | 4 | 0,8 | + | + | La pantalla que más se abre |
| 10 | Tira de hábitos en Hoy | **Se hace distinto**: solo los que tocan hoy, máx. 3, oculta en guardia y saliente; mantener abre el hábito | 2 | 0,7 | + | + | 3 → 1 toque |
| 11 | «＋ serie» con el peso de la última vez | **Se hace**: solo entreno libre; 5 últimos ejercicios, −2,5/+2,5 | 3 | 1,0 | + | + | Quita teclear |
| 12 | «Empezar» arriba de Entreno; dibujo a cinta | **Se hace**: solo con rutina y sin sesión («▶ Seguir» si la hay); «Vienes de guardia · 25 min» siempre por encima | 3 | 0,5 | + | + | Se usa con prisa |
| 13 | Aviso de 1 toque para fijar kcal con el techo del día | **Se hace distinto**: como margen, nunca en rojo ni con culpa; proteína a la vista | 5 | 1,0 | + | + | Un objetivo rígido en turnos largos empuja a restringir |
| 14 | Hoy de Comer reordenado y plegado | **Se hace**: plegar, no borrar (kit de vuelta, cena antes de salir, tandas, vitaminas, verdura a la vista) | 5 | 1,2 | + | + | ~2.700 px espanta |
| 15 | «¿Te preparo la semana según tus guardias?» | **Se hace distinto**: invitación descartable con vista previa sobre `pl-montar` | 5 | 0,6 | ~ | + | El motor existe; solo visibilidad |
| 16 | Avisos de Hoy de uno en uno | **Se hace (lo primero de Hoy)**: los de mantenimiento, uno a la vez; guardia, salientes y conducir en su franja, nunca plegados | 1 | 0,6 | + | + | Menos ruido sin perder lo que protege |
| 17 | Caja de frase para notas y eventos | **Se aplaza** (tanda 7): parser propio sin librería y vista previa obligatoria; «el jueves» mal leído crea citas falsas | 7 | 1,5 | ~ | ~ | Riesgo real para un ahorro moderado; la nota con día ya son 2 toques |
| 18 | Plantillas de hábito siempre y «Empezar» fijo | **Se hace**: anclas y mínimo del día malo pasan a después, no se quitan; límite de 3 | 6 | 0,8 | + | + | Menos preguntas |
| 19 | Plan recomendado en grande y «guardar como rutina» | **Se parte**: plan recomendado visible en la tarjeta HOY vacía **sí** (tanda 3, 0,2); «copiar mi último entreno» y «guardar como rutina» son código nuevo: **aplazados** (tanda 7). Tras guardia no se empuja torso/pierna | 3 / 7 | 0,2 (+1,0) | ~ | + | El informe lo vendía como visibilidad y es construcción |
| 20 | Candado en 4:20 y tapar «Lloretazo» sin PIN | **Se hace, con `/revisa-seguridad`**: «Privado» tapa también sin PIN (campo nuevo, `cnTapado` en 8 sitios) y siempre hay salida de un toque accidental | 6 | 1,2 | + | + | Hueco de privacidad real |
| F1 | Frase semanal en Entreno | **Se hace distinto**: no se añade frase; se reescribe el rótulo («Semana 1 de 5 · 0 entrenos») | 3 | 0,1 | ~ | + | La línea ya existe |
| F2 | Tarjeta «Empieza» en Estudio | **Se aplaza** (tanda 7), todo local y con valores por defecto | 7 | 0,8 | 0 | + | Se usa poco |
| F3 | Plegar HUD y temario vacíos, sin jerga | **Se hace**; con datos sigue a la vista | 6 | 0,4 | + | + | Barato; quita la sensación de app incompleta |
| F4 | «Cómo me afecta» en una frase | **Se hace distinto**: «Te faltan ~9 días con y sin sesión»; el «aún no concluye» y la n quedan en el detalle; sin prometer avisos | 6 | 0,5 | + | + | La honestidad estadística es ventaja nuestra |
| F5 | Pregunta de obstáculos al final de Hábitos | **Se hace** | 6 | 0,2 | + | + | Barato |
| F6 | Un solo «atrás» y ayuda plegada en Ajustes | **Se hace**; USDA, lector, viaje y sol a «Avanzado»; las advertencias que protegen datos no se esconden | 4 | 0,4 | + | + | Cosmético y barato |
| X1 | (§5) El pincel visible desde el Mes | **Se hace**, junto a 9 | 4 | 0,2 | + | + | Ya existe, escondido |
| X2 | (§5) Reescribir el «en vez de» tachado de Comer | **Se hace** | 5 | 0,1 | + | + | Parece un castigo |
| X3 | (§5) Pasillos en la lista de Casa | **Se aplaza** (tanda 7) | 7 | 0,4 | 0 | + | Poco que ganar ahora |
| X4 | (§5) Quitar la línea repetida del aviso de guardia en el formulario de 4:20 | **Se hace** | 6 | 0,1 | + | + | Trivial |
| X5 | Récords en gráfico, vaso → barra de 2 colores, widget de inicio, deslizar días, «+» flotante | **No se hace**: poco valor; el widget no está comprobado; deslizar choca con el scroll; el «+» flotante choca con la barra | — | — | 0 | + | Coste sin ganancia clara |
| — | Lo refutado por el abogado (§5, 19 puntos: vista única de agenda, vacaciones arrastrando, nube, buscador en Ajustes, banco pegado, fijos solos…) | **No se hace**: el Consejo da por buena la refutación | — | — | | | Ya existe o rompe la privacidad |

**Acuerdo:** ninguna propuesta queda sin dictamen: 22 se hacen (algunas distintas), 6 se aplazan a la tanda 7, 1 parte
(PDF/Excel) y X5 no se hacen.

## Asunto 2 · Lo que ninguna reforma puede romper

Cada ficha lo repite y su prueba lo comprueba:
1. La cadena de Hoy (guardia › comida › ocio › sueño), la cuenta atrás «Sal al Lloret» y «Vale, 23:15» → riesgo en 1, 5, 16.
2. El plan de sueño de guardia y el aviso de no conducir, siempre a la vista → 2, 5, 16.
3. El Mes: color por tipo de día, horas en la casilla, guardia + saliente de una vez, motor de rotación → 6, 8, 9.
4. Comer: texto libre de un gesto, kit de vuelta, cena antes de salir, tandas, vitaminas y verdura → 13, 14, 15.
5. Entreno: sesión en vivo, «Vienes de guardia», rutina por tipo de día → 11, 12, 19.
6. Dinero: «Empiezas − Fijos − Gastos = Acabas», «8 €/día», sin scroll → 3, 4.
7. Hábitos: «cuándo no toca», mínimo del día malo, sin racha rota, límite de 3 → 10, 18.
8. Privacidad (sin cuenta ni nube, todo en el móvil), PIN del 4:20 y el tono («Es una guía, no una nota») → 8, 13, 20.

## Asunto 3 · El estilo de la rival

| Ministerio | Dictamen | Voto |
|---|---|---|
| Bienestar | Copiar **el orden y el tamaño, no la cara**. Sí: letra mínima, contraste, cifras de ancho fijo, zonas de 48 px, un color de acción por pantalla (el cian de ahora, no el ámbar), granate solo para guardia y seguridad, dibujos pequeños donde hay acción y grandes en lo vacío, emojis fuera de los botones de acción. No: ámbar y dos aspectos fijos (los 5 temas se quedan), deslizar días, quitar todos los emojis | a favor con cambios |
| Interior/Justicia | Sin choque; el suelo de letra va con variables para moverlo cambiando una línea | a favor |
| Hacienda | No hay tanda propia de estilo: cada regla entra en la tanda de su pantalla (la letra en la 1) | a favor |

**Acuerdo:** la identidad se queda (tinte granate en guardia, cuenta atrás grande, tono amable, dibujos). Es lo que
el informe llama «encanto», y perderlo es su aviso de «parecer una app más». **Recomendación al gobierno central:** lo
confirma el usuario al elegir la primera maqueta (tanda 1).

## Asunto 4 · Tandas, coste y tiempo

**Hacienda.** Interior lo sumó todo en **~30 M y ~40 sesiones**, tanda por tanda. Hacienda lo recorta a **~19 M y 28
sesiones** sin tocar pruebas, accesibilidad ni privacidad:
- una sola maqueta por tanda, con todas sus pantallas (un ahorro que ya funcionó);
- lo de «la primera vez» va a la tanda 7 (asistente de turno, foto del cuadrante, caja de frase, copiar o guardar
  rutina, «Empieza» de Estudio, pasillos), porque el usuario ya tiene sus datos metidos;
- **sin Consejo por tanda**: este acta ya lo estudia todo y cada tanda va directa a su ficha. Ahorra ~0,6 M por tanda,
  ~3,6 M en total. Es una excepción a `gobierno.md` («el Consejo se reúne antes de una tanda de ~2 M»), así que la
  decide el usuario.

**Transportes, el orden.** Lo que más se nota con menos coste. La rival gana de verdad en sueño y en gasto (§4 del
informe), y la letra y el ruido se ven en todas las pantallas.

| Tanda | Filas | Qué gana el R1 | Sesiones | Coste | Qué decide el usuario |
|---|---|---|---|---|---|
| 0 · Sueño de un toque (**ya aprobada**) | 1, 2 | anotar la noche 2 → 1 toque; víspera de guardia en Hoy con «Avisarme» (1-2 → 0 toques) | 3 | 1,7 M + **0,3** | maqueta S1 (ahora con la línea de víspera) |
| 1 · Letra y calma | 4, 16 + contraste | todo se lee de un vistazo; un aviso a la vez arriba | 4 (maqueta, letra, avisos, cierre) | ~2,8 M | suelo de 12 o 13 px (14 en Dinero) y la lista de avisos, en la maqueta |
| 2 · Apuntar en menos toques | 3, 11, 12, 19 (visible), F1 | gasto ~7 → 4-5; serie libre ~5-6 + teclear → 3-4; «Empezar» sin desplazar | 4 | ~2,8 M | maqueta: sitio del «+» y si el dibujo de Entreno pasa a cinta |
| 3 · Hoy en una pantalla | 5, 10 | lo esencial sin scroll (3,3 pantallas → 1); hábitos 3 → 1 toque | 4 | ~2,9 M | maqueta: qué es «ahora» y qué se pliega |
| 4 · Mes y guardias | 6, 9, X1, 8 (puerta + vista previa), F6 | una cifra de guardias; mes entero sin scroll; planning 7-8 → 3-4 toques | 4 | ~3,0 M | maqueta y el texto del contador |
| 5 · Comer | 13, 14, 15, X2 | lo que queda hoy a 0 toques; Hoy de Comer sin scroll para lo importante | 4 | ~2,7 M | maqueta: qué se pliega |
| 6 · Hábitos, 4:20 y Estudio | 18, F5, 20, F4, F3, X4 | hábitos nuevos sin preguntas; «Privado» tapa siempre (hueco cerrado) | 5 | ~3,2 M | maqueta y cómo se deshace el «Privado» (privacidad, con `/revisa-seguridad`) |
| **Total 0-6** | 22 propuestas | por delante de la rival en las 5 tareas del R1 | **28** | **~19,4 M** (1,7 ya aprobado → **~17,7 M nuevos**) | |
| 7 · Para más adelante (opcional) | 7, 8 foto, 17, 19 resto, F2, X3 | el primer día de un R1 nuevo | ~12 | ~9 M | si se hace y cuándo |

**Tiempo.** Con el ritmo medido (`gastos.md`: 5-8 sesiones y 6-8 M al día del 29/10 al 01/11), las tandas 0-6 son
**unos 4-5 días de trabajo**. Pero cada tanda espera a que el usuario elija su maqueta: si contesta en el día,
**~1 semana** (hacia el 9-10/11); si las maquetas esperan un día cada una, **~2 semanas**. La app ya iría por
delante de la rival en sueño y gasto al cerrar las tandas 0 y 2 (**~3 días, ~7 M**).

**Si hay que recortar:** primero la 7 entera (ya fuera del total); después la 15 (−0,6), F4 + F3 (−0,9) y la 13
(−1,0). **Lo mínimo para ganar a la rival donde gana de verdad** son las tandas 0 + 1 + 2: **~7,6 M, 11 sesiones,
~3 días**.

## Lo que entra en el plan

En `plan-v3.md` → «Por hacer», bloque «La Competencia (Consejo, 2026-11-02)», tandas C1-C6 y C7 (más adelante),
**en espera del usuario**. La tanda 0 suma la fila 2 a «Sueño de un toque» si el usuario dice que sí.

## Lo que espera al usuario (≤3 preguntas)

1. **Presupuesto.** (a) Tandas 0-6, ~17,7 M nuevos (~1 semana), sin Consejo por tanda (**recomendada**) · (b) solo lo
   mínimo, 0 + 1 + 2, ~5,9 M nuevos (~3 días) · (c) 0-7, ~27 M nuevos (~2 semanas).
2. **Estilo.** (a) Mantener la cara de la app y copiar el orden y el tamaño: letra mínima, un color de acción por
   pantalla, emojis fuera de los botones (**recomendada**) · (b) además, el ámbar de la rival como color de acción ·
   (c) solo la letra, sin tocar colores.
3. **Importar el planning.** (a) Puerta y vista previa sobre pegar texto y .ics, que ya existen (**recomendada**) ·
   (b) además, foto del cuadrante con el lector local (+2,5 M, en la tanda 7) · (c) además, PDF y Excel con una
   librería nueva (no recomendada: dependencia pesada y toca el service worker).

Además: si le parece bien, el informe y este acta pasan a `main` (solo documentos: sin suite ni sello).

## Gasto de la reunión

**929 k** (`gasto.mjs`: 38 pasos, 3 ayudantes; principal 49 %). Se pasó del tope de 0,6 M: el informe íntegro lo leyeron tres (presidencia y dos dictámenes), como pidió el usuario, y la presidencia leyó `gastos.md` y `plan-v3.md` por trozos largos. Ahorro para la próxima: la tabla de dictámenes la escribe un solo agente y la presidencia solo suma.

## Lo que decidió el usuario (02/11/2026)

1-a (C1-C6, ~17,7 M, sin Consejo por tanda) · 2-a (la cara se queda) · 3-b (foto del cuadrante: pasa de C7 a **C4b**, +2,5 M, detrás de C4). Lo que no se hace va a Ideas como «algún día, sin prisa» `[v3-competencia-algun-dia]`. Presupuesto aprobado: **~20,2 M** nuevos (C1-C6 + C4b + 0,3 de la víspera en Sueño).
