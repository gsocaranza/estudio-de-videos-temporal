# -*- coding: utf-8 -*-
"""
El control de calidad de un video ANTES de entregarlo: busca errores en la
animación, el texto, el audio y la voz, y deja un informe. Sirve a los tres
formatos del estudio, y lo adivina solo (o se le dice con --formato):

    corto      vertical y con guion.json   todo lo de abajo
    video      horizontal y con guion.json sin GUION ni ESTILO (son reglas de los cortos);
               una toma quieta cuenta desde 4 s y el volumen va a −16 LUFS
    tutorial   un video de capacitación (docs/capacitacion/videos-v2/: el guion trae `estados`),
               horizontal a 60 fps: el guion en su modo de capacitación, sin ESTILO; una toma quieta
               cuenta desde 6 s (la cámara descansa en la pantalla completa entre un foco y otro,
               por decisión del supervisor del 2026-10-25), −14 LUFS, y además SINCRONÍA: cada momento anclado a una palabra
               se compara con cuándo la oye Whisper en el video final (±0.35 s); las hojas son un
               cuadro por momento, con su palabra (hoja.py de esa carpeta)
    comercial  sin guion.json (sin voz)    sin GUION, ESTILO ni VOZ; una toma quieta cuenta
               desde 1.5 s, salvo el logo de los últimos 3 s; −16 LUFS; la hoja es un
               cuadro por segundo

    python herramientas/control-de-calidad.py el-plazo                 # la última versión de out/historial
    python herramientas/control-de-calidad.py el-plazo out/historial/el-plazo-v4.mp4
    WHISPER=medium python herramientas/control-de-calidad.py el-plazo  # la voz con más precisión
    python herramientas/control-de-calidad.py comercial-evidencia --formato comercial
    LUFS=-14 python herramientas/control-de-calidad.py ...             # otro volumen objetivo

Lo pidió el supervisor el 2026-10-21: «¿estás haciendo la revisión de los
videos para ver que cumplan con los criterios de calidad? Detectar errores en
las animaciones, textos, audios, voz», y en seguida «y también el guion». Hasta
ese día la revisión era mirar una hoja de contacto: veía textos encimados, pero
no una toma congelada, un audio que satura, un silencio muerto, una palabra que
la voz se comió ni un gancho que tarda.

Deja todo en out/calidad/<video>-vN/ (no se versiona): `informe.md` y las
hojas que se miran a ojo. Mide solo:

  GUION      lo de audita-guion.py, ya con la voz: la tesis en 6–12 palabras y antes de 4 s,
             sin pausas dentro del gancho, el re-gancho a los 5–12 s, frases de un tirón
             que no pasan de 18 palabras, fuentes en cada cifra, sin vender.

  ESTILO     lo de revisa-corto.py: el texto de la serie, su tamaño, cuántos, sin cortes ni escáner.
  ANIMACIÓN  ninguna toma congelada ≥ 2 s (freezedetect) y ningún cuadro negro sin querer.
  AUDIO      −14 LUFS ± 1, pico real ≤ −1 dBTP (que no sature en el teléfono) y ningún
             silencio muerto ≥ 1.2 s.
  VOZ        Whisper oye el video final y se compara con el guion: palabras que no se oyen
             (la voz cortada en una frontera de escena), palabras de más y la velocidad
             (2.2–3.0 palabras por segundo; más es voz apurada).

Y deja para mirar a ojo, que es la mitad que no se mide:
  hoja-inicio.png  un cuadro al empezar cada escena (las fronteras: texto encimado, saltos)
  hoja-mitad.png   un cuadro a la mitad de cada escena (composición, texto que tapa la imagen)
  hoja-final.png   un cuadro al terminar cada escena (lo que se queda colgado o sale tarde)
  gancho.png       los primeros 3 s a 4 cuadros por segundo (el gancho)
La rúbrica de reglas-de-los-cortos.md §6 se llena con esto en revision.md.

Sale con código 1 si algo medido falla.
"""
import difflib
import glob
import json
import os
import re
import subprocess
import sys
import unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERR = os.path.join(RAIZ, 'herramientas')


def norm(t):
    t = unicodedata.normalize('NFD', t.lower()).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]', '', t)


def ffmpeg_err(args):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats'] + args, capture_output=True, text=True, encoding='utf-8', errors='replace')
    return r.stderr


def ultima_version(video):
    vs = glob.glob(os.path.join(RAIZ, 'out', 'historial', f'{video}-v*.mp4'))
    vs = [v for v in vs if re.search(r'-v(\d+)\.mp4$', v)]
    if not vs:
        sys.exit(f'no hay versiones de {video} en out/historial')
    return max(vs, key=lambda v: int(re.search(r'-v(\d+)\.mp4$', v).group(1)))


def guion(video):
    """audita-guion.py, ya con la voz: la tesis, el gancho, el re-gancho, las frases y las fuentes."""
    r = subprocess.run([sys.executable, os.path.join(HERR, 'audita-guion.py'), video], capture_output=True, text=True, encoding='utf-8', errors='replace')
    lineas = [l for l in r.stdout.splitlines()[1:] if l.strip()]
    fallas = [l.split('**FALLA** ', 1)[1] for l in lineas if '**FALLA**' in l]
    avisos = [l.split('aviso: ', 1)[1] for l in lineas if l.startswith('- aviso: ')]
    datos = {}
    for l in lineas:
        m = re.match(r'- ([^*:][^:]*): (.+)$', l)
        if m and not l.startswith('- aviso'):
            datos[m.group(1)] = m.group(2)
        elif l.startswith('  - '):
            datos['re-gancho (5–12 s)'] = (datos.get('re-gancho (5–12 s)', '') + ' ' + l.strip()[2:]).strip()
    return fallas, avisos, datos


def estilo(video):
    r = subprocess.run([sys.executable, os.path.join(HERR, 'revisa-corto.py'), video], capture_output=True, text=True, encoding='utf-8', errors='replace')
    lineas = [l.strip() for l in r.stdout.splitlines() if l.strip()]
    fallas = [l.replace('FALLA ', '') for l in lineas if l.startswith('FALLA')]
    return lineas[0] if lineas else '', fallas


FORMATOS = {
    # quieta: desde cuántos segundos una toma sin movimiento es una falla; lufs: el objetivo
    # de final.sh para ese formato (los cortos se nivelan a −14 como en las redes)
    'corto': {'quieta': 2.0, 'lufs': -14, 'guion': True, 'estilo': True, 'voz': True},
    'video': {'quieta': 4.0, 'lufs': -16, 'guion': False, 'estilo': False, 'voz': True},
    'comercial': {'quieta': 1.5, 'lufs': -16, 'guion': False, 'estilo': False, 'voz': False},
    'tutorial': {'quieta': 6.0, 'lufs': -14, 'guion': True, 'estilo': False, 'voz': True},
}
OIDAS = []  # lo que Whisper oyó en el video final, para la sincronía


def medidas(mp4):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration',
                        '-of', 'json', mp4], capture_output=True, text=True)
    d = json.loads(r.stdout)
    s = d['streams'][0]
    return s['width'], s['height'], float(d['format']['duration'])


def formato_de(video, mp4):
    if not os.path.exists(os.path.join(RAIZ, 'public', video, 'guion.json')):
        return 'comercial'
    if 'estados' in json.load(open(os.path.join(RAIZ, 'public', video, 'guion.json'), encoding='utf-8')):
        return 'tutorial'
    ancho, alto, _ = medidas(mp4)
    return 'corto' if alto > ancho else 'video'


def animacion(mp4, quieta=2.0, logo_al_final=False):
    fallas, avisos = [], []
    _, _, dura = medidas(mp4)
    # la escala chica sólo acelera; force_original_aspect_ratio sirve para vertical y horizontal
    chica = 'scale=480:480:force_original_aspect_ratio=decrease'
    err = ffmpeg_err(['-i', mp4, '-vf', f'{chica},freezedetect=n=0.002:d={quieta}', '-map', '0:v', '-f', 'null', '-'])
    inicios = [float(x) for x in re.findall(r'freeze_start: ([\d.]+)', err)]
    duras = [float(x) for x in re.findall(r'freeze_duration: ([\d.]+)', err)]
    # una toma congelada hasta el final no trae freeze_duration
    if len(inicios) > len(duras):
        duras.append(dura - inicios[-1])
    for a, d in zip(inicios, duras):
        if logo_al_final and a >= dura - 3:
            avisos.append(f'el logo se queda quieto {a:.1f}–{a + d:.1f} s: ¿a propósito?')
        else:
            fallas.append(f'toma congelada {a:.1f}–{a + d:.1f} s ({d:.1f} s): nada se queda quieto, ni el remate')
    err = ffmpeg_err(['-i', mp4, '-vf', f'{chica},blackdetect=d=0.1:pic_th=0.98', '-map', '0:v', '-f', 'null', '-'])
    for a, b in re.findall(r'black_start:([\d.]+) black_end:([\d.]+)', err):
        avisos.append(f'cuadro negro {float(a):.1f}–{float(b):.1f} s: ¿a propósito?')
    return fallas, avisos


def audio(mp4, lufs=-14):
    fallas, avisos, datos = [], [], {}
    err = ffmpeg_err(['-i', mp4, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    resumen = err[err.rfind('Summary:'):]
    i = re.search(r'I:\s+(-?[\d.]+) LUFS', resumen)
    pico = re.search(r'Peak:\s+(-?[\d.]+) dBFS', resumen)
    lra = re.search(r'LRA:\s+(-?[\d.]+) LU', resumen)
    if i:
        datos['volumen'] = f'{float(i.group(1)):.1f} LUFS'
        if abs(float(i.group(1)) - lufs) > 1:
            fallas.append(f'volumen integrado {float(i.group(1)):.1f} LUFS: va a {lufs} ± 1')
    if pico:
        datos['pico real'] = f'{float(pico.group(1)):.1f} dBTP'
        if float(pico.group(1)) > -1.0:
            fallas.append(f'pico real {float(pico.group(1)):.1f} dBTP: satura en el teléfono; el tope es −1')
    if lra:
        datos['rango'] = f'{float(lra.group(1)):.1f} LU'
    err = ffmpeg_err(['-i', mp4, '-af', 'silencedetect=noise=-45dB:d=1.2', '-f', 'null', '-'])
    for a, d in zip(re.findall(r'silence_start: ([\d.]+)', err), re.findall(r'silence_duration: ([\d.]+)', err)):
        fallas.append(f'silencio muerto en {float(a):.1f} s ({float(d):.1f} s): las pausas van de 0.4 a 0.8 s')
    return fallas, avisos, datos


def voz(video, mp4, carpeta):
    fallas, avisos, datos = [], [], {}
    guion = json.load(open(os.path.join(RAIZ, 'public', video, 'guion.json'), encoding='utf-8'))
    escritas = [norm(p) for e in guion['escenas'] for p in e['texto'].split() if norm(p)]
    wav = os.path.join(carpeta, 'voz.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp4, '-ac', '1', '-ar', '16000', wav], check=True)
    import whisper  # pip install openai-whisper

    modelo = whisper.load_model(os.environ.get('WHISPER', 'small'))
    r = modelo.transcribe(wav, language='es', word_timestamps=True)
    oidas = [w for s in r['segments'] for w in s['words']]
    OIDAS[:] = oidas
    oidas_n = [norm(w['word']) for w in oidas]
    sm = difflib.SequenceMatcher(a=escritas, b=oidas_n, autojunk=False)
    datos['coincidencia'] = f'{sm.ratio() * 100:.0f} % de las palabras'
    for tag, a0, a1, b0, b1 in sm.get_opcodes():
        if tag == 'equal':
            continue
        esc = escritas[a0:a1]
        oid = oidas_n[b0:b1]
        # Whisper escribe «1955» donde se dijo «mil novecientos cincuenta y cinco», y oye
        # «esforza» por «Sforza»: eso no es un error de la voz
        if any(re.search(r'\d', x) for x in esc + oid):
            continue
        if tag == 'replace' and difflib.SequenceMatcher(a=''.join(esc), b=''.join(oid)).ratio() >= 0.7:
            continue
        cuando = oidas[min(b0, len(oidas) - 1)]['start'] if oidas else 0
        # la sinalefa: «registrada a tu» se pronuncia de un tirón y Whisper no escribe la «a»
        # (lo confirmó una segunda transcripción, 2026-10-25): una vocal suelta junto a la
        # misma vocal no es una palabra que la voz se comió
        if tag == 'delete' and len(esc) == 1 and esc[0] in ('a', 'e', 'o', 'y') and a0 > 0 and escritas[a0 - 1][-1:] in (esc[0], 'i' if esc[0] == 'y' else esc[0]):
            avisos.append(f'a los {cuando:.1f} s no se oye «{esc[0]}» tras «{escritas[a0 - 1]}»: sinalefa, no corte')
            continue
        if tag == 'delete' or (tag == 'replace' and len(esc) > len(oid) + 1):
            fallas.append(f'a los {cuando:.1f} s no se oye «{" ".join(esc)}»: ¿la voz se cortó en una frontera?')
        else:
            avisos.append(f'a los {cuando:.1f} s se oye «{" ".join(w["word"].strip() for w in oidas[b0:b1])}» donde el guion dice «{" ".join(esc) or "—"}»')
    if oidas:
        habla = sum(w['end'] - w['start'] for w in oidas)
        pps = len(oidas) / max(1e-6, oidas[-1]['end'] - oidas[0]['start'])
        datos['velocidad'] = f'{pps:.2f} palabras por segundo'
        if pps > 3.0:
            fallas.append(f'voz apurada: {pps:.2f} palabras por segundo (natural 2.2–3.0)')
        elif pps < 2.0:
            avisos.append(f'voz lenta: {pps:.2f} palabras por segundo; ¿leyó la dirección de voz?')
        datos['habla'] = f'{habla:.0f} s de {oidas[-1]["end"]:.0f} s'
    return fallas, avisos, datos


def sincronia(video, tolerancia=0.35):
    """Que cada momento anclado a una palabra (clic, foco, pantalla nueva) caiga cuando la voz
    la dice en el video FINAL: lo que se ve es lo que se dice en ese instante. Compara la
    línea de tiempo (linea.json) con lo que Whisper oye en el MP4 ya nivelado."""
    fallas, avisos, datos = [], [], {}
    linea = json.load(open(os.path.join(RAIZ, 'public', video, 'linea.json'), encoding='utf-8'))
    fps = linea['fps']
    deltas, sin_oir = [], []
    for m in linea['momentos']:
        t = m['f'] / fps
        buscada = norm(m['palabra'])
        cerca = [w for w in OIDAS if abs(w['end'] - t) < 2.0 and
                 (norm(w['word']).startswith(buscada) or difflib.SequenceMatcher(a=norm(w['word'])[:len(buscada) + 1], b=buscada).ratio() >= 0.75)]
        if not cerca:
            sin_oir.append(f'{m["escena"]} «{m["palabra"]}»')
            continue
        # el principio de una palabra tras un silencio, Whisper lo pone demasiado pronto; el
        # final es fiable, así que se recorta desde el final lo que no puede durar
        real = lambda w: max(w['start'], w['end'] - (0.14 + 0.075 * len(norm(w['word']))))
        w = min(cerca, key=lambda w: abs(real(w) - t))
        d = real(w) - t
        deltas.append(abs(d))
        if abs(d) > tolerancia:
            fallas.append(f'{m["escena"]} «{m["palabra"]}»: la pantalla actúa a los {t:.2f} s y la voz lo dice a los {real(w):.2f} s ({d:+.2f} s)')
    if deltas:
        datos['momentos'] = f'{len(deltas)} de {len(linea["momentos"])} oídos; desfase medio {sum(deltas) / len(deltas):.2f} s, máximo {max(deltas):.2f} s'
    for x in sin_oir:
        avisos.append(f'Whisper no oyó {x} cerca de su momento: confírmalo en la hoja')
    return fallas, avisos, datos


def hojas(video, mp4, carpeta, formato='corto'):
    if formato == 'tutorial':
        hoja = os.path.join(os.path.dirname(RAIZ), 'docs', 'capacitacion', 'videos-v2', 'hoja.py')
        subprocess.run([sys.executable, hoja, video.removeprefix('cap-'), mp4, os.path.join(carpeta, 'hoja-momentos.png'), '--despues', '0.5'], capture_output=True)
        subprocess.run([sys.executable, hoja, video.removeprefix('cap-'), mp4, os.path.join(carpeta, 'hoja-despues.png'), '--despues', '1.2'], capture_output=True)
        return
    if formato == 'comercial':
        # sin guion no hay escenas que contactos.py pueda rehacer: un cuadro por segundo
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp4, '-vf', 'fps=1,scale=320:180,tile=5x7', '-frames:v', '1',
                        os.path.join(carpeta, 'hoja-por-segundo.png')])
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-t', '3', '-i', mp4, '-vf', 'fps=4,scale=320:180,tile=4x3', '-frames:v', '1',
                        os.path.join(carpeta, 'gancho.png')])
        return
    chico = '216:384' if formato == 'corto' else '384:216'
    for nombre, en in (('inicio', 0.04), ('mitad', 0.5), ('final', 0.96)):
        subprocess.run([sys.executable, os.path.join(HERR, 'contactos.py'), video, mp4, os.path.join(carpeta, f'hoja-{nombre}.png'), '--en', str(en)], capture_output=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-t', '3', '-i', mp4, '-vf', f'fps=4,scale={chico},tile=6x2', '-frames:v', '1', os.path.join(carpeta, 'gancho.png')])


def main():
    # la consola de Windows es cp1252 y no imprime «→» ni «−» al redirigir la salida
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    argv = sys.argv[1:]
    formato = None
    if '--formato' in argv:
        k = argv.index('--formato')
        formato = argv[k + 1]
        del argv[k:k + 2]
    args = [a for a in argv if not a.startswith('-')]
    if not args or (formato and formato not in FORMATOS):
        print(__doc__)
        sys.exit(2)
    video = args[0]
    mp4 = os.path.abspath(args[1]) if len(args) > 1 else ultima_version(video)
    formato = formato or formato_de(video, mp4)
    reglas = FORMATOS[formato]
    lufs = float(os.environ.get('LUFS', reglas['lufs']))
    version = re.search(r'-(v\d+)\.mp4$', mp4)
    carpeta = os.path.join(RAIZ, 'out', 'calidad', f'{video}-{version.group(1) if version else "borrador"}')
    os.makedirs(carpeta, exist_ok=True)

    no_aplica = ('', [], [], {'no aplica': f'formato {formato}'})
    partes = [('Guion',) + (guion(video) if reglas['guion'] else no_aplica[1:])]
    # si el render falló, la última versión de out/historial es una vieja: se revisaría el
    # video equivocado y la voz «fallaría» contra un guion que no es el suyo (2026-10-21)
    for f in ('guion.json', 'palabras.json'):
        fuente = os.path.join(RAIZ, 'public', video, f)
        if os.path.exists(fuente) and os.path.getmtime(mp4) < os.path.getmtime(fuente):
            partes.insert(0, ('Versión', [f'{os.path.basename(mp4)} es anterior a {f}: ¿falló el render? Se está revisando un video viejo'], [], {}))
            break
    total_fallas = 0
    if reglas['estilo']:
        linea_estilo, f_estilo = estilo(video)
        partes.append(('Estilo', f_estilo, [], {'textos': linea_estilo}))
    else:
        partes.append(('Estilo',) + no_aplica[1:])
    f, a = animacion(mp4, reglas['quieta'], logo_al_final=formato == 'comercial')
    partes.append(('Animación', f, a, {'toma quieta desde': f'{reglas["quieta"]} s'}))
    partes.append(('Audio',) + audio(mp4, lufs))
    partes.append(('Voz',) + (voz(video, mp4, carpeta) if reglas['voz'] else no_aplica[1:]))
    if formato == 'tutorial':
        partes.append(('Sincronía',) + sincronia(video))
    hojas(video, mp4, carpeta, formato)

    md = [f'# Control de calidad · {os.path.basename(mp4)} · formato {formato}', '']
    for nombre, fallas, avisos, datos in partes:
        total_fallas += len(fallas)
        md.append(f'## {nombre}: {"FALLA" if fallas else "no aplica" if "no aplica" in datos else "pasa"}')
        md += [f'- {k}: {v}' for k, v in datos.items()]
        md += [f'- **FALLA** {x}' for x in fallas]
        md += [f'- aviso: {x}' for x in avisos]
        md.append('')
    hojas_a_mirar = ('`hoja-por-segundo.png` y `gancho.png`' if formato == 'comercial'
                     else '`hoja-momentos.png` y `hoja-despues.png` (un cuadro por momento, con su palabra)' if formato == 'tutorial'
                     else '`hoja-inicio.png`, `hoja-mitad.png`, `hoja-final.png` y `gancho.png`')
    rubrica = {'corto': 'la rúbrica (reglas-de-los-cortos.md §6) en `public/<video>/revision.md`',
               'video': 'la ronda en `public/<video>/revision.md` (skill /video, paso 4)',
               'comercial': 'lo encontrado en `public/<comercial>/storyboard.md` (comerciales.md)',
               'tutorial': 'la ronda en `public/<video>/revision.md` (docs/capacitacion/videos-v2/LEEME.md)'}[formato]
    md += ['## A ojo', '', f'Mirar {hojas_a_mirar}:',
           'texto que tapa la imagen o se sale de la zona segura, piezas cortadas, saltos en las',
           f'fronteras, un texto que no se entiende sin sonido. Luego, {rubrica}.', '']
    open(os.path.join(carpeta, 'informe.md'), 'w', encoding='utf-8').write('\n'.join(md))
    print('\n'.join(md))
    print(f'→ {carpeta}')
    sys.exit(1 if total_fallas else 0)


if __name__ == '__main__':
    main()
