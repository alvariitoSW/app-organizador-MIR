# Ficha R2 · Primera pantalla (630-639, prefijo rpp)
Qué: quien instala de cero ve «Tu guardia en 3 pasos» (T3b, tgu*) como primera pantalla, no las cuatro preguntas viejas.
Bien si: pantalla con «Vamos a montarla a tu nombre» + paso 1 de 3; guardar escribe las guardias y va al mes; quien tiene datos no la ve.
- Se AÑADE: rppSale/rppCabecera, acciones rpp-pegar y rpp-saltar, cabecera de bienvenida en tguVista cuando ui.arranque; pruebas 630-634.
- Se QUITA: renderArranque, ARR_PASOS, arrS/arrLee/arrAplica/arrCampo, acciones arr-paso/arr-saltar/arr-fin (jornada, horas y sitio ya no se preguntan).
- NO se toca: tguGuarda (solo +1 línea), Ajustes → Mi planning, sw.js, version.json, CSS (.arranque se reutiliza).
- Pruebas viejas: el bloque del primer arranque (antes de la 1) se rehace para conducir tgu*; 327 sigue (pulsa «saltar»).
Hecho cuando: 630-634 verdes; cae con rppSale() quitado de tguGuarda (631 + el bloque de arranque), ninguna otra.
