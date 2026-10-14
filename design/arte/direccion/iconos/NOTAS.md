# Iconos vivos · notas (fase 1, maqueta)

Ficheros: `iconos.js` (la función), `iconos.css` (el movimiento), `index.html` (muestrario a 412 px, con
botones para cambiar estados), PNG: `muestrario-{oscuro,claro}.png` (página entera),
`muestrario-*-pantalla.png` (lo visible a 412×915), `todos-*.png` (rejilla a 24 y 32) y `secuencia-*.png`
(fotogramas de cada cambio de estado, con el reloj de la animación parado a mano).

## Lista (46) · emoji de antes · estados

| Icono | Antes | Estado vivo |
|---|---|---|
| hoy | 🏠 | `{hora}`: el sol recorre el arco 7–22 h; lo pasado queda trazado en marca, lo que falta punteado. De noche, sol hueco |
| semana | 📅 | `{dia:0–6}`: fila de la semana rellena hasta hoy + punto de hoy |
| mes | 🗓 📆 | — |
| comer | 🍽 | — |
| mancuerna (entreno) | 🏋️ 💪 | `{series}`: se levanta una vez al sumar una serie |
| luna (sueño) | 😴 🛌 🌙 | `{fase:0–1}` u `{horas}`: zona iluminada (8 h = llena, con chispa) |
| hucha (dinero) | 💶 | `{nivel}`: se llena; al subir cae una moneda y tintinea |
| planta (hábitos) | 🌱 | `{nivel}`: 0–4 hojas y el tallo crece; `{mustia:true}` se dobla y amarillea |
| mas | ☰ | — |
| ajustes | ⚙️ | — |
| notas | 📝 ✍ | — |
| libro (estudio) | 📚 📖 | `{minutos}` o `{pasa:true}`: pasa una página |
| eventos | 📌 | — |
| hoja420 | 🌿 | `{discreto:true}`: se cambia por un candado |
| hecho | ✅ ✓ ✔ | `{on}`: el check se dibuja (200 ms) y el aro se rellena |
| pendiente | ⏳ | — |
| aviso | ⚠️ | `{alerta}`: sacudida corta al aparecer |
| fonendo (guardia) | 🩺 | `{guardia:true}`: late despacio (lo único en bucle) y se tiñe de rojo |
| saliente | 🚪 | — |
| libre | 🌿 (ahora sofá) | — |
| vacaciones | 🏖 ✈️ | — |
| anadir · editar · borrar · buscar · compartir · volver · cerrar · deshacer | ➕ ✏/✎ 🗑 🔍 📤 ‹ ×/✕ ↩️ | — |
| cafe (para llevar) · taza | ☕ | taza `{caliente}`: humea; al enfriarse el vapor sube y se va (1,4 s) |
| taper | 🥡 | `{nivel}`: raciones que quedan |
| plato · sol · bus · taxi · bici · carrito · camara · candado · diana | 🍽 ☀️ 🚌 🚕 🚲 🛒 📷 🔒 🎯 | — |
| cama | 🛌 | `{on}`: zzz si estás durmiendo |
| calendario | 📅 | `{dia}`: el número del día; al cambiar, el número sube |
| reloj | ⏰ ⏱ | `{hora}`: las agujas giran hasta la hora |
| energia (depósito) | — (nuevo) | `{nivel}`: baja/sube; por debajo de 0,3 pasa a ámbar y el rayo parpadea una vez |
| campana | 🔔 | `{alerta}` / `{nuevo:true}`: se balancea una sola vez y sale el punto |

Alias: `entreno, sueno, dinero, habitos, estudio, guardia, 420/consumo, dia, compra`. Los emojis de comida
se quedan (son datos).

## Cómo entraría en app.js

1. **Una función**: pegar `iconos.js` tal cual junto a `GYM_ICO` (o sustituirlo: `gymIco(n)` pasa a ser
   `ico(n,{decorativo:true})`). Devuelve texto, así que encaja con el `innerHTML` de siempre:
   `'<button>'+ico('hucha',{nivel:ahorro/meta})+' Dinero</button>'`.
2. **Un CSS**: pegar `iconos.css` en `styles.css`. Usa `--marca`, `--acento`, `--ojo`, `--guardia`,
   `--marchito` (con valores de reserva), así que sigue al tema solo.
3. **Para que se mueva al cambiar** hay que conservar el `<svg>` y llamar a `ico.actualiza(svg, nuevoEstado)`
   (las transiciones solo corren si el mismo nodo cambia de valor). Donde la sección se repinta entera con
   `innerHTML`, el icono aparece ya en su estado final, quieto: es correcto, pero no se ve el viaje. Lo
   práctico: los iconos «de cabecera» (barra, energía, hucha de Dinero, planta de Hábitos) en nodos que no se
   repintan, y en el resto conformarse con el estado quieto.
4. La campana con `{nuevo:true}` se balancea al insertarse: pasarlo **solo la primera vez** que se pinta un
   aviso, o se balanceará en cada repintado.
5. `prefers-reduced-motion` lo deja todo quieto (comprobado: 0 animaciones tras cambiar estados) y la clase
   `.sin-mov` hace lo mismo para un ajuste propio de la app.

## Lo que no me convence

- **hoy**: a 24 px el sol sobre el arco puede leerse como una cúpula o una lámpara. Es la idea más
  «jornada», pero quizá funcione mejor solo dentro del hilo de 24 h y no como icono de pestaña.
- **hucha**: a 24 px el cerdito se entiende, pero la moneda encima parece una antena. Probar sin moneda en
  reposo (que solo salga al ahorrar).
- **luna**: la fase en gibosa (6–7 h) se ve como un óvalo; la zona iluminada se anima con `d: path()`, que
  va en Chrome/Android; en Safari/iOS no lo he probado (si no anima `d`, salta sin viaje).
- **semana** y **mes** se parecen mucho (calendario con banda vs. calendario con puntos).
- **comer** es denso a 24 px (plato + tenedor + cuchillo); a 32 se ve bien.
- **libre** pasa a ser un sofá: deshace el 🌿 repetido con 4:20, pero es una decisión que debería ver el
  usuario.
- Los números de día usan la letra del sistema: en el móvil puede variar el ancho de «28».
