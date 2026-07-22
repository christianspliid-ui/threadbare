/**
 * Trade-route markers (THR-670) — graph → HexMapV2 overlay adapter.
 *
 * Reads `trades_with` edges between locations and emits:
 *  - one line descriptor per route (endpoint hex centers, cargo, threatened),
 *  - a per-endpoint-hex tooltip index so hovering a settlement lists the
 *    routes that touch it with their multi-class manifests.
 *
 * Mirrors the `buildRivalInfluenceMarkers` adapter pattern. Pure + fail-soft:
 * endpoints without hex coords are skipped; no routes → empty outputs.
 */
import type { WorldGraph } from './graph';
import { readTradeRouteProps } from './tradeRoute';

export interface TradeRouteLine {
  id: string;
  from: { col: number; row: number };
  to: { col: number; row: number };
  volume: number;
  threatened: boolean;
  goods: string[];
  carriesStaple: boolean;
}

export interface RouteTooltipEntry {
  /** The far endpoint's display name. */
  otherName: string;
  /** Manifest goods (may be empty — volume-only legacy route). */
  goods: string[];
  carriesStaple: boolean;
  threatened: boolean;
  volume: number;
}

function hexOf(graph: WorldGraph, locId: string): { col: number; row: number } | undefined {
  const node = graph.getNode(locId);
  const col = node?.properties.hexCol as number | undefined;
  const row = node?.properties.hexRow as number | undefined;
  if (col === undefined || row === undefined) return undefined;
  return { col, row };
}

/** All renderable trade-route lines (both endpoints resolvable to hexes). */
export function buildTradeRouteLines(graph: WorldGraph): TradeRouteLine[] {
  const lines: TradeRouteLine[] = [];
  for (const edge of graph.getEdgesByType('trades_with')) {
    const from = hexOf(graph, edge.source);
    const to = hexOf(graph, edge.target);
    if (!from || !to) continue;
    const props = readTradeRouteProps(edge.properties);
    lines.push({
      id: edge.id,
      from,
      to,
      volume: props.volume,
      threatened: edge.properties.threatened === true,
      goods: props.manifest.goods,
      carriesStaple: props.manifest.carriesStaple,
    });
  }
  return lines;
}

/**
 * Tooltip index: "col,row" of each route endpoint → the routes touching that
 * hex, described from that endpoint's perspective.
 */
export function buildRouteTooltipsByHex(graph: WorldGraph): Map<string, RouteTooltipEntry[]> {
  const byHex = new Map<string, RouteTooltipEntry[]>();
  const push = (hex: { col: number; row: number }, entry: RouteTooltipEntry): void => {
    const key = `${hex.col},${hex.row}`;
    const list = byHex.get(key) ?? [];
    list.push(entry);
    byHex.set(key, list);
  };
  for (const edge of graph.getEdgesByType('trades_with')) {
    const from = hexOf(graph, edge.source);
    const to = hexOf(graph, edge.target);
    if (!from || !to) continue;
    const props = readTradeRouteProps(edge.properties);
    const threatened = edge.properties.threatened === true;
    const base = {
      goods: props.manifest.goods,
      carriesStaple: props.manifest.carriesStaple,
      threatened,
      volume: props.volume,
    };
    push(from, { ...base, otherName: graph.getNode(edge.target)?.name ?? 'a far market' });
    push(to, { ...base, otherName: graph.getNode(edge.source)?.name ?? 'a far market' });
  }
  return byHex;
}
