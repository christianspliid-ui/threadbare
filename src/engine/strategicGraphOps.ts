// src/engine/strategicGraphOps.ts
//
// Safe graph mutations for strategic action outcomes.
// Reuses existing edge types (trades_with, controls, constructed_by, member_of, contains).
// No new node types in v1.
//
// NFP #4 (Fail-soft): Every mutation returns success/failure, never throws.
// NFP #2 (Inspectability): Returns descriptions of operations performed.

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import {
  ROUTE_IDENTITY_SUBTYPE,
  SUBORNED_WARBAND_DISSOLUTION_REASON,
  WARBAND_INITIAL_COHESION,
  WARBAND_TARGET_MEMBER_COUNT,
} from '../data/strategic-action-constants';
import { getAgentLocationId, getAgentsAtLocation, getFactionMembershipEdges } from './graphQueries';
// ── The T3 tier's writers (THR-1309) ──
// Imported rather than reproduced: each of these is the *single* writer for its shape,
// and a second mint site is a second shape (the lesson `groupShape.ts` records).
import type { GameState } from '../types/gameState';
import type { ReachDomain } from '../types/traits';
import type { LocationSubtype } from '../types/index';
import type { StrategicFactionSeed } from '../types/strategicAction';
import type { FactionDefinition, FactionRankTier, FactionType } from '../types/faction';
import { FACTION_REPUTATION_DECAY_PER_TICK } from '../data/faction-constants';
import {
  registerDynamicFactionDefinition,
  unregisterDynamicFactionDefinition,
} from '../data/faction-definition-lookup';
import { GROUP_MAX_MEMBERS, GROUP_MIN_MEMBERS } from '../data/group-constants';
import { createGroup } from './groups/groupFormation';
import { dissolveGroup } from './groups/groupDissolution';
import { getGroupMemberEdges, getGroupPosition, isAgentGone, isGrouped } from './groups/groupQueries';
import { refreshRoster } from './groups/groupCohesion';
import { isCompanyGroupNode } from './groupShape';
import { seedFactionFromDefinition } from './factionSeeding';
import { buildRouteManifest } from './tradeRoute';
import { validateEdgeEndpoints } from '../types/edgeSchema';
import { emitTrace } from './traceBuffer';
import type { RouteCargoAssignedTrace, TraceEntry } from '../types/trace';
import type { SublocationPersistence } from '../types/sublocation';

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

    // Derive a cargo manifest from the two endpoints' stock tiers (P2, THR-616).
    // Fail-soft: resourceless endpoints yield the empty manifest (volume-only route).
    const manifest = buildRouteManifest(
      source.properties as Record<string, unknown>,
      target.properties as Record<string, unknown>,
    );
    const goodsType = manifest.goods[0] ?? 'unknown';

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
        goodsType,
        manifest,
        // The founding caravan IS the first trade — without this stamp the
        // route reads lastTraded=0, is stale at birth, and the decay phase
        // dissolves it within a tick of creation (THR-669).
        lastTraded: tick,
      },
    });

    if (manifest.goods.length > 0) {
      emitTrace({
        category: 'route_cargo_assigned',
        tick,
        agentId: actorId,
        summary: `Route ${source.name} ↔ ${target.name}: cargo ${manifest.goods.join(', ')}${manifest.carriesStaple ? ' (staple)' : ''}`,
        edgeId,
        sourceId: sourceLocationId,
        targetId: targetLocationId,
        goods: manifest.goods,
        totalValue: manifest.totalValue,
        carriesStaple: manifest.carriesStaple,
      } satisfies Omit<RouteCargoAssignedTrace, 'id' | 'timestamp'> as Omit<TraceEntry, 'id' | 'timestamp'>);
    }

    return { success: true, op: 'create_trade_route', createdId: edgeId };
  } catch (e) {
    return { success: false, op: 'create_trade_route', error: String(e) };
  }
}

/**
 * Create a sublocation (warehouse, guild chapter, etc.) at a location.
 *
 * Mints the canonical sublocation shape — a `location` node carrying
 * `parentLocationId` — plus contains/constructed_by edges. See `sublocationShape.ts`
 * for why that is the one shape and how readers ask about it (THR-1183).
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

    // THR-1183: minted as a `location` node carrying `parentLocationId` — the same
    // shape `sublocation.ts` has always produced. Minting `type: 'sublocation'` here
    // put strategic sublocations outside every `getNodesByType('location')` sweep while
    // canonical ones sat outside every `getNodesByType('sublocation')` sweep, so each
    // shape was half-visible to the codebase in complementary halves. See
    // `sublocationShape.ts` for the discriminator every reader now shares.
    graph.addNode({
      id: nodeId,
      name,
      type: 'location',
      properties: {
        sublocationTypeId,
        parentLocationId,
        // `persistence` is a required field of `SublocationProperties` that this writer
        // never wrote — a contract violation that stayed invisible only because the old
        // `type: 'sublocation'` node sat outside `checkDissolutions`' location sweep.
        // A strategically-built structure is permanent, matching the canonical writer.
        persistence: { type: 'permanent' } satisfies SublocationPersistence,
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

    // Check existing control. THR-1297: a node this actor already holds as a *holding*
    // blocks the claim too — otherwise taking title to a place and then claiming a
    // control stance over it leaves two live claims on one node, and `releaseControl`
    // (which only retires `controlType: 'strategic'` edges) would clear one and leave
    // the other standing.
    const existing = graph.getOutgoingEdges(actorId, 'controls')
      .find(e => e.target === targetNodeId)
      ?? graph.getOutgoingEdges(actorId, 'owns').find(e => e.target === targetNodeId);
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
 * Retire the `controls` edge a collapsed strategic stance left behind (THR-1286).
 *
 * Only edges this pack minted are removed — the `controlType: 'strategic'` stamp
 * written by `claimControl` above. Worldgen mints its own `controls` edges carrying an
 * `influence` property and no `controlType` (144 of the 161 in a seed-42 medium world at
 * tick 150); those describe standing political control and are none of this pack's
 * business.
 *
 * Without this the stale edge outlived the stance it recorded and made every later
 * re-claim of that target fail `already_controls` — the decision was spent, nothing
 * happened, and the same candidate returned next tick.
 *
 * Fail-soft (NFP #4): a missing edge is `success: true` with `createdId` absent, since
 * the desired end state — no strategic control edge here — already holds.
 */
export function releaseControl(
  graph: WorldGraph,
  actorId: string,
  targetNodeId: string,
): GraphOpResult {
  try {
    const dead = graph.getOutgoingEdges(actorId, 'controls')
      .filter(e => e.target === targetNodeId && e.properties?.controlType === 'strategic');

    for (const edge of dead) {
      graph.removeEdge(edge.id);
    }

    return { success: true, op: 'release_control', createdId: dead[0]?.id };
  } catch (e) {
    return { success: false, op: 'release_control', error: String(e) };
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
    const existing = getFactionMembershipEdges(graph, actorId)
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

    // ── Schema chokepoint (THR-1177) ────────────────────────────────────────
    // This function's `edgeType` is a bare `string` and nothing narrowed it, so it was
    // the one path by which an entirely unregistered family could enter the graph —
    // the audit found four live `sacred_route` edges minted exactly this way, of a type
    // that existed in neither `EdgeType` nor `EDGE_SCHEMA` and which therefore nothing
    // could validate or consume. Refuse fail-soft, consistent with this module's
    // contract (NFP #4): every mutation returns success/failure and never throws.
    const violation = validateEdgeEndpoints(edgeType, source.type, target.type);
    if (violation) {
      emitTrace({
        category: 'edge_schema_refused',
        tick,
        summary: `Refused ${edgeType} edge: ${violation.message}`,
        edgeType,
        chokepoint: 'create_relation_edge',
        reason: violation.reason,
        sourceId,
        targetId,
        sourceNodeType: source.type,
        targetNodeType: target.type,
      });
      return { success: false, op: 'create_relation_edge', error: violation.message };
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

// ─── The explorer economy (THR-1297 §7) ─────────────────────────────
//
// Three ops, one principle: an explorer's find is a **lead the world can act on**,
// never a private score. Each writes into an economy that already has consumers —
// the ruins layer's clue→familiarity convergence, and the treasure-map possession
// lifecycle — so a chart verb feeds systems that exist rather than minting a
// currency only it reads. That is what makes the wilderness arc join the game
// instead of dead-ending in the actor's property bag.

/**
 * Plant a transient clue about a location on the actor.
 *
 * Idempotent per (actor, location): a re-survey of somewhere already clued refuses
 * rather than stacking leads, because the ruins layer consumes the *first* unconsumed
 * clue and a pile of duplicates would read as one find repeated forever.
 */
export function spawnClue(
  graph: WorldGraph,
  actorId: string,
  targetLocationId: string,
  tick: number,
  magnitude: number,
  precision: number,
  detail?: string,
): GraphOpResult {
  try {
    const actor = graph.getNode(actorId);
    const target = graph.getNode(targetLocationId);
    if (!actor || !target) {
      return { success: false, op: 'spawn_clue', error: 'node_not_found' };
    }

    const violation = validateEdgeEndpoints('knows_clue_of', actor.type, target.type);
    if (violation) {
      return { success: false, op: 'spawn_clue', error: violation.message };
    }

    const existing = graph.getOutgoingEdges(actorId, 'knows_clue_of')
      .find(e => e.target === targetLocationId && e.properties?.consumed !== true);
    if (existing) {
      return { success: false, op: 'spawn_clue', error: 'clue_already_held' };
    }

    const edgeId = `knows_clue_of_${actorId}_${targetLocationId}_${tick}`;
    graph.addEdge({
      id: edgeId,
      source: actorId,
      target: targetLocationId,
      type: 'knows_clue_of',
      properties: {
        magnitude,
        precision,
        source: 'undertaking_survey',
        discoveredTick: tick,
        consumed: false,
        ...(detail ? { detail } : {}),
      },
    });

    return { success: true, op: 'spawn_clue', createdId: edgeId };
  } catch (e) {
    return { success: false, op: 'spawn_clue', error: String(e) };
  }
}

/**
 * Stamp durable familiarity with a location.
 *
 * The same edge clue-convergence writes, written directly because a survey that
 * *found* the place has already done what convergence does. Refuses a duplicate:
 * familiarity is a fact, not a counter.
 */
export function seedKnowsOf(
  graph: WorldGraph,
  actorId: string,
  targetLocationId: string,
  tick: number,
): GraphOpResult {
  try {
    const actor = graph.getNode(actorId);
    const target = graph.getNode(targetLocationId);
    if (!actor || !target) {
      return { success: false, op: 'seed_knows_of', error: 'node_not_found' };
    }

    const violation = validateEdgeEndpoints('knows_of', actor.type, target.type);
    if (violation) {
      return { success: false, op: 'seed_knows_of', error: violation.message };
    }

    const existing = graph.getOutgoingEdges(actorId, 'knows_of')
      .find(e => e.target === targetLocationId);
    if (existing) {
      return { success: false, op: 'seed_knows_of', error: 'already_known' };
    }

    const edgeId = `knows_of_${actorId}_${targetLocationId}_${tick}`;
    graph.addEdge({
      id: edgeId,
      source: actorId,
      target: targetLocationId,
      type: 'knows_of',
      properties: { fromSurvey: true, convergedTick: tick },
    });

    return { success: true, op: 'seed_knows_of', createdId: edgeId };
  } catch (e) {
    return { success: false, op: 'seed_knows_of', error: String(e) };
  }
}

/**
 * Mint a treasure map possession pointing at a location.
 *
 * A **possession**, not a property, and that is the design rather than an
 * implementation detail: the map can be stolen, and being stealable is the entire
 * counter-play of the `chart_find` kind. `consumeOnEvent` joins it to the existing
 * `treasureMapConsumption` lifecycle — a map minted without one is a map nobody can
 * ever spend, so the default points at the event that sweep already listens for.
 */
export function mintTreasureMap(
  graph: WorldGraph,
  actorId: string,
  targetLocationId: string,
  tick: number,
  consumeOnEvent: string = 'hidden_site_discovered',
): GraphOpResult {
  try {
    const actor = graph.getNode(actorId);
    const target = graph.getNode(targetLocationId);
    if (!actor || !target) {
      return { success: false, op: 'mint_treasure_map', error: 'node_not_found' };
    }

    // One live map per (actor, site). A second chart of the same place deepens the
    // lead through `spawn_clue`; it does not hand the actor a duplicate to sell.
    const duplicate = graph.getOutgoingEdges(actorId, 'possesses')
      .map(e => graph.getNode(e.target))
      .some(n => n?.properties?.mapsToLocationId === targetLocationId);
    if (duplicate) {
      return { success: false, op: 'mint_treasure_map', error: 'map_already_held' };
    }

    const mapId = `artifact_chart_${actorId}_${targetLocationId}_${tick}`;
    graph.addNode({
      id: mapId,
      type: 'artifact',
      name: `Chart to ${target.name ?? 'an unmarked place'}`,
      properties: {
        // Canonical `PossessionSubcategory` — the art resolver keys off it, and a
        // non-canonical value resolves to no plate at all (caught by the seeded-world
        // art coverage test, which is why it is not merely cosmetic). A chart is a
        // document before it is a tool.
        subcategory: 'tomes_scrolls',
        // `AttachmentTier` is numeric 1–4 (Mundane…Legendary), not a string.
        tier: 1,
        tags: ['treasure_map', 'chart'],
        mechanicalSummary: 'Marks a place worth finding.',
        lossCondition: 'losable',
        grantsTraitWhileHeld: 'ruin_seeker',
        consumeOnEvent,
        mapsToLocationId: targetLocationId,
        createdTick: tick,
        effects: [],
      },
    });
    graph.addEdge({
      id: `possesses_${actorId}_${mapId}`,
      source: actorId,
      target: mapId,
      type: 'possesses',
      properties: { modifiers: {}, tags: ['treasure_map'] },
    });

    return { success: true, op: 'mint_treasure_map', createdId: mapId };
  } catch (e) {
    return { success: false, op: 'mint_treasure_map', error: String(e) };
  }
}

/**
 * Take a `knows_secret_of` hold on another actor — the `leverage_mark` kind's object.
 *
 * Writes all five of the row's required properties, which is the reason this exists
 * rather than a `create_relation_edge` call: the generic maker stamps `establishedTick`
 * and nothing else, so every mark it minted would warn on the schema and arrive without
 * the fields the Secrets & Favors economy presses. `revealed: false` is the mark's
 * whole value — a revealed secret is spent.
 *
 * Idempotent per (holder, subject, secretType): pressing an existing mark is the update
 * verb's job, not a second edge.
 */
export function mintLeverageMark(
  graph: WorldGraph,
  holderId: string,
  subjectId: string,
  secretType: string,
  magnitude: number,
  tick: number,
): GraphOpResult {
  try {
    const holder = graph.getNode(holderId);
    const subject = graph.getNode(subjectId);
    if (!holder || !subject) {
      return { success: false, op: 'mint_leverage_mark', error: 'node_not_found' };
    }
    if (holderId === subjectId) {
      return { success: false, op: 'mint_leverage_mark', error: 'self_target' };
    }

    const violation = validateEdgeEndpoints('knows_secret_of', holder.type, subject.type);
    if (violation) {
      return { success: false, op: 'mint_leverage_mark', error: violation.message };
    }

    const existing = graph.getOutgoingEdges(holderId, 'knows_secret_of')
      .find(e => e.target === subjectId && e.properties?.secretType === secretType);
    if (existing) {
      return { success: false, op: 'mint_leverage_mark', error: 'mark_already_held' };
    }

    const edgeId = `knows_secret_of_${holderId}_${subjectId}_${tick}`;
    graph.addEdge({
      id: edgeId,
      source: holderId,
      target: subjectId,
      type: 'knows_secret_of',
      properties: {
        secretType,
        magnitude,
        discoveredTick: tick,
        source: 'undertaking_cultivation',
        revealed: false,
      },
    });

    return { success: true, op: 'mint_leverage_mark', createdId: edgeId };
  } catch (e) {
    return { success: false, op: 'mint_leverage_mark', error: String(e) };
  }
}

/**
 * Press a held mark into an owed favor — the leverage arc's *use* step.
 *
 * **Refuses when no unrevealed mark is held**, and that refusal is the point: it is
 * what makes cultivate → press → burn a sequence rather than three verbs that happen
 * to share a noun. The debt is minted subject → holder (the subject owes), carrying the
 * five properties `owes_favor` requires.
 */
export function pressTheMark(
  graph: WorldGraph,
  holderId: string,
  subjectId: string,
  favorMagnitude: number,
  context: string,
  tick: number,
): GraphOpResult {
  try {
    const holder = graph.getNode(holderId);
    const subject = graph.getNode(subjectId);
    if (!holder || !subject) {
      return { success: false, op: 'press_the_mark', error: 'node_not_found' };
    }

    const mark = graph.getOutgoingEdges(holderId, 'knows_secret_of')
      .find(e => e.target === subjectId && e.properties?.revealed !== true);
    if (!mark) {
      return { success: false, op: 'press_the_mark', error: 'no_mark_held' };
    }

    const violation = validateEdgeEndpoints('owes_favor', subject.type, holder.type);
    if (violation) {
      return { success: false, op: 'press_the_mark', error: violation.message };
    }

    const edgeId = `owes_favor_${subjectId}_${holderId}_${tick}`;
    graph.addEdge({
      id: edgeId,
      source: subjectId,
      target: holderId,
      type: 'owes_favor',
      properties: {
        magnitude: favorMagnitude,
        context,
        grantedTick: tick,
        redeemed: false,
        broken: false,
      },
    });

    // Pressing spends some of the hold's quiet: a secret used is a secret partly out.
    // The mark survives — burning it is a separate, deliberate act.
    const current = (mark.properties.magnitude as number | undefined) ?? 0;
    graph.updateEdge(mark.id, {
      properties: { ...mark.properties, magnitude: Math.max(0, current - favorMagnitude * 0.5) },
    });

    return { success: true, op: 'press_the_mark', createdId: edgeId };
  } catch (e) {
    return { success: false, op: 'press_the_mark', error: String(e) };
  }
}

/**
 * Forge an artifact the maker keeps — the `masterwork_item` kind's object.
 *
 * Deliberately *not* idempotent per maker: a smith may make more than one good thing
 * in a life, and collapsing them would make the second masterwork silently fail. The
 * tick in the id is what keeps successive pieces distinct.
 *
 * The node is a plain `artifact` carrying the possession property bag the attachment
 * layer already reads, which is why this kind needs no new carrying mechanism — its
 * object *is* an attachment, which is the reason it was chosen as a T1 kind at all.
 */
export function mintMasterwork(
  graph: WorldGraph,
  makerId: string,
  craftTag: string,
  tick: number,
  /** `AttachmentTier`, numeric 1–4. A masterwork defaults to Storied (2). */
  tier: number = 2,
): GraphOpResult {
  try {
    const maker = graph.getNode(makerId);
    if (!maker) {
      return { success: false, op: 'mint_masterwork', error: 'actor_not_found' };
    }

    const itemId = `artifact_masterwork_${makerId}_${tick}`;
    graph.addNode({
      id: itemId,
      type: 'artifact',
      // A working name only — the christening seam (slice 4) renames created nodes at
      // completion through the work namer, which is where the earned name comes from.
      name: `${maker.name ?? 'a maker'}'s ${craftTag}`,
      properties: {
        // Canonical `PossessionSubcategory` — see the note on `mintTreasureMap`.
        subcategory: 'tools_instruments',
        tier,
        tags: ['masterwork', craftTag],
        mechanicalSummary: 'Made well, by someone who meant it.',
        lossCondition: 'losable',
        createdTick: tick,
        craftedBy: makerId,
        effects: [],
      },
    });
    graph.addEdge({
      id: `possesses_${makerId}_${itemId}`,
      source: makerId,
      target: itemId,
      type: 'possesses',
      properties: { modifiers: {}, tags: ['masterwork'] },
    });

    return { success: true, op: 'mint_masterwork', createdId: itemId };
  } catch (e) {
    return { success: false, op: 'mint_masterwork', error: String(e) };
  }
}

// ─── The T2 tier: places, and taking them back (THR-1308) ───────────

/**
 * Mint a place-tier `location` node at a hex — the T2 tier's object.
 *
 * **Why this op did not exist before.** Every T1 kind's object was an edge
 * (`knows_secret_of`), a possession (masterwork, treasure map) or an actor-side
 * record (intelligence, network), and none of those needs a node standing on the
 * map. `createSublocation` mints a room *inside* a place that already exists — its
 * `parentLocationId` is required, and that field is precisely the sublocation
 * discriminator (THR-1183). Nothing minted the place.
 *
 * **Place-tier by construction, not by convention.** The node carries `hexCol` /
 * `hexRow` and deliberately no `parentLocationId`, which is exactly what
 * `isPlaceTierLocation` tests — so a founded settlement is visible to
 * `getPlaceTierLocations` sweeps and invisible to `getSublocationNodes` ones,
 * without either having to learn a new shape.
 *
 * `locationType` is written alongside `locationSubtype` because `worldSeed` writes
 * both on every location it seeds and several readers still take the older key;
 * a node with only one of them is half-visible in the way THR-1183 documents.
 *
 * NFP #4: returns a failure result, never throws. NFP #3: the id is derived from
 * subtype + hex + tick, so the same run mints the same id.
 */
export function createLocation(
  graph: WorldGraph,
  hex: { col: number; row: number },
  actorId: string,
  name: string,
  locationSubtype: string,
  tick: number,
  extraProperties: Record<string, unknown> = {},
): GraphOpResult {
  try {
    const nodeId = `loc_${locationSubtype}_${hex.col}_${hex.row}_${tick}`;
    if (graph.getNode(nodeId)) {
      return { success: false, op: 'create_location', error: 'location_already_exists' };
    }

    graph.addNode({
      id: nodeId,
      name,
      type: 'location',
      properties: {
        locationType: locationSubtype,
        locationSubtype,
        hexCol: hex.col,
        hexRow: hex.row,
        prosperity: 0,
        createdTick: tick,
        createdBy: actorId,
        ...extraProperties,
      },
    });

    // `constructed_by` is the edge the world already reads to say who raised a thing
    // — the same one `createSublocation` writes. A founded place with no builder edge
    // would be a settlement nobody founded.
    graph.addEdge({
      id: `constructed_by_${nodeId}_${actorId}`,
      source: nodeId,
      target: actorId,
      type: 'constructed_by',
      properties: { tick },
    });

    return { success: true, op: 'create_location', createdId: nodeId };
  } catch (e) {
    return { success: false, op: 'create_location', error: String(e) };
  }
}

/**
 * Suspend a trade route running through the target location — the `trade_route`
 * kind's counter-play.
 *
 * **Writes `threatened`, does not delete.** That property is the one the world
 * already consumes: `phaseProsperity` skips a threatened route when it counts the
 * active routes at each endpoint, so a blockade arrives as a prosperity shock the
 * owner feels rather than as a graph edit nobody reads. `routeEvents` clears the
 * flag after `ROUTE_THREATENED_CLEAR_TICKS`, which is the shape counter-play should
 * have — a blockade that never lifts is deletion wearing a counter's name.
 *
 * Picks the lowest-id unthreatened route touching the target, in either direction,
 * so the same world blockades the same route (NFP #3). Also stamps the route's
 * identity node when one exists, so the blockade is legible on the thing that
 * carries the route's name rather than only on an edge property.
 *
 * @returns `no_route` when the endpoint carries none, `already_blockaded` when every
 *   route through it is already suspended — both ordinary refusals, not errors.
 */
export function blockadeRoute(
  graph: WorldGraph,
  actorId: string,
  targetLocationId: string,
  tick: number,
): GraphOpResult {
  try {
    if (!graph.getNode(targetLocationId)) {
      return { success: false, op: 'blockade_route', error: 'location_not_found' };
    }

    const touching = [
      ...graph.getOutgoingEdges(targetLocationId, 'trades_with'),
      ...graph.getIncomingEdges(targetLocationId, 'trades_with'),
    ];
    if (touching.length === 0) {
      return { success: false, op: 'blockade_route', error: 'no_route' };
    }

    const open = touching
      .filter(edge => edge.properties?.threatened !== true)
      .sort((a, b) => a.id.localeCompare(b.id));
    if (open.length === 0) {
      return { success: false, op: 'blockade_route', error: 'already_blockaded' };
    }

    const route = open[0];
    graph.updateEdge(route.id, {
      properties: {
        ...route.properties,
        threatened: true,
        threatenedSinceTick: tick,
        blockadedBy: actorId,
      },
    });

    // The identity face, when the route has one. Fail-soft by omission: a route
    // established before this tier shipped carries no identity node, and blockading
    // it must still work — the edge is the economic authority, the node is the name.
    const identity = findRouteIdentityNode(graph, route.source, route.target);
    if (identity) {
      graph.updateNode(identity.id, {
        properties: {
          ...identity.properties,
          blockaded: true,
          blockadedSinceTick: tick,
          blockadedBy: actorId,
        },
      });
    }

    return { success: true, op: 'blockade_route', createdId: route.id };
  } catch (e) {
    return { success: false, op: 'blockade_route', error: String(e) };
  }
}

/**
 * The identity node for the route between two endpoints, if one was minted.
 *
 * Matches on the endpoint pair recorded in properties rather than on the edge id,
 * because the edge id encodes the tick it was created on and the identity node is
 * looked up long afterwards. Direction-insensitive: a route is the same route read
 * from either end.
 */
export function findRouteIdentityNode(
  graph: WorldGraph,
  endpointA: string,
  endpointB: string,
): GraphNode | undefined {
  const candidates = graph.getNodesByType('location').filter(node => {
    const props = node.properties;
    if (props.locationSubtype !== ROUTE_IDENTITY_SUBTYPE) return false;
    const from = props.routeSourceId;
    const to = props.routeTargetId;
    return (
      (from === endpointA && to === endpointB) || (from === endpointB && to === endpointA)
    );
  });
  // Deterministic when a world somehow carries two (NFP #3).
  candidates.sort((a, b) => a.id.localeCompare(b.id));
  return candidates[0];
}

// ─── The T3 tier: organisations, and breaking them (THR-1309) ───────
//
// T1's objects were records and edges; T2's were places. T3 mints the one kind of
// object that can act back — people who answer to someone. Both ops here write
// **through** the existing single writers (`createGroup`, `seedFactionFromDefinition`,
// `dissolveGroup`) rather than reproducing their graph writes, for the reason
// `groupShape.ts` exists at all: a second minter is a second shape, and the group
// family has already paid for that once.

/**
 * Raise a warband — a real company commanded by the actor (THR-1309).
 *
 * **What this replaces.** `strategic_recruit_warband` completed for the whole life of
 * the corpus and minted nobody: its mutation wrote an intelligence record called
 * `warband_recruited`, so the verb appeared in the completion history, the dashboards
 * counted it, and no band ever existed. That is the "recruit-warband mirage" the plan
 * names, and it is the same failure shape as `press_the_mark` — every layer correct,
 * the arc unable to connect.
 *
 * Routes through `createGroup`, which is the one code path that mints a company: it
 * stamps `groupKind: 'company'` (so `groupShape`'s discriminator sees it without a
 * fallback), writes `commanded_by` to the leader and `member_of` for every recruit
 * with the schema-required `role`/`rank`/`joinedTick` trio, and generates the name.
 * Writing those edges here instead would be a second mint site for a family that
 * THR-1297 §4 spent a slice consolidating.
 *
 * **Where the recruits come from, and why the cast is the load-bearing half.** The
 * template binds a `recruit` cast slot, which the bind pass fills from real people and
 * *mints* when nobody suitable is there. Those bound actors arrive here as
 * `boundRecruitIds` and go into the band first. Colocated ungrouped mortals top the
 * roster up to `WARBAND_TARGET_MEMBER_COUNT` after them.
 *
 * That ordering is the trap-1 answer rather than a nicety. Recruiting purely from
 * whoever happens to be standing at the commander's completion-time location makes the
 * verb's *resolution* depend on a condition its *selection* never checked — the exact
 * shape that let `press_the_mark` complete three times and mint zero debts. The cast is
 * what makes the people a precondition the binding system guarantees, so a raised
 * warband cannot silently be a warband of nobody.
 *
 * `isGrouped` filters both sources: a company whose members belong to another company
 * is two rosters claiming the same people.
 *
 * @returns `no_location` when the commander is nowhere resolvable, `no_recruits` when
 *   too few eligible mortals can be found even so — both ordinary refusals, not
 *   errors. A refusal is the correct outcome of trying to raise a band in an empty
 *   field, and it is visible in the op result rather than silently succeeding.
 */
export function raiseWarband(
  state: GameState,
  actorId: string,
  boundRecruitIds: readonly string[] = [],
): GraphOpResult {
  try {
    const graph = state.graph;
    const locationId = getAgentLocationId(graph, actorId);
    if (!locationId) {
      return { success: false, op: 'create_group', error: 'no_location' };
    }

    const commander = graph.getNode(actorId);
    if (!commander) {
      return { success: false, op: 'create_group', error: 'actor_not_found' };
    }

    const eligible = (n: GraphNode | undefined): n is GraphNode =>
      !!n && n.id !== actorId && !isGrouped(graph, n.id) && !isAgentGone(n);

    // Bound cast first — these are the people the undertaking actually engaged.
    const seen = new Set<string>();
    const recruits: GraphNode[] = [];
    for (const id of boundRecruitIds) {
      const node = graph.getNode(id);
      if (eligible(node) && !seen.has(id)) {
        seen.add(id);
        recruits.push(node);
      }
    }

    // Then whoever else is standing here. Deterministic (NFP #3):
    // `getAgentsAtLocation` returns edge order, which is insertion order, and the
    // slice below is stable — no PRNG draw anywhere in this function.
    for (const node of getAgentsAtLocation(graph, locationId)) {
      if (recruits.length >= WARBAND_TARGET_MEMBER_COUNT) break;
      if (eligible(node) && !seen.has(node.id)) {
        seen.add(node.id);
        recruits.push(node);
      }
    }
    recruits.length = Math.min(recruits.length, WARBAND_TARGET_MEMBER_COUNT);

    // `createGroup` counts the leader in its own `GROUP_MIN_MEMBERS` check, so the
    // commander goes in the member list rather than only on the `commanded_by` edge.
    const members = [commander, ...recruits];
    if (members.length < GROUP_MIN_MEMBERS) {
      return { success: false, op: 'create_group', error: 'no_recruits' };
    }

    const created = createGroup(state, {
      members,
      leaderId: actorId,
      locationId,
      // `raised_warband` rather than `systemic` (THR-1309): the naming layer keys
      // adjectives off `cause`, and `systemic` means strangers who fell in together
      // at the same place — the one thing a recruited band is not. `squad` is the
      // closest `GroupType` the company system carries; a warband is a fighting
      // unit under one commander, which is what that member already means.
      cause: 'raised_warband',
      groupType: 'squad',
      startingCohesion: WARBAND_INITIAL_COHESION,
    });

    if (!created) {
      // `createGroup` is fail-soft and returns undefined on a rejected write or a
      // same-tick id collision. Surfacing it as a refusal keeps that contract.
      return { success: false, op: 'create_group', error: 'group_creation_refused' };
    }

    return { success: true, op: 'create_group', createdId: created.groupId };
  } catch (e) {
    return { success: false, op: 'create_group', error: String(e) };
  }
}

/**
 * Add fighters to a warband the actor already commands — the `warband` kind's *update*.
 *
 * **Why this is a real graph write and not an intelligence record.** The kind's update
 * column is the one place a T3 verb could most easily become a second mirage: the
 * precedent immediately to hand (`strategic_extend_reach`, the network's update) writes
 * `record_intelligence` and changes nothing about the network it claims to extend. That
 * pattern is exactly what `strategic_recruit_warband` was doing before this slice, and
 * shipping a new instance of it while removing the old one would be a wash.
 *
 * So reinforcement writes the same `member_of` edge `createGroup` writes, with the same
 * schema-required `role`/`rank`/`joinedTick` trio, and refreshes the roster mirror
 * through `refreshRoster` — the bookkeeping copy the groups system keeps so a
 * cascade-deleted edge stays detectable. A band that gains people gains *people*.
 *
 * Capped at `GROUP_MAX_MEMBERS` by the same rule `createGroup` applies, so reinforcing
 * a full band is a refusal rather than an overflow.
 *
 * @returns `not_a_company` / `already_disbanded` / `band_full` / `no_recruits` — all
 *   ordinary refusals.
 */
export function reinforceWarband(
  state: GameState,
  actorId: string,
  targetGroupId: string,
  boundRecruitIds: readonly string[] = [],
): GraphOpResult {
  try {
    const graph = state.graph;
    const group = graph.getNode(targetGroupId);
    if (!group) {
      return { success: false, op: 'reinforce_group', error: 'group_not_found' };
    }
    if (!isCompanyGroupNode(group)) {
      return { success: false, op: 'reinforce_group', error: 'not_a_company' };
    }
    if ((group.properties as Record<string, unknown>).groupStatus === 'disbanded') {
      return { success: false, op: 'reinforce_group', error: 'already_disbanded' };
    }

    const currentCount = getGroupMemberEdges(graph, targetGroupId)
      .filter(e => (e.properties as Record<string, unknown>).leftAtTick === undefined).length;
    const room = GROUP_MAX_MEMBERS - currentCount;
    if (room <= 0) {
      return { success: false, op: 'reinforce_group', error: 'band_full' };
    }

    const locationId = getGroupPosition(graph, targetGroupId) ?? getAgentLocationId(graph, actorId);
    if (!locationId) {
      return { success: false, op: 'reinforce_group', error: 'no_location' };
    }

    const eligible = (n: GraphNode | undefined): n is GraphNode =>
      !!n && n.id !== actorId && !isGrouped(graph, n.id) && !isAgentGone(n);

    const seen = new Set<string>();
    const recruits: GraphNode[] = [];
    for (const id of boundRecruitIds) {
      const node = graph.getNode(id);
      if (recruits.length >= room) break;
      if (eligible(node) && !seen.has(id)) { seen.add(id); recruits.push(node); }
    }
    for (const node of getAgentsAtLocation(graph, locationId)) {
      if (recruits.length >= room) break;
      if (eligible(node) && !seen.has(node.id)) { seen.add(node.id); recruits.push(node); }
    }

    if (recruits.length === 0) {
      return { success: false, op: 'reinforce_group', error: 'no_recruits' };
    }

    for (const member of recruits) {
      graph.addEdge({
        id: `e_member_of_${member.id}_${targetGroupId}`,
        source: member.id,
        target: targetGroupId,
        type: 'member_of',
        properties: { role: 'member', rank: 0, joinedTick: state.tick },
      });
    }
    refreshRoster(graph, targetGroupId);

    // Deliberately NO `createdId`: that field means *a node was created*, and
    // `christenCompletedWork` renames whatever it names. Reinforcing creates edges, not
    // a node — returning the band's id here re-christened an already-named company on
    // every reinforcement and produced 'The Murkford Company Company' in a 150-tick
    // seed-99 run. Visible only by reading names out of a real world (the T2 slice hit
    // the same class with 'The The Shattered Sanctum-Greycity Road').
    return { success: true, op: 'reinforce_group' };
  } catch (e) {
    return { success: false, op: 'reinforce_group', error: String(e) };
  }
}

/**
 * Break a warband the actor did not raise — the `warband` kind's counter-play.
 *
 * Writes through `dissolveGroup`, the single dissolution writer, so a suborned band
 * inertifies exactly as a starved one does: node and `member_of` edges stay, each
 * edge stamped `leftAtTick` and `leaveReason`, roster cleared. A hand-rolled
 * `groupStatus: 'disbanded'` write would leave live membership edges pointing at a
 * dead company, and every roster reader in the groups system would go on reporting
 * it as an active band — the counter-play landing on paper and not in the world.
 *
 * @returns `not_a_company` when the target is some other group-family node,
 *   `already_disbanded` when it is already inert. Both ordinary refusals.
 */
export function disbandGroup(
  state: GameState,
  targetGroupId: string,
): GraphOpResult {
  try {
    const graph = state.graph;
    const group = graph.getNode(targetGroupId);
    if (!group) {
      return { success: false, op: 'disband_group', error: 'group_not_found' };
    }
    if (!isCompanyGroupNode(group)) {
      return { success: false, op: 'disband_group', error: 'not_a_company' };
    }
    if ((group.properties as Record<string, unknown>).groupStatus === 'disbanded') {
      return { success: false, op: 'disband_group', error: 'already_disbanded' };
    }

    dissolveGroup(state, group, SUBORNED_WARBAND_DISSOLUTION_REASON);

    // No bespoke trace here: the lifecycle already emits `strategic_world_change`
    // for every completed undertaking's ops, and `faction_seed` — the one shape that
    // looked like a precedent — turns out to be a trace object that is built,
    // returned and never emitted by anybody. Adding an unregistered category would
    // be inventing a feed rather than joining one.
    // No `createdId` here either — breaking a band creates nothing, and the field
    // would send the christener at a company that already has a name.
    return { success: true, op: 'disband_group' };
  } catch (e) {
    return { success: false, op: 'disband_group', error: String(e) };
  }
}

/**
 * The rank ladder every founded order shares.
 *
 * Three tiers rather than the seeded guilds' four: a chartered order has not had time
 * to grow a middle. The `encounterAccess` prefixes point at the same generic guild
 * pools the seed's content ids do, so a member's rank actually gates what the order
 * offers them — a ladder whose tiers unlock nothing is a display string.
 */
const FOUNDED_ORDER_RANK_TIERS: readonly FactionRankTier[] = [
  {
    id: 'sworn',
    name: 'Sworn',
    minReputation: 0.0,
    maxSlots: null,
    bonuses: [],
    encounterAccess: ['ag.quest.'],
  },
  {
    id: 'keeper',
    name: 'Keeper',
    minReputation: 0.4,
    maxSlots: null,
    bonuses: [
      { type: 'encounter_reward_multiplier', value: 1.2, description: '+20% order rewards' },
    ],
    encounterAccess: ['ag.quest.', 'ag.senior.'],
  },
  {
    id: 'leader',
    name: 'Chartermaster',
    minReputation: 0.85,
    maxSlots: 1,
    bonuses: [
      { type: 'scoring_boost', value: 0.2, description: '+0.2 scoring for order encounters' },
    ],
    encounterAccess: ['ag.quest.', 'ag.senior.', 'ag.elite.'],
  },
];

/**
 * FNV-1a over a string, to a positive 32-bit seed.
 *
 * The work namer's idiom (`naming/workNames.ts`), reused so a chartered order's hall
 * placement is a function of its own id and of nothing else — in particular not of
 * how many dice anything else happened to draw earlier in the same tick (NFP #3).
 */
function hashStringToSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return Math.abs(hash | 0);
}

/**
 * Charter a faction — the founded order (THR-1309, absorbing THR-1295).
 *
 * **The gap this closes, stated precisely.** `strategic_found_order` was folded out of
 * the retired initiative pipeline (THR-1292 §3) carrying only half its old payoff: it
 * built a guild-hall sublocation and stopped, with a `TODO(THR-1295)` at its mutation
 * hint recording that the faction waited on this op. Meanwhile
 * `dynamicFactionDefinitions` — the `GameState` field whose entire purpose is holding
 * run-authored faction definitions — has had **no live producer at all** since that
 * retirement: a declared field, an IA-manifest row, and nothing anywhere that writes
 * it. The world could not gain a faction after worldgen by any path.
 *
 * **Why the definition is synthesized rather than picked.** A `FactionDefinition` is
 * the contract the whole faction layer reads — rank ladder, join and promotion
 * encounters, quest and social pools, reputation decay. Reusing a seeded definition
 * would make the founded order a second *instance* of an existing guild rather than a
 * new order; inventing the content ids would make it a faction whose encounters
 * resolve to nothing. So the mechanical half is derived (halls at the founding
 * settlement, reach weights from the founding work) and the content half comes from
 * the template's authored `factionSeed`, pointed at existing generic guild content.
 *
 * **Reach weights come from the template's `reachProfile`, not the founder's node.**
 * The profile is authored, always present, and says what kind of work chartered the
 * order — which is the thing the order should inherit. Reading a capability bag off
 * the actor would make the same verb produce a differently-shaped faction depending
 * on a property whose absence would silently yield `{}`.
 *
 * The definition is recorded into `state.dynamicFactionDefinitions` **before** seeding,
 * so a faction node can always resolve its own definition: every reader of a faction's
 * rank ladder goes through that map, and a node seeded against a definition nobody
 * stored is a faction that cannot answer what its own ranks are. On a hall-less seed
 * the entry is rolled back rather than left behind.
 *
 * @returns `no_qualifying_locations` when the seeder found nowhere to seat a hall — an
 *   ordinary refusal, not an error: you cannot charter an order with no town to
 *   charter it in.
 */
export function foundFaction(
  state: GameState,
  actorId: string,
  targetLocationId: string,
  seed: StrategicFactionSeed,
  reachWeights: Partial<Record<ReachDomain, number>>,
  renderedName: string,
  tick: number,
): GraphOpResult {
  try {
    const graph = state.graph;
    if (!graph.getNode(actorId)) {
      return { success: false, op: 'create_group', error: 'actor_not_found' };
    }
    if (!graph.getNode(targetLocationId)) {
      return { success: false, op: 'create_group', error: 'location_not_found' };
    }

    // Deterministic id (NFP #3): founder plus tick, so the same run charters the same
    // order under the same id. Also the natural uniqueness key — one actor cannot
    // found two orders on the same tick.
    const definitionId = `founded_${actorId}_${tick}`;
    if (state.dynamicFactionDefinitions?.[definitionId]) {
      return { success: false, op: 'create_group', error: 'faction_already_founded' };
    }

    const definition: FactionDefinition = {
      id: definitionId,
      nameTemplate: renderedName,
      description: seed.description,
      motto: seed.motto,
      iconGlyph: seed.iconGlyph,
      themeColor: seed.themeColor,
      factionType: seed.factionType as FactionType,
      reachWeights,
      locationTypes: seed.locationTypes as LocationSubtype[],
      rankTiers: [...FOUNDED_ORDER_RANK_TIERS],
      reputationDecayPerTick: FACTION_REPUTATION_DECAY_PER_TICK,
      joinEncounterTemplateId: seed.joinEncounterTemplateId,
      promotionEncounterTemplateId: seed.promotionEncounterTemplateId,
      questTemplateIds: [...seed.questTemplateIds],
      socialTemplateIds: [...seed.socialTemplateIds],
      expulsionConsequences: [{ type: 'remove_encounters', params: {} }],
    };

    // Recorded before seeding — see the doc comment.
    if (!state.dynamicFactionDefinitions) state.dynamicFactionDefinitions = {};
    state.dynamicFactionDefinitions[definitionId] = definition;
    // Mirrored to the shared lookup in the same breath (THR-1322). The render
    // side resolves definitions from an id with no `GameState` in hand — every
    // tooltip, the sigil registry, the hex map's coat-of-arms roster — so a
    // definition recorded only in state is a faction that draws as a nameless
    // fallback everywhere the player can actually see it.
    registerDynamicFactionDefinition(definition);

    const allLocationIds = graph.getNodesByType('location').map(n => n.id);
    const result = seedFactionFromDefinition(
      graph,
      definition,
      allLocationIds,
      hashStringToSeed(definitionId),
      undefined,
      // Chartered where the founder did the work, not at a shuffled site.
      targetLocationId,
    );

    if (result.guildHallIds.length === 0) {
      // The seeder fail-softs to a hall-less faction when nothing qualifies. That is
      // an order with no seat, so roll the definition back rather than leaving a
      // half-founded entry the faction layer would go on reading forever.
      delete state.dynamicFactionDefinitions[definitionId];
      unregisterDynamicFactionDefinition(definitionId);
      return { success: false, op: 'create_group', error: 'no_qualifying_locations' };
    }

    // `commanded_by`, not `constructed_by`. The latter is the edge that says who
    // *built* a thing and its schema is `location|sublocation → actor` — a faction is
    // an actor, so writing it there logs a `[GraphSchema]` violation on every founding
    // and gives the world a malformed edge (trap 2: assert well-formedness at the
    // writer, not where a seed happens to exercise it).
    //
    // `commanded_by` is `actor → actor` and says the truer thing anyway: the plan
    // marks a faction "led, not held". It also earns its keep — `getCommandedEntities`
    // reads this edge, so the founder can reach through their own order for remote
    // undertakings rather than the founding being a fact nothing consults.
    graph.addEdge({
      id: `commanded_by_${result.factionId}_${actorId}`,
      source: result.factionId,
      target: actorId,
      type: 'commanded_by',
      properties: { assignedTick: tick },
    });

    return { success: true, op: 'create_group', createdId: result.factionId };
  } catch (e) {
    return { success: false, op: 'create_group', error: String(e) };
  }
}
