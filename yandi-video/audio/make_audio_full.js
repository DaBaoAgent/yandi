const fs = require('fs');
const path = require('path');
const SR = 44100, DUR = 386.9, N = Math.floor(SR * DUR);
const L = new Float32Array(N), R = new Float32Array(N);
const SB = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'render', 'sb.json'), 'utf8'));
function addL(i, v) { if (i >= 0 && i < N) L[i] += v; }
function addR(i, v) { if (i >= 0 && i < N) R[i] += v; }
const NT = { A1: 55, C2: 65.41, D2: 73.42, E2: 82.41, G2: 98, A2: 110, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196, A3: 220, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.26, G5: 783.99 };

function pluck(t0, f, amp, pan, decay) {
  const d = decay || 6, len = Math.floor(SR * 0.8), st = Math.floor(t0 * SR);
  for (let i = 0; i < len; i++) {
    const tt = i / SR, env = Math.exp(-tt * d);
    const w = Math.sin(2 * Math.PI * f * tt) + 0.35 * Math.sin(4 * Math.PI * f * tt) * env + 0.15 * Math.sin(6 * Math.PI * f * tt) * env;
    const v = w * env * amp * 0.28;
    addL(st + i, v * (1 - Math.max(0, pan)) * 0.9 + v * 0.1);
    addR(st + i, v * (1 + Math.min(0, pan)) * 0.9 + v * 0.1);
  }
}
function bass(t0, f, dur, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * dur);
  for (let i = 0; i < len; i++) {
    const tt = i / SR, env = Math.min(1, tt * 60) * Math.exp(-tt * 2.2);
    const w = Math.sin(2 * Math.PI * f * tt) + 0.3 * Math.sin(2 * Math.PI * f * 0.5 * tt);
    addL(st + i, w * env * amp * 0.3); addR(st + i, w * env * amp * 0.3);
  }
}
function kick(t0, amp, base) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.3), b = base || 40;
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR, f = 110 * Math.exp(-tt * 16) + b;
    ph += 2 * Math.PI * f / SR;
    const v = Math.sin(ph) * Math.exp(-tt * 13) * amp * 0.5;
    addL(st + i, v); addR(st + i, v);
  }
}
function hat(t0, amp, pan) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.05);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR, x = Math.random() * 2 - 1, hp = x - prev; prev = x;
    const v = hp * Math.exp(-tt * 60) * amp * 0.12;
    addL(st + i, v * (pan < 0 ? 1 : 0.4)); addR(st + i, v * (pan > 0 ? 1 : 0.4));
  }
}
function snare(t0, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.18);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR, x = Math.random() * 2 - 1;
    const bp = (x - prev) * 0.5 + prev * 0.5; prev = x;
    const tone = Math.sin(2 * Math.PI * 190 * tt) * Math.exp(-tt * 30);
    const v = (bp * 0.7 + tone * 0.5) * Math.exp(-tt * 22) * amp * 0.4;
    addL(st + i, v); addR(st + i, v);
  }
}
function whoosh(t0, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.3);
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR, p = tt / 0.3, x = Math.random() * 2 - 1;
    lp += (0.65 - 0.55 * p) * (x - lp);
    const v = lp * Math.sin(Math.PI * Math.min(1, p)) ** 2 * amp * 0.5;
    addL(st + i, v * 0.9); addR(st + i, v * 0.9);
  }
}
function thud(t0, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.4);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR, f = 150 * Math.exp(-tt * 9) + 42;
    ph += 2 * Math.PI * f / SR;
    const v = Math.sin(ph) * Math.exp(-tt * 8) * amp * 0.55;
    addL(st + i, v); addR(st + i, v);
  }
}
function pop(t0, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.1);
  for (let i = 0; i < len; i++) {
    const tt = i / SR, f = 500 + 500 * (tt / 0.1);
    const v = Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt * 40) * amp * 0.3;
    addL(st + i, v); addR(st + i, v);
  }
}
// generic section player
function section(s0, s1, opt) {
  const B = 60 / opt.bpm;
  const sc = opt.scale, bassRoots = opt.bassRoots;
  let k = 0;
  for (let t0 = s0; t0 < s1; t0 += B / (opt.arpDiv || 2)) {
    pluck(t0, sc[k % sc.length], opt.arpAmp || 0.55, (k % 2) ? 0.35 : -0.35, opt.decay || 7);
    k++;
  }
  for (let t0 = s0; t0 < s1; t0 += B * (opt.kickEvery || 1)) kick(t0, opt.kickAmp || 0.9, opt.kickBase);
  for (let t0 = s0; t0 < s1; t0 += B / 2) hat(t0, opt.hatAmp || 0.8, (Math.floor(t0 / (B / 2)) % 2) ? 0.4 : -0.4);
  let m = 0;
  for (let t0 = s0; t0 < s1; t0 += 2 * B) { bass(t0, bassRoots[m % bassRoots.length], 2 * B, opt.bassAmp || 0.55); m++; }
}

const A5 = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
const D5 = [293.66, 329.63, 392, 440, 523.25, 587.33, 659.26, 783.99];
const E5 = [329.63, 392, 440, 523.25, 587.33, 659.26, 783.99, 880];
const C5s = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.26];

// hook 0-32.4: sparse then groove
section(0, 10.1, { bpm: 84, scale: [220, 261.63, 329.63, 392], bassRoots: [110, 110, 130.81, 98], arpDiv: 1, arpAmp: 0.4, kickEvery: 2, kickAmp: 0.6, hatAmp: 0.4, bassAmp: 0.45 });
section(10.1, 21.3, { bpm: 96, scale: A5, bassRoots: [110, 110, 130.81, 73.42], arpDiv: 2, arpAmp: 0.6, kickAmp: 0.95, hatAmp: 0.8, bassAmp: 0.6 });
section(21.3, 32.4, { bpm: 96, scale: A5, bassRoots: [110, 110, 130.81, 146.83], arpDiv: 4, arpAmp: 0.5, kickAmp: 1.0, hatAmp: 0.7, bassAmp: 0.65 });
// chapters
section(32.4, 106.4, { bpm: 96, scale: A5, bassRoots: [110, 110, 130.81, 98], arpDiv: 2, arpAmp: 0.5, kickAmp: 0.85, hatAmp: 0.7, bassAmp: 0.55 });
section(106.4, 166.3, { bpm: 100, scale: D5, bassRoots: [110, 146.83, 130.81, 98], arpDiv: 2, arpAmp: 0.52, kickAmp: 0.85, hatAmp: 0.75, bassAmp: 0.55 });
section(166.3, 206.2, { bpm: 104, scale: E5, bassRoots: [110, 110, 164.81, 146.83], arpDiv: 4, arpAmp: 0.42, kickAmp: 0.9, hatAmp: 0.8, bassAmp: 0.55 });
section(206.2, 250.7, { bpm: 96, scale: C5s, bassRoots: [130.81, 130.81, 98, 110], arpDiv: 2, arpAmp: 0.55, kickAmp: 0.85, hatAmp: 0.7, bassAmp: 0.55 });
section(250.7, 295, { bpm: 100, scale: [293.66, 329.63, 392, 440, 523.25, 440, 392, 329.63], bassRoots: [110, 98, 110, 82.41], arpDiv: 2, arpAmp: 0.5, kickAmp: 1.0, kickBase: 34, hatAmp: 0.85, bassAmp: 0.7 });
section(295, 329.1, { bpm: 92, scale: [392, 440, 523.25, 587.33, 392, 329.63, 293.66, 261.63], bassRoots: [98, 110, 98, 130.81], arpDiv: 2, arpAmp: 0.45, kickAmp: 0.75, hatAmp: 0.6, bassAmp: 0.5 });
section(329.1, 372.5, { bpm: 96, scale: A5, bassRoots: [110, 110, 130.81, 146.83], arpDiv: 4, arpAmp: 0.55, kickAmp: 0.95, hatAmp: 0.8, bassAmp: 0.62 });
// outro resolve
section(372.5, 383.3, { bpm: 80, scale: [440, 523.25, 659.26, 587.33, 440, 392], bassRoots: [110, 110, 146.83, 110], arpDiv: 2, arpAmp: 0.4, kickEvery: 2, kickAmp: 0.5, hatAmp: 0.35, bassAmp: 0.45, decay: 4.5 });
// risers at chapter transitions
for (const t of [30.5, 104.5, 164.4, 204.3, 248.8, 292.9, 327]) {
  const st = Math.floor(t * SR), len = Math.floor(SR * 1.6);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR, p = tt / 1.6, f = 180 + 500 * p * p;
    ph += 2 * Math.PI * f / SR;
    const v = Math.sin(ph) * Math.min(1, p * 3) * p * 0.1;
    addL(st + i, v * 0.8); addR(st + i, v * 0.8);
  }
}
// SFX events
for (const ev of SB.events) {
  if (ev.k === 'whoosh') whoosh(ev.t - 0.2, 0.8);
  else if (ev.k === 'thud') thud(ev.t, 0.9);
  else if (ev.k === 'pop') pop(ev.t, 0.75);
}
// master + fade
for (let i = 0; i < N; i++) {
  const t = i / SR;
  let g = 1;
  if (t > DUR - 3.2) g = Math.max(0, (DUR - t) / 3.2);
  L[i] = Math.tanh(L[i] * 0.9) * g; R[i] = Math.tanh(R[i] * 0.9) * g;
}
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const l = Math.max(-1, Math.min(1, L[i] * 0.85)), r = Math.max(-1, Math.min(1, R[i] * 0.85));
  buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(r * 32767), 44 + i * 4 + 2);
}
fs.writeFileSync(path.join(__dirname, 'bgm_full.wav'), buf);
console.log('bgm_full.wav', N, 'samples', (N / SR).toFixed(1) + 's');
