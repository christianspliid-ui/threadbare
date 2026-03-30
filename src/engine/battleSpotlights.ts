/**
 * Battle Spotlights — Thread-based battle visibility and spotlight selection.
 *
 * When the player's ascendant has a thread-of-fate edge to a battle participant,
 * spotlight encounters are eligible for first-person POV narration.
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 3
 * NFP: Determinism (selectSpotlight uses seeded PRNG), Inspectability (clear boolean check),
 *       Fail-soft (missing nodes → false/null).
 */

import type { BattleState } from '../types/battle';
import { WorldGraph } from './graph';

// ─── Spotlight Templates ────────────────────────────────────────────────────

/** Minimal spotlight template for battle encounters */
export interface SpotlightTemplate {
  id: string;
  battleTypes: Array<'field_battle' | 'siege'>;
  /** Minimum absolute momentum for this template to be eligible */
  minMomentum?: number;
}

/**
 * Default spotlight encounter template pool.
 * Minimal set — content expansion in future phases.
 */
export const SPOTLIGHT_TEMPLATES: SpotlightTemplate[] = [
  { id: 'spotlight.duel', battleTypes: ['field_battle', 'siege'] },
  { id: 'spotlight.heroic_stand', battleTypes: ['field_battle', 'siege'], minMomentum: 4 },
  { id: 'spotlight.wall_breach', battleTypes: ['siege'], minMomentum: 3 },
];

// ─── Thread Visibility ───────────────────────────────────────────────────────

/**
 * Check if the player's ascendant has a thread-of-fate edge to any battle participant.
 * Thread edges go ascendant → mortal (source=ascendant, target=mortal).
 * Battle participants = both army nodes + their commanders.
 *
 * Fail-soft: missing nodes → returns false.
 */
export function hasThreadToBattle(
  ascendantId: string,
  battleState: BattleState,
  graph: WorldGraph,
): boolean {
  // Get all mortals the ascendant has threads to
  const threadEdges = graph.getOutgoingEdges(ascendantId, 'thread');
  if (threadEdges.length === 0) return false;
  const threadTargetIds = new Set(threadEdges.map(e => e.target));

  // Collect all battle participants: both armies + their commanders
  const participantIds: string[] = [
    battleState.attackerArmyId,
    battleState.defenderArmyId,
  ];

  // Add commanders via commanded_by edges (army → commander)
  for (const armyId of [battleState.attackerArmyId, battleState.defenderArmyId]) {
    const cmdEdges = graph.getOutgoingEdges(armyId, 'commanded_by');
    for (const e of cmdEdges) {
      participantIds.push(e.target);
    }
  }

  // Check intersection
  return participantIds.some(id => threadTargetIds.has(id));
}

// ─── Spotlight Selection ─────────────────────────────────────────────────────

/**
 * Select a spotlight encounter template from the eligible pool.
 * Returns null if no templates are eligible or if ascendant has no thread.
 *
 * Selection is deterministic for the same seed and battle state (NFP #3).
 */
export function selectSpotlight(
  ascendantId: string,
  battleState: BattleState,
  graph: WorldGraph,
  rng: () => number,
): string | null {
  // No thread → no spotlight
  if (!hasThreadToBattle(ascendantId, battleState, graph)) return null;

  // Filter eligible templates by battle type and momentum
  const absMomentum = Math.abs(battleState.momentum);
  const eligible = SPOTLIGHT_TEMPLATES.filter(t => {
    if (!t.battleTypes.includes(battleState.battleType)) return false;
    if (t.minMomentum !== undefined && absMomentum < t.minMomentum) return false;
    // Exclude already-used templates
    if (battleState.spotlightHistory.includes(t.id)) return false;
    return true;
  });

  if (eligible.length === 0) return null;

  // Seeded selection (NFP #3 — determinism)
  const index = Math.floor(rng() * eligible.length);
  return eligible[index].id;
}
