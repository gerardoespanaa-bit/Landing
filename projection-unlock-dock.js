'use strict';
((root)=>{
 // The original keeps its layout space; the proxy takes over only at an edge.
 function placement({rect,top,bottom,viewportWidth,enabled,blocked}){
  if(!enabled||blocked||!rect||![rect.top,rect.bottom,rect.left,rect.width,rect.height,top,bottom,viewportWidth].every(Number.isFinite)||rect.height<=0||rect.width<=0||bottom-top<rect.height)return null;
  if(rect.top>=top&&rect.bottom<=bottom)return null;
  const width=Math.min(rect.width,viewportWidth-24);if(width<=0)return null;
  return {edge:rect.top<top?'top':'bottom',top:rect.top<top?top:bottom-rect.height,left:Math.max(12,Math.min(rect.left,viewportWidth-12-width)),width};
 }
 function mount(original,onClick){
  const doc=root.document,anchor=doc.createElement('div'),proxy=doc.createElement('button');
  anchor.id='unlockProjectionAnchor';anchor.className='projection-unlock-anchor';original.before(anchor);anchor.append(original);
  proxy.id='floatingUnlockProjectionButton';proxy.type='button';proxy.className=original.className+' projection-unlock-float';proxy.textContent=original.textContent;proxy.hidden=true;proxy.disabled=true;
  proxy.setAttribute('aria-controls','projectionLeadDialog');proxy.setAttribute('aria-haspopup','dialog');doc.body.append(proxy);
  let enabled=false,queued=0,returnFocus=false;
  function hide(blocked=false){
   const focused=doc.activeElement===proxy;original.classList.remove('is-unlock-proxied');
   if(!proxy.hidden)proxy.hidden=true;
   doc.body.classList.remove('projection-dock-bottom');doc.body.style.removeProperty('--projection-dock-lift');
   if(focused&&!blocked&&!original.hidden&&!original.disabled)original.focus({preventScroll:true});
  }
  function render(){
   queued=0;
   const blocked=!!doc.querySelector('dialog[open]')||doc.getElementById('menuToggle')?.getAttribute('aria-expanded')==='true';
   const viewport=root.visualViewport,viewTop=viewport?.offsetTop||0,viewBottom=Math.min(root.innerHeight,viewTop+(viewport?.height||root.innerHeight));
   const headerBottom=doc.querySelector('.site-header')?.getBoundingClientRect().bottom||0;
   const notice=doc.getElementById('measurementConsent'),noticeRect=notice&&!notice.hidden?notice.getBoundingClientRect():null;
   const noticeVisible=!!noticeRect&&noticeRect.height>0&&noticeRect.top<viewBottom&&noticeRect.bottom>viewTop;
   const top=Math.max(viewTop,headerBottom)+12,bottom=Math.min(viewBottom-12,noticeVisible?noticeRect.top-12:viewBottom-12);
   const rect=anchor.getBoundingClientRect();
   const at=placement({rect,top,bottom,viewportWidth:doc.documentElement.clientWidth,enabled:enabled&&!original.hidden&&!original.disabled,blocked});
   if(!at){hide(blocked);if(returnFocus&&!blocked&&enabled&&!original.hidden){returnFocus=false;original.focus({preventScroll:true});}return;}
   const wasHidden=proxy.hidden,wasOriginalFocused=doc.activeElement===original;
   // Match the original's type and width; animation transforms never affect the anchor.
   const font=root.getComputedStyle(original);proxy.style.font=font.font;proxy.style.letterSpacing=font.letterSpacing;
   proxy.style.left=at.left+'px';proxy.style.top=at.top+'px';proxy.style.width=at.width+'px';proxy.dataset.edge=at.edge;
   if(wasHidden){const pulse=original.getAnimations?.().find(a=>a.animationName==='ppr-action-pulse');proxy.style.animationDelay=-(Number(pulse?.currentTime||0)%3000)+'ms';proxy.hidden=false;}
   original.classList.add('is-unlock-proxied');
   doc.body.classList.toggle('projection-dock-bottom',at.edge==='bottom'&&!noticeVisible);doc.body.style.setProperty('--projection-dock-lift',Math.max(0,root.innerHeight-at.top)+'px');
   if((wasOriginalFocused||returnFocus)&&!blocked){returnFocus=false;proxy.focus({preventScroll:true});}
  }
  function schedule(){if(!queued)queued=root.requestAnimationFrame(render);}
  proxy.addEventListener('click',event=>{if(!enabled||proxy.hidden)return;returnFocus=true;onClick(event);});
  root.addEventListener('scroll',schedule,{passive:true});root.addEventListener('resize',schedule);
  root.visualViewport?.addEventListener('resize',schedule);root.visualViewport?.addEventListener('scroll',schedule);
  doc.addEventListener('close',schedule,true);doc.addEventListener('toggle',schedule,true);
  if(root.ResizeObserver){const resize=new root.ResizeObserver(schedule);for(const el of [anchor,doc.querySelector('.site-header'),doc.getElementById('measurementConsent')])if(el)resize.observe(el);}
  if(root.MutationObserver)new root.MutationObserver(schedule).observe(doc.body,{subtree:true,attributes:true,attributeFilter:['open','hidden','disabled','aria-expanded']});
  return Object.freeze({setEnabled(value){enabled=value===true;proxy.disabled=!enabled;if(!enabled)hide(!!doc.querySelector('dialog[open]'));schedule();}});
 }
 const api=Object.freeze({placement,mount});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ProjectionUnlockDock=api;
})(typeof window==='undefined'?globalThis:window);
