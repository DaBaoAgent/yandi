// ================= 001 波斯湾伊甸园 · 全片分镜（词级锚点+停顿吸附） =================
const fs = require('fs');
const path = require('path');
const TOTAL = 271.96;
const SIL = fs.readFileSync(path.join(__dirname, 'sil_full.txt'), 'utf8').split(/\r?\n/).map(Number).filter(x => x > 0);

// 32 段词级锚点：{s,e}（取自 transcript 长停顿），t 为口播稿原文（带标点，字幕以它为准）
const SEG = [
 [0.00,1.00,'一群出土的雕像'],
 [1.32,3.46,'穿着教皇一样的衣服，却套着鱼皮。'],
 [3.66,6.60,'四千年前的苏美尔人，管他们叫神。但你要问他们，'],
 [6.96,11.48,'神是怎么来的？他们会告诉你，是一位半人半鱼的怪物，从波斯湾里爬了出来，'],
 [11.72,13.78,'白天上岸教人盖庙、编法律、'],
 [14.06,14.48,'搞农业、'],
 [14.72,20.66,'算几何，晚上再游回深海。自打那以后，人类的知识，再也没超过这条鱼的传授。你品品，'],
 [20.90,27.64,'这大概是全世界最古老的都市传说。其实这桩悬案，后来还真有个正经名字，叫波斯湾绿洲假说。一百多年前，'],
 [27.94,31.74,'一位语言天才连推了三步，就把这事儿推成了一个大瓜。第一步，'],
 [31.92,36.74,'他琢磨着这鱼头神哪是什么怪物，分明是一群精通航海的高等文明，驾着船、'],
 [37.04,39.80,'带着成熟的文字和灌溉技术，从波斯湾北上，'],
 [40.02,42.12,'在苏美尔登陆。一群科技先进、'],
 [42.40,49.44,'从海里冒出来的人，对当地土著来说，不就是神吗？可第二步就说不通了，这群人的家在哪？考古界压根没挖到过'],
 [49.70,78.30,'比苏美尔更老的文明。除非，波斯湾以前根本不是海，是一片夹在沙漠里的巨大绿洲，他们一夜之间家园被海水吞没，才驾船逃上美索不达米亚。搁今天，这就是标准的我猜的，但我有证据。证据还真不少。语言学家发现，苏美尔语，跟世界上任何语言都没有亲缘关系，连他们主要城市的名字，都不是苏美尔语，是前人留下的定居点。更邪门的是，犁、农夫、播种，这些最核心的农业词汇，全是外来语。一个靠种地起家的民族，干农活的词竟然全是借来的，这说明啥？'],
 [78.70,111.06,'说明他们是后来搬来的。他们自己的神话里说，祖先来自一个叫迪尔蒙的天堂岛，考古破解，就是今天的巴林岛。二零二一年，科学家从现代人的基因里，硬算出一支幽灵人群：六万年前刚走出非洲，就跟大部队分道扬镳，独自藏了五万年，没留下过一具遗骸。拿尼安德特人的基因比例当探针一照，波斯湾沿岸，尼人血统几乎为零，八成就是他们隐居的地方，也就是史前那片绿洲。一九九四年航天飞机扫描显示，那地方当年有四条大河汇入，两条今天还在，两条早干了。四条大河，'],
 [111.38,112.02,'四面环山，'],
 [112.28,114.24,'这不就是伊甸园吗？但那么大一片绿洲，'],
 [114.54,117.06,'洪水是怎么把它整个灌没的？二零一零年，'],
 [117.38,124.72,'考古学家罗斯接了这案子，他的思路特别反常识：先告诉你，我们现在还活在冰河期里。地球四十五亿年历史，'],
 [125.10,129.34,'百分之九十的时间压根没有冰盖。冰盖就是地球的水银行，冰越厚，海平面越低。'],
 [129.60,145.72,'一万多年前的末次冰盛期，北美压着三公里厚的劳伦泰德冰盖，全球海平面比现在，低了整整一百二十米。而波斯湾平均水深，只有三十五米。说白了，过去两百万年的冰河期里，波斯湾的常态，就是一大块裸露的陆地，面积顶六七个台湾。'],
 [145.90,148.20,'底下是碳酸盐岩，四周全是高原，'],
 [148.50,153.98,'地下水被挤成无数泉眼往上冒，巴林这个词在阿拉伯语里，就是两头海的意思。淡水不缺、'],
 [154.32,158.20,'大河汇入，这地方过去真是片绿洲。后来，一万两千九百年前，'],
 [158.52,160.76,'新仙女木事件。北美大冰湖溃坝，'],
 [161.06,164.54,'巨量淡水冲进大西洋，把全球的暖气片温盐环流掐断，'],
 [164.82,166.42,'气温骤降。沙漠越来越干，'],
 [166.60,170.78,'四周族群为了活命，全往唯一还有水、有泉眼的波斯湾绿洲跑，'],
 [171.12,175.50,'四面八方的最强者，带着各部族的顶尖技术，凑到一块儿，像炼丹一样，'],
 [175.80,180.98,'把前文明炼了出来。然后八千二百年前，那个超级冰湖终于绷不住了。据估算，'],
 [181.22,190.30,'它的水量，至少是当年米苏拉湖的七十八倍，能把整个中国淹上十七米。海平面一波波往上跳，最终冲垮了霍尔木兹海峡那座基什山，海水倒灌，'],
 [190.54,271.70,'整片绿洲，一夜之间变成了波斯湾。你再看苏美尔人自己写的创世纪：众神早知道洪水要来，自己却被冲得狼狈，洪水退后还能跟人类生孩子。说白了，这众神不就是一群，科技比人类高一大截的前文明吗？他们算得出基什山要崩，算得出大限将至，但拦不住，于是开了个会，决定瞒着人类。只有智慧之神恩基泄了密，人类造了方舟逃过一劫。这段洪水故事，细节跟圣经几乎一模一样，却比圣经早了一千多年。洪水以后，幸存的人和神搭伙过日子，海平面又涨了几百年，家园一座接一座变成孤岛。直到六千五百年前，北美冰盖化完，他们只好穿着鱼头装，去两河流域教新居民种地、盖庙、写字。苏美尔文明就这么诞生的，一出生就满身黑科技。连那份邪门的苏美尔王表，都能用这个假说解释：洪水前的国王，动不动在位几万年，一过洪水这条线，就变回几十年、十几年的正常人类。考古学家说，那是文明被淹前的记忆。故事讲到这，还有个最挠人的点：苏美尔文明最终灭亡，科学家挖出来的原因是，一场持续三百年的超级干旱，源头又是温盐环流突然减弱。可这一次，北美冰盖早化完了，它凭什么减弱？没人说得清。地球这场感冒还没好。专家说，如果冰盖真按历史常态化完，海平面还得再涨七十米。搁今天，谁也不敢说我们现在站的地方，以后会不会也变成谁的伊甸园。我是艾伦，遛狗去了，白了个白。'],
];

// ---------- 字幕：段内按标点切短语，字数比例分配，停顿吸附 ----------
function clean(s){return s.replace(/[，。？！、：；""''（）()\s]/g,'');}
function splitPhrases(str){
  const parts=[];let buf='';
  for(const ch of str){
    if('，。？！、：；'.includes(ch)){if(buf)parts.push(buf);buf='';}
    else buf+=ch;
  }
  if(buf)parts.push(buf);
  return parts;
}
function makeSubs(){
  let si=0;
  const snap=function(){
    return function(est){
      while(si<SIL.length && SIL[si] < est-1.0) si++;
      if(si<SIL.length && SIL[si] <= est+1.0){const v=SIL[si];si++;return +(v+0.04).toFixed(2);}
      return +est.toFixed(2);
    };
  }();
  const out=[];
  for(const seg of SEG){
    const ph=splitPhrases(seg[2]);
    const lens=ph.map(p=>clean(p).length);
    const tot=lens.reduce((a,b)=>a+b,0)||1;
    const dur=seg[1]-seg[0];
    let cursor=seg[0];
    let acc=0;
    for(let i=0;i<ph.length;i++){
      acc+=lens[i];
      let s,e;
      if(i===0){s=seg[0];}
      else{s=+cursor.toFixed(2);}
      if(i===ph.length-1){e=seg[1];}
      else{e=seg[0]+dur*acc/tot;e=snap(e);e=Math.min(e,seg[1]-0.05);}
      if(e-s<0.3){ // 碎句并入下一条：暂不 push，延长
        if(out.length){/* 标记合并 */}
        out.push({s,e,merge:true,t:clean(ph[i])});
      }else{
        out.push({s,e,t:clean(ph[i])});
      }
      cursor=e;
    }
  }
  // 合并 merge 碎句到下一条（实际是并入上一条）
  const merged=[];
  for(let i=0;i<out.length;i++){
    const cur=out[i];
    if(cur.merge && merged.length){
      const prev=merged[merged.length-1];
      prev.t=prev.t+cur.t;prev.e=cur.e;
    }else merged.push(cur);
  }
  // 二次切分：>16 字的长句按字数均分子条（时间在条内均分）
  const fin=[];
  for(const x of merged){
    if(!x.t.length)continue;
    if(x.t.length<=16){fin.push([+x.s.toFixed(2),+x.e.toFixed(2),x.t]);continue;}
    const n=Math.ceil(x.t.length/16);
    for(let i=0;i<n;i++){
      const a=Math.floor(i*x.t.length/n),b=Math.floor((i+1)*x.t.length/n);
      const ns=x.s+(x.e-x.s)*a/x.t.length, ne=x.s+(x.e-x.s)*b/x.t.length;
      fin.push([+ns.toFixed(2),+ne.toFixed(2),x.t.slice(a,b)]);
    }
  }
  return fin;
}

// ---------- 场景表（钩子 7 镜沿用样片硬编码；其后词级锚点+停顿吸附） ----------
const S=[];
function add(s,e,type,extra){const sc=Object.assign({s:+s.toFixed(2),e:+e.toFixed(2),type},extra||{});S.push(sc);}
// 钩子（与样片定稿一致，仅 oannes 延长到 11.48）
add(0,1.17,'statues-hook');
add(1.17,2.66,'pope-robe');
add(2.66,3.60,'fish-skin');
add(3.60,4.93,'sumer-time');
add(4.93,6.76,'call-god');
add(6.76,8.62,'how-from');
add(8.62,11.48,'oannes-reveal');
// 8-73：est 为词级/估算绝对时间，snapCut 吸附
let si2=0;
function snapCut(est){
  while(si2<SIL.length && SIL[si2] < est-0.6) si2++;
  if(si2<SIL.length && SIL[si2] <= est+0.6){const v=SIL[si2];si2++;return +(v+0.04).toFixed(2);}
  return +est.toFixed(2);
}
function addC(est,type,extra){const s=S[S.length-1].e;let e=snapCut(est);if(e<=s+0.5)e=+(s+0.5).toFixed(2);add(s,e,type,extra);}

addC(14.72,'teach4');
addC(17.30,'nightsea');
addC(20.66,'knowledge');
addC(23.80,'urbanlegend');
addC(27.64,'hypo-name');
addC(31.92,'genius');
addC(36.74,'boat-civ');
addC(40.02,'tech-pack');
addC(42.40,'landing');
addC(45.50,'sea-gods');
addC(49.70,'step2');
addC(53.50,'no-older');
addC(58.00,'oasis-guess');
addC(63.00,'flood-flee');
addC(67.00,'guess-evidence');
addC(71.00,'language1');
addC(74.50,'city-names');
addC(78.70,'agri-words');
addC(82.00,'borrowed');
addC(87.00,'dilmun');
addC(93.00,'ghost');
addC(98.00,'ghost-hide');
addC(103.00,'neanderthal');
addC(107.00,'shuttle');
addC(111.06,'rivers');
addC(114.54,'eden');
addC(117.38,'flood-q');
addC(121.20,'ross');
addC(125.10,'ice-age');
addC(129.60,'ice-bank');
addC(133.50,'lgm');
addC(137.50,'sea120');
addC(142.00,'gulf35');
addC(145.90,'gulf-land');
addC(148.50,'geology');
addC(154.32,'springs');
addC(158.52,'oasis-was');
addC(161.06,'yd');
addC(164.82,'amoc-cut');
addC(166.60,'cold');
addC(171.12,'gather');
addC(175.80,'alchemy');
addC(178.50,'pre-civ');
addC(181.22,'burst8200');
addC(185.50,'flood78');
addC(188.00,'sea-jump');
addC(190.54,'kish-break');
// 段31 词级精确锚点
addC(192.76,'gulf-born');
addC(196.46,'genesis');
addC(199.34,'flood-gods');
addC(203.52,'preciv');
addC(207.14,'predicted');
addC(210.84,'enki');
addC(212.52,'ark');
addC(217.28,'bible');
addC(223.66,'after-flood');
addC(230.94,'hood6500');
addC(234.08,'black-tech');
addC(239.96,'kinglist');
addC(246.14,'memory');
addC(253.40,'drought300');
addC(258.60,'amoc-again');
addC(261.22,'unknown');
addC(265.36,'rise70');
addC(269.62,'your-eden');
add(269.62+0, 0,'_endcard-placeholder'); // 占位，下面移除
S.pop();
add(S[S.length-1].e, TOTAL, 'endcard');

// ---------- events（音效对轨，显式） ----------
const E=[];
function ev(t,k){E.push({t:+t.toFixed(2),k});}
const R3={t:[0.15,0.6,1.05],k:'pop'};
const T4={t:[0.15,0.9,1.6,2.3],k:'pop'};
const T3={t:[0.15,0.55,0.95],k:'pop'};
for(const sc of S){
  const T=sc.s,ty=sc.type;
  const wordLike=['knowledge','urbanlegend','hypo-name','sea-gods','borrowed','eden','ice-age','gulf-land','cold','pre-civ','drought300','flood-gods','preciv','guess-evidence','flood78'];
  const centerLike=['genius','boat-civ','landing','no-older','oasis-guess','language1','dilmun','ghost','neanderthal','rivers','ross','ice-bank','lgm','geology','springs','oasis-was','genesis','enki','ark','hood6500','black-tech','kinglist','flood-flee'];
  if(ty==='statues-hook'){ev(T+0.1,'whoosh');ev(T+0.6,'thud');}
  else if(ty==='pope-robe'){ev(T+0.15,'pop');ev(T+1.0,'pop');}
  else if(ty==='fish-skin'){ev(T+0.1,'thud');ev(T+0.5,'shimmer');}
  else if(ty==='sumer-time'){ev(T+0.2,'thud');ev(T+0.9,'pop');}
  else if(ty==='call-god'){ev(T+0.3,'pop');}
  else if(ty==='how-from'){ev(T+0.2,'whoosh');}
  else if(ty==='oannes-reveal'){ev(T+0.2,'shimmer');ev(T+1.4,'thud');}
  else if(ty==='teach4'){T4.t.forEach(x=>ev(T+x,'pop'));}
  else if(ty==='nightsea'){ev(T+0.2,'whoosh');ev(T+1.4,'shimmer');}
  else if(ty==='gather'){ev(T+0.1,'whoosh');[0.6,1.4,2.2].forEach(x=>ev(T+x,'pop'));}
  else if(ty==='alchemy'){ev(T+0.3,'shimmer');ev(T+2.4,'shimmer');}
  else if(ty==='amoc-cut'){ev(T+0.3,'thud');ev(T+2.0,'whoosh');}
  else if(ty==='amoc-again'){ev(T+0.4,'thud');ev(T+2.6,'whoosh');}
  else if(ty==='burst8200'){ev(T+0.15,'thud');ev(T+1.2,'whoosh');}
  else if(ty==='sea-jump'){ev(T+0.3,'thud');[1.2,2.0].forEach(x=>ev(T+x,'pop'));}
  else if(ty==='kish-break'){ev(T+0.2,'thud');ev(T+1.2,'whoosh');}
  else if(ty==='gulf-born'){ev(T+0.2,'thud');ev(T+1.2,'whoosh');}
  else if(ty==='shuttle'){ev(T+0.2,'whoosh');ev(T+1.6,'shimmer');}
  else if(ty==='sea120'){ev(T+0.3,'thud');ev(T+1.8,'pop');}
  else if(ty==='rise70'){ev(T+0.3,'thud');ev(T+2.0,'whoosh');}
  else if(ty==='endcard'){ev(T+0.1,'whoosh');ev(T+0.9,'thud');}
  else if(ty==='step2'||ty==='flood-q'||ty==='unknown'||ty==='your-eden'){ev(T+0.2,'whoosh');}
  else if(ty==='question'||ty==='tech-pack'||ty==='city-names'||ty==='agri-words'){
    (ty==='tech-pack'?T3.t:R3.t).forEach(x=>ev(T+x,'pop'));
  }
  else if(ty==='bible'||ty==='memory'){ev(T+0.1,'pop');ev(T+0.9,'pop');}
  else if(ty==='ghost-hide'){ev(T+0.2,'pop');ev(T+1.6,'pop');}
  else if(ty==='after-flood'){ev(T+0.3,'shimmer');ev(T+2.2,'whoosh');}
  else if(ty==='yd'){ev(T+0.2,'thud');}
  else if(centerLike.includes(ty)){ev(T+0.3,'pop');ev(T+1.2,'shimmer');}
  else if(wordLike.includes(ty)){ev(T+0.25,'thud');}
  else {ev(T+0.25,'thud');}
}
// 末镜收尾
ev(TOTAL-0.6,'whoosh');

// ---------- 自检 ----------
let bad=0;
for(let i=1;i<S.length;i++){
  if(S[i].s < S[i-1].e-0.02){console.log('OVERLAP',i,S[i-1].type,S[i-1].e,S[i].type,S[i].s);bad++;}
  if(i>=7 && S[i].e-S[i].s<1.2){console.log('SHORT',i,S[i].type,(S[i].e-S[i].s).toFixed(2));bad++;}
}
if(Math.abs(S[S.length-1].e-TOTAL)>0.05){console.log('TOTAL MISMATCH',S[S.length-1].e);bad++;}

const subs=makeSubs();
const out={total:TOTAL,scenes:S,subs,events:E.sort((a,b)=>a.t-b.t)};
fs.writeFileSync(path.join(__dirname,'posiwan_full_sb.json'),JSON.stringify(out,null,1));
fs.writeFileSync(path.join(__dirname,'posiwan_full_sb.js'),'window.SB='+JSON.stringify(out,null,1)+';');
console.log('scenes',S.length,'subs',subs.length,'events',E.length);
console.log('scene durations min/max:',
  Math.min(...S.slice(1).map(x=>x.e-x.s)).toFixed(2),
  Math.max(...S.map(x=>x.e-x.s)).toFixed(2));
console.log('subs first:',JSON.stringify(subs.slice(0,4)));
console.log('subs last:',JSON.stringify(subs.slice(-3)));
console.log(bad?('BAD='+bad):'SELF-CHECK OK');
