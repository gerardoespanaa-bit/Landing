'use strict';
// Synchronous head bootstrap: consent and safe page parameters BEFORE GTM.
// Queues commands for GTM; never downloads gtag.js or configures GA4 directly.
(()=>{
 if(window.LandingConsent)return;
 const config=window.LANDING_MEASUREMENT_CONFIG||{};
 if(config.enabled!==true||config.gtmContainerId!=='GTM-KMG6BPKF'||config.ga4MeasurementId!=='G-VSNRQ7H8JL')return;
 const storageKey='landing-analytics-consent-v2',maxAge=180*86400000;
 const choices=new Set(['granted','denied']);
 function read(raw){
  try{
   const saved=JSON.parse(raw),age=Date.now()-saved.updatedAt;
   return choices.has(saved.choice)&&Number.isFinite(saved.updatedAt)&&age>=0&&age<maxAge?saved.choice:null;
  }catch{return null;}
 }
 let choice=null;
 try{choice=read(localStorage.getItem(storageKey));}catch{}
 window.dataLayer=window.dataLayer||[];
 function command(){window.dataLayer.push(arguments);}
 function clearAnalyticsCookies(){
  const paths=new Set(['/']),segments=location.pathname.split('/').filter(Boolean);
  if(!location.pathname.endsWith('/'))segments.pop();
  let path='';for(const segment of segments){path+='/'+segment;paths.add(path);paths.add(path+'/');}
  const names=document.cookie.split(';').map(cookie=>cookie.trim().split('=')[0]).filter(name=>/^_ga(?:_|$)/.test(name));
  for(const name of names)for(const path of paths)for(const domain of ['',`; domain=${location.hostname}`,`; domain=.${location.hostname}`]){
   document.cookie=`${name}=; Max-Age=0; path=${path}${domain}; SameSite=Lax`;
  }
 }
 function apply(next){
  choice=next;
  command('consent','update',{
   analytics_storage:choice==='granted'?'granted':'denied',
   ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'
  });
  if(choice!=='granted')clearAnalyticsCookies();
  window.dispatchEvent(new CustomEvent('landing:consent-change'));
 }
 // The inline default is already denied. Restore a valid saved choice before GTM starts.
 if(choice==='granted')command('consent','update',{
  analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'
 });
 else clearAnalyticsCookies();
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
  getChoice:()=>choice,
  choose(next){
   if(!choices.has(next))return false;
   try{localStorage.setItem(storageKey,JSON.stringify({choice:next,updatedAt:Date.now()}));}catch{}
   apply(next);return true;
  }
 });
 // A preference changed in another tab also applies to this already-open page.
 window.addEventListener('storage',event=>{
  if(event.key===storageKey||event.key===null)apply(read(event.newValue));
 });
})();

