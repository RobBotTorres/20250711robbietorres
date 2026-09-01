#!/usr/bin/env bash
# Builds ./dist containing exactly the files that should be public,
# then deploy with:  npx wrangler pages deploy dist --project-name=20250711robbietorres
#
# This exists because `wrangler pages deploy .` uploads EVERYTHING in the
# folder — it does not read .gitignore. Deploying the repo root previously
# published internal documents. Always deploy ./dist, never ".".
set -euo pipefail
cd "$(dirname "$0")"

rm -rf dist
mkdir -p dist/assets/portfolio dist/assets/fonts

# Pages
cp index.html llms.txt robots.txt sitemap.xml favicon.svg dist/
mkdir -p dist/services dist/qr dist/qr-code dist/work/dam-platform
cp services/index.html        dist/services/
cp qr/index.html              dist/qr/
cp qr-code/index.html         dist/qr-code/
cp work/dam-platform/index.html dist/work/dam-platform/

# Public assets
cp Robbie_Torres_Resume_2026.pdf dist/
cp assets/og-image.png assets/qr-code.svg dist/assets/
cp assets/fonts/ibm-plex-sans-latin.woff2 dist/assets/fonts/
cp assets/portfolio/*.jpg assets/portfolio/*.webp assets/portfolio/*.avif dist/assets/portfolio/

find dist -name '.DS_Store' -delete
echo "dist: $(find dist -type f | wc -l | tr -d ' ') files, $(du -sh dist | cut -f1)"
