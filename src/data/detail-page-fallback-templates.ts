/**
 * Detail page fallback templates — prose strings used when graph-walking resolvers
 * return null and the section is mandatory (or has a fallback configured).
 *
 * Design doc: Docs/plans/2026-05-06-detail-page-data-model.md §6
 *
 * Templates may contain placeholders like {Name}, {sphere}, {category} that are
 * substituted by the section resolver before being written into the final Section.
 *
 * Per NFP #1: each template pool is a tunable constant. Authors expand pools
 * (5+ variants per slot) without touching engine code.
 */

/** Default number of variants authored per (pageKind, sectionTypeId) pool. */
export const DETAIL_FALLBACK_PROSE_VARIANTS = 5;

// ─── Actor fallbacks ──────────────────────────────────────────────────────────

export const ACTOR_FALLBACK_TEMPLATES = {
  /** Page-level disposition prose when no relationship/encounter history exists. */
  disposition_no_history: [
    '{Name} has not yet crossed paths with you.',
    '{Name} does not know your face — yet.',
    'No thread connects you to {Name}. Not yet.',
    '{Name} moves through the world unaware of you.',
    'You and {Name} have never shared a moment.',
  ],
  disposition_known_no_recent: [
    '{Name} remembers your name and little else.',
    'A face you have brushed past. Nothing more, yet.',
    '{Name} has heard of you in passing.',
    'You exist to {Name} as a rumour, not a presence.',
    '{Name} could place you in a crowd. That is the limit.',
  ],
  /** Single-line capability fallback. */
  capabilities_unknown: [
    '{Name} keeps her measure to herself.',
    'What {Name} can do is not yet visible.',
    'A figure of unknown reach.',
  ],
} as const;

// ─── Item fallbacks ───────────────────────────────────────────────────────────

export const ITEM_FALLBACK_TEMPLATES = {
  meaning_basic: [
    'A {category} of {sphere}. It does not yet speak.',
    '{Name}. Mundane to anyone who does not look closely.',
    'A {category} that has not yet earned a story.',
    '{Name}: weight, shape, and silence.',
    'A {category}, marked by {sphere}, waiting to be used.',
  ],
  acquisition_unknown: [
    'How it came to her hand is not recorded.',
    'The moment of acquisition has slipped from memory.',
    'It arrived without ceremony.',
  ],
  scene_neutral: [
    'It does not tilt this scene.',
    'Held, but not yet weighted toward action.',
    'Present, but quiet.',
  ],
} as const;

// ─── Faction fallbacks ────────────────────────────────────────────────────────

export const FACTION_FALLBACK_TEMPLATES = {
  no_reputation: [
    'They have not yet noticed her.',
    'No name yet, no quarrel.',
    'You exist below their attention.',
    'The faction has not turned its eye your way.',
    'Their ledger does not yet contain your name.',
  ],
  no_relations: [
    'They keep their alliances private.',
    'No ledger of friends and foes is visible.',
    'Their politics are opaque from here.',
  ],
} as const;

// ─── Place fallbacks ──────────────────────────────────────────────────────────

export const PLACE_FALLBACK_TEMPLATES = {
  wants_basic: [
    'The room leans toward {sphere}.',
    'This place pulls at the edges of {sphere}.',
    'Something in {Name} biases what is possible here.',
    '{Name} carries a quiet weight of {sphere}.',
    'The air in {Name} is faintly aligned with {sphere}.',
  ],
  wants_neutral: [
    '{Name} has no strong pull. The scene is yours to shape.',
    'A neutral ground.',
    'Nothing here tilts the moment.',
  ],
  memory_none: [
    'You have no memory of {Name}.',
    'You have not yet stood in this place.',
    '{Name} is unmarked in your past.',
  ],
} as const;

// ─── Event fallbacks ──────────────────────────────────────────────────────────

export const EVENT_FALLBACK_TEMPLATES = {
  skeletal: [
    'On tick {tick}, at {place}. {participants} were present.',
    '{place}, tick {tick}. A moment that did not record itself fully.',
    'A passing event at {place}.',
  ],
  what_it_became_none: [
    'Nothing came of it. Not visibly.',
    'No mark, no debt, no reward.',
    'It passed and left no trail.',
  ],
} as const;

// ─── Unknown-entity stub prose ────────────────────────────────────────────────

export const UNKNOWN_ENTITY_PROSE =
  'This entity is no longer reachable. The thread that named it has slackened.';
