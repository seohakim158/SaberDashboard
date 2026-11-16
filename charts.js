/* charts.js: small SVG chart builders. Each function returns an SVG string.
   W is the width of the drawing area; the browser scales it to the card. */

const W=240;
/* ---------- drawing helpers: each returns an SVG string ---------- */
const T=(x,y,s,c='t',a='start',st='')=>`<text x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}" class="${c}" text-anchor="${a}" ${st}>${s}</text>`;
const R=(x,y,w,h,c,st='',rx=1.5)=>`<rect x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}" width="${Math.max(w,0).toFixed(1)}" height="${(+h).toFixed(1)}" rx="${rx}" class="${c}" ${st}/>`;
const Ln=(x1,y1,x2,y2,c='s-line',st='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${c}" ${st}/>`;
const C=(x,y,r,c,st='')=>`<circle cx="${(+x).toFixed(1)}" cy="${(+y).toFixed(1)}" r="${r}" class="${c}" ${st}/>`;
const SV=(h,inner,label,w=W)=>`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">${inner}</svg>`;
const hatch=(x,y,w,h)=>R(x,y,w,h,'hatch');
const pct=v=>Math.round(v*100)+'%';
const op=a=>`style="fill-opacity:${a.toFixed(2)}"`;

function bars(items,o={}){
  const rh=o.rh||15,bh=rh-5,ty=bh/2+3.5,H=items.length*rh+6,lx=74,mx=W-lx-66,max=o.max||1;let s='';
  items.forEach((d,i)=>{const y=3+i*rh,w=d.v/max*mx;
    s+=T(lx-5,y+ty,d.l,'t','end')+R(lx,y,w,bh,'f-'+(d.c||'me'))+(d.low?hatch(lx,y,w,bh):'');
    s+=`<text x="${(lx+w+4).toFixed(1)}" y="${y+ty}" class="tb">${d.t||pct(d.v)}${d.n?`<tspan class="t" dx="3">${d.n}</tspan>`:''}</text>`;});
  if(o.ref!=null){const x=lx+o.ref/max*mx;s+=Ln(x,1,x,H-2,'s-mut','stroke-dasharray="2 2"')+T(x,H+7,'even','tt','middle');return SV(H+8,s,o.label||'bars');}
  return SV(H,s,o.label||'bars');
}
function butterfly(rows){
  const rh=13,H=rows.length*rh+18,cx=150,sc=.9;
  let s=T(cx-4,8,'CONCEDED','tt','end')+T(cx+4,8,'SCORED','tt')+T(W-2,8,'NET','tt','end')+Ln(cx,10,cx,H-2,'s-mut');
  rows.forEach((r,i)=>{const y=14+i*rh,wa=r.a*sc,wb=r.b*sc,net=r.b-r.a;
    s+=T(2,y+8,r.l,'t')+R(cx-wa,y,wa,9,'f-opp')+T(cx-wa-3,y+8,r.a,'t','end')+R(cx,y,wb,9,'f-me')+T(cx+wb+3,y+8,r.b,'tb')
      +T(W-2,y+8.2,(net>0?'+':net<0?'−':'')+Math.abs(net),'tn '+(net>0?'good':net<0?'bad':''),'end');});
  return SV(H,s,'butterfly');
}
const ZN=['Top-left','Top','Top-right','Mid-left','Centre','Mid-right','Low-left','Low','Low-right'];
function heat3(vals,o={}){
  const cw=50,ch=30,g=3,x0=(W-3*cw-2*g)/2,tone=o.tone||'me';let s='';
  vals.forEach((d,i)=>{const x=x0+(i%3)*(cw+g),y=4+Math.floor(i/3)*(ch+g);
    s+=R(x,y,cw,ch,'f-'+tone,op(.1+.6*d.a))+(d.hi?R(x,y,cw,ch,'s-fg','stroke-width="1.4" fill="none"'):'')
     +T(x+cw/2,y+14,d.v,'tw','middle')+T(x+cw/2,y+24,ZN[i],'tt','middle');});
  return SV(3*ch+2*g+8,s,'3 by 3 grid');
}
function heatMini(grids,labels,tone='me'){
  const cw=18,ch=13,g=1.5,gw=3*cw+2*g,gap=(W-3*gw)/4;let s='';
  grids.forEach((gr,k)=>{const x0=gap+k*(gw+gap);
    gr.forEach((a,i)=>{s+=R(x0+(i%3)*(cw+g),4+Math.floor(i/3)*(ch+g),cw,ch,'f-'+tone,op(.08+.8*a));});
    s+=T(x0+gw/2,4+3*(ch+g)+9,labels[k],'t','middle');});
  return SV(4+3*(ch+g)+14,s,'three 3 by 3 grids');
}
function strip(items,o={}){
  const cw=43,g=2,x0=(W-5*cw-4*g)/2,top=4,vb=26,cy=top+vb+3,ch=34;let s='';
  const mx=Math.max(1,...items.map(d=>d.a));
  items.forEach((d,i)=>{const x=x0+i*(cw+g),bh=Math.max(2,d.a/mx*vb);
    s+=R(x+10,top+vb-bh,cw-20,bh,'f-opp')+(d.low?hatch(x+10,top+vb-bh,cw-20,bh):'');
    if(!d.a)s+=R(x,cy,cw,ch,'f-s2')+T(x+cw/2,cy+17,'—','tw','middle')+T(x+cw/2,cy+28,'none','tt','middle');
    else{const dev=Math.min(1,Math.abs(d.v-.5)/.2),tone=d.v>=.5?'good':'bad';
      s+=R(x,cy,cw,ch,'f-'+tone,op(.12+.5*dev))+(d.low?hatch(x,cy,cw,ch):'')
       +T(x+cw/2,cy+17,pct(d.v),'tw','middle')+T(x+cw/2,cy+28,d.n,'tt','middle');}
    s+=T(x+cw/2,cy+ch+10,(i-2>0?'+':i-2<0?'−':'')+Math.abs(i-2),'t','middle');});
  s+=T(x0,cy+ch+22,'← own end','tt')+T(W/2,cy+ch+22,'centre line','tt','middle')+T(W-x0,cy+ch+22,'opponent’s end →','tt','end');
  return SV(cy+ch+26,s,'piste strip');
}
function slope(lines,o={}){
  const all=lines.flatMap(l=>l.v.filter(v=>v!=null));if(!all.length)all.push(50);
  const lo=Math.min(o.lo??20,Math.floor(Math.min(...all)/10)*10),hi=Math.max(o.hi??70,Math.ceil(Math.max(...all)/10)*10);
  const top=22,bot=92,xs=[30,96,162],Y=v=>bot-(v-lo)/(hi-lo)*(bot-top);let s='';
  s+=Ln(xs[0]-14,Y(50),xs[2]+14,Y(50),'s-line','stroke-dasharray="2 2"')+T(xs[0]-16,Y(50)-2,'even','tt','end');
  ['Early','Middle','Closing'].forEach((n,i)=>{s+=T(xs[i],106,n,'t','middle');});
  const ends=[];
  [...lines].sort((a,b)=>(a.hi?1:0)-(b.hi?1:0)).forEach(l=>{
    const pts=l.v.map((v,i)=>v==null?null:`${xs[i]},${Y(v).toFixed(1)}`).filter(Boolean);
    if(!pts.length)return;
    s+=`<polyline points="${pts.join(' ')}" class="${l.hi?'s-me':'s-opp'}" stroke-width="${l.hi?2:1.2}"/>`;
    let last=-1;
    l.v.forEach((v,i)=>{if(v==null)return;last=i;s+=C(xs[i],Y(v),l.hi?3:2,l.hi?'f-me':'f-opp');if(l.hi&&i<2)s+=T(xs[i],Y(v)-6,v+'%','tb','middle');});
    ends.push({y:Y(l.v[last]),t:`${l.n} ${l.v[last]}%`,hi:l.hi,x:xs[last]+8});});
  ends.sort((a,b)=>a.y-b.y);for(let i=1;i<ends.length;i++)if(ends[i].y-ends[i-1].y<9)ends[i].y=ends[i-1].y+9;
  ends.forEach(e=>{s+=T(e.x,e.y+3,e.t,e.hi?'tb':'t');});
  return SV(112,s,'slope chart');
}
function dumbbell(rows,o={}){
  const vals=rows.flatMap(r=>[r.a,r.b]);
  const lo=o.lo??Math.min(.3,Math.floor(Math.min(...vals)*10)/10),hi=o.hi??Math.max(1.1,Math.ceil(Math.max(...vals)*10)/10+.1),x0=84,x1=190,X=v=>x0+(v-lo)/(hi-lo)*(x1-x0),rh=22;let s='';
  rows.forEach((r,i)=>{const y=12+i*rh;
    s+=T(2,y+3,r.l,'t')+Ln(x0,y,x1,y,'s-line','stroke-dasharray="1.5 2.5"');
    if(r.a===r.b){s+=C(X(r.a),y,4,'f-me')+C(X(r.a),y,4,'f-opp','fill-opacity=".55"')+T(X(r.a)+8,y+3,pct(r.a),'tb')+T(W-2,y+3,'no gap','t','end');}
    else{const aLow=r.a<r.b,xl=X(Math.min(r.a,r.b)),xr=X(Math.max(r.a,r.b));
      s+=Ln(xl,y,xr,y,'s-mut','stroke-width="1.4"')+C(X(r.a),y,4,'f-opp')+C(X(r.b),y,4,'f-me')
      +T(xl-8,y+3,pct(aLow?r.a:r.b),aLow?'t':'tb','end')+T(xr+8,y+3,pct(aLow?r.b:r.a),aLow?'tb':'t')+T(W-2,y+3,(r.b>r.a?'+':'')+Math.round((r.b-r.a)*100)+' pts','tn','end');}});
  const H=12+rows.length*rh;
  const lb=o.lb||'Wins',la=o.la||'Losses';s+=C(x0,H,3,'f-me')+T(x0+6,H+3,lb,'t')+C(x0+Math.max(42,lb.length*4.6+12),H,3,'f-opp')+T(x0+Math.max(42,lb.length*4.6+12)+6,H+3,la,'t');
  return SV(H+10,s,'dumbbell');
}
function sparkgrid(){
  const cw=44,gap=4,x0=2,rh=66,ch=42,rows=Math.ceil(SHOWN.length/5);let s='';
  SHOWN.forEach((i,k)=>{const b=BOUTS[i],m=b.series,col=k%5,row=Math.floor(k/5),x=x0+col*(cw+gap),y=2+row*rh,win=OPPONENTS[i].win;
    s+=R(x,y,cw,ch,'f-s','stroke="var(--line)" stroke-width=".8"',3);
    const n=Math.max(1,m.length-1),mid=y+ch/2,px=t=>x+3+t/n*(cw-6),py=v=>mid-Math.max(-7,Math.min(7,v))*(ch/2-4)/7;
    s+=Ln(x+3,mid,x+cw-3,mid,'s-line','stroke-dasharray="1.5 1.5" stroke-width=".7"');
    s+=`<polyline points="${m.map((v,t)=>px(t).toFixed(1)+','+py(v).toFixed(1)).join(' ')}" class="${win?'s-me':'s-opp'}" stroke-width="1.3" stroke-linejoin="round"/>`;
    if(b.brk)s+=C(px(b.brk.t),py(m[b.brk.t]),2.3,win?'f-me':'f-opp','stroke="var(--surface)" stroke-width=".8"');
    s+=T(x+cw/2,y+ch+9,`${i+1} · ${OPPONENTS[i].result}`,'tt','middle')+T(x+cw/2,y+ch+17,`${OPPONENTS[i].hand} · ${OPPONENTS[i].rating} ${OPPONENTS[i].arrow}`,'tt','middle');});
  return SV(rows*rh+4,s,SHOWN.length+' small line charts, one per bout');
}
function scatter(){
  const P=SHOWN.map(i=>{const b=BOUTS[i];return b.brk?{i,x:b.brk.margin,y:FINALS[i][0]-FINALS[i][1],w:OPPONENTS[i].win}:null;}).filter(Boolean);
  const xlo=Math.min(-5,...P.map(p=>p.x-1)),xhi=Math.max(7,...P.map(p=>p.x+1)),ylo=Math.min(-6,...P.map(p=>p.y-1)),yhi=Math.max(8,...P.map(p=>p.y+1));
  const x0=22,x1=230,y0=6,y1=100,X=v=>x0+(v-xlo)/(xhi-xlo)*(x1-x0),Y=v=>y1-(v-ylo)/(yhi-ylo)*(y1-y0);let s='';
  s+=R(X(0),y0,x1-X(0),Y(0)-y0,'f-me2','fill-opacity=".55"',0)+R(x0,Y(0),X(0)-x0,y1-Y(0),'f-opp2','fill-opacity=".8"',0);
  s+=Ln(X(0),y0,X(0),y1,'s-mut')+Ln(x0,Y(0),x1,Y(0),'s-mut');
  const grp=new Map();P.forEach(p=>{const k=p.x+','+p.y;if(!grp.has(k))grp.set(k,{p,ids:[]});grp.get(k).ids.push(p.i+1);});
  const lab=[];grp.forEach(g=>{s+=C(X(g.p.x),Y(g.p.y),3.8,g.p.w?'f-me':'f-opp','stroke="var(--surface)" stroke-width="1"');lab.push({x:X(g.p.x)+6,y:Y(g.p.y)+3,t:g.ids.join(' & ')});});
  lab.sort((a,b)=>a.y-b.y);lab.forEach((l,i)=>{for(let j=0;j<i;j++)if(Math.abs(lab[j].x-l.x)<24&&l.y-lab[j].y<9)l.y=lab[j].y+9;s+=T(l.x,l.y,l.t,'tt');});
  const cnt=a=>[a.filter(p=>p.w).length,a.filter(p=>!p.w).length],bh=cnt(P.filter(p=>p.x<0)),ah=cnt(P.filter(p=>p.x>0));
  s+=T(x0,y1+22,`behind at break: ${bh[0]} won, ${bh[1]} lost`,'t')+T(x1,y1+22,`ahead: ${ah[0]} won, ${ah[1]} lost`,'t','end');
  s+=T((x0+x1)/2,y1+12,'margin when first fencer reached 8  →','tt','middle')+T(2,y0+4,'final','tt');
  return SV(y1+26,s,'scatter');
}
function stack100(rows,cats,cls,o={}){
  const lx=44,bw=W-lx-4,rh=19;let s='',x=2;
  cats.forEach((c,i)=>{s+=R(x,2,7,7,cls[i])+T(x+10,8.5,c,'tt');x+=9+c.length*3.3+5;});
  rows.forEach((r,i)=>{const y=16+i*rh,tot=Math.max(1,r.v.reduce((a,b)=>a+b,0));let cx=lx;s+=T(lx-4,y+10,r.l,'t','end');
    r.v.forEach((v,k)=>{const w=v/tot*bw;s+=R(cx,y,w-.8,13,cls[k],'',1.5);if(w>16)s+=T(cx+w/2-.4,y+10,Math.round(v/tot*100),'tt','middle',cls[k]==='f-line'?'':'style="fill:#fff"');cx+=w;});});
  return SV(16+rows.length*rh+2,s,'stacked bars');
}
function bubble(pts,o){
  const xmax=Math.max(.5,Math.ceil(Math.max(...pts.map(p=>p.x))*10)/10),ymin=Math.min(.1,Math.floor(Math.min(...pts.map(p=>p.y))*10)/10),yr=1.15-ymin;
  const x0=26,x1=232,y0=6,y1=92,X=v=>x0+v/xmax*(x1-x0),Y=v=>y1-(v-ymin)/yr*(y1-y0);let s='';
  s+=Ln(x0,y1,x1,y1,'s-mut')+Ln(x0,y0,x0,y1,'s-mut')+Ln(X(.2),y0,X(.2),y1,'s-line','stroke-dasharray="2 2"')+Ln(x0,Y(.6),x1,Y(.6),'s-line','stroke-dasharray="2 2"');
  [.2,.4,.6,.8,1].filter(v=>v>=ymin+.15||v>=.4).forEach(v=>{s+=T(x0-3,Y(v)+3,Math.round(v*100)+'%','tt','end');});
  for(let v=0;v<=xmax+1e-9;v+=.1)s+=T(X(v),y1+9,Math.round(v*100)+'%','tt','middle');
  s+=T(x0+3,y0+8,o.tl,'t')+T(x1-2,y0+8,o.tr,'t','end')+T(x1-2,y1-4,o.br,'t','end');
  pts.forEach(p=>{const r=3+Math.sqrt(p.n)*.55,px=X(p.x),py=Y(p.y),pos=p.pos||'r';s+=C(px,py,r,'f-'+(p.c||'me'),'fill-opacity=".8" stroke="var(--surface)" stroke-width="1"');
    s+=pos==='l'?T(px-r-3,py+3,p.l,'t','end'):pos==='t'?T(px,py-r-3,p.l,'t','middle'):pos==='b'?T(px,py+r+9,p.l,'t','middle'):pos==='bs'?T(px-r,py+r+9,p.l,'t'):T(px+r+3,py+3,p.l,'t');});
  s+=T((x0+x1)/2,y1+19,'share of actions using it  →','tt','middle');
  return SV(y1+22,s,'quadrant scatter');
}
function matrix(rows,cols,vals,o={}){
  const lx=58,cw=(W-lx-4)/cols.length,ch=17,hy=12;let s='';
  cols.forEach((c,j)=>{s+=T(lx+j*cw+cw/2,9,c,'tt','middle');});
  rows.forEach((r,i)=>{const y=hy+i*(ch+1.5);s+=T(lx-4,y+11.5,r,'t','end');
    cols.forEach((c,j)=>{const v=vals[i][j],x=lx+j*cw;
      if(o.div){s+=R(x,y,cw-1.5,ch,'f-'+(v>=0?'good':'bad'),op(.1+.65*Math.min(1,Math.abs(v))));}
      else s+=R(x,y,cw-1.5,ch,'f-'+(o.tone||'me'),op(.08+.7*v));
      if(!o.div&&o.fmt!==false)s+=T(x+cw/2-.7,y+11.5,Math.round(v*100),'tt','middle');});});
  return SV(hy+rows.length*(ch+1.5)+4,s,'matrix heat map');
}
function tracks(items){
  const rh=22,lx=2,x0=104,x1=172;let s='';
  items.forEach((d,i)=>{const y=10+i*rh,X=v=>x0+(v-d.lo)/(d.hi-d.lo)*(x1-x0);
    s+=T(lx,y+3,d.l,'t')+R(x0,y-2.5,x1-x0,5,'f-line','',2.5)
      +Ln(X(d.cur),y,X(d.tgt),y,'s-mut','stroke-width="1" '+(d.sug?'stroke-dasharray="2 2"':''))
      +C(X(d.cur),y,4,'f-bad')+`<path d="M${X(d.tgt)} ${y-5}l5 5l-5 5l-5 -5z" class="f-good" ${d.sug?'fill-opacity=".55"':''}/>`
      +T(W-2,y+3,d.txt,'tb','end');});
  return SV(items.length*rh+12,s,'progress tracks');
}
function sankey(){
  const L=[['Own start','alone'],['Both start','sim'],['Opponent starts','they']].map(([n,k])=>{const a=M[k](ALLS);return {n,v:[a[0],a[1]-a[0]]};});
  const wonT=L.reduce((a,l)=>a+l.v[0],0),lostT=L.reduce((a,l)=>a+l.v[1],0),gap=7,tot=Math.max(1,wonT+lostT),k=84/tot;
  const xl=70,xr=170,bw=6;let s='',ly=6,rw=[0,0];const rtop=[6,6+wonT*k+14];
  L.forEach((l,i)=>{const h=(l.v[0]+l.v[1])*k;s+=R(xl-bw,ly,bw,h,'f-fg')+T(xl-bw-4,ly+h/2+3,`${l.n} ${l.v[0]+l.v[1]}`,'t','end');
    let y=ly;l.v.forEach((v,j)=>{const hh=v*k,ry=rtop[j]+rw[j];rw[j]+=hh;
      s+=`<path d="M${xl} ${y.toFixed(1)}C${(xl+xr)/2} ${y.toFixed(1)} ${(xl+xr)/2} ${ry.toFixed(1)} ${xr} ${ry.toFixed(1)}V${(ry+hh).toFixed(1)}C${(xl+xr)/2} ${(ry+hh).toFixed(1)} ${(xl+xr)/2} ${(y+hh).toFixed(1)} ${xl} ${(y+hh).toFixed(1)}Z" class="${j?'f-opp':'f-me'}" fill-opacity="${j?.45:.5}"/>`;y+=hh;});
    ly+=h+gap;});
  s+=R(xr,rtop[0],bw,wonT*k,'f-me')+T(xr+bw+4,rtop[0]+wonT*k/2+3,'Won '+wonT,'tb')+R(xr,rtop[1],bw,lostT*k,'f-opp')+T(xr+bw+4,rtop[1]+lostT*k/2+3,'Lost '+lostT,'tb');
  return SV(ly+4,s,'flow diagram');
}
function hist(a,b,la,lb){
  const bins=a.length,x0=22,slot=(W-6-x0)/bins,bw=Math.min(14,(slot-6)/2),H=70;let s='';const mx=Math.max(1,...a,...b);
  a.forEach((v,i)=>{const x=x0+i*slot;s+=R(x,H-v/mx*H+16,bw-1,v/mx*H,'f-me')+R(x+bw,H-b[i]/mx*H+16,bw-1,b[i]/mx*H,'f-opp')+T(x+bw,H+27,'T'+(i+1),'t','middle');});
  s+=Ln(x0-4,H+16,W-6,H+16,'s-mut')+R(x0,0,6,6,'f-me')+T(x0+9,6,la,'tt')+R(x0+64,0,6,6,'f-opp')+T(x0+73,6,lb,'tt');
  return SV(H+32,s,'histogram');
}
function lollipop(items){
  const rh=17;let s='';
  items.forEach((d,i)=>{const y=4+i*rh,w=d.v*100;
    s+=R(2,y,56,13,'f-s','stroke="var(--line)" stroke-width=".8"',3)+T(30,y+9.5,d.c,'tm','middle')
     +Ln(66,y+6.5,66+w,y+6.5,'s-me','stroke-width="1.5"')+C(66+w,y+6.5,3.5,'f-me')+T(66+w+7,y+9.5,pct(d.v),'tb')+T(W-2,y+9.5,'n='+d.n,'tt','end');});
  return SV(items.length*rh+6,s,'ranked patterns');
}
function funnel(){
  const mine=M.par(ALLS),th=frac(ALLS.G.filter(x=>x.l==='p'),x=>x.land),rip=TOUCHES.filter(t=>t.won&&t.cat==='Parry–riposte').length,mx=Math.max(1,mine[1]);
  let s=T(2,8,'Parries','tb')+T(130,8,'Parry success','tb');
  [['Tried',mine[1],'f-opp'],['Landed',mine[0],'f-me'],['Riposte scored',rip,'f-me']].forEach((d,i)=>{const y=14+i*18,w=d[1]/mx*92;
    s+=R(2,y,w,12,d[2])+T(2+w+4,y+9,d[1],'tb')+T(2+w+(d[1]>9?18:15),y+9,d[0],'t');});
  [['Mine',rate(mine),'f-me'],['Theirs',rate(th),'f-opp']].forEach((d,i)=>{const y=16+i*20;s+=T(130,y+9,d[0],'t')+R(160,y,d[1]*130*.9,12,d[2])+T(160+d[1]*117+4,y+9,pct(d[1]),'tb');});
  s+=T(130,64,`${th[0]} of ${th[1]} parried by them`,'tt');
  return SV(76,s,'funnel');
}
function arcs(){
  const xs=[30,75,120,165,210],y=64;let s=Ln(18,y,222,y,'s-mut');
  xs.forEach((x,i)=>{s+=Ln(x,y-3,x,y+3,'s-mut')+T(x,y+13,(i-2>0?'+':i-2<0?'−':'')+Math.abs(i-2),'t','middle');});
  const ev=new Map();                                     /* start position -> position after the pull short */
  ALLS.R.filter(x=>x.l==='d'&&x.pos!=null&&Math.abs(x.pos)<=2).forEach(x=>{
    const before=x.t.rt.filter(q=>q.col<x.col&&q.pos!=null&&Math.abs(q.pos)<=2),from=before.length?before[before.length-1].pos:0;
    if(from===x.pos)return;
    const k=from+','+x.pos;if(!ev.has(k))ev.set(k,{from,to:x.pos,n:0,w:0});const e=ev.get(k);e.n++;if(x.t.won)e.w++;});
  const top=[...ev.values()].sort((a,b)=>b.n-a.n).slice(0,6),mx=Math.max(1,...top.map(a=>a.n));
  top.forEach((a,k)=>{const x1=xs[a.from+2],x2=xs[a.to+2],h=16+Math.abs(x2-x1)*.28+k*2,c=a.w/a.n>=.5?'good':'bad';
    s+=`<path d="M${x1} ${y}Q${(x1+x2)/2} ${y-h*1.6} ${x2} ${y}" class="s-${c}" stroke-width="${(1+2*a.n/mx).toFixed(1)}" stroke-opacity=".7"/>`+C(x2,y,2.4,'f-'+c);});
  s+=T(2,10,'from → to (arc width = how often)','tt')+T(W-2,10,'green = exchange won','tt','end');
  return SV(88,s,'retreat arcs');
}
function domHeat(){
  const secRate=(g,sec)=>{const ts=TOUCHES.filter(t=>t.g===g&&t.sec===sec);return ts.length?ts.filter(t=>t.won).length/ts.length:null;};
  const D=SHOWN.map(g=>[0,1,2,3].map(sec=>secRate(g,sec)));
  const avg=[0,1,2,3].map(j=>{const v=ALLIDX.map(g=>secRate(g,j)).filter(x=>x!=null);return v.length?v.reduce((a,b)=>a+b,0)/v.length:null;}),x0=50,cw=36,rh=9.4;let s='';
  ['I','II','III','IV'].forEach((c,j)=>{s+=T(x0+j*cw+cw/2-1,8,c,'t','middle');});
  D.forEach((r,i)=>{const y=12+i*rh;s+=T(x0-5,y+7,'G'+(SHOWN[i]+1),'tt','end');
    r.forEach((v,j)=>{if(v!=null)s+=R(x0+j*cw,y,cw-1.5,rh-1.5,'f-'+(v>=.5?'me':'opp'),op(.12+.75*Math.min(1,Math.abs(v-.5)/.5)));});});
  const y=12+D.length*rh+3;s+=Ln(x0,y-1,x0+4*cw,y-1,'s-mut')+T(x0-5,y+8,'All bouts','t','end');
  avg.forEach((v,j)=>{s+=T(x0+j*cw+cw/2-1,y+8,v==null?'—':pct(v),'tb','middle');});
  return SV(y+14,s,'games by sections heat map');
}
function dots5(){
  const groupBy=(label,fn,order)=>{const m=new Map();OPPONENTS.forEach(o=>{const k=fn(o);if(!m.has(k))m.set(k,{w:0,n:0});const v=m.get(k);v.n++;if(o.win)v.w++;});
    return [label,order.filter(k=>m.has(k)).map(k=>({k,...m.get(k)}))];};
  const sg=v=>v===0?'0':(v>0?'+':'-')+Math.abs(v);
  const ages=[...new Set(OPPONENTS.map(o=>o.ageDiff))].sort((a,b)=>a-b).map(sg);
  const groups=[groupBy('Hand',o=>o.hand,['R','L']),
    groupBy('Height',o=>o.height==='taller'?'>':o.height==='shorter'?'<':'-',['>','-','<']),
    groupBy('Age',o=>sg(o.ageDiff),ages),
    groupBy('Rating',o=>o.arrow==='↑'?'+':o.arrow==='↓'?'-':'0',['-','0','+']),
    groupBy('Level',o=>o.level.startsWith('Int')?'int':o.level.startsWith('Reg')?'reg':'nat',['reg','nat','int']),
    groupBy('Age group',o=>o.level.endsWith('Cdt')?'cdt':o.level.endsWith('Jnr')?'jnr':'snr',['cdt','jnr','snr'])];
  const w=480,gap=16,tot=groups.reduce((a,g)=>a+g[1].length,0),slot=(w-10-groups.length*gap)/tot,bw=Math.min(24,slot-4);let s='',x=5;
  groups.forEach(g=>{const gw=g[1].length*slot;s+=T(x,10,g[0],'tb')+Ln(x,76,x+gw-4,76,'s-mut','stroke-dasharray="2 2"');
    g[1].forEach((v,k)=>{const hh=Math.max(1,v.w/v.n*46),bx=x+k*slot;s+=R(bx,76-hh,bw,hh,'f-me','fill-opacity="'+(v.n<3?.45:.8)+'"')+T(bx+bw/2,74-hh,v.w+'/'+v.n,'tt','middle')+T(bx+bw/2,87,v.k,'tt','middle');});
    x+=gw+gap;});
  return SV(98,s,'win rate by opponent profile; bars label wins over bouts',w);
}
function trends(){
  const w=480,pw=222,ph=62,defs=[
    {t:'P1 Own attacks won at 12+ (running %)',f:i=>{const a=agg(CHRON.slice(0,i+1));return rate(a.cl);},tg:TARGET.P1,max:1,pc:1},
    {t:'P2 Parry success (running %)',f:i=>{const a=agg(CHRON.slice(0,i+1));return rate(a.par);},tg:TARGET.P2,max:1,pc:1},
    {t:'P3 Parry-ripostes conceded (per bout)',f:i=>BM[CHRON[i]].pr,tg:TARGET.P3,max:6},
    {t:'P4 Conceded into preparation (per bout)',f:i=>BM[CHRON[i]].prep,tg:TARGET.P4,max:5}];
  const n=CHRON.length,ids=CHRON.map((_,k)=>k).slice(-BOUT_WINDOW),m=ids.length;
  defs.forEach(d=>{if(!d.pc)d.max=Math.max(d.max,Math.ceil(Math.max(d.tg,...ids.map(g=>d.f(g)))));});
  let s='';
  defs.forEach((d,k)=>{const x0=(k%2)*(pw+36)+22,y0=(Math.floor(k/2))*(ph+54)+16,X=i=>x0+i/Math.max(1,m-1)*(pw-26),Y=v=>y0+ph-v/d.max*ph;
    s+=T(x0-18,y0-6,d.t,'tb')+Ln(x0-4,y0+ph,x0+pw-18,y0+ph,'s-mut')+Ln(x0-4,y0,x0-4,y0+ph,'s-mut');
    s+=T(x0-7,y0+4,d.pc?'100%':d.max,'tt','end')+T(x0-7,y0+ph+3,'0','tt','end');
    s+=Ln(x0-4,Y(d.tg),x0+pw-18,Y(d.tg),'s-good','stroke-dasharray="3 2" stroke-width=".9"')+T(x0+pw-18,Y(d.tg)-2,'target','tt','end','style="fill:var(--good)"');
    const pts=ids.map((gi,i)=>X(i).toFixed(1)+','+Y(d.f(gi)).toFixed(1)).join(' ');
    s+=`<polyline points="${pts}" class="s-mut" stroke-width="1.2" stroke-linejoin="round"/>`;
    ids.forEach((gi,i)=>{const g=CHRON[gi],o=OPPONENTS[g],v=d.f(gi);s+=C(X(i),Y(v),3.4,o.win?'f-me':'f-opp','stroke="var(--surface)" stroke-width="1"');
      if(!d.pc)s+=T(X(i),Y(v)-5,v,'tt','middle');
      s+=T(X(i),y0+ph+11,'G'+(g+1),'tt','middle')+T(X(i),y0+ph+19,o.arrow,'tt','middle');});
    if(d.pc){const v=d.f(n-1);s+=T(X(m-1),Y(v)-6,pct(v),'tb','middle');}
  });
  /* dates: games played on the same day share one label */
  const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],groups=[];
  ids.map(k=>CHRON[k]).forEach(g=>{const d=OPPONENTS[g].date.replaceAll('-','/'),last=groups[groups.length-1];if(last&&last.d===d)last.ids.push('G'+(g+1));else groups.push({d,ids:['G'+(g+1)]});});
  const parts=groups.map(q=>{const [y,m,dd]=q.d.split('/').map(Number);return q.ids.join(' ')+' '+dd+' '+MON[m-1]+' '+y;});
  const lines=[];let cur='Dates: ';parts.forEach((p,i)=>{const add=(i?' · ':'')+p;if((cur+add).length>110){lines.push(cur);cur=p;}else cur+=add;});lines.push(cur);
  const yb=2*(ph+54)+10;
  s+=C(24,yb,3,'f-me')+T(30,yb+3,'Won','t')+C(62,yb,3,'f-opp')+T(68,yb+3,'Lost','t')+T(100,yb+3,'G# = bout, last '+m+' shown oldest to newest · running % uses all bouts · ↑ opponent rated higher','t');
  lines.forEach((l,i)=>{s+=T(24,yb+13+i*8,l,'tt');});
  return SV(yb+18+(lines.length-1)*8,s,'four small line charts of the targets in date order',w);}
function ratingScatter(){
  const SO=SHOWN.map(i=>OPPONENTS[i]),gaps=SO.map(o=>o.gap),ms=SO.map(o=>FINALS[o.game-1][0]-FINALS[o.game-1][1]);
  const glo=Math.min(0,...gaps),ghi=Math.max(3,...gaps),ylo=Math.min(-6,...ms.map(m=>m-1)),yhi=Math.max(8,...ms.map(m=>m+1));
  const x0=30,x1=228,y0=8,y1=104,X=v=>x0+16+(v-glo)/(ghi-glo)*(x1-x0-32),Y=v=>y1-(v-ylo)/(yhi-ylo)*(y1-y0);let s='';
  s+=R(x0,y0,x1-x0,Y(0)-y0,'f-me2','fill-opacity=".5"',0)+R(x0,Y(0),x1-x0,y1-Y(0),'f-opp2','fill-opacity=".8"',0)+Ln(x0,Y(0),x1,Y(0),'s-mut');
  for(let v=Math.ceil(ylo/5)*5;v<=yhi;v+=5)s+=T(x0-4,Y(v)+3,(v>0?'+':v<0?'−':'')+Math.abs(v),'tt','end');
  for(let v=glo;v<=ghi;v++)s+=Ln(X(v),y0,X(v),y1,'s-line','stroke-dasharray="2 2"')+T(X(v),y1+10,v===0?'same band':(v>0?'+':'−')+Math.abs(v),'tt','middle');
  SO.forEach((o,i)=>{const m=ms[i];s+=C(X(o.gap),Y(m),4.2,o.win?'f-me':'f-opp','stroke="var(--surface)" stroke-width="1"')+T(X(o.gap)+7,Y(m)+3,'G'+o.game,'tt');});
  s+=T((x0+x1)/2,y1+22,'letter bands above own rating  →','tt','middle')+T(2,y0+6,'margin','tt');
  return SV(y1+28,s,'scatter of rating gap against final margin');}
function formLine(){
  const n=SHOWN.length,x0=18,x1=232,bw=(x1-x0)/n-4,mid=58,k=Math.min(3.8,40/Math.max(1,...SHOWN.map(g=>Math.abs(FINALS[g][0]-FINALS[g][1]))));let s=Ln(x0,mid,x1,mid,'s-mut');
  SHOWN.forEach((g,i)=>{const o=OPPONENTS[g],m=FINALS[g][0]-FINALS[g][1],x=x0+i*((x1-x0)/n)+2,h=Math.abs(m)*k;
    s+=R(x,m>=0?mid-h:mid,bw,h,o.win?'f-me':'f-opp')+T(x+bw/2,m>=0?mid-h-3:mid+h+8,(m>0?'+':m<0?'−':'')+Math.abs(m),'tt','middle')
      +T(x+bw/2,mid+36,'G'+o.game,'tt','middle')+T(x+bw/2,mid+44,o.rating,'tt','middle')+T(x+bw/2,mid+52,o.arrow,'tt','middle');});
  s+=T(x0,8,'final margin, oldest to newest','tt');
  return SV(mid+58,s,'bout margins in date order');}
function oppMatrix(){
  const cols=[['R',o=>o.hand==='R'],['L',o=>o.hand==='L'],['Short',o=>o.height==='shorter'],['Same',o=>o.height==='similar'],['Tall',o=>o.height==='taller']];
  const ag=cols.map(c=>agg(gamesWhere(c[1])));
  const rows=[['Touches won',a=>(a.won+a.lost)?a.won/(a.won+a.lost):0],['Own attacks',a=>rate(a.alone)],['Simultaneous',a=>rate(a.sim)],['Defending',a=>rate(a.they)],['Parry',a=>rate(a.par)]];
  return matrix(rows.map(r=>r[0]),cols.map((c,i)=>c[0]+' '+ag[i].n),rows.map(r=>ag.map(a=>r[1](a))),{});}
