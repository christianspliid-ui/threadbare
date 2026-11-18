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
import { displayTradeLabel } from '../firstTrade';
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
import { buildingFact } from '../settlementEconomy/describe';
import { spelledCount } from '../aftermathWords';

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
    story: [{ edge: 'participated_in', dir: 'out', fact: 'storyRole', only: 'event' }],
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
      // THR-2030: an unborne artifact lies at its place (`lies_at`); none is ever `located_at`.
      { edge: 'lies_at', dir: 'in', fact: 'kind', only: 'artifact' },
      { edge: 'located_at', dir: 'in', fact: 'factHere', only: 'army' },
    ],
    story: [{ edge: 'occurred_at', dir: 'in', only: 'event' }],
  },
  faction: {
    where: [{ edge: 'located_at', dir: 'out', fact: 'factHall', only: 'place' }],
    who: [{ edge: 'member_of', dir: 'in', fact: 'rank', only: 'person' }],
    belongsTo: [
      { edge: 'belongs_to', dir: 'out', fact: 'factCulture', only: 'culture' },
      // THR-1910: the liege this faction owes fealty to (the sheet's Fealty section, THR-1932).
      { edge: 'sworn_to', dir: 'out', fact: 'factLiege', only: 'faction' },
    ],
    friendsAndFoes: [
      { edge: 'relates_to', dir: 'both', fact: 'sentiment', only: 'faction' },
      { edge: 'hostile_to', dir: 'both', fact: 'factFoe', only: 'faction' },
      // THR-1910: the vassals that owe this faction fealty.
      { edge: 'sworn_to', dir: 'in', fact: 'factVassal', only: 'faction' },
    ],
    holdsKnows: [
      { edge: 'controls', dir: 'out', fact: 'factControls', only: 'place' },
      { edge: 'possesses', dir: 'out', fact: 'kind', only: 'artifact' },
    ],
    story: [{ edge: 'participated_in', dir: 'out', fact: 'storyRole', only: 'event' }],
  },
  army: {
    where: [{ edge: 'located_at', dir: 'out', fact: 'factHere', only: 'place' }],
    who: [{ edge: 'commanded_by', dir: 'out', fact: 'factCommander', only: 'person' }],
    belongsTo: [{ edge: 'member_of', dir: 'out', fact: 'factMember', only: 'faction' }],
    friendsAndFoes: [{ edge: 'participates_in', dir: 'out', fact: 'kind' }],
  },
  artifact: {
    where: [{ edge: 'lies_at', dir: 'out', fact: 'factHere', only: 'place' }],
    who: [
      { edge: 'possesses', dir: 'in', fact: 'factHolder', only: 'person' },
      { edge: 'bonded_to', dir: 'in', fact: 'factBonded', only: 'person' },
    ],
    belongsTo: [{ edge: 'constructed_by', dir: 'out', fact: 'factMaker' }],
    story: [{ edge: 'participated_in', dir: 'out', fact: 'storyRole', only: 'event' }],
  },
  god: {
    where: [{ edge: 'avatar_of', dir: 'in', fact: 'factAvatar', only: 'person' }],
    who: [{ helper: 'firstAndThreads' }, { edge: 'accompanies', dir: 'out', fact: 'factCompanion', only: 'companion' }],
    holdsKnows: [{ edge: 'bonded_to', dir: 'out', fact: 'factBonded', only: 'artifact' }],
  },
  land: {
    where: [{ helper: 'landWhere' }, { helper: 'landAround' }],
  },
  // A happening: who took part (`participated_in`, actor → event) and where (`occurred_at`,
  // event → place). These replace the hover-only `who_was_there` row in the Inspector.
  record: {
    where: [{ edge: 'occurred_at', dir: 'out', only: 'place' }],
    who: [
      { edge: 'participated_in', dir: 'in', fact: 'role', only: 'person' },
      { edge: 'participated_in', dir: 'in', fact: 'kind', only: 'faction' },
    ],
  },
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

/** The work a person does, as the player reads it — the trade word first (THR-1982). */
function wordedRole(n: GraphNode): string {
  return displayTradeLabel(n);
}

function sentimentWord(edge: GraphEdge): string {
  const s = (edge.properties.sentiment as number | undefined) ?? 0;
  return s > 0.2 ? INSPECTOR_WORDS.factFriend : s < -0.2 ? INSPECTOR_WORDS.factRival : '';
}

function occupancyFact(graph: WorldGraph, place: GraphNode): string {
  // THR-1923 — a Place the town raised says so, or why it stands idle.
  const building = buildingFact(place, graph);
  if (building) return building;
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

/**
 * THR-2191 — the Story row's role word: said only when the deed was not the subject's own
 * ("done to them", "set upon"). An own deed, an unknown role or a non-string role says nothing.
 */
export function storyRoleWord(edge: GraphEdge): string {
  const role = edge.properties?.role;
  if (typeof role !== 'string') return '';
  return Object.prototype.hasOwnProperty.call(INSPECTOR_WORDS.storyRole, role) ? INSPECTOR_WORDS.storyRole[role] : '';
}

function factFor(graph: WorldGraph, rule: FactRule | undefined, n: GraphNode, edge: GraphEdge): string {
  if (!rule) return '';
  switch (rule) {
    case 'rank': return membershipRankWord(edge) ?? INSPECTOR_WORDS.factMember;
    case 'sentiment': return sentimentWord(edge);
    case 'role': return wordedRole(n);
    case 'occupancy': return occupancyFact(graph, n);
    case 'kind': return kindFact(n);
    case 'storyRole': return storyRoleWord(edge);
    default: return INSPECTOR_WORDS[rule] as string;
  }
}

interface Collected {
  row: LinkRowVM;
  sortKey: [number, string];
  tick: number;
  /** THR-2223 — encounter-outcome rows only: the template the run belongs to. */
  templateKey?: string;
  /** THR-2223 — true when this row starts a run (an action instance, or a legacy step 0). */
  startsRun?: boolean;
  /** THR-2191 — Story rows only: the role word ("done to them"), kept apart from the repeat word. */
  roleWord?: string;
}

/** THR-2223 — the one event type whose rows fold by template: an encounter chapter's steps. */
const STORY_FOLD_EVENT_TYPE = 'encounter_outcome';

/** THR-2223 — past this many runs the repeat word stops counting exactly (`spelledCount` tops out here). */
export const STORY_REPEAT_SPELLED_MAX = 99;

/**
 * THR-2223 — the Story's repeat word: "twice", "five times". A row stands for every run
 * of one template, so a ruler who ran "The Price on Their Head" five times shows one chip
 * that says so, not five identical chips. Spelled out (Laws 13/14): no numeral escapes.
 */
export function storyRepeatWord(runs: number): string {
  if (runs <= 1) return '';
  if (runs === 2) return INSPECTOR_WORDS.storyRepeat.twice;
  if (runs > STORY_REPEAT_SPELLED_MAX) return INSPECTOR_WORDS.storyRepeat.moreThan.replace('{n}', spelledCount(STORY_REPEAT_SPELLED_MAX));
  return INSPECTOR_WORDS.storyRepeat.many.replace('{n}', spelledCount(runs));
}

/**
 * THR-2223 — one Story row per template. Items keep their order of arrival; the latest
 * run's row stands (its link opens the newest chapter), carrying the repeat word as its
 * fact. Items with no template key (non-encounter events) pass through untouched.
 */
function foldStoryRepeats(items: Collected[]): Collected[] {
  const out: Collected[] = [];
  const at = new Map<string, { index: number; runs: number }>();
  for (const item of items) {
    if (!item.templateKey) { out.push(item); continue; }
    const run = item.startsRun ? 1 : 0;
    const seen = at.get(item.templateKey);
    if (!seen) {
      at.set(item.templateKey, { index: out.length, runs: run });
      out.push(item);
      continue;
    }
    seen.runs += run;
    if (item.tick >= out[seen.index].tick) out[seen.index] = item;
  }
  for (const { index, runs } of at.values()) {
    // A legacy step node carries no action id, so a run is counted at its step 0; a
    // chapter whose step 0 was never recorded still counts as one run.
    if (runs < 2) continue;
    const item = out[index];
    // THR-2191 — the role word comes first, the repeat word second: "done to them · twice".
    const fact = [item.roleWord ?? '', storyRepeatWord(runs)].filter(Boolean).join(' · ');
    out[index] = { ...item, row: { ...item.row, fact } };
  }
  return out;
}

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
        const first = e.properties.courtPosition === 'the_first';
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
    // THR-2139 — one Story row per action instance: a two-step chapter mints one event
    // node per step, so its steps share an `actionId`, and the latest step's row stands.
    const byInstance = new Map<string, number>();
    const push = (row: LinkRowVM, sortKey: [number, string], tick: number, instanceKey?: string, templateKey?: string, startsRun?: boolean, roleWord?: string) => {
      const key = `${row.ref.kind}:${row.ref.id}`;
      if (seen.has(key) || row.ref.id === subjectId) return;
      seen.add(key);
      if (instanceKey) {
        const at = byInstance.get(instanceKey);
        if (at !== undefined) {
          if (tick >= items[at].tick) items[at] = { row, sortKey, tick, templateKey, startsRun: true, roleWord };
          return;
        }
        byInstance.set(instanceKey, items.length);
      }
      items.push({ row, sortKey, tick, templateKey, startsRun, roleWord });
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
        const instanceKey = n.type === 'event' && typeof n.properties.actionId === 'string'
          ? `action:${n.properties.actionId as string}`
          : undefined;
        // THR-2223 — separate runs of one template fold into one row (`foldStoryRepeats`).
        // Only encounter-chapter rows fold: a fight record or an undertaking outcome can carry
        // the same `templateId` and must stay its own row.
        const foldable = n.type === 'event' && n.properties.eventType === STORY_FOLD_EVENT_TYPE;
        const baseTemplateKey = foldable
          ? (typeof n.properties.templateId === 'string' ? `template:${n.properties.templateId as string}` : typeof n.properties.templateName === 'string' ? `name:${n.properties.templateName as string}` : undefined)
          : undefined;
        // THR-2191 — own runs and runs done to the subject fold separately, so the repeat
        // count never mixes the two.
        const roleWord = step.fact === 'storyRole' ? row.fact : '';
        const templateKey = baseTemplateKey && roleWord ? `${baseTemplateKey}|${roleWord}` : baseTemplateKey;
        // A run starts at an action instance; a legacy step node (no `actionId`) starts one at step 0.
        const startsRun = instanceKey !== undefined || typeof n.properties.stepIndex !== 'number' || n.properties.stepIndex === 0;
        push(row, sortKey, typeof n.properties.tick === 'number' ? (n.properties.tick as number) : 0, instanceKey, templateKey, startsRun, roleWord);
      }
    }
    if (items.length === 0) continue; // Law 25: no heading over nothing
    const rows = sortRows(group, group === 'story' ? foldStoryRepeats(items) : items);
    groups.push({ id: group, label: CONNECTION_GROUP_LABELS[group], rows, total: rows.length, foldAfter: CONNECTIONS_DOCKED_FOLD_AFTER });
  }
  return { title: subject.cls === 'land' ? CONNECTIONS_BLOCK_TITLE.land : CONNECTIONS_BLOCK_TITLE.default, groups };
}
