/* RBL REBEL TEAM — local-first community site.
   Local accounts, rankings and moderation are stored in this browser only.
   For real multi-user accounts, secure admin permissions and Discord OAuth2, connect a backend. */
(() => {
  'use strict';
  const STORAGE = {catalog:'rbl_v3_catalog',pending:'rbl_v3_pending',users:'rbl_v3_users',session:'rbl_v3_session',ranking:'rbl_v3_ranking',admin:'rbl_v3_admin'};
  const ADMIN_PASSWORD = 'cwelina123'; // Change for your local preview. Client-side passwords are not production security.
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const safeRead = (key, fallback) => { try { const value=localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { toast('Przeglądarka zablokowała zapis lokalny.','error'); return false; } };
  const clone = value => JSON.parse(JSON.stringify(value));
  let catalog = safeRead(STORAGE.catalog, clone(window.RBL_DATA.decals));
  let pending = safeRead(STORAGE.pending, []);
  let users = safeRead(STORAGE.users, []);
  let ranking = safeRead(STORAGE.ranking, {});
  let session = safeRead(STORAGE.session, null);
  let activeBrand = 'WSZYSTKIE';
  let authMode = 'login';
  let factIndex = 0;
  let adminTab = 'pending';

  function toast(message, type='success') {
    const region=$('#toastRegion'); if(!region) return;
    const item=document.createElement('div'); item.className=`toast ${type==='error'?'error':''}`; item.textContent=message; region.append(item);
    window.setTimeout(()=>{item.style.opacity='0';item.style.transform='translateX(12px)';window.setTimeout(()=>item.remove(),250);},3200);
  }
  function openModal(id){const el=document.getElementById(id);if(el){el.classList.remove('hidden');document.body.style.overflow='hidden';}}
  function closeModal(id){const el=document.getElementById(id);if(el){el.classList.add('hidden');if(!$$('.modal-backdrop:not(.hidden)').length)document.body.style.overflow='';}}
  $$('[data-close]').forEach(btn=>btn.addEventListener('click',()=>closeModal(btn.dataset.close)));
  $$('.modal-backdrop').forEach(backdrop=>backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeModal(backdrop.id);}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape') $$('.modal-backdrop:not(.hidden)').forEach(el=>closeModal(el.id));});

  function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
  function currentName(){return session?.username || 'GOŚĆ';}
  function updateAuthButton(){const button=$('#authOpenBtn');if(button)button.textContent=session?.username ? `CZEŚĆ, ${session.username.toUpperCase()}` : 'ZALOGUJ';}
  function renderFilters(){const wrap=$('#brandFilters');wrap.innerHTML='';window.RBL_DATA.brands.forEach(brand=>{const button=document.createElement('button');button.className=`filter-chip ${brand===activeBrand?'active':''}`;button.textContent=brand;button.addEventListener('click',()=>{activeBrand=brand;renderFilters();renderCatalog();});wrap.append(button);});}
  function renderCatalog(){const query=$('#catalogSearch').value.trim().toLowerCase();const items=catalog.filter(item=>(activeBrand==='WSZYSTKIE'||item.brand===activeBrand)&&[item.name,item.author,item.brand,...(item.tags||[])].join(' ').toLowerCase().includes(query));
    $('#catalogCount').textContent=`${items.length} PROJEKTÓW`;
    $('#emptyCatalog').classList.toggle('hidden',items.length!==0);
    const grid=$('#catalogGrid');grid.innerHTML='';
    items.forEach((item,index)=>{const card=document.createElement('article');card.className='decal-card card-enter';const tags=(item.tags||[]).slice(0,2).map(tag=>`<span class="decal-tag">${escapeHTML(tag)}</span>`).join('');
      card.innerHTML=`<div class="decal-visual"><span class="decal-brand-mark">RBL / ${escapeHTML(item.brand)}</span><span class="decal-number">${escapeHTML(item.number||String(index+1).padStart(2,'0'))}</span><span class="decal-corner">${escapeHTML(item.id||'RBL')}</span></div><div class="decal-content"><div class="decal-topline"><span class="decal-category">${escapeHTML(item.brand)}</span>${tags}</div><h3>${escapeHTML(item.name)}</h3><div class="decal-meta"><span>BY ${escapeHTML(item.author)}</span><span>ID · ${escapeHTML(item.assetId)}</span></div><button class="copy-id" data-copy-id="${escapeHTML(item.assetId)}" data-item-id="${escapeHTML(item.id)}"><span>KOPIUJ ID OKLEINY +</span><span>↗</span></button></div>`;
      grid.append(card);
    });
    $$('[data-copy-id]',grid).forEach(button=>button.addEventListener('click',()=>copyAsset(button.dataset.copyId,button.dataset.itemId)));
  }
  async function copyText(text){try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return true;}}catch{}
    try{const input=document.createElement('textarea');input.value=text;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();const ok=document.execCommand('copy');input.remove();return ok;}catch{return false;}}
  async function copyAsset(assetId,itemId){const ok=await copyText(assetId);if(!ok){toast('Nie udało się skopiować ID. Zaznacz numer ręcznie.','error');return;}
    const name=currentName();if(session){ranking[name]=(ranking[name]||0)+1;save(STORAGE.ranking,ranking);}
    toast(`ID ${assetId} skopiowane${session?' · +1 PUNKT':''}.`);}

  function fillBrandSelects(){['submitBrand','adminBrand','adminEditBrand'].forEach(id=>{const select=$(`#${id}`);select.innerHTML=window.RBL_DATA.brands.filter(x=>x!=='WSZYSTKIE').map(brand=>`<option value="${escapeHTML(brand)}">${escapeHTML(brand)}</option>`).join('');});}
  function renderFacts(){const facts=window.RBL_DATA.facts;const visible=[facts[factIndex],facts[(factIndex+1)%facts.length],facts[(factIndex+2)%facts.length],facts[(factIndex+3)%facts.length]];$('#factsGrid').innerHTML=visible.map((fact,i)=>`<article class="fact-card"><span class="fact-number">0${(factIndex+i)%facts.length+1}</span><span class="fact-icon">${escapeHTML(fact.icon)}</span><h3>${escapeHTML(fact.title)}</h3><p>${escapeHTML(fact.text)}</p></article>`).join('');$('#factIndex').textContent=`${String(factIndex+1).padStart(2,'0')} / ${String(facts.length).padStart(2,'0')}`;}
  $('#factPrev').addEventListener('click',()=>{factIndex=(factIndex+window.RBL_DATA.facts.length-1)%window.RBL_DATA.facts.length;renderFacts();});
  $('#factNext').addEventListener('click',()=>{factIndex=(factIndex+1)%window.RBL_DATA.facts.length;renderFacts();});
  $('#catalogSearch').addEventListener('input',renderCatalog);

  function setAuthMode(mode){authMode=mode;$$('[data-auth-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.authTab===mode));$('#authTitle').innerHTML=mode==='login'?'WEJDŹ DO <em>EKIPY.</em>':'DOŁĄCZ DO <em>EKIPY.</em>';$('#authSubmit').innerHTML=mode==='login'?'ZALOGUJ SIĘ <span>→</span>':'UTWÓRZ KONTO <span>→</span>';$('#authPassword').autocomplete=mode==='login'?'current-password':'new-password';$('#authNote').textContent=mode==='login'?'Konto i sesja są zapisywane lokalnie w tej przeglądarce.':'Utwórz lokalne konto gracza. Hasło jest przechowywane jako skrót SHA-256.';}
  $$('[data-auth-tab]').forEach(btn=>btn.addEventListener('click',()=>setAuthMode(btn.dataset.authTab)));
  async function hashPassword(password){if(window.crypto?.subtle){const bytes=new TextEncoder().encode(password);const digest=await crypto.subtle.digest('SHA-256',bytes);return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');}return `local-${btoa(unescape(encodeURIComponent(password)))}`;}
  $('#authOpenBtn').addEventListener('click',()=>{if(session){if(confirm(`Wylogować ${session.username}?`)){session=null;save(STORAGE.session,null);updateAuthButton();toast('Wylogowano.');}return;}setAuthMode('login');openModal('authModal');});
  $('#authForm').addEventListener('submit',async e=>{e.preventDefault();const username=$('#authName').value.trim();const password=$('#authPassword').value;if(!/^[\p{L}\p{N}_-]{3,20}$/u.test(username)){toast('Nick: 3–20 znaków, litery, cyfry, _ lub -.','error');return;}if(password.length<6){toast('Hasło musi mieć co najmniej 6 znaków.','error');return;}const normalized=username.toLowerCase();const passwordHash=await hashPassword(password);
    if(authMode==='register'){if(users.some(user=>user.username.toLowerCase()===normalized)){toast('Ten nick jest już zajęty.','error');return;}users.push({username,passwordHash,createdAt:new Date().toISOString()});save(STORAGE.users,users);session={username};save(STORAGE.session,session);toast('Konto utworzone. Witaj w REBEL TEAM!');}
    else{const user=users.find(entry=>entry.username.toLowerCase()===normalized&&entry.passwordHash===passwordHash);if(!user){toast('Nieprawidłowy nick lub hasło.','error');return;}session={username:user.username};save(STORAGE.session,session);toast(`Witaj ponownie, ${user.username}!`);}
    updateAuthButton();closeModal('authModal');e.target.reset();
  });
  $('#discordAuthBtn').addEventListener('click',()=>toast('Discord OAuth2 wymaga backendu i Client ID. Dołącz bezpośrednio: discord.gg/SSg7rwyrH','error'));

  $('#submitOpenBtn').addEventListener('click',()=>{if(session)$('#submitForm [name="author"]').value=session.username;openModal('submitModal');});
  $('#submitForm').addEventListener('submit',e=>{e.preventDefault();const form=new FormData(e.currentTarget);const assetId=String(form.get('assetId')).trim();if(!/^\d{5,20}$/.test(assetId)){toast('Asset ID musi zawierać od 5 do 20 cyfr.','error');return;}if(catalog.some(item=>item.assetId===assetId)||pending.some(item=>item.assetId===assetId)){toast('To ID znajduje się już w katalogu lub kolejce.','error');return;}
    const submission={id:`community-${Date.now()}`,name:String(form.get('name')).trim(),brand:String(form.get('brand')),author:String(form.get('author')).trim(),assetId,previewUrl:String(form.get('previewUrl')||'').trim(),tags:['COMMUNITY'],number:'RBL',submittedAt:new Date().toISOString()};pending.unshift(submission);save(STORAGE.pending,pending);e.currentTarget.reset();closeModal('submitModal');toast('Zgłoszenie wysłane do kolejki moderacji.');});

  function openAdmin(){if(safeRead(STORAGE.admin,false)){showAdminDashboard();}else{$('#adminLogin').classList.remove('hidden');$('#adminDashboard').classList.add('hidden');}openModal('adminModal');}
  $('#adminOpenBtn').addEventListener('click',openAdmin);
  $('#adminLoginForm').addEventListener('submit',e=>{e.preventDefault();if($('#adminPassword').value!==ADMIN_PASSWORD){toast('Nieprawidłowe hasło administratora.','error');return;}save(STORAGE.admin,true);showAdminDashboard();toast('Panel administratora otwarty.');});
  function showAdminDashboard(){$('#adminLogin').classList.add('hidden');$('#adminDashboard').classList.remove('hidden');renderAdmin();}
  function renderAdmin(){ $('#pendingBadge').textContent=pending.length;renderPending();renderAdminCatalog();switchAdminTab(adminTab); }
  function switchAdminTab(tab){adminTab=tab;$$('[data-admin-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.adminTab===tab));$('#adminPending').classList.toggle('hidden',tab!=='pending');$('#adminManage').classList.toggle('hidden',tab!=='manage');}
  $$('[data-admin-tab]').forEach(btn=>btn.addEventListener('click',()=>switchAdminTab(btn.dataset.adminTab)));
  function renderPending(){const target=$('#adminPending');if(!pending.length){target.innerHTML='<p class="form-note">Brak oczekujących zgłoszeń. Kolejka jest czysta.</p>';return;}target.innerHTML=pending.map(item=>`<div class="admin-entry"><div><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.brand)} · ${escapeHTML(item.author)} · ID ${escapeHTML(item.assetId)}</small></div><div class="admin-entry-actions"><button class="mini-action approve" data-approve="${escapeHTML(item.id)}">AKCEPTUJ</button><button class="mini-action reject" data-reject="${escapeHTML(item.id)}">ODRZUĆ</button></div></div>`).join('');
    $$('[data-approve]',target).forEach(btn=>btn.addEventListener('click',()=>{const index=pending.findIndex(item=>item.id===btn.dataset.approve);if(index<0)return;const [item]=pending.splice(index,1);catalog.unshift({...item,tags:['COMMUNITY','APPROVED']});save(STORAGE.catalog,catalog);save(STORAGE.pending,pending);renderAdmin();renderCatalog();toast('Projekt zatwierdzony i opublikowany w katalogu.');}));
    $$('[data-reject]',target).forEach(btn=>btn.addEventListener('click',()=>{pending=pending.filter(item=>item.id!==btn.dataset.reject);save(STORAGE.pending,pending);renderAdmin();toast('Zgłoszenie odrzucone.');}));}
  function renderAdminCatalog(){const target=$('#adminCatalogList');target.innerHTML=catalog.map(item=>`<div class="admin-entry"><div><strong>${escapeHTML(item.name)}</strong><small>${escapeHTML(item.brand)} · ${escapeHTML(item.author)} · ID ${escapeHTML(item.assetId)}</small></div><div class="admin-entry-actions"><button class="mini-action edit" data-edit="${escapeHTML(item.id)}">EDYTUJ</button><button class="mini-action reject" data-delete="${escapeHTML(item.id)}">USUŃ</button></div></div>`).join('');
    $$('[data-edit]',target).forEach(btn=>btn.addEventListener('click',()=>{const item=catalog.find(entry=>entry.id===btn.dataset.edit);if(!item)return;const form=$('#adminEditForm');form.elements.id.value=item.id;form.elements.name.value=item.name;form.elements.brand.value=item.brand;form.elements.author.value=item.author;form.elements.assetId.value=item.assetId;form.elements.tags.value=(item.tags||[]).join(', ');form.elements.number.value=item.number||'';form.classList.remove('hidden');form.scrollIntoView({behavior:'smooth',block:'nearest'});form.elements.name.focus();}));
    $$('[data-delete]',target).forEach(btn=>btn.addEventListener('click',()=>{if(!confirm('Usunąć projekt z katalogu?'))return;catalog=catalog.filter(item=>item.id!==btn.dataset.delete);save(STORAGE.catalog,catalog);renderAdmin();renderCatalog();toast('Projekt usunięty.');}));}
  $('#adminEditForm').addEventListener('submit',e=>{e.preventDefault();const form=e.currentTarget;const values=new FormData(form);const id=String(values.get('id'));const assetId=String(values.get('assetId')).trim();if(!/^\d{5,20}$/.test(assetId)){toast('Asset ID musi zawierać od 5 do 20 cyfr.','error');return;}if(catalog.some(item=>item.id!==id&&item.assetId===assetId)){toast('Inny projekt używa już tego Asset ID.','error');return;}const index=catalog.findIndex(item=>item.id===id);if(index<0)return;catalog[index]={...catalog[index],name:String(values.get('name')).trim(),brand:String(values.get('brand')),author:String(values.get('author')).trim(),assetId,tags:String(values.get('tags')||'').split(',').map(x=>x.trim()).filter(Boolean),number:String(values.get('number')||'').trim()};save(STORAGE.catalog,catalog);form.classList.add('hidden');form.reset();renderAdmin();renderCatalog();toast('Zmiany projektu zostały zapisane.');});
  $('#cancelEditBtn').addEventListener('click',()=>{$('#adminEditForm').classList.add('hidden');$('#adminEditForm').reset();});
  $('#adminAddForm').addEventListener('submit',e=>{e.preventDefault();const form=new FormData(e.currentTarget);const assetId=String(form.get('assetId')).trim();if(!/^\d{5,20}$/.test(assetId)){toast('Asset ID musi zawierać od 5 do 20 cyfr.','error');return;}if(catalog.some(item=>item.assetId===assetId)){toast('Takie ID już istnieje.','error');return;}catalog.unshift({id:`admin-${Date.now()}`,name:String(form.get('name')).trim(),brand:String(form.get('brand')),author:String(form.get('author')).trim(),assetId,tags:String(form.get('tags')||'').split(',').map(x=>x.trim()).filter(Boolean),number:String(catalog.length+1).padStart(2,'0')});save(STORAGE.catalog,catalog);e.currentTarget.reset();renderAdmin();renderCatalog();toast('Projekt dodany do katalogu.');});
  $('#exportDataBtn').addEventListener('click',()=>{const payload={brands:window.RBL_DATA.brands,decals:catalog,facts:window.RBL_DATA.facts};const source=`/* Exported from RBL admin panel on ${new Date().toISOString()} */\nwindow.RBL_DATA = ${JSON.stringify(payload,null,2)};\n`;const blob=new Blob([source],{type:'text/javascript;charset=utf-8'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='data.js';document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);toast('Plik data.js został wyeksportowany.');});
  $('#adminLogoutBtn').addEventListener('click',()=>{save(STORAGE.admin,false);closeModal('adminModal');toast('Wylogowano z panelu admina.');});

  $('#topPeopleBtn').addEventListener('click',()=>{renderRanking();openModal('topModal');});
  function renderRanking(){const entries=Object.entries(ranking).sort((a,b)=>b[1]-a[1]).slice(0,10);$('#rankingList').innerHTML=entries.length?entries.map(([name,points],i)=>`<div class="rank-row"><span class="rank-position">${String(i+1).padStart(2,'0')}</span><span class="rank-name">${escapeHTML(name)}</span><b class="rank-points">${points} PKT</b></div>`).join(''):'<p class="form-note">Ranking jest jeszcze pusty. Zaloguj się i kopiuj ID oklein, aby zdobywać punkty.</p>';}

  const chatReplies=[
    {keys:['discord','dołączyć','dolaczyc','serwer','ekipa'],reply:'Dołącz do REBEL TEAM tutaj: https://discord.gg/SSg7rwyrH. Kliknij zaproszenie, zaakceptuj je w Discordzie i przywitaj się na serwerze. 🏁'},
    {keys:['id','skopi','kopi','asset'],reply:'W katalogu znajdź okleinę i kliknij „KOPIUJ ID OKLEINY +”. Numer trafi do schowka. Zalogowani gracze otrzymują za to punkt w lokalnym rankingu.'},
    {keys:['oklein','katalog','mark','szuka'],reply:'Przejdź do sekcji OKLEINY. Możesz filtrować projekty według marki i szukać po nazwie lub autorze.'},
    {keys:['zgłoś','zglos','dodać','dodac','projekt','wysłać','wyslac'],reply:'Kliknij „ZGŁOŚ OKLEINĘ”, uzupełnij nazwę, kategorię, autora i numeryczne Roblox Asset ID. Zgłoszenie pojawi się w kolejce i będzie publiczne dopiero po akceptacji administratora.'},
    {keys:['zasad','regul','zachow','kultur'],reply:'Szanuj innych graczy, nie spamuj, nie publikuj cudzych projektów jako własnych i stosuj się do zasad ustalonych przez administrację REBEL TEAM. Szczegóły znajdziesz na Discordzie.'},
    {keys:['konto','log','rejestr'],reply:'Kliknij ZALOGUJ. Możesz utworzyć konto lokalne albo zalogować się na istniejące. Konto i ranking zapisują się w tej przeglądarce.'}
  ];
  function addChatMessage(text,type){const node=document.createElement('div');node.className=`chat-message ${type}`;node.textContent=text;$('#chatMessages').append(node);$('#chatMessages').scrollTop=$('#chatMessages').scrollHeight;}
  function answerChat(message){const normalized=message.toLowerCase();const found=chatReplies.find(entry=>entry.keys.some(key=>normalized.includes(key)));return found?.reply||'Nie mam jeszcze odpowiedzi na to pytanie. Mogę pomóc z Discordem, okleinami, kopiowaniem ID, zgłoszeniami i kontem gracza. Napisz, czego szukasz!';}
  $('#chatLauncher').addEventListener('click',()=>{$('#chatWindow').classList.toggle('hidden');if(!$('#chatWindow').classList.contains('hidden'))$('#chatInput').focus();});
  $('#chatClose').addEventListener('click',()=>$('#chatWindow').classList.add('hidden'));
  $$('.chat-suggestions button').forEach(btn=>btn.addEventListener('click',()=>{const message=btn.dataset.chat;addChatMessage(message,'user');window.setTimeout(()=>addChatMessage(answerChat(message),'bot'),180);}));
  $('#chatForm').addEventListener('submit',e=>{e.preventDefault();const input=$('#chatInput');const message=input.value.trim();if(!message)return;addChatMessage(message,'user');input.value='';window.setTimeout(()=>addChatMessage(answerChat(message),'bot'),220);});

  $('#menuToggle').addEventListener('click',()=>{const nav=$('#mainNav');const opened=nav.classList.toggle('open');$('#menuToggle').setAttribute('aria-expanded',String(opened));});
  $$('#mainNav a').forEach(link=>link.addEventListener('click',()=>{$('#mainNav').classList.remove('open');$('#menuToggle').setAttribute('aria-expanded','false');}));
  const observer=('IntersectionObserver' in window)?new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target);}}),{threshold:.12}):null;
  $$('.reveal').forEach(el=>observer?observer.observe(el):el.classList.add('is-visible'));
  // Motion system: scroll progress, subtle pointer ambience and accessible reveal.
  const progress=$('#scrollProgress');
  let scrollQueued=false;
  const updateScrollProgress=()=>{const max=document.documentElement.scrollHeight-window.innerHeight;const ratio=max>0?window.scrollY/max:0;if(progress)progress.style.transform=`scaleX(${ratio})`;scrollQueued=false;};
  window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;window.requestAnimationFrame(updateScrollProgress);}},{passive:true});
  updateScrollProgress();
  const pointerGlow=$('#pointerGlow');
  if(pointerGlow&&window.matchMedia('(pointer:fine)').matches&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.body.classList.add('has-pointer');let pointerQueued=false,lastX=0,lastY=0;window.addEventListener('pointermove',event=>{lastX=event.clientX;lastY=event.clientY;if(!pointerQueued){pointerQueued=true;window.requestAnimationFrame(()=>{pointerGlow.style.transform=`translate3d(${lastX-160}px,${lastY-160}px,0)`;pointerQueued=false;});}},{passive:true});}
  const refreshReveal=()=>{$$('.reveal:not(.is-visible)').forEach(el=>{if(el.getBoundingClientRect().top<window.innerHeight*.9)el.classList.add('is-visible');});};
  window.addEventListener('scroll',refreshReveal,{passive:true});
  // Gentle card tilt is disabled on touch devices to keep scrolling natural.
  if(window.matchMedia('(pointer:fine)').matches&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.addEventListener('pointermove',event=>{const card=event.target.closest('.decal-card,.fact-card,.crew-card');if(!card)return;const rect=card.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width-.5;const y=(event.clientY-rect.top)/rect.height-.5;card.style.setProperty('--tilt-x',`${(-y*2.2).toFixed(2)}deg`);card.style.setProperty('--tilt-y',`${(x*2.2).toFixed(2)}deg`);},{passive:true});document.addEventListener('pointerout',event=>{const card=event.target.closest('.decal-card,.fact-card,.crew-card');if(card&&!card.contains(event.relatedTarget)){card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');}},{passive:true});}
  $('#year').textContent=new Date().getFullYear();
  if(session&&!users.some(user=>user.username===session.username)){session=null;save(STORAGE.session,null);}updateAuthButton();renderFilters();renderCatalog();renderFacts();fillBrandSelects();
})();
