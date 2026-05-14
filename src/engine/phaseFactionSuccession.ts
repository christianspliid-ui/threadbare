/**
 * Phase Faction Succession — THR-432.
 *
 * Runs in the `post-narrative` slot, after `phaseAgentLifecycle` (so deaths
 * this tick are already applied) and `phaseNarrative`. For each faction:
 *
 *   1. Resolve the current leader via `getAnointedLeaderId` (authoritative)
 *      with fall-through to score derivation (`getFactionLeaderId`).
 *   2. Compare against the faction's `leaderSnapshotId` cache.
 *   3. On first observation: bootstrap the snapshot, emit `snapshot_bootstrapped`.
 *   4. On peaceful overtake (leader changed by score, snapshot agent still a
 *      member): re-point the snapshot; no succession fires. If a will_succeed
 *      successor self-seated by climbing the score ladder, clear their pending
 *      edge.
 *   5. On true exit (snapshot agent no longer a living member of the faction):
 *      run anointed-succession resolution. The highest-recency living anointed
 *      successor (most recent `anointedTick`, with `priority` override) inherits.
 *      They receive a `leads` edge and a planted `faction.encounter.inheritance`
 *      seed. If no successor resolves, fall back to natural score derivation —
 *      the world keeps running silently.
 *
 * Fail-soft (NFP #4): per-faction try/catch; never crashes the tick.
 * Determinism (NFP #3): seeded PRNG for equal-recency tiebreak.
 * Tunability (NFP #1): constants in faction-action-constants.ts.
 *
 * Plan: Docs/plans/2026-05-14-THR-432-anoint-successor.md §5.3.
 */
import type { GameState } from '../types/gameState';
import type { GraphNode, GraphEdge } from '../types/graph';
import type { WorldGraph } from './graph';
import type { FactionSuccessionTrace } from '../types/factionAction';
import { emitTrace } from './traceBuffer';
import { getAnointedLeaderId, getFactionLeaderId } from './factionNetwork';
import {
  INHERITANCE_ENCOUNTER_DELAY,
  INHERITANCE_SEEDED_ENCOUNTER_ID,
  SUCCESSION_PRIORITY_TIEBREAK_SALT,
} from '../data/faction-action-constants';

// ─── PRNG (mulberry32 — same as phaseFactionActions for determinism) ─────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** True when the agent is a living member of `factionId` (non-army). */
function isLivingMemberOf(
  graph: WorldGraph,
  agentId: string,
  factionId: string,
): boolean {
  const node = graph.getNode(agentId);
  if (!node || node.type !== 'actor') return false;
  if (node.properties.armyState != null || node.properties.actorType === 'group') return false;
  return graph
    .getOutgoingEdges(agentId, 'member_of')
    .some(e => e.target === factionId);
}

/** Resolve the current leader id (anointed first, else score-derived). */
function resolveCurrentLeader(graph: WorldGraph, factionId: string): string | null {
  return getAnointedLeaderId(graph, factionId) ?? getFactionLeaderId(graph, factionId);
}

/** Find the existing `leads` edge for a faction, if any. */
function getLeadsEdge(graph: WorldGraph, factionId: string): GraphEdge | null {
  return graph.getIncomingEdges(factionId, 'leads')[0] ?? null;
}

/**
 * Order living will_succeed candidates for succession resolution.
 *
 * Priority order: `priority` (desc, when set) → `anointedTick` (desc — recency
 * wins, "a god's current will supersedes an older one"). On exact ties, use
 * the seeded PRNG to pick from the tied set (NFP #3).
 */
function pickSuccessor(
  candidates: GraphEdge[],
  rng: () => number,
): GraphEdge | null {
  if (candidates.length === 0) return null;

  // Sort: priority desc (treating unset as -Infinity so explicit overrides win),
  // then anointedTick desc.
  const sorted = [...candidates].sort((a, b) => {
    const pa = (a.properties.priority as number | undefined) ?? Number.NEGATIVE_INFINITY;
    const pb = (b.properties.priority as number | undefined) ?? Number.NEGATIVE_INFINITY;
    if (pa !== pb) return pb - pa;
    const ta = (a.properties.anointedTick as number | undefined) ?? 0;
    const tb = (b.properties.anointedTick as number | undefined) ?? 0;
    return tb - ta;
  });

  // Collect the top-tier tied set (same priority, same anointedTick).
  const top = sorted[0];
  const tpa = (top.properties.priority as number | undefined) ?? Number.NEGATIVE_INFINITY;
  const tta = (top.properties.anointedTick as number | undefined) ?? 0;
  const tied = sorted.filter(e => {
    const p = (e.properties.priority as number | undefined) ?? Number.NEGATIVE_INFINITY;
    const t = (e.properties.anointedTick as number | undefined) ?? 0;
    return p === tpa && t === tta;
  });
  if (tied.length === 1) return tied[0];

  // Stable seeded pick over the tied set (the PRNG seed in this call site is
  // factionId-scoped + tick-scoped, so different ties on different factions or
  // ticks resolve independently).
  const i = Math.floor(rng() * tied.length);
  return tied[Math.min(i, tied.length - 1)];
}

// ─── Public phase entrypoint ─────────────────────────────────────────────────

export function phaseFactionSuccession(state: GameState): void {
  const factionNodes = state.graph
    .getNodesByType('actor')
    .filter(n => n.properties.actorType === 'faction');

  for (const faction of factionNodes) {
    try {
      processFactionSuccession(state, faction);
    } catch {
      // Fail-soft: skip this faction. The tick loop must never crash.
    }
  }
}

function processFactionSuccession(state: GameState, faction: GraphNode): void {
  const factionId = faction.id;
  const factionName = faction.name;
  const graph = state.graph;

  const currentLeaderId = resolveCurrentLeader(graph, factionId);
  const snapshotId = (faction.properties.leaderSnapshotId as string | null | undefined) ?? null;
  const snapshotEverSet = 'leaderSnapshotId' in faction.properties;

  // Step 3: bootstrap on first observation.
  if (!snapshotEverSet) {
    graph.updateNode(factionId, { properties: { leaderSnapshotId: currentLeaderId } });
    emitTrace({
      tick: state.tick,
      category: 'faction_succession',
      factionId,
      factionName,
      outcome: 'snapshot_bootstrapped',
      exitedLeaderId: null,
      exitedLeaderName: null,
      newLeaderId: currentLeaderId,
      newLeaderName: currentLeaderId ? (graph.getNode(currentLeaderId)?.name ?? null) : null,
      willSucceedCandidatesConsidered: 0,
      summary: `succession_snapshot[${factionId}]: bootstrapped → ${currentLeaderId ?? 'null'}`,
    });
    return;
  }

  // Step 4a: nothing changed — leader is the same agent as snapshot. Done.
  if (snapshotId === currentLeaderId) return;

  const snapshotStillMember = snapshotId
    ? isLivingMemberOf(graph, snapshotId, factionId)
    : false;

  // Step 4: snapshot agent is still a living member but no longer the leader.
  // Treat as peaceful overtake — the snapshot leader was eclipsed, not exited.
  // Anointed threads wait for a true exit; just re-point the snapshot.
  if (snapshotStillMember && snapshotId) {
    // Cleanup nicety: if a will_succeed successor for this faction *is* now the
    // current leader (they climbed by score), remove their pending edge.
    if (currentLeaderId) {
      const successorEdges = graph.getIncomingEdges(factionId, 'will_succeed');
      const selfSeatEdge = successorEdges.find(e => e.source === currentLeaderId);
      if (selfSeatEdge) {
        graph.removeEdge(selfSeatEdge.id);
        graph.updateNode(factionId, { properties: { leaderSnapshotId: currentLeaderId } });
        emitTrace({
          tick: state.tick,
          category: 'faction_succession',
          factionId,
          factionName,
          outcome: 'successor_self_seated',
          exitedLeaderId: snapshotId,
          exitedLeaderName: graph.getNode(snapshotId)?.name ?? null,
          newLeaderId: currentLeaderId,
          newLeaderName: graph.getNode(currentLeaderId)?.name ?? null,
          willSucceedCandidatesConsidered: successorEdges.length,
          summary:
            `succession_self_seated[${factionId}]: anointed successor ${currentLeaderId} climbed unaided; edge consumed`,
        });
        return;
      }
    }
    graph.updateNode(factionId, { properties: { leaderSnapshotId: currentLeaderId } });
    emitTrace({
      tick: state.tick,
      category: 'faction_succession',
      factionId,
      factionName,
      outcome: 'peaceful_overtake',
      exitedLeaderId: snapshotId,
      exitedLeaderName: graph.getNode(snapshotId)?.name ?? null,
      newLeaderId: currentLeaderId,
      newLeaderName: currentLeaderId ? (graph.getNode(currentLeaderId)?.name ?? null) : null,
      willSucceedCandidatesConsidered: 0,
      summary:
        `succession_peaceful_overtake[${factionId}]: snapshot ${snapshotId} eclipsed by ${currentLeaderId ?? 'null'}`,
    });
    return;
  }

  // Step 5: leader exit detected. Snapshot agent is no longer a living member of
  // this faction (died, expelled, schism'd away). Run succession resolution.
  const willSucceedEdges = graph.getIncomingEdges(factionId, 'will_succeed');
  const livingCandidates = willSucceedEdges.filter(e =>
    isLivingMemberOf(graph, e.source, factionId),
  );

  const rng = mulberry32(
    state.seed
      + state.tick
      + hashString(factionId)
      + SUCCESSION_PRIORITY_TIEBREAK_SALT,
  );

  const winner = pickSuccessor(livingCandidates, rng);
  const exitedLeaderName = snapshotId ? (graph.getNode(snapshotId)?.name ?? null) : null;

  if (winner) {
    // a. Remove any existing `leads` edge (rare — would only be stale).
    const oldLeads = getLeadsEdge(graph, factionId);
    if (oldLeads) graph.removeEdge(oldLeads.id);

    // b. Add new leads edge.
    const successorId = winner.source;
    const leadsEdgeId = `e_leads_${successorId}_${factionId}_${state.tick}`;
    graph.addEdge({
      id: leadsEdgeId,
      source: successorId,
      target: factionId,
      type: 'leads',
      properties: {
        seatedTick: state.tick,
        conferredVia: 'anointment',
      },
    });

    // c. Update snapshot to the new leader.
    graph.updateNode(factionId, { properties: { leaderSnapshotId: successorId } });

    // d. Consume the resolved will_succeed edge. Lower-priority queued
    //    successors remain for the next exit.
    graph.removeEdge(winner.id);

    // e. Plant the inheritance encounter on the new leader.
    const seedId = `seed_inheritance_${factionId}_${state.tick}`;
    const newSeed = {
      seedId,
      sourceEncounterId: `tick_faction_succession_${state.tick}`,
      sourceReactionId: 'faction.tick_succession_resolved',
      templateId: INHERITANCE_SEEDED_ENCOUNTER_ID,
      targetAgentId: successorId,
      eligibleAfterTick: state.tick + INHERITANCE_ENCOUNTER_DELAY,
      priority: 0.85,
      seedLabel: `${graph.getNode(successorId)?.name ?? 'a successor'} inherits ${factionName}`,
      plantedTick: state.tick,
    };
    state.pendingEncounterSeeds = [
      ...(state.pendingEncounterSeeds ?? []),
      newSeed,
    ];

    emitTrace({
      tick: state.tick,
      category: 'faction_succession',
      factionId,
      factionName,
      outcome: 'anointed_inherited',
      exitedLeaderId: snapshotId,
      exitedLeaderName,
      newLeaderId: successorId,
      newLeaderName: graph.getNode(successorId)?.name ?? null,
      willSucceedCandidatesConsidered: livingCandidates.length,
      seededEncounterId: seedId,
      conferredVia: 'anointment',
      summary:
        `succession_anointed[${factionId}]: ${exitedLeaderName ?? 'leader'} exited; `
        + `${graph.getNode(successorId)?.name ?? successorId} inherits via anointment`,
    });
    return;
  }

  // f. No successor resolved. Fall back to score derivation; clean up any stale
  //    leads edge pointing at the gone leader.
  const staleLeads = getLeadsEdge(graph, factionId);
  if (staleLeads && (snapshotId == null || staleLeads.source === snapshotId)) {
    graph.removeEdge(staleLeads.id);
  }
  graph.updateNode(factionId, { properties: { leaderSnapshotId: currentLeaderId } });
  emitTrace({
    tick: state.tick,
    category: 'faction_succession',
    factionId,
    factionName,
    outcome: 'natural_succession',
    exitedLeaderId: snapshotId,
    exitedLeaderName,
    newLeaderId: currentLeaderId,
    newLeaderName: currentLeaderId ? (graph.getNode(currentLeaderId)?.name ?? null) : null,
    willSucceedCandidatesConsidered: livingCandidates.length,
    summary:
      `succession_natural[${factionId}]: ${exitedLeaderName ?? 'leader'} exited; `
      + `no anointed successor — fell back to score derivation`,
  });
}
