/**
 * Company-name sphere vocabulary (THR-770).
 *
 * The defect this pins: `GROUP_NAME_SPHERE_ADJECTIVES` was keyed by an older
 * cosmology's vocabulary — `hunger`, `blood`, `stone`, `tide`, `flame`, `dusk` — of
 * which only `mind` and `spirit` were real sphere ids. The read site's `?? []`
 * fallback made the other six unreachable *silently*: no crash, no failing test, just
 * flavor that could never appear.
 *
 * So a key-set assertion alone would not have caught it, and neither would a coverage
 * count — the table was internally consistent the whole time. The load-bearing test is
 * the last describe block, whose population is the **generator's actual output**: for
 * every real sphere, naming the same companies with that sphere must produce a
 * different set of names than naming them with no sphere at all. A dead key produces
 * identical output, which is exactly what shipped.
 */

import { describe, it, expect } from 'vitest';
import { GROUP_NAME_SPHERE_ADJECTIVES } from '../group-name-content';
import { SPHERE_NAMES } from '../../types/index';
import { generateGroupName } from '../../engine/groups/groupNames';

/** Enough seeded ids that a reachable 2-word pool provably changes some name. */
const PROBE_IDS = Array.from({ length: 200 }, (_, i) => `group_probe_${i}`);

const namesFor = (sphereId?: string): string[] =>
  PROBE_IDS.map(groupId =>
    generateGroupName({ groupId, cause: 'draw_together', leaderName: 'Kael', sphereId }),
  );

describe('GROUP_NAME_SPHERE_ADJECTIVES — key set', () => {
  it('is keyed by exactly the 12 real sphere ids, no more and no fewer', () => {
    // Both directions on purpose. An invented key is dead content; a *missing* sphere
    // is a caster alignment that silently draws nothing — the same failure, and the
    // one a "every key is valid" assertion would wave through.
    expect(Object.keys(GROUP_NAME_SPHERE_ADJECTIVES).sort()).toEqual([...SPHERE_NAMES].sort());
  });

  it('carries no key from the retired pre-THR-770 vocabulary', () => {
    const retired = ['hunger', 'blood', 'stone', 'tide', 'flame', 'dusk'];
    const present = retired.filter(k => k in GROUP_NAME_SPHERE_ADJECTIVES);
    expect(present).toEqual([]);
  });

  it('gives every sphere a non-empty pool', () => {
    const empty = SPHERE_NAMES.filter(s => GROUP_NAME_SPHERE_ADJECTIVES[s].length === 0);
    expect(empty).toEqual([]);
  });
});

describe('GROUP_NAME_SPHERE_ADJECTIVES — reachability through the generator', () => {
  it('has a non-empty probe population (guards the two tests below)', () => {
    // Without this, both assertions below would pass vacuously over an empty set.
    expect(PROBE_IDS.length).toBeGreaterThan(0);
    expect(namesFor().every(n => n.length > 0)).toBe(true);
  });

  it.each([...SPHERE_NAMES])('changes generated names when the caster is %s-aligned', sphere => {
    // The falsification: a dead key contributes nothing to the adjective pool, so the
    // generator's output is byte-identical to the no-sphere run. Six keys behaved
    // exactly this way before THR-770.
    expect(namesFor(sphere)).not.toEqual(namesFor());
  });

  it.each([...SPHERE_NAMES])('renders at least one %s adjective across the probe set', sphere => {
    const adjectives = GROUP_NAME_SPHERE_ADJECTIVES[sphere];
    const hits = namesFor(sphere).filter(n => adjectives.some(a => n.includes(a)));
    expect(hits.length).toBeGreaterThan(0);
  });

  it('fails soft on a sphere id outside the closed set', () => {
    // The `?? []` row. An unvalidated graph property reaches this read site, so an
    // unknown id must degrade to "no sphere flavor", never throw.
    expect(() => generateGroupName({ groupId: 'g1', sphereId: 'not_a_sphere' })).not.toThrow();
    expect(generateGroupName({ groupId: 'g1', sphereId: 'not_a_sphere' })).toBe(
      generateGroupName({ groupId: 'g1' }),
    );
  });
});
