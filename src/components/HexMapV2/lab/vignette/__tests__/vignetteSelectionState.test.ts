import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VignetteSelectionState } from '../VignetteSelectionState';

function makeMockLayer() {
  return {
    setInstanceAttribute: vi.fn(),
  };
}

describe('VignetteSelectionState', () => {
  let state: VignetteSelectionState;
  let layer: ReturnType<typeof makeMockLayer>;

  beforeEach(() => {
    state = new VignetteSelectionState();
    layer = makeMockLayer();
  });

  it('starts with null hover and selection', () => {
    expect(state.getHovered()).toBeNull();
    expect(state.getSelected()).toBeNull();
  });

  it('setHovered records the entry', () => {
    state.setHovered({ batchKey: 'village', instanceIndex: 0 });
    expect(state.getHovered()).toEqual({ batchKey: 'village', instanceIndex: 0 });
  });

  it('setHovered(null) clears hover', () => {
    state.setHovered({ batchKey: 'village', instanceIndex: 0 });
    state.setHovered(null);
    expect(state.getHovered()).toBeNull();
  });

  it('setSelected records the entry', () => {
    state.setSelected({ batchKey: 'village', instanceIndex: 2 });
    expect(state.getSelected()).toEqual({ batchKey: 'village', instanceIndex: 2 });
  });

  it('clearAll resets both hover and selection', () => {
    state.setHovered({ batchKey: 'village', instanceIndex: 0 });
    state.setSelected({ batchKey: 'village', instanceIndex: 1 });
    state.clearAll();
    expect(state.getHovered()).toBeNull();
    expect(state.getSelected()).toBeNull();
  });

  it('tickEasing calls setInstanceAttribute for active easing entries', () => {
    state.setHovered({ batchKey: 'village', instanceIndex: 0 });
    state.tickEasing(120, layer as never);
    expect(layer.setInstanceAttribute).toHaveBeenCalledWith('village', 0, 'aHoverMix', expect.any(Number));
  });

  it('easing progresses aHoverMix toward target over multiple ticks', () => {
    state.setHovered({ batchKey: 'village', instanceIndex: 0 });
    // Tick once — should move toward HOVER_MIX_TARGET (0.45)
    state.tickEasing(60, layer as never);
    const callArgs = layer.setInstanceAttribute.mock.calls.find(
      (c) => c[2] === 'aHoverMix',
    );
    const value = callArgs?.[3] as number;
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThanOrEqual(0.45);
  });

  it('selection easing progresses aSelectionMix toward target', () => {
    state.setSelected({ batchKey: 'village', instanceIndex: 1 });
    state.tickEasing(160, layer as never);
    expect(layer.setInstanceAttribute).toHaveBeenCalledWith('village', 1, 'aSelectionMix', expect.any(Number));
    const value = layer.setInstanceAttribute.mock.calls.find(
      (c) => c[2] === 'aSelectionMix',
    )?.[3] as number;
    expect(value).toBeGreaterThan(0);
    expect(value).toBeLessThanOrEqual(0.9);
  });

  it('fails soft when setInstanceAttribute throws (stale key)', () => {
    layer.setInstanceAttribute.mockImplementation(() => { throw new Error('disposed'); });
    state.setHovered({ batchKey: 'old-model', instanceIndex: 99 });
    expect(() => state.tickEasing(120, layer as never)).not.toThrow();
  });

  it('reverses easing toward 0 when hover is cleared', () => {
    state.setHovered({ batchKey: 'village', instanceIndex: 0 });
    state.tickEasing(120, layer as never);
    state.setHovered(null);
    layer.setInstanceAttribute.mockClear();
    state.tickEasing(120, layer as never);
    const value = layer.setInstanceAttribute.mock.calls.find(
      (c) => c[2] === 'aHoverMix',
    )?.[3] as number | undefined;
    if (value !== undefined) {
      expect(value).toBeLessThan(0.45);
    }
  });
});
