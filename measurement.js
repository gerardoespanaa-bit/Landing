'use strict';
(()=>{
 if(window.LandingMeasurement)return;
 const consent=window.LandingConsent;
 const services=new Set(['general','retiro','seguros','bolsa','auto']);
 const locations=new Set(['header','hero','simulator','services','about','cta_band','floating','footer']);
 const events=new Set(['simulator_open','simulator_complete','whatsapp_contact','ui_click']);
 // Closed identifiers describe interface controls, never the visitor or field values.
 const controls=new Map();
 function controlsAt(service,location,ids,actions){for(const id of ids)controls.set(id,{service,location,actions:new Set(actions)});}
 controlsAt('general','header',['wa_header_social'],['whatsapp_contact']);
 controlsAt('general','header',['wa_header_advisory'],['whatsapp_contact','open_contact','close_contact']);
 controlsAt('general','hero',['wa_hero_advisory'],['whatsapp_contact','open_contact','close_contact']);
 controlsAt('retiro','simulator',['wa_simulator_results'],['whatsapp_contact','open_contact','close_contact']);
 controlsAt('retiro','services',['wa_retirement_card'],['whatsapp_contact','open_contact','close_contact']);
 controlsAt('seguros','services',['wa_insurance_card'],['whatsapp_contact','open_contact','close_contact']);
 controlsAt('bolsa','services',['wa_investments_card'],['whatsapp_contact','open_contact','close_contact']);
 controlsAt('auto','services',['wa_auto_card'],['whatsapp_contact','open_contact','close_contact']);
 controlsAt('general','about',['wa_about_social'],['whatsapp_contact']);
 controlsAt('general','cta_band',['wa_cta_advisory'],['whatsapp_contact','open_contact','close_contact']);
 controlsAt('general','floating',['wa_floating'],['whatsapp_contact','open_contact','close_contact']);
 controlsAt('general','header',['nav_logo','nav_about','nav_services'],['navigate']);
 controlsAt('general','footer',['footer_home','footer_services'],['navigate']);
 controlsAt('general','header',['social_header_tiktok','social_header_instagram','social_header_linkedin'],['external_link']);
 controlsAt('general','about',['social_about_tiktok','social_about_instagram','social_about_linkedin'],['external_link']);
 controlsAt('general','header',['mobile_menu'],['open','close']);
 controlsAt('retiro','simulator',['simulator_close'],['close']);
 controlsAt('retiro','simulator',['projection_details'],['open','close']);
 controlsAt('general','about',['profile_allianz','profile_education','profile_amib','profile_cnsf'],['select']);
 controlsAt('general','about',['credential_amib','credential_cnsf'],['open']);
 controlsAt('general','about',['credential_close'],['close']);
 const banner=document.getElementById('measurementConsent'),manage=document.getElementById('measurementPreferences');
 const preferences=document.getElementById('measurementDetails'),preferencesLink=document.getElementById('openMeasurementPreferences');
 const analytics=document.getElementById('consentAnalytics'),advertising=document.getElementById('consentAdvertising');
 let returnFocus=null;
 function syncConsentUI(){
  const saved=consent.getPreferences();
  banner.hidden=Boolean(preferences.open)||saved!==null;
  analytics.checked=saved?.analytics===true;advertising.checked=saved?.advertising===true;
 }
 if(consent&&typeof consent.getPreferences==='function'&&banner&&manage&&preferences&&preferencesLink&&analytics&&advertising){
  manage.hidden=false;syncConsentUI();
  function openPreferences(opener){
   returnFocus=opener;
   if(!preferences.open)preferences.showModal();
   syncConsentUI();preferences.querySelector('[data-close-measurement]').focus();
  }
  manage.addEventListener('click',()=>openPreferences(manage));
  preferencesLink.addEventListener('click',event=>{event.preventDefault();openPreferences(preferencesLink);});
  preferences.querySelector('[data-close-measurement]').addEventListener('click',()=>preferences.close());
  preferences.addEventListener('close',()=>{
   syncConsentUI();const target=returnFocus===preferencesLink&&banner.hidden?manage:returnFocus;
   if(target?.isConnected)target.focus({preventScroll:true});returnFocus=null;
  });
  for(const surface of [banner,preferences])surface.querySelectorAll('[data-consent-action]').forEach(button=>button.addEventListener('click',()=>{
   const action=button.dataset.consentAction;
   const selected=action==='accept-measurement'?{analytics:true,advertising:true}:action==='essential'?{analytics:false,advertising:false}:action==='save'?{analytics:analytics.checked,advertising:advertising.checked}:null;
   if(!selected||!consent.choose(selected))return;
   if(preferences.open)preferences.close();syncConsentUI();
  }));
  window.addEventListener('landing:consent-change',syncConsentUI);
 }
 function track(name,service,location,details){
  if(!consent||!events.has(name)||!services.has(service)||!locations.has(location))return false;
  let buttonId=null,actionType=null;
  if(name==='ui_click'||name==='whatsapp_contact'){
   buttonId=details?.button_id;
   actionType=name==='ui_click'?details?.action_type:null;
   const control=controls.get(buttonId),action=actionType||name;
   if(!control||control.service!==service||control.location!==location||!control.actions.has(action))return false;
  }else if(service!=='retiro'||(name==='simulator_complete'?location!=='simulator':!['header','hero','footer'].includes(location)))return false;
  // Advanced mode: Google tags apply consent to these allowlisted interactions.
  // No user input, financial amount, phone, message, link URL or retroactive replay.
  // Explicit nulls clear the previous event's values in GTM's data model.
  window.dataLayer.push({event:name,service,button_location:location,button_id:buttonId,action_type:actionType});
  return true;
 }
 window.LandingMeasurement=Object.freeze({track});
})();



