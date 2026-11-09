'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const lead=require('./hubspot-submission.js');
const state=require('./projection-state.js');
const scenarios=require('./projection-scenarios.js');
const script=fs.readFileSync(path.join(__dirname,'projection-direct-form.js'),'utf8');

function run(query,{advertising=false,fetcher}={}){
 const els=new Map(),requests=[],redirects=[],saved=new Map();
 const el=id=>{
  if(!els.has(id))els.set(id,{listeners:{},value:'',hidden:false,disabled:false,
   addEventListener(name,fn){this.listeners[name]=fn;},focus(){},setAttribute(){},
   showModal(){this.open=true;},close(){this.open=false;this.listeners.close();}});
  return els.get(id);
 };
 const form=el('directProjectionForm');
 const name=el('directProjectionName'),phone=el('directProjectionPhone'),consent=el('directProjectionConsent');
 const age=el('directProjectionAge'),retire=el('directProjectionRetirement'),monthly=el('directProjectionMonthly');
 form.querySelectorAll=()=>[name,phone,consent,age,retire,monthly];
 Object.assign(name,{value:'PRUEBA AISLADA'});
 Object.assign(phone,{value:'0000000000'});
 consent.checked=true;age.valueAsNumber=39;retire.valueAsNumber=60;monthly.valueAsNumber=2500;
 const baseURI='https://example.test/simulador/',location={href:baseURI+query,replace:url=>redirects.push(url)};
 const document={baseURI,title:'Simulador de retiro | Gerardo España',cookie:'',getElementById:el,body:{classList:{add(){},remove(){}}}};
 const keys=['name','phone','source','consent','age','retire','monthly','simulatedAt','gclid','utm'];
 const config={enabled:true,portalId:'1',formId:'00000000-0000-4000-8000-000000000000',fields:Object.fromEntries(keys.map(key=>[key,key]))};
 const storage={setItem:(key,value)=>saved.set(key,value),getItem:key=>saved.get(key)};
 let blocked=false;
 const window={location,ProjectionLead:lead,ProjectionState:state,ProjectionScenarios:scenarios,PPR_HUBSPOT_FORM:config,
  get sessionStorage(){if(blocked)throw Error('Storage blocked');return storage;},
  LandingConsent:{getPreferences:()=>({advertising})},
  fetch:async(url,options)=>{requests.push(JSON.parse(options.body));return fetcher?.()??success();}};
 vm.runInNewContext(script,{window,document,location,URL});
 return {el,requests,redirects,storage,block:value=>{blocked=value;},submit:()=>form.listeners.submit({preventDefault(){}})};
}
function success(){return {status:200,json:async()=>({inlineMessage:'OK'})};}
const query='?registro=1&gclid=QATestGclid1234567890&utm_medium=cpc&email=qa%40example.test';

(async()=>{
 for(const query of ['', '?registro=0', '?registro=1&registro=1']){
  const t=run(query);assert.equal(t.el('directProjectionDialog').open,undefined);
 }
 const invalid=run(query);
 invalid.el('directProjectionAge').valueAsNumber=17;
 await invalid.submit();assert.equal(invalid.requests.length,0);assert.equal(invalid.redirects.length,0);
 invalid.el('directProjectionAge').valueAsNumber=39;invalid.el('directProjectionConsent').checked=false;
 await invalid.submit();assert.equal(invalid.requests.length,0);

 let release;
 const t=run(query,{fetcher:()=>new Promise(resolve=>{release=resolve;})});
 assert(t.el('directProjectionDialog').open);
 const pending=t.submit();await t.submit();
 assert.equal(t.requests.length,1);assert.equal(t.redirects.length,0);assert.equal(state.load(t.storage),null);
 release({status:503});await pending;
 assert.equal(t.redirects.length,0);assert.equal(t.el('directProjectionContinue').disabled,false);
 const retry=t.submit();release(success());await retry;
 assert.deepEqual(t.redirects,['https://example.test/mi-proyeccion/']);
 assert.deepEqual(state.load(t.storage).inputs,{age:39,retire:60,monthly:2500});
 const payload=t.requests.at(-1),fields=Object.fromEntries(payload.fields.map(f=>[f.name,f.value]));
 assert.equal(payload.context.pageUri,'https://example.test/simulador/');
 assert.deepEqual(payload.legalConsentOptions.consent,{consentToProcess:true,text:'Acepto aviso de privacidad',communications:[]});
 assert.equal(fields.source,'PPR | Simulación | simulator_direct');
 assert.equal(fields.gclid,'');assert.equal(JSON.parse(fields.utm).utm_medium,'cpc');
 assert.deepEqual([fields.age,fields.retire,fields.monthly],['39','60','2500']);
 assert(!Object.keys(fields).some(key=>key.startsWith('result')));

 const blocked=run(query,{advertising:true});
 blocked.block(true);await blocked.submit();
 assert.equal(blocked.redirects.length,0);
 assert.match(blocked.el('directProjectionStatus').textContent,/Tu registro se guardó/);
 assert.equal(blocked.requests[0].fields.find(f=>f.name==='gclid').value,'QATestGclid1234567890');
 blocked.block(false);await blocked.submit();
 assert.equal(blocked.requests.length,1);assert.equal(blocked.redirects.length,1);
 console.log('PASS: direct link, validation, consent, HubSpot confirmation, retry, single submission and clean redirect');
})().catch(error=>{console.error(error);process.exitCode=1;});
