# Ficha · La Competencia · T1b Privado y pasillos

## Qué y para qué
- Dado «Privado» puesto, cuando mando el calendario a Google (.ics: «ver la lista», descargar, copiar), entonces el Lloretazo (suelto, repetido y el aviso «Vete del Lloret») sale «🌙 Privado», sin su nombre real ni notas, y cualquier otro texto del .ics pasa por `cnOculta`.
- Dado Comer → Casa con cosas por comprar, cuando abro la compra, entonces sale por pasillos en el orden de mi súper, cada uno con su cabecera y su cuenta; arriba «N cosas · M cogidas».
- Dado una cosa cogida, entonces se queda tachada en su pasillo (no baja).
- Dado lo que ya tengo, entonces «Ya en casa, no entran: …» va plegado al final y se abre al tocarlo.

## Dónde se toca
- app.js: `calEventos` (campo `lloret` en los eventos con fecha, en los semanales y en `snNocheEventos`/`mk`, y el bloque final `if(cnTapado())`), `cjeCasaHTML` (solo la tarjeta `.cs-compra`: `porSeccion`, cuenta, `<details class="cs-ya">`).
- styles.css: `.cs-pas`, `.cs-pasn`, `.cs-pasc`, `.cs-ya summary` (con `--suelo`).
- Pruebas 535-539.

## Añade
Tapado del .ics con Privado; pasillos con cabecera y cuenta en Casa; «N cosas · M cogidas»; «Ya en casa» plegado.

## Quita
La lista plana de Casa en el orden en que se apuntó; el texto suelto «Ya en casa, no entran».

## No toca
El título «Casa» y los chips «falta» (otro constructor), la cabecera del Mes, Dinero, `sw.js`, `version.json`; el motor de pasillos; la pantalla Compra; cómo se guarda.

## Frases para el verificador
«Compra · de tus cenas y comidas», «5 cosas · 0 cogidas» (y «1 cogida» tras tocar una), cabeceras de pasillo con su número, «Ya en casa, no entran:». En Ajustes → Calendario → ver la lista con Privado: «SUMMARY:🌙 Privado», sin «Lloret».

## Pasos
- [x] P1 pruebas 535-539 · tests/regression.test.js
- [x] P2 .ics tapado
- [x] P3 Casa por pasillos
- [ ] P4 capturas 412×915 claro y oscuro por el verificador (pendiente: quien dirige)
