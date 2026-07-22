/**
 * Route Event Constants — THR-669 (Mortal Economy P2b).
 *
 * Route events materialize from cargo manifests: rich cargo draws banditry,
 * hostile-controlled endpoints breed toll disputes, staple-heavy routes into
 * scarcity build embargo pressure. Caravans are route STATE, not agents
 * (NFP #7 — the spotlight pattern): nothing is simulated per-caravan; a route
 * crossing a threshold plants an encounter seed for a nearby mortal and the
 * story happens where the attention is.
 *
 * The manifest itself already carries the two signals this system needs:
 * `totalValue` (richness — the banditry driver) and `carriesStaple` (the
 * famine-pressure flag), both derived at route formation (THR-616).
 *
 * All tunables named here (NFP #1).
 */

/** Ticks between route-event scans (12 ticks = one game day). */
export const ROUTE_EVENT_SCAN_INTERVAL_TICKS = 12;

/** Manifest totalValue at or above which banditry becomes possible. */
export const ROUTE_AMBUSH_RICHNESS_MIN = 2.0;

/** Chance per scan that an ambush-eligible route actually plants a banditry seed. */
export const ROUTE_AMBUSH_CHANCE = 0.2;

/** Chance per scan that a toll-eligible route (hostile endpoint controllers) plants a dispute seed. */
export const ROUTE_TOLL_CHANCE = 0.25;

/** Chance per scan that an embargo-eligible route (staple cargo into a scarce endpoint) plants a seed. */
export const ROUTE_EMBARGO_CHANCE = 0.15;

/** Ticks a planted route-event seed waits before it may spawn. */
export const ROUTE_EVENT_SEED_DELAY_TICKS = 4;

/** Priority carried by route-event seeds (1.0 = neutral). */
export const ROUTE_EVENT_SEED_PRIORITY = 1.1;

/** Max route-event seeds planted per scan, world-wide (attention budget). */
export const ROUTE_EVENT_MAX_SEEDS_PER_SCAN = 3;

/** Ticks an ambush-marked route stays `threatened` before the flag auto-clears. */
export const ROUTE_THREATENED_CLEAR_TICKS = 24;

/** Template ids — these are the catalyst ids merchantStrategicPack has referenced
 *  since P1; THR-669 finally authors them. */
export const ROUTE_AMBUSH_TEMPLATE_ID = 'encounter_route_ambush';
export const ROUTE_TOLL_TEMPLATE_ID = 'encounter_toll_dispute';
export const ROUTE_EMBARGO_TEMPLATE_ID = 'encounter_route_embargo';
