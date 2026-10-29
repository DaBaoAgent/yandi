import { spawn, spawnSync } from 'node:child_process';
const FILE = process.argv[2];
const GW=192,GH=108,DELTA=8,QUIET=0.005,FPS=30;
const S=GW*GH;
const ff = spawn('ffmpeg',['-v','error','-i',FILE,'-vf',`scale=${GW}:${GH},format=gray`,'-f','rawvideo','-'],{stdio:['ignore','pipe','pipe']});
const chunks=[]; ff.stdout.on('data',d=>chunks.push(d));
let err=''; ff.stderr.on('data',d=>{err+=d});
await new Promise((res,rej)=>{ff.on('close',c=>c?rej(new Error(err)):res());});
const buf=Buffer.concat(chunks); const n=Math.floor(buf.length/S);
const frac=new Float64Array(n-1);
for(let i=1;i<n;i++){let ch=0;const a=(i-1)*S,b=i*S;for(let p=0;p<S;p++)if(Math.abs(buf[b+p]-buf[a+p])>DELTA)ch++;frac[i-1]=ch/S;}
let run=0,runs=[];
for(let i=0;i<frac.length;i++){
  if(frac[i]<=QUIET){run++;}
  else { if(run/FPS>=0.5) runs.push([(i-run+1)/FPS, run/FPS]); run=0; }
}
if(run/FPS>=0.5) runs.push([(frac.length-run+1)/FPS, run/FPS]);
runs.sort((a,b)=>b[1]-a[1]);
console.log('runs >=0.5s:', runs.length);
for(const [st,du] of runs) console.log(`  start ${st.toFixed(2)}s  dur ${du.toFixed(2)}s  end ${(st+du).toFixed(2)}s`);
