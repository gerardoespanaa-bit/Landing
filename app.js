'use strict';
const WHATSAPP_NUMBER='524423777762';
const messages={general:'Hola, Gerardo. Quiero agendar una asesoría y conocer cómo puedes ayudarme.',simulador:'Hola Gerardo, vi mi proyección de retiro y quisiera saber más',retiro:'Hola Gerardo, vi mi proyección de retiro y quisiera saber más',seguros:'Hola Gerardo, quiero revisar una protección y su cotización',bolsa:'Hola Gerardo, me gustaría una asesoría para invertir en bolsa',auto:'Hola Gerardo, quisiera revisar una cotización para un auto'};
const $=id=>document.getElementById(id),form=$('retirementForm'),panel=$('resultPanel'),button=$('calculateButton'),chart=$('miniGrowthChart');
const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);
let latest=null,frameId=0,progress=1,returnFocus=null;
function project(age,monthly,retire){
 if(!Number.isInteger(age)||age<18||age>64||!Number.isInteger(retire)||retire<65||retire>90||!Number.isFinite(monthly)||monthly<2000||monthly>1000000)throw Error('Revisa las edades y una aportación mensual entre $2,000 y $1,000,000.');
 const years=retire-age;
 const rows=simulate({edadActual:age,tipoPlan:'Deducible 151',plazo:Math.min(25,years),periodicidad:'Mensual',isrPct:0,tasaRendimiento:.10,inflacion:0,udiValor:8.81,overrides:[monthly*12]},years);
 if(!Array.isArray(rows)||rows.length!==years||rows.some(r=>!Number.isFinite(r.saldoTotal)||r.saldoTotal<=0))throw Error('No fue posible obtener una proyección válida. Revisa los datos.');
 return {rows,years,retire,monthly,amount:rows.at(-1).saldoTotal,contributions:rows.at(-1).aportacionAcumulada,taxAnnual:annualTaxReference(monthly)};
}
function draw(t){
 if(!latest)return;
 const ctx=chart.getContext('2d'),w=chart.clientWidth,h=chart.clientHeight,dpr=window.devicePixelRatio||1;
 if(!w||!h)return;
 chart.width=w*dpr;chart.height=h*dpr;ctx.scale(dpr,dpr);
 const vals=[0,...latest.rows.map(r=>r.saldoTotal)],max=Math.max(...vals),pad=14;
 const point=(i,v)=>[pad+(w-2*pad)*i/(vals.length-1),h-pad-(h-2*pad)*v/max];
 ctx.strokeStyle='#ffffff25';for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(pad,h*i/4);ctx.lineTo(w-pad,h*i/4);ctx.stroke();}
 const position=t*(vals.length-1),i=Math.min(Math.floor(position),vals.length-1),fraction=position-i;
 const value=vals[i]+((vals[i+1]??vals[i])-vals[i])*fraction;
 ctx.beginPath();ctx.moveTo(...point(0,0));for(let j=1;j<=i;j++)ctx.lineTo(...point(j,vals[j]));ctx.lineTo(...point(position,value));ctx.strokeStyle='#a7d9ff';ctx.lineWidth=3;ctx.lineJoin='round';ctx.stroke();
 $('retirementAmount').textContent=money(value);
}
function cancel(){cancelAnimationFrame(frameId);button.disabled=false;button.textContent='Calcular mi proyección';$('calculatingMessage').hidden=true;}
form.addEventListener('submit',e=>{e.preventDefault();if(!form.reportValidity())return;cancel();$('calculationError').hidden=true;
 try{latest=project(Number($('ageNow').value),Number($('monthlyContribution').value),Number($('ageRetirement').value));}catch(error){panel.hidden=true;$('calculationError').textContent=error.message;$('calculationError').hidden=false;return;}
 panel.hidden=false;$('projectionMetrics').hidden=true;panel.setAttribute('aria-busy','true');panel.setAttribute('aria-live','off');document.querySelector('.simulator-chart').classList.add('is-visible');button.disabled=true;button.textContent='Proyectando…';$('calculatingMessage').hidden=false;$('retirementCaption').textContent='Evolución ilustrativa del saldo anual';$('chartSummary').textContent='';
 const start=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:4000;
 function frame(now){progress=duration?Math.min(1,(now-start)/duration):1;draw(progress);if(progress<1)frameId=requestAnimationFrame(frame);else{cancel();button.textContent='Volver a calcular';panel.setAttribute('aria-busy','false');panel.setAttribute('aria-live','polite');$('retirementCaption').textContent=`Retiro a los ${latest.retire} años · Libre de impuestos`;$('chartSummary').textContent=`Saldo final proyectado: ${money(latest.amount)}. Aportaciones acumuladas: ${money(latest.contributions)}.`;chart.setAttribute('aria-label',$('chartSummary').textContent);$('metricYears').textContent=`${latest.years} años`;$('metricContributions').textContent=money(latest.contributions);$('metricTax').textContent=money(latest.taxAnnual);$('projectionMetrics').hidden=false;}}
 frameId=requestAnimationFrame(frame);
});
form.addEventListener('input',()=>{cancel();latest=null;panel.hidden=true;});
const minimumAgeMessages={ageNow:'¡La edad mínima de inicio son 18 años!',ageRetirement:'Cotizador permite edad mínima a los 65. Si te interesa retirarte antes agenda una asesoría para ver tu proyección.'};
let ageMessages=new Map();
function renderAgeMessages(){const notice=$('ageNotice');notice.replaceChildren();for(const text of ageMessages.values()){const p=document.createElement('p');p.textContent=text;notice.append(p);}notice.hidden=ageMessages.size===0;}
for(const id of Object.keys(minimumAgeMessages)){
 const input=$(id),minimum=Number(input.min);
 function validateMinimum(){if(input.value!==''&&Number.isFinite(input.valueAsNumber)&&input.valueAsNumber<minimum)ageMessages.set(id,minimumAgeMessages[id]);else ageMessages.delete(id);renderAgeMessages();}
 input.addEventListener('input',validateMinimum);
 input.addEventListener('invalid',validateMinimum);
 input.addEventListener('blur',()=>{if(input.value!==''&&Number.isFinite(input.valueAsNumber)&&input.valueAsNumber<minimum){input.value=String(minimum);ageMessages.set(id,minimumAgeMessages[id]);renderAgeMessages();}});
 input.addEventListener('keydown',event=>{if(event.key==='ArrowDown'&&input.valueAsNumber<=minimum){event.preventDefault();ageMessages.set(id,minimumAgeMessages[id]);renderAgeMessages();}});
}
document.querySelectorAll('[data-age-step]').forEach(step=>step.addEventListener('click',()=>{
 const input=$(step.dataset.ageStep),delta=Number(step.dataset.delta),minimum=Number(input.min),maximum=Number(input.max),current=input.valueAsNumber;
 if(delta<0&&Number.isFinite(current)&&current<=minimum){input.value=String(minimum);ageMessages.set(input.id,minimumAgeMessages[input.id]);renderAgeMessages();return;}
 input.value=String(Math.min(maximum,Math.max(minimum,Number.isFinite(current)?current+delta:minimum)));
 input.dispatchEvent(new Event('input',{bubbles:true}));
}));
const simulator=$('simulador');
function closeSimulator(){const interrupted=button.disabled;cancel();if(interrupted){latest=null;panel.hidden=true;panel.setAttribute('aria-busy','false');}simulator.classList.remove('is-open');document.body.classList.remove('modal-active');returnFocus?.focus();}
document.querySelectorAll('[data-open-sim],a[href="#simulador"]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();returnFocus=el;simulator.classList.add('is-open');document.body.classList.add('modal-active');$('ageNow').focus();if(latest)draw(progress);}));
$('closeSimulator').addEventListener('click',closeSimulator);
document.addEventListener('keydown',e=>{if(!simulator.classList.contains('is-open')||$('contactDialog').open||$('credentialDialog').open)return;if(e.key==='Escape')closeSimulator();if(e.key==='Tab'){const items=[...simulator.querySelectorAll('button,input,a[href],summary')].filter(el=>!el.disabled&&el.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
window.addEventListener('resize',()=>draw(progress));
const contact=$('contactDialog');
let contactContext='general';
const contactCopy={
 general:{title:'Agenda una asesoría',intro:'Coordinamos tu asesoría directamente por WhatsApp.'},
 retiro:{title:'Agenda una asesoría',intro:'Agenda una asesoría para revisar los detalles, letras chiquitas y beneficios del plan.'},
 simulador:{title:'Agenda una asesoría',intro:'Agenda una asesoría para revisar los detalles, letras chiquitas y beneficios del plan.'},
 seguros:{title:'Asesora tu protección',intro:''},
 bolsa:{title:'Agenda una asesoría',intro:'Aprende los primeros pasos necesarios para comenzar a invertir en bolsa y al sentirte listo realiza tu primera compra de la mano de un asesor.'},
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
 e.preventDefault();contactContext=Object.hasOwn(contactCopy,el.dataset.wa)?el.dataset.wa:'general';
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
 $('contactMessage').value=messages[contactContext];updateLink();contact.showModal();
}));
$('contactContinue').addEventListener('click',e=>{if($('contactContinue').getAttribute('aria-disabled')==='true')e.preventDefault();});
$('contactMessage').addEventListener('input',updateLink);$('closeContact').addEventListener('click',()=>contact.close());
$('menuToggle').addEventListener('click',()=>{$('menuToggle').setAttribute('aria-expanded',String($('navLinks').classList.toggle('open')));});
$('navLinks').querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{$('navLinks').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false');}));

const profileButtons=[...document.querySelectorAll('[data-profile]')],slides=[...document.querySelectorAll('.profile-slide')];
profileButtons.forEach(button=>button.addEventListener('click',()=>{
 const index=Number(button.dataset.profile);$('profileTrack').style.transform=`translateX(-${index*100}%)`;
 slides.forEach((slide,i)=>{slide.setAttribute('aria-hidden',String(i!==index));slide.inert=i!==index;});
 profileButtons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
 $('profileStatus').textContent=slides[index].querySelector('figcaption').textContent;
 if(matchMedia('(max-width: 900px)').matches)$('profileViewer').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
}));

const credentialDialog=$('credentialDialog');
const credentialDocuments={amib:{title:'Certificado AMIB · Serie 210',images:[['assets/certificado-amib.png','Certificado AMIB de Gerardo López España, Serie 210']]},cnsf:{title:'Cédula CNSF · M401339',images:[['assets/cedula-cnsf-1.png','Cédula CNSF, frente; identificadores personales omitidos'],['assets/cedula-cnsf-2.png','Cédula CNSF, reverso con número y vigencia']]}};
document.querySelectorAll('[data-document]').forEach(trigger=>trigger.addEventListener('click',()=>{
 const key=trigger.dataset.document,documentData=credentialDocuments[key];$('credentialTitle').textContent=documentData.title;const content=$('credentialContent');content.replaceChildren();content.classList.toggle('is-cnsf',key==='cnsf');
 for(const [src,alt] of documentData.images){const img=document.createElement('img');img.src=src;img.alt=alt;content.append(img);}
 credentialDialog.showModal();document.body.classList.add('credential-active');content.scrollTop=0;
}));
$('closeCredential').addEventListener('click',()=>credentialDialog.close());credentialDialog.addEventListener('close',()=>document.body.classList.remove('credential-active'));
