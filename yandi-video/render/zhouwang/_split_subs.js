// 从词级转写自动切全片字幕：词间停顿>0.28s 断句，8-18字一句
const fs=require('fs');
const w=JSON.parse(fs.readFileSync(__dirname+'/transcript_full.json','utf8'));
const out=[];
let cur=null;
for(const x of w){
  const text=x.text.replace(/[，。？！、,.\?!]/g,'');
  if(!cur){ cur={s:x.start,t:text}; continue; }
  const gap=x.start - cur.lastEnd;
  const len=cur.t.length;
  if((gap>0.28 && len>=6) || len>=16){
    out.push([+cur.s.toFixed(2), +x.start.toFixed(2), cur.t]);
    cur={s:x.start,t:text};
  } else {
    cur.t+=text;
  }
  cur.lastEnd=x.end;
}
if(cur && cur.t) out.push([+cur.s.toFixed(2), +w[w.length-1].end.toFixed(2), cur.t]);
fs.writeFileSync(__dirname+'/subs_auto.json', JSON.stringify(out,null,1),'utf8');
console.log(out.length+' subs');
for(const s of out) console.log(s[0].toFixed(2),'-',s[1].toFixed(2),s[2]);
