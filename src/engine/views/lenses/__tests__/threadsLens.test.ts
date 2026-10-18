/**
 * The Threads lens's view model (THR-1878 plan § D4; THR-1822 D17 contract).
 *
 * Threads lights each threaded mortal's hex (the_first, retinue, watched — never a
 * dormant thread), arrows a moving mortal to its destination's place-tier hex, names
 * them in hover lines whose names are ref segments, and puts nothing on unexplored land.
 */
import { describe, it, expect } from 'vitest';
import { readView } from '../../readView';
import { buildViewContext } from '../../viewContext';
import { getViewSelector } from '../../selectors';
import { assertSerialisable } from '../../__tests__/viewContract';
import { hexLensViewSelector } from '../lensView';
import { buildThreadsLens } from '../threadsLens';
import { lensLineText, LENS_HOVER_MAX_LINES } from '../lensTypes';
import { THREADS_LENS_WORDS } from '../../../../data/view-content';
import { lensFixture } from './lensFixture';

function threads(opts?: Parameters<typeof lensFixture>[0]) {
  const { state, tiles } = lensFixture(opts);
  return buildThreadsLens(buildViewContext(null, state, tiles));
}

describe('Threads lens view model', () => {
  it('is registered on the seam as lens.hex', () => {
    expect(getViewSelector('lens.hex')).toBe(hexLensViewSelector);
  });

  it('lights each threaded mortal\'s hex and the destination hex, never a dormant thread', () => {
    const vm = threads();
    // Maren (1,1), Oswin + the nameless watcher (4,1), Ilse (6,3); Maren heads to 4,1.
    expect(vm.lit).toEqual(['1,1', '4,1', '6,3']);
    const medallions = vm.marks.filter(m => m.kind === 'medallion');
    expect(medallions.map(m => m.agentId)).toEqual(['maren', 'oswin', 'nameless', 'farwalker']);
    expect(medallions.find(m => m.agentId === 'sleeper')).toBeUndefined();
    expect(medallions.map(m => m.tone)).toEqual(['first', 'retinue', 'watched', 'watched']);
  });

  it('arrows a moving mortal to its destination, resolved to the place tier', () => {
    const vm = threads();
    const arrows = vm.marks.filter(m => m.kind === 'destination');
    expect(arrows).toHaveLength(1);
    expect(arrows[0]).toMatchObject({ hexKey: '1,1', toHexKey: '4,1', tone: 'first', agentId: 'maren' });
    // The tavern is a sublocation; the arrow names its town.
    expect(arrows[0].ref).toMatchObject({ kind: 'location', id: 'loc_hesk', name: 'Hesk Crossing' });
  });

  it('says who is here and where they are going, with names as ref segments', () => {
    const vm = threads();
    expect(vm.hover['1,1'].map(lensLineText)).toEqual([
      'Maren Ashfold, your First, is here, on her way to Hesk Crossing.',
    ]);
    expect(vm.hover['4,1'].map(lensLineText)).toEqual([
      'Maren Ashfold, your First, is on her way here from Millbrook.',
      'Oswin Hale, of your retinue, is here.',
      'Whom you watch is here.',
    ]);
    const first = vm.hover['1,1'][0].segments;
    expect(first.find(s => s.text === 'Maren Ashfold')?.ref).toMatchObject({ kind: 'agent', id: 'maren' });
    expect(first.find(s => s.text === 'Hesk Crossing')?.ref).toMatchObject({ kind: 'location', id: 'loc_hesk' });
  });

  it('a mortal with no name is tagged by court phrase, never an id or an empty tag', () => {
    const vm = threads();
    const tag = vm.marks.find(m => m.agentId === 'nameless' && m.kind === 'medallion')?.tag;
    expect(tag).toBe(THREADS_LENS_WORDS.courtTag.watched);
    for (const m of vm.marks.filter(x => x.kind === 'medallion')) expect((m.tag ?? '').trim().length).toBeGreaterThan(0);
  });

  it('puts nothing on an unexplored hex', () => {
    const vm = threads({ explored: ['1,1', '4,1'] });
    expect(vm.lit).not.toContain('6,3');
    expect(vm.marks.some(m => m.hexKey === '6,3' || m.toHexKey === '6,3')).toBe(false);
    expect(vm.hover['6,3']).toBeUndefined();
  });

  it('an unexplored destination draws no arrow and lights nothing there', () => {
    const vm = threads({ explored: ['1,1', '6,3'] });
    expect(vm.marks.filter(m => m.kind === 'destination')).toEqual([]);
    expect(vm.lit).toEqual(['1,1', '6,3']);
    expect(vm.hover['1,1'].map(lensLineText)).toEqual(['Maren Ashfold, your First, is here.']);
  });

  it('a mortal partway along a road is lit on its road hex, where the agent layer draws it', () => {
    const { state, tiles } = lensFixture();
    const maren = state.graph.getNode('maren')!;
    (maren.properties.movementState as Record<string, unknown>).currentHexPosition = { col: 2, row: 1 };
    const vm = buildThreadsLens(buildViewContext(null, state, tiles));
    expect(vm.marks.find(m => m.kind === 'medallion' && m.agentId === 'maren')?.hexKey).toBe('2,1');
    expect(vm.marks.find(m => m.kind === 'destination')).toMatchObject({ hexKey: '2,1', toHexKey: '4,1' });
    expect(vm.lit).toContain('2,1');
    expect(vm.lit).not.toContain('1,1');
    // Where she set out from is still her located place.
    expect(vm.hover['4,1'].map(lensLineText)[0]).toBe('Maren Ashfold, your First, is on her way here from Millbrook.');
  });

  it('with fog off, the lens treats every hex as known, as the map does', () => {
    const { state, tiles } = lensFixture({ explored: ['1,1'] });
    const fogged = readView(null, state, hexLensViewSelector, { lensId: 'threads' }, tiles);
    const fogOff = readView(null, state, hexLensViewSelector, { lensId: 'threads', fogOff: true }, tiles);
    expect(fogged.lit).toEqual(['1,1']);
    expect(fogOff.lit).toEqual(['1,1', '4,1', '6,3']);
  });

  it('before the bond: nothing lit and the empty line', () => {
    const vm = threads({ noThreads: true });
    expect(vm.lit).toEqual([]);
    expect(vm.marks).toEqual([]);
    expect(vm.emptyLine).toBe('You have no threaded mortals yet.');
    expect(vm.legend.head).toBe('Threads');
  });

  it('caps hover lines per hex with the overflow line', () => {
    const { state, tiles } = lensFixture();
    for (let i = 0; i < 6; i++) {
      state.graph.addNode({ id: `r${i}`, type: 'actor', name: `Retainer ${i}`, properties: { actorType: 'individual' } });
      state.graph.addEdge({ id: `r${i}_at`, source: `r${i}`, target: 'loc_far', type: 'located_at', properties: {} });
      state.graph.addEdge({ id: `t_r${i}`, source: 'asc', target: `r${i}`, type: 'thread', properties: { courtPosition: 'retinue' } });
    }
    const vm = buildThreadsLens(buildViewContext(null, state, tiles));
    const lines = vm.hover['6,3'];
    expect(lines).toHaveLength(LENS_HOVER_MAX_LINES);
    expect(lensLineText(lines[lines.length - 1])).toBe(THREADS_LENS_WORDS.overflow);
  });

  it('meets the view contract: serialisable, deterministic, no raw ids or numbers in display text', () => {
    const a = threads();
    const b = threads();
    assertSerialisable(a, 'threads lens');
    expect(a).toEqual(b);
    for (const lines of Object.values(a.hover)) {
      for (const line of lines) {
        const text = lensLineText(line);
        expect(text).not.toMatch(/\d/);
        expect(text).not.toMatch(/maren|oswin|loc_/);
      }
    }
  });

  it('reads through readView with a typed fallback when the build throws', () => {
    const { state, tiles } = lensFixture();
    (state as unknown as { graph: unknown }).graph = { getOutgoingEdges: () => { throw new Error('boom'); } };
    const vm = readView(null, state, hexLensViewSelector, { lensId: 'threads' }, tiles);
    expect(vm.lit).toEqual([]);
    expect(vm.emptyLine).toBe('This lens has nothing to show right now.');
  });
});
