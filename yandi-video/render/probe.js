const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = 'C:/Users/20200/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const PROBES = [5, 12, 18, 26, 33.5, 48, 66, 99, 116, 135, 160, 174, 196, 209, 226, 248, 262, 288, 300, 318, 332, 350, 366, 375, 384.5];

(async () => {
  const outDir = path.join(__dirname, '..', 'probe');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('file:///' + path.join(__dirname, 'page_full.html').replace(/\\/g, '/'));
  await page.waitForTimeout(600);
  for (const t of PROBES) {
    const f = Math.round(t * 30);
    await page.evaluate((n) => window.renderFrame(n), f);
    const buf = await page.screenshot({ type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    fs.writeFileSync(path.join(outDir, 'p' + String(t).replace('.', '_') + '.jpg'), buf);
  }
  await browser.close();
  console.log('probes done. errors:', errors.length ? errors : 'none');
})();
