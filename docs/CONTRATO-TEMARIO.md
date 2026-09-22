# El contrato entre el temario y el organizador

El temario **no vive** en esta app y no debería: mantener dos listas de temas es
la manera más rápida de que se desincronicen. Esta app se queda con lo que la
del temario no puede saber —qué te toca repasar hoy **contra tu turno**, cuánto
llevas, cuándo volver a cada tema— y las dos se hablan por un JSON.

Son dos ficheros, uno en cada dirección. Nada más. No hace falta servidor, ni
cuenta, ni que las dos apps estén en el mismo sitio.

```
   tu app del temario  ──  temario.json  ──▶  organizador   (qué temas hay)
   tu app del temario  ◀──  progreso.json ──  organizador   (por dónde vas)
```

---

## 1. De ida: `temario.json`

Lo que la app del temario le da al organizador.

```json
{
  "app": "temario",
  "version": 1,
  "nombre": "Temario MIR 2026",
  "url": "https://alvariitosw.github.io/mi-temario/",
  "temas": [
    {
      "id": "card-01",
      "bloque": "Cardiología",
      "nombre": "Insuficiencia cardiaca",
      "peso": 3,
      "url": "https://alvariitosw.github.io/mi-temario/#/tema/card-01"
    }
  ]
}
```

| campo | obligatorio | qué es |
|---|---|---|
| `temas[].id` | **sí** | La clave del cruce. Ver «Por qué el id lo es todo». Máx. 64 caracteres. |
| `temas[].nombre` | **sí** | Cómo se llama el tema. Máx. 120. |
| `temas[].bloque` | no | Para agrupar (asignatura, sistema, lo que uses). Máx. 60. |
| `temas[].url` | no | Enlace directo a ese tema en tu app. Solo `https://`. El organizador pinta un «abrir en tu temario ↗». |
| `temas[].peso` | no | 0–9. Reservado para priorizar; hoy no se usa para nada. |
| `nombre` | no | Cómo se llama el temario, para enseñarlo. |
| `url` | no | La portada de tu app, por si un tema no trae la suya. |

También se acepta **un array pelado** de temas (`[{...}, {...}]`) por si te
resulta más cómodo servir eso.

Lo que el organizador hace al recibirlo, y conviene saber:

- **Descarta en silencio** cualquier tema sin `id` o sin `nombre`, y los `id`
  repetidos (se queda con el primero).
- Solo acepta `url` que empiecen por `https://`. Una `http://` o una
  `javascript:` se ignoran.
- Recorta los campos a los tamaños de la tabla.
- Si no encuentra ningún tema válido, **no toca nada** y lo dice.

## 2. De vuelta: `progreso.json`

Lo que el organizador le devuelve a la app del temario.

```json
{
  "app": "organizador-mir",
  "version": 1,
  "cuando": "2026-09-22",
  "temario": "Temario MIR 2026",
  "progreso": {
    "card-01": {
      "nivel": 2,
      "visto": "2026-09-20",
      "repasos": ["2026-09-14", "2026-09-20"],
      "min": 95
    }
  }
}
```

| campo | qué es |
|---|---|
| `nivel` | 0 sin ver · 1 visto · 2 un repaso · 3 dos repasos · 4 sabido |
| `visto` | La última vez que le diste a «estudiado» o «repasado» |
| `repasos` | Las últimas 8 fechas en que lo repasaste |
| `min` | Minutos que le has echado en total |

Solo salen los temas con algo que contar: un tema en nivel 0 y sin minutos no
ocupa sitio en el fichero.

---

## Por qué el `id` lo es todo

El progreso de esta app se guarda **contra el `id`**, nunca contra el nombre ni
contra la posición en la lista. Eso significa que en la app del temario puedes:

- renombrar un tema,
- moverlo de bloque,
- reordenar la lista entera,
- añadir o quitar temas,

…y volver a traer el temario aquí **sin perder nada**. Lo que ya no esté en el
temario nuevo deja de listarse, pero su progreso se guarda por si vuelve.

Lo único que rompe el cruce es cambiar el `id` de un tema. Si lo haces, ese tema
aparece aquí como nuevo y sin ver.

---

## Las tres maneras de pasar el fichero

En «Estudio → Conectar», y las tres funcionan sin servidor:

1. **Subir el fichero.** Se lee en el navegador, no se sube a ninguna parte.
2. **Pegar el JSON** en la caja.
3. **Dar una dirección `https://`.** El navegador la pide **directamente**, sin
   ningún intermediario. Para que funcione, ese sitio tiene que permitir que lo
   lean desde otro origen (CORS): si tu app está en GitHub Pages, sirve el
   `temario.json` como un fichero más y ya lo permite. Si no se puede, la app lo
   dice y te deja bajar el fichero y subirlo a mano — no se queda colgada.

## Qué hace el organizador con esto

Lo que justifica que el plan viva aquí y no allí:

- **El repaso espaciado**: 1 → 3 → 7 → 21 → 60 días. Cada «lo he repasado»
  aleja el siguiente; «no me acordaba» lo acerca.
- **«Hoy»**: lo que toca repasar sale en la pantalla del día, junto a lo que
  tienes que hacer y lo que te toca pagar.
- **El calendario del móvil**: los repasos que vencen entran en el `.ics` con su
  alarma, categoría `ESTUDIO`, una cita por día y no una por tema.
- **Las horas**: cuánto has estudiado de verdad, por semana y por tema.

## Un ejemplo mínimo que funciona

```json
{"temas":[
  {"id":"t1","nombre":"Insuficiencia cardiaca","bloque":"Cardiología"},
  {"id":"t2","nombre":"Fibrilación auricular","bloque":"Cardiología"},
  {"id":"t3","nombre":"EPOC","bloque":"Neumología"}
]}
```

Con eso ya se puede probar: pégalo en «Estudio → Conectar → traer estos temas».
