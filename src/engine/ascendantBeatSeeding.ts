/**
 * Ascendant Beat — graph seeding (THR-520, plan §4.1).
 *
 * The shipped resolve path (`resolvePendingBeat`, THR-517) is catalogue-driven: a beat
 * *grants action cards*; the threaded actor / throne / artifact the onboarding narrates
 * are produced only when the player *fires* those cards. This module closes the plan's
 * richer §4.1 vision — beat resolution itself seeding the promised graph state — so a
 * fresh opening leaves the player holding a live throne (mana ticking) and a threaded
 * artifact without manual card-firing.
 *
 * It is invoked by `resolvePendingBeat` when the resolved `BeatDefinition` carries a
 * `seedsGraph` tag; pure spine grants (Beat 0, Beat 3) carry none and are untouched.
 *
 * Two seeds ship (the two the scripted spine promises, plan §4.1):
 *   - `home_seat`         — Beat 1 "The Seat": seat the ascendant at the settlement
 *                           where The First was met (`setHomeSeat`, influence.ts).
 *   - `threaded_artifact` — Beat 2 "A Thing Left Behind": mint a sphere-flavored artifact,
 *                           `thread` it (ascendant → artifact), and grant it to the bonded
 *                           First via a `possesses` edge.
 *
 * Beat 0 ("The First") seeds nothing here — `MeetingEncounter` already threads that actor
 * (`courtPosition: 'the_first'`); reconciling means *not* double-threading it.
 *
 * NFP compliance:
 *   #1 Tunability: the artifact effect comes from the THR-509 `SPHERE_EFFECT_TABLE`;
 *      seat income is `ESSENCE_PER_SEAT` (influence-content.ts). No new magic numbers.
 *   #2 Inspectability: each seed emits one `ascendant.beat.seeded` trace naming the
 *      created node/edge ids (the add_node/add_edge surface) or the fail-soft reason.
 *   #3 Determinism: the only randomness is `pickSphereFlavoredEffect`, fed a PRNG seeded
 *      from `(state.seed, tick)` — same seed + same tick → same artifact.
 *   #4 Fail-soft: a missing ascendant / location / sphere no-ops with a `failSoft` trace
 *      and contributes an empty seed set; the beat still resolves (never wedges, never throws).
 */

import type { GameState } from '../types/gameState';
import type { BeatDefinition, BeatGraphSeed } from '../types/ascendantBeat';
import type { AttachmentEffect } from '../types/effects';
import { mulberry32 } from '../lib/prng';
import { setHomeSeat } from './influence';
import { pickSphereFlavoredEffect } from './ascendantPrimitives';
import { getAscendantPrimarySphere } from './ascendantExpression';
import { getAgentLocationId } from './graphQueries';
import { emitTrace } from './traceBuffer';

/** Trace category for beat graph seeding (registered in TRACE_CATEGORIES). */
export const BEAT_SEEDED_TRACE_CATEGORY = 'ascendant.beat.seeded' as const;

/** What a seed produced — the node/edge ids it created or designated. */
export interface BeatSeedResult {
  /** Node ids created or designated (throne location, minted artifact). */
  readonly seededNodeIds: readonly string[];
  /** Edge ids created (`thread` / `possesses` / `controls`). */
  readonly seededEdgeIds: readonly string[];
}

const EMPTY_SEED: BeatSeedResult = { seededNodeIds: [], seededEdgeIds: [] };

function emitSeedTrace(
  turn: number,
  beatId: string,
  seed: string,
  result: BeatSeedResult,
  failSoft?: string,
): void {
  emitTrace({
    tick: turn,
    category: BEAT_SEEDED_TRACE_CATEGORY,
    turn,
    beatId,
    seed,
    seededNodeIds: [...result.seededNodeIds],
    seededEdgeIds: [...result.seededEdgeIds],
    ...(failSoft ? { failSoft } : {}),
    summary: failSoft
      ? `ascendant beat seed no-op: ${seed} (${failSoft})`
      : `ascendant beat seeded: ${seed} → nodes [${result.seededNodeIds.join(', ')}]`,
  } as unknown as Parameters<typeof emitTrace>[0]);
}

/**
 * The bonded First's actor id — the target of the ascendant's `thread` edge marked
 * `courtPosition: 'the_first'` that resolves to an `actor` node. Null when the god has
 * not bonded a First yet. Mirrors the resolution `firstIsBonded` / the prose override use.
 */
function findBondedFirstId(graph: GameState['graph'], ascendantId: string): string | null {
  const edge = graph
    .getOutgoingEdges(ascendantId, 'thread')
    .find(
      e =>
        (e.properties as { courtPosition?: string }).courtPosition === 'the_first' &&
        graph.getNode(e.target)?.type === 'actor',
    );
  return edge?.target ?? null;
}

/**
 * Seed Beat 1 "The Seat": designate the ascendant's home seat at the settlement where
 * The First was met. Resolves The First → its `located_at` location, climbing one tier
 * to the parent settlement when the First stands at a sublocation. Falls back to
 * `setHomeSeat`'s deterministic default (capital → city → first location) when The First
 * or its location can't be resolved (director's call, per the THR-520 handoff).
 */
function seedHomeSeat(state: GameState, ascendantId: string, turn: number): BeatSeedResult {
  const graph = state.graph;
  const firstId = findBondedFirstId(graph, ascendantId);
  let seatRef: string | undefined;
  if (firstId) {
    const locId = getAgentLocationId(graph, firstId);
    if (locId) {
      // Climb to the parent settlement if The First stands at a sublocation (three-tier model).
      const parentId = graph.getNode(locId)?.properties.parentLocationId as string | undefined;
      seatRef = parentId ?? locId;
    }
  }

  const result = setHomeSeat(graph, ascendantId, seatRef);
  if (!result.success || !result.locationId) {
    return EMPTY_SEED;
  }
  // setHomeSeat ensures a `controls` edge with this deterministic id (added when absent).
  const controlsEdgeId = `edge.seat.controls.${ascendantId}.${result.locationId}`;
  const seededEdgeIds = graph.getEdge(controlsEdgeId) ? [controlsEdgeId] : [];
  return { seededNodeIds: [result.locationId], seededEdgeIds };
}

/**
 * Seed Beat 2 "A Thing Left Behind": mint a sphere-flavored artifact, `thread` it from the
 * ascendant, and grant it to the bonded First via a `possesses` edge so a threaded mortal
 * carries the god's will (plan §4.1; mirrors the `bestow` mint+possess pattern). When no
 * First is bonded yet, the artifact is still minted + threaded (a future bearer can hold it);
 * only the `possesses` edge is skipped.
 */
function seedThreadedArtifact(state: GameState, ascendantId: string, turn: number): BeatSeedResult {
  const graph = state.graph;
  const sphere = getAscendantPrimarySphere(graph, ascendantId);
  if (!sphere) {
    return EMPTY_SEED;
  }
  // Deterministic PRNG seeded from the run seed + tick (NFP #3). One entry per sphere in
  // SPHERE_EFFECT_TABLE today, so the pick is stable regardless; seeded for forward growth.
  const rng = mulberry32((state.seed ?? 0) + turn);
  const effect = pickSphereFlavoredEffect(sphere, rng, turn);
  const effects: AttachmentEffect[] = effect ? [effect] : [];

  const artifactId = `beat_artifact_${ascendantId}_${turn}`;
  graph.addNode({
    id: artifactId,
    type: 'artifact',
    name: 'A Thing Left Behind',
    properties: {
      effects,
      source: 'beat.spine.thing_left_behind',
      threadedBy: ascendantId,
      acquiredTick: turn,
      sphere,
    },
  });

  const seededEdgeIds: string[] = [];
  const threadEdgeId = `edge.thread.${ascendantId}.${artifactId}`;
  graph.addEdge({
    id: threadEdgeId,
    source: ascendantId,
    target: artifactId,
    type: 'thread',
    properties: { seededByBeat: 'beat.spine.thing_left_behind' },
  });
  seededEdgeIds.push(threadEdgeId);

  const firstId = findBondedFirstId(graph, ascendantId);
  if (firstId) {
    const possessEdgeId = `${artifactId}_possesses`;
    graph.addEdge({
      id: possessEdgeId,
      source: firstId,
      target: artifactId,
      type: 'possesses',
      properties: { modifiers: {}, grants: [], tags: ['divine_artifact'] },
    });
    seededEdgeIds.push(possessEdgeId);
  }

  return { seededNodeIds: [artifactId], seededEdgeIds };
}

/**
 * Seed the graph state a resolved spine beat promises. Dispatches on `beat.seedsGraph.kind`;
 * mutates `state.graph` in place (the world graph is a shared mutable object — load-bearing
 * decision) and returns the ids it touched for the `BeatRecord.seededNodeIds` + trace.
 *
 * Fail-soft (NFP #4): no ascendant, no seed tag, or any thrown lookup yields an empty seed
 * set and a `failSoft` trace — the beat still resolves and grants its cards. Never throws.
 */
export function seedBeatGraph(state: GameState, beat: BeatDefinition, turn: number): BeatSeedResult {
  const seed: BeatGraphSeed | undefined = beat.seedsGraph;
  if (!seed) return EMPTY_SEED;
  const ascendantId = state.ascendantId;
  if (!ascendantId) {
    emitSeedTrace(turn, beat.beatId, seed.kind, EMPTY_SEED, 'no_ascendant');
    return EMPTY_SEED;
  }
  try {
    let result: BeatSeedResult;
    switch (seed.kind) {
      case 'home_seat':
        result = seedHomeSeat(state, ascendantId, turn);
        break;
      case 'threaded_artifact':
        result = seedThreadedArtifact(state, ascendantId, turn);
        break;
      default:
        result = EMPTY_SEED;
    }
    const failSoft = result.seededNodeIds.length === 0 ? 'seed_target_unresolved' : undefined;
    emitSeedTrace(turn, beat.beatId, seed.kind, result, failSoft);
    return result;
  } catch (err) {
    emitTrace({
      tick: turn,
      category: 'engine_warning',
      summary: `seedBeatGraph error (${beat.beatId}/${seed.kind}, turn ${turn}): ${
        err instanceof Error ? err.message : String(err)
      }`,
    });
    return EMPTY_SEED;
  }
}
