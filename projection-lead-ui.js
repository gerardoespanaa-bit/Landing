'use strict';
(()=>{
 const $=id=>document.getElementById(id),form=$('projectionLeadForm');if(!form)return;
 const lead=window.ProjectionLead,state=window.ProjectionState,config=window.PPR_HUBSPOT_FORM;
 const campaign=lead.captureCampaign(location.href),submit=lead.createSubmitter({config,fetcher:window.fetch.bind(window)});
 const open=$('unlockProjectionButton'),link=$('completeProjectionLink'),continueButton=$('projectionLeadContinue'),status=$('projectionLeadStatus');
 let current=null,sending=false,savedContact=null;
 function stored(){try{return state.load(localStorage);}catch{return null;}}
 function save(name,inputs){try{return state.save(localStorage,name,inputs);}catch{return false;}}
 function showStatus(message){status.textContent=message;status.hidden=false;}
 function destination(){return new URL('../mi-proyeccion/',document.baseURI).href;}
 function sync(){open.disabled=!current;const unlocked=stored();open.hidden=Boolean(unlocked);link.hidden=!unlocked;link.href=destination();if(unlocked)form.hidden=true;}
 window.ProjectionFlow=Object.freeze({
  calculated(value){current=value;sync();},
  invalidated(){current=null;form.hidden=true;open.disabled=true;}
 });
 sync();
 open.addEventListener('click',()=>{if(!current)return;sync();if(stored())return;form.hidden=false;status.hidden=true;$('projectionLeadName').focus();form.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
 link.addEventListener('click',event=>{
  const saved=stored();if(!saved){event.preventDefault();sync();return;}
  if(current&&!save(saved.name,current.inputs)){event.preventDefault();form.hidden=false;showStatus('No se pudieron conservar los datos en este navegador. Permite el almacenamiento del sitio para abrir tu proyección.');}
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(sending)return;
  if(!current){showStatus('Calcula tu proyección antes de continuar.');return;}
  let contact;
  try{contact=lead.validateContact($('projectionLeadName').value,$('projectionLeadPhone').value,$('projectionLeadConsent').checked);}catch(error){showStatus(error.message);return;}
  const previous=stored();if(previous){if(save(previous.name,current.inputs))window.location.assign(destination());else showStatus('No se pudo guardar la proyección en este dispositivo.');return;}
  // Freeze this simulation while submitting; edits after a confirmed registration never create a new lead.
  const snapshot=current;sending=true;continueButton.disabled=true;continueButton.textContent='Guardando…';form.setAttribute('aria-busy','true');
  for(const id of ['projectionLeadName','projectionLeadPhone','projectionLeadConsent'])$(id).disabled=true;
  for(const input of document.querySelectorAll('#retirementForm input,#retirementForm button'))input.disabled=true;
  try{
   const payload=lead.buildPayload({config,contact,projection:snapshot,campaign,preferences:window.LandingConsent?.getPreferences(),cookie:document.cookie,pageUri:new URL('./',document.baseURI).href});
   const result=await submit(payload);if(!result.ok){showStatus('El registro está en proceso. Espera un momento.');return;}
   savedContact=savedContact||contact;
   if(!save(savedContact.name,snapshot.inputs)){
    showStatus('HubSpot confirmó tu registro, pero este navegador bloqueó el guardado de tu proyección. Permite el almacenamiento del sitio y pulsa Continuar; no volveremos a enviar el registro en esta página.');return;
   }
   window.location.assign(destination());
  }catch(error){showStatus(error.message||'No pudimos confirmar el registro. Inténtalo de nuevo.');}
  finally{
   sending=false;continueButton.disabled=false;continueButton.textContent='Continuar';form.setAttribute('aria-busy','false');
   for(const id of ['projectionLeadName','projectionLeadPhone','projectionLeadConsent'])$(id).disabled=false;
   for(const input of document.querySelectorAll('#retirementForm input,#retirementForm button'))input.disabled=false;
  }
 });
})();
