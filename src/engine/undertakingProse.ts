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
import { UNDERTAKING_VERB_PROSE } from '../data/undertaking-verb-prose';
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
  if (handle.kind === 'node') return nameOf(graph, handle.nodeId);
  const edge = graph.getEdge(handle.edgeId);
  if (!edge) return undefined;
  const subject = nameOf(graph, edge.target);
  if (objectTypeId === 'mark') return subject ? `the hold on ${subject}` : 'the hold';
  return subject;
}

/** The place a work stands, resolved to the place tier for a room (its parent settlement carries the name people use). */
function placeNameOf(graph: WorldGraph, ctx: UndertakingProseContext): { id: string; name: string } | undefined {
  const placeId = ctx.targetNodeId ?? (ctx.handle ? objectPlaceNodeId(graph, ctx.handle) : null);
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
 * Fill the four slots in `line` from the world. `{Object}`, `{Owner}`, `{Actor}` and
 * `{Place}` are the sentence-initial forms.
 */
export function resolveUndertakingProse(line: string, ctx: UndertakingProseContext): UndertakingProseResult {
  const concepts: UndertakingProseConcept[] = [];
  const graph = ctx.graph;

  const objectName = objectDisplayName(graph, ctx.objectTypeId, ctx.handle);
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
    .replace(/\{place\}/g, slot.place);
  // Law 43: a token nobody resolved never reaches a screen.
  text = text.replace(/\{[A-Za-z_:.-]+\}/g, '').replace(/\s{2,}/g, ' ').replace(/\s+([,.;])/g, '$1').trim();
  return { text, concepts };
}

/** The four tokens the strategic prose path resolves — read by the contract's `tokens` block. */
export const UNDERTAKING_PROSE_TOKENS: readonly string[] = ['object', 'owner', 'actor', 'place', 'Object', 'Owner', 'Actor', 'Place'];

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
  project: Pick<StrategicProjectRuntime, 'projectId' | 'actorId' | 'objectHandle' | 'objectTypeId' | 'targetNodeId' | 'victimAgentId'>,
  variant: UndertakingVerbVariant,
): UndertakingProseResult {
  const line = pickUndertakingLine(UNDERTAKING_VERB_PROSE[variant].activity, project.projectId) ?? '';
  return resolveUndertakingProse(line, {
    graph, actorId: project.actorId, objectTypeId: project.objectTypeId, handle: project.objectHandle,
    targetNodeId: project.targetNodeId, ownerId: project.victimAgentId,
  });
}

/** The completion line for a finished cell undertaking, resolved. */
export function cellCompletionProse(
  graph: WorldGraph,
  project: Pick<StrategicProjectRuntime, 'projectId' | 'actorId' | 'objectHandle' | 'objectTypeId' | 'targetNodeId' | 'victimAgentId'>,
  variant: UndertakingVerbVariant,
): UndertakingProseResult {
  const line = pickUndertakingLine(UNDERTAKING_VERB_PROSE[variant].completion, `${project.projectId}:completion`) ?? '';
  return resolveUndertakingProse(line, {
    graph, actorId: project.actorId, objectTypeId: project.objectTypeId, handle: project.objectHandle,
    targetNodeId: project.targetNodeId, ownerId: project.victimAgentId,
  });
}

/** The activity line for a candidate not yet started (the board's word for it). */
export function cellCandidateProse(graph: WorldGraph, candidate: StrategicActionCandidate, variant: UndertakingVerbVariant): UndertakingProseResult {
  const line = pickUndertakingLine(UNDERTAKING_VERB_PROSE[variant].activity, candidate.candidateId) ?? '';
  return resolveUndertakingProse(line, {
    graph, actorId: candidate.actorId, objectTypeId: candidate.objectTypeId, handle: candidate.objectHandle,
    targetNodeId: candidate.targetNodeId, ownerId: candidate.victimAgentId,
  });
}
