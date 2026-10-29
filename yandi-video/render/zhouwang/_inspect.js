const fs=require('fs');
const w=JSON.parse(fs.readFileSync(__dirname+'/transcript_full.json','utf8'));
console.log('total words:',w.length,'dur:',w[w.length-1].end);
for(let i=0;i<30;i++) console.log(i, w[i].start.toFixed(2), w[i].end.toFixed(2), w[i].text);
