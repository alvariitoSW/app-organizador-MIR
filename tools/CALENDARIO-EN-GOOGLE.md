# Que Google se actualice solo

Unos 10 minutos, gratis y sin tarjeta. Lo haces una vez.

## Por qué, antes de nada

**Importar un `.ics` es una foto.** Google se queda con lo que había ese día. Si luego cambias
una guardia o borras algo, en Google sigue estando, y hay que volver a importar a mano.

**Suscribirse a una dirección es otra cosa.** Google la relee cada pocas horas y deja el
calendario *igual* que el fichero: añade lo nuevo, cambia lo que cambió y **quita lo que ya no
está**. Eso es lo único que hace que no se acumulen copias.

Lo que falta para eso es una dirección, porque la app es un HTML en tu móvil y no tiene servidor.
Esto lo pone.

## Lo que hay que saber antes de decidir

- **Tus turnos salen del móvil.** Lo que sube es el calendario: guardias, jornada, entrenos y
  avisos, con sus horas. Nada de comida, dinero ni peso.
- **Quien tenga la dirección completa, entra.** Es el mismo trato que hace Google con su
  «dirección secreta en formato iCal»: el secreto es que la dirección es larga y aleatoria, no que
  esté cifrada. No la pegues en un sitio público. Si se te escapa, en la app le das a **cambiar la
  dirección** y la vieja deja de existir.
- **Google refresca cuando quiere**, entre 8 y 24 horas. Eso lo manda él y no se puede acelerar.
  Si necesitas ver un cambio ya, bájate el `.ics` e impórtalo: con los UID estables, importar
  encima actualiza en vez de duplicar.

## 1. Crear el Worker

1. Entra en [dash.cloudflare.com](https://dash.cloudflare.com) (la cuenta gratis vale).
2. **Workers y Pages → Crear → Worker**. Ponle `calendario`. **Implementar**.
3. **Editar código**, borra lo que haya y pega entero `tools/worker-calendario.js`. **Implementar**.

Apunta la dirección que te da: `https://calendario.loquesea.workers.dev`.

## 2. El almacén y el secreto

En el Worker, **Configuración**:

- **Enlaces → KV → Añadir**: nombre de la variable **`CAL`** (ese nombre exacto). Si no tienes
  ningún espacio KV, créalo antes en *Almacenamiento y bases de datos → KV*; el nombre del espacio
  da igual.
- **Variables y secretos → Añadir → Secreto**: nombre **`TOKEN`**, valor una contraseña larga que
  te inventes. Es la que impide que otro escriba en tu calendario. Cópiala, que luego va en la app.
- *(opcional)* **Variable** `ORIGEN` con `https://tu-usuario.github.io`, para que solo tu app pueda
  escribir.

**Implementar** otra vez para que coja los cambios.

## 3. Conectar la app

En la app: **Ajustes → Calendario del móvil**, abajo, «O que se actualice solo».

- **dirección de tu Worker**: la del paso 1. Tiene que empezar por `https://` — el token viaja en
  una cabecera y por `http` lo lee cualquiera del wifi.
- **token**: el secreto del paso 2.

Dale a **subir los cambios**. Si sale «token», es que no coincide con el del Worker.

Con los dos campos puestos queda encendido **subir solo al cambiar algo**: a partir de ahí no tienes
que darle a nada. La app agrupa lo que cambies y sube unos segundos después; si no hay cobertura,
sube al volver, y si no ha cambiado nada no sube. Se puede apagar con ese mismo botón.

## 4. Suscribir los cuatro calendarios en Google

Esto hay que hacerlo **desde el ordenador**: la app de Android no sabe suscribirse a una URL.

1. En la app, **ver las 4 direcciones** y cópialas.
2. En [calendar.google.com](https://calendar.google.com), en «Otros calendarios» → **+** →
   **Suscribirse a un calendario** → **Desde URL**. Pega la primera. Repite con las otras tres.
3. A cada calendario nuevo ponle **su color** (los tres puntos → el color). El que dice la app en
   *Ajustes → Calendario*.

Son cuatro calendarios distintos **a propósito**: Google le pone un color a cada calendario y no
mira el color que trae el fichero. Todo en uno = todo del mismo color, que es lo que pasaba antes.

## A partir de aquí

Cambias algo en la app → se sube solo → Google se entera en unas horas. La app te dice si hay algo
sin subir y cuándo fue la última vez, y «subir ya» está ahí para forzarlo.

## Si algo va mal

| Lo que ves | Qué es |
|---|---|
| «token» al subir | El de la app y el del Worker no coinciden. Vuelve a poner el secreto y **Implementa**. |
| «al Worker le falta el almacén KV» | El enlace KV no se llama `CAL`, o falta. |
| Google dice que no puede | Pega la dirección en el navegador: tiene que bajarse un `.ics`. Si no, revisa que la pegaste entera. |
| En Google no cambia nada | Normal las primeras horas. Google refresca entre 8 y 24 h. |
| Duplicados de antes | Los de las importaciones viejas no se van solos: borra a mano esos calendarios en Google y suscríbete de cero. |
