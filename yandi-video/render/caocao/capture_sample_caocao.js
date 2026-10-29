// 曹操 样片捕获（前 20 秒，目检人物比例/字幕/背景）
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = 'C:/Users/20200/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const FPS = 30;
const SB = JSON.parse(fs.readFileSync(path.join(__dirname, 'caocao_full_sb.json'), 'utf8'));
const DIR = path.join(__dirname, 'frames_caocao_sample');
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR);
(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--force-device-scale-factor=1'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file:///' + path.join(__dirname, 'page_full_caocao.html').replace(/\\/g, '/'));
  await page.waitForFunction('window.__ready && window.__ready()', null, { timeout: 20000 });
  const errs = await page.evaluate('window.__err||[]');
  if (errs.length) console.log('RENDER ERRORS:', errs.slice(0, 8));
  const N = 20 * FPS;
  for (let i = 0; i < N; i++) {
    await page.evaluate((n) => window.renderFrame(n), i);
    const p = DIR + '/' + String(i).padStart(6, '0') + '.jpg';
    await page.screenshot({ path: p, type: 'jpeg', quality: 88 });
    if (i % 150 === 0) console.log('cap', i, '/', N);
  }
  await browser.close();
  console.log('sample frames done:', N);
})();
