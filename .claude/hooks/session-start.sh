#!/bin/bash
# Al arrancar una sesión de Claude Code en la web: instala las dependencias (solo Playwright) para
# que la suite y el driver de la skill verify funcionen. El Chromium ya viene en /opt/pw-browsers:
# no se descarga (PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD) y las pruebas lo usan por executablePath.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# npm install (no ci): aprovecha la caché del contenedor y es idempotente
npm install --no-audit --no-fund --loglevel=error

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  grep -q PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD "$CLAUDE_ENV_FILE" 2>/dev/null || \
    echo 'export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1' >> "$CLAUDE_ENV_FILE"
fi
