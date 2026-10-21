/**
 * The Location, Place and Area page's rows (THR-1910, Inspector S2b — plan
 * `Docs/plans/2026-10-14-thr-1876-the-inspector.md` § D7.2, § D6, § D7.11).
 *
 * Every field `LocationProfileModal`, `LocationView` (the city view) and `HexSidebar`'s
 * Area facts show becomes a row here, resolved in the engine — no component reads the
 * graph (THR-1822). Each row reads the same source its retiring sheet reads, so both say
 * the same thing until S4 deletes the sheets. One fact told one way: place prose comes
 * from `generateEntityProse` only, danger from the one ladder, conditions from
 * `has_trait` edges.
 *
 * Words at the source (Laws 13/14): no numerals, no raw keys. Rows read `ctx.state` and
 * return null without it (the hover card and graph-only callers stay fail-soft).
 */
import type {
  CardTile,
  CardsSection,
  EventCardSection,
  EventEntry,
  PanelRow,
  PanelSection,
  ProseSection,
} from '../../../types/detailPage';
import type { GraphNode } from '../../../types/graph';
import type { GameState } from '../../../types/gameState';
import type { ResourceInstance, StockTier } from '../../../types/resource';
import type { SphereName } from '../../../types';
import { SPHERE_NAMES } from '../../../types/index';
import type { SectionResolver, SectionResolverContext } from '../../detailPageResolvers';
import { generateEntityProse } from '../../proseGenerator';
import { buildPlacePastLine, pastLineText } from '../../worldPastWords';
import { fortunesSentence } from '../../../data/fortunes-prose';
import { placePrayerView } from '../../prayers';
import { getResourceClass, getResourceTierProse } from '../../../data/resource-classes';
import { getSustenanceProse } from '../../../data/essence-sources';
import { readEssenceSource, selectLocationSustenanceVoice } from '../../essenceSources';
import { getVisibleSubLocations } from '../../viewLevel';
import { readActiveConditions } from '../../placeConditions';
import { getReputationWith } from '../../reputation';
import { getAvatarsOf } from '../../graphQueries';
import { getStreamYieldWord } from '../../../data/ruin-words';
import { getDurationWord } from '../../../data/domain-words';
import { areaFeatureWord, areaSizeWord } from '../../../data/geo-word-bands';
import { positionalDangerWord } from '../../../data/view-content';
import { getHexSphereInfluence } from '../../hexZoom';
import { selectGuildPostings, ADVENTURING_GUILD_LABEL } from '../../ruins/guildPostings';
import { getEncountersForLocation } from '../../../data/encounter-content';
import { getUnifiedTemplateById } from '../../../data/unified-action-templates';
import { SUBTYPE_SUBLOCATION_MAP } from '../../sublocation';
import { reachDisplayName } from '../../aftermathWords';
import {
  AREA_SPHERE_ROWS_MAX,
  ENCOUNTER_KIND_WORDS,
  ENCOUNTERS_HERE_WORDS,
  GUILD_POSTING_LINES,
  LIVELIHOOD_KEYWORDS,
  PLACE_OF_POWER_LINES,
  SOURCE_DRAIN_LINES,
  SUBJECT_FACT_WORDS,
  SUBJECT_ROW_LABELS,
  WALLS_LINES,
  FOUNDED_BY_LINE,
  LAIR_MONSTER_WORDS,
  PILGRIM_WAY_LINES,
  postingDistanceWord,
  sphereStrengthWord,
} from '../../../data/subject-sheet-words';
import { proseMarkupToHtml } from './pageResolvers';
import { linkedProseSection, type ProsePart } from './linkedProse';
import { founderOf } from '../../undertakingEconomy';
import { isSettlement } from '../../factionPurse/income';
import { isPlaceNode } from '../../sublocationShape';
import { selectPilgrimWays } from '../../pilgrimWays';
import { buildLairMonsterCardModel } from '../stage/buildLairMonsterCardModel';

// ─── Shared ──────────────────────────────────────────────────────────────────

/** The place node and the state, or null — every place row starts here. */
function placeOf(ctx: SectionResolverContext, regionOk = false): { node: GraphNode; state: GameState } | null {
  const state = ctx.state;
  if (!state) return null;
  const node = ctx.graph.getNode(ctx.nodeId);
  if (!node) return null;
  if (node.type === 'location' || (regionOk && node.type === 'region')) return { node, state };
  return null;
}

function prose(typeId: string, label: string, text: string, source: string, extra: Partial<ProseSection> = {}): ProseSection | null {
  if (!text.trim()) return null;
  return { kind: 'prose', typeId, label, gold: false, tier: 'routine', source, prose: proseMarkupToHtml(text), ...extra };
}

function sentenceCase(word: string): string {
  return word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
}

// ─── Overview ────────────────────────────────────────────────────────────────

/** The one place prose — `generateEntityProse(id, 'full')`, LocationView's reading. */
const placeProse: SectionResolver = (ctx) => {
  const p = placeOf(ctx);
  if (!p) return null;
  let text = '';
  try {
    text = generateEntityProse(p.node.id, ctx.graph, ctx.seed, 'full', ctx.tick);
  } catch {
    return null;
  }
  const paragraphs = text.split('\n\n').map(s => s.trim()).filter(Boolean);
  if (paragraphs.length === 0) return null;
  return { kind: 'prose', typeId: 'place_prose', label: SUBJECT_ROW_LABELS.placeProse, gold: true, tier: 'routine', source: 'generateEntityProse', prose: paragraphs.map(proseMarkupToHtml).join('\n\n') };
};

/** The place's past line (THR-1656), as the player's fog knows it. */
const pastLine: SectionResolver = (ctx) => {
  const p = placeOf(ctx);
  if (!p) return null;
  const line = buildPlacePastLine(ctx.graph, p.node.id, { visibility: p.state.visibilityMap, hexRevelation: p.state.hexRevelation });
  return line ? prose('past_line', SUBJECT_ROW_LABELS.pastLine, pastLineText(line), 'buildPlacePastLine') : null;
};

/** Prosperity and unrest in one sentence (THR-1934) — LocationView's Fortunes row. */
const fortunes: SectionResolver = (ctx) => {
  const p = placeOf(ctx);
  if (!p) return null;
  const s = fortunesSentence(ctx.graph, p.node.id);
  if (!s) return null;
  // THR-1957: a town on the edge names the holder it may turn from — the name routes (Law 21).
  const at = s.holder ? s.tail.indexOf(s.holder.name) : -1;
  if (s.holder && at >= 0) {
    const parts: ProsePart[] = [
      `${s.lead}${s.prosperityWord}${s.tail.slice(0, at)}`,
      { text: s.holder.name, ref: { kind: 'faction', id: s.holder.id } },
      s.tail.slice(at + s.holder.name.length),
    ];
    return linkedProseSection('fortunes', SUBJECT_ROW_LABELS.fortunes, parts, 'fortunesSentence', { labelTooltipId: 'ui.econ.prosperity' });
  }
  return prose('fortunes', SUBJECT_ROW_LABELS.fortunes, `${s.lead}${s.prosperityWord}${s.tail}`, 'fortunesSentence', { labelTooltipId: 'ui.econ.prosperity' });
};

/**
 * Who founded a town a mortal founded (THR-1937) — its `constructed_by` edge to a person.
 * Worldgen towns have none, and the line is omitted (Law 14). The name routes (Law 21);
 * the label's tooltip names the freehold the founder keeps (`ui.place.founded`).
 */
const foundedBy: SectionResolver = (ctx) => {
  const p = placeOf(ctx);
  if (!p || isPlaceNode(p.node) || !isSettlement(p.node)) return null;
  const founderId = founderOf(ctx.graph, p.node.id);
  const founder = founderId ? ctx.graph.getNode(founderId) : undefined;
  if (!founder?.name || founder.properties.actorType !== 'individual') return null;
  return linkedProseSection('founded_by', SUBJECT_ROW_LABELS.foundedBy, [
    FOUNDED_BY_LINE.lead,
    { text: founder.name, ref: { kind: 'agent', id: founder.id } },
    FOUNDED_BY_LINE.tail,
  ], 'founderOf', { labelTooltipId: 'ui.place.founded' });
};

/** An open prayer to the god, or the faith the town keeps (THR-1935). The god's name links. */
const prayer: SectionResolver = (ctx) => {
  const p = placeOf(ctx);
  if (!p || !p.state.ascendantId) return null;
  const view = placePrayerView(ctx.graph, p.state.ascendantId, p.node.id, ctx.tick);
  if (!view) return null;
  const at = view.godName ? view.line.indexOf(view.godName) : -1;
  const parts: ProsePart[] = at >= 0 && view.godName
    ? [view.line.slice(0, at), { text: view.godName, ref: { kind: 'agent', id: p.state.ascendantId } }, view.line.slice(at + view.godName.length)]
    : [view.line];
  if (view.hint) parts.push(` ${view.hint}`);
  const isPrayer = view.kind === 'prayer';
  return linkedProseSection('prayer', isPrayer ? SUBJECT_ROW_LABELS.prayer : SUBJECT_ROW_LABELS.faithful, parts, 'placePrayerView', {
    labelTooltipId: isPrayer ? 'ui.prayer' : 'ui.faithful',
  });
};

/** Resource stock tiers as prose, plus the sustenance clause (THR-615 / THR-618 / THR-840). */
const livelihood: SectionResolver = (ctx) => {
  const p = placeOf(ctx);
  if (!p) return null;
  const resources = (p.node.properties.resources ?? {}) as Record<string, ResourceInstance>;
  const entries = Object.entries(resources).filter(([, r]) => r && typeof r.quantity === 'number');
  if (entries.length === 0) return null;
  const subIds = getVisibleSubLocations(ctx.graph, p.node.id).map(s => s.id);
  const voice = selectLocationSustenanceVoice(ctx.graph, p.node.id, subIds);
  const sustenance = voice ? getSustenanceProse(voice.sphere, voice.sustenance.polarity) : null;
  const rank = (t: StockTier | undefined) => (t === 'scarce' ? 0 : t === 'surplus' ? 1 : 2);
  const notable = entries
    .filter(([, r]) => r.stockTier === 'scarce' || r.stockTier === 'surplus')
    .sort((a, b) => rank(a[1].stockTier) - rank(b[1].stockTier))
    .slice(0, 3);
  let text: string;
  if (notable.length > 0) {
    text = notable.map(([id, r]) => {
      const tier = r.stockTier as StockTier;
      const isStaple = getResourceClass(id).category === 'staple';
      const keyword = isStaple && tier === 'scarce' ? LIVELIHOOD_KEYWORDS.famine : isStaple && tier === 'surplus' ? LIVELIHOOD_KEYWORDS.glut : '';
      return keyword + getResourceTierProse(id, tier);
    }).join(' ');
  } else {
    const dominant = [...entries].sort((a, b) => (b[1].quantity ?? 0) - (a[1].quantity ?? 0))[0];
    text = getResourceTierProse(dominant[0], 'adequate');
  }
  if (sustenance) text = `${text} ${sustenance}`;
  return prose('livelihood', SUBJECT_ROW_LABELS.livelihood, text, 'livelihood');
};

/** The rival draining or profaning this place's essence source (THR-621). Fog-consistent. */
const contested: SectionResolver = (ctx) => {
  const p = placeOf(ctx);
  if (!p) return null;
  const source = readEssenceSource(p.node.properties);
  if (!source?.discoveredBy || !source.contestedBy) return null;
  const who = (p.state.rivalDefinitions ?? []).find(r => r.id === source.contestedBy)?.name ?? SOURCE_DRAIN_LINES.unnamedRival;
  const line = (source.desecrated ? SOURCE_DRAIN_LINES.desecrated : SOURCE_DRAIN_LINES.contested).replace('{who}', who);
  return prose('contested', source.desecrated ? SUBJECT_ROW_LABELS.desecrated : SUBJECT_ROW_LABELS.contested, line, 'readEssenceSource');
};

/** Fortification state (THR-628), only when the walls are worth mentioning or broken. */
const walls: SectionResolver = (ctx) => {
  const p = placeOf(ctx);
  if (!p) return null;
  const f = p.node.properties.fortificationMultiplier;
  const breached = p.node.properties.fortificationBreached === true;
  if (!breached && (typeof f !== 'number' || f <= 1)) return null;
  return prose('walls', SUBJECT_ROW_LABELS.walls, breached ? WALLS_LINES.breached : WALLS_LINES.fortified, 'fortification');
};

/** The place's timed states off its `has_trait` edges (THR-1143) — the modal's source. */
const conditionsHere: SectionResolver = (ctx) => {
  const p = placeOf(ctx);
  if (!p) return null;
  const rows = readActiveConditions(ctx.graph, p.node.id);
  if (rows.length === 0) return null;
  const tiles: CardTile[] = rows.map(c => ({
    title: c.name,
    kindWord: sentenceCase(c.term),
    lines: c.effect ? [c.effect] : [],
    durationWord: c.term,
    ...(c.share != null ? { meter: c.share } : {}),
  }));
  const section: CardsSection = { kind: 'cards', typeId: 'conditions_here', label: SUBJECT_ROW_LABELS.conditionsHere, gold: false, tier: 'routine', source: 'readActiveConditions', tiles };
  return section;
};

/** "Your reputation here" — the avatar's standing, hidden while it is the default (Law 4). */
const standing: SectionResolver = (ctx) => {
  const p = placeOf(ctx);
  if (!p || !p.state.ascendantId) return null;
  const viewer = getAvatarsOf(ctx.graph, p.state.ascendantId)[0]?.id;
  if (!viewer) return null;
  const reading = getReputationWith(ctx.graph, viewer, p.node.id);
  if (reading.source === 'default') return null;
  const section: PanelSection = {
    kind: 'panel', typeId: 'standing', label: SUBJECT_ROW_LABELS.standing, gold: false, tier: 'routine', source: 'getReputationWith',
    rows: [{ left: SUBJECT_FACT_WORDS.yourReputation, right: reading.band, tooltipId: 'ui.reputation_with' }],
  };
  return section;
};

function isSphereName(v: unknown): v is SphereName {
  return typeof v === 'string' && (SPHERE_NAMES as readonly string[]).includes(v);
}

/** A Place of Power's reading (THR-153 / THR-1104): holder, stream, origin, the god's marks. */
const placeOfPower: SectionResolver = (ctx) => {
  const p = placeOf(ctx);
  if (!p || p.node.properties.locationSubtype !== 'place_of_power') return null;
  const props = p.node.properties;
  let holder: { node: GraphNode; type: string; edge: Record<string, unknown> } | null = null;
  for (const a of ctx.graph.getNodesByType('actor')) {
    const hit = ctx.graph.getOutgoingEdges(a.id, 'holds_place_of_power').find(e => e.target === p.node.id);
    if (hit) {
      holder = { node: a, type: (hit.properties.holderType as string | undefined) ?? 'actor', edge: hit.properties as Record<string, unknown> };
      break;
    }
  }
  const sphere = isSphereName(props.popSphere) ? props.popSphere : PLACE_OF_POWER_LINES.essence;
  const rows: PanelRow[] = [];
  rows.push(holder
    ? { left: SUBJECT_FACT_WORDS.holder, right: holder.node.name, ...(holder.type === 'actor' ? { ref: { kind: 'agent' as const, id: holder.node.id, name: holder.node.name } } : {}) }
    : { left: SUBJECT_FACT_WORDS.holder, right: PLACE_OF_POWER_LINES.noOne });
  rows.push(props.popStreamDead === true
    ? { left: SUBJECT_FACT_WORDS.stream, right: 'Dormant' }
    : {
        left: SUBJECT_FACT_WORDS.stream,
        right: `${sentenceCase(getStreamYieldWord((props.popEssencePerTick as number | undefined) ?? 0))} of ${sphere}, fading ${getDurationWord((props.popStreamDecayCountdown as number | undefined) ?? 0)}`,
        ...(isSphereName(props.popSphere) ? { tooltipId: `sphere.${props.popSphere}` } : {}),
      });
  const from = props.transformedFromRuinId as string | undefined;
  if (from) rows.push({ left: SUBJECT_FACT_WORDS.origin, right: ctx.graph.getNode(from)?.name ?? PLACE_OF_POWER_LINES.fallenRuin });
  if (holder?.edge.corruptMark === true) rows.push({ left: PLACE_OF_POWER_LINES.corrupt, right: PLACE_OF_POWER_LINES.corruptLine, sentiment: 'negative' });
  if (holder?.edge.bargainFavor === true) rows.push({ left: PLACE_OF_POWER_LINES.bound, right: PLACE_OF_POWER_LINES.boundLine, sentiment: 'positive' });
  const section: PanelSection = { kind: 'panel', typeId: 'place_of_power', label: SUBJECT_ROW_LABELS.placeOfPower, gold: false, tier: 'routine', source: 'placeOfPower', rows };
  return section;
};

/**
 * An Area's facts (HexSidebar): size word, feature word, its danger and its sphere
 * strengths, each strength a word beside the bar the sidebar drew (Law 13: never a numeral).
 * Danger and spheres are the means over the Area's own tiles.
 */
const areaFacts: SectionResolver = (ctx) => {
  const p = placeOf(ctx, true);
  if (!p || p.node.type !== 'region') return null;
  const rows: PanelRow[] = [];
  const hexCount = p.node.properties.hexCount;
  if (typeof hexCount === 'number' && hexCount > 0) rows.push({ left: SUBJECT_FACT_WORDS.size, right: areaSizeWord(hexCount) });
  const feature = p.node.properties.featureType;
  if (typeof feature === 'string' && feature) rows.push({ left: SUBJECT_FACT_WORDS.feature, right: areaFeatureWord(feature) });
  const tiles = (p.state.tiles ?? []).filter(t => t.regionId === p.node.id);
  if (tiles.length > 0) {
    const danger = tiles.reduce((s, t) => s + (t.dangerLevel ?? 0), 0) / tiles.length;
    rows.push({ left: SUBJECT_FACT_WORDS.danger, right: positionalDangerWord(danger), tooltipId: 'ui.land.danger' });
    const sums: Partial<Record<SphereName, number>> = {};
    for (const t of tiles) {
      const inf = getHexSphereInfluence(ctx.graph, t.coord.col, t.coord.row) as Partial<Record<SphereName, number>>;
      for (const [sphere, v] of Object.entries(inf ?? {})) {
        if (typeof v === 'number' && v > 0) sums[sphere as SphereName] = (sums[sphere as SphereName] ?? 0) + v;
      }
    }
    const bars = (Object.entries(sums) as [SphereName, number][])
      .map(([s, v]) => [s, v / tiles.length] as const)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, AREA_SPHERE_ROWS_MAX);
    for (const [sphere, v] of bars) rows.push({ left: sentenceCase(sphere), right: sphereStrengthWord(v), meter: Math.min(1, v), tooltipId: `sphere.${sphere}` });
  }
  if (rows.length === 0) return null;
  const section: PanelSection = { kind: 'panel', typeId: 'area_facts', label: SUBJECT_ROW_LABELS.areaFacts, gold: false, tier: 'routine', source: 'areaFacts', rows };
  return section;
};

// ─── Here now ────────────────────────────────────────────────────────────────

/** The guild hall's ruin contracts (GuildQuestPanel). Distance in words, never hexes. */
const guildPostings: SectionResolver = (ctx) => {
  const p = placeOf(ctx);
  if (!p) return null;
  const postings = selectGuildPostings(ctx.graph, p.node.id, ctx.tick);
  if (!postings.hasGuildHall) return null;
  if (postings.rows.length === 0) {
    const line = postings.postsRuinContracts ? GUILD_POSTING_LINES.quiet : GUILD_POSTING_LINES.notThisBoard.replace('{guild}', ADVENTURING_GUILD_LABEL);
    return prose('guild_postings', SUBJECT_ROW_LABELS.guildPostings, line, 'selectGuildPostings');
  }
  const tiles: CardTile[] = postings.rows.map(r => ({
    ref: { kind: 'location', id: r.ruinId, name: r.ruinName },
    title: r.questName,
    kindWord: r.tier,
    lines: [GUILD_POSTING_LINES.where.replace('{ruin}', r.ruinName).replace('{direction}', r.direction).replace('{distance}', postingDistanceWord(r.distance))],
  }));
  const section: CardsSection = { kind: 'cards', typeId: 'guild_postings', label: SUBJECT_ROW_LABELS.guildPostings, gold: false, tier: 'routine', source: 'selectGuildPostings', tiles };
  return section;
};

/**
 * What is under way here, and what could happen here (LocationView's Encounters column).
 * Under way: the unified actions (else legacy progress) of the people standing here.
 * Could happen: the templates this place's kind and its Places' kinds offer. Raw
 * `crudType` and `reach` are worded; the step number goes (Law 14).
 */
const encountersHere: SectionResolver = (ctx) => {
  const p = placeOf(ctx);
  if (!p) return null;
  const graph = ctx.graph;
  const here = (actorId: string) => graph.getOutgoingEdges(actorId, 'located_at').some(e => e.target === p.node.id);
  const nameOf = (id: string) => graph.getNode(id)?.name ?? id;
  const under = new Map<string, string>();
  for (const progress of p.state.encounterProgress ?? []) {
    if (progress.status !== 'active' || !here(progress.actorId)) continue;
    const t = getUnifiedTemplateById(progress.encounterId);
    if (t) under.set(progress.actorId, t.name);
  }
  for (const action of p.state.unifiedActions ?? []) {
    if (action.resolved || !here(action.actorId)) continue;
    const t = getUnifiedTemplateById(action.templateId);
    if (t) under.set(action.actorId, t.name);
  }
  const entries: EventEntry[] = [...under.entries()].map(([actorId, name]) => ({
    whenLabel: ENCOUNTERS_HERE_WORDS.under,
    prose: ENCOUNTERS_HERE_WORDS.activeLine.replace('{who}', nameOf(actorId)).replace('{name}', name),
  }));
  const subtype = typeof p.node.properties.locationSubtype === 'string' ? p.node.properties.locationSubtype : '';
  if (subtype) {
    const subTypes = (SUBTYPE_SUBLOCATION_MAP[subtype] ?? []).map(d => d.id);
    for (const t of getEncountersForLocation(subtype, subTypes)) {
      entries.push({
        whenLabel: ENCOUNTERS_HERE_WORDS.open,
        prose: ENCOUNTERS_HERE_WORDS.availableLine
          .replace('{name}', t.name)
          .replace('{kind}', ENCOUNTER_KIND_WORDS[t.crudType] ?? 'happening')
          .replace('{reach}', reachDisplayName(t.reach)),
      });
    }
  }
  const section: EventCardSection = {
    kind: 'event-card', typeId: 'encounters_here', label: SUBJECT_ROW_LABELS.encountersHere, gold: false, tier: 'routine', source: 'encountersHere',
    whenLabel: '', prose: entries.length === 0 ? ENCOUNTERS_HERE_WORDS.none : '', entries,
  };
  return section;
};

/**
 * Names joined as linked parts, `PilgrimWayLine`'s order: one entry per distinct far end,
 * id-sorted (NFP #3); a dangling end is skipped.
 */
export function pilgrimWayParts(
  graph: SectionResolverContext['graph'],
  ids: readonly string[],
  refKind: 'faction' | 'location',
  lead: string,
): ProsePart[] {
  const named = [...new Set(ids)].sort()
    .map(id => graph.getNode(id))
    .filter((n): n is GraphNode => n !== undefined && typeof n.name === 'string' && n.name.length > 0);
  if (named.length === 0) return [];
  const parts: ProsePart[] = [lead];
  named.forEach((n, i) => {
    if (i > 0) parts.push(PILGRIM_WAY_LINES.joiner);
    parts.push({ text: n.name, ref: { kind: refKind, id: n.id } });
  });
  parts.push(PILGRIM_WAY_LINES.tail);
  return parts;
}

/**
 * The pilgrim way to this town (THR-1992): the congregations whose pilgrims come here,
 * each a link — `PilgrimWayLine`'s site line, restored. The line is the `sacred_route`
 * edges (Law 56); a town no way reaches has no row (Law 25). Never a count.
 */
const pilgrimWay: SectionResolver = (ctx) => {
  const p = placeOf(ctx);
  if (!p) return null;
  const ids = selectPilgrimWays(ctx.graph).filter(w => w.siteId === p.node.id).map(w => w.congregationId);
  const parts = pilgrimWayParts(ctx.graph, ids, 'faction', PILGRIM_WAY_LINES.siteLead);
  return linkedProseSection('pilgrim_way', SUBJECT_ROW_LABELS.pilgrimWays, parts, 'selectPilgrimWays', { labelTooltipId: 'ui.pilgrim_way' });
};

const LAIR_SUBTYPES: ReadonlySet<string> = new Set(['lair', 'cleared_lair']);

/**
 * The lair's monster card (THR-1992): `LairMonsterCard`'s name, Dread/Might sentence,
 * square clock pips and word, and "slain by {name}" — restored from the retired hex
 * sidebar. Read through `buildLairMonsterCardModel`, the one model, so this row and
 * `window.__DEBUG.getLairMonsterCard` agree. No monster resolves → no row.
 */
const lairMonster: SectionResolver = (ctx) => {
  const p = placeOf(ctx);
  if (!p || !LAIR_SUBTYPES.has(String(p.node.properties.locationSubtype))) return null;
  let model: ReturnType<typeof buildLairMonsterCardModel> = null;
  try {
    model = buildLairMonsterCardModel(ctx.graph, p.node.id, ctx.tick, p.state.ascendantId ?? '');
  } catch {
    return null;
  }
  const m = model?.monster;
  if (!m) return null;
  const tile: CardTile = {
    ref: { kind: 'agent', id: m.id, name: m.name },
    title: m.name,
    kindWord: m.deceased ? LAIR_MONSTER_WORDS.kindSlain : LAIR_MONSTER_WORDS.kindLiving,
    lines: [m.sentenceText],
    clock: { size: m.clock.size, filled: m.clock.filled, word: m.clock.word, wordTooltipId: m.clock.wordTooltipId, ariaLabel: m.clock.ariaLabel },
    ...(m.slainBy
      ? m.slainById
        ? { byLine: { lead: LAIR_MONSTER_WORDS.slainByLead, name: m.slainBy, ref: { kind: 'agent' as const, id: m.slainById, name: m.slainBy } } }
        : { lines: [m.sentenceText, `${LAIR_MONSTER_WORDS.slainByLead} ${m.slainBy}`] }
      : {}),
  };
  const section: CardsSection = { kind: 'cards', typeId: 'lair_monster', label: SUBJECT_ROW_LABELS.lairMonster, gold: false, tier: 'routine', source: 'buildLairMonsterCardModel', tiles: [tile], labelTooltipId: 'ui.lair_monster' };
  return section;
};

/** The place rows, by `typeId` (the registry's `placeRow` reads this). */
export const PLACE_ROW_RESOLVERS = {
  place_prose: placeProse,
  past_line: pastLine,
  fortunes,
  founded_by: foundedBy,
  prayer,
  livelihood,
  contested,
  walls,
  conditions_here: conditionsHere,
  standing,
  place_of_power: placeOfPower,
  area_facts: areaFacts,
  guild_postings: guildPostings,
  encounters_here: encountersHere,
  pilgrim_way: pilgrimWay,
  lair_monster: lairMonster,
} satisfies Record<string, SectionResolver>;
