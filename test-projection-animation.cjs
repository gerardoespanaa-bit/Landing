// Focused checks for the public dummy counter and the post-registration chart.
// No network, production tags, real contacts or WhatsApp messages.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const core=require('./projection-scenarios.js'),lead=require('./hubspot-submission.js');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');
const inputs={age:35,retire:65,monthly:2000};
let checks=0;function check(name,fn){fn();checks++;console.log('PASS '+name);}
function runtime({full=false,width=640,reduced=false}={}){
 const elements=new Map(),queue=new Map(),strokes=[],events=[],calls=[];let tick=0;
 class El{
  constructor(id){this.id=id;this.handlers={};this.attrs={};this.hidden=true;this.disabled=false;this.textContent='';this.clientWidth=width;this.clientHeight=200;this.value='';this.min='';this.max='';this.validity={};this.style={setProperty(){}};this.classList={add(){},remove(){}};this.children=[];}
  get valueAsNumber(){return this.value===''?NaN:Number(this.value);}
  addEventListener(name,fn){(this.handlers[name]??=[]).push(fn);}
  fire(name){for(const fn of this.handlers[name]||[])fn({preventDefault(){}});}
  setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k]??null;}
  append(...xs){this.children.push(...xs);}replaceChildren(...xs){this.children=xs;}
  focus(){}scrollIntoView(){}getBoundingClientRect(){return {height:76,top:150};}
 }
 const get=id=>{if(!elements.has(id))elements.set(id,new El(id));return elements.get(id);};
 for(const [id,value,min,max] of [['ageNow',35,18,64],['ageRetirement',65,65,90],['monthlyContribution',2000,2000,1000000]])Object.assign(get(id),{value:String(value),min:String(min),max:String(max)});
 let points=[];const ctx={scale(){},measureText:t=>({width:t.length*6}),beginPath(){points=[];},moveTo(x,y){points.push([x,y]);},lineTo(x,y){points.push([x,y]);},stroke(){strokes.push({color:this.strokeStyle,points:points.slice()});},fillText(){},fillRect(){},save(){},restore(){},rect(){},clip(){}};
 get('miniGrowthChart').getContext=()=>ctx;
 const doc={getElementById:get,body:{dataset:{projectionFull:String(full)}},querySelector:s=>get(s),querySelectorAll:()=>[],createElement:()=>new El(''),createDocumentFragment:()=>new El('')};
 const api={...core,calculateFrom:i=>{calls.push('from');return core.calculateFrom(i);},calculate:i=>{calls.push('both');return core.calculate(i);}};
 const win={ProjectionScenarios:api,devicePixelRatio:1,addEventListener(){},scrollTo(){},scrollY:0,LandingMeasurement:{track:(...v)=>events.push(v)}};
 vm.runInNewContext(read('simulator.js'),{window:win,document:doc,Intl,Map,Number,Object,Array,Math,Date,location:{hash:''},performance:{now:()=>0},matchMedia:q=>({matches:q.includes('reduced-motion')?reduced:false}),requestAnimationFrame:fn=>{queue.set(++tick,fn);return tick;},cancelAnimationFrame:id=>queue.delete(id),setTimeout:()=>1,clearTimeout(){}});
 function frame(time){const pending=[...queue.values()];queue.clear();strokes.length=0;for(const fn of pending)fn(time);}
 return {win,get,calls,events,strokes,frame,submit(){get('retirementForm').fire('submit');},input(id,value){get(id).value=String(value);get('retirementForm').fire('input');}};
}
const number=el=>Number(el.textContent.replace(/[^0-9.-]/g,''));
check('Public scenario calculates 8% only; has no upper rows, amount or delayed scenario',()=>{
 const rates=[];const w={simulate:(p,years)=>{rates.push(p.tasaRendimiento);return Array.from({length:years},(_,i)=>({saldoTotal:(i+1)*100,aportacionAcumulada:(i+1)*50}));},annualTaxReference:()=>6000};
 vm.runInNewContext(read('projection-scenarios.js'),{window:w});
 const r=w.ProjectionScenarios.calculateFrom(inputs);assert.deepEqual(rates,[.08]);assert.equal(r.to,undefined);assert.equal(r.delayedAmount,undefined);
 assert.equal(r.from.rows.length,30);assert.equal(core.calculateFrom(inputs).from.amount,core.calculate(inputs).from.amount);
});
for(const width of [340,640]){
 check('Public dummy grows alongside the lower amount, never draws 12%, width '+width,()=>{
  const t=runtime({width});t.submit();const lower=[],masked=[];
  for(const time of [0,1000,2000,3000,4000]){t.frame(time);lower.push(number(t.get('retirementAmount')));masked.push(number(t.get('upperProjectionPlaceholder')));assert(!t.strokes.some(s=>s.color==='#4c8ff5'));}
  assert.deepEqual(t.calls,['from']);assert(lower.every((v,i)=>!i||v>=lower[i-1]));assert(masked.every((v,i)=>!i||v>=masked[i-1]));assert(new Set(masked).size>3);assert.equal(masked.at(-1),99999999);
  assert.equal(t.win.ProjectionCalculator.current().to,undefined);assert(!t.get('chartSummary').textContent.includes('$3,557,580'));assert.equal(t.events.filter(e=>e[0]==='simulator_complete').length,1);
 });
 check('Full chart uses the same axes for both curves and animates both amounts, width '+width,()=>{
  const t=runtime({full:true,width});t.win.ProjectionCalculator.refresh({animate:true});
  t.frame(1000);const lower=number(t.get('retirementAmount')),upper=number(t.get('upperProjectionAmount'));
  assert(lower>0&&lower<1757778);assert(upper>lower&&upper<3557580);
  const a=t.strokes.find(s=>s.color==='#a7d9ff'),b=t.strokes.find(s=>s.color==='#4c8ff5');assert(a&&b);assert.deepEqual(a.points[0],b.points[0]);assert.equal(a.points.at(-1)[0],b.points.at(-1)[0]);assert(b.points.at(-1)[1]<a.points.at(-1)[1]);
  t.frame(4000);assert.equal(number(t.get('retirementAmount')),1757778);assert.equal(number(t.get('upperProjectionAmount')),3557580);assert(t.get('chartSummary').textContent.includes('al 12%'));assert.equal(t.events.filter(e=>e[0]==='simulator_complete').length,0);
  t.input('monthlyContribution',3000);assert.equal(number(t.get('upperProjectionAmount')),5553859);assert.equal(t.get('resultPanel').hidden,false);
 });
}
check('Reduced motion completes the public counter without running an animation loop',()=>{
 const t=runtime({reduced:true});t.submit();t.frame(0);assert.equal(number(t.get('upperProjectionPlaceholder')),99999999);assert.equal(t.get('resultPanel').getAttribute('aria-busy'),'false');
});
check('Invalid inputs never calculate either scenario',()=>{
 const t=runtime();t.get('monthlyContribution').value='1000';t.submit();assert.equal(t.calls.length,0);
});
check('CRM payload accepts inputs-only projection and omits both monetary results',()=>{
 const config={fields:Object.fromEntries(['name','phone','source','consent','age','retire','monthly','simulatedAt','gclid','utm'].map(k=>[k,k]))};
 const p=lead.buildPayload({config,contact:{name:'PRUEBA AISLADA',phone:'0000000000'},projection:{inputs,simulatedAt:Date.now()},campaign:{},pageUri:'https://example.test/simulador/'});
 const f=Object.fromEntries(p.fields.map(x=>[x.name,x.value]));assert.equal(f.age,'35');assert.equal(f.retire,'65');assert.equal(f.monthly,'2000');assert(!('result8'in f));assert(!('result12'in f));assert.equal(p.legalConsentOptions.consent.consentToProcess,true);
});
check('Public DOM has only a fictitious hidden placeholder; upper legend exists only on results',()=>{
 const a=read('simulador/index.html'),b=read('mi-proyeccion/index.html');assert(a.includes('aria-hidden="true">$99,999,999'));assert(!a.includes('upper-balance-key'));assert(b.includes('upper-balance-key'));for(const h of [a,b]){const legend=h.match(/<div class="projection-legend"[^>]*>([\s\S]*?)<\/div>/)[1];assert(legend.includes('Tendrías desde'));assert(!/%|escenario|conservador/i.test(legend));}assert(b.includes('Podrías llegar hasta</span>'));
});
check('Published financial engine and tax helper remain byte-for-byte unchanged',()=>{
 const previous=path.resolve(__dirname,'../../../cambios-simulador-04-nov/implementacion/landing');
 for(const f of ['engine.js','projection-metrics.js'])assert.deepEqual(fs.readFileSync(path.join(__dirname,f)),fs.readFileSync(path.join(previous,f)));
});
console.log(JSON.stringify({result:'passed',checks,networkRequests:0}));
