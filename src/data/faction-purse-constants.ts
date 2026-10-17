/**
 * The faction purse — constants (THR-1931, from the THR-1867 decision and its prototype
 * `proto/thr-1867-faction-purse` @ 055aba10).
 *
 * Every faction gets a purse the land fills and war empties. The `faction_purse` phase
 * (`src/engine/factionPurse.ts`) pays five income sources daily, pays each army's upkeep,
 * and writes the Means band the faction sheet reads. Tables are data: a new faction type
 * earns by adding a row, never by a code branch (Law 42).
 *
 * | Name                           | Purpose                                                          |
 * |--------------------------------|------------------------------------------------------------------|
 * | FACTION_PURSE_ENABLED          | master switch and rollback lever                                 |
 * | PURSE_CYCLE_TICKS              | pay-day cadence — one day (TICKS_PER_DAY 12)                     |
 * | FACTION_TREASURY_CAP           | faction ceiling (mortals keep 0–100)                             |
 * | PURSE_EXCLUDED_FACTION_TYPES   | faction types outside the economy                                |
 * | TOWN_TAX_BASE                  | per held settlement per day at the prosperity pivot              |
 * | TOWN_TAX_PROSPERITY_PIVOT      | prosperity at which a town pays exactly TOWN_TAX_BASE            |
 * | SETTLEMENT_TIER_SUBTYPES       | which locationSubtypes pay town tax                              |
 * | YIELD_RATE                     | per 100 quantity of a resource class, per day                    |
 * | STOCK_TIER_MULT                | scarce / adequate / surplus multiplier on place yield            |
 * | TERRAIN_RENT_CATEGORY          | terrain → rent category                                          |
 * | HEX_RENT                       | per border hex per day, by rent category                         |
 * | GUILD_RATE                     | guild income per 100 matched units per day                       |
 * | GUILD_SUBLOCATION_UNITS        | matched units one affine Place counts as                         |
 * | GUILD_LANE_UNITS               | matched units one live lane touching the town counts as          |
 * | BANKER_TAX_BASE_SHARE          | bankers' matched units = town prosperity × this                  |
 * | LANDHOLDER_TAX_RATE            | the town's tax holder's cut of guild work there                  |
 * | GUILD_PLACE_AFFINITY           | what each guild type earns from                                  |
 * | DEFINITION_FACTION_AFFINITY    | definition faction → the affinity row it earns under             |
 * | ARMY_UPKEEP_PER_DAY            | daily upkeep by army size                                        |
 * | MEANS_BANDS_DAYS               | Means bands in days of upkeep in hand                            |
 * | MEANS_BANDS_ABSOLUTE           | Means bands for a faction that fields no army                    |
 * | FACTION_STARTING_PURSE         | opening coin for every faction                                   |
 * | FACTION_STARTING_UPKEEP_DAYS   | opening coin per day of fielded upkeep                           |
 * | PURSE_SCHISM_GRACE_DAYS        | days Destitute before the schism strain counts                   |
 * | PURSE_CHRONICLE_COOLDOWN_DAYS  | minimum days between two purse chronicle lines for one faction   |
 *
 * `SCHISM_WEIGHT_PURSE` lives with the other schism weights in `game-config.ts`;
 * `ARMY_CREATION_GOLD_COST` stays in `types/army.ts`, where it has always been.
 */

import type { ArmySizeCategory } from '../types/army';

/** Master switch. `false` restores main's pre-purse behaviour everywhere the purse touches. */
export const FACTION_PURSE_ENABLED = true;

export const PURSE_CYCLE_TICKS = 12;
export const FACTION_TREASURY_CAP = 1000;
export const PURSE_EXCLUDED_FACTION_TYPES: readonly string[] = ['monster'];

// ── 1. Town tax ──
export const TOWN_TAX_BASE = 0.8;
export const TOWN_TAX_PROSPERITY_PIVOT = 50;
/** THR-1934 — a Lawless town pays this share of its tax (nobody enforces the collector either). */
export const LAWLESS_TOWN_TAX_FACTOR = 0.5;
export const SETTLEMENT_TIER_SUBTYPES: readonly string[] = ['hamlet', 'town', 'city', 'capital'];

// ── 2. Place yield (stocks are read, never drained — flow is THR-1866 / THR-1923's) ──
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

// ── 5. Guild work ──
export const GUILD_RATE = 1.0;
export const GUILD_SUBLOCATION_UNITS = 50;
export const GUILD_LANE_UNITS = 50;
export const BANKER_TAX_BASE_SHARE = 1.0;
export const LANDHOLDER_TAX_RATE = 0.2;

export interface GuildAffinity {
  /** Resource ids whose stock at the town (and its Places) counts as matched units. */
  readonly resources: readonly string[];
  /** Place types (`sublocationTypeId` without its prefix) that each count GUILD_SUBLOCATION_UNITS. */
  readonly sublocationTypes: readonly string[];
  /** Whether each live trade lane touching the town counts GUILD_LANE_UNITS. */
  readonly lanes: boolean;
  /** Whether the town's prosperity counts as units (the bankers' share of the tax base). */
  readonly townTaxShare: boolean;
}

/**
 * What each faction type earns from — the natural-places table. THR-1923's
 * `faction-building-lean.ts` reads it when it lands (§ Wiring, order).
 */
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

/** Definition factions (`factionDefId`) → the affinity row they earn under. Unlisted defs earn no guild work. */
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
 * Daily upkeep by army size — the decision's flattened table (ratio 1.4× per step, so a
 * small realm keeps its host). `ARMY_MAINTENANCE_COST` stays stamped on the army for old
 * readers; nothing debits it.
 */
export const ARMY_UPKEEP_PER_DAY: Readonly<Record<ArmySizeCategory, number>> = {
  warband: 1.5,
  regiment: 2.5,
  host: 3.5,
};

// ── Means ──
/**
 * The shared five-word purse ladder (THR-1870 § 1) — the same words `getWealthTier`
 * gives a mortal. Only the measure differs: a faction with armies is banded by days of
 * upkeep in hand; one without, by coin alone.
 */
export type MeansBand = 'Destitute' | 'Getting by' | 'Comfortable' | 'Wealthy' | 'Magnate';
export const MEANS_BAND_ORDER: readonly MeansBand[] = ['Destitute', 'Getting by', 'Comfortable', 'Wealthy', 'Magnate'];
export const MEANS_BANDS_DAYS: readonly { band: MeansBand; below: number }[] = [
  { band: 'Destitute', below: 1 },
  { band: 'Getting by', below: 5 },
  { band: 'Comfortable', below: 15 },
  { band: 'Wealthy', below: 40 },
  { band: 'Magnate', below: Infinity },
];
export const MEANS_BANDS_ABSOLUTE: readonly { band: MeansBand; below: number }[] = [
  { band: 'Destitute', below: 1 },
  { band: 'Getting by', below: 15 },
  { band: 'Comfortable', below: 60 },
  { band: 'Wealthy', below: 250 },
  { band: 'Magnate', below: Infinity },
];

// ── Worldgen ──
export const FACTION_STARTING_PURSE = 10;
export const FACTION_STARTING_UPKEEP_DAYS = 20;

// ── Schism + chronicle ──
export const PURSE_SCHISM_GRACE_DAYS = 5;
export const PURSE_CHRONICLE_COOLDOWN_DAYS = 10;
