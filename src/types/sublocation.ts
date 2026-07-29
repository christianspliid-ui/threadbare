/**
 * Sublocation system types.
 *
 * Sublocations are graph nodes (type: 'location') created lazily under
 * parent locations. They organize encounters spatially and give agents
 * a motivation-driven "place" choice before encounter selection.
 *
 * Design doc: Docs/plans/2026-03-10-sublocation-system-design.md
 */

// ── Persistence ─────────────────────────────────────────────

export type TemporalTrigger =
  | 'encounter_completed'
  | 'visited'
  | { type: 'tick_expiry'; expiresAtTick: number };

export type SublocationPersistence =
  | { type: 'permanent' }
  | { type: 'temporal'; dissolvesOn: TemporalTrigger }
  | { type: 'conditional'; predicate: string };

// ── Divine Origin ───────────────────────────────────────────

export interface DivineOrigin {
  creatorGodId: string;
  purpose: string;
  createdAtTick: number;
}

// ── Node Properties ─────────────────────────────────────────

/**
 * Properties stored on a sublocation GraphNode.
 * The node itself has `type: 'location'` and is distinguished by
 * having a `sublocationTypeId` property.
 */
export interface SublocationProperties {
  sublocationTypeId: string;
  parentLocationId: string;
  persistence: SublocationPersistence;
  divineOrigin?: DivineOrigin;
  /** When true, sublocation is invisible until discovered by a Find action or agent encounter. */
  hidden?: boolean;
  /**
   * Which settlement-genome pass created this node, when the genome created it.
   * Absent on sublocations from the non-genome producers (`guildSeeding`,
   * `factionSeeding`, `phaseSublocations`, `ensureSublocations`).
   * Written by `settlementGenome/materialize.ts`.
   */
  genomeSourcePass?: 'infrastructure' | 'culture' | 'sphere' | 'reach' | 'archetype';
  /**
   * `SublocationTag`s the genome entry declared for this type. Written by
   * `settlementGenome/materialize.ts` — and frequently `[]`, since many genome
   * entries declare no tag. Only 44% of the sublocations in a seeded world carry
   * a non-empty value, so this is usable as a hint but never as a primary key
   * (see `data/sublocation-category-art.ts`).
   */
  genomeTags?: string[];
}

// ── Constants ───────────────────────────────────────────────

/** Purpose tags for divine sublocation creation. */
export const DIVINE_PURPOSES = [
  'arrange_meeting',
  'test_resolve',
  'offer_temptation',
  'reveal_truth',
  'stage_betrayal',
  'grant_sanctuary',
  'provoke_conflict',
  'bestow_vision',
] as const;

export type DivinePurpose = (typeof DIVINE_PURPOSES)[number];
