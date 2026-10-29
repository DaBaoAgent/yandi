// 用whisper原生字级时间戳，按停顿切句，错别字映射修正
const fs=require('fs');
const w=JSON.parse(fs.readFileSync(__dirname+'/transcript_full.json','utf8'));

// whisper常见错别字 -> 正确字（按出现顺序长串替换）
const FIX=[
 ['包四','褒姒'],['包私','褒姒'],['包司','褒姒'],['包思','褒姒'],
 ['能火','烽火'],['瘋火','烽火'],['疯火','烽火'],
 ['包国','褒国'],['包是他的国','褒是她的国'],
 ['身後','申后'],['身后','申后'],['身后廢','申后废'],
 ['移救','宜臼'],['移臼','宜臼'],['宜救','宜臼'],
 ['伯福','伯服'],['伯孚','伯服'],
 ['深侯','申侯'],['深国','申国'],['深后','申后'],
 ['犬荣','犬戎'],['全容','犬戎'],['拳戎','犬戎'],['全戎','犬戎'],
 ['周游王','周幽王'],['周悠王','周幽王'],['周幽王','周幽王'],
 ['離山','骊山'],['离山','骊山'],
 ['爐走','掳走'],['掳走','掳走'],
 ['隐狼入世','引狼入室'],['引狼入世','引狼入室'],
 ['非常利用','废长立幼'],['废长立幼','废长立幼'],
 ['呂時春秋','吕氏春秋'],['吕時春秋','吕氏春秋'],['吕氏春秋','吕氏春秋'],
 ['紅烟祸水','红颜祸水'],['红颜祸水','红颜祸水'],
 ['墨西','妺喜'],['妹喜','妺喜'],
 ['打击','妲己'],['妲已','妲己'],
 ['瘋火戲竹侯','烽火戏诸侯'],['烽火戏竹侯','烽火戏诸侯'],['烽火戏诸侯','烽火戏诸侯'],
 ['王了','亡了'],['王國','亡国'],['西周王','西周亡'],
 ['姓个女儿','献个女儿'],['姓个','献个'],
 ['抖他','逗她'],['斗包私','逗褒姒'],['鬥包私','逗褒姒'],
 ['白了个白','拜了个拜'],['拜了个拜','拜了个拜'],
 ['六狗','遛狗'],['遛狗','遛狗'],
 ['爱伦','艾伦'],['艾伦','艾伦'],
 ['不舍远','不扯远'],['不扯远','不扯远'],
 ['扯远','扯远'],
 ['幕後','幕后'],
];

// 按停顿切句（词间停顿>0.22s 切）
const segs=[];
let cur=[w[0]];
for(let i=1;i<w.length;i++){
  const gap=w[i].start - w[i-1].end;
  const len=cur.reduce((a,x)=>a+x.text.replace(/[，。？！、,.\?!]/g,'').length,0);
  if(gap>0.22 && len>=5){ segs.push(cur); cur=[w[i]]; }
  else cur.push(w[i]);
}
segs.push(cur);

// 每句生成字幕
const subs=[];
for(const seg of segs){
  const t0=seg[0].start, t1=seg[seg.length-1].end;
  let txt=seg.map(x=>x.text).join('').replace(/[，。？！、,.\?!]/g,'');
  // 应用错别字修正
  for(const [bad,good] of FIX) txt=txt.split(bad).join(good);
  if(txt.length>=2) subs.push([+t0.toFixed(2),+t1.toFixed(2),txt]);
}
fs.writeFileSync(__dirname+'/subs_native.json',JSON.stringify(subs,null,1));
console.log('native subs:',subs.length,'dur:',subs[subs.length-1][1]);
for(const s of subs) console.log(s[0].toFixed(2),'-',s[1].toFixed(2),s[2]);
