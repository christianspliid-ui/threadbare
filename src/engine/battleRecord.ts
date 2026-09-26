/**
 * Battle records — a battle leaves its history on the ground it was fought over (THR-1528).
 *
 * Before this module a battle overwrote a settlement's prosperity and subtype and
 * minted **no record at all**; a field battle wrote nothing to its ground. Now
 * `resolveBattle` calls {@link recordBattleFought} after the aftermath and **before** it
 * removes the battle node (after the removal the battle's `located_at` edge — the only
 * honest answer to "where was this field battle fought" — is gone). The record is:
 *
 * - an `event` node, `eventType: 'battle_fought'`, id `evt_battle_${battleNodeId}`
 *   (the battle id carries its start tick, so the id is unique and deterministic);
 * - an `occurred_at` edge to the outer-tier Location — a siege at its town
 *   (`bs.settlementId`), a field battle at the battle node's own `located_at`, both
 *   resolved up through `resolveToParentLocation`;
 * - a `participated_in` edge from each captured commander whose node is still in the
 *   graph after the aftermath, with the `outcome` read from the **resolution**, never
 *   from the aftermath's winner (the aftermath counts a mutual destruction as a
 *   defender win; the record names no victor for it);
 * - a `lastBattleTick` stamp on the Location — the O(1) index the *Blood-soaked* rule
 *   (`phaseLocationTraits.readBloodshed`) reads before it walks any edge.
 *
 * Faction names live in `summary` as display text only; the faction relationship stays
 * on the commanders' and armies' `member_of` edges (Property-vs-Edge rule).
 *
 * Fail-soft (NFP #4): the writer is wrapped and traces its own failure; a missing place
 * writes the record without `occurred_at` or a stamp. Deterministic (NFP #3): no draws.
 * Inspectable (NFP #2): one `battle_recorded` trace per battle, `getBattleRecords` on
 * the debug bridge, CLI `battles`.
 *
 * Plan: Docs/plans/2026-09-24-thr-1528-blood-soaked-ground.md § Engine pillar › 1.
 */
import type { GameState } from '../types/gameState';
import type { GraphNode } from '../types/graph';
import type { BattleState, BattleResolutionType } from '../types/battle';
import type { WorldGraph } from './graph';
import type { BattleAftermathSummary } from './battleAftermath';
import { battleOutcomeSentence, townHolder, type BattleNewsCapture } from './armyNotifications';
import { resolveToParentLocation, getLocationNodes } from './sublocationShape';
import { LAST_BATTLE_TICK_PROPERTY } from './phaseLocationTraits';
import { emitTrace } from './traceBuffer';
import { touchWorld, type SimulationRuntime } from './simulationRuntime';

/** The event type a battle's record carries. */
export const BATTLE_FOUGHT_EVENT_TYPE = 'battle_fought';
/** The event type a fight's record carries (slice 2, THR-1574 — no writer yet). */
export const FIGHT_FOUGHT_EVENT_TYPE = 'fight_fought';

/** The record kinds that count as bloodshed on the ground. */
export const BLOODSHED_EVENT_TYPES: readonly string[] = [BATTLE_FOUGHT_EVENT_TYPE, FIGHT_FOUGHT_EVENT_TYPE];

type Outcome = 'won' | 'lost' | 'stalemate';

/** Each side's `participated_in.outcome`, from the resolution alone (plan § 1 table). */
export const BATTLE_OUTCOME_BY_RESOLUTION: Readonly<
  Record<BattleResolutionType, { attacker: Outcome; defender: Outcome }>
> = {
  attacker_victory: { attacker: 'won', defender: 'lost' },
  defender_victory: { attacker: 'lost', defender: 'won' },
  stalemate: { attacker: 'stalemate', defender: 'stalemate' },
  mutual_destruction: { attacker: 'lost', defender: 'lost' },
};

export function battleRecordId(battleNodeId: string): string {
  return `evt_battle_${battleNodeId}`;
}

/** A Location node (either tier) resolved to the outer tier, or undefined. */
function outerLocation(graph: WorldGraph, id: string | null | undefined): GraphNode | undefined {
  if (!id) return undefined;
  const node = graph.getNode(id);
  if (!node || node.type !== 'location') return undefined;
  return resolveToParentLocation(graph, node);
}

/**
 * Where the battle is remembered: a siege at its town (falling back to the battle's
 * own position when the town is gone), a field battle at the battle's position.
 * Called before the battle node is removed, so its `located_at` still stands.
 */
export function resolveBattlePlace(graph: WorldGraph, battleNodeId: string, bs: BattleState): GraphNode | undefined {
  const position = graph.getOutgoingEdges(battleNodeId, 'located_at')[0]?.target;
  if (bs.battleType === 'siege') {
    return outerLocation(graph, bs.settlementId) ?? outerLocation(graph, position);
  }
  return outerLocation(graph, position);
}

function capitalize(s: string): string {
  return s.length > 0 ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * The record's one sentence for the place's memory. Reuses the war news' builder
 * (`battleOutcomeSentence`, THR-1564) — both describe the same battle. The one case
 * that builder does not tell is a siege that *took* its town (the news tells that by
 * the territory line); the record tells it here.
 */
export function battleRecordSummary(
  graph: WorldGraph,
  capture: BattleNewsCapture | null,
  bs: BattleState,
  resolutionType: BattleResolutionType,
  placeName: string | undefined,
): string {
  const townId = capture?.townId;
  if (capture && townId && resolutionType === 'attacker_victory'
      && capture.holderBefore !== townHolder(graph, townId)) {
    const victor = capture.attacker.factionName ?? 'An army';
    return `${capitalize(victor)} took ${capture.townName ?? placeName ?? 'the town'} by siege.`;
  }
  return battleOutcomeSentence({
    battleType: capture?.battleType ?? bs.battleType,
    resolution: resolutionType,
    attackerName: capture?.attacker.factionName,
    defenderName: capture?.defender.factionName,
    placeName: capture?.placeName ?? placeName,
    townName: capture?.townName ?? placeName,
  });
}

/**
 * Write the battle's record on its ground. Call after `applyAftermath` and before
 * `graph.removeNode(battleNodeId)`. Never throws; returns the record id, or undefined
 * when the write failed.
 */
export function recordBattleFought(
  state: GameState,
  battleNodeId: string,
  bs: BattleState,
  resolutionType: BattleResolutionType,
  summary: BattleAftermathSummary,
  capture: BattleNewsCapture | null,
  runtime?: SimulationRuntime,
): string | undefined {
  const graph = state.graph;
  const tick = state.tick;
  const eventId = battleRecordId(battleNodeId);
  let place: GraphNode | undefined;
  let participants = 0;
  try {
    place = resolveBattlePlace(graph, battleNodeId, bs);
    graph.addNode({
      id: eventId,
      type: 'event',
      name: `Battle at ${place?.name ?? 'an unknown place'}`,
      properties: {
        eventType: BATTLE_FOUGHT_EVENT_TYPE,
        tick,
        startedTick: bs.startedTick,
        battleType: bs.battleType,
        resolutionType,
        severity: summary.severity,
        ...(place ? { locationId: place.id } : {}),
        summary: battleRecordSummary(graph, capture, bs, resolutionType, place?.name),
      },
    });

    if (place) {
      graph.addEdge({
        id: `occurred_at_${eventId}`, source: eventId, target: place.id, type: 'occurred_at',
        properties: { tick },
      });
      graph.updateNode(place.id, { properties: { [LAST_BATTLE_TICK_PROPERTY]: tick } });
    }

    const outcomes = BATTLE_OUTCOME_BY_RESOLUTION[resolutionType];
    const sides: Array<['attacker' | 'defender', string | undefined]> = [
      ['attacker', capture?.attacker.commanderId],
      ['defender', capture?.defender.commanderId],
    ];
    for (const [role, commanderId] of sides) {
      // A commander the aftermath removed gets no edge; one kept as deceased (THR-1566) does.
      if (!commanderId || !graph.getNode(commanderId)) continue;
      graph.addEdge({
        id: `participated_in_${eventId}_${role}`, source: commanderId, target: eventId, type: 'participated_in',
        properties: { role, outcome: outcomes[role], tick },
      });
      participants += 1;
    }

    if (runtime) touchWorld(runtime);
    emitTrace({
      category: 'battle_recorded',
      tick,
      summary: `battle record ${eventId} at ${place?.name ?? 'no place'} (${resolutionType}, ${participants} commander(s))`,
      battleId: battleNodeId,
      eventId,
      ...(place ? { locationId: place.id } : {}),
      resolutionType,
      severity: summary.severity,
      participants,
      ...(place ? {} : { error: 'no_place' }),
    });
    return eventId;
  } catch (err) {
    emitTrace({
      category: 'battle_recorded',
      tick,
      summary: `battle record for ${battleNodeId} failed: ${String(err)}`,
      battleId: battleNodeId,
      ...(place ? { locationId: place.id } : {}),
      resolutionType,
      severity: summary.severity,
      participants,
      error: String(err),
    });
    return undefined;
  }
}

// ─── Readers ────────────────────────────────────────────────────────────────

/**
 * The newest battle/fight record at a place inside `windowTicks`, or undefined — the
 * place MEMORY's first choice (THR-1528). Walks the place's own `occurred_at` edges;
 * `getLocationEncounterHistory` filters to `encounter_outcome` and would not find it.
 */
export function latestBloodshedRecord(
  graph: WorldGraph,
  locationId: string,
  tick: number,
  windowTicks: number,
): GraphNode | undefined {
  let best: GraphNode | undefined;
  let bestTick = -Infinity;
  for (const edge of graph.getIncomingEdges(locationId, 'occurred_at')) {
    const record = graph.getNode(edge.source);
    if (!record || record.type !== 'event') continue;
    if (!BLOODSHED_EVENT_TYPES.includes(record.properties?.eventType as string)) continue;
    const at = record.properties?.tick;
    if (typeof at !== 'number' || at <= tick - windowTicks || at > tick) continue;
    if (at > bestTick) { best = record; bestTick = at; }
  }
  return best;
}

/** One record as the debug bridge and CLI report it. */
export interface BattleRecordReadout {
  readonly eventId: string;
  readonly eventType: string;
  readonly tick: number | null;
  readonly locationId: string | null;
  readonly locationName: string | null;
  readonly battleType: string | null;
  readonly resolutionType: string | null;
  readonly severity: string | null;
  readonly summary: string;
  readonly participants: ReadonlyArray<{ actorId: string; name: string; role: string; outcome: string }>;
}

/**
 * Every battle/fight record, newest first — or those at the places a query matches
 * (id, id prefix, or partial name; case-insensitive).
 */
export function describeBattleRecords(graph: WorldGraph, query?: string): BattleRecordReadout[] {
  let allowed: Set<string> | null = null;
  if (query) {
    const lowered = query.toLowerCase();
    allowed = new Set(
      getLocationNodes(graph)
        .filter(loc => loc.id === query || loc.id.startsWith(query) || (loc.name ?? '').toLowerCase().includes(lowered))
        .map(loc => loc.id),
    );
  }
  const str = (v: unknown): string | null => (typeof v === 'string' ? v : null);
  const out: BattleRecordReadout[] = [];
  for (const node of graph.getNodesByType('event')) {
    const eventType = node.properties?.eventType as string;
    if (!BLOODSHED_EVENT_TYPES.includes(eventType)) continue;
    const locationId = graph.getOutgoingEdges(node.id, 'occurred_at')[0]?.target ?? null;
    if (allowed && (!locationId || !allowed.has(locationId))) continue;
    out.push({
      eventId: node.id,
      eventType,
      tick: typeof node.properties.tick === 'number' ? (node.properties.tick as number) : null,
      locationId,
      locationName: locationId ? graph.getNode(locationId)?.name ?? locationId : null,
      battleType: str(node.properties.battleType),
      resolutionType: str(node.properties.resolutionType),
      severity: str(node.properties.severity),
      summary: str(node.properties.summary) ?? node.name,
      participants: graph.getIncomingEdges(node.id, 'participated_in').map(e => ({
        actorId: e.source,
        name: graph.getNode(e.source)?.name ?? e.source,
        role: String(e.properties?.role ?? ''),
        outcome: String(e.properties?.outcome ?? ''),
      })),
    });
  }
  return out.sort((a, b) => (b.tick ?? 0) - (a.tick ?? 0));
}
