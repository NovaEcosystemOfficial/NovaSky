#!/usr/bin/env bash
# Avvia il server locale dalla cartella website (path corretti per asset e pagine).
cd "$(dirname "$0")/website"
PORT="${1:-8080}"
echo "NovaSky → http://localhost:${PORT}/"
echo "Mission Map → http://localhost:${PORT}/pages/mission-map.html"
exec python3 -m http.server "$PORT"
