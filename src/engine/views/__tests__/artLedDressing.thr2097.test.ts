/**
 * THR-2097 — the art-led dressing on the person page (plan
 * `Docs/plans/2026-10-31-art-led-ui-pass.md` § Slice 1): the who-they-are sentence, the
 * bond strip's gate, the Your First badge, row icons, the aside gallery and the pole bars.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { ProseSection, Section } from '../../../types/detailPage';
import { DETAIL_PAGE_REGISTRY } from '../../../data/detailPageTemplates';
import { INSPECTOR_TAB_ICONS } from '../../../data/view-content';
import { ICON_REGISTRY } from '../../../data/icons/iconRegistry';
import { composeSections } from '../../detailPageGenerator';
import { buildSubjectPage } from '../subjects/subjectPage';
import { composeWhoTheyAre } from '../subjects/personRows';

const ASC = 'asc';

function world(opts: { threaded?: boolean; first?: boolean } = {}): GameState {
  const { threaded = true, first = true } = opts;
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'town', type: 'location', name: 'Ashford', properties: { locationSubtype: 'town', hexCol: 2, hexRow: 2 } });
  graph.addNode({ id: 'kael', type: 'actor', name: 'Kael', properties: { actorType: 'individual', npcRole: 'smith', wealth: 30 } });
  graph.addEdge({ id: 'at1', source: 'kael', target: 'town', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'rel1', source: 'kael', target: ASC, type: 'relates_to', properties: { basis: 'thread', sentiment: 0.6 } });
  if (threaded) graph.addEdge({ id: 'th1', source: ASC, target: 'kael', type: 'thread', properties: { tier: 2, ...(first ? { courtPosition: 'the_first' } : {}) } });
  return {
    graph,
    ascendantId: ASC,
    tick: 400,
    seed: 42,
    tiles: [],
    recentEvents: [],
    familiarityMap: new Map([['kael', 0.9]]),
    essencePool: {},
    unifiedActions: [],
    encounterProgress: [],
    controlEffects: [],
    chapterArchive: [],
    strategicState: { projects: [], controls: [], history: [] },
    ascendantIdentity: { divineName: 'Vara', hungerName: 'Witness', sphereAlignment: { primary: 'mind', secondary: 'spirit' } },
  } as unknown as GameState;
}

function sections(state: GameState): Section[] {
  return composeSections('actor', { nodeId: 'kael', pageKind: 'actor', graph: state.graph, seed: state.seed, tick: state.tick, protagonistId: ASC, state });
}

describe('composeWhoTheyAre (THR-2097 § S1.7)', () => {
  it('tells every fact as one sentence, each fact a term', () => {
    const out = composeWhoTheyAre({
      archetype: { word: 'True Believer', tooltipId: 'archetype.true_believer' },
      trade: { word: 'Shrine-keeper', tooltipId: 'ui.trade' },
      calling: { word: 'Zealot', tooltipId: 'ui.calling' },
      means: 'Getting by',
      godMark: { name: 'Heartfire', line: 'Their resolve holds where others break.' },
    }, 'Kael');
    expect(out?.text).toBe('A true believer who works as a shrine-keeper, and a zealot by calling. Kael gets by. Your mark is on them: Heartfire — their resolve holds where others break.');
    const terms = out?.parts.filter(p => typeof p !== 'string') ?? [];
    expect(terms.map(t => (typeof t === 'string' ? '' : t.tooltipId))).toEqual(['archetype.true_believer', 'ui.trade', 'ui.calling', undefined]);
  });

  it('opens on the name when there is no archetype, and drops what is missing', () => {
    expect(composeWhoTheyAre({ trade: { word: 'Smith' } }, 'Kael')?.text).toBe('Kael works as a smith.');
    expect(composeWhoTheyAre({ calling: { word: 'Explorer' } }, 'Kael')?.text).toBe('Kael is an explorer by calling.');
    expect(composeWhoTheyAre({ means: 'Wealthy' }, 'Kael')?.text).toBe('Kael is wealthy.');
  });

  it('links a place it knows the way to, and returns null with no facts', () => {
    const out = composeWhoTheyAre({ knows: [{ id: 'loc_1', name: 'Oreblack Deep', lead: 'a rumour' }] }, 'Kael');
    expect(out?.text).toBe('Kael knows the way to Oreblack Deep — a rumour.');
    expect(out?.parts.some(p => typeof p !== 'string' && p.ref?.id === 'loc_1')).toBe(true);
    expect(composeWhoTheyAre({}, 'Kael')).toBeNull();
    expect(composeWhoTheyAre({ trade: { word: '  ' } }, 'Kael')).toBeNull();
  });
});

describe('the person page dressing (THR-2097)', () => {
  it('the bond strip draws for a person threaded to the god', () => {
    const bond = sections(world()).find(s => s.typeId === 'what_she_is_to_him') as ProseSection | undefined;
    expect(bond?.tab).toBe('overview');
    expect(bond?.bond?.left.name).toBe('Vara');
    expect(bond?.bond?.right.id).toBe('kael');
  });

  it('an unthreaded person gets the sentence but no strip', () => {
    const bond = sections(world({ threaded: false })).find(s => s.typeId === 'what_she_is_to_him') as ProseSection | undefined;
    expect(bond?.kind).toBe('prose');
    expect(bond?.bond).toBeUndefined();
  });

  it('The First carries the badge VM; anyone else does not', () => {
    expect(buildSubjectPage(world(), { kind: 'agent', id: 'kael', name: 'Kael' }).header.firstOf?.godName).toBe('Vara');
    expect(buildSubjectPage(world({ first: false }), { kind: 'agent', id: 'kael', name: 'Kael' }).header.firstOf).toBeUndefined();
  });

  it('where chips carry their place idea', () => {
    const where = buildSubjectPage(world(), { kind: 'agent', id: 'kael', name: 'Kael' }).header.whereLine;
    expect(where[0]?.icon).toBe('place-town');
  });

  it('every icon a person row or tab names is a registry idea, and the gallery sits in the aside', () => {
    for (const row of DETAIL_PAGE_REGISTRY.actor) {
      if (row.icon) expect(row.icon in ICON_REGISTRY, row.typeId).toBe(true);
    }
    for (const icon of Object.values(INSPECTOR_TAB_ICONS)) expect(icon in ICON_REGISTRY).toBe(true);
    expect(DETAIL_PAGE_REGISTRY.actor.find(r => r.typeId === 'slots')?.placement).toBe('aside');
  });

  it('Who they are is a sentence, not label-and-value rows (Law 16)', () => {
    const who = sections(world()).find(s => s.typeId === 'who_they_are');
    expect(who?.kind).toBe('prose');
    expect(who?.icon).toBe('person');
  });
});
