// 管线健康检查：脚本内引用的资产/配音是否都存在
const fs = require('fs');
const path = require('path');
const ROOT = 'D:/@kaifa/yandi/yandi-video/render';
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|html)$/.test(e.name)) files.push(p);
  }
})(ROOT);

const refs = new Set();
const RE = /D:[\\/]@kaifa[\\/]yandi[\\/]output[\\/][^'";)\s]+/g;
for (const f of files) {
  let t = '';
  try { t = fs.readFileSync(f, 'utf8'); } catch (e) { continue; }
  const ms = t.match(RE) || [];
  for (const m of ms) refs.add(m.replace(/\\/g, '/'));
}
const missing = [];
for (const r of refs) if (!fs.existsSync(r)) missing.push(r);
console.log('脚本文件', files.length, '个；外部引用', refs.size, '个；缺失', missing.length, '个');
missing.slice(0, 15).forEach(m => console.log('  缺:', m));

console.log('--- 关键输入 ---');
const key = [
  'D:/@kaifa/yandi/output/007_炎帝/配音.json',
  'D:/@kaifa/yandi/output/007_炎帝/配音.wav',
  'D:/@kaifa/yandi/output/007_炎帝/narration-chunks',
  'D:/@kaifa/yandi/output/006_女娲/背景图_v1/bg10_layeredpeaks.png',
  'D:/@kaifa/yandi/output/006_女娲/nuwa_front.png',
  'D:/@kaifa/yandi/output/007_炎帝/素材_精致逼真_v1/成品图/米饭.png',
  'D:/@kaifa/yandi/output/007_炎帝/素材_像素Q版_v1/人物/炎帝_正面.png',
  'D:/@kaifa/yandi/output/008_帝辛/口播稿.md',
  'D:/@kaifa/yandi/output/008_帝辛/配音.json',
  'D:/@kaifa/yandi/output/008_帝辛/配音.wav',
];
for (const k of key) console.log((fs.existsSync(k) ? 'OK   ' : '缺失 ') + k.replace('D:/@kaifa/yandi/', ''));
