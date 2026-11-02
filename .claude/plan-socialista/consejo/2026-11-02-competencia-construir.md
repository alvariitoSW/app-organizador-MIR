# Consejo de Ministros · 2026-11-02 (noche) · «La Competencia»: cómo se construye

Lo convocó el usuario (encargo `encargos/competencia-construir.md`) y lo preside Transportes (`/bitacora`). Las maquetas A y B
están aprobadas, y el usuario confirmó **las opciones recomendadas en todas las tandas** (02/11). No se construye nada en
esta reunión. El mapa es el del acta `2026-11-02-competencia.md`; Interior comprobó las líneas en la rama.

## Orden del día

1. El orden de construcción: qué va en cadena y qué en paralelo.
2. Las fichas de cada tanda: qué se añade, qué se quita y qué no se toca, las frases para el verificador y el bloque de pruebas.
3. Los riesgos técnicos: S1 «Debes», la escala de C1, el lector de C4b y el «Privado» de C6.
4. El presupuesto y lo que vuelve al usuario.

## Asunto 1 · Orden

| Ministerio | Dictamen | Voto |
|---|---|---|
| Interior + Justicia | Zonas de choque: la portada de Hoy (S1, C1, C3), la tarjeta Tu mes (C2 y C3), la tira de hábitos y el tapado de 4:20 en Hoy (C3 y C6), importar planning (C4 y C4b), y `styles.css` (C1 con todas). Propone S1 → C1 → (C2 ∥ C4 ∥ C5) → C3 → (C4b ∥ C6). Mientras C1 no esté en `main`, ninguna otra rama escribe CSS nuevo con px sueltos | con cambios |
| Bienestar + Sanidad | Lo que más alivia un día de guardia es S1 y después C3; C4b, al final y con tope | con cambios |
| Hacienda (preside) | S1 casi no toca CSS y C2 vive en Dinero y Entreno. Pueden ir **en paralelo** antes de C1, sin esperar | a favor |

**Acuerdo:**
- **Fase 1:** (S1 ∥ C2) → C1, que va sola porque reescribe `styles.css`.
- **Fase 2:** (C3 ∥ C4 ∥ C5) → (C6 ∥ C4b).
- C2 va antes de C3 porque comparten Tu mes. C6 va después de C3 porque comparten Hoy. C4b va después de C4 porque comparten importar.
- El CSS nuevo usa las variables `--t-*` de `:root`, nunca px sueltos.
- Cada rama se pone al día con `main` antes de su suite final, y pasan a `main` **de una en una**.

## Asunto 2 · Fichas (resumen; cada constructor escribe la suya con `/ficha-de-tarea`)

Las pruebas van en bloques de 10, detrás de la 449 de `main`.

| Tanda | Pruebas | Añade | Quita | No toca | Frases para el verificador |
|---|---|---|---|---|---|
| S1 Sueño + víspera | 450-459 | 3 caras tras «Vale» con «Saltar». Víspera: «… · cama HH:MM» + cama · último café · siesta + «Avisarme» (`snOrdenesDe`). En guardia, la siesta | «Te faltan N noches» (`snfalta`), según la pregunta 1 | «Vale, 23:15», el plan de sueño de guardia, el aviso de no conducir. «Saltar» no borra el plan | «Avisarme», «Saltar», «cama» |
| C2 Apuntar | 460-469 | «＋ Gasto» de 56 px en Tu mes (hoy + última categoría). Cinta de Entreno de 56 px (grande solo en vacío y en «Explícamelo»). «＋ serie» ±2,5 kg / ±1 rep. Rótulo de semana | el dibujo grande de Entreno cuando hay datos | la sesión en vivo, «Vienes de guardia», la rutina por tipo de día | «＋ Gasto», «＋ serie», «Explícamelo» |
| C1 Letra y calma | 470-479 | `tools/` con un script repetible: px sueltos <13 → escala `--t-*`, **un escalón** (10→11, 11→12, 12→13; no se aplana). Dinero a 14 con una regla de sección. Avisos de mantenimiento de uno en uno, con «Ahora no» = 14 días. Verde «ahorras» `#4ade80` y «Apuntar gasto grande» oscura con borde cian | la pila de avisos de mantenimiento | las casillas del Mes (`.dnum`), `fig/`, `.carrilbox`, los textos dentro de SVG, las franjas de guardia, saliente y conducir | «Ahora no», «ahorras». Medir ≥13 px a 412 |
| C3 Hoy | 480-489 | «Ahora» = frase + cartel + cadena + energía (+ conducir). Tira de ≤3 hábitos | la fila fija de hábitos; el conductor arriba (baja entero) | la cadena guardia › comida › ocio › sueño, «Sal al Lloret», el aviso de no conducir a la vista | «Sal al Lloret», el aviso de conducir bajo «Para hoy» |
| C4 Mes | 490-499 | «Guardias de noviembre: N hechas · N por hacer · N en total» (en plantilla, 0 y el porqué). «Pegar lo copiado» + caja de reserva. «‹ Ajustes» | el contador doble | el color por tipo de día, las horas en la casilla, guardia + saliente de una vez, el motor de rotación | «hechas · », «Pegar lo copiado», «‹ Ajustes» |
| C5 Comer | 500-509 | margen de kcal y proteína al mismo tamaño; «Has llegado a tu techo de hoy», nunca rojo; plegables a 1 toque | el tachado del «en vez de» (pasa a «Tocaban … · lo cambiaste», en gris) | texto libre, kit de vuelta, cena antes de salir, tandas, vitaminas y verdura (plegadas, a 1 toque). «Hoy hay Lloret» abierto desde las 14:00 | «Has llegado a tu techo de hoy», «lo cambiaste» |
| C6 Hábitos, 4:20, Estudio | 510-519 | «Privado» tapa también sin PIN, con un campo nuevo y el saneado de la carga (L974). Quitar en 3 sitios. «Esperan turno» | — | la cuenta atrás «Sal al Lloret», el PIN donde ya está | «Quitar privado», «Deshacer», «Esperan turno» |
| C4b Foto | 520-529 | foto → texto con `ocrListo()` (sin tocar `sw.js`) → vista previa de C4. La foto solo en memoria; tocar tu nombre la primera vez | — | importar texto y .ics | el aviso de dudas, «tu nombre» |

Todas las capturas las hace el `verificador` a 412×915, en **claro y en oscuro** (las de «antes» solo eran en oscuro).

## Asunto 3 · Riesgos técnicos

- **S1 «Debes X h».**
  - La cifra no existe todavía. Se saca de `suenoEstado` (las 3 últimas noches que estén apuntadas).
  - El código quitó a propósito la «deuda de 14 días»: subía con las guardias y nunca bajaba.
  - Por eso Sanidad e Interior piden **no hablar de deber**. Pasa al usuario (pregunta 2).
  - La prueba usa fecha fija y 3 noches exactas.
- **C1, la letra.**
  - El script se hace una vez, se puede repetir y se revisa cambio por cambio.
  - Caerán varias pruebas que miden tamaños de letra (L7816, L11827, L12776, L14664…).
  - Si una cae por un cambio decidido, se cambia lo que espera la prueba y se apunta en DECISIONS. Saltarse una prueba vuelve al usuario.
- **C4b, la foto.**
  - Es lo más arriesgado: el lector está afinado para tickets.
  - El cuadrante de prueba se inventa, generado por código en la propia prueba, nunca uno real.
  - En las pruebas, la lectura se simula y se deja una sola prueba real del lector.
  - Lleva un tope duro: si sobre el cuadrante de prueba no sirve, se para al 25 % y se avisa.
- **C6, privacidad.**
  - Se separan `cnPin()` (pedir PIN) y `cnTapado()` (tapar). Si no, un «Privado» sin PIN pediría un PIN que no existe.
  - Es un campo añadido, no una migración.
  - Pasa por `/revisa-seguridad`, que comprueba que nada de 4:20 sale tapado en pantalla, avisos, `aria-label` o copias, y que el texto sigue siendo honesto: «tapa la sección; no cifra».

## Asunto 4 · Presupuesto (Hacienda)

- **Fase 1:** S1 ~1,5 M + C2 ~2,3 M + C1 ~2,3 M = **~6,1 M** (las maquetas ya costaron 5,1 M).
- **Fase 2:** ~12 M.
- Todo dentro de los ~38 M aprobados (máx. ~50 M).
- Constructores en sonnet, con un tope de ~60 pasos y la ficha completa en el primer encargo. Una sola suite completa por tanda.
- Si una tanda se va a pasar más de un 25 %, se comparece.

## Lo que vuelve al usuario (2 preguntas)

1. **«Te faltan N noches» (S1).** Hoy es la única entrada desde Hoy para anotar noches de hace 2-3 días.
   - (a) Se quita el aviso, y la fila «Anoche …» lleva un «otras noches» pequeño que abre Sueño (**recomendada**).
   - (b) Se quita sin más; las noches sueltas se anotan desde Sueño.
   - (c) Se queda como está.
2. **El texto de la víspera (S1).**
   - (a) «Faltan 1 h 10 en tus 3 últimas noches · cama 23:15», sin rojo y sin prometer que se recupera (**recomendada**).
   - (b) «Debes 1 h 10 · cama 23:15», como en la maqueta.
   - (c) Solo «cama 23:15», sin cifra.

## Lo que entra en el plan

`plan-v3.md` → La Competencia: el orden (S1 ∥ C2) → C1 → (C3 ∥ C4 ∥ C5) → (C6 ∥ C4b), los bloques de pruebas 450-529 y la
fase 1 en ~6,1 M (Consejo, 2026-11-02).
