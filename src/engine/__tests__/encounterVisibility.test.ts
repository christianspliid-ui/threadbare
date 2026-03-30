/**
 * Tests for Universal Encounter Visibility — TB-035 Phase 4.
 */

import { describe, it, expect } from 'vitest';
import {
  getVisibilityDepth,
  generateInterventionChoices,
  generateEncounterProse,
  buildEncounterNotification,
  toggleAttentionMode,
} from '../encounterVisibility';
import {
  RETINUE_VIGNETTE_TIMEOUT,
  PAUSE_MODE_MIN_TIER,
  ATTENTION_MODE_CHANGE_COST,
} from '../../types/encounterVisibility';
import { WorldGraph } from '../graph';
import type { ThreadEdgeProperties } from '../../types/influence';

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
