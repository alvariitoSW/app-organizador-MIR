# Concurso «La Rara» · Portada de Dinero + Ahorro · bases (28/10/2026)

Convocan Educación y Artes Visuales + Ciencia. Gana «el más extraño». Entran **Portada de Dinero + Ahorro** (Compras y
«En qué se me va», 5/5, no entran: la portada solo lleva a ellas). No se repite lo probado: filas con flecha, barras de
progreso, tarjetas oscuras, la piel de `comun.css` (dinero-final.html, 4/5; invertir «meh»).

## 1. Reglas fijas (romper una = fuera)
1. **Datos inventados**: solo las cifras de abajo. Nada de nombres reales ni del usuario. Nada de «cuánto me queda» ni saldo de hoy.
2. **Un solo archivo HTML** en `maquetas/`, sin librerías ni recursos externos (ni fuentes web). SVG y Canvas en línea, sí. JS en línea para tocar, sin guardar nada.
3. **412 px de ancho** (`body{width:412px;margin:0}`), nada se sale. **Portada ≤915 px de alto** (una pantalla); Ahorro libre pero sin pasar de 1.300 px.
4. Dos pantallas, una debajo de otra, con rótulo pequeño encima: «Pantalla 1 · Portada», «Pantalla 2 · Ahorro». Encima de todo, un cartel con el nombre de la escuela y 2 líneas de la idea.
5. **Accesible**: contraste AA (4,5:1 en texto), todo lo que se toca ≥44 px de alto, nada se distingue solo por color (forma, texto o icono además), SVG con `<title>` o `aria-label`.
6. **Español llano**, sin jerga (si hace falta un término, se explica en media frase).
7. **5 segundos tras una guardia**: mirando la portada se sabe (a) cómo va el colchón frente al objetivo y (b) qué hacer este mes. Números grandes solo para eso.
8. **La portada lleva a Ahorro, a Gastos («En qué se me va») y a Compras («Lo que quiero comprar»)**, con tres sitios tocables claros. Ahorro se abre de verdad (salta a la pantalla 2); Gastos y Compras pueden ser un aviso «aquí se abre…».
9. **Ayuda a ahorrar de verdad**: la pantalla Ahorro dice cuánto apartar al mes, para qué fecha, y si al ritmo actual llega. Con la evolución mes a mes del colchón, a su manera.
10. **Libre todo lo demás**: paleta, tipografía (del sistema o genéricas: serif, monospace, cursive…), forma, metáfora, tono. Invertir: opcional, como mucho una línea.

**Cifras comunes (todas las maquetas cuentan lo mismo):** nóminas netas cobradas el 25: jun 1.350 · jul 1.600 · ago 2.450
· sep 3.100 · oct 2.800 € (base ~1.350; el resto, guardias). Fijos 728 €/mes (alquiler 550, luz+agua 60, móvil+internet 35,
gimnasio 40, Spotify/Netflix 18, seguro 25). Variables de octubre 750 € (súper 230, comer fuera 180, taxis 90, online 140,
ocio 110). **Gasto normal ≈ 1.478 €/mes.** Colchón (cuenta de ahorro) a fin de mes: may 2.200 · jun 2.200 · jul 2.300 ·
ago 2.750 · sep 3.550 · oct **4.200 € = 2,8 meses de vida**. **Objetivo: 6 meses (≈8.870 €) para octubre de 2027 →
aparta ~390 €/mes.** Ritmo de los últimos 3 meses ~650 €/mes → llegarías hacia **junio de 2027** (vas por delante).
Compras deseadas: portátil 1.100 €, fonendo 190 €, viaje a Japón 2.500 € (verano), curso de eco 350 €.
Gasto que más se puede recortar (del puesto 3): comer fuera, 180 €/mes.
## 2. Los seis concursantes (opuestos entre sí y a todo lo probado)
| n | Escuela | Modelo | Archivo |
|---|---|---|---|
| 1 | La Marea | sonnet | `maquetas/dinero-rara-1-marea.html` |
| 2 | Teletexto | haiku | `maquetas/dinero-rara-2-teletexto.html` |
| 3 | El Tablero | sonnet | `maquetas/dinero-rara-3-tablero.html` |
| 4 | Cartas del Futuro | haiku | `maquetas/dinero-rara-4-cartas.html` |
| 5 | Cianotipia | sonnet | `maquetas/dinero-rara-5-cianotipia.html` |
| 6 | La Alacena | haiku | `maquetas/dinero-rara-6-alacena.html` |

Opuestos: orgánico (1) / electrónico (2); juego ruidoso (3) / intimidad escrita (4); cielo frío (5) / cocina cálida (6).
## 3. Cómo se elige al ganador «más extraño»
**Paso 1 · Oficio (Ciencia, Playwright a 412×915):** sin errores de JS, nada fuera del ancho, portada ≤915 px,
tocables ≥44 px, la portada abre Ahorro. Si falla: un arreglo por el mismo modelo; si vuelve a fallar, fuera.
**Paso 2 · Filtro «¿sigue sirviendo para ahorrar?» (sí/no; un «no» descalifica):**
  a) en la portada, en 5 s, se ve 2,8 de 6 meses (o 4.200 de 8.870 €) y que vas por delante;
  b) Ahorro dice «~390 €/mes hasta octubre de 2027» y si llegas a tu ritmo;
  c) se ve la evolución may→oct del colchón; d) las cifras cuadran con las comunes; e) Gastos y Compras se alcanzan.
**Paso 3 · Rareza (jurado haiku, a ciegas).** Quien preside copia los HTML como `X1…X6` en orden barajado, quita el cartel
y el `<title>`, y el jurado los lee enteros (y ve una captura de cada pantalla). Puntúa 0-10:
  - **Distancia a una app de finanzas normal** (0-4): ¿podría confundirse con un banco o con Fintonic? 0 = igual; 4 = nadie lo diría.
  - **Originalidad de la metáfora** (0-3): ¿se había visto antes en finanzas? ¿lo inventa o lo toma prestado?
  - **Sorpresa coherente** (0-3): ¿hay algo que no esperabas y que, aun así, cuenta el ahorro (no adorno)?
  El jurado escribe una línea por maqueta («lo más raro es…») y desempata por «Sorpresa».
**Paso 4 · Última palabra: el gobierno central.** Ve las seis en el escaparate (artifact «Feria de Dinero», nueva
versión) con su rareza del jurado, y pone nota 1-5 y comentario. **Gana la de más rareza entre las que el gobierno
central puntúe ≥3**; si él señala otra como ganadora, manda él. Lo que se aprenda pasa al modelo final; nada se construye
en `app.js` sin su visto bueno.
## 4. El encargo exacto (párrafo común + el de cada uno; listo para copiar)
**Común (va delante del de cada uno):**
> Concurso «La Rara» de maquetas de Dinero para una app de móvil (médico residente con guardias, móvil de 412×915). Gana
> la propuesta MÁS EXTRAÑA que siga sirviendo para ahorrar: no hagas una app de finanzas; haz el mundo que te toca, sin
> miedo, y que cada número tenga su sitio dentro de ese mundo. Lee antes (son cortos) las bases
> `/tmp/claude-0/-home-user-app-organizador-MIR/1e9b419f-1056-5961-94ce-69c8b7c25a6b/scratchpad/bases.md` (secciones 1 y
> 3: reglas fijas, cifras comunes y cómo se juzga) y el encargo de la feria
> `/tmp/claude-0/-home-user-app-organizador-MIR/1e9b419f-1056-5961-94ce-69c8b7c25a6b/scratchpad/brief.md` (lo que quiere el
> usuario; IGNORA su parte de `comun.css`, el nombre de archivo y la entrega). No mires las otras maquetas de dinero ni
> `app.js`: queremos algo que no se parezca a nada. Prohibido: filas con flecha, barras de progreso, tarjetas oscuras,
> la piel de la app, librerías o fuentes externas. Haz UN archivo con la Pantalla 1 · Portada (≤915 px de alto) y la
> Pantalla 2 · Ahorro (≤1.300 px). Antes de entregar, comprueba que todo cuadra con las cifras comunes. No toques ningún
> otro archivo. Entrega (≤8 líneas): archivo, la idea en 2 líneas, qué hay en cada pantalla, qué dato nuevo pediría.

**1 · La Marea (sonnet) → `maquetas/dinero-rara-1-marea.html`.** Tu ahorro es el agua de un charco de marea en la costa
canaria, visto desde arriba en acuarela (arena, basalto negro de borde, azules turquesa; serif fina, mucho aire, formas
blandas sin una sola esquina recta). Portada: el charco; el nivel del agua son los meses de vida (marcas talladas en la
roca: 1, 2… 6 meses), la «pleamar» marcada en la roca es el objetivo, y una línea dice qué hacer («este mes, sube 390 €»).
Por las grietas de la roca se escapa el agua: tocar la grieta grande lleva a Gastos (comer fuera, 180 €). Barquitos en el
horizonte son las Compras (tocar → Compras). Ahorro: una «tabla de mareas» dibujada a mano con la altura del agua de
mayo a octubre y la previsión hasta la pleamar de octubre de 2027 («a tu ritmo, pleamar en junio»).
**2 · Teletexto (haiku) → `maquetas/dinero-rara-2-teletexto.html`.** El dinero como una emisión de teletexto de los 80:
fondo negro, solo los 8 colores puros del teletexto (blanco, amarillo, cian, verde, magenta, rojo, azul), letra
monospace grande en mayúsculas, dibujos hechos con bloques de caracteres (█ ▀ ▄), página numerada arriba
(«P300 DINERO 25 OCT»). Portada (P300): un titular de última hora («EL COLCHÓN LLEGA A 2,8 MESES») + el índice de páginas
como en la tele: «301 AHORRO · 302 EN QUÉ SE ME VA · 303 LO QUE QUIERO COMPRAR» (cada una, botón de ≥44 px). Ahorro (P301):
la «previsión del tiempo» del colchón: un mapa de bloques mes a mes (may→oct) y el pronóstico hasta OCT 2027 con «APARTA
390 €/MES», y un teletipo de noticias. Contraste alto; nada de color sin texto al lado.
**3 · El Tablero (sonnet) → `maquetas/dinero-rara-3-tablero.html`.** Ahorrar es un juego de la oca impreso en cartón:
colores primarios planos (rojo, amarillo, azul, verde sobre crema), tipografía redonda y gruesa, casillas en espiral
dibujadas en SVG. Cada casilla vale 148 € (una décima de mes de vida): 60 casillas = 6 meses = meta, la casilla final se
llama «Octubre 2027». Tu ficha está en la 28. Portada: el tablero entero en la pantalla; la ficha, la meta, y «esta
tirada: avanza 3 casillas (390 €)». Casillas especiales tocables: «El pozo» (Gastos), «La tienda» (Compras) y la propia
ficha (Ahorro). Ahorro: el historial de tiradas de mayo a octubre (cuántas casillas avanzó cada 25) y la cuenta de
tiradas que faltan («a tu ritmo, llegas en junio»).
**4 · Cartas del Futuro (haiku) → `maquetas/dinero-rara-4-cartas.html`.** El ahorro no se ve: se lee. Te escribe una
carta «tú, en octubre de 2027». Papel crema con renglones, letra cursive del sistema para la carta y serif para lo
demás, sello de correos y matasellos dibujados en SVG, tinta azul y sepia. Portada: un sobre abierto con la carta corta
(«Querido yo: tengo 6 meses de colchón porque cada 25 apartaste 390 €. Hoy vas por 2,8. Vas antes de lo previsto») +
tres posdatas tocables: «P.D. Lo de comer fuera…» (Gastos), «P.D. El portátil…» (Compras), «Ver todas las cartas»
(Ahorro). Ahorro: el fajo de cartas de mayo a octubre, una por mes, apiladas con la cifra del colchón en el matasellos;
y un «responder» donde eliges plazo (6/12/18 meses) y la carta futura cambia la cifra a apartar.
**5 · Cianotipia (sonnet) → `maquetas/dinero-rara-5-cianotipia.html`.** Tu ahorro es una constelación que se va
encendiendo, impresa como una cianotipia (azul de Prusia profundo, todo en blanco y azul claro, aspecto de plano técnico
antiguo; letra monospace fina y rótulos de carta celeste en serif). Cada 100 € apartados es una estrella: hay 89 puntos
en la constelación «La Hamaca» (8.870 €) y 42 encendidos. Portada: la constelación en grande, «42 de 89 estrellas · 2,8
de 6 meses», y «este mes enciende 4 (390 €)». Una nube que tapa estrellas = Gastos (tocar); planetas que cruzan = Compras
(tocar). Ahorro: el cuaderno de observación: cuántas estrellas se encendieron cada mes (may→oct) en un diagrama de cielo,
y la fecha en que se completa la figura. Nada de tarjetas: todo dibujado sobre el mismo papel azul.
**6 · La Alacena (haiku) → `maquetas/dinero-rara-6-alacena.html`.** Ahorrar es hacer conservas para el invierno: una
alacena de madera vista de frente, con seis tarros de cristal (uno por mes de vida) en estantes. Ilustración plana de
etiqueta antigua: mostaza, tomate, verde oliva sobre crema; tipografía slab (serif gruesa) en las etiquetas. Dos tarros
llenos, el tercero casi (2,8), tres vacíos con su etiqueta escrita («mes 6 · oct 2027»). Portada: la alacena + «este mes,
llena 390 € del tarro 3». El grifo que gotea = Gastos (comer fuera, 180 €/mes); la lista de la compra con imán en la
nevera = Compras; tocar un tarro = Ahorro. Ahorro: el libro de recetas de la casa: cada 25 de mayo a octubre, cuánto se
echó al tarro, y la receta para llenar los seis («390 € al mes durante 12 meses; a tu ritmo, en junio»).
