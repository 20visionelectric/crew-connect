{
/* ================= storage ================= */
const KEYS=['users','sites','checkins','dailies','insps','equip','talks','incidents','actions','training','policysigs','cordocs','meta'];
const S={users:[],sites:[],checkins:[],dailies:[],insps:[],equip:[],talks:[],incidents:[],actions:[],training:[],policysigs:[],cordocs:{},meta:{}};
let db=null;
function idb(){return new Promise(res=>{try{const r=indexedDB.open('vss',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)}catch(e){res(null)}})}
function get(k){return new Promise(res=>{if(!db)return res(undefined);try{const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>res(q.result);q.onerror=()=>res(undefined)}catch(e){res(undefined)}})}
function saveLocal(k){if(!db)return;try{const tx=db.transaction('kv','readwrite');tx.onerror=tx.onabort=()=>toast('Could not save on this phone. Storage may be full.');tx.objectStore('kv').put(S[k],k)}catch(e){toast('Could not save on this phone. Storage may be full.')}}
function save(k){saveLocal(k);try{CLOUD.push(k)}catch(e){}}
/* Cloud sync: Firebase project vision-crew-connect (same logins as 20 Vision Crew Connect).
   Records go to Firestore collections vss_<kind>; photos/files over 40 KB go to vss_files (chunked under 1 MB). */
const NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const FIREBASE_CONFIG = (NATIVE || (location.protocol === 'https:' && /github\.io$|20visionelectric\.com$/.test(location.hostname))) ? {
  apiKey: "AIzaSyAbt-ULY8uhBIoxklQHEBPPOsfjSR1cQtM", authDomain: "vision-crew-connect.firebaseapp.com", projectId: "vision-crew-connect",
  storageBucket: "vision-crew-connect.firebasestorage.app", messagingSenderId: "808328932749", appId: "1:808328932749:web:3624188efff939c8d0a1c4" } : null;
const CLOUD = (() => {
  const KINDS = ['users','sites','checkins','dailies','insps','equip','talks','incidents','actions','training','policysigs'];
  const OWN = ['checkins','dailies','insps','talks','incidents','training','policysigs'];
  const PUBLIC_USER = ['id','name','trade','role','active','created','updated']; let denied = {}, warned = false;
  let fs = null, auth = null, ready = false, sent = {}, queue = new Set(), status = 'off', admin = false, inited = false;
  const h = o => { const j = JSON.stringify(o); let x = 0; for (let i = 0; i < j.length; i++) x = (x * 31 + j.charCodeAt(i)) | 0; return x + ':' + j.length; };
  function load(src) { return new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = src; sc.onload = res; sc.onerror = rej; document.head.appendChild(sc); }); }
  async function init() {
    if (!FIREBASE_CONFIG) return false; if (inited) return true;
    try {
      const b = 'https://www.gstatic.com/firebasejs/10.12.2/';
      await load(b + 'firebase-app-compat.js'); await load(b + 'firebase-auth-compat.js'); await load(b + 'firebase-firestore-compat.js');
      firebase.initializeApp(FIREBASE_CONFIG, 'vss'); const app = firebase.app('vss'); auth = app.auth(); fs = app.firestore();
      try { await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch (e) {}
      try { await fs.enablePersistence({ synchronizeTabs: true }); } catch (e) {}
      status = 'signed-out'; inited = true; return true;
    } catch (e) { status = 'error'; return false; }
  }
  async function checkAdmin(u) {
    admin = false;
    try { if (u.email && u.email.toLowerCase() === 'info@20visionelectric.com') admin = true; else admin = (await fs.collection('admins').doc(u.uid).get()).exists; } catch (e) {}
    return admin;
  }
  async function signIn(email, pass, create) {
    const r = create ? await auth.createUserWithEmailAndPassword(email, pass) : await auth.signInWithEmailAndPassword(email, pass);
    if (create) { try { await r.user.sendEmailVerification(); } catch (e) {} }
    await checkAdmin(r.user); status = 'on'; ready = true; return r.user;
  }
  async function reset(email) { await auth.sendPasswordResetEmail(email); }
  async function crewName(uid) { try { const d = await fs.collection('users').doc(uid).get(); if (d.exists) { const x = d.data(); return { name: [x.first, x.last].filter(Boolean).join(' ') || x.name || '', phone: x.phone || '' }; } } catch (e) {} return null; }
  function strip(rec, kind) {
    const files = [];
    const walk = v => {
      if (typeof v === 'string' && v.startsWith('data:') && v.length > 40000) { const id = kind + '_' + rec.id + '_' + files.length + '_' + h(v).replace(':', '-'); files.push([id, v]); return 'file:' + id; }
      if (Array.isArray(v)) return v.map(walk);
      if (v && typeof v === 'object') { const o = {}; for (const k in v) if (v[k] !== undefined) o[k] = walk(v[k]); return o; }
      return v;
    };
    return [walk(rec), files];
  }
  async function putFile(id, data) {
    const C = 900000, n = Math.ceil(data.length / C);
    const uid = auth.currentUser.uid; for (let i = 0; i < n; i++) await fs.collection('vss_files').doc(i ? id + '~' + i : id).set({ data: data.slice(i * C, (i + 1) * C), n, uid });
  }
  async function getFile(id) {
    const d = await fs.collection('vss_files').doc(id).get(); if (!d.exists) return '';
    let { data, n } = d.data(); for (let i = 1; i < (n || 1); i++) { const p = await fs.collection('vss_files').doc(id + '~' + i).get(); data += p.exists ? p.data().data : ''; }
    return data;
  }
  function push(kind) { if (!KINDS.includes(kind) && kind !== 'cordocs') return; queue.add(kind); clearTimeout(push.t); push.t = setTimeout(flush, 800); }
  let flushing = false;
  async function flush() {
    if (!ready || !fs || flushing) return; flushing = true; let retry = false;
    for (const kind of [...queue]) {
      queue.delete(kind);
      if (kind === 'cordocs') { if (admin) try { await fs.collection('vss_meta').doc('cordocs').set({ v: JSON.stringify(S.cordocs) }); } catch (e) { if (e.code !== 'permission-denied') retry = true; } continue; }
      sent[kind] = sent[kind] || {};
      for (const rec of S[kind]) {
        if (tomb.has(rec.id)) continue;
        const k = h(rec); if (sent[kind][rec.id] === k) continue;
        try {
          if (denied[kind + rec.id] === k) continue;
          const me = auth.currentUser.uid;
          if (kind === 'users' && !admin && rec.id !== me) { sent[kind][rec.id] = k; continue; }
          const [doc, files] = strip(rec, kind);
          for (const [id, data] of files) if (!(sent.files || {})[id]) { await putFile(id, data); (sent.files = sent.files || {})[id] = 1; }
          if (kind === 'users') {
            const pub = {}, priv = {};
            for (const f in doc) { if (f === 'pin') continue; (PUBLIC_USER.includes(f) ? pub : priv)[f] = doc[f]; }
            await fs.collection('vss_users').doc(rec.id).set(pub);
            await fs.collection('vss_private').doc(rec.id).set(priv);
          } else await fs.collection('vss_' + kind).doc(rec.id).set(doc);
          sent[kind][rec.id] = k;
        } catch (e) { if (e.code === 'permission-denied') { denied[kind + rec.id] = k; if (!warned) { warned = true; toast('Some records were refused by the cloud. Tell the office; they are still saved on this phone.'); } } else { retry = true; queue.add(kind); break; } }
      }
    }
    flushing = false; status = retry ? 'waiting for signal' : 'on'; if (retry) setTimeout(flush, 30000); else if (queue.size) flush();
    try { const el = document.getElementById('cloudst'); if (el) el.textContent = label(); } catch (e) {}
  }
  async function pull() {
    if (!ready || !fs) return;
    const uid = auth.currentUser.uid, cache = {};
    await loadTomb();
    const fix = async v => {
      if (typeof v === 'string' && v.startsWith('file:')) { const id = v.slice(5); if (cache[id] === undefined) cache[id] = await getFile(id); (sent.files = sent.files || {})[id] = 1; return cache[id]; }
      if (Array.isArray(v)) return Promise.all(v.map(fix));
      if (v && typeof v === 'object') { const o = {}; for (const k in v) o[k] = await fix(v[k]); return o; }
      return v;
    };
    for (const kind of KINDS) {
      try {
        let q = fs.collection('vss_' + kind);
        if (!admin && OWN.includes(kind)) q = q.where('userId', '==', uid);
        const snap = await q.get();
        sent[kind] = sent[kind] || {};
        for (const d of snap.docs) {
          if (tomb.has(d.id)) continue;
          const rec = await fix(d.data());
          const i = S[kind].findIndex(x => x.id === rec.id);
          if (i < 0) S[kind].push(rec); else S[kind][i] = kind === 'users' ? Object.assign({}, S[kind][i], rec) : rec;
        }
        if (kind === 'users') {
          const priv = admin ? (await fs.collection('vss_private').get()).docs : [await fs.collection('vss_private').doc(uid).get()].filter(d => d.exists);
          for (const d of priv) { const p = await fix(d.data()); const u = S.users.find(x => x.id === d.id); if (u) Object.assign(u, p); }
        }
        for (const r of S[kind]) if (snap.docs.some(d => d.id === r.id)) sent[kind][r.id] = h(r);
        saveLocal(kind);
      } catch (e) { status = 'waiting for signal'; }
    }
    dropTomb();
    try { const c = await fs.collection('vss_meta').doc('cordocs').get(); if (c.exists) { S.cordocs = JSON.parse(c.data().v); saveLocal('cordocs'); } } catch (e) {}
  }
  function pushAll() { KINDS.forEach(push); push('cordocs'); }
  let tomb = new Set();
  async function loadTomb() { try { const d = await fs.collection('vss_meta').doc('deleted').get(); if (d.exists) tomb = new Set(d.data().ids || []); } catch (e) {} return tomb; }
  function dropTomb() { for (const kind of KINDS) { const n = S[kind].length; S[kind] = S[kind].filter(r => !tomb.has(r.id)); if (S[kind].length !== n) saveLocal(kind); } }
  async function purge(kind, rec) {
    tomb.add(rec.id);
    if (!ready || !fs || !admin) return;
    try {
      const [, files] = strip(rec, kind);
      for (const [id] of files) { try { const d = await fs.collection('vss_files').doc(id).get(); const n = d.exists ? (d.data().n || 1) : 1; for (let i = 0; i < n; i++) await fs.collection('vss_files').doc(i ? id + '~' + i : id).delete(); } catch (e) {} }
      if (kind === 'users') { await fs.collection('vss_users').doc(rec.id).delete(); await fs.collection('vss_private').doc(rec.id).delete(); }
      else await fs.collection('vss_' + kind).doc(rec.id).delete();
      await fs.collection('vss_meta').doc('deleted').set({ ids: firebase.firestore.FieldValue.arrayUnion(rec.id) }, { merge: true });
    } catch (e) { toast('Could not delete from the cloud right now. Try again with signal.'); }
  }
  async function resume() { const u = await new Promise(r => { const off = auth.onAuthStateChanged(x => { off(); r(x); }); }); if (u) { await checkAdmin(u); ready = true; status = 'on'; await pull(); pushAll(); } return u; }
  async function signOut() { try { await auth?.signOut(); } catch (e) {} ready = false; status = 'signed-out'; }
  async function remove(kind, id) { if (!ready || !fs) return; try { await fs.collection('vss_' + kind).doc(id).delete(); } catch (e) {} }
  async function guestSign(rec) { if (!await init()) throw new Error('offline'); await fs.collection('vss_policysigs').doc(rec.id).set(rec); }
  const label = () => status === 'on' ? 'Saved to cloud' : 'Cloud: ' + status;
  return { purge, loadTomb, dropTomb, isDead: id => tomb.has(id), init, signIn, reset, guestSign, remove, crewName, push, pull, pushAll, resume, signOut, label, get status() { return status; }, get admin() { return admin; }, get user() { return auth && auth.currentUser; }, get on() { return !!FIREBASE_CONFIG; } };
})();

let ME=null;
const SESSION_KEY='vss-session';
const JOBS=['Master Electrician','Electrician (309A)','Electrician (442A)','Apprentice','Foreman / Supervisor','Labourer','Office','Other'];

/* ================= helpers ================= */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const now=()=>new Date().toISOString();
const today=()=>new Date().toLocaleDateString('en-CA');
const dayOf=iso=>new Date(iso).toLocaleDateString('en-CA');
const fmt=iso=>iso?new Date(iso).toLocaleString('en-CA',{dateStyle:'medium',timeStyle:'short'}):'';
const fmtD=d=>d?new Date(d+'T12:00').toLocaleDateString('en-CA',{dateStyle:'medium'}):'';
const daysSince=d=>d.length===10?Math.round((Date.parse(today()+'T00:00')-Date.parse(d+'T00:00'))/864e5):Math.floor((Date.now()-new Date(d))/864e5);
const dayWord=n=>n===1?'1 day':n+' days';
const img=v=>typeof v==='string'&&/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(v)?v:'';
const addMonths=(d,m)=>{const x=new Date(d+'T12:00');x.setMonth(x.getMonth()+m);return x.toLocaleDateString('en-CA')};
const userName=id=>(S.users.find(u=>u.id===id)||{}).name||'Unknown';
const siteName=id=>typeof id==='string'&&id.startsWith('u:')?'Unlisted: '+id.slice(2):(S.sites.find(s=>s.id===id)||{}).name||'No site';
const isOffice=()=>ME&&(ME.role==='admin'||ME.role==='supervisor'||ME.role==='hr');
const isAdmin=()=>ME&&ME.role==='admin';
const canCor=()=>ME&&(ME.role==='admin'||ME.role==='hr');
const mine=arr=>isOffice()?arr:arr.filter(r=>r.userId===ME.id);
const PREVIEW=(()=>{try{return window.self!==window.top}catch(e){return true}})();
function toast(m){const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),3200)}
async function hash(pin,salt){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(salt.toLowerCase()+':'+pin));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){let h=0;for(const c of salt+pin)h=(h*31+c.charCodeAt(0))|0;return 'f'+h}}
function dist(a,b,c,d){const R=6371e3,r=x=>x*Math.PI/180,dl=r(c-a),dn=r(d-b);const h=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function getLoc(){return new Promise((res,rej)=>{
  if(!navigator.geolocation)return rej('This phone has no location service.');
  navigator.geolocation.getCurrentPosition(p=>res({lat:+p.coords.latitude.toFixed(6),lng:+p.coords.longitude.toFixed(6),acc:Math.round(p.coords.accuracy),at:now()}),
    e=>{ if(PREVIEW)return res({lat:43.7615,lng:-79.4111,acc:0,at:now(),demo:true});
      rej(e.code===1?'Location is turned off or blocked for this app. Turn on location in your phone settings and allow it for this app, then try again.':'Could not get your location. Step outside or near a window and try again.')},
    {enableHighAccuracy:true,timeout:20000,maximumAge:0})})}
function compress(file){return new Promise(res=>{const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const m=1280,k=Math.min(1,m/Math.max(i.width,i.height));const c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);const x=c.getContext('2d');x.drawImage(i,0,0,c.width,c.height);x.fillStyle='rgba(0,0,0,.55)';x.fillRect(0,c.height-28,c.width,28);x.fillStyle='#fff';x.font='16px sans-serif';x.fillText('20 Vision Site Safety • '+new Date().toLocaleString('en-CA'),8,c.height-9);res(c.toDataURL('image/jpeg',.72))};i.onerror=()=>res(null);i.src=r.result};r.onerror=()=>res(null);r.readAsDataURL(file)})}
function tell(title,body){return ask(title,body,'OK',false,true)}
function ask(title,body,okLabel='OK',danger,single){return new Promise(res=>{const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="card"><h3>${esc(title)}</h3><p>${body}</p><div class="row"><button class="btn ${danger?'red':'pri'}" data-x="1">${esc(okLabel)}</button>${single?'':'<button class="btn" data-x="0">Cancel</button>'}</div></div>`;m.onclick=e=>{const b=e.target.closest('[data-x]');if(b){m.remove();res(b.dataset.x==='1')}};document.body.appendChild(m)})}
function activeCheckin(){let ch=false;for(const c of S.checkins)if(c.userId===ME.id&&!c.outAt&&Date.now()-new Date(c.inAt)>18*36e5){c.outAt=new Date(new Date(c.inAt).getTime()+12*36e5).toISOString();c.autoClosed=true;ch=true}if(ch)save('checkins');return S.checkins.find(c=>c.userId===ME.id&&!c.outAt)}
function locStamp(l){if(!l)return '';return `${l.lat}, ${l.lng} (±${l.acc} m)${l.demo?' • PREVIEW ONLY':''}`}

/* ================= view state ================= */
let V={view:'home',p:{}};let D={};
function go(view,p={}){V={view,p};render();window.scrollTo(0,0)}
const TABS=[['home','Home','M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z'],['policy','Policy','M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5'],['talks','Talks','M4 5h16v11H8l-4 4z'],['inspect','Inspect','M9 11l2 2 4-4M5 4h14v16H5z'],['records','Records','M4 6h16M4 12h16M4 18h10'],['more','More','M5 12h.01M12 12h.01M19 12h.01']];

function render(){
  const app=$('#app');
  if(!ME){app.innerHTML=location.hash==='#sign-policy'?guestPolicyView():authView();bindSig();return}
  if(location.hash==='#sign-policy'){try{history.replaceState(null,'',location.pathname)}catch(e){}V={view:'policy',p:{}}}
  const v=VIEWS[V.view]||VIEWS.home;
  const ci=activeCheckin();
  app.innerHTML=`<header class="top"><div class="logo">20 VISION <b>SITE SAFETY</b></div><div class="who" data-act="go" data-v="profile" style="cursor:pointer">${ME.photo?`<img src="${img(ME.photo)}" alt="" style="width:30px;height:30px;border-radius:50%;object-fit:cover;vertical-align:middle;margin-right:6px">`:''}${esc(ME.name)}<br><span class="small">${ci?'On site: '+esc(siteName(ci.siteId)):'Not checked in'} • <span id="cloudst">${CLOUD.on?CLOUD.label():'Saved on this phone'}</span></span></div></header>
  <main>${PREVIEW?'<p class="infobox small noprint">Preview: this window blocks location and camera, so a test location is used and records are marked PREVIEW ONLY. On the crew\'s phones the real location is required.</p>':''}${v()}</main>
  <nav class="tabs">${TABS.map(t=>`<button data-act="tab" data-v="${t[0]}" class="${tabOf(V.view)===t[0]?'on':''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${t[2]}"/></svg>${t[1]}</button>`).join('')}</nav>`;
  bindSig();
}
function tabOf(v){if(v==='policy')return 'policy';if(['talks','talkrun'].includes(v))return 'talks';if(['inspect','inspform'].includes(v))return 'inspect';if(['records','record'].includes(v))return 'records';if(['home','checkin','daily','incident'].includes(v))return 'home';return 'more'}

/* ================= auth ================= */
let authMode='in';
const remOff=()=>{try{return localStorage.getItem('vss-rem')==='0'}catch(e){return false}};
const rememberedEmail=()=>{try{return localStorage.getItem('vss-rem')==='0'?'':(localStorage.getItem('vss-email')||'')}catch(e){return ''}};
const BIO={native:false,saved:false,used:false,server:'sitesafety.20visionelectric.com',
  P(){return window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform()&&window.Capacitor.Plugins.NativeBiometric},
  async check(){const p=this.P();if(!p)return;try{const a=await p.isAvailable();this.native=!!a.isAvailable;if(this.native){const r=await p.isCredentialsSaved({server:this.server});this.saved=!!r.isSaved}}catch(e){this.native=false}},
  async save(u,pw){const p=this.P();if(!p||!this.native)return;try{await p.setCredentials({username:u,password:pw,server:this.server});this.saved=true}catch(e){}},
  forget(){const p=this.P();this.saved=false;this.used=false;if(p)p.deleteCredentials({server:this.server}).catch(()=>{})},
  async get(){const p=this.P();await p.verifyIdentity({reason:'Sign in to 20 Vision Site Safety',title:'Sign in',subtitle:'Use your fingerprint or face',negativeButtonText:'Use password',useFallback:true});return p.getCredentials({server:this.server})}};
async function rememberLogin(email,pin,up){
  const rem=up||!$('#a-rem')||$('#a-rem').checked;
  try{localStorage.setItem('vss-rem',rem?'1':'0');localStorage.setItem('vss-email',rem?email:'')}catch(e){}
  if(!rem){BIO.forget();return}
  if(BIO.native&&CLOUD.on)await BIO.save(email,pin);
}
async function bioSignIn(){try{const c=await BIO.get();BIO.used=true;$('#a-email').value=c.username;$('#a-pin').value=c.password;$('#authf').requestSubmit()}catch(e){toast('Fingerprint or face not accepted. Type your password.')}}
function authView(){
  const C=CLOUD.on,first=!C&&!S.users.length;
  if(first)authMode='up';
  const P=C?'password':'PIN';
  return `<div class="authwrap"><div class="hero"><div class="stripe"></div><div class="in">
  <h1>20 Vision Site Safety</h1><p class="mute">Daily site checks, toolbox talks, inspections and incident reports for 20 Vision Electric, built around COR 2020 and the Ontario OHSA.</p>
  ${C?'<p class="infobox small">Already on 20 Vision Crew Connect? Sign in with the same email and password.</p>':first?'<p class="infobox small">The first account on this device becomes the office admin.</p>':''}
  <form id="authf">${authMode==='up'?`
   <label class="f" for="a-name">Full name</label><input id="a-name" required autocomplete="name">
   <label class="f" for="a-email">Email</label><input id="a-email" type="email" required autocomplete="email">
   <label class="f" for="a-phone">Cell phone</label><input id="a-phone" type="tel" autocomplete="tel">
   <label class="f" for="a-trade">Job title</label><select id="a-trade" required><option value="">Choose your job title</option>${JOBS.map(j=>`<option>${j}</option>`).join('')}</select>
   ${C?`<label class="f" for="a-pin">Create a password (8 or more characters)</label><input id="a-pin" type="password" minlength="8" required autocomplete="new-password">
   <label class="f" for="a-pin2">Enter the password again</label><input id="a-pin2" type="password" minlength="8" required autocomplete="new-password">`
   :`<label class="f" for="a-pin">Create a PIN (4 to 6 digits)</label><input id="a-pin" type="password" inputmode="numeric" pattern="[0-9]{4,6}" required>
   <label class="f" for="a-pin2">Enter the PIN again</label><input id="a-pin2" type="password" inputmode="numeric" pattern="[0-9]{4,6}" required>`}`
  :`${BIO.saved?`<button class="btn pri block" type="button" data-act="bioSignIn">Sign in with fingerprint or face</button><p class="small mute" style="text-align:center">or type your ${P==='PIN'?'PIN':'password'}</p>`:''}<label class="f" for="a-email">Email</label><input id="a-email" type="email" required autocomplete="email" value="${esc(rememberedEmail())}">
   <label class="f" for="a-pin">${P==='PIN'?'PIN':'Password'}</label><input id="a-pin" type="password" ${C?'autocomplete="current-password"':'inputmode="numeric"'} required>`}
   <label class="chkline"><input type="checkbox" id="a-show" data-act-change="showpw"> Show ${P==='PIN'?'PIN':'password'}</label>
   ${authMode==='in'?`<label class="chkline"><input type="checkbox" id="a-rem" ${remOff()?'':'checked'}> Remember me${BIO.native?' (fingerprint or face next time)':''}</label>`:''}
   <p></p><button class="btn pri block" type="submit">${authMode==='up'?'Create my account':'Sign in'}</button></form>
  ${first?'':`<p class="small" style="text-align:center"><a href="#" data-act="authmode">${authMode==='up'?'I already have an account':'New here? Create an account'}</a>${C&&authMode==='in'?' • <a href="#" data-act="forgot">Forgot password</a>':''}</p>`}
  </div></div></div>`}
async function authSubmit(e){
  e.preventDefault();
  const btn=e.target.querySelector('button[type=submit]');
  const email=$('#a-email').value.trim().toLowerCase(),pin=$('#a-pin').value;
  const up=authMode==='up';
  if(up){
    if(!$('#a-name').value.trim())return toast('Enter your name.');
    if(!$('#a-trade').value)return toast('Choose your job title.');
    if(CLOUD.on){if(pin.length<8)return toast('Password must be at least 8 characters.')}else if(!/^\d{4,6}$/.test(pin))return toast('PIN must be 4 to 6 digits.');
    if(pin!==$('#a-pin2').value)return toast(CLOUD.on?'The two passwords do not match.':'The two PINs do not match.');
  }
  if(CLOUD.on){
    btn.disabled=true;btn.textContent='Connecting…';
    let fu;
    try{if(!await CLOUD.init())throw {code:'net'};fu=await CLOUD.signIn(email,pin,up)}
    catch(err){btn.disabled=false;btn.textContent=up?'Create my account':'Sign in';
      const c=err.code||'';return toast(c.includes('email-already-in-use')?'That email already has an account (maybe from Crew Connect). Sign in instead.':c.includes('weak-password')?'Pick a stronger password.':c==='net'||c.includes('network')?'No internet. Try again when you have signal.':up?'Could not create the account.':(BIO.used?(BIO.forget(),'Your password has changed. Type your new password.'):'Email or password is wrong.'))}
    await CLOUD.pull();
    let u=S.users.find(x=>x.id===fu.uid);
    if(!u){const cc=await CLOUD.crewName(fu.uid);
      u={id:fu.uid,name:up?$('#a-name').value.trim():(cc?.name||email.split('@')[0]),email,phone:up?$('#a-phone').value.trim():(cc?.phone||''),trade:up?$('#a-trade').value:'Electrician (309A)',role:'worker',created:now(),active:true};
      S.users.push(u)}
    if(u.active===false){await CLOUD.signOut();btn.disabled=false;return toast('This account is turned off. Ask the office.')}
    if(CLOUD.admin&&u.role!=='admin')u.role='admin';
    save('users');ME=u;CLOUD.pushAll();
    try{localStorage.setItem(SESSION_KEY,ME.id)}catch(e){}
    await rememberLogin(email,pin,up);
    if(up){toast('Account created. Check your email to confirm it. Now finish your profile.');return go('profile',{id:u.id})}
    if(!u.photo&&!u.hired)return go('profile',{id:u.id});
    return go('home');
  }
  if(up){
    if(S.users.some(u=>u.email===email))return toast('An account with that email already exists. Sign in instead.');
    const u={id:uid(),name:$('#a-name').value.trim(),email,phone:$('#a-phone').value.trim(),trade:$('#a-trade').value,role:S.users.length?'worker':'admin',pin:await hash(pin,email),created:now(),active:true};
    S.users.push(u);save('users');ME=u;
    try{localStorage.setItem(SESSION_KEY,ME.id)}catch(e){}
    toast('Account created. Finish your profile and add your certificates.');return go('profile',{id:u.id});
  }
  const u=S.users.find(x=>x.email===email);
  if(!u||u.pin!==await hash(pin,email))return toast('Email or PIN is wrong.');
  if(u.active===false)return toast('This account is turned off. Ask the office.');
  ME=u;try{localStorage.setItem(SESSION_KEY,ME.id)}catch(e){}
  go('home');
}

/* ================= HOME ================= */
function dueItems(){
  const out=[];
  if(!mySig())out.push(['bad','Read and sign the company policy (Policy tab).']);
  if(isOffice()){const miss=S.users.filter(u=>u.active!==false&&u.id!==ME.id&&!S.policysigs.some(p=>p.userId===u.id&&p.version===POLICY_VERSION));if(miss.length)out.push(['warn',`${miss.length} worker(s) have not signed the company policy.`])}
  const myTr=S.training.filter(t=>isOffice()||t.userId===ME.id);
  for(const t of myTr)if(t.expiry){const d=-daysSince(t.expiry),nm=t.course==='other'&&t.label?t.label:courseName(t.course);if(d<0)out.push(['bad',`${userName(t.userId)}: ${nm} expired`]);else if(d<=45)out.push(['warn',`${userName(t.userId)}: ${nm} expires in ${dayWord(d)}`])}
  for(const q of S.equip)if(q.status==='out')out.push(['bad',`Out of service: ${INSP[q.type]?.name||q.type} ${q.serial}`]);
  const open=S.actions.filter(a=>a.status!=='closed'&&(isOffice()||a.assignee===ME.id));
  for(const a of open)out.push([a.due&&a.due<today()?'bad':'warn','Corrective action: '+a.desc.slice(0,80)]);
  if(isOffice()){for(const c of S.checkins.filter(c=>daysSince(c.inAt)<=14&&(c.outAt||Date.now()-new Date(c.inAt)>45*6e4)&&!S.dailies.some(d=>d.checkinId===c.id)))out.push(['bad',`${userName(c.userId)} worked at ${siteName(c.siteId)} on ${fmtD(dayOf(c.inAt))} with no daily safety check`])}
  if(isOffice()){const lastTalk=S.talks.map(t=>t.at).sort().pop();if(!lastTalk||daysSince(lastTalk)>7)out.push(['warn','No toolbox talk logged in the last 7 days.'])}
  return out}
const VIEWS={};
VIEWS.home=()=>{
  const ci=activeCheckin();
  const dailyDone=ci&&S.dailies.some(d=>d.checkinId===ci.id);
  const due=dueItems();
  const site=ci&&S.sites.find(s=>s.id===ci.siteId);
  return `<div class="grid g2"><div class="hero"><div class="stripe"></div><div class="in">
  <p class="mute small">${new Date().toLocaleDateString('en-CA',{weekday:'long',month:'long',day:'numeric'})}</p>
  ${ci?`<h1>${esc(site?.name||'Site')}</h1>
    <p><span class="stamp ${ci.far?'bad':''}">${ci.far?'Outside site area':'On site'} • ${esc(locStamp(ci.loc))}</span></p>
    <p class="small mute">Checked in ${fmt(ci.inAt)}${ci.dist!=null?` • ${ci.dist} m from site pin`:''}</p>
    ${dailyDone?'':'<p class="warnbox"><b>Required:</b> do your daily safety check before you start work. It must be done every day you work on site.</p>'}
    <div class="row">${dailyDone?'<span class="pill ok">Daily safety check done</span>':'<button class="btn pri" data-act="go" data-v="daily">Do my daily safety check</button>'}
    <button class="btn" data-act="go" data-v="inspect">Inspect equipment</button><button class="btn" data-act="checkout">Leave site</button></div>`
  :`<h1>Start your site day</h1><p>Check in at the site with your location on. Then do the daily safety check before you start work.</p>
    <button class="btn pri block" data-act="go" data-v="checkin">Check in to a site</button>`}
  </div></div>
  <div class="card"><h2>Needs attention</h2>${due.length?`<div class="list">${due.slice(0,8).map(d=>`<div class="it"><span class="pill ${d[0]}">${d[0]==='bad'?'Now':'Soon'}</span><div class="m small">${esc(d[1])}</div></div>`).join('')}</div>`:'<p class="okbox">Nothing overdue. Keep it that way.</p>'}</div></div>
  <p></p><div class="tiles">
  <button class="tile hot" data-act="go" data-v="incident"><b>Report incident</b><span>Injury, near miss, hazard</span></button>
  <button class="tile" data-act="tab" data-v="talks"><b>Toolbox talk</b><span>Run a talk, sign in the crew</span></button>
  <button class="tile" data-act="go" data-v="training"><b>My training</b><span>Certificates and expiry dates</span></button>
  ${canCor()?`<button class="tile" data-act="go" data-v="cor"><b>COR readiness</b><span>14 COR 2020 elements</span></button>`:''}
  <button class="tile" data-act="go" data-v="socials"><b>Safety Socials</b><span>Do this, not that</span></button>
  <button class="tile" data-act="go" data-v="updates"><b>Safety updates</b><span>Ontario rule changes</span></button>
  <button class="tile" data-act="go" data-v="actions"><b>Corrective actions</b><span>${S.actions.filter(a=>a.status!=='closed').length} open</span></button>
  <button class="tile" data-act="go" data-v="emerg"><b>Emergency info</b><span>Hospital, muster point</span></button></div>`};

/* ================= CHECK IN ================= */
VIEWS.checkin=()=>{
  const sites=S.sites.filter(s=>s.active!==false);
  const other=`<div class="card"><h3>${sites.length?'Job not on the list?':'Check in to your job'}</h3><p class="small mute">Type the job name or address. Your GPS location is still recorded, and the office sees it as an unlisted site.</p><label class="f" for="ci-other">Job name or address</label><input id="ci-other" placeholder="e.g. 123 Main St, Brampton"><p></p><button class="btn pri" data-act="doCheckinOther">Check in here</button></div>`;
  return `<h1>Check in to a site</h1><p>Your location is recorded with every check-in, checklist, inspection and talk. This is the proof COR auditors and inspectors look for.</p>
  ${sites.length?`<div class="card">${sites.map(s=>`<div class="chk"><div><b>${esc(s.name)}</b><div class="small mute">${esc(s.address||'')}</div></div><button class="btn pri sm" data-act="doCheckin" data-v="${esc(s.id)}">Check in here</button></div>`).join('')}</div><p></p>`:`<div class="infobox">No job sites added yet.${isAdmin()?' <button class="btn sm" data-act="go" data-v="sites">Add a site</button>':''}</div><p></p>`}${other}`};
async function doCheckinOther(){
  const name=($('#ci-other')?.value||'').trim().slice(0,120);if(!name)return toast('Type the job name or address.');
  toast('Getting your location…');
  let loc;try{loc=await getLoc()}catch(m){return tell('Location needed',esc(m),'OK')}
  const c={id:uid(),userId:ME.id,siteId:'u:'+name,inAt:now(),loc,dist:null,far:true,reason:'Unlisted site',pings:[loc]};
  S.checkins.push(c);save('checkins');toast('Checked in. Now do your daily safety check.');go('daily');
}
async function doCheckin(siteId){
  toast('Getting your location…');
  let loc;try{loc=await getLoc()}catch(m){return tell('Location needed',esc(m),'OK')}
  const s=S.sites.find(x=>x.id===siteId);
  let d=null,far=false;
  if(s.lat!=null){d=Math.round(dist(loc.lat,loc.lng,s.lat,s.lng));far=d>(s.radius||300)}
  let reason='';
  if(far){const ok=await ask('You are not at this site',`You are about ${d.toLocaleString()} m from the site pin for ${esc(s.name)}. Check in anyway? The office will see this flag.`,'Check in with flag',true);if(!ok)return;reason='Outside site radius'}
  const c={id:uid(),userId:ME.id,siteId,inAt:now(),loc,dist:d,far,reason,pings:[loc]};
  if(s.lat==null&&isAdmin()&&await ask('Set site location?','This site has no location pin yet. Use where you are standing now as the site location?','Set site pin')){s.lat=loc.lat;s.lng=loc.lng;s.radius=s.radius||300;save('sites');c.dist=0}
  S.checkins.push(c);save('checkins');toast('Checked in. Now do your daily safety check.');go('daily');
}
async function ping(){const ci=activeCheckin();if(!ci)return null;try{const l=await getLoc();ci.pings=(ci.pings||[]).concat(l).slice(-200);save('checkins');return l}catch(e){return null}}

/* ================= DAILY FLHA ================= */
VIEWS.daily=()=>{
  const ci=activeCheckin();
  if(!ci)return needCheckin();
  if(!D.kind||D.kind!=='daily')D={kind:'daily',ans:{},hz:{},notes:'',task:''};
  const s=S.sites.find(x=>x.id===ci.siteId)||{};
  return `<h1>Daily safety check</h1><p class="mute">${esc(s.name)} • Field-level hazard assessment (COR element 2) • PPE (6) • Site inspection (9)</p>
  <div class="card"><label class="f" for="d-task">What work are you doing today?</label><textarea id="d-task" data-bind="task" placeholder="e.g. Pull wire to 3rd floor panels, terminate LP-3">${esc(D.task)}</textarea></div><p></p>
  ${DAILY.map(sec=>`<div class="card"><h3>${esc(sec.sec)}</h3>${sec.items.map(([k,t,r])=>chkRow(k,t,r,D.ans)).join('')}</div><p></p>`).join('')}
  <div class="card"><h3>Today's hazards</h3><p class="small mute">Tap every hazard that applies. Rate the risk before and after your controls.</p>
   <div class="chips">${HAZARDS.map(h=>`<button class="chip ${D.hz[h[0]]?'on':''}" data-act="hz" data-v="${h[0]}">${esc(h[1])}</button>`).join('')}</div><div id="hzbox">${hzBox()}</div></div><p></p>
  <div class="card"><label class="f" for="d-notes">Anything else? Problems, near misses, notes</label><textarea id="d-notes" data-bind="notes">${esc(D.notes)}</textarea>
  <label class="f">Your signature</label><canvas class="sig" data-sig="sig"></canvas><button class="btn sm" data-act="clearsig" data-v="sig">Clear</button></div><p></p>
  <button class="btn pri block" data-act="saveDaily">Submit daily safety check</button>`};
function chkRow(k,t,r,store){const v=store[k];return `<div class="chk"><div>${esc(t)}<div class="ref">${esc(r||'')}</div></div><div class="pfn" data-k="${k}">${[['y','Yes'],['n','No'],['na','N/A']].map(([x,l])=>`<button class="${x} ${v===x?'on':''}" data-act="ans" data-k="${k}" data-v="${x}">${l}</button>`).join('')}</div></div>`}
function hzBox(){const on=HAZARDS.filter(h=>D.hz[h[0]]);if(!on.length)return '';return on.map(h=>{const z=D.hz[h[0]];const stop=['confined','asbestos'].includes(h[0]);return `<div class="${stop?'warnbox':'infobox'}" style="margin-top:12px"><b>${esc(h[1])}</b><div class="small">${esc(h[2])}</div>
  <label class="f" for="hc-${h[0]}">Controls I will use</label><input id="hc-${h[0]}" data-bind="hz.${h[0]}.ctrl" value="${esc(z.ctrl||'')}">
  <div class="row" style="margin-top:8px"><span class="small">Risk before:</span>${riskBtns(h[0],'before',z.before)}</div><div class="row" style="margin-top:6px"><span class="small">Risk after:</span>${riskBtns(h[0],'after',z.after)}</div></div>`}).join('')}
function riskBtns(k,w,v){return ['Low','Medium','High'].map(r=>`<button class="chip ${v===r?'on':''}" data-act="risk" data-k="${k}" data-w="${w}" data-v="${r}">${r}</button>`).join('')}
function needCheckin(){return `<div class="warnbox"><h2>Check in first</h2><p>You must be checked in on site, with location on, to do this.</p><button class="btn pri" data-act="go" data-v="checkin">Check in</button></div>`}
async function saveDaily(){
  const all=DAILY.flatMap(s=>s.items.map(i=>i[0]));
  const miss=all.filter(k=>!D.ans[k]);
  if(miss.length)return toast(`Answer every question (${miss.length} left).`);
  if(!D.task.trim())return toast('Say what work you are doing today.');
  for(const [k,z] of Object.entries(D.hz)){if(!z.ctrl||!z.before||!z.after)return toast('For each hazard, add your controls and rate the risk before and after.')}
  const nos=all.filter(k=>D.ans[k]==='n');
  if(nos.length&&!D.notes.trim())return toast('You answered No to something. Explain it in the notes.');
  if(!D.sig)return toast('Sign the daily check.');
  if(D.hz.confined||D.hz.asbestos){if(!await ask('Stop-work hazard','You selected confined space or possible asbestos. Do not start that work. The office will be told. Submit?','Submit'))return}
  const loc=await ping();if(!loc)return tell('Location needed','Turn on location to submit. Your location proves you were on site.');
  const ci=activeCheckin();
  const r={id:uid(),userId:ME.id,siteId:ci.siteId,checkinId:ci.id,at:now(),loc,ans:D.ans,hz:D.hz,task:D.task,notes:D.notes,sig:D.sig};
  S.dailies.push(r);save('dailies');
  const labels=Object.fromEntries(DAILY.flatMap(s=>s.items.map(i=>[i[0],i[1]])));
  for(const k of nos)addAction('Daily check: '+labels[k],ci.siteId,'daily',r.id);
  for(const k of ['confined','asbestos'])if(D.hz[k])addAction('STOP WORK hazard reported: '+HAZARDS.find(h=>h[0]===k)[1],ci.siteId,'daily',r.id);
  D={};toast('Daily safety check saved.');
  if(await ask('Using equipment today?','Ladders, lifts, harnesses, cords and tools need a pre-use inspection with photos.','Inspect now'))go('inspect');else go('home');
}
function addAction(desc,siteId,src,ref){S.actions.push({id:uid(),desc,siteId,src,ref,at:now(),by:ME.id,assignee:null,due:addDays(7),status:'open'});save('actions')}
const addDays=n=>{const x=new Date();x.setDate(x.getDate()+n);return x.toLocaleDateString('en-CA')};

/* ================= INSPECTIONS ================= */
VIEWS.inspect=()=>`<h1>Equipment inspection</h1><p>Inspect before use. Take the photos, enter the serial number and dates. Anything that fails must be tagged out of service right away.</p>
 ${activeCheckin()?'':'<div class="warnbox">You must be checked in on site to inspect equipment. <button class="btn sm" data-act="go" data-v="checkin">Check in</button></div><p></p>'}
 <div class="tiles">${Object.entries(INSP).map(([k,t])=>`<button class="tile" data-act="startInsp" data-v="${k}"><b>${esc(t.name)}</b><span>${t.photos.length} photos • ${t.items.length} checks</span></button>`).join('')}</div>`;
VIEWS.inspform=()=>{
  if(!activeCheckin())return needCheckin();
  const t=INSP[D.type];if(!t)return VIEWS.inspect();
  const known=S.equip.filter(q=>q.type===D.type);
  return `<h1>${esc(t.name)}</h1><p class="mute">Pre-use inspection • COR elements 7 and 9</p>
  ${known.length?`<div class="card"><label class="f" for="i-pick">Pick from equipment list (optional)</label><select id="i-pick" data-act-change="pickEquip"><option value="">New item</option>${known.map(q=>`<option value="${q.id}" ${D.equipId===q.id?'selected':''}>${esc(q.serial)}${q.status==='out'?' (OUT OF SERVICE)':''}</option>`).join('')}</select></div><p></p>`:''}
  <div class="card"><h3>Photos (all required)</h3><div class="photos">${t.photos.map((p,i)=>`<label class="ph ${D.photos[i]?'done':''}" id="ph-${i}">${D.photos[i]?`<img src="${img(D.photos[i])}" alt="">`:esc(p)}<input type="file" accept="image/*" capture="environment" data-photo="${i}" aria-label="${esc(p)}"></label>`).join('')}</div></div><p></p>
  <div class="card"><h3>Details</h3>${t.fields.map(([k,l,ty])=>`<label class="f" for="if-${k}">${esc(l)}</label><input id="if-${k}" type="${ty}" data-bind="f.${k}" value="${esc(D.f[k]||'')}">`).join('')}</div><p></p>
  <div class="card"><h3>Checks</h3>${t.items.map((it,i)=>{const [txt,ref]=it.split('|');return chkRow('c'+i,txt,ref,D.ans)}).join('')}
  <label class="f" for="i-notes">Notes / defects found</label><textarea id="i-notes" data-bind="notes">${esc(D.notes||'')}</textarea></div><p></p>
  <button class="btn pri block" data-act="saveInsp">Save inspection</button>`};
function dateRules(type,f){
  const out=[];const t=today();
  if(f.expiry&&f.expiry<t)out.push('Expiry / service-life date has passed.');
  if(f.cal&&f.cal<t)out.push('Calibration is overdue.');
  if(f.annual&&daysSince(f.annual)>365)out.push('Annual inspection is more than 12 months old.');
  if(type==='extinguisher'&&f.tag&&daysSince(f.tag)>31)out.push('Monthly tag inspection is overdue.');
  if(type==='ewp'&&f.tag&&daysSince(f.tag)>365)out.push('Inspection tag date is more than 12 months old.');
  if(type==='firstaid'&&f.card&&daysSince(f.card)>92)out.push('First aid kit inspection card is more than 3 months old.');
  if(type==='gloves'&&f.test&&!/^\s*0{1,2}\s*$/.test(f.class||'')&&daysSince(f.test)>92)out.push('Glove dielectric test is more than 3 months old (in service).');
  if(type==='gloves'&&f.test&&/^\s*0{1,2}\s*$/.test(f.class||'')&&daysSince(f.test)>183)out.push('Class 00/0 glove test is more than 6 months old.');
  if(type==='harness'&&f.mfg&&!f.expiry&&daysSince(f.mfg)>365*5)out.push('Harness is over 5 years old with no service-life date. Check the manufacturer\'s limit.');
  return out}
async function saveInsp(){
  const t=INSP[D.type];
  if(t.photos.some((_,i)=>!D.photos[i]))return toast('Take every photo.');
  const missF=t.fields.filter(([k])=>!String(D.f[k]||'').trim());
  if(missF.length)return toast('Fill in: '+missF.map(x=>x[1]).join(', '));
  if(t.items.some((_,i)=>!D.ans['c'+i]))return toast('Answer every check.');
  const loc=await ping();if(!loc)return tell('Location needed','Turn on location to save. It proves the inspection was done on site.');
  const fails=t.items.map((it,i)=>D.ans['c'+i]==='n'?it.split('|')[0]:null).filter(Boolean);
  const dateFails=dateRules(D.type,D.f);
  const pass=!fails.length&&!dateFails.length;
  const ci=activeCheckin();
  const serial=D.f.serial.trim();
  let q=S.equip.find(x=>x.id===D.equipId)||S.equip.find(x=>x.type===D.type&&x.serial.toLowerCase()===serial.toLowerCase());
  if(!q){q={id:uid(),type:D.type,serial,added:now()};S.equip.push(q)}
  Object.assign(q,{serial,fields:D.f,status:pass?'in':'out',lastInsp:now(),lastSite:ci.siteId});save('equip');
  const r={id:uid(),userId:ME.id,siteId:ci.siteId,at:now(),loc,type:D.type,equipId:q.id,f:D.f,ans:D.ans,photos:D.photos,notes:D.notes,pass,fails:fails.concat(dateFails)};
  S.insps.push(r);save('insps');
  if(!pass)addAction(`${t.name} ${serial} failed: ${r.fails.join('; ')}`,ci.siteId,'insp',r.id);
  D={};
  if(pass){toast('Inspection passed and saved.');go('inspect')}
  else{await tell('FAILED: do not use',`<b>Tag it out of service now.</b><br>${r.fails.map(esc).join('<br>')}<br><br>A corrective action has been created for the office.`);go('inspect')}
}

/* ================= TOOLBOX TALKS ================= */
VIEWS.talks=()=>{
  const recent=mine(S.talks).slice().sort((a,b)=>b.at.localeCompare(a.at)).slice(0,5);
  const cats=[...new Set(TALKS.map(t=>t.cat))];
  return `<h1>Toolbox talks</h1><p>Pick a topic, read it to the crew, then have everyone sign. Hold one at least weekly (COR element 8.2).</p>
  ${!activeCheckin()?'<div class="warnbox">Check in on site to run a talk. <button class="btn sm" data-act="go" data-v="checkin">Check in</button></div><p></p>':''}
  ${cats.map(c=>`<h3>${esc(c)}</h3><div class="tiles">${TALKS.filter(t=>t.cat===c).map(t=>`<button class="tile" data-act="startTalk" data-v="${esc(t.id)}"><b>${esc(t.title)}</b><span>${esc(t.ref)}</span></button>`).join('')}</div><p></p>`).join('')}
  <button class="btn" data-act="startTalk" data-v="custom">Custom topic</button>
  ${recent.length?`<p></p><div class="card"><h3>Recent talks</h3><div class="list">${recent.map(t=>`<div class="it" data-act="openRec" data-k="talks" data-v="${esc(t.id)}"><div class="m"><b>${esc(t.title)}</b><div class="small mute">${fmt(t.at)} • ${esc(siteName(t.siteId))} • ${t.att.length} signed</div></div></div>`).join('')}</div></div>`:''}`};
VIEWS.talkrun=()=>{
  if(!activeCheckin())return needCheckin();
  const custom=D.topicId==='custom';
  return `<h1>${custom?'Custom toolbox talk':esc(D.title)}</h1>
  ${custom?`<div class="card"><label class="f" for="t-title">Topic</label><input id="t-title" data-bind="title" value="${esc(D.title||'')}"><label class="f" for="t-pts">Key points</label><textarea id="t-pts" data-bind="customPts">${esc(D.customPts||'')}</textarea></div>`
  :`<div class="card"><h3>Key points</h3><ol>${D.points.map(p=>`<li style="margin-bottom:8px">${esc(p)}</li>`).join('')}</ol><h3>Ask the crew</h3><ul>${D.qs.map(p=>`<li>${esc(p)}</li>`).join('')}</ul><p class="small mute">Reference: ${esc(D.ref)}</p></div>`}<p></p>
  <div class="card"><label class="f" for="t-notes">Crew questions, concerns and site-specific points</label><textarea id="t-notes" data-bind="notes">${esc(D.notes||'')}</textarea></div><p></p>
  <div class="card"><h3>Attendance (${D.att.length})</h3><div class="list">${D.att.map((a,i)=>`<div class="it"><img src="${img(a.sig)}" alt="" style="width:90px;height:40px;object-fit:contain;background:#fff;border-radius:6px"><div class="m"><b>${esc(a.name)}</b><div class="small mute">${esc(a.company||'20 Vision Electric')}</div></div><button class="btn sm" data-act="rmAtt" data-v="${i}">Remove</button></div>`).join('')}</div>
  <button class="btn" data-act="addAtt">Add worker and signature</button></div><p></p>
  <button class="btn pri block" data-act="saveTalk">Finish and save talk</button>`};
function addAttendee(){
  const crew=S.users.filter(u=>u.active!==false&&!D.att.some(a=>a.userId===u.id));
  const m=document.createElement('div');m.className='modal';
  m.innerHTML=`<div class="card"><h3>Sign attendance</h3><label class="f" for="at-who">Worker</label><select id="at-who"><option value="">Other (subcontractor / visitor)</option>${crew.map(u=>`<option value="${u.id}">${esc(u.name)}</option>`).join('')}</select>
  <div id="at-other"><label class="f" for="at-name">Name</label><input id="at-name"><label class="f" for="at-co">Company</label><input id="at-co"></div>
  <p class="small">I attended this talk and understand it.</p><canvas class="sig" id="at-sig"></canvas>
  <div class="row" style="margin-top:10px"><button class="btn pri" id="at-ok">Save signature</button><button class="btn" id="at-clr">Clear</button><button class="btn" id="at-x">Cancel</button></div></div>`;
  document.body.appendChild(m);
  const pad=sigPad(m.querySelector('#at-sig'),()=>{});
  const sel=m.querySelector('#at-who');sel.onchange=()=>m.querySelector('#at-other').style.display=sel.value?'none':'';
  if(crew.length){sel.value=crew[0].id;sel.onchange()}
  m.querySelector('#at-clr').onclick=()=>pad.clear();m.querySelector('#at-x').onclick=()=>m.remove();
  m.querySelector('#at-ok').onclick=()=>{const id=sel.value;const name=id?userName(id):m.querySelector('#at-name').value.trim();if(!name)return toast('Enter a name.');if(!pad.dirty())return toast('Signature needed.');D.att.push({userId:id||null,name,company:id?'20 Vision Electric':m.querySelector('#at-co').value.trim(),sig:pad.data(),at:now()});m.remove();render()};
}
async function saveTalk(){
  if(D.topicId==='custom'){if(!D.title?.trim()||!D.customPts?.trim())return toast('Add a topic and key points.');D.points=D.customPts.split('\n').filter(Boolean)}
  if(!D.att.length)return toast('At least one worker must sign.');
  const loc=await ping();if(!loc)return tell('Location needed','Turn on location to save the talk.');
  const ci=activeCheckin();
  S.talks.push({id:uid(),userId:ME.id,leader:ME.name,siteId:ci.siteId,at:now(),loc,topicId:D.topicId,title:D.title,points:D.points,notes:D.notes||'',att:D.att});save('talks');
  D={};toast('Toolbox talk saved.');go('talks')}

/* ================= INCIDENTS ================= */
VIEWS.incident=()=>{
  if(D.kind!=='inc')D={kind:'inc',type:'',when:new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,16),photos:[],injured:'',injuredPick:'',supPick:'',supervisor:'',stmt:'',isig:'',idate:today(),noSign:false,desc:'',body:'',firstaid:'',witness:'',immediate:'',cause:'',siteId:activeCheckin()?.siteId||''};
  return `<h1>Report an incident</h1><div class="warnbox"><b>Emergency? Call 911 first.</b> Critical injury: protect the scene and call the office right away.</div><p></p>
  <div class="card"><h3>What happened?</h3><div class="chips">${INC_TYPES.map(t=>`<button class="chip ${D.type===t[0]?'on':''}" data-act="incType" data-v="${t[0]}">${esc(t[1])}</button>`).join('')}</div>
  <div id="increp">${repBox(D.type)}</div>
  <label class="f" for="n-site">Site</label><select id="n-site" data-bind="siteId"><option value="">Choose</option>${D.siteId&&String(D.siteId).startsWith('u:')?`<option value="${esc(D.siteId)}" selected>${esc(siteName(D.siteId))}</option>`:''}${S.sites.map(s=>`<option value="${s.id}" ${D.siteId===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select>
  <label class="f" for="n-when">Date and time it happened</label><input id="n-when" type="datetime-local" data-bind="when" value="${esc(D.when)}">
  <label class="f" for="n-desc">Describe what happened</label><textarea id="n-desc" data-bind="desc">${esc(D.desc)}</textarea>
  ${pickPerson('sup','Supervisor or foreman on site',D.supPick,D.supervisor,true)}
  ${pickPerson('inj','Injured person (if any)',D.injuredPick,D.injured,false)}
  <label class="f" for="n-body">Injury and body part</label><input id="n-body" data-bind="body" value="${esc(D.body)}">
  <label class="f" for="n-fa">First aid given / by whom</label><input id="n-fa" data-bind="firstaid" value="${esc(D.firstaid)}">
  <label class="f" for="n-wit">Witnesses</label><input id="n-wit" data-bind="witness" value="${esc(D.witness)}">
  <label class="f" for="n-imm">What was done right away to make it safe?</label><textarea id="n-imm" data-bind="immediate">${esc(D.immediate)}</textarea>
  <label class="f" for="n-cause">Why do you think it happened?</label><textarea id="n-cause" data-bind="cause">${esc(D.cause)}</textarea>
  <div id="inj-st" style="display:${D.injured?'':'none'}"><h3 style="margin-top:14px">Injured worker's statement</h3><p class="small mute">The injured worker fills this in and signs, in their own words.</p>
  <label class="f" for="n-stmt">What happened, in your own words</label><textarea id="n-stmt" data-bind="stmt">${esc(D.stmt)}</textarea>
  <label class="f">Injured worker's signature</label><canvas class="sig" data-sig="isig"></canvas><button class="btn sm" data-act="clearsig" data-v="isig">Clear</button>
  <label class="f" for="n-idate">Date signed</label><input id="n-idate" type="date" data-bind="idate" value="${esc(D.idate)}">
  <label class="chkline"><input type="checkbox" id="n-nosign" ${D.noSign?'checked':''}> Injured worker can't sign now (taken for treatment). Get their statement later.</label></div>
  <h3 style="margin-top:14px">Photos</h3><div class="photos">${[0,1,2,3].map(i=>`<label class="ph ${D.photos[i]?'done':''}" id="ph-${i}">${D.photos[i]?`<img src="${img(D.photos[i])}" alt="">`:'Add photo'}<input type="file" accept="image/*" capture="environment" data-photo="${i}" aria-label="Incident photo ${i+1}"></label>`).join('')}</div></div><p></p>
  <button class="btn red block" data-act="saveInc">Submit report</button>`};
function pickPerson(id,label,pick,val,sup){const ppl=S.users.filter(u=>u.active!==false).sort((a,b)=>(sup?((b.role!=='worker')-(a.role!=='worker')):0)||a.name.localeCompare(b.name));
  return `<label class="f" for="n-${id}">${label}</label><select id="n-${id}" data-act-change="incPick" data-k="${id}"><option value="">${sup?'Choose':'No one injured'}</option>${ppl.map(u=>`<option value="${esc(u.id)}" ${pick===u.id?'selected':''}>${esc(u.name)}${u.trade?' – '+esc(u.trade):''}</option>`).join('')}<option value="other" ${pick==='other'?'selected':''}>Someone else (type the name)</option></select>
  <input id="n-${id}-o" placeholder="Full name" style="display:${pick==='other'?'':'none'};margin-top:6px" value="${pick==='other'?esc(val):''}" data-k="${id}">`}
function repBox(t){const r=REPORTING[t];if(!r)return '';return `<div class="${['critical','medical','lost','shock'].includes(t)?'warnbox':'infobox'}" style="margin-top:12px"><b>Ontario reporting for this type</b><ul>${r.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`}
async function saveInc(){
  if(!D.type)return toast('Pick what happened.');
  if(!D.desc.trim())return toast('Describe what happened.');
  if(!D.siteId)return toast('Pick the site.');
  if(!D.supervisor.trim())return toast('Pick the supervisor or foreman on site.');
  D.noSign=!!$('#n-nosign')?.checked;
  if(D.injured&&!D.noSign){if(!D.stmt.trim())return toast('The injured worker needs to write what happened.');if(!D.isig)return toast('The injured worker needs to sign.');if(!D.idate)return toast('Add the date the injured worker signed.')}
  if(!D.injured){D.stmt='';D.isig='';D.idate='';D.noSign=false}
  let loc=null;try{loc=await getLoc()}catch(e){}
  const r={id:uid(),userId:ME.id,at:now(),loc,...D,steps:{},investigation:null};delete r.kind;
  S.incidents.push(r);save('incidents');
  D={};toast('Report submitted. The office will investigate.');go('record',{k:'incidents',id:r.id})}

/* ================= CLEANUP (admin) ================= */
const OWNK=['checkins','dailies','insps','talks','incidents','training','policysigs'];
function userRecs(uid){const out=[];for(const k of OWNK)for(const r of S[k])if(r.userId===uid)out.push([k,r]);const ids=new Set(out.map(x=>x[1].id));for(const a of S.actions)if(a.by===uid||a.assignee===uid||ids.has(a.ref))out.push(['actions',a]);return out}
async function wipe(list){const by={};for(const [k,r] of list){(by[k]=by[k]||new Set()).add(r.id)}for(const k in by){S[k]=S[k].filter(r=>!by[k].has(r.id));saveLocal(k)}for(const [k,r] of list)await CLOUD.purge(k,r)}
async function delRecord(k,id){if(!isAdmin())return;const r=S[k].find(x=>x.id===id);if(!r)return;
  if(!await ask('Delete this record?','This permanently removes it from every phone and the cloud. Only delete test or mistaken records: real safety records must be kept for COR and the Ministry.','Delete for good',true))return;
  await wipe([[k,r]]);toast('Record deleted.');go('records')}
async function delWorker(uid,keepAccount){if(!isAdmin())return;const u=S.users.find(x=>x.id===uid);if(!u)return;if(uid===ME.id&&!keepAccount)return toast('You cannot delete your own account.');
  const list=userRecs(uid);
  const msg=keepAccount?`Delete all ${list.length} record(s) by ${esc(u.name)}? Their account stays.`:`Delete ${esc(u.name)} and all ${list.length} of their record(s), photos and documents?`;
  if(!await ask(keepAccount?'Clear records?':'Delete worker?',msg+' This cannot be undone.',keepAccount?'Clear records':'Delete worker',true))return;
  if(!keepAccount)list.push(['users',u]);
  toast('Deleting…');await wipe(list);toast(keepAccount?'Records cleared.':'Worker deleted.');render()}
VIEWS.cleanup=()=>{if(!isAdmin())return '<h1>Clean up test data</h1><p class="mute">Office admin only.</p>';
  return `<h1>Clean up test data</h1><div class="warnbox">For test accounts and test entries only. Deleted records are gone from every phone and the cloud. Keep real safety records: COR and the Ministry of Labour can ask for them.</div><p></p>
  <div class="card"><div class="list">${S.users.map(u=>{const n=userRecs(u.id).length;return `<div class="it"><div class="m"><b>${esc(u.name)}${u.id===ME.id?' (you)':''}</b><div class="small mute">${esc(u.email||'')} • ${esc(u.trade||'')} • ${n} record(s)</div></div><div class="row" style="gap:6px;flex:none">${n?`<button class="btn sm" data-act="clearRecs" data-v="${esc(u.id)}">Clear records</button>`:''}${u.id!==ME.id?`<button class="btn sm red" data-act="delWorker" data-v="${esc(u.id)}">Delete worker</button>`:''}</div></div>`}).join('')}</div></div>
  <p class="small mute">To delete one record, open it in Records and tap Delete record.</p>`};

/* ================= RECORDS ================= */
const KIND={policysigs:['Policy sign-off','pol'],dailies:['Daily check','daily'],insps:['Inspection','insp'],talks:['Toolbox talk','talk'],incidents:['Incident','inc'],checkins:['Check-in','ci']};
let recFilter='all',recSite='';
VIEWS.records=()=>{
  let rows=[];
  for(const k of Object.keys(KIND)){if(recFilter!=='all'&&recFilter!==k)continue;for(const r of mine(S[k]))rows.push([k,r])}
  if(recSite)rows=rows.filter(([k,r])=>r.siteId===recSite);
  rows.sort((a,b)=>(b[1].at||b[1].inAt).localeCompare(a[1].at||a[1].inAt));
  return `<h1>Records</h1><p class="mute">${isOffice()?'Everyone\'s records on this device.':'Your records.'} Every record keeps its time, location and signature for COR evidence.</p>
  <div class="chips">${[['all','All'],...Object.entries(KIND).map(([k,v])=>[k,v[0]+'s'])].map(([k,l])=>`<button class="chip ${recFilter===k?'on':''}" data-act="recf" data-v="${k}">${esc(l)}</button>`).join('')}</div>
  <label class="f" for="r-site">Site</label><select id="r-site" data-act-change="recsite"><option value="">All sites</option>${S.sites.map(s=>`<option value="${s.id}" ${recSite===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select><p></p>
  <div class="card">${rows.length?`<div class="list">${rows.slice(0,200).map(([k,r])=>`<div class="it" data-act="openRec" data-k="${k}" data-v="${esc(r.id)}"><span class="pill ${recPill(k,r)[0]}">${esc(KIND[k][0])}</span><div class="m"><b>${esc(recTitle(k,r))}</b><div class="small mute">${fmt(r.at||r.inAt)} • ${esc(userName(r.userId))} • ${esc(siteName(r.siteId))}</div></div><span class="small">${esc(recPill(k,r)[1])}</span></div>`).join('')}</div>`:'<p class="mute">No records yet.</p>'}</div>`};
function recTitle(k,r){if(k==='policysigs')return 'Company policy signed by '+r.name;return k==='insps'?(INSP[r.type]?.name||r.type)+' '+(r.f?.serial||''):k==='talks'?r.title:k==='incidents'?(INC_TYPES.find(t=>t[0]===r.type)||[])[1]:k==='dailies'?(r.task||'Daily check').slice(0,60):'Checked in'}
function recPill(k,r){if(k==='policysigs')return r.guest?['warn',r.role||'Guest']:['ok','Signed'];if(k==='insps')return r.pass?['ok','Pass']:['bad','Fail'];if(k==='incidents')return r.investigation?['ok','Investigated']:['bad','Open'];if(k==='checkins')return r.far?['warn','Flag']:['ok',r.outAt?'Left':'On site'];if(k==='dailies')return Object.values(r.ans||{}).includes('n')?['warn','Issues']:['ok','OK'];return ['ok','']}
VIEWS.record=()=>{
  const {k,id}=V.p;const r=S[k].find(x=>x.id===id);if(!r)return '<p>Record not found.</p>';
  const head=`<div class="row noprint"><button class="btn sm" data-act="tab" data-v="records">Back</button><button class="btn sm pri" data-act="pdf">Save as PDF</button>${NATIVE?'':'<button class="btn sm" data-act="print">Print</button>'}${isAdmin()?`<button class="btn sm red" data-act="delRec" data-k="${k}" data-v="${esc(id)}">Delete record</button>`:''}</div><p></p><div id="rec">
  <div class="hero"><div class="stripe"></div><div class="in"><p class="small mute">20 Vision Electric Inc. • ${esc(KIND[k][0])}</p><h1>${esc(recTitle(k,r))}</h1>
  <dl class="kv"><dt>Date</dt><dd>${fmt(r.at||r.inAt)}</dd><dt>By</dt><dd>${esc(r.userId?userName(r.userId):r.name||'')}</dd><dt>Site</dt><dd>${esc(siteName(r.siteId))}</dd><dt>GPS</dt><dd>${esc(locStamp(r.loc))}${r.loc?` • <a href="https://maps.google.com/?q=${r.loc.lat},${r.loc.lng}" target="_blank" rel="noopener">map</a>`:''}</dd></dl></div></div><p></p>`;
  let body='';
  if(k==='dailies'){const L=Object.fromEntries(DAILY.flatMap(s=>s.items.map(i=>[i[0],i[1]])));
    body=`<div class="card"><h3>Work today</h3><p>${esc(r.task)}</p><h3>Checklist</h3><table>${Object.entries(r.ans).map(([q,a])=>`<tr><td>${esc(L[q])}</td><td><span class="pill ${a==='y'?'ok':a==='n'?'bad':''}">${a==='y'?'Yes':a==='n'?'No':'N/A'}</span></td></tr>`).join('')}</table>
    <h3 style="margin-top:12px">Hazards and controls</h3>${Object.keys(r.hz).length?`<table><tr><th>Hazard</th><th>Controls</th><th>Before</th><th>After</th></tr>${Object.entries(r.hz).map(([h,z])=>`<tr><td>${esc((HAZARDS.find(x=>x[0]===h)||[])[1])}</td><td>${esc(z.ctrl)}</td><td>${esc(z.before)}</td><td>${esc(z.after)}</td></tr>`).join('')}</table>`:'<p class="mute">None selected.</p>'}
    <h3 style="margin-top:12px">Notes</h3><p>${esc(r.notes||'None')}</p><h3>Signature</h3><img src="${img(r.sig)}" alt="Signature" style="max-width:260px;background:#fff">
    ${r.review?`<p class="okbox">Reviewed by ${esc(userName(r.review.by))} on ${fmt(r.review.at)}</p>`:isOffice()?`<p class="noprint"><button class="btn" data-act="review" data-v="${esc(r.id)}">Supervisor: mark reviewed</button></p>`:''}</div>`}
  if(k==='insps'){const t=INSP[r.type];body=`<div class="card">${r.pass?'<p class="okbox"><b>PASSED</b></p>':`<p class="warnbox"><b>FAILED, out of service</b><br>${r.fails.map(esc).join('<br>')}</p>`}
    <dl class="kv">${t.fields.map(([f,l])=>`<dt>${esc(l)}</dt><dd>${esc(f.length&&r.f[f]?r.f[f]:'')}</dd>`).join('')}</dl>
    <h3 style="margin-top:12px">Checks</h3><table>${t.items.map((it,i)=>`<tr><td>${esc(it.split('|')[0])}<div class="small mute">${esc(it.split('|')[1])}</div></td><td><span class="pill ${r.ans['c'+i]==='y'?'ok':r.ans['c'+i]==='n'?'bad':''}">${{y:'Pass',n:'Fail',na:'N/A'}[r.ans['c'+i]]}</span></td></tr>`).join('')}</table>
    <h3 style="margin-top:12px">Photos</h3><div class="photos">${r.photos.map((p,i)=>`<div class="ph done"><img src="${img(p)}" alt="${esc(t.photos[i])}"></div>`).join('')}</div><p>${esc(r.notes||'')}</p></div>`}
  if(k==='talks')body=`<div class="card"><p class="small mute">Led by ${esc(r.leader)}</p><ol>${r.points.map(p=>`<li>${esc(p)}</li>`).join('')}</ol><h3>Notes</h3><p>${esc(r.notes||'None')}</p>
    <h3>Attendance (${r.att.length})</h3><table><tr><th>Name</th><th>Company</th><th>Signature</th></tr>${r.att.map(a=>`<tr><td>${esc(a.name)}</td><td>${esc(a.company)}</td><td><img src="${img(a.sig)}" alt="" style="width:120px;background:#fff"></td></tr>`).join('')}</table></div>`;
  if(k==='checkins')body=`<div class="card"><dl class="kv"><dt>Arrived</dt><dd>${fmt(r.inAt)}</dd><dt>Left</dt><dd>${fmt(r.outAt)||'Still on site'}</dd><dt>Distance</dt><dd>${r.dist!=null?r.dist+' m from site pin':'Site has no pin'}</dd><dt>Flag</dt><dd>${esc(r.reason||'None')}</dd><dt>Location logs</dt><dd>${(r.pings||[]).length}</dd></dl></div>`;
  if(k==='incidents')body=incBody(r);
  if(k==='policysigs')body=`<div class="card"><p>${esc(POLICY_AGREE)}</p><dl class="kv"><dt>Name</dt><dd>${esc(r.name)}</dd><dt>Role</dt><dd>${esc(r.role||'Employee')}</dd>${r.org?`<dt>School / company</dt><dd>${esc(r.org)}</dd>`:''}${r.email?`<dt>Email</dt><dd>${esc(r.email)}</dd>`:''}${r.phone?`<dt>Phone</dt><dd>${esc(r.phone)}</dd>`:''}<dt>Policy version</dt><dd>${esc(r.version)}</dd><dt>Signed</dt><dd>${fmt(r.at)}</dd></dl><h3>Signature</h3><img src="${img(r.sig)}" alt="Signature" style="max-width:280px;background:#fff">${r.minor?`<h3>Parent / guardian</h3><p>${esc(r.gName)}</p><img src="${img(r.gSig)}" alt="Guardian signature" style="max-width:280px;background:#fff">`:''}<p class="small mute">Policy issued by ${esc(POLICY_SIGNER)}</p></div>`;
  return head+body+'</div>'};
function incBody(r){
  const t=new Date(r.when||r.at);const dl=h=>new Date(t.getTime()+h*36e5);
  const deadlines={critical:[['Phone Ministry (1-877-202-0008)',0],['Written report to Ministry, JHSC/rep, union',48],['WSIB Form 7',72]],medical:[['Written notice to JHSC/rep (s.52)',96],['WSIB Form 7',72]],lost:[['Written notice to JHSC/rep (s.52)',96],['WSIB Form 7',72]],shock:[['Medical assessment',0],['Written notice to JHSC/rep (s.52)',96],['WSIB Form 7',72]],property:[['Check if s.53 notice is needed (2 days)',48]]}[r.type]||[];
  return `<div class="card"><dl class="kv"><dt>Happened</dt><dd>${fmt(r.when)}</dd>${r.supervisor?`<dt>Supervisor / foreman</dt><dd>${esc(r.supervisor)}</dd>`:''}<dt>Injured</dt><dd>${esc(r.injured||'None')}</dd><dt>Injury</dt><dd>${esc(r.body||'')}</dd><dt>First aid</dt><dd>${esc(r.firstaid||'')}</dd><dt>Witnesses</dt><dd>${esc(r.witness||'')}</dd></dl>
  <h3 style="margin-top:12px">What happened</h3><p>${esc(r.desc)}</p><h3>Made safe by</h3><p>${esc(r.immediate||'')}</p><h3>Reporter's view of cause</h3><p>${esc(r.cause||'')}</p>${r.injured?`<h3>Injured worker's statement</h3>${r.noSign?'<p class="warnbox">Injured worker could not sign at the time (taken for treatment). Get their written statement.</p>':`<p>${esc(r.stmt||'')}</p><img src="${img(r.isig)}" alt="Injured worker signature" style="max-width:280px;background:#fff"><p class="small">${esc(r.injured)} • signed ${fmtD(r.idate)}</p>`}`:''}
  ${(r.photos||[]).filter(Boolean).length?`<div class="photos">${(r.photos||[]).filter(Boolean).map(p=>`<div class="ph done"><img src="${img(p)}" alt=""></div>`).join('')}</div>`:''}</div><p></p>
  ${deadlines.length?`<div class="card"><h3>Reporting deadlines</h3>${deadlines.map(([l,h],i)=>{const done=r.steps[i];const due=h?dl(h*(h===72?1:1)):t;return `<div class="chk"><div>${esc(l)}<div class="ref">${h===72?'Due within 3 business days':h===0?'Right away':'Due '+fmt(due.toISOString())}</div></div>${done?`<span class="pill ok">Done ${fmt(done.at)}</span>`:isOffice()?`<button class="btn sm" data-act="incStep" data-k="${esc(r.id)}" data-v="${i}">Mark done</button>`:'<span class="pill warn">Office</span>'}</div>`}).join('')}</div><p></p>`:''}
  <div class="card"><h3>Investigation (COR element 10)</h3>${r.investigation?`<dl class="kv"><dt>Root cause</dt><dd>${esc(r.investigation.root)}</dd><dt>Corrective action</dt><dd>${esc(r.investigation.fix)}</dd><dt>By</dt><dd>${esc(userName(r.investigation.by))}, ${fmt(r.investigation.at)}</dd></dl>`
  :isOffice()?`<div class="noprint"><label class="f" for="iv-root">Root cause (ask "why" until you reach the system cause)</label><textarea id="iv-root"></textarea><label class="f" for="iv-fix">Corrective and preventive action</label><textarea id="iv-fix"></textarea><label class="f" for="iv-due">Action due date</label><input id="iv-due" type="date" value="${addDays(14)}"><p></p><button class="btn pri" data-act="investigate" data-v="${esc(r.id)}">Save investigation</button></div>`:'<p class="mute">The office will investigate.</p>'}</div>`}

/* ================= TRAINING ================= */
const courseName=c=>(COURSES.find(x=>x[0]===c)||[0,c])[1];
VIEWS.training=()=>{
  const people=isOffice()?S.users.filter(u=>u.active!==false):[ME];
  return `<h1>Training records</h1><p>Keep a record and certificate photo for each course. Working at Heights training must be renewed every 3 years (O. Reg. 297/13). COR element 8.1.</p>
  <button class="btn pri" data-act="addTr">Add training record</button><p></p>
  ${people.map(u=>{const tr=S.training.filter(t=>t.userId===u.id);return `<div class="card"><h3><a href="#" data-act="go" data-v="profile" data-k="${esc(u.id)}">${esc(u.name)}</a></h3>${tr.length?`<div class="list">${tr.map(t=>{const d=t.expiry?-daysSince(t.expiry):null;return `<div class="it">${(t.files&&t.files[0]&&t.files[0].type.startsWith('image'))||t.photo?`<img src="${img(t.files?.[0]?.data||t.photo)}" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:8px">`:''}<div class="m"><b>${esc(t.course==='other'&&t.label?t.label:courseName(t.course))}</b><div class="small mute">Completed ${fmtD(t.date)}${t.expiry?' • expires '+fmtD(t.expiry):''}</div></div>${d==null?'<span class="pill ok">No expiry</span>':d<0?'<span class="pill bad">Expired</span>':d<=45?'<span class="pill warn">'+dayWord(d)+'</span>':'<span class="pill ok">Current</span>'}</div>`}).join('')}</div>`:'<p class="mute">No records yet.</p>'}
  ${['wah','awareness','orient','whmis'].filter(c=>!tr.some(t=>t.course===c)).length?`<p class="small warnbox">Missing: ${['wah','awareness','orient','whmis'].filter(c=>!tr.some(t=>t.course===c)).map(courseName).join(', ')}</p>`:''}</div><p></p>`}).join('')}`};
VIEWS.profile=()=>{
  const id=V.p.id||ME.id;const u=S.users.find(x=>x.id===id);if(!u)return '<p>Profile not found.</p>';
  const can=u.id===ME.id||isAdmin();
  if(D.kind!=='prof'||D.id!==u.id)D={kind:'prof',id:u.id,name:u.name,photo:u.photo||null,address:u.address||'',phone:u.phone||'',email:u.email,title:u.trade||'',hired:u.hired||'',emerg:u.emerg||''};
  const tr=S.training.filter(t=>t.userId===u.id).sort((a,b)=>courseName(a.course).localeCompare(courseName(b.course)));
  const need=['wah','awareness','orient','whmis','firstaid','loto','ewp'].filter(c=>!tr.some(t=>t.course===c));
  return `<h1>${u.id===ME.id?'My profile':esc(u.name)}</h1>
  <div class="grid g2"><div class="card">
   <div class="row"><label class="ph ${D.photo?'done':''}" id="ph-prof" style="width:120px;flex:none;border-radius:50%">${D.photo?`<img src="${img(D.photo)}" alt="Profile photo">`:'Add profile photo'}${can?'<input type="file" accept="image/*" data-prof="1" aria-label="Profile photo">':''}</label>
   <div><b style="font-size:20px">${esc(u.name)}</b><div class="small mute">${esc(u.trade||'')} • ${esc(u.role)}</div>${u.hired?`<div class="small mute">Hired ${fmtD(u.hired)}</div>`:''}</div></div>
   ${[['name','Full name','text'],['address','Home address','text'],['phone','Cell phone','tel'],['email','Email','email'],['hired','Date hired','date'],['emerg','Emergency contact (name and phone)','text']].map(([k,l,ty])=>`<label class="f" for="p-${k}">${l}</label><input id="p-${k}" type="${ty}" data-bind="${k}" value="${esc(D[k]||'')}" ${can&&!(k==='email')?'':'readonly'}>`).join('')}
   <label class="f" for="p-title">Job title</label><select id="p-title" data-bind="title" ${isAdmin()||u.id===ME.id?'':'disabled'}>${JOBS.map(j=>`<option ${D.title===j?'selected':''}>${j}</option>`).join('')}</select>
   ${can?'<p></p><button class="btn pri block" data-act="saveProfile">Save profile</button>':''}
   <p class="small mute">Your address, phone, hire date and emergency contact are only seen by you and the office.</p></div>
  <div class="card"><h2>Certificates and documents</h2><p class="small mute">Attach a photo or PDF of every ticket and card: working at heights, lift licence, first aid, lockout, WHMIS, WSIB papers and anything else.</p>
   ${can?`<button class="btn pri" data-act="addTr" data-v="${esc(u.id)}">Attach a certificate or document</button>`:''}
   ${need.length?`<p class="warnbox small">Not on file yet: ${need.map(courseName).join(', ')}</p>`:''}
   <div class="list">${tr.map(t=>{const d=t.expiry?-daysSince(t.expiry):null;const files=t.files||(t.photo?[{name:'certificate.jpg',type:'image/jpeg',data:t.photo}]:[]);return `<div class="it">${files[0]&&files[0].type.startsWith('image')?`<img src="${img(files[0].data)}" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:8px">`:`<span class="pill">${files.length?'PDF':'No file'}</span>`}<div class="m"><b>${esc(t.course==='other'&&t.label?t.label:courseName(t.course))}</b><div class="small mute">${t.number?'No. '+esc(t.number)+' • ':''}${t.date?'Issued '+fmtD(t.date):''}${t.expiry?' • expires '+fmtD(t.expiry):''}</div>
    <div class="row" style="margin-top:6px">${files.map((f,i)=>`<button class="btn sm" data-act="openFile" data-v="${t.id}:${i}">Open ${esc(f.name.slice(0,24))}</button>`).join('')}${can?`<button class="btn sm" data-act="delTr" data-v="${esc(t.id)}">Delete</button>`:''}</div></div>
    ${d==null?'<span class="pill ok">On file</span>':d<0?'<span class="pill bad">Expired</span>':d<=45?'<span class="pill warn">'+dayWord(d)+'</span>':'<span class="pill ok">Current</span>'}</div>`}).join('')||'<p class="mute">Nothing attached yet.</p>'}</div></div></div>`};
async function saveProfile(){
  const u=S.users.find(x=>x.id===D.id);if(!D.name.trim())return toast('Name is required.');
  Object.assign(u,{name:D.name.trim(),photo:D.photo,address:D.address.trim(),phone:D.phone.trim(),hired:D.hired,emerg:D.emerg.trim(),trade:D.title,updated:now()});
  save('users');if(u.id===ME.id)ME=u;toast('Profile saved.');render()}
function readFile(f){return new Promise(res=>{if(f.type.startsWith('image/'))return compress(f).then(d=>res(d&&{name:f.name,type:'image/jpeg',data:d}));if(f.size>8e6){toast('That file is over 8 MB. Take a photo of it instead.');return res(null)}const r=new FileReader();r.onload=()=>res({name:f.name,type:f.type||'application/pdf',data:r.result});r.onerror=()=>res(null);r.readAsDataURL(f)})}
async function openWith(name,dataUrl){const P=window.Capacitor.Plugins;const mime=(dataUrl.match(/^data:([^;,]+)/)||[])[1]||'application/octet-stream';const r=await P.Filesystem.writeFile({path:name.replace(/[^\w.\-]+/g,'_'),data:dataUrl.split(',')[1],directory:'CACHE'});
  try{await P.FileOpener.open({filePath:r.uri,contentType:mime,openWithDefault:false})}catch(e){await P.Share.share({title:name,url:r.uri,dialogTitle:'Open '+name})}}
function loadScript(src){return new Promise((res,rej)=>{if(document.querySelector('script[data-src="'+src+'"]'))return res();const sc=document.createElement('script');sc.src=src;sc.dataset.src=src;sc.onload=res;sc.onerror=rej;document.head.appendChild(sc)})}
async function savePDF(el,name){
  toast('Making the PDF…');
  try{await loadScript('html2canvas.js');await loadScript('jspdf.js')}catch(e){return toast('Could not load the PDF maker. Check your connection.')}
  document.body.classList.add('pdfmode');
  try{const c=await html2canvas(el,{scale:1.6,backgroundColor:'#ffffff',useCORS:true});
    const pdf=new window.jspdf.jsPDF({unit:'pt',format:'letter'});const W=pdf.internal.pageSize.getWidth()-48,H=pdf.internal.pageSize.getHeight()-48;
    const pxPerPt=c.width/W,pageH=Math.floor(H*pxPerPt);
    for(let y=0,p=0;y<c.height;y+=pageH,p++){if(p&&c.height-y<30)break;const sl=document.createElement('canvas');sl.width=c.width;sl.height=Math.min(pageH,c.height-y);sl.getContext('2d').drawImage(c,0,y,c.width,sl.height,0,0,c.width,sl.height);if(p)pdf.addPage();pdf.addImage(sl.toDataURL('image/jpeg',.85),'JPEG',24,24,W,sl.height/pxPerPt)}
    const uri=pdf.output('datauristring').replace(/;filename=[^;]*;/,';');
    if(NATIVE)await openWith(name,uri);else pdf.save(name)}
  catch(e){toast('Could not make the PDF.')}finally{document.body.classList.remove('pdfmode')}}
async function nativeShare(name,dataUrl){const P=window.Capacitor.Plugins;const b64=dataUrl.split(',')[1];const r=await P.Filesystem.writeFile({path:name.replace(/[^\w.\-]+/g,'_'),data:b64,directory:'CACHE'});await P.Share.share({title:name,url:r.uri,dialogTitle:'Open or save '+name})}
function openFile(key){const [id,i]=key.split(':');const t=S.training.find(x=>x.id===id);const files=t.files||[{name:'certificate.jpg',type:'image/jpeg',data:t.photo}];const f=files[+i];if(!f)return;
  if(NATIVE){openWith(f.name,f.data).catch(()=>toast('Could not open the file.'));return}
  try{const b=atob(f.data.split(',')[1]);const u8=new Uint8Array(b.length);for(let j=0;j<b.length;j++)u8[j]=b.charCodeAt(j);const url=URL.createObjectURL(new Blob([u8],{type:f.type}));const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove()}catch(e){toast('Could not open the file here.')}}
function addTraining(forUser){
  const target=forUser||ME.id;
  const m=document.createElement('div');m.className='modal';let files=[];
  m.innerHTML=`<div class="card"><h3>Attach a certificate or document</h3>${isAdmin()&&!forUser?`<label class="f" for="tr-u">Worker</label><select id="tr-u">${S.users.map(u=>`<option value="${u.id}" ${u.id===ME.id?'selected':''}>${esc(u.name)}</option>`).join('')}</select>`:`<p class="small mute">For ${esc(userName(target))}</p>`}
  <label class="f" for="tr-c">Type</label><select id="tr-c">${COURSES.map(c=>`<option value="${c[0]}">${esc(c[1])}</option>`).join('')}</select>
  <div id="tr-lw" style="display:none"><label class="f" for="tr-l">Name of certificate or document</label><input id="tr-l"></div>
  <label class="f" for="tr-n">Certificate or card number (optional)</label><input id="tr-n">
  <label class="f" for="tr-d">Date issued / completed</label><input id="tr-d" type="date" value="${today()}"><label class="f" for="tr-e">Expiry date (filled in for you where known; change it to match the card)</label><input id="tr-e" type="date">
  <label class="f" for="tr-p">Photo or PDF (front and back if needed)</label><input id="tr-p" type="file" accept="image/*,application/pdf" multiple>
  <p class="small mute" id="tr-fc">No file yet</p>
  <div class="row" style="margin-top:12px"><button class="btn pri" id="tr-ok">Save</button><button class="btn" id="tr-x">Cancel</button></div></div>`;
  document.body.appendChild(m);
  const setE=()=>{const c=COURSES.find(x=>x[0]===m.querySelector('#tr-c').value);const d=m.querySelector('#tr-d').value;m.querySelector('#tr-e').value=c[2]&&d?addMonths(d,c[2]):'';m.querySelector('#tr-lw').style.display=c[0]==='other'?'':'none'};
  m.querySelector('#tr-c').onchange=setE;m.querySelector('#tr-d').onchange=setE;setE();
  m.querySelector('#tr-p').onchange=async e=>{m.querySelector('#tr-fc').textContent='Reading…';for(const f of e.target.files){const r=await readFile(f);if(r)files.push(r)}m.querySelector('#tr-fc').textContent=files.length+' file(s) ready'};
  m.querySelector('#tr-x').onclick=()=>m.remove();
  m.querySelector('#tr-ok').onclick=()=>{const course=m.querySelector('#tr-c').value,label=m.querySelector('#tr-l').value.trim();if(course==='other'&&!label)return toast('Name the document.');if(!files.length&&!(await_ok()))return;
    S.training.push({id:uid(),userId:isAdmin()&&!forUser?m.querySelector('#tr-u').value:target,course,label,number:m.querySelector('#tr-n').value.trim(),date:m.querySelector('#tr-d').value,expiry:m.querySelector('#tr-e').value||null,files,at:now(),by:ME.id});save('training');m.remove();toast('Saved to the profile.');render()};
  function await_ok(){toast('Attach a photo or PDF of the certificate.');return false}
}
/* ================= COR READINESS ================= */
function since(arr,days,f){return arr.filter(r=>daysSince(r.at||r.inAt)<=days&&(!f||f(r)))}
function evidence(ev){
  const act=S.sites.filter(s=>s.active!==false);
  const E={
    policy:[],legis:[],none:[],
    rules:[['Every active worker has signed the company policy',S.users.filter(u=>u.active!==false).every(u=>S.policysigs.some(p=>p.userId===u.id))]],
    flha:[['Daily hazard assessments in the last 30 days',since(S.dailies,30).length>0],['A daily check for every day worked on site (last 30 days)',since(S.checkins,30).every(c=>S.dailies.some(d=>d.checkinId===c.id))],['Hazards rated before and after controls',S.dailies.some(d=>Object.keys(d.hz||{}).length)]],
    controls:[['Lockout kit inspected in the last 90 days',since(S.insps,90,r=>r.type==='loto').length>0],['Rubber gloves / arc PPE inspected in the last 30 days',since(S.insps,30,r=>r.type==='gloves').length>0]],
    ppe:[['PPE checked on daily checks in the last 30 days',since(S.dailies,30).length>0]],
    equip:[['Equipment list started',S.equip.length>0],['No out-of-service item without a corrective action',S.equip.filter(q=>q.status==='out').every(q=>S.actions.some(a=>a.src==='insp'&&a.desc.includes(q.serial)))]],
    training:[['Every worker has orientation on file',S.users.filter(u=>u.active!==false).every(u=>S.training.some(t=>t.userId===u.id&&t.course==='orient'))],['Every worker has current Working at Heights training',S.users.filter(u=>u.active!==false&&u.trade!=='Office').every(u=>S.training.some(t=>t.userId===u.id&&t.course==='wah'&&(!t.expiry||t.expiry>=today())))],['Toolbox talk in the last 7 days',since(S.talks,7).length>0]],
    insp:[['Equipment inspections in the last 30 days',since(S.insps,30).length>0],['Every failed inspection has a corrective action',S.insps.filter(r=>!r.pass).every(r=>S.actions.some(a=>a.ref===r.id))]],
    inc:[['Every incident investigated',S.incidents.every(r=>r.investigation)],['Corrective actions closed on time',S.actions.every(a=>a.status==='closed'||!a.due||a.due>=today())]],
    emerg:[['Every active site has an emergency plan',act.length>0&&act.every(s=>s.hospital&&s.muster)],['Fire extinguisher inspected in the last 31 days',since(S.insps,31,r=>r.type==='extinguisher').length>0],['First aid kit inspected in the last 92 days',since(S.insps,92,r=>r.type==='firstaid').length>0]],
    stats:[['At least 30 days of records',S.checkins.length>0&&daysSince(S.checkins.map(c=>c.inAt).sort()[0])>=30]]
  };return E[ev]||[]}
function corScore(e){const docs=S.cordocs[e.n]||{};const dd=e.docs.filter((_,i)=>docs[i]).length/e.docs.length;const ev=evidence(e.ev);const ee=ev.length?ev.filter(x=>x[1]).length/ev.length:dd;return Math.round((dd*.6+ee*.4)*100)}
VIEWS.cor=()=>{
  if(!canCor())return `<h1>COR readiness</h1><p class="mute">Only the office admin and HR can see this.</p>`;
  const tot=COR.reduce((a,e)=>a+e.pts,0),score=Math.round(COR.reduce((a,e)=>a+corScore(e)*e.pts,0)/tot);
  return `<h1>COR 2020 readiness</h1><div class="card"><div class="big">${score}%</div><div class="bar"><i style="width:${score}%"></i></div>
  <p class="small mute">An estimate to guide your work, not an IHSA score. In Ontario, COR is granted only by IHSA after IHSA training, an internal audit and an external audit. To pass, you need at least 80% overall and at least 50% in each element.</p></div><p></p>
  ${COR.map(e=>{const s=corScore(e),docs=S.cordocs[e.n]||{},ev=evidence(e.ev);return `<details class="card" style="margin-bottom:10px"><summary style="cursor:pointer;list-style:none"><div class="row"><b style="flex:1">${e.n}. ${esc(e.name)}</b><span class="pill ${s>=80?'ok':s>=50?'warn':'bad'}">${s}%</span></div><div class="bar" style="margin-top:8px"><i style="width:${s}%"></i></div></summary>
  <h3 style="margin-top:12px">Program documents</h3>${e.docs.map((d,i)=>`<div class="chk"><div>${esc(d)}${docs[i]?`<div class="ref">Done ${fmtD(docs[i].d)} by ${esc(userName(docs[i].by))}</div>`:''}</div>${isAdmin()?`<button class="btn sm ${docs[i]?'':'pri'}" data-act="cordoc" data-k="${e.n}" data-v="${i}">${docs[i]?'Undo':'Mark done'}</button>`:`<span class="pill ${docs[i]?'ok':'bad'}">${docs[i]?'Done':'To do'}</span>`}</div>`).join('')}
  ${ev.length?`<h3 style="margin-top:12px">Evidence from the app</h3>${ev.map(([l,ok])=>`<div class="chk"><div>${esc(l)}</div><span class="pill ${ok?'ok':'bad'}">${ok?'Yes':'Not yet'}</span></div>`).join('')}`:''}</details>`}).join('')}
  <div class="infobox small">Next steps for 20 Vision: register with IHSA for COR, complete the prescribed training for a senior manager and one full-time employee, run the program for the period IHSA recommends (about 12 months), then submit the internal audit. Contact: cor@ihsa.ca.</div>`};

/* ================= ACTIONS ================= */
VIEWS.actions=()=>{const list=S.actions.filter(a=>isOffice()||a.assignee===ME.id||a.by===ME.id).sort((a,b)=>(a.status==='closed')-(b.status==='closed')||a.at.localeCompare(b.at));
  return `<h1>Corrective actions</h1><p>Every failed check, inspection and incident creates one. Close it when fixed (COR elements 9 and 10).</p>
  <div class="card">${list.length?`<div class="list">${list.map(a=>`<div class="it"><span class="pill ${a.status==='closed'?'ok':a.due&&a.due<today()?'bad':'warn'}">${a.status==='closed'?'Closed':a.due&&a.due<today()?'Overdue':'Open'}</span><div class="m"><b>${esc(a.desc)}</b><div class="small mute">${esc(siteName(a.siteId))} • due ${fmtD(a.due)}${a.assignee?' • '+esc(userName(a.assignee)):''}${a.closeNote?' • fixed: '+esc(a.closeNote):''}</div></div>${a.status!=='closed'&&isOffice()?`<button class="btn sm" data-act="closeAct" data-v="${esc(a.id)}">Close</button>`:''}</div>`).join('')}</div>`:'<p class="mute">No corrective actions.</p>'}</div>`};

/* ================= EMERGENCY ================= */
VIEWS.emerg=()=>{const ci=activeCheckin();const list=ci?S.sites.filter(s=>s.id===ci.siteId):S.sites;
  return `<h1>Emergency information</h1><div class="warnbox"><b>Call 911</b> for any emergency. Ministry of Labour, Immigration, Training and Skills Development Health and Safety Contact Centre: <b>1-877-202-0008</b> (24/7). WSIB: <b>1-800-387-0750</b>. Spills Action Centre: <b>1-800-268-6060</b>.</div><p></p>
  ${list.map(s=>`<div class="card"><h2>${esc(s.name)}</h2><dl class="kv"><dt>Address</dt><dd>${esc(s.address||'')}</dd><dt>Nearest hospital</dt><dd>${esc(s.hospital||'Not set')}</dd><dt>Muster point</dt><dd>${esc(s.muster||'Not set')}</dd><dt>First aider</dt><dd>${esc(s.firstaider||'Not set')}</dd><dt>First aid kit</dt><dd>${esc(s.kit||'Not set')}</dd><dt>Extinguishers</dt><dd>${esc(s.ext||'Not set')}</dd><dt>Site contact</dt><dd>${esc(s.contact||'')}</dd></dl></div><p></p>`).join('')||'<p class="mute">No sites yet.</p>'}`};

/* ================= SOCIALS + UPDATES ================= */
let socCat='All';
VIEWS.socials=()=>{const cats=['All',...new Set(SOCIALS.map(s=>s.cat))];
  return `<h1>Safety Socials</h1><p>Safe ways to work, and what not to do. Share them with the crew.</p>
  <div class="chips">${cats.map(c=>`<button class="chip ${socCat===c?'on':''}" data-act="soccat" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div><p></p>
  <div class="grid g2">${SOCIALS.filter(s=>socCat==='All'||s.cat===socCat).map(s=>`<div class="card"><span class="pill">${esc(s.cat)}</span><h2 style="margin-top:8px">${esc(s.title)}</h2>
  <div class="okbox"><b>Do</b><ul>${s.do.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><p></p><div class="warnbox"><b>Don't</b><ul>${s.dont.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div><p></p>
  ${s.url?`<a class="btn sm" href="${esc(s.url)}" target="_blank" rel="noopener">Watch: ${esc(s.vt||'video')}</a>`:`<a class="btn sm" href="https://www.youtube.com/results?search_query=${encodeURIComponent(s.q)}" target="_blank" rel="noopener">Find videos on YouTube</a>`}</div>`).join('')}</div>
  <p class="small mute">Video picks are checked and approved every week before they are added.</p>`};
VIEWS.updates=()=>`<h1>Safety updates</h1><p>Ontario rules and safety news for the electrical trade, added by the weekly safety research agent.</p>
  ${UPDATES.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(u=>`<div class="card" style="margin-bottom:12px"><p class="small mute">${fmtD(u.date)} • ${esc(u.src)}</p><h3>${esc(u.title)}</h3><p>${esc(u.body)}</p><a href="${esc(u.url)}" target="_blank" rel="noopener">Source</a></div>`).join('')}`;

/* ================= COMPANY POLICY ================= */
const LIVE_URL='https://20visionelectric.github.io/crew-connect/safety/';
const mySig=()=>ME&&S.policysigs.filter(p=>p.userId===ME.id&&p.version===POLICY_VERSION).sort((a,b)=>b.at.localeCompare(a.at))[0];
function policyBody(){return `<p class="row noprint">${NATIVE?'<button class="btn sm" data-act="policyPdf">Open the original PDF</button>':'<a class="btn sm" href="policy.pdf" target="_blank" rel="noopener">Open the original PDF</a>'}</p>
  ${POLICY.map((p,i)=>`<details class="card" style="margin-bottom:10px" ${i===0?'open':''}><summary style="cursor:pointer"><b style="font-size:18px">${i+1}. ${esc(p.t)}</b></summary><div style="margin-top:10px">${p.b.map(x=>Array.isArray(x)?`<ul>${x.map(li=>`<li style="margin-bottom:6px">${esc(li)}</li>`).join('')}</ul>`:`<p>${esc(x)}</p>`).join('')}<p class="small mute">${esc(POLICY_SIGNER)}</p></div></details>`).join('')}`}
function signBlock(guest){
  if(D.kind!=='pol')D={kind:'pol',name:guest?'':ME.name,email:guest?'':ME.email,phone:guest?'':(ME.phone||''),role:'Employee',org:'',minor:false,gName:'',read:false};
  return `<div class="card" id="signbox"><h2>Sign the company policy</h2><p class="infobox">${esc(POLICY_AGREE)}</p>
  <label class="row" style="margin:12px 0"><input type="checkbox" id="pol-read" style="width:26px;min-height:26px" ${D.read?'checked':''}> <span>I have read the whole company policy, code of conduct, employee responsibilities and PPE rules.</span></label>
  <label class="f" for="pol-name">Print name</label><input id="pol-name" data-bind="name" value="${esc(D.name)}" autocomplete="name">
  ${guest?`<label class="f" for="pol-email">Email</label><input id="pol-email" type="email" data-bind="email" value="${esc(D.email)}" autocomplete="email">
  <label class="f" for="pol-phone">Phone</label><input id="pol-phone" type="tel" data-bind="phone" value="${esc(D.phone)}" autocomplete="tel">
  <label class="f" for="pol-role">I am</label><select id="pol-role" data-bind="role">${['Employee','Co-op student','Apprentice','Subcontractor','Visitor'].map(r=>`<option ${D.role===r?'selected':''}>${r}</option>`).join('')}</select>
  <label class="f" for="pol-org">School or company (if co-op, subcontractor or visitor)</label><input id="pol-org" data-bind="org" value="${esc(D.org)}">`:''}
  <label class="f">Signature</label><canvas class="sig" data-sig="psig"></canvas><button class="btn sm" data-act="clearsig" data-v="psig">Clear</button>
  <p class="small mute">Date: ${fmtD(today())}</p>
  <label class="row" style="margin:12px 0"><input type="checkbox" id="pol-minor" style="width:26px;min-height:26px" ${D.minor?'checked':''}> <span>I am under 18 years old (a parent or guardian must also sign)</span></label>
  <div id="pol-g" style="display:${D.minor?'':'none'}"><label class="f" for="pol-gname">Parent / guardian print name</label><input id="pol-gname" data-bind="gName" value="${esc(D.gName)}"><label class="f">Parent / guardian signature</label><canvas class="sig" data-sig="gsig"></canvas><button class="btn sm" data-act="clearsig" data-v="gsig">Clear</button></div>
  <p></p><button class="btn pri block" data-act="signPolicy" data-v="${guest?1:0}">Sign and submit</button></div>`}
VIEWS.policy=()=>{const m=mySig();
  return `<h1>Company policy</h1><p class="mute">20 Vision Electric Inc. • version ${esc(POLICY_VERSION)} • read every section, then sign at the bottom.</p>
  ${m?`<p class="okbox"><b>You signed this policy on ${fmt(m.at)}</b></p>`:'<p class="warnbox"><b>Not signed yet.</b> Read the policy and sign at the bottom.</p>'}
  ${policyBody()}${m?'':signBlock(false)}`};
function guestPolicyView(){
  if(D.done)return `<div class="authwrap"><div class="hero"><div class="stripe"></div><div class="in"><h1>Thank you, ${esc(D.done)}</h1><p class="okbox">Your signed company policy was sent to 20 Vision Electric.</p><p>Hand the phone back to your supervisor.</p></div></div></div>`;
  return `<header class="top"><div class="logo">20 VISION <b>ELECTRIC</b></div></header><main><h1>Company policy sign-off</h1><p>For new employees, co-op students, subcontractors and visitors. Read each section, then sign at the bottom.</p><p class="warnbox small">Nobody under 16 may be on a construction project in Ontario.</p>${policyBody()}${signBlock(true)}</main>`}
async function signPolicy(t){
  const guest=t.dataset.v==='1';
  D.read=$('#pol-read').checked;D.minor=$('#pol-minor').checked;
  if(!D.read)return toast('Tick the box to confirm you read the whole policy.');
  if(!D.name.trim())return toast('Print your name.');
  if(guest&&!D.email.trim()&&!D.phone.trim())return toast('Add an email or phone number.');
  if(!D.psig)return toast('Sign in the signature box.');
  if(D.minor&&(!D.gName.trim()||!D.gsig))return toast('A parent or guardian must print their name and sign.');
  const rec={id:uid(),userId:guest?null:ME.id,name:D.name.trim(),email:(D.email||'').trim(),phone:(D.phone||'').trim(),role:guest?D.role:(ME.trade||'Employee'),org:(D.org||'').trim(),minor:D.minor,gName:D.minor?D.gName.trim():'',gSig:D.minor?D.gsig:'',sig:D.psig,at:now(),version:POLICY_VERSION,guest};
  t.disabled=true;
  if(guest){
    if(CLOUD.on){try{await CLOUD.guestSign(rec)}catch(e){t.disabled=false;return toast('Could not send. Check the internet connection and try again.')}}
    else{S.policysigs.push(rec);save('policysigs')}
    D={done:rec.name};render();return}
  S.policysigs.push(rec);save('policysigs');D={};toast('Policy signed. Thank you.');render();window.scrollTo(0,0)}
VIEWS.policyadmin=()=>{
  const sigs=S.policysigs.slice().sort((a,b)=>b.at.localeCompare(a.at));
  const missing=S.users.filter(u=>u.active!==false&&!S.policysigs.some(p=>p.userId===u.id&&p.version===POLICY_VERSION));
  setTimeout(drawQR,0);
  return `<h1>Policy sign-offs</h1><div class="grid g2"><div class="card" style="text-align:center"><h2>Scan to sign</h2><p>Show this to a new employee or co-op student. They scan it with their phone camera, read the policy and sign. No account needed.</p>
   <div id="qr" style="display:inline-block;background:#fff;padding:14px;border-radius:12px;min-width:250px;min-height:250px"></div>
   <p class="small" style="overflow-wrap:anywhere">${esc(LIVE_URL)}#sign-policy</p>
   <button class="btn sm" data-act="copyLink">Copy link</button></div>
  <div class="card"><h2>Not signed yet (${missing.length})</h2>${missing.length?`<div class="list">${missing.map(u=>`<div class="it"><div class="m"><b>${esc(u.name)}</b><div class="small mute">${esc(u.trade||'')}</div></div><span class="pill bad">Not signed</span></div>`).join('')}</div>`:'<p class="okbox">Everyone with an account has signed this version.</p>'}</div></div><p></p>
  <div class="card"><h2>Signed (${sigs.length})</h2>${sigs.length?`<div class="list">${sigs.map(p=>`<div class="it" data-act="openRec" data-k="policysigs" data-v="${esc(p.id)}"><img src="${img(p.sig)}" alt="" style="width:90px;height:40px;object-fit:contain;background:#fff;border-radius:6px"><div class="m"><b>${esc(p.name)}</b><div class="small mute">${esc(p.role||'')}${p.org?' • '+esc(p.org):''} • ${fmt(p.at)}${p.minor?' • under 18, guardian signed':''}</div></div><span class="pill ${p.guest?'warn':'ok'}">${p.guest?'QR':'App'}</span></div>`).join('')}</div>`:'<p class="mute">No signatures yet.</p>'}</div>`};
function drawQR(){const el=$('#qr');if(!el)return;
  try{const q=qrcode(0,'M');q.addData(LIVE_URL+'#sign-policy');q.make();el.innerHTML=q.createSvgTag({cellSize:6,margin:2,scalable:true});const sv=el.querySelector('svg');if(sv){sv.style.width='240px';sv.style.height='240px'}}
  catch(e){el.innerHTML='<p class="small" style="color:#111">QR code could not load. Use the link below.</p>'}}

/* ================= MORE / ADMIN ================= */
VIEWS.more=()=>`<h1>More</h1><div class="tiles">
  <button class="tile" data-act="go" data-v="profile"><b>My profile</b><span>Details and documents</span></button>
  <button class="tile" data-act="go" data-v="training"><b>Training</b><span>Certificates</span></button>
  ${canCor()?`<button class="tile" data-act="go" data-v="cor"><b>COR readiness</b><span>14 elements</span></button>`:''}
  <button class="tile" data-act="go" data-v="actions"><b>Corrective actions</b><span>Open items</span></button>
  <button class="tile" data-act="go" data-v="emerg"><b>Emergency info</b><span>Per site</span></button>
  <button class="tile" data-act="go" data-v="socials"><b>Safety Socials</b><span>Do's / Don'ts</span></button>
  <button class="tile" data-act="go" data-v="updates"><b>Safety updates</b><span>Weekly</span></button>
  ${isOffice()?`<button class="tile" data-act="go" data-v="policyadmin"><b>Policy sign-offs</b><span>QR code and signatures</span></button>
  <button class="tile" data-act="go" data-v="sites"><b>Job sites</b><span>Location and emergency plan</span></button>
  <button class="tile" data-act="go" data-v="crew"><b>Crew</b><span>Accounts and roles</span></button>
  ${isAdmin()?`<button class="tile" data-act="go" data-v="cleanup"><b>Clean up test data</b><span>Delete test workers and records</span></button>`:''}
  <button class="tile" data-act="go" data-v="equiplist"><b>Equipment list</b><span>COR element 7</span></button>
  <button class="tile" data-act="go" data-v="exportv"><b>Export / backup</b><span>For audits</span></button>`:''}
  <button class="tile" data-act="signout"><b>Sign out</b><span>${esc(ME.email)}</span></button></div>`;
VIEWS.sites=()=>`<h1>Job sites</h1><p>Set each site's location pin and emergency plan (O. Reg. 213/91 s.17; COR element 11).</p>
  <button class="btn pri" data-act="editSite" data-v="">Add a site</button><p></p>
  ${S.sites.map(s=>`<div class="card" style="margin-bottom:10px"><div class="row"><div style="flex:1"><b>${esc(s.name)}</b><div class="small mute">${esc(s.address||'')} • ${s.lat!=null?'Pin set, '+(s.radius||300)+' m radius':'No location pin'}${s.active===false?' • closed':''}</div></div><button class="btn sm" data-act="editSite" data-v="${esc(s.id)}">Edit</button></div></div>`).join('')}`;
VIEWS.siteedit=()=>{const s=D;return `<h1>${s.id?'Edit site':'New site'}</h1><div class="card">
  ${[['name','Site name'],['address','Address'],['contact','Site contact / GC super and phone'],['hospital','Nearest hospital and address'],['muster','Muster point'],['firstaider','First aider(s) on site'],['kit','First aid kit location'],['ext','Fire extinguisher locations']].map(([k,l])=>`<label class="f" for="s-${k}">${l}</label><input id="s-${k}" data-bind="${k}" value="${esc(s[k]||'')}">`).join('')}
  <label class="f" for="s-lat">Latitude</label><input id="s-lat" data-bind="lat" inputmode="decimal" value="${esc(s.lat??'')}"><label class="f" for="s-lng">Longitude</label><input id="s-lng" data-bind="lng" inputmode="decimal" value="${esc(s.lng??'')}">
  <button class="btn sm" data-act="siteHere" style="margin-top:8px">Use my location now</button>
  <label class="f" for="s-rad">On-site radius (metres)</label><input id="s-rad" data-bind="radius" inputmode="numeric" value="${+s.radius||300}">
  <label class="f" for="s-act">Status</label><select id="s-act" data-bind="activeS"><option value="1" ${s.active!==false?'selected':''}>Active</option><option value="0" ${s.active===false?'selected':''}>Closed</option></select>
  <p></p><div class="row"><button class="btn pri" data-act="saveSite">Save site</button><button class="btn" data-act="go" data-v="sites">Cancel</button></div></div>`};
VIEWS.crew=()=>`<h1>Crew</h1><p>Each worker creates their own account on the app. Set roles here.</p><div class="card scroll"><table><tr><th>Name</th><th>Trade</th><th>Role</th><th>Status</th></tr>
  ${S.users.map(u=>`<tr><td><a href="#" data-act="go" data-v="profile" data-k="${esc(u.id)}"><b>${esc(u.name)}</b></a><div class="small mute">${esc(u.email)} ${esc(u.phone||'')}</div></td><td>${esc(u.trade)}</td><td>${isAdmin()&&u.id!==ME.id?`<select data-act-change="role" data-v="${esc(u.id)}"><option ${u.role==='worker'?'selected':''}>worker</option><option ${u.role==='supervisor'?'selected':''}>supervisor</option><option value="hr" ${u.role==='hr'?'selected':''}>HR</option><option ${u.role==='admin'?'selected':''}>admin</option></select>`:esc(u.role)}</td><td>${isAdmin()&&u.id!==ME.id?`<button class="btn sm" data-act="toggleUser" data-v="${esc(u.id)}">${u.active===false?'Turn on':'Turn off'}</button>`:(u.active===false?'Off':'Active')}</td></tr>`).join('')}</table></div>`;
VIEWS.equiplist=()=>`<h1>Equipment list</h1><p>Every tool, lift, ladder and harness inspected through the app (COR element 7).</p><div class="card scroll"><table><tr><th>Item</th><th>Serial</th><th>Status</th><th>Last inspection</th><th>Dates</th></tr>
  ${S.equip.map(q=>`<tr><td>${esc(INSP[q.type]?.name||q.type)}</td><td>${esc(q.serial)}</td><td><span class="pill ${q.status==='out'?'bad':'ok'}">${q.status==='out'?'Out of service':'In service'}</span></td><td>${fmt(q.lastInsp)}</td><td class="small">${['expiry','annual','tag','test','cal','card'].filter(k=>q.fields?.[k]).map(k=>k+': '+q.fields[k]).join('<br>')}</td></tr>`).join('')||'<tr><td colspan="5" class="mute">Nothing inspected yet.</td></tr>'}</table></div>`;
VIEWS.exportv=()=>`<h1>Export and backup</h1><p>Download records for an IHSA auditor, the Ministry, or your files. Records must be kept at least one year after a project ends (O. Reg. 213/91 s.19).</p>
  <div class="row"><button class="btn pri" data-act="exp" data-v="json">Full backup (JSON)</button>${Object.entries(KIND).map(([k,v])=>`<button class="btn" data-act="exp" data-v="${k}">${esc(v[0])}s (CSV)</button>`).join('')}</div>
  <p></p><label class="btn" for="imp">Restore a backup<input id="imp" type="file" accept=".json,application/json" style="display:none"></label>
  <p class="small mute">Photos and signatures are included in the full backup.</p>`;

/* ================= signature pad ================= */
function sigPad(cv,onEnd){const r=window.devicePixelRatio||1;const w=cv.clientWidth||300,h=cv.clientHeight||160;cv.width=w*r;cv.height=h*r;const x=cv.getContext('2d');x.scale(r,r);x.lineWidth=2.4;x.lineCap='round';x.strokeStyle='#111';let down=false,dirty=false;
  const p=e=>{const b=cv.getBoundingClientRect();return [e.clientX-b.left,e.clientY-b.top]};
  cv.onpointerdown=e=>{down=true;cv.setPointerCapture(e.pointerId);x.beginPath();x.moveTo(...p(e))};
  cv.onpointermove=e=>{if(!down)return;x.lineTo(...p(e));x.stroke();dirty=true};
  cv.onpointerup=cv.onpointercancel=()=>{if(down&&dirty)onEnd(cv.toDataURL('image/png'));down=false};
  return {clear(){x.clearRect(0,0,w,h);dirty=false;onEnd(null)},dirty:()=>dirty,data:()=>cv.toDataURL('image/png')}}
const PADS={};
function bindSig(){document.querySelectorAll('canvas.sig[data-sig]').forEach(cv=>{PADS[cv.dataset.sig]=sigPad(cv,d=>{D[cv.dataset.sig]=d})})}

/* ================= events ================= */
function setPath(o,path,v){const ks=path.split('.');let c=o;for(let i=0;i<ks.length-1;i++){c[ks[i]]=c[ks[i]]||{};c=c[ks[i]]}c[ks.at(-1)]=v}
document.addEventListener('input',e=>{const b=e.target.dataset?.bind;if(b)setPath(D,b,e.target.value);const id=e.target.id;if(id==='n-sup-o')D.supervisor=e.target.value.trim();if(id==='n-inj-o'){D.injured=e.target.value.trim();const st=$('#inj-st');if(st&&D.injured&&st.style.display==='none'){st.style.display='';PADS.isig=sigPad(st.querySelector('canvas.sig'),d=>{D.isig=d})}}});
document.addEventListener('change',async e=>{
  const t=e.target;
  if(t.dataset?.bind)setPath(D,t.dataset.bind,t.value);
  if(t.dataset?.photo!=null){const f=t.files[0];if(!f)return;const i=+t.dataset.photo;toast('Saving photo…');const d=await compress(f);if(!d)return toast('Could not read that photo.');D.photos[i]=d;const ph=$('#ph-'+i);if(ph){ph.classList.add('done');const im=ph.querySelector('img')||document.createElement('img');im.src=d;im.alt='';if(!im.parentNode){ph.firstChild?.nodeType===3&&ph.firstChild.remove();ph.prepend(im)}}}
  if(t.dataset?.prof){const f=t.files[0];if(!f)return;const d=await compress(f);if(!d)return toast('Could not read that photo.');D.photo=d;const ph=$('#ph-prof');ph.classList.add('done');ph.querySelector('img')?.remove();if(ph.firstChild?.nodeType===3)ph.firstChild.remove();const im=document.createElement('img');im.src=d;im.alt='Profile photo';ph.prepend(im);toast('Photo added. Tap Save profile.')}
  const a=t.dataset?.actChange;
  if(a==='pickEquip'){const q=S.equip.find(x=>x.id===t.value);D.equipId=t.value||null;if(q)D.f={...(q.fields||{}),serial:q.serial};render()}
  if(a==='recsite'){recSite=t.value;render()}
  if(a==='incPick'){const k=t.dataset.k,f=k==='sup'?'supervisor':'injured',pf=k==='sup'?'supPick':'injuredPick';D[pf]=t.value;const o=$('#n-'+k+'-o');o.style.display=t.value==='other'?'':'none';D[f]=t.value==='other'?o.value.trim():t.value?userName(t.value):'';if(t.value==='other')o.focus();if(k==='inj'){const b=$('#inj-st');if(b){const was=b.style.display;b.style.display=D[f]||t.value==='other'?'':'none';if(was==='none'&&b.style.display===''){const cv=b.querySelector('canvas.sig');PADS.isig=sigPad(cv,d=>{D.isig=d})}}}}
  if(a==='showpw'){for(const i of document.querySelectorAll('#a-pin,#a-pin2'))i.type=t.checked?'text':'password'}
  if(a==='role'){const u=S.users.find(x=>x.id===t.dataset.v);u.role=t.value;save('users');toast('Role updated.')}
  if(t.id==='imp'){const f=t.files[0];if(!f)return;try{const j=JSON.parse(await f.text());if(!Array.isArray(j.users)||!j.users.length)throw 0;for(const k of KEYS)if(j[k]!==undefined&&k!=='cordocs'&&k!=='meta'&&!Array.isArray(j[k]))throw 0;if(!await ask('Restore backup?','This replaces all records on this device with the backup.','Restore',true))return;for(const k of KEYS)if(j[k]!==undefined){S[k]=j[k];save(k)}ME=S.users.find(u=>u.id===ME.id&&u.active!==false)||null;if(!ME){try{localStorage.removeItem(SESSION_KEY)}catch(e){}}toast('Backup restored.');t.value='';render()}catch(err){toast('That file is not a Site Safety backup.')}}
});
document.addEventListener('change',e=>{if(e.target.id==='pol-minor'){D.minor=e.target.checked;const g=$('#pol-g');if(g){g.style.display=D.minor?'':'none';const c=g.querySelector('canvas');if(D.minor&&c)PADS.gsig=sigPad(c,d=>{D.gsig=d})}}if(e.target.id==='pol-read')D.read=e.target.checked});
window.addEventListener('hashchange',()=>{if(!ME)render()});
document.addEventListener('submit',e=>{if(e.target.id==='authf')authSubmit(e)});
const ACT={
  tab:async t=>{if(['daily','insp','inc'].includes(D.kind)||D.topicId){const dirty=JSON.stringify(D).length>120;if(dirty&&!await ask('Leave this form?','What you have filled in will be lost.','Leave form',true))return}D={};go(t.dataset.v)},
  go:t=>{if(!['daily','incident','siteedit'].includes(t.dataset.v))D={};go(t.dataset.v,t.dataset.k?{id:t.dataset.k}:{})},
  authmode:(t,e)=>{e.preventDefault();authMode=authMode==='up'?'in':'up';render()},
  forgot:async()=>{const em=($('#a-email')?.value||'').trim();if(!em)return toast('Type your email first, then tap Forgot password.');try{await CLOUD.init();await CLOUD.reset(em);toast('Password reset email sent to '+em)}catch(e){toast('Could not send the reset email.')}},
  doCheckin:t=>doCheckin(t.dataset.v),
  doCheckinOther:()=>doCheckinOther(),
  delRec:t=>delRecord(t.dataset.k,t.dataset.v),
  delWorker:t=>delWorker(t.dataset.v,false),
  clearRecs:t=>delWorker(t.dataset.v,true),
  bioSignIn:()=>bioSignIn(),
  checkout:async()=>{if(!await ask('Leave site?','Your location will be recorded as you leave.','Leave site'))return;const ci=activeCheckin();if(!S.dailies.some(d=>d.checkinId===ci.id)&&!await ask('Daily check not done','You have not done today\'s daily safety check. The office will see this. Leave anyway?','Leave anyway',true))return;let l=null;try{l=await getLoc()}catch(e){}ci.outAt=now();ci.noDaily=!S.dailies.some(d=>d.checkinId===ci.id);ci.outLoc=l;save('checkins');toast('Checked out. Get home safe.');go('home')},
  ans:t=>{D.ans[t.dataset.k]=t.dataset.v;t.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b===t))},
  hz:t=>{const k=t.dataset.v;if(D.hz[k])delete D.hz[k];else D.hz[k]={};t.classList.toggle('on');$('#hzbox').innerHTML=hzBox()},
  risk:t=>{D.hz[t.dataset.k][t.dataset.w]=t.dataset.v;t.parentNode.querySelectorAll('.chip').forEach(b=>b.classList.toggle('on',b===t))},
  clearsig:t=>PADS[t.dataset.v]?.clear(),
  saveDaily,
  signPolicy:t=>signPolicy(t),
  copyLink:async()=>{try{await navigator.clipboard.writeText(LIVE_URL+'#sign-policy');toast('Link copied.')}catch(e){toast(LIVE_URL+'#sign-policy')}},
  startInsp:t=>{const c=activeCheckin();if(!c)return toast('Check in on site first.');if(!S.dailies.some(d=>d.checkinId===c.id))return toast('Do your daily safety check first.');D={kind:'insp',type:t.dataset.v,f:{},ans:{},photos:[],notes:''};go('inspform')},
  saveInsp,
  startTalk:t=>{if(!activeCheckin())return toast('Check in on site first.');const tp=TALKS.find(x=>x.id===t.dataset.v);D=tp?{topicId:tp.id,title:tp.title,points:tp.points,qs:tp.ask,ref:tp.ref,att:[],notes:''}:{topicId:'custom',title:'',customPts:'',points:[],qs:[],ref:'',att:[],notes:''};go('talkrun')},
  addAtt:addAttendee,
  rmAtt:t=>{D.att.splice(+t.dataset.v,1);render()},
  saveTalk,
  incType:t=>{D.type=t.dataset.v;document.querySelectorAll('[data-act=incType]').forEach(b=>b.classList.toggle('on',b===t));$('#increp').innerHTML=repBox(D.type)},
  saveInc,
  recf:t=>{recFilter=t.dataset.v;render()},
  openRec:t=>go('record',{k:t.dataset.k,id:t.dataset.v}),
  print:()=>{try{window.print()}catch(e){toast('Printing is blocked here.')}},
  pdf:()=>{const el=$('#rec');if(!el)return;const t=(el.querySelector('h1')?.textContent||'record').replace(/[^\w]+/g,'-').slice(0,60);savePDF(el,'20Vision-'+t+'-'+today()+'.pdf')},
  policyPdf:async()=>{if(!NATIVE)return;try{const r=await fetch('policy.pdf');const b=await r.blob();const fr=new FileReader();fr.onload=()=>openWith('20-Vision-Company-Policy.pdf',fr.result).catch(()=>toast('Could not open the PDF.'));fr.readAsDataURL(b)}catch(e){toast('Could not open the PDF.')}},
  review:t=>{const r=S.dailies.find(x=>x.id===t.dataset.v);r.review={by:ME.id,at:now()};save('dailies');render()},
  incStep:t=>{const r=S.incidents.find(x=>x.id===t.dataset.k);r.steps[t.dataset.v]={at:now(),by:ME.id};save('incidents');render()},
  investigate:t=>{const r=S.incidents.find(x=>x.id===t.dataset.v);const root=$('#iv-root').value.trim(),fix=$('#iv-fix').value.trim();if(!root||!fix)return toast('Fill in the root cause and the corrective action.');if(!$('#iv-due').value)return toast('Set a due date for the action.');r.investigation={root,fix,by:ME.id,at:now()};save('incidents');S.actions.push({id:uid(),desc:'Incident fix: '+fix,siteId:r.siteId,src:'inc',ref:r.id,at:now(),by:ME.id,due:$('#iv-due').value,status:'open'});save('actions');toast('Investigation saved.');render()},
  addTr:t=>addTraining(t.dataset.v),
  saveProfile,
  openFile:t=>openFile(t.dataset.v),
  delTr:async t=>{if(!await ask('Delete this document?','It will be removed from the profile.','Delete',true))return;S.training=S.training.filter(x=>x.id!==t.dataset.v);saveLocal('training');CLOUD.remove('training',t.dataset.v);render()},
  cordoc:t=>{const n=t.dataset.k,i=t.dataset.v;S.cordocs[n]=S.cordocs[n]||{};if(S.cordocs[n][i])delete S.cordocs[n][i];else S.cordocs[n][i]={d:today(),by:ME.id};save('cordocs');const open=[...document.querySelectorAll('details')].map(d=>d.open);render();document.querySelectorAll('details').forEach((d,j)=>d.open=open[j])},
  closeAct:async t=>{const a=S.actions.find(x=>x.id===t.dataset.v);const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="card"><h3>Close corrective action</h3><p>${esc(a.desc)}</p><label class="f" for="ca-n">What was done to fix it?</label><textarea id="ca-n"></textarea><div class="row" style="margin-top:10px"><button class="btn pri" id="ca-ok">Close action</button><button class="btn" id="ca-x">Cancel</button></div></div>`;document.body.appendChild(m);m.querySelector('#ca-x').onclick=()=>m.remove();m.querySelector('#ca-ok').onclick=()=>{const n=m.querySelector('#ca-n').value.trim();if(!n)return toast('Say what was done.');a.status='closed';a.closeNote=n;a.closedAt=now();a.closedBy=ME.id;if(a.src==='insp'){const r=S.insps.find(x=>x.id===a.ref);const q=r&&S.equip.find(x=>x.id===r.equipId);if(q&&q.status==='out')toast('Re-inspect the equipment before putting it back in service.')}save('actions');m.remove();render()}},
  soccat:t=>{socCat=t.dataset.v;render()},
  editSite:t=>{const s=S.sites.find(x=>x.id===t.dataset.v);D=s?{...s,activeS:s.active===false?'0':'1'}:{radius:300};go('siteedit')},
  siteHere:async()=>{try{const l=await getLoc();D.lat=l.lat;D.lng=l.lng;$('#s-lat').value=l.lat;$('#s-lng').value=l.lng;toast('Location set (±'+l.acc+' m).')}catch(m){toast(m)}},
  saveSite:()=>{if(!D.name?.trim())return toast('Give the site a name.');const lat=D.lat===''||D.lat==null?null:+D.lat,lng=D.lng===''||D.lng==null?null:+D.lng;if((lat!=null&&isNaN(lat))||(lng!=null&&isNaN(lng)))return toast('Latitude and longitude must be numbers.');const s={...D,lat,lng,radius:+D.radius||300,active:D.activeS!=='0'};delete s.activeS;if(!s.id){s.id=uid();S.sites.push(s)}else Object.assign(S.sites.find(x=>x.id===s.id),s);save('sites');D={};toast('Site saved.');go('sites')},
  toggleUser:t=>{const u=S.users.find(x=>x.id===t.dataset.v);u.active=u.active===false;save('users');render()},
  exp:t=>exportData(t.dataset.v),
  signout:async()=>{if(!await ask('Sign out?',CLOUD.on?'You will need your email and password to sign back in.':'You will need your email and PIN to sign back in.','Sign out'))return;ME=null;try{localStorage.removeItem(SESSION_KEY)}catch(e){}CLOUD.signOut();D={};render()}
};
let BUSY=false;const SAVES=['saveDaily','saveInsp','saveTalk','saveInc','signPolicy','doCheckin','checkout','saveProfile','investigate'];
document.addEventListener('click',async e=>{const t=e.target.closest('[data-act]');if(!t||!ACT[t.dataset.act])return;if(t.tagName==='A')e.preventDefault();const a=t.dataset.act;if(SAVES.includes(a)){if(BUSY)return;BUSY=true;try{await ACT[a](t,e)}finally{BUSY=false}}else ACT[a](t,e)});

function exportData(kind){
  let blob,name;
  if(kind==='json'){blob=new Blob([JSON.stringify(Object.fromEntries(KEYS.map(k=>[k,S[k]])))],{type:'application/json'});name=`20vision-site-safety-backup-${today()}.json`}
  else{const rows=S[kind].map(r=>({date:fmt(r.at||r.inAt),worker:userName(r.userId),site:siteName(r.siteId),gps:locStamp(r.loc),title:recTitle(kind,r),result:recPill(kind,r)[1],details:kind==='insps'?r.fails.join('; '):kind==='talks'?r.att.map(a=>a.name).join('; '):kind==='incidents'?r.desc:kind==='dailies'?r.task:''}));
    const cols=['date','worker','site','gps','title','result','details'];const q=v=>{let x=String(v??'');if(/^[=+\-@]/.test(x))x="'"+x;return '"'+x.replace(/"/g,'""')+'"'};
    blob=new Blob(['\ufeff'+[cols.join(','),...rows.map(r=>cols.map(c=>q(r[c])).join(','))].join('\n')],{type:'text/csv'});name=`20vision-${kind}-${today()}.csv`}
  if(NATIVE){const fr=new FileReader();fr.onload=()=>nativeShare(name,fr.result).catch(()=>toast('Could not save the file.'));fr.readAsDataURL(blob);return}
  try{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();toast('Downloaded '+name)}catch(e){toast('Downloads are blocked here. Open the app in your browser.')}
}

/* ================= start ================= */
(async()=>{
  db=await idb();try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
  for(const k of KEYS){const v=await get(k);if(v!==undefined)S[k]=v}
  if(!db)toast('This browser cannot save records. Open the app in Chrome.');
  if(CLOUD.on){$('#app').innerHTML='<p style="text-align:center;margin-top:30vh">Loading…</p>';
    if(await CLOUD.init()){const fu=await CLOUD.resume();if(fu){ME=S.users.find(u=>u.id===fu.uid&&u.active!==false)||null;if(ME&&CLOUD.admin&&ME.role!=='admin'){ME.role='admin';save('users')}}}
    else{try{const sid=localStorage.getItem(SESSION_KEY);ME=S.users.find(u=>u.id===sid&&u.active!==false)||null}catch(e){}if(ME)toast('Offline: records will upload when you have signal.')}}
  else{try{const sid=localStorage.getItem(SESSION_KEY);ME=S.users.find(u=>u.id===sid&&u.active!==false)||null}catch(e){}}
  await BIO.check();
  $('#tk').textContent=TICKER.join('   •   ');
  render();
  if(!ME&&CLOUD.on&&BIO.saved)setTimeout(()=>{if(!ME&&$('#authf'))bioSignIn()},400);
  setInterval(()=>{if(ME&&activeCheckin())ping()},15*60*1000);
})();
}
