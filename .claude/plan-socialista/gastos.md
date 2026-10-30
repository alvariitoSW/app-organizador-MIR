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

| Tipo | Modelo | Última medida | Presupuesto siguiente | De qué tarea |
|---|---|---|---|---|
| herramientas | opus | 439 k (26 pasos) | ~395 k | v3-plan-global (2026-10-27) |
| arreglo | sonnet | D1 0,93 M · D6 3,1 M (quitar mucho) · R4 1,0 M sin parte | ~0,9 M uno pequeño con ficha y captura · quitar código: en la misma D que lo sustituye | dinero D1/D6 (2026-10-28) |
| maqueta | opus + sonnet (+ haiku jurado) | R1 3,0 M con concurso · R5 1,0 M sin concurso (92 pasos, parte y salud incluidos) | ~2,7 M con concurso · ~0,9 M sin él | reforma-r5-comer (2026-10-30) |
| construir | opus + haiku | 2,3 M (99 pasos) | ~2,1 M | v3-lector (2026-10-28) |
| construir (pantalla con maqueta) | sonnet | D3 1,8 M · D4 1,3 M · D5 0,86 M | ~0,9 M con ficha y líneas exactas | dinero D3-D5 (2026-10-28) |
| construir (Reforma, ficha + 1 constructor) | opus + sonnet | 2,2 M (115 pasos; obra 1,2 M, principal 0,7 M, parte y salud 0,13 M) | ~2,0 M | reforma-r3-gasto-grande (2026-10-30) |
| construir | opus + sonnet | 3,1 M (190 pasos, 4 ayudantes de obra) | ~2,8 M (la S3b) | v3-comer-reloj-1 (2026-10-28) |
| construir | opus + sonnet | 12,1 M (402 pasos, S3b: 4 historias + quitar pestañas) | ~2,8 M por historia mediana; una tanda como la S3b, ~10,9 M (mejor partirla) | v3-comer-reloj-s2 (2026-10-28) |
| estudio | — | sin medir | — | — |
| parte (/plan-socialista) | — | sin medir | — | — |

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
<!-- fin de tareas medidas -->

## Ahorros que funcionan

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
- Un banco de frases que escribe haiku sale barato (0,4 M las 300), pero sus kcal y nombres esperados fallan mucho: se
  ajustan por script a lo que lee la app, revisando a mano solo las lecturas raras (v3-lector).
- Pasar las frases con `--vuelca` y agrupar los fallos por tipo antes de tocar nada: 5 tandas de arreglos en vez de 200.
- Una ficha por tarea (skill `ficha-de-tarea`, idea de spec-kit): lo descubierto se escribe una vez y el
  constructor recibe la ficha, no la conversación.
- Una ronda de maquetas para una sección entera antes que una por cada función (plan de Comer, 2026-10-27).
- Un concurso de diseñadores sonnet con escuelas opuestas y críticas cruzadas da ideas que una sola mano no saca (los tres robaron «Ahora toca»); los diseñadores se continúan con SendMessage, no se relanzan (v3-comer-mapa).
- Abrir en sonnet las sesiones mecánicas (arreglos localizados, construir con ficha y maqueta aprobada).
- Concursos de diseño libre: sonnet, no haiku (haiku sacó 1, 1 y 3 de 5 en La Rara; sonnet ganó con 5/5). (la-rara, 2026-10-28)
