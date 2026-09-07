/**
 * Undertaking object types — the verb × object-type registry (THR-1392; redrawn on the
 * world-object catalogue in slice 4).
 *
 * An undertaking is a **verb** acted on an **object the world already has**. The
 * verbs are create · change (raise | lower) · use · control (claim | seize) · destroy ·
 * observe (Christian, 2026-09-03). The object types are the world-object catalogue's
 * kinds (`src/data/world-objects.ts`, THR-1394) — never a code word: a Place, not a
 * room; a Location, not a settlement; an Item, not an attachment; an Agreement, not
 * a mark. Each type registers once: what shape its objects take in the graph, which
 * edges say who holds one, how its tier is read off the object, and what each verb
 * *does* to one — the graph ops that already exist, re-homed under the object they act
 * on instead of under the template that happened to mention them.
 *
 * **The grammar does not write the consequences.** Every semantic below is an
 * authored decision made once (what lowering a route means — a blockade, not a
 * deletion; what seizing an item does — the `possesses` edge moves). A verb an object
 * type does not declare is not enumerated as a cell, and the resolver traces
 * `undertaking_cell_unreachable` (reason `no_semantic_declared`) so the gap is a
 * measurement rather than a silent hole. The cells declared here are the ones whose
 * op the world already has; the open cells are listed on the grid
 * (Docs/canon/undertakings.md § The verb × object model), never faked.
 *
 * Behind `UNDERTAKING_MODEL` (`strategic-action-constants.ts`): with the flag on
 * `templates` nothing here is reached from the tick loop. See
 * `Docs/plans/2026-09-03-thr-1392-verb-object-undertakings.md` § Engine pillar.
 */
import type { GameState } from '../types/gameState';
import type { WorldGraph } from '../engine/graph';
import type { GraphEdge, GraphNode, NodeType, EdgeType } from '../types/graph';
import type { GraphOp } from '../types/graphOp';
import type {
  MotiveKind,
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
  mintLeverageMark,
  recordIntelligence,
  createRelationEdge,
  foundFaction,
  seedKnowsOf,
  spawnClue,
  mintTreasureMap,
} from '../engine/strategicGraphOps';
import { emitTrace } from '../engine/traceBuffer';
import type {
  UndertakingReaderTrace,
  PowerLearnedTrace,
  ConditionInflictedTrace,
  TraceEntry,
} from '../types/trace';
import type { QuintessenceEvent } from '../types/quintessence';
import { grantHolding, transferHolding, razeHolding } from '../engine/holdings';
import { applyPlantSchism } from '../engine/schismPlant';
import { isPlaceNode, isLocationNode, resolveToParentLocation } from '../engine/sublocationShape';
import { resolveDurableActorLocation, executeConductTrade, executeTaxTradeRoute } from '../engine/tradeRouteOps';
import { getGroupKind } from '../engine/groupShape';
import { getGroupOf } from '../engine/groups/groupQueries';
import { raiseWarhostForce } from '../engine/armySpawning';
import { mintCompanion, removeCompanion } from '../engine/companions';
import { applyReputationWithDelta } from '../engine/reputation';
import { removeTrait } from '../engine/traits';
import { activateSpell } from '../engine/spellActivation';
import { holdsMotive } from '../engine/undertakingMotive';
import { instantiateReward } from '../engine/rewardPool';
import { isSpellSuppressedFor } from '../engine/effects/effectSuppression';
import { getSpellTemplate } from './spell-templates';
import { SLOT_CAPS } from './attachment-slot-constants';
import { COMPANION_TEMPLATES } from './companion-templates';
import { mulberry32 } from '../lib/prng';
import { hexDistance } from '../lib/hexMath';
import { SUBLOCATION_TYPE_CATEGORY } from './sublocation-category-art';
import { LOCATION_CLASSES, locationClassOf, barePlaceTypeId, POWER_SUBCATEGORIES } from './world-objects';
import {
  ROUTE_IDENTITY_SUBTYPE,
  FOUNDED_SETTLEMENT_INITIAL_PROSPERITY,
  UNDERTAKING_SCHISM_RESOLUTION_DELAY_TICKS,
  UNDERTAKING_DEFAULT_PLACE_TYPE_ID,
  UNDERTAKING_DEFAULT_LOCATION_SUBTYPE,
  UNDERTAKING_CHANGE_PROSPERITY_DELTA,
  RUINED_SETTLEMENT_PROSPERITY_FLOOR,
  UNDERTAKING_ROUTE_TIER_HEX_BANDS,
  UNDERTAKING_COMPANY_TIER_ROSTER_BANDS,
  UNDERTAKING_ARMY_TIER_ROSTER_BANDS,
  UNDERTAKING_FACTION_TIER_MEMBER_BANDS,
  UNDERTAKING_MARK_TIER_MAGNITUDE_BANDS,
  UNDERTAKING_STANDING_TIER_DISTANCE_BANDS,
  UNDERTAKING_STANDING_DELTA,
  UNDERTAKING_QUARREL_STANDING_DELTA,
  UNDERTAKING_DEFAULT_MARK_SECRET_TYPE,
  UNDERTAKING_DEFAULT_MARK_MAGNITUDE,
  UNDERTAKING_DEFAULT_WARHOST_STRENGTH,
  UNDERTAKING_OBSERVE_INTELLIGENCE_TYPE,
  UNDERTAKING_DEFAULT_FACTION_SEED,
  UNDERTAKING_DEFAULT_TIER,
  OBSERVE_CLUE_PRECISION_BY_BAND,
  OBSERVE_CLUE_MAGNITUDE,
  OBSERVE_AREA_FAMILIARITY_CAP,
  OBSERVE_MARK_BAND,
  OBSERVE_CHART_BAND,
  OBSERVE_MARK_SECRET_TYPE,
  OBSERVE_MARK_MAGNITUDE,
  RUINED_SETTLEMENT_MAGNITUDE_BY_SUBTYPE,
  RUINED_SETTLEMENT_DEFAULT_MAGNITUDE,
  SPELL_SOUL_PRICE_QUINTESSENCE_SCALE,
  // The dormant kinds I (THR-1429)
  MOTIVE_GATE_KINDS,
  LEARN_SPELL_CASTER_VEIL_FLOOR,
  CASTER_NPC_ROLES,
  CASTER_MASTERY_TRAIT_IDS,
  LEARN_SPELL_UNALIGNED_SHELF_OPEN,
  CONDITION_ALLY_STANDING_MIN,
  CONDITION_TIER_CAP_BY_BAND,
  CONDITION_TIER_CAP_DEFAULT,
  CURSE_DURATION_TICKS_BY_BAND,
  CURSE_DURATION_TICKS_DEFAULT,
  CONDITION_BLESSING_TAG,
  CONDITION_CURSE_TAG,
  SEAL_POWER_CONDITION_ID,
  HARM_ON_AFFLICT,
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
   * The object acted on. For `create` the object does not exist yet, so the handle
   * names the **site** — the Location a Place is built in, the route's far end, the
   * Location a new one is founded from, the mortal a mark is dug up about.
   */
  readonly handle: UndertakingObjectHandle;
  readonly tick: number;
  readonly projectId?: string;
  readonly runtime?: SimulationRuntime;
  /** The durable origin of the work (THR-669) — a route's near end. */
  readonly originLocationId?: string;
  /** The place of the work — a create verb's site or parent. */
  readonly targetNodeId?: string;
  /** Cast bound during the work (recruits for a company). */
  readonly boundCastIds?: readonly string[];
  /** Authored cell-override parameters (slice 2). Read by name, defaulted by constant. */
  readonly params?: Readonly<Record<string, unknown>>;
  /**
   * The band the work's final checkpoint landed on (THR-1428). Optional because the
   * instant-execution path has no checkpoint to read: an absent band takes the
   * plain-success row everywhere, never a second resolution.
   */
  readonly outcome?: string;
}

export type ObjectVerbSemantic = (ctx: ObjectVerbContext) => GraphOpResult;

/** A verb the type handles through a **sustained execution mode** rather than a completion semantic. */
export interface ObjectVerbMode {
  readonly mode: 'claim_control';
}

export type ObjectVerbEntry = ObjectVerbSemantic | ObjectVerbMode;

export interface UndertakingObjectType {
  readonly id: UndertakingObjectTypeId;
  /** The game word (UI Law 14) — the catalogue's `gameWord`. */
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
  readonly harmOnDestroy: UndertakingHarmClass;
}

// ─── Helpers shared by the types ────────────────────────────────────

// `has_trait` joins the holder → object list for THR-1429: a mortal bears a power the
// same direction they possess an item, so `resolveObjectOwners` must walk it inward.
// It only ever fires for a type that names it in `ownedVia` — today, Power alone.
const HOLDER_TO_OBJECT: readonly EdgeType[] = ['owns', 'controls', 'possesses', 'leads', 'has_trait'];

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

// ─── The owed readers (THR-1428) ────────────────────────────────────
//
// Every reader below turns a write that nothing read into a product some phase or
// surface consumes. The decision for each is THR-1397's; the band order is THR-1399's.
// A refusal is traced as loudly as a write: a survey of somewhere already known
// produced *nothing new*, which is a different fact from a reader that never ran.

/** One `undertaking_reader` entry. Fail-soft: tracing never throws into a semantic. */
function emitReaderTrace(
  ctx: ObjectVerbContext,
  entry: {
    cellId: string;
    reader: UndertakingReaderTrace['reader'];
    objectId: string;
    productId?: string;
    refused?: UndertakingReaderTrace['refused'];
    summary: string;
  },
): void {
  emitTrace({
    category: 'undertaking_reader',
    tick: ctx.tick,
    actorId: ctx.actorId,
    cellId: entry.cellId,
    reader: entry.reader,
    objectId: entry.objectId,
    ...(entry.productId ? { productId: entry.productId } : {}),
    ...(ctx.outcome ? { outcome: ctx.outcome } : {}),
    ...(entry.refused ? { refused: entry.refused } : {}),
    summary: entry.summary,
  } as UndertakingReaderTrace);
}

/**
 * A graph op's refusal mapped onto the trace's vocabulary. An op that refused because
 * the product already exists is *success with nothing new* — the semantic keeps going.
 */
function refusalOf(result: GraphOpResult): UndertakingReaderTrace['refused'] | undefined {
  if (result.success) return undefined;
  const e = result.error ?? '';
  if (e.includes('already_known')) return 'already_known';
  if (e.includes('clue_already_held')) return 'clue_already_held';
  if (e.includes('map_already_held')) return 'map_already_held';
  if (e.includes('mark_already_held')) return 'already_known';
  return 'schema_violation';
}

/** Familiarity with one Location, traced either way. Returns whether an edge was written. */
function writeFamiliarity(ctx: ObjectVerbContext, cellId: string, locationId: string): boolean {
  const result = seedKnowsOf(ctx.graph, ctx.actorId, locationId, ctx.tick);
  const name = ctx.graph.getNode(locationId)?.name ?? locationId;
  emitReaderTrace(ctx, {
    cellId,
    reader: 'familiarity',
    objectId: locationId,
    productId: result.createdId,
    refused: refusalOf(result),
    summary: result.success ? `knows the way to ${name}` : `${name} was already known`,
  });
  return result.success;
}

/** The Location classes worth a clue or a chart: what a survey can find something *in*. */
const SURVEYABLE_CLASSES: ReadonlySet<string> = new Set(['ruin', 'wonder']);

function isSurveyableSite(n: GraphNode | undefined): boolean {
  if (!n || !isLocationNode(n)) return false;
  const cls = locationClassOf(locationSubtypeOf(n));
  return cls !== undefined && SURVEYABLE_CLASSES.has(cls);
}

/**
 * The mortals standing at the observed node, other than the observer — who a survey
 * could have learned something about. Sorted by id so the draw below is the only
 * non-determinism.
 */
function coLocatedMortals(ctx: ObjectVerbContext, nodeId: string): string[] {
  return ctx.graph.getIncomingEdges(nodeId, 'located_at')
    .map(e => ctx.graph.getNode(e.source))
    .filter((n): n is GraphNode =>
      n !== undefined && n.type === 'actor' && n.properties.actorType !== 'faction' && n.id !== ctx.actorId)
    .map(n => n.id)
    .sort();
}

/**
 * A survey strong enough to learn a secret mints one about somebody who was there.
 * The recipient is drawn with the same seeding the `use × Power` semantic uses, so the
 * choice is reproducible from seed and tick alone (NFP #3).
 */
function maybeMintObservedMark(ctx: ObjectVerbContext, cellId: string, subjectPoolNodeId: string): void {
  if (ctx.outcome !== OBSERVE_MARK_BAND) return;
  const candidates = coLocatedMortals(ctx, subjectPoolNodeId);
  if (candidates.length === 0) {
    emitReaderTrace(ctx, {
      cellId, reader: 'mark', objectId: subjectPoolNodeId, refused: 'nobody_there',
      summary: 'nobody was there to learn anything about',
    });
    return;
  }
  const draw = mulberry32(ctx.tick * 104729 + ctx.actorId.length)();
  const subjectId = candidates[Math.floor(draw * candidates.length)] ?? candidates[0];
  const result = mintLeverageMark(
    ctx.graph, ctx.actorId, subjectId,
    OBSERVE_MARK_SECRET_TYPE, OBSERVE_MARK_MAGNITUDE, ctx.tick,
  );
  emitReaderTrace(ctx, {
    cellId, reader: 'mark', objectId: subjectId,
    productId: result.createdId, refused: refusalOf(result),
    summary: result.success
      ? `learned something about ${ctx.graph.getNode(subjectId)?.name ?? subjectId}`
      : 'that secret was already held',
  });
}

/**
 * A clue on a surveyable site, at the precision the band earned. Only a critical
 * success writes `located`, which is the precision the delve admission scan requires —
 * so observe → clue → delve is a climb, not a free door (THR-1399's band order).
 */
function maybeSpawnSiteClue(ctx: ObjectVerbContext, cellId: string, siteId: string): void {
  const site = ctx.graph.getNode(siteId);
  if (!isSurveyableSite(site)) return;
  const precision = ctx.outcome ? OBSERVE_CLUE_PRECISION_BY_BAND[ctx.outcome] : undefined;
  if (!precision) {
    emitReaderTrace(ctx, {
      cellId, reader: 'clue', objectId: siteId,
      refused: ctx.outcome ? 'no_band_row' : undefined,
      summary: `${site?.name ?? siteId} gave up no lead`,
    });
    return;
  }
  const result = spawnClue(ctx.graph, ctx.actorId, siteId, ctx.tick, OBSERVE_CLUE_MAGNITUDE, precision);
  emitReaderTrace(ctx, {
    cellId, reader: 'clue', objectId: siteId,
    productId: result.createdId, refused: refusalOf(result),
    summary: result.success
      ? `has a ${precision} lead on ${site?.name ?? siteId}`
      : `already held a lead on ${site?.name ?? siteId}`,
  });
}

/**
 * The site a `create` verb lands on. A site chosen at proposal can be gone by
 * completion — a siege razes the hamlet the Place was to be built in (measured: seed
 * 42 medium, tick 23, the first live proof of `create × place`) — and a work whose site
 * the world took is not a work that failed: it lands where the builder now stands.
 * Order: the place of the work, the handle, the durable origin, the actor's current
 * Location. Returns null only when none of them exists.
 */
function createSite(ctx: ObjectVerbContext): string | null {
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
    // A Place's parent must be a Location; a site that is itself a Place resolves up.
    const place = isPlaceNode(node) ? resolveToParentLocation(ctx.graph, node) : node;
    if (place && ctx.graph.getNode(place.id)) return place.id;
  }
  return null;
}

/** A number property read fail-soft. */
function num(props: Record<string, unknown>, key: string): number | null {
  const v = props[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function str(props: Record<string, unknown> | undefined, key: string): string | null {
  const v = props?.[key];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

/** Roster of a group-family node: everyone with a `member_of` edge into it. */
function rosterSize(graph: WorldGraph, groupId: string): number {
  return graph.getIncomingEdges(groupId, 'member_of').length;
}

/** The first faction the actor is a member of, if any. */
function actorFactionId(graph: WorldGraph, actorId: string): string | null {
  for (const e of graph.getOutgoingEdges(actorId, 'member_of')) {
    const n = graph.getNode(e.target);
    if (n?.type === 'actor' && n.properties.actorType === 'faction') return n.id;
  }
  return null;
}

/**
 * `observe × anything`: intelligence about the object, keyed on the actor.
 *
 * The `recordIntelligence` write is kept (additive), but it is no longer the whole
 * product: what watching *earns* is familiarity — the `knows_of` edge the ruins layer's
 * clue convergence already writes and the world already reads (THR-1428 R1). Each kind
 * supplies which Locations a survey of it made familiar; the shared tail writes them,
 * clues the surveyable ones, and — on a strong result only — mints the chart or the
 * mark. A kind that resolves no Location keeps the plain intelligence write.
 */
function observe(ctx: ObjectVerbContext): GraphOpResult {
  const nodeId = nodeIdOf(ctx.handle);
  if (!nodeId || !ctx.graph.getNode(nodeId)) return fail('record_intelligence', 'object_not_found');
  const base = recordIntelligence(ctx.graph, ctx.actorId, nodeId, UNDERTAKING_OBSERVE_INTELLIGENCE_TYPE, ctx.tick);
  try {
    applyObserveReaders(ctx, nodeId);
  } catch {
    // A reader that throws must never fail the work the mortal actually did (NFP #4).
  }
  return base;
}

/** The cell id an observe reader traces under, by what the handle turned out to be. */
function observeCellId(node: GraphNode | undefined): string {
  if (!node) return 'cell.observe.unknown';
  if (node.type === 'actor') return node.properties.actorType === 'faction' ? 'cell.observe.faction' : 'cell.observe.mortal';
  if (isPlaceNode(node)) return 'cell.observe.place';
  if (locationSubtypeOf(node) === ROUTE_IDENTITY_SUBTYPE) return 'cell.observe.route';
  if (isLocationNode(node)) return 'cell.observe.location';
  return 'cell.observe.area';
}

/**
 * Which Locations a survey of this object made familiar, per kind (THR-1397's table).
 * Never a faction node — `knows_of` is actor → location, and forcing one would be a
 * schema violation rather than a reader.
 */
function observedLocations(ctx: ObjectVerbContext, node: GraphNode): string[] {
  // Area: every Location in it the actor is not yet familiar with, up to the cap.
  // An Area is a `region` node (the world-object catalogue's Area kind), and it holds
  // its Locations on `contains` edges — a Hex is deliberately not a node at all.
  if (node.type === 'region') {
    return locationsInArea(ctx, node).slice(0, OBSERVE_AREA_FAMILIARITY_CAP);
  }
  // Faction: the seat — the Location it controls nearest the actor. Controls nothing → skip.
  if (node.type === 'actor' && node.properties.actorType === 'faction') {
    const seat = nearestControlledLocation(ctx, node.id);
    return seat ? [seat] : [];
  }
  if (node.type !== 'location') return [];
  const subtype = locationSubtypeOf(node);
  // Route: both endpoints of the identity node.
  if (subtype === ROUTE_IDENTITY_SUBTYPE) {
    return [str(node.properties, 'routeSourceId'), str(node.properties, 'routeTargetId')]
      .filter((id): id is string => id !== null && ctx.graph.getNode(id)?.type === 'location');
  }
  // Place: the Place and its parent Location.
  if (isPlaceNode(node)) {
    const parent = resolveToParentLocation(ctx.graph, node);
    return parent && parent.id !== node.id ? [node.id, parent.id] : [node.id];
  }
  return [node.id];
}

/**
 * The Locations an Area holds, sorted so the familiarity cap takes a stable slice.
 * `contains` is the edge worldgen writes; the place tier only, so a survey of a valley
 * makes its settlements familiar rather than every room inside them.
 */
function locationsInArea(ctx: ObjectVerbContext, area: GraphNode): string[] {
  return ctx.graph.getOutgoingEdges(area.id, 'contains')
    .map(e => ctx.graph.getNode(e.target))
    .filter((n): n is GraphNode => n !== undefined && isLocationNode(n))
    .map(n => n.id)
    .sort();
}

/** The Location a faction controls nearest the observer, by hex distance. */
function nearestControlledLocation(ctx: ObjectVerbContext, factionId: string): string | null {
  const from = resolveDurableActorLocation(ctx.graph, ctx.actorId);
  const fromNode = from ? ctx.graph.getNode(from) : undefined;
  const fc = fromNode ? num(fromNode.properties, 'hexCol') : null;
  const fr = fromNode ? num(fromNode.properties, 'hexRow') : null;
  const held = ctx.graph.getOutgoingEdges(factionId, 'controls')
    .map(e => ctx.graph.getNode(e.target))
    .filter((n): n is GraphNode => n !== undefined && isLocationNode(n))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (held.length === 0) return null;
  if (fc === null || fr === null) return held[0].id;
  let best = held[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const n of held) {
    const c = num(n.properties, 'hexCol');
    const r = num(n.properties, 'hexRow');
    const d = c === null || r === null
      ? Number.POSITIVE_INFINITY
      : hexDistance({ col: fc, row: fr }, { col: c, row: r });
    if (d < bestDist) { best = n; bestDist = d; }
  }
  return best.id;
}

/** Write the familiarity a survey earned, and on a strong result the chart or the mark. */
function applyObserveReaders(ctx: ObjectVerbContext, nodeId: string): void {
  const node = ctx.graph.getNode(nodeId);
  if (!node) return;
  const cellId = observeCellId(node);
  const locations = observedLocations(ctx, node);

  // What the actor knew *before* this survey. Captured first because the familiarity
  // writes below would otherwise make every site in the area "already known" by the
  // time the chart looks for one, and the chart would never be minted.
  const knownBefore = new Set(ctx.graph.getOutgoingEdges(ctx.actorId, 'knows_of').map(e => e.target));

  for (const locationId of locations) writeFamiliarity(ctx, cellId, locationId);

  // A clue on the observed site itself, when the site is one a delve could enter.
  if (node.type === 'location') maybeSpawnSiteClue(ctx, cellId, nodeId);

  // Area × strong result: a chart of one site the actor did not already know — a
  // possession somebody else can follow, not a note to self.
  if (cellId === 'cell.observe.area' && ctx.outcome === OBSERVE_CHART_BAND) {
    mintAreaChart(ctx, cellId, node, knownBefore);
  }

  // The secret a strong survey doubles into: about somebody at the observed node, or
  // about the faction's leader when the object was a faction.
  if (cellId === 'cell.observe.faction') {
    const leaderId = factionLeaderId(ctx, nodeId);
    if (leaderId) maybeMintObservedMarkAbout(ctx, cellId, leaderId);
  } else if (cellId !== 'cell.observe.area' && cellId !== 'cell.observe.route') {
    maybeMintObservedMark(ctx, cellId, nodeId);
  }
}

/** One chart, to the first unfamiliar surveyable Location in the area. Deterministic. */
function mintAreaChart(
  ctx: ObjectVerbContext,
  cellId: string,
  area: GraphNode,
  known: ReadonlySet<string>,
): void {
  const site = locationsInArea(ctx, area)
    .find(id => !known.has(id) && isSurveyableSite(ctx.graph.getNode(id)));
  if (!site) {
    emitReaderTrace(ctx, {
      cellId, reader: 'chart', objectId: area.id, refused: 'nothing_eligible',
      summary: 'nothing in the area was worth charting',
    });
    return;
  }
  const result = mintTreasureMap(ctx.graph, ctx.actorId, site, ctx.tick);
  emitReaderTrace(ctx, {
    cellId, reader: 'chart', objectId: site,
    productId: result.createdId, refused: refusalOf(result),
    summary: result.success
      ? `charted ${ctx.graph.getNode(site)?.name ?? site} for anyone who can read a map`
      : 'already held that chart',
  });
}

/** The faction's leader, if it has one — the subject a survey of a faction learns about. */
function factionLeaderId(ctx: ObjectVerbContext, factionId: string): string | null {
  for (const e of ctx.graph.getIncomingEdges(factionId, 'leads')) {
    const n = ctx.graph.getNode(e.source);
    if (n?.type === 'actor' && n.properties.actorType !== 'faction') return n.id;
  }
  return null;
}

/** The mark path when the subject is already known by id (the faction's leader). */
function maybeMintObservedMarkAbout(ctx: ObjectVerbContext, cellId: string, subjectId: string): void {
  if (ctx.outcome !== OBSERVE_MARK_BAND) return;
  const result = mintLeverageMark(
    ctx.graph, ctx.actorId, subjectId,
    OBSERVE_MARK_SECRET_TYPE, OBSERVE_MARK_MAGNITUDE, ctx.tick,
  );
  emitReaderTrace(ctx, {
    cellId, reader: 'mark', objectId: subjectId,
    productId: result.createdId, refused: refusalOf(result),
    summary: result.success
      ? `learned something about ${ctx.graph.getNode(subjectId)?.name ?? subjectId}`
      : 'that secret was already held',
  });
}

function groupTier(bands: readonly [number, number]) {
  return (graph: WorldGraph, handle: UndertakingObjectHandle): UndertakingObjectTier | null => {
    const nodeId = nodeIdOf(handle);
    return nodeId && graph.getNode(nodeId) ? bandTier(rosterSize(graph, nodeId), bands) : null;
  };
}

// ─── Tier readers and discriminators ────────────────────────────────

/** Location tier by subtype where a subtype says more than its class; the class table fills the rest. */
const LOCATION_SUBTYPE_TIER: Readonly<Record<string, UndertakingObjectTier>> = {
  hamlet: 1, camp: 1, farmland: 1,
  town: 2, fort: 2, castle: 2, tower: 2, shrine: 2, temple: 2, mining: 2,
  city: 3, capital: 3, place_of_power: 3,
};
const LOCATION_CLASS_TIER: Readonly<Record<string, UndertakingObjectTier>> = {
  settlement: 2, stronghold: 2, holy_place: 2, ruin: 1, wild: 1, wonder: 3, deposit: 2,
};

/** The Location classes `destroy` ruins: built things. A wonder or a deposit is not unbuilt (open cell). */
const RUINABLE_CLASSES: ReadonlySet<string> = new Set(['settlement', 'stronghold']);

function locationSubtypeOf(n: GraphNode | undefined): string | undefined {
  return (n?.properties.locationSubtype ?? n?.properties.locationType) as string | undefined;
}

function isLocationObject(n: GraphNode): boolean {
  if (!isLocationNode(n)) return false;
  const subtype = locationSubtypeOf(n);
  return subtype !== undefined && subtype !== ROUTE_IDENTITY_SUBTYPE && locationClassOf(subtype) !== undefined;
}

function locationTier(graph: WorldGraph, handle: UndertakingObjectHandle): UndertakingObjectTier | null {
  const subtype = locationSubtypeOf(nodeOf(graph, handle));
  if (!subtype) return null;
  return LOCATION_SUBTYPE_TIER[subtype] ?? LOCATION_CLASS_TIER[locationClassOf(subtype) ?? ''] ?? null;
}

/** Place tier by the sublocation category table — the one table that already classifies every type id. */
const PLACE_CATEGORY_TIER: Readonly<Record<string, UndertakingObjectTier>> = {
  commerce: 1, nature: 1, cultural: 1, borderlands: 1,
  military: 2, religious: 2, scholarly: 2, arcane: 2, underworld: 2,
  authority: 3,
};

function placeTier(graph: WorldGraph, handle: UndertakingObjectHandle): UndertakingObjectTier | null {
  const typeId = nodeOf(graph, handle)?.properties.sublocationTypeId;
  if (typeof typeId !== 'string') return null;
  const category = SUBLOCATION_TYPE_CATEGORY[barePlaceTypeId(typeId)];
  return category ? PLACE_CATEGORY_TIER[category] ?? null : null;
}

/** Holding faces are mirrors of an `owns` edge, not objects of their own (THR-1297). */
const HOLDING_FACE_CATEGORY = 'holding';

function isItemObject(n: GraphNode): boolean {
  return n.type === 'artifact' && n.properties.attachmentCategory !== HOLDING_FACE_CATEGORY;
}

function itemTier(graph: WorldGraph, handle: UndertakingObjectHandle): UndertakingObjectTier | null {
  const node = nodeOf(graph, handle);
  if (!node) return null;
  // `AttachmentTier` is numeric 1–4 (Mundane…Legendary); the undertaking ladder has three rungs.
  const stamped = num(node.properties, 'tier');
  if (stamped === null) return null;
  return Math.min(3, Math.max(1, Math.round(stamped))) as UndertakingObjectTier;
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

function isGroupOfKind(kind: 'company' | 'army' | 'network') {
  return (n: GraphNode): boolean => getGroupKind(n) === kind && n.properties.groupStatus !== 'disbanded';
}

function isFactionObject(n: GraphNode): boolean {
  return n.type === 'actor' && n.properties.actorType === 'faction' && n.properties.actorStatus !== 'dissolved';
}

function isMarkEdge(e: GraphEdge): boolean {
  return e.type === 'knows_secret_of' && e.properties.revealed !== true;
}

function isTraitOfSubcategory(subcategories: readonly string[]) {
  return (n: GraphNode): boolean => n.type === 'trait' && subcategories.includes(String(n.properties.subcategory));
}

/** The bearers of a per-bearer trait node (has_trait edges point bearer → trait). */
function bearersOf(graph: WorldGraph, traitId: string): string[] {
  return graph.getIncomingEdges(traitId, 'has_trait').map(e => e.source);
}

// ─── The dormant kinds I — powers and conditions (THR-1429) ─────────

/** One `power_learned` / `condition_inflicted` entry. Fail-soft: tracing never throws into a semantic. */
function emitKindTrace(entry: PowerLearnedTrace | ConditionInflictedTrace): void {
  try {
    emitTrace(entry as TraceEntry);
  } catch {
    // NFP #4 — a trace that cannot be written must not take the world write with it.
  }
}

/**
 * Is this mortal a caster? THR-1230 ruling 4, composed as THR-1229 recommended:
 * a spell-weaver mastery trait, **or** a caster role, **or** Veil at the floor.
 *
 * Evaluated at proposal so a non-caster never sees the cell on the board (the
 * `no_eligible_apprentice` doctrine), and again at completion so a mortal who stopped
 * being one mid-project is refused rather than quietly allowed.
 */
function isCaster(graph: WorldGraph, actorId: string): boolean {
  const node = graph.getNode(actorId);
  if (!node) return false;

  // (a) A mastery trait that names the craft.
  for (const edge of graph.getOutgoingEdges(actorId, 'has_trait')) {
    const id = edge.target.toLowerCase();
    if (CASTER_MASTERY_TRAIT_IDS.some(t => id.includes(t))) return true;
  }

  // (b) A caster role. The seeded vocabulary, measured — see CASTER_NPC_ROLES.
  const role = (str(node.properties, 'npcRole') ?? str(node.properties, 'role') ?? '').toLowerCase();
  if (role && CASTER_NPC_ROLES.includes(role)) return true;

  // (c) Veil deep enough to teach oneself. Raw 0–100 scale (measured), and a field
  // most mortals do not carry — an absent capability block is not a caster, never a
  // zero that accidentally clears a floor of zero.
  const caps = node.properties.domainCapabilities as Record<string, number> | undefined;
  const veil = caps && typeof caps.veil === 'number' ? caps.veil : null;
  return veil !== null && veil >= LEARN_SPELL_CASTER_VEIL_FLOOR;
}

/** The spheres a mortal is aligned to, sorted, or empty when they have declared none. */
function alignedSpheres(graph: WorldGraph, actorId: string): string[] {
  const props = graph.getNode(actorId)?.properties ?? {};
  const out = new Set<string>();

  const alignment = props.sphereAlignment as { primary?: string; secondary?: string } | undefined;
  if (alignment?.primary) out.add(alignment.primary);
  if (alignment?.secondary) out.add(alignment.secondary);

  const affinity = props.sphereAffinity as { scores?: Record<string, number> } | undefined;
  for (const [sphere, score] of Object.entries(affinity?.scores ?? {})) {
    if (typeof score === 'number' && score > 0) out.add(sphere);
  }

  return [...out].sort();
}

/** The `spell`-class definition nodes in the world, sorted by id (NFP #3 — no draw anywhere here). */
function spellDefinitions(graph: WorldGraph): GraphNode[] {
  return graph.getNodesByType('trait')
    .filter(n => n.properties.subcategory === 'spell')
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Which spell definition nodes an actor already knows (`knows_spell`) or wields (`has_trait`). */
function spellsOfActor(graph: WorldGraph, actorId: string): { known: Set<string>; wielded: Set<string> } {
  const known = new Set<string>();
  const wielded = new Set<string>();
  for (const e of graph.getOutgoingEdges(actorId, 'knows_spell')) known.add(e.target);
  for (const e of graph.getOutgoingEdges(actorId, 'has_trait')) {
    if (graph.getNode(e.target)?.properties.subcategory === 'spell') {
      wielded.add(e.target);
      // Wielding without knowing cannot happen through `learn_spell`, but a world
      // loaded from elsewhere is not this cell's to police: treat wielded as known.
      known.add(e.target);
    }
  }
  return { known, wielded };
}

/**
 * Whether two mortals are allies — the blessing half of the sign.
 *
 * Three readings in order, the first that answers wins: the same faction, the same
 * company, or standing at or above `CONDITION_ALLY_STANDING_MIN`. Self is handled by
 * the caller, because blessing oneself needs no test at all.
 */
function isAlly(graph: WorldGraph, actorId: string, targetId: string): boolean {
  const actorFaction = actorFactionId(graph, actorId);
  if (actorFaction && actorFaction === actorFactionId(graph, targetId)) return true;

  // Compare ids, not node objects — `getGroupOf` returns a fresh handle per call.
  const actorGroup = getGroupOf(graph, actorId)?.id;
  if (actorGroup && actorGroup === getGroupOf(graph, targetId)?.id) return true;

  for (const e of graph.getOutgoingEdges(actorId, 'reputation_with')) {
    if (e.target !== targetId) continue;
    const score = num(e.properties, 'score');
    if (score !== null && score >= CONDITION_ALLY_STANDING_MIN) return true;
  }
  return false;
}

/** The first motive the actor holds against the target, or null. The curse half of the sign. */
function motiveAgainst(graph: WorldGraph, actorId: string, targetId: string): MotiveKind | null {
  for (const motive of MOTIVE_GATE_KINDS) {
    if (holdsMotive(graph, actorId, targetId, motive)) return motive;
  }
  return null;
}

export type ConditionSign = 'blessing' | 'curse' | 'seal';

/**
 * The sign of a condition the actor would put on the target — the whole story rule of
 * `create × Condition`, and the gate (THR-1397).
 *
 * You bless yourself and your friends; you curse someone you have a reason to curse;
 * and a stranger is **refused**, deliberately, rather than being handed some neutral
 * third thing. Returns `null` for the stranger case so the caller can trace `no_sign`.
 */
export function resolveConditionSign(
  graph: WorldGraph,
  actorId: string,
  targetId: string,
): { sign: 'blessing' | 'curse'; motive?: MotiveKind } | null {
  if (actorId === targetId) return { sign: 'blessing' };
  if (isAlly(graph, actorId, targetId)) return { sign: 'blessing' };
  const motive = motiveAgainst(graph, actorId, targetId);
  if (motive) return { sign: 'curse', motive };
  return null;
}

/** The condition-template pool for a sign, as catalog tags rather than an id list (NFP #1). */
function conditionPool(graph: WorldGraph, tag: string, tierCap: number): GraphNode[] {
  return graph.getNodesByType('trait')
    .filter(n => {
      if (n.properties.subcategory !== 'condition') return false;
      const tags = n.properties.tags;
      if (!Array.isArray(tags) || !tags.includes(tag)) return false;
      const tier = num(n.properties, 'tier');
      return tier === null || tier <= tierCap;
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Pick one template from a pool: prefer one tagged with a Reach the actor leads in,
 * else the pool's first by id. A filter, a sort and a first — no draw (NFP #3).
 */
function pickConditionTemplate(graph: WorldGraph, actorId: string, pool: readonly GraphNode[]): GraphNode | null {
  if (pool.length === 0) return null;
  const caps = graph.getNode(actorId)?.properties.domainCapabilities as Record<string, number> | undefined;
  const leading = Object.entries(caps ?? {})
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 2)
    .map(([reach]) => `#${reach}`);
  return pool.find(n => {
    const tags = n.properties.tags;
    return Array.isArray(tags) && leading.some(t => tags.includes(t));
  }) ?? pool[0];
}

/** The tier cap and curse duration for the band the completion landed on. */
function conditionTierCap(outcome: string | undefined): number {
  return (outcome ? CONDITION_TIER_CAP_BY_BAND[outcome] : undefined) ?? CONDITION_TIER_CAP_DEFAULT;
}

function curseDurationTicks(outcome: string | undefined): number {
  return (outcome ? CURSE_DURATION_TICKS_BY_BAND[outcome] : undefined) ?? CURSE_DURATION_TICKS_DEFAULT;
}

/**
 * Put one condition on one mortal — the shared body of `inflict_condition` and
 * `seal_power`.
 *
 * The mint is the catalog's own (`instantiateReward`, the `trait` branch), so the
 * conditions a mortal inflicts are exactly the conditions encounters already hand out
 * and every live reader — decay, the predicates, the walkers, the cure — reads them
 * unchanged. What this adds on top is the two edge properties that make an inflicted
 * condition legible as somebody's *doing*: the `sign` and the hand that dealt it.
 */
function inflictCondition(
  ctx: ObjectVerbContext,
  args: {
    targetId: string;
    templateId: string;
    sign: ConditionSign;
    motive?: MotiveKind;
    ticksRemaining: number | null;
    op: string;
  },
): GraphOpResult {
  const { targetId, templateId, sign, motive, ticksRemaining, op } = args;

  const minted = instantiateReward(ctx.graph, templateId, targetId, ctx.tick);
  if (!minted) {
    emitKindTrace({
      category: 'condition_inflicted', tick: ctx.tick, actorId: ctx.actorId, targetId,
      templateId, sign, ...(motive ? { motive } : {}), ticksRemaining: 0, refused: 'mint_failed',
      summary: `${templateId} would not take on ${targetId}`,
    } as ConditionInflictedTrace);
    return fail(op, 'mint_failed');
  }

  // Per-bearer state on the edge (THR-1395) — the duration the band decided, the sign,
  // and the culprit. `inflictedBy` is what lets the sheet say whose doing it was and
  // what the grievance lane reads a *seen* culprit off.
  const edge = ctx.graph.getEdge(minted.edgeId);
  if (edge) {
    ctx.graph.updateEdge(minted.edgeId, {
      properties: {
        ...edge.properties,
        sign,
        inflictedBy: ctx.actorId,
        ...(motive ? { inflictedMotive: motive } : {}),
        ...(ticksRemaining !== null ? { ticksRemaining, totalTicks: ticksRemaining } : {}),
      },
    });
  }

  emitKindTrace({
    category: 'condition_inflicted', tick: ctx.tick, actorId: ctx.actorId, targetId,
    templateId, sign, ...(motive ? { motive } : {}),
    ticksRemaining: ticksRemaining ?? 0,
    summary: sign === 'blessing'
      ? `${targetId} walks under ${minted.displayName}`
      : `${minted.displayName} is on ${targetId}`,
  } as ConditionInflictedTrace);

  // A curse and a seal are harms; a blessing is not. The class rides the op result so
  // the completion site writes the outcome node for one and not the other — the sign
  // is decided per completion, and a template-level `harmClass` could not say it.
  return {
    success: true,
    op,
    createdId: minted.instanceId,
    ...(sign === 'blessing' ? {} : { harmClass: HARM_ON_AFFLICT, victimAgentId: targetId }),
  };
}

// ─── Places ─────────────────────────────────────────────────────────

const AREA: UndertakingObjectType = {
  id: 'area',
  displayName: 'Area',
  shape: { nodeType: 'region' },
  ownedVia: [],
  tierOf: () => 2,
  lexicon: 'place',
  harmOnDestroy: 'property_destroyed',
  verbs: {
    // Walking the unmapped: the old exploration templates become one observe cell.
    observe,
  },
};

const LOCATION: UndertakingObjectType = {
  id: 'location',
  displayName: 'Location',
  shape: { nodeType: 'location', discriminator: isLocationObject },
  ownedVia: ['controls', 'owns'],
  tierOf: locationTier,
  lexicon: 'place',
  harmOnDestroy: 'property_destroyed',
  verbs: {
    create: (ctx) => {
      const siteId = createSite(ctx);
      const site = siteId ? ctx.graph.getNode(siteId) : undefined;
      const col = site ? num(site.properties, 'hexCol') : null;
      const row = site ? num(site.properties, 'hexRow') : null;
      if (col === null || row === null) return fail('create_location', 'no_site_hex');
      const subtype = typeof ctx.params?.locationSubtype === 'string'
        ? ctx.params.locationSubtype : UNDERTAKING_DEFAULT_LOCATION_SUBTYPE;
      // Only the settlement class is founded by work; the other classes are the world's to make.
      if (!LOCATION_CLASSES.settlement.includes(subtype)) return fail('create_location', `not_a_settlement_subtype:${subtype}`);
      const name = typeof ctx.params?.name === 'string'
        ? ctx.params.name : `${ctx.graph.getNode(ctx.actorId)?.name ?? 'New'} ${subtype}`;
      return createLocation(ctx.graph, { col, row }, ctx.actorId, name, subtype, ctx.tick, {
        prosperity: FOUNDED_SETTLEMENT_INITIAL_PROSPERITY,
      });
    },
    'change:raise': (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      const property = typeof ctx.params?.property === 'string' ? ctx.params.property : 'prosperity';
      return nodeId
        ? modifyLocationProperty(ctx.graph, nodeId, property, UNDERTAKING_CHANGE_PROSPERITY_DELTA, [0, 1])
        : fail('modify_location_property', 'no_node');
    },
    // Sabotage: the same op, signed the other way, against another's Location.
    'change:lower': (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      const property = typeof ctx.params?.property === 'string' ? ctx.params.property : 'prosperity';
      return nodeId
        ? modifyLocationProperty(ctx.graph, nodeId, property, -UNDERTAKING_CHANGE_PROSPERITY_DELTA, [0, 1])
        : fail('modify_location_property', 'no_node');
    },
    // Establishing control of a Location is the sustained `claim_control` mode —
    // upkeep, degradation, collapse — never a completion semantic.
    'control:claim': { mode: 'claim_control' },
    'control:seize': (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? transferHolding(ctx.graph, nodeId, ctx.actorId, holdingCtx(ctx)) : fail('transfer_holding', 'no_node');
    },
    // Ruin: the prosperity floor plus the `ruins` subtype the battle aftermath already
    // reads — not a deletion, and not a new flag. Settlements and strongholds only.
    destroy: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      const loc = nodeId ? ctx.graph.getNode(nodeId) : undefined;
      if (!nodeId || !loc) return fail('ruin_settlement', 'location_not_found');
      const cls = locationClassOf(locationSubtypeOf(loc));
      if (!cls || !RUINABLE_CLASSES.has(cls)) return fail('ruin_settlement', `not_ruinable:${cls ?? 'unclassed'}`);
      razeHolding(ctx.graph, nodeId, holdingCtx(ctx));
      const prosperity = num(loc.properties, 'prosperity') ?? RUINED_SETTLEMENT_PROSPERITY_FLOOR;
      const wasSubtype = locationSubtypeOf(loc);
      loc.properties.prosperity = Math.min(prosperity, RUINED_SETTLEMENT_PROSPERITY_FLOOR);
      loc.properties.ruinedFromSubtype = loc.properties.locationSubtype;
      loc.properties.locationSubtype = 'ruins';
      loc.properties.ruinedTick = ctx.tick;
      // R2 (THR-1428, decided in THR-1397): the ruin joins the delve layer. The scale
      // is banded from what the place *was* — a razed capital is a deeper delve than a
      // razed hamlet — and it is the one property the admission scan reads off the node
      // (`delveVariant.ts`), which is why it is written here rather than derived there.
      // `sphereAlignment` is deliberately untouched: the delve reads that name directly,
      // and a settlement that never carried one gets the vault archetype, not an invented
      // sphere.
      const magnitude = (wasSubtype !== null && wasSubtype !== undefined
        ? RUINED_SETTLEMENT_MAGNITUDE_BY_SUBTYPE[wasSubtype]
        : undefined) ?? RUINED_SETTLEMENT_DEFAULT_MAGNITUDE;
      loc.properties.ruinMagnitude = magnitude;
      emitReaderTrace(ctx, {
        cellId: 'cell.destroy.location',
        reader: 'ruin_delve_stamp',
        objectId: nodeId,
        productId: nodeId,
        summary: `${loc.name ?? nodeId} is a ruin the delve layer can admit (magnitude ${magnitude})`,
      });
      return { success: true, op: 'ruin_settlement' };
    },
    observe,
  },
};

const PLACE: UndertakingObjectType = {
  id: 'place',
  displayName: 'Place',
  shape: { nodeType: 'location', discriminator: isPlaceNode },
  ownedVia: ['owns'],
  tierOf: placeTier,
  lexicon: 'place',
  harmOnDestroy: 'property_destroyed',
  verbs: {
    create: (ctx) => {
      const parentId = createSite(ctx);
      if (!parentId) return fail('create_sublocation', 'no_parent');
      const typeId = typeof ctx.params?.sublocationTypeId === 'string'
        ? ctx.params.sublocationTypeId : UNDERTAKING_DEFAULT_PLACE_TYPE_ID;
      const name = typeof ctx.params?.name === 'string'
        ? ctx.params.name : `${ctx.graph.getNode(ctx.actorId)?.name ?? 'A'}'s ${barePlaceTypeId(typeId).replace(/-/g, ' ')}`;
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
    destroy: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? razeHolding(ctx.graph, nodeId, holdingCtx(ctx)) : fail('raze_holding', 'no_node');
    },
    observe,
  },
};

const ROUTE: UndertakingObjectType = {
  id: 'route',
  displayName: 'Route',
  shape: { nodeType: 'location', discriminator: isRouteObject },
  ownedVia: ['owns'],
  tierOf: routeTier,
  lexicon: 'route',
  harmOnDestroy: 'network_severed',
  verbs: {
    create: (ctx) => {
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
    // A blockade lowers a route: suspended, not deleted — the trade phases already honour it.
    'change:lower': (ctx) => {
      const node = nodeOf(ctx.graph, ctx.handle);
      const endpoint = node?.properties.routeSourceId;
      if (typeof endpoint !== 'string') return fail('blockade_route', 'no_endpoint');
      return blockadeRoute(ctx.graph, ctx.actorId, endpoint, ctx.tick);
    },
    // Trading along one's own route — the catalog's conduct op, anchored at the near end.
    use: (ctx) => {
      const node = nodeOf(ctx.graph, ctx.handle);
      const anchor = str(node?.properties, 'routeSourceId');
      if (!node || !anchor) return fail('conduct_trade', 'no_endpoint');
      const op = { op: 'conduct_trade' } as unknown as GraphOp;
      const r = executeConductTrade(ctx.graph, op, { actorId: ctx.actorId, targetId: node.id, locationId: anchor, tick: ctx.tick });
      return r.success ? { success: true, op: 'conduct_trade' } : fail('conduct_trade', r.error ?? 'refused');
    },
    'control:claim': (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? grantHolding(ctx.graph, ctx.actorId, nodeId, holdingCtx(ctx)) : fail('grant_holding', 'no_node');
    },
    // Seizing a route takes its holding, and the seizer starts taxing it — the catalog's toll op.
    'control:seize': (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      if (!nodeId) return fail('transfer_holding', 'no_node');
      const moved = transferHolding(ctx.graph, nodeId, ctx.actorId, holdingCtx(ctx));
      if (!moved.success) return moved;
      const anchor = str(ctx.graph.getNode(nodeId)?.properties, 'routeSourceId');
      if (anchor) {
        const op = { op: 'tax_trade_route' } as unknown as GraphOp;
        executeTaxTradeRoute(ctx.graph, op, { actorId: ctx.actorId, targetId: nodeId, locationId: anchor, tick: ctx.tick });
      }
      return moved;
    },
    observe,
  },
};

// ─── People and collectives ─────────────────────────────────────────

const FACTION: UndertakingObjectType = {
  id: 'faction',
  displayName: 'Faction',
  shape: { nodeType: 'actor', discriminator: isFactionObject },
  ownedVia: ['commanded_by', 'leads'],
  tierOf: groupTier(UNDERTAKING_FACTION_TIER_MEMBER_BANDS),
  lexicon: 'network',
  harmOnDestroy: 'network_severed',
  verbs: {
    // Founding an order: the op the packs reached through one hint, as a cell.
    create: (ctx) => {
      const siteId = createSite(ctx);
      if (!siteId) return fail('create_group', 'no_target_location');
      const actor = ctx.graph.getNode(ctx.actorId);
      const site = ctx.graph.getNode(siteId);
      const seed = { ...UNDERTAKING_DEFAULT_FACTION_SEED, locationTypes: [...UNDERTAKING_DEFAULT_FACTION_SEED.locationTypes] };
      const name = typeof ctx.params?.name === 'string'
        ? ctx.params.name
        : seed.nameTemplate.replace('{actor}', actor?.name ?? 'The Founder').replace('{location}', site?.name ?? 'the hold');
      const reach = (ctx.params?.reachProfile ?? {}) as Parameters<typeof foundFaction>[4];
      return foundFaction(ctx.state, ctx.actorId, siteId, seed, reach, name, ctx.tick);
    },
    // Undoing a faction is the schism the world already resolves in its own phase.
    destroy: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      if (!nodeId) return fail('plant_schism', 'no_node');
      const delay = typeof ctx.params?.resolutionDelay === 'number'
        ? ctx.params.resolutionDelay : UNDERTAKING_SCHISM_RESOLUTION_DELAY_TICKS;
      const planted = applyPlantSchism(ctx.state, ctx.runtime, nodeId, ctx.actorId, delay, ctx.tick);
      return planted ? { success: true, op: 'plant_schism', createdId: nodeId } : fail('plant_schism', 'faction_not_found');
    },
    observe,
  },
};

const COMPANY: UndertakingObjectType = {
  id: 'company',
  displayName: 'Company',
  shape: { nodeType: 'actor', discriminator: isGroupOfKind('company') },
  ownedVia: ['commanded_by'],
  tierOf: groupTier(UNDERTAKING_COMPANY_TIER_ROSTER_BANDS),
  lexicon: 'band',
  harmOnDestroy: 'holding_seized',
  verbs: {
    create: (ctx) => raiseWarband(ctx.state, ctx.actorId, ctx.boundCastIds ?? []),
    'change:raise': (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? reinforceWarband(ctx.state, ctx.actorId, nodeId, ctx.boundCastIds ?? []) : fail('reinforce_group', 'no_node');
    },
    destroy: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? disbandGroup(ctx.state, nodeId) : fail('disband_group', 'no_node');
    },
  },
};

const ARMY: UndertakingObjectType = {
  id: 'army',
  displayName: 'Army',
  shape: { nodeType: 'actor', discriminator: isGroupOfKind('army') },
  ownedVia: ['commanded_by'],
  tierOf: groupTier(UNDERTAKING_ARMY_TIER_ROSTER_BANDS),
  lexicon: 'band',
  harmOnDestroy: 'holding_seized',
  verbs: {
    // A mortal commander raising an army for their faction — the op the divine lane reaches.
    create: (ctx) => {
      const factionId = actorFactionId(ctx.graph, ctx.actorId);
      if (!factionId) return fail('raise_warhost', 'actor_has_no_faction');
      const strength = typeof ctx.params?.strength === 'number' ? ctx.params.strength : UNDERTAKING_DEFAULT_WARHOST_STRENGTH;
      const armyId = raiseWarhostForce(ctx.state, factionId, ctx.actorId, strength, ctx.tick);
      return armyId ? { success: true, op: 'raise_warhost', createdId: armyId } : fail('raise_warhost', 'no_army_raised');
    },
    'change:raise': (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? reinforceWarband(ctx.state, ctx.actorId, nodeId, ctx.boundCastIds ?? []) : fail('reinforce_group', 'no_node');
    },
    destroy: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? disbandGroup(ctx.state, nodeId) : fail('disband_group', 'no_node');
    },
  },
};

const NETWORK: UndertakingObjectType = {
  id: 'network',
  displayName: 'Network',
  shape: { nodeType: 'actor', discriminator: isGroupOfKind('network') },
  ownedVia: ['commanded_by'],
  tierOf: groupTier(UNDERTAKING_COMPANY_TIER_ROSTER_BANDS),
  lexicon: 'network',
  harmOnDestroy: 'network_severed',
  verbs: {
    destroy: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      return nodeId ? disbandGroup(ctx.state, nodeId) : fail('disband_group', 'no_node');
    },
  },
};

const COMPANION: UndertakingObjectType = {
  id: 'companion',
  displayName: 'Companion',
  shape: { nodeType: 'companion' },
  ownedVia: [],
  tierOf: () => 1,
  lexicon: 'band',
  harmOnDestroy: 'network_severed',
  verbs: {
    // Recruiting a companion: the op the aftermath effects reach, as a work.
    create: (ctx) => {
      const templateId = typeof ctx.params?.templateId === 'string'
        ? ctx.params.templateId
        : COMPANION_TEMPLATES.find(t => !t.unique)?.id ?? COMPANION_TEMPLATES[0]?.id;
      if (!templateId) return fail('mint_companion', 'no_template');
      const prng = mulberry32(ctx.tick * 7919 + ctx.actorId.length);
      const minted = mintCompanion(ctx.graph, templateId, ctx.actorId, ctx.tick, prng, { source: ctx.projectId ?? 'undertaking', respectCap: true });
      return minted ? { success: true, op: 'mint_companion', createdId: minted.companionId } : fail('mint_companion', 'not_minted');
    },
    destroy: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      if (!nodeId) return fail('remove_companion', 'no_node');
      const removed = removeCompanion(ctx.graph, nodeId, 'story', ctx.tick);
      return removed ? { success: true, op: 'remove_companion' } : fail('remove_companion', 'companion_not_found');
    },
  },
};

// ─── Things a mortal carries or is under ────────────────────────────

const ITEM: UndertakingObjectType = {
  id: 'item',
  displayName: 'Item',
  shape: { nodeType: 'artifact', discriminator: isItemObject },
  ownedVia: ['possesses'],
  tierOf: itemTier,
  lexicon: 'item',
  harmOnDestroy: 'property_destroyed',
  verbs: {
    // The masterwork op is the one item-minting undertaking the corpus has.
    create: (ctx) => mintMasterwork(
      ctx.graph, ctx.actorId,
      typeof ctx.params?.craftTag === 'string' ? ctx.params.craftTag : 'craft',
      ctx.tick,
      typeof ctx.params?.tier === 'number' ? ctx.params.tier : undefined,
    ),
    // Seizing an item moves the `possesses` edge: the world has the edge and the
    // funnel (`treasureMapConsumption` removes exactly this pair), no template ever
    // offered the transfer.
    'control:seize': (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      const item = nodeId ? ctx.graph.getNode(nodeId) : undefined;
      if (!nodeId || !item) return fail('seize_item', 'item_not_found');
      if (!ctx.graph.getNode(ctx.actorId)) return fail('seize_item', 'actor_not_found');
      for (const edge of ctx.graph.getIncomingEdges(nodeId, 'possesses')) ctx.graph.removeEdge(edge.id);
      ctx.graph.addEdge({
        id: `possesses_${nodeId}_${ctx.actorId}_${ctx.tick}`,
        source: ctx.actorId,
        target: nodeId,
        type: 'possesses',
        properties: { active: true, acquiredTick: ctx.tick, via: 'seized' },
      });
      return { success: true, op: 'seize_item', createdId: nodeId };
    },
    // Destroying an item is the removal funnel: the bearer edges, then the node.
    destroy: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      if (!nodeId || !ctx.graph.getNode(nodeId)) return fail('destroy_item', 'item_not_found');
      for (const edge of ctx.graph.getIncomingEdges(nodeId, 'possesses')) ctx.graph.removeEdge(edge.id);
      ctx.graph.removeNode(nodeId);
      return { success: true, op: 'destroy_item' };
    },
  },
};

const POWER: UndertakingObjectType = {
  id: 'power',
  displayName: 'Power',
  // THR-1429: the Power kind's shape, which the world-object registry deferred. Both
  // classes are trait nodes — `bestowed` is a god's gift, `spell` one a mortal learned —
  // so `use` reads them through one discriminator and never has to know which it got.
  shape: { nodeType: 'trait', discriminator: isTraitOfSubcategory(POWER_SUBCATEGORIES) },
  // Who holds a power: the bearer's `has_trait` edge. Empty until THR-1429, because
  // `use` is an `own` cell and never had to ask. `destroy` is an `other` cell, so with
  // no holder edge the ownership filter matched nobody and the motive gate found no
  // owner to hold a motive against — the cell enumerated zero targets, always.
  ownedVia: ['has_trait'],
  tierOf: () => 2,
  lexicon: 'item',
  // Sealing another's art is not property damage — nothing of theirs is rubble; a
  // thing was put *on* them, and the drive that answers it is the affliction's.
  harmOnDestroy: HARM_ON_AFFLICT,
  verbs: {
    /**
     * `create × Power` — a scholar learns a spell (THR-1429, THR-1397's tier-one work).
     *
     * The first writer of `knows_spell`, and the cell that wakes the Power kind. Known
     * and wielded are two different facts (THR-1231): the `knows_spell` edge is the
     * biography and is unlimited, the `has_trait` edge is what the mortal is carrying
     * now and is capped by `SLOT_CAPS.spell`. Learning past the cap is not a failure —
     * it is a spell known and not carried, and the trace says so rather than refusing.
     */
    create: (ctx) => {
      const op = 'learn_spell';
      const traceRefusal = (refused: PowerLearnedTrace['refused'], spellTemplateId = '', tradition = '') => {
        emitKindTrace({
          category: 'power_learned', tick: ctx.tick, actorId: ctx.actorId,
          spellTemplateId, tradition, wielded: false, refused,
          summary: `${ctx.actorId} learns nothing: ${refused}`,
        } as PowerLearnedTrace);
        return fail(op, refused ?? 'refused');
      };

      if (!ctx.graph.getNode(ctx.actorId)) return fail(op, 'actor_not_found');
      if (!isCaster(ctx.graph, ctx.actorId)) return traceRefusal('not_a_caster');

      const definitions = spellDefinitions(ctx.graph);
      // A world seeded before this ship has no definition nodes. Refuse and say so —
      // never mint one per bearer to paper over it (THR-1395).
      if (definitions.length === 0) return traceRefusal('no_definition');

      // The tradition shelf: the actor's aligned spheres first. An unaligned mortal —
      // measured as ~99% of them — studies from the open shelf rather than from
      // nothing, which is what keeps the cell from being dead on arrival.
      const aligned = alignedSpheres(ctx.graph, ctx.actorId);
      const shelf = aligned.length > 0
        ? definitions.filter(n => aligned.includes(String(n.properties.sphereAffinity)))
        : (LEARN_SPELL_UNALIGNED_SHELF_OPEN ? definitions : []);

      const { known, wielded } = spellsOfActor(ctx.graph, ctx.actorId);
      const pick = shelf.find(n => !known.has(n.id));
      if (!pick) {
        // Told apart on purpose: a shelf that had nothing on it and a shelf whose every
        // spell is already learned are different facts about the same mortal.
        return traceRefusal(shelf.length === 0 ? 'no_spell_to_learn' : 'already_known');
      }

      const spellTemplateId = str(pick.properties, 'spellTemplateId') ?? pick.id;
      const tradition = str(pick.properties, 'sphereAffinity') ?? 'unaligned';

      // Known — always, and first. The biography is the thing this cell exists to write.
      const knowsEdgeId = `knows_spell_${ctx.actorId}_${pick.id}`;
      ctx.graph.addEdge({
        id: knowsEdgeId,
        source: ctx.actorId,
        target: pick.id,
        type: 'knows_spell',
        properties: { learnedTick: ctx.tick, sphereAffinity: tradition, source: op },
      });

      // Wielded — only if a slot is free. The cap is the attachment system's own
      // (`SLOT_CAPS.spell`); this cell adds no cap logic of its own.
      const freeSlot = wielded.size < (SLOT_CAPS.spell ?? 0);
      if (freeSlot) {
        ctx.graph.addEdge({
          id: `has_trait_${ctx.actorId}_${pick.id}`,
          source: ctx.actorId,
          target: pick.id,
          type: 'has_trait',
          properties: {
            level: 1,
            acquiredTick: ctx.tick,
            ticksRemaining: null,
            source: op,
            visibility: 'discoverable',
            modifiers: {},
          },
        });
      }

      emitKindTrace({
        category: 'power_learned', tick: ctx.tick, actorId: ctx.actorId,
        spellTemplateId, tradition, wielded: freeSlot,
        summary: freeSlot
          ? `${ctx.actorId} has ${pick.name} now`
          : `${ctx.actorId} has ${pick.name} by heart, with no room to carry it`,
      } as PowerLearnedTrace);

      // The **edge**, not the node. What this undertaking created is one mortal's
      // knowledge of a spell; the definition node existed before them and is shared
      // with every other mortal who ever learns it. Reporting the node id here handed
      // `christenCompletedWork` a world-shared node to rename, and one priest's study
      // renamed Crystal Gate to "The Standing Quarter of Morthane" for everybody.
      return { success: true, op, createdId: knowsEdgeId };
    },

    /**
     * `destroy × Power` — sealing a rival's art (THR-1429, THR-1397: "a curse-class
     * condition that suppresses the power, motive-gated").
     *
     * The power is **not** removed: it stays known and stays wielded, and the mortal
     * simply cannot call on it while the seal holds. That is what makes curing the
     * condition (`destroy × Condition`, already live) the counter-play, and it ships
     * in the same commit for free.
     *
     * `destroy` is already motive-gated by verb, so the licence is checked before this
     * ever runs — the gate is not re-implemented here.
     */
    destroy: (ctx) => {
      const op = 'seal_power';
      const power = nodeOf(ctx.graph, ctx.handle);
      if (!power) return fail(op, 'power_not_found');

      // Which bearer the seal lands on. A spell definition node is **shared**, so its
      // bearer set is every mortal in the world who wields that spell — and the motive
      // gate is satisfied by *any* one of them holding a motive against the actor. Left
      // there, a witch with a grudge against one Veilwalker could seal a different,
      // innocent Veilwalker and the gate would still read as licensed.
      //
      // So the target is chosen to agree with the licence: the named target if it is
      // genuinely a bearer, else a bearer the actor actually holds a motive against,
      // and only then anyone else. Sorted, so the pick is reproducible (NFP #3).
      const bearers = bearersOf(ctx.graph, power.id).filter(b => b !== ctx.actorId).sort();
      const targetId = (ctx.targetNodeId && bearers.includes(ctx.targetNodeId))
        ? ctx.targetNodeId
        : (bearers.find(b => motiveAgainst(ctx.graph, ctx.actorId, b) !== null) ?? bearers[0]);
      if (!targetId) {
        emitKindTrace({
          category: 'condition_inflicted', tick: ctx.tick, actorId: ctx.actorId, targetId: '',
          templateId: SEAL_POWER_CONDITION_ID, sign: 'seal', ticksRemaining: 0,
          refused: 'power_not_wielded',
          summary: `nobody is carrying ${power.name ?? power.id} to seal`,
        } as ConditionInflictedTrace);
        return fail(op, 'power_not_wielded');
      }
      if (!ctx.graph.getNode(targetId)) return fail(op, 'target_gone');

      return inflictCondition(ctx, {
        targetId,
        templateId: SEAL_POWER_CONDITION_ID,
        sign: 'seal',
        motive: motiveAgainst(ctx.graph, ctx.actorId, targetId) ?? undefined,
        // The seal and the condition carrying it run out together.
        ticksRemaining: curseDurationTicks(ctx.outcome),
        op,
      });
    },

    // Casting: the spell op, its costs and its backlash exist; a power that
    // names its spell template is cast by the bearer — a bestowal a god gave, or
    // (THR-1429) a spell the mortal learned. A power with no template is refused.
    use: (ctx) => {
      const node = nodeOf(ctx.graph, ctx.handle);
      if (!node) return fail('activate_spell', 'power_not_found');

      // The seal's reader (THR-1429). Read off the **bearer**, not off the power: a
      // spell definition node is shared by every mortal who learned it, so a flag on
      // the node would silence Veilwalk for the whole world the moment one witch was
      // cursed. `isSpellSuppressedFor` asks the actor's own conditions instead.
      if (isSpellSuppressedFor(ctx.graph, ctx.actorId, ctx.state.effectStates)) {
        emitReaderTrace(ctx, {
          cellId: 'cell.use.power', reader: 'spell_suppressed', objectId: node.id,
          refused: 'power_suppressed',
          summary: `${node.name ?? node.id} will not answer — ${ctx.actorId}'s art is bound`,
        });
        return fail('activate_spell', 'power_suppressed');
      }

      const spellId = str(node.properties, 'spellTemplateId') ?? str(node.properties, 'spellId') ?? node.id;
      const spell = getSpellTemplate(spellId);
      if (!spell) return fail('activate_spell', `no_spell_template:${spellId}`);
      // Exhaustion's reader (THR-1428 R4): `tick_exhaust` has always stamped a
      // deadline nobody checked. A caster still spent is refused here, which is what
      // makes the cost a cost.
      const exhaustedUntil = num(ctx.graph.getNode(ctx.actorId)?.properties ?? {}, 'exhaustedUntilTick');
      if (exhaustedUntil !== null && exhaustedUntil > ctx.tick) {
        emitReaderTrace(ctx, {
          cellId: 'cell.use.power', reader: 'spell_exhausted', objectId: node.id,
          refused: 'exhausted',
          summary: `too spent to call on ${node.name ?? node.id} again yet`,
        });
        return fail('activate_spell', 'spell_exhausted');
      }
      const prng = mulberry32(ctx.tick * 104729 + ctx.actorId.length);
      const outcome = activateSpell(ctx.graph, ctx.actorId, spell, ctx.targetNodeId, ctx.tick, prng());
      const cast = outcome.outcome === 'success' || outcome.outcome === 'backlash';
      // The spell's price lands on quintessence, where the game's threshold gates
      // already bite — not on the `doom` health meter (THR-1397, verbatim: "the
      // spell's soul-price moves from the doom health meter to quintessence"). The
      // quintessence phase owns the write; this only queues the event.
      if (cast && (outcome.soulPrice ?? 0) > 0) {
        const mutableState = ctx.state as { pendingQuintessenceEvents?: QuintessenceEvent[] };
        const events = mutableState.pendingQuintessenceEvents ?? (mutableState.pendingQuintessenceEvents = []);
        events.push({
          targetNodeId: ctx.actorId,
          delta: -(outcome.soulPrice ?? 0) * SPELL_SOUL_PRICE_QUINTESSENCE_SCALE,
          source: 'spell_price',
          tick: ctx.tick,
        });
        emitReaderTrace(ctx, {
          cellId: 'cell.use.power', reader: 'spell_price', objectId: node.id,
          summary: `the calling cost ${node.name ?? node.id}'s bearer something of themselves`,
        });
      }
      return cast
        ? { success: true, op: 'activate_spell' }
        : fail('activate_spell', outcome.outcome);
    },
  },
};

const CONDITION: UndertakingObjectType = {
  id: 'condition',
  displayName: 'Condition',
  shape: { nodeType: 'trait', discriminator: isTraitOfSubcategory(['condition', 'scar']) },
  ownedVia: [],
  tierOf: () => 2,
  lexicon: 'item',
  harmOnDestroy: 'property_destroyed',
  verbs: {
    /**
     * `create × Condition` — one **signed** cell (THR-1429, THR-1397 verbatim: "Against
     * another it is a curse … For oneself or an ally it is a blessing, the same cell
     * un-gated").
     *
     * The first cell in the game whose object is made *against a person*. The sign is
     * read from the actor's relation to the target and is itself the gate: you bless
     * yourself and your friends, you curse someone you have a reason to curse, and a
     * stranger is refused. There is deliberately no neutral third outcome.
     *
     * Its counter-play — curing — is the `destroy` semantic directly below, live since
     * before this cell existed.
     */
    create: (ctx) => {
      const op = 'inflict_condition';
      // A `create` cell's handle is the **site**: for a condition, `CREATE_SITE_RULE`
      // makes that a co-located mortal, so the site and the target are the same node.
      const targetId = ctx.targetNodeId ?? nodeIdOf(ctx.handle);
      if (!targetId || !ctx.graph.getNode(targetId)) {
        emitKindTrace({
          category: 'condition_inflicted', tick: ctx.tick, actorId: ctx.actorId, targetId: targetId ?? '',
          templateId: '', sign: 'blessing', ticksRemaining: 0, refused: 'target_gone',
          summary: 'the one it was meant for is gone',
        } as ConditionInflictedTrace);
        return fail(op, 'target_gone');
      }

      const signed = resolveConditionSign(ctx.graph, ctx.actorId, targetId);
      if (!signed) {
        emitKindTrace({
          category: 'condition_inflicted', tick: ctx.tick, actorId: ctx.actorId, targetId,
          templateId: '', sign: 'blessing', ticksRemaining: 0, refused: 'no_sign',
          summary: `${ctx.actorId} has no reason to bless or curse ${targetId}`,
        } as ConditionInflictedTrace);
        return fail(op, 'no_sign');
      }

      const tag = signed.sign === 'blessing' ? CONDITION_BLESSING_TAG : CONDITION_CURSE_TAG;
      const pool = conditionPool(ctx.graph, tag, conditionTierCap(ctx.outcome));
      const template = pickConditionTemplate(ctx.graph, ctx.actorId, pool);
      if (!template) {
        emitKindTrace({
          category: 'condition_inflicted', tick: ctx.tick, actorId: ctx.actorId, targetId,
          templateId: '', sign: signed.sign, ticksRemaining: 0, refused: 'no_template',
          summary: `nothing in the ${tag} pool this band could reach`,
        } as ConditionInflictedTrace);
        return fail(op, 'no_template');
      }

      return inflictCondition(ctx, {
        targetId,
        templateId: template.id,
        sign: signed.sign,
        motive: signed.motive,
        // A gift is what it is: a blessing keeps the template's own duration. A curse
        // is scaled by how well the work went.
        ticksRemaining: signed.sign === 'curse' ? curseDurationTicks(ctx.outcome) : null,
        op,
      });
    },

    // Curing: the removal funnel the expiry phase already uses, taken as work — a
    // healer's undertaking. Conditions are one node per bearer today (THR-1395), so
    // removing the edge is removing the condition. Since THR-1429 this is also how a
    // sealed power is freed early: the seal is a condition, so curing it lifts it.
    destroy: (ctx) => {
      const nodeId = nodeIdOf(ctx.handle);
      if (!nodeId || !ctx.graph.getNode(nodeId)) return fail('cure_condition', 'condition_not_found');
      const bearers = bearersOf(ctx.graph, nodeId);
      if (bearers.length === 0) return fail('cure_condition', 'no_bearer');
      for (const bearer of bearers) removeTrait(ctx.graph, bearer, nodeId);
      return { success: true, op: 'cure_condition' };
    },
  },
};

const AGREEMENT: UndertakingObjectType = {
  id: 'agreement',
  displayName: 'Agreement',
  shape: { edgeType: 'knows_secret_of', edgeDiscriminator: isMarkEdge },
  ownedVia: [],
  tierOf: (graph, handle) => {
    const edge = edgeOf(graph, handle);
    const magnitude = edge ? num(edge.properties, 'magnitude') : null;
    return magnitude === null ? null : bandTier(magnitude, UNDERTAKING_MARK_TIER_MAGNITUDE_BANDS);
  },
  lexicon: 'mark',
  harmOnDestroy: 'network_severed',
  verbs: {
    // Digging up a secret: a mark on the mortal the work was done about (the site).
    create: (ctx) => {
      const subjectId = ctx.targetNodeId ?? nodeIdOf(ctx.handle);
      if (!subjectId || !ctx.graph.getNode(subjectId)) return fail('mint_leverage_mark', 'subject_not_found');
      const secretType = typeof ctx.params?.secretType === 'string' ? ctx.params.secretType : UNDERTAKING_DEFAULT_MARK_SECRET_TYPE;
      const magnitude = typeof ctx.params?.magnitude === 'number' ? ctx.params.magnitude : UNDERTAKING_DEFAULT_MARK_MAGNITUDE;
      return mintLeverageMark(ctx.graph, ctx.actorId, subjectId, secretType, magnitude, ctx.tick);
    },
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
    destroy: (ctx) => {
      const edge = edgeOf(ctx.graph, ctx.handle);
      if (!edge) return fail('expose_mark', 'mark_not_found');
      ctx.graph.updateEdge(edge.id, {
        properties: { ...edge.properties, revealed: true, revealedTick: ctx.tick, revealedTo: ctx.actorId },
      });
      return { success: true, op: 'expose_mark' };
    },
  },
};

const STANDING: UndertakingObjectType = {
  id: 'standing',
  displayName: 'Standing',
  shape: { edgeType: 'reputation_with' },
  ownedVia: [],
  tierOf: (graph, handle) => {
    const edge = edgeOf(graph, handle);
    const score = edge ? num(edge.properties, 'score') : null;
    return score === null ? null : bandTier(Math.abs(score - 0.5), UNDERTAKING_STANDING_TIER_DISTANCE_BANDS);
  },
  lexicon: 'network',
  harmOnDestroy: 'network_severed',
  verbs: {
    // Cultivating one's own standing with a person, a faction or a place.
    'change:raise': (ctx) => {
      const edge = edgeOf(ctx.graph, ctx.handle);
      if (!edge) return fail('raise_standing', 'standing_not_found');
      const r = applyReputationWithDelta(ctx.graph, edge.source, edge.target, UNDERTAKING_STANDING_DELTA, ctx.tick, ctx.projectId ?? 'undertaking');
      return r.applied ? { success: true, op: 'raise_standing' } : fail('raise_standing', r.reason ?? 'refused');
    },
    // Smearing another's standing: the same op, signed — motive-gated.
    'change:lower': (ctx) => {
      const edge = edgeOf(ctx.graph, ctx.handle);
      if (!edge) return fail('lower_standing', 'standing_not_found');
      const r = applyReputationWithDelta(ctx.graph, edge.source, edge.target, -UNDERTAKING_STANDING_DELTA, ctx.tick, ctx.projectId ?? 'undertaking');
      return r.applied ? { success: true, op: 'lower_standing' } : fail('lower_standing', r.reason ?? 'refused');
    },
    // A quarrel: the standing broken and a `hostile_to` edge standing in its place.
    destroy: (ctx) => {
      const edge = edgeOf(ctx.graph, ctx.handle);
      if (!edge) return fail('open_quarrel', 'standing_not_found');
      applyReputationWithDelta(ctx.graph, edge.source, edge.target, UNDERTAKING_QUARREL_STANDING_DELTA, ctx.tick, ctx.projectId ?? 'undertaking');
      return createRelationEdge(ctx.graph, edge.source, edge.target, 'hostile_to', ctx.tick, { cause: 'quarrel', openedBy: ctx.actorId });
    },
  },
};

// ─── Registry ───────────────────────────────────────────────────────

export const UNDERTAKING_OBJECT_TYPES: readonly UndertakingObjectType[] = [
  AREA, LOCATION, PLACE, ROUTE,
  FACTION, COMPANY, ARMY, NETWORK, COMPANION,
  ITEM, POWER, CONDITION, AGREEMENT, STANDING,
];

/** The grievance lane's read: what class of harm destroying an object of each type is. */
export const HARM_ON_DESTROY: Readonly<Record<UndertakingObjectTypeId, UndertakingHarmClass>> = Object.fromEntries(
  UNDERTAKING_OBJECT_TYPES.map(t => [t.id, t.harmOnDestroy]),
) as Record<UndertakingObjectTypeId, UndertakingHarmClass>;

/** @deprecated THR-1392 slice 4 — the verb is `destroy`; kept one release for callers cut before the rename. */
export const HARM_ON_UNDO = HARM_ON_DESTROY;

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
