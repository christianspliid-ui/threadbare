// src/engine/grievance/grievanceLifecycle.ts
//
// How a grievance opens, holds its slot, cools, and passes on (THR-1298 slice 5).
//
// Slice 1–4 made a harm *mint* a drive. This module is everything that happens to that
// drive afterwards, and it exists as its own file because the rules are a single
// coherent policy that three different callers need to agree on: the mint lane asks
// "does this harm become a drive, and whose?", the milestone pass asks "is this one
// still hot?", and the decision board (slice 6) asks "how badly do they want it?".
//
// The design commitments, all from the plan's § Systems design:
//
// - **One slot.** An agent holds at most one grievance. A second harm from the same
//   hand feeds the first; a decisively worse harm replaces it. Nobody queues vendettas.
// - **Ambient victims get grudges, not drives.** An ambient-tier agent never consults
//   the decision board, so a drive on their arc panel would be a promise the world
//   cannot keep (THR-1348). The grudge edge is honest relationship colour instead.
// - **Chains stay shallow.** Past `GRIEVANCE_CHAIN_DEPTH_MAX`, victims get grudge edges
//   only, whatever their tier — one razed village must not end with every agent in the
//   region pursuing somebody.
// - **Cooling is the exit.** Heat decays on the milestone pass and the drive demotes to
//   a grudge; there is no scheduler and no cap doing that work.
//
// NFP #3: every decision here is deterministic — magnitude comparisons and a
// node-id-sorted tie-break. No dice, no `Math.random()`.

import type { WorldGraph } from '../graph';
import type { GraphEdge } from '../../types/graph';
import type { GrievanceTransition, GrievanceTransitionTrace } from '../../types/trace';
import { emitTrace } from '../traceBuffer';
import { isAutonomousDecisionActor } from '../strategicKindReachability';
import { isBrokenMortal } from '../brokenState';
import { writeGrudge, hasGrudge } from './grudgeEdge';
import {
  GRIEVANCE_CHAIN_DEPTH_MAX,
  GRIEVANCE_COOL_THRESHOLD,
  GRIEVANCE_HEAT_DECAY_PER_CHECK,
  GRIEVANCE_HEAT_FEED,
  GRIEVANCE_HEAT_INITIAL_MAX,
  GRIEVANCE_HEAT_INITIAL_SCALE,
  GRIEVANCE_REIGNITION_BOOST,
  GRIEVANCE_REPLACE_RATIO,
} from '../../data/grievance-constants';

/** The harm a mint pass is proposing to turn into a drive. */
export interface GrievanceSeed {
  readonly culpritAgentId: string;
  readonly harmMagnitude: number;
  readonly chainDepth: number;
  /** The outcome node the harm was written as, for grudge provenance. */
  readonly sourceEventId?: string;
}

/** The grievance block written onto a `pursues` edge. */
export interface GrievanceEdgeProperties {
  readonly grievance: true;
  readonly culpritAgentId: string;
  readonly harmMagnitude: number;
  readonly chainDepth: number;
  readonly heat: number;
}

/**
 * What the mint lane should do with the harm it is holding.
 *
 * `write: false` does **not** mean nothing happened — the grudge edge, the heat feed
 * and the demotion are already applied by the time this returns. It means only that
 * there is no `pursues` edge left for the caller to write.
 */
export type GrievanceDisposition =
  | { readonly write: false; readonly outcome: GrievanceTransition }
  | {
      readonly write: true;
      readonly outcome: GrievanceTransition;
      /** Who ends up holding the drive — the victim, or their heir after succession. */
      readonly holderId: string;
      readonly properties: GrievanceEdgeProperties;
    };

/**
 * Emit one transition trace.
 *
 * The payload is built as a typed const before it reaches `emitTrace`, never as an
 * inline literal: `emitTrace`'s parameter is an `Omit<...>` over the whole trace union,
 * and an inline literal collapses to the union's common fields, silently dropping every
 * member-specific one (the same trap `encounterEventNode` and the mint trace document).
 */
function trace(entry: {
  tick: number;
  agentId: string;
  transition: GrievanceTransition;
  culpritAgentId?: string;
  heat?: number;
  detail?: string;
}): void {
  const { tick, agentId, transition, culpritAgentId, heat, detail } = entry;
  const payload: Omit<GrievanceTransitionTrace, 'id' | 'timestamp'> = {
    tick,
    category: 'grievance_transition',
    summary: `${agentId} grievance ${transition}${detail ? ` — ${detail}` : ''}`,
    agentId,
    transition,
    culpritAgentId,
    heat,
    detail,
  };
  emitTrace(payload);
}

/** Opening heat for a harm, boosted when this pair already has history. */
function openingHeat(graph: WorldGraph, victimId: string, seed: GrievanceSeed): {
  heat: number;
  reignited: boolean;
} {
  const base = seed.harmMagnitude * GRIEVANCE_HEAT_INITIAL_SCALE;
  const reignited = hasGrudge(graph, victimId, seed.culpritAgentId);
  const boosted = reignited ? base * GRIEVANCE_REIGNITION_BOOST : base;
  return { heat: Math.min(GRIEVANCE_HEAT_INITIAL_MAX, boosted), reignited };
}

function edgeProperties(seed: GrievanceSeed, heat: number): GrievanceEdgeProperties {
  return {
    grievance: true,
    culpritAgentId: seed.culpritAgentId,
    harmMagnitude: seed.harmMagnitude,
    chainDepth: seed.chainDepth,
    heat,
  };
}

/** The agent's active grievance edge, if they hold one. At most one by construction. */
export function findActiveGrievanceEdge(graph: WorldGraph, agentId: string): GraphEdge | undefined {
  return graph.getOutgoingEdges(agentId, 'pursues').find(
    e => e.properties.status === 'active' && e.properties.grievance === true,
  );
}

/** Whether the agent is gone in the sense that matters to succession. */
function isVictimGone(graph: WorldGraph, agentId: string): boolean {
  const node = graph.getNode(agentId);
  if (!node) return true;
  const props = node.properties as Record<string, unknown>;
  if (props.deceased === true || props.status === 'dead') return true;
  // Broken is a behavioural state, not a graph one; the predicate is guarded because
  // Broken can ship disabled, in which case succession triggers on death alone —
  // stated here rather than silently narrowed (plan § Fail-soft, row 6).
  try {
    return isBrokenMortal(node as Parameters<typeof isBrokenMortal>[0]);
  } catch {
    return false;
  }
}

/**
 * The heir a dead victim's grievance passes to: the strongest positive bond.
 *
 * Kin edges do not exist yet, so the closest sworn bond is the line (THR-1282
 * resolution). Deterministic: strength descending, node id ascending as the tie-break,
 * so the same world always chooses the same heir.
 *
 * Returns undefined when nobody survives to carry it — the chain ends there.
 */
function findHeir(graph: WorldGraph, victimId: string, culpritId: string): string | undefined {
  const candidates = graph.getOutgoingEdges(victimId, 'relates_to')
    .map(e => ({ id: e.target, strength: (e.properties.strength as number) ?? 0 }))
    // A negative or absent bond is not somebody who avenges you. The culprit is
    // excluded outright: inheriting a grievance against yourself is not a story.
    .filter(c => c.strength > 0 && c.id !== culpritId && !isVictimGone(graph, c.id))
    .sort((a, b) => b.strength - a.strength || a.id.localeCompare(b.id));
  return candidates[0]?.id;
}

/**
 * Decide what becomes of a harm the mint lane wants to turn into a drive.
 *
 * Applies every side effect it decides on — grudge edges, heat feeds, demotions — and
 * returns whether a `pursues` edge remains for the caller to write, and for whom.
 *
 * Rule order is load-bearing: death is checked before tier, because a dead ambient
 * victim's heir may well be a spotlight agent who *should* carry the vendetta.
 */
export function resolveGrievanceDisposition(
  graph: WorldGraph,
  victimId: string,
  seed: GrievanceSeed,
  tick: number,
): GrievanceDisposition {
  // ── Chain depth: past the cap, nobody gets a drive, whatever their tier ──
  if (seed.chainDepth > GRIEVANCE_CHAIN_DEPTH_MAX) {
    writeGrudge(graph, victimId, seed.culpritAgentId, tick, 'grievance_cooled', {
      sourceEventId: seed.sourceEventId,
    });
    trace({
      tick, agentId: victimId, transition: 'grudge_only',
      culpritAgentId: seed.culpritAgentId,
      detail: `chain depth ${seed.chainDepth} past cap ${GRIEVANCE_CHAIN_DEPTH_MAX}`,
    });
    return { write: false, outcome: 'grudge_only' };
  }

  // ── Succession: a dead or Broken victim passes the drive to their closest bond ──
  let holderId = victimId;
  let succeeded = false;
  if (isVictimGone(graph, victimId)) {
    const heir = findHeir(graph, victimId, seed.culpritAgentId);
    if (!heir) {
      trace({
        tick, agentId: victimId, transition: 'chain_ended',
        culpritAgentId: seed.culpritAgentId,
        detail: 'victim gone with no surviving positive bond',
      });
      return { write: false, outcome: 'chain_ended' };
    }
    holderId = heir;
    succeeded = true;
  }

  // ── Tier: an ambient agent never reaches the board, so they hold a grudge ──
  const holderNode = graph.getNode(holderId);
  if (!holderNode || !isAutonomousDecisionActor(holderNode)) {
    writeGrudge(graph, holderId, seed.culpritAgentId, tick, 'grievance_cooled', {
      sourceEventId: seed.sourceEventId,
    });
    trace({
      tick, agentId: holderId, transition: 'grudge_only',
      culpritAgentId: seed.culpritAgentId,
      detail: succeeded ? 'heir is ambient tier' : 'victim is ambient tier',
    });
    return { write: false, outcome: 'grudge_only' };
  }

  const { heat, reignited } = openingHeat(graph, holderId, seed);

  // ── One slot: an existing grievance is fed or displaced, never queued behind ──
  const standing = findActiveGrievanceEdge(graph, holderId);
  if (standing) {
    const standingMagnitude = (standing.properties.harmMagnitude as number) ?? 0;
    const outweighs = seed.harmMagnitude > standingMagnitude * GRIEVANCE_REPLACE_RATIO;

    if (!outweighs) {
      const fedHeat = Math.min(
        GRIEVANCE_HEAT_INITIAL_MAX,
        ((standing.properties.heat as number) ?? 0) + GRIEVANCE_HEAT_FEED * seed.harmMagnitude,
      );
      graph.updateEdge(standing.id, {
        properties: { ...standing.properties, heat: fedHeat },
      });
      trace({
        tick, agentId: holderId, transition: 'heat_fed',
        culpritAgentId: standing.properties.culpritAgentId as string | undefined,
        heat: fedHeat,
        detail: `new harm ${seed.harmMagnitude.toFixed(2)} fed the standing grievance`,
      });
      return { write: false, outcome: 'heat_fed' };
    }

    // The worse harm takes the slot; the displaced one keeps existing as a grudge, so
    // letting it go is never the same as never having felt it.
    demoteGrievanceToGrudge(graph, standing, holderId, tick, 'replaced');
    trace({
      tick, agentId: holderId, transition: 'replaced',
      culpritAgentId: seed.culpritAgentId, heat,
      detail: `harm ${seed.harmMagnitude.toFixed(2)} displaced ${standingMagnitude.toFixed(2)}`,
    });
    return {
      write: true, outcome: 'replaced', holderId, properties: edgeProperties(seed, heat),
    };
  }

  const outcome: GrievanceTransition = succeeded
    ? 'succeeded_to_bond'
    : reignited ? 'reignited' : 'minted';
  trace({
    tick, agentId: holderId, transition: outcome,
    culpritAgentId: seed.culpritAgentId, heat,
    detail: succeeded ? `inherited from ${victimId}` : undefined,
  });
  return { write: true, outcome, holderId, properties: edgeProperties(seed, heat) };
}

/**
 * Demote a grievance edge to a standing grudge.
 *
 * The `pursues` edge closes as **`abandoned`**, not as a new `'resolved'` status. The
 * plan named `'resolved'`, and that is a deliberate, recorded deviation: `AmbitionStatus`
 * is `active | completed | abandoned`, and the arc-panel readers partition on exactly
 * those (`journeyEngine.ts:129-130`). A fourth value would land in neither the completed
 * nor the failed list, so a cooled vendetta would silently vanish from the surface that
 * exists to show it. `abandoned` is also what actually happened: the agent stopped
 * pursuing it. The grudge edge is what remembers.
 */
export function demoteGrievanceToGrudge(
  graph: WorldGraph,
  edge: GraphEdge,
  holderId: string,
  tick: number,
  reason: 'cooled' | 'replaced',
): void {
  const culpritId = edge.properties.culpritAgentId as string | undefined;
  graph.updateEdge(edge.id, {
    properties: {
      ...edge.properties,
      status: 'abandoned',
      resolvedTick: tick,
      // The grievance block stays on the closed edge on purpose: it is the record of
      // what the agent once wanted and why, which is what a provenance read needs.
    },
  });
  if (culpritId) {
    writeGrudge(graph, holderId, culpritId, tick, 'grievance_cooled', {
      sourceEventId: edge.properties.mintedByEventId as string | undefined,
    });
  }
  if (reason === 'cooled') {
    trace({
      tick, agentId: holderId, transition: 'demoted_to_grudge',
      culpritAgentId: culpritId, heat: edge.properties.heat as number | undefined,
      detail: 'heat fell to the cooling threshold',
    });
  }
}

/**
 * Cool one active grievance edge by a milestone pass, demoting it when it goes cold.
 *
 * Rides the existing 15-tick all-actor walk in `phaseAmbitionProgress` — one arithmetic
 * step per grievance edge, no new traversal and no new phase (NFP #7). Decay itself is
 * silent; only crossing the threshold emits, which is what keeps this trace rare.
 *
 * @returns true when the grievance demoted this pass (the caller stops evaluating it).
 */
export function decayGrievance(
  graph: WorldGraph,
  edge: GraphEdge,
  holderId: string,
  tick: number,
): boolean {
  if (edge.properties.grievance !== true) return false;

  const heat = (edge.properties.heat as number | undefined) ?? 0;
  const cooled = heat - GRIEVANCE_HEAT_DECAY_PER_CHECK;

  if (cooled <= GRIEVANCE_COOL_THRESHOLD) {
    demoteGrievanceToGrudge(
      graph,
      { ...edge, properties: { ...edge.properties, heat: cooled } },
      holderId,
      tick,
      'cooled',
    );
    return true;
  }

  graph.updateEdge(edge.id, { properties: { ...edge.properties, heat: cooled } });
  return false;
}
