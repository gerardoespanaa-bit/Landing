'use strict';
(()=>{
 const registration=new URL(location.href).searchParams.getAll('registro');
 if(registration.length!==1||registration[0]!=='1')return;

 const lead=window.ProjectionLead,state=window.ProjectionState,config=window.PPR_HUBSPOT_FORM;
 const scenarios=window.ProjectionScenarios;
 if(!lead||!state||!config||!scenarios)return;

 const $=id=>document.getElementById(id);
 const dialog=$('directProjectionDialog'),form=$('directProjectionForm'),button=$('directProjectionContinue');
 const status=$('directProjectionStatus'),close=$('closeDirectProjection');
 const privacy=$('directProjectionPrivacy'),manage=$('measurementPreferences'),preferences=$('measurementDetails');
 const checkbox=$('directProjectionConsent'),refreshPrivacy=window.FormPrivacy?.bind(checkbox);
 const fields=[...form.querySelectorAll('input')];
 const campaign=lead.captureCampaign(location.href);
 const submit=lead.createSubmitter({config,fetcher:window.fetch.bind(window)});
 let sending=false,accepted=null;

 function message(text){status.textContent=text;status.hidden=false;}
 function setSending(value){
  sending=value;
  form.setAttribute('aria-busy',String(value));
  button.disabled=value;
  close.disabled=value;
  privacy.disabled=value;
  for(const field of fields)field.disabled=value||accepted!==null;
  button.textContent=value?'Guardando…':accepted?'Abrir mi proyección':'Continuar';
 }
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('cancel',event=>{if(sending)event.preventDefault();});
 dialog.addEventListener('close',()=>{
  document.body.classList.remove('lead-dialog-open');
  $('ageNow').focus({preventScroll:true});
 });
 if(manage&&!manage.hidden&&preferences){
  privacy.hidden=false;
  privacy.addEventListener('click',()=>{
   preferences.addEventListener('close',()=>privacy.focus({preventScroll:true}),{once:true});
   manage.click();
  });
 }

 form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(sending)return;
  status.hidden=true;
  setSending(true);
  try{
   if(!accepted){
    const priorConsent=refreshPrivacy?.();
    const contact=lead.validateContact($('directProjectionName').value,$('directProjectionPhone').value,checkbox.checked);
    const inputs=scenarios.validate({age:$('directProjectionAge').valueAsNumber,retire:$('directProjectionRetirement').valueAsNumber,monthly:$('directProjectionMonthly').valueAsNumber});
    const payload=lead.buildPayload({config,contact,projection:{inputs},kind:'simulation',buttonId:'simulator_direct',campaign,preferences:window.LandingConsent?.getPreferences(),consentCopy:priorConsent?window.FormPrivacy.text:undefined,cookie:document.cookie,pageUri:location.href,pageName:document.title});
    const result=await submit(payload);
    if(!result.ok)throw Error('Espera a que termine el envío.');
    accepted={contact,inputs};
   }
   let unlocked=false;
   try{unlocked=state.save(window.sessionStorage,accepted.contact.name,accepted.inputs);}catch{}
   if(!unlocked){
    message('Tu registro se guardó. Permite el almacenamiento de sesión y vuelve a pulsar el botón para abrir tu proyección.');
    return;
   }
   window.location.replace(new URL('../mi-proyeccion/',document.baseURI).href);
  }catch(error){
   message(error.message||'No pudimos confirmar el registro. Inténtalo de nuevo.');
  }finally{
   setSending(false);
  }
 });

 dialog.showModal();
 document.body.classList.add('lead-dialog-open');
})();
