const fs = require('fs');
const path = require('path');
const SR = 44100, DUR = 30.0, N = Math.floor(SR * DUR);

// master buffers (stereo)
const L = new Float32Array(N), R = new Float32Array(N);

function addL(i, v) { if (i >= 0 && i < N) L[i] += v; }
function addR(i, v) { if (i >= 0 && i < N) R[i] += v; }

// pentatonic freqs
const NT = { A2: 110, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196, A3: 220, C4: 261.63, D4: 293.66, E4: 329.63, G4: 392, A4: 440, C5: 523.25, D5: 587.33, E5: 659.26 };

function pluck(t0, f, amp, pan, decay) {
  const d = decay || 6;
  const len = Math.floor(SR * 0.8);
  const st = Math.floor(t0 * SR);
  for (let i = 0; i < len; i++) {
    const tt = i / SR; const env = Math.exp(-tt * d);
    const w = Math.sin(2 * Math.PI * f * tt) + 0.35 * Math.sin(4 * Math.PI * f * tt) * env + 0.15 * Math.sin(6 * Math.PI * f * tt) * env;
    const v = w * env * amp * 0.28;
    addL(st + i, v * (1 - Math.max(0, pan)) * 0.9 + v * 0.1);
    addR(st + i, v * (1 + Math.min(0, pan)) * 0.9 + v * 0.1);
  }
}
function bass(t0, f, dur, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * dur);
  for (let i = 0; i < len; i++) {
    const tt = i / SR; const env = Math.min(1, tt * 60) * Math.exp(-tt * 2.2);
    const w = Math.sin(2 * Math.PI * f * tt) + 0.3 * Math.sin(2 * Math.PI * f * 0.5 * tt);
    addL(st + i, w * env * amp * 0.3); addR(st + i, w * env * amp * 0.3);
  }
}
function kick(t0, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.3);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR; const f = 110 * Math.exp(-tt * 16) + 40;
    ph += 2 * Math.PI * f / SR; const env = Math.exp(-tt * 13);
    const v = Math.sin(ph) * env * amp * 0.5;
    addL(st + i, v); addR(st + i, v);
  }
}
function hat(t0, amp, pan) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.05);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR; const x = Math.random() * 2 - 1;
    const hp = x - prev; prev = x;
    const env = Math.exp(-tt * 60);
    const v = hp * env * amp * 0.12;
    addL(st + i, v * (pan < 0 ? 1 : 0.4)); addR(st + i, v * (pan > 0 ? 1 : 0.4));
  }
}
function snare(t0, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.18);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR; const x = Math.random() * 2 - 1;
    const bp = (x - prev) * 0.5 + prev * 0.5; prev = x;
    const env = Math.exp(-tt * 22);
    const tone = Math.sin(2 * Math.PI * 190 * tt) * Math.exp(-tt * 30);
    const v = (bp * 0.7 + tone * 0.5) * env * amp * 0.4;
    addL(st + i, v); addR(st + i, v);
  }
}
function whoosh(t0, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.3);
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR; const p = tt / 0.3;
    const x = Math.random() * 2 - 1;
    const a = 0.65 - 0.55 * p; // lowpass sweep down
    lp += a * (x - lp);
    const env = Math.sin(Math.PI * Math.min(1, p)) ** 2;
    const v = lp * env * amp * 0.5;
    addL(st + i, v * 0.9); addR(st + i, v * 0.9);
  }
}
function thud(t0, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.4);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR; const f = 150 * Math.exp(-tt * 9) + 42;
    ph += 2 * Math.PI * f / SR; const env = Math.exp(-tt * 8);
    const v = Math.sin(ph) * env * amp * 0.55;
    addL(st + i, v); addR(st + i, v);
    if (i < SR * 0.015) { const c = (Math.random() * 2 - 1) * Math.exp(-tt * 200) * amp * 0.25; addL(st + i, c); addR(st + i, c); }
  }
}
function pop(t0, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor(SR * 0.1);
  for (let i = 0; i < len; i++) {
    const tt = i / SR; const f = 500 + 500 * (tt / 0.1);
    const env = Math.exp(-tt * 40);
    const v = Math.sin(2 * Math.PI * f * tt) * env * amp * 0.3;
    addL(st + i, v); addR(st + i, v);
  }
}
function riser(t0, t1, amp) {
  const st = Math.floor(t0 * SR), len = Math.floor((t1 - t0) * SR);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const tt = i / SR; const p = tt / (t1 - t0);
    const f = 180 + 620 * p * p;
    ph += 2 * Math.PI * f / SR;
    const env = Math.min(1, p * 3) * p;
    const v = Math.sin(ph) * env * amp * 0.12;
    addL(st + i, v * 0.8); addR(st + i, v * 0.8);
  }
}

// ============ BGM sections ============
const BPM = 96, B = 60 / BPM; // beat = 0.625s
// Section 1: 0 - 10.09 tension (sparse)
{
  const sec1 = 10.09;
  // drone low A
  for (let t0 = 0; t0 < sec1; t0 += 2 * B) bass(t0, NT.A2, 2 * B, 0.5);
  // sparse plucks
  const mel1 = [NT.A3, NT.C4, NT.E3, NT.G3, NT.A3, NT.D4, NT.C4, NT.A3];
  for (let i = 0; i < 8; i++) pluck(i * 1.25 + 0.31, mel1[i], i < 4 ? 0.5 : 0.7, (i % 2 ? 0.3 : -0.3), 5);
  // soft kick every 2 beats from 5s
  for (let t0 = 5.0; t0 < sec1; t0 += 2 * B) kick(t0, 0.8);
}
// Section 2: 10.09 - 21.27 groove
{
  const s0 = 10.09, s1 = 21.27;
  for (let t0 = s0; t0 < s1; t0 += B) kick(t0, 1.0);
  for (let t0 = s0; t0 < s1; t0 += B / 2) hat(t0 + B / 4, 0.9, (Math.floor(t0 / (B / 2)) % 2) ? 0.4 : -0.4);
  const arp = [NT.A4, NT.G4, NT.E4, NT.D4, NT.C4, NT.D4, NT.E4, NT.G4];
  let k = 0;
  for (let t0 = s0; t0 < s1; t0 += B / 2) { pluck(t0, arp[k % 8], 0.75, (k % 2) ? 0.35 : -0.35, 7); k++; }
  const bl = [NT.A2, NT.A2, NT.C3, NT.G3 / 2];
  let m = 0;
  for (let t0 = s0; t0 < s1; t0 += 2 * B) { bass(t0, [NT.A2, NT.A2, NT.C3, NT.D3][m % 4], 2 * B, 0.65); m++; }
  // accent pluck at stamp slam
  pluck(13.3, NT.A4, 1.0, 0, 4); pluck(13.32, NT.E4, 0.8, 0, 4);
}
// Section 3: 21.27 - 30 build
{
  const s0 = 21.27;
  for (let t0 = s0; t0 < DUR; t0 += B) kick(t0, 1.05);
  for (let t0 = s0; t0 < DUR; t0 += B / 4) hat(t0, 0.7, (Math.floor(t0 / (B / 4)) % 2) ? 0.5 : -0.5);
  const up = [NT.A3, NT.C4, NT.D4, NT.E4, NT.G4, NT.A4, NT.G4, NT.E4];
  let k = 0;
  for (let t0 = s0; t0 < DUR; t0 += B / 4) { if (k % 2 === 0) pluck(t0, up[(k / 2) % 8] * (k > 24 ? 2 : 1), 0.6, (k % 4 < 2) ? -0.4 : 0.4, 8); k++; }
  for (let t0 = s0; t0 < DUR; t0 += 2 * B) bass(t0, NT.A2, 2 * B, 0.7);
  riser(24.0, 28.9, 0.9);
  // snare roll accelerando 27.2 - 28.9
  let dt = 0.28;
  for (let t0 = 27.0; t0 < 28.9; t0 += dt) { snare(t0, 0.8 + 0.3 * (t0 - 27) / 1.9); dt = Math.max(0.07, dt * 0.88); }
}

// ============ SFX ============
const cuts = [3.06, 5.19, 7.21, 10.13, 14.14, 16.16, 20.01, 21.37, 25.61];
for (const c of cuts) whoosh(c - 0.22, 0.85);
const thuds = [5.25, 13.3, 21.42, 25.66, 26.86, 28.49, 29.57];
for (const x of thuds) thud(x, 0.95);
const pops = [0.25, 0.57, 0.89, 1.21, 3.2, 4.3, 13.35, 29.0];
for (const x of pops) pop(x, 0.9);

// ============ master ============
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh(L[i] * 0.9); R[i] = Math.tanh(R[i] * 0.9);
}
// write wav 16-bit stereo
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 4, 4); buf.write('WAVE', 8);
buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  let l = Math.max(-1, Math.min(1, L[i] * 0.85));
  let r = Math.max(-1, Math.min(1, R[i] * 0.85));
  buf.writeInt16LE(Math.round(l * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(r * 32767), 44 + i * 4 + 2);
}
fs.writeFileSync(path.join(__dirname, 'bgm_sfx.wav'), buf);
console.log('bgm_sfx.wav written', N, 'samples');
