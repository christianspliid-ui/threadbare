/**
 * Elder Essence Reward — grants essence when hidden sites are discovered.
 *
 * Elder magic sites distribute reward across the 4 foundation spheres.
 * Non-elder sites grant a smaller reward to the spirit sphere.
 *
 * NFP compliance:
 *   #1 Tunability: reward amounts are named constants
 *   #2 Inspectability: emits ruins_discovery trace per reward
 *   #3 Determinism: pure function of inputs
 *   #4 Fail-soft: missing essencePool → no crash, returns empty deltas
 */
import type { SphereName } from '../types/index';
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

/**
 * Compute essence reward for a hidden site discovery.
 * Elder sites distribute reward across 4 foundation spheres equally.
 * Non-elder sites grant a smaller reward to the spirit sphere.
 */
export function computeElderEssenceReward(
  reveal: HiddenSiteRevealResult,
  tick: number,
): EssenceRewardResult {
  const deltas: Partial<Record<SphereName, number>> = {};
  let totalReward: number;

  if (reveal.hasElderMagic) {
    totalReward = ELDER_SITE_ESSENCE_REWARD;
    const perSphere = totalReward / FOUNDATION_SPHERES.length;
    for (const sphere of FOUNDATION_SPHERES) {
      deltas[sphere] = perSphere;
    }
  } else {
    totalReward = HIDDEN_SITE_ESSENCE_REWARD;
    deltas.spirit = totalReward;
  }

  emitTrace({
    tick,
    category: 'revelation',
    type: 'ruins_essence_reward',
    summary: `Essence reward ${totalReward.toFixed(1)} for ${reveal.sublocationName} (elder=${reveal.hasElderMagic})`,
    sublocationId: reveal.sublocationId,
    totalReward,
    hasElderMagic: reveal.hasElderMagic,
  } as any);

  return { deltas, totalReward };
}
