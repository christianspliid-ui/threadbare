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

import type { SphereName } from '../types/index';

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
  // NPC bands (THR-731) — a faction's own people, sent out with a purpose.
  // Harder-edged than the company pools: these are the names mortals mutter.
  band_spawn: ['Sworn', 'Sharp', 'Blooded', 'Owed', 'Marked'],
  // Reunite (THR-732) — a company that ended and came back. Only reached when the
  // predecessor's name is unavailable; a reunion that knows what it used to be
  // called takes a REFORMED_NAME_PATTERNS variant of that instead.
  reunite: ['Returned', 'Remembered', 'Second', 'Rekindled', 'Unfinished'],
};

/**
 * Grammars for a Reunite re-formation (THR-732), applied to the *old* company's
 * name.
 *
 * A reunion must read as the same company come back, not a new one with a similar
 * mood — which is why these wrap the predecessor's name rather than drawing fresh
 * words from the pools above. The register is deliberately unromantic: these people
 * failed to hold together once, and the name should carry that.
 *
 * Three tokens, because English articles do not survive naive substitution — a
 * pattern built on `{old}` alone yields "The Second The Quiet Wardens":
 *
 *  - `{old}`      the predecessor's name verbatim  — "The Quiet Wardens"
 *  - `{bare}`     with any leading article dropped — "Quiet Wardens"
 *  - `{oldLower}` with the article lowercased      — "the Quiet Wardens"
 */
export const GROUP_REFORMED_NAME_PATTERNS: readonly string[] = [
  '{old}, Re-formed',
  '{old} Reborn',
  'The Second {bare}',
  '{old}, Again',
  'The Remnant of {oldLower}',
];

/**
 * Sphere-flavored adjectives, used when a divine verb caused the formation and the
 * casting ascendant's sphere is known — Draw Together and Reunite both pass one.
 *
 * Keyed by **sphere id**, and typed `Record<SphereName, …>` so the compiler refuses a
 * key the engine cannot produce. Until THR-770 the table was typed `Record<string, …>`
 * and six of its eight keys (`hunger`, `blood`, `stone`, `tide`, `flame`, `dusk`) were
 * an older cosmology's vocabulary that no sphere id matches — only `mind` and `spirit`
 * overlapped. The read site's `?? []` fallback made that silent: a company founded
 * under any other alignment simply drew no sphere adjective, with no warning. The
 * closed key set is pinned by `group-name-content.test.ts`; the type is the other half
 * of the same guard, so a renamed sphere fails to compile rather than going quiet.
 *
 * Foundation spheres are included because a caster's primary genuinely can be one —
 * `hunger-catalog.ts` carries `sphereAlignment: { primary: 'light' }`.
 *
 * Where the retired vocabulary had a real home it was salvaged rather than rewritten:
 * `stone`'s words moved to `matter`, `flame`'s to `energy`, `dusk`'s to `entropy` —
 * those are exactly the spheres their reaches map to under `REACH_TO_SPHERE`, which is
 * the drift the old keys were evidence of.
 */
export const GROUP_NAME_SPHERE_ADJECTIVES: Record<SphereName, readonly string[]> = {
  // Foundation
  chaos: ['Unruled', 'Scattering'],
  order: ['Measured', 'Ranked'],
  light: ['Bright', 'Unshuttered'],
  darkness: ['Starless', 'Nightgiven'],
  // Creation
  force: ['Unyielding', 'Breaking'],
  matter: ['Unmoving', 'Deepset'],
  energy: ['Kindled', 'Scorched'],
  life: ['Kindred', 'Quickened'],
  mind: ['Reasoned', 'Lettered'],
  spirit: ['Ardent', 'Devout'],
  time: ['Turning', 'Hourworn'],
  entropy: ['Lengthening', 'Dimlit'],
};

/**
 * Fallback used when every pool comes back empty (fail-soft table row).
 * `{leader}` is substituted with the leader's name.
 */
export const GROUP_NAME_FALLBACK = "{leader}'s Company";
