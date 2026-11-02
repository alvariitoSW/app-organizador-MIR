# Ficha · La Competencia · C6 «Privado», plantillas y «Esperan turno»

## Qué y para qué
- Dado «Privado» puesto (con o sin PIN), cuando miro Hoy, Mes, Eventos, Hábitos o los avisos, entonces no sale «Lloretazo» ni «4:20» (sale «Plan privado»); «Sal al Lloret» se queda.
- Dado «Privado» sin PIN, cuando entro en 4:20, entonces no pide PIN y veo la banda «Quitar privado»; con PIN, entrar y quitarlo lo piden.
- Dado 3 hábitos en marcha, cuando toco una plantilla, entonces va a «Esperan turno» y lo dice.

## Dónde se toca
- app.js: `cnPin`, `cnTapado`, `cnOculta`, `cnEvOculto`, `habN/habI`, `cnPrivadoPon/Quita`, `cnPinSigue` (modo `quita`), `cnCab` (banda), Plan → Privacidad, `deshacerCambio`, `normalize` (campo `priv.privado`), `renderHabitos`/`habPlantillasHTML`, `renderRevision`, `renderExperimentos`, `EXP`.
- styles.css: `.cnbanda`, `.cnprivsw`, `.habplant`. Pruebas 510-519.

## Añade
Interruptor «Privado», «Deshacer», banda «Quitar privado», PIN al quitar, plantillas siempre visibles, aviso de «Esperan turno».

## Quita
Que tapar dependa del PIN; la propuesta de 4:20 y el cruce con sesiones en Tu semana/Experimentos con Privado.

## No toca
«Sal al Lloret», el PIN donde ya estaba, `sw.js`, `version.json`, exportar a .ics/Google.

## Frases para el verificador
«Privado está activado», «Quitar privado», «Deshacer», «Plan privado», «Ya tienes 3 en marcha», «ESPERAN TURNO», «PLANTILLAS».

## Pasos
- [x] pruebas 510-519 · [x] núcleo · [x] tapado · [x] plantillas · [x] revisión de seguridad
