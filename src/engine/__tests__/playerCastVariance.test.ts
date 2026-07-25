/**
 * THR-728 — player casts roll the outcome ladder, floored at success-at-cost.
 *
 * The contract these tests pin:
 *  - a positive-difficulty cast produces varied outcomes across seeds;
 *  - it never produces `failure` or `critical_failure`, at any capability;
 *  - a zero-difficulty cast is still guaranteed;
 *  - push and resist never fire for a player cast;
 *  - the master switch restores the pre-change auto-success verbatim.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveUncontestedStep } from '../unifiedActionResolution';
import { createUnifiedAction, resetUnifiedActionCounter } from '../unifiedActionLifecycle';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../graph';
import { computeCapability } from '../domainCapability';
import { clearTraces, disableTracing, enableTracing, getTraces } from '../traceBuffer';
import * as playerCastConstants from '../../data/player-cast-constants';

const ASCENDANT_ID = 'asc.witness';

/** The ops the step runs on any success band — asserted directly, since `steps[]`
 *  is an `ActionStepOrBranch` union that does not narrow at the index. */
const SUCCESS_OPS = [{ op: 'update_node', nodeId: '$target', changes: { worked: true } }] as const;

function makeTemplate(difficulty: number, overrides: Partial<UnifiedActionTemplate> = {}): UnifiedActionTemplate {
  return {
    id: 'hex.test_working',
    rarityTier: 2,
    intrinsicTier: 'background',
    name: 'Test Working',
    reach: 'stone',
    crudType: 'update',
    scale: 'local',
    steps: [{
      reach: 'stone',
      duration: { min: 1, max: 1 },
      difficulty,
      onSuccess: [...SUCCESS_OPS],
      onFailure: [{ op: 'update_node', nodeId: '$target', changes: { worked: false } }],
      failBehavior: 'fail_action',
    }],
    apCost: 1,
    actorAffinities: ['ascendant'],
    motivations: ['courage_prudence'],
    narrativeTemplates: { initiation: 'begins', success: 'succeeds', failure: 'fails' },
    ...overrides,
  };
}

/**
 * Minimal state with a real ascendant node carrying `domainAffinities` — the
 * property the shipped ascendant actually has (THR-503). Pass `null` for a node
 * with none, to exercise the fail-soft path. Affinities are 2–5 in shipped worlds.
 */
function makeState(affinityRaw: number | null = 4): GameState {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASCENDANT_ID,
    type: 'actor',
    name: 'The Witness',
    properties: {
      actorType: 'ascendant',
      ...(affinityRaw === null ? {} : { domainAffinities: { stone: affinityRaw } }),
    },
  });
  graph.addNode({ id: 'loc-1', type: 'location', name: 'The Hollow', properties: {} });
  graph.addEdge({ id: 'e1', source: ASCENDANT_ID, target: 'loc-1', type: 'located_at', properties: {} });

  return {
    tick: 10, seed: 42, cycle: 1, phase: 'playing', graph,
    cosmology: {} as never, tiles: [], clock: {} as never,
    ascendantId: ASCENDANT_ID, essencePool: {} as never,
    mandateDefinition: null, mandateState: null,
    rivalDefinitions: [], rivalStates: [],
    doomDefinition: {} as never, doomClock: {} as never,
    tickEvents: [], recentEvents: [], chronicleEntries: [],
    stealthExposure: 0, visibilityMap: {} as never, familiarityMap: {} as never,
    culturalInsightMap: new Map(), agentKnowledge: new Map(),
    encounterProgress: [], actionsInProgress: [], unifiedActions: [],
    worldSoul: {} as never, echoDefinitions: [], echoStates: [],
    chronicle: {} as never,
    pendingQuintessenceEvents: [],
  } as unknown as GameState;
}

function makePlayerCast(template: UnifiedActionTemplate) {
  return createUnifiedAction({
    actorId: ASCENDANT_ID,
    templateId: template.id,
    targetId: 'loc-1',
    scale: 'local',
    source: 'player',
    tick: 10,
    template,
    rng: () => 0.5,
    essencePaid: {} as never,
  });
}

/** Deterministic seeded stream (mulberry32) — a fresh one per seed, reproducible. */
function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

beforeEach(() => {
  resetUnifiedActionCounter();
  clearTraces();
});

afterEach(() => {
  vi.restoreAllMocks();
  disableTracing();
  clearTraces();
});

describe('THR-728 — player cast variance', () => {
  it('leaves the shared capability score — and so the ascendant\'s tier — untouched', () => {
    // THR-613 tunes Deepening tier-crossings against `computeCapability`. The cast
    // bonus must not leak into it, or every ascendant silently changes tier.
    const state = makeState(4);
    expect(computeCapability(state.graph, ASCENDANT_ID, 'stone')).toBeCloseTo(
      computeCapability(makeState(null).graph, ASCENDANT_ID, 'stone'),
      10,
    );
  });

  it('rolls a player cast above the floor cliff — the affinity bonus reaches resolution', () => {
    const template = makeTemplate(0.6);
    const state = makeState(4);
    const result = resolveUncontestedStep(makePlayerCast(template), template, state, seededRng(1));
    // Raw 0 (the unbonused read) is capability 0.02; the bonus must clear that.
    expect(result.capability).toBeGreaterThan(0.2);
  });

  it('produces more than one outcome band across seeds for a positive-difficulty cast', () => {
    const template = makeTemplate(0.6);
    const outcomes = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const state = makeState(4);
      const action = makePlayerCast(template);
      outcomes.add(resolveUncontestedStep(action, template, state, seededRng(seed)).outcome);
    }
    // Both a floored/at-cost landing and a clean one must be reachable — the whole
    // point of the ticket is that the receipt stops reporting a foregone conclusion.
    expect(outcomes.size).toBeGreaterThan(1);
    expect(outcomes).toContain('success_at_cost');
    expect(outcomes).toContain('success');
  });

  it('never yields failure or critical_failure, at any capability', () => {
    const template = makeTemplate(0.6);
    for (const affinity of [null, 0, 4, 20]) {
      for (let seed = 1; seed <= 40; seed++) {
        const state = makeState(affinity);
        const action = makePlayerCast(template);
        const result = resolveUncontestedStep(action, template, state, seededRng(seed));
        expect(['failure', 'critical_failure']).not.toContain(result.outcome);
      }
    }
  });

  it('runs the success ops when the floor catches a failing roll', () => {
    const template = makeTemplate(0.6);
    const state = makeState(0);
    const action = makePlayerCast(template);
    // 0.99 → a d100 roll of 100: a failure at any survivable probability.
    const result = resolveUncontestedStep(action, template, state, () => 0.99);
    expect(result.outcome).toBe('success_at_cost');
    expect(result.opsToExecute).toEqual([...SUCCESS_OPS]);
  });

  it('marks the floored resolution in the trace, distinctly from the scale floor', () => {
    enableTracing();
    const template = makeTemplate(0.6);
    const state = makeState(0);
    resolveUncontestedStep(makePlayerCast(template), template, state, () => 0.99);
    const trace = getTraces().find((t) => t.category === 'resolution.input') as
      { playerFloorApplied?: boolean; summary?: string } | undefined;
    expect(trace?.playerFloorApplied).toBe(true);
    expect(trace?.summary).toContain('[player-floor↑]');
  });

  it('leaves a zero-difficulty cast guaranteed', () => {
    const template = makeTemplate(0);
    for (let seed = 1; seed <= 20; seed++) {
      const state = makeState(4);
      const result = resolveUncontestedStep(makePlayerCast(template), template, state, seededRng(seed));
      expect(result.outcome).toBe('success');
      expect(result.probability).toBe(1);
    }
  });

  it('never pushes or resists for a player cast', () => {
    const template = makeTemplate(0.6);
    for (let seed = 1; seed <= 40; seed++) {
      const state = makeState(0);
      const result = resolveUncontestedStep(makePlayerCast(template), template, state, seededRng(seed));
      expect(result.pushAttempted).toBe(false);
      expect(result.resistAttempted).toBe(false);
      expect(state.pendingQuintessenceEvents).toHaveLength(0);
    }
  });

  it('restores auto-success verbatim when the master switch is off', () => {
    vi.spyOn(playerCastConstants, 'PLAYER_CAST_VARIANCE_ENABLED', 'get').mockReturnValue(false);
    const template = makeTemplate(0.6);
    const state = makeState(0);
    const result = resolveUncontestedStep(makePlayerCast(template), template, state, () => 0.99);
    expect(result).toMatchObject({
      outcome: 'success',
      rawOutcome: 'success',
      capability: 1,
      probability: 1,
      roll: 0,
    });
    expect(result.opsToExecute).toEqual([...SUCCESS_OPS]);
  });
});

describe('THR-728 — risk hint copy', () => {
  it('says nothing for a guaranteed casting', () => {
    expect(playerCastConstants.riskHintLine(0)).toBeNull();
    expect(playerCastConstants.riskHintLine(undefined)).toBeNull();
    expect(playerCastConstants.riskHintLine(Number.NaN)).toBeNull();
  });

  it('escalates across the two thresholds, in prose and without numbers', () => {
    expect(playerCastConstants.riskHintLine(0.1)).toBe('A steady working.');
    expect(playerCastConstants.riskHintLine(0.3)).toBe('An uncertain working.');
    expect(playerCastConstants.riskHintLine(0.6)).toBe('A perilous working.');
    for (const d of [0.1, 0.3, 0.6]) {
      expect(playerCastConstants.riskHintLine(d)).not.toMatch(/\d/);
    }
  });
});
