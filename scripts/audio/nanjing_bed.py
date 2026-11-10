"""南京大屠杀 · music bed, synthesized with numpy/scipy (no samples, no third-party material).

Felix wanted a low, heavy bed that never pushes: a string-like pad in D minor that changes chord slowly,
a low drone, single soft bell tones on each act change, and a distant siren tone under the opening
(10:01) and the ending, as a sketch of the 12·13 air-raid siren. The bed sits ≈ 20 dB under the voice.

  python3 -I scripts/audio/nanjing_bed.py  → public/audio/raw/nanjing/bed.wav (48 kHz stereo, 270 s)
"""
import pathlib

import numpy as np
from scipy import signal
from scipy.io import wavfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'public' / 'audio' / 'raw' / 'nanjing' / 'bed.wav'
SR = 48000
DUR = 270.0
N = int(DUR * SR)
rng = np.random.default_rng(1213)


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def ramp(n, a, r):
    e = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na:
        e[:na] = np.sin(np.linspace(0, np.pi / 2, na)) ** 2
    if nr:
        e[-nr:] *= np.cos(np.linspace(0, np.pi / 2, nr)) ** 2
    return e


def saw(f, n, phase=0.0):
    t = np.arange(n) / SR
    return 2 * ((f * t + phase) % 1.0) - 1


def pad_voice(m, n):
    """three slightly detuned saws, low-passed: a muted string section"""
    f = hz(m)
    x = sum(saw(f * (1 + d), n, rng.random()) for d in (-0.004, 0.0, 0.0045)) / 3
    b, a = signal.butter(2, min(0.45, 900 / (SR / 2)))
    x = signal.lfilter(b, a, x)
    vib = 1 + 0.04 * np.sin(2 * np.pi * 0.17 * np.arange(n) / SR + rng.random() * 6)
    return x * vib


def bell(m, dur=6.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = hz(m)
    x = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (1.2 + k * 0.8)) for k, a in ((1, 1.0), (2.01, 0.35), (3.02, 0.18), (4.2, 0.08)))
    return x * ramp(n, 0.005, 1.0)


def siren(dur, f0=290, f1=520):
    """slow-rising hand siren heard from far away: a buzzy tone, band-passed, with a long swell"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    rise = np.clip(t / (dur * 0.45), 0, 1)
    f = f0 + (f1 - f0) * (1 - (1 - rise) ** 2) + 3 * np.sin(2 * np.pi * 0.6 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)
    b, a = signal.butter(2, [250 / (SR / 2), 1600 / (SR / 2)], btype='band')
    return signal.lfilter(b, a, x) * ramp(n, dur * 0.35, dur * 0.4)


L = np.zeros(N)
R = np.zeros(N)


def add(x, at, gain=1.0, pan=0.0):
    i = int(at * SR)
    j = min(N, i + len(x))
    if j <= i:
        return
    L[i:j] += x[: j - i] * gain * np.cos((pan + 1) * np.pi / 4)
    R[i:j] += x[: j - i] * gain * np.sin((pan + 1) * np.pi / 4)


# chord plan (seconds): D minor through the acts, warmer (F, B♭ major) for 生生不息 at the end
CHORDS = [
    (0.0, [38, 50, 53, 57]),  # Dm
    (15.4, [34, 50, 53, 58]),  # B♭
    (26.4, [43, 50, 55, 58]),  # Gm
    (44.2, [45, 49, 52, 57]),  # A
    (58.5, [38, 50, 53, 57]),  # Dm
    (65.6, [34, 46, 53, 58]),  # B♭
    (77.4, [41, 48, 53, 57]),  # F
    (95.4, [43, 50, 55, 58]),  # Gm
    (103.2, [38, 50, 53, 57]),  # Dm
    (115.8, [36, 48, 52, 55]),  # C
    (126.5, [34, 50, 53, 58]),  # B♭
    (137.6, [45, 49, 52, 57]),  # A
    (145.7, [38, 50, 53, 57]),  # Dm
    (155.5, [43, 50, 55, 58]),  # Gm
    (169.4, [34, 50, 53, 58]),  # B♭
    (178.7, [45, 49, 52, 57]),  # A
    (193.8, [38, 50, 53, 57]),  # Dm
    (211.6, [34, 46, 53, 58]),  # B♭
    (224.5, [43, 50, 55, 58]),  # Gm
    (237.3, [38, 50, 53, 57]),  # Dm
    (252.4, [41, 48, 53, 57]),  # F
    (259.6, [34, 50, 53, 58]),  # B♭
    (264.0, [38, 50, 54, 57]),  # D (picardy third under 一直记着)
]
XF = 2.5  # crossfade between chords
for i, (t0, notes) in enumerate(CHORDS):
    t1 = CHORDS[i + 1][0] if i + 1 < len(CHORDS) else DUR
    d = t1 - t0 + XF
    n = int(d * SR)
    e = ramp(n, XF if i else 6.0, XF if i + 1 < len(CHORDS) else 6.0)
    for k, m in enumerate(notes):
        g = 0.55 if k == 0 else 0.32
        add(pad_voice(m, n) * e, t0 - (XF / 2 if i else 0), g, pan=(-0.35, 0.3, -0.15, 0.4)[k])
    add(pad_voice(26, n) * e, t0 - (XF / 2 if i else 0), 0.35)  # D1 drone

# bell tones on act changes (A4 / D5), very quiet
for t, m in [(15.4, 69), (65.6, 74), (103.2, 69), (137.6, 74), (193.8, 69), (252.4, 77)]:
    add(bell(m), t, 0.22, pan=0.2)

# distant siren under the opening and the ending
add(siren(9.0), 2.8, 0.16, pan=-0.2)
add(siren(9.5), 255.0, 0.13, pan=0.2)

# room: convolve with a 3 s decaying-noise impulse
ir_n = int(3.0 * SR)
ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR * 2.3)
ir /= np.sqrt(np.sum(ir ** 2))
wetL = signal.fftconvolve(L, ir)[:N]
wetR = signal.fftconvolve(R, ir[::-1].copy()[::-1] * 0.98)[:N]
L2 = 0.65 * L + 0.5 * wetL
R2 = 0.65 * R + 0.5 * wetR

# master: fade in/out, normalise to −24 dBFS RMS, peak ≤ −6 dBFS
fade = ramp(N, 5.0, 5.0)
st = np.stack([L2 * fade, R2 * fade], axis=1)
rms = np.sqrt(np.mean(st ** 2))
st *= 10 ** (-24 / 20) / rms
pk = np.max(np.abs(st))
if pk > 10 ** (-6 / 20):
    st *= 10 ** (-6 / 20) / pk
OUT.parent.mkdir(parents=True, exist_ok=True)
wavfile.write(OUT, SR, (st * 32767).astype(np.int16))
print('ok', OUT, f'rms {20 * np.log10(np.sqrt(np.mean(st ** 2))):.1f} dBFS peak {20 * np.log10(np.max(np.abs(st))):.1f} dBFS')
