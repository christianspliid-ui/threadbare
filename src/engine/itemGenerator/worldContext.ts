/**
 * `buildItemWorldContext` — what the live world can tell the item generator (THR-1570,
 * THR-1637).
 *
 * Plan: `Docs/plans/2026-09-26-thr-1570-seeded-item-generator.md` § Systems design
 * (`worldContext.ts`). The prototype faked its world; this reads the real one:
 *
 * - **the maker** — name, first name, pronoun (from `gender`);
 * - **the maker's faction** (`member_of`), with its definition's reach leanings;
 * - **the place** — the work's site if named, else where the maker stands, resolved to
 *   the settlement tier (`resolveToParentLocation`);
 * - **the maker's culture** (`belongs_to`);
 * - **the past** (THR-1637), which dresses the `found` origin:
 *   - *the dead* — individual mortals the graph keeps as `deceased` (the retained deaths:
 *     band, plot, fight, battle, commission; a lifecycle death removes its node and so
 *     leaves nothing to name). Their deed is the battle they fought in when a
 *     `participated_in` edge records one, else their trade at their home; their fate is
 *     their recorded `deathCause`, at the place they fell, by the hand of `slainBy` when
 *     that mortal is still named in the graph;
 *   - *the disasters* — `battle_fought` records (THR-1528): a siege, or a field battle
 *     told as a last stand, worded from its `resolutionType` alone;
 *   - *the monster hosts* — the monster faction actors legendary lairs seed
 *     (`isMonsterFaction`), at their lair while it is not cleared.
 *   The factions, cultures and places the past names join the tables, so a line that
 *   names a dead person's faction or a battle's town can resolve.
 *
 * Every field optional: a missing faction, place, culture, death or battle makes the
 * lines that name it ineligible, and nothing names a missing thing (fail-soft, NFP #4).
 * Every word about the past comes from a named table in `item-generator-tables.ts`
 * (NFP #1) and says only what the graph records. Deterministic (NFP #3): no draws; every
 * list is sorted by a recorded tick with an id tiebreak before it is capped.
 */

import type { WorldGraph } from '../graph';
import type { GraphNode } from '../../types/graph';
import type { SphereName } from '../../types/index';
import { getActorCultures, getAgentLocationId, getFactionMembershipEdges } from '../graphQueries';
import { resolveToParentLocation } from '../sublocationShape';
import { isMonster } from '../monsters/isMonster';
import { BATTLE_FOUGHT_EVENT_TYPE } from '../battleRecord';
import { getFactionDefinition } from '../../data/faction-definition-lookup';
import { withIndefiniteArticle } from '../../lib/indefiniteArticle';
import {
  ITEM_GEN_LIVE_BATTLE_EVENT, ITEM_GEN_LIVE_DEED_BY_ROLE, ITEM_GEN_LIVE_DEED_FALLBACK, ITEM_GEN_LIVE_DEED_HOME,
  ITEM_GEN_LIVE_DEED_IN_BATTLE, ITEM_GEN_LIVE_EVENTS_MAX, ITEM_GEN_LIVE_FATE_BY_CAUSE, ITEM_GEN_LIVE_FATE_FALLBACK,
  ITEM_GEN_LIVE_FATE_IN_BATTLE, ITEM_GEN_LIVE_FATE_SLAIN_BY, ITEM_GEN_LIVE_HEROES_MAX, ITEM_GEN_LIVE_MONSTERS_MAX,
  ITEM_GEN_LIVE_MONSTER_IMMUNE, ITEM_GEN_LIVE_MONSTER_UNIT, ITEM_GEN_LIVE_MONSTER_UNIT_FALLBACK, ITEM_GEN_LIVE_ROLE_FALLBACK,
} from '../../data/item-generator-tables';
import { itemGenFactionFromDefinition } from './reviewWorld';
import type {
  ItemGenCulture, ItemGenEvent, ItemGenFaction, ItemGenHero, ItemGenHistory, ItemGenMaker, ItemGenMonster, ItemGenPlace,
  ItemWorldContext, Pronoun,
} from './types';
import type { GeneratedItemProvenance } from './types';
import { emptyItemGenHistory } from './generateItem';

function pronounOf(node: GraphNode): Pronoun {
  const g = String(node.properties?.gender ?? '').toLowerCase();
  return g === 'female' ? 'she' : g === 'male' ? 'he' : 'they';
}

/** "The Blighted Golem Cluster" → "the Blighted Golem Cluster", for use mid-sentence. */
function midSentence(name: string): string {
  return /^The\s/.test(name) ? `t${name.slice(1)}` : name;
}

/** A place names itself mid-sentence ("lived at the Shattered Sanctum"); the renderer capitalises a line's first word. */
function placeOf(node: GraphNode | undefined): ItemGenPlace | null {
  if (!node || !node.name) return null;
  const p = node.properties ?? {};
  const terrain = (p.terrain ?? p.biome ?? p.terrainType) as string | undefined;
  return { id: node.id, name: midSentence(node.name), ...(terrain ? { terrain } : {}), spheres: {} };
}

function cultureOf(node: GraphNode): ItemGenCulture {
  const name = node.name ?? 'the old people';
  const adj = name.replace(/^the\s+/i, '');
  return { id: node.id, name: /^the\s/i.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name, adj, spheres: {} };
}

function factionOf(node: GraphNode): ItemGenFaction {
  const defId = (node.properties?.factionDefId as string | undefined) ?? null;
  return itemGenFactionFromDefinition(node.id, defId, node.name);
}

/** Fill `{key}` slots from `vars`; an unfilled slot is left for the validator to catch. */
function fill(text: string, vars: Readonly<Record<string, string | undefined>>): string {
  return text.replace(/\{([a-zA-Z]+)\}/g, (whole, k: string) => vars[k] ?? whole);
}

/** A Location (either tier) by id, resolved to the settlement tier, as a generator place. */
function settlementPlace(graph: WorldGraph, id: unknown): ItemGenPlace | null {
  if (typeof id !== 'string' || !id) return null;
  const node = graph.getNode(id);
  if (!node || node.type !== 'location') return null;
  return placeOf(resolveToParentLocation(graph, node));
}

/** Tables the past adds to — the same objects the maker fills. */
interface Tables {
  readonly factions: Record<string, ItemGenFaction>;
  readonly places: Record<string, ItemGenPlace>;
  readonly cultures: Record<string, ItemGenCulture>;
  readonly heroes: Record<string, ItemGenHero>;
  readonly events: Record<string, ItemGenEvent>;
  readonly monsters: Record<string, ItemGenMonster>;
}

// ─── The disasters ───────────────────────────────────────────────────

/** A battle record, told as a disaster; `null` when its place is gone or its kind is unknown. */
function eventFromBattle(graph: WorldGraph, node: GraphNode): { event: ItemGenEvent; place: ItemGenPlace } | null {
  const p = node.properties ?? {};
  const row = ITEM_GEN_LIVE_BATTLE_EVENT[p.battleType as 'siege' | 'field_battle'];
  if (!row) return null;
  const placeId = (p.locationId as string | undefined) ?? graph.getOutgoingEdges(node.id, 'occurred_at')[0]?.target;
  const place = settlementPlace(graph, placeId);
  if (!place) return null;
  const res = String(p.resolutionType ?? '');
  const name = fill(row.name, { place: place.name });
  const vars = { place: place.name, event: name };
  return {
    place,
    event: {
      id: node.id, kind: row.kind, name, short: row.short, placeId: place.id, spheres: row.spheres,
      what: fill(row.what[res] ?? row.what.default, vars),
      salvage: fill(row.salvage[res] ?? row.salvage.default, vars),
      lingers: row.lingers,
    },
  };
}

const recordTick = (n: GraphNode): number => (typeof n.properties?.tick === 'number' ? n.properties.tick as number : 0);
const byTickDescThenId = (a: GraphNode, b: GraphNode, tickOf: (n: GraphNode) => number) =>
  tickOf(b) - tickOf(a) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * The most recent battle per (kind, place), capped. Returns the id every battle record
 * resolves to, so a commander who fought in a dropped repeat still names the kept one.
 */
function readDisasters(graph: WorldGraph, t: Tables): Map<string, string> {
  const keptIdByRecord = new Map<string, string>();
  const keptIdByKey = new Map<string, string>();
  const records = graph.getNodesByType('event')
    .filter(n => n.properties?.eventType === BATTLE_FOUGHT_EVENT_TYPE)
    .sort((a, b) => byTickDescThenId(a, b, recordTick));
  for (const node of records) {
    const told = eventFromBattle(graph, node);
    if (!told) continue;
    const key = `${told.event.kind}:${told.event.placeId}`;
    const kept = keptIdByKey.get(key);
    if (kept) { keptIdByRecord.set(node.id, kept); continue; }
    if (keptIdByKey.size >= ITEM_GEN_LIVE_EVENTS_MAX) continue;
    keptIdByKey.set(key, node.id);
    keptIdByRecord.set(node.id, node.id);
    t.events[node.id] = told.event;
    t.places[told.place.id] ??= told.place;
  }
  return keptIdByRecord;
}

// ─── The dead ────────────────────────────────────────────────────────

/** A surname when the name is plainly "Given Family"; else the one name the person goes by. */
function familyOf(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 2 && words.every(w => /^\p{Lu}/u.test(w))) return words[1];
  return words[0] ?? name;
}

/** The battle this mortal fought in, most recent first, as the kept event id. */
function battleOf(graph: WorldGraph, actorId: string, keptIdByRecord: ReadonlyMap<string, string>): string | undefined {
  const fought = graph.getOutgoingEdges(actorId, 'participated_in')
    .map(e => graph.getNode(e.target))
    .filter((n): n is GraphNode => !!n && n.properties?.eventType === BATTLE_FOUGHT_EVENT_TYPE)
    .sort((a, b) => byTickDescThenId(a, b, recordTick));
  for (const n of fought) {
    const kept = keptIdByRecord.get(n.id);
    if (kept) return kept;
  }
  return undefined;
}

function heroFromDead(graph: WorldGraph, node: GraphNode, t: Tables, keptIdByRecord: ReadonlyMap<string, string>): ItemGenHero {
  const p = node.properties ?? {};
  const name = node.name as string;
  const factionNode = getFactionMembershipEdges(graph, node.id)
    .map(e => graph.getNode(e.target))
    .find((n): n is GraphNode => !!n && n.properties?.isMonsterFaction !== true);
  const faction = factionNode ? (t.factions[factionNode.id] ??= factionOf(factionNode)) : null;
  const cultureNode = getActorCultures(graph, node.id)[0]?.culture;
  if (cultureNode?.name) t.cultures[cultureNode.id] ??= cultureOf(cultureNode);

  const home = settlementPlace(graph, p.residencePositionId ?? p.originLocationId);
  if (home) t.places[home.id] ??= home;
  const fellAt = settlementPlace(graph, getAgentLocationId(graph, node.id));
  if (fellAt) t.places[fellAt.id] ??= fellAt;

  const eventId = battleOf(graph, node.id, keptIdByRecord);
  const event = eventId ? t.events[eventId] : undefined;

  const npcRole = typeof p.npcRole === 'string' ? p.npcRole : '';
  const trade = npcRole.replace(/_/g, ' ');
  const role = trade ? withIndefiniteArticle(faction ? `${faction.bare} ${trade}` : trade) : ITEM_GEN_LIVE_ROLE_FALLBACK;
  const deed = event ? fill(ITEM_GEN_LIVE_DEED_IN_BATTLE, { event: event.name })
    : home ? fill(ITEM_GEN_LIVE_DEED_BY_ROLE[npcRole] ?? ITEM_GEN_LIVE_DEED_HOME, { home: home.name })
    : ITEM_GEN_LIVE_DEED_FALLBACK;

  const cause = String(p.deathCause ?? '');
  const slayer = typeof p.slainBy === 'string' ? graph.getNode(p.slainBy)?.name : undefined;
  const phrase = cause === 'fight' && slayer ? ITEM_GEN_LIVE_FATE_SLAIN_BY : ITEM_GEN_LIVE_FATE_BY_CAUSE[cause] ?? ITEM_GEN_LIVE_FATE_FALLBACK;
  const fate = cause === 'battle' && event ? fill(ITEM_GEN_LIVE_FATE_IN_BATTLE, { event: event.name })
    : fill(fellAt ? phrase.at : phrase.bare, { place: fellAt?.name, slayer });

  return {
    id: node.id, name, first: name.split(/\s+/)[0] ?? name, family: familyOf(name), pronoun: pronounOf(node),
    factionId: faction?.id ?? null, role, deed, fate, ...(eventId ? { eventId } : {}), dead: true,
  };
}

const deathTick = (n: GraphNode): number => (typeof n.properties?.deceasedTick === 'number' ? n.properties.deceasedTick as number : 0);

function readDead(graph: WorldGraph, t: Tables, keptIdByRecord: ReadonlyMap<string, string>): void {
  const dead = graph.getNodesByType('actor')
    .filter(n => n.properties?.deceased === true && n.properties?.actorType === 'individual' && !!n.name && !isMonster(n))
    .sort((a, b) => byTickDescThenId(a, b, deathTick))
    .slice(0, ITEM_GEN_LIVE_HEROES_MAX);
  for (const node of dead) t.heroes[node.id] = heroFromDead(graph, node, t, keptIdByRecord);
}

// ─── The monster hosts ───────────────────────────────────────────────

const spawnTick = (n: GraphNode): number => (typeof n.properties?.spawnedAtTick === 'number' ? n.properties.spawnedAtTick as number : 0);

function readMonsters(graph: WorldGraph, t: Tables): void {
  const hosts = graph.getNodesByType('actor')
    .filter(n => n.properties?.isMonsterFaction === true && !!n.name)
    .sort((a, b) => spawnTick(a) - spawnTick(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const node of hosts) {
    if (Object.keys(t.monsters).length >= ITEM_GEN_LIVE_MONSTERS_MAX) break;
    const p = node.properties;
    const lair = typeof p.lairId === 'string' ? graph.getNode(p.lairId) : undefined;
    if (!lair || lair.properties?.locationSubtype === 'cleared_lair') continue;
    const place = settlementPlace(graph, lair.id);
    if (!place) continue;
    const sphere = (p.dominantSphere ?? lair.properties?.dominantSphere) as SphereName | undefined;
    if (!sphere) continue;
    t.places[place.id] ??= place;
    const name = midSentence(node.name as string);
    const unit = ITEM_GEN_LIVE_MONSTER_UNIT[sphere] ?? ITEM_GEN_LIVE_MONSTER_UNIT_FALLBACK;
    const immune = ITEM_GEN_LIVE_MONSTER_IMMUNE[sphere];
    t.monsters[node.id] = {
      id: node.id, name, sphere, placeId: place.id, one: `${withIndefiniteArticle(unit)} of ${name}`,
      ...(immune ? { immune } : {}),
      reachWeights: getFactionDefinition(p.definitionId as string | undefined)?.reachWeights ?? {},
    };
  }
}

// ─── The context ─────────────────────────────────────────────────────

export interface ItemWorldContextOptions {
  readonly makerId?: string | null;
  readonly placeId?: string | null;
  /**
   * Read the past (the dead, the battles, the monster hosts) — what a `found` thing is
   * dressed by. Defaults to on when there is no maker and off when there is: a
   * masterwork is dressed by its maker alone, and an event in its context would lean
   * its form, material and name toward a disaster its story never names.
   */
  readonly past?: boolean;
}

/** The live world as the generator sees it, around one maker (and optionally a named site), and its past. */
export function buildItemWorldContext(graph: WorldGraph, opts: ItemWorldContextOptions): ItemWorldContext {
  const t: Tables = { factions: {}, places: {}, cultures: {}, heroes: {}, events: {}, monsters: {} };
  let maker: ItemGenMaker | null = null;

  const makerNode = opts.makerId ? graph.getNode(opts.makerId) : undefined;
  if (makerNode) {
    const factionEdge = getFactionMembershipEdges(graph, makerNode.id)[0];
    const factionNode = factionEdge ? graph.getNode(factionEdge.target) : undefined;
    if (factionNode) t.factions[factionNode.id] = factionOf(factionNode);

    const siteId = opts.placeId ?? getAgentLocationId(graph, makerNode.id) ?? null;
    const place = placeOf(resolveToParentLocation(graph, siteId ? graph.getNode(siteId) : undefined));
    if (place) t.places[place.id] = place;

    const cultureNode = getActorCultures(graph, makerNode.id)[0]?.culture;
    if (cultureNode?.name) t.cultures[cultureNode.id] = cultureOf(cultureNode);

    const name = makerNode.name ?? 'a maker';
    maker = {
      id: makerNode.id, name, first: name.split(/\s+/)[0] ?? name, pronoun: pronounOf(makerNode),
      factionId: factionNode?.id ?? null, placeId: place?.id ?? null, cultureId: cultureNode?.name ? cultureNode.id : null,
    };
  }

  if (opts.past ?? !makerNode) {
    const keptIdByRecord = readDisasters(graph, t);
    readDead(graph, t, keptIdByRecord);
    readMonsters(graph, t);
  }
  return { maker, ...t };
}

/** True when the context has a past a `found` thing can be dressed by. */
export function hasItemWorldPast(world: ItemWorldContext): boolean {
  return Object.keys(world.heroes).length + Object.keys(world.events).length + Object.keys(world.monsters).length > 0;
}

/** Every generated item already in this world. */
export function getGeneratedItemNodes(graph: WorldGraph): GraphNode[] {
  return graph.getNodesByType('artifact').filter(n => n.properties?.origin === 'generated');
}

/** What this world has already made — the repeat decays read it, so a core's second appearance leans to its other idea. */
export function itemGenHistoryFromGraph(graph: WorldGraph): ItemGenHistory {
  const history = emptyItemGenHistory();
  for (const n of getGeneratedItemNodes(graph)) {
    const g = n.properties.generated as GeneratedItemProvenance | undefined;
    if (!g) continue;
    history.core[g.coreId] = (history.core[g.coreId] ?? 0) + 1;
    history.signature[`${g.coreId}:${g.signatureId}`] = (history.signature[`${g.coreId}:${g.signatureId}`] ?? 0) + 1;
    if (g.formId) history.form[g.formId] = (history.form[g.formId] ?? 0) + 1;
    if (n.name) history.names.add(n.name);
  }
  return history;
}
