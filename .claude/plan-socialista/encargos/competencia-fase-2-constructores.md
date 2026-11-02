# Encargo común · constructores de la fase 2 de La Competencia

Lo lee cada constructor (sonnet, en su worktree) junto a su línea de abajo. Quien dirige la fase pasa las ramas a `main`.

## 0 · Antes de nada (lo que aprendió la fase 1)

```sh
git fetch origin claude/la-competencia && git reset --hard origin/claude/la-competencia
ln -s /home/user/app-organizador-mir/node_modules node_modules   # si no existe ya
```

## 1 · Lee solo esto (no releas `app.js` entero; busca con grep)

- `CLAUDE.md` (lista «Terminado» y «Cómo se construye»).
- `.claude/plan-socialista/consejo/2026-11-02-competencia-construir.md`: la fila de tu tanda (asunto 2) y el asunto 3.
- `.claude/plan-socialista/encargos/competencia-construir.md`: la fila de tu tanda (opciones 1-3; el usuario eligió **las tres recomendadas**).
- Tu maqueta (la sección con tu id) y el «El mapa» de `consejo/2026-11-02-competencia.md`.
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
  `Claude-Session: https://claude.ai/code/session_01QiKC37smkXa6ySNjKgREJN`.

## 4 · Tope y entrega

Para en **~60 pasos** y entrega lo que tengas con lo que falta. Devuelve en ≤15 líneas: nombre de la rama y hash del commit,
pruebas nuevas (números) y viejas que pasaste, lo que cambió de lo que esperaban las viejas, las frases exactas para el
verificador (en claro y en oscuro, 412×915) y lo que quede pendiente.

## Las tandas

| Tanda | Pruebas | Maqueta | Zona |
|---|---|---|---|
| C3 Hoy | 480-489 | `maquetas/competencia-a.html` (C3) | portada de Hoy (`hoyModo`, los ~8 bloques), tira de hábitos, conductor |
| C4 Mes | 490-499 | `maquetas/competencia-b.html#c4` | `mesAbono`, cabecera del Mes, pegar el planning, «‹ Ajustes» |
| C5 Comer | 500-509 | `maquetas/competencia-b.html#c5` | Comer · Plan (margen kcal/proteína, techo, plegables, «lo cambiaste») |
| C6 Hábitos/4:20 | 510-519 | `maquetas/competencia-b.html#c6` | `cnPin`/`cnTapado`, «Privado», «Esperan turno» · pasa por `/revisa-seguridad` |
| C4b Foto | 520-529 | `maquetas/competencia-b.html#c4b` | foto → `ocrListo()` → vista previa de C4; cuadrante inventado por código; tope duro al 25 % |
