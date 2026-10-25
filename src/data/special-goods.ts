/**
 * Special goods — the rare things in a settlement's reach that unlock a building and its
 * trait (THR-1923).
 *
 * A Place of one of these subtypes within `WORK_RADIUS` of a settlement, and inside its
 * holder's realm when it has one (Civ realm pooling, the THR-1866 direction), puts the good
 * in reach. An ore deposit of at least `ORE_SPECIAL_MIN` on the settlement or a Place in
 * reach does the same for `ore`. One entry per subtype (UI Law 58).
 *
 * Plan: Docs/plans/2026-10-14-thr-1923-settlement-economy.md § Data tables.
 */

export type SpecialGood = 'gems' | 'herbs' | 'crystal' | 'amber' | 'curios' | 'springs' | 'ore';

export const SPECIAL_GOODS: readonly SpecialGood[] = ['gems', 'herbs', 'crystal', 'amber', 'curios', 'springs', 'ore'];

/** Location subtype → the special good its presence puts in reach. */
export const SPECIAL_GOOD_BY_PLACE_SUBTYPE: Readonly<Record<string, SpecialGood>> = {
  gem_deposit: 'gems',
  herb_garden: 'herbs',
  crystal_cavern: 'crystal',
  golden_grove: 'amber',
  fossil_bed: 'curios',
  hot_spring: 'springs',
  healing_spring: 'springs',
  iron_seep: 'ore',
  mining: 'ore',
};

/** The resource deposit that counts as a special good when rich enough, and its good. */
export const SPECIAL_GOOD_BY_DEPOSIT: Readonly<Record<string, SpecialGood>> = {
  ore: 'ore',
};
