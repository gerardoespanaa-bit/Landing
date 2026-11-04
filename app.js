'use strict';
const WHATSAPP_NUMBER='524423777762';
const messages={general:'Hola, Gerardo. Quiero agendar una asesoría gratis y conocer cómo puedes ayudarme.',simulador:'Hola Gerardo, vi mi proyección de retiro y quisiera saber más',retiro:'Hola Gerardo, vi mi proyección de retiro y quisiera saber más',seguros:'Hola Gerardo, quiero revisar una protección y su cotización',bolsa:'Hola Gerardo, me gustaría una asesoría para invertir en bolsa',auto:'Hola Gerardo, quisiera revisar una cotización para un auto'};
const $=id=>document.getElementById(id);
const measure=(name,service,location,details)=>{try{window.LandingMeasurement?.track(name,service,location,details);}catch{/* Measurement must never block the calculator or contact. */}};
const contactClicks=new WeakMap();
function measureContact(el,service,location,buttonId){const now=performance.now(),previous=contactClicks.get(el);if(previous!==undefined&&now-previous<800)return;contactClicks.set(el,now);measure('whatsapp_contact',service,location,{button_id:buttonId});}
const directMessages={
 general:'Hola, Gerardo. Quiero agendar una asesoría gratis y conocer cómo puedes ayudarme.',
 seguros:'Hola Gerardo, me interesa una cotización de estas opciones de seguro: Residencial, Vida, Gastos Médicos. Borraré las opciones que no me interesen.',
 bolsa:'Hola Gerardo, me gustaría una asesoría para invertir en bolsa',
 auto:'Hola Gerardo, quisiera revisar una cotización para un auto. Marca: __. Modelo: __. Año: __. Código postal: __. Edad del conductor: __.'
};
document.querySelectorAll('[data-wa-direct]').forEach(el=>{
 const kind=el.dataset.waDirect;el.href='https://wa.me/'+WHATSAPP_NUMBER+'?text='+encodeURIComponent(directMessages[kind]||directMessages.general);
 el.removeAttribute('target');el.removeAttribute('rel');el.addEventListener('click',()=>measureContact(el,kind,el.dataset.measureLocation,el.dataset.measureId));
});
document.querySelectorAll('[data-lead]').forEach(el=>el.addEventListener('click',e=>{
 e.preventDefault();const kind=el.dataset.lead;
 window.LandingLeadForms?.open({kind,buttonId:el.dataset.leadId||el.dataset.measureId,opener:el,measurement:el.dataset.measureId?{location:el.dataset.measureLocation}:null});
}));
$('menuToggle').addEventListener('click',()=>{const open=$('navLinks').classList.toggle('open');$('menuToggle').setAttribute('aria-expanded',String(open));measure('ui_click','general','header',{button_id:'mobile_menu',action_type:open?'open':'close'});});
$('navLinks').querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{$('navLinks').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false');}));

const profileButtons=[...document.querySelectorAll('[data-profile]')],slides=[...document.querySelectorAll('.profile-slide')];
profileButtons.forEach(button=>button.addEventListener('click',()=>{
 const changed=button.getAttribute('aria-pressed')!=='true';const index=Number(button.dataset.profile);$('profileTrack').style.transform=`translateX(-${index*100}%)`;
 slides.forEach((slide,i)=>{slide.setAttribute('aria-hidden',String(i!==index));slide.inert=i!==index;});
 profileButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 $('profileStatus').textContent=slides[index].querySelector('figcaption').textContent;if(changed)measure('ui_click','general','about',{button_id:['profile_allianz','profile_education','profile_amib','profile_cnsf'][index],action_type:'select'});
 if(matchMedia('(max-width: 900px)').matches)$('profileViewer').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
}));

const credentialDialog=$('credentialDialog');
const credentialDocuments={amib:{title:'Certificado AMIB · Serie 210',images:[['assets/certificado-amib.png','Certificado AMIB de Gerardo López España, Serie 210']]},cnsf:{title:'Cédula CNSF · M401339',images:[['assets/cedula-cnsf-1.png','Cédula CNSF, frente; identificadores personales omitidos'],['assets/cedula-cnsf-2.png','Cédula CNSF, reverso con número y vigencia']]}};
document.querySelectorAll('[data-document]').forEach(trigger=>trigger.addEventListener('click',()=>{
 const key=trigger.dataset.document,documentData=credentialDocuments[key];$('credentialTitle').textContent=documentData.title;const content=$('credentialContent');content.replaceChildren();content.classList.toggle('is-cnsf',key==='cnsf');
 for(const [src,alt] of documentData.images){const img=document.createElement('img');img.src=src;img.alt=alt;content.append(img);}
 credentialDialog.showModal();document.body.classList.add('credential-active');content.scrollTop=0;measure('ui_click','general','about',{button_id:key==='amib'?'credential_amib':'credential_cnsf',action_type:'open'});
}));
$('closeCredential').addEventListener('click',()=>credentialDialog.close());credentialDialog.addEventListener('close',()=>{document.body.classList.remove('credential-active');measure('ui_click','general','about',{button_id:'credential_close',action_type:'close'});});


// Informational actions only. Never read form values, messages or generated projections.
document.querySelectorAll('[data-ui-id]').forEach(el=>el.addEventListener('click',()=>{
 const id=el.dataset.uiId;
 const location=id.startsWith('footer_')?'footer':id.startsWith('social_about_')?'about':'header';
 measure('ui_click','general',location,{button_id:id,action_type:id.startsWith('social_')?'external_link':'navigate'});
}));
