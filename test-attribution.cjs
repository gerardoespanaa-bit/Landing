// Offline regression tests of the production bootstrap; no Google/WhatsApp calls.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=name=>fs.readFileSync(__dirname+'/'+name,'utf8');
const config=read('measurement-config.js'),bootstrap=read('measurement-init.js');
const origin='https://xn--gerardoespaa-khb.com',key='landing-analytics-consent-v2';
const click='Cj0KCQ_SYNTHETIC_TEST_Abc123xyz456'; // Not a real advertising click.
let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
function boot(query='',{referrer='',choice=null,path='/',campaignIds}={}){
 const url=new URL(path+query,origin),listeners={};
 const win={dataLayer:[],addEventListener:(n,cb)=>listeners[n]=cb,dispatchEvent:()=>{}};
 const ctx={window:win,location:url,document:{baseURI:url.href,referrer,cookie:'',getElementById:()=>null},localStorage:{getItem:k=>k===key&&choice?JSON.stringify({choice,updatedAt:Date.now()}):null,setItem:()=>{},removeItem:()=>{}},CustomEvent:class{},URL};
 vm.createContext(ctx);vm.runInContext(config,ctx);
 if(campaignIds!==undefined)win.LANDING_MEASUREMENT_CONFIG={...win.LANDING_MEASUREMENT_CONFIG,adsCampaignIds:campaignIds};
 vm.runInContext(bootstrap,ctx);
 const page=win.dataLayer.find(item=>item.measurement_id);
 const params=Object.fromEntries(new URL(page.page_location).searchParams);
 return {win,ctx,page,params};
}
check('approved UTM vocabulary survives alongside a syntactically valid click ID',()=>{
 const {page,params}=boot('?utm_source=google&utm_medium=cpc&utm_campaign=ppr_mexico_15d&utm_id=ppr_mx_15d&utm_term=plan_personal_de_retiro&utm_content=rsa_ppr_contratar&gclid='+click);
 assert.deepEqual(params,{gclid:click,utm_source:'google',utm_medium:'cpc',utm_campaign:'ppr_mexico_15d',utm_id:'ppr_mx_15d',utm_term:'plan_personal_de_retiro',utm_content:'rsa_ppr_contratar'});
 assert.equal(new URL(page.page_location).origin,origin);
});
for(const name of ['gclid','gbraid','wbraid']){
 check(name+' preserves an opaque URL-safe token',()=>assert.equal(boot('?'+name+'='+click).params[name],click));
 for(const value of ['Gerardo Lopez Espana','privacy_probe@example.invalid','524420000000','200000.50','Hola quiero una asesoria','https://example.invalid/private','%2540email','x'.repeat(513),'abcdefghijklmnopqrst','12345678901234567890','bad\u0000token']){
  check(name+' rejects invalid token '+JSON.stringify(value.slice(0,30)),()=>assert.deepEqual(boot('?'+name+'='+encodeURIComponent(value)).params,{}));
 }
}
check('gad_source accepts bounded numeric metadata',()=>assert.deepEqual(boot('?gad_source=1').params,{gad_source:'1'}));
for(const value of ['','0','0001','1.5','524420000000','email@example.invalid','1 2'])check('invalid gad_source '+value,()=>assert.deepEqual(boot('?gad_source='+encodeURIComponent(value)).params,{}));
check('unregistered campaign IDs including a synthetic phone are excluded',()=>{
 for(const value of ['123456789012','524420000000','0','1e10','privacy@example.invalid'])assert.deepEqual(boot('?gad_campaignid='+value).params,{});
});
check('a campaign ID explicitly registered by the owner survives',()=>{
 const registered='123456789012';
 assert.equal(boot('?gad_campaignid='+registered,{campaignIds:[registered]}).params.gad_campaignid,registered);
 assert.deepEqual(boot('?gad_campaignid=524420000000',{campaignIds:[registered]}).params,{});
});
check('invalid trusted configuration cannot throw or admit invalid campaign IDs',()=>{
 for(const campaignIds of [null,{},[123,{},null,'email@example.invalid']])assert.deepEqual(boot('?gad_campaignid=123',{campaignIds}).params,{});
});
check('synthetic personal, contact and financial input does not survive in any UTM field',()=>{
 for(const name of ['utm_source','utm_medium','utm_campaign','utm_id','utm_term','utm_content'])for(const value of ['Gerardo Lopez Espana','privacy_probe@example.invalid','524420000000','ingresos_50000','aporte_2000','Hola Gerardo quiero informacion','ppr_mexico_15d_email@example.invalid'])assert.deepEqual(boot('?'+name+'='+encodeURIComponent(value)).params,{});
});
check('no partial regex matching, dynamic keywords or unreviewed campaign values',()=>{
 for(const value of ['ppr_mexico_15d_extra','PPR_MEXICO_15D','ppr_mexico_15d\n','{keyword}','mi_campana_segura'])assert.deepEqual(boot('?utm_campaign='+encodeURIComponent(value)).params,{});
});
check('arbitrary query fields and fragments are excluded without changing browser URL',()=>{
 const query='?utm_source=google&email=privacy_probe%40example.invalid&name=Gerardo+Lopez+Espana&phone=524420000000&text=Hola+Gerardo&income=50000&contribution=2000&redirect=https%3A%2F%2Fexample.invalid&foo=bar#private_fragment';
 const {params,page,ctx}=boot(query);assert.deepEqual(params,{utm_source:'google'});assert(!page.page_location.includes('#'));assert.equal(ctx.location.href,origin+'/'+query);
});
for(const query of ['?gclid='+click+'&gclid='+click,'?gclid='+click+'&GCLID='+click,'?utm_source=google&utm_source=google','?utm_source=google&UTM_SOURCE=google','?utm_source=google&%75tm_source=google'])check('duplicate keys fail closed: '+query.slice(0,70),()=>assert.deepEqual(boot(query).params,{}));
check('doubly encoded keys/values and case variants do not bypass policy',()=>{
 assert.deepEqual(boot('?utm%255fsource=google&utm_medium=CPC&UTM_SOURCE=google&utm_campaign=ppr_mexico_15d%2540example.invalid').params,{});
});
check('oversized query fails closed',()=>assert.deepEqual(boot('?gclid='+click+'&private='+'a'.repeat(4097)).params,{}));
for(const path of ['/','/index.html','/Landing/','/Landing/index.html','/aviso-de-privacidad.html','/Landing/aviso-de-privacidad.html'])check('canonical route with campaign '+path,()=>{
 const {page}=boot('?utm_source=google#secret',{path});const url=new URL(page.page_location);
 assert.equal(url.pathname,(path.includes('/Landing/')?'/Landing/':'/')+(path.endsWith('aviso-de-privacidad.html')?'aviso-de-privacidad.html':''));assert.equal(url.hash,'');assert.equal(url.searchParams.get('utm_source'),'google');
});
for(const host of ['www.google.com','www.google.com.mx','www.bing.com','duckduckgo.com','l.facebook.com','www.instagram.com','www.linkedin.com','t.co'])check('known referring origin only: '+host,()=>{
 assert.equal(boot('',{referrer:'https://'+host+'/private/Gerardo?email=privacy_probe@example.invalid&phone=524420000000#secret'}).page.page_referrer,'https://'+host+'/');
});
for(const referrer of ['', 'not a URL','javascript:alert(1)','https://privacy_probe.example.invalid/private','https://google.com.evil.invalid/','https://private.google.com/','https://privacy_probe@example.invalid/','https://user:password@www.google.com/','https://www.google.com:8443/'])check('unknown or unsafe referrer excluded: '+referrer,()=>assert.equal(boot('',{referrer}).page.page_referrer,''));
check('same-origin referrer retains only origin',()=>assert.equal(boot('',{referrer:origin+'/aviso-de-privacidad.html?email=privacy@example.invalid#secret'}).page.page_referrer,origin+'/'));
for(const choice of [null,'denied','granted'])check('privacy, idempotence and exactly one business event per explicit track with '+choice,()=>{
 const {win,ctx,page}=boot('?gclid='+click+'&utm_source=google',{choice,referrer:'https://www.google.com/private?q=secret'});
 const set=win.dataLayer.find(item=>item[0]==='set')[1];assert.equal(set.page_location,page.page_location);assert.equal(set.page_referrer,page.page_referrer);
 assert.equal(set.allow_google_signals,false);assert.equal(set.allow_ad_personalization_signals,false);assert.equal(set.ads_data_redaction,true);assert.equal(set.url_passthrough,false);
 const before=win.dataLayer.length;vm.runInContext(bootstrap,ctx);assert.equal(win.dataLayer.length,before);
 win.LandingConsent.choose('denied');win.LandingConsent.choose('granted');
 assert.equal(win.dataLayer.filter(item=>item.measurement_id).length,1);
 for(const item of win.dataLayer.filter(item=>item[0]==='consent'))for(const ad of ['ad_storage','ad_user_data','ad_personalization'])assert.equal(item[2][ad],'denied');
 assert(!win.dataLayer.some(item=>item[0]==='config'||item[0]==='event'));
 vm.runInContext(read('measurement.js'),ctx);
 for(const [event,location,details] of [['simulator_open','hero'],['simulator_complete','simulator'],['whatsapp_contact','simulator',{button_id:'wa_simulator_results'}]])assert.equal(win.LandingMeasurement.track(event,'retiro',location,details),true);
 assert.equal(win.dataLayer.filter(item=>item.event).length,3);
 for(const event of ['simulator_open','simulator_complete','whatsapp_contact'])assert.equal(win.dataLayer.filter(item=>item.event===event).length,1);
});
check('HTML retains one loader, denied defaults, outgoing referrer protection and cache versions',()=>{
 for(const name of ['index.html','aviso-de-privacidad.html']){
  const html=read(name);assert.equal((html.match(/j\.src=/g)||[]).length,1);assert(!html.includes('gtag/js'));assert(html.includes('measurement-config.js?v=3'));assert(html.includes('measurement-init.js?v=4'));
  assert(html.includes('<meta name="referrer" content="no-referrer">'));
  for(const permission of ['analytics_storage','ad_storage','ad_user_data','ad_personalization'])assert(new RegExp(permission+":'denied'").test(html));
 }
});
console.log('\n'+checks+' attribution checks passed. Offline only; not real-click or GA4 delivery verification.');


