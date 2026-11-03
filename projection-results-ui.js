'use strict';
(()=>{
 const $=id=>document.getElementById(id),state=window.ProjectionState,initial=window.PPR_UNLOCKED_STATE;
 if(!initial||!state.clean(initial)){window.location.replace(new URL('../simulador/',document.baseURI).href);return;}
 const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
 let current=null,currentWhatsAppUrl='',lastClick=-Infinity;
 const whatsapp=$('projectionWhatsAppButton');
 window.ProjectionFlow=Object.freeze({
  calculated(projection){
   current=projection;
   $('upperProjectionAmount').textContent=money(projection.to.amount);
   $('metricYears12').textContent=projection.to.years+' años';$('metricContributions12').textContent=money(projection.to.contributions);$('metricTax12').textContent=money(projection.to.taxAnnual);
   $('projectionDifference').textContent=money(projection.difference);$('projectionDelayCost').textContent=money(projection.delayCost);
   for(const [suffix,scenario] of [['8',projection.from],['12',projection.to]]){$('projectionPaid'+suffix).textContent=money(scenario.contributions);$('projectionGenerated'+suffix).textContent=money(scenario.generated);}
   const i=projection.inputs,message='Hola, soy '+initial.name+'. Hice mi simulación: tengo '+i.age+' años, quiero retirarme a los '+i.retire+' y aporto '+money(i.monthly)+' al mes. Quiero saber cómo llegar a '+money(projection.to.amount)+'.';
   currentWhatsAppUrl='https://wa.me/524423777762?text='+encodeURIComponent(message);whatsapp.removeAttribute('aria-disabled');
   try{state.save(localStorage,initial.name,i);}catch{}
  },
  invalidated(){current=null;currentWhatsAppUrl='';whatsapp.setAttribute('aria-disabled','true');}
 });
 $('ageNow').value=initial.inputs.age;$('monthlyContribution').value=initial.inputs.monthly;$('ageRetirement').value=initial.inputs.retire;
 window.ProjectionCalculator.refresh();
 whatsapp.addEventListener('click',event=>{
  event.preventDefault();if(!current)return;const now=performance.now();if(now-lastClick<800)return;lastClick=now;window.open(currentWhatsAppUrl,'_blank','noopener,noreferrer');
  // Existing event and location; never include the message, inputs or result in measurement.
  try{window.LandingMeasurement?.track('whatsapp_contact','retiro','simulator',{button_id:'wa_simulator_results'});}catch{}
 });
})();
