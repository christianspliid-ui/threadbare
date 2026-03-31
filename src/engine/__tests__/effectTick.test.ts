import { describe, it, expect } from 'vitest';
import { tickEffects, addEventStack } from '../effectTick';
import { WorldGraph } from '../graph';
import type { AttachmentEffect, EffectRuntimeState } from '../../types/effects';

// ─── Test Helpers ────────────────────────────────────────────────

function makeGraph(): WorldGraph {
  return new WorldGraph();
}

function addAgent(graph: WorldGraph, id: string) {
  graph.addNode({
    id,
    type: 'actor',
    name: `Agent ${id}`,
    properties: { actorType: 'individual' },
  });
}

let edgeCounter = 0;
function eid() { return `e.tick.${++edgeCounter}`; }

function addArtifactWithEffects(
  graph: WorldGraph,
  agentId: string,
  artifactId: string,
  effects: AttachmentEffect[],
) {
  graph.addNode({
    id: artifactId,
    type: 'artifact',
    name: `Artifact ${artifactId}`,
    properties: { effects },
  });
  graph.addEdge({
    id: eid(), type: 'possesses', source: agentId, target: artifactId, properties: {},
  });
}

// ═══════════════════════════════════════════════════════════════════
// Duration effects
// ═══════════════════════════════════════════════════════════════════

describe('tickEffects — duration', () => {
  it('decrements ticksRemaining each tick', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'a1', 'buff1', [
      { type: 'duration', ticks: 10, reach: 'heart', value: 0.08, destroyOnExpiry: false },
    ]);

    const states = new Map<string, EffectRuntimeState>([
      ['buff1', { ticksRemaining: 5 }],
    ]);

    const result = tickEffects(graph, 'a1', 1, states);
    expect(result.updatedStates.get('buff1')?.ticksRemaining).toBe(4);
    expect(result.destroyedAttachments).toHaveLength(0);
  });

  it('destroys attachment when duration expires and destroyOnExpiry is true', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'a1', 'temp_buff', [
      { type: 'duration', ticks: 10, reach: 'heart', value: 0.08, destroyOnExpiry: true },
    ]);

    const states = new Map<string, EffectRuntimeState>([
      ['temp_buff', { ticksRemaining: 1 }],
    ]);

    const result = tickEffects(graph, 'a1', 1, states);
    expect(result.updatedStates.get('temp_buff')?.ticksRemaining).toBe(0);
    expect(result.destroyedAttachments).toContain('temp_buff');
  });

  it('initializes ticksRemaining from effect definition on first tick', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'a1', 'new_buff', [
      { type: 'duration', ticks: 10, reach: 'heart', value: 0.08, destroyOnExpiry: true },
    ]);

    const states = new Map<string, EffectRuntimeState>();
    const result = tickEffects(graph, 'a1', 1, states);
    expect(result.updatedStates.get('new_buff')?.ticksRemaining).toBe(9);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Cooldown effects
// ═══════════════════════════════════════════════════════════════════

describe('tickEffects — cooldown', () => {
  it('transitions from active to dormant when active ticks exhausted', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'a1', 'blade', [
      { type: 'cooldown', activeTicks: 3, cooldownTicks: 10, reach: 'iron', value: 0.08 },
    ]);

    const states = new Map<string, EffectRuntimeState>([
      ['blade', { cooldownTicksElapsed: 2, cooldownActive: true }],
    ]);

    const result = tickEffects(graph, 'a1', 1, states);
    expect(result.updatedStates.get('blade')?.cooldownActive).toBe(false);
    expect(result.updatedStates.get('blade')?.cooldownTicksElapsed).toBe(0);
  });

  it('transitions from dormant to active when cooldown ticks exhausted', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'a1', 'blade', [
      { type: 'cooldown', activeTicks: 3, cooldownTicks: 5, reach: 'iron', value: 0.08 },
    ]);

    const states = new Map<string, EffectRuntimeState>([
      ['blade', { cooldownTicksElapsed: 4, cooldownActive: false }],
    ]);

    const result = tickEffects(graph, 'a1', 1, states);
    expect(result.updatedStates.get('blade')?.cooldownActive).toBe(true);
    expect(result.updatedStates.get('blade')?.cooldownTicksElapsed).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Decay effects
// ═══════════════════════════════════════════════════════════════════

describe('tickEffects — decay', () => {
  it('decreases value each tick for negative changePerTick', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'a1', 'fading', [
      { type: 'decay', reach: 'star', startValue: 0.15, changePerTick: -0.01, limitValue: 0, destroyAtLimit: true },
    ]);

    const states = new Map<string, EffectRuntimeState>([
      ['fading', { decayCurrentValue: 0.10 }],
    ]);

    const result = tickEffects(graph, 'a1', 1, states);
    expect(result.updatedStates.get('fading')?.decayCurrentValue).toBeCloseTo(0.09);
  });

  it('destroys attachment when reaching limit with destroyAtLimit', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'a1', 'fading', [
      { type: 'decay', reach: 'star', startValue: 0.15, changePerTick: -0.01, limitValue: 0, destroyAtLimit: true },
    ]);

    const states = new Map<string, EffectRuntimeState>([
      ['fading', { decayCurrentValue: 0.005 }],
    ]);

    const result = tickEffects(graph, 'a1', 1, states);
    expect(result.destroyedAttachments).toContain('fading');
  });

  it('clamps at limit without destruction when destroyAtLimit is false', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'a1', 'dim', [
      { type: 'decay', reach: 'eye', startValue: 0.10, changePerTick: -0.005, limitValue: 0.02, destroyAtLimit: false },
    ]);

    const states = new Map<string, EffectRuntimeState>([
      ['dim', { decayCurrentValue: 0.022 }],
    ]);

    const result = tickEffects(graph, 'a1', 1, states);
    expect(result.updatedStates.get('dim')?.decayCurrentValue).toBe(0.02);
    expect(result.destroyedAttachments).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Stacking effects
// ═══════════════════════════════════════════════════════════════════

describe('tickEffects — stacking', () => {
  it('increments stacks per tick for per_tick trigger', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'a1', 'corruption', [
      { type: 'stacking', reach: 'heart', valuePerStack: -0.01, maxStacks: 15, stackOn: 'per_tick' },
    ]);

    const states = new Map<string, EffectRuntimeState>([
      ['corruption', { stacks: 3 }],
    ]);

    const result = tickEffects(graph, 'a1', 1, states);
    expect(result.updatedStates.get('corruption')?.stacks).toBe(4);
  });

  it('caps at maxStacks', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'a1', 'corruption', [
      { type: 'stacking', reach: 'heart', valuePerStack: -0.01, maxStacks: 5, stackOn: 'per_tick' },
    ]);

    const states = new Map<string, EffectRuntimeState>([
      ['corruption', { stacks: 5 }],
    ]);

    const result = tickEffects(graph, 'a1', 1, states);
    expect(result.updatedStates.get('corruption')?.stacks).toBe(5);
  });

  it('applies decay per tick', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'a1', 'rage', [
      { type: 'stacking', reach: 'iron', valuePerStack: 0.02, maxStacks: 5, stackOn: 'combat_success', decayPerTick: 1 },
    ]);

    const states = new Map<string, EffectRuntimeState>([
      ['rage', { stacks: 3 }],
    ]);

    const result = tickEffects(graph, 'a1', 1, states);
    expect(result.updatedStates.get('rage')?.stacks).toBe(2);
  });
});

// ═══════════════════════════════════════════════════════════════════
// addEventStack
// ═══════════════════════════════════════════════════════════════════

describe('addEventStack', () => {
  it('increments stacks up to cap', () => {
    const states = new Map<string, EffectRuntimeState>([
      ['blade', { stacks: 2 }],
    ]);

    const result = addEventStack('blade', states, 'combat_success', 5);
    expect(result?.stacks).toBe(3);
  });

  it('returns undefined when at cap', () => {
    const states = new Map<string, EffectRuntimeState>([
      ['blade', { stacks: 5 }],
    ]);

    const result = addEventStack('blade', states, 'combat_success', 5);
    expect(result).toBeUndefined();
  });

  it('initializes from 0 when no prior state', () => {
    const states = new Map<string, EffectRuntimeState>();

    const result = addEventStack('blade', states, 'combat_success', 5);
    expect(result?.stacks).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Edge cases
// ═══════════════════════════════════════════════════════════════════

describe('tickEffects — edge cases', () => {
  it('returns empty result for agent with no effect attachments', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');

    const states = new Map<string, EffectRuntimeState>();
    const result = tickEffects(graph, 'a1', 1, states);
    expect(result.destroyedAttachments).toHaveLength(0);
    expect(result.traces).toHaveLength(0);
  });

  it('emits traces for state changes', () => {
    const graph = makeGraph();
    addAgent(graph, 'a1');
    addArtifactWithEffects(graph, 'a1', 'buff', [
      { type: 'duration', ticks: 10, reach: 'heart', value: 0.08, destroyOnExpiry: false },
    ]);

    const states = new Map<string, EffectRuntimeState>([
      ['buff', { ticksRemaining: 5 }],
    ]);

    const result = tickEffects(graph, 'a1', 1, states);
    expect(result.traces.length).toBeGreaterThan(0);
    expect(result.traces[0].type).toBe('effect_tick');
    expect(result.traces[0].action).toBe('decrement');
  });
});
