#!/usr/bin/env bash
# PostToolUse(Edit|Write sobre app.js): recuerda la trampa de los dos switches.
# La app tiene DOS despachadores de acciones:
#   - act(), colgado de document.addEventListener('click')  -> botones
#   - otro switch dentro de document.addEventListener('change') -> select, input, ficheros
# Un `case` en el switch equivocado NO da error: simplemente no se ejecuta nunca.
# Ya ha mordido dos veces (franja-cfg, franja-reset, ir-servicios, mes-cfg en uno;
# svc-meses y lista-nombre en el otro).
set -u
entrada=$(cat)
printf '%s' "$entrada" | grep -q 'app\.js' || exit 0
printf '%s' "$entrada" | grep -q "case '" || exit 0
cat >&2 <<'AVISO'
Recordatorio: app.js tiene DOS switches de acciones.
  · botones (click)                  -> act()
  · select / input / fichero (change) -> el switch del listener de 'change'
Un `case` en el equivocado no falla, simplemente no ocurre nunca.
Comprueba que el caso nuevo está en el switch que le toca y pruébalo pulsándolo de verdad.
AVISO
exit 0
