import type { ReachDomain } from './traits';
import type { ForecastTier } from './traces/encounter-traces';

export type ForeshadowingIntelligenceTier = 'unknown' | 'rumor' | 'briefed' | 'expert';

export type ForeshadowingTopMotive =
  | 'awareness'
  | 'visibility'
  | 'prereqs'
  | 'threat'
  | 'capability'
  | 'cooldown';

export type ForeshadowingInterventionKind =
  | 'whisper'
  | 'nudge'
  | 'vision'
  | 'omen'
  | 'affliction'
  | 'bless';

export interface ForeshadowingSignals {
  intelligenceTier: ForeshadowingIntelligenceTier;
  topMotive: ForeshadowingTopMotive;
  dominantReach: ReachDomain;
}

export interface EncounterForeshadowingVariantWhen {
  intelligenceTier?: ForeshadowingIntelligenceTier | ForeshadowingIntelligenceTier[];
  topMotive?: ForeshadowingTopMotive | ForeshadowingTopMotive[];
  dominantReach?: ReachDomain | ReachDomain[];
}

export interface EncounterForeshadowingVariant {
  id: string;
  when: EncounterForeshadowingVariantWhen;
  template: string;
}

export interface EncounterForeshadowingDefinition {
  variants: readonly EncounterForeshadowingVariant[];
  fallback: string;
}

export interface ForeshadowingInterventionAttribution {
  interventionId: string;
  interventionKind: ForeshadowingInterventionKind;
  tickPerformed: number;
  summary: string;
}

export interface ForeshadowingResult {
  prose: string;
  /**
   * Single-sentence render for the thread-card tooltip (the S2 pull sentence).
   * Present only on the receipt-driven path (THR-631 Phase B); undefined on the
   * authored-variant path, where callers fall back to `prose`.
   */
  tooltipProse?: string;
  variantId: string | null;
  signals: ForeshadowingSignals;
  interventionAttribution: ForeshadowingInterventionAttribution | null;
  resolvedAtTick: number;
}

export interface ForeshadowingResolutionTrace {
  category: 'foreshadowing';
  tick: number;
  agentId: string;
  encounterId: string;
  variantsConsidered: string[];
  variantPicked: string | null;
  signals: ForeshadowingSignals;
  interventionAttributionId: string | null;
  cacheHit: boolean;
  summary: string;
}

// ─── Motive Receipt (THR-631 Phase B) ───────────────────────────────────────
// The real decision causality the scorer computes each tick, kept instead of
// thrown away. Rendered into foreshadowing prose, the trace, and DebugPanel so
// "why did this agent choose this encounter" is the same answer everywhere.

/**
 * A labeled reason an agent's scorer favored the selected encounter. Each kind
 * corresponds to a `ScoredCandidate` contribution term (or a group of them).
 */
export type MotiveContributionKind =
  | 'ambition'
  | 'personality'
  | 'intel'
  | 'mark'
  | 'divine'
  | 'bond'
  | 'reputation'
  | 'resonance'
  | 'rarity'
  | 'hunch'
  | 'doom_identity'
  | 'chain'
  | 'exploration'
  | 'proximity';

export interface MotiveContribution {
  kind: MotiveContributionKind;
  /** Normalized share of the positive score mass, 0..1. */
  weight: number;
  provenance?: {
    /** Ambition node, mark node, bonded agent, faction, etc. */
    nodeId?: string;
    /** For 'divine' — feeds the intervention-attribution chip. */
    interventionId?: string;
    /** Short machine label, e.g. reach id or mark template id. */
    detail?: string;
  };
}

/**
 * The decision causality behind a single encounter selection. Stored on the
 * agent node as the `motiveReceipt` property (internal decision data → property,
 * not an edge — no system traverses encounter → "agents who chose me because X").
 * Overwritten on each new selection; serializes with the graph.
 */
export interface MotiveReceipt {
  templateId: string;
  locationId: string;
  /** Top RECEIPT_TOP_CONTRIBUTIONS contributions, ranked by weight descending. */
  contributions: MotiveContribution[];
  /** Real intel tier from the matched IntelligenceRecord reliability — NOT completionProb. */
  intelTier: ForeshadowingIntelligenceTier;
  /** Forecast tier from completionProb (reuses the vignette outcome-forecast tiers). */
  expectation: ForecastTier;
  dominantReach: ReachDomain;
  decidedAtTick: number;
}
