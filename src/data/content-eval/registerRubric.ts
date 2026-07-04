// Director-tunable rubric for the register-compliance dimension (THR-609).
// Edit constants here to calibrate register thresholds; no code changes needed.
//
// Register model (canon: Docs/canon/prose.md § the register model):
//   baseline  — the default; plainspoken. The large majority of player-facing prose.
//   character — dialogue / agent-attributed lines; comprehension-first, wit over ornament.
//   peak      — rationed lyricism (doom transitions, Twilight, encounter climax,
//               major aftermath, World-Soul prose).
// Absent register declaration ⇒ baseline (the strictest common case).
//
// The four metrics — avgSentenceLength, rareWordDensity, figurativeDensity,
// interactivePlainness — each band pass/warn/fail against the register-appropriate
// threshold. The entry's registerCompliance band is the worst metric band.

// ---------------------------------------------------------------------------
// Sentence-length ceilings (mean words / sentence)
// ---------------------------------------------------------------------------

/** Baseline register: mean words/sentence ceiling. Warn above; fail at the
 *  warn→fail multiple (REGISTER_WARN_TO_FAIL_RATIO). */
export const BASELINE_MAX_AVG_SENTENCE_LEN = 18;

/** Peak register: mean words/sentence ceiling (rhythm may stretch). */
export const PEAK_MAX_AVG_SENTENCE_LEN = 26;

// ---------------------------------------------------------------------------
// Rare-word (ornate-diction) density ceilings — fraction of content tokens
// drawn from the ornate-diction denylist (src/data/register-common-words.ts →
// REGISTER_ORNATE_WORDS). Plain prose scores ~0; stacked ornate diction scores
// high. See the design note in that data file for why a denylist beats a
// common-word allowlist here.
// ---------------------------------------------------------------------------

/** Only tokens at or above this length are eligible to count as ornate. A low
 *  floor (the denylist is explicit, so this only guards against pathological
 *  short-token matches) that still admits 4–6-char ornate words (nary, ambit,
 *  umbra, dirge). */
export const RARE_WORD_MIN_LEN = 4;

/** An entry needs at least this many total content tokens before rareWordDensity
 *  can push it past warn — protects short fields (a single ornate word in a
 *  6-word afterimage should not hard-fail). Below this, ornate density bands at
 *  most `warn`. */
export const RARE_DENSITY_MIN_TOKENS = 12;

/** Baseline register: ornate-token fraction ceiling. Warn above; fail at the
 *  warn→fail multiple. Calibrated (THR-609) so plainspoken prose (0 ornate)
 *  passes and stacked ornate diction warns/fails. */
export const BASELINE_RARE_WORD_DENSITY_MAX = 0.03;

/** Peak register: ornate-token fraction ceiling (elevated vocabulary is earned
 *  on peak surfaces). */
export const PEAK_RARE_WORD_DENSITY_MAX = 0.08;

// ---------------------------------------------------------------------------
// Figurative-image density (markers per paragraph — max across paragraphs)
// ---------------------------------------------------------------------------

/** Peak register: image budget per paragraph. At or below ⇒ pass. */
export const PEAK_FIGURATIVE_IMAGES_PER_PARA = 1;

/** Baseline: figurative images per paragraph that trigger warn. */
export const BASELINE_FIGURATIVE_WARN_AT = 1;

/** Baseline: figurative images per paragraph that trigger fail. */
export const BASELINE_FIGURATIVE_FAIL_AT = 2;

// ---------------------------------------------------------------------------
// Interactive (label-class) plainness
// ---------------------------------------------------------------------------

/** Label-class fields (action names, choice labels, headings) plainness word
 *  cap. Over cap ⇒ warn; a rare word or figurative marker in a label ⇒ fail. */
export const INTERACTIVE_LABEL_MAX_WORDS = 6;

/** Field names treated as label-class (interactive text — always plain).
 *  Detection is by field type/name, not string heuristics (THR-609). Lowercased. */
export const LABEL_CLASS_FIELD_NAMES: ReadonlyArray<string> = [
  'name',
  'label',
  'heading',
  'keyword',
  'title',
  'buttonlabel',
];

// ---------------------------------------------------------------------------
// Shared band shaping
// ---------------------------------------------------------------------------

/** Multiplier from a metric's warn threshold to its fail threshold. */
export const REGISTER_WARN_TO_FAIL_RATIO = 1.25;

// ---------------------------------------------------------------------------
// Figurative-marker detection (simile constructions + figurative verbs)
// Conservative by design: false positives band warn-only unless >= 2 markers
// stack in one paragraph (fail-soft, see plan). Lowercased matching.
// ---------------------------------------------------------------------------

/** Simile / explicit-comparison markers. Matched as bounded phrases to avoid
 *  the "I like this" false positive on bare "like". */
export const FIGURATIVE_SIMILE_MARKERS: ReadonlyArray<string> = [
  ' like a ',
  ' like an ',
  ' like the ',
  ' like some ',
  ' as if ',
  ' as though ',
  ' as a ',
  ' likened ',
];

/** Figurative-construction verbs/phrases: personification and metaphor tells
 *  that recur in drifted prose. Kept small and specific. */
export const FIGURATIVE_CONSTRUCTION_MARKERS: ReadonlyArray<string> = [
  'held its breath',
  'holding its breath',
  'the weight of',
  'a tapestry of',
  'a sea of',
  'the hand of',
  'threads of fate',
  'woven from',
  'clawed at',
  'devoured by',
  'drowning in',
  'a river of',
  'a wave of',
  'swallowed by',
];
