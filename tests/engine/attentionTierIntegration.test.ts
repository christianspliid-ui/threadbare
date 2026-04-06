/**
 * Integration tests for the attention tier pipeline.
 *
 * Verifies the end-to-end contracts between:
 *   resolveEffectiveTier → notification routing
 *   appendDigestEntry / pruneDigestBuffer / queryDigest
 *   regenAttention / spendAttention / getAttentionVisualState / computeAttendCost
 *   canFireStoryBeat / enqueueStoryBeat / dequeueStoryBeat / completeStoryBeat
 */

import { describe, it, expect } from 'vitest';

import {
  resolveEffectiveTier,
  checkMidEncounterPromotion,
  isNotableEntry,
} from '../../src/engine/attentionTier';

import {
  appendDigestEntry,
  pruneDigestBuffer,
  queryDigest,
} from '../../src/engine/digestBuffer';

import {
  regenAttention,
  spendAttention,
  getAttentionVisualState,
  computeAttendCost,
} from '../../src/engine/attentionPool';

import {
  canFireStoryBeat,
  enqueueStoryBeat,
  dequeueStoryBeat,
  completeStoryBeat,
  type PacingState,
} from '../../src/engine/pacingGovernor';

import type { DigestEntry, AscendantAttentionState, QueuedStoryBeat } from '../../src/types/attention';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDigestEntry(overrides: Partial<DigestEntry> = {}): DigestEntry {
  return {
    agentId: 'agent-001',
    agentName: 'Test Agent',
    encounterId: 'encounter-001',
    encounterName: 'Test Encounter',
    encounterType: 'combat',
    reachPrimary: 'force',
    tick: 10,
    success: true,
    significantOutcomes: [],
    capabilityChanges: {},
    attachmentsGained: [],
    attachmentsLost: [],
    quintessenceDelta: 0,
    isNotable: false,
    wasCuratedOut: false,
    isDormantAgent: false,
    sourceType: 'agent',
    ...overrides,
  };
}

function makeAttentionState(overrides: Partial<AscendantAttentionState> = {}): AscendantAttentionState {
  return {
    attentionPool: 6,
    attentionCapacity: 6,
    attentionRegen: 0.4,
    ...overrides,
  };
}

function makePacingState(overrides: Partial<PacingState> = {}): PacingState {
  return {
    activeStoryBeat: null,
    lastCompletedTick: 0,
    queue: [],
    ...overrides,
  };
}

function makeQueuedBeat(overrides: Partial<QueuedStoryBeat> = {}): QueuedStoryBeat {
  return {
    encounterId: 'encounter-001',
    agentId: 'agent-001',
    priority: 'template_intrinsic',
    queuedTick: 10,
    hexCol: 5,
    hexRow: 3,
    ...overrides,
  };
}

// ─── Test 1: Background encounter → digest entry, no notification ─────────────

describe('background encounter produces digest entry, no notification', () => {
  it('background tier maps to no notification path (invisible or background)', () => {
    // retinue court position: intrinsic background → effective background
    const effectiveTier = resolveEffectiveTier('background', 'retinue');
    expect(effectiveTier).toBe('background');
    // background and invisible are the "no notification" tiers
    expect(['background', 'invisible']).toContain(effectiveTier);
  });

  it('appends a digest entry for a background encounter', () => {
    const buffer: DigestEntry[] = [];
    const entry = makeDigestEntry({ tick: 10, agentId: 'agent-retinue' });
    appendDigestEntry(buffer, entry);
    expect(buffer).toHaveLength(1);
    expect(buffer[0].agentId).toBe('agent-retinue');
  });

  it('does not produce a notification for background tier', () => {
    // Notification routing: only shaping / story_beat trigger notifications.
    // Background → no notification.
    const tier = resolveEffectiveTier('background', 'retinue');
    const isNotificationTier = tier === 'shaping' || tier === 'story_beat';
    expect(isNotificationTier).toBe(false);
  });
});

// ─── Test 2: the_first court position promotes background → shaping ───────────

describe('shaping encounter for the_first produces notification', () => {
  it('the_first promotes background intrinsic tier to shaping effective tier', () => {
    const effectiveTier = resolveEffectiveTier('background', 'the_first');
    expect(effectiveTier).toBe('shaping');
  });

  it('shaping effective tier is in the notification path', () => {
    const tier = resolveEffectiveTier('background', 'the_first');
    const isNotificationTier = tier === 'shaping' || tier === 'story_beat';
    expect(isNotificationTier).toBe(true);
  });

  it('the_first leaves shaping and story_beat tiers unchanged', () => {
    expect(resolveEffectiveTier('shaping', 'the_first')).toBe('shaping');
    expect(resolveEffectiveTier('story_beat', 'the_first')).toBe('story_beat');
  });
});

// ─── Test 3: Dormant agent → invisible, no LOS, no notification ───────────────

describe('dormant agent produces invisible tier and no notification', () => {
  it('dormant court position resolves to invisible regardless of intrinsic tier', () => {
    expect(resolveEffectiveTier('background', 'dormant')).toBe('invisible');
    expect(resolveEffectiveTier('shaping', 'dormant')).toBe('invisible');
    expect(resolveEffectiveTier('story_beat', 'dormant')).toBe('invisible');
  });

  it('invisible tier is not in the notification path', () => {
    const tier = resolveEffectiveTier('shaping', 'dormant');
    const isNotificationTier = tier === 'shaping' || tier === 'story_beat';
    expect(isNotificationTier).toBe(false);
  });

  it('null court position (unthreaded) also resolves to invisible', () => {
    expect(resolveEffectiveTier('background', null)).toBe('invisible');
  });
});

// ─── Test 4: Story beat queuing and dequeue serialization ─────────────────────

describe('story beat queuing serializes beats correctly', () => {
  it('can fire when no active beat and cooldown elapsed', () => {
    const pacing = makePacingState({ lastCompletedTick: 0 });
    // currentTick=12 satisfies the default STORY_BEAT_COOLDOWN=12 cooldown
    expect(canFireStoryBeat(pacing, 12)).toBe(true);
  });

  it('cannot fire during active story beat', () => {
    const pacing = makePacingState({ activeStoryBeat: 'encounter-active' });
    expect(canFireStoryBeat(pacing, 100)).toBe(false);
  });

  it('cannot fire if cooldown has not elapsed', () => {
    const pacing = makePacingState({ lastCompletedTick: 50 });
    expect(canFireStoryBeat(pacing, 55)).toBe(false);
  });

  it('enqueuing sets activeStoryBeat when dequeued', () => {
    const pacing = makePacingState({ lastCompletedTick: 0 });
    const beat = makeQueuedBeat({ encounterId: 'encounter-A' });
    enqueueStoryBeat(pacing, beat);
    expect(pacing.queue).toHaveLength(1);

    const fired = dequeueStoryBeat(pacing, 12);
    expect(fired).not.toBeNull();
    expect(fired!.encounterId).toBe('encounter-A');
    expect(pacing.activeStoryBeat).toBe('encounter-A');
    expect(pacing.queue).toHaveLength(0);
  });

  it('second beat goes to queue while one is active', () => {
    const pacing = makePacingState({ lastCompletedTick: 0 });
    const beatA = makeQueuedBeat({ encounterId: 'encounter-A' });
    const beatB = makeQueuedBeat({ encounterId: 'encounter-B' });

    enqueueStoryBeat(pacing, beatA);
    dequeueStoryBeat(pacing, 12); // beatA is now active
    expect(pacing.activeStoryBeat).toBe('encounter-A');

    enqueueStoryBeat(pacing, beatB);
    expect(pacing.queue).toHaveLength(1);

    // Cannot dequeue — beat active
    const notFired = dequeueStoryBeat(pacing, 12);
    expect(notFired).toBeNull();
    expect(pacing.activeStoryBeat).toBe('encounter-A');
  });

  it('completing active beat allows next dequeue after cooldown', () => {
    const pacing = makePacingState({ lastCompletedTick: 0 });
    const beatA = makeQueuedBeat({ encounterId: 'encounter-A' });
    const beatB = makeQueuedBeat({ encounterId: 'encounter-B' });

    enqueueStoryBeat(pacing, beatA);
    dequeueStoryBeat(pacing, 12);
    enqueueStoryBeat(pacing, beatB);
    completeStoryBeat(pacing, 12);

    expect(pacing.activeStoryBeat).toBeNull();
    expect(pacing.lastCompletedTick).toBe(12);

    // Cooldown: 12 ticks, so tick 24 is valid
    const fired = dequeueStoryBeat(pacing, 24);
    expect(fired).not.toBeNull();
    expect(fired!.encounterId).toBe('encounter-B');
  });
});

// ─── Test 5: Mid-encounter promotion ──────────────────────────────────────────

describe('mid-encounter promotion', () => {
  it('wound trigger promotes background → shaping', () => {
    const promoted = checkMidEncounterPromotion('background', { wound: true });
    expect(promoted).toBe('shaping');
  });

  it('wound trigger does NOT promote shaping → story_beat (tier-1 only)', () => {
    const promoted = checkMidEncounterPromotion('shaping', { wound: true });
    expect(promoted).toBeNull();
  });

  it('chainCulmination promotes background → story_beat (tier-2)', () => {
    const promoted = checkMidEncounterPromotion('background', { chainCulmination: true });
    expect(promoted).toBe('story_beat');
  });

  it('chainCulmination promotes shaping → story_beat (tier-2)', () => {
    const promoted = checkMidEncounterPromotion('shaping', { chainCulmination: true });
    expect(promoted).toBe('story_beat');
  });

  it('story_beat cannot be promoted further — returns null', () => {
    const promoted = checkMidEncounterPromotion('story_beat', { chainCulmination: true, wound: true });
    expect(promoted).toBeNull();
  });

  it('no triggers → no promotion', () => {
    const promoted = checkMidEncounterPromotion('background', {});
    expect(promoted).toBeNull();
  });

  it('promoted effective tier enters notification path', () => {
    const initialTier = resolveEffectiveTier('background', 'retinue'); // 'background'
    const promotedTier = checkMidEncounterPromotion(initialTier as 'background', { wound: true });
    // shaping is in notification path
    expect(promotedTier).toBe('shaping');
    const isNotificationTier = promotedTier === 'shaping' || promotedTier === 'story_beat';
    expect(isNotificationTier).toBe(true);
  });
});

// ─── Test 6: Digest buffer retention and pruning ──────────────────────────────

describe('digest buffer retention and pruning', () => {
  it('prunes entries older than retention window', () => {
    const buffer: DigestEntry[] = [];

    // Add entries at ticks 10, 30, 50, 70, 90
    for (const tick of [10, 30, 50, 70, 90]) {
      appendDigestEntry(buffer, makeDigestEntry({ tick, encounterId: `enc-${tick}` }));
    }
    expect(buffer).toHaveLength(5);

    // Prune at tick 100 with retention 48: cutoff = 100 - 48 = 52
    // Entries with tick <= 52 removed (10, 30, 50 are removed; 70, 90 remain)
    const pruned = pruneDigestBuffer(buffer, 100, 48);
    expect(pruned).toHaveLength(2);
    expect(pruned.map(e => e.tick)).toEqual([70, 90]);
  });

  it('does not mutate the original buffer when pruning', () => {
    const buffer: DigestEntry[] = [];
    appendDigestEntry(buffer, makeDigestEntry({ tick: 10 }));
    const pruned = pruneDigestBuffer(buffer, 100, 48);
    expect(buffer).toHaveLength(1); // original unchanged
    expect(pruned).toHaveLength(0);
  });

  it('queryDigest filters by tick range', () => {
    const buffer: DigestEntry[] = [];
    for (const tick of [10, 20, 30, 40, 50]) {
      appendDigestEntry(buffer, makeDigestEntry({ tick, encounterId: `enc-${tick}` }));
    }
    const results = queryDigest(buffer, { fromTick: 20, toTick: 40 });
    expect(results.map(e => e.tick)).toEqual([20, 30, 40]);
  });

  it('queryDigest filters by agentId', () => {
    const buffer: DigestEntry[] = [];
    appendDigestEntry(buffer, makeDigestEntry({ tick: 10, agentId: 'agent-A' }));
    appendDigestEntry(buffer, makeDigestEntry({ tick: 11, agentId: 'agent-B' }));
    appendDigestEntry(buffer, makeDigestEntry({ tick: 12, agentId: 'agent-A' }));

    const results = queryDigest(buffer, { fromTick: 0, toTick: 100, agentId: 'agent-A' });
    expect(results).toHaveLength(2);
    expect(results.every(e => e.agentId === 'agent-A')).toBe(true);
  });

  it('queryDigest notableOnly filters out non-notable entries', () => {
    const buffer: DigestEntry[] = [];
    appendDigestEntry(buffer, makeDigestEntry({ tick: 10, isNotable: false }));
    appendDigestEntry(buffer, makeDigestEntry({ tick: 11, isNotable: true }));

    const results = queryDigest(buffer, { fromTick: 0, toTick: 100, notableOnly: true });
    expect(results).toHaveLength(1);
    expect(results[0].isNotable).toBe(true);
  });
});

// ─── Test 7: Attention pool constrains engagement ─────────────────────────────

describe('attention pool constrains engagement', () => {
  it('regen increases pool up to capacity', () => {
    const state = makeAttentionState({ attentionPool: 4, attentionCapacity: 6, attentionRegen: 0.4 });
    const next = regenAttention(state);
    expect(next.attentionPool).toBeCloseTo(4.4);
  });

  it('regen does not exceed capacity', () => {
    const state = makeAttentionState({ attentionPool: 5.9, attentionCapacity: 6, attentionRegen: 0.4 });
    const next = regenAttention(state);
    expect(next.attentionPool).toBe(6);
  });

  it('spending attention deducts from pool', () => {
    const state = makeAttentionState({ attentionPool: 6, attentionCapacity: 6, attentionRegen: 0.4 });
    const next = spendAttention(state, 2);
    expect(next.attentionPool).toBe(4);
  });

  it('spending more than available clamps to 0', () => {
    const state = makeAttentionState({ attentionPool: 1, attentionCapacity: 6, attentionRegen: 0.4 });
    const next = spendAttention(state, 5);
    expect(next.attentionPool).toBe(0);
  });

  it('burst spending → overwhelmed visual state', () => {
    let state = makeAttentionState({ attentionPool: 6, attentionCapacity: 6, attentionRegen: 0.4 });
    // Spend enough to drop below the 0.1 threshold (0.1 * 6 = 0.6)
    state = spendAttention(state, 5.5);
    expect(state.attentionPool).toBeCloseTo(0.5);
    expect(getAttentionVisualState(state)).toBe('overwhelmed');
  });

  it('recovery via regen moves visual state from overwhelmed toward focused', () => {
    let state = makeAttentionState({ attentionPool: 0, attentionCapacity: 6, attentionRegen: 1.5 });
    expect(getAttentionVisualState(state)).toBe('overwhelmed');

    // Regen a few ticks
    state = regenAttention(state); // 1.5
    expect(getAttentionVisualState(state)).toBe('strained'); // 1.5/6 = 0.25 > 0.1

    state = regenAttention(state); // 3.0
    expect(getAttentionVisualState(state)).toBe('busy'); // 3.0/6 = 0.5 > 0.3

    state = regenAttention(state); // 4.5
    expect(getAttentionVisualState(state)).toBe('focused'); // 4.5/6 = 0.75 > 0.6
  });

  it('computeAttendCost applies court multiplier correctly', () => {
    // the_first gets 0.5× multiplier → moderate (1.0) * 0.5 = 0.5
    expect(computeAttendCost('moderate', 'the_first')).toBeCloseTo(0.5);
    // retinue gets 1.0× → moderate (1.0) * 1.0 = 1.0
    expect(computeAttendCost('moderate', 'retinue')).toBeCloseTo(1.0);
    // watched gets 1.5× → moderate (1.0) * 1.5 = 1.5
    expect(computeAttendCost('moderate', 'watched')).toBeCloseTo(1.5);
  });
});

// ─── Test 8: Tier routing integration (resolveEffectiveTier → routing) ────────

describe('tier routing: effectiveTier drives correct pipeline branch', () => {
  const NOTIFICATION_TIERS = new Set(['shaping', 'story_beat']);

  it.each([
    ['background', 'retinue',   false],
    ['shaping',    'retinue',   true],
    ['story_beat', 'retinue',   true],
    ['background', 'the_first', true],  // promoted to shaping
    ['shaping',    'watched',   false], // demoted to background
    ['background', 'dormant',   false], // invisible
    ['story_beat', 'dormant',   false], // invisible
  ] as const)(
    'intrinsic=%s + court=%s → notification=%s',
    (intrinsic, court, expectNotification) => {
      const effective = resolveEffectiveTier(intrinsic as any, court as any);
      const notifies = NOTIFICATION_TIERS.has(effective as string);
      expect(notifies).toBe(expectNotification);
    }
  );
});

// ─── Test 9: isNotableEntry flags correct conditions ──────────────────────────

describe('isNotableEntry correctly flags notable conditions', () => {
  it('returns false for a plain successful encounter', () => {
    expect(isNotableEntry({})).toBe(false);
  });

  it('returns true when agent took a wound', () => {
    expect(isNotableEntry({ hasWound: true })).toBe(true);
  });

  it('returns true on large quintessence loss', () => {
    expect(isNotableEntry({ quintessenceDelta: -0.4 })).toBe(true);
  });

  it('returns false on small quintessence loss below threshold', () => {
    expect(isNotableEntry({ quintessenceDelta: -0.1 })).toBe(false);
  });

  it('returns true on large reputation delta (positive)', () => {
    expect(isNotableEntry({ reputationDelta: 0.5 })).toBe(true);
  });

  it('returns true on large reputation delta (negative)', () => {
    expect(isNotableEntry({ reputationDelta: -0.5 })).toBe(true);
  });

  it('returns true when any attachment lost', () => {
    expect(isNotableEntry({ attachmentsLost: ['attachment-001'] })).toBe(true);
  });

  it('returns false when attachment lost array is empty', () => {
    expect(isNotableEntry({ attachmentsLost: [] })).toBe(false);
  });

  it('returns true on tier promotion', () => {
    expect(isNotableEntry({ tierPromoted: true })).toBe(true);
  });

  it('returns true on chain completion', () => {
    expect(isNotableEntry({ chainCompleted: true })).toBe(true);
  });
});
