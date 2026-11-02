# Encargo · La Competencia · Fase 3 (día 3)

**Estado al cerrar la fase 2 (02/11/2026, rama `claude/la-competencia`, `main` ab1be8d, run 41526387915 en verde):** en `main`
están C3 Hoy (480-485), C4 Mes (490-496), C5 Comer (500-503), C4b Foto del cuadrante (520-529) y C6 «Privado», hábitos y
«Esperan turno» (510-519b). Suite: 993 pruebas en verde. El script de letra en seco da 0 cambios. Gasto de la fase 2: 9,6 M de ~12 M.

## Lo primero (quedó de la fase 2)

1. **Pasada del verificador por todas las pantallas**, en claro y oscuro, a 412×915 (~0,3 M).
2. **Maquetas de la fase 3** (C7: asistente de turno, caja de frase, copiar y guardar rutina, «Empieza» de Estudio, pasillos;
   deslizar días, «+» flotante, récords en gráfico). Las elige el usuario antes de construir.
3. Después, el plan de `plan-v3.md` → «Fase 3»: K3 (instalar el Lanzador, con el usuario y el móvil) → K4 widget ‖ C7 ‖ lo demás.
   **PDF y Excel, lo último y preguntando antes** (librería nueva).

## Lo que aprendió la fase 2 (para gastar menos)

1. Lo de la fase 1 funcionó: encargo común en un archivo (`encargos/competencia-fase-2-constructores.md`), worktree al día,
   pruebas viejas de su pantalla y una sola suite completa a la vez, de quien dirige. 4 de 5 constructores en ≤67 pasos.
2. **Un constructor subió el enlace `node_modules`** (el `ln -s` del paso 0) y GitHub Pages dejó de publicar (runs de C4b y C6 en
   rojo). Arreglado: `.gitignore` ignora `node_modules` también como enlace. Antes de cada `main`, mira que el run anterior esté en verde.
3. Al juntar ramas en paralelo, los conflictos son siempre «los dos añaden al final» (DECISIONS, styles.css, pruebas): se quedan
   los dos lados; en las pruebas, con la `}` que cierra el bloque de en medio.
4. `npm run test:corto` y `npm run sella` a veces salen sin hacer nada en este contenedor (código 216): `bash tools/pruebas-corto.sh`
   y `node tools/sella-version.mjs` directos sí van.

## Lo que queda abierto de la fase 2

- **C6:** exportar a .ics / Google Calendar lleva el título real «Lloretazo» con «Privado» puesto (acto del usuario: que decida).
  Fuera de la tanda y sin hacer: «Cómo me afecta», Estudio plegado, obstáculos al final de Hábitos, «Mañana tienes guardia»
  repetido en 4:20, «Empezar · día 1 de ~66» fijo abajo.
- **C4b:** solo probado con cuadrantes inventados y limpios; lee una fila por día y una columna por persona. Hay que probarlo con
  una foto real del usuario (en su móvil, sin subirla) y preguntar cómo es su cuadrante. «Trabajo» se manda como día libre con la
  palabra «trabajo» (la app no tiene otro tipo).
- **C4:** el portapapeles no se ha probado en un móvil real (hay caja de reserva). `.pegar-copiado` mide 44 px, no 56 (gana la
  regla `:is(#main,…) .btn`). La cabecera de Importar dice «‹ Ajustes · Mi planning» aunque se llegue desde el Mes.
- **C3:** un hábito hecho se queda en la tira (para desmarcarlo); con más de 3, entran los 3 primeros de la lista.
- **Letra < 13 px que ya estaba antes:** en Hoy `.cd-ncap`, «¿Qué estoy viendo?», «más ›», dos `small` de 12,5 px.
- **Contraste justo:** números de «Urg»/«UMI» en oscuro (3,9 y 4,1:1); en claro, «Te queda» de Dinero, la hora de la Cena y
  «Por qué a la cama…» (4,2-4,47:1).
- **Pruebas:** la 500 deja estado que tumba la 239 si va antes (en la suite completa no pasa). La 324 volvió a caer una vez en
  suite completa (ya en `aparc-reloj-324`). En styles.css hay una línea suelta `=======` desde antes (hacia la 4323).

## Presupuesto

Fase 3: **~14 M** (plan aprobado). Constructores sonnet con el encargo común en archivo y tope de ~60 pasos. Si una tanda va a
pasar del 25 %, parar y decirlo.
