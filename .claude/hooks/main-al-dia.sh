#!/usr/bin/env bash
# PreToolUse(Bash): antes de la suite COMPLETA (`npm run test:corto` o `tools/pruebas-corto.sh` sin bancos ni --solo),
# comprueba que la rama tiene todo lo de origin/main. Si main va por delante, la suite verde no vale: al juntar
# saldrán conflictos y pruebas renumeradas (R6, 30/10: +0,8 M). Lista «Terminado», punto 1 (Consejo 02/11/2026).
set -u
cmd=$(jq -r '.tool_input.command // empty' 2>/dev/null)
printf '%s' "$cmd" | grep -qE '(^|[;&|(]|&&)[[:space:]]*(npm run test:corto|(bash )?(\./)?tools/pruebas-corto\.sh)[[:space:]]*($|[;&|)])' || exit 0
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
timeout 15 git fetch -q origin main 2>/dev/null || exit 0   # sin red no se bloquea
n=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo 0)
[ "$n" -gt 0 ] || exit 0
{
  echo "main va $n commit(s) por delante de esta rama: la suite completa no vale hasta juntarlo."
  echo "Haz \`git merge origin/main\` (pruebas nuevas numeradas detrás de las de main) y vuelve a lanzarla."
} >&2
exit 2
