# -*- coding: utf-8 -*-
"""
La voz del SISTEMA en un video de la llamada: las escenas con `"voz": "ivr"`.

    python herramientas/voz-ivr.py <video>          (después de narra-toma.py)

En «Marcar por llamada» (2026-11-04) lo que dice el conmutador —«Bienvenido.
Marque su codigo de cuatro digitos.»— no lo lee la narradora: se oye como se
oiría al teléfono, con otra voz y pasado por un filtro de línea telefónica
(300–3,400 Hz, muestreo de 8 kHz), para que quien mira distinga a quien le
explica de lo que va a oír. Los textos son los de `IvrGuion` y `MotivoRechazo`.

narra-toma.py y tomas-en-paralelo.py se saltan estas escenas; esto las narra
una por una en el servidor (la llave de Gemini vive allá), las filtra, y
AGREGA su duración a `duraciones.json` y sus palabras (Whisper) a
`palabras.json`, que narra-toma.py acaba de escribir. Por eso va después.

VOZ_IVR (Despina por omisión) cambia la voz.
"""
import json
import os
import subprocess
import sys

SERVIDOR = "puntualiza-app"
MODELO = os.environ.get("VOZ_MODELO", "gemini-3.8-flash-tts")
VOZ = os.environ.get("VOZ_IVR", "Despina")
AQUI = os.path.dirname(os.path.abspath(__file__))
# la línea telefónica: banda angosta, muestreo de 8 kHz y un poco de compresión
LINEA = ("highpass=f=300,lowpass=f=3400,aresample=8000,aresample=48000,"
         "acompressor=threshold=-18dB:ratio=3:attack=5:release=60,volume=1.4")


def main():
    video = sys.argv[1]
    base = os.path.join(AQUI, "..", "public", video)
    guion = json.load(open(os.path.join(base, "guion.json"), encoding="utf-8"))
    ivr = [e for e in guion["escenas"] if e.get("voz") == "ivr"]
    if not ivr:
        sys.exit("El guion no tiene escenas con «voz»: «ivr».")
    remoto = f"/tmp/voz-ivr-{video}"
    voz = os.path.join(base, "voz")
    os.makedirs(voz, exist_ok=True)
    subprocess.run(["ssh", SERVIDOR, f"rm -rf {remoto} && mkdir -p {remoto}"], check=True)
    subprocess.run(["scp", "-q", os.path.join(AQUI, "voz-gemini.py"), f"{SERVIDOR}:{remoto}/"], check=True)
    pedidos = []
    for e in ivr:
        ruta = os.path.join(voz, f"pedido-{e['id']}.json")
        # sin dirección: este modelo la leería en voz alta, y en una frase de tres segundos
        # no hay dónde recortarla
        json.dump({"texto": e["texto"], "direccion": ""}, open(ruta, "w", encoding="utf-8"), ensure_ascii=False)
        pedidos.append(ruta)
    subprocess.run(["scp", "-q"] + pedidos + [f"{SERVIDOR}:{remoto}/"], check=True)
    orden = f"cd {remoto} ; " + " ".join(
        f"( sudo python3 -I voz-gemini.py {MODELO} {VOZ} ivr-{e['id']}.wav --pedido pedido-{e['id']}.json > log-{e['id']}.txt 2>&1 ; touch fin-{e['id']} ) &"
        for e in ivr
    ) + f" for i in $(seq 1 90); do [ $(ls fin-* 2>/dev/null | wc -l) -ge {len(ivr)} ] && break; sleep 3; done; cat log-*.txt"
    subprocess.run(["ssh", SERVIDOR, orden], check=True, timeout=400)
    subprocess.run(["scp", "-q", f"{SERVIDOR}:{remoto}/ivr-*.wav", voz + "/"], check=True)
    for ruta in pedidos:
        os.remove(ruta)

    import whisper  # pip install openai-whisper

    modelo = whisper.load_model(os.environ.get("WHISPER", "small"))
    duraciones = json.load(open(os.path.join(base, "duraciones.json"), encoding="utf-8"))
    palabras = json.load(open(os.path.join(base, "palabras.json"), encoding="utf-8"))
    for e in ivr:
        cruda = os.path.join(voz, f"ivr-{e['id']}.wav")
        salida = os.path.join(voz, f"{e['id']}.wav")
        # sin el silencio de las orillas, y con la línea encima
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", cruda, "-af",
                        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
                        "silenceremove=start_periods=1:start_threshold=-45dB,areverse,"
                        "adelay=80|80,apad=pad_dur=0.12," + LINEA,
                        "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le", salida], check=True)
        dura = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", salida],
                                    capture_output=True, text=True).stdout)
        r = modelo.transcribe(cruda, language="es", word_timestamps=True)
        oidas = [w for s in r["segments"] for w in s["words"]]
        corrimiento = oidas[0]["start"] - 0.08 if oidas else 0.0
        duraciones[e["id"]] = round(dura, 3)
        palabras[e["id"]] = {"palabras": [
            {"p": w["word"].strip(), "ini": round(max(0.0, w["start"] - corrimiento), 2), "fin": round(w["end"] - corrimiento, 2)}
            for w in oidas
        ]}
        print(f"{e['id']:4s} {dura:5.2f}s  {' '.join(w['p'] for w in palabras[e['id']]['palabras'])}")
    # en el orden del guion, para que se lea igual que los demás
    orden_ids = [e["id"] for e in guion["escenas"]]
    json.dump({k: duraciones[k] for k in orden_ids if k in duraciones}, open(os.path.join(base, "duraciones.json"), "w", encoding="utf-8"), indent=2)
    json.dump({k: palabras[k] for k in orden_ids if k in palabras}, open(os.path.join(base, "palabras.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
