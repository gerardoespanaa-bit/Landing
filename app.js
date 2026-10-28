'use strict';
const WHATSAPP_NUMBER='524423777762';
const messages={general:'Hola, Gerardo. Quiero agendar una asesoría gratis y conocer cómo puedes ayudarme.',simulador:'Hola Gerardo, vi mi proyección de retiro y quisiera saber más',retiro:'Hola Gerardo, vi mi proyección de retiro y quisiera saber más',seguros:'Hola Gerardo, quiero revisar una protección y su cotización',bolsa:'Hola Gerardo, me gustaría una asesoría para invertir en bolsa',auto:'Hola Gerardo, quisiera revisar una cotización para un auto'};
const $=id=>document.getElementById(id),form=$('retirementForm'),panel=$('resultPanel'),button=$('calculateButton'),chart=$('miniGrowthChart');
const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);
let latest=null,frameId=0,progress=1,returnFocus=null;
const measure=(name,service,location,details)=>{try{window.LandingMeasurement?.track(name,service,location,details);}catch{/* Measurement must never block the calculator or contact. */}};
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
 const vals=[0,...latest.rows.map(r=>r.saldoTotal)];
 const contributions=[0,...latest.rows.map(r=>r.aportacionAcumulada)];
 const max=Math.max(...vals,...contributions),years=latest.rows.length,phase=Math.max(0,Math.min(1,t));
 const compactMoney=n=>'$'+(n>=1e9?(n/1e9).toFixed(1)+' mil M':n>=1e6?(n/1e6).toFixed(1)+' M':n>=1e3?(n/1e3).toFixed(0)+' mil':n.toFixed(0));
 const levels=Array.from({length:5},(_,n)=>max*n/4);
 ctx.font=`${w<420?10:11}px "DM Sans",sans-serif`;
 const left=Math.ceil(Math.max(...levels.map(n=>ctx.measureText(compactMoney(n)).width)))+12,right=w-12,top=23,bottom=h-37;
 const plotWidth=right-left,plotHeight=bottom-top;
 if(plotWidth<=0||plotHeight<=0)return;
 const point=(i,v)=>[left+plotWidth*i/years,bottom-plotHeight*v/max];
 const position=phase*years,i=Math.min(Math.floor(position),years),fraction=position-i;
 const value=vals[i]+((vals[i+1]??vals[i])-vals[i])*fraction;
 const contributionValue=contributions[i]+((contributions[i+1]??contributions[i])-contributions[i])*fraction;
 const revealedMax=Math.max(value,contributionValue,...vals.slice(0,i+1),...contributions.slice(0,i+1));
 const headX=point(position,value)[0];
 // Reveal axes, monetary levels and year marks along with the existing drawing.
 ctx.lineWidth=1;ctx.strokeStyle='#ffffff80';ctx.beginPath();ctx.moveTo(left,point(0,revealedMax)[1]);ctx.lineTo(left,bottom);ctx.lineTo(headX,bottom);ctx.stroke();
 ctx.fillStyle='#d6e5f2';ctx.textAlign='left';ctx.textBaseline='top';ctx.fillText('MXN',left,2);
 ctx.textAlign='right';ctx.textBaseline='middle';
 for(const level of levels){
  if(level>revealedMax)continue;
  const y=point(0,level)[1];
  ctx.strokeStyle='#ffffff25';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(headX,y);ctx.stroke();
  ctx.strokeStyle='#ffffff80';ctx.beginPath();ctx.moveTo(left-4,y);ctx.lineTo(left,y);ctx.stroke();
  ctx.fillText(compactMoney(level),left-7,y);
 }
 const desired=Math.max(2,Math.min(6,Math.floor(plotWidth/55))),rawStep=Math.ceil(years/desired);
 const tickStep=[1,2,5,10,20,25,50,100].find(n=>n>=rawStep)||rawStep;
 const yearMarks=[0];for(let year=tickStep;year<years;year+=tickStep)yearMarks.push(year);
 if(yearMarks.length>1&&(years-yearMarks.at(-1))*plotWidth/years<34)yearMarks.pop();yearMarks.push(years);
 ctx.textBaseline='top';
 for(const year of yearMarks){
  if(year>position)continue;
  const x=point(year,0)[0];ctx.strokeStyle='#ffffff80';ctx.beginPath();ctx.moveTo(x,bottom);ctx.lineTo(x,bottom+4);ctx.stroke();
  ctx.textAlign=year===years?'right':year===0?'left':'center';ctx.fillText(String(year),x,bottom+7);
 }
 ctx.textAlign='right';ctx.fillText('Años de proyección',right,h-13);
 const step=plotWidth/years,barWidth=Math.max(1,Math.min(14,step*.62)),barWindow=barWidth/step;
 ctx.save();ctx.beginPath();ctx.rect(left,top,plotWidth*phase,plotHeight);ctx.clip();ctx.fillStyle='#9eb7ce80';
 for(let year=1;year<=years;year++){
  const growth=Math.max(0,Math.min(1,(position-year+barWindow)/barWindow));if(growth===0)break;
  const [x,y]=point(year,contributions[year]*growth);ctx.fillRect(x-barWidth,y,barWidth,bottom-y);
 }
 ctx.restore();
 ctx.beginPath();ctx.moveTo(...point(0,0));for(let j=1;j<=i;j++)ctx.lineTo(...point(j,vals[j]));ctx.lineTo(...point(position,value));ctx.strokeStyle='#a7d9ff';ctx.lineWidth=3;ctx.lineJoin='round';ctx.stroke();
 $('retirementAmount').textContent=money(value);
}
let celebrationTimer=null;
function clearCelebration(){clearTimeout(celebrationTimer);celebrationTimer=null;$('retirementAmount').classList.remove('amount-pop');$('projectionConfetti').replaceChildren();}
function celebrateProjection(){
 clearCelebration();if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const layer=$('projectionConfetti'),width=layer.clientWidth,spread=Math.min(160,width*.25),origin=Math.min(70,width*.12),colors=['#a7d9ff','#ffffff','#4c8ff5','#d7b16a'];
 $('retirementAmount').classList.add('amount-pop');const pieces=document.createDocumentFragment();
 for(let i=0;i<24;i++){
  const side=i%2===0?-1:1,distance=side*(spread*.4+Math.random()*spread*.6),turn=side*(180+Math.random()*360),piece=document.createElement('span');
  piece.className='confetti-piece';piece.style.left=`calc(50% + ${side*origin}px)`;piece.style.backgroundColor=colors[i%colors.length];piece.style.borderRadius=i%3===0?'50%':'1px';
  piece.style.setProperty('--dx',`${distance}px`);piece.style.setProperty('--mid-x',`${distance*.48}px`);piece.style.setProperty('--dy',`${-18-Math.random()*45}px`);piece.style.setProperty('--end-y',`${35+Math.random()*28}px`);piece.style.setProperty('--mid-turn',`${turn*.45}deg`);piece.style.setProperty('--turn',`${turn}deg`);piece.style.animationDelay=`${Math.random()*80}ms`;pieces.append(piece);
 }
 layer.append(pieces);celebrationTimer=setTimeout(clearCelebration,1100);
}
function cancel(){cancelAnimationFrame(frameId);clearCelebration();button.disabled=false;button.textContent='Calcular mi proyección';$('calculatingMessage').hidden=true;}
form.addEventListener('submit',e=>{e.preventDefault();if(!validateProjectionForm())return;cancel();$('calculationError').hidden=true;
 try{latest=project(Number($('ageNow').value),Number($('monthlyContribution').value),Number($('ageRetirement').value));}catch(error){panel.hidden=true;$('calculationError').textContent=error.message;$('calculationError').hidden=false;return;}
 panel.hidden=false;$('projectionMetrics').hidden=true;panel.setAttribute('aria-busy','true');panel.setAttribute('aria-live','off');document.querySelector('.simulator-chart').classList.add('is-visible');button.disabled=true;button.textContent='Proyectando…';$('calculatingMessage').hidden=false;$('retirementCaption').textContent='Evolución ilustrativa del saldo anual';$('chartSummary').textContent='';
 const start=performance.now(),duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:4000;
 function frame(now){progress=duration?Math.min(1,(now-start)/duration):1;draw(progress);if(progress<1)frameId=requestAnimationFrame(frame);else{cancel();button.textContent='Volver a calcular';panel.setAttribute('aria-busy','false');panel.setAttribute('aria-live','polite');$('retirementCaption').textContent=`Retiro a los ${latest.retire} años · Libre de impuestos*`;$('chartSummary').textContent=`Saldo final proyectado: ${money(latest.amount)}. Aportaciones acumuladas: ${money(latest.contributions)}. Eje horizontal: años de proyección. Eje vertical: pesos mexicanos (MXN).`;chart.setAttribute('aria-label',$('chartSummary').textContent);$('metricYears').textContent=`${latest.years} ${latest.years===1?'año':'años'}`;$('metricContributions').textContent=money(latest.contributions);$('metricTax').textContent=money(latest.taxAnnual);$('projectionMetrics').hidden=false;measure('simulator_complete','retiro','simulator');celebrateProjection();requestAnimationFrame(()=>{if(simulator.classList.contains('is-open'))$('projectionMetrics').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});}}
 frameId=requestAnimationFrame(frame);
});
form.addEventListener('input',()=>{cancel();latest=null;panel.hidden=true;});
const minimumAgeMessages={ageNow:'¡La edad mínima de inicio son 18 años!',ageRetirement:'Cotizador permite edad mínima a los 65. Si te interesa retirarte antes agenda una asesoría gratis para ver tu proyección.'};
const projectionInputs=['ageNow','monthlyContribution','ageRetirement'].map($);
const fieldMessages=new Map();
function projectionInputError(input,required=true){
 const id=input.id,isMonthly=id==='monthlyContribution',value=input.valueAsNumber;
 if(input.validity.badInput)return isMonthly?'Escribe una aportación mensual válida en pesos.':'Escribe una edad válida en años enteros.';
 if(input.value==='')return required?({ageNow:'Escribe tu edad actual.',monthlyContribution:'Escribe tu aportación mensual en pesos.',ageRetirement:'Escribe la edad a la que deseas retirarte.'}[id]):'';
 if(!Number.isFinite(value))return isMonthly?'Escribe una aportación mensual válida en pesos.':'Escribe una edad válida en años enteros.';
 if(value<Number(input.min))return isMonthly?'¡La aportación mensual mínima es de $2,000 MXN!':minimumAgeMessages[id];
 if(value>Number(input.max))return isMonthly?'La aportación mensual máxima es de $1,000,000 MXN.':id==='ageNow'?'La edad actual debe ser de 18 a 64 años.':'La edad de retiro no puede superar los 90 años.';
 if(!Number.isInteger(value))return isMonthly?'Escribe la aportación mensual en pesos enteros.':'Escribe la edad en años enteros.';
 return '';
}
function renderValidationMessages(){
 const notice=$('ageNotice');notice.replaceChildren();
 for(const text of fieldMessages.values()){const p=document.createElement('p');p.textContent=text;notice.append(p);}
 notice.hidden=fieldMessages.size===0;
 for(const input of projectionInputs)input.setAttribute('aria-invalid',String(Boolean(projectionInputError(input,false)||(input.value===''&&fieldMessages.has(input.id)))));
}
function validateProjectionForm(){
 fieldMessages.clear();let first=null;
 for(const input of projectionInputs){const message=projectionInputError(input);if(message){fieldMessages.set(input.id,message);first??=input;}}
 renderValidationMessages();
 if(first){first.focus();$('ageNotice').scrollIntoView({block:'nearest',behavior:'instant'});return false;}
 return true;
}
for(const input of projectionInputs){
 input.addEventListener('input',()=>{const message=projectionInputError(input,false);if(message)fieldMessages.set(input.id,message);else fieldMessages.delete(input.id);renderValidationMessages();});
 input.addEventListener('invalid',event=>event.preventDefault());
 input.addEventListener('keydown',event=>{if(event.key==='ArrowDown'&&input.valueAsNumber<=Number(input.min)){event.preventDefault();fieldMessages.set(input.id,input.id==='monthlyContribution'?'¡La aportación mensual mínima es de $2,000 MXN!':minimumAgeMessages[input.id]);renderValidationMessages();}});
}
document.querySelectorAll('[data-age-step]').forEach(step=>step.addEventListener('click',()=>{
 const input=$(step.dataset.ageStep),delta=Number(step.dataset.delta),minimum=Number(input.min),maximum=Number(input.max),current=input.valueAsNumber;
 if(delta<0&&Number.isFinite(current)&&current<=minimum){fieldMessages.set(input.id,minimumAgeMessages[input.id]);renderValidationMessages();return;}
 input.value=String(Math.min(maximum,Math.max(minimum,Number.isFinite(current)?current+delta:minimum)));
 input.dispatchEvent(new Event('input',{bubbles:true}));
}));
const simulator=$('simulador');
function closeSimulator(){if(simulator.classList.contains('is-open'))measure('ui_click','retiro','simulator',{button_id:'simulator_close',action_type:'close'});const interrupted=button.disabled;cancel();if(interrupted){latest=null;panel.hidden=true;panel.setAttribute('aria-busy','false');}simulator.classList.remove('is-open');document.body.classList.remove('modal-active');returnFocus?.focus();}
document.querySelectorAll('[data-open-sim],a[href="#simulador"]').forEach(el=>el.addEventListener('click',e=>{e.preventDefault();if(simulator.classList.contains('is-open'))return;returnFocus=el;measure('simulator_open','retiro',el.dataset.measureLocation);simulator.classList.add('is-open');document.body.classList.add('modal-active');$('ageNow').focus();if(latest)draw(progress);}));
$('closeSimulator').addEventListener('click',closeSimulator);
document.addEventListener('keydown',e=>{if(!simulator.classList.contains('is-open')||$('contactDialog').open||$('credentialDialog').open)return;if(e.key==='Escape')closeSimulator();if(e.key==='Tab'){const items=[...simulator.querySelectorAll('button,input,a[href],summary')].filter(el=>!el.disabled&&el.getClientRects().length);const first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
window.addEventListener('resize',()=>draw(progress));
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
const projectionDetails=document.querySelector('.sim-disclaimer');
let detailsWereOpen=projectionDetails.open;
projectionDetails.addEventListener('toggle',()=>{if(projectionDetails.open===detailsWereOpen)return;detailsWereOpen=projectionDetails.open;measure('ui_click','retiro','simulator',{button_id:'projection_details',action_type:detailsWereOpen?'open':'close'});});
document.querySelectorAll('[data-ui-id]').forEach(el=>el.addEventListener('click',()=>{
 const id=el.dataset.uiId;
 const location=id.startsWith('footer_')?'footer':id.startsWith('social_about_')?'about':'header';
 measure('ui_click','general',location,{button_id:id,action_type:id.startsWith('social_')?'external_link':'navigate'});
}));
