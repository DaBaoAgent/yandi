#!/usr/bin/env node
// 扫描全片字幕与 parts/*.js 里的文本字面量，生成 demo/index-full.html 的字形预载表。
//   node build_index.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const cues = JSON.parse(fs.readFileSync(path.join(here, 'demo', 'cues-full.json'), 'utf8'));
const chars = new Set();
const add = s => { for (const ch of s) if (/[\u4e00-\u9fff\u3400-\u4dbf0-9]/.test(ch)) chars.add(ch); };

for (const s of cues.subs) add(s.text);
const partsDir = path.join(here, 'parts');
for (const f of fs.readdirSync(partsDir).filter(f => f.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(partsDir, f), 'utf8');
  for (const m of src.matchAll(/'([^'\n]*)'/g)) add(m[1]);
  for (const m of src.matchAll(/"([^"\n]*)"/g)) add(m[1]);
}
const ZH = [...chars].join('');
const html = `<!doctype html>
<html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../assets/fonts/fonts.css">
<style>html,body{margin:0;background:#000;overflow:hidden}canvas{display:block;width:1920px;height:1080px}</style>
</head><body>
<canvas id="c" width="1920" height="1080"></canvas>
<script type="module">
  const ZH = ${JSON.stringify(ZH)};
  const EN = '0123456789+ .?·¥ PIXEL CAO 197 280';
  await document.fonts.load('12px "Fusion Pixel 12"', ZH + EN);
  await document.fonts.ready;
  await import('./film.js');
  window.__ready = true;
</script>
</body></html>
`;
fs.writeFileSync(path.join(here, 'demo', 'index-full.html'), html);
console.log(`glyphs ${chars.size} → demo/index-full.html`);
