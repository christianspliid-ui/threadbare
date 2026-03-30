// Verify alignment calculations manually

const profile = {
  ambition_contentment: 0.8,
  courage_prudence: 0.6,
  cruelty_compassion: -0.5,
  cunning_honesty: -0.3,
  devotion_independence: 0.2,
  loyalty_treachery: 0.4,
  tradition_innovation: -0.1,
  dominance_humility: 0.3,
  wrath_patience: -0.2,
  greed_generosity: -0.4,
};

// Test 1: aligned
const motivations1 = ['ambition_contentment', 'courage_prudence'];
const sum1 = (profile.ambition_contentment + profile.courage_prudence);
const avg1 = sum1 / motivations1.length;
console.log('Test 1 (should be aligned):');
console.log('  Sum:', sum1, 'Avg:', avg1);
console.log('  avg >= 0.3?', avg1 >= 0.3, '-> aligned (1.0)');

// Test 2: neutral (weakly held)
const motivations2 = ['tradition_innovation'];
const sum2 = profile.tradition_innovation;
const avg2 = sum2 / motivations2.length;
console.log('\nTest 2 (should be neutral):');
console.log('  Sum:', sum2, 'Avg:', avg2);
console.log('  avg >= 0.3?', avg2 >= 0.3);
console.log('  avg >= -0.2?', avg2 >= -0.2, '-> neutral (2.0)');

// Test 3: against
const motivations3 = ['greed_generosity', 'cruelty_compassion'];
const sum3 = (profile.greed_generosity + profile.cruelty_compassion);
const avg3 = sum3 / motivations3.length;
console.log('\nTest 3 (should be against):');
console.log('  Sum:', sum3, 'Avg:', avg3);
console.log('  avg < -0.2?', avg3 < -0.2);
const magnitude = Math.abs(avg3);
const against = 3.0 + (magnitude - 0.2) * 2.5;
const final = Math.min(5.0, against);
console.log('  Magnitude:', magnitude);
console.log('  Factor: 3.0 + (', magnitude, ' - 0.2) * 2.5 =', against);
console.log('  Final (capped):', final);

// Test empty motivations
console.log('\nTest empty (should be neutral):');
console.log('  Empty motivations -> neutral (2.0)');
