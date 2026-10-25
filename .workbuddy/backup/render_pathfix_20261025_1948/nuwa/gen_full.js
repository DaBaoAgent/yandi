// 女娲全片分镜生成器（427.2s / 42配音段 / 约80镜）
// 规则：文字≤30%｜每2秒新动效点｜同屏≥5运动元素｜人物居中｜手机可读｜炎帝样式字幕条
const fs = require('fs');
const path = require('path');
const dub = JSON.parse(fs.readFileSync('D:/@kaifa/yandi/006_女娲/配音.json', 'utf8'));
const sil = fs.readFileSync(path.join(__dirname, 'sil_full.txt'), 'utf8').trim().split('\n').map(Number);

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
// ---- 字幕 ----
const phrases = [];
for (const ch of Object.values(dub.chunks)) {
  const ph = splitPhrases(ch.text);
  const total = ph.reduce((a, p) => a + p.clean.length, 0);
  const t0 = ch.start, dur = ch.duration;
  let cum = 0; const bounds = [];
  for (let j = 0; j < ph.length - 1; j++) { cum += ph[j].clean.length; bounds.push(snap(t0 + (cum / total) * dur)); }
  for (let j = 0; j < ph.length; j++) {
    let start = j === 0 ? t0 + 0.02 : bounds[j - 1];
    let end = j === ph.length - 1 ? t0 + dur : bounds[j];
    if (end - start < 0.25) end = start + 0.25;
    phrases.push({ start, end, text: ph[j].raw, clean: ph[j].clean, fin: ph[j].fin });
  }
}
for (let i = 0; i < phrases.length - 1; i++) if (phrases[i + 1].start < phrases[i].end) phrases[i].end = phrases[i + 1].start;
phrases[phrases.length - 1].end = 427.2;
for (let i = phrases.length - 2; i >= 0; i--) {
  if (phrases[i].end - phrases[i].start < 0.3) {
    phrases[i + 1].start = phrases[i].start;
    phrases[i + 1].clean = phrases[i].clean + phrases[i + 1].clean;
    phrases.splice(i, 1);
  }
}
if (phrases.length > 1 && phrases[phrases.length - 1].end - phrases[phrases.length - 1].start < 0.3) {
  const last = phrases.pop();
  phrases[phrases.length - 1].end = last.end;
  phrases[phrases.length - 1].clean += last.clean;
}

// ---- 场景表 ----
const S = [];
const add = (s, e, type, p) => S.push(Object.assign({ s, e, type }, p || {}));

// ===== S0 开场钩子（0-30.1）复用样片定稿镜头 =====
add(0.00, 2.83, 'hook');
add(2.83, 5.46, 'west-a');
add(5.46, 8.93, 'west-b');
add(8.93, 11.88, 'china-nuwa');
add(11.88, 15.89, 'reveal');
add(15.89, 18.02, 'three-cards');
add(18.02, 20.12, 'mom-analogy');
add(20.12, 24.15, 'mom-deeds');
add(24.15, 27.09, 'mom-title');
add(27.09, 30.10, 'chapter', { tag: '第一件事', title: '她造了人' });

// ===== S1 造人（30.1-89.5）=====
add(30.10, 36.19, 'promise');                                   // 预告+四件事里程碑
add(36.19, 40.26, 'ni-mud', { slow: false });                   // 和泥+捏小人
add(40.26, 43.07, 'ni-mud', { slow: true });                    // 太慢了
add(43.07, 45.83, 'whip-mud');                                  // 甩绳+泥点落地
add(45.83, 49.17, 'fairytale');                                 // 童话之问+重要信息
add(49.17, 51.53, 'matriarchy', { quick: true });               // 什么信息→母系社会
add(51.53, 55.85, 'matriarchy', { big: true });                 // 母系社会大字+部落列
add(55.85, 59.57, 'center', { sprite: 'mom', sats: [{ ic: 'child', lb: '生孩子' }, { ic: 'arrow', lb: '延续部落' }], word: '受尊敬' });
add(59.61, 65.34, 'memory');                                    // 集体记忆→编成神话
add(65.34, 69.10, 'skeptic');                                   // 别觉得是原始迷信
add(69.14, 73.18, 'bigword', { word: '生命从哪来', color: 'gold', icons: ['earth', 'drop'] });
add(73.18, 76.22, 'duo', { a: { sp: 'god', lb: '上帝用肋骨造夏娃', ic: 'rib' }, b: { sp: 'nuwa-front', lb: '女娲用泥捏人', ic: 'mudman' }, accent: 'jade' });
add(76.22, 79.30, 'duo', { a: { sp: 'god', lb: '肋骨', ic: 'rib' }, b: { sp: 'nuwa-front', lb: '泥人', ic: 'mudman' }, q: '区别在哪', accent: 'gold' });
add(79.34, 84.26, 'duo', { a: { sp: 'rib', lb: '西方：女人是男人的一部分', ic: 'rib' }, b: { sp: 'nuwa-front', lb: '中国：男女都是女娲造的', ic: 'mudman' }, accent: 'jade' });
add(84.26, 89.47, 'center', { sprite: 'nuwa-front', sats: [{ ic: 'self', lb: '独立' }, { ic: 'no', lb: '不依附' }], word: '细品' });
// ===== S2 补天（89.5-158.6）=====
add(89.51, 91.35, 'chapter', { tag: '第二件事', title: '她补了天' });
add(91.35, 96.05, 'sil', { variant: 'mountain' });              // 共工触山
add(96.05, 98.83, 'sil', { variant: 'fixsky-a' });              // 炼五色石
add(98.87, 103.94, 'sil', { variant: 'fixsky-b' });             // 斩龟+烧灰
add(103.94, 107.83, 'translate');                               // 翻译一下
add(107.87, 112.52, 'row3', { items: [{ ic: 'flood', lb: '大洪水' }, { ic: 'meteor', lb: '陨石雨' }, { ic: 'climate', lb: '气候剧变' }] });
add(112.52, 116.64, 'sil', { variant: 'disaster' });            // 天崩地裂洪水滔天
add(116.64, 122.29, 'sil', { variant: 'march-a' });             // 女首领带队
add(122.29, 127.24, 'row3', { items: [{ ic: 'fire', lb: '炼五色石' }, { ic: 'boat', lb: '造船' }, { ic: 'water', lb: '治水' }] });
add(127.24, 133.88, 'globe', { phase: 'a' });                   // 全球民族都有大洪水故事
add(133.88, 138.76, 'globe', { phase: 'b' });                   // 诺亚方舟/女娲补天/大禹治水
add(138.80, 143.35, 'bigword', { word: '全球性大洪水', color: 'blue', icons: ['drop', 'drop', 'drop'] });
add(143.35, 146.84, 'timeline', { nodes: [{ lb: '几万年前', ic: 'time' }, { lb: '各民族记录', ic: 'book' }, { lb: '方式不同', ic: 'diff' }] });
add(146.84, 154.96, 'sil', { variant: 'ark' });                 // 造船躲起来 vs 补天治水
add(154.96, 158.60, 'duo', { a: { sp: 'ark', lb: '西方是逃避', ic: 'no' }, b: { sp: 'nuwa-front', lb: '中国是解决问题', ic: 'fix' }, accent: 'red', q: '文化差异' });
// ===== S3 定婚姻（158.6-211.3）=====
add(158.64, 160.69, 'chapter', { tag: '第三件事', title: '她定了婚姻' });
add(160.69, 163.26, 'duo', { a: { sp: 'nuwa-front', lb: '女娲' }, b: { sp: 'fuxi', lb: '伏羲' }, q: '一起定的', accent: 'jade' });
add(163.26, 168.84, 'duo', { a: { sp: 'nuwa-front', lb: '兄妹' }, b: { sp: 'fuxi', lb: '也是夫妻' }, sats: ['繁衍人类'], accent: 'gold' });
add(168.88, 174.54, 'sil', { variant: 'mill-a' });              // 商量爬山顶
add(174.54, 178.90, 'sil', { variant: 'mill-b' });              // 推磨滚落合一
add(178.94, 183.73, 'sil', { variant: 'mill-c' });              // 石磨合一+问号
add(183.73, 186.83, 'bigword', { word: '历史信息', color: 'gold', icons: ['book'] });
add(186.83, 191.41, 'timeline', { nodes: [{ lb: '乱婚', ic: 'raw' }, { lb: '群婚', ic: 'group' }, { lb: '兄妹婚', ic: 'pair' }] });
add(191.41, 195.86, 'timeline', { nodes: [{ lb: '族外婚', ic: 'out' }, { lb: '这段记忆', ic: 'book' }], tail: '女娲和伏羲的故事' });
add(195.86, 200.35, 'bigword', { word: '神媒', color: 'gold', icons: ['ring', 'pair'], sub: '掌管婚姻的神' });
add(200.39, 204.60, 'center', { sprite: 'nuwa-front', sats: [{ ic: 'rule', lb: '定制度' }, { ic: 'no', lb: '不能乱搞' }], word: '婚姻制度' });
add(204.60, 207.50, 'row3', { items: [{ ic: 'ring', lb: '谁能跟谁结婚' }, { ic: 'no', lb: '不能乱搞' }, { ic: 'first', lb: '第一个管的' }] });
add(207.50, 211.33, 'row3', { items: [{ ic: 'child', lb: '求子' }, { ic: 'pair', lb: '求婚姻美满' }, { ic: 'first', lb: '源头' }] });
// ===== S4 笙簧（211.3-254.5）=====
add(211.37, 213.79, 'chapter', { tag: '第四件事', title: '她创造了笙簧' });
add(213.79, 217.28, 'center', { sprite: 'sheng', sats: [{ ic: 'gourd', lb: '葫芦' }, { ic: 'pipe', lb: '竹管' }], word: '笙' });
add(217.28, 223.01, 'center', { sprite: 'sheng', sats: [{ ic: 'note', lb: '河南' }, { ic: 'note', lb: '陕西' }, { ic: 'note', lb: '嗡嗡响' }], word: '笙' });
add(223.01, 228.10, 'bigword', { word: '精神需求', color: 'gold', icons: ['music', 'heart'] });
add(228.10, 233.65, 'sil', { variant: 'rebuild' });             // 灾后重建家园
add(233.69, 239.82, 'sil', { variant: 'campfire' });            // 火堆笙簧
add(239.82, 243.24, 'bigword', { word: '心理建设', color: 'red', icons: ['heart', 'music'] });
add(243.28, 248.26, 'bigword', { word: '礼乐', color: 'gold', icons: ['music', 'wave'], sub: '从女娲这里开始' });
add(248.26, 251.62, 'center', { sprite: 'nuwa-front', sats: [{ ic: 'wave', lb: '抚平创伤' }, { ic: 'circle', lb: '凝聚人心' }], word: '音乐' });
add(251.62, 254.47, 'question', { sprites: ['nuwa-front', 'fuxi'] });
// ===== S5 女娲伏羲关系（254.5-306.3）=====
add(254.51, 259.05, 'duo', { a: { sp: 'nuwa-front', lb: '版本一·兄妹' }, b: { sp: 'fuxi', lb: '洪水后只剩他俩' }, accent: 'jade' });
add(259.05, 265.19, 'center', { sprite: 'fuxi', sats: [{ ic: 'child', lb: '人类延续' }, { ic: 'pair', lb: '兄妹结婚' }], word: '版本一', extra: '南方少数民族传说' });
add(265.23, 269.85, 'duo', { a: { sp: 'nuwa-front', lb: '一个管天' }, b: { sp: 'fuxi', lb: '一个管地' }, q: '版本二·夫妻', accent: 'gold' });
add(269.85, 272.99, 'duo', { a: { sp: 'nuwa-front', lb: '造人' }, b: { sp: 'fuxi', lb: '定制度' }, q: '都是三皇之一', accent: 'gold' });
add(272.99, 275.93, 'duo', { a: { sp: 'fuxi', lb: '女希氏' }, b: { sp: 'nuwa-front', lb: '继承者·当首领' }, q: '版本三', accent: 'jade' });
add(275.93, 281.70, 'merge');                                   // 三版本合一
add(281.70, 283.94, 'bigword', { word: '历史记忆', color: 'gold', icons: ['book'] });
add(283.98, 291.37, 'duo', { a: { sp: 'fuxi', lb: '搞技术·定制度·画八卦' }, b: { sp: 'nuwa-front', lb: '造人·治水·定婚姻' }, accent: 'jade' });
add(291.37, 295.08, 'center', { sprite: 'nuwa-front', sats: [{ ic: 'fuxi', lb: '一前一后' }, { ic: 'tribe', lb: '度过艰难时代' }], word: '一起' });
add(295.12, 301.76, 'snake-reveal');                            // 人首蛇身揭秘
add(301.76, 306.33, 'bigword', { word: '部落首领', color: 'gold', icons: ['tribe', 'tribe'], sub: '几万年前带领人类活了下来' });
// ===== S6 为什么记得她（306.3-373.7）=====
add(306.37, 311.77, 'row3', { items: [{ ic: 'egypt', lb: '古埃及' }, { ic: 'babylon', lb: '古巴比伦' }, { ic: 'india', lb: '古印度' }] });
add(311.77, 314.11, 'question', { sprites: ['nuwa-front'] });
add(314.15, 319.31, 'row3', { items: [{ ic: 'envy', lb: '嫉妒' }, { ic: 'fight', lb: '争宠' }, { ic: 'doom', lb: '祸水' }] });
add(319.31, 325.53, 'goddess-row', { goddesses: [{ sp: 'hera', lb: '赫拉·嫉妒' }, { sp: 'aphro', lb: '阿佛洛狄忒·欲望' }, { sp: 'athena', lb: '雅典娜·从宙斯脑袋蹦出' }] });
add(325.57, 330.73, 'duo', { a: { sp: 'isis', lb: '伊西斯·王后形象' }, b: { sp: 'ring', lb: '奥西里斯的妻子' }, accent: 'gold' });
add(330.73, 336.63, 'center', { sprite: 'nuwa-front', sats: [{ ic: 'self', lb: '自己造人' }, { ic: 'fix', lb: '自己补天' }, { ic: 'ring', lb: '自己定婚姻' }], word: '独立' });
add(336.67, 339.68, 'bigword', { word: '她就是她自己', color: 'jade', icons: ['self'] });
add(339.68, 343.15, 'bigword', { word: '母系印记', color: 'gold', icons: ['mom', 'earth'], sub: '中国文明的源头' });
add(343.15, 348.75, 'row3', { items: [{ ic: 'mom', lb: '尊重母亲' }, { ic: 'earth', lb: '尊重大地' }, { ic: 'heart', lb: '尊重养育' }] });
add(348.75, 354.48, 'bigword', { word: '骂妈', color: 'red', icons: ['mom', 'mom'], sub: '中国人最狠的骂' });
add(354.48, 357.91, 'center', { sprite: 'mom', sats: [{ ic: 'crown', lb: '地位太高' }, { ic: 'no', lb: '最狠的侮辱' }], word: '妈' });
add(357.91, 361.35, 'question', { sprites: ['guanyin'] });
add(361.39, 366.52, 'lineage', { phase: 'a' });                 // 观音=女娲延续
add(366.52, 371.31, 'lineage', { phase: 'b' });                 // 门神灶神老母娘娘
add(371.31, 373.71, 'lineage', { phase: 'c' });                 // 源头都是女娲
// ===== S7 跟你有什么关系（373.7-427.2）=====
add(373.75, 379.81, 'question', { sprites: ['nuwa-front'] });
add(379.81, 384.63, 'center', { sprite: 'mama', sats: [{ ic: 'talk', lb: '唠叨' }, { ic: 'tell', lb: '叮嘱半天' }, { ic: 'fix', lb: '闯祸兜底' }], word: '妈' });
add(384.67, 389.67, 'duo', { a: { sp: 'nuwa-front', lb: '造人·补天' }, b: { sp: 'mama', lb: '顶着·收拾' }, q: '中国女性形象', accent: 'jade' });
add(389.67, 391.65, 'center', { sprite: 'nuwa-front', sats: [{ ic: 'fix', lb: '天塌她顶着' }, { ic: 'fix', lb: '闯祸她收拾' }], word: '延续' });
add(391.65, 394.05, 'question', { sprites: ['nuwa-front'] });
add(394.09, 399.30, 'row3', { items: [{ ic: 'quake', lb: '地震' }, { ic: 'flood', lb: '洪水' }, { ic: 'virus', lb: '疫情' }], tail: '都能熬过去' });
add(399.30, 405.54, 'bigword', { word: '没有什么坎过不去', color: 'gold', icons: ['fix', 'water', 'self'], sub: '天破能补·水来能治·人能再造' });
add(405.58, 411.71, 'bigword', { word: '刻在基因里', color: 'red', icons: ['dna', 'dna'] });
add(411.71, 416.68, 'sil', { variant: 'anxiety' });             // 焦虑符号vs女娲
add(416.68, 422.17, 'endflash');                                // 三连回闪
add(422.17, 427.21, 'endcard');

// ---- 音效事件 ----
const events = [];
for (const sc of S) {
  if (sc.type === 'chapter') events.push({ t: sc.s, k: 'whoosh' }, { t: sc.s + 0.06, k: 'thud' });
  else if (sc.type === 'bigword') events.push({ t: sc.s + 0.05, k: 'thud' });
  else if (sc.type === 'duo') events.push({ t: sc.s + 0.1, k: 'pop' }, { t: sc.s + 0.6, k: 'pop' });
  else if (sc.type === 'row3') { for (let i = 0; i < 3; i++) events.push({ t: sc.s + 0.3 + i * 0.45, k: 'pop' }); }
  else if (sc.type === 'center') events.push({ t: sc.s + 0.15, k: 'pop' });
  else if (sc.type === 'timeline') { for (let i = 0; i < 3; i++) events.push({ t: sc.s + 0.3 + i * 0.6, k: 'pop' }); }
  else if (sc.type === 'question') events.push({ t: sc.s + 0.1, k: 'whoosh' });
  else if (sc.type === 'hook' || sc.type === 'reveal') events.push({ t: sc.s + 0.1, k: 'pop' });
  else if (sc.type === 'whip-mud') events.push({ t: sc.s + 0.2, k: 'whoosh' }, { t: sc.s + 1.0, k: 'pop' });
  else if (sc.type === 'sil') events.push({ t: sc.s + 0.2, k: 'thud' });
  else if (sc.type === 'goddess-row') { for (let i = 0; i < 3; i++) events.push({ t: sc.s + 0.3 + i * 0.5, k: 'pop' }); }
  else if (sc.type === 'matriarchy') events.push({ t: sc.s + (sc.big ? 1.9 : 0.2), k: 'thud' });
  else if (sc.type === 'endcard') events.push({ t: sc.s + 0.1, k: 'whoosh' }, { t: sc.s + 0.2, k: 'thud' });
  else if (sc.type === 'endflash') events.push({ t: sc.s + 0.2, k: 'thud' }, { t: sc.s + 1.5, k: 'thud' }, { t: sc.s + 2.8, k: 'thud' });
  else if (sc.type === 'promise') { for (let i = 0; i < 4; i++) events.push({ t: sc.s + 0.8 + i * 1.1, k: 'pop' }); }
  else if (sc.type === 'globe') events.push({ t: sc.s + 0.5, k: 'whoosh' }, { t: sc.s + 2.0, k: 'pop' });
  else if (sc.type === 'snake-reveal') events.push({ t: sc.s + 0.2, k: 'shimmer' }, { t: sc.s + 0.5, k: 'thud' });
  else if (sc.type === 'memory') events.push({ t: sc.s + 0.3, k: 'pop' }, { t: sc.s + 2.5, k: 'pop' });
  else if (sc.type === 'merge') events.push({ t: sc.s + 0.3, k: 'whoosh' }, { t: sc.s + 1.5, k: 'thud' });
  else if (sc.type === 'lineage') events.push({ t: sc.s + 0.4, k: 'shimmer' });
  else if (sc.type === 'translate') events.push({ t: sc.s + 0.3, k: 'whoosh' }, { t: sc.s + 1.2, k: 'thud' });
  else if (sc.type === 'skeptic') events.push({ t: sc.s + 0.3, k: 'pop' });
}

const total = 427.2;
const out = { total, scenes: S, subs: phrases.map(p => [+p.start.toFixed(3), +p.end.toFixed(3), p.clean]), events };
fs.writeFileSync(path.join(__dirname, 'nuwa_full_sb.json'), JSON.stringify(out));
fs.writeFileSync(path.join(__dirname, 'nuwa_full_sb.js'), 'window.SB=' + JSON.stringify(out) + ';');
console.log('scenes:', S.length, 'subs:', phrases.length, 'events:', events.length, 'total:', total);
// 时长校验
let bad = 0;
for (let i = 0; i < S.length - 1; i++) { if (S[i + 1].s < S[i].e - 0.01) { console.log('OVERLAP', S[i].type, S[i].e, '->', S[i + 1].s); bad++; } }
if (S[S.length - 1].e < total - 0.5) console.log('GAP at end:', S[S.length - 1].e);
if (S[0].s > 0.01) console.log('GAP at start');
console.log(bad ? 'HAS OVERLAPS' : 'timeline OK');
