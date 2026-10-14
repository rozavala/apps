#!/usr/bin/env bash
# Local preview of the static site, bound to 127.0.0.1 only.
#
#   tools/preview.sh             # http://127.0.0.1:8091
#   tools/preview.sh --tailnet   # also https://<host>.<tailnet>.ts.net:8091 (tailnet only)
#   PORT=8092 tools/preview.sh
#
# Serves a copy of the public files (HTML, js/, css/, icons/, tracked data/),
# never the repo root: no .git, no docs, no vps/, no untracked data/ (on the
# production checkout data/ holds the family's live sync data).
# The copy is a snapshot: re-run after editing. Ctrl-C stops the server and
# removes the tailnet mapping.
set -euo pipefail

PORT="${PORT:-8091}"
TAILNET=0
[ "${1:-}" = "--tailnet" ] && TAILNET=1

ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
OUT="${TMPDIR:-/tmp}/zs-preview-$PORT"

rm -rf "$OUT"
mkdir -p "$OUT"
{
  git -C "$ROOT" ls-files -co --exclude-standard \
    | grep -E '^([^/]+\.html|sw\.js|manifest\.json|(js|css|icons)/.+)$'
  git -C "$ROOT" ls-files data/
} | rsync -a --files-from=- "$ROOT/" "$OUT/"

if [ "$TAILNET" = 1 ]; then
  tailscale serve --bg --https="$PORT" "http://127.0.0.1:$PORT" >/dev/null
  trap 'tailscale serve --https="$PORT" off >/dev/null 2>&1 || true' EXIT
  echo "Tailnet: $(tailscale serve status | grep -o "https://[^ ]*:$PORT")"
fi

cd "$OUT"
"$ROOT/node_modules/.bin/http-server" -a 127.0.0.1 -p "$PORT" -c-1 -d false -s &
SERVER=$!
trap 'kill $SERVER 2>/dev/null; [ "$TAILNET" = 1 ] && tailscale serve --https="$PORT" off >/dev/null 2>&1; true' EXIT INT TERM
echo "Local:   http://127.0.0.1:$PORT  (serving $OUT)"
wait $SERVER
