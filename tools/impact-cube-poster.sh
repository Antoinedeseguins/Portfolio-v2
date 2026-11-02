#!/usr/bin/env bash
# Remakes the pictures of Impact's magnetic cube shown until it is ready (three.js/impact/cube-poster-1x.png and
# -1.75x.png, the cube's own top density). Run it after changing how the cube looks at rest or where it sits. Needs the
# site served by Live Server on port 5500.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
chrome="/c/Program Files/Google/Chrome/Application/chrome.exe"
url="http://127.0.0.1:5500/tools/impact-cube-poster.html"
profile="$(mktemp -d)"
trap 'rm -rf "$profile"' EXIT

for scale in 1 1.75; do
  out="$root/three.js/impact/cube-poster-${scale}x.png"
  # Run from the temp folder, where Chrome drops its debug.log.
  (cd "$profile" && "$chrome" --headless=new --use-angle=d3d11 --enable-gpu --hide-scrollbars --window-size=1400,300 \
    --force-device-scale-factor="$scale" --user-data-dir="$profile/chrome" --virtual-time-budget=20000 --dump-dom "$url" 2>/dev/null) \
    | sed -n 's/.*<pre id="picture">data:image\/png;base64,\([^<]*\)<\/pre>.*/\1/p' | base64 -d > "$out"
  [ -s "$out" ] || { echo "No picture at ${scale}x: is Live Server running on port 5500?" >&2; exit 1; }
  echo "$out ($(wc -c < "$out") bytes)"
done
