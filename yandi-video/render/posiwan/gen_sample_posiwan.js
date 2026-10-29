// 001 波斯湾伊甸园 · 样片分镜（钩子前 10 秒：雕像→教皇衣→鱼皮→苏美尔→神→半人半鱼）
// 时间轴来自配音词级 transcript + silencedetect(-35dB/d=0.06) 停顿点
const fs = require('fs');
const path = require('path');

const TOTAL = 10.42;   // 10.12 内容 + 0.30 淡出

// 字幕（停顿点边界，无标点、一次一句）
const subs = [
  [0.00, 1.17, '一群出土的雕像'],
  [1.17, 2.66, '穿着教皇一样的衣服'],
  [2.66, 3.60, '却套着鱼皮'],
  [3.60, 4.93, '四千年前的苏美尔人'],
  [4.93, 5.81, '管他们叫神'],
  [5.81, 6.76, '但你要问他们'],
  [6.76, 7.73, '神是怎么来的'],
  [7.73, 8.62, '他们会告诉你'],
  [8.62, 10.12, '是一位半人半鱼的怪物'],
];

// 场景表（边界对齐停顿）
const S = [];
const add = (s, e, type, p) => S.push(Object.assign({ s, e, type }, p || {}));
add(0.00, 1.17, 'statues-hook');     // 雕像群
add(1.17, 2.66, 'pope-robe');       // 教皇衣
add(2.66, 3.60, 'fish-skin');       // 鱼皮
add(3.60, 4.93, 'sumer-time');      // 四千年前
add(4.93, 6.76, 'call-god');        // 管他们叫神+但你要问
add(6.76, 8.62, 'how-from');        // 神是怎么来的
add(8.62, TOTAL, 'oannes-reveal');  // 半人半鱼登场

// 音效事件（对齐卡片弹出/关键动效）
const events = [
  { t: 0.15, k: 'pop' }, { t: 0.45, k: 'pop' }, { t: 0.75, k: 'pop' }, { t: 0.95, k: 'thud' },
  { t: 1.27, k: 'whoosh' }, { t: 1.85, k: 'shimmer' },
  { t: 2.76, k: 'pop' }, { t: 3.10, k: 'shimmer' },
  { t: 3.70, k: 'whoosh' }, { t: 4.10, k: 'thud' },
  { t: 5.03, k: 'pop' }, { t: 5.55, k: 'thud' }, { t: 6.05, k: 'whoosh' },
  { t: 6.90, k: 'whoosh' }, { t: 7.30, k: 'pop' }, { t: 7.90, k: 'shimmer' },
  { t: 8.70, k: 'whoosh' }, { t: 9.05, k: 'thud' }, { t: 9.55, k: 'shimmer' },
];

const out = { total: TOTAL, scenes: S, subs, events, gap: null };
fs.writeFileSync(path.join(__dirname, 'posiwan_sb.json'), JSON.stringify(out));
fs.writeFileSync(path.join(__dirname, 'posiwan_sb.js'), 'window.SB=' + JSON.stringify(out) + ';');
console.log('scenes:', S.length, 'subs:', subs.length, 'events:', events.length, 'total:', TOTAL);
