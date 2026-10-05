const API='https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-lead-api';
const AI='https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-lead-ai';
const tg=window.Telegram?.WebApp; if(tg){tg.ready();tg.expand();tg.setHeaderColor('#f5fbfb');tg.setBackgroundColor('#f5fbfb')}
const initData=()=>tg?.initData||''; const el=()=>document.getElementById('screen');
async function api(path,opt={}){const h={'content-type':'application/json','x-telegram-init-data':initData(),...(opt.headers||{})};const r=await fetch(`${API}/${path}`,{...opt,headers:h});let j={};try{j=await r.json()}catch{};if(!r.ok)throw Object.assign(new Error(j.message||j.detail||j.error||'Ошибка'),{status:r.status,data:j});return j}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function errMsg(e){const k=e?.data?.error||'';const raw=String(e?.data?.detail||e?.message||'');if(e?.status===429||/rate.?limit|over_email_send_rate_limit/i.test(raw))return 'Код уже запрошен. Подождите около минуты и повторите отправку.';return ({telegram_not_configured:'Telegram-бот ещё не подключён. Нужен Bot Token.',telegram_auth_failed:'Откройте приложение из Telegram-бота.',registration_required:'Сначала зарегистрируйтесь.',atom_email_required:'Нужна корпоративная почта @atom.team.',invalid_code:'Неверный или просроченный код.',email_already_used:'Эта корпоративная почта уже привязана к другому Telegram.',email_send_failed:'Не удалось отправить код. Подождите около минуты и попробуйте ещё раз.'})[k]||e.message||'Ошибка'}

async function completeFromHash(){try{const p=new URLSearchParams(location.hash.replace(/^#/,'')||'');const token=p.get('access_token');if(!token)return false;const x=await api('email-complete',{method:'POST',headers:{authorization:`Bearer ${token}`},body:'{}'});history.replaceState(null,'',location.pathname);el().innerHTML=`<div class="success"><h2>✅ Почта подтверждена</h2><p>Регистрация завершена. Вернитесь в Telegram и откройте ATOM Lead.</p></div>`;return true}catch(e){return false}}
async function boot(){try{const x=await api('me');home(x.user)}catch(e){if(e.status===403)register();else if(e?.data?.error==='telegram_not_configured')setup();else register()}}
function setup(){el().innerHTML=`<div class="card"><h1>ATOM Lead готов к запуску</h1><p class="hint">Backend, база и Google Sheets уже подключены. Для входа из Telegram осталось добавить Bot Token.</p><div class="notice">После подключения токена эта страница автоматически станет рабочим Mini App.</div></div>`}
function register(){el().innerHTML=`<div class="card"><h1>Регистрация</h1><p class="hint">Доступ только сотрудникам с подтверждённой корпоративной почтой <b>@atom.team</b>.</p><label>ФИО</label><input id="full_name" placeholder="Иван Корытник"><label>Корпоративная почта</label><input id="email" type="email" placeholder="name@atom.team"><div class="spacer"></div><button class="btn full" onclick="requestCode()">Отправить письмо для подтверждения</button><div id="regmsg" class="spacer"></div></div>`}
async function requestCode(){const m=document.getElementById('regmsg');m.innerHTML='';try{const full_name=document.getElementById('full_name').value.trim(),email=document.getElementById('email').value.trim();await api('email-request',{method:'POST',body:JSON.stringify({full_name,email})});m.innerHTML=`<div class="notice">Письмо отправлено на <b>${esc(email)}</b>. Откройте письмо и нажмите ссылку подтверждения. После этого вернитесь в Telegram и заново откройте ATOM Lead.</div>`}catch(e){m.innerHTML=`<div class="error">${esc(errMsg(e))}</div>`}}
async function verifyCode(){const m=document.getElementById('regmsg');try{const full_name=document.getElementById('full_name').value.trim(),email=document.getElementById('email').value.trim(),code=document.getElementById('code').value.trim();const x=await api('email-verify',{method:'POST',body:JSON.stringify({full_name,email,code})});home(x.user)}catch(e){m.insertAdjacentHTML('beforeend',`<div class="error">${esc(errMsg(e))}</div>`)}}
function home(user){el().innerHTML=`<div class="card"><h1>Добро пожаловать, ${esc(user.full_name||'')}</h1><p class="hint">${esc(user.corporate_email||'')}</p></div><div class="grid"><button class="btn" onclick="leadForm(false)">➕ Зарегистрировать лид</button><button class="btn" onclick="leadForm(true)">⚡ Быстрый лид</button><button class="btn" onclick="cardLead()">📷 По фото визитки</button><button class="btn" onclick="voiceLead()">🎙️ Записать голосом</button><button class="btn secondary" onclick="events()">🏢 Мероприятие</button><button class="btn secondary" onclick="searchLeads()">🔎 Найти контакт</button><button class="btn secondary" onclick="listLeads()">📊 Зарегистрированные</button><button class="btn secondary" onclick="profile()">👤 Мой профиль</button></div>`}

async function aiJson(body){
  const r=await fetch(AI,{method:'POST',headers:{'content-type':'application/json','x-telegram-init-data':initData()},body:JSON.stringify(body)});
  let j={};try{j=await r.json()}catch{}
  if(!r.ok)throw new Error(j.detail||j.error||'Ошибка распознавания');
  return j;
}
async function aiForm(form){
  const r=await fetch(AI,{method:'POST',headers:{'x-telegram-init-data':initData()},body:form});
  let j={};try{j=await r.json()}catch{}
  if(!r.ok)throw new Error(j.detail||j.error||'Ошибка распознавания');
  return j;
}
function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result||'').split(',')[1]||'');
    reader.onerror=reject;
    reader.readAsDataURL(file);
  });
}
function applyDraft(d){
  leadForm(false);
  l_name.value=d.contact_name||'';
  l_phone.value=d.phone||'';
  l_company.value=d.company||'';
  l_position.value=d.position||'';
  l_email.value=d.email||'';
  l_type.value=d.client_type||'';
  l_potential.value=d.potential_cars??'';
  l_interest.value=d.interest||'';
  l_comment.value=d.comment||'';
  document.querySelectorAll('[data-need]').forEach(x=>x.classList.toggle('active',(d.needs||[]).includes(x.dataset.need)));
  const extra=[];
  if(d.website)extra.push('Сайт: '+d.website);
  if(d.next_step)extra.push('Следующий шаг: '+d.next_step+(d.next_step_date?' ('+d.next_step_date+')':''));
  if(extra.length&&!l_comment.value.includes(extra[0]))l_comment.value=[l_comment.value,...extra].filter(Boolean).join('\n');
  const msg=document.getElementById('leadmsg');
  if(msg)msg.innerHTML='<div class="notice">Данные распознаны автоматически. Проверьте их перед регистрацией лида.</div>';
}
function cardLead(){
  el().innerHTML=`<div class="card"><h2>📷 Лид по визитке</h2><p class="hint">Сфотографируйте визитку или выберите фото. Я распознаю ФИО, компанию, должность, телефон, e-mail и сайт.</p><input id="card_file" type="file" accept="image/*" capture="environment"><div class="spacer"></div><button class="btn full" onclick="scanCard()">Распознать визитку</button><div class="spacer"></div><button class="btn secondary full" onclick="homeFromApi()">← Главное меню</button><div id="cardmsg"></div></div>`;
}
async function scanCard(){
  const m=document.getElementById('cardmsg');const file=document.getElementById('card_file').files?.[0];
  if(!file){m.innerHTML='<div class="error">Сначала сделайте фото или выберите изображение.</div>';return}
  m.innerHTML='<div class="notice">Распознаю визитку…</div>';
  try{
    const image_base64=await fileToBase64(file);
    const x=await aiJson({action:'card',image_base64,mime_type:file.type||'image/jpeg'});
    applyDraft(x.lead||{});
  }catch(e){m.innerHTML=`<div class="error">${esc(e.message||'Ошибка распознавания')}</div>`}
}
let voiceRecorder=null,voiceChunks=[],voiceStream=null;
function voiceLead(){
  el().innerHTML=`<div class="card"><h2>🎙️ Лид голосом</h2><p class="hint">Нажмите «Начать запись» и продиктуйте данные клиента и итоги разговора. Например: «Иван Петров, компания Альфа, директор по закупкам, телефон…, интерес 50 автомобилей, нужен тест-драйв».</p><button id="voice_start" class="btn full" onclick="startVoice()">🎙️ Начать запись</button><div class="spacer"></div><button id="voice_stop" class="btn secondary full" onclick="stopVoice()" disabled>⏹ Остановить и распознать</button><div class="spacer"></div><button class="btn secondary full" onclick="homeFromApi()">← Главное меню</button><div id="voicemsg"></div></div>`;
}
async function startVoice(){
  const m=document.getElementById('voicemsg');
  try{
    voiceStream=await navigator.mediaDevices.getUserMedia({audio:true});
    const opts=MediaRecorder.isTypeSupported('audio/webm;codecs=opus')?{mimeType:'audio/webm;codecs=opus'}:{};
    voiceRecorder=new MediaRecorder(voiceStream,opts);voiceChunks=[];
    voiceRecorder.ondataavailable=e=>{if(e.data?.size)voiceChunks.push(e.data)};
    voiceRecorder.start();
    voice_start.disabled=true;voice_stop.disabled=false;
    m.innerHTML='<div class="notice">🔴 Запись идёт… Говорите данные клиента и результат разговора.</div>';
  }catch(e){m.innerHTML='<div class="error">Не удалось получить доступ к микрофону. Разрешите микрофон для Telegram и попробуйте снова.</div>'}
}
async function stopVoice(){
  const m=document.getElementById('voicemsg');
  if(!voiceRecorder||voiceRecorder.state==='inactive')return;
  voice_stop.disabled=true;m.innerHTML='<div class="notice">Обрабатываю голос…</div>';
  const done=new Promise(resolve=>voiceRecorder.addEventListener('stop',resolve,{once:true}));
  voiceRecorder.stop();await done;
  voiceStream?.getTracks().forEach(t=>t.stop());
  try{
    const blob=new Blob(voiceChunks,{type:voiceRecorder.mimeType||'audio/webm'});
    const form=new FormData();form.append('action','voice');form.append('audio',blob,'lead.webm');
    const x=await aiForm(form);
    applyDraft(x.lead||{});
    const msg=document.getElementById('leadmsg');
    if(msg&&x.transcript)msg.insertAdjacentHTML('beforeend',`<details><summary>Расшифровка голоса</summary><p class="hint">${esc(x.transcript)}</p></details>`);
  }catch(e){m.innerHTML=`<div class="error">${esc(e.message||'Ошибка распознавания голоса')}</div>`}
}

async function profile(){const x=await api('me');el().innerHTML=`<div class="card"><h2>Мой профиль</h2><p><b>${esc(x.user.full_name)}</b></p><p>${esc(x.user.corporate_email)}</p><p class="muted">Telegram ID: ${esc(x.user.telegram_id)}</p><div class="spacer"></div><button class="btn secondary full" onclick="homeFromApi()">← Главное меню</button></div>`}
async function homeFromApi(){const x=await api('me');home(x.user)}
async function events(){const x=await api('events');const cards=(x.events||[]).map(v=>`<button class="btn ${v.id===x.currentEventId?'active':''} full" onclick="selectEvent('${v.id}')">${esc(v.name)}<br><span class="muted">${esc(v.event_date||'')} ${esc(v.city||'')}</span></button>`).join('<div class="spacer"></div>');el().innerHTML=`<div class="card"><h2>Мероприятие</h2>${cards||'<p class="hint">Пока мероприятий нет.</p>'}<div class="spacer"></div><button class="btn full" onclick="newEvent()">＋ Создать мероприятие</button><div class="spacer"></div><button class="btn secondary full" onclick="homeFromApi()">← Главное меню</button></div>`}
async function selectEvent(id){await api('select-event',{method:'POST',body:JSON.stringify({event_id:id})});homeFromApi()}
function newEvent(){el().innerHTML=`<div class="card"><h2>Новое мероприятие</h2><label>Название</label><input id="ev_name"><label>Дата</label><input id="ev_date" type="date"><label>Город</label><input id="ev_city"><label>Площадка</label><input id="ev_venue"><div class="spacer"></div><button class="btn full" onclick="saveEvent()">Создать и выбрать</button><div class="spacer"></div><button class="btn secondary full" onclick="events()">← Назад</button><div id="evmsg"></div></div>`}
async function saveEvent(){try{await api('events',{method:'POST',body:JSON.stringify({name:ev_name.value.trim(),event_date:ev_date.value||null,city:ev_city.value.trim(),venue:ev_venue.value.trim()})});homeFromApi()}catch(e){evmsg.innerHTML=`<div class="error">${esc(errMsg(e))}</div>`}}
const TYPES=['Корпоративный клиент','Таксопарк','Каршеринг','Лизинговая компания','Государственная компания','Партнёр','Другое'];
const NEEDS=['Покупка автомобилей','Корпоративный автопарк','Такси','Каршеринг','Лизинг','Тест-драйв','Партнёрство','Другое'];
const INTEREST=['Высокий','Средний','Предварительный','Не определён'];
function leadForm(fast){const needs=NEEDS.map(v=>`<button type="button" class="chip" data-need="${esc(v)}" onclick="this.classList.toggle('active')">${esc(v)}</button>`).join('');el().innerHTML=`<div class="card"><h2>${fast?'⚡ Быстрый лид':'➕ Регистрация лида'}</h2><label>ФИО</label><input id="l_name" placeholder="Алексей Смирнов"><label>Телефон</label><input id="l_phone" inputmode="tel" placeholder="89161234567"><label>Компания</label><input id="l_company" placeholder="ООО Альфа">${fast?'':`<label>Должность</label><input id="l_position"><label>E-mail</label><input id="l_email" type="email"><label>Тип клиента</label><select id="l_type"><option value=""></option>${TYPES.map(x=>`<option>${esc(x)}</option>`).join('')}</select><label>Потребность</label><div class="chips">${needs}</div><label>Потенциал, авто</label><input id="l_potential" inputmode="numeric" placeholder="30"><label>Интерес</label><select id="l_interest"><option value=""></option>${INTEREST.map(x=>`<option>${esc(x)}</option>`).join('')}</select>`}<label>Комментарий</label><textarea id="l_comment" placeholder="Что обсуждали"></textarea><div id="dups"></div><div class="spacer"></div><button class="btn full" onclick="saveLead(${fast})">✅ Зарегистрировать</button><div class="spacer"></div><button class="btn secondary full" onclick="homeFromApi()">← Главное меню</button><div id="leadmsg"></div></div>`;l_phone.addEventListener('blur',()=>checkDup())}
async function checkDup(){try{const x=await api('duplicates',{method:'POST',body:JSON.stringify({phone:l_phone.value,contact_name:l_name.value,company:l_company.value,email:window.l_email?.value||''})});if(x.duplicates?.length)dups.innerHTML=`<div class="notice">⚠️ Возможно, контакт уже зарегистрирован: ${x.duplicates.map(d=>`<b>${esc(d.contact_name||'')} ${esc(d.company||'')}</b> ${esc(d.phone||'')}`).join('<br>')}</div>`;else dups.innerHTML=''}catch{}}
async function saveLead(fast){const msg=document.getElementById('leadmsg');try{const needs=fast?[]:[...document.querySelectorAll('[data-need].active')].map(x=>x.dataset.need);const body={contact_name:l_name.value.trim(),phone:l_phone.value.trim(),company:l_company.value.trim(),position:fast?'':l_position.value.trim(),email:fast?'':l_email.value.trim(),client_type:fast?'':l_type.value,needs,potential_cars:fast?null:(l_potential.value?Number(l_potential.value):null),interest:fast?'':l_interest.value,comment:l_comment.value.trim()};const x=await api('leads',{method:'POST',body:JSON.stringify(body)});el().innerHTML=`<div class="success"><h2>✅ Лид зарегистрирован</h2><p><b>${esc(x.lead.lead_code)}</b></p><p>${x.lead.google_sync_status==='synced'?'☁️ Google Sheets: синхронизировано':'⚠️ Google Sheets: ожидает повторной синхронизации'}</p></div><div class="spacer"></div><button class="btn full" onclick="leadForm(${fast})">＋ Следующий лид</button><div class="spacer"></div><button class="btn secondary full" onclick="homeFromApi()">Главное меню</button>`}catch(e){msg.innerHTML=`<div class="error">${esc(errMsg(e))}</div>`}}
async function listLeads(q=''){const x=await api('leads'+(q?`?q=${encodeURIComponent(q)}`:''));const rows=(x.leads||[]).map(d=>`<div class="lead"><b>${esc(d.contact_name||d.company||'Без имени')}</b><span>${esc(d.company||'')} · ${esc(d.phone||'')}</span><br><small class="muted">${esc(d.lead_code)} · ${esc(d.google_sync_status)}</small></div>`).join('');el().innerHTML=`<div class="card"><h2>Зарегистрированные лиды</h2>${rows||'<p class="hint">Лидов пока нет.</p>'}<div class="spacer"></div><button class="btn secondary full" onclick="homeFromApi()">← Главное меню</button></div>`}
function searchLeads(){el().innerHTML=`<div class="card"><h2>Поиск контакта</h2><input id="search_q" placeholder="ФИО, компания, телефон, e-mail"><div class="spacer"></div><button class="btn full" onclick="listLeads(search_q.value.trim())">Найти</button><div class="spacer"></div><button class="btn secondary full" onclick="homeFromApi()">← Главное меню</button></div>`}
completeFromHash().then(done=>{if(!done)boot()});