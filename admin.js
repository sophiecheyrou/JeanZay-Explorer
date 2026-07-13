(() => {
  'use strict';
  const C=window.JZE_CONFIG,$=(s)=>document.querySelector(s);
  const toast=(m)=>{const e=$('#toast');e.textContent=m;e.classList.add('is-visible');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('is-visible'),2200)};
  async function apiGet(params){const u=new URL(C.apiUrl);Object.entries(params).forEach(([k,v])=>u.searchParams.set(k,v));const r=await fetch(u,{redirect:'follow'});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}
  async function refresh(){
    $('#adminApiStatus').textContent='Vérification en cours…';
    try{
      const ping=await apiGet({action:'ping'});
      $('#adminApiStatus').textContent=ping.ok===false?'Le backend répond avec une erreur.':'Backend connecté et opérationnel.';
      const data=await apiGet({action:'admin',pin:C.adminCode});
      const teams=data.teams||data.equipes||[],proofs=data.proofs||data.preuves||[],returns=data.returns||data.retours||[];
      $('#adminTeams').textContent=Array.isArray(teams)?teams.length:'—';$('#adminProofs').textContent=Array.isArray(proofs)?proofs.length:'—';$('#adminReturns').textContent=Array.isArray(returns)?returns.length:'—';
      $('#adminSummary').innerHTML=`<p><b>Service :</b> ${escapeHtml(ping.service||C.appName)}</p><p><b>Version backend :</b> ${escapeHtml(ping.version||'non indiquée')}</p>`;
    }catch(err){$('#adminApiStatus').textContent='Connexion impossible au backend.';$('#adminSummary').innerHTML=`<p class="form-message">${escapeHtml(err.message)}</p>`;}
  }
  function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function login(){const code=$('#adminCodeInput').value.trim();if(code!==C.adminCode){$('#adminLoginMessage').textContent='Code incorrect.';return;}sessionStorage.setItem('jze_admin','1');showDashboard();toast('Accès organisateur ouvert');}
  function showDashboard(){const ok=sessionStorage.getItem('jze_admin')==='1';$('#adminLogin').classList.toggle('hidden',ok);$('#adminDashboard').classList.toggle('hidden',!ok);if(ok)refresh();}
  $('#adminLoginButton').addEventListener('click',login);$('#adminCodeInput').addEventListener('keydown',e=>{if(e.key==='Enter')login()});$('#adminLogoutButton').addEventListener('click',()=>{sessionStorage.removeItem('jze_admin');showDashboard()});$('#adminRefreshButton').addEventListener('click',refresh);showDashboard();
})();
