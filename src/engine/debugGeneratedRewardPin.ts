/**
 * Generated-reward pin — THR-1626, on the `debugOutcomePin.ts` precedent.
 *
 * Half of the eligible Storied and Mythic reward picks become a generated `found` thing
 * (`GENERATED_REWARD_SHARE_BY_BAND`), so a browser check that wants to see one would
 * otherwise wait on a coin. While this pin is on, the share roll always passes. Nothing
 * else changes: the eligibility rule, the two-core floor and the fit check still apply,
 * so a pinned draw that keeps its authored item is telling the truth about why.
 *
 * Module state that no caller sets costs one boolean read per eligible pick. Set only by
 * `window.__DEBUG.forceGeneratedRewards` (dev builds).
 */

let forced = false;

/** Force the generated-reward share roll to pass (`true`) or restore the coin (`false`). Returns the new state. */
export function setForceGeneratedRewards(on: boolean): boolean {
  forced = on;
  return forced;
}

/** Is the generated-reward share roll forced to pass? */
export function isGeneratedRewardForced(): boolean {
  return forced;
}
