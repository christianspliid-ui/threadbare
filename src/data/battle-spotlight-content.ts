/**
 * Battle Spotlight Encounter Templates — TB-073 Phase 4.
 *
 * 9 spotlight templates for battle narrative beats. Spotlights are spawned
 * programmatically by the battle tick system when conditions are met.
 * They are NOT discoverable by agents — `visibleTo: []`.
 *
 * Each template has:
 * - A `condition` function that evaluates current battle state
 * - `threshold: true` means it fires at most once per battle
 * - Steps use Iron/Heart/Shadow/Veil reaches for intervention
 * - `momentumOnSuccess`/`momentumOnFailure` are read by battleResolution.ts
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 3
 *
 * Note: Condition helper functions are defined inline here (not imported from
 * battleSpotlights.ts) to avoid a circular dependency between the two modules.
 */

import type { GameState } from '../types/gameState';
import type { BattleState } from '../types/battle';

// ─── Template Shape ──────────────────────────────────────────────────────────

export interface SpotlightTemplate {
  /** Unique ID — used as spotlightHistory entry key */
  id: string;
  /** Display name */
  name: string;
  /** Prose description shown to player */
  narrative: string;
  /** Reaches tested in the intervention steps */
  reaches: string[];
  /**
   * Condition function — returns true when this template is eligible.
   * Evaluated each tick before spotlight selection.
   */
  condition: (state: GameState, battleNodeId: string, bs: BattleState) => boolean;
  /**
   * If true, this spotlight fires at most once per battle.
   * The battle's `thresholdsFired` set tracks which have fired.
   */
  threshold?: boolean;
  /**
   * Momentum shifts for player intervention outcomes.
   * positive = attacker gains, negative = defender gains.
   */
  momentumOnSuccess: number;
  momentumOnFailure: number;
}

// ─── Momentum Constants ───────────────────────────────────────────────────────

const SPOTLIGHT_MOMENTUM_MINOR = 1;   // Small nudge
const SPOTLIGHT_MOMENTUM_MAJOR = 3;   // Significant turn
const SPOTLIGHT_MOMENTUM_CRITICAL = 4; // Battle-defining

// ─── Condition Helpers (inline — no circular imports) ────────────────────────

/**
 * Check if a battle participant army has quintessence below a percentage.
 * Used by last_stand condition.
 */
function armyBelowQPercent(state: GameState, armyId: string, pct: number): boolean {
  const node = state.graph.getNode(armyId);
  if (!node) return false;
  const army = node.properties.armyState as { quintessence: number; quintessenceMax: number } | undefined;
  if (!army || army.quintessenceMax <= 0) return false;
  return army.quintessence / army.quintessenceMax < pct;
}

/**
 * Check if both armies have commanders at Iron Tier 5+.
 * Used by champion_duel condition.
 */
function bothCommandersChampionTier(
  state: GameState,
  _battleNodeId: string,
  bs: BattleState,
): boolean {
  return hasCommanderAtTier(state, bs.attackerArmyId, 5)
    && hasCommanderAtTier(state, bs.defenderArmyId, 5);
}

function hasCommanderAtTier(state: GameState, armyId: string, minTier: number): boolean {
  const graph = state.graph;
  const cmdEdges = graph.getOutgoingEdges(armyId, 'commanded_by');
  for (const edge of cmdEdges) {
    const cmdNode = graph.getNode(edge.target);
    if (!cmdNode) continue;
    const caps = cmdNode.properties.capabilities as Record<string, { tier: number }> | undefined;
    const ironTier = caps?.iron?.tier ?? 0;
    if (ironTier >= minTier) return true;
  }
  return false;
}

/**
 * Check if a rival ascendant is invested in this battle (has thread to participant).
 * Used by divine_counterstrike condition.
 */
function rivalAscendantInvested(state: GameState, battleNodeId: string): boolean {
  const graph = state.graph;
  const myAscendantId = state.ascendantId;

  const rivals = graph.getNodesByType('actor')
    .filter(n => n.properties.actorType === 'ascendant' && n.id !== myAscendantId);

  const participantEdges = graph.getIncomingEdges(battleNodeId, 'participates_in');
  const participantIds = new Set(participantEdges.map(e => e.source));

  for (const rival of rivals) {
    const rivalThreads = graph.getOutgoingEdges(rival.id, 'thread');
    for (const t of rivalThreads) {
      if (participantIds.has(t.target)) return true;
    }
  }
  return false;
}

/**
 * Check if any new army arrived at the battle this tick (joinedTick === state.tick).
 * "New" requires more than 2 participants (attacker + defender + newcomer).
 */
function newArmyArrivedThisTick(state: GameState, battleNodeId: string): boolean {
  const graph = state.graph;
  const edges = graph.getIncomingEdges(battleNodeId, 'participates_in');
  if (edges.length <= 2) return false;
  return edges.some(e => (e.properties.joinedTick as number | undefined) === state.tick);
}

// ─── Spotlight Templates ─────────────────────────────────────────────────────

export const BATTLE_SPOTLIGHT_TEMPLATES: SpotlightTemplate[] = [

  // 1. Commander Peril — attacker is losing badly (momentum < -3)
  {
    id: 'battle.spotlight.commander_peril',
    name: 'Commander in Peril',
    narrative: 'The commanding general is surrounded and cut off. A daring rescue or rally could turn the tide — but failure means losing the army\'s heart.',
    reaches: ['iron', 'heart'],
    condition: (_state, _battleNodeId, bs) => bs.momentum < -3,
    threshold: false,
    momentumOnSuccess: SPOTLIGHT_MOMENTUM_MAJOR,
    momentumOnFailure: -SPOTLIGHT_MOMENTUM_MINOR,
  },

  // 2. Turning Point — battle is balanced on a knife-edge (|momentum| < 2)
  {
    id: 'battle.spotlight.turning_point',
    name: 'Turning Point',
    narrative: 'The battle hangs in the balance. Both sides are exhausted. A single decisive act could break the deadlock.',
    reaches: ['iron', 'veil'],
    condition: (_state, _battleNodeId, bs) => Math.abs(bs.momentum) < 2,
    threshold: false,
    momentumOnSuccess: SPOTLIGHT_MOMENTUM_MAJOR,
    momentumOnFailure: -SPOTLIGHT_MOMENTUM_MINOR,
  },

  // 3. Moral Dilemma — victory is within reach but requires a sacrifice
  {
    id: 'battle.spotlight.moral_dilemma',
    name: 'The Price of Victory',
    narrative: 'Victory is possible — but at a cost that will haunt the survivors. Harsh orders could secure the win. Mercy might cost everything.',
    reaches: ['heart', 'shadow'],
    condition: (_state, _battleNodeId, bs) => bs.momentum >= 3,
    threshold: true,
    momentumOnSuccess: SPOTLIGHT_MOMENTUM_MINOR,
    momentumOnFailure: -SPOTLIGHT_MOMENTUM_MINOR,
  },

  // 4. Betrayal — treachery erupts in the middle of battle
  {
    id: 'battle.spotlight.betrayal',
    name: 'Betrayal in the Ranks',
    narrative: 'A unit breaks ranks. Word spreads: someone sold intelligence to the enemy. A swift investigation might contain the damage.',
    reaches: ['shadow', 'veil'],
    condition: (_state, _battleNodeId, bs) => bs.momentum > -4 && bs.momentum < 4,
    threshold: true,
    momentumOnSuccess: SPOTLIGHT_MOMENTUM_MINOR,
    momentumOnFailure: -SPOTLIGHT_MOMENTUM_MAJOR,
  },

  // 5. Artifact Activation — a significant artifact is present and active
  {
    id: 'battle.spotlight.artifact_activation',
    name: 'The Relic Awakens',
    narrative: 'An artifact in the possession of one of the commanders begins to pulse with power. Its influence could reshape the battle — or be turned against its bearer.',
    reaches: ['veil', 'iron'],
    condition: (state, battleNodeId, _bs) => {
      const graph = state.graph;
      const participantEdges = graph.getIncomingEdges(battleNodeId, 'participates_in');
      for (const edge of participantEdges) {
        const bondedEdges = graph.getOutgoingEdges(edge.source, 'bonded_to');
        if (bondedEdges.length > 0) return true;
      }
      return false;
    },
    threshold: true,
    momentumOnSuccess: SPOTLIGHT_MOMENTUM_CRITICAL,
    momentumOnFailure: -SPOTLIGHT_MOMENTUM_MINOR,
  },

  // 6. Third Army — a new force arrives on the battlefield
  {
    id: 'battle.spotlight.third_army',
    name: 'Unexpected Reinforcements',
    narrative: 'A third force appears on the horizon. Their allegiance is unclear. Diplomacy could bring them to your side — or reveal them as a new threat.',
    reaches: ['heart', 'gold'],
    condition: (state, battleNodeId, _bs) => newArmyArrivedThisTick(state, battleNodeId),
    threshold: false,
    momentumOnSuccess: SPOTLIGHT_MOMENTUM_MAJOR,
    momentumOnFailure: -SPOTLIGHT_MOMENTUM_MAJOR,
  },

  // 7. Divine Counterstrike — a rival ascendant is investing in this battle
  {
    id: 'battle.spotlight.divine_counterstrike',
    name: 'Divine Opposition',
    narrative: 'Another god stirs. Their influence threads through the enemy ranks, sharpening their resolve and dulling your champions. A counter-blessing may restore the balance.',
    reaches: ['veil', 'heart'],
    condition: (state, battleNodeId, _bs) => rivalAscendantInvested(state, battleNodeId),
    threshold: false,
    momentumOnSuccess: SPOTLIGHT_MOMENTUM_MAJOR,
    momentumOnFailure: -SPOTLIGHT_MOMENTUM_MINOR,
  },

  // 8. Last Stand — an army's quintessence drops below 20%
  {
    id: 'battle.spotlight.last_stand',
    name: 'Last Stand',
    narrative: 'The soldiers are broken and bleeding. Only raw defiance keeps them on their feet. Inspire them now, or watch them scatter.',
    reaches: ['heart', 'iron'],
    condition: (state, _battleNodeId, bs) =>
      armyBelowQPercent(state, bs.attackerArmyId, 0.2)
      || armyBelowQPercent(state, bs.defenderArmyId, 0.2),
    threshold: true,
    momentumOnSuccess: SPOTLIGHT_MOMENTUM_MAJOR,
    momentumOnFailure: -SPOTLIGHT_MOMENTUM_MINOR,
  },

  // 9. Champion Duel — both commanders are Iron Tier 5+
  {
    id: 'battle.spotlight.champion_duel',
    name: 'Trial by Combat',
    narrative: 'The two commanders face each other across the carnage. A duel between champions could end this battle cleanly — if your champion prevails.',
    reaches: ['iron', 'veil'],
    condition: (state, battleNodeId, bs) => bothCommandersChampionTier(state, battleNodeId, bs),
    threshold: true,
    momentumOnSuccess: SPOTLIGHT_MOMENTUM_CRITICAL,
    momentumOnFailure: -SPOTLIGHT_MOMENTUM_CRITICAL,
  },
];
