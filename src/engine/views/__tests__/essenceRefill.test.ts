/**
 * THR-1985 (plan E1/E2) — the essence refill band: a share of total gross
 * income, banded at named thresholds; the Seat re-words no sphere but the
 * deepest; a bought sphere refills faster than an unbought one.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import { setHomeSeat } from '../../influence';
import type { SphereAlignment } from '../../../types/influence';
import { SPHERE_NAMES } from '../../../types/index';
import type { SphereName } from '../../../types/index';
import { essenceRefillBand, previewPourRefill, readEssenceRefill } from '../essenceRefill';
import {
  ESSENCE_REFILL_BANDS,
  ESSENCE_REFILL_FAST_SHARE,
  ESSENCE_REFILL_STEADY_SHARE,
  ESSENCE_REFILL_WORDS,
} from '../../../data/essence-refill-content';
import { selectEssenceRows } from '../subjects/godSheet';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';

const rank = (band: string) => ESSENCE_REFILL_BANDS.indexOf(band as never);

describe('essenceRefillBand — thresholds', () => {
  it('bands the share at each threshold', () => {
    expect(essenceRefillBand(ESSENCE_REFILL_FAST_SHARE, 1)).toBe('fast');
    expect(essenceRefillBand(ESSENCE_REFILL_FAST_SHARE - 0.001, 1)).toBe('steady');
    expect(essenceRefillBand(ESSENCE_REFILL_STEADY_SHARE, 1)).toBe('steady');
    expect(essenceRefillBand(ESSENCE_REFILL_STEADY_SHARE - 0.001, 1)).toBe('slow');
    expect(essenceRefillBand(0.0001, 1)).toBe('slow');
    expect(essenceRefillBand(0, 1)).toBe('drains');
    expect(essenceRefillBand(-0.3, 1)).toBe('drains');
  });

  it('is a share, not a rate: scaling both inputs keeps the band', () => {
    expect(essenceRefillBand(0.25, 1)).toBe(essenceRefillBand(0.5, 2));
    expect(essenceRefillBand(0.1, 1)).toBe(essenceRefillBand(0.3, 3));
  });

  it('fail-soft: no total income, or a non-finite input, gives no band', () => {
    expect(essenceRefillBand(0.5, 0)).toBeNull();
    expect(essenceRefillBand(Number.NaN, 1)).toBeNull();
  });

  it('every band has a word and a rung, best first', () => {
    const rungs = ESSENCE_REFILL_BANDS.map((b) => ESSENCE_REFILL_WORDS[b].rung);
    expect(rungs).toEqual([...rungs].sort((a, b) => b - a));
    for (const b of ESSENCE_REFILL_BANDS) expect(ESSENCE_REFILL_WORDS[b].row).not.toMatch(/\d/);
  });
});

describe('previewPourRefill — the pour screen word', () => {
  it('a bought sphere refills faster than every unbought one, and the deepest pays upkeep', () => {
    const preview = previewPourRefill({ life: 3, order: 2 });
    expect(preview.bands.life).toBe('fast');
    expect(preview.bands.order).toBe('fast');
    expect(preview.bands.entropy).toBe('slow');
    expect(preview.deepest).toBe('life');
  });

  it('moving a point changes that sphere’s word', () => {
    const before = previewPourRefill({ life: 3, order: 2 }).bands.order;
    const after = previewPourRefill({ life: 3, order: 1, mind: 1 }).bands.order;
    expect(before).toBe('fast');
    expect(after).toBe('steady');
  });
});

describe('readEssenceRefill — the live rows', () => {
  let graph: WorldGraph;
  const ascendantId = 'asc.player';

  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: ascendantId,
      type: 'actor',
      name: 'The Poured One',
      properties: {
        actorType: 'ascendant',
        sphereAlignment: { primary: 'life', secondary: 'order' } as SphereAlignment,
        spherePoints: { life: 3, order: 2 },
        spherePointsSource: 'bought',
      },
    });
    graph.addNode({ id: 'loc.throne', type: 'location', name: 'Throne', properties: { locationType: 'location' } });
  });

  it('bought spheres read faster than every unbought sphere', () => {
    const { spheres } = readEssenceRefill(graph, ascendantId);
    const bought: SphereName[] = ['life', 'order'];
    const slowestBought = Math.max(...bought.map((s) => rank(spheres[s]!.band)));
    for (const s of SPHERE_NAMES.filter((x) => !bought.includes(x))) {
      expect(rank(spheres[s]!.band)).toBeGreaterThan(slowestBought);
    }
  });

  it('the Seat’s income changes no band for any sphere but the deepest', () => {
    const before = readEssenceRefill(graph, ascendantId);
    setHomeSeat(graph, ascendantId, 'loc.throne');
    const after = readEssenceRefill(graph, ascendantId);
    expect(after.grossTotalPerTick).toBeGreaterThan(before.grossTotalPerTick);
    for (const s of SPHERE_NAMES) {
      if (s === 'life') continue;
      expect(after.spheres[s]!.band).toBe(before.spheres[s]!.band);
    }
  });

  it('the essence rows carry the band and mark the deepest sphere with upkeep', () => {
    const state = {
      graph,
      ascendantId,
      tick: 0,
      essencePool: Object.fromEntries(SPHERE_NAMES.map((s) => [s, 50])),
    } as unknown as GameState;
    const archetype = { sphereAlignment: { primary: 'life', secondary: 'order' } } as AscendantArchetype;
    const rows = selectEssenceRows(state, archetype);
    const life = rows.find((r) => r.sphere === 'life')!;
    const order = rows.find((r) => r.sphere === 'order')!;
    expect(life.refill).toEqual({ band: 'fast', upkeep: true });
    expect(order.refill).toEqual({ band: 'fast', upkeep: false });
    expect(life.hoverDesc).toMatch(/^Refills fast: your threads’ upkeep is paid from this pool\./);
    expect(order.hoverDesc).toMatch(/^Refills fast\./);
  });
});
