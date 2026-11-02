# Ficha · La Competencia · C2 Apuntar en menos toques (Dinero y Entreno)

## Qué y para qué
- Dado Tu mes, cuando toco «＋ Gasto» (56 px), entonces se abre la hoja de siempre con hoy y la última categoría puesta.
- Dado Entreno con rutina, cuando abro la portada, entonces veo una cinta L–D de 56 px y «Empezar» sin desplazar (con sesión, «▶ Seguir»; tras guardia, «Vienes de guardia» por encima).
- Dado Entreno libre, cuando toco «＋ serie», entonces elijo uno de mis 5 últimos ejercicios y guardo con ±2,5 kg / ±1 rep.
- Dado el rótulo, entonces dice «Semana 1 de 5 · 0 entrenos» (singular «1 entreno»).

## Dónde se toca
- app.js: `dinTuMesHTML` (pastilla `.tm-mas`), `case 'dinero-apuntar'` (`dineroS().ultCat`), `gymSemanaLinkHTML`, `gymCintaHTML`, `serieAbre/serieUltimos/serieEditHTML`, `renderGymPortada`, `gymHeroHTML` (plan recomendado, «＋ serie»); acciones `gym-serie`, `serie-elige`, `serie-paso`, `serie-guardar`, `lam-abrir` (solo en `act()`).
- styles.css: `--toque-grande:56px` en `:root`; `.tm-mas`, `.gcinta/.gcd`, `.gsemrow`, `.gplanrec`, `.gser`, `.gpaso`, `.gvuelta2`.
- Pruebas 460-463.

## Añade
«＋ Gasto» en Tu mes; la hoja recuerda la categoría; cinta de 56 px; «＋ serie»; plan recomendado en el Hoy vacío; botón «Tu vuelta · semana N de M» junto a la cinta; «Explícamelo» a petición.

## Quita
El dibujo grande de Entreno cuando hay datos (solo sale sin rutina y con «Explícamelo»); el texto «N hechos · bloque · sem x/y ⚙».

## No toca
La sesión en vivo, «Vienes de guardia», la rutina por tipo de día. «Copiar mi último entreno» y «guardar como rutina» (tanda 7).

## Frases para el verificador
«＋ Gasto», «la última vez fue», «＋ serie», «Guardar serie», «Explícamelo», «Usar este plan», «Semana 1 de 5 · 0 entrenos», «▶ Seguir».

## Pasos
- [x] P1 pruebas 460-463 · tests/regression.test.js
- [x] P2 Dinero: pastilla + categoría recordada
- [x] P3 Entreno: cinta, rótulo, plan recomendado, «＋ serie»
- [x] P4 pruebas viejas ajustadas (212, 353, 356, 357, 358, 323, 350)
