#!/usr/bin/env bash
# LAS PRUEBAS, EN CORTO: corre los bancos de pruebas y enseña solo lo que importa —lo que falla, los
# errores y una línea de resumen por banco—. Una suite en verde son ~800 líneas de PASS que no dicen
# nada; leídas enteras gastan contexto en cada pasada. El registro completo se guarda en
# .claude/.ultima-suite.log por si hace falta mirarlo.
#
#   tools/pruebas-corto.sh                      la suite completa (lo mismo que npm test, en corto)
#   tools/pruebas-corto.sh tests/frases.test.js uno o varios bancos sueltos
#
# A diferencia de npm test, no para en el primer banco que falla: los pasa todos y sale con 1 si alguno falló.
set -u
cd "$(dirname "$0")/.." || exit 1
LOG=.claude/.ultima-suite.log
BANCOS=("$@")
[ ${#BANCOS[@]} -gt 0 ] || BANCOS=(tests/regression.test.js tests/frases.test.js tests/compartir.test.js tests/enlaces.test.js
  tests/actualiza.test.js tests/worker-recetas.test.mjs tests/worker-calendario.test.mjs)
: > "$LOG"
mal=0
for b in "${BANCOS[@]}"; do
  [ -f "$b" ] || { echo "✗ no existe: $b"; mal=1; continue; }
  ini=$(date +%s)
  salida=$(node "$b" 2>&1); cod=$?
  seg=$(( $(date +%s) - ini ))
  { echo "===== $b (salida $cod, ${seg} s)"; printf '%s\n' "$salida"; } >> "$LOG"
  # el resumen de cada banco es su última línea «N/M … OK»
  res=$(printf '%s\n' "$salida" | grep -E '^[0-9]+/[0-9]+ .*OK$' | tail -1)
  nombre=$(basename "$b" | sed -E 's/\.test\.m?js$//')
  if [ $cod -eq 0 ]; then
    echo "✓ $nombre: ${res:-sin resumen} (${seg} s)"
  else
    mal=1
    echo "✗ $nombre: ${res:-no llegó al resumen} (${seg} s)"
    # lo que falla, cortado a 600 caracteres por línea; y si la suite se cayó, dónde y esperando qué
    printf '%s\n' "$salida" | grep -E '^(FAIL|✗)|^Errores de JavaScript|ha fallado al ejecutarse|waiting for locator|^[A-Za-z]*Error:' | cut -c1-600 | sed 's/^/   /' | head -40
    printf '%s\n' "$salida" | grep -E '^\s+at .*tests/[^ ]+\.m?js:[0-9]+' | head -2 | sed 's/^ */   /'
  fi
done
[ $mal -eq 0 ] && echo "Todo en verde." || echo "Hay fallos. Registro entero: $LOG"
exit $mal
