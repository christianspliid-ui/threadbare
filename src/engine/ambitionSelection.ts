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

function passesEligibility(
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

function scoreDesirability(
  template: AmbitionTemplate,
  agent: AmbitionAgentSnapshot,
  rng: () => number,
): number {
  let score = 0;

  // Sphere affinity: +0.2 per matching cultural sphere
  for (const sphere of template.sphereAffinities) {
    if (agent.culturalSpheres.includes(sphere)) {
      score += 0.2;
    }
  }

  // Bond modifiers: +modifier per matching bond type
  for (const bm of template.bondModifiers) {
    const matchCount = agent.bonds.filter(b => b.bondType === bm.bondType).length;
    score += matchCount * bm.modifier;
  }

  // Boosting traits: +0.15 per matching trait
  for (const trait of template.boostingTraits) {
    if (agent.traits.includes(trait)) {
      score += 0.15;
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

  // Small random jitter to break ties
  score += rng() * 0.05;

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
