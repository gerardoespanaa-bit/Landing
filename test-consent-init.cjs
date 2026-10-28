// Offline consent-state tests. No requests to Google or browser automation.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=name=>fs.readFileSync(__dirname+'/'+name,'utf8');
const key='landing-privacy-consent-v3',legacyKey='landing-analytics-consent-v2',noticeVersion='privacy-2026-10-28-v3';
function record(analytics,advertising,extra={}){return {version:3,noticeVersion,analytics,advertising,updatedAt:Date.now(),...extra};}
function boot({saved,legacy,blocked=false,pathname='/',elements=new Map(),cookies={_ga:'test',_gcl_aw:'test',_gac_test:'test',necessary:'keep'}}={}){
 const values=new Map(),handlers={},cleared=[];
 for(const [k,v] of [[key,saved],[legacyKey,legacy]])if(v!==undefined)values.set(k,typeof v==='string'?v:JSON.stringify(v));
 const win={dataLayer:[],addEventListener(n,fn){(handlers[n]??=[]).push(fn);},dispatchEvent(e){for(const fn of handlers[e.type]||[])fn(e);}};
 const document={baseURI:'https://example.test'+pathname,referrer:'',getElementById:id=>elements.get(id)||null};
 Object.defineProperty(document,'cookie',{get(){return Object.entries(cookies).map(([k,v])=>k+'='+v).join('; ');},set(v){const name=v.split('=')[0];if(v.includes('Max-Age=0')){cleared.push(v);delete cookies[name];}}});
 const context={window:win,document,location:new URL(document.baseURI),URL,CustomEvent:class{constructor(type){this.type=type;}},localStorage:{getItem(k){if(blocked)throw Error('blocked');return values.get(k)??null;},setItem(k,v){if(blocked)throw Error('blocked');values.set(k,v);},removeItem(k){if(blocked)throw Error('blocked');values.delete(k);}}};
 vm.createContext(context);
 const inline=read('index.html').match(/<script>\s*([\s\S]*?)<\/script>/)[1];
 vm.runInContext(inline,context);vm.runInContext(read('measurement-config.js'),context);vm.runInContext(read('measurement-init.js'),context);
 return {win,context,handlers,values,cookies,cleared};
}
function lastState(t){return Object.assign({},...t.win.dataLayer.filter(e=>e[0]==='consent').map(e=>e[2]));}
function expectState(t,a,d){assert.deepEqual(lastState(t),{analytics_storage:a?'granted':'denied',ad_storage:d?'granted':'denied',ad_user_data:d?'granted':'denied',ad_personalization:'denied'});}
module.exports={boot,record,lastState,expectState,key,legacyKey,read};
if(require.main===module){
 let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
 check('Inline denial precedes bootstrap and metadata, with no initial grant',()=>{const t=boot();expectState(t,false,false);assert.equal(t.win.dataLayer[0][0],'consent');assert.equal(t.win.dataLayer[0][1],'default');assert.equal(t.win.LandingConsent.getPreferences(),null);assert(!t.win.dataLayer.some(e=>e.event));});
 for(const a of [false,true])for(const d of [false,true]){
  check('Persist independent choices '+a+'/'+d,()=>{const t=boot();assert(t.win.LandingConsent.choose({analytics:a,advertising:d}));expectState(t,a,d);const saved=JSON.parse(t.values.get(key));assert.equal(saved.analytics,a);assert.equal(saved.advertising,d);assert.equal(saved.noticeVersion,noticeVersion);assert(Number.isFinite(saved.updatedAt));const restored=boot({saved});expectState(restored,a,d);assert.equal(restored.win.LandingConsent.getPreferences().analytics,a);assert.equal(restored.win.LandingConsent.getPreferences().advertising,d);});
 }
 for(const choice of ['granted','denied'])check('Old preference '+choice+' never grants advertising',()=>{const t=boot({legacy:{choice,updatedAt:Date.now()}});expectState(t,choice==='granted',false);t.win.LandingConsent.choose({analytics:false,advertising:false});assert(!t.values.has(legacyKey));});
 for(const saved of ['broken','null',{},record(true,true,{version:2}),record(true,true,{noticeVersion:'other'}),record(true,true,{analytics:'true'}),record(true,true,{updatedAt:Date.now()+86400000}),record(true,true,{updatedAt:Date.now()-181*86400000})])check('Invalid/expired record fails closed '+JSON.stringify(saved).slice(0,60),()=>{const t=boot({saved,legacy:{choice:'granted',updatedAt:Date.now()}});expectState(t,false,false);assert.equal(t.win.LandingConsent.getPreferences(),null);});
 check('Reject malformed API choices without changing permissions',()=>{const t=boot();for(const p of [null,{},true,{analytics:true,advertising:1},{analytics:true,advertising:true,personalization:true},'anything'])assert.equal(t.win.LandingConsent.choose(p),false);expectState(t,false,false);});
 check('Old string API remains analytics-only',()=>{const t=boot();assert(t.win.LandingConsent.choose('granted'));expectState(t,true,false);assert(t.win.LandingConsent.choose('denied'));expectState(t,false,false);});
 check('Revocation removes accessible optional cookies and ad local storage',()=>{const t=boot({saved:record(true,true)});t.values.set('_gcl_ls','test-ad-click');t.win.LandingConsent.choose({analytics:false,advertising:false});expectState(t,false,false);assert(!t.cookies._ga&&!t.cookies._gcl_aw&&!t.cookies._gac_test);assert.equal(t.cookies.necessary,'keep');assert(!t.values.has('_gcl_ls'));assert(t.cleared.some(v=>v.includes('domain=.example.test')));});
 check('Separate revocation retains the other purpose',()=>{const t=boot({saved:record(true,true)});t.win.LandingConsent.choose({analytics:true,advertising:false});expectState(t,true,false);assert.equal(t.cookies._ga,'test');assert(!t.cookies._gcl_aw);t.win.LandingConsent.choose({analytics:false,advertising:true});expectState(t,false,true);});
 check('Blocked storage uses explicit in-memory selection without initial permission',()=>{const t=boot({blocked:true});expectState(t,false,false);t.win.LandingConsent.choose({analytics:true,advertising:true});expectState(t,true,true);});
 check('Cross-tab update, revocation and clear preserve exact states',()=>{const t=boot();const update=e=>t.handlers.storage.forEach(fn=>fn(e));update({key,newValue:JSON.stringify(record(false,true))});expectState(t,false,true);update({key,newValue:JSON.stringify(record(true,false))});expectState(t,true,false);update({key,newValue:null});expectState(t,false,false);update({key:null,newValue:null});expectState(t,false,false);});
 check('Legacy storage event cannot override a granular stored choice',()=>{const t=boot({saved:record(false,false)});t.handlers.storage.forEach(fn=>fn({key:legacyKey,newValue:JSON.stringify({choice:'granted',updatedAt:Date.now()})}));expectState(t,false,false);});
 check('Bootstrap is idempotent and personalization always denied',()=>{const t=boot();const before=t.win.dataLayer.length;vm.runInContext(read('measurement-init.js'),t.context);assert.equal(t.win.dataLayer.length,before);for(const p of [{analytics:true,advertising:true},{analytics:false,advertising:true},{analytics:true,advertising:false},{analytics:false,advertising:false}])t.win.LandingConsent.choose(p);assert(t.win.dataLayer.filter(e=>e[0]==='consent').every(e=>e[2].ad_personalization==='denied'));assert(t.win.dataLayer.some(e=>e[0]==='set'&&e[1].allow_ad_personalization_signals===false&&e[1].allow_google_signals===false));});
 console.log(JSON.stringify({result:'passed',checks,networkRequests:0}));
}
