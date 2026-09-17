#!/usr/bin/env bash
# PreToolUse(Bash): si el comando es un `git commit`, no dejes commitear un JS roto.
# Motivo: en una sola sesión se rompió la sintaxis de app.js tres veces (comillas mal
# cerradas, un paréntesis de menos en un ternario anidado y un \b que Python convirtió
# en un carácter de retroceso). Cada una costó un ciclo entero de pruebas para nada.
set -u
entrada=$(cat)
cmd=$(printf '%s' "$entrada" | sed -n 's/.*"command"[[:space:]]*:[[:space:]]*"\(.*\)/\1/p')
case "$cmd" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
malos=""
for f in app.js sw.js tests/*.js; do
  [ -f "$f" ] || continue
  node --check "$f" >/dev/null 2>&1 || malos="$malos $f"
done

# el retroceso 0x08 dentro de una expresión regular es \b mal escapado al generar el archivo
if [ -f app.js ] && grep -qP '\x08' app.js 2>/dev/null; then
  malos="$malos app.js(caracteres de retroceso: un \\b de una expresión regular mal escrito)"
fi

if [ -n "$malos" ]; then
  echo "Commit bloqueado: sintaxis rota en$malos. Arréglalo y vuelve a intentarlo." >&2
  exit 2
fi
exit 0
