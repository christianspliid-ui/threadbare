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
