'use strict';
(()=>{
 if(window.LandingMeasurement)return;
 const config=window.LANDING_MEASUREMENT_CONFIG||{};
 const ready=config.enabled===true&&config.privacyApproved===true&&/^GTM-[A-Z0-9]{4,20}$/.test(config.gtmContainerId||'')&&/^G-[A-Z0-9]{4,20}$/.test(config.ga4MeasurementId||'');
 const services=new Set(['general','retiro','seguros','bolsa','auto']);
 const locations=new Set(['header','hero','simulator','services','about','cta_band','floating','footer']);
 const events=new Set(['simulator_open','simulator_complete','whatsapp_contact']);
 const storageKey='landing-analytics-consent-v1';
 const pageKind=document.body.dataset.page==='privacy'?'privacy':'landing';
 // Only known page paths. No query string, fragment, referrer or editable text.
 const pageLocation=new URL(pageKind==='privacy'?'aviso-de-privacidad.html':'./',document.baseURI).href;
 let consent=null,loaded=false;
 try{const saved=JSON.parse(localStorage.getItem(storageKey));if(saved&&Date.now()-saved.updatedAt<180*86400000&&['granted','denied'].includes(saved.choice))consent=saved.choice;}catch{}
 function command(){window.dataLayer.push(arguments);}
 function load(){
  if(!ready||consent!=='granted'||loaded)return;
  loaded=true;
  window.dataLayer=window.dataLayer||[];
  command('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  command('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  window.dataLayer.push({measurement_id:config.ga4MeasurementId,page_location:pageLocation,page_referrer:'',page_title:pageKind==='privacy'?'Aviso de privacidad':'Gerardo España | Asesoría financiera y patrimonial'});
  window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});
  const script=document.createElement('script');script.async=true;script.id='landing-gtm';script.src='https://www.googletagmanager.com/gtm.js?id='+config.gtmContainerId;document.head.append(script);
  window.dataLayer.push({event:'landing_page_view'});
 }
 function track(name,service,location){
  if(!ready||consent!=='granted'||!events.has(name)||!services.has(service)||!locations.has(location))return false;
  load();
  // Construct a fresh payload: never spread a DOM object or user-supplied data.
  window.dataLayer.push({event:name,service,button_location:location});
  return true;
 }
 function clearAnalyticsCookies(){
  const paths=new Set(['/']),segments=location.pathname.split('/').filter(Boolean);if(!location.pathname.endsWith('/'))segments.pop();let path='';for(const segment of segments){path+='/'+segment;paths.add(path);paths.add(path+'/');}
  const names=document.cookie.split(';').map(cookie=>cookie.trim().split('=')[0]).filter(name=>/^_ga(?:_|$)/.test(name));
  for(const name of names)for(const path of paths)for(const domain of ['',`; domain=${location.hostname}`,`; domain=.${location.hostname}`])document.cookie=`${name}=; Max-Age=0; path=${path}${domain}; SameSite=Lax`;
 }
 const banner=document.getElementById('measurementConsent'),manage=document.getElementById('measurementPreferences');
 function choose(choice){
  consent=choice;
  try{localStorage.setItem(storageKey,JSON.stringify({choice,updatedAt:Date.now()}));}catch{}
  if(banner)banner.hidden=true;
  if(choice==='granted')load();
  else if(loaded){command('consent','update',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});clearAnalyticsCookies();location.reload();}
 }
 if(ready){
  if(manage){manage.hidden=false;manage.addEventListener('click',()=>{banner.hidden=false;banner.querySelector('button').focus();});}
  if(banner){banner.hidden=consent!==null;banner.querySelectorAll('[data-analytics-choice]').forEach(button=>button.addEventListener('click',()=>choose(button.dataset.analyticsChoice)));}
  load();
 }
 // No pre-consent queue and no public API accepting arbitrary event parameters.
 window.LandingMeasurement=Object.freeze({track});
})();
