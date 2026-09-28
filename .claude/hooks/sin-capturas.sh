#!/usr/bin/env bash
# PreToolUse(Bash): no dejes que una captura personal (Fintonic, banco…) acabe en git.
# Solo se permiten imágenes nuevas en maquetas/ y design/, más los iconos de la raíz.
set -u
cmd=$(jq -r '.tool_input.command // empty' 2>/dev/null)
case "$cmd" in
  *"git add"*|*"git commit"*) ;;
  *) exit 0 ;;
esac
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
{
  git diff --cached --name-only --diff-filter=A
  # lo que un `git add .` / `-A` metería: sin seguimiento y no ignorado
  git ls-files --others --exclude-standard
} 2>/dev/null | sort -u \
  | grep -iE '\.(png|jpe?g|webp|heic|heif|gif|bmp|pdf)$' \
  | grep -vE '^(maquetas|design)/|^(apple-touch-icon|icon|favicon)[^/]*$' > /tmp/.sin-capturas.$$ 
if [ -s /tmp/.sin-capturas.$$ ]; then
  {
    echo "Bloqueado: hay imágenes fuera de maquetas/ o design/ que podrían subirse:"
    sed 's/^/  · /' /tmp/.sin-capturas.$$
    echo "Si son capturas del usuario (datos personales), bórralas o añádelas a .gitignore."
    echo "Si son maquetas, muévelas a maquetas/."
  } >&2
  rm -f /tmp/.sin-capturas.$$
  exit 2
fi
rm -f /tmp/.sin-capturas.$$
exit 0
