'use strict';
// INEGI UMA 2026 annual value; reference year is explicit in projection details.
// https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2026/uma/uma2026.pdf
const PROJECTION_TAX_REFERENCE=Object.freeze({year:2026,annualUMA:42794.64,isrRate:.25});
function annualTaxReference(monthly){
 if(!Number.isFinite(monthly)||monthly<2000||monthly>1000000)throw new RangeError('Aportación mensual inválida');
 // Assumes sufficient taxable income for the 10% limit; no personal refund is inferred.
 return Math.min(monthly*12,5*PROJECTION_TAX_REFERENCE.annualUMA)*PROJECTION_TAX_REFERENCE.isrRate;
}
if(typeof module!=='undefined')module.exports={annualTaxReference,PROJECTION_TAX_REFERENCE};
