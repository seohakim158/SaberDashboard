/* explain.js: the Explanation tab, plus its two diagrams. Mostly text: edit the wording here. */

function phraseDemo(){
  const cx=i=>150+i*115,chip=(i,y,a,b,hi)=>`<rect x="${cx(i)-50}" y="${y}" width="100" height="46" rx="8" class="${hi?'f-me2':'f-s'}" stroke="${hi?'var(--me)':'var(--line)'}" stroke-width="1.2"/><text x="${cx(i)}" y="${y+21}" class="dm" text-anchor="middle">${a}</text><text x="${cx(i)}" y="${y+37}" class="ds" text-anchor="middle">${b}</text>`;
  let s='';[0,1,2,3].forEach(i=>{s+=`<text x="${cx(i)}" y="16" class="dl" text-anchor="middle">Tempo ${i+1}</text>`;});
  s+=`<text x="10" y="56" class="dr">Red (me)</text><text x="10" y="116" class="dr">Green</text><line x1="10" y1="82" x2="590" y2="82" class="s-line"/>`;
  s+=chip(0,28,'n → 1','compound · missed')+chip(2,28,'P','parry · landed')+chip(3,28,'A ← −1','riposte · landed',1);
  s+=chip(1,88,'D 1','pull short · to +1')+chip(2,88,'a → −1','attack · missed');
  s+=`<rect x="100" y="146" width="450" height="24" rx="8" class="f-me2" stroke="var(--me)" stroke-width="1.2"/><text x="325" y="162" class="dr" text-anchor="middle">Result: touch to Red by parry-riposte · score 2–3</text>`;
  return `<svg class="dia" viewBox="0 0 600 180" role="img" aria-label="An example phrase, recorded in the notation">${s}</svg>`;
}
function stageScale(){
  const x=v=>74+v/15*500;let s='';
  [[0,'0'],[3,'3'],[8,'8 (the break)'],[12,'12'],[15,'15']].forEach(t=>{s+=`<line x1="${x(t[0])}" y1="26" x2="${x(t[0])}" y2="120" class="s-line" stroke-dasharray="3 3"/><text x="${x(t[0])}" y="18" class="dl" text-anchor="middle">${t[1]}</text>`;});
  const seg=(a,b,y,l,k)=>`<rect x="${x(a)+1}" y="${y}" width="${x(b)-x(a)-2}" height="32" rx="6" class="${k}"/><text x="${(x(a)+x(b))/2}" y="${y+20}" class="dr" text-anchor="middle">${l}</text>`;
  s+=`<text x="4" y="50" class="dr">Sections</text>`+seg(0,3,34,'I','f-me2')+seg(3,8,34,'II','f-opp2')+seg(8,12,34,'III','f-me2')+seg(12,15,34,'IV','f-opp2');
  s+=`<text x="4" y="102" class="dr">Phases</text>`+seg(0,8,86,'Early','f-me2')+seg(8,12,86,'Middle','f-opp2')+seg(12,15,86,'Closing','f-me2');
  s+=`<text x="74" y="140" class="ds">Sections: a touch belongs to the section it ends in (leading score after the touch).</text><text x="74" y="156" class="ds">Phases: a touch belongs to the phase set by the leading score before it was fenced.</text>`;
  return `<svg class="dia" viewBox="0 0 600 166" role="img" aria-label="Sections and phases along the leading score">${s}</svg>`;
}
function explainHTML(){
  const act=(l,n,c)=>`<div class="act ${c}"><b>${l}</b><span>${n}</span></div>`;
  const tg=[['↖','Top-left'],['↑','Top'],['↗','Top-right'],['←','Mid-left'],['●','Centre'],['→','Mid-right'],['↙','Low-left'],['↓','Low'],['↘','Low-right']];
  const sec=(n,t,sub,body)=>`<section class="sec"><div class="sec-h sub"><span class="sec-n">${n}</span><h3>${t}</h3><p>${sub}</p></div>${body}</section>`;
  const defs=[
    ['Success rate','Actions that landed ÷ actions attempted. Every percentage is shown with its “x of n”.'],
    ['Simultaneous attack','Both fencers attacked in the first column. I count it as won when I got the touch.'],
    ['Attack I start alone','Only I attacked in the first column. Won when I scored.'],
    ['Defending their attacks','Exchanges the opponent started that I won.'],
    ['Pull-short exchange','An exchange where I pulled short, counted as won when I then won the touch.'],
    ['Parry success','Successful parries ÷ parries attempted.'],
    ['Net touches','Touches I scored minus touches I conceded, for each scoring action.'],
    ['Score margin','My score minus my opponent’s score after each touch.'],
    ['Reached 8 first','Who got to 8 first, the sabre break.'],
    ['Next-touch win rate','How often I win touch n+1 after scoring, or after conceding, touch n.'],
    ['Wins and losses',`${WIN_IDX.length} win${WIN_IDX.length===1?'':'s'} (bout${WIN_IDX.length===1?'':'s'} ${WIN_IDX.map(i=>i+1).join(', ')||'none'}) against ${LOSS_IDX.length} loss${LOSS_IDX.length===1?'':'es'} (bout${LOSS_IDX.length===1?'':'s'} ${LOSS_IDX.map(i=>i+1).join(', ')||'none'}).`],
    ['Target zones','Success rate for each arrow. Actions with two arrows, like c ↑ →, are left out.'],
    ['Piste position','Where the scoring action finished, from −2 (my end) to +2 (theirs).'],
    ['Rating','Rating order runs A (best) to E, and within a letter the newer year is better: A26 > A25 > B26. Each opponent is compared with my rating on the day of the bout.'],
    ['Rating band gap','How many letter bands the opponent sits above my rating that day. “Same band” covers the same letter, whatever the year, and anything below.'],
    ['Age','Opponent birth year compared with own: + older, 0 same, - younger. Actual birth years are not shown.'],
    ['Height','Taller, similar or shorter, as noted for each bout.'],
    ['Level','Regional (reg), national (nat) or international (int), from the event.'],
    ['Age group','Cadet (cdt), junior (jnr) or senior (snr), from the event.'],
    ['Profile axes','Height: > taller, - similar, < shorter. Rating: + higher, 0 same, - lower.'],
    ['Running rate','Attempts and successes added up across bouts in date order, used where a single bout has too few attempts.']];
  return `<div class="pagehead"><h2>Explanation</h2><p class="lede">How I record a bout, how each touch is classified, and how the numbers on this site are worked out.</p></div>`
  +sec(1,'Reading a phrase','One touch is one phrase: two rows, Red (me) and Green, with one column per tempo, read left to right.',
    `<div class="anat"><div><b class="g">A</b><h4>Action</h4><p>The letter says what was done. Uppercase landed, lowercase missed.</p></div><div><b class="g">←</b><h4>Target line</h4><p>Where it was aimed, on a 3×3 grid from my point of view.</p></div><div><b class="g">−1</b><h4>Piste position</h4><p>−2 is my end of the strip, +2 is my opponent’s.</p></div></div>`
    +`<p class="ex-lead" style="margin-bottom:8px">An example phrase, as it is recorded:</p>`+phraseDemo())
  +sec(2,'Notation key','The letters, arrows and numbers I use.',
    `<div class="keys"><div class="kp"><h4>Actions</h4><div class="grp">Offence</div><div class="acts">${act('a','Attack','o')}${act('f','Flèche','o')}${act('n','Compound','o')}${act('e','Attack in prep','o')}${act('s','Reprise','o')}${act('m','Remise','o')}</div><div class="grp">Defence</div><div class="acts">${act('p','Parry','d')}${act('d','Pull short','d')}${act('c','Counterattack','d')}</div><div class="grp">Other</div><div class="acts">${act('l','Point in line','')}${act('/','Halt','')}${act('!','Red card','')}</div><p class="sub">Uppercase = landed, lowercase = missed.</p></div>`
    +`<div class="kp"><h4>Target line</h4><div class="tg">${tg.map(t=>`<div><b>${t[0]}</b>${t[1]}</div>`).join('')}</div><p class="sub">Drawn from my point of view. A pull short has no arrow; anything I did not record is left blank.</p></div>`
    +`<div class="kp"><h4>Piste position</h4><div class="ps"><div>−2</div><div>−1</div><div>0</div><div>+1</div><div>+2</div></div><div class="psl"><span>My end</span><span>Centre line</span><span>Opponent’s end</span></div><p class="sub">Written after the action. The last column of each phrase also holds the score after the touch (SR for Red, SG for Green) and the section score (SS).</p></div></div>`)
  +sec(3,'How each touch is classified','Every touch is credited to one action and one type of exchange.',
    `<div class="cls"><div class="kp"><b>Scoring action</b><p>The last successful attack by the fencer who scored.</p></div><div class="kp"><b>Parry-riposte</b><p>If that attack followed a successful parry.</p></div><div class="kp"><b>Pull short and hit</b><p>If that attack followed a pull short.</p></div></div>`
    +`<div class="exs"><div class="ex"><h4>Exchange I start</h4><div class="exg"><span>Red</span><i class="on"></i><span>Green</span><i></i></div><p>Only I attacked in the first column.</p></div><div class="ex"><h4>Simultaneous attack</h4><div class="exg"><span>Red</span><i class="on"></i><span>Green</span><i class="on g"></i></div><p>Both attacked in the first column.</p></div><div class="ex"><h4>Exchange they start</h4><div class="exg"><span>Red</span><i></i><span>Green</span><i class="on g"></i></div><p>Only my opponent attacked in the first column.</p></div></div>`)
  +sec(4,'Phases and sections','Two ways of splitting a bout, both set by the leading score.',
    stageScale()+`<p class="ex-lead" style="margin-top:12px"><b>Phases</b> (used on most charts): Early before either fencer reaches 8, Middle from 8 to 11, Closing from 12. <b>Sections I–IV</b> (dominance map): I until a fencer reaches 3, II until 8, III until 12, IV to the end. Each cell shows the touches I won ÷ touches fenced in that section.</p>`)
  +sec(5,'How the numbers are worked out','Definitions in the order they appear.',`<dl class="defs">${defs.map(d=>`<div><dt>${d[0]}</dt><dd>${d[1]}</dd></div>`).join('')}</dl>`)
  +sec(6,'About the data','What is in it and what to keep in mind.',`<ul class="notes">${dataNotes().map(n=>`<li>${n}</li>`).join('')}</ul>`);
}
/* the notes under "About the data": counted from the data, plus any DATA_NOTES the data file carries */
function dataNotes(){
  const annulled=GAMES.flat().filter(p=>!p.w).length,swapped=Object.entries(SWAPPED),mism=TOUCHES.filter(t=>t.mismatch),noResp=TOUCHES.filter(t=>!t.won&&!t.rt.length).length;
  const disagree=[...swapped.map(([g,l])=>`In Game ${+g+1} the score marks of ${l.length} consecutive touches were swapped and I followed the actions.`),
    ...mism.map(t=>`In Game ${t.g+1}, touch ${t.i+1}, the score disagreed with the case of the actions and I followed the score.`)];
  return [`Every figure is counted from all ${NB} bout${NB===1?'':'s'}. Charts and tables that show bouts one by one (the bout grid, lead at the break, results in date order, rating gap, dominance by section, the trend lines and the Raw data tab) show only the last ${BOUT_WINDOW} bouts by date.`,
    `${NB} bout${NB===1?'':'s'} to ${Math.max(...FINALS.flat())}, notated by hand: ${TOUCHES.length} scored phrases.${annulled?` ${annulled} annulled phrase${annulled===1?' is':'s are'} not counted.`:''}`,
    'I am Red in every bout. Every figure on this site is counted from the phrases in the Raw data tab.',
    ...(disagree.length?[disagree.join(' ')]:[]),
    ...(noResp?[`${noResp} conceded touch${noResp===1?' has':'es have'} no Red action recorded. ${noResp===1?'It stays':'They stay'} in as “no recorded response”.`]:[]),
    ...NOTES,
    'Percentages built on fewer than about 20 samples are directional only, and those bars are hatched.',
    'Opponent handedness, relative height, relative age, rating compared with mine on the day, level and bout date are shown for each bout in the Raw data tab and used on the Overview, Offence and Defence tabs.',
    'Opponent groups are tiny (often 2 or 3 bouts), so every comparison by opponent type is a pointer, not a conclusion. A red warning on a card means there are too few bouts for accurate analysis.',
    'Bouts are in date order for trend charts; bouts on the same day keep their game-number order.'];
}
