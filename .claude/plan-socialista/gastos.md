# Gastos: lo que cuesta cada tarea

Para que cada tarea cueste un poco menos que la anterior del mismo tipo (idea traída de `fiebres-neutropenias`,
REGLAS §4.7). Lo escribe Claude al cerrar cada tarea con `node tools/gasto.mjs --apunta …` (paso 7 de
`cierra-y-despliega`); lo lee `/plan-socialista` para dar el presupuesto de la siguiente.

**Cómo se mide.** «Equivalente» = entrada ×1 + caché escrita ×1,25 + caché leída ×0,1 + salida ×5, en tokens de
entrada. No mezcla modelos: un token de opus cuesta más que uno de sonnet o haiku, por eso cada fila dice su modelo.
«Pasos» = herramientas usadas. El contenedor es nuevo en cada sesión: **solo se puede medir la sesión en la que
estás**, así que se mide antes de despedirse o se pierde.

**Por qué sube el gasto.** En cada paso se relee todo lo que lleva la conversación: 100 pasos cuestan mucho más
que el doble de 50. Lo que más encarece: sesiones largas con varias tareas, leer archivos enteros (`app.js`),
capturas mirándolas en la conversación principal y la suite completa repetida.

## Presupuestos vigentes (por tipo de tarea)

El presupuesto de la siguiente tarea de un tipo es el **90 % de la última medida** de ese tipo y modelo. Se dice al
empezar la tarea y a cada ayudante en su encargo («para en ~N pasos y entrega lo que tengas»). Si se pasa, el
traspaso explica por qué.

Una cifra por tipo (simplificada el 02/11/2026, Consejo asunto 3). El detalle de cada medida está en «Tareas medidas».

| Tipo | Presupuesto siguiente | Cómo (lo que lo hace posible) | De qué medida |
|---|---|---|---|
| estudio (Consejo) | **~0,6 M** | mapa en sonnet con ≤12 búsquedas + 2 dictámenes; quien preside lee cabeceras, no archivos enteros | consejo-gobierno 0,77 M (02/11) · media de 8: 0,79 M |
| maqueta | **~0,5 M** | sin concurso, con las pantallas ya fijadas en el acta; un encargo al sonnet y una pasada del verificador (con concurso: ~2,7 M) | mananas-lm1 0,46 M (31/10) |
| construir | **~1,2 M** | ficha con líneas exactas y qué se quita + un constructor sonnet con todas las condiciones + verificador | mananas-lm2/lm3 1,2 M · chef-ch5 1,3 M |
| arreglo | **~0,5 M** | sitio ya localizado: sin ayudantes; cierre con verificador, suite, sella y main | mananas-lm5 0,43 M · suite-fecha-fija 0,62 M |
| datos | **~0,2 M por lote de 15** | script de una vez por lote, sin releer el JSON; el principal solo lanza y sube | chef-ch4 (01/11) |
| herramientas | **~0,4 M** | sin ayudantes, sin releer skills enteras | v3-plan-global 0,44 M (27/10) |
| parte | sin medir | — | — |

## Tareas medidas

| Fecha | Tarea | Tipo | Modelos | Ayudantes | Pasos | Equivalente | Lo que más gastó | Qué encareció · cómo ahorrar |
|---|---|---|---|---|---|---|---|---|
| 2026-10-27 | v3-plan-global | herramientas | opus-5-5 | 0 | 26 | **439 k** | sesión principal (100 %) | leer el otro repositorio y las skills enteras; sin ayudantes |
| 2026-10-28 | v3-plan-global-2 | herramientas | opus-5-5 | 0 | 45 | **1,1 M** | sesión principal (100 %) | spec-kit, plan de Comer, puesta al día y unir ramas; sin ayudantes. Ahorro: no releer skills enteras |
| 2026-10-28 | consejo-dinero | estudio | opus-5-5 + sonnet-5-5 | 3 | 48 | **990 k** | sesión principal (56 %) | instalar el gobierno + 1.er Consejo; leer el otro repo por trozos; mapa en sonnet evitó releer app.js |
| 2026-10-28 | feria-dinero | maqueta | opus-5-5 + sonnet-5-5 + haiku-5-5 | 13 | 153 | **3,5 M** | sesión principal (44 %) | 10 maquetas en sonnet/haiku (~120-180 k cada una); la sesión larga encareció la principal: la feria debió ir en sesión nueva |
| 2026-10-28 | la-rara | maqueta | opus-5-5 + sonnet-5-5 + haiku-5-5 | 27 | 331 | **8,9 M** | sesión principal (35 %) | concurso de 6 escuelas + 4 de mejora; haiku sacó 1,1,3 en diseño libre: para maquetas raras, sonnet |
| 2026-10-28 | v3-comer-mapa | maqueta | opus-5-5 + sonnet-5-5 + haiku-5-5 | 8 | 192 | **3,6 M** | sesión principal (41 %) | concurso de 4 diseñadores sonnet + 2 rondas + ronda final y escribir (pedido por el usuario); principal opus 40 %. Ahorro: el concurso en 1 ronda con críticas cruzadas basta; capturas por guion, no por ayudante |
| 2026-10-28 | v3-lector | construir | opus-5-5 + sonnet-5-5 + haiku-5-5 | 3 | 99 | **2,3 M** | sesión principal (78 %) | clasificar 230 fallos y revisar kcal a mano · ajustar expectativas por script y mirar solo lecturas raras |
| 2026-10-28 | v3-dinero-d1-d6 | construir | opus-5-5 + sonnet-5-5 | 13 | 498 | **9,9 M** | D6 · quitar lo viejo de Dinero (31 %) | 6 piezas en sonnet; D6 3,1 M (quitar al final, sin cortar al pasar el tope) · quitar lo viejo dentro de cada D y vigilar a los de fondo |
| 2026-10-28 | v3-comer-reloj-1 | construir | opus-5-5 + sonnet-5-5 | 6 | 190 | **3,1 M** | P2 escribir con rueda por fila (41 %) | dos constructores sonnet a la vez (línea y escribir) + uno para quitar la lista repetida que dejó el primero · ahorro: en la ficha, decir qué se QUITA, no solo qué se añade |
| 2026-10-28 | consejo-deporte | maqueta | opus-5-5 + sonnet-5-5 + haiku-5-5 | 10 | 138 | **3,9 M** | sesión principal (21 %) | Consejo + concurso de 6 (4 sonnet, 2 haiku): las haiku gastaron casi el doble que las sonnet (580-626 k frente a 150-350 k); el jurado con capturas de página entera, 337 k |
| 2026-10-28 | la-vuelta-r2 | maqueta | opus-5-5 + sonnet-5-5 + haiku-5-5 | 16 | 258 | **7,0 M** | sesión principal (22 %) | 2.ª ronda: 6 sonnet sin jurado; la sesión entera 7,0 M (Consejo + 2 rondas). Sin jurado se ahorra ~0,35 M por ronda |
| 2026-10-29 | v3-la-vuelta | construir | opus-5-5 + sonnet-5-5 + haiku-5-5 | 20 | 466 | **11,7 M** | sesión principal (23 %) | Obra A sonnet 1,2 M + Obra B sonnet 2,0 M + pruebas de fecha 0,24 M + verificador 0,2 M; la ficha con líneas exactas evitó releer app.js |
| 2026-10-28 | v3-comer-reloj-s2 | construir | opus-5-5 + sonnet-5-5 | 6 | 402 | **12,1 M** | S3b P1: Semana y Casa (61 %) | 4 historias + quitar 3 pestañas en una sesión: P1 Semana+Casa 7,4 M (167 pasos, caché leída 40 M al ir quitando y reescribiendo 13 pruebas viejas), P2 vitaminas+investigar 2,4 M, pulido tras capturas 1,1 M · ahorro: partir lo que quita pestañas en su propio encargo y tope duro de pasos; el worktree nace en main viejo, dar el commit base en el encargo |
| 2026-10-29 | consejo-calendario-sueno | estudio | opus-5-5 + sonnet-5-5 | 3 | 52 | **886 k** | sesión principal (48 %) | Consejo de La Noche: mapa sonnet 21 pasos (amplio) + 2 dictámenes; juntar la rama con main (3 conflictos) encareció la principal · mapa con tope de 12 pasos y rama al día antes del Consejo |
| 2026-10-29 | la-noche-n0 | maqueta | opus-5-5 + sonnet-5-5 | 3 | 56 | **794 k** | sesión principal (74 %) | 3 maquetas (A cartel gana, empate decidido por Bienestar), 2 rondas de verificador, jurado opus; ficha N1-N2 |
| 2026-10-29 | la-noche-n1 | construir | opus-5-5 + sonnet-5-5 | 2 | 66 | **1,1 M** | Construir N1 la cuenta atrás (76 %) | N1 de La Noche: cartel arriba de Hoy en 4 modos, quita sueño y mañana suelta; obra sonnet ~0,87 M, capturas ~0,08 M |
| 2026-10-29 | la-noche-n2 | construir | opus-5-5 + sonnet-5-5 | 2 | 76 | **1,8 M** | Obra N2 de La Noche (74 %) | P6-P11: hoja, alarmas, semana, escalón y .ics; pasó de presupuesto (1,8 M) por la obra en 40 pasos |
| 2026-10-29 | consejo-reforma | estudio | opus-5-5 + sonnet-5-5 | 4 | 45 | **1,0 M** | sesión principal (34 %) | — |
| 2026-10-29 | reforma-r1-tu-mes | maqueta | opus-5-5 + sonnet-5-5 + haiku-5-5 | 9 | 166 | **3,0 M** | sesión principal (30 %) | concurso de 5 escuelas sonnet + jurado haiku + Artes Visuales opus · ahorro: bases con cifras ya cuadradas, guion de oficio y de capturas común (juzga.cjs), escuelas con tope de pasos |
| 2026-10-30 | reforma-r3-gasto-grande | construir | opus-5-5 + sonnet-5-5 | 4 | 115 | **2,2 M** | Constructor R3 gasto grande (57 %) | constructor sonnet con ficha (208 k) · capturas y suite aparte; el parte y la salud al abrir |
| 2026-10-30 | consejo-gran-ley | estudio | opus-5-5 + sonnet-5-5 | 3 | 30 | **688 k** | sesión principal (47 %) | mapa sonnet + 2 dictámenes en paralelo; el mapa encontró R4 casi hecha |
| 2026-10-30 | reforma-r4-fintonic | arreglo | opus-5-5 + sonnet-5-5 | 4 | 87 | **1,2 M** | sesión principal (51 %) | ficha + constructor sonnet + captura; la captura cazó «Todo cuadra» · ahorro: decir al verificador el texto exacto de la prueba |
| 2026-10-30 | reforma-r5-comer | maqueta | opus-5-5 + sonnet-5-5 + haiku-5-5 | 5 | 92 | **1,0 M** | sesión principal (38 %) | una sola maqueta sonnet + 1 ronda de retoques; el mapa haiku de app.js (176 k) se reaprovecha en R6-R8 · ahorrar: pasar al maquetador la ficha con §3 y los retoques de Bienestar desde el principio |
| 2026-10-30 | gran-ley-g1 | arreglo | opus-5-5 + sonnet-5-5 | 1 | 116 | **1,7 M** | sesión principal (89 %) | 4 arreglos + verificador sonnet + parte programado; se pasó (1,7 M de 1,0): la principal hizo todo en opus sin constructor sonnet · ahorro: ficha corta y un constructor sonnet para los 4 arreglos |
| 2026-10-30 | reforma-r6-compra-congelador | construir | opus-5-5 + sonnet-5-5 | 3 | 178 | **3,6 M** | R6 obra: compra base y congelador (47 %) | obra sonnet 1,7 M (64 pasos) + principal 1,6 M: main cambió dos veces a mitad (G1) y hubo que mezclar, renumerar pruebas y pasar 3 suites enteras · ahorro: antes de construir, git fetch de main y numerar las pruebas detrás de lo último de main |
| 2026-10-30 | consejo-remates | estudio | opus-5-5 + haiku-5-5 + sonnet-5-5 | 3 | 41 | **774 k** | sesión principal (39 %) | — |
| 2026-10-30 | remates-l1-l5 | construir | opus-5-5 + sonnet-5-5 + haiku-5-5 | 8 | 252 | **5,6 M** | L3 construir Remates (30 %) | — |
| 2026-10-30 | cierre | construir | opus-5-5 + sonnet-5-5 | 4 | 100 | **1,4 M** | C1 maqueta de iconos (34 %) | C1+C2 en el mismo ayudante; C1 y C3 en paralelo |
| 2026-10-30 | chef-ch1 | datos | opus-5-5 | 0 | 53 | **1,3 M** | sesión principal (100 %) | CH1 sin ayudantes: prueba en node (0 s) en vez de navegador; el catálogo con un script de transformación. Una suite completa. |
| 2026-10-30 | chef-ch2 | construir | opus-5-5 + sonnet-5-5 | 2 | 51 | **734 k** | sesión principal (58 %) | dirigido en opus, obra en sonnet, verificador; suite 880/881 (397c aparcada) |
| 2026-10-31 | chef-ch2-main | desplegar | opus-5-5 + sonnet-5-5 | 2 | 105 | **1,8 M** | sesión principal (83 %) | subida a main; arregladas 3 pruebas del día 31 y la 397c |
| 2026-10-31 | chef-ch3 | maqueta | opus-5-5 + sonnet-5-5 | 2 | 57 | **705 k** | sesión principal (51 %) | dirigido en opus, maqueta en sonnet, dos pasadas del verificador |
| 2026-10-31 | consejo-mananas | estudio | opus-5-5 + sonnet-5-5 + haiku-5-5 | 4 | 56 | **870 k** | sesión principal (35 %) | — |
| 2026-10-31 | mananas-lm1 | maqueta | opus-5-5 + sonnet-5-5 | 2 | 26 | **458 k** | sesión principal (45 %) | LM1 sin concurso, 7 pantallas, un encargo al sonnet y una pasada del verificador |
| 2026-10-31 | mananas-lm2 | construir | opus-5-5 + sonnet-5-5 | 2 | 70 | **1,2 M** | Construir LM2 Las Mañanas (53 %) | — |
| 2026-10-31 | mananas-lm3 | construir | opus-5-5 + sonnet-5-5 + haiku-5-5 | 3 | 70 | **1,2 M** | sesión principal (64 %) | LM3: Tu semana por tramos, alarmas de mitad de mañana, guía Android; sonnet construye, haiku textos, verificador |
| 2026-10-31 | mananas-lm4 | construir | opus-5-5 + sonnet-5-5 | 2 | 72 | **1,0 M** | Constructor LM4 pausa MacroDroid (53 %) | Construir LM4 Las Mañanas: pausa ?pausa=, recuento y guía MacroDroid |
| 2026-10-31 | mananas-lm5 | arreglo | opus-5-5 + sonnet-5-5 | 1 | 36 | **432 k** | sesión principal (73 %) | cierre LM5: verificador, seguridad, suite, sella, main |
| 2026-11-01 | chef-ch4 | datos | opus-5-5 + sonnet-5-5 | 5 | 76 | **1,8 M** | sesión principal (44 %) | 4 lotes sonnet ~0,23 M c/u (no ~0,15); lote 4 parado y repetido; principal opus ~0,7 M. CH9: script de una vez por lote, sin releer el JSON |
| 2026-11-01 | chef-ch5 | construir | opus-5-5 + sonnet-5-5 | 2 | 83 | **1,3 M** | sesión principal (48 %) | recetario navegable + Tu cocina; 1 constructor sonnet + verificador; previsto 0,9 M |
| 2026-11-01 | consejo-lanzador | estudio | opus-5-5 + sonnet-5-5 | 2 | 23 | **495 k** | sesión principal (58 %) | Consejo app Android acceso al uso: mapa por grep + 2 dictámenes (opus, sonnet); recomienda C |
| 2026-11-01 | lanzador-k1 | construir | opus-5-5 + sonnet-5-5 | 4 | 102 | **1,7 M** | Construir K1 Lanzador web (48 %) | maqueta a mano + un constructor sonnet con la especificación cerrada + una pasada del verificador; la suite completa la corrió el constructor una vez |
| 2026-11-01 | suite-fecha-fija-y-k1-a-main | arreglo | opus-5-5 + sonnet-5-5 | 1 | 46 | **621 k** | sesión principal (91 %) | 8 pruebas dependían de la fecha (6 ocultas tras el corte del trozo 4) · ahorro: fijaHoy/FECHA_FIJA para las que miren el día de la semana o el mes |
| 2026-11-02 | consejo-gobierno | estudio | opus-5-5 + sonnet-5-5 | 3 | 37 | **770 k** | sesión principal (48 %) | Consejo sobre gobierno + sueño: mapa sonnet, 2 dictámenes (sonnet, opus); presidencia leyó gastos/gobierno/parte enteros · ahorro: leer cabeceras, no archivos enteros |
| 2026-11-02 | consejo-gobierno-aplica | herramientas | opus-5-5 + sonnet-5-5 | 4 | 78 | **1,6 M** | sesión principal (59 %) | sí a todo: lista cerrada, Terminado + 3 hooks, poda de registro/plan/sesiones; un sonnet limpió registro y plan · incluye el Consejo (misma sesión) |
| 2026-11-02 | la-competencia | estudio | opus-5-5 | 0 | 11 | **273 k** | sesión principal (100 %) | OJO: gasto.mjs no ve los agentes del workflow (subagents/workflows/); el workflow declaró ~1,9 M tokens de ayudantes (1,65 M + 0,26 M de la repetición), sin desglosar caché. Workflow 20 agentes (mapa sonnet, 8 analistas+8 abogados sonnet, diseñadora y director opus); se repitió R1+director por emparejar veredictos por título: emparejar por posición |
| 2026-11-02 | consejo-competencia | estudio | opus-5-5 + sonnet-5-5 | 3 | 38 | **929 k** | sesión principal (49 %) | Consejo sobre el informe de la rival: mapa sonnet + 2 dictámenes sonnet; 22 se hacen, 6 a C7; plan C1-C6 ~17,7 M nuevos |
| 2026-11-02 | consejo-competencia-plan | estudio | opus-5-5 + sonnet-5-5 | 3 | 53 | **1,4 M** | sesión principal (66 %) | TOTAL de la sesión (incluye los 929 k de la fila consejo-competencia): decisiones del usuario, widget K4, plan en 3 fases, encargo de la fase 1 |
| 2026-11-02 | competencia-maquetas | maqueta | opus-5-5 + sonnet-5-5 | 2 | 234 | **5,1 M** | Maquetas B: C4, C4b, C5, C6 (49 %) | 2 maquetadores sonnet en paralelo (S1+C1-C3 · C4-C6+C4b), sin concurso; índice publicado; el usuario aprobó todo de una sentada |
<!-- fin de tareas medidas -->
| 2026-10-30 | parte + consejo-g2 + G2 maqueta (una sesión) | parte · estudio · maqueta | opus + sonnet + haiku | 8 | 118 | 1,6 M (parte ~0,2 · consejo ~0,5 · G2 ~0,6 · resto principal) | mapa haiku 253 k (37 pasos) | el mapa en haiku dio muchas vueltas: pedirle ≤15 búsquedas · maqueta sin concurso con lenguaje ya elegido: ~0,6 M |
| 2026-10-30 | G4 · proteína en Hoy, aviso tras entreno, frase en Comer | construir | sonnet (constructor) + opus (preside) | 1 | 87 | ~2,1 M (constructor 2,0 M) | constructor: 10,2 M de caché leída en 87 pasos | dos suites completas y una ronda de retoques: decir en el primer encargo «una sola caja», «un solo número» y «pruebas que caen limpias» · arrancar en sonnet |
| 2026-10-30 | G5 · receta, cola de TikTok, antojo de microondas | construir | sonnet | 1 | 48 | 1,0 M | 4,7 M de caché leída | todas las condiciones en el primer encargo y una sola suite completa: −33 % sobre presupuesto |
| 2026-10-30 | G6 · maqueta de Entreno | maqueta | sonnet + verificador sonnet | 2 | 16 | ~0,3 M (sin la presidencia) | verificador rehízo los dibujos | maqueta sin concurso con lenguaje ya elegido y acuerdos escritos: ~0,3 M |
| 2026-10-30 | G7 · Entreno: 12 dibujos, ficha, progresión doble, saliente | construir | sonnet ×2 en paralelo + verificador | 3 | 79 | ~1,5 M | constructor 1,1 M | dibujos y obra en paralelo con un contrato de datos (`EJ_FICHAS`): −25 % sobre presupuesto |
| 2026-10-30 | G8 · lector de comida rápida | construir | sonnet | 1 | 53 | 1,7 M (presupuesto 0,8: +112 %) | 7,0 M de caché leída | dos suites completas y buscar un fallo ajeno (la 244, que dependía de la hora) · ante un fallo ajeno, parar y avisar en vez de investigarlo dentro del encargo |
| 2026-10-30 | G9 · maqueta de La Noche 2 | maqueta | sonnet | 1 | 13 | ~0,1 M (sin presidencia) | — | acuerdos ya escritos y aprobados: maqueta en un solo paso |
| 2026-10-30 | G10 · cortina con PIN y descanso del 4:20 | construir | sonnet + verificador | 2 | 52 | ~0,9 M (presupuesto 1,5) | constructor 0,8 M | encargo completo + «si algo ajeno falla, dilo y sigue» |
| 2026-10-30 | G12 · maqueta del modo viaje | maqueta | sonnet | 1 | 6 | ~0,1 M | — | acuerdo ya escrito |
| 2026-10-30 | G11 · coach, energía y sin pantallas | construir | sonnet | 1 | 39 | 0,7 M (presupuesto 2,0) | 3,8 M de caché leída | encargo completo con las funciones de G4 y G7 a reutilizar: −65 % |
| 2026-10-30 | G13 (1/2) · PNG de design/ | herramientas | haiku | 1 | 9 | 0,13 M | — | tarea mecánica en haiku |
| 2026-10-30 | G12 · modo viaje (maqueta + obra) | maqueta → construir | sonnet + verificador | 3 | 63 | ~1,1 M (presupuesto 2,5) | constructor ~0,9 M | maqueta adelantada en paralelo y encargo completo |
| 2026-10-30 | G13 (2/2) · la suite en ~2 min (no conseguida) | herramientas | sonnet | 1 | 67 | ~1,0 M | muchas pasadas completas de 5-6 min | medir CPU antes de suponer que es «solo espera»; la siembra va en tarea propia |

## Ahorros que funcionan

- **Mirar main antes de construir y otra vez antes de las pruebas** (R6, 30/10): otra sesión metió la G1 a mitad y costó ~0,8 M mezclar, renumerar las pruebas (372-375 → 376-379) y repetir 2 suites enteras. `git fetch origin main` al abrir y al acabar la obra; numerar las pruebas nuevas detrás de lo último de `main`.
- **Un solo constructor sonnet con la ficha (R3, 30/10):** P1-P5 en 48 pasos y 1,2 M, sin releer app.js; la suite completa y las capturas a la vez, de fondo. Lo que más pesa ya es la principal (0,7 M): ficha con greps cortos, no leer funciones enteras.

- **Concursos de maquetas (R1, 29/10):** bases con las cifras ya cuadradas y un guion común de oficio y de capturas a ciegas (`tools/concurso/`): cada escuela sonnet costó 0,22-0,37 M en ≤14 pasos, y el jurado no abre los HTML (solo capturas + texto). Lo que más gasta ya es la sesión principal (30 %): esperar en silencio, sin mirar capturas.

- Un constructor que además QUITA pestañas y reescribe pruebas viejas se dispara (S3b P1: 7,4 M, 167 pasos): lo de quitar va en su encargo aparte, con tope de pasos.
- La ficha dice qué se **quita** además de qué se añade: sin eso el constructor deja lo viejo debajo y hace falta otra vuelta (S3, ~250 k).

Una línea por cosa aprendida, con la tarea donde se vio. Se aplican en las siguientes.

- Mandar las capturas y la suite a un ayudante (`verificador`): las imágenes y el registro se quedan en su lado.
- Leer `app.js` por trozos (`grep -n` y `sed -n`), nunca entero.
- Pruebas solo las tuyas mientras trabajas (`tools/pruebas-corto.sh --solo …`); la completa, una vez al final.
- Ayudantes de trabajo mecánico en sonnet o haiku; opus solo para decidir o diseñar algo nuevo.
- Un arreglo de una línea con el sitio ya localizado: sin ayudantes (lanzar uno cuesta más que hacerlo).
- Prueba que cae un día «raro» (domingo, día 1, festivo): fijarle la fecha con `fijaHoy` antes de buscar el fallo en la app; y pasar la suite entera, que un corte esconde los fallos de detrás.
- Un banco de frases que escribe haiku sale barato (0,4 M las 300), pero sus kcal y nombres esperados fallan mucho: se
  ajustan por script a lo que lee la app, revisando a mano solo las lecturas raras (v3-lector).
- Pasar las frases con `--vuelca` y agrupar los fallos por tipo antes de tocar nada: 5 tandas de arreglos en vez de 200.
- Una ficha por tarea (skill `ficha-de-tarea`, idea de spec-kit): lo descubierto se escribe una vez y el
  constructor recibe la ficha, no la conversación.
- Una ronda de maquetas para una sección entera antes que una por cada función (plan de Comer, 2026-10-27).
- Un concurso de diseñadores sonnet con escuelas opuestas y críticas cruzadas da ideas que una sola mano no saca (los tres robaron «Ahora toca»); los diseñadores se continúan con SendMessage, no se relanzan (v3-comer-mapa).
- Un encargo con todas las condiciones (una sola caja, un solo número, pruebas que caen limpias, una suite completa) evita la ronda de retoques: G5 1,0 M frente a G4 2,1 M (2026-10-30).
- Abrir en sonnet las sesiones mecánicas (arreglos localizados, construir con ficha y maqueta aprobada).
- Concursos de diseño libre: sonnet, no haiku (haiku sacó 1, 1 y 3 de 5 en La Rara; sonnet ganó con 5/5). (la-rara, 2026-10-28)
