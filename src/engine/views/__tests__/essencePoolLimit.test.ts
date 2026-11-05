/**
 * THR-2148 (plan `2026-11-02-thr-2143-the-sheet-says-what-grew.md`, slice S1) —
 * the pool says how full it can get: the bar ends at the cap, the row reads
 * "53 / 55", the hover opens with the cap and its parts, and the paying row says
 * when and why upkeep is taken, with its payers counted in words and no digit.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldGraph } from '../../graph';
import type { SphereAlignment } from '../../../types/influence';
import { SPHERE_NAMES } from '../../../types/index';
import { BASE_MAX_ESSENCE, MAX_ESSENCE_PER_THREAD, TIER_MAINTENANCE } from '../../../data/influence-content';
import { SOURCE_CONTROL_SUSTAIN } from '../../../data/essence-sources';
import { computeEssenceIncomeBreakdown, upkeepPayers } from '../../essenceIncome';
import { upkeepChargedSources } from '../../essenceSources';
import {
  essenceCapSentence,
  essenceRowHover,
  essenceUpkeepSentence,
  selectEssenceRows,
} from '../subjects/godSheet';
import { essenceBalanceText, essenceFillPct, ESSENCE_BAR_CEILING } from '../../../components/Game/ascendant-bar/essenceDisplay';
import { UI_TOOLTIPS } from '../../../data/ui-content';
import type { GameState } from '../../../types/gameState';
import type { AscendantArchetype } from '../../../types/influence';

const ASC = 'asc.player';
const STEADY = { trend: 'steady' as const, feeds: [], draws: [] };

function addThread(graph: WorldGraph, n: number, tier = 1): void {
  const id = `agent.${n}`;
  graph.addNode({ id, type: 'actor', name: `Mortal ${n}`, properties: { actorType: 'individual' } });
  graph.addEdge({ id: `t.${n}`, source: ASC, target: id, type: 'thread', properties: { tier } });
}

describe('essenceFillPct — the bar ends at the cap', () => {
  it('a pool below its cap draws a bar under 100%, a full one 100%', () => {
    expect(essenceFillPct(53, 55)).toBeLessThan(100);
    expect(essenceFillPct(53, 55)).toBeCloseTo((53 / 55) * 100);
    expect(essenceFillPct(55, 55)).toBe(100);
  });
  it('a pool over the starting 50 no longer draws a full bar once the cap is above it', () => {
    expect(essenceFillPct(53)).toBe(100);
    expect(essenceFillPct(53, BASE_MAX_ESSENCE + MAX_ESSENCE_PER_THREAD)).toBeLessThan(100);
  });
  it('the fallback ceiling is unchanged', () => {
    expect(ESSENCE_BAR_CEILING).toBe(50);
  });
});

describe('essenceBalanceText — "53 / 55", whole numbers', () => {
  it('reads balance and limit, floored', () => {
    expect(essenceBalanceText(53.7, 55)).toEqual({ text: '53 / 55', aria: '53 of 55' });
  });
  it('fail-soft: no cap ⇒ the balance alone', () => {
    expect(essenceBalanceText(53, undefined).text).toBe('53');
    expect(essenceBalanceText(53, Infinity).text).toBe('53');
  });
});

describe('essenceCapSentence — three forms, figures from the constants', () => {
  it('before the bond', () => {
    expect(essenceCapSentence({ cap: BASE_MAX_ESSENCE, threads: 0 })).toBe(
      `Holds up to ${BASE_MAX_ESSENCE}. Each mortal you thread lets every pool hold ${MAX_ESSENCE_PER_THREAD} more.`,
    );
  });
  it('one thread', () => {
    const cap = BASE_MAX_ESSENCE + MAX_ESSENCE_PER_THREAD;
    expect(essenceCapSentence({ cap, threads: 1 })).toBe(
      `Holds up to ${cap}: ${BASE_MAX_ESSENCE}, and ${MAX_ESSENCE_PER_THREAD} more for the mortal you have threaded.`,
    );
  });
  it('several threads', () => {
    const cap = BASE_MAX_ESSENCE + 2 * MAX_ESSENCE_PER_THREAD;
    expect(essenceCapSentence({ cap, threads: 2 })).toBe(
      `Holds up to ${cap}: ${BASE_MAX_ESSENCE}, and ${MAX_ESSENCE_PER_THREAD} more for each mortal you have threaded.`,
    );
  });
});

describe('essenceUpkeepSentence — when and why, payers counted, no digit', () => {
  it('one thread', () => {
    expect(essenceUpkeepSentence('Refills slowly', { threads: 1, sources: 0 })).toBe(
      'Refills slowly. Your thread draws its upkeep from this pool, a little all day. So when it is full, it sits just under its limit.',
    );
  });
  it('one place of power', () => {
    expect(essenceUpkeepSentence('Refills slowly', { threads: 0, sources: 1 })).toMatch(/^Refills slowly\. Your place of power draws its upkeep/);
  });
  it('threads and a place', () => {
    expect(essenceUpkeepSentence('Refills slowly', { threads: 2, sources: 1 })).toBe(
      'Refills slowly. Your two threads and one place of power draw their upkeep from this pool, a little all day. So when it is full, it sits just under its limit.',
    );
  });
  it('nothing pays ⇒ no sentence; unreadable payers ⇒ the uncounted form', () => {
    expect(essenceUpkeepSentence('Refills fast', { threads: 0, sources: 0 })).toBeNull();
    expect(essenceUpkeepSentence('Refills fast', undefined)).toMatch(/^Refills fast\. Your upkeep is drawn from this pool/);
  });
  it('never carries a digit', () => {
    for (const payers of [{ threads: 1, sources: 0 }, { threads: 3, sources: 2 }, { threads: 12, sources: 4 }, undefined]) {
      expect(essenceUpkeepSentence('Refills slowly', payers) ?? '').not.toMatch(/\d/);
    }
  });
});

describe('essenceRowHover — the cap first, then upkeep on the paying row', () => {
  it('opens with the cap sentence; the paying row follows with the counted upkeep', () => {
    const cap = { cap: BASE_MAX_ESSENCE + MAX_ESSENCE_PER_THREAD, threads: 1 };
    const hover = essenceRowHover('life', STEADY, { band: 'slow', upkeep: true }, cap, { threads: 1, sources: 0 });
    expect(hover.startsWith(essenceCapSentence(cap))).toBe(true);
    expect(hover).toContain('Refills slowly. Your thread draws its upkeep from this pool');
  });
  it('a non-paying row has the cap and the refill word, no upkeep', () => {
    const hover = essenceRowHover('order', STEADY, { band: 'steady', upkeep: false }, { cap: 55, threads: 1 }, { threads: 1, sources: 0 });
    expect(hover).toMatch(/^Holds up to 55: .* Refills steadily\./);
    expect(hover).not.toMatch(/upkeep/);
  });
  it('the only numerals are the cap sentence’s', () => {
    const cap = { cap: 60, threads: 2 };
    const hover = essenceRowHover('life', STEADY, { band: 'slow', upkeep: true }, cap, { threads: 2, sources: 1 });
    expect(hover.replace(essenceCapSentence(cap), '')).not.toMatch(/\d/);
  });
});

describe('upkeepPayers — the same walk the ledger charges', () => {
  let graph: WorldGraph;
  beforeEach(() => {
    graph = new WorldGraph();
    graph.addNode({
      id: ASC, type: 'actor', name: 'The Poured One',
      properties: {
        actorType: 'ascendant',
        sphereAlignment: { primary: 'life', secondary: 'order' } as SphereAlignment,
        spherePoints: { life: 3, order: 2 },
        spherePointsSource: 'bought',
      },
    });
  });

  it('counts maintained threads and charged sources; the charge equals their sum', () => {
    addThread(graph, 1, 1);
    addThread(graph, 2, 2);
    addThread(graph, 3, 0); // tier 0 pays nothing
    const payers = upkeepPayers(graph, ASC);
    expect(payers).toEqual({ threads: 2, sources: upkeepChargedSources(graph, ASC).length });
    const drawn = computeEssenceIncomeBreakdown(graph, ASC).drawnPerTick?.life ?? 0;
    expect(drawn).toBeCloseTo(TIER_MAINTENANCE[1] + TIER_MAINTENANCE[2] + payers.sources * SOURCE_CONTROL_SUSTAIN);
  });

  it('the rows carry cap = 50 + 5 × threads and read it in the hover', () => {
    addThread(graph, 1, 1);
    const state = {
      graph, ascendantId: ASC, tick: 0,
      essencePool: Object.fromEntries(SPHERE_NAMES.map((s) => [s, 53])),
    } as unknown as GameState;
    const archetype = { sphereAlignment: { primary: 'life', secondary: 'order' } } as AscendantArchetype;
    const rows = selectEssenceRows(state, archetype);
    for (const row of rows) {
      expect(row.cap).toBe(BASE_MAX_ESSENCE + MAX_ESSENCE_PER_THREAD);
      expect(row.threads).toBe(1);
      expect(row.hoverDesc).toMatch(/^Holds up to 55: 50, and 5 more for the mortal you have threaded\./);
    }
    const life = rows.find((r) => r.sphere === 'life')!;
    expect(life.hoverDesc).toContain('Your thread draws its upkeep from this pool');
  });
});

describe('Fated hover — Christian’s ruling first', () => {
  it('opens with "a sure thing needs no god"', () => {
    expect(UI_TOOLTIPS['ui.forecast.fated'].desc.startsWith('The best word on the ladder: a sure thing needs no god.')).toBe(true);
  });
});
