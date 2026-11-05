// Focused dock checks: geometry, one accessible CTA, shared action and lifecycle.
// No network, CRM records or advertising requests.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {placement}=require('./projection-unlock-dock.js');
const read=f=>fs.readFileSync(path.join(__dirname,f),'utf8');let checks=0;
function check(name,fn){fn();checks++;console.log('PASS '+name);}
const rect=(top,height=50)=>({top,bottom:top+height,left:40,width:680,height});
const place=(r,extra={})=>placement({rect:r,top:88,bottom:788,viewportWidth:800,enabled:true,blocked:false,...extra});
function runtime(){
 const state={rect:rect(1000),modal:false,width:800,height:800,header:76,noticeTop:500,noticeHeight:250,clicks:0},ids=new Map(),queue=new Map(),listeners={},docEvents={};let frame=0;
 function el(id){const attrs={},classes=new Set(),styles={setProperty(k,v){this[k]=v;},removeProperty(k){delete this[k];}};return{id,hidden:false,disabled:false,className:'btn btn-wa result-cta',textContent:'Ver hasta dónde puedo llegar',style:styles,dataset:{},handlers:{},classList:{add:k=>classes.add(k),remove:k=>classes.delete(k),contains:k=>classes.has(k),toggle(k,v){if(v)classes.add(k);else classes.delete(k);}},setAttribute(k,v){attrs[k]=v;},getAttribute:k=>attrs[k]??null,append(child){ids.set(child.id,child);},before(a){a.getBoundingClientRect=()=>state.rect;ids.set(a.id,a);},getBoundingClientRect:()=>state.rect,addEventListener(k,fn){this.handlers[k]=fn;},focus(){doc.activeElement=this;},getAnimations:()=>[{animationName:'ppr-action-pulse',currentTime:1250}]};}
 const original=el('unlockProjectionButton');ids.set(original.id,original);
 const header=el('header');header.getBoundingClientRect=()=>({bottom:state.header});
 const notice=el('measurementConsent');notice.hidden=true;notice.getBoundingClientRect=()=>({top:state.noticeTop,bottom:state.noticeTop+state.noticeHeight,height:state.noticeHeight});ids.set(notice.id,notice);
 const menu=el('menuToggle');ids.set(menu.id,menu);
 const doc={activeElement:null,documentElement:{get clientWidth(){return state.width;}},body:el('body'),createElement:()=>el(''),getElementById:id=>ids.get(id)||null,querySelector:s=>s==='dialog[open]'?(state.modal?{}:null):s==='.site-header'?header:null,addEventListener(k,fn){docEvents[k]=fn;}};
 const win={document:doc,get innerHeight(){return state.height;},getComputedStyle:()=>({font:'800 14px Arial',letterSpacing:'0px'}),requestAnimationFrame:fn=>{queue.set(++frame,fn);return frame;},addEventListener(k,fn){listeners[k]=fn;},ResizeObserver:class{constructor(fn){this.fn=fn;}observe(){}},MutationObserver:class{constructor(fn){state.notify=fn;}observe(){}}};
 vm.runInNewContext(read('projection-unlock-dock.js'),{window:win});
 const dock=win.ProjectionUnlockDock.mount(original,e=>{state.clicks++;state.source=e.currentTarget;});
 const proxy=ids.get('floatingUnlockProjectionButton');
 const flush=()=>{for(const fn of [...queue.values()]){queue.clear();fn();}};
 function update(r){if(r)state.rect=r;listeners.scroll();flush();}
 return{state,doc,original,proxy,notice,menu,dock,flush,update,click(){proxy.focus();proxy.handlers.click({currentTarget:proxy});}};
}
check('No dock before calculation, while blocked, or when there is insufficient room',()=>{
 assert.equal(place(rect(1000),{enabled:false}),null);assert.equal(place(rect(1000),{blocked:true}),null);assert.equal(place(rect(1000),{bottom:120}),null);assert.equal(place({...rect(1000),height:0}),null);
});
check('Bottom and top positions use the original width and valid viewport bounds',()=>{
 assert.deepEqual(place(rect(1000)),{edge:'bottom',top:738,left:40,width:680});assert.deepEqual(place(rect(-100)),{edge:'top',top:88,left:40,width:680});
});
check('Visible original replaces proxy at exactly the same natural edge position',()=>{
 assert.equal(place(rect(738)),null);assert.equal(place(rect(88)),null);assert.equal(place(rect(350)),null);assert.equal(place(rect(739)).top,738);assert.equal(place(rect(87)).top,88);
});
check('Narrow viewports clamp the proxy without horizontal overflow',()=>{
 const at=place({...rect(1000),left:0,width:1000},{viewportWidth:320});assert.equal(at.left,12);assert.equal(at.width,296);assert(at.left+at.width<=308);
});
check('One visible CTA throughout bottom, original, top, original, bottom',()=>{
 const t=runtime();assert(t.proxy.hidden);t.dock.setEnabled(true);t.flush();
 for(const [position,edge] of [[1000,'bottom'],[350,null],[-100,'top'],[350,null],[1000,'bottom']]){t.update(rect(position));assert.equal(t.proxy.hidden,edge===null);assert.equal(t.original.classList.contains('is-unlock-proxied'),edge!==null);if(edge)assert.equal(t.proxy.dataset.edge,edge);}
 assert.equal(t.proxy.textContent,t.original.textContent);assert.equal(t.proxy.getAttribute('aria-controls'),'projectionLeadDialog');assert.equal(t.proxy.style.animationDelay,'-1250ms');
});
check('Floating click calls the shared action once, without generating a second original click',()=>{
 const t=runtime();t.dock.setEnabled(true);t.flush();t.click();assert.equal(t.state.clicks,1);assert.equal(t.state.source,t.proxy);
});
check('Opening a dialog hides the proxy; closing restores its keyboard focus',()=>{
 const t=runtime();t.dock.setEnabled(true);t.flush();t.click();t.state.modal=true;t.state.notify();t.flush();assert(t.proxy.hidden);assert(!t.original.classList.contains('is-unlock-proxied'));
 t.state.modal=false;t.state.notify();t.flush();assert(!t.proxy.hidden);assert.equal(t.doc.activeElement,t.proxy);
});
check('Focus transfers to the original during handoff and back to the proxy',()=>{
 const t=runtime();t.dock.setEnabled(true);t.flush();t.proxy.focus();t.update(rect(350));assert.equal(t.doc.activeElement,t.original);t.update(rect(-100));assert.equal(t.doc.activeElement,t.proxy);
});
check('Consent notice is left unobstructed; preferences and expanded navigation hide the dock',()=>{
 const t=runtime();t.dock.setEnabled(true);t.notice.hidden=false;t.flush();assert.equal(t.proxy.style.top,'438px');assert(!t.doc.body.classList.contains('projection-dock-bottom'));
 t.menu.setAttribute('aria-expanded','true');t.update();assert(t.proxy.hidden);t.menu.setAttribute('aria-expanded','false');t.notice.hidden=true;t.update();assert(!t.proxy.hidden);
});
check('Invalidation, recalculation and existing-registration state cannot leave a stale action',()=>{
 const t=runtime();t.dock.setEnabled(true);t.flush();t.dock.setEnabled(false);assert(t.proxy.hidden);assert(t.proxy.disabled);assert(!t.original.classList.contains('is-unlock-proxied'));t.flush();assert(t.proxy.hidden);
 t.dock.setEnabled(true);t.original.hidden=true;t.flush();assert(t.proxy.hidden);
});
check('Public flow enables dock only after calculation, hides it for registered visitors and reuses the form source',()=>{
 for(const registered of [false,true]){
  const controls=new Map(),clicks=[],states=[];const get=id=>{if(!controls.has(id))controls.set(id,{handlers:{},addEventListener(k,fn){this.handlers[k]=fn;}});return controls.get(id);};
  const win={ProjectionState:{load:()=>registered?{name:'PRUEBA'}:null,save:()=>true},ProjectionUnlockDock:{mount:(original,show)=>{states.show=show;return{setEnabled:v=>states.push(v)};}},LandingLeadForms:{open:c=>clicks.push(c)}};
  vm.runInNewContext(read('projection-lead-ui.js'),{window:win,document:{getElementById:get,baseURI:'https://example.test/simulador/'},sessionStorage:{},URL,location:{assign(){}}});
  assert.equal(states.at(-1),false);win.ProjectionFlow.calculated({inputs:{age:35,retire:65,monthly:2000}});assert.equal(states.at(-1),!registered);
  if(!registered){states.show({preventDefault(){},currentTarget:{id:'floatingUnlockProjectionButton'}});assert.equal(clicks.length,1);assert.equal(clicks[0].buttonId,'simulator_range');assert.equal(clicks[0].kind,'simulation');}
  win.ProjectionFlow.invalidated();assert.equal(states.at(-1),false);
 }
});
check('Dock styling respects reduced motion, retains layout and avoids covering WhatsApp on mobile',()=>{
 const css=read('projection-unlock-dock.css');assert(css.includes('prefers-reduced-motion:reduce'));assert(css.includes('visibility:hidden'));assert(css.includes('projection-dock-bottom .wa-float'));
 const h=read('simulador/index.html');assert(h.includes('projection-unlock-dock.js?v=1'));assert(h.includes('projection-unlock-dock.css?v=1'));assert(!read('mi-proyeccion/index.html').includes('projection-unlock-dock.js'));
});
console.log(JSON.stringify({result:'passed',checks,networkRequests:0}));
