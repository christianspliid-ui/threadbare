/**
 * THR-1878 (plan § D4, THR-1830 § 5) — the Dominion hover line's pressure clause.
 *
 * Over the spheres the god holds that have an opposite, the opposing pole at the
 * lending place is weighed by Dominion's own opposition weight; the heaviest names the
 * clause, and below DOMINION_PRESSURE_LINE_MIN there is none.
 */
import { describe, it, expect } from 'vitest';
import type { SphereName } from '../../types/index';
import { WorldGraph } from '../graph';
import { createDefaultSphereAffinity } from '../../types/sphereAffinity';
import { dominionHexLineVM, dominionPressureClause } from '../dominionViewModels';
import type { DominionHexProjection } from '../dominionProjection';
import { DOMINION_PRESSURE_LINE_MIN } from '../../data/dominion-ui-content';

const GOD = 'asc.shepherd';

function bag(scores: Partial<Record<SphereName, number>>) {
  const a = createDefaultSphereAffinity();
  for (const s of Object.keys(a.scores) as SphereName[]) a.scores[s] = 0;
  for (const [s, v] of Object.entries(scores)) a.scores[s as SphereName] = v as number;
  return a;
}

function graph(): WorldGraph {
  const g = new WorldGraph();
  g.addNode({ id: GOD, type: 'actor', name: 'The Shepherd', properties: { actorType: 'ascendant', spherePoints: { life: 3 } } });
  g.addNode({ id: 'loc.giving', type: 'location', name: 'Ferris', properties: { hexCol: 1, hexRow: 1, sphereAffinity: bag({ life: 3, entropy: 6 }) } });
  g.addNode({ id: 'loc.holds', type: 'location', name: 'Hesk Crossing', properties: { hexCol: 2, hexRow: 1, sphereAffinity: bag({ life: 8, entropy: 4 }) } });
  g.addNode({ id: 'loc.faint', type: 'location', name: 'Millbrook', properties: { hexCol: 3, hexRow: 1, sphereAffinity: bag({ life: 5, entropy: 2 }) } });
  g.addNode({ id: 'loc.bare', type: 'location', name: 'Bare', properties: { hexCol: 4, hexRow: 1 } });
  return g;
}

function projection(): DominionHexProjection {
  return {
    hexBand: new Map([['1,1', 'held'], ['2,1', 'held'], ['3,1', 'touched'], ['4,1', 'foreign'], ['5,1', 'foreign']]),
    hexPlaceId: new Map([['1,1', 'loc.giving'], ['2,1', 'loc.holds'], ['3,1', 'loc.faint'], ['4,1', 'loc.bare'], ['5,1', null]]),
  } as unknown as DominionHexProjection;
}

describe('Dominion pressure clause', () => {
  it('names the pressing power and says the god\'s sphere is giving way where the opposite outweighs it', () => {
    expect(dominionPressureClause(graph(), 'loc.giving', GOD))
      .toBe('Pressed by a power of Entropy; your Life is giving way here.');
  });

  it('says the god\'s sphere holds where it still outweighs its opposite', () => {
    expect(dominionPressureClause(graph(), 'loc.holds', GOD))
      .toBe('Pressed by a power of Entropy; your Life holds here.');
  });

  it('adds no clause below DOMINION_PRESSURE_LINE_MIN', () => {
    // 0.8 × 2 / 10 = 0.16 < 0.2
    expect(0.8 * 2 / 10).toBeLessThan(DOMINION_PRESSURE_LINE_MIN);
    expect(dominionPressureClause(graph(), 'loc.faint', GOD)).toBeNull();
  });

  it('no clause without scores, without a lending place, or without a god', () => {
    expect(dominionPressureClause(graph(), 'loc.bare', GOD)).toBeNull();
    expect(dominionPressureClause(graph(), null, GOD)).toBeNull();
    expect(dominionPressureClause(graph(), 'loc.giving', null)).toBeNull();
  });

  it('rides on the hex line as a second field when the god is named, and is absent otherwise', () => {
    const g = graph();
    const p = projection();
    expect(dominionHexLineVM(g, p, '1,1', GOD)?.pressure).toBe('Pressed by a power of Entropy; your Life is giving way here.');
    expect(dominionHexLineVM(g, p, '3,1', GOD)?.pressure).toBeNull();
    expect(dominionHexLineVM(g, p, '5,1', GOD)?.pressure).toBeNull();
    // Callers that predate the clause see the line unchanged.
    expect(dominionHexLineVM(g, p, '1,1')).not.toHaveProperty('pressure');
    expect(dominionHexLineVM(g, p, '1,1')?.text).toBe('Held ground, by Ferris');
  });
});
