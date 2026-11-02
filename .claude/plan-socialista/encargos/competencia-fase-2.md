# Encargo · La Competencia · Fase 2 (día 2): Hoy, Mes, Comer, y después Hábitos/4:20 y la foto del cuadrante

**Estado al cerrar la fase 1 (02/11/2026, rama `claude/la-competencia`):** en `main` están el arreglo de salud (397d con
fecha fija, «otro mes» en el Mes · 449g), **S1 Sueño de un toque** (450-459) y **C2 Apuntar** (460-463). **C1 Letra y calma**
(470-474): ver la última línea de este encargo, la que dice si llegó a `main`.

## Material

- Orden y bloques de pruebas: acta `consejo/2026-11-02-competencia-construir.md` (asuntos 1-3). **Fase 2: (C3 ∥ C4 ∥ C5) →
  (C6 ∥ C4b).** Pruebas: C3 480-489 · C4 490-499 · C5 500-509 · C6 510-519 · C4b 520-529.
- Lo que eligió el usuario para C3-C6 y C4b: **las recomendadas** (tabla de `encargos/competencia-construir.md`, columnas 1-3).
  Maqueta A (`id=c3`) y maqueta B (`maquetas/competencia-b.html`).
- Mapa del código: acta `consejo/2026-11-02-competencia.md`, «El mapa». Fichas de la fase 1 como ejemplo:
  `fichas/competencia-s1.md`, `-c1.md`, `-c2.md`.

## Lo que aprendió la fase 1 (para gastar menos)

1. **Los constructores en worktree nacen en un commit viejo.** Primera orden del encargo:
   `git fetch origin claude/la-competencia && git reset --hard origin/claude/la-competencia`, y `ln -s` de `node_modules`.
2. **Que el constructor pase las pruebas viejas de su pantalla** (`grep` del selector que cambia en `tests/`), no solo las suyas:
   C2 dejó caer la 77 y la 213 (miraban la lámina de Entreno) y costó una suite completa de más (~7 min) y una vuelta.
3. **Nunca dos suites completas a la vez** (constructor y quien dirige): con 4 núcleos, las pruebas con tiempo (298, 408,
   el arco del sol) caen al azar. La suite completa la corre solo quien dirige, con el equipo libre.
4. Arreglos de pruebas frágiles hechos: CH6-c 408 mide la caja tras asentarse; la del arco del sol entra en modo Reloj.
   Si vuelve a caer una prueba «de tiempo» con el equipo libre, es un fallo de verdad.

## Lo que queda abierto de la fase 1

- **C1 cambia la cola de avisos de Hoy** (`avisoCola()`): C3 rehace Hoy encima de eso; no reabrir la cola salvo que estorbe.
- C1: «Aún no» de la sugerencia de cama sigue fijando el escalón (no aparta 14 días); el modo plantilla solo entra en la cola en Hoy.
- C1 no miró en **tema claro** Hoy, Mes, Comer ni Dinero (sí lo mide la prueba 470 en oscuro). S1: la fila «Anoche» no se miró
  en claro. C2: la hoja «＋ serie» y Entreno vacío no se miraron en captura. → **Una pasada del verificador en claro** al
  empezar la fase 2 (Hoy, Dinero, Entreno), ~0,2 M.
- S1: la fila «Anoche» solo sale con «He vuelto» + «En pie» (la cama es la hora de «He vuelto»).
- C2: «Tu vuelta · semana N de M» (botón bajo la cinta) no estaba en la maqueta: se hizo para no perder la vuelta tras parón.
- PDF y Excel del planning: «ya lo veremos más adelante» (no se hacen sin preguntar).

## Presupuesto

Fase 2: **~12 M** (acta, asunto 4). Constructores sonnet con la ficha completa en el primer encargo y tope de ~60 pasos
(en la fase 1 se pasaron: 58, 83 y 122 pasos; C1 fue el caro por la suite completa propia). Si una tanda va a pasar del 25 %, parar y decirlo.
