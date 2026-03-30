/**
 * CONTENT MANAGER — Opposition Tension Scoring Data
 *
 * Sphere opposition matrices, archetype friction pairs, and
 * scoring constants for the narrative context builder.
 *
 * Design doc: Docs/plans/2026-03-07-narrative-context-builder-design.md
 * Parent doc: Docs/plans/2026-03-06-narrative-context-pipeline.md §2
 */
import type { SphereName } from '../types/index';

// ─── Types ──────────────────────────────────────────────────────

export type FoundationSphere = 'chaos' | 'order' | 'light' | 'darkness';

export interface CreationSphereTension {
  sphereA: SphereName;
  sphereB: SphereName;
  score: number;
  narrativeReason: string;
}

export interface ArchetypeFrictionPair {
  archetypeA: string;
  archetypeB: string;
  score: number;
  narrativeReason: string;
}

// ─── Foundation Sphere Opposition Matrix ────────────────────────

export const FOUNDATION_OPPOSITION_MATRIX: Record<FoundationSphere, Record<FoundationSphere, number>> = {
  chaos:    { chaos: 0, order: 5, light: 2, darkness: 2 },
  order:    { chaos: 5, order: 0, light: 2, darkness: 2 },
  light:    { chaos: 2, order: 2, light: 0, darkness: 5 },
  darkness: { chaos: 2, order: 2, light: 5, darkness: 0 },
};

// ─── Creation Sphere Tension Pairs ──────────────────────────────

export const CREATION_SPHERE_TENSIONS: CreationSphereTension[] = [
  { sphereA: 'force',  sphereB: 'mind',    score: 3, narrativeReason: 'Brute strength vs. cunning strategy' },
  { sphereA: 'life',   sphereB: 'entropy', score: 4, narrativeReason: 'Growth vs. decay — the oldest tension' },
  { sphereA: 'energy', sphereB: 'spirit',  score: 2, narrativeReason: 'Physical power vs. ethereal transcendence' },
  { sphereA: 'matter', sphereB: 'time',    score: 2, narrativeReason: 'Permanence vs. change' },
];

// ─── Archetype Friction Pairs ───────────────────────────────────

export const ARCHETYPE_FRICTION_PAIRS: ArchetypeFrictionPair[] = [
  { archetypeA: 'true_believer', archetypeB: 'trickster',      score: 5, narrativeReason: 'Faith vs. irreverence' },
  { archetypeA: 'oathkeeper',    archetypeB: 'schemer',        score: 5, narrativeReason: 'Honor vs. manipulation' },
  { archetypeA: 'noble_savage',  archetypeB: 'poisoned_court', score: 4, narrativeReason: 'Raw honesty vs. civilized corruption' },
  { archetypeA: 'maker',         archetypeB: 'monster',        score: 4, narrativeReason: 'Creation vs. destruction' },
  { archetypeA: 'doomed_innocent', archetypeB: 'monster',      score: 4, narrativeReason: 'Vulnerability vs. predation' },
  { archetypeA: 'reluctant_king', archetypeB: 'kingmaker',     score: 3, narrativeReason: 'Resisting power vs. wielding it through others' },
  { archetypeA: 'seeker',        archetypeB: 'true_believer',  score: 3, narrativeReason: 'Questioning vs. faith' },
  { archetypeA: 'folk_hero',     archetypeB: 'fallen_noble',   score: 3, narrativeReason: 'Common virtue vs. aristocratic failure' },
  { archetypeA: 'wanderer',      archetypeB: 'oathkeeper',     score: 3, narrativeReason: 'Rootlessness vs. absolute commitment' },
];

// ─── Scoring Constants ──────────────────────────────────────────

export const PROXIMITY_SCORES = {
  same_location: 3,
  adjacent: 2,
  same_region: 1,
  graph_connected: 0.5,
} as const;

export const INVOLVEMENT_SCORES = {
  direct_participant: 5,
  causal: 3,
  owner_creator: 2,
  atmospheric: 1,
} as const;

/** Harvest hop radius by narrative tier */
export const HARVEST_LIMITS = {
  notable: 1,
  chronicle: 2,
} as const;

/** Selection count range by narrative tier */
export const SELECTION_LIMITS = {
  notable:   { min: 2, max: 3 },
  chronicle: { min: 4, max: 5 },
} as const;

/** Max objects from any single category in selection */
export const CATEGORY_CAP = 2;

// ─── Lookup Functions ───────────────────────────────────────────

export function getFoundationOpposition(a: string, b: string): number {
  const matrix = FOUNDATION_OPPOSITION_MATRIX as Record<string, Record<string, number>>;
  return matrix[a]?.[b] ?? 0;
}

export function getCreationSphereTension(a: SphereName, b: SphereName): number {
  const pair = CREATION_SPHERE_TENSIONS.find(
    t => (t.sphereA === a && t.sphereB === b) || (t.sphereA === b && t.sphereB === a)
  );
  return pair?.score ?? 0;
}

export function getArchetypeFriction(a: string, b: string): number {
  const pair = ARCHETYPE_FRICTION_PAIRS.find(
    p => (p.archetypeA === a && p.archetypeB === b) || (p.archetypeA === b && p.archetypeB === a)
  );
  return pair?.score ?? 0;
}
