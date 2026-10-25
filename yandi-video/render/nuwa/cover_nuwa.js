// 女娲封面：4:3(1440×1080) 与 3:4(1080×1440) 双封面
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = 'C:/Users/20200/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';

const HTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:#0E1518;}</style></head><body>
<canvas id="cv" width="1440" height="1080"></canvas>
<script>
const W=1440,H=1080;
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
const IM={};let loaded=0;const need=3;
function ld(k,src){const im=new Image();im.onload=()=>loaded++;im.onerror=()=>loaded++;im.src='file:///'+src.split('/').map(encodeURIComponent).join('/');IM[k]=im;}
ld('nuwa','D:/@kaifa/yandi/output/006_女娲/nuwa_front.png');
ld('mom','D:/@kaifa/yandi/output/006_女娲/女娲故事常用素材_透明PNG_v1/人物/部落母亲.png');
ld('mud','D:/@kaifa/yandi/output/006_女娲/女娲故事常用素材_透明PNG_v1/道具/黄土小泥人.png');
function rnd(s){const x=Math.sin(s*127.1+311.7)*43758.5453;return x-Math.floor(x);}
function draw(){
  ctx.fillStyle='#0E1518';ctx.fillRect(0,0,W,H);
  const g=ctx.createRadialGradient(W*0.5,H*0.45,60,W*0.5,H*0.45,W*0.8);
  g.addColorStop(0,'#162125');g.addColorStop(1,'#0E1518');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,0.05)';
  for(let i=0;i<50;i++){const px=(rnd(i)*W+i*13)%W,py=(rnd(i+3)*H+i*7)%H;ctx.fillRect(px,py,2,2);}
  // 玉璧光环
  ctx.save();ctx.translate(W*0.5,H*0.52);
  ctx.strokeStyle='rgba(78,158,138,0.5)';ctx.lineWidth=10;ctx.beginPath();ctx.arc(0,0,315,0,7);ctx.stroke();
  ctx.strokeStyle='rgba(232,184,75,0.7)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,255,0,7);ctx.stroke();
  ctx.restore();
  // 女娲居中
  const im=IM.nuwa;
  if(im&&im.complete){ctx.imageSmoothingEnabled=false;ctx.drawImage(im,W*0.5-290,H*0.52-330,580,580);}
  // 泥人小点缀
  for(let i=0;i<3;i++){const m=IM.mud;if(m&&m.complete){ctx.imageSmoothingEnabled=false;ctx.drawImage(m,W*0.5-430+i*430,H*0.78,120,120);}}
  // 标题
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='900 150px "Microsoft YaHei"';
  ctx.lineWidth=18;ctx.strokeStyle='#0E1518';ctx.lineJoin='round';
  ctx.strokeText('女娲',W*0.5,H*0.14);
  ctx.fillStyle='#E8B84B';ctx.fillText('女娲',W*0.5,H*0.14);
  ctx.font='900 54px "Microsoft YaHei"';
  ctx.lineWidth=10;ctx.strokeText('中国人的"妈妈" 干的事比补天还狠',W*0.5,H*0.24);
  ctx.fillStyle='#F3EAD3';ctx.fillText('中国人的"妈妈" 干的事比补天还狠',W*0.5,H*0.24);
  // 底部标签条
  const tags='#中国神话  #女娲  #历史文化  #涨知识';
  ctx.font='500 44px "Microsoft YaHei"';
  const tw=ctx.measureText(tags).width;
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.beginPath();ctx.roundRect(W*0.5-tw/2-40,H-110,tw+80,76,14);ctx.fill();
  ctx.fillStyle='#E8B84B';ctx.fillRect(W*0.5-tw/2-40,H-110,8,76);
  ctx.fillStyle='#F3EAD3';ctx.fillText(tags,W*0.5,H-72);
  ctx.font='500 30px "Microsoft YaHei"';ctx.fillStyle='rgba(255,255,255,0.4)';
  ctx.textAlign='right';ctx.fillText('@徐艾伦',W-40,40);
}
window.__ready=function(){return loaded>=need;};
window.renderCover=function(w,h){cv.width=w;cv.height=h;ctx.setTransform(1,0,0,1,0,0);
  // 按比例换算（以1440基准缩放）
  const k=w/1440;ctx.translate((w-1440*k)/2,(h-1080*k)/2);ctx.scale(k,k);draw();};
</script></body></html>`;

(async () => {
  fs.writeFileSync(path.join(__dirname, 'cover_nuwa.html'), HTML);
  const browser = await chromium.launch({ executablePath: EXE, args: ['--force-device-scale-factor=1'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });
  await page.goto('file:///' + path.join(__dirname, 'cover_nuwa.html').replace(/\\/g, '/'));
  await page.waitForFunction('window.__ready && window.__ready()', null, { timeout: 20000 });
  // 4:3
  await page.evaluate('window.renderCover(1440,1080)');
  fs.writeFileSync(path.join(__dirname, '..', '..', 'out', '2 女娲', 'cover_4x3.png'), await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1440, height: 1080 } }));
  // 3:4
  await page.evaluate('window.renderCover(1080,1440)');
  await page.setViewportSize({ width: 1080, height: 1440 });
  await page.evaluate('window.renderCover(1080,1440)');
  fs.writeFileSync(path.join(__dirname, '..', '..', 'out', '2 女娲', 'cover_3x4.png'), await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1080, height: 1440 } }));
  await browser.close();
  console.log('covers done');
})();
