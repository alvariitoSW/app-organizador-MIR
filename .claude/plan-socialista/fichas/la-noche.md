# Ficha · Ley de La Noche · N1 (cuenta atrás) y N2 (medir y avisar)

Acta `consejo/2026-10-29.md` (Resolución + «N0 · la maqueta elegida»). Maqueta aprobada por el Consejo:
**`maquetas/la-noche-a-cartel.html`** (lógica en `la-noche-comun.js`: `cadena()`, `pendientes()`, `grande()`, `botonVivo()`).
Navegable con `?h=21:20`, `?h=07:17`, `&modo=lista`, `&abierta=1`, `&hoja=vuelta`, `?p=alarmas`, `?p=semana`, `&sug=1`.

## 1 · Qué y para qué
- **N1-a** Dado un día con Lloretazo y despertador 06:45, cuando abro Hoy a las 21:20 (cualquier modo), entonces arriba
  del todo leo «🌿 Vete del Lloret · 21:45 / en 25 min» y debajo una fila plegada con lo que falta (🏠 22:20 › 🛌 22:35 ›
  ⏰ 06:45 fijo › 🚌 07:35); al tocarla se despliega con notas y «▴ plegar».
- **N1-b** Dado las 07:17, entonces la misma pieza dice «Bus en 18 min · sal de casa a las 07:31».
- **N1-c** Dado los modos Reloj/Línea, entonces ya no salen `horasSuenoHTML` (pie `.drsol`) ni `suenoHoyCardHTML`; en
  Conductor `mananaHTML` deja de ir suelta arriba (su botón de salida pasa a la pieza). No se borra ningún dato.
- **N2-a** Dado las 21:30-23:45 sin vuelta apuntada, cuando toco «🏠 He vuelto», entonces sale la hoja con la hora puesta
  (−5/+5) y al guardar queda `store.lloret.vuelta[fecha]='21:52'`; «Vete del Lloret» desaparece de la cadena.
- **N2-b** Igual con «🏢 He llegado» (bus+20 −25 min … +90 min) → `store.manana[fecha].llego`.
- **N2-c** Pantalla «⏰ Pon estas alarmas en tu Reloj»: vete del Lloret, a la cama (la de **esta noche**), sal de casa,
  con «antes HH:MM» cuando cambian; botón «Ya las he puesto».
- **N2-d** «📊 Tu semana»: 3 cifras en minutos (cama, levantarse, salir) frente a la semana pasada, sin rojo; una sola
  propuesta.
- **N2-e** Cada 3 días, si la mediana de las 3 últimas camas está a ≤15 min del escalón, sugerencia «¿Probamos 00:00
  desde hoy? [Vale] [Aún no]». No cambia nada sola; se apaga en Sueño.

## 2 · Dudas
Ninguna abierta: todo lo decidió el Consejo por delegación (Resolución 1-4). Supuestos abajo.

## 3 · Dónde se toca (`app.js`)
- Piezas: `lloretPlan` 7333 (ya da `de`,`a`,`bed`), `acostarsePara` 1520, `snCamaDe` 6186, `viajeCfg` 1818,
  `mananaPlan` 5650, `salirDeCasaTxt` 1830, `suenoReal` 6092 (camas reales: `.acostar`).
- Montaje de Hoy: `hoyDiaHTML` 5471 (`seg` + por modo; Conductor línea 5479 = `hoyChoqueHTML+mananaHTML+hoyBusHTML`).
  `renderHoy` 7371: pie `horasSuenoHTML(hoy,inf)` en 7415 y `suenoHoyCardHTML()` en 7429 → **quitar esas llamadas**
  (las funciones se quedan si las usa otra vista: `grep -n` antes de borrar).
- Datos: `normalize` 538; el de `o.manana` (656-659) **borra las entradas sin `salio` ni `eur`** → añadir `okL`
  (`/^\d{2}:\d{2}$/` en `llego`). `store.lloret` hoy no se normaliza: añadir `vuelta` (objeto fecha→HH:MM, filtrar
  claves y valores). La copia y el export son el store entero (`storeParaCopia` 25665): entra solo.
- Acciones: `act()` (clicks; p. ej. `manana-sali` 24989, `hoy-modo` 24217). Las de la hoja (−5/+5) van en `act()`; si
  se usa `<input type=time>`, en el switch de `change` (27064 tiene `manana-real` de ejemplo).
- `.ics`: `snCamaEventos` 6355 ya existe con el interruptor `suenoCfg().avisoCama`; N2 solo añade «vete del Lloret» y
  «sal de casa» con el mismo patrón, apagado por defecto.
- Pruebas parecidas: `tests/regression.test.js` 11587-11689 (`manana.salio`, `manana-deshacer`).

## 4 · Pasos
**N1** (~1,2 M)
- [x] P1 Prueba encadenada que falla: Hoy a las 21:20 con Lloret → abrir modo Línea → la pieza `.noche` dice «Vete del
  Lloret» y «21:45»; tocar la fila → se despliega; pasar a Conductor → sigue arriba; no hay `.drsol`/`suenoHoyCard` ·
  tests/regression.test.js · sonnet · ~8
- [x] P2 Función pura `nocheCadena(key,nowMin)` (hitos con hora en minutos, cama del escalón; `pendientes`, `grande`
  como en la maqueta) · app.js junto a `lloretPlan` · sonnet · ~10
- [x] P3 Componente `nocheHTML(key,esHoy)` (cartel LED + chips + desplegada) y CSS `.noche` · app.js `hoyDiaHTML` (justo
  después de `seg`) + styles.css · sonnet · ~12
- [x] P4 Quitar `horasSuenoHTML` de 7415, `suenoHoyCardHTML` de 7429 y `mananaHTML` de 5479 (su botón de salida vive en
  la pieza) · app.js · sonnet · ~6
- [x] P5 `verificador` a 412×915: 21:20, 07:17, 4 modos; la prueba cae al revertir P3 y ninguna otra · ~6
**N2** (~1,2 M)
- [x] P6 Pruebas encadenadas que fallan: «He vuelto» → −5 → Guardar → `lloret.vuelta[hoy]` y la cadena sin «Vete»;
  «He llegado» → `manana[hoy].llego` sobrevive a `normalize` · tests · haiku · ~8
- [x] P7 Normalizador (`vuelta`, `okL`) + acciones `noche-hoja`, `noche-h±5`, `noche-guardar` en `act()` · sonnet · ~10
- [x] P8 Pantallas «Alarmas» y «Tu semana» (`ui.hoyVista='alarmas'|'semana'`, como `'sueno'` en `renderHoy` 7373)
  · sonnet · ~12
- [x] P9 Sugerencia de adelantar la cama (`suenoCfg().adelanto` on/off, escalón en `store.sueno.escalon`) · sonnet · ~8
- [x] P10 `.ics` «vete del Lloret» y «sal de casa» apagados por defecto + DECISIONS · haiku · ~5
- [x] P11 `verificador` + suite corta de lo tocado · ~6

## 5 · Comprobación
Cada historia tiene paso y prueba (N1-a/b/c → P1-P5; N2-a/b → P6-P7; N2-c/d → P8; N2-e → P9). Maqueta aprobada
(Consejo por delegación). Sin rojos; 4:20 no se toca. Nada sale del móvil (el `.ics` ya estaba aceptado y va apagado).

**Supuestos:** el escalón de la cama arranca en la mediana de 7 noches (00:30 sin datos); «He vuelto» se ofrece de
vete−20 a vete+120; «llegar» = bus + `viajeCfg().min`; el chip ⏰ lleva «fijo».
