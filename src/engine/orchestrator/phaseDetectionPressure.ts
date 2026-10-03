import type { GameState, RegionDetectionState } from '../../types/gameState';
import type { DetectionThresholdBand } from '../../types/traces/encounter-traces';
import {
  DETECTION_DECAY_RATE_PER_TICK,
  DETECTION_THRESHOLD_ENCOUNTER,
} from '../../data/encounter-experience-constants';
import type { PendingEncounterSeed } from '../../types/unifiedAction';
import {
  decayDetectionPressure,
  getDetectionThresholdCrossings,
} from '../encounters/detectionPressure';
import { emitTrace } from '../traceBuffer';
import { encounterFamilyAnswersAt, encounterFamilyHasContent } from '../encounterSeeding';
import type { WorldGraph } from '../graph';

const RIVAL_DETECTION_ENCOUNTER_FAMILY = 'shadow.rival_strike';
const RIVAL_DETECTION_SEED_PREFIX = 'detection.escalation';
const RIVAL_DETECTION_SEED_PRIORITY = 100;

export interface DetectionPressurePhaseResult {
  regionalDetectionPressure: RegionDetectionState[];
  regionDetection: RegionDetectionState[];
  pendingEncounterSeeds: PendingEncounterSeed[];
  updatedRegions: number;
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
  seedSkipped?: 'no_target' | 'no_content' | 'already_pending' | 'not_here',
): void {
  emitTrace({
    category: 'detection_threshold_crossed',
    tick,
    regionId,
    fromPressure,
    toPressure,
    thresholdCrossed,
    ...(seedSkipped ? { seedSkipped } : {}),
    summary: `Detection threshold ${thresholdCrossed}: ${regionId} ${fromPressure.toFixed(2)} → ${toPressure.toFixed(2)}`
      + (seedSkipped ? ` (no strike: ${seedSkipped})` : ''),
  });
}

/**
 * Record the threshold crossings of one regional pressure write (THR-964).
 *
 * Emits a `detection_threshold_crossed` trace per band crossed and, when the write
 * reaches ENCOUNTER, plants one `shadow.rival_strike` seed on `targetAgentId` —
 * at most one pending per region. Returns the seed queue, new when a seed was
 * planted and the input otherwise.
 *
 * Extracted from the retired choice-commit loop. Its live caller is the nudge
 * detection write (`nudgeDispatch.dispatchNudgeCommitments`, THR-1690), which
 * calls it after applying a card's signed delta.
 *
 * Fail-soft: the crossings are always traced. The seed is skipped — and the
 * encounter crossing's trace says why (`seedSkipped`) — when there is no
 * `targetAgentId` (a strike needs someone to strike), when the region already
 * holds one, or when the strike family has no encounter to resolve to: a seed
 * with nothing behind it withers into a sentence that prints the family id.
 * Given the `graph`, it also holds a strike back when the family has content but
 * none that can land where the target stands now (`not_here`, THR-1703) — the
 * seed would fire next pass and wither the same way.
 */
export function recordDetectionCrossings(
  tick: number,
  regionId: string,
  fromPressure: number,
  toPressure: number,
  targetAgentId: string | undefined,
  pendingEncounterSeeds: readonly PendingEncounterSeed[],
  graph?: WorldGraph,
): readonly PendingEncounterSeed[] {
  let seeds = pendingEncounterSeeds;
  for (const crossing of getDetectionThresholdCrossings(fromPressure, toPressure)) {
    if (crossing !== 'encounter' || toPressure < DETECTION_THRESHOLD_ENCOUNTER) {
      emitThresholdTrace(tick, regionId, fromPressure, toPressure, crossing);
      continue;
    }
    const seedSkipped = !targetAgentId
      ? 'no_target'
      : hasPendingRegionDetectionSeed(seeds, regionId)
        ? 'already_pending'
        : !encounterFamilyHasContent(RIVAL_DETECTION_ENCOUNTER_FAMILY)
          ? 'no_content'
          : graph && !encounterFamilyAnswersAt(graph, RIVAL_DETECTION_ENCOUNTER_FAMILY, targetAgentId)
            ? 'not_here'
            : undefined;
    emitThresholdTrace(tick, regionId, fromPressure, toPressure, crossing, seedSkipped);
    if (!seedSkipped && targetAgentId) {
      seeds = [...seeds, buildDetectionSeed(tick, regionId, targetAgentId)];
    }
  }
  return seeds;
}

/**
 * Passive decay of regional rival pressure. The writes come from nudge dispatch
 * (`nudgeDispatch.dispatchNudgeCommitments`); this phase only relaxes them.
 */
export function phaseDetectionPressure(state: GameState): DetectionPressurePhaseResult {
  const baseline = state.regionalDetectionPressure ?? state.regionDetection ?? [];
  const decayed = decayDetectionPressure(baseline, DETECTION_DECAY_RATE_PER_TICK, state.tick);

  return {
    regionalDetectionPressure: decayed,
    regionDetection: decayed,
    pendingEncounterSeeds: [...(state.pendingEncounterSeeds ?? [])],
    updatedRegions: 0,
  };
}
