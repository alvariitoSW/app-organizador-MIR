# Ficha · La Reforma · R5 · Maqueta de Comer

Acta `consejo/2026-10-29-2.md` (asuntos 6, 6b, 7, 8; acuerdos 6, 7, 9). **Una sola maqueta, sin concurso** (acuerdo 9); el
Consejo la aprueba por delegación (`gobierno.md`). Sin tocar `app.js`. Presupuesto ~1,5 M (opus dirige, sonnet maqueta).
La maqueta es la que construyen R6 (compra base + congelador), R7 (proteína en Hoy) y R8 (TikTok y página de receta).

## 1. Qué y para qué
- **H1 · Compra base.** Dado que tengo «Mi compra base» (pollo 1 kg, lomo, pescado congelado 1 kg, arroz, huevos, atún),
  cuando toco «Hacer la compra base», entonces se copia a la compra **restando lo que ya hay en la nevera**, y debajo sale
  el orden de la semana por caducidad (pollo día 1-2, lomo 3-5, pescado 4-7) con avisos neutros («antes del jueves»).
- **H2 · Congelador.** Dado que termino un lote de 6 raciones de lentejas, cuando lo marco hecho, entonces la app propone
  el reparto (p. ej. 2 nevera · 4 ❄) y yo lo confirmo o lo cambio; en la nevera se ven las raciones ❄ con «❄ 3 meses»
  y la fecha; el kilo de pescado aparece como 4 × 250 g ❄ con «saca una la noche antes».
- **H3 · Proteína en Hoy.** Dado que hoy llevo 85 de 120 g, cuando abro Hoy y faltan más de 30 g, entonces una línea:
  «🥚 85 de 120 g · te faltan 35» y una sugerencia de un toque («yogur proteico + atún · +32 g»); con 30 g o menos, nada.
  Día de guardia: «lo que se pueda», sin número rojo.
- **H4 · Página de receta.** Dado un plato con enlace de TikTok, cuando lo abro, entonces una página: foto o icono grande,
  raciones, ingredientes que se tachan al tocarlos, pasos en letra grande, «Añadir a la compra», «Ver en TikTok» (abre
  fuera, **sin vídeo incrustado**) y «Compartir» (imagen o texto, sin datos personales). Más la **cola**: pegar varios
  enlaces y pasarlos a receta de uno en uno.

## 2. Dudas (resueltas antes, por el usuario o el Consejo)
- Variantes: **una** maqueta por área (acuerdo 9; R1 fue concurso solo para Dinero, por petición expresa).
- Compartir: botón **Compartir** (imagen o texto por WhatsApp, lo manda él) — contestado el 29/10.
- TikTok → app: en Android, **compartir a la app** (`share_target`); en iPhone, pegar. En la maqueta, los dos caminos
  entran por la misma cola.

## 3. Dónde se toca (para R6-R8; mapa del 30/10, Explore haiku)
- Compra: `renderShop` 19802 (listas 20036, ticket 19962), `compraDatos` 19483, `compraCada` 4424, `tocaComprar` 4429,
  `cjeHojaCompra` 14913. Nevera: `renderNevera2` 12562, `neveraSync` 4219. Lotes: `loteCuerpoHTML` 12722, lote `b1` 151.
- Platos: `guardarPlato` 13249 (`{id,name,icon,portions,kcal,prot,carb,fat,alims,ingredients,steps}`; añadir `fuente`,
  `congela:{nevera,meses}`), `platoVacio` 13232, `recetaHTML` 11111, `renderMisPlatos` 12815. Lector TikTok 18389-18463
  (oEmbed solo para la descripción), `fbRecetaPegada` 12006.
- Proteína: `objetivoMacros` 9415, `protObj` 11128, `nutHoyHTML` 11254, `renderHoy` 7537.
- Pestañas de Comer: `renderFood` 15068 (`ui.foodVista`), Cocina `renderCocinaPanel` 12409.
- Estilo de maquetas: `maquetas/comun.css`, `maquetas/dinero-tu-mes.html` (412 de ancho, tocables ≥44 px).

## 4. Pasos
- [x] P1 Maqueta navegable `maquetas/comer-reforma.html`: 4 vistas (Compra base · Nevera y congelador con la hoja del
  reparto · Hoy con la línea de proteína · Página de receta + cola de TikTok), datos inventados, sin red · general-purpose
  sonnet · ~25 pasos
- [x] P2 Oficio a 412×915: sin errores de JS, ancho 412, tocables ≥44 px, letra ≥14 px en etiquetas, alto de cada vista;
  guion que toca: compra base → resta la nevera; terminar lote → reparto 2·4 → ❄ en la nevera; tachar un ingrediente;
  Hoy con 85/120 sale, con 100/120 no · verificador sonnet · ~12 pasos
- [x] P3 Consejo (por delegación): Sanidad (duraciones con su fuente, proteína prudente), Interior+Justicia (reutiliza lo
  de §3, nada sale del móvil, sin iframe), Hacienda (cabe en R6-R8). Aprueba o pide retoques · principal
- [x] P4 Retoques si los hay · el mismo ayudante de P1 (SendMessage) · ~8 pasos
- [ ] P5 Acta (addenda en `consejo/2026-10-29-2.md`), DECISIONS «La Reforma · R5», plan, gasto y traspaso con el prompt
  de R6 · principal

## 5. Comprobación
H1→P1,P2 · H2→P1,P2 · H3→P1,P2 · H4→P1,P2. Sin `[ACLARAR]` abiertas. Es maqueta (no toca `app.js`); medida a 412×915 (P2).
Sin capturas en el repo (solo el `.html`). Duraciones de congelado con fuente (USDA/AESAN) escrita en la maqueta.

**Gasto:** 1,0 M de ~1,5 M (principal 38 %, maqueta 26 %, mapa haiku 17 %). El mapa de §3 vale para R6-R8.
