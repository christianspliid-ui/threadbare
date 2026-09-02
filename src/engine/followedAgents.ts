/**
 * Follow state — who the player is watching (THR-1299 slice 1).
 *
 * The single writer for the two GameState arrays that answer "does this mortal's
 * news interrupt me?": `followedAgentIds` (explicit follows) and `mutedAgentIds`
 * (the un-follow of an agent who is followed *by default*).
 *
 * ## Why a module rather than two array splices at the call sites
 *
 * Follow is not one array. It is a three-way read — explicit list, live court
 * position, mute list — and every caller that re-derives it invites the exact bug
 * doc 1 predicted (`undertakingCheckpoints.ts`, THR-1292): *"a missing unfollow is
 * a missing feature while a mute-by-default is a bug."* Un-following a
 * default-followed agent cannot be expressed by removing them from a list they
 * were never in, so it needs its own negative term, and a negative term that any
 * caller can forget to consult is worse than no unfollow at all.
 *
 * ## The court-position clause — closing the dormant divergence
 *
 * Default-follow reads the **live** `thread` edge, not an init snapshot: threads
 * are minted long after `initializeGameState` (The First is bonded later, every
 * later thread later still), so an authoritative snapshot would follow nobody for
 * a whole run. That rationale is doc 1's and it is sound; what this module adds is
 * the *court-position check inside* that live read.
 *
 * Before this, default-follow tested bare edge **existence** while every attention
 * predicate (`resolveEffectiveTier`, `phaseAttention`, `encounterVisibility`) keyed
 * on the edge's `courtPosition`. A player who cast `thread.dormant` — whose own
 * authored text reads *"their encounters no longer surface as tugs… the thread
 * persists"* — silenced their encounters and kept being interrupted by their
 * undertaking news. One gesture, two channels, opposite answers. The orchestrator
 * filed that divergence on THR-1299 on 2026-08-27 and the plan resolves it as
 * option 1: make the follow predicate court-position-aware, so the two agree by
 * construction and `thread.dormant` means what it says.
 *
 * **Absent `courtPosition` reads as `retinue`, deliberately.** Not every thread
 * writer stamps a position — the thread-branch effect in `encounterAftermath.ts`
 * omits it — and `collectThreadedAgents` (`encounterVisibility.ts:415`), the map
 * both the visibility phase and the notification threading gate read, already
 * documents absent-means-retinue. Reading absent as *excluded* here would have
 * re-opened the same divergence pointing the other way: branched threads visible
 * to encounters and silent for moments. `dormant` and `watched` are the two
 * positions excluded — the god has either set the thread down or has not reached
 * down yet. Either remains explicitly followable through the affordance, which is
 * the honest expression of "follow any agent".
 */

import type { GameState } from '../types/gameState';
import type { CourtPosition } from '../types/influence';
import type { GraphEdge } from '../types/graph';
import type { WorldGraph } from './graph';
import { emitTrace } from './traceBuffer';

/**
 * Court positions whose thread confers default-follow.
 *
 * Exported so a test can assert membership against the `CourtPosition` union
 * rather than restating the two strings, and so the excluded pair stays visible
 * as a decision rather than a hard-coded condition.
 */
export const DEFAULT_FOLLOWED_COURT_POSITIONS: readonly CourtPosition[] = ['the_first', 'retinue'];

/** Court position an unstamped thread edge is read at — see the module header. */
export const UNSTAMPED_THREAD_COURT_POSITION: CourtPosition = 'retinue';

/** Where a follow change came from, for the trace. */
export type FollowChangeSource = 'arc_panel' | 'encounter_ui' | 'init' | 'debug';

/** The three-way read, for surfaces that must render follow state honestly. */
export interface FollowState {
  /** Explicitly followed via the affordance. */
  explicit: readonly string[];
  /** Followed by court position — the god reached down to these. */
  threaded: readonly string[];
  /** Default-followed but muted by the player. */
  muted: readonly string[];
}

/**
 * The court position carried by one thread edge, defaulted for an unstamped one.
 *
 * The single place the `?? retinue` convention is spelled. Every reader below
 * goes through it, so the seed (`defaultFollowedAgentIds`), the live predicate
 * and the surface read (`getFollowState`) cannot drift apart — which is the
 * failure mode that produced the divergence this module closes.
 */
function readCourtPosition(edge: GraphEdge): CourtPosition {
  const raw = edge.properties?.courtPosition as CourtPosition | null | undefined;
  return raw ?? UNSTAMPED_THREAD_COURT_POSITION;
}

/** Whether one thread edge's position confers default-follow. */
function edgeDefaultFollows(edge: GraphEdge): boolean {
  return DEFAULT_FOLLOWED_COURT_POSITIONS.includes(readCourtPosition(edge));
}

/**
 * The court position of the ascendant's thread to this agent, or `null` when no
 * live thread edge exists.
 *
 * Absent-but-threaded resolves to `UNSTAMPED_THREAD_COURT_POSITION` so callers
 * cannot accidentally distinguish "no thread" from "thread with no stamp".
 */
export function getThreadCourtPosition(
  graph: WorldGraph,
  ascendantId: string,
  agentId: string,
): CourtPosition | null {
  const edge = graph.getOutgoingEdges(ascendantId, 'thread').find(e => e.target === agentId);
  return edge ? readCourtPosition(edge) : null;
}

/**
 * Whether this agent is followed by construction — the god has reached down and
 * has not set the thread down again.
 */
export function isDefaultFollowed(
  graph: WorldGraph,
  ascendantId: string,
  agentId: string,
): boolean {
  const position = getThreadCourtPosition(graph, ascendantId, agentId);
  if (!position) return false;
  return DEFAULT_FOLLOWED_COURT_POSITIONS.includes(position);
}

/** Whether the player has muted this agent's interrupts. */
export function isMuted(state: GameState, agentId: string): boolean {
  return state.mutedAgentIds?.includes(agentId) ?? false;
}

/**
 * The one follow predicate.
 *
 * Explicit follow, or default-follow by court position — and in **both** cases
 * the mute must be clear. A mute drops the interrupt upgrade; it never silences
 * the stream, so a muted agent's moments still queue and still badge.
 */
export function isFollowed(state: GameState, graph: WorldGraph, agentId: string): boolean {
  if (isMuted(state, agentId)) return false;
  if (state.followedAgentIds?.includes(agentId)) return true;
  return isDefaultFollowed(graph, state.ascendantId, agentId);
}

/**
 * The three-way read for surfaces.
 *
 * `threaded` is derived from the live graph rather than the array, so it answers
 * for agents threaded after init — the whole reason default-follow is a live read.
 */
export function getFollowState(state: GameState, graph: WorldGraph): FollowState {
  const threaded = graph.getOutgoingEdges(state.ascendantId, 'thread')
    .filter(edgeDefaultFollows)
    .map(e => e.target);

  return {
    explicit: [...(state.followedAgentIds ?? [])],
    threaded,
    muted: [...(state.mutedAgentIds ?? [])],
  };
}

/**
 * Follow an agent.
 *
 * Adds them to the explicit list **and** clears any mute — following is the
 * positive gesture, so it must undo the negative one, otherwise a player who
 * muted a retinue member and later pressed Follow would get a still-silent
 * toggle that reads as broken.
 *
 * Returns a new GameState-shaped patch; callers apply it (React `setGameState`,
 * or a direct merge in headless code). No-ops return the same arrays, so an
 * already-followed agent does not churn state or emit a trace.
 */
export function followAgent(
  state: GameState,
  agentId: string,
  source: FollowChangeSource = 'arc_panel',
): Pick<GameState, 'followedAgentIds' | 'mutedAgentIds'> {
  const explicit = state.followedAgentIds ?? [];
  const muted = state.mutedAgentIds ?? [];
  const alreadyExplicit = explicit.includes(agentId);
  const wasMuted = muted.includes(agentId);

  if (alreadyExplicit && !wasMuted) {
    return { followedAgentIds: explicit, mutedAgentIds: muted };
  }

  emitTrace({
    tick: state.tick,
    category: 'follow_change',
    agentId,
    action: wasMuted ? 'unmute' : 'follow',
    source,
  });

  return {
    followedAgentIds: alreadyExplicit ? explicit : [...explicit, agentId],
    mutedAgentIds: wasMuted ? muted.filter(id => id !== agentId) : muted,
  };
}

/**
 * Un-follow an agent.
 *
 * Removes the explicit entry. If they are *still* followed afterwards — because
 * their court position default-follows them — the un-follow is expressed as a
 * mute instead, which is the only way to say "stop interrupting me about this
 * mortal" without touching their court position. Court position is the god's
 * standing with a mortal; follow is the player's attention. Overloading the
 * thread edge with follow semantics is how the mute-vs-unfollow bug ships, so the
 * two axes stay separate.
 */
export function unfollowAgent(
  state: GameState,
  graph: WorldGraph,
  agentId: string,
  source: FollowChangeSource = 'arc_panel',
): Pick<GameState, 'followedAgentIds' | 'mutedAgentIds'> {
  const explicit = state.followedAgentIds ?? [];
  const muted = state.mutedAgentIds ?? [];
  const nextExplicit = explicit.filter(id => id !== agentId);
  const needsMute = isDefaultFollowed(graph, state.ascendantId, agentId);

  if (nextExplicit.length === explicit.length && (!needsMute || muted.includes(agentId))) {
    return { followedAgentIds: explicit, mutedAgentIds: muted };
  }

  emitTrace({
    tick: state.tick,
    category: 'follow_change',
    agentId,
    action: needsMute ? 'mute' : 'unfollow',
    source,
  });

  return {
    followedAgentIds: nextExplicit,
    mutedAgentIds: needsMute && !muted.includes(agentId) ? [...muted, agentId] : muted,
  };
}

/**
 * The default-followed set at world init: the ascendant's threaded retinue.
 *
 * Usually empty at init — threads are minted later, which is why the live read
 * above exists — but it seeds the field so a save carries it, and it runs the
 * same court-position filter the live check does, so the two cannot answer
 * differently.
 *
 * Moved here from `undertakingCheckpoints.ts` in THR-1299 so the seed and the
 * predicate share a module; re-exported there for the existing import site.
 */
export function defaultFollowedAgentIds(graph: WorldGraph, ascendantId: string): string[] {
  return graph.getOutgoingEdges(ascendantId, 'thread')
    .filter(edgeDefaultFollows)
    .map(e => e.target);
}
