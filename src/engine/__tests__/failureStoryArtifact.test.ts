import { describe, expect, it } from 'vitest';
import {
  guaranteeFailureStoryArtifact,
  detectExistingStoryArtifact,
  FAILURE_ARTIFACT_SEVERITY_BY_SCALE,
  FAILURE_ARTIFACT_CATEGORY,
  type FailureStoryCounters,
} from '../failureStoryArtifact';
import type { GameState } from '../../types/gameState';
import type { UnifiedAction, UnifiedActionOutcome, ActionScale, HiddenMark } from '../../types/unifiedAction';

// ─── Fixtures ────────────────────────────────────────────────────

function makeState(overrides?: Partial<GameState>): GameState {
  return {
    hiddenMarks: [],
    tickEvents: [],
    recentEvents: [],
    ...overrides,
  } as unknown as GameState;
}

function makeAction(overrides?: Partial<UnifiedAction>): UnifiedAction {
  return {
    actionId: 'act-1',
    actorId: 'agent-1',
    templateId: 'social.tavern.brawl',
    targetId: 'target-1',
    scale: 'local' as ActionScale,
    source: 'agent',
    startTick: 5,
    currentStep: 0,
    stepProgress: 0,
    stepDuration: 1,
    resolved: true,
    outcome: 'failure' as UnifiedActionOutcome,
    stepOutcomes: ['failure'],
    ...overrides,
  } as unknown as UnifiedAction;
}

function counters(): FailureStoryCounters {
  return { failureOutcomesTotal: 0, failureStoryArtifactsTotal: 0 };
}

// ─── No-op for non-failure outcomes ──────────────────────────────

describe('guaranteeFailureStoryArtifact — non-failure outcomes', () => {
  it('is a no-op for clean success (no counter bump, no mark)', () => {
    const c = counters();
    const state = makeState();
    const next = guaranteeFailureStoryArtifact(state, makeAction({ outcome: 'success' }), 10, c);
    expect(next).toBe(state);
    expect(c.failureOutcomesTotal).toBe(0);
    expect(c.failureStoryArtifactsTotal).toBe(0);
  });

  it('is a no-op for success_at_cost (already carries its own cost)', () => {
    const c = counters();
    const next = guaranteeFailureStoryArtifact(makeState(), makeAction({ outcome: 'success_at_cost' }), 10, c);
    expect(c.failureOutcomesTotal).toBe(0);
    expect(next.hiddenMarks).toEqual([]);
  });
});

// ─── Fallback mark for bare failures ─────────────────────────────

describe('guaranteeFailureStoryArtifact — fallback mark', () => {
  it('plants a scale-appropriate hidden mark for a bare failure and bumps both counters', () => {
    const c = counters();
    const next = guaranteeFailureStoryArtifact(makeState(), makeAction({ scale: 'local' }), 10, c);
    expect(c.failureOutcomesTotal).toBe(1);
    expect(c.failureStoryArtifactsTotal).toBe(1);
    expect(next.hiddenMarks).toHaveLength(1);
    const mark = next.hiddenMarks![0];
    expect(mark.markId).toBe('fail_artifact_act-1');
    expect(mark.targetAgentId).toBe('agent-1');
    expect(mark.category).toBe(FAILURE_ARTIFACT_CATEGORY.failure);
    expect(mark.severity).toBe(FAILURE_ARTIFACT_SEVERITY_BY_SCALE.local);
    expect(mark.placedTick).toBe(10);
    // The failing template's family is discoverable.
    expect(mark.revealFamilies).toContain('social');
  });

  it('uses the critical_failure category + higher severity for a cosmic crit-fail', () => {
    const c = counters();
    const next = guaranteeFailureStoryArtifact(
      makeState(),
      makeAction({ outcome: 'critical_failure', scale: 'cosmic', templateId: 'ritual.sundering' }),
      12,
      c,
    );
    const mark = next.hiddenMarks![0];
    expect(mark.category).toBe(FAILURE_ARTIFACT_CATEGORY.critical_failure);
    expect(mark.severity).toBe(FAILURE_ARTIFACT_SEVERITY_BY_SCALE.cosmic);
    expect(mark.severity).toBeGreaterThan(FAILURE_ARTIFACT_SEVERITY_BY_SCALE.local);
    // A template family not in the defaults is appended so it can still be revealed.
    expect(mark.revealFamilies).toContain('ritual');
  });

  it('appends a low-significance chronicle event (below the toast threshold)', () => {
    const next = guaranteeFailureStoryArtifact(makeState(), makeAction(), 10, counters());
    expect(next.tickEvents).toHaveLength(1);
    expect(next.tickEvents[0].significance).toBeLessThan(0.5);
    expect(next.recentEvents).toHaveLength(1);
  });

  it('does not double-plant when the fallback mark already exists (idempotent)', () => {
    const existing: HiddenMark = {
      markId: 'fail_artifact_act-1',
      category: 'reputation_note',
      severity: 0.4,
      label: 'A misstep, quietly remembered',
      sourceEncounterId: 'social.tavern.brawl',
      placedTick: 8,
      targetAgentId: 'agent-1',
    };
    const c = counters();
    const next = guaranteeFailureStoryArtifact(makeState({ hiddenMarks: [existing] }), makeAction(), 10, c);
    expect(next.hiddenMarks).toHaveLength(1);
    // Counter still credits the failure as story-covered.
    expect(c.failureStoryArtifactsTotal).toBe(1);
  });

  it('works without a runtime (counters optional) and still plants the mark', () => {
    const next = guaranteeFailureStoryArtifact(makeState(), makeAction(), 10, undefined);
    expect(next.hiddenMarks).toHaveLength(1);
  });
});

// ─── Existing-artifact detection (no redundant fallback) ─────────

describe('guaranteeFailureStoryArtifact — existing artifacts', () => {
  it('detects a step complication and does NOT plant a fallback mark', () => {
    const c = counters();
    const action = makeAction({
      stepComplications: [
        { templateId: 'comp.humiliation', category: 'social', severity: 'minor', prose: '', name: '', narrativeTag: '', significanceBoost: 0 },
      ],
    });
    const next = guaranteeFailureStoryArtifact(makeState(), action, 10, c);
    expect(next.hiddenMarks).toEqual([]);
    expect(c.failureOutcomesTotal).toBe(1);
    expect(c.failureStoryArtifactsTotal).toBe(1);
    expect(detectExistingStoryArtifact(makeState(), action)).toEqual({ kind: 'complication', refId: 'comp.humiliation' });
  });

  it('detects a mark planted by this action aftermath and does NOT plant a fallback', () => {
    const priorMark: HiddenMark = {
      markId: 'mark_act-1_reaction_0',
      category: 'betrayal',
      severity: 0.5,
      label: 'Betrayed a friend',
      sourceEncounterId: 'social.tavern.brawl',
      placedTick: 10,
      targetAgentId: 'agent-1',
    };
    const c = counters();
    const state = makeState({ hiddenMarks: [priorMark] });
    const next = guaranteeFailureStoryArtifact(state, makeAction(), 10, c);
    // No new fallback mark — the aftermath already planted one.
    expect(next.hiddenMarks).toHaveLength(1);
    expect(c.failureStoryArtifactsTotal).toBe(1);
  });

  it('detects an encounter-seed future hook on aftermathChanges', () => {
    const action = makeAction({
      aftermathChanges: [
        { id: 'hook-1', kind: 'future_hook', title: 'A grudge festers', detail: '', polarity: 'info' },
      ],
    });
    expect(detectExistingStoryArtifact(makeState(), action)).toEqual({ kind: 'seed', refId: 'hook-1' });
    const c = counters();
    const next = guaranteeFailureStoryArtifact(makeState(), action, 10, c);
    expect(next.hiddenMarks).toEqual([]);
    expect(c.failureStoryArtifactsTotal).toBe(1);
  });

  it('does NOT treat a bare reputation change as a story artifact (plants fallback)', () => {
    const action = makeAction({
      aftermathChanges: [
        { id: 'rep-1', kind: 'reputation', title: 'Lost standing', detail: '', polarity: 'loss' },
      ],
    });
    expect(detectExistingStoryArtifact(makeState(), action)).toBeNull();
    const next = guaranteeFailureStoryArtifact(makeState(), action, 10, counters());
    expect(next.hiddenMarks).toHaveLength(1);
  });
});
