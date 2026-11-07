// Source and navigation checks: no Google requests, real contacts or browser state.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {boot,record,expectState}=require('./test-consent-init.cjs');
let checked=0;
function walk(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else if(/\.(?:html|js|css|svg)$/.test(p)){const s=fs.readFileSync(p,'utf8');assert(!/GTM-|gtm\.js|ns\.html|Google Tag Manager|ga4MeasurementId|gtmContainerId|G-VSNRQ7H8JL/.test(s),p);assert(!/gtag\(\s*['"]config['"]\s*,\s*['"]G-/.test(s),p);checked++;}}}
walk(__dirname);
for(const allowed of [false,true]){
 const t=boot({saved:record(true,allowed)}),links=['header','hero','footer'].map(source=>({dataset:{measureLocation:source}}));
 t.context.document.querySelectorAll=()=>links;
 t.context.location=new URL('https://example.test/?utm_source=google&utm_medium=cpc&gclid=Cj0KCQ_TEST_VALID_Abc123xyz456');
 t.context.document.baseURI='https://example.test/';
 // The real sanitized metadata is selected without an analytics/container ID.
 const meta=t.win.dataLayer.find(e=>e.landing_page_metadata===true);
 meta.page_location='https://example.test/?utm_source=google&utm_medium=cpc&gclid=Cj0KCQ_TEST_VALID_Abc123xyz456';
 vm.runInContext(fs.readFileSync(path.join(__dirname,'simulator-navigation.js'),'utf8'),t.context);
 for(const link of links){const u=new URL(link.href);assert.equal(u.pathname,'/simulador/');assert.equal(u.searchParams.get('utm_source'),'google');assert.equal(u.searchParams.has('gclid'),allowed);assert.equal(u.hash,'#'+link.dataset.measureLocation);}
 expectState(t,true,allowed);
}
console.log(JSON.stringify({result:'passed',runtimeFiles:checked,navigationConsentCases:2,networkRequests:0}));
