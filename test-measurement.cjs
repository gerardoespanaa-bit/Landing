// Optional browser integration. External destinations intercepted; never send test data to Google/WhatsApp.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {simulate}=require('./engine.js');
const root=__dirname,output=process.env.QA_OUTPUT;
if(output)fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const target=path.resolve(root,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
 if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(target,(error,data)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon'})[path.extname(target)]||'application/octet-stream');res.end(data);});
});
const business=page=>page.evaluate(()=>window.dataLayer.filter(e=>['simulator_open','simulator_complete','whatsapp_contact'].includes(e.event)));
const consentState=page=>page.evaluate(()=>{const state={};for(const e of window.dataLayer)if(e[0]==='consent')Object.assign(state,e[2]);return state;});
(async()=>{
 let browser;const errors=[],checks=[];
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+server.address().port+'/';
  browser=await chromium.launch({headless:true});
  for(const [label,viewport] of [['desktop',{width:1366,height:900}],['mobile',{width:390,height:844}]]){
   const ctx=await browser.newContext({viewport,reducedMotion:'reduce'});
   await ctx.route('**/*',route=>{
    const url=route.request().url();
    if(url.startsWith(base))return route.continue();
    if(url.includes('googletagmanager.com/gtm.js'))return route.fulfill({contentType:'application/javascript',body:'/* Isolated GTM fixture: no external tags or real collection */'});
    if(url.startsWith('https://wa.me/'))return route.fulfill({contentType:'text/html',body:'<p>WhatsApp destination intercepted for test</p>'});
    return route.abort();
   });
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'?utm_source=google&utm_medium=cpc&utm_campaign=ppr_mexico_15d&gclid=Cj0KCQ_SYNTHETIC_TEST_Abc123xyz456&email=private@example.invalid');
   assert.equal(await page.locator('#simulador').count(),0);assert.equal((await business(page)).length,0);
   await page.locator('#openMeasurementPreferences').click();await page.locator('#consentAnalytics').check();
   await page.getByRole('button',{name:'Ok: guardar las preferencias seleccionadas',exact:true}).click();
   let state=await consentState(page);assert.equal(state.analytics_storage,'granted');assert.equal(state.ad_storage,'denied');assert.equal(state.ad_personalization,'denied');
   await page.locator('[data-open-sim]').click();await page.waitForURL('**/simulador/**');
   assert.equal(new URL(page.url()).pathname,'/simulador/');assert(!page.url().includes('gclid='));assert(!page.url().includes('email='));assert(page.url().includes('utm_source=google'));
   assert.equal(await page.locator('script[src*="googletagmanager.com/gtm.js"]').count(),1);
   assert.equal((await business(page)).filter(e=>e.event==='simulator_open').length,1);
   assert.equal((await business(page))[0].button_location,'hero');
   assert.equal(await page.locator('#simulador').getAttribute('role'),null);
   state=await consentState(page);assert.equal(state.analytics_storage,'granted');assert.equal(state.ad_storage,'denied');
   await page.locator('#calculateButton').click();await page.waitForFunction(()=>!document.getElementById('projectionMetrics').hidden);
   const expected=simulate({edadActual:35,tipoPlan:'Deducible 151',plazo:25,periodicidad:'Mensual',isrPct:0,tasaRendimiento:.1,inflacion:0,udiValor:8.81,overrides:[24000]},30).at(-1).saldoTotal;
   const money=new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(expected);
   assert.equal(await page.locator('#retirementAmount').textContent(),money);
   assert.equal((await business(page)).filter(e=>e.event==='simulator_complete').length,1);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(output)await page.screenshot({path:path.join(output,'simulador-ruta-'+label+'.png'),fullPage:true});
   await page.locator('[data-measure-id="wa_simulator_results"]').click();assert.equal((await business(page)).filter(e=>e.event==='whatsapp_contact').length,0);
   const popupReady=page.waitForEvent('popup');await page.locator('#contactContinue').click();const popup=await popupReady;
   assert.equal((await business(page)).filter(e=>e.event==='whatsapp_contact').length,1);await popup.close();await page.locator('#closeContact').click();
   await page.locator('#measurementPreferences').click();await page.locator('#consentAdvertising').check();await page.getByRole('button',{name:'Ok: guardar las preferencias seleccionadas',exact:true}).click();
   state=await consentState(page);assert.equal(state.ad_storage,'granted');assert.equal(state.ad_personalization,'denied');
   await page.goto(base+'?utm_source=google&utm_medium=cpc&gclid=Cj0KCQ_SYNTHETIC_TEST_Abc123xyz456');await page.locator('[data-open-sim]').click();
   await page.waitForURL('**/simulador/**');assert(page.url().includes('gclid='));
   await page.locator('#measurementPreferences').click();await page.getByRole('button',{name:'Solo esenciales',exact:true}).click();
   state=await consentState(page);assert.equal(state.analytics_storage,'denied');assert.equal(state.ad_storage,'denied');assert.equal(state.ad_personalization,'denied');
   checks.push(label+': full page navigation, safe attribution, one event per action, unchanged projection, contact, consent and no horizontal overflow');
   await ctx.close();
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'passed',checks,errors,realGA4Delivery:false},null,2));
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
