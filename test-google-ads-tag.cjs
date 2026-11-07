// Offline checks only: no Google requests, browser sessions or campaign changes.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {boot,record,lastState,expectState}=require('./test-consent-init.cjs');
const read=p=>fs.readFileSync(path.join(__dirname,p),'utf8');
const snippet=`<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=AW-18527900519"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'AW-18527900519');
</script>`;
const pages=['index.html','simulador/index.html','mi-proyeccion/index.html','aviso-de-privacidad.html'];
const inline=snippet.match(/<script>\n([\s\S]*?)<\/script>/)[1];
let checks=0;
function check(value,message){assert.ok(value,message);checks++;}
for(const file of pages){
 const html=read(file),start=html.indexOf(snippet);
 check(start>=0&&start===html.lastIndexOf(snippet),'Exact supplied snippet appears once: '+file);
 check(start>html.indexOf('<head>')&&start<html.indexOf('</head>'),'Snippet is inside the head');
 check(html.indexOf("command('consent','default'")<start&&html.indexOf('measurement-init.js?v=7')<start,'Consent and privacy defaults precede the async loader');
 check(!/GTM-|gtm\.js|ns\.html|Google Tag Manager|G-VSNRQ7H8JL/.test(html),'No container, noscript or old analytics destination remains');
 const external=[...html.matchAll(/<script\b[^>]*src="(https?:[^"]+)"/g)].map(m=>m[1]);
 check(external.length===1&&external[0]==='https://www.googletagmanager.com/gtag/js?id=AW-18527900519','The only external Google script is the authorized Ads tag');
 const pathname=file==='index.html'?'/':file.replace('index.html','');
 for(const saved of [undefined,record(false,false),record(true,false),record(false,true),record(true,true)]){
  const state=boot({saved,pathname}),layer=state.win.dataLayer,before=JSON.stringify(lastState(state));
  // Model the browser global dataLayer while keeping the existing test harness isolated.
  state.context.dataLayer=layer;
  vm.runInContext(inline,state.context);
  check(state.win.dataLayer===layer,'The snippet reuses the consent/dataLayer queue');
  check(JSON.stringify(lastState(state))===before,'Configuring Ads does not grant or change consent');
  const configs=layer.filter(command=>command[0]==='config');
  check(configs.length===1&&configs[0][1]==='AW-18527900519','Only the requested Ads destination is configured');
  expectState(state,saved?.analytics===true,saved?.advertising===true);
  check(layer.filter(command=>command[0]==='consent').every(command=>command[2].ad_personalization==='denied'),'Personalization stays denied');
  state.win.LandingConsent.choose({analytics:false,advertising:false});expectState(state,false,false);
 }
 if(process.argv[2]){
  const previous=fs.readFileSync(path.join(path.resolve(process.argv[2]),file),'utf8');
  const firstScript=h=>h.match(/<head>[\s\S]*?<script>([\s\S]*?)<\/script>/)[1];
  check(firstScript(html)===firstScript(previous),'The first consent/access-guard script is unchanged: '+file);
  if(file!=='aviso-de-privacidad.html')check(html.match(/<main\b[\s\S]*?<\/main>/)[0]===previous.match(/<main\b[\s\S]*?<\/main>/)[0],'Visible main content and simulator stay unchanged: '+file);
 }
}
console.log(JSON.stringify({result:'passed',checks,pages:pages.length,networkRequests:0,realGoogleDelivery:false}));
