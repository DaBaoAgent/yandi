import { spawnSync } from 'node:child_process';
const FILE = process.argv[2], T = process.argv[3];
const W = 1920, H = 1080;
const r = spawnSync('ffmpeg', ['-v','error','-ss',String(T),'-i',FILE,'-frames:v','1','-f','rawvideo','-pix_fmt','gray','-'], { maxBuffer: 64*1024*1024 });
const b = r.stdout;
let sum=0,cnt=0,big=0;
for(let y=0;y<H;y++){
  if(y%3===1) continue;
  const by=(y-(y%3))*W;
  for(let x=0;x<W;x++){
    const d=Math.abs(b[by+(x-(x%3))]-b[y*W+x]);
    sum+=d;cnt++;if(d>12)big++;
  }
}
console.log(`Y-plane reconMean ${(sum/cnt).toFixed(2)}  >12级占比 ${(100*big/cnt).toFixed(3)}%`);
