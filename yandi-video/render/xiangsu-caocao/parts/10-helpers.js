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

