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
 const privacy=location.pathname.endsWith('/aviso-de-privacidad.html');
 const page=Object.freeze({
  measurement_id:config.ga4MeasurementId,
  page_location:new URL(privacy?'aviso-de-privacidad.html':'./',document.baseURI).href,
  page_referrer:'',
  page_title:privacy?'Aviso de privacidad':'Gerardo España | Asesoría financiera y patrimonial'
 });
 // Global defaults plus explicit DLVs for GTM. No query, hash or raw referrer.
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
