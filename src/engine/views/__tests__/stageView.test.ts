/**
 * THR-1892 — the Stage's view model (plan THR-1877 § D9, § Done when S2; THR-1822 § D12, § D17).
 *
 * Every branch of the lit-hex order, the layout, the place tag, the compact context line,
 * and the shared view-model contract (serialisable, deterministic, no raw ids or numbers
 * in display strings, a total fallback).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import { readView } from '../readView';
import { getViewSelector } from '../selectors';
import { buildViewContext } from '../viewContext';
import {
  buildStageView,
  fallbackStageView,
  resolveMomentHexes,
  stageContextLine,
  stageViewSelector,
  type StageMomentInput,
} from '../stage/stageView';
import { STAGE_WORDS } from '../../../data/view-content';
import { assertSerialisable } from './viewContract';

function makeState(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: 'asc', type: 'actor', name: 'Asc', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'millbrook', type: 'location', name: 'Millbrook', properties: { hexCol: 13, hexRow: 9 } });
  graph.addNode({ id: 'mill_square', type: 'location', name: 'The Square', properties: { parentLocationId: 'millbrook' } });
  graph.addNode({ id: 'ruin', type: 'location', name: 'Old Barrow', properties: { hexCol: 4, hexRow: 2, ruinMagnitude: 2, discovered: false } });
  graph.addNode({ id: 'maren', type: 'actor', name: 'Maren Ashfold', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'drifter', type: 'actor', name: 'Drifter', properties: { actorType: 'individual' } });
  graph.addNode({ id: 'kael', type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'e1', type: 'located_at', source: 'maren', target: 'mill_square', properties: {} });
  graph.addEdge({ id: 'e2', type: 'located_at', source: 'kael', target: 'millbrook', properties: {} });
  return {
    graph,
    ascendantId: 'asc',
    tick: 5,
    tiles: [
      { coord: { col: 13, row: 9 }, terrain: 'plains' },
      { coord: { col: 4, row: 2 }, terrain: 'hills' },
      { coord: { col: 7, row: 7 }, terrain: 'forest' },
    ],
  } as unknown as GameState;
}

const ctx = () => buildViewContext(null, makeState());
const beat = (o: Partial<StageMomentInput> = {}): StageMomentInput => ({ kind: 'story-beat', hasArt: false, hasCast: false, ...o });

describe('stage view model — lit-hex order', () => {
  it('the moment’s own hex comes first', () => {
    const r = resolveMomentHexes(ctx(), beat({ hex: { col: 7, row: 7 }, subjectAgentId: 'maren' }));
    expect(r).toEqual({ litHex: '7,7', litSource: 'beat', options: [], frame: ['7,7'] });
  });

  it('then the subject’s Location, a Place resolved up to its Location', () => {
    const r = resolveMomentHexes(ctx(), beat({ subjectAgentId: 'maren' }));
    expect(r.litHex).toBe('13,9');
    expect(r.litSource).toBe('agent_location');
  });

  it('then the ruin’s Location', () => {
    const r = resolveMomentHexes(ctx(), beat({ subjectAgentId: 'drifter', ruinId: 'ruin' }));
    expect(r.litHex).toBe('4,2');
    expect(r.litSource).toBe('ruin_location');
  });

  it('then nothing: no lit hex, nothing framed', () => {
    const r = resolveMomentHexes(ctx(), beat({ subjectAgentId: 'drifter' }));
    expect(r).toEqual({ litHex: null, litSource: null, options: [], frame: [] });
  });

  it('a non-finite own hex is ignored', () => {
    const r = resolveMomentHexes(ctx(), beat({ hex: { col: Number.NaN, row: 1 }, subjectAgentId: 'kael' }));
    expect(r.litSource).toBe('agent_location');
  });
});

describe('stage view model — layout', () => {
  it('compact with neither art nor cast; full with either', () => {
    expect(buildStageView(ctx(), beat()).layout).toBe('compact');
    expect(buildStageView(ctx(), beat({ hasArt: true })).layout).toBe('full');
    expect(buildStageView(ctx(), beat({ hasCast: true })).layout).toBe('full');
  });
});

describe('stage view model — place tag and context line', () => {
  it('names the lit hex by its Location, with the tag suffix', () => {
    const vm = buildStageView(ctx(), beat({ subjectAgentId: 'maren' }));
    expect(vm.place).toEqual({ ref: { kind: 'location', id: 'millbrook' }, name: 'Millbrook' });
    expect(vm.placeTag).toBe('Millbrook · where it is happening');
    expect(vm.placeTagSuffix).toBe(STAGE_WORDS.placeTagSuffix);
  });

  it('an undiscovered place is never named: the land is', () => {
    const vm = buildStageView(ctx(), beat({ subjectAgentId: 'drifter', ruinId: 'ruin' }));
    expect(vm.place?.ref).toEqual({ kind: 'hex', id: '4,2' });
    expect(vm.place?.name).not.toContain('Old Barrow');
    expect(vm.placeTag).toBe(`${vm.place?.name}${STAGE_WORDS.placeTagSuffix}`);
  });

  it('no lit hex: no place, no tag', () => {
    const vm = buildStageView(ctx(), beat({ subjectAgentId: 'drifter' }));
    expect(vm.place).toBeNull();
    expect(vm.placeTag).toBeNull();
  });

  it('the context line drops whatever slot it has no value for', () => {
    const subject = { ref: { kind: 'agent' as const, id: 'maren' }, name: 'Maren Ashfold' };
    const place = { ref: { kind: 'location' as const, id: 'millbrook' }, name: 'Millbrook' };
    expect(stageContextLine(subject, place)?.text).toBe('Maren Ashfold at Millbrook');
    expect(stageContextLine(subject, null)?.text).toBe('Maren Ashfold');
    expect(stageContextLine(null, place)?.text).toBe('At Millbrook');
    expect(stageContextLine(null, null)).toBeNull();
  });

  it('the built line names the subject and the place as links', () => {
    const vm = buildStageView(ctx(), beat({ subjectAgentId: 'maren' }));
    expect(vm.contextLine?.subject?.ref).toEqual({ kind: 'agent', id: 'maren' });
    expect(vm.contextLine?.place?.ref).toEqual({ kind: 'location', id: 'millbrook' });
  });

  it('takes the list’s palette', () => {
    expect(buildStageView(ctx(), beat()).palette).toBe('story');
  });
});

describe('stage view model — shared contract (THR-1822 § D17)', () => {
  it('is registered as `stage`', () => {
    expect(getViewSelector('stage')).toBe(stageViewSelector);
  });

  it('is serialisable and deterministic', () => {
    const a = buildStageView(ctx(), beat({ subjectAgentId: 'maren' }));
    const b = buildStageView(ctx(), beat({ subjectAgentId: 'maren' }));
    assertSerialisable(a);
    expect(a).toEqual(b);
  });

  it('no raw ids or numbers in display strings', () => {
    const vm = buildStageView(ctx(), beat({ subjectAgentId: 'maren' }));
    for (const s of [vm.placeTag, vm.contextLine?.text, vm.place?.name, vm.subject?.name]) {
      expect(s).toBeTruthy();
      expect(s).not.toMatch(/[a-z]+_[a-z]+/);
      expect(s).not.toMatch(/\d/);
    }
  });

  it('a missing subject falls back, and the fallback never throws', () => {
    const vm = buildStageView(ctx(), beat({ subjectAgentId: 'nobody' }));
    expect(vm.subject).toBeNull();
    const fb = fallbackStageView(beat({ hasArt: true }));
    expect(fb).toMatchObject({ litHex: null, place: null, layout: 'full', palette: 'story' });
    assertSerialisable(fb);
  });

  it('readView returns the selector’s fallback when the build throws', () => {
    const state = makeState();
    (state as unknown as { graph: unknown }).graph = { getOutgoingEdges: () => { throw new Error('boom'); }, getNode: () => undefined };
    const vm = readView(null, state, stageViewSelector, beat({ subjectAgentId: 'maren' }));
    expect(vm.litHex).toBeNull();
    expect(vm.layout).toBe('compact');
  });
});

describe('stage view model — review round 2', () => {
  it('a travelling mortal is lit where the map draws them, not at a stale located_at', () => {
    const state = makeState();
    state.graph.getNode('kael')!.properties.movementState = { currentHexPosition: { col: 7, row: 7 } };
    const r = resolveMomentHexes(buildViewContext(null, state), beat({ subjectAgentId: 'kael' }));
    expect(r.litHex).toBe('7,7');
    expect(r.litSource).toBe('agent_location');
  });

  it('names the Location the subject stands at, not the alphabetically first on the hex', () => {
    const state = makeState();
    state.graph.addNode({ id: 'ashford', type: 'location', name: 'Ashford', properties: { hexCol: 13, hexRow: 9 } });
    const vm = buildStageView(buildViewContext(null, state), beat({ subjectAgentId: 'maren' }));
    expect(vm.place?.name).toBe('Millbrook');
    expect(vm.contextLine?.text).toBe('Maren Ashfold at Millbrook');
  });
});
