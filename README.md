# Guardias · rotación y cocina

App de una sola página para organizar guardias, rotación de servicios, menús semanales, cocina en
lote, lista de la compra, entreno y hábitos. Sin build, sin cuentas y sin servidor: todo se guarda
en el navegador.

## Probarla

```bash
npm install
npm test          # la app (Playwright) y el lector de enlaces
npm run test:app
npm run test:lector
```

Para usarla basta con abrir `index.html`.

## Importar recetas de TikTok

**☰ Más → Cocina → 📥 Importar receta.** Tres formas de meter una receta sin teclearla:

| | Dónde funciona | Qué necesita |
|---|---|---|
| Pegar el texto | en todas partes, sin conexión | que la receta venga escrita |
| Pegar el enlace | en la web (no en el Artifact) | a veces, un [lector de enlaces](tools/LECTOR-DE-ENLACES.md) |
| Que la lea Claude | solo en el Artifact de claude.ai | permiso del visor; acepta capturas |

En Android, instalando la app, TikTok la ofrece en **Compartir** y el texto entra solo.

**Lo que no puede hacer, y no va a poder:** escuchar el vídeo. Si la receta solo se dice en voz
alta y no está escrita en ningún sitio, ninguno de los tres caminos la saca. Para esos casos:
captura de pantalla + «Que la lea Claude», o copiar el comentario donde esté escrita.

## La compra, la despensa y el menú

El círculo entero vive en **Comer**, y cierra: compras → entra en casa → lo gastas → vuelve a la
lista.

| Paso | Dónde | Qué hace |
|---|---|---|
| La lista | Comer → Compra | Sale del menú de la semana, ordenada **por pasillos del súper**. El pasillo que terminas se pliega solo. |
| Súper o frutería | los tres botones de arriba | La fruta y la verdura van por su lado: son otra salida y otro día. Las cifras son las de esa salida. |
| Pegar una lista | Compra → mis listas | Una cosa por línea. Va a «A mano», que entra sola en la compra de la semana. |
| Meterla en casa | «he hecho esta compra» | Lo que marcaste pasa a la despensa **con su cantidad**, y la lista se queda limpia. |
| …o el ticket | Compra → 🧾 tengo el ticket | Pegas el ticket electrónico y entra la compra entera. Lee cantidades, pesos y abreviaturas del súper. |
| Gastarlo | Cocina → Mi nevera | Cada toque quita un cuarto de lo que compraste. Al acabarse, **vuelve solo a la lista**. |
| Montar la semana | Menú → montar la semana sola | Elige entre los platos que tú ya pones en cada toma: gana lo que hay en casa, cuadra tus kcal, y con gluten no entra. |

La compra sale en **Hoy** cuando toca, como una tarea más (cada 3, 4 o 7 días, tú eliges). **No se
mete en el calendario de Google**: se queda en la app.

### La foto del ticket

Igual que con las recetas: **leer una imagen necesita a Claude, y Claude solo existe dentro del
Artifact de claude.ai**. En el móvil, con la app instalada desde Pages, `window.claude` no está y
el botón no aparece — en su lugar la pantalla dice por qué. Cuando sí funciona, **la foto sale del
dispositivo** y viaja a Claude; el aviso va pegado al botón. Pegar el texto del ticket no manda
nada a ninguna parte.

## Tus kcal y los días raros

En **Comer → Tú**: altura, peso, fecha de nacimiento y a dónde vas. De ahí salen las kcal por
Mifflin-St Jeor y la proteína por kilo, con un botón para dejarlas puestas como objetivo. Es una
**estimación** y la app lo dice: el gasto real se mide, no se calcula, y lo que la corrige es el
peso semana a semana.

Los días que se salen del plan, en **Comer → Hoy**:

- 🏥 **menú del hospital** — no inventa kcal: las apuntas tú cuando sabes qué había. El plan del
  día deja de contar, porque ya no te lo vas a comer.
- 🍽️ **he comido fuera** y 🍫 **día de moncheo** — suman una estimación editable.

### Celiaquía

La app **avisa**, no garantiza. Tres estados: lleva gluten, no lleva, y «mira la etiqueta» —que es
de verdad «no lo sé»: el chorizo de una marca lleva y el de otra no. La avena tiene interruptor
propio en «Tú», porque no lleva gluten pero se muele con trigo: si la tuya es certificada, deja de
avisar (los productos que la llevan mezclada siguen avisando igual).

## Estructura

- `index.html`, `app.js`, `styles.css` — la app entera.
- `sw.js`, `manifest.json` — para instalarla en el móvil y recibir lo que compartes.
- `tools/` — el lector de enlaces (opcional) y su guía.
- `tests/` — las suites (regresión de la app, compartir, enlaces, actualización y el lector).
