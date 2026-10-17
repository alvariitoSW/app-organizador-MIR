# Registro del plan socialista

Lo ya contado (para no repetirlo) y lo abierto (hasta que se cierre). Lo escribe Claude en el paso 8;
tú puedes añadir o tachar a mano.

## Encargos aparcados

Del repaso de supuestos del 2026-10-14 (respuestas del usuario). Orden elegido: **tanda 1, lo rápido
primero; tanda 2, lo visual con maquetas primero**.

### Tanda 1 · reglas y arreglos rápidos — HECHA (desplegada el 2026-10-14)

Vacaciones a mano + días gastados, horas de servicio solo de trabajo, todos los eventos en el Mes, carretera
del mes natural, otro día a la hora de levantarte, noche hasta levantarte, un toque en días pasados, bus con
hora real, taxi con su precio, tiempos de la mañana en Ajustes, cafés, siesta del saliente a mano y platos sin
pasos inventados. Ver docs/DECISIONS.md («Repaso de supuestos, tanda 1»).

### Tanda 2 · lo visual — HECHA (desplegada el 2026-10-14)

Ciudad «Trabajo» con entrada y salida hacia el pueblo o el parque, Lloretazo de ida y vuelta, comer en la
cabina, habitaciones de casa al mirar a los lados y más sitio en el quiosco y el poste. Ver docs/DECISIONS.md
(«Repaso de supuestos, tanda 2»).

### Rediseño artístico (en marcha desde el 2026-10-14)

- [enc-arte] Llevar el aspecto visual de la app a otro nivel con varios agentes: fase 0 auditoría (5 agentes) →
  fase 1 dirección de arte (estilo: «sorpréndeme») → fase 2 maquetas por sección (+ /anatomy) → fase 3 construir,
  empezando por **lo común de toda la app**. Iconos: «algo con vida propia, sorpréndeme».
  · F0 y F1 hechas (2026-10-14): dirección «La jornada» con visto bueno; barra abajo, guardia 65 % rojo, claros
    suavizados. Siguiente: construir lo común por tandas.
- [enc-continuidad] **Continuidad** como filosofía del arte: el tiempo pasa, la energía se gasta y se recarga, lo que
  haces deja huella; un solo hilo de tiempo sin cortes a medianoche. Ver design/arte/continuidad.md · 2026-10-14

- [enc-plan-comidas] Montar la semana de comidas: ideas de contenido y diseño dadas el 2026-10-17 (días pasados,
  2 platos repetidos, desayuno vacío, sin cambiar casillas, cuándo cocinas, 4 formas de llenar la semana). Maquetas de 3
  direcciones en design/comer-plan/; el usuario pidió combinarlas → design/comer-plan/combinada.png (espera visto bueno).
  Arreglos sueltos y el aviso del Mes en Comer: hechos y desplegados (5ec269c).

- [enc-nutricionista] Nutricionista integral (2026-10-17): compensar picos repartiendo en 2–3 días con techo diario;
  días de Lloret cena saciante lista antes + kit de vuelta; chocolate con tope semanal y alternativas; la semana siempre
  visible arriba en Comer → Hoy e informe del domingo (bien · falta · a cambiar, metas, semana a semana). Maquetas en
  design/nutricionista/ aprobadas y construidas: desplegado en main (aaa1805). Bebidas en ml: hecho y desplegado.

### A futuro (sin fecha)

- [enc-bienestar-digital] Leer el **uso real de pantalla** (Bienestar digital del móvil) para hábitos y pantallas, y un hábito **«sin pantallas» fijo**, que no se pueda quitar desde la app (solo pidiéndoselo a Claude Code) · sup. 22
- [aparc-parte-diario] Programar el parte para que salga solo cada mañana (falta decidir la hora) · desde 2026-10-14

## Supuestos sin confirmar

<!-- - [sup-AAAA-MM-DD-tema] el supuesto · DECISIONS.md:línea · contado el AAAA-MM-DD -->
- [sup-2026-10-14-quita-urg] las 4 guardias que te quitas salen de Urgencias · DECISIONS.md (guardias R1) · contado el 2026-10-14
- [sup-2026-10-14-guardia-hoy] una guardia de hoy cuenta como «puesta» hasta mañana · DECISIONS.md (guardias R1) · contado el 2026-10-14
- [sup-2026-10-14-sin-vac] ya no se resta una guardia por semana de vacaciones · DECISIONS.md (guardias R1) · contado el 2026-10-14
- [sup-2026-10-14-t1t2] 6 más de las tandas 1 y 2 (cafés, café de otro día, siesta de guardia, Lloretazo 0,6 h, cartel azul, «+N más») · DECISIONS.md · contado el 2026-10-14 (solo el número)

## Cerrados

- 2026-10-14 · **Valen:** 1 (R1: semana = 5 laborables), 9 (cabina de guardia también de día), 10 (manda lo que acaba más tarde), 13 (sin hora no es parada), 15 (taxi solo por la mañana), 26–30 (internos)
- 2026-10-14 · **No valen → encargos de arriba:** 2, 3, 4, 5, 6, 7, 8, 11, 12, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25

## Contado

<!-- - [id] AAAA-MM-DD · qué se dijo · estado en ese momento -->
- [run-38605035020] 2026-10-14 · último despliegue de main (cfac5e9) · success
- [sello-2227c57] 2026-10-14 · main sellado, nada sin sellar · ok
- [rama-cfac5e9] 2026-10-14 · main y rama iguales · ok
- [issues-0] 2026-10-14 · ningún issue ni PR abierto · ok
- [aparc-parte-diario] 2026-10-14 · recordado: falta la hora · abierto
- [tanda1-repaso] 2026-10-14 · tanda 1 del repaso desplegada (724/724 pruebas) · hecha
- [tanda2-repaso] 2026-10-14 · tanda 2 del repaso (el conductor) desplegada · hecha
- [run-38642732419] 2026-10-14 · despliegue de main (adca9d1, guardias de R1) · success
- [run-38709963353] 2026-10-17 · despliegue de main (0f2765e: «La jornada» tandas 1–2, R1 con el mes en curso) · success
- [rama-0f2765e] 2026-10-17 · main y rama iguales, sellado · ok
