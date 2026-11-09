'use strict';
// Same published engine and assumptions; only the annual scenario rate changes.
((root)=>{
 const engine=typeof module!=='undefined'&&module.exports?require('./engine.js').simulate:root.simulate;
 const tax=typeof module!=='undefined'&&module.exports?require('./projection-metrics.js').annualTaxReference:root.annualTaxReference;
 function validate(inputs){
  const {age,monthly,retire}=inputs||{};
  if(!Number.isInteger(age)||age<18||age>64||!Number.isInteger(retire)||retire<60||retire>90||!Number.isInteger(monthly)||monthly<2000||monthly>1000000)throw new RangeError('Revisa las edades y una aportación mensual entre $2,000 y $1,000,000.');
  if(retire<=age)throw new RangeError('La edad de retiro debe ser mayor que tu edad actual.');
  return {age,monthly,retire};
 }
 function scenario(inputs,rate,delayYears=0){
  const {age,monthly,retire}=validate(inputs),years=retire-age-delayYears;
  if(years===0)return {rate,amount:0,contributions:0,generated:0,rows:[],years:0,taxAnnual:tax(monthly)};
  const rows=engine({edadActual:age+delayYears,tipoPlan:'Deducible 151',plazo:Math.min(25,years),periodicidad:'Mensual',isrPct:0,tasaRendimiento:rate,inflacion:0,udiValor:8.81,overrides:[monthly*12]},years);
  if(rows.length!==years||rows.some(row=>!Number.isFinite(row.saldoTotal)||row.saldoTotal<=0))throw Error('No fue posible obtener una proyección válida.');
  const last=rows.at(-1),amount=last.saldoTotal,contributions=last.aportacionAcumulada;
  return {rate,amount,contributions,generated:amount-contributions,rows,years,taxAnnual:tax(monthly)};
 }
 function calculateFrom(inputs){
  const clean=validate(inputs);
  return {inputs:clean,from:scenario(clean,.08)};
 }
 function calculate(inputs){
  const clean=validate(inputs),from=scenario(clean,.08),to=scenario(clean,.12),delayed=scenario(clean,.12,1);
  return {inputs:clean,from,to,difference:to.amount-from.amount,delayCost:to.amount-delayed.amount,delayedAmount:delayed.amount};
 }
 const api=Object.freeze({validate,scenario,calculateFrom,calculate});
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ProjectionScenarios=api;
})(typeof window==='undefined'?globalThis:window);
