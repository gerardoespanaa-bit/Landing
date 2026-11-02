'use strict';
(()=>{
 const links=[...document.querySelectorAll('[data-simulator-link]')];
 function update(){
  // Reuse the existing sanitized page metadata; never copy arbitrary URL values.
  const metadata=(window.dataLayer||[]).find(item=>item.measurement_id&&item.page_location);
  const permittedAds=window.LandingConsent?.getPreferences()?.advertising===true;
  for(const link of links){
   const target=new URL('simulador/',document.baseURI);
   try{const safe=new URL(metadata.page_location);
    if(safe.origin===target.origin)for(const [key,value] of safe.searchParams){
     if(key.startsWith('utm_')||permittedAds)target.searchParams.set(key,value);
    }
   }catch{}
   const source=link.dataset.measureLocation;
   if(['header','hero','footer'].includes(source))target.hash=source;
   link.href=target.href;
  }
 }
 update();window.addEventListener('landing:consent-change',update);
})();
