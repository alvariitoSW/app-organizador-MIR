# Encargo común · constructores del remate de La Competencia (03/11)

Lo lee cada constructor (sonnet, en su worktree) junto a su línea de abajo. Quien dirige pasa las ramas a `main` de una en una.

## 0 · Antes de nada (lo que aprendieron las fases 1-3)

```sh
git fetch origin claude/la-competencia && git reset --hard origin/claude/la-competencia
ln -s /home/user/app-organizador-MIR/node_modules node_modules   # si no existe ya; NUNCA lo añadas al commit
```
Antes de cada commit: `git status --short` y que no salga `node_modules` (en la fase 2 se coló y Pages dejó de publicar).
Si `npm run …` sale sin hacer nada (código 216), usa directo `bash tools/pruebas-corto.sh --solo …`.

## 1 · Reglas

- Lee `CLAUDE.md` («Terminado» y «Cómo se construye»). No releas `app.js` entero: grep.
- **Prefijo propio** para clases, ids, `data-a` y claves de `ui`/`store`, y **grep antes de usar un nombre** (en la fase 3 hubo
  dos choques de nombres entre tandas). Ojo con los **dos switches** de acciones (`act()` y el de `change`).
- CSS con las variables `--t-*` de `:root`; ningún texto por debajo de 13 px.
- Pruebas **solo en tu bloque**, al final de `tests/regression.test.js`: encadenadas (dos gestos o más conduciendo la interfaz),
  `await fijaHoy()` si miran día u hora, y que **caigan al revertir** tu cambio (compruébalo una vez y apúntalo).
- **Pruebas viejas de tu pantalla:** grep en `tests/` de cada selector o texto que cambies y pásalas con
  `bash tools/pruebas-corto.sh --solo <números>`. Si caen por un cambio decidido, cambia lo que esperan y apúntalo en DECISIONS;
  saltarse o borrar una prueba: **no**.
- **Nunca la suite completa** (la corre solo quien dirige). Hay otros constructores a la vez: si una prueba «de tiempo» cae una
  vez, repítela sola antes de investigar.
- No toques `sw.js`, `version.json` ni `main`; no selles; no hagas push.
- Una entrada en `docs/DECISIONS.md` (Elegido · Descartado · Supuestos · «cae con X revertido»).
- Commit en tu rama del worktree (español, sin identificadores de modelo), con estas dos líneas al final:
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` y
  `Claude-Session: https://claude.ai/code/session_01QiKC3A29rHMBKGGRu93Lne`.

## 2 · Tope y entrega

Para en **~50 pasos** y entrega lo que tengas con lo que falta. Devuelve en ≤15 líneas: rama y hash del commit, pruebas nuevas y
viejas que pasaste, lo que cambió de lo que esperaban las viejas, las frases exactas para el verificador (412×915) y lo pendiente.

## Las tandas

| Tanda | Pruebas | Prefijo | Qué |
|---|---|---|---|
| R2 Primera pantalla | 630-639 | `rpp` | «Tu guardia en 3 pasos» (T3b, `tguS()` y vecinas en `app.js`, prefijo `tgu`) **también como primera pantalla** de quien instala de cero, en lugar del asistente de arranque viejo. Reutiliza el de T3b, no lo dupliques. Quien ya tiene datos no lo ve. Rehaz las pruebas del arranque que esperan el asistente viejo (grep en `tests/` de sus textos y selectores; también `tests/siembra-70.js` y los helpers que «saltan el asistente», que deben seguir funcionando). |
| R3 Compra | 640-644 | `rcl` | En la lista de la compra, una línea escrita a mano de una receta («100 g de tomate triturado») se suma con el mismo alimento que pide la semana («300 g Tomate triturado» → una sola línea «400 g Tomate triturado»). Mismo alimento = mismo nombre sin mayúsculas, tildes ni plural simple; si las unidades no casan (g frente a «1 lata»), se quedan las dos líneas. Ver docs/DECISIONS.md «El Chef · CH2». |

## Traspaso (03/11, al cerrar el remate)

**Hecho, en `main` de una en una** (cada una con suite completa en verde, sello y run de Actions en verde antes de la siguiente):
R1 add23c7 · R2 06f3002 · R3 282656a · R4 437e7e9. PNG (5): cerrado sin tocar. Tandas viejas (6): nada pendiente; tachadas en el plan.

**Lo que aprendió el remate (para gastar menos):**
1. **Los números de prueba se reservan mirando la suite, no `plan-v3.md`:** T5 ya usaba 600-614 y hubo que mover R2/R3 a 630/640.
   `grep -oE "check\('[0-9]{3}" tests/regression.test.js | sort -u | tail` antes de repartir.
2. **Una prueba que conduce la primera pantalla y guarda datos ha de devolverlos al acabar:** la del primer arranque marcaba
   guardias los días 3, 11 y 19 del mes; un día 3 tumbó 5 pruebas lejanas y colgó un trozo. Se vio porque `main` pasaba y la rama
   no (la suite sobre `main` en un worktree aparte lo aclaró en 8 min sin leer código).
3. **Subir de una en una** cuesta poco en tokens (cada suite es espera), pero sí en reloj: ~8 min por tanda.
4. Comandos con hook: el commit y el `git push … main` en llamadas separadas (el hook mira antes de que exista el commit).
5. Con un ayudante o una suite corriendo a la vez, las pruebas «de tiempo» caen a veces (564 por 0,00001 px, `gotoTab` no
   estable): repetir con el equipo libre antes de investigar.

**Queda abierto:** el Lanzador K2-K4 (aparcado por el usuario). En R4, en tema claro la Línea de hoy sigue sobre fondo negro (el
usuario: «súbela así»). Los estilos `.arrpasos` de `styles.css` quedan sin uso tras R2.
