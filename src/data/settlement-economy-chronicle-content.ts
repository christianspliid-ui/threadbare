/**
 * The settlement economy's Great Chronicle lines (THR-1923; plan
 * `Docs/plans/2026-10-14-thr-1923-settlement-economy.md` § Prose tables).
 *
 * Game register (prose doctrine v2: GM narration). Resolved through the economic chronicle
 * resolver. `{settlement}` is the settlement; `{target}` the buyer of a surplus route;
 * `{goodsType}` a building's card name in lower case. `surplus_route_born` picks its line
 * by what the route carries and hands it, already filled, to the resolver as `{flavor}`.
 *
 * Told for full-detail settlements only (the top `ECON_PHASE_SPOTLIGHT_CAP` by population
 * and any settlement a threaded mortal lives in). A line whose name slot cannot be filled
 * is dropped, never printed with a hole (UI Law 14).
 */

export const SETTLEMENT_ECONOMY_CHRONICLE_TEMPLATES = {
  building_raised: [
    '{settlement} has more timber and stone than it needs, and has put them into its own {goodsType}.',
    'With wood and stone to spare, the people of {settlement} have built their own {goodsType}.',
    'Spare timber and stone have become something lasting in {settlement}: the town now has its own {goodsType}.',
  ],
  building_lost: [
    'The {goodsType} at {settlement} stands empty now. The town could not keep it going.',
    'No one works the {goodsType} at {settlement} any more, and its doors are shut.',
    'The {goodsType} at {settlement} has fallen out of use. Its people have taken its stones for other work.',
  ],
  surplus_route_born: ['{flavor}'],
  surplus_route_ended: [
    'The carts from {settlement} no longer come. Its fields feed only {settlement} now.',
    '{settlement} has nothing left over to sell, and the carts have stopped.',
    'The road from {settlement} is quiet. What its people make, they now keep.',
  ],
  settlement_starving: [
    "{settlement}'s stores are empty and its fields cannot feed its people. Families are leaving.",
    'There is no grain left in {settlement}, and the fields give too little. People go hungry.',
    'Hunger has come to {settlement}. Its fields cannot feed everyone who lives there.',
  ],
  seat_lost_shrinking: [
    'With the court gone from {settlement}, the wagons stop coming. The city is growing smaller.',
    'The court has left {settlement}. The wagons that fed it now go elsewhere.',
    '{settlement} has lost its court, and with it the carts that kept it large.',
  ],
} as const;

/** `surplus_route_born`, by what the route carries. `{settlement}` the seller, `{target}` the buyer. */
export const SURPLUS_ROUTE_BORN_LINES: Readonly<Record<'food' | 'goods', readonly string[]>> = {
  food: [
    '{settlement} grows more grain than it can eat. Carts now leave for {target} every morning.',
    "{settlement}'s fields feed it with grain to spare, and the spare grain now goes by cart to {target}.",
    'There is more grain in {settlement} than mouths to eat it. The carts have started rolling to {target}.',
  ],
  goods: [
    '{settlement} makes more wares than it can use. Carts of them now leave for {target}.',
    "The workshops of {settlement} turn out more than the town can use, and the rest goes by road to {target}.",
    '{settlement} has wares to spare, and traders now carry them to {target}.',
  ],
};

export const SETTLEMENT_ECONOMY_CHRONICLE_SIGNIFICANCE = {
  building_raised: 0.45,
  building_lost: 0.5,
  surplus_route_born: 0.45,
  surplus_route_ended: 0.4,
  settlement_starving: 0.65,
  seat_lost_shrinking: 0.6,
} as const;

/** Default chapter titles. A raised building uses its own (`raisedTitle`); hunger names the town. */
export const SETTLEMENT_ECONOMY_CHRONICLE_TITLES = {
  building_raised: 'New Walls Rise',
  building_lost: 'The Fires Go Out',
  surplus_route_born: 'A Road Fills With Grain',
  surplus_route_ended: 'The Carts Stop',
  settlement_starving: 'Hunger in the Land',
  seat_lost_shrinking: 'The Court Has Gone',
} as const;

/** Per-carry titles for `surplus_route_born`. */
export const SURPLUS_ROUTE_BORN_TITLES: Readonly<Record<'food' | 'goods', string>> = {
  food: 'A Road Fills With Grain',
  goods: 'A Road Fills With Wares',
};

/** The starving chapter title, with the town's name: "Hunger at Meadowcity". */
export function starvingTitle(settlementName: string): string {
  return `Hunger at ${settlementName}`;
}
