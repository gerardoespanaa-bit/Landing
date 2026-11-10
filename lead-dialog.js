'use strict';
(()=>{
 const lead=window.ProjectionLead,config=window.PPR_HUBSPOT_FORM,state=window.ProjectionState;if(!lead||!config||!state)return;
 const campaign=lead.captureCampaign(location.href),saved=new Map();let context=null,sending=false,opener=null;
 const dialog=document.createElement('dialog');dialog.id='projectionLeadDialog';dialog.className='lead-dialog';dialog.setAttribute('aria-labelledby','projectionLeadTitle');
 const base=new URL(document.body.dataset.projectionFull==='true'||location.pathname.endsWith('/simulador/')?'../':'./',document.baseURI);
 const privacy=new URL('aviso-de-privacidad.html#registro-simulacion',base),resultUrl=new URL('mi-proyeccion/',base);
 dialog.innerHTML=`
  <button type="button" class="modal-close" id="closeProjectionLead" aria-label="Cerrar formulario">×</button>
  <form id="projectionLeadForm" class="projection-lead-form" novalidate data-hs-do-not-collect="true">
   <h2 id="projectionLeadTitle"></h2>
   <label for="projectionLeadName">Nombre<input id="projectionLeadName" name="firstname" type="text" autocomplete="given-name" maxlength="100" minlength="2" required></label>
   <label for="projectionLeadPhone">Teléfono / WhatsApp<input id="projectionLeadPhone" name="phone" type="tel" autocomplete="tel-national" inputmode="numeric" maxlength="20" placeholder="10 dígitos de México" required></label>
   <div id="advisoryProjectionInputs" class="projection-lead-inputs" hidden>
    <label for="advisoryProjectionAge">Edad actual
     <input id="advisoryProjectionAge" type="number" inputmode="numeric" min="18" max="64" step="1" placeholder="35" required>
    </label>
    <label for="advisoryProjectionRetirement">Edad deseada de retiro
     <input id="advisoryProjectionRetirement" type="number" inputmode="numeric" min="60" max="90" step="1" value="65" required>
    </label>
    <label for="advisoryProjectionMonthly">Aportación mensual (MXN)
     <input id="advisoryProjectionMonthly" type="number" inputmode="numeric" min="2000" max="1000000" step="1" placeholder="Mínimo $2,000" required>
    </label>
   </div>
   <label class="projection-lead-consent"><input id="projectionLeadConsent" type="checkbox" required><span>Acepto <a id="projectionLeadPrivacyLink" target="_blank" rel="noopener noreferrer">aviso de privacidad</a></span></label>
   <button class="btn btn-primary" id="projectionLeadContinue" type="submit">Continuar</button>
   <p id="projectionLeadStatus" role="status" aria-live="polite" hidden></p>
  </form>`;
 document.body.append(dialog);const $=id=>document.getElementById(id),form=$('projectionLeadForm'),button=$('projectionLeadContinue'),status=$('projectionLeadStatus');
 const advisoryFields=$('advisoryProjectionInputs'),checkbox=$('projectionLeadConsent');
 $('projectionLeadPrivacyLink').href=privacy.href;
 const refreshPrivacy=window.FormPrivacy?.bind(checkbox);
 function key(c){return c.kind+'|'+c.buttonId;}
 function message(text){status.hidden=false;status.textContent=text;}
 function inputs(disabled){for(const el of form.querySelectorAll('input'))el.disabled=disabled||saved.has(key(context));button.disabled=disabled;$('closeProjectionLead').disabled=disabled;}
 function measure(action){if(!context?.measurement)return;try{window.LandingMeasurement?.track('ui_click','general',context.measurement.location,{button_id:context.buttonId,action_type:action});}catch{}}
 $('closeProjectionLead').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('cancel',e=>{if(sending)e.preventDefault();});
 dialog.addEventListener('close',()=>{measure('close_contact');document.body.classList.remove('lead-dialog-open');if(opener?.isConnected)opener.focus({preventScroll:true});});
 window.LandingLeadForms=Object.freeze({open(options){
  if(dialog.open||sending)return false;
  if(!['simulation','advisory','contract'].includes(options.kind)||!lead.validSource(options.kind,options.buttonId))return false;
  if(options.kind==='simulation'&&!options.projection)return false;
  context={...options,submit:lead.createSubmitter({config,fetcher:window.fetch.bind(window)})};opener=options.opener||document.activeElement;
  form.reset();status.hidden=true;refreshPrivacy?.();
  advisoryFields.hidden=options.kind==='simulation';
  const accepted=saved.get(key(options));
  button.textContent=accepted?'Abrir mi proyección':'Continuar';
  if(accepted){
   $('projectionLeadName').value=accepted.contact.name;$('projectionLeadPhone').value=accepted.contact.phone;
   $('advisoryProjectionAge').value=accepted.inputs.age;$('advisoryProjectionRetirement').value=accepted.inputs.retire;$('advisoryProjectionMonthly').value=accepted.inputs.monthly;
   checkbox.checked=true;
   message('Tu registro ya se guardó. Pulsa el botón para abrir tu proyección.');
  }
  inputs(false);
  $('projectionLeadTitle').textContent=options.kind==='contract'?'Te contactaremos para contratar tu plan':options.kind==='simulation'?'Ver tu proyección completa':'Agenda una asesoría gratis';
  dialog.showModal();document.body.classList.add('lead-dialog-open');measure('open_contact');
  (accepted?button:$('projectionLeadName')).focus();return true;
 }});
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(sending||!context)return;
  const active=context;status.hidden=true;sending=true;inputs(true);button.textContent='Guardando…';form.setAttribute('aria-busy','true');
  try{
   let accepted=saved.get(key(active));
   if(!accepted){
    const priorConsent=refreshPrivacy?.();
    const contact=lead.validateContact($('projectionLeadName').value,$('projectionLeadPhone').value,checkbox.checked);
    const projection=active.projection||{inputs:window.ProjectionScenarios.validate({
     age:$('advisoryProjectionAge').valueAsNumber,
     retire:$('advisoryProjectionRetirement').valueAsNumber,
     monthly:$('advisoryProjectionMonthly').valueAsNumber
    })};
    const payload=lead.buildPayload({config,contact,projection,kind:active.kind,buttonId:active.buttonId,campaign,preferences:window.LandingConsent?.getPreferences(),consentCopy:priorConsent?window.FormPrivacy.text:undefined,cookie:document.cookie,pageUri:location.href,pageName:document.title});
    const result=await active.submit(payload);if(!result.ok)throw Error('Espera a que termine el envío.');
    accepted={contact,inputs:projection.inputs};saved.set(key(active),accepted);
   }
   let unlocked=false;
   try{unlocked=state.save(window.sessionStorage,accepted.contact.name,accepted.inputs);}catch{}
   if(!unlocked){
    message('Tu registro se guardó. Permite el almacenamiento de sesión y vuelve a pulsar el botón para abrir tu proyección.');
    return;
   }
   window.location.assign(resultUrl.href);
  }catch(error){message(error.message||'No pudimos confirmar el registro. Inténtalo de nuevo.');}
  finally{sending=false;inputs(false);form.setAttribute('aria-busy','false');button.textContent=saved.has(key(active))?'Abrir mi proyección':'Continuar';}
 });
})();
