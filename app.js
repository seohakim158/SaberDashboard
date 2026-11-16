/* app.js: draws the pages, handles the tabs and filters. */

/* ---------- player header, from the data file ---------- */
document.getElementById('pname').textContent=PLAYER.name;
document.getElementById('pclub').textContent=PLAYER.club+' · '+NB+' bout'+(NB===1?'':'s')+' analysed';
document.getElementById('page').textContent=AGE_TXT;
document.getElementById('pheight').textContent=PLAYER.height;
document.getElementById('prating').textContent=RATING_TXT;

/* ---------- cards and tiles ---------- */
const INFO=d=>`<span class="info" tabindex="0" role="img" aria-label="Data: ${d}" data-tip="Data: ${d}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 11v5"/><path d="M12 7.5h.01"/></svg></span>`;
const WARN='<span class="warn" tabindex="0" role="img" aria-label="Data not sufficient for accurate analysis" data-tip="Data not sufficient for accurate analysis"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span>';
function cardHTML(page,secNo,c,i){
  const lowData=NB<c.minBouts;
  return `<article class="card" data-s="${c.span}" data-focus="${c.tags.join(' ')}" style="--s:${c.span}">
  <header class="${lowData?'hw':''}"><span class="id">${page.code} ${secNo}.${i+1}</span><h4>${c.title}</h4>${c.tags.map(f=>`<span class="fc ${f}"><i></i>${f}</span>`).join('')}<span class="icons">${lowData?WARN:''}${INFO(c.data)}</span></header>
  <div class="thumb">${c.chart}</div></article>`;
}
function tilesHTML(t){return `<div class="tiles">${t.map(x=>`<div class="tile ${x.tone||''}"><span class="k">${x.k}</span><span class="v">${x.v}</span><span class="l">${x.l}</span><span class="s">${x.s}</span>${x.dots?`<div class="dots">${[...x.dots].map(d=>`<i class="${d==='L'?'l':''}"></i>`).join('')}</div>`:x.bar!=null?`<div class="bar"><i style="width:${x.bar*100}%"></i></div>`:''}</div>`).join('')}</div>`;}
function pageHTML(key){
  const page=PAGES[key];
  let h=`<div class="pagehead"><h2>${page.name}</h2><p class="lede">${page.lede}</p></div>`;
  page.sections.forEach((sec,n)=>{
    h+=`<section class="sec"><div class="sec-h"><span class="sec-n">${n+1}</span><h3>${sec.name}</h3></div>`;
    h+=sec.tiles?tilesHTML(sec.tiles):`<div class="grid">${sec.cards.map((c,i)=>cardHTML(page,n+1,c,i)).join('')}</div>`;
    h+=`</section>`;});
  return h;
}

/* ---------- raw data tab ---------- */
let rawGame=SHOWN[SHOWN.length-1];
function rawHTML(){
  const opts=[...SHOWN].reverse().map(i=>`<option value="${i}"${i===rawGame?' selected':''}>Game ${i+1} · ${OPPONENTS[i].result}</option>`).join('');
  return `<div class="pagehead"><h2>Raw data</h2><p class="lede">Every phrase of the last ${SHOWN.length} notated bout${SHOWN.length===1?'':'s'}, newest first, as recorded, with the opponent’s details for the bout you pick. Red is me.</p></div>
  <div class="rawbar"><label for="gsel">Game</label><select id="gsel">${opts}</select><span class="rkey"><b>A</b> landed · <b class="m">a</b> missed · arrow = target line · number = piste position</span></div>
  <div id="opprofile">${opponentProfile(OPPONENTS[rawGame])}</div>
  <div class="rawwrap" id="rawtable">${rawTable(rawGame)}</div>`;
}
function opponentProfile(o){return `<article class="profile"><h3>Bout details</h3><dl><div><dt>Handedness</dt><dd>${o.handTxt}</dd></div><div><dt>Height</dt><dd>${o.heightTxt}</dd></div><div><dt>Age</dt><dd>${o.ageTxt}</dd></div><div><dt>Rating</dt><dd>${o.rating} · ${o.relation}</dd></div><div><dt>Level</dt><dd>${o.level}</dd></div><div><dt>Bout date</dt><dd>${o.date.replaceAll('/','-')}</dd></div></dl></article>`;}
const minus=t=>t.replace(/(\s)-(\d)/g,'$1−$2').replace(/^-(\d)/,'−$1');   /* typographic minus */
function rawTable(g){
  const phrases=GAMES[g];
  const cols=Math.max(3,...phrases.flatMap(p=>[p.r,p.g].map(row=>row.reduce((n,t,i)=>t?i+1:n,0))));   /* tempo columns in use */
  const cell=t=>{if(!t)return '<td></td>';const k=/[A-Z]/.test(t[0])?'land':/[a-z]/.test(t[0])?'miss':'neu';return `<td><span class="cl ${k}">${minus(t)}</span></td>`;};
  const row=r=>Array.from({length:cols},(_,i)=>cell(r[i])).join('');
  let h=`<table class="rt"><thead><tr><th>#</th><th></th>${Array.from({length:cols},(_,i)=>`<th>T${i+1}</th>`).join('')}<th>Score</th></tr></thead>`;
  phrases.forEach((p,i)=>{
    h+=`<tbody><tr><td class="no ${p.w}" rowspan="2">${i+1}</td><th class="who me">Red</th>${row(p.r)}<td class="sc" rowspan="2"><b class="${p.w==='R'?'w':''}">${p.s[0]}</b> – <b class="${p.w==='G'?'w':''}">${p.s[1]}</b></td></tr>`
     +`<tr><th class="who">Green</th>${row(p.g)}</tr></tbody>`;});
  return h+'</table>';
}

/* ---------- routing and filters ---------- */
const view=document.getElementById('view');
let current='overview',filter='all';
function show(key){
  if(!TABS.concat(['raw','explain']).includes(key))key='overview';
  current=key;
  view.innerHTML=key==='raw'?rawHTML():key==='explain'?explainHTML():pageHTML(key);
  document.querySelectorAll('#tabs .t').forEach(b=>b.setAttribute('aria-current',b.dataset.k===key?'page':'false'));
  applyFilter();
  document.getElementById('ctl').style.visibility=TABS.includes(key)?'visible':'hidden';
}
function applyFilter(){
  if(!TABS.includes(current))return;
  const on=filter!=='all';
  view.querySelectorAll('.card').forEach(c=>{c.hidden=on&&!c.dataset.focus.split(' ').includes(filter);});
  view.querySelectorAll('.tiles').forEach(t=>{t.hidden=on;});
  view.querySelectorAll('.sec').forEach(s=>{const cards=[...s.querySelectorAll('.card')];s.hidden=on&&!cards.some(c=>!c.hidden);});
}
view.addEventListener('change',e=>{if(e.target.id==='gsel'){rawGame=+e.target.value;
  document.getElementById('rawtable').innerHTML=rawTable(rawGame);
  document.getElementById('opprofile').innerHTML=opponentProfile(OPPONENTS[rawGame]);}});
document.getElementById('tabs').addEventListener('click',e=>{const b=e.target.closest('.t');if(b)location.hash=b.dataset.k;});
document.getElementById('ctl').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.f){filter=b.dataset.f;document.querySelectorAll('#ctl [data-f]').forEach(x=>x.setAttribute('aria-pressed',x===b));applyFilter();}});
window.addEventListener('hashchange',()=>show(location.hash.slice(1)));
show(location.hash.slice(1));

/* ---- tabs dock into the frozen bar once their row has fully scrolled out of view ---- */
(function(){
  const site=document.getElementById('site'),dock=document.getElementById('dock'),
        navrow=document.getElementById('navrow'),tabs=document.getElementById('tabs');
  const still=matchMedia('(prefers-reduced-motion: reduce)');
  let docked=false,timer=0,ticking=false;
  function move(toDock){
    const first=tabs.getBoundingClientRect();
    if(toDock){navrow.style.minHeight=navrow.offsetHeight+'px';dock.appendChild(tabs);}
    else{navrow.insertBefore(tabs,navrow.firstChild);navrow.style.minHeight='';}
    docked=toDock;
    if(still.matches)return;
    const last=tabs.getBoundingClientRect();
    clearTimeout(timer);
    tabs.classList.add('flying');
    tabs.style.transition='none';
    tabs.style.transform=`translate(${first.left-last.left}px,${first.top-last.top}px)`;
    tabs.getBoundingClientRect();                       /* commit the start position */
    requestAnimationFrame(()=>{
      tabs.style.transition='transform .42s cubic-bezier(.2,.8,.2,1)';
      tabs.style.transform='';
    });
    timer=setTimeout(()=>{tabs.classList.remove('flying');tabs.style.transition='';},480);
  }
  function update(){
    ticking=false;
    const hidden=navrow.getBoundingClientRect().bottom<=site.offsetHeight;
    if(hidden!==docked)move(hidden);
  }
  const req=()=>{if(!ticking){ticking=true;requestAnimationFrame(update);}};
  addEventListener('scroll',req,{passive:true});
  addEventListener('resize',req);
  addEventListener('hashchange',req);
  update();
})();
