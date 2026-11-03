# Ficha · La Competencia · T1a Arreglos (Dinero en oscuro, Mes, Casa)

## Qué y para qué
- Dado Dinero → Tu mes en oscuro, cuando abro la pantalla, entonces el vaso muestra su nivel («Te queda» gris medio sobre fondo de tarjeta) y «Subir Fintonic» es un botón oscuro con borde cian.
- Dado el 3 de nov (cuadrícula del 2 nov), cuando miro el Mes, entonces el botón dice «Ver el 1 de noviembre».
- Dado Comer → Casa en oscuro, entonces «Casa» está a 12 px y los chips «falta» no pasan de 2 líneas.

## Dónde se toca
- app.js: `tmVasoSVG` (clases `tm-vf`, `tq`), botón `.mesatras` en el render del Mes.
- styles.css: `html.dark .tm-vf/.tq/.tm-bt.p/.tm-ley i`, `label.tm-bt`, `.cstop`, `.cs-bote`.
- Pruebas 530-534.

## Añade · Quita · No toca
Añade: dos clases y CSS en oscuro; «Ver el 1 de …». Quita: «del 1 al 1». No toca: vaso en claro, `sw.js`, datos.

## Frases para el verificador
«Subir Fintonic», «Te queda», «▲ Ver el 1 de noviembre» (con hoy = 3 nov), «Casa», «falta».

## Pasos
- [x] P1 pruebas 530-534 · [x] P2 Dinero · [x] P3 Mes · [x] P4 Casa · [x] P5 viejas (231 232 238 325 326 333 365-372)
