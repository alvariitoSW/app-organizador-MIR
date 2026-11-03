# Ficha · La Competencia · T4 Exportar (PDF del mes y Excel)

## Qué y para qué
- Dado Ajustes → Datos → Copias, cuando toco «Resumen del mes (PDF)», entonces se abre la ventana de imprimir con el resumen del mes que veo (guardias y horas, sueño, entrenos, dinero) en 1-2 hojas A4; elijo «Guardar como PDF».
- Dado lo mismo, cuando toco «Excel: guardias, gastos, sueño y entrenos», entonces baja `mes-AAAA-MM.xlsx` con 4 hojas.
- Dado «Privado», entonces «Lloretazo» y «4:20» no salen escritos en ninguno de los dos.

## Dónde se toca
- app.js: `resumenMes`, `resumenMesHTML`, `resumenMesImprimir`, `mesXlsx` (tras `dineroXlsxBlob`); `xlsxLibro` (celda `u`); acciones `exp-pdf`, `exp-xlsx` (solo en `act()`); botones en `renderData` vista `copia`.
- styles.css: `#resPrint` y `html.imp-res` (al final).
- Pruebas 600-604.

## Añade
Los dos botones, el resumen imprimible y el Excel de 4 hojas.
## Quita
Nada.
## No toca
`imprimir()`, el Excel de Dinero, el JSON, `sw.js`, `version.json`.

## Frases para el verificador (412×915; y vista de impresión)
«Exportar noviembre 2026», «Resumen del mes (PDF)», «Excel: guardias, gastos, sueño y entrenos», «Guardar como PDF»; en impresión: «Resumen de noviembre 2026», «Guardias y horas», «Sueño», «Entrenos», «Dinero».

## Pasos
- [x] P1 pruebas 600-604 · [x] P2 resumen+impresión · [x] P3 Excel · [x] P4 viejas 207 y 216
