/**
 * The two mortal routes to a faction's seat (THR-1438), and the seating both they and
 * the succession phase go through.
 *
 * A faction's leader has had exactly two authors: the god, who anoints a successor and
 * waits, and the world, which derives a leader from `member_of.rank` whenever nobody
 * is seated. A mortal who wanted the seat could do nothing about it. These ops are the
 * two things a mortal can now do — **stand** for it and **take** it — and neither
 * invents a mechanism: a candidacy writes the same `will_succeed` edge the anointment
 * writes, and a usurpation runs the same seating the phase runs, early.
 *
 * **The phase stays the one arbiter.** `nominateSuccessor` does not seat anybody; it
 * files a claim the phase reads at the next exit, ranked below the god's card and a
 * notable's heir by construction (`CANDIDACY_PRIORITY_BY_BAND` vs
 * `ANOINTMENT_PRIORITY` / `NOTABLE_HEIR_PRIORITY`). `forceSuccession` is the one that
 * moves a seat without waiting, and it moves it through `seatLeader` — the phase's own
 * lines, extracted so there is one seating in the codebase rather than two that must
 * be kept in step.
 *
 * **Nobody dies here.** A coup and a usurpation are decided by the faction and the
 * band the work landed on, never by the blade; the deposed leader keeps their life,
 * their membership and a fresh grudge. Killing a mortal on purpose is the plot's
 * business (THR-1430), and `markMortalDead` is still the only writer of a death.
 *
 * NFP: Inspectability (four `faction_succession` outcomes), Determinism (no draw — the
 * band was rolled by the checkpoint ladder), Fail-soft (every op returns a refusal
 * rather than throwing), Additive (one extraction the phase keeps calling).
 */

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import type { GraphEdge } from '../types/graph';
import type { FactionSuccessionTrace } from '../types/factionAction';
import type { GraphOpResult } from './strategicGraphOps';
import type { SimulationRuntime } from './simulationRuntime';
import { emitTrace } from './traceBuffer';
import { getFactionLeaderId, getAnointedLeaderId } from './factionNetwork';
import { writeGrudge } from './grievance/grudgeEdge';
import { applyReputationWithDelta } from './reputation';
import { applyPlantSchism } from './schismPlant';
import {
  CANDIDACY_PRIORITY_BY_BAND,
  USURPATION_STANDING_LOSS,
  USURPATION_CRITICAL_FAILURE_STANDING_MULT,
  UNDERTAKING_SCHISM_RESOLUTION_DELAY_TICKS,
} from '../data/strategic-action-constants';

/** How a seat was conferred. `'usurpation'` joins the phase's own two (THR-1438). */
export type SeatConferredVia = 'anointment' | 'natural' | 'usurpation';

const fail = (op: string, error: string): GraphOpResult => ({ success: false, op, error });

/** The faction's standing `leads` edge, if any. */
function getLeadsEdge(graph: WorldGraph, factionId: string): GraphEdge | null {
  return graph.getIncomingEdges(factionId, 'leads')[0] ?? null;
}

/**
 * Seat `successorId` as the leader of `factionId` — the phase's own `:244–268`, lifted.
 *
 * Four writes, in this order: the standing `leads` edge is removed, the new one
 * written, the faction's `leaderSnapshotId` re-pointed, and the successor's own
 * `will_succeed` claims to this faction consumed.
 *
 * **`leaderSnapshotId` is not optional.** The succession phase compares the current
 * leader against that snapshot to detect an *exit*; a usurpation that moved the seat
 * without moving the snapshot would read, on the phase's next pass, as the old leader
 * having vanished — and the phase would run a second succession over the top of the
 * one that just happened. That is the kill criterion this extraction exists to make
 * impossible: there is one seating, and it always updates the book.
 *
 * Every `will_succeed` edge from the successor to this faction is consumed, not just
 * one: a re-anointment appends rather than replaces, so a successor can hold several,
 * and a stale one left behind could win a *later* exit for somebody already seated.
 * Other candidates' edges are untouched — they queue for the next exit, as they always did.
 */
export function seatLeader(
  graph: WorldGraph,
  factionId: string,
  successorId: string,
  tick: number,
  conferredVia: SeatConferredVia,
): boolean {
  try {
    if (!graph.getNode(factionId) || !graph.getNode(successorId)) return false;

    const oldLeads = getLeadsEdge(graph, factionId);
    if (oldLeads) graph.removeEdge(oldLeads.id);

    graph.addEdge({
      id: `e_leads_${successorId}_${factionId}_${tick}`,
      source: successorId,
      target: factionId,
      type: 'leads',
      properties: { seatedTick: tick, conferredVia },
    });

    graph.updateNode(factionId, { properties: { leaderSnapshotId: successorId } });

    for (const edge of graph.getOutgoingEdges(successorId, 'will_succeed')) {
      if (edge.target === factionId) graph.removeEdge(edge.id);
    }
    return true;
  } catch {
    // Fail-soft (NFP #4): an unseatable faction keeps the leader it had.
    return false;
  }
}

/** The trace both ops speak through — the phase's category, four new outcomes. */
function emitSuccession(
  graph: WorldGraph,
  tick: number,
  factionId: string,
  outcome: FactionSuccessionTrace['outcome'],
  exitedLeaderId: string | null,
  newLeaderId: string | null,
  summary: string,
): void {
  try {
    emitTrace({
      tick,
      category: 'faction_succession',
      factionId,
      factionName: graph.getNode(factionId)?.name ?? factionId,
      outcome,
      exitedLeaderId,
      exitedLeaderName: exitedLeaderId ? (graph.getNode(exitedLeaderId)?.name ?? null) : null,
      newLeaderId,
      newLeaderName: newLeaderId ? (graph.getNode(newLeaderId)?.name ?? null) : null,
      willSucceedCandidatesConsidered: 0,
      summary,
    } as FactionSuccessionTrace);
  } catch {
    // Tracing never fails the work it describes.
  }
}

/** The bands a work has to reach for its strong arm. Anything else is the failure arm. */
function isWin(band: string | undefined): boolean {
  return band === 'success' || band === 'critical_success';
}

/**
 * File a candidacy — `claim × Faction`.
 *
 * Writes one `will_succeed` edge with the band's `priority`, and nothing at all on a
 * band that did not win: standing for a seat and being taken seriously are the same
 * act here, so a work that went badly leaves no claim behind rather than a weak one.
 *
 * The edge is deliberately indistinguishable in *kind* from an anointment's — the
 * phase reads one list — and distinguishable in *rank*: `CANDIDACY_PRIORITY_BY_BAND`
 * sits below `NOTABLE_HEIR_PRIORITY` below `ANOINTMENT_PRIORITY`, so a mortal's bid
 * never overrules the god's card.
 */
export function nominateSuccessor(
  state: GameState,
  factionId: string,
  actorId: string,
  band: string | undefined,
  tick: number,
): GraphOpResult {
  const graph = state.graph;
  try {
    const faction = graph.getNode(factionId);
    if (!faction || faction.properties.actorType !== 'faction') return fail('nominate_successor', 'faction_not_found');
    if (!graph.getNode(actorId)) return fail('nominate_successor', 'actor_not_found');

    const priority = CANDIDACY_PRIORITY_BY_BAND[band ?? ''];
    if (priority === undefined) {
      // The work did not carry. No claim is filed — and the refusal is named rather
      // than dressed as a success, so the census can tell "stood and lost" from "never stood".
      emitSuccession(graph, tick, factionId, 'natural_succession', null, null,
        `candidacy_withdrawn[${factionId}]: ${graph.getNode(actorId)?.name ?? actorId} stood and was not taken seriously (${band ?? 'no band'})`);
      return fail('nominate_successor', 'band_too_weak');
    }

    graph.addEdge({
      id: `e_will_succeed_${actorId}_${factionId}_${tick}`,
      source: actorId,
      target: factionId,
      type: 'will_succeed',
      properties: {
        anointedTick: tick,
        anointedBy: null,
        conferredVia: 'candidacy',
        priority,
      },
    });

    emitSuccession(graph, tick, factionId, 'candidacy_filed', null, actorId,
      `candidacy_filed[${factionId}]: ${graph.getNode(actorId)?.name ?? actorId} stands for the seat at priority ${priority}`);
    return { success: true, op: 'nominate_successor' };
  } catch (e) {
    return fail('nominate_successor', String(e));
  }
}

/**
 * Usurp a sitting leader — `seize × Faction`. Three arms, read off the band.
 *
 * - **won** → the seat moves through `seatLeader`, conferred `'usurpation'`.
 * - **lost** → the deposed keeps the seat; the usurper takes a grudge from them and a
 *   standing loss with the faction. Reaching for a seat and missing costs something,
 *   or the work is free and everyone attempts it forever.
 * - **lost badly** (`critical_failure`) → the same, and the faction splits through the
 *   live schism op with the usurper as the breakaway. Losing badly enough that the
 *   faction comes apart is the most interesting failure the world already models.
 *
 * A refused schism (one already pending, the faction dissolving) does not undo the
 * failure's other effects — the quarrel and the standing loss stand either way.
 */
export function forceSuccession(
  state: GameState,
  runtime: SimulationRuntime | undefined,
  factionId: string,
  usurperId: string,
  band: string | undefined,
  tick: number,
): GraphOpResult {
  const graph = state.graph;
  try {
    const faction = graph.getNode(factionId);
    if (!faction || faction.properties.actorType !== 'faction') return fail('force_succession', 'faction_not_found');
    if (!graph.getNode(usurperId)) return fail('force_succession', 'actor_not_found');

    const leaderId = getAnointedLeaderId(graph, factionId) ?? getFactionLeaderId(graph, factionId);
    if (!leaderId || leaderId === usurperId) return fail('force_succession', 'no_leader_to_unseat');

    const usurperName = graph.getNode(usurperId)?.name ?? usurperId;
    const factionName = faction.name ?? factionId;

    if (isWin(band)) {
      if (!seatLeader(graph, factionId, usurperId, tick, 'usurpation')) {
        return fail('force_succession', 'seat_not_moved');
      }
      emitSuccession(graph, tick, factionId, 'usurped', leaderId, usurperId,
        `usurped[${factionId}]: ${usurperName} took ${factionName} from ${graph.getNode(leaderId)?.name ?? leaderId}`);
      return { success: true, op: 'force_succession' };
    }

    // Both failure arms: the injury, then the standing.
    writeGrudge(graph, leaderId, usurperId, tick, 'usurpation_failed', { upgradeCause: true });
    const critical = band === 'critical_failure';
    applyReputationWithDelta(
      graph, usurperId, factionId,
      -USURPATION_STANDING_LOSS * (critical ? USURPATION_CRITICAL_FAILURE_STANDING_MULT : 1),
      tick, 'usurpation_failed',
    );

    if (critical) {
      const split = applyPlantSchism(state, runtime, factionId, usurperId, UNDERTAKING_SCHISM_RESOLUTION_DELAY_TICKS, tick);
      if (split) {
        emitSuccession(graph, tick, factionId, 'usurpation_split', leaderId, leaderId,
          `usurpation_split[${factionId}]: ${usurperName} failed and ${factionName} is coming apart behind them`);
        return { success: true, op: 'force_succession' };
      }
    }

    emitSuccession(graph, tick, factionId, 'usurpation_failed', leaderId, leaderId,
      `usurpation_failed[${factionId}]: ${usurperName} reached for ${factionName} and did not take it`);
    // The work failed, but its consequences landed — reported as a completed op so the
    // grudge and the standing loss are not mistaken for an op that never ran.
    return { success: true, op: 'force_succession' };
  } catch (e) {
    return fail('force_succession', String(e));
  }
}
