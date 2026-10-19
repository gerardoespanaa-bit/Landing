const assert=require('node:assert/strict');
const {annualTaxReference,PROJECTION_TAX_REFERENCE}=require('./projection-metrics.js');
assert.equal(annualTaxReference(2000),6000);
assert.equal(annualTaxReference(5000),15000);
assert(Math.abs(annualTaxReference(1000000)-53493.30)<.001);
assert.equal(annualTaxReference(1000000),annualTaxReference(20000));
assert.equal(PROJECTION_TAX_REFERENCE.year,2026);
for(const value of [0,1999,NaN,Infinity,'2000'])assert.throws(()=>annualTaxReference(value),RangeError);
console.log('Annual fiscal reference: default, contribution sensitivity, 5 UMA cap and invalid input checks passed.');
