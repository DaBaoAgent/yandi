// 001 全片逐帧捕获 + QC 数据采集
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = 'C:/Users/20200/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const FPS = 30;
const OUT = path.join(__dirname, '..', '..', 'frames_posiwan_full');
const SB = JSON.parse(fs.readFileSync(path.join(__dirname, 'posiwan_full_sb.json'), 'utf8'));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: EXE, args: ['--force-device-scale-factor=1'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file:///' + path.join(__dirname, 'page_full_posiwan.html').replace(/\\/g, '/'));
  await page.waitForFunction('window.__ready && window.__ready()', null, { timeout: 30000 });
  const errs = await page.evaluate('window.__err||[]');
  if (errs.length) console.log('RENDER ERRORS:', errs.slice(0, 8));
  const miss = await page.evaluate('window.__miss||[]');
  if (miss.length) console.log('MISSING TYPES:', miss);
  const total = Math.ceil(SB.total * FPS);
  const t0 = Date.now();
  const qcLog = [];
  for (let i = 0; i < total; i++) {
    const qc = await page.evaluate((n) => window.renderFrame(n), i);
    if (i % 6 === 0) {
      let area = 0;
      for (const r of qc.textRects) area += r[2] * r[3];
      qcLog.push({ f: i, t: +(i / FPS).toFixed(2), moving: qc.moving.length, acts: qc.acts, textCov: +(area / (1920 * 1080) * 100).toFixed(1) });
    }
    const buf = await page.screenshot({ type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    fs.writeFileSync(path.join(OUT, 'f' + String(i).padStart(5, '0') + '.jpg'), buf);
    if (i % 300 === 0) console.log('frame', i, '/', total, 'elapsed', Math.round((Date.now() - t0) / 1000) + 's');
  }
  fs.writeFileSync(path.join(__dirname, 'qc_log_full.json'), JSON.stringify(qcLog));
  await browser.close();
  console.log('DONE', total, 'frames in', Math.round((Date.now() - t0) / 1000) + 's');
})();
