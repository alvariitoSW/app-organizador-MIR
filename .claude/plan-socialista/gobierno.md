# El gobierno del repositorio

Copiado y adaptado de `alvariitoSW/fiebres-neutropenias` (`autonomo/REGLAS.md` §4.10 y §4.12), instalado aquí a
petición del usuario el 28/10/2026. Cada pieza del trabajo tiene un papel y unas cuentas. **Hacienda cuenta tokens
(lo que cuesta trabajar), no el dinero de la app.**

## Los papeles

- **Gobierno central: el usuario.** Aprueba el presupuesto de cada tanda del plan (no de cada tarea), elige entre
  maquetas y decide lo reservado (abajo). Nadie más aprueba eso.
- **Transportes = `/bitacora`.** Rumbo, cola y calendario del plan 3.0 (`plan-v3.md`). Convoca el Consejo, lo preside,
  fija el orden del día y escribe el acta.
- **Interior = `/plan-socialista` + `/ficha-de-tarea`.** Si se puede hacer, cómo, con qué ayudante y qué modelo. Antes
  de gastar, la ficha con el presupuesto de la tarea; al cerrar, rinde cuentas (`node tools/gasto.mjs --apunta`).
- **Hacienda = `tools/gasto.mjs` + `gastos.md`.** Cuánto cuesta (en equivalentes, nunca en euros) y qué se recorta:
  modelo más barato, pieza que ya existe en `app.js`, prueba corta, encargo partido. Nunca recorta pruebas,
  accesibilidad ni privacidad. Su dictamen lo da quien preside, sin agente.
- **Justicia = la suite, los hooks y `/revisa-seguridad`.** Si algo choca con `CLAUDE.md`, con la privacidad (los
  datos no salen del móvil) o con lo ya decidido en `docs/DECISIONS.md`. Hacienda no puede recortarla ni saltarla.
- **Bienestar = `/redisena-seccion` + el ayudante `verificador`.** Si le sirve al usuario: un R1 con guardias, en el
  móvil a 412×915, con poco tiempo y cansado. Es lo que en el otro repositorio hace Educación.
- **Educación y Artes Visuales = `/redisena-seccion` (diseño) + `artifact-design`.** Decide el modelo final de un
  concurso de maquetas con las notas del usuario y lo deja en una maqueta navegable con un solo lenguaje visual
  (creado por el usuario el 28/10/2026 para la feria de Dinero).
- **Ciencia = `/ingenieria-reversa`.** Estudiar cómo lo resuelven otras apps, si el asunto lo pide.
- **El ministerio del asunto.** Cuando un tema pide saber de algo concreto, el Consejo lo invita: **Economía** para
  Dinero (finanzas personales: qué método ayuda de verdad a gastar menos y ahorrar), **Sanidad** para sueño, comida o
  entreno, etc.

## El Consejo de Ministros

- **Cuándo:** cuando hay asuntos que decidir antes de construir (como mucho una vez al día) o cuando el usuario lo
  convoca. Una reunión = una sesión.
- **Dictámenes** (≤15 líneas por asunto, con su voto): Interior, Justicia, Bienestar y el ministerio del asunto (y
  Ciencia si toca). Para ahorrar, **un mismo agente da dos dictámenes** (p. ej. Economía + Bienestar en uno, Interior +
  Justicia en otro); Hacienda y Transportes los da quien preside. Antes de los dictámenes, un ayudante barato hace el
  **mapa** de lo que ya hay (así nadie relee `app.js`).
- **Gasto de una reunión: ≤0,6 M** equivalentes (cifra de `gastos.md`). Si se va a pasar, quien preside para y lo dice.
- **Aprueba sin pasar por el usuario:** el orden de las tareas, cómo se parte una tarea, qué ayudante y qué modelo,
  qué se estudia y las dudas técnicas, **dentro del presupuesto que apruebe el usuario**. Lo acordado entra en
  `plan-v3.md` con «(Consejo, fecha)».
- **Reservado al gobierno central (el usuario):**
  1. el presupuesto total de una tanda;
  2. **lo que cambia lo que ve** en la app (elige entre maquetas: `CLAUDE.md`, «rediseños: maquetas primero»);
  3. la arquitectura y los datos: sin build, `localStorage` en el móvil, nada que salga de él;
  4. quitar algo que ya usa, y pasar a `main`.
  En esos asuntos el Consejo **estudia y recomienda** (con opciones concretas, como mucho 3 preguntas).
- **Delegación del 28/10/2026 · reforma de Dinero (D1-D6).** El usuario: «mi potestad en esto la tiene el consejo de
  ministros, que actúe». Para esta tanda, el Consejo decide también lo reservado: el presupuesto, qué se quita de la
  Dinero actual (con migración, sin perder datos guardados), lo que cambia lo que ve (dentro del diseño ya elegido:
  La Laurisilva + el puesto 3 + Compras R2-C) y **pasar a `main`**. No cambia el cómo: suite completa en verde,
  `npm run sella` + `version.json`, pruebas encadenadas que caen al revertir, privacidad y Actions en `success`.
  Cada decisión que antes era del usuario va al acta con «(Consejo por delegación)». Se acaba al cerrar la D6.
- **Delegación del 29/10/2026 · «Ley de La Noche» (N0-N3).** El usuario: «lo de que tengo que decidir yo, que lo
  decida el congreso, y apruebo todo lo que digan, adelante con el proyecto». Para esta tanda el Consejo decide también
  lo reservado: el presupuesto (~4,5 M), las tres preguntas del acta `consejo/2026-10-29.md`, **la maqueta que se
  construye** (lo que cambia lo que ve), qué se quita de Hoy (lo que la cuenta atrás sustituye, sin borrar datos) y
  **pasar a `main`**. No cambia el cómo: suite completa en verde, `npm run sella` + `version.json`, pruebas encadenadas
  que caen al revertir, privacidad y Actions en `success`. Cada sesión nueva de la tanda se titula
  **«Ley de La Noche · N<n> · <qué>»** para que el usuario sepa de dónde viene. En el acta, «(Consejo por delegación)».
  Se acaba al cerrar la N3. **Cerrada el 29/10/2026** (N3 en `main`): lo reservado vuelve al usuario.
- **Delegación del 29/10/2026 · «La Reforma» (R1-R10).** El usuario aprueba ~15 M y que el Consejo decida lo reservado:
  **las maquetas que se construyen** (R2, R5, R9), qué se quita (sin borrar datos) y **pasar a `main`**. Ya decidido por
  él: Bosque y Ahorro **se juntan del todo** en una pestaña; las recetas llevan botón **Compartir** (lo manda él, imagen o
  texto, sin datos personales). No cambia el cómo: suite completa en verde, `npm run sella` + `version.json`, pruebas
  encadenadas que caen al revertir, privacidad y Actions en `success`. En el acta, «(Consejo por delegación)». Se acaba
  al cerrar la R10.
- Si los ministerios no se ponen de acuerdo, decide quien preside y el acta lo dice; el usuario puede reabrirlo.
- **Comparecer:** si una tarea va a pasarse más de un 25 % de su presupuesto, quien la dirige para y lo explica en
  una línea antes de seguir.

## El acta

En `.claude/plan-socialista/consejo/AAAA-MM-DD.md` (formato en su `LEEME.md`). El traspaso de la sesión la enlaza.
