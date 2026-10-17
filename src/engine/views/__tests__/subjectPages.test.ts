/**
 * THR-1876 S1 — the page-layout table, the subject dispatcher, Connections and *In this
 * land*, on a hand-built world shaped like the plan's chain:
 * The Bone Coast (Area) → Temple Quarter (Location) → the Shrine (Place) → Shutash (person)
 * → the Congregation (faction).
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { HexTile } from '../../../types';
import { WORLD_REF_KINDS, type WorldRef } from '../../../types/worldRef';
import { PAGE_SURFACES, sectionVisibleAt, type PageLayoutKind, type InspectorTabId } from '../../../types/detailPage';
import { DETAIL_PAGE_REGISTRY, PAGE_KIND_LABELS } from '../../../data/detailPageTemplates';
import { INSPECTOR_TAB_LABELS, CONNECTION_GROUP_ORDER, LAND_INDEX_EMPTY_LINES } from '../../../data/view-content';
import { composeSections } from '../../detailPageGenerator';
import { readView } from '../readView';
import { buildSubjectPage, subjectPageSelector } from '../subjects/subjectPage';
import { buildConnections } from '../connections';
import { hexContentsSelector } from '../hexContents';
import { buildLandIndex } from '../landIndex';
import { landNameFor } from '../subjects/landName';
import { assertSerialisable } from './viewContract';

const ASC = 'asc';

function tile(col: number, row: number, terrain: HexTile['terrain'], regionId?: string): HexTile {
  return { coord: { col, row }, terrain, elevation: 0.5, moisture: 0.5, regionId, dangerLevel: 0.4 } as unknown as HexTile;
}

function world(): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'coast', type: 'region', name: 'The Bone Coast', properties: {} });
  graph.addNode({ id: 'quarter', type: 'location', name: 'Temple Quarter', properties: { locationType: 'town', locationSubtype: 'temple_quarter', hexCol: 3, hexRow: 4 } });
  graph.addNode({ id: 'shrine', type: 'location', name: 'The Shrine', properties: { parentLocationId: 'quarter', sublocationTypeId: 'shrine', locationSubtype: 'shrine' } });
  graph.addNode({ id: 'crypt', type: 'location', name: 'The Hidden Crypt', properties: { parentLocationId: 'quarter', hidden: true } });
  graph.addEdge({ id: 'c1', source: 'quarter', target: 'shrine', type: 'contains', properties: {} });
  graph.addEdge({ id: 'c2', source: 'quarter', target: 'crypt', type: 'contains', properties: {} });
  graph.addNode({ id: 'shutash', type: 'actor', name: 'Shutash', properties: { actorType: 'individual', npcRole: 'priest', locationId: 'shrine' } });
  graph.addEdge({ id: 'at1', source: 'shutash', target: 'shrine', type: 'located_at', properties: {} });
  graph.addNode({ id: 'cong', type: 'actor', name: 'The Congregation of the Spheres', properties: { actorType: 'faction' } });
  graph.addEdge({ id: 'm1', source: 'shutash', target: 'cong', type: 'member_of', properties: { rank: 0.16 } });
  graph.addEdge({ id: 'hall1', source: 'cong', target: 'shrine', type: 'located_at', properties: { role: 'guild_hall' } });
  graph.addEdge({ id: 'ctl1', source: 'cong', target: 'quarter', type: 'controls', properties: { controlType: 'political' } });
  graph.addNode({ id: 'evt1', type: 'event', name: 'A Sermon', properties: { tick: 5, summary: 'Shutash preached.' } });
  graph.addEdge({ id: 'p1', source: 'shutash', target: 'evt1', type: 'participated_in', properties: { tick: 5, outcome: 'success' } });
  const state = {
    graph,
    ascendantId: ASC,
    tick: 12,
    seed: 42,
    tiles: [tile(3, 4, 'plateau', 'coast'), tile(4, 4, 'grassland', 'coast'), tile(9, 9, 'tundra')],
    recentEvents: [],
    familiarityMap: new Map(),
    essencePool: {},
    unifiedActions: [],
    encounterProgress: [],
    controlEffects: [],
    ascendantIdentity: { divineName: 'Vara', hungerName: 'Witness', sphereAlignment: { primary: 'mind', secondary: 'spirit' } },
  } as unknown as GameState;
  return state;
}

const textOf = (vm: unknown): string => JSON.stringify(vm);

describe('the page-layout table (THR-1876 § D6)', () => {
  const kinds = Object.keys(PAGE_KIND_LABELS) as PageLayoutKind[];

  it('every page kind has rows (a kind without an entry fails here, by name)', () => {
    for (const kind of kinds) {
      expect(DETAIL_PAGE_REGISTRY[kind]?.length ?? 0, `no rows for page kind "${kind}"`).toBeGreaterThan(0);
    }
    for (const kind of ['land', 'god', 'record', 'content'] as const) expect(kinds).toContain(kind);
  });

  it('every row names a known tab and known surfaces; typeIds are unique per kind', () => {
    for (const kind of kinds) {
      const seen = new Set<string>();
      for (const row of DETAIL_PAGE_REGISTRY[kind]) {
        expect(seen.has(row.typeId), `${kind}.${row.typeId} listed twice`).toBe(false);
        seen.add(row.typeId);
        if (row.tab) expect(INSPECTOR_TAB_LABELS[row.tab as InspectorTabId], `${kind}.${row.typeId} tab`).toBeTruthy();
        for (const s of row.visibleAt ?? []) expect(PAGE_SURFACES).toContain(s);
      }
    }
  });

  it('section labels are sentence case at the source — no all-caps label in any resolver', () => {
    const files = [
      'src/engine/detailPageResolvers.ts',
      'src/engine/contentPageResolvers.ts',
      'src/engine/views/subjects/pageResolvers.ts',
    ];
    const offenders: string[] = [];
    for (const f of files) {
      const text = fs.readFileSync(path.resolve(f), 'utf8');
      for (const m of text.matchAll(/label:\s*'([^']+)'/g)) {
        const label = m[1];
        if (/[A-Z]{2,}/.test(label) && label === label.toUpperCase()) offenders.push(`${f}: ${label}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('the composer copies each row\'s width and tab onto its section; surfaces filter by them', () => {
    const state = world();
    const sections = composeSections('actor', { nodeId: 'shutash', pageKind: 'actor', graph: state.graph, seed: 42, tick: 12, protagonistId: ASC, state });
    const portrait = sections.find(s => s.typeId === 'portrait_with_disposition')!;
    expect(portrait.tab).toBe('overview');
    const allegiances = sections.find(s => s.typeId === 'faction_allegiances');
    expect(allegiances?.visibleAt).toEqual(['hover']);
    expect(sectionVisibleAt(allegiances!, 'docked')).toBe(false);
    expect(sectionVisibleAt(allegiances!, 'hover')).toBe(true);
    expect(sectionVisibleAt({}, 'full')).toBe(true);
  });
});

describe('selectSubjectPage (THR-1822 § D7)', () => {
  it('dispatches every WorldRefKind and an event node, and every page is plain data', () => {
    const state = world();
    const ids: Record<string, string> = { agent: 'shutash', companion: 'shutash', faction: 'cong', location: 'quarter', sublocation: 'shrine', area: 'coast', hex: '3,4', artifact: 'nope', attachment: 'nope', army: 'nope', encounter: 'e1', journey: 'j1', receipt: 'r1' };
    for (const kind of WORLD_REF_KINDS) {
      const vm = buildSubjectPage(state, { kind, id: ids[kind] } as WorldRef);
      expect(vm.pageKind, kind).toBeTruthy();
      assertSerialisable(vm, `subject page ${kind}`);
    }
    expect(buildSubjectPage(state, { kind: 'event-node', id: 'evt1' }).pageKind).toBe('record');
  });

  it('a gone subject is the missing page, with unknownStub\'s words', () => {
    const vm = buildSubjectPage(world(), { kind: 'agent', id: 'gone' });
    expect(vm.pageKind).toBe('missing');
    expect(vm.header.name).toBe('Unknown');
    expect(vm.header.kindLabel).toBe('this entity is no longer in the world');
  });

  it('the person page: role word, where line, body from the table, Connections last', () => {
    const vm = buildSubjectPage(world(), { kind: 'agent', id: 'shutash' });
    expect(vm.pageKind).toBe('person');
    expect(vm.header.kindLabel).toBe('Priest');
    expect(vm.header.whereLine.map(r => r.name)).toEqual(['The Shrine', 'Temple Quarter', 'The Bone Coast', 'The plateau at Temple Quarter']);
    expect(vm.body.some(s => s.typeId === 'portrait_with_disposition')).toBe(true);
    expect(textOf(vm)).not.toContain('0.16');
  });

  it('the god\'s own sheet is the agent ref of the ascendant', () => {
    const vm = buildSubjectPage(world(), { kind: 'agent', id: ASC });
    expect(vm.pageKind).toBe('god');
    expect(vm.body.find(s => s.typeId === 'divine_nature')?.kind).toBe('prose');
  });

  it('the selector is registered and keys on the subject', () => {
    const state = world();
    const vm = readView(null, state, subjectPageSelector, { subject: { kind: 'faction', id: 'cong' } });
    expect(vm.pageKind).toBe('faction');
    expect(vm.header.opensWide).toBe(true);
  });
});

describe('Connections (THR-1822 § D8)', () => {
  it('groups follow CONNECTION_GROUP_ORDER and empty groups are omitted', () => {
    const state = world();
    for (const subject of [{ cls: 'person', id: 'shutash' }, { cls: 'location', id: 'quarter' }, { cls: 'faction', id: 'cong' }] as const) {
      const vm = buildConnections(state.graph, state, subject);
      const order = vm.groups.map(g => CONNECTION_GROUP_ORDER.indexOf(g.id));
      expect(order).toEqual([...order].sort((a, b) => a - b));
      for (const g of vm.groups) {
        expect(g.rows.length).toBeGreaterThan(0);
        expect(g.total).toBe(g.rows.length);
        expect(g.foldAfter).toBeGreaterThan(0);
      }
    }
  });

  it('the chain walks link by link: Bone Coast → Temple Quarter → the Shrine → Shutash → the Congregation', () => {
    const state = world();
    const open = (ref: WorldRef) => buildSubjectPage(state, ref);
    const linksOf = (vm: ReturnType<typeof open>) => vm.connections.groups.flatMap(g => g.rows.map(r => `${r.ref.kind}:${r.ref.id}`));
    const quarter = open({ kind: 'location', id: 'quarter' });
    expect(linksOf(quarter)).toContain('area:coast');
    expect(linksOf(quarter)).toContain('sublocation:shrine');
    const shrine = open({ kind: 'sublocation', id: 'shrine' });
    expect(linksOf(shrine)).toContain('agent:shutash');
    const shutash = open({ kind: 'agent', id: 'shutash' });
    const belongs = shutash.connections.groups.find(g => g.id === 'belongsTo');
    expect(belongs?.rows.map(r => r.ref.id)).toContain('cong');
    const cong = open({ kind: 'faction', id: 'cong' });
    expect(linksOf(cong)).toContain('agent:shutash');
  });

  it('a hidden Place is never a row', () => {
    const state = world();
    const vm = buildConnections(state.graph, state, { cls: 'location', id: 'quarter' });
    expect(textOf(vm)).not.toContain('Hidden Crypt');
  });
});

describe('In this land (THR-1822 § D9)', () => {
  it('People and Holder always render, with their empty lines on an empty hex', () => {
    const state = world();
    const contents = readView(null, state, hexContentsSelector, { hexKey: '9,9' });
    const vm = buildLandIndex(contents, state);
    expect(vm.rows.map(r => r.id)).toEqual(['people', 'holder']);
    expect(vm.rows[0].emptyLine).toBe(LAND_INDEX_EMPTY_LINES.people);
    expect(vm.rows[1].emptyLine).toBe(LAND_INDEX_EMPTY_LINES.holder);
  });

  it('the when-present rows are absent when empty and present when filled', () => {
    const state = world();
    const vm = buildLandIndex(readView(null, state, hexContentsSelector, { hexKey: '3,4' }), state);
    expect(vm.rows.find(r => r.id === 'people')?.rows.map(r => r.name)).toEqual(['Shutash']);
    expect(vm.rows.find(r => r.id === 'holder')?.rows.map(r => r.ref.id)).toEqual(['cong']);
    expect(vm.rows.find(r => r.id === 'halls')?.rows.map(r => r.ref.id)).toEqual(['cong']);
    expect(vm.rows.find(r => r.id === 'lair')).toBeUndefined();
    expect(vm.rows.find(r => r.id === 'ruins')).toBeUndefined();
  });

  it('discovered sites appear when hexRevelation holds them', () => {
    const state = world();
    (state as { hexRevelation?: unknown }).hexRevelation = { '3,4': { ruins: true } };
    const vm = buildLandIndex(readView(null, state, hexContentsSelector, { hexKey: '3,4' }), state);
    expect(vm.rows.find(r => r.id === 'ruins')?.rows.map(r => r.name)).toEqual(['The Shrine']);
  });
});

describe('the land page (THR-1876 § D7.3)', () => {
  it('the naming rule holds with a Location and with only an Area', () => {
    const state = world();
    expect(landNameFor(state, 3, 4)).toBe('The plateau at Temple Quarter');
    expect(landNameFor(state, 4, 4)).toBe('The Bone Coast');
    expect(landNameFor(state, 9, 9)).toBe('Open tundra');
  });

  it('a hex opens the land page: lede, danger and holder chips, In this land, Around it', () => {
    const vm = buildSubjectPage(world(), { kind: 'hex', id: '4,4' });
    expect(vm.pageKind).toBe('land');
    if (vm.pageKind !== 'land') return;
    expect(vm.header.name).toBe('The Bone Coast');
    expect(vm.header.lede).toBeTruthy();
    expect(vm.header.standing.map(c => c.label)).toEqual(['Uneasy country', 'Held by no one']);
    expect(vm.inThisLand.rows[0].id).toBe('people');
    expect(vm.connections.title).toBe('Around it');
    expect(vm.connections.groups[0].rows.map(r => r.name)).toContain('Temple Quarter');
    expect(vm.body.map(s => s.typeId)).toContain('the_land');
  });
});
