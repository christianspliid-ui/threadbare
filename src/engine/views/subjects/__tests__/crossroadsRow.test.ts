/**
 * THR-1928 — the Crossroads row and the torn badge.
 *
 * The row renders only behind the action's own gates (Law 25), words the reading with
 * slice A's words, offers "Lean away" on the first road only, and prices and forecasts
 * every offer with the functions `placeCrossroadsLean` uses — so what the strip says
 * before paying is what the spend charges (Laws 17, 18). The torn badge reads the same
 * snapshot through the same `settledness` and clears while a lean is held.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const readable = vi.hoisted(() => ({ value: true }));
vi.mock('../../../intentionReading', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return { ...actual, canReadIntention: () => ({ readable: readable.value, secret: false }) };
});

import { WorldGraph } from '../../../graph';
import type { GameState } from '../../../../types/gameState';
import type { CrossroadsLean, CrossroadsSnapshot } from '../../../crossroads';
import { forecastLean } from '../../../crossroads';
import { placeCrossroadsLean } from '../../../crossroadsActions';
import { buildCrossroadsSection, crossroadsRowResolver, CROSSROADS_ROW_TYPE_ID } from '../crossroadsRow';
import { crossroadsBadgeFor, selectCrossroadsBadges } from '../../../../components/Game/crossroadsBadgeModel';
import { DETAIL_PAGE_REGISTRY } from '../../../../data/detailPageTemplates';
import { CROSSROADS_CONTROLS, LEAN_FORECAST, SETTLEDNESS_LINE } from '../../../../data/crossroads-content';

const GOD = 'god';
const KAEL = 'ind_kael';

const TORN: CrossroadsSnapshot = {
  tick: 9,
  options: [
    { family: 'encounter', templateId: 'duel', targetId: 'greyford', score: 1, reach: 'iron' },
    { family: 'encounter', templateId: 'feast', targetId: 'greyford', score: 0.9, reach: 'gold' },
    { family: 'strategic_action', templateId: 'survey', targetId: 'ruin_1', score: 0.5, reach: 'eye' },
  ],
};
const SET: CrossroadsSnapshot = { tick: 9, options: [{ ...TORN.options[0] }, { ...TORN.options[1], score: 0.3 }] };

function makeState(opts: { threaded?: boolean; snapshot?: CrossroadsSnapshot | null; pool?: number; lean?: CrossroadsLean } = {}): GameState {
  const g = new WorldGraph();
  g.addNode({ id: GOD, type: 'actor', name: 'The God', properties: { actorType: 'ascendant' } });
  g.addNode({ id: 'greyford', type: 'location', name: 'Greyford', properties: {} });
  g.addNode({ id: 'ruin_1', type: 'location', name: 'The Sunken Chapel', properties: {} });
  g.addNode({
    id: KAEL, type: 'actor', name: 'Kael',
    properties: {
      actorType: 'individual',
      ...(opts.snapshot === null ? {} : { crossroads: opts.snapshot ?? TORN }),
      ...(opts.lean ? { crossroadsLean: opts.lean } : {}),
    },
  });
  if (opts.threaded !== false) {
    g.addEdge({ id: 'thr', source: GOD, target: KAEL, type: 'thread', properties: { bondReception: 'devotion' } });
  }
  const pool = opts.pool ?? 10;
  return {
    tick: 10,
    graph: g,
    ascendantId: GOD,
    essencePool: { force: pool, life: pool, energy: pool, matter: pool, mind: pool, spirit: pool, time: pool, entropy: pool },
  } as unknown as GameState;
}

const HELD: CrossroadsLean = {
  family: 'encounter', templateId: 'feast', targetId: 'greyford', direction: 'toward',
  tick: 10, sphere: 'life', essencePaid: 3, rankWhenPlaced: 1, forecastAtPlacement: 'likely',
};

beforeEach(() => { readable.value = true; });

describe('the Crossroads row is gated as the action is (Law 25)', () => {
  it.each([
    ['unthreaded', () => makeState({ threaded: false })],
    ['no reading', () => makeState({ snapshot: null })],
    ['an empty reading', () => makeState({ snapshot: { tick: 9, options: [] } })],
  ] as const)('%s → nothing renders', (_why, build) => {
    expect(buildCrossroadsSection(build(), KAEL)).toBeNull();
  });

  it('an unreadable mind → nothing renders', () => {
    readable.value = false;
    expect(buildCrossroadsSection(makeState(), KAEL)).toBeNull();
  });

  it('only on the person page, only with state in context', () => {
    const state = makeState();
    const base = { nodeId: KAEL, graph: state.graph, seed: 1, tick: 10 };
    expect(crossroadsRowResolver({ ...base, pageKind: 'actor' })).toBeNull();
    expect(crossroadsRowResolver({ ...base, pageKind: 'place', state })).toBeNull();
    expect(crossroadsRowResolver({ ...base, pageKind: 'actor', state })?.typeId).toBe(CROSSROADS_ROW_TYPE_ID);
  });
});

describe('the row words the reading (plan § UI pillar)', () => {
  it('heading, settledness line and one tile per road, in snapshot order', () => {
    const s = buildCrossroadsSection(makeState(), KAEL)!;
    expect(s.kind).toBe('cards');
    expect(s.label).toBe('Next, Kael weighs');
    expect(s.labelTooltipId).toBe('ui.crossroads');
    expect(s.act?.intro).toEqual([{ text: SETTLEDNESS_LINE.torn.replace('{name}', 'Kael'), tooltipId: 'ui.crossroads.settledness' }]);
    expect(s.tiles).toHaveLength(3);
    // The road's target is a link, never a raw id (Law 21, PC-3).
    expect(s.tiles[0].byLine?.ref).toMatchObject({ kind: 'location', id: 'greyford' });
    expect(s.tiles[2].byLine?.ref).toMatchObject({ kind: 'location', id: 'ruin_1' });
    for (const t of s.tiles) {
      expect(t.title).not.toMatch(/^(duel|feast|survey)$/);
      const words = [t.title, t.kindWord, ...t.lines, ...(t.offers ?? []).flatMap(o => [o.label, o.forecast, o.confirm])];
      for (const w of words) expect(w).not.toMatch(/[{}]/);
    }
  });

  it('"Lean away" is offered on the first road only; "Lean toward" on every road', () => {
    const s = buildCrossroadsSection(makeState(), KAEL)!;
    expect(s.tiles.map(t => (t.offers ?? []).map(o => o.direction))).toEqual([['toward', 'away'], ['toward'], ['toward']]);
    expect(s.tiles[0].offers?.[0].label).toBe(CROSSROADS_CONTROLS.toward);
  });

  it('every offer says before paying what the spend then charges (Laws 17, 18)', () => {
    const s = buildCrossroadsSection(makeState(), KAEL)!;
    for (const tile of s.tiles) {
      for (const offer of tile.offers ?? []) {
        const road = TORN.options[offer.optionIndex];
        const word = forecastLean(TORN, { ...road, direction: offer.direction });
        expect(offer.forecast).toBe(LEAN_FORECAST[offer.direction][word].replace('{name}', 'Kael'));
        const placed = placeCrossroadsLean(makeState(), KAEL, road, offer.direction);
        expect(placed.success).toBe(true);
        expect(offer.cost).toBe(placed.essenceCost);
        expect(offer.sphere).toBe(placed.sphere);
        expect(offer.blockedReason).toBeNull();
        // The confirm names the pool; the price is pips, never a numeral (Laws 13, 15).
        expect(offer.confirm).toMatch(/essence/);
        expect(offer.confirm).not.toMatch(/\d/);
      }
    }
  });

  it('an unpayable price dims "Lean" with its reason (Law 25)', () => {
    const s = buildCrossroadsSection(makeState({ pool: 0 }), KAEL)!;
    expect(s.tiles[1].offers?.[0].blockedReason).toBe('Not enough Life essence.');
  });

  it('a held lean: the held line, the leaned road marked, no other controls', () => {
    const s = buildCrossroadsSection(makeState({ lean: HELD }), KAEL)!;
    expect(s.act?.held?.line).toMatch(/^Your hand rests on Kael, toward .+\. It waits until Kael next faces that road\.$/);
    expect(s.act?.held?.liftLabel).toBe(CROSSROADS_CONTROLS.lift);
    expect(s.tiles.map(t => t.marked === true)).toEqual([false, true, false]);
    expect(s.tiles.every(t => (t.offers ?? []).length === 0)).toBe(true);
  });
});

describe('the registry places the row right after what is on their mind (D7.1)', () => {
  it('crossroads sits between intention and current_work on Overview', () => {
    const rows = [...DETAIL_PAGE_REGISTRY.actor].sort((a, b) => a.order - b.order).map(r => r.typeId);
    const i = rows.indexOf('crossroads');
    expect(rows[i - 1]).toBe('intention');
    expect(rows[i + 1]).toBe('current_work');
    expect(DETAIL_PAGE_REGISTRY.actor.find(r => r.typeId === 'crossroads')?.tab).toBe('overview');
  });
});

describe('the torn badge reads the same snapshot (PC-6, Law 15)', () => {
  it('torn → a badge', () => {
    const b = crossroadsBadgeFor(makeState(), KAEL);
    expect(b).toMatchObject({ agentId: KAEL, label: 'Torn', icon: 'road' });
    expect(b?.ariaLabel).toContain('Kael');
  });

  it.each([
    ['a set mind', () => makeState({ snapshot: SET })],
    ['a held lean', () => makeState({ lean: HELD })],
    ['an unthreaded mortal', () => makeState({ threaded: false })],
    ['no reading', () => makeState({ snapshot: null })],
  ] as const)('%s → no badge', (_why, build) => {
    expect(crossroadsBadgeFor(build(), KAEL)).toBeNull();
  });

  it('an unreadable mind → no badge', () => {
    readable.value = false;
    expect(crossroadsBadgeFor(makeState(), KAEL)).toBeNull();
  });

  it('selects by threaded agent id, at most one per row', () => {
    const map = selectCrossroadsBadges(makeState(), [KAEL, KAEL, 'nobody']);
    expect([...map.keys()]).toEqual([KAEL]);
  });
});
