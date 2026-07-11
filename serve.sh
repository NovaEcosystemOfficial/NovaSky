#!/usr/bin/env bash
# Avvia il server locale dalla cartella website (path corretti per Mission Map).
cd "$(dirname "$0")/website"
echo "NovaSky → http://localhost:${1:-8080}/pages/mission-map.html"
exec python3 -m http.server "${1:-8080}"
