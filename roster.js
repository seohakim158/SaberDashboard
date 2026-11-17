/* roster.js: the homepage (description + fencer search) and the header search box.
   Reads only FENCERS from fencers.js. The full list is never shown: results appear as you type. */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ageOf=born=>{const [y,m]=born.split('-').map(Number),n=new Date();return Math.floor(((n.getFullYear()-y)*12+n.getMonth()+1-m)/12);};
const fencerUrl=f=>'?f='+encodeURIComponent(f.id);
const matches=(f,q)=>{q=q.trim().toLowerCase();return !q||(f.name+' '+f.club).toLowerCase().includes(q);};

/* ---------- header search: a quick "jump to fencer" dropdown on every page ---------- */
(function(){
  const input=document.getElementById('q'),list=document.getElementById('qlist');
  const draw=()=>{
    const q=input.value;
    const hits=q.trim()?FENCERS.filter(f=>matches(f,q)).slice(0,8):[];
    list.hidden=!q.trim();
    list.innerHTML=hits.length?hits.map(f=>`<li><a href="${fencerUrl(f)}"><b>${esc(f.name)}</b><span>${esc(f.club)}</span></a></li>`).join(''):'<li class="none">No fencer found</li>';
  };
  input.addEventListener('input',draw);
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter'){const a=list.querySelector('a');if(a)location.href=a.href;}
    if(e.key==='Escape'){input.value='';draw();input.blur();}});
  document.addEventListener('click',e=>{if(!e.target.closest('.search'))list.hidden=true;});
  input.addEventListener('focus',()=>{if(input.value.trim())draw();});
})();

/* ---------- homepage ---------- */
const HOME_MAX=8;
function renderHome(){
  const root=document.getElementById('rosterview');
  const feat=[['01','Offence','What I start: attack types, targets, and how attacks end.'],
    ['02','Defence','Parries, pull-shorts and counters against what the opponent starts.'],
    ['03','Timing','How a bout flows: early, middle and closing, and who reaches 8 first.'],
    ['04','Space','Where on the piste and which target lines touches are won and lost.']];
  root.innerHTML=`<section class="home">
    <div class="hero">
      <svg class="blade" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=".6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 4L9 15"/><path d="M6 12l6 6"/><path d="M6 18l-2 2"/></svg>
      <p class="eyebrow">Sabre bout analysis</p>
      <h1>Every touch,<br><em>understood.</em></h1>
      <p class="lede">Each bout is notated by hand, phrase by phrase, then turned into clear charts on offence, defence, timing, position on the strip and results against different opponents. Find a fencer to open their dashboard: analysis across every bout, with the latest ${BOUT_WINDOW_TEXT} shown one by one.<br><br>Try searching a fencer up, like "Seoha Kim" in the field below.</p>
      <label class="bigsearch"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
        <input id="hq" type="search" placeholder="Search a fencer by name or club" aria-label="Search fencers" autocomplete="off" autofocus></label>
      <ul class="hits" id="hits" aria-live="polite"></ul>
    </div>
    <div class="piste" aria-hidden="true"><i>−2</i><i>−1</i><i>0</i><i>+1</i><i>+2</i></div>
    <div class="feats">${feat.map(f=>`<article><span>${f[0]}</span><h3>${f[1]}</h3><p>${f[2]}</p></article>`).join('')}</div>
  </section>`;
  const input=document.getElementById('hq'),out=document.getElementById('hits');
  const draw=()=>{
    const q=input.value.trim();
    if(!q){out.innerHTML='';return;}
    const all=FENCERS.filter(f=>matches(f,q)),hits=all.slice(0,HOME_MAX);
    out.innerHTML=hits.length
      ?hits.map(f=>`<li><a href="${fencerUrl(f)}"><b>${esc(f.name)}</b><span>${esc(f.club)} · age ${ageOf(f.born)}</span></a></li>`).join('')+(all.length>HOME_MAX?`<li class="more">${all.length-HOME_MAX} more. Keep typing to narrow it down.</li>`:'')
      :'<li class="more">No fencer found.</li>';
  };
  input.addEventListener('input',draw);
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){const a=out.querySelector('a');if(a)location.href=a.href;}});
}
const BOUT_WINDOW_TEXT=10;   /* keep equal to BOUT_WINDOW in analysis.js */
