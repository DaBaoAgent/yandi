// 001 全片冒烟：每场景渲染 3 个时间点，查类型分发/错误/坏文本/越界/空渲染
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const EXE = 'C:/Users/20200/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe';
const FPS = 30;
const SB = JSON.parse(fs.readFileSync(path.join(__dirname, 'posiwan_full_sb.json'), 'utf8'));
(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--force-device-scale-factor=1'] });
  const pg = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs=[]; pg.on('pageerror',e=>errs.push(String(e)));
  await pg.goto('file:///' + path.join(__dirname, 'page_full_posiwan.html').replace(/\\/g, '/'));
  await pg.waitForFunction('window.__ready && window.__ready()', null, { timeout: 30000 });
  let issues=0;
  for(const sc of SB.scenes){
    const ts=[sc.s+0.25,(sc.s+sc.e)/2,sc.e-0.2];
    let minMove=999,maxCov=0,badOver=[];
    for(const t of ts){
      const q=await pg.evaluate((tt)=>window.renderFrame(tt), Math.floor(t*FPS));
      let area=0;for(const r of q.textRects)area+=r[2]*r[3];
      const cov=area/(1920*1080)*100;
      minMove=Math.min(minMove,q.moving.length);maxCov=Math.max(maxCov,cov);
      const sub=q.subRect;
      for(const r of q.textRects.concat(q.fgRects||[])){
        if(sub&&Math.abs(r[0]-sub[0])<2&&Math.abs(r[1]-sub[1])<2)continue;
        if(r[1]+r[3]>930&&r[1]<1024)badOver.push(+t.toFixed(1));
      }
    }
    let flag='';
    if(minMove<=6)flag+=' [空渲染?]',issues++;
    if(maxCov>30)flag+=' [文字'+maxCov.toFixed(0)+'%]',issues++;
    if(badOver.length)flag+=' [越界@'+badOver.join(',')+']';
    console.log(sc.type.padEnd(13),sc.s.toFixed(2)+'-'+sc.e.toFixed(2),'mv'+minMove,'cov'+maxCov.toFixed(0)+'%',flag);
  }
  const rErrs=await pg.evaluate('window.__err||[]');
  const miss=await pg.evaluate('window.__miss||[]');
  const bad=await pg.evaluate('window.__badText||[]');
  console.log('--- 页面错误',errs.slice(0,5));
  console.log('--- 渲染错误',rErrs.slice(0,10));
  console.log('--- 未分发类型',miss);
  console.log('--- 坏文本',bad.slice(0,5));
  if(errs.length||rErrs.length||miss.length||bad.length)issues++;
  await browser.close();
  console.log(issues?('SMOKE FAIL '+issues+' 项'):'SMOKE OK');
})();
