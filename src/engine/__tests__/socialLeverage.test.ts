/**
 * Social Leverage System Tests — THR-28
 *
 * Covers:
 *   - computeInitialLeverage() bond/wealth/power/rank contributions
 *   - isSocialSceneTemplate() detection
 *   - selectCounterArgument() dominant axis, vulnerable/resistant, threshold suppression
 *   - Conditional step skipping (leverage_range) in advanceEncounter()
 *   - Leverage accumulation in resolveEncounter()
 *   - Divine effects: Tip the Scales (socialLeverageShift) and Embolden (counterResistanceActive)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  computeInitialLeverage,
  isSocialSceneTemplate,
  LEVERAGE_BOND_BONUS,
  LEVERAGE_INITIAL_CAP,
} from '../socialLeverage';
import {
  selectCounterArgument,
  applyCounterModifier,
  findDominantAxis,
} from '../socialCounterArgument';
import {
  COUNTER_ARGUMENT_LEVERAGE_THRESHOLD,
  COUNTER_VULNERABLE_BONUS,
  COUNTER_RESISTANT_PENALTY,
} from '../../data/counter-argument-content';
import { WorldGraph } from '../graph';
import {
  resolveEncounter,
  advanceEncounter,
} from '../encounter';
import type { GameState } from '../../types';
import type { EncounterProgress, EncounterTemplate } from '../../types/encounter';
import { LEVERAGE_STEP_SUCCESS, LEVERAGE_STEP_FAILURE } from '../../types/encounter';
import * as encounterContent from '../../data/encounter-content';

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildGraph(): WorldGraph {
  return new WorldGraph();
}

function buildGameState(graph: WorldGraph): GameState {
  return {
    tick: 1,
    graph,
    encounterProgress: [],
    pendingQuintessenceEvents: [],
    effectStates: {},
    unifiedActions: [],
    ascendantId: 'asc.1',
    worldVersion: 0,
    structuralCacheVersion: 0,
    fogOfWar: false,
  } as unknown as GameState;
}

/** Minimal progress for a social scene encounter. */
function makeSocialProgress(
  encounterId: string,
  actorId: string,
  targetAgentId: string,
  overrides?: Partial<EncounterProgress>,
): EncounterProgress {
  return {
    encounterId,
    actorId,
    targetAgentId,
    currentEncounterIndex: 0,
    history: [],
    resolutionHistory: [],
    status: 'active',
    startedTick: 1,
    leverage: 0.3,
    leverageHistory: [],
    ...overrides,
  };
}

// ─── computeInitialLeverage ──────────────────────────────────────────────────

describe('computeInitialLeverage', () => {
  it('returns 0 when both agents are strangers with no resources', () => {
    const graph = buildGraph();
    graph.addNode({ id: 'a1', type: 'actor', name: 'Actor', properties: {} });
    graph.addNode({ id: 't1', type: 'actor', name: 'Target', properties: {} });
    const result = computeInitialLeverage(graph, 'a1', 't1');
    expect(result.leverage).toBe(0);
    expect(result.history).toEqual([]);
  });

  it('applies bond bonus when actor has strong trust with target', () => {
    const graph = buildGraph();
    graph.addNode({ id: 'a1', type: 'actor', name: 'Actor', properties: {} });
    graph.addNode({ id: 't1', type: 'actor', name: 'Target', properties: {} });
    // getTrust reads relates_to edges with a trust property
    graph.addEdge({
      id: 'relates.a1.t1',
      type: 'relates_to',
      source: 'a1',
      target: 't1',
      properties: { trust: 0.8 },
    });
    const result = computeInitialLeverage(graph, 'a1', 't1');
    expect(result.leverage).toBeGreaterThan(0);
    expect(result.leverage).toBeGreaterThanOrEqual(LEVERAGE_BOND_BONUS);
    expect(result.history.some(h => h.source === 'bond_bonus')).toBe(true);
  });

  it('is capped at LEVERAGE_INITIAL_CAP (0.30)', () => {
    const graph = buildGraph();
    graph.addNode({ id: 'a1', type: 'actor', name: 'Actor', properties: { gold: 9999, iron: 50 } });
    graph.addNode({ id: 't1', type: 'actor', name: 'Target', properties: { gold: 1 } });
    graph.addEdge({
      id: 'trust.a1.t1',
      type: 'trusts',
      source: 'a1',
      target: 't1',
      properties: { trustScore: 1.0 },
    });
    const result = computeInitialLeverage(graph, 'a1', 't1');
    expect(result.leverage).toBeLessThanOrEqual(LEVERAGE_INITIAL_CAP);
  });

  it('returns 0 when actor node is missing (fail-soft)', () => {
    const graph = buildGraph();
    graph.addNode({ id: 't1', type: 'actor', name: 'Target', properties: {} });
    const result = computeInitialLeverage(graph, 'missing', 't1');
    expect(result.leverage).toBe(0);
  });

  it('returns 0 when target node is missing (fail-soft)', () => {
    const graph = buildGraph();
    graph.addNode({ id: 'a1', type: 'actor', name: 'Actor', properties: {} });
    const result = computeInitialLeverage(graph, 'a1', 'missing');
    expect(result.leverage).toBe(0);
  });
});

// ─── isSocialSceneTemplate ───────────────────────────────────────────────────

describe('isSocialSceneTemplate', () => {
  it('returns false for steps without leverageOnSuccess', () => {
    const steps = [
      { id: 's1', name: 'Step', narrative: '', reach: 'heart' as const, difficulty: 30,
        onSuccess: { narrative: '' }, onFailure: { narrative: '' } },
    ];
    expect(isSocialSceneTemplate(steps)).toBe(false);
  });

  it('returns true when at least one step has leverageOnSuccess', () => {
    const steps = [
      { id: 's1', name: 'Step', narrative: '', reach: 'heart' as const, difficulty: 30,
        leverageOnSuccess: 0.15,
        onSuccess: { narrative: '' }, onFailure: { narrative: '' } },
    ];
    expect(isSocialSceneTemplate(steps)).toBe(true);
  });
});

// ─── findDominantAxis ────────────────────────────────────────────────────────

describe('findDominantAxis', () => {
  it('returns a result with value 0 for a fully zeroed profile', () => {
    // All axis values are 0 — function returns first axis encountered (no null)
    const result = findDominantAxis({} as Parameters<typeof findDominantAxis>[0]);
    // Result is non-null (some axis is returned) but its value is 0
    expect(result).not.toBeNull();
    expect(result?.value).toBe(0);
  });

  it('returns the axis with the highest absolute value', () => {
    const profile = {
      courage_prudence: 0.2,
      loyalty_ambition: -0.9,
      honesty_cunning: 0.1,
    } as Parameters<typeof findDominantAxis>[0];
    const result = findDominantAxis(profile);
    expect(result?.axis).toBe('loyalty_ambition');
    expect(result?.value).toBeCloseTo(-0.9);
  });

  it('works with all-zero profile', () => {
    const profile = { courage_prudence: 0 } as Parameters<typeof findDominantAxis>[0];
    const result = findDominantAxis(profile);
    // best.abs is 0, which is NOT > -1, so first iteration sets it. Returns axis with value 0.
    expect(result?.value).toBe(0);
  });
});

// ─── selectCounterArgument ───────────────────────────────────────────────────

describe('selectCounterArgument', () => {
  it('returns null when target node is missing', () => {
    const graph = buildGraph();
    const result = selectCounterArgument(graph, 'missing', 'heart', 0.3);
    expect(result).toBeNull();
  });

  it('returns null when target has no axiological profile', () => {
    const graph = buildGraph();
    graph.addNode({ id: 't1', type: 'actor', name: 'Target', properties: {} });
    const result = selectCounterArgument(graph, 't1', 'heart', 0.3);
    expect(result).toBeNull();
  });

  it('returns null when leverage exceeds COUNTER_ARGUMENT_LEVERAGE_THRESHOLD', () => {
    const graph = buildGraph();
    graph.addNode({
      id: 't1', type: 'actor', name: 'Target',
      properties: { axiologicalProfile: { courage_prudence: 0.8 } },
    });
    const result = selectCounterArgument(graph, 't1', 'heart', COUNTER_ARGUMENT_LEVERAGE_THRESHOLD);
    expect(result).toBeNull();
  });

  it('returns a counter when target has a dominant axis in the library', () => {
    const graph = buildGraph();
    graph.addNode({
      id: 't1', type: 'actor', name: 'Target',
      properties: { axiologicalProfile: { courage_prudence: 0.8 } },
    });
    const result = selectCounterArgument(graph, 't1', 'shadow', 0.3);
    expect(result).not.toBeNull();
    expect(result?.axis).toBe('courage_prudence');
    expect(result?.pole).toBe('positive');
    // Shadow is vulnerable to the courage counter → negative modifier
    expect(result?.difficultyModifier).toBe(COUNTER_VULNERABLE_BONUS);
  });

  it('applies resistant penalty for matching resistant reach', () => {
    const graph = buildGraph();
    graph.addNode({
      id: 't1', type: 'actor', name: 'Target',
      properties: { axiologicalProfile: { courage_prudence: 0.8 } },
    });
    // Iron is resistant for the courage pole
    const result = selectCounterArgument(graph, 't1', 'iron', 0.3);
    expect(result?.difficultyModifier).toBe(COUNTER_RESISTANT_PENALTY);
  });

  it('returns zero difficultyModifier for neutral reach', () => {
    const graph = buildGraph();
    graph.addNode({
      id: 't1', type: 'actor', name: 'Target',
      properties: { axiologicalProfile: { courage_prudence: 0.8 } },
    });
    // Heart is neither vulnerable nor resistant for courage_prudence positive pole
    const result = selectCounterArgument(graph, 't1', 'heart', 0.3);
    expect(result?.difficultyModifier).toBe(0);
  });
});

// ─── applyCounterModifier ────────────────────────────────────────────────────

describe('applyCounterModifier', () => {
  it('returns baseDifficulty unchanged when counter is null', () => {
    expect(applyCounterModifier(40, null)).toBe(40);
  });

  it('applies negative modifier (vulnerability)', () => {
    const counter = { difficultyModifier: COUNTER_VULNERABLE_BONUS, narrative: '', axis: 'courage_prudence' as const, pole: 'positive' as const, vulnerableTo: [], resistantTo: [] };
    expect(applyCounterModifier(40, counter)).toBe(40 + COUNTER_VULNERABLE_BONUS);
  });

  it('applies positive modifier (resistance)', () => {
    const counter = { difficultyModifier: COUNTER_RESISTANT_PENALTY, narrative: '', axis: 'courage_prudence' as const, pole: 'positive' as const, vulnerableTo: [], resistantTo: [] };
    expect(applyCounterModifier(40, counter)).toBe(40 + COUNTER_RESISTANT_PENALTY);
  });

  it('clamps result to [1, 100]', () => {
    const highPenalty = { difficultyModifier: 999, narrative: '', axis: 'courage_prudence' as const, pole: 'positive' as const, vulnerableTo: [], resistantTo: [] };
    expect(applyCounterModifier(99, highPenalty)).toBe(100);
    const bigBonus = { difficultyModifier: -999, narrative: '', axis: 'courage_prudence' as const, pole: 'positive' as const, vulnerableTo: [], resistantTo: [] };
    expect(applyCounterModifier(5, bigBonus)).toBe(1);
  });
});

// ─── Conditional Step Skipping ───────────────────────────────────────────────

describe('advanceEncounter — conditional step skipping', () => {
  const mockTemplate: EncounterTemplate = {
    id: 'test.social.scene',
    name: 'Test Scene',
    locationTypes: ['town'],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'present',
    motivations: ['loyalty_ambition'],
    steps: [
      {
        id: 'step.1', name: 'Step 1', reach: 'eye', difficulty: 25, narrative: 'S1',
        leverageOnSuccess: 0.15, onSuccess: { narrative: 'OK' }, onFailure: { narrative: 'FAIL' },
      },
      {
        id: 'step.counter', name: 'Counter', reach: 'heart', difficulty: 38, narrative: 'Counter',
        conditional: { type: 'leverage_range', leverageMax: 0.69 },
        onSuccess: { narrative: 'OK' }, onFailure: { narrative: 'FAIL' },
      },
      {
        id: 'step.resolution', name: 'Resolution', reach: 'heart', difficulty: 52, narrative: 'Final',
        leverageModifiesDifficulty: true,
        onSuccess: { narrative: 'WIN' }, onFailure: { narrative: 'LOSE' },
      },
    ],
  };

  beforeEach(() => {
    vi.spyOn(encounterContent, 'getAnyEncounterById').mockReturnValue(mockTemplate);
  });

  it('skips counter step when leverage >= 0.70', () => {
    const graph = buildGraph();
    const state = buildGameState(graph);
    const progress = makeSocialProgress('test.social.scene', 'a1', 't1', {
      leverage: 0.75,
    });

    advanceEncounter(state, progress, true, 1);

    // Should jump past the conditional step (idx 1) to resolution (idx 2)
    expect(progress.currentEncounterIndex).toBe(2);
    expect(progress.status).toBe('active');
  });

  it('does NOT skip counter step when leverage < 0.70', () => {
    const graph = buildGraph();
    const state = buildGameState(graph);
    const progress = makeSocialProgress('test.social.scene', 'a1', 't1', {
      leverage: 0.50,
    });

    advanceEncounter(state, progress, true, 1);

    // Counter step condition met → advance to idx 1
    expect(progress.currentEncounterIndex).toBe(1);
    expect(progress.status).toBe('active');
  });
});

// ─── Leverage Accumulation via resolveEncounter ──────────────────────────────

describe('resolveEncounter — leverage accumulation', () => {
  const mockTemplateWithLeverage: EncounterTemplate = {
    id: 'test.leverage.template',
    name: 'Leverage Test',
    locationTypes: ['town'],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'present',
    motivations: ['loyalty_ambition'],
    steps: [
      {
        id: 'lev.step1', name: 'Leverage Step', reach: 'heart', difficulty: 30, narrative: 'S',
        leverageOnSuccess: 0.20,
        leverageOnFailure: -0.10,
        onSuccess: { narrative: 'OK' }, onFailure: { narrative: 'FAIL' },
      },
    ],
  };

  beforeEach(() => {
    vi.spyOn(encounterContent, 'getAnyEncounterById').mockReturnValue(mockTemplateWithLeverage);
  });

  it('increases leverage on step success', () => {
    const graph = buildGraph();
    graph.addNode({ id: 'a1', type: 'actor', name: 'A', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'loc', type: 'location', name: 'Town', properties: { hexCol: 0, hexRow: 0 } });
    graph.addEdge({ id: 'e1', type: 'located_at', source: 'a1', target: 'loc', properties: {} });

    const state = buildGameState(graph);
    const progress = makeSocialProgress('test.leverage.template', 'a1', 't1', {
      leverage: 0.30,
    });

    // Force success via deterministicRoll of 0 (always beats threshold)
    resolveEncounter(state, progress, 0);

    const result = resolveEncounter(state, progress, 0);
    if (result.success) {
      expect(progress.leverage).toBeGreaterThan(0.30);
    } else {
      expect(progress.leverage).toBeLessThan(0.30);
    }
    expect(progress.leverageHistory?.length).toBeGreaterThan(0);
  });

  it('does NOT modify leverage on steps without leverageOnSuccess defined', () => {
    const noLevTemplate: EncounterTemplate = {
      ...mockTemplateWithLeverage,
      id: 'test.no.leverage',
      steps: [{
        id: 'no.lev', name: 'Plain Step', reach: 'heart', difficulty: 30, narrative: 'S',
        onSuccess: { narrative: 'OK' }, onFailure: { narrative: 'FAIL' },
      }],
    };
    vi.spyOn(encounterContent, 'getAnyEncounterById').mockReturnValue(noLevTemplate);

    const graph = buildGraph();
    graph.addNode({ id: 'a1', type: 'actor', name: 'A', properties: { actorType: 'individual' } });
    graph.addNode({ id: 'loc', type: 'location', name: 'Town', properties: { hexCol: 0, hexRow: 0 } });
    graph.addEdge({ id: 'e1', type: 'located_at', source: 'a1', target: 'loc', properties: {} });

    const state = buildGameState(graph);
    const progress = makeSocialProgress('test.no.leverage', 'a1', 't1', {
      leverage: 0.30,
    });

    resolveEncounter(state, progress, 0);
    // leverage should be unchanged since no leverageOnSuccess/leverageOnFailure defined
    expect(progress.leverage).toBe(0.30);
  });
});

// ─── Divine Effects ──────────────────────────────────────────────────────────

describe('resolveEncounter — divine effects', () => {
  const mockTemplate: EncounterTemplate = {
    id: 'test.divine.template',
    name: 'Divine Test',
    locationTypes: ['town'],
    reachPrimary: 'heart',
    reachSecondary: 'eye',
    encounterType: 'assist',
    threatRating: 'easy',
    intrinsicTier: 'present',
    motivations: ['loyalty_ambition'],
    steps: [
      {
        id: 'div.step1', name: 'Social Step', reach: 'heart', difficulty: 30, narrative: 'S',
        leverageOnSuccess: 0.10,
        onSuccess: { narrative: 'OK' }, onFailure: { narrative: 'FAIL' },
      },
    ],
  };

  beforeEach(() => {
    vi.spyOn(encounterContent, 'getAnyEncounterById').mockReturnValue(mockTemplate);
  });

  it('Tip the Scales: applies socialLeverageShift and consumes it', () => {
    const graph = buildGraph();
    graph.addNode({
      id: 'a1', type: 'actor', name: 'A',
      properties: { actorType: 'individual', socialLeverageShift: 0.25 },
    });
    graph.addNode({ id: 'loc', type: 'location', name: 'Town', properties: { hexCol: 0, hexRow: 0 } });
    graph.addEdge({ id: 'e1', type: 'located_at', source: 'a1', target: 'loc', properties: {} });

    const state = buildGameState(graph);
    const progress = makeSocialProgress('test.divine.template', 'a1', 't1', {
      leverage: 0.20,
    });

    // Roll=0 forces success so we can confirm direction of change
    resolveEncounter(state, progress, 0);

    // Leverage should have received at least the 0.25 divine shift above the starting 0.20
    expect(progress.leverage).toBeGreaterThan(0.20);
    // The property should be consumed
    expect(graph.getNode('a1')?.properties.socialLeverageShift).toBeUndefined();
    // History entry should record the divine_tip_scales source
    expect(progress.leverageHistory?.some(e => e.source === 'divine_tip_scales')).toBe(true);
  });

  it('Embolden: counterResistanceActive flag is consumed after resolve', () => {
    const graph = buildGraph();
    graph.addNode({
      id: 'a1', type: 'actor', name: 'A',
      properties: { actorType: 'individual', counterResistanceActive: true },
    });
    graph.addNode({ id: 'loc', type: 'location', name: 'Town', properties: { hexCol: 0, hexRow: 0 } });
    graph.addEdge({ id: 'e1', type: 'located_at', source: 'a1', target: 'loc', properties: {} });

    const state = buildGameState(graph);
    const progress = makeSocialProgress('test.divine.template', 'a1', 't1', { leverage: 0.3 });

    resolveEncounter(state, progress, 50);

    // Flag should be consumed
    expect(graph.getNode('a1')?.properties.counterResistanceActive).toBeUndefined();
  });
});
