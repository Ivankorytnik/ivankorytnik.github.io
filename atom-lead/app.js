const API='https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-lead-api';
const tg=window.Telegram?.WebApp; if(tg){tg.ready();tg.expand();tg.setHeaderColor('#f5fbfb');tg.setBackgroundColor('#f5fbfb')}
const initData=()=>tg?.initData||''; const el=()=>document.getElementById('screen');
let currentRecognizedText='';
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


function normalizePhoneLocal(v){
  let s=String(v||'')
    .replace(/[ОOоo]/g,'0')
    .replace(/[ІIil|]/g,'1');
  let d=s.replace(/\D/g,'');
  if(d.length>11){
    const m=d.match(/(?:7|8)?(\d{10})$/);
    if(m)d=(d.startsWith('7')||d.startsWith('8')?d[0]:'8')+m[1];
  }
  if(d.length===10)d='8'+d;
  if(d.length===11&&d.startsWith('7'))d='8'+d.slice(1);
  return d.length===11&&d.startsWith('8')?d:'';
}
function firstMatch(text,re){
  const m=String(text||'').match(re);
  return m?String(m[1]||m[0]||'').trim():'';
}
function smartLines(text){
  return String(text||'').split(/\r?\n/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
}

function sanitizeCardLine(line){
  return String(line||'')
    .replace(/[‐‑‒–—]/g,'-')
    .replace(/\s+([,.;:])/g,'$1')
    .replace(/[|¦]/g,'I')
    .replace(/\s{2,}/g,' ')
    .trim();
}
function usefulCardLines(text){
  const seen=new Set(),out=[];
  for(const src of smartLines(text)){
    const line=sanitizeCardLine(src);
    if(line.length<2)continue;
    const useful=(line.match(/[A-Za-zА-Яа-яЁё0-9@.+()\-]/g)||[]).length;
    const weird=(line.match(/[^\sA-Za-zА-Яа-яЁё0-9@.,:+()\-\/&«»"'№]/g)||[]).length;
    if(useful/Math.max(1,line.length)<0.58)continue;
    if(weird/Math.max(1,line.length)>0.12)continue;
    const key=line.toLowerCase().replace(/[^a-zа-яё0-9@]+/gi,'');
    if(key.length<2||seen.has(key))continue;
    seen.add(key);out.push(line);
  }
  return out;
}
function stripCardContacts(line){
  return sanitizeCardLine(line)
    .replace(/(?:\+?7|8)[\s\-()0-9ОOІI|l]{9,}/g,' ')
    .replace(/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/ig,' ')
    .replace(/(?:https?:\/\/)?(?:www\.)?[a-z0-9а-яё\-]+(?:\.[a-z0-9а-яё\-]+)+[^\s]*/ig,' ')
    .replace(/\s+/g,' ').trim();
}


function normalizeEmailOcr(v){
  let s=String(v||'').replace(/\s+/g,'').trim();
  const map={'А':'A','а':'a','В':'B','в':'b','С':'C','с':'c','Е':'E','е':'e','Н':'H','н':'h','К':'K','к':'k','М':'M','м':'m','О':'O','о':'o','Р':'P','р':'p','Т':'T','т':'t','Х':'X','х':'x','У':'Y','у':'y'};
  s=s.replace(/[АаВвСсЕеНнКкМмОоРрТтХхУу]/g,ch=>map[ch]||ch).toLowerCase();
  s=s.replace(/[;,]/g,'.').replace(/\.{2,}/g,'.');
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(s)?s:'';
}
function extractEmailOcr(text){
  const s=String(text||'').replace(/\s*@\s*/g,'@').replace(/\s*\.\s*(?=[A-Za-zА-Яа-яЁё]{2,8}\b)/g,'.');
  const candidates=s.match(/[A-Za-zА-Яа-яЁё0-9._%+\-]{1,64}@[A-Za-zА-Яа-яЁё0-9.\-]{2,100}\.[A-Za-zА-Яа-яЁё]{2,8}/g)||[];
  for(const x of candidates){const e=normalizeEmailOcr(x);if(e)return e}
  return '';
}
function normalizeWebsiteOcr(v){
  let s=String(v||'').replace(/\s+/g,'').trim().replace(/[;,]/g,'.').replace(/\.{2,}/g,'.');
  s=s.replace(/^[^a-zа-яё0-9]+/i,'').replace(/[.,;:]+$/,'');
  return s;
}
function coreFieldCount(d){
  return [d&&d.contact_name,d&&d.company,d&&d.position,d&&d.phone,d&&d.email,d&&d.website].filter(Boolean).length;
}
function extractBlockLines(blocks){
  const out=[];
  for(const block of blocks||[]){
    for(const p of block.paragraphs||[]){
      for(const line of p.lines||[]){
        const text=sanitizeCardLine(line.text||'');
        if(!text)continue;
        const b=line.bbox||{};
        out.push({
          text,
          confidence:Number(line.confidence||0),
          x0:Number(b.x0||0),y0:Number(b.y0||0),x1:Number(b.x1||0),y1:Number(b.y1||0),
          height:Math.max(0,Number(b.y1||0)-Number(b.y0||0)),
          width:Math.max(0,Number(b.x1||0)-Number(b.x0||0))
        });
      }
    }
  }
  return out;
}
function inferNameFromMeta(metaLines,alreadyLines){
  const banned=/(ооо|ао|пао|ип|llc|ltd|inc|директор|руководитель|менеджер|тел|моб|phone|email|e-mail|www|http|компания|отдел|департамент|офис|office|москва|moscow|россия|russia)/i;
  const arr=(metaLines||[]).map(x=>{
    const t=stripCardContacts(x.text||'');
    const words=t.split(/\s+/).filter(Boolean);
    let score=0;
    if(x.confidence>=40)score+=x.confidence/20;
    score+=Math.min(8,(x.height||0)/8);
    if(words.length===2)score+=8;
    else if(words.length===3)score+=5;
    if(/^[А-ЯЁA-Z][А-ЯЁA-Zа-яёa-z\-]+(?:\s+[А-ЯЁA-Z][А-ЯЁA-Zа-яёa-z\-]+){1,2}$/.test(t))score+=10;
    if(banned.test(t)||/\d|@|\.ru\b|\.com\b/i.test(t))score-=25;
    if(t.length<5||t.length>60)score-=15;
    return {t,score};
  }).filter(x=>x.t&&x.score>5).sort((a,b)=>b.score-a.score);
  return arr[0]?.t||'';
}
function mergeDraft(base,extra){
  const out={...(base||{})};
  for(const k of ['contact_name','company','position','phone','email','website','client_type','potential_range','interest','next_step','next_step_date']){
    if(!out[k]&&extra&&extra[k])out[k]=extra[k];
  }
  if((out.potential_cars===null||out.potential_cars===undefined||out.potential_cars==='')&&extra&&extra.potential_cars!==null&&extra.potential_cars!==undefined)out.potential_cars=extra.potential_cars;
  out.needs=[...new Set([...(out.needs||[]),...((extra&&extra.needs)||[])])];
  return out;
}
function parseVCardText(raw){
  const s=String(raw||'').trim();
  const out={contact_name:'',company:'',position:'',phone:'',email:'',website:'',client_type:'',needs:[],potential_cars:null,potential_range:'',interest:'',comment:'',next_step:'',next_step_date:''};
  if(/^BEGIN:VCARD/i.test(s)){
    const get=(name)=>{
      const m=s.match(new RegExp('(?:^|\\n)'+name+'(?:;[^:\\n]+)*:([^\\r\\n]+)','i'));
      return m?m[1].trim():'';
    };
    out.contact_name=get('FN')||get('N').split(';').filter(Boolean).reverse().join(' ').trim();
    out.company=get('ORG').replace(/;/g,' ').trim();
    out.position=get('TITLE');
    out.phone=normalizePhoneLocal(get('TEL'));
    out.email=normalizeEmailOcr(get('EMAIL'));
    out.website=normalizeWebsiteOcr(get('URL'));
    return out;
  }
  if(/^MECARD:/i.test(s)){
    const get=(name)=>{const m=s.match(new RegExp(name+':([^;]+)','i'));return m?m[1].trim():''};
    out.contact_name=get('N');
    out.company=get('ORG');
    out.position=get('TITLE');
    out.phone=normalizePhoneLocal(get('TEL'));
    out.email=normalizeEmailOcr(get('EMAIL'));
    out.website=normalizeWebsiteOcr(get('URL'));
    return out;
  }
  if(/^https?:\/\//i.test(s)||/^[\w.-]+\.[a-z]{2,}(?:\/|$)/i.test(s))out.website=normalizeWebsiteOcr(s);
  return out;
}
async function detectCardBarcode(canvas){
  try{
    if(!('BarcodeDetector' in window))return null;
    const formats=await BarcodeDetector.getSupportedFormats();
    if(!formats.includes('qr_code'))return null;
    const det=new BarcodeDetector({formats:['qr_code']});
    const res=await det.detect(canvas);
    return res&&res[0]&&res[0].rawValue?String(res[0].rawValue):null;
  }catch{return null}
}


function normCardKey(s){
  return String(s||'').toLowerCase().replace(/ё/g,'е').replace(/[^a-zа-я0-9]+/gi,' ').replace(/\s+/g,' ').trim();
}
function labelValue(lines,labelRe){
  for(let i=0;i<lines.length;i++){
    const raw=sanitizeCardLine(lines[i]);
    if(!labelRe.test(raw))continue;
    let tail=raw.replace(labelRe,'').replace(/^[\s:;=\-–—|]+/,'').trim();
    if(tail&&tail.length>1)return tail;
    const next=sanitizeCardLine(lines[i+1]||'');
    if(next&&next.length>1)return next;
  }
  return '';
}
function metaForText(metaLines,text){
  const key=normCardKey(text);
  if(!key)return null;
  const hits=(metaLines||[]).filter(x=>{
    const k=normCardKey(x.text);
    return k===key||k.includes(key)||key.includes(k);
  });
  if(!hits.length)return null;
  return hits.sort((a,b)=>(b.height||0)-(a.height||0))[0];
}
function median(nums){
  const a=nums.filter(Number.isFinite).sort((x,y)=>x-y);
  if(!a.length)return 0;
  const m=Math.floor(a.length/2);
  return a.length%2?a[m]:(a[m-1]+a[m])/2;
}
function looksLikePersonName(s){
  const t=stripCardContacts(s);
  const words=t.split(/\s+/).filter(Boolean);
  if(words.length<2||words.length>3||t.length<5||t.length>70)return false;
  if(/\d|@|https?:|www\.|\.ru\b|\.com\b/i.test(t))return false;
  return words.every(w=>/^[А-ЯЁA-Z][А-ЯЁA-Zа-яёa-z\-]{1,30}$/.test(w));
}
function extractPhoneOcr(lines){
  const candidates=[];
  for(const line of lines){
    const matches=String(line).match(/(?:\+?7|8|7)?[\s\-()0-9ОOоoІIil|]{10,26}/g)||[];
    for(const x of matches){
      const p=normalizePhoneLocal(x);
      if(p&&!candidates.includes(p))candidates.push(p);
    }
  }
  return candidates[0]||'';
}
function bestCardName(lines,metaLines){
  const labeled=labelValue(lines,/^(?:фио|ф\.?\s*и\.?\s*о\.?|имя|name|contact(?:\s+person)?|контакт(?:ное\s+лицо)?)\b/i);
  if(looksLikePersonName(labeled))return stripCardContacts(labeled);

  const roleRe=/(директор|руководител|начальник|менеджер|президент|вице[- ]?президент|председател|основател|владелец|партнер|партнёр|director|manager|head|chief|founder|owner|partner|president|chairman|ceo|cfo|coo|cto|cmo|cro|vp\b)/i;
  const companyRe=/(ооо|ао|пао|ип\b|llc|ltd|inc|jsc|group|групп|holding|холдинг|company|компания|банк|bank|taxi|такси|auto|авто|motors|тех|tech|логист|transport|транс)/i;
  const heights=(metaLines||[]).map(x=>Number(x.height||0)).filter(x=>x>0);
  const med=median(heights)||1;

  const scored=[];
  for(let i=0;i<lines.length;i++){
    const t=stripCardContacts(lines[i]);
    if(!looksLikePersonName(t))continue;
    let score=20;
    const words=t.split(/\s+/);
    if(words.length===2)score+=8;
    if(words.length===3)score+=5;
    if(roleRe.test(t)||companyRe.test(t))score-=30;
    const prev=stripCardContacts(lines[i-1]||'');
    const next=stripCardContacts(lines[i+1]||'');
    if(roleRe.test(prev)||roleRe.test(next))score+=12;
    if(companyRe.test(prev)||companyRe.test(next))score+=3;
    const m=metaForText(metaLines,t);
    if(m){
      score+=Math.min(14,(Number(m.height||0)/med)*5);
      score+=Math.min(5,Number(m.confidence||0)/20);
    }
    if(/^[А-ЯЁA-Z\s\-]+$/.test(t))score+=3;
    scored.push({t,score});
  }
  scored.sort((a,b)=>b.score-a.score);
  return scored[0]?.t||'';
}
function bestCardPosition(lines,metaLines){
  const labeled=labelValue(lines,/^(?:должность|position|title|job\s*title|роль|role)\b/i);
  if(labeled)return stripCardContacts(labeled).slice(0,255);

  const roleRe=/(генеральн\w*\s+директор|коммерческ\w*\s+директор|исполнительн\w*\s+директор|финансов\w*\s+директор|техническ\w*\s+директор|директор(?:\s+по)?|руководител\w*|начальник|менеджер|президент|вице[- ]?президент|председател\w*|основател\w*|владелец|партнер|партнёр|director|manager|head\s+of|head\b|chief|founder|owner|partner|president|chairman|ceo|cfo|coo|cto|cmo|cro|vice\s+president|vp\b|business\s+development|sales|commercial)/i;
  const candidates=[];
  for(const line of lines){
    const t=stripCardContacts(line);
    if(!t||t.length>120||!roleRe.test(t))continue;
    let score=20;
    if(t.length<70)score+=5;
    if(/director|manager|head|chief|директор|руководител|начальник|менеджер/i.test(t))score+=7;
    if(/\d|@|https?:|www\./i.test(t))score-=30;
    const m=metaForText(metaLines,t);
    if(m)score+=Math.min(5,Number(m.confidence||0)/20);
    candidates.push({t,score});
  }
  candidates.sort((a,b)=>b.score-a.score);
  return candidates[0]?.t.slice(0,255)||'';
}
function bestCardCompany(lines,metaLines,personName,position){
  const labeled=labelValue(lines,/^(?:компания|organization|organisation|company|org\.?|организация|место\s+работы)\b/i);
  if(labeled)return stripCardContacts(labeled).slice(0,255);

  const legalRe=/\b(?:ООО|АО|ПАО|ИП|ГК|ГБУ|ГУП|МУП|ФГУП|LLC|JSC|LTD|INC|PLC)\b/i;
  const brandRe=/(group|групп|holding|холдинг|company|компания|банк|bank|taxi|такси|auto|авто|motors|mobile|mobility|логист|logistic|transport|транс|tech|тех|systems|систем|solutions|решения|capital|капитал|leasing|лизинг)/i;
  const heights=(metaLines||[]).map(x=>Number(x.height||0)).filter(x=>x>0);
  const med=median(heights)||1;
  const scored=[];

  for(const line of lines){
    const t=stripCardContacts(line);
    if(!t||t.length<2||t.length>110)continue;
    if(t===personName||t===position)continue;
    if(/\d{6,}|@|https?:|www\.|(?:\+?7|8)[\s()\-]*\d/i.test(t))continue;

    let score=0;
    if(legalRe.test(t))score+=35;
    if(brandRe.test(t))score+=14;
    if(/^[А-ЯЁA-Z0-9&.\- ]+$/.test(t)&&t.replace(/[^А-ЯЁA-Z]/g,'').length>=3)score+=8;
    const words=t.split(/\s+/).filter(Boolean);
    if(words.length>=1&&words.length<=5)score+=4;
    if(looksLikePersonName(t))score-=16;
    if(/директор|руководител|менеджер|director|manager|head|ceo|cfo|coo|cto/i.test(t))score-=25;
    const m=metaForText(metaLines,t);
    if(m){
      score+=Math.min(10,(Number(m.height||0)/med)*3);
      score+=Math.min(4,Number(m.confidence||0)/25);
    }
    if(score>0)scored.push({t,score});
  }
  scored.sort((a,b)=>b.score-a.score);
  return scored[0]?.t.slice(0,255)||'';
}
function bestCardWebsite(lines,email){
  const labeled=labelValue(lines,/^(?:сайт|web|website|www)\b/i);
  let w=normalizeWebsiteOcr(labeled);
  if(w&&/\./.test(w))return w;
  const joined=' '+lines.join(' ')+' ';
  w=normalizeWebsiteOcr(firstMatch(joined,/((?:https?:\/\/)?(?:www\.)?[a-z0-9а-яё\-]+(?:\s*\.\s*[a-z0-9а-яё\-]+)+(?:\/[^\s,;]*)?)/i));
  if(email&&w===email.split('@')[1])return '';
  return w;
}

function cleanVoiceValue(v){
  return String(v||'')
    .replace(/^[\s:;,.=\-–—]+/,'')
    .replace(/[\s:;,.=\-–—]+$/,'')
    .replace(/\s+/g,' ')
    .trim();
}
function parseVoiceSegments(raw){
  const text=' '+String(raw||'').replace(/\r?\n/g,' ; ').replace(/\s+/g,' ').trim()+' ';
  const markerRe=/(меня\s+зовут|ф\s*\.?\s*и\s*\.?\s*о\s*\.?|фио|имя|контакт(?:ное\s+лицо)?|компания|организация|место\s+работы|должность|позиция|роль|телефон|мобильный|номер\s+телефона|почта|e[\s-]*mail|email|электронная\s+почта|сайт|website|web|тип\s+клиента|потребност[ьи]|интерес|потенциал|количество\s+(?:машин|авто|автомобилей)|комментарий|примечание|следующий\s+шаг|договорились)/gi;
  const mapKey=(m)=>{
    const k=m.toLowerCase().replace(/\s+/g,' ');
    if(/меня зовут|фио|ф\s*\.?\s*и|^имя$|контакт/.test(k))return 'contact_name';
    if(/компания|организация|место работы/.test(k))return 'company';
    if(/должность|позиция|роль/.test(k))return 'position';
    if(/телефон|мобильный|номер телефона/.test(k))return 'phone';
    if(/почта|mail|email/.test(k))return 'email';
    if(/сайт|website|^web$/.test(k))return 'website';
    if(/тип клиента/.test(k))return 'client_type';
    if(/потребност/.test(k))return 'needs';
    if(/интерес/.test(k))return 'interest';
    if(/потенциал|количество/.test(k))return 'potential';
    if(/комментарий|примечание/.test(k))return 'comment';
    if(/следующий шаг|договорились/.test(k))return 'next_step';
    return '';
  };
  const hits=[];
  let m;
  while((m=markerRe.exec(text))){
    hits.push({key:mapKey(m[0]),start:m.index,end:markerRe.lastIndex});
  }
  const out={};
  for(let i=0;i<hits.length;i++){
    const h=hits[i],next=hits[i+1];
    if(!h.key)continue;
    const val=cleanVoiceValue(text.slice(h.end,next?next.start:text.length));
    if(val&&!out[h.key])out[h.key]=val;
  }
  return out;
}
function translitRuLatin(v){
  const map={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
  return String(v||'').replace(/[а-яё]/gi,ch=>{
    const low=ch.toLowerCase(),r=map[low]??ch;
    return ch===ch.toUpperCase()?r.toUpperCase():r;
  });
}
function normalizeSpokenEmail(v){
  let s=String(v||'').toLowerCase()
    .replace(/\b(?:собака|собачка|эт|at)\b/g,'@')
    .replace(/\b(?:точка|dot)\b/g,'.')
    .replace(/\b(?:нижнее\s+подчеркивание|нижнее\s+подчёркивание|underscore)\b/g,'_')
    .replace(/\b(?:дефис|тире|dash)\b/g,'-')
    .replace(/\bатом\s+(?:тим|team)\b/g,'atom.team')
    .replace(/\s+/g,'');
  s=translitRuLatin(s);
  return normalizeEmailOcr(s);
}
function simpleRussianNumber(v){
  const direct=String(v||'').match(/\d{1,4}/);
  if(direct)return Number(direct[0]);
  const map={
    'ноль':0,'нуль':0,'один':1,'одна':1,'два':2,'две':2,'три':3,'четыре':4,'пять':5,'шесть':6,'семь':7,'восемь':8,'девять':9,
    'десять':10,'одиннадцать':11,'двенадцать':12,'тринадцать':13,'четырнадцать':14,'пятнадцать':15,'шестнадцать':16,'семнадцать':17,'восемнадцать':18,'девятнадцать':19,
    'двадцать':20,'тридцать':30,'сорок':40,'пятьдесят':50,'шестьдесят':60,'семьдесят':70,'восемьдесят':80,'девяносто':90,
    'сто':100,'двести':200,'триста':300,'четыреста':400,'пятьсот':500,'шестьсот':600,'семьсот':700,'восемьсот':800,'девятьсот':900
  };
  let total=0,found=false;
  for(const w of String(v||'').toLowerCase().replace(/ё/g,'е').split(/[^а-я]+/)){
    if(Object.prototype.hasOwnProperty.call(map,w)){total+=map[w];found=true}
  }
  return found&&total<=9999?total:null;
}

function spokenPhoneDigits(v){
  const units={ноль:'0',нуль:'0',один:'1',одна:'1',два:'2',две:'2',три:'3',четыре:'4',пять:'5',шесть:'6',семь:'7',восемь:'8',девять:'9'};
  const teens={десять:'10',одиннадцать:'11',двенадцать:'12',тринадцать:'13',четырнадцать:'14',пятнадцать:'15',шестнадцать:'16',семнадцать:'17',восемнадцать:'18',девятнадцать:'19'};
  const tens={двадцать:'20',тридцать:'30',сорок:'40',пятьдесят:'50',шестьдесят:'60',семьдесят:'70',восемьдесят:'80',девяносто:'90'};
  const hundreds={сто:'100',двести:'200',триста:'300',четыреста:'400',пятьсот:'500',шестьсот:'600',семьсот:'700',восемьсот:'800',девятьсот:'900'};
  const src=String(v||'').toLowerCase().replace(/ё/g,'е')
    .replace(/[()\-–—,+]/g,' ')
    .replace(/\s+/g,' ')
    .trim();
  const tokens=src.split(' ').filter(Boolean);
  const groups=[];
  for(let i=0;i<tokens.length;){
    const t=tokens[i];
    if(/^\d+$/.test(t)){groups.push(t);i++;continue}
    if(hundreds[t]){
      let n=Number(hundreds[t]);i++;
      if(teens[tokens[i]]){n+=Number(teens[tokens[i]]);i++}
      else if(tens[tokens[i]]){n+=Number(tens[tokens[i]]);i++;if(units[tokens[i]]){n+=Number(units[tokens[i]]);i++}}
      else if(units[tokens[i]]){n+=Number(units[tokens[i]]);i++}
      groups.push(String(n));continue;
    }
    if(teens[t]){groups.push(teens[t]);i++;continue}
    if(tens[t]){
      let n=Number(tens[t]);i++;
      if(units[tokens[i]]){n+=Number(units[tokens[i]]);i++}
      groups.push(String(n));continue;
    }
    if(units[t]){groups.push(units[t]);i++;continue}
    i++;
  }
  return groups.join('');
}
function phoneFromSpokenWords(v){
  const d=spokenPhoneDigits(v);
  if(!d)return '';
  if(d.length===11)return normalizePhoneLocal(d);
  if(d.length===10)return normalizePhoneLocal(d);
  const m=d.match(/(?:7|8)?\d{10}$/);
  return m?normalizePhoneLocal(m[0]):'';
}

function voicePhoneCandidate(raw,seg){
  const fromSeg=normalizePhoneLocal(seg||'')||phoneFromSpokenWords(seg||'');
  if(fromSeg)return fromSeg;
  const compact=String(raw||'')
    .replace(/[ОOоo]/g,'0')
    .replace(/[ІIil|]/g,'1');
  const m=compact.match(/(?:\+?7|8)[\s\-()]*\d{3}[\s\-()]*\d{3}[\s\-]*\d{2}[\s\-]*\d{2}/);
  if(m)return normalizePhoneLocal(m[0]);
  const digits=compact.replace(/\D/g,'');
  const dm=digits.match(/(?:7|8)?\d{10}/);
  if(dm)return normalizePhoneLocal(dm[0]);
  const spoken=phoneFromSpokenWords(raw);
  return spoken||'';
}
function mapVoiceInterest(v){
  const s=String(v||'').toLowerCase();
  if(/высок|горяч|сильн/.test(s))return 'Высокий';
  if(/средн|тепл/.test(s))return 'Средний';
  if(/предвар|низк|холодн/.test(s))return 'Предварительный';
  if(/не определ|не знаю|непонят/.test(s))return 'Не определён';
  return '';
}


function trimAtVoiceBoundary(v){
  return cleanVoiceValue(String(v||'')
    .split(/\b(?:телефон|мобильный|почта|email|e-mail|электронная\s+почта|сайт|website|потребност[ьи]|потенциал|интерес|комментарий|примечание|следующий\s+шаг|договорились)\b/i)[0]);
}
function inferVoiceIdentity(raw){
  const s=String(raw||'').replace(/\s+/g,' ').trim();
  const out={contact_name:'',company:'',position:''};

  let m=s.match(/(?:меня зовут|контакт(?:ное лицо)?|представитель)\s+([А-ЯЁA-Z][А-ЯЁA-Zа-яёa-z-]+(?:\s+[А-ЯЁA-Z][А-ЯЁA-Zа-яёa-z-]+){1,2})/);
  if(m)out.contact_name=cleanVoiceValue(m[1]);

  m=s.match(/(?:из компании|компания|организация|работаю в|работает в|представляю|представляет)\s+["«]?(.{2,90}?)(?=\s+(?:должность|позиция|роль|телефон|мобильный|почта|email|сайт|потребност|потенциал|интерес|следующий шаг|директор|руководител|начальник|менеджер|ceo|cfo|coo|cto)\b|$)/i);
  if(m)out.company=trimAtVoiceBoundary(m[1]).replace(/[»"]$/,'').trim();

  m=s.match(/((?:генеральн|коммерческ|исполнительн|финансов|техническ)\w*\s+директор|директор(?:\s+по\s+[А-Яа-яA-Za-z -]{2,50})?|руководител\w*(?:\s+[А-Яа-яA-Za-z -]{2,50})?|начальник(?:\s+[А-Яа-яA-Za-z -]{2,50})?|менеджер(?:\s+[А-Яа-яA-Za-z -]{2,50})?|CEO|CFO|COO|CTO|CMO|Head of [A-Za-z -]+|Director|Manager)/i);
  if(m)out.position=trimAtVoiceBoundary(m[1]);

  if(!out.contact_name){
    const prefix=s.split(/\b(?:компания|организация|из компании|работаю в|работает в|должность|позиция|роль|телефон|почта|email|потребност|потенциал|интерес)\b/i)[0];
    const nm=prefix.match(/([А-ЯЁ][а-яё-]+\s+[А-ЯЁ][а-яё-]+(?:\s+[А-ЯЁ][а-яё-]+)?)/);
    if(nm)out.contact_name=nm[1];
  }
  return out;
}

function parseLeadText(text,source='voice',metaLines=[]){
  const raw=String(text||'').trim();
  const lines=source==='card'?usefulCardLines(raw):smartLines(raw);
  const joined=' '+lines.join(' ').replace(/\s+/g,' ')+' ';
  const voiceSeg=source==='voice'?parseVoiceSegments(raw):{};

  const phone=source==='card'?extractPhoneOcr(lines):voicePhoneCandidate(raw,voiceSeg.phone);
  const email=source==='voice'?(normalizeSpokenEmail(voiceSeg.email)||extractEmailOcr(joined)):extractEmailOcr(joined);
  let website=source==='voice'
    ?normalizeWebsiteOcr((voiceSeg.website||'').replace(/\bточка\b/gi,'.').replace(/\s+/g,''))
    :bestCardWebsite(lines,email);

  let contact='';
  let position='';
  let company='';
  if(source==='card'){
    contact=bestCardName(lines,metaLines);
    position=bestCardPosition(lines,metaLines);
    company=bestCardCompany(lines,metaLines,contact,position);
  }else{
    const inferred=inferVoiceIdentity(raw);
    contact=cleanVoiceValue(voiceSeg.contact_name)||inferred.contact_name||firstMatch(joined,/(?:меня зовут|это|фио|имя)\s+([А-ЯЁA-Z][а-яёa-z-]+(?:\s+[А-ЯЁA-Z][а-яёa-z-]+){1,2})/);
    company=trimAtVoiceBoundary(voiceSeg.company)||inferred.company||firstMatch(joined,/(?:компания|организация|работаю в|из компании)\s+["«]?([^,.;\n]{2,80})/i);
    position=trimAtVoiceBoundary(voiceSeg.position)||inferred.position||firstMatch(joined,/(генеральн(?:ый|ого) директор|коммерческ(?:ий|ого) директор|директор по [^,.;\n]{2,50}|руководител[ья] [^,.;\n]{0,60}|начальник [^,.;\n]{0,60}|менеджер [^,.;\n]{0,60}|CEO|CFO|COO|CTO|директор|руководитель|менеджер)/i);
  }

  const potentialM=joined.match(/(?:около|примерно|до|на)?\s*(\d{1,4})\s*(?:авто|автомобил|машин|единиц)/i);
  const potential=source==='voice'
    ?(simpleRussianNumber(voiceSeg.potential) ?? (potentialM?Number(potentialM[1]):null))
    :(potentialM?Number(potentialM[1]):null);

  let client_type='';
  const typeText=' '+String(voiceSeg.client_type||'')+' '+joined;
  if(/таксопарк|такси парк|taxi/i.test(typeText))client_type='Таксопарк';
  else if(/каршеринг|carsharing/i.test(typeText))client_type='Каршеринг';
  else if(/лизинг|leasing/i.test(typeText))client_type='Лизинговая компания';
  else if(/государствен|госкомпан|гбу|гуп|фгуп/i.test(typeText))client_type='Государственная компания';
  else if(/партн[её]р/i.test(typeText))client_type='Партнёр';

  const needs=[];
  const add=n=>{if(!needs.includes(n))needs.push(n)};
  const needsText=' '+String(voiceSeg.needs||'')+' '+joined;
  if(/тест[- ]?драйв/i.test(needsText))add('Тест-драйв');
  if(/лизинг/i.test(needsText))add('Лизинг');
  if(/каршеринг/i.test(needsText))add('Каршеринг');
  if(/такси|таксопарк/i.test(needsText))add('Такси');
  if(/партн[её]р/i.test(needsText))add('Партнёрство');
  if(/автопарк|корпоративн.*парк/i.test(needsText))add('Корпоративный автопарк');
  if(/купить|покупк|закупк|приобрест/i.test(needsText))add('Покупка автомобилей');

  let interest=source==='voice'?mapVoiceInterest(voiceSeg.interest):'';
  if(!interest&&/высок(?:ий|ая).*интерес|горяч/i.test(joined))interest='Высокий';
  else if(!interest&&/средн(?:ий|яя).*интерес/i.test(joined))interest='Средний';
  else if(!interest&&/предварительн/i.test(joined))interest='Предварительный';

  let next=source==='voice'?cleanVoiceValue(voiceSeg.next_step):'';
  const nextM=joined.match(/(?:следующий шаг|договорились|нужно|надо|перезвонить|связаться)\s*[:\-]?\s*([^.;]{3,120})/i);
  if(!next&&nextM)next=nextM[1].trim();

  const comment=source==='card'
    ?'Данные распознаны с визитки автоматически. Поля распределены по структуре визитки, подписям и расположению текста.'
    :(cleanVoiceValue(voiceSeg.comment)||'Данные распознаны голосом автоматически.');

  return {
    contact_name:contact,
    company,
    position,
    phone,
    email,
    website,
    client_type,
    needs,
    potential_cars:potential,
    potential_range:'',
    interest,
    comment,
    next_step:next,
    next_step_date:''
  };
}

function applyDraft(d){
  leadForm(false,true);
  currentRecognizedText=d._raw_ocr||d._recognized_text||'';
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
  if(extra.length)l_comment.value=[l_comment.value,...extra].filter(Boolean).join('\n');
  const msg=document.getElementById('leadmsg');
  if(msg){const found=[d.contact_name&&'ФИО',d.company&&'компания',d.position&&'должность',d.phone&&'телефон',d.email&&'e-mail',d.website&&'сайт'].filter(Boolean);msg.innerHTML='<div class="notice"><b>Распознано:</b> '+(found.length?found.join(', '):'основные поля не определены')+'. Проверьте данные перед регистрацией.</div>'+(d._raw_ocr?'<details><summary>Показать распознанный текст</summary><p class="hint" style="white-space:pre-wrap">'+esc(d._raw_ocr)+'</p></details>':'');}
}
function fileToBase64(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||'').split(',')[1]||'');reader.onerror=reject;reader.readAsDataURL(file);
  });
}
async function ensureTesseract(){
  if(window.Tesseract)return true;
  const sources=[
    'https://unpkg.com/tesseract.js@5.1.1/dist/tesseract.min.js',
    'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js'
  ];
  for(const src of sources){
    try{
      await new Promise((resolve,reject)=>{
        const s=document.createElement('script');
        s.src=src;s.async=true;s.onload=resolve;s.onerror=reject;
        document.head.appendChild(s);
      });
      if(window.Tesseract)return true;
    }catch{}
  }
  return false;
}

async function imageToCanvas(file){
  let source=null,w=0,h=0,url='';
  if(file instanceof HTMLCanvasElement){
    source=file;w=file.width;h=file.height;
  }else try{
    source=await createImageBitmap(file,{imageOrientation:'from-image'});
    w=source.width;h=source.height;
  }catch(e){
    url=URL.createObjectURL(file);
    source=await new Promise(function(resolve,reject){
      const im=new Image();
      im.onload=function(){resolve(im)};
      im.onerror=reject;
      im.src=url;
    });
    w=source.naturalWidth||source.width;
    h=source.naturalHeight||source.height;
  }
  const mx=Math.round(w*0.015),my=Math.round(h*0.015);
  const cw=Math.max(1,w-mx*2),ch=Math.max(1,h-my*2);
  const longest=Math.max(cw,ch);
  const target=Math.min(2600,Math.max(1600,longest));
  const scale=target/longest;
  const border=28;
  const out=document.createElement('canvas');
  out.width=Math.round(cw*scale)+border*2;
  out.height=Math.round(ch*scale)+border*2;
  const ctx=out.getContext('2d',{willReadFrequently:true});
  ctx.fillStyle='#fff';ctx.fillRect(0,0,out.width,out.height);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(source,mx,my,cw,ch,border,border,out.width-border*2,out.height-border*2);
  try{if(!(file instanceof HTMLCanvasElement)&&source.close)source.close()}catch(e){}
  if(url)URL.revokeObjectURL(url);
  return out;
}
function enhanceCanvas(src,binary){
  const out=document.createElement('canvas');
  out.width=src.width;out.height=src.height;
  const ctx=out.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(src,0,0);
  const img=ctx.getImageData(0,0,out.width,out.height),d=img.data;
  const hist=new Uint32Array(256);
  let sum=0,count=0;
  for(let i=0;i<d.length;i+=4){
    const g=Math.round(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]);
    hist[g]++;sum+=g;count++;
  }
  let a=0,lo=0,hi=255;
  const low=count*0.02,high=count*0.98;
  for(let i=0;i<256;i++){a+=hist[i];if(a>=low){lo=i;break}}
  a=0;for(let i=0;i<256;i++){a+=hist[i];if(a>=high){hi=i;break}}
  if(hi-lo<70){lo=Math.max(0,lo-30);hi=Math.min(255,hi+30)}
  const invert=(sum/count)<105;
  const gray=new Uint8Array(count);
  let p=0;
  for(let i=0;i<d.length;i+=4){
    let g=Math.round(0.299*d[i]+0.587*d[i+1]+0.114*d[i+2]);
    g=Math.max(0,Math.min(255,Math.round((g-lo)*255/Math.max(1,hi-lo))));
    if(invert)g=255-g;
    gray[p++]=g;
  }
  let threshold=165;
  if(binary){
    const hh=new Uint32Array(256);for(const g of gray)hh[g]++;
    let total=gray.length,sumAll=0;for(let i=0;i<256;i++)sumAll+=i*hh[i];
    let sumB=0,wB=0,maxVar=0;
    for(let i=0;i<256;i++){
      wB+=hh[i];if(!wB)continue;
      const wF=total-wB;if(!wF)break;
      sumB+=i*hh[i];
      const mB=sumB/wB,mF=(sumAll-sumB)/wF;
      const v=wB*wF*(mB-mF)*(mB-mF);
      if(v>maxVar){maxVar=v;threshold=i}
    }
  }
  p=0;
  for(let i=0;i<d.length;i+=4){
    let g=gray[p++];
    if(binary)g=g>threshold?255:0;
    d[i]=d[i+1]=d[i+2]=g;d[i+3]=255;
  }
  ctx.putImageData(img,0,0);
  return out;
}
function cleanOcrText(text){
  const seen=new Set(),out=[];
  String(text||'').split(/\r?\n/).forEach(function(line){
    line=line.replace(/\s+/g,' ').trim();
    if(line.length<2)return;
    const good=(line.match(/[A-Za-zА-Яа-яЁё0-9@.+()\-]/g)||[]).length;
    const bad=(line.match(/[^\sA-Za-zА-Яа-яЁё0-9@.,:+()\-\/&«»"'№]/g)||[]).length;
    if(good/Math.max(1,line.length)<0.55||bad/Math.max(1,line.length)>0.18)return;
    const key=line.toLowerCase().replace(/[^a-zа-яё0-9@]+/gi,'');
    if(key.length<2||seen.has(key))return;
    seen.add(key);out.push(line);
  });
  return out.join('\n');
}
function mergeOcrTexts(a,b){
  return cleanOcrText(cleanOcrText(a)+'\n'+cleanOcrText(b));
}

async function ocrBusinessCard(file,progress){
  if(!await ensureTesseract())throw new Error('OCR-модуль не загрузился');
  progress('Подготавливаю фото…');
  const base=await imageToCanvas(file);
  const gray=enhanceCanvas(base,false);
  const bw=enhanceCanvas(base,true);
  const qrRaw=await detectCardBarcode(base);
  let worker=null;
  try{
    worker=await Tesseract.createWorker(['rus','eng'],1,{
      logger:function(x){
        if(x.status==='recognizing text')progress('Распознаю текст… '+Math.round((x.progress||0)*100)+'%');
        else if(/loading|initializing/i.test(x.status||''))progress('Загружаю языковую модель…');
      }
    });

    const run=async function(image,psm,rect){
      await worker.setParameters({tessedit_pageseg_mode:String(psm),preserve_interword_spaces:'1',user_defined_dpi:'300'});
      return await worker.recognize(image,rect?{rectangle:rect,rotateAuto:true}:{rotateAuto:true},{text:true,blocks:true});
    };

    const r1=await run(gray,3,null);
    progress('Проверяю контрастный вариант…');
    const r2=await run(bw,11,null);

    let text=mergeOcrTexts(r1?.data?.text||'',r2?.data?.text||'');
    let meta=[...extractBlockLines(r1?.data?.blocks),...extractBlockLines(r2?.data?.blocks)];
    let confidence=Math.max(Number(r1?.data?.confidence||0),Number(r2?.data?.confidence||0));

    let draft=parseLeadText(text,'card',meta);
    if(coreFieldCount(draft)<3){
      const zones=[
        {name:'верхнюю часть',left:0,top:0,width:gray.width,height:Math.round(gray.height*0.62)},
        {name:'нижнюю часть',left:0,top:Math.round(gray.height*0.38),width:gray.width,height:Math.round(gray.height*0.62)},
        {name:'левую часть',left:0,top:0,width:Math.round(gray.width*0.62),height:gray.height},
        {name:'правую часть',left:Math.round(gray.width*0.38),top:0,width:Math.round(gray.width*0.62),height:gray.height}
      ];
      for(const z of zones){
        progress('Уточняю '+z.name+'…');
        const rz=await run(gray,6,{left:z.left,top:z.top,width:z.width,height:z.height});
        text=mergeOcrTexts(text,rz?.data?.text||'');
        meta=meta.concat(extractBlockLines(rz?.data?.blocks));
        confidence=Math.max(confidence,Number(rz?.data?.confidence||0));
        draft=parseLeadText(text,'card',meta);
        if(coreFieldCount(draft)>=4)break;
      }
    }

    return {text,confidence,meta,qrRaw,base};
  }finally{
    try{if(worker)await worker.terminate()}catch(e){}
  }
}



let cardCameraStream=null;
let cardCameraStarting=false;

function stopCardCamera(){
  try{
    if(cardCameraStream){
      cardCameraStream.getTracks().forEach(t=>t.stop());
      cardCameraStream=null;
    }
  }catch{}
  const video=document.getElementById('card_camera');
  if(video)try{video.srcObject=null}catch{}
}
async function startCardCamera(){
  if(cardCameraStarting||cardCameraStream)return;
  const video=document.getElementById('card_camera');
  const msg=document.getElementById('cardmsg');
  const capture=document.getElementById('card_capture_btn');
  const fallback=document.getElementById('card_fallback_btn');
  if(!video)return;
  if(!navigator.mediaDevices?.getUserMedia){
    if(msg)msg.innerHTML='<div class="error">Telegram не дал доступ к камере. Используйте запасной вариант «Выбрать фото».</div>';
    if(fallback)fallback.hidden=false;
    return;
  }
  cardCameraStarting=true;
  try{
    if(msg)msg.innerHTML='<div class="notice">Открываю заднюю камеру…</div>';
    const stream=await navigator.mediaDevices.getUserMedia({
      audio:false,
      video:{
        facingMode:{ideal:'environment'},
        width:{ideal:1920},
        height:{ideal:1080}
      }
    });
    cardCameraStream=stream;
    video.srcObject=stream;
    video.setAttribute('playsinline','');
    video.muted=true;
    await video.play();

    try{
      const track=stream.getVideoTracks()[0];
      const caps=track.getCapabilities?.()||{};
      const advanced=[];
      if(Array.isArray(caps.focusMode)&&caps.focusMode.includes('continuous'))advanced.push({focusMode:'continuous'});
      if(advanced.length)await track.applyConstraints({advanced});
    }catch{}

    if(capture)capture.disabled=false;
    if(msg)msg.innerHTML='<div class="notice">Поместите визитку целиком внутрь рамки и нажмите «Снять и распознать».</div>';
  }catch(e){
    stopCardCamera();
    if(msg)msg.innerHTML='<div class="error">Не удалось открыть камеру. Разрешите камеру для Telegram или используйте «Выбрать фото».</div>';
    if(fallback)fallback.hidden=false;
  }finally{
    cardCameraStarting=false;
  }
}
function cardLead(){
  stopCardCamera();
  el().innerHTML='<div class="card card-camera-card"><h2>📷 Лид по визитке</h2><p class="hint">Наведите камеру на визитку. Держите её ровно, без бликов, целиком внутри рамки.</p><div class="card-camera-stage"><video id="card_camera" class="card-camera-video" autoplay playsinline muted></video><div id="card_camera_guide" class="card-camera-guide"><span>ВИЗИТКА</span></div></div><div class="spacer"></div><button id="card_capture_btn" class="btn full" onclick="captureCardPhoto()" disabled>📸 Снять и распознать</button><div class="spacer"></div><button id="card_fallback_btn" class="btn secondary full" onclick="openCardFileFallback()" hidden>Выбрать фото вместо камеры</button><input id="card_file_fallback" type="file" accept="image/*" capture="environment" hidden onchange="fallbackCardFileChanged()"><div class="spacer"></div><button class="btn secondary full" onclick="stopCardCamera();homeFromApi()">← Главное меню</button><div id="cardmsg"></div></div>';
  setTimeout(startCardCamera,0);
}
function openCardFileFallback(){
  document.getElementById('card_file_fallback')?.click();
}
async function fallbackCardFileChanged(){
  const file=document.getElementById('card_file_fallback')?.files?.[0];
  if(!file)return;
  const msg=document.getElementById('cardmsg');
  try{
    if(msg)msg.innerHTML='<div class="notice">Готовлю фото…</div>';
    const canvas=await imageToCanvas(file);
    await recognizeCapturedCard(canvas);
  }catch(e){
    if(msg)msg.innerHTML='<div class="error">'+esc(e.message||'Не удалось обработать фото')+'</div>';
  }
}
function captureGuideCanvas(){
  const video=document.getElementById('card_camera');
  const guide=document.getElementById('card_camera_guide');
  if(!video||!guide||!video.videoWidth||!video.videoHeight)throw new Error('Камера ещё не готова');

  const vr=video.getBoundingClientRect();
  const gr=guide.getBoundingClientRect();
  const vw=video.videoWidth,vh=video.videoHeight;
  const scale=Math.max(vr.width/vw,vr.height/vh);
  const shownW=vw*scale,shownH=vh*scale;
  const cropX=(shownW-vr.width)/2;
  const cropY=(shownH-vr.height)/2;

  let sx=(gr.left-vr.left+cropX)/scale;
  let sy=(gr.top-vr.top+cropY)/scale;
  let sw=gr.width/scale;
  let sh=gr.height/scale;

  const padX=sw*0.025,padY=sh*0.035;
  sx-=padX;sy-=padY;sw+=padX*2;sh+=padY*2;

  sx=Math.max(0,Math.min(vw-1,sx));
  sy=Math.max(0,Math.min(vh-1,sy));
  sw=Math.max(1,Math.min(vw-sx,sw));
  sh=Math.max(1,Math.min(vh-sy,sh));

  const canvas=document.createElement('canvas');
  canvas.width=Math.round(sw);
  canvas.height=Math.round(sh);
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(video,sx,sy,sw,sh,0,0,canvas.width,canvas.height);
  return canvas;
}
async function captureCardPhoto(){
  const msg=document.getElementById('cardmsg');
  const btn=document.getElementById('card_capture_btn');
  try{
    if(btn)btn.disabled=true;
    if(msg)msg.innerHTML='<div class="notice">Снимок сделан. Начинаю распознавание…</div>';
    const canvas=captureGuideCanvas();
    stopCardCamera();
    await recognizeCapturedCard(canvas);
  }catch(e){
    if(btn)btn.disabled=false;
    if(msg)msg.innerHTML='<div class="error">'+esc(e.message||'Не удалось сделать снимок')+'</div>';
  }
}
async function recognizeCapturedCard(canvas){
  const msg=document.getElementById('cardmsg');
  const ocr=await ocrBusinessCard(canvas,function(t){
    if(msg)msg.innerHTML='<div class="notice">'+esc(t)+'</div>';
  });
  if(!ocr.text&&!ocr.qrRaw)throw new Error('Текст на визитке не распознан');
  let draft=parseLeadText(ocr.text||'','card',ocr.meta||[]);
  if(ocr.qrRaw){
    draft=mergeDraft(draft,parseVCardText(ocr.qrRaw));
    draft._qr_found=true;
  }
  draft._raw_ocr=usefulCardLines(ocr.text||'').join('\n');
  draft._ocr_confidence=ocr.confidence;
  applyDraft(draft);
  const leadMsg=document.getElementById('leadmsg');
  if(leadMsg&&draft._qr_found){
    leadMsg.insertAdjacentHTML('afterbegin','<div class="notice">✅ Найден QR-код визитки: точные контактные данные взяты из QR.</div>');
  }
}
window.addEventListener('pagehide',stopCardCamera);

let speechRec=null;
let speechFinal='';
let speechInterim='';
let voiceListening=false;
let voiceStopping=false;
let voiceRestartTimer=null;
let voiceMediaStream=null;
let voiceAudioCtx=null;
let voiceAnalyser=null;
let voiceAnimFrame=null;
let voiceStartedAt=0;
let voiceTimerHandle=null;

function renderVoiceDetected(text){
  const box=document.getElementById('voice_detected');
  if(!box)return;
  const d=parseLeadText(text||'','voice');
  const fields=[
    ['ФИО',d.contact_name],
    ['Компания',d.company],
    ['Должность',d.position],
    ['Телефон',d.phone],
    ['E-mail',d.email],
    ['Тип',d.client_type],
    ['Потребность',(d.needs||[]).join(', ')],
    ['Потенциал',d.potential_cars]
  ];
  const found=fields.filter(x=>x[1]!==''&&x[1]!==null&&x[1]!==undefined&&String(x[1]).trim());
  box.innerHTML=found.length
    ?'<div class="voice-detected-title">Уже определено:</div><div class="voice-detected-chips">'+found.map(x=>'<span class="voice-detected-chip"><b>'+esc(x[0])+':</b> '+esc(x[1])+'</span>').join('')+'</div>'
    :'<div class="hint">Пока поля не определены. Говорите: «ФИО…, компания…, должность…, телефон…»</div>';
}

function voiceEls(){
  return {
    status:document.getElementById('voice_status'),
    text:document.getElementById('voice_text'),
    start:document.getElementById('voice_start'),
    stop:document.getElementById('voice_stop'),
    mic:document.getElementById('voice_mic'),
    timer:document.getElementById('voice_timer'),
    fallback:document.getElementById('voice_fallback')
  };
}
function setVoiceState(state,message=''){
  const x=voiceEls();
  const labels={
    idle:'Готов к записи',
    requesting:'Запрашиваю доступ к микрофону…',
    recording:'Слушаю. Говорите данные клиента',
    processing:'Обрабатываю распознанный текст…',
    ready:'Текст распознан',
    error:'Не удалось распознать речь'
  };
  if(x.status){
    x.status.className='voice-status '+state;
    x.status.innerHTML='<span class="voice-status-dot"></span><span>'+esc(message||labels[state]||'')+'</span>';
  }
  if(x.mic){
    x.mic.classList.toggle('recording',state==='recording');
    x.mic.classList.toggle('processing',state==='processing');
    x.mic.classList.toggle('error',state==='error');
  }
  if(x.start){
    x.start.disabled=['requesting','recording','processing'].includes(state);
    x.start.classList.toggle('busy',state==='requesting'||state==='processing');
  }
  if(x.stop){
    x.stop.disabled=state!=='recording';
    x.stop.classList.toggle('recording',state==='recording');
  }
}
function stopVoiceVisuals(){
  if(voiceTimerHandle){clearInterval(voiceTimerHandle);voiceTimerHandle=null}
  if(voiceAnimFrame){cancelAnimationFrame(voiceAnimFrame);voiceAnimFrame=null}
  try{voiceAudioCtx?.close()}catch{}
  voiceAudioCtx=null;voiceAnalyser=null;
  const mic=document.getElementById('voice_mic');
  if(mic)mic.style.removeProperty('--voice-level');
}
function stopVoiceMedia(){
  try{voiceMediaStream?.getTracks().forEach(t=>t.stop())}catch{}
  voiceMediaStream=null;
  stopVoiceVisuals();
}
function startVoiceTimer(){
  voiceStartedAt=Date.now();
  const tick=()=>{
    const timer=document.getElementById('voice_timer');
    if(!timer)return;
    const sec=Math.floor((Date.now()-voiceStartedAt)/1000);
    const mm=String(Math.floor(sec/60)).padStart(2,'0');
    const ss=String(sec%60).padStart(2,'0');
    timer.textContent=mm+':'+ss;
  };
  tick();
  voiceTimerHandle=setInterval(tick,250);
}
function startVoiceLevelMeter(stream){
  try{
    voiceAudioCtx=new (window.AudioContext||window.webkitAudioContext)();
    const source=voiceAudioCtx.createMediaStreamSource(stream);
    voiceAnalyser=voiceAudioCtx.createAnalyser();
    voiceAnalyser.fftSize=256;
    voiceAnalyser.smoothingTimeConstant=.72;
    source.connect(voiceAnalyser);
    const data=new Uint8Array(voiceAnalyser.frequencyBinCount);
    const draw=()=>{
      if(!voiceListening||!voiceAnalyser)return;
      voiceAnalyser.getByteFrequencyData(data);
      let sum=0;
      for(const v of data)sum+=v;
      const avg=sum/Math.max(1,data.length);
      const level=Math.max(.08,Math.min(1,avg/75));
      const mic=document.getElementById('voice_mic');
      if(mic)mic.style.setProperty('--voice-level',String(level));
      voiceAnimFrame=requestAnimationFrame(draw);
    };
    draw();
  }catch{}
}
function updateVoiceTranscript(){
  const x=voiceEls();
  const val=(speechFinal+' '+speechInterim).replace(/\s+/g,' ').trim();
  if(x.text)x.text.value=val;
  renderVoiceDetected(val);
  return val;
}
function speechErrorText(code){
  return ({
    'not-allowed':'Нет разрешения на микрофон. Разрешите микрофон для Telegram.',
    'service-not-allowed':'Сервис распознавания речи недоступен в этом Telegram.',
    'audio-capture':'Микрофон не найден или занят другим приложением.',
    'network':'Сервис распознавания речи недоступен по сети. Попробуйте ещё раз.',
    'no-speech':'Речь не услышана. Говорите немного громче и ближе к телефону.',
    'aborted':'Запись остановлена.'
  })[code]||('Ошибка распознавания: '+code);
}
function makeSpeechRecognition(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR)return null;
  const rec=new SR();
  rec.lang='ru-RU';
  rec.continuous=true;
  rec.interimResults=true;
  rec.maxAlternatives=1;

  rec.onstart=()=>{
    if(voiceListening)setVoiceState('recording');
  };
  rec.onresult=e=>{
    speechInterim='';
    for(let i=e.resultIndex;i<e.results.length;i++){
      const t=String(e.results[i][0]?.transcript||'').trim();
      if(!t)continue;
      if(e.results[i].isFinal)speechFinal+=(speechFinal?' ':'')+t;
      else speechInterim+=(speechInterim?' ':'')+t;
    }
    updateVoiceTranscript();
  };
  rec.onerror=e=>{
    const code=e?.error||'unknown';
    if(code==='no-speech'&&voiceListening&&!voiceStopping)return;
    if(code==='aborted'&&voiceStopping)return;
    if(code==='network'&&voiceListening&&!voiceStopping){
      setVoiceState('recording','Связь с распознаванием прервалась. Перезапускаю…');
      return;
    }
    setVoiceState('error',speechErrorText(code));
    if(code==='not-allowed'||code==='service-not-allowed'||code==='audio-capture'){
      voiceListening=false;
      stopVoiceMedia();
      const fb=document.getElementById('voice_fallback');
      if(fb)fb.hidden=false;
    }
  };
  rec.onend=()=>{
    if(voiceListening&&!voiceStopping){
      clearTimeout(voiceRestartTimer);
      voiceRestartTimer=setTimeout(()=>{
        try{
          speechRec=makeSpeechRecognition();
          speechRec?.start();
        }catch{
          setVoiceState('error','Распознавание остановилось. Нажмите «Начать запись» ещё раз.');
          voiceListening=false;
          stopVoiceMedia();
        }
      },180);
    }
  };
  return rec;
}
function voiceLead(){
  stopVoiceSession();
  el().innerHTML='<div class="card"><h2>🎙️ Лид голосом</h2><p class="hint">Нажмите «Начать запись» и говорите обычной речью. Для максимальной точности можно диктовать: «ФИО Иван Иванов, компания Альфа, должность директор, телефон…».</p><div class="voice-panel"><div id="voice_mic" class="voice-mic"><span>🎙️</span></div><div id="voice_timer" class="voice-timer">00:00</div><div id="voice_status" class="voice-status idle"><span class="voice-status-dot"></span><span>Готов к записи</span></div></div><button id="voice_start" class="btn full voice-action" onclick="startVoice()">🎙️ Начать запись</button><div class="spacer"></div><button id="voice_stop" class="btn full voice-stop" onclick="stopVoice()" disabled>⏹ Остановить и заполнить карточку</button><label>Распознанный текст</label><textarea id="voice_text" class="voice-transcript" placeholder="Во время записи здесь будет появляться распознанная речь" oninput="renderVoiceDetected(this.value)"></textarea><div id="voice_detected" class="voice-detected"><div class="hint">Говорите свободно или с маркерами: «ФИО…, компания…, должность…, телефон…»</div></div><div id="voice_fallback" class="notice" hidden>Автоматическое распознавание недоступно. Нажмите поле выше и используйте микрофон клавиатуры телефона, затем нажмите «Заполнить лид из текста».</div><div class="spacer"></div><button class="btn secondary full" onclick="voiceTextToLead()">Заполнить лид из текста</button><div class="spacer"></div><button class="btn secondary full" onclick="stopVoiceSession();homeFromApi()">← Главное меню</button><div id="voicemsg"></div></div>';
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){
    setVoiceState('error','В этом Telegram нет встроенного распознавания речи. Используйте микрофон клавиатуры.');
    const fb=document.getElementById('voice_fallback');
    if(fb)fb.hidden=false;
  }
}
async function startVoice(){
  if(voiceListening)return;
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){
    setVoiceState('error','В этом Telegram нет встроенного распознавания речи. Используйте микрофон клавиатуры.');
    document.getElementById('voice_text')?.focus();
    return;
  }
  setVoiceState('requesting');
  speechFinal='';speechInterim='';
  updateVoiceTranscript();
  voiceStopping=false;
  try{
    voiceMediaStream=await navigator.mediaDevices.getUserMedia({
      audio:{
        echoCancellation:true,
        noiseSuppression:true,
        autoGainControl:true
      },
      video:false
    });
    voiceListening=true;
    startVoiceLevelMeter(voiceMediaStream);
    startVoiceTimer();
    speechRec=makeSpeechRecognition();
    if(!speechRec)throw new Error('speech_recognition_unavailable');
    speechRec.start();
    setVoiceState('recording');
  }catch(e){
    voiceListening=false;
    stopVoiceMedia();
    const name=e?.name||'';
    const msg=name==='NotAllowedError'
      ?'Нет разрешения на микрофон. Разрешите микрофон для Telegram и попробуйте снова.'
      :name==='NotFoundError'
        ?'Микрофон на устройстве не найден.'
        :'Не удалось запустить голосовой ввод.';
    setVoiceState('error',msg);
    const fb=document.getElementById('voice_fallback');
    if(fb)fb.hidden=false;
  }
}
async function stopVoice(){
  if(!voiceListening&&!speechRec)return;
  voiceStopping=true;
  voiceListening=false;
  clearTimeout(voiceRestartTimer);
  setVoiceState('processing');
  try{speechRec?.stop()}catch{}
  speechRec=null;
  stopVoiceMedia();

  await new Promise(r=>setTimeout(r,420));
  const text=updateVoiceTranscript();
  if(!text){
    voiceStopping=false;
    setVoiceState('error','Речь не распознана. Попробуйте ещё раз, говорите ближе к телефону.');
    return;
  }

  setVoiceState('processing','Разбираю текст по полям лида…');
  await new Promise(r=>setTimeout(r,250));
  voiceStopping=false;
  const d=parseLeadText(text,'voice');
  d._recognized_text=text;
  applyDraft(d);
}
function stopVoiceSession(){
  voiceListening=false;
  voiceStopping=true;
  clearTimeout(voiceRestartTimer);
  try{speechRec?.abort()}catch{}
  speechRec=null;
  stopVoiceMedia();
  voiceStopping=false;
}
function voiceTextToLead(){
  const t=document.getElementById('voice_text')?.value.trim()||'';
  if(!t){
    setVoiceState('error','Сначала продиктуйте или введите текст.');
    return;
  }
  setVoiceState('processing','Разбираю текст по полям лида…');
  setTimeout(()=>{
    const d=parseLeadText(t,'voice');
    d._recognized_text=t;
    applyDraft(d);
  },220);
}
window.addEventListener('pagehide',stopVoiceSession);

async function profile(){const x=await api('me');el().innerHTML=`<div class="card"><h2>Мой профиль</h2><p><b>${esc(x.user.full_name)}</b></p><p>${esc(x.user.corporate_email)}</p><p class="muted">Telegram ID: ${esc(x.user.telegram_id)}</p><div class="spacer"></div><button class="btn secondary full" onclick="homeFromApi()">← Главное меню</button></div>`}
async function homeFromApi(){const x=await api('me');home(x.user)}
async function events(){const x=await api('events');const cards=(x.events||[]).map(v=>`<button class="btn ${v.id===x.currentEventId?'active':''} full" onclick="selectEvent('${v.id}')">${esc(v.name)}<br><span class="muted">${esc(v.event_date||'')} ${esc(v.city||'')}</span></button>`).join('<div class="spacer"></div>');el().innerHTML=`<div class="card"><h2>Мероприятие</h2>${cards||'<p class="hint">Пока мероприятий нет.</p>'}<div class="spacer"></div><button class="btn full" onclick="newEvent()">＋ Создать мероприятие</button><div class="spacer"></div><button class="btn secondary full" onclick="homeFromApi()">← Главное меню</button></div>`}
async function selectEvent(id){await api('select-event',{method:'POST',body:JSON.stringify({event_id:id})});homeFromApi()}
function newEvent(){el().innerHTML=`<div class="card"><h2>Новое мероприятие</h2><label>Название</label><input id="ev_name"><label>Дата</label><input id="ev_date" type="date"><label>Город</label><input id="ev_city"><label>Площадка</label><input id="ev_venue"><div class="spacer"></div><button class="btn full" onclick="saveEvent()">Создать и выбрать</button><div class="spacer"></div><button class="btn secondary full" onclick="events()">← Назад</button><div id="evmsg"></div></div>`}
async function saveEvent(){try{await api('events',{method:'POST',body:JSON.stringify({name:ev_name.value.trim(),event_date:ev_date.value||null,city:ev_city.value.trim(),venue:ev_venue.value.trim()})});homeFromApi()}catch(e){evmsg.innerHTML=`<div class="error">${esc(errMsg(e))}</div>`}}
const TYPES=['Корпоративный клиент','Таксопарк','Каршеринг','Лизинговая компания','Государственная компания','Партнёр','Другое'];
const NEEDS=['Покупка автомобилей','Корпоративный автопарк','Такси','Каршеринг','Лизинг','Тест-драйв','Партнёрство','Другое'];
const INTEREST=['Высокий','Средний','Предварительный','Не определён'];
function leadForm(fast,preserveRecognized=false){if(!preserveRecognized)currentRecognizedText='';const needs=NEEDS.map(v=>`<button type="button" class="chip" data-need="${esc(v)}" onclick="this.classList.toggle('active')">${esc(v)}</button>`).join('');el().innerHTML=`<div class="card"><h2>${fast?'⚡ Быстрый лид':'➕ Регистрация лида'}</h2><label>ФИО</label><input id="l_name" placeholder="Алексей Смирнов"><label>Телефон</label><input id="l_phone" inputmode="tel" placeholder="89161234567"><label>Компания</label><input id="l_company" placeholder="ООО Альфа">${fast?'':`<label>Должность</label><input id="l_position"><label>E-mail</label><input id="l_email" type="email"><label>Тип клиента</label><select id="l_type"><option value=""></option>${TYPES.map(x=>`<option>${esc(x)}</option>`).join('')}</select><label>Потребность</label><div class="chips">${needs}</div><label>Потенциал, авто</label><input id="l_potential" inputmode="numeric" placeholder="30"><label>Интерес</label><select id="l_interest"><option value=""></option>${INTEREST.map(x=>`<option>${esc(x)}</option>`).join('')}</select>`}<label>Комментарий</label><textarea id="l_comment" placeholder="Что обсуждали"></textarea><div id="dups"></div><div class="spacer"></div><button class="btn full" onclick="saveLead(${fast})">✅ Зарегистрировать</button><div class="spacer"></div><button class="btn secondary full" onclick="homeFromApi()">← Главное меню</button><div id="leadmsg"></div></div>`;l_phone.addEventListener('blur',()=>checkDup())}
async function checkDup(){try{const x=await api('duplicates',{method:'POST',body:JSON.stringify({phone:l_phone.value,contact_name:l_name.value,company:l_company.value,email:window.l_email?.value||''})});if(x.duplicates?.length)dups.innerHTML=`<div class="notice">⚠️ Возможно, контакт уже зарегистрирован: ${x.duplicates.map(d=>`<b>${esc(d.contact_name||'')} ${esc(d.company||'')}</b> ${esc(d.phone||'')}`).join('<br>')}</div>`;else dups.innerHTML=''}catch{}}
async function saveLead(fast){const msg=document.getElementById('leadmsg');try{const needs=fast?[]:[...document.querySelectorAll('[data-need].active')].map(x=>x.dataset.need);const body={contact_name:l_name.value.trim(),phone:l_phone.value.trim(),company:l_company.value.trim(),position:fast?'':l_position.value.trim(),email:fast?'':l_email.value.trim(),client_type:fast?'':l_type.value,needs,potential_cars:fast?null:(l_potential.value?Number(l_potential.value):null),interest:fast?'':l_interest.value,comment:l_comment.value.trim(),recognized_text:currentRecognizedText||''};const x=await api('leads',{method:'POST',body:JSON.stringify(body)});el().innerHTML=`<div class="success"><h2>✅ Лид зарегистрирован</h2><p><b>${esc(x.lead.lead_code)}</b></p><p>${x.lead.google_sync_status==='synced'?'☁️ Google Sheets: синхронизировано':'⚠️ Google Sheets: ожидает повторной синхронизации'}</p></div><div class="spacer"></div><button class="btn full" onclick="leadForm(${fast})">＋ Следующий лид</button><div class="spacer"></div><button class="btn secondary full" onclick="homeFromApi()">Главное меню</button>`}catch(e){msg.innerHTML=`<div class="error">${esc(errMsg(e))}</div>`}}
async function listLeads(q=''){const x=await api('leads'+(q?`?q=${encodeURIComponent(q)}`:''));const rows=(x.leads||[]).map(d=>`<button class="lead lead-button" onclick="leadDetails('${d.id}')"><b>${esc(d.contact_name||d.company||'Без имени')}</b><span>${esc(d.company||'')} · ${esc(d.phone||'')}</span><br><small class="muted">${esc(d.lead_code)} · ${esc(d.google_sync_status)}</small></button>`).join('');el().innerHTML=`<div class="card"><h2>Зарегистрированные лиды</h2>${rows||'<p class="hint">Лидов пока нет.</p>'}<div class="spacer"></div><button class="btn secondary full" onclick="homeFromApi()">← Главное меню</button></div>`}

async function leadDetails(id){
  const x=await api('leads?id='+encodeURIComponent(id));
  const d=x.lead;if(!d){el().innerHTML='<div class="error">Лид не найден</div>';return}
  const needs=Array.isArray(d.needs)&&d.needs.length?d.needs.join(', '):'—';
  const potential=d.potential_cars??d.potential_range??'—';
  const recognized=d.recognized_text?'<details open><summary>Распознанный текст</summary><p class="hint" style="white-space:pre-wrap">'+esc(d.recognized_text)+'</p></details>':'';
  el().innerHTML=`<div class="card"><h2>${esc(d.contact_name||d.company||'Лид')}</h2><p class="muted">${esc(d.lead_code||'')}</p><div class="lead-detail"><p><b>Компания:</b> ${esc(d.company||'—')}</p><p><b>Должность:</b> ${esc(d.position||'—')}</p><p><b>Телефон:</b> ${esc(d.phone||'—')}</p><p><b>E-mail:</b> ${esc(d.email||'—')}</p><p><b>Тип клиента:</b> ${esc(d.client_type||'—')}</p><p><b>Потребность:</b> ${esc(needs)}</p><p><b>Потенциал:</b> ${esc(potential)}</p><p><b>Интерес:</b> ${esc(d.interest||'—')}</p><p><b>Комментарий:</b><br>${esc(d.comment||'—')}</p>${recognized}</div><div class="spacer"></div><button class="btn secondary full" onclick="listLeads()">← К списку</button></div>`;
}
function searchLeads(){el().innerHTML=`<div class="card"><h2>Поиск контакта</h2><input id="search_q" placeholder="ФИО, компания, телефон, e-mail"><div class="spacer"></div><button class="btn full" onclick="listLeads(search_q.value.trim())">Найти</button><div class="spacer"></div><button class="btn secondary full" onclick="homeFromApi()">← Главное меню</button></div>`}
completeFromHash().then(done=>{if(!done)boot()});