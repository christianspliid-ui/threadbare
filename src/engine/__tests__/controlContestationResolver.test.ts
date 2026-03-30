import { describe, it, expect, beforeEach } from 'vitest';
import {
  findContestableEffects,
  meetsPrerequisites,
  computeContestationDifficulty,
  resolveContestation,
  applyContestationOutcome,
  CONTESTATION_BASE_DIFFICULTY,
  CONTESTATION_TICKS_ACTIVE_SCALING,
  CONTESTATION_MAX_DIFFICULTY,
} from '../controlContestationResolver';
import type { ControlEffect, ActorPrerequisites } from '../../types/controlEffect';
import { enableTracing, clearTraces, getTraces } from '../traceBuffer';

// ─── Test helpers ────────────────────────────────────────────────────────────

function makeEffect(overrides: Partial<ControlEffect> = {}): ControlEffect {
  return {
    effectId: 'ctrl_1',
    templateId: 'hex.claim_dominion',
    ownerId: 'ascendant_rival',
    targetHexCol: 3,
    targetHexRow: 5,
    establishedTick: 1,
    ritualEssenceInvested: 5,
    perTickCost: { spirit: 0.3 },
    perTickMutations: [],
    perTickGraphOps: [],
    active: true,
    ticksActive: 10,
    contestPrerequisites: {
      usurp: { reach: { domain: 'star', minTier: 2 }, sphere: { name: 'spirit', relation: 'aligned' } },
      destroy: { reach: { domain: 'iron', minTier: 1 } },
    },
    narrativeTemplates: {
      established: 'Dominion claimed.',
      active: 'Dominion held.',
      lapsed: 'Dominion lost.',
      usurped: 'Your dominion has been seized!',
      destroyed: 'Your dominion has been razed!',
    },
    ...overrides,
  };
}

// Minimal mock graph for capability/prerequisite checks
function makeMockGraph(agentCapability: number = 0.6, sphereAlignment?: { primary?: string; secondary?: string }) {
  return {
    getNode: (id: string) => ({
      id,
      type: 'actor',
      name: 'Agent',
      category: 'actor',
      properties: {
        sphereAlignment: sphereAlignment ?? { primary: 'spirit', secondary: 'force' },
      },
    }),
    getOutgoingEdges: () => [],
    getNodesByType: () => [],
    // computeCapability uses domainCapability which queries the graph
    // We mock at a higher level by providing traits
  } as any;
}

beforeEach(() => {
  enableTracing();
  clearTraces();
});

// ─── findContestableEffects ──────────────────────────────────────────────────

describe('findContestableEffects', () => {
  it('returns empty array when no effects on the hex', () => {
    const result = findContestableEffects(3, 5, 'agent_1', makeMockGraph(), []);
    expect(result).toEqual([]);
  });

  it('filters out inactive effects', () => {
    const inactive = makeEffect({ active: false });
    const result = findContestableEffects(3, 5, 'agent_1', makeMockGraph(), [inactive]);
    expect(result).toEqual([]);
  });

  it('filters out effects on other hexes', () => {
    const otherHex = makeEffect({ targetHexCol: 9, targetHexRow: 9 });
    const result = findContestableEffects(3, 5, 'agent_1', makeMockGraph(), [otherHex]);
    expect(result).toEqual([]);
  });

  it('filters out own effects (can not contest yourself)', () => {
    const ownEffect = makeEffect({ ownerId: 'agent_1' });
    const result = findContestableEffects(3, 5, 'agent_1', makeMockGraph(), [ownEffect]);
    expect(result).toEqual([]);
  });

  it('returns effects with no contest prerequisites as non-contestable', () => {
    const noPrereqs = makeEffect({ contestPrerequisites: undefined });
    const result = findContestableEffects(3, 5, 'agent_1', makeMockGraph(), [noPrereqs]);
    expect(result).toEqual([]);
  });
});

// ─── meetsPrerequisites ──────────────────────────────────────────────────────

describe('meetsPrerequisites', () => {
  it('returns true when no reach or sphere requirements', () => {
    expect(meetsPrerequisites('agent_1', {}, makeMockGraph())).toBe(true);
  });

  it('checks sphere alignment (aligned)', () => {
    const prereqs: ActorPrerequisites = {
      sphere: { name: 'spirit', relation: 'aligned' },
    };
    const graph = makeMockGraph(0.5, { primary: 'spirit' });
    expect(meetsPrerequisites('agent_1', prereqs, graph)).toBe(true);
  });

  it('fails sphere alignment check when not aligned', () => {
    const prereqs: ActorPrerequisites = {
      sphere: { name: 'entropy', relation: 'aligned' },
    };
    const graph = makeMockGraph(0.5, { primary: 'spirit', secondary: 'force' });
    expect(meetsPrerequisites('agent_1', prereqs, graph)).toBe(false);
  });

  it('checks sphere opposing (agent must NOT have the sphere)', () => {
    const prereqs: ActorPrerequisites = {
      sphere: { name: 'entropy', relation: 'opposing' },
    };
    const graph = makeMockGraph(0.5, { primary: 'spirit', secondary: 'force' });
    // Agent has spirit/force, not entropy — so they DO oppose entropy
    expect(meetsPrerequisites('agent_1', prereqs, graph)).toBe(true);
  });

  it('fails opposing check when agent has the sphere', () => {
    const prereqs: ActorPrerequisites = {
      sphere: { name: 'spirit', relation: 'opposing' },
    };
    const graph = makeMockGraph(0.5, { primary: 'spirit' });
    expect(meetsPrerequisites('agent_1', prereqs, graph)).toBe(false);
  });
});

// ─── computeContestationDifficulty ───────────────────────────────────────────

describe('computeContestationDifficulty', () => {
  it('returns base difficulty for a brand-new effect', () => {
    const effect = makeEffect({ ticksActive: 0 });
    expect(computeContestationDifficulty(effect)).toBe(CONTESTATION_BASE_DIFFICULTY);
  });

  it('scales difficulty with ticks active', () => {
    const effect = makeEffect({ ticksActive: 10 });
    const expected = CONTESTATION_BASE_DIFFICULTY + 10 * CONTESTATION_TICKS_ACTIVE_SCALING;
    expect(computeContestationDifficulty(effect)).toBeCloseTo(expected);
  });

  it('caps difficulty at maximum', () => {
    const effect = makeEffect({ ticksActive: 10000 });
    expect(computeContestationDifficulty(effect)).toBe(CONTESTATION_MAX_DIFFICULTY);
  });
});

// ─── resolveContestation ─────────────────────────────────────────────────────

describe('resolveContestation', () => {
  it('succeeds when roll is below probability', () => {
    const effect = makeEffect({ ticksActive: 0 });
    // Low roll = success
    const result = resolveContestation(effect, 'usurp', 'agent_1', makeMockGraph(), 10, () => 0.01);
    expect(result.success).toBe(true);
    expect(result.contestType).toBe('usurp');
    expect(result.newOwnerId).toBe('agent_1');
  });

  it('fails when roll is above probability', () => {
    const effect = makeEffect({ ticksActive: 0 });
    // High roll = failure
    const result = resolveContestation(effect, 'usurp', 'agent_1', makeMockGraph(), 10, () => 0.99);
    expect(result.success).toBe(false);
    expect(result.newOwnerId).toBeUndefined();
  });

  it('destroy contestation does not set newOwnerId', () => {
    const effect = makeEffect({ ticksActive: 0 });
    const result = resolveContestation(effect, 'destroy', 'agent_1', makeMockGraph(), 10, () => 0.01);
    expect(result.success).toBe(true);
    expect(result.contestType).toBe('destroy');
    expect(result.newOwnerId).toBeUndefined();
  });

  it('emits ControlContestationTrace', () => {
    const effect = makeEffect({ ticksActive: 0 });
    resolveContestation(effect, 'usurp', 'agent_1', makeMockGraph(), 10, () => 0.01);
    const traces = getTraces();
    const trace = traces.find((t: any) => t.type === 'control_contestation') as any;
    expect(trace).toBeDefined();
    expect(trace.category).toBe('control_effect');
    expect(trace.contestType).toBe('usurp');
  });

  it('harder to contest older effects', () => {
    const youngEffect = makeEffect({ ticksActive: 0 });
    const oldEffect = makeEffect({ ticksActive: 30 });

    const youngResult = resolveContestation(youngEffect, 'usurp', 'agent_1', makeMockGraph(), 10, () => 0.4);
    const oldResult = resolveContestation(oldEffect, 'usurp', 'agent_1', makeMockGraph(), 10, () => 0.4);

    // Old effect should be harder (higher difficulty = lower probability)
    expect(oldResult.difficulty).toBeGreaterThan(youngResult.difficulty);
  });
});

// ─── applyContestationOutcome ────────────────────────────────────────────────

describe('applyContestationOutcome', () => {
  it('returns unchanged effect on failed contestation', () => {
    const effect = makeEffect();
    const outcome = { effectId: effect.effectId, contestType: 'usurp' as const, success: false, difficulty: 0.5, roll: 0.8, probability: 0.3 };
    const { updatedEffect, events } = applyContestationOutcome(effect, outcome, 10);

    expect(updatedEffect).toEqual(effect);
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('control_contestation_failed');
  });

  it('transfers ownership on successful usurp', () => {
    const effect = makeEffect();
    const outcome = {
      effectId: effect.effectId,
      contestType: 'usurp' as const,
      success: true,
      newOwnerId: 'agent_1',
      difficulty: 0.5,
      roll: 0.1,
      probability: 0.6,
    };
    const { updatedEffect, events } = applyContestationOutcome(effect, outcome, 10);

    expect(updatedEffect.ownerId).toBe('agent_1');
    expect(updatedEffect.active).toBe(true);
    expect(updatedEffect.ritualEssenceInvested).toBe(effect.ritualEssenceInvested); // Inherited
    expect(events[0].type).toBe('control_effect_usurped');
    expect(events[0].message).toBe('Your dominion has been seized!');
  });

  it('deactivates effect on successful destroy', () => {
    const effect = makeEffect();
    const outcome = {
      effectId: effect.effectId,
      contestType: 'destroy' as const,
      success: true,
      difficulty: 0.5,
      roll: 0.1,
      probability: 0.6,
    };
    const { updatedEffect, events } = applyContestationOutcome(effect, outcome, 10);

    expect(updatedEffect.active).toBe(false);
    expect(updatedEffect.lapseReason).toBe('destroyed');
    expect(events[0].type).toBe('control_effect_destroyed');
    expect(events[0].message).toBe('Your dominion has been razed!');
  });

  it('uses fallback narrative when template has no usurped/destroyed message', () => {
    const effect = makeEffect({
      narrativeTemplates: {
        established: 'Est.', active: 'Act.', lapsed: 'Lapsed.',
        // No usurped or destroyed templates
      },
    });

    const destroyOutcome = {
      effectId: effect.effectId,
      contestType: 'destroy' as const,
      success: true,
      difficulty: 0.5,
      roll: 0.1,
      probability: 0.6,
    };
    const { events } = applyContestationOutcome(effect, destroyOutcome, 10);
    expect(events[0].message).toContain('has been destroyed');
  });
});
