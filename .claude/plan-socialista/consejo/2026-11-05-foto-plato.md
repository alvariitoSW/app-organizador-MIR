# Consejo de Ministros · 2026-11-05 · La foto del plato

Asunto de `plan-v3.md` ([v3-foto-plato], idea del 02/11, «estaría muy bien») que esperaba decisión; contexto en
`docs/veredicto-competencia-2026-11.md` §3. **No se construye nada**: sale una recomendación, una maqueta
(`maquetas/foto-plato.html`) y 3 preguntas. Preside Transportes (`/bitacora`). Toca la regla de privacidad (nada
sale del móvil) y cambia lo que ve: **es de los reservados al usuario** (lista cerrada, puntos 2, 4 y 5).

## Orden del día

1. Foto del plato: qué es y cuánto, para apuntarlo en Comer. Tres caminos: (A) reconocer en el móvil, (B) servicio de
   IA externo, (C) intermedio sin reconocimiento, o B solo si el usuario lo activa con su clave.

## El mapa (búsquedas de quien preside, sin releer `app.js`)

- **Lector de fotos que ya hay:** Tesseract en el móvil (`vendor/ocr`, **6,0 MB**: 3,9 MB de motor + 2,1 MB de español),
  `ocrListo` L23242, usado por el ticket (`tkOcr` L22213) y los pedidos de Glovo (`pedOcr` L4017). **Lee letras, no
  platos**: para la foto del plato no sirve.
- **Cámara que ya hay:** el escáner de códigos de barras (`iniciarEscaner` L5237, `BarcodeDetector` de Chrome +
  Open Food Facts `offUrl` L5148, que ya sale a la red solo con el código, no con fotos). `<input capture="environment">`
  ya se usa en el ticket (L22264).
- **Apuntar comida:** buscador de alimentos (`alimBuscar` L4361, `alimDeTexto` L4272 para texto libre), los platos del
  usuario (`dishById`, `platoDeTexto` L12464), la hoja de cantidad por raciones/gramos (`maquetas/comer-cantidad.html`)
  y el catálogo `data/food-catalogo.json` (190 productos). El plan del día ya sabe qué toca en cada comida.
- **IA que ya hay:** `window.claude.use('sample')` (L20704) lee capturas de recetas, pero **solo existe dentro del
  Artifact de claude.ai**; en GitHub Pages, en el móvil, no está (L22239, L23141).
- **Almacén de fotos:** IndexedDB ya se usa para las 7 copias de seguridad (L19653). Las fotos no deben entrar ahí.
- **Idea hermana:** [v3-mapa-comidas] también quiere «guardar una foto de lo que he comido». Comparten almacén.

## Asunto 1 · Dictámenes

| Ministerio | Dictamen | Voto |
|---|---|---|
| **Sanidad + Bienestar** (Comer) | Lo que cansa de apuntar no es saber qué es (él sabe que son lentejas), es **buscarlo y poner la cantidad**. Un «¿Es esto?» con 3 candidatos sacados de lo que ya sabe la app (lo que tocaba hoy en el plan, lo último que apuntó a esa hora, sus platos más repetidos) acierta casi siempre y deja 2 toques: foto → «Sí» → ración. La cantidad por foto no es fiable en ninguna opción (ni las apps comerciales bajan de ±30 % sin referencia de tamaño); mejor raciones ½ · 1 · 1½ que un «~350 g» que parece exacto y no lo es. La foto guardada sirve de diario («¿qué cené el martes de guardia?») y para el futuro mapa. La IA (B) acierta platos mezclados y de fuera (bocadillo de la cafetería, menú del día), que es donde C se queda corto. Nunca culpa ni rojo. | **C1 sí**; B solo si él quiere |
| **Interior** (cómo) | A: los modelos que caben en el navegador (MobileNet/EfficientNet entrenados en Food-101: ~10-25 MB cuantizados; CLIP para comparar con sus platos: ~90-150 MB) aciertan ~70-85 % en fotos de concurso de platos sobre todo anglosajones; con tortilla, lentejas, cocido o la bandeja del hospital, bastante menos, y **no dan cantidades**. Pide `onnxruntime-web` o `transformers.js` (dependencia nueva, ~1-2 MB de motor) y cachear el modelo en `sw.js`. C1 se hace con lo que hay: `<input capture>`, `canvas` para encoger la foto (~60-100 KB a 800 px), IndexedDB, la hoja de cantidad y el buscador. B: un `fetch` nuevo con la foto en base64; Anthropic acepta llamadas desde el navegador con su cabecera de acceso directo, así que no hace falta servidor si la clave es del usuario. | **C1**; C2 viable; A no |
| **Justicia** (privacidad y reglas) | A y C1 cumplen la regla 3: la foto no sale del móvil. **B la rompe**: la foto va a un tercero. Una clave de API **del proyecto** en una app publicada en GitHub Pages es pública por definición: cualquiera la copia y gasta a su cargo. **Prohibido.** Solo cabe la clave **del usuario**, guardada en su móvil, con interruptor **apagado por defecto**, aviso claro antes de la primera foto («esta foto sale de tu móvil hacia…») y sin enviar nada más que la imagen y la lista de nombres de sus platos. Riesgo propio de su trabajo: una foto en la cafetería o en la sala puede llevar una pegatina de bandeja con nombre de paciente o una pantalla al fondo; recortar al centro antes de enviar y avisarlo. Las fotos, **fuera de las copias** (local y Google). Lo decide el usuario (lista cerrada 4 y 5) y pasa por `/revisa-seguridad`. | **C1 sí**; C2 solo con estas condiciones; B tal cual no |
| **Hacienda** (tokens y euros) | C1: construir ~1,4 M (botón + foto encogida + IndexedDB con miniaturas que caducan + «¿Es esto?» con candidatos + prueba encadenada) + cierre 0,3 = **~1,7 M**, 0 €. C2 encima de C1: +1,2 M (Ajustes, clave, aviso, `fetch`, respuesta a candidatos) + `/revisa-seguridad` 0,3 = **+1,5 M**; en euros lo paga el usuario con su clave, del orden de **0,1-1 céntimo por foto** con un modelo pequeño (comprobar la tarifa del día al activarlo): ~3 €/año a 3 fotos diarias. A: ~3-4 M, +10-150 MB de descarga y peor resultado que C1 para lo que él come: **no compensa**. Recorte: reutilizar la hoja de cantidad y el buscador, no un apuntador nuevo. | **C1**; C2 aparte y solo si se pide |
| **Transportes** (calendario) | Va detrás de la fase 3 de La Competencia, como decía el plan. C1 deja hecho el almacén de fotos que necesita [v3-mapa-comidas]: hacerlas seguidas o juntas ahorra. C2, si se aprueba, en una ficha propia después de C1, nunca a la vez. | **C1 primero** |

**Acuerdo:** se **descarta A** (pesada, floja con comida española y sin cantidades) y se descarta **B con clave del
proyecto** (la clave sería pública). Se **recomienda C1**: la foto se queda en el móvil y la app propone «¿Es esto?» con
lo que ya sabe; la cantidad, por raciones. **C2** (IA con la clave del usuario, apagada por defecto, con aviso) queda como
segunda fase opcional, solo si él la pide.

**Recomendación al gobierno central:** C1 (~1,7 M) ahora; C2 (+1,5 M) solo si al usar C1 echa de menos que la app
«adivine» los platos de fuera.

## Lo que entra en el plan

- `[v3-foto-plato]` → «(Consejo, 05/11) → pendiente de tu respuesta». Recomendado C1 ~1,7 M; C2 opcional +1,5 M.
  Maqueta: `maquetas/foto-plato.html` (C1 en 3 pantallas + la variante C2).
- Nota en [v3-mapa-comidas]: comparte el almacén de fotos de C1 (no se toca su línea hasta que conteste).

## Lo que espera al usuario (3 preguntas)

1. **¿Qué camino?** a) C1: foto en el móvil y «¿Es esto?» con lo que la app ya sabe, sin IA (recomendado, ~1,7 M) ·
   b) C1 y después C2: además, un interruptor «Que lo reconozca la IA» con tu propia clave, apagado por defecto (~3,2 M en
   total, céntimos por foto a tu cargo) · c) Nada por ahora: se queda en Ideas.
2. **¿Se guarda la foto?** a) Sí, una miniatura 30 días en el móvil, fuera de las copias (recomendado) · b) No: sirve para
   elegir y se borra al apuntar · c) Sí, sin límite (ocupa ~30 MB al año).
3. **¿Dónde va el botón?** a) En la hoja «Apuntar» de Comer, junto a escribir y al código de barras (recomendado) ·
   b) Un botón grande «📷 Foto del plato» en Comer · Hoy · c) Los dos.

## Gasto de la reunión

Un solo agente (opus) hizo mapa, dictámenes, acta y maqueta, sin ayudantes. Lo apunta quien dirige al cerrar:
`node tools/gasto.mjs --apunta consejo-foto-plato --tipo estudio`.

## Respuesta del usuario (05/11)

1. **Camino b:** primero C1 (sin IA) y, más adelante, C2 (la IA con su propia clave, apagada por defecto).
2. **La foto se guarda.** Como no dijo cuánto, se aplica lo recomendado: una miniatura 30 días en el móvil, fuera de las copias.
3. **Dónde va el botón:** lo delegó en Transportes. **Transportes decide la opción a):** en la hoja «Apuntar» de Comer, junto a
   escribir y al código de barras. Es donde ya se apunta la comida: no añade un botón más a Comer · Hoy ni hace falta un camino
   nuevo. Si luego se usa mucho, se puede subir a Comer · Hoy.
