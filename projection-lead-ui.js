'use strict';
(()=>{
 const $=id=>document.getElementById(id),open=$('unlockProjectionButton');if(!open)return;
 const state=window.ProjectionState,link=$('completeProjectionLink'),upper=$('upperProjectionTrigger');let current=null;
 function stored(){try{return state.load(sessionStorage);}catch{return null;}}
 function sync(){const ready=!!current,unlocked=!!stored();open.disabled=!ready;upper.disabled=!ready;open.hidden=unlocked;link.hidden=!unlocked;link.href=new URL('../mi-proyeccion/',document.baseURI).href;}
 window.ProjectionFlow=Object.freeze({calculated(value){current=value;sync();},invalidated(){current=null;sync();}});
 function show(e){e.preventDefault();if(!current)return;const previous=stored();
  if(previous){if(state.save(sessionStorage,previous.name,current.inputs))location.assign(link.href);return;}
  window.LandingLeadForms.open({kind:'simulation',buttonId:'simulator_range',projection:current,opener:e.currentTarget,onSaved:contact=>state.save(sessionStorage,contact.name,current.inputs)});
 }
 open.addEventListener('click',show);upper.addEventListener('click',show);
 link.addEventListener('click',e=>{const previous=stored();if(!previous){e.preventDefault();sync();return;}if(current&&!state.save(sessionStorage,previous.name,current.inputs))e.preventDefault();});
 sync();
})();
