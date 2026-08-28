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
import { ROUTE_IDENTITY_SUBTYPE } from '../data/strategic-action-constants';
import { getFactionMembershipEdges } from './graphQueries';
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
