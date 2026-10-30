#!/usr/bin/env node
// 从全片分镜/字幕（piying 管线留下的 caocao_full_sb.json）生成 xiangsu 全片 cues。
//
//   node build_cues.mjs [sb.json] [out.json]
//
// 产物：cuts（44 个镜头边界）/ subs（154 条，含 hl 关键词）/ hits（音效锚点）/
//        impacts（镜头震动）/ scenes（镜头类型表）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SB = process.argv[2] || 'D:/@kaifa/yandi/out/5 曹操/源文件/caocao_full_sb.json';
const OUT = process.argv[3] || path.join(here, 'demo', 'cues-full.json');
const sb = JSON.parse(fs.readFileSync(SB, 'utf8'));

// 高亮词：优先选最长命中，和样片字幕的强调风格一致
const KEYWORDS = [
  '兵不血刃', '多米诺骨牌', '明码标价', '奇耻大辱', '高平陵', '继承人', '嫡长子', '命根子', '分岔路', '一辈子',
  '司马懿', '司马师', '司马昭', '司马炎', '丁夫人', '曹昂', '曹丕', '曹叡', '曹爽', '曹植', '典韦', '张绣', '张济',
  '寡妇', '三国', '拐弯', '那一晚', '这一晚', '标题党', '官渡', '赤壁', '宛城', '公元', '投降', '西凉', '军阀',
  '侄子', '接管', '收编', '收购案', '婶婶', '叔叔', '姓邹', '偷袭', '大营', '营门', '流箭', '断后', '接班',
  '亲儿子', '培养', '上战场', '带兵', '位子', '人缘', '老臣', '织布', '史书', '念叨', '娶亲', '推演', '禅让',
  '皇帝', '托孤', '装病', '躺十年', '洛阳', '晋朝', '曹家', '起点', '如果', '史实', '八卦', '人生', '上头',
  '媳妇', '机会', '小事', '骨牌', '推倒', '换了人', '不好说', '关系', '随手', '历史', '一排', '艾伦', '拜拜',
  '遛狗', '扯远', '回答', '尸体', '老婆', '儿子', '妈妈', '曹操', '忍得了', '跑不动', '不见', '不抬',
  '往后', '一步一步', '可能会问', '一整排', '惨', '逃', '哭', '闹', '求', '离', '死', '马',
  '枪', '反', '纳', '晋', '第一', '第二', '第三', '一夜',
];
function pickHl(text) {
  let best = '';
  for (const k of KEYWORDS) if (text.includes(k) && k.length > best.length) best = k;
  return best;
}

const r2 = v => +(+v).toFixed(2);
const subs = sb.subs.map(([t0, t1, text]) => ({ t0: r2(t0), t1: r2(t1), text, hl: pickHl(text) }));
const cuts = sb.scenes.slice(0, -1).map(s => r2(s.e));
const scenes = sb.scenes.map(s => ({ s: r2(s.s), e: r2(s.e), type: s.type }));

// 样片 20 个 hits 原样保留（第 1–11 镜的场景函数直接引用这些键）
const hits = {
  lantern: 0.12, thread: 1.56, stamp: 2.46, turn: 4.26, mark: 5.62, battle: 7.86, sweep: 9.15,
  arrive: 10.56, city: 12.52, year: 13.66, general: 15.26, uncle: 16.72, death: 18.56,
  handover: 19.24, surrender: 20.66, deal: 22.66, see: 24.36, zou: 26.36, take: 27.96, nazhao: 28.50,
  // 第 12–45 镜
  shame: 29.5, revolt: 34.66, lose: 37.06, dianwei: 40.0, dianweifall: 43.96, angmount: 46.66,
  angfall: 53.9, escape: 55.16, heir: 58.16, ding: 61.56, trains: 66.66, ages: 70.86, future: 73.76,
  lost: 79.16, fury: 82.46, beg: 84.96, begfinal: 89.86, regret: 96.06, price: 102.66, chain: 107.56,
  choose: 112.16, abdicate: 115.26, tuogu: 118.26, sima: 122.96, gaoping: 127.66, coup: 134.76,
  chainpoint: 140.46, whatif: 144.26, noif: 151.76, relate: 155.26, p1: 160.66, p2: 171.26,
  p3: 177.46, ending: 183.86,
};

// 镜头震动：只给真正需要“砸下去”的时刻
const impacts = [
  { t: 2.46, a: 3 }, { t: 7.86, a: 3 }, { t: 9.15, a: 2 }, { t: 13.66, a: 2 }, { t: 18.56, a: 2 },
  { t: 19.24, a: 2 }, { t: 20.66, a: 2 }, { t: 22.66, a: 2 }, { t: 27.96, a: 2 }, { t: 28.5, a: 3 },
  { t: 34.66, a: 3 }, { t: 37.06, a: 3 }, { t: 43.96, a: 3 }, { t: 53.9, a: 3 }, { t: 102.66, a: 2 },
  { t: 127.66, a: 3 }, { t: 134.76, a: 3 }, { t: 140.46, a: 2 }, { t: 183.86, a: 2 },
];

const cues = { fps: 30, duration: 187, cuts, subs, hits, impacts, scenes };
fs.writeFileSync(OUT, JSON.stringify(cues, null, 2) + '\n');
console.log(`cuts ${cuts.length} · subs ${subs.length} · hits ${Object.keys(hits).length} · impacts ${impacts.length}`);
console.log(`hl 命中 ${subs.filter(s => s.hl).length}/${subs.length}`);
console.log(`→ ${OUT}`);
