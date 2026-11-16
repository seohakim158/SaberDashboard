/* pages.js: what each tab shows. Edit titles, sizes and charts here.

   card(span, minBouts, tags, title, data, chart)
     span      width in a 12-column row (4 = a third, 6 = half, 12 = full)
     minBouts  bouts needed for a reliable read; the red warning shows when there are fewer
     tags      filter buttons the card belongs to
     title     card title
     data      the short "Data:" line under the chart
     chart     the SVG (see charts.js) */
const card=(span,minBouts,tags,title,data,chart)=>({span,minBouts,tags,title,data,chart});

/* helpers for the opponent cards */
const byHand=metric=>[agg(gamesWhere(o=>o.hand==='R')),agg(gamesWhere(o=>o.hand==='L'))].map(metric);
const GAP_GROUPS=[['Same band',o=>o.gap<=0],['+1 band',o=>o.gap===1],['+2 bands',o=>o.gap===2],['+3 bands',o=>o.gap>=3]];
const gapBars=key=>bars(GAP_GROUPS.map(([label,test])=>{
  const idx=gamesWhere(test),a=agg(idx);
  return {l:label+' ('+idx.length+')',v:rate(a[key]),c:'me',n:a[key][0]+' of '+a[key][1]};}));
const grid3=(counts,labels,top,o)=>heat3(counts.map((x,i)=>({a:x,v:labels[i],hi:i===top})),o);   /* 3x3 grid, one cell highlighted */

/* ---------- helpers for the numbers (everything below is counted from the data) ---------- */
const ofs=a=>a[0]+' of '+a[1];                                   /* [x, n] to "x of n" */
const pctN=v=>Math.round(v*100);
const POS=[-2,-1,0,1,2],POS_LABELS=['−2','−1','0','+1','+2'];
const isAttTok=x=>ATTL.includes(x.l);
const phRate=(touches,test)=>PHASES.map(p=>{const a=touches.filter(t=>t.phase===p);return a.length?pctN(a.filter(test).length/a.length):null;});
const phRateTok=(toks,test)=>PHASES.map(p=>{const a=toks.filter(x=>x.t.phase===p);return a.length?pctN(a.filter(test).length/a.length):null;});
const WIN_S=setOf(WIN_IDX),LOSS_S=setOf(LOSS_IDX);
const wl=(l,fn)=>({l,a:rate(fn(LOSS_S)),b:rate(fn(WIN_S))});         /* a = in lost bouts, b = in won bouts */

const tileOf=(c,k)=>({k:c.tone==='strength'?'Strength':c.tone==='develop'?'Improvement':k,v:pct(rate(c.a)),l:c.l,s:ofs(c.a),bar:rate(c.a),tone:c.tone});
const chipOf=(c,cls)=>`<span class="chip ${cls}"><b>${c.bout?ofs(c.a):pct(rate(c.a))}</b>${c.chip}${c.page?`<em>→ ${c.page}</em>`:''}</span>`;
const chipRow=(list,cls)=>list.length?list.map(c=>chipOf(c,cls)).join(''):'<span class="chip"><em>none at these thresholds</em></span>';

/* targets: current value, benchmark, and the line shown on the track */
const PRIP=ALLS.T.filter(t=>!t.won&&t.cat==='Parry–riposte').length;
const PREP_CONC=ALLS.T.filter(t=>!t.won&&t.cat==='Attack in prep').length;
const p3cur=PRIP/NB,p4cur=PREP_CONC/NB,one=v=>(+v.toFixed(1));
const TRACK={
  P1:{l:'P1 Own attacks at 12+',cur:pctN(rate(M.cl(ALLS))),tgt:TARGET.P1*100,lo:0,hi:100,txt:`${pctN(rate(M.cl(ALLS)))} → ${TARGET.P1*100}%+`},
  P2:{l:'P2 Parry success',cur:pctN(rate(M.par(ALLS))),tgt:TARGET.P2*100,lo:0,hi:100,txt:`${pctN(rate(M.par(ALLS)))} → ${TARGET.P2*100}%+`},
  P3:{l:'P3 Parry-ripostes/bout',cur:one(p3cur),tgt:TARGET.P3,lo:0,hi:Math.max(5,Math.ceil(p3cur)),txt:`${one(p3cur)} → under ${TARGET.P3}`},
  P4:{l:'P4 Conceded into prep',cur:one(p4cur),tgt:TARGET.P4,lo:0,hi:Math.max(2,Math.ceil(p4cur)),txt:`${one(p4cur)} → under ${TARGET.P4}`},
  P5:{l:'P5 Wins when trailing',cur:REACH8.behind[0],tgt:TARGET.P5,lo:0,hi:Math.max(3,REACH8.behind[1]),txt:`${REACH8.behind[0]} → ${TARGET.P5}`}};
const cfShare=pctN(rate(frac(ALLS.R.filter(isAttTok),x=>x.l==='n'||x.l==='f')));
const SUG_CF={l:'Compound+flunge share',cur:cfShare,tgt:Math.max(12,cfShare*2),lo:0,hi:Math.max(30,cfShare*3),txt:`${cfShare} → ${Math.max(12,cfShare*2)}%`,sug:1};
const hitShare=HITS.n?pctN(HITS.c[HITS.top]/HITS.n):0,hitName=HITS.n?ZONE_NAMES[HITS.top].toLowerCase():'';
const SUG_HIT={l:`Hits to ${hitName} share`,cur:hitShare,tgt:Math.min(25,hitShare),lo:0,hi:Math.max(50,Math.ceil(hitShare/10)*10),txt:`${hitShare} → ${Math.min(25,hitShare)}%`,sug:1};

/* tiles that appear on more than one page */
const R8=REACH8.ahead,R8tone=toneOf({a:R8,bout:1});
const SIT=[['Behind 2+',t=>t.mBefore<=-2],['Behind 1',t=>t.mBefore===-1],['Level',t=>t.mBefore===0],['Ahead 1',t=>t.mBefore===1],['Ahead 2+',t=>t.mBefore>=2],['Either at 14',t=>Math.max(...t.before)>=14]];
const sitBars=who=>bars(SIT.map(([l,f])=>{const a=frac(TOUCHES.filter(t=>t.who===who&&f(t)),t=>t.won);
  return {c:a[1]&&rate(a)<WEAK?'bad':'opp',l,v:rate(a),low:a[1]<20};}));

/* how an exchange I start (alone) ended, and how the opponent's attacks ended */
const outAlone=t=>t.won?0:t.gt.some(x=>x.L==='P')?1:t.gt.some(x=>x.l==='d')?2:(t.sc&&/[AEFNSM]/.test(t.sc.x.L))?3:4;
const theyCat=t=>t.won?(t.cat==='Parry–riposte'?0:t.cat==='Pull short, hit'?1:2):3;
const countBy=(touches,fn,n)=>{const v=Array(n).fill(0);touches.forEach(t=>v[fn(t)]++);return v;};
/* what the other side did in the same phrase: parry, pull short, counter, or nothing */
const respMatrix=attacker=>[['a'],['e'],['n'],['f']].map(([l])=>{
  const toks=(attacker==='R'?ALLS.R:ALLS.G).filter(x=>x.l===l),cs=[0,0,0,0];
  toks.forEach(x=>{const r=attacker==='R'?x.t.gt:x.t.rt;cs[r.some(y=>y.l==='p')?0:r.some(y=>y.l==='d')?1:r.some(y=>y.l==='c')?2:3]++;});
  return cs.map(c=>toks.length?c/toks.length:0);});
const TYPE_ROWS=['Simple','Prep','Compound','Flunge'];

/* 3x3 target grids: zs = [hits, total] per zone; shade = what sets the darkness (default: how often) */
const gridFrom=(zs,o={})=>{const sh=o.shade||zs.map(z=>z[1]),mx=Math.max(1,...sh),top=Math.max(...sh)>0?sh.indexOf(Math.max(...sh)):-1;
  return grid3(sh.map(v=>v/mx),zs.map(z=>z[1]?pct(z[0]/z[1]):'—'),top,o.tone?{tone:o.tone}:undefined);};
const zoneByPhase=(zonesOf)=>PHASES.map(p=>{const c=Array(9).fill(0);zonesOf(p).forEach(z=>c[z]++);const m=Math.max(1,...c);return c.map(v=>v/m);});
const stripOf=ev=>strip(POS.map(p=>{const e=ev.filter(x=>x.pos===p),k=e.filter(x=>x.ok).length;return {v:e.length?k/e.length:.5,n:`${k} of ${e.length}`,a:e.length,low:e.length<20};}));
const patternsOf=toks=>{const m=new Map();
  toks.forEach(x=>{const k=x.l+(x.arr.length?' '+x.arr.join(' '):'')+(x.pos!=null?' '+(x.pos<0?'−'+Math.abs(x.pos):x.pos):'');
    if(!m.has(k))m.set(k,[0,0]);const a=m.get(k);a[1]++;if(x.land)a[0]++;});
  return [...m].filter(([,a])=>a[1]>=5).sort((a,b)=>b[1][1]-a[1][1]).slice(0,6).map(([c,a])=>({c,v:rate(a),n:a[1]}));};
const TEMPOS=Math.max(6,...TOUCHES.filter(t=>t.sc).map(t=>t.sc.x.col+1));
const tempoOf=won=>{const c=Array(TEMPOS).fill(0);TOUCHES.filter(t=>t.sc&&t.won===won).forEach(t=>c[t.sc.x.col]++);return c;};
const scoredBy=(won,cat)=>TOUCHES.filter(t=>t.won===won&&t.cat===cat).length;

/* attack types for the toolbox cards */
const ATT_ROWS=[['Attack in prep','Prep',M.prep(ALLS),'r'],['Flunge','Flunge',frac(ALLS.R.filter(x=>x.l==='f'),x=>x.land),'t'],
  ['Compound','Compound',frac(ALLS.R.filter(x=>x.l==='n'),x=>x.land),'bs'],['Simultaneous','Simultaneous',M.sim(ALLS),'l'],['Attack alone','Alone',M.alone(ALLS),'t']];
const DEF_ROWS=[['Pull short won','Pull short',M.ps(ALLS),'l'],['Counterattack','Counter',M.ctr(ALLS),'r'],['Parry','Parry',M.par(ALLS),'l']];
const toneC=a=>rate(a)>=STRONG?'me':rate(a)<WEAK?'bad':'opp';
const useVsSuccess=(rows,o)=>{const tot=Math.max(1,rows.reduce((a,r)=>a+r[2][1],0));
  return bubble(rows.map(r=>({x:r[2][1]/tot,y:rate(r[2]),n:r[2][1],l:r[1],c:toneC(r[2]),pos:r[3]})),o);};
const toolBars=rows=>bars([...rows].sort((a,b)=>rate(b[2])-rate(a[2])).map(r=>({l:r[0],v:rate(r[2]),c:toneC(r[2]),n:ofs(r[2]),low:r[2][1]<20})));

const PAGES={

/* ===================== OVERVIEW ===================== */
overview:{code:'OV',name:'Overview',
lede:`The whole picture on one page, counted from all ${NB} bout${NB===1?'':'s'} (charts that list bouts one by one show the last ${BOUT_WINDOW}): what happened, how bouts unfold, how touches are won, what decides them, and what to fix. Each row narrows the view; the last rows hand off to Offence and Defence.`,
sections:[
 {name:'Summary',tiles:[
  {k:'Result',v:`${WIN_IDX.length}–${LOSS_IDX.length}`,l:`Bout record · dots: last ${BOUT_WINDOW}`,s:`${TOTALS.won>=TOTALS.lost?'+':'−'}${Math.abs(TOTALS.won-TOTALS.lost)} indicator · ${TOTALS.won} scored, ${TOTALS.lost} received`,dots:SHOWN.map(i=>OPPONENTS[i].win?'W':'L').join('')},
  {k:'Context',v:`${HIW}–${HI.length-HIW}`,l:'vs higher-rated opponents',s:`${HI.length} of ${NB} opponents were rated higher`,bar:HI.length?HIW/HI.length:0},
  {k:R8tone==='strength'?'Strength':R8tone==='develop'?'Improvement':'Timing',v:`${R8[1]} of ${NB}`,l:'Reached 8 first',s:`won ${R8[0]} of those ${R8[1]} bouts`,bar:R8[1]/NB,tone:R8tone},
  ...STRENGTHS.filter(c=>!c.bout).slice(0,3).map(c=>tileOf(c,'Strength')),
  ...IMPROVE.filter(c=>!c.bout).slice(0,2).map(c=>tileOf(c,'Improvement'))]},

 {name:'Results',cards:[
  card(7,10,['Results','Opponent'],`Last ${BOUT_WINDOW} bouts at a glance`,`Score margin after each touch, last ${BOUT_WINDOW} bouts`,sparkgrid()),
  card(5,10,['Results','Timing'],'Lead at the break vs final margin',`Margin at 8 × final margin, last ${BOUT_WINDOW} bouts`,scatter())]},

 {name:'How a bout flows',cards:[
  card(4,10,['Timing','Tactics'],'Success by bout phase','Phase × exchange type × outcome',
    slope([{n:'Own',v:phRate(TOUCHES.filter(t=>t.who==='alone'),t=>t.won),hi:1},{n:'Simult.',v:phRate(TOUCHES.filter(t=>t.who==='sim'),t=>t.won)},
      {n:'All',v:phRate(TOUCHES,t=>t.won)},{n:'Defend',v:phRate(TOUCHES.filter(t=>t.who==='they'),t=>t.won)}])),
  card(4,10,['Timing'],'Dominance by bout section',`Touches won ÷ touches fenced, sections I–IV; last ${BOUT_WINDOW} bouts by game, bottom row all bouts`,domHeat()),
  card(4,10,['Timing','Tactics'],'Reaction after each touch','Next touch after scoring or conceding',
    bars([{l:'After conceding',v:rate(NEXT.conceding),c:'me',n:ofs(NEXT.conceding)},{l:'After scoring',v:rate(NEXT.scoring),c:'opp',n:ofs(NEXT.scoring)}],
      {max:Math.max(.7,Math.ceil(Math.max(rate(NEXT.conceding),rate(NEXT.scoring))*10)/10),ref:.5}))]},

 {name:'How touches are won and lost',cards:[
  card(7,10,['Tactics'],'Scored vs conceded by scoring action','Scoring action × side',
    butterfly(CATS.map(c=>({l:c,a:scoredBy(false,c),b:scoredBy(true,c)})).sort((x,y)=>y.b-x.b))),
  card(5,10,['Timing','Tactics'],'Who starts the exchange, who wins it','First-tempo attacker × scorer',sankey())]},

 {name:'Where on the strip',cards:[
  card(7,10,['Tactics','Space'],'Win rate by piste position','Position of scoring action × winner',
    strip(POS.map(p=>{const ts=TOUCHES.filter(t=>t.spos===p),w=ts.filter(t=>t.won).length,l=ts.length-w;
      return {v:ts.length?w/ts.length:.5,n:ts.length<10?`${w} won · ${l} lost`:`${w} · ${l}`,a:ts.length,low:ts.length<20};}))),
  card(5,30,['Timing','Space'],'Net touches by phase and position','Phase × position × net touches',
    (()=>{const net=PHASES.map(p=>POS.map(q=>{const ts=TOUCHES.filter(t=>t.phase===p&&t.spos===q);return ts.filter(t=>t.won).length-ts.filter(t=>!t.won).length;}));
      const mx=Math.max(1,...net.flat().map(Math.abs));return matrix(PHASES,POS_LABELS,net.map(r=>r.map(v=>v/mx)),{div:1});})())]},

 {name:'What decides bouts',cards:[
  card(7,10,['Results'],'Wins vs losses: where the gap is','Metrics split by bout result',
    dumbbell([wl('Pull-short won',M.ps),wl('Own attacks won',M.alone),wl('Simultaneous won',M.sim),wl('Defending attacks',M.they)])),
  card(5,10,['Results'],'Strengths and improvements','70%+ strength, under 40% improvement',
    `<div class="badges"><h5>Strengths</h5><div class="chiprow">${chipRow(STRENGTHS,'s')}</div><h5>Improvements</h5><div class="chiprow">${chipRow(IMPROVE,'d')}</div></div>`)]},

 {name:'Targets',cards:[
  card(5,10,['Results'],'Five targets for next season','Current value × target',
    tracks([TRACK.P1,TRACK.P2,TRACK.P3,TRACK.P4,TRACK.P5])),
  card(7,10,['Results','Timing','Tactics','Opponent'],'Are the targets moving?',`Last ${BOUT_WINDOW} bouts in date order; running rates count all bouts before`,trends())]},

 {name:'Opponents',cards:[
  card(12,30,['Opponent'],'Win rate by opponent profile','Wins ÷ bouts per group',dots5()),
  card(4,20,['Results','Opponent'],'Rating gap vs final margin',`Letter bands above own rating × final margin, last ${BOUT_WINDOW} bouts`,ratingScatter()),
  card(4,20,['Results','Timing','Opponent'],`Last ${BOUT_WINDOW} results in date order`,'Final margin per bout, oldest to newest',formLine()),
  card(4,30,['Tactics','Opponent'],'Game by opponent type','Metrics by hand and height; bouts per group',oppMatrix())]},
]},

/* ===================== OFFENCE ===================== */
offence:{code:'OF',name:'Offence',
lede:`Everything I start, from all ${NB} bout${NB===1?'':'s'}. Same nine sections, in the same order, as the Defence tab, so flipping between the two compares like with like.`,
sections:[
 {name:'At a glance',tiles:[
  {k:'Initiative',v:pct(rate(M.init(ALLS))),l:'Touches from own initiative',s:ofs(M.init(ALLS)),bar:rate(M.init(ALLS))},
  {k:'Attack',v:pct(rate(M.alone(ALLS))),l:'Solo attacks won',s:ofs(M.alone(ALLS)),bar:rate(M.alone(ALLS))},
  ...CAND.filter(c=>c.page==='Offence'&&c.tile).map(c=>tileOf(c,'Attack'))]},

 {name:'Toolbox',cards:[
  card(6,10,['Tactics'],'Success rate by attack type','Action × landed or missed',toolBars(ATT_ROWS)),
  card(6,10,['Tactics'],'Use vs success','Share of attacks using each action × success rate',
    useVsSuccess(ATT_ROWS,{tl:'Use more',tr:'Core weapons',br:'Fix or drop'}))]},

 {name:'How attacks end',cards:[
  card(6,20,['Timing','Tactics'],'Attack outcomes by phase','Landed, parried, pulled short, lost priority, missed',
    stack100(PHASES.map(p=>({l:p,v:countBy(TOUCHES.filter(t=>t.who==='alone'&&t.phase===p),outAlone,5)})),
      ['Landed','Parried','Pulled short','Lost priority','Missed'],['f-me','f-bad','f-warn','f-opp','f-line'])),
  card(6,30,['Tactics'],'Opponent response by attack','Own action × opponent’s next action',
    matrix(TYPE_ROWS,['Parried','Pull short','Counter','Nothing'],respMatrix('R'),{tone:'bad'}))]},

 {name:'When',cards:[
  card(4,30,['Timing','Tactics'],'Success by phase and attack type','Action × phase',
    slope([['Simple','a'],['Prep','e'],['Compound','n']].map(([n,l],i)=>({n,v:phRateTok(ALLS.R.filter(x=>x.l===l),x=>x.land),hi:i===0?1:0})),{lo:20,hi:100})),
  card(4,20,['Timing','Tactics'],'Attack mix by phase','Share of each action per phase',
    stack100(PHASES.map(p=>{const a=ALLS.R.filter(x=>x.t.phase===p&&isAttTok(x)),n=l=>a.filter(x=>x.l===l).length;
      return {l:p,v:[n('a'),n('e'),n('n'),n('f'),n('s')+n('m')]};}),['Simple','Prep','Compound','Flunge','Other'],['f-opp','f-me','f-good','f-warn','f-line'])),
  card(4,30,['Results','Timing','Tactics'],'Success by score situation','Margin before the touch × outcome',sitBars('alone'))]},

 {name:'Where: target line',cards:[
  card(4,10,['Space'],'Success by target line','Target arrow × outcome',gridFrom(zoneCount(ALLS.R.filter(isAttTok),x=>x.land))),
  card(4,30,['Timing','Tactics','Space'],'Target line by phase','Target line × phase',
    heatMini(zoneByPhase(p=>ALLS.R.filter(x=>isAttTok(x)&&x.zone>=0&&x.t.phase===p).map(x=>x.zone)),PHASES)),
  card(4,30,['Tactics','Space'],'Parried lines','Opponent parries × target line',
    (()=>{const zs=zoneCount(ALLS.R.filter(isAttTok),x=>!x.land&&x.t.gt.some(y=>y.L==='P'));
      return gridFrom(zs,{shade:zs.map(z=>z[0]),tone:'bad'});})())]},

 {name:'Where: piste',cards:[
  card(6,10,['Tactics','Space'],'Success by piste position','Attack position × outcome',
    stripOf(ALLS.R.filter(x=>isAttTok(x)&&x.pos!=null).map(x=>({pos:x.pos,ok:x.land})))),
  card(6,30,['Tactics','Space'],'Attack type by launch position','Action × position',
    matrix(TYPE_ROWS,POS_LABELS,['a','e','n','f'].map(l=>{const ts=ALLS.R.filter(x=>x.l===l&&x.pos!=null);return POS.map(p=>ts.length?ts.filter(x=>x.pos===p).length/ts.length:0);})))]},

 {name:'Patterns',cards:[
  card(4,50,['Tactics','Space'],'Most-used phrase patterns','Patterns seen 5+ times',lollipop(patternsOf(ALLS.R.filter(isAttTok)))),
  card(4,20,['Timing','Tactics'],'Scoring action tempo','Tempo of the scoring action',
    hist(tempoOf(true),tempoOf(false),'Scored','Conceded')),
  card(4,20,['Tactics'],'Second attacks','Reprise and remise: scored vs conceded',
    (()=>{const a=scoredBy(true,'Second attack'),b=scoredBy(false,'Second attack');
      return bars([{l:'Scored',v:a,c:'me',t:''+a},{l:'Conceded',v:b,c:'opp',t:''+b}],{max:Math.max(12,a,b),rh:34});})())]},

 {name:'Wins, losses and next steps',cards:[
  card(7,10,['Results','Tactics'],'Wins vs losses: offence','Offence metrics by bout result',
    dumbbell([wl('Own attacks won',M.alone),wl('Simultaneous won',M.sim),wl('Attack in prep',M.prep),wl('Initiative share',M.init)])),
  card(5,10,['Results','Tactics'],'Offence targets','Priorities 1 and 4, plus one suggestion',
    tracks([{...TRACK.P1,l:'P1 Attacks at 12+'},TRACK.P4,SUG_CF]))]},

 {name:'By opponent type',cards:[
  card(6,30,['Tactics','Opponent'],'Attacks by opponent hand','Own and simultaneous attacks won, R vs L',
    dumbbell([{l:'Own attacks won',a:rate(byHand(a=>a.alone)[0]),b:rate(byHand(a=>a.alone)[1])},{l:'Simultaneous won',a:rate(byHand(a=>a.sim)[0]),b:rate(byHand(a=>a.sim)[1])}],{lo:0,hi:1,la:'Right-handers',lb:'Left-handers'})),
  card(6,30,['Tactics','Opponent'],'Own attacks by opponent rating','Own attacks won by rating gap; bouts in brackets',gapBars('alone'))]},
]},

/* ===================== DEFENCE ===================== */
defence:{code:'DF',name:'Defence',
lede:`Everything that happens when the opponent starts it, from all ${NB} bout${NB===1?'':'s'}. Same nine sections as Offence: toolbox, how exchanges end, when, where, patterns, wins vs losses and targets, then how it changes against different opponents.`,
sections:[
 {name:'At a glance',tiles:[
  {k:'Defence',v:pct(rate(M.they(ALLS))),l:'Opponent-started exchanges won',s:ofs(M.they(ALLS)),bar:rate(M.they(ALLS))},
  ...CAND.filter(c=>c.page==='Defence'&&c.tile).map(c=>tileOf(c,'Defence')),
  (()=>{const share=TOTALS.lost?PRIP/TOTALS.lost:0,tone=share>=.2?'develop':'';
    return {k:tone?'Improvement':'Defence',v:''+PRIP,l:'Parry-ripostes conceded',s:`${pctN(share)}% of touches conceded`,tone};})(),
  ...(HITS.n?[(()=>{const share=HITS.c[HITS.top]/HITS.n,tone=share>=1/3?'develop':'';
    return {k:tone?'Improvement':'Defence',v:pct(share),l:`Hits that land ${hitName}`,s:ofs([HITS.c[HITS.top],HITS.n]),bar:share,tone};})()]:[])]},

 {name:'Toolbox',cards:[
  card(6,10,['Tactics'],'Success rate by defensive action','Action × exchange result',toolBars(DEF_ROWS)),
  card(6,10,['Tactics'],'Use vs success','Share of defensive actions using each answer × success rate',
    useVsSuccess(DEF_ROWS,{tl:'Use more',tr:'Core answers',br:'Over-used, weak'}))]},

 {name:'How opponent attacks end',cards:[
  card(6,20,['Timing','Tactics'],'Opponent attack outcomes by phase','Parry, distance, counter, conceded',
    stack100(PHASES.map(p=>({l:p,v:countBy(TOUCHES.filter(t=>t.who==='they'&&t.phase===p),theyCat,4)})),
      ['Won by parry','Won by distance','Won by counter','Conceded'],['f-me','f-good','f-warn','f-bad'])),
  card(6,30,['Tactics'],'Response to each opponent attack','Opponent action × response',
    matrix(TYPE_ROWS,['I parry','Pull short','I counter','I am hit'],respMatrix('G'),{tone:'bad'}))]},

 {name:'When',cards:[
  card(4,30,['Timing','Tactics'],'Success by phase and defensive action','Action × phase',
    slope([{n:'Parry',v:phRateTok(ALLS.R.filter(x=>x.l==='p'),x=>x.land),hi:1},{n:'Pull short',v:phRateTok(ALLS.R.filter(x=>x.l==='d'),x=>x.t.won)},
      {n:'Counter',v:phRateTok(ALLS.R.filter(x=>x.l==='c'),x=>x.land)}],{lo:20,hi:100})),
  card(4,20,['Timing','Tactics'],'Conceded actions by phase','Scoring action of conceded touches per phase',
    stack100(PHASES.map(p=>({l:p,v:countBy(TOUCHES.filter(t=>!t.won&&t.phase===p),
      t=>({'Simple attack':0,'Parry–riposte':1,'Attack in prep':2,'Compound':3})[t.cat]??4,5)})),
      ['Simple','Parry-riposte','Prep','Compound','Other'],['f-opp','f-bad','f-me','f-warn','f-line'])),
  card(4,30,['Results','Timing'],'Defence by score situation','Margin before the touch × outcome',sitBars('they'))]},

 {name:'Where: target line',cards:[
  card(4,10,['Space'],'Where hits land','Target arrow of conceded touches',
    grid3(HITS.c.map(v=>v/Math.max(1,...HITS.c)),HITS.c.map(v=>HITS.n?pct(v/HITS.n):'—'),HITS.top,{tone:'bad'})),
  card(4,30,['Timing','Space'],'Hits conceded by phase','Target line × phase',
    heatMini(zoneByPhase(p=>TOUCHES.filter(t=>!t.won&&t.zone>=0&&t.phase===p).map(t=>t.zone)),PHASES,'bad')),
  card(4,30,['Tactics','Space'],'Parry success by attack line','Parries × line attacked',
    gridFrom(zoneCount(ALLS.R.filter(x=>x.l==='p'),x=>x.land)))]},

 {name:'Where: piste',cards:[
  card(6,10,['Tactics','Space'],'Defensive success by piste position','Defensive action position × outcome',
    stripOf([...ALLS.R.filter(x=>x.l==='p'&&x.pos!=null).map(x=>({pos:x.pos,ok:x.land})),
      ...ALLS.R.filter(x=>x.l==='d'&&x.pos!=null).map(x=>({pos:x.pos,ok:x.t.won})),
      ...ALLS.R.filter(x=>x.l==='c'&&x.pos!=null).map(x=>({pos:x.pos,ok:x.land}))])),
  card(6,30,['Tactics','Space'],'Pull-short destinations','Start position → retreat position',arcs())]},

 {name:'Patterns',cards:[
  card(4,50,['Tactics','Space'],'Phrases conceded most','Patterns seen 5+ times',lollipop(patternsOf(ALLS.G.filter(isAttTok)))),
  card(4,20,['Timing','Tactics'],'Conceded action tempo','Tempo of the opponent’s scoring action',
    hist(tempoOf(false),tempoOf(true),'Conceded','Scored')),
  card(4,10,['Tactics'],'Parry to riposte','Parry attempts → landed → riposte scored',funnel())]},

 {name:'Wins, losses and next steps',cards:[
  card(7,10,['Results'],'Wins vs losses: defence','Defence metrics by bout result',
    dumbbell([wl('Pull-short won',M.ps),wl('Defending attacks',M.they),wl('Parry success',M.par)])),
  card(5,10,['Results'],'Defence targets','Priorities 2 and 3, plus one suggestion',
    tracks([TRACK.P2,TRACK.P3,SUG_HIT]))]},

 {name:'By opponent type',cards:[
  card(6,30,['Tactics','Opponent'],'Defence by opponent hand','Exchanges won and parry success, R vs L',
    dumbbell([{l:'Defending won',a:rate(byHand(a=>a.they)[0]),b:rate(byHand(a=>a.they)[1])},{l:'Parry success',a:rate(byHand(a=>a.par)[0]),b:rate(byHand(a=>a.par)[1])}],{lo:0,hi:1,la:'Right-handers',lb:'Left-handers'})),
  card(6,30,['Tactics','Opponent'],'Defence by opponent rating','Exchanges won by rating gap; bouts in brackets',gapBars('they'))]},
]}
};
const TABS=['overview','offence','defence'];   /* the tabs built from PAGES */
