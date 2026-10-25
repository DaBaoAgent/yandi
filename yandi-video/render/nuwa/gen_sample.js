// 女娲样片分镜生成器 v2（两段式：A段0-30.1s概念范式 + B段30.7-43.4s故事范式）
// B段音频 = 配音.wav 38.87-51.55（块4尾部"照着自己的样子捏小人"+ 块5全文）
const fs = require('fs');
const path = require('path');
const dub = JSON.parse(fs.readFileSync('D:/@kaifa/yandi/output/006_女娲/配音.json', 'utf8'));
const sil = fs.readFileSync(path.join(__dirname, 'sil_starts.txt'), 'utf8').trim().split('\n').map(Number);

// 样片配音块：index → 样片时间轴起始时间；chunk4b 为块4尾部造人setup句
const USE = { 1: 0.0, 2: 9.0, 3: 20.1 };
const chunks = Object.values(dub.chunks).filter(c => USE[c.index] !== undefined)
  .map(c => ({ ...c, sStart: USE[c.index] }));
// 块4尾部（38.87切点起）：照着自己的样子捏小人。
chunks.push({ index: '4b', text: '照着自己的样子捏小人。', sStart: 30.36, duration: 1.32 });
// 块5全文（31.81起，原40.28-51.55）
const c5 = Object.values(dub.chunks).find(c => c.index === 5);
chunks.push({ ...c5, sStart: 31.81, duration: 11.22 });

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

// ---- 字幕（短语级，对齐停顿点）----
const phrases = [];
for (const ch of chunks) {
  const ph = splitPhrases(ch.text);
  const total = ph.reduce((a, p) => a + p.clean.length, 0);
  const t0 = ch.sStart, dur = ch.duration;
  let cum = 0; const bounds = [];
  for (let j = 0; j < ph.length - 1; j++) {
    cum += ph[j].clean.length;
    bounds.push(snap(t0 + (cum / total) * dur));
  }
  for (let j = 0; j < ph.length; j++) {
    let start = j === 0 ? t0 + 0.02 : bounds[j - 1];
    let end = j === ph.length - 1 ? t0 + dur : bounds[j];
    if (end - start < 0.25) end = start + 0.25;
    phrases.push({ start, end, text: ph[j].raw, clean: ph[j].clean, fin: ph[j].fin });
  }
}
for (let i = 0; i < phrases.length - 1; i++) if (phrases[i + 1].start < phrases[i].end) phrases[i].end = phrases[i + 1].start;
phrases[phrases.length - 1].end = 43.03;
// 合并过短碎句（<0.3s）到下一句
for (let i = phrases.length - 2; i >= 0; i--) {
  if (phrases[i].end - phrases[i].start < 0.3) {
    phrases[i + 1].start = phrases[i].start;
    phrases[i + 1].clean = phrases[i].clean + phrases[i + 1].clean;
    phrases.splice(i, 1);
  }
}
// 末句过短则并回上一句
if (phrases.length > 1 && phrases[phrases.length - 1].end - phrases[phrases.length - 1].start < 0.3) {
  const last = phrases.pop();
  phrases[phrases.length - 1].end = last.end;
  phrases[phrases.length - 1].clean += last.clean;
}

// ---- 手工分镜表（14 镜；sub=字幕参与场景的排版锚点）----
const scenes = [
  // ===== A段：概念范式（图标卡片）=====
  { s: 0.00, e: 2.83, type: 'hook', text: '反问钩子', sub: { x: 960, y: 205, size: 72, align: 'center' } },
  { s: 2.83, e: 5.46, type: 'west-gods-a', text: '上帝vs女娲', sub: { x: 960, y: 190, size: 68, align: 'center' } },
  { s: 5.46, e: 8.93, type: 'west-gods-b', text: '双男神卡', sub: { x: 960, y: 180, size: 66, align: 'center' } },
  { s: 8.93, e: 11.88, type: 'china-nuwa', text: '只有中国', sub: { x: 1420, y: 250, size: 74, align: 'center' } },
  { s: 11.88, e: 15.89, type: 'reveal', text: '女娲登场', sub: { x: 1390, y: 172, size: 66, align: 'center' } },
  { s: 15.89, e: 18.02, type: 'three-cards', text: '三件事收齐', sub: { x: 960, y: 172, size: 64, align: 'center' } },
  { s: 18.02, e: 20.12, type: 'mom-analogy', text: '像不像妈', sub: { x: 960, y: 185, size: 70, align: 'center' } },
  { s: 20.12, e: 24.15, type: 'mom-deeds', text: '妈三连', sub: { x: 960, y: 170, size: 66, align: 'center' } },
  { s: 24.15, e: 27.09, type: 'mom-title', text: '人文之母', sub: { x: 960, y: 950, size: 64, align: 'center' } },
  { s: 27.09, e: 30.70, type: 'chapter-card', text: '预告转场', sub: { x: 960, y: 890, size: 60, align: 'center' }, tag: '第一件事', title: '她造了人' },
  // ===== B段：故事范式（剪影场景+像素角色）=====
  { s: 30.35, e: 33.04, type: 'ni-mud', text: '捏泥人', sub: { x: 330, y: 200, size: 66, align: 'left' } },
  { s: 33.04, e: 36.02, type: 'whip-mud', text: '甩泥点', sub: { x: 960, y: 175, size: 68, align: 'center' } },
  { s: 36.02, e: 39.86, type: 'fairytale', text: '童话之问', sub: { x: 430, y: 205, size: 66, align: 'center' } },
  { s: 39.86, e: 43.03, type: 'matriarchy', text: '母系社会', sub: { x: 960, y: 200, size: 62, align: 'center' } },
];

// ---- 音效事件（少量点缀：转场whoosh/重击thud/入场pop）----
const events = [
  { t: 0.15, k: 'whoosh' },
  { t: 2.95, k: 'pop' }, { t: 3.98, k: 'thud' },
  { t: 5.62, k: 'pop' }, { t: 7.72, k: 'pop' },
  { t: 9.02, k: 'whoosh' }, { t: 10.15, k: 'pop' },
  { t: 12.05, k: 'shimmer' }, { t: 12.25, k: 'thud' },
  { t: 16.10, k: 'pop' }, { t: 17.05, k: 'pop' },
  { t: 18.20, k: 'pop' },
  { t: 20.30, k: 'pop' }, { t: 21.70, k: 'pop' }, { t: 23.05, k: 'pop' },
  { t: 24.30, k: 'thud' },
  { t: 27.25, k: 'whoosh' },
  { t: 30.60, k: 'pop' }, { t: 31.85, k: 'pop' },
  { t: 33.20, k: 'whoosh' }, { t: 34.70, k: 'pop' },
  { t: 36.20, k: 'pop' }, { t: 37.50, k: 'pop' },
  { t: 41.85, k: 'thud' },
];

const total = 43.43;
const out = { total, scenes, subs: phrases.map(p => [+p.start.toFixed(3), +p.end.toFixed(3), p.clean]), events };
fs.writeFileSync(path.join(__dirname, 'nuwa_sb.json'), JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(__dirname, 'nuwa_sb.js'), 'window.SB=' + JSON.stringify(out) + ';');
console.log('scenes:', scenes.length, 'subs:', phrases.length, 'events:', events.length, 'total:', total);
phrases.forEach(p => console.log(p.start.toFixed(2), '-', p.end.toFixed(2), p.clean));
