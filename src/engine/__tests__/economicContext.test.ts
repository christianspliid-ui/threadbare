/**
 * Economic context — scoring term + prose coloration (THR-725).
 *
 * These assert the *contract* the encounter pipeline depends on: a settlement outside the
 * neutral prosperity band bends scene selection toward families that fit its economy, and
 * everything about that is deterministic and fail-soft.
 */

import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../graph';
import {
  computeEconomicContextBonus,
  readEconomy,
  resolveEconomicMood,
  resolveGoverningProsperity,
} from '../economicContext';
import {
  ECON_BOOM_THRESHOLD,
  ECON_BUST_THRESHOLD,
  ECON_SCORING_CAP,
  ECON_SCORING_WEIGHT,
  ECONOMIC_SCENE_AFFINITY,
  getEconomicSceneAffinity,
} from '../../data/economic-scene-affinity';

describe('readEconomy — neutral band and deviation', () => {
  it('reads the neutral band as economically silent', () => {
    for (const p of [ECON_BUST_THRESHOLD, 50, ECON_BOOM_THRESHOLD]) {
      const reading = readEconomy(p);
      expect(reading.polarity).toBeNull();
      expect(reading.deviation).toBe(0);
    }
  });

  it('normalizes boom deviation to 1 at the top of the scale', () => {
    expect(readEconomy(100)).toMatchObject({ polarity: 'boom', deviation: 1 });
  });

  it('normalizes bust deviation to 1 at the bottom of the scale', () => {
    expect(readEconomy(0)).toMatchObject({ polarity: 'bust', deviation: 1 });
  });

  it('deviation grows monotonically as prosperity leaves the band', () => {
    const near = readEconomy(ECON_BOOM_THRESHOLD + 5).deviation;
    const far = readEconomy(ECON_BOOM_THRESHOLD + 20).deviation;
    expect(far).toBeGreaterThan(near);
  });

  // Fail-soft: NFP #4 — a missing or malformed property is neutral, never a throw.
  it('treats null and NaN prosperity as neutral', () => {
    expect(readEconomy(null).polarity).toBeNull();
    expect(readEconomy(Number.NaN).polarity).toBeNull();
  });
});

describe('computeEconomicContextBonus', () => {
  it('is zero inside the neutral band even for a listed family', () => {
    expect(computeEconomicContextBonus(50, 'encounter.market_haggle')).toBe(0);
  });

  it('rewards a boom family at a booming settlement', () => {
    expect(computeEconomicContextBonus(100, 'encounter.market_haggle')).toBeGreaterThan(0);
  });

  it('rewards a bust family at a destitute settlement', () => {
    expect(computeEconomicContextBonus(0, 'encounter.debt_collection')).toBeGreaterThan(0);
  });

  // The signed-weight design is the point: revelry gets rarer as the granaries empty.
  it('penalizes a festival family at a destitute settlement', () => {
    expect(computeEconomicContextBonus(0, 'encounter.market_day_festival')).toBeLessThan(0);
  });

  it('matches the documented formula exactly', () => {
    const affinity = ECONOMIC_SCENE_AFFINITY['encounter.market_haggle'];
    // deviation = 1 at prosperity 100
    expect(computeEconomicContextBonus(100, 'encounter.market_haggle')).toBeCloseTo(
      ECON_SCORING_WEIGHT * 1 * affinity.boomWeight,
      10,
    );
  });

  it('never exceeds the cap in either direction', () => {
    for (const templateId of Object.keys(ECONOMIC_SCENE_AFFINITY)) {
      for (const p of [0, 100]) {
        expect(Math.abs(computeEconomicContextBonus(p, templateId))).toBeLessThanOrEqual(ECON_SCORING_CAP);
      }
    }
  });

  // Fail-soft: an unlisted family is neutral by design, not an error.
  it('is zero for a family with no authored row', () => {
    expect(computeEconomicContextBonus(0, 'no_such_family.thing')).toBe(0);
    expect(computeEconomicContextBonus(100, 'no_such_family.thing')).toBe(0);
  });

  it('is zero for a template id with no family prefix', () => {
    expect(computeEconomicContextBonus(0, 'bare_id')).toBe(0);
    expect(getEconomicSceneAffinity('.leading_dot')).toBeUndefined();
  });

  it('is zero when prosperity is unresolvable', () => {
    expect(computeEconomicContextBonus(null, 'encounter.market_haggle')).toBe(0);
  });

  // NFP #3 — same inputs, same output, always.
  it('is deterministic', () => {
    const a = computeEconomicContextBonus(12, 'encounter.pickpocket');
    const b = computeEconomicContextBonus(12, 'encounter.pickpocket');
    expect(a).toBe(b);
  });
});

describe('resolveGoverningProsperity — three-tier position model', () => {
  it('reads prosperity straight off a settlement', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc.town', type: 'location', name: 'Ashford', properties: { prosperity: 64 } });
    expect(resolveGoverningProsperity(graph, 'loc.town')).toBe(64);
  });

  // A scene in a tavern is governed by the town's economy, not the tavern's absent one.
  it('walks a sublocation up to its parent settlement', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc.town', type: 'location', name: 'Ashford', properties: { prosperity: 18 } });
    graph.addNode({
      id: 'sub.tavern', type: 'location', name: 'The Bell',
      properties: { parentLocationId: 'loc.town' },
    });
    expect(resolveGoverningProsperity(graph, 'sub.tavern')).toBe(18);
  });

  it('returns null when nothing up the chain carries prosperity', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc.wild', type: 'location', name: 'The Reach', properties: {} });
    expect(resolveGoverningProsperity(graph, 'loc.wild')).toBeNull();
    expect(resolveGoverningProsperity(graph, 'loc.missing')).toBeNull();
    expect(resolveGoverningProsperity(graph, undefined)).toBeNull();
  });

  // Guard against an unbounded walk: the position model nests exactly one level, and this
  // runs per scored candidate.
  it('does not chase a parent chain deeper than one hop', () => {
    const graph = new WorldGraph();
    graph.addNode({ id: 'a', type: 'location', name: 'A', properties: { prosperity: 90 } });
    graph.addNode({ id: 'b', type: 'location', name: 'B', properties: { parentLocationId: 'a' } });
    graph.addNode({ id: 'c', type: 'location', name: 'C', properties: { parentLocationId: 'b' } });
    expect(resolveGoverningProsperity(graph, 'c')).toBeNull();
  });
});

describe('resolveEconomicMood — prose coloration', () => {
  function graphAt(prosperity: number): WorldGraph {
    const graph = new WorldGraph();
    graph.addNode({ id: 'loc.1', type: 'location', name: 'Ashford', properties: { prosperity } });
    return graph;
  }

  it('returns null inside the neutral band so tokens strip silently', () => {
    expect(resolveEconomicMood(graphAt(50), 'loc.1')).toBeNull();
  });

  it('binds boom vocabulary above the boom threshold', () => {
    const mood = resolveEconomicMood(graphAt(95), 'loc.1');
    expect(mood?.polarity).toBe('boom');
    expect(mood?.adj).toBeTruthy();
    expect(mood?.noun).toBeTruthy();
    expect(mood?.atmosphere).toBeTruthy();
  });

  it('binds bust vocabulary below the bust threshold', () => {
    expect(resolveEconomicMood(graphAt(5), 'loc.1')?.polarity).toBe('bust');
  });

  // NFP #3 — a settlement keeps a consistent voice instead of reshuffling per render.
  it('is deterministic for the same location', () => {
    const first = resolveEconomicMood(graphAt(5), 'loc.1');
    const second = resolveEconomicMood(graphAt(5), 'loc.1');
    expect(first).toEqual(second);
  });

  it('gives different settlements different voices', () => {
    const graph = new WorldGraph();
    for (const id of ['loc.a', 'loc.b', 'loc.c', 'loc.d', 'loc.e']) {
      graph.addNode({ id, type: 'location', name: id, properties: { prosperity: 5 } });
    }
    const atmospheres = new Set(
      ['loc.a', 'loc.b', 'loc.c', 'loc.d', 'loc.e'].map(id => resolveEconomicMood(graph, id)?.atmosphere),
    );
    expect(atmospheres.size).toBeGreaterThan(1);
  });

  it('returns null for an unresolvable location', () => {
    expect(resolveEconomicMood(new WorldGraph(), 'nope')).toBeNull();
  });
});
