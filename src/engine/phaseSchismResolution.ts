/**
 * Schism Resolution Phase (THR-430).
 *
 * Runs once per tick. Scans the graph for faction nodes whose
 * `schismPendingResolutionTick` equals the current tick, then routes each to
 * `performFactionSplit` or `performFactionReform` based on the
 * `decideSchismOutcome` scalar (cohesion drop × dissent × seeded PRNG).
 *
 * Pure-tick semantics: a missing or dissolved target faction produces an
 * outcome:'noop' trace and clears the pending properties. Decision logic is
 * deterministic given (tick, factionId).
 *
 * Wired in `src/engine/phases/schismResolution.ts` (registry entry), runs in
 * post-economy after `faction_actions`.
 */
import type { GameState } from '../types/gameState';
import { appendRecentEvent } from './encounterAftermath';
import {
  performFactionSplit,
  performFactionReform,
  decideSchismOutcome,
} from './factionTopology';
import { emitTrace } from './traceBuffer';
import {
  SCHISM_WEIGHT_COHESION,
  SCHISM_WEIGHT_SPREAD,
  SCHISM_WEIGHT_DISSENT,
} from '../data/game-config';
import { mulberry32 } from '../lib/prng';
import type { SimulationRuntime } from './simulationRuntime';

function clearSchismProperties(properties: Record<string, unknown>): void {
  delete properties.schismPendingResolutionTick;
  delete properties.schismPlantedTick;
  delete properties.schismActorAgentId;
  delete properties.schismBaselineCohesion;
}

/**
 * Deterministic [0, 1) sample seeded by (tick, factionId).
 *
 * Two factions resolving on the same tick get independent samples; the same
 * faction-tick pair always produces the same sample (replay-safe).
 */
function deterministicSample(tick: number, factionId: string): number {
  let seed = tick | 0;
  for (let i = 0; i < factionId.length; i++) {
    seed = (Math.imul(31, seed) + factionId.charCodeAt(i)) | 0;
  }
  // mulberry32 expects an unsigned 32-bit; ensure positive.
  return mulberry32(seed >>> 0)();
}

export function phaseSchismResolution(state: GameState, runtime?: SimulationRuntime): void {
  const tick = state.tick;
  const allActors = state.graph.getNodesByType('actor');

  for (const node of allActors) {
    const props = node.properties as Record<string, unknown>;
    if (props?.actorType !== 'faction') continue;

    const resolutionTick = props?.schismPendingResolutionTick as number | undefined;
    if (typeof resolutionTick !== 'number' || resolutionTick !== tick) continue;

    const factionId = node.id;
    const factionName = node.name ?? 'faction';
    const baselineCohesion =
      typeof props.schismBaselineCohesion === 'number'
        ? (props.schismBaselineCohesion as number)
        : 0;

    try {
      const sample = deterministicSample(tick, factionId);
      const decision = decideSchismOutcome(
        state,
        factionId,
        baselineCohesion,
        sample,
        {
          cohesion: SCHISM_WEIGHT_COHESION,
          spread: SCHISM_WEIGHT_SPREAD,
          dissent: SCHISM_WEIGHT_DISSENT,
        },
      );

      // A faction that's lost all but 0–1 members between plant and resolution
      // can't be split — force reform regardless of decision.
      const memberCount = state.graph.getIncomingEdges(factionId, 'member_of').length;
      const finalOutcome = memberCount < 2 ? 'reform' : decision.outcome;
      const adjustedDecision = { ...decision, outcome: finalOutcome };

      if (finalOutcome === 'split') {
        const result = performFactionSplit(state, runtime, factionId, adjustedDecision, tick);
        if (!result.success) {
          // Couldn't split (e.g. members evaporated mid-tick) — emit noop trace
          emitTrace({
            tick,
            category: 'schism_resolved',
            factionId,
            factionName,
            outcome: 'noop',
            splitPressure: decision.splitPressure,
            inputs: decision.inputs,
            failReason: result.failReason ?? 'split_failed',
            summary: `schism_resolved[${factionId}]: noop (split failed — ${result.failReason})`,
          });
        } else {
          for (const ev of result.events) {
            state.recentEvents = appendRecentEvent(state.recentEvents ?? [], ev);
          }
        }
      } else {
        const result = performFactionReform(state, runtime, factionId, adjustedDecision, tick);
        if (!result.success) {
          emitTrace({
            tick,
            category: 'schism_resolved',
            factionId,
            factionName,
            outcome: 'noop',
            splitPressure: decision.splitPressure,
            inputs: decision.inputs,
            failReason: result.failReason ?? 'reform_failed',
            summary: `schism_resolved[${factionId}]: noop (reform failed — ${result.failReason})`,
          });
        } else {
          for (const ev of result.events) {
            state.recentEvents = appendRecentEvent(state.recentEvents ?? [], ev);
          }
        }
      }
    } catch (err) {
      emitTrace({
        tick,
        category: 'schism_resolved',
        factionId,
        factionName,
        outcome: 'noop',
        splitPressure: 0,
        inputs: { cohesionDrop: 0, spread: 0, dissent: 0 },
        failReason: 'decision_threw',
        summary: `schism_resolved[${factionId}]: threw — ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      clearSchismProperties(props);
    }
  }
}
