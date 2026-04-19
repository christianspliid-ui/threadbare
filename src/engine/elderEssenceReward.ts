/**
 * Elder Essence Reward — grants essence to the ascendant god.
 *
 * Two paths:
 *   1. Hidden Site Revelation (TB-043) — elder sites spread across 4 foundation
 *      spheres; non-elder sites grant a smaller reward to the spirit sphere.
 *   2. Ruin Transformation / Consumption (THR-153) — full / half / quarter
 *      multipliers applied to the elder base reward depending on consequence.
 *
 * NFP compliance:
 *   #1 Tunability: reward amounts are named constants
 *   #2 Inspectability: emits ruins.elder_essence_awarded trace per reward
 *   #3 Determinism: pure function of inputs (mutations to essencePool are caller's job)
 *   #4 Fail-soft: NaN/Infinity clamped, missing sphere → zero delta
 */
import type { SphereName } from '../types/index';
import type { EssencePool } from '../types/influence';
import type { HiddenSiteRevealResult } from './revelationResolver';
import { emitTrace } from './traceBuffer';
import {
  ELDER_SITE_ESSENCE_REWARD,
  HIDDEN_SITE_ESSENCE_REWARD,
} from '../data/agent-behavior-constants';

// Foundation spheres that receive elder magic essence
const FOUNDATION_SPHERES: SphereName[] = ['chaos', 'order', 'light', 'darkness'];

export interface EssenceRewardResult {
  readonly deltas: Partial<Record<SphereName, number>>;
  readonly totalReward: number;
}

/** How an essence award is split across spheres. */
export type EssenceDistributionMode = 'foundation_spread' | 'single_sphere';

/** Upstream source that triggered the award — drives trace provenance. */
export type EssenceAwardSource =
  | 'hidden_site_reveal'
  | 'ruin_transformed'
  | 'ruin_consumed'
  | 'ruin_catastrophic';

export interface AwardElderEssenceInput {
  /** Future-proof: multi-ascendant support. Empty string for unbound pools. */
  readonly ascendantId: string;
  readonly amount: number;
  readonly distributionMode: EssenceDistributionMode;
  /** Required when distributionMode === 'single_sphere'. */
  readonly sphere?: SphereName;
  readonly source: EssenceAwardSource;
  readonly tick: number;
  readonly essencePool: EssencePool;
}

/** Ceiling for awards — guards against NaN/Infinity propagating to pools. */
const AWARD_UPPER_BOUND = ELDER_SITE_ESSENCE_REWARD * 2;

/**
 * Generic essence-award core. Computes per-sphere deltas and emits trace.
 * Does NOT mutate `essencePool` — the caller applies `deltas` to state.
 */
export function awardElderEssence(input: AwardElderEssenceInput): EssenceRewardResult {
  const deltas: Partial<Record<SphereName, number>> = {};

  // Fail-soft: clamp NaN/Infinity/negative amounts
  let amount = input.amount;
  if (!Number.isFinite(amount) || amount < 0) amount = 0;
  if (amount > AWARD_UPPER_BOUND) amount = AWARD_UPPER_BOUND;

  if (input.distributionMode === 'foundation_spread') {
    const perSphere = amount / FOUNDATION_SPHERES.length;
    for (const sphere of FOUNDATION_SPHERES) {
      deltas[sphere] = perSphere;
    }
  } else {
    const sphere = input.sphere ?? 'spirit';
    deltas[sphere] = amount;
  }

  emitTrace({
    category: 'ruins.elder_essence_awarded',
    tick: input.tick,
    ascendantId: input.ascendantId,
    totalAmount: amount,
    distributionMode: input.distributionMode,
    source: input.source,
    summary: `Elder essence award: ${amount.toFixed(1)} via ${input.source} (${input.distributionMode})`,
  });

  return { deltas, totalReward: amount };
}

/**
 * Compute essence reward for a hidden site discovery.
 * Thin wrapper over `awardElderEssence` for backward compat (TB-043 call site).
 * Elder sites distribute reward across 4 foundation spheres equally;
 * non-elder sites grant a smaller reward to the spirit sphere.
 */
export function computeElderEssenceReward(
  reveal: HiddenSiteRevealResult,
  tick: number,
  essencePool?: EssencePool,
): EssenceRewardResult {
  const result = awardElderEssence({
    ascendantId: '',
    amount: reveal.hasElderMagic ? ELDER_SITE_ESSENCE_REWARD : HIDDEN_SITE_ESSENCE_REWARD,
    distributionMode: reveal.hasElderMagic ? 'foundation_spread' : 'single_sphere',
    sphere: reveal.hasElderMagic ? undefined : 'spirit',
    source: 'hidden_site_reveal',
    tick,
    essencePool: essencePool ?? ({} as EssencePool),
  });

  // Preserve the legacy `revelation/ruins_essence_reward` trace emitted by
  // the pre-refactor code so downstream consumers keep working.
  emitTrace({
    tick,
    category: 'revelation',
    type: 'ruins_essence_reward',
    summary: `Essence reward ${result.totalReward.toFixed(1)} for ${reveal.sublocationName} (elder=${reveal.hasElderMagic})`,
    sublocationId: reveal.sublocationId,
    totalReward: result.totalReward,
    hasElderMagic: reveal.hasElderMagic,
  } as any);

  return result;
}
