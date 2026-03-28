/**
 * Tests for contestation detection and resolution.
 *
 * Sprint 4 — Task 4.1
 */

import { describe, it, expect } from 'vitest';
import {
  detectContestations,
  resolveContestationPair,
} from '../contestation';
import type {
  UnifiedAction,
  UnifiedActionTemplate,
  ActionStep,
} from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';

// ─── Helpers ────────────────────────────────────────────────────

function makeStep(overrides: Partial<ActionStep> = {}): ActionStep {
  return {
    reach: 'iron',
    duration: { min: 2, max: 2 },
    difficulty: 0.3,
    onSuccess: [],
    onFailure: [],
    failBehavior: 'fail_action',
    ...overrides,
  };
}

function makeTemplate(overrides: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate {
  return {
    id: 'test.template',
    name: 'Test Template',
    reach: 'iron',
    crudType: 'update',
    scale: 'personal',
    steps: [makeStep()],
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

function makeAction(overrides: Partial<UnifiedAction> = {}): UnifiedAction {
  return {
    actionId: 'action-1',
    actorId: 'actor-1',
    templateId: 'test.template',
    targetId: 'loc-1',
    scale: 'personal',
    source: 'agent',
    startTick: 5,
    currentStep: 0,
    stepProgress: 2,
    stepDuration: 2,
    resolved: false,
    stepOutcomes: [],
    ...overrides,
  };
}

function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: 'actor-1', type: 'actor', name: 'Attacker',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'actor-2', type: 'actor', name: 'Defender',
    properties: { actorType: 'individual' },
  });
  graph.addNode({
    id: 'loc-1', type: 'location', name: 'Crossroads',
    properties: { locationType: 'town', locationSubtype: 'town' },
  });
  graph.addEdge({ id: 'e-1', source: 'actor-1', target: 'loc-1', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'e-2', source: 'actor-2', target: 'loc-1', type: 'located_at', properties: {} });

  return {
    tick: 10,
    seed: 42,
    cycle: 1,
    phase: 'playing',
    graph,
    cosmology: {} as any,
    tiles: [],
    clock: {} as any,
    ascendantId: 'asc-1',
    essencePool: {} as any,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: [],
    rivalStates: [],
    doomDefinition: {} as any,
    doomClock: {} as any,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap: {} as any,
    familiarityMap: {} as any,
    culturalInsightMap: new Map(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {} as any,
    echoDefinitions: [],
    echoStates: [],
    chronicle: {} as any,
  };
}

// ─── Detection Tests ────────────────────────────────────────────

describe('detectContestations', () => {
  it('pairs two opposing actions on the same target', () => {
    const templates = [
      makeTemplate({ id: 'attack.raid', contestsWith: ['defend.garrison'] }),
      makeTemplate({ id: 'defend.garrison' }),
    ];

    const completing = [
      makeAction({ actionId: 'a-1', actorId: 'actor-1', templateId: 'attack.raid', targetId: 'loc-1' }),
      makeAction({ actionId: 'a-2', actorId: 'actor-2', templateId: 'defend.garrison', targetId: 'loc-1' }),
    ];

    const pairs = detectContestations(completing, templates);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].attackerActionId).toBe('a-1');
    expect(pairs[0].defenderActionId).toBe('a-2');
    expect(pairs[0].targetId).toBe('loc-1');
  });

  it('does not pair actions that do not declare contestsWith', () => {
    const templates = [
      makeTemplate({ id: 'trade.buy' }),
      makeTemplate({ id: 'trade.sell' }),
    ];

    const completing = [
      makeAction({ actionId: 'a-1', templateId: 'trade.buy', targetId: 'loc-1' }),
      makeAction({ actionId: 'a-2', templateId: 'trade.sell', targetId: 'loc-1' }),
    ];

    const pairs = detectContestations(completing, templates);
    expect(pairs).toHaveLength(0);
  });

  it('does not pair actions on different targets', () => {
    const templates = [
      makeTemplate({ id: 'attack.raid', contestsWith: ['defend.garrison'] }),
      makeTemplate({ id: 'defend.garrison' }),
    ];

    const completing = [
      makeAction({ actionId: 'a-1', templateId: 'attack.raid', targetId: 'loc-1' }),
      makeAction({ actionId: 'a-2', templateId: 'defend.garrison', targetId: 'loc-2' }),
    ];

    const pairs = detectContestations(completing, templates);
    expect(pairs).toHaveLength(0);
  });

  it('assigns attacker based on who declares contestsWith', () => {
    // Only B contests A → B is attacker
    const templates = [
      makeTemplate({ id: 'passive.template' }),
      makeTemplate({ id: 'aggressive.template', contestsWith: ['passive.template'] }),
    ];

    const completing = [
      makeAction({ actionId: 'a-1', templateId: 'passive.template', targetId: 'loc-1' }),
      makeAction({ actionId: 'a-2', templateId: 'aggressive.template', targetId: 'loc-1' }),
    ];

    const pairs = detectContestations(completing, templates);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].attackerActionId).toBe('a-2'); // aggressive is attacker
    expect(pairs[0].defenderActionId).toBe('a-1');
  });

  it('when both contest each other, higher scale priority attacks', () => {
    const templates = [
      makeTemplate({ id: 'local.action', contestsWith: ['regional.action'] }),
      makeTemplate({ id: 'regional.action', contestsWith: ['local.action'] }),
    ];

    const completing = [
      makeAction({ actionId: 'a-local', templateId: 'local.action', targetId: 'loc-1', scale: 'local' }),
      makeAction({ actionId: 'a-regional', templateId: 'regional.action', targetId: 'loc-1', scale: 'regional' }),
    ];

    const pairs = detectContestations(completing, templates);
    expect(pairs).toHaveLength(1);
    // Regional (priority 1) beats local (priority 2) — regional attacks
    expect(pairs[0].attackerActionId).toBe('a-regional');
    expect(pairs[0].defenderActionId).toBe('a-local');
  });

  it('when both contest at same scale, earlier startTick attacks', () => {
    const templates = [
      makeTemplate({ id: 'action.a', contestsWith: ['action.b'] }),
      makeTemplate({ id: 'action.b', contestsWith: ['action.a'] }),
    ];

    const completing = [
      makeAction({ actionId: 'a-late', templateId: 'action.a', targetId: 'loc-1', scale: 'personal', startTick: 8 }),
      makeAction({ actionId: 'a-early', templateId: 'action.b', targetId: 'loc-1', scale: 'personal', startTick: 3 }),
    ];

    const pairs = detectContestations(completing, templates);
    expect(pairs).toHaveLength(1);
    expect(pairs[0].attackerActionId).toBe('a-early');
    expect(pairs[0].defenderActionId).toBe('a-late');
  });

  it('each action appears in at most one pair', () => {
    const templates = [
      makeTemplate({ id: 'attack', contestsWith: ['defend'] }),
      makeTemplate({ id: 'defend' }),
    ];

    // Three actions at same target: a-1 contests a-2 and a-3
    const completing = [
      makeAction({ actionId: 'a-1', templateId: 'attack', targetId: 'loc-1' }),
      makeAction({ actionId: 'a-2', templateId: 'defend', targetId: 'loc-1' }),
      makeAction({ actionId: 'a-3', templateId: 'defend', targetId: 'loc-1' }),
    ];

    const pairs = detectContestations(completing, templates);
    // a-1 should only appear in one pair
    expect(pairs).toHaveLength(1);
    expect(pairs[0].attackerActionId).toBe('a-1');
  });

  it('handles missing template gracefully', () => {
    const templates = [
      makeTemplate({ id: 'known.template', contestsWith: ['unknown.template'] }),
    ];

    const completing = [
      makeAction({ actionId: 'a-1', templateId: 'known.template', targetId: 'loc-1' }),
      makeAction({ actionId: 'a-2', templateId: 'unknown.template', targetId: 'loc-1' }),
    ];

    // unknown.template has no template def → skip pair
    const pairs = detectContestations(completing, templates);
    expect(pairs).toHaveLength(0);
  });

  it('returns empty for single completing action', () => {
    const templates = [makeTemplate({ id: 'solo', contestsWith: ['anything'] })];
    const completing = [makeAction({ actionId: 'a-1', templateId: 'solo', targetId: 'loc-1' })];

    const pairs = detectContestations(completing, templates);
    expect(pairs).toHaveLength(0);
  });
});

// ─── Resolution Tests ───────────────────────────────────────────

describe('resolveContestationPair', () => {
  it('attacker wins when attacker succeeds and defender fails', () => {
    const state = makeState();
    const attackerTemplate = makeTemplate({ id: 'attack', steps: [makeStep({ difficulty: 0.0 })] });
    const defenderTemplate = makeTemplate({ id: 'defend', steps: [makeStep({ difficulty: 0.99 })] });

    const attacker = makeAction({ actionId: 'atk', actorId: 'actor-1', templateId: 'attack' });
    const defender = makeAction({ actionId: 'def', actorId: 'actor-2', templateId: 'defend' });

    // RNG: attacker roll low (succeeds at easy difficulty), defender roll high (fails at hard difficulty)
    let call = 0;
    const rng = () => { call++; return call === 1 ? 0.01 : 0.99; };

    const result = resolveContestationPair(attacker, defender, attackerTemplate, defenderTemplate, state, rng);
    expect(result.attackerOutcome).toBe('success');
    expect(result.defenderOutcome).toBe('failure');
  });

  it('defender wins when defender succeeds and attacker fails', () => {
    const state = makeState();
    const attackerTemplate = makeTemplate({ id: 'attack', steps: [makeStep({ difficulty: 0.99 })] });
    const defenderTemplate = makeTemplate({ id: 'defend', steps: [makeStep({ difficulty: 0.0 })] });

    const attacker = makeAction({ actionId: 'atk', actorId: 'actor-1', templateId: 'attack' });
    const defender = makeAction({ actionId: 'def', actorId: 'actor-2', templateId: 'defend' });

    // attacker high roll (fails), defender low roll (succeeds)
    let call = 0;
    const rng = () => { call++; return call === 1 ? 0.99 : 0.01; };

    const result = resolveContestationPair(attacker, defender, attackerTemplate, defenderTemplate, state, rng);
    expect(result.attackerOutcome).toBe('failure');
    expect(result.defenderOutcome).toBe('success');
  });

  it('defender wins stalemate (stability bias)', () => {
    const state = makeState();
    // Both easy → both succeed → stalemate → defender wins
    const attackerTemplate = makeTemplate({ id: 'attack', steps: [makeStep({ difficulty: 0.0 })] });
    const defenderTemplate = makeTemplate({ id: 'defend', steps: [makeStep({ difficulty: 0.0 })] });

    const attacker = makeAction({ actionId: 'atk', actorId: 'actor-1', templateId: 'attack' });
    const defender = makeAction({ actionId: 'def', actorId: 'actor-2', templateId: 'defend' });

    // Both roll low → both succeed
    const rng = () => 0.01;

    const result = resolveContestationPair(attacker, defender, attackerTemplate, defenderTemplate, state, rng);
    // Stalemate → defender wins (stability bias)
    expect(result.attackerOutcome).toBe('failure');
    expect(result.defenderOutcome).toBe('success');
  });

  it('mutual failure when both fail', () => {
    const state = makeState();
    // Both very hard → both fail
    const attackerTemplate = makeTemplate({ id: 'attack', steps: [makeStep({ difficulty: 0.99 })] });
    const defenderTemplate = makeTemplate({ id: 'defend', steps: [makeStep({ difficulty: 0.99 })] });

    const attacker = makeAction({ actionId: 'atk', actorId: 'actor-1', templateId: 'attack' });
    const defender = makeAction({ actionId: 'def', actorId: 'actor-2', templateId: 'defend' });

    // Both roll high → both fail (probability clamped to 0.05, threshold = 5, roll = 100)
    const rng = () => 0.99;

    const result = resolveContestationPair(attacker, defender, attackerTemplate, defenderTemplate, state, rng);
    expect(result.attackerOutcome).toBe('failure');
    expect(result.defenderOutcome).toBe('failure');
  });

  it('handles missing step defensively', () => {
    const state = makeState();
    const template = makeTemplate({ id: 't', steps: [] }); // no steps!

    const attacker = makeAction({ actionId: 'atk', actorId: 'actor-1', templateId: 't', currentStep: 0 });
    const defender = makeAction({ actionId: 'def', actorId: 'actor-2', templateId: 't', currentStep: 0 });

    const result = resolveContestationPair(attacker, defender, template, template, state, () => 0.5);
    // Defensive fallback: defender wins
    expect(result.attackerOutcome).toBe('failure');
    expect(result.defenderOutcome).toBe('success');
  });
});
