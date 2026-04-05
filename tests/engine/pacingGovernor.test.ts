import { describe, it, expect } from 'vitest';
import {
  canFireStoryBeat,
  enqueueStoryBeat,
  dequeueStoryBeat,
  completeStoryBeat,
  type PacingState,
} from '../../src/engine/pacingGovernor';
import type { QueuedStoryBeat } from '../../src/types/attention';

function makePacing(overrides: Partial<PacingState> = {}): PacingState {
  return {
    activeStoryBeat: null,
    lastCompletedTick: 0,
    queue: [],
    ...overrides,
  };
}

function makeBeat(
  encounterId: string,
  priority: QueuedStoryBeat['priority'],
  agentId = 'agent-1',
  queuedTick = 0
): QueuedStoryBeat {
  return { encounterId, actionId: undefined, agentId, priority, queuedTick, hexCol: 0, hexRow: 0 };
}

// ─── canFireStoryBeat ─────────────────────────────────────────────────────────

describe('canFireStoryBeat', () => {
  it('returns true when no active beat and cooldown elapsed', () => {
    const pacing = makePacing({ lastCompletedTick: 0 });
    expect(canFireStoryBeat(pacing, 12)).toBe(true);
  });

  it('returns false when active beat exists', () => {
    const pacing = makePacing({ activeStoryBeat: 'enc-1', lastCompletedTick: 0 });
    expect(canFireStoryBeat(pacing, 100)).toBe(false);
  });

  it('returns false during cooldown (lastCompleted=50, current=55, cooldown=12)', () => {
    const pacing = makePacing({ lastCompletedTick: 50 });
    expect(canFireStoryBeat(pacing, 55)).toBe(false);
  });

  it('returns true when cooldown elapsed (lastCompleted=50, current=63)', () => {
    const pacing = makePacing({ lastCompletedTick: 50 });
    expect(canFireStoryBeat(pacing, 63)).toBe(true);
  });
});

// ─── enqueueStoryBeat ─────────────────────────────────────────────────────────

describe('enqueueStoryBeat', () => {
  it('adds to empty queue', () => {
    const pacing = makePacing();
    const beat = makeBeat('enc-1', 'template_intrinsic');
    const demoted = enqueueStoryBeat(pacing, beat);
    expect(pacing.queue).toHaveLength(1);
    expect(pacing.queue[0].encounterId).toBe('enc-1');
    expect(demoted).toBeNull();
  });

  it('sorts by priority (doom_clock first)', () => {
    const pacing = makePacing();
    enqueueStoryBeat(pacing, makeBeat('enc-low', 'template_intrinsic'));
    enqueueStoryBeat(pacing, makeBeat('enc-mid', 'faction_war'));
    enqueueStoryBeat(pacing, makeBeat('enc-high', 'doom_clock'));
    expect(pacing.queue[0].encounterId).toBe('enc-high');
    expect(pacing.queue[1].encounterId).toBe('enc-mid');
    expect(pacing.queue[2].encounterId).toBe('enc-low');
  });

  it('returns demoted beat when 4th added (queue max is 3)', () => {
    const pacing = makePacing();
    enqueueStoryBeat(pacing, makeBeat('enc-1', 'doom_clock'));
    enqueueStoryBeat(pacing, makeBeat('enc-2', 'faction_war'));
    enqueueStoryBeat(pacing, makeBeat('enc-3', 'promoted'));
    const demoted = enqueueStoryBeat(pacing, makeBeat('enc-4', 'template_intrinsic'));
    expect(demoted).not.toBeNull();
    expect(pacing.queue).toHaveLength(3);
  });

  it('demoted beat is lowest priority', () => {
    const pacing = makePacing();
    enqueueStoryBeat(pacing, makeBeat('enc-1', 'doom_clock'));
    enqueueStoryBeat(pacing, makeBeat('enc-2', 'faction_war'));
    enqueueStoryBeat(pacing, makeBeat('enc-3', 'promoted'));
    // Add a higher-priority beat — the lowest (promoted) should NOT be demoted.
    // The newly added 'doom_clock' replaces the lowest 'promoted'.
    const demoted = enqueueStoryBeat(pacing, makeBeat('enc-4', 'doom_clock'));
    expect(demoted).not.toBeNull();
    expect(demoted!.priority).toBe('promoted');
  });
});

// ─── dequeueStoryBeat ─────────────────────────────────────────────────────────

describe('dequeueStoryBeat', () => {
  it('returns null when active beat exists', () => {
    const pacing = makePacing({ activeStoryBeat: 'enc-active' });
    pacing.queue.push(makeBeat('enc-1', 'doom_clock'));
    expect(dequeueStoryBeat(pacing, 100)).toBeNull();
  });

  it('returns null during cooldown', () => {
    const pacing = makePacing({ lastCompletedTick: 50 });
    pacing.queue.push(makeBeat('enc-1', 'doom_clock'));
    expect(dequeueStoryBeat(pacing, 55)).toBeNull();
  });

  it('returns highest priority beat from queue', () => {
    const pacing = makePacing({ lastCompletedTick: 0 });
    pacing.queue.push(makeBeat('enc-low', 'template_intrinsic'));
    pacing.queue.push(makeBeat('enc-high', 'doom_clock'));
    // Manually sort to reflect what enqueue would produce
    pacing.queue.sort((a, b) => priorityOrder(a.priority) - priorityOrder(b.priority));
    const beat = dequeueStoryBeat(pacing, 12);
    expect(beat).not.toBeNull();
    expect(beat!.encounterId).toBe('enc-high');
  });

  it('sets activeStoryBeat to the dequeued beat\'s encounterId', () => {
    const pacing = makePacing({ lastCompletedTick: 0 });
    pacing.queue.push(makeBeat('enc-1', 'doom_clock'));
    dequeueStoryBeat(pacing, 12);
    expect(pacing.activeStoryBeat).toBe('enc-1');
  });

  it('returns null when queue is empty', () => {
    const pacing = makePacing({ lastCompletedTick: 0 });
    expect(dequeueStoryBeat(pacing, 12)).toBeNull();
  });
});

// ─── completeStoryBeat ────────────────────────────────────────────────────────

describe('completeStoryBeat', () => {
  it('clears activeStoryBeat', () => {
    const pacing = makePacing({ activeStoryBeat: 'enc-1' });
    completeStoryBeat(pacing, 20);
    expect(pacing.activeStoryBeat).toBeNull();
  });

  it('sets lastCompletedTick', () => {
    const pacing = makePacing({ activeStoryBeat: 'enc-1', lastCompletedTick: 0 });
    completeStoryBeat(pacing, 42);
    expect(pacing.lastCompletedTick).toBe(42);
  });
});

// ─── Helper (mirrors internal sort order — used only in tests) ────────────────

function priorityOrder(p: QueuedStoryBeat['priority']): number {
  const order: Record<QueuedStoryBeat['priority'], number> = {
    doom_clock: 0,
    faction_war: 1,
    promoted: 2,
    template_intrinsic: 3,
  };
  return order[p];
}
