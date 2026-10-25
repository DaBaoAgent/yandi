// 全片探针：跨 8 段抽样关键帧 + QC 仪表 + 渲染错误捕获
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = 'C:/Users/20200/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const FPS = 30;
const OUT = path.join(__dirname, 'probe_full');
const SB = JSON.parse(fs.readFileSync(path.join(__dirname, 'nuwa_full_sb.json'), 'utf8'));
// 每段抽样：章节卡中点 + 每 N 镜取一镜的 35% 处
const probes = [];
for (const sc of SB.scenes) {
  if (sc.type === 'chapter') probes.push(+(sc.s + (sc.e - sc.s) * 0.5).toFixed(2));
}
// 每 12 镜取一镜中点
for (let i = 0; i < SB.scenes.length; i += 12) {
  const sc = SB.scenes[i];
  probes.push(+(sc.s + (sc.e - sc.s) * 0.35).toFixed(2));
}
probes.sort((a, b) => a - b);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: EXE, args: ['--force-device-scale-factor=1'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///' + path.join(__dirname, 'page_full_nuwa.html').replace(/\\/g, '/'));
  await page.waitForFunction('window.__ready && window.__ready()', null, { timeout: 30000 });
  const errs = await page.evaluate('window.__err||[]');
  if (errs.length) console.log('RENDER ERRORS (' + errs.length + '):', errs.slice(0, 8));
  let worstCov = 0, worstMov = 99;
  for (let i = 0; i < probes.length; i++) {
    const t = probes[i];
    const qc = await page.evaluate((n) => window.renderFrame(n), Math.round(t * FPS));
    const buf = await page.screenshot({ type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    let area = 0;
    for (const r of qc.textRects) area += r[2] * r[3];
    const cov = +(area / (1920 * 1080) * 100).toFixed(1);
    const sc = SB.scenes.find(s => t >= s.s && t < s.e);
    fs.writeFileSync(path.join(OUT, 'f' + String(i).padStart(2, '0') + '_t' + t.toFixed(2).padStart(6, '0') + '.jpg'), buf);
    console.log('t=' + t.toFixed(2), (sc ? sc.type + (sc.variant ? '/' + sc.variant : '') : '?').padEnd(22), 'moving:', String(qc.moving.length).padStart(2), 'cov:', cov + '%');
    if (cov > worstCov) worstCov = cov;
    if (qc.moving.length < worstMov) worstMov = qc.moving.length;
  }
  console.log('--- worstCov:', worstCov + '%', 'worstMoving:', worstMov, 'probes:', probes.length);
  await browser.close();
})();
