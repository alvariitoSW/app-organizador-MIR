# Maquetas: Semana, el sol y la señal de «hoy»

Cinco pantallas. **Son maquetas, no la app.**

| archivo | pantalla | alto |
|---|---|---|
| `Semana.dc.html` | la semana, con el sol y «hoy» marcado | 1.6 pantallas |
| `DiaAbierto.dc.html` | un día desplegado dentro de la semana | 1.1 |
| `Sol.dc.html` | el sol y la región, en Ajustes | 1.1 |
| `Hoy.dc.html` | Hoy con la tarjeta del sol | 1.0 |
| `MarcaDeHoy.dc.html` | la misma señal de «hoy» en las tres vistas | 1.1 |

## Medido en el móvil, 412×915, con datos de verdad

| qué | cómo está hoy |
|---|---|
| Semana entera | 2692 px = **2.94 pantallas** |
| **Antes de ver el primer día** | **1007 px = el 110 % de la pantalla** |
| Los 7 días | 89 px cada uno = 623 px, el **23 %** de la página |
| Tarjetas / KPIs / controles | 3 / **7** / 11 |
| La señal de «hoy» | existe, pero **solo cambia el color del borde izquierdo** de `#38e1ff33` a `#38e1ff` — y es la misma que usa un día abierto |
| El sol | no se menciona en ninguna vista |

Lo de arriba es el diagnóstico: hay que hacer scroll de una pantalla entera de
configuración (modo plantilla/fecha, ancla, autocompletar, la tabla del ciclo de
4 semanas, 7 KPIs) antes de ver el lunes.

**La señal de «hoy» no falta: es imperceptible.** `isToday()` ya usa la fecha del
teléfono y `.drow.today` ya se aplica; lo que pasa es que su único efecto visual
coincide con el de `.drow.open`.

## Qué cambia

- **La semana primero.** Los 7 días arrancan arriba del todo. La configuración
  (patrón, ancla, autocompletar, ciclo) se va a «Turno y rotación», que es donde
  vive, y aquí queda una línea de resumen y un botón.
- **KPIs de 7 a 3** y debajo de los días, no encima.
- **Hoy se ve desde la otra punta**: borde encendido, fondo azul, resplandor,
  etiqueta `HOY` y una línea roja de «ahora» en la franja de 24 h.
- **El sol, en la propia franja**: la barra es negra de noche y se ilumina en
  ámbar entre el orto y el ocaso, así que la longitud del día se ve sin leer un
  número. Debajo, las horas exactas.

## El sol: cómo se calcula

Con la ecuación del orto/ocaso (NOAA) **en el propio móvil**, a partir de la
latitud, la longitud y la fecha. Ni red, ni API, ni clave: funciona de guardia
sin cobertura y no sale nada del teléfono.

Comprobado contra valores reales para el 17 de septiembre de 2026:

| sitio | sale | se pone |
|---|---|---|
| Las Palmas de Gran Canaria | 07:47 | 20:05 |
| Santa Cruz de Tenerife | 07:50 | 20:08 |
| Madrid | 07:57 | 20:21 |
| Barcelona | 07:33 | 19:58 |
| Sevilla | 08:07 | 20:29 |

Coherencia interna verificada: Tenerife sale 3 min después que Las Palmas (0,81°
más al oeste) y Barcelona 24 min antes que Madrid (5,87° más al este). En sitios
polares (Tromsø) devuelve «no amanece» / «no anochece» en vez de una hora falsa.
**Precisión: unos minutos.** La app lo dice.

Por defecto, **Las Palmas de Gran Canaria** (28.1235, −15.4363). Se cambia desde
Ajustes con una lista de sitios, latitud/longitud a mano o «usar mi ubicación».

## La hora del teléfono

«Hoy» se saca de `new Date()` del móvil, que ya es lo que hace la app. Dos cosas
que hay que añadir al construir:

1. **A medianoche la marca se mueve sola.** Hoy, si dejas la app abierta, el día
   marcado se queda clavado hasta que recargas.
2. **Si la región elegida no cuadra con la zona horaria del móvil** (viajas y no
   cambias una de las dos), la app lo dice en Ajustes en vez de dar horas que no
   son.

## Decidido, y ya construido

1. **La configuración se fue a «Turno y rotación»** (tarjeta «Cómo se arma tu
   semana»). En Semana queda una línea de resumen y el botón «patrón y rotación».
2. **Las horas del sol van en cada día**, en Semana y en Hoy. En Mes no.
3. **Vienen dos sitios de fábrica**, Las Palmas de Gran Canaria y Madrid, y se
   pueden añadir más (nombre + latitud/longitud, o «usar mi ubicación»). Los dos
   de fábrica no se borran.

### Lo que salió al construir, medido otra vez a 412×915

| | antes | después |
|---|---|---|
| Semana entera | 2692 px (2,94 pantallas) | **2073 px (2,27)** |
| Antes de ver el lunes | **1007 px (110 % de pantalla)** | **14 px** |
| Alto de cada día | 89 px | 111 px (ahora lleva el sol) |
| KPIs | 7 | **3** |
| Controles a la vista | 11 | 7 |
| Señal de hoy | solo el borde izquierdo | borde, fondo, resplandor y etiqueta `HOY` |

**La franja de 24 h sombrea la noche por encima de los bloques**, no ilumina el
día por debajo: al fondo, los tramos de dormir y de trabajo tapaban justo la
franja de luz y no se veía nada.

Fijado en `tests/regression.test.js` (pruebas 65–69).

## Cómo se regeneran

```
node pantallas.mjs   # escribe los .dc.html desde build.mjs
node preview.mjs     # los mira a 390×844 y avisa de desbordes
```
