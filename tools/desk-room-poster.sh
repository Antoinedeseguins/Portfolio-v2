#!/usr/bin/env bash
# Remakes the pictures of the home page's desk room shown until it is ready (three.js/about/desk-room-poster-1x.webp and
# -2x.webp). Run it after changing how the room looks at rest. Needs the site served by Live Server on port 5500.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
chrome="/c/Program Files/Google/Chrome/Application/chrome.exe"
url="http://127.0.0.1:5500/tools/desk-room-poster.html"
profile="$(mktemp -d)"
trap 'rm -rf "$profile"' EXIT

for scale in 1 2; do
  out="$root/three.js/about/desk-room-poster-${scale}x.webp"
  # Run from the temp folder, where Chrome drops its debug.log.
  (cd "$profile" && "$chrome" --headless=new --use-angle=d3d11 --enable-gpu --hide-scrollbars --window-size=900,900 \
    --force-device-scale-factor="$scale" --user-data-dir="$profile/chrome" --virtual-time-budget=20000 --dump-dom "$url" 2>/dev/null) \
    | sed -n 's/.*<pre id="picture">data:image\/webp;base64,\([^<]*\)<\/pre>.*/\1/p' | base64 -d > "$out"
  [ -s "$out" ] || { echo "No picture at ${scale}x: is Live Server running on port 5500?" >&2; exit 1; }
  echo "$out ($(wc -c < "$out") bytes)"
done
