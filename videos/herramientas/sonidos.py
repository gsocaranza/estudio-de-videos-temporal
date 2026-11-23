# -*- coding: utf-8 -*-
"""
Los efectos de sonido y la música de fondo, sintetizados aquí mismo.

Uso:  python herramientas/sonidos.py

Deja  public/sonidos/<nombre>.wav

¿Por qué sintetizarlos y no bajarlos de una biblioteca? Porque así no hay
licencia que revisar ni atribución que poner, y el mismo sonido se puede
volver a generar idéntico dentro de un año. El video de referencia (SOP, del
SWEFC) usa foley y una pista acústica a ~105 BPM: la música de aquí es un
arpegio pulsado a ese tempo (Karplus-Strong, que suena a cuerda) sobre la
progresión I–V–vi–IV, y los efectos son los mismos que el video usa para
subrayar cada acción: pop, deslizar, tocar la pantalla, éxito, error, sello,
papel, rebobinar y reloj.

Si un día se quiere una pista de verdad, se pone en public/sonidos/musica.wav
y nada más cambia.
"""
import os
import sys
import wave

import numpy as np

SR = 48000
RNG = np.random.default_rng(7)  # semilla fija: el mismo archivo cada vez
SALIDA = os.path.join(os.path.dirname(__file__), "..", "public", "sonidos")


def t(seg):
    return np.arange(int(SR * seg)) / SR


def env(n, ataque=0.005, caida=8.0):
    x = np.arange(n) / SR
    a = np.clip(x / max(ataque, 1e-4), 0, 1)
    return a * np.exp(-caida * x)


def filtro(x, bajo=None, alto=None):
    """Paso banda por FFT: sobra para sonidos cortos."""
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X = np.fft.rfft(x)
    if bajo:
        X *= 1 / (1 + (bajo / np.maximum(f, 1)) ** 4)
    if alto:
        X *= 1 / (1 + (f / alto) ** 4)
    return np.fft.irfft(X, len(x))


def guarda(nombre, x, pico=0.8):
    x = np.asarray(x, dtype=np.float64)
    x = x / (np.max(np.abs(x)) + 1e-9) * pico
    ruta = os.path.join(SALIDA, nombre + ".wav")
    with wave.open(ruta, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
    print(f"{nombre:12s} {len(x) / SR:5.2f}s")


def barrido(f0, f1, seg):
    x = t(seg)
    f = f0 * (f1 / f0) ** (x / seg)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


# ---------------------------------------------------------------- efectos

def pop():
    s = barrido(500, 1300, 0.09) * env(int(SR * 0.09), 0.002, 40)
    return s


def desliza():
    n = int(SR * 0.45)
    ruido = RNG.standard_normal(n)
    a = filtro(ruido, 300, 2500)
    b = filtro(ruido, 1500, 7000)
    x = np.arange(n) / n
    mezcla = a * (1 - x) + b * x
    return mezcla * np.sin(np.pi * x) ** 1.5


def toque():
    n = int(SR * 0.05)
    clic = filtro(RNG.standard_normal(n), 2000, 9000) * env(n, 0.0005, 180)
    tono = np.sin(2 * np.pi * 1700 * t(0.05)) * env(n, 0.001, 90) * 0.4
    return clic + tono


def exito():
    def nota(f, seg):
        x = t(seg)
        return (np.sin(2 * np.pi * f * x) + 0.35 * np.sin(2 * np.pi * 2 * f * x)
                + 0.12 * np.sin(2 * np.pi * 3 * f * x)) * env(len(x), 0.003, 4.5)
    a = nota(1046.5, 0.9)                        # do6
    b = nota(1568.0, 1.2)                        # sol6
    s = np.zeros(int(SR * 1.35))
    s[: len(a)] += a
    s[int(SR * 0.11): int(SR * 0.11) + len(b)] += b
    return s


def error():
    x = t(0.42)
    onda = np.sign(np.sin(2 * np.pi * 116 * x)) + np.sign(np.sin(2 * np.pi * 123 * x))
    s = filtro(onda, None, 1800) * env(len(x), 0.004, 3.0)
    s[int(SR * 0.19): int(SR * 0.23)] *= 0.15     # dos pulsos: «bu-buu»
    return s


def sello():
    golpe = barrido(140, 45, 0.28) * env(int(SR * 0.28), 0.001, 14)
    n = int(SR * 0.06)
    choque = filtro(RNG.standard_normal(n), 200, 3500) * env(n, 0.0005, 60)
    s = golpe.copy()
    s[:n] += choque * 0.9
    return s


def papel():
    n = int(SR * 0.5)
    s = np.zeros(n)
    for _ in range(9):                            # arrugas sueltas
        i = RNG.integers(0, n - 4000)
        m = RNG.integers(800, 4000)
        s[i:i + m] += filtro(RNG.standard_normal(m), 1800, 9000) * env(m, 0.001, 50) * RNG.uniform(0.3, 1)
    return s * np.linspace(1, 0.4, n)


def rebobinar():
    x = t(0.9)
    f = 250 + 1600 * (x / 0.9) ** 2
    sierra = 2 * ((np.cumsum(f) / SR) % 1) - 1
    temblor = 0.6 + 0.4 * np.sin(2 * np.pi * 22 * x)
    s = filtro(sierra, 150, 4000) * temblor
    return s * np.sin(np.pi * x / 0.9) ** 0.6


def reloj():
    """Las manecillas corriendo: tics que se aceleran y se frenan."""
    n = int(SR * 1.4)
    s = np.zeros(n)
    pos = 0.0
    while pos < 1.35:
        i = int(pos * SR)
        m = int(SR * 0.012)
        s[i:i + m] += filtro(RNG.standard_normal(m), 2500, 10000)[: max(0, min(m, n - i))] * env(m, 0.0003, 400)[: max(0, min(m, n - i))]
        prog = pos / 1.35
        pos += 0.11 - 0.08 * np.sin(np.pi * prog)
    return s


# ---------------------------------------------------------------- música

def cuerda(f, seg, brillo=0.5):
    """Karplus-Strong vectorizado por bloques de un periodo."""
    n = int(SR * seg)
    N = int(SR / f)
    y = np.zeros(n + N + 1)
    y[: N + 1] = filtro(RNG.uniform(-1, 1, N + 1), None, 2000 + 6000 * brillo) if N > 64 else RNG.uniform(-1, 1, N + 1)
    k = N + 1
    while k < len(y):
        fin = min(k + N, len(y))
        y[k:fin] = 0.996 * 0.5 * (y[k - N: fin - N] + y[k - N - 1: fin - N - 1])
        k = fin
    return y[N + 1: N + 1 + n]


def musica(segundos=90, bpm=105):
    beat = 60 / bpm
    total = int(SR * segundos)
    pista = np.zeros(total + SR * 3)
    # do mayor: I–V–vi–IV, una por compás
    acordes = [
        (130.81, [261.63, 329.63, 392.00, 523.25]),   # C
        (98.00, [246.94, 293.66, 392.00, 493.88]),    # G
        (110.00, [220.00, 261.63, 329.63, 440.00]),   # Am
        (87.31, [261.63, 349.23, 440.00, 523.25]),    # F
    ]
    patron = [0, 2, 3, 1, 2, 3, 1, 2]                  # octavos
    compas = 0
    tiempo = 0.0
    while tiempo < segundos:
        bajo, notas = acordes[compas % 4]
        i = int(tiempo * SR)
        b = np.sin(2 * np.pi * bajo * t(beat * 3.5)) * env(int(SR * beat * 3.5), 0.01, 1.4) * 0.55
        pista[i:i + len(b)] += b
        for k, idx in enumerate(patron):
            j = int((tiempo + k * beat / 2) * SR)
            # un poco de humanidad: volumen y posición no exactos
            j += int(RNG.normal(0, 0.004) * SR)
            c = cuerda(notas[idx], 1.6, 0.35) * (0.32 if k % 2 else 0.42) * RNG.uniform(0.85, 1.0)
            pista[max(0, j):max(0, j) + len(c)] += c
        # shaker en los contratiempos
        for k in range(8):
            j = int((tiempo + k * beat / 2) * SR)
            m = int(SR * 0.06)
            sh = filtro(RNG.standard_normal(m), 5000, 12000) * env(m, 0.01, 60) * (0.09 if k % 2 else 0.04)
            pista[j:j + m] += sh
        tiempo += beat * 4
        compas += 1
    pista = pista[:total]
    # entrada y salida suaves (la salida fina la hace el video)
    rampa = int(SR * 1.5)
    pista[:rampa] *= np.linspace(0, 1, rampa)
    pista[-rampa:] *= np.linspace(1, 0, rampa)
    return filtro(pista, 60, 9000)


# ------------------------------------------------- estilo corporativo
#
# El segundo estilo (2026-10-16, «más formal, tipo empresa»): nada de
# foley de caricatura. La referencia (un demo de tablero logístico) sólo usa
# un clic digital al abrir un panel y un barrido cuando la cámara viaja, sobre
# una pista electrónica tranquila a ~115 BPM.

def clic():
    n = int(SR * 0.045)
    tono = np.sin(2 * np.pi * 1500 * t(0.045)) * env(n, 0.0008, 110)
    golpe = filtro(RNG.standard_normal(n), 3000, 11000) * env(n, 0.0003, 400) * 0.35
    return tono + golpe


def barrido_aire():
    n = int(SR * 0.7)
    ruido = RNG.standard_normal(n)
    x = np.arange(n) / n
    # banda que sube y baja: aire, no viento
    a = filtro(ruido, 600, 2200)
    b = filtro(ruido, 2200, 6500)
    curva = np.sin(np.pi * x)
    return (a * (1 - curva) + b * curva) * np.sin(np.pi * x) ** 2


def aviso():
    """Notificación: dos notas suaves, sin brillo de juguete."""
    def nota(f, seg):
        x = t(seg)
        return (np.sin(2 * np.pi * f * x) + 0.18 * np.sin(2 * np.pi * 2 * f * x)) * env(len(x), 0.006, 7)
    a, b = nota(784.0, 0.5), nota(1046.5, 0.7)    # sol5 → do6
    s = np.zeros(int(SR * 0.85))
    s[: len(a)] += a
    s[int(SR * 0.09): int(SR * 0.09) + len(b)] += b
    return s


def golpe():
    """El sello, sobrio: un golpe sordo y corto."""
    cuerpo = barrido(110, 60, 0.18) * env(int(SR * 0.18), 0.001, 22)
    n = int(SR * 0.025)
    cuerpo[:n] += filtro(RNG.standard_normal(n), 300, 2500) * env(n, 0.0005, 120) * 0.5
    return cuerpo


def tic():
    n = int(SR * 0.02)
    return filtro(RNG.standard_normal(n), 4000, 12000) * env(n, 0.0002, 350)


def cuerda_corta(f, seg, amortigua=0.985):
    n = int(SR * seg)
    N = int(SR / f)
    y = np.zeros(n + N + 1)
    y[: N + 1] = filtro(RNG.uniform(-1, 1, N + 1), None, 3500) if N > 64 else RNG.uniform(-1, 1, N + 1)
    k = N + 1
    while k < len(y):
        fin = min(k + N, len(y))
        y[k:fin] = amortigua * 0.5 * (y[k - N: fin - N] + y[k - N - 1: fin - N - 1])
        k = fin
    return y[N + 1: N + 1 + n]


def musica_corporativa(segundos=110, bpm=115):
    beat = 60 / bpm
    total = int(SR * segundos)
    pista = np.zeros(total + SR * 4)
    # Cmaj7 – Am7 – Fmaj7 – G6: luminoso y sin drama
    acordes = [
        (65.41, [261.63, 329.63, 392.00, 493.88]),
        (55.00, [220.00, 261.63, 329.63, 392.00]),
        (87.31, [261.63, 349.23, 440.00, 523.25]),
        (98.00, [246.94, 293.66, 392.00, 440.00]),
    ]
    compas, tiempo = 0, 0.0
    while tiempo < segundos:
        bajo, notas = acordes[compas % 4]
        largo = beat * 4
        i = int(tiempo * SR)
        # colchón: armónicos pares e impares suaves, ataque lento
        x = t(largo + 0.6)
        pad = sum(np.sin(2 * np.pi * f * x * (1 + d)) for f in notas for d in (-0.003, 0.003))
        ataque = np.clip(x / 0.5, 0, 1) * np.clip((largo + 0.6 - x) / 0.6, 0, 1)
        pista[i:i + len(x)] += filtro(pad, None, 1400) * ataque * 0.05
        # bajo: 1, «y» del 2, 3
        for k in (0, 1.5, 2):
            j = int((tiempo + k * beat) * SR)
            b = np.sin(2 * np.pi * bajo * t(beat * 0.9)) * env(int(SR * beat * 0.9), 0.008, 4) * 0.5
            pista[j:j + len(b)] += b
        # arpegio apagado en octavos
        for k, idx in enumerate([0, 2, 1, 3, 2, 0, 3, 1]):
            j = int((tiempo + k * beat / 2) * SR) + int(RNG.normal(0, 0.003) * SR)
            c = cuerda_corta(notas[idx] * 2, 0.5) * (0.16 if k % 2 else 0.22)
            pista[max(0, j):max(0, j) + len(c)] += c
        # bombo suave en 1 y 3, chasquido en 2 y 4, hi-hat en dieciseisavos
        for k in range(4):
            j = int((tiempo + k * beat) * SR)
            if k in (0, 2):
                bo = barrido(90, 45, 0.22) * env(int(SR * 0.22), 0.001, 16) * 0.55
                pista[j:j + len(bo)] += bo
            else:
                m = int(SR * 0.09)
                pista[j:j + m] += filtro(RNG.standard_normal(m), 1200, 6000) * env(m, 0.001, 45) * 0.12
        for k in range(16):
            j = int((tiempo + k * beat / 4) * SR)
            m = int(SR * 0.03)
            pista[j:j + m] += filtro(RNG.standard_normal(m), 7000, 14000) * env(m, 0.0005, 150) * (0.05 if k % 2 else 0.025)
        tiempo += largo
        compas += 1
    pista = pista[:total]
    rampa = int(SR * 2)
    pista[:rampa] *= np.linspace(0, 1, rampa)
    pista[-rampa:] *= np.linspace(1, 0, rampa)
    return filtro(pista, 35, 12000)


# ---------------------------------------------------------------- cortos
def trazo():
    """Un rotulador que subraya: roce corto con un poco de grano."""
    n = int(SR * 0.32)
    x = np.arange(n) / n
    roce = filtro(RNG.standard_normal(n), 1800, 7000) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * x))
    return roce * np.sin(np.pi * x) ** 1.5


def subida():
    """La subida antes del dato fuerte: aire que crece y se corta seco."""
    n = int(SR * 0.9)
    x = np.arange(n) / n
    aire = filtro(RNG.standard_normal(n), 400, 5000) * x ** 2.2
    tono = np.sin(2 * np.pi * np.cumsum(180 * 2 ** (x * 1.5)) / SR) * x ** 3 * 0.25
    return (aire + tono) * np.clip((1 - x) / 0.04, 0, 1)



# ---------------------------------------------------------------- motion graphics (2026-10-19)
# Pedidos al rehacer R1 de la serie de RH: «¿qué pasó con las animaciones chidas
# y el sonido motion graphics?». El piloto subrayaba cada corte y cada dato; el
# collage de R1 v2 se quedó mudo. Estos son los de un motion graphics serio.

def whoosh():
    """El paso de un plano a otro: aire que cruza de grave a agudo y se va."""
    n = int(SR * 0.55)
    x = np.arange(n) / n
    ruido = RNG.standard_normal(n)
    grave = filtro(ruido, 150, 900)
    medio = filtro(ruido, 900, 3500)
    agudo = filtro(ruido, 3500, 9000)
    a = np.clip(1 - x * 1.6, 0, 1)
    c = np.clip((x - 0.35) * 1.6, 0, 1)
    b = 1 - np.abs(x - 0.45) * 2
    forma = np.sin(np.pi * np.clip(x * 1.1, 0, 1)) ** 1.5
    return (grave * a + medio * np.clip(b, 0, 1) + agudo * c * 0.7) * forma


def zas():
    """Un whoosh corto, para los golpes de texto."""
    n = int(SR * 0.22)
    x = np.arange(n) / n
    ruido = filtro(RNG.standard_normal(n), 1200, 8000)
    return ruido * np.sin(np.pi * x) ** 2 * (0.5 + 0.5 * x)


def impacto():
    """El dato fuerte: un golpe grave con cola, sin estridencia."""
    sub = barrido(90, 38, 0.9) * env(int(SR * 0.9), 0.002, 4.5)
    n = int(SR * 0.04)
    sub[:n] += filtro(RNG.standard_normal(n), 200, 3000) * env(n, 0.0004, 90) * 0.7
    cola = filtro(RNG.standard_normal(len(sub)), 80, 600) * env(len(sub), 0.01, 6) * 0.25
    return sub + cola


def brillo():
    """Un destello sonoro: dos parciales agudos que se apagan."""
    x = t(0.7)
    s = (np.sin(2 * np.pi * 2093 * x) + 0.6 * np.sin(2 * np.pi * 3136 * x) + 0.3 * np.sin(2 * np.pi * 4186 * x))
    return s * env(len(x), 0.003, 6)


def tecla():
    """Una tecla de máquina de escribir: chasquido y golpe seco."""
    n = int(SR * 0.06)
    chas = filtro(RNG.standard_normal(n), 2500, 10000) * env(n, 0.0002, 260)
    golpe = barrido(220, 140, 0.06) * env(n, 0.0005, 70) * 0.6
    return chas + golpe


def moneda():
    """Una moneda o ficha de metal: parciales inarmónicos que vibran."""
    x = t(0.9)
    parciales = [(1840, 1.0), (2830, 0.6), (4170, 0.4), (5960, 0.25)]
    s = sum(a * np.sin(2 * np.pi * f * x) * np.exp(-x * (5 + i * 2)) for i, (f, a) in enumerate(parciales))
    n = int(SR * 0.01)
    s[:n] += filtro(RNG.standard_normal(n), 3000, 12000) * 0.6
    return s


# ---------------------------------------------------------------- comercial (2026-10-20)
def musica_lanzamiento(segundos=30, bpm=120):
    """La pista del comercial «Con evidencia»: 120 BPM, un compás = 2 s, y sus
    partes caen en los cortes del storyboard (videos/public/comercial-evidencia/
    storyboard.md): pulso 0–4 s, tensión en menor 4–10 s, drop en mayor 10–24 s
    y el golpe del logo a los 24 s, que se apaga hasta el final."""
    beat = 60 / bpm
    total = int(SR * (segundos + 2))
    pista = np.zeros(total + SR * 3)

    def pon(seg, x, vol=1.0):
        j = max(0, int(seg * SR))
        n = min(len(x), len(pista) - j)
        pista[j:j + n] += x[:n] * vol

    def bombo():
        return barrido(110, 42, 0.32) * env(int(SR * 0.32), 0.001, 11)

    def palmada():
        m = int(SR * 0.16)
        return filtro(RNG.standard_normal(m), 900, 7000) * env(m, 0.001, 28)

    def hat(abierto=False):
        m = int(SR * (0.12 if abierto else 0.035))
        return filtro(RNG.standard_normal(m), 7000, 15000) * env(m, 0.0005, 30 if abierto else 140)

    def pad(notas, seg, brillo=1600):
        x = t(seg)
        p = sum(np.sin(2 * np.pi * f * x * (1 + d)) for f in notas for d in (-0.004, 0.004))
        a = np.clip(x / 0.4, 0, 1) * np.clip((seg - x) / 0.5, 0, 1)
        return filtro(p, None, brillo) * a

    def sub(f, seg):
        return np.sin(2 * np.pi * f * t(seg)) * env(int(SR * seg), 0.006, 3.5)

    def subida_larga(seg):
        n = int(SR * seg)
        x = np.arange(n) / n
        aire = filtro(RNG.standard_normal(n), 500, 6000) * x ** 2.4
        tono = np.sin(2 * np.pi * np.cumsum(140 * 2 ** (x * 2)) / SR) * x ** 3 * 0.3
        return (aire + tono) * np.clip((1 - x) / 0.03, 0, 1)

    menor = [(55.00, [220.00, 261.63, 329.63]), (43.65, [174.61, 220.00, 261.63])]          # Am – F
    mayor = [(65.41, [261.63, 329.63, 392.00, 493.88]), (49.00, [246.94, 293.66, 392.00, 440.00]),
             (55.00, [220.00, 261.63, 329.63, 392.00]), (43.65, [220.00, 261.63, 349.23, 440.00])]  # Cmaj7 G Am7 Fmaj7

    for compas in range(15):
        c0 = compas * 4 * beat
        if compas < 2:                       # 0–4 s: pulso
            for k in range(4):
                pon(c0 + k * beat, sub(55, beat * 0.9), 0.55)
                pon(c0 + k * beat + beat / 2, hat(), 0.05)
            if compas == 1:
                pon(c0 + 2 * beat, subida_larga(2 * beat), 0.22)
        elif compas < 5:                     # 4–10 s: tensión
            bajo, notas = menor[compas % 2]
            pon(c0, pad(notas, 4 * beat, 900), 0.05)
            for k in range(8):
                pon(c0 + k * beat / 2, cuerda_corta(notas[k % 3] * 2, 0.35, 0.97), 0.16)
                pon(c0 + k * beat / 2, hat(), 0.035 if k % 2 else 0.06)
            for k in (0, 2):
                pon(c0 + k * beat, bombo(), 0.35)
                pon(c0 + k * beat, sub(bajo, beat * 1.6), 0.4)
            if compas == 4:
                pon(c0 + 2 * beat, subida_larga(2 * beat), 0.35)
        elif compas < 12:                    # 10–24 s: drop
            bajo, notas = mayor[(compas - 5) % 4]
            pon(c0, pad(notas, 4 * beat, 1800 if compas >= 9 else 1300), 0.06 if compas >= 9 else 0.035)
            for k in range(4):
                pon(c0 + k * beat, bombo(), 0.6)
                if k % 2:
                    pon(c0 + k * beat, palmada(), 0.22)
            for k in range(16):
                pon(c0 + k * beat / 4, hat(k % 4 == 2), 0.05 if k % 2 else 0.028)
            for k in (0, 1.5, 2, 3.5):
                pon(c0 + k * beat, sub(bajo, beat * 0.8), 0.5)
            for k, idx in enumerate([0, 2, 1, 3, 2, 0, 3, 1]):
                pon(c0 + k * beat / 2 + RNG.normal(0, 0.003), cuerda_corta(notas[idx] * 2, 0.5), 0.2 if k % 2 else 0.26)
            if compas == 11:
                pon(c0 + 2 * beat, subida_larga(2 * beat), 0.3)
        else:                                # 24–30 s: logo
            bajo, notas = mayor[0]
            if compas == 12:
                pon(c0, impacto(), 0.55)
                pon(c0, bombo(), 0.7)
                pon(c0, pad(notas + [523.25], 6 * beat * 2, 2200), 0.08)
            for k, idx in enumerate([0, 2, 1, 3, 2, 0, 3, 1]):
                caida = 1 - (compas - 12) / 3
                pon(c0 + k * beat / 2, cuerda_corta(notas[idx] * 4, 0.6), (0.14 if k % 2 else 0.18) * caida)
            pon(c0, sub(bajo, beat * 3), 0.35 * (1 - (compas - 12) / 3))
    pista = pista[:total]
    rampa = int(SR * 1.5)
    pista[-rampa:] *= np.linspace(1, 0, rampa)
    pista[:int(SR * 0.05)] *= np.linspace(0, 1, int(SR * 0.05))
    return filtro(pista, 30, 13000)


def musica_presentacion(segundos=200, bpm=96, drop=60):
    """La pista de la presentación de Asistencia (2026-11-04), debajo de la voz:
    pulso y tensión en menor mientras se cuenta el problema, y al entrar el
    producto (`drop`, en segundos) pasa a mayor con ritmo y arpegio, y se apaga
    con el logotipo. Va a 96 BPM para que respire debajo de la narración, y no
    pelea por la banda de la voz: el pad queda bajo 1.2 kHz y el arpegio, arriba.
    Como depende de lo que dure la voz, se genera aparte:
    python herramientas/sonidos.py musica-presentacion <segundos> <drop>"""
    beat = 60 / bpm
    compas = 4 * beat
    total = int(SR * (segundos + 2))
    pista = np.zeros(total + SR * 4)

    def pon(seg, x, vol=1.0):
        j = max(0, int(seg * SR))
        if j >= len(pista):
            return
        n = min(len(x), len(pista) - j)
        pista[j:j + n] += x[:n] * vol

    def bombo():
        return barrido(100, 44, 0.3) * env(int(SR * 0.3), 0.001, 12)

    def hat():
        m = int(SR * 0.03)
        return filtro(RNG.standard_normal(m), 7500, 15000) * env(m, 0.0005, 150)

    def pad(notas, seg, brillo):
        x = t(seg)
        p = sum(np.sin(2 * np.pi * f * x * (1 + d)) for f in notas for d in (-0.003, 0.003))
        a = np.clip(x / 0.7, 0, 1) * np.clip((seg - x) / 0.7, 0, 1)
        return filtro(p, None, brillo) * a

    def sub(f, seg):
        return np.sin(2 * np.pi * f * t(seg)) * env(int(SR * seg), 0.008, 2.6)

    def subida_larga(seg):
        n = int(SR * seg)
        x = np.arange(n) / n
        return filtro(RNG.standard_normal(n), 500, 6000) * x ** 2.6 * np.clip((1 - x) / 0.03, 0, 1)

    menor = [(55.00, [220.00, 261.63, 329.63]), (43.65, [174.61, 220.00, 261.63]), (49.00, [196.00, 246.94, 293.66]), (41.20, [164.81, 246.94, 329.63])]   # Am F G Em
    mayor = [(65.41, [261.63, 329.63, 392.00, 493.88]), (49.00, [246.94, 293.66, 392.00, 440.00]),
             (55.00, [220.00, 261.63, 329.63, 392.00]), (43.65, [220.00, 261.63, 349.23, 440.00])]  # Cmaj7 G Am7 Fmaj7

    # el problema: sólo pad, un latido grave y una cuerda que insiste
    k = 0
    c0 = 0.0
    while c0 < drop - compas / 2:
        bajo, notas = menor[k % 4]
        pon(c0, pad(notas, compas + 0.6, 800), 0.06)
        for i in (0, 2):
            pon(c0 + i * beat, sub(bajo, beat * 1.7), 0.42)
        for i in range(4):
            pon(c0 + i * beat + beat / 2, cuerda_corta(notas[i % 3] * 2, 0.3, 0.97), 0.05)
        if c0 + compas > 22:   # a medio problema entra un pulso seco
            for i in range(4):
                pon(c0 + i * beat, bombo(), 0.2)
        k += 1
        c0 += compas
    pon(drop - 3.2, subida_larga(3.2), 0.3)
    # el producto: en mayor, con pulso y arpegio; se apaga al llegar a la marca
    pon(drop, impacto(), 0.5)
    k = 0
    c0 = drop
    fin_ritmo = segundos - 13
    while c0 < segundos - 2:
        bajo, notas = mayor[k % 4]
        pon(c0, pad(notas, compas + 0.6, 1100), 0.05)
        if c0 < fin_ritmo:
            for i in range(4):
                pon(c0 + i * beat, bombo(), 0.32)
                pon(c0 + i * beat + beat / 2, hat(), 0.05)
            for i in (0, 1.5, 2, 3.5):
                pon(c0 + i * beat, sub(bajo, beat * 0.8), 0.34)
            for i, idx in enumerate([0, 2, 1, 3, 2, 0, 3, 1]):
                pon(c0 + i * beat / 2 + RNG.normal(0, 0.003), cuerda_corta(notas[idx] * 4, 0.45), 0.075)
        else:
            caida = max(0.0, 1 - (c0 - fin_ritmo) / 12)
            for i, idx in enumerate([0, 2, 1, 3]):
                pon(c0 + i * beat, cuerda_corta(notas[idx] * 4, 0.9), 0.1 * caida)
            pon(c0, sub(bajo, beat * 3), 0.25 * caida)
        k += 1
        c0 += compas
    pista = pista[:total]
    rampa = int(SR * 2)
    pista[-rampa:] *= np.linspace(1, 0, rampa)
    return filtro(pista, 30, 13000)


# ---------------------------------------------------------------- transiciones con variantes (2026-10-21)
# «Los sonidos de las transiciones, que no sean tan repetitivos» (supervisor, al
# ver R4 y R5): cada corto tiene el sonido de SU transición, en tres variantes que
# se alternan, y efectos del material de su mundo. Ningún corto vuelve a usar el
# mismo archivo nueve veces seguidas.

def escaner(v=0):
    """El escáner de R5: aire filtrado que barre y un zumbido tenue que sube; v cambia el color y el largo."""
    dur = (0.62, 0.7, 0.56)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    bajo, alto = ((600, 2800), (900, 4200), (500, 2200))[v]
    aire = filtro(RNG.standard_normal(n), bajo, alto) * np.sin(np.pi * x) ** 1.4
    f0, f1 = ((260, 520), (320, 720), (220, 400))[v]
    zumbido = barrido(f0, f1, dur)[:n] * np.sin(np.pi * x) ** 2 * 0.18
    chasquido = np.zeros(n)
    m = int(SR * 0.012)
    chasquido[int(n * 0.92): int(n * 0.92) + m] = filtro(RNG.standard_normal(m), 2000, 9000) * 0.5
    return aire + zumbido + chasquido


def orbita(v=0):
    """La órbita de R4: aire grave y suave que pasa, con un roce de cámara; v cambia el largo y el tono."""
    dur = (0.95, 1.1, 0.85)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    ruido = RNG.standard_normal(n)
    corte = (700, 950, 560)[v]
    aire = filtro(ruido, 120, corte) * np.sin(np.pi * x) ** 2
    brillo = filtro(ruido, corte * 2, corte * 5) * np.sin(np.pi * np.clip((x - 0.3) / 0.6, 0, 1)) ** 2 * 0.25
    grave = np.sin(2 * np.pi * np.cumsum(70 - 18 * x) / SR) * np.sin(np.pi * x) * 0.25
    return aire + brillo + grave


def toc(v=0):
    """Una pieza de maqueta que se asienta: madera chica; v cambia la altura."""
    f = (620, 760, 520)[v]
    n = int(SR * 0.22)
    x = t(0.22)
    cuerpo = (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * f * 2.7 * x)) * np.exp(-x * 34)
    m = int(SR * 0.006)
    cuerpo[:m] += filtro(RNG.standard_normal(m), 1500, 8000) * 0.6
    return cuerpo


def regla(v=0):
    """Un trazo de plano: la punta del lápiz contra la regla; v cambia el timbre."""
    f = (1900, 2300, 1600)[v]
    n = int(SR * 0.09)
    x = t(0.09)
    roce = filtro(RNG.standard_normal(n), 2500, 9000) * np.exp(-x * 60) * 0.8
    tono = np.sin(2 * np.pi * f * x) * np.exp(-x * 80) * 0.35
    return roce + tono


def riel(v=0):
    """El viaje de «Hacia las 40 horas»: la cámara corre de lado por la regla de los años; aire suave y un tope al llegar."""
    dur = (0.8, 0.92, 0.72)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    ruido = RNG.standard_normal(n)
    corte = (1100, 1400, 900)[v]
    aire = filtro(ruido, 250, corte) * np.sin(np.pi * x) ** 1.6
    rodar = np.sin(2 * np.pi * np.cumsum(140 + 60 * x) / SR) * np.sin(np.pi * x) ** 2 * 0.12
    tope = np.zeros(n)
    m = int(SR * 0.03)
    k = int(n * 0.86)
    tope[k:k + m] = np.sin(2 * np.pi * (300, 340, 280)[v] * t(0.03)[:m]) * np.exp(-t(0.03)[:m] * 90) * 0.5
    return aire + rodar + tope


def ficha(v=0):
    """Una hora de la semana que se va o se pone: una ficha chica de plástico; v cambia la altura."""
    f = (980, 1150, 860)[v]
    x = t(0.12)
    cuerpo = (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * f * 3.1 * x)) * np.exp(-x * 55)
    m = int(SR * 0.004)
    cuerpo[:m] += filtro(RNG.standard_normal(m), 2500, 9000) * 0.5
    return cuerpo


def hoja(v=0):
    """El viaje de «La curva del olvido»: la cámara entra a la libreta; un roce de papel que pasa."""
    dur = (0.7, 0.82, 0.62)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    ruido = RNG.standard_normal(n)
    bajo, alto = ((900, 5200), (1200, 6500), (700, 4200))[v]
    roce = filtro(ruido, bajo, alto) * np.sin(np.pi * x) ** 2.2 * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * x) ** 2)
    cuerpo = filtro(ruido, 150, 600) * np.sin(np.pi * x) ** 2 * 0.35
    return roce + cuerpo


def goma(v=0):
    """La tinta que se borra: una goma corta contra el papel; v cambia el largo."""
    dur = (0.32, 0.4, 0.26)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    vaiven = 0.5 + 0.5 * np.sin(2 * np.pi * (11, 9, 13)[v] * x) ** 2
    return filtro(RNG.standard_normal(n), 400, 3200) * vaiven * np.sin(np.pi * x) * 0.6


def soplo(v=0):
    """El viaje de «El burnout»: la cámara se aleja o se acerca a la vela; un aire tibio, como un soplo largo."""
    dur = (1.0, 1.15, 0.9)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    ruido = RNG.standard_normal(n)
    corte = (520, 680, 440)[v]
    aire = filtro(ruido, 90, corte) * np.sin(np.pi * x) ** 1.8
    soplo_alto = filtro(ruido, corte * 3, corte * 7) * np.sin(np.pi * x) ** 3 * 0.18
    return aire + soplo_alto


def tendedero(v=0):
    """El viaje de «Las vacaciones»: la cámara corre por el tendedero; un roce de cuerda que pasa y se tensa al llegar."""
    dur = (0.85, 0.98, 0.76)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    ruido = RNG.standard_normal(n)
    bajo, alto = ((350, 2400), (450, 3000), (300, 2000))[v]
    roce = filtro(ruido, bajo, alto) * np.sin(np.pi * x) ** 1.7 * (0.75 + 0.25 * np.sin(2 * np.pi * 15 * x) ** 2)
    tension = np.sin(2 * np.pi * np.cumsum((110, 130, 95)[v] + 90 * x ** 2) / SR) * np.sin(np.pi * np.clip((x - 0.5) / 0.5, 0, 1)) ** 2 * 0.16
    return roce + tension


def pinza(v=0):
    """Una foto que se cuelga: el chasquido de una pinza de madera; v cambia la altura."""
    f = (1350, 1600, 1180)[v]
    x = t(0.14)
    resorte = (np.sin(2 * np.pi * f * x) + 0.35 * np.sin(2 * np.pi * f * 2.3 * x)) * np.exp(-x * 48)
    m = int(SR * 0.005)
    resorte[:m] += filtro(RNG.standard_normal(m), 2000, 9500) * 0.7
    madera = np.sin(2 * np.pi * (f * 0.42) * x) * np.exp(-x * 70) * 0.4
    return resorte + madera


def zum(v=0):
    """El viaje de «El aguinaldo»: la cámara entra en una hoja del calendario; aire que se acerca y un tono que sube."""
    dur = (0.9, 1.02, 0.8)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    ruido = RNG.standard_normal(n)
    corte = (900, 1150, 760)[v]
    aire = filtro(ruido, 180, corte) * x ** 1.4 * np.sin(np.pi * np.clip(x * 1.15, 0, 1)) ** 0.6
    f0 = (180, 210, 160)[v]
    tono = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 1.2 * x ** 2)) / SR) * np.sin(np.pi * x) ** 2 * 0.14
    return aire + tono


def pasos(v=0):
    """El viaje de «El registro»: la cámara sigue el rastro; aire suave y dos pasos sordos sobre papel."""
    dur = (0.86, 0.96, 0.78)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    ruido = RNG.standard_normal(n)
    aire = filtro(ruido, 200, (900, 1100, 760)[v]) * np.sin(np.pi * x) ** 1.8 * 0.8
    pisadas = np.zeros(n)
    for k, peso in ((0.3, 0.8), (0.66, 1.0)):
        i = int(n * k)
        m = min(int(SR * 0.09), n - i)
        tt = np.arange(m) / SR
        golpe = np.sin(2 * np.pi * (95, 110, 85)[v] * tt) * np.exp(-tt * 45)
        roce = filtro(RNG.standard_normal(m), 800, 3500) * np.exp(-tt * 60) * 0.35
        pisadas[i:i + m] += (golpe + roce) * peso * 0.6
    return aire + pisadas


def huella(v=0):
    """Una marca del rastro que se estampa: un sello chico y blando, con un clic arriba."""
    f = (210, 240, 190)[v]
    x = t(0.16)
    cuerpo = np.sin(2 * np.pi * f * x) * np.exp(-x * 38)
    m = int(SR * 0.006)
    cuerpo[:m] += filtro(RNG.standard_normal(m), 3000, 9000) * 0.4
    return cuerpo


def arranque(v=0):
    """El viaje de «El 16 de noviembre»: la cámara baja de hoja en hoja del calendario; un rasgón de papel que cae."""
    dur = (0.78, 0.9, 0.7)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    ruido = RNG.standard_normal(n)
    # el rasgón: ruido de papel con pulsos rápidos al principio, que se apagan
    pulsos = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (38, 44, 33)[v] * x))
    rasgon = filtro(ruido, 1500, 7000) * pulsos * np.exp(-x * 6) * 0.7
    caer = filtro(ruido, 150, (700, 850, 600)[v]) * np.sin(np.pi * x) ** 2 * 0.7
    return rasgon + caer


def cobro(v=0):
    """El viaje de «Los pagos digitales»: la cámara pasa de un QR al siguiente; aire suave y un pitido sordo de terminal al llegar."""
    dur = (0.86, 0.96, 0.8)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    ruido = RNG.standard_normal(n)
    aire = filtro(ruido, 220, (1000, 1250, 850)[v]) * np.sin(np.pi * x) ** 1.6 * 0.75
    # el pitido: dos tonos cortos y apagados, como una terminal lejos, al final del viaje
    pit = np.zeros(n)
    i0 = int(n * 0.78)
    m = int(SR * 0.07)
    tt = np.arange(m) / SR
    for j, f0 in enumerate(((1180, 1320, 1050)[v], (1580, 1760, 1400)[v])):
        i = i0 + j * int(SR * 0.085)
        if i + m <= n:
            pit[i:i + m] += np.sin(2 * np.pi * f0 * tt) * np.sin(np.pi * tt / tt[-1]) ** 2 * (0.16, 0.12)[j]
    return aire + pit


def calle(v=0):
    """El viaje de «Los pagos digitales» v2: la cámara recorre la calle; aire que pasa y un rumor grave, como un coche lejos."""
    dur = (0.9, 1.0, 0.82)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    ruido = RNG.standard_normal(n)
    aire = filtro(ruido, 200, (1100, 1350, 950)[v]) * np.sin(np.pi * x) ** 1.5 * 0.75
    f0 = (62, 70, 56)[v]
    rumor = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.25 * np.sin(np.pi * x))) / SR) * np.sin(np.pi * x) ** 2 * 0.22
    return aire + rumor


def mesa(v=0):
    """El viaje de «Las monedas»: la cámara se desliza sobre el mostrador; roce de papel y un tintineo de monedas al llegar."""
    dur = (0.88, 0.98, 0.8)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    ruido = RNG.standard_normal(n)
    roce = filtro(ruido, 600, (3200, 3800, 2800)[v]) * np.sin(np.pi * x) ** 1.4 * 0.55
    aire = filtro(ruido, 150, 700) * np.sin(np.pi * x) ** 2 * 0.35
    tin = np.zeros(n)
    for j, (k, f0) in enumerate(((0.74, (2900, 3300, 2600)[v]), (0.82, (4100, 4400, 3700)[v]))):
        i = int(n * k)
        m = min(int(SR * 0.12), n - i)
        tt = np.arange(m) / SR
        tin[i:i + m] += (np.sin(2 * np.pi * f0 * tt) + 0.5 * np.sin(2 * np.pi * f0 * 1.51 * tt)) * np.exp(-tt * 38) * (0.14, 0.1)[j]
    return roce + aire + tin


def pulso(v=0):
    """El viaje de «El sistema»: el pulso corre por el cable; zumbido eléctrico suave que sube y un clic de relé al llegar."""
    dur = (0.86, 0.96, 0.8)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    ruido = RNG.standard_normal(n)
    aire = filtro(ruido, 250, (1400, 1700, 1200)[v]) * np.sin(np.pi * x) ** 1.6 * 0.45
    f0 = (110, 123, 98)[v]
    fase = 2 * np.pi * np.cumsum(f0 * (1 + 0.6 * x)) / SR
    zumbido = (np.sin(fase) + 0.35 * np.sin(2 * fase) + 0.15 * np.sin(3 * fase)) * np.sin(np.pi * x) ** 2 * 0.2
    clic = np.zeros(n)
    i = int(n * 0.8)
    m = min(int(SR * 0.05), n - i)
    tt = np.arange(m) / SR
    clic[i:i + m] = filtro(RNG.standard_normal(m), 1800, 6000) * np.exp(-tt * 120) * 0.5
    return aire + zumbido + clic


# Las teclas de un teléfono (2026-11-04, «Marcar por llamada»): el tono DTMF de verdad,
# la suma de una frecuencia de fila y una de columna, como lo oye quien marca.
DTMF = {"1": (697, 1209), "2": (697, 1336), "3": (697, 1477), "4": (770, 1209), "5": (770, 1336),
        "6": (770, 1477), "7": (852, 1209), "8": (852, 1336), "9": (852, 1477), "0": (941, 1336)}


def dtmf(cifra):
    """La tecla de un teléfono: 0.16 s de las dos frecuencias, con orillas suaves y algo de línea."""
    bajo, alto = DTMF[cifra]
    x = t(0.16)
    s = np.sin(2 * np.pi * bajo * x) + np.sin(2 * np.pi * alto * x)
    orilla = np.clip(np.minimum(x, x[-1] - x) / 0.008, 0, 1)
    return filtro(s * orilla, 300, 3400)


def buzon(v=0):
    """El viaje de «A quién aplica» (N1): la tapa de lámina de un buzón y un sobre que pasa rozando."""
    dur = (0.72, 0.84, 0.64)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    ruido = RNG.standard_normal(n)
    roce = filtro(ruido, 1100, 5200) * np.sin(np.pi * x) ** 2.4 * 0.55
    # la lámina al final: dos parciales metálicos que se apagan rápido
    f1, f2 = ((620, 1490), (540, 1310), (700, 1680))[v]
    tiempo = np.arange(n) / SR
    tras = np.clip(x - 0.72, 0, 1)
    lamina = (np.sin(2 * np.pi * f1 * tiempo) + 0.55 * np.sin(2 * np.pi * f2 * tiempo)) * (x > 0.72) * np.exp(-tras * 26) * 0.5
    return roce + lamina


# Los viajes de los cortos de noviembre (docs/cortos-noviembre.md): cada corto tiene el suyo, en tres
# variantes. nombre: (banda del roce, y el golpe de su material al llegar: frecuencias y caída)
VIAJES_NOVIEMBRE = {
    "charola": ((1400, 6000), (1850, 3100), 34),   # N2 · metal delgado de una charola
    "puerta": ((300, 1800), (120, 240), 16),       # N3 · una puerta pesada de madera
    "arena": ((3000, 9000), (0, 0), 1),            # N4 · arena que corre
    "platillo": ((800, 4200), (880, 2210), 12),    # N5 · el platillo de una balanza
    "domino": ((700, 3000), (1250, 2600), 60),     # N6 · ficha contra ficha
    "tijera": ((2200, 8000), (2600, 4100), 70),    # N7 · el corte de unas tijeras
    "caja": ((250, 1500), (150, 310), 24),         # N8 · cartón que se asienta
    "fichero": ((900, 4200), (420, 980), 30),      # N9 · un cajón de fichas
    "rollo": ((1800, 7000), (1500, 3300), 80),     # N10 · el rollo de una caja registradora
    "etiqueta": ((2500, 8500), (0, 0), 1),         # N11 · una etiqueta que se despega
    "agua": ((300, 2200), (520, 830), 20),         # N12 · agua en un vaso
    "carril": ((500, 2600), (300, 700), 26),       # N13 · pisadas en una pista
    "casa": ((400, 2400), (240, 520), 22),         # N14 · un piso de madera
    "gente": ((600, 3200), (0, 0), 1),             # N15 · un murmullo que pasa
    "formulario": ((1500, 6000), (1900, 3600), 90),# N16 · una pluma que marca
    "picaporte": ((800, 3800), (1100, 2300), 44),  # N17 · un picaporte
    "via": ((350, 2000), (640, 1320), 18),         # N18 · la rueda sobre el riel
    "hielo": ((1800, 7500), (2400, 3700), 28),     # N19 · hielo que cruje
    "pieza": ((900, 4400), (720, 1500), 54),       # N20 · una pieza que encaja
    "vibra": ((120, 700), (180, 360), 9),          # N21 · un teléfono que vibra
    "cuchilla": ((2000, 7800), (2100, 4600), 50),  # N22 · la tijera que corta la semana
}


def viaje_noviembre(nombre, v=0):
    """Un roce que pasa y, si el material lo pide, el golpe de ese material al llegar."""
    banda, golpe, caida = VIAJES_NOVIEMBRE[nombre]
    dur = (0.72, 0.84, 0.64)[v]
    n = int(SR * dur)
    x = np.arange(n) / n
    tiempo = np.arange(n) / SR
    corrimiento = (1.0, 1.18, 0.86)[v]
    roce = filtro(RNG.standard_normal(n), banda[0] * corrimiento, banda[1] * corrimiento) * np.sin(np.pi * x) ** 2.3 * 0.6
    if not golpe[0]:
        return roce
    tras = np.clip(x - 0.7, 0, 1) * dur
    f1, f2 = golpe[0] * corrimiento, golpe[1] * corrimiento
    llega = (np.sin(2 * np.pi * f1 * tiempo) + 0.5 * np.sin(2 * np.pi * f2 * tiempo)) * (x > 0.7) * np.exp(-tras * caida) * 0.55
    return roce + llega


def pitido():
    """El tono antes de grabar: 1 kHz medio segundo, como el de una contestadora."""
    x = t(0.45)
    orilla = np.clip(np.minimum(x, x[-1] - x) / 0.01, 0, 1)
    return np.sin(2 * np.pi * 1000 * x) * orilla


def timbre():
    """Llamando: el tono de llamada de México (425 Hz, un segundo), una sola vez."""
    x = t(1.0)
    orilla = np.clip(np.minimum(x, x[-1] - x) / 0.02, 0, 1)
    return filtro(np.sin(2 * np.pi * 425 * x) * orilla, 300, 3400)


if __name__ == "__main__":
    os.makedirs(SALIDA, exist_ok=True)
    # la de la presentación depende de lo que dure la voz: se genera aparte
    if len(sys.argv) > 1 and sys.argv[1] == "musica-presentacion":
        guarda("musica-presentacion", musica_presentacion(float(sys.argv[2]), drop=float(sys.argv[3])), pico=0.75)
        sys.exit(0)
    # la corporativa a la medida de un video más largo que sus 110 s:
    #   python herramientas/sonidos.py musica-corporativa <nombre> <segundos>
    if len(sys.argv) > 1 and sys.argv[1] == "musica-corporativa":
        guarda(sys.argv[2], musica_corporativa(float(sys.argv[3])), pico=0.7)
        sys.exit(0)
    for nombre, fn in [("pop", pop), ("desliza", desliza), ("toque", toque), ("exito", exito),
                       ("error", error), ("sello", sello), ("papel", papel),
                       ("rebobinar", rebobinar), ("reloj", reloj)]:
        guarda(nombre, fn())
    guarda("musica", musica(), pico=0.7)
    # los del estilo corporativo van después: así los de arriba salen idénticos
    for nombre, fn in [("clic", clic), ("barrido", barrido_aire), ("aviso", aviso), ("golpe", golpe), ("tic", tic)]:
        guarda(nombre, fn())
    guarda("musica-corporativa", musica_corporativa(), pico=0.7)
    # los de los cortos verticales, al final por la misma razón
    for nombre, fn in [("trazo", trazo), ("subida", subida)]:
        guarda(nombre, fn())
    # los de motion graphics, al final por la misma razón
    for nombre, fn in [("whoosh", whoosh), ("zas", zas), ("impacto", impacto), ("brillo", brillo), ("tecla", tecla), ("moneda", moneda)]:
        guarda(nombre, fn())
    # el comercial, al final por la misma razón
    guarda("musica-lanzamiento", musica_lanzamiento(), pico=0.75)
    # las transiciones con variantes, al final por la misma razón
    for v in range(3):
        guarda(f"escaner-{v + 1}", escaner(v), pico=0.7)
        guarda(f"orbita-{v + 1}", orbita(v), pico=0.7)
        guarda(f"toc-{v + 1}", toc(v), pico=0.7)
        guarda(f"regla-{v + 1}", regla(v), pico=0.6)
    # las de R11, R6 y R9 (2026-10-22), al final por la misma razón
    for v in range(3):
        guarda(f"riel-{v + 1}", riel(v), pico=0.65)
        guarda(f"ficha-{v + 1}", ficha(v), pico=0.55)
        guarda(f"hoja-{v + 1}", hoja(v), pico=0.65)
        guarda(f"goma-{v + 1}", goma(v), pico=0.5)
        guarda(f"soplo-{v + 1}", soplo(v), pico=0.65)
    # las de R12 y R13 (2026-10-23), al final por la misma razón
    for v in range(3):
        guarda(f"tendedero-{v + 1}", tendedero(v), pico=0.65)
        guarda(f"pinza-{v + 1}", pinza(v), pico=0.55)
        guarda(f"zum-{v + 1}", zum(v), pico=0.65)
    # las de R14 y R15 (2026-10-23), al final por la misma razón
    for v in range(3):
        guarda(f"pasos-{v + 1}", pasos(v), pico=0.65)
        guarda(f"huella-{v + 1}", huella(v), pico=0.55)
        guarda(f"arranque-{v + 1}", arranque(v), pico=0.65)
    # la de R16 (2026-10-24), al final por la misma razón
    for v in range(3):
        guarda(f"cobro-{v + 1}", cobro(v), pico=0.6)
    # la de R16 v2 (2026-10-24), al final por la misma razón
    for v in range(3):
        guarda(f"calle-{v + 1}", calle(v), pico=0.6)
    # la de R17 (2026-10-25), al final por la misma razón
    for v in range(3):
        guarda(f"mesa-{v + 1}", mesa(v), pico=0.6)
    # la de R18 (2026-10-29), al final por la misma razón
    for v in range(3):
        guarda(f"pulso-{v + 1}", pulso(v), pico=0.6)
    # las de la llamada (2026-11-04), al final por la misma razón
    for cifra in DTMF:
        guarda(f"dtmf-{cifra}", dtmf(cifra), pico=0.5)
    guarda("pitido", pitido(), pico=0.45)
    guarda("timbre", timbre(), pico=0.45)
    # N1 de noviembre (2026-11-04), al final por la misma razón
    for v in range(3):
        guarda(f"buzon-{v + 1}", buzon(v), pico=0.6)
    for nombre in VIAJES_NOVIEMBRE:
        for v in range(3):
            guarda(f"{nombre}-{v + 1}", viaje_noviembre(nombre, v), pico=0.6)
