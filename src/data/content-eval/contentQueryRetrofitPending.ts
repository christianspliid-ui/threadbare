/**
 * The content-query ratchet — the shipped recipes that resolve to nothing, named once
 * so the gate can be fatal for everything else (THR-1487).
 *
 * **What this list is evidence of.** Before this slice, `validateContentQueries` (then
 * `validateRewardDrawPools`) walked only the `reward_draw` aftermath effect. Measured on
 * the corpus at THR-1487: **1 recipe on that route, 481 on the step route** — so the gate
 * that has guarded reward liveness since THR-1146 was, in practice, checking one recipe
 * out of 482. Widening it to `ActionStepOutcomeMetadata.rewardPool` surfaced sixteen
 * step-route recipes that promise a prize and draw nothing: the prose says the player is
 * paid and the player is not. That is the THR-844 rot class, and it is what a gate
 * blind to 99.8% of its subject hides.
 *
 * **Why a ratchet and not sixteen fixes.** Fixing them is *content* work — some want a
 * tag no entry carries (`#pearl #spirit`), and three name a `categoryWeights` key that is
 * not an `AttachmentCategory` at all (`tomes_scrolls` is a possession *subcategory*,
 * `mastery` is nothing), which is an authoring error rather than a filter that missed.
 * Neither is slice 3's to decide, and both need a content author's judgment about what
 * the scene should hand out. THR-1481's plan prescribes exactly this: *the ratchet
 * grandfathers the legacy corpus.* Tracked for repair by THR-1496.
 *
 * **The shape (the `undertakingContract.test.ts` rule).** The ratchet fails in **both**
 * directions: a listed entry that now resolves fails as *stale* (delete the line), and an
 * unlisted entry that resolves empty fails as *new rot*. A grandfather list that only
 * ever forgave would be a way to add rot, not a way to retire it. It shrinks and never
 * grows; when it is empty, delete the file and the gate is simply fatal.
 */

/**
 * `templateId @ site`, exactly as {@link allTemplateRewardRecipes} spells the site.
 *
 * Sorted, and one line per entry, so a shrink reads as a deletion in the diff.
 */
export const CONTENT_QUERY_RETROFIT_PENDING: readonly string[] = [
  // Tags no catalog entry carries together — the filter is right in spirit, and the
  // content it wants has not been authored.
  'army.aftermath.refugees @ step 1.successMetadata.rewardPool',
  'army.supply.forage @ step 1.successMetadata.rewardPool',
  'army.supply.siege_lifted @ step 1.successMetadata.rewardPool',
  'army.threshold.supply_crisis @ step 1.successMetadata.rewardPool',
  'encounter.anomaly.dreaming_light @ step 1.successMetadata.rewardPool',
  'encounter.anomaly.moons_tears @ step 1.successMetadata.rewardPool',
  'tavern.confession_over_drinks @ step 1.successMetadata.rewardPool',
  'tg.quest.blackmail_ledger @ step 1.successMetadata.rewardPool',
  'tg.quest.warehouse_raid @ step 1.successMetadata.rewardPool',

  // `categoryWeights` keys that are not attachment categories. These draw nothing for a
  // different reason and want a different fix — correcting the key, not the tags.
  "enc.letters_of_introduction @ step 1 variant 'fallback'.successMetadata.rewardPool",
  "enc.letters_of_introduction @ step 1 variant 'work_the_formal_channel'.successMetadata.rewardPool",
  "enc.letters_of_introduction @ step 1 variant 'work_the_social_bridge'.successMetadata.rewardPool",
  'tavern.drinking_contest @ step 1.successMetadata.rewardPool',
];

/** True when a `templateId @ site` is grandfathered. */
export function isContentQueryRetrofitPending(key: string): boolean {
  return CONTENT_QUERY_RETROFIT_PENDING.includes(key);
}
