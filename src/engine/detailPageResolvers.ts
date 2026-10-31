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
  GraphPageKind,
  PageLayoutKind,
  EventCardSection,
  PanelSection,
  PortraitSection,
  ProseSection,
  Section,
} from '../types/detailPage';
import type { GraphNode } from '../types/graph';
import type { WorldGraph } from './graph';
import { getFactionMembershipEdges } from './graphQueries';
import {
  getAgentEncounterHistory,
  getLocationEncounterHistory,
} from './encounterEventNode';
import { latestBloodshedRecord } from './battleRecord';
import { BLOOD_SOAKED_WINDOW_TICKS } from '../data/location-trait-constants';
import { TICKS_PER_DAY } from '../data/attention-constants';
import {
  ACTOR_BONDED_DISPOSITION_TEMPLATES,
  ACTOR_FALLBACK_TEMPLATES,
  EVENT_FALLBACK_TEMPLATES,
  FACTION_FALLBACK_TEMPLATES,
  GROUP_FALLBACK_TEMPLATES,
  ITEM_FALLBACK_TEMPLATES,
  PLACE_FALLBACK_TEMPLATES,
} from '../data/detail-page-fallback-templates';
import type { GameState } from '../types/gameState';
import type { ContentRef } from '../types/contentRef';
import { elapsedLabel, humanizeKeySegment } from './aftermathWords';
import { getFactionDefinition } from '../data/faction-definition-lookup';
import { computeRankFromReputation } from '../types/faction';
import {
  ARMY_NO_OBJECTIVE_COPY,
  armyObjectiveSentence,
  getArmyCohesionWord,
  getArmySizeName,
  getArmySupplyWord,
} from '../data/army-words';
import { armyAimView } from './warAims/sheetView';
import { ascendantPortraitSrc } from './views/subjects/godSheet';
import { getFamiliarity, getKnowledgeLevel } from './familiarity';
import { resolveEntityVisual } from './views/entityVisualResolver';
import { fillSlots, linkedProseSection } from './views/subjects/linkedProse';

import type { RealmProjection } from './realmProjection';

// ─── Resolver context ─────────────────────────────────────────────────────────

/** Context shared across all section resolvers for a single detail page resolve. */
export interface SectionResolverContext {
  /** The node being detailed. */
  nodeId: string;
  /**
   * Page type (so multi-purpose resolvers can branch). THR-1876 widened it from
   * `GraphPageKind` to the page-layout table's key; graph resolvers still only ever see
   * a graph kind.
   */
  pageKind: PageLayoutKind;
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
  /**
   * THR-1876 (additive): the game state, for rows that read stores rather than the graph
   * (the land, god and record rows). A resolver that needs it and lacks it returns null,
   * so the hover card and graph-only tests stay fail-soft.
   */
  state?: GameState;
  /** THR-1876: the hex a `land` page describes. */
  hex?: { col: number; row: number };
  /** THR-1876: the store record a `record` page describes (a graph event uses `nodeId`). */
  record?: { kind: 'encounter' | 'journey' | 'receipt'; id: string; name?: string };
  /** THR-1876: the content a `content` page describes. */
  contentRef?: ContentRef;
  /**
   * THR-1909 (additive): the notices a badge click just revealed — the snapshot the
   * thread column's *Word of them* shows (THR-935), taken at click time because the click
   * clears them from the store. Not the live store: what the row tells is what was cleared.
   * GameView holds it beside `GameState`; the Inspector in the game (THR-1911, S3)
   * passes it. Absent (the lab, the hover card, no click yet) the row is skipped.
   */
  revealedNotices?: { readonly anchorId: string; readonly lines: readonly { readonly message: string; readonly tick: number }[] } | null;
  /**
   * THR-1911 (additive): the runtime's realm projection, so the person page's allegiance
   * row names the Realm as the profile does. Absent: the standing names the town and grip.
   */
  realmProjection?: RealmProjection | null;
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

/**
 * Compose the per-section seed from world seed + node + section type. The tick
 * is deliberately left out (THR-2054): a fallback line that re-rolled every
 * tick read as four different facts about one mortal. A line changes when its
 * pool changes, never because time passed.
 */
export function seedFor(ctx: SectionResolverContext, sectionTypeId: string): number {
  return (ctx.seed ^ hashString(ctx.nodeId) ^ hashString(sectionTypeId)) >>> 0;
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
function nodeRefKindFor(node: GraphNode | null | undefined): GraphPageKind | null {
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

/**
 * When something happened, in words: "Now", "Less than a day ago", "Four days ago" — the
 * shared `elapsedLabel` ladder (THR-1876 § D7: "N turns ago" printed a raw tick count,
 * Laws 13/14). With a place: "Four days ago · The Iron Market".
 */
export function whenLabelFor(eventNode: GraphNode, currentTick: number, placeName?: string): string {
  const eventTick = (eventNode.properties?.tick as number) ?? currentTick;
  const delta = Math.max(0, currentTick - eventTick);
  const words = delta === 0 ? 'Now' : `${elapsedLabel(delta)} ago`;
  const deltaLabel = words.charAt(0).toUpperCase() + words.slice(1);
  return placeName ? `${deltaLabel} · ${placeName}` : deltaLabel;
}

/** A stored relation basis (`old_debt`) as words ("old debt"), never the key (Law 14). */
function wordedBasis(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const worded = humanizeKeySegment(raw).replace(/\s+/g, ' ').trim().toLowerCase();
  return worded.length > 0 ? worded : undefined;
}

/**
 * The rank word for a membership (THR-1822 § D7): the reputation-based tier
 * `getAgentInfoCard` shows (`computeRankFromReputation`), never `member_of.rank` — a
 * 0–1 promotion number that printed as "0.16". Null when the faction has no definition.
 */
export function membershipRankWord(edge: { properties?: Record<string, unknown> }): string | null {
  const props = edge.properties ?? {};
  const defId = props.factionDefId as string | undefined;
  if (!defId) return null;
  const def = getFactionDefinition(defId);
  if (!def) return null;
  const rep = typeof props.reputation === 'number' ? (props.reputation as number) : 0;
  return computeRankFromReputation(rep, def)?.name ?? null;
}

// ─── Actor resolvers ──────────────────────────────────────────────────────────

/**
 * The Disposition line for a mortal the protagonist god has threaded (THR-2054),
 * or undefined when no thread connects them. Reception comes from the thread
 * edge's `bondReception`, else the newest `riteHistory` entry — the same fact
 * the sheet's Rite line reads — so the two never disagree.
 */
function bondedDispositionProse(ctx: SectionResolverContext, node: GraphNode): string | undefined {
  if (!ctx.protagonistId) return undefined;
  // The hover-card path passes the god's avatar as protagonist; threads leave the
  // ascendant itself, so resolve through the avatar's `avatar_of` edge.
  const godId = ctx.graph.getOutgoingEdges(ctx.protagonistId, 'avatar_of')[0]?.target ?? ctx.protagonistId;
  const edge = ctx.graph.getOutgoingEdges(godId, 'thread').find((e) => e.target === node.id);
  if (!edge) return undefined;
  const history = Array.isArray(node.properties?.riteHistory)
    ? (node.properties.riteHistory as Array<{ reception?: string }>)
    : [];
  const reception = (edge.properties?.bondReception as string | undefined) ?? history[history.length - 1]?.reception;
  const pools = ACTOR_BONDED_DISPOSITION_TEMPLATES as Record<string, readonly string[]>;
  const pool = (reception && pools[reception]) || ACTOR_BONDED_DISPOSITION_TEMPLATES.bonded;
  const tpl = pickFrom(pool, seedFor(ctx, 'portrait_with_disposition'));
  return tpl ? fillPlaceholders(tpl, { Name: node.name }) : undefined;
}

const portraitWithDispositionResolver: SectionResolver = (ctx) => {
  const node = ctx.graph.getNode(ctx.nodeId);
  if (!node || node.type !== 'actor') return null;

  const sphere = topSphere(node);
  // THR-2079 — no url: the page header already shows this mortal through the one
  // portrait resolver (`resolveEntityVisual`). Reading `properties.portraitUrl` here
  // was a second resolver, and it is empty for the seeded First, so the section
  // drew an empty frame one inch under his art (UI Laws 3, 4).

  // Disposition prose: try a stored disposition phrase first, then fall back.
  const dispositionPhrase = node.properties?.dispositionPhrase as string | undefined;
  let bodyProse = dispositionPhrase ?? bondedDispositionProse(ctx, node);
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
    label: 'Disposition toward her',
    gold: true,
    tier: 'routine',
    source: 'portraitWithDispositionResolver',
    portraitRef: { subject: node.name, sphere },
    bodyProse,
  };
  return section;
};

/**
 * THR-2097 (rule R4) — the drawn tie: the god's face, the bond mark, the person's face. Only
 * while the engine holds a thread from the god to this person; no thread, no strip. The
 * person's face is gated by what the god knows of them (Law 8).
 */
function bondOf(ctx: SectionResolverContext, actor: GraphNode): Pick<ProseSection, 'bond'> {
  const state = ctx.state;
  if (!state?.ascendantId) return {};
  const threaded = ctx.graph.getOutgoingEdges(state.ascendantId, 'thread').some(e => e.target === actor.id);
  if (!threaded) return {};
  const fam = state.familiarityMap;
  const level = getKnowledgeLevel(fam && typeof fam.get === 'function' ? getFamiliarity(fam, actor.id) : 0);
  const face = resolveEntityVisual({ id: actor.id, kind: 'agent', name: actor.name }, ctx.graph, { knowledgeLevel: level });
  const godName = state.ascendantIdentity?.divineName ?? ctx.graph.getNode(state.ascendantId)?.name ?? '';
  return {
    bond: {
      left: { name: godName, src: ascendantPortraitSrc(state) },
      right: { name: actor.name, id: actor.id, src: face.tier === 'art' && face.src ? face.src : null },
    },
  };
}

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
  // THR-2097: a mortal the god holds by a thread but with no `relates_to` edge (a First bonded
  // through Meet the First) still gets the row, so the bond strip draws for every held thread.
  if (!related) {
    const bond = bondOf(ctx, actor);
    if (!bond.bond) return null;
    return { kind: 'prose', typeId: 'what_she_is_to_him', label: 'What she is to him', gold: false, tier: 'routine', source: 'whatSheIsToHimResolver', prose: `${actor.name} is bound to you by thread.`, ...bond };
  }

  const basis = wordedBasis(related.properties?.basis as string | undefined) ?? 'a thread between you';
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
    label: 'What she is to him',
    gold: false,
    tier: 'routine',
    source: 'whatSheIsToHimResolver',
    prose,
    ...bondOf(ctx, actor),
  };
  return section;
};

/** Most distinct (person, kind) chips the "Threads between them" section shows. */
export const THREADS_BETWEEN_THEM_MAX_CHIPS = 6;

const threadsBetweenThemResolver: SectionResolver = (ctx) => {
  if (!ctx.protagonistId) return null;
  const actor = ctx.graph.getNode(ctx.nodeId);
  if (!actor) return null;

  const out = ctx.graph.getOutgoingEdges(actor.id, 'relates_to');
  const incoming = ctx.graph.getIncomingEdges(actor.id, 'relates_to');
  const all = [...out, ...incoming];
  if (all.length === 0) return null;

  // THR-1797: a bond is usually stored as two edges (A→B and B→A), so one chip
  // per (person, kind) — Law 36 — and the cap counts people, not edges.
  const chips: ChipDescriptor[] = [];
  const seen = new Set<string>();
  for (const edge of all) {
    if (chips.length >= THREADS_BETWEEN_THEM_MAX_CHIPS) break;
    const otherId = edge.source === actor.id ? edge.target : edge.source;
    const other = ctx.graph.getNode(otherId);
    if (!other) continue;
    const basis = wordedBasis(edge.properties?.basis as string | undefined) ?? 'thread';
    const key = `${otherId}\u0000${basis}`;
    if (seen.has(key)) continue;
    seen.add(key);
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
    label: 'Threads between them',
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
    label: 'Recent encounters',
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
  // THR-74: faction targets only — the company belongs in its own Company section,
  // not in Faction Allegiances.
  const edges = getFactionMembershipEdges(ctx.graph, actor.id);
  if (edges.length === 0) return null;

  const chips: ChipDescriptor[] = [];
  for (const edge of edges.slice(0, 6)) {
    const faction = ctx.graph.getNode(edge.target);
    if (!faction) continue;
    const rank = membershipRankWord(edge) ?? undefined;
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
    label: 'Faction allegiances',
    gold: false,
    tier: 'routine',
    source: 'factionAllegiancesResolver',
    chips,
  };
  return section;
};

// THR-1909: `notable_capabilities` retired — it read `properties.reaches`, which no actor
// writes; the person page's `domains` row replaces it (plan § D7.1).

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
    label: 'What it means here',
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
      label: 'How it came to her',
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
    label: 'How it came to her',
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
    label: 'How it tilts this scene',
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
    label: 'Previous uses',
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
    label: 'How they hold her',
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
    label: 'Allied with',
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
    label: 'Opposed',
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
    label: 'Reputations they hold',
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
    label: 'Recent actions',
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
    label: place.name,
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
    label: 'What this place wants',
    gold: true,
    tier: 'routine',
    source: 'whatThisPlaceWantsResolver',
    prose,
  };
  return section;
};

// THR-1910: `conditions_here` reads the place's `has_trait` edges now (`views/subjects/placeRows.ts`);
// the old resolver read `properties.conditions`, which nothing writes on places.

/**
 * When a remembered battle happened, as words (Law 13: no numbers on the page). The
 * record window is ten days, so these four cover every record the MEMORY shows.
 */
export function bloodshedWhenWords(ageTicks: number): string {
  const days = Math.floor(Math.max(0, ageTicks) / TICKS_PER_DAY);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return 'a few days ago';
  return 'more than a week ago';
}

const placeMemoryResolver: SectionResolver = (ctx) => {
  const place = ctx.graph.getNode(ctx.nodeId);
  if (!place) return null;

  // THR-1528: a recent battle (or, from slice 2, fight) is what the place remembers
  // first. The encounter helper filters to `encounter_outcome`, so the record is found
  // by walking the place's own `occurred_at` edges.
  const battle = latestBloodshedRecord(ctx.graph, place.id, ctx.tick, BLOOD_SOAKED_WINDOW_TICKS);
  const battleSummary = battle?.properties?.summary;
  if (battle && typeof battleSummary === 'string' && battleSummary.length > 0) {
    const at = typeof battle.properties.tick === 'number' ? (battle.properties.tick as number) : ctx.tick;
    const section: ProseSection = {
      kind: 'prose',
      typeId: 'memory',
      label: 'Memory',
      gold: false,
      tier: 'notable',
      source: 'placeMemoryResolver.battle',
      prose: `${battleSummary} That was ${bloodshedWhenWords(ctx.tick - at)}.`,
    };
    return section;
  }

  const events = getLocationEncounterHistory(ctx.graph, place.id, 1);
  if (events.length === 0) {
    const tpl = pickFrom(PLACE_FALLBACK_TEMPLATES.memory_none, seedFor(ctx, 'memory'));
    if (!tpl) return null;
    const section: ProseSection = {
      kind: 'prose',
      typeId: 'memory',
      label: 'Memory',
      gold: false,
      tier: 'routine',
      source: 'placeMemoryResolver.fallback',
      prose: fillPlaceholders(tpl, { Name: place.name }),
    };
    return section;
  }
  const evt = events[0];
  const at = typeof evt.properties?.tick === 'number' ? (evt.properties.tick as number) : ctx.tick;
  const summary = (evt.properties?.summary as string | undefined) ?? `Something happened here, ${ctx.tick - at > 0 ? `${elapsedLabel(ctx.tick - at)} ago` : 'just now'}.`;
  const section: ProseSection = {
    kind: 'prose',
    typeId: 'memory',
    label: 'Memory',
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
  // THR-1876: an encounter step's node is named "<template> (step N)" — a raw index (Law 14) —
  // so with no summary the card names the template it stores, and only then the node.
  const summary = (evt.properties?.summary as string | undefined) ?? (evt.properties?.templateName as string | undefined) ?? evt.name;
  if (!summary) return null;

  const section: ProseSection = {
    kind: 'prose',
    typeId: 'what_happened',
    label: 'What happened',
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
    label: 'Who was there',
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
    label: 'What it became',
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
    label: 'How it invokes now',
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
  memory: placeMemoryResolver,
} satisfies Record<string, SectionResolver>;

// ─── Group resolvers (THR-1490) ───────────────────────────────────────────────
//
// A group is a body of people under a banner: today an Army, and — when the Company and
// Network kinds get a route of their own — those too. The three sections answer the only
// three questions a glance at one asks: who they are, who leads them, what they are
// doing.
//
// Every figure stays behind a word. `ArmySheet` already established this for the same
// subject (headcount 10000, cohesion 94.15 — both private), and the words come from the
// same table it reads, `data/army-words.ts`, rather than a second vocabulary that would
// drift from it by the first tuning pass.

/** Read a group node's `armyState` bag, or null when it carries none. */
function groupStateOf(node: GraphNode | null | undefined): Record<string, unknown> | null {
  const bag = node?.properties?.armyState;
  return bag && typeof bag === 'object' ? (bag as Record<string, unknown>) : null;
}

/** WHO THEY ARE — size, condition and provisioning, as words. */
const groupMusterResolver: SectionResolver = (ctx) => {
  const node = ctx.graph.getNode(ctx.nodeId);
  if (!node) return null;
  const state = groupStateOf(node);
  if (!state) return null;

  const size = getArmySizeName(state.size);
  const cohesion = getArmyCohesionWord(state.cohesion, state.cohesionMax);
  const supply = getArmySupplyWord(state.supplyTier);
  // Every part is independently optional — an army raised before the supply system
  // carries no tier, and one with a malformed cohesion pair reads as neither.
  const clauses = [size, cohesion, supply].filter((w): w is string => Boolean(w));
  if (clauses.length === 0) return null;

  const section: ProseSection = {
    kind: 'prose',
    typeId: 'who_they_are',
    label: 'Who they are',
    gold: true,
    tier: 'routine',
    source: 'groupMusterResolver',
    prose: `${node.name} — ${clauses.join(', ')}.`,
  };
  return section;
};

/** WHO LEADS THEM — the commander and the banner they answer to, both clickable. */
const groupCommandResolver: SectionResolver = (ctx) => {
  const chips: ChipDescriptor[] = [];

  // `commanded_by` runs army → commander; `member_of` runs army → faction.
  const commanderId = ctx.graph.getOutgoingEdges(ctx.nodeId, 'commanded_by')[0]?.target;
  const commander = commanderId ? ctx.graph.getNode(commanderId) : null;
  if (commander) {
    chips.push({
      label: commander.name,
      flavour: 'in command',
      sphere: topSphere(commander),
      clickRef: { nodeId: commander.id, pageKind: 'actor' },
    });
  }

  const factionId = ctx.graph.getOutgoingEdges(ctx.nodeId, 'member_of')[0]?.target;
  const faction = factionId ? ctx.graph.getNode(factionId) : null;
  if (faction) {
    chips.push({
      label: faction.name,
      flavour: 'raised them',
      sphere: topSphere(faction),
      clickRef: { nodeId: faction.id, pageKind: 'faction' },
    });
  }

  if (chips.length === 0) return null;

  const section: ChipsSection = {
    kind: 'chips',
    typeId: 'who_leads_them',
    label: 'Who leads them',
    gold: false,
    tier: 'routine',
    source: 'groupCommandResolver',
    chips,
  };
  return section;
};

/**
 * WHAT THEY ARE DOING — the objective as a sentence, never as an objective type.
 *
 * THR-1910 fix: the army type names its target `objective.targetNodeId`
 * (`types/army.ts`); this read `targetId`, which no army carries, so the target was never
 * named. `targetId` stays as a fallback for an older shape. The war-aim line (THR-1933 —
 * why it marches, or why it holds) wins when the army carries one, as on `ArmySheet`,
 * with the town and the enemy host as links (Law 21).
 */
const groupIntentResolver: SectionResolver = (ctx) => {
  const node = ctx.graph.getNode(ctx.nodeId);
  const state = groupStateOf(node);
  const objective = state?.objective as { type?: unknown; targetNodeId?: unknown; targetId?: unknown } | null | undefined;

  const aim = node && state ? armyAimView(ctx.graph, node.id, ctx.tick) : null;
  if (aim) {
    const section = linkedProseSection('what_they_are_doing', 'What they are doing', fillSlots(aim.template, {
      town: aim.slots.town ? { text: aim.slots.town.name, ref: { kind: aim.slots.town.kind, id: aim.slots.town.id } } : null,
      enemy: aim.slots.enemy ? { text: aim.slots.enemy.name, ref: { kind: aim.slots.enemy.kind, id: aim.slots.enemy.id } } : null,
      // THR-1974 — the liege paying its soldiers, a link (Law 21); its tooltip rides the label.
      liege: aim.slots.liege ? { text: aim.slots.liege.name, ref: { kind: aim.slots.liege.kind, id: aim.slots.liege.id } } : null,
    }), 'armyAimView', aim.slots.liege ? { labelTooltipId: 'ui.army.paidBy' } : {});
    if (section) return section;
  }

  let prose: string | null = null;
  if (objective) {
    const rawTarget = typeof objective.targetNodeId === 'string' ? objective.targetNodeId
      : typeof objective.targetId === 'string' ? objective.targetId : undefined;
    const targetName = rawTarget ? (ctx.graph.getNode(rawTarget)?.name ?? null) : null;
    prose = armyObjectiveSentence(objective.type, targetName);
  }
  // No objective, an unphraseable one, or a target that has left the world all land
  // here — a muster standing idle is a supported state, not a missing section.
  prose ??= pickFrom(GROUP_FALLBACK_TEMPLATES.intent_none, seedFor(ctx, 'what_they_are_doing'))
    ?? ARMY_NO_OBJECTIVE_COPY;

  const section: ProseSection = {
    kind: 'prose',
    typeId: 'what_they_are_doing',
    label: 'What they are doing',
    gold: false,
    tier: 'routine',
    source: 'groupIntentResolver',
    prose,
  };
  return section;
};

export const GROUP_RESOLVERS = {
  who_they_are: groupMusterResolver,
  who_leads_them: groupCommandResolver,
  what_they_are_doing: groupIntentResolver,
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
  const bonded = bondedDispositionProse(ctx, actor);
  const tpl = bonded ? undefined : pickFrom(ACTOR_FALLBACK_TEMPLATES.disposition_no_history, seedFor(ctx, 'portrait_with_disposition'));
  const section: PortraitSection = {
    kind: 'portrait',
    typeId: 'portrait_with_disposition',
    label: 'Disposition toward her',
    gold: true,
    tier: 'routine',
    source: 'actorPortraitFallback',
    portraitRef: { subject: actor.name, sphere },
    bodyProse: bonded ?? (tpl ? fillPlaceholders(tpl, { Name: actor.name }) : actor.name),
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
    label: 'What it means here',
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
    label: 'How they hold her',
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
    label: 'What this place wants',
    gold: true,
    tier: 'routine',
    source: 'placeWantsFallback',
    prose: tpl ? fillPlaceholders(tpl, { Name: place.name, sphere }) : '',
  };
  return section;
};

/**
 * Group fallback: a muster with no readable state still says who it is.
 *
 * Reached when `groupMusterResolver` returns null — a group node carrying no `armyState`
 * bag, or one whose size, cohesion and supply are all unreadable. The section is
 * mandatory, so without this the page would fall to the generator's `…` stub.
 */
export const groupMusterFallback: SectionResolver = (ctx) => {
  const node = ctx.graph.getNode(ctx.nodeId);
  if (!node) return null;
  const tpl = pickFrom(GROUP_FALLBACK_TEMPLATES.muster_unknown, seedFor(ctx, 'who_they_are'));
  const section: ProseSection = {
    kind: 'prose',
    typeId: 'who_they_are',
    label: 'Who they are',
    gold: true,
    tier: 'routine',
    source: 'groupMusterFallback',
    prose: tpl ? fillPlaceholders(tpl, { Name: node.name }) : node.name,
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
    label: 'What happened',
    gold: true,
    tier: 'routine',
    source: 'eventSkeletalFallback',
    prose,
  };
  return section;
};
