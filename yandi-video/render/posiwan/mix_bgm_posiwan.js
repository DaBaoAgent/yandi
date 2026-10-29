// 001 BGM 七步混音：测人声I → 算系数 → 混BGM → loudnorm两遍 → 封装
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const DIR = __dirname;
const FF = 'D:/@kaifa/yandi/vendor/gpt-sovits/runtime/ffmpeg.exe';
const NAR = path.join(DIR, 'full_mix_posiwan.wav');           // 配音+音效（主体）
const BGM = 'D:/@kaifa/@/BGM/阿拉伯/阿拉伯 Desert_Caravan.mp3';
const MIX_WAV = path.join(DIR, 'mix_with_bgm_posiwan.wav');  // 人声+BGM未归一
const FINAL_WAV = path.join(DIR, 'final_mix_posiwan.wav');  // 归一后
function run(args){
  console.log('> ffmpeg', args.slice(0,6).join(' '), '...');
  const r = spawnSync(FF, args, { cwd: DIR, encoding: 'utf8', maxBuffer: 1<<28 });
  const out = (r.stdout||'')+(r.stderr||'');
  if(r.status!==0){ console.error(out.split('\n').slice(-20).join('\n')); process.exit(1); }
  return out;
}
function ebur(p){
  const out = run(['-hide_banner','-nostats','-i',p,'-af','ebur128=peak=true','-f','null','-']);
  const I = (out.match(/I:\s*(-?[\d.]+)\s*LUFS/)||out.match(/Integrated.*?(-?[\d.]+)\s*LUFS/));
  // ebur128 末尾打印
  const tab = out.split('\n').filter(l=>/I:|Peak:|Threshold:/i.test(l));
  const m = out.match(/I:\s*(-?[\d.]+)/);
  return { I: m?parseFloat(m[1]):null, raw: tab.slice(-6) };
}
const mode = process.argv[2] || 'all';

// 1) 测人声 I
const m = ebur(NAR);
console.log('人声响度:', m.I, 'LUFS');
if(!m.I){ console.log('末行输出:'); console.log(m.raw.join('\n')); process.exit(1); }
const coeff = Math.pow(10, (-m.I - 19 + 16.1)/20);
console.log('BGM 系数:', coeff.toFixed(4), '(公式 10^((I-19+16.1)/20))');

// 2) BGM 轨：循环+高通+音量+淡入淡出
// 3) 混：人声先 aformat stereo 再 amix
run(['-y','-i',NAR,'-stream_loop','-1','-i',BGM,
  '-filter_complex',
  '[1:a]highpass=f=38,volume='+coeff.toFixed(5)+',afade=t=in:st=0:d=3,afade=t=out:st=265:d=7[bg]',
  '[0:a]aformat=channel_layouts=stereo[voc];',
  '[voc][bg]amix=inputs=2:duration=first:normalize=0[mix]',
  '-map','[mix]','-t','272.16','-ac','2','-ar','44100',MIX_WAV]);
console.log('已混 BGM →', MIX_WAV);

// 4) loudnorm 两遍（第一遍测，第二遍应用）
const l1 = run(['-hide_banner','-nostats','-i',MIX_WAV,'-af','loudnorm=I=-16:TP=-1.5:print_format=json','-f','null','-']);
const j = l1.lastIndexOf('{');
const params = JSON.parse(l1.slice(j, l1.lastIndexOf('}')+1));
console.log('loudnorm 一轮:', params);
run(['-y','-i',MIX_WAV,'-af',
  'loudnorm=I=-16:TP=-1.5:measured_I='+params.input_i+':measured_TP='+params.input_tp+':measured_LRA='+params.input_lra+':measured_thresh='+params.input_thresh+':offset='+params.target_offset+':linear=true:print_format=summary',
  '-ar','44100','-ac','2',FINAL_WAV]);
console.log('已归一 →', FINAL_WAV);

// 5) 复测
const f = ebur(FINAL_WAV);
console.log('成片响度复测:', f.I, 'LUFS');
console.log(f.raw.join('\n'));
