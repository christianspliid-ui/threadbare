// Verify intervention cost calculation

console.log('Test 1: faction targeting, mind sphere');
const baseCost1 = 2;
const alignmentFactor1 = 1.5;
const tierModifier1 = 2.0; // faction = 2.0
const finalCost1 = baseCost1 * alignmentFactor1 * tierModifier1;
console.log('  finalCost = ', baseCost1, ' × ', alignmentFactor1, ' × ', tierModifier1, ' =', finalCost1);
console.log('  pool.force = 50, finalCost = ', finalCost1);
console.log('  affordable?', 50 >= finalCost1);

console.log('\nTest 2: individual targeting, mind sphere');
const baseCost2 = 3;
const alignmentFactor2 = 2.0;
const tierModifier2 = 1.0; // individual = 1.0
const finalCost2 = baseCost2 * alignmentFactor2 * tierModifier2;
console.log('  finalCost =', baseCost2, ' × ', alignmentFactor2, ' × ', tierModifier2, ' =', finalCost2);
console.log('  pool.mind = 2, finalCost = ', finalCost2);
console.log('  affordable?', 2 >= finalCost2);
