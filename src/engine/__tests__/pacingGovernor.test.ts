import { describe, it, expect } from 'vitest';
import {
  canFireStoryBeat,
  enqueueStoryBeat,
  dequeueStoryBeat,
  completeStoryBeat,
} from '../pacingGovernor';
import type { PacingState } from '../pacingGovernor';
import type { QueuedStoryBeat } from '../../types/attention';
import {
  STORY_BEAT_COOLDOWN,
  STORY_BEAT_QUEUE_MAX,
} from '../../data/attention-constants';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeState(overrides: Partial<PacingState> = {}): PacingState {
  return {
    activeStoryBeat: null,
    lastCompletedTick: -999,
    queue: [],
    ...overrides,
  };
}

function makeBeat(
  encounterId: string,
  priority: QueuedStoryBeat['priority'] = 'template_intrinsic',
  queuedTick = 0,
): QueuedStoryBeat {
  return {
    encounterId,
    agentId: `agent_${encounterId}`,
    priority,
    queuedTick,
    hexCol: 0,
    hexRow: 0,
  };
}

// ── canFireStoryBeat ──────────────────────────────────────────────────────────

describe('canFireStoryBeat', () => {
  it('returns true when slot is free and enough ticks have elapsed', () => {
    const state = makeState({ lastCompletedTick: 0 });
    expect(canFireStoryBeat(state, STORY_BEAT_COOLDOWN + 1)).toBe(true);
  });

  it('returns false when a beat is currently active', () => {
    const state = makeState({ activeStoryBeat: 'enc_1', lastCompletedTick: 0 });
    expect(canFireStoryBeat(state, STORY_BEAT_COOLDOWN + 1)).toBe(false);
  });

  it('returns false when cooldown has not elapsed', () => {
    const state = makeState({ lastCompletedTick: 10 });
    expect(canFireStoryBeat(state, 10 + STORY_BEAT_COOLDOWN - 1)).toBe(false);
  });

  it('returns true exactly at the cooldown tick (>= is allowed)', () => {
    // Check: currentTick - lastCompletedTick < STORY_BEAT_COOLDOWN
    // → STORY_BEAT_COOLDOWN - 0 < STORY_BEAT_COOLDOWN → false → can fire
    const state = makeState({ lastCompletedTick: 0 });
    expect(canFireStoryBeat(state, STORY_BEAT_COOLDOWN)).toBe(true);
  });

  it('returns true when lastCompletedTick is far in the past', () => {
    const state = makeState({ lastCompletedTick: -999 });
    expect(canFireStoryBeat(state, 1)).toBe(true);
  });
});

// ── enqueueStoryBeat ──────────────────────────────────────────────────────────

describe('enqueueStoryBeat', () => {
  it('adds a beat to an empty queue and returns null (no demotion)', () => {
    const state = makeState();
    const demoted = enqueueStoryBeat(state, makeBeat('enc_1'));
    expect(demoted).toBeNull();
    expect(state.queue).toHaveLength(1);
    expect(state.queue[0].encounterId).toBe('enc_1');
  });

  it('sorts queue with higher-priority beats first', () => {
    const state = makeState();
    enqueueStoryBeat(state, makeBeat('enc_low', 'template_intrinsic'));
    enqueueStoryBeat(state, makeBeat('enc_high', 'doom_clock'));
    expect(state.queue[0].priority).toBe('doom_clock');
    expect(state.queue[1].priority).toBe('template_intrinsic');
  });

  it('demotes the lowest-priority beat when queue exceeds cap', () => {
    const state = makeState();
    // Fill queue to the cap
    for (let i = 0; i < STORY_BEAT_QUEUE_MAX; i++) {
      enqueueStoryBeat(state, makeBeat(`enc_${i}`, 'template_intrinsic'));
    }
    // Add a high-priority beat — the existing ones should be demoted
    const demoted = enqueueStoryBeat(state, makeBeat('enc_doom', 'doom_clock'));
    expect(state.queue).toHaveLength(STORY_BEAT_QUEUE_MAX);
    // Demoted beat is the lowest priority one (template_intrinsic)
    expect(demoted).not.toBeNull();
    expect(demoted!.priority).toBe('template_intrinsic');
    // The doom_clock beat is now in the queue
    expect(state.queue[0].encounterId).toBe('enc_doom');
  });

  it('does not demote when queue is below cap', () => {
    const state = makeState();
    enqueueStoryBeat(state, makeBeat('enc_1'));
    const demoted = enqueueStoryBeat(state, makeBeat('enc_2'));
    expect(demoted).toBeNull();
    expect(state.queue).toHaveLength(2);
  });
});

// ── dequeueStoryBeat ──────────────────────────────────────────────────────────

describe('dequeueStoryBeat', () => {
  it('returns the highest-priority beat when conditions permit', () => {
    const state = makeState({ lastCompletedTick: -999 });
    enqueueStoryBeat(state, makeBeat('enc_a', 'template_intrinsic'));
    enqueueStoryBeat(state, makeBeat('enc_b', 'doom_clock'));

    const beat = dequeueStoryBeat(state, 1);
    expect(beat).not.toBeNull();
    expect(beat!.encounterId).toBe('enc_b');
    expect(state.activeStoryBeat).toBe('enc_b');
    expect(state.queue).toHaveLength(1);
  });

  it('returns null when a beat is already active', () => {
    const state = makeState({ activeStoryBeat: 'current', lastCompletedTick: -999 });
    enqueueStoryBeat(state, makeBeat('enc_a'));
    const beat = dequeueStoryBeat(state, 1);
    expect(beat).toBeNull();
  });

  it('returns null when cooldown has not elapsed', () => {
    const state = makeState({ lastCompletedTick: 100 });
    enqueueStoryBeat(state, makeBeat('enc_a'));
    const beat = dequeueStoryBeat(state, 100 + STORY_BEAT_COOLDOWN - 1);
    expect(beat).toBeNull();
  });

  it('returns null when queue is empty', () => {
    const state = makeState({ lastCompletedTick: -999 });
    const beat = dequeueStoryBeat(state, 1);
    expect(beat).toBeNull();
  });
});

// ── completeStoryBeat ─────────────────────────────────────────────────────────

describe('completeStoryBeat', () => {
  it('clears activeStoryBeat and records the completion tick', () => {
    const state = makeState({ activeStoryBeat: 'enc_1' });
    completeStoryBeat(state, 42);
    expect(state.activeStoryBeat).toBeNull();
    expect(state.lastCompletedTick).toBe(42);
  });

  it('allows a new beat to fire after cooldown completes', () => {
    const state = makeState({ activeStoryBeat: 'enc_1' });
    completeStoryBeat(state, 0);
    enqueueStoryBeat(state, makeBeat('enc_2'));
    // canFireStoryBeat should now be true after the cooldown window
    expect(canFireStoryBeat(state, STORY_BEAT_COOLDOWN + 1)).toBe(true);
  });
});
