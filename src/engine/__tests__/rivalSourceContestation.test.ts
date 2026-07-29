/**
 * Rival source contestation tests (THR-621).
 *
 * The mechanic these cover is the *writer* for `contestedBy` / `desecrated`.
 * Before this landed, nothing in production set either field — only tests wrote
 * them and only the Defend op cleared them — so the assertions here deliberately
 * pin the write path itself, not just the derivations it feeds.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import type { EssenceSource } from '../../types/essenceSource';
import {
  findContestableSources,
  worldHasContestableSource,
  selectContestableSource,
  contestSource,
  desecrateSource,
  computeRivalDrainYield,
} from '../rivalSourceContestation';
import { readEssenceSource } from '../essenceSources';
import { BASE_SOURCE_INCOME, SOURCE_CONTESTED_PENALTY } from '../../data/essence-sources';

const ASCENDANT = 'ascendant.test';
const RIVAL = 'rival.ashen';
const OTHER_RIVAL = 'rival.other';

function source(over: Partial<EssenceSource> = {}): EssenceSource {
  return { kind: 'shrine', sphereAffinity: 'force', sanctity: 0.8, tier: 'flowering', ...over };
}

/** Graph with an ascendant controlling `hosts` (id → source bag). */
function makeGraph(hosts: Record<string, EssenceSource | undefined>): WorldGraph {
  const graph = new WorldGraph();
  graph.addNode({
    id: ASCENDANT,
    type: 'actor',
    name: 'The Witness',
    properties: { actorType: 'ascendant' },
  });
  for (const [id, src] of Object.entries(hosts)) {
    graph.addNode({
      id,
      type: 'location',
      name: id,
      properties: { hexCol: 1, hexRow: 1, ...(src ? { essenceSource: src } : {}) },
    });
    graph.addEdge({
      id: `edge_controls_${id}`,
      source: ASCENDANT,
      target: id,
      type: 'controls',
      properties: {},
    });
  }
  return graph;
}

describe('findContestableSources', () => {
  it('lists controlled sources and excludes ones already taken', () => {
    const graph = makeGraph({
      open: source(),
      already: source({ contestedBy: OTHER_RIVAL, tier: 'contested' }),
      lost: source({ desecrated: true, tier: 'desecrated' }),
      notASource: undefined,
    });
    expect(findContestableSources(graph, ASCENDANT).map((c) => c.hostId)).toEqual(['open']);
  });

  it('weights by keystone value — a flowering source outweighs a dormant one', () => {
    const graph = makeGraph({
      rich: source({ tier: 'flowering' }),
      poor: source({ sanctity: 0.1, tier: 'dormant' }),
    });
    const byId = new Map(findContestableSources(graph, ASCENDANT).map((c) => [c.hostId, c.weight]));
    expect(byId.get('rich')!).toBeGreaterThan(byId.get('poor')!);
  });

  it('is fail-soft on a missing ascendant', () => {
    expect(findContestableSources(makeGraph({}), 'nope')).toEqual([]);
  });
});

describe('worldHasContestableSource — the family eligibility gate', () => {
  it('is false with no ascendant, no sources, or only lost ones', () => {
    expect(worldHasContestableSource(makeGraph({ a: source() }), undefined)).toBe(false);
    expect(worldHasContestableSource(makeGraph({}), ASCENDANT)).toBe(false);
    expect(
      worldHasContestableSource(makeGraph({ a: source({ desecrated: true }) }), ASCENDANT),
    ).toBe(false);
  });

  it('is true once the player holds one contestable source', () => {
    expect(worldHasContestableSource(makeGraph({ a: source() }), ASCENDANT)).toBe(true);
  });
});

describe('selectContestableSource', () => {
  it('respects the alreadyTargeted exclusion', () => {
    const graph = makeGraph({ a: source(), b: source() });
    const pick = selectContestableSource(graph, ASCENDANT, new Set(['a']), () => 0.5);
    expect(pick?.hostId).toBe('b');
  });

  it('returns undefined when everything is excluded', () => {
    const graph = makeGraph({ a: source() });
    expect(selectContestableSource(graph, ASCENDANT, new Set(['a']), () => 0.5)).toBeUndefined();
  });

  it('consumes exactly one rng draw (tick determinism, NFP #3)', () => {
    const graph = makeGraph({ a: source(), b: source() });
    let draws = 0;
    selectContestableSource(graph, ASCENDANT, new Set(), () => {
      draws++;
      return 0.5;
    });
    expect(draws).toBe(1);
  });
});

describe('contestSource', () => {
  it('sets contestedBy and flips the derived tier to contested', () => {
    const graph = makeGraph({ shrine: source({ tier: 'flowering' }) });
    expect(contestSource(graph, 'shrine', RIVAL)).toBe(true);

    const src = readEssenceSource(graph.getNode('shrine')!.properties);
    expect(src?.contestedBy).toBe(RIVAL);
    expect(src?.tier).toBe('contested');
    // Sanctity is untouched — the per-tick bleed is the source phase's job.
    expect(src?.sanctity).toBe(0.8);
  });

  it('does not steal a source another rival already holds', () => {
    const graph = makeGraph({ shrine: source({ contestedBy: OTHER_RIVAL, tier: 'contested' }) });
    expect(contestSource(graph, 'shrine', RIVAL)).toBe(false);
    expect(readEssenceSource(graph.getNode('shrine')!.properties)?.contestedBy).toBe(OTHER_RIVAL);
  });

  it('is idempotent and fail-soft', () => {
    const graph = makeGraph({ shrine: source() });
    expect(contestSource(graph, 'shrine', RIVAL)).toBe(true);
    expect(contestSource(graph, 'shrine', RIVAL)).toBe(false); // second call is a no-op
    expect(contestSource(graph, 'missing', RIVAL)).toBe(false);
    expect(contestSource(makeGraph({ bare: undefined }), 'bare', RIVAL)).toBe(false);
  });
});

describe('desecrateSource — gated on the drain being held', () => {
  it('desecrates a source this rival contests', () => {
    const graph = makeGraph({ shrine: source({ contestedBy: RIVAL, tier: 'contested' }) });
    expect(desecrateSource(graph, 'shrine', RIVAL)).toBe(true);

    const src = readEssenceSource(graph.getNode('shrine')!.properties);
    expect(src?.desecrated).toBe(true);
    expect(src?.tier).toBe('desecrated');
  });

  it('lands on nothing when the player warded first — the Defend leg working', () => {
    // The shipped Defend op clears `contestedBy`; the crack beat then finds nothing.
    const graph = makeGraph({ shrine: source({ tier: 'flowering' }) });
    expect(desecrateSource(graph, 'shrine', RIVAL)).toBe(false);
    expect(readEssenceSource(graph.getNode('shrine')!.properties)?.desecrated).toBeFalsy();
  });

  it('cannot desecrate a source held by a different rival', () => {
    const graph = makeGraph({ shrine: source({ contestedBy: OTHER_RIVAL, tier: 'contested' }) });
    expect(desecrateSource(graph, 'shrine', RIVAL)).toBe(false);
  });
});

describe('computeRivalDrainYield — the redirect ledger', () => {
  const base = BASE_SOURCE_INCOME.shrine;

  it('credits a contested source with exactly the income the player loses', () => {
    const graph = makeGraph({ shrine: source({ tier: 'contested', contestedBy: RIVAL }) });
    const drain = computeRivalDrainYield(graph, ASCENDANT, RIVAL);

    // sanctity 0.8 ⇒ the source would be `flowering` (×2) with no rival on it;
    // contested pays ×SOURCE_CONTESTED_PENALTY. The rival banks the gap.
    expect(drain.amount).toBeCloseTo(base * (2.0 - SOURCE_CONTESTED_PENALTY), 5);
    expect(drain.contestedHostIds).toEqual(['shrine']);
    expect(drain.desecratedHostIds).toEqual([]);
  });

  it('credits a desecrated source with the whole uncontested yield', () => {
    const graph = makeGraph({
      shrine: source({ tier: 'desecrated', contestedBy: RIVAL, desecrated: true }),
    });
    const drain = computeRivalDrainYield(graph, ASCENDANT, RIVAL);

    expect(drain.amount).toBeCloseTo(base * 2.0, 5);
    expect(drain.desecratedHostIds).toEqual(['shrine']);
  });

  it('attributes per rival — one rival never banks another’s drain', () => {
    const graph = makeGraph({
      mine: source({ tier: 'contested', contestedBy: RIVAL }),
      theirs: source({ tier: 'contested', contestedBy: OTHER_RIVAL }),
    });
    expect(computeRivalDrainYield(graph, ASCENDANT, RIVAL).contestedHostIds).toEqual(['mine']);
    expect(computeRivalDrainYield(graph, ASCENDANT, OTHER_RIVAL).contestedHostIds).toEqual([
      'theirs',
    ]);
  });

  it('is zero for a rival draining nothing, and fail-soft without an ascendant', () => {
    const graph = makeGraph({ shrine: source() });
    expect(computeRivalDrainYield(graph, ASCENDANT, RIVAL).amount).toBe(0);
    expect(computeRivalDrainYield(graph, undefined, RIVAL).amount).toBe(0);
  });
});
