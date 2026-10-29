// 把对齐后的subs写回sb，scenes/events不变
const fs=require('fs');
const sb=JSON.parse(fs.readFileSync(__dirname+'/zhouwang_full_sb.json','utf8'));
const subs=JSON.parse(fs.readFileSync(__dirname+'/subs_aligned.json','utf8'));
sb.subs=subs;
fs.writeFileSync(__dirname+'/zhouwang_full_sb.json',JSON.stringify(sb));
fs.writeFileSync(__dirname+'/zhouwang_full_sb.js','window.SB='+JSON.stringify(sb)+';');
console.log('sb updated: subs',subs.length,'scenes',sb.scenes.length,'events',sb.events.length);
