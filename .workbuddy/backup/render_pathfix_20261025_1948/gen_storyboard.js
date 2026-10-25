const fs = require('fs');
const path = require('path');
const dub = JSON.parse(fs.readFileSync('D:/@kaifa/yandi/007_炎帝/配音.json', 'utf8'));
const sil = fs.readFileSync(path.join(__dirname, '..', 'audio', 'sil_starts.txt'), 'utf8').trim().split('\n').map(Number);

function splitPhrases(text) {
  const raw = text.split(/(?<=[。？！，、])/).map(s => s.trim()).filter(Boolean);
  return raw.map(s => ({ raw: s, clean: s.replace(/[。？！，、：""''（）]/g, ''), fin: /[。？！]$/.test(s) }));
}

let si = 0;
function snap(est) {
  let best = -1, bd = 1e9;
  for (let i = si; i < sil.length; i++) {
    const g = sil[i];
    if (g < est - 1.2 || g > est + 1.2) continue;
    const d = Math.abs(g - est);
    if (d < bd) { bd = d; best = i; }
  }
  if (best >= 0) { si = best + 1; return sil[best] + 0.045; }
  return est;
}

// ---- phrase level (subtitles) ----
const phrases = [];
for (const ch of dub.chunks) {
  const ph = splitPhrases(ch.text);
  const total = ph.reduce((a, p) => a + p.clean.length, 0);
  const t0 = ch.start, dur = ch.duration;
  let cum = 0; const bounds = [];
  for (let j = 0; j < ph.length - 1; j++) {
    cum += ph[j].clean.length;
    bounds.push(snap(t0 + (cum / total) * dur));
  }
  for (let j = 0; j < ph.length; j++) {
    let start = j === 0 ? t0 + 0.02 : bounds[j - 1];
    let end = j === ph.length - 1 ? t0 + dur : bounds[j];
    if (end - start < 0.25) end = start + 0.25;
    phrases.push({ start, end, text: ph[j].raw, clean: ph[j].clean, fin: ph[j].fin, chunkEnd: j === ph.length - 1 });
  }
}
for (let i = 0; i < phrases.length - 1; i++) if (phrases[i + 1].start < phrases[i].end) phrases[i].end = phrases[i + 1].start;
phrases[phrases.length - 1].end = 385.47;

// ---- scene level (2.5-5s merge) ----
const HOOK_END = 32.38;
const handScenes = [
  [0, 3.06, 'food-burst'], [3.06, 5.19, 'tea-medicine'], [5.19, 7.21, 'question'],
  [7.21, 10.13, 'not-wildman'], [10.13, 14.14, 'yandi-reveal'], [14.14, 16.16, 'story-card'],
  [16.16, 20.01, 'poison-counter'], [20.01, 21.37, 'myth'], [21.37, 25.61, 'bigger'],
  [25.61, 30.86, 'four-things'], [30.86, 32.38, 'one-man-four'],
];
const chapters = [
  { t: 32.38, tag: '第一章', title: '教中国人种地' },
  { t: 106.37, tag: '第二章', title: '尝百草' },
  { t: 166.33, tag: '第三章', title: '发明医药' },
  { t: 206.19, tag: '第四章', title: '最早的市场' },
  { t: 250.74, tag: '第五章', title: '炎帝与黄帝' },
  { t: 295.03, tag: '第六章', title: '为什么叫炎帝' },
  { t: 329.10, tag: '尾声', title: '与你有关' },
];

const scenes = handScenes.map(([s, e, t]) => ({ s, e, type: t, text: '' }));
let cur = null;
function closeScene() {
  if (cur && cur.e - cur.s > 0.6) scenes.push(cur);
  cur = null;
}
for (const p of phrases) {
  if (p.start < HOOK_END) continue;
  if (cur) { const cross = chapters.find(c => cur.s < c.t && c.t <= p.start); if (cross) closeScene(); }
  if (!cur) cur = { s: p.start, e: p.end, text: '', last: '' };
  cur.e = p.end; cur.text += p.clean; cur.last = p.clean;
  const dur = cur.e - cur.s;
  if ((dur >= 2.5 && (p.fin || p.chunkEnd)) || dur >= 5.2) closeScene();
}
if (cur) closeScene();

// ---- type assignment ----
const ICON_KEYS = ['米饭', '茶', '中药', '毒', '种地', '种植', '五谷', '稻', '针灸', '针', '接生', '市场', '陶器', '碗', '火', '房子', '村庄', '定居', '部落', '打仗', '抢', '石斧', '本草经', '兔子', '老虎', '粮食', '换', '蚩尤', '黄帝', '华夏', '考古'];
function assign(sc, idx) {
  const ch = chapters.find(c => Math.abs(c.t - sc.s) < 0.6);
  if (ch) { sc.type = 'chapter'; sc.tag = ch.tag; sc.title = ch.title; return; }
  const t = sc.text;
  if (/七十二/.test(t)) { sc.type = 'count72'; return; }
  if (/从石头到骨头/.test(t)) { sc.type = 'list'; sc.items = ['石头', '骨头', '青铜', '不锈钢']; return; }
  if (/稻.*黍|五谷/.test(t)) { sc.type = 'list'; sc.items = ['稻', '黍', '稷', '麦', '菽']; return; }
  if (/大米|黄米/.test(t)) { sc.type = 'list'; sc.items = ['大米', '黄米', '小米', '小麦', '大豆']; return; }
  if (/植物药|动物药/.test(t)) { sc.type = 'list'; sc.items = ['植物药', '动物药', '矿物药']; return; }
  if (/[？]|怎么办|哪种|什么问题|为什么|是什么$/.test(t)) { sc.type = 'q'; return; }
  if (/我是艾伦|遛狗|白了个白/.test(t)) { sc.type = 'endcard'; return; }
  if (/起源|文明$|国家$|和平|源头|唯一|统一|骨子里|定下来的|商业之父|临床实验/.test(t)) { sc.type = 'slam'; return; }
  if (ICON_KEYS.some(k => t.includes(k)) && sc.e - sc.s < 4.2) { sc.type = 'icon'; return; }
  sc.type = 'kinetic';
}
scenes.forEach((sc, i) => { if (i >= handScenes.length) assign(sc, i); });

// ---- overrides (manual curation) ----
const byTime = (t) => scenes.find(s => s.s <= t && s.e > t);
const ov = [
  [37.5, 'kinetic'], [44.81, 'slam'], [57.1, 'q'], [65.64, 'slam'], [71.8, 'slam'],
  [89.88, 'slam'], [93.96, 'slam'], [115.97, 'kinetic'], [131.6, 'icon'], [149.92, 'slam'],
  [171.43, 'icon'], [179.09, 'list'], [186.67, 'kinetic'], [192.57, 'icon'], [198.3, 'kinetic'],
  [207.31, 'slam'], [213.8, 'kinetic'], [218.62, 'list'], [220.19, 'slam'], [225.63, 'kinetic'],
  [228.52, 'kinetic'], [233.99, 'kinetic'], [236.36, 'slam'], [244.24, 'kinetic'], [247.73, 'slam'],
  [252.64, 'kinetic'], [259.68, 'kinetic'], [261.5, 'kinetic'], [263.36, 'kinetic'], [264.43, 'kinetic'],
  [267.07, 'kinetic'], [270.08, 'slam'], [271.5, 'slam'], [275.85, 'q'], [277.69, 'kinetic'],
  [283.84, 'kinetic'], [287.18, 'kinetic'], [292.41, 'slam'], [296.09, 'icon'], [301.7, 'q'],
  [306.26, 'kinetic'], [310.95, 'slam'], [312.96, 'kinetic'], [317.58, 'kinetic'], [324.16, 'kinetic'],
  [327.15, 'slam'], [345.38, 'slam'], [349.72, 'kinetic'], [354.67, 'kinetic'], [361.59, 'slam'],
  [363.8, 'slam'], [369.37, 'kinetic'], [372.53, 'slam'], [380.27, 'kinetic'],
];
for (const [t, ty] of ov) { const sc = byTime(t); if (sc && sc.type !== 'chapter') sc.type = ty; }
// fire scenes
for (const sc of scenes) { if (/管火|两个火/.test(sc.text) && sc.type !== 'chapter') sc.type = 'icon'; }
// force chapter cards: scene straddling chapter time gets split info or retyped
for (const c of chapters) {
  let sc = scenes.find(s => Math.abs(s.s - c.t) < 0.8);
  if (!sc) { sc = scenes.find(s => s.s <= c.t && s.e > c.t); if (sc) { sc.s = c.t; } }
  if (sc) { sc.type = 'chapter'; sc.tag = c.tag; sc.title = c.title; }
}

// ---- SFX events ----
const events = [];
for (const sc of scenes) {
  if (sc.type === 'chapter') { events.push({ t: sc.s, k: 'whoosh' }, { t: sc.s + 0.06, k: 'thud' }); }
  else if (sc.type === 'slam') events.push({ t: sc.s + 0.05, k: 'thud' });
  else if (sc.type === 'list') { const n = (sc.items || []).length; for (let i = 0; i < n; i++) events.push({ t: sc.s + 0.3 + i * ((sc.e - sc.s - 0.5) / Math.max(1, n)), k: 'pop' }); }
  else if (sc.type === 'icon') events.push({ t: sc.s + 0.2, k: 'pop' });
}

const total = 386.9;
const out = { total, scenes, subs: phrases.map(p => [+p.start.toFixed(3), +p.end.toFixed(3), p.clean]), events };
fs.writeFileSync(path.join(__dirname, 'sb.json'), JSON.stringify(out));
const flat = 'window.SB=' + JSON.stringify(out) + ';';
fs.writeFileSync(path.join(__dirname, 'sb.js'), flat);
console.log('scenes:', scenes.length, 'subs:', phrases.length, 'events:', events.length, 'total:', total);
const cnt = {}; scenes.forEach(s => cnt[s.type] = (cnt[s.type] || 0) + 1); console.log(JSON.stringify(cnt));
