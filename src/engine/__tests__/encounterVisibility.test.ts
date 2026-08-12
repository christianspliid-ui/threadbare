/**
 * Tests for Universal Encounter Visibility — TB-035 Phase 4.
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  getVisibilityDepth,
  generateInterventionChoices,
  generateEncounterProse,
  buildEncounterNotification,
  toggleAttentionMode,
  expireOverdueEncounterNotifications,
  isEncounterNotificationOverdue,
} from '../encounterVisibility';
import type { EncounterNotification } from '../../types/encounterVisibility';
import {
  RETINUE_VIGNETTE_TIMEOUT,
  PAUSE_MODE_MIN_TIER,
  ATTENTION_MODE_CHANGE_COST,
  VISIBILITY_BY_POSITION,
} from '../../types/encounterVisibility';
import { WorldGraph } from '../graph';
import type { ThreadEdgeProperties } from '../../types/influence';
import { setForceFullEncounterVisibility } from '../debugVisibilityOverride';

function createTestGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({
    id: 'asc_1', name: 'The God', type: 'actor', category: 'ascendant',
    properties: { actorType: 'ascendant' },
  });
  g.addNode({
    id: 'agent_1', name: 'Kira', type: 'actor', category: 'individual',
    properties: { actorType: 'individual' },
  });
  return g;
}

function addThread(g: WorldGraph, courtPosition: string, tier: number, attentionMode: string = 'auto_resolve') {
  g.addEdge({
    id: 'thread_1', source: 'asc_1', target: 'agent_1', type: 'thread',
    properties: {
      courtPosition,
      tier,
      attentionMode,
      ticksAtCurrentTier: 5,
      establishedTick: 1,
      totalEssenceSpent: 10,
      maintenanceCurrent: true,
      readBackstoryTier: 0,
    } as ThreadEdgeProperties,
  });
}

// ─── Visibility Depth ──────────────────────────────────────────────

describe('getVisibilityDepth', () => {
  it('returns full for the_first', () => {
    expect(getVisibilityDepth('the_first')).toBe('full');
  });

  it('returns medium for retinue', () => {
    expect(getVisibilityDepth('retinue')).toBe('medium');
  });

  it('returns peek for watched', () => {
    expect(getVisibilityDepth('watched')).toBe('peek');
  });

  it('returns none for null position', () => {
    expect(getVisibilityDepth(null)).toBe('none');
  });
});

// ─── Intervention Choices ──────────────────────────────────────────

describe('generateInterventionChoices', () => {
  it('generates 3 choices for the_first', () => {
    const choices = generateInterventionChoices('the_first', 'Battle');
    expect(choices.length).toBe(3);
    expect(choices.some(c => c.interventionType === 'supportive')).toBe(true);
    expect(choices.some(c => c.interventionType === 'coercive')).toBe(true);
    expect(choices.some(c => c.interventionType === 'withdrawn')).toBe(true);
  });

  it('generates 2 choices for retinue (no coercive)', () => {
    const choices = generateInterventionChoices('retinue', 'Battle');
    expect(choices.length).toBe(2);
    expect(choices.some(c => c.interventionType === 'supportive')).toBe(true);
    expect(choices.some(c => c.interventionType === 'withdrawn')).toBe(true);
  });

  it('generates no choices for watched', () => {
    const choices = generateInterventionChoices('watched', 'Battle');
    expect(choices.length).toBe(0);
  });

  it('generates no choices for null position', () => {
    const choices = generateInterventionChoices(null, 'Battle');
    expect(choices.length).toBe(0);
  });
});

// ─── Encounter Prose ───────────────────────────────────────────────

describe('generateEncounterProse', () => {
  it('full depth generates rich prose', () => {
    const prose = generateEncounterProse('full', 'Kira', 'a duel', 'Ashenmoor');
    expect(prose.length).toBeGreaterThan(100);
    expect(prose).toContain('Kira');
  });

  it('medium depth generates moderate prose', () => {
    const prose = generateEncounterProse('medium', 'Kira', 'a duel', 'Ashenmoor');
    expect(prose.length).toBeGreaterThan(30);
    expect(prose).toContain('Kira');
  });

  it('peek generates brief prose', () => {
    const prose = generateEncounterProse('peek', 'Kira', 'a duel', 'Ashenmoor');
    expect(prose).toContain('Kira');
    expect(prose.length).toBeLessThan(100);
  });

  it('none returns empty string', () => {
    expect(generateEncounterProse('none', 'Kira', 'a duel', 'Ashenmoor')).toBe('');
  });
});

// ─── Notification Building ─────────────────────────────────────────

describe('buildEncounterNotification', () => {
  it('defaults threaded legacy positions to auto-resolve mode', () => {
    expect(VISIBILITY_BY_POSITION.the_first.defaultAttentionMode).toBe('auto_resolve');
    expect(VISIBILITY_BY_POSITION.retinue.defaultAttentionMode).toBe('auto_resolve');
  });

  it('builds notification for retinue agent', () => {
    const notif = buildEncounterNotification(
      'agent_1', 'Kira', 'enc_1', 'a duel', 'Ashenmoor',
      'retinue', 'auto_resolve', 10,
    );
    expect(notif).not.toBeNull();
    expect(notif!.agentName).toBe('Kira');
    expect(notif!.autoResolveTick).toBe(10 + RETINUE_VIGNETTE_TIMEOUT);
    expect(notif!.choices.length).toBe(2);
  });

  it('builds notification with null auto-resolve for pause mode', () => {
    const notif = buildEncounterNotification(
      'agent_1', 'Kira', 'enc_1', 'a duel', 'Ashenmoor',
      'the_first', 'pause', 10,
    );
    expect(notif!.autoResolveTick).toBeNull();
  });

  it('returns null for null court position', () => {
    const notif = buildEncounterNotification(
      'agent_1', 'Kira', 'enc_1', 'a duel', 'Ashenmoor',
      null, 'auto_resolve', 10,
    );
    expect(notif).toBeNull();
  });

  it('watched agents get peek prose and no choices', () => {
    const notif = buildEncounterNotification(
      'agent_1', 'Kira', 'enc_1', 'a duel', 'Ashenmoor',
      'watched', 'auto_resolve', 10,
    );
    expect(notif).not.toBeNull();
    expect(notif!.choices.length).toBe(0);
    expect(notif!.prose.length).toBeLessThan(100);
  });
});

// ─── Force-Full-Visibility Debug Override (THR-880) ────────────────

describe('force-full-encounter-visibility override', () => {
  afterEach(() => {
    setForceFullEncounterVisibility(false);
  });

  it('upgrades watched depth to full while active', () => {
    expect(getVisibilityDepth('watched')).toBe('peek');
    setForceFullEncounterVisibility(true);
    expect(getVisibilityDepth('watched')).toBe('full');
  });

  it('leaves dormant/null invisible while active', () => {
    setForceFullEncounterVisibility(true);
    expect(getVisibilityDepth(null)).toBe('none');
    expect(getVisibilityDepth('dormant')).toBe('none');
  });

  it('upgrades watched to the_first-level choices while active', () => {
    setForceFullEncounterVisibility(true);
    const choices = generateInterventionChoices('watched', 'Battle');
    expect(choices.length).toBe(3);
    expect(choices.some(c => c.interventionType === 'coercive')).toBe(true);
  });

  it('forces autoResolveTick to null for a threaded auto_resolve notification', () => {
    setForceFullEncounterVisibility(true);
    const notif = buildEncounterNotification(
      'agent_1', 'Kira', 'enc_1', 'a duel', 'Ashenmoor',
      'watched', 'auto_resolve', 10,
    );
    expect(notif).not.toBeNull();
    expect(notif!.autoResolveTick).toBeNull();
    expect(notif!.choices.length).toBe(3);
  });

  it('still returns null for a dormant/null court position while active', () => {
    setForceFullEncounterVisibility(true);
    const notif = buildEncounterNotification(
      'agent_1', 'Kira', 'enc_1', 'a duel', 'Ashenmoor',
      null, 'auto_resolve', 10,
    );
    expect(notif).toBeNull();
  });
});

// ─── Attention Mode Toggle ─────────────────────────────────────────

describe('toggleAttentionMode', () => {
  it('toggles from auto_resolve to pause when tier is sufficient', () => {
    const g = createTestGraph();
    addThread(g, 'retinue', 3, 'auto_resolve');

    const result = toggleAttentionMode(g, 'thread_1', 'asc_1', 10);
    expect(result).not.toBeNull();
    expect(result!.newMode).toBe('pause');
    expect(result!.essenceCost).toBe(ATTENTION_MODE_CHANGE_COST);

    const edge = g.getEdge('thread_1');
    expect((edge?.properties as ThreadEdgeProperties).attentionMode).toBe('pause');
  });

  it('toggles from pause to auto_resolve', () => {
    const g = createTestGraph();
    addThread(g, 'retinue', 3, 'pause');

    const result = toggleAttentionMode(g, 'thread_1', 'asc_1', 10);
    expect(result).not.toBeNull();
    expect(result!.newMode).toBe('auto_resolve');
  });

  it('blocks pause when tier is too low', () => {
    const g = createTestGraph();
    addThread(g, 'watched', 1, 'auto_resolve');

    const result = toggleAttentionMode(g, 'thread_1', 'asc_1', 10);
    expect(result).toBeNull();
  });

  it('returns null for nonexistent edge', () => {
    const g = createTestGraph();
    const result = toggleAttentionMode(g, 'nonexistent', 'asc_1', 10);
    expect(result).toBeNull();
  });
});

// ─── Auto-Resolve Expiry (THR-1068) ────────────────────────────────

/**
 * The consumer `autoResolveTick` never had.
 *
 * These tests pin the *exemptions* as hard as the happy path, because every one
 * of them is a deliberate scope decision that a later "completeness" sweep would
 * otherwise read as an oversight and helpfully remove. Each exemption's reason
 * is on `expireOverdueEncounterNotifications`; the tests are here so removing
 * one goes red rather than shipping.
 */
describe('expireOverdueEncounterNotifications', () => {
  function makeNotif(overrides: Partial<EncounterNotification> = {}): EncounterNotification {
    return {
      id: 'n1',
      agentId: 'agent_1',
      agentName: 'Kira',
      courtPosition: 'retinue',
      encounterId: 'enc_1',
      encounterName: 'a duel',
      kind: 'encounter',
      sourceSystem: 'unified_action',
      prose: 'prose',
      choices: [],
      createdTick: 10,
      autoResolveTick: 10 + RETINUE_VIGNETTE_TIMEOUT,
      viewed: false,
      resolved: false,
      ...overrides,
    };
  }

  it('retires a step notification once the tick reaches its deadline', () => {
    const notif = makeNotif();
    const { notifications, expiredIds } = expireOverdueEncounterNotifications([notif], 18);

    expect(expiredIds).toEqual(['n1']);
    expect(notifications[0].resolved).toBe(true);
    // `viewed` stays false on purpose — the player genuinely never saw it, and
    // claiming otherwise would corrupt the only honest record of that.
    expect(notifications[0].viewed).toBe(false);
  });

  it('leaves a notification alone one tick before its deadline', () => {
    const { notifications, expiredIds } = expireOverdueEncounterNotifications([makeNotif()], 17);

    expect(expiredIds).toEqual([]);
    expect(notifications[0].resolved).toBe(false);
  });

  it('retires the overdue backlog the defect actually produced', () => {
    // The measured shape at tick 113: three of Kael's notifications 32, 36 and
    // 37 ticks past their deadline, none viewed, none resolved.
    const overdue = [
      makeNotif({ id: 'n1', createdTick: 73, autoResolveTick: 81 }),
      makeNotif({ id: 'n2', createdTick: 69, autoResolveTick: 77 }),
      makeNotif({ id: 'n3', createdTick: 68, autoResolveTick: 76 }),
    ];
    const { notifications, expiredIds } = expireOverdueEncounterNotifications(overdue, 113);

    expect(expiredIds).toEqual(['n1', 'n2', 'n3']);
    expect(notifications.every(n => n.resolved)).toBe(true);
  });

  it('returns the input array by identity when nothing expires', () => {
    // Lets the orchestrator skip the state write on the overwhelmingly common
    // tick where no deadline has passed.
    const input = [makeNotif({ autoResolveTick: 40 })];
    const { notifications } = expireOverdueEncounterNotifications(input, 10);

    expect(notifications).toBe(input);
  });

  it('is idempotent — a retired notification is not re-reported next tick', () => {
    const first = expireOverdueEncounterNotifications([makeNotif()], 18);
    const second = expireOverdueEncounterNotifications(first.notifications, 19);

    expect(second.expiredIds).toEqual([]);
  });

  it('exempts pause-tier notifications, which carry no deadline at all', () => {
    const { expiredIds } = expireOverdueEncounterNotifications(
      [makeNotif({ autoResolveTick: null })],
      999,
    );
    expect(expiredIds).toEqual([]);
  });

  it('exempts aftermath — the badge is the only route to a concluded beat at this tier', () => {
    const { notifications, expiredIds } = expireOverdueEncounterNotifications(
      [makeNotif({ kind: 'aftermath' })],
      999,
    );
    expect(expiredIds).toEqual([]);
    expect(notifications[0].resolved).toBe(false);
  });

  it('exempts legacy-sourced steps, a population production never produces (THR-1069)', () => {
    // The guard holds for a stronger reason than THR-1068 claimed: no production path
    // writes `state.encounterProgress`, so no legacy notification is ever built. It is
    // kept because the branch is cheaply resurrectable — `legacyEncounterBranchUnreachable`
    // pins the one fallback the unreachability rests on.
    const { expiredIds } = expireOverdueEncounterNotifications(
      [makeNotif({ sourceSystem: 'legacy_encounter' })],
      999,
    );
    expect(expiredIds).toEqual([]);
  });

  it('reports nothing for an empty queue', () => {
    expect(expireOverdueEncounterNotifications([], 50).expiredIds).toEqual([]);
  });

  it('isEncounterNotificationOverdue agrees with the expiry it gates', () => {
    expect(isEncounterNotificationOverdue(makeNotif(), 18)).toBe(true);
    expect(isEncounterNotificationOverdue(makeNotif(), 17)).toBe(false);
    expect(isEncounterNotificationOverdue(makeNotif({ resolved: true }), 999)).toBe(false);
  });
});
