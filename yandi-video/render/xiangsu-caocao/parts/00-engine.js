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

