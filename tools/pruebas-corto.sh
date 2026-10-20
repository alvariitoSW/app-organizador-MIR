#!/usr/bin/env bash
# LAS PRUEBAS, EN CORTO: corre los bancos de pruebas y enseña solo lo que importa —lo que falla, los
# errores y una línea de resumen por banco—. Una suite en verde son ~800 líneas de PASS que no dicen
# nada; leídas enteras gastan contexto en cada pasada. El registro completo se guarda en
# .claude/.ultima-suite.log por si hace falta mirarlo.
#
#   tools/pruebas-corto.sh                      la suite completa, A LA VEZ (lo mismo que npm test, en corto)
#   tools/pruebas-corto.sh tests/frases.test.js uno o varios bancos sueltos
#   tools/pruebas-corto.sh --solo 274 320       solo esas pruebas de regression (tools/pruebas-sueltas.py)
#   TROZOS=1 tools/pruebas-corto.sh             la suite completa en fila, como antes (~12 min)
#
# LA SUITE COMPLETA VA EN PARALELO: el banco grande (regression, ~11 min en fila) se parte en TROZOS seguidos
# (tools/pruebas-reparto.py) y cada trozo corre en su navegador a la vez que los demás y que los bancos pequeños.
# Tarda lo que el trozo más largo (~5 min en vez de ~12). Solo se corta donde las pruebas arrancan solas, así que
# ninguna cadena de pruebas se rompe. Las del arranque (antes de la 1) van en cada trozo: por eso salen unas pocas más.
#
# A diferencia de npm test, no para en el primer banco que falla: los pasa todos y sale con 1 si alguno falló.
set -u
cd "$(dirname "$0")/.." || exit 1
LOG=.claude/.ultima-suite.log
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
if [ "${1:-}" = "--solo" ]; then
  shift
  [ $# -gt 0 ] || { echo "uso: tools/pruebas-corto.sh --solo 274 320 …"; exit 2; }
  python3 tools/pruebas-sueltas.py "$@" || exit 2
  trap 'rm -f tests/zz-sueltas.test.js; rm -rf test-results "$TMP"' EXIT
  set -- tests/zz-sueltas.test.js
fi
PEQUENOS=(tests/frases.test.js tests/compartir.test.js tests/enlaces.test.js tests/actualiza.test.js
  tests/worker-recetas.test.mjs tests/worker-calendario.test.mjs)
TROZOS=${TROZOS:-3}
BANCOS=("$@")
EN_PARALELO=0
if [ ${#BANCOS[@]} -eq 0 ]; then
  if [ "$TROZOS" -gt 1 ]; then
    EN_PARALELO=1
    python3 tools/pruebas-reparto.py "$TROZOS" > "$TMP/reparto.txt" || exit 2
    trap 'rm -f tests/zz-trozo-*.test.js; rm -rf "$TMP"' EXIT
  else
    BANCOS=(tests/regression.test.js "${PEQUENOS[@]}")
  fi
fi
: > "$LOG"
mal=0
# corre un banco y deja su salida, su código y sus segundos en $TMP/<nombre>.{out,cod,seg}
corre() {
  local b=$1 n; n=$(basename "$b" | sed -E 's/\.test\.m?js$//'); local ini; ini=$(date +%s)
  node "$b" > "$TMP/$n.out" 2>&1; echo $? > "$TMP/$n.cod"; echo $(( $(date +%s) - ini )) > "$TMP/$n.seg"
}
# lo que falla de una salida, cortado a 600 caracteres por línea; y si la suite se cayó, dónde y esperando qué
fallos() {
  grep -E '^(FAIL|✗)|^Errores de JavaScript|ha fallado al ejecutarse|waiting for locator|^[A-Za-z]*Error:' "$1" | cut -c1-600 | sed 's/^/   /' | head -40
  grep -E '^\s+at .*tests/[^ ]+\.m?js:[0-9]+' "$1" | head -2 | sed 's/^ */   /'
}
resumen() { grep -E '^[0-9]+/[0-9]+ .*OK$' "$1" | tail -1; }
informe() {   # una línea por banco, y lo que falla debajo
  local b=$1 n; n=$(basename "$b" | sed -E 's/\.test\.m?js$//')
  local cod; cod=$(cat "$TMP/$n.cod"); local seg; seg=$(cat "$TMP/$n.seg"); local res; res=$(resumen "$TMP/$n.out")
  { echo "===== $b (salida $cod, ${seg} s)"; cat "$TMP/$n.out"; } >> "$LOG"
  if [ "$cod" -eq 0 ]; then echo "✓ $n: ${res:-sin resumen} (${seg} s)"
  else mal=1; echo "✗ $n: ${res:-no llegó al resumen} (${seg} s)"; fallos "$TMP/$n.out"; fi
}
if [ $EN_PARALELO -eq 1 ]; then
  ini=$(date +%s)
  for t in tests/zz-trozo-*.test.js; do corre "$t" & done
  ( for b in "${PEQUENOS[@]}"; do corre "$b"; done ) &
  wait
  total=$(( $(date +%s) - ini ))
  # el banco grande, sumando sus trozos
  ok=0; de=0; peor=0; caidos=""
  for t in tests/zz-trozo-*.test.js; do
    n=$(basename "$t" | sed -E 's/\.test\.m?js$//'); r=$(resumen "$TMP/$n.out")
    { echo "===== $t (salida $(cat "$TMP/$n.cod"), $(cat "$TMP/$n.seg") s)"; cat "$TMP/$n.out"; } >> "$LOG"
    [ "$(cat "$TMP/$n.seg")" -gt "$peor" ] && peor=$(cat "$TMP/$n.seg")
    if [ -n "$r" ]; then ok=$(( ok + ${r%%/*} )); x=${r#*/}; de=$(( de + ${x%% *} )); else caidos="$caidos $n"; fi
    [ "$(cat "$TMP/$n.cod")" -eq 0 ] || { mal=1; echo "   en $n:"; fallos "$TMP/$n.out"; }
  done
  ntr=$(ls tests/zz-trozo-*.test.js | wc -l)
  if [ "$ok" -eq "$de" ] && [ -z "$caidos" ]; then echo "✓ regression: $ok/$de pruebas OK ($ntr trozos a la vez, el más largo ${peor} s)"
  else mal=1; echo "✗ regression: $ok/$de pruebas OK${caidos:+ · no llegaron al final:$caidos} ($ntr trozos, el más largo ${peor} s)"; fi
  for b in "${PEQUENOS[@]}"; do informe "$b"; done
  echo "Tiempo total: ${total} s"
else
  for b in "${BANCOS[@]}"; do
    [ -f "$b" ] || { echo "✗ no existe: $b"; mal=1; continue; }
    corre "$b"; informe "$b"
  done
fi
[ $mal -eq 0 ] && echo "Todo en verde." || echo "Hay fallos. Registro entero: $LOG"
exit $mal
