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

## Estructura

- `index.html`, `app.js`, `styles.css` — la app entera.
- `sw.js`, `manifest.json` — para instalarla en el móvil y recibir lo que compartes.
- `tools/` — el lector de enlaces (opcional) y su guía.
- `tests/` — las dos suites.
