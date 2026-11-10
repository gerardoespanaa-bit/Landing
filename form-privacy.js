'use strict';
(()=>{
 const key='ppr-form-privacy-v1',change='form-privacy-change',maxAge=86400000;
 const text='Autorizo guardar en HubSpot los datos que envíe en los formularios para mostrar mi proyección y que Gerardo España me contacte sobre mi solicitud.';
 function has(){
  try{
   const saved=window.sessionStorage.getItem(key);
   if(!saved)return false;
   const age=Date.now()-Number(saved);
   return Number.isFinite(age)&&age>=0&&age<maxAge;
  }catch{return false;}
 }
 function choose(accepted){
  try{
   if(accepted)window.sessionStorage.setItem(key,String(Date.now()));
   else window.sessionStorage.removeItem(key);
  }catch{}
  window.dispatchEvent(new Event(change));
 }
 function bind(checkbox){
  const row=checkbox.closest('label');
  function sync(){
   const accepted=has();
   if(accepted||row.hidden)checkbox.checked=accepted;
   row.hidden=accepted;
   return accepted;
  }
  window.addEventListener(change,sync);
  sync();
  return sync;
 }
 const $=id=>document.getElementById(id);
 const link=$('measurementConsent')?.querySelector('a.privacy-link, a[href$="aviso-de-privacidad.html"]');
 if(link){
  const href=new URL(link.href);
  href.hash='registro-simulacion';
  for(const surface of [$('measurementConsent').firstElementChild,$('measurementDetails')?.querySelector('.measurement-details-content')]){
   if(!surface)continue;
   const label=document.createElement('label'),checkbox=document.createElement('input');
   const copy=document.createElement('span'),notice=document.createElement('a');
   label.className='form-privacy-choice';checkbox.type='checkbox';
   notice.href=href.href;notice.target='_blank';notice.rel='noopener noreferrer';notice.textContent='Aviso de privacidad';
   copy.append(document.createTextNode(text+' '),notice);
   label.append(checkbox,copy);surface.append(label);
   const sync=()=>{checkbox.checked=has();};
   checkbox.addEventListener('change',()=>choose(checkbox.checked));
   window.addEventListener(change,sync);sync();
  }
 }
 window.FormPrivacy=Object.freeze({has,bind,text});
})();
