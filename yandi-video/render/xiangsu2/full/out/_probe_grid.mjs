import { spawnSync } from 'node:child_process';
const FILE = process.argv[2], T = process.argv[3];
const W = 1920, H = 1080;
const r = spawnSync('ffmpeg', ['-v','error','-ss',String(T),'-i',FILE,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-'], { maxBuffer: 64*1024*1024 });
const buf = r.stdout;
let sum=0, cnt=0, big=0;
const byMod = [[0,0],[0,0],[0,0]];
const byX = [[0,0],[0,0],[0,0]];
let bigAtScanPts = 0;
const hist = {};
for (let y=0;y<H;y++){
  if (y%3===1) continue;
  const by = (y-(y%3))*W*3;
  for (let x=0;x<W;x++){
    const s = by + (x-(x%3))*3, d0=(y*W+x)*3;
    let dmax=0;
    for (let c=0;c<3;c++){ const d=Math.abs(buf[s+c]-buf[d0+c]); sum+=d; cnt++; dmax=Math.max(dmax,d); if(d>12) big++; }
    byMod[y%3][0]+=dmax; byMod[y%3][1]++;
    byX[x%3][0]+=dmax; byX[x%3][1]++;
    if (dmax>12) { const k=Math.floor(y/36); hist[k]=(hist[k]||0)+1; }
  }
}
console.log('reconMean', (sum/cnt).toFixed(2), 'big%', (100*big/cnt).toFixed(3));
console.log('mean dmax by y%3', byMod.map(([s,n])=>(s/n).toFixed(2)));
console.log('mean dmax by x%3', byX.map(([s,n])=>(s/n).toFixed(2)));
console.log('big counts by 36px row bands:', Object.entries(hist).sort((a,b)=>b[1]-a[1]).slice(0,10));
