// Appli Banc2Touche (code d'origine, monté par React dans src/App.js)
// Généré depuis la version installable : ne pas modifier à la main sans reporter dans la source.
/* eslint-disable */
export function startBanc2Touche(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const PC=' %';
const pct=(a,b)=>b?Math.round(100*a/b)+PC:'–';
const todayISO=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const fmtDate=iso=>{if(!iso)return '';const d=new Date(iso+'T12:00:00');return isNaN(d)?iso:d.toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'})};
const hhmm=ts=>new Date(ts).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
const numSort=(a,b)=>(parseInt(a.num,10)||999)-(parseInt(b.num,10)||999);
const countBy=(arr,f)=>arr.reduce((o,x)=>{const k=f(x);o[k]=(o[k]||0)+1;return o},{});
const slug=s=>String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'match';

/* ---------- Stockage local (sécurisé) ---------- */
const LS={
  ok:false,
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},
  del(k){try{localStorage.removeItem(k)}catch(e){}}
};
try{localStorage.setItem('hb.t','1');localStorage.removeItem('hb.t');LS.ok=true}catch(e){LS.ok=false}

/* ---------- Référentiels handball ---------- */
const POSTS=[['GB','Gardien'],['AG','Ailier gauche'],['ARG','Arrière gauche'],['DC','Demi-centre'],['ARD','Arrière droit'],['AD','Ailier droit'],['PIV','Pivot']];
const POSTNAME=Object.fromEntries(POSTS);
const RES=[['goal','But'],['saved','Arrêté'],['miss','Hors cadre'],['post','Poteau'],['blocked','Contré']];
const RESL=Object.fromEntries(RES);
const RTXT={goal:'But',saved:'Tir arrêté',miss:'Tir hors cadre',post:'Poteau',blocked:'Tir contré'};
const TYPEL={shot:'Tir',loss:'Perte de balle',rec:'Récupération',ast:'Passe décisive'};
const PH=[['placed','Placée','Attaque placée'],['ca','Contre-attaque','Contre-attaque (1re vague)'],['second','Montée de balle','Montée de balle (2e vague)'],['quick','Engagement rapide','Engagement rapide'],['seven','7 m','Jet de 7m'],['empty','Cage vide','Cage vide']];
const PHS=Object.fromEntries(PH.map(p=>[p[0],p[1]])), PHL=Object.fromEntries(PH.map(p=>[p[0],p[2]]));
const DEFS=['0-6','1-5','3-2-1','3-3','4-2','5+1','4+2','Homme à homme','Autre'];
const ZONES=[['AIL-G','Aile gauche',1.3,3.4],['6M-G','6 m gauche',5.2,7.6],['6M-C','6 m centre',10,8.1],['6M-D','6 m droite',14.8,7.6],['AIL-D','Aile droite',18.7,3.4],['9M-G','9 m gauche',4.2,11],['9M-C','9 m centre',10,11.2],['9M-D','9 m droite',15.8,11],['LOIN','Tir lointain',10,13.7],['7M','Jet de 7 m',10,7]];
const ZL=Object.fromEntries(ZONES.map(z=>[z[0],z[1]]));
// Zones dans le but, notées vue du tireur
const GZ=[['HG','Haut gauche'],['HD','Haut droite'],['BG','Bas gauche'],['BD','Bas droite'],['LOB','Lob'],['CONT','Contournement'],['SOUS','Sous le gardien']];
const GZL=Object.fromEntries(GZ);
const GZT={HG:'en haut à gauche',HD:'en haut à droite',BG:'en bas à gauche',BD:'en bas à droite',LOB:'en lob',CONT:'en contournant le gardien',SOUS:'sous le gardien'};
const GZ_OLD={1:'HG',2:'LOB',3:'HD',4:'HG',5:'SOUS',6:'HD',7:'BG',8:'SOUS',9:'BD'};
const cz=e=>{const c=e&&e.cage;if(c==null||c==='')return null;return GZL[c]?c:(GZ_OLD[+c]||null)};
const mirrorZ=k=>({HG:'HD',HD:'HG',BG:'BD',BD:'BG'})[k]||k;
const SIDEL={dom:'À domicile',ext:'À l’extérieur',neutre:'Terrain neutre'};
const SIDES={dom:'Domicile',ext:'Extérieur',neutre:'Terrain neutre'};
const NTAGS=['Attaque','Défense','Gardien','Adversaire','À revoir'];
const HALFL={1:'1re mi-temps',2:'2e mi-temps'};

function zoneAt(x,y){
  const px=Math.max(8.5,Math.min(11.5,x)), d=Math.hypot(x-px,Math.max(0,y));
  if(y<5.2&&d<9.8&&(x<4.6||x>15.4)) return x<10?'AIL-G':'AIL-D';
  if(d<9) return x<8?'6M-G':(x>12?'6M-D':'6M-C');
  if(d<12.5) return x<7.3?'9M-G':(x>12.7?'9M-D':'9M-C');
  return 'LOIN';
}

/* ---------- Modèle ---------- */
function newMatch(players){
  return {kind:'match',id:'m_'+uid(),createdAt:Date.now(),updatedAt:Date.now(),opponent:'',date:todayISO(),venue:'',competition:'',side:'dom',
    players:(players||[]).map(p=>({id:p.id||uid(),num:p.num||'',name:p.name||'',pos:p.pos||'',alt:p.alt||[]})),
    lineup:{},scout:{def:'',attack:'',gkNum:'',gkNote:'',danger:[],keys:''},oppNums:[],events:[],notes:[]};
}
function normalize(m){
  const b=newMatch([]);
  m=Object.assign(b,m||{});
  m.scout=Object.assign({def:'',attack:'',gkNum:'',gkNote:'',danger:[],keys:''},m.scout||{});
  ['players','events','notes','oppNums'].forEach(k=>{if(!Array.isArray(m[k]))m[k]=[]});
  if(!Array.isArray(m.scout.danger))m.scout.danger=[];
  if(!m.lineup||typeof m.lineup!=='object')m.lineup={};
  if(!SIDEL[m.side])m.side='dom';
  m.events.forEach(e=>{if(e.cage!=null&&!GZL[e.cage])e.cage=GZ_OLD[+e.cage]||null});
  return m;
}
/* ---------- État ---------- */
const PHASES=[
  ['avant','Avant','Avant le match',[['match','Feuille'],['compo','Compo'],['scout','Adversaire']]],
  ['pendant','Pendant','Pendant le match',[['stats','Stats'],['gk','Gardien'],['notes','Notes'],'Mi-temps',['bilan','Bilan'],['cage','Cage'],['tactic','Tactique']]],
  ['apres','Après','Après le match',[['report','Rapport'],['history','Historique']]]];
const phaseOf=v=>(PHASES.find(p=>p[3].some(it=>Array.isArray(it)&&it[0]===v))||PHASES[1])[0];
const UI0={act:null,autoPoss:true,esp:null,czBy:'zone',czEsp:'',bilBy:'zone',czSide:'opp',czZone:'',czPer:0,czView:'gk',czGk:'',autoSwap:true,half:1,team:'us',p:null,zone:null,xy:null,cage:null,phase:'placed',oppDef:'0-6',gk:'',pick:null,gkSide:'us',gkSel:'',gkPer:0,noteTag:'',noteFilter:'',noteDraft:'',noteMin:'',bilPer:1,repPer:0,confirmDel:null,tdel:null,tsel:null,tconf:false};
const S={m:null,mode:'match',tview:'team',tp:null,view:'stats',lastV:{avant:'match',pendant:'stats',apres:'report'},ui:Object.assign({},UI0),tac:null,sync:'local'};
const MC={};               // copies des matchs en mémoire
let IDX=LS.get('hb.idx',[]); if(!Array.isArray(IDX))IDX=[];

const pById=id=>S.m.players.find(p=>p.id===id);
const pLab=(id,short)=>{const p=pById(id);if(!p)return 'joueur retiré';return p.num?'n°'+p.num+(short||!p.name?'':' '+p.name):(p.name||'Joueur')};
const ptag=p=>p.num||String(p.name||'?').split(/\s+/).map(w=>w.charAt(0)).join('').slice(0,2).toUpperCase();
const gks=()=>S.m.players.filter(p=>p.pos==='GB'||altOf(p).includes('GB')).sort((a,b)=>((a.pos==='GB'?0:1)-(b.pos==='GB'?0:1))||numSort(a,b));
function saveUI(){LS.set('hb.ui',{mode:S.mode,tview:S.tview,tp:S.tp,view:S.view,lastV:S.lastV,autoSwap:S.ui.autoSwap,autoPoss:S.ui.autoPoss,half:S.ui.half,oppDef:S.ui.oppDef,gk:S.ui.gk})}
function goView(v){
  const before=phaseOf(S.view);if(phaseOf(v)==='apres'&&before!=='apres')maybeSnap('fin de match');S.mode='match';S.view=v;S.lastV[phaseOf(v)]=v;S.ui.confirmDel=null;
  if(v==='bilan')S.ui.bilPer=S.ui.half;
  saveUI();renderRail();if(phaseOf(v)!==before)renderHeader();renderView();$('#main').scrollTop=0;
}
function defaultGK(){const m=S.m;if(m.lineup.GB&&pById(m.lineup.GB))return m.lineup.GB;const g=gks()[0];return g?g.id:''}

/* ---------- Sauvegarde ---------- */
let DB=null,UIDU=null,DL=null,cloudTimer=null,cloudChain=Promise.resolve(),retryTimer=null;
const dirty=new Set();
const SYNC={local:'Enregistré sur cet appareil',cloud:'Enregistré',pending:'Enregistrement…',error:'Hors ligne · gardé sur l’iPad'};
function setSync(s){S.sync=s;const el=$('#sync');if(el){el.dataset.s=s;el.lastChild.textContent=SYNC[s]}}
function col(){return DB.collection('data/users/'+UIDU)}
function scoreOf(m){let us=0,op=0;for(const e of m.events){if(e.type==='shot'&&e.res==='goal'){if(e.team==='us')us++;else op++}}return{us,op}}
function upsertIdx(m){
  const sc=scoreOf(m);const row={id:m.id,opponent:m.opponent,date:m.date,updatedAt:m.updatedAt,us:sc.us,op:sc.op,n:m.events.length};
  const i=IDX.findIndex(x=>x.id===m.id);if(i<0)IDX.push(row);else IDX[i]=row;LS.set('hb.idx',IDX);
}
function storeLocal(m){MC[m.id]=m;LS.set('hb.m.'+m.id,m)}
function getMatch(id){return MC[id]||LS.get('hb.m.'+id,null)}
function touch(){
  const m=S.m;m.updatedAt=Date.now();storeLocal(m);
  if(m.example)return;
  upsertIdx(m);markChange();
  if(DB){dirty.add(m.id);setSync('pending');clearTimeout(cloudTimer);cloudTimer=setTimeout(flushCloud,1400)}
}
function flushCloud(){
  if(!DB)return;
  const ids=[...dirty];dirty.clear();
  ids.forEach(id=>{
    cloudChain=cloudChain.then(()=>{const m=id==='team'?TEAM:getMatch(id);if(!m)return;return col().doc(id).set(JSON.parse(JSON.stringify(m)))})
      .then(()=>{if(!dirty.size&&S.sync!=='error')setSync('cloud')},()=>{dirty.add(id);setSync('error');clearTimeout(retryTimer);retryTimer=setTimeout(()=>{setSync('pending');flushCloud()},15000)});
  });
  cloudChain.then(()=>{if(!dirty.size)setSync('cloud')});
}
window.addEventListener('online',()=>{if(DB&&dirty.size){setSync('pending');flushCloud()}});

async function initCloud(){
  const c=window.claude;if(!c||!c.use)return;
  c.use('downloads').then(d=>{DL=d}).catch(()=>{});
  try{
    const [db,user]=await Promise.all([c.use('db'),c.use('user')]);
    if(!db||!user)return;
    const id=await user.id();if(!id)return;
    DB=db;UIDU=id;setSync('pending');
    const snap=await col().get();
    const seen=new Set();let changed=false,teamSeen=false;
    for(const d of snap.docs){
      const v=d.data();if(!v)continue;
      if(d.id==='team'){
        teamSeen=true;
        if(Array.isArray(v.players)&&!v.example&&(TEAM.example||TEAM.fresh||(v.updatedAt||0)>(TEAM.updatedAt||0))){TEAM=v;LS.set('hb.team',TEAM);changed=true}
        else if(!TEAM.example&&(TEAM.updatedAt||0)>(v.updatedAt||0))dirty.add('team');
        continue;
      }
      if(v.kind!=='match')continue;
      seen.add(v.id);
      const loc=getMatch(v.id);
      if(!loc||(v.updatedAt||0)>(loc.updatedAt||0)){const nm=normalize(v);storeLocal(nm);upsertIdx(nm);changed=true;if(S.m&&S.m.id===nm.id)S.m=nm}
      else if((loc.updatedAt||0)>(v.updatedAt||0))dirty.add(v.id);
    }
    if(!teamSeen&&!TEAM.example)dirty.add('team');
    IDX.filter(x=>!seen.has(x.id)).forEach(x=>{if(getMatch(x.id))dirty.add(x.id)});
    // Stockage local indisponible : reprendre le dernier match du compte
    if(!LS.ok&&IDX.length&&!S.m.opponent&&!S.m.events.length){const last=IDX.slice().sort((a,b)=>b.updatedAt-a.updatedAt)[0];const m=getMatch(last.id);if(m){S.m=normalize(m);changed=true}}
    if(dirty.size)flushCloud();else setSync('cloud');
    if(changed)renderAll();else if(S.view==='history'||S.mode==='team')renderView();
  }catch(e){if(DB)setSync('error')}
}

/* ---------- Toast / modale ---------- */
let toastT=null;
function toast(msg,action){
  clearTimeout(toastT);
  const root=$('#toast-root');
  root.innerHTML=`<div class="toast" role="status"><span>${esc(msg)}</span>${action?`<button id="toast-act">${esc(action.label)}</button>`:''}</div>`;
  if(action)$('#toast-act').onclick=()=>{action.fn();root.innerHTML=''};
  toastT=setTimeout(()=>{root.innerHTML=''},action?6000:2800);
}
function showModal(title,text,hint){
  $('#modal-root').innerHTML=`<div class="modal"><div class="card" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="card-head"><h2>${esc(title)}</h2><button class="icon-btn" data-act="closeModal" aria-label="Fermer">×</button></div><p class="hint">${esc(hint||'Sélectionne tout le texte puis copie-le.')}</p><textarea id="modal-txt" class="in" readonly style="min-height:260px;font-size:13px">${esc(text)}</textarea></div></div>`;
  const t=$('#modal-txt');t.focus();t.select();
}
function copyText(text,msg,title){
  const fallback=()=>showModal(title||'Copier',text);
  try{navigator.clipboard.writeText(text).then(()=>toast(msg),fallback)}catch(e){fallback()}
}

/* ---------- Écran allumé ---------- */
let wl=null,wantWake=false;
async function toggleWake(){
  wantWake=!wantWake;
  if(wantWake){try{wl=await navigator.wakeLock.request('screen');wl.addEventListener('release',()=>{wl=null;renderHeader()});toast('L’écran reste allumé tant que la page est ouverte')}
    catch(e){wantWake=false;wl=null;toast('Impossible ici : règle « Verrouillage auto » sur Jamais dans les réglages de l’iPad.')}}
  else{try{if(wl)await wl.release()}catch(e){}wl=null}
  renderHeader();
}
document.addEventListener('visibilitychange',()=>{if(wantWake&&!wl&&document.visibilityState==='visible'&&navigator.wakeLock){navigator.wakeLock.request('screen').then(x=>{wl=x;renderHeader()}).catch(()=>{})}});

/* ---------- Terrain SVG ---------- */
function courtSVG(o){
  o=o||{};const crop=o.crop!==false,H=crop?14.4:20,vh=crop?16.1:22.5;
  return `<svg ${o.id?`id="${o.id}"`:''} class="${o.cls||'court'}" viewBox="-0.7 -1.5 21.4 ${vh}" ${o.act?`data-act="${o.act}"`:''} role="img" aria-label="${esc(o.label||'Demi-terrain de handball')}">
  <rect class="c-edge" x="-0.7" y="-1.5" width="21.4" height="${vh}"/>
  <rect class="c-floor" x="0" y="0" width="20" height="${H}"/>
  <path class="c-area" d="M2.5 0 A6 6 0 0 0 8.5 6 L11.5 6 A6 6 0 0 0 17.5 0 Z"/>
  <path class="c-line" d="M2.5 0 A6 6 0 0 0 8.5 6 L11.5 6 A6 6 0 0 0 17.5 0"/>
  <path class="c-dash" d="M0 2.958 A9 9 0 0 0 8.5 9 L11.5 9 A9 9 0 0 0 20 2.958"/>
  <path class="c-line" d="M9.5 7 H10.5 M9.85 4 H10.15"/>
  <path class="c-line" d="M0 ${H} V0 H20 V${H}${crop?'':' M0 20 H20'}"/>
  <rect class="c-goal" x="8.5" y="-0.9" width="3" height="0.9"/>
  ${o.extra||''}</svg>`;
}
function dotsSVG(shots,team){
  return shots.filter(e=>e.x!=null&&e.y!=null).map(e=>{
    let c='off';if(e.res==='goal')c=team==='us'?'win':'lose';else if(e.res==='saved')c=team==='us'?'lose':'win';
    return `<circle class="dt ${c}" cx="${e.x}" cy="${e.y}" r=".42"/>`}).join('');
}
function legend(team){
  return team==='us'
    ?'<div class="legend"><span><i class="win"></i>But</span><span><i class="lose"></i>Arrêté</span><span><i class="off"></i>Hors cadre, poteau ou contré</span></div>'
    :'<div class="legend"><span><i class="lose"></i>But encaissé</span><span><i class="win"></i>Arrêté</span><span><i class="off"></i>Hors cadre, poteau ou contré</span></div>';
}

/* ---------- Calculs ---------- */
const evs=(m,half)=>half?m.events.filter(e=>e.half===half):m.events;
const shotsOf=(L,team)=>L.filter(e=>e.team===team&&e.type==='shot');
const goals=a=>a.filter(e=>e.res==='goal').length;
const cnt=(L,team,type)=>L.filter(e=>e.team===team&&e.type===type).length;
function gkStat(L,side,gkId){
  const sh=shotsOf(L,side==='us'?'opp':'us').filter(e=>(e.res==='goal'||e.res==='saved')&&(!gkId||e.gk===gkId));
  const s=sh.filter(e=>e.res==='saved').length;return{t:sh.length,s,g:sh.length-s};
}
function zoneRows(arr){const o={};arr.forEach(e=>{if(!e.zone)return;const z=o[e.zone]||(o[e.zone]={z:e.zone,t:0,g:0});z.t++;if(e.res==='goal')z.g++});return Object.values(o)}
function playerRows(m,L){
  return m.players.slice().sort(numSort).map(p=>{
    const mine=L.filter(e=>e.team==='us'&&e.p===p.id),sh=mine.filter(e=>e.type==='shot'),s7=sh.filter(e=>e.phase==='seven');
    return{p,t:sh.length,g:goals(sh),t7:s7.length,g7:goals(s7),ast:mine.filter(e=>e.type==='ast').length,loss:mine.filter(e=>e.type==='loss').length,rec:mine.filter(e=>e.type==='rec').length};
  });
}
function oppNums(){
  const m=S.m,set=new Set(m.oppNums.filter(Boolean));m.scout.danger.forEach(d=>{if(d.num)set.add(String(d.num))});
  return [...set].sort((a,b)=>(parseInt(a,10)||999)-(parseInt(b,10)||999));
}
function evText(e){
  const who=e.team==='us'?(e.p?pLab(e.p):'Nous'):(e.p?'Adv. n°'+e.p:'Adversaire');
  const what=e.type==='shot'?RTXT[e.res]:(e.team==='opp'&&e.type==='loss'?'Perte adverse':TYPEL[e.type]);
  const b=[what,who];if(e.zone)b.push(e.zone);if(e.esp)b.push('espace '+e.esp);if(cz(e))b.push(GZL[cz(e)].toLowerCase());if(e.phase&&e.phase!=='placed'&&e.type==='shot'&&!(e.phase==='seven'&&e.zone==='7M'))b.push(PHS[e.phase]);
  return b.join(' · ');
}
function insights(m,L){
  const out=[],us=shotsOf(L,'us'),op=shotsOf(L,'opp');
  const ph=(a,k)=>a.filter(e=>k.includes(e.phase));
  const pl=ph(us,['placed']);if(pl.length>=3)out.push(`En attaque placée, nous marquons ${goals(pl)} tirs sur ${pl.length} (${pct(goals(pl),pl.length)}).`);
  const fast=ph(us,['ca','second','quick']);if(fast.length)out.push(`Sur jeu rapide (contre-attaque, montée de balle, engagement rapide) : ${goals(fast)} buts sur ${fast.length} tirs.`);
  const of=ph(op,['ca','second','quick']);if(goals(of)>=2)out.push(`${goals(of)} buts encaissés sur jeu rapide adverse.`);
  const zw=zoneRows(us.filter(e=>e.zone!=='7M')).filter(z=>z.t>=3).sort((a,b)=>a.g/a.t-b.g/b.t);
  if(zw.length&&zw[0].g/zw[0].t<.4)out.push(`Notre zone la moins efficace : ${ZL[zw[0].z]} (${zw[0].g}/${zw[0].t}).`);
  const zo=zoneRows(op).sort((a,b)=>b.g-a.g);if(zo.length&&zo[0].g>=2)out.push(`L’adversaire marque surtout depuis : ${ZL[zo[0].z]} (${zo[0].g} buts).`);
  const losses=L.filter(e=>e.team==='us'&&e.type==='loss');
  if(losses.length>=3){const by=Object.entries(countBy(losses.filter(e=>e.p),e=>e.p)).sort((a,b)=>b[1]-a[1])[0];out.push(`${losses.length} pertes de balle${by&&by[1]>=2?`, dont ${by[1]} pour ${pLab(by[0])}`:''}.`)}
  const ag=op.filter(e=>e.res==='goal'&&cz(e));
  if(ag.length>=3){const by=Object.entries(countBy(ag,cz)).sort((a,b)=>b[1]-a[1])[0];if(by[1]>=2)out.push(`Buts encaissés le plus souvent ${GZT[by[0]]} (vue du tireur) : ${by[1]}.`)}
  const ok=us.filter(e=>e.res==='goal'&&cz(e));
  if(ok.length>=3){const by=Object.entries(countBy(ok,cz)).sort((a,b)=>b[1]-a[1])[0];if(by[1]>=2)out.push(`Le gardien adverse prend le plus de buts ${GZT[by[0]]} (vue du tireur) : ${by[1]}.`)}
  return out;
}

/* ---------- Export relevé ---------- */
const CSVH=["N°","Temps vidéo (mm:ss)","Mi-temps","Chrono match (mm:ss)","Équipe","Événement","Joueur (n°)","Résultat","Zone terrain","Zone cage","Phase de jeu","Type de tir","Type (perte / récup / faute)","Rapport de force","Système défensif adverse","Gardien (n°) — tirs adverses","Commentaire"];
function csvRows(m){
  return m.events.slice().sort((a,b)=>a.ts-b.ts).map((e,i)=>{
    const num=e.team==='us'?(pById(e.p)?pById(e.p).num:''):(e.p||'');
    const gk=e.gk&&pById(e.gk)?pById(e.gk).num:'';
    return [i+1,'',e.half,'',e.team==='us'?'Nous':'Adversaire',TYPEL[e.type],num,e.type==='shot'?RESL[e.res]:'',e.zone||'',cz(e)?GZL[cz(e)]:'',e.type==='shot'?PHL[e.phase]||'':'',e.phase==='seven'?'7m':'','','',e.team==='us'?(e.def||''):'',gk,''];
  });
}
function buildCSV(m){const q=v=>{v=String(v);return /[;"\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v};return [CSVH,...csvRows(m)].map(r=>r.map(q).join(';')).join('\r\n')}
function buildTSV(m){return [CSVH,...csvRows(m)].map(r=>r.map(v=>String(v).replace(/[\t\n]/g,' ')).join('\t')).join('\n')}
function notesText(m){
  const head=`Notes — ${m.opponent?'vs '+m.opponent:'match'} — ${fmtDate(m.date)}`;
  return [head,...m.notes.slice().sort((a,b)=>a.ts-b.ts).map(n=>`${HALFL[n.half]||''} · ${hhmm(n.ts)}${n.min?' · '+n.min+'e min':''}${n.tag?' · ['+n.tag+']':''} — ${n.text}`)].join('\n');
}
// Enregistre un fichier : via Claude dans le site, via la feuille de partage ou un téléchargement dans l’appli installée
async function saveFile(name,blob,okMsg){
  if(DL){
    try{const r=await DL.save({filename:name,data:blob});if(r&&r.status==='saved'){toast(okMsg);return 'saved'}return 'cancel'}
    catch(err){const c=err&&err.code;if(c==='declined')return 'cancel';if(c==='rate_limited'){toast('Une fenêtre d’enregistrement est déjà ouverte.');return 'cancel'}DL=null}
  }
  if(window.claude)return false;
  try{const f=new File([blob],name,{type:blob.type});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:name});return 'saved'}}
  catch(e){if(e&&e.name==='AbortError')return 'cancel'}
  try{const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);toast(okMsg);return 'saved'}catch(e){}
  return false;
}
async function exportCsv(){
  const m=S.m,name=`releve_${m.date||todayISO()}_${slug(m.opponent||'match')}.csv`;
  const ok=await saveFile(name,new Blob(['\ufeff'+buildCSV(m)],{type:'text/csv;charset=utf-8'}),'Relevé enregistré : '+name);
  if(!ok)showModal('Relevé du match',buildTSV(m),'Copie ce texte et colle-le dans l’onglet « Relevé match » du classeur, ou envoie-le à Claude.');
}

/* ---------- Actions de match ---------- */
function commit(type,res){
  const u=S.ui,m=S.m;
  const e={id:uid(),ts:Date.now(),half:u.half,team:u.team,type,p:u.team==='us'&&u.p&&pById(u.p)?u.p:null};
  if(type==='shot'){
    let zone=u.zone,x=u.xy?u.xy.x:null,y=u.xy?u.xy.y:null;
    if(u.phase==='seven'){zone='7M';x=10;y=7}
    Object.assign(e,{res,zone,x,y,cage:res==='goal'||res==='saved'?(u.cage||null):null,phase:u.phase,esp:u.phase==='seven'?null:(u.esp||null)});
    if(u.team==='opp')e.gk=u.gk||null;
  }
  if(u.team==='us')e.def=u.oppDef;
  m.events.push(e);touch();
  u.p=null;u.zone=null;u.xy=null;u.cage=null;u.esp=null;u.phase='placed';u.act=null;
  const swap=u.autoPoss&&(type==='loss'||res==='goal');
  if(swap)u.team=u.team==='us'?'opp':'us';
  renderView();renderHeader();
  toast(evText(e)+(swap?(u.team==='us'?' · à nous':' · à l’adversaire'):''),{label:'Annuler',fn:()=>{removeEv(e.id);if(swap){S.ui.team=e.team;renderView()}}});
}
function record(){const a=S.ui.act;if(!a){toast('Choisis d’abord l’action : but, arrêt, perte de balle…');return}commit(a==='loss'?'loss':'shot',a==='loss'?undefined:a)}
function removeEv(id,withUndo){
  const m=S.m,i=m.events.findIndex(e=>e.id===id);if(i<0)return;
  const [e]=m.events.splice(i,1);touch();renderView();renderHeader();
  if(withUndo)toast('Action supprimée',{label:'Rétablir',fn:()=>{m.events.splice(i,0,e);touch();renderView();renderHeader()}});
}
function courtTap(ev,svg){
  if(!svg||!svg.getScreenCTM)return;
  const p=svg.createSVGPoint();p.x=ev.clientX;p.y=ev.clientY;const r=p.matrixTransform(svg.getScreenCTM().inverse());
  if(r.y<0)return;
  const x=Math.round(Math.max(0,Math.min(20,r.x))*10)/10,y=Math.round(Math.min(14.2,r.y)*10)/10;
  S.ui.xy={x,y};S.ui.zone=zoneAt(x,y);if(S.ui.phase==='seven')S.ui.phase='placed';renderView();
}
function addOpp(){
  const i=$('#opp-add');const n=((i&&i.value)||'').replace(/\D/g,'').slice(0,2);if(!n){if(i)i.focus();return}
  if(!S.m.oppNums.includes(n))S.m.oppNums.push(n);S.ui.p=n;touch();renderView();
}
function addNote(){
  const u=S.ui,txt=(u.noteDraft||'').trim();if(!txt){toast('Écris la note avant de l’ajouter.');const t=$('#note-txt');if(t)t.focus();return}
  S.m.notes.push({id:uid(),ts:Date.now(),half:u.half,min:String(u.noteMin||'').replace(/\D/g,'').slice(0,2),tag:u.noteTag,text:txt});
  u.noteDraft='';u.noteMin='';touch();renderView();toast('Note ajoutée');
}
function resetSel(){Object.assign(S.ui,{act:null,esp:null,p:null,zone:null,xy:null,cage:null,phase:'placed',pick:null,gkSel:'',confirmDel:null})}
function startNew(){
  S.m=newMatch([]);S.mode='match';
  LS.set('hb.cur',S.m.id);resetSel();S.ui.half=1;S.ui.gk='';touch();S.view='match';S.lastV.avant='match';saveUI();renderAll();$('#main').scrollTop=0;
  toast('Nouveau match créé');
}
function openMatch(id){
  const m=getMatch(id);if(!m){toast('Ce match n’est pas disponible sur cet appareil.');return}
  S.m=normalize(m);S.mode='match';LS.set('hb.cur',id);resetSel();S.ui.gk=defaultGK();S.view='report';S.lastV.apres='report';saveUI();renderAll();$('#main').scrollTop=0;
}
function deleteMatch(id){
  BKM.delM=BKM.delM||{};BKM.delM[id]=Date.now();saveBKM();markChange();
  LS.del('hb.m.'+id);delete MC[id];IDX=IDX.filter(x=>x.id!==id);LS.set('hb.idx',IDX);dirty.delete(id);
  if(DB)col().doc(id).delete().catch(()=>{});
  S.ui.confirmDel=null;
  if(S.m.id===id){const nx=IDX.slice().sort((a,b)=>b.updatedAt-a.updatedAt)[0];const m=nx&&getMatch(nx.id);if(m){S.m=normalize(m);LS.set('hb.cur',m.id)}else{S.m=newMatch([]);LS.set('hb.cur',S.m.id);touch()}}
  renderAll();toast('Match supprimé');
}

/* ---------- Tableau tactique ---------- */
const ATT={'3-3':{A1:[1.2,1.6],A2:[5,11.2],A3:[10,12.8],A4:[15,11.2],A5:[18.8,1.6],A6:[10,7.3]},'2-4':{A1:[1.2,1.6],A2:[6,11.6],A3:[8.6,7.3],A4:[14,11.6],A5:[18.8,1.6],A6:[11.4,7.3]}};
const DEFP={'0-6':{D1:[1.6,2.2],D2:[4.4,5.6],D3:[8.1,6.7],D4:[11.9,6.7],D5:[15.6,5.6],D6:[18.4,2.2]},
  '1-5':{D1:[1.8,2.4],D2:[5.2,6],D3:[10,6.8],D4:[14.8,6],D5:[18.2,2.4],D6:[10,10.6]},
  '3-2-1':{D1:[2.4,2.6],D2:[6,9.2],D3:[10,6.8],D4:[14,9.2],D5:[17.6,2.6],D6:[10,11.8]},
  '3-3':{D1:[4,5.6],D2:[4.6,10.4],D3:[10,6.8],D4:[15.4,10.4],D5:[16,5.6],D6:[10,11.6]},
  '5+1':{D1:[1.8,2.4],D2:[5.2,6],D3:[10,6.8],D4:[14.8,6],D5:[18.2,2.4],D6:[13.6,11.2]}};
const ALAB={A1:'AG',A2:'ARG',A3:'DC',A4:'ARD',A5:'AD',A6:'PIV'};
function defaultTac(mode){
  const p={};Object.entries(ATT['3-3']).forEach(([k,v])=>p[k]=v.slice());Object.entries(DEFP['0-6']).forEach(([k,v])=>p[k]=v.slice());
  p.DG=[10,.75];p.B=[10.9,13.5];
  return{mode:mode||'move',pieces:p,strokes:[],showA:true,showD:true,att:'3-3',def:'0-6'};
}
function saveTac(){LS.set('hb.tac',S.tac)}
function applyPreset(kind,v){
  const t=S.tac,src=kind==='A'?ATT[v]:DEFP[v];if(!src)return;
  Object.entries(src).forEach(([k,xy])=>t.pieces[k]=xy.slice());
  if(kind==='A'){t.att=v;t.pieces.B=[t.pieces.A3[0]+.9,t.pieces.A3[1]+.7];t.showA=true}else{t.def=v;t.showD=true}
  saveTac();renderView();
}
function pieceSVG(id,x,y){
  let cls='a',lab=ALAB[id]||'';
  if(id[0]==='A'){const pl=pById(S.m.lineup[ALAB[id]]);if(pl&&pl.num)lab=pl.num}
  else if(id==='DG')return `<g class="pc g" data-pc="DG" transform="translate(${x} ${y})"><rect x="-.75" y="-.55" width="1.5" height="1.1" rx=".25"/><text y=".28">GB</text></g>`;
  else if(id==='B')return `<g class="pc b" data-pc="B" transform="translate(${x} ${y})"><circle r=".46"/></g>`;
  else{cls='d';lab=id.slice(1)}
  return `<g class="pc ${cls}" data-pc="${id}" transform="translate(${x} ${y})"><circle r=".88"/><text y=".28">${esc(lab)}</text></g>`;
}
function bindTactic(){
  const svg=$('#tac');if(!svg)return;
  let drag=null,draw=null;
  const pt=e=>{const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const r=p.matrixTransform(svg.getScreenCTM().inverse());return{x:Math.round(r.x*100)/100,y:Math.round(r.y*100)/100}};
  const dstr=pts=>'M'+pts.map(p=>p.x+' '+p.y).join(' L');
  svg.addEventListener('pointerdown',e=>{
    if(drag||draw)return;
    const t=S.tac,g=e.target.closest('[data-pc]');
    if(t.mode==='move'){if(!g)return;drag={id:g.dataset.pc,g};}
    else{const p=pt(e);const el=document.createElementNS('http://www.w3.org/2000/svg','path');el.setAttribute('class',t.mode==='pass'?'st-pass':'st-run');el.setAttribute('marker-end',`url(#${t.mode==='pass'?'mPass':'mRun'})`);svg.querySelector('#strokes').appendChild(el);draw={pts:[p],el,type:t.mode};}
    try{svg.setPointerCapture(e.pointerId)}catch(_){}
    e.preventDefault();
  });
  svg.addEventListener('pointermove',e=>{
    if(drag){const p=pt(e);const x=Math.max(-.4,Math.min(20.4,p.x)),y=Math.max(-1.2,Math.min(20.6,p.y));drag.g.setAttribute('transform',`translate(${x} ${y})`);S.tac.pieces[drag.id]=[x,y];}
    else if(draw){const p=pt(e);if(draw.type==='pass'){draw.pts=[draw.pts[0],p]}else{const l=draw.pts[draw.pts.length-1];if(Math.hypot(p.x-l.x,p.y-l.y)>.15)draw.pts.push(p)}if(draw.pts.length>1)draw.el.setAttribute('d',dstr(draw.pts));}
  });
  const end=()=>{
    if(drag){saveTac();drag=null}
    if(draw){const a=draw.pts[0],b=draw.pts[draw.pts.length-1];if(draw.pts.length<2||Math.hypot(b.x-a.x,b.y-a.y)<.5){draw.el.remove()}else{S.tac.strokes.push({type:draw.type,d:dstr(draw.pts)});saveTac();const u=$('#tundo');if(u)u.disabled=false}draw=null}
  };
  svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
}

/* ---------- Vues ---------- */
const ICONS={
  match:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v3H9zM8.5 11h7M8.5 15h5"/>',
  compo:'<circle cx="12" cy="5" r="2"/><circle cx="5" cy="11" r="2"/><circle cx="19" cy="11" r="2"/><circle cx="8" cy="18.5" r="2"/><circle cx="16" cy="18.5" r="2"/>',
  scout:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
  stats:'<path d="M5 20V11M10 20V4M15 20v-7M20 20v-4"/>',
  gk:'<path d="M3 20V5h18v15"/><path d="M7.5 5v15M12 5v15M16.5 5v15M3 10h18M3 15h18" stroke-width="1" opacity=".6"/>',
  notes:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
  tactic:'<circle cx="6" cy="18" r="2.2"/><path d="M8 16c3-3 4-8 10-9"/><path d="M15 4.6l3.2 2.4-2.6 3.1"/>',
  cage:'<path d="M4 19V6h16v13"/><path d="M9.3 6v13M14.7 6v13M4 10.3h16M4 14.6h16" stroke-width="1" opacity=".55"/><circle cx="6.6" cy="16.8" r="1.2" fill="currentColor"/><circle cx="17.4" cy="8.2" r="1.2" fill="currentColor"/>',
  bilan:'<circle cx="12" cy="13" r="8"/><path d="M12 5v8h8"/><path d="M9.5 2h5"/>',
  report:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 17v-4M12 17V8M16 17v-6"/>',
  team:'<circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.4"/><path d="M15.6 14.2c2.4-.2 4.3 1.3 4.9 4.3"/>',
  backup:'<path d="M12 4v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M4 15v4h16v-4"/>',
  season:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7.5 14h3M13.5 14h3M7.5 17.5h3"/>',
  history:'<rect x="3" y="4" width="18" height="5" rx="1"/><path d="M5 9v10h14V9M10 13h4"/>'
};
const B2T_MARK='<svg viewBox="0 0 64 64"><defs><clipPath id="b2tc"><rect width="64" height="64" rx="13"/></clipPath></defs><g clip-path="url(#b2tc)"><rect width="64" height="64" fill="#2C337F"/><rect y="55" width="64" height="9" fill="#FDC513"/></g><text x="32" y="42" text-anchor="middle" font-family="Barlow Condensed,Arial Narrow,sans-serif" font-style="italic" font-weight="800" font-size="33" fill="#FFFFFF">B<tspan fill="#FDC513">2</tspan>T</text></svg>';
const ICON_MATCH='<circle cx="12" cy="12" r="8.5"/><path d="M5.2 8.6c3 1.1 4.6 3.9 4.3 7.6M18.8 8.6c-3 1.1-4.6 3.9-4.3 7.6M8.7 4.2c1.7 2 5 2 6.6 0"/>';
function renderTop(){
  const live=S.mode==='match'&&phaseOf(S.view)==='pendant';
  $('#top').innerHTML=`<span class="logo" aria-hidden="true">${B2T_MARK}</span><b class="wm" aria-label="Banc2Touche">Banc<em>2</em>Touche</b>
  <div class="tabs" role="tablist" aria-label="Sections">${[['team','Effectif',ICONS.team],['match','Match',ICON_MATCH]].map(([k,l,ic])=>`<button role="tab" data-act="mode" data-v="${k}" aria-selected="${S.mode===k}"><svg viewBox="0 0 24 24" aria-hidden="true">${ic}</svg>${l}</button>`).join('')}</div>
  ${APP?`${(BKM.lastChange||BKM.lastExport)?`<button class="bkchip ${needBackup()?'need':''}" data-act="goBackup">${needBackup()?'Sauvegarde à faire':'Sauvegardé '+relTime(BKM.lastExport)}</button>`:''}<div class="sync" id="sync" data-s="${S.sync}" hidden><i></i><span></span></div>`:`<div class="sync" id="sync" data-s="${S.sync}"><i></i><span>${SYNC[S.sync]}</span></div>`}
  ${navigator.wakeLock&&(live||wl)?`<button class="wake" data-act="wake" aria-pressed="${!!wl}" aria-label="${wl?'Écran maintenu allumé':'Garder l’écran allumé'}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M12 8.2v3.6M9.6 9.6l1.3 1.3M14.4 9.6l-1.3 1.3"/></svg><span class="wl">${wl?'Écran maintenu allumé':'Garder l’écran allumé'}</span></button>`:''}`;
}
function renderRail(){
  if(S.mode==='team'){
    const cur=S.tview==='profile'?'team':S.tview;
    $('#rail').innerHTML=`<div class="grp">Effectif</div>`+TEAM_NAV.map(([k,l])=>`<button class="nav" data-act="tgo" data-v="${k}" ${cur===k?'aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>${l}</button>`).join('');
    return;
  }
  const ph=PHASES.find(p=>p[0]===phaseOf(S.view));
  $('#rail').innerHTML=`<div class="grp">${ph[2]}</div>`+
  ph[3].map(it=>typeof it==='string'?`<div class="grp sub">${it}</div>`:`<button class="nav" data-act="go" data-v="${it[0]}" ${S.view===it[0]?'aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[it[0]]}</svg>${it[1]}</button>`).join('');
}
function renderHeader(){
  renderTop();
  const h=$('#head');
  if(S.mode==='team'){h.hidden=true;h.innerHTML='';return}
  h.hidden=false;
  const m=S.m,ph=phaseOf(S.view),sub=[fmtDate(m.date),SIDES[m.side]||'',m.competition].filter(Boolean).map(esc).join(' · ');
  h.innerHTML=`<div class="phases" role="group" aria-label="Phase du match">${PHASES.map(([k,l],i)=>`<button data-act="stage" data-v="${k}" aria-pressed="${ph===k}"><small>${i+1}</small>${l}</button>`).join('')}</div>
  <div class="mp"><b>${m.opponent?'vs '+esc(m.opponent):'Match sans adversaire'}</b><span>${sub}</span></div>
  ${ph==='pendant'?`<div class="seg" role="group" aria-label="Mi-temps en cours">${[1,2].map(h=>`<button data-act="half" data-v="${h}" aria-pressed="${S.ui.half===h}" aria-label="${HALFL[h]}">${h===1?'1re MT':'2e MT'}</button>`).join('')}</div>`:''}`;
}
function banner(){return S.m.example?`<div class="banner"><span>Match d’exemple pour découvrir l’outil : rien n’est enregistré dans ton historique.</span><button class="btn primary" data-act="newMatch">Commencer un vrai match</button></div>`:''}
function perChips(act,cur,withMatch){return `<div class="seg" role="group">${(withMatch?[[0,'Match']]:[]).concat([[1,'1re mi-temps'],[2,'2e mi-temps']]).map(([v,l])=>`<button data-act="${act}" data-v="${v}" aria-pressed="${cur===v}">${l}</button>`).join('')}</div>`}
function tbl(head,rows,left){left=left||[0];const c=i=>left.includes(i)?' class="l"':'';return `<div class="tw"><table><thead><tr>${head.map((h,i)=>`<th${c(i)}>${h}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(r=>`<tr>${r.map((v,i)=>`<td${c(i)}>${v}</td>`).join('')}</tr>`).join(''):`<tr><td class="l muted" colspan="${head.length}">Aucune donnée pour l’instant.</td></tr>`}</tbody></table></div>`}

function convTiles(){
  const m=S.m,sel=new Set(m.players.map(p=>p.id));
  if(m.example)return `<div class="tiles conv">${m.players.slice().sort(numSort).map(p=>`<div class="tile ${p.pos==='GB'?'gk':''}"><b>${esc(p.num)}</b><span>${esc(p.name)}</span></div>`).join('')}</div><p class="hint">Dans un vrai match, tu choisis ici les joueurs de ton effectif.</p>`;
  if(TEAM.example||!TEAM.players.length)return `<p class="hint">Ajoute d’abord tes joueurs dans l’onglet Effectif, ou importe une sauvegarde. Tu pourras ensuite les sélectionner ici d’une touche.</p><div class="row"><button class="btn primary" data-act="mode" data-v="team">Aller à l’effectif</button></div>`;
  const ps=TEAM.players.slice().sort(teamSort),full=m.players.length>=16,extra=m.players.filter(p=>!tById(p.id));
  return `<div class="tiles conv">${ps.map(p=>{const on=sel.has(p.id);return `<button class="tile ${p.poste==='GB'?'gk':''} ${p.photo?'hasph':''}" data-act="convoke" data-id="${p.id}" aria-pressed="${on}" ${!on&&full?'disabled':''}>${p.photo?`<img class="tav" src="${p.photo}" alt="">`:''}<b>${esc(p.num||ptag({name:tShort(p)}))}</b><span>${esc(tShort(p))}${p.poste?' · '+p.poste:''}</span></button>`}).join('')}</div>${extra.length?`<p class="hint">Aussi sur la feuille, hors effectif : ${extra.map(p=>esc('n°'+p.num+' '+p.name)).join(', ')}.</p>`:''}`;
}
function vMatch(){
  const m=S.m,n=m.players.length;
  return `${banner()}<div class="pane-head"><div><h1>Feuille de match</h1><p class="hint">Les infos du match. Les joueurs se choisissent dans l’onglet Compo.</p></div><button class="btn" data-act="newMatch">Nouveau match</button></div>
  <div class="grid2">
    <div class="card"><h2>Match</h2>
      <label class="f">Adversaire<input id="f-opp" class="in" data-bind="opponent" value="${esc(m.opponent)}" placeholder="Nom de l’équipe adverse" autocomplete="off"></label>
      <div class="row2"><label class="f">Date<input id="f-date" type="date" class="in" data-bind="date" value="${esc(m.date)}"></label><label class="f">Salle<input id="f-venue" class="in" data-bind="venue" value="${esc(m.venue)}" placeholder="Gymnase" autocomplete="off"></label></div>
      <label class="f">Compétition ou catégorie<input id="f-comp" class="in" data-bind="competition" value="${esc(m.competition)}" placeholder="Ex. U17 régional, journée 6" autocomplete="off"></label>
      <div class="f">Lieu<div class="seg">${Object.entries(SIDEL).map(([v,l])=>`<button data-act="side" data-v="${v}" aria-pressed="${m.side===v}">${l}</button>`).join('')}</div></div>
    </div>
    <div class="card"><div class="card-head"><h2>Joueurs sélectionnés<span class="count">${n}/16</span></h2><button class="btn ${n?'':'primary'}" data-act="go" data-v="compo">${n?'Modifier la sélection':'Choisir les joueurs'}</button></div>
      ${n?`<ul class="convlist">${m.players.slice().sort(numSort).map(p=>{const ph=photoOf(p.id);return `<li>${ph?`<img class="pav" src="${ph}" alt="">`:`<span class="pav none">${esc(ptag(p))}</span>`}<span>${esc(pLab(p.id))}</span><small>${esc(p.pos||'')}</small></li>`}).join('')}</ul>`:'<p class="hint">Aucun joueur sélectionné pour l’instant.</p>'}
    </div>
  </div>`;
}

function vCompo(){
  const m=S.m;
  return `${banner()}<div class="pane-head"><div><h1>Sélection des joueurs</h1><p class="hint">Touche un joueur de ton effectif pour l’ajouter au match ou l’en retirer (16 au maximum).</p></div>${m.example?'':'<button class="btn ghost" data-act="mode" data-v="team">Gérer l’effectif</button>'}</div>
  <div class="card"><div class="card-head"><h2>Joueurs sélectionnés<span class="count">${m.players.length}/16</span></h2></div>
    ${convTiles()}
  </div>`;
}

function vScout(){
  const s=S.m.scout;
  const posOpts=v=>`<option value="">Poste</option>${POSTS.map(([c,l])=>`<option value="${c}" ${v===c?'selected':''}>${c} · ${l}</option>`).join('')}`;
  const cards=s.danger.map(d=>`<div class="dg">
    <div class="dg-top">
      <label class="f" for="dn-${d.id}">N°<input id="dn-${d.id}" class="in num" inputmode="numeric" maxlength="2" data-dg="${d.id}" data-k="num" value="${esc(d.num)}"></label>
      <label class="f" for="dp-${d.id}">Poste<select id="dp-${d.id}" class="in" data-dg="${d.id}" data-k="pos">${posOpts(d.pos)}</select></label>
      <button class="icon-btn" data-act="delDanger" data-id="${d.id}" aria-label="Retirer le n°${esc(d.num)}">×</button>
    </div>
    <label class="f" for="dt-${d.id}">Points forts et comment le défendre<textarea id="dt-${d.id}" class="in dg-txt" data-dg="${d.id}" data-k="note" placeholder="Ex. gaucher, tir en suspension aux 9 m, aime rentrer côté gauche. Avancer sur lui dès qu’il reçoit.">${esc(d.note)}</textarea></label>
  </div>`).join('');
  return `${banner()}<div class="pane-head"><div><h1>Fiche adversaire</h1><p class="hint">Ce que tu sais de l’équipe d’en face. Les consignes clés reviennent dans le bilan de mi-temps.</p></div></div>
  <div class="grid2 even">
    <div class="card"><h2>Leur jeu</h2>
      <div class="f">Défense attendue<div class="chips">${DEFS.map(d=>`<button class="chip" data-act="scoutDef" data-v="${esc(d)}" aria-pressed="${s.def===d}">${esc(d)}</button>`).join('')}</div></div>
      <label class="f" for="sc-att">Attaque : enclenchements, jeu rapide, habitudes<textarea id="sc-att" class="in" data-bind="scout.attack" placeholder="Ex. croisés arrière gauche / demi-centre, engagement rapide">${esc(s.attack)}</textarea></label>
    </div>
    <div class="card"><h2>Consignes clés</h2>
      <label class="f" for="sc-keys">Une consigne par ligne<textarea id="sc-keys" class="in" style="min-height:200px" data-bind="scout.keys" placeholder="Ex. Fermer le tir du n°8 en avançant">${esc(s.keys)}</textarea></label>
    </div>
  </div>
  <div class="card"><div class="card-head"><h2>Joueurs dangereux<span class="count">${s.danger.length}</span></h2><button class="btn primary" data-act="addDanger">Ajouter un joueur</button></div>
    <div class="dgs">
      <div class="dg gkcard">
        <div class="dg-top" style="grid-template-columns:84px minmax(0,1fr)">
          <label class="f" for="sc-gkn">N°<input id="sc-gkn" class="in num" inputmode="numeric" maxlength="2" data-bind="scout.gkNum" value="${esc(s.gkNum)}"></label>
          <div class="f">Poste<div class="in gk-pos">GB · Gardien</div></div>
        </div>
        <label class="f" for="sc-gkt">Points forts et points faibles du gardien<textarea id="sc-gkt" class="in dg-txt" data-bind="scout.gkNote" placeholder="Ex. fort sur les tirs hauts, plus lent en bas côté opposé">${esc(s.gkNote)}</textarea></label>
      </div>
      ${cards}
    </div>
    ${s.danger.length?'':'<p class="hint">Ajoute les joueurs de champ à surveiller avec « Ajouter un joueur ».</p>'}
  </div>`;
}

const PH_LIVE=[['placed','Attaque placée'],['ca','Contre-attaque'],['second','Montée de balle'],['quick','Engagement rapide'],['seven','7 m']];
const ACTS=[['goal','But'],['saved','Arrêté'],['miss','Hors cadre'],['post','Poteau'],['blocked','Contré'],['loss','Perte de balle']];
const photoOf=id=>{const t=tById(id);return t&&t.photo?t.photo:''};
function goalPicker(sel,off){
  const b=k=>`<button data-act="cage" data-v="${k}" aria-pressed="${sel===k}" aria-label="${GZL[k]}" ${off?'disabled':''}>${k==='CONT'?'Contour&shy;nement':GZL[k]}</button>`;
  return `<div class="gpick" role="group" aria-label="Zone dans le but, vue du tireur"><div class="gp-goal">${['HG','HD','BG','BD'].map(b).join('')}</div><div class="gp-sp">${['LOB','CONT','SOUS'].map(b).join('')}</div></div>`;
}
function vStats(){
  const m=S.m,u=S.ui,us=u.team==='us',sc=scoreOf(m);
  if(!u.gk||!pById(u.gk))u.gk=defaultGK();
  const loss=u.act==='loss',seven=u.phase==='seven',noGoal=loss||(u.act&&!['goal','saved'].includes(u.act));
  const labels=ZONES.filter(z=>z[0]!=='7M').map(z=>`<text class="zl ${u.zone===z[0]?'on':''}" x="${z[2]}" y="${z[3]}">${z[0]}</text>`).join('');
  const mk=u.xy?`<circle class="mk" cx="${u.xy.x}" cy="${u.xy.y}" r=".55"/>`:'';
  const actL=u.act?(loss?'Perte de balle':RTXT[u.act]):null;
  const recap=[actL,us&&u.p&&pById(u.p)?pLab(u.p):(!us&&u.gk&&pById(u.gk)&&!loss?'face à '+pLab(u.gk):null),seven?'Jet de 7 m':(u.zone?ZL[u.zone]:null),u.esp&&!seven?'espace '+u.esp:null,u.cage?GZL[u.cage].toLowerCase():null,u.phase!=='placed'&&!seven&&!loss?PHS[u.phase].toLowerCase():null].filter(Boolean);
  const feed=m.events.slice(-6).reverse();
  const teamName=us?'Nous':'Adversaire';
  const av=id=>{const ph=photoOf(id);return ph?`<img class="pav" src="${ph}" alt="">`:''};
  const tiles=us
    ?(m.players.length?`<div class="ptiles">${m.players.slice().sort(numSort).map(p=>`<button class="ptile ${p.pos==='GB'?'gk':''} ${p.num?'':'nonum'}" data-act="selP" data-id="${p.id}" aria-pressed="${u.p===p.id}"><b>${av(p.id)}${esc(ptag(p))}</b><span>${esc(p.name)}</span></button>`).join('')}</div>`:'<p class="hint">Sélectionne des joueurs dans Compo pour attribuer les actions.</p>')
    :(gks().length?`<div class="ptiles">${gks().map(p=>`<button class="ptile gk ${p.num?'':'nonum'}" data-act="selGk" data-id="${p.id}" aria-pressed="${u.gk===p.id}"><b>${av(p.id)}${esc(ptag(p))}</b><span>${esc(p.name)}</span></button>`).join('')}</div>`:'<p class="hint">Aucun gardien sélectionné pour ce match.</p>');
  return `${banner()}<div class="lv ${us?'':'is-opp'}">
  <section class="card lv-team">
    <div class="seg big" role="group" aria-label="Équipe qui a le ballon"><button data-act="team" data-v="us" aria-pressed="${us}">Nous</button><button class="opp" data-act="team" data-v="opp" aria-pressed="${!us}">Adversaire</button></div>
    <div class="score" aria-label="Buts relevés"><span class="lab">Buts relevés</span><b class="us">${sc.us}</b><b class="muted">–</b><b class="op">${sc.op}</b></div>
    <button class="chip swap" data-act="autoPoss" aria-pressed="${u.autoPoss}" title="Le ballon change d’équipe tout seul après un but ou une perte de balle">Possession auto (but, perte)</button>
    <label class="f lv-def" for="st-def">Défense adverse<select id="st-def" class="in" data-ui="oppDef">${DEFS.map(d=>`<option ${u.oppDef===d?'selected':''}>${esc(d)}</option>`).join('')}</select></label>
  </section>
  <section class="card lv-act"><div class="card-head"><h2><span class="step">1</span>Action · <span class="who">${teamName}</span></h2></div>
    <div class="acts">${ACTS.map(([k,l])=>`<button class="act ${k}" data-act="pickAct" data-v="${k}" aria-pressed="${u.act===k}">${l}</button>`).join('')}</div>
    <div class="phchips" role="group" aria-label="Phase de jeu">${PH_LIVE.map(([k,l])=>`<button class="chip" data-act="phase" data-v="${k}" aria-pressed="${u.phase===k}" ${loss&&k==='seven'?'disabled':''}>${l}</button>`).join('')}</div>
  </section>
  <section class="card lv-players"><div class="card-head"><h2><span class="step">2</span>${us?'Joueur':'Notre gardien'}</h2><span class="hint">${us?'Facultatif':'Face au tir'}</span></div>${tiles}</section>
  <section class="card lv-where"><div class="card-head"><h2><span class="step">3</span>Secteur et espace</h2><span class="hint">Facultatif</span></div>
    <div class="lv-wgrid">
      <div class="lv-svg ${loss?'off':''}">${courtSVG({act:loss?'':'court',id:'zpick',extra:labels+mk,label:'Choix du secteur de tir'})}</div>
      <div class="lv-wside">
        <div class="espchips" role="group" aria-label="Espace de tir, de gauche à droite vu du tireur"><span class="lab">Espace</span>${ESP.map(k=>`<button class="chip" data-act="esp" data-v="${k}" aria-pressed="${u.esp===k}" ${seven||loss?'disabled':''}>${k}</button>`).join('')}</div>
        <div class="lv-goalrec">
          <div class="f"><span class="lab">Dans le but · vue du tireur</span>${goalPicker(u.cage,noGoal)}</div>
          <div class="lv-rec">
            <div class="sel">${recap.length?esc(recap.join(' · ')):'<span class="ph">Choisis l’action, puis le joueur et l’endroit</span>'}</div>
            <div class="row"><button class="btn primary rec" data-act="record" ${u.act?'':'disabled'}>Enregistrer</button>${recap.length||u.phase!=='placed'?'<button class="btn ghost sm" data-act="clearSel">Effacer</button>':''}</div>
          </div>
        </div>
      </div>
    </div>
  </section>
  <section class="card lv-feed"><div class="card-head"><h2>Dernières actions</h2><button class="btn ghost sm" data-act="undo" ${m.events.length?'':'disabled'}>Annuler la dernière</button></div>
    <ul class="feed">${feed.map(e=>`<li><i class="dot ${e.team}"></i><span>${esc(evText(e))}</span><small>${e.half===1?'1re':'2e'}</small><button class="icon-btn" data-act="delEv" data-id="${e.id}" aria-label="Supprimer">×</button></li>`).join('')||'<li><span class="muted">Aucune action relevée.</span></li>'}</ul>
  </section>
  </div>`;
}

function vGK(){
  const m=S.m,u=S.ui,side=u.gkSide,L=evs(m,u.gkPer);
  const shooter=side==='us'?'opp':'us';
  let shots=shotsOf(L,shooter);if(side==='us'&&u.gkSel)shots=shots.filter(e=>e.gk===u.gkSel);
  const on=shots.filter(e=>e.res==='goal'||e.res==='saved'),sv=on.filter(e=>e.res==='saved').length;
  const off=shots.length-on.length;
  const cell=k=>{const c=on.filter(e=>cz(e)===k),s=c.filter(e=>e.res==='saved').length,t=c.length;
    const bg=t?`background:color-mix(in srgb,color-mix(in srgb,var(--good) ${Math.round(100*s/t)}%,var(--bad)) 32%,var(--surface))`:'';
    return `<div style="${bg}"><small>${GZL[k]}</small><b>${t?pct(s,t):'–'}</b><span>${t?`${s} arr. / ${t}`:'aucun tir'}</span></div>`};
  const cells=`<div class="heat">${['HG','HD','BG','BD'].map(cell).join('')}</div><div class="heat-sp">${['LOB','CONT','SOUS'].map(cell).join('')}</div>`;
  const noCage=on.filter(e=>!cz(e)).length;
  const zr=ZONES.map(z=>{const a=on.filter(e=>e.zone===z[0]);if(!a.length)return null;const s=a.filter(e=>e.res==='saved').length;return[z[1],a.length,s,a.length-s,pct(s,a.length)]}).filter(Boolean);
  const who=side==='us'?(u.gkSel?pLab(u.gkSel):'Tous nos gardiens'):('Gardien adverse'+(m.scout.gkNum?' n°'+esc(m.scout.gkNum):''));
  return `${banner()}<div class="pane-head"><div><h1>Stats gardien</h1><p class="hint">Calculé sur les tirs cadrés (buts et arrêts) relevés dans Stats. Cage vue du tireur.</p></div>
    <div class="seg" role="group">${[['us','Nos gardiens'],['opp','Gardien adverse']].map(([v,l])=>`<button ${v==='opp'?'class="opp" ':''}data-act="gkSide" data-v="${v}" aria-pressed="${side===v}">${l}</button>`).join('')}</div></div>
  <div class="row">${perChips('gkPer',u.gkPer,true)}${side==='us'?`<div class="chips"><button class="chip" data-act="gkSel" data-v="" aria-pressed="${!u.gkSel}">Tous</button>${gks().map(p=>`<button class="chip" data-act="gkSel" data-v="${p.id}" aria-pressed="${u.gkSel===p.id}">${esc(pLab(p.id))}</button>`).join('')}</div>`:''}</div>
  <div class="grid2 fx gkg">
    <div class="card"><span class="lab">${esc(who)}</span><div class="big">${pct(sv,on.length)}</div><p class="hint">${sv} arrêt${sv>1?'s':''} sur ${on.length} tir${on.length>1?'s':''} cadré${on.length>1?'s':''}${off?` · ${off} tir${off>1?'s':''} non cadré${off>1?'s':''} ou contré${off>1?'s':''}`:''}</p>
      <div class="heatwrap" aria-label="Arrêts par zone du but">${cells}</div>${noCage?`<p class="hint">${noCage} tir${noCage>1?'s':''} cadré${noCage>1?'s':''} sans zone de cage renseignée.</p>`:''}
    </div>
    <div class="card"><h2>D’où viennent les tirs</h2>${courtSVG({extra:dotsSVG(shots,shooter),label:'Carte des tirs'})}${legend(shooter)}
      ${tbl(['Zone de tir','Cadrés','Arrêts','Buts','% arrêts'],zr)}</div>
  </div>`;
}

function vNotes(){
  const m=S.m,u=S.ui;
  const list=m.notes.filter(n=>!u.noteFilter||n.tag===u.noteFilter).slice().sort((a,b)=>b.ts-a.ts);
  return `${banner()}<div class="pane-head"><div><h1>Notes</h1><p class="hint">Observations rapides pendant le match, rangées par mi-temps.</p></div></div>
  <div class="grid2 fx">
    <div class="card"><h2>Nouvelle note · ${HALFL[u.half]}</h2>
      <textarea id="note-txt" class="in" placeholder="Ex. ailier droit libre à chaque croisé à gauche">${esc(u.noteDraft)}</textarea>
      <div class="f">Thème<div class="chips">${NTAGS.map(t=>`<button class="chip" data-act="noteTag" data-v="${t}" aria-pressed="${u.noteTag===t}">${t}</button>`).join('')}</div></div>
      <div class="row"><label class="f" for="note-min" style="flex-direction:row;align-items:center;gap:8px">Minute de jeu<input id="note-min" class="in num" style="width:84px" inputmode="numeric" maxlength="2" value="${esc(u.noteMin)}" placeholder="–"></label><button class="btn primary" data-act="addNote" style="margin-left:auto">Ajouter la note</button></div>
    </div>
    <div class="card"><div class="card-head"><h2>Toutes les notes<span class="count">${m.notes.length}</span></h2></div>
      <div class="chips"><button class="chip" data-act="noteFilter" data-v="" aria-pressed="${!u.noteFilter}">Toutes</button>${NTAGS.map(t=>`<button class="chip" data-act="noteFilter" data-v="${t}" aria-pressed="${u.noteFilter===t}">${t}</button>`).join('')}</div>
      <ul class="notes">${list.map(n=>`<li><div><div class="meta"><span>${HALFL[n.half]||''}</span><span>${hhmm(n.ts)}</span>${n.min?`<span>${esc(n.min)}e min</span>`:''}${n.tag?`<span class="pill">${esc(n.tag)}</span>`:''}</div><p>${esc(n.text)}</p></div><button class="icon-btn" data-act="delNote" data-id="${n.id}" aria-label="Supprimer la note">×</button></li>`).join('')||'<li><p class="muted">Aucune note.</p></li>'}</ul>
    </div>
  </div>`;
}

function vTactic(){
  const t=S.tac;
  const pieces=Object.entries(t.pieces).filter(([id])=>(id[0]!=='A'||t.showA)&&(id[0]!=='D'||t.showD)).map(([id,[x,y]])=>pieceSVG(id,x,y)).join('');
  const strokes=t.strokes.map(s=>`<path d="${s.d}" class="${s.type==='pass'?'st-pass':'st-run'}" marker-end="url(#${s.type==='pass'?'mPass':'mRun'})"/>`).join('');
  const defs=`<defs><marker id="mRun" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path class="mk-run" d="M0 0L10 5L0 10z"/></marker><marker id="mPass" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path class="mk-pass" d="M0 0L10 5L0 10z"/></marker></defs>`;
  return `<div class="pane-head"><div><h1>Tableau tactique</h1><p class="hint">Déplace les joueurs du doigt, dessine les courses et les passes. Les attaquants affichent les numéros de ta compo.</p></div></div>
  <div class="tac-wrap">
    <div class="card" style="padding:10px">${courtSVG({crop:false,id:'tac',cls:'tacsvg',extra:defs+`<g id="strokes">${strokes}</g><g id="pieces">${pieces}</g>`,label:'Tableau tactique'})}</div>
    <div class="side">
      <div class="card"><h2>Outil</h2><div class="seg" role="group">${[['move','Déplacer'],['run','Course'],['pass','Passe']].map(([v,l])=>`<button data-act="tmode" data-v="${v}" aria-pressed="${t.mode===v}">${l}</button>`).join('')}</div>
        <div class="row"><button id="tundo" class="btn" data-act="tundo" ${t.strokes.length?'':'disabled'}>Annuler le trait</button><button class="btn ghost" data-act="tclear">Effacer les traits</button></div></div>
      <div class="card"><h2>Défense (gris)</h2><div class="chips">${Object.keys(DEFP).map(k=>`<button class="chip" data-act="tdef" data-v="${k}" aria-pressed="${t.def===k}">${k}</button>`).join('')}</div>
        <h2>Attaque (jaune)</h2><div class="chips">${Object.keys(ATT).map(k=>`<button class="chip" data-act="tatt" data-v="${k}" aria-pressed="${t.att===k}">${k==='2-4'?'2-4 (deux pivots)':k}</button>`).join('')}</div></div>
      <div class="card"><h2>Afficher</h2><div class="chips"><button class="chip" data-act="tshow" data-v="showA" aria-pressed="${t.showA}">Attaquants</button><button class="chip" data-act="tshow" data-v="showD" aria-pressed="${t.showD}">Défenseurs</button></div>
        <button class="btn ghost" data-act="treset">Tout remettre en place</button></div>
    </div>
  </div>`;
}

const ZPOS={'AIL-G':[1.55,2.8],'AIL-D':[18.45,2.8],'6M-G':[5.2,7.6],'6M-C':[10,7.75],'6M-D':[14.8,7.6],'9M-G':[4.3,10.9],'9M-C':[10,10.6],'9M-D':[15.7,10.9],'LOIN':[10,13.2],'7M':[10,3.2]};
/* ---------- Espaces entre défenseurs : 0-1 … 6-0, de gauche à droite vu du tireur ---------- */
const ESP=['0-1','1-2','2-3','3-4','4-5','5-6','6-0'];
// Repères visuels : angles (degrés, depuis le centre du but) des 6 défenseurs d'une 0-6
const ESP_B=[-72,-45,-16,16,45,72];
const ESPPOS={'0-1':[1.6,1.7],'1-2':[3.3,6.3],'2-3':[6.6,10.5],'3-4':[10,11.7],'4-5':[13.4,10.5],'5-6':[16.7,6.3],'6-0':[18.4,1.7]};
function espOf(e){return e&&e.esp&&ESP.includes(e.esp)&&e.phase!=='seven'&&e.zone!=='7M'?e.esp:null}
function espRays(){
  return ESP_B.map(a=>{const r=a*Math.PI/180,s=Math.sin(r),c=Math.cos(r);let t=30;if(s<0)t=Math.min(t,-10/s);if(s>0)t=Math.min(t,10/s);if(c>0)t=Math.min(t,14.4/c);
    return `<line class="esp-ray" x1="10" y1="0" x2="${(10+t*s).toFixed(2)}" y2="${(t*c).toFixed(2)}"/>`}).join('');
}
function espStats(shots){const o={};ESP.forEach(k=>o[k]={t:0,g:0});shots.forEach(e=>{const k=espOf(e);if(k){o[k].t++;if(e.res==='goal')o[k].g++}});return o}
function espMap(shots,team){
  const by=espStats(shots);
  const marks=ESP.map(k=>{const [x,y]=ESPPOS[k],z=by[k];
    if(!z.t)return `<text class="zl" x="${x}" y="${y+.22}">${k}</text>`;
    const r=z.g/z.t,good=team==='us'?r:1-r;
    return `<g transform="translate(${x} ${y})"><circle class="zb" r="1.22" style="fill:color-mix(in srgb,var(--good) ${Math.round(good*100)}%,var(--bad))"/><text class="zp" y=".1">${Math.round(r*100)} %</text><text class="zc" y=".72">${k} · ${z.g}/${z.t}</text></g>`}).join('');
  return courtSVG({extra:espRays()+marks,label:'Réussite par espace'});
}
function espStrip(shots,team){
  const by=espStats(shots);
  return `<div class="espstrip" role="list" aria-label="Réussite par espace, de gauche à droite vu du tireur">${ESP.map(k=>{const z=by[k];
    if(!z.t)return `<div role="listitem" class="es empty"><b>${k}</b><span>–</span></div>`;
    const r=z.g/z.t,good=team==='us'?r:1-r;
    return `<div role="listitem" class="es" style="background:color-mix(in srgb,color-mix(in srgb,var(--good) ${Math.round(good*100)}%,var(--bad)) 30%,var(--surface))"><b>${k}</b><span>${Math.round(r*100)} % · ${z.g}/${z.t}</span></div>`}).join('')}</div>`;
}
function espRowsTbl(us,op){return ESP.map(k=>{const a=us.filter(e=>espOf(e)===k),b=op.filter(e=>espOf(e)===k);if(!a.length&&!b.length)return null;return['Espace '+k,`${goals(a)}/${a.length}`,pct(goals(a),a.length),`${goals(b)}/${b.length}`,pct(goals(b),b.length)]}).filter(Boolean)}

function zoneMap(shots,team){
  const by={};shots.forEach(e=>{if(!e.zone)return;const z=by[e.zone]||(by[e.zone]={t:0,g:0});z.t++;if(e.res==='goal')z.g++});
  const marks=Object.entries(ZPOS).map(([k,[x,y]])=>{
    const z=by[k];
    if(!z)return `<text class="zl" x="${x}" y="${y+.22}">${k==='7M'?'7 m':k}</text>`;
    const r=z.g/z.t,good=team==='us'?r:1-r;
    return `<g transform="translate(${x} ${y})"><circle class="zb" r="1.22" style="fill:color-mix(in srgb,var(--good) ${Math.round(good*100)}%,var(--bad))"/><text class="zp" y=".1">${Math.round(r*100)} %</text><text class="zc" y=".72">${k==='7M'?'7 m · ':''}${z.g}/${z.t}</text></g>`;
  }).join('');
  return courtSVG({extra:marks,label:team==='us'?'Pourcentage de réussite de nos tirs par zone':'Pourcentage de réussite des tirs adverses par zone'});
}
function vBilan(){
  const m=S.m,u=S.ui,L=evs(m,u.bilPer);
  const us=shotsOf(L,'us'),op=shotsOf(L,'opp'),gU=gkStat(L,'us'),gO=gkStat(L,'opp');
  const ins=insights(m,L);
  const phRows=PH.map(([k,l])=>{const a=us.filter(e=>e.phase===k),b=op.filter(e=>e.phase===k);if(!a.length&&!b.length)return null;return[l,`${goals(a)}/${a.length}`,pct(goals(a),a.length),`${goals(b)}/${b.length}`,pct(goals(b),b.length)]}).filter(Boolean);
  const keys=(m.scout.keys||'').split('\n').map(s=>s.trim()).filter(Boolean);
  const per=u.bilPer?HALFL[u.bilPer]:'Match complet';
  const isGk=p=>p.pos==='GB';
  const scorers=m.players.filter(p=>!isGk(p)||us.some(e=>e.p===p.id)).map(p=>{const a=us.filter(e=>e.p===p.id),s7=a.filter(e=>e.phase==='seven'||e.zone==='7M');return{p,t:a.length,g:goals(a),t7:s7.length,g7:goals(s7),lo:L.filter(e=>e.team==='us'&&e.type==='loss'&&e.p===p.id).length}}).sort((a,b)=>b.g-a.g||b.t-a.t||numSort(a.p,b.p));
  const noP=us.filter(e=>!e.p).length,noPl=L.filter(e=>e.team==='us'&&e.type==='loss'&&!e.p).length;
  const gkRows=gks().map(p=>{const g=gkStat(L,'us',p.id);return g.t?[`n°${esc(p.num||'?')}`,esc(p.name),`<strong>${g.s}</strong>`,g.t,pct(g.s,g.t),g.t-g.s]:null}).filter(Boolean);
  const nz=a=>{const n=a.filter(e=>!e.zone).length;return n?`<p class="hint">${n} tir${n>1?'s':''} sans endroit noté.</p>`:''};
  const byEsp=u.bilBy==='esp';
  const map=(a,team)=>byEsp?espMap(a,team):zoneMap(a,team);
  return `${banner()}<div class="pane-head"><div><h1>Bilan express</h1><p class="hint">${per} · ${L.length} action${L.length>1?'s':''} relevée${L.length>1?'s':''}. À montrer à la mi-temps ou pendant un temps mort.</p></div>
    <div class="row"><div class="seg" role="group" aria-label="Provenance des tirs">${[['zone','Par zone'],['esp','Par espace']].map(([v,l])=>`<button data-act="bilBy" data-v="${v}" aria-pressed="${(u.bilBy||'zone')===v}">${l}</button>`).join('')}</div>${perChips('bilPer',u.bilPer,true)}</div></div>
  <div class="bil2">
    <div class="kpis bk full">
      <div class="kpi"><span class="lab">Buts</span><div class="v"><span class="us">${goals(us)}</span><em>–</em><span class="op">${goals(op)}</span></div><small>Nous – adversaire</small></div>
      <div class="kpi"><span class="lab">Au tir</span><div class="v"><span class="us">${pct(goals(us),us.length)}</span><em>/</em><span class="op">${pct(goals(op),op.length)}</span></div><small>${goals(us)}/${us.length} · ${goals(op)}/${op.length}</small></div>
      <div class="kpi"><span class="lab">Pertes</span><div class="v"><span class="us">${cnt(L,'us','loss')}</span><em>/</em><span class="op">${cnt(L,'opp','loss')}</span></div><small>Nous / adversaire</small></div>
      <div class="kpi"><span class="lab">% arrêts</span><div class="v"><span class="us">${pct(gU.s,gU.t)}</span><em>/</em><span class="op">${pct(gO.s,gO.t)}</span></div><small>nos GB ${gU.s}/${gU.t} · leur GB ${gO.s}/${gO.t}</small></div>
    </div>
    <div class="card"><h2>Ce que disent les chiffres</h2>${ins.length?`<ul class="ins">${ins.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:'<p class="hint">Pas encore assez d’actions relevées pour dégager une tendance.</p>'}</div>
    <div class="card"><h2>Rappel des consignes</h2>${keys.length?`<ol class="keys">${keys.map(k=>`<li>${esc(k)}</li>`).join('')}</ol>`:'<p class="hint">Aucune consigne. Ajoute-les dans la fiche adversaire.</p>'}</div>
    <div class="card zm"><div class="card-head"><span class="lab"><i class="dot us"></i>Nos tirs · ${goals(us)}/${us.length} · ${pct(goals(us),us.length)}</span><div class="legend"><span><i class="win"></i>Bon</span><span><i class="lose"></i>À corriger</span></div></div><div class="zm-svg">${map(us,'us')}</div>${byEsp?'':espStrip(us,'us')}${nz(us)}</div>
    <div class="card zm"><div class="card-head"><span class="lab"><i class="dot opp"></i>Tirs adverses · ${goals(op)}/${op.length} · ${pct(goals(op),op.length)}</span><div class="legend"><span><i class="win"></i>Bien défendu</span><span><i class="lose"></i>À corriger</span></div></div><div class="zm-svg">${map(op,'opp')}</div>${byEsp?'':espStrip(op,'opp')}${nz(op)}</div>
    <div class="card full"><div class="card-head"><h2>Nos joueurs</h2><span class="hint">Triés par buts</span></div>
      ${tbl(['N°','Joueur','Poste','Buts','Tirs','% au tir','7 m','Pertes'],scorers.map(r=>[esc(r.p.num||'–'),esc(r.p.name),esc(r.p.pos||''),`<strong>${r.g}</strong>`,r.t||'–',r.t?pct(r.g,r.t):'–',r.t7?`${r.g7}/${r.t7}`:'–',r.lo||'–']),[0,1,2])}
      ${noP||noPl?`<p class="hint">${noP?`${plural(noP,'tir')} sans joueur noté`:''}${noP&&noPl?' · ':''}${noPl?`${plural(noPl,'perte')} sans joueur noté`:''}.</p>`:''}</div>
    <div class="card tb"><h2>Nos gardiens</h2>${tbl(['N°','Gardien','Arrêts','Tirs cadrés','% arrêts','Buts pris'],gkRows,[0,1])}</div>
    <div class="card tb"><h2>Par phase de jeu</h2>${tbl(['Phase','Nous','Eff.','Adv.','Eff.'],phRows)}</div>
  </div>`;
}

const plural=(n,w)=>`${n} ${w}${n>1?'s':''}`;
function cageStats(list){
  const cells={};
  list.filter(e=>(e.res==='goal'||e.res==='saved')&&cz(e)).forEach(e=>{const k=cz(e),c=cells[k]||(cells[k]={t:0,g:0,s:0});c.t++;if(e.res==='goal')c.g++;else c.s++});
  return cells;
}
function topCell(cells,key){
  let best=null;Object.entries(cells).forEach(([i,c])=>{const v=key?c[key]:c.t;if(v&&(!best||v>best.v))best={i,v}});return best;
}
function goalSVG(cells,side,view){
  const W=3,H=2,maxT=Math.max(1,...Object.values(cells).map(c=>c.t));
  const box=(k,x,y,w,h,big)=>{
    const c=cells[k],cx=x+w/2,cy=y+h/2,lab=GZL[view==='gk'?mirrorZ(k):k];
    if(!c)return `<rect class="cell-empty" x="${x}" y="${y}" width="${w}" height="${h}" rx=".05"/><text class="ce" x="${cx}" y="${cy+.04}">${lab}</text>`;
    const good=Math.round(100*(side==='opp'?c.s/c.t:c.g/c.t)),sat=Math.round(32+58*c.t/maxT),tone=sat>=60?'hi':'lo';
    const sub=side==='opp'?`${plural(c.s,'arrêt')} · ${plural(c.g,'but')}`:`${plural(c.g,'but')} · ${plural(c.s,'arrêt')}`;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx=".05" style="fill:color-mix(in srgb,color-mix(in srgb,var(--good) ${good}%,var(--bad)) ${sat}%,var(--surface))"/>
      <text class="cl ${tone}" x="${cx}" y="${y+(big?.16:.13)}">${lab}</text><text class="cn ${big?'':'sm'} ${tone}" x="${cx}" y="${cy+(big?.1:.1)}">${c.t}</text><text class="cs ${tone}" x="${cx}" y="${y+h-(big?.1:.06)}">${sub}</text>`;
  };
  // 4 quarts du but ; vue du gardien = gauche et droite inversées
  const at=view==='gk'?{HD:[0,0],HG:[1,0],BD:[0,1],BG:[1,1]}:{HG:[0,0],HD:[1,0],BG:[0,1],BD:[1,1]};
  let out='<rect class="net" x="0" y="0" width="3" height="2"/>';
  ['HG','HD','BG','BD'].forEach(k=>{const [c,r]=at[k];out+=box(k,c*1.5+.03,r+.03,1.44,.94,true)});
  const P=.08;let posts='';
  for(let x=-P,k=0;x<W+P-1e-6;x+=.2,k++)posts+=`<rect class="${k%2?'post-b':'post-a'}" x="${x.toFixed(3)}" y="${-P}" width="${Math.min(.2,W+P-x).toFixed(3)}" height="${P}"/>`;
  for(let y=0,k=1;y<H-1e-6;y+=.2,k++){const hh=Math.min(.2,H-y).toFixed(3);posts+=`<rect class="${k%2?'post-b':'post-a'}" x="${-P}" y="${y.toFixed(3)}" width="${P}" height="${hh}"/><rect class="${k%2?'post-b':'post-a'}" x="${W}" y="${y.toFixed(3)}" width="${P}" height="${hh}"/>`}
  posts+=`<path class="post-frame" d="M${-P} ${H} V${-P} H${W+P} V${H} M0 ${H} V0 H${W} V${H}"/>`;
  const L=view==='gk'?'côté AIL-D':'côté AIL-G',R=view==='gk'?'côté AIL-G':'côté AIL-D';
  const sp=['LOB','CONT','SOUS'].map((k,i)=>box(k,i*1.02,2.3,.96,.58,false)).join('');
  return `<svg class="goalsvg" viewBox="-0.2 -0.2 3.4 3.18" role="img" aria-label="Tirs dans le but, ${view==='gk'?'vue du gardien':'vue du tireur'}">${out}${posts}
    <path class="gline" d="M-0.2 2 H3.2"/><text class="gside" x="0" y="2.17">◀ ${L}</text><text class="gside" x="3" y="2.17" text-anchor="end">${R} ▶</text>${sp}</svg>`;
}
function vCage(){
  const m=S.m,u=S.ui,side=u.czSide,view=u.czView,L=evs(m,u.czPer),byEsp=u.czBy==='esp';
  let shots=shotsOf(L,side);
  if(side==='opp'&&u.czGk)shots=shots.filter(e=>e.gk===u.czGk);
  const keyOf=e=>byEsp?espOf(e):e.zone;
  const cur=byEsp?u.czEsp:u.czZone;
  const sel=cur?shots.filter(e=>keyOf(e)===cur):shots;
  const on=sel.filter(e=>e.res==='goal'||e.res==='saved'),sv=on.filter(e=>e.res==='saved').length,gl=on.length-sv;
  const cells=cageStats(sel),noCage=on.filter(e=>!cz(e)).length;
  const offBy=countBy(sel.filter(e=>!(e.res==='goal'||e.res==='saved')),e=>e.res),offN=Object.values(offBy).reduce((a,b)=>a+b,0);
  const where=k=>GZT[view==='gk'?mirrorZ(k):k];
  const viewTxt=view==='gk'?'vue du gardien':'vue du tireur';
  const nameOf=k=>byEsp?`Espace ${k}`:ZL[k];
  // terrain : bulles par zone ou par espace
  const counts=countBy(shots.filter(e=>keyOf(e)),keyOf);
  const pos=byEsp?ESPPOS:ZPOS,keys=byEsp?ESP:Object.keys(ZPOS),act=byEsp?'czEsp':'czZone';
  const bubbles=(byEsp?espRays():'')+keys.map(k=>{const [x,y]=pos[k],n=counts[k];
    if(!n)return `<text class="zl" x="${x}" y="${y+.22}">${k==='7M'?'7 m':k}</text>`;
    return `<g class="czb ${cur===k?'sel':''}" data-act="${act}" data-v="${k}" transform="translate(${x} ${y})" role="button" aria-label="${nameOf(k)} : ${plural(n,'tir')}" aria-pressed="${cur===k}"><circle r="1.22"/><text class="n" y=".2">${n}</text><text class="t" y=".72">${k==='7M'?'7 m':k}</text></g>`;
  }).join('');
  // résumé
  const top=topCell(cells),topG=topCell(cells,'g'),topS=topCell(cells,'s');
  const key=[];
  if(side==='opp'){
    const nT=Object.values(cells).reduce((a,c)=>a+c.t,0);
    if(top&&top.v>=2)key.push(`Ils visent surtout <strong>${where(top.i)}</strong> (${top.v} sur ${nT} tirs cadrés notés).`);
    else if(nT)key.push(`Pas de cible dominante sur ${plural(nT,'tir')} cadré${nT>1?'s':''} noté${nT>1?'s':''}.`);
    if(topG&&topG.v>=2)key.push(`Notre gardien encaisse le plus <strong>${where(topG.i)}</strong> (${plural(topG.v,'but')}).`);
    if(topS&&topS.v>=2)key.push(`Il arrête bien <strong>${where(topS.i)}</strong> (${plural(topS.v,'arrêt')}).`);
  }else{
    if(topG&&topG.v>=2)key.push(`On marque surtout <strong>${where(topG.i)}</strong> (${plural(topG.v,'but')}).`);
    else if(topG)key.push(`Un but <strong>${where(topG.i)}</strong>.`);
    if(topS&&topS.v>=2)key.push(`Leur gardien arrête surtout <strong>${where(topS.i)}</strong> (${plural(topS.v,'arrêt')}).`);
  }
  const stat=side==='opp'
    ?`${plural(sel.length,'tir')} · ${on.length} cadré${on.length>1?'s':''} · <strong>${pct(sv,on.length)}</strong> d’arrêts`
    :`${plural(sel.length,'tir')} · ${plural(gl,'but')} · <strong>${pct(gl,sel.length)}</strong> de réussite`;
  const OFFL={miss:'hors cadre',post:'poteau',blocked:'contré'};
  const offTxt=offN?`Non cadrés : ${offN} (${Object.entries(offBy).map(([k,n])=>`${OFFL[k]} ${n}`).join(', ')}).`:'';
  // tendances par zone ou par espace
  const trends=keys.map(k=>{
    const a=shots.filter(e=>keyOf(e)===k),c=cageStats(a),n=Object.values(c).reduce((s,x)=>s+x.t,0);if(!n)return null;
    const t=topCell(c),g=topCell(c,'g'),s=topCell(c,'s'),o=a.filter(e=>e.res==='goal'||e.res==='saved'),osv=o.filter(e=>e.res==='saved').length;
    const txt=side==='opp'
      ?`${n===1?`1 tir cadré <strong>${where(t.i)}</strong>`:t.v>=2?`Surtout <strong>${where(t.i)}</strong> (${t.v} sur ${n})`:`Pas de cible dominante (${n} tirs)`}${g&&g.v>=2?` · buts encaissés ${where(g.i)} (${g.v})`:''} · ${osv} arrêt${osv>1?'s':''} sur ${o.length}`
      :`${g?(g.v>=2?`Buts surtout <strong>${where(g.i)}</strong> (${g.v})`:`But <strong>${where(g.i)}</strong>`):'Aucun but'}${s?` · arrêts ${where(s.i)} (${s.v})`:''} · ${o.length-osv} but${o.length-osv>1?'s':''} sur ${a.length} tirs`;
    return{n,html:`<li><button data-act="${act}" data-v="${k}" aria-pressed="${cur===k}"><b>${nameOf(k)}</b><span>${txt}</span></button></li>`};
  }).filter(Boolean).sort((a,b)=>b.n-a.n);
  const sideSeg=`<div class="seg" role="group" aria-label="Tirs analysés">${[['opp','Tirs adverses · notre GB'],['us','Nos tirs · leur GB']].map(([v,l])=>`<button ${v==='opp'?'class="opp" ':''}data-act="czSide" data-v="${v}" aria-pressed="${side===v}">${l}</button>`).join('')}</div>`;
  return `${banner()}<div class="pane-head"><div><h1>Tirs dans la cage</h1><p class="hint">Touche une zone ou un espace pour voir où partent les tirs qui en viennent.</p></div>${sideSeg}</div>
  <div class="row">${perChips('czPer',u.czPer,true)}
    <div class="seg" role="group" aria-label="Sens de lecture du but">${[['gk','Vue du gardien'],['shooter','Vue du tireur']].map(([v,l])=>`<button data-act="czView" data-v="${v}" aria-pressed="${view===v}">${l}</button>`).join('')}</div>
    ${side==='opp'&&gks().length>1?`<div class="chips"><button class="chip" data-act="czGk" data-v="" aria-pressed="${!u.czGk}">Tous nos GB</button>${gks().map(p=>`<button class="chip" data-act="czGk" data-v="${p.id}" aria-pressed="${u.czGk===p.id}">${esc(pLab(p.id))}</button>`).join('')}</div>`:''}
  </div>
  <div class="cz3 fx">
    <div class="card cz-court"><div class="card-head"><div class="seg" role="group" aria-label="Provenance">${[['zone','Par zone'],['esp','Par espace']].map(([v,l])=>`<button data-act="czBy" data-v="${v}" aria-pressed="${(u.czBy||'zone')===v}">${l}</button>`).join('')}</div><button class="chip" data-act="${act}" data-v="" aria-pressed="${!cur}">Tout</button></div>
      <div class="cz-svg">${courtSVG({extra:bubbles,label:'Choix de la provenance des tirs'})}</div>
      <p class="hint">${byEsp?'Espaces choisis à la saisie, de gauche à droite vu du tireur. ':''}Le chiffre indique le nombre de tirs.</p>
    </div>
    <div class="card cz-goal"><div class="card-head"><div><span class="lab">${side==='opp'?'Tirs adverses':'Nos tirs'} · ${viewTxt}</span><h2 style="margin-top:4px">${cur?esc(nameOf(cur)):(byEsp?'Tous les espaces':'Toutes les zones')}</h2></div><p class="czstat">${stat}</p></div>
      ${goalSVG(cells,side,view)}
      <div class="legend">${side==='opp'?'<span><i class="win"></i>Plutôt arrêtés</span><span><i class="lose"></i>Plutôt des buts</span>':'<span><i class="win"></i>Plutôt des buts</span><span><i class="lose"></i>Plutôt arrêtés</span>'}<span>Case plus foncée = plus de tirs</span></div>
      ${key.length?`<ul class="ins">${key.map(k=>`<li>${k}</li>`).join('')}</ul>`:'<p class="hint">Aucun tir cadré avec une zone de cage notée pour ce choix.</p>'}
      ${offTxt||noCage?`<p class="hint">${offTxt}${offTxt&&noCage?' ':''}${noCage?`${noCage} tir${noCage>1?'s':''} cadré${noCage>1?'s':''} sans zone de cage notée.`:''}</p>`:''}
    </div>
    <div class="card cz-trend"><div class="card-head"><h2>${side==='opp'?'À dire au gardien':'À dire aux tireurs'}</h2><span class="hint">${byEsp?'Par espace':'Par zone'} · ${viewTxt}</span></div>
      ${trends.length?`<ul class="trend">${trends.map(t=>t.html).join('')}</ul>`:'<p class="hint">Note la zone de cage sur les tirs pour voir les tendances ici.</p>'}
    </div>
  </div>`;
}

function vReport(){
  const m=S.m,u=S.ui,L=evs(m,u.repPer);
  const halfRow=h=>{const E=evs(m,h),a=shotsOf(E,'us'),b=shotsOf(E,'opp'),g=gkStat(E,'us');return[h?HALFL[h]:'<strong>Match</strong>',goals(a),goals(b),pct(goals(a),a.length),pct(goals(b),b.length),cnt(E,'us','loss'),cnt(E,'opp','loss'),pct(g.s,g.t)]};
  const pr=playerRows(m,L).filter(r=>r.t||r.loss).map(r=>[esc(r.p.num),esc(r.p.name),esc(r.p.pos),r.t,`<strong>${r.g}</strong>`,pct(r.g,r.t),r.t7?`${r.g7}/${r.t7}`:'–',r.loss]);
  const gr=gks().map(p=>{const a=gkStat(L,'us',p.id),h1=gkStat(evs(m,1),'us',p.id),h2=gkStat(evs(m,2),'us',p.id);if(!a.t)return null;return[esc(p.num),esc(p.name),a.t,a.s,a.g,`<strong>${pct(a.s,a.t)}</strong>`,pct(h1.s,h1.t),pct(h2.s,h2.t)]}).filter(Boolean);
  const us=shotsOf(L,'us'),op=shotsOf(L,'opp');
  const zr=ZONES.map(z=>{const a=us.filter(e=>e.zone===z[0]),b=op.filter(e=>e.zone===z[0]);if(!a.length&&!b.length)return null;return[z[1],`${goals(a)}/${a.length}`,pct(goals(a),a.length),`${goals(b)}/${b.length}`,pct(goals(b),b.length)]}).filter(Boolean);
  const phr=PH.map(([k,,l])=>{const a=us.filter(e=>e.phase===k),b=op.filter(e=>e.phase===k);if(!a.length&&!b.length)return null;return[l,`${goals(a)}/${a.length}`,pct(goals(a),a.length),`${goals(b)}/${b.length}`,pct(goals(b),b.length)]}).filter(Boolean);
  const dr=DEFS.map(d=>{const a=us.filter(e=>e.def===d),lo=L.filter(e=>e.team==='us'&&e.type==='loss'&&e.def===d).length;if(!a.length&&!lo)return null;return[esc(d),a.length,goals(a),pct(goals(a),a.length),lo]}).filter(Boolean);
  const er=espRowsTbl(us,op);
  const noXY=n=>n?`<p class="hint">${n} tir${n>1?'s':''} sans zone touchée, non affiché${n>1?'s':''}.</p>`:'';
  return `${banner()}<div class="pane-head"><div><h1>Rapport de match</h1><p class="hint">${m.opponent?'vs '+esc(m.opponent)+' · ':''}${esc(fmtDate(m.date))} · ${m.events.length} actions relevées</p></div>${perChips('repPer',u.repPer,true)}</div>
  ${APP&&needBackup()?(CLOUD?`<div class="banner"><span>Ce match n’est pas encore sur le serveur du club. Synchronise pour ne rien perdre.</span><button class="btn primary" data-act="openCloud">Synchroniser maintenant</button></div>`:`<div class="banner"><span>Ce match n’est enregistré que sur cet iPad. Range une sauvegarde dans iCloud Drive pour ne rien perdre.</span><button class="btn primary" data-act="bkExport">Sauvegarder maintenant</button></div>`):''}
  <div class="card pdfcard"><div class="card-head"><div><h2>Fiche de fin de match</h2><p class="hint">PDF A4 à partager ou imprimer : résumé, attaque, défense, nos gardiens et le gardien adverse, avec les consignes et les notes.</p></div><button class="btn primary" data-act="exportPdf" ${m.events.length?'':'disabled'}>Créer la fiche PDF</button></div></div>
  <div class="card"><div class="card-head"><h2>Envoyer les données</h2></div>
    <p class="hint">Le relevé reprend les colonnes de l’onglet « Relevé match » du classeur Excel. Envoie-le à Claude pour l’analyse complète, avec tes notes.</p>
    <div class="row"><button class="btn primary" data-act="exportCsv">Enregistrer le relevé (.csv)</button><button class="btn" data-act="copyCsv">Copier le relevé</button><button class="btn" data-act="copyNotes" ${m.notes.length?'':'disabled'}>Copier les notes</button></div></div>
  <div class="card"><h2>Par mi-temps</h2>${tbl(['Période','Buts nous','Buts adv.','Eff. nous','Eff. adv.','Pertes nous','Pertes adv.','% arrêts'],[halfRow(1),halfRow(2),halfRow(0)])}</div>
  ${pr.length?`<div class="card"><h2>Joueurs</h2>${tbl(['N°','Nom','Poste','Tirs','Buts','Eff.','7 m','Pertes'],pr,[0,1,2])}</div>`:''}
  <div class="card"><h2>Nos gardiens</h2>${tbl(['N°','Nom','Tirs cadrés','Arrêts','Buts','% arrêts','1re','2e'],gr,[0,1])}</div>
  <div class="split">
    <div class="card"><h2>Nos tirs</h2>${courtSVG({extra:dotsSVG(us,'us'),label:'Carte de nos tirs'})}${legend('us')}${noXY(us.filter(e=>e.x==null).length)}</div>
    <div class="card"><h2>Tirs adverses</h2>${courtSVG({extra:dotsSVG(op,'opp'),label:'Carte des tirs adverses'})}${legend('opp')}${noXY(op.filter(e=>e.x==null).length)}</div>
  </div>
  <div class="split">
    <div class="card"><h2>Par zone de tir</h2>${tbl(['Zone','Nous','Eff.','Adversaire','Eff.'],zr)}</div>
    <div class="card"><h2>Par phase de jeu</h2>${tbl(['Phase','Nous','Eff.','Adversaire','Eff.'],phr)}</div>
  </div>
  <div class="card"><h2>Par espace (0-1 … 6-0)</h2>${tbl(['Espace','Nous','Eff.','Adversaire','Eff.'],er)}<p class="hint">Espaces entre les 6 défenseurs, de gauche à droite vu du tireur, choisis pendant la saisie des tirs.</p></div>
  <div class="card"><h2>Contre chaque défense adverse</h2>${tbl(['Défense','Tirs','Buts','Eff.','Pertes'],dr)}</div>
  <div class="card"><h2>Notes<span class="count">${m.notes.length}</span></h2>${m.notes.length?`<ul class="notes">${m.notes.slice().sort((a,b)=>a.ts-b.ts).map(n=>`<li style="grid-template-columns:1fr"><div><div class="meta"><span>${HALFL[n.half]||''}</span><span>${hhmm(n.ts)}</span>${n.min?`<span>${esc(n.min)}e min</span>`:''}${n.tag?`<span class="pill">${esc(n.tag)}</span>`:''}</div><p>${esc(n.text)}</p></div></li>`).join('')}</ul>`:'<p class="hint">Aucune note.</p>'}</div>`;
}

function vHistory(){
  const list=IDX.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||'')||b.updatedAt-a.updatedAt);
  const where=S.sync==='local'?'Les matchs sont gardés sur cet appareil.':'Les matchs sont enregistrés dans ton compte et se retrouvent sur tes autres appareils.';
  return `<div class="pane-head"><div><h1>Historique</h1><p class="hint">${where}</p></div><button class="btn primary" data-act="newMatch">Nouveau match</button></div>
  ${list.length?`<ul class="hist">${list.map(x=>{const cur=x.id===S.m.id,conf=S.ui.confirmDel===x.id;return `<li class="${cur?'cur':''}"><div class="info"><b>${x.opponent?'vs '+esc(x.opponent):'Sans adversaire'}</b><span>${esc(fmtDate(x.date))} · ${x.n} action${x.n>1?'s':''} · buts relevés ${x.us}–${x.op}</span></div>
    <div class="row">${cur?'<span class="pill">Match ouvert</span>':`<button class="btn" data-act="open" data-id="${x.id}">Ouvrir</button>`}${conf?`<button class="btn danger" data-act="doDel" data-id="${x.id}">Supprimer définitivement</button><button class="btn ghost" data-act="cancelDel">Garder</button>`:`<button class="icon-btn" data-act="askDel" data-id="${x.id}" aria-label="Supprimer ce match">×</button>`}</div></li>`}).join('')}</ul>`
  :`<div class="card"><h2>Aucun match enregistré</h2><p class="hint">Crée un match : il apparaîtra ici dès la première modification et restera accessible pour revoir le rapport.</p></div>`}`;
}

/* ---------- Équipe : base de données joueurs ---------- */
const POSTE_ORDER={GB:0,AG:1,ARG:2,DC:3,ARD:4,AD:5,PIV:6};
const alts=p=>Array.isArray(p&&p.postes2)?p.postes2.filter(c=>c&&c!==p.poste):[];
function altOf(mp){const t=TEAM&&tById(mp.id);return t?alts(t):(Array.isArray(mp.alt)?mp.alt:[])}
function posteTxt(p,long){const a=alts(p);if(!p.poste&&!a.length)return 'Poste à définir';return (p.poste?(long?POSTNAME[p.poste]:p.poste):'Poste principal à définir')+(a.length?` · aussi ${a.join(', ')}`:'')}
let TEAM=null;
const tById=id=>TEAM.players.find(p=>p.id===id);
const tFull=p=>[p.prenom,p.nom].filter(Boolean).join(' ')||'Joueur sans nom';
const tShort=p=>((p.prenom||'')+(p.nom?' '+p.nom.charAt(0)+'.':'')).trim()||'Sans nom';
const teamSort=(a,b)=>((POSTE_ORDER[a.poste]??9)-(POSTE_ORDER[b.poste]??9))||numSort(a,b)||String(a.nom).localeCompare(String(b.nom),'fr')||String(a.prenom).localeCompare(String(b.prenom),'fr');
const isOn=e=>e.res==='goal'||e.res==='saved';
function age(iso){if(!iso)return null;const d=new Date(iso+'T12:00:00');if(isNaN(d))return null;const n=new Date();let a=n.getFullYear()-d.getFullYear();if(n.getMonth()<d.getMonth()||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))a--;return a>=0&&a<100?a:null}
function newTP(){return{updatedAt:Date.now(),id:'j_'+uid(),prenom:'',nom:'',naissance:'',poste:'',postes2:[],num:'',forts:'',travail:''}}
function loadTeam(){
  const t=LS.get('hb.team',null);
  if(t&&Array.isArray(t.players)&&!t.example){TEAM=t;return}
  // Reprise de l’ancien effectif habituel et des matchs déjà saisis
  const players=[],byKey={};
  const add=(num,name,pos)=>{const k=String(num||'')+'|'+String(name||'').trim().toLowerCase();if(byKey[k])return byKey[k];const parts=String(name||'').trim().split(/\s+/);const np=Object.assign(newTP(),{prenom:parts[0]||'',nom:parts.slice(1).join(' '),poste:pos||'',num:String(num||'')});players.push(np);byKey[k]=np;return np};
  const ros=LS.get('hb.roster',null);
  if(Array.isArray(ros))ros.forEach(p=>{if(p&&(p.num||p.name))add(p.num,p.name,p.pos)});
  IDX.forEach(x=>{
    const m=getMatch(x.id);if(!m||m.example||m.teamLinked)return;const map={};
    (m.players||[]).forEach(p=>{if(!p.num&&!p.name)return;const np=add(p.num,p.name,p.pos);map[p.id]=np.id;p.id=np.id;p.name=tShort(np)});
    Object.keys(m.lineup||{}).forEach(k=>{if(map[m.lineup[k]])m.lineup[k]=map[m.lineup[k]]});
    (m.events||[]).forEach(e=>{if(e.p&&map[e.p])e.p=map[e.p];if(e.gk&&map[e.gk])e.gk=map[e.gk]});
    m.teamLinked=true;m.updatedAt=Date.now();storeLocal(m);
  });
  if(players.length){TEAM={kind:'team',players,updatedAt:Date.now()};LS.set('hb.team',TEAM)}
  else{TEAM={kind:'team',players:SEED.map(seedTP),seedDone:true,fresh:true,updatedAt:0};LS.set('hb.team',TEAM)}
}
function touchTeam(){
  TEAM.updatedAt=Date.now();delete TEAM.fresh;if(TEAM.example)return;LS.set('hb.team',TEAM);markChange();
  if(DB){dirty.add('team');setSync('pending');clearTimeout(cloudTimer);cloudTimer=setTimeout(flushCloud,1400)}
}
// Liste nominative : à importer depuis un fichier de sauvegarde (page Sauvegarde)
const SEED=[];
const titleCase=t=>String(t).toLowerCase().replace(/(^|[\s-])(\S)/g,(m,a,b)=>a+b.toUpperCase());
const seedKey=(nom,prenom)=>String(nom).trim().toLowerCase()+'|'+String(prenom).trim().toLowerCase();
const seedTP=([nom,prenom,naissance])=>Object.assign(newTP(),{nom,prenom:titleCase(prenom),naissance});
function seedMissing(){const have=new Set(TEAM.players.map(p=>seedKey(p.nom,p.prenom)));return SEED.filter(r=>!have.has(seedKey(r[0],titleCase(r[1]))))}
function importSeed(){const add=seedMissing().map(seedTP);TEAM.players.push(...add);TEAM.seedDone=true;touchTeam();return add.length}
function removeTeamPlayers(ids){
  const removed=TEAM.players.map((p,i)=>({p,i})).filter(x=>ids.includes(x.p.id));if(!removed.length)return;
  TEAM.removed=TEAM.removed||{};ids.forEach(id=>TEAM.removed[id]=Date.now());
  TEAM.players=TEAM.players.filter(p=>!ids.includes(p.id));touchTeam();
  if(ids.includes(S.tp))S.tview='team';
  S.ui.tsel=null;S.ui.tconf=false;S.ui.tdel=null;saveUI();renderAll();
  toast(removed.length>1?`${removed.length} joueurs supprimés`:`${tFull(removed[0].p)} supprimé`,{label:'Rétablir',fn:()=>{removed.forEach(({p,i})=>{TEAM.players.splice(Math.min(i,TEAM.players.length),0,p);if(TEAM.removed)delete TEAM.removed[p.id]});touchTeam();renderAll()}});
}
function makeTeamReal(){TEAM={kind:'team',players:SEED.map(seedTP),seedDone:true,updatedAt:Date.now()};touchTeam()}
function syncSnap(tp){
  if(!S.m||S.m.example)return;const p=S.m.players.find(x=>x.id===tp.id);if(!p)return;
  p.num=tp.num;p.name=tShort(tp);p.pos=tp.poste;p.alt=alts(tp);touch();
}
function teamMatches(){
  return IDX.map(x=>getMatch(x.id)).filter(m=>m&&!m.example).map(normalize).sort((a,b)=>(b.date||'').localeCompare(a.date||''));
}
function playerSeason(pid,ms){
  const R={mj:0,shots:[],loss:0,faced:[],rows:[]};
  ms.forEach(m=>{
    const inM=m.players.some(p=>p.id===pid);
    const sh=m.events.filter(e=>e.team==='us'&&e.type==='shot'&&e.p===pid);
    const lo=m.events.filter(e=>e.team==='us'&&e.type==='loss'&&e.p===pid).length;
    const fc=m.events.filter(e=>e.team==='opp'&&e.type==='shot'&&e.gk===pid);
    if(!inM&&!sh.length&&!lo&&!fc.length)return;
    R.mj++;R.shots.push(...sh);R.loss+=lo;R.faced.push(...fc);R.rows.push({m,sh,lo,fc});
  });
  return R;
}
const STYPES=[['nine','Tirs de 9 m et de loin'],['wing','Tirs d’aile'],['six','Tirs de 6 m / pivot'],['fast','Jeu rapide'],['seven','Jets de 7 m']];
const STL=Object.fromEntries(STYPES);
function stype(e){if(e.phase==='seven'||e.zone==='7M')return 'seven';if(e.phase==='ca'||e.phase==='second'||e.phase==='quick')return 'fast';if(!e.zone)return null;if(e.zone.startsWith('AIL'))return 'wing';if(e.zone.startsWith('6M'))return 'six';return 'nine'}
function teamBanner(){return TEAM.example?`<div class="banner"><span>Effectif d’exemple pour découvrir l’outil : les fiches ne sont pas modifiables et rien n’est enregistré.</span><div class="row"><button class="btn" data-act="tgo" data-v="backup">Importer une sauvegarde</button><button class="btn primary" data-act="teamReal">${SEED.length?`Créer mon effectif (${SEED.length} joueurs)`:'Créer mon effectif'}</button></div></div>`:''}
function pcard(p,ms,del){
  const st=playerSeason(p.id,ms),gk=p.poste==='GB',a=age(p.naissance);let k1,k2;
  if(gk){const on=st.faced.filter(isOn),s=on.filter(e=>e.res==='saved').length;k1=[pct(s,on.length),'arrêts'];k2=[`${s}/${on.length}`,'tirs cadrés']}
  else{const g=goals(st.shots);k1=[pct(g,st.shots.length),'au tir'];k2=[`${g}/${st.shots.length}`,'buts']}
  const on=del&&S.ui.tsel.includes(p.id);
  return `<button class="pcard ${gk?'gk':''} ${del?'del':''} ${on?'picked':''}" data-act="${del?'tsel':'tp'}" data-id="${p.id}" ${del?`aria-pressed="${on}" aria-label="${on?'Désélectionner':'Sélectionner'} ${esc(tFull(p))}"`:''}>${del?`<span class="pcheck" aria-hidden="true">${on?'✓':''}</span>`:''}${p.photo?`<span class="pnum ph"><img src="${p.photo}" alt=""><i>${esc(p.num||'–')}</i></span>`:`<span class="pnum">${esc(p.num||'–')}</span>`}<span class="pid"><b>${esc(tFull(p))}</b><small>${esc(posteTxt(p,true))}${a!=null?` · ${a} ans`:''}</small></span><span class="pst"><span><b>${k1[0]}</b>${k1[1]}</span><span><b>${k2[0]}</b>${k2[1]}</span><span><b>${st.loss}</b>pertes</span><span><b>${st.mj}</b>matchs</span></span></button>`;
}
function vTeam(){
  const ms=teamMatches(),ps=TEAM.players.slice().sort(teamSort),gl=ps.filter(p=>p.poste==='GB'),fl=ps.filter(p=>p.poste&&p.poste!=='GB'),nl=ps.filter(p=>!p.poste);
  const miss=!TEAM.example&&!TEAM.seedDone?seedMissing().length:0;
  if(S.ui.tsel&&TEAM.example)S.ui.tsel=null;
  const del=!!S.ui.tsel,nsel=del?S.ui.tsel.filter(id=>tById(id)).length:0;
  return `${teamBanner()}<div class="pane-head"><div><h1>Joueurs</h1><p class="hint">${plural(ps.length,'joueur')} · stats cumulées sur ${plural(ms.length,'match')}. Touche un joueur pour ouvrir sa fiche.</p></div>${del?'':`<div class="row">${miss?`<button class="btn" data-act="importSeed">Importer la liste du club (${miss})</button>`:''}${!TEAM.example&&ps.length?'<button class="btn" data-act="tdelMode">Supprimer des joueurs</button>':''}<button class="btn primary" data-act="taddp">Ajouter un joueur</button></div>`}</div>
  ${del?`<div class="card delbar"><div class="card-head"><div><h2>Supprimer des joueurs</h2><p class="hint">Touche les joueurs à supprimer, puis confirme.</p></div><div class="row">
    ${S.ui.tconf?`<span class="delq">Supprimer définitivement ${plural(nsel,'joueur')} ?</span><button class="btn danger" data-act="tdelManyGo">Oui, supprimer</button><button class="btn" data-act="tdelManyNo">Non</button>`
    :`<button class="btn" data-act="tselAll">${nsel===ps.length?'Tout désélectionner':'Tout sélectionner'}</button><button class="btn danger" data-act="tdelMany" ${nsel?'':'disabled'}>Supprimer (${nsel})</button><button class="btn ghost" data-act="tdelCancel">Terminé</button>`}
  </div></div></div>`:''}
  ${nl.length&&!TEAM.example?`<div class="banner"><span>${plural(nl.length,'joueur')} sans poste. Ouvre chaque fiche pour indiquer le poste et le numéro de maillot.</span></div>`:''}
  ${ps.length?'':'<div class="card"><h2>Aucun joueur</h2><p class="hint">Ajoute tes joueurs un par un (nom, prénom, date de naissance, poste et numéro) ou importe un fichier de sauvegarde. Tu pourras ensuite les convoquer sur la feuille de match.</p><div class="row"><button class="btn primary" data-act="taddp">Ajouter un joueur</button><button class="btn" data-act="tgo" data-v="backup">Importer une sauvegarde</button></div></div>'}
  ${gl.length?`<section class="tsec"><h2>Gardiens<span class="count">${gl.length}</span></h2><div class="pcards">${gl.map(p=>pcard(p,ms,del)).join('')}</div></section>`:''}
  ${fl.length?`<section class="tsec"><h2>Joueurs de champ<span class="count">${fl.length}</span></h2><div class="pcards">${fl.map(p=>pcard(p,ms,del)).join('')}</div></section>`:''}
  ${nl.length?`<section class="tsec"><h2>Poste à définir<span class="count">${nl.length}</span></h2><div class="pcards">${nl.map(p=>pcard(p,ms,del)).join('')}</div></section>`:''}`;
}
function tpTitle(p){return `<span class="h-num">${esc(p.num||'–')}</span>${esc(tFull(p))}`}
function kpi(l,v,s){return `<div class="kpi"><span class="lab">${l}</span><div class="v">${v}</div>${s?`<small>${s}</small>`:''}</div>`}
function fieldStats(st){
  const sh=st.shots,g=goals(sh),s7=sh.filter(e=>e.phase==='seven'||e.zone==='7M'),nz=sh.filter(e=>!e.zone).length;
  const rows=st.rows.map(r=>[esc(fmtDate(r.m.date)),esc(r.m.opponent||'–'),`<strong>${goals(r.sh)}</strong>`,r.sh.length,pct(goals(r.sh),r.sh.length),r.lo]);
  return `<div class="kpis sm">${kpi('Au tir',pct(g,sh.length),`${g} buts sur ${sh.length} tirs`)}${kpi('Jets de 7 m',s7.length?`${goals(s7)}/${s7.length}`:'–',s7.length?pct(goals(s7),s7.length):'aucun')}${kpi('Pertes de balle',st.loss,st.mj?`${(st.loss/st.mj).toFixed(1).replace('.',',')} par match`:'')}${kpi('Matchs',st.mj,'avec des actions relevées')}</div>
  <div class="split">
    <div class="card"><h2>Zones de tir · terrain</h2>${zoneMap(sh,'us')}<p class="hint">% de réussite par zone, buts / tirs dessous.${nz?` ${nz} tir${nz>1?'s':''} sans endroit noté.`:''}</p></div>
    <div class="card"><h2>Dans le but · vue du tireur</h2>${goalSVG(cageStats(sh),'us','shooter')}<div class="legend"><span><i class="win"></i>Plutôt des buts</span><span><i class="lose"></i>Plutôt arrêtés</span></div></div>
  </div>
  <div class="card"><h2>Match par match</h2>${tbl(['Date','Adversaire','Buts','Tirs','%','Pertes'],rows,[0,1])}</div>`;
}
function gkStats(st){
  const on=st.faced.filter(isOn),sv=on.filter(e=>e.res==='saved').length;
  const tr=STYPES.map(([k,l])=>{const a=on.filter(e=>stype(e)===k),s=a.filter(e=>e.res==='saved').length;return{k,l,t:a.length,s}}).filter(x=>x.t);
  const ranked=tr.filter(x=>x.t>=4).sort((a,b)=>b.s/b.t-a.s/a.t);
  const best=ranked[0],worst=ranked.length>1?ranked[ranked.length-1]:null;
  const rows=st.rows.map(r=>{const o=r.fc.filter(isOn),s=o.filter(e=>e.res==='saved').length;return[esc(fmtDate(r.m.date)),esc(r.m.opponent||'–'),o.length,`<strong>${s}</strong>`,pct(s,o.length),r.lo]});
  return `<div class="kpis sm">${kpi('Arrêts',pct(sv,on.length),`${sv} sur ${on.length} tirs cadrés`)}${kpi('Buts encaissés',on.length-sv,'avec lui dans le but')}${kpi('Pertes de balle',st.loss,'relances ratées comprises')}${kpi('Matchs',st.mj,'avec des actions relevées')}</div>
  <div class="card"><h2>Type de tir</h2>
    ${best?`<div class="verdict"><div class="good"><span class="lab">Le plus à l’aise sur</span><b>${best.l}</b><span>${pct(best.s,best.t)} d’arrêts · ${best.s}/${best.t}</span></div>${worst&&worst!==best?`<div class="bad"><span class="lab">Le plus en difficulté sur</span><b>${worst.l}</b><span>${pct(worst.s,worst.t)} d’arrêts · ${worst.s}/${worst.t}</span></div>`:''}</div>`:'<p class="hint">Il faut au moins 4 tirs cadrés d’un même type pour dégager une tendance.</p>'}
    ${tbl(['Type de tir','Tirs cadrés','Arrêts','% arrêts'],tr.map(x=>[x.l,x.t,`<strong>${x.s}</strong>`,pct(x.s,x.t)]))}
  </div>
  <div class="card"><h2>Zones d’arrêt · vue du gardien</h2>${goalSVG(cageStats(st.faced),'opp','gk')}<div class="legend"><span><i class="win"></i>Plutôt arrêtés</span><span><i class="lose"></i>Plutôt des buts</span><span>Case plus foncée = plus de tirs</span></div></div>
  <div class="card"><h2>Match par match</h2>${tbl(['Date','Adversaire','Cadrés','Arrêts','%','Pertes'],rows,[0,1])}</div>`;
}
async function setPhoto(id,file){
  const p=tById(id);if(!p||!file||TEAM.example)return;
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((ok,ko)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=ko;i.src=url});
    const Z=200,c=document.createElement('canvas');c.width=c.height=Z;
    const w=img.naturalWidth,h=img.naturalHeight,s=Math.min(w,h);
    c.getContext('2d').drawImage(img,(w-s)/2,(h-s)*.3,s,s,0,0,Z,Z);
    p.photo=c.toDataURL('image/jpeg',.74);p.updatedAt=Date.now();touchTeam();renderView();toast('Photo ajoutée');
  }catch(e){toast('Impossible de lire cette image.')}
  finally{URL.revokeObjectURL(url)}
}
function vProfile(){
  const p=tById(S.tp);if(!p){S.tview='team';return vTeam()}
  const ex=TEAM.example,dis=ex?'disabled':'',ms=teamMatches(),st=playerSeason(p.id,ms),a=age(p.naissance);
  const fld=(k,l,type)=>`<label class="f" for="tf-${k}">${l}<input id="tf-${k}" class="in" ${type?`type="${type}"`:''} data-tf="${k}" value="${esc(p[k])}" autocomplete="off" ${dis}></label>`;
  const del=ex?'':(S.ui.tdel===p.id
    ?`<div class="row"><button class="btn danger" data-act="tdel" data-id="${p.id}">Supprimer définitivement</button><button class="btn ghost" data-act="tdelNo">Garder</button></div><p class="hint">Les actions déjà relevées restent dans les matchs.</p>`
    :`<div class="row"><button class="btn ghost danger-txt" data-act="tdelAsk" data-id="${p.id}">Supprimer ce joueur</button></div>`);
  return `${teamBanner()}<div class="pane-head"><div><button class="back" data-act="tback">‹ Joueurs</button><h1 id="tp-title">${tpTitle(p)}</h1><p class="hint" id="tp-sub">${esc(posteTxt(p,true))}${a!=null?` · ${a} ans`:''} · ${plural(st.mj,'match')}</p></div><button class="btn" data-act="taddp">Ajouter un joueur</button></div>
  <div class="prof">
    <div class="card"><h2>Fiche joueur</h2>
      <div class="tphoto-row">
        <div class="tphoto">${p.photo?`<img src="${p.photo}" alt="Photo de ${esc(tFull(p))}">`:`<span aria-hidden="true">${esc(((p.prenom||'')[0]||'')+((p.nom||'')[0]||'')||'?')}</span>`}</div>
        <div class="tphoto-act">${ex?'':`<div class="row"><label class="btn ${p.photo?'':'primary'} filebtn">${p.photo?'Changer la photo':'Ajouter une photo'}<input type="file" accept="image/*" data-photo="${p.id}" class="vh-file"></label>${p.photo?'<button class="btn ghost" data-act="tphotoDel">Retirer</button>':''}</div>`}
          <span class="hint">Prends-la avec l’iPad ou choisis-la dans tes photos. Elle est réduite et reste dans l’effectif et ses sauvegardes.</span></div>
      </div>
      <div class="row2 even2">${fld('prenom','Prénom')}${fld('nom','Nom')}</div>
      <div class="row3">${fld('naissance','Date de naissance','date')}
        <label class="f" for="tf-num">N° maillot<input id="tf-num" class="in num" inputmode="numeric" maxlength="2" data-tf="num" value="${esc(p.num)}" ${dis}></label></div>
      <label class="f" for="tf-poste">Poste principal<select id="tf-poste" class="in" data-tf="poste" ${dis}><option value="">À définir</option>${POSTS.map(([c,l])=>`<option value="${c}" ${p.poste===c?'selected':''}>${c} · ${l}</option>`).join('')}</select></label>
      <div class="f">Postes alternatifs<div class="chips altchips" role="group" aria-label="Postes alternatifs">${POSTS.map(([c,l])=>{const main=c===p.poste,on=alts(p).includes(c);return `<button class="chip ${main?'main':''}" data-act="talt" data-v="${c}" aria-pressed="${on}" ${main||ex?'disabled':''} aria-label="${l}${main?' (poste principal)':''}"><b>${c}</b><span>${l}</span></button>`}).join('')}</div><span class="hint">Touche les postes où il peut aussi jouer. Le poste principal est grisé.</span></div>
      <label class="f" for="tf-forts">Points forts<textarea id="tf-forts" class="in big-txt" data-tf="forts" placeholder="Ex. tir en suspension aux 9 m, vitesse en contre-attaque" ${dis}>${esc(p.forts)}</textarea></label>
      <label class="f" for="tf-travail">À travailler<textarea id="tf-travail" class="in big-txt" data-tf="travail" placeholder="Ex. choix de passe sous pression, repli défensif" ${dis}>${esc(p.travail)}</textarea></label>
      ${del}
    </div>
    <div class="pstats">${p.poste==='GB'
      ?gkStats(st)+(st.shots.length||alts(p).some(c=>c!=='GB')?`<h2 class="sect">Comme joueur de champ</h2>${fieldStats(st)}`:'')
      :fieldStats(st)+(st.faced.length||alts(p).includes('GB')?`<h2 class="sect">Au poste de gardien</h2>${gkStats(st)}`:'')}</div>
  </div>`;
}
function vSeason(){
  const ms=teamMatches(),all=ms.flatMap(m=>m.events),us=all.filter(e=>e.team==='us'&&e.type==='shot'),op=all.filter(e=>e.team==='opp'&&e.type==='shot');
  const opOn=op.filter(isOn),sv=opOn.filter(e=>e.res==='saved').length,lo=all.filter(e=>e.team==='us'&&e.type==='loss').length;
  const ps=TEAM.players.slice().sort(teamSort),lnk=p=>`<button class="lnk" data-act="tp" data-id="${p.id}">${esc(tFull(p))}</button>`;
  const fr=ps.map(p=>({p,st:playerSeason(p.id,ms)})).filter(x=>x.st.mj&&(x.p.poste!=='GB'||x.st.shots.length)).sort((a,b)=>goals(b.st.shots)-goals(a.st.shots))
    .map(({p,st})=>{const g=goals(st.shots),s7=st.shots.filter(e=>e.phase==='seven'||e.zone==='7M');return[esc(p.num),lnk(p),st.mj,`<strong>${g}</strong>`,st.shots.length,pct(g,st.shots.length),s7.length?`${goals(s7)}/${s7.length}`:'–',st.loss]});
  const gr=ps.map(p=>({p,st:playerSeason(p.id,ms)})).filter(x=>x.st.mj&&(x.p.poste==='GB'||x.st.faced.length))
    .map(({p,st})=>{const o=st.faced.filter(isOn),s=o.filter(e=>e.res==='saved').length;return[esc(p.num),lnk(p),st.mj,o.length,`<strong>${s}</strong>`,pct(s,o.length),st.loss]});
  const mr=ms.map(m=>{const sc=scoreOf(m),a=shotsOf(m.events,'us'),g=gkStat(m.events,'us');return[esc(fmtDate(m.date)),esc(m.opponent||'–'),`<strong>${sc.us}–${sc.op}</strong>`,pct(goals(a),a.length),pct(g.s,g.t),cnt(m.events,'us','loss')]});
  return `${teamBanner()}<div class="pane-head"><div><h1>Saison</h1><p class="hint">Cumul de ${plural(ms.length,'match')} enregistré${ms.length>1?'s':''}. Les stats individuelles ne comptent que les actions attribuées à un joueur.</p></div></div>
  <div class="kpis">${kpi('Matchs',ms.length,'')}${kpi('Buts relevés',`<span class="us">${goals(us)}</span><em>–</em><span class="op">${goals(op)}</span>`,'marqués – encaissés')}${kpi('Efficacité au tir',pct(goals(us),us.length),`${goals(us)} buts sur ${us.length} tirs`)}${kpi('% arrêts',pct(sv,opOn.length),`${sv} sur ${opOn.length} tirs cadrés`)}${kpi('Pertes par match',ms.length?(lo/ms.length).toFixed(1).replace('.',','):'–',`${lo} au total`)}</div>
  <div class="card"><h2>Joueurs de champ</h2>${tbl(['N°','Joueur','Matchs','Buts','Tirs','%','7 m','Pertes'],fr,[0,1])}</div>
  <div class="card"><h2>Gardiens</h2>${tbl(['N°','Gardien','Matchs','Tirs cadrés','Arrêts','% arrêts','Pertes'],gr,[0,1])}</div>
  <div class="card"><h2>Matchs</h2>${tbl(['Date','Adversaire','Buts relevés','% au tir','% arrêts','Pertes'],mr,[0,1])}</div>`;
}
/* ---------- Sauvegardes : par appareil, fusion entre iPad, copies automatiques ---------- */
const APP=!!document.querySelector('meta[name="b2t-version"]');
const CLOUD=!!window.B2T_CLOUD;
const BKM=Object.assign({device:'',lastExport:0,lastChange:0,lastSnap:0,delM:{}},LS.get('hb.bk',{})||{});
function saveBKM(){LS.set('hb.bk',BKM)}
const needBackup=()=>BKM.lastChange>BKM.lastExport;
function markChange(){const was=needBackup();BKM.lastChange=Date.now();saveBKM();if(APP&&!was)renderTop()}
function relTime(ts){if(!ts)return 'jamais';const d=(Date.now()-ts)/60000;if(d<1.5)return 'à l’instant';if(d<60)return `il y a ${Math.round(d)} min`;if(d<60*20)return `il y a ${Math.round(d/60)} h`;return 'le '+new Date(ts).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+' à '+hhmm(ts)}
const clone=o=>JSON.parse(JSON.stringify(o));
const fmtStamp=iso=>{const d=new Date(iso);return isNaN(d)?'':d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'})+' à '+hhmm(d.getTime())};
function realMatches(){return IDX.map(x=>getMatch(x.id)).filter(m=>m&&!m.example)}
function backupData(){return{app:'banc2touche',version:2,exportedAt:new Date().toISOString(),exportedBy:BKM.device||'',team:TEAM.example?null:TEAM,matches:realMatches(),deletedMatches:BKM.delM||{}}}
async function exportBackup(){
  const d=backupData(),n=new Date(),name=`banc2touche-${slug(BKM.device||'appareil')}-${todayISO()}-${String(n.getHours()).padStart(2,'0')}h${String(n.getMinutes()).padStart(2,'0')}.json`;
  const r=await saveFile(name,new Blob([JSON.stringify(d)],{type:'application/json'}),'Sauvegarde enregistrée : '+name);
  if(r==='saved'){BKM.lastExport=Date.now();saveBKM();renderTop();if((S.mode==='team'&&S.tview==='backup')||S.view==='report')renderView()}
  else if(!r)showModal('Sauvegarde',JSON.stringify(d),'Copie tout ce texte dans un fichier terminé par .json pour le garder.');
}
function readBackup(files){
  const u=S.ui;u.imp=null;u.impErr='';
  const list=[...(files||[])];if(!list.length)return;
  Promise.all(list.map(f=>f.text().then(t=>({f,t})))).then(rs=>{
    const items=[];
    rs.forEach(({f,t})=>{try{
      const d=JSON.parse(t);if(!d||d.app!=='banc2touche')throw 0;
      const team=d.team&&Array.isArray(d.team.players)?d.team:null,matches=Array.isArray(d.matches)?d.matches.filter(m=>m&&m.id&&!m.example):[];
      if(!team&&!matches.length)throw 0;
      items.push({name:f.name,by:d.exportedBy||'',at:d.exportedAt||'',team,matches,deletedMatches:d.deletedMatches||{}});
    }catch(e){u.impErr=`« ${f.name} » n’est pas une sauvegarde Banc2Touche : il a été ignoré.`}});
    items.sort((a,b)=>String(a.at).localeCompare(String(b.at)));
    u.imp=items.length?{items}:null;
    if(!items.length&&!u.impErr)u.impErr='Aucun fichier de sauvegarde valide.';
    renderView();
  }).catch(()=>{u.impErr='Impossible de lire ce fichier. Réessaie ou choisis-en un autre.';renderView()});
}
function removeMatchLocal(id){LS.del('hb.m.'+id);delete MC[id];IDX=IDX.filter(x=>x.id!==id);LS.set('hb.idx',IDX);dirty.delete(id);if(DB)col().doc(id).delete().catch(()=>{})}
function storeImported(m){const nm=normalize(clone(m));nm.teamLinked=true;storeLocal(nm);upsertIdx(nm);if(DB)dirty.add(nm.id);if(S.m&&S.m.id===nm.id)S.m=nm}
function mergeData(imp,res){
  if(imp.team){
    if(!TEAM.players.length||TEAM.fresh||TEAM.example){TEAM=Object.assign({kind:'team'},clone(imp.team),{example:false});delete TEAM.fresh;res.addP+=TEAM.players.length}
    else{
      const rem=Object.assign({},imp.team.removed||{},TEAM.removed||{}),byId=new Map(TEAM.players.map(p=>[p.id,p])),impNewer=(imp.team.updatedAt||0)>(TEAM.updatedAt||0);
      imp.team.players.forEach(p=>{
        const loc=byId.get(p.id);
        if(!loc){if(rem[p.id]&&rem[p.id]>=(p.updatedAt||0))return;TEAM.players.push(clone(p));res.addP++;return}
        const pu=p.updatedAt||0,lu=loc.updatedAt||0;
        if((pu>lu||(pu===lu&&impNewer))&&JSON.stringify(p)!==JSON.stringify(loc)){Object.keys(loc).forEach(k=>delete loc[k]);Object.assign(loc,clone(p));res.updP++}
      });
      TEAM.players=TEAM.players.filter(p=>!(rem[p.id]&&rem[p.id]>=(p.updatedAt||0)));TEAM.removed=rem;
    }
    TEAM.players.forEach(p=>{if(!Array.isArray(p.postes2))p.postes2=[]});
    touchTeam();
  }
  const delM=imp.deletedMatches||{};
  imp.matches.forEach(m=>{
    if((BKM.delM||{})[m.id]>=(m.updatedAt||0))return;
    const loc=getMatch(m.id);
    if(loc&&(loc.updatedAt||0)>=(m.updatedAt||0))return;
    storeImported(m);if(loc)res.updM++;else res.addM++;
  });
  Object.entries(delM).forEach(([id,ts])=>{const loc=getMatch(id);if(loc&&(loc.updatedAt||0)<=ts){removeMatchLocal(id);res.delM++}});
  BKM.delM=Object.assign({},BKM.delM||{},delM);saveBKM();
}
async function applyCloud(d,mode){
  const it={team:d&&d.team&&Array.isArray(d.team.players)?d.team:null,matches:d&&Array.isArray(d.matches)?d.matches.filter(m=>m&&m.id&&!m.example):[],deletedMatches:(d&&d.deletedMatches)||{}};
  await takeSnap(mode==='replace'?'avant restauration serveur':'avant synchro serveur');
  const r={addP:0,updP:0,addM:0,updM:0,delM:0};
  if(mode==='replace')replaceData(it);else mergeData(it,r);
  settleCurrent();S.ui.snaps=null;saveUI();renderAll();
  return r;
}
function markCloudSaved(){const t=Date.now();BKM.lastCloud=t;BKM.lastExport=t;saveBKM();renderTop();if(S.mode==='team'&&S.tview==='backup')renderView()}
function settleCurrent(){
  if(IDX.some(x=>x.id===S.m.id)&&getMatch(S.m.id)){S.m=normalize(getMatch(S.m.id));return}
  if(S.m.events.length||S.m.opponent){const nx=IDX.slice().sort((a,b)=>b.updatedAt-a.updatedAt)[0];S.m=nx&&getMatch(nx.id)?normalize(getMatch(nx.id)):newMatch([]);LS.set('hb.cur',S.m.id)}
}
function replaceData(imp){
  if(imp.team){TEAM=Object.assign({kind:'team'},clone(imp.team),{example:false});delete TEAM.fresh;TEAM.players.forEach(p=>{if(!Array.isArray(p.postes2))p.postes2=[]});touchTeam()}
  const keep=new Set(imp.matches.map(m=>m.id));
  IDX.slice().forEach(x=>{if(!keep.has(x.id))removeMatchLocal(x.id)});
  imp.matches.forEach(storeImported);
  markChange();
}
async function applyBackup(mode){
  const imp=S.ui.imp;if(!imp)return;
  await takeSnap('avant import');
  let msg;
  if(mode==='replace'&&imp.items.length===1){replaceData(imp.items[0]);msg=`Données remplacées : ${plural(TEAM.players.length,'joueur')} · ${plural(realMatches().length,'match')}`}
  else{
    const r={addP:0,updP:0,addM:0,updM:0,delM:0};imp.items.forEach(it=>mergeData(it,r));
    msg=`Fusion : ${r.addP} joueur${r.addP>1?'s':''} ajouté${r.addP>1?'s':''}, ${r.updP} mis à jour · ${r.addM} match${r.addM>1?'s':''} ajouté${r.addM>1?'s':''}, ${r.updM} mis à jour${r.delM?` · ${r.delM} supprimé${r.delM>1?'s':''}`:''}`;
  }
  if(DB&&dirty.size){setSync('pending');flushCloud()}
  settleCurrent();S.ui.imp=null;S.ui.snaps=null;saveUI();renderAll();toast(msg);
}
// Copies automatiques sur l'appareil (IndexedDB)
let IDBP=null;
function idb(){if(IDBP)return IDBP;IDBP=new Promise((ok,ko)=>{try{const r=indexedDB.open('banc2touche',1);r.onupgradeneeded=()=>{r.result.createObjectStore('snaps',{keyPath:'id'})};r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)}catch(e){ko(e)}});IDBP.catch(()=>{IDBP=null});return IDBP}
function idbReq(mode,fn){return idb().then(db=>new Promise((ok,ko)=>{const tx=db.transaction('snaps',mode),rq=fn(tx.objectStore('snaps'));tx.oncomplete=()=>ok(rq?rq.result:null);tx.onerror=()=>ko(tx.error);tx.onabort=()=>ko(tx.error)}))}
async function snapList(){try{const a=await idbReq('readonly',st=>st.getAll());return (a||[]).sort((x,y)=>y.id-x.id)}catch(e){return null}}
async function takeSnap(reason){
  try{
    if(TEAM.example||(!TEAM.players.length&&!realMatches().length))return false;
    const d=backupData(),id=Date.now();
    await idbReq('readwrite',st=>st.put({id,reason,np:d.team?d.team.players.length:0,nm:d.matches.length,data:d}));
    const all=await snapList();if(all&&all.length>12){const old=all.slice(12).map(x=>x.id);await idbReq('readwrite',st=>{old.forEach(k=>st.delete(k));return null})}
    BKM.lastSnap=id;saveBKM();return true;
  }catch(e){return false}
}
function maybeSnap(reason,minGap){if(BKM.lastChange>BKM.lastSnap&&Date.now()-BKM.lastSnap>(minGap||0))takeSnap(reason)}
async function restoreSnap(id){
  const all=await snapList(),sn=all&&all.find(x=>x.id===id);if(!sn){toast('Cette copie n’est plus disponible.');return}
  await takeSnap('avant restauration');
  replaceData({team:sn.data.team,matches:sn.data.matches||[]});settleCurrent();
  S.ui.snapConf=null;S.ui.snaps=null;renderAll();toast('Copie restaurée : '+new Date(id).toLocaleString('fr-FR',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}));
}
async function exportSnap(id){
  const all=await snapList(),sn=all&&all.find(x=>x.id===id);if(!sn)return;
  const d=new Date(id),ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const name=`banc2touche-${slug(BKM.device||'appareil')}-copie-${ds}-${String(d.getHours()).padStart(2,'0')}h${String(d.getMinutes()).padStart(2,'0')}.json`;
  await saveFile(name,new Blob([JSON.stringify(sn.data)],{type:'application/json'}),'Copie enregistrée : '+name);
}
function snapHTML(){
  const u=S.ui,snaps=u.snaps||[];
  return u.snapsOk===false?'<p class="hint">Les copies automatiques ne sont pas disponibles sur cet appareil.</p>':snaps.length?`<ul class="snaps">${snaps.map(sn=>`<li><span class="si"><b>${esc(new Date(sn.id).toLocaleString('fr-FR',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))}</b><small>${esc(sn.reason||'')} · ${plural(sn.np,'joueur')} · ${plural(sn.nm,'match')}</small></span>${u.snapConf===sn.id?`<button class="btn danger sm" data-act="snapRestore" data-id="${sn.id}">Remplacer mes données</button><button class="btn ghost sm" data-act="snapNo">Non</button>`:`<button class="btn sm" data-act="snapAsk" data-id="${sn.id}">Restaurer</button><button class="btn ghost sm" data-act="snapExport" data-id="${sn.id}">Enregistrer</button>`}</li>`).join('')}</ul>`:'<p class="hint">Aucune copie pour l’instant.</p>';
}
function vBackup(){
  const u=S.ui,ms=realMatches(),np=TEAM.example?0:TEAM.players.length,imp=u.imp,need=needBackup();
  if(u.snaps==null&&!u.snapsLoading){u.snapsLoading=true;snapList().then(l=>{u.snaps=l||[];u.snapsOk=!!l;u.snapsLoading=false;const el=$('#snapbox');if(el)el.innerHTML=snapHTML()})}
  const status=BKM.lastExport?`Dernière sauvegarde ${relTime(BKM.lastExport)}.`:'Aucune sauvegarde enregistrée depuis cet appareil.';
  return `<div class="pane-head"><div><h1>Sauvegarde</h1><p class="hint">${CLOUD?'Synchronise avec le serveur du club après chaque match. Le fichier de sauvegarde reste possible en secours.':APP?'Dans l’appli, les données ne sont que sur cet iPad. Range une sauvegarde dans iCloud Drive après chaque match.':'Sur ce site, tes données sont enregistrées dans ton compte. La sauvegarde sert à les passer dans l’appli de l’iPad.'}</p></div></div>
  <div class="bkgrid">
    <div class="card"><h2>Cet appareil</h2>
      <label class="f" for="bk-dev">Nom de l’appareil<input id="bk-dev" class="in" data-bkm="device" value="${esc(BKM.device)}" placeholder="Ex. iPad de Nino" autocomplete="off"></label>
      <div class="bkstate ${need?'need':''}"><b>${need?'Modifications à sauvegarder':'Tout est sauvegardé'}</b><span>${status}${need&&BKM.lastChange?` Dernière modification ${relTime(BKM.lastChange)}.`:''}</span></div>
      <div class="row"><button class="btn primary" data-act="bkExport" ${np||ms.length?'':'disabled'}>Enregistrer une sauvegarde</button></div>
      <p class="hint">Un fichier .json avec ${plural(np,'fiche')} joueur et ${plural(ms.length,'match')}, nommé avec le nom de l’appareil, la date et l’heure.</p>
    </div>
    ${CLOUD?`<div class="card"><h2>Serveur du club</h2>
      <div class="bkstate ${BKM.lastCloud?'':'need'}"><b>${BKM.lastCloud?'Synchronisé avec le serveur':'Jamais synchronisé'}</b><span>${BKM.lastCloud?`Dernière synchronisation ${relTime(BKM.lastCloud)}.`:'Les données ne sont pas encore sur le serveur du club.'}</span></div>
      <div class="row"><button class="btn primary" data-act="openCloud">Synchroniser avec le serveur</button></div>
      <p class="hint">Envoie l’effectif et les matchs sur le serveur du club et récupère ceux des autres appareils.</p>
    </div>`:''}
    <div class="card"><h2>Où ranger les sauvegardes</h2>
      <ol class="steps">
        <li>Touche « Enregistrer une sauvegarde », puis <strong>Enregistrer dans Fichiers</strong>.</li>
        <li>Choisis <strong>iCloud Drive</strong>, dossier <strong>Banc2Touche</strong> (crée-le la première fois). Les fichiers y sont à l’abri même si l’iPad est perdu.</li>
        <li>Fais pareil sur chaque appareil : chaque fichier porte le nom de l’iPad qui l’a créé.</li>
        <li>Pour regrouper les matchs de tout le monde : Importer, sélectionne un ou plusieurs fichiers, puis <strong>Fusionner</strong>.</li>
      </ol>
      <p class="hint">Rythme conseillé : après chaque match, et toujours avant de supprimer ou réinstaller l’appli.</p>
    </div>
    <div class="card"><h2>Importer ou fusionner</h2>
      <p class="hint">Fusionner ajoute les joueurs et les matchs qui manquent et garde la version la plus récente de chacun. Tout remplacer efface d’abord les données de cet appareil.</p>
      <div class="row"><label class="btn" for="bk-file">Choisir un ou plusieurs fichiers</label><input id="bk-file" class="vh" type="file" accept=".json,application/json" multiple></div>
      ${imp?`<div class="impbox"><ul class="implist">${imp.items.map(it=>`<li><strong>${esc(it.by||it.name)}</strong>${it.at?` · ${esc(fmtStamp(it.at))}`:''} : ${it.team?plural(it.team.players.length,'joueur'):'pas d’effectif'} · ${plural(it.matches.length,'match')}</li>`).join('')}</ul>
        <div class="row"><button class="btn primary" data-act="bkApply" data-v="merge">Fusionner avec mes données</button>${imp.items.length===1?'<button class="btn" data-act="bkApply" data-v="replace">Tout remplacer</button>':''}<button class="btn ghost" data-act="bkCancel">Annuler</button></div>
        <p class="hint">Une copie automatique est faite juste avant, pour pouvoir revenir en arrière.</p></div>`:''}
      ${u.impErr?`<p class="err">${esc(u.impErr)}</p>`:''}
    </div>
    <div class="card"><div class="card-head"><h2>Copies automatiques</h2><button class="btn sm" data-act="snapNow" ${np||ms.length?'':'disabled'}>Faire une copie</button></div>
      <p class="hint">Les 12 dernières copies restent sur cet appareil : à l’ouverture, en fin de match et avant chaque import. Elles servent à revenir en arrière après une erreur, mais disparaissent si l’appli est supprimée.</p>
      <div id="snapbox">${snapHTML()}</div>
    </div>
  </div>
  ${(()=>{const mv=document.querySelector('meta[name="b2t-version"]');return mv?`<p class="hint">Version de l’appli : <strong>${esc(mv.content)}</strong></p>`:''})()}`;
}
/* ---------- Fiche PDF de fin de match ---------- */
let PDFLIB=null;
function loadPdfLib(){
  if(window.jspdf&&window.jspdf.jsPDF)return Promise.resolve(window.jspdf.jsPDF);
  if(PDFLIB)return PDFLIB;
  PDFLIB=new Promise((ok,ko)=>{const sc=document.createElement('script');sc.src=APP?'jspdf.umd.min.js':'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';sc.onload=()=>window.jspdf&&window.jspdf.jsPDF?ok(window.jspdf.jsPDF):ko(new Error('pdf'));sc.onerror=()=>ko(new Error('pdf'));document.head.appendChild(sc)});
  PDFLIB.catch(()=>{PDFLIB=null});
  return PDFLIB;
}
const PCOL={navy:[35,42,107],deep:[27,32,87],gold:[253,197,19],ink:[22,26,59],muted:[91,95,126],line:[215,217,231],soft:[243,243,248],floor:[42,49,118],area:[75,77,154],good:[26,127,79],bad:[191,55,45],white:[255,255,255],post:[200,41,46],light:[200,204,235]};
const pdfT=s=>String(s==null?'':s).replace(/[   ]/g,' ').replace(/[^\x20-\x7E -ÿŒœ–—‘’“”•…]/g,'');
const cmix=(a,b,t)=>a.map((v,i)=>Math.round(v*t+b[i]*(1-t)));
async function exportPdf(){
  const m=S.m;
  if(!m.events.length){toast('Relève des actions pendant le match avant de créer la fiche.');return}
  toast('Préparation de la fiche PDF…');
  let JS;try{JS=await loadPdfLib()}catch(e){toast(APP?'Le module PDF n’est pas encore en mémoire : ouvre l’appli une fois avec du réseau, puis réessaie.':'Impossible de charger le module PDF. Vérifie la connexion puis réessaie.');return}
  let doc;try{doc=buildMatchPdf(JS,m)}catch(e){console.error(e);toast('La fiche PDF n’a pas pu être créée.');return}
  const name=`fiche-match_${m.date||todayISO()}_${slug(m.opponent||'match')}.pdf`;
  const r=await saveFile(name,doc.output('blob'),'Fiche PDF enregistrée : '+name);
  if(!r)toast('Enregistrement du PDF impossible ici.');
}
function buildMatchPdf(JS,m){
  const doc=new JS({unit:'mm',format:'a4',compress:true});
  const W=210,M=12,CW=W-2*M,BOT=281;let y=0,page=1;
  const F=(st,sz,c)=>{doc.setFont('helvetica',st);doc.setFontSize(sz);doc.setTextColor(...(c||PCOL.ink))};
  const T=(s,x,yy,o)=>doc.text(pdfT(s),x,yy,o||{});
  const fill=c=>doc.setFillColor(...c),stroke=c=>doc.setDrawColor(...c);
  const footer=()=>{F('normal',7.5,PCOL.muted);T(`Banc2Touche · MEHB${m.opponent?' vs '+m.opponent:''} · ${fmtDate(m.date)}`,M,290);T(`Page ${page}`,W-M,290,{align:'right'})};
  const newPage=()=>{footer();doc.addPage();page++;y=14};
  const need=h=>{if(y+h>BOT)newPage()};
  const section=(title,sub,minH)=>{need(12.5+(minH==null?40:minH));fill(PCOL.navy);doc.rect(M,y,CW,8,'F');fill(PCOL.gold);doc.rect(M,y+8,CW,.9,'F');F('bolditalic',11,PCOL.white);T(title.toUpperCase(),M+3,y+5.7);if(sub){F('normal',8.5,PCOL.light);T(sub,W-M-3,y+5.7,{align:'right'})}y+=12.5};
  const label=(s,x,yy)=>{F('bold',7.3,PCOL.navy);T(s.toUpperCase(),x,yy)};
  const RH=5.4,tableH=n=>RH*(Math.max(n,1)+1);
  function table(x,yy,cols,head,rows,left){
    left=left||[0];const al=i=>left.includes(i)?'left':'right',ax=(cx,i)=>left.includes(i)?cx+1.5:cx+cols[i]-1.5;
    const tw=cols.reduce((a,b)=>a+b,0);let h=0,cx=x;
    fill(PCOL.soft);doc.rect(x,yy,tw,RH,'F');F('bold',6.6,PCOL.muted);
    head.forEach((hd,i)=>{T(String(hd).toUpperCase(),ax(cx,i),yy+3.7,{align:al(i)});cx+=cols[i]});h+=RH;
    doc.setLineWidth(.2);stroke(PCOL.line);
    rows.forEach(r=>{cx=x;r.forEach((v,i)=>{const bold=v&&typeof v==='object';F(bold?'bold':'normal',8,PCOL.ink);let t=pdfT(bold?v.b:v);const mw=cols[i]-3;while(t.length>2&&doc.getTextWidth(t)>mw)t=t.slice(0,-2)+'…';doc.text(t,ax(cx,i),yy+h+3.8,{align:al(i)});cx+=cols[i]});doc.line(x,yy+h+RH,x+tw,yy+h+RH);h+=RH});
    if(!rows.length){F('italic',8,PCOL.muted);T('Aucune donnée.',x+1.5,yy+h+3.8);h+=RH}
    return h;
  }
  // tableau qui continue sur la page suivante (en-tête répété) plutôt que de laisser un trou
  function flowTable(x,cols,head,rows,left){
    let i=0;
    do{let fit=Math.floor((BOT-y)/RH)-1;if(fit<Math.min(3,rows.length-i)){newPage();fit=Math.floor((BOT-y)/RH)-1}
      const rest=rows.length-i-fit;if(rest>0&&rest<3&&fit>3)fit=Math.max(3,fit-(3-rest));
      const part=rows.slice(i,i+Math.max(1,fit));y+=table(x,y,cols,head,part,left);i+=part.length;if(i<rows.length)newPage()}while(i<rows.length);
  }
  function court(x,yy,w,marks){
    const s=w/20,h=14.4*s,P=(px,py)=>[x+px*s,yy+py*s];
    fill(PCOL.floor);doc.rect(x,yy-1.4*s,w,h+1.4*s,'F');
    const arc=(cx,r,a0,a1,n)=>{const pts=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;pts.push([cx+r*Math.cos(a),r*Math.sin(a)])}return pts};
    const poly=(pts,mode,closed)=>{const p0=P(...pts[0]),d=[];for(let i=1;i<pts.length;i++){const a=P(...pts[i-1]),b=P(...pts[i]);d.push([b[0]-a[0],b[1]-a[1]])}doc.lines(d,p0[0],p0[1],[1,1],mode,closed)};
    const six=[...arc(8.5,6,Math.PI,Math.PI/2,16),...arc(11.5,6,Math.PI/2,0,16)];
    fill(PCOL.area);poly(six,'F',true);
    stroke(PCOL.white);doc.setLineWidth(.35);poly(six,'S',false);
    const a9=Math.acos(-8.5/9),nine=[...arc(8.5,9,a9,Math.PI/2,16),...arc(11.5,9,Math.PI/2,Math.PI-a9,16)];
    doc.setLineDashPattern([1.2,1],0);poly(nine,'S',false);doc.setLineDashPattern([],0);
    doc.rect(x,yy,w,h,'S');
    const g=P(8.5,-.9);fill(PCOL.deep);doc.rect(g[0],g[1],3*s,.9*s,'FD');
    const a7=P(9.5,7),b7=P(10.5,7);doc.line(a7[0],a7[1],b7[0],b7[1]);
    (marks||[]).forEach(mk=>{const [cx,cy]=P(mk.x,mk.y);fill(mk.col);stroke(PCOL.white);doc.setLineWidth(.3);doc.circle(cx,cy,mk.r*s,'FD');F('bold',7,PCOL.white);T(mk.t1,cx,cy+.3,{align:'center'});F('normal',5.6,PCOL.white);T(mk.t2,cx,cy+2.7,{align:'center'})});
    return h+1.4*s;
  }
  function goal(x,yy,w,cells,side,view){
    const h=w*2/3,maxT=Math.max(1,...Object.values(cells).map(c=>c.t)),pw=1.6;
    fill(PCOL.post);doc.rect(x-pw,yy-pw,w+2*pw,pw,'F');doc.rect(x-pw,yy,pw,h,'F');doc.rect(x+w,yy,pw,h,'F');
    fill(PCOL.white);for(let i=1;i<15;i+=2)doc.rect(x-pw+i*(w+2*pw)/15,yy-pw,(w+2*pw)/15,pw,'F');
    for(let i=1;i<10;i+=2){doc.rect(x-pw,yy+i*h/10,pw,h/10,'F');doc.rect(x+w,yy+i*h/10,pw,h/10,'F')}
    const box=(k,bx,by,bw,bh,big)=>{
      const c=cells[k];
      const lab=GZL[view==='gk'?mirrorZ(k):k];
      if(!c){fill(PCOL.soft);doc.rect(bx,by,bw,bh,'F');F('normal',big?7:6,PCOL.muted);T(lab,bx+bw/2,by+bh/2+1,{align:'center'});return}
      const ratio=side==='opp'?c.s/c.t:c.g/c.t,k2=.35+.6*c.t/maxT,dark=k2>.62,ink=dark?PCOL.white:PCOL.ink;
      fill(cmix(cmix(PCOL.good,PCOL.bad,ratio),PCOL.white,k2));doc.rect(bx,by,bw,bh,'F');
      F('normal',big?6:5.4,ink);T(lab,bx+bw/2,by+(big?3.2:2.6),{align:'center'});
      F('bold',big?12:9,ink);T(String(c.t),bx+bw/2,by+bh/2+(big?2.4:1.6),{align:'center'});
      F('normal',big?6:5.2,ink);T(side==='opp'?`${c.s} arr. · ${c.g} but${c.g>1?'s':''}`:`${c.g} but${c.g>1?'s':''} · ${c.s} arr.`,bx+bw/2,by+bh-(big?2:1.3),{align:'center'});
    };
    const at=view==='gk'?{HD:[0,0],HG:[1,0],BD:[0,1],BG:[1,1]}:{HG:[0,0],HD:[1,0],BG:[0,1],BD:[1,1]};
    ['HG','HD','BG','BD'].forEach(k=>{const [c,r]=at[k];box(k,x+c*w/2+.4,yy+r*h/2+.4,w/2-.8,h/2-.8,true)});
    const sy=yy+h+2.2,sw=(w-2)/3;
    ['LOB','CONT','SOUS'].forEach((k,i)=>box(k,x+i*(sw+1),sy,sw,11,false));
    F('normal',6.5,PCOL.muted);T(view==='gk'?'Vue du gardien':'Vue du tireur',x+w/2,sy+11+3.6,{align:'center'});
    return h+2.2+11+5;
  }
  const L=m.events,us=shotsOf(L,'us'),op=shotsOf(L,'opp'),gU=gkStat(L,'us'),gO=gkStat(L,'opp'),sc=scoreOf(m);
  // ----- en-tête -----
  fill(PCOL.deep);doc.rect(0,0,W,36,'F');fill(PCOL.gold);doc.rect(0,36,W,1.4,'F');
  {const x=M,yy=6,sz=24;fill(PCOL.gold);doc.roundedRect(x,yy,sz,sz,4.5,4.5,'F');fill(PCOL.navy);doc.roundedRect(x,yy,sz,sz-3.2,4.5,4.5,'F');doc.rect(x,yy+sz-8,sz,4.8,'F');
   F('bolditalic',29,PCOL.white);const ws=['B','2','T'].map(c=>doc.getTextWidth(c));let cx=x+(sz-ws.reduce((a,b)=>a+b,0))/2-.4;['B','2','T'].forEach((c,i)=>{doc.setTextColor(...(i===1?PCOL.gold:PCOL.white));doc.text(c,cx,yy+14.2);cx+=ws[i]})}
  F('bold',8.5,PCOL.gold);T('FICHE DE FIN DE MATCH',M+30,11);
  F('bolditalic',18,PCOL.white);let ttl=pdfT(`MEHB vs ${m.opponent||'adversaire'}`.toUpperCase());while(ttl.length>6&&doc.getTextWidth(ttl)>118)ttl=ttl.slice(0,-2)+'…';doc.text(ttl,M+30,20);
  F('normal',9,PCOL.light);{const ml=doc.splitTextToSize(pdfT([fmtDate(m.date),SIDEL[m.side]||'',m.competition,m.venue].filter(Boolean).join(' · ')),104).slice(0,2);doc.text(ml,M+30,26.5,{lineHeightFactor:1.25})}
  F('bold',26,PCOL.white);T(`${sc.us} – ${sc.op}`,W-M,21,{align:'right'});F('normal',7,PCOL.light);T('BUTS RELEVÉS · MEHB – ADVERSAIRE',W-M,27,{align:'right'});
  y=44;
  // ----- résumé -----
  section('Résumé du match',`${plural(L.length,'action')} relevée${L.length>1?'s':''}`);
  const kp=[['Buts',`${goals(us)} – ${goals(op)}`,'MEHB – adversaire'],['Efficacité au tir',`${pct(goals(us),us.length)} / ${pct(goals(op),op.length)}`,`MEHB ${goals(us)}/${us.length} · adv. ${goals(op)}/${op.length}`],['Pertes de balle',`${cnt(L,'us','loss')} / ${cnt(L,'opp','loss')}`,'MEHB / adversaire'],['% arrêts',`${pct(gU.s,gU.t)} / ${pct(gO.s,gO.t)}`,`nos GB ${gU.s}/${gU.t} · leur GB ${gO.s}/${gO.t}`]];
  const kw=(CW-6)/4;
  kp.forEach((k,i)=>{const x=M+i*(kw+2);fill(PCOL.soft);doc.roundedRect(x,y,kw,19,2,2,'F');F('bold',6.6,PCOL.muted);T(k[0].toUpperCase(),x+3,y+5);F('bold',13,PCOL.navy);T(k[1],x+3,y+12);F('normal',6.4,PCOL.muted);T(k[2],x+3,y+16.5)});
  y+=23;
  const halfRow=h=>{const E=evs(m,h),a=shotsOf(E,'us'),b=shotsOf(E,'opp'),g=gkStat(E,'us'),g2=gkStat(E,'opp');return[h?HALFL[h]:{b:'Match complet'},`${goals(a)} – ${goals(b)}`,pct(goals(a),a.length),pct(goals(b),b.length),cnt(E,'us','loss'),cnt(E,'opp','loss'),pct(g.s,g.t),pct(g2.s,g2.t)]};
  y+=table(M,y,[34,20,20,20,24,22,24,22],['Période','Score','Tir MEHB','Tir adv.','Pertes MEHB','Pertes adv.','Arrêts MEHB','Arrêts adv.'],[halfRow(1),halfRow(2),halfRow(0)])+6;
  // ----- attaque et défense -----
  const zoneMarks=(a,team)=>{const by={};a.forEach(e=>{if(!e.zone||!ZPOS[e.zone])return;const z=by[e.zone]||(by[e.zone]={t:0,g:0});z.t++;if(e.res==='goal')z.g++});return Object.entries(by).map(([k,z])=>{const r=z.g/z.t,[zx,zy]=ZPOS[k];return{x:zx,y:zy,r:1.25,col:cmix(PCOL.good,PCOL.bad,team==='us'?r:1-r),t1:`${Math.round(r*100)} %`,t2:`${k==='7M'?'7 m ':''}${z.g}/${z.t}`}})};
  const phaseRows=a=>PH.map(([k,,l])=>{const x=a.filter(e=>e.phase===k);return x.length?[l,`${goals(x)}/${x.length}`,pct(goals(x),x.length)]:null}).filter(Boolean);
  const espRows=a=>a.some(e=>espOf(e))?ESP.map(k=>{const x=a.filter(e=>espOf(e)===k);return x.length?['Espace '+k,`${goals(x)}/${x.length}`,pct(goals(x),x.length)]:['Espace '+k,'–','–']}):[];
  function shotBlock(title,a,team){
    section(title,`${goals(a)} but${goals(a)>1?'s':''} sur ${a.length} tirs · ${pct(goals(a),a.length)}`,72);
    const cw=84,s=cw/20,ch=14.4*s+1.4*s,pr=phaseRows(a),er=espRows(a),rw=CW-cw-8,rx=M+cw+8;
    need(Math.max(ch+12,8+tableH(pr.length)+tableH(er.length)+8));
    const y0=y;label('Réussite par zone (buts / tirs)',M,y0+2);court(M,y0+4+1.4*s,cw,zoneMarks(a,team));
    F('normal',6.5,PCOL.muted);T(team==='us'?'Vert : efficace · rouge : à travailler':'Vert : bien défendu · rouge : à corriger',M,y0+ch+8);
    label('Par phase de jeu',rx,y0+2);let yy=y0+4;yy+=table(rx,yy,[rw-44,24,20],['Phase','Buts/tirs','%'],pr)+5;
    label('Par espace (0-1 … 6-0, vu du tireur)',rx,yy+2);yy+=4;yy+=table(rx,yy,[rw-44,24,20],['Espace','Buts/tirs','%'],er);
    y=Math.max(y0+ch+12,yy+5);
  }
  shotBlock('Attaque MEHB',us,'us');
  const pr=playerRows(m,L).filter(r=>r.t||r.loss).sort((a,b)=>b.g-a.g||b.t-a.t);
  if(pr.length){need(tableH(Math.min(pr.length,4))+8);label('Joueurs',M,y+2);y+=4;flowTable(M,[14,60,20,22,22,18,16,14],['N°','Joueur','Poste','Buts','Tirs','%','7 m','Pertes'],pr.slice(0,16).map(r=>[r.p.num||'–',r.p.name,r.p.pos||'',{b:r.g},r.t,pct(r.g,r.t),r.t7?`${r.g7}/${r.t7}`:'–',r.loss]),[0,1,2]);y+=5}
  const dr=DEFS.map(d=>{const a=us.filter(e=>e.def===d),lo=L.filter(e=>e.team==='us'&&e.type==='loss'&&e.def===d).length;return a.length||lo?[d,a.length,{b:goals(a)},pct(goals(a),a.length),lo]:null}).filter(Boolean);
  if(dr.length){need(tableH(dr.length)+8);label('Contre chaque défense adverse',M,y+2);y+=4;y+=table(M,y,[70,28,28,30,30],['Défense','Tirs','Buts','%','Pertes'],dr)+5}
  shotBlock('Défense · tirs adverses',op,'opp');
  F('normal',8.5,PCOL.ink);need(8);T(`Pertes de balle provoquées chez l’adversaire : ${cnt(L,'opp','loss')}`,M,y+2);y+=8;
  // ----- gardiens -----
  function gkBlock(name,sub,shots,side,view){
    const on=shots.filter(isOn),sv=on.filter(e=>e.res==='saved').length;
    const tr=STYPES.map(([k,l])=>{const a=on.filter(e=>stype(e)===k),s2=a.filter(e=>e.res==='saved').length;return a.length?[l,a.length,{b:s2},pct(s2,a.length)]:null}).filter(Boolean);
    const gw=56,gh=gw*2/3+18.2,rx=M+gw+12,rw=CW-gw-12;
    need(Math.max(gh+18,tableH(tr.length)+20));
    const y0=y;F('bolditalic',10,PCOL.navy);T(name,M,y0+3.5);F('normal',8,PCOL.muted);T(`${pct(sv,on.length)} d’arrêts · ${sv} arrêt${sv>1?'s':''} sur ${on.length} tirs cadrés${sub?' · '+sub:''}`,M,y0+8);
    goal(M+2,y0+14,gw,cageStats(shots),side,view);
    label('Par type de tir',rx,y0+14);table(rx,y0+16,[rw-60,20,20,20],['Type de tir','Cadrés','Arrêts','% arrêts'],tr);
    y=y0+14+gh+Math.max(0,tableH(tr.length)+2-gh)+6;
  }
  section('Nos gardiens',`${pct(gU.s,gU.t)} d’arrêts · ${gU.s}/${gU.t} tirs cadrés`,62);
  const myGk=gks().filter(p=>gkStat(L,'us',p.id).t);
  const half=id=>{const a=gkStat(evs(m,1),'us',id),b=gkStat(evs(m,2),'us',id);return `1re MT ${pct(a.s,a.t)} · 2e MT ${pct(b.s,b.t)}`};
  if(myGk.length)myGk.forEach(p=>gkBlock(pLab(p.id),half(p.id),op.filter(e=>e.gk===p.id),'opp','gk'));
  else gkBlock('Tous nos gardiens','',op,'opp','gk');
  section('Gardien adverse'+(m.scout.gkNum?' n°'+m.scout.gkNum:''),`${pct(gO.s,gO.t)} d’arrêts · ${gO.s}/${gO.t} tirs cadrés`,62);
  gkBlock('Où nous avons tiré','vert = nos buts',us,'us','shooter');
  // ----- consignes et notes -----
  const keys=(m.scout.keys||'').split('\n').map(s=>s.trim()).filter(Boolean);
  if(keys.length||m.notes.length){
    section('Consignes et notes',null,18);
    if(keys.length){label('Consignes',M,y+2);y+=5;keys.forEach(k=>{const ls=doc.splitTextToSize(pdfT('• '+k),CW);need(ls.length*4.2+2);F('normal',9,PCOL.ink);doc.text(ls,M,y+3);y+=ls.length*4.2+1.5});y+=4}
    if(m.notes.length){label('Notes du match',M,y+2);y+=5;m.notes.slice().sort((a,b)=>a.ts-b.ts).forEach(n=>{const hd=[HALFL[n.half]||'',n.min?n.min+'e min':'',n.tag].filter(Boolean).join(' · ');const ls=doc.splitTextToSize(pdfT(n.text),CW-2);need(ls.length*4.2+7);F('bold',7,PCOL.muted);T(hd.toUpperCase(),M,y+3);F('normal',9,PCOL.ink);doc.text(ls,M,y+7.2);y+=ls.length*4.2+6})}
  }
  footer();
  return doc;
}
const TVIEWS={team:vTeam,profile:vProfile,season:vSeason,backup:vBackup};
const TEAM_NAV=[['team','Joueurs'],['season','Saison'],['backup','Sauvegarde']];

const VIEWS={cage:vCage,match:vMatch,compo:vCompo,scout:vScout,stats:vStats,gk:vGK,notes:vNotes,tactic:vTactic,bilan:vBilan,report:vReport,history:vHistory};
function renderView(){
  const v=$('#view');
  document.body.classList.toggle('fit',S.mode==='match'&&phaseOf(S.view)==='pendant'&&!['bilan','cage'].includes(S.view));
  if(S.mode==='team'){v.innerHTML=(TVIEWS[S.tview]||vTeam)();return}
  v.innerHTML=(VIEWS[S.view]||vStats)();
  if(S.view==='tactic')bindTactic();
}
function renderAll(){renderRail();renderHeader();renderView()}

/* ---------- Comptes : connexion, mon compte, gestion des comptes par le responsable ---------- */
// La connexion est demandée dès que l'adresse du serveur est connue : <meta name="b2t-api" content="https://…">
// dans la page, ou window.B2T_API (version Render). Sans adresse, l'appli s'ouvre sans connexion.
const API_FIXED=String(window.B2T_API||(document.querySelector('meta[name="b2t-api"]')||{}).content||'').trim().replace(/\/+$/,'');
const AUTH=!!(API_FIXED||window.B2T_AUTH);
let SESSION=AUTH?LS.get('b2t.session',null):null;
if(SESSION&&!(SESSION.token&&SESSION.user&&SESSION.api&&(!API_FIXED||SESSION.api===API_FIXED)))SESSION=null;
let API=API_FIXED||(SESSION?SESSION.api:String(LS.get('b2t.api','')||''));
const ACC={list:null,loading:false,err:'',edit:null,del:null,pw:false,checked:0,imp:null,busy:''};
const ROLE={admin:'Responsable',coach:'Coach'};
const isAdmin=()=>!!SESSION&&SESSION.user.role==='admin';
const apiErr=(status,message)=>Object.assign(new Error(message),{status});
// Appel au serveur avec la session en cours. Le plan gratuit endort le serveur : le premier appel peut prendre une minute.
async function api(path,o){
  o=o||{};
  const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),o.timeout||75000),tok=o.auth===false?'':(SESSION&&SESSION.token)||'';
  let res;
  try{
    res=await fetch(API+path,{method:o.method||'GET',signal:ctrl.signal,cache:'no-store',
      headers:Object.assign({},tok?{Authorization:'Bearer '+tok}:{},o.body?{'Content-Type':'application/json'}:{}),
      body:o.body?JSON.stringify(o.body):undefined});
  }catch(e){throw apiErr(0,'Serveur injoignable. Vérifie la connexion puis réessaie : le serveur peut mettre une minute à se réveiller.')}
  finally{clearTimeout(timer)}
  let data=null;try{data=await res.json()}catch(e){}
  if(res.ok)return data;
  // Le serveur ne reconnaît plus la session : compte désactivé, mot de passe changé ou session expirée
  if(res.status===401&&tok&&!o.quiet&&SESSION&&SESSION.token===tok)endSession('Ta session a été fermée. Reconnecte-toi.');
  throw apiErr(res.status,(data&&data.error)||'Erreur '+res.status);
}
// Ferme la session sur cet appareil. Les données de l'appli (effectif, matchs) restent sur l'appareil.
function endSession(msg){
  SESSION=null;LS.del('b2t.session');
  try{if(msg)sessionStorage.setItem('b2t.msg',msg)}catch(e){}
  location.reload();
}
function signOut(){const done=()=>endSession('');api('/api/auth/logout',{method:'POST',timeout:5000,quiet:true}).then(done,done)}
// Vérifie de temps en temps que le compte est toujours autorisé. Sans réseau, on reste connecté.
function checkSession(){
  if(!SESSION||Date.now()-ACC.checked<10*60e3)return;
  ACC.checked=Date.now();
  api('/api/auth/me',{timeout:30000}).then(r=>{
    const a=SESSION&&SESSION.user,b=r&&r.user;if(!a||!b)return;
    if(a.id!==b.id||a.username!==b.username||a.name!==b.name||a.role!==b.role){SESSION.user=b;LS.set('b2t.session',SESSION);ACC.list=null;accRender()}
  }).catch(()=>{ACC.checked=0});
}
function showLogin(){
  let msg='';try{msg=sessionStorage.getItem('b2t.msg')||'';sessionStorage.removeItem('b2t.msg')}catch(e){}
  const root=document.createElement('div');root.id='auth-root';document.body.appendChild(root);
  root.innerHTML=`<div class="login"><div class="login-in">
    <div class="login-brand"><span class="logo" aria-hidden="true">${B2T_MARK}</span><b class="wm" aria-label="Banc2Touche">Banc<em>2</em>Touche</b></div>
    <form class="card" data-form="login" novalidate>
      <h1>Connexion</h1>
      ${API_FIXED?'':`<label class="f" for="lg-api">Adresse du serveur<input id="lg-api" name="api" class="in" type="url" inputmode="url" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="https://b2t-api-….onrender.com" value="${esc(API)}"></label>`}
      <label class="f" for="lg-user">Identifiant<input id="lg-user" name="username" class="in" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false"></label>
      <label class="f" for="lg-pass">Mot de passe<input id="lg-pass" name="password" class="in" type="password" autocomplete="current-password"></label>
      <p class="err" data-msg role="alert"${msg?'':' hidden'}>${esc(msg)}</p>
      <button class="btn primary" type="submit">Se connecter</button>
      <p class="hint">Les comptes sont créés par le responsable de l’équipe. La première connexion demande du réseau, ensuite l’appli marche sans.</p>
    </form></div></div>`;
  ($('#lg-api')&&!API?$('#lg-api'):$('#lg-user')).focus();
}
function genPassword(){
  const abc='abcdefghjkmnpqrstuvwxyz23456789',out=[];
  while(out.length<12)for(const x of crypto.getRandomValues(new Uint8Array(16)))if(x<248&&out.length<12)out.push(abc[x%31]);
  return out.join('').replace(/(.{4})(?=.)/g,'$1-');
}
function accRender(){if(S.m&&S.mode==='team'&&S.tview==='account')renderView()}
function loadUsers(){
  if(ACC.loading)return;ACC.loading=true;ACC.err='';
  api('/api/users').then(r=>{ACC.list=r.items}).catch(e=>{ACC.err=e.message}).finally(()=>{ACC.loading=false;accRender()});
}
const pwField=(id,ph)=>`<div class="acc-pw"><label class="f" for="${id}">Mot de passe<input id="${id}" name="password" class="in" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="${ph}"></label><button class="btn" type="button" data-acc="gen">Proposer</button></div>`;
function usersHTML(){
  if(ACC.err)return `<p class="err">${esc(ACC.err)}</p><div class="row"><button class="btn sm" data-acc="reload">Réessayer</button></div>`;
  if(!ACC.list)return '<p class="hint">Chargement…</p>';
  return `<ul class="snaps accs">${ACC.list.map(u=>{
    const adm=u.role==='admin',seen=u.last_login_at?'dernière connexion '+relTime(Date.parse(u.last_login_at)):'jamais connecté';
    const info=`<span class="si"><b>${esc(u.name||u.username)}${adm?'<span class="pill">Responsable</span>':u.active?'':'<span class="pill off">Désactivé</span>'}</b><small>${esc(u.username)} · ${seen}${u.sessions?` · ${u.sessions} appareil${u.sessions>1?'s':''} connecté${u.sessions>1?'s':''}`:''}</small></span>`;
    if(ACC.edit===u.id)return `<li><form class="acc-form" data-form="editUser" data-id="${u.id}" novalidate>
      <label class="f" for="ae-name">Nom affiché<input id="ae-name" name="name" class="in" autocomplete="off" maxlength="80" value="${esc(u.name)}"></label>
      ${adm?'<p class="hint">Ton identifiant vient du secret B2T_ADMIN_USER. Ton mot de passe se change dans « Mon compte ».</p>':`<label class="f" for="ae-user">Identifiant<input id="ae-user" name="username" class="in" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="40" value="${esc(u.username)}"></label>
      ${pwField('ae-pass','Laisser vide pour le garder')}
      <p class="hint">Un nouveau mot de passe déconnecte tous ses appareils.</p>`}
      <p class="err" data-msg role="alert" hidden></p>
      <div class="row"><button class="btn primary sm" type="submit">Enregistrer</button><button class="btn ghost sm" type="button" data-acc="editNo">Annuler</button></div>
    </form></li>`;
    if(ACC.del===u.id)return `<li>${info}<button class="btn danger sm" data-acc="del" data-id="${u.id}">Supprimer ce compte</button><button class="btn ghost sm" data-acc="delNo">Non</button></li>`;
    return `<li>${info}<button class="btn sm" data-acc="edit" data-id="${u.id}">Modifier</button>${adm?'':`<button class="btn sm" data-acc="toggle" data-id="${u.id}">${u.active?'Désactiver':'Réactiver'}</button><button class="btn sm danger-txt" data-acc="delAsk" data-id="${u.id}">Supprimer</button>`}</li>`;
  }).join('')}</ul>`;
}
function vAccount(){
  const me=SESSION.user,adm=isAdmin();
  if(adm&&ACC.list==null&&!ACC.loading&&!ACC.err)loadUsers();
  return `<div class="pane-head"><div><h1>Compte</h1><p class="hint">${adm?'Tu es le responsable : toi seul crées les comptes, changes les mots de passe et retires les accès.':'Ton compte est géré par le responsable de l’équipe. Mot de passe oublié : demande-lui en un nouveau.'}</p></div></div>
  <div class="bkgrid">
    <div class="card"><h2>Mon compte</h2>
      <div class="bkstate"><b>${esc(me.name||me.username)}</b><span>Identifiant : ${esc(me.username)} · ${ROLE[me.role]||ROLE.coach}</span></div>
      ${ACC.pw?`<form class="acc-form" data-form="myPassword" novalidate>
        <input type="text" name="username" autocomplete="username" value="${esc(me.username)}" hidden>
        <label class="f" for="mp-cur">Mot de passe actuel<input id="mp-cur" name="current" class="in" type="password" autocomplete="current-password"></label>
        <label class="f" for="mp-new">Nouveau mot de passe (8 caractères au minimum)<input id="mp-new" name="new" class="in" type="password" autocomplete="new-password"></label>
        <label class="f" for="mp-again">Nouveau mot de passe, une 2e fois<input id="mp-again" name="again" class="in" type="password" autocomplete="new-password"></label>
        <p class="err" data-msg role="alert" hidden></p>
        <div class="row"><button class="btn primary" type="submit">Changer le mot de passe</button><button class="btn ghost" type="button" data-acc="pwNo">Annuler</button></div>
      </form>`:`<div class="row"><button class="btn" data-acc="pw">Changer mon mot de passe</button><button class="btn ghost" data-acc="out">Se déconnecter</button></div>`}
      <p class="hint">Se déconnecter n’efface rien : l’effectif et les matchs restent sur cet appareil.</p>
    </div>
    ${adm?`<div class="card"><h2>Nouveau compte</h2>
      <form class="acc-form" data-form="newUser" novalidate>
        <label class="f" for="nu-name">Nom affiché<input id="nu-name" name="name" class="in" autocomplete="off" maxlength="80" placeholder="Ex. Nino"></label>
        <label class="f" for="nu-user">Identifiant<input id="nu-user" name="username" class="in" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" maxlength="40" placeholder="Ex. nino"></label>
        ${pwField('nu-pass','8 caractères au minimum')}
        <p class="err" data-msg role="alert" hidden></p>
        <div class="row"><button class="btn primary" type="submit">Créer le compte</button></div>
      </form>
      <p class="hint">Note le mot de passe avant de créer le compte : il n’est plus affiché ensuite. En cas d’oubli, tu en mets un nouveau.</p>
    </div>`:''}
  </div>
  ${adm?`<div class="card"><div class="card-head"><h2>Comptes${ACC.list?`<span class="count">${ACC.list.length}</span>`:''}</h2><button class="btn sm ghost" data-acc="reload">Actualiser</button></div>${usersHTML()}</div>`:''}
  ${adm?transferHTML():''}`;
}
// Changer de base : un fichier de transfert (comptes, appareils connectés, dernières sauvegardes)
function transferHTML(){
  const i=ACC.imp,b=ACC.busy;
  return `<div class="card"><h2>Changer de base de données</h2>
    <p class="hint">La base gratuite de Render expire 30 jours après sa création. Avant cette date : exporte le fichier de transfert, crée la nouvelle base, mets sa nouvelle adresse dans le secret <b>DATABASE_URL</b> et relance le déploiement. Reconnecte-toi alors avec le mot de passe du secret <b>B2T_ADMIN_PASSWORD</b> et importe aussitôt le fichier ici : comptes, mots de passe et appareils connectés reviennent tels quels.</p>
    <div class="row"><button class="btn" data-acc="export" ${b?'disabled':''}>${b==='export'?'Export…':'Exporter le fichier de transfert'}</button><label class="btn${b?' off':''}" for="acc-import">Importer un fichier</label><input id="acc-import" class="vh" type="file" accept=".json,application/json" ${b?'disabled':''}></div>
    ${i?`<div class="bkstate need"><b>Fichier du ${esc(new Date(i.at).toLocaleString('fr-FR',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}))}</b><span>${plural(i.users,'compte')} · ${plural(i.backups,'sauvegarde')} · ${plural(i.sessions,'appareil')} connecté${i.sessions>1?'s':''}. Les comptes du même identifiant sont remplacés par ceux du fichier.</span></div>
      <div class="row"><button class="btn primary" data-acc="import" ${b?'disabled':''}>${b==='import'?'Import…':'Importer dans cette base'}</button><button class="btn ghost" data-acc="impNo" ${b?'disabled':''}>Annuler</button></div>`:''}
    <p class="hint">Ce fichier contient les mots de passe sous forme protégée (jamais en clair) et l’effectif : garde-le dans ton iCloud, ne le mets jamais dans GitHub. Importe toujours l’export le plus récent : un ancien fichier remettrait d’anciens mots de passe.</p>
  </div>`;
}
async function exportServer(){
  ACC.busy='export';accRender();
  try{
    const d=await api('/api/admin/export');
    const name=`banc2touche-serveur-${todayISO()}.json`;
    const r=await saveFile(name,new Blob([JSON.stringify(d)],{type:'application/json'}),'Fichier de transfert enregistré : '+name);
    if(r===false)toast('Enregistrement impossible sur cet appareil');
  }catch(e){toast(e.message)}
  finally{ACC.busy='';accRender()}
}
async function readTransfer(file){
  if(!file)return;
  try{
    const d=JSON.parse(await file.text());
    if(!d||d.kind!=='banc2touche-serveur'||!Array.isArray(d.users))throw new Error();
    ACC.imp={data:d,at:d.exported_at,users:d.users.length,backups:(d.backups||[]).length,sessions:(d.sessions||[]).length};
  }catch(e){ACC.imp=null;toast('Ce n’est pas un fichier de transfert du serveur Banc2Touche')}
  accRender();
}
async function importServer(){
  if(!ACC.imp)return;
  ACC.busy='import';accRender();
  try{
    const r=await api('/api/admin/import',{method:'POST',body:ACC.imp.data,timeout:120000});
    ACC.imp=null;ACC.list=null;
    toast(`Import terminé : ${plural(r.users_added,'compte')} ajouté${r.users_added>1?'s':''}, ${r.users_updated} mis à jour, ${plural(r.backups,'sauvegarde')}, ${plural(r.sessions,'appareil')} reconnecté${r.sessions>1?'s':''}`);
  }catch(e){toast(e.message)}
  finally{ACC.busy='';accRender()}
}
document.addEventListener('change',e=>{if(e.target.id==='acc-import'){readTransfer(e.target.files&&e.target.files[0]);e.target.value=''}});
const badName=u=>/^[a-z0-9][a-z0-9._-]{2,39}$/.test(u)?'':'Identifiant : 3 à 40 caractères, lettres sans accent, chiffres, point ou tiret.';
const badPass=p=>p.length>=8?'':'Mot de passe : 8 caractères au minimum.';
const FORMS={
  async login(val){
    const username=val('username').trim(),password=val('password');
    if(!API_FIXED){API=val('api').trim().replace(/\/+$/,'');if(!/^https?:\/\/./.test(API))throw new Error('Indique l’adresse du serveur (https://…).')}
    if(!username||!password)throw new Error('Indique ton identifiant et ton mot de passe.');
    let r;
    try{r=await api('/api/auth/login',{method:'POST',auth:false,body:{username,password,device:BKM.device||''}})}
    catch(e){throw e.status===404||e.status===405?new Error('Ce serveur ne gère pas les comptes Banc2Touche. Vérifie son adresse.'):e}
    SESSION={token:r.token,user:r.user,api:API};LS.set('b2t.session',SESSION);if(!API_FIXED)LS.set('b2t.api',API);
    ACC.checked=Date.now();$('#auth-root').remove();enter();
  },
  async myPassword(val){
    const nw=val('new'),bad=badPass(nw);
    if(!val('current'))throw new Error('Indique ton mot de passe actuel.');
    if(bad)throw new Error(bad);
    if(nw!==val('again'))throw new Error('Les deux nouveaux mots de passe sont différents.');
    await api('/api/auth/password',{method:'POST',body:{current:val('current'),new:nw}});
    ACC.pw=false;accRender();toast('Mot de passe changé. Tes autres appareils devront se reconnecter.');
  },
  async newUser(val){
    const body={name:val('name').trim(),username:val('username').trim().toLowerCase(),password:val('password')},bad=badName(body.username)||badPass(body.password);
    if(bad)throw new Error(bad);
    const r=await api('/api/users',{method:'POST',body});
    ACC.list=null;accRender();toast(`Compte « ${r.item.username} » créé. Transmets-lui son identifiant et son mot de passe.`);
  },
  async editUser(val,f){
    const u=(ACC.list||[]).find(x=>x.id===+f.dataset.id);if(!u)return;
    const body={},name=val('name').trim(),username=val('username').trim().toLowerCase(),password=val('password');
    if(name!==u.name)body.name=name;
    if(u.role!=='admin'){
      if(username!==u.username){const bad=badName(username);if(bad)throw new Error(bad);body.username=username}
      if(password){const bad=badPass(password);if(bad)throw new Error(bad);body.password=password}
    }
    if(Object.keys(body).length){
      await api('/api/users/'+u.id,{method:'PATCH',body});
      if(u.id===SESSION.user.id&&'name' in body){SESSION.user.name=name;LS.set('b2t.session',SESSION)}
      toast(body.password?'Compte modifié. Ses appareils devront se reconnecter avec le nouveau mot de passe.':'Compte modifié');
    }
    ACC.edit=null;ACC.list=null;accRender();
  }
};
document.addEventListener('submit',e=>{
  const f=e.target.closest('form[data-form]');if(!f||!FORMS[f.dataset.form])return;
  e.preventDefault();
  if(f.dataset.busy)return;
  const val=n=>f.elements[n]?f.elements[n].value:'',msg=f.querySelector('[data-msg]'),btn=f.querySelector('button[type="submit"]');
  const say=(t,wait)=>{msg.hidden=!t;msg.textContent=t||'';msg.className=wait?'hint':'err'};
  f.dataset.busy='1';btn.disabled=true;say('');
  const slow=setTimeout(()=>say('Le serveur se réveille, ça peut prendre jusqu’à une minute…',true),3000);
  FORMS[f.dataset.form](val,f).then(()=>say(''),err=>say(err&&err.message||'Erreur inattendue.')).finally(()=>{clearTimeout(slow);delete f.dataset.busy;btn.disabled=false});
});
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-acc]');if(!el||!SESSION)return;
  const id=+el.dataset.id,u=(ACC.list||[]).find(x=>x.id===id);
  const send=(o,done)=>{el.disabled=true;api('/api/users/'+id,o).then(()=>{ACC.list=null;ACC.del=null;accRender();toast(done)},err=>{el.disabled=false;toast(err.message)})};
  switch(el.dataset.acc){
    case 'pw':ACC.pw=true;accRender();{const i=$('#mp-cur');if(i)i.focus()}break;
    case 'pwNo':ACC.pw=false;accRender();break;
    case 'out':el.disabled=true;signOut();break;
    case 'reload':ACC.list=null;ACC.err='';ACC.edit=ACC.del=null;accRender();break;
    case 'edit':ACC.edit=id;ACC.del=null;accRender();{const i=$('#ae-name');if(i)i.focus()}break;
    case 'editNo':ACC.edit=null;accRender();break;
    case 'delAsk':ACC.del=id;ACC.edit=null;accRender();break;
    case 'delNo':ACC.del=null;accRender();break;
    case 'gen':{const i=el.closest('form').elements.password;i.value=genPassword();i.focus();i.select();break}
    case 'toggle':if(u)send({method:'PATCH',body:{active:!u.active}},u.active?`Compte « ${u.username} » désactivé : ses appareils sont déconnectés.`:`Compte « ${u.username} » réactivé`);break;
    case 'del':if(u)send({method:'DELETE'},`Compte « ${u.username} » supprimé`);break;
    case 'export':exportServer();break;
    case 'import':importServer();break;
    case 'impNo':ACC.imp=null;accRender();break;
  }
});
if(AUTH){TVIEWS.account=vAccount;TEAM_NAV.push(['account','Compte']);ICONS.account='<circle cx="12" cy="8" r="3.6"/><path d="M4.5 20c.9-4 3.9-6 7.5-6s6.6 2 7.5 6"/>'}

/* ---------- Événements ---------- */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;
  const a=el.dataset.act,v=el.dataset.v,id=el.dataset.id,u=S.ui,m=S.m;
  switch(a){
    case 'go':goView(v);break;
    case 'mode':if(S.mode!==v){S.mode=v;u.tsel=null;u.tconf=false;if(v==='team'&&S.tview==='profile'&&!tById(S.tp))S.tview='team';u.tdel=null;saveUI();renderAll();$('#main').scrollTop=0}break;
    case 'tgo':if(v==='backup')u.snaps=null;S.tview=v;u.tdel=null;u.tsel=null;u.tconf=false;saveUI();renderRail();renderView();$('#main').scrollTop=0;break;
    case 'tp':S.tp=id;S.tview='profile';S.mode='team';u.tdel=null;saveUI();renderAll();$('#main').scrollTop=0;break;
    case 'tback':S.tview='team';u.tdel=null;saveUI();renderRail();renderView();$('#main').scrollTop=0;break;
    case 'taddp':{if(TEAM.example)makeTeamReal();const np=newTP();TEAM.players.push(np);touchTeam();S.tp=np.id;S.tview='profile';saveUI();renderAll();$('#main').scrollTop=0;const i=$('#tf-prenom');if(i)i.focus();break}
    case 'importSeed':{const n=importSeed();renderView();toast(n?`${n} joueurs ajoutés depuis la liste du club`:'Tous les joueurs de la liste sont déjà dans l’effectif');break}
    case 'teamReal':makeTeamReal();S.tview='team';saveUI();renderAll();toast(TEAM.players.length?`Effectif créé : ${TEAM.players.length} joueurs. Complète leurs postes et numéros.`:'Effectif créé : ajoute tes joueurs');break;
    case 'tdelAsk':u.tdel=id;renderView();break;
    case 'tdelNo':u.tdel=null;renderView();break;
    case 'tdel':removeTeamPlayers([id]);break;
    case 'talt':{const p=tById(S.tp);if(!p||TEAM.example||v===p.poste)break;const a=alts(p);p.postes2=a.includes(v)?a.filter(c=>c!==v):a.concat(v).sort((x,y)=>POSTE_ORDER[x]-POSTE_ORDER[y]);p.updatedAt=Date.now();touchTeam();syncSnap(p);renderView();break}
    case 'bkExport':exportBackup();break;
    case 'bkApply':applyBackup(v);break;
    case 'goBackup':S.mode='team';S.tview='backup';u.snaps=null;saveUI();renderAll();$('#main').scrollTop=0;break;
    case 'snapNow':takeSnap('manuelle').then(ok=>{u.snaps=null;renderView();toast(ok?'Copie faite sur cet appareil':'Copie impossible sur cet appareil')});break;
    case 'snapAsk':u.snapConf=+id;renderView();break;
    case 'snapNo':u.snapConf=null;renderView();break;
    case 'snapRestore':restoreSnap(+id);break;
    case 'snapExport':exportSnap(+id);break;
    case 'exportPdf':exportPdf();break;
    case 'bkCancel':u.imp=null;u.impErr='';renderView();break;
    case 'openCloud':window.dispatchEvent(new CustomEvent('b2t:cloud'));break;
    case 'tdelMode':u.tsel=[];u.tconf=false;renderView();break;
    case 'tdelCancel':u.tsel=null;u.tconf=false;renderView();break;
    case 'tsel':if(u.tsel){u.tsel=u.tsel.includes(id)?u.tsel.filter(x=>x!==id):u.tsel.concat(id);u.tconf=false;renderView()}break;
    case 'tselAll':{const all=TEAM.players.map(p=>p.id);u.tsel=u.tsel&&u.tsel.length===all.length?[]:all;u.tconf=false;renderView();break}
    case 'tdelMany':if(u.tsel&&u.tsel.length){u.tconf=true;renderView()}break;
    case 'tdelManyNo':u.tconf=false;renderView();break;
    case 'tdelManyGo':removeTeamPlayers(u.tsel||[]);break;
    case 'convoke':{const i=m.players.findIndex(p=>p.id===id);if(i>=0){m.players.splice(i,1);Object.keys(m.lineup).forEach(k=>{if(m.lineup[k]===id)delete m.lineup[k]})}else if(m.players.length<16){const tp=tById(id);if(tp)m.players.push({id:tp.id,num:tp.num,name:tShort(tp),pos:tp.poste,alt:alts(tp)})}touch();renderView();break}
    case 'selGk':u.gk=id;saveUI();renderView();break;
    case 'stage':if(phaseOf(S.view)!==v)goView(S.lastV[v]||PHASES.find(p=>p[0]===v)[3][0][0]);break;
    case 'half':u.half=+v;saveUI();renderHeader();if(S.view==='notes'||S.view==='stats')renderView();break;
    case 'wake':toggleWake();break;
    case 'newMatch':startNew();break;
    case 'side':m.side=v;touch();renderView();renderHeader();break;
    case 'pick':u.pick=u.pick===id?null:id;renderView();break;
    case 'slot':{const k=el.dataset.slot;if(u.pick){Object.keys(m.lineup).forEach(s=>{if(m.lineup[s]===u.pick)delete m.lineup[s]});m.lineup[k]=u.pick;if(k==='GB')u.gk=u.pick;u.pick=null;touch()}else if(m.lineup[k]){delete m.lineup[k];touch()}renderView();break}
    case 'clearLineup':m.lineup={};touch();renderView();break;
    case 'scoutDef':m.scout.def=m.scout.def===v?'':v;if(m.scout.def&&DEFS.includes(m.scout.def))u.oppDef=m.scout.def;touch();renderView();break;
    case 'addDanger':{const d={id:uid(),num:'',pos:'',note:''};m.scout.danger.push(d);touch();renderView();const i=document.getElementById('dn-'+d.id);if(i)i.focus();break}
    case 'delDanger':m.scout.danger=m.scout.danger.filter(d=>d.id!==id);touch();renderView();break;
    case 'team':u.team=v;u.p=null;renderView();break;
    case 'autoSwap':u.autoSwap=!u.autoSwap;saveUI();renderView();break;
    case 'autoPoss':u.autoPoss=!u.autoPoss;saveUI();renderView();break;
    case 'pickAct':u.act=u.act===v?null:v;if(u.act==='loss'){u.cage=null;u.esp=null;u.xy=null;u.zone=null;if(u.phase==='seven')u.phase='placed'}else if(u.act&&!['goal','saved'].includes(u.act))u.cage=null;renderView();break;
    case 'record':record();break;
    case 'tphotoDel':{const p=tById(S.tp);if(p&&!TEAM.example){delete p.photo;p.updatedAt=Date.now();touchTeam();renderView();toast('Photo retirée')}break}
    case 'selP':u.p=u.p===id?null:id;renderView();break;
    case 'court':courtTap(e,el.closest('svg'));break;
    case 'clearSel':Object.assign(u,{act:null,esp:null,p:null,zone:null,xy:null,cage:null,phase:'placed'});renderView();break;
    case 'cage':u.cage=u.cage===v?null:v;renderView();break;
    case 'phase':u.phase=u.phase===v&&v!=='placed'?'placed':v;if(u.phase==='seven'){u.xy=null;u.zone=null;u.esp=null;if(u.act==='loss')u.act=null}renderView();break;
    case 'esp':if(u.phase!=='seven'){u.esp=u.esp===v?null:v;renderView()}break;
    case 'ev':commit(el.dataset.type,el.dataset.res);break;
    case 'delEv':removeEv(id,true);break;
    case 'undo':{const last=m.events[m.events.length-1];if(last)removeEv(last.id,true);break}
    case 'addOpp':addOpp();break;
    case 'gkSide':u.gkSide=v;renderView();break;
    case 'gkSel':u.gkSel=v;renderView();break;
    case 'gkPer':u.gkPer=+v;renderView();break;
    case 'noteTag':u.noteTag=u.noteTag===v?'':v;renderView();break;
    case 'addNote':addNote();break;
    case 'delNote':{const i=m.notes.findIndex(n=>n.id===id);if(i<0)break;const [n]=m.notes.splice(i,1);touch();renderView();toast('Note supprimée',{label:'Rétablir',fn:()=>{m.notes.splice(i,0,n);touch();renderView()}});break}
    case 'noteFilter':u.noteFilter=v;renderView();break;
    case 'tmode':S.tac.mode=v;saveTac();renderView();break;
    case 'tdef':applyPreset('D',v);break;
    case 'tatt':applyPreset('A',v);break;
    case 'tshow':S.tac[v]=!S.tac[v];saveTac();renderView();break;
    case 'tundo':S.tac.strokes.pop();saveTac();renderView();break;
    case 'tclear':S.tac.strokes=[];saveTac();renderView();break;
    case 'treset':S.tac=defaultTac(S.tac.mode);saveTac();renderView();break;
    case 'bilPer':u.bilPer=+v;renderView();break;
    case 'czSide':if(u.czSide!==v){u.czSide=v;u.czView=v==='opp'?'gk':'shooter';u.czZone=''}renderView();break;
    case 'czZone':u.czZone=(v&&u.czZone===v)?'':v;renderView();break;
    case 'czEsp':u.czEsp=(v&&u.czEsp===v)?'':v;renderView();break;
    case 'czBy':u.czBy=v;u.czZone='';u.czEsp='';renderView();break;
    case 'bilBy':u.bilBy=v;renderView();break;
    case 'czPer':u.czPer=+v;renderView();break;
    case 'czView':u.czView=v;renderView();break;
    case 'czGk':u.czGk=v;renderView();break;
    case 'repPer':u.repPer=+v;renderView();break;
    case 'exportCsv':exportCsv();break;
    case 'copyCsv':copyText(buildTSV(m),'Relevé copié : colle-le dans le classeur ou envoie-le à Claude','Relevé du match');break;
    case 'copyNotes':copyText(notesText(m),'Notes copiées','Notes du match');break;
    case 'open':openMatch(id);break;
    case 'askDel':u.confirmDel=id;renderView();break;
    case 'cancelDel':u.confirmDel=null;renderView();break;
    case 'doDel':deleteMatch(id);break;
    case 'closeModal':$('#modal-root').innerHTML='';break;
  }
});
function onField(t){
  const m=S.m;
  if(t.dataset.tf){
    const p=tById(S.tp);if(!p||TEAM.example)return;const k=t.dataset.tf;
    p[k]=k==='num'?t.value.replace(/\D/g,'').slice(0,2):t.value;if(k==='poste')p.postes2=alts(p);p.updatedAt=Date.now();touchTeam();syncSnap(p);
    if(k==='prenom'||k==='nom'||k==='num'){const h=$('#tp-title');if(h)h.innerHTML=tpTitle(p)}
    if(k==='poste')renderView();
    return;
  }
  if(t.dataset.bind){const path=t.dataset.bind.split('.');let o=m;while(path.length>1)o=o[path.shift()];o[path[0]]=t.value;touch();if(['opponent','date','competition'].includes(t.dataset.bind))renderHeader();return}
  if(t.dataset.pl){const p=pById(t.dataset.pl);if(p){p[t.dataset.k]=t.dataset.k==='num'?t.value.replace(/\D/g,'').slice(0,2):t.value;touch()}return}
  if(t.dataset.dg){const d=m.scout.danger.find(x=>x.id===t.dataset.dg);if(d){d[t.dataset.k]=t.dataset.k==='num'?t.value.replace(/\D/g,'').slice(0,2):t.value;touch()}return}
  if(t.dataset.ui){S.ui[t.dataset.ui]=t.value;saveUI();return}
  if(t.dataset.bkm){BKM[t.dataset.bkm]=t.value.slice(0,40);saveBKM();return}
  if(t.id==='note-txt'){S.ui.noteDraft=t.value;return}
  if(t.id==='note-min'){S.ui.noteMin=t.value;return}
}
document.addEventListener('input',e=>onField(e.target));
document.addEventListener('change',e=>{if(e.target.id==='bk-file'){readBackup(e.target.files);e.target.value='';return}if(e.target.dataset&&e.target.dataset.photo){setPhoto(e.target.dataset.photo,e.target.files&&e.target.files[0]);e.target.value='';return}if(e.target.tagName==='SELECT')onField(e.target)});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='opp-add'){e.preventDefault();addOpp()}if(e.key==='Escape')$('#modal-root').innerHTML=''});

document.addEventListener('visibilitychange',()=>{if(S.m&&document.visibilityState==='hidden')maybeSnap('auto',30*60e3)});

/* ---------- Démarrage ---------- */
function start(){
  loadTeam();
  const saved=LS.get('hb.ui',{});
  S.mode=saved.mode==='match'?'match':'team';
  if(['team','season','profile','backup'].includes(saved.tview))S.tview=saved.tview;
  S.tp=saved.tp||null;if(S.tview==='profile'&&!tById(S.tp))S.tview='team';
  if(saved.view&&VIEWS[saved.view])S.view=saved.view;
  if(saved.lastV&&typeof saved.lastV==='object')PHASES.forEach(([k])=>{const v=saved.lastV[k];if(v&&VIEWS[v]&&phaseOf(v)===k)S.lastV[k]=v});
  S.lastV[phaseOf(S.view)]=S.view;
  if(saved.half===1||saved.half===2)S.ui.half=saved.half;
  if(saved.oppDef)S.ui.oppDef=saved.oppDef;
  if(typeof saved.autoSwap==='boolean')S.ui.autoSwap=saved.autoSwap;
  if(typeof saved.autoPoss==='boolean')S.ui.autoPoss=saved.autoPoss;
  const cur=LS.get('hb.cur',null),m=cur&&getMatch(cur);
  S.m=(m&&!m.example)?normalize(m):newMatch([]);
  if(!m||m.example)LS.set('hb.cur',S.m.id);
  S.ui.gk=(saved.gk&&pById(saved.gk))?saved.gk:defaultGK();
  S.ui.bilPer=S.ui.half;
  const tac=LS.get('hb.tac',null);S.tac=(tac&&tac.pieces)?tac:defaultTac();
  renderAll();
  maybeSnap('ouverture',6*3600e3);
  initCloud();
  window.B2T={backupData,applyCloud,markCloudSaved,api,device:()=>BKM.device||'',user:()=>SESSION?SESSION.user:null,counts:()=>({players:TEAM.example?0:TEAM.players.length,matches:realMatches().length})};
}
// Avec les comptes : l'appli ne démarre qu'une fois connecté, puis la session reste sur l'appareil (utilisable sans réseau)
function enter(){
  start();
  if(!AUTH)return;
  checkSession();
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')checkSession()});
  window.addEventListener('online',checkSession);
}
if(AUTH&&!SESSION)showLogin();else enter();
}
