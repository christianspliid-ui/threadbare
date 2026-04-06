/**
 * Condition Overflow Consequences.
 *
 * When conditions exceed their slot cap, overflow consequences fire:
 * - Wounds at cap → incapacitation check
 * - Diseases at cap → mortality check
 * - Curses at cap → corruption check (axiological drift)
 * - Blessings at cap → transcendence check (oldest fades or bestowed power)
 * - Bestowed at cap → rejection (new power rejected)
 *
 * Each consequence is encounter-generating — they produce narrative moments,
 * not silent cap enforcement.
 *
 * Design doc: Docs/plans/2026-04-06-attachment-slot-system-design.md
 */

import type { ConditionOverflowTrace } from '../types/trace';
import {
  WOUND_INCAPACITATION_CHECK_DIFFICULTY,
  DISEASE_MORTALITY_CHECK_DIFFICULTY,
  CURSE_CORRUPTION_DRIFT_PER_TICK,
  BLESSING_FADE_OLDEST_FIRST,
  BESTOWED_REJECTION_THRESHOLD,
} from '../data/attachment-slot-constants';
import type { SlotInventoryEntry } from './attachmentSlotResolver';

// ─── Types ────────────────────────────────────────────────────────

export type ConditionOverflowEvent =
  | 'incapacitation_check'
  | 'mortality_check'
  | 'corruption_check'
  | 'transcendence_check'
  | 'rejection';

export interface ConditionOverflowResult {
  event: ConditionOverflowEvent;
  outcome: 'passed' | 'failed';
  /** Edge ID of a condition to deactivate/remove (e.g. oldest blessing fading). */
  removeEdgeId?: string;
  /** Trait ID to add as consequence (scar, corruption, etc.). */
  consequenceTraitId?: string;
  /** Trace payload ready to emit. */
  tracePayload: Omit<ConditionOverflowTrace, 'id' | 'tick' | 'timestamp' | 'summary'>;
}

// ─── Overflow Resolution ──────────────────────────────────────────

/**
 * Resolve a condition overflow event.
 *
 * @param slotTag - Which condition slot overflowed (wound, disease, curse, blessing, bestowed)
 * @param count - Current active count in this slot
 * @param cap - Effective cap for this slot
 * @param items - Active items in this slot (for selecting victims)
 * @param agentId - Agent affected
 * @param roll - Seeded roll 0.0–1.0 for check resolution
 */
export function resolveConditionOverflow(
  slotTag: string,
  count: number,
  cap: number,
  items: SlotInventoryEntry[],
  agentId: string,
  roll: number,
): ConditionOverflowResult | null {
  switch (slotTag) {
    case 'wound':
      return resolveWoundOverflow(count, cap, agentId, roll);
    case 'disease':
      return resolveDiseaseOverflow(count, cap, agentId, roll);
    case 'curse':
      return resolveCurseOverflow(count, cap, agentId, roll);
    case 'blessing':
      return resolveBlessingOverflow(count, cap, items, agentId);
    case 'bestowed':
      return resolveBestowedOverflow(count, cap, items, agentId);
    default:
      // Unknown condition slot — fail soft, skip
      return null;
  }
}

function resolveWoundOverflow(
  count: number, cap: number, agentId: string, roll: number,
): ConditionOverflowResult {
  const passed = roll > WOUND_INCAPACITATION_CHECK_DIFFICULTY;
  return {
    event: 'incapacitation_check',
    outcome: passed ? 'passed' : 'failed',
    consequenceTraitId: passed ? undefined : 'scar',
    tracePayload: {
      category: 'condition_overflow',
      agentId,
      conditionSlot: 'wound',
      currentCount: count,
      cap,
      overflowEvent: 'incapacitation_check',
      outcome: passed ? 'passed' : 'failed',
      consequenceTraitId: passed ? undefined : 'scar',
    },
  };
}

function resolveDiseaseOverflow(
  count: number, cap: number, agentId: string, roll: number,
): ConditionOverflowResult {
  const passed = roll > DISEASE_MORTALITY_CHECK_DIFFICULTY;
  return {
    event: 'mortality_check',
    outcome: passed ? 'passed' : 'failed',
    consequenceTraitId: passed ? undefined : 'scar',
    tracePayload: {
      category: 'condition_overflow',
      agentId,
      conditionSlot: 'disease',
      currentCount: count,
      cap,
      overflowEvent: 'mortality_check',
      outcome: passed ? 'passed' : 'failed',
      consequenceTraitId: passed ? undefined : 'scar',
    },
  };
}

function resolveCurseOverflow(
  count: number, cap: number, agentId: string, roll: number,
): ConditionOverflowResult {
  // Curses always "fail" — corruption is inevitable
  const passed = roll > 0.7; // 30% chance of mild outcome
  return {
    event: 'corruption_check',
    outcome: passed ? 'passed' : 'failed',
    consequenceTraitId: passed ? undefined : 'corruption',
    tracePayload: {
      category: 'condition_overflow',
      agentId,
      conditionSlot: 'curse',
      currentCount: count,
      cap,
      overflowEvent: 'corruption_check',
      outcome: passed ? 'passed' : 'failed',
      consequenceTraitId: passed ? undefined : 'corruption',
    },
  };
}

function resolveBlessingOverflow(
  count: number, cap: number, items: SlotInventoryEntry[], agentId: string,
): ConditionOverflowResult {
  // Oldest blessing fades (divine attention is fickle)
  let removeEdgeId: string | undefined;
  if (BLESSING_FADE_OLDEST_FIRST && items.length > 0) {
    const sorted = [...items].sort((a, b) => a.acquiredTick - b.acquiredTick);
    removeEdgeId = sorted[0].edgeId;
  }

  return {
    event: 'transcendence_check',
    outcome: 'passed', // blessings always resolve gracefully
    removeEdgeId,
    tracePayload: {
      category: 'condition_overflow',
      agentId,
      conditionSlot: 'blessing',
      currentCount: count,
      cap,
      overflowEvent: 'transcendence_check',
      outcome: 'passed',
    },
  };
}

function resolveBestowedOverflow(
  count: number, cap: number, items: SlotInventoryEntry[], agentId: string,
): ConditionOverflowResult {
  // Mortal vessels have limits — the newest power is rejected
  let removeEdgeId: string | undefined;
  if (items.length > 0) {
    const sorted = [...items].sort((a, b) => b.acquiredTick - a.acquiredTick);
    removeEdgeId = sorted[0].edgeId;
  }

  return {
    event: 'rejection',
    outcome: 'failed',
    removeEdgeId,
    tracePayload: {
      category: 'condition_overflow',
      agentId,
      conditionSlot: 'bestowed',
      currentCount: count,
      cap,
      overflowEvent: 'rejection',
      outcome: 'failed',
    },
  };
}
