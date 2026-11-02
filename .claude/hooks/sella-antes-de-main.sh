#!/usr/bin/env bash
# PreToolUse(Bash): antes de `git push … main`, comprueba que version.json está sellado.
# Sin sello, el móvil no se entera de que hay versión nueva y no se actualiza.
# Cuenta como «sin sellar» cualquier cambio posterior al último commit de version.json
# que no sea solo de pruebas, maquetas, diseño, .claude/ o documentación.
# Y exige la suite completa en verde sobre el código que sube (ver abajo).
set -u
cmd=$(jq -r '.tool_input.command // empty' 2>/dev/null)
# solo un `git push` de verdad (inicio de comando), no el texto dentro de un echo
printf '%s' "$cmd" | grep -qE '(^|[;&|(]|&&)[[:space:]]*git push[^;&|]*\bmain\b' || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
sello=$(git log -1 --format=%H -- version.json 2>/dev/null)
[ -n "$sello" ] || exit 0
pendientes=$(git diff --name-only "$sello" HEAD 2>/dev/null \
  | grep -vE '^(tests|maquetas|design|\.claude|tools)/|\.md$|^version\.json$|^\.gitignore$')
# Lista «Terminado», punto 2 (Consejo 02/11/2026): si sube código, la suite COMPLETA tiene que haber pasado en
# verde sobre este mismo código (huella en .claude/.suite-verde, la escribe tools/pruebas-corto.sh).
codigo=$(git diff --name-only origin/main HEAD 2>/dev/null \
  | grep -vE '^(maquetas|design|\.claude|tools)/|\.md$|^version\.json$|^\.gitignore$')
if [ -n "$codigo" ] && [ "$(cat .claude/.suite-verde 2>/dev/null)" != "$(tools/huella-codigo.sh)" ]; then
  echo "Push a main sin la suite completa en verde sobre este código: pasa \`npm run test:corto\` (entera) y vuelve a pushear." >&2
  exit 2
fi
[ -z "$pendientes" ] && exit 0
{
  echo "Push a main sin sellar: hay cambios después del último version.json:"
  printf '%s\n' "$pendientes" | head -10 | sed 's/^/  · /'
  echo "Haz \`npm run sella\`, commitea version.json y vuelve a pushear."
} >&2
exit 2
