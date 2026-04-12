// src/engine/strategicGraphOps.ts
//
// Safe graph mutations for strategic action outcomes.
// Reuses existing edge types (trades_with, controls, constructed_by, member_of, contains).
// No new node types in v1.
//
// NFP #4 (Fail-soft): Every mutation returns success/failure, never throws.
// NFP #2 (Inspectability): Returns descriptions of operations performed.

import type { WorldGraph } from './graph';

export interface GraphOpResult {
  success: boolean;
  op: string;
  createdId?: string;
  error?: string;
}

/**
 * Create a trades_with edge between two locations.
 */
export function createTradeRoute(
  graph: WorldGraph,
  sourceLocationId: string,
  targetLocationId: string,
  actorId: string,
  tick: number,
): GraphOpResult {
  try {
    const source = graph.getNode(sourceLocationId);
    const target = graph.getNode(targetLocationId);
    if (!source || !target) {
      return { success: false, op: 'create_trade_route', error: 'location_not_found' };
    }

    // Check if route already exists
    const existing = graph.getOutgoingEdges(sourceLocationId, 'trades_with')
      .find(e => e.target === targetLocationId);
    if (existing) {
      return { success: false, op: 'create_trade_route', error: 'route_already_exists' };
    }

    const edgeId = `trades_with_${sourceLocationId}_${targetLocationId}_${tick}`;
    graph.addEdge({
      id: edgeId,
      source: sourceLocationId,
      target: targetLocationId,
      type: 'trades_with',
      properties: {
        establishedTick: tick,
        establishedBy: actorId,
        volume: 1,
      },
    });

    return { success: true, op: 'create_trade_route', createdId: edgeId };
  } catch (e) {
    return { success: false, op: 'create_trade_route', error: String(e) };
  }
}

/**
 * Create a sublocation (warehouse, guild chapter, etc.) at a location.
 * Uses the existing sublocation node type + contains/constructed_by edges.
 */
export function createSublocation(
  graph: WorldGraph,
  parentLocationId: string,
  actorId: string,
  name: string,
  sublocationTypeId: string,
  tick: number,
): GraphOpResult {
  try {
    const parent = graph.getNode(parentLocationId);
    if (!parent) {
      return { success: false, op: 'create_sublocation', error: 'parent_not_found' };
    }

    const nodeId = `subloc_${sublocationTypeId}_${parentLocationId}_${tick}`;

    graph.addNode({
      id: nodeId,
      name,
      type: 'sublocation',
      properties: {
        sublocationTypeId,
        parentLocationId,
        hexCol: parent.properties.hexCol,
        hexRow: parent.properties.hexRow,
        createdTick: tick,
        createdBy: actorId,
      },
    });

    // contains edge: parent → sublocation
    graph.addEdge({
      id: `contains_${parentLocationId}_${nodeId}`,
      source: parentLocationId,
      target: nodeId,
      type: 'contains',
      properties: {},
    });

    // constructed_by edge: sublocation → actor
    graph.addEdge({
      id: `constructed_by_${nodeId}_${actorId}`,
      source: nodeId,
      target: actorId,
      type: 'constructed_by',
      properties: { tick },
    });

    return { success: true, op: 'create_sublocation', createdId: nodeId };
  } catch (e) {
    return { success: false, op: 'create_sublocation', error: String(e) };
  }
}

/**
 * Create a controls edge from actor to a target node.
 */
export function claimControl(
  graph: WorldGraph,
  actorId: string,
  targetNodeId: string,
  tick: number,
): GraphOpResult {
  try {
    const actor = graph.getNode(actorId);
    const target = graph.getNode(targetNodeId);
    if (!actor || !target) {
      return { success: false, op: 'claim_control', error: 'node_not_found' };
    }

    // Check existing control
    const existing = graph.getOutgoingEdges(actorId, 'controls')
      .find(e => e.target === targetNodeId);
    if (existing) {
      return { success: false, op: 'claim_control', error: 'already_controls' };
    }

    const edgeId = `controls_${actorId}_${targetNodeId}_${tick}`;
    graph.addEdge({
      id: edgeId,
      source: actorId,
      target: targetNodeId,
      type: 'controls',
      properties: {
        establishedTick: tick,
        controlType: 'strategic',
      },
    });

    return { success: true, op: 'claim_control', createdId: edgeId };
  } catch (e) {
    return { success: false, op: 'claim_control', error: String(e) };
  }
}

/**
 * Add or update a member_of edge (actor → faction).
 */
export function joinOrUpdateMembership(
  graph: WorldGraph,
  actorId: string,
  factionId: string,
  tick: number,
): GraphOpResult {
  try {
    const existing = graph.getOutgoingEdges(actorId, 'member_of')
      .find(e => e.target === factionId);
    if (existing) {
      return { success: false, op: 'join_faction', error: 'already_member' };
    }

    const edgeId = `member_of_${actorId}_${factionId}_${tick}`;
    graph.addEdge({
      id: edgeId,
      source: actorId,
      target: factionId,
      type: 'member_of',
      properties: {
        joinedTick: tick,
        rank: 0,
      },
    });

    return { success: true, op: 'join_faction', createdId: edgeId };
  } catch (e) {
    return { success: false, op: 'join_faction', error: String(e) };
  }
}

/**
 * Modify a numeric property on a location node (e.g. defense, prosperity, magicalSaturation).
 * Clamps to optional bounds. Fail-soft: missing location → failure, not crash.
 */
export function modifyLocationProperty(
  graph: WorldGraph,
  locationId: string,
  property: string,
  delta: number,
  clamp?: [number, number],
): GraphOpResult {
  try {
    const loc = graph.getNode(locationId);
    if (!loc) {
      return { success: false, op: 'modify_location_property', error: 'location_not_found' };
    }

    const current = (loc.properties[property] as number | undefined) ?? 0;
    let newValue = current + delta;
    if (clamp) {
      newValue = Math.max(clamp[0], Math.min(clamp[1], newValue));
    }
    loc.properties[property] = newValue;

    return { success: true, op: 'modify_location_property' };
  } catch (e) {
    return { success: false, op: 'modify_location_property', error: String(e) };
  }
}

/**
 * Create a typed edge between two nodes (actor→target or target→actor).
 * Generic primitive for sacred routes, patronage networks, spy networks, etc.
 */
export function createRelationEdge(
  graph: WorldGraph,
  sourceId: string,
  targetId: string,
  edgeType: string,
  tick: number,
  properties?: Record<string, unknown>,
): GraphOpResult {
  try {
    const source = graph.getNode(sourceId);
    const target = graph.getNode(targetId);
    if (!source || !target) {
      return { success: false, op: 'create_relation_edge', error: 'node_not_found' };
    }

    // Check for duplicate
    const existing = graph.getOutgoingEdges(sourceId, edgeType)
      .find(e => e.target === targetId);
    if (existing) {
      return { success: false, op: 'create_relation_edge', error: 'edge_already_exists' };
    }

    const edgeId = `${edgeType}_${sourceId}_${targetId}_${tick}`;
    graph.addEdge({
      id: edgeId,
      source: sourceId,
      target: targetId,
      type: edgeType,
      properties: { establishedTick: tick, ...properties },
    });

    return { success: true, op: 'create_relation_edge', createdId: edgeId };
  } catch (e) {
    return { success: false, op: 'create_relation_edge', error: String(e) };
  }
}

/**
 * Record an information-only strategic outcome (survey, reconnaissance).
 * Stores the result as a property on the actor node.
 */
export function recordIntelligence(
  graph: WorldGraph,
  actorId: string,
  targetNodeId: string,
  intelligenceType: string,
  tick: number,
): GraphOpResult {
  try {
    const actor = graph.getNode(actorId);
    if (!actor) {
      return { success: false, op: 'record_intelligence', error: 'actor_not_found' };
    }

    const existing = (actor.properties.strategicIntelligence as Record<string, number> | undefined) ?? {};
    actor.properties.strategicIntelligence = {
      ...existing,
      [`${intelligenceType}_${targetNodeId}`]: tick,
    };

    return { success: true, op: 'record_intelligence' };
  } catch (e) {
    return { success: false, op: 'record_intelligence', error: String(e) };
  }
}
