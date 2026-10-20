// Synthesize the SFX palette with Tone.js (offline, in Node) when no library sound fits.
// Each sound is named after the motion primitive it accompanies (style/collage-motion/12-audio.md §3).
// Output: public/audio/sfx/synth/<name>_<variant>.wav, 48 kHz mono, peak-normalised to -3 dBFS.
//
// Usage: node scripts/audio/tone_sfx.mjs [--out public/audio/sfx/synth] [--variants 3] [--only pop,slam]
import fs from 'node:fs';
import path from 'node:path';
import * as nwa from 'node-web-audio-api';

for (const k of Object.keys(nwa)) globalThis[k] = nwa[k];
globalThis.window = globalThis;

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const OUT = opt('out', 'public/audio/sfx/synth');
const VARIANTS = Number(opt('variants', 3));
const ONLY = opt('only', '') ? opt('only', '').split(',') : null;
const SR = 48000;

// Deterministic randomness so a variant always sounds the same (Tone.Noise uses Math.random).
const seeded = (seed) => {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const Tone = await import('tone');

// ---- the palette: name → {dur seconds, build(Tone, r)} where r() is the seeded random ----
const SFX = {
  // M1 prop pop-in: a short pitched "bloop" with a paper click on the attack
  pop: {dur: 0.22, build: (T, r) => {
    const o = new T.Oscillator({type: 'sine', frequency: 700 + r() * 300}).start(0);
    o.frequency.exponentialRampTo(220 + r() * 60, 0.09, 0);
    const e = new T.AmplitudeEnvelope({attack: 0.002, decay: 0.12, sustain: 0, release: 0.05}).toDestination();
    o.connect(e); e.triggerAttackRelease(0.12, 0);
    const n = new T.Noise('white').start(0).stop(0.012);
    const f = new T.Filter(3500, 'highpass').toDestination();
    const g = new T.Gain(0.25); n.connect(g); g.connect(f);
  }},
  // M2 disc / shape pop: softer, lower, no click
  'pop-soft': {dur: 0.2, build: (T, r) => {
    const o = new T.Oscillator({type: 'triangle', frequency: 420 + r() * 120}).start(0);
    o.frequency.exponentialRampTo(180, 0.1, 0);
    const e = new T.AmplitudeEnvelope({attack: 0.004, decay: 0.14, sustain: 0, release: 0.04}).toDestination();
    o.connect(e); e.triggerAttackRelease(0.14, 0);
  }},
  // M8 headline slam / heavy prop landing: low thump + short body noise
  slam: {dur: 0.4, build: (T, r) => {
    const m = new T.MembraneSynth({pitchDecay: 0.04, octaves: 4, envelope: {attack: 0.001, decay: 0.28, sustain: 0}}).toDestination();
    m.triggerAttackRelease(38 + r() * 8, 0.3, 0);
    const n = new T.Noise('brown').start(0).stop(0.08);
    const f = new T.Filter(900, 'lowpass').toDestination(); const g = new T.Gain(0.5); n.connect(g); g.connect(f);
  }},
  // M22 rubber stamp: thump + paper slap (band-passed noise)
  stamp: {dur: 0.35, build: (T, r) => {
    const m = new T.MembraneSynth({pitchDecay: 0.02, octaves: 3, envelope: {attack: 0.001, decay: 0.16, sustain: 0}}).toDestination();
    m.triggerAttackRelease(70 + r() * 10, 0.15, 0);
    const n = new T.Noise('pink').start(0).stop(0.06);
    const f = new T.Filter({frequency: 2200 + r() * 600, type: 'bandpass', Q: 1.2}).toDestination(); n.connect(f);
  }},
  // T1 whip-pan: band-pass noise sweeping up, sharp tail
  swish: {dur: 0.32, build: (T, r) => {
    const n = new T.Noise('pink').start(0).stop(0.3);
    const f = new T.Filter({frequency: 500, type: 'bandpass', Q: 2}).toDestination();
    f.frequency.exponentialRampTo(4500 + r() * 1500, 0.22, 0.02);
    const e = new T.Gain(0); n.connect(e); e.connect(f);
    e.gain.setValueAtTime(0, 0); e.gain.linearRampTo(1, 0.16, 0); e.gain.linearRampTo(0, 0.12, 0.17);
  }},
  // T6/T15 sheet slide, M4/M5 prop slide: crinkly paper (noise with random amplitude flutter)
  paper: {dur: 0.45, build: (T, r) => {
    const n = new T.Noise('white').start(0).stop(0.44);
    const f = new T.Filter({frequency: 2600, type: 'bandpass', Q: 0.7}).toDestination();
    const g = new T.Gain(0); n.connect(g); g.connect(f);
    for (let t = 0; t < 0.42; t += 0.018) g.gain.setValueAtTime((0.25 + r() * 0.75) * Math.sin(Math.PI * (t / 0.42)), t);
    g.gain.setValueAtTime(0, 0.43);
  }},
  // type-on glyph / pose jump: tiny dry click
  tick: {dur: 0.05, build: (T, r) => {
    const n = new T.Noise('white').start(0).stop(0.006 + r() * 0.004);
    const f = new T.Filter(5000 + r() * 2000, 'highpass').toDestination(); n.connect(f);
  }},
  // M18 pencil scribble: high band noise gated at ~30 Hz
  pencil: {dur: 0.6, build: (T, r) => {
    const n = new T.Noise('white').start(0).stop(0.58);
    const f = new T.Filter({frequency: 4200, type: 'bandpass', Q: 1.5}).toDestination();
    const g = new T.Gain(0); n.connect(g); g.connect(f);
    for (let t = 0; t < 0.56; t += 1 / 30) { g.gain.setValueAtTime(0.4 + r() * 0.6, t); g.gain.setValueAtTime(0.05, t + 0.012 + r() * 0.01); }
    g.gain.setValueAtTime(0, 0.57);
  }},
  // T9 tile mosaic: a rapid run of clicks rising in pitch (one per tile wave)
  mosaic: {dur: 0.45, build: (T, r) => {
    const s = new T.MetalSynth({envelope: {attack: 0.001, decay: 0.03, release: 0.01}, harmonicity: 3.1, modulationIndex: 12, resonance: 3000}).toDestination();
    s.volume.value = -14;
    for (let i = 0; i < 10; i++) s.triggerAttackRelease(300 + i * 60 + r() * 20, 0.02, i * 0.038 + r() * 0.006);
  }},
  // T5 ink blackout: wet brush sweep swelling then cut
  ink: {dur: 0.6, build: (T) => {
    const n = new T.Noise('brown').start(0).stop(0.56);
    const f = new T.Filter(400, 'lowpass').toDestination(); f.frequency.exponentialRampTo(2400, 0.5, 0);
    const g = new T.Gain(0); n.connect(g); g.connect(f); g.gain.linearRampTo(1, 0.5, 0); g.gain.setValueAtTime(0, 0.55);
  }},
  // T14 slice/block glitch: bit-crushed square bursts (stepped WaveShaper; Tone.BitCrusher needs an
  // AudioWorklet, which Node's Web Audio does not provide)
  glitch: {dur: 0.3, build: (T, r) => {
    const crush = new T.WaveShaper((v) => Math.round(v * 3) / 3, 1024).toDestination();
    const o = new T.Oscillator({type: 'square', frequency: 120 + r() * 400}).connect(crush);
    o.start(0).stop(0.28);
    for (let t = 0; t < 0.28; t += 0.035) o.frequency.setValueAtTime(80 + r() * 900, t);
    o.volume.value = -10;
  }},
  // M14 end card / payoff: soft FM chime
  chime: {dur: 1.2, build: (T, r) => {
    const s = new T.FMSynth({harmonicity: 3, modulationIndex: 6, envelope: {attack: 0.005, decay: 0.9, sustain: 0, release: 0.3}}).toDestination();
    s.triggerAttackRelease(['C6', 'E6', 'G5'][Math.floor(r() * 3)], 0.9, 0);
  }},
  // M10 pump stroke: short air hiss
  pump: {dur: 0.35, build: (T) => {
    const n = new T.Noise('pink').start(0).stop(0.3);
    const f = new T.Filter({frequency: 1500, type: 'bandpass', Q: 0.8}).toDestination(); f.frequency.linearRampTo(900, 0.3, 0);
    const g = new T.Gain(0); n.connect(g); g.connect(f); g.gain.linearRampTo(1, 0.05, 0); g.gain.linearRampTo(0, 0.25, 0.05);
  }},
  // M10 balloon burst: sharp crack + short decay
  burst: {dur: 0.4, build: (T) => {
    const n = new T.Noise('white').start(0).stop(0.25);
    const f = new T.Filter(1200, 'highpass').toDestination(); const g = new T.Gain(1); n.connect(g); g.connect(f);
    g.gain.setValueAtTime(1, 0); g.gain.exponentialRampTo(0.01, 0.22, 0.003);
    const m = new T.MembraneSynth({envelope: {attack: 0.001, decay: 0.1, sustain: 0}}).toDestination(); m.triggerAttackRelease(90, 0.08, 0);
  }},
};

const writeWav = (file, data) => {
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const gain = peak > 0 ? 0.708 / peak : 1; // -3 dBFS
  const buf = Buffer.alloc(44 + data.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + data.length * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(data[i] * gain * 32767))), 44 + i * 2);
  fs.writeFileSync(file, buf);
  return peak;
};

fs.mkdirSync(OUT, {recursive: true});
for (const [name, sfx] of Object.entries(SFX)) {
  if (ONLY && !ONLY.includes(name)) continue;
  for (let v = 1; v <= VARIANTS; v++) {
    const r = seeded(name.length * 1000 + v);
    const saved = Math.random;
    Math.random = r;
    const buffer = await Tone.Offline(() => sfx.build(Tone, r), sfx.dur, 1, SR);
    Math.random = saved;
    const file = path.join(OUT, `${name}_${v}.wav`);
    const peak = writeWav(file, buffer.getChannelData(0));
    console.log(`${peak > 0.001 ? 'ok ' : 'SILENT'} ${file} ${sfx.dur}s raw-peak ${peak.toFixed(3)}`);
  }
}
process.exit(0);
