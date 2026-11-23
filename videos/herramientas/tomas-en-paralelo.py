# -*- coding: utf-8 -*-
"""
Pide varias tomas de voz a la vez y las ordena por su parecido al tono de referencia.

    python herramientas/tomas-en-paralelo.py <video> <n> <carpeta>
    python herramientas/tomas-en-paralelo.py el-plazo 8 ../out/tomas/el-plazo

Nació el 2026-10-21. Buscar el tono de referencia pedía muchas tomas, y con
narra-toma.py cada una tardaba ~2.5 min, una detrás de otra: la genera el
servidor, baja y Whisper la escucha entera en este equipo para partirla por
escenas. Doce tomas eran media hora («¿por qué tarda tanto?», supervisor). Para
ELEGIR no hace falta partirla, así que:

  1. el servidor genera las n tomas EN PARALELO (voz-gemini.py, la misma llamada de narra-toma.py);
  2. bajan como <carpeta>/cruda-<k>.wav, con la dirección leída al principio;
  3. tono.py las mide saltándose esos primeros segundos y las ordena por distancia
     a videos/plantillas/voz-de-referencia.wav.

Whisper corre después, sólo con la elegida:
`narra-toma.py <video> --toma <carpeta>/cruda-<k>.wav`, que la recorta, la parte
y deja palabras.json, y audita-guion.py la revisa.
"""
import json
import os
import subprocess
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
SERVIDOR = 'puntualiza-app'
# VOZ_REMOTO: otra carpeta en el servidor cuando otra sesión pide voces a la vez (2026-10-25:
# dos sesiones en /tmp/voz-videos/paralelo se borraron las tomas una a la otra)
REMOTO = os.environ.get('VOZ_REMOTO', '/tmp/voz-videos') + '/paralelo'
MODELO = os.environ.get('VOZ_MODELO', 'gemini-3.8-flash-tts')
VOZ = os.environ.get('VOZ', 'Kore')
SALTA = 14  # segundos de la dirección leída al principio de la toma cruda


def main():
    video, n, carpeta = sys.argv[1], int(sys.argv[2]), os.path.abspath(sys.argv[3])
    os.makedirs(carpeta, exist_ok=True)
    guion = json.load(open(os.path.join(RAIZ, 'public', video, 'guion.json'), encoding='utf-8'))
    # las escenas con «voz»: «ivr» las dice el sistema de la llamada, con otra voz (voz-ivr.py)
    guion['escenas'] = [e for e in guion['escenas'] if e.get('voz') != 'ivr']
    pedido = os.path.join(carpeta, 'pedido.json')
    # de corrido, como narra-toma.py: un párrafo por escena suena robótico
    json.dump({'texto': ' '.join(e['texto'] for e in guion['escenas']), 'direccion': guion.get('direccion_voz', '')},
              open(pedido, 'w', encoding='utf-8'), ensure_ascii=False)
    subprocess.run(['ssh', '-o', 'ServerAliveInterval=20', SERVIDOR, f'rm -rf {REMOTO} && mkdir -p {REMOTO}'], check=True)
    subprocess.run(['scp', '-q', os.path.join(AQUI, 'voz-gemini.py'), pedido, f'{SERVIDOR}:{REMOTO}/'], check=True)
    # cada proceso deja «fin-k» al terminar, bien o mal: se espera a eso y no a que exista el
    # WAV, que podría estar a medio escribir
    orden = f'cd {REMOTO} ; ' + ' '.join(
        f'( sudo python3 -I voz-gemini.py {MODELO} {VOZ} cruda-{k}.wav --pedido pedido.json > log-{k}.txt 2>&1 ; touch fin-{k} ) &' for k in range(1, n + 1)
    ) + ' for i in $(seq 1 120); do [ $(ls fin-* 2>/dev/null | wc -l) -ge ' + str(n) + ' ] && break; sleep 5; done; ls cruda-*.wav; cat log-*.txt'
    subprocess.run(['ssh', '-o', 'ServerAliveInterval=20', SERVIDOR, orden], check=True, timeout=720)
    subprocess.run(['scp', '-q', f'{SERVIDOR}:{REMOTO}/cruda-*.wav', carpeta + '/'], check=True)
    os.remove(pedido)
    tomas = sorted(f for f in os.listdir(carpeta) if f.startswith('cruda-'))
    subprocess.run([sys.executable, os.path.join(AQUI, 'tono.py'), os.path.join(RAIZ, 'plantillas', 'voz-de-referencia.wav'),
                    '--salta', str(SALTA)] + [os.path.join(carpeta, t) for t in tomas])


if __name__ == '__main__':
    main()
