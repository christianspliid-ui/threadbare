/**
 * Ambition Selection Funnel — two-filter scoring for agent ambition assignment.
 *
 * Filter 1 ("Can I?"): reach floors, required traits, blocking traits.
 * Filter 2 ("Should I?"): sphere affinity, bond modifiers, boosting traits → score.
 *
 * Pure function — reads templates + agent snapshot, returns scored selections.
 */
import type { AmbitionTemplate } from '../types/ambition';
import type { ReachDomain } from '../types/traits';
import type { SphereName } from '../types/index';
import type { AxiologicalProfile } from '../types/agent';
import { signedToCanonical01 } from '../types/axisRegistry';
import {
  AMBITION_CULTURAL_SPHERE_WEIGHT,
  AMBITION_BOOSTING_TRAIT_WEIGHT,
  AMBITION_SELECTION_JITTER,
  POLE_AFFINITY_WEIGHT,
} from '../data/ambition-selection-constants';

// ─── Seeded PRNG ──────────────────────────────────────────────────
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Agent Snapshot (read-only view for selection) ───────────────

export interface AmbitionAgentSnapshot {
  readonly domainCapabilities: Record<ReachDomain, number>;
  readonly traits: readonly string[];
  readonly culturalSpheres: readonly SphereName[];
  readonly bonds: readonly { bondType: string }[];
  /**
   * The agent's value standings, in **signed ±1** storage (THR-1298).
   *
   * Optional so an older caller or a fixture without one scores exactly as before —
   * the pole term simply contributes nothing rather than reading zeroes as maximum
   * vice, which is what a `Record` defaulted to `{}` would have done.
   */
  readonly axiologicalProfile?: AxiologicalProfile;
}

// ─── Selection Options ──────────────────────────────────────────

export interface SelectionOptions {
  readonly maxAmbitions: number;
  readonly threshold: number;
  readonly seed: number;
}

// ─── Selection Result ───────────────────────────────────────────

export interface AmbitionSelection {
  readonly templateId: string;
  readonly score: number;
}

// ─── Filter 1: "Can I?" ────────────────────────────────────────

export function passesEligibility(
  template: AmbitionTemplate,
  agent: AmbitionAgentSnapshot,
): boolean {
  // Check reach floors
  for (const [reach, floor] of Object.entries(template.reachFloors)) {
    const agentValue = agent.domainCapabilities[reach as ReachDomain] ?? 0;
    if (agentValue < (floor as number)) return false;
  }

  // Check required traits
  for (const trait of template.requiredTraits) {
    if (!agent.traits.includes(trait)) return false;
  }

  // Check blocking traits
  for (const trait of template.blockingTraits) {
    if (agent.traits.includes(trait)) return false;
  }

  return true;
}

// ─── Filter 2: "Should I?" — scoring ───────────────────────────

export function scoreDesirability(
  template: AmbitionTemplate,
  agent: AmbitionAgentSnapshot,
  rng: () => number,
): number {
  let score = 0;

  // Sphere affinity: one step per matching cultural sphere
  for (const sphere of template.sphereAffinities) {
    if (agent.culturalSpheres.includes(sphere)) {
      score += AMBITION_CULTURAL_SPHERE_WEIGHT;
    }
  }

  // Bond modifiers: +modifier per matching bond type
  for (const bm of template.bondModifiers) {
    const matchCount = agent.bonds.filter(b => b.bondType === bm.bondType).length;
    score += matchCount * bm.modifier;
  }

  // Boosting traits: one step per matching trait
  for (const trait of template.boostingTraits) {
    if (agent.traits.includes(trait)) {
      score += AMBITION_BOOSTING_TRAIT_WEIGHT;
    }
  }

  // Reach affinity overlap: average of (agent reach * template affinity)
  const affinityEntries = Object.entries(template.reachAffinity);
  if (affinityEntries.length > 0) {
    let affinitySum = 0;
    for (const [reach, weight] of affinityEntries) {
      const agentValue = agent.domainCapabilities[reach as ReachDomain] ?? 0;
      affinitySum += agentValue * (weight as number);
    }
    score += affinitySum / affinityEntries.length;
  }

  // Value-pole affinity: does this drive sound like who they are? (THR-1298)
  //
  // **The two-scale mapping, pinned.** `AxiologicalProfile` stores **signed ±1**
  // (virtue +1, vice −1). The canonical axis scale is **0–1 with 0.5 neutral**. The
  // only legal bridge between them is `signedToCanonical01` — an open-coded
  // `(v + 1) / 2` here would be a defect even though it computes the same number,
  // because the clamping and the single point of truth are the reason the bridge
  // exists. A `vice` lean is the complement of the virtue reading, so both poles are
  // scored off one conversion rather than two sign conventions.
  if (template.poleAffinities && agent.axiologicalProfile) {
    for (const affinity of template.poleAffinities) {
      const signed = agent.axiologicalProfile[affinity.valuePair];
      // A pair the profile does not carry contributes nothing — never a default of 0,
      // which would read on the canonical scale as 0.5 and quietly award half credit.
      if (typeof signed !== 'number') continue;
      const virtue01 = signedToCanonical01(signed);
      const alignment01 = affinity.pole === 'virtue' ? virtue01 : 1 - virtue01;
      score += POLE_AFFINITY_WEIGHT * affinity.weight * alignment01;
    }
  }

  // Small random jitter to break ties
  score += rng() * AMBITION_SELECTION_JITTER;

  return score;
}

// ─── Main Selection Function ────────────────────────────────────

/**
 * Select ambitions for an agent from the template pool.
 *
 * 1. Filter by eligibility ("Can I?")
 * 2. Score by desirability ("Should I?")
 * 3. Return top N above threshold, sorted by score descending.
 */
export function selectAmbitions(
  templates: readonly AmbitionTemplate[],
  agent: AmbitionAgentSnapshot,
  options: SelectionOptions,
): AmbitionSelection[] {
  const rng = mulberry32(options.seed);

  // Filter 1: eligibility
  const eligible = templates.filter(t => passesEligibility(t, agent));

  // Filter 2: score and rank
  const scored: AmbitionSelection[] = eligible.map(t => ({
    templateId: t.id,
    score: scoreDesirability(t, agent, rng),
  }));

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Apply threshold and limit
  return scored
    .filter(s => s.score >= options.threshold)
    .slice(0, options.maxAmbitions);
}
