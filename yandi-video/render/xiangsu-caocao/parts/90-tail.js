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
// 震动锚点：cues.impacts（全片 19 个重音）；旧样片 cues 无该字段时退回固定表
const SHAKE_LIST = cues.impacts
  ? cues.impacts.map(o => [o.t, o.a])
  : [[T('stamp'), 3], [T('battle'), 3], [T('sweep'), 2], [T('year'), 2],
    [T('death'), 2], [T('handover'), 2], [T('surrender'), 2], [T('deal'), 2], [T('take'), 2], [T('nazhao'), 3]];
function shakeXY(t) {
  let amp = 0;
  for (const [tt, a] of SHAKE_LIST) {
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
