// 曹操 · 一个寡妇改写三国 — xiangsu 640×360, 10.000 s, 300 frames
// 640×360 indexed framebuffer -> ×3 nearest-neighbour -> CRT pass (scanlines + vignette + phosphor)
// 像素精度为 320×180 版的两倍：所有造型、抖动、描边都在这张 640×360 的原生栅格上逐像素决定。
// 静态元素（墓丘全景/标题/石壁/门框/机身/履带/文物本体）用单张像素图；
// 逐帧变性的元素（人群骚动/挖掘机臂组/棺盖开启）用 sprite 帧表或多档旋转帧。
// 打光仍然只沿色板 ramp 提亮既有像素，绝不盖半透明白色。

import * as S from './sprites.js';
import CUES from './cues.json' with { type: 'json' };

const W = 640, H = 360, FPS = 30;
const cues = CUES;
window.DEMO = { width: 1920, height: 1080, fps: FPS, duration: cues.duration };
const F = t => Math.round(t * FPS);

// ---------------------------------------------------------------- palette (32 cols)
const HEX = S.PAL;
const MP = HEX.map(h => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]);
const M = i => 64 + i;
const NSLOT = 128;
const SM = new Array(NSLOT);
for (let i = 0; i < NSLOT; i++) SM[i] = [0, 0, 0];
for (let i = 0; i < 32; i++) SM[64 + i] = [i, i, i];
const E = {}; let nS = 1;
const env = (n, a) => { E[n] = nS; SM[nS] = a; nS++; };
env('sky0', [1, 2, 24]); env('sky1', [2, 3, 25]); env('sky2', [3, 4, 31]); env('sky3', [4, 5, 9]);
env('moon', [28, 28, 16]); env('moonG', [4, 5, 29]);
env('cloudD', [2, 3, 25]); env('cloudL', [4, 5, 29]);
env('mtnF', [1, 2, 24]); env('mtnN', [2, 3, 31]);
env('treeD', [1, 2, 24]); env('treeN', [2, 21, 31]); env('treeL', [3, 22, 25]);
env('moundD', [9, 10, 9]); env('moundM', [11, 11, 11]); env('moundL', [12, 12, 13]); env('moundT', [14, 14, 15]);
env('water', [2, 20, 9]); env('waterL', [3, 21, 10]);
env('grassD', [1, 21, 9]); env('grassL', [3, 22, 11]);
env('fog', [4, 5, 29]);
env('stoneD', [31, 1, 9]); env('stoneM', [3, 26, 10]); env('stoneL', [5, 27, 12]);
env('goldD', [29, 29, 29]); env('goldM', [12, 29, 15]); env('goldL', [13, 15, 16]);
env('redD', [17, 17, 17]); env('redM', [18, 18, 18]); env('redH', [19, 19, 19]);
env('light', [7, 7, 16]); env('teal', [20, 22, 23]); env('ink', [0, 0, 0]);

const NEXT = new Uint8Array(NSLOT).fill(255);
const PALT = new Uint8Array(NSLOT).fill(255);
const ramp = (...a) => { for (let i = 0; i < a.length - 1; i++) NEXT[a[i]] = a[i + 1]; };
const pramp = (...a) => { for (let i = 0; i < a.length - 1; i++) PALT[64 + a[i]] = 64 + a[i + 1]; };
ramp(E.ink, E.sky0, E.sky1, E.sky2, E.sky3, E.moon);
ramp(E.treeD, E.treeN, E.treeL, E.grassL);
ramp(E.moundD, E.moundM, E.moundL, E.moundT, M(8));
ramp(E.water, E.waterL, E.sky2);
ramp(E.stoneD, E.stoneM, E.stoneL, M(28), M(8));
ramp(E.goldD, E.goldM, E.goldL, M(8));
ramp(E.redD, E.redM, E.redH, M(15));
ramp(E.grassD, E.treeD);
// 色板自身的 ramp —— 让 sprite 的纯色像素也能被灯光提亮
pramp(0, 1, 2, 3, 4, 5, 6, 7, 8);
pramp(9, 10, 11, 12, 13, 14);
pramp(17, 18, 19, 15, 16);
pramp(20, 21, 22, 23);
pramp(31, 25, 24, 3);
const nextIdx = c => (c < 64 ? NEXT[c] : PALT[c]);

// 30 s 样片：不自动换色阶，明暗交给每镜自己画
function stageOf(f) { return [0, 0, 0]; }
function nearest(r, g, b) {
  let bi = 0, bd = 1e18;
  for (let i = 0; i < 32; i++) { const p = MP[i]; const d = 0.3 * (p[0] - r) ** 2 + 0.59 * (p[1] - g) ** 2 + 0.11 * (p[2] - b) ** 2; if (d < bd) { bd = d; bi = i; } }
  return bi;
}
const mixIdx = (a, b, t) => { const A = MP[a], B = MP[b]; return t ? nearest(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t) : a; };
function makeLUT(f) {
  const [a, b, t] = stageOf(f);
  const lut = new Uint8Array(NSLOT);
  for (let s = 0; s < nS; s++) lut[s] = t ? mixIdx(SM[s][a], SM[s][b], t) : SM[s][a];
  for (let i = 0; i < 32; i++) lut[64 + i] = i;
  return lut;
}

// ---------------------------------------------------------------- buffer + primitives
const IB = new Uint8Array(W * H);
const JB = new Uint8Array(W * H);
let GX = 0, GY = 0;
const px = (x, y, c) => { x = (x | 0) + GX; y = (y | 0) + GY; if (x >= 0 && x < W && y >= 0 && y < H) IB[y * W + x] = c; };
const get = (x, y) => (x >= 0 && x < W && y >= 0 && y < H) ? IB[y * W + x] : 0;
const rect = (x, y, w, h, c) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) px(i, j, c); };
const hline = (x, y, w, c) => { for (let i = 0; i < w; i++) px(x + i, y, c); };
const vline = (x, y, h, c) => { for (let j = 0; j < h; j++) px(x, y + j, c); };
const BAY8 = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
const bay = (x, y) => (BAY8[((y & 7) << 3) + (x & 7)] + 0.5) / 64;
function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function rng(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const stepEase = (k, n) => Math.round(clamp(k, 0, 1) * n) / n;

function brighten(x, y, k = 1) {
  x = (x | 0) + GX; y = (y | 0) + GY;
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  let c = IB[y * W + x];
  for (let i = 0; i < k; i++) { const n = nextIdx(c); if (n === 255) return; c = n; }
  IB[y * W + x] = c;
}
function glowSpot(cx, cy, r, k, amt) {
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) {
    const d = Math.sqrt(i * i + j * j) / r;
    if (d > 1) continue;
    if ((bay(cx + i, cy + j) * 0.45 + hash(cx + i, cy + j) * 0.55) < (1 - d) * amt) brighten(cx + i, cy + j, k);
  }
}
function disc(cx, cy, r, c) {
  for (let j = -r; j <= r; j++) { const w = Math.floor(Math.sqrt(Math.max(0, r * r - j * j))); hline(cx - w, cy + j, w * 2 + 1, c); }
}
function ring(cx, cy, r, c, phase = 0) {
  const n = Math.max(8, Math.round(r * 6.283));
  for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + phase; px(cx + Math.round(Math.cos(a) * r), cy + Math.round(Math.sin(a) * r), c); }
}
function line(x0, y0, x1, y1, c) {
  x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let e = dx - dy;
  for (;;) { px(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 > -dy) { e -= dy; x0 += sx; } if (e2 < dx) { e += dx; y0 += sy; } }
}
function poly(pts, c) {
  let y0 = 1e9, y1 = -1e9;
  for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) { const xa = Math.ceil(xs[k]), xb = Math.floor(xs[k + 1]); if (xb >= xa) hline(xa, y, xb - xa + 1, c); }
  }
}
function polyD(pts, c, odd = 0) {
  let y0 = 1e9, y1 = -1e9;
  for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) if (((x + y) & 1) === odd) px(x, y, c);
  }
}
function lightPoly(pts, k, amt, lx, ly, lr) {
  let y0 = 1e9, y1 = -1e9;
  for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
    xs.sort((p, q) => p - q);
    for (let kk = 0; kk + 1 < xs.length; kk += 2)
      for (let x = Math.ceil(xs[kk]); x <= Math.floor(xs[kk + 1]); x++) {
        let f = 1;
        if (lr) { const d = Math.sqrt((x - lx) ** 2 + (y - ly) ** 2) / lr; f = clamp(1 - d, 0, 1); }
        if ((bay(x, y) * 0.45 + hash(x, y) * 0.55) < f * amt) brighten(x, y, k);
      }
  }
}
function polyLine(pts, c, closed = true) {
  const n = pts.length, m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) line(pts[i][0], pts[i][1], pts[(i + 1) % n][0], pts[(i + 1) % n][1], c);
}
const scalePoly = (pts, k, oy = 0) => { let cx = 0, cy = 0; for (const p of pts) { cx += p[0]; cy += p[1]; } cx /= pts.length; cy = cy / pts.length + oy; return pts.map(p => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]); };
function dithGrad(x0, y0, x1, y1, cA, cB) {
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0 - 1);
    for (let x = x0; x < x1; x++) px(x, y, bay(x + (y >> 1), y) < t ? cB : cA);
  }
}

// ---------------------------------------------------------------- sprite build
// 字符 → 帧缓冲值。纯色表 sprite 用 MAP_PAL；石材用 MAP_STONE（走 env 槽，随镜头分级变色且可被灯打亮）
const MAP_PAL = { '.': 0 };
for (const k of Object.keys(S.CHR)) if (S.CHR[k] >= 0) MAP_PAL[k] = 64 + S.CHR[k];
const MAP_MACH = Object.assign({}, MAP_PAL, { '1': M(2), '2': M(3), '3': M(4), '4': M(5), '5': M(6) });
const MAP_STONE = {
  '.': 0, k: E.ink, '1': E.stoneD, '2': E.stoneM, '3': E.stoneL, '4': M(28), '5': M(27),
  u: E.stoneL, w: M(28), s: M(27), S: M(26), b: E.stoneM, n: M(28),
  g: E.goldD, G: E.goldM, y: E.goldL, '6': E.goldL,
  m: E.stoneD, M: E.stoneM, L: E.stoneL, l: M(28), r: E.redD, R: E.redM, Q: E.redH, c: E.ink,
};
let sprN = 0;
function rimLight(s, k = 1) {           // 月光在右上：上边与右边一像素提亮
  const src = s.d.slice();
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    const i = y * s.w + x, c = src[i];
    if (!c) continue;
    const up = y === 0 ? 0 : src[i - s.w];
    const rt = x === s.w - 1 ? 0 : src[i + 1];
    if (!up || !rt) { let n = c; for (let q = 0; q < k; q++) { const t = nextIdx(n); if (t === 255) break; n = t; } s.d[i] = n; }
  }
  return s;
}
function buildSpr(name, rows, map = MAP_PAL, rim = 1) {
  const r = rows.map(x => x.replace(/\s+/g, ''));
  const w = Math.max(...r.map(x => x.length)), h = r.length;
  const d = new Uint8Array(w * h);
  const unk = new Set();
  let ragged = 0;
  r.forEach((row, y) => {
    if (row.length !== w) ragged++;
    for (let x = 0; x < row.length; x++) { const ch = row[x]; const c = map[ch]; if (c === undefined) { unk.add(ch); continue; } d[y * w + x] = c; }
  });
  if (ragged) console.warn(`[spr] ${name} 有 ${ragged}/${h} 行宽与 ${w} 不一致`);
  if (unk.size) console.warn(`[spr] ${name} 未知字符 ${[...unk].join('')}`);
  const s = { w, h, d, id: ++sprN, name };
  return rim ? rimLight(s, rim) : s;
}
function blit(s, x, y, k = 1, flip = false) {
  for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) {
    const c = s.d[j * s.w + (flip ? s.w - 1 - i : i)];
    if (!c) continue;
    if (k === 1) px(x + i, y + j, c);
    else for (let sy = 0; sy < k; sy++) for (let sx = 0; sx < k; sx++) px(x + i * k + sx, y + j * k + sy, c);
  }
}
function blitSil(s, x, y, k, col) {
  for (let j = 0; j < s.h; j++) for (let i = 0; i < s.w; i++) {
    if (!s.d[j * s.w + i]) continue;
    if (k === 1) px(x + i, y + j, col);
    else for (let sy = 0; sy < k; sy++) for (let sx = 0; sx < k; sx++) px(x + i * k + sx, y + j * k + sy, col);
  }
}
// 石材铺贴：按 24 px 分行错位，避免整片出现同一相位
function tile(s, x, y, w, h, oy = 0) {
  for (let j = 0; j < h; j++) {
    const sy = ((j + oy) % s.h), sh = (Math.floor((j + oy) / s.h) * 7) % s.w;
    for (let i = 0; i < w; i++) { const c = s.d[sy * s.w + ((i + sh) % s.w)]; if (c) px(x + i, y + j, c); }
  }
}
// 旋转帧：5° 一档，最近邻，结果缓存（臂组连续动作靠它，而非临时画线）
const ROTC = new Map();
function rotSpr(s, ang) {
  const q = Math.round(ang / (Math.PI / 36));
  const key = s.id + ':' + q;
  const hit = ROTC.get(key); if (hit) return hit;
  const a = q * Math.PI / 36, ca = Math.cos(a), sa = Math.sin(a);
  const w = Math.max(1, Math.ceil(Math.abs(s.w * ca) + Math.abs(s.h * sa)));
  const h = Math.max(1, Math.ceil(Math.abs(s.w * sa) + Math.abs(s.h * ca)));
  const d = new Uint8Array(w * h);
  const cx = w / 2, cy = h / 2, sx = s.w / 2, sy = s.h / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x + 0.5 - cx, v = y + 0.5 - cy;
    const sxi = Math.floor(u * ca + v * sa + sx), syi = Math.floor(-u * sa + v * ca + sy);
    if (sxi < 0 || sxi >= s.w || syi < 0 || syi >= s.h) continue;
    const c = s.d[syi * s.w + sxi]; if (c) d[y * w + x] = c;
  }
  const ox = cx + (-s.w / 2 * ca + s.h / 2 * sa);
  const oy = cy + (-s.w / 2 * sa - s.h / 2 * ca);
  const o = { w, h, d, ox, oy };
  ROTC.set(key, o);
  return o;
}
// 以源图 (ax,ay) 为锚点放置旋转帧
function blitRot(s, ang, wx, wy, ax = 0, ay = 0) {
  // 把源图 (ax,ay) 精确放到世界坐标 (wx,wy)
  const r = rotSpr(s, ang);
  const bx = Math.round(wx - ax - r.ox), by = Math.round(wy - ay - r.oy);
  for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) {
    const c = r.d[j * r.w + i]; if (!c) continue;
    px(bx + i, by + j, c);
  }
}

// ---------------------------------------------------------------- pixel font
const TC = new Map();
const _tc = document.createElement('canvas');
_tc.width = W; _tc.height = 24;
const _tx = _tc.getContext('2d', { willReadFrequently: true });
function bmp(str) {
  let o = TC.get(str);
  if (o) return o;
  _tx.font = '12px "Fusion Pixel 12"';
  const w = Math.max(1, Math.ceil(_tx.measureText(str).width));
  _tc.width = Math.min(W, w + 2); _tc.height = 24;
  _tx.font = '12px "Fusion Pixel 12"';
  _tx.textBaseline = 'top'; _tx.fillStyle = '#fff';
  _tx.clearRect(0, 0, _tc.width, 24);
  _tx.fillText(str, 0, 1);
  const d = _tx.getImageData(0, 0, _tc.width, 24).data;
  const m = new Uint8Array(_tc.width * 24);
  for (let i = 0; i < _tc.width * 24; i++) m[i] = d[i * 4 + 3] > 200 ? 1 : 0;
  o = { w: _tc.width, h: 24, m };
  TC.set(str, o);
  return o;
}
function textW(str) { bmp(str); return bmp(str).w; }
function text(str, x, y, c, scale = 1) {
  const b = bmp(str);
  for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) if (b.m[j * b.w + i]) {
    if (scale === 1) px(x + i, y + j, c);
    else for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) px(x + i * scale + sx, y + j * scale + sy, c);
  }
  return textW(str) * scale;
}
function textC(str, cx, y, c, scale = 1) { return text(str, Math.round(cx - textW(str) * scale / 2), y, c, scale); }

// ---------------------------------------------------------------- scenery helpers
function skyBand(y0, y1, cA, cB) {
  for (let y = y0; y < y1; y++) {
    const t = (y - y0) / Math.max(1, y1 - y0 - 1);
    for (let x = 0; x < W; x++) px(x, y, bay(x + (y >> 2), y) < t ? cB : cA);
  }
}
function stars(f) {
  for (let i = 0; i < 92; i++) {
    const x = Math.floor(hash(i, 7) * W), y = Math.floor(hash(i, 13) * 168);
    const ph = (f / 26 + hash(i, 21)) % 1;
    if (ph < 0.5) px(x, y, ph < 0.14 ? E.moon : E.sky3);
  }
}
function moon(f, cx, cy, r) {
  for (let j = -r - 16; j <= r + 16; j++) for (let i = -r - 16; i <= r + 16; i++) {
    const d = Math.sqrt(i * i + j * j);
    if (d < r + 16 && d > r) { const t = (r + 16 - d) / 16; if (bay(cx + i, cy + j) < t * 0.5) px(cx + i, cy + j, E.moonG); }
  }
  disc(cx, cy, r, E.moon);
  disc(cx - Math.round(r * 0.3), cy - Math.round(r * 0.25), Math.round(r * 0.45), M(8));
  for (let i = 0; i < 10; i++) px(cx - 8 + Math.floor(hash(i, 3) * 17), cy - 6 + Math.floor(hash(i, 5) * 15), M(7));
}
function cloudBand(f, y, w, spd, c, c2) {
  const off = -((f * spd) % (W + w * 2));
  for (let k = 0; k < 2; k++) {
    const bx = off + k * (W + w);
    for (let i = 0; i < w; i++) {
      const prof = Math.sin(i / w * 3.1416);
      const hh = Math.max(1, Math.round((3.2 + 3.4 * Math.sin(i * 0.19) + 2.2 * Math.sin(i * 0.061)) * prof));
      for (let j = 0; j < hh; j++) px(bx + i, y + j, j === hh - 1 && prof > 0.5 ? c2 : c);
    }
  }
}
function forest(f, yBase, seed, cDark, cLight, scl = 2, spd = 0.08) {
  const off = Math.round((f * spd) % 24);
  let x = -28 - off, i = 0;
  while (x < W + 28) {
    const w = Math.round((10 + hash(i, seed) * 14) * scl / 2);
    const h = Math.round((12 + hash(i, seed + 1) * 18) * scl / 2);
    const broad = hash(i, seed + 2) > 0.5;
    for (let j = 0; j < h; j++) {
      const u = j / h;
      const half = broad ? Math.round((w / 2) * Math.pow(u, 0.55)) + 1 : Math.round((w / 2) * (1 - Math.pow(1 - u, 1.9))) + 1;
      hline(x + Math.round(w / 2) - half, yBase - j, half * 2, j > h - 2 ? cLight : cDark);
    }
    x += Math.max(8, w);
    i++;
  }
}
function fogPatch(cx, cy, rx, ry, c, amt, f) {
  const ox = Math.round(Math.sin(f * 0.05) * 12);
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
    const d = Math.sqrt((i / rx) ** 2 + (j / ry) ** 2);
    if (d > 1) continue;
    if (bay(cx + i + ox, cy + j) < (1 - d) * amt) px(cx + i + ox, cy + j, c);
  }
}
function reeds(f, yBase, n, seed) {
  for (let i = 0; i < n; i++) {
    const x = Math.round(hash(i, seed) * W);
    const h = 8 + Math.round(hash(i, seed + 9) * 16);
    const ph = hash(i, seed + 3) * 6.28;
    const sway = Math.sin(f * 0.24 + ph) * 4.0;
    for (let j = 0; j < h; j++) px(Math.round(x + sway * (j / h) * (j / h) * 5.2), yBase - j, j > h - 3 ? E.grassL : E.grassD);
  }
}
function crow(f, x, y) {
  const flap = (Math.floor(f / 3) & 1) === 0;
  const c = M(0);
  for (const [dx, dy] of [[0, -2], [1, -1], [2, 0], [1, 1], [0, 1], [-1, 1]]) px(x + dx, y + dy, c);
  if (flap) { for (const [dx, dy] of [[-3, -2], [-2, -1], [-1, 0], [3, -1], [4, -1]]) px(x + dx, y + dy, c); }
  else { for (const [dx, dy] of [[-3, 2], [-2, 1], [-1, 1], [3, 2], [4, 2]]) px(x + dx, y + dy, c); }
}
function arc(cx, cy, r, a0, a1, c) {
  const n = Math.max(6, Math.round(r * Math.abs(a1 - a0) * 1.6));
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; px(cx + Math.round(Math.cos(a) * r), cy + Math.round(Math.sin(a) * r), c); }
}

// ---------------------------------------------------------------- sprites 实例
const SPR = {
  body: buildSpr('EXC_BODY', S.EXC_BODY, MAP_MACH),
  track: buildSpr('EXC_TRACK', S.EXC_TRACK, MAP_MACH),
  boom: buildSpr('EXC_BOOM', S.EXC_BOOM, MAP_MACH),
  arm: buildSpr('EXC_ARM', S.EXC_ARM, MAP_MACH),
  bucket: buildSpr('BUCKET', S.BUCKET, MAP_MACH),
  bucketDirt: buildSpr('BUCKET_DIRT', S.BUCKET_DIRT, MAP_MACH),
  stone: buildSpr('STONE_TILE', S.STONE_TILE, MAP_STONE, 0),
  // 门环是铜活，必须走 MAP_STONE（暖铜），走 MAP_PAL 会变成钢蓝色"胶囊"
  ring: buildSpr('RING_HANDLE', S.RING_HANDLE, MAP_STONE, 1),
  boss: buildSpr('ROPE_BOSS', S.ROPE_BOSS, MAP_STONE, 1),
  sarcoEnd: buildSpr('SARCO_END', S.SARCO_END, MAP_STONE, 1),
  lidEnd: buildSpr('SARCO_LID_END', S.SARCO_LID_END, MAP_STONE, 1),
  armor: buildSpr('ARMOR', S.ARMOR, MAP_STONE, 1),
  person: [S.PERSON_F0, S.PERSON_F1, S.PERSON_F2, S.PERSON_F3, S.PERSON_F4, S.PERSON_F5]
    .map((r, i) => buildSpr('PERSON_F' + i, r, MAP_PAL, 1)),
};

// ---------------------------------------------------------------- Cao Cao 10 s hook — native 640×360 pixel art (v2)
// 分镜：烛/寡妇 → 三国地图红线 → 标题党木刻卡 → 山道拐弯 → 曹操立像 → 洞房双人 → 帐外那一晚
const CAO_FLAME = [S.FLAME_F0, S.FLAME_F1, S.FLAME_F2, S.FLAME_F3]
  .map((rows, i) => buildSpr('CAO_FLAME_F' + i, rows, MAP_PAL, 0));
const CAO_SILK = [S.SILK_F0, S.SILK_F1, S.SILK_F2, S.SILK_F3]
  .map((rows, i) => buildSpr('CAO_SILK_F' + i, rows, MAP_PAL, 0));

// 镜头注册表：各场景文件按播放顺序 push；tail 用 CUTS 索引（SHOTS 比 cuts 多 1）
const SHOTS = [];

function ppoly(x, y, pts, c) { poly(pts.map(([a, b]) => [x + a, y + b]), c); }
function pline(x, y, pts, c, closed = false) {
  const p = pts.map(([a, b]) => [x + a, y + b]);
  polyLine(p, c, closed);
}
function textSC(str, cx, y, c, sc = 1, sh = M(0)) {
  const o = Math.max(1, Math.round(sc * 0.66));
  textC(str, cx + o, y + o, sh, sc);
  textC(str, cx, y, c, sc);
}
function dither(cx, cy, rx, ry, c, amt) {
  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++)
    if ((i / rx) ** 2 + (j / ry) ** 2 <= 1 && bay(cx + i, cy + j) < amt) px(cx + i, cy + j, c);
}
function dotsFlecks(x, y, w, h, c, amt, seed = 0) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++)
    if (hash(x + i + seed * 977, y + j - seed * 131) < amt) px(x + i, y + j, c);
}
function thickLine(x0, y0, x1, y1, w, c) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  for (let k = -w; k <= w; k++) line(x0 + nx * k, y0 + ny * k, x1 + nx * k, y1 + ny * k, c);
}
function dottedLine(x0, y0, x1, y1, c, gap = 2) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
  for (let s = 0; s <= len; s += gap) px(Math.round(x0 + dx * s / len), Math.round(y0 + dy * s / len), c);
}
function polyPath(pts, c, closed = false, from = 0, to = 1) { // 按弧长比例画折线
  const segs = [];
  let total = 0;
  for (let i = 0; i < (closed ? pts.length : pts.length - 1); i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a, b, len, acc: total }); total += len;
  }
  const s0 = clamp(from, 0, 1) * total, s1 = clamp(to, 0, 1) * total;
  for (const s of segs) {
    if (s.acc > s1) break;
    if (s.acc + s.len < s0) continue;
    const f0 = Math.max(0, (s0 - s.acc) / s.len), f1 = Math.min(1, (s1 - s.acc) / s.len);
    line(s.a[0] + (s.b[0] - s.a[0]) * f0, s.a[1] + (s.b[1] - s.a[1]) * f0,
      s.a[0] + (s.b[0] - s.a[0]) * f1, s.a[1] + (s.b[1] - s.a[1]) * f1, c);
  }
}
function pathAt(pts, s) {
  const segs = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a, b, len, acc: total }); total += len;
  }
  const d = clamp(s, 0, 1) * total;
  for (const g of segs) {
    if (d > g.acc + g.len) continue;
    const f = (d - g.acc) / g.len;
    return [g.a[0] + (g.b[0] - g.a[0]) * f, g.a[1] + (g.b[1] - g.a[1]) * f];
  }
  return pts[pts.length - 1];
}
function qPoint(p0, p1, p2, u) {
  const v = 1 - u;
  return [v * v * p0[0] + 2 * v * u * p1[0] + u * u * p2[0], v * v * p0[1] + 2 * v * u * p1[1] + u * u * p2[1]];
}

// ---------------------------------------------------------------- 场景零件
function woodWall(t) {
  rect(-10, 0, 660, 304, M(31));
  for (let x = -8; x < 650; x += 34) {
    vline(x, 0, 304, M(0));
    vline(x + 1, 0, 304, M(24));
    for (let y = 10; y < 298; y += 23) {
      if (hash(x, y) < 0.5) px(x + 5 + Math.floor(hash(x + 3, y) * 24), y + Math.floor(hash(x, y + 5) * 15), M(24));
      if (hash(x + 7, y) < 0.18) px(x + 3 + Math.floor(hash(x + 1, y) * 27), y + 4, M(1));
    }
  }
  dithGrad(-10, 238, 650, 304, M(31), M(0));
  dithGrad(-10, 0, 650, 46, M(0), M(31));
}
function silkCurtain(x, w, y0, y1, t, a = M(17), b = M(18), h = M(19)) {
  // 绸面：整幅实色 + 稀疏褶皱阴影（1px 竖条纹会被 yuv420 色度采样糊成噪点，不用）
  rect(x - 4, y0 - 5, w + 8, 5, M(29));
  hline(x - 4, y0 - 5, w + 8, M(15));
  rect(x - 2, y0, w + 4, y1 - y0, M(9));
  rect(x, y0, w, y1 - y0, a);
  // 褶皱：每 26px 一折，4px 宽；正弦摆动让布面一直有动
  for (let fx = 8; fx < w - 6; fx += 26) {
    const wob = Math.round(Math.sin(t * 1.4 + fx * 0.05) * 2);
    const deep = Math.sin(t * 0.9 + fx * 0.13) > 0.2;
    for (let y = y0; y < y1; y++) {
      const bend = Math.round(Math.sin(t * 1.1 + y * 0.02 + fx * 0.07) * 1.5);
      const xx = x + fx + wob + bend;
      vline(xx, y, 1, M(9));
      vline(xx + 1, y, 1, deep ? b : M(9));
      vline(xx + 2, y, 1, M(9));
      if (deep && y % 9 === 0) px(xx + 1, y, h);
    }
  }
  // 稀疏织纹：低对比点缀，保留绸缎颗粒
  for (let i = 0; i < Math.floor(w / 5); i++) {
    const hx = x + Math.floor(hash(x + i, 21) * w), hy = y0 + Math.floor(hash(x + i, 33) * (y1 - y0));
    if (hash(hx, hy) < 0.35) px(hx, hy, b);
  }
  // 上下滚边
  for (let i = -2; i < w + 2; i++) {
    const wob = Math.round(Math.sin(t * 1.4 + i * 0.17) * 2);
    px(x + i + wob, y0, M(18));
    px(x + i + wob, y1, M(9)); px(x + i + wob, y1 + 1, M(0));
  }
}
function paperWindow(x, y, w, h, t) {
  rect(x - 6, y - 6, w + 12, h + 14, M(9));
  rect(x, y, w, h, M(27));
  dotsFlecks(x, y, w, h, M(26), 0.06, 3);
  const mx = x + Math.round(w * 0.68), my = y + Math.round(h * 0.31), mr = Math.round(w * 0.15);
  disc(mx, my, mr + 4, M(8));
  disc(mx, my, mr + 2, M(28));
  disc(mx - 1, my - 1, mr, M(8));
  for (let k = 1; k < 4; k++) {
    const lx = x + Math.round(w * k / 4);
    vline(lx, y, h, M(9)); vline(lx + 1, y, h, M(11));
  }
  for (let k = 1; k < 4; k++) {
    const ly = y + Math.round(h * k / 4);
    hline(x, ly, w, M(9)); hline(x, ly + 1, w, M(11));
  }
  rect(x - 6, y - 6, w + 12, 4, M(12));
  hline(x - 6, y - 6, w + 12, M(14));
  rect(x - 8, y + h, w + 16, 6, M(11));
  hline(x - 8, y + h, w + 16, M(14));
  glowSpot(x + w / 2, y + h, 36, 1, 0.12);
}
function candle(x, y, t, sc = 1) {
  rect(x - 9 * sc, y + 40 * sc, 18 * sc, 3 * sc, M(29));
  rect(x - 2 * sc, y + 26 * sc, 4 * sc, 14 * sc, M(29));
  vline(x - 1 * sc, y + 26 * sc, 14 * sc, M(15));
  rect(x - 6 * sc, y + 24 * sc, 12 * sc, 2 * sc, M(15));
  rect(x - 3 * sc, y + 9 * sc, 6 * sc, 16 * sc, M(28));
  vline(x - 2 * sc, y + 9 * sc, 16 * sc, M(8));
  vline(x + 2 * sc, y + 9 * sc, 16 * sc, M(27));
  px(x - 3 * sc, y + 21 * sc, M(8)); px(x + 3 * sc, y + 18 * sc, M(27));
  const fl = CAO_FLAME[Math.floor(t * 14 + 1) % 4];
  blit(fl, x - 4 * sc, y + 1 * sc, sc);
  glowSpot(x, y + 7 * sc, 38 * sc, 1, 0.62);
  glowSpot(x, y + 7 * sc, 16 * sc, 1, 0.9);
}
function hangingLantern(x, y, t, sc = 1) {
  const sw = Math.round(Math.sin(t * 1.7 + x * 0.03) * 2);
  line(x, y - 20 * sc, x + sw, y, M(29));
  line(x + 1, y - 20 * sc, x + 1 + sw, y, M(15));
  const lx = x + sw;
  glowSpot(lx + 10 * sc, y + 12 * sc, 34 * sc, 1, 0.36);
  rect(lx + 2 * sc, y, 16 * sc, 3 * sc, M(14));
  rect(lx, y + 3 * sc, 20 * sc, 23 * sc, M(0));
  rect(lx + 2 * sc, y + 5 * sc, 16 * sc, 18 * sc, M(17));
  rect(lx + 4 * sc, y + 7 * sc, 12 * sc, 14 * sc, M(18));
  for (let i = 0; i < 4; i++) vline(lx + (4 + i * 4) * sc, y + 5 * sc, 18 * sc, M(14));
  hline(lx + 2 * sc, y + 23 * sc, 16 * sc, M(14));
  const fl = CAO_FLAME[Math.floor(t * 12) % 4];
  blit(fl, lx + 5 * sc, y + 4 * sc, sc);
  vline(lx + 10 * sc, y + 26 * sc, 5 * sc, M(18));
  px(lx + 10 * sc, y + 32 * sc, M(15));
}
function emberField(t, seed, count = 56) {
  for (let i = 0; i < count; i++) {
    const speed = 0.18 + hash(i, seed + 1) * 0.10;
    const phase = (t * speed + hash(i, seed + 2)) % 1;
    const x = 18 + Math.floor(hash(i, seed + 3) * 604 + Math.sin(t * 0.7 + i) * 4);
    const y = 292 - Math.floor(phase * 236);
    const c = i % 5 === 0 ? M(18) : i % 3 === 0 ? M(14) : M(15);
    rect(x, y, i % 4 === 0 ? 2 : 1, i % 4 === 0 ? 2 : 1, c);
    if (i % 9 === 0) px(x + 2, y - 2, M(16));
  }
}
function dustMotes(t, n, seed, x0, x1, y0, y1, c = M(6)) {
  for (let i = 0; i < n; i++) {
    const sp = 2.2 + hash(i, seed) * 4.0;
    const x = x0 + ((hash(i, seed + 1) * (x1 - x0) + t * sp) % (x1 - x0));
    const y = y0 + ((hash(i, seed + 2) * (y1 - y0) + t * sp * 0.3 + Math.sin(t * 0.9 + i) * 5) % (y1 - y0));
    px(Math.round(x), Math.round(y), hash(i, seed + 3) < 0.28 ? M(15) : c);
  }
}
function nightSky(f, seed = 5) {
  skyBand(-8, 126, E.sky0, E.sky1);
  skyBand(126, 214, E.sky1, E.sky2);
  skyBand(214, 304, E.sky2, E.sky3);
  stars(f);
  cloudBand(f, 62, 200, 0.045, E.cloudD, E.sky2);
  cloudBand(f, 118, 150, 0.075, E.cloudD, E.sky3);
}
function farMountains(ox = 0) {
  const pts = [[-12 + ox, 268], [66 + ox, 238], [148 + ox, 256], [238 + ox, 224], [326 + ox, 252],
    [414 + ox, 230], [500 + ox, 254], [590 + ox, 232], [652 + ox, 250], [652 + ox, 306], [-12 + ox, 306]];
  poly(pts, E.mtnF);
  for (let i = 1; i < pts.length - 3; i++) line(pts[i][0], pts[i][1], pts[i][0] + 26, pts[i][1] + 20, M(1));
}
function groundPlane(y, t, seed = 2) {
  rect(-10, y, 660, 306 - y, E.ink);
  for (let i = 0; i < 60; i++) {
    const x = -8 + Math.floor(hash(i, seed) * 656), yy = y + 4 + Math.floor(hash(i, seed + 1) * (300 - y));
    hline(x, yy, 2 + Math.floor(hash(i, seed + 2) * 6), M(1));
  }
  dithGrad(-10, y, 650, 306, E.ink, M(0));
}
function pillar(x, w, y0, y1) {
  rect(x, y0, w, y1 - y0, M(17));
  vline(x + 2, y0, y1 - y0, M(18));
  vline(x + w - 3, y0, y1 - y0, M(9));
  vline(x, y0, y1 - y0, M(0));
  rect(x - 3, y0, w + 6, 5, M(15));
  hline(x - 3, y0, w + 6, M(16));
  rect(x - 3, y1 - 6, w + 6, 5, M(15));
  hline(x - 3, y1 - 6, w + 6, M(16));
}
function sealStamp(x, y, s, str, landed = true) {
  if (!landed) return;
  // 朱印底：边缘故意留缺，像手工蘸印
  for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
    const edge = i < 2 || j < 2 || i >= s - 2 || j >= s - 2;
    const nick = hash(x + i * 3, y + j * 5) < 0.06;
    if (edge && nick) continue;
    px(x + i, y + j, M(18));
  }
  for (let i = 4; i < s - 4; i++) { px(x + i, y + 4, M(19)); px(x + i, y + s - 5, M(17)); }
  for (let j = 4; j < s - 4; j++) { px(x + 4, y + j, M(19)); px(x + s - 5, y + j, M(17)); }
  const chs = [...str], sc = s >= 66 ? 2 : 1, lh = 12 * sc, total = chs.length * lh;
  let ty = Math.round(y + (s - total) / 2) + 1;
  for (const ch of chs) { textC(ch, x + s / 2, ty, M(8), sc); ty += lh; }
}
function brushArrow(pts, p, c = M(18)) {
  polyPath(pts, c, false, 0, p);
  if (p > 0.9) {
    const [ex, ey] = pts[pts.length - 1], [bx, by] = pts[pts.length - 2];
    const a = Math.atan2(ey - by, ex - bx);
    poly([[ex, ey],
      [ex - Math.cos(a - 0.5) * 11, ey - Math.sin(a - 0.5) * 11],
      [ex - Math.cos(a + 0.5) * 11, ey - Math.sin(a + 0.5) * 11]], c);
  }
  // 笔触毛边
  if (p > 0.2) polyPath(pts.map(([a, b]) => [a, b + 2]), c, false, 0.1, p * 0.92);
}

// ---------------------------------------------------------------- 人物
function drawCao2(x, y, t, opt = {}) {
  const breathe = Math.round(Math.sin(t * 2.35) * 1);
  const sway = Math.round(Math.sin(t * 1.25) * 1);
  const X = x + sway, Y = y + breathe;

  // 红披风
  const cape = [[X + 44, Y + 58], [X + 72, Y + 56], [X + 104, Y + 82], [X + 112, Y + 150], [X + 104, Y + 192], [X + 84, Y + 200], [X + 20, Y + 200], [X + 6, Y + 188], [X + 2, Y + 132], [X + 16, Y + 78]];
  poly(cape, M(17)); polyLine(cape, M(0), true);
  dithGrad(X + 8, Y + 88, X + 110, Y + 196, M(17), M(9));
  line(X + 103, Y + 84, X + 110, Y + 148, M(18));
  line(X + 110, Y + 148, X + 102, Y + 190, M(18));
  line(X + 17, Y + 80, X + 8, Y + 126, M(9));
  line(X + 25, Y + 96, X + 16, Y + 186, M(18));
  line(X + 95, Y + 92, X + 102, Y + 184, M(18));

  // 金边肩甲
  const shL = [[X + 18, Y + 62], [X + 46, Y + 54], [X + 54, Y + 66], [X + 48, Y + 86], [X + 22, Y + 84]];
  const shR = [[X + 82, Y + 56], [X + 108, Y + 64], [X + 112, Y + 86], [X + 94, Y + 90], [X + 82, Y + 70]];
  poly(shL, M(10)); polyLine(shL, M(15), true);
  poly(shR, M(10)); polyLine(shR, M(15), true);
  for (let i = 0; i < 4; i++) { px(X + 27 + i * 6, Y + 70, M(15)); px(X + 88 + i * 6, Y + 72, M(15)); }

  // 毛领
  const collar = [[X + 38, Y + 58], [X + 52, Y + 50], [X + 66, Y + 54], [X + 80, Y + 50], [X + 94, Y + 60], [X + 84, Y + 72], [X + 72, Y + 66], [X + 60, Y + 72], [X + 48, Y + 66], [X + 38, Y + 72]];
  poly(collar, M(10));
  for (let i = 0; i < 30; i++) px(X + 41 + Math.floor(hash(i, 4) * 52), Y + 55 + Math.floor(hash(i, 9) * 13), hash(i, 7) < 0.5 ? M(12) : M(14));
  polyLine(collar, M(0), true);

  // 甲身
  poly([[X + 32, Y + 88], [X + 72, Y + 84], [X + 94, Y + 96], [X + 94, Y + 160], [X + 74, Y + 170], [X + 36, Y + 170], [X + 28, Y + 156], [X + 28, Y + 102]], M(9));
  for (let r = 0; r < 7; r++) {
    const yy = Y + 96 + r * 10;
    line(X + 31, yy, X + 92, yy, r % 2 ? M(29) : M(11));
    for (let c2 = 0; c2 < 5; c2++) px(X + 36 + c2 * 12, yy + 4, M(15));
  }
  line(X + 32, Y + 90, X + 36, Y + 164, M(11));
  line(X + 92, Y + 96, X + 90, Y + 162, M(11));
  // 腰封
  rect(X + 30, Y + 158, 62, 9, M(18));
  hline(X + 30, Y + 158, 62, M(19));
  hline(X + 30, Y + 166, 62, M(9));
  disc(X + 61, Y + 162, 5, M(15)); disc(X + 61, Y + 162, 3, M(14));
  px(X + 60, Y + 161, M(0)); px(X + 62, Y + 161, M(0));

  // 脖子 + 脸
  rect(X + 54, Y + 72, 14, 12, M(13));
  line(X + 54, Y + 72, X + 54, Y + 84, M(9));
  line(X + 67, Y + 72, X + 67, Y + 84, M(14));
  const face = [[X + 44, Y + 40], [X + 52, Y + 30], [X + 66, Y + 29], [X + 78, Y + 38], [X + 80, Y + 56], [X + 70, Y + 72], [X + 56, Y + 74], [X + 45, Y + 62], [X + 41, Y + 48]];
  poly(face, M(14));
  polyD([[X + 44, Y + 40], [X + 50, Y + 32], [X + 48, Y + 72], [X + 41, Y + 48]], M(13), 1);
  px(X + 72, Y + 44, M(15)); px(X + 73, Y + 46, M(15)); px(X + 71, Y + 50, M(15));
  line(X + 47, Y + 45, X + 57, Y + 43, M(0));
  line(X + 65, Y + 43, X + 75, Y + 45, M(0));
  line(X + 47, Y + 46, X + 56, Y + 44, M(9));
  line(X + 66, Y + 44, X + 75, Y + 46, M(9));
  line(X + 48, Y + 49, X + 56, Y + 48, M(0));
  line(X + 66, Y + 48, X + 74, Y + 49, M(0));
  if (opt.glint) { px(X + 54, Y + 48, M(8)); px(X + 70, Y + 48, M(8)); }
  line(X + 61, Y + 47, X + 58, Y + 59, M(13));
  px(X + 57, Y + 60, M(9)); px(X + 60, Y + 60, M(9));
  line(X + 58, Y + 64, X + 47, Y + 69, M(31));
  line(X + 64, Y + 64, X + 75, Y + 69, M(31));
  const beard = [[X + 50, Y + 64], [X + 62, Y + 68], [X + 74, Y + 64], [X + 78, Y + 82], [X + 72, Y + 98], [X + 62, Y + 108], [X + 52, Y + 98], [X + 46, Y + 82]];
  poly(beard, M(9));
  polyLine(beard, M(31), true);
  for (let i = 0; i < 6; i++) line(X + 52 + i * 4, Y + 74, X + 53 + i * 4, Y + 92, M(10));
  for (let i = 0; i < 3; i++) px(X + 56 + i * 5, Y + 96 + (i % 2) * 3, M(26));
  line(X + 62, Y + 84, X + 61, Y + 102, M(10));
  // 八字须
  line(X + 58, Y + 64, X + 48, Y + 70, M(31));
  line(X + 64, Y + 64, X + 74, Y + 70, M(31));
  line(X + 58, Y + 65, X + 49, Y + 71, M(9));
  line(X + 64, Y + 65, X + 73, Y + 71, M(9));
  poly([[X + 41, Y + 34], [X + 46, Y + 26], [X + 44, Y + 56], [X + 40, Y + 46]], M(0));
  poly([[X + 70, Y + 27], [X + 80, Y + 36], [X + 80, Y + 54], [X + 72, Y + 46]], M(0));

  // 进贤冠
  rect(X + 48, Y + 8, 28, 22, M(0));
  rect(X + 52, Y + 4, 20, 6, M(0));
  rect(X + 47, Y + 26, 30, 5, M(15));
  hline(X + 47, Y + 26, 30, M(16));
  vline(X + 52, Y + 10, 16, M(15)); vline(X + 71, Y + 10, 16, M(15));
  hline(X + 52, Y + 14, 20, M(15));
  px(X + 61, Y + 11, M(19)); px(X + 63, Y + 11, M(19));
  hline(X + 60, Y + 20, 5, M(16));

  // 左臂（拿红线）/ 右臂（按剑）
  const armL = [[X + 20, Y + 78], [X + 38, Y + 74], [X + 40, Y + 104], [X + 16, Y + 124], [X + 6, Y + 112]];
  poly(armL, M(10)); polyLine(armL, M(15), true);
  poly([[X + 6, Y + 116], [X + 16, Y + 118], [X + 18, Y + 130], [X + 8, Y + 130]], M(14));
  line(X + 8, Y + 124, X + 16, Y + 124, M(13));
  const armR = [[X + 84, Y + 80], [X + 102, Y + 84], [X + 110, Y + 120], [X + 94, Y + 132], [X + 86, Y + 112]];
  poly(armR, M(10)); polyLine(armR, M(15), true);
  poly([[X + 96, Y + 126], [X + 106, Y + 128], [X + 110, Y + 142], [X + 100, Y + 144]], M(14));
  line(X + 107, Y + 141, X + 113, Y + 194, M(5));
  line(X + 108, Y + 141, X + 114, Y + 194, M(7));
  rect(X + 102, Y + 137, 12, 3, M(15));
  rect(X + 107, Y + 133, 4, 6, M(29));

  // 腿靴
  rect(X + 40, Y + 168, 18, 28, M(9));
  rect(X + 64, Y + 168, 18, 28, M(9));
  rect(X + 37, Y + 192, 23, 8, M(0));
  rect(X + 62, Y + 192, 23, 8, M(0));
  hline(X + 40, Y + 176, 18, M(0)); hline(X + 64, Y + 176, 18, M(0));
  line(X + 20, Y + 197, X + 104, Y + 197, M(9));
}
function drawZou2(x, y, t, opt = {}) {
  const breathe = Math.round(Math.sin(t * 3.05) * 1);
  const sway = Math.round(Math.sin(t * 1.65) * 1);
  const X = x + sway, Y = y + breathe;

  // 地面影
  disc(X + 54, Y + 187, 34, M(0));
  dither(X + 54, Y + 192, 36, 6, M(31), 0.55);

  // 后发与发髻
  disc(X + 54, Y + 31, 21, M(31));
  // 发髻：紫黑外壳 + 黑芯，才压得住和墙同色的 M(31) 背景
  disc(X + 54, Y + 9, 10, M(24));
  disc(X + 54, Y + 9, 8, M(31));
  for (let a = 3.4; a < 4.9; a += 0.12) px(X + 54 + Math.round(Math.cos(a) * 10), Y + 9 + Math.round(Math.sin(a) * 10), M(4));
  // 金簪横插进发髻（不外露）
  line(X + 48, Y + 8, X + 59, Y + 6, M(29));
  line(X + 48, Y + 7, X + 59, Y + 5, M(15));
  px(X + 60, Y + 5, M(16)); px(X + 61, Y + 4, M(15));

  // 脸
  const face = [[X + 42, Y + 22], [X + 56, Y + 17], [X + 68, Y + 22], [X + 71, Y + 38], [X + 64, Y + 50], [X + 54, Y + 53], [X + 44, Y + 47], [X + 39, Y + 36]];
  poly(face, M(14));
  polyD([[X + 42, Y + 22], [X + 48, Y + 20], [X + 46, Y + 48], [X + 40, Y + 38]], M(13), 1);
  px(X + 63, Y + 24, M(15)); px(X + 64, Y + 26, M(15));
  // 发际与鬓发
  poly([[X + 40, Y + 28], [X + 46, Y + 19], [X + 56, Y + 16], [X + 66, Y + 19], [X + 71, Y + 28], [X + 64, Y + 23], [X + 54, Y + 21], [X + 45, Y + 25]], M(31));
  poly([[X + 38, Y + 30], [X + 42, Y + 22], [X + 44, Y + 48], [X + 38, Y + 42]], M(31));
  poly([[X + 65, Y + 20], [X + 72, Y + 28], [X + 71, Y + 46], [X + 64, Y + 52]], M(31));
  // 眉眼鼻唇
  line(X + 46, Y + 31, X + 52, Y + 31, M(9));
  line(X + 57, Y + 31, X + 63, Y + 31, M(9));
  line(X + 46, Y + 34, X + 52, Y + 35, M(31));
  line(X + 57, Y + 35, X + 63, Y + 34, M(31));
  px(X + 49, Y + 34, M(8)); px(X + 60, Y + 34, M(8));
  line(X + 54, Y + 36, X + 53, Y + 43, M(13));
  px(X + 52, Y + 43, M(12));
  hline(X + 50, Y + 46, 6, M(18)); px(X + 53, Y + 46, M(19));

  // 白色孝服
  const robe = [[X + 46, Y + 52], [X + 62, Y + 50], [X + 88, Y + 70], [X + 104, Y + 140], [X + 98, Y + 176], [X + 78, Y + 190], [X + 30, Y + 190], [X + 10, Y + 176], [X + 4, Y + 140], [X + 20, Y + 70]];
  poly(robe, M(28)); polyLine(robe, M(26), true);
  line(X + 34, Y + 72, X + 30, Y + 174, M(27));
  line(X + 48, Y + 62, X + 44, Y + 186, M(27));
  line(X + 60, Y + 60, X + 62, Y + 188, M(26));
  line(X + 76, Y + 66, X + 80, Y + 184, M(27));
  line(X + 88, Y + 76, X + 92, Y + 174, M(26));
  line(X + 20, Y + 78, X + 14, Y + 168, M(27));
  line(X + 96, Y + 84, X + 98, Y + 168, M(27));
  // 交领
  // 颌下阴影 + 交领缝线（不画深色块，避免误读成胡须）
  hline(X + 50, Y + 53, 9, M(13));
  line(X + 50, Y + 53, X + 49, Y + 55, M(13));
  line(X + 59, Y + 52, X + 60, Y + 54, M(13));
  line(X + 49, Y + 56, X + 55, Y + 72, M(27));
  line(X + 60, Y + 55, X + 55, Y + 72, M(27));
  line(X + 46, Y + 56, X + 52, Y + 80, M(28));
  line(X + 62, Y + 52, X + 58, Y + 78, M(28));
  line(X + 33, Y + 54, X + 48, Y + 80, M(27));
  line(X + 74, Y + 55, X + 62, Y + 78, M(27));
  // 大袖
  const slL = [[X + 8, Y + 78], [X + 24, Y + 68], [X + 30, Y + 106], [X + 24, Y + 128], [X + 8, Y + 136], [X - 2, Y + 120]];
  poly(slL, M(28)); polyLine(slL, M(26), true);
  line(X + 12, Y + 86, X + 18, Y + 122, M(27));
  const slR = [[X + 88, Y + 72], [X + 104, Y + 84], [X + 110, Y + 120], [X + 102, Y + 140], [X + 86, Y + 132], [X + 90, Y + 100]];
  poly(slR, M(28)); polyLine(slR, M(26), true);
  line(X + 100, Y + 90, X + 104, Y + 130, M(27));
  // 素带
  rect(X + 38, Y + 118, 34, 6, M(27));
  hline(X + 38, Y + 118, 34, M(26));
  px(X + 54, Y + 120, M(28)); px(X + 55, Y + 121, M(28));
  // 白帕：只从手下垂出，不在两侧露角
  const kerch = [[X + 47, Y + 112], [X + 63, Y + 112], [X + 65, Y + 130], [X + 59, Y + 143], [X + 54, Y + 149], [X + 49, Y + 140], [X + 46, Y + 128]];
  poly(kerch, M(8));
  polyLine(kerch, M(7), true);
  line(X + 53, Y + 116, X + 51, Y + 138, M(6));
  line(X + 58, Y + 116, X + 59, Y + 136, M(6));
  // 袖中前臂接到袖口，避免手悬空
  poly([[X + 26, Y + 106], [X + 47, Y + 103], [X + 47, Y + 112], [X + 27, Y + 116]], M(28));
  polyLine([[X + 26, Y + 106], [X + 47, Y + 103]], M(27), false);
  polyLine([[X + 27, Y + 116], [X + 47, Y + 112]], M(26), false);
  poly([[X + 63, Y + 103], [X + 84, Y + 107], [X + 83, Y + 117], [X + 63, Y + 112]], M(28));
  polyLine([[X + 63, Y + 103], [X + 84, Y + 107]], M(27), false);
  polyLine([[X + 63, Y + 112], [X + 83, Y + 117]], M(26), false);
  // 交叠的双手（两个拳峰 + 交叠缝，不再是圆团）
  poly([[X + 45, Y + 102], [X + 50, Y + 98], [X + 56, Y + 98], [X + 58, Y + 104], [X + 55, Y + 113], [X + 47, Y + 112], [X + 44, Y + 107]], M(14));
  poly([[X + 55, Y + 99], [X + 61, Y + 98], [X + 65, Y + 102], [X + 65, Y + 108], [X + 60, Y + 112], [X + 56, Y + 104]], M(14));
  line(X + 56, Y + 100, X + 56, Y + 110, M(13));
  poly([[X + 49, Y + 100], [X + 54, Y + 99], [X + 54, Y + 103], [X + 49, Y + 104]], M(15));
  line(X + 58, Y + 103, X + 63, Y + 104, M(13));
  px(X + 47, Y + 111, M(13)); px(X + 64, Y + 107, M(13));
  // 面纱
  if (opt.veil) {
    hline(X + 40, Y + 17, 28, M(28));
    hline(X + 40, Y + 18, 28, M(27));
    poly([[X + 33, Y + 17], [X + 41, Y + 17], [X + 37, Y + 70], [X + 29, Y + 64]], M(28));
    poly([[X + 67, Y + 17], [X + 75, Y + 17], [X + 79, Y + 66], [X + 71, Y + 72]], M(28));
    polyLine([[X + 33, Y + 17], [X + 29, Y + 64]], M(27), false);
    polyLine([[X + 75, Y + 17], [X + 79, Y + 66]], M(27), false);
  }
  // 下摆与鞋尖
  hline(X + 28, Y + 186, 52, M(26));
  hline(X + 26, Y + 188, 56, M(0));
  px(X + 42, Y + 190, M(31)); px(X + 44, Y + 190, M(31));
  px(X + 62, Y + 190, M(31)); px(X + 64, Y + 190, M(31));
}

// ================================================================== 曹操 30 s 样片 · 场景层
// 0–29.4 s 共 11 镜：灵堂寡妇 / 三国地图 / 最大的拐弯 / 官渡赤壁 / 宛城 /
//                    公元一九七 / 张绣 / 张济之死 / 兵不血刃 / 看上邹氏 / 纳妾
// 只动内容层；引擎、sprite 表、CRT 后处理沿用冻结管线。

const T = n => cues.hits[n];

// ---------------------------------------------------------------- SHOT 1 · 0.0–1.5 灵堂残烛，寡妇
function sh1_widow(t, f) {
  const jx = Math.round(Math.sin(t * 12.0) * 0.9), jy = Math.round(Math.cos(t * 9.0) * 0.7);
  GX += jx; GY += jy;
  woodWall(t);
  rect(-10, 286, 660, 20, M(0));
  paperWindow(52, 74, 104, 128, t);
  pillar(186, 12, 0, 304);
  // 烛台小几
  rect(196, 268, 74, 6, M(11));
  hline(196, 268, 74, M(12));
  rect(202, 274, 6, 12, M(9));
  rect(258, 274, 6, 12, M(9));
  candle(216, 188, t, 2);
  silkCurtain(508, 138, 52, 292, t);
  drawZou2(258, 92, t, { veil: 1 });
  textC('囍', 470, 108, M(18), 2);
  line(452, 100, 470, 92, M(18)); // 撕开的半边囍
  px(478, 120, M(18)); px(462, 128, M(18));
  dustMotes(t, 26, 3, 18, 620, 40, 300, M(5));
  // 灵堂木牌砸入
  if (t > 0.16) {
    const k = clamp((t - 0.16) / 0.20, 0, 1);
    const jit = t < 0.42 ? Math.round(Math.sin(t * 80) * (0.42 - t) * 6) : 0;
    textSC('灵堂', 320 + jit, 16 + Math.round((1 - k) * 8), M(15), 3);
    hline(248, 60, 144, M(18));
    hline(248, 61, 144, M(17));
  }
  const fl = 0.62 + Math.sin(t * 9.1) * 0.08;
  glowSpot(216, 202, 96, 1, fl * 0.30);
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 2 · 1.5–4.2 三国地图与红线
const CHINA = [[146, 112], [186, 98], [232, 104], [272, 94], [316, 104], [356, 98], [398, 110], [438, 102], [478, 122], [500, 146], [478, 168], [492, 190], [472, 212], [440, 224], [400, 216], [368, 230], [330, 222], [300, 234], [262, 224], [230, 236], [196, 224], [166, 204], [148, 180], [136, 152]];
const T_NODES = [
  { x: 258, y: 238, year: '197', label: '宛城' },
  { x: 318, y: 214, year: '200', label: '' },
  { x: 386, y: 234, year: '208', label: '' },
  { x: 350, y: 178, year: '220', label: '' },
  { x: 414, y: 164, year: '249', label: '' },
  { x: 462, y: 150, year: '265', label: '' },
  { x: 506, y: 204, year: '280', label: '' },
];
function drawMap(pan, t) {
  const pg = [[-12 + pan, 84], [120 + pan, 78], [240 + pan, 82], [360 + pan, 77], [470 + pan, 82], [652 + pan, 78], [652 + pan, 302], [360 + pan, 298], [200 + pan, 302], [-12 + pan, 296]];
  poly(pg, M(28));
  polyLine(pg, M(12), true);
  for (let y = 80; y < 300; y++) for (let x = -12 + pan; x < 652 + pan; x++) {
    if (hash(x, y) < 0.05) px(x, y, M(27));
    if (hash(x + 9, y + 3) < 0.012) px(x, y, M(12));
  }
  // 页脚阴影：两段硬色阶（同色相），避免沙色×灰蓝棋盘在高对比处出噪
  rect(-12 + pan, 268, 664, 20, M(28));
  rect(-12 + pan, 288, 664, 6, M(12));
  rect(-12 + pan, 294, 664, 8, M(20));
  polyPath(CHINA, M(12), true);
  for (let i = 0; i < CHINA.length; i++) {
    const a = CHINA[i], b = CHINA[(i + 1) % CHINA.length];
    dottedLine(a[0], a[1] + 2, b[0], b[1] + 2, M(27), 4);
  }
  polyPath([[178, 150], [214, 158], [250, 152], [286, 162], [320, 156], [352, 166], [388, 160], [420, 170], [452, 166]], M(20), false);
  polyPath([[236, 120], [250, 140], [246, 166], [258, 190], [252, 214]], M(20), false);
  const borders = [
    [[204, 110], [230, 140], [222, 176], [238, 206]],
    [[330, 100], [322, 132], [340, 160], [330, 188], [344, 214]],
    [[400, 108], [392, 138], [410, 166], [400, 192], [416, 214]],
  ];
  for (const b of borders) for (let i = 0; i < b.length - 1; i++) dottedLine(b[i][0], b[i][1], b[i + 1][0], b[i + 1][1], M(11), 5);
  textC('魏', 350, 116, M(11), 2);
  textC('蜀', 232, 190, M(11), 2);
  textC('吴', 470, 228, M(11), 2);
  disc(56 + pan, 250, 11, M(12)); disc(56 + pan, 250, 9, M(28));
  line(56 + pan, 242, 56 + pan, 258, M(12)); line(48 + pan, 250, 64 + pan, 250, M(12));
  poly([[56 + pan, 240], [52 + pan, 248], [60 + pan, 248]], M(18));
  textC('北', 56 + pan, 262, M(12), 1);
  for (let i = 0; i < 4; i++) rect(90 + pan + i * 12, 276, 10, 3, i % 2 ? M(12) : M(28));
  line(90 + pan, 275, 138 + pan, 275, M(12)); line(90 + pan, 280, 138 + pan, 280, M(12));
}
function drawThread(t, pan) {
  const pts = T_NODES.map(n => [n.x + pan, n.y]);
  const p = clamp((t - T('thread')) / 1.55, 0, 1);
  polyPath(pts, M(18), false, 0, p);
  polyPath(pts.map(([a, b]) => [a, b - 1]), M(19), false, 0, p);
  let acc = 0;
  const lens = [];
  for (let i = 0; i < pts.length - 1; i++) { lens.push(Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])); acc += lens[i]; }
  const total = acc;
  let run = 0;
  for (let i = 0; i < pts.length; i++) {
    if (i > 0) run += lens[i - 1];
    const frac = total ? run / total : 0;
    const lit = p >= frac - 0.001;
    const n = T_NODES[i];
    if (lit) {
      glowSpot(Math.round(pts[i][0]), Math.round(pts[i][1]), 10, 1, 0.5);
      disc(Math.round(pts[i][0]), Math.round(pts[i][1]), 3, M(19));
      px(Math.round(pts[i][0]) - 1, Math.round(pts[i][1]) - 1, M(16));
      textC(n.year, Math.round(pts[i][0]), Math.round(pts[i][1]) - 18, M(9), 1);
      if (n.label) textC(n.label, Math.round(pts[i][0]), Math.round(pts[i][1]) + 8, M(9), 1);
    } else {
      disc(Math.round(pts[i][0]), Math.round(pts[i][1]), 2, M(12));
    }
  }
  const [tx, ty] = pathAt(pts, p);
  glowSpot(Math.round(tx), Math.round(ty), 8, 1, 0.6);
  px(Math.round(tx), Math.round(ty), M(16));
}
function sh2_map(t, f) {
  nightSky(f, 19);
  moon(f, 566, 44, 16);
  const u = clamp((t - 1.5) / 2.7, 0, 1);
  const pan = Math.round(-8 + 18 * u);
  farMountains(0);
  const gx0 = GX;
  GX = gx0 + pan;
  drawMap(0, t);
  drawThread(t, 0);
  GX = gx0;
  textSC('三百年', 320, 16, M(15), 3);
  sealStamp(552, 232, 66, '改写', true);
  dustMotes(t, 18, 11, 40, 600, 90, 290, M(12));
}

// ---------------------------------------------------------------- SHOT 3 · 4.2–7.8 山道拐弯，拐点通到洞房
const ROAD = [[-16, 298], [76, 284], [166, 264], [256, 246], [328, 230], [376, 216], [392, 204], [392, 152], [470, 148], [556, 148], [652, 152]];
const FORT = [392, 152];
function drawRoad(t) {
  const seg = (w, c) => { for (let i = 0; i < ROAD.length - 1; i++) thickLine(ROAD[i][0], ROAD[i][1], ROAD[i + 1][0], ROAD[i + 1][1], w, c); };
  seg(8, M(2));
  seg(7, M(3));
  seg(5, M(4));
  for (let s = 0; s < 1; s += 0.05) {
    const [x, y] = pathAt(ROAD, s);
    px(Math.round(x), Math.round(y), M(6));
  }
  for (let s = 0; s < 1; s += 0.018) {
    const [x, y] = pathAt(ROAD, s), [x2, y2] = pathAt(ROAD, Math.min(1, s + 0.012));
    const dx = x2 - x, dy = y2 - y, L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L * 9, ny = dx / L * 9;
    if (hash(Math.round(x), Math.round(y)) < 0.6) {
      px(Math.round(x - nx), Math.round(y - ny), M(6));
      px(Math.round(x + nx), Math.round(y + ny), M(5));
    }
  }
  for (let y = 160; y < 202; y += 7) { px(400, y, M(29)); px(399, y, M(2)); }
  line(400, 152, 400, 204, M(2));
}
function drawFort(t) {
  const [x, y] = FORT;
  poly([[x - 34, y + 52], [x - 26, y + 32], [x + 26, y + 32], [x + 34, y + 52]], M(2));
  polyLine([[x - 26, y + 32], [x + 26, y + 32]], M(4), false);
  for (let i = 0; i < 3; i++) {
    hline(x - 12 + i * 2, y + 44 - i * 4, 24 - i * 4, M(12));
    px(x - 12 + i * 2, y + 44 - i * 4, M(4));
    px(x + 11 - i * 2, y + 44 - i * 4, M(4));
  }
  rect(x - 24, y - 8, 48, 40, M(10));
  vline(x - 24, y - 8, 40, M(9));
  vline(x + 23, y - 8, 40, M(9));
  for (let r = 0; r < 6; r++) for (let c2 = 0; c2 < 6; c2++)
    px(x - 22 + c2 * 8 + (r % 2) * 4, y - 4 + r * 6, M(9));
  for (let i = 0; i < 6; i++) rect(x - 24 + i * 8, y - 14, 6, 7, M(9));
  rect(x - 15, y - 30, 30, 18, M(10));
  rect(x - 12, y - 28, 24, 4, M(15));
  px(x - 2, y - 27, M(18)); px(x, y - 27, M(18)); px(x + 2, y - 27, M(18));
  poly([[x - 21, y - 30], [x, y - 42], [x + 21, y - 30]], M(31));
  polyLine([[x - 21, y - 30], [x, y - 42], [x + 21, y - 30]], M(4), false);
  hline(x - 21, y - 31, 42, M(29));
  rect(x - 8, y - 24, 4, 6, M(0)); rect(x + 4, y - 24, 4, 6, M(0));
  px(x - 7, y - 22, M(18)); px(x + 5, y - 22, M(18));
  poly([[x - 8, y + 32], [x - 8, y + 18], [x, y + 8], [x + 8, y + 18], [x + 8, y + 32]], M(0));
  poly([[x - 6, y + 32], [x - 6, y + 19], [x, y + 11], [x + 6, y + 19], [x + 6, y + 32]], M(11));
  vline(x - 2, y + 16, 14, M(9)); vline(x + 2, y + 16, 14, M(9));
  rect(x - 1, y + 22, 2, 8, M(15));
  glowSpot(x, y + 26, 18, 1, 0.4);
  line(x + 22, y - 40, x + 22, y - 66, M(29));
  poly([[x + 23, y - 66], [x + 44, y - 60], [x + 23, y - 50]], M(18));
  line(x + 23, y - 66, x + 44, y - 60, M(19));
  line(x + 26, y - 60, x + 38, y - 58, M(17));
}
function dustGust(t, x0, y0, seed) {
  const x = Math.round(x0 + (((t * 190) % 980) - 180));
  for (let j = 0; j < 26; j++) {
    const yy = y0 - j - Math.round(Math.sin(j * 0.45 + t * 3 + seed) * 4);
    const w = 72 + j * 6;
    for (let i = 0; i < w; i++) {
      if (hash(i + seed * 131, j * 7 + seed) < 0.26 - j * 0.006) px(x + i, yy, j < 5 ? M(4) : j < 13 ? M(3) : M(2));
    }
  }
}
function drawSoldiers(t) {
  const n = 6;
  for (let i = 0; i < n; i++) {
    const s = (t * 0.035 + i * 0.045) % 0.92;
    const [x, y] = pathAt(ROAD, s);
    const bob = Math.round(Math.sin(t * 7 + i * 1.3) * 1);
    const X = Math.round(x) - 2, Y = Math.round(y) - 12 + bob;
    rect(X, Y, 4, 5, M(31));
    px(X + 1, Y - 1, M(14));
    vline(X + 4, Y - 10, 12, M(9));
    px(X + 4, Y - 11, M(18));
    if (i % 3 === 1) { px(X + 4, Y - 13, M(16)); glowSpot(X + 4, Y - 13, 6, 1, 0.55); }
    rect(X, Y + 5, 2, 4, M(0)); rect(X + 2, Y + 5, 2, 4, M(0));
  }
}
// 拐点尽头的洞房小景：红门洞、囍字、双影（接“娶了一个寡妇”）
function miniWedding(x, y, p) {
  if (p <= 0) return;
  rect(x - 34, y + 26, 68, 5, M(2));
  rect(x - 26, y - 34, 52, 4, M(9));
  rect(x - 26, y - 30, 5, 56, M(9));
  rect(x + 21, y - 30, 5, 56, M(9));
  const h = Math.round(52 * p);
  rect(x - 21, y + 26 - h, 42, h, M(17));
  for (let i = 0; i < h; i++) for (let j = 0; j < 42; j++)
    if (hash(x - 21 + j, y + 26 - h + i) < 0.30) px(x - 21 + j, y + 26 - h + i, M(19));
  if (h > 26) {
    const yy = y + 26 - Math.round(h * 0.52);
    disc(x - 7, yy - 16, 3, M(0)); poly([[x - 10, yy - 12], [x - 4, yy - 12], [x - 2, yy + 24], [x - 12, yy + 24]], M(0));
    disc(x + 7, yy - 14, 3, M(0)); poly([[x + 4, yy - 10], [x + 10, yy - 10], [x + 12, yy + 24], [x + 2, yy + 24]], M(0));
  }
  textC('囍', x, y - 26, M(19), 1);
  glowSpot(x, y + 4, 30, 1, 0.34 * p);
}
function sh3_turn(t, f) {
  const jx = Math.round(Math.sin(t * 23.0) * 1.2), jy = Math.round(Math.cos(t * 17.0) * 0.9);
  GX += jx; GY += jy;
  nightSky(f, 31);
  moon(f, 548, 50, 15);
  farMountains(0);
  poly([[-16, 306], [-16, 236], [60, 218], [130, 236], [210, 208], [300, 226], [390, 200], [470, 216], [560, 198], [652, 212], [652, 306]], M(2));
  const crest = [[-16, 252], [72, 238], [144, 212], [224, 218], [292, 192], [368, 198], [444, 174], [540, 192], [652, 178]];
  poly([[-16, 306], ...crest, [652, 306]], E.mtnF);
  polyLine(crest, M(3), false);
  for (let i = 0; i < 14; i++) {
    const x = -10 + i * 50;
    line(x, 214 + (i % 3) * 12, x + 30, 232 + (i % 3) * 8, M(1));
  }
  const ridgeR = [[404, 306], [424, 196], [440, 168], [478, 154], [524, 156], [568, 150], [616, 156], [652, 152], [652, 306]];
  poly(ridgeR, M(1));
  polyLine(ridgeR.slice(0, 8), M(3), false);
  for (let i = 0; i < 6; i++) line(428 + i * 38, 176 + (i % 2) * 10, 466 + i * 32, 306, M(2));
  dithGrad(410, 214, 652, 306, M(1), M(0));
  for (const [px0, py0, s] of [[92, 236, 7], [126, 228, 9], [452, 182, 7], [500, 190, 6], [646, 186, 8]]) {
    poly([[px0 - s, py0], [px0, py0 - Math.round(s * 1.7)], [px0 + s, py0]], M(0));
    polyLine([[px0 - s, py0], [px0, py0 - Math.round(s * 1.7)], [px0 + s, py0]], M(2), false);
  }
  fogPatch(200, 236, 120, 16, M(2), 0.3, f);
  fogPatch(500, 224, 100, 12, M(2), 0.25, f + 42);
  dustGust(t, -80, 272, 1);
  dustGust(t + 1.7, -140, 260, 2);
  drawRoad(t);
  drawFort(t);
  drawSoldiers(t);
  // 红线沿路爬升，在拐点收进城门，再接到门内洞房
  const p = clamp((t - T('turn')) / 1.15, 0, 1);
  const turnPath = [ROAD[0], ROAD[1], ROAD[2], ROAD[3], ROAD[4], ROAD[5], ROAD[6], [392, 192]];
  if (p > 0.55) {
    const k = clamp((p - 0.55) / 0.45, 0, 1);
    glowSpot(FORT[0], FORT[1] + 20, 26, 1, 0.5 * k);
  }
  brushArrow(turnPath, p, M(18));
  // 5.62 起：城门右侧亮起洞房，红线拐进门里 —— “起点就是娶了一个寡妇”
  const wp = clamp((t - T('mark')) / 0.5, 0, 1);
  miniWedding(492, 168, wp);
  if (wp > 0.3) {
    const rp = clamp((wp - 0.3) / 0.7, 0, 1);
    polyPath([[398, 176], [430, 172], [458, 170], [476, 170]], M(18), false, 0, rp);
    glowSpot(476, 170, 8, 1, 0.5 * rp);
  }
  textSC('最大的拐弯', 320, 20, M(15), 2);
  if (t > T('turn') + 0.24) {
    disc(392, 204, 2, M(19));
    glowSpot(392, 204, 10, 1, 0.28 + Math.sin(t * 5.2) * 0.08);
  }
  dustMotes(t, 14, 41, 60, 600, 140, 280, M(5));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 4 · 7.8–10.5 官渡赤壁 vs 那一晚
function fireBanner(x, y, t, h, colA, colB) {
  vline(x, y - h, h, M(9));
  const fl = Math.round(Math.sin(t * 3 + x * 0.1) * 2);
  const pts = [[x + 1, y - h], [x + 26, y - h + 2 + fl], [x + 22, y - h + 16], [x + 2, y - h + 14]];
  poly(pts, colA); polyLine(pts, colB, true);
  px(x + 18, y - h + 7, M(0)); px(x + 12, y - h + 10, M(0));
}
function rider(x, y, t, seed) {
  const ph = Math.sin(t * 9 + seed * 2);
  const bx = Math.round(x), by = y + (ph > 0 ? 0 : 1);
  rect(bx, by, 22, 7, M(0));
  rect(bx + 16, by - 5, 5, 7, M(0));
  poly([[bx + 20, by - 5], [bx + 28, by - 3], [bx + 27, by + 2], [bx + 20, by + 2]], M(0));
  const l1 = ph > 0 ? 3 : 2, l2 = ph > 0 ? 2 : 3;
  rect(bx + 3, by + 7, 2, l1 + 4, M(0));
  rect(bx + 15, by + 7, 2, l2 + 4, M(0));
  rect(bx + 7, by - 9, 5, 9, M(0));
  disc(bx + 9, by - 12, 2, M(0));
  vline(bx + 13, by - 18, 14, M(9));
  px(bx + 13, by - 19, M(18));
  glowSpot(bx + 13, by - 19, 8, 1, 0.30);
}
function sparkField(t, seed, n) {
  for (let i = 0; i < n; i++) {
    const sp = 30 + hash(i, seed) * 46;
    const ph = (t * sp + hash(i, seed + 1) * 240) % 240;
    const x = 20 + Math.floor(hash(i, seed + 2) * 330 + Math.sin(t * 2 + i) * 8);
    const y = 250 - Math.floor(ph);
    px(x, y, i % 4 === 0 ? M(16) : i % 3 === 0 ? M(19) : M(18));
  }
}
function sh4_battle(t, f) {
  const jx = Math.round(Math.sin(t * 19.0) * 1.2), jy = Math.round(Math.cos(t * 15.0) * 0.9);
  GX += jx; GY += jy;
  // 左：大火中的战场
  // 火烧天：分块色阶。高对比 1px 棋盘在 yuv420 编码下会被色度采样糊成噪点，这里改硬色块。
  rect(-8, -8, 656, 118, M(9));
  rect(-8, 110, 656, 42, M(10));
  rect(-8, 152, 656, 34, M(17));
  rect(-8, 186, 656, 28, M(18));
  rect(-8, 214, 656, 32, M(19));
  cloudBand(f * 1.4, 42, 220, 0.16, M(0), M(9));
  cloudBand(f * 2.1, 92, 150, 0.22, M(9), M(17));
  groundPlane(246, t, 4);
  const fk = 0.52 + Math.sin(t * 7.3) * 0.14 + Math.sin(t * 13.1) * 0.06;
  glowSpot(96, 222, 120, 1, 0.34 * fk);
  glowSpot(214, 238, 72, 1, 0.28 * fk);
  fireBanner(58, 238, t, 96, M(17), M(18));
  fireBanner(124, 242, t, 74, M(17), M(19));
  fireBanner(238, 246, t, 108, M(9), M(17));
  for (let i = 0; i < 3; i++) {
    const x = -46 + ((t * 44 + i * 132) % 470);
    rider(x, 246 - i * 9, t + i * 0.17, i);
  }
  sparkField(t, 17, 46);
  // 右：那一晚的红门洞
  rect(452, 246, 176, 58, M(1));
  dithGrad(452, 246, 628, 304, M(1), M(0));
  const wp = clamp((t - 7.9) / 0.5, 0, 1);
  miniWedding(540, 226, wp);
  // 红绸横扫：那一晚盖过大战 —— 整幅绸从右扫入再扫出，留下一帧「红过之后」
  const sp = clamp((t - T('sweep')) / 0.9, 0, 1);
  if (sp > 0 && sp < 1) {
    const w = 660, cx = Math.round(700 - (700 + w) * sp);
    silkCurtain(cx, w, -8, 304, t, M(17), M(18), M(19));
    // 绸边飘线 + 金边反光
    for (let y = 0; y < 304; y++) {
      const r = bay(cx + w - 1, y) < 0.6;
      if (r) px(cx + w - 1, y, M(19));
      for (let i = 0; i < 5; i++) if (bay(cx - i, y) < 0.5 - i * 0.08) px(cx - i, y, M(18));
    }
  }
  textSC('官渡', 58, 12, M(15), 2);
  textSC('赤壁', 186, 12, M(15), 2);
  textSC('那一晚', 536, 12, M(16), 2);
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 5 · 10.5–13.6 宛城
function cityWall(x, y, t) {
  // 城墙、垛口、砖缝
  rect(x - 96, y - 62, 192, 62, M(9));
  rect(x - 96, y - 62, 192, 4, M(10));
  for (let i = 0; i < 10; i++) rect(x - 94 + i * 20, y - 72, 12, 10, M(9));
  for (let r = 0; r < 7; r++) for (let c = 0; c < 10; c++) px(x - 90 + c * 19 + (r % 2) * 9, y - 56 + r * 8, M(10));
  // 角楼
  rect(x - 96, y - 96, 26, 34, M(9));
  rect(x + 70, y - 96, 26, 34, M(9));
  poly([[x - 100, y - 96], [x - 83, y - 106], [x - 66, y - 96]], M(0));
  poly([[x + 66, y - 96], [x + 83, y - 106], [x + 100, y - 96]], M(0));
  // 门楼与匾额
  rect(x - 30, y - 100, 60, 26, M(9));
  rect(x - 26, y - 98, 52, 22, M(28));
  textC('宛城', x, y - 97, M(17), 2);
  poly([[x - 40, y - 100], [x, y - 116], [x + 40, y - 100]], M(0));
  polyLine([[x - 40, y - 100], [x, y - 116], [x + 40, y - 100]], M(10), false);
  hline(x - 40, y - 101, 80, M(29));
  // 门洞与门板
  poly([[x - 20, y], [x - 20, y - 30], [x, y - 46], [x + 20, y - 30], [x + 20, y]], M(0));
  poly([[x - 17, y], [x - 17, y - 29], [x, y - 42], [x + 17, y - 29], [x + 17, y]], M(11));
  vline(x - 5, y - 34, 34, M(9)); vline(x + 5, y - 34, 34, M(9));
  rect(x - 2, y - 26, 4, 10, M(15));
  glowSpot(x, y - 18, 30, 1, 0.42);
  // 火盆
  for (const bx of [x - 70, x + 70]) {
    rect(bx - 4, y - 78, 8, 6, M(9));
    blit(CAO_FLAME[Math.floor(t * 12 + bx) % 4], bx - 4, y - 86, 1);
    glowSpot(bx, y - 84, 26, 1, 0.5 + Math.sin(t * 8 + bx) * 0.06);
  }
  // 旗
  line(x + 88, y - 96, x + 88, y - 132, M(29));
  const fl = Math.round(Math.sin(t * 3.2) * 2);
  poly([[x + 89, y - 132], [x + 116, y - 128 + fl], [x + 112, y - 112], [x + 89, y - 114]], M(17));
  polyLine([[x + 89, y - 132], [x + 116, y - 128 + fl], [x + 112, y - 112], [x + 89, y - 114]], M(18), true);
}
function sh5_wancheng(t, f) {
  const jx = Math.round(Math.sin(t * 11.0) * 0.9), jy = Math.round(Math.cos(t * 9.0) * 0.7);
  GX += jx; GY += jy;
  nightSky(f, 43);
  moon(f, 98, 46, 17);
  farMountains(0);
  poly([[-16, 306], [-16, 250], [40, 236], [110, 250], [180, 232], [250, 246], [320, 228], [400, 240], [470, 226], [540, 238], [610, 224], [652, 232], [652, 306]], M(2));
  groundPlane(220, t, 9);
  // 进城的土路
  thickLine(120, 304, 470, 262, 9, M(4));
  thickLine(120, 304, 470, 262, 6, M(5));
  for (let s = 0; s < 1; s += 0.05) {
    const [x, y] = pathAt([[120, 304], [470, 262]], s);
    px(Math.round(x), Math.round(y), M(6));
  }
  cityWall(470, 262, t);
  // 红线：从画面左侧进城
  const p = clamp((t - T('arrive')) / 1.4, 0, 1);
  polyPath([[6, 300], [140, 292], [260, 284], [360, 276], [430, 268], [470, 262]], M(18), false, 0, p);
  polyPath([[6, 301], [140, 293], [260, 285], [360, 277], [430, 269], [470, 262]], M(17), false, 0, p);
  if (p > 0.2) {
    const [tx, ty] = pathAt([[6, 300], [140, 292], [260, 284], [360, 276], [430, 268], [470, 262]], p);
    glowSpot(Math.round(tx), Math.round(ty), 8, 1, 0.5);
  }
  // 城头铭牌：宛城
  if (t > T('city')) {
    const k = clamp((t - T('city')) / 0.3, 0, 1);
    textSC('宛城', 300, 34 + Math.round((1 - k) * 6), M(15), 3);
    hline(228, 82, 144, M(18));
  }
  dustMotes(t, 16, 47, 40, 620, 120, 280, M(6));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 6 · 13.6–15.2 公元一九七
function sh6_year(t, f) {
  const jx = Math.round(Math.sin(t * 7.0) * 1.2), jy = Math.round(Math.cos(t * 5.3) * 0.9);
  GX += jx; GY += jy;
  dithGrad(-8, -8, 648, 304, M(31), M(0));
  for (let y = 0; y < 304; y++) for (let x = 0; x < 640; x++) {
    if (hash(x, y) < 0.04) px(x, y, M(1));
    if (hash(x + 7, y + 3) < 0.012) px(x, y, M(9));
  }
  // 碑体
  const settle = t < T('year') ? Math.round(20 * (1 - clamp((t - 13.16) / 0.46, 0, 1))) : 0;
  const plate = (dt) => {
    const x = 168, y = 42 + dt, w = 304, h = 246;
    rect(x, y, w, h, M(10));
    rect(x + 5, y + 5, w - 10, h - 10, M(31));
    rect(x + 9, y + 9, w - 18, h - 18, M(1));
    for (let j = 0; j < h - 18; j++) for (let i = 0; i < w - 18; i++)
      if (hash(x + i, y + j) < 0.05) px(x + 10 + i, y + 10 + j, M(31));
    hline(x + 5, y + 5, w - 10, M(13));
    hline(x + 5, y + h - 6, w - 10, M(0));
    vline(x + 5, y + 5, h - 10, M(13));
    vline(x + w - 6, y + 5, h - 10, M(0));
  };
  plate(settle);
  // 碑文
  textC('公元', 320, 66 + settle, M(8), 2);
  hline(244, 96 + settle, 152, M(29));
  textC('197', 320, 112 + settle, ((f >> 3) & 1) ? M(16) : M(15), 5);
  hline(244, 236 + settle, 152, M(29));
  textC('年', 320, 244 + settle, M(8), 2);
  // 落碑尘
  if (t >= T('year') && t < T('year') + 0.34) {
    const age = t - T('year');
    for (let i = 0; i < 40; i++) {
      const a = hash(i, 71) * 6.283, r = 30 + age * 220 * (0.4 + hash(i, 72));
      px(Math.round(320 + Math.cos(a) * r), Math.round(288 - Math.abs(Math.sin(a)) * age * 120), M(12));
    }
  }
  // 烛台与光
  candle(96, 196, t, 1);
  glowSpot(96, 210, 110, 1, 0.28 + Math.sin(t * 8.3) * 0.04);
  dustMotes(t, 20, 61, 60, 600, 60, 290, M(5));
  // 浮尘漂移：给这一镜一条持续的动线（最长静止段压到 0.6 s 内）
  for (let i = 0; i < 34; i++) {
    const sp = 10 + (i % 6) * 4;
    const x = Math.round(((i * 61 + t * sp) % 668) - 14);
    const y = Math.round(36 + ((i * 43 + t * (5 + (i % 4) * 2) + Math.sin(t * 0.8 + i) * 16) % 258));
    const b = Math.sin(t * 5.5 + i * 1.9);
    if (b > -0.2) px(x, y, b > 0.75 ? M(12) : M(3));
  }
  const gp = 0.30 + Math.sin(t * 3.1) * 0.05;
  glowSpot(320, 180, 150, 1, gp * 0.22);
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 7 · 15.2–18.5 张绣是谁
function drawZhangXiu(x, y, t, opt = {}) {
  const br = Math.round(Math.sin(t * 2.2) * 1), sw = Math.round(Math.sin(t * 1.3) * 1);
  const X = x + sw, Y = y + br;
  // 长戟（先画，压在身后）
  line(X + 110, Y - 34, X + 110, Y + 200, M(9));
  line(X + 111, Y - 34, X + 111, Y + 200, M(10));
  poly([[X + 102, Y - 34], [X + 118, Y - 36], [X + 110, Y - 52]], M(31));
  polyLine([[X + 102, Y - 34], [X + 118, Y - 36], [X + 110, Y - 52]], M(6), true);
  // 披风
  const cape = [[X + 42, Y + 56], [X + 72, Y + 52], [X + 100, Y + 74], [X + 106, Y + 150], [X + 96, Y + 196], [X + 20, Y + 196], [X + 6, Y + 150], [X + 10, Y + 74]];
  poly(cape, M(10)); polyLine(cape, M(0), true);
  dithGrad(X + 12, Y + 90, X + 100, Y + 192, M(10), M(9));
  // 甲身
  poly([[X + 28, Y + 84], [X + 74, Y + 80], [X + 92, Y + 96], [X + 90, Y + 158], [X + 70, Y + 170], [X + 32, Y + 170], [X + 26, Y + 154], [X + 26, Y + 100]], M(11));
  for (let r = 0; r < 6; r++) {
    const yy = Y + 96 + r * 11;
    line(X + 30, yy, X + 89, yy, r % 2 ? M(13) : M(10));
    for (let c = 0; c < 5; c++) px(X + 36 + c * 12, yy + 4, M(15));
  }
  // 肩甲
  const shL = [[X + 16, Y + 70], [X + 42, Y + 62], [X + 50, Y + 76], [X + 44, Y + 94], [X + 20, Y + 92]];
  const shR = [[X + 78, Y + 62], [X + 104, Y + 70], [X + 106, Y + 92], [X + 82, Y + 94], [X + 74, Y + 76]];
  poly(shL, M(13)); polyLine(shL, M(15), true);
  poly(shR, M(13)); polyLine(shR, M(15), true);
  // 皮草领
  const collar = [[X + 38, Y + 56], [X + 52, Y + 48], [X + 66, Y + 52], [X + 80, Y + 48], [X + 94, Y + 58], [X + 84, Y + 70], [X + 72, Y + 64], [X + 60, Y + 70], [X + 48, Y + 64], [X + 38, Y + 70]];
  poly(collar, M(10));
  for (let i = 0; i < 26; i++) px(X + 41 + Math.floor(hash(i, 14) * 52), Y + 53 + Math.floor(hash(i, 19) * 13), hash(i, 17) < 0.5 ? M(12) : M(14));
  polyLine(collar, M(0), true);
  // 脖子与脸（年轻武将，无须）
  rect(X + 54, Y + 70, 14, 12, M(13));
  const face = [[X + 44, Y + 40], [X + 52, Y + 30], [X + 66, Y + 29], [X + 78, Y + 38], [X + 80, Y + 56], [X + 70, Y + 70], [X + 56, Y + 72], [X + 45, Y + 60], [X + 41, Y + 48]];
  poly(face, M(14));
  polyD([[X + 44, Y + 40], [X + 50, Y + 32], [X + 48, Y + 70], [X + 41, Y + 48]], M(13), 1);
  px(X + 72, Y + 44, M(15)); px(X + 73, Y + 46, M(15));
  line(X + 47, Y + 45, X + 57, Y + 44, M(0));
  line(X + 65, Y + 44, X + 75, Y + 45, M(0));
  line(X + 48, Y + 48, X + 56, Y + 48, M(0));
  line(X + 66, Y + 48, X + 74, Y + 48, M(0));
  line(X + 61, Y + 47, X + 58, Y + 57, M(13));
  hline(X + 56, Y + 63, 10, M(12));
  // 头盔：铁盔 + 金边 + 红缨
  poly([[X + 42, Y + 30], [X + 44, Y + 18], [X + 60, Y + 10], [X + 76, Y + 18], [X + 78, Y + 30]], M(9));
  polyLine([[X + 42, Y + 30], [X + 44, Y + 18], [X + 60, Y + 10], [X + 76, Y + 18], [X + 78, Y + 30]], M(0), false);
  rect(X + 43, Y + 27, 34, 4, M(15)); hline(X + 43, Y + 27, 34, M(16));
  line(X + 60, Y + 10, X + 60, Y + 2, M(15));
  for (let i = 0; i < 12; i++) {
    const wob = Math.round(Math.sin(t * 2.4 + i * 0.45) * 2);
    px(X + 60 + wob - Math.round(i * 0.3), Y + 1 - i, i % 3 ? M(18) : M(19));
  }
  // 红臂甲 + 手按戟杆
  poly([[X + 84, Y + 80], [X + 102, Y + 84], [X + 110, Y + 120], [X + 94, Y + 130], [X + 86, Y + 108]], M(11));
  polyLine([[X + 84, Y + 80], [X + 102, Y + 84], [X + 110, Y + 120], [X + 94, Y + 130], [X + 86, Y + 108]], M(15), true);
  poly([[X + 100, Y + 116], [X + 112, Y + 118], [X + 114, Y + 132], [X + 102, Y + 132]], M(14));
  // 腿靴
  rect(X + 40, Y + 168, 18, 28, M(9));
  rect(X + 64, Y + 168, 18, 28, M(9));
  rect(X + 37, Y + 192, 23, 8, M(0));
  rect(X + 62, Y + 192, 23, 8, M(0));
  line(X + 20, Y + 197, X + 104, Y + 197, M(9));
}
function sh7_zhangxiu(t, f) {
  const jx = Math.round(Math.sin(t * 10.0) * 0.9), jy = Math.round(Math.cos(t * 8.0) * 0.7);
  GX += jx; GY += jy;
  nightSky(f, 57);
  moon(f, 560, 42, 15);
  farMountains(0);
  groundPlane(252, t, 13);
  // 营帐剪影（左远）
  for (const [tx, ty, tw, th] of [[30, 252, 56, 34], [96, 252, 44, 26], [562, 252, 52, 30]]) {
    poly([[tx, ty], [tx + tw / 2, ty - th], [tx + tw, ty]], M(1));
    polyLine([[tx, ty], [tx + tw / 2, ty - th], [tx + tw, ty]], M(3), false);
    vline(tx + tw / 2, ty - th, th, M(2));
  }
  // 高脚火盆
  vline(300, 210, 42, M(9));
  rect(292, 204, 17, 6, M(9));
  blit(CAO_FLAME[Math.floor(t * 12) % 4], 296, 194, 1);
  glowSpot(300, 196, 30, 1, 0.5);
  // 张济画像
  const fx = 64, fy = 84, fw = 132, fh = 126;
  rect(fx - 6, fy - 6, fw + 12, fh + 12, M(9));
  rect(fx, fy, fw, fh, M(1));
  for (let j = 0; j < fh; j++) for (let i = 0; i < fw; i++)
    if (hash(fx + i, fy + j) < 0.07) px(fx + i, fy + j, M(2));
  // 老人半身：官帽、长须、褐袍
  poly([[fx + 34, fy + 92], [fx + 46, fy + 56], [fx + 88, fy + 56], [fx + 100, fy + 92], [fx + 100, fy + 120], [fx + 32, fy + 120]], M(10));
  disc(fx + 66, fy + 44, 19, M(14));
  poly([[fx + 40, fy + 42], [fx + 44, fy + 22], [fx + 66, fy + 16], [fx + 90, fy + 24], [fx + 92, fy + 42], [fx + 80, fy + 30], [fx + 66, fy + 28], [fx + 50, fy + 32]], M(31));
  rect(fx + 46, fy + 14, 40, 10, M(0));
  hline(fx + 42, fy + 24, 48, M(15));
  line(fx + 50, fy + 42, fx + 58, fy + 41, M(0)); line(fx + 74, fy + 41, fx + 82, fy + 42, M(0));
  // 长须
  poly([[fx + 50, fy + 58], [fx + 66, fy + 64], [fx + 82, fy + 58], [fx + 86, fy + 86], [fx + 66, fy + 100], [fx + 46, fy + 86]], M(8));
  for (let i = 0; i < 5; i++) line(fx + 54 + i * 5, fy + 66, fx + 55 + i * 5, fy + 90, M(27));
  hline(fx - 6, fy - 6, fw + 12, M(13));
  vline(fx - 6, fy - 6, fh + 12, M(13));
  textC('叔父 · 张济', fx + fw / 2, fy + fh + 16, M(16), 2);
  // 张绣
  drawZhangXiu(392, 78, t, {});
  textSC('张绣', 452, 24, M(15), 2);
  // 叔侄红线
  const p = clamp((t - T('uncle')) / 0.5, 0, 1);
  const kin = [[206, 150], [262, 146], [318, 138], [372, 128], [392, 120]];
  polyPath(kin, M(18), false, 0, p);
  polyPath(kin.map(([a, b]) => [a, b + 1]), M(17), false, 0, p);
  if (p >= 1) glowSpot(392, 120, 12, 1, 0.35 + Math.sin(t * 4) * 0.08);
  // 画像烛光
  candle(232, 214, t, 0.6);
  glowSpot(232, 224, 60, 1, 0.22);
  dustMotes(t, 18, 73, 40, 600, 90, 280, M(6));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 8 · 18.5–20.6 张济死了，张绣接管部队
function memorialTablet(x, y, t) {
  // 白绫背景
  for (let i = 0; i < 74; i++) {
    const wob = Math.round(Math.sin(t * 1.2 + i * 0.18) * 2);
    for (let j = 0; j < 150; j++) px(x - 37 + i + wob, y - 40 + j, (j / 150) > 0.82 ? M(27) : M(28));
  }
  for (let i = 0; i < 74; i += 9) {
    const wob = Math.round(Math.sin(t * 1.2 + i * 0.18) * 2);
    vline(x - 37 + i + wob, y - 40, 150, M(26));
  }
  // 灵位
  rect(x - 24, y - 24, 48, 96, M(9));
  rect(x - 21, y - 21, 42, 90, M(31));
  textC('张', x, y - 12, M(28), 2);
  textC('济', x, y + 16, M(28), 2);
  rect(x - 30, y + 72, 60, 8, M(9));
  hline(x - 30, y + 72, 60, M(11));
  rect(x - 34, y + 80, 68, 4, M(9));
  // 香炉
  rect(x - 12, y + 96, 24, 8, M(10));
  rect(x - 8, y + 92, 16, 5, M(31));
  for (let i = 0; i < 3; i++) {
    vline(x - 6 + i * 6, y + 82, 10, M(11));
    const ph = (t * 0.5 + i * 0.3) % 1;
    px(x - 6 + i * 6 + Math.round(Math.sin(t * 2 + i) * 3), y + 80 - Math.round(ph * 26), M(6));
  }
  // 两支白烛
  for (const cx of [x - 52, x + 52]) {
    rect(cx - 2, y + 74, 4, 20, M(28));
    rect(cx - 4, y + 94, 8, 3, M(10));
    blit(CAO_FLAME[Math.floor(t * 10 + cx) % 4], cx - 3, y + 68, 1);
    glowSpot(cx, y + 72, 22, 1, 0.4);
  }
  glowSpot(x, y + 70, 60, 1, 0.20);
}
function sh8_death(t, f) {
  const jx = Math.round(Math.sin(t * 9.0) * 0.8), jy = Math.round(Math.cos(t * 7.0) * 0.6);
  GX += jx; GY += jy;
  // 帐内
  woodWall(t);
  rect(-10, 270, 660, 34, M(0));
  memorialTablet(206, 130, t);
  // 左：白幡
  line(54, 40, 54, 284, M(9));
  const fl = Math.round(Math.sin(t * 2.4) * 3);
  poly([[55, 52], [94, 56 + fl], [90, 104], [55, 100]], M(28));
  polyLine([[55, 52], [94, 56 + fl], [90, 104], [55, 100]], M(26), true);
  textC('奠', 74, 66, M(31), 2);
  // 落灰
  for (let i = 0; i < 26; i++) {
    const ph = (t * 0.28 + hash(i, 5)) % 1;
    px(26 + Math.floor(hash(i, 3) * 280), 20 + Math.round(ph * 250), hash(i, 7) < 0.3 ? M(8) : M(27));
  }
  // 右：铜印与兵符，红绸托底
  rect(438, 246, 140, 6, M(17));
  hline(438, 246, 140, M(18));
  rect(452, 214, 112, 32, M(17));
  dithGrad(452, 214, 564, 246, M(17), M(9));
  // 印
  const on = t >= T('handover');
  const lift = on ? Math.round(4 * (1 - clamp((t - T('handover')) / 0.3, 0, 1))) : 0;
  const sx = 486, sy = 186 - lift;
  rect(sx - 4, sy + 34, 56, 8, M(9));
  rect(sx, sy + 12, 48, 24, M(29));
  rect(sx + 3, sy + 15, 42, 18, M(15));
  poly([[sx + 20, sy + 12], [sx + 18, sy], [sx + 30, sy - 8], [sx + 42, sy], [sx + 40, sy + 12]], M(29));
  vline(sx + 30, sy - 12, 22, M(15));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) px(sx + 8 + i * 10, sy + 19 + j * 6, M(10));
  if (on) {
    glowSpot(sx + 24, sy + 20, 34, 1, 0.5 + Math.sin(t * 5) * 0.1);
    textSC('兵权', 508, 118, M(15), 2);
  } else {
    glowSpot(sx + 24, sy + 20, 26, 1, 0.16);
  }
  // 兵符旗
  const un = on ? clamp((t - T('handover')) / 0.45, 0, 1) : 0;
  line(596, 96, 596, 250, M(9));
  if (un > 0) {
    const w = Math.round(48 * un);
    poly([[597, 104], [597 + w, 108 + Math.round(Math.sin(t * 3) * 2)], [597 + w - 3, 138], [597, 134]], M(17));
    polyLine([[597, 104], [597 + w, 108 + Math.round(Math.sin(t * 3) * 2)], [597 + w - 3, 138], [597, 134]], M(18), true);
    textC('张', 619, 112, M(28), 2);
  }
  emberField(t, 33, 22);
  dustMotes(t, 14, 79, 40, 600, 80, 270, M(6));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 9 · 20.6–24.3 兵不血刃
const DAWN = { skyA: M(2), skyB: M(4), skyC: M(6) };
function cityGate(x, y, t, flagC1, flagC2) {
  // 夯土城墙 + 门楼（兵不血刃版：白旗）
  rect(x - 88, y - 56, 176, 56, M(10));
  rect(x - 88, y - 56, 176, 4, M(12));
  for (let i = 0; i < 9; i++) rect(x - 86 + i * 20, y - 66, 12, 10, M(10));
  for (let r = 0; r < 6; r++) for (let c = 0; c < 9; c++) px(x - 82 + c * 20 + (r % 2) * 10, y - 50 + r * 8, M(9));
  rect(x - 26, y - 92, 52, 24, M(10));
  rect(x - 22, y - 90, 44, 20, M(28));
  textC('宛城', x, y - 89, M(17), 2);
  poly([[x - 34, y - 92], [x, y - 106], [x + 34, y - 92]], M(0));
  polyLine([[x - 34, y - 92], [x, y - 106], [x + 34, y - 92]], M(11), false);
  // 大门敞开
  poly([[x - 18, y], [x - 18, y - 26], [x, y - 40], [x + 18, y - 26], [x + 18, y]], M(0));
  poly([[x - 21, y], [x - 21, y - 26], [x - 16, y - 27], [x - 16, y]], M(11));
  poly([[x + 21, y], [x + 21, y - 26], [x + 16, y - 27], [x + 16, y]], M(11));
  glowSpot(x, y - 16, 30, 1, 0.34);
  // 旗（白）
  line(x + 64, y - 92, x + 64, y - 132, M(29));
  const fl = Math.round(Math.sin(t * 2.8) * 2);
  poly([[x + 65, y - 132], [x + 92, y - 128 + fl], [x + 88, y - 112], [x + 65, y - 114]], flagC1);
  polyLine([[x + 65, y - 132], [x + 92, y - 128 + fl], [x + 88, y - 112], [x + 65, y - 114]], flagC2, true);
  textC('降', x + 79, y - 124, M(18), 1);
}
function spearRow(x0, y, n, dir, k, seed) {
  for (let i = 0; i < n; i++) {
    const bx = x0 + i * 24;
    const ang = k * 1.05;
    const tx = bx + Math.round(Math.sin(ang) * 30 * dir);
    const ty = y - Math.round(Math.cos(ang) * 30);
    line(bx, y, tx, ty, M(9));
    px(tx, ty, M(6));
    const bob = Math.round(Math.sin(seed + i) * 0.5);
    rect(bx - 3, y + 2 + bob, 6, 10, M(0));
    rect(bx - 5, y + 3 + bob, 10, 3, M(10));
  }
}
function sh9_bloodless(t, f) {
  const jx = Math.round(Math.sin(t * 8.0) * 0.7), jy = Math.round(Math.cos(t * 6.0) * 0.5);
  GX += jx; GY += jy;
  // 破晓
  skyBand(-8, 150, DAWN.skyA, DAWN.skyB);
  skyBand(150, 244, DAWN.skyB, DAWN.skyC);
  // 低日
  disc(516, 120, 24, M(14));
  glowSpot(516, 120, 90, 1, 0.22);
  cloudBand(f * 0.8, 84, 180, 0.05, M(5), M(6));
  farMountains(0);
  groundPlane(236, t, 21);
  cityGate(300, 256, t, M(28), M(27));
  // 两军对列：左曹（蓝），右张（红褐）
  const k = clamp((t - T('surrender')) / 0.45, 0, 1);
  spearRow(24, 268, 8, 1, k, 3);
  spearRow(438, 268, 7, -1, k, 9);
  for (const [bx, by, c1, c2] of [[10, 232, M(2), M(4)], [96, 236, M(2), M(4)], [452, 234, M(17), M(18)], [548, 238, M(17), M(18)]]) {
    line(bx, by, bx, by - 58, M(9));
    const fl = Math.round(Math.sin(t * 2.6 + bx) * 2);
    poly([[bx + 1, by - 58], [bx + 30, by - 54 + fl], [bx + 27, by - 36], [bx + 1, by - 40]], c1);
    polyLine([[bx + 1, by - 58], [bx + 30, by - 54 + fl], [bx + 27, by - 36], [bx + 1, by - 40]], c2, true);
  }
  // 白旗升起
  const rf = clamp((t - T('surrender')) / 0.5, 0, 1);
  if (rf > 0) {
    vline(300, 152 - Math.round(46 * rf), Math.round(46 * rf), M(29));
    const fh = Math.round(20 * rf);
    rect(301, 152 - Math.round(46 * rf), 34, fh, M(28));
    rect(301, 152 - Math.round(46 * rf) + fh - 1, 34, 1, M(27));
    textC('降', 318, 152 - Math.round(46 * rf) + 3, M(18), 1);
    glowSpot(318, 150 - Math.round(46 * rf), 26, 1, 0.22 * rf);
  }
  // 收编契约
  const up = clamp((t - T('deal')) / 0.5, 0, 1);
  if (up > 0) {
    const w = Math.round(150 * up);
    rect(430, 186, w, 76, M(28));
    polyLine([[430, 186], [430 + w, 186], [430 + w, 262], [430, 262]], M(12), true);
    for (let i = 0; i < Math.max(0, w - 12); i++) {
      if (i % 3 === 0) px(436 + i, 200, M(27));
      if (i % 4 === 0) px(436 + i, 220, M(27));
      if (i % 3 === 0) px(436 + i, 240, M(27));
    }
    if (t > T('deal') + 0.45) {
      const lt = t - T('deal') - 0.45;
      const drop = lt < 0.1 ? Math.round(34 * (1 - lt / 0.1) ** 2) : 0;
      sealStamp(494, 174 + drop, 76, '收编', true);
    }
  }
  // 飞鸟
  for (let i = 0; i < 3; i++) {
    const bx = 90 + i * 34 + Math.round(Math.sin(t * 0.8 + i) * 8);
    const by = 58 + i * 9;
    const fl = Math.sin(t * 8 + i) > 0 ? 1 : -1;
    line(bx - 3, by, bx, by - 2 * fl, M(0));
    line(bx, by - 2 * fl, bx + 3, by, M(0));
  }
  dustMotes(t, 16, 83, 40, 600, 140, 280, M(6));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 10 · 24.3–27.9 曹操看上了邹氏
function sh10_sees(t, f) {
  const jx = Math.round(Math.sin(t * 12.0) * 0.8), jy = Math.round(Math.cos(t * 9.0) * 0.6);
  GX += jx; GY += jy;
  woodWall(t);
  rect(-10, 284, 660, 20, M(0));
  silkCurtain(16, 66, 46, 288, t);
  silkCurtain(556, 66, 46, 288, t);
  hangingLantern(292, 40, t, 1);
  hangingLantern(520, 44, t, 1);
  glowSpot(304, 88, 90, 1, 0.14);
  // 地毯
  rect(40, 258, 520, 6, M(17));
  hline(40, 258, 520, M(18));
  // 曹操
  drawCao2(96, 82, t, { glint: Math.sin(t * 1.7) > 0.92 });
  // 邹氏（198 年宛城，张济遗孀，素服 + 面纱）
  drawZou2(388, 102, t, { veil: t < T('zou') ? 1 : 0 });
  // 案
  lowTable(418, 264, 96);
  // 凝视红线
  const p = clamp((t - T('see')) / 0.75, 0, 1);
  const eyeA = [166, 130], eyeB = [442, 136];
  const N = 30;
  for (let i = 0; i <= N * p; i++) {
    const u = i / N;
    const [x, y] = qPoint(eyeA, [306, 120], eyeB, u);
    if (i % 3 === 0) px(Math.round(x), Math.round(y), M(18));
  }
  if (p > 0.15) {
    const u = (t * 0.5) % 1;
    const [x, y] = qPoint(eyeA, [306, 120], eyeB, u);
    px(Math.round(x), Math.round(y), M(19));
    glowSpot(Math.round(x), Math.round(y), 7, 1, 0.4);
  }
  textSC('邹氏', 452, 44, M(15), 2);
  // 姓邹：朱印落在案边
  if (t > T('zou')) {
    const lt = t - T('zou');
    const drop = lt < 0.1 ? Math.round(30 * (1 - lt / 0.1) ** 2) : 0;
    sealStamp(486, 190 + drop, 66, '邹', true);
  }
  dustMotes(t, 20, 91, 40, 600, 40, 280, M(5));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 11 · 27.9–29.4 直接纳了
function sh11_take(t, f) {
  // 深红底：8 条实色横带（不用 1px 棋盘——色度采样会糊）
  for (let i = 0; i < 8; i++) {
    const c = mixIdx(17, 9, i / 7), y0 = Math.round(-8 + i * 40), y1 = Math.round(-8 + (i + 1) * 40 + 1);
    rect(-8, y0, 656, y1 - y0, M(c));
  }
  for (let y = 0; y < 304; y++) for (let x = 0; x < 640; x++) {
    if (hash(x, y) < 0.02) px(x, y, M(9));
    if (hash(x + 5, y + 2) < 0.008) px(x, y, M(18));
  }
  // 背景囍（暗纹）
  textC('囍', 320, 24, M(9), 6);
  const k = clamp((t - T('take')) / 0.42, 0, 1);
  const lx = Math.round(222 - 26 * (1 - k));
  const rx = Math.round(418 + 26 * (1 - k));
  // 左臂：曹操红袍
  poly([[lx - 150, 148], [lx - 30, 138], [lx + 8, 168], [lx - 8, 216], [lx - 168, 230]], M(17));
  polyLine([[lx - 150, 148], [lx - 30, 138], [lx + 8, 168], [lx - 8, 216], [lx - 168, 230]], M(18), true);
  line(lx - 90, 168, lx - 70, 210, M(18));
  // 右臂：邹氏素袖
  poly([[rx + 150, 148], [rx + 30, 138], [rx - 8, 168], [rx + 8, 216], [rx + 168, 230]], M(28));
  polyLine([[rx + 150, 148], [rx + 30, 138], [rx - 8, 168], [rx + 8, 216], [rx + 168, 230]], M(26), true);
  line(rx + 90, 168, rx + 70, 210, M(27));
  // 手
  poly([[lx - 14, 168], [lx + 22, 164], [lx + 34, 184], [lx + 22, 204], [lx - 16, 200]], M(14));
  for (let i = 0; i < 4; i++) rect(lx + 26, 168 + i * 9, 16, 5, M(14));
  line(lx + 26, 172, lx + 42, 172, M(13));
  poly([[rx + 14, 168], [rx - 22, 164], [rx - 34, 184], [rx - 22, 204], [rx + 16, 200]], M(28));
  for (let i = 0; i < 4; i++) rect(rx - 42, 168 + i * 9, 16, 5, M(28));
  line(rx - 26, 172, rx - 42, 172, M(27));
  // 红绸缠绕
  const knot = [320, 206 + Math.round(Math.sin(t * 2.4))];
  for (let i = 0; i <= 44; i++) {
    const u = i / 44;
    const [x, y] = qPoint([lx - 4, 210], [306, 150], [rx + 4, 210], u);
    const w = Math.round(Math.sin(t * 3.4 + u * 8) * 2);
    px(Math.round(x), Math.round(y + w), i % 6 < 4 ? M(19) : M(18));
    px(Math.round(x), Math.round(y + w + 1), M(17));
  }
  const kf = CAO_SILK[Math.min(3, Math.floor(Math.max(0, t - T('take')) * 12) % 4)];
  blit(kf, knot[0] - 16, knot[1] - 7, 2);
  glowSpot(knot[0], knot[1], 26, 1, 0.4);
  // 纳：朱印砸下
  if (t > T('nazhao')) {
    const lt = t - T('nazhao');
    const drop = lt < 0.1 ? Math.round(36 * (1 - lt / 0.1) ** 2) : 0;
    sealStamp(482, 96 + drop, 74, '纳', true);
    if (lt < 0.18) {
      for (let i = 0; i < 20; i++) {
        const a = hash(i, 91) * 6.283, r = 42 + hash(i, 92) * 24;
        px(Math.round(519 + Math.cos(a) * r), Math.round(133 + Math.sin(a) * r), i % 3 ? M(18) : M(9));
      }
    }
  }
  emberField(t, 101, 34);
  dustMotes(t, 16, 97, 40, 600, 80, 280, M(19));
}

// 第 1–11 镜注册（全片构建时 40-scenes-full.js 会按顺序追加第 12–45 镜）
SHOTS.push(sh1_widow, sh2_map, sh3_turn, sh4_battle, sh5_wancheng, sh6_year,
  sh7_zhangxiu, sh8_death, sh9_bloodless, sh10_sees, sh11_take);
// ---------------------------------------------------------------- 案几（酒器）
function lowTable(x, y, w) {
  rect(x - 4, y, w + 8, 6, M(11));
  hline(x - 4, y, w + 8, M(12));
  rect(x + 4, y + 6, 6, 42, M(9));
  rect(x + w - 10, y + 6, 6, 42, M(9));
  for (const cx of [x + 26, x + w - 26]) {
    rect(cx - 4, y - 9, 8, 9, M(28));
    hline(cx - 4, y - 9, 8, M(8));
    px(cx - 2, y - 11, M(6)); px(cx + 2, y - 13, M(6));
  }
}

// ---------------------------------------------------------------- transitions / subtitle / CRT
const CUTS = cues.cuts;
function shotIndex(t) { for (let i = 0; i < CUTS.length; i++) if (t < CUTS[i]) return i; return CUTS.length; }
function transAt(t) {
  for (let i = 0; i < CUTS.length; i++) {
    const age = t - CUTS[i];
    if (age >= 0 && age < 4 / FPS) return { prev: i, p: (age * FPS + 1) / 4 };
  }
  return null;
}
function mixCols(a, b, p) {
  const g = 12, n = Math.ceil(W / g);
  for (let k = 0; k < n; k++) {
    if (p <= ((k * 5) % n) / n) continue;
    const x0 = k * g, x1 = Math.min(W, x0 + g);
    for (let y = 0; y < H; y++) { const o = y * W; for (let x = x0; x < x1; x++) a[o + x] = b[o + x]; }
  }
}
function padEdges() {
  for (let y = 0; y < H; y++) {
    const o = y * W;
    for (let x = 0; x < 10; x++) { IB[o + x] = IB[o + 10]; IB[o + W - 1 - x] = IB[o + W - 11]; }
  }
}
function subtitle(t, f) {
  let s = null;
  for (const c of cues.subs) if (t >= c.t0 - 0.02 && t < c.t1) { s = c; break; }
  if (!s) for (const c of cues.subs) if (t >= c.t1 && t < c.t1 + 0.08) { s = c; break; }
  if (!s) return;
  const SC = 2, bandY = 304;
  rect(0, bandY, W, H - bandY, M(0));
  for (let y = bandY + 2; y < H; y++) for (let x = 0; x < W; x++) if ((x + y) & 1) px(x, y, M(31));
  hline(0, bandY, W, M(29));
  hline(0, bandY + 1, W, M(0));
  const full = s.text;
  const shown = Math.min(full.length, Math.max(1, Math.floor((t - s.t0) / 0.026) + 1));
  const vis = full.slice(0, shown);
  let total = 0; for (const ch of vis) total += textW(ch) * SC;
  let x = Math.round((W - total) / 2);
  const hl = s.hl || '', hi = hl ? full.indexOf(hl) : -1;
  for (let i = 0; i < vis.length; i++) {
    const gold = hi >= 0 && i >= hi && i < hi + hl.length;
    text(vis[i], x + 2, 316 + 2, M(0), SC);
    text(vis[i], x, 316, gold ? M(15) : M(8), SC);
    x += textW(vis[i]) * SC;
  }
}
function shakeXY(t) {
  let amp = 0;
  for (const [tt, a] of [[T('stamp'), 3], [T('battle'), 3], [T('sweep'), 2], [T('year'), 2],
    [T('death'), 2], [T('handover'), 2], [T('surrender'), 2], [T('deal'), 2], [T('take'), 2], [T('nazhao'), 3]]) {
    if (t >= tt && t < tt + 0.22) amp = Math.max(amp, Math.round(a * (1 - (t - tt) / 0.22)));
  }
  if (!amp) return [0, 0];
  const f = Math.round(t * FPS);
  return [Math.round(Math.sin(f * 2.7) * amp), Math.round(Math.cos(f * 3.1) * amp)];
}
function fadeEdges(t) {
  let k = 0;
  if (t < 0.16) k = 1 - t / 0.16;
  if (t > cues.duration - 0.16) k = Math.max(k, (t - (cues.duration - 0.16)) / 0.16);
  if (k <= 0.001) return;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if ((bay(x, y) * 0.7 + hash(x, y) * 0.3) < k) IB[y * W + x] = 0;
  }
}

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const small = document.createElement('canvas'); small.width = W; small.height = H;
const sctx = small.getContext('2d');
const simg = sctx.createImageData(W, H);
// 原生 640×360 索引色栅格，整数 ×3 最近邻 = 1920×1080；CRT 在输出分辨率上做
const FW = 640, FH = 360, UP = 3;
const OUTW = FW * UP, OUTH = FH * UP;
const scan = document.createElement('canvas'); scan.width = OUTW; scan.height = 3;
{ const c = scan.getContext('2d'); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, 1, OUTW, 1); }
const vign = document.createElement('canvas'); vign.width = OUTW; vign.height = OUTH;
{
  const c = vign.getContext('2d');
  const g = c.createRadialGradient(OUTW / 2, OUTH / 2, OUTH * 0.38, OUTW / 2, OUTH / 2, OUTH * 0.95);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.48)');
  c.fillStyle = g; c.fillRect(0, 0, OUTW, OUTH);
}
const scanPat = ctx.createPattern(scan, 'repeat');
function composite(f) {
  const lut = makeLUT(f), d = simg.data;
  for (let i = 0; i < W * H; i++) {
    const p = MP[lut[IB[i]]];
    d[i * 4] = p[0]; d[i * 4 + 1] = p[1]; d[i * 4 + 2] = p[2]; d[i * 4 + 3] = 255;
  }
  sctx.putImageData(simg, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(small, 0, 0, OUTW, OUTH);
  ctx.drawImage(vign, 0, 0);
  ctx.fillStyle = scanPat; ctx.fillRect(0, 0, OUTW, OUTH);
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = 'rgba(120,255,200,0.02)'; ctx.fillRect(0, 0, OUTW, OUTH);
  ctx.globalCompositeOperation = 'source-over';
}
window.renderAt = (t) => {
  const tt = Math.min(cues.duration - 1e-4, Math.max(0, t));
  const f = Math.round(tt * FPS);
  const [sx, sy] = shakeXY(tt);
  GX = sx; GY = sy;
  IB.fill(0);
  SHOTS[shotIndex(tt)](tt, f);
  const tr = transAt(tt);
  if (tr) {
    JB.set(IB);
    GX = 0; GY = 0;
    SHOTS[tr.prev](Math.max(0, CUTS[tr.prev] - 1 / FPS), f);
    mixCols(IB, JB, tr.p);
  }
  GX = 0; GY = 0;
  subtitle(tt, f);
  padEdges();
  fadeEdges(tt);
  composite(f);
};
