// Browser integration tests. Real Google/WhatsApp destinations are intercepted.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const {simulate}=require('./engine.js');
const {annualTaxReference}=require('./projection-metrics.js');
const root=__dirname,output=process.env.QA_OUTPUT;
if(output)fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
 const target=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(target,(error,data)=>{if(error){res.writeHead(404).end();return;}const ext=path.extname(target);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon'})[ext]||'application/octet-stream');res.end(data);});
});
const fakeConfig={enabled:true,privacyApproved:true,gtmContainerId:'GTM-TESTONLY',ga4MeasurementId:'G-TESTONLY'};
// These deliberately synthetic IDs exist only in an intercepted test response.
const report={mode:'local, mocked container; no Google verification',checks:[],errors:[],events:[]};
const business=page=>page.evaluate(()=>Array.from(window.dataLayer||[]).filter(e=>['simulator_open','simulator_complete','whatsapp_contact'].includes(e.event)));
const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port+'/';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{channel:'chrome'})});
 const contexts=[];
 async function context(config,options={}){
  const ctx=await browser.newContext({viewport:{width:1366,height:768},locale:'en-US',reducedMotion:'reduce',...options});contexts.push(ctx);
  const requests=[];
  await ctx.route('**/*',route=>{
   const url=route.request().url();
   if(url.startsWith(base)&&url.includes('/measurement-config.js')&&config!==undefined)return route.fulfill({contentType:'application/javascript',body:'window.LANDING_MEASUREMENT_CONFIG='+JSON.stringify(config)});
   if(url.startsWith('https://www.googletagmanager.com/')){requests.push(url);return route.fulfill({contentType:'application/javascript',body:'/* test stub: no actual container or analytics */'});}
   if(/google-analytics\.com|analytics\.google\.com|wa\.me|api\.whatsapp\.com/.test(url))return route.abort();
   return route.continue();
  });
  ctx.on('page',page=>page.on('pageerror',error=>report.errors.push(error.message)));
  return {ctx,requests};
 }
 try{
  const off=await context(),offPage=await off.ctx.newPage();await offPage.goto(base);
  assert(await offPage.locator('#measurementConsent').isHidden());assert(await offPage.locator('#measurementPreferences').isHidden());
  await offPage.locator('[data-open-sim]').click();await offPage.locator('#calculateButton').click();await offPage.waitForFunction(()=>!document.getElementById('calculateButton').disabled);
  assert.equal(await offPage.locator('#retirementAmount').textContent(),'$2,485,511');assert.equal(await offPage.evaluate(()=>typeof window.dataLayer),'undefined');assert.equal(off.requests.length,0);
  await offPage.keyboard.press('Escape');assert.equal(await offPage.locator('footer a[href="aviso-de-privacidad.html"]').count(),1);
  await offPage.locator('[data-wa="general"]').first().click();assert(await offPage.locator('#contactDialog a[href="aviso-de-privacidad.html"]').isVisible());await offPage.locator('#closeContact').click();
  report.checks.push('Shipped empty IDs: no loader, layer, banner or measurement; calculator and privacy links work');
  for(const invalid of [{...fakeConfig,gtmContainerId:''},{...fakeConfig,ga4MeasurementId:'bad'},{...fakeConfig,privacyApproved:false},{...fakeConfig,enabled:false}]){
   const test=await context(invalid),page=await test.ctx.newPage();await page.goto(base);assert(await page.locator('#measurementConsent').isHidden());assert.equal(test.requests.length,0);assert.equal(await page.evaluate(()=>window.LandingMeasurement.track('simulator_open','retiro','hero')),false);
  }
  report.checks.push('Each activation gate independently blocks tracking');
  const on=await context(fakeConfig),page=await on.ctx.newPage();await page.goto(base+'?email=PRIVATE_TEST_EMAIL#PRIVATE_TEST_FRAGMENT');
  assert(await page.locator('#measurementConsent').isVisible());assert.equal(on.requests.length,0);
  await page.locator('[data-open-sim]').click();assert.deepEqual(await business(page),[]);await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Rechazar',exact:true}).click();assert.equal(on.requests.length,0);assert.equal(await page.evaluate(()=>typeof window.dataLayer),'undefined');
  await page.reload();assert(await page.locator('#measurementConsent').isHidden());assert.equal(on.requests.length,0);
  await page.getByRole('button',{name:'Preferencias de medición',exact:true}).click();await page.getByRole('button',{name:'Aceptar analítica',exact:true}).click();await page.waitForFunction(()=>document.getElementById('landing-gtm'));
  assert.equal(on.requests.length,1);assert.equal(await page.locator('#landing-gtm').count(),1);
  await page.addScriptTag({path:path.join(root,'measurement.js')});assert.equal(await page.locator('#landing-gtm').count(),1);
  const initial=await page.evaluate(()=>JSON.parse(JSON.stringify(window.dataLayer)));assert.equal(initial.filter(e=>e.event==='landing_page_view').length,1);assert(initial.some(e=>e.page_location===base));
  assert(initial.filter(e=>e[0]==='consent').every(e=>e[2].ad_storage==='denied'&&e[2].ad_user_data==='denied'&&e[2].ad_personalization==='denied'));
  report.checks.push('No pre-consent queue; reject persists; accept loads once; repeated script is idempotent; ad consent stays denied');
  await page.locator('[data-open-sim]').click();assert.equal((await business(page)).length,1);
  await page.locator('#ageNow').fill('17');await page.locator('#calculateButton').click();assert.equal((await business(page)).filter(e=>e.event==='simulator_complete').length,0);assert((await page.locator('#ageNotice').textContent()).includes('18 años'));
  for(const [age,monthly,retire] of [[35,2000,65],[18,2000,65],[64,2000,65],[40,5000,70],[18,1000000,90]]){
   await page.locator('#ageNow').fill(String(age));await page.locator('#monthlyContribution').fill(String(monthly));await page.locator('#ageRetirement').fill(String(retire));
   const before=(await business(page)).length;await page.locator('#calculateButton').click();await page.waitForFunction(()=>!document.getElementById('calculateButton').disabled);
   const years=retire-age,rows=simulate({edadActual:age,tipoPlan:'Deducible 151',plazo:Math.min(25,years),periodicidad:'Mensual',isrPct:0,tasaRendimiento:.1,inflacion:0,udiValor:8.81,overrides:[monthly*12]},years);
   assert.equal(await page.locator('#retirementAmount').textContent(),money(rows.at(-1).saldoTotal));assert.equal(await page.locator('#metricYears').textContent(),years===1?'1 año':years+' años');assert.equal(await page.locator('#metricTax').textContent(),money(annualTaxReference(monthly)));assert.equal((await business(page)).length,before+1);
   await page.setViewportSize({width:1365,height:768});await page.setViewportSize({width:1366,height:768});assert.equal((await business(page)).length,before+1);
  }
  report.checks.push('Five unchanged financial scenarios, singular/plural, invalid input excluded, one completion per calculation and none on resize');
  await page.keyboard.press('Escape');
  for(const selector of ['.nav-links a[href="#simulador"]','footer a[href="#simulador"]']){const before=(await business(page)).length;await page.locator(selector).click();assert.equal((await business(page)).length,before+1);await page.keyboard.press('Escape');}
  const triggers=page.locator('[data-wa]');
  for(let i=0;i<await triggers.count();i++){
   const trigger=triggers.nth(i),service=await trigger.getAttribute('data-wa'),location=await trigger.getAttribute('data-measure-location');
   if(service==='simulador'){await page.locator('[data-open-sim]').click();await page.locator('#calculateButton').click();await page.waitForFunction(()=>!document.getElementById('calculateButton').disabled);}
   const before=(await business(page)).filter(e=>e.event==='whatsapp_contact').length;
   await trigger.click();assert.equal((await business(page)).filter(e=>e.event==='whatsapp_contact').length,before);
   if(service==='seguros'){await page.locator('#contactContinue').dispatchEvent('click');assert.equal((await business(page)).filter(e=>e.event==='whatsapp_contact').length,before);await page.getByLabel('Vida',{exact:true}).check();}
   await page.locator('#contactMessage').fill('PRIVATE_TEST_MESSAGE phone 4423777762 name TEST_PERSON');
   assert(new URL(await page.locator('#contactContinue').getAttribute('href')).searchParams.get('text').includes('PRIVATE_TEST_MESSAGE'));
   // Two synchronous click activations exercise dedup without sending a message.
   await page.locator('#contactContinue').evaluate(el=>{el.addEventListener('click',e=>e.preventDefault(),{capture:true});el.click();el.click();});
   const wa=(await business(page)).filter(e=>e.event==='whatsapp_contact');assert.equal(wa.length,before+1);assert.deepEqual(wa.at(-1),{event:'whatsapp_contact',service:service==='simulador'?'retiro':service,button_location:location});
   await page.locator('#closeContact').click();if(service==='simulador')await page.keyboard.press('Escape');
   // A new dialog can be opened immediately for a distinct service.
  }
  for(const location of ['header','about']){
   const before=(await business(page)).length;await page.locator(`[data-wa-social][data-measure-location="${location}"]`).evaluate(el=>{el.addEventListener('click',e=>e.preventDefault(),{capture:true});el.click();el.click();});assert.equal((await business(page)).length,before+1);
  }
  const layer=await page.evaluate(()=>JSON.parse(JSON.stringify(window.dataLayer))),serialized=JSON.stringify(layer);
  for(const secret of ['PRIVATE_TEST','4423777762','wa.me','email=','TEST_PERSON'])assert(!serialized.includes(secret));
  report.events=await business(page);assert(report.events.every(e=>Object.keys(e).sort().join(',')==='button_location,event,service'));
  assert.equal(await page.evaluate(()=>window.LandingMeasurement.track('arbitrary_event','general','header')),false);assert.equal(await page.evaluate(()=>window.LandingMeasurement.track('whatsapp_contact','private_message','header')),false);
  report.checks.push('All nine CTAs and two social links: service/location, no dialog-open conversion, blocked insurance excluded, duplicate click suppressed, no private test values in dataLayer');
  await page.context().addCookies([{name:'_ga',value:'test',url:base}]);
  const requestsBefore=on.requests.length;await page.locator('#measurementPreferences').click();await Promise.all([page.waitForEvent('domcontentloaded'),page.getByRole('button',{name:'Rechazar',exact:true}).click()]);
  assert.equal(on.requests.length,requestsBefore);assert.equal(await page.evaluate(()=>typeof window.dataLayer),'undefined');assert(!(await page.context().cookies()).some(c=>c.name==='_ga'));report.checks.push('Revocation reload blocks loader and clears test GA cookie');
  await page.goto(base+'aviso-de-privacidad.html');assert((await page.locator('h1').textContent()).includes('Aviso'));assert((await page.locator('main').textContent()).includes('Gerardo López España'));assert.equal(await page.locator('a[href="mailto:gerardoespanaa@gmail.com"]').count(),1);assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,nofollow');
  const mobile=await context(undefined,{viewport:{width:390,height:844}}),mp=await mobile.ctx.newPage();await mp.goto(base);assert(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await mp.locator('[data-wa="auto"]').click();assert(await mp.locator('#contactDialog a[href="aviso-de-privacidad.html"]').isVisible());
  if(output)await mp.screenshot({path:path.join(output,'contacto-movil.png')});await mp.locator('#closeContact').click();await mp.goto(base+'aviso-de-privacidad.html');assert(await mp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(output)await mp.screenshot({path:path.join(output,'aviso-movil.png'),fullPage:true});
  report.checks.push('Privacy draft/confirmed identity/email and mobile contact/notice navigation without horizontal overflow');
  // Real motion: cancellation sends no completion; final pop sends exactly one.
  const motion=await context(fakeConfig,{reducedMotion:'no-preference'}),anim=await motion.ctx.newPage();await anim.goto(base);await anim.getByRole('button',{name:'Aceptar analítica',exact:true}).click();await anim.locator('[data-open-sim]').click();await anim.locator('#calculateButton').click();await anim.waitForTimeout(150);await anim.keyboard.press('Escape');await anim.waitForTimeout(100);assert.equal((await business(anim)).filter(e=>e.event==='simulator_complete').length,0);await anim.locator('[data-open-sim]').click();await anim.locator('#calculateButton').click();await anim.waitForSelector('.amount-pop');assert.equal(await anim.locator('.confetti-piece').count(),24);assert.equal((await business(anim)).filter(e=>e.event==='simulator_complete').length,1);await anim.waitForTimeout(1300);assert.equal(await anim.locator('.confetti-piece').count(),0);
  report.checks.push('Interrupted animation not counted; real final animation counted once; 24 confetti particles cleaned');
  assert.deepEqual(report.errors,[]);report.result='passed';console.log(JSON.stringify({result:report.result,checks:report.checks,events:report.events.length},null,2));
 }finally{for(const ctx of contexts)await ctx.close();await browser.close();await new Promise(resolve=>server.close(resolve));if(output)fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(report,null,2));}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
