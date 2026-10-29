// 顺序消耗对齐：按subs每条字数依次消耗whisper字流，取首尾原生时间
const fs=require('fs');
const w=JSON.parse(fs.readFileSync(__dirname+'/transcript_full.json','utf8'));
const SB=JSON.parse(fs.readFileSync(__dirname+'/zhouwang_full_sb.json','utf8'));

// whisper 展平成单字时间数组
const wchars=[];
for(const x of w){
  const t=x.text.replace(/[，。？！、,.\?!]/g,'');
  for(const ch of t) wchars.push({ch, s:x.start, e:x.end});
}
console.log('whisper flat chars:',wchars.length);

// 顺序消耗
let cur=0;
const out=[];
for(const s of SB.subs){
  const txt=s[2].replace(/[，。？！、,.\?!]/g,'');
  const len=txt.length;
  if(cur>=wchars.length) break;
  const startIdx=cur;
  const endIdx=Math.min(wchars.length-1, cur+len-1);
  out.push([+wchars[startIdx].s.toFixed(2), +wchars[endIdx].e.toFixed(2), s[2]]);
  cur=endIdx+1;
}
console.log('subs aligned:',out.length,'consumed:',cur,'/',wchars.length);
fs.writeFileSync(__dirname+'/subs_aligned.json',JSON.stringify(out,null,1));
for(const o of out) console.log(o[0].toFixed(2),'-',o[1].toFixed(2),o[2]);
