// 探针：抽取关键帧 + 输出QC仪表数据
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = 'C:/Users/20200/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const FPS = 30;
const OUT = path.join(__dirname, 'probe');
const SB = JSON.parse(fs.readFileSync(path.join(__dirname, 'nuwa_sb.json'), 'utf8'));
// 探针时刻：每镜取 镜头25%处
const probes = [];
for (const sc of SB.scenes) probes.push(+(sc.s + (sc.e - sc.s) * 0.3).toFixed(2));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: EXE, args: ['--force-device-scale-factor=1'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', m => { if (m.text().includes('err')) console.log('PAGE:', m.text()); });
  await page.goto('file:///' + path.join(__dirname, 'page_nuwa.html').replace(/\\/g, '/'));
  await page.waitForFunction('window.__ready && window.__ready()', null, { timeout: 20000 });
  const errs = await page.evaluate('window.__err||[]');
  if (errs.length) console.log('RENDER ERRORS:', errs.slice(0, 5));
  for (let i = 0; i < probes.length; i++) {
    const t = probes[i];
    const qc = await page.evaluate((n) => window.renderFrame(n), Math.round(t * FPS));
    const buf = await page.screenshot({ type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    const name = 'p' + String(i).padStart(2, '0') + '_t' + t.toFixed(2).padStart(5, '0') + '.jpg';
    fs.writeFileSync(path.join(OUT, name), buf);
    // 文字覆盖率
    let area = 0;
    for (const r of qc.textRects) area += r[2] * r[3];
    const cov = (area / (1920 * 1080) * 100).toFixed(1);
    console.log(name, '| moving:', qc.moving.length, '| acts:', qc.acts.length, '| textCov:', cov + '%');
  }
  await browser.close();
  console.log('PROBE DONE');
})();
