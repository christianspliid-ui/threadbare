import { describe, expect, it } from 'vitest';
import { shouldRenderIndividualOnHexMap } from '../hexMapAgentVisibility';

describe('shouldRenderIndividualOnHexMap', () => {
  it('keeps ambient NPCs off the map', () => {
    expect(shouldRenderIndividualOnHexMap('ambient', 0)).toBe(false);
  });

  it('shows newly promoted notable NPCs on the map', () => {
    expect(shouldRenderIndividualOnHexMap('notable', 0)).toBe(true);
  });

  it('shows spotlight NPCs on the map', () => {
    expect(shouldRenderIndividualOnHexMap('spotlight', 0)).toBe(true);
  });

  it('keeps legacy individuals visible', () => {
    expect(shouldRenderIndividualOnHexMap(undefined, 0)).toBe(true);
  });

  it('hides commanders while their army signifier is active', () => {
    expect(shouldRenderIndividualOnHexMap('spotlight', 1)).toBe(false);
    expect(shouldRenderIndividualOnHexMap('notable', 2)).toBe(false);
  });
});
