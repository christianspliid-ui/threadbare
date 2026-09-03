/**
 * Undertaking object types — the verb × object-type registry (THR-1392 slice 1).
 *
 * An undertaking is a **verb** acted on an **object the world already has**. Each
 * object type registers once: what shape its objects take in the graph, which edges
 * say who holds one, how its tier is read off the object, and what each verb *does*
 * to one — the graph ops that already exist, re-homed under the object they act on
 * instead of under the template that happened to mention them. A template that
 * "burns the charts" is a fiction; `undo × attachment` is a cell, and the chart is
 * whichever attachment the actor resolved.
 *
 * **The grammar does not write the consequences.** Every semantic below is an
 * authored decision made once (what undoing a route means — suspend, not delete;
 * what seizing an attachment does — the `possesses` edge moves). A verb an object
 * type does not declare is not enumerated as a cell, and the resolver traces
 * `undertaking_cell_unreachable` (reason `no_semantic_declared`) so the gap is a
 * measurement rather than a silent hole. Slice 1 declares the semantics that map
 * one-to-one onto a shipped op; the rest are named in the status fragment as slice-2
 * decisions, never faked here.
 *
 * Behind `UNDERTAKING_MODEL` (`strategic-action-constants.ts`): with the flag on
 * `templates` nothing here is reached from the tick loop. See
 * `Docs/plans/2026-09-03-thr-1392-verb-object-undertakings.md` § Engine pillar.
 */
import type { GameState } from '../types/gameState';
import type { WorldGraph } from '../engine/graph';
import type { GraphEdge, GraphNode, NodeType, EdgeType } from '../types/graph';
import type {
  UndertakingHarmClass,
  UndertakingObjectHandle,
  UndertakingObjectTypeId,
  UndertakingVerbVariant,
  WorkLexiconId,
} from '../types/strategicAction';
import type { SimulationRuntime } from '../engine/simulationRuntime';
import {
  type GraphOpResult,
  mintMasterwork,
  createSublocation,
  createLocation,
  modifyLocationProperty,
  createTradeRoute,
  blockadeRoute,
  raiseWarband,
  reinforceWarband,
  disbandGroup,
  pressTheMark,
} from '../engine/strategicGraphOps';
import { grantHolding, transferHolding, razeHolding } from '../engine/holdings';
import { applyPlantSchism } from '../engine/schismPlant';
import { isSublocationNode, isPlaceTierLocation, resolveToParentLocation } from '../engine/sublocationShape';
import { resolveDurableActorLocation } from '../engine/tradeRouteOps';
import { getGroupKind } from '../engine/groupShape';
import { hexDistance } from '../lib/hexMath';
import { SUBLOCATION_TYPE_CATEGORY } from './sublocation-category-art';
import {
  ROUTE_IDENTITY_SUBTYPE,
  FOUNDED_SETTLEMENT_INITIAL_PROSPERITY,
  UNDERTAKING_SCHISM_RESOLUTION_DELAY_TICKS,
  UNDERTAKING_DEFAULT_ROOM_TYPE_ID,
  UNDERTAKING_DEFAULT_SETTLEMENT_SUBTYPE,
  UNDERTAKING_IMPROVE_PROSPERITY_DELTA,
  RUINED_SETTLEMENT_PROSPERITY_FLOOR,
  UNDERTAKING_ROUTE_TIER_HEX_BANDS,
  UNDERTAKING_COMPANY_TIER_ROSTER_BANDS,
  UNDERTAKING_FACTION_TIER_MEMBER_BANDS,
  UNDERTAKING_MARK_TIER_MAGNITUDE_BANDS,
  UNDERTAKING_DEFAULT_TIER,
} from './strategic-action-constants';

// ─── Shapes ─────────────────────────────────────────────────────────

export type UndertakingObjectTier = 1 | 2 | 3;

/** What an object type's objects look like in the graph — read by the resolver, never re-derived. */
export interface UndertakingObjectShape {
  /** Node objects: the node type, plus an optional discriminator on the node. */
  readonly nodeType?: NodeType;
  /** Edge objects: the edge type, plus an optional discriminator on the edge. */
  readonly edgeType?: EdgeType;
  readonly discriminator?: (n: GraphNode) => boolean;
  readonly edgeDiscriminator?: (e: GraphEdge) => boolean;
}

/** The inputs a verb semantic may read. Absent members are absent — every semantic is fail-soft on them. */
export interface ObjectVerbContext {
  readonly state: GameState;
  readonly graph: WorldGraph;
  readonly actorId: string;
  /**
   * The object acted on. For `found` the object does not exist yet, so the handle
   * names the **site** — the parent room's location, the route's far end, the site
   * the settlement is founded from.
   */
  readonly handle: UndertakingObjectHandle;
  readonly tick: number;
  readonly projectId?: string;
  readonly runtime?: SimulationRuntime;
  /** The durable origin of the work (THR-669) — a route's near end. */
  readonly originLocationId?: string;
  /** The place of the work — a found verb's site or parent. */
  readonly targetNodeId?: string;
  /** Cast bound during the work (recruits for a company). */
  readonly boundCastIds?: readonly string[];
  /** Authored cell-override parameters (slice 2). Read by name, defaulted by constant. */
  readonly params?: Readonly<Record<string, unknown>>;
}

export type ObjectVerbSemantic = (ctx: ObjectVerbContext) => GraphOpResult;

/** A verb the type handles through a **sustained execution mode** rather than a completion semantic. */
export interface ObjectVerbMode {
  readonly mode: 'claim_control';
}

export type ObjectVerbEntry = ObjectVerbSemantic | ObjectVerbMode;

export interface UndertakingObjectType {
  readonly id: UndertakingObjectTypeId;
  readonly displayName: string;
  readonly shape: UndertakingObjectShape;
  /**
   * Which edges say who holds an object of this type. Node objects name edge types
   * (`owns`, `controls`, `possesses`, `leads` run holder → object; `commanded_by`
   * runs object → holder). Edge objects are held by the edge's own source.
   */
  readonly ownedVia: readonly EdgeType[];
  /** Tier read off the object; `null` when the source is missing (the caller defaults and traces). */
  readonly tierOf: (graph: WorldGraph, handle: UndertakingObjectHandle) => UndertakingObjectTier | null;
  /** What each verb variant does to THIS type. A verb not declared here is not a cell. */
  readonly verbs: Partial<Record<UndertakingVerbVariant, ObjectVerbEntry>>;
  readonly lexicon: WorkLexiconId;
  readonly harmOnUndo: UndertakingHarmClass;
}

// ─── Helpers shared by the types ────────────────────────────────────

const HOLDER_TO_OBJECT: readonly EdgeType[] = ['owns', 'controls', 'possesses', 'leads'];

function bandTier(value: number, bands: readonly [number, number]): UndertakingObjectTier {
  return value <= bands[0] ? 1 : value <= bands[1] ? 2 : 3;
}

function nodeOf(graph: WorldGraph, handle: UndertakingObjectHandle): GraphNode | undefined {
  return handle.kind === 'node' ? graph.getNode(handle.nodeId) : undefined;
}

function edgeOf(graph: WorldGraph, handle: UndertakingObjectHandle): GraphEdge | undefined {
  return handle.kind === 'edge' ? graph.getEdge(handle.edgeId) : undefined;
}

function nodeIdOf(handle: UndertakingObjectHandle): string | null {
  return handle.kind === 'node' ? handle.nodeId : null;
}

function holdingCtx(ctx: ObjectVerbContext) {
  return { tick: ctx.tick, projectId: ctx.projectId };
}

const fail = (op: string, error: string): GraphOpResult => ({ success: false, op, error });

/**
 * The site a `found` verb lands on. A site chosen at proposal can be gone by
 * completion — a siege razes the hamlet the room was to be built in (measured: seed 42
 * medium, tick 23, the first live proof of `found × room`) — and a work whose site
 * the world took is not a work that failed: it lands where the builder now stands.
 * Order: the place of the work, the handle, the durable origin, the actor's current
 * place-tier location. Returns null only when none of them exists.
 */
function foundSite(ctx: ObjectVerbContext): string | null {
  const candidates = [
    ctx.targetNodeId,
    nodeIdOf(ctx.handle),
    ctx.originLocationId,
    resolveDurableActorLocation(ctx.graph, ctx.actorId),
  ];
  for (const id of candidates) {
    if (!id) continue;
    const node = ctx.graph.getNode(id);
    if (!node || node.type !== 'location') continue;
    // A room's parent must be a place; a site that is itself a room resolves up.
    const place = isSublocationNode(node) ? resolveToParentLocation(ctx.graph, node) : node;
    if (place && ctx.graph.getNode(place.id)) return place.id;
  }
  return null;
}

/** A number property read fail-soft. */
function num(props: Record<string, unknown>, key: string): number | null {
  const v = props[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

/** Roster of a group-family node: everyone with a `member_of` edge into it. */
function rosterSize(graph: WorldGraph, groupId: string): number {
  return graph.getIncomingEdges(groupId, 'member_of').length;
}

// ─── The seven object types ─────────────────────────────────────────

/** Settlement subtypes by tier. Anything else on a place-tier location is not a settlement. */
const SETTLEMENT_TIER: Readonly<Record<string, UndertakingObjectTier>> = {
  hamlet: 1, camp: 1, farmland: 1,
  town: 2, fort: 2, castle: 2, tower: 2, shrine: 2, temple: 2, mining: 2,
  city: 3, capital: 3,
};

/** Room tier by the sublocation category table — the one table that already classifies every type id. */
const ROOM_CATEGORY_TIER: Readonly<Record<string, UndertakingObjectTier>> = {
  commerce: 1, nature: 1, cultural: 1, borderlands: 1,
  military: 2, religious: 2, scholarly: 2, arcane: 2, underworld: 2,
  authority: 3,
};

const SUBLOCATION_TYPE_ID_PREFIX = 'sublocation-type.';

function roomTier(graph: WorldGraph, handle: UndertakingObjectHandle): UndertakingObjectTier | null {
  const node = nodeOf(graph, handle);
  const typeId = node?.properties.sublocationTypeId;
  if (typeof typeId !== 'string') return null;
  const bare = typeId.startsWith(SUBLOCATION_TYPE_ID_PREFIX) ? typeId.slice(SUBLOCATION_TYPE_ID_PREFIX.length) : typeId;
  const category = SUBLOCATION_TYPE_CATEGORY[bare];
  return category ? ROOM_CATEGORY_TIER[category] ?? null : null;
}

/** Holding faces are mirrors of an `owns` edge, not objects of their own (THR-1297). */
const HOLDING_FACE_CATEGORY = 'holding';

function isAttachmentObject(n: GraphNode): boolean {
  return n.type === 'artifact' && n.properties.attachmentCategory !== HOLDING_FACE_CATEGORY;
}

function attachmentTier(graph: WorldGraph, handle: UndertakingObjectHandle): UndertakingObjectTier | null {
  const node = nodeOf(graph, handle);
  if (!node) return null;
  // `AttachmentTier` is numeric 1–4 (Mundane…Legendary); the undertaking ladder has three rungs.
  const stamped = num(node.properties, 'tier');
  if (stamped === null) return null;
  return Math.min(3, Math.max(1, Math.round(stamped))) as UndertakingObjectTier;
}

function isSettlementObject(n: GraphNode): boolean {
  if (!isPlaceTierLocation(n)) return false;
  const subtype = (n.properties.locationSubtype ?? n.properties.locationType) as string | undefined;
  return subtype !== undefined && SETTLEMENT_TIER[subtype] !== undefined;
}

function settlementTier(graph: WorldGraph, handle: UndertakingObjectHandle): UndertakingObjectTier | null {
  const node = nodeOf(graph, handle);
  const subtype = (node?.properties.locationSubtype ?? node?.properties.locationType) as string | undefined;
  return subtype ? SETTLEMENT_TIER[subtype] ?? null : null;
}

function isRouteObject(n: GraphNode): boolean {
  return n.type === 'location' && n.properties.locationSubtype === ROUTE_IDENTITY_SUBTYPE;
}

function routeTier(graph: WorldGraph, handle: UndertakingObjectHandle): UndertakingObjectTier | null {
  const node = nodeOf(graph, handle);
  const from = graph.getNode(node?.properties.routeSourceId as string);
  const to = graph.getNode(node?.properties.routeTargetId as string);
  if (!from || !to) return null;
  const a = { col: num(from.properties, 'hexCol'), row: num(from.properties, 'hexRow') };
  const b = { col: num(to.properties, 'hexCol'), row: num(to.properties, 'hexRow') };
  if (a.col === null || a.row === null || b.col === null || b.row === null) return null;
  return bandTier(hexDistance({ col: a.col, row: a.row }, { col: b.col, row: b.row }), UNDERTAKING_ROUTE_TIER_HEX_BANDS);
}

function isCompanyObject(n: GraphNode): boolean {
  const kind = getGroupKind(n);
  return (kind === 'company' || kind === 'network') && n.properties.groupStatus !== 'disbanded';
}

function isFactionObject(n: GraphNode): boolean {
  return n.type === 'actor' && n.properties.actorType === 'faction' && n.properties.actorStatus !== 'dissolved';
}

function isMarkEdge(e: GraphEdge): boolean {
  return e.type === 'knows_secret_of' && e.properties.revealed !== true;
}

// ── attachment ──

const ATTACHMENT: UndertakingObjectType = {
  id: 'attachment',
  displayName: 'Attachment',
  shape: { nodeType: 'artifact', discriminator: isAttachmentObject },
  ownedVia: ['possesses'],
  tierOf: attachmentTier,
  lexicon: 'item',
  harmOnUndo: 'property_destroyed',
  verbs: {
    // The masterwork op is the one attachment-minting undertaking the corpus has.
    found: (ctx) => mintMasterwork(
      ctx.graph, ctx.actorId,
      typeof ctx.params?.craftTag === 'string' ? ctx.params.craftTag : 'craft',
      ctx.tick,
      typeof ctx.params?.tier === 'number' ? ctx.params.tier : undefined,
    ),
    // Seizing an attachment moves the `possesses` edge: the world has the edge and
    // the funnel (`treasureMapConsumption` removes exactly this pair), no template
    // ever offered the transfer.
    'control:seize': (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      const item = nodeId ? ctx.graph.getNode(nodeId) : undefined;
      if (!nodeId || !item) return fail('seize_attachment', 'attachment_not_found');
      if (!ctx.graph.getNode(ctx.actorId)) return fail('seize_attachment', 'actor_not_found');
      for (const edge of ctx.graph.getIncomingEdges(nodeId, 'possesses')) ctx.graph.removeEdge(edge.id);
      ctx.graph.addEdge({
        id: `possesses_${nodeId}_${ctx.actorId}_${ctx.tick}`,
        source: ctx.actorId,
        target: nodeId,
        type: 'possesses',
        properties: { active: true, acquiredTick: ctx.tick, via: 'seized' },
      });
      return { success: true, op: 'seize_attachment', createdId: nodeId };
    },
    // Undoing an attachment is the removal funnel: the bearer edges, then the node.
    undo: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      if (!nodeId || !ctx.graph.getNode(nodeId)) return fail('destroy_attachment', 'attachment_not_found');
      for (const edge of ctx.graph.getIncomingEdges(nodeId, 'possesses')) ctx.graph.removeEdge(edge.id);
      ctx.graph.removeNode(nodeId);
      return { success: true, op: 'destroy_attachment' };
    },
  },
};

// ── room ──

const ROOM: UndertakingObjectType = {
  id: 'room',
  displayName: 'Room',
  shape: { nodeType: 'location', discriminator: isSublocationNode },
  ownedVia: ['owns'],
  tierOf: roomTier,
  lexicon: 'place',
  harmOnUndo: 'property_destroyed',
  verbs: {
    found: (ctx) => {
      const parentId = foundSite(ctx);
      if (!parentId) return fail('create_sublocation', 'no_parent');
      const typeId = typeof ctx.params?.sublocationTypeId === 'string'
        ? ctx.params.sublocationTypeId : UNDERTAKING_DEFAULT_ROOM_TYPE_ID;
      const name = typeof ctx.params?.name === 'string'
        ? ctx.params.name : `${ctx.graph.getNode(ctx.actorId)?.name ?? 'A'}'s ${typeId.split('.').pop()?.replace(/-/g, ' ') ?? 'room'}`;
      return createSublocation(ctx.graph, parentId, ctx.actorId, name, typeId, ctx.tick);
    },
    'control:claim': (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? grantHolding(ctx.graph, ctx.actorId, nodeId, holdingCtx(ctx)) : fail('grant_holding', 'no_node');
    },
    'control:seize': (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? transferHolding(ctx.graph, nodeId, ctx.actorId, holdingCtx(ctx)) : fail('transfer_holding', 'no_node');
    },
    undo: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? razeHolding(ctx.graph, nodeId, holdingCtx(ctx)) : fail('raze_holding', 'no_node');
    },
  },
};

// ── settlement ──

const SETTLEMENT: UndertakingObjectType = {
  id: 'settlement',
  displayName: 'Settlement',
  shape: { nodeType: 'location', discriminator: isSettlementObject },
  ownedVia: ['controls', 'owns'],
  tierOf: settlementTier,
  lexicon: 'place',
  harmOnUndo: 'property_destroyed',
  verbs: {
    found: (ctx) => {
      const siteId = foundSite(ctx);
      const site = siteId ? ctx.graph.getNode(siteId) : undefined;
      const col = site ? num(site.properties, 'hexCol') : null;
      const row = site ? num(site.properties, 'hexRow') : null;
      if (col === null || row === null) return fail('create_location', 'no_site_hex');
      const subtype = typeof ctx.params?.locationSubtype === 'string'
        ? ctx.params.locationSubtype : UNDERTAKING_DEFAULT_SETTLEMENT_SUBTYPE;
      const name = typeof ctx.params?.name === 'string'
        ? ctx.params.name : `${ctx.graph.getNode(ctx.actorId)?.name ?? 'New'} ${subtype}`;
      return createLocation(ctx.graph, { col, row }, ctx.actorId, name, subtype, ctx.tick, {
        prosperity: FOUNDED_SETTLEMENT_INITIAL_PROSPERITY,
      });
    },
    improve: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId
        ? modifyLocationProperty(ctx.graph, nodeId, 'prosperity', UNDERTAKING_IMPROVE_PROSPERITY_DELTA, [0, 1])
        : fail('modify_location_property', 'no_node');
    },
    // Establishing control of a settlement is the sustained `claim_control` mode —
    // upkeep, degradation, collapse — never a completion semantic.
    'control:claim': { mode: 'claim_control' },
    'control:seize': (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? transferHolding(ctx.graph, nodeId, ctx.actorId, holdingCtx(ctx)) : fail('transfer_holding', 'no_node');
    },
    // Ruin: the prosperity floor plus the `ruins` subtype the battle aftermath already
    // reads — not a deletion, and not a new flag.
    undo: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      const loc = nodeId ? ctx.graph.getNode(nodeId) : undefined;
      if (!nodeId || !loc) return fail('ruin_settlement', 'location_not_found');
      razeHolding(ctx.graph, nodeId, holdingCtx(ctx));
      const prosperity = num(loc.properties, 'prosperity') ?? RUINED_SETTLEMENT_PROSPERITY_FLOOR;
      loc.properties.prosperity = Math.min(prosperity, RUINED_SETTLEMENT_PROSPERITY_FLOOR);
      loc.properties.ruinedFromSubtype = loc.properties.locationSubtype;
      loc.properties.locationSubtype = 'ruins';
      loc.properties.ruinedTick = ctx.tick;
      return { success: true, op: 'ruin_settlement' };
    },
  },
};

// ── route ──

const ROUTE: UndertakingObjectType = {
  id: 'route',
  displayName: 'Trade route',
  shape: { nodeType: 'location', discriminator: isRouteObject },
  ownedVia: ['owns'],
  tierOf: routeTier,
  lexicon: 'route',
  harmOnUndo: 'network_severed',
  verbs: {
    found: (ctx) => {
      // A route needs both ends standing: the far end is the site chosen at proposal
      // and cannot be substituted (a route to a razed town is no route); the near end
      // is the durable origin, else where the actor now stands.
      const far = ctx.targetNodeId ?? nodeIdOf(ctx.handle);
      if (!far || !ctx.graph.getNode(far)) return fail('create_trade_route', 'far_end_gone');
      const near = [ctx.originLocationId, resolveDurableActorLocation(ctx.graph, ctx.actorId)]
        .find(id => id && id !== far && ctx.graph.getNode(id));
      if (!near) return fail('create_trade_route', 'no_endpoints');
      return createTradeRoute(ctx.graph, near, far, ctx.actorId, ctx.tick);
    },
    'control:claim': (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? grantHolding(ctx.graph, ctx.actorId, nodeId, holdingCtx(ctx)) : fail('grant_holding', 'no_node');
    },
    'control:seize': (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? transferHolding(ctx.graph, nodeId, ctx.actorId, holdingCtx(ctx)) : fail('transfer_holding', 'no_node');
    },
    // Undoing a route suspends it (blockade), it does not delete it.
    undo: (ctx) => {
      const node = nodeOf(ctx.graph, ctx.handle);
      const endpoint = node?.properties.routeSourceId;
      if (typeof endpoint !== 'string') return fail('blockade_route', 'no_endpoint');
      return blockadeRoute(ctx.graph, ctx.actorId, endpoint, ctx.tick);
    },
  },
};

// ── company ──

const COMPANY: UndertakingObjectType = {
  id: 'company',
  displayName: 'Company',
  shape: { nodeType: 'actor', discriminator: isCompanyObject },
  ownedVia: ['commanded_by'],
  tierOf: (graph, handle) => {
    const nodeId = nodeIdOf(handle);
    return nodeId && graph.getNode(nodeId) ? bandTier(rosterSize(graph, nodeId), UNDERTAKING_COMPANY_TIER_ROSTER_BANDS) : null;
  },
  lexicon: 'band',
  harmOnUndo: 'holding_seized',
  verbs: {
    found: (ctx) => raiseWarband(ctx.state, ctx.actorId, ctx.boundCastIds ?? []),
    improve: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? reinforceWarband(ctx.state, ctx.actorId, nodeId, ctx.boundCastIds ?? []) : fail('reinforce_group', 'no_node');
    },
    undo: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? disbandGroup(ctx.state, nodeId) : fail('disband_group', 'no_node');
    },
  },
};

// ── faction ──

const FACTION: UndertakingObjectType = {
  id: 'faction',
  displayName: 'Faction',
  shape: { nodeType: 'actor', discriminator: isFactionObject },
  ownedVia: ['commanded_by', 'leads'],
  tierOf: (graph, handle) => {
    const nodeId = nodeIdOf(handle);
    return nodeId && graph.getNode(nodeId) ? bandTier(rosterSize(graph, nodeId), UNDERTAKING_FACTION_TIER_MEMBER_BANDS) : null;
  },
  lexicon: 'network',
  harmOnUndo: 'network_severed',
  verbs: {
    // Undoing a faction is the schism the world already resolves in its own phase.
    undo: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      if (!nodeId) return fail('plant_schism', 'no_node');
      const delay = typeof ctx.params?.resolutionDelay === 'number'
        ? ctx.params.resolutionDelay : UNDERTAKING_SCHISM_RESOLUTION_DELAY_TICKS;
      const planted = applyPlantSchism(ctx.state, ctx.runtime, nodeId, ctx.actorId, delay, ctx.tick);
      return planted ? { success: true, op: 'plant_schism', createdId: nodeId } : fail('plant_schism', 'faction_not_found');
    },
  },
};

// ── mark ──

const MARK: UndertakingObjectType = {
  id: 'mark',
  displayName: 'Leverage mark',
  shape: { edgeType: 'knows_secret_of', edgeDiscriminator: isMarkEdge },
  ownedVia: [],
  tierOf: (graph, handle) => {
    const edge = edgeOf(graph, handle);
    const magnitude = edge ? num(edge.properties, 'magnitude') : null;
    return magnitude === null ? null : bandTier(magnitude, UNDERTAKING_MARK_TIER_MAGNITUDE_BANDS);
  },
  lexicon: 'mark',
  harmOnUndo: 'network_severed',
  verbs: {
    // Pressing a mark is the self-spend the kind row already called a use, not a counter.
    use: (ctx) => {
      const edge = edgeOf(ctx.graph, ctx.handle);
      if (!edge) return fail('press_the_mark', 'mark_not_found');
      const magnitude = num(edge.properties, 'magnitude') ?? 0;
      const context = typeof ctx.params?.context === 'string' ? ctx.params.context : 'pressed';
      return pressTheMark(ctx.graph, edge.source, edge.target, magnitude, context, ctx.tick);
    },
    // Exposing a mark reveals it: the edge stays (the world remembers who knew) and
    // loses its leverage, which is what `revealed` already means to Secrets & Favors.
    undo: (ctx) => {
      const edge = edgeOf(ctx.graph, ctx.handle);
      if (!edge) return fail('expose_mark', 'mark_not_found');
      ctx.graph.updateEdge(edge.id, {
        properties: { ...edge.properties, revealed: true, revealedTick: ctx.tick, revealedTo: ctx.actorId },
      });
      return { success: true, op: 'expose_mark' };
    },
  },
};

// ─── Registry ───────────────────────────────────────────────────────

export const UNDERTAKING_OBJECT_TYPES: readonly UndertakingObjectType[] = [
  ATTACHMENT, ROOM, SETTLEMENT, ROUTE, COMPANY, FACTION, MARK,
];

/** The grievance lane's read: what class of harm undoing an object of each type is. */
export const HARM_ON_UNDO: Readonly<Record<UndertakingObjectTypeId, UndertakingHarmClass>> = Object.fromEntries(
  UNDERTAKING_OBJECT_TYPES.map(t => [t.id, t.harmOnUndo]),
) as Record<UndertakingObjectTypeId, UndertakingHarmClass>;

export function getUndertakingObjectType(id: UndertakingObjectTypeId): UndertakingObjectType | undefined {
  return UNDERTAKING_OBJECT_TYPES.find(t => t.id === id);
}

/** Every handle of the type in the world, sorted by id (NFP #3). */
export function enumerateObjectHandles(graph: WorldGraph, type: UndertakingObjectType): UndertakingObjectHandle[] {
  const out: UndertakingObjectHandle[] = [];
  try {
    if (type.shape.nodeType) {
      for (const n of graph.getNodesByType(type.shape.nodeType)) {
        if (!type.shape.discriminator || type.shape.discriminator(n)) out.push({ kind: 'node', nodeId: n.id });
      }
    }
    if (type.shape.edgeType) {
      for (const e of graph.getEdgesByType(type.shape.edgeType)) {
        if (!type.shape.edgeDiscriminator || type.shape.edgeDiscriminator(e)) out.push({ kind: 'edge', edgeId: e.id });
      }
    }
  } catch {
    // Fail-soft: an unreadable graph has no objects to offer.
  }
  return out.sort((a, b) => objectIdOf(a).localeCompare(objectIdOf(b)));
}

/** Whether a handle currently resolves to an object of the type. */
export function isObjectOfType(graph: WorldGraph, type: UndertakingObjectType, handle: UndertakingObjectHandle): boolean {
  if (handle.kind === 'node') {
    const n = graph.getNode(handle.nodeId);
    return !!n && !!type.shape.nodeType && n.type === type.shape.nodeType
      && (!type.shape.discriminator || type.shape.discriminator(n));
  }
  const e = graph.getEdge(handle.edgeId);
  return !!e && !!type.shape.edgeType && e.type === type.shape.edgeType
    && (!type.shape.edgeDiscriminator || type.shape.edgeDiscriminator(e));
}

/** The id the trace names — the node's, or the edge's. */
export function objectIdOf(handle: UndertakingObjectHandle): string {
  return handle.kind === 'node' ? handle.nodeId : handle.edgeId;
}

/**
 * The node an object stands at, for distance and moments: the node itself, or an
 * edge object's target (a mark is held *about* someone, and that is where it is).
 */
export function objectPlaceNodeId(graph: WorldGraph, handle: UndertakingObjectHandle): string | null {
  if (handle.kind === 'node') return handle.nodeId;
  return graph.getEdge(handle.edgeId)?.target ?? null;
}

/**
 * Who holds an object of this type today — through the type's own `ownedVia` edges
 * for node objects, and the edge's source for edge objects. Deduplicated, in edge
 * order.
 */
export function resolveObjectOwners(
  graph: WorldGraph,
  type: UndertakingObjectType,
  handle: UndertakingObjectHandle,
): readonly string[] {
  const owners = new Set<string>();
  try {
    if (handle.kind === 'edge') {
      const edge = graph.getEdge(handle.edgeId);
      if (edge) owners.add(edge.source);
      return [...owners];
    }
    for (const via of type.ownedVia) {
      if (HOLDER_TO_OBJECT.includes(via)) {
        for (const e of graph.getIncomingEdges(handle.nodeId, via)) if (e.source !== handle.nodeId) owners.add(e.source);
      } else {
        for (const e of graph.getOutgoingEdges(handle.nodeId, via)) if (e.target !== handle.nodeId) owners.add(e.target);
      }
    }
  } catch {
    // Fail-soft: unreadable ownership answers "unowned".
  }
  return [...owners];
}

/** The object's tier, or the default with `defaulted: true` when its source is missing or throws. */
export function tierOfObject(
  graph: WorldGraph,
  type: UndertakingObjectType,
  handle: UndertakingObjectHandle,
): { tier: UndertakingObjectTier; defaulted: boolean } {
  try {
    const tier = type.tierOf(graph, handle);
    if (tier === 1 || tier === 2 || tier === 3) return { tier, defaulted: false };
  } catch {
    // fall through to the default
  }
  return { tier: UNDERTAKING_DEFAULT_TIER, defaulted: true };
}
