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

- **Cuándo:** antes de una tanda de **~2 M o más**, o cuando algo **cambia lo que ve** el usuario, o cuando él lo
  convoca (como mucho una vez al día). Lo demás lo decide la ficha (`/ficha-de-tarea`). Una reunión = una sesión.
- **Dictámenes** (≤15 líneas por asunto, con su voto): Interior, Justicia, Bienestar y el ministerio del asunto (y
  Ciencia si toca). Para ahorrar, **un mismo agente da dos dictámenes** (p. ej. Economía + Bienestar en uno, Interior +
  Justicia en otro); Hacienda y Transportes los da quien preside. Antes de los dictámenes, un ayudante barato hace el
  **mapa** de lo que ya hay (así nadie relee `app.js`); quien preside lee cabeceras y trozos, no archivos enteros.
- **Gasto de una reunión: ≤0,6 M** equivalentes (cifra de `gastos.md`). Si se va a pasar, quien preside para y lo dice.

### Lista cerrada (Consejo del 02/11/2026, aprobada por el usuario)

Sustituye a las delegaciones por tanda (las antiguas, en `archivo/delegaciones-hasta-2026-11-02.md`).

**El Consejo aprueba solo**, dentro del presupuesto que apruebe el usuario:
1. el orden de las tareas y cómo se parte cada una;
2. qué ayudante y qué modelo;
3. qué se estudia y las dudas técnicas;
4. arreglos de fallos **sin cambio visible**, con su prueba encadenada;
5. completar una pantalla o maqueta cuyo diseño el usuario ya eligió, sin cambiar lo aprobado;
6. **pasar a `main`** lo que el usuario ya aprobó, si se cumple la lista «Terminado» de `CLAUDE.md` y el cambio no toca
   nada de lo de abajo. Se le avisa después con el run de Actions. Si Actions falla, se revierte primero
   (`git revert`, nunca `--force`) y se le cuenta después.

**Le llega siempre al usuario** (el Consejo estudia y recomienda, con opciones concretas, como mucho 3 preguntas):
1. el presupuesto total de una tanda;
2. **lo que cambia lo que ve**: elegir maqueta, textos nuevos, mover algo;
3. **quitar algo que ya usa**;
4. la arquitectura y los datos: sin build, `localStorage` en el móvil, nada que salga de él;
5. cualquier red nueva (`fetch`), dependencia o servicio externo; tocar el service worker, el token de Google o la
   privacidad (con `/revisa-seguridad`);
6. borrar, migrar o renombrar datos guardados;
7. cambiar las propias reglas: `CLAUDE.md`, `gobierno.md`, `preferencias.md`, hooks o permisos;
8. cualquier excepción a la lista «Terminado» (saltarse una prueba, desactivar un hook).

Si el usuario delega algo de esta segunda lista para una tanda concreta, se apunta aquí en una línea con la fecha y
se borra al cerrar la tanda.

- (02/11/2026) «La Competencia» C1-C6 y C4b: sin Consejo por tanda; cada una va directa a su ficha (el usuario, 1-a). Ampliado el 02/11 al plan en 3 fases (~38 M, máx. ~50 M), salvo PDF y Excel, que vuelven al usuario.

- Lo acordado entra en `plan-v3.md` con «(Consejo, fecha)».
- Si los ministerios no se ponen de acuerdo, decide quien preside y el acta lo dice; el usuario puede reabrirlo.
- **Comparecer:** si una tarea va a pasarse más de un 25 % de su presupuesto, quien la dirige para y lo explica en
  una línea antes de seguir.

## El acta

En `.claude/plan-socialista/consejo/AAAA-MM-DD.md` (formato en su `LEEME.md`). El traspaso de la sesión la enlaza.
