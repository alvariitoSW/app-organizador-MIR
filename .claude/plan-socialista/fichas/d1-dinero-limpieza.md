# d1-dinero-limpieza · Tanda Dinero, D1 (tipo arreglo: no cambia nada de lo que ve el usuario)

Decide el Consejo (acta `.claude/plan-socialista/consejo/2026-10-28-dinero-ejecucion.md`). Sin dudas para el usuario.

## 1. Qué y para qué
- Dado cualquier día del mes, cuando corren las pruebas de Dinero, entonces pasan (ninguna depende del día real).
- Dado que D3-D6 rehacen la pantalla, cuando se toca una cifra de gasto, ahorro, recibos, reparto o llegada, entonces cae una prueba «foto».
- Dado app.js, cuando se limpian restos de Dinero, entonces no cambia nada visible ni se borra nada guardado.

## 2. Dudas
Ninguna.

## 3. Dónde se toca
- Pruebas por fecha: 221 y 263 ya congelaban «hoy» al día 15; **la 75** (fijos el día 1 y el 3) caía el día 3 de cada mes: ahora también.
  Se probó la tanda de Dinero en cada día de noviembre de 2026 con el reloj movido: solo caía la 75 el día 3.
- Foto: prueba **332** (al final de `tests/regression.test.js`), con «hoy» = 15/03/2026 y datos conocidos; mide `gastoMes` (3 fuentes),
  `ahorroDeMes`, `restoPorRepartir`, `mesDinero`, `d6Mes`, `mesTipo`, `repartoDe`, `llegadaHucha`, `bkQueda` (funciones, no HTML).
- Limpieza en `app.js` (`renderDinero`, `dinSubcab`, hoja de Dinero): vistas `cierre` y `analisis` (nadie las pone), etiqueta «Análisis».
  Se conserva `salud` (dos pruebas la usan para comprobar que lleva a Ahorro) y todos los saneados/migraciones de lectura.

## 4. Pasos
- [x] P1 Congelar la fecha en la 75 · tests/regression.test.js · sin ayudante · ~8 pasos
- [x] P2 Prueba 332 «foto» y comprobar que cae al cambiar una cifra de d6Mes · tests/regression.test.js · ~15 pasos
- [x] P3 Limpieza invisible · app.js · ~10 pasos (buscadas funciones sin lector y acciones sin emisor: no hay)

## 5. Comprobación
Cada historia tiene su paso y su prueba; nada contradice CLAUDE.md (no cambia lo que se ve; sin sellar ni pasar a main).
