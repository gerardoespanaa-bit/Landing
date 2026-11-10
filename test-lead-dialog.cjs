// Isolated modal behavior tests: no browser, network or real contact data.
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const lead=require('./hubspot-submission.js'),scenarios=require('./projection-scenarios.js'),state=require('./projection-state.js');const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');let checks=0;
const config={enabled:true,portalId:'52231197',formId:'00000000-0000-4000-8000-000000000000',fields:{name:'firstname',phone:'phone',age:'ppr_edad_actual',retire:'ppr_edad_retiro',monthly:'ppr_aportacion_mensual',result8:'ppr_resultado_8',result12:'ppr_resultado_12',simulatedAt:'ppr_fecha_simulacion',gclid:'ppr_gclid',utm:'ppr_campana_utm',consent:'ppr_consentimiento_simulacion',source:'ppr_origen_lead'}};
function runtime(fetcher,baseURI='https://example.test/simulador/'){
 const ids=new Map();let active=null;const labels=[];const events=[],redirects=[];
 class El{
  constructor(tag='div'){this.tag=tag;this.children=[];this.hidden=false;this.disabled=false;this.value='';this.checked=false;this.attrs={};this.handlers={};this.isConnected=true;this.classList={add(){},remove(){}};}
  set innerHTML(text){for(const m of text.matchAll(/<(\w+)\b([^>]*)>/g)){const e=new El(m[1]);e.hidden=/\bhidden\b/.test(m[2]);for(const a of m[2].matchAll(/([\w-]+)="([^"]*)"/g)){e.attrs[a[1]]=a[2];if(a[1]==='id')ids.set(a[2],e);}if(m[1]==='label')labels.push(e);}}
  addEventListener(name,fn){(this.handlers[name]??=[]).push(fn);}
  async fire(name){const ev={prevented:false,preventDefault(){this.prevented=true;}};for(const fn of this.handlers[name]||[])await fn(ev);return ev;}
  showModal(){this.open=true;}close(){this.open=false;this.fire('close');}
  reset(){for(const el of ids.values())if(el.tag==='input'){el.value='';el.checked=false;}}
  focus(){active=this;}append(...els){this.children.push(...els);for(const e of els)if(e.id)ids.set(e.id,e);}replaceChildren(...els){this.children=els;}
  querySelectorAll(s){if(s==='label')return labels;return [...ids.values()].filter(e=>s==='input,button'?e.tag==='input'||e===ids.get('projectionLeadContinue'):false);}
  setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]??null;}
 }
 const document={createElement:tag=>new El(tag),createTextNode:text=>({textContent:text}),getElementById:id=>ids.get(id),body:new El('body'),baseURI,cookie:'',get activeElement(){return active;}};document.body.dataset={projectionFull:String(baseURI.endsWith('/mi-proyeccion/'))};
 const values=new Map();let blocked=false;
 const storage={getItem:k=>values.get(k),setItem(k,v){if(blocked)throw Error();values.set(k,v);}};
 const win={ProjectionLead:lead,ProjectionScenarios:scenarios,ProjectionState:state,sessionStorage:storage,PPR_HUBSPOT_FORM:config,fetch:fetcher,LandingConsent:{getPreferences:()=>({analytics:false,advertising:false})},LandingMeasurement:{track:(...v)=>events.push(v)},location:{assign:url=>redirects.push(url)}};
 vm.runInNewContext(read('lead-dialog.js'),{window:win,document,URL,Map,Object,location:new URL(baseURI)});
 function fill(){ids.get('projectionLeadName').value='PRUEBA AISLADA';ids.get('projectionLeadPhone').value='0000000000';ids.get('projectionLeadConsent').checked=true;ids.get('advisoryProjectionAge').valueAsNumber=37;ids.get('advisoryProjectionRetirement').valueAsNumber=60;ids.get('advisoryProjectionMonthly').valueAsNumber=3200;}
 return {ids,win,fill,events,redirects,labels,storage,block:value=>{blocked=value;},submit:()=>ids.get('projectionLeadForm').fire('submit')};
}
const check=async(name,fn)=>{await fn();checks++;console.log('PASS '+name);};
(async()=>{
 await check('Invalid phone and missing authorization never send',async()=>{
  let posts=0;const t=runtime(async()=>{posts++;return{status:200,json:async()=>({inlineMessage:'ok'})};});
  t.win.LandingLeadForms.open({kind:'advisory',buttonId:'wa_hero_advisory'});await t.submit();t.fill();t.ids.get('projectionLeadConsent').checked=false;await t.submit();assert.equal(posts,0);assert.equal(t.redirects.length,0);
 });
 await check('All full forms use the campaign labels and require valid retirement inputs',async()=>{
  const markup=read('simulador/index.html'),dialog=read('lead-dialog.js');
  for(const [campaignId,advisoryId] of [['Name','LeadName'],['Phone','LeadPhone'],['Age','Age'],['Retirement','Retirement'],['Monthly','Monthly']]){
   const id=advisoryId.startsWith('Lead')?'projection'+advisoryId:'advisoryProjection'+advisoryId;
   const label=(html,target)=>html.match(new RegExp('<label for="'+target+'">([^<]+)<input'))?.[1].trim();
   const expected=label(markup,'directProjection'+campaignId);assert(expected);assert.equal(label(dialog,id),expected);
  }
  for(const [kind,id] of [['advisory','wa_header_advisory'],['advisory','wa_hero_advisory'],['advisory','wa_cta_advisory'],['advisory','wa_about_social'],['contract','product_contract']]){
   const posts=[];
   const t=runtime(async(_url,options)=>{posts.push(JSON.parse(options.body));return{status:200,json:async()=>({inlineMessage:'ok'})};},'https://example.test/');
   t.win.LandingLeadForms.open({kind,buttonId:id});assert(!t.ids.get('advisoryProjectionInputs').hidden);
   t.fill();t.ids.get('advisoryProjectionMonthly').valueAsNumber=NaN;await t.submit();assert.equal(posts.length,0);
   t.fill();t.ids.get('advisoryProjectionRetirement').valueAsNumber=36;await t.submit();assert.equal(posts.length,0);
   t.fill();await t.submit();assert.equal(posts.length,1);
   const fields=Object.fromEntries(posts[0].fields.map(({name,value})=>[name,value]));
   assert.deepEqual([fields.ppr_edad_actual,fields.ppr_edad_retiro,fields.ppr_aportacion_mensual],['37','60','3200']);
   assert.equal(fields.ppr_origen_lead,'PPR | '+(kind==='contract'?'Solicitud de contratación':'Asesoría')+' | '+id);
   assert.equal(posts[0].legalConsentOptions.consent.text,'Acepto aviso de privacidad');
   for(const field of ['ppr_resultado_8','ppr_resultado_12','ppr_fecha_simulacion','ppr_consentimiento_simulacion'])assert(!(field in fields));
   assert.deepEqual(state.load(t.storage).inputs,{age:37,retire:60,monthly:3200});
   assert.deepEqual(t.redirects,['https://example.test/mi-proyeccion/']);
  }
 });
 await check('Pending submit locks fields, prevents Escape and double click; only success opens results',async()=>{
  let posts=0,release;const t=runtime(()=>{posts++;return new Promise(r=>release=r);});
  t.win.LandingLeadForms.open({kind:'advisory',buttonId:'wa_hero_advisory',measurement:{location:'hero'}});t.fill();const first=t.submit();await t.submit();assert.equal(posts,1);assert(t.ids.get('projectionLeadContinue').disabled);assert((await t.ids.get('projectionLeadDialog').fire('cancel')).prevented);
  release({status:200,json:async()=>({inlineMessage:'ok'})});await first;
  assert.deepEqual(t.redirects,['https://example.test/mi-proyeccion/']);
  assert.equal(posts,1);assert(!t.events.some(e=>e[0]==='whatsapp_contact'));
 });
 await check('Server rejection permits retry without hiding form or redirecting',async()=>{
  let posts=0;const t=runtime(async()=>++posts===1?{status:500}:{status:200,json:async()=>({inlineMessage:'ok'})});
  t.win.LandingLeadForms.open({kind:'contract',buttonId:'product_contract'});t.fill();await t.submit();
  assert(!t.ids.get('advisoryProjectionInputs').hidden);
  assert(!t.ids.get('projectionLeadContinue').disabled);assert(!t.ids.get('projectionLeadContinue').hidden);assert(t.ids.get('projectionLeadStatus').textContent.includes('No pudimos'));assert.equal(t.redirects.length,0);await t.submit();assert.equal(posts,2);assert.equal(t.redirects.length,1);
 });
 await check('Confirmed simulation retries storage without a second CRM post; clean URL only after save',async()=>{
  let posts=0;const t=runtime(async()=>{posts++;return{status:200,json:async()=>({inlineMessage:'ok'})};});
  const projection=require('./projection-scenarios.js').calculateFrom({age:35,retire:65,monthly:2000});
  t.win.LandingLeadForms.open({kind:'simulation',buttonId:'simulator_range',projection});assert(t.ids.get('advisoryProjectionInputs').hidden);t.block(true);t.fill();await t.submit();assert.equal(posts,1);assert.equal(t.redirects.length,0);
  t.block(false);await t.submit();assert.equal(posts,1);assert.deepEqual(t.redirects,['https://example.test/mi-proyeccion/']);assert(!t.redirects[0].includes('PRUEBA'));assert.deepEqual(state.load(t.storage).inputs,projection.inputs);
 });
 await check('Simulation stays locked while CRM is pending or rejected; confirms before storing access',async()=>{
  let posts=0,release;const t=runtime(()=>{posts++;return new Promise(r=>release=r);});
  const projection=require('./projection-scenarios.js').calculateFrom({age:35,retire:65,monthly:2000});
  t.win.LandingLeadForms.open({kind:'simulation',buttonId:'simulator_range',projection});t.fill();
  let pending=t.submit();assert.equal(state.load(t.storage),null);assert.equal(t.redirects.length,0);release({status:500});await pending;assert.equal(state.load(t.storage),null);assert.equal(t.redirects.length,0);
  pending=t.submit();assert.equal(state.load(t.storage),null);release({status:200,json:async()=>({inlineMessage:'ok'})});await pending;assert.deepEqual(state.load(t.storage).inputs,projection.inputs);assert.equal(t.redirects.length,1);assert.equal(posts,2);
 });
 await check('Advisory routes open CRM without WhatsApp events; only direct routes emit their own service',async()=>{
  class Control{
   constructor(dataset={}){this.dataset=dataset;this.events={};this.attrs={};this.classList={add(){},remove(){},toggle(){return false;}};}
   addEventListener(n,f){this.events[n]=f;}removeAttribute(n){delete this.attrs[n];}setAttribute(n,v){this.attrs[n]=v;}querySelectorAll(){return [];}
   click(){this.events.click?.({preventDefault(){},currentTarget:this});}
  }
  const direct=[['general','floating','wa_floating'],['seguros','services','wa_insurance_card'],['bolsa','services','wa_investments_card'],['auto','services','wa_auto_card']].map(([waDirect,measureLocation,measureId])=>new Control({waDirect,measureLocation,measureId}));
  const social=new Control({measureLocation:'header',measureId:'wa_header_social'});social.href='https://wa.me/message/42SOTDUOUMFGK1';
  const advisory=new Control({lead:'advisory',measureId:'wa_hero_advisory',measureLocation:'hero'}),ids=new Map(),events=[],forms=[];
  const doc={getElementById:id=>{if(!ids.has(id))ids.set(id,new Control());return ids.get(id);},querySelectorAll:s=>s==='[data-wa-direct]'?direct:s==='[data-lead]'?[advisory]:s==='[data-wa-social]'?[social]:[]};
  vm.runInNewContext(read('app.js'),{document:doc,window:{LandingMeasurement:{track:(...args)=>events.push(args)},LandingLeadForms:{open:v=>forms.push(v)}},performance:{now:()=>100},WeakMap});
  advisory.click();assert.equal(forms.length,1);assert.equal(forms[0].kind,'advisory');assert.equal(events.length,0);social.click();social.click();assert.equal(social.href,'https://wa.me/message/42SOTDUOUMFGK1');assert.equal(forms.length,1);
  for(const control of direct){assert(new URL(control.href).pathname.includes('524423777762'));control.click();control.click();}
  assert.equal(events.length,5);assert.deepEqual(events.map(e=>e[1]),['general','general','seguros','bolsa','auto']);assert(events.every(e=>e[0]==='whatsapp_contact'));
  const message=new URL(direct[1].href).searchParams.get('text');for(const option of ['Residencial','Vida','Gastos Médicos'])assert(message.includes(option));
 });
 console.log(JSON.stringify({result:'passed',checks,networkRequests:0}));

})().catch(e=>{console.error(e);process.exitCode=1;});
