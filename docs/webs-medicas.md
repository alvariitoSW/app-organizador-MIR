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
| 🔎 | **Aortic root viewer v2.0** (artefacto público de Claude, autor desconocido). Calcula la z de anillo, senos, unión sinotubular y aorta ascendente (Devereux, Lang y WASE); índices, rigidez y crecimiento entre estudios; umbrales quirúrgicos ACC/AHA 2022 y ESC 2024; corazón 3D que late, imagen tipo eco y PDF. En inglés y en español. | https://claude.ai/artifact/QmG8KjAUYR1vuAF1qRv2y9 | `docs/informe-raiz-aortica-2026-10.md` |

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
