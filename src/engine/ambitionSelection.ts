/**
 * Ambition Selection Funnel
 *
 * Two-filter pipeline that selects ambitions for an agent from the candidate pool.
 * Filter 1 ("Can I?") gates on capability. Filter 2 ("Should I?") scores by context.
 *
 * NFP #1: Tunability - SPHERE_MATCH_BONUS and TRAIT_BOOST_BONUS are exported constants.
 * NFP #3: Determinism - tie-breaking uses seeded mulberry32 PRNG.
 */

import type { AmbitionTemplate } from '../types/ambition';
import type { ReachDomain } from '../types/traits';
import type { SphereName } from '../types/index';
import { mulberry32 } from '../lib/prng';

// Tunable Constants
export const SPHERE_MATCH_BONUS = 0.3;
export const TRAIT_BOOST_BONUS = 0.2;

// Agent Snapshot
export interface AmbitionAgentSnapshot {
  domainCapabilities: Record<ReachDomain, number>;
  traits: string[];
  culturalSpheres: SphereName[];
  bonds: Array<{ bondType: string }>;
}

// Scored Result
export interface ScoredAmbition {
  readonly templateId: string;
  readonly score: number;
}

// Selection Config
export interface AmbitionSelectionConfig {
  readonly seed: number;
  readonly threshold: number;
  readonly maxAmbitions: number;
}

/**
 * Filter 1: "Can I?"
 * Gate templates by agent capability.
 * Agent must meet every reachFloor, have every requiredTrait, and lack every blockingTrait.
 */
export function filterByCapability(
  templates: readonly AmbitionTemplate[],
  agent: AmbitionAgentSnapshot,
): AmbitionTemplate[] {
  return templates.filter((t) => {
    // Check all reach floors
    for (const [domain, floor] of Object.entries(t.reachFloors) as [ReachDomain, number][]) {
      if ((agent.domainCapabilities[domain] ?? 0) < floor) return false;
    }
    // Check all required traits
    for (const trait of t.requiredTraits) {
      if (!agent.traits.includes(trait)) return false;
    }
    // Check all blocking traits
    for (const trait of t.blockingTraits) {
      if (agent.traits.includes(trait)) return false;
    }
    return true;
  });
}

/**
 * Filter 2: "Should I?"
 * Score templates by contextual fit: cultural spheres, bonds, and boosting traits.
 */
export function scoreByContext(
  templates: readonly AmbitionTemplate[],
  agent: AmbitionAgentSnapshot,
): ScoredAmbition[] {
  return templates.map((t) => {
    let score = 0;

    // CulturalFit: +SPHERE_MATCH_BONUS per matching sphere affinity
    for (const sphere of t.sphereAffinities) {
      if (agent.culturalSpheres.includes(sphere)) {
        score += SPHERE_MATCH_BONUS;
      }
    }

    // BondFit: bondModifier.modifier * count of matching bonds
    for (const bm of t.bondModifiers) {
      const count = agent.bonds.filter((b) => b.bondType === bm.bondType).length;
      score += bm.modifier * count;
    }

    // TraitBoost: +TRAIT_BOOST_BONUS per matching boosting trait
    for (const trait of t.boostingTraits) {
      if (agent.traits.includes(trait)) {
        score += TRAIT_BOOST_BONUS;
      }
    }

    return { templateId: t.id, score };
  });
}

/**
 * Full pipeline: capability gate -> contextual scoring -> threshold -> sort -> deterministic tie-break -> cap.
 */
export function selectAmbitions(
  templates: readonly AmbitionTemplate[],
  agent: AmbitionAgentSnapshot,
  config: AmbitionSelectionConfig,
): ScoredAmbition[] {
  // Filter 1
  const capable = filterByCapability(templates, agent);

  // Filter 2
  const scored = scoreByContext(capable, agent);

  // Apply threshold
  const aboveThreshold = scored.filter((s) => s.score >= config.threshold);

  // Sort descending by score
  aboveThreshold.sort((a, b) => b.score - a.score);

  // Deterministic tie-breaking: group by score, shuffle ties
  const rng = mulberry32(config.seed);
  const result: ScoredAmbition[] = [];
  let i = 0;
  while (i < aboveThreshold.length) {
    // Collect all items tied at this score
    const tieScore = aboveThreshold[i].score;
    const tied: ScoredAmbition[] = [];
    while (i < aboveThreshold.length && aboveThreshold[i].score === tieScore) {
      tied.push(aboveThreshold[i]);
      i++;
    }
    // Fisher-Yates shuffle on tied group
    for (let j = tied.length - 1; j > 0; j--) {
      const k = Math.floor(rng() * (j + 1));
      [tied[j], tied[k]] = [tied[k], tied[j]];
    }
    result.push(...tied);
  }

  return result.slice(0, config.maxAmbitions);
}
