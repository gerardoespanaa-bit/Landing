// Focused offline tests: real consent bootstrap + consent UI with native-dialog stand-ins.
// No browser automation, network requests or production Analytics events.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=name=>fs.readFileSync(__dirname+'/'+name,'utf8');
const key='landing-analytics-consent-v2';let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
function boot(saved,{blocked=false}={}){
 const handlers={},values=new Map(saved===undefined?[]:[[key,JSON.stringify({choice:saved,updatedAt:Date.now()})]]);
 let active=null;
 class Element{
  constructor(id,choice){this.id=id;this.hidden=true;this.open=false;this.isConnected=true;this.dataset={analyticsChoice:choice};this.listeners={};this.children=[];}
  addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}
  fire(name){const e={prevented:false,preventDefault(){this.prevented=true;}};for(const fn of this.listeners[name]||[])fn(e);return e;}
  focus(){active=this;}
  querySelectorAll(selector){return selector==='[data-analytics-choice]'?this.children.filter(el=>el.dataset.analyticsChoice):[];}
  querySelector(selector){return selector==='[data-close-measurement]'?close:null;}
  showModal(){assert(!this.open);this.open=true;}
  close(){if(this.open){this.open=false;this.fire('close');}}
 }
 const banner=new Element('measurementConsent'),manage=new Element('measurementPreferences'),dialog=new Element('measurementDetails'),link=new Element('openMeasurementPreferences'),close=new Element('close'),firstOk=new Element('firstOk','granted'),secondOk=new Element('secondOk','granted'),essential=new Element('essential','denied');
 banner.children=[firstOk];dialog.children=[close,essential,secondOk];
 const elements=new Map([banner,manage,dialog,link].map(el=>[el.id,el]));
 const win={dataLayer:[],addEventListener(name,fn){(handlers[name]??=[]).push(fn);},dispatchEvent(e){for(const fn of handlers[e.type]||[])fn(e);}};
 const doc={baseURI:'https://example.test/',referrer:'',cookie:'',getElementById:id=>elements.get(id)||null};
 const context={window:win,document:doc,location:{href:'https://example.test/',hostname:'example.test',pathname:'/'},URL,CustomEvent:class{constructor(type){this.type=type;}},localStorage:{getItem(k){if(blocked)throw Error('blocked');return values.get(k)||null;},setItem(k,v){if(blocked)throw Error('blocked');values.set(k,v);}}};
 vm.createContext(context);for(const file of ['measurement-config.js','measurement-init.js','measurement.js'])vm.runInContext(read(file),context);
 return {win,values,handlers,context,banner,manage,dialog,link,close,firstOk,secondOk,essential,get active(){return active;}};
}
const consentUpdates=t=>t.win.dataLayer.filter(e=>e[0]==='consent');
check('Initial banner visible, no analytics permission and no business events',()=>{const t=boot();assert.equal(t.banner.hidden,false);assert.equal(t.manage.hidden,false);assert.equal(t.dialog.open,false);assert.equal(t.win.LandingConsent.getChoice(),null);assert.equal(consentUpdates(t).length,0);assert(!t.win.dataLayer.some(e=>e.event));});
check('Underlined preferences link opens modal without granting consent',()=>{const t=boot();const event=t.link.fire('click');assert(event.prevented);assert(t.dialog.open);assert(t.banner.hidden);assert.equal(t.active,t.close);assert.equal(t.win.LandingConsent.getChoice(),null);assert.equal(consentUpdates(t).length,0);});
check('Closing or Escape leaves unknown choice unchanged and restores banner/focus',()=>{for(const useButton of [true,false]){const t=boot();t.link.fire('click');if(useButton)t.close.fire('click');else t.dialog.close();assert(!t.dialog.open);assert(!t.banner.hidden);assert.equal(t.active,t.link);assert.equal(t.win.LandingConsent.getChoice(),null);assert.equal(consentUpdates(t).length,0);}});
check('First Ok grants only analytics once and persists the existing preference',()=>{const t=boot();t.firstOk.fire('click');assert(t.banner.hidden);assert.equal(t.win.LandingConsent.getChoice(),'granted');assert.equal(consentUpdates(t).length,1);assert.equal(JSON.parse(t.values.get(key)).choice,'granted');});
check('Second Ok grants analytics, closes modal and returns focus to available preferences',()=>{const t=boot();t.link.fire('click');t.secondOk.fire('click');assert(!t.dialog.open);assert(t.banner.hidden);assert.equal(t.win.LandingConsent.getChoice(),'granted');assert.equal(t.active,t.manage);assert.equal(consentUpdates(t).length,1);});
check('Solo esenciales explicitly denies analytics and saves that choice',()=>{const t=boot();t.link.fire('click');t.essential.fire('click');assert.equal(t.win.LandingConsent.getChoice(),'denied');assert(!t.dialog.open);assert(t.banner.hidden);assert.equal(JSON.parse(t.values.get(key)).choice,'denied');});
check('Saved granted/denied choices do not show the first banner',()=>{for(const saved of ['granted','denied']){const t=boot(saved);assert(t.banner.hidden);t.manage.fire('click');assert(t.dialog.open);t.close.fire('click');assert(t.banner.hidden);assert.equal(t.win.LandingConsent.getChoice(),saved);assert.equal(t.active,t.manage);}});
check('Revoke or allow from footer without reinitializing measurement',()=>{const t=boot('granted');t.manage.fire('click');t.essential.fire('click');assert.equal(t.win.LandingConsent.getChoice(),'denied');t.manage.fire('click');t.secondOk.fire('click');assert.equal(t.win.LandingConsent.getChoice(),'granted');assert(!t.win.dataLayer.some(e=>e.event));});
check('Blocked storage still permits an explicit in-memory choice',()=>{const t=boot(undefined,{blocked:true});t.firstOk.fire('click');assert.equal(t.win.LandingConsent.getChoice(),'granted');assert(t.banner.hidden);});
check('Cross-tab removal shows banner; saved rejection hides it without auto-granting',()=>{const t=boot('granted');for(const fn of t.handlers.storage)fn({key,newValue:null});assert(!t.banner.hidden);for(const fn of t.handlers.storage)fn({key,newValue:JSON.stringify({choice:'denied',updatedAt:Date.now()})});assert(t.banner.hidden);assert.equal(t.win.LandingConsent.getChoice(),'denied');});
check('Every grant and refusal keeps all advertising permissions denied',()=>{const t=boot();t.firstOk.fire('click');t.manage.fire('click');t.essential.fire('click');t.manage.fire('click');t.secondOk.fire('click');for(const e of consentUpdates(t))for(const name of ['ad_storage','ad_user_data','ad_personalization'])assert.equal(e[2][name],'denied');});
check('Repeated script initialization does not duplicate handlers or events',()=>{const t=boot();vm.runInContext(read('measurement.js'),t.context);t.link.fire('click');t.secondOk.fire('click');assert.equal(consentUpdates(t).length,1);assert.equal(t.firstOk.listeners.click.length,1);});
check('Both pages use the same banner and modal, one first-layer Ok and an actual underlined link',()=>{
 const sections=[];
 for(const file of ['index.html','aviso-de-privacidad.html']){
  const html=read(file),banner=html.match(/<section id="measurementConsent"[\s\S]*?<\/section>/)[0];
  assert.equal((banner.match(/<button/g)||[]).length,1);assert(banner.includes('>Ok</button>'));
  assert(banner.includes('href="#measurementDetails"'));assert(banner.includes('>aquí</a>'));
  const modal=html.match(/<dialog id="measurementDetails"[\s\S]*?<\/dialog>/)[0];
  assert(modal.includes('data-analytics-choice="denied">Solo esenciales'));
  assert(modal.includes('class="consent-primary"'));assert(modal.includes('señales limitadas'));
  sections.push(banner+modal);
 }
 assert.equal(sections[0],sections[1]);assert(/\.consent-preferences-link\{[^}]*text-decoration:underline/.test(read('privacy.css')));
});
console.log(JSON.stringify({result:'passed',checks,networkRequests:0}));
