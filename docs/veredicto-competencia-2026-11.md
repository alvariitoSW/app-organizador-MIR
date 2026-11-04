# Veredicto de «La Competencia» · noviembre de 2026

**Fecha:** 04/11/2026. **Qué es:** el cierre de la actualización «La Competencia». Las fases 1, 2 y 3 y el remate ya están en
`main`. Es un estudio: no se ha tocado código.

**Material:** `docs/informe-competencia-2026-11.md`, las actas `consejo/2026-11-02-competencia*.md`, `plan-v3.md`, los
traspasos de las fases 2 y 3 y del remate, `gastos.md` y `docs/DECISIONS.md`.

**Comprobado en la app.** El verificador (sonnet, con un tope de 45 pasos) dio una pasada a 412×915 en oscuro y en claro, con
datos sembrados y la fecha fija en el domingo 15 de noviembre a las 12:00. Recorrió Hoy, Mes, Comer, Entreno, Dinero y
Hábitos sobre el código de `main`, que es lo publicado. No salió ningún error de JavaScript.

---

## 1. Punto por punto: ¿ganamos, empatamos o seguimos perdiendo?

Cada punto es uno en el que la rival nos ganaba (informe, §1, §2 y §6).

| # | Donde nos ganaba | Ahora | Por qué y dónde se ve |
|---|---|---|---|
| 1 | Hoy: «qué toca ahora» sin bajar | **Perdemos** | La tarjeta «Ahora» (la frase y la energía) empieza a 1.111 px y la página mide 3.607 px. En la primera pantalla solo caben el cartel de la noche y la cadena plegada. Con otros datos no se puede comparar al píxel con los 2.992 px del informe, pero sigue lejos de «una pantalla» |
| 2 | Anotar el sueño en 1 toque | **Empatamos** | Hoy → la fila «Anoche 23:30–7:00 · 7 h 30» con «Vale»: un toque y sale «Anoche guardada ✓». También hay «cambiar» y «otras noches». Tras una guardia hay un camino propio |
| 3 | El plan de sueño de la guardia, en Hoy | **Ganamos** | En la víspera salen «Mañana tienes guardia», la cama, el último café, «Al llegar, siesta de 3 h» y «Avisarme a esas horas». Se añade «Faltan … en tus últimas noches», sin rojo, y la cadena guardia › comida › ocio › sueño, que la rival no tiene |
| 4 | Menos ruido en la portada | **Empatamos** | Los avisos de mantenimiento salen de uno en uno, con «Ahora no». Pero el Hoy sigue siendo largo (punto 1) |
| 5 | Letra de 13 px como mínimo | **Empatamos, con restos** | El suelo es de 13 px (14 en Dinero). Quedan 3 textos de 12,5 px en Hoy («no hace falta siesta…», «antes, a las 15:30…»). Las casillas del Mes van a 10 px por decisión (`.dline`) |
| 6 | Un solo contador de guardias | **Ganamos** | En el Mes sale una sola línea: «Guardias de noviembre: 3 hechas · 5 por hacer · 8 en total». En modo plantilla explica por qué marca 0 |
| 7 | La cuadrícula del Mes en la primera pantalla | **Perdemos** | La cuadrícula ocupa de 622 a 1.094 px y la barra de abajo está a 850 px, así que el mes no se ve entero sin bajar. Es casi igual que los ~540 px de cabecera del informe |
| 8 | Asistente de turno sin «ciclos» | **Empatamos** | «Tu guardia en 3 pasos» sale en Ajustes → Mi planning y como primera pantalla de quien empieza de cero. El ciclo queda en «Avanzado» |
| 9 | Importar el planning (.ics y foto) con vista previa | **Empatamos** | En Mi planning están «Pegar lo copiado», .ics y «Foto del cuadrante» con vista previa, todo en el móvil. Además se puede exportar un PDF «Resumen del mes» y un Excel. La foto solo se ha probado con cuadrantes inventados (apartado 3) |
| 10 | Apuntar 12 € (antes ~7 toques) | **Empatamos** | En Dinero → Tu mes, el botón «＋ Gasto» (56 px de alto, a 189 px) abre la hoja con la fecha de hoy y la última categoría. Son ~4 toques, como la rival |
| 11 | Comer: saber cuánto queda hoy | **Empatamos, a medias** | Arriba salen las kcal y la proteína bajo «Ahora · 12:00», sin rojo. Falta la frase «te quedan…», que solo está en la tarjeta de Monchis |
| 12 | Comer: un Hoy corto | **Empatamos** | Los bloques se pliegan y se abren con un toque (vitaminas, semana). «Tocaban X · lo cambiaste» sale en gris y sin tachar |
| 13 | Comer: «¿te preparo la semana?» a la vista | **Sin comprobar** | Se construyó en C5, pero la pasada no lo miró |
| 14 | Entreno: «Empezar» sin bajar | **Empatamos** | «Empezar vacío» está a 664 px, por encima de la barra. «▶ Empezar rutina» no se vio, porque el domingo sembrado era libre |
| 15 | Entreno: serie suelta con el peso de la última vez | **Empatamos** | La hoja de «＋ serie» dice «Press banca · la última vez: 65 kg × 8», con ±2,5 kg y ±1 repetición |
| 16 | Entreno: plan recomendado y «guardar como rutina» | **Empatamos** | La tarjeta HOY vacía trae «Plan recomendado», «Copiar mi último entreno» y «Empezar vacío». Al terminar, la app pregunta «¿Guardar como rutina?». El gráfico de récords está abajo (a 1.074 px y mide 277 px) |
| 17 | Hábitos desde Hoy en 1 toque | **Empatamos** | La tira de Hoy lleva hasta 3 hábitos y se marcan con un toque. No sale en los días de guardia ni de saliente |
| 18 | Notas y eventos con una frase | **Empatamos** | En Hoy, la línea plegada «Apuntar algo…» lleva vista previa obligatoria. La pasada no probó cómo entiende las frases |
| 19 | Plantillas de hábito siempre | **Empatamos** | Las 5 plantillas siguen saliendo con 0 hábitos y con 4. A partir del cuarto sale «Esperan turno» |
| 20 | 4:20 privado (antes, un hueco real) | **Ganamos** | Con «Privado» y sin PIN, Hoy no escribe ni «Lloretazo» ni «4:20». Lo que se exporta a .ics y a Google también sale tapado |
| 21 | Estilo: un color de acción y letra limpia | **Empatamos, a propósito** | Se copió el orden y el tamaño, pero no la cara: los 5 temas, el granate de guardia y los dibujos se quedan. Contraste en claro todavía bajo de 4,5: la hora de la Cena (3,97), «Por qué:» de Hoy (4,44) y «ahorras» de Dinero (4,16, a 22 px) |

**Las 5 tareas del R1 saliente de guardia** (informe, §4):

| Tarea | Resultado |
|---|---|
| Próxima guardia | Ganamos (ya ganábamos) |
| Qué como | Empate |
| Cómo dormí | Empate (1 toque) |
| Gasto de 12 € | Empate (~4 toques) |
| Entreno de hoy | Empate (serie con el último peso) |

**Saldo:** de 21 puntos, ganamos 3, empatamos 15, seguimos perdiendo 2 (los dos de «verlo en una pantalla sin bajar»: Hoy y
Mes) y uno queda sin comprobar.

## 2. Lo que no se ha roto

La pasada lo vio intacto:

- la cadena de Hoy y «Vale»;
- el plan de sueño de guardia;
- el color por tipo de día en el Mes;
- la sesión en vivo y «Vienes de guardia» en Entreno;
- «Empiezas − Fijos − Gastos = Acabas» en Dinero;
- en Hábitos, «cuándo no toca» y el límite de 3.

El vaso de Dinero ya se ve bien en oscuro (se arregló en T1a). La Línea de hoy va sobre fondo claro en tema claro.

## 3. Lo que quedó fuera o a medias

- **El Lanzador, K2-K4 (aparcado por ti el 03/11).** Falta la app Android que lee el «Acceso al uso» (K2, ~1,0 M), instalarla
  en tu móvil contigo (K3, ~0,4 M) y el widget de inicio con 3-4 botones (K4, ~2,2 M). En total, ~3,6 M. Sin el Lanzador no
  hay widget: los atajos de la rival desde la pantalla de inicio siguen sin tener respuesta.
- **La foto del cuadrante, sin probar con uno real.** Solo se ha probado con cuadrantes inventados y limpios: una fila por día
  y una columna por persona. Ya se midió que el lector pierde el guion de «R-A» y lee peor con la rejilla dibujada. «Trabajo»
  entra como día libre con la palabra «trabajo». Falta una foto de tu cuadrante de verdad, en tu móvil y sin subirla, y saber
  cómo es.
- **La foto del plato (idea nueva, 02/11).** No se ha hablado en ningún Consejo. Choca con la regla de que los datos no salen
  del móvil: reconocerlo en el propio móvil es posible pero flojo y pesado, y un servicio de IA externo lo hace mucho mejor,
  pero entonces la foto sale del móvil y cada una cuesta dinero. Lo decides tú.
- **Letra pequeña.**
  - 3 textos de 12,5 px en Hoy (los dos de la víspera y alguno más).
  - De antes de la actualización, en Hoy: `.cd-ncap`, «¿Qué estoy viendo?», «más ›».
  - Las casillas del Mes van a 10 px (`.dline`) porque se decidió así; si crecen, no caben 7 días en 412 px.
- **Contraste en claro por debajo de 4,5:** la hora de la Cena (3,97), «Por qué:» de Hoy (4,44) y «ahorras» de Dinero (4,16).
  El número de «Urg»/«UMI» que preocupaba ya da 13,4:1 en oscuro.
- **Detalles:**
  - Comer no dice «te quedan…».
  - Hoy puso «Faltan 3 h en tus 2 últimas noches» en lugar de «3». Puede deberse a cómo se sembraron las noches; está sin
    comprobar.
  - El gráfico de récords está abajo, no en la portada.
  - La pasada no encontró un «‹ Ajustes» propio en Mi planning, solo «‹ atrás». El verificador no entró desde Ajustes, así que
    está sin confirmar.
  - `.pegar-copiado` mide 44 px y no 56.
  - Los estilos `.arrpasos` se quedaron sin uso después de R2.
- **PDF y Excel.** Se hizo exportar («Resumen del mes» y un Excel de 4 hojas). Importar desde PDF o Excel sigue fuera, porque
  necesita una librería pesada.

## 4. Lo que costó

Las cifras salen de `gastos.md`, en millones de tokens equivalentes (M).

| Parte | Previsto | Gastado | Diferencia |
|---|---|---|---|
| Fase 1 (maquetas 5,1 + Consejo de construir 0,75 + obra 10,3) | ~9 | **16,2** | +80 % (C1 con suite propia y 4 suites de más) |
| Fase 2 (C3, C4, C4b, C5, C6) | ~12 | **9,6** | −20 % |
| Fase 3 (pasada y maqueta 1,1 + T1 3,0 + T2 3,4 + T3-T5 6,6) | ~14 | **14,1** | igual, **sin** K3-K4 (~2,6 M previstos dentro) |
| Remate (R1-R4) | — | **4,5** | fuera del plan |
| **Total del plan** | **~38 (máx. ~50)** | **~44,4** | **+17 %, dentro del máximo** |
| Antes del plan: informe (~2,2) + Consejo y plan (1,4) | — | ~3,6 | — |
| Este veredicto (estudio y pasada) | ~0,6 + pasada | ~0,9 | la pasada costó ~0,5 M |
| **Todo «La Competencia»** | | **~49 M** | |

Para el mismo trabajo, el desvío real ronda el +25 %, porque el Lanzador K3-K4 estaba dentro de lo previsto y no se hizo.

**Lo que encareció:**

- las suites completas de más, sobre todo en la fase 1;
- los choques de nombres entre tandas;
- la prueba del primer arranque, que se dejaba guardias puestas.

**Lo que abarató:**

- un encargo común en un archivo;
- cada constructor pasa las pruebas viejas de su pantalla;
- una sola suite completa a la vez;
- un prefijo propio por tanda.

## 5. Veredicto

**La Competencia ha cumplido en lo que más pesaba.** Donde la rival ganaba de verdad (anotar el sueño, apuntar un gasto, la
serie suelta y el hueco de «Privado»), ahora empatamos o ganamos, y lo que ya era mejor (el sueño de guardia, el Mes, la
privacidad) no se ha roto. **Falta su ataque principal:** «lo que te toca ahora, en una pantalla». Hoy y Mes siguen
necesitando bajar. Se gastaron ~44 M frente a los ~38 previstos, dentro del máximo, y quedó sin hacer el Lanzador.

## 6. Qué hacer después (como mucho 3)

| # | Propuesta | Por qué | Coste |
|---|---|---|---|
| 1 | **Hoy y Mes en una pantalla de verdad.** En Hoy, «Ahora» sube por encima del cartel de la noche. En el Mes, la cabecera se pliega hasta que la cuadrícula empiece a ~200 px. Maqueta primero | Son los 2 puntos que seguimos perdiendo y los que más se abren | ~2,5 M (maqueta 0,5 + construir 2) |
| 2 | **Remate de lectura y la foto real.** Contraste ≥4,5 en la Cena, «Por qué:» y «ahorras» (claro); los 3 textos de 12,5 px; la frase «te quedan…» en Comer; mirar «2/3 últimas noches». Y probar la foto del cuadrante con tu cuadrante real, en tu móvil y sin subirlo | Lo pequeño que queda y la única función sin probar en la vida real | ~1 M (+0,3 M si la foto real pide ajustes) |
| 3 | **Consejo sobre la foto del plato**, con maqueta: en el móvil o con IA externa | Es tu idea nueva y choca con la privacidad: tienes que decidirlo tú antes de construir | ~0,8 M (estudio y maqueta) |

El Lanzador K2-K4 (~3,6 M) sigue aparcado. Vuelve cuando quieras ponerte con el móvil en la mano.

---

**Supuestos:**

- Como el código de la rama es el de `main`, la pasada en local vale como la app publicada.
- Las alturas dependen de los datos sembrados (domingo libre, 8 guardias en el mes).
- «Ganar» y «empatar» se miden contra lo que el informe decía de la rival, no contra una rival real.
- El gasto del informe incluye la cifra que declaró el workflow (~1,9 M), que `gasto.mjs` no ve.
