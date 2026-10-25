// 生成 8 版全片背景 PNG（1920×1080）+ 总览图
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const EXE = 'C:/Users/20200/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const OUT = 'D:/@kaifa/yandi/output/006_女娲/背景图_v1';
const NAMES = ['bg01_starmist','bg02_earth','bg03_skycrack','bg04_fivestone','bg05_bonfire','bg06_jademountain','bg07_temple','bg08_starend'];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///' + path.join(__dirname, 'bg_page.html').replace(/\\/g, '/'));
  await page.waitForFunction('window.__ready && window.__ready()', null, { timeout: 30000 });

  for (const n of NAMES) {
    await page.evaluate(name => window.drawBG(name), n);
    const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } });
    const f = path.join(OUT, n + '.png');
    fs.writeFileSync(f, buf);
    console.log(n, '->', (buf.length / 1024).toFixed(0) + 'KB');
  }

  // 总览图 4×2（每格 960×540）
  const imgs = NAMES.map(n => 'data:image/png;base64,' + fs.readFileSync(path.join(OUT, n + '.png')).toString('base64'));
  const sheet = await page.evaluate(async (list) => {
    const c = document.createElement('canvas'); c.width = 3840; c.height = 2160;
    const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, 3840, 2160);
    for (let i = 0; i < list.length; i++) {
      const im = new Image();
      await new Promise(r => { im.onload = r; im.src = list[i]; });
      x.drawImage(im, (i % 4) * 960, Math.floor(i / 4) * 1080, 960, 540);
    }
    return c.toDataURL('image/jpeg', 0.82);
  }, imgs);
  fs.writeFileSync(path.join(OUT, '背景图_总览.jpg'), Buffer.from(sheet.split(',')[1], 'base64'));
  console.log('总览图 -> 背景图_总览.jpg');
  await browser.close();
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
