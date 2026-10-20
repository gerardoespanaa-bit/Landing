// Run with node. No network and no Google account required.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const config=fs.readFileSync(__dirname+'/measurement-config.js','utf8');
const bootstrap=fs.readFileSync(__dirname+'/measurement-init.js','utf8');
const key='landing-analytics-consent-v2';
function boot(saved,{blocked=false,pathname='/'}={}){
 const values=new Map(saved===undefined?[]:[[key,typeof saved==='string'?saved:JSON.stringify(saved)]]),listeners={};
 const win={dataLayer:[],addEventListener:(name,cb)=>listeners[name]=cb,dispatchEvent:()=>{}};
 const ctx={window:win,location:{pathname,hostname:'example.com'},document:{baseURI:'https://example.com'+pathname,cookie:''},localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return values.get(k)||null;},setItem:(k,v)=>{if(blocked)throw Error('blocked');values.set(k,v);}},CustomEvent:class{constructor(type){this.type=type;}},URL};
 vm.createContext(ctx);vm.runInContext(config,ctx);vm.runInContext(bootstrap,ctx);
 return {ctx,win,values,listeners};
}
for(const saved of [undefined,'broken','null',{}, {choice:'granted',updatedAt:'bad'}, {choice:'granted',updatedAt:Date.now()+86400000},{choice:'granted',updatedAt:Date.now()-181*86400000}]){
 const {win}=boot(saved);assert.equal(win.LandingConsent.getChoice(),null);
 assert(!win.dataLayer.some(item=>item[0]==='consent'&&item[2].analytics_storage==='granted'));
}
for(const choice of ['granted','denied']){
 const {win,ctx,values,listeners}=boot({choice,updatedAt:Date.now()});
 assert.equal(win.LandingConsent.getChoice(),choice);
 const before=win.dataLayer.length;vm.runInContext(bootstrap,ctx);assert.equal(win.dataLayer.length,before);
 assert.equal(win.LandingConsent.choose('anything'),false);assert.equal(win.dataLayer.length,before);
 assert.equal(win.LandingConsent.choose('denied'),true);assert.equal(JSON.parse(values.get(key)).choice,'denied');
 assert.equal(win.dataLayer.at(-1)[2].analytics_storage,'denied');
 listeners.storage({key,newValue:JSON.stringify({choice:'granted',updatedAt:Date.now()})});assert.equal(win.LandingConsent.getChoice(),'granted');
 listeners.storage({key:null,newValue:null});assert.equal(win.LandingConsent.getChoice(),null);
 for(const item of win.dataLayer.filter(item=>item[0]==='consent'))for(const ad of ['ad_storage','ad_user_data','ad_personalization'])assert.equal(item[2][ad],'denied');
}
const restricted=boot(undefined,{blocked:true});assert(restricted.win.LandingConsent.choose('granted'));assert.equal(restricted.win.LandingConsent.getChoice(),'granted');
for(const pathname of ['/','/index.html','/Landing/','/Landing/index.html','/aviso-de-privacidad.html','/Landing/aviso-de-privacidad.html']){
 const {win}=boot(undefined,{pathname});const page=win.dataLayer.find(item=>item.measurement_id);
 assert.equal(page.page_referrer,'');assert(!page.page_location.includes('index.html'));
 assert.equal(page.page_location,'https://example.com'+(pathname.includes('/Landing/')?'/Landing/':'/')+(pathname.endsWith('aviso-de-privacidad.html')?'aviso-de-privacidad.html':''));
}
console.log('Consent bootstrap passed: expiration, invalid/future preferences, blocked storage, cross-tab updates, ad denial, idempotence, canonical pages.');
