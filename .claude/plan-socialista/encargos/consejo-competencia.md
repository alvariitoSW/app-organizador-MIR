# Encargo · El Consejo estudia «La Competencia» y propone las reformas

Pedido por el usuario el 02/11/2026, después de leer el informe de la rival y estar «muy de acuerdo» con él.
Se hace en **una sesión nueva**, como reunión del **Consejo de Ministros** (`/bitacora`, sección «El Consejo de
Ministros»; reglas en `../gobierno.md`). **No se construye nada** en esta sesión: sale un plan de reformas.

## Material

- **El informe, íntegro:** `docs/informe-competencia-2026-11.md`, en la rama `claude/la-competencia` (commit del
  02/11; todavía no está en `main`). Para leerlo: `git fetch origin claude/la-competencia` y
  `git show origin/claude/la-competencia:docs/informe-competencia-2026-11.md`.
- Las palabras del usuario: «debería ser leído por el Congreso íntegramente… pensar cómo mejorar nuestra app para
  superar la competencia… las reformas o lo que habría que hacer, lo que costaría, cuánto tiempo tardaríamos… y
  sobre todo tener muy en cuenta cada palabra del informe».

## Cómo

1. **Cada ministerio lee el informe entero**, no un resumen (es corto: ~310 líneas). Las 7 secciones: resumen,
   por sección, estilo visual, las 5 tareas del R1, «Donde la app actual gana», tabla por impacto y método.
2. **Nada del informe se queda sin respuesta.** Cada propuesta que sobrevivió (las 20 filas de la tabla **y** las
   que el director dejó fuera de la tabla por poco impacto, en la sección «Por sección») recibe un dictamen:
   *se hace* (en qué tanda) · *se hace distinto* (cómo) · *no se hace* (por qué). Lo de «Donde la app actual gana»
   se protege: ninguna reforma puede romperlo (Mes, sueño de guardia, sesión en vivo, modo saliente, pincel,
   «Lo que viene», privacidad).
3. **Mapa barato primero** (para no releer `app.js`): dónde vive en el código cada propuesta.
4. **Dictámenes** (gobierno.md): Interior + Justicia en uno, Bienestar + ministerio del asunto en otro;
   Hacienda la da quien preside. Ojo con lo que la lista cerrada manda al usuario: todo lo que cambia lo que ve,
   quitar algo que usa, importar el planning (.ics/foto: ¿librería nueva?, ¿OCR local?) y cualquier cosa de
   privacidad (el candado de 4:20 → `/revisa-seguridad`).
5. **El plan de reformas** se agrupa en **tandas** (p. ej. «Letra y contraste» · «Hoy en una pantalla» ·
   «Apuntar en menos toques» · «Guardias y turno» · «Comer» · «Entreno» · «Hábitos y notas»). Por tanda:
   - qué propuestas del informe recoge (por su número de fila) y qué gana el R1 (toques antes → después);
   - **coste** en equivalentes (pequeño ~0,5 M · medio ~1 M · grande ~2 M), contando maquetas, pruebas y suite;
     los «sin estimar» del informe se estiman aquí;
   - **tiempo**: cuántas sesiones y cuántos días, con el ritmo real de `gastos.md`;
   - qué necesita del usuario: maqueta que elegir o pregunta (como mucho 3 por tanda, con opciones concretas).
   - El orden: primero lo que más se nota con menos coste (empezar seguramente por la letra mínima y Hoy).
6. **Total**: coste de todo, semanas hasta tener la app «por delante de la rival», y qué se podría dejar fuera
   si hay que recortar.

## Lo que sale

- Acta en `.claude/plan-socialista/consejo/2026-11-0X-competencia.md` (formato de `consejo/LEEME.md`), con la
  tabla «propuesta del informe → dictamen» completa (ninguna fila sin dictamen).
- Las tandas, en `plan-v3.md` → «Por hacer», con «(Consejo, fecha)».
- **Al usuario:** el plan en una tabla (tanda · qué gana · coste · sesiones/días · qué tiene que decidir él) y
  el presupuesto total para que lo apruebe (es de la lista «le llega siempre»).
- Si al usuario le parece bien, el informe pasa a `main` junto con el acta (solo documentos: sin suite ni sello).

## Gasto

Reunión del Consejo: **≤0,6 M** (gobierno.md). El informe se lee entero, pero el código, por trozos. Al acabar:
`node tools/gasto.mjs --apunta consejo-competencia --tipo consejo --nota "…"`. Ojo: `gasto.mjs` no ve a los
agentes de un Workflow (`subagents/workflows/`); si se usa, apuntar su cifra a mano.
