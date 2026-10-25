// 全片密度核验：分析 qc_full_log.json + 分段汇总报告
const fs = require('fs');
const path = require('path');
const SB = JSON.parse(fs.readFileSync(path.join(__dirname, 'nuwa_full_sb.json'), 'utf8'));
const log = JSON.parse(fs.readFileSync(path.join(__dirname, 'qc_full_log.json'), 'utf8'));

const SECTIONS = [
  { name: 'S0 开场钩子', s: 0, e: 30.1, paradigm: '概念' },
  { name: 'S1 她造了人', s: 30.1, e: 89.5, paradigm: '故事+概念' },
  { name: 'S2 她补了天', s: 89.5, e: 158.6, paradigm: '故事' },
  { name: 'S3 她定了婚姻', s: 158.6, e: 211.3, paradigm: '故事+概念' },
  { name: 'S4 她创造了笙簧', s: 211.3, e: 254.5, paradigm: '故事+概念' },
  { name: 'S5 女娲伏羲关系', s: 254.5, e: 306.3, paradigm: '概念' },
  { name: 'S6 为什么记得她', s: 306.3, e: 373.7, paradigm: '概念' },
  { name: 'S7 跟你有什么关系', s: 373.7, e: 427.2, paradigm: '概念+收尾' },
];

const report = { total: SB.total, samples: log.length, scenes: SB.scenes.length };
// 三指标
const covs = log.map(f => f.textCov), movs = log.map(f => f.moving);
report.textCov = { max: Math.max(...covs), mean: +(covs.reduce((a, b) => a + b, 0) / covs.length).toFixed(1), over30: covs.filter(c => c > 30).length };
report.moving = { min: Math.min(...movs), mean: +(movs.reduce((a, b) => a + b, 0) / movs.length).toFixed(1), under5: movs.filter(m => m < 5).length };
// 2秒新动效点
const win = 2 * 30;
let newPoints = 0, emptyWins = [];
let prevSet = new Set();
for (let w = 0; w < log.length; w += win) {
  const slice = log.slice(w, Math.min(w + win, log.length));
  const set = new Set(); slice.forEach(f => f.acts.forEach(a => set.add(a)));
  const newOnes = [...set].filter(m => !prevSet.has(m));
  const cut = slice.some(f => f.acts.some(a => a.startsWith('cut:')));
  if (newOnes.length > 0 || cut) newPoints++; else emptyWins.push(+(slice[0].t).toFixed(1));
  prevSet = set;
}
report.motionPoints = { windows: Math.ceil(log.length / win), withNew: newPoints, emptyAt: emptyWins };
// 分段汇总
report.sections = [];
for (const sec of SECTIONS) {
  const slice = log.filter(f => f.t >= sec.s && f.t < sec.e);
  if (!slice.length) continue;
  const cov = Math.max(...slice.map(f => f.textCov));
  const mv = Math.min(...slice.map(f => f.moving));
  const sceneCount = SB.scenes.filter(s => s.s >= sec.s && s.s < sec.e).length;
  report.sections.push({ name: sec.name, paradigm: sec.paradigm, scenes: sceneCount, minMoving: mv, maxTextCov: cov, ok: mv >= 5 && cov <= 30 });
}
// 类型分布
const cnt = {};
SB.scenes.forEach(s => cnt[s.type] = (cnt[s.type] || 0) + 1);
report.typeCount = cnt;

console.log('=== 全片三指标 ===');
console.log('文字覆盖率: max', report.textCov.max + '%', 'mean', report.textCov.mean + '%', '超30%采样数', report.textCov.over30);
console.log('同屏运动元素: min', report.moving.min, 'mean', report.moving.mean, '少于5采样数', report.moving.under5);
console.log('2秒新动效点:', report.motionPoints.withNew, '/', report.motionPoints.windows, '窗口', report.motionPoints.emptyAt.length ? ('空窗@' + report.motionPoints.emptyAt.join(',')) : '无空窗');
console.log('=== 分段汇总 ===');
report.sections.forEach(s => console.log((s.ok ? 'PASS' : 'FAIL'), s.name, '[' + s.paradigm + ']', s.scenes + '镜', 'minMoving', s.minMoving, 'maxTextCov', s.maxTextCov + '%'));
console.log('=== 场景类型分布 ===');
console.log(JSON.stringify(report.typeCount));
fs.writeFileSync(path.join(__dirname, 'qc_full_report.json'), JSON.stringify(report, null, 1));
const allOk = report.textCov.over30 === 0 && report.moving.under5 === 0 && report.motionPoints.emptyAt.length === 0 && report.sections.every(s => s.ok);
console.log(allOk ? '=== 全部通过 ===' : '=== 存在不达标项 ===');
