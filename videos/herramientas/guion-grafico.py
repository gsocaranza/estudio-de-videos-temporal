"""
Mide los guiones gráficos de un plan de cortos ANTES de grabar la voz.

    python herramientas/guion-grafico.py ../docs/cortos-rh-plan.md                 # informe
    python herramientas/guion-grafico.py ../docs/cortos-rh-plan.md --detalle R1,R4 # qué se oye en cada fila
    python herramientas/guion-grafico.py ../docs/cortos-rh-plan.md --escribe       # y rellena la columna «s»

Nació en la ronda 2 de auditoría de los cortos de RH (2026-10-19): la columna
de duraciones se había estimado a ojo y sumaba la mitad de lo que dura la voz,
así que ninguna revisión en papel podía cuadrar. Aquí se modela la voz con lo
que se midió en el piloto (`las-ocho-horas`: ~2.85 palabras por segundo
dentro de la frase, por sílabas, pausas en la puntuación y ~0.5 s entre
escenas además del punto; el guion del piloto da ~62 s y la v10 mide 60.5; el
inicio de cada palabra falla ~0.17 s de media) y se calcula, para cada fila,
cuándo empieza y cuánto dura. La toma real manda: al grabar se vuelve a medir
con Whisper. Pero dos personas que leen el mismo guion gráfico ya miden lo
mismo.

En la ronda 3 se le agregó lo que el auditor de animación encontró que faltaba:
la duración y el número de PLANOS (no sólo de filas: un plano de 10 s partido
en cinco golpes pasaba limpio), que el muro deje ver lo de abajo, que un texto
no entre mucho antes de oírse, el tiempo de lectura de un golpe con texto, que
el tablero lleve un año que se oye, y las siglas y los hiatos al contar
sílabas.

En la versión 5 del plan (2026-10-20) cambió con las reglas nuevas: ya no
hay muro de palabras ni premisa en pantalla (eran piezas del piloto), los
remates con cifra se sostienen 1.5 s («launch-motion»), una fila puede durar
hasta 4 s porque nada se queda quieto (deriva y cámara), las transiciones son
las de @remotion/transitions, y el guion gráfico trae dos columnas más:
Movimiento (con la cámara) y Suena. La columna «s» es siempre la última.
Recalibrada contra R1 v7 (`la-sal`, con las pausas nuevas): el modelo da 53.6 s
para un video de 53.3, así que ENTRE_ESCENAS se queda en 0.5.

El formato que lee (por corto, bajo un «## N. Rk · Título»):

    **Pregunta:** ¿…?                          la que el corto contesta (ya no va en pantalla)

    | Escena | Voz |                           la voz, una fila por escena
    | 01-gancho | Texto de la escena. |

    | # | Ancla | Plano | Imagen | Movimiento | Suena | s |   el guion gráfico (v5)
    | 1 | 0 | — | … | … | … | |                 «0» = el cuadro 0
    | 2 | 01-gancho/regaló | golpe | … | |        escena/palabra (acentos y mayúsculas no importan)
    | 3 | 02-palabra/sal·2 | zoom | … | |         ·n = la n-ésima vez que sale en la escena

`Plano` es «golpe» (algo se agrega sin cambiar de plano) o una transición
(ver TRANSICIONES). **Un golpe que cambia la imagen entera es un corte**: eso
no lo puede ver la herramienta, y es lo primero que mira un revisor. En
`Imagen`, el texto grande va entre «…» con « / » entre renglones; los
metadatos van en MAYÚSCULAS sin comillas; un tablero se escribe «Tablero
**1888**». La columna `s` la escribe esta herramienta: «inicio · duración».
"""
import io
import re
import sys
import unicodedata

PPS = 2.85          # palabras por segundo dentro de una frase (calibrado contra el piloto: 49.7 s de habla)
SIL_POR_PAL = 2.25  # sílabas por palabra en promedio, para repartir
PAUSA = {",": 0.22, ";": 0.3, ":": 0.3, ".": 0.42, "?": 0.42, "!": 0.42, "…": 0.6}
ENTRE_ESCENAS = 0.5  # además de la pausa del punto final: silencio de pistas + cola + respiro (piloto v10)
ADELANTO = 4 / 30    # la imagen entra 4 cuadros antes que su palabra
COLA_FINAL = 0.6     # lo que se sostiene la última toma después de la voz
TRANSICIONES = {
    # las del piloto
    "corte", "barrido", "barrido-der", "empuje", "zoom", "inversión", "inversion", "destello",
    # las de @remotion/transitions y los sombreadores que ya se probaron en R1 v4–v7
    "desenfoque", "zoom-desenfoque", "cruce-zoom", "empuje-corte", "barrido-lineal", "zoom-sueño",
    "libro", "película", "fundido", "deslizar", "volteo", "reloj", "iris", "máscara", "trazo",
    # la transición propia de cada corto (ronda 5 de animación): sale de su mundo, no de R1
    "viaje", "línea", "linea", "órbita", "orbita", "escáner", "escaner", "transforma", "prensa",
    "mesa", "luz", "feed",
}
# los sombreadores de R1: como mucho una vez por corto (ronda 5)
DE_R1 = {"desenfoque", "zoom-desenfoque", "cruce-zoom", "empuje-corte", "barrido-lineal", "zoom-sueño"}
# la película mete luz naranja (vec3(1.0, 0.7, 0.6) en su sombreador): fuera de la paleta
PROHIBIDAS = {"película"}
# el cuadro 0 ya está armado: la fila 1 no «entra» (§2.2 de las reglas; ronda 5)
ENTRA = re.compile(r"\b(entra|entran|se arma|se arman|cae|caen|se dibuja|se dibujan|se traza|se trazan)\b", re.I)
MAX_RENGLON = 18     # caracteres por renglón a 88 px (era 13 a 104 px; con 13 las frases quedaban en pedazos que no se entendían sin la voz, R2 v3)
FILA_MAX = 4.0       # con deriva y cámara viva, una fila aguanta un poco más que en el piloto (3.5)
REMATE_MIN = 1.5     # una cifra o un remate se sostiene 1.5 s («launch-motion», 2026-10-20)
PLANO_MAX = 5.0      # un plano de más se siente quieto aunque lleve golpes (la v10: 2.1 s de media)
PLANOS_MIN = 16      # planos por corto (la v10 tiene 29 en 60 s)
FILA_MIN_TEXTO = 1.0  # el error del modelo es ±0.2–0.4 s: con texto nuevo, 1.0 s para planear
MURO_MIN = 1.6       # la cortinilla tapa ~0.8 s después del corte: si la fila dura menos, lo de abajo no se ve
TEXTO_ANTES = 1.5    # un texto que entra más de esto antes de oírse rompe la regla de los 4 cuadros
PREMISA_MAX = 34


def glifos_de_la_fuente():
    """Los caracteres que TASA Orbiter sí tiene (ronda 5: `→`, `⅓`, `≈`, `≠` salían en otra fuente)."""
    try:
        from fontTools.ttLib import TTFont
        import os
        ruta = os.path.join(os.path.dirname(__file__), "..", "public", "fuentes", "tasa-orbiter-700.ttf")
        return set(chr(c) for c in TTFont(ruta).getBestCmap())
    except Exception:
        return None


GLIFOS = glifos_de_la_fuente()


def normal(t):
    t = unicodedata.normalize("NFD", t.lower())
    return "".join(c for c in t if c.isalnum())


def silabas(p):
    """Sílabas de una palabra tal como se dice: siglas letra por letra, hiatos partidos."""
    if not p:
        return 0
    if p.isdigit():
        return 2 * len(p)
    if p.isupper() and len(p) <= 5:
        return round(len(p) * 1.4)  # «IBM» = i-be-e-me, «OMS» = o-e-me-ese
    p = p.lower()
    cuenta = 0
    for grupo in re.findall(r"[aeiouáéíóúü]+", p):
        cuenta += 1
        for x, y in zip(grupo, grupo[1:]):
            fuertes = "aeoáéó"
            if (x in fuertes and y in fuertes) or x in "íú" or y in "íú":
                cuenta += 1  # hiatos: «Leonardo», «día», «aún»
    return max(1, cuenta)


def palabras_de(texto):
    """Lista de (palabra, pausa_después). Los «...» cuentan como pausa larga."""
    texto = texto.replace("...", "…")
    salida = []
    for m in re.finditer(r"([\wáéíóúñü%]+)([^\wáéíóúñü%]*)", texto):
        palabra, cola = m.group(1), m.group(2)
        pausa = max([PAUSA.get(c, 0) for c in cola] + [0])
        salida.append((palabra, pausa))
    return salida


def tiempos(escenas):
    """Para cada escena, la lista de (palabra, inicio, fin) en segundos del video, y el fin de la voz."""
    seg_por_silaba = 1 / (PPS * SIL_POR_PAL)
    t = 0.0
    salida = {}
    for eid, texto in escenas:
        lista = []
        for palabra, pausa in palabras_de(texto):
            dura = silabas(palabra) * seg_por_silaba
            lista.append((palabra, t, t + dura))
            t += dura + pausa
        salida[eid] = lista
        t += ENTRE_ESCENAS
    return salida, t


def secciones(md):
    partes = re.split(r"^## \d+\. (R\d+ · .+)$", md, flags=re.M)
    for k in range(1, len(partes), 2):
        yield partes[k].strip(), partes[k + 1]


def filas(tabla_md, columnas):
    for linea in tabla_md.splitlines():
        if not linea.startswith("|"):
            continue
        celdas = [c.strip() for c in linea.strip().strip("|").split("|")]
        if len(celdas) >= columnas:
            yield celdas


def textos_grandes(imagen):
    """Los textos grandes de una celda de imagen (las cartelas, recortes y globos se leen aparte)."""
    if any(x in imagen.lower() for x in ("cartela", "recorte", "globo")):
        return []
    return re.findall(r"«([^»]+)»", imagen)


def ancla(c, palabras, avisos):
    """El inicio (en s) de la fila, o None."""
    texto = c[1].strip("`")
    if texto in ("0", "cuadro 0"):
        return 0.0
    m = re.match(r"^([\w-]+)/([^·]+)(?:·(\d+))?$", texto)
    if not m:
        avisos.append(f"fila {c[0]}: ancla «{texto}» no tiene la forma escena/palabra")
        return None
    eid, buscada, n = m.group(1), normal(m.group(2)), int(m.group(3) or 1)
    if eid not in palabras:
        avisos.append(f"fila {c[0]}: no hay escena {eid}")
        return None
    vistas = [w for w in palabras[eid] if normal(w[0]).startswith(buscada)]
    exactas = [w for w in palabras[eid] if normal(w[0]) == buscada]
    if len(exactas) >= n and len(vistas) != len(exactas):
        vistas = exactas  # «la» no debe agarrar «las»: si hay exacta, vale la exacta
    if len(vistas) < n:
        avisos.append(f"fila {c[0]}: «{m.group(2)}» ({n}) no está en {eid}")
        return None
    es_primera = normal(palabras[eid][0][0]).startswith(buscada)
    if n == 1 and len(vistas) > 1 and not m.group(3) and not es_primera:
        avisos.append(f"fila {c[0]}: «{m.group(2)}» sale {len(vistas)} veces en {eid}: escribe ·n")
    return max(0.0, vistas[n - 1][1] - ADELANTO)


def analiza(titulo, cuerpo):
    escenas = [(c[0], c[1]) for c in filas(cuerpo, 2) if re.match(r"^\d\d-", c[0])]
    if not escenas:
        return None
    palabras, fin_voz = tiempos(escenas)
    total = fin_voz - ENTRE_ESCENAS + COLA_FINAL
    todas = [w for e in palabras.values() for w in e]
    gg = [c for c in filas(cuerpo, 4) if re.match(r"^\d+$", c[0])]
    avisos = []

    inicios = [ancla(c, palabras, avisos) for c in gg]
    de_r1 = {}
    for k, c in enumerate(gg):
        plano = c[2].lower().split("+")[0].strip()
        if plano in DE_R1:
            de_r1[plano] = de_r1.get(plano, 0) + 1
        if plano in PROHIBIDAS:
            avisos.append(f"fila {c[0]}: «{plano}» mete luz de color fuera de la paleta")
        if "agrega" in c[3].lower() and not plano.startswith("golpe"):
            avisos.append(f"fila {c[0]}: «Agrega» en una fila con transición (agrega sólo un golpe)")
        if k == 0 and ENTRA.search(c[3] + " " + (c[4] if len(c) > 6 else "")):
            avisos.append("fila 1: el cuadro 0 tiene que estar armado (nada «entra» en la portada)")
        if GLIFOS:
            raros = sorted({ch for t in re.findall(r"«([^»]+)»", c[3]) for ch in t if ch not in GLIFOS and not ch.isspace()})
            if raros:
                avisos.append(f"fila {c[0]}: TASA Orbiter no tiene {' '.join(raros)}")
        for t in re.findall(r"«([^»]+)»", c[3]):
            if any(x in c[3].lower() for x in ("cartela", "recorte", "globo")):
                for renglon in t.split(" / "):
                    if len(renglon) > MAX_RENGLON:
                        avisos.append(f"fila {c[0]}: «{renglon}» tiene {len(renglon)} caracteres (≤ {MAX_RENGLON} por renglón)")
    for plano, n in de_r1.items():
        if n > 1:
            avisos.append(f"«{plano}» es de R1 y sale {n} veces (máximo una por corto)")
    resultado = []
    tableros = muros = 0
    for k, c in enumerate(gg):
        ini = inicios[k]
        sig = next((x for x in inicios[k + 1:] if x is not None), total)
        dura = None if ini is None else sig - ini
        oido = [] if ini is None else [w for w in todas if ini <= w[1] + ADELANTO < ini + dura]
        resultado.append((c, ini, dura, oido))
        plano, imagen = c[2].lower(), c[3]
        es_golpe = plano.startswith("golpe")
        es_ultima = k == len(gg) - 1
        textos = textos_grandes(imagen)
        if ini is None or dura is None:
            continue
        if k and inicios[k - 1] is not None and ini < inicios[k - 1]:
            avisos.append(f"fila {c[0]}: empieza antes que la fila anterior")
        if dura > FILA_MAX:
            avisos.append(f"fila {c[0]}: {dura:.1f} s sin cambio (parte el plano o mete un golpe)")
        if k and not es_ultima:  # la portada (fila 1) puede ceder pronto al veredicto
            if textos:
                letras = sum(len(t.replace(" / ", " ")) for t in textos)
                minimo = max(FILA_MIN_TEXTO if not es_golpe else 0.6, 0.25 + letras / 15)
                if any(re.search(r"\d", t) for t in textos) or "remate" in imagen.lower():
                    minimo = max(minimo, REMATE_MIN)
            else:
                minimo = 0.6 if es_golpe else 0.8
            if dura < minimo:
                avisos.append(f"fila {c[0]}: {dura:.1f} s, y para leerse necesita ~{minimo:.1f}")
        if es_ultima and dura - COLA_FINAL < 0.8:
            avisos.append(f"fila {c[0]}: la portada final dura {dura - COLA_FINAL:.1f} s de voz (adelántala)")
        for año in re.findall(r"Tablero \*\*(\d{4})\*\*", imagen):
            tableros += 1
            if dura < 1.75:
                avisos.append(f"fila {c[0]}: el tablero necesita ~1.8 s y tiene {dura:.1f}")
            if not any(normal(w[0]) == "mil" for w in oido):
                avisos.append(f"fila {c[0]}: el tablero {año} no lleva un año que se oiga en esa fila")
        if "muro" in plano:
            muros += 1
            if dura < MURO_MIN:
                avisos.append(f"fila {c[0]}: la fila del muro dura {dura:.1f} s; lo de abajo no se ve (≥ {MURO_MIN})")
            mm = re.match(r"^([\w-]+)/([^·]+)", c[1].strip("`"))
            if mm and mm.group(1) in palabras and normal(palabras[mm.group(1)][0][0]) != normal(mm.group(2)):
                avisos.append(f"fila {c[0]}: el muro va en la primera palabra de una escena")
        if plano not in ("—", "-", "") and not es_golpe:
            base = plano.split("+")[0].strip()
            if base not in TRANSICIONES:
                avisos.append(f"fila {c[0]}: transición «{base}» no existe en el kit")
        for texto in textos:
            es_muro = "muro" in plano and " · " in texto
            renglones = [texto.split(" · ")[0]] if es_muro else texto.split(" / ")  # el muro repite una palabra: cuenta una
            for renglon in renglones:
                if len(renglon) > MAX_RENGLON:
                    avisos.append(f"fila {c[0]}: «{renglon}» tiene {len(renglon)} caracteres (≤ {MAX_RENGLON} por renglón)")
            # ¿cuánto tarda en oírse? (palabras de ≥ 4 letras del texto, contra la voz desde que entra)
            claves = {normal(x) for x in re.findall(r"[^\W\d_]{4,}", texto)}
            if claves and not es_muro and k:  # la portada anuncia el tema: puede adelantarse
                despues = [w[1] for w in todas if w[1] + ADELANTO >= ini - 0.3 and normal(w[0]) in claves]
                if despues and min(despues) - ini > TEXTO_ANTES:
                    avisos.append(f"fila {c[0]}: «{texto}» entra {min(despues) - ini:.1f} s antes de oírse")

    # los planos: una fila con transición abre plano; los golpes son parte de él
    planos = []
    for (c, ini, dura, _) in resultado:
        if ini is None:
            continue
        if not planos or not c[2].lower().startswith("golpe"):
            planos.append([c[0], ini])
    duraciones = []
    for k, (num, ini) in enumerate(planos):
        fin = planos[k + 1][1] if k + 1 < len(planos) else total
        duraciones.append(fin - ini)
        if fin - ini > PLANO_MAX:
            avisos.append(f"plano que abre en la fila {num}: {fin - ini:.1f} s (≤ {PLANO_MAX:.0f}; ¿algún golpe es en realidad un corte?)")
    if len(planos) < PLANOS_MIN:
        avisos.append(f"{len(planos)} planos (≥ {PLANOS_MIN}; la v10 tiene 29)")
    if tableros > 2:
        avisos.append(f"{tableros} tableros (máximo 2)")
    return {
        "titulo": titulo,
        "palabras": len(todas),
        "total": total,
        "filas": resultado,
        "planos": len(planos),
        "plano_medio": sum(duraciones) / len(duraciones) if duraciones else 0,
        "avisos": avisos,
    }


def escribe(md, informes):
    """Rellena la columna «s» de cada guion gráfico con «inicio · duración»."""
    salida = []
    actual = None
    por_titulo = {i["titulo"]: i for i in informes if i}
    idx = 0
    for linea in md.splitlines(keepends=True):
        m = re.match(r"^## \d+\. (R\d+ · .+)$", linea)
        if m:
            actual = por_titulo.get(m.group(1).strip())
            idx = 0
        if actual and re.match(r"^\| \d+ \|", linea):
            celdas = linea.rstrip("\n").strip().strip("|").split("|")
            if len(celdas) >= 5 and idx < len(actual["filas"]):
                _, ini, dura, _ = actual["filas"][idx]
                celdas[-1] = f" {ini:.1f} · {dura:.1f} " if ini is not None else " ? "
                linea = "|" + "|".join(celdas) + "|\n"
                idx += 1
        salida.append(linea)
    return "".join(salida)


def main():
    ruta = sys.argv[1]
    md = io.open(ruta, encoding="utf-8").read()
    informes = [analiza(t, c) for t, c in secciones(md)]
    detalle = sys.argv[sys.argv.index("--detalle") + 1].split(",") if "--detalle" in sys.argv else []
    limpios = 0
    for i in informes:
        if not i:
            continue
        estado = "LIMPIO" if not i["avisos"] else f"{len(i['avisos'])} avisos"
        limpios += not i["avisos"]
        print(f"\n{i['titulo']} — {i['palabras']} palabras, ~{i['total']:.0f} s, {len(i['filas'])} filas, "
              f"{i['planos']} planos de {i['plano_medio']:.1f} s — {estado}")
        for a in i["avisos"]:
            print("   ·", a)
        if i["titulo"].split(" ·")[0] in detalle:
            for c, ini, dura, oido in i["filas"]:
                if ini is not None:
                    print(f"     {c[0]:>2} {ini:5.1f} {dura:4.1f}  {c[2][:14]:14s} | {' '.join(w[0] for w in oido)}")
    print(f"\n{limpios} de {sum(1 for i in informes if i)} sin avisos")
    if "--escribe" in sys.argv:
        io.open(ruta, "w", encoding="utf-8").write(escribe(md, informes))
        print("columna «s» escrita en", ruta)


if __name__ == "__main__":
    main()
