// Shared prose-quality detector constants.
// Imported by both lint-encounter-content.ts (encounter-contract linter) and
// proseQualityScore.ts (batch scoring harness) so the detection lists stay in sync.

export const FORECAST_DIGIT_PATTERN = /\d/u;

export const PROBABILITY_PHRASES = [
  'likely',
  'unlikely',
  'probably',
  'chance',
  'odds',
  'percent',
  '%',
  'probability',
] as const;

export const FLOWERY_PHRASES = [
  'inexorable',
  'ineffable',
  'transcendent',
  'sublime',
  'eldritch',
  'otherworldly',
  'gossamer',
  'ephemeral',
  'ethereal',
  'primordial',
  'ancient beyond reckoning',
  'shimmering',
  'gleaming',
  'glistening',
  'glittering',
  'scintillating',
  'whisper of fate',
  'hand of destiny',
  'weaver of threads',
  'mortal coil',
  'sea of stars',
  'tapestry of',
] as const;

// Thresholds for the encounter-contract linter's R5 rule (flowery phrase count).
// At PROSE_WARNING_THRESHOLD or above → warning. At PROSE_LOUD_WARNING_THRESHOLD or above → "high" label.
export const PROSE_WARNING_THRESHOLD = 3;
export const PROSE_LOUD_WARNING_THRESHOLD = 6;
