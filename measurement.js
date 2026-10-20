'use strict';
(()=>{
 if(window.LandingMeasurement)return;
 const consent=window.LandingConsent;
 const services=new Set(['general','retiro','seguros','bolsa','auto']);
 const locations=new Set(['header','hero','simulator','services','about','cta_band','floating','footer']);
 const events=new Set(['simulator_open','simulator_complete','whatsapp_contact']);
 const banner=document.getElementById('measurementConsent'),manage=document.getElementById('measurementPreferences');
 let returnFocus=null;
 function close(){
  if(banner)banner.hidden=true;
  if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});
  returnFocus=null;
 }
 if(consent&&banner&&manage){
  manage.hidden=false;banner.hidden=consent.getChoice()!==null;
  manage.addEventListener('click',()=>{
   returnFocus=manage;banner.hidden=false;banner.querySelector('button').focus();
  });
  banner.querySelectorAll('[data-analytics-choice]').forEach(button=>button.addEventListener('click',()=>{
   if(consent.choose(button.dataset.analyticsChoice))close();
  }));
  window.addEventListener('landing:consent-change',()=>{banner.hidden=consent.getChoice()!==null;});
 }
 function track(name,service,location){
  if(!consent||!events.has(name)||!services.has(service)||!locations.has(location))return false;
  // Advanced mode: Google tags apply consent to these allowlisted interactions.
  // No user input, financial amount, phone, message, link URL or retroactive replay.
  window.dataLayer.push({event:name,service,button_location:location});
  return true;
 }
 window.LandingMeasurement=Object.freeze({track});
})();
