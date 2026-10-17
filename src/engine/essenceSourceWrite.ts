/**
 * The essence-source writer — the body of the `consecrate_source` graph op, extracted
 * (THR-1935) so a source can be written without a cast: the prayer phase writes a
 * recovered town's `faithfulCommunity` source through it.
 *
 * Writes a typed `essenceSource` bag on the host (sanctity, tier, `discoveredBy`,
 * `originTick`) and ensures the actor's `controls` edge, so `computeSourceIncome`
 * sees it. Idempotent: an already-typed source is left untouched (success). A
 * migrated, untyped place of power is upgraded in place, keeping its sanctity,
 * contested and desecrated state.
 */
import type { WorldGraph } from './graph';
import type { SphereName } from '../types';
import type { EssenceSource, SourceKind } from '../types/essenceSource';
import { readEssenceSource } from './essenceSources';
import { deriveSourceTier } from '../data/essence-sources';

export interface WriteEssenceSourceInput {
  hostId: string;
  /** Who controls the new source (the god). */
  actorId: string;
  sphere: SphereName;
  kind: SourceKind;
  /** Starting sanctity. Absent → the host's existing sanctity, else 0 (the op's rule). */
  sanctity?: number;
  /** The source's origin tick when it has none (the graph-op context may carry none). */
  tick: number | undefined;
  /** Mints the id of a new `controls` edge, called only when one is created. Absent → a stable id from actor and host. */
  nextControlsEdgeId?: () => string;
}

export interface WriteEssenceSourceResult {
  success: boolean;
  error?: string;
  /** The `controls` edge this call created, if any. */
  createdId?: string;
}

export function writeEssenceSource(graph: WorldGraph, input: WriteEssenceSourceInput): WriteEssenceSourceResult {
  const host = graph.getNode(input.hostId);
  if (!host) return { success: false, error: `host ${input.hostId} not found` };

  const existing = readEssenceSource(host.properties);
  // Already a typed source → idempotent success (don't clobber built sanctity).
  if (existing?.sphereAffinity) return { success: true };

  const sanctity = input.sanctity ?? existing?.sanctity ?? 0;
  const contested = !!existing?.contestedBy;
  const desecrated = !!existing?.desecrated;
  const source: EssenceSource = {
    kind: input.kind,
    sphereAffinity: input.sphere,
    sanctity,
    tier: deriveSourceTier(sanctity, { contested, desecrated }),
    discoveredBy: input.actorId,
    contestedBy: existing?.contestedBy,
    desecrated: existing?.desecrated,
    originTick: existing?.originTick ?? input.tick,
  };
  graph.updateNode(host.id, { properties: { ...host.properties, essenceSource: source } });

  // Ensure the actor controls the host so `computeSourceIncome` sees it.
  // THR-1297: an `owns` edge counts too — a node already held as a holding must not be
  // double-claimed onto `controls` as well, or the same claim exists twice under two
  // names and every "who has this" question gets two answers.
  const alreadyControls = graph
    .getOutgoingEdges(input.actorId, 'controls')
    .some((e) => e.target === input.hostId)
    || graph.getOutgoingEdges(input.actorId, 'owns').some((e) => e.target === input.hostId);
  let createdId: string | undefined;
  if (!alreadyControls) {
    createdId = input.nextControlsEdgeId?.() ?? `edge_controls_${input.actorId}_${input.hostId}`;
    graph.addEdge({ id: createdId, source: input.actorId, target: input.hostId, type: 'controls', properties: {} });
  }
  return { success: true, createdId };
}
