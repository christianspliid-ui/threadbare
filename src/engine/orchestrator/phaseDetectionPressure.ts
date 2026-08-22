import type { GameState, PendingChoiceCommit, RegionDetectionState } from '../../types/gameState';
import type { DetectionThresholdBand, EncounterChoiceCost } from '../../types/traces/encounter-traces';
import {
  DETECTION_DECAY_RATE_PER_TICK,
  DETECTION_THRESHOLD_ENCOUNTER,
} from '../../data/encounter-experience-constants';
import type { PendingEncounterSeed } from '../../types/unifiedAction';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import {
  applyDetectionDelta,
  decayDetectionPressure,
  getDetectionThresholdCrossings,
} from '../encounters/detectionPressure';
import { emitTrace } from '../traceBuffer';
import { resolveToParentLocation } from '../sublocationShape';

const RIVAL_DETECTION_ENCOUNTER_FAMILY = 'shadow.rival_strike';
const RIVAL_DETECTION_SEED_PREFIX = 'detection.escalation';
const RIVAL_DETECTION_SEED_PRIORITY = 100;

export interface DetectionPressurePhaseResult {
  regionalDetectionPressure: RegionDetectionState[];
  regionDetection: RegionDetectionState[];
  pendingEncounterSeeds: PendingEncounterSeed[];
  updatedRegions: number;
}

function resolveRegionIdForAgent(state: GameState, agentId: string): string | null {
  const locatedAt = state.graph.getOutgoingEdges(agentId, 'located_at')[0];
  if (!locatedAt) return null;

  // THR-1183: resolve through the shared discriminator. The old `node.type ===
  // 'sublocation'` test skipped the resolve for a canonical sublocation (a `location`
  // node with a `parentLocationId`), which then fell through and read `regionId` off the
  // sublocation itself — a property the sublocation writers do not copy — so every agent
  // standing in a worldgen sublocation resolved to no region at all.
  const node = resolveToParentLocation(state.graph, state.graph.getNode(locatedAt.target));
  if (!node || node.type !== 'location') return null;

  const regionId = node.properties?.regionId;
  return typeof regionId === 'string' && regionId.length > 0 ? regionId : null;
}

function resolveSphereVisibilityMultiplier(state: GameState, encounterId: string): number {
  const template = getUnifiedTemplateById(encounterId);
  if (!template?.sphereAffinity) return 1;
  const identity = state.ascendantIdentity?.sphereAlignment;
  if (!identity) return 1;
  if (template.sphereAffinity === identity.primary) return 0.8;
  if (template.sphereAffinity === identity.secondary) return 1;
  return 1.2;
}

function buildDetectionSeed(
  tick: number,
  regionId: string,
  targetAgentId: string,
): PendingEncounterSeed {
  const seedId = `${RIVAL_DETECTION_SEED_PREFIX}.${regionId}.${tick}.${targetAgentId}`;
  return {
    seedId,
    sourceEncounterId: `${RIVAL_DETECTION_SEED_PREFIX}.${regionId}`,
    sourceReactionId: 'detection_threshold_encounter',
    encounterFamily: RIVAL_DETECTION_ENCOUNTER_FAMILY,
    targetAgentId,
    eligibleAfterTick: tick,
    priority: RIVAL_DETECTION_SEED_PRIORITY,
    seedLabel: `Rival detection pressure peaks in ${regionId}`,
    plantedTick: tick,
  };
}

function hasPendingRegionDetectionSeed(
  seeds: readonly PendingEncounterSeed[],
  regionId: string,
): boolean {
  return seeds.some((seed) =>
    seed.sourceReactionId === 'detection_threshold_encounter'
    && seed.sourceEncounterId === `${RIVAL_DETECTION_SEED_PREFIX}.${regionId}`
  );
}

function emitThresholdTrace(
  tick: number,
  regionId: string,
  fromPressure: number,
  toPressure: number,
  thresholdCrossed: DetectionThresholdBand,
): void {
  emitTrace({
    category: 'detection_threshold_crossed',
    tick,
    regionId,
    fromPressure,
    toPressure,
    thresholdCrossed,
    summary: `Detection threshold ${thresholdCrossed}: ${regionId} ${fromPressure.toFixed(2)} → ${toPressure.toFixed(2)}`,
  });
}

export function phaseDetectionPressure(state: GameState): DetectionPressurePhaseResult {
  const commits: readonly PendingChoiceCommit[] = state.pendingChoiceCommits ?? [];
  const baseline = state.regionalDetectionPressure ?? state.regionDetection ?? [];
  let pressure = [...baseline];
  let pendingEncounterSeeds = [...(state.pendingEncounterSeeds ?? [])];
  const touched = new Set<string>();

  for (const commit of commits) {
    const regionId = resolveRegionIdForAgent(state, commit.agentId);
    if (!regionId) continue;

    const visibility = resolveSphereVisibilityMultiplier(state, commit.encounterId);
    const result = applyDetectionDelta(
      pressure,
      regionId,
      commit.cost as EncounterChoiceCost,
      visibility,
      state.tick,
    );
    pressure = result.regionalDetectionPressure;
    touched.add(regionId);

    const crossings = getDetectionThresholdCrossings(result.fromPressure, result.toPressure);
    for (const crossing of crossings) {
      emitThresholdTrace(state.tick, regionId, result.fromPressure, result.toPressure, crossing);
      if (
        crossing === 'encounter'
        && result.toPressure >= DETECTION_THRESHOLD_ENCOUNTER
        && !hasPendingRegionDetectionSeed(pendingEncounterSeeds, regionId)
      ) {
        pendingEncounterSeeds = [...pendingEncounterSeeds, buildDetectionSeed(state.tick, regionId, commit.agentId)];
      }
    }
  }

  const decayed = decayDetectionPressure(pressure, DETECTION_DECAY_RATE_PER_TICK, state.tick);

  return {
    regionalDetectionPressure: decayed,
    regionDetection: decayed,
    pendingEncounterSeeds,
    updatedRegions: touched.size,
  };
}
