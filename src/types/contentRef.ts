/**
 * `ContentRef` — the one canonical way anything in the game names a piece of *authored
 * content*, as `WorldRef` names a thing in the world (THR-1491, slice 2 of THR-1482).
 *
 * **The distinction this module exists to hold.** A `WorldRef` names something the engine
 * minted — this artifact, in this hand, on this tick. A `ContentRef` names something a
 * person wrote — the *kind* of artifact, the rule that mints it, the entry in a catalog.
 * They are not interchangeable and neither routes to the other's surface: a world object
 * opens its sheet, a content object opens the codex (THR-1315 stands — `codex` did not
 * return to `WorldRefKind`, because a *world* reference must never route to a reference
 * page; content gets its own reference type, and the codex overlay is its sheet).
 *
 * **This module is deliberately import-free**, for the same reason `worldRef.ts` is: it is
 * a membership source read as *text* by `scripts/generate-anchor-catalog.ts`, and a
 * generator that must resolve an import graph to read a union is one that breaks when an
 * unrelated module moves. {@link ContentObjectKindId} is therefore re-declared here rather
 * than imported from `src/data/content-objects.ts`, and `contentRef.test.ts` pins the two
 * spellings together — the same trick `WORLD_REF_KINDS` uses, and the reason a kind added
 * to the registry without a member here fails a test by name instead of silently losing
 * its surface.
 *
 * Plan: `Docs/plans/2026-09-12-thr-1482-one-card-one-router.md`
 */

import type { WorldRef } from './worldRef';

/**
 * Every kind of authored content, as the content-object registry seats them.
 *
 * Mirrors `ContentObjectKindId` in `src/data/content-objects.ts`. That file is the
 * authority — it carries each kind's catalogs, prefixes, gate and note; this is its
 * import-free shadow, pinned by test.
 */
export type ContentObjectKindId =
  | 'encounter_template'
  | 'action_template'
  | 'undertaking_template'
  | 'item_template'
  | 'legendary_template'
  | 'condition_template'
  | 'power_template'
  | 'agreement_template'
  | 'companion_template'
  | 'ambition_template'
  | 'omen_template'
  | 'nudge_card';

/**
 * Every content kind, as a runtime value.
 *
 * Annotated `readonly ContentObjectKindId[]` so a member added to the type above without
 * a member added here fails to compile, and pinned against the registry by test so a kind
 * seated in the registry without a member here fails by name.
 */
export const CONTENT_OBJECT_KIND_IDS: readonly ContentObjectKindId[] = [
  'encounter_template',
  'action_template',
  'undertaking_template',
  'item_template',
  'legendary_template',
  'condition_template',
  'power_template',
  'agreement_template',
  'companion_template',
  'ambition_template',
  'omen_template',
  'nudge_card',
];

/** Runtime membership test — for validating strings arriving from data. */
export function isContentObjectKindId(value: string): value is ContentObjectKindId {
  return (CONTENT_OBJECT_KIND_IDS as readonly string[]).includes(value);
}

/**
 * A reference to a piece of authored content.
 *
 * Deliberately the same shape as {@link WorldRef} minus the binding forms: a content id is
 * always literal. A world id may be a sentinel (`$artifact`) resolved at play time because
 * the thing it names is minted during the scene; a template id is written by the author
 * who wrote the template, and there is nothing to defer.
 */
export interface ContentRef {
  readonly kind: ContentObjectKindId;
  /** The catalog entry's literal id — `encounter.slice.unsafe_bridge`, `reward_arms_bronze_spear`. */
  readonly id: string;
  /** Display name, when the caller already has it. The resolver supplies one otherwise. */
  readonly name?: string;
}

/**
 * Either kind of reference.
 *
 * What the router's `open` takes, and what `EntityLink` accepts. A caller that knows only
 * "this is a thing the game names" passes an `AnyRef` and the router decides the surface.
 */
export type AnyRef = WorldRef | ContentRef;

/**
 * Whether a reference names authored content rather than a world object.
 *
 * Discriminates on kind membership rather than on a tag field, so a `ContentRef` needs no
 * extra property and an existing `WorldRef` literal keeps working unchanged (NFP #6). The
 * two vocabularies are disjoint by construction — `contentRef.test.ts` asserts it, because
 * a kind spelled into both unions would make this predicate answer by accident.
 */
export function isContentRef(ref: AnyRef): ref is ContentRef {
  return isContentObjectKindId(ref.kind);
}
