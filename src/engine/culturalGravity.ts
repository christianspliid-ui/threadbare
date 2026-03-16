/**
 * Cultural Gravity — measures alignment/opposition between two cultural signatures.
 *
 * Pure function, deterministic, symmetric: gravity(a, b) === gravity(b, a).
 * Returns a value in [-1, 1] where positive = cultural affinity, negative = tension.
 */

import type { SphereName } from '../types';
import type { ReachDomain } from '../types/traits';
import { REACH_DOMAINS } from '../types/traits';
import type { CultureIdentity } from '../types/culture';

// ─── CulturalSignature ─────────────────────────────────────────

export interface CulturalSignature {
  readonly spheres: readonly SphereName[];
  readonly reaches: Record<ReachDomain, number>;
  readonly foundation?: string;
}

// ─── Tunable Constants ──────────────────────────────────────────

export const GRAVITY_SPHERE_WEIGHT = 0.4;
export const GRAVITY_REACH_WEIGHT = 0.4;
export const GRAVITY_FOUNDATION_WEIGHT = 0.2;

// ─── Opposition Maps ────────────────────────────────────────────

const SPHERE_OPPOSITIONS: ReadonlyMap<SphereName, SphereName> = new Map([
  ['life', 'entropy'],
  ['entropy', 'life'],
  ['force', 'mind'],
  ['mind', 'force'],
  ['matter', 'spirit'],
  ['spirit', 'matter'],
  ['energy', 'time'],
  ['time', 'energy'],
]);

const FOUNDATION_OPPOSITIONS: ReadonlyMap<string, string> = new Map([
  ['Chaos', 'Order'],
  ['Order', 'Chaos'],
  ['Light', 'Darkness'],
  ['Darkness', 'Light'],
]);

// ─── Scoring Helpers ────────────────────────────────────────────

/**
 * Sphere alignment: shared spheres contribute +1.0, opposing pairs contribute -0.5.
 * Normalized by max(|A|, |B|) to stay in roughly [-1, 1].
 * Returns 0 if either signature has no spheres.
 */
function sphereAlignment(a: readonly SphereName[], b: readonly SphereName[]): number {
  if (a.length === 0 || b.length === 0) return 0;

  const setB = new Set(b);
  let score = 0;
  let pairs = 0;

  for (const s of a) {
    if (setB.has(s)) {
      score += 1.0;
      pairs++;
    } else if (setB.has(SPHERE_OPPOSITIONS.get(s)!)) {
      score -= 0.5;
      pairs++;
    }
  }

  const maxPairs = Math.max(a.length, b.length);
  return score / maxPairs;
}

/**
 * Cosine similarity of two 9-dimensional reach vectors.
 * Returns 0 if either vector has zero magnitude (avoids NaN).
 */
function reachAlignment(a: Record<ReachDomain, number>, b: Record<ReachDomain, number>): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (const d of REACH_DOMAINS) {
    const va = a[d] ?? 0;
    const vb = b[d] ?? 0;
    dot += va * vb;
    magA += va * va;
    magB += vb * vb;
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;
  return dot / denom;
}

/**
 * Foundation alignment: same = +0.5, opposing = -0.5, missing either = 0.
 */
function foundationAlignment(a: string | undefined, b: string | undefined): number {
  if (a == null || b == null) return 0;
  if (a === b) return 0.5;
  if (FOUNDATION_OPPOSITIONS.get(a) === b) return -0.5;
  return 0;
}

// ─── Main Function ──────────────────────────────────────────────

/**
 * Compute cultural gravity between two signatures.
 * Positive = cultural affinity, negative = cultural tension.
 * Always returns a value clamped to [-1, 1].
 */
export function culturalGravity(sigA: CulturalSignature, sigB: CulturalSignature): number {
  const sphere = sphereAlignment(sigA.spheres, sigB.spheres);
  const reach = reachAlignment(sigA.reaches, sigB.reaches);
  const foundation = foundationAlignment(sigA.foundation, sigB.foundation);

  const gravity =
    GRAVITY_SPHERE_WEIGHT * sphere +
    GRAVITY_REACH_WEIGHT * reach +
    GRAVITY_FOUNDATION_WEIGHT * foundation;

  return Math.max(-1, Math.min(1, gravity));
}

// ─── Signature Extraction Helpers ───────────────────────────────

/**
 * Extract a CulturalSignature from a CultureIdentity (generated at world-seeding time).
 */
export function extractCultureSignature(identity: CultureIdentity): CulturalSignature {
  return {
    spheres: identity.veneratedSpheres,
    reaches: identity.reachPreferences,
    foundation: identity.foundationBias,
  };
}

/**
 * Extract a CulturalSignature from an ambition template.
 * Fills unspecified reach domains with 0.
 */
export function extractAmbitionSignature(template: {
  sphereAffinities: readonly SphereName[];
  reachAffinity: Partial<Record<ReachDomain, number>>;
}): CulturalSignature {
  const reaches = Object.fromEntries(
    REACH_DOMAINS.map((d) => [d, template.reachAffinity[d] ?? 0]),
  ) as Record<ReachDomain, number>;

  return {
    spheres: template.sphereAffinities,
    reaches,
    foundation: undefined,
  };
}
