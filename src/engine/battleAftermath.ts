/**
 * Battle Aftermath — TB-073 Phase 5.
 *
 * When battles/sieges resolve, destruction is applied scaled by outcome
 * severity. Affects trade routes, prosperity, settlement tier, sublocations,
 * sphere pressure, and commander fate.
 *
 * Design doc: Docs/plans/2026-03-29-conflict-and-destruction-design.md — Phase 5
 * NFP: Tunability (all thresholds named), Determinism (commander fate seeded PRNG),
 *       Inspectability (DestructionTrace), Fail-soft (missing data → skip effect).
 */

import type { GameState } from '../types/gameState';
import type { BattleState, BattleResolutionType } from '../types/battle';
import type { ArmyState } from '../types/army';
import { emitTrace } from './traceBuffer';
import { disbandArmy } from './armyAttrition';

// ─── PRNG ───────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Types ──────────────────────────────────────────────────────────────

export type DestructionSeverity = 'minor' | 'major' | 'total';

export type CommanderFate = 'retreated' | 'captured' | 'killed';

// ─── Constants ──────────────────────────────────────────────────────────

/** Momentum magnitude for total destruction */
export const TOTAL_DESTRUCTION_THRESHOLD = 10;

/** Momentum magnitude for major destruction */
export const MAJOR_DESTRUCTION_THRESHOLD = 6;

/** Prosperity reduction on minor defeat */
export const PROSPERITY_LOSS_MINOR = 0.20;

/** Prosperity reduction on major defeat */
export const PROSPERITY_LOSS_MAJOR = 0.50;

/** How long a captured commander is out of play */
export const COMMANDER_CAPTURE_DURATION = 10;

/** Probability of commander death on total defeat */
export const COMMANDER_DEATH_CHANCE_TOTAL = 0.30;

/** Refugee encounters at neighbors on major defeat */
export const REFUGEE_GENERATION_MAJOR = 1;

/** More refugees on total destruction */
export const REFUGEE_GENERATION_TOTAL = 3;

// ─── Severity Calculation ───────────────────────────────────────────────

/**
 * Calculate destruction severity from final momentum and loser's remaining strength.
 */
export function calculateDestructionSeverity(
  finalMomentum: number,
  loserQuintessencePercent: number,
): DestructionSeverity {
  const magnitude = Math.abs(finalMomentum);
  if (magnitude >= TOTAL_DESTRUCTION_THRESHOLD && loserQuintessencePercent < 0.15) return 'total';
  if (magnitude >= MAJOR_DESTRUCTION_THRESHOLD) return 'major';
  return 'minor';
}

// ─── Commander Fate ─────────────────────────────────────────────────────

/**
 * Determine what happens to the losing commander.
 * Minor: always retreat. Major: 50/50 capture/escape. Total: 30% death, 70% capture.
 */
export function determineCommanderFate(
  severity: DestructionSeverity,
  rng: () => number,
): CommanderFate {
  switch (severity) {
    case 'minor':
      return 'retreated';
    case 'major': {
      const roll = rng();
      return roll < 0.5 ? 'captured' : 'retreated';
    }
    case 'total': {
      const roll = rng();
      return roll < COMMANDER_DEATH_CHANCE_TOTAL ? 'killed' : 'captured';
    }
  }
}

// ─── Aftermath Application ──────────────────────────────────────────────

/**
 * Apply aftermath consequences when a battle/siege resolves.
 *
 * Called by resolveBattle after determining the outcome.
 */
export function applyAftermath(
  state: GameState,
  battleState: BattleState,
  resolutionType: BattleResolutionType,
): void {
  const graph = state.graph;

  if (resolutionType === 'stalemate') {
    // Stalemate: minor consequences, both sides withdraw
    emitTrace({
      tick: state.tick,
      category: 'faction_ambition',
      summary: `Battle stalemate — both sides withdraw with minor damage`,
      event: 'aftermath_stalemate',
    });
    return;
  }

  // Determine winner and loser
  const isAttackerVictory = resolutionType === 'attacker_victory';
  const victorArmyId = isAttackerVictory ? battleState.attackerArmyId : battleState.defenderArmyId;
  const loserArmyId = isAttackerVictory ? battleState.defenderArmyId : battleState.attackerArmyId;

  const loserNode = graph.getNode(loserArmyId);
  const loserState = loserNode?.properties.armyState as ArmyState | undefined;
  const loserQPercent = loserState
    ? loserState.quintessence / Math.max(1, loserState.quintessenceMax)
    : 0;

  const severity = calculateDestructionSeverity(
    battleState.momentum,
    loserQPercent,
  );

  const rng = mulberry32(state.seed + state.tick * 73 + battleState.startedTick);

  // ── Settlement effects (for sieges) ──
  const settlementId = battleState.settlementId;
  const settlementNode = settlementId ? graph.getNode(settlementId) : null;
  let prosperityBefore = 0;
  let prosperityAfter = 0;
  let sublocationsDestroyed: string[] = [];
  let tradeRoutesSevered: string[] = [];

  if (settlementNode && isAttackerVictory) {
    // Prosperity damage
    prosperityBefore = (settlementNode.properties.prosperity as number) ?? 0;
    const prosperityLoss = severity === 'total' ? 1.0
      : severity === 'major' ? PROSPERITY_LOSS_MAJOR
      : PROSPERITY_LOSS_MINOR;
    prosperityAfter = severity === 'total' ? 0 : Math.max(0, prosperityBefore * (1 - prosperityLoss));

    graph.updateNode(settlementId!, {
      properties: { prosperity: prosperityAfter },
    });

    // Settlement tier downgrade (major/total)
    if (severity === 'major' || severity === 'total') {
      const currentSubtype = settlementNode.properties.locationSubtype as string;
      const downgraded = downgradeSettlement(currentSubtype, severity);
      if (downgraded !== currentSubtype) {
        graph.updateNode(settlementId!, {
          properties: { locationSubtype: downgraded },
        });
      }
    }

    // Sublocation destruction (major: 1-2, total: all)
    const sublocations = graph.getOutgoingEdges(settlementId!, 'contains')
      .map(e => e.target)
      .filter(id => graph.getNode(id)?.type === 'location');

    if (severity === 'total') {
      sublocationsDestroyed = [...sublocations];
    } else if (severity === 'major' && sublocations.length > 0) {
      const count = Math.min(2, sublocations.length);
      // Seeded selection of which sublocations to destroy
      const shuffled = [...sublocations].sort(() => rng() - 0.5);
      sublocationsDestroyed = shuffled.slice(0, count);
    }

    for (const subId of sublocationsDestroyed) {
      try { graph.removeNode(subId); } catch { /* already gone */ }
    }

    // Trade route disruption
    const tradeEdges = [
      ...graph.getOutgoingEdges(settlementId!, 'trades_with'),
      ...graph.getIncomingEdges(settlementId!, 'trades_with'),
    ];

    if (severity === 'minor') {
      // Flag as threatened
      for (const edge of tradeEdges) {
        graph.updateEdge(edge.id, { properties: { ...edge.properties, threatened: true } });
      }
    } else {
      // Sever trade routes
      for (const edge of tradeEdges) {
        tradeRoutesSevered.push(edge.id);
        try { graph.removeEdge(edge.id); } catch { /* already gone */ }
      }
    }
  }

  // ── Commander fate ──
  let commanderFate: CommanderFate = 'retreated';
  const loserCommandEdges = loserNode ? graph.getIncomingEdges(loserArmyId, 'commanded_by') : [];
  // commanded_by goes army → commander, so check outgoing from army
  const loserCmdEdges = loserNode ? graph.getOutgoingEdges(loserArmyId, 'commanded_by') : [];
  const commanderId = loserCmdEdges[0]?.target;

  if (commanderId) {
    commanderFate = determineCommanderFate(severity, rng);

    if (commanderFate === 'killed') {
      try { graph.removeNode(commanderId); } catch { /* already gone */ }
    } else if (commanderFate === 'captured') {
      // Mark commander as captured — out of play for N ticks
      const cmdNode = graph.getNode(commanderId);
      if (cmdNode) {
        graph.updateNode(commanderId, {
          properties: {
            capturedUntilTick: state.tick + COMMANDER_CAPTURE_DURATION,
            capturedBy: victorArmyId,
          },
        });
      }
    }
    // retreated: commander stays at current location, no special state
  }

  // ── Disband losing army ──
  if (loserNode) {
    disbandArmy(state, loserArmyId);
  }

  // ── Emit trace ──
  emitTrace({
    tick: state.tick,
    category: 'faction_ambition',
    summary: `Aftermath: ${severity} ${resolutionType} — prosperity ${prosperityBefore.toFixed(2)}→${prosperityAfter.toFixed(2)}, ${sublocationsDestroyed.length} sublocations destroyed, ${tradeRoutesSevered.length} routes severed, commander ${commanderFate}`,
    event: 'aftermath_applied',
    severity,
    resolutionType,
    settlementId,
    sublocationsDestroyed,
    tradeRoutesSevered,
    prosperityBefore,
    prosperityAfter,
    commanderFate,
    commanderId,
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────

function downgradeSettlement(currentSubtype: string, severity: DestructionSeverity): string {
  if (severity === 'total') return 'ruins';

  // Major: downgrade one tier
  switch (currentSubtype) {
    case 'capital': return 'city';
    case 'city': return 'town';
    case 'town': return 'hamlet';
    case 'hamlet': return 'hamlet'; // Can't downgrade further
    default: return currentSubtype;
  }
}
