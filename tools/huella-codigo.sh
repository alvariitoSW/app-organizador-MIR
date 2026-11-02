#!/usr/bin/env bash
# Huella del código que prueba la suite (app, service worker, página, estilos, figuras y pruebas).
# La escribe tools/pruebas-corto.sh tras una suite completa en verde y la compara el hook sella-antes-de-main.
cd "$(dirname "$0")/.." || exit 1
{ ls app.js sw.js index.html styles.css 2>/dev/null; git ls-files fig tests | grep -v '/zz-'; } | sort | xargs cat 2>/dev/null | sha1sum | cut -c1-40
