"""Compose an original background-music bed (BGM) as MIDI and render it with FluidSynth.
Use when no library track fits the video's length, mood or tempo. Output is licence-clean: the notes
are generated here, and the GeneralUser GS soundfont allows commercial use of music made with it.

Usage:
  python3 -I scripts/audio/compose_bgm.py --style curious --duration 72 --out public/audio/bgm/explainer
  python3 -I scripts/audio/compose_bgm.py --style documentary --duration 45 --bpm 84 --seed 3 --out ...

Writes <out>.mid, <out>.wav (48 kHz, normalised to −18 LUFS as a bed), and <out>.beats.json:
  {"bpm", "beat_s", "beats": [...], "downbeats": [...], "sections": [...], "grid_cuts_30fps": [...]}
grid_cuts_30fps = every bar downbeat snapped to the nearest frame of the 12 fps drawing grid at 30 fps,
so stepped-animation cuts can land on the music (style/collage-motion/12-audio.md §4).

Soundfont: $SOUNDFONT or ~/.local/share/soundfonts/GeneralUser-GS.sf2
(https://github.com/mrbumpy409/GeneralUser-GS — free for private and commercial music creation).
"""
import argparse
import json
import math
import os
import random
import struct
import subprocess
import sys
from pathlib import Path

TPB = 480  # ticks per beat

# GM programs (0-based) and drum notes
PIZZ, MARIMBA, CELESTA, GLOCK, PIANO, EPIANO, CELLO, STRINGS, PAD, ACBASS, FINGERBASS, CLARINET, PLUCK = 45, 12, 8, 9, 0, 4, 42, 48, 89, 32, 33, 71, 46
KOTO, SHAKUHACHI, TAIKO = 107, 77, 116
WOODBLOCK = 76  # GM drum: hi wood block
KICK, SIDESTICK, SNARE, CLAP, HAT, OPENHAT, SHAKER, TAMB = 36, 37, 38, 39, 42, 46, 70, 54

NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "Ab": 8, "A": 9, "Bb": 10, "B": 11}
QUAL = {"": [0, 4, 7], "m": [0, 3, 7], "maj7": [0, 4, 7, 11], "m7": [0, 3, 7, 10], "7": [0, 4, 7, 10], "sus2": [0, 2, 7]}


def chord(name):
    root = name[:2] if len(name) > 1 and name[1] in "#b" else name[:1]
    return NOTE[root], QUAL[name[len(root):]]


# Each style: tempo, progression (one chord per bar), instruments, drum feel. Moods map to presets in 07-presets.md.
STYLES = {
    # explainer: curious, light, pizzicato + marimba, side-stick groove
    "curious": dict(bpm=104, prog=["C", "Am", "F", "G", "C", "Em", "F", "G"], bass=ACBASS, arp=PIZZ, arp2=MARIMBA,
                    lead=CELESTA, pad=None, drums="sidestick", swing=0.0),
    # archive / documentary: thoughtful piano + cello, sparse pulse
    "documentary": dict(bpm=84, prog=["Dm", "Bb", "F", "C", "Dm", "Bb", "Gm", "A"], bass=CELLO, arp=PIANO, arp2=None,
                        lead=None, pad=STRINGS, drums="soft", swing=0.0),
    # postcard / thenNow: warm lo-fi, electric piano, swung
    "lofi": dict(bpm=86, prog=["Fmaj7", "Em7", "Dm7", "Cmaj7"], bass=FINGERBASS, arp=EPIANO, arp2=None,
                 lead=GLOCK, pad=PAD, drums="lofi", swing=0.12),
    # duotoneBurst / redIdent: driving pulse, plucks, claps
    # Chinese history: D-gong pentatonic, koto plucks, shakuhachi lead, half-time taiko + wood block
    "dynasty": dict(bpm=120, prog=["Dsus2", "Bm", "Asus2", "Bm"], bass=CELLO, arp=KOTO, arp2=None, lead=SHAKUHACHI,
                    pad=STRINGS, drums="taiko", swing=0.0, scale=[2, 4, 6, 9, 11]),
    "pulse": dict(bpm=120, prog=["Am", "F", "C", "G"], bass=FINGERBASS, arp=PLUCK, arp2=MARIMBA, lead=None, pad=None,
                  drums="four", swing=0.0),
}


def vlq(n):
    out = [n & 0x7F]
    n >>= 7
    while n:
        out.insert(0, 0x80 | (n & 0x7F))
        n >>= 7
    return bytes(out)


def track_bytes(events):
    """events: list of (tick, bytes) — sorted, converted to delta times."""
    events.sort(key=lambda e: (e[0], e[1][0] & 0xF0 == 0x90))  # note-offs before note-ons at the same tick
    data, last = b"", 0
    for t, ev in events:
        data += vlq(t - last) + ev
        last = t
    data += vlq(0) + b"\xff\x2f\x00"
    return b"MTrk" + struct.pack(">I", len(data)) + data


class Song:
    def __init__(self, bpm):
        self.bpm = bpm
        self.tracks = {}

    def ch(self, channel, program=None, volume=100, pan=64, reverb=40):
        evs = self.tracks.setdefault(channel, [])
        if program is not None and channel != 9:
            evs.append((0, bytes([0xC0 | channel, program])))
        for cc, v in ((7, volume), (10, pan), (91, reverb)):
            evs.append((0, bytes([0xB0 | channel, cc, v])))

    def note(self, channel, beat, length, pitch, vel):
        t0 = int(round(beat * TPB))
        t1 = int(round((beat + length) * TPB)) - 1
        vel = max(1, min(127, int(vel)))
        self.tracks[channel].append((t0, bytes([0x90 | channel, pitch, vel])))
        self.tracks[channel].append((max(t0 + 1, t1), bytes([0x80 | channel, pitch, 0])))

    def write(self, path):
        tempo = int(60_000_000 / self.bpm)
        t0 = [(0, b"\xff\x51\x03" + tempo.to_bytes(3, "big")), (0, b"\xff\x58\x04\x04\x02\x18\x08")]
        body = track_bytes(t0) + b"".join(track_bytes(list(evs)) for evs in self.tracks.values())
        Path(path).write_bytes(b"MThd" + struct.pack(">IHHH", 6, 1, 1 + len(self.tracks), TPB) + body)


def compose(style, duration, seed, bpm=None, transpose=0):
    st = STYLES[style]
    bpm = bpm or st["bpm"]
    rnd = random.Random(seed)
    beat_s = 60 / bpm
    bars = max(4, math.ceil(duration / (4 * beat_s)))
    song = Song(bpm)
    song.ch(0, st["bass"], 96, 64, 30)
    song.ch(1, st["arp"], 84, 44, 50)
    if st["arp2"] is not None:
        song.ch(2, st["arp2"], 70, 88, 50)
    if st["lead"] is not None:
        song.ch(3, st["lead"], 72, 70, 70)
    if st["pad"] is not None:
        song.ch(4, st["pad"], 58, 64, 80)
    song.ch(9, None, 88, 64, 30)
    if st["drums"] == "taiko":
        song.ch(5, TAIKO, 110, 64, 50)

    # arrangement: intro 2 bars (no drums), body in 8-bar sections A/B, outro 1 bar held chord
    sections = []
    b = 0
    sections.append(("intro", 0, 2))
    b = 2
    toggle = 0
    while b < bars - 1:
        n = min(8, bars - 1 - b)
        sections.append(("A" if toggle % 2 == 0 else "B", b, n))
        b += n
        toggle += 1
    sections.append(("outro", bars - 1, 1))

    # a 2-bar motif reused across sections (call), varied in B (response)
    motif = [(0, 0.5), (0.5, 0.5), (1.5, 1), (3, 0.5), (4, 1), (5.5, 0.5), (6, 1.5)]
    motif_deg = [rnd.choice([0, 1, 2]) for _ in motif]

    sw = st["swing"]

    def swing(beat):
        return beat + (sw if (beat * 2) % 2 == 1 else 0)

    for name, start, n in sections:
        for bar in range(start, start + n):
            root, ivs = chord(st["prog"][bar % len(st["prog"])])
            root += transpose
            t = bar * 4
            # bass: root on 1, fifth on 3, pickup on 4& in A/B
            if name == "outro":
                song.note(0, t, 4, 36 + root, 90)
            else:
                song.note(0, t, 1.5, 36 + root, 96)
                song.note(0, t + 2, 1, 36 + root + 7, 84)
                if name != "intro" and rnd.random() < 0.6:
                    song.note(0, swing(t + 3.5), 0.5, 36 + root + (12 if rnd.random() < 0.5 else 0), 76)
            # arpeggio eighths over chord tones (pattern varies per bar)
            tones = [48 + root + iv for iv in ivs] + [60 + root + ivs[0]]
            pattern = rnd.choice([[0, 1, 2, 3, 2, 1, 2, 3], [0, 2, 1, 3, 0, 2, 1, 2], [0, 1, 2, 1, 3, 2, 1, 0]])
            if name == "outro":
                for i, tn in enumerate(tones):
                    song.note(1, t + i * 0.12, 3.5, tn, 70)
            else:
                for i, k in enumerate(pattern):
                    if name == "intro" and i % 2:
                        continue
                    song.note(1, swing(t + i * 0.5), 0.45, tones[k % len(tones)], 78 + (8 if i % 4 == 0 else 0) + rnd.randint(-6, 6))
                    if st["arp2"] is not None and name == "B" and i % 2 == 0:
                        song.note(2, swing(t + i * 0.5 + 0.25), 0.3, tones[(k + 1) % len(tones)] + 12, 62 + rnd.randint(-6, 6))
            # pad: whole-bar chord
            if st["pad"] is not None:
                for iv in ivs[:3]:
                    song.note(4, t, 4, 60 + root + iv, 52)
            # lead motif in A (and varied in B), every other bar pair
            if st["lead"] is not None and name in ("A", "B") and (bar - start) % 4 in (0,):
                for (off, ln), deg in zip(motif, motif_deg):
                    d = deg if name == "A" else (deg + 1) % 3
                    r2, iv2 = chord(st["prog"][(bar + int(off // 4)) % len(st["prog"])])
                    pitch = 72 + r2 + transpose + iv2[d % len(iv2)]
                    if st.get("scale"):  # keep the lead inside the mode (pentatonic): snap to the nearest scale tone
                        pcs = [(p + transpose) % 12 for p in st["scale"]]
                        pitch = min((pitch + k for k in range(-2, 3)), key=lambda q: (q % 12 not in pcs, abs(q - pitch)))
                    song.note(3, swing(t + off), ln * 0.9, pitch, 74 + rnd.randint(-8, 8))
            # drums
            if name in ("A", "B"):
                d = st["drums"]
                for i in range(8):
                    beat = swing(t + i * 0.5)
                    if d == "sidestick":
                        if i in (0, 4):
                            song.note(9, beat, 0.25, KICK, 92)
                        if i in (2, 6):
                            song.note(9, beat, 0.25, SIDESTICK, 84)
                        song.note(9, beat, 0.2, HAT, 44 + (14 if i % 2 == 0 else 0))
                    elif d == "soft":
                        if i == 0:
                            song.note(9, beat, 0.25, KICK, 70)
                        if i in (3, 7):
                            song.note(9, beat, 0.2, SHAKER, 40)
                    elif d == "lofi":
                        if i in (0, 5):
                            song.note(9, beat, 0.25, KICK, 88)
                        if i in (2, 6):
                            song.note(9, beat, 0.25, SNARE, 70)
                        song.note(9, beat, 0.2, HAT, 38 + rnd.randint(0, 12))
                    elif d == "taiko":
                        if i == 0:
                            song.note(5, beat, 1.5, 36, 118)  # big drum on the downbeat (half-time feel)
                        if i == 5:
                            song.note(5, beat, 0.5, 43, 84)
                        if i in (3, 7):
                            song.note(9, beat, 0.15, WOODBLOCK, 46)
                    elif d == "four":
                        if i % 2 == 0:
                            song.note(9, beat, 0.25, KICK, 100)
                        if i in (2, 6):
                            song.note(9, beat, 0.25, CLAP, 86)
                        song.note(9, beat + 0.25 if i % 2 else beat, 0.2, OPENHAT if i % 2 else HAT, 52)
                if (bar - start) == n - 1 and name == "A":  # fill into the next section
                    song.note(9, t + 3.5, 0.25, TAMB, 70)
    beats = [round(i * beat_s, 4) for i in range(bars * 4 + 1)]
    return song, bpm, beat_s, beats, sections


def snap_to_grid(t, fps=30, anim=12):
    """nearest comp frame where the 12 fps drawing changes (0, 3, 5, 8, 10, 13, …)."""
    k = round(t * anim)
    return math.ceil(k * fps / anim)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--style", choices=list(STYLES), default="curious")
    ap.add_argument("--duration", type=float, required=True, help="seconds of video to cover")
    ap.add_argument("--bpm", type=int, default=None)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--transpose", type=int, default=0)
    ap.add_argument("--lufs", type=float, default=-18.0, help="bed loudness before the final mix")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--out", required=True, help="output path without extension")
    a = ap.parse_args()

    sf = os.environ.get("SOUNDFONT", str(Path.home() / ".local/share/soundfonts/GeneralUser-GS.sf2"))
    if not Path(sf).exists():
        sys.exit(f"soundfont not found: {sf}\n  curl -L -o ~/.local/share/soundfonts/GeneralUser-GS.sf2 "
                 "https://github.com/mrbumpy409/GeneralUser-GS/raw/main/GeneralUser-GS.sf2")
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    song, bpm, beat_s, beats, sections = compose(a.style, a.duration, a.seed, a.bpm, a.transpose)
    song.write(out.with_suffix(".mid"))

    raw = out.with_suffix(".raw.wav")
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.6", "-r", "48000", "-R", "1", "-C", "1", "-F", str(raw), sf,
                    str(out.with_suffix(".mid"))], check=True)
    fade_start = max(0.0, a.duration - 1.5)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af",
                    f"atrim=0:{a.duration + 0.5},afade=t=out:st={fade_start}:d=2,loudnorm=I={a.lufs}:TP=-2:LRA=11",
                    "-ar", "48000", str(out.with_suffix(".wav"))], check=True)
    raw.unlink()

    downbeats = beats[::4]
    meta = {
        "style": a.style, "bpm": bpm, "beat_s": round(beat_s, 4), "duration": a.duration, "seed": a.seed,
        "beats": [b for b in beats if b <= a.duration], "downbeats": [b for b in downbeats if b <= a.duration],
        "sections": [{"name": n, "start_s": round(s * 4 * beat_s, 3), "bars": k} for n, s, k in sections],
        "grid_cuts_30fps": sorted({snap_to_grid(b, a.fps) for b in downbeats if b <= a.duration}),
        "soundfont": Path(sf).name,
    }
    out.with_suffix(".beats.json").write_text(json.dumps(meta, indent=2))
    print(f"ok {out.with_suffix('.wav')} {bpm} bpm, {len(meta['downbeats'])} bars, sections "
          + ", ".join(f"{s['name']}@{s['start_s']}s" for s in meta["sections"]))


if __name__ == "__main__":
    main()
