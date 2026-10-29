# Webs y apps médicas · recopilación por temas

La lista de las webs y apps médicas que me has pasado, ordenada por temas, con lo que se sabe de cada una.
Cuando pases otra, se añade aquí en su tema (y, si se estudia, con su informe en `docs/`).

Leyenda:
- 🔎 **estudiada** (hay informe con lo visto por dentro).
- 📌 **guardada** (solo el enlace).
- 🧑‍💻 **tuya** (un repositorio de tu GitHub: sale el nombre, no lo he abierto).

Última revisión: 29-10-2026.

---

## Medicina intensiva · ventilación mecánica

| | Qué es | Enlace | Informe |
|---|---|---|---|
| 🔎 | **VentLoop** (Node Field, Japón, 2026). Simulador de ventilación con 30 casos guiados. Modos VC, PC y PSV; pulmón de 64 unidades que se abren y se cierran; pared torácica, esfuerzo del paciente, gases y circulación; curvas y bucles P-V y F-V; alarmas. La consola completa pide cuenta. | https://ventilation.nodefield.jp/ · página del modelo: https://ventilation.nodefield.jp/model/ · casos: https://ventilation.nodefield.jp/features/ | `docs/informe-ventilador-2026-10.md` |
| 🧑‍💻 | `simulador-UCI-` | https://github.com/alvariitoSW/simulador-UCI- | — |
| 🧑‍💻 | `simulador-uci-3d` | https://github.com/alvariitoSW/simulador-uci-3d | — |

Idea pendiente: un simulador de ventilación propio para residente (en el plan, «Ideas», 2026-10-29).

## Cardiología · imagen cardiaca

| | Qué es | Enlace | Informe |
|---|---|---|---|
| 🔎 | **«CCU fácil: shock cardiogénico e Impella, a partir de casos»** (Antaa Slide; Dr. Yuta Tsunemi, cardiólogo, Sapporo Heart Center; 62 diapositivas en japonés, de 2026, públicas sin cuenta). Clase para residentes. Ver el resumen más abajo. | https://slide.antaa.jp/article/view/36d48129555d4a33 | el resumen de abajo |
| 🔎 | **Aortic root viewer v2.0** (artefacto público de Claude, autor desconocido). Calcula la z de anillo, senos, unión sinotubular y aorta ascendente (Devereux, Lang y WASE); índices, rigidez y crecimiento entre estudios; umbrales quirúrgicos ACC/AHA 2022 y ESC 2024; corazón 3D que late, imagen tipo eco y PDF. En inglés y en español. | https://claude.ai/artifact/QmG8KjAUYR1vuAF1qRv2y9 | `docs/informe-raiz-aortica-2026-10.md` |

### Resumen · shock cardiogénico e Impella (revisada el 29-10-2026)

Lo que enseña (resumido con mis palabras, no traducido literal):

- **Qué hace el Impella:** a la vez **impulsa** sangre del ventrículo izquierdo a la aorta y **descarga** el
  ventrículo (baja el volumen y la presión telediastólica, y con ellos el consumo de O₂).
  - La VA-ECMO impulsa la sangre pero **no descarga**: le sube la poscarga al ventrículo.
  - Por eso, si con ECMO el ventrículo se distiende, se añade un Impella (**ECPELLA**).
  - Lo explica con el **bucle presión-volumen**: el Impella reduce el área del bucle y la ECMO la aumenta.
- **Comparación con las otras asistencias:**
  - El **BCIA** da el 10–20 % del gasto.
  - La **VA-ECMO** sostiene todo el gasto y oxigena.
  - El **Impella** da 2,5, 3,7 o 5,5 L/min según el modelo, pero no oxigena, no sirve en parada y es malo
    para el fallo derecho.
- **Ensayos:**
  - Neutros: IABP-SHOCK II, ECLS-SHOCK, ECMO-CS e IMPRESS.
  - **DanGer Shock** (NEJM 2024), con IAMCEST en shock, sin coma tras parada extrahospitalaria: la mortalidad a
    180 días baja del 58,5 % al 45,8 % (NNT ≈ 8). A cambio, las complicaciones graves pasan del 6,2 % al 24 % y
    hay más diálisis.
  - STEMI-DTU (descargar 30 min antes de la angioplastia sin shock): no reduce el infarto.
  - CHIP-BCIS3 (angioplastia de alto riesgo programada): sin beneficio.
  - Guía ACC/AHA 2025: Impella clase 2a en pacientes seleccionados y BCIA de rutina clase 3.
- **A quién ponérselo, tres preguntas:**
  - ¿La causa es el ventrículo izquierdo?
  - ¿Hay hipoperfusión? (lactato, oliguria, frialdad, confusión)
  - ¿Se puede salvar el cerebro?

  Contraindicaciones: prótesis mecánica aórtica o insuficiencia aórtica moderada o mayor. Hay que mirar antes
  trombo en el VI, la estenosis aórtica y el ventrículo derecho.
- **Clasificación SCAI A–E** de gravedad del shock, con qué mirar en cada estadio. Entre B y C, lo que decide
  es la hipoperfusión, no la tensión.
- **Tres casos:**
  - Shock con ascenso del ST en aVR (tronco o multivaso): Impella antes de la angioplastia.
  - Parada con VA-ECMO y ventrículo distendido: ECPELLA, vigilando el síndrome norte-sur con gasometría del
    brazo derecho.
  - Succión repetida en un infarto del ventrículo derecho: el fallo es derecho (PVC alta, PAPi 0,56), y el
    tratamiento es VA-ECMO, volumen e inotrópicos.
- **Manejo:**
  - Tres ondas en la consola.
  - Ante la succión, revisar en este orden: precarga → corazón derecho → posición, sin subir la potencia
    (nivel P).
  - Posición: entrada a 3,5 cm de la válvula aórtica, comprobada por eco.
  - Purga continua.
  - Retirada bajando el nivel P de 1 en 1 o de 2 en 2, hasta comprobar que se mantiene estable en P2.

**¿Nos sirve?**
- **Para estudiar en la rotación de UCI o coronarias:** sí. Es una clase muy actual (2026) y con todas las
  referencias. Para el MIR va más allá de lo que se pregunta, aunque el shock cardiogénico, el BCIA, la ECMO
  y la SCAI sí entran.
- **Para un simulador propio:** da el **guion de un módulo de shock** (tres casos con pregunta, decisión y
  evolución) y la idea del **bucle P-V con y sin asistencia**. Encaja con el simulador de ventilación (que
  ya tenía circulación) y con tus repositorios `simulador-UCI-`.
- **Para esta app:** no directamente. Como mucho, un enlace de «material de la rotación».
- Las cifras de los ensayos son las de la presentación; antes de citarlas, mirar el artículo original. El
  autor avisa de que algunos datos vienen de charlas patrocinadas por el fabricante.

## Urgencias · hematología y oncología (fiebre neutropénica)

| | Qué es | Enlace | Informe |
|---|---|---|---|
| 🧑‍💻 | `fiebres-neutropenias`. De aquí se copió el «gobierno» y el medidor de gasto de esta app. | https://github.com/alvariitoSW/fiebres-neutropenias | — |
| 🧑‍💻 | `urgencias-fiebre-neutropenica` | https://github.com/alvariitoSW/urgencias-fiebre-neutropenica | — |
| 🧑‍💻 | `sobreviviendo_a_urgencias_en_el_Negrin` (privado) | https://github.com/alvariitoSW/sobreviviendo_a_urgencias_en_el_Negrin | — |

## Estudio MIR

| | Qué es | Enlace | Informe |
|---|---|---|---|
| 📌 | **Mi temario**. La app del temario que se conecta con esta por dos JSON (`temario.json` y `progreso.json`). La dirección sale como ejemplo en el contrato. | https://alvariitosw.github.io/mi-temario/ | `docs/CONTRATO-TEMARIO.md` |

## Organización de guardias

| | Qué es | Enlace | Informe |
|---|---|---|---|
| 🧑‍💻 | `generador-guardias` | https://github.com/alvariitoSW/generador-guardias | — |
| 🧑‍💻 | `guardias-umi` | https://github.com/alvariitoSW/guardias-umi | — |
| 🧑‍💻 | Esta app (Guardias · rotación y cocina) | https://github.com/alvariitoSW/app-organizador-MIR | — |

## Nutrición (relacionado: las fuentes que se estudiaron para Comer)

| | Qué es | Enlace | Informe |
|---|---|---|---|
| 🔎 | **Open Food Facts**: base abierta de productos (código de barras, nutrientes, Nutri-Score, NOVA) | https://world.openfoodfacts.org/ | `docs/DECISIONS.md`, «Comer: estudio de fuentes de alimentación» (2026-10-26) |
| 🔎 | **USDA FoodData Central**: base de alimentos de EE. UU. con raciones | https://fdc.nal.usda.gov/ | la misma entrada |
| 🔎 | **OpenNutriTracker** (código abierto, GPLv3) | https://github.com/simonoppowa/OpenNutriTracker | la misma entrada |
| 🔎 | **FitBook** (código abierto, MIT) | https://github.com/brandonp2412/FitBook | la misma entrada |
| 🧑‍💻 | `factores_riesgo_obesidad` | https://github.com/alvariitoSW/factores_riesgo_obesidad | — |

---

## Cómo se guardan

- Aquí van **el enlace, la fecha y el resumen**, y el estudio va en su informe.
- **No se guarda una copia del código ni de los textos** de las webs ajenas en el repositorio: no son nuestros
  y no traen licencia libre.
- Una web puede cambiar o desaparecer. Si una importa de verdad, guárdala tú en el navegador («Guardar página
  como…»); el informe recoge lo que había el día que se estudió.
