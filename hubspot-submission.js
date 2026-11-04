'use strict';
((root)=>{
 const campaignKeys=['gclid','utm_source','utm_medium','utm_campaign','utm_term'];
 const simulationConsent='Acepto el aviso de privacidad y autorizo guardar mi simulación y contactarme respecto a mi simulación.';
 const requestConsent='Acepto el aviso de privacidad y que me contacten respecto a mi solicitud.';
 const advisoryIds=new Set(['wa_about_social','wa_header_advisory','wa_hero_advisory','wa_cta_advisory']);
 function consentText(kind='simulation'){return kind==='simulation'?simulationConsent:requestConsent;}
 function validSource(kind,id){return kind==='simulation'?id==='simulator_range':kind==='contract'?id==='product_contract':kind==='advisory'&&advisoryIds.has(id);}
 function sourceLabel(kind,id){if(!validSource(kind,id))throw Error('Origen de solicitud no válido.');return (kind==='simulation'?'PPR | Simulación':kind==='contract'?'PPR | Solicitud de contratación':'PPR | Asesoría')+' | '+id;}
 function captureCampaign(href){
  const result=Object.fromEntries(campaignKeys.map(key=>[key,'']));
  try{const url=new URL(href);if(url.search.length>4096)return result;
   for(const key of campaignKeys){const entries=[...url.searchParams].filter(([name])=>name.toLowerCase()===key);if(entries.length!==1||entries[0][0]!==key)continue;const value=entries[0][1];
    const safe=key==='gclid'?/^[A-Za-z0-9_-]{20,512}$/.test(value)&&/[A-Za-z]/.test(value)&&/[0-9]/.test(value):value.length<=160&&/^[\p{L}\p{N} _.,+\[\]()-]+$/u.test(value)&&!/@|https?:|\b\d{10,}\b/i.test(value);
    if(safe)result[key]=value;
   }
  }catch{}return Object.freeze(result);
 }
 function validateContact(name,phone,accepted){
  const cleanName=String(name||'').trim().replace(/\s+/g,' '),cleanPhone=String(phone||'').trim();
  if(cleanName.length<2||cleanName.length>100||/[<>\u0000-\u001f]/.test(cleanName))throw Error('Escribe tu nombre (entre 2 y 100 caracteres).');
  if(!/^[0-9]{10}$/.test(cleanPhone))throw Error('Escribe tu teléfono de México con 10 dígitos, sin lada internacional.');
  if(accepted!==true)throw Error('Acepta el aviso de privacidad y el contacto sobre tu simulación para continuar.');
  return {name:cleanName,phone:cleanPhone};
 }
 function buildPayload({config,contact,projection,campaign,preferences,kind='simulation',buttonId='simulator_range',pageName,cookie='',pageUri,now=Date.now()}){
  const fields=config.fields,values={name:contact.name,phone:'+52'+contact.phone,source:sourceLabel(kind,buttonId)};
  if(kind==='simulation'){
   if(!projection)throw Error('Calcula tu proyección antes de continuar.');
   // Store the requested inputs, never monetary projection results.
   Object.assign(values,{consent:'true',age:projection.inputs.age,retire:projection.inputs.retire,monthly:projection.inputs.monthly,simulatedAt:new Date(projection.simulatedAt||now).toISOString()});
  }
  values.gclid=preferences?.advertising===true?campaign.gclid||'':'';
  values.utm=JSON.stringify(Object.fromEntries(campaignKeys.filter(key=>key!=='gclid').map(key=>[key,campaign[key]||''])));
  const url=new URL(pageUri);url.search='';url.hash='';
  const titles=new Set(['Simulador de retiro | Gerardo España','Mi proyección | Gerardo España','Gerardo España | Asesoría de PPR en México']);
  const context={pageUri:url.href,pageName:titles.has(pageName)?pageName:'Simulador de retiro | Gerardo España'};
  // Only reuse an existing cookie with analytics consent. No HubSpot tracking installation.
  const hutk=cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('hubspotutk='))?.slice(11);
  if(preferences?.analytics===true&&/^[a-f0-9]{32}$/i.test(hutk||''))context.hutk=hutk;
  return {submittedAt:String(now),fields:Object.entries(values).map(([key,value])=>{if(!fields[key])throw Error('Falta configurar un campo del formulario.');return {objectTypeId:'0-1',name:fields[key],value:String(value)};}),context,legalConsentOptions:{consent:{consentToProcess:true,text:consentText(kind),communications:[]}}};
 }
 function createSubmitter({config,fetcher}){
  let pending=false,accepted=false;
  return async function submit(payload){
   if(accepted)return {ok:true,alreadySaved:true};if(pending)return {ok:false,pending:true};
   if(config.enabled!==true||!/^\d+$/.test(config.portalId)||!(/^[a-f0-9-]{36}$/i.test(config.formId)))throw Error('El registro todavía no está habilitado. No se han enviado tus datos.');
   pending=true;
   try{
    const response=await fetcher('https://api.hsforms.com/submissions/v3/integration/submit/'+config.portalId+'/'+config.formId,{method:'POST',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    if(response.status!==200)throw Error('No pudimos confirmar el registro. Revisa tu conexión y vuelve a intentarlo.');
    // Do not render HubSpot HTML or follow a server-provided redirect.
    let result;try{result=await response.json();}catch{throw Error('HubSpot no devolvió una confirmación válida. No se abrió la proyección.');}
    if(result.errors||(!Object.hasOwn(result,'inlineMessage')&&!Object.hasOwn(result,'redirectUri')))throw Error('No recibimos una confirmación válida de HubSpot.');
    accepted=true;return {ok:true};
   }finally{pending=false;}
  };
 }
 const api=Object.freeze({captureCampaign,validateContact,buildPayload,createSubmitter,consentText,validSource});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ProjectionLead=api;
})(typeof window==='undefined'?globalThis:window);
