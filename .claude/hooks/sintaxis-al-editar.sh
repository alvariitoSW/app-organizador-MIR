#!/usr/bin/env bash
# PostToolUse(Edit|Write): en cuanto se toca app.js, sw.js o una prueba, `node --check`.
# Si está roto, devuelve el error al momento (exit 2) en vez de descubrirlo al commitear.
# Además deja una marca para que el hook de Stop pase las pruebas rápidas antes de acabar.
set -u
f=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2>/dev/null)
case "$f" in
  */app.js|*/sw.js) marca=1 ;;
  */tests/*.js|*/tests/*.mjs) marca=0 ;;
  *) exit 0 ;;
esac
[ -f "$f" ] || exit 0
if ! err=$(node --check "$f" 2>&1); then
  printf 'Sintaxis rota en %s:\n%s\n' "$f" "$(printf '%s' "$err" | head -8)" >&2
  exit 2
fi
if [ "$marca" = 1 ]; then touch "${CLAUDE_PROJECT_DIR:-.}/.claude/.pruebas-pendientes"; fi
exit 0
