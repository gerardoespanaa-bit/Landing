'use strict';
(()=>{
 const lead=window.ProjectionLead,config=window.PPR_HUBSPOT_FORM;if(!lead||!config)return;
 const campaign=lead.captureCampaign(location.href),saved=new Map();let context=null,sending=false,opener=null;
 const dialog=document.createElement('dialog');dialog.id='projectionLeadDialog';dialog.className='lead-dialog';dialog.setAttribute('aria-labelledby','projectionLeadTitle');
 const privacy=new URL(document.body.dataset.projectionFull==='true'||location.pathname.endsWith('/simulador/')?'../aviso-de-privacidad.html':'aviso-de-privacidad.html',document.baseURI);
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
   <label class="projection-lead-consent"><input id="projectionLeadConsent" type="checkbox" required><span id="projectionLeadConsentCopy"></span></label>
   <button class="btn btn-primary" id="projectionLeadContinue" type="submit">Continuar</button>
   <p id="projectionLeadStatus" role="status" aria-live="polite" hidden></p>
  </form>`;
 document.body.append(dialog);const $=id=>document.getElementById(id),form=$('projectionLeadForm'),button=$('projectionLeadContinue'),status=$('projectionLeadStatus');
 const advisoryFields=$('advisoryProjectionInputs');
 function key(c){return c.kind+'|'+c.buttonId;}
 function message(text){status.hidden=false;status.textContent=text;}
 function inputs(disabled){for(const el of form.querySelectorAll('input,button'))el.disabled=disabled;$('closeProjectionLead').disabled=disabled;}
 function reset(){form.reset();form.hidden=false;status.hidden=true;button.textContent='Continuar';inputs(false);}
 function consentCopy(kind,buttonId,withAdvisoryInputs){
  const text=lead.consentText(kind,buttonId),label='aviso de privacidad',start=text.indexOf(label);
  const a=document.createElement('a');a.href=privacy.href+(withAdvisoryInputs?'#solicitudes-asesoria':'#registro-simulacion');a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;
  $('projectionLeadConsentCopy').replaceChildren(document.createTextNode(text.slice(0,start)),a,document.createTextNode(text.slice(start+label.length)));
 }
 function measure(action){if(!context?.measurement)return;try{window.LandingMeasurement?.track('ui_click','general',context.measurement.location,{button_id:context.buttonId,action_type:action});}catch{}}
 function success(){message('En un momento te contactaremos');button.hidden=true;advisoryFields.hidden=true;for(const el of form.querySelectorAll('label'))el.hidden=true;$('closeProjectionLead').disabled=false;}
 $('closeProjectionLead').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('cancel',e=>{if(sending)e.preventDefault();});
 dialog.addEventListener('close',()=>{measure('close_contact');document.body.classList.remove('lead-dialog-open');if(opener?.isConnected)opener.focus({preventScroll:true});});
 window.LandingLeadForms=Object.freeze({open(options){
  if(dialog.open||sending)return false;
  if(!['simulation','advisory','contract'].includes(options.kind)||!lead.validSource(options.kind,options.buttonId))return false;
  if(options.kind==='simulation'&&!options.projection)return false;
  const withAdvisoryInputs=lead.needsAdvisoryInputs(options.kind,options.buttonId);
  context={...options,withAdvisoryInputs,submit:saved.get(key(options))?.submit||lead.createSubmitter({config,fetcher:window.fetch.bind(window)})};opener=options.opener||document.activeElement;
  reset();button.hidden=false;for(const el of form.querySelectorAll('label'))el.hidden=false;
  advisoryFields.hidden=!withAdvisoryInputs;
  $('projectionLeadTitle').textContent=options.kind==='contract'?'Te contactaremos para contratar tu plan':options.kind==='simulation'?'Ver tu proyección completa':'Agenda una asesoría gratis';
  consentCopy(options.kind,options.buttonId,withAdvisoryInputs);dialog.showModal();document.body.classList.add('lead-dialog-open');measure('open_contact');
  if(saved.has(key(options))&&options.kind!=='simulation')success();else $('projectionLeadName').focus();return true;
 }});
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(sending||!context)return;let contact;
  try{contact=lead.validateContact($('projectionLeadName').value,$('projectionLeadPhone').value,$('projectionLeadConsent').checked);}catch(error){message(error.message);return;}
  const active=context;status.hidden=true;sending=true;inputs(true);button.textContent='Guardando…';form.setAttribute('aria-busy','true');
  try{
   let accepted=saved.get(key(active));
   if(!accepted){
    const advisoryInputs=active.withAdvisoryInputs?window.ProjectionScenarios.validate({
     age:$('advisoryProjectionAge').valueAsNumber,
     retire:$('advisoryProjectionRetirement').valueAsNumber,
     monthly:$('advisoryProjectionMonthly').valueAsNumber
    }):undefined;
    const payload=lead.buildPayload({config,contact,projection:active.projection,advisoryInputs,kind:active.kind,buttonId:active.buttonId,campaign,preferences:window.LandingConsent?.getPreferences(),cookie:document.cookie,pageUri:location.href,pageName:document.title});
    const result=await active.submit(payload);if(!result.ok)throw Error('Espera a que termine el envío.');
    accepted={contact,submit:active.submit};saved.set(key(active),accepted);
   }
   if(active.kind==='simulation'){
    if(active.onSaved(accepted.contact)!==true){message('Tu registro se guardó, pero el navegador bloqueó el acceso a tus resultados. Permite el almacenamiento de sesión y pulsa Continuar; no enviaremos otro registro desde esta ventana.');return;}
    message('En un momento te contactaremos');button.textContent='Abriendo tu proyección…';await new Promise(resolve=>setTimeout(resolve,700));window.location.assign(new URL('../mi-proyeccion/',document.baseURI).href);return;
   }
   success();
  }catch(error){message(error.message||'No pudimos confirmar el registro. Inténtalo de nuevo.');}
  finally{sending=false;inputs(false);form.setAttribute('aria-busy','false');if(!saved.has(key(active))||active.kind==='simulation')button.textContent='Continuar';}
 });
})();
