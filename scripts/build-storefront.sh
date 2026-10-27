#!/usr/bin/env sh
# Storefront-JS > dist (Shopware lädt im Shop nur dist/storefront/js/<plugin>/<plugin>.js, kein Node nötig)
#   sh scripts/build-storefront.sh          schreibt die dist-Datei neu
#   sh scripts/build-storefront.sh --check  prüft nur, ob dist zur Quelle passt (CI)
set -eu

src="src/Resources/app/storefront/src/js/mt-notification-center.js"
out="src/Resources/app/storefront/dist/storefront/js/micha-theme-v5/micha-theme-v5.js"
tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT

# Kopf + Quelle, sonst nix (kein Minify, bleibt lesbar)
{
  echo "/* MichaThemeV5: automatisch erzeugt aus ${src}. Nicht von Hand ändern, sondern: sh scripts/build-storefront.sh */"
  cat "$src"
} > "$tmp"

if [ "${1:-}" = "--check" ]; then
  [ -f "$out" ] || { echo "Fehlt: $out (bitte sh scripts/build-storefront.sh ausführen)" >&2; exit 1; }
  cmp -s "$tmp" "$out" || { echo "dist ist veraltet (bitte sh scripts/build-storefront.sh ausführen und committen)" >&2; exit 1; }
  echo "Storefront-dist ist aktuell"
  exit 0
fi

mkdir -p "$(dirname "$out")"
cp "$tmp" "$out"
echo "Storefront-Paket erstellt: $out"
