/**
 * The one Connections builder (THR-1822 § D8; THR-1876 § D8).
 *
 * Every page ends in Connections: six groups in one fixed order (THR-1827 call 8), empty
 * groups omitted (Law 25), rows sorted then folded (call 9). Per-class behaviour is data —
 * `CONNECTION_RECIPES` — and every step names an edge type from `src/types/graph.ts` (or
 * one helper that walks one): a step whose edge does not exist is dropped, never invented.
 *
 * **A relation lives in one place** (§ D6): body sections describe the subject; links to
 * other world things live here, each with its one plain fact.
 *
 * Rows pass `knowledgeFilterFor(ctx, 'connections')` — OPEN until gating lands
 * (THR-1822 § D5), so the filter is a no-op today and is not yet a module of its own.
 */
import type { EdgeType, GraphEdge, GraphNode } from '../../types/graph';
import type { WorldRef } from '../../types/worldRef';
import type { GameState } from '../../types/gameState';
import type { WorldGraph } from '../graph';
import { fromGraphNode } from '../../types/worldRefAdapters';
import { hexKey as toHexKey, type HexKey } from '../hexActorIndex';
import { resolveToParentLocation } from '../sublocationShape';
import { hexNeighbors } from '../../lib/hexMath';
import { membershipRankWord } from '../detailPageResolvers';
import {
  CONNECTION_GROUP_LABELS,
  CONNECTION_GROUP_ORDER,
  CONNECTIONS_BLOCK_TITLE,
  INSPECTOR_WORDS,
  type ConnectionGroupId,
} from '../../data/view-content';
import { CONNECTIONS_DOCKED_FOLD_AFTER } from './viewConstants';
import { landNameFor, namedLocationOnHex } from './subjects/landName';
import type { ConnectionsVM, LinkRowVM } from './subjects/subjectTypes';

/** The subject classes Connections knows. Content cards and missing pages have none. */
export type ConnectionSubjectClass = 'person' | 'location' | 'faction' | 'army' | 'artifact' | 'god' | 'land' | 'record';

/** What a recipe runs against: a node id, or (the land page) a hex. */
export type ConnectionSubject =
  | { cls: Exclude<ConnectionSubjectClass, 'land'>; id: string }
  | { cls: 'land'; col: number; row: number };

/** One step: walk an edge type one way, or run a named helper. */
export type RecipeStep =
  | { edge: EdgeType; dir: 'out' | 'in' | 'both'; fact?: FactRule; only?: NodeFilter }
  | { helper: HelperId };

type FactRule = 'rank' | 'sentiment' | 'role' | 'occupancy' | 'kind' | keyof typeof INSPECTOR_WORDS;
type NodeFilter = 'person' | 'faction' | 'place' | 'artifact' | 'event' | 'army' | 'culture' | 'companion';
type HelperId = 'personWhere' | 'placeWhere' | 'landWhere' | 'landAround' | 'factionHallsHere' | 'firstAndThreads';

/**
 * The recipes (THR-1822 § D8 table). Total over the classes by type: a new class without a
 * recipe is a compile error.
 */
export const CONNECTION_RECIPES: Readonly<Record<ConnectionSubjectClass, Partial<Record<ConnectionGroupId, readonly RecipeStep[]>>>> = {
  person: {
    where: [{ helper: 'personWhere' }],
    who: [
      { edge: 'mentors', dir: 'out', fact: 'factMentor', only: 'person' },
      { edge: 'mentors', dir: 'in', fact: 'factMentor', only: 'person' },
      { edge: 'accompanies', dir: 'out', fact: 'factCompanion', only: 'companion' },
    ],
    belongsTo: [
      { edge: 'member_of', dir: 'out', fact: 'rank', only: 'faction' },
      { edge: 'member_of', dir: 'out', fact: 'factMember', only: 'army' },
      { edge: 'belongs_to', dir: 'out', fact: 'factCulture', only: 'culture' },
    ],
    friendsAndFoes: [
      { edge: 'relates_to', dir: 'both', fact: 'sentiment', only: 'person' },
      { edge: 'hostile_to', dir: 'both', fact: 'factFoe' },
    ],
    holdsKnows: [
      { edge: 'possesses', dir: 'out', fact: 'factCarried', only: 'artifact' },
      { edge: 'bonded_to', dir: 'out', fact: 'factBonded', only: 'artifact' },
      { edge: 'owns', dir: 'out', fact: 'kind' },
    ],
    story: [{ edge: 'participated_in', dir: 'out', only: 'event' }],
  },
  location: {
    where: [{ helper: 'placeWhere' }],
    who: [{ edge: 'located_at', dir: 'in', fact: 'role', only: 'person' }],
    belongsTo: [
      { edge: 'controls', dir: 'in', fact: 'factHolder', only: 'faction' },
      { edge: 'belongs_to', dir: 'out', fact: 'factCulture', only: 'culture' },
    ],
    friendsAndFoes: [{ helper: 'factionHallsHere' }],
    holdsKnows: [
      { edge: 'contains', dir: 'out', fact: 'occupancy', only: 'place' },
      { edge: 'located_at', dir: 'in', fact: 'kind', only: 'artifact' },
      { edge: 'located_at', dir: 'in', fact: 'factHere', only: 'army' },
    ],
    story: [{ edge: 'occurred_at', dir: 'in', only: 'event' }],
  },
  faction: {
    where: [{ edge: 'located_at', dir: 'out', fact: 'factHall', only: 'place' }],
    who: [{ edge: 'member_of', dir: 'in', fact: 'rank', only: 'person' }],
    belongsTo: [{ edge: 'belongs_to', dir: 'out', fact: 'factCulture', only: 'culture' }],
    friendsAndFoes: [
      { edge: 'relates_to', dir: 'both', fact: 'sentiment', only: 'faction' },
      { edge: 'hostile_to', dir: 'both', fact: 'factFoe', only: 'faction' },
    ],
    holdsKnows: [
      { edge: 'controls', dir: 'out', fact: 'factControls', only: 'place' },
      { edge: 'possesses', dir: 'out', fact: 'kind', only: 'artifact' },
    ],
    story: [{ edge: 'participated_in', dir: 'out', only: 'event' }],
  },
  army: {
    where: [{ edge: 'located_at', dir: 'out', fact: 'factHere', only: 'place' }],
    who: [{ edge: 'commanded_by', dir: 'out', fact: 'factCommander', only: 'person' }],
    belongsTo: [{ edge: 'member_of', dir: 'out', fact: 'factMember', only: 'faction' }],
    friendsAndFoes: [{ edge: 'participates_in', dir: 'out', fact: 'kind' }],
  },
  artifact: {
    where: [{ edge: 'located_at', dir: 'out', fact: 'factHere', only: 'place' }],
    who: [
      { edge: 'possesses', dir: 'in', fact: 'factHolder', only: 'person' },
      { edge: 'bonded_to', dir: 'in', fact: 'factBonded', only: 'person' },
    ],
    belongsTo: [{ edge: 'constructed_by', dir: 'out', fact: 'factMaker' }],
    story: [{ edge: 'participated_in', dir: 'out', only: 'event' }],
  },
  god: {
    where: [{ edge: 'avatar_of', dir: 'in', fact: 'factAvatar', only: 'person' }],
    who: [{ helper: 'firstAndThreads' }, { edge: 'accompanies', dir: 'out', fact: 'factCompanion', only: 'companion' }],
    holdsKnows: [{ edge: 'bonded_to', dir: 'out', fact: 'factBonded', only: 'artifact' }],
  },
  land: {
    where: [{ helper: 'landWhere' }, { helper: 'landAround' }],
  },
  record: {},
};

// ─── Node helpers ────────────────────────────────────────────────────────────

function isPerson(n: GraphNode): boolean {
  if (n.type !== 'actor') return false;
  const t = n.properties.actorType;
  return t !== 'faction' && t !== 'group' && t !== 'culture' && t !== 'ascendant' && n.properties.deceased !== true;
}

function matches(n: GraphNode, only: NodeFilter | undefined): boolean {
  if (!only) return true;
  switch (only) {
    case 'person': return isPerson(n);
    case 'faction': return n.type === 'actor' && n.properties.actorType === 'faction';
    case 'army': return n.type === 'actor' && n.properties.actorType === 'group';
    case 'culture': return n.type === 'actor' && n.properties.actorType === 'culture';
    case 'place': return n.type === 'location' && n.properties.hidden !== true && n.properties.discovered !== false;
    case 'artifact': return n.type === 'artifact' || n.type === 'artifact_legendary';
    case 'event': return n.type === 'event';
    case 'companion': return n.type === 'companion';
  }
}

/**
 * A culture names its Realm (it has no page of its own); otherwise the node's own ref.
 * `fromGraphNode` names neither events nor companions, so: a graph event is a record and
 * travels as an `encounter` ref holding its node id (the record page resolves a non-live
 * encounter id to its event node), and a companion node is a `companion` ref.
 */
function refFor(graph: WorldGraph, n: GraphNode): { ref: WorldRef; name: string } | null {
  if (n.type === 'event') {
    const name = (n.properties.templateName as string | undefined) ?? n.name;
    return { ref: { kind: 'encounter', id: n.id, name }, name };
  }
  if (n.type === 'companion') return { ref: { kind: 'companion', id: n.id, name: n.name }, name: n.name };
  if (n.type === 'actor' && n.properties.actorType === 'culture') {
    const realm = graph.getNodesByType('actor').find(r => r.properties.actorType === 'faction' && r.properties.factionDefId === `realm.${n.id}`);
    const ref = realm ? fromGraphNode(realm) : undefined;
    return ref ? { ref, name: n.name } : null;
  }
  const ref = fromGraphNode(n);
  return ref ? { ref, name: n.name } : null;
}

/** The hex a node stands on, through its place when it is a person or a Place. */
function hexOf(graph: WorldGraph, n: GraphNode): HexKey | null {
  let place: GraphNode | undefined = n;
  if (n.type !== 'location') {
    const at = graph.getOutgoingEdges(n.id, 'located_at')[0];
    place = at ? graph.getNode(at.target) : undefined;
  }
  const loc = place ? resolveToParentLocation(graph, place) : undefined;
  const col = loc?.properties.hexCol as number | undefined;
  const row = loc?.properties.hexRow as number | undefined;
  return col != null && row != null ? toHexKey(col, row) : null;
}

function wordedRole(n: GraphNode): string {
  const raw = (n.properties.npcRole ?? n.properties.role) as string | undefined;
  if (!raw) return '';
  const w = raw.replace(/[-_]+/g, ' ').trim();
  return w.charAt(0).toUpperCase() + w.slice(1);
}

function sentimentWord(edge: GraphEdge): string {
  const s = (edge.properties.sentiment as number | undefined) ?? 0;
  return s > 0.2 ? INSPECTOR_WORDS.factFriend : s < -0.2 ? INSPECTOR_WORDS.factRival : '';
}

function occupancyFact(graph: WorldGraph, place: GraphNode): string {
  const n = graph.getIncomingEdges(place.id, 'located_at').filter(e => {
    const who = graph.getNode(e.source);
    return who ? isPerson(who) : false;
  }).length;
  if (n === 0) return INSPECTOR_WORDS.factEmpty;
  if (n === 1) return INSPECTOR_WORDS.factOnePerson;
  return INSPECTOR_WORDS.factPeople.replace('{n}', String(n));
}

function kindFact(n: GraphNode): string {
  const raw = (n.properties.locationSubtype ?? n.properties.category ?? n.properties.groupKind ?? n.properties.eventType) as string | undefined;
  return raw ? raw.replace(/[-_]+/g, ' ').trim().toLowerCase() : '';
}

function factFor(graph: WorldGraph, rule: FactRule | undefined, n: GraphNode, edge: GraphEdge): string {
  if (!rule) return '';
  switch (rule) {
    case 'rank': return membershipRankWord(edge) ?? INSPECTOR_WORDS.factMember;
    case 'sentiment': return sentimentWord(edge);
    case 'role': return wordedRole(n);
    case 'occupancy': return occupancyFact(graph, n);
    case 'kind': return kindFact(n);
    default: return INSPECTOR_WORDS[rule] as string;
  }
}

interface Collected { row: LinkRowVM; sortKey: [number, string]; tick: number }

function rowOf(graph: WorldGraph, n: GraphNode, fact: string): LinkRowVM | null {
  const named = refFor(graph, n);
  if (!named) return null;
  const hk = n.type === 'event' ? null : hexOf(graph, n);
  return { ref: named.ref, name: named.name, fact, mapLocated: hk !== null, hexKey: hk, staleFact: null };
}

// ─── Helpers (the steps an edge alone cannot say) ────────────────────────────

function parentChain(graph: WorldGraph, start: GraphNode | undefined): GraphNode[] {
  const out: GraphNode[] = [];
  let cur = start;
  const seen = new Set<string>();
  while (cur) {
    const parentId = cur.properties.parentLocationId as string | undefined;
    if (!parentId || seen.has(parentId)) break;
    seen.add(parentId);
    const parent = graph.getNode(parentId);
    if (!parent) break;
    out.push(parent);
    cur = parent;
  }
  return out;
}

function areaOf(state: GameState | null, loc: GraphNode | undefined): GraphNode | undefined {
  if (!state || !loc) return undefined;
  const col = loc.properties.hexCol as number | undefined;
  const row = loc.properties.hexRow as number | undefined;
  if (col == null || row == null) return undefined;
  const tile = state.tiles?.find(t => t.coord.col === col && t.coord.row === row);
  return tile?.regionId ? state.graph.getNode(tile.regionId) : undefined;
}

function landRow(state: GameState, col: number, row: number, fact = ''): LinkRowVM {
  return {
    ref: { kind: 'hex', id: `${col},${row}`, name: landNameFor(state, col, row) },
    name: landNameFor(state, col, row),
    fact,
    mapLocated: true,
    hexKey: toHexKey(col, row),
    staleFact: null,
  };
}

/** Containment rows, innermost first: Place → Location → Area → its land. */
export function containmentRows(graph: WorldGraph, state: GameState | null, start: GraphNode | undefined, includeStart: boolean): LinkRowVM[] {
  if (!start) return [];
  const chain = [...(includeStart ? [start] : []), ...parentChain(graph, start)];
  const rows: LinkRowVM[] = [];
  for (const n of chain) {
    const r = rowOf(graph, n, '');
    if (r) rows.push(r);
  }
  const top = resolveToParentLocation(graph, start);
  const area = areaOf(state, top);
  if (area) {
    const r = rowOf(graph, area, '');
    if (r) rows.push(r);
  }
  const col = top?.properties.hexCol as number | undefined;
  const row = top?.properties.hexRow as number | undefined;
  if (state && col != null && row != null) rows.push(landRow(state, col, row));
  return rows;
}

function runHelper(id: HelperId, graph: WorldGraph, state: GameState | null, subject: ConnectionSubject): LinkRowVM[] {
  switch (id) {
    case 'personWhere': {
      if (subject.cls === 'land') return [];
      const at = graph.getOutgoingEdges(subject.id, 'located_at')[0];
      return containmentRows(graph, state, at ? graph.getNode(at.target) : undefined, true);
    }
    case 'placeWhere':
      return subject.cls === 'land' ? [] : containmentRows(graph, state, graph.getNode(subject.id), false);
    case 'landWhere': {
      if (subject.cls !== 'land' || !state) return [];
      const tile = state.tiles?.find(t => t.coord.col === subject.col && t.coord.row === subject.row);
      const area = tile?.regionId ? graph.getNode(tile.regionId) : undefined;
      const r = area ? rowOf(graph, area, '') : null;
      return r ? [r] : [];
    }
    case 'landAround': {
      if (subject.cls !== 'land' || !state) return [];
      const rows: LinkRowVM[] = [];
      for (const nb of hexNeighbors({ col: subject.col, row: subject.row })) {
        const place = namedLocationOnHex(graph, nb.col, nb.row);
        if (!place) continue;
        const node = graph.getNode(place.id);
        const r = node ? rowOf(graph, node, kindFact(node)) : null;
        if (r) rows.push(r);
      }
      return rows;
    }
    case 'factionHallsHere': {
      if (subject.cls === 'land') return [];
      const rows: LinkRowVM[] = [];
      for (const e of graph.getIncomingEdges(subject.id, 'located_at')) {
        if ((e.properties.role as string | undefined) !== 'guild_hall') continue;
        const f = graph.getNode(e.source);
        const r = f && matches(f, 'faction') ? rowOf(graph, f, INSPECTOR_WORDS.factHall) : null;
        if (r) rows.push(r);
      }
      return rows;
    }
    case 'firstAndThreads': {
      if (subject.cls === 'land') return [];
      const rows: LinkRowVM[] = [];
      for (const e of graph.getOutgoingEdges(subject.id, 'thread')) {
        const n = graph.getNode(e.target);
        if (!n || !isPerson(n)) continue;
        const first = e.properties.courtPosition === 'first';
        const r = rowOf(graph, n, first ? INSPECTOR_WORDS.factFirst : INSPECTOR_WORDS.factThreaded);
        if (r) rows.push(r);
      }
      return rows;
    }
  }
}

// ─── Build ───────────────────────────────────────────────────────────────────

function sortRows(group: ConnectionGroupId, items: Collected[]): LinkRowVM[] {
  if (group === 'story') {
    return [...items].sort((a, b) => b.tick - a.tick || a.row.name.localeCompare(b.row.name)).map(i => i.row);
  }
  if (group === 'where') return items.map(i => i.row); // containment order is the meaning
  return [...items]
    .sort((a, b) => a.sortKey[0] - b.sortKey[0] || a.sortKey[1].localeCompare(b.sortKey[1]) || a.row.name.localeCompare(b.row.name) || a.row.ref.id.localeCompare(b.row.ref.id))
    .map(i => i.row);
}

/**
 * One subject's Connections. `state` is optional: without it (graph-only tests) the
 * containment chain stops at the Location and names no Area or land.
 */
export function buildConnections(graph: WorldGraph, state: GameState | null, subject: ConnectionSubject): ConnectionsVM {
  const recipe = CONNECTION_RECIPES[subject.cls];
  const groups: ConnectionsVM['groups'] = [];
  const subjectId = subject.cls === 'land' ? null : subject.id;

  for (const group of CONNECTION_GROUP_ORDER) {
    const steps = recipe[group];
    if (!steps) continue;
    const seen = new Set<string>();
    const items: Collected[] = [];
    const push = (row: LinkRowVM, sortKey: [number, string], tick: number) => {
      const key = `${row.ref.kind}:${row.ref.id}`;
      if (seen.has(key) || row.ref.id === subjectId) return;
      seen.add(key);
      items.push({ row, sortKey, tick });
    };
    for (const step of steps) {
      if ('helper' in step) {
        for (const row of runHelper(step.helper, graph, state, subject)) push(row, [0, ''], 0);
        continue;
      }
      if (!subjectId) continue;
      const edges = step.dir === 'out'
        ? graph.getOutgoingEdges(subjectId, step.edge)
        : step.dir === 'in'
          ? graph.getIncomingEdges(subjectId, step.edge)
          : [...graph.getOutgoingEdges(subjectId, step.edge), ...graph.getIncomingEdges(subjectId, step.edge)];
      for (const edge of edges) {
        const n = graph.getNode(edge.source === subjectId ? edge.target : edge.source);
        if (!n || !matches(n, step.only)) continue;
        const row = rowOf(graph, n, factFor(graph, step.fact, n, edge));
        if (!row) continue;
        // People sort by role word; places by occupancy (most first); the rest by fact.
        const sortKey: [number, string] = step.fact === 'occupancy'
          ? [-graph.getIncomingEdges(n.id, 'located_at').length, '']
          : [0, row.fact];
        push(row, sortKey, typeof n.properties.tick === 'number' ? (n.properties.tick as number) : 0);
      }
    }
    if (items.length === 0) continue; // Law 25: no heading over nothing
    const rows = sortRows(group, items);
    groups.push({ id: group, label: CONNECTION_GROUP_LABELS[group], rows, total: rows.length, foldAfter: CONNECTIONS_DOCKED_FOLD_AFTER });
  }
  return { title: subject.cls === 'land' ? CONNECTIONS_BLOCK_TITLE.land : CONNECTIONS_BLOCK_TITLE.default, groups };
}
