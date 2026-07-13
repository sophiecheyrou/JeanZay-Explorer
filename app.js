(() => {
  'use strict';
  const C = window.JZE_CONFIG;
  const PLACES = window.JZE_PLACES;
  const routes = ['accueil','explorer','equipe','classement'];
  const state = { team: loadTeam(), selectedMode: null, activeFilter: 'tous', installPrompt: null };
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  function loadTeam(){ try{return JSON.parse(localStorage.getItem('jze_team')) || null;}catch{return null;} }
  function saveTeam(team){ state.team=team; localStorage.setItem('jze_team',JSON.stringify(team)); renderTeam(); }
  function toast(message){ const el=$('#toast'); el.textContent=message; el.classList.add('is-visible'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('is-visible'),2600); }

  function route(){
    const raw=location.hash.replace('#','').toLowerCase();
    const current=routes.includes(raw)?raw:'accueil';
    $$('.screen').forEach(s=>s.classList.toggle('is-active',s.id===current));
    $$('.bottom-nav a').forEach(a=>a.classList.toggle('is-active',a.dataset.route===current));
    document.title=`${C.appName} — ${$(`#${current}`).dataset.title}`;
    window.scrollTo({top:0,behavior:'instant'});
    if(current==='classement') loadRanking();
  }

  function countdown(){
    const now=Date.now(), start=new Date(C.startAt).getTime(), end=new Date(C.endAt).getTime();
    let target=start,label='Temps avant le rendez-vous';
    if(now>=start && now<end){target=end;label='Temps restant';}
    if(now>=end){$('#countdownLabel').textContent='Mission terminée';$('#countdownValue').textContent='00:00:00';return;}
    const sec=Math.max(0,Math.floor((target-now)/1000));
    const h=String(Math.floor(sec/3600)).padStart(2,'0'),m=String(Math.floor((sec%3600)/60)).padStart(2,'0'),s=String(sec%60).padStart(2,'0');
    $('#countdownLabel').textContent=label;$('#countdownValue').textContent=`${h}:${m}:${s}`;
  }

  function renderTeam(){
    const t=state.team, has=Boolean(t);
    $('#welcomeCard').classList.toggle('hidden',has);$('#teamReadyCard').classList.toggle('hidden',!has);
    $('#teamEmptyState').classList.toggle('hidden',has);$('#teamPanel').classList.toggle('hidden',!has);
    $('#homeTeamName').textContent=has?t.name:'Aucune équipe';$('#homeMode').textContent=has?(t.mode==='sportif'?'Sportif':'Touriste'):'—';
    if(has){
      $('#readyTeamName').textContent=t.name;$('#readyTeamMeta').textContent=`Code ${t.code} · Mode ${t.mode}`;
      $('#teamPanelName').textContent=t.name;$('#teamPanelMeta').textContent=`Code d’équipe : ${t.code} · Mode : ${t.mode}`;
    }
  }

  function openTeam(){
    state.selectedMode=state.team?.mode || null;
    $('#teamNameInput').value=state.team?.name || '';
    $('#teamCodeInput').value=state.team?.code || '';
    $('#teamFormMessage').textContent='';
    $$('.mode-grid button').forEach(b=>b.classList.toggle('is-selected',b.dataset.mode===state.selectedMode));
    $('#teamModal').classList.add('is-open');$('#teamModal').setAttribute('aria-hidden','false');
    setTimeout(()=>$('#teamNameInput').focus(),100);
  }
  function closeTeam(){ $('#teamModal').classList.remove('is-open');$('#teamModal').setAttribute('aria-hidden','true'); }
  function submitTeam(){
    const name=$('#teamNameInput').value.trim(), code=$('#teamCodeInput').value.trim().toUpperCase();
    if(name.length<2){$('#teamFormMessage').textContent='Saisissez un nom d’équipe.';return;}
    if(code.length<3){$('#teamFormMessage').textContent='Saisissez un code d’au moins 3 caractères.';return;}
    if(!state.selectedMode){$('#teamFormMessage').textContent='Choisissez un mode.';return;}
    saveTeam({name,code,mode:state.selectedMode,updatedAt:new Date().toISOString()});closeTeam();toast('Équipe enregistrée');
  }

  function renderFilters(){
    const labels={tous:'Tous',patrimoine:'Patrimoine',culture:'Culture',sport:'Sport',nature:'Nature',insolite:'Insolite',pratique:'Pratique'};
    $('#filters').innerHTML=Object.entries(labels).map(([key,label])=>`<button data-filter="${key}" class="${key==='tous'?'is-active':''}">${label}</button>`).join('');
  }
  function renderPlaces(){
    const list=state.activeFilter==='tous'?PLACES:PLACES.filter(p=>p.category===state.activeFilter);
    $('#placeCounter').textContent=`${list.length} lieu${list.length>1?'x':''}`;
    $('#placesGrid').innerHTML=list.map(p=>`<article class="card place-card"><div class="place-emoji">${p.emoji}</div><div><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.description)}</p><div class="place-meta"><span>${escapeHtml(p.category)}</span><span>${escapeHtml(p.distance)}</span></div></div></article>`).join('');
  }
  function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

  async function apiGet(params){
    if(!C.apiUrl) throw new Error('URL Apps Script absente');
    const url=new URL(C.apiUrl);Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));
    const res=await fetch(url.toString(),{method:'GET',redirect:'follow'});if(!res.ok) throw new Error(`HTTP ${res.status}`);return res.json();
  }
  function normalizeRanking(data){
    const rows=Array.isArray(data)?data:(data.ranking||data.data||[]);
    return rows.map((r,i)=>({name:r.equipe||r.team||r.name||`Équipe ${i+1}`,score:Number(r.valides??r.score??r.points??0)})).sort((a,b)=>b.score-a.score);
  }
  async function loadRanking(){
    const status=$('#rankingStatus'),list=$('#rankingList');status.textContent='Connexion au classement…';list.innerHTML='';
    try{const data=await apiGet({action:'ranking'});const rows=normalizeRanking(data);if(!rows.length){status.textContent='Aucun résultat validé pour le moment.';return;}status.textContent=`Actualisé à ${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`;list.innerHTML=rows.map((r,i)=>`<div class="ranking-row"><span class="rank-number">${i+1}</span><b>${escapeHtml(r.name)}</b><strong>${r.score} lieu${r.score>1?'x':''}</strong></div>`).join('');}
    catch(err){status.textContent='Classement momentanément indisponible.';list.innerHTML=`<p class="form-message">${escapeHtml(err.message)}</p>`;}
  }

  function setupInstall(){
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e;$('#installButton').hidden=false;});
    $('#installButton').addEventListener('click',async()=>{if(!state.installPrompt)return;state.installPrompt.prompt();await state.installPrompt.userChoice;state.installPrompt=null;$('#installButton').hidden=true;});
  }
  function registerSW(){if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./service-worker.js').catch(()=>{}));}

  window.addEventListener('hashchange',route);
  document.addEventListener('click',e=>{
    const open=e.target.closest('[data-open-team]');if(open){e.preventDefault();openTeam();}
    if(e.target.closest('[data-close-modal]'))closeTeam();
    const mode=e.target.closest('[data-mode]');if(mode){state.selectedMode=mode.dataset.mode;$$('.mode-grid button').forEach(b=>b.classList.toggle('is-selected',b===mode));}
    const filter=e.target.closest('[data-filter]');if(filter){state.activeFilter=filter.dataset.filter;$$('[data-filter]').forEach(b=>b.classList.toggle('is-active',b===filter));renderPlaces();}
  });
  $('#saveTeamButton').addEventListener('click',submitTeam);$('#refreshRanking').addEventListener('click',loadRanking);
  $('#mapFrame').src=C.mapUrl;
  renderFilters();renderPlaces();renderTeam();route();countdown();setInterval(countdown,1000);setupInstall();registerSW();
})();
