/**
 * armyNotifications.ts — TB-073 Phase 7 visual presence
 *
 * Converts army/battle trace entries from the current tick into TickEvents
 * for the tiered notification system.
 *
 * Thread-based visibility rules (from plan):
 *   - Army mobilization (threaded commander/faction)  → high significance (Tier 1 modal)
 *   - Army mobilization (unthreaded)                  → low significance (Tier 3 chronicle)
 *   - Battle started (threaded participant)            → high significance
 *   - Battle started (unthreaded)                      → low significance
 *   - Siege established (threaded participant/settle)  → high significance
 *   - Army attrition threshold (threaded commander)   → medium significance
 *   - No-thread aftermath                              → low significance (chronicle)
 *
 * The notification tier (modal vs toast vs chronicle) is determined by
 * significance score — callers (GameView, ToastStack) use existing rendering.
 *
 * NFP #1 (tunability): Significance thresholds are named constants.
 * NFP #2 (inspectability): Each event carries armyId and factionId for trace lookups.
 * NFP #4 (fail-soft): Missing nodes, edges, or traces are skipped without throwing.
 */

import type { GameState, TickEvent } from '../types/gameState';
import { getTraces } from './traceBuffer';
import { getThreadedAgents } from './graphQueries';

// ── Significance constants ───────────────────────────────────────────────────

/** Significance for threaded army events (Tier 1 — modal) */
export const ARMY_NOTIFICATION_SIGNIFICANCE_THREADED = 0.85;

/** Significance for unthreaded army events (Tier 3 — chronicle) */
export const ARMY_NOTIFICATION_SIGNIFICANCE_UNTHREADED = 0.2;

/** Significance for attrition threshold warnings */
export const ARMY_NOTIFICATION_SIGNIFICANCE_ATTRITION = 0.5;

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Build a Set of agent IDs that the ascendant has thread connections to.
 * Includes direct threads and members of threaded factions.
 * NFP #4: Returns empty set if ascendantId is missing.
 */
function buildThreadedAgentSet(state: GameState): Set<string> {
  const set = new Set<string>();
  if (!state.ascendantId) return set;

  const threaded = getThreadedAgents(state.graph, state.ascendantId);
  for (const agent of threaded) {
    set.add(agent.id);
    // Also include the agent's faction members as "indirectly threaded"
    const memEdges = state.graph.getOutgoingEdges(agent.id, 'member_of');
    for (const edge of memEdges) {
      // Check all members of the same faction
      const factionMembers = state.graph.getIncomingEdges(edge.target, 'member_of');
      for (const memEdge of factionMembers) {
        set.add(memEdge.source);
      }
    }
  }

  return set;
}

/**
 * Convert army/battle traces from the current tick into TickEvents.
 * Returns partial GameState update with new tickEvents appended.
 *
 * Called from orchestrator after army and battle phases complete.
 */
export function phaseArmyNotifications(
  state: GameState,
  nextEventIdFn: () => string,
): Partial<GameState> {
  const tick = state.tick;
  const newEvents: TickEvent[] = [];

  // Get current-tick traces only (avoid reprocessing previous ticks)
  const currentTickTraces = getTraces().filter(t => t.tick === tick && t.category === 'faction_ambition');

  if (currentTickTraces.length === 0) return {};

  // Build threaded agent set for visibility determination
  const threadedAgents = buildThreadedAgentSet(state);

  for (const trace of currentTickTraces) {
    const traceData = trace as Record<string, unknown>;
    const event = traceData['event'] as string | undefined;

    if (!event) continue;

    switch (event) {
      case 'army_raised': {
        const armyId = traceData['armyId'] as string | undefined;
        const commanderId = traceData['commanderId'] as string | undefined;
        const factionId = traceData['factionId'] as string | undefined;
        const size = traceData['size'] as string | undefined;

        const isThreaded = (commanderId && threadedAgents.has(commanderId))
          || (factionId != null && checkFactionThreaded(state, factionId, threadedAgents));

        newEvents.push({
          id: nextEventIdFn(),
          tick,
          type: 'army_mobilization',
          message: trace.summary,
          significance: isThreaded
            ? ARMY_NOTIFICATION_SIGNIFICANCE_THREADED
            : ARMY_NOTIFICATION_SIGNIFICANCE_UNTHREADED,
          actorId: armyId,
        });
        void size; // referenced for potential future use
        break;
      }

      case 'army_disbanded': {
        const armyId = traceData['armyId'] as string | undefined;
        const isThreaded = armyId != null && threadedAgents.has(armyId);

        if (isThreaded) {
          newEvents.push({
            id: nextEventIdFn(),
            tick,
            type: 'army_disbanded',
            message: trace.summary,
            significance: ARMY_NOTIFICATION_SIGNIFICANCE_THREADED,
            actorId: armyId,
          });
        }
        break;
      }

      // Battle started (createBattleNode emits event: 'started')
      case 'started': {
        const battleId = traceData['battleId'] as string | undefined;
        const attackerArmyId = traceData['attackerArmyId'] as string | undefined;
        const defenderArmyId = traceData['defenderArmyId'] as string | undefined;
        // Only fire for non-siege battles (siege has its own 'siege_established' event)
        const isSiege = (traceData['isSiege'] as boolean | undefined) === true;
        if (isSiege) break;

        const isThreaded = (attackerArmyId && threadedAgents.has(attackerArmyId))
          || (defenderArmyId && threadedAgents.has(defenderArmyId));

        newEvents.push({
          id: nextEventIdFn(),
          tick,
          type: 'battle_started',
          message: trace.summary,
          significance: isThreaded
            ? ARMY_NOTIFICATION_SIGNIFICANCE_THREADED
            : ARMY_NOTIFICATION_SIGNIFICANCE_UNTHREADED,
          actorId: battleId,
        });
        break;
      }

      // Battle resolved (resolveBattle emits event: 'resolved')
      case 'resolved': {
        const battleId = traceData['battleId'] as string | undefined;
        const attackerArmyId = traceData['attackerArmyId'] as string | undefined;
        const defenderArmyId = traceData['defenderArmyId'] as string | undefined;

        const isThreaded = (attackerArmyId && threadedAgents.has(attackerArmyId))
          || (defenderArmyId && threadedAgents.has(defenderArmyId));

        newEvents.push({
          id: nextEventIdFn(),
          tick,
          type: 'battle_resolved',
          message: trace.summary,
          significance: isThreaded
            ? ARMY_NOTIFICATION_SIGNIFICANCE_THREADED
            : ARMY_NOTIFICATION_SIGNIFICANCE_UNTHREADED,
          actorId: battleId,
        });
        break;
      }

      // Siege established (createSiegeNode emits event: 'siege_established')
      case 'siege_established': {
        const siegeId = traceData['siegeId'] as string | undefined;
        const attackerArmyId = traceData['attackerArmyId'] as string | undefined;

        // Determine if attacker army commander is threaded
        let isThreaded = false;
        if (attackerArmyId) {
          const cmdEdges = state.graph.getOutgoingEdges(attackerArmyId, 'commanded_by');
          const commanderId = cmdEdges[0]?.target;
          isThreaded = commanderId != null && threadedAgents.has(commanderId);
        }

        newEvents.push({
          id: nextEventIdFn(),
          tick,
          type: 'siege_established',
          message: trace.summary,
          significance: isThreaded
            ? ARMY_NOTIFICATION_SIGNIFICANCE_THREADED
            : ARMY_NOTIFICATION_SIGNIFICANCE_UNTHREADED,
          actorId: siegeId,
        });
        break;
      }

      // Army attrition threshold crossed (armyAttrition emits event: 'attrition' with thresholdCrossed)
      case 'attrition': {
        const armyId = traceData['armyId'] as string | undefined;
        const thresholdCrossed = traceData['thresholdCrossed'] as string | undefined;
        // Only notify on threshold crossings, not routine attrition
        if (!thresholdCrossed) break;

        // Check if the army commander is threaded
        let isThreaded = false;
        if (armyId) {
          const cmdEdges = state.graph.getOutgoingEdges(armyId, 'commanded_by');
          const commanderId = cmdEdges[0]?.target;
          isThreaded = commanderId != null && threadedAgents.has(commanderId);
        }

        if (isThreaded) {
          newEvents.push({
            id: nextEventIdFn(),
            tick,
            type: 'army_attrition',
            message: trace.summary,
            significance: ARMY_NOTIFICATION_SIGNIFICANCE_ATTRITION,
            actorId: armyId,
          });
        }
        break;
      }

      default:
        // Other faction_ambition events (strategy ticks, etc.) — not notified
        break;
    }
  }

  if (newEvents.length === 0) return {};

  return {
    tickEvents: [...state.tickEvents, ...newEvents],
  };
}

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Check if any member of the given faction is in the threaded agent set.
 * NFP #4: Returns false if factionId not found.
 */
function checkFactionThreaded(
  state: GameState,
  factionId: string,
  threadedAgents: Set<string>,
): boolean {
  const memberEdges = state.graph.getIncomingEdges(factionId, 'member_of');
  for (const edge of memberEdges) {
    if (threadedAgents.has(edge.source)) return true;
  }
  return false;
}
