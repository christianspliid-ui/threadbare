/**
 * Tests for the Return Engine — TB-035 Phase 3.
 *
 * Tests founding gates, convergence algorithm, relationship scoring,
 * ripple consequence gathering, and court slot lifecycle.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  passesFoundingGate,
  evaluateAllFoundingGates,
  buildRelationshipState,
  resolveReturn,
  gatherRippleTargets,
  applyReturnOutcome,
  applyCourtSlotCooldown,
} from '../returnEngine';
import type { MeetingChoiceRecord } from '../../types/meetingEncounter';
import type { ThreadEdgeProperties } from '../../types/influence';
import type { BeatOutcome, OrdealOutcome } from '../../types/journeyEngine';
import type { ReturnOutcome, ReturnRelationshipState } from '../../types/returnEngine';
import { ALL_RETURN_OUTCOMES, RETURN_COOLDOWN, MAX_COOLDOWN_TICKS } from '../../types/returnEngine';
import { WorldGraph } from '../graph';

// ─── Helpers ───────────────────────────────────────────────────────

function makeMeetingRecord(overrides: Partial<MeetingChoiceRecord> = {}): MeetingChoiceRecord {
  return {
    encounterTick: 10,
    locationId: 'loc_1',
    intentPrimaryReach: 'iron',
    intentSecondaryReach: 'heart',
    intentSphere: 'force',
    candidateIndex: 0,
    archetypeId: 'iron_heart',
    dilemmaChoices: [],
    investmentChoice: 'inv_1',
    sparkTraitId: 'trait_1',
    shapePath: 'surprise',
    ascendantSphere: 'force',
    foundingGateTags: ['noble', 'heroic_origin'],
    ...overrides,
  };
}

function makeThreadProps(overrides: Partial<ThreadEdgeProperties> = {}): ThreadEdgeProperties {
  return {
    tier: 2,
    ticksAtCurrentTier: 10,
    establishedTick: 5,
    totalEssenceSpent: 15,
    maintenanceCurrent: true,
    readBackstoryTier: 0,
    courtPosition: 'the_first',
    storyPhase: 'return',
    interventionTracking: {
      totalVignettes: 8,
      playerIntervened: 5,
      playerWithdrew: 3,
      supportiveCount: 4,
      coerciveCount: 1,
    },
    ...overrides,
  };
}

function makeRelState(overrides: Partial<ReturnRelationshipState> = {}): ReturnRelationshipState {
  return {
    bondTier: 2,
    totalEssenceSpent: 15,
    interventionRatio: 0.6,
    supportiveVsCoercive: 3,
    cooperationStrategy: 'tit_for_tat',
    trust: 0.5,
    ...overrides,
  };
}

function createTestGraph(): WorldGraph {
  const g = new WorldGraph();
  // Ascendant
  g.addNode({
    id: 'asc_1', name: 'The God', type: 'actor', category: 'ascendant',
    properties: { actorType: 'ascendant' },
  });
  // Agent (The First)
  g.addNode({
    id: 'agent_1', name: 'Kira', type: 'actor', category: 'individual',
    properties: { actorType: 'individual', primaryReach: 'iron' },
  });
  // Thread edge
  g.addEdge({
    id: 'thread_1', source: 'asc_1', target: 'agent_1', type: 'thread',
    properties: makeThreadProps(),
  });
  return g;
}

// ─── Founding Gates ────────────────────────────────────────────────

describe('Founding Gates', () => {
  it('passes loyal_ascension with noble tag', () => {
    const record = makeMeetingRecord({ foundingGateTags: ['noble'] });
    expect(passesFoundingGate(record, 'loyal_ascension')).toBe(true);
  });

  it('fails loyal_ascension without noble tag', () => {
    const record = makeMeetingRecord({ foundingGateTags: ['dark', 'cunning'] });
    expect(passesFoundingGate(record, 'loyal_ascension')).toBe(false);
  });

  it('vanishing always passes (no gate)', () => {
    const record = makeMeetingRecord({ foundingGateTags: [] });
    expect(passesFoundingGate(record, 'vanishing')).toBe(true);
  });

  it('sacrifice blocked by shadow intent reach', () => {
    const record = makeMeetingRecord({
      foundingGateTags: ['noble', 'sacrifice'],
      intentPrimaryReach: 'shadow',
    });
    expect(passesFoundingGate(record, 'sacrifice')).toBe(false);
  });

  it('sacrifice passes with noble tag and non-shadow reach', () => {
    const record = makeMeetingRecord({
      foundingGateTags: ['noble'],
      intentPrimaryReach: 'iron',
    });
    expect(passesFoundingGate(record, 'sacrifice')).toBe(true);
  });

  it('transcendence requires star/veil/eye intent reach', () => {
    const record = makeMeetingRecord({
      foundingGateTags: ['cosmic_touch'],
      intentPrimaryReach: 'iron',
    });
    expect(passesFoundingGate(record, 'transcendence')).toBe(false);

    const starRecord = makeMeetingRecord({
      foundingGateTags: ['cosmic_touch'],
      intentPrimaryReach: 'star',
    });
    expect(passesFoundingGate(starRecord, 'transcendence')).toBe(true);
  });

  it('usurper passes with cunning tag', () => {
    const record = makeMeetingRecord({ foundingGateTags: ['cunning'] });
    expect(passesFoundingGate(record, 'usurper')).toBe(true);
  });

  it('usurper passes with bypass archetype even without tags', () => {
    const record = makeMeetingRecord({ foundingGateTags: [] });
    expect(passesFoundingGate(record, 'usurper', 'schemer')).toBe(true);
  });

  it('monster requires dark tag', () => {
    const record = makeMeetingRecord({ foundingGateTags: ['noble'] });
    expect(passesFoundingGate(record, 'monster')).toBe(false);

    const darkRecord = makeMeetingRecord({ foundingGateTags: ['dark'] });
    expect(passesFoundingGate(darkRecord, 'monster')).toBe(true);
  });

  it('no meeting record: only gateless outcomes pass', () => {
    expect(passesFoundingGate(undefined, 'vanishing')).toBe(true);
    expect(passesFoundingGate(undefined, 'loyal_ascension')).toBe(false);
  });

  it('evaluateAllFoundingGates returns results for all 6 outcomes', () => {
    const record = makeMeetingRecord({ foundingGateTags: ['noble', 'dark'] });
    const results = evaluateAllFoundingGates(record);
    expect(Object.keys(results)).toHaveLength(6);
    expect(results.loyal_ascension).toBe(true);
    expect(results.monster).toBe(true);
    expect(results.vanishing).toBe(true);
  });
});

// ─── Relationship State ────────────────────────────────────────────

describe('buildRelationshipState', () => {
  it('builds from thread props with intervention tracking', () => {
    const props = makeThreadProps();
    const rel = buildRelationshipState(props);
    expect(rel.bondTier).toBe(2);
    expect(rel.interventionRatio).toBeCloseTo(0.625, 2);
    expect(rel.supportiveVsCoercive).toBe(3); // 4 - 1
    expect(rel.trust).toBeGreaterThan(0);
  });

  it('handles missing intervention tracking', () => {
    const props = makeThreadProps({ interventionTracking: undefined });
    const rel = buildRelationshipState(props);
    expect(rel.interventionRatio).toBe(0);
    expect(rel.supportiveVsCoercive).toBe(0);
  });
});

// ─── Convergence Algorithm ─────────────────────────────────────────

describe('resolveReturn', () => {
  it('triumph ordeal + noble tags → loyal_ascension', () => {
    const record = makeMeetingRecord({ foundingGateTags: ['noble', 'heroic_origin'] });
    const rel = makeRelState({ trust: 0.8, supportiveVsCoercive: 3 });
    const { outcome } = resolveReturn(record, 'triumph', rel, 'iron_heart', []);
    expect(outcome).toBe('loyal_ascension');
  });

  it('broken ordeal + dark tags → monster or usurper', () => {
    const record = makeMeetingRecord({ foundingGateTags: ['dark', 'cunning'] });
    const rel = makeRelState({ trust: -0.5, supportiveVsCoercive: -3 });
    const { outcome } = resolveReturn(record, 'broken', rel, 'shadow_shadow', []);
    expect(['monster', 'usurper', 'vanishing']).toContain(outcome);
  });

  it('broken ordeal closes loyal_ascension', () => {
    const record = makeMeetingRecord({ foundingGateTags: ['noble'] });
    const rel = makeRelState({ trust: 0.9 });
    const { eligible } = resolveReturn(record, 'broken', rel, 'iron_heart', []);
    expect(eligible).not.toContain('loyal_ascension');
  });

  it('triumph ordeal closes monster', () => {
    const record = makeMeetingRecord({ foundingGateTags: ['dark'] });
    const rel = makeRelState({ trust: -0.5 });
    const { eligible } = resolveReturn(record, 'triumph', rel, 'shadow_shadow', []);
    expect(eligible).not.toContain('monster');
  });

  it('falls back to vanishing when no eligible outcomes', () => {
    // Create a record with very restrictive tags
    const record = makeMeetingRecord({
      foundingGateTags: [],
      intentPrimaryReach: 'iron',
    });
    const rel = makeRelState();
    const { outcome } = resolveReturn(record, 'scraped_through', rel, 'unknown_archetype', []);
    // Only vanishing is gateless
    expect(outcome).toBe('vanishing');
  });

  it('scraped_through keeps all eligible outcomes open', () => {
    const record = makeMeetingRecord({
      foundingGateTags: ['noble', 'dark', 'cunning', 'cosmic_touch'],
      intentPrimaryReach: 'star',
    });
    const rel = makeRelState();
    const { eligible } = resolveReturn(record, 'scraped_through', rel, 'star_star', []);
    // scraped_through closes nothing
    expect(eligible.length).toBeGreaterThanOrEqual(4);
  });

  it('returns scores for all eligible outcomes', () => {
    const record = makeMeetingRecord({ foundingGateTags: ['noble', 'dark'] });
    const rel = makeRelState();
    const { scores, eligible } = resolveReturn(record, 'scraped_through', rel, 'iron_heart', []);
    for (const o of eligible) {
      expect(scores[o]).toBeDefined();
      expect(typeof scores[o]).toBe('number');
    }
  });
});

// ─── Ripple Targets ────────────────────────────────────────────────

describe('gatherRippleTargets', () => {
  it('finds artifacts via possesses edges', () => {
    const g = createTestGraph();
    g.addNode({
      id: 'sword_1', name: 'Ashen Blade', type: 'item', category: 'attachment',
      properties: { tier: 'storied' },
    });
    g.addEdge({
      id: 'possess_1', source: 'agent_1', target: 'sword_1', type: 'possesses',
      properties: {},
    });

    const targets = gatherRippleTargets(g, 'agent_1');
    expect(targets.some(t => t.type === 'artifact' && t.name === 'Ashen Blade')).toBe(true);
  });

  it('skips low-tier artifacts', () => {
    const g = createTestGraph();
    g.addNode({
      id: 'junk_1', name: 'Rusty Sword', type: 'item', category: 'attachment',
      properties: { tier: 'common' },
    });
    g.addEdge({
      id: 'possess_2', source: 'agent_1', target: 'junk_1', type: 'possesses',
      properties: {},
    });

    const targets = gatherRippleTargets(g, 'agent_1');
    expect(targets.some(t => t.name === 'Rusty Sword')).toBe(false);
  });

  it('finds factions via member_of edges with high rank', () => {
    const g = createTestGraph();
    g.addNode({
      id: 'faction_1', name: 'Iron Order', type: 'actor', category: 'faction',
      properties: {},
    });
    g.addEdge({
      id: 'member_1', source: 'agent_1', target: 'faction_1', type: 'member_of',
      properties: { rank: 3, role: 'leader' },
    });

    const targets = gatherRippleTargets(g, 'agent_1');
    expect(targets.some(t => t.type === 'faction' && t.name === 'Iron Order')).toBe(true);
  });

  it('caps at RIPPLE_MAX_TARGETS', () => {
    const g = createTestGraph();
    // Add many artifacts
    for (let i = 0; i < 10; i++) {
      g.addNode({
        id: `art_${i}`, name: `Artifact ${i}`, type: 'item', category: 'attachment',
        properties: { tier: 'legendary' },
      });
      g.addEdge({
        id: `poss_${i}`, source: 'agent_1', target: `art_${i}`, type: 'possesses',
        properties: {},
      });
    }

    const targets = gatherRippleTargets(g, 'agent_1');
    expect(targets.length).toBeLessThanOrEqual(5);
  });
});

// ─── Return Outcome Application ────────────────────────────────────

describe('applyReturnOutcome', () => {
  it('loyal_ascension promotes agent to ascendant', () => {
    const g = createTestGraph();
    const { events, threadUpdate } = applyReturnOutcome(
      g, 'agent_1', 'Kira', 'asc_1', 'loyal_ascension', 'thread_1', 50,
    );
    const node = g.getNode('agent_1');
    expect(node?.properties.actorType).toBe('ascendant');
    expect(node?.properties.allied).toBe(true);
    expect(threadUpdate.courtPosition).toBe('retinue');
    expect(events.length).toBeGreaterThan(0);
  });

  it('usurper makes agent a rival', () => {
    const g = createTestGraph();
    const { threadUpdate } = applyReturnOutcome(
      g, 'agent_1', 'Kira', 'asc_1', 'usurper', 'thread_1', 50,
    );
    const node = g.getNode('agent_1');
    expect(node?.properties.isRival).toBe(true);
    expect(threadUpdate.courtPosition).toBeNull();
  });

  it('sacrifice marks agent as dead', () => {
    const g = createTestGraph();
    applyReturnOutcome(g, 'agent_1', 'Kira', 'asc_1', 'sacrifice', 'thread_1', 50);
    const node = g.getNode('agent_1');
    expect(node?.properties.alive).toBe(false);
    expect(node?.properties.deathCause).toBe('sacrifice');
  });

  it('transcendence transforms agent to spirit', () => {
    const g = createTestGraph();
    applyReturnOutcome(g, 'agent_1', 'Kira', 'asc_1', 'transcendence', 'thread_1', 50);
    const node = g.getNode('agent_1');
    expect(node?.properties.actorType).toBe('spirit');
    expect(node?.properties.geniusLoci).toBe(true);
  });

  it('monster makes agent hostile and empowered', () => {
    const g = createTestGraph();
    applyReturnOutcome(g, 'agent_1', 'Kira', 'asc_1', 'monster', 'thread_1', 50);
    const node = g.getNode('agent_1');
    expect(node?.properties.hostile).toBe(true);
    expect(node?.properties.empowered).toBe(true);
    expect(node?.properties.threatLevel).toBe('major');
  });

  it('vanishing clears court position', () => {
    const g = createTestGraph();
    const { threadUpdate } = applyReturnOutcome(
      g, 'agent_1', 'Kira', 'asc_1', 'vanishing', 'thread_1', 50,
    );
    expect(threadUpdate.courtPosition).toBeNull();
  });

  it('all outcomes produce at least one event', () => {
    for (const outcome of ALL_RETURN_OUTCOMES) {
      const g = createTestGraph();
      const { events } = applyReturnOutcome(
        g, 'agent_1', 'Kira', 'asc_1', outcome, 'thread_1', 50,
      );
      expect(events.length).toBeGreaterThan(0);
    }
  });
});

// ─── Court Slot Cooldown ───────────────────────────────────────────

describe('applyCourtSlotCooldown', () => {
  it('sets cooldown on ascendant node', () => {
    const g = createTestGraph();
    const cooldown = applyCourtSlotCooldown(g, 'asc_1', 'sacrifice', 50);
    expect(cooldown).toBe(RETURN_COOLDOWN.sacrifice);
    const node = g.getNode('asc_1');
    expect(node?.properties.firstSlotCooldownUntil).toBe(50 + 8);
  });

  it('caps cooldown at MAX_COOLDOWN_TICKS', () => {
    const g = createTestGraph();
    // Monster has cooldown 10 which is within limit
    const cooldown = applyCourtSlotCooldown(g, 'asc_1', 'monster', 50);
    expect(cooldown).toBe(10);
    const node = g.getNode('asc_1');
    expect(node?.properties.firstSlotCooldownUntil).toBeLessThanOrEqual(50 + MAX_COOLDOWN_TICKS);
  });

  it('loyal_ascension has shortest cooldown', () => {
    const g = createTestGraph();
    const cooldown = applyCourtSlotCooldown(g, 'asc_1', 'loyal_ascension', 50);
    expect(cooldown).toBe(3);
  });

  it('each outcome has a defined cooldown', () => {
    for (const outcome of ALL_RETURN_OUTCOMES) {
      expect(RETURN_COOLDOWN[outcome]).toBeDefined();
      expect(RETURN_COOLDOWN[outcome]).toBeGreaterThan(0);
    }
  });
});
