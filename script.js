/* RBL — REBEL TEAM / Supabase cloud edition
   Nick + password use Supabase Auth (email alias generated internally).
   Never place service_role keys or admin passwords in this public file. */
(() => {
  'use strict';
  const SUPABASE_URL = 'https://hfikdpjfyadtjhlkazey.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_JPR7VGqYz6DX0i2X4uYxOg_42-dOX8u';
  const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
  });
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast = (message, type='success') => {
    const region=$('#toastRegion'); if(!region)return;
    const item=document.createElement('div'); item.className=`toast ${type==='error'?'error':''}`; item.textContent=message; region.append(item);
    setTimeout(()=>{item.style.opacity='0';item.style.transform='translateX(12px)';setTimeout(()=>item.remove(),250);},3200);
  };
  const openModal=id=>{const el=$('#'+id);if(el){el.classList.remove('hidden');document.body.style.overflow='hidden';}};
  const closeModal=id=>{const el=$('#'+id);if(el){el.classList.add('hidden');if(!$$('.modal-backdrop:not(.hidden)').length)document.body.style.overflow='';}};
  $$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
  $$('.modal-backdrop').forEach(b=>b.addEventListener('click',e=>{if(e.target===b)closeModal(b.id);}));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')$$('.modal-backdrop:not(.hidden)').forEach(x=>closeModal(x.id));});

  let catalog=[], pending=[], profile=null, session=null, ranking=[], activeBrand='WSZYSTKIE', authMode='login', factIndex=0, adminTab='pending';
  let pack = [];
  const brands = window.RBL_DATA.brands;
  const ADMIN_ROLE='admin';
  const RALLY_DATE = '2026-12-20T18:00:00+01:00';
  const RALLY_NAME = 'REBEL NIGHT RIDE';
  const RALLY_LOCATION = 'Roblox BikeLife · centrum miasta · mapa publiczna';

  function currentName(){return profile?.username || 'GOŚĆ';}
  function updateAuthButton(){const b=$('#authOpenBtn');if(b)b.textContent=profile?.username?`CZEŚĆ, ${profile.username.toUpperCase()}`:'ZALOGUJ';}
  function setAuthMode(mode){authMode=mode;$$('[data-auth-tab]').forEach(b=>b.classList.toggle('active',b.dataset.authTab===mode));$('#authTitle').innerHTML=mode==='login'?'WEJDŹ DO <em>EKIPY.</em>':'DOŁĄCZ DO <em>EKIPY.</em>';$('#authSubmit').innerHTML=mode==='login'?'ZALOGUJ SIĘ <span>→</span>':'UTWÓRZ KONTO <span>→</span>';$('#authPassword').autocomplete=mode==='login'?'current-password':'new-password';$('#authNote').textContent=mode==='login'?'Zaloguj się na swoje konto RBL.':'Utwórz konto RBL dostępne na każdym urządzeniu.';}
  $$('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>setAuthMode(b.dataset.authTab)));
  const authEmail = username => `${username.trim().toLowerCase()}@rbl-members.invalid`;
  async function loadProfile(){
    const {data:{user}}=await supabase.auth.getUser(); session=user||null;
    if(!user){profile=null;updateAuthButton();renderGarage();return;}
    const {data,error}=await supabase.from('users').select('*').eq('id',user.id).maybeSingle();
    if(error){toast('Nie udało się pobrać profilu: '+error.message,'error');return;}
    profile=data;updateAuthButton();renderGarage();$('#cardNick').value=profile?.username||'';
    $('#garageForm [name="robloxNick"]').value=profile?.roblox_nick||'';
    $('#garageForm [name="mainBike"]').value=profile?.main_bike||'';
    $('#garageForm [name="discordTag"]').value=profile?.discord_tag||'';
  }
  $('#authOpenBtn').addEventListener('click',async()=>{
    if(session){if(confirm(`Wylogować ${profile?.username||'gracza'}?`)){await supabase.auth.signOut();profile=null;session=null;updateAuthButton();renderGarage();toast('Wylogowano.');}return;}
    setAuthMode('login');openModal('authModal');
  });
  $('#authForm').addEventListener('submit',async e=>{
    e.preventDefault();
    const username=$('#authName').value.trim(), password=$('#authPassword').value;
    if(!/^[\p{L}\p{N}_-]{3,20}$/u.test(username)){toast('Nick: 3–20 znaków, litery, cyfry, _ lub -.','error');return;}
    if(password.length<8){toast('Hasło musi mieć co najmniej 8 znaków.','error');return;}
    const email=authEmail(username);
    let result;
    if(authMode==='register'){
      result=await supabase.auth.signUp({email,password,options:{data:{username}}});
      if(result.error){toast(result.error.message,'error');return;}
      if(!result.data.session){toast('Konto utworzone. W Supabase wyłącz potwierdzanie e-mail dla aliasów RBL.','error');return;}
      toast('Konto utworzone. Witaj w REBEL TEAM!');
    } else {
      result=await supabase.auth.signInWithPassword({email,password});
      if(result.error){toast('Nieprawidłowy nick lub hasło.','error');return;}
      toast(`Witaj ponownie, ${username}!`);
    }
    await loadProfile();closeModal('authModal');e.target.reset();
  });

  async function imageToDataURL(file){
    if(!file)return '';
    if(!file.type.startsWith('image/'))throw new Error('Wybierz plik graficzny.');
    if(file.size>12*1024*1024)throw new Error('Obraz jest za duży (maks. 12 MB).');
    return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error('Nie udało się odczytać zdjęcia.'));reader.onload=()=>{const img=new Image();img.onerror=()=>reject(new Error('Nieprawidłowy obraz.'));img.onload=()=>{const scale=Math.min(1,1400/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);c.toBlob(blob=>resolve(blob),'image/jpeg',.82);};img.src=reader.result;};reader.readAsDataURL(file);});
  }
  async function uploadImage(file){
    if(!file)return null;
    const blob=await imageToDataURL(file), path=`${session.id}/${crypto.randomUUID()}.jpg`;
    const {error}=await supabase.storage.from('rbl-decals').upload(path,blob,{contentType:'image/jpeg',upsert:false});
    if(error)throw error;
    return supabase.storage.from('rbl-decals').getPublicUrl(path).data.publicUrl;
  }
  function bindPreview(inputSelector,previewSelector){
    const input=$(inputSelector),preview=$(previewSelector);if(!input||!preview)return;
    input.addEventListener('change',async()=>{const file=input.files?.[0];if(!file){preview.classList.add('hidden');return;}try{const blob=await imageToDataURL(file);const url=URL.createObjectURL(blob);preview.innerHTML=`<img alt="Podgląd zdjęcia" src="${url}">`;preview.classList.remove('hidden');}catch(err){toast(err.message,'error');}});
  }
  bindPreview('#submitForm [name="imageFile"]','#submitImagePreview');
  bindPreview('#adminAddForm [name="imageFile"]','#addImagePreview');
  bindPreview('#adminEditForm [name="imageFile"]','#editImagePreview');

  function normalizeDecal(row){return {id:row.id,name:row.name,brand:row.brand,author:row.author,assetId:row.asset_id,imageData:row.image_url||'',tags:row.tags||[],number:row.number||''};}
  async function loadCatalog(){
    const {data,error}=await supabase.from('decals').select('*').eq('status','approved').order('created_at',{ascending:false});
    if(error){toast('Błąd katalogu Supabase: '+error.message,'error');return;}
    catalog=(data||[]).map(normalizeDecal);renderCatalog();
  }
  async function loadPending(){
    if(!profile||profile.role!==ADMIN_ROLE){pending=[];return;}
    const {data,error}=await supabase.from('decals').select('*').eq('status','pending').order('created_at',{ascending:false});
    if(error){toast('Błąd kolejki: '+error.message,'error');return;}
    pending=(data||[]).map(normalizeDecal);
  }
  function renderFilters(){
    const wrap=$('#brandFilters');wrap.innerHTML='';
    brands.forEach(brand=>{const b=document.createElement('button');b.className=`filter-chip ${brand===activeBrand?'active':''}`;b.textContent=brand;b.addEventListener('click',()=>{activeBrand=brand;renderFilters();renderCatalog();});wrap.append(b);});
  }
  function renderCatalog(){
    const query=$('#catalogSearch').value.trim().toLowerCase();
    const items=catalog.filter(item=>(activeBrand==='WSZYSTKIE'||item.brand===activeBrand)&&[item.name,item.author,item.brand,...(item.tags||[])].join(' ').toLowerCase().includes(query));
    $('#catalogCount').textContent=`${items.length} PROJEKTÓW`;$('#emptyCatalog').classList.toggle('hidden',items.length!==0);
    const grid=$('#catalogGrid');grid.innerHTML='';
    items.forEach(item=>{
      const card=document.createElement('article');card.className='decal-card card-enter';
      const tags=(item.tags||[]).slice(0,2).map(t=>`<span class="decal-tag">${escapeHTML(t)}</span>`).join('');
      card.innerHTML=`<div class="decal-visual">${item.imageData?`<img class="decal-photo" src="${escapeHTML(item.imageData)}" alt="${escapeHTML(item.name)}">`:''}<span class="decal-brand-mark">RBL / ${escapeHTML(item.brand)}</span></div><div class="decal-content"><div class="decal-topline"><span class="decal-category">${escapeHTML(item.brand)}</span>${tags}</div><h3>${escapeHTML(item.name)}</h3><div class="decal-meta"><span>BY ${escapeHTML(item.author)}</span></div><button class="copy-id" data-copy-id="${escapeHTML(item.assetId)}" data-item-id="${escapeHTML(item.id)}"><span>KOPIUJ ID</span><span>↗</span></button><button class="pack-add" data-pack-id="${escapeHTML(item.id)}">＋ DODAJ DO MOJEJ PACZKI</button></div>`;
      grid.append(card);
    });
    $$('[data-copy-id]',grid).forEach(b=>b.addEventListener('click',()=>copyAsset(b.dataset.copyId)));
    $$('[data-pack-id]',grid).forEach(b=>b.addEventListener('click',()=>addToPack(b.dataset.packId)));
  }
  async function copyText(text){
    try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return true;}}catch{}
    try{const input=document.createElement('textarea');input.value=text;input.style.position='fixed';input.style.opacity='0';document.body.append(input);input.select();const ok=document.execCommand('copy');input.remove();return ok;}catch{return false;}
  }
  async function copyAsset(assetId){
    if(!await copyText(assetId)){toast('Nie udało się skopiować ID.','error');return;}
    if(session){const {error}=await supabase.rpc('increment_my_points');if(error)toast('ID skopiowane, ale punkt nie został zapisany: '+error.message,'error');else await loadRanking();}
    toast(`ID ${assetId} skopiowane${session?' · +1 PUNKT':''}.`);
  }
  function addToPack(id){const item=catalog.find(x=>x.id===id);if(!item)return;if(!pack.includes(id))pack.push(id);renderPack();toast('Dodano do Mojej Paczki.');}
  function renderPack(){
    const items=pack.map(id=>catalog.find(x=>x.id===id)).filter(Boolean);
    $('#packCount').textContent=`${items.length} ID W PACZCE`;
    $('#packItems').textContent=items.map(x=>`${x.name}: ${x.assetId}`).join('  ·  ');
  }
  $('#copyPackBtn').addEventListener('click',async()=>{const ids=pack.map(id=>catalog.find(x=>x.id===id)?.assetId).filter(Boolean);if(!ids.length){toast('Paczka jest pusta.','error');return;}if(await copyText(ids.join('\n')))toast(`${ids.length} ID skopiowane do schowka.`);else toast('Nie udało się skopiować paczki.','error');});
  $('#clearPackBtn').addEventListener('click',()=>{pack=[];renderPack();toast('Paczka wyczyszczona.');});
  function fillBrandSelects(){['submitBrand','adminBrand','adminEditBrand'].forEach(id=>{const el=$('#'+id);el.innerHTML=brands.filter(x=>x!=='WSZYSTKIE').map(b=>`<option value="${escapeHTML(b)}">${escapeHTML(b)}</option>`).join('');});}
  function renderFacts(){const facts=window.RBL_DATA.facts,visible=[0,1,2,3].map(i=>facts[(factIndex+i)%facts.length]);$('#factsGrid').innerHTML=visible.map((f,i)=>`<article class="fact-card"><span class="fact-number">0${(factIndex+i)%facts.length+1}</span><span class="fact-icon">${escapeHTML(f.icon)}</span><h3>${escapeHTML(f.title)}</h3><p>${escapeHTML(f.text)}</p></article>`).join('');$('#factIndex').textContent=`${String(factIndex+1).padStart(2,'0')} / ${String(facts.length).padStart(2,'0')}`;}
  $('#factPrev').addEventListener('click',()=>{factIndex=(factIndex+window.RBL_DATA.facts.length-1)%window.RBL_DATA.facts.length;renderFacts();});
  $('#factNext').addEventListener('click',()=>{factIndex=(factIndex+1)%window.RBL_DATA.facts.length;renderFacts();});
  $('#catalogSearch').addEventListener('input',renderCatalog);

  $('#submitOpenBtn').addEventListener('click',()=>{if(!session){toast('Zaloguj się, aby zgłosić okleinę.','error');setAuthMode('login');openModal('authModal');return;}$('#submitForm [name="author"]').value=profile?.username||'';openModal('submitModal');});
  $('#submitForm').addEventListener('submit',async e=>{
    e.preventDefault();if(!session){toast('Najpierw się zaloguj.','error');return;}
    const form=e.currentTarget,v=new FormData(form),assetId=String(v.get('assetId')).trim();
    if(!/^\d{5,20}$/.test(assetId)){toast('Asset ID musi zawierać od 5 do 20 cyfr.','error');return;}
    if(catalog.some(x=>x.assetId===assetId)){toast('To ID jest już w katalogu.','error');return;}
    try{
      const imageUrl=await uploadImage(v.get('imageFile'));if(!imageUrl)throw new Error('Dodaj zdjęcie okleiny.');
      const {error}=await supabase.from('decals').insert({name:String(v.get('name')).trim(),brand:String(v.get('brand')),author:profile.username,asset_id:assetId,image_url:imageUrl,tags:['COMMUNITY'],status:'pending',submitted_by:session.id});
      if(error)throw error;
      form.reset();$('#submitImagePreview').classList.add('hidden');closeModal('submitModal');toast('Projekt wysłany do wspólnej kolejki moderacji.');
      await loadPending();if(profile?.role===ADMIN_ROLE)renderAdmin();
    }catch(err){toast(err.message||'Nie udało się wysłać projektu.','error');}
  });

  async function openAdmin(){
    if(!session){toast('Zaloguj się kontem administratora.','error');setAuthMode('login');openModal('authModal');return;}
    await loadProfile();
    if(profile?.role!==ADMIN_ROLE){$('#adminLogin').classList.remove('hidden');$('#adminDashboard').classList.add('hidden');toast('To konto nie ma rangi administratora.','error');}
    else{showAdminDashboard();}
    openModal('adminModal');
  }
  $('#adminOpenBtn').addEventListener('click',openAdmin);
  $('#adminRetryBtn').addEventListener('click',async()=>{await loadProfile();if(profile?.role===ADMIN_ROLE)showAdminDashboard();else toast('Brak uprawnień administratora.','error');});
  function showAdminDashboard(){$('#adminLogin').classList.add('hidden');$('#adminDashboard').classList.remove('hidden');renderAdmin();}
  async function renderAdmin(){await loadPending();$('#pendingBadge').textContent=pending.length;renderPending();renderAdminCatalog();switchAdminTab(adminTab);}
  function switchAdminTab(tab){adminTab=tab;$$('[data-admin-tab]').forEach(b=>b.classList.toggle('active',b.dataset.adminTab===tab));$('#adminPending').classList.toggle('hidden',tab!=='pending');$('#adminManage').classList.toggle('hidden',tab!=='manage');}
  $$('[data-admin-tab]').forEach(b=>b.addEventListener('click',()=>switchAdminTab(b.dataset.adminTab)));
  function renderPending(){
    const target=$('#adminPending');
    if(!pending.length){target.innerHTML='<p class="form-note">Brak oczekujących zgłoszeń.</p>';return;}
    target.innerHTML=pending.map(x=>`<div class="admin-entry">${x.imageData?`<img class="admin-entry-thumb" src="${escapeHTML(x.imageData)}" alt="Podgląd">`:''}<div><strong>${escapeHTML(x.name)}</strong><small>${escapeHTML(x.brand)} · ${escapeHTML(x.author)} · ID ${escapeHTML(x.assetId)}</small></div><div class="admin-entry-actions"><button class="mini-action approve" data-approve="${escapeHTML(x.id)}">AKCEPTUJ</button><button class="mini-action reject" data-reject="${escapeHTML(x.id)}">ODRZUĆ</button></div></div>`).join('');
    $$('[data-approve]',target).forEach(b=>b.addEventListener('click',()=>moderate(b.dataset.approve,'approved')));
    $$('[data-reject]',target).forEach(b=>b.addEventListener('click',()=>moderate(b.dataset.reject,'rejected')));
  }
  async function moderate(id,status){
    const {error}=await supabase.from('decals').update({status}).eq('id',id);
    if(error){toast('Moderacja nie powiodła się: '+error.message,'error');return;}
    toast(status==='approved'?'Okleina opublikowana dla wszystkich graczy.':'Zgłoszenie odrzucone.');
    await loadCatalog();await renderAdmin();
  }
  function renderAdminCatalog(){
    const target=$('#adminCatalogList');
    target.innerHTML=catalog.map(x=>`<div class="admin-entry">${x.imageData?`<img class="admin-entry-thumb" src="${escapeHTML(x.imageData)}" alt="Podgląd">`:''}<div><strong>${escapeHTML(x.name)}</strong><small>${escapeHTML(x.brand)} · ${escapeHTML(x.author)} · ID ${escapeHTML(x.assetId)}</small></div><div class="admin-entry-actions"><button class="mini-action edit" data-edit="${escapeHTML(x.id)}">EDYTUJ</button><button class="mini-action reject" data-delete="${escapeHTML(x.id)}">USUŃ</button></div></div>`).join('');
    $$('[data-edit]',target).forEach(b=>b.addEventListener('click',()=>{const x=catalog.find(y=>y.id===b.dataset.edit),f=$('#adminEditForm');f.elements.id.value=x.id;f.elements.name.value=x.name;f.elements.brand.value=x.brand;f.elements.author.value=x.author;f.elements.assetId.value=x.assetId;f.elements.tags.value=(x.tags||[]).join(', ');f.elements.number.value=x.number||'';f.dataset.oldImage=x.imageData||'';f.classList.remove('hidden');f.scrollIntoView({behavior:'smooth',block:'nearest'});}));
    $$('[data-delete]',target).forEach(b=>b.addEventListener('click',async()=>{if(!confirm('Usunąć projekt z katalogu?'))return;const {error}=await supabase.from('decals').delete().eq('id',b.dataset.delete);if(error){toast(error.message,'error');return;}await loadCatalog();await renderAdmin();toast('Projekt usunięty.');}));
  }
  $('#adminEditForm').addEventListener('submit',async e=>{
    e.preventDefault();const f=e.currentTarget,v=new FormData(f),id=v.get('id'),assetId=String(v.get('assetId')).trim();
    if(!/^\d{5,20}$/.test(assetId)){toast('Asset ID musi mieć 5–20 cyfr.','error');return;}
    try{const imageUrl=await uploadImage(v.get('imageFile'));const patch={name:String(v.get('name')).trim(),brand:String(v.get('brand')),author:String(v.get('author')).trim(),asset_id:assetId,tags:String(v.get('tags')||'').split(',').map(x=>x.trim()).filter(Boolean),number:String(v.get('number')||'').trim()};if(imageUrl)patch.image_url=imageUrl;
      const {error}=await supabase.from('decals').update(patch).eq('id',id);if(error)throw error;
      f.classList.add('hidden');f.reset();$('#editImagePreview').classList.add('hidden');await loadCatalog();await renderAdmin();toast('Zmiany zapisane w chmurze.');
    }catch(err){toast(err.message,'error');}
  });
  $('#cancelEditBtn').addEventListener('click',()=>{$('#adminEditForm').classList.add('hidden');$('#adminEditForm').reset();});
  $('#adminAddForm').addEventListener('submit',async e=>{
    e.preventDefault();const f=e.currentTarget,v=new FormData(f),assetId=String(v.get('assetId')).trim();
    if(!/^\d{5,20}$/.test(assetId)){toast('Asset ID musi mieć 5–20 cyfr.','error');return;}
    try{const imageUrl=await uploadImage(v.get('imageFile'));const {error}=await supabase.from('decals').insert({name:String(v.get('name')).trim(),brand:String(v.get('brand')),author:String(v.get('author')).trim(),asset_id:assetId,image_url:imageUrl,tags:String(v.get('tags')||'').split(',').map(x=>x.trim()).filter(Boolean),number:String(catalog.length+1).padStart(2,'0'),status:'approved',submitted_by:session.id});if(error)throw error;
      f.reset();$('#addImagePreview').classList.add('hidden');await loadCatalog();await renderAdmin();toast('Projekt dodany do wspólnego katalogu.');
    }catch(err){toast(err.message,'error');}
  });
  $('#exportDataBtn').addEventListener('click',()=>{const payload={brands,decals:catalog,facts:window.RBL_DATA.facts};const blob=new Blob([`window.RBL_DATA = ${JSON.stringify(payload,null,2)};`],{type:'text/javascript'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='data.js';a.click();URL.revokeObjectURL(url);toast('Wyeksportowano kopię katalogu.');});
  $('#adminLogoutBtn').addEventListener('click',()=>closeModal('adminModal'));

  async function loadRanking(){
    const {data,error}=await supabase.from('ranking').select('user_id,points,users(username,rank)').order('points',{ascending:false}).limit(10);
    if(error){console.warn(error);return;}
    ranking=data||[];renderRanking();
  }
  $('#topPeopleBtn').addEventListener('click',async()=>{await loadRanking();openModal('topModal');});
  function renderRanking(){
    $('#rankingList').innerHTML=ranking.length?ranking.map((x,i)=>`<div class="rank-row"><span class="rank-position">${String(i+1).padStart(2,'0')}</span><span class="rank-name">${escapeHTML(x.users?.username||'RIDER')} <small>${escapeHTML(x.users?.rank||'Rider')}</small></span><b class="rank-points">${Number(x.points)||0} PKT</b></div>`).join(''):'<p class="form-note">Ranking jest jeszcze pusty. Zaloguj się i kopiuj ID oklein.</p>';
  }
  async function saveGarage(e){
    e.preventDefault();if(!session){toast('Zaloguj się, aby zapisać garaż.','error');return;}
    const f=new FormData(e.currentTarget),patch={roblox_nick:String(f.get('robloxNick')).trim(),main_bike:String(f.get('mainBike')).trim(),discord_tag:String(f.get('discordTag')).trim()};
    const {error}=await supabase.from('users').update(patch).eq('id',session.id);
    if(error){toast('Nie udało się zapisać garażu: '+error.message,'error');return;}
    await loadProfile();toast('Garaż zsynchronizowany z Supabase.');
  }
  $('#garageForm').addEventListener('submit',saveGarage);
  function renderGarage(){
    $('#garageNick').textContent=profile?.username||'GOŚĆ';
    $('#garageBike').textContent=profile?`${profile.roblox_nick||'Nick Roblox nieustawiony'} · ${profile.main_bike||'Motocykl nieustawiony'} · ${profile.discord_tag||'Discord nieustawiony'}`:'Zaloguj się, aby uzupełnić garaż.';
    $('#garageRank').textContent=`RANGA: ${profile?.rank||'—'}`;
    $('#garageForm').querySelectorAll('input,button').forEach(x=>x.disabled=!profile);
  }

  function tickRally(){
    const diff=Math.max(0,new Date(RALLY_DATE).getTime()-Date.now()),units=[86400000,3600000,60000,1000],ids=['cdDays','cdHours','cdMinutes','cdSeconds'];let rest=diff;
    units.forEach((unit,i)=>{const n=Math.floor(rest/unit);rest%=unit;$('#'+ids[i]).textContent=String(n).padStart(2,'0');});
    $('#rallyName').textContent=RALLY_NAME;$('#rallyLocation').textContent='Mapa / miejsce: '+RALLY_LOCATION;
  }
  tickRally();setInterval(tickRally,1000);

  function drawMemberCard(){
    const canvas=$('#memberCanvas'),ctx=canvas.getContext('2d'),nick=($('#cardNick').value.trim()||profile?.username||'RBL RIDER').toUpperCase(),style=$('#cardStyle').value;
    const palettes={violet:['#130b20','#7c3aed','#d8b4fe'],dark:['#08080d','#252532','#f4f0fa'],silver:['#11151c','#64748b','#e2e8f0']},p=palettes[style];
    const g=ctx.createLinearGradient(0,0,1000,560);g.addColorStop(0,p[0]);g.addColorStop(1,p[1]);ctx.fillStyle=g;ctx.fillRect(0,0,1000,560);
    ctx.strokeStyle=p[2]+'55';ctx.lineWidth=2;for(let i=-500;i<1500;i+=55){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+560,560);ctx.stroke();}
    ctx.strokeStyle=p[2];ctx.lineWidth=4;ctx.strokeRect(28,28,944,504);
    ctx.fillStyle=p[2];ctx.font='bold 34px Arial';ctx.fillText('RBL / REBEL TEAM',70,100);
    ctx.font='bold 92px Arial';ctx.fillText(nick.slice(0,18),70,285);
    ctx.font='bold 28px Arial';ctx.fillText('OFFICIAL COMMUNITY MEMBER',72,355);
    ctx.font='22px Arial';ctx.fillText(`RANK: ${profile?.rank||'RIDER'}     BIKE: ${profile?.main_bike||'BIKELIFE'}`,72,425);
    ctx.font='18px Arial';ctx.fillText(`MEMBER ID: ${(profile?.id||'RBL-0000').slice(0,18)}  •  ${new Date().getFullYear()}`,72,480);
    ctx.textAlign='right';ctx.font='bold 42px Arial';ctx.fillText('RBL',920,485);ctx.textAlign='left';
  }
  $('#generateCardBtn').addEventListener('click',drawMemberCard);
  $('#downloadCardBtn').addEventListener('click',()=>{drawMemberCard();const a=document.createElement('a');a.download='RBL-member-card.png';a.href=$('#memberCanvas').toDataURL('image/png');a.click();toast('Wizytówka PNG gotowa.');});

  const chatReplies=[
    {keys:['discord','serwer','ekipa'],reply:'Dane o społeczności znajdziesz w sekcji EKIPA. Logowanie odbywa się wyłącznie kontem RBL.'},
    {keys:['id','skopi','kopi','asset'],reply:'Kliknij KOPIUJ ID na karcie okleiny albo dodaj projekty do Mojej Paczki i skopiuj wszystkie ID naraz.'},
    {keys:['oklein','katalog','mark','szuka'],reply:'W sekcji OKLEINY filtruj projekty według marki lub szukaj po nazwie i autorze. Katalog synchronizuje się na żywo.'},
    {keys:['zgłoś','zglos','dodać','dodac','projekt'],reply:'Zaloguj się, kliknij ZGŁOŚ OKLEINĘ i wyślij projekt do moderacji. Po zatwierdzeniu będzie widoczny dla wszystkich.'},
    {keys:['konto','log','rejestr'],reply:'Zaloguj się nickiem i hasłem RBL. Profil i garaż są zapisane w chmurze Supabase.'}
  ];
  function addChatMessage(text,type){const n=document.createElement('div');n.className=`chat-message ${type}`;n.textContent=text;$('#chatMessages').append(n);$('#chatMessages').scrollTop=$('#chatMessages').scrollHeight;}
  function answerChat(message){const found=chatReplies.find(x=>x.keys.some(k=>message.toLowerCase().includes(k)));return found?.reply||'Mogę pomóc z katalogiem, paczką ID, garażem, rankingiem, wizytówką i zgłoszeniami RBL.';}
  $('#chatLauncher').addEventListener('click',()=>{$('#chatWindow').classList.toggle('hidden');if(!$('#chatWindow').classList.contains('hidden'))$('#chatInput').focus();});
  $('#chatClose').addEventListener('click',()=>$('#chatWindow').classList.add('hidden'));
  $$('.chat-suggestions button').forEach(b=>b.addEventListener('click',()=>{const m=b.dataset.chat;addChatMessage(m,'user');setTimeout(()=>addChatMessage(answerChat(m),'bot'),180);}));
  $('#chatForm').addEventListener('submit',e=>{e.preventDefault();const i=$('#chatInput'),m=i.value.trim();if(!m)return;addChatMessage(m,'user');i.value='';setTimeout(()=>addChatMessage(answerChat(m),'bot'),180);});

  $('#menuToggle').addEventListener('click',()=>{const nav=$('#mainNav'),opened=nav.classList.toggle('open');$('#menuToggle').setAttribute('aria-expanded',String(opened));});
  $$('#mainNav a').forEach(a=>a.addEventListener('click',()=>{$('#mainNav').classList.remove('open');$('#menuToggle').setAttribute('aria-expanded','false');}));
  const observer=('IntersectionObserver'in window)?new IntersectionObserver(entries=>entries.forEach(x=>{if(x.isIntersecting){x.target.classList.add('is-visible');observer.unobserve(x.target);}}),{threshold:.12}):null;
  $$('.reveal').forEach(x=>observer?observer.observe(x):x.classList.add('is-visible'));
  const progress=$('#scrollProgress');let scrollQueued=false;
  const updateProgress=()=>{const max=document.documentElement.scrollHeight-window.innerHeight;if(progress)progress.style.transform=`scaleX(${max>0?window.scrollY/max:0})`;scrollQueued=false;};
  window.addEventListener('scroll',()=>{if(!scrollQueued){scrollQueued=true;requestAnimationFrame(updateProgress);}},{passive:true});updateProgress();
  const pointerGlow=$('#pointerGlow');
  if(pointerGlow&&matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.body.classList.add('has-pointer');let queued=false,x=0,y=0;window.addEventListener('pointermove',e=>{x=e.clientX;y=e.clientY;if(!queued){queued=true;requestAnimationFrame(()=>{pointerGlow.style.transform=`translate3d(${x-160}px,${y-160}px,0)`;queued=false;});}},{passive:true});}
  const refreshReveal=()=>$$('.reveal:not(.is-visible)').forEach(x=>{if(x.getBoundingClientRect().top<innerHeight*.9)x.classList.add('is-visible');});
  window.addEventListener('scroll',refreshReveal,{passive:true});
  if(matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){document.addEventListener('pointermove',e=>{const c=e.target.closest('.decal-card,.fact-card,.crew-card');if(!c)return;const r=c.getBoundingClientRect();c.style.setProperty('--tilt-x',`${-((e.clientY-r.top)/r.height-.5)*2.2}deg`);c.style.setProperty('--tilt-y',`${((e.clientX-r.left)/r.width-.5)*2.2}deg`);},{passive:true});}
  async function refreshAll(){await loadProfile();await loadCatalog();await loadRanking();if(profile?.role===ADMIN_ROLE)await renderAdmin();}
  function subscribeRealtime(){
    supabase.channel('rbl-live')
      .on('postgres_changes',{event:'*',schema:'public',table:'decals'},async()=>{await loadCatalog();if(profile?.role===ADMIN_ROLE)await renderAdmin();})
      .on('postgres_changes',{event:'*',schema:'public',table:'ranking'},loadRanking)
      .on('postgres_changes',{event:'*',schema:'public',table:'users'},async payload=>{if(session&&payload.new?.id===session.id)await loadProfile();await loadRanking();})
      .subscribe();
  }
  $('#year').textContent=new Date().getFullYear();
  fillBrandSelects();renderFilters();renderFacts();renderPack();renderGarage();
  supabase.auth.onAuthStateChange(()=>{setTimeout(()=>loadProfile(),0);});
  refreshAll().then(subscribeRealtime);
})();