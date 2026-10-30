"""audio.py — 曹操 30 s 样片：29.4 s chiptune 配乐 + hit 对齐 SFX + 旁白。

确定性（固定 seed）。产出 out/music.wav、out/mix_raw.wav；
两遍 loudnorm（-16 LUFS / -1.5 dBTP）在 make_audio.sh 里做。
"""
import json, os, wave
import numpy as np

SR = 48000
DUR = 29.4
N = int(SR * DUR)
HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.environ.get('XIANGSU_VOICE') or ''
if not VOICE:
    raise SystemExit('未设置 XIANGSU_VOICE（旁白 wav 路径，例 D:/@kaifa/yandi/output/020_曹操/配音.wav）')
if not os.path.exists(VOICE):
    raise SystemExit('旁白不存在：%s' % VOICE)

CUE = json.load(open(os.path.join(HERE, 'cues.json'), encoding='utf-8'))
H = CUE['hits']

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
    place_arr = np.zeros(n); place_arr[:len(hit)] += hit
    return (out + place_arr) * gain

def fire(dur, seed=41, gain=1.0):
    n = int(dur * SR); x = np.arange(n) / SR
    s = lowpass_fast(noise(dur, seed), 2600) * (0.5 + 0.5 * np.sin(2 * np.pi * 3.7 * x))
    return s * (0.6 + 0.4 * np.sin(2 * np.pi * 1.3 * x)) * gain

def paper(dur=0.4, gain=1.0, seed=61):
    n = int(dur * SR); x = np.arange(n) / SR
    return highpass_fast(noise(dur, seed), 1800) * np.exp(-x * 9) * gain

# ------------------------------------------------------------------ score
def build_music():
    M_ = np.zeros(N)
    D2, A1, A2, C3, D3, E3, F3, G2, G3 = 38, 33, 45, 48, 50, 52, 53, 43, 55

    # 0–1.5 灵堂：低频 drone + 稀疏钟
    place(M_, bass(D2, 1.7, 0.22), 0.0)
    for i, at in enumerate([0.18, 0.56, 1.02]):
        place(M_, bell([74, 69, 72][i], 0.75, 0.08), at)

    # 1.5–4.2 红线展开：上行拨弦 + 纸面脉冲
    for i, at in enumerate([1.62, 1.90, 2.18, 2.46, 2.74, 3.02, 3.30, 3.58]):
        place(M_, pluck([62, 65, 69, 72, 74, 77, 81, 84][i], 0.16, 0.075), at)
    place(M_, bass(A2, 0.9, 0.18), 2.44)
    place(M_, pluck(81, 0.22, 0.09), 2.46)

    # 4.2–7.8 拐弯：稳鼓 + 半音上行，到洞房转暖
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

    # 7.8–10.5 大战：双踩 + 铜管式方波 + 火焰噪声
    t1 = 7.8
    place(M_, bass(D2, 2.7, 0.22), t1)
    for i in range(13):
        place(M_, kick(0.44), t1 + i * 0.2)
        place(M_, snare(40 + i, 0.14), t1 + i * 0.2 + 0.1)
        place(M_, hat(60 + i, 0.05), t1 + i * 0.1)
    for i, at in enumerate([7.90, 8.20, 8.50, 8.80, 9.10]):
        place(M_, pluck([50, 53, 57, 50, 46][i], 0.24, 0.10, 0.35), at)
    place(M_, fire(2.5, 41, 0.06), t1)
    # 红绸横扫：噪声扫频
    n = int(0.55 * SR); x = np.arange(n) / SR
    sweep = highpass_fast(lowpass_fast(noise(0.55, 91), 2200), 500) * (x / 0.55) ** 1.5 * 0.16
    place(M_, sweep, 9.15)

    # 10.5–13.6 宛城：留白、风声、城门铃
    place(M_, bass(D2, 2.9, 0.14), 10.5)
    for i, at in enumerate([10.66, 11.20, 11.74, 12.28]):
        place(M_, bell([69, 72, 76, 69][i], 0.8, 0.06), at)
    place(M_, bell(81, 1.1, 0.09), 12.52)

    # 13.6–15.2 公元 197：石碑落定
    place(M_, bass(D2, 1.6, 0.18), 13.6)
    place(M_, gong(42, 1.6, 0.24), 13.66)
    place(M_, bell(86, 0.9, 0.05), 13.78)

    # 15.2–18.5 张绣：武将动机
    place(M_, bass(A1, 3.2, 0.12), 15.2)
    for i, at in enumerate([15.32, 15.72, 16.12, 16.52, 16.92, 17.32, 17.72, 18.12]):
        place(M_, pluck([57, 60, 64, 69, 64, 60, 57, 60][i], 0.18, 0.065), at)
    place(M_, metal(84, 0.9, 0.07), 15.26)
    place(M_, bell(76, 0.8, 0.07), 16.72)

    # 18.5–20.6 张济之死：丧钟与兵权
    place(M_, gong(38, 2.0, 0.26), 18.56)
    place(M_, bass(D2, 2.0, 0.10), 18.5)
    place(M_, bell(81, 1.0, 0.07), 19.24)
    place(M_, metal(91, 0.8, 0.05), 19.24)

    # 20.6–24.3 兵不血刃：破晓、安静，收编契约
    for i, at in enumerate([20.66, 21.14, 21.62, 22.10]):
        place(M_, bell([76, 79, 81, 84][i], 0.9, 0.055), at)
    place(M_, bass(A2, 1.6, 0.14), 20.6)
    place(M_, bass(A2, 1.4, 0.12), 22.6)
    place(M_, paper(0.5, 0.06, 63), 22.68)
    place(M_, thud(0.3, 0.20, 65), 23.11)

    # 24.3–27.9 看上邹氏：半音暧昧
    for i, at in enumerate([24.42, 24.82, 25.22, 25.62, 26.02, 26.42, 26.82, 27.22, 27.62]):
        place(M_, pluck([69, 70, 72, 73, 76, 77, 76, 73, 72][i], 0.20, 0.07), at)
    place(M_, bass(A1, 1.8, 0.12), 24.3)
    place(M_, bell(88, 0.9, 0.06), 26.36)
    place(M_, bell(93, 0.6, 0.035), 26.42)

    # 27.9–29.4 纳：重鼓 + 朱印 + 收束
    place(M_, kick(0.5), 27.98)
    place(M_, snare(88, 0.16), 28.08)
    place(M_, bass(D2, 1.2, 0.22), 27.9)
    place(M_, gong(40, 0.9, 0.18), 28.50)
    place(M_, bell(74, 0.7, 0.06), 28.56)
    return M_

def build_sfx():
    S = np.zeros(N)
    # 烛芯
    place(S, lowpass_fast(noise(0.22, 120), 1800) * np.exp(-np.arange(int(0.22 * SR)) / SR * 17) * 0.12, H['lantern'])
    place(S, bell(86, 0.4, 0.03), H['lantern'] + 0.02)
    # 红线
    n = int(0.30 * SR); x = np.arange(n) / SR
    place(S, np.sin(2 * np.pi * (520 + 260 * x / 0.30) * x) * np.exp(-x * 8) * 0.08, H['thread'])
    # 纸面朱印
    place(S, paper(0.18, 0.10, 272), H['stamp'])
    place(S, kick(0.22), H['stamp'] + 0.04)
    # 拐弯闷鼓
    place(S, lowpass_fast(noise(0.28, 411), 650) * np.exp(-np.arange(int(0.28 * SR)) / SR * 13) * 0.14, H['turn'])
    # 起点铜铃
    place(S, bell(88, 0.7, 0.07), H['mark'])
    # 大战：开场轰 + 马蹄
    place(S, thud(0.6, 0.35, 412), H['battle'])
    for i in range(10):
        place(S, kick(0.10), 8.05 + i * 0.11)
    place(S, fire(1.6, 77, 0.10), 8.0)
    # 红绸横扫：反向吸气
    n = int(0.4 * SR); x = np.arange(n) / SR
    place(S, highpass_fast(noise(0.4, 902), 1200) * (x / 0.4) ** 2 * 0.12, H['sweep'] - 0.3)
    # 宛城：风 + 城门铃
    place(S, whoosh(1.4, 0.10, 55, 200, 1200), 10.55)
    place(S, bell(79, 1.0, 0.06), H['city'])
    place(S, metal(86, 0.6, 0.03), H['city'] + 0.05)
    # 197：石落
    place(S, thud(0.9, 0.42, 197), H['year'])
    place(S, paper(0.5, 0.05, 198), H['year'] + 0.02)
    # 张绣：戟鸣
    place(S, metal(96, 0.7, 0.06), H['general'])
    # 叔侄：铃
    place(S, bell(84, 0.8, 0.05), H['uncle'])
    # 张济死：丧锣 + 兵符
    place(S, gong(38, 1.8, 0.22), H['death'])
    place(S, metal(93, 0.7, 0.05), H['handover'])
    # 投降：白旗与风声
    place(S, whoosh(0.9, 0.07, 320, 300, 1600), H['surrender'])
    place(S, bell(81, 0.8, 0.04), H['surrender'] + 0.1)
    # 契约：展纸 + 落印
    place(S, paper(0.7, 0.07, 330), H['deal'])
    place(S, thud(0.26, 0.16, 331), H['deal'] + 0.45)
    # 看上：目光铃
    place(S, bell(90, 0.6, 0.04), H['see'])
    place(S, bell(85, 0.7, 0.05), H['zou'])
    # 纳：绸缎 + 朱印
    n = int(0.35 * SR); x = np.arange(n) / SR
    silk = lowpass_fast(noise(0.35, 777), 1400) * (0.5 + 0.5 * np.sin(2 * np.pi * 8 * x)) * np.exp(-x * 6) * 0.06
    place(S, silk, H['take'])
    place(S, thud(0.3, 0.30, 778), H['nazhao'])
    place(S, kick(0.3), H['nazhao'] + 0.02)
    # 字幕打字声（很轻）
    for s in CUE['subs']:
        for k in range(len(s['text'])):
            at = s['t0'] + k * 0.024
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
    idx = np.arange(int(DUR * SR)) * (sr / SR)
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
    write_wav(os.path.join(HERE, 'out', 'music.wav'), bed)

    voice = load_voice()
    vp = np.max(np.abs(voice)) or 1
    voice = voice / vp * 0.86
    mix = voice * 1.0 + bed * 0.11
    write_wav(os.path.join(HERE, 'out', 'mix_raw.wav'), mix)
    print('music.wav + mix_raw.wav written (%.1f s)' % DUR)
