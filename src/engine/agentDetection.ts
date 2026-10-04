/**
 * Detection pressure written against one mortal's region — the shared write the nudge
 * detection channel and the god's teaching price both use (THR-1672).
 *
 * `resolveAgentRegionId` is the region resolution `nudgeDispatch` had private
 * (`resolveActorRegionId`, THR-1690), moved beside the write so a second caller does not
 * copy it. `writeAgentDetection` is the same three steps the nudge channel takes: resolve
 * the region (fallback bucket when unplaceable), apply the signed delta, and — for a real
 * region only — trace the band crossings and plant the rival strike at the encounter band.
 */

import type { GameState } from '../types/gameState';
import type { WorldGraph } from './graph';
import { resolveRegionId } from './graphConditions';
import { applyRawDetectionDelta } from './encounters/detectionPressure';
import { recordDetectionCrossings } from './orchestrator/phaseDetectionPressure';

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

export interface AgentDetectionWrite {
  readonly regionId: string;
  readonly fromPressure: number;
  readonly toPressure: number;
}

/**
 * Write a signed detection delta into `agentId`'s region, in place on `sink`. Never
 * throws: a failure returns null and leaves the sink untouched.
 */
export function writeAgentDetection(sink: DetectionSink, agentId: string, delta: number, tick: number): AgentDetectionWrite | null {
  try {
    const resolved = resolveAgentRegionId(sink.graph, agentId);
    const regionId = resolved ?? AGENT_DETECTION_FALLBACK_REGION;
    const result = applyRawDetectionDelta(sink.regionalDetectionPressure ?? [], regionId, delta, tick);
    sink.regionalDetectionPressure = result.regionalDetectionPressure;
    if (resolved) {
      const before = sink.pendingEncounterSeeds ?? [];
      const after = recordDetectionCrossings(tick, resolved, result.fromPressure, result.toPressure, agentId, before, sink.graph);
      if (after !== before) sink.pendingEncounterSeeds = [...after];
    }
    return { regionId, fromPressure: result.fromPressure, toPressure: result.toPressure };
  } catch {
    return null;
  }
}
