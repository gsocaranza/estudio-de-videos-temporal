# -*- coding: utf-8 -*-
"""
Parte el isotipo en sus rayos para poder animarlos uno por uno.

    python herramientas/rayos-del-isotipo.py ../resources/svg/isotipo.svg src/videos/presentacion-asistencia/rayos.ts

Cada subtrazo (de una M a su Z) es un rayo; se guarda con su centro, para que la
animación sepa desde qué dirección llega.
"""
import json
import re
import sys


def main():
    origen, destino = sys.argv[1], sys.argv[2]
    svg = open(origen, encoding="utf-8").read()
    rayos = []
    for d in re.findall(r'\sd="([^"]+)"', svg):
        for trozo in re.findall(r"M[^M]+", d):
            cifras = [float(c) for c in re.findall(r"-?\d+\.?\d*", trozo)]
            xs, ys = cifras[0::2], cifras[1::2]
            # sólo los que son pares limpios: H y V desordenan la cuenta, así que el centro es aproximado
            cx, cy = sum(xs) / len(xs), sum(ys) / len(ys)
            rayos.append({"d": trozo.strip(), "x": round(cx, 3), "y": round(cy, 3)})
    with open(destino, "w", encoding="utf-8", newline="\n") as f:
        f.write("/** Los rayos del isotipo, generados por herramientas/rayos-del-isotipo.py. */\n")
        f.write("export const LADO_ISOTIPO = 29.2559;\n")
        f.write("export const RAYOS: {d: string; x: number; y: number}[] = ")
        f.write(json.dumps(rayos, ensure_ascii=False))
        f.write(";\n")
    print(len(rayos), "rayos")


main()
