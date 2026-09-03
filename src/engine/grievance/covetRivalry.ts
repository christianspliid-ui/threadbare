/**
 * The covet rivalry — what a mortal cannot take, they come to hate (THR-1388).
 *
 * Plan: `Docs/plans/2026-09-03-thr-1388-covet-rivalry.md`.
 *
 * The motive gate asks a destroy verb for a quarrel and the world, on the quiet seeds,
 * never wrote one: every `no_motive` refusal measured on seeds 42 and 99 was a
 * conqueror aiming at a holding whose owner was simply not their rival, and the only
 * writers of mortal-to-mortal `hostile_to` were mentorship breaks and the grievance
 * lane itself — the loop's seed was its own output. This module lets coveting write
 * the quarrel: a mortal pursuing a destroy-heavy ambition who is refused a destroy
 * against the same owner `COVET_RIVALRY_THRESHOLD` boards running gains a
 * `hostile_to` edge with provenance `covets`, which the gate reads as **rivalry** —
 * never as a grudge, so it cannot mint a vendetta by itself; only the harm it
 * licenses can, through the existing lane.
 *
 * The counter is bookkeeping about one mortal's frustration, so it is a property
 * (`actor.properties.covet`), not an edge; the relationship is the edge it becomes.
 * Deterministic: a count over the refusal list the board already produced, no rng.
 */
import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import { emitTrace } from '../traceBuffer';
import { findAmbitionTemplate } from '../strategicActionCandidates';
import { resolveTargetOwners } from '../undertakingMotive';
import { getAgentFaction } from '../graphQueries';
import { writeCovetRivalry } from './grudgeEdge';
import {
  COVET_RIVALRY_THRESHOLD,
  COVET_SWITCH_BELOW,
  MAX_COVET_RIVALRIES_PER_ACTOR,
} from '../../data/grievance-constants';

/** The refusal prefix the counter reads. `no_motive_unowned:` (nobody holds it) is never counted. */
const COUNTED_REFUSAL_PREFIX = 'no_motive:';

export interface CovetRecord {
  readonly ownerId: string;
  readonly count: number;
  readonly sinceTick: number;
  readonly targetId: string;
  readonly ambitionId: string;
}

export interface CovetRefusal {
  readonly templateId: string;
  readonly reason: string;
}

export interface CovetSeedResult {
  readonly ownerId: string;
  readonly targetId: string;
  readonly refusals: number;
  readonly ambitionId: string;
}

/** Whether any of the actor's active ambitions has a destroy-heavy strategic profile. */
export function destroyHeavyAmbitionId(ambitionTemplateIds: readonly string[]): string | undefined {
  for (const id of ambitionTemplateIds) {
    const template = findAmbitionTemplate(id);
    if (template?.strategicProfile?.preferredVerbs?.includes('destroy')) return id;
  }
  return undefined;
}

export function readCovetRecord(actor: GraphNode | undefined): CovetRecord | undefined {
  const raw = actor?.properties.covet as Partial<CovetRecord> | undefined;
  if (!raw || typeof raw.ownerId !== 'string' || typeof raw.count !== 'number') return undefined;
  return raw as CovetRecord;
}

/** True when the actor already holds a live covet edge (cause `covets`). */
export function covetEdgeCount(graph: WorldGraph, actorId: string): number {
  try {
    return graph.getOutgoingEdges(actorId, 'hostile_to').filter(e => e.properties.cause === 'covets').length;
  } catch {
    return 0;
  }
}

/**
 * Feed one board's refusals into the actor's covet counter; seed the rivalry when the
 * threshold is reached. Returns the seed when an edge was written this call.
 *
 * Fail-soft throughout (NFP #4): a missing target, a missing owner, an owner that is
 * the ascendant or the actor's own faction, or an actor already holding a covet edge
 * all return without writing, and a writer that throws returns undefined.
 */
export function recordCovetRefusals(
  graph: WorldGraph,
  actorId: string,
  refusals: readonly CovetRefusal[],
  ambitionTemplateIds: readonly string[],
  tick: number,
  ascendantId: string | undefined,
): CovetSeedResult | undefined {
  try {
    const actor = graph.getNode(actorId);
    if (!actor) return undefined;
    const ambitionId = destroyHeavyAmbitionId(ambitionTemplateIds);
    if (!ambitionId) return undefined;
    if (covetEdgeCount(graph, actorId) >= MAX_COVET_RIVALRIES_PER_ACTOR) return undefined;

    const counted = refusals.filter(r => r.reason.startsWith(COUNTED_REFUSAL_PREFIX));
    if (counted.length === 0) return undefined;

    const actorFactionId = getAgentFaction(graph, actorId)?.faction.id;
    let record = readCovetRecord(actor);

    for (const refusal of counted) {
      const targetId = refusal.reason.slice(COUNTED_REFUSAL_PREFIX.length);
      if (!targetId || !graph.getNode(targetId)) continue;
      for (const ownerId of resolveTargetOwners(graph, targetId)) {
        if (ownerId === actorId) continue;
        if (ascendantId && ownerId === ascendantId) continue;
        if (actorFactionId && ownerId === actorFactionId) continue;
        if (getAgentFaction(graph, ownerId)?.faction.id === actorFactionId && actorFactionId) continue;

        if (!record || (record.ownerId !== ownerId && record.count < COVET_SWITCH_BELOW)) {
          record = { ownerId, count: 0, sinceTick: tick, targetId, ambitionId };
        }
        if (record.ownerId !== ownerId) continue;
        record = { ...record, count: record.count + 1, targetId };
        // One refusal per owner per board: a template that refuses the same owner three
        // ways on one board is one day of coveting, not three.
        break;
      }
    }
    if (!record) return undefined;

    if (record.count >= COVET_RIVALRY_THRESHOLD) {
      const wrote = writeCovetRivalry(graph, actorId, record.ownerId, tick, { sourceTargetId: record.targetId });
      delete actor.properties.covet;
      if (!wrote) return undefined;
      const owner = graph.getNode(record.ownerId);
      emitTrace({
        category: 'covet_rivalry_seeded',
        tick,
        actorId,
        ownerId: record.ownerId,
        targetId: record.targetId,
        refusals: record.count,
        ambitionId: record.ambitionId,
        summary: `${actor.name} comes to hate ${owner?.name ?? record.ownerId} over ${graph.getNode(record.targetId)?.name ?? record.targetId} (${record.count} boards refused)`,
      });
      return { ownerId: record.ownerId, targetId: record.targetId, refusals: record.count, ambitionId: record.ambitionId };
    }
    actor.properties.covet = record;
    return undefined;
  } catch {
    // A covet that fails to count costs a story, never the tick.
    return undefined;
  }
}
