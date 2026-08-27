// src/engine/holdings.ts
//
// Holdings — the single writer of the three-object ownership mirror (THR-1297, slice 3).
//
// A holding is three objects that must agree:
//
//   1. the world object node   — an existing type (location, sublocation, resource,
//                                artifact); this module never mints it
//   2. the `owns` edge         — actor → object, THE AUTHORITY
//   3. the bearer-side face    — an ordinary attachment node (`attachmentCategory:
//                                'holding'`) held via `possesses`, pure bookkeeping
//
// **Mirror doctrine, copied verbatim from the roster precedent** (`groupFormation.ts`
// mirrors `member_of` into `roster`): the edge is the authority, the attachment is a
// face. Where they disagree the edge wins and `reconcileHoldingFaces` mints the missing
// face — never the reverse. Nothing downstream may decide ownership by reading the face.
//
// **Why one module writes all three.** Ownership was already being written by hand in
// two places on the `controls` edge with no flag distinguishing it from faction
// territory (`encounterAftermath`'s spawned unique location, and the conquer /
// establish-network content templates). Two writers with no shared invariant is how the
// `controls` inventory reached 132 occurrences in 72 files with five different property
// shapes and exactly one site that discriminates between them. A single writer is the
// deliverable here; the verbs on top of it are the easy part.
//
// NFP #1 (Tunability): every constant is named below.
// NFP #2 (Inspectability): every verb emits `strategic_world_change` with a
//   `holdingTransfer` payload naming the verb and both parties.
// NFP #3 (Determinism): no PRNG — ids derive from the participants and the tick.
// NFP #4 (Fail-soft): every function returns a result shape, never throws.
// NFP #6 (Additive): `controls` is untouched; this is a new edge beside it.

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import { emitTrace } from './traceBuffer';
import type { StrategicVerb } from '../types/strategicAction';

// ─── Constants ────────────────────────────────────────────────────

/**
 * The `owns` edge's required properties, mirroring its `EDGE_SCHEMA` row.
 *
 * Exported so the schema row and this writer cannot drift apart silently — the
 * holdings test asserts the row's `requiredProperties` equals this tuple.
 */
export const OWNS_EDGE_REQUIRED_PROPS = ['acquiredTick', 'via'] as const;

/**
 * The attachment category the bearer-side face carries.
 * @see AttachmentCategory in src/types/attachments.ts
 */
export const HOLDING_ATTACHMENT_CATEGORY = 'holding';

/**
 * The slot tag holdings group under on the character sheet.
 *
 * **Deliberately absent from `SLOT_CAPS`.** An absent cap reads as uncapped by
 * construction in `getSlotCap`/`resolveSlotTag`, so the "holdings are not capped"
 * exemption costs nothing and cannot be forgotten — there is no row to keep at
 * Infinity. A god's champion may hold a dozen towns; that is the game, not overflow.
 */
export const HOLDING_SLOT_TAG = 'holding';

/**
 * Holdings are never GC'd by the overflow disposal sweep.
 *
 * `phaseDisposalTimeout` retires inactive attachments with `removeEdge`, which does
 * **not** fire the binding hook — so a holding that ever went inactive would lose its
 * face with the edge still standing, and a seize that passed through an inactive window
 * could be swept mid-transfer. `transferHolding` closes the window by being atomic;
 * this closes it by making the face ineligible for the sweep at all. Both belts, stated.
 */
export const HOLDING_LOSS_CONDITION = 'permanent';

// ─── Types ────────────────────────────────────────────────────────

/** How a holding came to be held. Recorded on the edge; drives nothing yet by design. */
export type HoldingVia = 'grant' | 'transfer' | 'conquest' | 'creation' | 'migration';

/** The four verbs, as the trace reports them. */
export type HoldingVerb = 'grant' | 'transfer' | 'release' | 'raze';

export interface HoldingResult {
  success: boolean;
  op: string;
  /** The `owns` edge id, when one stands after the call. */
  edgeId?: string;
  /** The bearer-side attachment node id, when one stands after the call. */
  faceId?: string;
  error?: string;
}

export interface HoldingContext {
  tick: number;
  /** Recorded on the trace so a holding change is attributable to its undertaking. */
  projectId?: string;
  /** Recorded on the trace; defaults to `control` when the caller has no verb. */
  verb?: StrategicVerb;
}

// ─── Internal helpers ─────────────────────────────────────────────

/** Deterministic edge id — participants plus tick, no PRNG (NFP #3). */
function ownsEdgeId(actorId: string, nodeId: string, tick: number): string {
  return `owns_${actorId}_${nodeId}_${tick}`;
}

/** Deterministic face id. */
function holdingFaceId(actorId: string, nodeId: string): string {
  return `holding_face_${actorId}_${nodeId}`;
}

/** The single `owns` edge from `actorId` to `nodeId`, if one stands. */
function findOwnsEdge(graph: WorldGraph, actorId: string, nodeId: string) {
  return graph.getOutgoingEdges(actorId, 'owns').find(e => e.target === nodeId);
}

/** Every `owns` edge pointing at `nodeId`, whoever holds it. */
function findOwnersOf(graph: WorldGraph, nodeId: string) {
  return graph.getIncomingEdges(nodeId, 'owns');
}

/** The bearer-side face `actorId` holds for `nodeId`, if one stands. */
function findFace(graph: WorldGraph, actorId: string, nodeId: string) {
  return graph.getOutgoingEdges(actorId, 'possesses')
    .map(e => ({ edge: e, node: graph.getNode(e.target) }))
    .find(({ node }) =>
      node?.properties?.attachmentCategory === HOLDING_ATTACHMENT_CATEGORY
      && node?.properties?.holdingNodeId === nodeId);
}

/**
 * The player-facing name a face carries.
 *
 * Falls back through the object's own name to its id — never blank, never a raw
 * template id (UI Law 14; the fail-soft row the plan names).
 */
function faceName(objectNode: GraphNode | undefined, nodeId: string): string {
  const name = objectNode?.name;
  return typeof name === 'string' && name.trim().length > 0 ? name : nodeId;
}

/** Mint the bearer-side face. Internal — the edge is written by the caller first. */
function mintFace(
  graph: WorldGraph,
  actorId: string,
  nodeId: string,
  objectNode: GraphNode | undefined,
  ctx: HoldingContext,
): string {
  const id = holdingFaceId(actorId, nodeId);
  const name = faceName(objectNode, nodeId);
  const subtype = (objectNode?.properties?.locationSubtype
    ?? objectNode?.properties?.locationType
    ?? objectNode?.type
    ?? 'holding') as string;

  graph.addNode({
    id,
    type: 'artifact',
    name,
    properties: {
      attachmentCategory: HOLDING_ATTACHMENT_CATEGORY,
      slotTag: HOLDING_SLOT_TAG,
      tier: 1,
      tags: ['#holding'],
      mechanicalSummary: `Holds ${name}.`,
      lossCondition: HOLDING_LOSS_CONDITION,
      // The back-pointer that makes the mirror reconcilable: the face knows which
      // world object it is the face OF, so a drift check is a lookup, not a guess.
      holdingNodeId: nodeId,
      holdingSubtype: subtype,
      acquiredTick: ctx.tick,
    },
  });

  graph.addEdge({
    id: `possesses_${id}`,
    source: actorId,
    target: id,
    type: 'possesses',
    properties: { active: true, acquiredTick: ctx.tick },
  });

  return id;
}

/** Retire a face and the `possesses` edge carrying it. Internal. */
function retireFace(graph: WorldGraph, actorId: string, nodeId: string): void {
  const held = findFace(graph, actorId, nodeId);
  if (!held) return;
  graph.removeEdge(held.edge.id);
  if (held.node) graph.removeNode(held.node.id);
}

function traceHolding(
  ctx: HoldingContext,
  verb: HoldingVerb,
  nodeId: string,
  actorId: string,
  parties: { fromActorId?: string; toActorId?: string },
  graphOps: string[],
): void {
  emitTrace({
    category: 'strategic_world_change',
    tick: ctx.tick,
    summary: `Holding ${verb}: ${nodeId}`,
    actorId,
    projectId: ctx.projectId,
    verb: ctx.verb ?? 'control',
    graphOps,
    catalystSeeded: false,
    affectedNodeIds: [nodeId],
    holdingTransfer: { verb, nodeId, ...parties },
  });
}

// ─── The four verbs ───────────────────────────────────────────────

/**
 * Grant `nodeId` to `actorId` — the thing becomes theirs.
 *
 * Idempotent: granting what the actor already owns reconciles the face and reports
 * success, because the desired end state already holds (NFP #4). Granting something
 * another actor owns is a `transferHolding`, and is refused here rather than silently
 * creating a second owner — two `owns` edges on one object is the ambiguity the
 * `[0]?.source` sites taught us to refuse at the writer.
 */
export function grantHolding(
  graph: WorldGraph,
  actorId: string,
  nodeId: string,
  ctx: HoldingContext,
  via: HoldingVia = 'grant',
): HoldingResult {
  try {
    const actor = graph.getNode(actorId);
    const objectNode = graph.getNode(nodeId);
    if (!actor || !objectNode) {
      return { success: false, op: 'grant_holding', error: 'node_not_found' };
    }

    const existing = findOwnsEdge(graph, actorId, nodeId);
    if (existing) {
      // Already ours. Reconcile the face rather than reporting a failure for a state
      // the caller asked for and already has.
      const faceId = findFace(graph, actorId, nodeId)?.node?.id
        ?? mintFace(graph, actorId, nodeId, objectNode, ctx);
      return { success: true, op: 'grant_holding', edgeId: existing.id, faceId };
    }

    const otherOwners = findOwnersOf(graph, nodeId).filter(e => e.source !== actorId);
    if (otherOwners.length > 0) {
      return {
        success: false,
        op: 'grant_holding',
        error: `already_owned_by_${otherOwners[0].source}`,
      };
    }

    const edgeId = ownsEdgeId(actorId, nodeId, ctx.tick);
    graph.addEdge({
      id: edgeId,
      source: actorId,
      target: nodeId,
      type: 'owns',
      properties: { acquiredTick: ctx.tick, via },
    });
    const faceId = mintFace(graph, actorId, nodeId, objectNode, ctx);

    traceHolding(ctx, 'grant', nodeId, actorId, { toActorId: actorId }, ['add_edge:owns', 'add_node:holding_face']);
    return { success: true, op: 'grant_holding', edgeId, faceId };
  } catch (e) {
    return { success: false, op: 'grant_holding', error: String(e) };
  }
}

/**
 * Seize: `nodeId` passes from its current owner to `toActorId` — **one atomic call**.
 *
 * The whole reason this verb exists as its own function rather than a release
 * followed by a grant: a seize must never show an intermediate state. Between a
 * release and a grant the object is unowned, the loser's face is gone and the winner's
 * is not yet minted — and `phaseDisposalTimeout` runs on ticks, not on our
 * convenience. Anything that reads ownership in that window reads a lie. So the edge
 * is retargeted, the loser's face retired and the winner's minted before this function
 * returns, and the atomicity test asserts exactly that by inspecting the graph only at
 * the boundaries.
 *
 * Seizing something nobody owns is a claim, not a transfer — it grants instead, and
 * says so on the trace (the plan's fail-soft row).
 */
export function transferHolding(
  graph: WorldGraph,
  nodeId: string,
  toActorId: string,
  ctx: HoldingContext,
  via: HoldingVia = 'conquest',
): HoldingResult {
  try {
    const winner = graph.getNode(toActorId);
    const objectNode = graph.getNode(nodeId);
    if (!winner || !objectNode) {
      return { success: false, op: 'transfer_holding', error: 'node_not_found' };
    }

    const owners = findOwnersOf(graph, nodeId);
    if (owners.length === 0) {
      // Seize of the unowned is a claim.
      return grantHolding(graph, toActorId, nodeId, ctx, via);
    }

    const incumbent = owners.find(e => e.source !== toActorId);
    if (!incumbent) {
      // Already ours — reconcile and report success.
      return grantHolding(graph, toActorId, nodeId, ctx, via);
    }

    const fromActorId = incumbent.source;

    // ── The atomic window. No await, no phase boundary, no early return. ──
    //
    // The edge is RETARGETED, not removed and re-added. Remove-then-add leaves an
    // instant where nobody owns the place; add-then-remove leaves an instant where
    // two actors do, and the five `[0]?.source` readers would sample whichever the
    // Set happened to yield first. `retargetEdgeSource` reindexes in one call, so
    // there is no such instant to sample — which is exactly what the atomicity test
    // asserts by observing the graph on every mutation, not just at the endpoints.
    graph.retargetEdgeSource(incumbent.id, toActorId);
    graph.updateEdge(incumbent.id, {
      properties: { acquiredTick: ctx.tick, via, seizedFrom: fromActorId },
    });
    // Faces second, and MINT BEFORE RETIRE. Ownership is already true and answerable
    // by this point, so the only question left is whether the holding is ever
    // faceless — and retire-then-mint would make it so for an instant. Minting first
    // means the worst observable state is two faces (the loser's, stale, and the
    // winner's, correct) with the authoritative edge already naming the winner, so a
    // reconcile at any instant resolves it the right way. Retire-then-mint would
    // instead show a moment with no face at all, which a disposal sweep or a sheet
    // render could catch.
    const faceId = mintFace(graph, toActorId, nodeId, objectNode, ctx);
    retireFace(graph, fromActorId, nodeId);
    // ── End atomic window. ──

    traceHolding(ctx, 'transfer', nodeId, toActorId, { fromActorId, toActorId },
      ['retarget_edge:owns', 'add_node:holding_face', 'remove_node:holding_face']);
    return { success: true, op: 'transfer_holding', edgeId: incumbent.id, faceId };
  } catch (e) {
    return { success: false, op: 'transfer_holding', error: String(e) };
  }
}

/**
 * Release `nodeId` — the actor gives it up; the object survives, unowned.
 *
 * Fail-soft: releasing what is not held succeeds, since the desired end state — this
 * actor owns no such thing — already holds (the `releaseControl` precedent).
 */
export function releaseHolding(
  graph: WorldGraph,
  actorId: string,
  nodeId: string,
  ctx: HoldingContext,
): HoldingResult {
  try {
    const existing = findOwnsEdge(graph, actorId, nodeId);
    if (!existing) {
      return { success: true, op: 'release_holding' };
    }

    graph.removeEdge(existing.id);
    retireFace(graph, actorId, nodeId);

    traceHolding(ctx, 'release', nodeId, actorId, { fromActorId: actorId },
      ['remove_edge:owns', 'remove_node:holding_face']);
    return { success: true, op: 'release_holding', edgeId: existing.id };
  } catch (e) {
    return { success: false, op: 'release_holding', error: String(e) };
  }
}

/**
 * Raze `nodeId` — the thing is destroyed, so **every** owner's claim and face die
 * with it.
 *
 * Note this retires the ownership records, not the world object: whether a razed
 * settlement is removed, ruined or repopulated is the caller's business (battle
 * aftermath's, usually). What must not survive is a holding face pointing at
 * something that is gone — the shape that makes a character sheet claim a town its
 * bearer cannot visit.
 */
export function razeHolding(
  graph: WorldGraph,
  nodeId: string,
  ctx: HoldingContext,
): HoldingResult {
  try {
    const owners = findOwnersOf(graph, nodeId);
    if (owners.length === 0) {
      return { success: true, op: 'raze_holding' };
    }

    // A name outlives the work that carried it (THR-1291 §3). Retiring it into the
    // site's `nameEchoes` is what lets the resolver later answer "The Second
    // Saltway" — a razed work leaves a name behind for whatever is built on its
    // ground. Recorded before the faces are retired, because after them nothing in
    // the graph remembers what this was called.
    retireNameEcho(graph, nodeId, ctx.tick);

    for (const edge of owners) {
      const ownerId = edge.source;
      graph.removeEdge(edge.id);
      retireFace(graph, ownerId, nodeId);
      traceHolding(ctx, 'raze', nodeId, ownerId, { fromActorId: ownerId },
        ['remove_edge:owns', 'remove_node:holding_face']);
    }

    return { success: true, op: 'raze_holding' };
  } catch (e) {
    return { success: false, op: 'raze_holding', error: String(e) };
  }
}

/**
 * Retire a razed work's name into its site's `nameEchoes` (THR-1291 §3).
 *
 * Additive: an array property on a node that already exists, so no reader that does
 * not know about echoes is affected. Internal and fail-soft — a name that cannot be
 * retired is a lost flourish, never a failed raze.
 */
function retireNameEcho(graph: WorldGraph, nodeId: string, tick: number): void {
  try {
    const node = graph.getNode(nodeId);
    const name = node?.name;
    if (typeof name !== 'string' || name.trim().length === 0) return;
    const existing = Array.isArray(node?.properties?.nameEchoes)
      ? node.properties.nameEchoes as unknown[]
      : [];
    graph.updateNode(nodeId, {
      properties: { nameEchoes: [...existing, { name, retiredTick: tick }] },
    });
  } catch {
    // Fail-soft (NFP #4).
  }
}

/**
 * Re-read every holding face pointing at `nodeId` and update its player-facing name
 * from the world object.
 *
 * **Why this exists (slice 3's own note, made good here).** A face is minted at
 * grant time from the object's name *then* — but an undertaking grants its holding
 * during the mutation and christens the work immediately after, so the face reliably
 * captured the pre-christening name and the character sheet showed "Warehouse" for a
 * thing the world calls "The Saltway Hold". The edge stays authoritative; this is
 * bookkeeping catching up, which is exactly what a face is for.
 */
export function refreshHoldingFaceNames(graph: WorldGraph, nodeId: string): string[] {
  const updated: string[] = [];
  try {
    const objectNode = graph.getNode(nodeId);
    const name = faceName(objectNode, nodeId);
    for (const edge of findOwnersOf(graph, nodeId)) {
      const held = findFace(graph, edge.source, nodeId);
      if (!held?.node || held.node.name === name) continue;
      graph.updateNode(held.node.id, {
        name,
        properties: { mechanicalSummary: `Holds ${name}.` },
      });
      updated.push(held.node.id);
    }
  } catch {
    // Fail-soft (NFP #4): a stale face name is cosmetic drift, never a tick failure.
  }
  return updated;
}

// ─── Reads + reconcile ────────────────────────────────────────────

/**
 * Does `actorId` own `nodeId`? **Read the edge, never the face.**
 *
 * Every ownership question downstream — home-ground scoring, the
 * `agent_controls_location` condition, the counter-check tuples — routes here or
 * through `getOwnedBy`/`getOwners` in `graphQueries`. A caller that walks
 * `possesses` looking for a holding face is reading the bookkeeping, and will be
 * wrong for exactly as long as a drift lasts.
 */
export function ownsNode(graph: WorldGraph, actorId: string, nodeId: string): boolean {
  return findOwnsEdge(graph, actorId, nodeId) !== undefined;
}

/**
 * Repair mirror drift: mint a face for every `owns` edge that has none, retire every
 * face whose edge is gone, and re-read the name of every face that has one.
 *
 * The edge is the authority in all three directions. Returns what it changed so a
 * caller can trace it; safe to run repeatedly (it is a fixpoint after one pass).
 */
export function reconcileHoldingFaces(
  graph: WorldGraph,
  actorId: string,
  ctx: HoldingContext,
): { facesMinted: string[]; facesRetired: string[]; facesRenamed: string[] } {
  const facesMinted: string[] = [];
  const facesRetired: string[] = [];
  const facesRenamed: string[] = [];

  try {
    const owned = graph.getOutgoingEdges(actorId, 'owns');
    for (const edge of owned) {
      if (findFace(graph, actorId, edge.target)) {
        // A face that exists but carries a stale name is drift too — the same class
        // as a missing one, and the shape christening produces (THR-1297 §5). The
        // edge is authority in this direction as in every other.
        facesRenamed.push(...refreshHoldingFaceNames(graph, edge.target));
        continue;
      }
      facesMinted.push(mintFace(graph, actorId, edge.target, graph.getNode(edge.target), ctx));
    }

    const ownedIds = new Set(owned.map(e => e.target));
    for (const held of graph.getOutgoingEdges(actorId, 'possesses')) {
      const node = graph.getNode(held.target);
      if (node?.properties?.attachmentCategory !== HOLDING_ATTACHMENT_CATEGORY) continue;
      const backRef = node.properties.holdingNodeId as string | undefined;
      if (backRef && ownedIds.has(backRef)) continue;
      facesRetired.push(node.id);
      graph.removeEdge(held.id);
      graph.removeNode(node.id);
    }
  } catch {
    // Fail-soft (NFP #4): a reconcile that cannot finish leaves the graph as it
    // found it and reports what it managed. Never throws into a tick phase.
  }

  return { facesMinted, facesRetired, facesRenamed };
}
