const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const EXE = 'C:/Users/20200/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const FPS = 30, DUR = 30;
const OUT = path.join(__dirname, '..', 'frames');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: EXE, args: ['--force-device-scale-factor=1'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file:///' + path.join(__dirname, 'page.html').replace(/\\/g, '/'));
  await page.waitForTimeout(500);
  const total = FPS * DUR;
  for (let i = 0; i < total; i++) {
    await page.evaluate((n) => window.renderFrame(n), i);
    const buf = await page.screenshot({ type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    fs.writeFileSync(path.join(OUT, 'f' + String(i).padStart(5, '0') + '.jpg'), buf);
    if (i % 100 === 0) console.log('frame', i, '/', total);
  }
  await browser.close();
  console.log('DONE', total, 'frames');
})();
