/**
 * Phase 6.71: Intelligence Reliability Decay (THR-137)
 *
 * Each tick, after the grace period, reliability on every IntelligenceRecord
 * falls by INTEL_RELIABILITY_DECAY_PER_TICK. When a record crosses a descriptor
 * threshold (reliable→uncertain or uncertain→dubious), a low-significance chronicle
 * event is emitted so the fade is observable to the player.
 *
 * Runs immediately after phaseHiddenMarkDecay (6.7) to cluster all decay phases
 * (marks / intel / omens) adjacently.
 *
 * Pure arithmetic — no PRNG, no graph writes. Deterministic given same input state.
 */

import type { GameState, TickEvent } from '../types/gameState';
import { MAX_RECENT_EVENTS } from '../types/gameState';
import type { IntelligenceRecord } from '../types/unifiedAction';
import { emitTrace } from './traceBuffer';
import {
  INTEL_RELIABILITY_DECAY_PER_TICK,
  INTEL_RELIABILITY_FLOOR,
  INTEL_RELIABILITY_GRACE_TICKS,
  INTEL_DECAY_EVENT_SIGNIFICANCE,
  reliabilityBand,
  type ReliabilityBand,
} from './intelligence';
import {
  STALENESS_PROSE_RELIABLE_TO_UNCERTAIN,
  STALENESS_PROSE_UNCERTAIN_TO_DUBIOUS,
} from '../data/intelligence-staleness-prose';

function resolveStalenessMessage(
  state: GameState,
  record: IntelligenceRecord,
  oldBand: ReliabilityBand,
  newBand: ReliabilityBand,
): string {
  const table =
    oldBand === 'reliable' && newBand === 'uncertain'
      ? STALENESS_PROSE_RELIABLE_TO_UNCERTAIN
      : STALENESS_PROSE_UNCERTAIN_TO_DUBIOUS;

  // Fail-soft guard: empty prose table must not throw (NFP #4)
  if (table.length === 0) {
    return `Knowledge of ${record.label ?? record.category} is fading for ${record.agentId}.`;
  }

  // Deterministic pick: no PRNG read; stable across replays
  const idx = record.recordId.length % table.length;
  let prose = table[idx];

  // Resolve {agent.name}
  let agentName = record.agentId;
  try {
    const node = state.graph?.getNode?.(record.agentId);
    if (node?.name) agentName = node.name;
  } catch {
    // Graph failure → use agentId as fallback (NFP #4)
  }

  prose = prose
    .replace(/\{agent\.name\}/g, agentName)
    .replace(/\{intel\.label\}/g, record.label ?? record.category);

  return prose;
}

function buildStalenessEvent(
  state: GameState,
  record: IntelligenceRecord,
  oldBand: ReliabilityBand,
  newBand: ReliabilityBand,
  tick: number,
): TickEvent {
  return {
    id: `intelligence_decay_${record.recordId}_${tick}`,
    tick,
    type: 'intelligence_decay',
    message: resolveStalenessMessage(state, record, oldBand, newBand),
    significance: INTEL_DECAY_EVENT_SIGNIFICANCE,
    actorId: record.agentId,
  };
}

export function phaseIntelligenceDecay(state: GameState): Partial<GameState> {
  const records = state.intelligenceRecords;
  if (!records || records.length === 0) return {};

  const tick = state.tick;
  const nextRecords: IntelligenceRecord[] = [];
  const decayEvents: TickEvent[] = [];
  let changed = false;

  for (const record of records) {
    // Fail-soft for legacy records missing acquiredTick — warn each occurrence
    // (no dedup flag: module-level state causes test isolation issues per Codex review)
    const acquiredTick = record.acquiredTick ?? 0;
    if (record.acquiredTick == null) {
      console.warn('[phaseIntelligenceDecay] Record missing acquiredTick; treating as age 0:', record.recordId);
    }

    const age = tick - acquiredTick;

    // Grace period — fresh intel doesn't decay
    if (age < INTEL_RELIABILITY_GRACE_TICKS) {
      nextRecords.push(record);
      continue;
    }

    const rawReliability = Number.isFinite(record.reliability) && record.reliability >= 0
      ? record.reliability
      : INTEL_RELIABILITY_FLOOR;

    const decayedReliability = Math.max(
      INTEL_RELIABILITY_FLOOR,
      rawReliability - INTEL_RELIABILITY_DECAY_PER_TICK,
    );

    // Already at floor — no change needed
    if (decayedReliability === rawReliability) {
      nextRecords.push(record);
      continue;
    }

    changed = true;

    const oldBand = reliabilityBand(rawReliability);
    const newBand = reliabilityBand(decayedReliability);
    const crossedThreshold = oldBand !== newBand ? newBand : undefined;

    if (crossedThreshold) {
      decayEvents.push(buildStalenessEvent(state, record, oldBand, newBand, tick));
    }

    try {
      emitTrace({
        tick,
        category: 'intelligence_decayed',
        summary: `Intel ${record.recordId} (${record.category}) decayed: ${rawReliability.toFixed(3)} → ${decayedReliability.toFixed(3)}${crossedThreshold ? ` (now ${crossedThreshold})` : ''}`,
        recordId: record.recordId,
        agentId: record.agentId,
        intelCategory: record.category,
        reliabilityBefore: rawReliability,
        reliabilityAfter: decayedReliability,
        delta: rawReliability - decayedReliability,
        crossedThreshold,
      });
    } catch {
      // Trace failure must never block the reliability update (NFP #4)
    }

    nextRecords.push({ ...record, reliability: decayedReliability });
  }

  if (!changed) return {};
  if (decayEvents.length === 0) return { intelligenceRecords: nextRecords };
  return {
    intelligenceRecords: nextRecords,
    tickEvents: [...state.tickEvents, ...decayEvents],
    recentEvents: [...state.recentEvents, ...decayEvents].slice(-MAX_RECENT_EVENTS),
  };
}
