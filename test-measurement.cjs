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
// Mock HubSpot accepts only in this test; all non-local network destinations are intercepted.
const {calculate}=require('./projection-scenarios.js');
(async()=>{
 let browser;const errors=[],checks=[];
 try{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port+'/';
  browser=await chromium.launch({headless:true});
  for(const [label,viewport] of [['desktop',{width:1366,height:900}],['mobile',{width:390,height:844}]]){
   const ctx=await browser.newContext({viewport,reducedMotion:'reduce'});let posts=0,captured;
   await ctx.route('**/*',route=>{const url=route.request().url();
    if(url.startsWith(base))return route.continue();
    if(url.startsWith('https://api.hsforms.com/submissions/v3/integration/submit/')){posts++;captured=route.request().postDataJSON();return route.fulfill({status:posts===1?500:200,contentType:'application/json',body:JSON.stringify(posts===1?{errors:['mock transient failure']}:{inlineMessage:'Guardado'})});}
    if(url.includes('googletagmanager.com/gtm.js'))return route.fulfill({contentType:'application/javascript',body:'/* No real Google tags in integration QA */'});
    if(url.startsWith('https://wa.me/'))return route.fulfill({contentType:'text/html',body:'<p>WhatsApp destination intercepted</p>'});
    return route.abort();
   });
   const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'mi-proyeccion/');await page.waitForURL('**/simulador/');assert.equal(await page.locator('#upperProjectionAmount').count(),0);
   await page.locator('#openMeasurementPreferences').click();await page.getByRole('button',{name:'Solo esenciales',exact:true}).click();
   await page.locator('#calculateButton').click();await page.waitForFunction(()=>!document.getElementById('projectionMetrics').hidden);
   const expected=calculate({age:35,retire:65,monthly:2000});
   assert.equal(await page.locator('#retirementAmount').textContent(),new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(expected.from.amount));
   assert.equal(await page.locator('#upperProjectionPlaceholder').textContent(),'$99,999,999');assert(!(await page.locator('main').innerText()).includes(String(expected.to.amount)));
   await page.locator('#unlockProjectionButton').click();await page.locator('#projectionLeadName').fill('PRUEBA CRM NO ES PROSPECTO');await page.locator('#projectionLeadPhone').fill('123');await page.locator('#projectionLeadContinue').click();assert.equal(posts,0);
   await page.locator('#projectionLeadPhone').fill('0000000000');await page.locator('#projectionLeadContinue').click();assert.equal(posts,0);
   await page.locator('#projectionLeadConsent').check();await page.locator('#projectionLeadContinue').click();await page.waitForFunction(()=>document.getElementById('projectionLeadStatus').textContent.includes('No pudimos'));assert.equal(new URL(page.url()).pathname,'/simulador/');
   await page.locator('#projectionLeadContinue').click();await page.waitForURL('**/mi-proyeccion/');assert.equal(posts,2);assert.equal(captured.fields.length,12);assert(captured.legalConsentOptions.consent.consentToProcess);assert(!captured.context.pageUri.includes('?'));assert.equal(new URL(page.url()).search,'');
   const money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);
   assert.equal(await page.locator('#upperProjectionAmount').textContent(),money(expected.to.amount));assert.equal(await page.locator('#projectionDifference').count(),0);
   await page.locator('#monthlyContribution').fill('5000');await page.waitForFunction(()=>document.getElementById('metricContributions').textContent.includes('1,800,000'));assert.equal(posts,2);
   assert.equal(await page.locator('#upperProjectionAmount').textContent(),money(calculate({age:35,retire:65,monthly:5000}).to.amount));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(output)await page.screenshot({path:path.join(output,'proyeccion-registro-'+label+'.png'),fullPage:true});
   await page.goto(base+'simulador/');assert(await page.locator('#completeProjectionLink').isVisible());assert.equal(await page.locator('#projectionLeadDialog').evaluate(el=>el.open),false);await page.locator('#completeProjectionLink').click();await page.waitForURL('**/mi-proyeccion/');assert.equal(posts,2);
   checks.push(label+': direct access denied, form validation and consent, server failure and retry, clean redirect, two scenarios, instant recalculation and unlocked return without another submission');
   await ctx.close();
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({result:'passed',checks,errors,realHubSpot:false,realGA4Delivery:false},null,2));
 }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
