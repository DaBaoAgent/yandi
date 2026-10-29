// ---------------------------------------------------------------- transitions / subtitle / CRT
// 全片：cuts.json 的 cuts 含首帧 0，播放器用的切点表去掉它（57 个切点 / 58 个镜头）
const CUTS = cues.cuts.slice(1);
const SHOTS = [
  bayShotA, bayShotB, bayShotC, bayShotD, bayShotE, bayShotF, bayShotG,
  shot08, shot09, shot10, shot11, shot12, shot13, shot14, shot15, shot16,
  shot17, shot18, shot19, shot20, shot21, shot22, shot23, shot24, shot25,
  shot26, shot27, shot28, shot29, shot30, shot31, shot32, shot33, shot34, shot35,
  shot36, shot37, shot38, shot39, shot40, shot41, shot42, shot43, shot44, shot45,
  shot46, shot47, shot48, shot49, shot50, shot51, shot52, shot53, shot54, shot55,
  shot56, shot57, shot58,
];
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
const SUB_CACHE = new Map();
function layoutW(str, sc) {
  let w = 0;
  for (const ch of str) w += textW(ch) * sc;
  return w;
}
function subtitle(t) {
  const s = cues.subs.find(s => t >= s.t0 - 0.02 && t < s.t1 + 0.10);
  if (!s) return;
  const SC = 2, bandY = 304, TEXTY = 316;
  rect(0, bandY, W, H - bandY, M(0));
  for (let y = bandY + 2; y < H; y++) for (let x = 0; x < W; x++) if ((x + y) & 1) px(x, y, M(31));
  hline(0, bandY, W, M(29));
  hline(0, bandY + 1, W, M(0));
  const full = s.text;
  let fullW = SUB_CACHE.get(full);
  if (fullW === undefined) { fullW = layoutW(full, SC); SUB_CACHE.set(full, fullW); }
  const shown = Math.min(full.length, Math.max(1, Math.floor((t - s.t0) / 0.026) + 1));
  const vis = full.slice(0, shown);
  // 以整条文字的宽度居中：打字机从左往右长，不左右晃
  let x = Math.round((W - fullW) / 2);
  const hl = s.hl || '', hi = hl ? full.indexOf(hl) : -1;
  for (let i = 0; i < vis.length; i++) {
    const gold = hi >= 0 && i >= hi && i < hi + hl.length;
    text(vis[i], x + 2, TEXTY + 2, M(0), SC);
    text(vis[i], x, TEXTY, gold ? M(15) : M(8), SC);
    x += textW(vis[i]) * SC;
  }
  // 高亮后的小三角指示
  if (hi >= 0 && shown > hi) {
    const gx = Math.round((W - fullW) / 2 + layoutW(full.slice(0, hi), SC) + layoutW(full.slice(hi, hi + hl.length), SC) / 2);
    const by = bandY + 1 + Math.round((Math.sin(t * 6) + 1) * 1.5);
    px(gx, by, M(15)); px(gx - 1, by - 2, M(15)); px(gx + 1, by - 2, M(15));
  }
}
function shakeXY(t) {
  let amp = 0, age0 = 0;
  for (const h of cues.hits) {
    if (h.t > t) break;
    const age = t - h.t;
    if (age > 0.24) continue;
    const a = h.kind === 'cut' ? 1.0 : 2.0;
    const v = Math.round(a * (1 - age / 0.24));
    if (v > amp) { amp = v; age0 = age; }
  }
  if (!amp) return [0, 0];
  const f = Math.round(t * FPS);
  return [Math.round(Math.sin(f * 2.7) * amp), Math.round(Math.cos(f * 3.1) * amp)];
}
function fadeEdges(t) {
  let k = 0;
  if (t < 0.36) k = 1 - t / 0.36;
  if (t > cues.duration - 0.45) k = Math.max(k, (t - (cues.duration - 0.45)) / 0.45);
  if (k <= 0.001) return;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if ((bay(x, y) * 0.7 + hash(x, y) * 0.3) < k) IB[y * W + x] = 0;
  }
}

// ---------------------------------------------------------------- 全片环境动效
// 一条“信号扫描”光带 + 浮尘微粒，叠在每帧画面上（字幕带除外）。
// 只沿色板 ramp 提亮 1–3 级（brighten），不盖半透明白色；镜头本身静止时由它保证画面上始终有可测的运动。
// 关键：光带只在可见区 0..299 内循环，任何时刻都不离屏——带缘每帧扫过 ≥1 个灰阶采样单元。
function ambientAt(t) {
  // 横向扫描带：全宽实心光带自上而下匀速掠过，中心亮、带缘弱，出头即回到顶部
  const BH = 24, VSPD = 116, SPAN = 300;
  const yc = Math.floor((t * VSPD) % SPAN);
  for (let dy = -BH; dy < BH; dy++) {
    const k = Math.abs(dy + 0.5) / BH;
    const lift = k < 0.5 ? 3 : k < 0.85 ? 2 : 1;
    const y = ((yc + dy) % SPAN + SPAN) % SPAN;
    for (let x = 0; x < W; x++) brighten(x, y, lift);
  }
  // 浮尘：22 颗 4×4 缓移微粒，亮度呼吸
  for (let i = 0; i < 22; i++) {
    const spd = 5 + hash(i, 701) * 9;
    const x = Math.floor(((hash(i, 703) * W + t * spd) % W + W) % W);
    const y = Math.floor(20 + (hash(i, 705) * 268 + Math.sin(t * (0.4 + hash(i, 707) * 0.6) + i) * 5) % 275);
    const tw = Math.sin(t * (2.2 + hash(i, 709) * 2.5) + i * 1.7);
    if (tw > 0.1) {
      const lift = tw > 0.7 ? 3 : 2;
      for (let j = 0; j < 4; j++) for (let m = 0; m < 4; m++) brighten(x + m, y + j, lift);
    }
  }
}

const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const small = document.createElement('canvas'); small.width = W; small.height = H;
const sctx = small.getContext('2d');
const simg = sctx.createImageData(W, H);
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
  subtitle(tt);
  ambientAt(tt);
  padEdges();
  fadeEdges(tt);
  composite(f);
};
window.__stats = () => ({
  cuts: CUTS.length, shots: SHOTS.length, subs: cues.subs.length, hits: cues.hits.length,
  duration: cues.duration, missing: SHOTS.map((s, i) => (typeof s === 'function' ? null : i)).filter(x => x !== null),
});
