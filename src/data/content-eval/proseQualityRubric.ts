// Director-tunable rubric for the prose-quality eval harness (THR-472).
// Edit constants here to calibrate thresholds; no code changes required.
// Last reconciled against Docs/plans/2026-03-06-content-strategy.md: 2026-06-23

// ---------------------------------------------------------------------------
// Band thresholds (0–100 score)
// ---------------------------------------------------------------------------

/** Score at or above which an entry bands "pass". */
export const PROSE_PASS_FLOOR = 85;

/** Score at or above which an entry bands "warn" (below ⇒ "fail"). */
export const PROSE_WARN_FLOOR = 60;

// ---------------------------------------------------------------------------
// Per-flag penalty weights
// ---------------------------------------------------------------------------

/** Penalty per purple-prose (flowery) phrase hit. */
export const FLOWERY_PHRASE_PENALTY = 8;

/** Penalty per tell-don't-show emotion-naming construction. */
export const TELL_DONT_SHOW_PENALTY = 12;

/** Penalty per digit or probability word found in prose. */
export const NUMBER_IN_PROSE_PENALTY = 10;

/** Penalty for exceeding the voice-mode sentence cap. */
export const LENGTH_BREACH_PENALTY = 10;

/** Penalty for a "dynamic" field that contains zero enrichment placeholders. */
export const STATIC_STRING_PENALTY = 25;

/** Soft penalty for a field that has {name} but no conditional block or pronoun placeholder. */
export const MISSING_ENRICHMENT_PENALTY = 6;

/** Whether any hard-exclusion pattern match clamps the entry to fail + score 0. */
export const HARD_EXCLUSION_IS_GATE = true;

// ---------------------------------------------------------------------------
// Batch report
// ---------------------------------------------------------------------------

/** Fraction of batch entries surfaced as the "bottom tail" for director review. */
export const BATCH_TAIL_FRACTION = 0.15;

// ---------------------------------------------------------------------------
// Hard-exclusion patterns
// Source: Docs/plans/2026-03-06-content-strategy.md § Hard Exclusions
// Last reconciled: 2026-06-23
//
// These patterns detect explicit depiction of excluded content in prose.
// Err toward specificity (higher precision) to avoid false positives on
// incidental word matches. A match forces band="fail" and score=0 regardless
// of other scoring.
// ---------------------------------------------------------------------------

export const HARD_EXCLUSION_PATTERNS: ReadonlyArray<RegExp> = [
  // Sexual violence — never depicted, implied, or referenced (content-strategy § Hard Exclusions)
  /sexual\s+violence/iu,
  /sexually\s+assault/iu,
  /\brap(?:e|ed|ing|ist)\b/iu,

  // Overt sexual content — explicit scenes only; longing/tension/romance are allowed
  /\bexplicit\s+sex(?:ual)?\b/iu,
  /\bsex\s+scene\b/iu,

  // Killing of children — children can exist; violence against them is never depicted
  /kill(?:ed|ing|s)?\s+(?:the\s+)?(?:child|children|kid|infant|baby|babies)/iu,
  /child(?:ren)?\s+(?:were|was|are|is)\s+(?:killed|slain|murdered|executed)/iu,
  /(?:murder|slaughter)(?:ed|ing)?\s+(?:the\s+)?(?:child|children|infant|baby)/iu,

  // Abuse — torture of the helpless, cruelty for cruelty's sake (camera-pull-back rule)
  /tortur(?:e|ed|ing)\s+(?:the\s+)?(?:helpless|prisoner|captive|victim)/iu,
  /cruelty\s+for\s+cruelty/iu,
];

// ---------------------------------------------------------------------------
// Tell-don't-show markers
// Source: Docs/plans/2026-03-06-content-strategy.md "Show, never explain"
// ---------------------------------------------------------------------------

export const TELL_DONT_SHOW_MARKERS: ReadonlyArray<string> = [
  'the tragedy of it was',
  'the irony of it was',
  'the beauty of it was',
  'the horror of it was',
  'felt overwhelmed',
  'felt a wave of',
  'felt deeply',
  'felt suddenly',
  'she felt',
  'he felt',
  'they felt',
  'it felt',
  'was feeling',
  'were feeling',
  'felt sad',
  'felt happy',
  'felt angry',
  'felt afraid',
  'felt hopeful',
  'felt betrayed',
  'felt relieved',
  'the weight of grief',
  'overcome with emotion',
  'burst into tears',
  'couldn\'t hold back',
];

// ---------------------------------------------------------------------------
// Voice-mode sentence caps
// Source: Docs/plans/2026-03-06-content-strategy.md voice modes
// ---------------------------------------------------------------------------

/** Maximum sentences allowed in a "divine" voice field (interventions, direct action text). */
export const DIVINE_SENTENCE_CAP = 2;

/** Maximum sentences allowed in a "chronicler" voice field (receipts, aftermath, chronicle). */
export const CHRONICLER_SENTENCE_CAP = 3;

// ---------------------------------------------------------------------------
// Dynamic field names
// Fields matching these patterns are expected to carry enrichment placeholders.
// Fields NOT in this list (e.g. id, name, heading, label) are "static-ok".
// ---------------------------------------------------------------------------

export const DYNAMIC_FIELD_NAMES: ReadonlyArray<string> = [
  'prose',
  'narrative',
  'narrativetemplate',  // lowercased for matching
  'receipt',
  'description',
  'text',
  'intent',
  'successafterimage',  // lowercased
  'failureafterimage',  // lowercased
  'flavor',
  'lore',
  'body',
  'content',
  'detail',
];
