# usage: ffmpeg -i narration.mp3 -ac 1 -ar 48000 -f f32le voice.f32; edit SECTIONS/CUES to the story; python3 make_quiet_bed.py
# -> mix.wav (voice +6 dB, bed ~20 dB under voice and ducked, sparse SFX), then ffmpeg loudnorm I=-16:TP=-1.5
# Original quiet BGM (soft plucked arpeggios + brushed pulse, 92 BPM) and a few restrained SFX for 「她」字是谁造的.
# Everything is synthesised here, so there are no third-party music rights.
import numpy as np
from scipy.signal import butter, sosfilt, sosfiltfilt
import soundfile as sf

SR = 48000
DUR = 284.625
N = int(DUR * SR)
rng = np.random.default_rng(7)

voice = np.fromfile('voice.f32', dtype=np.float32).astype(np.float64)
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]

def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b, o=2): return sosfilt(butter(o, [a, b], 'band', fs=SR, output='sos'), x)
def midi(n): return 440.0 * 2 ** ((n - 69) / 12)
def put(buf, x, t, g=1.0):
    i = int(t * SR)
    if i >= len(buf): return
    j = min(len(buf), i + len(x))
    buf[i:j] += g * x[: j - i]

# ---------- instruments ----------
def pluck(f, dur=1.6, bright=0.5):
    """Karplus–Strong pluck (pizzicato / kalimba-like)."""
    n = int(dur * SR)
    p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p)
    buf = lp(buf, 2000 + 4000 * bright, 1)
    out = np.empty(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    env = np.minimum(1, np.arange(n) / (0.004 * SR))
    return out * env

def ep(f, dur=2.4):
    """soft electric-piano-ish tone (sine + gentle 2nd harmonic, slow decay)."""
    t = np.arange(int(dur * SR)) / SR
    x = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 3) + 0.08 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 6)
    return x * np.exp(-t * 1.6) * np.minimum(1, t / 0.006)

def bass(f, dur=0.9):
    t = np.arange(int(dur * SR)) / SR
    x = np.sin(2 * np.pi * f * t) + 0.15 * np.sin(2 * np.pi * 2 * f * t)
    return x * np.exp(-t * 2.2) * np.minimum(1, t / 0.01)

def kick(dur=0.35):
    t = np.arange(int(dur * SR)) / SR
    f = 48 + 60 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 11)

def hat(dur=0.08, open_=False):
    n = int((0.22 if open_ else dur) * SR)
    t = np.arange(n) / SR
    return hp(rng.normal(0, 1, n), 7000) * np.exp(-t * (18 if open_ else 60))

def brush(dur=0.25):
    n = int(dur * SR); t = np.arange(n) / SR
    return bp(rng.normal(0, 1, n), 1800, 6000) * np.exp(-t * 14) * np.minimum(1, t / 0.01)

def pad(freqs, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * t + i) + 0.4 * np.sin(2 * np.pi * f * 1.003 * t) for i, f in enumerate(freqs))
    x = lp(x, 1400)
    a = min(int(1.5 * SR), n // 2)
    env = np.ones(n); env[:a] = np.linspace(0, 1, a); env[-a:] = np.linspace(1, 0, a)
    return x * env / len(freqs)

# ---------- harmony ----------
BPM = 92
BEAT = 60 / BPM
BAR = 4 * BEAT
# D minor family; each chord = (root midi, triad offsets)
PROG_A = [(50, [0, 3, 7]), (46, [0, 4, 7]), (53, [0, 4, 7]), (48, [0, 4, 7])]  # Dm Bb F C
PROG_B = [(53, [0, 4, 7]), (48, [0, 4, 7]), (50, [0, 3, 7]), (46, [0, 4, 7])]  # F C Dm Bb (brighter)
# sections: (start, end, prog, layers)
SECTIONS = [
    (0.0, 24.4, PROG_A, {'arp', 'hat'}),
    (24.4, 56.4, PROG_A, {'arp', 'hat', 'kick', 'bass'}),
    (56.4, 85.0, PROG_A, {'arp', 'tick', 'bass'}),
    (85.0, 145.9, PROG_A, {'arp', 'hat', 'kick', 'bass', 'brush'}),
    (145.9, 198.8, PROG_B, {'arp', 'hat', 'kick', 'bass'}),
    (198.8, 225.3, PROG_A, {'pad'}),
    (225.3, 264.4, PROG_B, {'arp', 'hat', 'kick', 'bass', 'brush'}),
    (264.4, DUR, PROG_A, {'ep', 'pad'}),
]

music = np.zeros(N)
drums = np.zeros(N)
pluck_cache = {}
def P(n, br):
    k = (n, br)
    if k not in pluck_cache: pluck_cache[k] = pluck(midi(n), 1.4, br)
    return pluck_cache[k]
K = kick(); B = brush()

for (s0, s1, prog, L) in SECTIONS:
    bar_i = 0
    t = s0
    while t < s1 - 0.05:
        root, tri = prog[bar_i % len(prog)]
        notes = [root + 12 + o for o in tri] + [root + 24]
        if 'arp' in L:
            # 8th-note arpeggio, a few notes skipped for air
            pattern = [0, 2, 1, 3, 2, 1, None, 2]
            for k, idx in enumerate(pattern):
                tt = t + k * BEAT / 2
                if idx is None or tt >= s1: continue
                put(music, P(notes[idx], 0.35 + 0.1 * (k % 2)), tt, 0.16 if k % 2 else 0.22)
        if 'bass' in L:
            for k in (0, 2.5):
                tt = t + k * BEAT
                if tt < s1: put(music, bass(midi(root - 12)), tt, 0.32)
        if 'pad' in L:
            put(music, pad([midi(n) for n in notes[:3]], min(BAR + 1.5, s1 - t + 1.0)), t, 0.18)
        if 'ep' in L:
            for k, idx in enumerate([0, None, 2, None]):
                tt = t + k * BEAT
                if idx is not None and tt < s1: put(music, ep(midi(notes[idx] + 12)), tt, 0.14)
        for k in range(8):
            tt = t + k * BEAT / 2
            if tt >= s1: break
            if 'hat' in L: put(drums, hat(open_=(k == 7)), tt, 0.05 if k % 2 else 0.08)
            if 'tick' in L and k % 2 == 0: put(drums, hat(0.03), tt, 0.06)
        if 'kick' in L:
            for k in (0, 2.5):
                tt = t + k * BEAT
                if tt < s1: put(drums, K, tt, 0.42)
        if 'brush' in L:
            for k in (1, 3):
                tt = t + k * BEAT
                if tt < s1: put(drums, B, tt, 0.12)
        t += BAR
        bar_i += 1

bgm = lp(music, 5200) + drums
# small room: two early reflections
for d, g in ((0.031, 0.18), (0.057, 0.12)):
    bgm[int(d * SR):] += g * bgm[: -int(d * SR)]

# gentle 2 s fades at section changes into/out of the beat-less section + global fade in/out
fade = np.ones(N)
fi = int(1.0 * SR); fade[:fi] = np.linspace(0, 1, fi)
fo = int(3.0 * SR); fade[-fo:] = np.linspace(1, 0, fo)
bgm *= fade

# ---------- duck under the narration ----------
env = np.abs(voice)
env = sosfiltfilt(butter(2, 3, 'low', fs=SR, output='sos'), env)
talk = (env > 0.01).astype(float)
talk = sosfiltfilt(butter(1, 1.2, 'low', fs=SR, output='sos'), talk)
duck = 1 - 0.45 * np.clip(talk, 0, 1)  # about −5 dB while speaking
bgm *= duck

# ---------- SFX (few, soft) ----------
def thump():
    t = np.arange(int(0.25 * SR)) / SR
    return np.sin(2 * np.pi * (70 + 50 * np.exp(-t * 40)) * t) * np.exp(-t * 18) + 0.3 * lp(rng.normal(0, 1, len(t)), 900) * np.exp(-t * 30)
def paper():
    n = int(0.28 * SR); t = np.arange(n) / SR
    return bp(rng.normal(0, 1, n), 900, 5000) * np.exp(-t * 16) * np.minimum(1, t / 0.015)
def pencil(dur=0.45):
    n = int(dur * SR); t = np.arange(n) / SR
    grain = (rng.random(n) < 0.02).astype(float) * rng.normal(0, 1, n)
    x = bp(rng.normal(0, 1, n) * 0.4 + grain * 3, 2500, 7000) * np.sin(np.pi * t / dur)
    return x
def stamp():
    return thump() * 1.2 + np.pad(paper() * 0.5, (0, 0))[: int(0.25 * SR)]
def ding(f=1318.5):
    t = np.arange(int(1.6 * SR)) / SR
    return (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 4)) * np.exp(-t * 3.2) * np.minimum(1, t / 0.003)
def click():
    n = int(0.03 * SR); t = np.arange(n) / SR
    return bp(rng.normal(0, 1, n), 2000, 8000) * np.exp(-t * 300)
def keys(k=3):
    out = np.zeros(int(0.6 * SR))
    for i in range(k):
        put(out, click(), 0.12 * i + 0.02 * rng.random(), 1.0)
    return out

S = np.zeros(N)
CUES = [
    (0.15, thump, 0.55),    # 她 slaps in
    (11.8, pencil, 0.30),   # circle 她 in the Kangxi page
    (21.8, paper, 0.40),    # new job 她
    (67.8, thump, 0.40),    # 他 + 小女 lead-type stand-in
    (82.2, pencil, 0.30),   # circle 伊
    (92.6, paper, 0.40),    # 这是刘半农的错
    (144.0, stamp, 0.55),   # 非人 stamp
    (158.6, ding, 0.16),    # 他 → 她
    (196.6, stamp, 0.45),   # 落定
    (230.1, paper, 0.35),   # TA
    (255.2, ding, 0.14),    # 㐅也 appears
    (261.0, keys, 0.30),    # typing → tofu
    (271.2, keys, 0.25),    # typing again
    (283.2, lambda: ding(987.8), 0.12),  # credit
]
for t, fn, g in CUES:
    put(S, fn(), t, g)

# ---------- mix ----------
v_gain = 10 ** (6.0 / 20)   # narration −23.4 → about −17.4 LUFS before final normalise
mix = voice * v_gain + bgm * 0.24 + S * 0.9
peak = np.max(np.abs(mix)); print('peak', peak)
sf.write('mix.wav', mix.astype(np.float32), SR, subtype='FLOAT')
sf.write('bgm_stem.wav', (bgm * 0.24).astype(np.float32), SR, subtype='FLOAT')
sf.write('sfx_stem.wav', (S * 0.9).astype(np.float32), SR, subtype='FLOAT')
print('ok')
