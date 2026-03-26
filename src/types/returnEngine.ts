/**
 * Return Engine types — peak-end convergence for The First's hero journey arc.
 *
 * System 6 from the Meet The First design doc (TB-035 Phase 3).
 * The Return fires during the Return phase (85-100% doom clock).
 * Outcome determined by: Founding Gates (hard filter) → Ordeal (dominant signal)
 * → Relationship state (tiebreaker) → Archetype default (soft tiebreaker).
 */

import type { CampbellianPhase } from './influence';
import type { OrdealOutcome, BeatOutcome, StateSnapshot } from './journeyEngine';
import type { ReachDomain } from './traits';
import type { CooperationStrategy } from './disposition';

// ─── Return Outcomes ───────────────────────────────────────────────

/** The 6 possible Return outcomes. */
export type ReturnOutcome =
  | 'loyal_ascension'
  | 'sacrifice'
  | 'vanishing'
  | 'transcendence'
  | 'usurper'
  | 'monster';

/** All return outcomes for iteration. */
export const ALL_RETURN_OUTCOMES: ReturnOutcome[] = [
  'loyal_ascension',
  'sacrifice',
  'vanishing',
  'transcendence',
  'usurper',
  'monster',
];

// ─── Constants ─────────────────────────────────────────────────────

/** Score bonus when ordeal outcome strongly favors an outcome */
export const ORDEAL_STRONG_BONUS = 3;
/** Score bonus when ordeal outcome weakly favors an outcome */
export const ORDEAL_WEAK_BONUS = 1;
/** Multiplier for trust contribution to relationship score */
export const RELATIONSHIP_TRUST_WEIGHT = 1.0;
/** Multiplier for cooperation strategy contribution */
export const RELATIONSHIP_COOPERATION_WEIGHT = 1.5;
/** Bonus for archetype's natural ending */
export const ARCHETYPE_DEFAULT_BONUS = 1;
/** Max connections receiving ripple consequences */
export const RIPPLE_MAX_TARGETS = 5;
/** Trust threshold for Usurper loyalty split in factions */
export const RIPPLE_FACTION_SPLIT_THRESHOLD = 0.4;

/** Narrative cooldown ticks after Return, by outcome */
export const RETURN_COOLDOWN: Record<ReturnOutcome, number> = {
  loyal_ascension: 3,
  sacrifice: 8,
  vanishing: 5,
  transcendence: 4,
  usurper: 6,
  monster: 10,
};

/** Maximum cooldown cap (fail-soft for distant future values) */
export const MAX_COOLDOWN_TICKS = 15;

// ─── Founding Gates ────────────────────────────────────────────────

/**
 * Founding gate definition — which meeting choice tags are required
 * for each Return outcome to be eligible.
 */
export interface FoundingGateConfig {
  /** Required gate tags (at least one must be present). Empty = no gate. */
  requiredTags: string[];
  /** Excluded intent reaches (outcome blocked if intent reach matches) */
  excludedIntentReaches?: ReachDomain[];
  /** Required intent reaches (outcome only if intent reach matches) */
  requiredIntentReaches?: ReachDomain[];
}

/**
 * Founding gate configs per outcome.
 * If requiredTags is empty, the outcome has no founding gate.
 */
export const FOUNDING_GATES: Record<ReturnOutcome, FoundingGateConfig> = {
  loyal_ascension: {
    requiredTags: ['noble', 'heroic_origin', 'duty_over_desire', 'devotion_seed'],
  },
  sacrifice: {
    requiredTags: ['noble', 'sacrifice', 'sacrifice_seed', 'duty_over_desire'],
    excludedIntentReaches: ['shadow'],
  },
  vanishing: {
    requiredTags: [], // No gate — any founding can lead to absence
  },
  transcendence: {
    requiredTags: ['transcendence_seed', 'cosmic_touch'],
    requiredIntentReaches: ['star', 'veil', 'eye'],
  },
  usurper: {
    requiredTags: ['cunning', 'dark', 'ruthless_origin', 'ambition_seed'],
    // Also eligible if archetype is Schemer/Trickster/Fallen Noble (checked separately)
  },
  monster: {
    requiredTags: ['dark', 'ruthless_origin', 'corruption_seed'],
  },
};

/** Archetype IDs that bypass the tag requirement for Usurper */
export const USURPER_BYPASS_ARCHETYPES = [
  'schemer', 'trickster', 'fallen_noble',
  'shadow_iron', 'shadow_gold', 'shadow_shadow',
  'shadow_heart', 'shadow_eye', 'shadow_veil',
];

// ─── Ordeal → Outcome Gating ──────────────────────────────────────

/** Outcomes opened by each ordeal result */
export const ORDEAL_OPENS: Record<OrdealOutcome, ReturnOutcome[]> = {
  triumph: ['loyal_ascension', 'sacrifice', 'transcendence'],
  scraped_through: ['loyal_ascension', 'sacrifice', 'vanishing', 'transcendence', 'usurper', 'monster'],
  broken: ['monster', 'vanishing', 'usurper'],
};

/** Outcomes closed by each ordeal result */
export const ORDEAL_CLOSES: Record<OrdealOutcome, ReturnOutcome[]> = {
  triumph: ['monster'],
  scraped_through: [],
  broken: ['loyal_ascension'],
};

// ─── Relationship State ────────────────────────────────────────────

/** Relationship state used for Return scoring. */
export interface ReturnRelationshipState {
  bondTier: number;
  totalEssenceSpent: number;
  interventionRatio: number;
  supportiveVsCoercive: number; // positive = more supportive, negative = more coercive
  cooperationStrategy: CooperationStrategy;
  trust: number; // -1 to 1 scale
}

// ─── Ripple Consequences ───────────────────────────────────────────

/** Categories of ripple targets */
export type RippleTargetType = 'artifact' | 'ally' | 'enemy' | 'faction' | 'location' | 'spouse';

/** A connection that will receive ripple consequences. */
export interface RippleTarget {
  /** Graph node ID */
  nodeId: string;
  /** Node name (for prose) */
  name: string;
  /** Type of connection */
  type: RippleTargetType;
  /** Significance score (for sorting/capping) */
  significance: number;
  /** Additional context for prose generation */
  context?: Record<string, unknown>;
}

/** The result of applying a ripple consequence. */
export interface RippleConsequenceResult {
  /** Target node ID */
  targetNodeId: string;
  /** Type of consequence applied */
  consequenceType: string;
  /** Prose describing the consequence */
  prose: string;
  /** Graph operations applied */
  graphOps: RippleGraphOp[];
}

/** A graph operation from a ripple consequence. */
export interface RippleGraphOp {
  type: 'update_node' | 'add_edge' | 'remove_edge' | 'update_edge' | 'add_node';
  targetId: string;
  data: Record<string, unknown>;
}

// ─── Return Resolution Result ──────────────────────────────────────

/** Full result of the Return convergence. */
export interface ReturnResolutionResult {
  /** The determined outcome */
  outcome: ReturnOutcome;
  /** Scores for each eligible outcome */
  scores: Partial<Record<ReturnOutcome, number>>;
  /** Which outcomes passed founding gates */
  foundingGateResults: Record<ReturnOutcome, boolean>;
  /** Which outcomes were eligible after ordeal filtering */
  eligibleOutcomes: ReturnOutcome[];
  /** The ordeal outcome that drove the decision */
  ordealOutcome: OrdealOutcome;
  /** Relationship state at time of return */
  relationshipState: ReturnRelationshipState;
  /** Prose for the return vignette */
  returnProse: string;
  /** Ripple consequences applied */
  rippleResults: RippleConsequenceResult[];
  /** Cooldown ticks applied to the court slot */
  cooldownTicks: number;
}

// ─── Trace Types ───────────────────────────────────────────────────

/** Trace emitted when the Return resolves. */
export interface ReturnResolutionTrace {
  type: 'return_resolution';
  tick: number;
  agentId: string;
  outcome: ReturnOutcome;
  foundingGateResults: Record<ReturnOutcome, boolean>;
  ordealOutcome: OrdealOutcome;
  relationshipState: ReturnRelationshipState;
  scores: Partial<Record<ReturnOutcome, number>>;
  eligibleOutcomes: ReturnOutcome[];
  beatHistory: BeatOutcome[];
}

/** Trace emitted for each ripple consequence. */
export interface RippleConsequenceTrace {
  type: 'ripple_consequence';
  tick: number;
  sourceAgentId: string;
  returnOutcome: ReturnOutcome;
  targetNodeId: string;
  targetName: string;
  targetType: RippleTargetType;
  consequence: string;
}
