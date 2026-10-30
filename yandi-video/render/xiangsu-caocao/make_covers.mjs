#!/usr/bin/env node
// make_covers.mjs — 曹操封面（复用全片像素场景）
//
// 与 xiangsu/full/make_covers.mjs 同一套路：把 demos/caocao-full/film.js 复制成可配版本
//   · UP / 画布尺寸 / 裁切改为 window 参数（横版 ×4、竖版 ×5，整数放大不变形）
//   · 扫描线周期跟随 UP
//   · 关字幕
// 再在页面上叠「上方深色标题区 + 金色行楷标题」。
//
//   node make_covers.mjs --frames 27.2,15.5,148.2     # 候选帧（无字幕）→ tmp/cover_cand/
//   node make_covers.mjs --final                       # 出 cover_4x3.png / cover_3x4.png
//
// --final 必填：
//   XIANGSU_COVER_OUT    封面交付目录（默认 out/5 曹操）
//   XIANGSU_COVER_TITLE  片名（默认 曹操）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = process.env.XIANGSU_REPO || 'D:/@kaifa/yandi/output/020_曹操/render/mg-styles-15';
const puppeteer = createRequire(path.join(REPO, 'package.json'))('puppeteer-core');
const SRC = path.join(REPO, 'demos', 'caocao-full');
const DIR = path.join(REPO, 'demos', 'caocao-cover');
const CAND = path.join(here, 'tmp', 'cover_cand');
const OUT = process.env.XIANGSU_COVER_OUT || 'D:/@kaifa/yandi/out/5 曹操';
const TITLE = process.env.XIANGSU_COVER_TITLE || '曹操';
const TITLE_COLS = (() => { const h = Math.ceil(TITLE.length / 2); return [TITLE.slice(0, h), TITLE.slice(h)]; })();
const CHROME = process.env.MG_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
    return acc;
  }, [])
);

// ---- 1) 生成 coverfilm.js（assembled film.js 的可配副本）----
function buildDemo() {
  let film = fs.readFileSync(path.join(SRC, 'film.js'), 'utf8');
  const reps = [
    ['const FW = 640, FH = 360, UP = 3;',
     'const FW = 640, FH = 360, UP = (window.__UP || 3);'],
    ['const OUTW = FW * UP, OUTH = FH * UP;',
     'const OUTW = FW * UP, OUTH = FH * UP;\ncv.width = +(window.__CW || OUTW); cv.height = +(window.__CH || OUTH);'],
    ['scan.width = OUTW; scan.height = 3;',
     'scan.width = OUTW; scan.height = UP;'],
    ["c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, 1, OUTW, 1);",
     "c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, Math.floor(UP / 2), OUTW, 1);"],
    ['  ctx.drawImage(small, 0, 0, OUTW, OUTH);\n  ctx.drawImage(vign, 0, 0);\n  ctx.fillStyle = scanPat; ctx.fillRect(0, 0, OUTW, OUTH);\n  ctx.globalCompositeOperation = \'overlay\';\n  ctx.fillStyle = \'rgba(120,255,200,0.02)\'; ctx.fillRect(0, 0, OUTW, OUTH);',
     '  const OX = -Math.round(window.__CROPX || 0) * UP;\n  const OY = Math.round(window.__CROPY || 0) * UP;\n  ctx.drawImage(small, OX, OY, OUTW, OUTH);\n  ctx.drawImage(vign, OX, 0);\n  ctx.fillStyle = scanPat; ctx.fillRect(OX, 0, OUTW, OUTH);\n  ctx.globalCompositeOperation = \'overlay\';\n  ctx.fillStyle = \'rgba(120,255,200,0.02)\'; ctx.fillRect(OX, 0, OUTW, OUTH);'],
    ['  subtitle(tt, f);', '  if (!window.__NO_SUB) subtitle(tt, f);'],
  ];
  for (const [a, b] of reps) {
    if (!film.includes(a)) throw new Error('coverfilm 替换点未找到: ' + a.slice(0, 60));
    film = film.replace(a, b);
  }
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, 'coverfilm.js'), film);
  for (const f of ['sprites.js', 'cues.json']) fs.copyFileSync(path.join(SRC, f), path.join(DIR, f));
  fs.writeFileSync(path.join(DIR, 'index.html'), PAGE);
}

// ---- 2) 封面页（场景 + 标题区 + 金色行楷）----
const PAGE = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="../../assets/fonts/fonts.css">
<style>html,body{margin:0;background:#000;overflow:hidden}canvas{display:block}</style>
</head><body>
<canvas id="c" width="1920" height="1080"></canvas>
<script type="module">
  const q = new URLSearchParams(location.search);
  window.__UP = +(q.get('up') || 3);
  window.__CW = +(q.get('cw') || 1920);
  window.__CH = +(q.get('ch') || 1080);
  window.__CROPX = +(q.get('cropx') || 0);
  window.__CROPY = +(q.get('cropy') || 0);
  window.__BAND = +(q.get('band') || 0);
  window.__NO_SUB = q.get('sub') !== '1';
  await import('./coverfilm.js');
  const ZH = ${JSON.stringify(TITLE)};
  await document.fonts.load('160px "Fusion Pixel 12"', ZH);
  await document.fonts.load('300px "STXingkai"', ZH);
  await document.fonts.ready;

  window.drawCover = (kind) => {
    const cv = document.getElementById('c'), ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const portrait = kind === '3x4';

    const bandH = H * (window.__BAND || (portrait ? 0.40 : 0.32));
    const g = ctx.createLinearGradient(0, 0, 0, bandH);
    g.addColorStop(0, 'rgba(4,7,10,0.95)');
    g.addColorStop(0.62, 'rgba(4,7,10,0.88)');
    g.addColorStop(1, 'rgba(4,7,10,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, bandH);

    const g2 = ctx.createLinearGradient(0, 0, 0, H * 0.14);
    g2.addColorStop(0, 'rgba(2,4,6,0.55)');
    g2.addColorStop(1, 'rgba(2,4,6,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H * 0.14);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';

    const chars = ${JSON.stringify(TITLE.split(''))};
    if (!portrait) {
      const size = Math.min(W * 0.20, H * 0.34);
      const y = H * 0.16;
      chars.forEach((ch, i) => {
        drawGoldChar(ctx, ch, W / 2 + (i - (chars.length - 1) / 2) * size * 0.96, y, size);
      });
    } else {
      const size = Math.min(W * 0.30, bandH * 0.46);
      const cx = W / 2;
      if (chars.length === 1) {
        drawGoldChar(ctx, chars[0], cx, bandH * 0.46, size);
      } else {
        const y0 = bandH * 0.5 - (chars.length - 1) * size * 0.49;
        chars.forEach((ch, i) => drawGoldChar(ctx, ch, cx, y0 + i * size * 0.98, size));
      }
    }
  };

  function drawGoldChar(ctx, ch, x, y, size) {
    const gg = ctx.createLinearGradient(0, y - size * 0.55, 0, y + size * 0.55);
    gg.addColorStop(0, '#FBEDB4');
    gg.addColorStop(0.30, '#F3D26A');
    gg.addColorStop(0.62, '#E8B84B');
    gg.addColorStop(1, '#A9780C');
    ctx.save();
    ctx.translate(x, y);
    ctx.font = '400 ' + size + 'px "STXingkai"';
    ctx.shadowColor = 'rgba(232,184,75,0.42)';
    ctx.shadowBlur = size * 0.16;
    ctx.lineWidth = size * 0.115;
    ctx.strokeStyle = '#160F06';
    ctx.strokeText(ch, 0, 0);
    ctx.shadowBlur = 0;
    ctx.fillStyle = gg;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  }

  window.__ready = true;
</script>
</body></html>`;

// ---- 3) 渲染 ----
async function main() {
  buildDemo();
  const http = await import('node:http');
  const srv = http.createServer((req, res) => {
    try {
      const u = new URL(req.url, 'http://x');
      let p = path.resolve(REPO, '.' + decodeURIComponent(u.pathname));
      if (path.relative(REPO, p).startsWith('..')) { res.writeHead(403); return res.end(); }
      if (!fs.existsSync(p)) { res.writeHead(404); return res.end('404'); }
      const M = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
      res.writeHead(200, { 'Content-Type': M[path.extname(p).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(p).pipe(res);
    } catch (e) { res.writeHead(500); res.end(String(e)); }
  });
  await new Promise(r => srv.listen(0, '127.0.0.1', r));
  const PORT = srv.address().port;

  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: true, pipe: true, protocolTimeout: 600000,
    args: ['--use-angle=d3d11', '--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text',
      '--hide-scrollbars', '--mute-audio', '--no-sandbox'],
  });

  try {
    if (args.frames) {
      fs.mkdirSync(CAND, { recursive: true });
      const page = await browser.newPage();
      page.on('console', m => console.log('[page]', m.type(), m.text()));
      page.on('pageerror', e => console.log('[pageerror]', e.message));
      page.on('requestfailed', r => console.log('[reqfail]', r.url(), r.failure()?.errorText));
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(`http://127.0.0.1:${PORT}/demos/caocao-cover/index.html?up=3&cw=1920&ch=1080`, { waitUntil: 'load' });
      await page.waitForFunction('window.__ready === true', { timeout: 120000 });
      for (const t of String(args.frames).split(',').map(Number)) {
        await page.evaluate((t) => window.renderAt(t), t);
        const f = path.join(CAND, `nosub_t${t.toFixed(2).padStart(6, '0')}.png`);
        fs.writeFileSync(f, await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1920, height: 1080 } }));
        console.log(f);
      }
      await page.close();
      return;
    }

    // --final
    const jobs = [
      { kind: '4x3', up: +(args.up43 || 4), cw: 1440, ch: 1080, cropx: +(args.crop43 || 140), cropy: +(args.cropy43 || 45), band: +(args.band43 || 0.30), t: +(args.t43 || 27.2), file: 'cover_4x3.png' },
      { kind: '3x4', up: +(args.up34 || 5), cw: 1080, ch: 1440, cropx: +(args.crop34 || 212), cropy: +(args.cropy34 || 36), band: +(args.band34 || 0.40), t: +(args.t34 || 27.2), file: 'cover_3x4.png' },
    ];
    fs.mkdirSync(OUT, { recursive: true });
    for (const j of jobs) {
      const page = await browser.newPage();
      await page.setViewport({ width: j.cw, height: j.ch });
      const qs = { up: j.up, cw: j.cw, ch: j.ch, cropx: j.cropx, cropy: j.cropy };
      if (j.band) qs.band = j.band;
      const q = new URLSearchParams(qs);
      await page.goto(`http://127.0.0.1:${PORT}/demos/caocao-cover/index.html?${q}`, { waitUntil: 'load' });
      await page.waitForFunction('window.__ready === true', { timeout: 120000 });
      await page.evaluate((t) => window.renderAt(t), j.t);
      await page.evaluate((k) => window.drawCover(k), j.kind);
      const font = await page.evaluate(() => {
        const sig = (fam) => {
          const cv = document.createElement('canvas'); cv.width = cv.height = 120;
          const c = cv.getContext('2d');
          c.font = '100px "' + fam + '"'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
          c.fillText('曹', 10, 60);
          const d = c.getImageData(0, 0, 120, 120).data;
          let s = 0, ink = 0;
          for (let i = 0; i < d.length; i += 4) { s = (s + d[i + 3] * ((i / 4) % 977)) % 1000000007; if (d[i + 3] > 40) ink++; }
          return { sig: s, ink };
        };
        return { loaded: document.fonts.check('100px "STXingkai"', '曹'), xingkai: sig('STXingkai'), yahei: sig('Microsoft YaHei') };
      });
      console.log('  font check', JSON.stringify(font));
      const f = path.join(OUT, j.file);
      fs.writeFileSync(f, await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: j.cw, height: j.ch } }));
      console.log(`${f}  ${j.cw}x${j.ch}  t=${j.t}`);
      await page.close();
    }
  } finally {
    await browser.close();
    srv.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
