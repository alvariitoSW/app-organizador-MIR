#!/usr/bin/env bash
# PostToolUse(Edit|Write sobre tests/): avisa si las líneas AÑADIDAS usan el reloj real (`new Date()`, `Date.now()`)
# sin fijarlo. Esas pruebas caen un día 1, un 31 o de noche (chef-ch2-main 1,8 M; suite-fecha-fija 0,62 M).
# Lista «Terminado», punto 4 (Consejo 02/11/2026). Solo avisa: no deshace nada.
set -u
f=$(jq -r '.tool_input.file_path // .tool_response.filePath // empty' 2>/dev/null)
case "$f" in */tests/*.js|*/tests/*.mjs) ;; *) exit 0 ;; esac
case "$f" in */zz-*) exit 0 ;; esac
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
nuevas=$(git diff -U0 -- "$f" 2>/dev/null \
  | grep -E '^\+[^+]' | grep -E 'new Date\(\)|Date\.now\(\)' | grep -vE 'fijaHoy|FECHA_FIJA|reloj-real-a-proposito' | head -5)
[ -z "$nuevas" ] && exit 0
{
  echo "Prueba con el reloj real en $f:"
  printf '%s\n' "$nuevas" | cut -c1-160 | sed 's/^/  /'
  echo "Si mira el día, el mes o la hora, fija la fecha con \`await fijaHoy()\` al empezar el bloque."
  echo "Si de verdad no depende del día, añade el comentario «reloj-real-a-proposito» en esa línea."
} >&2
exit 2
