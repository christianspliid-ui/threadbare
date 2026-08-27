/**
 * THE BINDER — one scored board decides who fills a cast slot (THR-1296 §2).
 *
 * ## The ruling this implements
 *
 * Find / modify / mint is a **scored decision, not a rule chain** (THR-1290, ratified
 * 2026-08-26). Today's support bundle asks "is there an innkeeper here? no? make one" —
 * a first-match scan whose answer never depends on whether reusing that innkeeper would
 * make a better scene. Under the binder, reuse, modify, and mint compete as rows on one
 * board, and the weights decide. Retuning the mix is constant work (NFP #1).
 *
 * ```
 * bindScore = W_CAST_ROLE_FIT × castRoleFit
 *           + W_SCARCITY      × scarcityTerm
 *           + W_STORY_TIES    × storyTies
 *           + W_DISTANCE      × distanceTerm
 *           + W_IDENTITY      × identityTerm
 * ```
 *
 * ## Read/write split
 *
 * This module is **pure with respect to the graph** — it reads, never writes, and
 * returns intents the caller applies. That mirrors `resolveUndertakingCheckpoint`'s
 * decide/apply split, and it is what lets the bind pass live in the lifecycle while
 * the checkpoint module stays graph-read-only.
 *
 * ## Two things worth knowing before reading the terms
 *
 * **Blank identity is the dominant case, by design.** `axiologicalProfile` is a
 * protagonist-only signal today — worldgen ambients and support mints both lack it —
 * so most candidates score blank on identity and become modify territory. That is the
 * verdict's intent ("the story reveals the blank"), recorded here so nobody meets it
 * in a run and files it as a bug.
 *
 * **Modify is additive-only** — NFP #6 applied to people. A modify row may fill a
 * blank; it may never overwrite a value someone already has. A candidate whose stated
 * identity *contradicts* the slot is vetoed outright rather than rewritten: the greedy
 * mage does not get quietly reforged into the generous one.
 */
import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { ValuePair, AxiologicalProfile } from '../../types/agent';
import type { BindingDecisionRow } from '../../types/trace';
import { isAgentGone } from '../groups/groupQueries';
import { getAgentBonds, getFactionMembershipEdges } from '../graphQueries';
import { resolveLocationToHex } from '../encounterAwareness';
import { hexDistance } from '../../lib/hexMath';
import { signedToCanonical01 } from '../../types/axisRegistry';
import { emitTrace } from '../traceBuffer';
import { scarcity01, type RoleCensus } from './roleCensus';
import {
  BINDER_WEIGHT_CAST_ROLE_FIT,
  BINDER_WEIGHT_SCARCITY,
  BINDER_WEIGHT_STORY_TIES,
  BINDER_WEIGHT_DISTANCE,
  BINDER_WEIGHT_IDENTITY,
  BINDER_MINT_BASE,
  BINDER_MODIFY_PENALTY,
  BINDER_ROLELESS_ROLE_FIT,
  BINDER_CARRY_FORWARD_BONUS,
  BINDER_DISTANCE_HORIZON_HEXES,
  BINDER_MAX_CANDIDATE_ROWS,
} from '../../data/binder-constants';

// ─── Request / decision shapes ──────────────────────────────────────

/**
 * What a cast slot asks for.
 *
 * `identityRequirement` is the schema seam doc 2 (THR-1297) authors values into; this
 * plan defines its shape and ships the engine that honors it, deliberately with no
 * authored rows of its own.
 */
export interface BindingIdentityRequirement {
  readonly axis: ValuePair;
  readonly pole: 'virtue' | 'vice';
  /** Distance from neutral (0.5 canonical) the candidate must clear, 0–0.5. */
  readonly minStrength: number;
}

export interface BindingRequest {
  readonly projectId: string;
  readonly castKey: string;
  readonly stepIndex: number;
  /** The undertaking's actor — the far end of every story tie. */
  readonly actorId: string;
  /** Roles that satisfy this slot. Empty means any role fits. */
  readonly acceptedRoles?: readonly string[];
  /** The role a mint would be born into. */
  readonly mintRole: string;
  /** Where the scene plays — the stage node this step resolved to. */
  readonly stageNodeId?: string;
  readonly identityRequirement?: BindingIdentityRequirement;
  /** Node ids bound to this undertaking at an earlier step — continuity beats novelty. */
  readonly carryForward?: ReadonlySet<string>;
}

/** An additive change a `modify` decision asks the caller to apply. */
export type BindingModification =
  | { readonly kind: 'set_npc_role'; readonly role: string }
  | { readonly kind: 'set_identity_axis'; readonly axis: ValuePair; readonly signedValue: number };

export type BindingDecision =
  | { readonly mode: 'reuse'; readonly nodeId: string; readonly score: number }
  | {
      readonly mode: 'modify';
      readonly nodeId: string;
      readonly score: number;
      readonly modifications: readonly BindingModification[];
    }
  | { readonly mode: 'mint'; readonly role: string; readonly score: number }
  | {
      readonly mode: 'refused';
      readonly reason: 'no_candidates' | 'all_vetoed' | 'mint_queue_full' | 'binder_error';
    };

export interface BinderContext {
  readonly graph: WorldGraph;
  readonly census: RoleCensus | null;
  readonly tick: number;
  /**
   * Whether the mint row may be offered at all. False when the queue is full — the
   * caller owns the queue, so it owns this bit rather than the binder reaching for it.
   */
  readonly mintAvailable?: boolean;
}

/** A scored row before the winner is picked. `null` nodeId marks the mint row. */
interface ScoredRow extends BindingDecisionRow {
  readonly candidate: GraphNode | null;
  readonly modifications: readonly BindingModification[];
}

// ─── Candidate enumeration ──────────────────────────────────────────

/**
 * Bounded, never O(all actors).
 *
 * Locality comes from edges (O(local degree)): actors at the stage, at its parent
 * location, and at sibling sublocations under that parent. Reach beyond the immediate
 * stage comes from the census, filtered by the distance horizon — which is the whole
 * reason the census exists. `getNodesByType('agent')` is never called here.
 */
function enumerateCandidates(ctx: BinderContext, request: BindingRequest): GraphNode[] {
  const { graph } = ctx;
  const seen = new Set<string>();
  const out: GraphNode[] = [];

  const add = (node: GraphNode | undefined): void => {
    if (!node || seen.has(node.id)) return;
    // People are `type: 'actor'` + `actorType: 'individual'`; `'agent'` is not a
    // `NodeType` at all. Filtering on the wrong literal here would silently enumerate
    // nothing and make every slot mint — a degenerate board that looks like a tuning
    // problem rather than a typo.
    if (node.type !== 'actor' || node.properties?.actorType !== 'individual') return;
    // The undertaking's own actor is not castable as their own supporting cast.
    if (node.id === request.actorId) return;
    if (isAgentGone(node)) return;
    seen.add(node.id);
    out.push(node);
  };

  const addOccupants = (placeId: string): void => {
    for (const edge of graph.getIncomingEdges(placeId, 'located_at')) {
      add(graph.getNode(edge.source));
    }
  };

  const stageId = request.stageNodeId;
  const stageHex = stageId ? resolveLocationToHex(graph, stageId) : null;

  if (stageId) {
    addOccupants(stageId);

    // The place tier above, and its other sublocations — a stage's neighbours are
    // part of its scene. `parentLocationId` is the sublocation discriminator
    // (THR-1183); a place-tier stage simply has none and this is skipped.
    const parentId = graph.getNode(stageId)?.properties?.parentLocationId as string | undefined;
    if (parentId) {
      addOccupants(parentId);
      for (const edge of graph.getOutgoingEdges(parentId, 'contains')) {
        if (edge.target !== stageId) addOccupants(edge.target);
      }
    }
  }

  // Census reach: everyone holding an accepted role, filtered to the horizon.
  if (ctx.census) {
    const roles = request.acceptedRoles?.length
      ? request.acceptedRoles
      : [request.mintRole];
    for (const role of roles) {
      const holders = ctx.census.get(role);
      if (!holders) continue;
      for (const nodeId of holders) {
        if (seen.has(nodeId)) continue;
        const node = graph.getNode(nodeId);
        if (!node) continue;
        // Horizon filter. With no stage hex there is no horizon to filter against,
        // so the census contributes nothing rather than contributing the world.
        if (!stageHex) continue;
        const hex = candidateHex(graph, node);
        if (!hex || hexDistance(hex, stageHex) > BINDER_DISTANCE_HORIZON_HEXES) continue;
        add(node);
      }
    }
  }

  return out;
}

/** Where a candidate stands, resolved through the recursive resolver (never hand-rolled). */
function candidateHex(
  graph: WorldGraph,
  node: GraphNode,
): { col: number; row: number } | null {
  const locatedAt = graph.getOutgoingEdges(node.id, 'located_at')[0];
  if (locatedAt) {
    const hex = resolveLocationToHex(graph, locatedAt.target);
    if (hex) return hex;
  }
  // Denormalized fallback — the field `buildHexActorIndex` reads.
  const locationId = node.properties?.locationId as string | undefined;
  return locationId ? resolveLocationToHex(graph, locationId) : null;
}

// ─── The five terms ─────────────────────────────────────────────────

/**
 * Role match, 0–1. `-1` is the exclusion signal (wrong role entirely).
 *
 * Roleless scores mid-band rather than zero on purpose: born-later agents carry no
 * `npcRole` at all, which makes them permanently invisible to today's reuse scan.
 * Treating them as modify territory brings that whole population into the pool.
 */
function computeCastRoleFit(node: GraphNode, request: BindingRequest): number {
  const role = node.properties?.npcRole as string | undefined;
  const accepted = request.acceptedRoles?.length ? request.acceptedRoles : [request.mintRole];
  if (!role) return BINDER_ROLELESS_ROLE_FIT;
  if (accepted.includes(role)) return 1;
  const supportRole = node.properties?.encounterSupportRole as string | undefined;
  if (supportRole && accepted.includes(supportRole)) return 1;
  return -1;
}

/**
 * Existing reasons for these two to share a scene, 0–1.
 *
 * Bounded O(deg) reads from the undertaking's actor. Every contribution is a *reason
 * for a scene*, which is why a secret and a debt count as much as affection: hostility
 * is a story tie. Magnitude, not sign.
 */
function computeStoryTies(graph: WorldGraph, actorId: string, candidateId: string): number {
  let ties = 0;

  for (const bond of getAgentBonds(graph, actorId)) {
    if (bond.agent.id !== candidateId) continue;
    ties += Math.min(1, Math.abs(bond.sentiment)) * 0.4;
    ties += Math.min(1, Math.abs(bond.trust)) * 0.2;
    break;
  }

  // Mentorship is the only relationship type with a historical tail — graduated and
  // estranged edges persist, and both are excellent reasons for a scene.
  for (const type of ['mentors'] as const) {
    for (const edge of graph.getOutgoingEdges(actorId, type)) {
      if (edge.target === candidateId) { ties += 0.3; break; }
    }
    for (const edge of graph.getIncomingEdges(actorId, type)) {
      if (edge.source === candidateId) { ties += 0.3; break; }
    }
  }

  // A secret or a debt is leverage, and leverage is plot.
  for (const type of ['knows_secret_of', 'owes_favor'] as const) {
    for (const edge of graph.getOutgoingEdges(actorId, type)) {
      if (edge.target === candidateId) { ties += 0.25; break; }
    }
    for (const edge of graph.getIncomingEdges(actorId, type)) {
      if (edge.source === candidateId) { ties += 0.25; break; }
    }
  }

  // Faction co-membership — read through the helper, NEVER raw `member_of`, which
  // carries a four-way overload (THR-1288).
  const actorFactions = new Set(getFactionMembershipEdges(graph, actorId).map(e => e.target));
  if (actorFactions.size > 0) {
    for (const edge of getFactionMembershipEdges(graph, candidateId)) {
      if (actorFactions.has(edge.target)) { ties += 0.2; break; }
    }
  }

  return Math.min(1, ties);
}

/** Nearness to the stage, 0–1. Neutral when either end has no resolvable hex. */
function computeDistanceTerm(
  graph: WorldGraph,
  node: GraphNode,
  stageHex: { col: number; row: number } | null,
): number {
  if (!stageHex) return 0.5;
  const hex = candidateHex(graph, node);
  if (!hex) return 0.5;
  return 1 - Math.min(1, hexDistance(hex, stageHex) / BINDER_DISTANCE_HORIZON_HEXES);
}

type IdentityVerdict =
  | { readonly kind: 'match'; readonly term: number }
  | { readonly kind: 'blank' }
  | { readonly kind: 'contradiction' };

/**
 * The identity three-way (THR-1290): match, blank, or contradiction.
 *
 * Read through `signedToCanonical01` only — storage is signed ±1, the canonical scale
 * is 0–1 with 0.5 neutral, and open-coding the bridge is the documented pole-inversion
 * trap. Blank is not a soft contradiction: it is the *absence* of a stated value, and
 * the modify path's whole territory.
 */
function judgeIdentity(node: GraphNode, req: BindingIdentityRequirement | undefined): IdentityVerdict {
  if (!req) return { kind: 'match', term: 1 };

  const profile = node.properties?.axiologicalProfile as AxiologicalProfile | undefined;
  const signed = profile?.[req.axis];
  if (profile === undefined || signed === undefined) return { kind: 'blank' };

  const canonical = signedToCanonical01(signed);
  const strength = canonical - 0.5; // + toward virtue, − toward vice
  const wanted = req.pole === 'virtue' ? strength : -strength;

  if (wanted >= req.minStrength) {
    // How far past the bar, normalized against the half-scale that remains.
    const headroom = 0.5 - req.minStrength;
    const over = headroom > 0 ? (wanted - req.minStrength) / headroom : 1;
    return { kind: 'match', term: Math.min(1, 0.7 + 0.3 * over) };
  }

  // Stated, and pointing the other way past neutral — not merely weak.
  if (wanted < 0) return { kind: 'contradiction' };

  // Stated, right side of neutral, but short of the bar. Not a contradiction, and not
  // a blank either — nothing to fill, so it simply scores what it is worth.
  return { kind: 'match', term: 0.7 * (wanted / Math.max(req.minStrength, 1e-6)) };
}

// ─── The board ──────────────────────────────────────────────────────

function weighted(
  castRoleFit: number,
  scarcity: number,
  storyTies: number,
  distance: number,
  identity: number,
): number {
  return (
    BINDER_WEIGHT_CAST_ROLE_FIT * castRoleFit +
    BINDER_WEIGHT_SCARCITY * scarcity +
    BINDER_WEIGHT_STORY_TIES * storyTies +
    BINDER_WEIGHT_DISTANCE * distance +
    BINDER_WEIGHT_IDENTITY * identity
  );
}

/**
 * Score every row for one cast slot and pick a winner.
 *
 * Scarcity pulls in opposite directions on the two row kinds, which is the term's
 * entire point: a **reuse** row earns `scarcity01` (the world's one archmage trends
 * toward reuse — converging arcs are worldbuilding), while the **mint** row earns
 * `1 − scarcity01` (a commodity sailor trends toward a fresh face — shared commodity
 * cast reads as false coincidence). Weights, never rules: story ties can override
 * either direction, exactly as ruled.
 *
 * Deterministic: zero rng draws; ties break on candidate-id sort.
 */
export function scoreBindingBoard(
  ctx: BinderContext,
  request: BindingRequest,
): { rows: ScoredRow[]; rowsConsidered: number } {
  const { graph } = ctx;
  const stageHex = request.stageNodeId ? resolveLocationToHex(graph, request.stageNodeId) : null;
  const rows: ScoredRow[] = [];

  const candidates = enumerateCandidates(ctx, request);
  // Sort first, so the tie-break is a property of the board rather than of whatever
  // order the edge indices happened to yield (NFP #3).
  candidates.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  for (const node of candidates) {
    const castRoleFit = computeCastRoleFit(node, request);
    if (castRoleFit < 0) continue; // wrong role — excluded before scoring

    const role = node.properties?.npcRole as string | undefined;
    const scarcity = scarcity01(ctx.census, role ?? request.mintRole);
    const storyTies = computeStoryTies(graph, request.actorId, node.id);
    const distance = computeDistanceTerm(graph, node, stageHex);
    const identity = judgeIdentity(node, request.identityRequirement);
    const carry = request.carryForward?.has(node.id) ? BINDER_CARRY_FORWARD_BONUS : 0;

    if (identity.kind === 'contradiction') {
      // BOTH rows excluded — the as-is row because it is wrong, the modified row
      // because modify is additive-only and may not overwrite a stated value. Mint
      // wins by absence, which is the "greedy mage does not reuse the generous one"
      // ruling expressed as an exclusion rather than a penalty.
      rows.push({
        nodeId: node.id, modified: false, score: -Infinity,
        castRoleFit, scarcity, storyTies, distance, identity: 0,
        vetoed: 'identity_contradiction', candidate: node, modifications: [],
      });
      continue;
    }

    const identityTerm = identity.kind === 'match' ? identity.term : 0;

    // Row A — as-is.
    rows.push({
      nodeId: node.id, modified: false,
      score: weighted(castRoleFit, scarcity, storyTies, distance, identityTerm) + carry,
      castRoleFit, scarcity, storyTies, distance, identity: identityTerm,
      candidate: node, modifications: [],
    });

    // Row B — modified. Only offered when there is genuinely something blank to fill;
    // a row that changes nothing has no business paying the modify penalty.
    const modifications: BindingModification[] = [];
    let modifiedRoleFit = castRoleFit;
    let modifiedIdentity = identityTerm;

    if (!role) {
      modifications.push({ kind: 'set_npc_role', role: request.mintRole });
      modifiedRoleFit = 1;
    }
    if (identity.kind === 'blank' && request.identityRequirement) {
      const req = request.identityRequirement;
      const signed = req.pole === 'virtue' ? 1 : -1;
      modifications.push({ kind: 'set_identity_axis', axis: req.axis, signedValue: signed });
      modifiedIdentity = 1;
    }

    if (modifications.length > 0) {
      rows.push({
        nodeId: node.id, modified: true,
        score:
          weighted(modifiedRoleFit, scarcity, storyTies, distance, modifiedIdentity) +
          carry - BINDER_MODIFY_PENALTY,
        castRoleFit: modifiedRoleFit, scarcity, storyTies, distance, identity: modifiedIdentity,
        candidate: node, modifications,
      });
    }
  }

  // Exactly one mint row, so reuse, modify and mint genuinely compete on one board.
  if (ctx.mintAvailable !== false) {
    const mintScarcity = 1 - scarcity01(ctx.census, request.mintRole);
    rows.push({
      nodeId: 'mint', modified: false,
      // A mint is born to fit — perfect role, born to the identity requirement — and
      // born at the stage. So it takes full distance credit, zero story ties (the one
      // thing it genuinely cannot have, and what lets an existing face with real
      // history beat it), and `BINDER_MINT_BASE` for the fit itself.
      //
      // The base is deliberately NOT `W_CAST_ROLE_FIT + W_IDENTITY` (0.45): a
      // made-to-order stranger is a *decent* scene, not automatically the best one,
      // and 0.35 is the dial that says how decent. Scoring the mint at full weight on
      // every axis it trivially satisfies is what makes a board degenerate — it wins
      // everywhere and the world stops reusing anybody, which is the failure the
      // plan's kill criteria name.
      score:
        BINDER_MINT_BASE +
        BINDER_WEIGHT_SCARCITY * mintScarcity +
        BINDER_WEIGHT_DISTANCE,
      castRoleFit: 1, scarcity: mintScarcity, storyTies: 0, distance: 1, identity: 1,
      candidate: null, modifications: [],
    });
  }

  const rowsConsidered = rows.length;
  rows.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.nodeId < b.nodeId ? -1 : a.nodeId > b.nodeId ? 1 : 0;
  });

  return { rows, rowsConsidered };
}

/**
 * Decide who fills one cast slot, and say so out loud.
 *
 * Emits `binding_decision` on **every** path including refusals — a slot that bound
 * nothing is exactly the case a reader needs, because "why is this moment generic?"
 * is the question this whole system exists to make answerable.
 *
 * Fail-soft (NFP #4): a throw anywhere inside degrades to a traced refusal, never an
 * exception into the tick loop and never the empty-catch silence.
 */
export function resolveBinding(
  request: BindingRequest,
  ctx: BinderContext,
): BindingDecision {
  let rows: ScoredRow[] = [];
  let rowsConsidered = 0;

  try {
    const board = scoreBindingBoard(ctx, request);
    rows = board.rows;
    rowsConsidered = board.rowsConsidered;
  } catch {
    emitDecisionTrace(ctx, request, 'refused', rows, rowsConsidered, undefined, 'binder_error');
    return { mode: 'refused', reason: 'binder_error' };
  }

  const winner = rows.find(r => r.score > -Infinity);

  if (!winner) {
    const reason = rows.length > 0 ? 'all_vetoed' : 'no_candidates';
    emitDecisionTrace(ctx, request, 'refused', rows, rowsConsidered, undefined, reason);
    return { mode: 'refused', reason };
  }

  if (winner.candidate === null) {
    emitDecisionTrace(ctx, request, 'mint', rows, rowsConsidered, 'mint');
    return { mode: 'mint', role: request.mintRole, score: winner.score };
  }

  if (winner.modified) {
    emitDecisionTrace(ctx, request, 'modify', rows, rowsConsidered, winner.nodeId);
    return {
      mode: 'modify',
      nodeId: winner.nodeId,
      score: winner.score,
      modifications: winner.modifications,
    };
  }

  emitDecisionTrace(ctx, request, 'reuse', rows, rowsConsidered, winner.nodeId);
  return { mode: 'reuse', nodeId: winner.nodeId, score: winner.score };
}

function emitDecisionTrace(
  ctx: BinderContext,
  request: BindingRequest,
  mode: 'reuse' | 'modify' | 'mint' | 'deferred_awaiting_mint' | 'refused',
  rows: readonly ScoredRow[],
  rowsConsidered: number,
  winnerNodeId?: string,
  refusedReason?: 'no_candidates' | 'all_vetoed' | 'mint_queue_full' | 'binder_error',
): void {
  emitTrace({
    category: 'binding_decision',
    tick: ctx.tick,
    agentId: request.actorId,
    projectId: request.projectId,
    castKey: request.castKey,
    stepIndex: request.stepIndex,
    mode,
    winnerNodeId,
    refusedReason,
    // Strip the runtime-only fields; the trace is a debugging aid, not the ledger.
    rows: rows.slice(0, BINDER_MAX_CANDIDATE_ROWS).map(r => ({
      nodeId: r.nodeId,
      modified: r.modified,
      score: r.score,
      castRoleFit: r.castRoleFit,
      scarcity: r.scarcity,
      storyTies: r.storyTies,
      distance: r.distance,
      identity: r.identity,
      ...(r.vetoed ? { vetoed: r.vetoed } : {}),
    })),
    rowsConsidered,
    summary:
      `binder ${mode} for ${request.castKey}@${request.projectId} ` +
      `(${rowsConsidered} rows${winnerNodeId ? `, winner ${winnerNodeId}` : ''}` +
      `${refusedReason ? `, ${refusedReason}` : ''})`,
  });
}
