/**
 * Survey Prose Tables — content data for hex.survey and hex.read_currents
 * results rendering in HexChronicle (THR-398).
 *
 * NFP compliance:
 *   #1 Tunability: all thresholds and caps are named constants
 *   #3 Determinism: tables are pure lookup — callers supply seeded RNG
 */

// ─── Constants (NFP #1) ───────────────────────────────────────────────────────

/** Max named mortals shown in a Survey people-layer summary. */
export const SURVEY_NAMED_MORTALS_CAP = 4;

/** Max distinct location names listed in a Survey land-layer summary. */
export const SURVEY_LOCATIONS_LISTED_CAP = 3;

/** Minimum faction-presence score to show a faction in Survey output. */
export const SURVEY_FACTION_PRESENCE_MIN = 1;

/** Bond-weight multiplier when picking which named mortals to surface (bonded agents rank higher). */
export const SURVEY_BOND_WEIGHT_FACTOR = 2;

/** Max spheres listed in a Read-the-Currents soul-layer result. */
export const READ_CURRENTS_TOP_SPHERES_CAP = 3;

/** Minimum sphere intensity (0–1) to include a sphere in Currents output. */
export const READ_CURRENTS_SPHERE_INTENSITY_MIN = 0.1;

// ─── Mood bucket thresholds ───────────────────────────────────────────────────

/** Unrest ≤ this value → 'calm' mood bucket. */
export const POPULACE_MOOD_BUCKET_CALM_MAX = 0.30;

/** Unrest ≤ this value → 'restless' mood bucket (above calm threshold). */
export const POPULACE_MOOD_BUCKET_RESTLESS_MAX = 0.60;

/** Unrest ≤ this value → 'agitated' mood bucket (above restless threshold). Above → 'boiling'. */
export const POPULACE_MOOD_BUCKET_AGITATED_MAX = 0.85;

// ─── Types ────────────────────────────────────────────────────────────────────

export type MoodBucket = 'calm' | 'restless' | 'agitated' | 'boiling';

// ─── Populace Mood Phrases ────────────────────────────────────────────────────

/**
 * Phrases describing the collective mood of a hex's inhabitants.
 * Keyed by MoodBucket derived from hex unrest level.
 * Callers select one entry via seeded RNG.
 */
export const POPULACE_MOOD_PHRASES: Record<MoodBucket, readonly string[]> = {
  calm: [
    'the people go about their days with quiet purpose',
    'a settled peace lies over the inhabitants — tensions are low',
    'daily life proceeds without friction; the hex breathes easily',
    'the population is content, or at least not visibly troubled',
    'a cautious stability holds — no open grievances rise to the surface',
  ],
  restless: [
    'an undercurrent of anxiety runs through the population',
    'the people are unsettled — not yet angry, but watchful',
    'whispered complaints drift through markets and hearths',
    'a low hum of discontent underlies the ordinary bustle',
    'the inhabitants feel the weight of something unresolved',
  ],
  agitated: [
    'the populace is visibly on edge — arguments flare without warning',
    'resentment crackles in public spaces; factions sharpen their rhetoric',
    'tempers run short and old grievances surface openly',
    'the social fabric is fraying; alliances shift and suspicions multiply',
    'the hex teeters — one provocation could tip it toward open conflict',
  ],
  boiling: [
    'the population is at the edge of open revolt',
    'rage has replaced restraint — the ordinary order is collapsing',
    'faction violence simmers just beneath the surface, if it has not already erupted',
    'the hex is a powder keg; the match is already lit',
    'authority here is contested or crumbling — every group acts for itself',
  ],
};

// ─── Faction Presence Grammar ─────────────────────────────────────────────────

/**
 * Verb phrases for describing faction presence strength.
 * Keyed loosely by presence tier (dominant / active / minor).
 */
export const FACTION_PRESENCE_VERBS: Record<'dominant' | 'active' | 'minor', readonly string[]> = {
  dominant: [
    'holds sway over',
    'dominates',
    'controls',
    'commands the allegiance of most in',
  ],
  active: [
    'operates openly across',
    'maintains a visible presence in',
    'contests influence in',
    'competes for ground in',
  ],
  minor: [
    'keeps a quiet foothold in',
    'works the margins of',
    'has agents within',
    'monitors events in',
  ],
};

/** Location descriptor phrases to frame the survey's land summary. */
export const SURVEY_LOCATION_DESCRIPTORS: readonly string[] = [
  'the most notable sites',
  'key locations',
  'prominent landmarks',
  'the principal gathering places',
];
