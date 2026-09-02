import type { UndertakingHarmClass } from '../types/strategicAction';

// src/data/ambition-minting-rules.ts
//
// World-minted ambitions (THR-726) — the living world's emotional logic as data.
//
// A qualifying world event (a graph-native `event` node the agent participated in
// or witnessed at their location) is classified into a `MintEventClass`, then paired
// with the agent's `MintRelation` to the event. That (class × relation) key selects
// candidate ambition templates + weights; the minting pass in `ambitionTick.ts` feeds
// the candidates through the existing `selectAmbitions` personality funnel — so a
// craven agent mints *flee* where a proud one mints *revenge* from the same ruin.
//
// This table is content, not code: retuning what a razed town produces means editing
// weights here, not rewriting the pass. The referenced template ids live in
// `EVENT_MINTED_AMBITION_TEMPLATES` (ambition-templates.ts).

/** How the world event registers, derived from the event node's tested Reach. */
export type MintEventClass =
  | 'violence'   // iron / shadow — bloodshed, raids, ambush
  | 'upheaval'   // gold — fortunes broken, markets collapsed
  | 'wonder'     // star / veil — the numinous witnessed
  | 'hardship'   // stone — the land itself turned hard
  | 'severance'; // heart — a bond torn

/** How the agent stood to the event. */
export type MintRelation =
  | 'victim'      // the event was done *to* them (participated_in, role 'target')
  | 'participant' // they acted in it (participated_in, role 'primary')
  | 'witness';    // it happened at their location; they only saw

/** One candidate the rules table offers for a (class × relation) key. */
export interface MintRuleEntry {
  readonly templateId: string;
  /** Relative pull of this candidate when several qualify — larger wins ties. */
  readonly weight: number;
}

/**
 * Map an `encounter_outcome` event node's tested Reach to a mint class.
 * Returns null for Reaches that mint nothing (eye — investigation is not, by
 * itself, a wound or a wonder). Unlisted / missing → null (inert by design).
 */
export function classifyMintEvent(reachTested: string | undefined): MintEventClass | null {
  switch (reachTested) {
    case 'iron':
    case 'shadow':
      return 'violence';
    case 'gold':
      return 'upheaval';
    case 'star':
    case 'veil':
      return 'wonder';
    case 'stone':
      return 'hardship';
    case 'heart':
      return 'severance';
    default:
      return null; // eye and anything unclassified mint nothing
  }
}

/**
 * (class × relation) → candidate ambition templates. Every template id here must
 * exist in `EVENT_MINTED_AMBITION_TEMPLATES`. A missing (class, relation) key mints
 * nothing — the pass simply skips it.
 */
export const AMBITION_MINTING_RULES: Readonly<
  Record<MintEventClass, Partial<Record<MintRelation, readonly MintRuleEntry[]>>>
> = {
  violence: {
    victim: [
      { templateId: 'ambition_avenge_the_wrong', weight: 3 },
      { templateId: 'ambition_flee_the_ravaged_land', weight: 1 },
    ],
    witness: [
      { templateId: 'ambition_protect_the_home', weight: 2 },
      { templateId: 'ambition_flee_the_ravaged_land', weight: 1 },
    ],
    participant: [
      { templateId: 'ambition_protect_the_home', weight: 1 },
    ],
  },
  upheaval: {
    victim: [
      { templateId: 'ambition_rebuild_from_ashes', weight: 2 },
      { templateId: 'ambition_flee_the_ravaged_land', weight: 1 },
    ],
    witness: [
      { templateId: 'ambition_rebuild_from_ashes', weight: 2 },
    ],
    participant: [
      { templateId: 'ambition_found_anew', weight: 1 },
    ],
  },
  wonder: {
    witness: [
      { templateId: 'ambition_chase_the_wonder', weight: 2 },
      { templateId: 'ambition_found_anew', weight: 1 },
    ],
    participant: [
      { templateId: 'ambition_chase_the_wonder', weight: 2 },
    ],
    victim: [
      { templateId: 'ambition_chase_the_wonder', weight: 1 },
    ],
  },
  hardship: {
    victim: [
      { templateId: 'ambition_flee_the_ravaged_land', weight: 2 },
      { templateId: 'ambition_rebuild_from_ashes', weight: 1 },
    ],
    witness: [
      { templateId: 'ambition_rebuild_from_ashes', weight: 2 },
    ],
  },
  severance: {
    victim: [
      { templateId: 'ambition_avenge_the_wrong', weight: 2 },
    ],
    witness: [
      { templateId: 'ambition_protect_the_home', weight: 1 },
    ],
  },
};

/**
 * Prose stem for each class, used to compose a minted ambition's provenance label
 * ("she seeks vengeance for the bloodshed at Thornhaven"). No digits — the label is
 * read aloud in receipts. The pass appends " at {location}" when a place is known.
 */
export const MINT_CLASS_LABELS: Readonly<Record<MintEventClass, string>> = {
  violence: 'the bloodshed',
  upheaval: 'the ruin of fortunes',
  wonder: 'the wonder witnessed',
  hardship: 'the hard road',
  severance: 'the wound of parting',
};

// ─── Undertaking harm → drives (THR-1298) ────────────────────────────────────
//
// The second event class the mint lane reads. Where the table above keys off a Reach
// an encounter *tested*, this one keys off the harm class an undertaking *authored* —
// two vocabularies, deliberately kept apart. `classifyMintEvent` is never consulted
// for an undertaking node: a razing is a razing whether the verb tested iron or gold,
// and letting the Reach decide would make the drive it mints an accident of phrasing.

/**
 * How badly each harm class lands, on one scale.
 *
 * This is the grievance economy's only currency. It sets a fresh grievance's opening
 * heat, and it decides replacement: a new harm displaces an active grievance only when
 * it outweighs it by `GRIEVANCE_REPLACE_RATIO`, so a stolen cache never makes an agent
 * forget a murdered friend, while a razed home might.
 */
export const HARM_MAGNITUDE_BY_CLASS: Readonly<Record<UndertakingHarmClass, number>> = {
  named_death: 1.0,
  property_destroyed: 0.8,
  holding_seized: 0.6,
  network_severed: 0.5,
  undertaking_abandoned: 0.3,
};

/** One candidate drive a harm offers, and whether taking it opens a grievance. */
export interface UndertakingMintRuleEntry extends MintRuleEntry {
  /**
   * `true` ⇒ the minted drive carries a culprit, heat, and a grievance block on its
   * `pursues` edge. Absent ⇒ a soft drive: real provenance, no vendetta.
   *
   * Only the victim's own candidates may be flagged. A witness never inherits somebody
   * else's revenge (THR-1282 §2) — they saw a home burn, which is a reason to guard
   * their own or to leave, not a reason to hunt a stranger's enemy.
   */
  readonly grievance?: true;
}

/**
 * (harmClass × relation) → candidate ambition templates.
 *
 * Every template id here must exist in `GRIEVANCE_AMBITION_TEMPLATES` or
 * `EVENT_MINTED_AMBITION_TEMPLATES`; a schema test pins that both ways, because an id
 * naming nothing is a weight that fires zero times and looks like tuning rather than a
 * typo. A missing (class, relation) key mints nothing.
 */
export const UNDERTAKING_MINTING_RULES: Readonly<
  Record<UndertakingHarmClass, Partial<Record<MintRelation, readonly UndertakingMintRuleEntry[]>>>
> = {
  property_destroyed: {
    victim: [
      { templateId: 'ambition_seek_revenge', weight: 1.0, grievance: true },
      { templateId: 'ambition_rebuild_from_ashes', weight: 0.8 },
      { templateId: 'ambition_protect_the_home', weight: 0.6 },
      { templateId: 'ambition_flee_the_ravaged_land', weight: 0.5 },
    ],
    witness: [
      { templateId: 'ambition_protect_the_home', weight: 0.7 },
      { templateId: 'ambition_flee_the_ravaged_land', weight: 0.6 },
    ],
  },
  holding_seized: {
    victim: [
      { templateId: 'ambition_seek_revenge', weight: 0.9, grievance: true },
      { templateId: 'ambition_reclaim_homeland', weight: 1.0, grievance: true },
      { templateId: 'ambition_protect_the_home', weight: 0.5 },
    ],
    witness: [
      { templateId: 'ambition_protect_the_home', weight: 0.6 },
    ],
  },
  network_severed: {
    victim: [
      { templateId: 'ambition_seek_revenge', weight: 0.8, grievance: true },
      { templateId: 'ambition_found_anew', weight: 0.9 },
      { templateId: 'ambition_protect_the_home', weight: 0.4 },
    ],
  },
  named_death: {
    victim: [
      { templateId: 'ambition_avenge_fallen', weight: 1.0, grievance: true },
      { templateId: 'ambition_protect_the_home', weight: 0.5 },
      { templateId: 'ambition_flee_the_ravaged_land', weight: 0.4 },
    ],
    witness: [
      { templateId: 'ambition_protect_the_home', weight: 0.6 },
    ],
  },
  // Self-facing and culprit-less: the agent walked away from their own work. There is
  // nobody to avenge, so every candidate here is a soft drive — what failure leaves
  // behind is a next thing to try, which is the "failure is plot, not punishment"
  // reading of an abandoned undertaking.
  undertaking_abandoned: {
    victim: [
      { templateId: 'ambition_rebuild_from_ashes', weight: 1.0 },
      { templateId: 'ambition_found_anew', weight: 0.8 },
      { templateId: 'ambition_flee_the_ravaged_land', weight: 0.3 },
    ],
  },
};

/** Provenance stems for harm-minted drives — prose, never a class name. */
export const HARM_CLASS_LABELS: Readonly<Record<UndertakingHarmClass, string>> = {
  property_destroyed: 'the razing',
  holding_seized: 'the seizure',
  network_severed: 'the severing',
  named_death: 'the killing',
  undertaking_abandoned: 'the work abandoned',
};
