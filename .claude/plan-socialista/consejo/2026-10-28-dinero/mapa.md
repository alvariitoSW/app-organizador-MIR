# Mapa de Dinero (28/10/2026, ayudante Explore en sonnet)

**Vistas.** `renderDinero` (app.js l.19944), tres pestañas: **Hoy** (dinHoyHTML l.21255: héroe «Te queda para gastar» =
banco − recibos hasta la nómina − lo que toca apartar; si no hay banco pero sí Fintonic, «Puedes gastar hoy»; si nada,
estimación; asistente dinAsis; recibos de la semana; taxis) · **Ahorro** (dinAhorroHTML l.21325: «Tienes ahorrado»,
reparto mensual, colchón + huchas con barra y «llegas en…», «Gasté de mis ahorros», «Nueva meta») · **Mes**
(dinMes8HTML l.21351: entró/fijo/día a día/ahorraste, «Repartir X € en tus bolsillos», categorías, ahorro mes a mes,
subir Fintonic, hoja, taxis). Subpantallas: recibos, fijos, nómina (épocas de sueldo, día + hábiles), huchas, hucha
nueva (viaje/casa/capricho/otro), hoja anual (xlsx/TSV), fintonic, banco, plan («cambiar el reparto» en %),
categoría. Hojas modales: gasté, gastos, hucha, puro (colchón).

**Datos** (store único en localStorage): `store.dinero` {gastos fijos [{nombre,importe,dia,cat}], pagos
[{fecha,nombre,importe,cat}], presupuesto} · `store.ahorro` {epocas de sueldo, cobrado por mes, festivos, huchas
[{nombre,pct,objetivo,saldo,mensual,deseos[{txt,precio,hecho}],tipo,para}], meses{aparto,reparto}, movs, nomina{dia,
habiles}, metaPct, catCfg{tipo fijo/variable, meta}, gastado a mano, real[] (capturas Fintonic), banco{cuentas,
capturas}, meta antigua, asistente}. Taxis: precio por día y de serie (Ajustes).

**Acciones**: ~70 acciones dinero-*/din-*/aho-*/fin-*/bk-*/hn-*/deseo-* (apuntar gasto, recibos, repartir, huchas,
deseos, nómina, importar capturas de Fintonic y del banco con OCR en el móvil y revisión, exportar xlsx/TSV, recibos en
el .ics).

**Fuera de Dinero**: Hoy (pagos de hoy con casilla, la misma tarjeta del asistente), Mes (días con recibo, informe
semanal), tira de la mañana (taxis del mes), Ajustes (sueldo, precio del taxi), Compra (botón «apuntar lo que me he
gastado» → gasto categoría compra).

**«Plan de compras»: no existe.** Lo más cercano: huchas tipo «casa» con lista de deseos (precio, hecho; objetivo =
suma; «llegas en…»), y el botón de Compra → gasto. No hay compras planificadas con fecha ni estado fuera de las huchas.

**Pruebas**: ~20 pruebas en tests/regression.test.js (75-77, 82-83, 216, 218, 221, 223, 228, 258, 262, 263, 266, 270,
taxis, cajón). La 221 y otra dependen de la fecha (rojo a final de mes / víspera de nómina).

**Puntos débiles**:
- Dos modelos de gasto conviven (recibos + pagos apuntados vs Fintonic / cifra a mano / banco); `gastoMes` elige la
  fuente según lo que haya y lo que se ve cambia sin que se note por qué.
- Tres orígenes de «cuánto te queda» (banco, Fintonic, estimación): tres héroes distintos en Hoy.
- Tres sistemas de metas: meta antigua, huchas con mensual/fecha, huchas por %; «mensual» y «%» se pisan.
- Duplicados: dos pantallas de huchas + la hoja; marcar pagado en 4 sitios; dos «gastado»; OCR frágil.
- Restos de versiones viejas (v4–v8), vistas que redirigen, atajos con setTimeout.
- ~1 900 líneas seguidas (l.19813-21700) más ramales en act() y change.
