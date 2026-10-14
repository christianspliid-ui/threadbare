/**
 * Faction purse — PROTOTYPE constants (THR-1867). Throwaway branch `proto/thr-1867-faction-purse`;
 * read only by `scripts/proto/faction-purse-ledger.ts`, an observer ledger that never writes the world.
 *
 * | Name                         | Purpose                                                        |
 * |------------------------------|----------------------------------------------------------------|
 * | FACTION_TREASURY_CAP         | faction treasury ceiling (separate from the 0–100 mortal clamp)|
 * | PURSE_CYCLE_TICKS            | ledger cadence — one day (TICKS_PER_DAY 12)                    |
 * | TOWN_TAX_BASE                | per held settlement per day at prosperity 50                   |
 * | TOWN_TAX_PROSPERITY_PIVOT    | prosperity at which a town pays exactly TOWN_TAX_BASE          |
 * | SETTLEMENT_TIER_SUBTYPES     | which locationSubtypes pay town tax                            |
 * | YIELD_RATE                   | per 100 quantity of a resource class, per day                  |
 * | STOCK_TIER_MULT              | scarce / adequate / surplus multiplier on place yield          |
 * | TERRAIN_RENT_CATEGORY        | terrain → rent category                                        |
 * | HEX_RENT                     | per border hex per day, by rent category                       |
 * | GUILD_RATE                   | guild income per 100 matched units per day                     |
 * | GUILD_SUBLOCATION_UNITS      | matched units one affine sublocation counts as                 |
 * | GUILD_LANE_UNITS             | matched units one trade lane touching the home town counts as  |
 * | BANKER_TAX_BASE_SHARE        | bankers' matched units = home prosperity × this                |
 * | LANDHOLDER_TAX_RATE          | the town controller's cut of a guild's gross                   |
 * | GUILD_PLACE_AFFINITY         | what a guild type earns from                                   |
 * | ARMY_UPKEEP_SCALE            | per-day upkeep = ARMY_MAINTENANCE_COST × this                       |
 * | MEANS_BANDS_DAYS             | Means word bands, in days of upkeep the treasury covers        |
 * | MEANS_BANDS_ABSOLUTE         | fallback bands when upkeep is 0                                |
 */

export const FACTION_TREASURY_CAP = 1000;
export const PURSE_CYCLE_TICKS = 12;

// ── 1. Town tax ──
export const TOWN_TAX_BASE = 0.8;
export const TOWN_TAX_PROSPERITY_PIVOT = 50;
export const SETTLEMENT_TIER_SUBTYPES: readonly string[] = ['hamlet', 'town', 'city', 'capital'];

// ── 2. Place yield (stocks are read, never drained) ──
export const YIELD_RATE: Readonly<Record<string, number>> = {
  staple: 0.1,
  strategic: 0.2,
  luxury: 0.4,
  arcane: 0.6,
};
export const STOCK_TIER_MULT: Readonly<Record<string, number>> = {
  scarce: 0.5,
  adequate: 1.0,
  surplus: 1.25,
};

// ── 3. Land rent ──
export type RentCategory = 'staple' | 'timber' | 'stone' | 'wetland' | 'none';
export const TERRAIN_RENT_CATEGORY: Readonly<Record<string, RentCategory>> = {
  grassland: 'staple', farmland: 'staple', savanna: 'staple', steppe: 'staple', floodplain: 'staple', oasis: 'staple',
  temperate_forest: 'timber', dense_forest: 'timber', boreal_forest: 'timber', jungle: 'timber',
  tropical_forest: 'timber', evergreen_forest: 'timber', light_forest: 'timber', forested_hills: 'timber',
  great_home_trees: 'timber',
  hills: 'stone', mountains: 'stone', high_mountains: 'stone', plateau: 'stone', badlands: 'stone', mountain_pass: 'stone',
  swamp: 'wetland', marsh: 'wetland', moor_bog: 'wetland',
  // everything else (water, desert, tundra, ice, volcano, broken_lands, dead_forest) → 'none'
};
export const HEX_RENT: Readonly<Record<RentCategory, number>> = {
  staple: 0.015,
  timber: 0.012,
  stone: 0.008,
  wetland: 0.003,
  none: 0,
};

// ── Guild cut ──
export const GUILD_RATE = 1.0;
export const GUILD_SUBLOCATION_UNITS = 50;
export const GUILD_LANE_UNITS = 50;
export const BANKER_TAX_BASE_SHARE = 1.0;
export const LANDHOLDER_TAX_RATE = 0.2;

export interface GuildAffinity {
  resources: readonly string[];
  sublocationTypes: readonly string[];
  lanes: boolean;
  townTaxShare: boolean;
}
export const GUILD_PLACE_AFFINITY: Readonly<Record<string, GuildAffinity>> = {
  miners:    { resources: ['ore', 'stone'], sublocationTypes: ['mine', 'deep-gallery'], lanes: false, townTaxShare: false },
  merchants: { resources: [], sublocationTypes: ['market-district', 'harbor', 'caravan-rest'], lanes: true, townTaxShare: false },
  traders:   { resources: [], sublocationTypes: ['market-district', 'harbor', 'caravan-rest'], lanes: true, townTaxShare: false },
  bankers:   { resources: [], sublocationTypes: ['counting-house', 'exchange'], lanes: false, townTaxShare: true },
  artisans:  { resources: ['timber', 'stone'], sublocationTypes: ['workshop'], lanes: false, townTaxShare: false },
  thieves:   { resources: [], sublocationTypes: ['thieves-guild', 'smugglers-den'], lanes: false, townTaxShare: false },
  temples:   { resources: [], sublocationTypes: ['temple-quarter', 'beacon-shrine', 'shadow-shrine', 'shrine', 'temple'], lanes: false, townTaxShare: false },
  builders:  { resources: ['stone', 'timber'], sublocationTypes: [], lanes: false, townTaxShare: false },
};
/** Definition factions (factionDefId) → the affinity they earn under. Unlisted defs earn no guild cut. */
export const DEFINITION_FACTION_AFFINITY: Readonly<Record<string, string>> = {
  merchant_consortium: 'merchants',
  thieves_guild: 'thieves',
  underking_court: 'thieves',
  temple_of_spheres: 'temples',
  holy_order_dawn: 'temples',
  builders_fellowship: 'builders',
};

// ── Spending ──
/**
 * Upkeep per day = ARMY_MAINTENANCE_COST[size] × this. 12 is the literal "per tick" reading of
 * ARMY_MAINTENANCE_COST (army.ts:47 comment, debug tab renders "/tick"; nothing reads it). Calibrated: 0.6.
 */
export const ARMY_UPKEEP_SCALE = 0.6;

// ── Means ──
export const MEANS_BANDS_DAYS: readonly { word: string; below: number }[] = [
  { word: 'Bankrupt', below: 1 },
  { word: 'Strained', below: 5 },
  { word: 'Solvent', below: 15 },
  { word: 'Flush', below: 40 },
  { word: 'Overflowing', below: Infinity },
];
export const MEANS_BANDS_ABSOLUTE: readonly { word: string; below: number }[] = [
  { word: 'Bankrupt', below: 1 },
  { word: 'Strained', below: 15 },
  { word: 'Solvent', below: 60 },
  { word: 'Flush', below: 250 },
  { word: 'Overflowing', below: Infinity },
];
