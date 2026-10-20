/**
 * find — the Find index and its matcher (THR-1915; THR-1822 § D10; Inspector plan § D11).
 *
 * Ctrl+K (or `/`) searches what the god has seen. `buildFindIndex` lists every thing the
 * seen floor lets Find name (`createSeenFloor`, `knowledge.ts`): Places, People, Powers,
 * Things, the cards in the hand and the Codex's entries. `matchFind` is pure: it folds the
 * query, ranks the matches (whole name > word start > inside a word; then yours; then
 * recent; then name), groups them and caps each group.
 *
 * **The leak rule** (THR-1822, a Done-when): no entry carries a thing the god has not
 * seen, so a query matching only unseen names returns the very same empty result as a
 * nonsense string, and the miss reads "Nothing you know of by that name." either way.
 *
 * Out of Find (THR-1832 § 1): hexes (no names), records, attachments.
 */
import type { WorldRef, WorldRefKind } from '../../types/worldRef';
import type { AnyRef, ContentObjectKindId } from '../../types/contentRef';
import type { GraphNode } from '../../types/graph';
import type { GameState } from '../../types/gameState';
import type { HexKey } from '../hexActorIndex';
import { readView, type ViewSelector } from './readView';
import type { ViewContext } from './viewContext';
import { hexContentsIndexSelector } from './hexContents';
import { createSeenFloor, godsPeopleIds, isHexKnown } from './knowledge';
import { getFirstId } from '../meetingEncounter';
import { isActionRevealed } from '../actionUnlock';
import { isGodCard } from './godRail';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { FIND_FACT_WORDS, FIND_GROUP_LABELS, FIND_WORDS } from '../../data/view-content';
import { FIND_MIN_QUERY_CHARS, FIND_RECENT_COUNT, FIND_RESULTS_PER_GROUP } from './viewConstants';

// ─── Groups ─────────────────────────────────────────────────────────────────

export type FindGroup = 'places' | 'people' | 'powers' | 'things' | 'cards' | 'codex';

/** The one list of result groups, in their tie-break order (Law 58). */
export const FIND_GROUPS: readonly FindGroup[] = ['places', 'people', 'powers', 'things', 'cards', 'codex'];

/**
 * Which group a kind falls in — total by type, so a new `WorldRefKind` without a row here
 * fails to compile. `null` = Find never lists that kind (THR-1832 § 1).
 */
export const FIND_KIND_GROUP: Readonly<Record<WorldRefKind | 'card' | 'codex', FindGroup | null>> = {
  location: 'places',
  sublocation: 'places',
  area: 'places',
  agent: 'people',
  companion: 'people',
  faction: 'powers',
  army: 'powers',
  artifact: 'things',
  card: 'cards',
  codex: 'codex',
  hex: null,
  attachment: null,
  encounter: null,
  journey: null,
  receipt: null,
};

/** The short kind word a row's icon stands for (Law 12: the icon never stands alone). */
export const FIND_KIND_LABELS: Readonly<Record<WorldRefKind | 'card' | 'codex', string>> = {
  location: 'Place',
  sublocation: 'Place within',
  area: 'Land',
  agent: 'Person',
  companion: 'Companion',
  faction: 'Power',
  army: 'Army',
  artifact: 'Artifact',
  card: 'Card',
  codex: 'Codex',
  hex: 'Land',
  attachment: 'Gift',
  encounter: 'Moment',
  journey: 'Journey',
  receipt: 'Receipt',
};

// ─── Shapes ─────────────────────────────────────────────────────────────────

export type FindEntryKind = WorldRefKind | 'card' | 'codex';

export interface FindEntryVM {
  /** A world ref for world results; a content ref for cards and Codex entries. */
  ref: AnyRef;
  /** `agent:npc_98` — the Inspector's subject key, so Recent can match it. */
  key: string;
  entryKind: FindEntryKind;
  name: string;
  kindLabel: string;
  /** One plain fact; a remembered place's is its stale fact. */
  fact: string;
  mapLocated: boolean;
  hexKey: HexKey | null;
  /** The god's own: its people, what they hold, its cards. */
  yours: boolean;
  group: FindGroup;
  /** The folded name the matcher reads. */
  searchKey: string;
}

export interface FindIndexVM {
  entries: FindEntryVM[];
}

export type FindListId = FindGroup | 'recent' | 'yourPeople';

export interface FindGroupVM {
  id: FindListId;
  label: string;
  /** Every match in the group; `rows` holds the first `FIND_RESULTS_PER_GROUP`. */
  total: number;
  rows: FindEntryVM[];
  /** "Show all 8", or null when every match shows. */
  showAll: string | null;
}

/**
 * What the box shows. Deliberately carries no echo of the query, so a miss on an unseen
 * name and a miss on nonsense are the same value (the leak test compares them whole).
 */
export interface FindResultsVM {
  /** True when the query was too short to search: the box shows its hint and lists. */
  empty: boolean;
  hint: string | null;
  groups: FindGroupVM[];
  /** "Nothing you know of by that name." on a miss, else null. */
  miss: string | null;
}

/** A Codex entry the UI hands in (the Codex catalog is a lazy chunk the engine never imports). */
export interface FindCodexSeed {
  id: string;
  name: string;
  /** The entry's category line, its one plain fact. */
  fact?: string;
  /** The entry's content kind, when known. */
  contentKind?: ContentObjectKindId;
}

export interface FindIndexArgs {
  /** The debug fog lever: with fog off, everything is nameable. */
  fogOff?: boolean;
  codex?: readonly FindCodexSeed[];
  /**
   * `findIndexStamp(state)`: what the index reads that can change without `touchWorld` —
   * fog revealed and a card unlocked by a cast while paused (as `armedTargetsStamp` does).
   */
  stamp?: string;
}

/** The parts of the state Find reads that can move while `worldVersion` stands still. */
export function findIndexStamp(state: Pick<GameState, 'visibilityMap' | 'unlockedActionIds' | 'familiarityMap'>): string {
  let seen = 0;
  const map = state.visibilityMap;
  if (map && typeof map.forEach === 'function') map.forEach(v => { if (v.state !== 'unexplored') seen++; });
  const fam = state.familiarityMap as { size?: number } | undefined;
  return `${seen}|${state.unlockedActionIds?.length ?? 0}|${fam?.size ?? 0}`;
}

// ─── Folding and ranking ────────────────────────────────────────────────────

/** Lower case, accents stripped: "Shutâsh" and "shutash" fold the same. */
export function foldForSearch(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/** 0 = the whole name, 1 = a word's start, 2 = inside a word, null = no match. */
export function matchScore(searchKey: string, foldedQuery: string): 0 | 1 | 2 | null {
  if (!foldedQuery) return null;
  if (searchKey === foldedQuery) return 0;
  let at = searchKey.indexOf(foldedQuery);
  if (at < 0) return null;
  while (at >= 0) {
    if (at === 0 || !/[\p{L}\p{N}]/u.test(searchKey[at - 1])) return 1;
    at = searchKey.indexOf(foldedQuery, at + 1);
  }
  return 2;
}

// ─── The index ──────────────────────────────────────────────────────────────

function cap(word: string): string {
  return word ? word[0].toUpperCase() + word.slice(1) : word;
}

function subtypeWord(n: GraphNode): string {
  const raw = (n.properties.locationSubtype ?? n.properties.category) as string | undefined;
  return raw ? cap(raw.replace(/[-_]+/g, ' ').trim().toLowerCase()) : FIND_KIND_LABELS.location;
}

function entry(ref: AnyRef, entryKind: FindEntryKind, name: string, fact: string, hexKey: HexKey | null, yours: boolean): FindEntryVM | null {
  const group = FIND_KIND_GROUP[entryKind];
  if (!group || !name) return null;
  return {
    ref,
    // A Codex entry may share its id with a card (action entries reuse the template id).
    key: entryKind === 'codex' ? `codex:${ref.id}` : `${ref.kind}:${ref.id}`,
    entryKind,
    name,
    kindLabel: FIND_KIND_LABELS[entryKind],
    fact,
    mapLocated: hexKey !== null,
    hexKey,
    yours,
    group,
    searchKey: foldForSearch(name),
  };
}

/**
 * Every thing Find may name, from the hex contents index plus the powers, the hand and
 * the Codex seeds. World-keyed: built when the box opens.
 */
export function buildFindIndex(ctx: ViewContext, args: FindIndexArgs = {}): FindIndexVM {
  const { state, graph } = ctx;
  const tiles = ctx.tiles.length > 0 ? ctx.tiles : (state.tiles ?? []);
  const areaHexes = new Map<string, string[]>();
  for (const t of tiles) {
    if (!t.regionId) continue;
    (areaHexes.get(t.regionId) ?? areaHexes.set(t.regionId, []).get(t.regionId)!).push(`${t.coord.col},${t.coord.row}`);
  }
  const floor = createSeenFloor(state, { fogOff: args.fogOff, areaHexes });
  const people = godsPeopleIds(state);
  let firstId: string | null = null;
  try {
    firstId = getFirstId(graph, ctx.ascendantId);
  } catch {
    firstId = null;
  }
  const out: FindEntryVM[] = [];
  const push = (e: FindEntryVM | null) => {
    if (e) out.push(e);
  };
  const named = (ref: WorldRef) => floor.canName(ref);
  const floorState = args.fogOff ? { visibilityMap: new Map() } : state;
  /** "At {place}" from the thing's own `located_at`, only when the floor may name that place. */
  const atFact = (id: string): string => {
    const e = graph.getOutgoingEdges(id, 'located_at')[0];
    const place = e ? graph.getNode(e.target) : undefined;
    if (!place?.name) return '';
    const kind = place.properties.parentLocationId ? 'sublocation' : 'location';
    return named({ kind, id: place.id }) ? FIND_FACT_WORDS.at.replace('{place}', place.name) : '';
  };

  const index = readView(ctx.runtime, state, hexContentsIndexSelector, undefined, ctx.tiles);
  for (const hex of Object.values(index)) {
    // A thing on a hex the god has not explored keeps its name (the floor allowed it) but
    // never its place or its hex: no "At …" fact, no eye, no fly-to (the leak rule).
    const hexKnown = isHexKnown(floorState, hex.hexKey);
    const hexOrNull = hexKnown ? hex.hexKey : null;
    for (const row of hex.locations) {
      if (!named(row.ref)) continue;
      const n = graph.getNode(row.ref.id);
      const fact = floor.staleFact(row.ref) ?? (n ? subtypeWord(n) : FIND_KIND_LABELS.location);
      push(entry({ kind: 'location', id: row.ref.id, name: row.name }, 'location', row.name, fact, hex.hexKey, false));
    }
    for (const row of hex.places) {
      if (!named(row.ref)) continue;
      const parentId = graph.getNode(row.ref.id)?.properties.parentLocationId as string | undefined;
      const parent = parentId ? graph.getNode(parentId)?.name ?? '' : '';
      const fact = floor.staleFact(row.ref) ?? (parent ? FIND_FACT_WORDS.at.replace('{place}', parent) : FIND_KIND_LABELS.sublocation);
      push(entry({ kind: 'sublocation', id: row.ref.id, name: row.name }, 'sublocation', row.name, fact, hex.hexKey, false));
    }
    for (const row of hex.people) {
      if (!named(row.ref)) continue;
      const mine = people.has(row.ref.id);
      const fact = row.ref.id === firstId ? FIND_FACT_WORDS.yourFirst : mine ? FIND_FACT_WORDS.threaded : atFact(row.ref.id);
      push(entry({ kind: 'agent', id: row.ref.id, name: row.name }, 'agent', row.name, fact, hexOrNull, mine));
    }
    for (const row of hex.armies) {
      if (!named(row.ref)) continue;
      push(entry({ kind: 'army', id: row.ref.id, name: row.name }, 'army', row.name, atFact(row.ref.id) || FIND_FACT_WORDS.army, hexOrNull, false));
    }
    for (const row of hex.artifacts) {
      if (!named(row.ref)) continue;
      push(entry({ kind: 'artifact', id: row.ref.id, name: row.name }, 'artifact', row.name, atFact(row.ref.id), hexOrNull, false));
    }
  }

  // Artifacts the god's own people carry travel with them (no place of their own).
  for (const holderId of people) {
    const holder = graph.getNode(holderId);
    for (const type of ['possesses', 'bonded_to'] as const) {
      for (const e of graph.getOutgoingEdges(holderId, type)) {
        const art = graph.getNode(e.target);
        if (!art || !named({ kind: 'artifact', id: art.id })) continue;
        if (out.some(x => x.key === `artifact:${art.id}`)) continue;
        const fact = holder?.name ? FIND_FACT_WORDS.heldBy.replace('{name}', holder.name) : '';
        push(entry({ kind: 'artifact', id: art.id, name: art.name }, 'artifact', art.name, fact, null, true));
      }
    }
  }

  // Areas: nameable when any of their hexes is.
  for (const [areaId, hexes] of areaHexes) {
    const area = graph.getNode(areaId);
    if (!area?.name || !named({ kind: 'area', id: areaId })) continue;
    push(entry({ kind: 'area', id: areaId, name: area.name }, 'area', area.name, FIND_KIND_LABELS.area, hexes.find(k => isHexKnown(floorState, k)) ?? null, false));
  }

  // Powers: factions are not on one hex.
  for (const actor of graph.getNodesByType('actor')) {
    if (actor.properties.actorType !== 'faction') continue;
    if (!named({ kind: 'faction', id: actor.id })) continue;
    const cls = actor.properties.factionClass as string | undefined;
    push(entry({ kind: 'faction', id: actor.id, name: actor.name }, 'faction', actor.name, cls ? cap(cls) : FIND_FACT_WORDS.members, null, false));
  }

  // Your cards: the hand's god cards (`buildHandCards`'s filter).
  for (const t of UNIFIED_ACTION_TEMPLATES) {
    if (!isGodCard(t) || !isActionRevealed(t, state.unlockedActionIds)) continue;
    push(entry({ kind: 'action_template', id: t.id, name: t.name }, 'card', t.name, FIND_FACT_WORDS.card, null, true));
  }

  // The Codex's entries, handed in by the UI.
  for (const c of args.codex ?? []) {
    push(entry({ kind: c.contentKind ?? 'action_template', id: c.id, name: c.name }, 'codex', c.name, c.fact || FIND_FACT_WORDS.codex, null, false));
  }
  return { entries: out };
}

// ─── The matcher ────────────────────────────────────────────────────────────

interface Ranked {
  e: FindEntryVM;
  score: number;
  recent: number;
}

function compare(a: Ranked, b: Ranked): number {
  return a.score - b.score
    || Number(b.e.yours) - Number(a.e.yours)
    || a.recent - b.recent
    || a.e.name.localeCompare(b.e.name)
    || a.e.key.localeCompare(b.e.key);
}

function groupVM(id: FindListId, rows: FindEntryVM[], limit: number): FindGroupVM {
  return {
    id,
    label: FIND_GROUP_LABELS[id],
    total: rows.length,
    rows: rows.slice(0, limit),
    showAll: rows.length > limit ? FIND_WORDS.showAll.replace('{n}', String(rows.length)) : null,
  };
}

/**
 * Match a query against the index. `recent` is the Inspector's history keys, newest
 * first (UI state, passed in). `expand` lifts one group's cap ("Show all N"). Pure and uncached.
 */
export function matchFind(index: FindIndexVM, query: string, recent: readonly string[] = [], opts: { expand?: FindListId | null } = {}): FindResultsVM {
  const q = foldForSearch(query);
  const recentRank = new Map<string, number>();
  recent.forEach((k, i) => {
    if (!recentRank.has(k)) recentRank.set(k, i);
  });

  if (q.length < FIND_MIN_QUERY_CHARS) {
    const byKey = new Map(index.entries.map(e => [e.key, e]));
    const recentRows: FindEntryVM[] = [];
    for (const k of recentRank.keys()) {
      const e = byKey.get(k);
      if (e) recentRows.push(e);
      if (recentRows.length >= FIND_RECENT_COUNT) break;
    }
    const yourPeople = index.entries
      .filter(e => e.group === 'people' && e.yours)
      .sort((a, b) => Number(b.fact === FIND_FACT_WORDS.yourFirst) - Number(a.fact === FIND_FACT_WORDS.yourFirst) || a.name.localeCompare(b.name));
    const groups: FindGroupVM[] = [];
    if (recentRows.length) groups.push(groupVM('recent', recentRows, FIND_RECENT_COUNT));
    if (yourPeople.length) groups.push(groupVM('yourPeople', yourPeople, FIND_RESULTS_PER_GROUP));
    return { empty: true, hint: FIND_WORDS.emptyHint, groups, miss: null };
  }

  const byGroup = new Map<FindGroup, Ranked[]>();
  for (const e of index.entries) {
    const score = matchScore(e.searchKey, q);
    if (score === null) continue;
    const r: Ranked = { e, score, recent: recentRank.get(e.key) ?? Number.MAX_SAFE_INTEGER };
    (byGroup.get(e.group) ?? byGroup.set(e.group, []).get(e.group)!).push(r);
  }
  if (byGroup.size === 0) return { empty: false, hint: null, groups: [], miss: FIND_WORDS.miss };

  const sorted = FIND_GROUPS
    .filter(g => byGroup.has(g))
    .map(g => ({ g, rows: byGroup.get(g)!.sort(compare) }))
    // Groups by their best match; ties keep `FIND_GROUPS` order (the sort is stable).
    .sort((a, b) => compare(a.rows[0], b.rows[0]));
  return {
    empty: false,
    hint: null,
    groups: sorted.map(({ g, rows }) => groupVM(g, rows.map(r => r.e), opts.expand === g ? rows.length : FIND_RESULTS_PER_GROUP)),
    miss: null,
  };
}

// ─── The selector ───────────────────────────────────────────────────────────

/**
 * The Find index, world-keyed (people move every tick). If a measured build ever exceeds
 * a frame on a large world, `invalidation` flips to `'structure'` — one field (THR-1822).
 */
export const findIndexSelector: ViewSelector<FindIndexArgs | undefined, FindIndexVM> = {
  id: 'findIndex',
  invalidation: 'world',
  key: (args) => `${args?.fogOff ? 1 : 0}|${args?.codex?.length ?? 0}|${args?.stamp ?? ''}`,
  fallback: () => ({ entries: [] }),
  build: (ctx, args) => buildFindIndex(ctx, args ?? {}),
};
