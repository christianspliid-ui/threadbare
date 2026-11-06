/**
 * THR-2184 — "While you were away": the warm arrival recap selector
 * (plan `Docs/plans/2026-11-06-thr-2173-while-you-were-away.md` § Done when).
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { ChapterRecord } from '../../../types/chapterRecord';
import type { DominionBand } from '../../../data/dominion-content';
import { DOMINION_LEDGER_KEY } from '../../phaseDominion';
import { ENCOUNTER_TEMPLATES } from '../../../data/encounter-content';
import { isRoutineTemplate } from '../../attentionCadence';
import { getChapterTemplateName } from '../../chapterArchive';
import {
  buildWarmRecap as buildLive,
  snapshotWarmRecap as snapshotLive,
  readWarmRecapBands,
  warmRecapLineText,
  WARM_RECAP_MAX_LINES,
  type WarmRecapSnapshot,
} from '../warmRecap';

const ASC = 'asc';
const FIRST = 'kael';
const START = 100;
const PLACES = { p1: 'Ashford', p2: 'Iron Glade', p3: 'Mere Hollow', p4: 'Oakrest', p5: 'Thornwick' } as const;

/** Tests set bands on the ledger and read them back through the reader seam. */
const ledgerBands = (s: GameState) => ({ ...(s.graph.getNode(ASC)?.properties[DOMINION_LEDGER_KEY] as { bands?: Record<string, DominionBand> } | undefined)?.bands });
const snapshotWarmRecap = (s: GameState, firstId: string | null) => snapshotLive(s, firstId, { readBands: ledgerBands });
const buildWarmRecap = (s: GameState, before: WarmRecapSnapshot) => buildLive(s, before, { readBands: ledgerBands });

const STORY_TEMPLATE = ENCOUNTER_TEMPLATES.find(t => !isRoutineTemplate(t.id))!;

function world(bands: Record<string, DominionBand> = {}): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant', [DOMINION_LEDGER_KEY]: { bands } } });
  graph.addNode({ id: FIRST, type: 'actor', name: 'Kael', properties: { actorType: 'individual' } });
  for (const [id, name] of Object.entries(PLACES)) {
    graph.addNode({ id, type: 'location', name, properties: { locationSubtype: 'town' } });
  }
  return {
    graph,
    ascendantId: ASC,
    tick: START,
    seed: 42,
    recentEvents: [],
    unifiedActions: [],
    chapterArchive: [],
  } as unknown as GameState;
}

function setBands(state: GameState, bands: Record<string, DominionBand>): void {
  state.graph.updateNode(ASC, { properties: { [DOMINION_LEDGER_KEY]: { bands } } });
}

let n = 0;
function chapter(over: Partial<ChapterRecord>): ChapterRecord {
  n += 1;
  return {
    actionId: `a${n}`,
    templateId: STORY_TEMPLATE.id,
    templateName: `Chapter ${n}`,
    actorId: FIRST,
    actorName: 'Kael',
    targetId: 'p1',
    targetName: 'Ashford',
    scale: 'personal',
    startTick: START + 1,
    resolvedTick: START + 10,
    resolved: true,
    outcome: 'success',
    threaded: true,
    participants: [],
    openingProse: '',
    steps: [],
    ...over,
  } as ChapterRecord;
}

function texts(state: GameState, before: WarmRecapSnapshot): string[] {
  return buildWarmRecap(state, before).lines.map(warmRecapLineText);
}

describe('buildWarmRecap (THR-2184)', () => {
  it("names The First's finished chapters newest first, capped at two plus a 'more' line", () => {
    const state = world();
    const before = snapshotWarmRecap(state, FIRST);
    state.chapterArchive = [
      chapter({ templateName: 'Old Road', resolvedTick: START + 5 }),
      chapter({ templateName: 'Bridge Toll', resolvedTick: START + 50, outcome: 'success_at_cost' }),
      chapter({ templateName: 'Gallows Pardon', resolvedTick: START + 30, outcome: 'failure' }),
      chapter({ templateName: 'Before Window', resolvedTick: START - 1 }),
      chapter({ templateName: 'A Chore', resolvedTick: START + 40, routine: true }),
      chapter({ templateName: 'Not Theirs', resolvedTick: START + 60, actorId: 'other', actorName: 'Mira' }),
    ] as unknown as GameState['chapterArchive'];
    const vm = buildWarmRecap(state, before);
    const lines = vm.lines.map(warmRecapLineText);
    expect(vm.lines.map(l => l.kind)).toEqual(['first_finished', 'first_finished', 'first_more']);
    expect(lines[0]).toMatch(/^Kael .*Bridge Toll.*\.$/);
    expect(lines[1]).toMatch(/^Kael .*Gallows Pardon.*\.$/);
    expect(lines[2]).toBe('Kael finished one more chapter.');
    expect(vm.ledgerKey).toBe(state.chapterArchive![1].actionId);
    // The First is a link; an archived chapter that left `unifiedActions` is plain text.
    expect(vm.lines[0].segments[0].ref).toEqual({ kind: 'agent', id: FIRST, name: 'Kael' });
    expect(vm.lines[0].segments.find(s => s.text === 'Bridge Toll')?.ref).toBeUndefined();
  });

  it("counts more chapters in words", () => {
    const state = world();
    const before = snapshotWarmRecap(state, FIRST);
    state.chapterArchive = [1, 2, 3, 4, 5].map(i => chapter({ resolvedTick: START + i })) as unknown as GameState['chapterArchive'];
    expect(texts(state, before)).toContain('Kael finished three more chapters.');
  });

  it("says what The First is in the middle of, and opens the Ledger there when nothing finished", () => {
    const state = world();
    const before = snapshotWarmRecap(state, FIRST);
    state.unifiedActions = [
      { actionId: 'live1', actorId: FIRST, templateId: STORY_TEMPLATE.id, targetId: 'p1', startTick: START + 3, resolved: false },
    ] as unknown as GameState['unifiedActions'];
    const vm = buildWarmRecap(state, before);
    const name = getChapterTemplateName(STORY_TEMPLATE.id);
    expect(vm.lines.map(warmRecapLineText)).toEqual([`Kael is in the middle of ${name}.`]);
    expect(vm.lines[0].kind).toBe('first_now');
    expect(vm.lines[0].segments.find(s => s.text === name)?.ref).toEqual({ kind: 'encounter', id: 'live1', name });
    expect(vm.ledgerKey).toBe('live1');
  });

  it('names one slipped place with both band words as hover terms', () => {
    const state = world({ p2: 'held', p1: 'foreign' });
    const before = snapshotWarmRecap(state, FIRST);
    setBands(state, { p2: 'touched', p1: 'hostile' });
    const vm = buildWarmRecap(state, before);
    expect(vm.lines.map(warmRecapLineText)).toEqual(['Iron Glade slipped from Held to Touched.']);
    const segs = vm.lines[0].segments;
    expect(segs[0].ref).toEqual({ kind: 'location', id: 'p2', name: 'Iron Glade' });
    expect(segs.filter(s => s.tooltipId).map(s => s.tooltipId)).toEqual(['ui.dominion.held', 'ui.dominion.touched']);
  });

  it('folds many slipped places into one line, three names then "and others"', () => {
    const state = world({ p1: 'held', p2: 'held', p3: 'touched', p4: 'sovereign' });
    const before = snapshotWarmRecap(state, FIRST);
    setBands(state, { p1: 'touched', p2: 'foreign', p3: 'foreign', p4: 'held' });
    expect(texts(state, before)).toEqual(['Four of your places slipped: Ashford, Iron Glade, Mere Hollow and others.']);
    setBands(state, { p1: 'touched', p2: 'foreign', p3: 'touched', p4: 'sovereign' });
    expect(texts(state, before)).toEqual(['Two of your places slipped: Ashford and Iron Glade.']);
  });

  it('names grown places only when they reach Held or Sovereign', () => {
    const state = world({ p1: 'touched', p2: 'foreign', p3: 'held' });
    const before = snapshotWarmRecap(state, FIRST);
    setBands(state, { p1: 'held', p2: 'touched', p3: 'held' });
    expect(texts(state, before)).toEqual(['Ashford is Held now.']);
    setBands(state, { p1: 'held', p2: 'held', p3: 'sovereign' });
    expect(texts(state, before)).toEqual(['Ashford, Iron Glade and Mere Hollow are more yours now.']);
  });

  it('keeps by priority at the cap and shows in story order', () => {
    const state = world({ p1: 'held', p2: 'touched' });
    const before = snapshotWarmRecap(state, FIRST);
    setBands(state, { p1: 'touched', p2: 'held' });
    state.chapterArchive = [1, 2, 3].map(i => chapter({ templateName: `C${i}`, resolvedTick: START + i })) as unknown as GameState['chapterArchive'];
    state.unifiedActions = [
      { actionId: 'live1', actorId: FIRST, templateId: STORY_TEMPLATE.id, targetId: 'p1', startTick: START + 4, resolved: false },
    ] as unknown as GameState['unifiedActions'];
    const vm = buildWarmRecap(state, before);
    expect(vm.lines).toHaveLength(WARM_RECAP_MAX_LINES);
    expect(vm.lines.map(l => l.kind)).toEqual(['first_finished', 'first_finished', 'first_now', 'slipped', 'grew']);
    expect(vm.cut).toEqual(['first_more']);
  });

  it('says nothing changed when nothing did', () => {
    const state = world({ p1: 'held' });
    const before = snapshotWarmRecap(state, FIRST);
    const vm = buildWarmRecap(state, before);
    expect(vm.lines.map(l => l.kind)).toEqual(['empty']);
    expect(warmRecapLineText(vm.lines[0])).toBe('Nothing in your story changed while you were away.');
    expect(vm.ledgerKey).toBeNull();
  });

  it('with no First, gives place lines only', () => {
    const state = world({ p1: 'held' });
    const before = snapshotWarmRecap(state, null);
    state.chapterArchive = [chapter({})] as unknown as GameState['chapterArchive'];
    setBands(state, { p1: 'touched' });
    expect(texts(state, before)).toEqual(['Ashford slipped from Held to Touched.']);
  });

  it('with the snapshot missing (no bands), gives chapter lines only', () => {
    const state = world({ p1: 'held' });
    setBands(state, { p1: 'touched' });
    state.chapterArchive = [chapter({ templateName: 'Bridge Toll' })] as unknown as GameState['chapterArchive'];
    const lines = texts(state, { startTick: START, firstId: FIRST, bands: {} });
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/Bridge Toll/);
  });

  it('never names a rival behind a slipped place', () => {
    const state = world({ p1: 'held' });
    const before = snapshotWarmRecap(state, FIRST);
    state.graph.updateNode(ASC, { properties: { [DOMINION_LEDGER_KEY]: { bands: { p1: 'touched' }, rivals: { p1: 'rival-x' } } } });
    expect(texts(state, before).join(' ')).not.toMatch(/rival/i);
  });

  // Review gate, THR-2184: the ledger is only written inside a tick, so before a warm-up's
  // first tick it is empty. The live reader must still give every place a band.
  it('reads every place live when the dominion ledger has never been written', () => {
    const state = world();
    state.graph.updateNode(ASC, { properties: { [DOMINION_LEDGER_KEY]: undefined } });
    const bands = readWarmRecapBands(state);
    expect(Object.keys(bands).sort()).toEqual(Object.keys(PLACES).sort());
    expect(snapshotLive(state, FIRST).bands).toEqual(bands);
  });
});
