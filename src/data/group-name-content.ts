/**
 * Company Name Content — THR-74
 *
 * Word pools and pattern grammars for the seeded company-name generator
 * (`src/engine/groups/groupNames.ts`). Data only — no logic.
 *
 * Names are the company's player-facing identity: the graph node's `name` field,
 * so every existing prose resolver renders it for free. The word "party" never
 * appears here by design.
 */

/** Pattern ids the generator can render. Weighted selection lives in the generator. */
export type GroupNamePattern =
  | 'the_adjective_nouns'
  | 'company_of_the_place'
  | 'leader_epithet_band'
  | 'the_noun_of_the_adjective';

/** Evocative adjectives — "The **Quiet** Wardens". */
export const GROUP_NAME_ADJECTIVES: readonly string[] = [
  'Quiet', 'Ragged', 'Gilded', 'Hollow', 'Patient', 'Iron', 'Ashen', 'Wandering',
  'Nameless', 'Bitter', 'Steadfast', 'Crooked', 'Silver', 'Long', 'Late',
  'Unbroken', 'Errant', 'Grey', 'Sudden', 'Weary',
];

/** Plural member-nouns — "The Quiet **Wardens**". */
export const GROUP_NAME_NOUNS: readonly string[] = [
  'Wardens', 'Lanterns', 'Hounds', 'Ravens', 'Keys', 'Spears', 'Wanderers',
  'Vigils', 'Coins', 'Threads', 'Knives', 'Crows', 'Oaths', 'Roads', 'Hands',
  'Sparrows', 'Pilgrims', 'Kindlings', 'Anchors', 'Cairns',
];

/** Collective words for the "{leader}'s {band}" pattern. */
export const GROUP_NAME_BAND_WORDS: readonly string[] = [
  'Company', 'Band', 'Fellowship', 'Retinue', 'Circle', 'Consort', 'Following',
];

/** Singular nouns for "The **Vigil** of the Hollow Road". */
export const GROUP_NAME_SINGULAR_NOUNS: readonly string[] = [
  'Vigil', 'Compact', 'Accord', 'Watch', 'Errand', 'Wake', 'Covenant', 'Debt',
];

/**
 * Formation-context flavor: extra adjectives weighted in by *why* the company
 * formed. Keyed by the `formationContext.cause` recorded on the node.
 */
export const GROUP_NAME_CAUSE_ADJECTIVES: Record<string, readonly string[]> = {
  systemic: ['Chance', 'Roadworn', 'Common'],
  seeking_companions: ['Sworn', 'Spoken', 'Promised'],
  draw_together: ['Called', 'Drawn', 'Fated', 'Threaded'],
};

/**
 * Sphere-flavored adjectives, used when Draw Together caused the formation and
 * the casting ascendant's sphere is known. Keys are sphere ids.
 */
export const GROUP_NAME_SPHERE_ADJECTIVES: Record<string, readonly string[]> = {
  hunger: ['Famished', 'Wanting'],
  mind: ['Reasoned', 'Lettered'],
  spirit: ['Ardent', 'Devout'],
  blood: ['Kindred', 'Redhanded'],
  stone: ['Unmoving', 'Deepset'],
  tide: ['Turning', 'Saltbitten'],
  flame: ['Kindled', 'Scorched'],
  dusk: ['Lengthening', 'Dimlit'],
};

/**
 * Fallback used when every pool comes back empty (fail-soft table row).
 * `{leader}` is substituted with the leader's name.
 */
export const GROUP_NAME_FALLBACK = "{leader}'s Company";
