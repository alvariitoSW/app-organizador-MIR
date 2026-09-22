# Ajustes y Datos · el mismo trabajo que se le hizo a Turno

## Por qué

Medido a 412×915 con datos de verdad, antes de tocar nada:

| | alto | tarjetas | campos | palabras |
|---|---|---|---|---|
| Ajustes | 5 150 px (5,6 pantallas) | 13 | 44 | 1 176 |
| Datos | 4 317 px (4,7) | 7 | 15 | 870 |

Entre las dos: **26 % del alto de la app y 32 % de todo su texto**. Y la propia
app lo dice por escrito tres veces:

- la primera tarjeta de Ajustes gasta 48 palabras en explicar dónde está de
  verdad cada cosa;
- «Sueño» dice *«la ventana de la cena sigue en Turno y rotación → 2c»*;
- «Guardias y rotación» dice *«esto es lo mismo que ves dentro de Mes →
  configurar este mes»*;
- y la tarjeta de Google de Ajustes dice *«Afecta al .ics que generas en
  "Datos"… cambiarlos aquí o allí es lo mismo»*.

Google Calendar sale **tres veces**: 1 tarjeta en Ajustes (482 px) y 2 en Datos
(454 + 820) = 1 756 px y 522 palabras sobre lo mismo, repartidos en dos
pantallas.

Y los **Eventos** —lo que más se usa— son la tarjeta **4 de 13**, enterrada
entre el lector de enlaces y las copias de seguridad.

## Qué proponen estas maquetas

| maqueta | qué es | alto |
|---|---|---|
| `Main` | **Ajustes**: qué tienes encendido + 6 puertas | 535 px (0,63) |
| `Calendario` | las **tres** tarjetas de Google, fundidas en una | 893 px (1,06) |
| `Eventos` | sección propia en el cajón, fuera de Ajustes | 668 px (0,79) |
| `Datos` | **Datos**: tu copia + 6 puertas | 436 px (0,52) |
| `Aspecto` | apariencia y la franja del día, juntas | 535 px (0,63) |
| `Copia` | copias + «dónde se guarda», en cifras y no en 210 palabras | 516 px (0,61) |

Medido a 390×844, que es el ancho de maqueta; la app se mide a 412.

## Lo que se mueve de sitio

- **Eventos** → sección propia, en el cajón bajo «Seguimiento», con Notas,
  Hábitos y Dinero.
- **Guardias y rotación** (544 px) y **Mis rotaciones** (495 px) → a «Turno y
  rotación», que es de donde son. Se cae la puerta «Servicios» que hoy manda de
  Turno a Ajustes y vuelve.
- **Horarios de cada tipo de día** (548 px) → se cae: son atajos a Turno, y
  Turno ya tiene «Mis días» y «A qué horas» en su portada.
- **Copias de seguridad** (Ajustes) → a Datos, con el resto del guardado.
- Las **dos tarjetas de Google de Datos** → a Ajustes → Calendario.
- La tarjeta de cabecera de Ajustes (48 palabras de mapa) → se cae: la portada
  es el mapa.

## Un texto que se quedó caduco

La tarjeta «Google · 1 · para fuera» dice que el `.ics` lleva **solo tres
cosas** (guardias, trabajo y entrenos) y que «nada de vacaciones, salientes ni
días libres». Desde el punto 7 del informe, `calEventos()` exporta **seis**
categorías: `GUARDIA`, `TRABAJO`, `ENTRENO`, `DINERO`, `TAREA` y `EVENTO`. La
maqueta `Calendario` las enseña las seis.

## Cómo se regeneran

```bash
cd design/ajustes-datos
node pantallas.mjs   # escribe los seis .dc.html
node preview.mjs     # mide y deja las capturas en /tmp/shots/ad-*.png
```
