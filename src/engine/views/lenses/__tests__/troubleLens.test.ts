/**
 * The Trouble lens's view model (THR-1898; THR-1878 plan § D4, § Done when → Lenses II;
 * THR-1822 D17 contract).
 *
 * Unrest agrees with both surfaces that already tell it (the Lawless chip, the hex
 * survey's mood bucket); battles and sieges light their hex with no badge; a local omen
 * lights its reach and draws a ring; the rival is named; nothing on unexplored land.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../../graph';
import { buildViewContext } from '../../viewContext';
import { readView } from '../../readView';
import { assertSerialisable } from '../../__tests__/viewContract';
import { hexLensViewSelector } from '../lensView';
import { buildTroubleLens, TROUBLE_DOOM_TOOLTIP_ID } from '../troubleLens';
import { lensLineText } from '../lensTypes';
import { TROUBLE_LENS_WORDS } from '../../../../data/view-content';
import { deriveMoodBucket } from '../../../surveyProseComposer';
import type { GameState } from '../../../../types/gameState';
import { lensFixture, lensTile } from './lensFixture';

function trouble(opts?: Parameters<typeof lensFixture>[0]) {
  const { state, tiles } = lensFixture(opts);
  return buildTroubleLens(buildViewContext(null, state, tiles));
}

const hoverText = (vm: ReturnType<typeof trouble>, key: string) => (vm.hover[key] ?? []).map(lensLineText);

/** A bare world: one or two Locations on hex 2,2 at the given unrest, optionally one Lawless. */
function unrestWorld(locs: { id: string; name: string; unrest: number; lawless?: boolean }[]) {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'trait.condition.location.lawless', type: 'trait', name: 'Lawless', properties: {} });
  for (const l of locs) {
    graph.addNode({ id: l.id, type: 'location', name: l.name, properties: { locationType: 'town', hexCol: 2, hexRow: 2, unrest: l.unrest } });
    if (l.lawless) graph.addEdge({ id: `${l.id}_lawless`, source: l.id, target: 'trait.condition.location.lawless', type: 'has_trait', properties: {} });
  }
  const state = {
    graph, ascendantId: 'asc', tick: 1, visibilityMap: new Map(), unifiedActions: [], familiarityMap: new Map(),
    rivalDefinitions: [], emittedOmens: [],
  } as unknown as GameState;
  return buildTroubleLens(buildViewContext(null, state, [lensTile(2, 2)]));
}

describe('Trouble lens — the Unrest rule', () => {
  it('a one-Location hex whose Location is Lawless at unrest 55 is lit and says so in the chip\'s word', () => {
    const vm = unrestWorld([{ id: 'ferris', name: 'Ferris', unrest: 55, lawless: true }]);
    expect(vm.lit).toEqual(['2,2']);
    expect(hoverText(vm, '2,2')).toEqual(['Unrest: Ferris is lawless.']);
    expect(vm.marks.map(m => m.kind)).toEqual(['unrest']);
  });

  it('a hex whose average unrest is past restless, with no Lawless place, is lit in the survey\'s bucket', () => {
    const vm = unrestWorld([{ id: 'a', name: 'Ashby', unrest: 75 }]);
    const graph = new WorldGraph();
    graph.addNode({ id: 'a', type: 'location', name: 'Ashby', properties: { hexCol: 2, hexRow: 2, unrest: 75 } });
    const bucket = deriveMoodBucket(graph, 2, 2);
    expect(bucket).toBe('agitated');
    expect(vm.lit).toEqual(['2,2']);
    expect(hoverText(vm, '2,2')).toEqual([TROUBLE_LENS_WORDS.unrestMood.agitated]);
  });

  it('boiling reads "boiling over"', () => {
    const vm = unrestWorld([{ id: 'a', name: 'Ashby', unrest: 95 }]);
    expect(hoverText(vm, '2,2')).toEqual(['Unrest: the people here are boiling over.']);
  });

  it('a two-Location hex with no Lawless place and an average at or below restless is not lit', () => {
    const vm = unrestWorld([
      { id: 'a', name: 'Ashby', unrest: 80 },
      { id: 'b', name: 'Brindle', unrest: 30 },
    ]);
    expect(vm.lit).toEqual([]);
    expect(vm.emptyLine).toBe(TROUBLE_LENS_WORDS.empty);
  });
});

describe('Trouble lens — on the shared fixture', () => {
  it('lights the Lawless town, the agitated hex, the siege, the lair, the drain and the omen\'s reach', () => {
    const vm = trouble();
    for (const key of ['6,3', '1,1', '4,1', '2,3', '3,3', '3,2', '2,3']) expect(vm.lit).toContain(key);
    expect(vm.emptyLine).toBeNull();
  });

  it('a siege hex is lit with no battle or siege badge, and no second line for it', () => {
    const vm = trouble();
    expect(vm.lit).toContain('4,1');
    expect(vm.marks.filter(m => m.hexKey === '4,1')).toEqual([]);
    expect(vm.hover['4,1']).toBeUndefined();
  });

  it('a local omen lights its reach and draws one ring at its centre', () => {
    const vm = trouble();
    const ring = vm.marks.filter(m => m.kind === 'omen');
    expect(ring).toEqual([{ kind: 'omen', hexKey: '3,3', tone: 'trouble', radius: 1 }]);
    expect(hoverText(vm, '3,3')).toContain('An omen of Entropy hangs over this land.');
    expect(hoverText(vm, '3,2')).toContain('An omen of Entropy hangs over this land.');
    expect(vm.lit).not.toContain('0,0');
  });

  it('an expired omen is not drawn', () => {
    const { state, tiles } = lensFixture();
    const vm = buildTroubleLens(buildViewContext(null, { ...state, tick: 50 } as GameState, tiles));
    expect(vm.marks.some(m => m.kind === 'omen')).toBe(false);
  });

  it('names the rival on a drain', () => {
    const vm = trouble();
    expect(hoverText(vm, '6,3')).toEqual([
      'Unrest: Farhold is lawless.',
      'A drain of The Salt Spire: it is contesting your source at Farhold.',
    ]);
    expect(vm.marks.filter(m => m.hexKey === '6,3').map(m => m.kind)).toEqual(['unrest', 'drain']);
  });

  it('a lair names its tier', () => {
    expect(hoverText(trouble(), '2,3')).toContain('Wolf Hollow: a great lair.');
  });

  it('the legend head carries the doom stage with the doom bar\'s tooltip', () => {
    const vm = trouble();
    expect(vm.legend.head).toBe('Trouble');
    expect(vm.legend.headNote).toEqual({ text: 'Doom: Signs', tooltipId: TROUBLE_DOOM_TOOLTIP_ID });
    expect(vm.legend.lines).toEqual(['Lit ground is where something is going wrong.']);
  });

  it('puts nothing on an unexplored hex', () => {
    const vm = trouble({ explored: ['1,1', '4,1'] });
    expect(vm.lit.every(k => k === '1,1' || k === '4,1')).toBe(true);
    expect(Object.keys(vm.hover).every(k => k === '1,1' || k === '4,1')).toBe(true);
    expect(vm.marks.every(m => m.hexKey === '1,1' || m.hexKey === '4,1')).toBe(true);
  });

  it('a quiet world says so in words', () => {
    const vm = trouble({ quiet: true, noThreads: true });
    expect(vm.lit).toEqual([]);
    expect(vm.emptyLine).toBe('Nothing is going wrong that you can see.');
  });

  it('meets the view contract: serialisable, deterministic, no raw ids or numbers in words', () => {
    const a = trouble();
    const b = trouble();
    expect(a).toEqual(b);
    assertSerialisable(a);
    for (const lines of Object.values(a.hover)) {
      for (const line of lines) {
        const text = lensLineText(line);
        expect(text).not.toMatch(/\d/);
        expect(text).not.toMatch(/loc_|rival_|lair_|omen_/);
      }
    }
  });

  it('reads through the seam as lens.hex', () => {
    const { state, tiles } = lensFixture();
    const vm = readView(null, state, hexLensViewSelector, { lensId: 'trouble' }, tiles);
    expect(vm.lensId).toBe('trouble');
    expect(vm.lit.length).toBeGreaterThan(0);
  });
});
