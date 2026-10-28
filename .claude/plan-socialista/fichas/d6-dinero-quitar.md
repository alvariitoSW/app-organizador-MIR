# d6-dinero-quitar · Tanda Dinero, D6 (limpieza: quitar código y vistas, nunca datos)

Manda el acta `2026-10-28-dinero-ejecucion.md`, punto 2. Regla de Justicia: lo guardado en `store.dinero` y `store.ahorro` se queda en el
móvil, en la copia de seguridad y en la exportación aunque nada lo enseñe; `dinero3Migra` y las migraciones de lectura no se tocan.

## Se quita (nada vivo lo llamaba tras D3-D5)
- Hoy de Dinero: `dinHoyHTML`, `bkFuenteHTML` («Te queda / Puedes gastar hoy» con sus tres orígenes).
- Huchas por % o €, reparto y «Repartir X €»: `dinBolsillosHTML`, `dinAhorroHTML`, las pantallas `huchas`, `hucha-nueva` y `plan`
  (`renderHuchasLista`, `renderAhorroHuchas`, `renderHuchaNueva`, `renderDinPlan`), `din7Reparto/Rec/Aplicar`, `repartoComoRec`,
  `bolsilloShares`, `bolsilloSetPct`, `apartarAlCobrar`, `deshacerAlCobrar`, `apartarMes`, `deshacerApartado`, `ahoMov`, `sacarHucha`, `huchaDe`,
  `colchonMeses`, `metaCuando`, `mediaAhorroReal`, `dinLlegadasAl` y las hojas `gaste`, `gano`, `puro` y `hucha` de `dinHojaHTML`.
- «Gasté de mis ahorros» (`gasteHojaHTML`, `gasteEstado`, `gasteQuedaHTML`, `gasteApuntar`, `enTrabajo`), la meta antigua como pantalla y
  `ui.dinViejo` (el camino que dejó la D5).
- Pantalla de capturas del banco y su lector: `renderBanco`, `bkLeer`, `bkMano`, `bkGuardar`, `bkCuadre`, `bkCuenta`, `bkRolDe`, `bkNum`,
  `bkLabel`, `bkDigitos`, `bancoParse`, `BK_NOLAB`. Fintonic se queda.
- En `d4AjustesHTML`: «Cambiar el reparto» (el reparto era de huchas por %) y «Cuadrarlo» (cuadraba con la pantalla del banco).
- En el asistente (`DIN_R`): la regla «sube una captura del banco» y la de «una meta llega tarde» (hablaban de huchas y de la pantalla quitada).
- En «Cierre del mes» (`dinMes8HTML`): «Repartir X € en tus bolsillos» y su «deshacer».
- Vista `salud` que redirigía a Ahorro (pruebas 221/262 al camino nuevo), `META_TIPOS` y las acciones de los dos switches sin botón
  (`hn-*`, `bk-*`, `din-gaste-*`, `din-plan-pct`, `din-puro`, `din-hu-*`, `deseo-*`, `aho-hu*`, `din-apartar*`, `din-meta-subir`, `din-lleg-ok`...).

## Se queda, y por qué
- `bkQueda`, `bkUltima`, `bkTotal`, `bancoS`, `bkRitmo`, `bkGastoMes`: los usan `dinAsis` (Hoy y Ahorro) y `gastoMes` (gasto «del banco»).
  Lo leído del banco sigue guardado.
- Épocas de sueldo y festivos (`renderAhorroNomina`, `nominaCfg`, `nominaMes`, `nominaTras`): Ajustes («Tu sueldo»), Hoy, Mes y el .ics los usan.
- Pestaña Mes («Cierre del mes», `dinMes8HTML`, sin «Repartir»): Gastos enlaza a ella y es donde se pone «tu cifra» del mes sin Fintonic
  (`dinCifraHTML`); Gastos no cubre eso. Recibos, fijos, hoja, Fintonic, categoría y taxis: se quedan (acta).
- `puroHucha`, `bolsillos`, `metaHucha`, `repartoDe`, `ahorroDeMes`, `metaObjetivo`...: los usan `dinero3Migra`, `mesTipo` y el Excel.
- `frSeg` (la quita mi script de código muerto por error; la usa `tests/frases.test.js`): restaurada.

## Retoques de Ahorro/Compras
- `d4GrafSVG`: la etiqueta «objetivo: N meses (…)» sube 9 px para que el cuadrado «tu ritmo» no la pise.
- «← Volver al bosque» como botón-píldora (`.lau-btn`, como la maqueta).
- Compras: `.lau-num` (insignia redonda de Gastos) → `.lau-cifra` propia en `d5Fila` y su CSS.

## Pruebas
- Nueva 339 (encadenada): móvil viejo sembrado → recorrido con clics Bosque/Gastos/Ahorro/Compras → copia de seguridad: lo viejo, intacto.
  Cae si la migración toca `huchas` (comprobado a mano) y si el cuadrado vuelve a pisar la etiqueta (comprobado a mano).
- 338: las cifras de Compras caben en su caja (cae con la clase vieja, comprobado).
- Quitadas las comprobaciones que miraban lo quitado: 204 (huchas de una en una), 216 (reparto, hucha nueva), 218 («Gasté» y «Mi plan»),
  223 (Aplicar a mis bolsillos), 228 (reparto y saldo de hucha), 263 (cuadre, «ya lo he apartado», lector y OCR del banco), 266 (campo de
  hucha, lector del banco), 270 (meta nueva, deseo, inversión), 272 (lista de huchas) y la del apartar/deshacer en huchas (l.~5928).
