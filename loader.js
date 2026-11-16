/* loader.js: decides what to show.
   index.html            -> the roster (list of all fencers)
   index.html?f=JohnDoe  -> that fencer's dashboard: loads their data file, then the code that uses it, in order. */
(function(){
  const id=new URLSearchParams(location.search).get('f');
  const me=FENCERS.find(x=>x.id===id);
  if(!me){
    document.getElementById('rosterview').hidden=false;
    renderHome();
    return;
  }
  document.title=me.name+' · Sabre Dashboard';
  document.getElementById('dash').hidden=false;
  [me.file,'analysis.js','charts.js','pages.js','explain.js','app.js'].forEach(src=>{
    const s=document.createElement('script');
    s.src=src;s.async=false;                         /* async=false keeps them running in this order */
    document.body.appendChild(s);
  });
})();
