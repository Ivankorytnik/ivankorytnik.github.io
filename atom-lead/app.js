const API='https://ytdacypygsfalkixhemj.supabase.co/functions/v1/atom-lead-api';
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


function normalizePhoneLocal(v){
  let d=String(v||'').replace(/\D/g,'');
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

function parseLeadText(text,source='voice',metaLines=[]){
  const raw=String(text||'').trim();
  const lines=source==='card'?usefulCardLines(raw):smartLines(raw);
  const joined=' '+lines.join(' ').replace(/\s+/g,' ')+' ';
  const phoneRaw=firstMatch(joined,/((?:\+?7|8)[\s\-\(\)0-9ОOІI|l]{9,20})/i);
  const phone=normalizePhoneLocal(phoneRaw);
  const email=extractEmailOcr(joined);
  let website=normalizeWebsiteOcr(firstMatch(joined,/((?:https?:\/\/)?(?:www\.)?[a-z0-9а-яё-]+(?:\s*\.\s*[a-z0-9а-яё-]+)+(?:\/[^\s]*)?)/i));
  if(email&&website===email.split('@')[1])website='';
  const potentialM=joined.match(/(?:около|примерно|до|на)?\s*(\d{1,4})\s*(?:авто|автомобил|машин|единиц)/i);
  const potential=potentialM?Number(potentialM[1]):null;

  let company='';
  const companyLine=lines.find(x=>/\b(?:ООО|АО|ПАО|ИП|ГК|ГБУ|ГУП|МУП|ФГУП|LLC|JSC|LTD|INC)\b/i.test(x));
  if(companyLine) company=stripCardContacts(companyLine).slice(0,255);
  if(!company) company=firstMatch(joined,/(?:компания|организация|работаю в|из компании)\s+["«]?([^,.;\n]{2,80})/i);

  const roleRe=/(генеральн(?:ый|ого) директор|коммерческ(?:ий|ого) директор|директор по [^,.;\n]{2,50}|руководител[ья] [^,.;\n]{0,60}|начальник [^,.;\n]{0,60}|менеджер [^,.;\n]{0,60}|CEO|CFO|COO|директор|руководитель|менеджер)/i;
  let position='';
  const roleLine=lines.find(x=>roleRe.test(x));
  if(roleLine) position=stripCardContacts(roleLine).slice(0,255);

  let contact='';
  contact=firstMatch(joined,/(?:меня зовут|это|фио|имя)\s+([А-ЯЁA-Z][а-яёa-z-]+(?:\s+[А-ЯЁA-Z][а-яёa-z-]+){1,2})/);
  if(!contact){
    const banned=/(ооо|ао|пао|ип|llc|ltd|inc|директор|руководитель|менеджер|тел|моб|phone|email|e-mail|www|http|компания|отдел|департамент|офис|office)/i;
    const cand=lines.map(stripCardContacts).find(x=>!banned.test(x)&&x.length>=5&&x.length<=60&&/^[А-ЯЁA-Z][А-ЯЁA-Zа-яёa-z-]+(?:\s+[А-ЯЁA-Z][А-ЯЁA-Zа-яёa-z-]+){1,2}$/.test(x));
    if(cand) contact=cand;
  }
  if(!contact&&source==='card')contact=inferNameFromMeta(metaLines,lines);

  let client_type='';
  if(/таксопарк|такси парк|taxi/i.test(joined))client_type='Таксопарк';
  else if(/каршеринг|carsharing/i.test(joined))client_type='Каршеринг';
  else if(/лизинг|leasing/i.test(joined))client_type='Лизинговая компания';
  else if(/государствен|госкомпан|гбу|гуп|фгуп/i.test(joined))client_type='Государственная компания';
  else if(/партн[её]р/i.test(joined))client_type='Партнёр';

  const needs=[];
  const add=n=>{if(!needs.includes(n))needs.push(n)};
  if(/тест[- ]?драйв/i.test(joined))add('Тест-драйв');
  if(/лизинг/i.test(joined))add('Лизинг');
  if(/каршеринг/i.test(joined))add('Каршеринг');
  if(/такси|таксопарк/i.test(joined))add('Такси');
  if(/партн[её]р/i.test(joined))add('Партнёрство');
  if(/автопарк|корпоративн.*парк/i.test(joined))add('Корпоративный автопарк');
  if(/купить|покупк|закупк|приобрест/i.test(joined))add('Покупка автомобилей');

  let interest='';
  if(/высок(?:ий|ая).*интерес|горяч/i.test(joined))interest='Высокий';
  else if(/средн(?:ий|яя).*интерес/i.test(joined))interest='Средний';
  else if(/предварительн/i.test(joined))interest='Предварительный';

  let next='';
  const nextM=joined.match(/(?:следующий шаг|договорились|нужно|надо|перезвонить|связаться)\s*[:\-]?\s*([^.;]{3,120})/i);
  if(nextM)next=nextM[1].trim();

  const comment=source==='card'?'Данные распознаны с визитки автоматически. Проверьте поля перед сохранением.':('Распознано голосом'+(raw?'\n'+raw:''));
  return {contact_name:contact,company,position,phone,email,website,client_type,needs,potential_cars:potential,potential_range:'',interest,comment,next_step:next,next_step_date:''};
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
let speechRec=null,speechFinal='';
function voiceLead(){
  el().innerHTML=`<div class="card"><h2>🎙️ Лид голосом</h2><p class="hint">Нажмите «Начать запись» и продиктуйте данные. Распознавание использует функцию телефона/браузера и не расходует API-кредиты.</p><button id="voice_start" class="btn full" onclick="startVoice()">🎙️ Начать запись</button><div class="spacer"></div><button id="voice_stop" class="btn secondary full" onclick="stopVoice()" disabled>⏹ Остановить</button><div class="spacer"></div><textarea id="voice_text" placeholder="Если голосовой ввод не поддерживается, нажмите микрофон на клавиатуре телефона и продиктуйте сюда"></textarea><div class="spacer"></div><button class="btn full" onclick="voiceTextToLead()">Заполнить лид из текста</button><div class="spacer"></div><button class="btn secondary full" onclick="homeFromApi()">← Главное меню</button><div id="voicemsg"></div></div>`;
}
function startVoice(){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  const m=document.getElementById('voicemsg');
  if(!SR){
    m.innerHTML='<div class="notice">В этом Telegram голосовое распознавание браузера недоступно. Нажмите поле ниже, откройте клавиатуру и используйте микрофон клавиатуры — это тоже без API-кредитов.</div>';
    document.getElementById('voice_text').focus();return;
  }
  try{
    speechFinal='';speechRec=new SR();speechRec.lang='ru-RU';speechRec.continuous=true;speechRec.interimResults=true;
    speechRec.onresult=e=>{
      let interim='';
      for(let i=e.resultIndex;i<e.results.length;i++){const t=e.results[i][0].transcript;if(e.results[i].isFinal)speechFinal+=t+' ';else interim+=t}
      document.getElementById('voice_text').value=(speechFinal+interim).trim();
    };
    speechRec.onerror=e=>{m.innerHTML='<div class="error">Голосовой ввод не сработал. Используйте микрофон клавиатуры в поле ниже.</div>'};
    speechRec.onend=()=>{voice_start.disabled=false;voice_stop.disabled=true};
    speechRec.start();voice_start.disabled=true;voice_stop.disabled=false;
    m.innerHTML='<div class="notice">🔴 Говорите данные клиента. После окончания нажмите «Остановить».</div>';
  }catch(e){m.innerHTML='<div class="error">Не удалось запустить распознавание. Используйте микрофон клавиатуры.</div>'}
}
function stopVoice(){
  try{speechRec?.stop()}catch{}
  voice_start.disabled=false;voice_stop.disabled=true;
  const m=document.getElementById('voicemsg');if(m)m.innerHTML='<div class="notice">Текст готов. Нажмите «Заполнить лид из текста».</div>';
}
function voiceTextToLead(){
  const t=document.getElementById('voice_text').value.trim();
  if(!t){document.getElementById('voicemsg').innerHTML='<div class="error">Сначала продиктуйте или введите текст.</div>';return}
  applyDraft(parseLeadText(t,'voice'));
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