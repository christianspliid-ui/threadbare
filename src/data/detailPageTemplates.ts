/**
 * Detail page registry — per-page schema entries wired to section resolvers.
 *
 * Design doc: Docs/plans/2026-05-06-detail-page-data-model.md §3, §4.1
 *
 * The registry is the single source of truth for what sections render on each
 * detail page kind, in what order, with which resolver, and with which fallback.
 *
 * Adding/removing a section row here is the *only* way to change a page's
 * shape. Adding a new section *kind* requires also touching the Section
 * discriminated union (`src/types/detailPage.ts`) and the Section dispatcher
 * (`src/components/shared/Section.tsx`).
 */

import type { DetailPageKind } from '../types/detailPage';
import type { SectionResolver } from '../engine/detailPageResolvers';
import {
  ACTOR_RESOLVERS,
  EVENT_RESOLVERS,
  FACTION_RESOLVERS,
  ITEM_RESOLVERS,
  PLACE_RESOLVERS,
  actorPortraitFallback,
  eventSkeletalFallback,
  factionRepFallback,
  itemIconFallback,
  placeWantsFallback,
} from '../engine/detailPageResolvers';

// ─── Tunable thresholds (NFP #1) ──────────────────────────────────────────────

/** Past event becomes callback-eligible if within this many ticks. */
export const DETAIL_NOTABLE_CALLBACK_WINDOW_TICKS = 12;

/** Sigmoid-impact magnitude that promotes "tilts this scene" prose to notable. */
export const DETAIL_NOTABLE_DECISIVE_THRESHOLD = 0.3;

/** Detail page cache lifetime (auto-evicts on tick advance). */
export const DETAIL_PROSE_CACHE_TTL_TICKS = 1;

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
}

/** Full per-kind registry. */
export type DetailPageRegistry = Record<DetailPageKind, SectionSchemaEntry[]>;

// ─── Per-kind schemas ─────────────────────────────────────────────────────────

const ACTOR_SCHEMA: SectionSchemaEntry[] = [
  {
    typeId: 'portrait_with_disposition',
    order: 1,
    mandatory: true,
    defaultResolver: ACTOR_RESOLVERS.portrait_with_disposition,
    showcaseOverridable: true,
    fallbackResolver: actorPortraitFallback,
  },
  {
    typeId: 'what_she_is_to_him',
    order: 2,
    mandatory: false,
    defaultResolver: ACTOR_RESOLVERS.what_she_is_to_him,
    showcaseOverridable: true,
  },
  {
    typeId: 'threads_between_them',
    order: 3,
    mandatory: false,
    defaultResolver: ACTOR_RESOLVERS.threads_between_them,
    showcaseOverridable: false,
  },
  {
    typeId: 'recent_encounters',
    order: 4,
    mandatory: false,
    defaultResolver: ACTOR_RESOLVERS.recent_encounters,
    showcaseOverridable: false,
  },
  {
    typeId: 'faction_allegiances',
    order: 5,
    mandatory: false,
    defaultResolver: ACTOR_RESOLVERS.faction_allegiances,
    showcaseOverridable: false,
  },
  {
    typeId: 'notable_capabilities',
    order: 6,
    mandatory: false,
    defaultResolver: ACTOR_RESOLVERS.notable_capabilities,
    showcaseOverridable: false,
  },
];

const ITEM_SCHEMA: SectionSchemaEntry[] = [
  {
    typeId: 'icon_with_meaning',
    order: 1,
    mandatory: true,
    defaultResolver: ITEM_RESOLVERS.icon_with_meaning,
    showcaseOverridable: true,
    fallbackResolver: itemIconFallback,
  },
  {
    typeId: 'who_gave_it',
    order: 2,
    mandatory: false,
    defaultResolver: ITEM_RESOLVERS.who_gave_it,
    showcaseOverridable: true,
  },
  {
    typeId: 'how_it_tilts_this_scene',
    order: 3,
    mandatory: false,
    defaultResolver: ITEM_RESOLVERS.how_it_tilts_this_scene,
    showcaseOverridable: false,
  },
  {
    typeId: 'previous_uses',
    order: 4,
    mandatory: false,
    defaultResolver: ITEM_RESOLVERS.previous_uses,
    showcaseOverridable: false,
  },
];

const FACTION_SCHEMA: SectionSchemaEntry[] = [
  {
    typeId: 'how_they_hold_her',
    order: 1,
    mandatory: true,
    defaultResolver: FACTION_RESOLVERS.how_they_hold_her,
    showcaseOverridable: true,
    fallbackResolver: factionRepFallback,
  },
  {
    typeId: 'allied_with',
    order: 2,
    mandatory: false,
    defaultResolver: FACTION_RESOLVERS.allied_with,
    showcaseOverridable: false,
  },
  {
    typeId: 'opposed',
    order: 3,
    mandatory: false,
    defaultResolver: FACTION_RESOLVERS.opposed,
    showcaseOverridable: false,
  },
  {
    typeId: 'reputations_they_hold',
    order: 4,
    mandatory: true,
    defaultResolver: FACTION_RESOLVERS.reputations_they_hold,
    showcaseOverridable: false,
  },
  {
    typeId: 'recent_actions',
    order: 5,
    mandatory: false,
    defaultResolver: FACTION_RESOLVERS.recent_actions,
    showcaseOverridable: false,
  },
];

const PLACE_SCHEMA: SectionSchemaEntry[] = [
  {
    typeId: 'place_painting',
    order: 1,
    mandatory: true,
    defaultResolver: PLACE_RESOLVERS.place_painting,
    showcaseOverridable: true,
  },
  {
    typeId: 'what_this_place_wants',
    order: 2,
    mandatory: true,
    defaultResolver: PLACE_RESOLVERS.what_this_place_wants,
    showcaseOverridable: true,
    fallbackResolver: placeWantsFallback,
  },
  {
    typeId: 'conditions_here',
    order: 3,
    mandatory: false,
    defaultResolver: PLACE_RESOLVERS.conditions_here,
    showcaseOverridable: false,
  },
  {
    typeId: 'memory',
    order: 4,
    mandatory: false,
    defaultResolver: PLACE_RESOLVERS.memory,
    showcaseOverridable: true,
  },
];

const EVENT_SCHEMA: SectionSchemaEntry[] = [
  {
    typeId: 'what_happened',
    order: 1,
    mandatory: true,
    defaultResolver: EVENT_RESOLVERS.what_happened,
    showcaseOverridable: true,
    fallbackResolver: eventSkeletalFallback,
  },
  {
    typeId: 'who_was_there',
    order: 2,
    mandatory: false,
    defaultResolver: EVENT_RESOLVERS.who_was_there,
    showcaseOverridable: false,
  },
  {
    typeId: 'what_it_became',
    order: 3,
    mandatory: false,
    defaultResolver: EVENT_RESOLVERS.what_it_became,
    showcaseOverridable: true,
  },
  {
    typeId: 'how_it_invokes_now',
    order: 4,
    mandatory: false,
    defaultResolver: EVENT_RESOLVERS.how_it_invokes_now,
    showcaseOverridable: false,
  },
];

export const DETAIL_PAGE_REGISTRY: DetailPageRegistry = {
  actor: ACTOR_SCHEMA,
  item: ITEM_SCHEMA,
  faction: FACTION_SCHEMA,
  place: PLACE_SCHEMA,
  event: EVENT_SCHEMA,
};

/** Page kind → display label for the modal header. */
export const KIND_LABELS: Record<DetailPageKind, string> = {
  actor: 'ACTOR',
  item: 'ITEM',
  faction: 'FACTION',
  place: 'PLACE',
  event: 'EVENT',
};
