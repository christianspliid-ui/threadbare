/**
 * The surface registry — what each kind of thing *opens* (THR-1490).
 *
 * Plan: `Docs/plans/2026-09-12-thr-1482-one-card-one-router.md`.
 *
 * Law 20 describes a three-tier ladder: a tooltip explains a *concept*, a card shows a
 * *thing*, a sheet is the whole of it. Until now nothing in the code said which tier a
 * kind reaches, so three separate routers each hand-curated a partial answer — 5, 8 and
 * 7 kinds respectively, none of them dispatching on `WorldRefKind`. The anchor catalog's
 * `linked` / `named` split was likewise hand-kept, which is to say it was a claim about
 * routing that nothing could check.
 *
 * This file is that answer, in one place, **total by type**:
 *
 * - Every `WorldRefKind` has a row. `Record<WorldRefKind, SurfaceRow>` means a kind added
 *   to the vocabulary without a surface is a compile error, not a runtime `undefined` —
 *   which is Law 21's *"a link that opens nothing is worse than no link"* enforced by the
 *   type system rather than by review.
 * - Every row has a `card`. There is no such thing as a kind you cannot look at.
 * - `sheet` is nullable, and each `null` carries the ruling that made it null, quotable.
 *
 * The registry is data. The dispatch that reads it is `src/hooks/useRefRouter.ts`, and
 * nothing else in the tree may push onto the detail stack.
 *
 * `SURFACE_BY_CONTENT_KIND` — the same record over `ContentObjectKindId` — arrived with
 * slice 2 (THR-1491) together with `ContentRef`, and fills the content-object registry's
 * `surface` column from here, so the two can never disagree.
 */

import type { ContentObjectKindId } from '../types/contentRef';
import type { NavigationTarget } from '../types/notification';
import type { WorldRefKind } from '../types/worldRef';

/**
 * The detail-page kind that renders a thing's card.
 *
 * A projection of `WorldRefKind`, not a parallel vocabulary: many kinds share a card
 * (a Location, a Place, an Area and a Hex are all places), and the card is about *shape
 * of page*, while the kind is about *what the thing is*.
 *
 * `'content'` is the one member that is *not* a projection of `WorldRefKind`: it is what
 * every `SURFACE_BY_CONTENT_KIND` row carries, because a content object's page has one
 * shape regardless of kind. It is also the one card the graph generator cannot build — a
 * template is a catalog entry, not a node — so `GraphPageKind` excludes it and
 * `generateContentPage` builds it instead (THR-1491).
 */
export type CardKind = 'actor' | 'faction' | 'place' | 'item' | 'event' | 'group' | 'content';

/** Where a kind's Tier-3 surface lives, when it has one. */
export type SheetTarget = NavigationTarget['kind'] | 'codex';

export interface SurfaceRow {
  /** The detail-page kind that renders this thing's card. Never null: every kind has a card. */
  readonly card: CardKind;
  /** The Tier-3 destination, or null when the card is the deepest surface there is. */
  readonly sheet: SheetTarget | null;
  /** Why the sheet is null, when it is — the ruling, quotable. */
  readonly note?: string;
}

/**
 * Every `WorldRefKind`, and what it opens.
 *
 * Three rows carry `sheet: null`, and the three reasons are different in kind — worth
 * stating, because "no sheet" reads like one decision and is three:
 *
 * - **companion** — withheld. A sheet exists in the sense that a companion has a page on
 *   its bearer's surface, but no *standalone* one, and both available openers would show
 *   the wrong person (THR-1096).
 * - **area** — the Area's deep surface is the hex chronicle, which is the `hex` row's
 *   sheet, not a second one of its own.
 * - **hex** — the hex *is* the map. `HexDetailView` is what a hex opens, and the router
 *   reaches it through the existing `hex` navigation arm, which focuses the map rather
 *   than stacking a modal over it.
 */
export const SURFACE_BY_WORLD_REF: Readonly<Record<WorldRefKind, SurfaceRow>> = {
  agent: { card: 'actor', sheet: 'agent' },
  faction: { card: 'faction', sheet: 'faction' },
  location: { card: 'place', sheet: 'location' },
  // A Place's sheet is its parent Location's — the surface that draws it, as today.
  sublocation: { card: 'place', sheet: 'location' },
  area: {
    card: 'place',
    sheet: 'area',
    note: 'An Area has no sheet of its own; the `area` navigation arm focuses its centre hex, where the chronicle names it and tells its history (THR-1155).',
  },
  hex: { card: 'place', sheet: 'hex' },
  artifact: { card: 'item', sheet: 'artifact' },
  attachment: { card: 'item', sheet: 'attachment' },
  companion: {
    card: 'actor',
    sheet: null,
    note: 'Withheld by ruling (THR-1096): `openEntity` returned undefined for companions on purpose. A companion is a person but not an agent node and not a thread, so the agent drawer and the stub-modal path would each open the wrong sheet. The card still opens — a companion is a face with a name and a bearer, and that is a card.',
  },
  army: { card: 'group', sheet: 'army' },
  encounter: { card: 'event', sheet: 'encounter' },
  journey: { card: 'event', sheet: 'journey' },
  receipt: { card: 'event', sheet: 'receipt' },
};

/**
 * Every `ContentObjectKindId`, and what it opens (THR-1491).
 *
 * **Every row is `card: 'content'`.** A content object has one shape of page — a name, the
 * word for what it is, its prose, its tags — and that shape does not vary by kind, which
 * is the whole claim of "one card, one router" applied to the author's side of the line.
 *
 * **`sheet` is `'codex'` exactly where the codex has the entry, and `null` where it has
 * not, and that split was measured rather than assumed.** Probing every catalog id in this
 * registry against `getAllCodexEntries()` on 2026-09-12 found six kinds with codex
 * coverage and six with none:
 *
 * | kind | ids | in codex | category |
 * |---|---|---|---|
 * | `action_template` | 239 | 239 | divine · hex · location · artifact · company · threads · actions |
 * | `item_template` | 134 | 119 | possessions |
 * | `undertaking_template` | 116 | 60 | undertakings |
 * | `condition_template` | 46 | 40 | conditions |
 * | `power_template` | 25 | 12 | conditions |
 * | `agreement_template` | 7 | 7 | agreements |
 * | `encounter_template` | 557 | **0** | — |
 * | `omen_template` | 44 | **0** | — |
 * | `nudge_card` | 37 | **0** | — |
 * | `ambition_template` | 20 | **0** | — |
 * | `companion_template` | 9 | **0** | — |
 * | `legendary_template` | 3 | **0** | — |
 *
 * The plan named four kinds as lacking a category (encounters, companions, ambitions,
 * omens); the measurement found **six** — `legendary_template` and `nudge_card` are also
 * absent, and the first is the surprising one, because a `possessions` category exists and
 * simply does not read `ARTIFACT_TEMPLATES`. All six are the deferral this slice files.
 *
 * **A `'codex'` row is a claim about the kind, not about every entry of it** — four of the
 * six covered kinds are covered *partially* (an undertaking template has a codex card only
 * where its grid cell is live). So the CTA asks `contentSheetFor(ref)`, which checks the
 * entry, not just the row; the row alone would render an "open in codex ↗" that opens
 * nothing for 56 undertaking templates, which is the Law 25 failure this registry exists
 * to remove.
 */
export const SURFACE_BY_CONTENT_KIND: Readonly<Record<ContentObjectKindId, SurfaceRow>> = {
  encounter_template: {
    card: 'content',
    sheet: null,
    note: 'No codex category catalogues encounters — 0 of 557 ids resolve to a codex entry (measured 2026-09-12). Chartering one is THR-1495.',
  },
  action_template: { card: 'content', sheet: 'codex' },
  undertaking_template: { card: 'content', sheet: 'codex' },
  item_template: { card: 'content', sheet: 'codex' },
  legendary_template: {
    card: 'content',
    sheet: null,
    note: 'The `possessions` category reads the reward and starter catalogs, never `ARTIFACT_TEMPLATES` — 0 of 3 legendary ids resolve to a codex entry (measured 2026-09-12). THR-1495.',
  },
  condition_template: { card: 'content', sheet: 'codex' },
  power_template: { card: 'content', sheet: 'codex' },
  agreement_template: { card: 'content', sheet: 'codex' },
  companion_template: {
    card: 'content',
    sheet: null,
    note: 'No codex category catalogues companions — 0 of 9 ids resolve (measured 2026-09-12). THR-1495. The world-object side is withheld for its own reason; see the `companion` row above.',
  },
  ambition_template: {
    card: 'content',
    sheet: null,
    note: 'No codex category catalogues ambitions — 0 of 20 ids resolve (measured 2026-09-12). THR-1495.',
  },
  omen_template: {
    card: 'content',
    sheet: null,
    note: 'No codex category catalogues omens — 0 of 44 ids resolve (measured 2026-09-12). THR-1495.',
  },
  nudge_card: {
    card: 'content',
    sheet: null,
    note: 'No codex category catalogues nudge cards — 0 of 37 ids resolve (measured 2026-09-12). THR-1495.',
  },
};

/** The row for a kind. Total, so this never returns undefined. */
export function surfaceFor(kind: WorldRefKind): SurfaceRow {
  return SURFACE_BY_WORLD_REF[kind];
}

/** The row for a content kind. Total, so this never returns undefined. */
export function contentSurfaceFor(kind: ContentObjectKindId): SurfaceRow {
  return SURFACE_BY_CONTENT_KIND[kind];
}

/**
 * Whether a kind reaches a Tier-3 sheet.
 *
 * What the footer CTA gates on (Law 25: a control that does nothing does not render),
 * and what the anchor catalog's derived status reads.
 */
export function hasSheet(kind: WorldRefKind): boolean {
  return SURFACE_BY_WORLD_REF[kind].sheet !== null;
}
