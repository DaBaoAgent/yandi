"""audio_full.py — 曹操 全片 187 s：chiptune 配乐 + hit 对齐 SFX + 旁白 + 字幕打字声。

与样片的 audio.py 同一套音色与混音口径；0–29.4 s 原样复用样片乐段，
30 s 之后按分镜叙事续写。
产出 out/music.wav、out/mix_raw.wav；两遍 loudnorm 在 make_audio.sh 里做。
"""
import json, os, wave
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
CUE = json.load(open(os.path.join(HERE, 'cues.json'), encoding='utf-8'))
DUR = float(CUE.get('duration', 187.0))
N = int(SR * DUR)
H = CUE['hits']

VOICE = os.environ.get('XIANGSU_VOICE') or ''
if not VOICE:
    raise SystemExit('未设置 XIANGSU_VOICE（旁白 wav 路径）')
if not os.path.exists(VOICE):
    raise SystemExit('旁白不存在：%s' % VOICE)

# ------------------------------------------------------------------ helpers
def note_hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12.0)

def adsr(n, a=0.004, d=0.06, r=0.03, sustain_level=0.0):
    a_n = min(max(1, int(a * SR)), n); d_n = max(1, int(d * SR)); r_n = max(1, int(r * SR))
    e = np.zeros(n)
    e[:a_n] = np.linspace(0, 1, a_n, endpoint=False)
    rest = n - a_n
    if rest > 0:
        d_n2 = min(d_n, rest)
        e[a_n:a_n + d_n2] = np.linspace(1, sustain_level, d_n2, endpoint=False)
        if rest > d_n2:
            e[a_n + d_n2:] = sustain_level
    if r_n < n:
        e[-r_n:] *= np.linspace(1, 0, r_n)
    return e

def square(freq, dur, duty=0.5):
    n = int(dur * SR)
    ph = (np.arange(n) * freq / SR) % 1.0
    return np.where(ph < duty, 1.0, -1.0)

def tri(freq, dur):
    n = int(dur * SR)
    ph = (np.arange(n) * freq / SR) % 1.0
    return 4 * np.abs(ph - 0.5) - 1

def noise(dur, seed=0):
    n = int(dur * SR)
    return np.random.default_rng(seed).uniform(-1, 1, n)

def lowpass_fast(x, cut):
    n = len(x)
    if n < 8:
        return x
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1.0 / SR)
    return np.fft.irfft(X / (1.0 + (f / cut) ** 4), n)

def highpass_fast(x, cut):
    return x - lowpass_fast(x, cut)

def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i < 0:
        sig = sig[-i:]; i = 0
    j = min(len(buf), i + len(sig))
    if j > i:
        buf[i:j] += sig[:j - i] * gain

# ------------------------------------------------------------------ instruments
def pluck(midi, dur, gain=1.0, duty=0.25):
    f = note_hz(midi); n = int(dur * SR)
    s = square(f, dur, duty) * 0.6 + tri(f * 2, dur) * 0.25
    e = adsr(n, 0.002, 0.05, 0.02, 0.25) * np.exp(-np.arange(n) / SR * 7.0)
    return s * e * gain

def bass(midi, dur, gain=1.0):
    f = note_hz(midi); n = int(dur * SR)
    s = tri(f, dur) * 0.8 + np.sin(2 * np.pi * f * np.arange(n) / SR) * 0.2
    e = adsr(n, 0.004, 0.05, 0.02, 0.55)
    return np.tanh(s * 1.6) * e * gain

def bell(midi, dur, gain=1.0):
    f = note_hz(midi); n = int(dur * SR); x = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * x) * 0.6 + np.sin(2 * np.pi * f * 2.01 * x) * 0.25 + np.sin(2 * np.pi * f * 3.02 * x) * 0.12
    return s * np.exp(-x * 5.5) * gain

def kick(gain=1.0):
    n = int(0.16 * SR); x = np.arange(n) / SR
    f = 150 * np.exp(-x * 26) + 46
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 22) * gain

def snare(seed=1, gain=1.0):
    n = int(0.12 * SR); x = np.arange(n) / SR
    s = noise(0.12, seed) * np.exp(-x * 34) + np.sin(2 * np.pi * 190 * x) * np.exp(-x * 40) * 0.4
    return highpass_fast(s, 900) * gain

def hat(seed=2, gain=1.0):
    n = int(0.05 * SR); x = np.arange(n) / SR
    return highpass_fast(noise(0.05, seed), 5200) * np.exp(-x * 90) * gain

def thud(dur=0.34, gain=1.0, seed=5):
    n = int(dur * SR); x = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum(120 * np.exp(-x * 15) + 40) / SR) * np.exp(-x * 12) * 0.55
            + lowpass_fast(noise(dur, seed), 1800) * np.exp(-x * 20) * 0.25) * gain

def whoosh(dur=0.5, gain=1.0, seed=7, lo=300, hi=2400):
    n = int(dur * SR); x = np.arange(n) / SR
    s = highpass_fast(noise(dur, seed), lo)
    s = lowpass_fast(s, hi)
    env = np.sin(np.pi * np.clip(x / dur, 0, 1)) ** 2
    return s * env * gain

def gong(midi=45, dur=2.2, gain=1.0):
    f = note_hz(midi); n = int(dur * SR); x = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * x) * 0.5 + np.sin(2 * np.pi * f * 1.47 * x) * 0.25
         + np.sin(2 * np.pi * f * 2.09 * x) * 0.15 + np.sin(2 * np.pi * f * 2.71 * x) * 0.08)
    return s * np.exp(-x * 1.6) * gain

def metal(midi=88, dur=0.9, gain=1.0):
    f = note_hz(midi); n = int(dur * SR); x = np.arange(n) / SR
    ring = (np.sin(2 * np.pi * f * x) + 0.5 * np.sin(2 * np.pi * f * 2.76 * x)
            + 0.3 * np.sin(2 * np.pi * f * 5.4 * x)) * np.exp(-x * 7)
    hit = highpass_fast(noise(0.05, 31), 3000) * np.exp(-x[:int(0.05 * SR)] * 120)
    out = ring * 0.6
    tail = np.zeros(n); tail[:len(hit)] += hit
    return (out + tail) * gain

def fire(dur, seed=41, gain=1.0):
    n = int(dur * SR); x = np.arange(n) / SR
    s = lowpass_fast(noise(dur, seed), 2600) * (0.5 + 0.5 * np.sin(2 * np.pi * 3.7 * x))
    return s * (0.6 + 0.4 * np.sin(2 * np.pi * 1.3 * x)) * gain

def paper(dur=0.4, gain=1.0, seed=61):
    n = int(dur * SR); x = np.arange(n) / SR
    return highpass_fast(noise(dur, seed), 1800) * np.exp(-x * 9) * gain

def tick(freq=1600, dur=0.03, gain=1.0, seed=1):
    n = int(dur * SR); x = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * x) * 0.7 + highpass_fast(noise(dur, seed), 2500) * 0.3) * np.exp(-x * 150) * gain

def coin(gain=1.0):
    a = np.zeros(int(0.5 * SR))
    place(a, tick(2600, 0.05, 1.0, 3), 0.0)
    place(a, tick(3400, 0.05, 0.7, 4), 0.07)
    place(a, tick(2900, 0.05, 0.4, 5), 0.13)
    return a * gain

def glass(seed=9, gain=1.0):
    n = int(0.7 * SR); x = np.arange(n) / SR
    s = highpass_fast(noise(0.7, seed), 2500) * np.exp(-x * 20)
    for i, f in enumerate([2100, 3150, 4300, 5600]):
        s += np.sin(2 * np.pi * f * x) * np.exp(-x * (14 + i * 4)) * 0.10
    return s * gain

def creak(dur=0.9, gain=1.0, seed=13):
    n = int(dur * SR); x = np.arange(n) / SR
    s = lowpass_fast(noise(dur, seed), 900) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 5.5 * x)))
    return s * np.minimum(1, x * 6) * np.exp(-x * 2.2) * gain

def snap(gain=1.0, seed=17):
    n = int(0.35 * SR); x = np.arange(n) / SR
    f = 1500 * np.exp(-x * 35) + 120
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 22)
            + highpass_fast(noise(0.35, seed), 2000) * np.exp(-x * 30)) * gain

def blip(freq=1250, gain=1.0):
    n = int(0.14 * SR); x = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * x) + 0.4 * np.sin(2 * np.pi * freq * 2 * x)) * np.exp(-x * 26) * gain

def rain(dur, gain=1.0, seed=23):
    n = int(dur * SR); x = np.arange(n) / SR
    s = lowpass_fast(noise(dur, seed), 5000)
    return s * (0.55 + 0.2 * np.sin(2 * np.pi * 0.7 * x) + 0.15 * np.sin(2 * np.pi * 2.3 * x)) * gain

def twang(midi=57, dur=0.9, gain=1.0):
    f = note_hz(midi); n = int(dur * SR); x = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * x) * 0.7 + np.sin(2 * np.pi * f * 2.004 * x) * 0.2 + np.sin(2 * np.pi * f * 3.01 * x) * 0.1
    return s * np.exp(-x * 4.2) * gain

def riser(dur=1.2, gain=1.0, seed=29):
    n = int(dur * SR); x = np.arange(n) / SR
    s = highpass_fast(noise(dur, seed), 400)
    return s * (x / dur) ** 2 * gain

# ------------------------------------------------------------------ score
def build_music():
    M_ = np.zeros(N)
    D2, A1, A2, C3, D3, E3, F3, G2, G3 = 38, 33, 45, 48, 50, 52, 53, 43, 55

    # ---------------- 0–29.4 样片段落（与已交付样片一致）
    place(M_, bass(D2, 1.7, 0.22), 0.0)
    for i, at in enumerate([0.18, 0.56, 1.02]):
        place(M_, bell([74, 69, 72][i], 0.75, 0.08), at)

    for i, at in enumerate([1.62, 1.90, 2.18, 2.46, 2.74, 3.02, 3.30, 3.58]):
        place(M_, pluck([62, 65, 69, 72, 74, 77, 81, 84][i], 0.16, 0.075), at)
    place(M_, bass(A2, 0.9, 0.18), 2.44)
    place(M_, pluck(81, 0.22, 0.09), 2.46)

    t0 = 4.2
    place(M_, bass(A1, 3.6, 0.16), t0)
    for i in range(8):
        place(M_, bass([A2, A2, C3, A2, D3, C3, G2, A2][i], 0.18, 0.22), t0 + 0.4 * i)
    for i in range(4):
        place(M_, kick(0.34), t0 + 0.8 * i + 0.05)
        place(M_, snare(20 + i, 0.12), t0 + 0.8 * i + 0.45)
    for i, at in enumerate([5.62, 5.90, 6.18, 6.46, 6.74, 7.02, 7.30]):
        place(M_, pluck([69, 72, 76, 79, 81, 79, 76][i], 0.18, 0.07), at)
    place(M_, bell(81, 0.85, 0.10), 5.62)

    t1 = 7.8
    place(M_, bass(D2, 2.7, 0.22), t1)
    for i in range(13):
        place(M_, kick(0.44), t1 + i * 0.2)
        place(M_, snare(40 + i, 0.14), t1 + i * 0.2 + 0.1)
        place(M_, hat(60 + i, 0.05), t1 + i * 0.1)
    for i, at in enumerate([7.90, 8.20, 8.50, 8.80, 9.10]):
        place(M_, pluck([50, 53, 57, 50, 46][i], 0.24, 0.10, 0.35), at)
    place(M_, fire(2.5, 41, 0.06), t1)
    n = int(0.55 * SR); x = np.arange(n) / SR
    place(M_, highpass_fast(lowpass_fast(noise(0.55, 91), 2200), 500) * (x / 0.55) ** 1.5 * 0.16, 9.15)

    place(M_, bass(D2, 2.9, 0.14), 10.5)
    for i, at in enumerate([10.66, 11.20, 11.74, 12.28]):
        place(M_, bell([69, 72, 76, 69][i], 0.8, 0.06), at)
    place(M_, bell(81, 1.1, 0.09), 12.52)

    place(M_, bass(D2, 1.6, 0.18), 13.6)
    place(M_, gong(42, 1.6, 0.24), 13.66)
    place(M_, bell(86, 0.9, 0.05), 13.78)

    place(M_, bass(A1, 3.2, 0.12), 15.2)
    for i, at in enumerate([15.32, 15.72, 16.12, 16.52, 16.92, 17.32, 17.72, 18.12]):
        place(M_, pluck([57, 60, 64, 69, 64, 60, 57, 60][i], 0.18, 0.065), at)
    place(M_, metal(84, 0.9, 0.07), 15.26)
    place(M_, bell(76, 0.8, 0.07), 16.72)

    place(M_, gong(38, 2.0, 0.26), 18.56)
    place(M_, bass(D2, 2.0, 0.10), 18.5)
    place(M_, bell(81, 1.0, 0.07), 19.24)
    place(M_, metal(91, 0.8, 0.05), 19.24)

    for i, at in enumerate([20.66, 21.14, 21.62, 22.10]):
        place(M_, bell([76, 79, 81, 84][i], 0.9, 0.055), at)
    place(M_, bass(A2, 1.6, 0.14), 20.6)
    place(M_, bass(A2, 1.4, 0.12), 22.6)
    place(M_, paper(0.5, 0.06, 63), 22.68)
    place(M_, thud(0.3, 0.20, 65), 23.11)

    for i, at in enumerate([24.42, 24.82, 25.22, 25.62, 26.02, 26.42, 26.82, 27.22, 27.62]):
        place(M_, pluck([69, 70, 72, 73, 76, 77, 76, 73, 72][i], 0.20, 0.07), at)
    place(M_, bass(A1, 1.8, 0.12), 24.3)
    place(M_, bell(88, 0.9, 0.06), 26.36)
    place(M_, bell(93, 0.6, 0.035), 26.42)

    place(M_, kick(0.5), 27.98)
    place(M_, snare(88, 0.16), 28.08)
    place(M_, bass(D2, 1.2, 0.22), 27.9)
    place(M_, gong(40, 0.9, 0.18), 28.50)
    place(M_, bell(74, 0.7, 0.06), 28.56)

    # ---------------- 29.4–34.6 羞辱
    place(M_, bass(26, 5.0, 0.14), 29.4)
    place(M_, bass(D2, 3.0, 0.16), 31.0)
    for i, at in enumerate([29.7, 30.1, 30.5, 30.9, 31.3, 31.7]):
        place(M_, pluck([57, 56, 55, 53, 52, 50][i], 0.22, 0.062), at)
    place(M_, paper(0.5, 0.05, 81), 31.14)
    place(M_, thud(0.5, 0.34, 82), 33.62)
    place(M_, kick(0.36), 33.62)
    place(M_, metal(74, 0.5, 0.04), 33.66)

    # ---------------- 34.6–37.06 反叛
    place(M_, bass(D2, 2.4, 0.24), 34.66)
    place(M_, metal(81, 0.6, 0.05), 34.66)
    place(M_, fire(2.2, 84, 0.07), 34.8)
    for i in range(10):
        place(M_, kick(0.4), 34.7 + i * 0.22)
        place(M_, snare(50 + i, 0.12), 34.82 + i * 0.22)
    for i, at in enumerate([34.9, 35.3, 35.7, 36.1]):
        place(M_, pluck([50, 53, 56, 62][i], 0.24, 0.09, 0.35), at)
    place(M_, paper(0.35, 0.05, 86), 35.9)

    # ---------------- 37.06–39.9 惨败
    place(M_, thud(0.7, 0.34, 88), 37.06)
    place(M_, metal(78, 0.8, 0.05), 37.06)
    place(M_, fire(2.4, 90, 0.1), 37.1)
    for i in range(14):
        place(M_, kick(0.42), 37.1 + i * 0.17)
        if i % 2:
            place(M_, snare(70 + i, 0.15), 37.16 + i * 0.17)
    for i, at in enumerate([37.2, 37.45, 37.7, 37.95, 38.2]):
        place(M_, pluck([62, 57, 53, 50, 46][i], 0.24, 0.10, 0.4), at)
    place(M_, paper(0.45, 0.06, 92), 37.6)
    place(M_, thud(0.4, 0.26, 93), 37.62)

    # ---------------- 39.9–43.96 典韦
    place(M_, bass(D2, 4.0, 0.2), 39.9)
    for i, at in enumerate([40.0, 40.5, 41.0, 41.5, 42.0, 42.5]):
        place(M_, pluck([50, 53, 57, 60, 62, 65][i], 0.26, 0.085, 0.3), at)
    for i in range(9):
        place(M_, kick(0.42), 40.0 + i * 0.44)
        place(M_, snare(30 + i, 0.13), 40.22 + i * 0.44)
        place(M_, hat(40 + i, 0.04), 40.33 + i * 0.44)
    for i in range(6):
        place(M_, whoosh(0.22, 0.10, 100 + i, 800, 5000), 40.3 + i * 0.42)
        place(M_, metal(90 + (i % 3) * 3, 0.4, 0.04), 40.5 + i * 0.42)

    # ---------------- 43.96–46.66 典韦之死
    place(M_, gong(36, 2.6, 0.3), 43.96)
    place(M_, bass(26, 2.6, 0.15), 43.96)
    for i, at in enumerate([44.6, 45.3, 45.9]):
        place(M_, bell([62, 60, 57][i], 1.0, 0.055), at)
    place(M_, whoosh(1.2, 0.05, 105, 200, 900), 44.2)

    # ---------------- 46.66–50.9 让马
    place(M_, bass(A1, 1.4, 0.12), 46.66)
    for i, at in enumerate([46.7, 47.1, 47.5, 47.9, 48.3, 48.7, 49.1]):
        place(M_, bell([62, 65, 69, 72, 69, 65, 62][i], 0.9, 0.05), at)
    for i in range(6):
        place(M_, kick(0.2), 46.8 + i * 0.7)
    place(M_, metal(86, 0.6, 0.04), 46.7)
    place(M_, thud(0.4, 0.2, 108), 49.24)

    # ---------------- 50.9–55.16 曹昂之死
    place(M_, bass(D2, 3.0, 0.18), 50.9)
    for i in range(11):
        place(M_, kick(0.22 + i * 0.012), 50.9 + i * 0.27)
        place(M_, snare(110 + i, 0.05 + i * 0.006), 51.03 + i * 0.27)
    for i, at in enumerate([51.4, 51.9, 52.4, 52.9, 53.4]):
        place(M_, whoosh(0.25, 0.07, 120 + i, 1200, 6000), at)
    for i, at in enumerate([51.2, 52.0, 52.8]):
        place(M_, pluck([57, 56, 55][i], 0.3, 0.07, 0.4), at)
    place(M_, gong(33, 2.8, 0.32), 53.9)
    place(M_, thud(0.8, 0.3, 130), 53.9)
    for i, at in enumerate([54.5, 54.9]):
        place(M_, bell([50, 45][i], 1.2, 0.05), at)

    # ---------------- 55.16–58.16 逃亡
    place(M_, rain(3.0, 0.055, 131), 55.16)
    place(M_, bass(26, 2.6, 0.12), 55.2)
    place(M_, bell(57, 1.1, 0.05), 56.2)
    place(M_, bell(53, 1.2, 0.045), 57.3)
    for i in range(4):
        place(M_, kick(0.12), 55.5 + i * 0.75)

    # ---------------- 58.16–61.56 继承人
    place(M_, bass(D2, 3.0, 0.14), 58.16)
    for i, at in enumerate([58.3, 58.9, 59.5, 60.1]):
        place(M_, bell([62, 65, 69, 62][i], 1.0, 0.05), at)
    place(M_, paper(0.6, 0.06, 133), 60.2)
    place(M_, thud(0.3, 0.2, 134), 60.22)

    # ---------------- 61.56–66.66 丁夫人
    place(M_, bass(A2, 1.2, 0.12), 61.56)
    for i, at in enumerate([61.7, 62.2, 62.7, 63.2, 63.7, 64.2, 64.7]):
        place(M_, pluck([62, 64, 65, 67, 65, 64, 62][i], 0.22, 0.06), at)
    for i in range(10):
        place(M_, tick(1200, 0.02, 0.03, 140 + i), 61.7 + i * 0.5)
    place(M_, bass(38, 1.2, 0.12), 63.7)
    place(M_, bell(74, 0.8, 0.045), 65.22)
    place(M_, bell(69, 0.7, 0.04), 65.35)

    # ---------------- 66.66–70.86 带兵
    place(M_, bass(D2, 3.6, 0.18), 66.66)
    for i in range(14):
        place(M_, kick(0.28), 66.66 + i * 0.3)
        if i % 2 == 0:
            place(M_, snare(150 + i, 0.08), 66.78 + i * 0.3)
    for i, at in enumerate([66.8, 67.3, 67.8, 68.3, 68.8, 69.3]):
        place(M_, pluck([50, 53, 57, 60, 57, 53][i], 0.24, 0.075, 0.3), at)
    place(M_, whoosh(0.8, 0.07, 160, 300, 1800), 68.26)
    place(M_, bell(69, 0.9, 0.05), 69.36)

    # ---------------- 70.86–73.76 年龄
    for i, at in enumerate([70.9, 71.4, 71.9, 72.4, 72.9]):
        place(M_, pluck(38 if i % 2 == 0 else 57, 0.3, 0.08, 0.4), at)
        place(M_, pluck(62 if i % 2 == 0 else 74, 0.22, 0.05), at + 0.22)
    place(M_, bass(D2, 2.4, 0.12), 70.86)
    place(M_, bell(86, 1.0, 0.04), 73.0)

    # ---------------- 73.76–79.16 人缘
    place(M_, bass(D2, 1.6, 0.15), 73.76)
    place(M_, bass(A1, 1.6, 0.13), 75.36)
    place(M_, bass(G2, 1.6, 0.13), 76.96)
    place(M_, bass(A1, 0.9, 0.12), 78.56)
    for i, at in enumerate([74.1, 74.6, 75.1, 75.6, 76.1, 76.6, 77.1, 77.6, 78.1]):
        place(M_, pluck([62, 64, 65, 67, 69, 67, 65, 64, 62][i], 0.20, 0.055), at)
    for i, at in enumerate([75.56, 76.3, 77.0, 77.44, 78.0, 78.3]):
        place(M_, bell(76 + i * 2, 0.5, 0.035), at)

    # ---------------- 79.16–82.46 深夜
    place(M_, bass(26, 3.2, 0.12), 79.16)
    place(M_, whoosh(1.4, 0.05, 170, 150, 700), 79.2)
    for i, at in enumerate([79.6, 80.3, 81.0, 81.7]):
        place(M_, bell([62, 69, 65, 62][i], 1.1, 0.045), at)
    place(M_, paper(0.8, 0.05, 172), 80.88)
    place(M_, creak(0.9, 0.07, 173), 81.9)

    # ---------------- 82.46–84.96 闹
    for i, at in enumerate([82.46, 82.86, 83.26]):
        place(M_, kick(0.3), at)
        place(M_, snare(180 + i, 0.1), at + 0.12)
    place(M_, bass(38, 2.4, 0.2), 82.46)
    for i, at in enumerate([82.6, 83.0, 83.4]):
        place(M_, pluck([61, 62, 61][i], 0.3, 0.07, 0.5), at)
        place(M_, pluck([73, 74, 73][i], 0.3, 0.05, 0.5), at)
    place(M_, glass(185, 0.16), 84.06)
    place(M_, thud(0.4, 0.26, 186), 84.06)

    # ---------------- 84.96–89.86 求
    place(M_, bass(26, 5.0, 0.10), 84.96)
    for i in range(9):
        place(M_, tick(900, 0.02, 0.025, 190 + i), 85.2 + i * 0.5)
    for i, at in enumerate([85.0, 85.8, 86.6, 87.4, 88.2]):
        place(M_, pluck([57, 60, 57, 55, 53][i], 0.24, 0.055), at)
    place(M_, creak(1.0, 0.06, 195), 84.9)
    place(M_, bell(69, 1.0, 0.045), 89.78)

    # ---------------- 89.86–96.06 永别
    place(M_, bass(D2, 6.2, 0.10), 89.86)
    place(M_, bell(62, 1.4, 0.04), 90.6)
    place(M_, tick(1400, 0.03, 0.02, 200), 92.2)
    place(M_, tick(1200, 0.03, 0.02, 201), 93.6)
    place(M_, snap(0.16, 202), 94.88)
    place(M_, thud(0.6, 0.24, 203), 94.88)
    place(M_, paper(0.5, 0.05, 204), 95.1)
    place(M_, thud(0.3, 0.18, 205), 95.12)

    # ---------------- 96.06–102.66 念叨
    place(M_, bass(26, 3.2, 0.11), 96.06)
    place(M_, bass(D2, 3.2, 0.12), 99.2)
    for i, at in enumerate([96.3, 97.0, 97.7, 98.4, 99.1, 99.8, 100.5, 101.2]):
        place(M_, bell([62, 60, 57, 55, 57, 60, 62, 57][i], 1.0, 0.05), at)
    place(M_, whoosh(1.2, 0.04, 210, 150, 800), 99.14)
    place(M_, whoosh(1.2, 0.04, 211, 150, 800), 101.06)
    place(M_, paper(0.6, 0.04, 212), 101.9)

    # ---------------- 102.66–107.56 代价
    place(M_, gong(36, 2.4, 0.3), 102.66)
    place(M_, bass(26, 4.8, 0.14), 102.66)
    n = int(3.0 * SR); x = np.arange(n) / SR
    place(M_, np.sin(2 * np.pi * (70 + 6 * np.sin(2 * np.pi * 0.55 * x)) * x) * 0.05, 103.0)
    place(M_, thud(0.8, 0.34, 220), 104.68)
    place(M_, metal(60, 0.9, 0.06), 104.7)
    place(M_, bell(45, 1.6, 0.05), 105.0)

    # ---------------- 107.56–112.1 推演
    place(M_, bass(A1, 4.4, 0.12), 107.56)
    for i in range(11):
        place(M_, tick(1000, 0.025, 0.028, 230 + i), 107.6 + i * 0.4)
    for i, at in enumerate([107.9, 108.6, 109.3, 110.0, 110.7, 111.4]):
        place(M_, pluck([50, 53, 57, 60, 62, 65][i], 0.3, 0.065, 0.4), at)
        place(M_, metal(80 + i * 3, 0.3, 0.025), at + 0.05)
    place(M_, paper(0.4, 0.05, 240), 107.94)
    place(M_, thud(0.3, 0.16, 241), 108.0)
    place(M_, glass(242, 0.05), 110.92)

    # ---------------- 112.1–115.2 二选一
    place(M_, bass(D2, 3.0, 0.14), 112.1)
    for i, at in enumerate([112.3, 112.7, 113.1, 113.5, 113.9]):
        if i % 2 == 0:
            place(M_, pluck(50, 0.3, 0.08, 0.35), at)
            place(M_, pluck(69, 0.3, 0.06), at + 0.18)
        else:
            place(M_, pluck(74, 0.3, 0.06), at)
            place(M_, pluck(57, 0.3, 0.06, 0.35), at + 0.18)
    place(M_, thud(0.4, 0.22, 250), 115.0)
    place(M_, paper(0.4, 0.04, 251), 115.02)

    # ---------------- 115.2–118.2 禅让
    place(M_, bass(D2, 1.6, 0.16), 115.22)
    place(M_, bass(A2, 1.4, 0.14), 116.44)
    for i, at in enumerate([115.3, 115.9, 116.5, 117.1, 117.7]):
        place(M_, bell([69, 72, 76, 79, 72][i], 0.9, 0.05), at)
    place(M_, whoosh(0.8, 0.08, 260, 500, 3000), 115.26)
    for i, at in enumerate([116.44, 116.9]):
        place(M_, kick(0.2), at)
        place(M_, metal(84 + i, 0.5, 0.04), at)

    # ---------------- 118.2–122.9 托孤
    place(M_, bass(D2, 2.4, 0.14), 118.2)
    place(M_, bass(26, 2.4, 0.12), 118.2)
    place(M_, paper(0.9, 0.06, 270), 118.26)
    for i, at in enumerate([118.8, 119.4, 120.0, 120.6, 121.2]):
        place(M_, bell([62, 65, 62, 57, 55][i], 1.0, 0.045), at)
    place(M_, metal(92, 0.4, 0.05), 120.06)
    place(M_, pluck(45, 0.4, 0.07, 0.5), 120.1)
    place(M_, whoosh(0.6, 0.05, 272, 200, 1200), 121.46)

    # ---------------- 122.9–127.56 装病
    place(M_, bass(26, 4.6, 0.11), 122.9)
    place(M_, bass(38, 4.6, 0.10), 122.9)
    for i in range(10):
        place(M_, tick(800 + i * 60, 0.03, 0.03, 280 + i), 124.88 + i * 0.12)
    place(M_, bell(86, 0.8, 0.04), 126.04)
    place(M_, bell(81, 0.7, 0.03), 126.2)
    place(M_, creak(0.8, 0.04, 281), 125.2)

    # ---------------- 127.56–134.54 高平陵
    place(M_, bass(A2, 1.8, 0.14), 127.56)
    for i, at in enumerate([127.7, 128.2, 128.7, 129.2, 129.7, 130.2]):
        place(M_, pluck([57, 62, 65, 62, 57, 62][i], 0.24, 0.06), at)
    for i in range(8):
        place(M_, kick(0.18), 129.4 + i * 0.34)
    place(M_, gong(41, 2.0, 0.26), 130.74)
    place(M_, whoosh(1.0, 0.06, 290, 200, 1000), 131.78)
    place(M_, metal(74, 0.7, 0.05), 131.8)
    place(M_, bass(D2, 1.6, 0.18), 131.78)
    for i in range(7):
        place(M_, kick(0.3), 132.5 + i * 0.24)
        place(M_, hat(300 + i, 0.04), 132.6 + i * 0.24)
    for i, at in enumerate([132.9, 133.2, 133.5]):
        place(M_, pluck([50, 53, 57][i], 0.3, 0.09, 0.35), at)
    place(M_, whoosh(0.7, 0.06, 310, 300, 2000), 133.8)

    # ---------------- 134.54–140.34 一步一步
    place(M_, bass(D2, 5.8, 0.15), 134.54)
    n = int(1.2 * SR); x = np.arange(n) / SR
    place(M_, np.sin(2 * np.pi * (50 + 90 * x / 1.2) * x) * 0.06 * (1 - x / 1.2), 134.6)
    for i, at in enumerate([134.9, 135.3, 136.34, 137.04, 137.74]):
        place(M_, bell([62, 65, 69, 72, 76][i], 0.8, 0.05), at)
        place(M_, pluck([50, 52, 53, 55, 57][i], 0.3, 0.07, 0.35), at + 0.05)
    for i in range(6):
        place(M_, kick(0.22), 136.4 + i * 0.6)
    for i in range(9):
        place(M_, tick(1100 + i * 40, 0.02, 0.02, 320 + i), 138.48 + i * 0.1)
    place(M_, gong(45, 2.2, 0.28), 139.58)
    place(M_, bell(81, 1.4, 0.06), 139.62)

    # ---------------- 140.34–144.2 起点
    place(M_, bass(D2, 1.8, 0.13), 140.34)
    for i, at in enumerate([140.5, 140.9, 141.3, 141.7]):
        place(M_, pluck([57, 62, 60, 57][i], 0.26, 0.06), at)
    place(M_, bell(69, 1.0, 0.05), 141.96)
    place(M_, bell(74, 1.0, 0.045), 142.82)
    place(M_, whoosh(0.6, 0.05, 330, 200, 1400), 142.0)

    # ---------------- 144.2–151.7 如果
    place(M_, bass(26, 3.0, 0.10), 144.2)
    place(M_, bass(A1, 3.4, 0.10), 147.4)
    for i, at in enumerate([144.4, 144.9, 145.4, 145.9, 146.4, 146.9, 147.4, 147.9, 148.4, 148.9]):
        place(M_, bell([74, 77, 81, 84, 81, 77, 74, 72, 74, 77][i], 0.9, 0.04), at)
    place(M_, paper(0.3, 0.05, 340), 145.02)
    place(M_, thud(0.3, 0.16, 341), 145.04)
    place(M_, paper(0.3, 0.05, 342), 146.14)
    place(M_, thud(0.3, 0.14, 343), 146.16)
    place(M_, paper(0.3, 0.05, 344), 146.6)
    place(M_, thud(0.3, 0.14, 345), 146.62)
    n = int(1.8 * SR); x = np.arange(n) / SR
    place(M_, np.sin(2 * np.pi * (420 + 30 * np.sin(2 * np.pi * 1.3 * x)) * x) * 0.03, 149.86)

    # ---------------- 151.7–155.14 没有如果
    place(M_, whoosh(0.8, 0.09, 350, 300, 3000), 151.76)
    place(M_, bass(D2, 2.0, 0.14), 151.7)
    place(M_, thud(0.6, 0.3, 351), 153.34)
    place(M_, paper(0.5, 0.06, 352), 153.36)
    place(M_, bell(57, 1.2, 0.05), 153.4)
    place(M_, tick(1300, 0.03, 0.03, 353), 154.34)

    # ---------------- 155.14–160.6 关系
    for i in range(10):
        place(M_, kick(0.22), 155.3 + i * 0.53)
        place(M_, hat(360 + i, 0.035), 155.44 + i * 0.53)
    place(M_, bass(A2, 2.2, 0.13), 155.14)
    place(M_, bass(D3, 2.0, 0.11), 157.4)
    for i, at in enumerate([155.4, 155.9, 156.4, 156.9, 157.4, 157.9, 158.4, 158.9]):
        place(M_, pluck([57, 60, 64, 67, 64, 60, 64, 67][i], 0.2, 0.055), at)
    place(M_, blip(1250, 0.12), 156.98)
    place(M_, twang(57, 0.9, 0.08), 158.44)
    place(M_, twang(69, 1.4, 0.12), 159.74)
    place(M_, bell(81, 1.0, 0.05), 159.76)

    # ---------------- 160.6–171.2 第一
    place(M_, bass(D2, 2.4, 0.14), 160.6)
    for i, at in enumerate([160.8, 161.3, 161.8, 162.3, 162.8, 163.3, 163.8]):
        place(M_, pluck([50, 53, 57, 53, 50, 48, 50][i], 0.24, 0.06, 0.35), at)
    place(M_, metal(94, 0.5, 0.05), 162.12)
    place(M_, riser(0.9, 0.10, 380), 164.02)
    place(M_, kick(0.3), 164.3)
    # 三个视角
    for i, at in enumerate([165.56, 168.08, 169.66]):
        place(M_, kick(0.24), at)
        place(M_, bell([74, 57, 69][i], 1.2, 0.055), at + 0.05)
    place(M_, gong(38, 1.6, 0.18), 168.08)
    place(M_, pluck([57, 60, 64, 69][0], 0.3, 0.07), 169.66)
    for i, at in enumerate([169.8, 170.1, 170.4]):
        place(M_, pluck([62, 67, 72][i], 0.2, 0.05), at)

    # ---------------- 171.2–177.42 第二
    for i in range(12):
        place(M_, kick(0.16), 171.4 + i * 0.5)
        place(M_, hat(400 + i, 0.025), 171.52 + i * 0.5)
    place(M_, bass(D2, 2.6, 0.12), 171.2)
    place(M_, bass(A1, 3.4, 0.11), 173.8)
    for i, at in enumerate([171.5, 172.0, 172.5, 172.66, 173.1, 173.6]):
        place(M_, pluck([57, 60, 62, 65, 62, 57][i], 0.22, 0.05), at)
    place(M_, whoosh(0.7, 0.06, 420, 300, 1600), 174.36)
    place(M_, coin(0.09), 175.0)
    place(M_, bell(69, 1.2, 0.06), 175.48)
    place(M_, bass(A2, 1.6, 0.10), 175.6)

    # ---------------- 177.42–183.78 第三
    place(M_, bass(D2, 2.0, 0.14), 177.42)
    place(M_, bass(A1, 2.4, 0.12), 179.4)
    for i in range(12):
        place(M_, tick(700 + i * 55, 0.04, 0.05, 440 + i), 179.22 + i * 0.13)
        place(M_, metal(70 + i * 2, 0.22, 0.018), 179.24 + i * 0.13)
    for i in range(5):
        place(M_, kick(0.2), 179.4 + i * 0.8)
    place(M_, bell(76, 1.4, 0.07), 181.62)
    place(M_, twang(57, 1.2, 0.08), 181.62)
    place(M_, bell(69, 1.6, 0.07), 182.9)
    place(M_, metal(88, 0.6, 0.03), 182.92)

    # ---------------- 183.78–187 结尾
    place(M_, bass(D2, 1.4, 0.14), 183.78)
    for i, at in enumerate([183.9, 184.2, 184.5, 184.8, 185.1]):
        place(M_, pluck([62, 57, 62, 69, 62][i], 0.22, 0.06), at)
    place(M_, bell(74, 1.4, 0.06), 184.7)
    place(M_, pluck(81, 0.4, 0.05), 185.96)
    place(M_, pluck(76, 0.4, 0.05), 186.1)
    place(M_, gong(45, 1.6, 0.10), 186.2)
    place(M_, bell(69, 1.2, 0.04), 186.3)
    return M_

def build_sfx():
    S = np.zeros(N)

    # ---------------- 0–29.4 样片 SFX（与已交付样片一致）
    place(S, lowpass_fast(noise(0.22, 120), 1800) * np.exp(-np.arange(int(0.22 * SR)) / SR * 17) * 0.12, H['lantern'])
    place(S, bell(86, 0.4, 0.03), H['lantern'] + 0.02)
    n = int(0.30 * SR); x = np.arange(n) / SR
    place(S, np.sin(2 * np.pi * (520 + 260 * x / 0.30) * x) * np.exp(-x * 8) * 0.08, H['thread'])
    place(S, paper(0.18, 0.10, 272), H['stamp'])
    place(S, kick(0.22), H['stamp'] + 0.04)
    place(S, lowpass_fast(noise(0.28, 411), 650) * np.exp(-np.arange(int(0.28 * SR)) / SR * 13) * 0.14, H['turn'])
    place(S, bell(88, 0.7, 0.07), H['mark'])
    place(S, thud(0.6, 0.35, 412), H['battle'])
    for i in range(10):
        place(S, kick(0.10), 8.05 + i * 0.11)
    place(S, fire(1.6, 77, 0.10), 8.0)
    n = int(0.4 * SR); x = np.arange(n) / SR
    place(S, highpass_fast(noise(0.4, 902), 1200) * (x / 0.4) ** 2 * 0.12, H['sweep'] - 0.3)
    place(S, whoosh(1.4, 0.10, 55, 200, 1200), 10.55)
    place(S, bell(79, 1.0, 0.06), H['city'])
    place(S, metal(86, 0.6, 0.03), H['city'] + 0.05)
    place(S, thud(0.9, 0.42, 197), H['year'])
    place(S, paper(0.5, 0.05, 198), H['year'] + 0.02)
    place(S, metal(96, 0.7, 0.06), H['general'])
    place(S, bell(84, 0.8, 0.05), H['uncle'])
    place(S, gong(38, 1.8, 0.22), H['death'])
    place(S, metal(93, 0.7, 0.05), H['handover'])
    place(S, whoosh(0.9, 0.07, 320, 300, 1600), H['surrender'])
    place(S, bell(81, 0.8, 0.04), H['surrender'] + 0.1)
    place(S, paper(0.7, 0.07, 330), H['deal'])
    place(S, thud(0.26, 0.16, 331), H['deal'] + 0.45)
    place(S, bell(90, 0.6, 0.04), H['see'])
    place(S, bell(85, 0.7, 0.05), H['zou'])
    n = int(0.35 * SR); x = np.arange(n) / SR
    place(S, lowpass_fast(noise(0.35, 777), 1400) * (0.5 + 0.5 * np.sin(2 * np.pi * 8 * x)) * np.exp(-x * 6) * 0.06, H['take'])
    place(S, thud(0.3, 0.30, 778), H['nazhao'])
    place(S, kick(0.3), H['nazhao'] + 0.02)

    # ---------------- 30 s 之后
    place(S, whoosh(0.6, 0.06, 500, 200, 1200), H['shame'] - 0.1)
    place(S, paper(0.45, 0.05, 501), 31.14)
    place(S, thud(0.35, 0.3, 502), 33.62)
    place(S, metal(74, 0.4, 0.04), H['revolt'])
    place(S, whoosh(1.0, 0.09, 503, 400, 2500), H['revolt'])
    place(S, thud(0.6, 0.3, 504), H['lose'])
    place(S, fire(1.4, 505, 0.08), H['lose'])
    place(S, metal(96, 0.8, 0.07), H['dianwei'])
    for i in range(6):
        place(S, whoosh(0.24, 0.08, 510 + i, 900, 6000), 40.3 + i * 0.42)
        place(S, metal(88 + i, 0.5, 0.04), 40.5 + i * 0.42)
    place(S, gong(34, 2.6, 0.30), H['dianweifall'])
    place(S, thud(0.9, 0.35, 520), H['dianweifall'])
    place(S, bell(74, 1.0, 0.05), H['angmount'])
    place(S, metal(86, 0.6, 0.04), H['angmount'] + 0.02)
    for i in range(5):
        place(S, whoosh(0.22, 0.07, 530 + i, 1200, 6000), 52.4 + i * 0.3)
    place(S, gong(31, 2.8, 0.34), H['angfall'])
    place(S, thud(1.0, 0.34, 540), H['angfall'])
    place(S, rain(3.2, 0.05, 541), H['escape'])
    place(S, bell(57, 1.2, 0.05), H['escape'] + 1.0)
    place(S, bell(69, 1.0, 0.05), H['heir'])
    place(S, paper(0.4, 0.04, 550), 60.2)
    place(S, thud(0.3, 0.2, 551), 60.24)
    place(S, tick(1200, 0.03, 0.04, 552), H['ding'])
    place(S, bell(74, 0.9, 0.05), H['ding'] + 0.2)
    for i in range(10):
        place(S, kick(0.12), 66.8 + i * 0.4)
    place(S, bell(69, 0.8, 0.05), H['trains'])
    place(S, bell(62, 0.8, 0.04), H['ages'])
    place(S, bell(74, 0.8, 0.04), H['ages'] + 0.25)
    place(S, whoosh(1.0, 0.05, 560, 150, 700), H['lost'])
    place(S, glass(561, 0.12), H['fury'])
    place(S, thud(0.4, 0.2, 562), H['fury'])
    place(S, creak(0.9, 0.08, 563), H['beg'])
    place(S, thud(0.4, 0.24, 564), H['begfinal'])
    place(S, snap(0.14, 565), 94.88)
    place(S, bell(57, 1.4, 0.05), H['regret'])
    place(S, thud(0.8, 0.28, 566), H['price'])
    place(S, metal(60, 0.9, 0.05), 104.7)
    place(S, tick(900, 0.03, 0.04, 567), H['chain'])
    place(S, blip(880, 0.07), H['choose'])
    place(S, blip(1320, 0.06), H['choose'] + 0.18)
    place(S, whoosh(0.8, 0.08, 570, 500, 3000), H['abdicate'])
    place(S, paper(0.8, 0.06, 571), H['tuogu'])
    place(S, metal(92, 0.4, 0.05), 120.06)
    place(S, bell(57, 1.0, 0.04), H['sima'])
    place(S, gong(41, 2.0, 0.26), H['gaoping'])
    place(S, metal(74, 0.7, 0.05), H['gaoping'] + 0.1)
    place(S, thud(0.6, 0.28, 580), H['coup'])
    place(S, whoosh(0.8, 0.06, 581, 500, 2500), H['coup'])
    place(S, whoosh(1.0, 0.07, 582, 300, 2000), H['chainpoint'])
    place(S, whoosh(1.0, 0.06, 583, 500, 4000), H['whatif'])
    place(S, whoosh(0.8, 0.09, 584, 300, 3000), H['noif'])
    place(S, blip(1250, 0.10), H['relate'])
    place(S, bell(69, 0.9, 0.05), H['p1'])
    place(S, coin(0.12), H['p2'])
    place(S, tick(760, 0.05, 0.05, 590), H['p3'])
    place(S, gong(45, 1.6, 0.12), H['ending'])
    place(S, bell(74, 1.0, 0.05), H['ending'] + 0.1)
    place(S, bell(81, 0.8, 0.04), 185.96)
    place(S, metal(88, 0.5, 0.03), 185.98)

    # 字幕打字声（轻）
    for s in CUE['subs']:
        for k in range(len(s['text'])):
            at = s['t0'] + k * 0.026
            if at > DUR - 0.05:
                break
            n = int(0.02 * SR); x = np.arange(n) / SR
            place(S, highpass_fast(noise(0.02, 300 + k), 2600) * np.exp(-x * 140) * 0.035, at)
    return S

def load_voice():
    with wave.open(VOICE, 'rb') as w:
        sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
        raw = w.readframes(w.getnframes())
    if sw != 2:
        raise SystemExit('旁白必须是 16-bit PCM wav：%s' % VOICE)
    x = np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768.0
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    want = int(DUR * sr)
    x = x[:want]
    idx = np.arange(N) * (sr / SR)
    y = np.interp(idx, np.arange(len(x)), x).astype(np.float32)
    if len(y) < N:
        y = np.pad(y, (0, N - len(y)))
    y = highpass_fast(y, 70)
    fade = int(0.04 * SR)
    y[-fade:] *= np.linspace(1, 0, fade)
    y[:fade] *= np.linspace(0, 1, fade)
    return y

def write_wav(path, x):
    x = np.clip(x, -1, 1)
    stereo = np.stack([x, x], axis=1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((stereo * 32767).astype('<i2').tobytes())

if __name__ == '__main__':
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    music = build_music() * 0.8
    sfx = build_sfx()
    bed = music + sfx
    peak = np.max(np.abs(bed)) or 1
    bed = bed / peak * 0.62
    # 结尾 1.2 s 淡出
    nf = int(1.2 * SR)
    bed[-nf:] *= np.linspace(1, 0, nf)
    write_wav(os.path.join(HERE, 'out', 'music.wav'), bed)

    voice = load_voice()
    vp = np.max(np.abs(voice)) or 1
    voice = voice / vp * 0.86
    mix = voice * 1.0 + bed * 0.12
    write_wav(os.path.join(HERE, 'out', 'mix_raw.wav'), mix)
    print('music.wav + mix_raw.wav written (%.1f s)' % DUR)
