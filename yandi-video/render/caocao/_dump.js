// 打印曹操 whisper 词流（5秒一行的紧凑视图），对照口播稿人工校准
const fs=require('fs');
const w=JSON.parse(fs.readFileSync(__dirname+'/transcript_full.json','utf8'));
let line='',lt=0;
for(const x of w){
  const t=x.start;
  if(t-lt>=5 && line){ console.log(lt.toFixed(1).padStart(6)+'s | '+line); line=''; lt=t; }
  line+=x.text;
}
if(line) console.log(lt.toFixed(1).padStart(6)+'s | '+line);
console.log('\n== 全量词流（时间戳） ==');
for(const x of w) process.stdout.write(x.start.toFixed(2)+':'+x.text+' ');
console.log('');
