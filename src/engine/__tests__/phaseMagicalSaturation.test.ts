import { describe, it, expect } from 'vitest';
import { phaseMagicalSaturation, MAGICAL_SATURATION_DECAY_RATE } from '../phaseMagicalSaturation';
import { WorldGraph } from '../graph';
import type { GameState } from '../../types/gameState';

function makeState(locationProps: Record<string, unknown>[]): GameState {
  const graph = new WorldGraph();
  locationProps.forEach((props, i) => {
    graph.addNode({
      id: `loc_${i}`,
      type: 'location',
      name: `Location ${i}`,
      properties: props,
    });
  });
  return { tick: 5, graph } as unknown as GameState;
}

describe('phaseMagicalSaturation', () => {
  it('decays saturation by MAGICAL_SATURATION_DECAY_RATE', () => {
    const state = makeState([{ magicalSaturation: 0.5 }]);
    phaseMagicalSaturation(state);
    const node = state.graph.getNode('loc_0');
    expect(node?.properties.magicalSaturation).toBeCloseTo(0.5 - MAGICAL_SATURATION_DECAY_RATE, 5);
  });

  it('clamps to 0', () => {
    const state = makeState([{ magicalSaturation: 0.01 }]);
    phaseMagicalSaturation(state);
    const node = state.graph.getNode('loc_0');
    expect(node?.properties.magicalSaturation).toBeGreaterThanOrEqual(0);
  });

  it('skips locations with saturation = 0', () => {
    const state = makeState([{ magicalSaturation: 0 }]);
    const before = state.graph.getNode('loc_0')?.properties.magicalSaturation;
    phaseMagicalSaturation(state);
    const after = state.graph.getNode('loc_0')?.properties.magicalSaturation;
    expect(after).toBe(before);
  });

  it('skips locations without magicalSaturation property', () => {
    const state = makeState([{}]);
    expect(() => phaseMagicalSaturation(state)).not.toThrow();
    const node = state.graph.getNode('loc_0');
    expect(node?.properties.magicalSaturation).toBeUndefined();
  });
});
