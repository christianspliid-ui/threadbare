/**
 * warAims/context.ts — the per-pass index a war-aim pick reads (THR-1933).
 *
 * Built once per re-aim pass (daily) or per raise, never cached across ticks: the
 * graph is mutated in place, so a held index would go stale (CLAUDE.md, load-bearing
 * decisions). Holds each settlement's hex and tax holder, the resource-bearing places
 * a town's value can draw on, and the projection's hex → realm map.
 *
 * NFP #4 Fail-soft: a node with no hex is simply left out of every distance question.
 */

import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { HexCoord } from '../../types';
import { getLocationNodes, isPlaceNode } from '../sublocationShape';
import { taxHolderOf } from '../factionPurse/income';
import { readResources } from '../resourceEconomy';
import { SETTLEMENT_TARGET_SUBTYPES } from '../../types/army';
import type { BearingIndex } from '../regionalMonopoly';

/** A location that can be marched on, with its hex and today's tax holder. */
export interface WarTown {
  node: GraphNode;
  hex: HexCoord;
  holderId: string | null;
}

/** A resource-bearing location outside every town's own walls (a field, a mine, a wood). */
export interface WarField {
  node: GraphNode;
  hex: HexCoord;
  /** True when some faction controls it (only unheld fields are shared out). */
  held: boolean;
}

export interface WarAimContext {
  graph: WorldGraph;
  towns: Map<string, WarTown>;
  /** Town id → its sublocations that carry a resource bag. */
  townPlaces: Map<string, GraphNode[]>;
  fields: WarField[];
  /** THR-1955 — resource → bearing places, built on first use by the monopoly bonuses. */
  bearing?: BearingIndex;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** The hex a location stands on: its own, else its parent's. Null when neither is set. */
export function hexOfLocation(graph: WorldGraph, node: GraphNode | undefined): HexCoord | null {
  if (!node) return null;
  const col = num(node.properties.hexCol);
  const row = num(node.properties.hexRow);
  if (col !== null && row !== null) return { col, row };
  const parentId = node.properties.parentLocationId;
  if (typeof parentId === 'string' && parentId !== node.id) {
    const parent = graph.getNode(parentId);
    const pc = num(parent?.properties.hexCol);
    const pr = num(parent?.properties.hexRow);
    if (pc !== null && pr !== null) return { col: pc, row: pr };
  }
  return null;
}

/** The hex an actor (army) stands on, through its `located_at` edge. */
export function hexOfActor(graph: WorldGraph, actorId: string): HexCoord | null {
  const locId = graph.getOutgoingEdges(actorId, 'located_at')[0]?.target;
  return locId ? hexOfLocation(graph, graph.getNode(locId)) : null;
}

/** The place-tier Location an actor stands in (a sublocation resolves to its parent). */
export function placeTierLocationOf(graph: WorldGraph, actorId: string): string | null {
  const locId = graph.getOutgoingEdges(actorId, 'located_at')[0]?.target;
  if (!locId) return null;
  const node = graph.getNode(locId);
  const parent = node?.properties.parentLocationId;
  return typeof parent === 'string' && graph.getNode(parent) ? parent : locId;
}

function bearsResources(node: GraphNode): boolean {
  return Object.values(readResources(node.properties))
    .some(r => (num((r as { quantity?: unknown }).quantity) ?? 0) > 0);
}

export function buildWarAimContext(
  graph: WorldGraph,
  hexRealmId: ReadonlyMap<string, string>,
): WarAimContext {
  const towns = new Map<string, WarTown>();
  for (const loc of getLocationNodes(graph)) {
    const subtype = loc.properties.locationSubtype;
    if (typeof subtype !== 'string' || !SETTLEMENT_TARGET_SUBTYPES.includes(subtype)) continue;
    const hex = hexOfLocation(graph, loc);
    if (!hex) continue;
    towns.set(loc.id, { node: loc, hex, holderId: taxHolderOf(graph, loc.id, hexRealmId) });
  }

  const townPlaces = new Map<string, GraphNode[]>();
  const fields: WarField[] = [];
  for (const loc of graph.getNodesByType('location')) {
    if (towns.has(loc.id) || !bearsResources(loc)) continue;
    const parentId = loc.properties.parentLocationId;
    if (isPlaceNode(loc) && typeof parentId === 'string' && towns.has(parentId)) {
      const list = townPlaces.get(parentId) ?? [];
      list.push(loc);
      townPlaces.set(parentId, list);
      continue;
    }
    const hex = hexOfLocation(graph, loc);
    if (!hex) continue;
    fields.push({ node: loc, hex, held: graph.getIncomingEdges(loc.id, 'controls').length > 0 });
  }
  for (const list of townPlaces.values()) list.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  fields.sort((a, b) => (a.node.id < b.node.id ? -1 : a.node.id > b.node.id ? 1 : 0));
  return { graph, towns, townPlaces, fields };
}
