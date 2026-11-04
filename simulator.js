'use strict';
(()=>{
const $=id=>document.getElementById(id),form=$('retirementForm'),panel=$('resultPanel'),button=$('calculateButton'),chart=$('miniGrowthChart');
if(!form)return;
const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);
let latest=null,latestPair=null,frameId=0,progress=1;
const fullProjection=document.body.dataset.projectionFull==='true';
const displayAmount=n=>fullProjection?new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2,maximumFractionDigits:2}).format(n):'$'+(n/1000000).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})+' millones';
const measure=(name,service,location,details)=>{try{window.LandingMeasurement?.track(name,service,location,details);}catch{}};
function project(age,monthly,retire){
 latestPair={...window.ProjectionScenarios.calculate({age,monthly,retire}),simulatedAt:Date.now()};
 return {...latestPair.from,retire,monthly};
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
 $('retirementAmount').textContent=displayAmount(value);
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
 function frame(now){progress=duration?Math.min(1,(now-start)/duration):1;draw(progress);if(progress<1)frameId=requestAnimationFrame(frame);else{cancel();button.textContent='Volver a calcular';panel.setAttribute('aria-busy','false');panel.setAttribute('aria-live','polite');$('retirementCaption').textContent=`Retiro a los ${latest.retire} años · Libre de impuestos*`;$('chartSummary').textContent=`Saldo final proyectado: ${money(latest.amount)}. Aportaciones acumuladas: ${money(latest.contributions)}. Eje horizontal: años de proyección. Eje vertical: pesos mexicanos (MXN).`;chart.setAttribute('aria-label',$('chartSummary').textContent);$('metricYears').textContent=`${latest.years} ${latest.years===1?'año':'años'}`;$('metricContributions').textContent=money(latest.contributions);$('metricTax').textContent=money(latest.taxAnnual);$('projectionMetrics').hidden=false;window.ProjectionFlow?.calculated(latestPair);measure('simulator_complete','retiro','simulator');celebrateProjection();requestAnimationFrame(()=>{if(form.isConnected)$('projectionMetrics').scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});}}
 frameId=requestAnimationFrame(frame);
});
form.addEventListener('input',()=>{cancel();latest=null;latestPair=null;panel.hidden=true;window.ProjectionFlow?.invalidated();if(fullProjection)refreshProjection();});
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
window.addEventListener('resize',()=>draw(progress));
const projectionDetails=document.querySelector('.sim-disclaimer');
let detailsWereOpen=projectionDetails.open;
projectionDetails.addEventListener('toggle',()=>{if(projectionDetails.open===detailsWereOpen)return;detailsWereOpen=projectionDetails.open;measure('ui_click','retiro','simulator',{button_id:'projection_details',action_type:detailsWereOpen?'open':'close'});});
function refreshProjection(){
 if(!projectionInputs.every(input=>projectionInputError(input,false)===''&&input.value!==''))return;
 try{latest=project(Number($('ageNow').value),Number($('monthlyContribution').value),Number($('ageRetirement').value));}catch{return;}
 panel.hidden=false;panel.setAttribute('aria-busy','false');document.querySelector('.simulator-chart').classList.add('is-visible');progress=1;draw(1);$('projectionMetrics').hidden=false;
 $('metricYears').textContent=latest.years+' años';$('metricContributions').textContent=money(latest.contributions);$('metricTax').textContent=money(latest.taxAnnual);$('retirementCaption').textContent='Escenario 8% anual · Retiro a los '+latest.retire+' años · Libre de impuestos*';
 window.ProjectionFlow?.calculated(latestPair);
}
window.ProjectionCalculator=Object.freeze({current:()=>latestPair,refresh:refreshProjection});
const source=location.hash.slice(1);
if(!fullProjection)measure('simulator_open','retiro',['header','hero','footer'].includes(source)?source:'simulator');
})();
