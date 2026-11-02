# Encargo · «La Competencia»: informe de la empresa rival

Pedido por el usuario el 02/11/2026. Se lanza en una sesión nueva con la palabra **ultracode** (workflow de varios
agentes). **No se construye nada**: ni otra app ni cambios en `app.js`. Solo un informe escrito.

## El papel

Sois **una empresa competidora**. Habéis visto que la app «Guardias · rotación y cocina» (la de este repositorio:
calendario de guardias y rotaciones, comer, entreno, sueño, dinero y hábitos, para un residente R1 en el móvil)
tiene usuarios, y queréis **quitárselos y hundirla en ventas** con vuestra propia app. Para eso estudiáis su app
función a función y escribís, con frialdad de equipo de producto, **en qué la vuestra es mejor y por qué la supera**:
- **más sencilla**: menos pantallas, menos toques, menos cosas que apuntar;
- **otro estilo visual**, más claro y más actual;
- **las mismas necesidades mejor resueltas**: guardias, salientes, comer sin gluten, entreno, sueño, dinero.

Sed duros, pero honestos: si algo de la app del usuario ya es mejor que lo que haríais vosotros, decidlo, porque
os sirve para no copiarlo mal. El público de las dos apps: un R1 con guardias, cansado, con poco tiempo, en un
Android a 412×915.

## Cómo (el workflow)

1. **Mapa** (un agente barato, sonnet, ≤15 búsquedas con `grep -n`/`sed -n`, sin leer `app.js` entero): las
   secciones y pantallas reales de la app y cómo se llega a cada una. Ese mapa decide la lista de secciones; no la
   supongáis (probablemente: Hoy, Mes/guardias, Comer, Entreno, Sueño, Dinero, Hábitos, Más/ajustes).
2. **Analistas de la rival, uno por sección, en paralelo** (sonnet). Cada uno usa la app de verdad a **412×915**
   con el driver de la skill `verify` y **datos sembrados de prueba** (`window.PG`), nunca datos personales. Por
   sección, apuntan:
   - qué hace y cuántos toques cuesta lo típico;
   - lo que sobra, lo que está escondido, lo que obliga a apuntar a mano;
   - qué haría la rival en su lugar, en concreto: qué ve el usuario en su pantalla y con cuántos toques.
3. **Diseñadora visual de la rival** (opus): mira capturas de Hoy y de 3-4 secciones y propone el estilo de la
   rival (paleta, tipografía, densidad, iconos, tono de los textos) frente al actual.
4. **Pruebas de usuario**: un agente hace de R1 al salir de una guardia e intenta 5 tareas típicas (ver la
   próxima guardia, qué como hoy, apuntar cómo dormí, apuntar un gasto, marcar el entreno). Cuenta toques, tiempo
   de lectura y dónde se atasca, en la app actual y en la que propone la rival (sobre el papel).
5. **Abogado de la app del usuario** (verificación adversaria): por cada «la rival es mejor en X», un agente
   intenta refutarlo. ¿De verdad es más simple o solo esconde algo que el R1 necesita? ¿Rompe algo de guardias o
   salientes? Solo pasa al informe lo que sobrevive. Lo refutado va a un apartado aparte, «Donde la app actual gana».
6. **Director de producto de la rival** (opus): escribe el informe final.

## El informe

En `docs/informe-competencia-2026-11.md`, en español y sin jerga:
- **Resumen en 10 líneas:** por qué la rival te gana.
- **Por sección:** qué hace mejor la rival, por qué te quitaría usuarios, toques de antes y después, y una
  frase de «cómo se ve» su pantalla.
- **El estilo visual de la rival** frente al actual.
- **Donde la app actual gana** (lo refutado en el paso 5).
- **Tabla final ordenada por impacto:** qué copiar, en qué sección, cuánto mejora, coste estimado en equivalentes
  (pequeño ~0,5 M · medio ~1 M · grande ~2 M) y si cambia lo que ve el usuario (si cambia, decide él, con maqueta).
- Si ayuda, una página para verlo en el móvil (Artifact) con el mismo contenido.

## Reglas

- **No tocar** `app.js`, `index.html`, `styles.css`, `sw.js` ni `fig/`. Es un estudio.
- **Privacidad:** solo datos sembrados de prueba. Las capturas se quedan en el scratchpad de la sesión, nunca en el
  repositorio (el hook `sin-capturas` lo vigila). Nada personal en el informe.
- **Gasto:** tope de ~5 M equivalentes. Cada agente lleva un tope de pasos en su encargo. Si se va a pasar,
  parar y decirlo. Al acabar: `node tools/gasto.mjs --apunta la-competencia --tipo estudio --nota "…"`.
- Commit del informe (y de `gastos.md`) en la rama que asigna la sesión y push. **No pasar a `main`**: el usuario
  lo lee primero. Después, si quiere, lo lleva al Consejo para decidir qué se hace.
- Al usuario, al final: el resumen de 10 líneas, la tabla de impacto y el enlace al informe.
