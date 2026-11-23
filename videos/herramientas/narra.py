# -*- coding: utf-8 -*-
"""
La voz de un video: una pista por escena y el archivo de duraciones que
dimensiona el video.

Uso:  python herramientas/narra.py <video>            (p. ej. marca-tu-jornada)
      python herramientas/narra.py <video> --rehace 03-duda   (vuelve a narrar una)

Lee   public/<video>/guion.json
Deja  public/<video>/voz/<id>.wav
      public/<video>/duraciones.json   cuánto dura cada pista
      public/<video>/palabras.json     cuándo empieza cada palabra (Whisper)

Las palabras son lo que sincroniza la imagen con la voz: una escena dice
«la palomita sale cuando dice "entrada"» (`palabra('05-entrada', 'entrada')`)
y no «a los 3.4 segundos», así que volver a narrar no descuadra nada. Las
saca Whisper en este equipo (`pip install openai-whisper`), con el modelo
`base`; sin Whisper el paso se salta y avisa.

La voz sale de Text-to-Speech de Google Cloud, proyecto puntualiza-app-2026, con
`gemini-2.5-flash-tts` y la voz Kore (mujer, es-US), que es la que pidió el
supervisor para los videos de Puntualiza. El token es el de `gcloud`, así que
no hay ninguna llave en el repositorio. Una pista que ya existe no se vuelve a
pedir: cambiar un texto es borrar su .wav o pasar --rehace.

Se pide en LINEAR16 y no en MP3: el MP3 trae un relleno al inicio que
descuadra la sincronía unas decenas de milisegundos, y el video se arma a
cuadro exacto.
"""
import base64
import json
import os
import subprocess
import sys
import urllib.request
import wave

PROYECTO = "puntualiza-app-2026"
VOZ = os.environ.get("VOZ", "Kore")
MODELO = os.environ.get("VOZ_MODELO", "gemini-2.5-flash-tts")


def token():
    return subprocess.check_output("gcloud auth print-access-token", shell=True, text=True).strip()


def sintetiza(tok, texto, estilo, velocidad):
    cuerpo = {
        "input": {"text": texto, "prompt": estilo},
        "voice": {"languageCode": "es-US", "name": VOZ, "modelName": MODELO},
        # speakingRate sí lo respeta gemini-2.5-flash-tts (medido el
        # 2026-10-16): 1.0 da ~2.05 palabras/s y 1.2 da ~2.6, sin comerse
        # palabras. Pedir «ritmo ágil» en el estilo apenas lo mueve.
        "audioConfig": {"audioEncoding": "LINEAR16", "sampleRateHertz": 48000, "speakingRate": velocidad},
    }
    req = urllib.request.Request(
        "https://texttospeech.googleapis.com/v1beta1/text:synthesize",
        data=json.dumps(cuerpo).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {tok}",
            "x-goog-user-project": PROYECTO,
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        return base64.b64decode(json.load(r)["audioContent"])


def duracion(ruta):
    with wave.open(ruta) as w:
        return w.getnframes() / w.getframerate()


def main():
    video = sys.argv[1]
    rehacer = set(sys.argv[sys.argv.index("--rehace") + 1:]) if "--rehace" in sys.argv else set()
    base = os.path.join(os.path.dirname(__file__), "..", "public", video)
    guion = json.load(open(os.path.join(base, "guion.json"), encoding="utf-8"))
    carpeta = os.path.join(base, "voz")
    os.makedirs(carpeta, exist_ok=True)

    tok = None
    duraciones = {}
    for escena in guion["escenas"]:
        ruta = os.path.join(carpeta, escena["id"] + ".wav")
        if escena["id"] in rehacer or not os.path.exists(ruta):
            tok = tok or token()
            # LINEAR16 llega con su cabecera WAV puesta.
            open(ruta, "wb").write(sintetiza(tok, escena["texto"], guion.get("estilo_voz", ""), guion.get("velocidad_voz", 1.0)))
        duraciones[escena["id"]] = round(duracion(ruta), 3)
        # Gemini TTS a veces LEE EN VOZ ALTA la indicación de estilo (pasó
        # el 2026-10-16 con un estilo que llevaba dos puntos): la pista sale
        # bien formada y el doble de larga. Español narrado va a ~2.3
        # palabras por segundo; por debajo de 1.5 algo sobra.
        palabras = len(escena["texto"].split())
        ritmo = palabras / duraciones[escena["id"]]
        aviso = "  <-- ¿leyó el estilo? escúchala o pasa --rehace" if ritmo < 1.5 else ""
        print(f"{escena['id']:18s} {duraciones[escena['id']]:6.2f}s  {ritmo:4.2f} pal/s{aviso}")

    json.dump(duraciones, open(os.path.join(base, "duraciones.json"), "w", encoding="utf-8"), indent=2)
    print(f"total {sum(duraciones.values()):.1f}s de voz")
    marca_palabras(base, guion, carpeta)


def marca_palabras(base, guion, carpeta):
    ruta = os.path.join(base, "palabras.json")
    previas = json.load(open(ruta, encoding="utf-8")) if os.path.exists(ruta) else {}
    try:
        import whisper
    except ImportError:
        print("Sin Whisper: palabras.json no se actualizó (pip install openai-whisper)")
        return
    modelo = None
    for escena in guion["escenas"]:
        wav = os.path.join(carpeta, escena["id"] + ".wav")
        # se rehace si la pista es más nueva que la última marca
        if escena["id"] in previas and previas[escena["id"]].get("mtime") == os.path.getmtime(wav):
            continue
        modelo = modelo or whisper.load_model("base")
        r = modelo.transcribe(wav, language="es", word_timestamps=True, fp16=False)
        palabras = [
            {"p": w["word"].strip(), "ini": round(w["start"], 3), "fin": round(w["end"], 3)}
            for seg in r["segments"] for w in seg.get("words", [])
        ]
        previas[escena["id"]] = {"mtime": os.path.getmtime(wav), "palabras": palabras}
        print(f"{escena['id']:18s} {len(palabras)} palabras: {r['text'].strip()}")
    json.dump(previas, open(ruta, "w", encoding="utf-8"), ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
