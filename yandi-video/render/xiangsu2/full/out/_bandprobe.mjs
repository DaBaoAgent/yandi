import { spawnSync } from 'node:child_process';
const A = process.argv[2], B = process.argv[3], T = process.argv[4];
function grab(f){ const r=spawnSync('ffmpeg',['-v','error','-ss',T,'-i',f,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:64*1024*1024}); return r.stdout; }
const a=grab(A), b=grab(B);
const W=1920,H=1080;
let rows=[];
for(let y=0;y<H;y+=6){
  let s=0,n=0;
  for(let x=0;x<W;x+=8){ const i=(y*W+x)*3; s+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]); n+=3; }
  if(s/n>3) rows.push(`${y}:${(s/n).toFixed(1)}`);
}
console.log('rows with mean rgb diff >3:', rows.length? rows.join(' ') : 'none');
