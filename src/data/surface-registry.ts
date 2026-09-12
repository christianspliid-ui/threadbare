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
 * `SURFACE_BY_CONTENT_KIND` — the same record over `ContentObjectKindId` — lands in slice
 * 2 (THR-1491) together with `ContentRef`, because it needs the content-object registry's
 * `surface` column and the codex-overlay sheet arm. Slice 1 is world objects only.
 */

import type { NavigationTarget } from '../types/notification';
import type { WorldRefKind } from '../types/worldRef';

/**
 * The detail-page kind that renders a thing's card.
 *
 * A projection of `WorldRefKind`, not a parallel vocabulary: many kinds share a card
 * (a Location, a Place, an Area and a Hex are all places), and the card is about *shape
 * of page*, while the kind is about *what the thing is*.
 *
 * `'content'` is declared here and unused in slice 1 — its rows arrive with
 * `SURFACE_BY_CONTENT_KIND` in slice 2. It is declared now so `DetailPageKind` and this
 * union stay one edit apart rather than two.
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

/** The row for a kind. Total, so this never returns undefined. */
export function surfaceFor(kind: WorldRefKind): SurfaceRow {
  return SURFACE_BY_WORLD_REF[kind];
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
