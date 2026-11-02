# Encargo · La Competencia · Fase 1 (día 1): ganar donde la rival gana

Aprobado por el usuario el 02/11/2026: el plan de 3 fases (~38 M previstos, ~50 M como máximo), sin Consejo por tanda
(`gobierno.md`). Fase 2 mañana (03/11), fase 3 pasado (04/11). PDF y Excel: «ya lo veremos más adelante» (no se hacen
sin preguntar).

**Material (todo en la rama `claude/la-competencia`; si tu sesión no nace en ella, `git fetch origin claude/la-competencia`
y trae `.claude/plan-socialista/` y `docs/informe-competencia-2026-11.md`):**
- Acta con el dictamen de cada propuesta: `consejo/2026-11-02-competencia.md` (asuntos 1-4: qué se hace, cómo, y lo que
  no se puede romper).
- `plan-v3.md` → «La Competencia»: tandas C1-C7, C4b y el plan en 3 fases. «Sueño de un toque» (S1-S3) + fila 2 (víspera
  de guardia: «cama · último café · siesta» con «Avisarme», que ya existe en `snOrdenesHTML`).
- Mapa del código: está en el acta (sección «El mapa»). No releas `app.js` entero.
- Decisiones del usuario: 2-a (la cara de la app se queda: tinte granate, cuenta atrás, tono, dibujos, 5 temas; se copia
  orden y tamaño, un color de acción por pantalla, sin emojis en botones de acción), 3-b (foto del cuadrante → C4b, fase 2).

## Tú eres la sesión directora de la fase 1

1. **Maquetas de las fases 1 y 2 de golpe**, en 2 ayudantes sonnet en paralelo, sin concurso:
   A) Sueño de un toque + víspera (S1) · C1 Letra y calma (capturas antes/después a 412×915 de Hoy, Mes, Comer, Dinero
   con suelo de 12 y de 13 px; la lista de avisos por prioridad) · C2 Apuntar (+ en Tu mes, ＋ serie, Empezar arriba) ·
   C3 Hoy en una pantalla.
   B) C4 Mes y guardias (+ puerta y vista previa del planning, C4b foto) · C5 Comer · C6 Hábitos, 4:20 y Estudio.
   En `maquetas/`. Enséñaselas al usuario de una sentada, con como mucho 3 preguntas por tanda y opciones concretas.
2. **Fichas** (`/ficha-de-tarea`) de S2, C1 y C2 con lo que eligió: qué se añade, qué se **quita**, qué no se toca, y un
   **bloque de 10 números de prueba** por tanda detrás de los de `main` (para que no choquen en paralelo).
3. **Construir**, cada una con su constructor sonnet: S2-S3 Sueño → C1 (el script de letra primero, con variables en `:root`
   y lista de excepciones: casillas del Mes, `fig/`, línea del día) en cadena (los dos tocan la portada de Hoy) **‖** C2
   (Dinero y Entreno) en paralelo.
4. **A `main` de una en una**, con la lista «Terminado» de `CLAUDE.md` entera: `git fetch origin main`, suite completa en verde,
   `npm run sella`, Actions en `success`. Se avisa al usuario después con el run.
5. **Traspaso** para la fase 2 (`encargos/competencia-fase-2.md`: lo que eligió para C3-C6, lo que quedó) y el gasto con
   `node tools/gasto.mjs --apunta competencia-fase-1 --tipo construir --nota "…"`.

**Presupuesto de la fase 1: ~9 M** (maquetas ~3 M, Sueño ~1,5 M, C1 ~2,3 M, C2 ~2,3 M). Si se va a pasar más de un 25 %,
para y dilo.
