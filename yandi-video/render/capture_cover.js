const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = 'C:/Users/20200/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1600 } });
  await page.goto('file:///' + path.join(__dirname, 'cover.html').replace(/\\/g, '/'));
  await page.waitForTimeout(400);
  const out = path.join(__dirname, '..', 'out');
  fs.mkdirSync(out, { recursive: true });
  const b43 = await page.evaluate(() => window.snap('c43'));
  fs.writeFileSync(path.join(out, 'cover_4x3.png'), Buffer.from(b43.split(',')[1], 'base64'));
  const b34 = await page.evaluate(() => window.snap('c34'));
  fs.writeFileSync(path.join(out, 'cover_3x4.png'), Buffer.from(b34.split(',')[1], 'base64'));
  await browser.close();
  console.log('covers done');
})();
