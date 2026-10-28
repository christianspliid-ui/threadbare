/**
 * THR-2081 — the Mandate detail says a sphere rises only through the god's bond with
 * the land when no card a god can cast carries it (energy, until THR-2086).
 */

import { describe, it, expect } from 'vitest';
import { sphereHasAscendantCard } from '../subjects/godSheet';

describe('sphereHasAscendantCard', () => {
  it('finds a castable card for mind and spirit in the shipped catalog', () => {
    expect(sphereHasAscendantCard('mind')).toBe(true);
    expect(sphereHasAscendantCard('spirit')).toBe(true);
  });

  it('needs an essence price, the ascendant among its actors, and the sphere', () => {
    const card = { essenceCost: 2, actorAffinities: ['ascendant'], sphereAffinity: 'energy' as const };
    expect(sphereHasAscendantCard('energy', [card])).toBe(true);
    expect(sphereHasAscendantCard('energy', [{ ...card, essenceCost: 0 }])).toBe(false);
    expect(sphereHasAscendantCard('energy', [{ ...card, actorAffinities: ['individual'] }])).toBe(false);
    expect(sphereHasAscendantCard('life', [card])).toBe(false);
  });
});
