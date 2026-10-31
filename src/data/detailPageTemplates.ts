/**
 * Detail page registry — the one page-layout table (THR-1876 § D6, UI Law 58).
 *
 * Design docs: Docs/plans/2026-05-06-detail-page-data-model.md §3, §4.1;
 * Docs/plans/2026-10-14-thr-1876-the-inspector.md § D6, § D7.
 *
 * The registry is the single source of truth for what sections render on each page
 * kind, in what order, with which resolver, with which fallback — and, since THR-1876,
 * **at which widths** (`visibleAt`) and **in which Inspector tab** (`tab`).
 *
 * Adding/removing a section row here is the *only* way to change a page's shape. Adding a
 * new section *kind* (shape) requires also touching the Section discriminated union
 * (`src/types/detailPage.ts`) and the Section dispatcher (`src/components/shared/Section.tsx`).
 * See it on save at `?view=inspector-lab`.
 */

import type { InspectorTabId, PageLayoutKind, PageSurface, GraphPageKind } from '../types/detailPage';
import type { IconName } from './icons/iconRegistry';
import type { SectionResolver } from '../engine/detailPageResolvers';
import {
  ACTOR_RESOLVERS,
  EVENT_RESOLVERS,
  FACTION_RESOLVERS,
  GROUP_RESOLVERS,
  ITEM_RESOLVERS,
  PLACE_RESOLVERS,
  actorPortraitFallback,
  eventSkeletalFallback,
  factionRepFallback,
  groupMusterFallback,
  itemIconFallback,
  placeWantsFallback,
} from '../engine/detailPageResolvers';
import {
  GOD_RESOLVERS,
  LAND_RESOLVERS,
  RECORD_RESOLVERS,
  dominionPlaceRowResolver,
  dominionRowResolver,
  recordFallback,
} from '../engine/views/subjects/pageResolvers';
import { CONTENT_RESOLVERS_BY_ROW } from '../engine/contentPageResolvers';
import { PERSON_RESOLVERS } from '../engine/views/subjects/personRows';
import { PLACE_ROW_RESOLVERS } from '../engine/views/subjects/placeRows';
import { FACTION_ROW_RESOLVERS } from '../engine/views/subjects/factionRows';
import { ATTACHMENT_ROW_RESOLVERS, ITEM_ROW_RESOLVERS } from '../engine/views/subjects/itemRows';

// ─── Tunable thresholds (NFP #1) ──────────────────────────────────────────────

/** Past event becomes callback-eligible if within this many ticks. */
export const DETAIL_NOTABLE_CALLBACK_WINDOW_TICKS = 12;

/** Sigmoid-impact magnitude that promotes "tilts this scene" prose to notable. */
export const DETAIL_NOTABLE_DECISIVE_THRESHOLD = 0.3;

/** Detail page cache lifetime (auto-evicts on tick advance). */
export const DETAIL_PROSE_CACHE_TTL_TICKS = 1;

// ─── Widths (THR-1876 § D7 column "at") ───────────────────────────────────────

/** Every surface, the hover card included. Equivalent to no `visibleAt`; spelled out where the plan says "all". */
const ALL: readonly PageSurface[] = ['hover', 'docked', 'wide', 'full'];
/** The Inspector's three sizes, not the hover card. */
const DWF: readonly PageSurface[] = ['docked', 'wide', 'full'];
/** Wide and Full only — a docked page lists it under "More when widened". */
const WF: readonly PageSurface[] = ['wide', 'full'];
/** The hover card only (the Inspector's header or another row supersedes it there). */
const HOVER: readonly PageSurface[] = ['hover'];

// ─── Schema entry ─────────────────────────────────────────────────────────────

/** One row of a per-page schema table. */
export interface SectionSchemaEntry {
  /** Section type id, matches Section.typeId. */
  typeId: string;
  /** Section ordering (lower = earlier). */
  order: number;
  /** True = page renders empty if this section returns null. */
  mandatory: boolean;
  /** Default resolver — graph-walks. Always present. */
  defaultResolver: SectionResolver;
  /** True = section is overridable by authored showcase prose. */
  showcaseOverridable: boolean;
  /** Optional fallback when defaultResolver returns null. */
  fallbackResolver?: SectionResolver;
  /** Where this section shows (THR-1876). Absent = every surface (today's behaviour, hover card included). */
  visibleAt?: readonly PageSurface[];
  /** Which Inspector tab it sits in (THR-1876). Absent = 'overview'. */
  tab?: InspectorTabId;
  /** THR-2097 (rule R2): the carved idea its heading draws. Absent = no icon, never an invented one. */
  icon?: IconName;
  /** THR-2097 (rule R3): `'aside'` = drawn in the wide/Full aside, under the Act row. */
  placement?: 'aside';
}

/** Full per-kind registry. Total over `PageLayoutKind`: a kind without rows is a type error. */
export type DetailPageRegistry = Record<PageLayoutKind, SectionSchemaEntry[]>;

// ─── Per-kind schemas ─────────────────────────────────────────────────────────

/** A person row ported from the profile (THR-1909, S2a): engine-resolved, never mandatory. */
function personRow(
  typeId: keyof typeof PERSON_RESOLVERS,
  order: number,
  tab: InspectorTabId,
  visibleAt: readonly PageSurface[],
  dress: Pick<SectionSchemaEntry, 'icon' | 'placement'> = {},
): SectionSchemaEntry {
  return { typeId, order, mandatory: false, defaultResolver: PERSON_RESOLVERS[typeId], showcaseOverridable: false, visibleAt, tab, ...dress };
}

/**
 * D7.1 Person — tabs Overview · Prowess · Attachments · Bonds · Journey · Chronicle ·
 * Chapters (the profile's seven). S1 built the table's first rows; S2a (THR-1909) ports
 * every profile and thread-column field. `notable_capabilities` retired in S2a (no writer;
 * `domains` replaces it).
 */
const ACTOR_SCHEMA: SectionSchemaEntry[] = [
  {
    typeId: 'portrait_with_disposition',
    order: 10,
    mandatory: true,
    defaultResolver: ACTOR_RESOLVERS.portrait_with_disposition,
    showcaseOverridable: true,
    fallbackResolver: actorPortraitFallback,
    visibleAt: ALL,
    tab: 'overview',
  },
  personRow('fate', 15, 'overview', DWF),
  personRow('story_so_far', 20, 'overview', DWF),
  personRow('revealed_notices', 25, 'overview', DWF),
  personRow('under_your_hand', 30, 'overview', DWF),
  personRow('intention', 35, 'overview', DWF),
  personRow('current_work', 36, 'overview', DWF),
  // The resolver sets the ambition's own idea (ICON_FOR_AMBITION); this is its fallback.
  personRow('leading_ambition', 37, 'overview', DWF, { icon: 'ambition' }),
  personRow('who_they_are', 40, 'overview', DWF, { icon: 'person' }),
  {
    typeId: 'dominion',
    order: 42,
    mandatory: false,
    defaultResolver: dominionRowResolver,
    showcaseOverridable: false,
    visibleAt: DWF,
    tab: 'overview',
    icon: 'lens-dominion',
  },
  personRow('allegiance', 45, 'overview', DWF),
  personRow('company', 50, 'overview', WF),
  personRow('nature', 55, 'overview', DWF, { icon: 'trait' }),
  personRow('core', 60, 'overview', WF, { icon: 'trait' }),
  personRow('personality', 65, 'overview', WF, { icon: 'trait' }),
  personRow('reputation', 70, 'overview', DWF),
  personRow('words', 75, 'overview', WF),
  personRow('origin', 80, 'overview', WF),
  personRow('domains', 100, 'prowess', DWF),
  personRow('conditions', 110, 'prowess', DWF),
  personRow('bestowed_powers', 120, 'prowess', DWF),
  personRow('slots', 200, 'attachments', DWF, { icon: 'attachment', placement: 'aside' }),
  personRow('knows', 210, 'attachments', DWF),
  personRow('inactive', 220, 'attachments', WF),
  personRow('disposition', 320, 'bonds', DWF),
  personRow('blood', 330, 'bonds', DWF),
  personRow('the_work', 400, 'journey', DWF, { icon: 'work' }),
  personRow('designs', 410, 'journey', DWF, { icon: 'ambition' }),
  personRow('ambitions', 420, 'journey', DWF, { icon: 'ambition' }),
  personRow('arc_so_far', 430, 'journey', DWF),
  personRow('their_story', 500, 'chronicle', WF, { icon: 'chronicle' }),
  personRow('timeline', 510, 'chronicle', WF, { icon: 'chronicle' }),
  personRow('full_account', 520, 'chronicle', WF, { icon: 'chronicle' }),
  personRow('interaction_record', 530, 'chronicle', WF, { icon: 'chronicle' }),
  personRow('completed_ambitions', 540, 'chronicle', WF, { icon: 'chronicle' }),
  personRow('intelligence', 550, 'chronicle', WF, { icon: 'chronicle' }),
  personRow('chapters', 600, 'chapters', WF, { icon: 'chapter-ledger' }),
  // THR-2097 (rule R4): the tie to the god opens the Overview — the bond strip, first in the main column.
  {
    typeId: 'what_she_is_to_him',
    order: 11,
    mandatory: false,
    defaultResolver: ACTOR_RESOLVERS.what_she_is_to_him,
    showcaseOverridable: true,
    visibleAt: ALL,
    tab: 'overview',
    icon: 'bond',
  },
  {
    typeId: 'threads_between_them',
    order: 310,
    mandatory: false,
    defaultResolver: ACTOR_RESOLVERS.threads_between_them,
    showcaseOverridable: false,
    visibleAt: DWF,
    tab: 'bonds',
  },
  // Hover only: in the Inspector the Chapters tab (S2a) and Connections' *belongs to* supersede them.
  {
    typeId: 'recent_encounters',
    order: 900,
    mandatory: false,
    defaultResolver: ACTOR_RESOLVERS.recent_encounters,
    showcaseOverridable: false,
    visibleAt: HOVER,
  },
  {
    typeId: 'faction_allegiances',
    order: 910,
    mandatory: false,
    defaultResolver: ACTOR_RESOLVERS.faction_allegiances,
    showcaseOverridable: false,
    visibleAt: HOVER,
  },
];

/** A row ported from a retiring sheet (THR-1910, S2b): engine-resolved, never mandatory. */
function sheetRow(typeId: string, resolver: SectionResolver, order: number, tab: InspectorTabId | undefined, visibleAt: readonly PageSurface[]): SectionSchemaEntry {
  return { typeId, order, mandatory: false, defaultResolver: resolver, showcaseOverridable: false, visibleAt, ...(tab ? { tab } : {}) };
}

/**
 * D7.6 Artifact — tabs Overview · Story. S1 built the existing rows; S2b (THR-1910) moves
 * `ArtifactSheet`'s fields in. `who_gave_it` retires to Connections (*who*: the holder) and
 * stays on the hover card only.
 */
const ITEM_SCHEMA: SectionSchemaEntry[] = [
  {
    typeId: 'icon_with_meaning',
    order: 10,
    mandatory: true,
    defaultResolver: ITEM_RESOLVERS.icon_with_meaning,
    showcaseOverridable: true,
    fallbackResolver: itemIconFallback,
    visibleAt: ALL,
    tab: 'overview',
  },
  {
    typeId: 'who_gave_it',
    order: 20,
    mandatory: false,
    defaultResolver: ITEM_RESOLVERS.who_gave_it,
    showcaseOverridable: true,
    visibleAt: HOVER,
  },
  sheetRow('made_by', ITEM_ROW_RESOLVERS.made_by, 30, 'overview', DWF),
  sheetRow('what_it_does', ITEM_ROW_RESOLVERS.what_it_does, 40, 'overview', DWF),
  sheetRow('traits', ITEM_ROW_RESOLVERS.traits, 45, 'overview', DWF),
  sheetRow('tags', ITEM_ROW_RESOLVERS.tags, 50, 'overview', DWF),
  {
    typeId: 'dominion',
    order: 60,
    mandatory: false,
    defaultResolver: dominionRowResolver,
    showcaseOverridable: false,
    visibleAt: DWF,
    tab: 'overview',
  },
  {
    typeId: 'how_it_tilts_this_scene',
    order: 80,
    mandatory: false,
    defaultResolver: ITEM_RESOLVERS.how_it_tilts_this_scene,
    showcaseOverridable: false,
    visibleAt: HOVER,
  },
  {
    typeId: 'previous_uses',
    order: 100,
    mandatory: false,
    defaultResolver: ITEM_RESOLVERS.previous_uses,
    showcaseOverridable: false,
    tab: 'story',
  },
];

/**
 * D7.4 Faction — tabs Overview · Story. S2b (THR-1910) moves `FactionSheet`'s fields in;
 * leader, members, halls, controls, relations and vassals are Connections rows (§ D6).
 * `allied_with` and `opposed` retire to Connections *friends and foes* and stay on the
 * hover card only. `crown`, `fealty` and `purse` carry sheet fields that postdate the
 * plan (THR-1931, THR-1932) under the same parity rule.
 */
const FACTION_SCHEMA: SectionSchemaEntry[] = [
  {
    typeId: 'how_they_hold_her',
    order: 10,
    mandatory: true,
    defaultResolver: FACTION_RESOLVERS.how_they_hold_her,
    showcaseOverridable: true,
    fallbackResolver: factionRepFallback,
    visibleAt: ALL,
    tab: 'overview',
  },
  sheetRow('description', FACTION_ROW_RESOLVERS.description, 15, 'overview', DWF),
  sheetRow('venerates', FACTION_ROW_RESOLVERS.venerates, 20, 'overview', DWF),
  sheetRow('pilgrim_ways', FACTION_ROW_RESOLVERS.pilgrim_ways, 22, 'overview', DWF),
  {
    typeId: 'dominion',
    order: 25,
    mandatory: false,
    defaultResolver: dominionRowResolver,
    showcaseOverridable: false,
    visibleAt: DWF,
    tab: 'overview',
  },
  sheetRow('crown', FACTION_ROW_RESOLVERS.crown, 26, 'overview', DWF),
  sheetRow('fealty', FACTION_ROW_RESOLVERS.fealty, 28, 'overview', DWF),
  sheetRow('agenda', FACTION_ROW_RESOLVERS.agenda, 30, 'overview', DWF),
  sheetRow('conclave', FACTION_ROW_RESOLVERS.conclave, 35, 'overview', DWF),
  sheetRow('means', FACTION_ROW_RESOLVERS.means, 40, 'overview', DWF),
  sheetRow('purse', FACTION_ROW_RESOLVERS.purse, 42, 'overview', DWF),
  sheetRow('strongest_reaches', FACTION_ROW_RESOLVERS.strongest_reaches, 45, 'overview', DWF),
  {
    typeId: 'reputations_they_hold',
    order: 50,
    mandatory: true,
    defaultResolver: FACTION_RESOLVERS.reputations_they_hold,
    showcaseOverridable: false,
    tab: 'overview',
  },
  sheetRow('customs', FACTION_ROW_RESOLVERS.customs, 55, 'overview', WF),
  sheetRow('ranks', FACTION_ROW_RESOLVERS.ranks, 60, 'overview', WF),
  {
    typeId: 'allied_with',
    order: 20,
    mandatory: false,
    defaultResolver: FACTION_RESOLVERS.allied_with,
    showcaseOverridable: false,
    visibleAt: HOVER,
  },
  {
    typeId: 'opposed',
    order: 21,
    mandatory: false,
    defaultResolver: FACTION_RESOLVERS.opposed,
    showcaseOverridable: false,
    visibleAt: HOVER,
  },
  // Source replaced (S2b): the sheet's `factionActionHistory`, not one encounter.
  sheetRow('recent_actions', FACTION_ROW_RESOLVERS.recent_actions, 100, 'story', DWF),
];

/**
 * D7.2 Location, Place and Area — tabs Overview · Here now · Story. S2b (THR-1910) moves
 * `LocationProfileModal`, `LocationView` and HexSidebar's Area facts in. Who is here, the
 * holder, the Places and their occupants are Connections rows (§ D6); the sublocation
 * drill-down retires (a Place is its own page). `fortunes` and `prayer` carry city-view
 * fields that postdate the plan (THR-1934, THR-1935) under the same parity rule.
 */
const PLACE_SCHEMA: SectionSchemaEntry[] = [
  {
    typeId: 'place_painting',
    order: 5,
    mandatory: true,
    defaultResolver: PLACE_RESOLVERS.place_painting,
    showcaseOverridable: true,
    visibleAt: HOVER,
  },
  sheetRow('place_prose', PLACE_ROW_RESOLVERS.place_prose, 10, 'overview', DWF),
  {
    typeId: 'what_this_place_wants',
    order: 12,
    mandatory: true,
    defaultResolver: PLACE_RESOLVERS.what_this_place_wants,
    showcaseOverridable: true,
    fallbackResolver: placeWantsFallback,
    // Hover only (§ D7.2): in the Inspector `place_prose` is the one place prose.
    visibleAt: HOVER,
  },
  sheetRow('past_line', PLACE_ROW_RESOLVERS.past_line, 15, 'overview', DWF),
  sheetRow('founded_by', PLACE_ROW_RESOLVERS.founded_by, 16, 'overview', DWF),
  // THR-1923 — the settlement economy's size line, under the place's own words.
  sheetRow('settlement_size', PLACE_ROW_RESOLVERS.settlement_size, 16.5, 'overview', DWF),
  sheetRow('fortunes', PLACE_ROW_RESOLVERS.fortunes, 17, 'overview', DWF),
  sheetRow('lair_monster', PLACE_ROW_RESOLVERS.lair_monster, 12, 'overview', DWF),
  sheetRow('settlement_notable', PLACE_ROW_RESOLVERS.settlement_notable, 14, 'overview', DWF),
  sheetRow('prayer', PLACE_ROW_RESOLVERS.prayer, 18, 'overview', DWF),
  sheetRow('pilgrim_way', PLACE_ROW_RESOLVERS.pilgrim_way, 19, 'overview', DWF),
  sheetRow('livelihood', PLACE_ROW_RESOLVERS.livelihood, 20, 'overview', DWF),
  {
    typeId: 'dominion',
    order: 25,
    mandatory: false,
    defaultResolver: dominionPlaceRowResolver,
    showcaseOverridable: false,
    visibleAt: DWF,
    tab: 'overview',
  },
  sheetRow('contested', PLACE_ROW_RESOLVERS.contested, 30, 'overview', DWF),
  sheetRow('walls', PLACE_ROW_RESOLVERS.walls, 35, 'overview', DWF),
  // Source replaced (S2b): the place's `has_trait` edges, the modal's source.
  sheetRow('conditions_here', PLACE_ROW_RESOLVERS.conditions_here, 40, 'overview', DWF),
  sheetRow('standing', PLACE_ROW_RESOLVERS.standing, 45, 'overview', DWF),
  sheetRow('place_of_power', PLACE_ROW_RESOLVERS.place_of_power, 50, 'overview', DWF),
  sheetRow('area_facts', PLACE_ROW_RESOLVERS.area_facts, 55, 'overview', DWF),
  sheetRow('guild_postings', PLACE_ROW_RESOLVERS.guild_postings, 100, 'here_now', DWF),
  sheetRow('encounters_here', PLACE_ROW_RESOLVERS.encounters_here, 110, 'here_now', DWF),
  {
    typeId: 'memory',
    order: 200,
    mandatory: false,
    defaultResolver: PLACE_RESOLVERS.memory,
    showcaseOverridable: true,
    tab: 'story',
  },
];

/** A graph event node (the record page reads these rows for an event, § D7.8). */
const EVENT_SCHEMA: SectionSchemaEntry[] = [
  {
    typeId: 'what_happened',
    order: 10,
    mandatory: true,
    defaultResolver: EVENT_RESOLVERS.what_happened,
    showcaseOverridable: true,
    fallbackResolver: eventSkeletalFallback,
    visibleAt: ALL,
  },
  // Retires to Connections *who* in the Inspector.
  {
    typeId: 'who_was_there',
    order: 15,
    mandatory: false,
    defaultResolver: EVENT_RESOLVERS.who_was_there,
    showcaseOverridable: false,
    visibleAt: HOVER,
  },
  {
    typeId: 'what_it_became',
    order: 30,
    mandatory: false,
    defaultResolver: EVENT_RESOLVERS.what_it_became,
    showcaseOverridable: true,
    visibleAt: DWF,
  },
  {
    typeId: 'how_it_invokes_now',
    order: 40,
    mandatory: false,
    defaultResolver: EVENT_RESOLVERS.how_it_invokes_now,
    showcaseOverridable: false,
    visibleAt: DWF,
  },
];

/**
 * D7.5 The group page (THR-1490) — an Army, and the Company / Network kinds when they route.
 *
 * Only the first row is mandatory: a muster with no commander and no orders is a real state
 * of the world, not a half-resolved page. `who_leads_them` retired to Connections in S2b
 * (THR-1910); `what_they_are_doing` reads the army's `objective.targetNodeId` since then.
 */
const GROUP_SCHEMA: SectionSchemaEntry[] = [
  {
    typeId: 'who_they_are',
    order: 10,
    mandatory: true,
    defaultResolver: GROUP_RESOLVERS.who_they_are,
    showcaseOverridable: true,
    fallbackResolver: groupMusterFallback,
    visibleAt: ALL,
  },
  // Retires to Connections (S2b): *who* the commander, *belongs to* the raising power.
  {
    typeId: 'who_leads_them',
    order: 20,
    mandatory: false,
    defaultResolver: GROUP_RESOLVERS.who_leads_them,
    showcaseOverridable: false,
    visibleAt: HOVER,
  },
  {
    typeId: 'what_they_are_doing',
    order: 30,
    mandatory: false,
    defaultResolver: GROUP_RESOLVERS.what_they_are_doing,
    showcaseOverridable: true,
    visibleAt: DWF,
  },
];

/**
 * D7.7 Content card — `generateContentPage`'s three sections, as rows, and (S2b) the
 * attachment sheet's rows for an attachment ref, which names a template.
 */
const CONTENT_SCHEMA: SectionSchemaEntry[] = [
  {
    typeId: 'what_it_is',
    order: 10,
    mandatory: false,
    defaultResolver: CONTENT_RESOLVERS_BY_ROW.what_it_is,
    showcaseOverridable: false,
  },
  {
    typeId: 'its_voice',
    order: 20,
    mandatory: false,
    defaultResolver: CONTENT_RESOLVERS_BY_ROW.its_voice,
    showcaseOverridable: false,
  },
  {
    typeId: 'marks',
    order: 30,
    mandatory: false,
    defaultResolver: CONTENT_RESOLVERS_BY_ROW.marks,
    showcaseOverridable: false,
  },
  // The attachment rows (S2b, THR-1910): resolve only for an attachment template.
  sheetRow('effect', ATTACHMENT_ROW_RESOLVERS.effect, 40, undefined, DWF),
  sheetRow('duration', ATTACHMENT_ROW_RESOLVERS.duration, 50, undefined, DWF),
  sheetRow('triggers', ATTACHMENT_ROW_RESOLVERS.triggers, 60, undefined, DWF),
  sheetRow('source', ATTACHMENT_ROW_RESOLVERS.source, 70, undefined, WF),
];

/** D7.3 The land page — HexChronicle's three prose blocks, moved unchanged. One fixed order, no tabs. */
const LAND_SCHEMA: SectionSchemaEntry[] = [
  { typeId: 'the_land', order: 10, mandatory: false, defaultResolver: LAND_RESOLVERS.the_land, showcaseOverridable: false, visibleAt: DWF },
  { typeId: 'its_soul', order: 20, mandatory: false, defaultResolver: LAND_RESOLVERS.its_soul, showcaseOverridable: false, visibleAt: DWF },
  { typeId: 'what_came_before', order: 30, mandatory: false, defaultResolver: LAND_RESOLVERS.what_came_before, showcaseOverridable: false, visibleAt: DWF },
];

/** D7.9 The god's own sheet — rows over the moved `godSheet.ts` selectors. */
const GOD_SCHEMA: SectionSchemaEntry[] = [
  { typeId: 'divine_nature', order: 10, mandatory: false, defaultResolver: GOD_RESOLVERS.divine_nature, showcaseOverridable: false, visibleAt: DWF, tab: 'overview' },
  { typeId: 'essence', order: 20, mandatory: false, defaultResolver: GOD_RESOLVERS.essence, showcaseOverridable: false, visibleAt: DWF, tab: 'overview' },
  { typeId: 'mandate', order: 30, mandatory: false, defaultResolver: GOD_RESOLVERS.mandate, showcaseOverridable: false, visibleAt: DWF, tab: 'overview' },
  { typeId: 'signatures', order: 40, mandatory: false, defaultResolver: GOD_RESOLVERS.signatures, showcaseOverridable: false, visibleAt: DWF, tab: 'overview' },
  { typeId: 'reaches', order: 100, mandatory: false, defaultResolver: GOD_RESOLVERS.reaches, showcaseOverridable: false, visibleAt: DWF, tab: 'reaches' },
];

/** D7.8 Record — an encounter, journey or receipt from its store (a graph event uses `event`). */
const RECORD_SCHEMA: SectionSchemaEntry[] = [
  {
    typeId: 'what_happened',
    order: 10,
    mandatory: true,
    defaultResolver: RECORD_RESOLVERS.what_happened,
    showcaseOverridable: false,
    fallbackResolver: recordFallback,
    visibleAt: ALL,
  },
  { typeId: 'outcome', order: 20, mandatory: false, defaultResolver: RECORD_RESOLVERS.outcome, showcaseOverridable: false, visibleAt: DWF },
];

export const DETAIL_PAGE_REGISTRY: DetailPageRegistry = {
  actor: ACTOR_SCHEMA,
  item: ITEM_SCHEMA,
  faction: FACTION_SCHEMA,
  place: PLACE_SCHEMA,
  event: EVENT_SCHEMA,
  group: GROUP_SCHEMA,
  content: CONTENT_SCHEMA,
  land: LAND_SCHEMA,
  god: GOD_SCHEMA,
  record: RECORD_SCHEMA,
};

/** Page kind → display label for the modal header. */
export const KIND_LABELS: Record<GraphPageKind, string> = {
  actor: 'Actor',
  item: 'Item',
  faction: 'Faction',
  place: 'Place',
  event: 'Event',
  group: 'Company',
};

/** Every page kind's label, the new kinds included (THR-1876). Total over `PageLayoutKind`. */
export const PAGE_KIND_LABELS: Record<PageLayoutKind, string> = {
  ...KIND_LABELS,
  content: 'Content',
  land: 'Land',
  god: 'God',
  record: 'Record',
};

export { INSPECTOR_TAB_LABELS } from './view-content';
