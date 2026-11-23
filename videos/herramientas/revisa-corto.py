"""
Revisa que un corto vertical siga el ESTILO de la serie antes de renderizar el final.

    python herramientas/revisa-corto.py el-plazo
    python herramientas/revisa-corto.py el-ascenso el-plazo

El estilo está en docs/videos-explicativos/reglas-de-los-cortos.md §0, y nació
de tres correcciones del supervisor el mismo día (2026-10-21): «se sienten muy
estáticos», «sigues saturando los textos» y «¿qué pasó con la skill de
comercial, que hacía transiciones más suaves?». Una regla que depende de que
alguien la recuerde no es una regla: esto mide lo que se puede medir en el
código, y lo que no (que el texto no tape la imagen, que la cámara no se
detenga) lo mira la hoja de contacto.

Lo que mide, en src/videos/<video>/ (Escenas.tsx y su kit):
  1. el texto es el de la serie: `<Cinetico>`, nunca uno propio (Rotulo, Placa, Titular…);
  2. textos medianos: 76–96 px, el título hasta 104 y una cifra sola hasta 140;
  3. a lo más tres renglones por texto;
  4. pocos textos: hasta 10 distintos por minuto de voz (los rótulos chicos, < 76 px, no cuentan);
  5. transiciones de cámara: ningún corte seco (`tipo: 'corte'` fuera del cuadro 0)
     ni barrido de escáner o cortinilla (`clipPath: inset(`);
  6. el fondo liso: nada de cuadrícula ni trama de fondo;
  7. toda palabra a la que se ancla algo (`g(…)`, `A(…)`) sigue en la voz: tras cambiar
     el guion, un ancla a una palabra que ya no se dice tumba el render.
Sale con código 1 si algo falla.
"""
import io
import json
import os
import re
import sys
import unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEXTO_PROPIO = ['<Rotulo', '<Placa', '<Titular', '<Texto grande', '<Palabras']
FONDO_PROHIBIDO = ['<Cuadricula', 'repeating-linear-gradient', 'backgroundImage: `url(']


def lee(ruta):
    return io.open(ruta, encoding='utf-8').read() if os.path.exists(ruta) else ''


def duracion(video):
    """Lo que dura el corto: la voz (duraciones.json) más las colas de cada escena (linea.ts, en cuadros a 30 fps)."""
    d = json.load(io.open(os.path.join(RAIZ, 'public', video, 'duraciones.json'), encoding='utf-8'))
    vals = d.values() if isinstance(d, dict) else d
    total = 0.0
    for v in vals:
        total += v if isinstance(v, (int, float)) else float(v.get('s', v.get('duracion', 0)))
    linea = lee(os.path.join(RAIZ, 'src', 'videos', video, 'linea.ts'))
    total += sum(int(n) for n in re.findall(r"'\d\d-[^']+':\s*(\d+)", linea)) / 30
    return total


def revisa(video):
    base = os.path.join(RAIZ, 'src', 'videos', video)
    escenas = lee(os.path.join(base, 'Escenas.tsx'))
    if not escenas:
        return [f'no existe src/videos/{video}/Escenas.tsx']
    kit = ''.join(lee(os.path.join(base, 'kit', n)) for n in (os.listdir(os.path.join(base, 'kit')) if os.path.isdir(os.path.join(base, 'kit')) else []))
    fallas = []

    if '<Cinetico' not in escenas:
        fallas.append('1 · no usa <Cinetico>: el texto de la serie es src/kit/cortos/Cinetico.tsx')
    for t in TEXTO_PROPIO:
        if t in escenas:
            fallas.append(f'1 · texto propio ({t}): todo texto grande va con <Cinetico>')

    textos = set()
    for m in re.finditer(r'<Cinetico\b([^>]*?)/>', escenas, re.S):
        attrs = m.group(1)
        texto = re.search(r'texto="([^"]*)"', attrs)
        texto = texto.group(1) if texto else '?'
        tam = re.search(r'tam=\{(\d+)\}', attrs)
        tam = int(tam.group(1)) if tam else 88
        renglones = texto.split(' / ')
        cifra = not re.search(r'[A-Za-zÁÉÍÓÚáéíóúñÑ]', texto)
        tope = 140 if cifra else 104
        if tam > tope:
            fallas.append(f'2 · «{texto}» a {tam} px: los textos van a 76–96 (título ≤ 104, cifra sola ≤ 140)')
        if len(renglones) > 3:
            fallas.append(f'3 · «{texto}» lleva {len(renglones)} renglones: tres como máximo')
        if tam >= 76:
            textos.add(texto)

    seg = duracion(video)
    por_minuto = len(textos) / (seg / 60) if seg else 0
    if por_minuto > 10:
        fallas.append(f'4 · {len(textos)} textos en {seg:.0f} s ({por_minuto:.1f} por minuto): hasta 10; quita lo que el dibujo ya rotula')

    cortes = [m.group(0) for m in re.finditer(r"\{f:\s*([^,]+),[^}]*tipo:\s*'corte'", escenas) if m.group(1).strip() != '0']
    cortes += re.findall(r"tipo:\s*'corte'", re.sub(r"\{f:\s*[^,]+,[^}]*\}", '', escenas))
    if cortes:
        fallas.append(f"5 · {len(cortes)} corte(s) seco(s): de toma a toma la cámara viaja (~0.9 s, arranque y parada suaves)")
    if re.search(r'clipPath:\s*[`\'"]?inset\(', escenas + kit):
        fallas.append('5 · barrido con clipPath inset (escáner o cortinilla): la transición es un viaje de cámara')

    for t in FONDO_PROHIBIDO:
        if t in escenas:
            fallas.append(f'6 · fondo con trama ({t}): el fondo es el papel liso de la marca')

    # 7 · toda palabra a la que se ancla algo sigue en la voz. Cambiar una frase del guion y
    # dejar un ancla a una palabra que ya no se dice tumba el render entero (pasó dos veces
    # el 2026-10-21 con «promedio» en El ascenso, y la segunda vez el control revisó el video viejo)
    pal = os.path.join(RAIZ, 'public', video, 'palabras.json')
    if os.path.exists(pal):
        voz = json.load(io.open(pal, encoding='utf-8'))
        # sin acentos ni puntuación, como enPalabra() de src/kit/linea.ts
        limpia = lambda w: re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFD', w.lower()).encode('ascii', 'ignore').decode())
        dichas = {k: [limpia(w['p']) for w in v.get('palabras', [])] for k, v in voz.items()}
        codigo = escenas + lee(os.path.join(base, 'Video.tsx'))
        for m in re.finditer(r"\b(?:g|A)\('([^']+)',\s*(\[[^\]]*\]|'[^']*')(?:,\s*(\d+))?", codigo):
            escena, formas, n = m.group(1), re.findall(r"'([^']*)'", m.group(2)), int(m.group(3) or 1)
            if escena not in dichas:
                fallas.append(f'7 · ancla a la escena «{escena}», que no existe en la voz')
                continue
            # como enPalabra(): la palabra dicha EMPIEZA con la forma («prohib» encuentra «prohíbe»)
            if not any(sum(1 for d in dichas[escena] if d.startswith(limpia(fo))) >= n for fo in formas):
                fallas.append(f'7 · ancla a «{" / ".join(formas)}» ({n}) en {escena}, y la voz ya no lo dice: el render fallaría')

    print(f'{video}: {len(textos)} textos en {seg:.0f} s ({por_minuto:.1f} por minuto)')
    return fallas


def main():
    videos = [a for a in sys.argv[1:] if not a.startswith('-')]
    if not videos:
        print(__doc__)
        sys.exit(2)
    malo = False
    for v in videos:
        fallas = revisa(v)
        for f in fallas:
            print('  FALLA', f)
        if not fallas:
            print('  bien: sigue el estilo de la serie')
        malo = malo or bool(fallas)
    sys.exit(1 if malo else 0)


if __name__ == '__main__':
    main()
