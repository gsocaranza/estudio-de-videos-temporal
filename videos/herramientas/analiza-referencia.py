# -*- coding: utf-8 -*-
"""
Desarma un video de referencia (de YouTube) con Gemini, que lo ve entero:
imagen y audio. Sirve para estudiar un estilo antes de imitarlo.

CORRE EN EL SERVIDOR, no aquí: la llave de Gemini (GEMINI_API_KEY, la de
Franklin) vive en el .env de producción y no sale de ahí. Y desde este
equipo YouTube no deja bajar nada sin sesión («Sign in to confirm you're not
a bot»), mientras que a Gemini se le pasa la URL tal cual.

    scp herramientas/analiza-referencia.py herramientas/prompts/*.txt puntualiza-app:/tmp/ref/
    ssh puntualiza-app "cd /tmp/ref && sudo python3 -I analiza-referencia.py <url> desarme.txt desarme.md"
    ssh puntualiza-app "cd /tmp/ref && sudo python3 -I analiza-referencia.py <url> visual.txt visual.md --fino"
    scp puntualiza-app:/tmp/ref/*.md docs/videos-explicativos/referencias/<nombre>/

`--fino` lo ve a 4 cuadros por segundo y en alta resolución: diez veces más
tokens (~160 000 para 2:30, unos centavos de dólar con Flash), y es lo que
hace falta para describir movimiento. Sin él, 1 cuadro por segundo basta para
el guion y la estructura.
"""
import json
import sys
import urllib.error
import urllib.request

MODELO = "gemini-3.8-flash"

url, archivo_prompt, salida = sys.argv[1:4]
fino = "--fino" in sys.argv

clave = None
with open("/var/www/puntualiza/.env", encoding="utf-8") as f:
    for linea in f:
        if linea.startswith("GEMINI_API_KEY="):
            clave = linea.split("=", 1)[1].strip().strip('"').strip("'")
if not clave:
    sys.exit("Sin GEMINI_API_KEY en el .env")

with open(archivo_prompt, encoding="utf-8") as f:
    prompt = f.read()

video = {"file_data": {"file_uri": url, "mime_type": "video/*"}}
config = {"maxOutputTokens": 60000, "temperature": 0.3}
if fino:
    video["video_metadata"] = {"fps": 4}
    config["mediaResolution"] = "MEDIA_RESOLUTION_HIGH"

cuerpo = {"contents": [{"parts": [video, {"text": prompt}]}], "generationConfig": config}

peticion = urllib.request.Request(
    f"https://generativelanguage.googleapis.com/v1beta/models/{MODELO}:generateContent",
    data=json.dumps(cuerpo).encode(),
    headers={"Content-Type": "application/json", "x-goog-api-key": clave},
)
try:
    with urllib.request.urlopen(peticion, timeout=900) as r:
        datos = json.load(r)
except urllib.error.HTTPError as e:
    sys.exit(f"HTTP {e.code}: {e.read().decode()[:2000]}")

texto = "".join(
    p.get("text", "")
    for c in datos.get("candidates", [])
    for p in c.get("content", {}).get("parts", [])
)
with open(salida, "w", encoding="utf-8") as f:
    f.write(texto)
print("uso:", json.dumps(datos.get("usageMetadata", {})))
print("fin:", [c.get("finishReason") for c in datos.get("candidates", [])])
