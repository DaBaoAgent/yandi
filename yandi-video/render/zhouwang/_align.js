// 对齐：手写subs文字流 <-> whisper字流，按累计字符比例映射时间
const fs=require('fs');
const w=JSON.parse(fs.readFileSync(__dirname+'/transcript_full.json','utf8'));
const SB=JSON.parse(fs.readFileSync(__dirname+'/zhouwang_full_sb.json','utf8'));

// whisper 字流去标点
const wchars=w.map(x=>x.text.replace(/[，。？！、,.\?!]/g,'')).join('');
console.log('whisper chars:',wchars.length);

// subs 文字流去标点，记录每条字符范围
let cstr='';
const ranges=[];
for(const s of SB.subs){
  const t=s[2].replace(/[，。？！、,.\?!]/g,'');
  ranges.push([cstr.length, cstr.length+t.length]);
  cstr+=t;
}
console.log('subs chars:',cstr.length,'subs:',SB.subs.length);

// 按比例映射：subs字符位置 -> whisper字符位置
const C=cstr.length, W=wchars.length;
const newSubs=[];
for(let i=0;i<SB.subs.length;i++){
  const [cs,ce]=ranges[i];
  const wiS=Math.min(W-1, Math.round(cs/C*W));
  const wiE=Math.min(W-1, Math.max(wiS, Math.round(ce/C*W)-1));
  // 找wiS对应的whisper字索引（whisper字流每字长度不一，用累计字长）
  // 重新遍历whisper字，累计字符
  let acc=0, idxS=0, idxE=0;
  for(let k=0;k<w.length;k++){
    const clen=w[k].text.replace(/[，。？！、,.\?!]/g,'').length;
    if(acc<=wiS && acc+clen>wiS) idxS=k;
    if(acc<=wiE && acc+clen>wiE) idxE=k;
    acc+=clen;
  }
  newSubs.push([+w[idxS].start.toFixed(2), +w[idxE].end.toFixed(2), SB.subs[i][2]]);
}
fs.writeFileSync(__dirname+'/subs_aligned.json', JSON.stringify(newSubs,null,1));
for(let i=0;i<newSubs.length;i++) console.log(newSubs[i][0].toFixed(2),'-',newSubs[i][1].toFixed(2),newSubs[i][2]);
