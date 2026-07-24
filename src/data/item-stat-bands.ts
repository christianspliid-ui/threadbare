/**
 * Item Stat Bands — power-budget ceilings for item→Domain-Capability contributions.
 *
 * THR-718: a `stat_contribution` effect on a possessed/bonded item adds an additive
 * raw-score term feeding `computeRawScore`'s sigmoid (midpoint 10). These bands cap
 * how much a single item may contribute *per reach*, calibrated against the trait
 * scale (culture traits contribute ~1–2 per level) and the fact that items already
 * shape resolution *rolls* through two other channels (test shapers + reach-modifier
 * effects). Tier influence stacks a third channel on top — so bands are deliberately
 * conservative: a common item never moves a tier alone; a legendary bonded artifact
 * visibly can.
 *
 * These are authoring guidance enforced by a content test
 * (`item-stat-bands.contract.test.ts`) asserting no catalog entry's per-reach
 * `stat_contribution` exceeds `ITEM_STAT_BAND_LEGENDARY`. Tunable without code
 * changes: raise/lower a band, re-run the test.
 */

/** Common/minor item contribution ceiling per reach (≈ a light touch). */
export const ITEM_STAT_BAND_MINOR = 0.5;

/** Notable/rare item ceiling per reach (≈ half a strong trait level). */
export const ITEM_STAT_BAND_NOTABLE = 1.0;

/** Legendary/bonded artifact ceiling per reach (≈ one strong trait level). */
export const ITEM_STAT_BAND_LEGENDARY = 2.0;

/** Dot count on the DomainCard magnitude row — matches the 5-tier DOMAIN_WORD_SCALES. */
export const MAGNITUDE_DOTS_TOTAL = 5;
