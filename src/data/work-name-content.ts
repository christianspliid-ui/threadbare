/**
 * Work-name lexicons — THR-1297 §5 (slice 4)
 *
 * The content half of the work namer. Every table here is *data*: the resolver in
 * `src/engine/naming/workNames.ts` owns the grammar, this file owns the words.
 *
 * Two things make these tables different from the settlement tables they are modelled
 * on (`SETTLEMENT_ROOTS_BY_SPHERE` in `culture-name-pools.ts`):
 *
 * 1. **Reach-keyed, not sphere-keyed.** A work is named for *what was done* — the
 *    founder's leading reach — where a settlement is named for what a place *is*.
 *    Reach-keyed tables are new in this repo; the foundation table below is the
 *    culture layer that joins them, so a work reads as made by these people in this
 *    manner rather than as a generic fantasy noun.
 * 2. **Keyed by kind family, not by kind.** Ten kinds collapse to nine naming
 *    families because naming cares about the *shape* of the thing named — a
 *    sublocation and a place_location are both places and want the same nouns —
 *    while the kind registry cares about verbs and payoffs. Keeping the two
 *    vocabularies separate is deliberate: adding a kind must not force a lexicon.
 */

import type { ReachDomain } from '../types/traits';

/**
 * The naming families. Nine, against ten kinds — `sublocation` and `place_location`
 * share the `place` family (see the header note).
 */
export type WorkNameFamily =
  | 'cache'
  | 'mark'
  | 'item'
  | 'chart'
  | 'network'
  | 'place'
  | 'route'
  | 'band'
  | 'order';

/**
 * Kind → naming family. A kind absent from this map falls to `'place'`, which is the
 * most forgiving family (its nouns read sensibly for almost any built thing) — the
 * coverage half of the fail-soft row. An unmapped kind is a content gap, never a crash.
 */
export const WORK_KIND_FAMILY: Readonly<Record<string, WorkNameFamily>> = {
  intelligence_cache: 'cache',
  leverage_mark: 'mark',
  masterwork_item: 'item',
  chart_find: 'chart',
  network: 'network',
  sublocation: 'place',
  place_location: 'place',
  trade_route: 'route',
  warband: 'band',
  faction: 'order',
};

/**
 * The kind a cell's object type names from (THR-1392 slice 2). A cell has no kind
 * row, so `christenCompletedWork` maps its object type to the kind whose family
 * fits — through this table rather than by adding type ids to `WORK_KIND_FAMILY`,
 * because a family name (`route`, `mark`) must never resolve as a kind id.
 */
export const OBJECT_TYPE_NAMING_KIND: Readonly<Record<string, string>> = {
  attachment: 'masterwork_item',
  room: 'sublocation',
  settlement: 'place_location',
  route: 'trade_route',
  company: 'warband',
  faction: 'faction',
  mark: 'leverage_mark',
};

/**
 * Per-object-type nouns (THR-1392 slice 2) — the noun a christened work of that
 * type takes when the created node carries no more specific one. Player words, in
 * the order the namer prefers them.
 */
export const OBJECT_TYPE_NOUNS: Readonly<Record<string, readonly string[]>> = {
  attachment: ['Work', 'Piece', 'Masterwork', 'Charm', 'Relic'],
  room: ['Hall', 'House', 'Yard', 'Chamber', 'Quarter'],
  settlement: ['Stead', 'Holding', 'Haven', 'Reach', 'Seat'],
  route: ['Way', 'Road', 'Run', 'Crossing', 'Carry'],
  company: ['Company', 'Band', 'Host', 'Column', 'Sworn'],
  faction: ['Order', 'Covenant', 'League', 'Fellowship', 'Chapter'],
  mark: ['Hold', 'Debt', 'Grip', 'Lien', 'Claim'],
};

/** The family a work of this kind is named from. Never throws; unknown → `'place'`. */
export function familyForKind(kindId: string | undefined): WorkNameFamily {
  if (!kindId) return 'place';
  return WORK_KIND_FAMILY[kindId] ?? 'place';
}

/**
 * Reach-flavored roots — the *manner* half of a work's name.
 *
 * Eight tables, one per Reach, so the same kind founded by an Iron actor and a Veil
 * actor read differently ("The Ironfast Ring" vs "The Hushed Ring"). Adjectival in
 * register: these are modifiers, and the family noun carries the thing itself.
 */
export const WORK_ROOTS_BY_REACH: Readonly<Record<ReachDomain, readonly string[]>> = {
  iron: ['Ironfast', 'Hammered', 'Bulwark', 'Shieldborn', 'Anvil', 'Fastheld', 'Warded', 'Braced'],
  gold: ['Gilded', 'Coined', 'Saltway', 'Tallied', 'Ledgered', 'Weighed', 'Freighted', 'Minted'],
  shadow: ['Quiet', 'Unlit', 'Sable', 'Cutpurse', 'Blackfoot', 'Slipped', 'Unmarked', 'Hushfoot'],
  veil: ['Hushed', 'Veiled', 'Whispered', 'Thin', 'Half-Seen', 'Waking', 'Shrouded', 'Threadbare'],
  heart: ['Kindred', 'Sworn', 'Openhand', 'Hearthed', 'Beloved', 'Bound', 'Gathered', 'Trusted'],
  eye: ['Charted', 'Farseen', 'Keen', 'Reckoned', 'Lantern', 'Watchful', 'Marked', 'Surveyed'],
  stone: ['Deepset', 'Quarried', 'Rooted', 'Standing', 'Gravebound', 'Longstone', 'Set', 'Enduring'],
  star: ['Auspice', 'Wheeling', 'Highset', 'Omened', 'Meridian', 'Ascendant', 'Farturning', 'Vaulted'],
};

/**
 * Foundation-flavored roots — the *people* half. Reuses the settlement palette's
 * four foundations deliberately: a work founded in an Order-leaning culture should
 * sound like the towns around it, not like a separate world.
 */
export const WORK_ROOTS_BY_FOUNDATION: Readonly<Record<string, readonly string[]>> = {
  chaos: ['Windfall', 'Riven', 'Wildrun', 'Scattered', 'Fraying', 'Sudden'],
  order: ['Charter', 'Warden', 'Canon', 'Pillar', 'Ledger', 'Measured'],
  light: ['Dawnward', 'Beacon', 'Grace', 'Bright', 'Halowed', 'Clear'],
  darkness: ['Duskward', 'Umbral', 'Pall', 'Gloaming', 'Nightset', 'Deep'],
};

/**
 * The thing itself, per family. The first entry of each pool is its **terminal
 * fallback** — the noun a nameless work degrades to when every other pool misses
 * (`WORK_FAMILY_FALLBACK_NOUN` reads it), so these lists must never be empty.
 */
export const WORK_NOUNS_BY_FAMILY: Readonly<Record<WorkNameFamily, readonly string[]>> = {
  cache: ['Cache', 'Hoard', 'Stash', 'Vault', 'Keeping', 'Reserve', 'Store'],
  mark: ['Mark', 'Hold', 'Leash', 'Debt', 'Grip', 'Lien', 'Claim'],
  item: ['Work', 'Piece', 'Craft', 'Masterwork', 'Make', 'Wrought', 'Labour'],
  chart: ['Chart', 'Survey', 'Reckoning', 'Map', 'Traverse', 'Finding', 'Account'],
  network: ['Ring', 'Circle', 'Web', 'Brotherhood', 'Weave', 'Chain', 'Lattice', 'Confidence'],
  place: ['Hold', 'Rest', 'Haven', 'Seat', 'House', 'Refuge', 'Stand', 'Quarter'],
  route: ['Way', 'Road', 'Run', 'Passage', 'Crossing', 'Track', 'Reach', 'Carry'],
  band: ['Band', 'Company', 'Host', 'Warband', 'Sworn', 'Spears', 'Column'],
  order: ['Order', 'Covenant', 'Fellowship', 'Chapter', 'Concord', 'League', 'Assembly'],
};

/** The terminal noun for a family — the last thing standing before the id is used. */
export function familyFallbackNoun(family: WorkNameFamily): string {
  return WORK_NOUNS_BY_FAMILY[family][0];
}

/**
 * Pattern sets, chosen by which inputs the context actually carried.
 *
 * Tokens: `{root}` (reach or foundation flavor), `{noun}` (family), `{anchor}` (the
 * bound place/target the work touched — where *Saltway* comes from), `{actor}`
 * (already possessive-rendered by the resolver, never raw).
 *
 * Ordered loosely from most-specific to least so that a context carrying an anchor
 * gets an anchored name most of the time; the resolver still picks among *all*
 * renderable patterns, so this is a tilt and not a rule.
 */
export const WORK_NAME_PATTERNS = {
  /** Needs an anchor entity (a bound location, target, or destroyed predecessor). */
  anchored: [
    'The {anchor} {noun}',
    'The {root} {noun} of {anchor}',
    '{anchor} {noun}',
    'The {noun} of {anchor}',
  ],
  /**
   * Needs only the flavor roots.
   *
   * There is deliberately **no concatenating `{root}{noun}` pattern**. It was drafted
   * (aiming at compounds like "Ironhold") and a 150-tick seed-42 run produced
   * *"The StandingHouse"* at tick 141 — because every root in the tables above is a
   * capitalised standalone adjective, so joining it to a capitalised noun yields
   * CamelCase mush that reads as a typo rather than a name. Compound roots would need
   * their own lowercase table; until that exists, the spaced form is the only one.
   */
  flavored: [
    'The {root} {noun}',
  ],
  /** Needs the actor. Rendered possessive by the resolver before substitution. */
  possessive: [
    '{actor} {noun}',
    "{actor} {root} {noun}",
  ],
} as const;

/**
 * Re-naming grammar for a work built where a destroyed one stood — "the Second
 * Saltway". Mirrors `GROUP_REFORMED_NAME_PATTERNS`' token contract (`{old}`,
 * `{bare}`, `{oldLower}`) so the two grammars stay one idiom.
 */
export const WORK_SUCCESSOR_NAME_PATTERNS: readonly string[] = [
  'The Second {bare}',
  'The New {bare}',
  '{old} Rebuilt',
  'The {bare} Restored',
  'New {bare}',
];

/**
 * The folly lexicon — the *kind* part of a failure-name register entry.
 *
 * Deliberately not a mirror of the success nouns: a failure is named for the
 * attempt's residue, not for what it would have been. "Corran's Folly" is a place
 * mortals point at, which is the register's whole purpose (THR-1297 §5, review 2.2).
 */
export const FAILURE_SCAR_LEXICON: readonly string[] = [
  'Folly',
  'Ruin',
  'Wreck',
  'Undoing',
  'Halfwork',
  'Waste',
  'Abandon',
  'Regret',
  'Mistake',
  'Overreach',
];

/** Terminal fallback when even the actor's name is unknown at a failure site. */
export const FAILURE_SCAR_FALLBACK = 'The Folly';
