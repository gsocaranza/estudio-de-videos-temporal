# -*- coding: utf-8 -*-
"""
Mide el tono de una toma de voz y la compara con una toma de referencia.

    python herramientas/tono.py referencia.wav toma-1.wav toma-2.wav ...
    python herramientas/tono.py referencia.wav --salta 14 cruda-*.wav   # sin la dirección leída al principio

Nació el 2026-10-21. El supervisor oyó la voz nueva de El ascenso y dijo «me
gustaba la de v5, ese tono me gustaba más… vuelve a grabar las voces si es
necesario para tener ese tono, igual para el otro video». El modelo de voz lee
distinto en cada toma aunque reciba el mismo texto y la misma dirección, y la
sesión no puede oír. Así que el tono se mide con cinco rasgos, sacados de la
toma con numpy:

  altura    la mediana de la frecuencia fundamental, en Hz (qué tan grave o aguda);
  melodía   cuánto sube y baja la entonación: la dispersión del tono, en semitonos;
  vaivén    qué tanto se mueve la entonación de un momento al siguiente;
  energía   la dispersión del volumen entre palabras, en dB (plana o con énfasis);
  brillo    el centroide espectral, en Hz (opaca o brillante).

La distancia a la referencia suma las diferencias de cada rasgo, cada una
dividida entre lo que se considera una diferencia que se oye. Gana la toma más
cercana. El ritmo no entra: ése lo mide audita-guion.py.
"""
import subprocess
import sys

import numpy as np

SR = 16000
# lo que se considera «se nota» en cada rasgo: la distancia es la suma de diferencias en estas unidades
ESCALA = {'altura': 8.0, 'melodia': 0.6, 'vaiven': 0.15, 'energia': 1.0, 'brillo': 120.0}


def carga(ruta, salta=0.0):
    crudo = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(salta), '-i', ruta, '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(crudo, dtype=np.int16).astype(np.float32) / 32768.0


def f0_de(cuadro, fmin=120.0, fmax=420.0):
    """Frecuencia fundamental de un cuadro por autocorrelación normalizada; None si no es sonoro."""
    cuadro = cuadro - cuadro.mean()
    e = np.dot(cuadro, cuadro)
    if e < 1e-4:
        return None
    ac = np.correlate(cuadro, cuadro, mode='full')[len(cuadro) - 1:]
    ac = ac / ac[0]
    lo, hi = int(SR / fmax), int(SR / fmin)
    k = lo + int(np.argmax(ac[lo:hi]))
    return SR / k if ac[k] > 0.45 else None


def rasgos(ruta, salta=0.0):
    x = carga(ruta, salta)
    n, paso = 640, 320  # 40 ms, cada 20 ms
    f0s, rms, cent = [], [], []
    ventana = np.hanning(n)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    for i in range(0, len(x) - n, paso):
        c = x[i:i + n]
        r = float(np.sqrt(np.mean(c ** 2)))
        if r < 0.01:
            continue
        rms.append(20 * np.log10(r))
        espectro = np.abs(np.fft.rfft(c * ventana))
        cent.append(float((freqs * espectro).sum() / max(espectro.sum(), 1e-9)))
        f = f0_de(c)
        if f:
            f0s.append(f)
    f0s = np.array(f0s)
    semis = 12 * np.log2(f0s / np.median(f0s))
    return {
        'altura': float(np.median(f0s)),
        'melodia': float(np.std(semis)),
        'vaiven': float(np.median(np.abs(np.diff(semis)))),
        'energia': float(np.std(rms)),
        'brillo': float(np.median(cent)),
    }


def distancia(a, b):
    return sum(abs(a[k] - b[k]) / ESCALA[k] for k in ESCALA)


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    args = sys.argv[1:]
    salta = 0.0
    if '--salta' in args:
        i = args.index('--salta')
        salta = float(args[i + 1])
        del args[i:i + 2]
    ref = rasgos(args[0])
    print(f'{"toma":40} {"altura":>7} {"melodía":>8} {"vaivén":>7} {"energía":>8} {"brillo":>7} {"distancia":>9}')
    print(f'{"REFERENCIA " + args[0][-28:]:40} {ref["altura"]:7.1f} {ref["melodia"]:8.2f} {ref["vaiven"]:7.2f} {ref["energia"]:8.2f} {ref["brillo"]:7.0f}')
    filas = []
    for ruta in args[1:]:
        r = rasgos(ruta, salta)
        filas.append((distancia(ref, r), ruta, r))
    for d, ruta, r in sorted(filas):
        print(f'{ruta[-40:]:40} {r["altura"]:7.1f} {r["melodia"]:8.2f} {r["vaiven"]:7.2f} {r["energia"]:8.2f} {r["brillo"]:7.0f} {d:9.2f}')


if __name__ == '__main__':
    main()
