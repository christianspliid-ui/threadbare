/**
 * Undertaking prose resolution (THR-1392 slice 2) — the one place the four slots
 * `{object}` `{owner}` `{actor}` `{place}` are filled, from the world.
 *
 * Before this the strategic prose path rendered `activityProse[0]` verbatim and
 * `STRATEGIC_PROSE_TOKENS` was empty: no substitution chain existed, so a template
 * could only say what its author knew at authoring time. A cell knows nothing at
 * authoring time — the object is whichever one the actor resolved — so its lines
 * are slots, and this fills them from the object's own name, its holder's name, the
 * actor's name and the place the work stands.
 *
 * Every resolution returns the **concepts** it named (Law 1: a concept carries its
 * chip), so a surface can render the object, the owner and the place as chips rather
 * than bare names. Fail-soft (NFP #4): a slot the world cannot fill renders a
 * neutral word, never a raw `{token}` (Law 43).
 */
import type { WorldGraph } from './graph';
import type {
  UndertakingObjectHandle,
  UndertakingObjectTypeId,
  UndertakingVerbVariant,
  StrategicProjectRuntime,
  StrategicActionCandidate,
} from '../types/strategicAction';
import { getUndertakingObjectType, objectPlaceNodeId, resolveObjectOwners } from '../data/undertaking-objects';
import { cellLineSet, PLANNED_BUILDING_ACTIVITY_LINES, UNDERTAKING_CELL_OUTCOME_PROSE } from '../data/undertaking-verb-prose';
import { getSettlementBuilding } from '../data/settlement-buildings';
import { buildingNoun, IS_BUILDING_PROP } from './settlementEconomy/building';
import { hashSeed } from './naming/workNames';
import { mulberry32 } from '../lib/prng';
import { resolveToParentLocation } from './sublocationShape';

/** A concept a resolved line named — what a surface renders as a chip. */
export interface UndertakingProseConcept {
  readonly role: 'object' | 'owner' | 'actor' | 'place';
  /** A node id, or an edge id for an edge object. */
  readonly id: string;
  readonly name: string;
}

export interface UndertakingProseResult {
  readonly text: string;
  readonly concepts: readonly UndertakingProseConcept[];
}

export interface UndertakingProseContext {
  readonly graph: WorldGraph;
  readonly actorId: string;
  readonly objectTypeId?: UndertakingObjectTypeId;
  readonly handle?: UndertakingObjectHandle;
  /** The place of the work; derived from the handle when absent. */
  readonly targetNodeId?: string;
  /** The holder the gate named; derived from the object when absent. */
  readonly ownerId?: string;
  /**
   * The object's words when the object is not a named node yet (THR-1966): the building a
   * mortal sets about raising ("a storehouse"). Overrides the handle's name.
   */
  readonly objectName?: string;
}

/** Neutral words for a slot the world cannot fill. */
const SLOT_FALLBACK = {
  object: 'the work',
  owner: 'its holder',
  actor: 'someone',
  place: 'the place',
} as const;

function nameOf(graph: WorldGraph, id: string | undefined | null): string | undefined {
  if (!id) return undefined;
  const name = graph.getNode(id)?.name;
  return typeof name === 'string' && name.trim().length > 0 ? name : undefined;
}

/**
 * The object's own name. A node object is its node's name; an edge object (a mark)
 * is described by its two ends — "the hold on Old Maerin".
 */
export function objectDisplayName(
  graph: WorldGraph,
  objectTypeId: UndertakingObjectTypeId | undefined,
  handle: UndertakingObjectHandle | undefined,
): string | undefined {
  if (!handle) return undefined;
  // THR-1660 — a pilgrim way has no name of its own; it is the way to its town, whether
  // the handle is the site (a create) or the `sacred_route` edge itself.
  if (objectTypeId === 'pilgrim_way') {
    const siteId = handle.kind === 'node' ? handle.nodeId : graph.getEdge(handle.edgeId)?.target;
    const site = nameOf(graph, siteId);
    return site ? `the way to ${site}` : undefined;
  }
  if (handle.kind === 'node') return nameOf(graph, handle.nodeId);
  const edge = graph.getEdge(handle.edgeId);
  if (!edge) return undefined;
  const subject = nameOf(graph, edge.target);
  if (objectTypeId === 'agreement') return subject ? `the hold on ${subject}` : 'the hold';
  return subject;
}

/**
 * THR-2031 — an artifact's place is never the artifact. While a relic lies, it is where
 * it lies (`lies_at`); once taken up, the place it was taken from (`takenFrom` on the
 * claimant's `possesses` edge); a borne one stands where its bearer stands. `undefined`
 * for a non-artifact object, so the caller's own resolution runs.
 */
function artifactPlaceId(graph: WorldGraph, ctx: UndertakingProseContext): string | null | undefined {
  const objectId = ctx.handle?.kind === 'node' ? ctx.handle.nodeId : undefined;
  if (!objectId || graph.getNode(objectId)?.type !== 'artifact') return undefined;
  const lies = graph.getOutgoingEdges(objectId, 'lies_at')[0];
  if (lies) return lies.target;
  const held = graph.getIncomingEdges(objectId, 'possesses');
  const takenFrom = held.find(e => e.source === ctx.actorId)?.properties.takenFrom;
  if (typeof takenFrom === 'string') return takenFrom;
  const bearer = held[0]?.source;
  // Left with nothing, the slot takes its neutral word rather than the relic's name.
  return (bearer ? graph.getOutgoingEdges(bearer, 'located_at')[0]?.target : undefined) ?? null;
}

/** The place a work stands, resolved to the place tier for a room (its parent settlement carries the name people use). */
function placeNameOf(graph: WorldGraph, ctx: UndertakingProseContext): { id: string; name: string } | undefined {
  const artifactPlace = artifactPlaceId(graph, ctx);
  const placeId = artifactPlace !== undefined
    ? artifactPlace
    : ctx.targetNodeId ?? (ctx.handle ? objectPlaceNodeId(graph, ctx.handle) : null);
  if (!placeId) return undefined;
  const node = graph.getNode(placeId);
  if (!node) return undefined;
  // A room's place is the settlement it sits in; an actor's place is where they stand.
  const parent = node.type === 'location' ? resolveToParentLocation(graph, node) : undefined;
  const placeNode = parent ?? node;
  const name = nameOf(graph, placeNode.id);
  return name ? { id: placeNode.id, name } : undefined;
}

function ownerOf(graph: WorldGraph, ctx: UndertakingProseContext): { id: string; name: string } | undefined {
  let ownerId = ctx.ownerId;
  if (!ownerId && ctx.handle && ctx.objectTypeId) {
    const type = getUndertakingObjectType(ctx.objectTypeId);
    if (type) ownerId = resolveObjectOwners(graph, type, ctx.handle).find(o => o !== ctx.actorId);
  }
  const name = nameOf(graph, ownerId);
  return ownerId && name ? { id: ownerId, name } : undefined;
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * What a survey produced, in words (THR-1428). Read from the knowledge the actor now
 * holds about the object rather than from a payload carried on the event — the edges
 * *are* the product, so the sentence and the graph cannot disagree (Law 56).
 *
 * Strongest first: a chart is a thing others can follow, a secret is leverage, a lead
 * is a place half-found, familiarity is knowing the way. Empty when the actor holds
 * none of them, which is what "the survey turned up nothing new" reads as.
 */
function learnedClause(graph: WorldGraph, ctx: UndertakingProseContext): string {
  const objectId = ctx.handle?.kind === 'node' ? ctx.handle.nodeId : undefined;
  if (!objectId) return '';
  const objectName = nameOf(graph, objectId) ?? '';

  const chart = graph.getOutgoingEdges(ctx.actorId, 'possesses')
    .map(e => graph.getNode(e.target))
    .find(n => typeof n?.properties.mapsToLocationId === 'string');
  if (chart) {
    const site = nameOf(graph, chart.properties.mapsToLocationId as string);
    return site ? `, and has charted ${site} for anyone who can read a map` : '';
  }

  const secret = graph.getOutgoingEdges(ctx.actorId, 'knows_secret_of')
    .find(e => e.properties?.source === 'undertaking_cultivation' && e.properties?.revealed !== true);
  if (secret) {
    const subject = nameOf(graph, secret.target);
    if (subject) return `, and has learned something about ${subject} that ${subject} would rather keep`;
  }

  const clue = graph.getOutgoingEdges(ctx.actorId, 'knows_clue_of')
    .find(e => e.target === objectId && e.properties?.consumed !== true);
  if (clue) {
    const precision = clue.properties?.precision;
    if (precision === 'located') return objectName ? `, and has found where ${objectName} lies` : '';
    return objectName ? `, and has a lead on what ${objectName} hides` : '';
  }

  const familiar = graph.getOutgoingEdges(ctx.actorId, 'knows_of').some(e => e.target === objectId);
  if (familiar && objectName) return `, and knows the way to ${objectName} now`;

  return '';
}

/**
 * Fill the four slots in `line` from the world. `{Object}`, `{Owner}`, `{Actor}` and
 * `{Place}` are the sentence-initial forms.
 */
export function resolveUndertakingProse(line: string, ctx: UndertakingProseContext): UndertakingProseResult {
  const concepts: UndertakingProseConcept[] = [];
  const graph = ctx.graph;

  const objectName = ctx.objectName ?? objectDisplayName(graph, ctx.objectTypeId, ctx.handle);
  if (objectName && ctx.handle) {
    concepts.push({ role: 'object', id: ctx.handle.kind === 'node' ? ctx.handle.nodeId : ctx.handle.edgeId, name: objectName });
  }
  const owner = ownerOf(graph, ctx);
  if (owner) concepts.push({ role: 'owner', ...owner });
  const actorName = nameOf(graph, ctx.actorId);
  if (actorName) concepts.push({ role: 'actor', id: ctx.actorId, name: actorName });
  const place = placeNameOf(graph, ctx);
  if (place) concepts.push({ role: 'place', ...place });

  const slot = {
    object: objectName ?? SLOT_FALLBACK.object,
    owner: owner?.name ?? SLOT_FALLBACK.owner,
    actor: actorName ?? SLOT_FALLBACK.actor,
    place: place?.name ?? SLOT_FALLBACK.place,
  };

  let text = line
    .replace(/\{Object\}/g, capitalize(slot.object))
    .replace(/\{object\}/g, slot.object)
    .replace(/\{Owner\}/g, capitalize(slot.owner))
    .replace(/\{owner\}/g, slot.owner)
    .replace(/\{Actor\}/g, capitalize(slot.actor))
    .replace(/\{actor\}/g, slot.actor)
    .replace(/\{Place\}/g, capitalize(slot.place))
    .replace(/\{place\}/g, slot.place)
    .replace(/\{learned\}/g, learnedClause(graph, ctx));
  // Law 43: a token nobody resolved never reaches a screen.
  text = text.replace(/\{[A-Za-z_:.-]+\}/g, '').replace(/\s{2,}/g, ' ').replace(/\s+([,.;])/g, '$1').trim();
  return { text, concepts };
}

/** The tokens the strategic prose path resolves — read by the contract's `tokens` block. */
export const UNDERTAKING_PROSE_TOKENS: readonly string[] = ['object', 'owner', 'actor', 'place', 'learned', 'Object', 'Owner', 'Actor', 'Place'];

/**
 * One line from a set, chosen by a stable key (a project id) so the same work reads
 * the same every time (NFP #3) and different works read differently.
 */
export function pickUndertakingLine(lines: readonly string[], seedKey: string): string | undefined {
  if (lines.length === 0) return undefined;
  const rng = mulberry32(hashSeed(seedKey));
  return lines[Math.floor(rng() * lines.length) % lines.length];
}

/** The activity line for a running cell undertaking, resolved. */
export function cellActivityProse(
  graph: WorldGraph,
  project: Pick<StrategicProjectRuntime, 'projectId' | 'actorId' | 'objectHandle' | 'objectTypeId' | 'targetNodeId' | 'victimAgentId' | 'plannedBuildingId'>,
  variant: UndertakingVerbVariant,
): UndertakingProseResult {
  // THR-1966: a building planned at the start is named before it is raised (Law 16).
  const planned = project.plannedBuildingId ? getSettlementBuilding(project.plannedBuildingId) : undefined;
  if (planned) {
    const plannedLine = pickUndertakingLine(PLANNED_BUILDING_ACTIVITY_LINES, project.projectId) ?? '';
    return resolveUndertakingProse(plannedLine, {
      graph, actorId: project.actorId, objectTypeId: project.objectTypeId, handle: project.objectHandle,
      targetNodeId: project.targetNodeId, ownerId: project.victimAgentId, objectName: buildingNoun(planned),
    });
  }
  const line = pickUndertakingLine(cellLineSet(variant, project.objectTypeId).activity, project.projectId) ?? '';
  return resolveUndertakingProse(line, {
    graph, actorId: project.actorId, objectTypeId: project.objectTypeId, handle: project.objectHandle,
    targetNodeId: project.targetNodeId, ownerId: project.victimAgentId,
  });
}

/**
 * What a cell executor reported about its completion (THR-1937): an outcome line key in
 * `UNDERTAKING_CELL_OUTCOME_PROSE`, and the nodes its `{object}` / `{owner}` name when
 * they are not the work's own handle and victim.
 */
export interface CellCompletionOutcome {
  readonly line?: string;
  readonly objectId?: string;
  readonly ownerId?: string;
}

/** The completion line for a finished cell undertaking, resolved. */
export function cellCompletionProse(
  graph: WorldGraph,
  project: Pick<StrategicProjectRuntime, 'projectId' | 'actorId' | 'objectHandle' | 'objectTypeId' | 'targetNodeId' | 'victimAgentId'>,
  variant: UndertakingVerbVariant,
  outcome?: CellCompletionOutcome,
): UndertakingProseResult {
  // THR-1937: an executor that reports an outcome speaks that outcome's line. The slots
  // it names must resolve — a line with a hole drops to the cell's own line (Law 14).
  const outcomeLines = outcome?.line && project.objectTypeId
    ? UNDERTAKING_CELL_OUTCOME_PROSE[`cell.${variant.replace(':', '_')}.${project.objectTypeId}`]?.[outcome.line]
    : undefined;
  if (outcomeLines && outcomeLines.length > 0) {
    const outcomeLine = pickUndertakingLine(outcomeLines, `${project.projectId}:completion`) ?? '';
    const needsObject = /\{object\}/i.test(outcomeLine);
    const needsOwner = /\{owner\}/i.test(outcomeLine);
    const objectOk = !needsObject || !outcome?.objectId || !!graph.getNode(outcome.objectId)?.name;
    const ownerOk = !needsOwner || (!!outcome?.ownerId && !!graph.getNode(outcome.ownerId)?.name);
    if (objectOk && ownerOk) {
      // THR-1966: a building is named as a building ("a storehouse"), not by its Place's label.
      const raised = outcome?.objectId ? graph.getNode(outcome.objectId) : undefined;
      const raisedDef = raised?.properties[IS_BUILDING_PROP] === true
        ? getSettlementBuilding(String(raised.properties.buildingId ?? '')) : undefined;
      return resolveUndertakingProse(outcomeLine, {
        graph, actorId: project.actorId, objectTypeId: project.objectTypeId,
        handle: outcome?.objectId ? { kind: 'node', nodeId: outcome.objectId } : project.objectHandle,
        targetNodeId: project.targetNodeId, ownerId: outcome?.ownerId ?? project.victimAgentId,
        ...(raisedDef && { objectName: buildingNoun(raisedDef) }),
      });
    }
  }
  // THR-1429: a cell may speak with its own voice — `cellLineSet` falls back to the
  // verb's lines for the eleven object types that read the same way.
  const line = pickUndertakingLine(cellLineSet(variant, project.objectTypeId).completion, `${project.projectId}:completion`) ?? '';
  return resolveUndertakingProse(line, {
    graph, actorId: project.actorId, objectTypeId: project.objectTypeId, handle: project.objectHandle,
    targetNodeId: project.targetNodeId, ownerId: project.victimAgentId,
  });
}

/** The activity line for a candidate not yet started (the board's word for it). */
export function cellCandidateProse(graph: WorldGraph, candidate: StrategicActionCandidate, variant: UndertakingVerbVariant): UndertakingProseResult {
  const line = pickUndertakingLine(cellLineSet(variant, candidate.objectTypeId).activity, candidate.candidateId) ?? '';
  return resolveUndertakingProse(line, {
    graph, actorId: candidate.actorId, objectTypeId: candidate.objectTypeId, handle: candidate.objectHandle,
    targetNodeId: candidate.targetNodeId, ownerId: candidate.victimAgentId,
  });
}
