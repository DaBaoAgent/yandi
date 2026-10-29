// 让场景时间边界贴合它覆盖的字幕的首尾时间
const fs=require('fs');
const sb=JSON.parse(fs.readFileSync(__dirname+'/zhouwang_full_sb.json','utf8'));
const subs=sb.subs, scenes=sb.scenes;

// 对每个场景，找它[s,e]范围内的subs，收紧边界
for(let i=0;i<scenes.length;i++){
  const sc=scenes[i];
  const contained=subs.filter(x=>x[1]>sc.s && x[0]<sc.e);
  if(contained.length){
    // 场景起点 = 第一条sub的start（但不早于原s太多）
    sc.s = Math.max(sc.s, contained[0][0] - 0.05);
    // 场景终点 = 最后一条sub的end
    sc.e = contained[contained.length-1][1] + 0.05;
  }
}
// 消除重叠：后一场景s不小于前一场景e
for(let i=1;i<scenes.length;i++){
  if(scenes[i].s < scenes[i-1].e) scenes[i].s = scenes[i-1].e;
}
sb.scenes=scenes;
fs.writeFileSync(__dirname+'/zhouwang_full_sb.json',JSON.stringify(sb));
fs.writeFileSync(__dirname+'/zhouwang_full_sb.js','window.SB='+JSON.stringify(sb)+';');
console.log('scenes adjusted:',scenes.length);
for(const sc of scenes) console.log(sc.s.toFixed(2),'-',sc.e.toFixed(2),sc.type);
