// 第一幕（hook, 0-2.83s）× 8 版背景 → 8 张静帧
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const EXE = 'C:/Users/20200/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const OUT = 'D:/@kaifa/yandi/006_女娲/背景图_v1';
const NAMES = process.argv.slice(2).length ? process.argv.slice(2) : ['bg01_starmist','bg02_earth','bg03_skycrack','bg04_fivestone','bg05_bonfire','bg06_jademountain','bg07_temple','bg08_starend'];
const FRAME = 43; // t=1.433s，第一幕中点，三张卡已全部入场

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///' + path.join(__dirname, 'page_bgtest.html').replace(/\\/g, '/'));
  await page.waitForFunction('window.__ready && window.__ready()', null, { timeout: 30000 });

  for (const n of NAMES) {
    await page.goto('file:///' + path.join(__dirname, 'page_bgtest.html').replace(/\\/g, '/') + '?bg=' + n);
    await page.waitForFunction('window.__bgReady === true', null, { timeout: 15000 });
    const err = await page.evaluate('window.__bgErr || null');
    if (err) { console.log(n, 'BG LOAD FAIL:', err); continue; }
    const qc = await page.evaluate(i => window.renderFrame(i), FRAME);
    const buf = await page.screenshot({ type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    fs.writeFileSync(path.join(OUT, '第一幕_' + n + '.jpg'), buf);
    console.log(n, 'mv:' + qc.moving.length, 'cov:' + (qc.textRects.reduce((a, r) => a + r[2] * r[3], 0) / (1920 * 1080) * 100).toFixed(1) + '%');
  }
  await browser.close();
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
