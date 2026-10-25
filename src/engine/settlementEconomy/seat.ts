/**
 * Seats and pulls (THR-1923, plan § Resolution logic 2–3, 5).
 *
 * A faction's seat is where it sits: its `homeLocationId`, or for a realm the town its
 * `controls` edge marks `role: 'seat'`. Read only — the plan adds no edge. A seat **pulls**
 * when its faction holds at least one other settlement, or when at least
 * `SEAT_MIN_INCOMING` surplus routes run into it: Christian's *"a faction HQ in the city that
 * can pull in resources"*. A seat that pulls nothing is a town.
 *
 * Deterministic (NFP #3): factions and edges in id order. Fail-soft (NFP #4): a seat edge
 * pointing at a missing node is no seat.
 */
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../graph';
import { resolveToParentLocation } from '../sublocationShape';
import { isFactionNode, taxHolderOf } from '../factionPurse/income';
import { REALM_FACTION_CLASS } from '../../data/realm-content';
import { PULL_MAX } from '../../data/settlement-economy-constants';
import { FACTION_CLASS_BUILDING_LEAN, guildTypeBuildingLean } from '../../data/faction-building-lean';
import type { FactionClass } from '../../data/realm-content';
import { isEconomySettlement } from './land';

export interface SeatMap {
  /** Settlement id → the faction ids seated there, in id order. */
  readonly seatedAt: ReadonlyMap<string, readonly string[]>;
  /** Settlements that seat a realm's court. */
  readonly realmSeats: ReadonlySet<string>;
  /** Faction id → its seat settlement. */
  readonly seatOf: ReadonlyMap<string, string>;
}

function byId(a: { id: string }, b: { id: string }): number {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** The settlement a faction sits in, or null. A Place resolves to its parent. */
function seatSettlementOf(graph: WorldGraph, faction: GraphNode): string | null {
  if (faction.properties.factionClass === REALM_FACTION_CLASS) {
    const seatEdge = graph.getOutgoingEdges(faction.id, 'controls').find(e => e.properties?.role === 'seat');
    const seat = seatEdge ? resolveToParentLocation(graph, graph.getNode(seatEdge.target)) : undefined;
    if (seat && isEconomySettlement(seat)) return seat.id;
  }
  const home = faction.properties.homeLocationId;
  if (typeof home !== 'string') return null;
  const node = resolveToParentLocation(graph, graph.getNode(home));
  return node && isEconomySettlement(node) ? node.id : null;
}

export function buildSeatMap(graph: WorldGraph): SeatMap {
  const seatedAt = new Map<string, string[]>();
  const realmSeats = new Set<string>();
  const seatOf = new Map<string, string>();
  const factions = graph.getNodesByType('actor').filter(isFactionNode).sort(byId);
  for (const f of factions) {
    const seat = seatSettlementOf(graph, f);
    if (!seat) continue;
    seatOf.set(f.id, seat);
    const at = seatedAt.get(seat) ?? [];
    at.push(f.id);
    seatedAt.set(seat, at);
    if (f.properties.factionClass === REALM_FACTION_CLASS) realmSeats.add(seat);
  }
  return { seatedAt, realmSeats, seatOf };
}

/** The holder of each settlement (`taxHolderOf`, the realm-border tie-break included). */
export function buildHolderMap(
  graph: WorldGraph,
  settlements: readonly GraphNode[],
  hexRealmId: ReadonlyMap<string, string>,
): Map<string, string | null> {
  const out = new Map<string, string | null>();
  for (const s of settlements) out.set(s.id, taxHolderOf(graph, s.id, hexRealmId));
  return out;
}

/**
 * Seat settlement → how many other settlements its seated factions hold. A settlement
 * held by a faction seated elsewhere counts once toward that seat.
 */
export function heldCountBySeat(
  holders: ReadonlyMap<string, string | null>,
  seats: SeatMap,
): Map<string, number> {
  const out = new Map<string, number>();
  for (const [settlementId, holder] of holders) {
    if (!holder) continue;
    const seat = seats.seatOf.get(holder);
    if (!seat || seat === settlementId) continue;
    out.set(seat, (out.get(seat) ?? 0) + 1);
  }
  return out;
}

/** How many sources a seat pulls from (held settlements + incoming surplus routes), capped. */
export function pullCountOf(held: number, incomingRoutes: number): number {
  return Math.min(PULL_MAX, held + incomingRoutes);
}

/** Whether a settlement is a seat that pulls (plan rule 3). */
export function seatPulls(isSeat: boolean, held: number, incomingRoutes: number, seatMinIncoming: number): boolean {
  if (!isSeat) return false;
  return held > 0 || incomingRoutes >= seatMinIncoming;
}

/**
 * The building the settlement leans toward, from its holder (or, unheld, the first faction
 * seated there). A guild leans by its type's natural places; anyone else by class.
 */
export function leanBuildingOf(graph: WorldGraph, factionId: string | null | undefined): string | undefined {
  if (!factionId) return undefined;
  const f = graph.getNode(factionId);
  if (!isFactionNode(f)) return undefined;
  const guildType = f.properties.guildType;
  if (typeof guildType === 'string') {
    const lean = guildTypeBuildingLean(guildType);
    if (lean) return lean;
  }
  const cls = f.properties.factionClass as FactionClass | undefined;
  return cls ? FACTION_CLASS_BUILDING_LEAN[cls] : undefined;
}
