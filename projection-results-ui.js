'use strict';
(()=>{
 const $=id=>document.getElementById(id),state=window.ProjectionState,initial=window.PPR_UNLOCKED_STATE;
 if(!initial||!state.clean(initial)){window.location.replace(new URL('../simulador/',document.baseURI).href);return;}
 const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);
 let current=null,url='',lastClick=-Infinity;const whatsapp=$('projectionWhatsAppButton'),status=$('projectionWhatsAppStatus');
 window.ProjectionFlow=Object.freeze({
  calculated(projection){current=projection;$('upperProjectionAmount').textContent=money(projection.to.amount);
   const i=projection.inputs,message='Hola, soy '+initial.name+'. Hice mi simulación: tengo '+i.age+' años, quiero retirarme a los '+i.retire+' y aporto '+money(i.monthly)+' al mes. Quiero saber cómo llegar a '+money(projection.to.amount)+'.';
   url='https://wa.me/524423777762?text='+encodeURIComponent(message);whatsapp.removeAttribute('aria-disabled');status.hidden=true;
   state.save(sessionStorage,initial.name,i);
  },invalidated(){current=null;url='';whatsapp.setAttribute('aria-disabled','true');status.hidden=true;}
 });
 $('ageNow').value=initial.inputs.age;$('monthlyContribution').value=initial.inputs.monthly;$('ageRetirement').value=initial.inputs.retire;whatsapp.setAttribute('aria-disabled','true');window.ProjectionCalculator.refresh({animate:true});
 whatsapp.addEventListener('click',e=>{e.preventDefault();if(!current)return;const now=performance.now();if(now-lastClick<800)return;lastClick=now;
  status.hidden=false;status.textContent='Redirigiendo a WhatsApp…';whatsapp.textContent='Redirigiendo a WhatsApp…';
  setTimeout(()=>window.location.assign(url),200);
  try{window.LandingMeasurement?.track('whatsapp_contact','retiro','simulator',{button_id:'wa_simulator_results'});}catch{}
 });
})();
