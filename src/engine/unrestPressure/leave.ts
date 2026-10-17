/**
 * Restless — people leave (THR-1934 S1, plan § Engine 6).
 *
 * Every `RESTLESS_LEAVE_DAYS` of being Restless a town loses one person to the
 * nearest fed, calm settlement within `MIGRATION_RADIUS_HEXES`, preferring one under
 * the same tax holder. Two things move:
 *
 * 1. **A person** — `population` −1 here, +1 there. Only once the settlement economy
 *    counts people (a numeric `population`); before it, skipped and traced.
 * 2. **A mortal leans** — the most recent arrival among the town's living mortals gets
 *    a `relocationIntent` toward the destination. A lean, not an order: the
 *    movement pull scores it like any other intent.
 *
 * Deterministic (NFP #3): argmax with id ties, no draw.
 */
import type { GameState } from '../../types/gameState';
import type { GraphNode } from '../../types/graph';
import type { WorldGraph } from '../graph';
import { resolveLocationToHex } from '../encounterAwareness';
import { hexDistance } from '../../lib/hexMath';
import { getLocationNodes, resolveToParentLocation } from '../sublocationShape';
import { taxHolderOf } from '../factionPurse/income';
import { RESIDENCE_POSITION_PROP, RESIDENCE_ARRIVED_PROP } from '../agentResidence';
import { readRelocationIntent } from '../relocationIntent';
import { MIGRATION_RADIUS_HEXES } from '../../data/unrest-pressure-constants';
import { isPressureSettlement, HUNGER_DAYS_PROP } from './inputs';
import { isRestlessPlace } from './bands';

/**
 * The tax holder for preference only. The realm-border tie-break needs a realm
 * projection the unrest phase does not build; with an empty map `taxHolderOf` falls
 * back to the controller ranking, which is the answer for every singly held town.
 */
const NO_REALM_MAP: ReadonlyMap<string, string> = new Map();

export interface LeaveDestination {
  readonly id: string;
  readonly distance: number;
}

/** Fed (no hunger counted today) and not Restless. */
function isCalmAndFed(graph: WorldGraph, node: GraphNode): boolean {
  const hungerDays = node.properties?.[HUNGER_DAYS_PROP];
  if (typeof hungerDays === 'number' && hungerDays > 0) return false;
  return !isRestlessPlace(graph, node.id);
}

export function pickLeaveDestination(state: Pick<GameState, 'graph'>, town: GraphNode): LeaveDestination | null {
  const graph = state.graph;
  const from = resolveLocationToHex(graph, town.id);
  if (!from) return null;
  const holder = taxHolderOf(graph, town.id, NO_REALM_MAP);
  let best: { id: string; distance: number; sameHolder: boolean } | null = null;
  for (const node of getLocationNodes(graph)) {
    if (node.id === town.id || !isPressureSettlement(node)) continue;
    if (!isCalmAndFed(graph, node)) continue;
    const hex = resolveLocationToHex(graph, node.id);
    if (!hex) continue;
    const distance = hexDistance(from, hex);
    if (distance > MIGRATION_RADIUS_HEXES) continue;
    const sameHolder = holder !== null && taxHolderOf(graph, node.id, NO_REALM_MAP) === holder;
    const better = !best
      || (sameHolder && !best.sameHolder)
      || (sameHolder === best.sameHolder && (distance < best.distance
        || (distance === best.distance && node.id < best.id)));
    if (better) best = { id: node.id, distance, sameHolder };
  }
  return best ? { id: best.id, distance: best.distance } : null;
}

/**
 * The town's most recent arrival among its living mortals — residence at the town or
 * one of its Places (`resolveToParentLocation`) — ties by id. Null when none lives there.
 * A mortal already walking toward somewhere an encounter's ending sent them (a live
 * intent from another writer) is passed over, so the unrest lean never overwrites it.
 */
export function pickLeaningMortal(graph: WorldGraph, town: GraphNode, tick = 0): string | null {
  let best: { id: string; arrived: number } | null = null;
  for (const actor of graph.getNodesByType('actor')) {
    const props = actor.properties ?? {};
    if (props.actorType !== 'individual' || props.deceased === true || props.armyState != null) continue;
    const residenceId = props[RESIDENCE_POSITION_PROP];
    if (typeof residenceId !== 'string') continue;
    const home = resolveToParentLocation(graph, graph.getNode(residenceId));
    if (!home || home.id !== town.id) continue;
    const live = readRelocationIntent(actor, tick);
    if (live && live.source !== 'unrest') continue;
    const arrived = typeof props[RESIDENCE_ARRIVED_PROP] === 'number' ? props[RESIDENCE_ARRIVED_PROP] as number : -Infinity;
    if (!best || arrived > best.arrived || (arrived === best.arrived && actor.id < best.id)) {
      best = { id: actor.id, arrived };
    }
  }
  return best?.id ?? null;
}
