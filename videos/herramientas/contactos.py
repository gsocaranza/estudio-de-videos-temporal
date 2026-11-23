# -*- coding: utf-8 -*-
"""
La hoja de contacto de un borrador: un cuadro de cada escena en una sola
imagen, para revisar el video entero de un vistazo (es como lo revisa Claude,
que no puede verlo correr).

Uso:  python herramientas/contactos.py <video> <borrador.mp4> <salida.png> [--en 0.3]
      python herramientas/contactos.py <video> <borrador.mp4> <salida.png> --cada 0.5 --escena 06c-rostro
      Un corto vertical se revisa con la zona segura pintada: el borrador se renderiza con
      --props='{"guia":true}' y esta hoja la enseña tal cual.

`--en` dice en qué punto de cada escena se toma el cuadro (0.5 = la mitad,
por omisión). Con `--cada S --escena ID` saca un cuadro cada S segundos de esa
escena, que es la revisión fina del brief (el tutorial de Remotion +
HyperFrames revisa un cuadro cada medio segundo). Para ver los momentos anclados, correrla dos o tres veces con
puntos distintos. La línea de tiempo se rehace con las mismas cuentas que
src/kit/linea.ts: respiro + voz + cola.
"""
import json
import math
import os
import subprocess
import sys
import tempfile

RESPIRO, COLA, FPS = 12, 16, 30


def ritmo_de(video):
    """El respiro y la cola por omisión, si el video los cambia (los cortos:
    `RITMO = {respiro: 3, cola: 4}` en su linea.ts)."""
    import re
    raiz = os.path.join(os.path.dirname(__file__), "..", "src", "videos", video)
    for carpeta, _, archivos in os.walk(raiz):
        for nombre in archivos:
            texto = open(os.path.join(carpeta, nombre), encoding="utf-8").read()
            m = re.search(r"respiro:\s*(\d+),\s*cola:\s*(\d+)", texto)
            if m:
                return int(m.group(1)), int(m.group(2))
    return RESPIRO, COLA


def colas_de(video):
    """Las colas especiales se leen de donde el video arma su línea de tiempo
    (`arma(…)` o `usaVoz(…)`): cualquier archivo de src/ que importe su
    duraciones.json. Así no se repiten aquí."""
    import re
    raiz = os.path.join(os.path.dirname(__file__), "..", "src")
    for carpeta, _, archivos in os.walk(raiz):
        for nombre in archivos:
            texto = open(os.path.join(carpeta, nombre), encoding="utf-8").read()
            if f"public/{video}/duraciones.json" not in texto:
                continue
            m = re.search(r"(?:arma|usaVoz)\([^{]*\{([^}]*)\}", texto)
            if m:
                return {k: int(v) for k, v in re.findall(r"'([^']+)':\s*(\d+)", m.group(1))}
    return {}


def main():
    video, mp4, salida = sys.argv[1:4]
    mp4, salida = os.path.abspath(mp4), os.path.abspath(salida)
    en = float(sys.argv[sys.argv.index("--en") + 1]) if "--en" in sys.argv else 0.5
    base = os.path.join(os.path.dirname(__file__), "..", "public", video)
    duraciones = json.load(open(os.path.join(base, "duraciones.json"), encoding="utf-8"))
    colas = colas_de(video)
    respiro, cola = ritmo_de(video)
    ancho_v, alto_v = (int(x) for x in subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v", "-show_entries", "stream=width,height", "-of", "csv=p=0", mp4],
        capture_output=True, text=True, check=True).stdout.strip().split(",")[:2])
    vertical = alto_v > ancho_v
    # cada cuadro de la hoja: 640 de ancho en horizontal, 360 en vertical
    tw = 360 if vertical else 640
    th = round(tw * alto_v / ancho_v / 2) * 2

    cada = float(sys.argv[sys.argv.index("--cada") + 1]) if "--cada" in sys.argv else None
    escena = sys.argv[sys.argv.index("--escena") + 1] if "--escena" in sys.argv else None
    cuadros, desde = [], 0
    for ident, voz in duraciones.items():
        n = respiro + math.ceil(voz * FPS) + colas.get(ident, cola)
        if cada and ident == escena:
            paso = max(1, round(cada * FPS))
            cuadros += [(f"{ident} {k / FPS:.1f}s", desde + k) for k in range(0, n, paso)]
        elif not cada:
            cuadros.append((ident, desde + int(n * en)))
        desde += n
    if cada and not cuadros:
        sys.exit(f"No hay escena {escena}")

    # drawtext lee la fuente por ruta relativa: se corre desde videos/
    os.chdir(os.path.join(os.path.dirname(__file__), ".."))
    tmp = tempfile.mkdtemp()
    fotos = []
    for i, (ident, cuadro) in enumerate(cuadros):
        foto = os.path.join(tmp, f"{i:02d}.png")
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", mp4, "-vf",
             f"select=eq(n\\,{cuadro}),scale={tw}:{th},drawtext=fontfile=public/fuentes/tasa-orbiter-600.ttf:"
             f"text='{ident}':x=8:y=8:fontsize={18 if vertical else 22}:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=6",
             "-frames:v", "1", foto],
            check=True,
        )
        fotos.append(foto)
    columnas = (5 if len(cuadros) <= 10 else 6) if vertical else (3 if len(cuadros) <= 12 else 4)
    filas = math.ceil(len(fotos) / columnas)
    while len(fotos) < columnas * filas:
        vacia = os.path.join(tmp, f"vacia{len(fotos)}.png")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=0xF2F1EF:s={tw}x{th}",
                        "-frames:v", "1", vacia], check=True)
        fotos.append(vacia)
    entradas = sum((["-i", f] for f in fotos), [])
    acomodo = "|".join(f"{(i % columnas) * tw}_{(i // columnas) * th}" for i in range(len(fotos)))
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", *entradas, "-filter_complex",
         f"xstack=inputs={len(fotos)}:layout={acomodo}", salida],
        check=True,
    )
    print(salida)


if __name__ == "__main__":
    main()
