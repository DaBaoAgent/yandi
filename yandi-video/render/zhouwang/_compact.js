const fs=require('fs');
const w=JSON.parse(fs.readFileSync(__dirname+'/transcript_full.json','utf8'));
let out=[],line='',lt=0;
for(const x of w){
  const t=x.start;
  if(t-lt>=5 && line){ out.push('['+lt.toFixed(1)+'] '+line); line=''; lt=t; }
  line+=x.text;
}
if(line) out.push('['+lt.toFixed(1)+'] '+line);
fs.writeFileSync(__dirname+'/transcript_compact.txt', out.join('\n'),'utf8');
console.log(out.length+' lines');
