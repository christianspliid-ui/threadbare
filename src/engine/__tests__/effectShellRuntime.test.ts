import { describe, expect, it } from 'vitest';
import type { FlipTableConfig, FlipTableRuntimeState } from '../../types/contentShells';
import {
  initializeFlipTables,
  applyFlipTableTriggerWithConfig,
  resolveDuplicateGain,
  selectResultBand,
  buildBandSelectionRecord,
  matchesStepOutcomeTrigger,
} from '../effectShellRuntime';
import type { ResultBandConfig } from '../../types/contentShells';

// ─── helpers ────────────────────────────────────────────────────────

const FLIP_CONFIG: FlipTableConfig = {
  id: 'fate_card',
  variants: [
    { key: 'boon', weight: 1, label: 'Boon' },
    { key: 'bane', weight: 1, label: 'Bane' },
  ],
  initialState: 'front',
  flipTrigger: { kind: 'step_outcome', stepIndex: 0, outcomes: ['success'] },
  persistence: 'must-persist',
};

function makeRuntimeState(overrides: Partial<FlipTableRuntimeState> = {}): FlipTableRuntimeState {
  return {
    runtimeId: 'flip_table_template_a_fate_card_actor_1',
    templateId: 'template_a',
    flipId: 'fate_card',
    ownerActorId: 'actor_1',
    state: 'front',
    lastUpdatedTick: 0,
    ...overrides,
  };
}

// ─── initializeFlipTables ────────────────────────────────────────────

describe('initializeFlipTables', () => {
  it('creates a runtime state entry for each config', () => {
    const { flipTableStates, flipIds } = initializeFlipTables(
      undefined,
      'template_a',
      [FLIP_CONFIG],
      'actor_1',
      undefined,
      1,
    );
    expect(flipIds).toHaveLength(1);
    expect(flipTableStates.size).toBe(1);
    const state = flipTableStates.get(flipIds[0]);
    expect(state?.state).toBe('front');
    expect(state?.flipId).toBe('fate_card');
  });

  it('is idempotent — does not overwrite existing entries', () => {
    const existing = new Map<string, FlipTableRuntimeState>([
      ['flip_table_template_a_fate_card_actor_1', makeRuntimeState({ state: 'flipped' })],
    ]);
    const { flipTableStates } = initializeFlipTables(existing, 'template_a', [FLIP_CONFIG], 'actor_1', undefined, 5);
    expect(flipTableStates.get('flip_table_template_a_fate_card_actor_1')?.state).toBe('flipped');
  });

  it('skips configs with no variants', () => {
    const emptyConfig: FlipTableConfig = { ...FLIP_CONFIG, variants: [] };
    const { flipIds } = initializeFlipTables(undefined, 't', [emptyConfig], 'a', undefined, 1);
    expect(flipIds).toHaveLength(0);
  });
});

// ─── applyFlipTableTriggerWithConfig ─────────────────────────────────

describe('applyFlipTableTriggerWithConfig', () => {
  it('transitions front → flipped and returns a transition record', () => {
    const states = new Map([
      ['flip_table_t_fate_card_a1', makeRuntimeState({ state: 'front' })],
    ]);
    const result = applyFlipTableTriggerWithConfig(states, 'flip_table_t_fate_card_a1', FLIP_CONFIG, 42, 10);
    expect(result.transition).toBeDefined();
    expect(result.transition?.previousState).toBe('front');
    expect(result.transition?.nextState).toBe('flipped');
    expect(result.flipTableStates.get('flip_table_t_fate_card_a1')?.state).toBe('flipped');
  });

  it('transitions flipped → revealed and picks a variant', () => {
    const states = new Map([
      ['id', makeRuntimeState({ runtimeId: 'id', state: 'flipped' })],
    ]);
    const result = applyFlipTableTriggerWithConfig(states, 'id', FLIP_CONFIG, 42, 11);
    expect(result.transition?.nextState).toBe('revealed');
    const variantKey = result.transition?.variantKey;
    expect(['boon', 'bane']).toContain(variantKey);
  });

  it('no-ops when already revealed', () => {
    const states = new Map([
      ['id', makeRuntimeState({ runtimeId: 'id', state: 'revealed', revealedVariantKey: 'boon' })],
    ]);
    const result = applyFlipTableTriggerWithConfig(states, 'id', FLIP_CONFIG, 42, 12);
    expect(result.transition).toBeUndefined();
  });

  it('returns no transition when runtimeId is unknown', () => {
    const result = applyFlipTableTriggerWithConfig(new Map(), 'unknown', FLIP_CONFIG, 42, 1);
    expect(result.transition).toBeUndefined();
  });

  it('picks variant immediately on front→flipped when revealPolicy is immediate', () => {
    const immediateConfig: FlipTableConfig = { ...FLIP_CONFIG, revealPolicy: 'immediate' };
    const states = new Map([['id', makeRuntimeState({ runtimeId: 'id', state: 'front' })]]);
    const result = applyFlipTableTriggerWithConfig(states, 'id', immediateConfig, 42, 10);
    expect(result.transition?.nextState).toBe('flipped');
    expect(['boon', 'bane']).toContain(result.transition?.variantKey);
  });

  it('is deterministic — same seed + tick → same variant', () => {
    const run = () => {
      const states = new Map([['id', makeRuntimeState({ runtimeId: 'id', state: 'flipped' })]]);
      return applyFlipTableTriggerWithConfig(states, 'id', FLIP_CONFIG, 42, 99).transition?.variantKey;
    };
    expect(run()).toBe(run());
  });
});

// ─── resolveDuplicateGain ────────────────────────────────────────────

describe('resolveDuplicateGain', () => {
  it('returns skip for ignore policy', () => {
    expect(resolveDuplicateGain('ignore', undefined, 0).action).toBe('skip');
  });

  it('returns stack for stack policy', () => {
    expect(resolveDuplicateGain('stack', undefined, 0).action).toBe('stack');
  });

  it('returns refresh for refresh policy', () => {
    expect(resolveDuplicateGain('refresh', undefined, 0).action).toBe('refresh');
  });

  it('returns trigger_flip for flip policy', () => {
    expect(resolveDuplicateGain('flip', undefined, 0).action).toBe('trigger_flip');
  });

  it('degrades to refresh when worsen reaches max', () => {
    const result = resolveDuplicateGain('worsen', { maxApplications: 2, effectsPerReapply: [] }, 2);
    expect(result.action).toBe('refresh');
  });

  it('returns apply_worsen when below max', () => {
    const result = resolveDuplicateGain('worsen', { maxApplications: 3, effectsPerReapply: [] }, 1);
    expect(result.action).toBe('apply_worsen');
  });

  it('uses DEFAULT_DUPLICATE_GAIN_POLICY (refresh) when policy is undefined', () => {
    expect(resolveDuplicateGain(undefined, undefined, 0).action).toBe('refresh');
  });
});

// ─── selectResultBand ────────────────────────────────────────────────

describe('selectResultBand', () => {
  const bands: ResultBandConfig[] = [
    { id: 'crit', threshold: 15, label: 'Critical', outcomeBand: 'critical_success', effects: [], followOnTags: [] },
    { id: 'success', threshold: 5, label: 'Success', outcomeBand: 'success', effects: [] },
    { id: 'fail', threshold: -5, label: 'Fail', outcomeBand: 'failure', effects: [] },
  ];

  it('returns the highest band whose threshold is <= margin', () => {
    expect(selectResultBand(bands, 20)?.id).toBe('crit');
    expect(selectResultBand(bands, 10)?.id).toBe('success');
    expect(selectResultBand(bands, 0)?.id).toBe('fail');
  });

  it('returns undefined when margin is below all thresholds', () => {
    expect(selectResultBand(bands, -10)).toBeUndefined();
  });

  it('returns undefined for empty or missing bands', () => {
    expect(selectResultBand([], 10)).toBeUndefined();
    expect(selectResultBand(undefined, 10)).toBeUndefined();
  });
});

// ─── buildBandSelectionRecord ─────────────────────────────────────────

describe('buildBandSelectionRecord', () => {
  it('builds a record from a selected band', () => {
    const band: ResultBandConfig = {
      id: 'success', threshold: 5, label: 'Success', outcomeBand: 'success', effects: [],
    };
    const record = buildBandSelectionRecord('t', 'a', 10, 5, band);
    expect(record.selectedBandId).toBe('success');
    expect(record.selectedOutcomeBand).toBe('success');
    expect(record.margin).toBe(10);
  });

  it('uses RESULT_BAND_FALLBACK_ID when no band selected', () => {
    const record = buildBandSelectionRecord('t', 'a', -20, 5, undefined);
    expect(record.selectedBandId).toBe('__fallback__');
    expect(record.selectedOutcomeBand).toBe('failure');
  });
});

// ─── matchesStepOutcomeTrigger ────────────────────────────────────────

describe('matchesStepOutcomeTrigger', () => {
  const trigger = { kind: 'step_outcome' as const, stepIndex: 1, outcomes: ['success' as const] };

  it('matches when stepIndex and outcome align', () => {
    expect(matchesStepOutcomeTrigger(trigger, 1, 'success')).toBe(true);
  });

  it('does not match wrong stepIndex', () => {
    expect(matchesStepOutcomeTrigger(trigger, 0, 'success')).toBe(false);
  });

  it('does not match wrong outcome', () => {
    expect(matchesStepOutcomeTrigger(trigger, 1, 'failure')).toBe(false);
  });

  it('returns false for non-step_outcome trigger kind', () => {
    const manualTrigger = { kind: 'manual' as const };
    expect(matchesStepOutcomeTrigger(manualTrigger, 1, 'success')).toBe(false);
  });
});
