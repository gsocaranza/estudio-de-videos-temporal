"""
Voz con la API de Gemini. CORRE EN EL SERVIDOR: la llave (GEMINI_API_KEY, la de
Franklin) vive en el .env de producción y no sale de ahí. La sube y la llama
herramientas/narra-toma.py.

Uso: sudo python3 -I voz-gemini.py <modelo> <voz> <salida.wav> --pedido pedido.json
     (pedido.json: {"texto": "...", "direccion": "..."})

`gemini-3.8-flash-tts` no acepta instrucción de sistema y lee en voz alta la
dirección que va antes del texto; esa lectura le da el tono y narra-toma.py la
recorta con Whisper.
"""
import base64
import json
import sys
import urllib.error
import urllib.request
import wave

modelo, voz, salida = sys.argv[1:4]
pedido = json.load(open(sys.argv[sys.argv.index("--pedido") + 1], encoding="utf-8"))
texto, direccion = pedido["texto"], pedido.get("direccion", "")

clave = None
for linea in open("/var/www/puntualiza/.env", encoding="utf-8"):
    if linea.startswith("GEMINI_API_KEY="):
        clave = linea.split("=", 1)[1].strip().strip('"').strip("'")
if not clave:
    sys.exit("Sin GEMINI_API_KEY en el .env")

entrada = direccion + "\n\n" + texto if direccion else texto
cuerpo = {
    "contents": [{"parts": [{"text": entrada}]}],
    "generationConfig": {
        "responseModalities": ["AUDIO"],
        "speechConfig": {"voiceConfig": {"prebuiltVoiceConfig": {"voiceName": voz}}},
    },
}
req = urllib.request.Request(
    f"https://generativelanguage.googleapis.com/v1beta/models/{modelo}:generateContent",
    data=json.dumps(cuerpo).encode(),
    headers={"Content-Type": "application/json", "x-goog-api-key": clave},
)
try:
    datos = json.load(urllib.request.urlopen(req, timeout=600))
except urllib.error.HTTPError as e:
    sys.exit(f"HTTP {e.code}: {e.read().decode()[:400]}")

parte = datos["candidates"][0]["content"]["parts"][0]["inlineData"]
audio = base64.b64decode(parte["data"])
if "wav" in parte.get("mimeType", ""):
    # los modelos nuevos ya mandan el WAV con su cabecera
    open(salida, "wb").write(audio)
else:
    # los 2.5 y 3.1 mandan PCM crudo (audio/l16, 24 kHz)
    with wave.open(salida, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(24000)
        w.writeframes(audio)
print("ok", salida, parte.get("mimeType"))
