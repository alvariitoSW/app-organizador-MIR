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

- [v3-plan-global] Montar el plan 3.0 (este tablero) y el apartado de gastos del plan socialista · herramientas ·
  montado el 2026-10-27 (439 k); la sesión sigue abierta para ir apuntando lo que digas y ordenar el plan ·
  sesión del 2026-10-27

## Por hacer (orden propuesto: lo que bloquea, luego lo de cada día, luego lo grande)

Cada una con maquetas primero si cambia lo que ves.

1. [aparc-pruebas-fecha] Las pruebas que caen según el día del mes (Mes «tocar un evento abre su día» y Dinero
   «te queda»): que no dependan de la fecha · arreglo
2. [v3-cantidades] Comer · apuntar: cantidades con pasos (5, 20, 50), rueda o mantener pulsado, cada cosa en su
   unidad (la leche en ml). Va con la ración de verdad (B) del estudio de Comer · maqueta → construir
3. [v3-comer-perdido] Comer: ordenarlo para que se encuentre cada función · maqueta → construir
4. [v3-boceto-semana] Plan de comidas: montar una semana a mano como boceto y que el asistente ayude sobre él ·
   maqueta → construir
5. [v3-antojos] Antojo de chocolate: alternativas saciantes de microondas según lo que ya cenaste · maqueta → construir
6. [v3-420-clave] 4:20 con contraseña (solo esa parte, cambiable desde dentro) · construir
7. [v3-420-descanso] 4:20 que relacione lo que fumas con el descanso y la energía, y ayude a bajar · maqueta → construir
8. [v3-entrenador] Entreno como entrenador propio basado en ciencia (la vuelta tras un parón ya está) · maqueta → construir
9. [v3-dinero-compras] Dinero: plan de compras de los próximos meses y cuánto apartar · maqueta → construir
10. [v3-coach] La app como entrenador de tu persona (descanso, comida, entreno, el día de Lloret) · maqueta → construir
11. [aparc-arte-energia] Arte: la energía del día que se gasta y se recarga · maqueta → construir
12. [aparc-arte-iconos] Arte: los iconos con vida propia · maqueta → construir
13. [comida-ri-A/B/D] Comer, del estudio: (A) vitaminas y minerales, (B) ración de verdad, (D) Nutri-Score y NOVA ·
    construir (B va con v3-cantidades)

## Ideas (dichas, sin ordenar ni aclarar)

- [v3-gmail] «La función de Gmail»: falta que digas qué es
- [aparc-comida-entreno] Los días de entreno a las 18:30, ¿la comida después del entreno?
- [aparc-sueno-vistas] / [aparc-sueno-sitio] Apuntar el sueño en Estación, Reloj y Línea; dónde vive el sueño en Hoy
- [enc-bienestar-digital] Uso real de pantalla y un hábito «sin pantallas» fijo
- [aparc-parte-diario] El parte cada mañana solo (falta la hora)
- [aparc-suite-2min] La suite en ~2 minutos
- [aparc-png-design] Comprimir los PNG de `design/` (74 MB)
- [aparc-auditoria-contexto] Gastar menos contexto: limpiar la lista de tareas hechas; desactivar Google Drive y Claude Docs si no se usan

## Hecha

- [comida-ri-C] Comer: el buscador ordenado por popularidad · en main (3bce73b) · 2026-10-27
- [enc-sueno-radio] Sueño: apuntar desde la radio del conductor · main a5bec28 · 2026-10-27
- [v3-plan-vuelta] Entreno: plan para volver tras un parón · main 28e97b3 · 2026-10-20
- [v3-conductor] Hoy: el conductor que explica lo que se ve · main e1aaeda · 2026-10-20
- [fallo-mes-pasado] · [fallo-modo-ordenador] · [mes-frontera] · main e1aaeda / bfa711c / 008fd0d · 2026-10-20
- [v3-mes-colores] + [v3-sin-semana] Mes con el día de su color y sin vista Semana · main 4c09f09 · 2026-10-19
