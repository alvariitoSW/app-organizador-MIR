# Ficha · La Competencia · T2b Estudio «Empieza» (C7·d)

## Qué y para qué
- Dado Estudio sin objetivos ni temario, cuando lo abro, entonces veo «¿Qué vas a estudiar?» con 4 chips, horas al día (− / +, de 0,5 en 0,5) y «12 págs hoy · 1 h · acabas el 14 dic».
- Dado que hay guardia o saliente por delante, entonces «acabas» no los cuenta (una guardia retrasa 2 días: guardia + saliente).
- Dado «Empezar», entonces se crea el objetivo (420 págs, 12 págs/h) con ese título y esas horas; el libro dice la misma fecha.
- Dado «Prefiero rellenarlo todo a mano», entonces sale el formulario de siempre.

## Dónde se toca
- app.js: `estudioDiaLibre`, `estudioFinDias`, `empPlan`, `estEmpiezaHTML` (junto a `libroCalc`; `b.sg` hace que `libroCalc` salte guardias), portada de Estudio vacío (`renderEstudio`), acciones `emp-q`, `emp-h`, `emp-ok`, `emp-mano` (solo en `act()`).
- styles.css: `.emp-cap`, `.emp-ch`, `.emp-ah`, `.emp-ok`, `.emp-lnk`.
- Pruebas 550-552 (553-559 libres).

## Añade
Tarjeta «Empieza»; el cálculo sin guardias ni salientes; la marca `sg` en objetivos creados desde ahí.
## Quita
Nada. El formulario, el HUD y «traer mi temario» siguen tras «Prefiero rellenarlo todo a mano».
## No toca
Objetivos ya creados (sin `sg` se calculan como antes), el temario, Entreno y Hoy.

## Frases para el verificador
«¿Qué vas a estudiar?», «Temario de la especialidad», «¿Cuánto al día, los días sin guardia?», «págs hoy», «acabas», «Con 420 páginas y sin estudiar los días de guardia ni los salientes.», «Empezar», «Prefiero rellenarlo todo a mano».

## Pasos
- [x] P1 pruebas 550-552 · [x] P2 helpers y tarjeta · [x] P3 acciones · [x] P4 pruebas viejas (74/Estudio y 204 pasan por «a mano»)
