/**
 * Tests for unified candidate generation.
 *
 * Sprint 3E — Task 3E.1
 */

import { describe, it, expect } from 'vitest';
import { generateUnifiedCandidates, THREAT_REACTION_BONUS } from '../unifiedCandidates';
import type { UnifiedAction, UnifiedActionTemplate } from '../../types/unifiedAction';
import { WorldGraph } from '../graph';

// ─── Helpers ────────────────────────────────────────────────────

function makeTemplate(overrides: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate {
  return {
    id: 'test.template',
    rarityTier: 1,
    intrinsicTier: 'background',
    name: 'Test Template',
    reach: 'iron',
    crudType: 'update',
    scale: 'personal',
    steps: [{
      reach: 'iron',
      duration: { min: 1, max: 1 },
      difficulty: 0.3,
      onSuccess: [],
      onFailure: [],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    actorAffinities: ['individual'],
    motivations: ['courage_prudence'],
    narrativeTemplates: {
      initiation: 'begins',
      success: 'succeeds',
      failure: 'fails',
    },
    ...overrides,
  };
}

function makeGraph(): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-1', type: 'actor', name: 'Alice',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'actor-faction', type: 'actor', name: 'Guild',
    properties: { actorType: 'faction' },
  });
  graph.addNode({
    id: 'loc-1', type: 'location', name: 'Market',
    properties: { locationType: 'settlement' },
  });
  graph.addNode({
    id: 'loc-wild', type: 'location', name: 'Forest',
    properties: { locationType: 'wilderness' },
  });
  graph.addEdge({
    id: 'e-1', source: 'actor-1', target: 'loc-1',
    type: 'located_at', properties: {},
  });
  return graph;
}

// ─── Tests ──────────────────────────────────────────────────────

describe('generateUnifiedCandidates', () => {
  it('returns candidates matching actor affinity', () => {
    const graph = makeGraph();
    const templates = [
      makeTemplate({ id: 'individual-only', actorAffinities: ['individual'] }),
      makeTemplate({ id: 'faction-only', actorAffinities: ['faction'] }),
    ];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates);
    expect(result).toHaveLength(1);
    expect(result[0].templateId).toBe('individual-only');
  });

  it('returns candidates matching location subtype', () => {
    const graph = makeGraph();
    const templates = [
      makeTemplate({ id: 'settlement-action', locationSubtypes: ['settlement'] }),
      makeTemplate({ id: 'wilderness-action', locationSubtypes: ['wilderness'] }),
      makeTemplate({ id: 'anywhere-action' }), // no location filter
    ];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates);
    expect(result).toHaveLength(2);
    expect(result.map(c => c.templateId)).toEqual(['settlement-action', 'anywhere-action']);
  });

  it('returns empty array for missing actor', () => {
    const graph = makeGraph();
    const result = generateUnifiedCandidates(graph, 'nonexistent', 'loc-1', [makeTemplate()]);
    expect(result).toEqual([]);
  });

  it('returns empty array for missing location', () => {
    const graph = makeGraph();
    const result = generateUnifiedCandidates(graph, 'actor-1', 'nonexistent', [makeTemplate()]);
    expect(result).toEqual([]);
  });

  it('skips cosmic and regional scale templates', () => {
    const graph = makeGraph();
    const templates = [
      makeTemplate({ id: 'personal', scale: 'personal' }),
      makeTemplate({ id: 'local', scale: 'local' }),
      makeTemplate({ id: 'cosmic', scale: 'cosmic' }),
      makeTemplate({ id: 'regional', scale: 'regional' }),
    ];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates);
    expect(result).toHaveLength(2);
    expect(result.map(c => c.templateId)).toEqual(['personal', 'local']);
  });

  it('includes both former-CRUD and former-encounter templates', () => {
    const graph = makeGraph();
    const templates = [
      makeTemplate({
        id: 'action.crud',
        scale: 'personal',
        steps: [{ reach: 'iron', duration: { min: 2, max: 4 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'fail_action' }],
      }),
      makeTemplate({
        id: 'encounter.multi',
        scale: 'local',
        steps: [
          { reach: 'shadow', duration: { min: 1, max: 1 }, difficulty: 0.3, onSuccess: [], onFailure: [], failBehavior: 'fail_action' },
          { reach: 'iron', duration: { min: 1, max: 2 }, difficulty: 0.5, onSuccess: [], onFailure: [], failBehavior: 'continue_weakened' },
        ],
      }),
    ];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates);
    expect(result).toHaveLength(2);
    expect(result[0].templateId).toBe('action.crud');
    expect(result[1].templateId).toBe('encounter.multi');
  });

  it('no duplicate candidates from same template', () => {
    const graph = makeGraph();
    const templates = [makeTemplate({ id: 'single' })];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates);
    const ids = result.map(c => c.templateId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('candidates have correct structure', () => {
    const graph = makeGraph();
    const templates = [makeTemplate({
      id: 'test.struct',
      reach: 'gold',
      motivations: ['loyalty_ambition', 'courage_prudence'],
    })];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      templateId: 'test.struct',
      targetId: 'loc-1',
      domain: 'gold',
      score: 0,
      motivations: ['loyalty_ambition', 'courage_prudence'],
    });
  });

  it('faction actor gets faction templates only', () => {
    const graph = makeGraph();
    graph.addEdge({
      id: 'e-faction-loc', source: 'actor-faction', target: 'loc-1',
      type: 'located_at', properties: {},
    });

    const templates = [
      makeTemplate({ id: 'individual-only', actorAffinities: ['individual'] }),
      makeTemplate({ id: 'faction-only', actorAffinities: ['faction'] }),
      makeTemplate({ id: 'both', actorAffinities: ['individual', 'faction'] }),
    ];

    const result = generateUnifiedCandidates(graph, 'actor-faction', 'loc-1', templates);
    expect(result).toHaveLength(2);
    expect(result.map(c => c.templateId)).toEqual(['faction-only', 'both']);
  });

  it('template with no affinity filter matches any actor', () => {
    const graph = makeGraph();
    const templates = [makeTemplate({ id: 'open', actorAffinities: [] })];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates);
    expect(result).toHaveLength(1);
  });

  it('template with empty locationSubtypes matches any location', () => {
    const graph = makeGraph();
    const templates = [makeTemplate({ id: 'anywhere', locationSubtypes: [] })];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates);
    expect(result).toHaveLength(1);
  });

  // ─── Group-exclusive reachability (THR-74) ────────────────────
  // A `['group']`-only template never matches a grouped agent's own
  // `actorType: 'individual'`. It becomes reachable only when the actor's
  // company can field `minGroupMembers` living members.

  /**
   * Put `actor-1` in an active company alongside `livingCompanions` other living
   * members (and optionally one dead member, retained as a graph node the way a
   * hard death does not — {@link isAgentGone} still excludes it from the count).
   */
  function joinActiveCompany(
    graph: WorldGraph,
    livingCompanions: number,
    deadCompanions = 0,
  ): void {
    graph.addNode({
      id: 'company-1', type: 'actor', name: 'The Test Company',
      properties: { actorType: 'group', groupType: 'party', groupStatus: 'active' },
    });
    graph.addEdge({
      id: 'mem-actor-1', source: 'actor-1', target: 'company-1',
      type: 'member_of', properties: { role: 'member', rank: 0, joinedTick: 0 },
    });
    for (let i = 0; i < livingCompanions; i++) {
      graph.addNode({
        id: `companion-${i}`, type: 'actor', name: `Companion ${i}`,
        properties: { actorType: 'individual' },
      });
      graph.addEdge({
        id: `mem-companion-${i}`, source: `companion-${i}`, target: 'company-1',
        type: 'member_of', properties: { role: 'member', rank: 1 + i, joinedTick: 1 + i },
      });
    }
    for (let i = 0; i < deadCompanions; i++) {
      graph.addNode({
        id: `dead-${i}`, type: 'actor', name: `Fallen ${i}`,
        properties: { actorType: 'individual', deceased: true },
      });
      graph.addEdge({
        id: `mem-dead-${i}`, source: `dead-${i}`, target: 'company-1',
        type: 'member_of', properties: { role: 'member', rank: 50 + i, joinedTick: 50 + i },
      });
    }
  }

  it('a grouped agent draws a group-exclusive template when the company is large enough', () => {
    const graph = makeGraph();
    joinActiveCompany(graph, 1); // actor-1 + 1 companion = 2 living members
    const templates = [
      makeTemplate({ id: 'party.delve', actorAffinities: ['group'], minGroupMembers: 2 }),
    ];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates);
    expect(result.map(c => c.templateId)).toEqual(['party.delve']);
  });

  it('an ungrouped agent never draws a group-exclusive template', () => {
    const graph = makeGraph();
    const templates = [
      makeTemplate({ id: 'party.delve', actorAffinities: ['group'], minGroupMembers: 2 }),
    ];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates);
    expect(result).toHaveLength(0);
  });

  it('a grouped agent below minGroupMembers does not draw the template', () => {
    const graph = makeGraph();
    joinActiveCompany(graph, 0); // actor-1 alone — 1 living member
    const templates = [
      makeTemplate({ id: 'party.delve', actorAffinities: ['group'], minGroupMembers: 2 }),
    ];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates);
    expect(result).toHaveLength(0);
  });

  it('dead members do not count toward the minGroupMembers threshold', () => {
    const graph = makeGraph();
    joinActiveCompany(graph, 0, 1); // actor-1 living + 1 deceased echo = 1 living
    const templates = [
      makeTemplate({ id: 'party.delve', actorAffinities: ['group'], minGroupMembers: 2 }),
    ];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates);
    expect(result).toHaveLength(0);
  });

  it('defaults the threshold to the minimum company size when minGroupMembers is absent', () => {
    const graph = makeGraph();
    joinActiveCompany(graph, 1); // 2 living members, GROUP_MIN_MEMBERS is 2
    const templates = [
      makeTemplate({ id: 'party.open', actorAffinities: ['group'] }), // no minGroupMembers
    ];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates);
    expect(result.map(c => c.templateId)).toEqual(['party.open']);
  });

  it('a swept individual+group template is still drawn by a solo agent (regression)', () => {
    const graph = makeGraph(); // actor-1 is ungrouped
    const templates = [
      makeTemplate({ id: 'swept.delve', actorAffinities: ['individual', 'group'] }),
    ];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates);
    expect(result.map(c => c.templateId)).toEqual(['swept.delve']);
  });
});

// ─── Threat-Reactive Scoring Tests ──────────────────────────────

function makeThreatAction(overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'threat-1',
    actorId: 'actor-enemy',
    templateId: 'siege.attack',
    targetId: 'loc-1',
    scale: 'local',
    source: 'agent',
    startTick: 5,
    currentStep: 0,
    stepProgress: 1,
    stepDuration: 3,
    resolved: false,
    stepOutcomes: [],
    ...overrides,
  };
}

describe('threat-reactive candidate scoring', () => {
  it('no active threats → all candidates scored 0', () => {
    const graph = makeGraph();
    const templates = [
      makeTemplate({ id: 'defend.garrison', contestsWith: ['siege.attack'] }),
      makeTemplate({ id: 'trade.buy' }),
    ];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates, []);
    expect(result).toHaveLength(2);
    expect(result[0].score).toBe(0);
    expect(result[1].score).toBe(0);
  });

  it('active siege at location → defensive candidate gets bonus', () => {
    const graph = makeGraph();
    const templates = [
      makeTemplate({ id: 'defend.garrison', contestsWith: ['siege.attack'] }),
      makeTemplate({ id: 'trade.buy' }),
    ];

    const activeActions = [makeThreatAction()];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates, activeActions);
    expect(result).toHaveLength(2);

    const defend = result.find(c => c.templateId === 'defend.garrison')!;
    const trade = result.find(c => c.templateId === 'trade.buy')!;

    expect(defend.score).toBe(THREAT_REACTION_BONUS);
    expect(trade.score).toBe(0);
  });

  it('bonus does not apply to unrelated actions', () => {
    const graph = makeGraph();
    const templates = [
      makeTemplate({ id: 'defend.garrison', contestsWith: ['siege.attack'] }),
      makeTemplate({ id: 'counter.spy', contestsWith: ['espionage.infiltrate'] }),
    ];

    // Threat is siege.attack, not espionage.infiltrate
    const activeActions = [makeThreatAction({ templateId: 'siege.attack' })];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates, activeActions);
    const defend = result.find(c => c.templateId === 'defend.garrison')!;
    const counter = result.find(c => c.templateId === 'counter.spy')!;

    expect(defend.score).toBe(THREAT_REACTION_BONUS);
    expect(counter.score).toBe(0); // doesn't contest siege.attack
  });

  it('threat at different location → no bonus', () => {
    const graph = makeGraph();
    const templates = [
      makeTemplate({ id: 'defend.garrison', contestsWith: ['siege.attack'] }),
    ];

    // Threat targets loc-2, not loc-1
    const activeActions = [makeThreatAction({ targetId: 'loc-2' })];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates, activeActions);
    expect(result[0].score).toBe(0);
  });

  it('resolved threat → no bonus', () => {
    const graph = makeGraph();
    const templates = [
      makeTemplate({ id: 'defend.garrison', contestsWith: ['siege.attack'] }),
    ];

    // Threat is resolved (already completed)
    const activeActions = [makeThreatAction({ resolved: true })];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates, activeActions);
    expect(result[0].score).toBe(0);
  });

  it('own action does not count as threat', () => {
    const graph = makeGraph();
    const templates = [
      makeTemplate({ id: 'defend.garrison', contestsWith: ['siege.attack'] }),
    ];

    // The threat is by actor-1 themselves — should not self-threaten
    const activeActions = [makeThreatAction({ actorId: 'actor-1' })];

    const result = generateUnifiedCandidates(graph, 'actor-1', 'loc-1', templates, activeActions);
    expect(result[0].score).toBe(0);
  });
});
