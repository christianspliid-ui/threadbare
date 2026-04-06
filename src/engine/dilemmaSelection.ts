/**
 * Dilemma Selection Engine V2 — multi-axis resonance scoring.
 *
 * Replaces the single-axis picker from meetingEncounter.selectDilemmas().
 * Selects 2-3 dilemmas per encounter from different categories, scored
 * by Hunger resonance, Drive resonance, and anti-resonance bonus.
 *
 * Deterministic via seeded PRNG (NFP #3).
 */

import type { EnrichedDilemmaTemplate } from '../types/meetingEncounter';
import type { AscendantLens } from '../types/hunger';
import type { ReachDomain } from '../types/traits';
import type { SphereName } from '../types/index';
import { REACH_VALUE_PAIR } from '../types/agent';

// ─── Constants (NFP #1) ─────────────────────────────────────────

/** Weight multiplier for hunger resonance tag overlap */
export const HUNGER_RESONANCE_WEIGHT = 2.0;

/** Weight multiplier for drive resonance tag overlap */
export const DRIVE_RESONANCE_WEIGHT = 3.0;

/** Probability of selecting a 3rd dilemma slot */
export const THIRD_DILEMMA_PROBABILITY = 0.6;

/** Probability of picking the lowest-resonance template instead of highest */
export const ANTI_RESONANCE_PROBABILITY = 0.15;

// ─── Seeded PRNG (NFP #3) ──────────────────────────────────────

/**
 * Create a seeded PRNG — same algorithm as meetingEncounter.ts.
 * Produces deterministic float in [0, 1) from a base seed + salt string.
 */
function createSeededRng(baseSeed: number, salt: string): () => number {
  let h = baseSeed;
  for (let i = 0; i < salt.length; i++) {
    h = ((h << 5) - h + salt.charCodeAt(i)) | 0;
  }
  let s = h;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Resonance Scoring ──────────────────────────────────────────

/**
 * Score a dilemma template's resonance with the ascendant's lens.
 *
 * Counts tag overlap between:
 *   - template.resonance.hungerResonance vs lens.hunger.dilemmaResonanceTags (× HUNGER_RESONANCE_WEIGHT)
 *   - template.resonance.driveResonance vs lens.driveTags (× DRIVE_RESONANCE_WEIGHT)
 *
 * Returns 0 for no overlap.
 */
export function scoreDilemmaResonance(
  template: EnrichedDilemmaTemplate,
  lens: AscendantLens,
): number {
  const hungerTags = new Set(lens.hunger.dilemmaResonanceTags);
  const driveTags = new Set(lens.driveTags);

  let score = 0;

  // Hunger resonance overlap
  for (const tag of template.resonance.hungerResonance) {
    if (hungerTags.has(tag)) {
      score += HUNGER_RESONANCE_WEIGHT;
    }
  }

  // Drive resonance overlap
  for (const tag of template.resonance.driveResonance) {
    if (driveTags.has(tag)) {
      score += DRIVE_RESONANCE_WEIGHT;
    }
  }

  return score;
}

// ─── Template Selection Helpers ─────────────────────────────────

/**
 * Pick the best (or worst, for anti-resonance) template from a pool.
 * Adds tiny PRNG jitter to break ties deterministically.
 */
function pickFromPool(
  pool: readonly EnrichedDilemmaTemplate[],
  lens: AscendantLens,
  rng: () => number,
  antiResonance: boolean,
): EnrichedDilemmaTemplate | undefined {
  if (pool.length === 0) return undefined;

  // Score all templates with tiny jitter for tie-breaking
  const scored = pool.map((t) => ({
    template: t,
    score: scoreDilemmaResonance(t, lens) + rng() * 0.001,
  }));

  // Sort by score
  scored.sort((a, b) => b.score - a.score);

  // Anti-resonance: pick the lowest instead of highest
  if (antiResonance) {
    return scored[scored.length - 1].template;
  }

  return scored[0].template;
}

// ─── Main Selection Function ────────────────────────────────────

/**
 * Select 2-3 dilemmas for a meeting encounter, scored by resonance
 * with the ascendant's Hunger and Drive.
 *
 * Slot 1: Axiological — filtered to the primary reach's value pair.
 * Slot 2: Reach-specific — filtered to primaryReach.
 * Slot 3 (optional, ~60% chance): Domain-specific (primarySphere) or General.
 *
 * Within each slot, templates are scored by resonance with the ascendant lens.
 * Anti-resonance bonus: ~15% chance of picking a low-resonance template.
 */
export function selectDilemmasV2(
  library: readonly EnrichedDilemmaTemplate[],
  primaryReach: ReachDomain,
  primarySphere: SphereName,
  lens: AscendantLens,
  seed: number,
  excludeIds?: readonly string[],
): EnrichedDilemmaTemplate[] {
  const rng = createSeededRng(seed, 'dilemma-select-v2');
  const result: EnrichedDilemmaTemplate[] = [];
  const excluded = new Set(excludeIds ?? []);
  const targetValuePair = REACH_VALUE_PAIR[primaryReach];

  // ── Slot 1: Axiological ──
  const axiologicalPool = library.filter(
    (t) =>
      t.category === 'axiological' &&
      t.targetValuePair === targetValuePair &&
      !excluded.has(t.id),
  );

  const antiRoll1 = rng() < ANTI_RESONANCE_PROBABILITY;
  const slot1 = pickFromPool(axiologicalPool, lens, rng, antiRoll1);
  if (slot1) {
    result.push(slot1);
    excluded.add(slot1.id);
    // Track incompatibilities
    for (const inc of slot1.resonance.incompatibleWith) {
      excluded.add(inc);
    }
  }

  // ── Slot 2: Reach-specific ──
  const reachPool = library.filter(
    (t) =>
      t.category === 'reach_specific' &&
      t.targetReach === primaryReach &&
      !excluded.has(t.id),
  );

  const antiRoll2 = rng() < ANTI_RESONANCE_PROBABILITY;
  const slot2 = pickFromPool(reachPool, lens, rng, antiRoll2);
  if (slot2) {
    result.push(slot2);
    excluded.add(slot2.id);
    for (const inc of slot2.resonance.incompatibleWith) {
      excluded.add(inc);
    }
  }

  // ── Slot 3 (optional, ~60% chance) ──
  if (rng() < THIRD_DILEMMA_PROBABILITY) {
    // Try domain-specific first, fall back to general
    let slot3Pool = library.filter(
      (t) =>
        t.category === 'domain_specific' &&
        t.targetSphere === primarySphere &&
        !excluded.has(t.id),
    );

    if (slot3Pool.length === 0) {
      slot3Pool = library.filter(
        (t) => t.category === 'general' && !excluded.has(t.id),
      );
    }

    const antiRoll3 = rng() < ANTI_RESONANCE_PROBABILITY;
    const slot3 = pickFromPool(slot3Pool, lens, rng, antiRoll3);
    if (slot3) {
      result.push(slot3);
      excluded.add(slot3.id);
      for (const inc of slot3.resonance.incompatibleWith) {
        excluded.add(inc);
      }
    }
  }

  return result;
}
