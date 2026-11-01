/**
 * THR-2098 — the art-led dressing on every other Inspector page (plan
 * `Docs/plans/2026-10-31-thr-2098-art-led-inspector-pages.md`): place landscape, row icons
 * (or the no-idea list), the fifteen strips as sentences and chips, the relic galleries, the
 * one highlight per page, and no numeral beyond the two named exemptions.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { PageLayoutKind, Section } from '../../../types/detailPage';
import { DETAIL_PAGE_REGISTRY, NO_IDEA_ROWS } from '../../../data/detailPageTemplates';
import { ICON_REGISTRY } from '../../../data/icons/iconRegistry';
import { composeSections } from '../../detailPageGenerator';
import { buildSubjectPage, placeArt } from '../subjects/subjectPage';
import { fillClause, sentenceSection } from '../subjects/sentenceRows';
import { joinFaction } from '../../factionMembership';
import { applyFactionReputationGain } from '../../factionReputation';

const ASC = 'asc';

function world(opts: { tiles?: boolean } = {}): GameState {
  const { tiles = true } = opts;
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'town', type: 'location', name: 'Ashford', properties: { locationSubtype: 'town', hexCol: 1, hexRow: 1 } });
  graph.addNode({ id: 'ruin', type: 'location', name: 'the Sunken Abbey', properties: { locationSubtype: 'ruin', hexCol: 2, hexRow: 1 } });
  graph.addNode({
    id: 'pop', type: 'location', name: 'The Weeping Stone',
    properties: { locationSubtype: 'place_of_power', hexCol: 2, hexRow: 2, popSphere: 'time', popEssencePerTick: 1, popStreamDecayCountdown: 200, transformedFromRuinId: 'ruin' },
  });
  graph.addNode({ id: 'aldric', type: 'actor', name: 'Aldric Vane', properties: { actorType: 'individual' } });
  graph.addEdge({ id: 'h1', source: 'aldric', target: 'pop', type: 'holds_place_of_power', properties: { holderType: 'actor', corruptMark: true } });
  graph.addNode({ id: 'area', type: 'region', name: 'Loremead', properties: { hexCount: 150 } });
  graph.addNode({
    id: 'guild', type: 'actor', name: 'Ironhold',
    properties: { actorType: 'faction', wealth: 50 },
  });
  graph.addNode({ id: 'blade', type: 'artifact', name: 'Oathblade', properties: { category: 'weapon', subcategory: 'arms' } });
  graph.addNode({ id: 'cup', type: 'artifact', name: 'Grey Chalice', properties: {} });
  graph.addEdge({ id: 'p1', source: 'guild', target: 'blade', type: 'possesses', properties: {} });
  graph.addEdge({ id: 'l1', source: 'cup', target: 'town', type: 'lies_at', properties: {} });
  graph.addNode({ id: 'evt', type: 'event', name: 'The Bells', properties: { callbackPhrase: 'when the bells rang twice at Harrowgate' } });
  return {
    graph,
    ascendantId: ASC,
    tick: 400,
    seed: 42,
    tiles: tiles
      ? [
          { coord: { col: 1, row: 1 }, terrain: 'grassland', regionId: 'area', dangerLevel: 0.1 },
          { coord: { col: 2, row: 2 }, terrain: 'hills', regionId: 'area', dangerLevel: 0.1 },
        ]
      : [],
    recentEvents: [],
    familiarityMap: new Map(),
    essencePool: {},
    unifiedActions: [],
    encounterProgress: [],
    controlEffects: [],
    chapterArchive: [],
    strategicState: { projects: [], controls: [], history: [] },
    ascendantIdentity: { divineName: 'Vara', hungerName: 'Witness', sphereAlignment: { primary: 'mind', secondary: 'spirit' } },
    mandateDefinition: {
      name: 'Dominion of Stone',
      description: 'Hold the land.',
      stages: [{ description: 'Seize control of 2 settlements.' }, { description: 'b' }, { description: 'c' }],
    },
    mandateState: { currentStage: 'setup', progress: 0.3, primaryDelta: 0.05 },
  } as unknown as GameState;
}

function sections(kind: PageLayoutKind, id: string, state: GameState = world()): Section[] {
  return composeSections(kind, { nodeId: id, pageKind: kind, graph: state.graph, seed: state.seed, tick: state.tick, protagonistId: ASC, state });
}

function byId(list: Section[]): Map<string, Section> {
  return new Map(list.map(s => [s.typeId, s]));
}

function proseOf(s: Section | undefined): string {
  return s && s.kind === 'prose' ? s.prose : '';
}

describe('R1 — a place leads with its landscape (THR-2098 decision 1)', () => {
  it('a town with a tile hands its terrain to the header; without one, nothing', () => {
    expect(placeArt(world(), world().graph.getNode('town')!)).toEqual({ terrain: 'grassland' });
    expect(placeArt(world({ tiles: false }), world().graph.getNode('town')!)).toEqual({});
    const page = buildSubjectPage(world(), { kind: 'location', id: 'town', name: 'Ashford' });
    expect(page.header.visual.terrain).toBe('grassland');
    // A lair's own art wins, as on the land page.
    const lair = world();
    lair.graph.getNode('town')!.properties.locationSubtype = 'lair';
    expect(placeArt(lair, lair.graph.getNode('town')!).src).toMatch(/lair/);
  });
});

describe('R2 — every non-person heading draws its idea or is on the pick list', () => {
  it('walks the registry: each Inspector row sets a registry idea, or is in NO_IDEA_ROWS', () => {
    for (const [kind, rows] of Object.entries(DETAIL_PAGE_REGISTRY) as [PageLayoutKind, typeof DETAIL_PAGE_REGISTRY.actor][]) {
      if (kind === 'actor') continue;
      const noIdea = NO_IDEA_ROWS[kind];
      for (const row of rows) {
        // A hover-only row is the hover card's, not an Inspector heading.
        if (row.visibleAt && row.visibleAt.every(s => s === 'hover')) continue;
        if (row.icon) expect(row.icon in ICON_REGISTRY && row.icon !== 'fallback', `${kind}.${row.typeId}`).toBe(true);
        else expect(noIdea.includes(row.typeId), `${kind}.${row.typeId} has no icon and is not on the pick list`).toBe(true);
      }
      // The pick list names only rows that exist and draw no icon.
      for (const typeId of noIdea) expect(rows.find(r => r.typeId === typeId && !r.icon), `${kind}.${typeId}`).toBeDefined();
    }
  });

  it('place prose draws the page\'s own idea', () => {
    const prose = byId(sections('place', 'town')).get('place_prose');
    if (prose) expect(prose.icon).toBe('place');
  });
});

describe('R5–R7 — no Overview strip on these kinds (Law 16)', () => {
  it('none of the fifteen rows returns a panel', () => {
    const all = [
      ...sections('place', 'town'), ...sections('place', 'pop'), ...sections('place', 'area'),
      ...sections('faction', 'guild'), ...sections('god', ASC), ...sections('event', 'evt'),
    ];
    const fifteen = new Set(['standing', 'place_of_power', 'area_facts', 'agenda', 'means', 'strongest_reaches', 'ranks', 'reputations_they_hold', 'effect', 'duration', 'essence', 'mandate', 'signatures', 'reaches', 'how_it_invokes_now']);
    for (const s of all) if (fifteen.has(s.typeId)) expect(s.kind, s.typeId).not.toBe('panel');
  });

  it('the place of power reads as sentences, each name a link', () => {
    const pop = byId(sections('place', 'pop')).get('place_of_power');
    expect(proseOf(pop)).toMatch(/^Aldric Vane holds it\. Its stream runs a [a-z ]+ of time, fading [^.]+\. Its power came from the Sunken Abbey\. The god siphons a share\.$/);
    const parts = pop && pop.kind === 'prose' ? pop.parts ?? [] : [];
    expect(parts.some(p => typeof p !== 'string' && p.ref?.id === 'aldric')).toBe(true);
    expect(parts.some(p => typeof p !== 'string' && p.tooltipId === 'sphere.time')).toBe(true);
    // A ruin transformed in place names a fallen ruin, never links to its own page.
    const inPlace = world();
    inPlace.graph.getNode('pop')!.properties.transformedFromRuinId = 'pop';
    const own = byId(sections('place', 'pop', inPlace)).get('place_of_power');
    expect(proseOf(own)).toContain('Its power came from a fallen ruin.');
    expect((own && own.kind === 'prose' ? own.parts ?? [] : []).some(p => typeof p !== 'string' && p.ref?.id === 'pop')).toBe(false);
  });

  it('the area facts are one sentence; its spheres a chips row', () => {
    const s = byId(sections('place', 'area'));
    expect(proseOf(s.get('area_facts'))).toBe('Boundless lands, settled country.');
  });

  it('a faction\'s means, reputations and the quiet line', () => {
    const s = byId(sections('faction', 'guild'));
    expect(proseOf(s.get('means'))).toMatch(/^They (live in comfort|get by|are wealthy|have nothing|are rich beyond counting)\.$/);
    // No members yet → the quiet line.
    expect(proseOf(s.get('reputations_they_hold'))).toBe('They hold no one in regard yet.');
  });

  it('a faction holds its members in regard: most-regarded first, worded, linked (THR-2111)', () => {
    // Built with the real writers (join + reputation gain), not a hand-made property:
    // the old `faction.properties.reputations` read had none, so live pages were always quiet.
    const state = world();
    const g = state.graph;
    g.addNode({ id: 'mira', type: 'actor', name: 'Mira Hollow', properties: { actorType: 'individual' } });
    expect(joinFaction(g, 'mira', 'guild', 1).changed).toBe(true);
    expect(joinFaction(g, 'aldric', 'guild', 1).changed).toBe(true);
    applyFactionReputationGain(g, 'aldric', 'guild', 1, 2, 'encounter_aftermath');
    applyFactionReputationGain(g, 'mira', 'guild', -1, 2, 'encounter_aftermath');
    const reps = byId(sections('faction', 'guild', state)).get('reputations_they_hold');
    expect(reps?.kind).toBe('chips');
    expect(reps && reps.kind === 'chips' ? reps.chips : []).toEqual([
      { label: 'Aldric Vane', flavour: 'revered', sentiment: 'positive', clickRef: { nodeId: 'aldric', pageKind: 'actor' } },
      { label: 'Mira Hollow', flavour: 'distrusted', sentiment: 'negative', clickRef: { nodeId: 'mira', pageKind: 'actor' } },
    ]);
    // A 'retain' death keeps the member_of edge; the dead are not held in regard.
    g.getNode('aldric')!.properties.deceased = true;
    const after = byId(sections('faction', 'guild', state)).get('reputations_they_hold');
    expect(after && after.kind === 'chips' ? after.chips.map(c => c.label) : []).toEqual(['Mira Hollow']);
  });

  it('an event\'s callback is prose, with no "Then" label', () => {
    expect(proseOf(byId(sections('event', 'evt')).get('how_it_invokes_now'))).toBe('When the bells rang twice at Harrowgate.');
  });

  it('a clause with a missing word drops; zero clauses hide the row', () => {
    expect(fillClause('Here you are {band}.', { band: '' })).toBeNull();
    expect(sentenceSection('x', 'X', [null, fillClause('{a}.', {})], 'test')).toBeNull();
  });
});

describe('R3 — relic galleries in the aside', () => {
  it('a place with relics lying at it, and a faction holding one, draw the gallery', () => {
    const here = byId(sections('place', 'town')).get('relics_here');
    expect(here?.kind).toBe('cards');
    expect(here?.placement).toBe('aside');
    expect(here?.label).toBe('Relics here · 1');
    const held = byId(sections('faction', 'guild')).get('relics_held');
    expect(held?.label).toBe('Relics they hold · 1');
    const tile = held && held.kind === 'cards' ? held.tiles[0] : undefined;
    expect(tile?.ref).toEqual({ kind: 'artifact', id: 'blade', name: 'Oathblade' });
    expect(tile?.image?.src).toBeTruthy();
  });

  it('no relics → no gallery', () => {
    expect(byId(sections('place', 'pop')).get('relics_here')).toBeUndefined();
  });
});

describe('R5 — one highlight per page', () => {
  it('the god page\'s only highlight is the Mandate; the faction page\'s is How they hold her', () => {
    const god = sections('god', ASC).filter(s => s.kind === 'prose' && s.highlight);
    expect(god.map(s => s.typeId)).toEqual(['mandate']);
    const mandate = god[0];
    expect(mandate.kind === 'prose' ? mandate.highlight?.headline : '').toBe('Dominion of Stone');
    expect(proseOf(mandate)).toBe('Rising. Seize control of 2 settlements.');
    const faction = sections('faction', 'guild').filter(s => s.kind === 'prose' && s.highlight);
    expect(faction.map(s => s.typeId)).toEqual(['how_they_hold_her']);
  });
});

/** Player-facing strings of a section — every string leaf except ids, refs and tooltip ids. */
function playerText(section: Section): string[] {
  const out: string[] = [];
  const skip = new Set(['typeId', 'source', 'tab', 'visibleAt', 'ref', 'clickRef', 'eventRef', 'tooltipId', 'labelTooltipId', 'sphere', 'tier', 'kind', 'dataKey', 'termRefs', 'layers', 'icon', 'placement', 'src', 'id', 'image']);
  const walk = (v: unknown, key: string) => {
    if (skip.has(key)) return;
    if (typeof v === 'string') out.push(v);
    else if (Array.isArray(v)) v.forEach(x => walk(x, ''));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  walk(section, '');
  return out;
}

/**
 * The two named numeral exemptions (plan § Done when): the gallery count labels, after slice
 * 1's "What they carry · 4"; and the Mandate's authored objective line, a goal not a readout.
 */
const NUMERAL_EXEMPT: ReadonlySet<string> = new Set(['relics_here', 'relics_held', 'mandate']);

describe('no numeral on these pages (Law 13), beyond the two exemptions', () => {
  it('prints no digit outside the gallery labels and the Mandate objective', () => {
    const all = [
      ...sections('place', 'town'), ...sections('place', 'pop'), ...sections('place', 'area'),
      ...sections('faction', 'guild'), ...sections('god', ASC), ...sections('event', 'evt'),
    ];
    for (const s of all) {
      if (NUMERAL_EXEMPT.has(s.typeId)) continue;
      for (const text of playerText(s)) expect(text, `${s.typeId}: "${text}"`).not.toMatch(/\d/);
    }
  });
});
