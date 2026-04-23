/**
 * Effect Shell Runtime — pure reducer functions for Phase 2 stateful shells.
 *
 * Owns flip_table lifecycle, duplicate-gain policy resolution, and result-band
 * selection. All functions are pure with respect to state: they accept existing
 * maps and return new maps; callers (phaseEffectShells, unifiedActionResolution)
 * merge the results into GameState.
 *
 * Design doc: Docs/plans/2026-04-19-content-architecture-phase-2-stateful-shells.md
 * Linear: THR-53
 */

import { mulberry32 } from '../lib/prng';
import {
  DEFAULT_DUPLICATE_GAIN_POLICY,
  DUPLICATE_WORSEN_DEFAULT_MAX,
  MAX_FLIP_VARIANTS_PER_TEMPLATE,
  RESULT_BAND_FALLBACK_ID,
} from '../data/effect-constants';
import type {
  DuplicateGainPolicy,
  DuplicateGainWorsenRule,
  FlipTableConfig,
  FlipTableFlipTrigger,
  FlipTableRuntimeState,
  FlipTableState,
  FlipTableVariant,
  ResultBandConfig,
  ResultBandSelectionRecord,
} from '../types/contentShells';

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

function makeFlipRuntimeId(templateId: string, flipId: string, ownerActorId: string): string {
  return `flip_table_${templateId}_${flipId}_${ownerActorId}`;
}

// ─── Flip Table ────────────────────────────────────────────────────

/**
 * Initialize flip-table runtime states for templates that declare `flipTables`.
 * Mirrors initializeClearanceGates in structure: idempotent, additive only.
 */
export function initializeFlipTables(
  existingStates: ReadonlyMap<string, FlipTableRuntimeState> | undefined,
  templateId: string,
  flipTables: readonly FlipTableConfig[],
  ownerActorId: string,
  anchorAttachmentId: string | undefined,
  tick: number,
): { flipIds: readonly string[]; flipTableStates: Map<string, FlipTableRuntimeState> } {
  const nextStates = new Map(existingStates ?? []);
  const flipIds: string[] = [];

  for (const config of flipTables) {
    if (config.variants.length === 0) continue;

    const runtimeId = makeFlipRuntimeId(templateId, config.id, ownerActorId);
    flipIds.push(runtimeId);
    if (nextStates.has(runtimeId)) continue;

    const state: FlipTableRuntimeState = {
      runtimeId,
      templateId,
      flipId: config.id,
      ownerActorId,
      anchorAttachmentId,
      state: config.initialState ?? 'front',
      revealedVariantKey: config.preselectVariantKey,
      lastUpdatedTick: tick,
    };
    nextStates.set(runtimeId, state);
  }

  return { flipIds, flipTableStates: nextStates };
}

function pickVariantWeighted(
  variants: readonly FlipTableVariant[],
  rng: () => number,
): FlipTableVariant {
  const uniformWeight = 1 / variants.length;
  const totalWeight = variants.reduce((sum, v) => sum + (v.weight ?? uniformWeight), 0);
  let cursor = rng() * totalWeight;
  for (const v of variants) {
    cursor -= v.weight ?? uniformWeight;
    if (cursor <= 0) return v;
  }
  return variants[variants.length - 1];
}

export interface FlipTableTriggerResult {
  flipTableStates: Map<string, FlipTableRuntimeState>;
  transition: {
    runtimeId: string;
    previousState: FlipTableState;
    nextState: FlipTableState;
    variantKey: string;
  } | undefined;
}

/**
 * Apply a flip trigger to a single runtime state.
 * Returns updated states and a transition record for tracing.
 */
export function applyFlipTableTrigger(
  existingStates: ReadonlyMap<string, FlipTableRuntimeState> | undefined,
  runtimeId: string,
  globalSeed: number,
  tick: number,
): FlipTableTriggerResult {
  const nextStates = new Map(existingStates ?? []);
  const current = nextStates.get(runtimeId);
  if (!current) return { flipTableStates: nextStates, transition: undefined };

  const rng = mulberry32(
    globalSeed + tick * 41 + hashString('flip_table') + hashString(current.templateId) + hashString(runtimeId),
  );

  const config = undefined as FlipTableConfig | undefined;
  // Variant pool is derived from content data; caller provides the config if known.
  // For now we operate on the runtimeId only and rely on inline config resolution in phaseEffectShells.
  void config;

  const previousState = current.state;
  const nextState: FlipTableState = previousState === 'front' ? 'flipped' : 'revealed';

  nextStates.set(runtimeId, {
    ...current,
    state: nextState,
    lastUpdatedTick: tick,
  });

  return {
    flipTableStates: nextStates,
    transition: {
      runtimeId,
      previousState,
      nextState,
      variantKey: current.revealedVariantKey ?? '__none__',
    },
  };
}

/**
 * Apply a flip trigger with full config access (including variant pool).
 * This is the main entry point for phaseEffectShells.
 */
export function applyFlipTableTriggerWithConfig(
  existingStates: ReadonlyMap<string, FlipTableRuntimeState> | undefined,
  runtimeId: string,
  config: FlipTableConfig,
  globalSeed: number,
  tick: number,
): FlipTableTriggerResult {
  const nextStates = new Map(existingStates ?? []);
  const current = nextStates.get(runtimeId);
  if (!current) return { flipTableStates: nextStates, transition: undefined };

  const previousState = current.state;

  // Already revealed — no further transition
  if (previousState === 'revealed') {
    return { flipTableStates: nextStates, transition: undefined };
  }

  const rng = mulberry32(
    globalSeed + tick * 41 + hashString('flip_table') + hashString(current.templateId) + hashString(runtimeId),
  );

  let variantKey = current.revealedVariantKey;
  const nextState: FlipTableState = previousState === 'front' ? 'flipped' : 'revealed';

  if (nextState === 'revealed' || config.revealPolicy === 'immediate') {
    // Pick variant deterministically from the config pool
    const variants = config.variants.slice(0, MAX_FLIP_VARIANTS_PER_TEMPLATE);
    if (variants.length === 0) {
      // Fail-soft: no variants — stay in current state
      if (import.meta.env.DEV) {
        console.warn(`[effectShellRuntime] flip_table ${config.id} has no variants — staying in '${previousState}'`);
      }
      return { flipTableStates: nextStates, transition: undefined };
    }
    const picked = pickVariantWeighted(variants, rng);
    variantKey = picked.key;
  }

  nextStates.set(runtimeId, {
    ...current,
    state: nextState,
    revealedVariantKey: variantKey,
    lastUpdatedTick: tick,
  });

  return {
    flipTableStates: nextStates,
    transition: {
      runtimeId,
      previousState,
      nextState,
      variantKey: variantKey ?? '__none__',
    },
  };
}

// ─── Duplicate-Gain Policy ─────────────────────────────────────────

export type DuplicateGainResolution =
  | { action: 'skip' }
  | { action: 'stack' }
  | { action: 'refresh' }
  | { action: 'apply_worsen'; rule: DuplicateGainWorsenRule; applicationCount: number }
  | { action: 'trigger_flip' };

/**
 * Determine what to do when an attachment is granted to an actor who already holds it.
 * @param policy - from the attachment template; defaults to DEFAULT_DUPLICATE_GAIN_POLICY
 * @param worsenRule - from the attachment template; only consulted when policy === 'worsen'
 * @param currentApplicationCount - how many times worsen has already been applied
 */
export function resolveDuplicateGain(
  policy: DuplicateGainPolicy | undefined,
  worsenRule: DuplicateGainWorsenRule | undefined,
  currentApplicationCount: number,
): DuplicateGainResolution {
  const effectivePolicy = policy ?? DEFAULT_DUPLICATE_GAIN_POLICY;

  switch (effectivePolicy) {
    case 'ignore':
      return { action: 'skip' };
    case 'stack':
      return { action: 'stack' };
    case 'refresh':
      return { action: 'refresh' };
    case 'flip':
      return { action: 'trigger_flip' };
    case 'worsen': {
      const rule = worsenRule ?? { effectsPerReapply: [], maxApplications: DUPLICATE_WORSEN_DEFAULT_MAX };
      const max = rule.maxApplications ?? DUPLICATE_WORSEN_DEFAULT_MAX;
      if (currentApplicationCount >= max) {
        // Degrade to refresh when maxApplications reached
        return { action: 'refresh' };
      }
      return { action: 'apply_worsen', rule, applicationCount: currentApplicationCount };
    }
    default:
      return { action: 'refresh' };
  }
}

// ─── Result Bands ──────────────────────────────────────────────────

/**
 * Select the result band whose threshold is <= margin.
 * Bands are sorted descending by threshold; first match wins.
 * Returns undefined (fallback to existing effect list) if no band matches.
 */
export function selectResultBand(
  bands: readonly ResultBandConfig[] | undefined,
  margin: number,
): ResultBandConfig | undefined {
  if (!bands || bands.length === 0) return undefined;

  const sorted = [...bands].sort((a, b) => b.threshold - a.threshold);
  for (const band of sorted) {
    if (margin >= band.threshold) return band;
  }
  return undefined;
}

/**
 * Build a ResultBandSelectionRecord for the history log.
 * Uses RESULT_BAND_FALLBACK_ID when no band matched.
 */
export function buildBandSelectionRecord(
  templateId: string,
  actorId: string,
  margin: number,
  tick: number,
  selected: ResultBandConfig | undefined,
): ResultBandSelectionRecord {
  if (!selected) {
    return {
      tick,
      actorId,
      templateId,
      margin,
      selectedBandId: RESULT_BAND_FALLBACK_ID,
      selectedLabel: 'fallback',
      selectedOutcomeBand: margin >= 0 ? 'success' : 'failure',
    };
  }
  return {
    tick,
    actorId,
    templateId,
    margin,
    selectedBandId: selected.id,
    selectedLabel: selected.label,
    selectedOutcomeBand: selected.outcomeBand,
  };
}

// ─── Summary ──────────────────────────────────────────────────────

export function summarizeShellUpdates(updates: readonly string[]): string {
  if (updates.length === 0) return '';
  return ` — shells: ${updates.join(', ')}`;
}

// ─── Trigger Matching ─────────────────────────────────────────────

/**
 * Check whether a flip trigger fires for the given step outcome.
 */
export function matchesStepOutcomeTrigger(
  trigger: FlipTableFlipTrigger,
  stepIndex: number,
  outcome: string,
): boolean {
  if (trigger.kind !== 'step_outcome') return false;
  if (trigger.stepIndex !== stepIndex) return false;
  return trigger.outcomes.includes(outcome as import('../types/contentShells').ClearanceGateOutcome);
}
