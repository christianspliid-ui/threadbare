/**
 * The buildings a settlement raises from its surplus (THR-1923).
 *
 * A building is a Place (UL: Place = sublocation) the settlement economy raised, marked
 * `isBuilding: true`. It maps onto an **existing** Place type wherever one exists; five
 * types are new (`housing-quarter`, `mill`, `timber-yard`, `lapidary`, `carvers-hall`).
 * One entry per building (UI Law 58): a new building is one row here, and
 * `settlementBuildings.test.ts` fails a row whose Place type has no category art or whose
 * tooltip is missing.
 *
 * **Order matters.** The building choice draws one seeded jitter per candidate in this
 * table's order (plan § PRNG callouts), so reordering rows changes every world.
 *
 * Plan: Docs/plans/2026-10-14-thr-1923-settlement-economy.md § Data tables, § Building and
 * trait text. The card names and tooltips are the plan's, verbatim.
 */
import type { SpecialGood } from './special-goods';
import { LOCATION_TRAIT_IDS } from './location-trait-constants';

export type BuildingTag = 'growth' | 'food' | 'wood' | 'stone' | 'trade' | 'craft' | 'faith';

/** What must hold before a building is a candidate. Every listed field must hold. */
export interface BuildingNeeds {
  /** Land food yield (worked hexes plus the centre, before imports) at least this. */
  readonly foodYield?: number;
  readonly woodYield?: number;
  readonly stoneYield?: number;
  /** Owned hexes of field / fishing / grazing terrain (`terrain-yields.ts` sets). */
  readonly fieldHexes?: number;
  readonly fishingHexes?: number;
  readonly grazingHexes?: number;
  /** A special good in reach. */
  readonly special?: SpecialGood;
  /** Surplus routes touching the settlement. */
  readonly routes?: number;
  readonly population?: number;
  /** Walls: stone yield at least this, **or** the settlement is a faction seat. */
  readonly stoneOrSeat?: number;
  /** Shrine: the holder leans to the shrine, or a faith building already stands. */
  readonly faithLeanOrBuilding?: boolean;
}

/** What a standing (not idle) building does. Multipliers compound across buildings. */
export interface BuildingEffects {
  readonly food?: number;
  readonly wood?: number;
  readonly stone?: number;
  readonly happy?: number;
  readonly routeCap?: number;
  /** Extra exportable goods a day. */
  readonly goods?: number;
  /** Homes added to the population cap. */
  readonly homes?: number;
}

export interface SettlementBuildingDef {
  readonly id: string;
  /** The Place type it raises (`sublocation-type.<id>`). */
  readonly sublocationTypeId: string;
  readonly tag: BuildingTag;
  /** Build points (wood + stone) to raise it. */
  readonly cost: number;
  /** Daily wood/stone upkeep. */
  readonly upkeep: number;
  readonly needs?: BuildingNeeds;
  readonly effects: BuildingEffects;
  /** The location trait a standing building gives the settlement. */
  readonly trait?: string;
  /** Existing Place types it adopts (counted as built at day 0, grandfathered past the slots). */
  readonly adoptsTypes?: readonly string[];
  /** The card name the player reads. */
  readonly cardName: string;
  /** Registry tooltip (`location.building.<id>`), ≤ 200 characters, no numbers (Laws 13, 18). */
  readonly tooltip: string;
  /** Great Chronicle title when it is raised. */
  readonly raisedTitle: string;
  /** What its upkeep is paid in, for the idle reason ("cannot spare the stone"). */
  readonly upkeepWord: 'timber' | 'stone';
}

/** The traits standing buildings give (the rules live in `phaseLocationTraits`). */
const TR = LOCATION_TRAIT_IDS;

export const SETTLEMENT_BUILDINGS: readonly SettlementBuildingDef[] = [
  {
    id: 'housing', sublocationTypeId: 'sublocation-type.housing-quarter', tag: 'growth',
    cost: 18, upkeep: 0.1, effects: { homes: 3 },
    cardName: 'Housing quarter', upkeepWord: 'timber', raisedTitle: 'New Homes Rise',
    tooltip: 'New homes, built from spare timber and stone. More people can live here.',
  },
  {
    id: 'storehouse', sublocationTypeId: 'sublocation-type.warehouse', tag: 'food',
    cost: 15, upkeep: 0.1, needs: { foodYield: 6 }, effects: { food: 1.15 },
    cardName: 'Storehouse', upkeepWord: 'timber', raisedTitle: 'A Storehouse Is Filled',
    tooltip: 'Spare grain is kept dry here, so a lean week does not mean a hungry one.',
  },
  {
    id: 'mill', sublocationTypeId: 'sublocation-type.mill', tag: 'food',
    cost: 22, upkeep: 0.2, needs: { fieldHexes: 3 }, effects: { food: 1.2 },
    cardName: 'Mill', upkeepWord: 'timber', raisedTitle: 'The Mill Wheel Turns',
    tooltip: 'The grain from the fields is ground here. The same harvest feeds more mouths.',
  },
  {
    id: 'fishery', sublocationTypeId: 'sublocation-type.wharf', tag: 'food',
    cost: 15, upkeep: 0.1, needs: { fishingHexes: 2 }, effects: { food: 1.15 },
    trait: TR.fishingPort,
    cardName: 'Wharf', upkeepWord: 'timber', raisedTitle: 'Boats Put Out',
    tooltip: 'Boats go out from here each dawn. The catch feeds the town.',
  },
  {
    id: 'stockyard', sublocationTypeId: 'sublocation-type.beast-pen', tag: 'food',
    cost: 15, upkeep: 0.1, needs: { grazingHexes: 3 }, effects: { food: 1.1 },
    trait: TR.horseCountry,
    cardName: 'Beast pens', upkeepWord: 'timber', raisedTitle: 'The Herds Come In',
    tooltip: 'Herds from the grasslands are kept and fattened here.',
  },
  {
    id: 'timber_yard', sublocationTypeId: 'sublocation-type.timber-yard', tag: 'wood',
    cost: 15, upkeep: 0, needs: { woodYield: 3 }, effects: { wood: 1.3 },
    trait: TR.timberTown,
    cardName: 'Timber yard', upkeepWord: 'timber', raisedTitle: 'A Timber Yard Opens',
    tooltip: 'Raised from spare timber. More wood is cut here each day, and leftover wares are sold to other towns.',
  },
  {
    id: 'stoneworks', sublocationTypeId: 'sublocation-type.mason-yard', tag: 'stone',
    cost: 18, upkeep: 0.1, needs: { stoneYield: 3 }, effects: { stone: 1.3 },
    trait: TR.quarryTown,
    cardName: "Mason's yard", upkeepWord: 'stone', raisedTitle: 'The Masons Set to Work',
    tooltip: 'Stone from the nearby slopes is cut and dressed here.',
  },
  {
    id: 'walls', sublocationTypeId: 'sublocation-type.city-walls', tag: 'stone',
    cost: 30, upkeep: 0.3, needs: { population: 4, stoneOrSeat: 2 }, effects: { happy: 1 },
    trait: TR.walled,
    cardName: 'Town walls', upkeepWord: 'stone', raisedTitle: 'New Walls Rise',
    tooltip: 'Stone walls around the town. Its people sleep easier behind them.',
  },
  {
    id: 'market', sublocationTypeId: 'sublocation-type.market-district', tag: 'trade',
    cost: 24, upkeep: 0.2, needs: { routes: 2 }, effects: { happy: 1, routeCap: 1 },
    adoptsTypes: ['sublocation-type.market-district'],
    cardName: 'Market district', upkeepWord: 'timber', raisedTitle: 'A Market Opens',
    tooltip: 'Traders from other towns come here to buy and sell. More roads can run through.',
  },
  {
    id: 'counting_house', sublocationTypeId: 'sublocation-type.counting-house', tag: 'trade',
    cost: 26, upkeep: 0.2, needs: { routes: 1 }, effects: { routeCap: 1 },
    adoptsTypes: ['sublocation-type.counting-house'],
    cardName: 'Counting house', upkeepWord: 'timber', raisedTitle: 'The Ledgers Open',
    tooltip: 'Merchants keep their ledgers here. The town can trade along more roads.',
  },
  {
    id: 'workshop', sublocationTypeId: 'sublocation-type.workshop', tag: 'craft',
    cost: 24, upkeep: 0.3, needs: { woodYield: 2 }, effects: { goods: 1 },
    adoptsTypes: ['sublocation-type.workshop', 'sublocation-type.manufactory'],
    cardName: 'Workshop', upkeepWord: 'timber', raisedTitle: 'The Workshops Hum',
    tooltip: 'Spare timber is turned into wares here, and the wares are sold to other towns.',
  },
  {
    id: 'smithy', sublocationTypeId: 'sublocation-type.smithy', tag: 'craft',
    cost: 20, upkeep: 0.3, needs: { special: 'ore' }, effects: {},
    trait: TR.ironTown,
    cardName: 'Smithy', upkeepWord: 'timber', raisedTitle: 'The Smithy Is Lit',
    tooltip: 'Ore from nearby is worked into tools and blades here.',
  },
  {
    id: 'lapidary', sublocationTypeId: 'sublocation-type.lapidary', tag: 'craft',
    cost: 20, upkeep: 0.2, needs: { special: 'gems' }, effects: { goods: 1 },
    trait: TR.gemCutters,
    cardName: "Gem-cutter's hall", upkeepWord: 'timber', raisedTitle: 'The Gem-cutters Settle',
    tooltip: 'Stones from the nearby deposit are cut and polished here, then sold far away.',
  },
  {
    id: 'herbalist', sublocationTypeId: 'sublocation-type.herbalist-hut', tag: 'faith',
    cost: 18, upkeep: 0.1, needs: { special: 'herbs' }, effects: { happy: 1 },
    trait: TR.herbTown,
    cardName: "Herbalist's hut", upkeepWord: 'timber', raisedTitle: 'The Herb Bundles Hang to Dry',
    tooltip: 'Herbs from the nearby gardens are dried and mixed into remedies here.',
  },
  {
    id: 'bathhouse', sublocationTypeId: 'sublocation-type.healing-spring', tag: 'faith',
    cost: 20, upkeep: 0.2, needs: { special: 'springs' }, effects: { happy: 2 },
    trait: TR.spaTown,
    cardName: 'Healing spring', upkeepWord: 'stone', raisedTitle: 'The Spring Is Walled',
    tooltip: 'The warm spring nearby is walled and roofed. People come to rest in it.',
  },
  {
    id: 'seers_hall', sublocationTypeId: 'sublocation-type.oracle-chamber', tag: 'faith',
    cost: 22, upkeep: 0.2, needs: { special: 'crystal' }, effects: {},
    trait: TR.crystalSeers,
    cardName: 'Oracle chamber', upkeepWord: 'timber', raisedTitle: 'The Seers Take Their Seats',
    tooltip: 'Crystal from the nearby caverns is read here for omens.',
  },
  {
    id: 'carvers_hall', sublocationTypeId: 'sublocation-type.carvers-hall', tag: 'craft',
    cost: 18, upkeep: 0.1, needs: { special: 'amber' }, effects: { goods: 1 },
    trait: TR.amberMarket,
    cardName: "Carvers' hall", upkeepWord: 'timber', raisedTitle: 'The Amber Carvers Open Their Hall',
    tooltip: 'Amber from the nearby grove is carved here into charms and trinkets.',
  },
  {
    id: 'curio_hall', sublocationTypeId: 'sublocation-type.chronicle-hall', tag: 'faith',
    cost: 18, upkeep: 0.1, needs: { special: 'curios' }, effects: {},
    trait: TR.curioCollectors,
    cardName: 'Chronicle hall', upkeepWord: 'timber', raisedTitle: 'Old Bones Go on Show',
    tooltip: 'Old bones and stones dug up nearby are kept and shown here.',
  },
  {
    id: 'shrine', sublocationTypeId: 'sublocation-type.shrine', tag: 'faith',
    cost: 16, upkeep: 0.1, needs: { population: 3, faithLeanOrBuilding: true }, effects: { happy: 1 },
    adoptsTypes: ['sublocation-type.shrine', 'sublocation-type.temple-quarter'],
    cardName: 'Shrine', upkeepWord: 'timber', raisedTitle: 'A Shrine Is Raised',
    tooltip: 'A small holy place. It comforts the people who live here.',
  },
];

const BY_ID: ReadonlyMap<string, SettlementBuildingDef> = new Map(SETTLEMENT_BUILDINGS.map(b => [b.id, b]));

export function getSettlementBuilding(id: string): SettlementBuildingDef | undefined {
  return BY_ID.get(id);
}

/** Place type → the building that adopts it (or raises it). First row wins. */
const BY_PLACE_TYPE: ReadonlyMap<string, SettlementBuildingDef> = (() => {
  const m = new Map<string, SettlementBuildingDef>();
  for (const b of SETTLEMENT_BUILDINGS) {
    for (const t of [b.sublocationTypeId, ...(b.adoptsTypes ?? [])]) if (!m.has(t)) m.set(t, b);
  }
  return m;
})();

/** The building an existing Place of this type stands for, if any. */
export function buildingForPlaceType(sublocationTypeId: string): SettlementBuildingDef | undefined {
  return BY_PLACE_TYPE.get(sublocationTypeId);
}

/** The five Place types this plan introduces. Each carries a category-art entry. */
export const NEW_BUILDING_PLACE_TYPES: readonly string[] = [
  'sublocation-type.housing-quarter',
  'sublocation-type.mill',
  'sublocation-type.timber-yard',
  'sublocation-type.lapidary',
  'sublocation-type.carvers-hall',
];
