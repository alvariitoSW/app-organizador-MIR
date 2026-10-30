# Mapa (Explore sonnet, 29/10/2026; app.js = 27.831 líneas)

1. DINERO (renderDinero 20500; pestañas Bosque, Gastos, Ahorro, Compras)
- Bosque: dinBosqueHTML 21592; copa = meses de vida (guardado ÷ gasto); d3Datos 21521 (vida, objetivo, falta, «pide» €/mes, delante/detrás); d3Ritmo 21509; d3EscenaSVG 21538.
- Datos: dinero3S 20662 {ahorro{guardado,objetivoMeses,plazoMeses,desde}, compras[]}; store.dinero y store.ahorro viejos siguen guardados sin pantalla.
- Gastos fijos: gastosFijos 20400, gastoPagado 20412, renderDineroFijos 20566, recibos renderDineroMes 20518. Pestaña Gastos: dinGastosHTML 21715 («De cada 100 € que gastas, N son fijos», barra fijos/variables, lista por categoría; mesPartes 21175, d6Cats 21267).
- «Lo que te queda tras fijos»: la tarjeta «Te queda / Puedes gastar hoy» se borró en D6; quedan bkQueda 21396 y d6Mes 21247 como cálculo, usados por el asistente dinAsis 21485 (sale en Hoy).
- Ahorro: d4AhorroHTML 21671 (objetivo 3/6/9 meses, plazo 6/12/18, gráfica d4GrafSVG, «un empujón fácil»); nómina d4NominaHTML 21626 («Ya ha llegado la nómina»).
- Compras: dinComprasHTML 21823, d5Fila 21781, tipos nec/util/ilu, espera 30 días para lo no necesario; «Lo compré» → addPago.
- Gasto grande previsto: parcial. Una compra con precio y mes suma en «X € al mes» y como fruto en el Bosque, pero d3Datos.pide no la resta. No hay «tras este viaje tu ahorro baja a…» ni línea de tiempo.

2. FINTONIC
- Solo capturas con OCR en el móvil (tesseract local): renderFintonic 21009, finLeer 20985, ocrPrepara 20968, finParse 20883 (Bancos, Ingresos, Gastos, Neto, líneas «Nombre 283,06€»), finJunta 20913, finGuardar 20998. Sin CSV ni pegar texto.
- Categorías: los nombres que imprime Fintonic tal cual (reg.cats[nombre]=importe); finCatIco 21059 solo pone icono. «Belleza» no aparece en el código: viene de Fintonic o de un OCR que lee mal nombre/importe. No se puede corregir en la app salvo fijo/variable.
- Guarda ahorro.real[] (máx 36). gastoMes0 21075: usa la captura del mes primero.

3. COMER (renderComerEje 14557: Hoy · Semana · Casa)
- Semana a mano cjeSemanaTabHTML 14644; «¿Me la propones?» (pl-montar 24710) solo rellena huecos.
- Casa: nevera dibujada renderNevera2 12561; compra compraDatos 19482 (lo apuntado menos la nevera, con origen); RACIONES_BASE 3316, compraCada 4424. No hay «compra base» ni «1 kg partido en raciones».
- Recetas: store.dishes {name,icon,batchId,kcal,prot,portions,ingredients,steps}; lotes b1 «Cocina del domingo» («lo que sobre, al congelador»); d-lentejas (4 raciones, 470 kcal, 26 g). Sin campo «congela».
- TikTok: renderImport 18688 (impPegar, impTraerEnlace, oEmbed 18398, parser local impLocal, opcional impConClaude 18584) → impGuardar crea un plato. El enlace NO se guarda; no se ve vídeo; no hay página de receta para ver «cómo se hace».
- Macros: objetivoMacros 9414, protObj 11127; objetivo de peso alimenta kcal. Whey es un plato/alimento (d-whey 199); creatina; sin seguimiento propio.

4. ENTRENO (renderGym 17662; portada renderGymPortada 16619)
- Ejercicios sin dibujos: texto + emoji (ejIcono 16686). EJ_BASE 16051 ~55 ejercicios; biblioteca openGym externa (vídeo fuera). Sin texto de técnica/forma.
- Enganche: racha por semanas (rachaConstancia 15688), mapa de calor, lámina Teide/Bancales, plan de vuelta al 35 %.

5. HOY (renderHoy 7537)
- Arriba: título, estado del día (turno/guardia), entrenoContadorHTML, hoyDiaHTML (conductor), nocheHTML «El cartel» (próxima hora + 🏠›🛌›⏰›🚌).
- Debajo: informeToca, asistHoyHTML (incluye dinAsis), paraHoyHTML, loQueVieneHTML. Dinero en Hoy: solo «Hoy toca pagar» y el asistente. Nada de «te queda» ni de ingresos del trabajo (guardias pagadas).
