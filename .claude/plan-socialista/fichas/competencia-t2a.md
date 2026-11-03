# Ficha · La Competencia · T2a Entreno

## Qué y para qué
- Dado Entreno con hoy vacío, cuando abro la portada, entonces veo «Copiar mi último entreno» (con ejercicios, día y minutos), «Plan recomendado: X» (encaja con tus guardias) y «Empezar vacío».
- Dado que copio, entonces entro al entreno con los mismos ejercicios y series con los pesos de la última vez; confirmo cada serie.
- Dado que termino una copia, entonces sale «¿Guardar como rutina?» (nombre, días, «Ahora no»); guardar la deja como rutina.
- Dado el día de salir de guardia (o guardia), entonces no se propone torso/pierna.
- Dado un ejercicio con ≥2 semanas de datos, entonces la portada enseña «Récords · X» con barras por semana, el récord en verde y «cambiar ›».

## Dónde se toca
- app.js: `gymHeroHTML` (rama vacía), `ultimoParaCopiar`, `copiarUltimoEntreno`, `ofreceGuardarRutina`, `rutGuardarHTML`, HOJAS.rutg, `cerrarSesionCore` (nombre), `gymRecordsHTML`, `renderGymPortada`; act(): `ses-copiar`, `rutg-*`, `gym-rec-cambiar`.
- styles.css: `.gopc`, `.grec`, `.grecbar`, `.grecej`.
- Pruebas 540-549.

## Añade
Copiar último entreno, plan recomendado con motivo, hoja de guardar rutina, nombre en la sesión, gráfico de récords.

## Quita
El texto «▶ Empezar X igualmente» (ahora «Plan recomendado: X»).

## No toca
Estudio, flechas de Hoy, `sw.js`, `version.json`, el motor de progresión, el editor de rutinas.

## Frases para el verificador
«Copiar mi último entreno», «Plan recomendado:», «Encaja: no tienes guardia hasta el», «Empezar vacío», «¿Guardar como rutina?», «Guardar rutina», «Ahora no», «Récords · Press banca», «cambiar ›», «En verde, el récord: +».

## Pasos
- [x] P1 pruebas 540-549 · [x] P2 copiar + hoja · [x] P3 récords · [ ] P4 capturas 412×915 claro y oscuro (verificador)
