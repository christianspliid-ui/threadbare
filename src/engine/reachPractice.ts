/**
 * Reach practice — the god's in-domain action accrual (THR-613, plan §3.1).
 *
 * Split out of `phaseAscendantProgression.ts` (THR-1811) so the unified-action resolver can
 * accrue practice without importing the progression phase, which now reads the template
 * catalog (the card ladder) — importing it from the resolver closed a module cycle through
 * `engineEffectRegistry`. `phaseAscendantProgression` re-exports both functions, so every
 * existing import keeps working.
 */

import type { WorldGraph } from './graph';
import type { ReachDomain } from '../types/traits';
import type { AscendantProperties } from '../types/influence';
import { computeReachShare } from './domainCapability';
import { difficultyScaling } from './capabilityGrowth';
import { emitTrace } from './traceBuffer';
import {
  PLAYER_PRACTICE_PER_ACTION,
  PLAYER_DIMINISHING_RETURNS_FACTOR,
  SECONDARY_REACH_PRACTICE_MULT,
} from '../data/player-progression';

type EmitInput = Parameters<typeof emitTrace>[0];

/**
 * The ascendant's permanent reaches, ranked primary-first by affinity value. Stable:
 * ties broken by reach name so the ranking is deterministic across runs.
 */
export function rankedAffinityReaches(props: AscendantProperties): ReachDomain[] {
  const affinities = props.domainAffinities;
  if (!affinities) return [];
  return (Object.entries(affinities) as [ReachDomain, number][])
    .filter(([, v]) => typeof v === 'number')
    .sort((a, b) => (b[1] - a[1]) || a[0].localeCompare(b[0]))
    .map(([reach]) => reach);
}

/**
 * Accrue reach practice for one resolved in-domain player action (plan §3.1).
 *
 * Only accrues when `reach` is one of the ascendant's two permanent reaches — a
 * universal (`star`) action fired by an off-domain god does not inflate that reach.
 * Returns the new `reachPractice[reach]` total, or `null` if nothing accrued
 * (missing node, off-domain reach).
 */
export function accruePlayerReachPractice(
  graph: WorldGraph,
  ascendantId: string,
  reach: ReachDomain,
  stepDifficulty0to1: number,
  tick: number,
): number | null {
  const node = graph.getNode(ascendantId);
  if (!node) return null;
  const props = node.properties as unknown as AscendantProperties;
  const ranked = rankedAffinityReaches(props);
  const rank = ranked.indexOf(reach);
  if (rank < 0) return null; // off-domain: no accrual (plan §3.1)

  // Damping reads the reach share (THR-1580), the same scale the tier reads below, so
  // practice slows across the whole raw 0–40 range rather than flooring at raw ~15.
  const currentCap = computeReachShare(graph, ascendantId, reach);
  const diffScale = difficultyScaling(stepDifficulty0to1 * 100);
  const diminishing = Math.max(1 - currentCap * PLAYER_DIMINISHING_RETURNS_FACTOR, 0.1);
  const secondaryMult = rank >= 1 ? SECONDARY_REACH_PRACTICE_MULT : 1;
  const delta = PLAYER_PRACTICE_PER_ACTION * diffScale * diminishing * secondaryMult;

  const bag: Partial<Record<ReachDomain, number>> = { ...(props.reachPractice ?? {}) };
  const total = (bag[reach] ?? 0) + delta;
  bag[reach] = total;
  node.properties.reachPractice = bag;

  emitTrace({
    category: 'ascendant.progression.practice',
    tick,
    turn: tick,
    reach,
    delta,
    total,
    summary: `reach practice ${reach} +${delta.toFixed(3)} (now ${total.toFixed(3)})`,
  } as unknown as EmitInput);

  return total;
}
