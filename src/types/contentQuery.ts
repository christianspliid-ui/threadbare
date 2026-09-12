/**
 * The content query — naming content by *kind and tags* instead of by literal id
 * (THR-1487, slice 3 of THR-1481).
 *
 * **The sentence this file exists to make true.** *Name what you want by kind and
 * tags; the resolver finds it; the gate proves it resolves.* Content has referenced
 * content by literal id everywhere but one place, and literal ids rot — 67 of 115
 * reveal families matched zero templates before THR-844 aliased them, and undertaking
 * `catalystEncounterIds` spell `encounter_` where the corpus spells `encounter.`, so
 * none of them can resolve at all. The one place that got it right is the reward pool
 * (`reward_draw`, THR-1146), which draws a `#weapon #iron` prize from the possession
 * catalog by tag. This is that shape, lifted out of the reward pool so every other
 * content kind can use it.
 *
 * **The types live here and the resolver lives in `src/engine/contentQuery.ts`**, the
 * usual split: a content author's `encounter_seed.query` (slice 4) needs the shape
 * without pulling the engine in behind it.
 *
 * ## Two deliberate divergences from the plan's sketch, and why
 *
 * **1. `tags` is `readonly string[]`, not `readonly ContentTag[]`.** The plan wrote the
 * narrow type, and the vocabulary is real ({@link isContentTag} in `src/data/content-tags.ts`
 * answers it). But this type is a *matcher over authored tag strings*, and narrowing a
 * matcher is not the same as narrowing what may be authored. `RewardPoolRecipe.tagFilters`
 * is `string[]` and the shipped corpus contains filters the vocabulary does not seat;
 * a matcher that quietly dropped them would turn a pool that matches **nothing** today
 * into one that matches **everything** — the exact silent widening the whole slice is
 * built to make impossible, and the one the Kill criterion (byte-identity with the
 * pre-change reward pool) would catch. So the same rule the plan states for node-property
 * `tags` applies here: the closed vocabulary is enforced on the *authored literals* by
 * the contract test and the gates, never by narrowing the thing that reads them. The
 * type tightens when `CONTENT_TAG_RETROFIT_PENDING` is empty, alongside the catalog
 * entry types.
 *
 * **2. `classes` exists at all.** Two of the graph-backed kinds hold more than one class
 * of thing under one node type — a Power is `bestowed` (a god's gift) or `spell` (one a
 * mortal learned), and a Condition is `condition` or `scar`. The registry's own rows say
 * so in those words (*"two classes of one kind, per THR-1429"*). The reward pool's
 * `bestowed_power` category wants the first half of Power and not the second, and
 * `condition` wants the first half of Condition; without a way to say so, the resolver
 * could not reproduce either and the Kill criterion would fire. It is a content word,
 * not a node-type leak: the class is a property of the kind, and the static catalogs
 * discriminate it by the same field the graph does.
 */
import type { ContentObjectKindId } from '../data/content-objects';
import type { RarityTier } from './rarity';

/**
 * A tier window. A bare tier means exactly that tier; `{ min, max }` is inclusive on
 * both ends and either half may be omitted.
 *
 * **A candidate whose own tier is unknown passes every window.** That is not laxity —
 * it is the behaviour `pickConditionTemplate` has always had (`tier === null || tier <= cap`),
 * and the alternative silently drops untiered content from every tiered query.
 */
export type ContentTierWindow =
  | RarityTier
  | { readonly min?: RarityTier; readonly max?: RarityTier };

/**
 * What an author (or an engine site) asks the content library for.
 *
 * Every field except `kind` narrows, and they compose by AND: a query with `tags` and
 * `tier` returns what satisfies both. An empty result is never an error — it is the
 * caller's fail-soft case, traced as `content.query_empty`, and the *authoring-time*
 * gate is what makes it not happen in the first place.
 */
export interface ContentQuery {
  /** One kind or several; the resolver unions them, in registry order. */
  readonly kind: ContentObjectKindId | readonly ContentObjectKindId[];
  /**
   * Narrows to named classes within a kind — `['bestowed']` for a god's gift rather
   * than a learned spell. Omitted means every class the kind holds. A class name no
   * candidate carries returns nothing, which the gate reports rather than hiding.
   */
  readonly classes?: readonly string[];
  /**
   * **Every** tag must be present — the reward pool's ALL-of rule, unchanged. Tags
   * carry their `#` (`'#weapon'`, not `'weapon'`): the single most likely way to write
   * a filter that matches nothing (THR-1146).
   */
  readonly tags?: readonly string[];
  /** At least one of these must be present. Omitted or empty imposes nothing. */
  readonly anyTags?: readonly string[];
  /** Inclusive tier window; absent means any tier. */
  readonly tier?: ContentTierWindow;
  /** Ids never returned — the running encounter's own template, a prize already granted. */
  readonly exclude?: readonly string[];
}

/** One resolved candidate. `tier` is null when the entry does not declare one. */
export interface ContentQueryHit {
  readonly kind: ContentObjectKindId;
  readonly id: string;
  readonly tier: RarityTier | null;
}

/**
 * Where a query ran. Carried on both traces so a `content.query_empty` names the system
 * that went hungry, not just the filter that failed.
 */
export type ContentQuerySite =
  | 'reward_draw'
  | 'step_reward_pool'
  | 'encounter_seed'
  | 'undertaking_catalyst'
  | 'condition_pool'
  | 'debug';
