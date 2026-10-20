/**
 * THR-1915 (Inspector plan § D11, THR-1822 § D10) — Find.
 *
 * 1. Leak test (a Done-when): no entry carries an unseen thing, and a query matching only
 *    unseen names returns the very same result as a nonsense string.
 * 2. Ranking: whole name > word start > inside a word; then yours; then recent; then name.
 * 3. Accent-insensitive matching.
 * 4. The empty box: Recent and Your people; groups and the "Show all N" cap.
 */
import { describe, it, expect } from 'vitest';
import { WorldGraph } from '../../graph';
import type { GameState } from '../../../types/gameState';
import type { HexTile } from '../../../types';
import { buildViewContext } from '../viewContext';
import { buildFindIndex, findIndexStamp, matchFind, foldForSearch, matchScore, FIND_GROUPS, FIND_KIND_GROUP, findIndexSelector, type FindIndexVM, type FindEntryVM } from '../find';
import { createSeenFloor, KNOWLEDGE_SURFACES } from '../knowledge';
import { getViewSelector } from '../selectors';
import { WORLD_REF_KINDS } from '../../../types/worldRef';
import { FIND_WORDS } from '../../../data/view-content';
import { FIND_RESULTS_PER_GROUP } from '../viewConstants';

const ASC = 'asc';

function world(opts: { fog?: boolean } = { fog: true }): GameState {
  const graph = new WorldGraph();
  graph.addNode({ id: ASC, type: 'actor', name: 'Vara', properties: { actorType: 'ascendant' } });
  graph.addNode({ id: 'quarter', type: 'location', name: 'Temple Quarter', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 3, hexRow: 4 } });
  graph.addNode({ id: 'shrine', type: 'location', name: 'The Shrine', properties: { parentLocationId: 'quarter', sublocationCategory: 'shrine' } });
  graph.addNode({ id: 'shutash', type: 'actor', name: 'Shutash', properties: { actorType: 'individual', locationId: 'shrine' } });
  graph.addEdge({ id: 'at1', source: 'shutash', target: 'shrine', type: 'located_at', properties: {} });
  graph.addNode({ id: 'eloise', type: 'actor', name: 'Éloise Vane', properties: { actorType: 'individual', locationId: 'quarter' } });
  graph.addEdge({ id: 'at2', source: 'eloise', target: 'quarter', type: 'located_at', properties: {} });
  graph.addEdge({ id: 'th1', source: ASC, target: 'eloise', type: 'thread', properties: {} });
  graph.addNode({ id: 'cong', type: 'actor', name: 'Congregation of the Spheres', properties: { actorType: 'faction', factionClass: 'church' } });
  graph.addEdge({ id: 'm1', source: 'shutash', target: 'cong', type: 'member_of', properties: { rank: 0.5 } });
  // A remembered town: nameable, with its stale fact.
  graph.addNode({ id: 'old', type: 'location', name: 'Ashford', properties: { locationType: 'town', locationSubtype: 'village', hexCol: 5, hexRow: 5 } });
  // Under fog: a town, a person in it, their faction, a hidden place in a seen town.
  graph.addNode({ id: 'fog', type: 'location', name: 'Zarquun Hold', properties: { locationType: 'town', locationSubtype: 'town', hexCol: 9, hexRow: 9 } });
  graph.addNode({ id: 'ghost', type: 'actor', name: 'Zarquun the Pale', properties: { actorType: 'individual', locationId: 'fog' } });
  graph.addEdge({ id: 'at3', source: 'ghost', target: 'fog', type: 'located_at', properties: {} });
  graph.addNode({ id: 'secret', type: 'actor', name: 'Zarquun Covenant', properties: { actorType: 'faction' } });
  graph.addEdge({ id: 'm2', source: 'ghost', target: 'secret', type: 'member_of', properties: { rank: 0.5 } });
  graph.addNode({ id: 'vault', type: 'location', name: 'Zarquun Vault', properties: { parentLocationId: 'quarter', hidden: true } });
  const visibilityMap = new Map<string, { state: string; snapshot?: unknown }>();
  if (opts.fog) {
    visibilityMap.set('3,4', { state: 'visible' });
    visibilityMap.set('5,5', { state: 'remembered', snapshot: { terrain: 'grassland', locationNames: ['Ashford'], agentNames: [], lastSeenTick: 0 } });
    visibilityMap.set('9,9', { state: 'unexplored' });
  }
  return {
    graph,
    ascendantId: ASC,
    tick: 100,
    seed: 42,
    tiles: [
      { coord: { col: 3, row: 4 }, terrain: 'grassland' } as unknown as HexTile,
      { coord: { col: 5, row: 5 }, terrain: 'grassland' } as unknown as HexTile,
      { coord: { col: 9, row: 9 }, terrain: 'grassland' } as unknown as HexTile,
    ],
    visibilityMap,
    familiarityMap: new Map(),
    unlockedActionIds: [],
    controlEffects: [],
  } as unknown as GameState;
}

function indexOf(state: GameState, fogOff = false): FindIndexVM {
  return buildFindIndex(buildViewContext(null, state), { fogOff });
}


describe('the seen floor', () => {
  it('Find is a named knowledge surface', () => {
    expect(KNOWLEDGE_SURFACES).toContain('find');
  });

  it('names seen and remembered places, never unexplored or hidden ones', () => {
    const floor = createSeenFloor(world());
    expect(floor.canName({ kind: 'location', id: 'quarter' })).toBe(true);
    expect(floor.canName({ kind: 'location', id: 'old' })).toBe(true);
    expect(floor.canName({ kind: 'location', id: 'fog' })).toBe(false);
    expect(floor.canName({ kind: 'sublocation', id: 'shrine' })).toBe(true);
    expect(floor.canName({ kind: 'sublocation', id: 'vault' })).toBe(false);
    expect(floor.staleFact({ kind: 'location', id: 'old' })).toMatch(/^Last seen .+ ago$/);
    expect(floor.staleFact({ kind: 'location', id: 'quarter' })).toBeNull();
  });

  it('names people in sight or threaded, and powers with a nameable member', () => {
    const floor = createSeenFloor(world());
    expect(floor.canName({ kind: 'agent', id: 'shutash' })).toBe(true);
    expect(floor.canName({ kind: 'agent', id: 'ghost' })).toBe(false);
    expect(floor.canName({ kind: 'faction', id: 'cong' })).toBe(true);
    expect(floor.canName({ kind: 'faction', id: 'secret' })).toBe(false);
  });

  it('a person known well enough is nameable from anywhere', () => {
    const s = world();
    (s.familiarityMap as Map<string, number>).set('ghost', 1000);
    expect(createSeenFloor(s).canName({ kind: 'agent', id: 'ghost' })).toBe(true);
  });

  it('fails open with no fog (a fog-off view)', () => {
    expect(createSeenFloor(world({ fog: false })).canName({ kind: 'agent', id: 'ghost' })).toBe(true);
    expect(createSeenFloor(world(), { fogOff: true }).canName({ kind: 'location', id: 'fog' })).toBe(true);
  });
});

describe('the leak test (THR-1822 § D10)', () => {
  it('no entry carries an unseen thing', () => {
    const ids = indexOf(world()).entries.map(e => e.ref.id);
    for (const unseen of ['fog', 'ghost', 'secret', 'vault']) expect(ids, unseen).not.toContain(unseen);
  });

  it('a query matching only unseen names returns the same result as nonsense', () => {
    const idx = indexOf(world());
    const unseen = matchFind(idx, 'Zarquun');
    const nonsense = matchFind(idx, 'qxjvwk');
    expect(unseen).toEqual(nonsense);
    expect(unseen.miss).toBe(FIND_WORDS.miss);
    expect(unseen.groups).toEqual([]);
  });

  it('with fog off the same query finds them (the floor, not the matcher, hides them)', () => {
    const found = matchFind(indexOf(world(), true), 'Zarquun');
    expect(found.miss).toBeNull();
    expect(found.groups.flatMap(g => g.rows.map(r => r.ref.id))).toEqual(expect.arrayContaining(['fog', 'ghost', 'secret']));
  });

  it('a person known by name on an unexplored hex keeps no place and no hex', () => {
    const s = world();
    (s.familiarityMap as Map<string, number>).set('ghost', 1000);
    const ghost = indexOf(s).entries.find(e => e.ref.id === 'ghost');
    expect(ghost).toBeDefined();
    expect(ghost!.fact).toBe('');
    expect(ghost!.hexKey).toBeNull();
    expect(ghost!.mapLocated).toBe(false);
    expect(indexOf(s).entries.map(e => e.fact).join(' ')).not.toMatch(/Zarquun Hold/);
  });

  it('a seen person is "At" their own place', () => {
    const shutash = indexOf(world()).entries.find(e => e.ref.id === 'shutash');
    expect(shutash?.fact).toBe('At The Shrine');
  });

  it('the stamp moves when fog lifts or a card unlocks', () => {
    const s = world();
    const before = findIndexStamp(s);
    (s.visibilityMap as Map<string, { state: string }>).set('9,9', { state: 'visible' });
    expect(findIndexStamp(s)).not.toBe(before);
  });

  it('a Codex entry never shares a key with a card of the same id', () => {
    const s = world();
    (s as unknown as { unlockedActionIds: string[] }).unlockedActionIds = ['whisper_insight'];
    const idx = buildFindIndex(buildViewContext(null, s), { codex: [{ id: 'whisper_insight', name: 'Illuminating Whisper' }] });
    const keys = idx.entries.filter(e => e.ref.id === 'whisper_insight').map(e => e.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('the registered selector holds no unseen ref', () => {
    const sel = getViewSelector('findIndex');
    expect(sel).toBe(findIndexSelector);
    const vm = sel!.build(buildViewContext(null, world()), undefined) as FindIndexVM;
    expect(vm.entries.some(e => e.ref.id === 'ghost')).toBe(false);
  });
});

describe('matching and ranking', () => {
  it('folds accents and case', () => {
    expect(foldForSearch('Éloise VANE')).toBe('eloise vane');
    const r = matchFind(indexOf(world()), 'eloise');
    expect(r.groups[0].rows[0].ref.id).toBe('eloise');
    expect(matchFind(indexOf(world()), 'ÉLOÏSE').groups[0].rows[0].ref.id).toBe('eloise');
  });

  it('whole name > word start > inside a word', () => {
    expect(matchScore('shutash', 'shutash')).toBe(0);
    expect(matchScore('temple quarter', 'quar')).toBe(1);
    expect(matchScore('temple quarter', 'uart')).toBe(2);
    expect(matchScore('temple quarter', 'zz')).toBeNull();
  });

  function idx(rows: Array<Partial<FindEntryVM> & { name: string; key: string }>): FindIndexVM {
    return {
      entries: rows.map(r => ({
        ref: { kind: 'agent', id: r.key }, entryKind: 'agent', kindLabel: 'Person', fact: '', mapLocated: false, hexKey: null,
        yours: false, group: 'people', searchKey: foldForSearch(r.name), ...r,
      } as FindEntryVM)),
    };
  }

  it('orders by match, then yours, then recent, then name', () => {
    const index = idx([
      { key: 'inside', name: 'Mashan' },          // inside a word
      { key: 'start-b', name: 'Bram Ash' },       // word start
      { key: 'start-a', name: 'Arlo Ash' },       // word start
      { key: 'start-yours', name: 'Cora Ash', yours: true },
      { key: 'start-recent', name: 'Dov Ash' },
      { key: 'whole', name: 'Ash' },
    ]);
    const rows = matchFind(index, 'ash', ['start-recent']).groups[0].rows.map(r => r.key);
    expect(rows).toEqual(['whole', 'start-yours', 'start-recent', 'start-a', 'start-b', 'inside']);
  });

  it('caps a group and offers "Show all N"', () => {
    const many = idx(Array.from({ length: FIND_RESULTS_PER_GROUP + 2 }, (_, i) => ({ key: `p${i}`, name: `Ash ${i}` })));
    const g = matchFind(many, 'ash').groups[0];
    expect(g.rows).toHaveLength(FIND_RESULTS_PER_GROUP);
    expect(g.total).toBe(FIND_RESULTS_PER_GROUP + 2);
    expect(g.showAll).toBe(`Show all ${FIND_RESULTS_PER_GROUP + 2}`);
  });

  it('orders groups by their best match', () => {
    const r = matchFind(indexOf(world()), 'temple');
    expect(r.groups[0].id).toBe('places');
  });
});

describe('the empty box', () => {
  it('lists Recent (from Inspector history) and Your people', () => {
    const r = matchFind(indexOf(world()), '  ', ['agent:shutash', 'location:fog']);
    expect(r.empty).toBe(true);
    expect(r.hint).toBe(FIND_WORDS.emptyHint);
    const recent = r.groups.find(g => g.id === 'recent');
    // An unseen subject in history never surfaces through Recent.
    expect(recent?.rows.map(x => x.ref.id)).toEqual(['shutash']);
    expect(r.groups.find(g => g.id === 'yourPeople')?.rows.map(x => x.ref.id)).toEqual(['eloise']);
  });
});

describe('the group lists (Law 58)', () => {
  it('FIND_KIND_GROUP is total over WorldRefKind and names only FIND_GROUPS', () => {
    for (const k of WORLD_REF_KINDS) expect(k in FIND_KIND_GROUP, k).toBe(true);
    for (const g of Object.values(FIND_KIND_GROUP)) if (g) expect(FIND_GROUPS).toContain(g);
    expect(FIND_KIND_GROUP.hex).toBeNull();
  });
});
