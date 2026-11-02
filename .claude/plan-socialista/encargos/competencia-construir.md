# Encargo · La Competencia · el Consejo aprueba cómo se construye (sesión nueva)

**Estado al cerrar la sesión de maquetas (02/11/2026, rama `claude/la-competencia`):** las maquetas de las fases 1 y 2 están
hechas y **el usuario las aprobó** («Vale me gusta, apruebo las maquetas a y b»). No se ha tocado `app.js`.
El usuario pide ahora **`/plan-socialista` con el Consejo** para aprobar el plan de cómo construirlas, antes de empezar.
(Es él quien lo pide, así que manda sobre el «sin Consejo por tanda» del 02/11: un Consejo para el plan entero, no uno por tanda.)

## Material (todo en la rama `claude/la-competencia`)

- Maquetas: `maquetas/competencia-a.html` (S1 Sueño + víspera, C1 Letra y calma, C2 Apuntar, C3 Hoy) y
  `maquetas/competencia-b.html` (C4 Mes y guardias, C4b Foto del cuadrante, C5 Comer, C6 Hábitos, 4:20 y Estudio),
  con las capturas `maquetas/compa-*.png` y `maquetas/compb-*.png`. Índice: `maquetas/competencia-indice.html`;
  publicado para el usuario en https://claude.ai/artifact/D4ANTgeG33KDYXdFcdmzpS.
- Acta con el dictamen de cada propuesta y «lo que no se puede romper»: `consejo/2026-11-02-competencia.md`.
- Encargo original de la fase 1 (pasos 2-5 siguen valiendo): `encargos/competencia-fase-1.md`.
- `plan-v3.md` → «La Competencia» (tandas C1-C7, plan en 3 fases).

## Lo que eligió el usuario (supuesto: todas las recomendadas)

Aprobó las dos maquetas sin cambiar ninguna opción, así que se toman **las recomendadas** (opción A en todas). **Confírmalo
en una línea al abrir el Consejo.**

| Tanda | 1 | 2 | 3 |
|---|---|---|---|
| S1 Sueño | 3 caras tras «Vale», con «Saltar» | víspera: «Debes X h · cama HH:MM» + cama · último café · siesta + «Avisarme»; en guardia, la siesta | quitar «Te faltan N noches» |
| C1 Letra | suelo **13 px** (14 en Dinero) | avisos de mantenimiento de uno en uno; «Ahora no» = 14 días (regla que ya existe) | verde «ahorras» `#4ade80` y «Apuntar gasto grande» oscura con borde cian, en oscuro |
| C2 Apuntar | «＋ Gasto» de 56 px en la tarjeta Tu mes (hoy + última categoría) | dibujo de Entreno a cinta L–D de 56 px; grande solo en vacío y «Explícamelo» | «＋ serie» −2,5/+2,5 kg y −1/+1 rep |
| C3 Hoy | «Ahora» = frase + cartel + cadena + energía (+ conducir) | tira de hasta 3 hábitos, oculta en guardia y saliente | el dibujo del conductor baja, entero, bajo Para hoy y la comida |
| C4 Mes | «Guardias de noviembre: 2 hechas · 3 por hacer · 5 en total» (en plantilla, 0 y por qué) | «Pegar lo copiado» y, si el móvil no deja, la caja abierta | en Ajustes se queda «‹ Ajustes» |
| C4b Foto | dudas: se quedan como estaban y se avisa | la foto solo en memoria mientras corriges | la primera vez tocas tu nombre en la foto y se recuerda |
| C5 Comer | margen de kcal y proteína al mismo tamaño; pasado el techo, «Has llegado a tu techo de hoy», nunca rojo | se pliegan «Hoy hay Lloret» (abierto desde las 14:00 si hay Lloret), vitaminas y «Tu semana» | «Tocaban lentejas estofadas · lo cambiaste» (gris, sin tachar) |
| C6 Hábitos/4:20 | «Privado» se quita sin PIN por 3 sitios (Deshacer, banda «Quitar privado», interruptor) | la cuenta atrás «Sal al Lloret» se queda; se tapan «Lloretazo», «4:20» y el hábito | con 3 en marcha, la plantilla va a «Esperan turno» |

## Avisos de los maquetadores para el plan

- **C1:** el prototipo subía todo al suelo y aplana la jerarquía 10/11/12 px: el script real necesita una **escala** de escalones
  (variables en `:root`) y su lista de excepciones (casillas del Mes, `fig/`, `.carrilbox`). Coste de alto: +2 a +30 px por vista.
- **S1:** «Debes 1 h 10» se interpretó como deuda de las 3 últimas noches; comprobar de dónde sale en el código.
- **C4b:** no hay foto de cuadrante de prueba y el lector local (`vendor/ocr`) está pensado para tickets: riesgo de coste.
  Hace falta un cuadrante de prueba inventado.
- **C4:** el permiso del portapapeles no se probó en un móvil real (de ahí la caja de reserva).
- **C6:** con PIN puesto, entrar y «Quitar privado» piden el PIN (supuesto): va con `/revisa-seguridad`.
- Las capturas «antes» son solo del tema oscuro; el claro, en la verificación de cada tanda.

## Qué tiene que salir de la sesión

1. Consejo (`/bitacora`, lista cerrada de `gobierno.md`): orden de construcción, qué va en paralelo y qué en cadena (la portada de
   Hoy va Sueño → C1 → C3), fichas por tanda (añade · **quita** · no toca), bloque de 10 números de prueba por tanda detrás de
   los de `main`, y presupuesto. Referencia: fase 1 = Sueño ~1,5 M + C1 ~2,3 M + C2 ~2,3 M; fase 2 ~12 M.
2. Que el usuario lo apruebe (≤3 preguntas, opciones concretas).
3. Después, construir según el encargo de la fase 1 (pasos 2-5).

Gasto de la sesión de maquetas: **5,1 M** (`gastos.md`, `competencia-maquetas`), frente a ~3 M previstos: cada maquetador hizo 94-111 pasos (capturas reales, medidas y 14-24 marcos). Para la próxima: tope de pasos por maquetador y menos marcos por tanda.
