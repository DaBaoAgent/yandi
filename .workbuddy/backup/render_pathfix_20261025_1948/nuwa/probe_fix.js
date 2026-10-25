// 修复验证抽帧
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = 'C:/Users/20200/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///' + path.join(__dirname, 'page_full_nuwa.html').replace(/\\/g, '/'));
  await page.waitForFunction('window.__ready && window.__ready()', null, { timeout: 30000 });
  fs.mkdirSync('probe_fix', { recursive: true });
  for (const t of [130, 136, 360, 418]) {
    await page.evaluate(n => window.renderFrame(n), Math.round(t * 30));
    const buf = await page.screenshot({ type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    fs.writeFileSync('probe_fix/fix_' + t + '.jpg', buf);
    console.log('t=' + t, 'done');
  }
  await browser.close();
})();
