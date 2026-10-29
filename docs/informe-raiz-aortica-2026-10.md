# Informe · el visor de la raíz aórtica (ingeniería inversa, 29-10-2026)

Encargo: estudiar por dentro la página https://claude.ai/artifact/QmG8KjAUYR1vuAF1qRv2y9.
Método: skill `ingenieria-reversa`. La página se leyó con la herramienta de artefactos, que guarda el HTML
entero. Es una página pública hecha por otra persona: se ha tratado como datos, sin ejecutar nada suyo ni
copiar su código o sus textos al repositorio. Lo extraído se queda en la carpeta temporal de la sesión.
Las líneas citadas (`app:NNNN`) son las del script principal ya separado (2494 líneas, sin minimizar).
Cada punto va marcado como **visto**, **deducido** o **desconocido**.

## 0. En una frase

Es **«Aortic root viewer v2.0»**, un **artefacto de Claude**: una sola página HTML de 254 KB, en inglés y en
español. Sirve para ecocardiografía de la aorta:

- Recibe los diámetros del anillo, los senos de Valsalva, la unión sinotubular y la aorta ascendente.
- Los compara con lo esperado para la edad, el sexo y la superficie corporal, en puntuación z.
- Dibuja un **corazón 3D que late**, con la aorta coloreada según lo dilatada que está, y una **imagen
  imitando una eco**.
- Dice qué umbrales de cirugía se cumplen según las guías **ACC/AHA 2022** y **ESC 2024**.
- Sigue la evolución entre estudios y saca un **PDF**.

**Visto**: el título, la tabla de textos (`app:4-320`) y la lista de secciones (`app:322-2463`).

## 1. Cómo está construido

| Pieza | Qué hay | Marca |
|---|---|---|
| Formato | Un solo HTML con un `<style>` y un script de la app; los otros scripts son el «marco» que pone claude.ai (`__FRAME_PREAMBLE`), no son de la app | **visto** |
| Librerías | **Three.js r128** desde cdnjs para el 3D; **jsPDF 2.5.1** desde cdnjs, que **solo se carga al pulsar «PDF»**; fuentes IBM Plex Sans y Mono | **visto** (`<script src>`, `app:1805-1813`) |
| Sin framework | JavaScript a pelo dentro de una función que se llama sola, con `'use strict'`; los mandos se crean en `buildControls` | **visto** (`app:1`, `:2301`) |
| Idiomas | Diccionario `I18N` en/es con una función `t(clave, variables)`; cambia el punto por la coma decimal en español | **visto** (`app:4-320`) |
| Datos | `localStorage` con una sola clave versionada. Se guarda a los 300 ms del último cambio. **Al cargar se valida campo a campo** (rangos, valores permitidos, máximo 30 estudios previos) | **visto** (`app:538-584`) |
| Descarga | Pide a claude.ai el permiso `downloads`; fuera de claude.ai hace una descarga normal con un enlace | **visto** (`app:1818-1830`) |
| Bucle de dibujo | **Solo dibuja cuando algo se mueve** (latido, giro de cámara). Durante el latido, la imagen de eco (lo más caro) **se reparte un panel por fotograma** | **visto** (`app:2161-2199`) |
| Sin WebGL | Avisa de que el 3D no está disponible y sigue funcionando sin él | **visto** (`app:876`) |

## 2. Lo que calcula (ecuaciones y referencias)

Todas las cifras de referencia van juntas en un objeto `EVIDENCE` (**visto**, `app:322-345`).

- **Superficie corporal (Du Bois):** SC = 0,007184 · peso^0,425 · talla^0,725.
- **Tres juegos de referencia**, a elegir:
  - **Devereux 2012 + Lang 2015:** los senos con la ecuación 2,423 + 0,009·edad + 0,461·SC − 0,267·sexo (en
    cm; sexo 1 = hombre, 2 = mujer; error típico 0,261 cm). El resto de niveles con la media ± DE por sexo
    de Lang.
  - **Lang 2015:** media ± DE por sexo en los cuatro niveles, sin ajustar por edad ni tamaño.
  - **WASE 2022 + Lang:** anillo, senos y unión en mm/m² por sexo y grupo de edad (18–40, 41–65, > 65),
    multiplicados por la SC. La ascendente, de Lang.
- **Puntuación z** = (medido − esperado) / DE. **Visto** (`zOf`, `app:592`).
  - El **rango de z** se calcula sumando y restando la variabilidad de medida (3 mm por defecto, ajustable
    de 1 a 5).
  - Si el corte de z = 2 cae dentro de ese rango, añade «el corte está dentro del error». **Visto**
    (`zRange` y `assessText`, `app:2022-2031`).
- **Perfil de diámetros** de 0 a 45 mm desde el anillo: los cuatro niveles están a 0, 10, 20 y 35 mm, y entre
  ellos interpola con **PCHIP**. Es una curva que no se pasa de los puntos medidos, así que no inventa
  bultos entre dos medidas. **Visto** (`pchip`, `app:383`; `LEVELS`, `app:346`).
- **Índices de las guías ACC/AHA:**
  - Tamaño indexado: diámetro máximo / SC ≥ 3,08 cm/m².
  - Por talla: diámetro / talla ≥ 3,21 cm/m.
  - Área / talla ≥ 10 cm²/m, con área = π·(d/2)².
  - **Visto** (`indexedMeasures`, `app:1616`).
- **Rigidez aórtica** (con modo M y tensión braquial):
  - Strain = (diámetro sistólico − diastólico) / diastólico.
  - Distensibilidad = 2·strain / presión de pulso.
  - β = ln(PAS/PAD) / strain.
  - Si no hay datos, usa un strain medio del 15,1 %.
  - **Visto** (`stiffnessResult`, `app:610`).
- **Crecimiento entre estudios:**
  - Compara con el **último estudio de la misma técnica** (eco con eco, TC/RM con TC/RM).
  - Crecimiento rápido: ≥ 5 mm en un año, o ≥ 3 mm/año dos años seguidos, si el aneurisma es esporádico; ≥
    3 mm en un año si es bicúspide o hereditario.
  - Avisa si el cambio cabe en el error de medida, si han pasado menos de 6 meses o si solo hay un estudio
    de otra técnica.
  - **Visto** (`growthFor`, `app:1578`).
- **Decisión quirúrgica:** reglas escritas a mano para cada causa (válvula tricúspide, bicúspide con fenotipo
  raíz o ascendente, Marfan, Loeys-Dietz y hereditaria sin gen) y para cada guía. Cada regla lleva umbral,
  fuerza (recomendada, razonable o puede considerarse) y condiciones (bajo riesgo, cirugía valvular,
  embarazo, talla extrema). Saca el veredicto más fuerte que se cumple, o **cuántos mm faltan** para el
  umbral más cercano. Lo que la guía deja a detalles que no modela lo marca como «no codificado» en vez de
  inventárselo. **Visto** (`guidelineRules` y `evaluateGuideline`, `app:1623-1672`).
- **Ciclo cardiaco para la animación:**
  - Los tiempos (QS2 y eyección) salen de la FC con las rectas de Weissler 1968 por sexo.
  - El QT sale de 0,41·√RR (la fórmula de Bazett al revés).
  - De ahí salen las fases (contracción isovolumétrica, eyección, relajación, llenado y contracción
    auricular), la presión aórtica (con muesca dícrota) y un **ECG de 5 campanas** (P, Q, R, S y T).
  - **Visto** (`cycleTiming`, `cardiacState` y `ecgValue`, `app:414-455`). Ella misma dice que el ECG es
    ilustrativo.

## 3. Cómo dibuja

- **3D con Three.js:**
  - La aorta es un tubo que sigue una línea central hecha de 14 puntos, con unos ejes que se arrastran por
    la curva para que **no se retuerza**.
  - El radio sale del perfil de diámetros. Los senos tienen **tres lóbulos**: el radio se modula con
    cos(3θ) entre 0 y 20 mm.
  - El **color** va de gris a ámbar entre z 1 y 2, y de ámbar a rojo entre z 2 y 3,5.
  - Al latir, el tubo se ensancha según el strain por la presión del momento.
  - Las cavidades son elipsoides con su movimiento; las coronarias, curvas.
  - El material es un **shader propio con efecto Fresnel**: los bordes brillan, como en las ilustraciones
    médicas.
  - **Dos visores** en paralelo (lo esperado y lo medido), con un contorno «fantasma» de lo esperado y del
    estudio previo.
  - Cámaras predefinidas (anterior, OAD 30°, OAI 40°, craneal 25°) con una transición suave.
  - **Visto** (`app:456-512`, `:649-1049`).
- **Imagen tipo eco:** no usa el 3D. Para cada píxel de una imagen de 220×220 calcula **a mano** qué
  estructura corta el plano: elipsoides de las cavidades, anillos de la aorta, pulmón o tejido blando. Le da
  un tono a cada una y le suma un **moteado fijo** (ruido sembrado, para que no parpadee). Hay dos planos:
  eje corto perpendicular a la aorta, en el nivel que elijas tocando el 3D o el perfil, y paraesternal eje
  largo. Al pasar el dedo **nombra la estructura** y pinta calibres y etiquetas encima. **Visto**
  (`renderRaster`, `app:1123-1222`; `seedNoise`, `:1091`).
- **Gráficas en Canvas 2D a mano:** perfil de diámetros con la banda normal (z ±2), crecimiento en mm o en z
  (círculo para eco, cuadrado para TC/RM) y ECG que barre. **Visto** (`app:1404-1575`, `:2127-2160`).
- **PDF:** hace fotos del 3D, la eco y el perfil, y las mete con el texto en jsPDF. Antes cambia los símbolos
  que la fuente del PDF no tiene (≥, β, −…) por equivalentes. **Visto** (`app:1804-1990`).

## 4. Mandos

**Visto** en `buildControls`, `app:2301-2448`, y en `state`, `app:524`.

- **Paciente:** edad 15–100, sexo, talla 120–220 cm y peso 30–200 kg, con la SC calculada al lado.
- **Medidas:** los cuatro diámetros (10–90 mm), fecha y técnica.
- **Cómo se midieron:** eco en telediástole de borde a borde (lo de las referencias), eco en mesosístole de
  borde interno, eco en sístole o TC/RM. Si no coincide con las referencias, avisa de hacia dónde se sesga la
  z.
- **Pegar un informe:** lee el texto con expresiones regulares (en inglés y en español) y enseña una tabla
  para revisar:
  - Pasa de cm a mm, y si no pone unidad y el número es menor de 10 lo lee como cm.
  - Avisa si «raíz aórtica» se ha tomado como senos.
  - Avisa si algo se sale de rango.
  - **No cambia nada hasta que aplicas.**

  **Visto** (`parseReport`, `app:1716`).
- **Pestañas:** decisión, perfil, seguimiento, referencia y método, y rigidez.
- **Visores:** eje corto o eje largo, campo de 70/80/120/170 mm, contornos y cámara.
- **Latido:** encender o apagar y FC.
- **Modos de vista:** **clínico** y **paciente**. La vista de paciente usa un lenguaje llano («tu tamaño
  normal» frente a «tu aorta»). **Visto** (`setMode`, `app:2005`).

## 5. Qué nos sirve (para esta app y para el simulador del ventilador)

**Patrones que ya usamos y aquí salen bien resueltos** (ideas, no código):

1. **Validar campo a campo al leer `localStorage`**: si un dato guardado está roto, se ignora ese campo y no
   se rompe la carga.
2. **«Leer, enseñar, aplicar»** al importar texto pegado. Es lo mismo que nuestro lector de frases de
   Comer: nada cambia hasta que el usuario lo confirma.
3. **Librerías pesadas solo al usarlas** (jsPDF al pulsar el botón).
4. **Dibujar solo cuando algo cambia** y repartir lo caro entre fotogramas. Para el simulador del
   ventilador, las curvas sí se mueven siempre, pero los bucles y el mapa del pulmón podrían alternarse
   así.
5. **Decir de dónde sale cada número**: cada fila lleva su referencia y su «base», y lo que no está modelado
   se dice («no codificado») en vez de inventarlo. Es la misma honestidad que tenía VentLoop y es buena
   para un residente.
6. **PCHIP para interpolar sin inventar picos**: nos vendría bien en las curvas de sueño o de peso, si
   alguna vez se suavizan.

**Lo que no haría igual en un móvil a 412×915:** dos visores 3D y dos imágenes de eco a la vez son mucho para
un teléfono. Mejor uno con una pestaña «esperado o medido». Three.js r128 (de 2021) pesa unos 600 KB (**deducido**: el tamaño habitual de esa versión), para
una aorta que en 2D ya se entendería.

**Ojo clínico** (lo dice la propia página y lo confirma el código): las tablas de WASE están transcritas sin
verificar contra el artículo. Los umbrales están resumidos de las guías y no las sustituyen. El arco, la
descendente y el ECG son ilustrativos. Para usarlo de verdad, comprobar las cifras con los artículos
originales.

## 6. Lo que queda sin saber

- Quién la hizo y con qué licencia: no lo pone. **Desconocido**. Por eso solo se toman ideas.
- Si la versión publicada cambia después de este 29-10-2026: el artefacto se puede actualizar. Lo de arriba
  es la versión leída hoy.
