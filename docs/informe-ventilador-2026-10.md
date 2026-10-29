# Informe · el simulador de ventilación VentLoop (ingeniería inversa, 29-10-2026)

Encargo: estudiar https://ventilation.nodefield.jp/ para saber qué hace y cómo funciona por dentro, pensando
en un simulador propio para un residente. Solo se ha leído la web pública: no se ha copiado su código ni sus
textos al repositorio. Lo descargado se queda en la carpeta temporal de la sesión.

Método: skill `ingenieria-reversa`. Se descargaron la portada, las páginas `/model/`, `/features/`,
`/development/`, `/faq/` y `/sales-terms/`, y los 5 archivos de código (`main`, `chrome`, `plot`,
`live-model` y `sub`). Se ordenó el código con `prettier` para poder leerlo.
Las líneas citadas (`live-model:NNNN`) son las del archivo ya ordenado, no las del original.
Cada punto va marcado como **visto**, **deducido** o **desconocido**.

## 0. En una frase

**VentLoop** (de Node Field, Japón, 2026) es un simulador de ventilación mecánica para sanitarios. Tiene 30
casos guiados y un motor fisiológico propio: el pulmón está partido en 64 trocitos que se abren y se cierran,
y hay modelos de pared torácica, esfuerzo del paciente, gases y circulación. Todo se calcula en el navegador
a pasos de 2 milisegundos.

- **Visto:** el título, la descripción y las páginas de funciones y del modelo. La propia web dice que la
  página `/model/` lleva «el mismo motor que la app».
- **Desconocido:** la consola completa de la app. Está en `vent.nodefield.jp`, pide cuenta y la red de esta
  sesión tampoco deja entrar. Lo que sigue sale del motor de muestra y de lo que la web cuenta de sí misma.

## 1. Cómo está construido

| Pieza | Qué hay | Marca |
|---|---|---|
| Empaquetado | Archivos con huella en el nombre (`main-DxyrA2_1.js`), `modulepreload` y el ayudante `__publicField` típico de esbuild | **deducido**: Vite |
| Librerías | Ninguna de gráficas ni de interfaz: solo dos fuentes de Google (Barlow Semi Condensed y Zen Kaku Gothic New) | **visto** (`index.html`) |
| Dibujo | **Canvas 2D a mano.** `plot.js` (1,4 KB) tiene cinco funciones: ajustar el lienzo a la densidad de la pantalla (máximo ×2), pasar de valores a píxeles, cuadrícula, trazo y texto, más un punto | **visto** (`plot:1-65`) |
| Bucle | `requestAnimationFrame`. En cada fotograma avanza el tiempo real que ha pasado (como mucho 0,25 s de golpe). Se para si el panel no se ve (`IntersectionObserver`) o si la pestaña está oculta, y no se anima si el sistema pide menos movimiento | **visto** (`live-model:4600-4664`; lo de menos movimiento, `prefers-reduced-motion` en `chrome:31`) |
| Paso de cálculo | **Fijo, de 2 ms** (500 pasos por segundo). Un avance largo se trocea en pasos de 2 ms | **visto** (`live-model:989`, `advance` en `:2618`) |
| Grabación | Guarda 8 canales a **100 Hz**: presión en vía aérea, flujo, volumen, presión esofágica, transpulmonar, CO₂, presión muscular y alveolar. Lo hace en un búfer que se puede guardar en JSON | **visto** (`live-model:743-860`, `:989`) |
| Azar | Semilla fija por caso: el mismo caso da siempre las mismas curvas | **visto** (`seed`, `rand()`) |
| Versiones del modelo | Los coeficientes van con fecha (`physiology-2026-09-27-r2`…). Un ejercicio empezado sigue con la versión con la que empezó | **visto** (`live-model:47-150`) y contado en `/model/` |
| Servidor | Inicio de sesión, cuentas y sincronización (Plus) | **visto** que existe (enlaces a `vent.nodefield.jp/login`); cómo funciona, **desconocido** |

## 2. Los modos de ventilación

En el motor público hay **tres modos**: **VC** (volumen control), **PC** (presión control) y **PSV**
(presión de soporte). Cualquier otro modo se rechaza con un aviso. **Visto** (`live-model:722`).

| Modo | Qué fija el usuario | Cuándo termina la inspiración |
|---|---|---|
| VC | VT, flujo (cuadrado o decelerado), pausa inspiratoria | Cuando ha entrado el volumen (más la pausa) o al llegar a Pmax |
| PC | Pinsp sobre PEEP, Ti y tiempo de subida | Cuando pasa el Ti o al llegar a Pmax |
| PSV | PS, tiempo de subida y % de ciclado (corta al bajar el flujo a un % del pico) | Por flujo, por Ti máximo o por Pmax; en apnea entra la ventilación de respaldo |

- **Comunes:** FR, PEEP, FiO₂, disparo por flujo (L/min) o por presión (cmH₂O), Pmax y tiempo de apnea.
- **Rangos** (**visto**, `live-model:695-712`): VT 150–1000 mL, flujo 10–120 L/min, Ti 0,3–3 s, Pinsp
  2–40, PS 0–30, FR 4–40, PEEP 0–25, FiO₂ 21–100, Pmax 15–70 y apnea 10–60 s.
- **Comprobación:** si el Ti no deja al menos 0,2 s para espirar, no deja aceptar el cambio. **Visto**.
- **Los cambios no entran a mitad de respiración:** se quedan «en cola» y se aplican en la siguiente.
  **Visto** (`queueSettings` / `applyPending`).
- **Otros mandos:** bolsa autoinflable (BVM) como fuente de presión sencilla, pausa inspiratoria y
  espiratoria, curva P-V a bajo flujo, insuflación sostenida, maniobra de reclutamiento por escalones y la
  prueba de oclusión para validar el balón esofágico. **Visto** (métodos `startLowFlowPv`,
  `startSustainedInflation`, `startOcclusionTest`, `startBvm`, `requestHold`).
- **SIMV y PRVC:** citan los manuales de Hamilton y Getinge que explican estos modos, pero en este motor no
  están. Si los tiene la app de pago es **desconocido**.

## 3. El modelo del pulmón y sus ecuaciones

Lo que va **visto** sale del código de `live-model`. La interpretación es **deducida**, salvo donde
`/model/` lo explica. Las fórmulas son fisiología de libro, no algo suyo.

### 3.1 La ecuación del movimiento (cómo se reparte la presión)

- **Presión en vía aérea** = presión alveolar + R·Q + R₂·Q². Es la resistencia de Rohrer: un término lineal
  y otro que crece con el cuadrado del flujo, como en un tubo con turbulencia.
- **En PC y PSV** el respirador fija la presión y el flujo se despeja con la fórmula de la ecuación de
  segundo grado: Q = (−R + √(R² + 4·R₂·ΔP)) / (2·R₂). **Visto** (`live-model:2678`, `:2830`).
- **En VC** el respirador fija el flujo y la presión sale de la suma. **Visto** (`live-model:2950`).
- **La presión sube en exponencial:** en PC y PSV, P(t) = PEEP + Pinsp·(1 − e^(−t/tiempo de subida)).
  **Visto** (`:2976`).
- **El flujo decelerado** baja en línea recta hasta la mitad del flujo inicial. **Visto** (`setFlow`).
- **La resistencia de base es 8 cmH₂O/L/s** (R₂ = 0,5). Espirar cuesta un 15 % más. La aumentan las
  secreciones (×1,9 si son máximas), un tubo acodado (×4) y el broncoespasmo (×3,5). **Visto**
  (`effectiveResistance`, `:2596`).

### 3.2 El pulmón: 64 unidades con apertura y cierre

- Cada unidad tiene su **curva presión-volumen saturable**: V = Vmín + Vmáx·(1 − e^(−c·(PL − Psup)/Vmáx)),
  donde PL es la presión transpulmonar y Psup la presión que le hace el peso del pulmón de encima. Cuanto
  más llena está, menos distensible es. Si pasa del 80 % de su capacidad, cuenta como **sobredistendida**.
  **Visto** (`live-model:490-560`).
- **Truco de cálculo:** se lleva la cuenta del **volumen total** (el flujo integrado). En cada paso se busca
  la PL que llena las unidades abiertas con ese volumen, con Newton-Raphson (hasta 20 vueltas). **Visto**
  (función en `:513`, llamada en `integrateLung`, `:3100`).
- **Apertura y cierre con histéresis:** una unidad se abre si PL − Psup supera su presión de apertura y se
  cierra si baja de la de cierre. Abrir tarda unos 1,5 s y cerrar unos 8 s, y va más rápido cuanto más se
  pasa del umbral. Por eso la PEEP «mantiene abierto» lo que el reclutamiento abrió. **Visto** (`:547`).
  La idea es la de Hickling (2001), según `/model/`.
- **Tres tipos de unidad:** normal, reclutable y **consolidada** (no se abre nunca). **Visto** (`kind`
  0/1/2).
- **El peso del pulmón:** boca arriba, la Psup crece hacia la espalda. Boca abajo se invierte y se queda en
  el 60 % del gradiente, con un cambio lento de 20 minutos. **Visto** (`:586-594`, coeficiente
  `proneTimeConstant` 1200 s).
- **Valores del paciente normal:** 64 unidades, unos 6 L entre todas, presión de apertura media 0 y de
  cierre −8. **Visto** (`V()`, `:633`). En SDRA reclutable, la apertura media es de 9 cmH₂O, según
  `/model/`.

### 3.3 Pared torácica, esfuerzo del paciente y presión esofágica

- **Presión pleural** = −PL en CRF + desplazamiento + Ecw·(V − V en CRF) − Pmus + tensión del neumotórax.
  La pared es un solo muelle (Ecw por defecto 5 cmH₂O/L). **Visto** (`pplRelaxed`, `:1467`).
- **Presión alveolar** = PL + presión pleural + un término viscoelástico. Ese término sigue al flujo con un
  retraso de 1,5 s, y por eso la presión cae un poco al principio de una pausa. **Visto** (`:2790`); el
  significado, **deducido**.
- **Esfuerzo del paciente (Pmus)** con forma de seno al cuadrado:
  - Dura 0,9 s, con 14 respiraciones por minuto de base y un 5 % de variación entre una y otra. **Visto**
    (`updateEffort`, `:3459`).
  - La **sedación** baja el impulso y el **CO₂ alto** lo sube.
  - La **fatiga** se acumula cuando el trabajo supera la capacidad y recorta el esfuerzo.
- **Asincronías que salen solas del modelo:**
  - **Esfuerzo ineficaz:** el paciente empuja y el respirador no se dispara.
  - **Doble disparo:** un mismo esfuerzo dispara dos veces.
  - **Autodisparo:** se dispara sin esfuerzo del paciente.
  - **Disparo inverso:** el esfuerzo llega después de que el respirador sople, con un horario programado.

  Todo **visto** (`:3056-3066`, `reverseSchedule`).
- **Presión esofágica** = presión pleural + gradiente + desplazamiento + latido del corazón (una onda al
  ritmo de la FC). Simula balón bien lleno, poco lleno, demasiado lleno y mal colocado. **Visto**
  (`esophagealPressure`, `:3869`).

### 3.4 Lo que puede ir mal (y el residente tiene que encontrar)

Secreciones (con un dibujo de sierra en el flujo, solo para enseñar), tubo acodado, broncoespasmo,
desconexión, fuga del circuito, manguito desinflado, neumotórax a tensión con pinchazo o drenaje, intubación
selectiva y **esofágica** (el aire va a un «estómago» que se llena), cierre de la vía aérea (con presión de
apertura) y PEEP intrínseca. **Visto** (`Bt`, `:613`, y `step`).

### 3.5 Gases y circulación (lo explica `/model/`; el código lo confirma)

- **PaCO₂** ≈ 0,863 · VCO₂ / VA (ventilación alveolar). **Visto** (`:258`).
- **PAO₂** ≈ FiO₂·(760 − 47) − PaCO₂/0,8. **Visto** (`:192`).
- **CaO₂** = 1,34·Hb·SaO₂ + 0,003·PaO₂. **Visto** (`:206`).
- **Saturación** con la fórmula de Severinghaus: SO₂ = 1 / (1 + 23 400 / (PO₂³ + 150·PO₂)).
- **Oxigenación en tres partes de sangre:** zonas bien ventiladas, zonas con poca ventilación para su riego
  (V/Q bajo) y **shunt**. Se mezclan para dar la PaO₂.
- **pH** con Henderson-Hasselbalch. El bicarbonato agudo sube 0,1 por mmHg de CO₂ que sube y baja 0,2 por
  mmHg que baja.
- **CO₂ guardado en dos depósitos** (central y tejidos, de 12 y 45 mL por mmHg), con paso de uno a otro.
  Por eso el CO₂ tarda en cambiar.
- **Circulación:** el gasto cardiaco sale de cruzar la curva de retorno venoso con la de función cardiaca
  (al estilo de Guyton). La presión pleural, la sobredistensión, la hipoxia y la hipercapnia la mueven. Un
  bolo de suero suma 500 mL al volumen de sangre.
- **Fármacos:** van como efectos que suben y bajan con el tiempo, sin farmacocinética: broncodilatador,
  sedación, relajante muscular, vasopresor «en unidades del modelo», corticoide y magnesio.
- **Tiempos de los procedimientos:** aspiración 12 s, reintubación 83 s, drenaje 150 s y cambio de postura
  180 s.

## 4. Lo que dibuja

- **Tres curvas** apiladas en una ventana de 8 s: **presión** (amarillo, de −5 a 30 cmH₂O), **flujo** (azul
  claro, ±60 L/min) y **volumen** (blanco, 0–600 mL). Ejes fijos, fondo oscuro y una línea del cero en
  presión y flujo. **Visto** (`live-model:4526-4580`).
- **Dos bucles** uno al lado del otro: **P-V** (presión → volumen) y **F-V** (volumen → flujo). La última
  respiración completa va en gris y la que está en marcha en color, con un punto donde va. Los ejes se
  ajustan solos al tamaño de la respiración. **Visto** (`loops`, `:4512`, y el dibujo en `:4583-4625`).
- **Cifras:** VTe y Ppeak de la última respiración. **Visto**.
- **En la app completa:**
  - Congelar, ampliar, dos cursores con integral del flujo entre ellos, guardar y superponer antes y
    después.
  - Mapa de las 64 unidades (abiertas, reclutables, consolidadas y sobredistendidas) y una «TC esquemática»
    del aire dentro del pulmón.
  - Gasometría con hora de extracción, capnografía y monitor (SpO₂, TA, FC).
  - **Visto** en `/features/`, sin probar en uso.

## 5. Alarmas

Las alarmas configurables y sus límites están **vistas** en `live-model:17-37` y `checkVentAlarms`
(`:3936`):

| Alarma | Rango del límite |
|---|---|
| Volumen corriente espirado bajo | 20–2000 mL |
| Volumen corriente espirado alto | 50–2500 mL |
| Volumen minuto bajo | 0,5–40 L/min |
| Volumen minuto alto | 1–60 L/min |
| Frecuencia alta | 10–60/min (35 por defecto) |

- **Comprobación:** el límite de abajo tiene que ser menor que el de arriba.
- **Además saltan solas:**
  - Presión alta (corta la inspiración en Pmax).
  - Presión baja o desconexión.
  - EtCO₂ bajo.
  - PEEP baja (si pasa dos respiraciones seguidas).
  - Apnea con ventilación de respaldo.
- **Alarmas del monitor:** SpO₂ < 90 %, TAS < 90, FC > 120 o < 50. Se apagan solo tras **5 s** ya
  normales, para que no parpadeen. **Visto** (`step`, `:2760-2785`).
- **Contra falsas alarmas:**
  - Justo después de subir la PEEP no da «desconexión» por un VTe bajo pasajero.
  - El volumen minuto se mira sobre el último minuto, sin contar las maniobras.

  Contado en `/model/`.

## 6. Cómo enseña (lo que no es motor)

- **30 casos**: 15 básicos y 15 avanzados. Ejemplos: comprobar tras intubar, VC frente a PC, «oxigenación
  A/B» (V/Q bajo frente a shunt), Ppeak/Pplat/PEEP total, EPOC con PEEP intrínseca, asincronías, prueba de
  respiración espontánea, SDRA, fugas, test de fuga del manguito, presión transpulmonar, AOP, R/I y prono.
  También **casos hechos por el usuario**. **Visto** (`/features/`).
- **Método:** predecir → cambiar una sola cosa → medir → mirar al paciente, al tubo y al circuito →
  repasar. Las medidas tienen sus condiciones: una Pplat de hace más de 30 s no se combina con una PEEP
  total nueva para calcular la distensibilidad. **Visto** en `/model/`.
- **Honestidad:** una página entera dice qué es fórmula de libro, qué es idea de un artículo y qué es un
  número inventado para enseñar. Avisa de que no está validado con pacientes reales y tiene 60 referencias
  con lo que se comprobó de cada una. **Visto**.
- **Negocio:** gratis con 7 casos; individual 4 480–4 980 ¥ (pago único); Plus 500 ¥ al mes. Para
  profesores y una edición con el código, en desarrollo. Hecho con ayuda de IA, según dicen. **Visto**.

## 7. Qué aprovechar y qué haría distinto para un simulador nuestro

**Ideas que valen** (las ideas y las fórmulas de libro, no su código, que no tiene licencia libre: el
código y los textos no se pueden copiar):

1. **Paso fijo pequeño (1–2 ms) separado del dibujo.** Se calcula a ritmo constante y se pinta en cada
   fotograma. Con 500 pasos por segundo va de sobra en un móvil y las curvas no dependen de los FPS.
2. **Rohrer + pared torácica + Pmus.** Con tres términos salen casi todas las curvas de libro: meseta,
   PEEP intrínseca, broncoespasmo y asincronías.
3. **Varias unidades con histéresis** para que la PEEP y el reclutamiento se comporten como en la UCI.
   Es la parte que más diferencia un simulador serio de uno de juguete.
4. **Los cambios entran en la respiración siguiente** y **semilla fija**: el mismo caso da siempre lo mismo,
   bueno para practicar y para probarlo.
5. **Coeficientes con versión**, para no romper un caso guardado al mejorar el modelo.
6. **Las asincronías y los fallos salen de la física, no de dibujos**, así que el residente tiene que
   buscar la causa (paciente, tubo, circuito).
7. **La página de límites del modelo**: decir qué es aproximado protege al que aprende.

**Lo que cambiaría pensando en un residente (de guardia, en el móvil):**

1. **En español y a 412×915.** Su gráfica está pensada para pantalla ancha (tres curvas y dos bucles).
   En móvil: curvas a pantalla completa y los bucles en una pestaña.
2. **Casos de guardia antes que de UCI fina:**
   - Intubado en urgencias que desatura (protocolo DOPE: desplazamiento, obstrucción, neumotórax, equipo).
   - Asmático con PEEP intrínseca.
   - EPOC.
   - SDRA con 6 mL/kg de peso ideal.
   - Paciente que «lucha» con el respirador.
   - Traslado con bolsa.
3. **Más modos de los que se ven en planta:**
   - VC, PC y PSV (como ellos).
   - **CPAP/VNI con fuga** y **gafas nasales de alto flujo**, que un R1 maneja más que la ventilación
     invasiva.
   - SIMV y PRVC (VC+), que son los que salen en los respiradores del hospital.
4. **Calculadoras en el mismo sitio:** peso ideal y VT por mL/kg, driving pressure, distensibilidad
   estática, P/F y una ventilación minuto orientativa.
5. **Empezar por lo mínimo:** primero un compartimento (R + C + PEEP + Pmus), que ya da el 80 % de lo que
   se enseña. Las 64 unidades se añaden solo si el caso de SDRA o de prono lo pide.
6. **Sin cuenta ni servidor:** casos y progreso en el propio móvil, que funcione sin conexión (como esta
   app).
7. **Gases más sencillos al principio**, pero con la misma idea de los tres tipos de sangre (normal, V/Q
   bajo y shunt). Así se enseña por qué subir la FiO₂ no arregla un shunt.

## 8. Lo que queda sin saber

- La consola real de la app: el diseño de los mandos, cómo se ven las alarmas y los casos por dentro.
  **Desconocido**: pide cuenta y la red de esta sesión no deja entrar en `vent.nodefield.jp`.
- Si la versión de pago tiene más modos que VC, PC y PSV. **Desconocido**.
- El servidor (cuentas, sincronización). **Desconocido**.
