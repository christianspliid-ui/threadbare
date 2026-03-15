/**
 * Cultural Tension Detection.
 *
 * Detects 4 types of cultural tension for narrative context scoring:
 * - mismatch: actor's culture differs from location's current culture
 * - conquest: location's historical culture differs from current
 * - dual: actor has two cultures at similar strength
 * - fanaticism: actor with strength >= 0.8 encounters different culture
 *
 * Source: Docs/plans/2026-03-06-culture-bounded-context-design.md §8
 */

import type { WorldGraph } from './graph';
import type { CultureIdentity } from '../types/culture';
import { culturalGravity, extractCultureSignature } from './culturalGravity';

// ─── Types ──────────────────────────────────────────────────────

export interface CulturalTension {
  type: 'mismatch' | 'conquest' | 'dual' | 'fanaticism';
  cultureIds: string[];
  severity: number;
}

// ─── Constants ──────────────────────────────────────────────────

export const CULTURAL_TENSION_SCORES = {
  mismatch: 3,
  conquest: 4,
  dual: 2,
  fanaticism: 3,
} as const;

const DUAL_CULTURE_THRESHOLD = 0.15; // max diff between strengths to count as "balanced"
const FANATICISM_THRESHOLD = 0.8;

// ─── Helpers ────────────────────────────────────────────────────

function getActorCultureEdges(graph: WorldGraph, actorId: string) {
  return graph.getOutgoingEdges(actorId, 'belongs_to')
    .filter(e => {
      const node = graph.getNode(e.target);
      return node?.type === 'actor' && (node.properties as any).actorType === 'culture';
    });
}

function getLocationCultureIds(graph: WorldGraph, locationId: string, layer?: 'historical' | 'current'): string[] {
  return graph.getOutgoingEdges(locationId, 'belongs_to')
    .filter(e => {
      const node = graph.getNode(e.target);
      if (!node || node.type !== 'actor' || (node.properties as any).actorType !== 'culture') return false;
      if (layer) return (e.properties as any).cultureLayer === layer;
      return true;
    })
    .map(e => e.target);
}

// ─── Gravity Helpers ───────────────────────────────────────────

/**
 * Retrieve CultureIdentity from a culture node's properties, if present.
 * Returns undefined when identity is missing (fail-soft).
 */
function getCultureIdentity(graph: WorldGraph, cultureNodeId: string): CultureIdentity | undefined {
  const node = graph.getNode(cultureNodeId);
  if (!node) return undefined;
  return (node.properties as any)?.identity as CultureIdentity | undefined;
}

/**
 * Compute the average pairwise gravity between two sets of culture IDs.
 * Returns undefined if any identity is missing (fail-soft: caller uses base severity).
 */
function computeAverageCulturalGravity(
  graph: WorldGraph,
  cultureIdsA: string[],
  cultureIdsB: string[],
): number | undefined {
  if (cultureIdsA.length === 0 || cultureIdsB.length === 0) return undefined;

  const identitiesA = cultureIdsA.map(id => getCultureIdentity(graph, id));
  const identitiesB = cultureIdsB.map(id => getCultureIdentity(graph, id));

  // If any identity is missing, fall back
  if (identitiesA.some(i => i == null) || identitiesB.some(i => i == null)) return undefined;

  let totalGravity = 0;
  let pairs = 0;

  for (const idA of identitiesA) {
    for (const idB of identitiesB) {
      const sigA = extractCultureSignature(idA!);
      const sigB = extractCultureSignature(idB!);
      totalGravity += culturalGravity(sigA, sigB);
      pairs++;
    }
  }

  return pairs > 0 ? totalGravity / pairs : undefined;
}

/**
 * Modulate severity by gravity: severity * (1 - gravity).
 * gravity -1 → 2x severity, gravity 0 → 1x, gravity 1 → 0x.
 */
function modulateSeverity(baseSeverity: number, gravity: number | undefined): number {
  if (gravity == null) return baseSeverity;
  return baseSeverity * (1 - gravity);
}

// ─── Detection Functions ────────────────────────────────────────

/**
 * Detect cultural mismatch between an actor and their current location.
 */
export function detectCulturalMismatch(
  graph: WorldGraph,
  actorId: string,
): CulturalTension | undefined {
  const actorCultures = getActorCultureEdges(graph, actorId);
  if (actorCultures.length === 0) return undefined;

  // Find actor's location via located_at edge
  const locEdges = graph.getOutgoingEdges(actorId, 'located_at');
  if (locEdges.length === 0) return undefined;
  const locationId = locEdges[0].target;

  const locationCurrentCultures = getLocationCultureIds(graph, locationId, 'current');
  if (locationCurrentCultures.length === 0) return undefined;

  const actorCultureIds = actorCultures.map(e => e.target);
  const overlap = actorCultureIds.some(id => locationCurrentCultures.includes(id));

  if (!overlap) {
    return {
      type: 'mismatch',
      cultureIds: [...actorCultureIds, ...locationCurrentCultures],
      severity: CULTURAL_TENSION_SCORES.mismatch,
    };
  }

  return undefined;
}

/**
 * Detect conquest tension at a location (historical != current culture).
 */
export function detectConquestTension(
  graph: WorldGraph,
  locationId: string,
): CulturalTension | undefined {
  const historical = getLocationCultureIds(graph, locationId, 'historical');
  const current = getLocationCultureIds(graph, locationId, 'current');

  if (historical.length === 0 || current.length === 0) return undefined;

  const mismatch = !historical.some(h => current.includes(h));
  if (mismatch) {
    return {
      type: 'conquest',
      cultureIds: [...historical, ...current],
      severity: CULTURAL_TENSION_SCORES.conquest,
    };
  }

  return undefined;
}

/**
 * Detect dual-culture internal tension for an actor with two similar-strength cultures.
 */
export function detectDualCultureTension(
  graph: WorldGraph,
  actorId: string,
): CulturalTension | undefined {
  const cultureEdges = getActorCultureEdges(graph, actorId);
  if (cultureEdges.length < 2) return undefined;

  // Sort by strength descending
  const sorted = cultureEdges
    .map(e => ({ id: e.target, strength: (e.properties as any).culturalStrength ?? 0 }))
    .sort((a, b) => b.strength - a.strength);

  const diff = sorted[0].strength - sorted[1].strength;
  if (diff <= DUAL_CULTURE_THRESHOLD) {
    return {
      type: 'dual',
      cultureIds: sorted.map(s => s.id),
      severity: CULTURAL_TENSION_SCORES.dual,
    };
  }

  return undefined;
}

/**
 * Detect fanaticism tension when an actor with strength >= 0.8 encounters a different culture.
 */
export function detectCulturalFanaticism(
  graph: WorldGraph,
  actorId: string,
  targetId?: string,
): CulturalTension | undefined {
  const actorCultures = getActorCultureEdges(graph, actorId);
  const maxStrength = Math.max(0, ...actorCultures.map(e => (e.properties as any).culturalStrength ?? 0));

  if (maxStrength < FANATICISM_THRESHOLD) return undefined;

  // Need a target with a different culture
  if (!targetId) return undefined;
  const targetCultures = getActorCultureEdges(graph, targetId);
  if (targetCultures.length === 0) return undefined;

  const actorCultureIds = new Set(actorCultures.map(e => e.target));
  const targetCultureIds = targetCultures.map(e => e.target);
  const differentCulture = targetCultureIds.some(id => !actorCultureIds.has(id));

  if (differentCulture) {
    return {
      type: 'fanaticism',
      cultureIds: [...actorCultureIds, ...targetCultureIds],
      severity: CULTURAL_TENSION_SCORES.fanaticism,
    };
  }

  return undefined;
}

/**
 * Compute total cultural tension score for an actor, collecting all applicable tensions.
 */
export function computeCulturalTensionScore(
  graph: WorldGraph,
  actorId: string,
  targetId?: string,
): { score: number; tensions: CulturalTension[] } {
  const tensions: CulturalTension[] = [];

  const mismatch = detectCulturalMismatch(graph, actorId);
  if (mismatch) {
    // Modulate mismatch severity by gravity between actor cultures and location cultures
    const actorCultureIds = getActorCultureEdges(graph, actorId).map(e => e.target);
    const locEdgesForMismatch = graph.getOutgoingEdges(actorId, 'located_at');
    if (locEdgesForMismatch.length > 0) {
      const locationCultureIds = getLocationCultureIds(graph, locEdgesForMismatch[0].target, 'current');
      const gravity = computeAverageCulturalGravity(graph, actorCultureIds, locationCultureIds);
      mismatch.severity = modulateSeverity(mismatch.severity, gravity);
    }
    tensions.push(mismatch);
  }

  const dual = detectDualCultureTension(graph, actorId);
  if (dual) tensions.push(dual);

  if (targetId) {
    const fanaticism = detectCulturalFanaticism(graph, actorId, targetId);
    if (fanaticism) tensions.push(fanaticism);
  }

  // Check location conquest tension
  const locEdges = graph.getOutgoingEdges(actorId, 'located_at');
  if (locEdges.length > 0) {
    const locationId = locEdges[0].target;
    const conquest = detectConquestTension(graph, locationId);
    if (conquest) {
      // Modulate conquest severity by gravity between historical and current cultures
      const historicalIds = getLocationCultureIds(graph, locationId, 'historical');
      const currentIds = getLocationCultureIds(graph, locationId, 'current');
      const gravity = computeAverageCulturalGravity(graph, historicalIds, currentIds);
      conquest.severity = modulateSeverity(conquest.severity, gravity);
      tensions.push(conquest);
    }
  }

  const score = tensions.reduce((sum, t) => sum + t.severity, 0);
  return { score, tensions };
}
