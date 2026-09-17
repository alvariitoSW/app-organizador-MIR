# Maquetas: Notas

Cinco pantallas. **Son maquetas, no la app.**

| archivo | pantalla | alto |
|---|---|---|
| `Notas.dc.html` | la libreta: apuntar, filtrar, ver todo | 1.5 pantallas |
| `NotaAbierta.dc.html` | una nota: día, color, y su evento si lo tiene | 1.0 |
| `AlCalendario.dc.html` | convertir una nota en evento | 1.0 |
| `DiaEnElMes.dc.html` | el cruce: 📝 en la casilla y las notas del día | 1.0 |
| `Hoy.dc.html` | «Notas de hoy» sin tener que ir al Mes | 1.0 |

## De dónde salen estas maquetas (medido en el móvil, 412×915)

| qué | cómo está hoy |
|---|---|
| Mes | 2246 px (2.45 pantallas), casillas de 114×53, el 📝 ya se pinta |
| Un día abierto | 3021 px (3.30 pantallas), 104 controles |
| La nota de ese día | **un `textarea` de 49 px al final de esas 3.3 pantallas** |
| Eventos | se editan en **Ajustes**, no donde parece |
| Cajón ☰ Más | 8 entradas, ninguna es Notas |

Dos cosas que salieron al conducir la app:

1. **La nota de hoy funciona** (sale al abrir el día que la tiene): no es un
   fallo, es que está enterrada y solo cabe una por día.
2. **«+ añadir o quitar eventos»**, en la tarjeta de eventos del Mes, lleva a
   **Hábitos**, donde no hay ningún evento. El editor está en Ajustes. Eso sí es
   un fallo y toca arreglarlo con esto.

## El modelo que proponen las maquetas

Hoy hay `store.notasDia` = **una** nota por día, texto suelto. Pasaría a
`store.notas` = una lista:

```js
{id, txt, fecha:'' | '2026-09-17', hecha:false, color, evId:'', ts}
```

- `fecha:''` → nota suelta: vive solo en la libreta, no ensucia el calendario.
- `fecha:'2026-09-17'` → sale en la casilla del 17 (📝) y al abrir ese día.
- `evId` → nota enlazada a un evento de `store.eventos`. **No se duplica nada**:
  la nota apunta al evento. Si borras el evento, la nota se queda con su día.
- Lo que ya tengas en `notasDia` se migra solo, una nota por día, sin perder nada.

## Decidido, y ya construido

1. **Notas vive en el cajón ☰ Más**, entre Comida y Hábitos.
2. **«Marcar hecha» existe** y la nota se queda a la vista **2 días**
   (`NOTA_PURGA_DIAS`) antes de borrarse sola. Cada nota hecha dice cuántos días
   le quedan.
3. **Los eventos se quedan en Ajustes.** Lo que se arregló es el enlace: el botón
   «+ añadir o quitar eventos» del Mes llevaba a Hábitos, donde no hay ninguno.

Fijado en `tests/regression.test.js` (pruebas 70–74).

## Cómo se regeneran

```
node pantallas.mjs   # escribe los .dc.html desde build.mjs
node preview.mjs     # los mira a 390×844 y avisa de desbordes
```
