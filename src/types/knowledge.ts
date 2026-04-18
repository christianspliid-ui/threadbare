/**
 * Knowledge edge types for the ruins layer (THR-149).
 * Clues are sibling edges to knows_secret_of (THR-30) — they coexist, not replace.
 */

/** How a clue was obtained */
export type ClueSource =
  | 'library_research'   // found in a book at a library sublocation
  | 'tavern_rumor'       // overheard at a tavern hub
  | 'treasure_map'       // diegetic item — parchment, gloss, mason's-mark
  | 'spy_debrief'        // from spy network (shared with secrets)
  | 'divine_whisper'     // from a god's Compose-a-Clue action
  | 'encounter_outcome'  // produced as a branch outcome of a reach-gated encounter
  | 'faction_dossier';   // faction-internal intelligence share

/** How precisely a clue locates its target */
export type CluePrecision = 'vague' | 'narrowed' | 'located';

/** Properties stored on a `knows_clue_of` graph edge (knower → target ruin) */
export interface KnowsClueOfEdgeProperties {
  /** 0.0 (wisp of rumor) → 1.0 (exact map) */
  magnitude: number;
  precision: CluePrecision;
  source: ClueSource;
  discoveredTick: number;
  /** Set true when the knower initiates a delve at target; edge then pruned */
  consumed: boolean;
  consumedTick?: number;
  /** Human-readable detail generated at discovery time */
  detail?: string;
  /** If composed by a god, the god's id — enables divine_mark spillover */
  composedByGodId?: string;
}
