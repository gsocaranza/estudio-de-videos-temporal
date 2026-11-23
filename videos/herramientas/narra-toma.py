# -*- coding: utf-8 -*-
"""
La voz de un corto en UNA sola toma, partida por escenas.

Uso:  python herramientas/narra-toma.py <video>            (p. ej. las-ocho-horas)
      python herramientas/narra-toma.py <video> --reusa  (no pide otra toma: vuelve a partir la que hay)
      python herramientas/narra-toma.py <video> --toma ruta.wav   (parte una toma ya grabada y elegida)

Por qué existe (2026-10-19): con una pista por escena, cada frase sale con su
propia entonación y las uniones se oyen; el supervisor la oyó «falsa y muy
alegre». Aquí toda la narración se pide de una vez —el tono queda parejo y las
pausas entre frases son las de la voz— y después se parte.

La voz es `gemini-3.8-flash-tts` con Kore, por la API de Gemini, cuya llave vive
en el .env del servidor: el guion sube al servidor, la toma se genera allá con
herramientas/voz-gemini.py y baja como WAV. Ese modelo no acepta instrucción de
sistema y LEE EN VOZ ALTA la dirección que va antes del texto; esa lectura es lo
que le da el tono que eligió el supervisor, así que se pide con la dirección y
se recorta con Whisper.

Lee   public/<video>/guion.json  (escenas[].texto, direccion_voz)
Deja  public/<video>/voz/toma.wav             la toma entera, ya sin la dirección
      public/<video>/voz/<id>.wav             una pista por escena
      public/<video>/duraciones.json, palabras.json   como narra.py
"""
import difflib
import json
import os
import re
import subprocess
import sys
import unicodedata

MODELO = os.environ.get("VOZ_MODELO", "gemini-3.8-flash-tts")
VOZ = os.environ.get("VOZ", "Kore")
SERVIDOR = "puntualiza-app"
REMOTO = os.environ.get("VOZ_REMOTO", "/tmp/voz-videos")  # otra carpeta si otra sesión pide voces a la vez


def norm(t):
    t = unicodedata.normalize("NFD", t.lower()).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", t)


def toma(base, guion):
    """Pide la toma en el servidor y la baja."""
    # DE CORRIDO, separado por espacios: con un párrafo por escena el modelo lee cada pedazo
    # con entonación de frase suelta y suena robótico (supervisor, 2026-10-19, eligió la toma
    # corrida). Las pausas se diseñan después, como silencio entre pistas (las colas).
    texto = " ".join(e["texto"] for e in guion["escenas"])
    direccion = guion.get("direccion_voz", "")
    aqui = os.path.dirname(__file__)
    subprocess.run(["ssh", SERVIDOR, f"mkdir -p {REMOTO}"], check=True)
    subprocess.run(["scp", "-q", os.path.join(aqui, "voz-gemini.py"), f"{SERVIDOR}:{REMOTO}/"], check=True)
    # el texto y la dirección viajan en un JSON, no en la línea de órdenes
    pedido = os.path.join(base, "voz", "pedido.json")
    json.dump({"texto": texto, "direccion": direccion}, open(pedido, "w", encoding="utf-8"), ensure_ascii=False)
    subprocess.run(["scp", "-q", pedido, f"{SERVIDOR}:{REMOTO}/pedido.json"], check=True)
    orden = (f"cd {REMOTO} && sudo python3 -I voz-gemini.py {MODELO} {VOZ} cruda.wav "
             f"--pedido pedido.json")
    subprocess.run(["ssh", SERVIDOR, orden], check=True)
    cruda = os.path.join(base, "voz", "cruda.wav")
    subprocess.run(["scp", "-q", f"{SERVIDOR}:{REMOTO}/cruda.wav", cruda], check=True)
    os.remove(pedido)
    return cruda


def main():
    video = sys.argv[1]
    base = os.path.join(os.path.dirname(__file__), "..", "public", video)
    guion = json.load(open(os.path.join(base, "guion.json"), encoding="utf-8"))
    # las escenas con «voz»: «ivr» las dice el sistema de la llamada, con otra voz (voz-ivr.py)
    guion['escenas'] = [e for e in guion['escenas'] if e.get('voz') != 'ivr']
    os.makedirs(os.path.join(base, "voz"), exist_ok=True)
    cruda = os.path.join(base, "voz", "cruda.wav")
    if "--toma" in sys.argv:
        # una toma ya grabada (p. ej. la que eligió el supervisor entre varias): se copia y se parte
        elegida = sys.argv[sys.argv.index("--toma") + 1]
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", elegida, cruda], check=True)
    elif "--reusa" not in sys.argv:
        cruda = toma(base, guion)

    # TEMPO=1.08 acelera sin cambiar el tono de la voz (atempo de ffmpeg): el modelo
    # no tiene control de velocidad y cada toma sale a un ritmo un poco distinto
    tempo = float(os.environ.get("TEMPO", guion.get("tempo_voz", 1.0)))
    if abs(tempo - 1.0) > 0.001:
        rapida = os.path.join(base, "voz", "cruda-tempo.wav")
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", cruda, "-filter:a", f"atempo={tempo}", rapida], check=True)
        cruda = rapida

    import whisper  # pip install openai-whisper

    modelo = whisper.load_model(os.environ.get("WHISPER", "small"))
    r = modelo.transcribe(cruda, language="es", word_timestamps=True)
    oidas = [w for s in r["segments"] for w in s["words"]]
    oidas_n = [norm(w["word"]) for w in oidas]

    # las palabras del guion, con la escena a la que pertenecen. La dirección de voz va
    # delante como escena -1: el modelo la lee en voz alta, y sin ella en la alineación la
    # primera escena se ancla a la primera palabra que se le parezca DENTRO de la dirección
    # («…en la voz. Nada de locutora… En Puntualiza…» se quedaba pegado a la escena 1 en el
    # piloto de capacitación, 2026-10-25)
    escritas, de_escena = [], []
    for p in guion.get("direccion_voz", "").split():
        if norm(p):
            escritas.append(norm(p))
            de_escena.append(-1)
    for k, e in enumerate(guion["escenas"]):
        for p in e["texto"].split():
            if norm(p):
                escritas.append(norm(p))
                de_escena.append(k)

    # alinear lo escrito con lo oído (Whisper escribe «8» donde se dijo «ocho»: lo que no
    # coincide se salta, y cada escena se ubica por las palabras que sí coinciden)
    sm = difflib.SequenceMatcher(a=escritas, b=oidas_n, autojunk=False)
    mapa = {}
    for a, b, n in sm.get_matching_blocks():
        for i in range(n):
            mapa[a + i] = b + i
    # lo que Whisper oyó casi igual también cuenta («esforza» por «Sforza», R2 2026-10-20):
    # sin esto, el nombre que cierra una escena se va a la siguiente
    for tag, a0, a1, b0, b1 in sm.get_opcodes():
        if tag != "replace":
            continue
        j = b0
        for i in range(a0, a1):
            for jj in range(j, b1):
                if difflib.SequenceMatcher(a=escritas[i], b=oidas_n[jj]).ratio() >= 0.75:
                    mapa[i] = jj
                    j = jj + 1
                    break
    n_esc = len(guion["escenas"])
    primera, ultima = {}, {}
    for i, k in enumerate(de_escena):
        if i in mapa and k >= 0:
            primera.setdefault(k, mapa[i])
            ultima[k] = mapa[i]
    faltan = [guion["escenas"][k]["id"] for k in range(n_esc) if k not in primera]
    if faltan:
        sys.exit(f"No encontré en la voz las escenas {faltan}. Lo oído: {' '.join(w['word'] for w in oidas)}")

    # la primera palabra de cada escena: la que sigue a la última de la anterior. Si entre
    # las dos quedaron palabras sin emparejar —casi siempre cifras: Whisper escribe «1955» o
    # «2 ,000» donde el guion dice «mil novecientos…»—, la escena anterior termina en la
    # primera puntuación que Whisper puso en ese hueco (R5, 2026-10-21: «1955.» y «20,» se
    # iban a la escena siguiente).
    # Pero si la PRIMERA palabra escrita de la escena sí se encontró, no hay nada que
    # adivinar: lo del hueco es de la anterior (R13, 2026-10-23: «…desde enero de 2023 y
    # suben» sin coma, y «2023» se iba a la escena siguiente).
    inicio_escrito = {}
    for i, k in enumerate(de_escena):
        if k >= 0:
            inicio_escrito.setdefault(k, i)
    for k in range(1, n_esc):
        a, b = ultima[k - 1], primera[k]
        if mapa.get(inicio_escrito[k]) == b:
            continue
        puntos = [j for j in range(a, b) if re.search(r"[.?!…,;:]\s*$", oidas[j]["word"].strip())]
        primera[k] = puntos[0] + 1 if puntos else min(b, a + 1)
    # lo mismo para la primera escena, contra el final de la dirección: un nombre que
    # Whisper escribe de otra forma («Maryana» por «Mariana», ruta-ambar v2, 2026-11-09) se
    # quedaba fuera del corte y la escena empezaba en la segunda palabra
    de_la_direccion = [mapa[i] for i, k in enumerate(de_escena) if k == -1 and i in mapa]
    if de_la_direccion and mapa.get(inicio_escrito[0]) != primera[0]:
        a, b = max(de_la_direccion), primera[0]
        puntos = [j for j in range(a, b) if re.search(r"[.?!…,;:]\s*$", oidas[j]["word"].strip())]
        primera[0] = puntos[0] + 1 if puntos else min(b, a + 1)

    # cortes: antes de la primera palabra, y a la mitad del silencio entre escenas
    # el primero, desde donde de verdad empieza el habla: Whisper pone el principio de la
    # primera palabra tarde y el corte se comía su sílaba inicial («Ma» de «Mariana», 120 ms,
    # ruta-ambar v2). Se retrocede, de 10 en 10 ms y hasta medio segundo, mientras suene.
    import numpy as np
    audio = whisper.load_audio(cruda)
    ini0 = oidas[primera[0]]["start"]
    paso = 160  # 10 ms a 16 kHz
    for _ in range(50):
        i = int(ini0 * 16000)
        trozo = audio[max(0, i - paso):i]
        if not len(trozo) or 20 * np.log10(np.sqrt(np.mean(trozo ** 2)) + 1e-9) < -45:
            break
        ini0 -= 0.01
    cortes = [max(0.0, ini0 - 0.06)]
    for k in range(1, n_esc):
        fin_prev = oidas[primera[k] - 1]["end"]
        ini = oidas[primera[k]]["start"]
        cortes.append((fin_prev + ini) / 2 if ini > fin_prev else ini)
    fin_total = oidas[-1]["end"] + 0.25
    cortes.append(fin_total)
    # «corre_inicio»: segundos que se corre el corte de una escena. Whisper a veces pone el
    # principio de una palabra antes de tiempo, y el corte a la mitad del silencio se come la
    # última vocal de la escena anterior («publicó» en el piloto, auditoría v6).
    for k, e in enumerate(guion["escenas"]):
        if k and e.get("corre_inicio"):
            cortes[k] += float(e["corre_inicio"])

    duraciones, palabras = {}, {}
    for k, e in enumerate(guion["escenas"]):
        a, b = cortes[k], cortes[k + 1]
        # «recorta_hasta»: la escena empieza en esa palabra y lo dicho antes se quita de la
        # toma (un ajuste de guion sin volver a narrar la voz que eligió el supervisor)
        if e.get("recorta_hasta"):
            hasta_k = primera[k + 1] if k + 1 < n_esc else len(oidas)
            for i in range(primera[k], hasta_k):
                if norm(oidas[i]["word"]).startswith(norm(e["recorta_hasta"])):
                    a = max(a, oidas[i]["start"] - 0.08)
                    primera[k] = i
                    break
            else:
                sys.exit(f"{e['id']}: no encontré «{e['recorta_hasta']}» para recortar")
        ruta = os.path.join(base, "voz", e["id"] + ".wav")
        # 10 ms de fundido en cada orilla: sin él, un corte a media onda se oye como chasquido
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", cruda,
                        "-af", f"afade=t=in:d=0.01,afade=t=out:st={max(0.0, b - a - 0.01):.3f}:d=0.01",
                        "-ar", "48000", "-c:a", "pcm_s16le", ruta], check=True)
        duraciones[e["id"]] = round(b - a, 3)
        hasta = primera[k + 1] if k + 1 < n_esc else len(oidas)
        palabras[e["id"]] = {"palabras": [
            {"p": w["word"].strip(), "ini": round(max(0.0, w["start"] - a), 2), "fin": round(w["end"] - a, 2)}
            for w in oidas[primera[k]:hasta]
        ]}
        dichas = " ".join(w["p"] for w in palabras[e["id"]]["palabras"])
        print(f"{e['id']:18s} {b - a:6.2f}s  {dichas}")
    # la toma entera, sin la dirección (para escucharla de corrido)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{cortes[0]:.3f}", "-to", f"{fin_total:.3f}", "-i", cruda,
                    "-ar", "48000", "-c:a", "pcm_s16le", os.path.join(base, "voz", "toma.wav")], check=True)
    json.dump(duraciones, open(os.path.join(base, "duraciones.json"), "w", encoding="utf-8"), indent=2)
    json.dump(palabras, open(os.path.join(base, "palabras.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"total {sum(duraciones.values()):.1f}s de voz")


if __name__ == "__main__":
    main()
