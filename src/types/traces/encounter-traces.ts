import type { ReachDomain } from '../traits';
import type { ValuePair } from '../agent';
import type { BranchPoleKey } from '../unifiedAction';
// Type-only, and deliberately circular: `trace.ts` names these interfaces as
// `TraceEntry` members (THR-1065) while they extend its base. `import type` is
// erased at build, so the cycle never reaches the module graph.
import type { TraceBase } from '../trace';
// Same rule, one layer further out (THR-1117): `HandFilteredTrace` declares the
// prereq code its emitter actually sends, and that code is owned by the hand
// filter. `import type` is erased at build, so the types → engine direction
// never reaches the module graph either.
import type { HandFilterPrereqCode } from '../../engine/encounters/handFilter';

export type EncounterChoiceCost =
  | 'small_breath'
  | 'fuller_breath'
  | 'deep_draught';

export type EncounterOutcomeBand =
  | 'critical_fail'
  | 'fail'
  | 'fail_forward'
  | 'success'
  | 'critical_success';

export type ForecastTier =
  | 'doomed'
  | 'perilous'
  | 'uncertain'
  | 'favorable'
  | 'fated';

export type DriftThresholdBand = 'soft' | 'banner' | 'becoming';
export type DetectionThresholdBand = 'notice' | 'turn' | 'encounter';
export type SpotlightTrigger = 'world_handoff' | 'manual_select' | 'beat_advancement';
export type ArchetypePole = 'virtue' | 'flaw';

export interface ChoiceResolvedTrace extends TraceBase {
  category: 'choice_resolved';
  tick: number;
  encounterId: string;
  beatIndex: number;
  agentId: string;
  reach: ReachDomain;
  cost: EncounterChoiceCost;
  probabilityTilt: number;
  driftMagnitude: number;
  moralAxisPole: ArchetypePole;
  consumesItem?: string;
  outcomeBand: EncounterOutcomeBand;
  rolledD100: number;
  effectiveProbability: number;
  /**
   * Resulting live axis position after the choice's drift is applied (THR-528):
   * clamp(baseline + drift) on the ±1 axis scale. Undefined when the actor has no
   * baseline profile. Lets an inspector see where the choice *moved* the agent.
   */
  livePosition?: number;
}

export interface ForecastComputedTrace extends TraceBase {
  category: 'forecast_computed';
  tick: number;
  encounterId: string;
  beatIndex: number;
  baseProbability: number;
  modifiers: Array<{ source: string; delta: number }>;
  finalTier: ForecastTier;
  /**
   * Verified correct as declared (THR-1117). The emitter sends
   * `computeForecast(...).factors`, and `OutcomeForecast.factors` is `string[]` —
   * `sanitizeFactorPool` trims, de-duplicates and drops non-strings before
   * `slice`. The authored beat field is the tuple `EncounterForecastFactors`,
   * but that shape is consumed at the *call* to `computeForecast`, never emitted
   * here, so the trace's own contract needed no change.
   */
  factors: string[];
}

export interface HandFilteredTrace extends TraceBase {
  category: 'hand_filtered';
  tick: number;
  encounterId: string;
  totalDeckSize: number;
  playableCount: number;
  dimmedCount: number;
  hiddenCount: number;
  rarePulses: string[];
  /**
   * Which cards, not merely how many (THR-1117, NFP #2 Inspectability). The
   * emitter in `phaseAscendantHandFilter` has sent all three since the trace was
   * authored while the interface declared only the counts; a cast at the
   * `emitTrace` boundary kept that divergence from ever surfacing. Declaring
   * them is the fix rather than dropping them — they answer *which* card was
   * unplayable and *why*, which no count can.
   */
  playableTemplateIds: string[];
  /** Dimmed cards carry the prereq stage-code that gated each one. */
  dimmedTemplateIds: Array<{ templateId: string; prereq: HandFilterPrereqCode }>;
  /**
   * Hidden cards are target mismatches only (`HandFilterHiddenCode` has the
   * single member `target_mismatch`), so the emitter sends bare ids — there is
   * no varying reason to carry alongside them.
   */
  hiddenTemplateIds: string[];
}

export interface DriftThresholdCrossedTrace extends TraceBase {
  category: 'drift_threshold_crossed';
  tick: number;
  agentId: string;
  axisId: string;
  fromPosition: number;
  toPosition: number;
  thresholdCrossed: DriftThresholdBand;
  pole: ArchetypePole;
}

/**
 * One agent-decided branch resolution (THR-894).
 *
 * Emitted once per decided fork, carrying every input that produced the pole so
 * an inspector can answer "why did she choose that?" without re-running the
 * tick: where the mortal already stood, what the god argued for, and whether the
 * two together were decisive or the coin had to settle it.
 */
export interface BranchDecidedTrace extends TraceBase {
  category: 'branch_decided';
  tick: number;
  agentId: string;
  templateId: string;
  /** Index of the deciding step — the branch's `branchOnStep`. */
  stepIndex: number;
  /** The `ValuePair` this fork asked about. */
  axis: ValuePair;
  /** Mortal's live position on the axis before the hand (baseline + drift). */
  profileLean: number;
  /** Net signed lean of the cards the god committed on the deciding step. */
  cardLean: number;
  /** `profileLean + cardLean` — the number the pole was read off. */
  netLean: number;
  /** The pole the mortal took. */
  resolvedPole: BranchPoleKey;
  /**
   * How the pole was settled: `conviction` when the net lean cleared the neutral
   * band, `coin` when it did not and the seeded draw decided.
   */
  decidedBy: 'conviction' | 'coin';
  /** Drift axis key the decision wrote to, or absent when the axis has none. */
  driftAxisId?: string;
}

export interface DetectionThresholdCrossedTrace extends TraceBase {
  category: 'detection_threshold_crossed';
  tick: number;
  regionId: string;
  fromPressure: number;
  toPressure: number;
  thresholdCrossed: DetectionThresholdBand;
}

export interface ItemConsumedByChoiceTrace extends TraceBase {
  category: 'item_consumed_by_choice';
  tick: number;
  encounterId: string;
  beatIndex: number;
  agentId: string;
  itemId: string;
}

export interface SpotlightChangedTrace extends TraceBase {
  category: 'spotlight_changed';
  tick: number;
  fromAgentId?: string;
  toAgentId: string;
  trigger: SpotlightTrigger;
}

export interface CallbackEligibilityComputedTrace extends TraceBase {
  category: 'callback_eligibility_computed';
  tick: number;
  encounterId: string;
  beatIndex: number;
  agentId: string;
  authorPinnedCount: number;
  graphDerivedCount: number;
  selectedEventIds: string[];
}

export type EncounterExperienceTraceEntry =
  | ChoiceResolvedTrace
  | ForecastComputedTrace
  | HandFilteredTrace
  | DriftThresholdCrossedTrace
  | DetectionThresholdCrossedTrace
  | ItemConsumedByChoiceTrace
  | SpotlightChangedTrace
  | CallbackEligibilityComputedTrace;
