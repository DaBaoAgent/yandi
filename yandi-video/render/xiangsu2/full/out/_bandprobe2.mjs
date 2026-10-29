import { spawnSync } from 'node:child_process';
const [A,AT,B,BT] = process.argv.slice(2);
function grab(f,t){ const r=spawnSync('ffmpeg',['-v','error','-ss',t,'-i',f,'-frames:v','1','-f','rawvideo','-pix_fmt','rgb24','-'],{maxBuffer:64*1024*1024}); return r.stdout; }
const a=grab(A,AT), b=grab(B,BT);
const W=1920,H=1080;
let rows=[];
for(let y=0;y<H;y+=10){
  let s=0,n=0;
  for(let x=0;x<W;x+=8){ const i=(y*W+x)*3; s+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]); n+=3; }
  if(s/n>2) rows.push(`${y}:${(s/n).toFixed(1)}`);
}
console.log('rows with mean rgb diff >2:', rows.length? rows.join(' ') : 'none');
