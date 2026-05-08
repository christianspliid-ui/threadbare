/**
 * Detail page section resolvers — graph-walking functions that produce typed Section blocks.
 *
 * Design doc: Docs/plans/2026-05-06-detail-page-data-model.md §4
 *
 * Each resolver takes a `SectionResolverContext` and returns a single `Section` or
 * `null`. Returning null means "skip this section" — non-mandatory rows are dropped;
 * mandatory rows fall through to the per-page fallback resolver.
 *
 * Resolvers are pure reads of the graph + encounter context. No graph mutations,
 * no side effects. Safe to call from React render path.
 *
 * Determinism (NFP #3): each resolver derives its PRNG seed from
 * `(world seed XOR nodeId hash XOR sectionTypeId hash XOR tick)`. The shared helper
 * `seedFor(ctx, sectionTypeId)` produces this number.
 */

import type {
  ChipDescriptor,
  ChipsSection,
  DetailPageKind,
  EventCardSection,
  PanelSection,
  PortraitSection,
  ProseSection,
  Section,
} from '../types/detailPage';
import type { GraphNode } from '../types/graph';
import type { WorldGraph } from './graph';
import {
  getAgentEncounterHistory,
  getLocationEncounterHistory,
} from './encounterEventNode';
import {
  ACTOR_FALLBACK_TEMPLATES,
  EVENT_FALLBACK_TEMPLATES,
  FACTION_FALLBACK_TEMPLATES,
  ITEM_FALLBACK_TEMPLATES,
  PLACE_FALLBACK_TEMPLATES,
} from '../data/detail-page-fallback-templates';

// ─── Resolver context ─────────────────────────────────────────────────────────

/** Context shared across all section resolvers for a single detail page resolve. */
export interface SectionResolverContext {
  /** The node being detailed. */
  nodeId: string;
  /** Page type (so multi-purpose resolvers can branch). */
  pageKind: DetailPageKind;
  /** World graph (read-only). */
  graph: WorldGraph;
  /** Seeded PRNG seed for deterministic prose pick. */
  seed: number;
  /** Current tick for cache + tier escalation. */
  tick: number;
  /** Active encounter context, if any (drives "tilts this scene" / callbacks). */
  encounterContext?: {
    encounterId: string;
    beatIndex: number;
    protagonistId: string;
  };
  /** Protagonist's nodeId — drives all "to her" / "toward him" framings. */
  protagonistId?: string;
}

/** A section resolver returns 0 or 1 section. Returning null = "skip this section". */
export type SectionResolver = (ctx: SectionResolverContext) => Section | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261 | 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

/** Compose the per-section seed from world seed + node + section type + tick. */
export function seedFor(ctx: SectionResolverContext, sectionTypeId: string): number {
  return (ctx.seed ^ hashString(ctx.nodeId) ^ hashString(sectionTypeId) ^ (ctx.tick | 0)) >>> 0;
}

function pickFrom<T>(items: readonly T[], seed: number): T | undefined {
  if (items.length === 0) return undefined;
  const rng = mulberry32(seed);
  return items[Math.floor(rng() * items.length)];
}

/** Trivial placeholder substitution. Authors only. Quietly leaves `{x}` literal if no value. */
export function fillPlaceholders(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, key) => (key in values ? values[key] : m));
}

/** Read top sphere from a node's `sphereInfluence` map, default 'force'. */
function topSphere(node: GraphNode | null | undefined): string {
  if (!node) return 'force';
  const influence = node.properties?.sphereInfluence as Record<string, number> | undefined;
  if (!influence) {
    const single = node.properties?.sphere as string | undefined;
    return single ?? 'force';
  }
  let best = 'force';
  let max = -Infinity;
  for (const [k, v] of Object.entries(influence)) {
    if (v > max) {
      max = v;
      best = k;
    }
  }
  return best;
}

/** Coerce a node's "kind" for click-through routing. */
function nodeRefKindFor(node: GraphNode | null | undefined): DetailPageKind | null {
  if (!node) return null;
  switch (node.type) {
    case 'actor':
      return node.properties?.actorType === 'faction' ? 'faction' : 'actor';
    case 'location':
    case 'region':
      return 'place';
    case 'event':
      return 'event';
    case 'artifact':
    case 'artifact_legendary':
      return 'item';
    default:
      return null;
  }
}

/** Compose a "47 turns ago" style label from a tick stamp. */
function whenLabelFor(eventNode: GraphNode, currentTick: number, placeName?: string): string {
  const eventTick = (eventNode.properties?.tick as number) ?? currentTick;
  const delta = Math.max(0, currentTick - eventTick);
  const deltaLabel =
    delta === 0 ? 'NOW' : delta === 1 ? '1 TURN AGO' : `${delta} TURNS AGO`;
  return placeName ? `${deltaLabel} · ${placeName.toUpperCase()}` : deltaLabel;
}

// ─── Actor resolvers ──────────────────────────────────────────────────────────

const portraitWithDispositionResolver: SectionResolver = (ctx) => {
  const node = ctx.graph.getNode(ctx.nodeId);
  if (!node || node.type !== 'actor') return null;

  const sphere = topSphere(node);
  const portraitUrl = node.properties?.portraitUrl as string | undefined;

  // Disposition prose: try a stored disposition phrase first, then fall back.
  const dispositionPhrase = node.properties?.dispositionPhrase as string | undefined;
  let bodyProse = dispositionPhrase;
  if (!bodyProse) {
    const protagonist = ctx.protagonistId ? ctx.graph.getNode(ctx.protagonistId) : null;
    const hasShared = protagonist
      ? getAgentEncounterHistory(ctx.graph, ctx.nodeId, 5).some((evt) => {
          const participants = (evt.properties?.participantIds as string[] | undefined) ?? [];
          return participants.includes(protagonist.id);
        })
      : false;
    const pool = hasShared
      ? ACTOR_FALLBACK_TEMPLATES.disposition_known_no_recent
      : ACTOR_FALLBACK_TEMPLATES.disposition_no_history;
    const tpl = pickFrom(pool, seedFor(ctx, 'portrait_with_disposition'));
    if (tpl) bodyProse = fillPlaceholders(tpl, { Name: node.name });
  }

  const section: PortraitSection = {
    kind: 'portrait',
    typeId: 'portrait_with_disposition',
    label: 'DISPOSITION TOWARD HER',
    gold: true,
    tier: 'routine',
    source: 'portraitWithDispositionResolver',
    portraitRef: { url: portraitUrl, subject: node.name, sphere },
    bodyProse,
  };
  return section;
};

const whatSheIsToHimResolver: SectionResolver = (ctx) => {
  if (!ctx.protagonistId) return null;
  const actor = ctx.graph.getNode(ctx.nodeId);
  const protagonist = ctx.graph.getNode(ctx.protagonistId);
  if (!actor || !protagonist) return null;

  // Look for a relates_to edge in either direction.
  const out = ctx.graph.getOutgoingEdges(actor.id, 'relates_to');
  const incoming = ctx.graph.getIncomingEdges(actor.id, 'relates_to');
  const related = [...out, ...incoming].find(
    (e) => e.source === protagonist.id || e.target === protagonist.id,
  );
  if (!related) return null;

  const basis = (related.properties?.basis as string | undefined) ?? 'a thread between you';
  const sentiment = (related.properties?.sentiment as number | undefined) ?? 0;
  const phrase =
    sentiment > 0.2
      ? 'is bound to you by'
      : sentiment < -0.2
        ? 'stands against you over'
        : 'shares with you';

  const prose = `${actor.name} ${phrase} ${basis}.`;

  const section: ProseSection = {
    kind: 'prose',
    typeId: 'what_she_is_to_him',
    label: 'WHAT SHE IS TO HIM',
    gold: false,
    tier: 'routine',
    source: 'whatSheIsToHimResolver',
    prose,
  };
  return section;
};

const threadsBetweenThemResolver: SectionResolver = (ctx) => {
  if (!ctx.protagonistId) return null;
  const actor = ctx.graph.getNode(ctx.nodeId);
  if (!actor) return null;

  const out = ctx.graph.getOutgoingEdges(actor.id, 'relates_to');
  const incoming = ctx.graph.getIncomingEdges(actor.id, 'relates_to');
  const all = [...out, ...incoming];
  if (all.length === 0) return null;

  const chips: ChipDescriptor[] = [];
  for (const edge of all.slice(0, 6)) {
    const otherId = edge.source === actor.id ? edge.target : edge.source;
    const other = ctx.graph.getNode(otherId);
    if (!other) continue;
    const basis = (edge.properties?.basis as string | undefined) ?? 'thread';
    const sentiment = (edge.properties?.sentiment as number | undefined) ?? 0;
    chips.push({
      label: other.name,
      flavour: basis,
      sphere: topSphere(other),
      sentiment: sentiment > 0.2 ? 'positive' : sentiment < -0.2 ? 'negative' : 'neutral',
      clickRef: nodeRefKindFor(other) ? { nodeId: other.id, pageKind: nodeRefKindFor(other)! } : undefined,
    });
  }
  if (chips.length === 0) return null;

  const section: ChipsSection = {
    kind: 'chips',
    typeId: 'threads_between_them',
    label: 'THREADS BETWEEN THEM',
    gold: false,
    tier: 'routine',
    source: 'threadsBetweenThemResolver',
    chips,
  };
  return section;
};

const recentEncountersResolver: SectionResolver = (ctx) => {
  const events = getAgentEncounterHistory(ctx.graph, ctx.nodeId, 1);
  if (events.length === 0) return null;
  const evt = events[0];

  const placeId = evt.properties?.locationId as string | undefined;
  const placeNode = placeId ? ctx.graph.getNode(placeId) : null;
  const placeName = placeNode?.name;

  const summary = (evt.properties?.summary as string | undefined) ?? evt.name ?? 'A passing exchange.';

  const section: EventCardSection = {
    kind: 'event-card',
    typeId: 'recent_encounters',
    label: 'RECENT ENCOUNTERS',
    gold: false,
    tier: 'routine',
    source: 'recentEncountersResolver',
    whenLabel: whenLabelFor(evt, ctx.tick, placeName),
    prose: summary,
    eventRef: { nodeId: evt.id, pageKind: 'event' },
  };
  return section;
};

const factionAllegiancesResolver: SectionResolver = (ctx) => {
  const actor = ctx.graph.getNode(ctx.nodeId);
  if (!actor) return null;
  const edges = ctx.graph.getOutgoingEdges(actor.id, 'member_of');
  if (edges.length === 0) return null;

  const chips: ChipDescriptor[] = [];
  for (const edge of edges.slice(0, 6)) {
    const faction = ctx.graph.getNode(edge.target);
    if (!faction) continue;
    const rank = (edge.properties?.rank as string | undefined) ?? undefined;
    chips.push({
      label: faction.name,
      flavour: rank,
      sphere: topSphere(faction),
      clickRef: { nodeId: faction.id, pageKind: 'faction' },
    });
  }
  if (chips.length === 0) return null;

  const section: ChipsSection = {
    kind: 'chips',
    typeId: 'faction_allegiances',
    label: 'FACTION ALLEGIANCES',
    gold: false,
    tier: 'routine',
    source: 'factionAllegiancesResolver',
    chips,
  };
  return section;
};

const notableCapabilitiesResolver: SectionResolver = (ctx) => {
  const actor = ctx.graph.getNode(ctx.nodeId);
  if (!actor) return null;
  const reaches = actor.properties?.reaches as Record<string, number> | undefined;
  if (!reaches) return null;

  // Pick reaches >= 0.6 — "notable" in the colloquial sense.
  const NOTABLE_REACH_THRESHOLD = 0.6;
  const entries = Object.entries(reaches)
    .filter(([, v]) => typeof v === 'number' && v >= NOTABLE_REACH_THRESHOLD)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  if (entries.length === 0) return null;

  const chips: ChipDescriptor[] = entries.map(([reach, value]) => ({
    label: reach,
    flavour: value >= 0.85 ? 'mastery' : value >= 0.7 ? 'strong' : 'capable',
  }));

  const section: ChipsSection = {
    kind: 'chips',
    typeId: 'notable_capabilities',
    label: 'NOTABLE CAPABILITIES',
    gold: false,
    tier: 'routine',
    source: 'notableCapabilitiesResolver',
    chips,
  };
  return section;
};

// ─── Item resolvers ───────────────────────────────────────────────────────────

const iconWithMeaningResolver: SectionResolver = (ctx) => {
  const item = ctx.graph.getNode(ctx.nodeId);
  if (!item) return null;
  const isItem = item.type === 'artifact' || item.type === 'artifact_legendary';
  if (!isItem) return null;

  const sphere = topSphere(item);
  const category = (item.properties?.category as string | undefined) ?? 'artifact';
  const iconUrl = item.properties?.iconUrl as string | undefined;

  let bodyProse = item.properties?.flavorText as string | undefined;
  if (!bodyProse) {
    const tpl = pickFrom(ITEM_FALLBACK_TEMPLATES.meaning_basic, seedFor(ctx, 'icon_with_meaning'));
    if (tpl) bodyProse = fillPlaceholders(tpl, { Name: item.name, category, sphere });
  }

  const section: PortraitSection = {
    kind: 'portrait',
    typeId: 'icon_with_meaning',
    label: 'WHAT IT MEANS HERE',
    gold: true,
    tier: 'routine',
    source: 'iconWithMeaningResolver',
    portraitRef: { url: iconUrl, subject: item.name, sphere },
    bodyProse,
  };
  return section;
};

const whoGaveItResolver: SectionResolver = (ctx) => {
  const item = ctx.graph.getNode(ctx.nodeId);
  if (!item) return null;
  const edges = ctx.graph.getIncomingEdges(item.id, 'possesses');
  if (edges.length === 0) {
    const tpl = pickFrom(ITEM_FALLBACK_TEMPLATES.acquisition_unknown, seedFor(ctx, 'who_gave_it'));
    if (!tpl) return null;
    const section: ProseSection = {
      kind: 'prose',
      typeId: 'who_gave_it',
      label: 'HOW IT CAME TO HER',
      gold: false,
      tier: 'routine',
      source: 'whoGaveItResolver.fallback',
      prose: tpl,
    };
    return section;
  }

  const possessor = ctx.graph.getNode(edges[0].source);
  const giverName = possessor?.name ?? 'an unknown hand';
  const prose = `${giverName} placed it in her keeping.`;

  const section: ProseSection = {
    kind: 'prose',
    typeId: 'who_gave_it',
    label: 'HOW IT CAME TO HER',
    gold: false,
    tier: 'routine',
    source: 'whoGaveItResolver',
    prose,
  };
  return section;
};

const howItTiltsThisSceneResolver: SectionResolver = (ctx) => {
  const item = ctx.graph.getNode(ctx.nodeId);
  if (!item) return null;
  if (!ctx.encounterContext) return null;

  // Without a concrete impact model in v1, surface a bland routine line
  // when the item declares a `sceneModifier` property; otherwise skip.
  const modifier = item.properties?.sceneModifier as
    | { phrase?: string; magnitude?: number }
    | undefined;
  if (!modifier?.phrase) return null;

  const decisive = (modifier.magnitude ?? 0) >= 0.3;
  const section: ProseSection = {
    kind: 'prose',
    typeId: 'how_it_tilts_this_scene',
    label: 'HOW IT TILTS THIS SCENE',
    gold: false,
    tier: decisive ? 'notable' : 'routine',
    source: 'howItTiltsThisSceneResolver',
    prose: decisive ? `Decisive — ${modifier.phrase}.` : modifier.phrase,
  };
  return section;
};

const previousUsesResolver: SectionResolver = (ctx) => {
  const item = ctx.graph.getNode(ctx.nodeId);
  if (!item) return null;
  const usedIn = ctx.graph.getIncomingEdges(item.id, 'used_in');
  if (usedIn.length === 0) return null;
  const chips: ChipDescriptor[] = [];
  for (const edge of usedIn.slice(0, 4)) {
    const evt = ctx.graph.getNode(edge.source);
    if (!evt) continue;
    chips.push({
      label: evt.name,
      sphere: topSphere(evt),
      clickRef: { nodeId: evt.id, pageKind: 'event' },
    });
  }
  if (chips.length === 0) return null;

  const section: ChipsSection = {
    kind: 'chips',
    typeId: 'previous_uses',
    label: 'PREVIOUS USES',
    gold: false,
    tier: 'routine',
    source: 'previousUsesResolver',
    chips,
  };
  return section;
};

// ─── Faction resolvers ────────────────────────────────────────────────────────

const howTheyHoldHerResolver: SectionResolver = (ctx) => {
  const faction = ctx.graph.getNode(ctx.nodeId);
  if (!faction || faction.type !== 'actor' || faction.properties?.actorType !== 'faction') return null;

  let prose: string | undefined;
  if (ctx.protagonistId) {
    const reps = (faction.properties?.reputations as Record<string, { phrase?: string; sentiment?: number }> | undefined) ?? {};
    const rep = reps[ctx.protagonistId];
    if (rep?.phrase) prose = rep.phrase;
  }
  if (!prose) {
    const tpl = pickFrom(FACTION_FALLBACK_TEMPLATES.no_reputation, seedFor(ctx, 'how_they_hold_her'));
    prose = tpl ?? 'They have not yet noticed her.';
  }

  const section: ProseSection = {
    kind: 'prose',
    typeId: 'how_they_hold_her',
    label: 'HOW THEY HOLD HER',
    gold: true,
    tier: 'routine',
    source: 'howTheyHoldHerResolver',
    prose,
  };
  return section;
};

const alliedWithResolver: SectionResolver = (ctx) => {
  const faction = ctx.graph.getNode(ctx.nodeId);
  if (!faction) return null;
  const edges = [
    ...ctx.graph.getOutgoingEdges(faction.id, 'relates_to'),
    ...ctx.graph.getIncomingEdges(faction.id, 'relates_to'),
  ];
  const allies = edges.filter((e) => ((e.properties?.sentiment as number | undefined) ?? 0) > 0.2);
  if (allies.length === 0) return null;
  const chips: ChipDescriptor[] = [];
  for (const edge of allies.slice(0, 6)) {
    const otherId = edge.source === faction.id ? edge.target : edge.source;
    const other = ctx.graph.getNode(otherId);
    if (!other) continue;
    chips.push({
      label: other.name,
      sphere: topSphere(other),
      sentiment: 'positive',
      clickRef: nodeRefKindFor(other) ? { nodeId: other.id, pageKind: nodeRefKindFor(other)! } : undefined,
    });
  }
  if (chips.length === 0) return null;
  const section: ChipsSection = {
    kind: 'chips',
    typeId: 'allied_with',
    label: 'ALLIED WITH',
    gold: false,
    tier: 'routine',
    source: 'alliedWithResolver',
    chips,
  };
  return section;
};

const opposedResolver: SectionResolver = (ctx) => {
  const faction = ctx.graph.getNode(ctx.nodeId);
  if (!faction) return null;
  const hostile = [
    ...ctx.graph.getOutgoingEdges(faction.id, 'hostile_to'),
    ...ctx.graph.getIncomingEdges(faction.id, 'hostile_to'),
  ];
  if (hostile.length === 0) return null;
  const chips: ChipDescriptor[] = [];
  for (const edge of hostile.slice(0, 6)) {
    const otherId = edge.source === faction.id ? edge.target : edge.source;
    const other = ctx.graph.getNode(otherId);
    if (!other) continue;
    chips.push({
      label: other.name,
      sphere: topSphere(other),
      sentiment: 'negative',
      clickRef: nodeRefKindFor(other) ? { nodeId: other.id, pageKind: nodeRefKindFor(other)! } : undefined,
    });
  }
  if (chips.length === 0) return null;
  const section: ChipsSection = {
    kind: 'chips',
    typeId: 'opposed',
    label: 'OPPOSED',
    gold: false,
    tier: 'routine',
    source: 'opposedResolver',
    chips,
  };
  return section;
};

const reputationsTheyHoldResolver: SectionResolver = (ctx) => {
  const faction = ctx.graph.getNode(ctx.nodeId);
  if (!faction) return null;
  const reps = faction.properties?.reputations as
    | Record<string, { phrase?: string; sentiment?: number }>
    | undefined;
  const rows: PanelSection['rows'] = [];
  if (reps) {
    for (const [targetId, value] of Object.entries(reps)) {
      const target = ctx.graph.getNode(targetId);
      if (!target) continue;
      const sentiment = value.sentiment ?? 0;
      rows.push({
        left: target.name,
        right: value.phrase ?? (sentiment > 0.2 ? 'allied' : sentiment < -0.2 ? 'opposed' : 'neutral'),
        sentiment: sentiment > 0.2 ? 'positive' : sentiment < -0.2 ? 'negative' : 'neutral',
      });
    }
  }
  if (rows.length === 0) {
    rows.push({ left: '—', right: 'no reputations recorded', sentiment: 'neutral' });
  }
  const section: PanelSection = {
    kind: 'panel',
    typeId: 'reputations_they_hold',
    label: 'REPUTATIONS THEY HOLD',
    gold: false,
    tier: 'routine',
    source: 'reputationsTheyHoldResolver',
    rows: rows.slice(0, 8),
  };
  return section;
};

const recentActionsResolver: SectionResolver = (ctx) => {
  const faction = ctx.graph.getNode(ctx.nodeId);
  if (!faction) return null;
  const events = getAgentEncounterHistory(ctx.graph, faction.id, 1);
  if (events.length === 0) return null;
  const evt = events[0];

  const placeId = evt.properties?.locationId as string | undefined;
  const placeNode = placeId ? ctx.graph.getNode(placeId) : null;

  const summary = (evt.properties?.summary as string | undefined) ?? evt.name ?? 'A move that left a mark.';

  const section: EventCardSection = {
    kind: 'event-card',
    typeId: 'recent_actions',
    label: 'RECENT ACTIONS',
    gold: false,
    tier: 'routine',
    source: 'recentActionsResolver',
    whenLabel: whenLabelFor(evt, ctx.tick, placeNode?.name),
    prose: summary,
    eventRef: { nodeId: evt.id, pageKind: 'event' },
  };
  return section;
};

// ─── Place resolvers ──────────────────────────────────────────────────────────

const placePaintingResolver: SectionResolver = (ctx) => {
  const place = ctx.graph.getNode(ctx.nodeId);
  if (!place || (place.type !== 'location' && place.type !== 'region')) return null;
  const sphere = topSphere(place);
  const paintingUrl = place.properties?.paintingUrl as string | undefined;
  const section: PortraitSection = {
    kind: 'portrait',
    typeId: 'place_painting',
    label: place.name.toUpperCase(),
    gold: false,
    tier: 'routine',
    source: 'placePaintingResolver',
    portraitRef: { url: paintingUrl, subject: place.name, sphere },
  };
  return section;
};

const whatThisPlaceWantsResolver: SectionResolver = (ctx) => {
  const place = ctx.graph.getNode(ctx.nodeId);
  if (!place) return null;
  const sphere = topSphere(place);
  let prose = place.properties?.flavorText as string | undefined;
  if (!prose) {
    const tpl = pickFrom(PLACE_FALLBACK_TEMPLATES.wants_basic, seedFor(ctx, 'what_this_place_wants'));
    if (tpl) prose = fillPlaceholders(tpl, { Name: place.name, sphere });
  }
  if (!prose) return null;

  const section: ProseSection = {
    kind: 'prose',
    typeId: 'what_this_place_wants',
    label: 'WHAT THIS PLACE WANTS',
    gold: true,
    tier: 'routine',
    source: 'whatThisPlaceWantsResolver',
    prose,
  };
  return section;
};

const conditionsHereResolver: SectionResolver = (ctx) => {
  const place = ctx.graph.getNode(ctx.nodeId);
  if (!place) return null;
  const conditions = (place.properties?.conditions as string[] | undefined) ?? [];
  if (conditions.length === 0) return null;

  const chips: ChipDescriptor[] = conditions.slice(0, 8).map((c) => ({ label: c }));
  const section: ChipsSection = {
    kind: 'chips',
    typeId: 'conditions_here',
    label: 'CONDITIONS HERE',
    gold: false,
    tier: 'routine',
    source: 'conditionsHereResolver',
    chips,
  };
  return section;
};

const placeMemoryResolver: SectionResolver = (ctx) => {
  const place = ctx.graph.getNode(ctx.nodeId);
  if (!place) return null;
  const events = getLocationEncounterHistory(ctx.graph, place.id, 1);
  if (events.length === 0) {
    const tpl = pickFrom(PLACE_FALLBACK_TEMPLATES.memory_none, seedFor(ctx, 'memory'));
    if (!tpl) return null;
    const section: ProseSection = {
      kind: 'prose',
      typeId: 'memory',
      label: 'MEMORY',
      gold: false,
      tier: 'routine',
      source: 'placeMemoryResolver.fallback',
      prose: fillPlaceholders(tpl, { Name: place.name }),
    };
    return section;
  }
  const evt = events[0];
  const summary = (evt.properties?.summary as string | undefined) ?? `Something happened here at tick ${evt.properties?.tick ?? '?'}.`;
  const section: ProseSection = {
    kind: 'prose',
    typeId: 'memory',
    label: 'MEMORY',
    gold: false,
    tier: 'routine',
    source: 'placeMemoryResolver',
    prose: summary,
  };
  return section;
};

// ─── Event resolvers ──────────────────────────────────────────────────────────

const whatHappenedResolver: SectionResolver = (ctx) => {
  const evt = ctx.graph.getNode(ctx.nodeId);
  if (!evt || evt.type !== 'event') return null;

  const stored = evt.properties?.proseTier as 'routine' | 'notable' | 'chronicle' | undefined;
  const summary = (evt.properties?.summary as string | undefined) ?? evt.name;
  if (!summary) return null;

  const section: ProseSection = {
    kind: 'prose',
    typeId: 'what_happened',
    label: 'WHAT HAPPENED',
    gold: true,
    tier: stored ?? 'routine',
    source: 'whatHappenedResolver',
    prose: summary,
  };
  return section;
};

const whoWasThereResolver: SectionResolver = (ctx) => {
  const evt = ctx.graph.getNode(ctx.nodeId);
  if (!evt) return null;
  const ids = (evt.properties?.participantIds as string[] | undefined) ?? [];
  if (ids.length === 0) return null;
  const chips: ChipDescriptor[] = [];
  for (const id of ids.slice(0, 6)) {
    const node = ctx.graph.getNode(id);
    if (!node) continue;
    chips.push({
      label: node.name,
      sphere: topSphere(node),
      clickRef: nodeRefKindFor(node) ? { nodeId: node.id, pageKind: nodeRefKindFor(node)! } : undefined,
    });
  }
  if (chips.length === 0) return null;
  const section: ChipsSection = {
    kind: 'chips',
    typeId: 'who_was_there',
    label: 'WHO WAS THERE',
    gold: false,
    tier: 'routine',
    source: 'whoWasThereResolver',
    chips,
  };
  return section;
};

const whatItBecameResolver: SectionResolver = (ctx) => {
  const evt = ctx.graph.getNode(ctx.nodeId);
  if (!evt) return null;
  const consequences = evt.properties?.consequences as string | undefined;
  if (!consequences) return null;
  const section: ProseSection = {
    kind: 'prose',
    typeId: 'what_it_became',
    label: 'WHAT IT BECAME',
    gold: false,
    tier: 'routine',
    source: 'whatItBecameResolver',
    prose: consequences,
  };
  return section;
};

const howItInvokesNowResolver: SectionResolver = (ctx) => {
  const evt = ctx.graph.getNode(ctx.nodeId);
  if (!evt) return null;
  const callbackPhrase = evt.properties?.callbackPhrase as string | undefined;
  if (!callbackPhrase) return null;
  const section: PanelSection = {
    kind: 'panel',
    typeId: 'how_it_invokes_now',
    label: 'HOW IT INVOKES NOW',
    gold: true,
    tier: 'notable',
    source: 'howItInvokesNowResolver',
    rows: [{ left: 'Then', right: callbackPhrase, sentiment: 'neutral' }],
  };
  return section;
};

// ─── Resolver map (re-exported by the registry) ───────────────────────────────

export const ACTOR_RESOLVERS = {
  portrait_with_disposition: portraitWithDispositionResolver,
  what_she_is_to_him: whatSheIsToHimResolver,
  threads_between_them: threadsBetweenThemResolver,
  recent_encounters: recentEncountersResolver,
  faction_allegiances: factionAllegiancesResolver,
  notable_capabilities: notableCapabilitiesResolver,
} satisfies Record<string, SectionResolver>;

export const ITEM_RESOLVERS = {
  icon_with_meaning: iconWithMeaningResolver,
  who_gave_it: whoGaveItResolver,
  how_it_tilts_this_scene: howItTiltsThisSceneResolver,
  previous_uses: previousUsesResolver,
} satisfies Record<string, SectionResolver>;

export const FACTION_RESOLVERS = {
  how_they_hold_her: howTheyHoldHerResolver,
  allied_with: alliedWithResolver,
  opposed: opposedResolver,
  reputations_they_hold: reputationsTheyHoldResolver,
  recent_actions: recentActionsResolver,
} satisfies Record<string, SectionResolver>;

export const PLACE_RESOLVERS = {
  place_painting: placePaintingResolver,
  what_this_place_wants: whatThisPlaceWantsResolver,
  conditions_here: conditionsHereResolver,
  memory: placeMemoryResolver,
} satisfies Record<string, SectionResolver>;

export const EVENT_RESOLVERS = {
  what_happened: whatHappenedResolver,
  who_was_there: whoWasThereResolver,
  what_it_became: whatItBecameResolver,
  how_it_invokes_now: howItInvokesNowResolver,
} satisfies Record<string, SectionResolver>;

// ─── Fallback floor resolvers (mandatory rows when default returns null) ──────

/** Actor fallback: portrait stub even when no disposition data. */
export const actorPortraitFallback: SectionResolver = (ctx) => {
  const actor = ctx.graph.getNode(ctx.nodeId);
  if (!actor) return null;
  const sphere = topSphere(actor);
  const tpl = pickFrom(ACTOR_FALLBACK_TEMPLATES.disposition_no_history, seedFor(ctx, 'portrait_with_disposition'));
  const section: PortraitSection = {
    kind: 'portrait',
    typeId: 'portrait_with_disposition',
    label: 'DISPOSITION TOWARD HER',
    gold: true,
    tier: 'routine',
    source: 'actorPortraitFallback',
    portraitRef: { subject: actor.name, sphere },
    bodyProse: tpl ? fillPlaceholders(tpl, { Name: actor.name }) : actor.name,
  };
  return section;
};

/** Item fallback: icon stub. */
export const itemIconFallback: SectionResolver = (ctx) => {
  const item = ctx.graph.getNode(ctx.nodeId);
  if (!item) return null;
  const sphere = topSphere(item);
  const category = (item.properties?.category as string | undefined) ?? 'artifact';
  const tpl = pickFrom(ITEM_FALLBACK_TEMPLATES.meaning_basic, seedFor(ctx, 'icon_with_meaning'));
  const section: PortraitSection = {
    kind: 'portrait',
    typeId: 'icon_with_meaning',
    label: 'WHAT IT MEANS HERE',
    gold: true,
    tier: 'routine',
    source: 'itemIconFallback',
    portraitRef: { subject: item.name, sphere },
    bodyProse: tpl ? fillPlaceholders(tpl, { Name: item.name, category, sphere }) : item.name,
  };
  return section;
};

/** Faction fallback: a no-reputation prose block. */
export const factionRepFallback: SectionResolver = (ctx) => {
  const tpl = pickFrom(FACTION_FALLBACK_TEMPLATES.no_reputation, seedFor(ctx, 'how_they_hold_her'));
  const section: ProseSection = {
    kind: 'prose',
    typeId: 'how_they_hold_her',
    label: 'HOW THEY HOLD HER',
    gold: true,
    tier: 'routine',
    source: 'factionRepFallback',
    prose: tpl ?? 'They have not yet noticed her.',
  };
  return section;
};

/** Place fallback: a basic "wants" line, used when defaultResolver returns null. */
export const placeWantsFallback: SectionResolver = (ctx) => {
  const place = ctx.graph.getNode(ctx.nodeId);
  if (!place) return null;
  const sphere = topSphere(place);
  const tpl = pickFrom(PLACE_FALLBACK_TEMPLATES.wants_neutral, seedFor(ctx, 'what_this_place_wants'));
  const section: ProseSection = {
    kind: 'prose',
    typeId: 'what_this_place_wants',
    label: 'WHAT THIS PLACE WANTS',
    gold: true,
    tier: 'routine',
    source: 'placeWantsFallback',
    prose: tpl ? fillPlaceholders(tpl, { Name: place.name, sphere }) : '',
  };
  return section;
};

/** Event fallback: a skeletal what-happened block when nothing else resolves. */
export const eventSkeletalFallback: SectionResolver = (ctx) => {
  const evt = ctx.graph.getNode(ctx.nodeId);
  if (!evt) return null;
  const tick = (evt.properties?.tick as number | undefined) ?? ctx.tick;
  const placeId = evt.properties?.locationId as string | undefined;
  const placeNode = placeId ? ctx.graph.getNode(placeId) : null;
  const ids = (evt.properties?.participantIds as string[] | undefined) ?? [];
  const participants = ids
    .map((id) => ctx.graph.getNode(id)?.name)
    .filter((n): n is string => Boolean(n))
    .slice(0, 3)
    .join(', ');

  const tpl = pickFrom(EVENT_FALLBACK_TEMPLATES.skeletal, seedFor(ctx, 'what_happened'));
  const prose = tpl
    ? fillPlaceholders(tpl, {
        tick: String(tick),
        place: placeNode?.name ?? 'an unrecorded place',
        participants: participants || 'unknown figures',
      })
    : evt.name;

  const section: ProseSection = {
    kind: 'prose',
    typeId: 'what_happened',
    label: 'WHAT HAPPENED',
    gold: true,
    tier: 'routine',
    source: 'eventSkeletalFallback',
    prose,
  };
  return section;
};
