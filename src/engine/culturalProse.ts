/**
 * Cultural Prose Flavor — extracts cultural vocabulary to influence prose generation.
 *
 * When an agent belongs to a culture, that culture's prose palette can influence
 * the narrative voice (30% chance of substitution). This creates subtle cultural
 * coloring without hard-overriding the sphere vocabulary.
 *
 * Source: CB-012 — Wire cultural prose palettes into the narrative engine
 */

import type { WorldGraph } from './graph';
import type { CultureIdentity } from '../types/culture';
import { CULTURAL_PROSE_PALETTES, type CulturalProsePalette } from '../data/culture-content';

// ─── Types ──────────────────────────────────────────────────────────────

export interface CulturalFlavorWords {
  verbs: string[];
  adjectives: string[];
  nouns?: string[]; // Not in CulturalProsePalette, but included for completeness
  phrases?: string[]; // Optional rhythm/greeting/oath phrases
}

// ─── Helper: Get Culture Identity ────────────────────────────────────────

/**
 * Extract culture identity from a culture node.
 */
function getCultureIdentity(graph: WorldGraph, cultureNodeId: string): CultureIdentity | null {
  const node = graph.getNode(cultureNodeId);
  if (!node || node.type !== 'actor' || (node.properties as any).actorType !== 'culture') {
    return null;
  }
  return (node.properties as any).cultureIdentity ?? null;
}

// ─── Palette Selection ───────────────────────────────────────────────────

/**
 * Select the best-matching palette for a culture based on sphere affinity.
 *
 * Priority: foundation > primary venerated sphere > default
 */
function selectPaletteForCulture(
  identity: CultureIdentity,
): CulturalProsePalette | null {
  // 1. Try foundation bias first
  const foundationKey = identity.foundationBias?.toLowerCase();
  if (foundationKey && foundationKey in CULTURAL_PROSE_PALETTES) {
    return CULTURAL_PROSE_PALETTES[foundationKey];
  }

  // 2. Try primary venerated sphere
  if (identity.veneratedSpheres && identity.veneratedSpheres.length > 0) {
    const sphereKey = identity.veneratedSpheres[0];
    if (sphereKey in CULTURAL_PROSE_PALETTES) {
      return CULTURAL_PROSE_PALETTES[sphereKey];
    }
  }

  return null;
}

// ─── Main Export: Get Cultural Flavor Words ──────────────────────────────

/**
 * Extract cultural flavor words for an actor.
 *
 * Steps:
 * 1. Follow actor's belongs_to edges to find culture nodes
 * 2. Pick the strongest (highest culturalStrength) culture
 * 3. Extract that culture's identity
 * 4. Find the best-matching palette for that identity
 * 5. Return flavor words (verbs, adjectives, phrases)
 *
 * Returns null if actor has no culture or no matching palette found.
 */
export function getCulturalFlavorWords(
  graph: WorldGraph,
  actorId: string,
): CulturalFlavorWords | null {
  // Step 1: Get all cultures the actor belongs to
  const belongsEdges = graph.getOutgoingEdges(actorId, 'belongs_to')
    .filter(e => {
      const node = graph.getNode(e.target);
      return node?.type === 'actor' && (node.properties as any).actorType === 'culture';
    });

  if (belongsEdges.length === 0) {
    return null;
  }

  // Step 2: Pick strongest culture
  const strongestEdge = belongsEdges.reduce((best, current) => {
    const bestStrength = (best.properties as any).culturalStrength ?? 0;
    const currentStrength = (current.properties as any).culturalStrength ?? 0;
    return currentStrength > bestStrength ? current : best;
  });

  const cultureNodeId = strongestEdge.target;

  // Step 3: Extract culture identity
  const identity = getCultureIdentity(graph, cultureNodeId);
  if (!identity) {
    return null;
  }

  // Step 4: Find best-matching palette
  const palette = selectPaletteForCulture(identity);
  if (!palette) {
    return null;
  }

  // Step 5: Return flavor words
  return {
    verbs: palette.verbs,
    adjectives: palette.adjectives,
    phrases: [
      ...(palette.rhythms ?? []),
      ...(palette.greetings ?? []),
      ...(palette.oaths ?? []),
    ],
  };
}

/**
 * Pick a random word from a list using a simple deterministic index.
 * Used in prose generation when substituting cultural flavor.
 */
export function pickCulturalWord(
  words: string[],
  seed: number,
): string {
  if (words.length === 0) return '';
  const index = Math.abs(seed) % words.length;
  return words[index];
}
