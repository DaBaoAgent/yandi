// 周幽王 · 20秒样片分镜（钩子：最贵的笑→褒姒→烽火戏诸侯→西周亡了→转折→她是谁→褒国女子）
// 时间轴来自 faster-whisper 词级转写 transcript_sample.json（whisper 错别字已按口播稿原文修正，时间戳保留）
const fs = require('fs');
const path = require('path');

const TOTAL = 20.50;   // 20.20 内容 + 0.30 淡出

// 字幕（按词级时间戳切，一次一句、无标点）
const subs = [
  [0.000, 1.180, '历史上最贵的一个笑'],
  [1.440, 2.080, '值一个王朝'],
  [2.080, 3.120, '这个笑的主人'],
  [3.300, 3.880, '叫褒姒'],
  [3.880, 4.780, '三千年前'],
  [5.160, 6.280, '周幽王为了逗她笑'],
  [6.280, 7.120, '点了烽火'],
  [7.240, 7.820, '骗了诸侯'],
  [7.820, 9.040, '后来犬戎真打来了'],
  [9.340, 10.380, '没人再信烽火'],
  [10.380, 11.240, '西周亡了'],
  [11.360, 13.000, '这个故事你从小听到大'],
  [13.000, 14.140, '但我今天想讲的'],
  [14.140, 15.100, '不是这个笑话'],
  [15.100, 16.260, '是这个笑的主人'],
  [16.420, 17.180, '褒姒这个人'],
  [17.180, 17.780, '她是谁'],
  [18.000, 18.760, '褒姒姓姒'],
  [19.120, 20.200, '是褒国的一个女子'],
];

// 场景表（边界对齐词级时间戳）
const S = [];
const add = (s, e, type, p) => S.push(Object.assign({ s, e, type }, p || {}));
add(0.000, 1.440, 'hook-smile');       // 最贵的笑
add(1.440, 3.880, 'baosi-intro');     // 值一个王朝→这个笑的主人→叫褒姒
add(3.880, 6.280, 'king-history');    // 三千年前→周幽王为了逗她笑
add(6.280, 7.820, 'beacon-lit');      // 点烽火→骗诸侯
add(7.820, 10.380, 'rong-comes');     // 犬戎真来了→没人再信烽火
add(10.380, 11.360, 'west-dead');    // 西周亡了
add(11.360, 14.140, 'familiar-tale');// 从小听到大→今天想讲的
add(14.140, 15.100, 'not-joke');     // 不是这个笑话
add(15.100, 17.180, 'her-face');      // 是这个笑的主人→褒姒这个人
add(17.180, 18.000, 'who-is-she');    // 她是谁
add(18.000, TOTAL, 'baoguo-girl');    // 褒姒姓姒→是褒国的一个女子

// 音效事件（对齐场景切入/卡片弹出）
const events = [
  // hook-smile
  { t: 0.15, k: 'thud' }, { t: 0.55, k: 'whoosh' }, { t: 0.95, k: 'gold' },
  // baosi-intro
  { t: 1.50, k: 'whoosh' }, { t: 2.20, k: 'pop' }, { t: 3.35, k: 'shimmer' },
  // king-history
  { t: 3.95, k: 'whoosh' }, { t: 5.20, k: 'pop' }, { t: 5.90, k: 'thud' },
  // beacon-lit
  { t: 6.35, k: 'whoosh' }, { t: 6.70, k: 'pop' }, { t: 7.30, k: 'thud' },
  // rong-comes
  { t: 7.90, k: 'whoosh' }, { t: 8.50, k: 'thud' }, { t: 9.45, k: 'pop' },
  // west-dead
  { t: 10.45, k: 'thud' }, { t: 10.95, k: 'shimmer' },
  // familiar-tale
  { t: 11.45, k: 'whoosh' }, { t: 12.20, k: 'pop' }, { t: 13.10, k: 'whoosh' },
  // not-joke
  { t: 14.20, k: 'thud' }, { t: 14.70, k: 'whoosh' },
  // her-face
  { t: 15.20, k: 'whoosh' }, { t: 16.50, k: 'shimmer' },
  // who-is-she
  { t: 17.25, k: 'pop' },
  // baoguo-girl
  { t: 18.10, k: 'pop' }, { t: 19.20, k: 'pop' }, { t: 20.00, k: 'thud' },
];

const out = { total: TOTAL, scenes: S, subs, events, gap: null };
fs.writeFileSync(path.join(__dirname, 'zhouwang_sb.json'), JSON.stringify(out));
fs.writeFileSync(path.join(__dirname, 'zhouwang_sb.js'), 'window.SB=' + JSON.stringify(out) + ';');
console.log('scenes:', S.length, 'subs:', subs.length, 'events:', events.length, 'total:', TOTAL);
