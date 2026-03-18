import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  getDivineAttention,
  setDivineAttention,
  decayDivineAttention,
  DEFAULT_DIVINE_ATTENTION,
  ATTUNE_COST_DISCOUNT,
  FOCUS_EFFICIENCY_BOOST,
} from '../divineAttention';

// --- Helpers ---

function makeGraph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: 'agent.1', type: 'actor', name: 'Alice', properties: {} });
  g.addNode({ id: 'agent.2', type: 'actor', name: 'Bob', properties: {} });
  g.addNode({ id: 'agent.3', type: 'actor', name: 'Carol', properties: {} });
  g.addNode({ id: 'loc.1', type: 'location', name: 'Keep', properties: {} });
  return g;
}

// --- Tests ---

describe('getDivineAttention', () => {
  it('returns default for agent with no divine attention property', () => {
    const g = makeGraph();
    const result = getDivineAttention(g, 'agent.1');
    expect(result.level).toBe('none');
    expect(result.costDiscount).toBe(0);
    expect(result.efficiencyBoost).toBe(0);
  });

  it('returns default for non-existent agent', () => {
    const g = makeGraph();
    const result = getDivineAttention(g, 'nonexistent');
    expect(result.level).toBe('none');
  });

  it('reads stored divine attention', () => {
    const g = makeGraph();
    setDivineAttention(g, 'agent.1', {
      level: 'attuned',
      costDiscount: ATTUNE_COST_DISCOUNT,
      efficiencyBoost: 0,
    });
    const result = getDivineAttention(g, 'agent.1');
    expect(result.level).toBe('attuned');
    expect(result.costDiscount).toBe(ATTUNE_COST_DISCOUNT);
  });
});

describe('setDivineAttention', () => {
  it('writes divine attention to agent node', () => {
    const g = makeGraph();
    setDivineAttention(g, 'agent.1', {
      level: 'focused',
      costDiscount: 0,
      efficiencyBoost: FOCUS_EFFICIENCY_BOOST,
      expiresAtTick: 50,
    });
    const node = g.getNode('agent.1')!;
    const attention = node.properties.divineAttention as any;
    expect(attention.level).toBe('focused');
    expect(attention.expiresAtTick).toBe(50);
  });

  it('is no-op for missing agent', () => {
    const g = makeGraph();
    // Should not throw
    setDivineAttention(g, 'nonexistent', { level: 'focused', costDiscount: 0, efficiencyBoost: 0 });
  });

  it('overwrites previous attention', () => {
    const g = makeGraph();
    setDivineAttention(g, 'agent.1', { level: 'scried', costDiscount: 0, efficiencyBoost: 0, expiresAtTick: 20 });
    setDivineAttention(g, 'agent.1', { level: 'focused', costDiscount: 0, efficiencyBoost: 0.4, expiresAtTick: 10 });
    const result = getDivineAttention(g, 'agent.1');
    expect(result.level).toBe('focused');
    expect(result.efficiencyBoost).toBe(0.4);
  });
});

describe('decayDivineAttention', () => {
  it('clears expired attention and returns count', () => {
    const g = makeGraph();
    setDivineAttention(g, 'agent.1', { level: 'scried', costDiscount: 0, efficiencyBoost: 0, expiresAtTick: 10 });
    setDivineAttention(g, 'agent.2', { level: 'focused', costDiscount: 0, efficiencyBoost: 0.4, expiresAtTick: 5 });
    setDivineAttention(g, 'agent.3', { level: 'attuned', costDiscount: 0.3, efficiencyBoost: 0 }); // no expiry

    const decayed = decayDivineAttention(g, 10);
    expect(decayed).toBe(2); // agent.1 and agent.2 expired

    expect(getDivineAttention(g, 'agent.1').level).toBe('none');
    expect(getDivineAttention(g, 'agent.2').level).toBe('none');
    expect(getDivineAttention(g, 'agent.3').level).toBe('attuned');
  });

  it('does not decay non-expired attention', () => {
    const g = makeGraph();
    setDivineAttention(g, 'agent.1', { level: 'scried', costDiscount: 0, efficiencyBoost: 0, expiresAtTick: 20 });

    const decayed = decayDivineAttention(g, 10);
    expect(decayed).toBe(0);
    expect(getDivineAttention(g, 'agent.1').level).toBe('scried');
  });

  it('returns 0 when no agents have divine attention', () => {
    const g = makeGraph();
    expect(decayDivineAttention(g, 10)).toBe(0);
  });

  it('skips non-actor nodes', () => {
    const g = makeGraph();
    // loc.1 is a location, not an actor — should not be processed
    g.updateNode('loc.1', { properties: { divineAttention: { level: 'scried', costDiscount: 0, efficiencyBoost: 0, expiresAtTick: 5 } } });
    const decayed = decayDivineAttention(g, 10);
    expect(decayed).toBe(0); // location nodes are not actors
  });
});
