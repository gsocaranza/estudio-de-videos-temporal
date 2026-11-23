# -*- coding: utf-8 -*-
"""
Audita el guion de un corto contra las reglas del guion y de los datos
(reglas-de-los-cortos.md §2 y §3).

    python herramientas/audita-guion.py el-plazo

Lo pidió el supervisor el 2026-10-21, después del control de calidad del video:
«y también el guion, que lo audite en la calidad». Se corre **dos veces**:

- **antes de grabar la voz**, sólo con el texto, porque un guion flojo no lo
  arregla ninguna animación;
- **dentro de `control-de-calidad.py`**, ya con la voz. Ahí mide también los
  tiempos reales con `palabras.json`: cuándo termina la tesis, las pausas
  dentro del gancho y dónde cae el re-gancho.

Lo que mide:
  G1  la primera frase dice la tesis en 6–12 palabras, sin saludo ni «¿sabías que…?»
  G2  con voz: la tesis termina antes de 4 s y no hay pausas de más de 0.5 s dentro de ella
  G3  con voz: una frase empieza entre los 5 y los 12 s (el re-gancho); se lista para juzgarla
  G4  lo que la voz dice de un tirón (partido en . ? ! : ;), de 6–14 palabras; más de 18 es falla.
      Una cifra dicha en letra cuenta como una palabra
  G5  120–150 palabras por minuto de voz (fuera de 100–165 es falla)
  G6  toda escena con una cifra o un año lleva su fuente
  G7  sin vender: ni la marca, ni precios, ni «descarga» o «contrata» (la marca, sólo en la escena
      que el guion declare en `mencion_de_marca`, con su motivo: reglas §2.4)
  G8  sin miedo ni «te mintieron»
  G10 todo en español
  G11 con voz: lo que se oye es el guion, escena por escena (aviso: Whisper también se equivoca)
Lo que no se mide (si enseña un concepto, si hay giro, si el dato es para
mandar, si el final empalma con el principio: eso es de la imagen) va escrito, criterio por criterio, en `public/<video>/revision.md`.
Sale con código 1 si algo falla.
"""
import difflib
import io
import json
import os
import re
import sys
import unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FPS = 30
APERTURAS_PROHIBIDAS = [r'\bsab[ií]as que\b', r'\bhola\b', r'\bhoy te voy\b', r'\bte voy a contar\b', r'\bbienvenid']
# «los precios» de una tienda es historia, no venta: aquí sólo lo que le pide algo al espectador
VENTA = [r'\bpuntualiza\b', r'\bcontr[aá]ta(nos|lo)?\b', r'\bdescarga\b', r'\$', r'\bsuscr[ií]bete\b', r'\bs[ií]gueme\b']
MIEDO = [r'\bte mintieron\b', r'\bte enga[ñn]an\b', r'\bcuidado\b', r'\bpeligro\b', r'\bte van a multar\b']
INGLES = {'the', 'of', 'and', 'is', 'with', 'for', 'you', 'work', 'law'}
CIFRA = re.compile(r'\d|\b(mil|millones?|cientos?|ciento|veinte|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa|por ciento|doble|mitad)\b', re.I)
VACIAS = {'porque', 'cuando', 'desde', 'hasta', 'sobre', 'entre', 'tiene', 'tienen', 'puede', 'pueden', 'estaba', 'nadie', 'siempre', 'todos', 'otros', 'mismo'}


def norm(t):
    t = unicodedata.normalize('NFD', t.lower()).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9 ]', '', t)


def frases(texto):
    return [f.strip() for f in re.split(r'(?<=[.?!…])\s+', texto) if f.strip()]


NUMERO = re.compile(r'^(mil|millon|millones|cien|ciento|cientos|doscientos|trescientos|cuatrocientos|quinientos|seiscientos|setecientos|ochocientos|novecientos|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|once|doce|trece|catorce|quince|dieci\w+|veinte|veinti\w+|treinta|cuarenta|cincuenta|sesenta|setenta|ochenta|noventa)$')


def palabras(t):
    """Las palabras como se oyen: una cifra dicha en letra («mil novecientos sesenta y nueve») cuenta como una."""
    crudas = [norm(p).strip() for p in re.split(r'\s+', t) if norm(p).strip()]
    salida = []
    for i, p in enumerate(crudas):
        es_num = NUMERO.match(p) or (p == 'y' and 0 < i < len(crudas) - 1 and NUMERO.match(crudas[i - 1]) and NUMERO.match(crudas[i + 1]))
        if es_num and salida and salida[-1] == '#':
            continue
        salida.append('#' if es_num else p)
    return salida


def unidades(t):
    """Lo que la voz dice de un tirón: una frase, partida además en los dos puntos y el punto y coma."""
    return [u.strip() for f in frases(t) for u in re.split(r'[:;]\s+', f) if u.strip()]


def lee(ruta):
    return io.open(ruta, encoding='utf-8').read() if os.path.exists(ruta) else ''


def linea_de_tiempo(video, guion):
    """Las palabras con su segundo en el video: inicio de escena (respiro + voz + cola) + su tiempo en la toma."""
    pal = os.path.join(RAIZ, 'public', video, 'palabras.json')
    dur = os.path.join(RAIZ, 'public', video, 'duraciones.json')
    if not (os.path.exists(pal) and os.path.exists(dur)):
        return None
    pal = json.load(open(pal, encoding='utf-8'))
    dur = json.load(open(dur, encoding='utf-8'))
    linea = lee(os.path.join(RAIZ, 'src', 'videos', video, 'linea.ts'))
    ritmo = re.search(r'RITMO\s*=\s*\{respiro:\s*(\d+),\s*cola:\s*(\d+)\}', linea)
    respiro, cola = (int(ritmo.group(1)), int(ritmo.group(2))) if ritmo else (12, 16)
    colas = {k: int(v) for k, v in re.findall(r"'(\d\d-[^']+)':\s*(\d+)", linea)}
    if 'estados' in guion:
        # un video de capacitación pega las escenas tal cual, con la `cola` del guion (arma-linea.py)
        respiro, cola = 0, round(float(guion.get('cola', 0)) * FPS)
        colas = {e['id']: round(float(e['cola']) * FPS) for e in guion['escenas'] if 'cola' in e}
    t, todas = 0.0, []
    for e in guion['escenas']:
        base = t + respiro / FPS
        for w in pal.get(e['id'], {}).get('palabras', []):
            todas.append({'p': w['p'], 'ini': base + w['ini'], 'fin': base + w['fin'], 'escena': e['id']})
        t += (respiro + -(-dur[e['id']] * FPS // 1) + colas.get(e['id'], cola)) / FPS
    return todas


def audita(video):
    guion = json.load(open(os.path.join(RAIZ, 'public', video, 'guion.json'), encoding='utf-8'))
    escenas = guion['escenas']
    texto = ' '.join(e['texto'] for e in escenas)
    fallas, avisos, datos = [], [], {}
    # Un video de capacitación (docs/capacitacion/videos-v2/, el guion trae `estados`) no es un
    # corto: no hay gancho ni re-gancho que medir, sus cifras son las de la pantalla y nombrar
    # Puntualiza dentro de su propio centro de ayuda no es vender. Se mide lo demás: frases de
    # un tirón, ritmo, tono y que la voz diga el guion.
    tutorial = 'estados' in guion
    if tutorial:
        datos['formato'] = 'video de capacitación: sin G1–G3, G6 ni G7'

    # G1 · la primera frase
    primera = frases(escenas[0]['texto'])[0]
    n = len(palabras(primera))
    datos['primera frase'] = f'«{primera}» ({n} palabras)'
    if tutorial:
        pass
    elif n > 12:
        fallas.append(f'G1 · la tesis tarda {n} palabras en cerrarse: va en 6–12')
    elif n < 6:
        avisos.append(f'G1 · la primera frase tiene {n} palabras: ¿dice la tesis o sólo el nombre?')
    for pat in APERTURAS_PROHIBIDAS:
        if re.search(pat, norm(primera)):
            fallas.append(f'G1 · abre con «{re.search(pat, norm(primera)).group(0)}»: sin saludo ni «¿sabías que…?»')

    # G2 y G3 · con la voz
    todas = linea_de_tiempo(video, guion)
    if todas:
        # la tesis acaba en el primer punto que se OYE: contar las palabras del guion falla
        # cuando Whisper escribe «setenta por ciento» como «70 %» (El olvido, 2026-10-22)
        k = next((i + 1 for i, w in enumerate(todas) if re.search(r'[.?!…]$', w['p'].strip())), len(todas))
        # y Whisper a veces oye el punto como coma («efectivo,», Los pagos digitales,
        # 2026-10-24): si la última palabra de la primera frase del guion se oye antes, ahí acaba
        ultima = (norm(primera).split() or [''])[-1]
        k = next((i + 1 for i, w in enumerate(todas[:k]) if ultima and norm(w['p']).strip() == ultima), k)
        tesis = todas[:k]
        fin = tesis[-1]['fin']
        if not tutorial:
            datos['la tesis termina'] = f'a los {fin:.1f} s'
        if tutorial:
            pass
        elif fin > 4.0:
            fallas.append(f'G2 · la tesis termina a los {fin:.1f} s: el veredicto va antes de 4 s')
        for a, b in ([] if tutorial else zip(tesis, tesis[1:])):
            if b['ini'] - a['fin'] > 0.5:
                fallas.append(f'G2 · pausa de {b["ini"] - a["fin"]:.1f} s dentro del gancho, entre «{a["p"]}» y «{b["p"]}»')
        inicios, previo = [], None
        for w in todas:
            if previo is None or re.search(r'[.?!…:]$', previo['p']):
                inicios.append(w)
            previo = w
        regancho = [w for w in inicios if 5.0 <= w['ini'] <= 12.0]
        if tutorial:
            pass
        elif regancho:
            for w in regancho:
                i = todas.index(w)
                frase = ' '.join(x['p'] for x in todas[i:i + 12])
                datos.setdefault('re-gancho (5–12 s)', [])
                datos['re-gancho (5–12 s)'].append(f'{w["ini"]:.1f} s · «{frase}…»')
        else:
            fallas.append('G3 · ninguna frase empieza entre los 5 y los 12 s: falta el re-gancho')
        total = todas[-1]['fin']
        n = len(palabras(texto))
        ppm = n / (total / 60)
        datos['palabras'] = f'{n} en {total:.0f} s ({ppm:.0f} por minuto)'
        if tutorial:
            # en un tutorial la pausa entre pasos la pone la `cola` (la pantalla tiene que dar
            # tiempo a seguir el clic): la voz va a su ritmo natural y se mide con las colas
            if not 100 <= ppm <= 170:
                fallas.append(f'G5 · {ppm:.0f} palabras por minuto con las colas: un tutorial va en 130–165; sube la `cola` del guion')
            elif ppm > 165:
                avisos.append(f'G5 · {ppm:.0f} palabras por minuto con las colas: algo apurado para seguir los clics')
        elif not 100 <= ppm <= 165:
            fallas.append(f'G5 · {ppm:.0f} palabras por minuto: va en 120–150 (La sal y La carta, 140–150)')
        elif not 120 <= ppm <= 150:
            avisos.append(f'G5 · {ppm:.0f} palabras por minuto: lo natural es 120–150')
        # G11 · la voz dice el guion, escena por escena. El modelo a veces cambia una palabra
        # («le di» por «le dio», «la mida» por «la vida», 2026-10-22) o mete una («y él está»,
        # 2026-10-21). Whisper también se equivoca, así que es aviso: se confirma con una
        # segunda transcripción de esa escena y, si se confirma, se cambia de toma.
        pal = json.load(open(os.path.join(RAIZ, 'public', video, 'palabras.json'), encoding='utf-8'))
        for e in escenas:
            esc = [norm(p) for p in e['texto'].split() if norm(p).strip()]
            oid = [norm(w['p']) for w in pal.get(e['id'], {}).get('palabras', []) if norm(w['p']).strip()]
            for tag, a0, a1, b0, b1 in difflib.SequenceMatcher(a=esc, b=oid, autojunk=False).get_opcodes():
                if tag == 'equal' or any(re.search(r'\d', x) for x in esc[a0:a1] + oid[b0:b1]):
                    continue
                avisos.append(f'G11 · {e["id"]}: el guion dice «{" ".join(esc[a0:a1]) or "—"}» y se oye «{" ".join(oid[b0:b1]) or "—"}»: confírmalo con otra transcripción')
    else:
        n = len(palabras(texto))
        datos['palabras'] = f'{n} (sin voz todavía: 120–145 para un minuto)'
        if not tutorial and not 100 <= n <= 170:
            fallas.append(f'G5 · {n} palabras: un minuto son 120–145')

    # G4 · frases
    for e in escenas:
        for f in unidades(e['texto']):
            m = len(palabras(f))
            if m > 18:
                fallas.append(f'G4 · {e["id"]}: frase de {m} palabras («{f[:60]}…»): se parte')
            elif m > 14:
                avisos.append(f'G4 · {e["id"]}: frase de {m} palabras («{f[:60]}…»)')

    # G6 · fuentes
    for e in ([] if tutorial else escenas):
        if CIFRA.search(e['texto']) and not e.get('fuentes'):
            fallas.append(f'G6 · {e["id"]} trae una cifra y no tiene fuente')

    # G7, G8, G10
    # la marca puede nombrarse en UNA escena si el guion lo declara con su motivo
    # (R18, 2026-10-29: el supervisor pidió «al final menciona Puntualiza así rápido»);
    # el resto de lo que vende sigue prohibido también ahí
    mencion = guion.get('mencion_de_marca') or {}
    if mencion and not (mencion.get('escena') and mencion.get('motivo', '').strip()):
        fallas.append('G7 · `mencion_de_marca` sin escena o sin motivo: la excepción se escribe entera')
    for pat in ([] if tutorial else VENTA):
        for e in escenas:
            if pat == VENTA[0] and e['id'] == mencion.get('escena') and mencion.get('motivo', '').strip():
                continue
            if re.search(pat, e['texto'], re.I):
                fallas.append(f'G7 · {e["id"]} vende: «{re.search(pat, e["texto"], re.I).group(0)}»')
    if mencion.get('escena'):
        datos['marca'] = f'nombrada sólo en {mencion["escena"]}, por excepción: {mencion.get("motivo", "")[:80]}…'
    for pat in MIEDO:
        if re.search(pat, norm(texto)):
            avisos.append(f'G8 · tono de miedo: «{re.search(pat, norm(texto)).group(0)}»')
    ingles = sorted(INGLES & set(norm(texto).split()))
    if ingles:
        avisos.append(f'G10 · palabras en inglés: {", ".join(ingles)}')

    return fallas, avisos, datos


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    if not args:
        print(__doc__)
        sys.exit(2)
    malo = False
    for v in args:
        fallas, avisos, datos = audita(v)
        print(f'## Guion de {v}: {"FALLA" if fallas else "pasa"}')
        for k, val in datos.items():
            if isinstance(val, list):
                print(f'- {k}:')
                for x in val:
                    print(f'  - {x}')
            else:
                print(f'- {k}: {val}')
        for f in fallas:
            print(f'- **FALLA** {f}')
        for a in avisos:
            print(f'- aviso: {a}')
        malo = malo or bool(fallas)
    sys.exit(1 if malo else 0)


if __name__ == '__main__':
    main()
