'use strict';
// Synchronous head bootstrap: consent and safe page parameters BEFORE GTM.
// Queues commands for GTM; never downloads gtag.js or configures GA4 directly.
(()=>{
 if(window.LandingConsent)return;
 const config=window.LANDING_MEASUREMENT_CONFIG||{};
 if(config.enabled!==true||config.gtmContainerId!=='GTM-KMG6BPKF'||config.ga4MeasurementId!=='G-VSNRQ7H8JL')return;
 const storageKey='landing-privacy-consent-v3',legacyKey='landing-analytics-consent-v2',maxAge=180*86400000;
 const noticeVersion='privacy-2026-10-28-v3';
 function fresh(saved){const age=Date.now()-saved.updatedAt;return Number.isFinite(saved.updatedAt)&&age>=0&&age<maxAge;}
 function read(raw){
  try{const saved=JSON.parse(raw);if(saved.version!==3||saved.noticeVersion!==noticeVersion||typeof saved.analytics!=='boolean'||typeof saved.advertising!=='boolean'||!fresh(saved))return null;return Object.freeze({analytics:saved.analytics,advertising:saved.advertising});}catch{return null;}
 }
 function readLegacy(raw){
  try{const saved=JSON.parse(raw);if(!['granted','denied'].includes(saved.choice)||!fresh(saved))return null;return Object.freeze({analytics:saved.choice==='granted',advertising:false});}catch{return null;}
 }
 let preferences=null;
 try{const raw=localStorage.getItem(storageKey);preferences=raw===null?readLegacy(localStorage.getItem(legacyKey)):read(raw);}catch{}
 window.dataLayer=window.dataLayer||[];
 function command(){window.dataLayer.push(arguments);}
 function clearCookies(pattern){
  const paths=new Set(['/']),segments=location.pathname.split('/').filter(Boolean);
  if(!location.pathname.endsWith('/'))segments.pop();
  let path='';for(const segment of segments){path+='/'+segment;paths.add(path);paths.add(path+'/');}
  const names=document.cookie.split(';').map(cookie=>cookie.trim().split('=')[0]).filter(name=>pattern.test(name));
  for(const name of names)for(const path of paths)for(const domain of ['',`; domain=${location.hostname}`,`; domain=.${location.hostname}`])document.cookie=`${name}=; Max-Age=0; path=${path}${domain}; SameSite=Lax`;
 }
 function state(){return {analytics_storage:preferences?.analytics?'granted':'denied',ad_storage:preferences?.advertising?'granted':'denied',ad_user_data:preferences?.advertising?'granted':'denied',ad_personalization:'denied'};}
 function removeOptionalStorage(){
  if(!preferences?.analytics)clearCookies(/^_ga(?:_|$)/);
  if(!preferences?.advertising){clearCookies(/^_(?:gcl|gac)_/);try{localStorage.removeItem('_gcl_ls');}catch{}}
 }
 function apply(next){preferences=next;command('consent','update',state());removeOptionalStorage();window.dispatchEvent(new CustomEvent('landing:consent-change'));}
 // Restore each purpose independently; an old analytics-only decision never grants advertising.
 if(preferences)command('consent','update',state());
 removeOptionalStorage();
 // Campaign metadata is closed vocabulary, never user-entered keyword/message text.
 // New campaigns/sources need an explicit review of these values before launch.
 const utmValues={
  utm_source:new Set(['google']),
  utm_medium:new Set(['cpc']),
  utm_campaign:new Set(['ppr_mexico_15d','ppr_queretaro_15d']),
  utm_id:new Set(['ppr_mx_15d','ppr_qro_15d']),
  utm_term:new Set(['plan_personal_de_retiro','contratar_ppr','asesoria_ppr']),
  utm_content:new Set(['rsa_ppr_contratar','rsa_ppr_asesoria'])
 };
 const campaignIds=new Set(Array.isArray(config.adsCampaignIds)?config.adsCampaignIds.filter(id=>typeof id==='string'&&/^[1-9][0-9]{0,19}$/.test(id)):[]);
 // Exact hostnames only: no arbitrary domains, subdomains, credentials or ports.
 const referrerHosts=new Set([
  'google.com','www.google.com','google.com.mx','www.google.com.mx',
  'bing.com','www.bing.com','duckduckgo.com','www.duckduckgo.com',
  'search.yahoo.com','facebook.com','www.facebook.com','m.facebook.com','l.facebook.com',
  'instagram.com','www.instagram.com','l.instagram.com',
  'linkedin.com','www.linkedin.com','lnkd.in','t.co'
 ]);
 function safeLocation(canonical){
  const result=new URL(canonical);
  try{
   const incoming=new URL(location.href||document.baseURI);
   if(incoming.origin!==result.origin||incoming.search.length>4096)return result.href;
   // Reject every occurrence of duplicated keys, including case variants.
   const counts=new Map();
   for(const key of incoming.searchParams.keys())counts.set(key.toLowerCase(),(counts.get(key.toLowerCase())||0)+1);
   for(const key of ['gclid','gbraid','wbraid','gad_source','gad_campaignid',...Object.keys(utmValues)]){
    if(counts.get(key)!==1||!incoming.searchParams.has(key))continue;
    const value=incoming.searchParams.get(key);
    let allowed=false;
    if(key==='gclid'||key==='gbraid'||key==='wbraid'){
     // Opaque platform IDs: bounded URL-safe token, no whitespace, punctuation,
     // email/phone-only values, nested URLs or recursive percent decoding.
     // This validates syntax, not that a token was issued by Google.
     allowed=/^[A-Za-z0-9_-]{20,512}$/.test(value)&&/[A-Za-z]/.test(value)&&/[0-9]/.test(value);
    }else if(key==='gad_source')allowed=/^[1-9][0-9]{0,2}$/.test(value);
    else if(key==='gad_campaignid')allowed=campaignIds.has(value);
    else allowed=utmValues[key].has(value);
    if(allowed)result.searchParams.set(key,value);
   }
  }catch{}
  return result.href;
 }
 function safeReferrer(){
  try{
   const ref=new URL(document.referrer);
   if(!['https:','http:'].includes(ref.protocol)||ref.username||ref.password||ref.port)return '';
   if(ref.origin!==new URL(document.baseURI).origin&&!referrerHosts.has(ref.hostname))return '';
   return ref.origin+'/';
  }catch{return '';}
 }
 const privacy=location.pathname.endsWith('/aviso-de-privacidad.html');
 const page=Object.freeze({
  measurement_id:config.ga4MeasurementId,
  page_location:safeLocation(new URL(privacy?'aviso-de-privacidad.html':'./',document.baseURI).href),
  page_referrer:safeReferrer(),
  page_title:privacy?'Aviso de privacidad':'Gerardo España | Asesoría financiera y patrimonial'
 });
 // Global defaults plus the existing DLVs. Only approved campaign metadata and
 // a known referring origin; never a raw URL, fragment or arbitrary query.
 command('set',{
  page_location:page.page_location,page_referrer:page.page_referrer,page_title:page.page_title,
  allow_google_signals:false,allow_ad_personalization_signals:false,
  ads_data_redaction:true,url_passthrough:false
 });
 window.dataLayer.push({...page});
 window.LandingConsent=Object.freeze({
  getChoice:()=>preferences===null?null:preferences.analytics?'granted':'denied',
  getPreferences:()=>preferences,
  choose(next){
   // Compatibility calls retain their original analytics-only scope.
   if(next==='granted')next={analytics:true,advertising:false};
   else if(next==='denied')next={analytics:false,advertising:false};
   if(!next||typeof next!=='object'||Object.keys(next).sort().join(',')!=='advertising,analytics'||typeof next.analytics!=='boolean'||typeof next.advertising!=='boolean')return false;
   const selected=Object.freeze({analytics:next.analytics,advertising:next.advertising});
   try{localStorage.setItem(storageKey,JSON.stringify({version:3,noticeVersion,...selected,updatedAt:Date.now()}));localStorage.removeItem(legacyKey);}catch{}
   apply(selected);return true;
  }
 });
 window.addEventListener('storage',event=>{
  if(event.key===storageKey)apply(read(event.newValue));
  else if(event.key===null)apply(null);
  else if(event.key===legacyKey){try{if(localStorage.getItem(storageKey)===null)apply(readLegacy(event.newValue));}catch{apply(null);}}
 });
})();
