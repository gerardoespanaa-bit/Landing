'use strict';
(()=>{
 const state=window.ProjectionState;
 if(!state)return;

 function registered(){
  try{return state.load(window.sessionStorage);}catch{return null;}
 }

 const dialog=document.createElement('dialog');
 dialog.id='projectionResumeDialog';
 dialog.className='lead-dialog projection-resume';
 dialog.setAttribute('aria-labelledby','projectionResumeTitle');
 dialog.setAttribute('aria-describedby','projectionResumeIntro');
 dialog.innerHTML=`
  <button type="button" class="modal-close" id="closeProjectionResume" aria-label="Cerrar">×</button>
  <h2 id="projectionResumeTitle">Tu proyección está lista</h2>
  <p id="projectionResumeIntro">Ya completaste tu registro en esta pestaña. Continúa para revisar y ajustar tu proyección.</p>
  <a class="btn btn-primary" id="resumeProjectionLink">Continuar mi proyección</a>
  <button class="measurement-preferences" id="newProjectionRegistration" type="button">Hacer otro registro</button>
  <p id="projectionResumeStatus" role="status" aria-live="polite" hidden></p>`;
 document.body.append(dialog);

 const link=document.getElementById('resumeProjectionLink');
 const status=document.getElementById('projectionResumeStatus');
 let current=null,opener=null;

 document.getElementById('closeProjectionResume').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{
  document.body.classList.remove('lead-dialog-open');
  if(opener?.isConnected)opener.focus({preventScroll:true});
 });
 document.getElementById('newProjectionRegistration').addEventListener('click',()=>{
  const next=current.onNewRegistration;
  try{state.clear(window.sessionStorage);}catch{}
  // A blocked clear must never resume someone else's stored projection.
  if(registered()){
   status.textContent='No pudimos iniciar otro registro. Abre una pestaña nueva para continuar.';
   status.hidden=false;
   return;
  }
  dialog.close();
  next();
 });
 link.addEventListener('click',event=>{
  const previous=registered();
  if(!previous){
   event.preventDefault();
   const next=current.onNewRegistration;
   dialog.close();
   next();
   return;
  }
  if(current.projection){
   let updated=false;
   try{updated=state.save(window.sessionStorage,previous.name,current.projection.inputs);}catch{}
   if(!updated){
    event.preventDefault();
    status.textContent='No pudimos guardar tus cambios. Permite el almacenamiento de sesión y vuelve a intentarlo.';
    status.hidden=false;
   }
  }
 });

 window.ProjectionResume=Object.freeze({open(options){
  if(!registered())return false;
  if(dialog.open)return true;
  current=options;
  opener=options.opener||document.activeElement;
  status.hidden=true;
  link.href=options.resultUrl;
  dialog.showModal();
  document.body.classList.add('lead-dialog-open');
  link.focus();
  return true;
 }});
})();
