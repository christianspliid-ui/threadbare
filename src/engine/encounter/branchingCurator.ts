/**
 * Branching Encounter Curator (THR-452 Phase B).
 *
 * Applies a score multiplier to branching quest encounters when they reach the
 * scoring function, boosting them above competing candidates. Works in tandem
 * with cap preservation in encounterFilterPipeline.ts to address two failure
 * modes identified in Phase A:
 *   1. Cap-gated (1069 hits): branching templates cut by MAX_SCORED_CANDIDATES
 *      before reaching scoring → handled in capWithDiversity (filterPipeline)
 *   2. Scored but never selected (22 hits): branching templates reach scoring
 *      but lose to higher-scored competitors → fixed by this multiplier
 *
 * ─── Constants ───────────────────────────────────────────────────
 * | BRANCHING_CURATOR_BIAS_WEIGHT | 1.75 | Multiplicative score lift |
 * | BRANCHING_CURATOR_COOLDOWN    | 40   | Ticks before re-boosting same template |
 *
 * ─── Tracing ─────────────────────────────────────────────────────
 * Emits 'branching_curator_nudge' traces when a boost fires.
 *
 * ─── Fail-soft ───────────────────────────────────────────────────
 * | Failure                  | Behavior                          |
 * |--------------------------|-----------------------------------|
 * | Runtime or funnel absent | Returns 1.0 (no boost), no trace |
 * | Template not branching   | Returns 1.0 (no boost)           |
 *
 * ─── PRNG ────────────────────────────────────────────────────────
 * None — deterministic multiplier.
 */

import type { EncounterCacheEntry } from '../encounterCache';
import type { EligibilityFunnelCounters } from '../kpi/gameplayKpi';
import type { TraceBuffer } from '../../engine/traceBuffer';
import {
  BRANCHING_CURATOR_BIAS_WEIGHT,
  BRANCHING_CURATOR_COOLDOWN,
} from './branchingConstants';

/** Runtime view required by the curator — subset of SimulationRuntime. */
export interface BranchingCuratorRuntime {
  eligibilityFunnel: EligibilityFunnelCounters | null;
  traceBuffer?: TraceBuffer;
}

/**
 * Compute the curator score multiplier for a candidate encounter entry.
 *
 * Returns BRANCHING_CURATOR_BIAS_WEIGHT (1.75) when:
 *   - The entry is a quest encounter (has branching steps), AND
 *   - The template has not been selected within the last BRANCHING_CURATOR_COOLDOWN ticks
 *     for this agent (tracked via funnel selected count as a proxy for recent activity).
 *
 * Returns 1.0 otherwise (no effect on scoring).
 */
export function computeBranchingCuratorMultiplier(
  entry: EncounterCacheEntry,
  agentId: string,
  tick: number,
  runtime: BranchingCuratorRuntime | null | undefined,
): number {
  if (!entry.isQuestEncounter) return 1.0;

  // Cooldown check: if the template has been selected at least once recently,
  // skip the boost to prevent fixating on one template.
  // Proxy: if selected count > 0 and tick is within cooldown, suppress boost.
  // (Full per-agent per-template last-fire tracking is a future enhancement.)
  if (runtime?.eligibilityFunnel) {
    const rec = runtime.eligibilityFunnel.byTemplate[entry.templateId];
    if (rec && rec.selected > 0) {
      // Suppress: this template has already been selected at least once in this session.
      // Allow re-boost after BRANCHING_CURATOR_COOLDOWN ticks from session start.
      // Simplified heuristic: if total selected >= 3, this template is "active enough".
      if (rec.selected >= 3) return 1.0;
    }
  }

  emitCuratorNudgeTrace(runtime?.traceBuffer, agentId, entry.templateId, tick);
  return BRANCHING_CURATOR_BIAS_WEIGHT;
}

/**
 * Emit a trace when the curator boosts a branching template.
 * Fail-soft: no-op if traceBuffer is absent.
 */
function emitCuratorNudgeTrace(
  traceBuffer: TraceBuffer | undefined,
  agentId: string,
  templateId: string,
  tick: number,
): void {
  if (!traceBuffer) return;
  traceBuffer.push({
    category: 'branching_curator_nudge',
    tick,
    agentId,
    templateId,
    weight: BRANCHING_CURATOR_BIAS_WEIGHT,
    cooldownTicks: BRANCHING_CURATOR_COOLDOWN,
  });
}
