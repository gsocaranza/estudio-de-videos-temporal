#!/usr/bin/env bash
# Renderiza una pieza de HyperFrames a public/clips/<nombre>.webm (con alfa),
# para que Remotion la monte encima de sus escenas con <OffthreadVideo transparent>.
#
# Uso: bash herramientas/hyperframes.sh <composicion>     (p. ej. isotipo-cierre)
#      → lee hyperframes/compositions/<composicion>.html
#      bash herramientas/hyperframes.sh <composicion> <salida> '<variables JSON>'
#      → la misma pieza con otras variables, en public/clips/<salida>.webm
#        (p. ej. anio-flap anio-1817-1886 '{"desde":"1817","hasta":"1886"}')
#
# HyperFrames manda telemetría anónima de cada render: aquí va apagada. La
# versión va fija para que el resultado no cambie solo.
set -euo pipefail
cd "$(dirname "$0")/../hyperframes"
export DO_NOT_TRACK=1 HYPERFRAMES_NO_TELEMETRY=1 HYPERFRAMES_SKIP_SKILLS=1 HYPERFRAMES_NO_UPDATE_CHECK=1
nombre="$1"
salida="${2:-$1}"
mkdir -p ../public/clips
extra=()
if [ -n "${3:-}" ]; then
  printf '%s' "$3" > "/tmp/hf-vars-$salida.json"
  extra=(--variables-file "/tmp/hf-vars-$salida.json" --strict-variables)
fi
npx --yes hyperframes@0.8.166 render -c "compositions/$nombre.html" --format webm -o "../public/clips/$salida.webm" --quiet "${extra[@]}"
ffprobe -v error -show_entries format=duration -of csv=p=0 "../public/clips/$salida.webm"
