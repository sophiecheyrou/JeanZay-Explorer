(() => {
  'use strict';
  const C = window.JZE_CONFIG;
  const PLACES = window.JZE_PLACES;
  const routes = ['accueil','explorer','equipe','classement'];
  const state = {
    team: loadJSON('jze_team', null),
    proofs: loadJSON('jze_proofs', []),
    selectedMode: null,
    activeFilter: 'tous',
    installPrompt: null,
    activePlace: null,
    photoData: null,
    photoMime: 'image/jpeg'
  };
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];

  function loadJSON(key, fallback){ try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
  function saveJSON(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
  function saveTeam(team){ state.team=team; saveJSON('jze_team',team); renderTeam(); }
  function saveProofs(){ saveJSON('jze_proofs',state.proofs); renderTeamMetrics(); renderPlaces(); }
  function toast(message){ const el=$('#toast'); el.textContent=message; el.classList.add('is-visible'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('is-visible'),2800); }
  function escapeHtml(value){return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

  function route(){
    const raw=location.hash.replace('#','').toLowerCase();
    const current=routes.includes(raw)?raw:'accueil';
    $$('.screen').forEach(s=>s.classList.toggle('is-active',s.id===current));
    $$('.bottom-nav a').forEach(a=>a.classList.toggle('is-active',a.dataset.route===current));
    document.title=`${C.appName} — ${$(`#${current}`).dataset.title}`;
    window.scrollTo({top:0,behavior:'instant'});
    if(current==='classement') loadRanking();
  }

  function renderTeam(){
    const t=state.team, has=Boolean(t);
    $('#welcomeCard')?.classList.toggle('hidden',has);
    $('#teamReadyCard')?.classList.toggle('hidden',!has);
    $('#teamEmptyState').classList.toggle('hidden',has);
    $('#teamPanel').classList.toggle('hidden',!has);
    if(has){
      $('#teamPanelName').textContent=t.name;
      $('#teamPanelMeta').textContent=`Code d’équipe : ${t.code} · Mode : ${t.mode}`;
    }
    renderTeamMetrics();
  }

  function renderTeamMetrics(){
    const teamCode=state.team?.code;
    const teamProofs=teamCode ? state.proofs.filter(p=>p.teamCode===teamCode) : [];
    const unique=new Set(teamProofs.map(p=>String(p.placeId)));
    const pending=teamProofs.filter(p=>p.status==='pending').length;
    if($('#teamPlacesCount')) $('#teamPlacesCount').textContent=String(unique.size);
    if($('#teamPendingCount')) $('#teamPendingCount').textContent=String(pending);
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

  async function submitTeam(){
    const name=$('#teamNameInput').value.trim(), code=$('#teamCodeInput').value.trim().toUpperCase();
    if(name.length<2){$('#teamFormMessage').textContent='Saisissez un nom d’équipe.';return;}
    if(code.length<3){$('#teamFormMessage').textContent='Saisissez un code d’au moins 3 caractères.';return;}
    if(!state.selectedMode){$('#teamFormMessage').textContent='Choisissez un mode.';return;}
    const team={name,code,mode:state.selectedMode,updatedAt:new Date().toISOString()};
    $('#saveTeamButton').disabled=true; $('#teamFormMessage').textContent='Enregistrement…';
    try {
      const data=await apiPost({action:'register',team:JSON.stringify(team)});
      if(data && data.ok===false) throw new Error(data.error||'Enregistrement refusé');
      saveTeam(team); closeTeam(); toast('Équipe enregistrée et synchronisée');
    } catch(err) {
      saveTeam(team); closeTeam(); toast('Équipe enregistrée sur ce téléphone. Synchronisation à réessayer.');
    } finally { $('#saveTeamButton').disabled=false; $('#teamFormMessage').textContent=''; }
  }

  function renderFilters(){
    const labels={tous:'Tous',patrimoine:'Patrimoine',culture:'Culture',sport:'Sport',nature:'Nature',insolite:'Insolite',pratique:'Pratique'};
    $('#filters').innerHTML=Object.entries(labels).map(([key,label])=>`<button data-filter="${key}" class="${key==='tous'?'is-active':''}">${label}</button>`).join('');
  }

  function hasSubmitted(placeId){
    return Boolean(state.team && state.proofs.some(p=>p.teamCode===state.team.code && String(p.placeId)===String(placeId)));
  }

  function renderPlaces(){
    const list=state.activeFilter==='tous'?PLACES:PLACES.filter(p=>p.category===state.activeFilter);
    $('#placeCounter').textContent=`${list.length} lieu${list.length>1?'x':''}`;
    $('#placesGrid').innerHTML=list.map(p=>{
      const submitted=hasSubmitted(p.id);
      return `<button type="button" class="card place-card place-button ${submitted?'is-submitted':''}" data-place-id="${p.id}">
        <div class="place-emoji">${p.emoji}</div>
        <div class="place-content"><div class="place-title-row"><h3>${escapeHtml(p.name)}</h3>${submitted?'<span class="submitted-badge">Photo envoyée</span>':''}</div><p>${escapeHtml(p.description)}</p><div class="place-meta"><span>${escapeHtml(p.category)}</span><span>${escapeHtml(p.distance)}</span></div><span class="mission-link">${submitted?'Voir la mission':'Ouvrir la mission'} →</span></div>
      </button>`;
    }).join('');
  }

  function resetMissionPhoto(){
    state.photoData=null; state.photoMime='image/jpeg';
    $('#missionCameraInput').value='';
    $('#missionGalleryInput').value='';
    $('#photoPreview').removeAttribute('src');
    $('#photoPreviewWrap').classList.add('hidden');
    $('#photoSourceGrid').classList.remove('hidden');
    $('#sendProofButton').disabled=true;
    $('#sendProofButton').textContent='Envoyer la preuve';
    $('#uploadStatus').textContent='';
  }

  function openMission(placeId){
    const place=PLACES.find(p=>String(p.id)===String(placeId));
    if(!place) return;
    state.activePlace=place; resetMissionPhoto();
    $('#missionEmoji').textContent=place.emoji;
    $('#missionTitle').textContent=place.name;
    $('#missionDescription').textContent=place.description;
    $('#missionInstruction').textContent=place.mission || 'Prenez une photo de votre équipe sur place.';
    const noTeam=!state.team;
    $('#missionTeamWarning').classList.toggle('hidden',!noTeam);
    $('#takePhotoButton').disabled=noTeam;
    $('#choosePhotoButton').disabled=noTeam;
    $('#missionCameraInput').disabled=noTeam;
    $('#missionGalleryInput').disabled=noTeam;
    $('#missionModal').classList.add('is-open');$('#missionModal').setAttribute('aria-hidden','false');
  }
  function closeMission(){ $('#missionModal').classList.remove('is-open');$('#missionModal').setAttribute('aria-hidden','true'); resetMissionPhoto(); }

  function readFileAsDataURL(file){ return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=()=>reject(new Error('Lecture de la photo impossible')); r.readAsDataURL(file); }); }
  function loadImage(src){ return new Promise((resolve,reject)=>{ const img=new Image(); img.onload=()=>resolve(img); img.onerror=()=>reject(new Error('Image non reconnue')); img.src=src; }); }
  async function compressImage(file){
    const source=await readFileAsDataURL(file); const img=await loadImage(source);
    const max=1280; const scale=Math.min(1,max/Math.max(img.width,img.height));
    const canvas=document.createElement('canvas'); canvas.width=Math.max(1,Math.round(img.width*scale)); canvas.height=Math.max(1,Math.round(img.height*scale));
    canvas.getContext('2d',{alpha:false}).drawImage(img,0,0,canvas.width,canvas.height);
    return canvas.toDataURL('image/jpeg',0.72);
  }

  async function handlePhoto(file){
    if(!file) return;
    $('#uploadStatus').textContent='Préparation de la photo…'; $('#sendProofButton').disabled=true;
    try {
      state.photoData=await compressImage(file); state.photoMime='image/jpeg';
      $('#photoPreview').src=state.photoData; $('#photoPreviewWrap').classList.remove('hidden'); $('#photoSourceGrid').classList.add('hidden');
      $('#uploadStatus').textContent='Photo prête à être envoyée.'; $('#sendProofButton').disabled=false;
    } catch(err){ $('#uploadStatus').textContent=err.message; resetMissionPhoto(); }
  }

  async function sendProof(){
    if(!state.team){ toast('Créez d’abord votre équipe'); openTeam(); return; }
    if(!state.activePlace || !state.photoData) return;
    const button=$('#sendProofButton'); button.disabled=true; button.textContent='Envoi en cours…'; $('#uploadStatus').textContent='Connexion à Google Drive…';
    try {
      const payload={
        action:'submit',
        team:JSON.stringify(state.team),
        place:JSON.stringify({id:state.activePlace.id,name:state.activePlace.name}),
        photoBase64:state.photoData,
        mimeType:state.photoMime
      };
      const data=await apiPost(payload);
      if(!data || data.ok===false) throw new Error(data?.error||'Envoi refusé par le serveur');
      state.proofs.push({id:data.id||crypto.randomUUID?.()||String(Date.now()),teamCode:state.team.code,placeId:state.activePlace.id,placeName:state.activePlace.name,status:data.status||'pending',sentAt:new Date().toISOString()});
      saveProofs(); $('#uploadStatus').textContent='Photo reçue. Elle apparaît en attente de validation.'; button.textContent='Preuve envoyée ✓'; toast('Photo envoyée avec succès');
      setTimeout(closeMission,1200);
    } catch(err){
      $('#uploadStatus').textContent=`Échec de l’envoi : ${err.message}`; button.disabled=false; button.textContent='Réessayer l’envoi';
    }
  }

  async function apiGet(params){
    if(!C.apiUrl) throw new Error('URL Apps Script absente');
    const url=new URL(C.apiUrl);Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));
    const res=await fetch(url.toString(),{method:'GET',redirect:'follow',cache:'no-store'});if(!res.ok) throw new Error(`HTTP ${res.status}`);return res.json();
  }
  async function apiPost(params){
    if(!C.apiUrl) throw new Error('URL Apps Script absente');
    const body=new URLSearchParams(); Object.entries(params).forEach(([k,v])=>body.set(k,String(v)));
    const res=await fetch(C.apiUrl,{method:'POST',body,redirect:'follow'}); if(!res.ok) throw new Error(`HTTP ${res.status}`); return res.json();
  }
  function normalizeRanking(data){
    const rows=Array.isArray(data)?data:(data.ranking||data.data||[]);
    return rows.map((r,i)=>({name:r.equipe||r.team||r.name||`Équipe ${i+1}`,score:Number(r.valides??r.score??r.points??0),validated:Number(r.validated??r.valides??0),pending:Number(r.pending??0)})).sort((a,b)=>b.score-a.score||b.validated-a.validated);
  }
  async function loadRanking(){
    const status=$('#rankingStatus'),list=$('#rankingList');status.textContent='Connexion au classement…';list.innerHTML='';
    try{const data=await apiGet({action:'ranking',t:Date.now()});const rows=normalizeRanking(data);if(!rows.length){status.textContent='Aucun résultat pour le moment.';return;}status.textContent=`Actualisé à ${new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}`;list.innerHTML=rows.map((r,i)=>`<div class="ranking-row"><span class="rank-number">${i+1}</span><div><b>${escapeHtml(r.name)}</b><small>${r.validated} validée${r.validated>1?'s':''} · ${r.pending} en attente</small></div><strong>${r.score} lieu${r.score>1?'x':''}</strong></div>`).join('');}
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
    if(e.target.closest('[data-close-mission]'))closeMission();
    const mode=e.target.closest('[data-mode]');if(mode){state.selectedMode=mode.dataset.mode;$$('.mode-grid button').forEach(b=>b.classList.toggle('is-selected',b===mode));}
    const filter=e.target.closest('[data-filter]');if(filter){state.activeFilter=filter.dataset.filter;$$('[data-filter]').forEach(b=>b.classList.toggle('is-active',b===filter));renderPlaces();}
    const place=e.target.closest('[data-place-id]');if(place)openMission(place.dataset.placeId);
  });
  $('#saveTeamButton').addEventListener('click',submitTeam);
  $('#refreshRanking').addEventListener('click',loadRanking);
  $('#takePhotoButton').addEventListener('click',()=>$('#missionCameraInput').click());
  $('#choosePhotoButton').addEventListener('click',()=>$('#missionGalleryInput').click());
  $('#missionCameraInput').addEventListener('change',e=>handlePhoto(e.target.files?.[0]));
  $('#missionGalleryInput').addEventListener('change',e=>handlePhoto(e.target.files?.[0]));
  $('#changePhotoButton').addEventListener('click',()=>{
    resetMissionPhoto();
    $('#missionGalleryInput').click();
  });
  $('#sendProofButton').addEventListener('click',sendProof);
  $('#mapFrame').src=C.mapUrl;
  renderFilters();renderPlaces();renderTeam();route();setupInstall();registerSW();
})();
