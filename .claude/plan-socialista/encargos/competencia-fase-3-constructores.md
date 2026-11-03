# Encargo común · constructores de la fase 3 de La Competencia

Lo lee cada constructor (sonnet, en su worktree) junto a su línea de abajo. Quien dirige la fase pasa las ramas a `main`.

## 0 · Antes de nada (lo que aprendieron las fases 1 y 2)

```sh
git fetch origin claude/la-competencia && git reset --hard origin/claude/la-competencia
ln -s /home/user/app-organizador-MIR/node_modules node_modules   # si no existe ya; NUNCA lo añadas al commit
```
Antes de cada commit: `git status --short` y que no salga `node_modules` (en la fase 2 se coló y Pages dejó de publicar).
Si `npm run …` sale sin hacer nada (código 216), usa directo `bash tools/pruebas-corto.sh --solo …`.

## 1 · Lee solo esto (no releas `app.js` entero; busca con grep)

- `CLAUDE.md` (lista «Terminado» y «Cómo se construye»).
- Tu línea de «Las tandas» (abajo) y tu sección de `maquetas/competencia-c.html` (el usuario aprobó **todas las recomendadas**, 03/11).
- «El mapa» de `consejo/2026-11-02-competencia.md` (dónde vive cada cosa en `app.js`; las líneas pueden haberse movido: grep).
- Ejemplo de ficha: `fichas/competencia-c2.md`.

## 2 · Ficha

Escribe `fichas/competencia-<tanda>.md` (≤30 líneas, mismo formato que la de C2): qué y para qué (dado/cuando/entonces), dónde se
toca (funciones y clases), **Añade · Quita · No toca**, frases para el verificador, pasos.

## 3 · Construir

- Lo mínimo primero: busca en `app.js` lo que ya existe antes de escribir. Ojo con los **dos switches** de acciones (`act()` y el de `change`).
- CSS nuevo con las variables `--t-*` de `:root`, nunca px sueltos; ningún texto por debajo de 13 px (C1).
- Pruebas **solo en tu bloque**, en `tests/regression.test.js`: encadenadas (dos gestos o más conduciendo la interfaz), con
  `await fijaHoy()` si miran el día o la hora, y que **caigan al revertir** tu cambio (compruébalo una vez y apúntalo).
- **Pruebas viejas de tu pantalla:** `grep` en `tests/` de cada selector, clase o texto que cambies o quites, y pásalas con
  `tools/pruebas-corto.sh --solo <números>`. Si una cae por un cambio decidido en la ficha, cambia lo que espera y apúntalo en
  DECISIONS; si cae por otra cosa, arréglalo tú. Saltarse o borrar una prueba: **no**.
- **Nunca lances la suite completa** (`npm run test:corto` sin `--solo`): la corre solo quien dirige. Hay otros dos
  constructores a la vez: si una prueba «de tiempo» cae una vez, repítela sola antes de investigar.
- No toques `sw.js`, `version.json` ni `main`; no selles; no hagas push.
- Una entrada en `docs/DECISIONS.md` (Elegido · Descartado · Supuestos · «cae con X revertido»).
- Commit en tu rama del worktree (mensaje en español, sin identificadores de modelo), con estas dos líneas al final:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` y
  `Claude-Session: https://claude.ai/code/session_01QiKC36AoP6yyUFNnAb2TFk`.

## 4 · Tope y entrega

Para en **~60 pasos** y entrega lo que tengas con lo que falta. Devuelve en ≤15 líneas: nombre de la rama y hash del commit,
pruebas nuevas (números) y viejas que pasaste, lo que cambió de lo que esperaban las viejas, las frases exactas para el
verificador (en claro y en oscuro, 412×915) y lo que quede pendiente.

## Las tandas

| Tanda | Pruebas | Qué (todo lo recomendado en la maqueta) |
|---|---|---|
| T1a Arreglos | 530-534 | (1) Dinero → Tu mes en **oscuro**: el vaso sale como bloque gris claro casi blanco y plano (~155×230 px), sin el nivel de «Te queda»; y «Subir Fintonic» blanco sobre tarjeta oscura. Primero mira si es un fallo (con datos sembrados); que el vaso y el botón se vean bien en los 5 temas. (2) Mes: el botón de la cabecera dice «Ver del 1 al 1 de noviembre» con la cuadrícula del 2 nov al 6 dic: que diga el rango de verdad. (3) Comer → Casa en oscuro: el título «Casa» va pegado al borde (x≈7 px; el resto, 12 px) y los chips de «Crudo y verdura» parten «falta» en 3 líneas. |
| T1b Privado y pasillos | 535-539 | (1) Con «Privado» puesto (C6, pruebas 510-519b, `cnTapado`), lo que se exporta a .ics y a Google Calendar sale **tapado**: título «Privado», sin la nota ni el nombre real («Lloretazo» no sale del móvil). Repasa con la lista de `/revisa-seguridad`. (2) C7·e: la lista de Casa por pasillos, en el orden del súper (el motor de pasillos ya existe: `food.pasillos`, `secsOrdenadas`), con cabecera y cuenta por pasillo; lo cogido se queda **tachado en su pasillo**; «Ya en casa, no entran» plegado al final. |
| T2a Entreno | 540-549 | C7·c: en la tarjeta HOY vacía, «Copiar mi último entreno» (mismos ejercicios y series con los pesos de la última vez; confirmas cada serie como ahora), «Plan recomendado» y «Empezar vacío»; al terminar una sesión que no venía de rutina, hoja «¿Guardar como rutina?» (nombre, días, «Ahora no»). Tras guardia no se propone torso/pierna. X3: gráfico pequeño de récords en la portada de Entreno, un ejercicio a la vez («cambiar ›»), barras por semana y el récord en verde. |
| T2b Estudio | 550-559 | C7·d: tarjeta «Empieza» en Estudio vacío: qué estudias (4 chips), horas al día los días sin guardia (− / +), y «12 págs hoy · 1 h · acabas el 14 dic» calculado **sin contar guardias ni salientes**; «Prefiero rellenarlo todo a mano» abre el formulario de ahora. |
| T2c Flechas de día | 560-564 | X1: en Hoy, flechas «‹ lun · mié ›» para ir al día anterior y al siguiente, **sin gesto de deslizar**. No hay «+» flotante (X2 descartado). |
| T3a Caja de frase | 570-579 | C7·b: arriba de Hoy, una línea plegada «Apuntar algo…» que abre la caja; entiende eventos y notas con día y hora (hoy, mañana, días de la semana, «el 14», «20 dic», «a las 21»), **no guardias**. Vista previa obligatoria (Qué/Día/Hora/Tipo con «cambiar»), aviso si ese día hay guardia, y si no entiende algo lo dice y no guarda. Sin librería. |
| T3b Tu guardia | 580-589 | C7·a: asistente de 3 pasos en Ajustes → Mi planning y como primera pantalla de quien empieza de cero (servicio y tipo; tocar los días en un mini calendario, el saliente sale solo; los meses siguientes, por defecto «Lo pongo yo cada mes» y patrón solo si se ve claro). El ciclo de ahora, plegado en «Avanzado». |

Descartado por el usuario (03/11, recomendación): deslizar con el dedo y el «+» flotante. PDF y Excel: lo último, preguntando antes.
