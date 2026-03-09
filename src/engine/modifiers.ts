/**
 * Core Modifier Engine — graph-native attribute resolution.
 *
 * Three pure functions:
 * - getFloor(attribute) — minimum value for an attribute
 * - collectModifiers(graph, nodeId, attribute) — walk edges, gather matching deltas
 * - getModifiedValue(graph, nodeId, attribute, baseValue, tick?) — sum + clamp + optional trace
 */
import type { WorldGraph } from './graph';
import type { ModifierSource } from '../types/modifiers';
import { ATTRIBUTE_FLOORS, DEFAULT_FLOOR } from '../types/modifiers';
import { getTerrainModifiers } from '../data/terrain-modifiers';
import type { TerrainType } from '../types';
import { emitTrace } from './traceBuffer';

/**
 * Return the minimum allowed value for an attribute.
 * Returns DEFAULT_FLOOR (-Infinity) for attributes not in the registry.
 */
export function getFloor(attribute: string): number {
  return ATTRIBUTE_FLOORS[attribute] ?? DEFAULT_FLOOR;
}

/**
 * Walk all edges touching `nodeId` and collect ModifierSources for `attribute`.
 *
 * Sources come from three places:
 * 1. Outgoing edges with `properties.modifiers[attribute]` — e.g. has_trait, enchanted
 * 2. Outgoing `located_at` edges — terrain modifiers looked up from the target location
 * 3. Incoming edges with `properties.modifiers[attribute]` — e.g. blessed, cursed
 */
export function collectModifiers(
  graph: WorldGraph,
  nodeId: string,
  attribute: string,
): ModifierSource[] {
  const node = graph.getNode(nodeId);
  if (!node) return [];

  const sources: ModifierSource[] = [];

  // --- Outgoing edges ---
  const outgoing = graph.getOutgoingEdges(nodeId);
  for (const edge of outgoing) {
    // Check for explicit modifiers on the edge properties
    const mods = edge.properties.modifiers as Record<string, number> | undefined;
    if (mods && typeof mods[attribute] === 'number') {
      const targetNode = graph.getNode(edge.target);
      sources.push({
        edgeId: edge.id,
        edgeType: edge.type,
        sourceName: targetNode?.name ?? edge.target,
        delta: mods[attribute],
      });
    }

    // Special case: located_at edges also contribute terrain modifiers
    if (edge.type === 'located_at') {
      const loc = graph.getNode(edge.target);
      if (loc && loc.type === 'location') {
        const terrain = loc.properties.terrain as TerrainType | undefined;
        if (terrain) {
          const terrainMods = getTerrainModifiers(terrain);
          if (typeof terrainMods[attribute] === 'number') {
            sources.push({
              edgeId: edge.id,
              edgeType: 'located_at',
              sourceName: `terrain:${terrain}`,
              delta: terrainMods[attribute],
            });
          }
        }
      }
    }
  }

  // --- Incoming edges ---
  const incoming = graph.getIncomingEdges(nodeId);
  for (const edge of incoming) {
    const mods = edge.properties.modifiers as Record<string, number> | undefined;
    if (mods && typeof mods[attribute] === 'number') {
      const sourceNode = graph.getNode(edge.source);
      sources.push({
        edgeId: edge.id,
        edgeType: edge.type,
        sourceName: sourceNode?.name ?? edge.source,
        delta: mods[attribute],
      });
    }
  }

  return sources;
}

/**
 * Compute the final value for `attribute` on `nodeId`:
 *   finalValue = max(floor, baseValue + sum(modifier deltas))
 *
 * When `tick` is provided, emits a `modifier_resolution` trace for the debug panel.
 */
export function getModifiedValue(
  graph: WorldGraph,
  nodeId: string,
  attribute: string,
  baseValue: number,
  tick?: number,
): number {
  const modifiers = collectModifiers(graph, nodeId, attribute);
  if (modifiers.length === 0) return baseValue;

  const totalDelta = modifiers.reduce((sum, m) => sum + m.delta, 0);
  const floor = getFloor(attribute);
  const finalValue = Math.max(floor, baseValue + totalDelta);

  if (tick !== undefined) {
    emitTrace({
      tick,
      category: 'modifier_resolution',
      agentId: nodeId,
      summary: `${attribute}: ${baseValue} ${totalDelta >= 0 ? '+' : ''}${totalDelta} = ${finalValue}`,
      nodeId,
      attribute,
      baseValue,
      modifiers,
      finalValue,
    });
  }

  return finalValue;
}
