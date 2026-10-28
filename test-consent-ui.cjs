// Consent UI behavior with real bootstrap and dialog stand-ins. NOT browser/Tag Assistant proof.
const assert=require('node:assert/strict'),vm=require('node:vm');
const {boot:bootstrap,record,read,expectState}=require('./test-consent-init.cjs');
function boot(options={}){
 let active=null;
 class Element{
  constructor(id,action){this.id=id;this.hidden=true;this.open=false;this.checked=false;this.isConnected=true;this.dataset={consentAction:action};this.listeners={};this.children=[];}
  addEventListener(n,fn){(this.listeners[n]??=[]).push(fn);}
  fire(n){const e={prevented:false,preventDefault(){this.prevented=true;}};for(const fn of this.listeners[n]||[])fn(e);return e;}
  focus(){active=this;}
  querySelectorAll(s){return s==='[data-consent-action]'?this.children.filter(e=>e.dataset.consentAction):[];}
  querySelector(s){return s==='[data-close-measurement]'?close:null;}
  showModal(){assert(!this.open);this.open=true;}
  close(){if(this.open){this.open=false;this.fire('close');}}
 }
 const banner=new Element('measurementConsent'),manage=new Element('measurementPreferences'),dialog=new Element('measurementDetails'),link=new Element('openMeasurementPreferences'),close=new Element('close'),first=new Element('first','accept-measurement'),save=new Element('save','save'),essential=new Element('essential','essential'),analytics=new Element('consentAnalytics'),advertising=new Element('consentAdvertising');
 banner.children=[first];dialog.children=[close,essential,save];
 const elements=new Map([banner,manage,dialog,link,analytics,advertising].map(e=>[e.id,e]));
 const t=bootstrap({...options,elements});vm.runInContext(read('measurement.js'),t.context);
 return {...t,banner,manage,dialog,link,close,first,save,essential,analytics,advertising,get active(){return active;}};
}
let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
check('No prior choice: first screen visible and both optional toggles off',()=>{const t=boot();assert(!t.banner.hidden);t.link.fire('click');assert(t.dialog.open);assert(!t.analytics.checked&&!t.advertising.checked);expectState(t,false,false);});
check('First Ok grants analytics and measurement, never personalization',()=>{const t=boot();t.first.fire('click');expectState(t,true,true);assert(t.banner.hidden);assert(!t.dialog.open);});
check('Solo esenciales declines both even after toggles were selected',()=>{const t=boot();t.link.fire('click');t.analytics.checked=t.advertising.checked=true;t.essential.fire('click');expectState(t,false,false);assert(!t.dialog.open);assert(t.banner.hidden);});
for(const a of [false,true])for(const d of [false,true])check('Second Ok saves precisely '+a+'/'+d,()=>{const t=boot();t.link.fire('click');t.analytics.checked=a;t.advertising.checked=d;expectState(t,false,false);t.save.fire('click');expectState(t,a,d);assert(!t.dialog.open);});
check('Footer restores saved toggles; closing discards unsaved changes',()=>{const t=boot({saved:record(true,false)});t.manage.fire('click');assert(t.analytics.checked&&!t.advertising.checked);t.analytics.checked=false;t.advertising.checked=true;t.close.fire('click');expectState(t,true,false);t.manage.fire('click');assert(t.analytics.checked&&!t.advertising.checked);});
check('Link, close button and Escape do not imply consent',()=>{for(const closeWithButton of [true,false]){const t=boot();assert(t.link.fire('click').prevented);t.analytics.checked=t.advertising.checked=true;if(closeWithButton)t.close.fire('click');else t.dialog.close();expectState(t,false,false);assert(!t.banner.hidden);assert.equal(t.active,t.link);}});
check('Allow both, revoke advertising only, then revoke everything',()=>{const t=boot();t.first.fire('click');t.manage.fire('click');t.advertising.checked=false;t.save.fire('click');expectState(t,true,false);t.manage.fire('click');t.essential.fire('click');expectState(t,false,false);assert.equal(t.active,t.manage);});
check('Granular cross-tab decisions update an open preference panel',()=>{const t=boot();t.link.fire('click');t.handlers.storage.forEach(fn=>fn({key:'landing-privacy-consent-v3',newValue:JSON.stringify(record(false,true))}));assert(!t.analytics.checked&&t.advertising.checked);expectState(t,false,true);});
check('Legacy consent restores only analytics, not the new advertising toggle',()=>{const t=boot({legacy:{choice:'granted',updatedAt:Date.now()}});assert(t.banner.hidden);t.manage.fire('click');assert(t.analytics.checked&&!t.advertising.checked);expectState(t,true,false);});
check('Repeated initialization does not duplicate a consent command',()=>{const t=boot();vm.runInContext(read('measurement.js'),t.context);t.first.fire('click');assert.equal(t.win.dataLayer.filter(e=>e[0]==='consent'&&e[1]==='update').length,1);});
check('Privacy controls do not emit business events or visitor inputs',()=>{const t=boot();t.link.fire('click');t.analytics.checked=true;t.save.fire('click');t.manage.fire('click');t.essential.fire('click');assert(!t.win.dataLayer.some(e=>e.event));});
check('Both pages have identical UI, accessible controls, full notice link and refreshed assets',()=>{
 const parts=[];for(const file of ['index.html','aviso-de-privacidad.html']){const s=read(file),banner=s.match(/<section id="measurementConsent"[\s\S]*?<\/section>/)[0],dialog=s.match(/<dialog id="measurementDetails"[\s\S]*?<\/dialog>/)[0];assert.equal((banner.match(/<button/g)||[]).length,1);assert(banner.includes('>Aquí</a>'));assert(banner.includes('Al pulsar “Ok”, aceptas estos usos.'));assert(banner.includes('Aviso de privacidad'));assert(dialog.includes('>Solo esenciales</button>'));assert(dialog.includes('>Preferencias de privacidad</h2>'));for(const id of ['consentAnalytics','consentAdvertising'])assert(new RegExp('<input id="'+id+'" type="checkbox" aria-describedby=').test(dialog));assert(!/<input id="consent(?:Analytics|Advertising)"[^>]*checked/.test(dialog));assert(s.includes('measurement-init.js?v=4'));parts.push(banner+dialog);}assert.equal(parts[0],parts[1]);
});
console.log(JSON.stringify({result:'passed',checks,networkRequests:0,realBrowser:false,tagAssistant:false}));
