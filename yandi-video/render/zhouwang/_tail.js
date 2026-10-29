// 打印60-180秒whisper词流，对照口播稿手动校准
const fs=require('fs');
const w=JSON.parse(fs.readFileSync(__dirname+'/transcript_full.json','utf8'));
for(const x of w){
  if(x.start>=55 && x.start<=180){
    process.stdout.write(x.start.toFixed(2)+':'+x.text+' ');
  }
}
console.log('');
