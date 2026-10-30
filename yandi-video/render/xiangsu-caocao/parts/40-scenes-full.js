// ============================================================ 全片第 12–45 镜
// 29.4–187.0 s：羞辱 → 反叛 → 惨败 → 典韦 → 曹昂 → 逃亡 → 丁夫人 → 晚年 →
//                后世推演 → 高平陵 → 如果 → 观点 → 结尾
// 只复用冻结管线的图元与人物；新零件写在本文件顶部。

// ---------------------------------------------------------------- 新零件
function tent(x, y, w, h, c = M(1)) {
  poly([[x, y], [x + w / 2, y - h], [x + w, y]], c);
  polyLine([[x, y], [x + w / 2, y - h], [x + w, y]], M(2), false);
  vline(x + w / 2, y - h, h, M(2));
  poly([[x + w / 2 - 7, y], [x + w / 2, y - Math.round(h * 0.62)], [x + w / 2 + 7, y]], M(0));
}
function torch(x, y, t) {
  vline(x, y, 24, M(9));
  rect(x - 3, y - 2, 7, 4, M(9));
  blit(CAO_FLAME[Math.floor(t * 12 + x) % 4], x - 3, y - 12, 1);
  glowSpot(x, y - 8, 26, 1, 0.42 + Math.sin(t * 9 + x) * 0.05);
}
function troop(x, y, t, seed, c = M(0), spear = M(9)) {
  const bob = Math.round(Math.sin(t * 6.5 + seed * 1.7) * 1);
  rect(x, y - 11 + bob, 4, 9, c);
  disc(x + 2, y - 14 + bob, 2, c);
  vline(x + 6, y - 18 + bob, 14, spear);
  px(x + 6, y - 19 + bob, M(6));
}

// 典韦：巨汉，双戟，肩甲倒刺
function drawDianwei(x, y, t) {
  const br = Math.round(Math.sin(t * 2.6) * 1), sw = Math.round(Math.sin(t * 1.2));
  const X = x + sw, Y = y + br;
  // 双戟（身后交叉）
  line(X - 6, Y + 30, X + 22, Y + 208, M(9));
  line(X + 118, Y + 30, X + 92, Y + 208, M(9));
  poly([[X - 14, Y + 30], [X + 2, Y + 24], [X - 6, Y + 8]], M(31));
  poly([[X + 126, Y + 30], [X + 110, Y + 24], [X + 118, Y + 8]], M(31));
  polyLine([[X - 14, Y + 30], [X + 2, Y + 24], [X - 6, Y + 8]], M(6), true);
  polyLine([[X + 126, Y + 30], [X + 110, Y + 24], [X + 118, Y + 8]], M(6), true);
  // 披风
  const cape = [[X + 22, Y + 64], [X + 96, Y + 60], [X + 122, Y + 116], [X + 118, Y + 214], [X + 6, Y + 214], [X - 2, Y + 116]];
  poly(cape, M(9)); polyLine(cape, M(0), true);
  dithGrad(X + 6, Y + 120, X + 116, Y + 208, M(9), M(0));
  // 躯干甲
  poly([[X + 20, Y + 74], [X + 98, Y + 70], [X + 110, Y + 108], [X + 106, Y + 184], [X + 74, Y + 198], [X + 40, Y + 196], [X + 12, Y + 180], [X + 8, Y + 106]], M(11));
  for (let r = 0; r < 7; r++) {
    const yy = Y + 92 + r * 14;
    line(X + 16, yy, X + 104, yy, r % 2 ? M(13) : M(10));
    for (let c = 0; c < 7; c++) px(X + 22 + c * 12, yy + 6, M(15));
  }
  // 肩甲：倒刺
  poly([[X - 4, Y + 62], [X + 34, Y + 48], [X + 46, Y + 76], [X + 20, Y + 96], [X - 6, Y + 88]], M(13));
  polyLine([[X - 4, Y + 62], [X + 34, Y + 48], [X + 46, Y + 76], [X + 20, Y + 96], [X - 6, Y + 88]], M(15), true);
  poly([[X + 84, Y + 48], [X + 120, Y + 62], [X + 122, Y + 88], [X + 96, Y + 96], [X + 70, Y + 76]], M(13));
  polyLine([[X + 84, Y + 48], [X + 120, Y + 62], [X + 122, Y + 88], [X + 96, Y + 96], [X + 70, Y + 76]], M(15), true);
  for (const [bx, by, dx] of [[X + 4, Y + 52, -1], [X + 18, Y + 45, -1], [X + 104, Y + 45, 1], [X + 116, Y + 54, 1]]) {
    poly([[bx, by], [bx + dx * 9, by - 16], [bx + dx * 14, by - 2]], M(13));
  }
  // 头：铁胄 + 络腮胡
  disc(X + 61, Y + 34, 20, M(14));
  poly([[X + 38, Y + 36], [X + 42, Y + 14], [X + 61, Y + 4], [X + 80, Y + 14], [X + 84, Y + 36], [X + 72, Y + 26], [X + 61, Y + 24], [X + 50, Y + 26]], M(9));
  polyLine([[X + 38, Y + 36], [X + 42, Y + 14], [X + 61, Y + 4], [X + 80, Y + 14], [X + 84, Y + 36]], M(0), false);
  rect(X + 40, Y + 32, 42, 4, M(15)); hline(X + 40, Y + 32, 42, M(16));
  px(X + 61, Y + 2, M(18)); px(X + 61, Y + 0, M(19));
  // 怒目 + 胡
  line(X + 44, Y + 38, X + 54, Y + 36, M(0)); line(X + 68, Y + 36, X + 78, Y + 38, M(0));
  px(X + 50, Y + 40, M(0)); px(X + 72, Y + 40, M(0));
  const beard = [[X + 40, Y + 50], [X + 61, Y + 54], [X + 82, Y + 50], [X + 80, Y + 76], [X + 61, Y + 88], [X + 42, Y + 76]];
  poly(beard, M(7));
  for (let i = 0; i < 6; i++) line(X + 48 + i * 5, Y + 56, X + 49 + i * 5, Y + 80, M(9));
  line(X + 54, Y + 52, X + 61, Y + 62, M(9)); line(X + 68, Y + 52, X + 61, Y + 62, M(9));
  // 手臂：左手按戟，右手横扫
  poly([[X + 2, Y + 84], [X + 24, Y + 78], [X + 30, Y + 116], [X + 10, Y + 136], [X - 4, Y + 118]], M(11));
  polyLine([[X + 2, Y + 84], [X + 24, Y + 78], [X + 30, Y + 116], [X + 10, Y + 136], [X - 4, Y + 118]], M(15), true);
  const swang = Math.sin(t * 2.2);
  const rArm = [[X + 96, Y + 82], [X + 118, Y + 84 + Math.round(swang * 8)], [X + 126, Y + 118 + Math.round(swang * 10)], [X + 104, Y + 132], [X + 94, Y + 108]];
  poly(rArm, M(11)); polyLine(rArm, M(15), true);
  // 腿
  rect(X + 30, Y + 192, 24, 26, M(9));
  rect(X + 70, Y + 192, 24, 26, M(9));
  rect(X + 25, Y + 214, 32, 8, M(0));
  rect(X + 67, Y + 214, 32, 8, M(0));
  line(X - 6, Y + 220, X + 128, Y + 220, M(9));
}

// 曹昂：青年武将，浅甲、红缨但无重胄
function drawAng(x, y, t, opt = {}) {
  const br = Math.round(Math.sin(t * 2.9 + 1.1) * 1), sw = Math.round(Math.sin(t * 1.4) * 1);
  const X = x + sw, Y = y + br;
  const fallen = !!opt.fallen;
  if (fallen) {
    // 倒地的少年：侧躺剪影
    const L = [[X + 10, Y + 40], [X + 70, Y + 34], [X + 108, Y + 52], [X + 128, Y + 78], [X + 96, Y + 92], [X + 40, Y + 92], [X + 6, Y + 70]];
    poly(L, M(10)); polyLine(L, M(0), true);
    disc(X + 22, Y + 44, 10, M(14));
    poly([[X + 12, Y + 36], [X + 22, Y + 30], [X + 32, Y + 36], [X + 28, Y + 46], [X + 16, Y + 46]], M(9));
    line(X + 34, Y + 58, X + 96, Y + 62, M(11));
    line(X + 46, Y + 70, X + 108, Y + 74, M(9));
    return;
  }
  // 披风（浅）
  const cape = [[X + 34, Y + 56], [X + 88, Y + 54], [X + 106, Y + 86], [X + 102, Y + 182], [X + 22, Y + 182], [X + 16, Y + 86]];
  poly(cape, M(20)); polyLine(cape, M(9), true);
  dithGrad(X + 22, Y + 96, X + 100, Y + 176, M(20), M(9));
  // 甲
  poly([[X + 32, Y + 76], [X + 86, Y + 74], [X + 94, Y + 96], [X + 92, Y + 152], [X + 72, Y + 164], [X + 36, Y + 164], [X + 26, Y + 150], [X + 26, Y + 96]], M(11));
  for (let r = 0; r < 5; r++) {
    const yy = Y + 92 + r * 12;
    line(X + 30, yy, X + 90, yy, r % 2 ? M(13) : M(10));
    for (let c = 0; c < 4; c++) px(X + 38 + c * 13, yy + 5, M(15));
  }
  // 肩甲
  poly([[X + 16, Y + 66], [X + 42, Y + 60], [X + 48, Y + 78], [X + 30, Y + 88], [X + 14, Y + 82]], M(13));
  poly([[X + 78, Y + 60], [X + 102, Y + 66], [X + 104, Y + 82], [X + 88, Y + 88], [X + 72, Y + 78]], M(13));
  // 脖子 + 脸（少年无须）
  rect(X + 52, Y + 62, 14, 12, M(13));
  const face = [[X + 42, Y + 34], [X + 54, Y + 26], [X + 68, Y + 28], [X + 76, Y + 38], [X + 76, Y + 54], [X + 66, Y + 64], [X + 52, Y + 64], [X + 42, Y + 52]];
  poly(face, M(14));
  polyD([[X + 42, Y + 34], [X + 48, Y + 28], [X + 46, Y + 60], [X + 40, Y + 48]], M(13), 1);
  px(X + 68, Y + 40, M(15)); px(X + 69, Y + 42, M(15));
  line(X + 46, Y + 41, X + 55, Y + 40, M(0)); line(X + 63, Y + 40, X + 72, Y + 41, M(0));
  line(X + 58, Y + 42, X + 55, Y + 52, M(13));
  hline(X + 52, Y + 58, 9, M(12));
  // 束发 + 小冠
  rect(X + 44, Y + 22, 34, 8, M(0));
  poly([[X + 50, Y + 22], [X + 62, Y + 10], [X + 74, Y + 22]], M(0));
  rect(X + 58, Y + 6, 5, 5, M(15));
  line(X + 62, Y + 4, X + 62, Y + 0, M(18)); px(X + 62, Y - 1, M(19));
  // 手臂与剑
  poly([[X + 8, Y + 80], [X + 28, Y + 76], [X + 32, Y + 108], [X + 14, Y + 124], [X + 2, Y + 110]], M(11));
  poly([[X + 88, Y + 80], [X + 106, Y + 86], [X + 110, Y + 116], [X + 94, Y + 128], [X + 86, Y + 104]], M(11));
  line(X + 104, Y + 122, X + 118, Y + 176, M(5)); line(X + 105, Y + 122, X + 119, Y + 176, M(7));
  rect(X + 100, Y + 118, 12, 3, M(15));
  // 腿
  rect(X + 38, Y + 162, 20, 26, M(9));
  rect(X + 62, Y + 162, 20, 26, M(9));
  rect(X + 35, Y + 184, 25, 7, M(0));
  rect(X + 60, Y + 184, 25, 7, M(0));
}

// 马：侧面剪影，可插箭
function drawHorse(x, y, t, opt = {}) {
  const ph = Math.sin(t * 7.5);
  const bob = ph > 0 ? 0 : 1;
  const X = x, Y = y + bob;
  const body = [[X + 16, Y + 44], [X + 34, Y + 28], [X + 92, Y + 24], [X + 116, Y + 34], [X + 124, Y + 52], [X + 112, Y + 66], [X + 40, Y + 72], [X + 20, Y + 62]];
  poly(body, M(9)); polyLine(body, M(0), true);
  dithGrad(X + 26, Y + 44, X + 112, Y + 66, M(9), M(0));
  // 颈与头
  const neck = [[X + 88, Y + 30], [X + 106, Y + 4], [X + 122, Y + 2], [X + 130, Y + 16], [X + 120, Y + 14], [X + 112, Y + 30]];
  poly(neck, M(9)); polyLine(neck, M(0), true);
  const head = [[X + 106, Y + 2], [X + 124, Y + 0], [X + 136, Y + 8], [X + 134, Y + 18], [X + 120, Y + 20], [X + 110, Y + 14]];
  poly(head, M(9)); polyLine(head, M(0), true);
  disc(X + 120, Y + 4, 2, M(0)); // 眼
  px(X + 132, Y + 4, M(0)); px(X + 133, Y + 6, M(0));
  // 鬃毛
  for (let i = 0; i < 8; i++) px(X + 100 - i * 2 + Math.round(Math.sin(t * 4 + i) * 1), Y + 8 + i * 2, M(31));
  // 尾
  for (let i = 0; i < 10; i++) px(X + 14 - i + Math.round(Math.sin(t * 3 + i * 0.5) * 2), Y + 42 + i, M(0));
  // 腿
  const l1 = ph > 0 ? 24 : 18, l2 = ph > 0 ? 18 : 24;
  rect(X + 34, Y + 66, 5, l1 + 6, M(0));
  rect(X + 58, Y + 66, 5, l2 + 6, M(0));
  rect(X + 92, Y + 66, 5, l2 + 8, M(0));
  rect(X + 108, Y + 66, 5, l1 + 8, M(0));
  rect(X + 32, Y + 66 + l1 + 4, 9, 3, M(0)); rect(X + 90, Y + 66 + l2 + 8, 9, 3, M(0));
  // 鞍
  rect(X + 52, Y + 20, 30, 6, M(17)); hline(X + 52, Y + 20, 30, M(18));
  // 流箭
  if (opt.arrows) {
    for (let i = 0; i < opt.arrows; i++) {
      const ax = X + 48 + i * 18, ay = Y + 28 + (i % 3) * 8;
      line(ax, ay, ax + 16, ay - 10, M(10));
      poly([[ax + 16, ay - 10], [ax + 20, ay - 13], [ax + 18, ay - 8]], M(6));
    }
  }
}

// 丁夫人：高髻、深红礼服
function drawDing(x, y, t, opt = {}) {
  const br = Math.round(Math.sin(t * 2.8) * 1), sw = Math.round(Math.sin(t * 1.5) * 1);
  const X = x + sw, Y = y + br;
  disc(X + 54, Y + 178, 34, M(0));
  // 后发
  disc(X + 54, Y + 30, 20, M(31));
  disc(X + 54, Y + 8, 11, M(24));
  disc(X + 54, Y + 8, 9, M(31));
  line(X + 44, Y + 6, X + 64, Y + 4, M(29)); px(X + 65, Y + 4, M(15));
  // 脸
  const face = [[X + 42, Y + 20], [X + 56, Y + 15], [X + 68, Y + 20], [X + 70, Y + 38], [X + 62, Y + 50], [X + 53, Y + 52], [X + 44, Y + 46], [X + 39, Y + 34]];
  poly(face, M(14));
  polyD([[X + 42, Y + 20], [X + 48, Y + 18], [X + 46, Y + 46], [X + 40, Y + 36]], M(13), 1);
  px(X + 63, Y + 22, M(15));
  poly([[X + 40, Y + 26], [X + 46, Y + 18], [X + 56, Y + 15], [X + 66, Y + 18], [X + 70, Y + 26], [X + 63, Y + 21], [X + 54, Y + 19], [X + 45, Y + 23]], M(31));
  // 眉眼：怒/悲
  const angry = opt.angry;
  line(X + 46, Y + 31, X + 52, Y + (angry ? 32 : 31), M(9));
  line(X + 57, Y + (angry ? 32 : 31), X + 63, Y + 31, M(9));
  px(X + 49, Y + 34, M(8)); px(X + 60, Y + 34, M(8));
  line(X + 54, Y + 36, X + 53, Y + 42, M(13));
  if (angry) { hline(X + 50, Y + 45, 7, M(17)); px(X + 53, Y + 46, M(18)); }
  else { hline(X + 50, Y + 46, 6, M(18)); px(X + 53, Y + 46, M(19)); }
  // 深红礼服
  const robe = [[X + 46, Y + 52], [X + 62, Y + 50], [X + 88, Y + 70], [X + 104, Y + 140], [X + 98, Y + 178], [X + 78, Y + 190], [X + 30, Y + 190], [X + 10, Y + 176], [X + 4, Y + 140], [X + 20, Y + 70]];
  poly(robe, M(17)); polyLine(robe, M(9), true);
  for (const [a, b] of [[34, 72], [48, 62], [60, 60], [76, 66], [88, 76], [20, 78], [96, 84]]) line(X + a, Y + b, X + a - 4, Y + 172, M(18));
  // 交领
  line(X + 49, Y + 56, X + 55, Y + 74, M(19));
  line(X + 60, Y + 55, X + 55, Y + 74, M(19));
  // 大袖
  const slL = [[X + 8, Y + 78], [X + 24, Y + 68], [X + 30, Y + 106], [X + 24, Y + 128], [X + 8, Y + 136], [X - 2, Y + 120]];
  poly(slL, M(17)); polyLine(slL, M(9), true);
  const slR = [[X + 88, Y + 72], [X + 104, Y + 84], [X + 110, Y + 120], [X + 102, Y + 140], [X + 86, Y + 132], [X + 90, Y + 100]];
  poly(slR, M(17)); polyLine(slR, M(9), true);
  // 手
  poly([[X + 45, Y + 102], [X + 64, Y + 100], [X + 66, Y + 112], [X + 47, Y + 114]], M(14));
  // 下摆
  hline(X + 28, Y + 186, 52, M(18));
  hline(X + 26, Y + 188, 56, M(0));
}

// 织机：木架 + 经线 + 往返的梭子
function drawLoom(x, y, t, sc = 1) {
  const W_ = 150 * sc, H_ = 120 * sc;
  rect(x - 6 * sc, y - H_, 8 * sc, H_, M(10));
  rect(x + W_ - 4 * sc, y - H_, 8 * sc, H_, M(10));
  rect(x - 8 * sc, y - H_ - 6 * sc, W_ + 16 * sc, 8 * sc, M(9));
  hline(x - 8 * sc, y - H_ - 6 * sc, W_ + 16 * sc, M(12));
  rect(x + 6 * sc, y - 30 * sc, W_ - 12 * sc, 8 * sc, M(10));
  // 经线
  for (let i = 10; i < W_ - 12; i += 7 * sc) vline(x + i * sc, y - H_ + 4 * sc, H_ - 40 * sc, M(27));
  // 织物
  rect(x + 6 * sc, y - 26 * sc, W_ - 12 * sc, 22 * sc, M(28));
  for (let i = 0; i < W_ - 14; i += 5 * sc) px(x + 8 * sc + i, y - 20 * sc + ((i / sc | 0) % 3), M(26));
  // 梭子往返
  const sw2 = Math.sin(t * 2.4) * 0.5 + 0.5;
  const sx = Math.round(x + 8 * sc + (W_ - 30 * sc) * sw2);
  rect(sx, y - 44 * sc, 20 * sc, 7 * sc, M(12));
  hline(sx, y - 44 * sc, 20 * sc, M(14));
  px(sx + 18 * sc, y - 46 * sc, M(28));
  // 踏板
  rect(x + 14 * sc, y - 2 * sc, 46 * sc, 5 * sc, M(10));
  rect(x + 86 * sc, y - 2 * sc, 46 * sc, 5 * sc, M(10));
  // 挂着的布卷
  rect(x + W_ - 26 * sc, y - H_ + 10 * sc, 16 * sc, 62 * sc, M(17));
  hline(x + W_ - 26 * sc, y - H_ + 10 * sc, 16 * sc, M(18));
}

// 晚年曹操：在 drawCao2 上叠白发白须
function drawOldCao(x, y, t) {
  drawCao2(x, y, t, { glint: Math.sin(t * 1.3) > 0.9 });
  const X = x + Math.round(Math.sin(t * 1.25) * 1), Y = y + Math.round(Math.sin(t * 2.35) * 1);
  for (let i = 0; i < 6; i++) line(X + 52 + i * 4, Y + 76, X + 53 + i * 4, Y + 96, M(27));
  for (let i = 0; i < 4; i++) line(X + 56 + i * 4, Y + 66, X + 50 + i * 5, Y + 84, M(26));
  px(X + 44, Y + 36, M(27)); px(X + 45, Y + 38, M(27));
  px(X + 78, Y + 38, M(27)); px(X + 79, Y + 36, M(27));
}

// 简牍 / 纸卷
function drawScroll(x, y, w, h, t, nLines = 6) {
  rect(x, y, w, h, M(28));
  polyLine([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], M(12), true);
  for (let i = 0; i < nLines; i++) {
    const yy = y + 10 + i * Math.floor((h - 16) / nLines);
    for (let xx = x + 8; xx < x + w - 10; xx += 9) {
      if (hash(xx, yy) < 0.82) px(xx, yy + Math.round(Math.sin(t * 1.5 + i) * 0.4), M(31));
    }
  }
}

// 天平：左「一夜」，右「曹昂 / 丁氏」
function drawScale(cx, cy, tilt, t) {
  // 立柱
  rect(cx - 3, cy, 6, 118, M(9));
  hline(cx - 26, cy + 116, 52, M(9));
  poly([[cx - 34, cy + 118], [cx + 34, cy + 118], [cx + 26, cy + 124], [cx - 26, cy + 124]], M(10));
  // 横梁
  const a = tilt * 0.32;
  const L = 132, dx = Math.round(Math.cos(a) * L), dy = Math.round(Math.sin(a) * L);
  line(cx - dx, cy - dy, cx + dx, cy + dy, M(12));
  line(cx - dx, cy - dy + 1, cx + dx, cy + dy + 1, M(14));
  disc(cx, cy, 6, M(12)); disc(cx, cy, 3, M(15));
  // 吊盘
  for (const s of [-1, 1]) {
    const px_ = cx + s * dx, py_ = cy + s * dy;
    line(px_, py_, px_, py_ + 34, M(9));
    line(px_ - 2, py_ + 2, px_, py_ + 34, M(9));
    line(px_ + 2, py_ + 2, px_, py_ + 34, M(9));
    const yy = py_ + 34 + Math.round(Math.sin(t * 1.9 + s) * 1);
    poly([[px_ - 34, yy], [px_ + 34, yy], [px_ + 24, yy + 12], [px_ - 24, yy + 12]], M(10));
    hline(px_ - 34, yy, 68, M(14));
  }
}

// 链条：斜向链环
function drawChain(x0, y0, x1, y1, t, col = M(27), hi = M(28)) {
  const n = 18;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = Math.round(x0 + (x1 - x0) * u), y = Math.round(y0 + (y1 - y0) * u);
    const sw2 = Math.round(Math.sin(t * 2 + i * 0.7) * 1);
    ring(x + sw2, y, 6, col);
    ring(x + sw2, y, 4, i % 4 === 0 ? hi : col);
  }
}

// 多米诺牌：angle 0..1 倒下
function drawDomino(x, y, w, h, ang, c, label) {
  const a = ang * 1.35;
  const ca = Math.cos(a), sa = Math.sin(a);
  const base = [x, y];
  const pts = [[0, -h], [w, -h], [w, 0], [0, 0]].map(([dx, dy]) => [base[0] + dx * ca - dy * sa, base[1] + dx * sa + dy * ca]);
  poly(pts, c);
  polyLine(pts, M(0), true);
  // 面纹
  const cxm = (pts[0][0] + pts[2][0]) / 2, cym = (pts[0][1] + pts[2][1]) / 2;
  if (label && ang < 0.55) textC(label, Math.round(cxm), Math.round(cym) - 8, M(15), 1);
}

// 营门
function campGate(x, y, t) {
  rect(x - 84, y - 6, 168, 8, M(9));
  rect(x - 78, y - 100, 10, 96, M(10));
  rect(x + 68, y - 100, 10, 96, M(10));
  rect(x - 88, y - 108, 176, 10, M(10));
  hline(x - 88, y - 108, 176, M(12));
  poly([[x - 88, y - 108], [x, y - 128], [x + 88, y - 108]], M(0));
  polyLine([[x - 88, y - 108], [x, y - 128], [x + 88, y - 108]], M(12), false);
  // 门板
  for (const s of [-1, 1]) {
    const gx = x + s * 46;
    rect(gx - 30, y - 92, 60, 92, M(10));
    for (let r = 0; r < 6; r++) for (let c = 0; c < 5; c++) px(gx - 26 + c * 12 + (r % 2) * 6, y - 84 + r * 14, M(9));
    vline(gx, y - 92, 92, M(9));
  }
  torch(x - 96, y - 70, t);
  torch(x + 96, y - 70, t);
}

// ---------------------------------------------------------------- 12–45 镜新人物
// 丁夫人侧坐织布：opt.back 背对镜头，opt.idle 手不动
function drawDingSeat(x, y, t, opt = {}) {
  const br = Math.round(Math.sin(t * 2.2) * 1), sw = Math.round(Math.sin(t * 1.1));
  const X = x + sw, Y = y + br;
  disc(X + 56, Y + 104, 44, M(0));
  const skirt = [[X + 18, Y + 26], [X + 40, Y + 10], [X + 62, Y + 14], [X + 78, Y + 30], [X + 118, Y + 78], [X + 128, Y + 102], [X + 6, Y + 104], [X - 6, Y + 84]];
  poly(skirt, M(17)); polyLine(skirt, M(9), true);
  for (const [a, b] of [[30, 30], [44, 36], [58, 42], [72, 50], [86, 58]]) line(X + a, Y + b, X + a + 26, Y + 96, M(18));
  poly([[X + 26, Y + 16], [X + 52, Y + 8], [X + 66, Y + 22], [X + 64, Y + 52], [X + 32, Y + 56], [X + 18, Y + 38]], M(17));
  line(X + 38, Y + 14, X + 46, Y + 34, M(19));
  line(X + 50, Y + 10, X + 46, Y + 34, M(19));
  disc(X + 46, Y + 2, 11, M(14));
  if (opt.back) {
    poly([[X + 33, Y - 6], [X + 52, Y - 6], [X + 57, Y + 14], [X + 34, Y + 16]], M(31));
    vline(X + 44, Y - 6, 20, M(24));
  } else {
    poly([[X + 36, Y - 6], [X + 44, Y - 10], [X + 56, Y - 2], [X + 57, Y + 8], [X + 50, Y + 12], [X + 38, Y + 8]], M(14));
    px(X + 50, Y + 1, M(8));
    line(X + 47, Y + 7, X + 53, Y + 7, M(18));
  }
  disc(X + 45, Y - 13, 7, M(24)); disc(X + 45, Y - 13, 5, M(31));
  line(X + 37, Y - 13, X + 53, Y - 15, M(29)); px(X + 54, Y - 15, M(15));
  const push = opt.idle ? 0 : Math.round(Math.sin(t * 2.4) * 7);
  const py = Math.round(push * 0.4);
  poly([[X + 56, Y + 20], [X + 78, Y + 16 + py], [X + 84, Y + 26 + py], [X + 60, Y + 32]], M(17));
  rect(X + 76, Y + 16 + py, 8, 6, M(14));
}

// 背立的女性（窗前/门边）
function drawWomanBack(x, y, t, robeC = M(17)) {
  const br = Math.round(Math.sin(t * 2.4) * 1), sw = Math.round(Math.sin(t * 1.2));
  const X = x + sw, Y = y + br;
  disc(X + 40, Y + 182, 26, M(0));
  disc(X + 40, Y + 30, 11, M(31));
  disc(X + 40, Y + 8, 8, M(24)); disc(X + 40, Y + 8, 6, M(31));
  line(X + 31, Y + 7, X + 49, Y + 5, M(29)); px(X + 50, Y + 5, M(15));
  const back = [[X + 26, Y + 38], [X + 54, Y + 38], [X + 62, Y + 78], [X + 60, Y + 150], [X + 48, Y + 184], [X + 32, Y + 184], [X + 20, Y + 150], [X + 18, Y + 78]];
  poly(back, robeC); polyLine(back, M(9), true);
  line(X + 24, Y + 44, X + 12, Y + 150, M(18));
  line(X + 56, Y + 44, X + 68, Y + 148, M(18));
  for (let i = 0; i < 3; i++) line(X + 28 + i * 6, Y + 74, X + 26 + i * 7, Y + 178, M(18));
  hline(X + 22, Y + 180, 36, M(18)); hline(X + 20, Y + 182, 40, M(0));
}

// 司马懿：瘦、白须、深色长袍；opt.glint 眼底亮
function drawSima(x, y, t, opt = {}) {
  const br = Math.round(Math.sin(t * 1.9) * 1), sw = Math.round(Math.sin(t * 1.05));
  const X = x + sw, Y = y + br;
  disc(X + 54, Y + 196, 30, M(0));
  const robe = [[X + 36, Y + 52], [X + 60, Y + 46], [X + 78, Y + 64], [X + 88, Y + 144], [X + 82, Y + 192], [X + 60, Y + 200], [X + 24, Y + 196], [X + 14, Y + 140], [X + 18, Y + 64]];
  poly(robe, M(31)); polyLine(robe, M(1), true);
  for (const [a, b] of [[26, 70], [38, 62], [52, 60], [66, 66], [76, 74], [20, 80]])
    line(X + a, Y + b, X + a - 3, Y + 190, M(26));
  const slL = [[X + 10, Y + 66], [X + 28, Y + 58], [X + 34, Y + 100], [X + 24, Y + 116], [X + 6, Y + 104]];
  const slR = [[X + 74, Y + 60], [X + 92, Y + 70], [X + 94, Y + 112], [X + 78, Y + 120], [X + 72, Y + 96]];
  poly(slL, M(31)); polyLine(slL, M(1), true);
  poly(slR, M(31)); polyLine(slR, M(1), true);
  rect(X + 46, Y + 44, 12, 10, M(12));
  const face = [[X + 38, Y + 18], [X + 48, Y + 12], [X + 60, Y + 16], [X + 64, Y + 34], [X + 56, Y + 46], [X + 42, Y + 44], [X + 36, Y + 30]];
  poly(face, M(13));
  polyD([[X + 38, Y + 18], [X + 43, Y + 14], [X + 42, Y + 42], [X + 36, Y + 30]], M(12), 1);
  poly([[X + 34, Y + 18], [X + 40, Y + 6], [X + 58, Y + 2], [X + 66, Y + 12], [X + 62, Y + 18], [X + 54, Y + 10], [X + 44, Y + 12], [X + 38, Y + 22]], M(27));
  poly([[X + 42, Y + 40], [X + 56, Y + 40], [X + 58, Y + 70], [X + 50, Y + 84], [X + 40, Y + 68]], M(27));
  for (let i = 0; i < 4; i++) line(X + 45 + i * 3, Y + 44, X + 46 + i * 3, Y + 76, M(26));
  line(X + 40, Y + 26, X + 48, Y + 25, M(6));
  line(X + 54, Y + 25, X + 62, Y + 26, M(6));
  const gl = opt.glint ? M(16) : M(6);
  px(X + 44, Y + 30, gl); px(X + 57, Y + 30, gl);
  if (opt.glint) { glowSpot(X + 44, Y + 30, 8, 1, 0.30); glowSpot(X + 57, Y + 30, 7, 1, 0.26); }
  line(X + 50, Y + 32, X + 49, Y + 40, M(12));
  // 手与杖
  poly([[X + 92, Y + 112], [X + 102, Y + 114], [X + 104, Y + 128], [X + 94, Y + 128]], M(14));
  line(X + 98, Y + 122, X + 102, Y + 196, M(9));
}

// 曹爽：肥胖、锦袍、歪冠
function drawCaoShuang(x, y, t, opt = {}) {
  const br = Math.round(Math.sin(t * 2.6) * 1), sw = Math.round(Math.sin(t * 1.3));
  const X = x + sw, Y = y + br;
  disc(X + 66, Y + 194, 40, M(0));
  const robe = [[X + 30, Y + 54], [X + 80, Y + 46], [X + 108, Y + 62], [X + 124, Y + 120], [X + 118, Y + 188], [X + 86, Y + 198], [X + 30, Y + 198], [X + 8, Y + 184], [X + 4, Y + 118], [X + 12, Y + 66]];
  poly(robe, M(10)); polyLine(robe, M(17), true);
  dithGrad(X + 10, Y + 100, X + 120, Y + 194, M(10), M(9));
  for (let i = 0; i < 20; i++) px(X + 14 + Math.floor(hash(i, 3) * 100), Y + 70 + Math.floor(hash(i, 5) * 120), i % 3 ? M(15) : M(18));
  poly([[X + 30, Y + 96], [X + 62, Y + 90], [X + 88, Y + 104], [X + 92, Y + 140], [X + 64, Y + 158], [X + 34, Y + 146], [X + 26, Y + 118]], M(12));
  rect(X + 50, Y + 48, 22, 12, M(13));
  disc(X + 62, Y + 34, 14, M(14));
  hline(X + 52, Y + 47, 20, M(13));
  line(X + 52, Y + 33, X + 58, Y + 32, M(0));
  line(X + 66, Y + 32, X + 72, Y + 33, M(0));
  px(X + 55, Y + 36, M(8)); px(X + 69, Y + 36, M(8));
  px(X + 62, Y + 40, M(13));
  rect(X + 49, Y + 12, 28, 14, M(0));
  rect(X + 52, Y + 8, 22, 5, M(0));
  hline(X + 47, Y + 25, 33, M(15));
  // 袖
  poly([[X + 6, Y + 76], [X + 26, Y + 68], [X + 32, Y + 112], [X + 20, Y + 128], [X + 2, Y + 116]], M(10));
  polyLine([[X + 6, Y + 76], [X + 26, Y + 68], [X + 32, Y + 112], [X + 20, Y + 128], [X + 2, Y + 116]], M(15), true);
  // 酒杯
  const cy = Y + 118 + Math.round(Math.sin(t * 3) * 1);
  line(X + 106, Y + 120, X + 106, Y + 150, M(15));
  if (opt.cup) {
    poly([[X + 98, cy - 4], [X + 114, cy - 4], [X + 111, cy + 6], [X + 101, cy + 6]], M(15));
    hline(X + 99, cy - 4, 14, M(16));
    px(X + 104, cy - 5, M(18)); px(X + 109, cy - 5, M(18));
  }
  rect(X + 34, Y + 168, 22, 26, M(9));
  rect(X + 70, Y + 168, 22, 26, M(9));
  rect(X + 31, Y + 190, 27, 8, M(0));
  rect(X + 68, Y + 190, 27, 8, M(0));
}

// 汉献帝 / 新皇：清瘦少年，浅色冕服；opt.crown 冕冠，opt.seal 捧玺
function drawEmperor(x, y, t, opt = {}) {
  const br = Math.round(Math.sin(t * 2.1) * 1), sw = Math.round(Math.sin(t * 1.15));
  const X = x + sw, Y = y + br;
  disc(X + 50, Y + 190, 32, M(0));
  const robe = [[X + 34, Y + 50], [X + 62, Y + 46], [X + 80, Y + 64], [X + 90, Y + 132], [X + 82, Y + 190], [X + 56, Y + 198], [X + 24, Y + 196], [X + 12, Y + 134], [X + 18, Y + 64]];
  poly(robe, M(28)); polyLine(robe, M(26), true);
  for (const [a, b] of [[26, 68], [38, 60], [52, 58], [66, 64], [76, 72], [20, 78]])
    line(X + a, Y + b, X + a - 2, Y + 188, M(27));
  // 玄边
  hline(X + 14, Y + 130, 74, M(0));
  poly([[X + 34, Y + 50], [X + 46, Y + 64], [X + 52, Y + 50]], M(26));
  // 大袖
  const slL = [[X + 14, Y + 66], [X + 30, Y + 58], [X + 34, Y + 102], [X + 22, Y + 118], [X + 8, Y + 104]];
  const slR = [[X + 72, Y + 58], [X + 88, Y + 70], [X + 90, Y + 108], [X + 76, Y + 116], [X + 70, Y + 92]];
  poly(slL, M(28)); polyLine(slL, M(26), true);
  poly(slR, M(28)); polyLine(slR, M(26), true);
  // 少年脸
  rect(X + 42, Y + 42, 14, 10, M(13));
  const face = [[X + 36, Y + 18], [X + 48, Y + 12], [X + 60, Y + 16], [X + 64, Y + 32], [X + 56, Y + 44], [X + 42, Y + 44], [X + 34, Y + 30]];
  poly(face, M(14));
  polyD([[X + 36, Y + 18], [X + 42, Y + 14], [X + 41, Y + 42], [X + 34, Y + 30]], M(13), 1);
  line(X + 39, Y + 26, X + 47, Y + 25, M(0));
  line(X + 53, Y + 25, X + 61, Y + 26, M(0));
  px(X + 43, Y + 30, M(8)); px(X + 56, Y + 30, M(8));
  line(X + 49, Y + 32, X + 48, Y + 38, M(13));
  hline(X + 46, Y + 41, 8, M(18));
  // 发
  poly([[X + 33, Y + 18], [X + 40, Y + 6], [X + 58, Y + 4], [X + 66, Y + 12], [X + 64, Y + 18], [X + 56, Y + 10], [X + 44, Y + 10], [X + 37, Y + 20]], M(0));
  if (opt.crown) {
    rect(X + 32, Y + 0, 56, 6, M(0));
    for (let i = 0; i < 7; i++) {
      vline(X + 36 + i * 8, Y + 6, 10, M(27));
      px(X + 36 + i * 8, Y + 6, M(15));
    }
  } else {
    rect(X + 40, Y + 2, 20, 8, M(0));
    hline(X + 36, Y + 10, 28, M(15));
  }
  // 捧玺
  if (opt.seal) {
    poly([[X + 40, Y + 112], [X + 64, Y + 110], [X + 66, Y + 120], [X + 42, Y + 122]], M(14));
    rect(X + 45, Y + 96, 16, 14, M(29)); rect(X + 48, Y + 99, 10, 8, M(15));
  }
  rect(X + 32, Y + 166, 20, 26, M(9));
  rect(X + 56, Y + 166, 20, 26, M(9));
  rect(X + 29, Y + 188, 25, 8, M(0));
  rect(X + 54, Y + 188, 25, 8, M(0));
}

// 孩子曹昂
function drawChild(x, y, t) {
  const bob = Math.round(Math.sin(t * 3.1) * 1);
  const X = x, Y = y + bob;
  disc(X + 11, Y + 38, 10, M(0));
  poly([[X + 4, Y + 14], [X + 18, Y + 12], [X + 24, Y + 22], [X + 22, Y + 40], [X + 2, Y + 40], [X - 2, Y + 22]], M(20));
  polyLine([[X + 4, Y + 14], [X + 18, Y + 12], [X + 24, Y + 22], [X + 22, Y + 40], [X + 2, Y + 40], [X - 2, Y + 22]], M(9), true);
  disc(X + 11, Y + 6, 7, M(14));
  rect(X + 5, Y - 2, 12, 4, M(0));
  px(X + 8, Y + 6, M(0)); px(X + 14, Y + 6, M(0));
  line(X + 18, Y + 18, X + 24, Y + 16, M(13));
}

// 朝臣：一列，bow 0..1 鞠躬
function drawMinister(x, y, t, seed, bow = 0) {
  const bob = Math.round(Math.sin(t * 2.1 + seed * 1.3) * 1);
  const X = x, Y = y + bob + Math.round(bow * 6);
  const robeC = seed % 3 === 0 ? M(9) : seed % 3 === 1 ? M(31) : M(10);
  rect(X - 5, Y + 2, 22, 6, M(0));
  rect(X - 1, Y - 4, 14, 7, M(0));
  disc(X + 6, Y + 12, 6, M(14));
  poly([[X - 2, Y + 20], [X + 14, Y + 20], [X + 20, Y + 46], [X + 16, Y + 58], [X - 6, Y + 58], [X - 8, Y + 40]], robeC);
  polyLine([[X - 2, Y + 20], [X + 14, Y + 20], [X + 20, Y + 46], [X + 16, Y + 58], [X - 6, Y + 58], [X - 8, Y + 40]], M(0), true);
  hline(X - 6, Y + 56, 26, M(0));
  if (bow > 0.5) line(X + 8, Y + 24, X + 14, Y + 10, M(12));
}

// 半身像（对比卡/板面）
function drawBust(cx, cy, t, robeC, hatC, opt = {}) {
  const br = Math.round(Math.sin(t * 2.2) * 1);
  const Y = cy + br;
  poly([[cx - 44, Y + 104], [cx - 30, Y + 44], [cx + 30, Y + 44], [cx + 44, Y + 104], [cx + 38, Y + 128], [cx - 38, Y + 128]], robeC);
  polyLine([[cx - 44, Y + 104], [cx - 30, Y + 44], [cx + 30, Y + 44], [cx + 44, Y + 104]], M(0), false);
  line(cx - 8, Y + 46, cx, Y + 70, M(19)); line(cx + 8, Y + 46, cx, Y + 70, M(19));
  rect(cx - 6, Y + 32, 12, 12, M(13));
  disc(cx, Y + 18, 15, M(14));
  if (hatC) { rect(cx - 14, Y - 6, 28, 12, hatC); rect(cx - 10, Y - 12, 20, 7, hatC); }
  line(cx - 9, Y + 16, cx - 3, Y + 15, M(0)); line(cx + 3, Y + 15, cx + 9, Y + 16, M(0));
  px(cx - 6, Y + 20, M(8)); px(cx + 6, Y + 20, M(8));
  if (opt.beard) poly([[cx - 9, Y + 26], [cx, Y + 30], [cx + 9, Y + 26], [cx + 7, Y + 46], [cx, Y + 54], [cx - 7, Y + 46]], M(9));
}

// 幽灵化：把一块区域按 dither 打回背景色
function ghostify(x0, y0, x1, y1, k = 0.45, bg = M(1)) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) if (bay(x, y) < k) px(x, y, bg);
}

// 三连板边框
function panelFrame(x, y, w, h, lit, t, label) {
  rect(x, y, w, h, M(1));
  polyLine([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], lit ? M(15) : M(9), true);
  if (lit) glowSpot(x + w / 2, y + h / 2, w * 0.8, 1, 0.05);
  if (label) textC(label, x + w / 2, y + 8, lit ? M(16) : M(9), 2);
}

// 结尾的小狗
function drawDog(x, y, t) {
  const ph = Math.round(Math.sin(t * 8));
  const X = x, Y = y;
  rect(X, Y - 12, 22, 9, M(12));
  hline(X, Y - 12, 22, M(14));
  rect(X + 20, Y - 18, 9, 9, M(12));
  poly([[X + 20, Y - 18], [X + 21, Y - 24], [X + 25, Y - 24], [X + 26, Y - 18]], M(12));
  px(X + 26, Y - 14, M(0));
  px(X + 29, Y - 11, M(0));
  const tw = Math.sin(t * 9) > 0 ? 1 : 0;
  line(X - 1, Y - 10, X - 6, Y - 14 - tw, M(12));
  const l1 = ph > 0 ? 4 : 2, l2 = ph > 0 ? 2 : 4;
  rect(X + 3, Y - 3, 2, l1 + 3, M(9));
  rect(X + 15, Y - 3, 2, l2 + 3, M(9));
  px(X + 3, Y + 3, M(0)); px(X + 15, Y + 3, M(0));
}

// 倒毙的战马（侧躺，可插箭）
function drawDeadHorse(x, y, t, arrows = 5) {
  poly([[x, y - 30], [x + 84, y - 36], [x + 118, y - 18], [x + 112, y + 2], [x + 30, y + 6], [x, y - 8]], M(9));
  polyLine([[x, y - 30], [x + 84, y - 36], [x + 118, y - 18], [x + 112, y + 2], [x + 30, y + 6], [x, y - 8]], M(0), true);
  dithGrad(x + 8, y - 26, x + 110, y + 2, M(9), M(0));
  poly([[x + 4, y - 30], [x - 26, y - 8], [x - 20, y + 10], [x + 8, y - 6]], M(9));
  poly([[x - 40, y + 2], [x - 16, y - 8], [x - 6, y + 6], [x - 28, y + 16]], M(9));
  polyLine([[x - 40, y + 2], [x - 16, y - 8], [x - 6, y + 6], [x - 28, y + 16]], M(0), true);
  line(x + 46, y + 4, x + 60, y + 30, M(9));
  line(x + 70, y + 4, x + 82, y + 26, M(9));
  line(x + 38, y - 30, x + 30, y - 52, M(9));
  line(x + 52, y - 32, x + 56, y - 54, M(9));
  rect(x + 44, y - 34, 30, 6, M(17));
  hline(x + 44, y - 34, 30, M(18));
  for (let i = 0; i < arrows; i++) {
    const ax = x + 20 + i * 16, ay = y - 22 + (i % 2) * 12;
    line(ax, ay, ax + 14, ay - 14, M(10));
    px(ax + 14, ay - 14, M(6));
  }
}

// ---------------------------------------------------------------- SHOT 12 · 29.4–34.6 奇耻大辱
function sh12_shame(t, f) {
  const jx = Math.round(Math.sin(t * 9.4) * 0.9), jy = Math.round(Math.cos(t * 7.2) * 0.7);
  GX += jx; GY += jy;
  // 帐内：毡壁竖缝 + 顶篷撑杆
  rect(-10, 0, 660, 304, M(1));
  for (let x = -8; x < 650; x += 32) { vline(x, 0, 304, M(2)); vline(x + 1, 0, 304, M(0)); }
  line(320, -12, 8, 168, M(2)); line(320, -12, 632, 168, M(2));
  line(320, -12, 8, 172, M(0)); line(320, -12, 632, 172, M(0));
  vline(320, 0, 168, M(2));
  rect(-10, 284, 660, 20, M(0));
  dithGrad(-10, 244, 650, 300, M(1), M(0));
  torch(88, 196, t);
  torch(566, 196, t);
  drawZhangXiu(26, 92, t);
  lowTable(376, 264, 200);
  drawScroll(398, 216, 156, 46, t, 4);
  if (t > 31.14) {
    const lt = t - 31.14;
    const drop = lt < 0.1 ? Math.round(30 * (1 - lt / 0.1) ** 2) : 0;
    sealStamp(452, 216 + drop, 52, '收编', true);
  }
  // 红嫁衣甩上案（32.30）
  if (t > 32.30) {
    const k = clamp((t - 32.30) / 0.34, 0, 1);
    const lift = Math.round(46 * (1 - k));
    const wav = Math.round(Math.sin(t * 4.2) * 2);
    const cloth = [[380, 200 - lift], [560, 196 - lift], [576, 234 - lift + wav], [556, 268], [402, 268], [370, 232 - lift + wav]];
    poly(cloth, M(17)); polyLine(cloth, M(18), true);
    for (let i = 0; i < 5; i++) line(400 + i * 34, 216 - lift, 404 + i * 32, 264, M(18));
    for (let i = 0; i < 3; i++) px(414 + i * 52 + wav, 240, M(19));
    if (k >= 1) textC('囍', 476, 220, M(19), 2);
  }
  // 撕破的囍旗（33.00）
  if (t > 33.0) {
    const k = clamp((t - 33.0) / 0.3, 0, 1);
    const sw = Math.round(Math.sin(t * 2.2) * 2);
    const x0 = 588 + sw, y0 = 30 + Math.round((1 - k) * 26);
    line(x0 + 10, 0, x0 + 10, y0, M(29));
    rect(x0 - 20, y0, 46, 92, M(17));
    polyLine([[x0 - 20, y0], [x0 + 26, y0], [x0 + 26, y0 + 92], [x0 - 20, y0 + 92]], M(18), true);
    textC('囍', x0 + 3, y0 + 20, M(15), 2);
    poly([[x0 - 20, y0 + 52], [x0 + 4, y0 + 40], [x0 + 10, y0 + 58], [x0 - 4, y0 + 74], [x0 - 18, y0 + 66]], M(1));
  }
  // 一拳砸在案上（33.62）
  if (t > 33.62) {
    const lt = t - 33.62;
    const k = clamp(lt / 0.12, 0, 1);
    const fy = Math.round(250 - 54 * (1 - k));
    poly([[440, fy], [478, fy - 6], [492, fy + 12], [478, fy + 30], [442, fy + 26], [432, fy + 10]], M(14));
    hline(444, fy + 4, 40, M(13));
    for (let i = 0; i < 4; i++) rect(462 + i * 7, fy - 2, 6, 12, M(14));
    if (k >= 1) {
      for (let i = 0; i < 14; i++) {
        const a = hash(i, 55) * 6.283, r = 34 + hash(i, 56) * 26;
        px(Math.round(464 + Math.cos(a) * r), Math.round(260 + Math.sin(a) * r), i % 3 ? M(18) : M(9));
      }
      glowSpot(464, 260, 40, 1, 0.20);
    }
  }
  const kt = clamp((t - 29.6) / 0.22, 0, 1);
  textSC('羞辱', 320, 14 + Math.round((1 - kt) * 8), M(15), 3);
  hline(272, 62, 96, M(18));
  dustMotes(t, 18, 71, 30, 610, 60, 280, M(6));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 13 · 34.6–37.0 当夜反了
function sh13_revolt(t, f) {
  const jx = Math.round(Math.sin(t * 11.0) * 0.9), jy = Math.round(Math.cos(t * 8.3) * 0.7);
  GX += jx; GY += jy;
  nightSky(f, 61);
  moon(f, 84, 40, 13);
  farMountains(0);
  groundPlane(266, t, 7);
  // 背景巨大的「反」
  if (t > T('revolt')) {
    const gk = clamp((t - T('revolt')) / 0.3, 0, 1);
    if (gk > 0.05) textC('反', 320, 12, M(9), 5);
  }
  // 营帐与哨兵
  tent(20, 264, 150, 76); tent(186, 258, 172, 88); tent(374, 266, 132, 64);
  troop(60, 290, t, 1); troop(96, 292, t, 2); troop(200, 288, t, 3); troop(238, 290, t, 4);
  torch(30, 226, t); torch(170, 222, t); torch(360, 232, t);
  campGate(520, 268, t);
  // 骑兵冲营（右往左）
  for (let i = 0; i < 4; i++) {
    const x = 640 - ((t - 34.6) * 120 + i * 56) % 720;
    if (x > -40 && x < 660) rider(x, 286 + (i % 2) * 4, t, i);
  }
  // 火箭
  for (let i = 0; i < 7; i++) {
    const ph = (t * 0.75 + i * 0.143) % 1;
    const x = Math.round(636 - ph * 470);
    const y = Math.round(196 + (i % 3) * 14 + Math.sin(ph * 3.1 + i) * 9 + ph * 26);
    px(x, y, M(19));
    line(x + 3, y + 1, x + 13, y + 4, M(18));
    glowSpot(x, y, 8, 1, 0.30);
  }
  // 「反」旗升起
  if (t > T('revolt')) {
    const k = clamp((t - T('revolt')) / 0.42, 0, 1);
    const py = Math.round(274 - 26 * k);
    vline(420, py - 120, 120, M(9));
    vline(421, py - 120, 120, M(10));
    const h = Math.round(64 * k);
    const fl = Math.round(Math.sin(t * 3.4) * 2);
    if (h > 4) {
      poly([[422, py - 118], [476, py - 114 + fl], [472, py - 118 + h], [422, py - 120 + h]], M(17));
      polyLine([[422, py - 118], [476, py - 114 + fl], [472, py - 118 + h], [422, py - 120 + h]], M(18), true);
      if (h > 40) textC('反', 448, py - 94, M(16), 2);
    }
    glowSpot(448, py - 84, 40, 1, 0.16 * k);
  }
  // 「偷袭」朱印
  if (t > 35.9) {
    const lt = t - 35.9;
    const drop = lt < 0.1 ? Math.round(28 * (1 - lt / 0.1) ** 2) : 0;
    sealStamp(534, 56 + drop, 56, '偷袭', true);
  }
  sparkField(t, 23, 26);
  emberField(t, 29, 34);
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 14 · 37.0–39.9 比赤壁还惨
function sh14_lose(t, f) {
  const jx = Math.round(Math.sin(t * 10.2) * 1.0), jy = Math.round(Math.cos(t * 7.7) * 0.8);
  GX += jx; GY += jy;
  // 火烧的天
  skyBand(-8, 96, M(31), M(17));
  skyBand(96, 176, M(17), M(18));
  skyBand(176, 240, M(18), M(14));
  for (let y = 0; y < 240; y++) for (let x = 0; x < 640; x++) if (hash(x, y) < 0.012) px(x, y, M(19));
  groundPlane(244, t, 9);
  // 燃烧的营帐
  for (const [tx, ty, tw, th] of [[30, 268, 130, 70], [176, 262, 148, 82], [342, 270, 120, 60]]) {
    tent(tx, ty, tw, th, M(1));
    const fx = tx + tw / 2;
    rect(fx - 8, ty - 24, 16, 20, M(9));
    blit(CAO_FLAME[Math.floor(t * 12 + tx) % 4], fx - 8, ty - 44, 2);
    glowSpot(fx, ty - 36, 52, 1, 0.5 + Math.sin(t * 9 + tx) * 0.08);
  }
  // 倒下的旗
  for (const [bx, by, a] of [[120, 292, -0.5], [300, 296, 0.4], [470, 290, -0.9]]) {
    const ex = bx + Math.round(Math.sin(a) * 90), ey = by - Math.round(Math.cos(a) * 90);
    line(bx, by, ex, ey, M(9));
    poly([[ex, ey], [ex + 30, ey + 8], [ex + 26, ey + 22], [ex + 2, ey + 14]], M(10));
  }
  // 溃逃的骑兵
  for (let i = 0; i < 3; i++) {
    const x = 520 - ((t - 37) * 150 + i * 70) % 640;
    if (x > -40 && x < 660) rider(x, 292, t, i + 5);
  }
  // 破匾「赤壁」
  if (t > 37.9) {
    const k = clamp((t - 37.9) / 0.2, 0, 1);
    const yy = Math.round(50 + (1 - k) * -10);
    rect(24, yy, 128, 50, M(9));
    rect(28, yy + 4, 120, 42, M(10));
    textC('赤壁', 88, yy + 13, M(15), 2);
    if (t > 38.54) {
      polyLine([[88, yy + 4], [84, yy + 20], [92, yy + 26], [86, yy + 42]], M(0), false);
      polyLine([[40, yy + 30], [60, yy + 24], [86, yy + 26]], M(0), false);
    }
  }
  // 「惨」朱印
  if (t > 37.6) {
    const lt = t - 37.6;
    const drop = lt < 0.1 ? Math.round(30 * (1 - lt / 0.1) ** 2) : 0;
    sealStamp(548, 58 + drop, 60, '惨', true);
  }
  sparkField(t, 37, 50);
  emberField(t, 41, 60);
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 15 · 39.9–43.9 典韦堵门
function sh15_dianwei(t, f) {
  const jx = Math.round(Math.sin(t * 12.4) * 1.1), jy = Math.round(Math.cos(t * 9.3) * 0.8);
  GX += jx; GY += jy;
  nightSky(f, 73);
  moon(f, 560, 34, 12);
  farMountains(0);
  groundPlane(280, t, 13);
  campGate(320, 284, t);
  for (let i = 0; i < 6; i++) {
    troop(10 + i * 18, 292, t, 30 + i, M(0), M(9));
    troop(600 - i * 18, 292, t, 40 + i, M(0), M(9));
  }
  drawDianwei(252, 64, t);
  // 飞矛
  const targets = [[286, 126], [318, 158], [350, 118], [298, 182], [338, 200], [364, 156]];
  for (let i = 0; i < 6; i++) {
    const sp0 = 40.3 + i * 0.42;
    if (t < sp0) continue;
    const [tx, ty] = targets[i];
    const k = clamp((t - sp0) / 0.4, 0, 1);
    const fromRight = i % 2 === 0;
    const sx = fromRight ? 640 : 0, sy = 170 + (i % 3) * 26;
    const ang = Math.atan2(ty - sy, tx - sx);
    if (k < 1) {
      const x = Math.round(lerp(sx, tx, k)), y = Math.round(lerp(sy, ty, k));
      line(x, y, Math.round(x - Math.cos(ang) * 30), Math.round(y - Math.sin(ang) * 30), M(9));
      px(x, y, M(6));
      px(x + Math.round(Math.cos(ang)), y + Math.round(Math.sin(ang)), M(19));
    } else {
      line(tx, ty, Math.round(tx - Math.cos(ang) * 26), Math.round(ty - Math.sin(ang) * 26), M(9));
      px(tx, ty, M(6));
    }
  }
  // 血
  if (t > 42.34) {
    const k = clamp((t - 42.34) / 1.2, 0, 1);
    for (let i = 0; i < 7; i++) {
      const x = 292 + Math.floor(hash(i, 7) * 76), y = 140 + Math.floor(hash(i, 9) * 120);
      px(x, y, M(18));
      if (k > 0.4) px(x, y + 1, M(17));
    }
    for (let i = 0; i < 3; i++) vline(300 + i * 24, 258, Math.round(6 + k * 12), M(17));
  }
  textSC('典韦', 320, 12, M(15), 2);
  sparkField(t, 33, 20);
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 16 · 43.9–46.6 尸体前不敢过
function sh16_fall(t, f) {
  const jx = Math.round(Math.sin(t * 9.0) * 0.8), jy = Math.round(Math.cos(t * 7.4) * 0.7);
  GX += jx; GY += jy;
  nightSky(f, 87);
  moon(f, 88, 36, 11);
  farMountains(0);
  groundPlane(276, t, 21);
  // 巨躯横陈
  const bx = 152, by = 214;
  poly([[bx, by - 26], [bx + 70, by - 40], [bx + 190, by - 34], [bx + 236, by - 8], [bx + 224, by + 26], [bx + 150, by + 34], [bx + 60, by + 30], [bx, by + 8]], M(11));
  polyLine([[bx, by - 26], [bx + 70, by - 40], [bx + 190, by - 34], [bx + 236, by - 8], [bx + 224, by + 26], [bx + 150, by + 34], [bx + 60, by + 30], [bx, by + 8]], M(0), true);
  dithGrad(bx + 10, by - 20, bx + 220, by + 28, M(11), M(0));
  for (let r = 0; r < 4; r++) line(bx + 30, by - 18 + r * 12, bx + 200, by - 20 + r * 12, M(13));
  poly([[bx + 20, by - 30], [bx + 56, by - 44], [bx + 66, by - 22], [bx + 30, by - 10]], M(13));
  disc(bx + 26, by + 2, 16, M(14));
  poly([[bx + 6, by + 4], [bx + 22, by - 12], [bx + 42, by - 8], [bx + 46, by + 12], [bx + 30, by + 24], [bx + 12, by + 18]], M(7));
  // 滚落的铁胄
  poly([[bx + 232, by + 40], [bx + 252, by + 26], [bx + 272, by + 40], [bx + 262, by + 50], [bx + 238, by + 50]], M(9));
  rect(bx + 240, by + 38, 26, 4, M(15));
  // 身上插的矛
  for (let i = 0; i < 5; i++) {
    const ax = bx + 76 + i * 28, ay = by - 20 + (i % 2) * 18;
    line(ax, ay, ax + 22, ay - 26, M(9));
    px(ax + 22, ay - 26, M(6));
  }
  // 血泊扩散
  const bk = clamp((t - 43.96) / 1.6, 0, 1);
  if (bk > 0) {
    poly([[bx - 10, by + 30], [bx + 90, by + 36], [bx + 200, by + 32], [bx + 232, by + 36], [bx + 220, by + 46 + Math.round(bk * 6)], [bx + 60, by + 50 + Math.round(bk * 6)], [bx - 6, by + 40 + Math.round(bk * 4)]], M(17));
    hline(bx + 30, by + 36, 160, M(18));
  }
  // 插在地上的双戟
  line(120, 300, 146, 226, M(9)); poly([[146, 226], [154, 212], [138, 212]], M(31)); polyLine([[146, 226], [154, 212], [138, 212]], M(6), true);
  line(446, 300, 420, 228, M(9)); poly([[420, 228], [412, 214], [428, 214]], M(31)); polyLine([[420, 228], [412, 214], [428, 214]], M(6), true);
  // 停在右侧的张绣兵
  for (let i = 0; i < 5; i++) troop(470 + i * 20, 294, t, 60 + i, M(0), M(9));
  // 不敢过
  if (t > 44.34) {
    const k = clamp((t - 44.34) / 0.3, 0, 1);
    const cx = 330, cy = 176, r = 92;
    arc(cx, cy, r, Math.PI * 1.15, Math.PI * 1.85, M(18));
    for (let i = 0; i < 12; i++) {
      const a = Math.PI * 1.15 + (Math.PI * 0.7) * i / 11;
      px(Math.round(cx + Math.cos(a) * (r + 4)), Math.round(cy + Math.sin(a) * (r + 4)), M(17));
    }
    if (k > 0.3) {
      textC('不敢过', cx, cy - 26, M(16), 2);
      hline(cx - 54, cy - 6, 108, M(18));
    }
  }
  for (let i = 0; i < 3; i++) crow(f + i * 9, 420 + i * 34 + Math.round(Math.sin(t * 0.9 + i) * 10), 40 + i * 12);
  emberField(t, 47, 28);
  dustMotes(t, 14, 83, 80, 600, 120, 290, M(5));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 17 · 46.6–50.9 让马
function sh17_mount(t, f) {
  const jx = Math.round(Math.sin(t * 8.6) * 0.8), jy = Math.round(Math.cos(t * 6.8) * 0.6);
  GX += jx; GY += jy;
  // 破晓
  skyBand(-8, 110, M(2), M(17));
  skyBand(110, 190, M(17), M(18));
  skyBand(190, 250, M(18), M(14));
  for (let y = 0; y < 250; y++) for (let x = 0; x < 640; x++) if (hash(x, y) < 0.01) px(x, y, M(15));
  groundPlane(250, t, 27);
  // 残墙
  rect(-8, 206, 96, 44, M(9));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) px(2 + c * 18 + (r % 2) * 9, 214 + r * 12, M(10));
  poly([[-8, 206], [14, 190], [30, 206]], M(9));
  rect(556, 214, 92, 36, M(9));
  for (let r = 0; r < 2; r++) for (let c = 0; c < 5; c++) px(562 + c * 17 + (r % 2) * 8, 222 + r * 14, M(10));
  // 断旗
  line(516, 250, 486, 158, M(9));
  poly([[486, 158], [512, 166], [506, 184], [484, 176]], M(10));
  drawCao2(30, 50, t);
  drawAng(402, 59, t);
  drawHorse(238, 152, t);
  // 缰绳从曹昂手里递过来
  if (t > T('angmount')) {
    const k = clamp((t - T('angmount')) / 0.5, 0, 1);
    const p0 = [420, 178], p1 = [402, 168], p2 = [368, 158];
    let lx = p0[0], ly = p0[1];
    const N = 22;
    for (let i = 1; i <= N * k; i++) {
      const [x, y] = qPoint(p0, p1, p2, i / N);
      line(Math.round(lx), Math.round(ly), Math.round(x), Math.round(y), M(9));
      lx = x; ly = y;
    }
  }
  // 曹操的坐骑中箭倒毙
  if (t > 49.24) {
    drawDeadHorse(148, 296, t, 6);
    if (t < 49.7) {
      for (let i = 0; i < 12; i++) {
        const a = hash(i, 61) * 6.283, r = 30 + hash(i, 62) * 26;
        px(Math.round(208 + Math.cos(a) * r), Math.round(270 + Math.sin(a) * r), i % 2 ? M(14) : M(9));
      }
    }
  }
  textC('让马', 320, 10, M(15), 2);
  hline(284, 44, 72, M(18));
  dustMotes(t, 20, 91, 30, 610, 60, 280, M(12));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 18 · 50.9–55.1 曹昂断后
function sh18_angfall(t, f) {
  const jx = Math.round(Math.sin(t * 11.2) * 1.0), jy = Math.round(Math.cos(t * 8.8) * 0.8);
  GX += jx; GY += jy;
  skyBand(-8, 130, M(1), M(24));
  skyBand(130, 220, M(24), M(31));
  if (hash(f, 3) < 0.22) rect(-8, 0, 660, 130, M(2));
  forest(f, 236, 15, M(1), M(2), 3, 0.05);
  groundPlane(244, t, 19);
  // 追兵（右侧，压上来）
  for (let i = 0; i < 5; i++) {
    const x = 640 - Math.round((t - 50.9) * 26 + i * 28);
    if (x > 396) troop(x, 292, t, 70 + i, M(0), M(9));
  }
  if (t < 53.9) {
    drawAng(286, 58, t);
    line(390, 178, 414, 104, M(5));
    line(391, 178, 415, 104, M(7));
    rect(386, 174, 12, 3, M(15));
    for (let i = 0; i < 5; i++) {
      const ph = (t * 1.05 + i * 0.2) % 1;
      const x = Math.round(636 - ph * 300);
      const y = Math.round(120 + (i % 3) * 26 + Math.sin(ph * 4 + i) * 6);
      px(x, y, M(16));
      line(x + 2, y, x + 15, y - 2, M(10));
    }
  } else {
    drawAng(262, 178, t, { fallen: true });
    for (let i = 0; i < 4; i++) {
      const ax = 292 + i * 22, ay = 196 + (i % 2) * 8;
      line(ax, ay, ax + 12, ay - 20, M(10));
      px(ax + 12, ay - 20, M(6));
    }
    poly([[300, 236], [352, 232], [372, 244], [344, 252], [306, 248]], M(17));
    hline(312, 240, 48, M(18));
    if (t < 54.2) {
      for (let i = 0; i < 16; i++) {
        const a = hash(i, 71) * 6.283, r = 40 + hash(i, 72) * 30;
        px(Math.round(320 + Math.cos(a) * r), Math.round(240 + Math.sin(a) * r * 0.4), M(3));
      }
    }
  }
  // 「断后」标记
  if (t > 52.76) {
    const k = clamp((t - 52.76) / 0.3, 0, 1);
    if (k > 0.25) {
      textC('断后', 470, 60, M(16), 2);
      hline(434, 88, 72, M(18));
      dottedLine(438, 96, 400, 132, M(18), 4);
    }
  }
  if (t > 55.0) rider(96, 240, t, 9);
  sparkField(t, 43, 22);
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 19 · 55.1–58.1 逃出来，雨里
function sh19_escape(t, f) {
  const jx = Math.round(Math.sin(t * 8.2) * 0.8), jy = Math.round(Math.cos(t * 6.4) * 0.6);
  GX += jx; GY += jy;
  nightSky(f, 81);
  moon(f, 470, 66, 30);
  farMountains(0);
  groundPlane(252, t, 23);
  // 雨
  for (let i = 0; i < 90; i++) {
    const sp = 150 + hash(i, 31) * 90;
    const x = (hash(i, 33) * 700 - t * 39) % 700;
    const y = (hash(i, 37) * 340 + t * sp) % 340;
    if (x > -6 && y > -6) px(Math.round(x), Math.round(y), i % 4 ? M(26) : M(27));
  }
  // 孤马 + 塌肩的曹操
  const sway = Math.round(Math.sin(t * 2.1) * 1);
  drawHorse(238 + sway, 168, t);
  const rx = 304 + sway, ry = 190;
  const sob = Math.sin(t * 9) > 0 ? 1 : 0;
  poly([[rx - 16, ry - 20], [rx + 10, ry - 24], [rx + 18, ry - 2], [rx + 6, ry + 2], [rx - 18, ry], [rx - 22, ry - 12]], M(9));
  polyLine([[rx - 16, ry - 20], [rx + 10, ry - 24], [rx + 18, ry - 2], [rx + 6, ry + 2], [rx - 18, ry], [rx - 22, ry - 12]], M(0), true);
  disc(rx - 2, ry - 34, 8, M(14));
  rect(rx - 12, ry - 46, 20, 6, M(0));
  line(rx - 8, ry - 34, rx - 2, ry - 33, M(0));
  line(rx + 12, ry - 14, rx + 18, ry + 2 + sob, M(9));
  line(rx - 20, ry - 12, rx - 26, ry - 2 + sob, M(9));
  for (let i = 0; i < 8; i++) px(250 + i * 14, 160 + (i % 3) * 6, M(26));
  // 雾里丁夫人的背影
  if (t > 56.96) {
    const k = clamp((t - 56.96) / 0.6, 0, 1);
    drawWomanBack(512, 92, t, M(3));
    fogPatch(552, 196, 150, 54, E.fog, 0.30 * k, f);
    fogPatch(534, 152, 116, 60, M(2), 0.20 * k, f);
  }
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 20 · 58.1–61.5 本来要接班
function sh20_heir(t, f) {
  const jx = Math.round(Math.sin(t * 9.6) * 0.8), jy = Math.round(Math.cos(t * 7.1) * 0.6);
  GX += jx; GY += jy;
  rect(-10, 0, 660, 304, M(1));
  for (let x = -8; x < 650; x += 34) vline(x, 0, 304, M(2));
  dithGrad(-10, 0, 650, 80, M(0), M(1));
  rect(-10, 286, 660, 18, M(0));
  pillar(16, 10, 0, 304);
  pillar(614, 10, 0, 304);
  // 画框里的曹昂
  rect(66, 22, 176, 240, M(10));
  polyLine([[66, 22], [242, 22], [242, 262], [66, 262]], M(15), true);
  rect(74, 30, 160, 224, M(0));
  drawAng(84, 44, t);
  glowSpot(154, 140, 90, 1, 0.10);
  // 名匾
  rect(96, 0, 60, 22, M(9));
  hline(96, 0, 60, M(12));
  textC('曹昂', 126, 1, M(15), 1);
  // 世系双牌
  const m1 = [356, 92], m2 = [512, 92];
  for (const [m, robe, lit] of [[m1, M(9), t > T('heir')], [m2, M(20), true]]) {
    disc(m[0], m[1], 40, M(1));
    ring(m[0], m[1], 40, lit ? M(15) : M(9), 0);
    disc(m[0], m[1] + 26, 26, robe);
    disc(m[0], m[1] + 4, 16, M(14));
    rect(m[0] - 16, m[1] - 12, 32, 11, M(0));
    px(m[0] - 5, m[1] + 6, M(0)); px(m[0] + 5, m[1] + 6, M(0));
  }
  textC('曹操', m1[0], 150, M(15), 2);
  textC('曹昂', m2[0], 150, M(15), 2);
  // 红线相连
  if (t > T('heir')) {
    const k = clamp((t - T('heir')) / 0.45, 0, 1);
    const x1 = m1[0] + 44, x2 = m2[0] - 44;
    line(x1, 92, Math.round(lerp(x1, x2, k)), 92, M(18));
    line(x1, 93, Math.round(lerp(x1, x2, k)), 93, M(17));
    if (k >= 1) {
      poly([[x2 + 2, 92], [x2 - 8, 86], [x2 - 8, 98]], M(18));
      glowSpot((x1 + x2) / 2, 92, 30, 1, 0.18);
    }
  }
  // 嫡长子
  if (t > 60.2) {
    const lt = t - 60.2;
    const drop = lt < 0.1 ? Math.round(34 * (1 - lt / 0.1) ** 2) : 0;
    sealStamp(290, 206 + drop, 76, '嫡长子', true);
  }
  dustMotes(t, 20, 51, 30, 610, 60, 280, M(6));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 21 · 61.5–66.6 丁夫人养大
function sh21_dingraises(t, f) {
  const jx = Math.round(Math.sin(t * 7.8) * 0.7), jy = Math.round(Math.cos(t * 6.1) * 0.5);
  GX += jx; GY += jy;
  rect(-10, 0, 660, 304, M(1));
  for (let x = -8; x < 650; x += 30) { vline(x, 0, 304, M(2)); vline(x + 1, 0, 304, M(0)); }
  rect(-10, 280, 660, 24, M(0));
  dithGrad(-10, 232, 650, 290, M(1), M(0));
  candle(58, 196, t, 1);
  candle(566, 200, t, 1);
  glowSpot(320, 210, 180, 1, 0.07);
  drawLoom(392, 284, t, 1);
  drawDingSeat(112, 172, t);
  drawChild(300, 214, t);
  // 金线：丁夫人牵着小曹昂
  if (t > 62.28) {
    const k = clamp((t - 62.28) / 0.6, 0, 1);
    let lx = 192, ly = 192;
    const N = 26;
    for (let i = 1; i <= N * k; i++) {
      const u = i / N;
      const x = lerp(192, 300, u), y = lerp(192, 214, u) + Math.sin(t * 3 + u * 9) * 3;
      line(Math.round(lx), Math.round(ly), Math.round(x), Math.round(y), M(15));
      lx = x; ly = y;
    }
    for (let i = 0; i < 5; i++) {
      const u = (t * 0.4 + i * 0.2) % 1;
      px(Math.round(lerp(196, 296, u)), Math.round(lerp(192, 214, u)), M(16));
    }
  }
  // 空摇篮
  if (t > 63.7) {
    const k = clamp((t - 63.7) / 0.35, 0, 1);
    const cx = 340, cy = 276, sw = Math.round(Math.sin(t * 2.6) * 2);
    poly([[cx - 34, cy - 16], [cx + 34, cy - 16], [cx + 30, cy + 6 + sw], [cx - 30, cy + 6 - sw]], M(10));
    polyLine([[cx - 34, cy - 16], [cx + 34, cy - 16], [cx + 30, cy + 6 + sw], [cx - 30, cy + 6 - sw]], M(12), true);
    line(cx - 34, cy - 16, cx - 40, cy + 4, M(9));
    line(cx + 34, cy - 16, cx + 40, cy + 4, M(9));
    rect(cx - 30, cy - 20, 60, 5, M(12));
    hline(cx - 24, cy - 8, 48, M(28));
    if (k > 0.4) textC('空', cx, cy - 40, M(9), 2);
  }
  // 命根子：红绳
  if (t > 65.22) {
    const k = clamp((t - 65.22) / 0.4, 0, 1);
    let lx = 312, ly = 226;
    const N = 22;
    for (let i = 1; i <= N * k; i++) {
      const u = i / N;
      const x = lerp(312, 176, u), y = lerp(226, 196, u) + Math.sin(u * 7) * 2;
      line(Math.round(lx), Math.round(ly), Math.round(x), Math.round(y), M(18));
      lx = x; ly = y;
    }
    if (k > 0.5) {
      textC('命根子', 200, 100, M(16), 2);
      hline(148, 128, 104, M(18));
      glowSpot(190, 190, 26, 1, 0.2);
    }
  }
  textSC('丁夫人', 320, 8, M(15), 2);
  hline(260, 40, 120, M(18));
  dustMotes(t, 18, 57, 30, 610, 60, 270, M(12));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 22 · 66.6–70.8 手把手带兵
function sh22_trains(t, f) {
  const jx = Math.round(Math.sin(t * 8.8) * 0.8), jy = Math.round(Math.cos(t * 6.6) * 0.6);
  GX += jx; GY += jy;
  skyBand(-8, 120, M(2), M(17));
  skyBand(120, 210, M(17), M(10));
  skyBand(210, 304, M(10), M(9));
  groundPlane(256, t, 31);
  // 背景军旗
  for (let i = 0; i < 5; i++) {
    const fx = 176 + i * 46;
    vline(fx, 136, 60, M(9));
    const fl = Math.round(Math.sin(t * 3 + i) * 2);
    poly([[fx + 1, 138], [fx + 26, 142 + fl], [fx + 22, 162], [fx + 1, 158]], M(17));
    polyLine([[fx + 1, 138], [fx + 26, 142 + fl], [fx + 22, 162], [fx + 1, 158]], M(18), true);
  }
  // 大「战」旗
  if (t > 68.26) {
    const k = clamp((t - 68.26) / 0.4, 0, 1);
    const fl = Math.round(Math.sin(t * 2.8) * 3);
    const h = Math.round(58 * k);
    if (h > 4) {
      poly([[470, 150], [542, 156 + fl], [536, 150 + h], [470, 148 + h]], M(17));
      polyLine([[470, 150], [542, 156 + fl], [536, 150 + h], [470, 148 + h]], M(18), true);
      if (h > 40) textC('战', 506, 164, M(16), 2);
    }
  }
  // 列队操练
  for (let i = 0; i < 9; i++) {
    const x = 130 + i * 40 + Math.round(((t - 66.6) * 9) % 40);
    troop(x, 268, t, 90 + i, M(0), M(9));
    troop(x + 12, 280, t, 100 + i, M(0), M(9));
  }
  // 鼓
  const beat = (Math.floor(t * 2) % 2) ? 0.3 : 0;
  for (const dx of [58, 96]) {
    disc(dx, 262, 14, M(9));
    disc(dx, 262, 11, M(10));
    ring(dx, 262, 12, M(12), 0);
    line(dx - 4, 240, dx + 8, 248 - beat * 6, M(12));
    px(dx + 10, 246 - beat * 6, M(14));
  }
  drawCao2(36, 50, t);
  drawAng(440, 60, t);
  // 带兵红线
  if (t > 69.36) {
    const k = clamp((t - 69.36) / 0.4, 0, 1);
    const p0 = [140, 128], p1 = [300, 110], p2 = [452, 128];
    let lx = p0[0], ly = p0[1];
    const N = 26;
    for (let i = 1; i <= N * k; i++) {
      const [x, y] = qPoint(p0, p1, p2, i / N);
      if (i % 2) line(Math.round(lx), Math.round(ly), Math.round(x), Math.round(y), M(18));
      lx = x; ly = y;
    }
    if (k >= 1) {
      poly([[452, 128], [440, 120], [442, 136]], M(18));
      textC('带兵', 300, 82, M(16), 2);
    }
  }
  textSC('手把手', 320, 8, M(15), 2);
  hline(244, 40, 152, M(18));
  dustMotes(t, 22, 63, 30, 610, 60, 260, M(12));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 23 · 70.8–73.7 四十多与二十
function sh23_ages(t, f) {
  const jx = Math.round(Math.sin(t * 7.2) * 0.6), jy = Math.round(Math.cos(t * 5.8) * 0.5);
  GX += jx; GY += jy;
  rect(-10, 0, 330, 304, M(9));
  rect(320, 0, 330, 304, M(31));
  dithGrad(-10, 120, 320, 304, M(9), M(2));
  dithGrad(320, 120, 650, 304, M(31), M(1));
  vline(320, 0, 304, M(0));
  vline(321, 0, 304, M(0));
  // 年龄刻度
  for (let i = 0; i < 9; i++) {
    hline(14, 40 + i * 26, 10 + i * 2, M(12));
    hline(616 - i * 2, 40 + i * 26, 10 + i * 2, M(26));
  }
  drawCao2(88, 88, t);
  drawAng(396, 96, t);
  textC('40+', 74, 8, M(15), 3);
  textC('20', 566, 8, M(28), 3);
  // 淡淡的「位子」
  if (t > 73.0) {
    const k = clamp((t - 73.0) / 0.6, 0, 1);
    const c = mixIdx(1, 11, k);
    rect(286, 250, 68, 10, c);
    rect(292, 194, 56, 60, c);
    rect(284, 186, 72, 10, c);
    hline(284, 184, 72, M(12));
    rect(300, 160, 40, 30, c);
  }
  dustMotes(t, 14, 69, 40, 600, 60, 280, M(12));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 24 · 73.7–79.1 老臣都认他
function sh24_future(t, f) {
  const jx = Math.round(Math.sin(t * 7.4) * 0.7), jy = Math.round(Math.cos(t * 6.2) * 0.5);
  GX += jx; GY += jy;
  rect(-10, 0, 660, 304, M(1));
  // 殿内红柱与横梁
  rect(-10, 0, 660, 40, M(9));
  hline(-10, 40, 660, M(12));
  for (const p of [26, 200, 430, 604]) pillar(p, 14, 40, 304);
  dithGrad(-10, 0, 650, 60, M(0), M(1));
  rect(-10, 284, 660, 20, M(0));
  // 御座
  const tx = 320, ty = 236;
  rect(tx - 40, ty + 30, 80, 12, M(9));
  rect(tx - 34, ty - 6, 68, 40, M(10));
  rect(tx - 44, ty - 12, 88, 12, M(12));
  hline(tx - 44, ty - 14, 88, M(15));
  rect(tx - 22, ty + 8, 44, 4, M(15));
  // 曹昂立座前
  drawAng(272, 40, t);
  // 老臣分列，依次躬身
  const sched = [75.56, 76.3, 77.0, 77.44, 78.0, 78.3];
  const seats = [62, 110, 158, 482, 530, 578];
  for (let i = 0; i < 6; i++) {
    const b = clamp((t - sched[i]) / 0.3, 0, 1);
    drawMinister(seats[i], 240, t, i, b);
  }
  // 人缘：红线从老臣连到曹昂
  if (t > 77.44) {
    const k = clamp((t - 77.44) / 0.5, 0, 1);
    for (let i = 0; i < 6; i++) {
      const x0 = seats[i] + 6, y0 = 226;
      const ex = Math.round(lerp(x0, 330, k)), ey = Math.round(lerp(y0, 150, k));
      line(x0, y0, ex, ey, M(18));
      if (i % 2) px(ex, ey, M(19));
    }
    if (k > 0.6) glowSpot(330, 150, 40, 1, 0.18);
  }
  textSC('认他', 320, 8, M(15), 2);
  hline(284, 40, 72, M(18));
  // 79.02 起黑场抖动
  const bk = clamp((t - 79.02) / 0.5, 0, 1);
  if (bk > 0) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (bay(x, y) < bk) IB[y * W + x] = 0;
  }
  dustMotes(t, 16, 59, 30, 610, 60, 280, M(6));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 25 · 79.1–82.4 这一夜什么都没了
function sh25_nightlost(t, f) {
  const jx = Math.round(Math.sin(t * 7.0) * 0.6), jy = Math.round(Math.cos(t * 5.6) * 0.5);
  GX += jx; GY += jy;
  rect(-10, 0, 660, 304, M(1));
  dithGrad(-10, 0, 650, 90, M(0), M(1));
  rect(-10, 284, 660, 20, M(0));
  // 月光窗
  paperWindow(500, 62, 116, 116, t);
  // 屏风四扇
  const sx0 = 52, sy0 = 76, sw = 236, sh = 208;
  for (let i = 0; i < 4; i++) {
    const pw = sw / 4;
    rect(sx0 + i * pw, sy0, pw - 2, sh, M(2));
    polyLine([[sx0 + i * pw, sy0], [sx0 + i * pw + pw - 2, sy0], [sx0 + i * pw + pw - 2, sy0 + sh], [sx0 + i * pw, sy0 + sh]], M(10), true);
    rect(sx0 + i * pw + 6, sy0 + 8, pw - 14, sh - 16, M(1));
  }
  // 屏上淡淡的女子影
  ghostify(150, 120, 190, 250, 0.62, M(2));
  // 白绫从梁上垂落
  if (t > 80.88) {
    const k = clamp((t - 80.88) / 0.55, 0, 1);
    const h = Math.round(244 * k);
    rect(118, 0, 96, h, M(28));
    for (let i = 0; i < 96; i += 7) vline(118 + i, 0, h, M(26));
    if (h > 2) hline(118, h - 2, 96, M(27));
    if (h > 150) textC('奠', 166, 120, M(0), 3);
    const fl = Math.round(Math.sin(t * 2) * 2);
    poly([[118, 0], [118, h], [110, h - 16 + fl], [110, 0]], M(27));
    glowSpot(166, 130, 60, 1, 0.06);
  }
  // 门外的冷光，曹操的影子
  if (t > 81.9) {
    const k = clamp((t - 81.9) / 0.4, 0, 1);
    rect(-10, 110, 44, 174, M(9));
    rect(-6, 116, 36, 168, M(27));
    for (let y = 116; y < 284; y += 12) hline(-6, y, 36, M(26));
    glowSpot(14, 200, 40, 1, 0.14 * k);
    // 影子
    rect(6, 188, 12, 52, M(0));
    disc(12, 184, 6, M(0));
  }
  dustMotes(t, 12, 73, 60, 590, 40, 280, M(6));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 26 · 82.4–84.9 闹
function sh26_fury(t, f) {
  const jx = Math.round(Math.sin(t * 15.0) * 1.4), jy = Math.round(Math.cos(t * 12.0) * 1.0);
  GX += jx; GY += jy;
  for (let i = 0; i < 8; i++) {
    const c = mixIdx(9, 17, i / 7);
    rect(-8, i * 38 - 4, 656, 40, M(c));
  }
  for (let y = 0; y < 304; y++) for (let x = 0; x < 640; x++) if (hash(x, y) < 0.02) px(x, y, M(9));
  rect(-10, 286, 660, 18, M(0));
  // 瓷瓶
  const vy = 256;
  poly([[292, vy], [308, vy - 18], [312, vy - 40], [326, vy - 48], [340, vy - 40], [344, vy - 18], [360, vy]], M(20));
  hline(296, vy - 34, 56, M(22));
  glowSpot(326, vy - 24, 26, 1, 0.12);
  drawDing(36, 44, t, { angry: true });
  drawCao2(400, 46, t);
  // 指认的红线
  if (t > 83.0) {
    const k = clamp((t - 83.0) / 0.35, 0, 1);
    let lx = 160, ly = 150;
    const N = 18;
    for (let i = 1; i <= N * k; i++) {
      const u = i / N;
      const x = lerp(160, 402, u), y = lerp(150, 160, u) + Math.round(Math.sin(u * 14) * 6);
      line(Math.round(lx), Math.round(ly), Math.round(x), Math.round(y), M(18));
      lx = x; ly = y;
    }
  }
  // 怒火
  for (let i = 0; i < 10; i++) {
    const ph = (t * 1.6 + i * 0.1) % 1;
    const x = 60 + Math.floor(hash(i, 5) * 100), y = 160 - Math.round(ph * 60);
    if (ph < 0.8) px(x, y, i % 2 ? M(18) : M(19));
  }
  // 砸碎瓷瓶
  if (t > 84.06) {
    for (let i = 0; i < 14; i++) {
      const a = hash(i, 9) * 6.283, d = 12 + hash(i, 11) * 40 + ((t - 84.06) * 60) % 30;
      const x = Math.round(326 + Math.cos(a) * d), y = Math.round(240 + Math.sin(a) * d * 0.6 + (t - 84.06) * 40);
      px(x, y, i % 3 ? M(20) : M(26));
    }
    poly([[292, 256], [308, 238], [312, 232], [318, 240], [300, 256]], M(1));
    glowSpot(326, 236, 30, 1, 0.2);
  }
  textSC('闹', 320, 10, M(15), 3);
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 27 · 84.9–89.8 去求她
function sh27_beg(t, f) {
  const jx = Math.round(Math.sin(t * 7.6) * 0.7), jy = Math.round(Math.cos(t * 6.0) * 0.5);
  GX += jx; GY += jy;
  woodWall(t);
  rect(-10, 284, 660, 20, M(0));
  // 门洞：外头的冷光
  rect(-10, 96, 96, 190, M(9));
  rect(-6, 102, 84, 182, M(27));
  for (let y = 102; y < 284; y += 10) hline(-6, y, 84, M(26));
  glowSpot(34, 230, 46, 1, 0.16);
  drawLoom(404, 284, t, 1);
  drawDingSeat(300, 180, t, { back: true });
  // 曹操进门
  if (t > 84.96) {
    const k = clamp((t - 84.96) / 0.9, 0, 1);
    drawCao2(Math.round(lerp(-150, 56, k)), 64, t);
  }
  // 珠帘挡驾
  if (t > 86.4) {
    const k = clamp((t - 86.4) / 0.4, 0, 1);
    const h = Math.round(180 * k);
    for (let x = 150; x < 250; x += 4) {
      const wob = Math.round(Math.sin(t * 1.8 + x * 0.07) * 2);
      vline(x + wob, 60, h, x % 8 < 4 ? M(28) : M(27));
    }
    for (let y = 60; y < 60 + h; y++) for (let x = 150; x < 250; x++) if (bay(x, y) < 0.55) px(x, y, M(0));
    hline(150, 60, 100, M(12));
  }
  // 伸手
  if (t > 89.78) {
    const k = clamp((t - 89.78) / 0.4, 0, 1);
    const hx = Math.round(lerp(170, 286, k));
    poly([[150, 168], [hx, 170], [hx + 8, 184], [150, 186]], M(10));
    rect(hx, 170, 12, 14, M(14));
  }
  candle(566, 218, t, 1);
  textSC('求', 320, 10, M(15), 3);
  dustMotes(t, 16, 77, 40, 600, 60, 280, M(6));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 28 · 89.8–96.0 真离了
function sh28_begfinal(t, f) {
  const jx = Math.round(Math.sin(t * 8.4) * 0.8), jy = Math.round(Math.cos(t * 6.6) * 0.6);
  GX += jx; GY += jy;
  rect(-10, 0, 660, 304, M(1));
  for (let x = -8; x < 650; x += 30) vline(x, 0, 304, M(2));
  rect(-10, 280, 660, 24, M(0));
  dithGrad(-10, 236, 650, 292, M(1), M(0));
  candle(392, 178, t, 1);
  drawLoom(430, 284, t, 1);
  drawDingSeat(238, 168, t, { back: true, idle: t > 92.2 });
  drawCao2(-44, 42, t);
  // 按在背上的手
  if (t > 89.86 && t < 93.68) {
    const k = clamp((t - 89.86) / 0.4, 0, 1);
    const hx = Math.round(lerp(90, 280, k));
    poly([[70, 150], [hx, 158], [hx + 6, 172], [70, 168]], M(10));
    rect(hx, 158, 14, 14, M(14));
    line(hx + 2, 162, hx + 10, 162, M(13));
  }
  // 沉默
  if (t > 92.2 && t < 93.68) textC('...', 340, 46, M(26), 3);
  // 红绳绷紧、崩断
  if (t > 93.9 && t < 94.88) {
    line(270, 150, 120, 132, M(18));
    line(270, 151, 120, 133, M(17));
  }
  if (t > 94.88) {
    const lt = t - 94.88;
    line(270, 150, 204, 140, M(18));
    line(120, 132, 152, 136, M(17));
    if (lt < 0.5) {
      for (let i = 0; i < 12; i++) {
        const a = hash(i, 21) * 6.283, d = 8 + hash(i, 22) * 30 * lt * 4;
        px(Math.round(240 + Math.cos(a) * d), Math.round(140 + Math.sin(a) * d), i % 2 ? M(19) : M(18));
      }
    }
  }
  if (t > 95.1) {
    const lt = t - 95.1;
    const drop = lt < 0.1 ? Math.round(36 * (1 - lt / 0.1) ** 2) : 0;
    sealStamp(512, 26 + drop, 74, '离', true);
  }
  dustMotes(t, 12, 83, 40, 600, 60, 270, M(6));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 29 · 96.0–102.6 晚年念叨
function sh29_regret(t, f) {
  const jx = Math.round(Math.sin(t * 6.8) * 0.6), jy = Math.round(Math.cos(t * 5.4) * 0.5);
  GX += jx; GY += jy;
  rect(-10, 0, 660, 304, M(1));
  // 书架
  for (const bx of [8, 536]) {
    rect(bx, 60, 96, 200, M(9));
    for (let r = 0; r < 4; r++) {
      hline(bx + 4, 82 + r * 48, 88, M(12));
      for (let i = 0; i < 6; i++) rect(bx + 8 + i * 14, 66 + r * 48, 10, 12, i % 2 ? M(10) : M(11));
    }
  }
  dithGrad(-10, 0, 650, 60, M(0), M(1));
  lowTable(150, 266, 340);
  drawScroll(196, 218, 108, 40, t, 3);
  drawScroll(316, 222, 92, 36, t, 3);
  candle(470, 196, t, 1);
  drawOldCao(240, 60, t);
  // 身后浮现的鬼影
  if (t > 99.14) {
    const k = clamp((t - 99.14) / 0.7, 0, 1);
    drawAng(30, 54, t);
    ghostify(20, 44, 170, 252, 0.30 + 0.35 * k, M(1));
  }
  if (t > 101.06) {
    const k = clamp((t - 101.06) / 0.6, 0, 1);
    drawDing(514, 56, t);
    ghostify(502, 44, 634, 252, 0.30 + 0.35 * k, M(1));
  }
  // 脸暗下去
  if (t > 101.88) {
    const k = clamp((t - 101.88) / 0.6, 0, 1);
    for (let y = 40; y < 150; y++) for (let x = 236; x < 356; x++) if (bay(x, y) < k * 0.6) px(x, y, M(0));
  }
  textSC('念叨', 320, 8, M(15), 2);
  dustMotes(t, 16, 87, 30, 610, 60, 280, M(6));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 30 · 102.6–107.5 代价
function sh30_price(t, f) {
  const jx = Math.round(Math.sin(t * 7.0) * 0.7), jy = Math.round(Math.cos(t * 5.8) * 0.5);
  GX += jx; GY += jy;
  for (let i = 0; i < 8; i++) {
    const c = mixIdx(17, 9, i / 7);
    rect(-8, i * 38 - 4, 656, 40, M(c));
  }
  for (let y = 0; y < 304; y++) for (let x = 0; x < 640; x++) if (hash(x, y) < 0.015) px(x, y, M(9));
  textC('价', 320, 30, M(9), 6);
  // 天平倾斜
  let tilt = 0.12 + 0.10 * Math.sin(t * 1.3);
  if (t > T('price')) tilt = lerp(tilt, 0.55, clamp((t - T('price')) / 0.6, 0, 1));
  if (t > 104.68) tilt = lerp(tilt, 0.9, clamp((t - 104.68) / 0.6, 0, 1));
  drawScale(320, 96, tilt, t);
  const a = tilt * 0.32, dx = Math.round(Math.cos(a) * 132), dy = Math.round(Math.sin(a) * 132);
  const lx = 320 - dx, ly = 96 - dy + 34;
  const rx = 320 + dx, ry = 96 + dy + 34;
  // 左盘：一夜
  poly([[lx - 6, ly - 6], [lx + 2, ly - 30], [lx + 8, ly - 6], [lx + 2, ly]], M(28));
  line(lx + 1, ly - 26, lx + 1, ly - 4, M(26));
  rect(lx - 16, ly - 6, 30, 14, M(28));
  textC('一夜', lx - 2, ly - 4, M(17), 1);
  // 右盘：曹昂 / 丁氏
  rect(rx - 30, ry - 10, 60, 12, M(10));
  textC('曹昂', rx - 16, ry - 9, M(15), 1);
  textC('丁氏', rx + 16, ry - 9, M(28), 1);
  // 命：砝码砸下
  if (t > 104.68) {
    const k = clamp((t - 104.68) / 0.25, 0, 1);
    const wy = Math.round(ry - 70 + 30 * k);
    rect(rx - 16, wy, 32, 26, M(9));
    polyLine([[rx - 16, wy], [rx + 16, wy], [rx + 16, wy + 26], [rx - 16, wy + 26]], M(15), true);
    textC('命', rx, wy + 2, M(19), 1);
  }
  textSC('代价', 320, 8, M(15), 3);
  dustMotes(t, 16, 93, 30, 610, 60, 280, M(19));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 31 · 107.5–112.1 推演
function sh31_chain(t, f) {
  const jx = Math.round(Math.sin(t * 7.4) * 0.6), jy = Math.round(Math.cos(t * 5.9) * 0.5);
  GX += jx; GY += jy;
  // 羊皮纸
  rect(-10, 0, 660, 304, M(28));
  for (let y = 0; y < 304; y++) for (let x = 0; x < 640; x++) {
    if (hash(x, y) < 0.04) px(x, y, M(27));
    if (hash(x + 9, y + 3) < 0.01) px(x, y, M(12));
  }
  rect(-10, 0, 660, 34, M(28));
  rect(-10, 292, 660, 12, M(12));
  const nodes = [
    ['曹昂', '197', M(20)], ['曹丕', '220', M(28)], ['曹叡', '226', M(12)],
    ['曹爽', '239', M(10)], ['司马', '249', M(31)], ['晋', '265', M(15)],
  ];
  const xs = [46, 150, 254, 358, 462, 566];
  const y = 256;
  drawChain(68, 198, 544, 198, t, M(12), M(15));
  for (let i = 0; i < 6; i++) {
    const dead = i === 0 && t > 110.92;
    drawDomino(xs[i], y, 44, 96, 0, dead ? M(2) : nodes[i][2], nodes[i][0]);
    textC(nodes[i][1], xs[i] + 22, y + 2, M(11), 1);
  }
  // 第一块亮起 → 黑掉
  if (t > 108.62) {
    if (t < 110.92) {
      glowSpot(xs[0] + 22, y - 48, 46, 1, 0.30);
      polyLine([[xs[0], y], [xs[0] + 44, y], [xs[0] + 44, y - 96], [xs[0], y - 96]], M(15), true);
    } else {
      polyLine([[xs[0] + 10, y - 60], [xs[0] + 22, y - 40], [xs[0] + 14, y - 20]], M(0), false);
      line(xs[0] + 6, y - 20, xs[0] + 38, y - 76, M(18));
      line(xs[0] + 6, y - 76, xs[0] + 38, y - 20, M(18));
    }
  }
  // 轮不到曹丕
  if (t > 109.82 && t < 110.92) {
    line(xs[1], y - 96, xs[1] + 44, y, M(18));
    line(xs[1] + 44, y - 96, xs[1], y, M(18));
  }
  // 推演印
  if (t > 107.94) {
    const lt = t - 107.94;
    const drop = lt < 0.1 ? Math.round(30 * (1 - lt / 0.1) ** 2) : 0;
    sealStamp(548, 40 + drop, 62, '推演', true);
  }
  dustMotes(t, 10, 117, 30, 610, 40, 280, M(12));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 32 · 112.1–115.2 二选一
function sh32_choose(t, f) {
  const jx = Math.round(Math.sin(t * 7.8) * 0.7), jy = Math.round(Math.cos(t * 6.1) * 0.5);
  GX += jx; GY += jy;
  rect(-10, 0, 260, 304, M(31));
  rect(390, 0, 260, 304, M(9));
  dithGrad(-10, 120, 250, 304, M(31), M(1));
  dithGrad(390, 120, 650, 304, M(9), M(2));
  textC('丕', 120, 22, M(24), 5);
  textC('植', 520, 22, M(17), 5);
  drawBust(120, 128, t, M(9), M(0), { beard: true });
  drawBust(520, 128, t, M(20), M(0));
  vline(250, 0, 304, M(0));
  vline(390, 0, 304, M(0));
  drawCao2(252, 66, t);
  // 指向曹丕
  if (t > 114.18) {
    const k = clamp((t - 114.18) / 0.35, 0, 1);
    line(300, 128, Math.round(lerp(300, 150, k)), 128, M(18));
    line(300, 129, Math.round(lerp(300, 150, k)), 129, M(17));
    if (k >= 1) poly([[150, 128], [162, 122], [162, 134]], M(18));
  }
  // 嗣印
  if (t > 115.0) {
    const lt = t - 115.0;
    const drop = lt < 0.1 ? Math.round(34 * (1 - lt / 0.1) ** 2) : 0;
    sealStamp(400, 200 + drop, 74, '嗣', true);
  }
  textSC('二选一', 320, 8, M(15), 2);
  dustMotes(t, 14, 97, 30, 610, 60, 280, M(12));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 33 · 115.2–118.2 禅让
function sh33_abdicate(t, f) {
  const jx = Math.round(Math.sin(t * 6.9) * 0.7), jy = Math.round(Math.cos(t * 5.6) * 0.5);
  GX += jx; GY += jy;
  rect(-10, 0, 660, 304, M(1));
  rect(-10, 0, 660, 34, M(9));
  dithGrad(-10, 34, 650, 120, M(9), M(1));
  for (const q of [18, 232, 418, 604]) pillar(q, 22, 0, 304);
  // 红毯
  rect(84, 268, 472, 36, M(17));
  hline(84, 268, 472, M(18));
  for (let x = 96; x < 552; x += 14) vline(x, 274, 26, M(9));
  drawEmperor(58, 86, t, { seal: t < T('abdicate') });
  drawBust(520, 120, t, M(9), M(0), { beard: true });
  // 玉玺飞渡
  if (t > T('abdicate')) {
    const u = clamp((t - T('abdicate')) / 0.66, 0, 1);
    if (u < 1) {
      const p0 = qPoint([112, 188], [320, 92], [520, 176], u);
      const sx = Math.round(p0[0]), sy = Math.round(p0[1]);
      rect(sx - 8, sy - 7, 16, 14, M(29));
      rect(sx - 6, sy - 5, 12, 10, M(15));
      hline(sx - 8, sy - 7, 16, M(16));
      glowSpot(sx, sy, 22, 1, 0.4);
      for (let i = 1; i <= 3; i++) {
        const p1 = qPoint([112, 188], [320, 92], [520, 176], Math.max(0, u - i * 0.06));
        px(p1[0], p1[1], M(16));
      }
    } else {
      rect(512, 168, 16, 14, M(29));
      rect(514, 170, 12, 10, M(15));
      hline(512, 168, 16, M(16));
      glowSpot(520, 175, 26, 1, 0.5);
    }
  }
  // 冕冠
  if (t > 116.44) {
    const k = clamp((t - 116.44) / 0.3, 0, 1);
    const cy = Math.round(lerp(92, 100, k));
    rect(494, cy, 52, 6, M(0));
    hline(494, cy, 52, M(15));
    for (let i = 0; i < 7; i++) { vline(498 + i * 8, cy + 6, 10, M(27)); px(498 + i * 8, cy + 6, M(15)); }
    glowSpot(520, cy + 4, 34, 1, 0.22);
  }
  // 曹丕传曹叡
  if (t > 117.34) {
    const k = clamp((t - 117.34) / 0.35, 0, 1);
    rect(272, 178, 76, 92, M(9));
    rect(278, 184, 64, 80, M(1));
    polyLine([[272, 178], [348, 178], [348, 270], [272, 270]], M(12), true);
    poly([[288, 264], [296, 226], [326, 226], [334, 264]], M(20));
    disc(311, 210, 13, M(14));
    rect(299, 192, 24, 8, M(0));
    hline(296, 200, 30, M(15));
    px(306, 212, M(0)); px(316, 212, M(0));
    glowSpot(311, 214, 40, 1, 0.12);
    textC('曹叡', 310, 148, M(15), 2);
    const ex = Math.round(lerp(476, 354, k));
    line(476, 214, ex, 214, M(18)); line(476, 215, ex, 215, M(17));
    poly([[ex, 214], [ex + 10, 209], [ex + 10, 219]], M(18));
  }
  textSC('禅让', 320, 6, M(15), 2);
  dustMotes(t, 16, 121, 30, 610, 60, 280, M(12));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 34 · 118.2–122.9 托孤
function sh34_tuogu(t, f) {
  const jx = Math.round(Math.sin(t * 6.4) * 0.7), jy = Math.round(Math.cos(t * 5.1) * 0.5);
  GX += jx; GY += jy;
  woodWall(t);
  hangingLantern(60, 16, t);
  hangingLantern(200, 16, t);
  drawEmperor(34, 92, t, { crown: true });
  // 诏书展开
  if (t > T('tuogu')) {
    const k = clamp((t - T('tuogu')) / 0.5, 0, 1);
    drawScroll(150, 168, Math.round(lerp(28, 118, k)), 84, t, 5);
    if (t > T('tuogu') + 0.5) {
      const lt = t - T('tuogu') - 0.5;
      const drop = lt < 0.1 ? Math.round(24 * (1 - lt / 0.1) ** 2) : 0;
      sealStamp(158, 176 + drop, 34, '诏', true);
    }
  }
  drawCaoShuang(286, 94, t, { cup: t > 120.06 });
  drawSima(462, 94, t, { glint: t > 122.4 });
  if (t > 120.06) {
    textC('二世祖', 348, 60, M(15), 2);
    glowSpot(348, 128, 56, 1, 0.14);
  }
  if (t > 121.46) {
    textC('装病', 520, 60, M(15), 2);
    glowSpot(518, 126, 54, 1, 0.12);
    const b = clamp((t - 121.46) / 0.5, 0, 1) * 0.8;
    drawMinister(588, 240, t, 4, b);
    drawMinister(616, 240, t, 5, b * 0.8);
  }
  textSC('托孤', 320, 6, M(15), 2);
  dustMotes(t, 16, 127, 30, 610, 60, 280, M(12));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 35 · 122.9–127.6 装病
function sh35_simabed(t, f) {
  const jx = Math.round(Math.sin(t * 5.8) * 0.6), jy = Math.round(Math.cos(t * 4.9) * 0.4);
  GX += jx; GY += jy;
  woodWall(t);
  paperWindow(288, 46, 116, 88, t);
  candle(30, 196, t);
  // 床
  rect(56, 206, 366, 10, M(9));
  hline(56, 206, 366, M(12));
  rect(64, 216, 8, 54, M(9));
  rect(404, 216, 8, 54, M(9));
  rect(64, 192, 350, 16, M(28));
  hline(64, 192, 350, M(26));
  // 被子随呼吸起伏
  const br = Math.round(Math.sin(t * 1.35) * 1);
  poly([[64, 208], [96, 190 + br], [150, 184 + br], [230, 186], [300, 190 + br], [344, 197], [346, 208]], M(17));
  polyLine([[64, 208], [96, 190 + br], [150, 184 + br], [230, 186], [300, 190 + br], [344, 197], [346, 208]], M(9), false);
  for (let i = 0; i < 5; i++) line(96 + i * 50, 190 + br, 110 + i * 50, 206, M(9));
  // 枕 + 侧脸
  rect(330, 176, 48, 18, M(28));
  hline(330, 176, 48, M(26));
  poly([[340, 182], [352, 174], [366, 174], [372, 182], [372, 196], [362, 206], [344, 206], [336, 196]], M(13));
  poly([[338, 182], [344, 170], [360, 168], [372, 174], [368, 182], [356, 178], [346, 186]], M(27));
  poly([[338, 198], [346, 204], [352, 220], [344, 222], [336, 208]], M(28));
  px(338, 192, M(12));
  px(344, 195, M(18));
  line(346, 188, 354, 187, M(6));
  const gl = t > 126.04;
  px(348, 189, gl ? M(16) : M(6));
  if (gl) glowSpot(348, 189, 10, 1, 0.35);
  // 十年刻痕
  for (let i = 0; i < 10; i++) {
    if (t > 124.88 + i * 0.12) {
      const tx = 420 + i * 9;
      vline(tx, 120, 26, M(12));
      line(tx + 4, 118, tx + 1, 146, M(12));
    }
  }
  if (t > 126.08) textC('十年', 460, 152, M(15), 2);
  // 曹字匾裂开
  rect(470, 30, 76, 70, M(10));
  rect(474, 34, 68, 62, M(9));
  polyLine([[470, 30], [546, 30], [546, 100], [470, 100]], M(12), true);
  textC('曹', 508, 44, M(28), 2);
  if (t > 125.2) {
    const k = clamp((t - 125.2) / 0.4, 0, 1);
    const segs = [[508, 100], [503, 82], [512, 70], [506, 56], [512, 44]];
    for (let i = 0; i < segs.length - 1; i++) {
      if (k > i / 4) line(segs[i][0], segs[i][1], segs[i + 1][0], segs[i + 1][1], M(0));
    }
    for (let i = 0; i < 4; i++) px(508 + i * 3, 106 + Math.round((t * 20 + i * 7) % 22), M(12));
  }
  // 侍女与药
  const sb = Math.round(Math.sin(t * 1.7) * 1);
  disc(566, 224 + sb, 9, M(14));
  rect(560, 214 + sb, 12, 4, M(0));
  poly([[552, 236 + sb], [580, 236 + sb], [586, 284], [546, 284]], M(10));
  hline(546, 284, 40, M(0));
  poly([[552, 238 + sb], [568, 238 + sb], [565, 250 + sb], [555, 250 + sb]], M(27));
  hline(552, 238 + sb, 16, M(28));
  if (t < 126.4) for (let i = 0; i < 3; i++)
    px(556 + i * 4 + Math.round(Math.sin(t * 3 + i) * 1), 234 + sb - Math.round((t * 18 + i * 7) % 16), M(26));
  textSC('装病', 156, 6, M(15), 2);
  dustMotes(t, 14, 131, 30, 610, 60, 280, M(6));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 36 · 127.6–134.5 高平陵
function sh36_gaoping(t, f) {
  const jx = Math.round(Math.sin(t * 6.2) * 0.7), jy = Math.round(Math.cos(t * 5.2) * 0.5);
  GX += jx; GY += jy;
  const ph = clamp((t - 127.56) / 6.98, 0, 1);
  const k1 = clamp(ph / 0.5, 0, 1), k2 = clamp((ph - 0.55) / 0.45, 0, 1);
  const top = mixIdx(mixIdx(27, 24, k1), 2, k2);
  const hor = mixIdx(mixIdx(26, 17, k1), 9, k2);
  skyBand(-8, 128, top, hor);
  skyBand(128, 226, hor, mixIdx(hor, 1, 0.55));
  if (k2 > 0.2) stars(f);
  cloudBand(f, 58, 210, 0.03, mixIdx(hor, 1, 0.5), mixIdx(hor, 2, 0.4));
  // 日月
  const su = clamp((t - 127.56) / 4.8, 0, 1);
  if (t < 132.4) {
    const sx = Math.round(70 + 470 * su), sy = Math.round(52 + 88 * su * su);
    disc(sx, sy, 16, M(28));
    disc(sx, sy, 13, M(16));
    glowSpot(sx, sy, 44, 1, 0.22);
  } else {
    const mu = clamp((t - 132.4) / 1.6, 0, 1);
    const mx = 470, my = Math.round(122 - 72 * mu);
    disc(mx, my, 13, M(28));
    disc(mx - 4, my - 3, 4, M(26));
    glowSpot(mx, my, 34, 1, 0.18);
  }
  farMountains();
  groundPlane(252);
  // 高平陵
  poly([[52, 252], [110, 214], [176, 196], [250, 190], [322, 196], [392, 216], [452, 252]], M(11));
  polyLine([[52, 252], [110, 214], [176, 196], [250, 190], [322, 196], [392, 216], [452, 252]], M(12), false);
  dithGrad(70, 200, 440, 252, M(10), M(2));
  for (let i = 0; i < 26; i++) {
    const mx = 70 + Math.floor(hash(i, 41) * 360);
    const myb = 252 - Math.round(Math.sin((mx - 52) / 400 * Math.PI) * 58);
    px(mx, myb - Math.floor(hash(i, 43) * 8), i % 3 ? M(9) : M(11));
  }
  rect(240, 200, 22, 8, M(26));
  rect(242, 206, 18, 46, M(27));
  vline(251, 212, 34, M(26));
  if (t > 130.74) { textC('高平陵', 240, 154, M(15), 2); glowSpot(250, 226, 40, 1, 0.10); }
  // 洛阳城墙
  rect(462, 208, 178, 46, M(11));
  rect(462, 208, 178, 4, M(14));
  for (let i = 0; i < 8; i++) rect(466 + i * 22, 198, 13, 10, M(11));
  for (let r = 0; r < 5; r++) for (let c = 0; c < 8; c++) px(470 + c * 22 + (r % 2) * 11, 216 + r * 8, M(10));
  poly([[540, 254], [540, 232], [552, 224], [564, 232], [564, 254]], M(0));
  const seized = t > 132.92;
  rect(526, 212, 48, 26, M(9));
  rect(529, 215, 42, 20, seized ? M(18) : M(28));
  textC('洛阳', 550, 216, seized ? M(16) : M(17), 1);
  if (seized) {
    glowSpot(550, 224, 50, 1, 0.45);
    for (let i = 0; i < 5; i++) px(534 + i * 8, 210 - Math.round((t * 26 + i * 9) % 20), M(18));
  }
  // 出城上坟
  if (t > 129.36) {
    for (let i = 0; i < 3; i++) {
      const u = clamp((t - 129.36 - i * 0.16) / 2.2, 0, 1);
      rider(Math.round(600 - u * 360 + (i % 2) * 12), 266, t, i + 2);
    }
  }
  // 司马懿：病好了
  if (t > 131.78) {
    drawSima(6, 52, t, { glint: true });
    torch(4, 268, t);
    textC('病好了', 58, 26, M(15), 2);
  }
  // 病好 → 兵进洛阳
  if (t > 132.5) {
    const sp = (t - 132.5) * 110;
    for (let i = 0; i < 9; i++) {
      const tx = Math.round(((40 + i * 26 + sp) % 460) + 30);
      troop(tx, 278, t, i + 11, M(0), M(9));
      if (i % 2 === 0) torch(tx + 3, 276, t);
    }
  }
  if (t > 133.8) {
    line(596, 160, 596, 208, M(9));
    const fl = Math.round(Math.sin(t * 3.2) * 2);
    poly([[597, 162], [636, 164 + fl], [634, 198 + fl], [597, 196]], M(17));
    polyLine([[597, 162], [636, 164 + fl], [634, 198 + fl], [597, 196]], M(9), true);
    textC('司马', 615, 170, M(15), 1);
  }
  if (t < 130.74) textC('公元 249', 106, 8, M(28), 2);
  dustMotes(t, 12, 137, 30, 610, 60, 280, M(12));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 37 · 134.5–140.3 一步一步
function stepSlabFull(i) {
  const xi = 30 + i * 68, yi = 292 - i * 21;
  rect(xi, yi, 640 - xi, 21, i % 2 ? M(9) : M(10));
  hline(xi, yi, 640 - xi, M(12));
  vline(xi, yi, 21, M(0));
  for (let k = 0; k < 5; k++) px(xi + 10 + k * 22, yi + 6 + (k % 2) * 6, M(9));
}
function climbFig(cx, feet, t, phase) {
  const sw = Math.round(Math.sin(t * 1.4 + phase) * 1);
  const X = cx + sw, Y = feet;
  rect(X - 6, Y - 6, 13, 6, M(0));
  poly([[X - 8, Y - 6], [X - 7, Y - 42], [X - 2, Y - 50], [X + 7, Y - 47], [X + 10, Y - 8]], M(0));
  disc(X, Y - 56, 6, M(0));
  rect(X - 8, Y - 64, 17, 4, M(0));
  rect(X - 2, Y - 68, 5, 5, M(0));
  vline(X - 8, Y - 26, 18, M(27));
  px(X - 4, Y - 57, M(27));
  line(X + 10, Y - 8, X + 12, Y - 2, M(0));
}
function sh37_coup(t, f) {
  // 阶面全是横线，纵向 1px 呼吸能带动整片台阶（名字揭晓段保持动势）
  const jx = Math.round(Math.sin(t * 6.6) * 0.7), jy = Math.round(Math.sin(t * 4.7) * 1.25);
  GX += jx; GY += jy;
  skyBand(-8, 200, M(2), M(31));
  skyBand(200, 304, M(31), M(1));
  stars(f);
  cloudBand(f, 64, 220, 0.03, M(1), M(2));
  for (let i = 0; i < 9; i++) stepSlabFull(i);
  // 曹氏匾落地
  const fall = clamp((t - 135.1) / 0.6, 0, 1);
  if (fall < 1) {
    const ox = Math.round(fall * fall * 160), oy = Math.round(fall * 46);
    for (let j = 0; j < 64; j++) {
      const sh = Math.round(j * fall * 1.2);
      hline(36 + ox + sh, 20 + oy + j, 56, j < 6 ? M(12) : M(10));
    }
    textC('曹', 64 + ox + Math.round(32 * fall * 1.2), 36 + oy, M(28), 2);
  } else {
    for (let i = 0; i < 6; i++) px(186 + Math.round(hash(i, 3) * 60), 104 + Math.round(hash(i, 5) * 12), M(12));
  }
  // 三个人
  const figs = [[2, 136.34, 1], [4, 137.04, 2], [6, 137.74, 3]];
  for (const [si, t0, ph] of figs) {
    if (t <= t0) continue;
    const k = clamp((t - t0) / 0.4, 0, 1);
    const xi = 30 + si * 68, yi = 292 - si * 21;
    climbFig(xi + 34, yi + Math.round((1 - k) * 16), t, ph);
    stepSlabFull(si);
  }
  // 阶下两盏火把：名字揭晓段人物已站定，靠火光与火星维持动势
  torch(18, 306, t);
  torch(622, 306, t);
  // 名字
  const names = [['司马师', 2, 136.7], ['司马昭', 4, 137.4], ['司马炎', 6, 138.1]];
  names.forEach(([s, si, t0], i) => {
    if (t <= t0) return;
    const nx = 30 + si * 68 + 34, ny = 292 - si * 21 + 3;
    textC(s, nx, ny, M(15), 1);
    glowSpot(nx, ny, 34, 1, 0.14 + Math.sin(t * 5.2 + i * 1.7) * 0.07);
  });
  // 一步一步
  if (t > 138.48) {
    for (let j = 0; j < 9; j++) {
      if (t > 138.48 + j * 0.1) {
        const fx = 30 + j * 68 + 34, fy = 292 - j * 21 - 2;
        px(fx - 3, fy, M(16)); px(fx + 4, fy - 1, M(16));
      }
    }
    textC('一步一步', 150, 84, M(15), 2);
  }
  // 晋
  if (t > 139.58) {
    const k = clamp((t - 139.58) / 0.3, 0, 1);
    textSC('晋', 320, Math.round(lerp(-40, 8, k)), M(15), 4);
    glowSpot(320, 60, 90, 1, 0.28);
    for (let i = 0; i < 8; i++) px(280 + Math.round(hash(i, 9) * 90), 160 + Math.round((t * 30 + i * 11) % 80), M(16));
  }
  emberField(t, 37, 36);
  dustMotes(t, 14, 141, 30, 610, 60, 280, M(6));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 38 · 140.3–144.2 起点
function sh38_chainpoint(t, f) {
  const jx = Math.round(Math.sin(t * 6.0) * 0.6), jy = Math.round(Math.cos(t * 5.0) * 0.5);
  GX += jx; GY += jy;
  rect(-10, 0, 660, 304, M(1));
  vline(330, 0, 304, M(9));
  // 左：宛城那一夜
  rect(60, 200, 200, 62, M(10));
  rect(60, 200, 200, 4, M(12));
  for (let i = 0; i < 8; i++) rect(64 + i * 25, 190, 14, 10, M(10));
  for (let r = 0; r < 7; r++) for (let c = 0; c < 8; c++) px(66 + c * 25 + (r % 2) * 12, 208 + r * 8, M(9));
  rect(140, 176, 44, 26, M(9));
  rect(143, 179, 38, 20, M(28));
  textC('宛城', 162, 180, M(17), 1);
  poly([[160, 262], [160, 232], [176, 220], [192, 232], [192, 262]], M(0));
  glowSpot(176, 240, 30, 1, 0.3);
  blit(CAO_FLAME[Math.floor(t * 12) % 4], 226, 200, 1);
  glowSpot(230, 216, 54, 1, 0.24 + Math.sin(t * 3) * 0.05);
  for (let i = 0; i < 9; i++) px(224 + Math.round(hash(i, 5) * 40), 196 - Math.round((t * 34 + i * 9) % 60), M(18));
  if (t > 141.96) textC('宛城那一夜', 160, 78, M(15), 2);
  if (t > 142.82) {
    drawChild(206, 214, t);
    textC('如果曹昂活着', 160, 114, M(28), 2);
  }
  // 右：骨牌重新立起来
  const labels = ['曹昂', '曹丕', '曹叡', '曹爽', '司马', '晋'];
  for (let i = 0; i < 6; i++) {
    const bx = 356 + i * 46;
    let ang = 1 - clamp((t - (140.5 + i * 0.2)) / 0.55, 0, 1);
    if (t < 140.5) ang = 1;
    drawDomino(bx, 264, 30, 52, ang, M(20), labels[i]);
  }
  if (t > 141.2) {
    textC('起点', 371, 196, M(15), 2);
    const k = Math.sin(t * 3) * 0.5 + 0.5;
    ring(371, 236, 20 + Math.round(k * 10), M(15));
    glowSpot(371, 236, 40, 1, 0.18);
  }
  if (t > 142.2) {
    line(248, 232, 356 + 15, 218, M(17));
    for (let i = 0; i < 6; i++) line(356 + i * 46 + 15, 214, 356 + i * 46 + 46, 214, M(17));
    px(560 + Math.round(Math.sin(t * 5) * 3), 214, M(19));
  }
  dustMotes(t, 12, 147, 30, 610, 60, 280, M(6));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 39 · 144.2–151.7 如果
function sh39_whatif(t, f) {
  const jx = Math.round(Math.sin(t * 5.6) * 0.6), jy = Math.round(Math.cos(t * 4.7) * 0.5);
  GX += jx; GY += jy;
  rect(-10, 0, 660, 304, M(2));
  dithGrad(-10, 200, 650, 304, M(2), M(1));
  rect(0, 296, 640, 8, M(16));
  hline(0, 296, 640, M(15));
  glowSpot(120, 180, 90, 1, 0.12);
  fogPatch(160 + Math.round(Math.sin(t * 0.4) * 26), 196, 150, 62, M(24), 0.05, f);
  fogPatch(470 + Math.round(Math.cos(t * 0.3) * 26), 130, 130, 70, M(24), 0.05, f * 1.3);
  // 曹昂活着
  drawBust(120, 96, t, M(20), M(0));
  textC('曹昂', 120, 50, M(15), 2);
  textC('嫡长子', 120, 234, M(15), 2);
  if (t > 144.6) dottedLine(166, 140, 370, 70, M(17), 6);
  // 四人名单
  const plates = [['曹丕', 48, 145.02], ['曹叡', 106, 146.14], ['曹爽', 164, 146.6], ['司马懿', 222, 0]];
  for (const [nm, py, beat] of plates) {
    rect(372, py, 112, 44, M(9));
    polyLine([[372, py], [484, py], [484, py + 44], [372, py + 44]], M(12), true);
    textC(nm, 428, py + 16, M(28), 1);
    if (beat && t > beat) {
      const k = clamp((t - beat) / 0.25, 0, 1);
      line(374, py + 2, 374 + 108 * k, py + 42 * k, M(18));
      line(374, py + 42 * k, 374 + 108 * k, py + 2, M(18));
    }
  }
  if (t > 149.86) {
    const wob = t > 151.14 ? Math.round(Math.sin(t * 9) * 2) : 0;
    const bob = Math.round(Math.sin(t * 2.4) * 2);
    textSC('?', 428 + wob, 6 + bob, M(28), 3);
    glowSpot(428 + wob, 30 + bob, 40, 1, 0.10);
  }
  textSC('如果', 244, 8, M(26), 3);
  glowSpot(244, 30, 60, 1, 0.08);
  dustMotes(t, 14, 151, 30, 610, 60, 280, M(24));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 40 · 151.7–155.1 没有如果
function sh40_noif(t, f) {
  const jx = Math.round(Math.sin(t * 5.2) * 0.6), jy = Math.round(Math.cos(t * 4.4) * 0.4);
  GX += jx; GY += jy;
  rect(-10, 0, 660, 304, M(28));
  for (let y = 0; y < 304; y++) for (let x = 0; x < 640; x++) {
    if (hash(x, y) < 0.04) px(x, y, M(27));
    if (hash(x + 5, y + 7) < 0.01) px(x, y, M(12));
  }
  rect(-10, 292, 660, 12, M(12));
  fogPatch(180 + Math.round(Math.sin(t * 0.35) * 30), 150, 180, 90, M(27), 0.05, f);
  fogPatch(480 + Math.round(Math.cos(t * 0.28) * 30), 110, 150, 70, M(27), 0.04, f * 1.4);
  // 大字「如果」被风抹掉
  const gone = clamp((t - 152.3) / 0.7, 0, 1);
  if (gone < 1) {
    textC('如果', 320, 40, M(26), 4);
    const wipe = Math.round(lerp(210, 430, gone));
    for (let x = 210; x < wipe; x++) for (let y = 30; y < 142; y++) if (bay(x, y) < 0.92) px(x, y, M(28));
    for (let i = 0; i < 14; i++) px(wipe - Math.round(hash(i, 3) * 80), 30 + Math.round(hash(i, 5) * 112), M(27));
  }
  if (t > T('noif')) {
    const k = clamp((t - T('noif')) / 0.35, 0, 1);
    const ex = Math.round(lerp(258, 386, k));
    thickLine(258, 146, ex, 146 - Math.round((ex - 258) * 0.78), 4, M(17));
  }
  // 推演印
  if (t > 153.34) {
    const lt = t - 153.34;
    const drop = lt < 0.12 ? Math.round(36 * (1 - lt / 0.12) ** 2) : 0;
    sealStamp(380, 148 + drop, 86, '推演', true);
    if (lt < 0.2) for (let i = 0; i < 8; i++) px(372 + Math.round(hash(i, 9) * 96), 236 + Math.round(hash(i, 11) * 14), M(12));
  }
  if (t > 154.34) {
    const k = clamp((t - 154.34) / 0.3, 0, 1);
    textC('不是史实', 260, 240, M(9), 2);
    hline(212, 266, Math.round(96 * k), M(9));
  }
  dustMotes(t, 14, 157, 30, 610, 60, 280, M(12));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 41 · 155.1–160.6 跟我们有关系
function sh41_relate(t, f) {
  // 问号段只有小动效，纵向 1px 呼吸保证每 0.6 s 内都有可测变化
  const jx = Math.round(Math.sin(t * 6.6) * 1.25), jy = Math.round(Math.sin(t * 4.7) * 1.25);
  GX += jx; GY += jy;
  skyBand(-8, 240, M(2), M(24));
  groundPlane(270);
  // 远处的楼
  for (const [bx, bw, bh] of [[8, 46, 90], [60, 30, 60], [240, 34, 74], [286, 24, 50]]) {
    rect(bx, 270 - bh, bw, bh, M(1));
    for (let r = 0; r < bh / 12; r++) for (let c = 0; c < bw / 12; c++)
      if (hash(bx + c, r * 3) < 0.35) px(bx + 5 + c * 12, 270 - bh + 6 + r * 12, M(15));
  }
  // 现代人：捧手机
  disc(120, 168, 20, M(31));
  poly([[86, 272], [94, 200], [108, 194], [134, 194], [148, 200], [158, 272]], M(31));
  polyLine([[86, 272], [94, 200], [108, 194]], M(24), false);
  disc(120, 172, 12, M(0));
  line(146, 224, 156, 236, M(31));
  rect(154, 226, 14, 22, M(0));
  rect(156, 228, 10, 18, M(28));
  glowSpot(161, 236, 26 + Math.round(Math.sin(t * 6) * 3), 1, 0.18 + (Math.sin(t * 6.4) * 0.5 + 0.5) * 0.32);
  // 八卦盘
  if (t > 156.98) {
    const k = clamp((t - 156.98) / 0.4, 0, 1);
    const cx = 470, cy = 150;
    const rot = t * 0.3;
    glowSpot(cx, cy, 80, 1, 0.14);
    ring(cx, cy, Math.round(60 * k), M(27));
    ring(cx, cy, Math.round(56 * k), M(12));
    for (let q = 0; q < 8; q++) {
      const a = rot + q * Math.PI / 4;
      const ca = Math.cos(a), sa = Math.sin(a);
      const bx = ca * 42, by = sa * 42;
      for (let b = 0; b < 3; b++) {
        const r0 = 36 + b * 5;
        const x0 = cx + ca * r0, y0 = cy + sa * r0;
        const tx = -sa * 6, ty = ca * 6;
        if ((q + b) % 3 === 0) {
          thickLine(x0 - tx, y0 - ty, x0 - tx * 0.25, y0 - ty * 0.25, 1, M(15));
          thickLine(x0 + tx * 0.25, y0 + ty * 0.25, x0 + tx, y0 + ty, 1, M(15));
        } else {
          thickLine(x0 - tx, y0 - ty, x0 + tx, y0 + ty, 1, M(15));
        }
      }
      px(cx + ca * 30, cy + sa * 30, M(28));
    }
    disc(cx, cy, Math.round(24 * k), M(31));
    ring(cx, cy, Math.round(20 * k), M(12));
    disc(cx, cy, Math.round(5 * k), M(15));
    textC('1800 年前', 470, 84, M(15), 2);
  }
  // 红线
  if (t > 158.44) {
    const hot = t > 159.74;
    for (let i = 0; i <= 16; i++) {
      const u = i / 16;
      const p = qPoint([414, 176], [290, 250], [174, 220], u);
      const c = hot ? (i % 4 === 0 ? M(19) : M(18)) : M(17);
      disc(Math.round(p[0]), Math.round(p[1]), hot ? 2 : 1, c);
    }
    if (hot) {
      glowSpot(300, 226, 60, 1, 0.18);
      for (let i = 0; i < 6; i++) px(200 + Math.round(hash(i, 5) * 200), 210 + Math.round(hash(i, 7) * 40 - (t * 30 + i * 9) % 20), M(19));
    }
  }
  if (t > 155.2) {
    const bob = Math.round(Math.sin(t * 4.8) * 3);
    textSC('?', 300, 24 + bob, Math.floor(t * 2.8) % 2 ? M(15) : M(26), 9);
    glowSpot(330, 62, 52, 1, 0.20 + Math.sin(t * 6.1) * 0.09);
  }
  if (t > 159.74) textSC('关系大了', 120, 8, M(15), 2);
  dustMotes(t, 12, 161, 30, 610, 40, 280, M(24));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 42 · 160.6–171.2 第一 · 三种价码
function sh42_p1(t, f) {
  const jx = Math.round(Math.sin(t * 6.2) * 0.8), jy = Math.round(Math.cos(t * 5.0) * 0.6);
  GX += jx; GY += jy;
  rect(-10, 0, 660, 304, M(0));
  const PX = [8, 220, 432], PY = 36, PW = 200, PH = 258;
  for (const x of PX) panelFrame(x, PY, PW, PH, false, t, null);
  panelFrame(PX[0], PY, PW, PH, false, t, '曹操');
  panelFrame(PX[1], PY, PW, PH, false, t, '曹昂');
  panelFrame(PX[2], PY, PW, PH, false, t, '司马懿');
  // 一：曹操 · 娶个媳妇
  silkCurtain(14, 188, 70, 292, t, M(17), M(18), M(19));
  rect(66, 236, 92, 10, M(17));
  hline(66, 236, 92, M(18));
  textC('囍', 40, 80, M(15), 2);
  drawBust(108, 112, t, M(17), M(0), { beard: true });
  lowTable(64, 244, 100);
  // 二：曹昂 · 死
  rect(226, 42, 188, 246, M(31));
  textC('死', 320, 96, M(17), 5);
  ghostify(286, 92, 356, 220, 0.55, M(31));
  rect(230, 70, 22, 70, M(28));
  vline(241, 76, 58, M(17));
  textC('奠', 241, 92, M(17), 1);
  poly([[296, 274], [376, 274], [368, 266], [304, 266]], M(17));
  disc(300, 262, 9, M(14));
  rect(310, 256, 34, 11, M(20));
  line(344, 262, 354, 266, M(20));
  line(344, 258, 352, 256, M(20));
  dustMotes(t, 10, 155, 228, 412, 60, 290, M(27));
  // 三：司马懿 · 机会
  rect(438, 42, 188, 246, M(2));
  drawSima(482, 94, t, { glint: t > 169.66 });
  if (t > 169.66) {
    textC('机会', 552, 64, M(15), 2);
    glowSpot(548, 170, 60, 1, 0.16);
    for (let i = 0; i < 5; i++) px(520 + Math.round(hash(i, 3) * 60), 260 - Math.round((t * 40 + i * 11) % 70), M(18));
  }
  // 价签
  if (t > 162.12) {
    for (const tx of [162, 374, 586]) {
      const sw = Math.round(Math.sin(t * 3 + tx * 0.02) * 2);
      line(tx + 14, 66, tx + 14 + sw, 76, M(9));
      rect(tx + sw, 76, 28, 18, M(12));
      hline(tx + sw, 76, 28, M(14));
      px(tx + sw + 24, 77, M(0));
      textC('¥', tx + sw + 13, 78, M(0), 1);
    }
  }
  // 上头
  if (t > 164.02) {
    const k = clamp((t - 164.02) / 0.7, 0, 1);
    for (let r = 0; r < 3; r++) ring(320, 22, Math.round(8 + ((k + r * 0.33) % 1) * 54), M(17));
    glowSpot(320, 60, 110, 1, 0.14);
  }
  // 三个高亮
  const lit = [[165.56, M(15)], [168.08, M(18)], [169.66, M(20)]];
  for (let i = 0; i < 3; i++) {
    if (t > lit[i][0]) {
      const x = PX[i];
      polyLine([[x, PY], [x + PW, PY], [x + PW, PY + PH], [x, PY + PH]], lit[i][1], true);
      polyLine([[x + 2, PY + 2], [x + PW - 2, PY + 2], [x + PW - 2, PY + PH - 2], [x + 2, PY + PH - 2]], lit[i][1], true);
      glowSpot(x + PW / 2, PY + PH / 2, PW * 1.0, 1, 0.10);
    }
  }
  textSC('第一', 44, 4, M(15), 2);
  dustMotes(t, 12, 167, 30, 610, 60, 280, M(12));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 43 · 171.2–177.4 第二 · 分岔路
function sh43_p2(t, f) {
  // 开场 1.2 s 行路人还没上路，靠纵向呼吸 + 等高线流动把画面撑住
  const jx = Math.round(Math.sin(t * 5.9) * 0.6), jy = Math.round(Math.sin(t * 4.7) * 1.25);
  GX += jx; GY += jy;
  rect(-10, 0, 660, 304, M(2));
  // 等高线
  for (let i = 0; i < 7; i++) {
    const yy = 40 + i * 34;
    for (let x = 0; x < 640; x += 3) px(x, yy + Math.round(Math.sin(x * 0.02 + i + t * 1.4) * 4), M(3));
  }
  const pathL = [[320, 196], [300, 150], [250, 112], [180, 86], [100, 68], [54, 62]];
  const pathR = [[320, 196], [352, 158], [402, 120], [472, 92], [540, 72], [566, 66]];
  const mainP = [[320, 300], [318, 250], [320, 196]];
  const stroke = (pts, w, c) => { for (let i = 0; i < pts.length - 1; i++) thickLine(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], w, c); };
  stroke(mainP, 5, M(10)); stroke(mainP, 1, M(12));
  stroke(pathL, 5, M(9)); stroke(pathL, 1, M(11));
  stroke(pathR, 5, M(10)); stroke(pathR, 1, M(12));
  if (t > 175.15) { stroke(pathR, 2, M(15)); glowSpot(470, 92, 90, 1, 0.14); }
  // 岔口石
  rect(312, 188, 16, 10, M(26));
  rect(315, 184, 10, 5, M(28));
  // 路尽头的家
  rect(548, 40, 36, 30, M(10));
  hline(548, 40, 36, M(12));
  poly([[540, 42], [566, 24], [592, 42]], M(10));
  polyLine([[540, 42], [566, 24], [592, 42]], M(12), false);
  rect(560, 50, 12, 12, M(15));
  hline(560, 50, 12, M(16));
  if (t > 175.48) { glowSpot(566, 56, 40, 1, 0.3); textC('一辈子', 490, 34, M(15), 2); }
  // 行路人
  const u = clamp((t - 171.4) / 5.8, 0, 1);
  const q = u * (pathL.length - 1);
  const pi = Math.min(pathL.length - 2, Math.floor(q));
  const pf = q - pi;
  const wx = Math.round(lerp(pathR[pi][0], pathR[pi + 1][0], pf));
  const wy = Math.round(lerp(pathR[pi][1], pathR[pi + 1][1], pf));
  const wob = Math.round(Math.sin(t * 7) * 1);
  disc(wx + 2, wy - 22 + wob, 4, M(28));
  rect(wx, wy - 18 + wob, 5, 11, M(28));
  line(wx + 1, wy - 7, wx - 2, wy, M(28));
  line(wx + 4, wy - 7, wx + 6, wy, M(28));
  // 手与铜钱
  if (t > 174.36 && t < 175.9) {
    const down = clamp((t - 174.36) / 0.5, 0, 1);
    const up = clamp((t - 175.2) / 0.7, 0, 1);
    const hy = Math.round(lerp(lerp(-150, 150, down), -150, up));
    rect(302, hy - 96, 36, 96, M(9));
    rect(302, hy - 96, 36, 4, M(12));
    rect(306, hy - 4, 28, 10, M(12));
    poly([[308, hy + 6], [332, hy + 6], [336, hy + 18], [328, hy + 30], [314, hy + 30], [304, hy + 18]], M(14));
    line(312, hy + 12, 318, hy + 26, M(13));
    line(322, hy + 12, 322, hy + 26, M(13));
    if (t < 175.0) {
      disc(320, hy + 32, 6, M(15));
      disc(320, hy + 32, 4, M(16));
      rect(319, hy + 31, 3, 3, M(9));
    }
  }
  // 铜钱落地
  if (t > 175.0) {
    const k = clamp((t - 175.0) / 0.16, 0, 1);
    const cyy = Math.round(lerp(182, 196, k));
    disc(320, cyy, 6, M(15));
    disc(320, cyy, 4, M(16));
    rect(319, cyy - 1, 3, 3, M(9));
    if (k >= 1) {
      const rk = clamp((t - 175.16) / 0.5, 0, 1);
      ring(320, 196, Math.round(8 + rk * 26), M(15));
      if (rk < 0.4) for (let i = 0; i < 5; i++) px(310 + Math.round(hash(i, 3) * 22), 190 - Math.round(hash(i, 5) * 8 + rk * 14), M(16));
    }
  }
  if (t > 171.2) textSC('第二', 60, 8, M(15), 2);
  if (t > 172.66) textC('分岔路', 130, 44, M(15), 2);
  dustMotes(t, 12, 173, 30, 610, 60, 280, M(6));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 44 · 177.4–183.8 第三 · 多米诺
function sh44_p3(t, f) {
  const jx = Math.round(Math.sin(t * 6.4) * 0.7), jy = Math.round(Math.cos(t * 5.1) * 0.5);
  GX += jx; GY += jy;
  rect(-10, 0, 660, 304, M(28));
  for (let y = 0; y < 304; y++) for (let x = 0; x < 640; x++) {
    if (hash(x, y) < 0.04) px(x, y, M(27));
    if (hash(x + 9, y + 3) < 0.01) px(x, y, M(12));
  }
  rect(-10, 292, 660, 12, M(12));
  fogPatch(200 + Math.round(Math.sin(t * 0.32) * 34), 170, 190, 80, M(27), 0.05, f);
  fogPatch(480 + Math.round(Math.cos(t * 0.26) * 34), 120, 160, 70, M(27), 0.04, f * 1.5);
  // 引线：从纸边一路抖到第一块
  if (t > 177.6) {
    const k = clamp((t - 177.6) / 0.6, 0, 1);
    const end = Math.round(lerp(0, 38, k));
    for (let x = 0; x < end; x += 2) px(x, 230 + Math.round(Math.sin(x * 0.12) * 2), M(18));
    const off = Math.round((t * 30) % 8);
    for (let i = 0; i < 5; i++) px(4 + off + i * 8, 232, M(17));
  }
  // 手指推倒第一块
  if (t > 178.9 && t < 179.8) {
    const k = clamp((t - 178.9) / 0.3, 0, 1);
    const fx = Math.round(lerp(-46, 16, k));
    rect(fx, 230, 36, 12, M(14));
    rect(fx + 32, 234, 10, 6, M(14));
    rect(fx - 14, 226, 16, 16, M(9));
  }
  // 一整排骨牌
  for (let i = 0; i < 12; i++) {
    const bx = 40 + i * 48, by = 262 + Math.round(Math.sin(i * 0.55) * 6);
    const t0 = 179.22 + i * 0.13;
    let ang = t > t0 ? clamp((t - t0) / 0.42, 0, 1) : 0;
    if (i === 0 && t > 182.9) ang = 1 - clamp((t - 182.9) / 0.5, 0, 1) * 0.55;
    drawDomino(bx, by, 30, 62, ang, i === 0 ? M(20) : (i % 3 === 0 ? M(10) : M(20)), i === 0 ? '曹昂' : '');
    if (t > t0 + 0.34 && t < t0 + 0.7) {
      const kk = (t - t0 - 0.34) / 0.36;
      for (let q = 0; q < 4; q++) px(bx + 30 + Math.round(hash(q, 5) * 10 + kk * 8), by - 6 - Math.round(kk * 10 - q * 2), M(12));
    }
  }
  // 焦点回到曹昂
  if (t > 181.62) {
    const k = Math.sin(t * 3.4) * 0.5 + 0.5;
    ring(55, 232, 24 + Math.round(k * 8), M(15));
    glowSpot(55, 210, 70, 1, 0.22);
    textC('曹昂', 55, 148, M(15), 2);
  }
  if (t > 182.9) {
    polyLine([[40, 262], [70, 262], [70, 200], [40, 200]], M(15), true);
    glowSpot(55, 230, 46, 1, 0.3);
  }
  textSC('第三', 60, 8, M(15), 2);
  dustMotes(t, 12, 179, 30, 610, 60, 280, M(12));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- SHOT 45 · 183.8–187.0 拜拜
function sh45_ending(t, f) {
  const jx = Math.round(Math.sin(t * 5.4) * 0.6), jy = Math.round(Math.cos(t * 4.6) * 0.4);
  GX += jx; GY += jy;
  nightSky(f, 91);
  moon(f, 96, 52, 16);
  forest(f, 276, 3, M(0), M(1), 3, 0.04);
  // 步道
  rect(-10, 272, 660, 34, M(1));
  rect(-10, 278, 660, 6, M(10));
  hline(-10, 278, 660, M(12));
  for (let i = 0; i < 20; i++) px(6 + i * 32, 284, M(9));
  // 路灯
  rect(466, 156, 6, 120, M(9));
  hline(452, 274, 26, M(9));
  rect(458, 126, 20, 22, M(15));
  rect(461, 129, 14, 16, M(16));
  hline(456, 124, 24, M(12));
  glowSpot(468, 138, 66, 1, 0.5 + Math.sin(t * 2.1) * 0.04);
  // 艾伦 + 狗
  const walk = Math.max(0, t - 184.2) * 19;
  const X = Math.round(206 + walk);
  const Y = 280;
  const step = Math.sin(t * 7.5) > 0 ? 2 : 0;
  rect(X - 9, Y - 30, 6, 26 + step, M(0));
  rect(X + 3, Y - 30, 6, 28 - step, M(0));
  poly([[X - 15, Y - 30], [X - 13, Y - 74], [X - 7, Y - 82], [X + 7, Y - 82], [X + 13, Y - 74], [X + 15, Y - 30]], M(31));
  polyLine([[X - 15, Y - 30], [X - 13, Y - 74], [X - 7, Y - 82]], M(24), false);
  disc(X, Y - 86, 11, M(31));
  disc(X, Y - 85, 6, M(0));
  line(X + 12, Y - 62, X + 24, Y - 44, M(31));
  px(X + 24, Y - 44, M(14));
  const dx = X + 84;
  drawDog(dx, Y - 2, t);
  const lx = X + 24, ly = Y - 44, tx = dx + 21, ty = Y - 15;
  const mid = qPoint([lx, ly], [(lx + tx) / 2, Math.max(ly, ty) + 12], [tx, ty], 0.5);
  line(lx, ly, Math.round(mid[0]), Math.round(mid[1]), M(27));
  line(Math.round(mid[0]), Math.round(mid[1]), tx, ty, M(27));
  // 文字
  if (t > 184.7 && t < 185.9) textSC('我是艾伦', 320, 28, M(28), 2);
  if (t > 185.96) {
    const k = clamp((t - 185.96) / 0.3, 0, 1);
    textSC('拜拜', 320, Math.round(lerp(-60, 30, k)), M(15), 4);
    glowSpot(320, 100, 120, 1, 0.26);
    for (let i = 0; i < 10; i++) px(238 + Math.round(hash(i, 7) * 164), 146 + Math.round((t * 40 + i * 13) % 90), M(16));
  }
  dustMotes(t, 10, 181, 30, 610, 60, 280, M(24));
  GX -= jx; GY -= jy;
}

// ---------------------------------------------------------------- 12–45 镜注册
SHOTS.push(sh12_shame, sh13_revolt, sh14_lose, sh15_dianwei, sh16_fall, sh17_mount, sh18_angfall,
  sh19_escape, sh20_heir, sh21_dingraises, sh22_trains, sh23_ages, sh24_future, sh25_nightlost,
  sh26_fury, sh27_beg, sh28_begfinal, sh29_regret, sh30_price, sh31_chain, sh32_choose,
  sh33_abdicate, sh34_tuogu, sh35_simabed, sh36_gaoping, sh37_coup, sh38_chainpoint,
  sh39_whatif, sh40_noif, sh41_relate, sh42_p1, sh43_p2, sh44_p3, sh45_ending);
