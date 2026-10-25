// 女娲封面 v2：bg10 全幅底 + 女娲居中 + 行楷金色主标题（无其他文字）
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = 'C:/Users/20200/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';

const HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#0E1518;}</style></head><body>
<canvas id="cv" width="1440" height="1080"></canvas>
<script>
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const IM={};let loaded=0;const need=2;
function ld(k,src){const im=new Image();im.onload=()=>loaded++;im.onerror=()=>loaded++;im.src='file:///'+src.split('/').map(encodeURIComponent).join('/');IM[k]=im;}
ld('bg','D:/@kaifa/yandi/006_女娲/背景图_v1/bg10_layeredpeaks.png');
ld('nuwa','D:/@kaifa/yandi/006_女娲/nuwa_front.png');

function draw(W,H){
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,W,H);
  // bg10 全幅铺底（aspect-fill 居中裁切，不变形）
  if(IM.bg&&IM.bg.complete){
    const iw=IM.bg.naturalWidth,ih=IM.bg.naturalHeight;
    const s=Math.max(W/iw,H/ih);
    const dw=iw*s,dh=ih*s;
    ctx.imageSmoothingEnabled=true;
    ctx.drawImage(IM.bg,(W-dw)/2,(H-dh)/2,dw,dh);
  }
  else{ctx.fillStyle='#0E1518';ctx.fillRect(0,0,W,H);}
  // 底部压暗，保证女娲与背景分离
  const vg=ctx.createLinearGradient(0,H*0.35,0,H);
  vg.addColorStop(0,'rgba(14,21,24,0)');vg.addColorStop(1,'rgba(14,21,24,0.55)');
  ctx.fillStyle=vg;ctx.fillRect(0,H*0.35,W,H*0.65);
  // 女娲光环（极淡，仅用于人物分离）
  const nx=W*0.5,ny=H*0.58,ns=Math.min(W*0.56,H*0.48);
  ctx.save();ctx.translate(nx,ny);
  ctx.strokeStyle='rgba(78,158,138,0.35)';ctx.lineWidth=ns*0.02;
  ctx.beginPath();ctx.arc(0,0,ns*0.56,0,7);ctx.stroke();
  ctx.strokeStyle='rgba(232,184,75,0.30)';ctx.lineWidth=ns*0.012;
  ctx.beginPath();ctx.arc(0,0,ns*0.47,0,7);ctx.stroke();
  ctx.restore();
  // 女娲居中（像素锐利）
  if(IM.nuwa&&IM.nuwa.complete){
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(IM.nuwa,nx-ns/2,ny-ns/2,ns,ns);
  }
  // 主标题：行楷 + 金色渐变 + 深色描边
  const title='女娲';
  const size=Math.min(W*0.26,H*0.18);
  const ty=H*0.155;
  ctx.save();
  ctx.translate(W*0.5,ty);
  ctx.font='400 '+size+'px "STXingkai","华文行楷","STKaiti","Microsoft YaHei",sans-serif';
  ctx.textAlign='center';ctx.textBaseline='middle';
  // 金色垂直渐变
  const gg=ctx.createLinearGradient(0,-size*0.55,0,size*0.55);
  gg.addColorStop(0,'#F9E7A6');gg.addColorStop(0.35,'#F0CB5C');gg.addColorStop(0.62,'#E8B84B');gg.addColorStop(1,'#B8860F');
  // 外发光（轻）
  ctx.shadowColor='rgba(232,184,75,0.45)';ctx.shadowBlur=size*0.18;
  ctx.lineWidth=size*0.13;ctx.strokeStyle='#1A1208';ctx.lineJoin='round';
  ctx.strokeText(title,0,0);
  ctx.shadowBlur=0;
  ctx.fillStyle=gg;ctx.fillText(title,0,0);
  ctx.restore();
}
window.__ready=function(){return loaded>=need;};
window.renderCover=function(w,h){cv.width=w;cv.height=h;draw(w,h);};
</script></body></html>`;

(async () => {
  fs.writeFileSync(path.join(__dirname, 'cover_nuwa.html'), HTML);
  const browser = await chromium.launch({ executablePath: EXE, args: ['--force-device-scale-factor=1'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('file:///' + path.join(__dirname, 'cover_nuwa.html').replace(/\\/g, '/'));
  await page.waitForFunction('window.__ready && window.__ready()', null, { timeout: 20000 });
  // 4:3（1440×1080）
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.evaluate('window.renderCover(1440,1080)');
  fs.writeFileSync(path.join(__dirname, '..', '..', 'out', '2 女娲', 'cover_4x3.png'), await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1440, height: 1080 } }));
  // 3:4（1080×1440）
  await page.setViewportSize({ width: 1080, height: 1440 });
  await page.evaluate('window.renderCover(1080,1440)');
  fs.writeFileSync(path.join(__dirname, '..', '..', 'out', '2 女娲', 'cover_3x4.png'), await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1440 } }));
  await browser.close();
  console.log('covers done');
})().catch(e => { console.error('FAIL:', e.message); process.exit(1); });
