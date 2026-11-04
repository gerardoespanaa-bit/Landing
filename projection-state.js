'use strict';
((root)=>{
 const key='ppr-projection-session-v2',maxAge=86400000;
 function clean(value,now=Date.now()){
  if(!value||value.version!==2||value.unlocked!==true||!Number.isFinite(value.savedAt)||now-value.savedAt<0||now-value.savedAt>maxAge)return null;
  if(typeof value.name!=='string'||value.name.trim().length<2||value.name.length>100||/[<>\u0000-\u001f]/.test(value.name))return null;
  const i=value.inputs;if(!i||!Number.isInteger(i.age)||i.age<18||i.age>64||!Number.isInteger(i.retire)||i.retire<65||i.retire>90||!Number.isInteger(i.monthly)||i.monthly<2000||i.monthly>1000000)return null;
  return {version:2,unlocked:true,name:value.name.trim(),inputs:{age:i.age,retire:i.retire,monthly:i.monthly},savedAt:value.savedAt};
 }
 function load(storage){try{return clean(JSON.parse(storage.getItem(key)));}catch{return null;}}
 function save(storage,name,inputs){
  const value=clean({version:2,unlocked:true,name,inputs,savedAt:Date.now()});if(!value)return false;
  try{storage.setItem(key,JSON.stringify(value));return Boolean(load(storage));}catch{return false;}
 }
 function clear(storage){try{storage.removeItem(key);}catch{}}
 try{if(typeof window!=='undefined')window.localStorage.removeItem('ppr-projection-unlocked-v1');}catch{}
 const api=Object.freeze({key,load,save,clear,clean});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ProjectionState=api;
})(typeof window==='undefined'?globalThis:window);
