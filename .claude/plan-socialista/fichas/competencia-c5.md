# Ficha · La Competencia · C5 Comer

## Qué y para qué
- Dado Comer · Hoy con objetivo, cuando abro, entonces veo «N kcal de margen» y «N g de proteína por tomar» al mismo tamaño; pasado el techo, «Has llegado a tu techo de hoy», nunca en rojo.
- Dado Hoy, entonces «Hoy hay Lloret» (abierto desde las 14:00), vitaminas y «Tu semana» van plegados a un toque.
- Dado un plato cambiado, entonces «Tocaban X · lo cambiaste», en gris y sin tachar.
- Dada la tira L–D en claro, entonces ≥4,5:1.

## Dónde se toca
app.js: `cjeAhoraHTML`, `cjeMargenHTML`, `cmPleg/cmPlegHTML`, `vitPlegHTML`, `nutSemPlegHTML`, `nutLloretPlegHTML`, `cjeComidaHTML`, acción `cm-pleg` (solo `act()`). styles.css: `.cjmarg/.cjmk/.cmplh/.cmplb`, `.cjs7 b` claro.

## Añade · Quita · No toca
Añade: margen, plegables. Quita: el tachado de «en vez de». No toca: texto libre, kit de vuelta, cena antes de salir, tandas, objetivo y techo, «¿Me la propones?».

## Frases para el verificador
«de margen hoy», «de proteína por tomar», «Has llegado a tu techo de hoy», «Hoy hay Lloret», «Vitaminas de hoy», «Tu semana», «Tocaban … · lo cambiaste».

## Pasos
- [x] pruebas 500-503 · [x] código · [x] viejas (231 239 318 319 332 334 338 362 383 396 470 474) · [ ] captura del verificador
