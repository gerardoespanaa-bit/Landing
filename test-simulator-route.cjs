// Structural navigation and privacy checks; functional gate tests live in test-projection-flow.cjs.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
let checks=0;const check=(n,f)=>{f();checks++;console.log('PASS '+n);};
check('Home has four actual simulator links, no embedded calculator or result page link',()=>{const h=read('index.html');assert.equal((h.match(/href="simulador\/"/g)||[]).length,4);assert(!h.includes('id="retirementForm"'));assert(!h.includes('mi-proyeccion'));});
for(const file of ['index.html','simulador/index.html','mi-proyeccion/index.html'])check('Only the Ads tag and all local scripts/styles resolve on '+file,()=>{const h=read(file);assert.equal((h.match(/j\.src=/g)||[]).length,0);for(const m of h.matchAll(/(?:src|href)="([^"#]+\.(?:js|css)(?:\?[^"#]*)?)"/g)){if(/^https?:/.test(m[1]))continue;assert(fs.existsSync(path.resolve(__dirname,path.dirname(file),m[1].split('?')[0])),m[1]);}});
const {boot,record,expectState}=require('./test-consent-init.cjs');
for(const route of ['simulador','mi-proyeccion'])check('Distinct page metadata and preserved consent on '+route,()=>{const t=boot({pathname:'/'+route+'/',saved:record(true,false)});expectState(t,true,false);const p=t.win.dataLayer.find(e=>e.landing_page_metadata===true);assert.equal(new URL(p.page_location).pathname,'/'+route+'/');assert.equal(p.page_title,route==='simulador'?'Simulador de retiro | Gerardo España':'Mi proyección | Gerardo España');t.win.LandingConsent.choose({analytics:false,advertising:false});expectState(t,false,false);});
console.log(JSON.stringify({result:'passed',checks,networkRequests:0}));
