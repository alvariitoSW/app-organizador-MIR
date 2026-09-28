#!/usr/bin/env bash
# Stop: si en este turno se ha editado app.js o sw.js, pasa las pruebas rápidas
# (compartir + enlaces, ~20 s) antes de dar el turno por terminado.
# La suite grande (regression, ~3 min) y actualiza (~50 s) siguen siendo manuales.
set -u
entrada=$(cat)
dir="${CLAUDE_PROJECT_DIR:-.}"
marca="$dir/.claude/.pruebas-pendientes"
[ -f "$marca" ] || exit 0
cd "$dir" || exit 0
if salida=$(node tests/compartir.test.js 2>&1 && node tests/enlaces.test.js 2>&1); then
  rm -f "$marca"
  exit 0
fi
# segunda vuelta seguida: no encierres a Claude en un bucle, avisa y suelta
if printf '%s' "$entrada" | jq -e '.stop_hook_active == true' >/dev/null 2>&1; then
  rm -f "$marca"
  echo '{"systemMessage":"Las pruebas rápidas (compartir/enlaces) siguen fallando."}'
  exit 0
fi
printf 'Las pruebas rápidas fallan tras editar app.js/sw.js:\n%s\n' "$(printf '%s' "$salida" | tail -15)" >&2
exit 2
