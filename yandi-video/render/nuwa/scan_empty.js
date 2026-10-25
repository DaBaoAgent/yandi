// 全片空画面扫描：每秒渲染1帧，读画布像素统计"非底色占比"
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = 'C:/Users/20200/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const SB = JSON.parse(fs.readFileSync(path.join(__dirname, 'nuwa_full_sb.json'), 'utf8'));

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--allow-file-access-from-files'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = [];
  page.on('pageerror', e => { if (errs.length < 10) errs.push(e.message); });
  await page.goto('file:///' + path.join(__dirname, 'page_full_nuwa.html').replace(/\\/g, '/'));
  await page.waitForFunction('window.__ready && window.__ready()', null, { timeout: 30000 });
  const bad = [];
  for (let t = 0; t < SB.total; t += 1) {
    const r = await page.evaluate(tt => {
      window.renderFrame(Math.round(tt * 30));
      const cv = document.getElementById('cv');
      const ctx = cv.getContext('2d');
      const d = ctx.getImageData(0, 0, 1920, 1080).data;
      let nb = 0, bright = 0;
      const n = d.length / 4;
      for (let i = 0; i < n; i++) {
        const R = d[i * 4], G = d[i * 4 + 1], B = d[i * 4 + 2];
        // 底色 #0E1518 附近视为背景；字幕条区域(924-1024)除外
        const y = Math.floor(i / 1920);
        if (y >= 920 && y <= 1030) continue;
        if (Math.abs(R - 14) + Math.abs(G - 21) + Math.abs(B - 24) > 60) nb++;
        if (R + G + B > 380) bright++;
      }
      return { nb: +(nb / n * 100).toFixed(2), bright: +(bright / n * 100).toFixed(2) };
    }, t);
    const sc = SB.scenes.find(s => t >= s.s && t < s.e);
    if (r.nb < 4.0) bad.push({ t, nb: r.nb, bright: r.bright, type: sc ? sc.type + (sc.variant || sc.phase || '') : '?' });
  }
  console.log('渲染错误:', errs.length ? errs : '无');
  console.log('空画面窗口(<4%非底色):', bad.length);
  bad.forEach(b => console.log('  t=' + b.t, b.type, 'nb=' + b.nb + '%', 'bright=' + b.bright + '%'));
  await browser.close();
})();
