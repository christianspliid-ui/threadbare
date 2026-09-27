/**
 * Fight records — a fight leaves its history on the ground it was fought on (THR-1574,
 * slice 2 of `Docs/plans/2026-09-24-thr-1528-blood-soaked-ground.md` § Engine pillar › 2).
 *
 * Slice 1 (THR-1528, `battleRecord.ts`) made a place remember its battles. This branch
 * does the same for fights — the Physical Conflict charter's "cleared or blood-soaked
 * lairs". It is registered **first** in `FIGHT_END_BRANCHES`, so the record exists even
 * when a later branch throws and stops the dispatch. The cost is chosen: the record
 * cannot carry the ending's face (`slain` / `spared`, written later by D1/D2). The place
 * only needs "a fight happened here". Do not move this branch later to enrich it.
 *
 * The record, written only when a real exchange happened (`fightState.exchanges > 0`):
 * - one `event` node per fight (not per side), `eventType: 'fight_fought'`,
 *   id `evt_fight_${actionId}`;
 * - an `occurred_at` edge to the outer-tier Location the fighter stands on (for a lair
 *   fight, the lair), resolved through `resolveToParentLocation`;
 * - `participated_in` from the fighter (`role: 'fighter'`) and the opponent
 *   (`role: 'opponent'`), each with `outcome: fightState.result` and `tick`;
 * - a `lastFightTick` stamp on the Location — the O(1) index `readBloodshed` checks
 *   before it walks any edge. Three fights inside the window soak the ground
 *   (`BLOOD_SOAKED_FIGHT_WEIGHT`).
 *
 * No record for the no-roll ends (`no_opponent`, `opponent_gone`) or a zero-clash rout:
 * a mortal who fled at the sight of the beast spilled no blood there.
 *
 * Fail-soft (NFP #4): the branch never throws into the dispatcher — it catches and
 * traces its own errors. Deterministic (NFP #3): no draws. Inspectable (NFP #2): one
 * `fight_recorded` trace per ended fight, and `getBattleRecords` / CLI `battles` list
 * the records beside the battles'.
 */
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { UnifiedAction } from '../../types/unifiedAction';
import type { FightRecordedTrace } from '../../types/trace';
import type { WorldGraph } from '../graph';
import type { FightEndBranch, FightEndContext } from './fightOutcome';
import { FIGHT_FOUGHT_EVENT_TYPE } from '../battleRecord';
import { LAST_FIGHT_TICK_PROPERTY } from '../phaseLocationTraits';
import { resolveToParentLocation } from '../sublocationShape';
import { emitTrace } from '../traceBuffer';
import { touchWorld } from '../simulationRuntime';

/** Fallback names when a side's node is gone (the summary still reads). */
const NAMELESS_FIGHTER = 'Someone';
const NAMELESS_OPPONENT = 'a foe';

export function fightRecordId(actionId: string): string {
  return `evt_fight_${actionId}`;
}

/** The outer-tier Location a node stands on, or undefined. */
function standingLocation(graph: WorldGraph, nodeId: string | null | undefined): GraphNode | undefined {
  if (!nodeId) return undefined;
  const positionId = graph.getOutgoingEdges(nodeId, 'located_at')[0]?.target;
  if (!positionId) return undefined;
  const loc = resolveToParentLocation(graph, graph.getNode(positionId));
  return loc && loc.type === 'location' ? loc : undefined;
}

/**
 * Where the fight is remembered: the fighter's position resolved to the outer tier,
 * falling back to the opponent's (a lair's monster stands at its lair).
 */
export function resolveFightPlace(graph: WorldGraph, action: UnifiedAction): GraphNode | undefined {
  return standingLocation(graph, action.actorId)
    ?? standingLocation(graph, action.fightState?.opponentId ?? null);
}

/** The record's one sentence for the place's memory (plan § Prose tables). */
export function fightRecordSummary(fighterName: string, opponentName: string, duel: boolean): string {
  return duel
    ? `${fighterName} and ${opponentName} fought here.`
    : `${fighterName} fought ${opponentName} here.`;
}

function trace(tick: number, action: UnifiedAction, fields: Partial<FightRecordedTrace>, summary: string): void {
  emitTrace({
    category: 'fight_recorded',
    tick,
    agentId: action.actorId,
    actionId: action.actionId,
    summary,
    ...fields,
  } as FightRecordedTrace);
}

/**
 * Write the fight's record on its ground. Never throws; returns the record id, or
 * undefined when nothing was written (no exchange, no place, or a failed write).
 */
export function recordFightFought(state: GameState, action: UnifiedAction, ctx: Pick<FightEndContext, 'tick' | 'runtime'>): string | undefined {
  const tick = ctx.tick;
  const fight = action.fightState;
  let place: GraphNode | undefined;
  try {
    if (!fight?.result) return undefined;
    if (!(fight.exchanges > 0)) {
      trace(tick, action, { skipped: 'no_exchanges' },
        `fight record skipped for ${action.actionId}: no exchange (${fight.result}${fight.endReason ? `, ${fight.endReason}` : ''})`);
      return undefined;
    }
    const graph = state.graph;
    place = resolveFightPlace(graph, action);
    if (!place) {
      trace(tick, action, { skipped: 'no_place' }, `fight record skipped for ${action.actionId}: no place`);
      return undefined;
    }

    const eventId = fightRecordId(action.actionId);
    const fighter = graph.getNode(action.actorId);
    const opponent = fight.opponentId ? graph.getNode(fight.opponentId) : undefined;
    graph.addNode({
      id: eventId,
      type: 'event',
      name: `Fight at ${place.name}`,
      properties: {
        eventType: FIGHT_FOUGHT_EVENT_TYPE,
        tick,
        result: fight.result,
        templateId: action.templateId,
        locationId: place.id,
        summary: fightRecordSummary(
          fighter?.name ?? NAMELESS_FIGHTER,
          opponent?.name ?? NAMELESS_OPPONENT,
          fight.fightMode === 'agent',
        ),
      },
    });
    graph.addEdge({
      id: `occurred_at_${eventId}`, source: eventId, target: place.id, type: 'occurred_at',
      properties: { tick },
    });
    graph.updateNode(place.id, { properties: { [LAST_FIGHT_TICK_PROPERTY]: tick } });

    let participants = 0;
    const sides: Array<['fighter' | 'opponent', GraphNode | undefined]> = [['fighter', fighter], ['opponent', opponent]];
    for (const [role, node] of sides) {
      if (!node) continue;
      graph.addEdge({
        id: `participated_in_${eventId}_${role}`, source: node.id, target: eventId, type: 'participated_in',
        properties: { role, outcome: fight.result, tick },
      });
      participants += 1;
    }

    if (ctx.runtime) touchWorld(ctx.runtime);
    trace(tick, action, { eventId, locationId: place.id, participants },
      `fight record ${eventId} at ${place.name} (${fight.result}, ${participants} participant(s))`);
    return eventId;
  } catch (err) {
    trace(tick, action, { ...(place ? { locationId: place.id } : {}), error: String(err) },
      `fight record for ${action.actionId} failed: ${String(err)}`);
    return undefined;
  }
}

/**
 * The dispatcher branch. Writes the record and returns no patch — the record is
 * graph state, not a field of the fight. Registered first in `FIGHT_END_BRANCHES`.
 */
export const fightRecordBranch: FightEndBranch = (state, action, ctx) => {
  recordFightFought(state, action, ctx);
};
