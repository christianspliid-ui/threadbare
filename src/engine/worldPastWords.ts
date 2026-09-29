/**
 * worldPastWords — the world's past, worded for the player (THR-1656, slice 2 of THR-1631).
 *
 * The one producer between `readWorldPastForPlayer` / `getPlacePast` and the three
 * surfaces (the chronicle's "Before you woke", the place line on a settlement or ruin
 * page, and the line on a dead person's sheet). It returns sentences as **segments**: each
 * name arrives as a segment carrying its `ref` (so the surface links it through the one
 * router, Law 21) and each concept word as a segment carrying its `tooltipId` (Law 17).
 * The surface never parses English to find either (Law 2).
 *
 * Pure: reads the graph and the fog knowledge, never writes. Every age goes through
 * `pastSpanLabel`, every count through a word band, so no numeral escapes (Law 13); an
 * unbound `{token}` is dropped with one warning rather than reaching a screen (Law 43).
 *
 * Plan: `Docs/plans/2026-09-28-thr-1631-world-with-a-past.md` § S2, § Content pillar,
 * § UI pillar.
 */

import type { WorldGraph } from './graph';
import type { GraphNode } from '../types/graph';
import type {
  ElderRuinArchetype,
  WorldPastEmpire,
  WorldPastKnowledge,
  WorldPastPlayerView,
  WorldPastRole,
} from '../types/worldPast';
import { countWord, pastSpanLabel } from './aftermathWords';
import {
  getPlacePast,
  isPastPlaceKnown,
  isSeededDead,
  TICKS_PER_YEAR,
} from './worldPast';
import { locationClassOf } from '../data/world-objects';
import {
  BEFORE_YOU_WOKE_EMPTY,
  BEFORE_YOU_WOKE_GROUP_TITLES,
  BURNED_TOWN_FOGGED_LINE,
  BURNED_TOWN_LINES,
  CHRONICLE_PAST_SETTLING_ROWS,
  DEAD_AGO_LINE,
  DEAD_ROLE_FALLBACK_LINES,
  DEAD_ROLE_LINES,
  ELDER_WAR_LINES,
  ELDER_WAR_SITES_LINES,
  EMPIRE_LINES,
  FALLEN_COMMANDER_FOGGED_LINE,
  FALLEN_COMMANDER_LINE,
  LIVING_WAR_LINES,
  PLACE_BURNED_TOWN_LINES,
  PLACE_ELDER_RUIN_FELL_LINE,
  PLACE_ELDER_RUIN_FOGGED_LINES,
  PLACE_ELDER_RUIN_LINES,
  PLACE_FOUNDING_FOUNDER_LINES,
  PLACE_FOUNDING_LINES,
  PLACE_PLAIN_RUIN_LINES,
  PLACE_RESTING_LINE,
  RUIN_COUNT_BANDS,
  RUIN_KIND_NOUNS,
  RUIN_KINDS_NONE,
  SETTLING_FOUNDER_LINES,
  SETTLING_LINES,
  WONDER_FINDER_LINE,
  WONDER_LEGEND_FALLBACK_LINES,
  WONDER_LEGEND_LINES,
  WONDERS_UNSEEN_LINE,
} from '../data/world-past-content';

// ─── Tooltip ids (registered in `ui-content.ts`) ───────────────────────────

/**
 * The five tooltips the past's surfaces hang on (plan § Content pillar item 8).
 *
 * They live under `ui.*` rather than the plan's `location.*` / `agent.*`: those two
 * prefixes are reserved for world-model place kinds and live agents
 * (`tooltipResolver.ts`), so a static concept filed there would need a world-model node
 * to resolve context-free — the one call site the player hovers.
 */
export const WORLD_PAST_TOOLTIPS = {
  beforeYouWoke: 'ui.before_you_woke',
  founding: 'ui.past.founding',
  burnedTown: 'ui.past.burned_town',
  elderRuinEmpire: 'ui.past.elder_ruin_empire',
  dead: 'ui.past.dead',
} as const;

// ─── Segments ──────────────────────────────────────────────────────────────

/** What a name links to — a subset of `WorldRef`, routed through `useRefRouter`. */
export interface PastRef {
  kind: 'agent' | 'faction' | 'location';
  id: string;
}

/** One run of a sentence: plain text, a linked name, or a concept word with a tooltip. */
export interface PastSegment {
  text: string;
  ref?: PastRef;
  tooltipId?: string;
}

/** One line a surface renders — one or more sentences, plus an optional flavor quote. */
export interface PastLine {
  id: string;
  segments: PastSegment[];
  /** A dead empire's own words (`legacyFlavor`), quoted under its line. */
  quote?: string;
}

export type BeforeYouWokeGroupKey = keyof typeof BEFORE_YOU_WOKE_GROUP_TITLES;

export interface BeforeYouWokeGroup {
  key: BeforeYouWokeGroupKey;
  title: string;
  /** How many things the group lists — the header count (Law 36). */
  count: number;
  lines: PastLine[];
}

type Binding = string | PastSegment | PastSegment[];

const warned = new Set<string>();
function warnOnce(key: string, message: string): void {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

/** Test seam: forget which unbound tokens have already warned. */
export function resetWorldPastWordsWarnings(): void {
  warned.clear();
}

const TOKEN_RE = /\{([A-Za-z_.]+)\}|<<([^>]+)>>/g;

/**
 * Bind a content line to segments. `{token}` takes its binding; `<<word>>` becomes a
 * concept segment carrying `conceptTooltipId`. An unbound token is dropped and warns once —
 * a raw `{token}` never reaches a screen (Law 43). The sentence's first letter is raised,
 * so a line may open on a name such as "the Breaking".
 */
export function renderPastTemplate(
  template: string,
  bindings: Record<string, Binding>,
  conceptTooltipId?: string,
): PastSegment[] {
  const out: PastSegment[] = [];
  const pushText = (text: string) => {
    if (!text) return;
    const last = out[out.length - 1];
    if (last && !last.ref && !last.tooltipId) last.text += text;
    else out.push({ text });
  };
  let at = 0;
  for (const m of template.matchAll(TOKEN_RE)) {
    pushText(template.slice(at, m.index));
    at = (m.index ?? 0) + m[0].length;
    if (m[2] !== undefined) {
      if (conceptTooltipId) out.push({ text: m[2], tooltipId: conceptTooltipId });
      else pushText(m[2]);
      continue;
    }
    const b = bindings[m[1]];
    if (b === undefined) {
      warnOnce(`${template}|${m[1]}`, `[worldPastWords] unbound {${m[1]}} in "${template}" — dropped.`);
      continue;
    }
    if (typeof b === 'string') pushText(b);
    else for (const seg of Array.isArray(b) ? b : [b]) {
      if (!seg.ref && !seg.tooltipId) pushText(seg.text);
      else out.push({ ...seg });
    }
  }
  pushText(template.slice(at));
  if (out.length > 0 && out[0].text) out[0] = { ...out[0], text: out[0].text[0].toUpperCase() + out[0].text.slice(1) };
  return out;
}

/** Join sentences into one line, a space between them. */
function joinSentences(sentences: PastSegment[][]): PastSegment[] {
  const out: PastSegment[] = [];
  sentences.filter(s => s.length > 0).forEach((s, i) => {
    if (i > 0) out.push({ text: ' ' });
    out.push(...s);
  });
  return out.reduce<PastSegment[]>((acc, seg) => {
    const last = acc[acc.length - 1];
    if (last && !last.ref && !last.tooltipId && !seg.ref && !seg.tooltipId) last.text += seg.text;
    else acc.push({ ...seg });
    return acc;
  }, []);
}

/** The flat text of a line — what tests and the debug bridge read. */
export function pastLineText(line: { segments: PastSegment[] }): string {
  return line.segments.map(s => s.text).join('');
}

// ─── Names ─────────────────────────────────────────────────────────────────

/** A stable, non-cryptographic hash, so a place keeps its line across renders and saves. */
function stableHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick(lines: readonly string[], key: string): string {
  return lines[stableHash(key) % lines.length];
}

/**
 * A name read mid-sentence: "The Ash-Crowned" → "the Ash-Crowned", and a Realm's
 * lowercase style name gains its article: "hold of Skyfield" → "the hold of Skyfield".
 * A sentence that opens on the name has its first letter raised by `renderPastTemplate`.
 */
function midSentence(name: string): string {
  if (/^The /.test(name)) return name.replace(/^The /, 'the ');
  return /^[a-z]/.test(name) ? `the ${name}` : name;
}

function nodeName(node: GraphNode | undefined, fallback: string): string {
  return node?.name?.trim() ? node.name : fallback;
}

function personSeg(graph: WorldGraph, id: string): PastSegment {
  return { text: nodeName(graph.getNode(id), 'someone long dead'), ref: { kind: 'agent', id } };
}

function placeSeg(graph: WorldGraph, id: string): PastSegment {
  return { text: midSentence(nodeName(graph.getNode(id), 'a place since lost')), ref: { kind: 'location', id } };
}

function realmSeg(graph: WorldGraph, id: string): PastSegment {
  return { text: midSentence(nodeName(graph.getNode(id), 'a realm since gone')), ref: { kind: 'faction', id } };
}

/** A dead empire has no page to link to; its name carries the concept's tooltip instead. */
function empireSeg(graph: WorldGraph, id: string): PastSegment {
  return { text: midSentence(nodeName(graph.getNode(id), 'a people long gone')), tooltipId: WORLD_PAST_TOOLTIPS.elderRuinEmpire };
}

function agoWords(years: number): string {
  return pastSpanLabel(years);
}

/** An empire's ruins, as words: "many temples, a few vaults and a battlefield". */
export function ruinKindsPhrase(counts: Record<ElderRuinArchetype, number>): string {
  const parts: string[] = [];
  for (const kind of ['temple', 'vault', 'battlefield'] as const) {
    const n = counts[kind] ?? 0;
    const band = RUIN_COUNT_BANDS.find(b => n >= b.from);
    if (!band) continue;
    const nouns = RUIN_KIND_NOUNS[kind];
    parts.push(band.word === 'a' ? `a ${nouns.one}` : `${band.word} ${nouns.many}`);
  }
  if (parts.length === 0) return RUIN_KINDS_NONE;
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}

// ─── Wonder legends ────────────────────────────────────────────────────────

/**
 * The legend line for each wonder, assigned so no two wonders of one subtype share a line
 * while any line of that subtype is unused. Deterministic: wonders sorted by id, the
 * starting line offset by a hash of the subtype's first wonder.
 */
export function assignWonderLegends(graph: WorldGraph, wonderIds: readonly string[]): Map<string, string> {
  const bySubtype = new Map<string, string[]>();
  for (const id of [...wonderIds].sort()) {
    const subtype = String(graph.getNode(id)?.properties.locationSubtype ?? '');
    (bySubtype.get(subtype) ?? bySubtype.set(subtype, []).get(subtype)!).push(id);
  }
  const out = new Map<string, string>();
  for (const [subtype, ids] of bySubtype) {
    const lines = WONDER_LEGEND_LINES[subtype] ?? WONDER_LEGEND_FALLBACK_LINES;
    if (!WONDER_LEGEND_LINES[subtype]) warnOnce(`legend|${subtype}`, `[worldPastWords] no wonder legend for subtype "${subtype}" — generic line used.`);
    const offset = stableHash(ids[0]) % lines.length;
    ids.forEach((id, k) => out.set(id, lines[(offset + k) % lines.length]));
  }
  return out;
}

function allWonderIds(graph: WorldGraph): string[] {
  return graph.getNodesByType('location')
    .filter(n => locationClassOf(n.properties.locationSubtype as string | undefined) === 'wonder')
    .map(n => n.id);
}

function wonderLegend(graph: WorldGraph, wonderId: string, legends: Map<string, string>): PastSegment[] {
  const line = legends.get(wonderId) ?? WONDER_LEGEND_FALLBACK_LINES[0];
  return renderPastTemplate(line, { wonder: placeSeg(graph, wonderId) });
}

// ─── The chapter: "Before you woke" ────────────────────────────────────────

function empireLine(graph: WorldGraph, empire: WorldPastEmpire): PastLine {
  const node = graph.getNode(empire.cultureId);
  const quote = typeof node?.properties.legacyFlavor === 'string' ? node.properties.legacyFlavor : undefined;
  return {
    id: `empire:${empire.cultureId}`,
    segments: renderPastTemplate(pick(EMPIRE_LINES, empire.cultureId), {
      empire: empireSeg(graph, empire.cultureId),
      kinds: ruinKindsPhrase(empire.ruinCounts),
    }),
    ...(quote ? { quote } : {}),
  };
}

/** The four groups of the pinned chronicle section, in reading order. */
export function buildBeforeYouWoke(graph: WorldGraph, view: WorldPastPlayerView): BeforeYouWokeGroup[] {
  // ── The elder age
  const elder: PastLine[] = view.elderAge.empires.map(e => empireLine(graph, e));
  const war = view.elderAge.war;
  if (war) {
    const sentences = [renderPastTemplate(pick(ELDER_WAR_LINES, war.eventId), {
      empireA: empireSeg(graph, war.empireIds[0]),
      empireB: empireSeg(graph, war.empireIds[1]),
      war: war.pastName ?? 'a war with no name left',
      ago: agoWords(war.yearsAgo),
    })];
    const found = war.knownSiteIds.length;
    if (found > 0) {
      sentences.push(renderPastTemplate(found === 1 ? ELDER_WAR_SITES_LINES.one : ELDER_WAR_SITES_LINES.many, { count: countWord(found) }));
    }
    elder.push({ id: `elder_war:${war.eventId}`, segments: joinSentences(sentences) });
  }

  // ── The settling: capitals (those with a founder) first, then the oldest few
  const founded = view.settling.filter(s => s.founderId);
  const rest = view.settling.filter(s => !s.founderId).slice(0, CHRONICLE_PAST_SETTLING_ROWS);
  const settling: PastLine[] = [...founded, ...rest].map(s => ({
    id: `settling:${s.settlementId}`,
    segments: s.founderId
      ? renderPastTemplate(pick(SETTLING_FOUNDER_LINES, s.settlementId), {
        place: placeSeg(graph, s.settlementId),
        founder: personSeg(graph, s.founderId),
        ago: agoWords(s.yearsAgo),
      })
      : renderPastTemplate(pick(SETTLING_LINES, s.settlementId), {
        place: placeSeg(graph, s.settlementId),
        ago: agoWords(s.yearsAgo),
      }),
  }));

  // ── Living memory
  const living: PastLine[] = view.livingMemory.map(w => {
    const loser = realmSeg(graph, w.loserId);
    const sentences = [renderPastTemplate(pick(LIVING_WAR_LINES, w.eventId), {
      winner: realmSeg(graph, w.winnerId),
      loser,
      ago: agoWords(w.yearsAgo),
    })];
    if (w.burnedTownId) {
      sentences.push(w.burnedTownKnown
        ? renderPastTemplate(pick(BURNED_TOWN_LINES, w.eventId), { town: placeSeg(graph, w.burnedTownId) }, WORLD_PAST_TOOLTIPS.burnedTown)
        : renderPastTemplate(BURNED_TOWN_FOGGED_LINE, {}, WORLD_PAST_TOOLTIPS.burnedTown));
    }
    for (const f of w.fallen) {
      sentences.push(f.known && f.restingAtId
        ? renderPastTemplate(FALLEN_COMMANDER_LINE, { commander: personSeg(graph, f.id), loser, rest: placeSeg(graph, f.restingAtId) })
        : renderPastTemplate(FALLEN_COMMANDER_FOGGED_LINE, { loser }));
    }
    return { id: `war:${w.eventId}`, segments: joinSentences(sentences) };
  });

  // ── Wonders: the ones the player has seen, each with its legend
  const legends = assignWonderLegends(graph, view.wonders.map(w => w.wonderId));
  const seen = view.wonders.filter(w => w.known);
  const wonders: PastLine[] = seen.map(w => ({
    id: `wonder:${w.wonderId}`,
    segments: joinSentences([
      wonderLegend(graph, w.wonderId, legends),
      w.finderId ? renderPastTemplate(WONDER_FINDER_LINE, { finder: personSeg(graph, w.finderId) }) : [],
    ]),
  }));
  if (seen.length < view.wonders.length) wonders.push({ id: 'wonders:unseen', segments: renderPastTemplate(WONDERS_UNSEEN_LINE, {}) });

  const group = (key: BeforeYouWokeGroupKey, lines: PastLine[], count: number): BeforeYouWokeGroup => ({
    key,
    title: BEFORE_YOU_WOKE_GROUP_TITLES[key],
    count,
    lines: lines.length > 0 ? lines : [{ id: `${key}:empty`, segments: [{ text: BEFORE_YOU_WOKE_EMPTY[key] }] }],
  });
  return [
    group('elder', elder, view.elderAge.empires.length),
    group('settling', settling, settling.length),
    group('living', living, view.livingMemory.length),
    group('wonders', wonders, seen.length),
  ];
}

/** True when the world has any past to show — the chronicle mounts on it at minute one. */
export function worldHasPast(view: WorldPastPlayerView): boolean {
  return view.elderAge.empires.length > 0 || view.settling.length > 0 || view.livingMemory.length > 0;
}

// ─── The place line ────────────────────────────────────────────────────────

/** The past event a place fell in, when the engine holds one. */
function eventOf(graph: WorldGraph, eventId: string | undefined): GraphNode | undefined {
  return eventId ? graph.getNode(eventId) : undefined;
}

function warSides(graph: WorldGraph, eventId: string): { winnerId?: string; loserId?: string } {
  const edges = graph.getIncomingEdges(eventId, 'participated_in');
  return {
    winnerId: edges.find(e => e.properties?.role === 'winner')?.source,
    loserId: edges.find(e => e.properties?.role === 'loser')?.source,
  };
}

/**
 * The one line under a place's header (plan § UI pillar item 2): a settlement's founding,
 * a plain ruin's war or its fogged twin, an elder ruin's kind and fall or its fogged twin,
 * a wonder's legend. `null` for a place with no past — the page renders nothing.
 */
export function buildPlacePastLine(graph: WorldGraph, locationId: string, knowledge: WorldPastKnowledge): PastLine | null {
  const node = graph.getNode(locationId);
  if (!node || node.type !== 'location') return null;
  const subtype = node.properties.locationSubtype as string | undefined;
  const cls = locationClassOf(subtype);
  const known = isPastPlaceKnown(graph, locationId, knowledge);
  const past = getPlacePast(graph, locationId);
  const sentences: PastSegment[][] = [];
  const named = new Set<string>();

  if (cls === 'wonder') {
    if (!known) return null;
    sentences.push(wonderLegend(graph, locationId, assignWonderLegends(graph, allWonderIds(graph))));
    const finder = past?.restingIds.find(id => graph.getNode(id)?.properties.pastRole === 'wonder_finder');
    if (finder) {
      sentences.push(renderPastTemplate(WONDER_FINDER_LINE, { finder: personSeg(graph, finder) }));
      named.add(finder);
    }
  } else if (!past) {
    return null;
  } else if (subtype === 'elder_ruin' && past.archetype) {
    if (known && past.empireId) {
      sentences.push(renderPastTemplate(pick(PLACE_ELDER_RUIN_LINES[past.archetype], locationId), { empire: empireSeg(graph, past.empireId) }));
      const ev = eventOf(graph, past.fellInEventId);
      if (ev?.properties.eventType === 'past_elder_war') {
        sentences.push(renderPastTemplate(PLACE_ELDER_RUIN_FELL_LINE, { war: String(ev.properties.pastName ?? 'the elder war') }));
      }
    } else {
      sentences.push(renderPastTemplate(PLACE_ELDER_RUIN_FOGGED_LINES[past.archetype], {}));
    }
  } else if (cls === 'ruin' && past.foundedYearsAgo != null) {
    const ev = eventOf(graph, past.fellInEventId);
    const sides = ev?.properties.eventType === 'past_war' ? warSides(graph, ev.id) : {};
    if (known && ev && sides.winnerId && sides.loserId) {
      sentences.push(renderPastTemplate(pick(PLACE_BURNED_TOWN_LINES, locationId), {
        winner: realmSeg(graph, sides.winnerId),
        loser: realmSeg(graph, sides.loserId),
        ago: agoWords(Number(ev.properties.pastYearsAgo) || 0),
      }, WORLD_PAST_TOOLTIPS.burnedTown));
    } else {
      sentences.push(renderPastTemplate(pick(PLACE_PLAIN_RUIN_LINES, locationId), { ago: agoWords(past.foundedYearsAgo) }, WORLD_PAST_TOOLTIPS.founding));
    }
  } else if (past.foundedYearsAgo != null) {
    if (past.founderId) {
      sentences.push(renderPastTemplate(pick(PLACE_FOUNDING_FOUNDER_LINES, locationId), {
        founder: personSeg(graph, past.founderId),
        ago: agoWords(past.foundedYearsAgo),
      }, WORLD_PAST_TOOLTIPS.founding));
      named.add(past.founderId);
    } else {
      sentences.push(renderPastTemplate(pick(PLACE_FOUNDING_LINES, locationId), { ago: agoWords(past.foundedYearsAgo) }, WORLD_PAST_TOOLTIPS.founding));
    }
  }

  // Who lies here — a specific, so only once the place is found.
  if (known && past) {
    for (const id of past.restingIds) {
      if (named.has(id)) continue;
      sentences.push(renderPastTemplate(PLACE_RESTING_LINE, { name: personSeg(graph, id) }));
    }
  }

  if (sentences.length === 0) return null;
  return { id: `place:${locationId}`, segments: joinSentences(sentences) };
}

// ─── The dead person's sheet ───────────────────────────────────────────────

/** The other side of a past war a fallen commander's realm fought. */
function enemyOf(graph: WorldGraph, actorId: string, realmId: string | undefined): string | undefined {
  for (const e of graph.getOutgoingEdges(actorId, 'participated_in')) {
    const other = graph.getIncomingEdges(e.target, 'participated_in')
      .find(p => p.source !== realmId && p.source !== actorId && graph.getNode(p.source)?.properties.actorType === 'faction');
    if (other) return other.source;
  }
  return undefined;
}

/**
 * The line under a seeded dead person's name (plan § UI pillar item 3): what they were,
 * and how long ago they died. `null` for anyone the past pass did not seed.
 */
export function buildDeadPastLine(graph: WorldGraph, actorId: string): PastLine | null {
  const node = graph.getNode(actorId);
  if (!isSeededDead(node)) return null;
  const role = node!.properties.pastRole as WorldPastRole | undefined;
  const sentences: PastSegment[][] = [];
  if (role && DEAD_ROLE_LINES[role]) {
    const at = graph.getOutgoingEdges(actorId, 'located_at')[0]?.target;
    const realm = graph.getOutgoingEdges(actorId, 'member_of')
      .map(e => e.target).find(id => graph.getNode(id)?.properties.actorType === 'faction');
    const enemy = role === 'fallen_commander' ? enemyOf(graph, actorId, realm) : undefined;
    const bindings: Record<string, Binding> = {};
    let complete = true;
    if (role === 'founder' || role === 'wonder_finder') {
      if (at && graph.getNode(at)) bindings[role === 'founder' ? 'place' : 'wonder'] = placeSeg(graph, at);
      else complete = false;
    } else if (realm && enemy) {
      bindings.realm = realmSeg(graph, realm);
      bindings.enemy = realmSeg(graph, enemy);
    } else {
      complete = false;
    }
    sentences.push(renderPastTemplate(complete ? DEAD_ROLE_LINES[role] : DEAD_ROLE_FALLBACK_LINES[role], bindings));
  }
  const tick = Number(node!.properties.deceasedTick);
  if (Number.isFinite(tick) && tick < 0) {
    sentences.push(renderPastTemplate(DEAD_AGO_LINE, { ago: agoWords(-tick / TICKS_PER_YEAR) }, WORLD_PAST_TOOLTIPS.dead));
  }
  if (sentences.length === 0) return null;
  return { id: `dead:${actorId}`, segments: joinSentences(sentences) };
}

// ─── Enrichment hook ───────────────────────────────────────────────────────

/**
 * The four place placeholders' values for one place (plan § Content pillar item 7):
 * `{place.founded_ago}`, `{place.founder}`, `{ruin.empire}`, `{ruin.fall}`. Read through
 * `getPlacePast`, never re-derived; a missing fact leaves its key absent and the
 * enrichment resolver falls back. Plain strings — encounter prose has no link layer.
 */
export function placePastEnrichment(graph: WorldGraph, locationId: string | undefined): {
  foundedAgo?: string;
  founder?: string;
  ruinEmpire?: string;
  ruinFall?: string;
} {
  if (!locationId) return {};
  const past = getPlacePast(graph, locationId);
  if (!past) return {};
  const founder = past.founderId ? graph.getNode(past.founderId)?.name : undefined;
  const empire = past.empireId ? graph.getNode(past.empireId)?.name : undefined;
  const ev = past.fellInEventId ? graph.getNode(past.fellInEventId) : undefined;
  let ruinFall: string | undefined;
  if (ev?.properties.eventType === 'past_elder_war' && typeof ev.properties.pastName === 'string') {
    ruinFall = ev.properties.pastName;
  } else if (ev?.properties.eventType === 'past_war') {
    const { winnerId, loserId } = warSides(graph, ev.id);
    const w = winnerId ? graph.getNode(winnerId)?.name : undefined;
    const l = loserId ? graph.getNode(loserId)?.name : undefined;
    if (w && l) ruinFall = `the war between ${midSentence(w)} and ${midSentence(l)}`;
  }
  return {
    ...(past.foundedYearsAgo != null ? { foundedAgo: agoWords(past.foundedYearsAgo) } : {}),
    ...(founder ? { founder } : {}),
    ...(empire ? { ruinEmpire: midSentence(empire) } : {}),
    ...(ruinFall ? { ruinFall } : {}),
  };
}

