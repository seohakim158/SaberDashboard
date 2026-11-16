/* analysis.js: turns the raw data file (PLAYER, GAMES, OPP_RAW, RATING_HISTORY) into the numbers the charts use.
   Nothing in here depends on whose data it is. The data file is picked by loader.js. */

/* ---------- bout window ----------
   Every number is counted from ALL bouts. Only charts that list bouts one by one (SHOWN, below) are limited
   to the last BOUT_WINDOW bouts by date. */
const BOUT_WINDOW=10;

/* ---------- opponents ---------- */
const LETTERS='EDCBA';                                   /* rating letters, worst to best */
const ratingValue=r=>LETTERS.indexOf(r[0])*100+Number(r.slice(1));   /* newer year is better inside a letter */
const ratingOn=date=>{                                   /* my rating on the day of a bout */
  const day=date.replaceAll('/','-');
  return (RATING_HISTORY.find(([,from])=>day>=from)||RATING_HISTORY.at(-1))[0];};
const plural=(n,word)=>n+' '+word+(n>1?'s':'');
const TODAY=new Date().toISOString().slice(0,10);
const MY_BIRTH_YEAR=+PLAYER.born.slice(0,4);
const AGE_TXT=(()=>{const [y,m]=PLAYER.born.split('-').map(Number),n=new Date(),mo=(n.getFullYear()-y)*12+n.getMonth()+1-m;return Math.floor(mo/12)+'y '+(mo%12)+'m';})();
const RATING_NOW=ratingOn(TODAY),RATING_TXT=RATING_NOW[0]+'20'+RATING_NOW.slice(1);

/* optional bits of the data file */
const SWAPPED=typeof SWAPPED_SCORE_MARKS!=='undefined'?SWAPPED_SCORE_MARKS:{};
const NOTES=typeof DATA_NOTES!=='undefined'?DATA_NOTES:[];

/* who won each touch (true = me), following the actions; null = annulled phrase. Finals and results come from this. */
const outcomesOf=gi=>GAMES[gi].map((p,i)=>!p.w?null:(SWAPPED[gi]||[]).includes(i)?p.w!=='R':p.w==='R');
const FINALS=GAMES.map((_,gi)=>{let r=0,g=0;outcomesOf(gi).forEach(o=>{if(o===true)r++;else if(o===false)g++;});return [r,g];});
const BOUT_RESULTS=FINALS.map(f=>(f[0]>f[1]?'W ':'L ')+f[0]+'–'+f[1]);

const OPPONENTS=OPP_RAW.map((raw,i)=>{
  const o={game:i+1,...raw,result:BOUT_RESULTS[i]},mine=ratingOn(o.date);
  o.win=o.result[0]==='W';
  /* rating compared with mine on the day */
  const diff=ratingValue(o.rating)-ratingValue(mine);
  o.relation=diff>0?'Higher':diff<0?'Lower':'Same';
  o.arrow=diff>0?'↑':diff<0?'↓':'=';
  o.gap=LETTERS.indexOf(o.rating[0])-LETTERS.indexOf(mine[0]);          /* letter bands above (+) or below (-) me */
  /* age: + means older than me */
  o.ageDiff=MY_BIRTH_YEAR-o.born;
  o.ageTxt=o.ageDiff===0?'Same age':plural(Math.abs(o.ageDiff),'year')+(o.ageDiff>0?' older':' younger');
  o.handTxt=o.hand==='L'?'Left-handed':'Right-handed';
  o.heightTxt={taller:'Taller',shorter:'Shorter',similar:'Similar'}[o.height];
  return o;});

const SHOWN=[];   /* game indexes of the last BOUT_WINDOW bouts, oldest to newest (filled below) */
const HI=OPPONENTS.filter(o=>o.relation==='Higher'),HIW=HI.filter(o=>o.win).length;   /* higher-rated opponents */
const gamesWhere=test=>OPPONENTS.filter(test).map(o=>o.game-1);                      /* game indexes matching a test */
const CHRON=OPPONENTS.map(o=>o.game-1).sort((a,b)=>OPPONENTS[a].date.localeCompare(OPPONENTS[b].date)||a-b);   /* oldest to newest */
SHOWN.push(...CHRON.slice(-BOUT_WINDOW));

/* ---------- per-bout numbers, counted straight from the phrases ---------- */
const isAtt=t=>!!t&&/[afnesm]/i.test(t[0]);             /* t is an attack-type action */

/* Returns, for one bout:
     won / lost       touches won and lost
     alone / sim / they   [won, total] for exchanges I start alone, both start, they start
     par              [landed, total] parries
     pr               parry-ripostes conceded
     prep             touches conceded into preparation
     cl               [won, total] own attacks at 12+
     fin, margin      final score and final margin */
function boutMetrics(gi){
  let red=0,green=0;
  const m={won:0,lost:0,alone:[0,0],sim:[0,0],they:[0,0],par:[0,0],pr:0,prep:0,cl:[0,0],fin:[0,0]};
  GAMES[gi].forEach((p,i)=>{
    if(!p.w)return;                                      /* annulled phrase */
    const lead=Math.max(red,green);                      /* leading score before this touch */
    red=p.s[0];green=p.s[1];m.fin=[red,green];
    const swapped=(SWAPPED[gi]||[]).includes(i);
    const iWon=swapped?p.w!=='R':p.w==='R';
    iWon?m.won++:m.lost++;
    const a=isAtt(p.r[0]),b=isAtt(p.g[0]);
    const who=a&&b?'sim':a?'alone':b?'they':null;        /* who attacked in the first column */
    if(who){m[who][1]++;if(iWon)m[who][0]++;}
    p.r.forEach(t=>{if(t&&/^p/i.test(t)){m.par[1]++;if(t[0]==='P')m.par[0]++;}});
    if(!iWon){
      if(p.g.some(t=>t&&t[0]==='P'))m.pr++;
      const hits=p.g.filter(t=>t&&/^[AEFNCSM]/.test(t)),last=hits[hits.length-1];
      if(last&&last[0]==='E')m.prep++;
    }
    if(lead>=12&&a&&!b){m.cl[1]++;if(iWon)m.cl[0]++;}
  });
  m.margin=m.fin[0]-m.fin[1];
  return m;}
const BM=GAMES.map((_,i)=>boutMetrics(i));
const NB=BM.length;                                      /* number of bouts */

/* Adds up the numbers of several bouts (idx = game indexes) */
const agg=idx=>{
  const t={won:0,lost:0,alone:[0,0],sim:[0,0],they:[0,0],par:[0,0],pr:0,prep:0,cl:[0,0],n:idx.length};
  idx.forEach(i=>{const m=BM[i];t.won+=m.won;t.lost+=m.lost;t.pr+=m.pr;t.prep+=m.prep;
    ['alone','sim','they','par','cl'].forEach(k=>{t[k][0]+=m[k][0];t[k][1]+=m[k][1];});});
  return t;};
const rate=a=>a[1]?a[0]/a[1]:0;                          /* [won, total] to a share */


/* ================= touch level =================
   Every scored phrase becomes one touch record; every action in it becomes a token. */
const ARROWS='↖↑↗←●→↙↓↘';
const ATTL='afnesm';                                      /* attack-type letters, lower case */
const PHASES=['Early','Middle','Closing'];
const phaseOf=lead=>lead<8?'Early':lead<12?'Middle':'Closing';   /* by the leading score before the touch */
const ZONE_NAMES=['Top-left','Top','Top-right','Mid-left','Centre','Mid-right','Low-left','Low','Low-right'];
const CATS=['Simple attack','Pull short, hit','Attack in prep','Parry–riposte','Counterattack','Second attack','Compound','Flunge'];
const INIT=['Simple attack','Attack in prep','Compound','Flunge'];   /* scoring actions that count as own initiative */

function parseTok(t,col,side,touch){
  const parts=t.slice(1).trim().split(/\s+/).filter(Boolean);
  const arr=parts.filter(p=>ARROWS.includes(p)),num=parts.find(p=>/^-?\d$/.test(p));
  return {L:t[0],l:t[0].toLowerCase(),land:/[A-Z]/.test(t[0]),arr,zone:arr.length===1?ARROWS.indexOf(arr[0]):-1,
    pos:num===undefined?null:+num,col,side,t:touch,raw:t};}

/* the scoring action of the fencer who scored: their last landed attack, and what kind it was.
   A scoring action that follows a landed parry is a parry-riposte; one that follows a pull short is a pull short and hit;
   one with an earlier attack in the same row is a second attack; otherwise the letter decides.
   If the scorer has no landed action at all (the score disagrees with the case of the actions), the last attack
   (or a lone parry) is used, and the touch is flagged as a mismatch. */
function scoringOf(tokens){
  let k=-1,mismatch=false;tokens.forEach((x,j)=>{if(/[AEFNCSM]/.test(x.L))k=j;});
  if(k<0){
    tokens.forEach((x,j)=>{if(x.L==='P')k=j;});
    if(k<0){tokens.forEach((x,j)=>{if(ATTL.includes(x.l))k=j;});mismatch=k>=0;}
    if(k<0)return null;}
  const x=tokens[k],prev=tokens[k-1],earlier=tokens.slice(0,k).some(y=>ATTL.includes(y.l));
  const cat=x.L==='P'||(prev&&prev.L==='P')?'Parry–riposte':
    prev&&prev.l==='d'?(earlier?'Second attack':'Pull short, hit'):
    {E:'Attack in prep',F:'Flunge',N:'Compound',C:'Counterattack',S:'Second attack',M:'Second attack',
     e:'Attack in prep',f:'Flunge',n:'Compound',s:'Second attack',m:'Second attack'}[x.L]||
    (earlier?'Second attack':'Simple attack');
  return {x,cat,mismatch};}

const TOUCHES=[],RT=[],GT=[];                              /* touches, my tokens, their tokens */
GAMES.forEach((ph,gi)=>{
  let r=0,g=0,k=0;
  ph.forEach((p,i)=>{
    if(!p.w)return;
    const won=!(SWAPPED[gi]||[]).includes(i)?p.w==='R':p.w!=='R';
    const before=[r,g];won?r++:g++;
    const t={g:gi,i,n:k++,won,before,after:[r,g],lead:Math.max(r-(won?1:0),g-(won?0:1)),mBefore:before[0]-before[1]};
    t.phase=phaseOf(t.lead);
    const am=Math.max(r,g);t.sec=am<=3?0:am<=8?1:am<=12?2:3;     /* section I-IV by the leading score after the touch */
    t.rt=p.r.map((s,c)=>s?parseTok(s,c,'R',t):null).filter(Boolean);
    t.gt=p.g.map((s,c)=>s?parseTok(s,c,'G',t):null).filter(Boolean);
    const a=isAtt(p.r[0]),b=isAtt(p.g[0]);
    t.who=a&&b?'sim':a?'alone':b?'they':null;
    t.sc=scoringOf(won?t.rt:t.gt);
    t.cat=t.sc?t.sc.cat:null;t.zone=t.sc?t.sc.x.zone:-1;t.spos=t.sc?t.sc.x.pos:null;
    t.hasD=t.rt.some(x=>x.l==='d');t.mismatch=!!(t.sc&&t.sc.mismatch);
    TOUCHES.push(t);RT.push(...t.rt);GT.push(...t.gt);});});

/* per bout: score margin after every touch, and the moment a fencer first reached 8 */
const BOUTS=GAMES.map((_,gi)=>{
  const ts=TOUCHES.filter(t=>t.g===gi),b=ts.find(t=>Math.max(...t.after)>=8);
  return {series:[0,...ts.map(t=>t.after[0]-t.after[1])],
    brk:b?{t:b.n+1,margin:b.after[0]-b.after[1],ahead:b.after[0]>b.after[1]}:null};});

/* ================= shared metrics ================= */
const frac=(a,f)=>[a.filter(f).length,a.length];           /* [matching, total] */
const setOf=idx=>{const s=new Set(idx);return {T:TOUCHES.filter(t=>s.has(t.g)),R:RT.filter(x=>s.has(x.t.g)),G:GT.filter(x=>s.has(x.t.g))};};
const ALLIDX=GAMES.map((_,i)=>i);
const WIN_IDX=OPPONENTS.filter(o=>o.win).map(o=>o.game-1),LOSS_IDX=OPPONENTS.filter(o=>!o.win).map(o=>o.game-1);
const ALLS=setOf(ALLIDX);
const M={                                                  /* each takes a set from setOf and returns [won, total] */
  alone:s=>frac(s.T.filter(t=>t.who==='alone'),t=>t.won),
  sim:s=>frac(s.T.filter(t=>t.who==='sim'),t=>t.won),
  they:s=>frac(s.T.filter(t=>t.who==='they'),t=>t.won),
  cl:s=>frac(s.T.filter(t=>t.who==='alone'&&t.phase==='Closing'),t=>t.won),
  prep:s=>frac(s.R.filter(x=>x.l==='e'),x=>x.land),
  ps:s=>frac(s.R.filter(x=>x.l==='d'),x=>x.t.won),     /* each pull short, won when the touch was */
  par:s=>frac(s.R.filter(x=>x.l==='p'),x=>x.land),
  ctr:s=>frac(s.R.filter(x=>x.l==='c'),x=>x.land),
  init:s=>frac(s.T.filter(t=>t.won),t=>INIT.includes(t.cat))};

const NEXT=(()=>{const c=[0,0],s=[0,0];
  for(let i=0;i<TOUCHES.length-1;i++){const a=TOUCHES[i],b=TOUCHES[i+1];if(a.g!==b.g)continue;const x=a.won?s:c;x[1]++;if(b.won)x[0]++;}
  return {conceding:c,scoring:s};})();                     /* [next touch won, touches that had a next touch] */
const REACH8=(()=>{const ahead=ALLIDX.filter(i=>BOUTS[i].brk&&BOUTS[i].brk.ahead),behind=ALLIDX.filter(i=>BOUTS[i].brk&&!BOUTS[i].brk.ahead);
  const w=l=>[l.filter(i=>OPPONENTS[i].win).length,l.length];return {ahead:w(ahead),behind:w(behind)};})();
const TOTALS={won:ALLS.T.filter(t=>t.won).length,lost:ALLS.T.filter(t=>!t.won).length};
const zoneCount=(toks,test)=>{const z=Array.from({length:9},()=>[0,0]);toks.forEach(x=>{if(x.zone>=0){z[x.zone][1]++;if(test(x))z[x.zone][0]++;}});return z;};   /* [hits, total] per zone */
const HITS=(()=>{const c=Array(9).fill(0);ALLS.T.filter(t=>!t.won&&t.zone>=0).forEach(t=>c[t.zone]++);
  const n=c.reduce((a,b)=>a+b,0);return {c,n,top:n?c.indexOf(Math.max(...c)):-1};})();   /* where conceded touches landed */

/* ================= strengths and improvements ================= */
const STRONG=.7,WEAK=.4,MIN_TOUCH=10,MIN_BOUT=3;           /* 70%+ is a strength, under 40% an improvement */
const CAND=[
  {l:'Attack in preparation',chip:'Attack in prep',a:M.prep(ALLS),page:'Offence',tile:1},
  {l:'Simultaneous attacks won',chip:'Simultaneous won',a:M.sim(ALLS),page:'Offence',tile:1},
  {l:'Own attacks won at 12+',chip:'Attacks at 12+',a:M.cl(ALLS),page:'Offence',tile:1},
  {l:'Solo attacks won',chip:'Solo attacks won',a:M.alone(ALLS),page:'Offence'},
  {l:'Pull-short exchanges won',chip:'Pull-short won',a:M.ps(ALLS),page:'Defence',tile:1},
  {l:'Parry success',chip:'Parry success',a:M.par(ALLS),page:'Defence',tile:1},
  {l:'Counterattack success',chip:'Counterattack success',a:M.ctr(ALLS),page:'Defence'},
  {l:'Opponent-started exchanges won',chip:'Defending won',a:M.they(ALLS),page:'Defence'},
  {l:'Next touch after conceding',chip:'Next touch after conceding',a:NEXT.conceding},
  {l:'Next touch after scoring',chip:'Next touch after scoring',a:NEXT.scoring},
  {l:'Bouts won after reaching 8 first',chip:'Won after reaching 8 first',a:REACH8.ahead,bout:1},
  {l:'Bouts won when trailing at the break',chip:'Won when trailing at the break',a:REACH8.behind,bout:1}];
const toneOf=c=>{if(c.a[1]<(c.bout?MIN_BOUT:MIN_TOUCH))return '';const r=rate(c.a);return r>=STRONG?'strength':r<WEAK?'develop':'';};
CAND.forEach(c=>{c.tone=toneOf(c);});
const STRENGTHS=CAND.filter(c=>c.tone==='strength').sort((a,b)=>rate(b.a)-rate(a.a));
const IMPROVE=CAND.filter(c=>c.tone==='develop').sort((a,b)=>rate(a.a)-rate(b.a));

/* season targets (coaching benchmarks, not taken from the data) */
const TARGET={P1:.5,P2:.45,P3:2,P4:.8,P5:1};
