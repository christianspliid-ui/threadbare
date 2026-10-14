/**
 * Where a node stands on the map, as GameView's map memos resolved it before
 * THR-1822 moved them here: the node's own `hexCol`/`hexRow`, else those of the
 * target of its first `located_at` edge. Kept exactly — the moved selectors are
 * golden-tested against the memos they replace.
 */
import type { WorldGraph } from '../../graph';
import type { GraphNode } from '../../../types/graph';

export interface MapHex {
  col: number;
  row: number;
}

export function nodeMapHex(graph: WorldGraph, node: GraphNode): MapHex | null {
  let col = node.properties.hexCol as number | undefined;
  let row = node.properties.hexRow as number | undefined;
  if (col == null || row == null) {
    const locEdges = graph.getOutgoingEdges(node.id, 'located_at');
    if (locEdges.length > 0) {
      const loc = graph.getNode(locEdges[0].target);
      col = loc?.properties.hexCol as number | undefined;
      row = loc?.properties.hexRow as number | undefined;
    }
  }
  return col != null && row != null ? { col, row } : null;
}
