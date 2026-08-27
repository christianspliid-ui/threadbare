/**
 * Reputation — the one social score between any two parties. THR-1206.
 *
 * Plan: `Docs/plans/2026-08-23-thr-1206-reputation-unification.md`
 *
 * The director's ruling, verbatim (2026-08-23): *"if we do have reputation as our
 * concept for 'the social score that modifies interactions between a and b', then
 * lets use that everywhere."* Before this module the word named six mechanisms that
 * did not agree, and the UL defined none of them.
 *
 * This is the **unification**, and it is deliberately a read API plus one new store —
 * not a migration. Four legs answer "what is a's standing with b", in priority order:
 *
 *   1. `membership` — `member_of.reputation`, when b is a faction a belongs to. The
 *      only leg with rank, access and expulsion behind it; untouched by this module.
 *   2. `edge`       — the new `reputation_with` edge (THR-1206), which fills the two
 *      pairs nothing covered: agent↔location, and agent↔faction *without* membership.
 *   3. `bond`       — `relates_to.trust`, remapped from [-1,1] to [0,1], when b is a
 *      person a has a relationship with.
 *   4. `default`    — {@link REPUTATION_WITH_DEFAULT}, neutral.
 *
 * What makes six stores one *concept* on every player surface is that the band word
 * always comes from `getReputationWord` — a single vocabulary, never a number
 * (UI Law 13). The stores stay where they are; the word and the read do not.
 *
 * NFP: Tunability (every rate is a named constant below), Inspectability (every
 * edge-leg write emits `reputation_with_changed` carrying its cause), Determinism
 * (no PRNG — deterministic arithmetic over graph state), Fail-soft (a missing node,
 * an unresolvable sublocation or a NaN delta traces and skips; nothing throws).
 */

import type { WorldGraph } from './graph';
import type { MemberOfEdgeProperties } from '../types/disposition';
import { getReputationWord, REPUTATION_WORDS } from '../data/domain-words';
import { resolveToParentLocation } from './sublocationShape';
import { emitTrace } from './traceBuffer';

// ─── Constants ────────────────────────────────────────────────────────────────

/**
 * Neutral standing — the read-API fallback and the value a fresh edge is minted at.
 *
 * Matches `DEFAULT_REPUTATION`'s convention (`src/types/disposition.ts`): the middle
 * of the 0–1 scale is "they have no particular opinion", not "they dislike you".
 */
export const REPUTATION_WITH_DEFAULT = 0.5;

/**
 * Drift back toward neutral, per tick.
 *
 * Matches `FACTION_REPUTATION_DECAY_PER_TICK` (0.001) so earned standing lingers at
 * the same rate whichever leg holds it — a welcome you earned in a town should not
 * evaporate faster than a guild rank you earned the same evening.
 */
export const REPUTATION_WITH_DECAY_PER_TICK = 0.001;

/** Distance from neutral below which a decayed edge is deleted rather than kept. */
export const REPUTATION_WITH_PRUNE_EPSILON = 0.02;

/**
 * Cap on a single authored aftermath delta.
 *
 * Mirrors the intent of `FACTION_REPUTATION_GAIN_AMOUNT_CLAMP`: content may not
 * hand one scene the power to move standing from neutral to revered.
 */
export const REPUTATION_WITH_MAX_DELTA_PER_OUTCOME = 0.15;

/** Leverage points per unit of (score − neutral) in a social scene's opening. */
export const REPUTATION_LEVERAGE_SCALE = 2.0;

// ─── Types ────────────────────────────────────────────────────────────────────

/**
 * A band from the single reputation vocabulary (`REPUTATION_WORDS`).
 *
 * Deliberately derived from that array rather than restated: a second band table is
 * exactly the drift this module exists to end.
 */
export type ReputationBand = typeof REPUTATION_WORDS[number];

/** Which store answered the read. Surfaced in traces and the debug bridge, never in prose. */
export type ReputationSource = 'membership' | 'edge' | 'bond' | 'default';

export interface ReputationReading {
  /** 0–1. Neutral is {@link REPUTATION_WITH_DEFAULT}. */
  score: number;
  /** The player-facing word. Always from `getReputationWord` — one vocabulary. */
  band: ReputationBand;
  /** Which leg produced `score`. */
  source: ReputationSource;
}

/** Properties carried by a `reputation_with` edge. */
export interface ReputationWithEdgeProperties {
  score: number;
  lastChangedTick: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function bandOf(score: number): ReputationBand {
  return getReputationWord(score) as ReputationBand;
}

/**
 * Rank the bands so a gate can ask "at least Respected" without an ordering table.
 *
 * `REPUTATION_WORDS` is already ordered low → high, so its index *is* the rank.
 * Returns -1 for a word that is not a band, which callers read as "never satisfied"
 * rather than as an error — an authored typo must not silently open a gate.
 */
export function reputationBandRank(band: string): number {
  return (REPUTATION_WORDS as readonly string[]).indexOf(band);
}

/** Is `node` a place the standing edge may point at? */
function isLocationNode(graph: WorldGraph, nodeId: string): boolean {
  const node = graph.getNode(nodeId);
  return String(node?.type ?? '') === 'location';
}

/** Find the a→b `reputation_with` edge, if one has been minted. */
function findReputationEdge(graph: WorldGraph, aId: string, bId: string) {
  return graph.getOutgoingEdges(aId, 'reputation_with').find(e => e.target === bId);
}

/**
 * Find the a→b `member_of` edge, if a belongs to b.
 *
 * THR-1297: deliberately NOT routed through `getFactionMembershipEdges`. This is the
 * membership *leg* of `getReputationWith`, and it is generic by design — b may be a
 * faction OR a company, and a mortal's standing with their own company is a real
 * quantity the reputation walk reads. Filtering the group family out here would silently
 * drop that leg. Safe as a raw read because it is target-addressed: it asks about one
 * known b, never "what faction is a in?".
 */
function findMembership(graph: WorldGraph, aId: string, bId: string) {
  return graph.getOutgoingEdges(aId, 'member_of').find(e => e.target === bId);
}

/** Find the a→b `relates_to` edge, if a has a personal bond with b. */
function findBond(graph: WorldGraph, aId: string, bId: string) {
  return graph.getOutgoingEdges(aId, 'relates_to').find(e => e.target === bId);
}

// ─── The one read ─────────────────────────────────────────────────────────────

/**
 * What is `a`'s standing with `b`?
 *
 * The single entry point every surface asks — profile rows, chips, eligibility
 * gates, leverage. Directional: `getReputationWith(a, b)` is what *b* thinks of *a*
 * having earned, and is not required to equal the reverse.
 *
 * Dispatch order is priority, not fallback-on-empty: a *member* of a guild reads the
 * membership leg even if an old `reputation_with` edge exists, because rank, access
 * and expulsion all hang off that one and a second answer would let the profile and
 * the gate disagree.
 *
 * Fail-soft: a missing node on either end, or `a === b`, reads neutral.
 */
export function getReputationWith(
  graph: WorldGraph,
  aId: string,
  bId: string,
): ReputationReading {
  const neutral: ReputationReading = {
    score: REPUTATION_WITH_DEFAULT,
    band: bandOf(REPUTATION_WITH_DEFAULT),
    source: 'default',
  };

  if (!aId || !bId || aId === bId) return neutral;
  if (!graph.getNode(aId) || !graph.getNode(bId)) return neutral;

  // 1. Membership leg — the ranked, consequence-bearing one.
  const membership = findMembership(graph, aId, bId);
  if (membership) {
    const props = membership.properties as Partial<MemberOfEdgeProperties>;
    const score = clamp01(props.reputation ?? 0);
    return { score, band: bandOf(score), source: 'membership' };
  }

  // 2. Edge leg — the standing this ticket added, for the pairs nothing covered.
  const edge = findReputationEdge(graph, aId, bId);
  if (edge) {
    const score = clamp01((edge.properties.score as number) ?? REPUTATION_WITH_DEFAULT);
    return { score, band: bandOf(score), source: 'edge' };
  }

  // 3. Bond leg — a personal relationship, remapped from trust's [-1,1].
  const bond = findBond(graph, aId, bId);
  if (bond) {
    const trust = (bond.properties.trust as number) ?? 0;
    const score = clamp01((trust + 1) / 2);
    return { score, band: bandOf(score), source: 'bond' };
  }

  return neutral;
}

// ─── The one write (edge leg) ─────────────────────────────────────────────────

export interface ReputationWriteResult {
  applied: boolean;
  /** Score after the write; the pre-write score when `applied` is false. */
  score: number;
  band: ReputationBand;
  /** Present when `applied` is false. */
  reason?: 'missing_source' | 'missing_target' | 'unresolvable_sublocation' | 'self' | 'invalid_delta';
  /** The node actually written to — a sublocation target resolves to its parent place. */
  effectiveTargetId?: string;
  /** True when `delta` was reduced to the per-outcome cap. */
  clamped?: boolean;
}

/**
 * Move `a`'s standing with `b` by `delta`, minting the edge if this is the first time.
 *
 * Only the **edge leg** is written here. The membership and bond legs keep their own
 * APIs (`applyFactionReputationGain`, the trust helpers) — this module does not proxy
 * writes it does not own, because doing so would put two writers on one store and
 * that is the drift the unification exists to end.
 *
 * Three-tier rule (CLAUDE.md): a sublocation target resolves up to its parent place
 * before the write, so "standing at the shrine" and "standing in the town that holds
 * it" are one number rather than two the player must reconcile.
 */
export function applyReputationWithDelta(
  graph: WorldGraph,
  aId: string,
  bId: string,
  delta: number,
  tick: number,
  cause: string,
): ReputationWriteResult {
  const fail = (
    reason: NonNullable<ReputationWriteResult['reason']>,
  ): ReputationWriteResult => ({
    applied: false,
    score: REPUTATION_WITH_DEFAULT,
    band: bandOf(REPUTATION_WITH_DEFAULT),
    reason,
  });

  if (!aId || !graph.getNode(aId)) return fail('missing_source');
  if (!bId) return fail('missing_target');
  if (aId === bId) return fail('self');
  if (typeof delta !== 'number' || !Number.isFinite(delta)) return fail('invalid_delta');

  // Resolve a sublocation target up to its place. `resolveToParentLocation` returns
  // the node unchanged when it is not a sublocation, and `undefined` when it is one
  // whose parent is missing — the two cases a caller must tell apart.
  const targetNode = graph.getNode(bId);
  if (!targetNode) return fail('missing_target');
  const resolved = resolveToParentLocation(graph, targetNode);
  if (!resolved) return fail('unresolvable_sublocation');
  const effectiveTargetId = resolved.id;
  if (effectiveTargetId === aId) return fail('self');

  const cappedDelta = Math.max(
    -REPUTATION_WITH_MAX_DELTA_PER_OUTCOME,
    Math.min(REPUTATION_WITH_MAX_DELTA_PER_OUTCOME, delta),
  );
  const clamped = cappedDelta !== delta;

  const existing = findReputationEdge(graph, aId, effectiveTargetId);
  const previous = existing
    ? clamp01((existing.properties.score as number) ?? REPUTATION_WITH_DEFAULT)
    : REPUTATION_WITH_DEFAULT;
  const newScore = clamp01(previous + cappedDelta);

  if (existing) {
    existing.properties = {
      ...existing.properties,
      score: newScore,
      lastChangedTick: tick,
    };
  } else {
    graph.addEdge({
      id: `reputation_with_${aId}_${effectiveTargetId}`,
      source: aId,
      target: effectiveTargetId,
      type: 'reputation_with',
      properties: { score: newScore, lastChangedTick: tick } satisfies ReputationWithEdgeProperties,
    });
  }

  emitTrace({
    tick,
    category: 'reputation_with_changed',
    sourceId: aId,
    targetId: effectiveTargetId,
    delta: cappedDelta,
    newScore,
    cause,
    summary: `reputation_with: ${aId} → ${resolved.name ?? effectiveTargetId} `
      + `${cappedDelta >= 0 ? '+' : ''}${cappedDelta.toFixed(3)} → ${newScore.toFixed(3)} `
      + `(${bandOf(newScore)}) [${cause}]${clamped ? ' [capped]' : ''}`,
  });

  return {
    applied: true,
    score: newScore,
    band: bandOf(newScore),
    effectiveTargetId,
    ...(clamped ? { clamped } : {}),
  };
}

// ─── Decay (phase 6.6) ────────────────────────────────────────────────────────

/**
 * Drift every `reputation_with` edge one tick back toward neutral, deleting any that
 * arrives there.
 *
 * The deletion *is* the fade-out, and it is what keeps the family sparse: an edge
 * exists only while someone still holds an opinion, so the phase stays O(edges that
 * exist) rather than O(agents × places). Called from `phaseReputationDecay`.
 *
 * @returns counts for the caller's trace/tests.
 */
export function decayReputationWithEdges(
  graph: WorldGraph,
  tick: number,
): { decayed: number; pruned: number } {
  let decayed = 0;
  let pruned = 0;

  // Snapshot: the loop deletes from the same collection it iterates.
  const edges = [...graph.getEdgesByType('reputation_with')];

  for (const edge of edges) {
    const score = clamp01((edge.properties.score as number) ?? REPUTATION_WITH_DEFAULT);
    const distance = score - REPUTATION_WITH_DEFAULT;
    if (distance === 0) {
      // Already neutral — prune rather than leave a no-op edge behind.
      graph.removeEdge(edge.id);
      pruned++;
      continue;
    }

    const step = Math.min(REPUTATION_WITH_DECAY_PER_TICK, Math.abs(distance));
    const newScore = clamp01(score - Math.sign(distance) * step);
    decayed++;

    if (Math.abs(newScore - REPUTATION_WITH_DEFAULT) < REPUTATION_WITH_PRUNE_EPSILON) {
      graph.removeEdge(edge.id);
      pruned++;
      emitTrace({
        tick,
        category: 'reputation_with_pruned',
        sourceId: edge.source,
        targetId: edge.target,
        finalScore: newScore,
        summary: `reputation_with_pruned: ${edge.source} → ${edge.target} faded to neutral (${newScore.toFixed(3)})`,
      });
      continue;
    }

    edge.properties = { ...edge.properties, score: newScore };
  }

  return { decayed, pruned };
}

// ─── Consumers ────────────────────────────────────────────────────────────────

/**
 * Standing's contribution to a social scene's opening leverage.
 *
 * This is literally the director's definition doing its job: the score modifies the
 * interaction between a and b. Positive standing opens the scene ahead, negative
 * standing opens it behind — symmetric by construction, since the term is centred on
 * neutral rather than floored at it.
 */
export function reputationLeverageTerm(
  graph: WorldGraph,
  actorId: string,
  targetId: string,
): number {
  const { score } = getReputationWith(graph, actorId, targetId);
  return (score - REPUTATION_WITH_DEFAULT) * REPUTATION_LEVERAGE_SCALE;
}

/**
 * Does `a` clear a `requiredReputationWith` gate against `b`?
 *
 * An unrecognised band name never satisfies the gate (`reputationBandRank` returns
 * -1 only for the *authored* side, so a typo closes the door rather than opening it).
 */
export function meetsReputationWithRequirement(
  graph: WorldGraph,
  aId: string,
  bId: string,
  atLeast: string,
): boolean {
  const requiredRank = reputationBandRank(atLeast);
  if (requiredRank < 0) return false;
  const { band } = getReputationWith(graph, aId, bId);
  return reputationBandRank(band) >= requiredRank;
}

/**
 * Every standing `a` holds, strongest-departure-from-neutral first.
 *
 * Powers the profile's "notable standings" rows. Edge leg only: the membership leg
 * already has its own faction-standing rows on the same surface, and repeating them
 * here would show the player one relationship twice under two headings.
 */
export function getNotableStandings(
  graph: WorldGraph,
  aId: string,
  limit: number,
): Array<{ targetId: string; score: number; band: ReputationBand }> {
  if (!aId) return [];
  return graph.getOutgoingEdges(aId, 'reputation_with')
    .map(e => {
      const score = clamp01((e.properties.score as number) ?? REPUTATION_WITH_DEFAULT);
      return { targetId: e.target, score, band: bandOf(score) };
    })
    .sort((x, y) =>
      Math.abs(y.score - REPUTATION_WITH_DEFAULT) - Math.abs(x.score - REPUTATION_WITH_DEFAULT))
    .slice(0, Math.max(0, limit));
}

/** Is `nodeId` a place? Exported for the aftermath handler's target routing. */
export function isReputationPlaceTarget(graph: WorldGraph, nodeId: string): boolean {
  return isLocationNode(graph, nodeId);
}
