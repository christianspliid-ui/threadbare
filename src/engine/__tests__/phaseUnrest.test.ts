import { describe, it, expect } from 'vitest';
import { phaseUnrest, UNREST_DECAY_RATE, UNREST_PROSPERITY_DAMPER } from '../phaseUnrest';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';

function makeState(locationProps: Record<string, unknown>[]): GameState {
  const graph = new WorldGraph();
  locationProps.forEach((props, i) => {
    graph.addNode({
      id: `loc_${i}`,
      type: 'location',
      name: `Settlement ${i}`,
      properties: { locationSubtype: 'hamlet', ...props },
    });
  });
  return { tick: 5, graph } as unknown as GameState;
}

describe('phaseUnrest', () => {
  it('decays unrest by UNREST_DECAY_RATE', () => {
    const state = makeState([{ unrest: 50 }]);
    phaseUnrest(state);
    const node = state.graph.getNode('loc_0');
    expect(node?.properties.unrest).toBeCloseTo(50 - UNREST_DECAY_RATE, 5);
  });

  it('applies extra decay when prosperity > 60', () => {
    const state = makeState([{ unrest: 50, prosperity: 80 }]);
    phaseUnrest(state);
    const node = state.graph.getNode('loc_0');
    expect(node?.properties.unrest).toBeCloseTo(50 - UNREST_DECAY_RATE - UNREST_PROSPERITY_DAMPER, 5);
  });

  it('does not decay below 0', () => {
    const state = makeState([{ unrest: 0.5 }]);
    phaseUnrest(state);
    const node = state.graph.getNode('loc_0');
    expect(node?.properties.unrest).toBeGreaterThanOrEqual(0);
  });

  it('skips locations with unrest = 0', () => {
    const state = makeState([{ unrest: 0 }]);
    const before = state.graph.getNode('loc_0')?.properties.unrest;
    phaseUnrest(state);
    const after = state.graph.getNode('loc_0')?.properties.unrest;
    // Should not have been set (still 0 or undefined)
    expect(after).toBe(before);
  });

  it('skips non-settlement locations', () => {
    const graph = new WorldGraph();
    graph.addNode({
      id: 'wild_0',
      type: 'location',
      name: 'Wilderness',
      properties: { locationSubtype: 'wilderness', unrest: 50 },
    });
    const state = { tick: 1, graph } as unknown as GameState;
    phaseUnrest(state);
    // Wilderness is not a settlement — should not decay
    const node = state.graph.getNode('wild_0');
    expect(node?.properties.unrest).toBe(50);
  });
});
