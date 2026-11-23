#!/usr/bin/env bash
# El render final de un video: 1080p, y el audio normalizado a -16 LUFS
# (lo que esperan YouTube, WhatsApp y los reproductores del teléfono; sin esto
# el video suena más bajo que cualquier otro que se abra después).
#
# Uso: bash herramientas/final.sh <video>     → out/<video>.mp4
#      ENTRADA=src/bolanos/index.ts bash herramientas/final.sh registro-bolanos
#      LUFS=-14 bash herramientas/final.sh las-ocho-horas     (cortos para redes: nivelan a -14)
set -euo pipefail
cd "$(dirname "$0")/.."
video="$1"
mkdir -p out
# ENTRADA elige otro punto de entrada (un video con tema, p. ej. src/bolanos/index.ts)
npx remotion render "${ENTRADA:-src/index.ts}" "$video" "out/$video.crudo.mp4" --concurrency=4
ffmpeg -v error -y -i "out/$video.crudo.mp4" -c:v copy \
  -af "loudnorm=I=${LUFS:--16}:TP=-1.5:LRA=11" -c:a aac -b:a 192k "out/$video.mp4"
rm "out/$video.crudo.mp4"
# la versión ligera (720p) sólo si se pide: LIGERO=1. El supervisor quiere
# una sola versión, la completa (2026-10-19).
if [ "${LIGERO:-0}" = "1" ]; then
  # el lado largo a 1280: en horizontal es el ancho, en vertical el alto
  ffmpeg -v error -y -i "out/$video.mp4" -vf "scale='if(gt(iw,ih),1280,-2)':'if(gt(iw,ih),-2,1280)'" -c:v libx264 -crf 27 -preset slow   -c:a aac -b:a 128k -movflags +faststart "out/$video-ligero.mp4"
fi
# VERSION=5 guarda además una copia que no se sobrescribe nunca: out/historial/<video>-v5.mp4
# (el supervisor quiere ver el historial de versiones, 2026-10-19)
if [ -n "${VERSION:-}" ]; then
  mkdir -p out/historial
  if [ -e "out/historial/$video-v$VERSION.mp4" ]; then echo "Ya existe out/historial/$video-v$VERSION.mp4: no se sobrescribe" >&2; else cp "out/$video.mp4" "out/historial/$video-v$VERSION.mp4"; fi
fi
for f in out/"$video".mp4 out/"$video"-ligero.mp4; do
  [ -f "$f" ] || continue
  printf '%s  ' "$f"; ffprobe -v error -show_entries format=duration,size -of csv=p=0 "$f"
done
