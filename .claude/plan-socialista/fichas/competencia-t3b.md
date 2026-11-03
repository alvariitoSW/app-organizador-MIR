# Ficha · La Competencia · T3b Tu guardia

## Qué y para qué
- Dado Ajustes → Mi planning, cuando toco «Tu guardia en 3 pasos» y elijo servicio, tipo y saliente, toco los días y guardo, entonces el mes queda con sus guardias y salientes.
- Dado el paso 3, cuando los días van «cada N días», entonces se ofrece repetir; por defecto «Lo pongo yo cada mes».
- Dado quien ya usa el ciclo, entonces sigue intacto en «Avanzado».

## Dónde se toca
- app.js: `tgS`, `tgVista`, `tgGuarda`, `tgPatron`, `tgIgual`; `renderData` (vista `tuguardia`, botón en `planning`); acciones `tg-*` en `act()`.
- styles.css: `.tg*`. Pruebas 580-588.

## Añade
Asistente de 3 pasos con calendario. **Quita** nada. **No toca** el asistente de primera vez, el ciclo, `sw.js`, `version.json`.

## Frases para el verificador
«Tu guardia en 3 pasos», «Tu guardia · 1 de 3», «¿Libras el día después?», «Toca los días de guardia de», «guardias ·», «¿Y los meses siguientes?», «Lo pongo yo cada mes», «Guardar mi guardia», «Avanzado: repetir por fechas (ciclo)».

## Pasos
- [x] pruebas 580-588 · [x] asistente · [x] DECISIONS · [ ] capturas (verificador)
