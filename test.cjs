const assert=require('node:assert/strict');
const {simulate}=require('./engine.js');
for(const [age,monthly,retire] of [[18,2000,65],[35,2000,65],[64,2000,65],[40,5000,70],[18,1000000,90]]){
 const years=retire-age;
 const inputs={edadActual:age,tipoPlan:'Deducible 151',plazo:Math.min(25,years),periodicidad:'Mensual',isrPct:0,tasaRendimiento:.1,inflacion:0,udiValor:8.81,overrides:[monthly*12]};
 const rows=simulate(inputs,years);assert.equal(rows.length,years);assert.equal(rows.at(-1).edad,retire);assert.equal(rows.at(-1).aportacionAcumulada,monthly*12*years);
 assert(rows.every(r=>Number.isFinite(r.saldoTotal)&&r.saldoTotal>0));
 assert(rows.every(r=>r.beneficioAno===0));
 assert(simulate({...inputs,overrides:[monthly*24]},years).at(-1).saldoTotal>rows.at(-1).saldoTotal);
 console.log({age,monthly,retire,balance:rows.at(-1).saldoTotal});
}
// Independently reproduce the first year: all contributions enter SI, with
// initial, quarterly administration and monthly management charges; no bonus
// for a one-year horizon. This detects accidental replacement by compound FV.
let balance=0;const rate=1.1**(1/12)-1;
for(let m=1;m<=12;m++){balance=(balance+2000)*(1+rate)-(m===1?500:0);if(m%3===0)balance*=1-.015*1.16;balance*=1-.001*1.16;}
const first=simulate({edadActual:64,tipoPlan:'Deducible 151',plazo:1,periodicidad:'Mensual',isrPct:0,tasaRendimiento:.1,inflacion:0,udiValor:8.81,overrides:[24000]},1)[0];
assert(Math.abs(first.saldoTotal-balance)<1e-8);
console.log('Financial engine checks passed.');
