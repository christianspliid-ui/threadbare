/**
 * Detection pressure written against one mortal's region — the god's teaching price and
 * the divine cast echo (THR-1672).
 *
 * `resolveAgentRegionId` is the region resolution `nudgeDispatch` had private
 * (`resolveActorRegionId`, THR-1690), moved here so a second caller does not copy it.
 * `writeAgentDetection` resolves the region (the fallback bucket when unplaceable) and
 * applies the signed delta through the region detection API.
 *
 * A write that crosses a detection band must trace the crossing and, at the encounter
 * band, plant the rival strike — or it swallows the crossing for the next nudge write.
 * The recorder (`recordDetectionCrossings`) reaches encounter seeding and the content
 * catalogs, and this module's callers sit inside that import graph (`undertaking-objects`
 * → `spellCasting`), so importing it here closes a module cycle that fails at load. It is
 * handed in by the callers that sit outside the cycle (`unifiedActionResolution`,
 * `encounterAftermath`).
 */

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import { resolveRegionId } from './graphConditions';
import { applyRawDetectionDelta } from './encounters/detectionPressure';
import type { recordDetectionCrossings } from './orchestrator/phaseDetectionPressure';

/** The bucket an unplaceable mortal's attention pools under (never escalates). */
export const AGENT_DETECTION_FALLBACK_REGION = 'unknown';

/** The region a mortal stands in, climbing from a sublocation; undefined when unplaceable. */
export function resolveAgentRegionId(graph: WorldGraph, agentId: string | undefined): string | undefined {
  if (!agentId) return undefined;
  const locatedAt = graph.getOutgoingEdges(agentId, 'located_at')[0]?.target;
  if (!locatedAt) return undefined;
  return resolveRegionId(graph, locatedAt);
}

/** The state fields a detection write reads and replaces. */
export type DetectionSink = Pick<GameState, 'graph' | 'regionalDetectionPressure'> & Partial<Pick<GameState, 'pendingEncounterSeeds'>>;

/** The crossing recorder, handed in by a caller outside the module cycle (see the header). */
export type DetectionCrossingRecorder = typeof recordDetectionCrossings;

export interface AgentDetectionWrite {
  readonly regionId: string;
  readonly fromPressure: number;
  readonly toPressure: number;
}

/**
 * Write a signed detection delta into `agentId`'s region, in place on `sink`. Never
 * throws: a failure returns null and leaves the sink untouched.
 */
export function writeAgentDetection(
  sink: DetectionSink,
  agentId: string,
  delta: number,
  tick: number,
  recordCrossings?: DetectionCrossingRecorder,
): AgentDetectionWrite | null {
  try {
    const resolved = resolveAgentRegionId(sink.graph, agentId);
    const regionId = resolved ?? AGENT_DETECTION_FALLBACK_REGION;
    const result = applyRawDetectionDelta(sink.regionalDetectionPressure ?? [], regionId, delta, tick);
    sink.regionalDetectionPressure = result.regionalDetectionPressure;
    // A write that crosses a band traces it and, at the encounter band, plants the
    // rival strike — exactly as the nudge channel does. Never for the fallback bucket.
    if (resolved && recordCrossings) {
      const before = sink.pendingEncounterSeeds ?? [];
      const after = recordCrossings(tick, resolved, result.fromPressure, result.toPressure, agentId, before, sink.graph);
      if (after !== before) sink.pendingEncounterSeeds = [...after];
    }
    return { regionId, fromPressure: result.fromPressure, toPressure: result.toPressure };
  } catch {
    return null;
  }
}
