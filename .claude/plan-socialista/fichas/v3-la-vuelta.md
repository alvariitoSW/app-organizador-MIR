# Ficha · La Vuelta (Entreno + objetivo de peso) con dos temas · 28/10/2026

**Pedido del usuario** (tras el concurso): «La Sombra del Teide y Los Bancales me gustan: mantén ambas en Ajustes, en
temas, y ahí tener los 2 temas; prepáralo todo y después súbelo a main». Acta: `consejo/2026-10-28-deporte.md`.
Maquetas de referencia: `maquetas/deporte2-1-sombra-teide.html` y `maquetas/deporte2-5-bancales.html` (y sus bases
`consejo/2026-10-28-la-vuelta-ronda2.md`).

**Dudas sin contestar → valores recomendados por el Consejo** (Supuestos): sesión de 50 min dentro de 15:00-16:00;
vuelta al 35 % y +10 puntos por semana; pérdida de 0,5 kg/semana por defecto, que el usuario puede cambiar con tope del 1 %/semana.

## Cómo se sabe que está bien
1. Un día laborable sin hora puesta a mano: el entreno sale a las **15:00** y dura **50 min**. Sábado y domingo:
   **parque a las 10:00, 40 min**, sin material.
2. Si el trabajo o un evento pisa las 15:00, la alternativa es la **sesión mínima de 25 min a las 15:30**, y nunca
   una hora de la tarde-noche entre semana.
3. Un plan de vuelta **nuevo** arranca al **35 %** y sube 10 puntos por semana (35·45·…·95·100). Un plan **en curso**
   (guardado sin `ini`) sigue con sus cifras de antes.
4. Hay objetivo de peso: kg de meta y ritmo → kcal/día, proteína, semanas y fecha. Con topes: ritmo ≤1 % del peso/semana,
   déficit ≤25 % del gasto, kcal ≥ basal y ≥1.500, meta con IMC ≥18,5. Las kcal del objetivo mandan en `kcalSugeridas`.
5. Portada de Entreno: una **lámina dibujada** con el tema elegido (Teide o Bancales). Enseña qué toca hoy (hora, lugar
   o «hoy no: guardia»), la semana de 7 días, la vuelta (si hay plan) y el peso (si hay objetivo), y lleva el botón
   **«Explícamelo · 45 s»** con el texto de 100-120 palabras y el recorrido.
6. **Ajustes → Cómo se ve → Temas**: una fila «Dibujo del entreno» con las dos opciones. Se guarda en
   `gymS().lamina` ('teide' por defecto | 'bancales').
7. Cada cambio con su prueba encadenada en `tests/regression.test.js` (skill `prueba-de-secuencia`) que **cae al revertir**.
   Suite completa en verde. Medido a 412×915 con `verificador`.

## Pasos (archivo y función exactos)
**Obra A · la lógica (constructor sonnet)**
- A1 `app.js:8428 gymHoraDe`: sin `g.hora`, entre semana → `franja().sem` ('15:00'); fin de semana → `franja().fin`
  ('10:00'). Nueva `franja()` junto a `entrenoCfg` (8423), leída de `gymS().franja` con valores por defecto. No quita
  la regla de `g.hora` puesta a mano.
- A2 `app.js:8442 ventanaEntreno`: la duración por defecto pasa de 75 a 50 (fin de semana, 40). `ENT_HORAS` (8457) y
  `horaLibreEntreno`: entre semana solo '15:00' y '15:30' (esta última = sesión mínima de 25 min); el fin de semana
  sigue la lista actual con '10:00' delante.
- A3 Lugar: `lugarEntreno(key)` → 'gimnasio' entre semana, 'parque' el fin de semana. Rutina del parque sin material
  (sentadilla, flexiones inclinadas, remo invertido, zancadas, plancha, subir escalones): reutiliza `addRutina`/la
  biblioteca openGym si está (filtro de equipo «body weight»); si no hay biblioteca, la lista fija.
- A4 Sesión mínima: `ses-empezar` con `data-min="1"` arranca la rutina del día con 3 ejercicios × 2 series. Busca el
  `case 'ses-empezar'` en `act()` y cuida también el switch de `change` si toca.
- A5 `app.js:16535 REGRESO_RITMO`: `ini` 30/35/40 (suave/normal/rápido), +10 por semana; `regresoSemanas` =
  semanas hasta 100. `regresoS` guarda `ini` y `paso:10` en `g.regreso` al crearlo; si un plan guardado no tiene `ini`,
  `regresoDe` y la tabla usan la fórmula vieja (lineal 60/70/75 → 100).
- A6 Objetivo de peso: `perfil.objetivo={kg,ritmo}` (ritmo en kg/semana, 0,5 por defecto). Nueva `objetivoPeso()`
  junto a `kcalSugeridas` (9036): peso de partida = media de los últimos 7 días de `perfil.pesos` (o `pesoKg`), déficit
  = ritmo×7700/7 recortado a 25 % de `gastoDiario()`, kcal = max(gasto−déficit, basal, 1500), proteína 2 g/kg,
  semanas y fecha con el déficit real. `kcalSugeridas` usa `objetivoPeso().kcal` si hay objetivo y `meta==='perder'`.
  Entrada: una pantalla «Tu objetivo de peso» en Entreno (`ui.gymPanel='peso'`) con kg de meta, ritmo (0,25/0,5/0,75/1 %
  máx.) y la gráfica del peso (SVG sobre `perfil.pesos`). Aviso fijo: «si has tenido problemas con la comida, habla antes
  con tu médico/a». Los datos no salen del móvil.

**Obra B · los dos temas (constructor sonnet, después de la A)**
- B1 `laminaHTML(sel)` en el render de la portada (`renderGymPortada`, 16219), arriba, antes de `gymSemanaCirculos`.
  Dos dibujos SVG en línea adaptados de las maquetas, con los datos REALES: hora y lugar de hoy (`gymHoraDe`,
  `lugarEntreno`, guardia/saliente de `dayInfo`), los 7 días de la semana, la vuelta (`regresoDe`) o la racha
  (`rachaConstancia`) si no hay plan, y el peso (`objetivoPeso`) si hay objetivo.
- B2 El botón «Explícamelo · 45 s»: texto de 100-120 palabras (los 5 puntos de las bases de la 2.ª ronda), recorrido de
  5×9 s que resalta cada parte, con «Parar». Con `prefers-reduced-motion` no anima. Sin `setInterval` que sobreviva a
  un re-render: se para al salir de la pantalla.
- B3 Ajustes (`app.js:22621`, `cfgPantalla('🎨 Cómo se ve')`): la fila «Dibujo del entreno» con las dos muestras;
  acción `lamina-tema` en `act()`.
- B4 Estilos en `styles.css` con los tokens de la app; los colores propios de cada lámina dentro de su SVG. Claro y
  oscuro legibles.

**Cierre (quien dirige):** `verificador` a 412×915 (portada de Entreno con los dos temas, el objetivo de peso y
Ajustes) → `npm run test:corto` en verde → entrada en `docs/DECISIONS.md` → `npm run sella` + `version.json` →
`git push origin HEAD:main` → Actions en `success`.

**Presupuesto:** obra A ~1,8 M · obra B ~1,8 M · cierre ~0,5 M. Si se pasa más de un 25 %, se para y se dice.
