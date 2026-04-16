/**
 * Complication Types — THR-20 Cool Failure & Complication Outcome Pass
 *
 * A complication is a concrete narrative consequence attached to failure-tier
 * outcomes (success_at_cost / failure / critical_failure). Complications
 * replace the "flat negation" of failure with costly forward motion: every
 * failure changes something — the world, the agent, or both.
 *
 * ─── Constants (NFP #1: Tunability) ─────────────────────────────────
 * | Name                                    | Default | Purpose                                                  |
 * |-----------------------------------------|---------|----------------------------------------------------------|
 * | COMPLICATION_MINOR_WEIGHT               | 0.4     | Probability of attaching a minor complication on success_at_cost |
 * | COMPLICATION_REACH_AFFINITY_SCORE       | 1.0     | Score bonus for primary reach match                      |
 * | COMPLICATION_REACH_SECONDARY_SCORE      | 0.5     | Score bonus for secondary reach match                    |
 * | COMPLICATION_OMEN_SYNERGY_BONUS         | 0.3     | Score bonus when active omen matches complication category |
 * | COMPLICATION_DIMINISHING_PENALTY        | -0.5    | Penalty when agent already has same-category complication |
 * | COMPLICATION_DOOM_CONVERGENCE_BONUS     | 0.2     | Bonus for worsening_convergence at doom stage ≥ 3        |
 * | COMPLICATION_SCAR_MAX_STACK             | 2       | Max simultaneous scar-type attachments per agent         |
 * | COMPLICATION_TOAST_SEVERITY_THRESHOLD   | standard| Minimum severity to show toast notification              |
 * | COMPLICATION_CHRONICLE_SIGNIFICANCE     | 0.5     | Minimum significance for chronicle annotation            |
 * | COMPLICATION_TOP_CANDIDATES             | 3       | Number of top-scored candidates for weighted PRNG        |
 */

import type { ReachDomain } from './traits';
import type { OmenCategory } from './omen';
import type { WorldGraph } from '../engine/graph';
import type { UnifiedAction, UnifiedActionTemplate } from './unifiedAction';

// ─── Constants (NFP #1: Tunability) ──────────────────────────────────────

/** Probability that a success_at_cost outcome gains a minor complication */
export const COMPLICATION_MINOR_WEIGHT = 0.4;

/** Score bonus when an action's primary reach matches this complication's reach affinity */
export const COMPLICATION_REACH_AFFINITY_SCORE = 1.0;

/** Score bonus when an action's reach is in the complication's secondary reach affinity */
export const COMPLICATION_REACH_SECONDARY_SCORE = 0.5;

/** Score bonus when the active omen's category maps to this complication's category */
export const COMPLICATION_OMEN_SYNERGY_BONUS = 0.3;

/** Score penalty when the agent already has a complication of the same category active */
export const COMPLICATION_DIMINISHING_PENALTY = -0.5;

/** Score bonus for worsening_convergence complications when doom stage is ≥ 3 */
export const COMPLICATION_DOOM_CONVERGENCE_BONUS = 0.2;

/** Maximum simultaneous scar-type attachment conditions before scar complications are penalised */
export const COMPLICATION_SCAR_MAX_STACK = 2;

/** Minimum severity for the toast notification system to show an alert */
export const COMPLICATION_TOAST_SEVERITY_THRESHOLD: ComplicationSeverity = 'standard';

/** Minimum significanceBoost for a complication to annotate the chronicle entry */
export const COMPLICATION_CHRONICLE_SIGNIFICANCE = 0.5;

/** Top N candidates that enter the weighted-PRNG final selection */
export const COMPLICATION_TOP_CANDIDATES = 3;

// ─── Category ────────────────────────────────────────────────────────────

export type ComplicationCategory =
  | 'witness'              // Someone saw the failure — reputation/trust damage
  | 'scar'                 // The agent carries a mark — temporary condition attachment
  | 'rival_attention'      // A rival or faction takes notice
  | 'debt'                 // A cost is deferred, not avoided — obligation created
  | 'collateral_success'   // Something else happened instead — accidental discovery/bond
  | 'location_fallout'     // The place is changed — unrest, prosperity, hex effects
  | 'broken_trust'         // A relationship is damaged — trust decay, bond weakened
  | 'partial_progress'     // The goal advanced but wrong — partial step completion
  | 'worsening_convergence'; // The doom clock noticed — micro-tick, sphere pressure

export type ComplicationSeverity = 'minor' | 'standard' | 'severe';

// ─── Requirements ────────────────────────────────────────────────────────

export interface ComplicationRequirement {
  /** Requires other agents to be present at the same location */
  witnessesPresent?: boolean;
  /** Requires the actor to have at least one faction membership */
  factionRelationship?: boolean;
  /** Requires the doom stage to be at or above this level (0–4) */
  minDoomStage?: number;
  /** Requires a specific omen category to be active */
  activeOmenCategory?: OmenCategory;
  /** Requires the actor to already have a specific attachment type on them */
  hasAttachmentType?: string;
  /** Requires the location to be a settlement (hamlet/town/city/capital) */
  atSettlement?: boolean;
  /** Requires the action's reach domain to be one of these */
  reachIn?: ReachDomain[];
}

// ─── Effects ─────────────────────────────────────────────────────────────

export type ComplicationEffect =
  | { type: 'attachment'; templateId: string; duration: number }
  | { type: 'trust_decay'; magnitude: number; target: 'random_present' | 'faction_leader' }
  | { type: 'reputation_delta'; factionScope: 'local' | 'all_present'; delta: number }
  | { type: 'unrest_delta'; delta: number }
  | { type: 'prosperity_delta'; delta: number }
  | { type: 'doom_micro_tick'; magnitude: number }
  | { type: 'sphere_pressure'; sphere: string; magnitude: number }
  | { type: 'partial_progress'; fraction: number }
  | { type: 'relates_to_create'; basis: 'debt' | 'bond' | 'rivalry'; targetSelection: 'random_present' | 'faction' }
  | { type: 'rival_awareness'; delta: number }
  | { type: 'quintessence_delta'; delta: number }
  | { type: 'discovery'; discoveryType: 'location' | 'sublocation' | 'information' };

// ─── Template ─────────────────────────────────────────────────────────────

export interface ComplicationTemplate {
  /** Unique ID, e.g. 'complication.witness.agent_leverage' */
  id: string;
  category: ComplicationCategory;
  /** Human-readable name for toasts and debug */
  name: string;
  /**
   * Reaches this complication naturally pairs with (primary reach affinity).
   * A template with an empty array gets the secondary score regardless of
   * the action's reach (it's universal).
   */
  reachAffinity: ReachDomain[];
  severity: ComplicationSeverity;
  /** Contextual requirements — complication only enters the pool when met */
  requires?: ComplicationRequirement;
  effects: ComplicationEffect[];
  /**
   * Prose template strings. One is selected at random from this pool.
   * Supports placeholders: {name}, {witness}, {location}, {faction},
   * {possessive} (his/her/their), {omen_atmosphere}
   */
  proseTemplates: string[];
  /** Significance boost added to the resulting TickEvent */
  significanceBoost: number;
}

// ─── Runtime Result ───────────────────────────────────────────────────────

/** Runtime result attached to an OutcomeConsequence when a complication fired */
export interface ComplicationResult {
  /** Which template was selected */
  templateId: string;
  category: ComplicationCategory;
  severity: ComplicationSeverity;
  /** Resolved prose with placeholders filled */
  prose: string;
  /** Effects that were/will be applied */
  effects: ComplicationEffect[];
  /** Narrative tag for the prose system / chronicle */
  narrativeTag: string;
  /** Significance boost (copied from template for chronicle threshold check) */
  significanceBoost: number;
  /** Name of the complication (copied from template for toasts) */
  name: string;
}

// ─── Context ──────────────────────────────────────────────────────────────

/**
 * All data the complication selector needs, assembled at the call site in
 * `unifiedActionResolution.ts` where everything is already in scope.
 */
export interface ComplicationContext {
  /** The action being resolved */
  action: UnifiedAction;
  /** The template being executed */
  template: UnifiedActionTemplate;
  /** 0-indexed step that just resolved */
  stepIndex: number;
  /** Actor's current location ID (resolved from located_at edge) */
  locationId: string | null;
  /** Whether the location is a settlement (hamlet/town/city/capital) */
  atSettlement: boolean;
  /** IDs of other agents at the same location (for witness requirement checks) */
  presentAgentIds: string[];
  /** Actor's faction node IDs (from member_of edges) */
  factionIds: string[];
  /** Active omen category, or null when no omen is active */
  activeOmenCategory: OmenCategory | null;
  /** Current doom stage (0–4) */
  doomStage: number;
  /**
   * The actor's existing attachment template IDs (for scar-stacking checks
   * and hasAttachmentType requirement filtering).
   */
  existingAttachments: string[];
  /** Current unrest level at the location (0–1), for diminishing returns on location_fallout */
  locationUnrest: number;
  /** Seeded PRNG — must be a deterministic function of game state */
  rng: () => number;
  /** World graph (for effect application and edge queries) */
  graph: WorldGraph;
}
