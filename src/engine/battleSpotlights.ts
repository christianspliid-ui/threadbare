/**
 * Battle Spotlights — TB-073 Phase 4.
 *
 * Handles thread-based POV filtering and spotlight template selection for battles.
 * Spotlights are narrative beats during battle that the player can intervene in.
 *
 * Key contracts:
 * - No threads to any participant → no spotlights (chronicle-only battle)
 * - Thread to any participant (army, commander) → spotlight eligible
 * - Selection is seeded PRNG — deterministic for same seed + tick + battle
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 3
 */

import type { GameState } from '../types/gameState';
import type { BattleState } from '../types/battle';
import { BATTLE_SPOTLIGHT_TEMPLATES } from '../data/battle-spotlight-content';
import type { SpotlightTemplate } from '../data/battle-spotlight-content';

// ─── Thread Detection ────────────────────────────────────────────────────────

/**
 * Determine whether the player (ascendant) has a thread edge to any entity
 * connected to this battle via `participates_in` or `commanded_by`.
 *
 * "Thread" means a `thread` edge from the ascendant to an agent/army.
 * If no threads → battle resolves chronicle-only with no spotlight encounters.
 */
export function hasThreadToBattle(state: GameState, battleNodeId: string): boolean {
  const graph = state.graph;
  const ascendantId = state.ascendantId;

  if (!ascendantId) return false;

  // Get all thread edges from the ascendant
  const threadEdges = graph.getOutgoingEdges(ascendantId, 'thread');
  if (threadEdges.length === 0) return false;

  const threadedEntityIds = new Set(threadEdges.map(e => e.target));

  // Check if any threaded entity participates_in this battle (directly)
  const participantEdges = graph.getIncomingEdges(battleNodeId, 'participates_in');
  for (const edge of participantEdges) {
    if (threadedEntityIds.has(edge.source)) return true;

    // Also check if a commander of the participant is threaded
    const commanderEdges = graph.getOutgoingEdges(edge.source, 'commanded_by');
    for (const cmdEdge of commanderEdges) {
      if (threadedEntityIds.has(cmdEdge.target)) return true;
    }
  }

  return false;
}

// ─── Spotlight Eligibility ───────────────────────────────────────────────────

/**
 * Return all spotlight templates eligible for the current battle state.
 *
 * Each template has a `condition` field that is evaluated against the battle state.
 * Templates that pass their condition are returned for selection.
 *
 * Fail-soft: if the battle node is missing, returns empty array.
 */
export function getEligibleSpotlights(
  state: GameState,
  battleNodeId: string,
): SpotlightTemplate[] {
  const graph = state.graph;
  const battleNode = graph.getNode(battleNodeId);
  if (!battleNode) return [];

  const bs = battleNode.properties.battleState as BattleState | undefined;
  if (!bs) return [];

  // Filter out already-fired thresholds to prevent repeats
  const firedIds = new Set(bs.thresholdsFired ?? []);

  return BATTLE_SPOTLIGHT_TEMPLATES.filter(template => {
    // Skip if this threshold-type spotlight has already fired
    if (template.threshold && firedIds.has(template.id)) return false;

    // Evaluate the template condition against current battle state
    return template.condition(state, battleNodeId, bs);
  });
}

// ─── Spotlight Selection ─────────────────────────────────────────────────────

/**
 * Select a spotlight template using seeded PRNG.
 *
 * 1. Get all eligible templates
 * 2. If none → return null (skip this tick)
 * 3. If one → return it directly
 * 4. If multiple → use seeded PRNG to pick
 *
 * PRNG seed: state.seed + tick * 59 + battleNodeId.length (same as battleResolution.ts)
 * Deterministic: same seed + same tick + same battle = same selection.
 */
export function selectSpotlight(
  state: GameState,
  battleNodeId: string,
): string | null {
  const eligible = getEligibleSpotlights(state, battleNodeId);

  if (eligible.length === 0) return null;
  if (eligible.length === 1) return eligible[0].id;

  // Seeded PRNG selection
  const rng = mulberry32(state.seed + state.tick * 59 + battleNodeId.length);
  const index = Math.floor(rng() * eligible.length);
  return eligible[index].id;
}

// ─── PRNG (local — mirrors battleResolution.ts) ──────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Re-export template type for convenience ─────────────────────────────────

export type { SpotlightTemplate };
