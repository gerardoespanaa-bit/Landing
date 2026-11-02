'use strict';
const WHATSAPP_NUMBER='524423777762';
const messages={general:'Hola, Gerardo. Quiero agendar una asesoría gratis y conocer cómo puedes ayudarme.',simulador:'Hola Gerardo, vi mi proyección de retiro y quisiera saber más',retiro:'Hola Gerardo, vi mi proyección de retiro y quisiera saber más',seguros:'Hola Gerardo, quiero revisar una protección y su cotización',bolsa:'Hola Gerardo, me gustaría una asesoría para invertir en bolsa',auto:'Hola Gerardo, quisiera revisar una cotización para un auto'};
const $=id=>document.getElementById(id);
const measure=(name,service,location,details)=>{try{window.LandingMeasurement?.track(name,service,location,details);}catch{/* Measurement must never block the calculator or contact. */}};
const contact=$('contactDialog');
let contactContext='general',contactLocation='hero',contactButtonId=null;
const contactClicks=new WeakMap();
function measureContact(el,service,location,buttonId){const now=performance.now(),previous=contactClicks.get(el);if(previous!==undefined&&now-previous<800)return;contactClicks.set(el,now);measure('whatsapp_contact',service==='simulador'?'retiro':service,location,{button_id:buttonId});}
const contactCopy={
 general:{title:'Agenda una asesoría gratis',intro:'Coordinamos tu asesoría inicial gratis directamente por WhatsApp.'},
 retiro:{title:'Agenda una asesoría gratis',intro:'Agenda una asesoría gratis para revisar los detalles, letras chiquitas y beneficios del plan.'},
 simulador:{title:'Agenda una asesoría gratis',intro:'Agenda una asesoría gratis para revisar los detalles, letras chiquitas y beneficios del plan.'},
 seguros:{title:'Asesora tu protección',intro:''},
 bolsa:{title:'Agenda una asesoría gratis',intro:'Aprende los primeros pasos necesarios para comenzar a invertir en bolsa y al sentirte listo realiza tu primera compra de la mano de un asesor.'},
 auto:{title:'¡Cotiza de inmediato con descuento!',intro:'Obtén una cotización instantánea mandando por mensaje los siguientes datos:'}
};
function protectionSelection(){return [...$('contactExtras').querySelectorAll('input:checked')].map(input=>input.value);}
function updateLink(){
 const enabled=contactContext!=='seguros'||protectionSelection().length>0;
 $('contactContinue').setAttribute('aria-disabled',String(!enabled));
 if(enabled)$('contactContinue').href=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent($('contactMessage').value.trim()||messages.general)}`;
 else $('contactContinue').removeAttribute('href');
}
document.querySelectorAll('[data-wa]').forEach(el=>el.addEventListener('click',e=>{
 e.preventDefault();if(contact.open)return;contactContext=Object.hasOwn(contactCopy,el.dataset.wa)?el.dataset.wa:'general';contactLocation=el.dataset.measureLocation;contactButtonId=el.dataset.measureId;contactClicks.delete($('contactContinue'));
 const copy=contactCopy[contactContext];$('contactTitle').textContent=copy.title;$('contactIntro').textContent=copy.intro;$('contactIntro').parentElement.hidden=!copy.intro;$('contactExtras').replaceChildren();
 if(contactContext==='seguros'){
  const fieldset=document.createElement('fieldset');fieldset.className='protection-options';
  const legend=document.createElement('legend');legend.textContent='¿Qué quieres proteger?';fieldset.append(legend);
  for(const value of ['Residencial','Vida','Gastos Médicos']){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=value;input.name='protection';label.append(input,document.createTextNode(value));fieldset.append(label);}
  fieldset.addEventListener('change',()=>{const values=protectionSelection();$('contactMessage').value=values.length?`Hola Gerardo, quiero revisar una protección de ${values.join(', ')} y su cotización`:messages.seguros;updateLink();});$('contactExtras').append(fieldset);
 }else if(contactContext==='auto'){
  const list=document.createElement('ul');for(const text of ['Marca','Modelo','Año','Código postal','Edad del conductor']){const item=document.createElement('li');item.textContent=text;list.append(item);}$('contactExtras').append(list);
  const note=document.createElement('p');note.className='auto-conditions';note.textContent='Consulta las condiciones del descuento y su disponibilidad al cotizar.';$('contactExtras').append(note);
 }
 $('contactMessage').value=messages[contactContext];updateLink();contact.showModal();measure('ui_click',contactContext==='simulador'?'retiro':contactContext,contactLocation,{button_id:contactButtonId,action_type:'open_contact'});
}));
$('contactContinue').addEventListener('click',e=>{if($('contactContinue').getAttribute('aria-disabled')==='true'){e.preventDefault();return;}measureContact(e.currentTarget,contactContext,contactLocation,contactButtonId);});
document.querySelectorAll('[data-wa-social]').forEach(el=>el.addEventListener('click',()=>measureContact(el,'general',el.dataset.measureLocation,el.dataset.measureId)));
$('contactMessage').addEventListener('input',updateLink);$('closeContact').addEventListener('click',()=>contact.close());
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
contact.addEventListener('close',()=>measure('ui_click',contactContext==='simulador'?'retiro':contactContext,contactLocation,{button_id:contactButtonId,action_type:'close_contact'}));
document.querySelectorAll('[data-ui-id]').forEach(el=>el.addEventListener('click',()=>{
 const id=el.dataset.uiId;
 const location=id.startsWith('footer_')?'footer':id.startsWith('social_about_')?'about':'header';
 measure('ui_click','general',location,{button_id:id,action_type:id.startsWith('social_')?'external_link':'navigate'});
}));
