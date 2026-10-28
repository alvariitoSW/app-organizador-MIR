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
- Si los ministerios no se ponen de acuerdo, decide quien preside y el acta lo dice; el usuario puede reabrirlo.
- **Comparecer:** si una tarea va a pasarse más de un 25 % de su presupuesto, quien la dirige para y lo explica en
  una línea antes de seguir.

## El acta

En `.claude/plan-socialista/consejo/AAAA-MM-DD.md` (formato en su `LEEME.md`). El traspaso de la sesión la enlaza.
