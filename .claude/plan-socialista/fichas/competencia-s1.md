# Ficha · La Competencia · S1 Sueño de un toque + víspera

Maqueta aprobada: `maquetas/competencia-a.html#s1` (S1·a, a2, b, c). Acta: `consejo/2026-11-02-competencia-construir.md`.
Rama partida de `claude/la-competencia`. Tope ~60 pasos. Decisiones del usuario: opciones recomendadas en todo.

## 1. Qué y para qué
- Dado que di «He vuelto» (anoche) y «En pie» (hoy), cuando abro Hoy, entonces bajo el cartel sale «Anoche 23:40–7:10 · 7 h 30 · Vale · cambiar»; con «Vale» la noche queda guardada en `suenoReal` (1 toque).
- Dado que acabo de dar «Vale», entonces salen las 3 caras «¿Cómo amaneces?» (Roto · Normal · Fresco) con «Saltar»; un toque y desaparecen, sin nota ni racha; «Saltar» no borra la noche.
- Dado que mañana tengo guardia, entonces el cartel dice «Faltan X h Y en tus 3 últimas noches · cama HH:MM» (sin rojo) y debajo cama · último café · siesta con «Avisarme».
- Dado que hoy tengo guardia, entonces la línea es la siesta y el aviso de no conducir sigue a la vista.
- Dado que vengo de guardia (saliente), entonces la fila «Anoche» no sale: sigue «¿Cuánto dormiste en la guardia?».

## 2. Dudas
Ninguna abierta: el usuario eligió las opciones recomendadas (caras tras «Vale»; línea + tres horas + «Avisarme»; quitar «Te faltan N noches»).

## 3. Dónde se toca
- `app.js`: `nocheHTML` (~5899: fila Anoche, línea de víspera/guardia, botones sin emoji), `snTGuardar` (conserva `amanece`),
  normalize de `suenoReal` (~995, campo `amanece`), `act()` (junto a `sn-hoja`: `anoche-vale`, `anoche-cara`),
  `hoyDiaHTML` (quita `suenoFaltaHTML`), `suenoFaltaHTML` (se borra). Reutiliza `snOrdenesDe`/`snOrdenesHTML`/`sn-avisa3`, `suenoEstado`.
- `styles.css`: `.snfalta` fuera; `.nanoche`, `.ncaras`, `.nvis` con variables de `:root`.
- Pruebas: 450-459 en `tests/regression.test.js`; 397 (usaba `.snfalta`), 360/361/401/402 (emoji de botones).

## 4. Pasos
- [x] P1 ficha
- [x] P2 pruebas 450-459 (primero deben caer)
- [x] P3 fila Anoche + Vale + caras + Saltar
- [x] P4 línea de víspera/guardia + órdenes
- [x] P5 quitar `.snfalta`; botones sin emoji
- [x] P6 capturas 412×915 claro/oscuro, DECISIONS, commit

## 5. Comprobación
Añade: fila Anoche, Vale, caras, Saltar, «otras noches», línea de víspera, órdenes en Hoy. Quita: `.snfalta` / «Te faltan N noches», emojis de En pie/Vestido/He salido/He vuelto/He llegado.
No toca: `nocheSugHTML` («Vale, 23:15»), plan de guardia de Sueño, aviso de no conducir, cadena guardia › comida › ocio › sueño, hoja de la noche (tramos, KSS, móvil).
Frases para el verificador: «Avisarme», «Saltar», «cama», «otras noches», «Anoche», «Vale».
