// 定向抽帧：覆盖全部新模板
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = 'C:/Users/20200/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const SB = JSON.parse(fs.readFileSync(path.join(__dirname, 'nuwa_full_sb.json'), 'utf8'));
const times = [33, 57, 62, 67, 71, 75, 93, 97, 101, 105, 110, 114, 119, 145, 150, 162, 171, 176, 181, 189, 199, 209, 218, 226, 230, 236, 245, 253, 267, 279, 298, 311, 322, 328, 334, 350, 363, 369, 378, 381, 396, 407, 414, 419, 424];
(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--force-device-scale-factor=1'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///' + path.join(__dirname, 'page_full_nuwa.html').replace(/\\/g, '/'));
  await page.waitForFunction('window.__ready && window.__ready()', null, { timeout: 30000 });
  const errs = await page.evaluate('window.__err||[]');
  if (errs.length) console.log('RENDER ERRORS:', errs.slice(0, 10));
  fs.mkdirSync(path.join(__dirname, 'probe_full'), { recursive: true });
  for (const t of times) {
    const qc = await page.evaluate(n => window.renderFrame(n), Math.round(t * 30));
    let area = 0; for (const r of qc.textRects) area += r[2] * r[3];
    const cov = (area / (1920 * 1080) * 100).toFixed(1);
    const sc = SB.scenes.find(s => t >= s.s && t < s.e);
    const buf = await page.screenshot({ type: 'jpeg', quality: 85, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    fs.writeFileSync(path.join(__dirname, 'probe_full', 'x' + t.toFixed(2).padStart(6, '0') + '.jpg'), buf);
    console.log('t=' + t, (sc ? sc.type + (sc.variant ? '/' + sc.variant : '') : '?').padEnd(20), 'mv:' + String(qc.moving.length).padStart(2), 'cov:' + cov + '%');
  }
  await browser.close();
})();
