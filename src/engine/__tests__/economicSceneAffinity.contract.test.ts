/**
 * Contract: the economic tables name templates that actually exist (THR-725).
 *
 * This suite exists because the first implementation pass got it wrong in a way nothing
 * else could catch. The plan doc named families — `trade_fair`, `pickpocket`, `guild` — that
 * read as obviously real. They are real *encounter-content* ids, and they are not in
 * `UNIFIED_ACTION_TEMPLATES` under those names; the economically-flavoured scenes live under
 * `encounter.*`. Every affinity lookup would have missed, every seed would have withered,
 * typecheck and lint would have stayed green, and the interface map would have badged the
 * contract healthy on symbol presence alone.
 *
 * So these are not style assertions. They are the only mechanism that ties the content
 * tables to the registry they are about.
 */

import { describe, it, expect } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import {
  ECON_BOOM_SEED_TEMPLATES,
  ECON_BUST_SEED_TEMPLATES,
  ECON_FRAGMENT_COUNT,
  ECONOMIC_MOOD_VOCABULARY,
  ECONOMIC_SCENE_AFFINITY,
  getEconomicSceneAffinity,
} from '../../data/economic-scene-affinity';

const ALL_IDS = UNIFIED_ACTION_TEMPLATES.map(t => t.id);

describe('ECONOMIC_SCENE_AFFINITY keys resolve against the live registry', () => {
  it('every key is a prefix of at least one registered template', () => {
    const dead = Object.keys(ECONOMIC_SCENE_AFFINITY).filter(
      key => !ALL_IDS.some(id => id === key || id.startsWith(`${key}.`)),
    );
    expect(dead, `affinity keys matching no registered template: ${dead.join(', ')}`).toEqual([]);
  });

  it('resolves a concrete registered id through the longest-prefix lookup', () => {
    expect(getEconomicSceneAffinity('encounter.pickpocket')).toBeDefined();
    expect(getEconomicSceneAffinity('borderland.roadside_shakedown')).toBeDefined();
  });

  // A short key must not swallow an unrelated sibling — the phantom-match class that
  // word-boundary greps exist to prevent, in table form.
  it('matches only at a segment boundary', () => {
    expect(getEconomicSceneAffinity('encounter.pickpocket_but_different')).toBeUndefined();
  });

  it('prefers the longest authored prefix', () => {
    // `borderland` is authored as a whole family; a specific row would have to win over it.
    const family = getEconomicSceneAffinity('borderland.bandit_scouts');
    expect(family).toBe(ECONOMIC_SCENE_AFFINITY.borderland);
  });

  it('leaves economically-irrelevant scenes neutral', () => {
    expect(getEconomicSceneAffinity('encounter.offer_small_prayer')).toBeUndefined();
    expect(getEconomicSceneAffinity('encounter.commune_with_stars')).toBeUndefined();
  });

  it('keeps every weight within a sane authoring range', () => {
    for (const [key, a] of Object.entries(ECONOMIC_SCENE_AFFINITY)) {
      expect(Math.abs(a.boomWeight), key).toBeLessThanOrEqual(1);
      expect(Math.abs(a.bustWeight), key).toBeLessThanOrEqual(1);
    }
  });
});

describe('shock seed pools are spawnable', () => {
  const pools: Array<[string, readonly string[]]> = [
    ['boom', ECON_BOOM_SEED_TEMPLATES],
    ['bust', ECON_BUST_SEED_TEMPLATES],
  ];

  for (const [label, pool] of pools) {
    it(`${label}: every id is a registered template`, () => {
      const missing = pool.filter(id => !ALL_IDS.includes(id));
      expect(missing, `unregistered ${label} seed templates: ${missing.join(', ')}`).toEqual([]);
    });

    // A seed spawns an action for a mortal; a template mortals cannot perform never fires.
    it(`${label}: every id is individual-performable`, () => {
      const notPerformable = pool.filter(id => {
        const t = UNIFIED_ACTION_TEMPLATES.find(x => x.id === id);
        return !t?.actorAffinities?.includes('individual');
      });
      expect(notPerformable).toEqual([]);
    });

    // Shocks fire at settlements, so a pool entry restricted to ruins or wilderness would
    // plant seeds that can never play where the shock happened.
    it(`${label}: every id can play at a settlement`, () => {
      const settlementSubtypes = ['hamlet', 'town', 'city', 'capital'];
      const unplayable = pool.filter(id => {
        const t = UNIFIED_ACTION_TEMPLATES.find(x => x.id === id) as
          | { locationSubtypes?: string[] }
          | undefined;
        const subs = t?.locationSubtypes;
        return subs != null && subs.length > 0 && !subs.some(s => settlementSubtypes.includes(s));
      });
      expect(unplayable).toEqual([]);
    });

    it(`${label}: the pool has an authored affinity row for each entry`, () => {
      for (const id of pool) expect(getEconomicSceneAffinity(id), id).toBeDefined();
    });
  }

  it('boom and bust pools do not overlap', () => {
    const overlap = ECON_BOOM_SEED_TEMPLATES.filter(id => ECON_BUST_SEED_TEMPLATES.includes(id));
    expect(overlap).toEqual([]);
  });
});

describe('mood vocabulary', () => {
  it('authors ECON_FRAGMENT_COUNT entries per slot per polarity', () => {
    for (const polarity of ['boom', 'bust'] as const) {
      const v = ECONOMIC_MOOD_VOCABULARY[polarity];
      expect(v.adjectives, polarity).toHaveLength(ECON_FRAGMENT_COUNT);
      expect(v.nouns, polarity).toHaveLength(ECON_FRAGMENT_COUNT);
      expect(v.atmospheres, polarity).toHaveLength(ECON_FRAGMENT_COUNT);
    }
  });

  it('carries no empty or placeholder text', () => {
    for (const polarity of ['boom', 'bust'] as const) {
      const v = ECONOMIC_MOOD_VOCABULARY[polarity];
      for (const text of [...v.adjectives, ...v.nouns, ...v.atmospheres]) {
        expect(text.trim().length).toBeGreaterThan(2);
        expect(text).not.toMatch(/\{|\}|TODO/);
      }
    }
  });
});
