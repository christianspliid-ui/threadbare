/**
 * Resource classes — the economic layer over the terrain-seeded resources (THR-615).
 *
 * Each resource type (keyed by the same id used in `resource-content.ts`) gets an
 * economic class, a primary sphere affinity (for cosmological legibility), a base
 * trade value, and a scarcity sensitivity that scales how strongly local demand
 * draws its stock down. These feed the stock-tier derivation and the resource
 * balance term in prosperity.
 *
 * All magic numbers live here per NFP #1 (Tunability). The `primarySphere` is
 * restated from `RESOURCE_DEFINITIONS.sphereAffinities[0]` for legibility at the
 * economic layer; `resource-classes.test.ts` asserts the two stay consistent.
 */

import type { SphereName } from '../types/index';
import type { StockTier } from '../types/resource';

// ─── Class categories ─────────────────────────────────────────────────

/**
 * Coarse economic category. Drives default consumption behaviour and prose voice.
 * - staple    — food/water; consumed heavily by population; famine driver.
 * - strategic — building/war materials; moderate consumption.
 * - luxury    — trade goods; low consumption, high value, glut-prone.
 * - arcane    — rare relic/reagent goods; minimal consumption, highest value.
 */
export type ResourceClassCategory = 'staple' | 'strategic' | 'luxury' | 'arcane';

/** Economic profile for one resource type. */
export interface ResourceClass {
  /** Resource id (matches `RESOURCE_DEFINITIONS`). */
  id: string;
  category: ResourceClassCategory;
  /** Primary sphere this resource is aligned with (drift target in later phases). */
  primarySphere: SphereName;
  /** Relative trade/wealth weight (0-1). Weights the location's aggregate balance. */
  baseValue: number;
  /**
   * How sharply local demand pulls this resource toward scarcity (0-1.5).
   * Staples are high (population eats them); luxuries are low.
   */
  scarcitySensitivity: number;
}

// ─── Derivation constants ─────────────────────────────────────────────

/** Tier boundaries on the normalized balance (supply − consumption), range ≈ [-1, 1]. */
export const STOCK_SCARCE_THRESHOLD = -0.3;
export const STOCK_SURPLUS_THRESHOLD = 0.4;

/** Share of the prosperity equilibrium target drawn from resource balance (±100 × this). */
export const RESOURCE_BALANCE_PROSPERITY_WEIGHT = 0.15;

/** Max locations processed at full detail (chronicle + tug emission) per tick. */
export const ECON_PHASE_SPOTLIGHT_CAP = 40;

/** Local demand model — consumption pressure a location exerts on its resources. */
export const DEMAND_BASE = 0.15;               // floor demand for any location
export const DEMAND_PROSPERITY_WEIGHT = 0.35;  // contribution from prosperity/100
export const DEMAND_SUBLOCATION_WEIGHT = 0.30; // contribution from sublocation density
export const DEMAND_SUBLOCATION_CAP = 6;       // sublocation count at which the term saturates

/**
 * Only staple/strategic scarcity or glut crossings at or above this base value
 * earn a chronicle entry (avoids flooding the Great Chronicle with luxury noise).
 */
export const CHRONICLE_MIN_BASE_VALUE = 0.6;

/** Livelihood thread tug lifetime is inherited from the attention system; the
 * threat mapping below is local to the economy layer. */
export const LIVELIHOOD_TUG_FAMINE_THREAT = 'hard' as const;
export const LIVELIHOOD_TUG_GLUT_THREAT = 'moderate' as const;

// ─── The class table ──────────────────────────────────────────────────
//
// 18 resource types grouped into four categories. Sphere affinities mirror
// RESOURCE_DEFINITIONS[id].sphereAffinities[0].

export const RESOURCE_CLASSES: Readonly<Record<string, ResourceClass>> = {
  // ── Staples (food & water — famine drivers) ──
  grain:   { id: 'grain',   category: 'staple', primarySphere: 'life',   baseValue: 1.0, scarcitySensitivity: 1.2 },
  grazing: { id: 'grazing', category: 'staple', primarySphere: 'life',   baseValue: 0.8, scarcitySensitivity: 1.0 },
  fish:    { id: 'fish',    category: 'staple', primarySphere: 'life',   baseValue: 0.8, scarcitySensitivity: 1.0 },
  water:   { id: 'water',   category: 'staple', primarySphere: 'life',   baseValue: 0.7, scarcitySensitivity: 1.1 },

  // ── Strategic (building & war materials) ──
  timber:  { id: 'timber',  category: 'strategic', primarySphere: 'life',    baseValue: 0.9, scarcitySensitivity: 0.6 },
  stone:   { id: 'stone',   category: 'strategic', primarySphere: 'matter',  baseValue: 0.8, scarcitySensitivity: 0.4 },
  ore:     { id: 'ore',     category: 'strategic', primarySphere: 'matter',  baseValue: 1.1, scarcitySensitivity: 0.5 },
  peat:    { id: 'peat',    category: 'strategic', primarySphere: 'entropy', baseValue: 0.5, scarcitySensitivity: 0.5 },

  // ── Luxuries (trade goods — glut-prone) ──
  gemstones:     { id: 'gemstones',     category: 'luxury', primarySphere: 'matter', baseValue: 1.4, scarcitySensitivity: 0.2 },
  golden_sap:    { id: 'golden_sap',    category: 'luxury', primarySphere: 'life',   baseValue: 1.2, scarcitySensitivity: 0.25 },
  pearls:        { id: 'pearls',        category: 'luxury', primarySphere: 'spirit', baseValue: 1.3, scarcitySensitivity: 0.2 },
  medicinal_herb:{ id: 'medicinal_herb',category: 'luxury', primarySphere: 'life',   baseValue: 0.9, scarcitySensitivity: 0.4 },
  glowcap:       { id: 'glowcap',       category: 'luxury', primarySphere: 'mind',   baseValue: 0.9, scarcitySensitivity: 0.3 },

  // ── Arcane (rare relic/reagent goods — highest value, barely consumed) ──
  arcane_crystal:{ id: 'arcane_crystal',category: 'arcane', primarySphere: 'energy', baseValue: 1.5, scarcitySensitivity: 0.15 },
  ancient_relic: { id: 'ancient_relic', category: 'arcane', primarySphere: 'time',   baseValue: 1.6, scarcitySensitivity: 0.15 },
  sunken_gold:   { id: 'sunken_gold',   category: 'arcane', primarySphere: 'time',   baseValue: 1.5, scarcitySensitivity: 0.1 },
  fossil_amber:  { id: 'fossil_amber',  category: 'arcane', primarySphere: 'time',   baseValue: 1.3, scarcitySensitivity: 0.2 },
  star_metal:    { id: 'star_metal',    category: 'arcane', primarySphere: 'force',  baseValue: 1.6, scarcitySensitivity: 0.2 },
};

/** Fallback class for any resource id missing from the table (fail-soft). */
export const DEFAULT_RESOURCE_CLASS: ResourceClass = {
  id: 'unknown',
  category: 'strategic',
  primarySphere: 'matter',
  baseValue: 0.7,
  scarcitySensitivity: 0.6,
};

/** Look up a resource's class, falling back to a neutral profile. */
export function getResourceClass(resourceId: string): ResourceClass {
  return RESOURCE_CLASSES[resourceId] ?? DEFAULT_RESOURCE_CLASS;
}

// ─── Tier prose (baseline register — plainspoken Malazan, THR-609) ─────
//
// One fragment per (resourceId, tier). The Livelihood line composes these.
// No numbers, no flowery abstractions — a granary full or empty.

interface TierProse {
  scarce: string;
  adequate: string;
  surplus: string;
}

/** Generic per-category fallback prose when a specific resource has no entry. */
export const CATEGORY_TIER_PROSE: Readonly<Record<ResourceClassCategory, TierProse>> = {
  staple: {
    scarce: 'The tables here are thin. People eat less than they did, and watch the stores.',
    adequate: 'There is food enough to go around, most seasons.',
    surplus: 'The granaries are full, and the markets are loud with cheap bread.',
  },
  strategic: {
    scarce: 'The workshops run short of materials. Prices climb, and orders go unfilled.',
    adequate: 'The yards have what they need to keep working.',
    surplus: 'Raw stock piles up in the yards, more than the crafters can shape.',
  },
  luxury: {
    scarce: 'The fine goods have dried up. What little arrives is fought over.',
    adequate: 'The market carries its comforts, for those who can pay.',
    surplus: 'Luxuries glut the stalls, and even the merchants grumble at the prices.',
  },
  arcane: {
    scarce: 'The rare stock is all but gone. Seekers leave empty-handed.',
    adequate: 'A steady trickle of rare goods passes through, for the right buyer.',
    surplus: 'Rare finds are common here now, and their worth has started to slip.',
  },
};

/** Resource-specific tier prose. Missing ids fall back to `CATEGORY_TIER_PROSE`. */
export const RESOURCE_TIER_PROSE: Readonly<Record<string, TierProse>> = {
  grain: {
    scarce: 'The grain stores are low. Bread is dear, and the poor go hungry first.',
    adequate: 'The harvest keeps the ovens working and the people fed.',
    surplus: 'Grain overflows the silos. No one here has known hunger in years.',
  },
  fish: {
    scarce: 'The nets come up light. The fishers talk of moving on.',
    adequate: 'The catch is steady enough to feed the docks and salt the rest.',
    surplus: 'The boats come back heavy every day. Fish sells for almost nothing.',
  },
  water: {
    scarce: 'Water is rationed and watched. Dry seasons here are cruel.',
    adequate: 'The wells hold. No one goes thirsty who works for it.',
    surplus: 'Water runs free and clean. The fields drink their fill.',
  },
  grazing: {
    scarce: 'The pasture is bare and overgrazed. The herds are thin.',
    adequate: 'The grazing sustains the herds through the year.',
    surplus: 'The herds fatten on deep grass. There is meat and milk to spare.',
  },
  timber: {
    scarce: 'The good wood is cut out. Builders wait, or send far for their beams.',
    adequate: 'The sawyers keep the yards stocked with usable wood.',
    surplus: 'Timber stacks higher than the roofs. Anyone can build who has the hands.',
  },
  ore: {
    scarce: 'The veins run lean. The forges bank their fires and wait for metal.',
    adequate: 'The mines feed the forges at a workable pace.',
    surplus: 'Ore comes up faster than the smiths can work it. Iron is cheap here.',
  },
  stone: {
    scarce: 'Good stone is hard to come by. Great works stall for want of it.',
    adequate: 'The quarries supply what the masons need.',
    surplus: 'Cut stone lies stacked and waiting. Walls rise fast in a place like this.',
  },
};

/**
 * Compose the tier prose for a resource, preferring the specific entry.
 * Fail-soft: unknown ids fall back to category prose, then to 'adequate'.
 */
export function getResourceTierProse(resourceId: string, tier: StockTier): string {
  const specific = RESOURCE_TIER_PROSE[resourceId];
  if (specific) return specific[tier];
  const cat = getResourceClass(resourceId).category;
  return CATEGORY_TIER_PROSE[cat][tier];
}

// ─── Economic In-Prose Keywords (IPK, THR-615) ────────────────────────
//
// Famine / Glut / Monopoly / Embargo carry mechanical weight in prose.
// Rendered by `renderProseWithIPK` with these tooltips.

export const ECONOMY_KEYWORD_TOOLTIPS: Readonly<Record<string, string>> = {
  famine: 'A staple has crossed into scarcity — the people go hungry, and desperation breeds trouble.',
  glut: 'A good has flooded past demand — worth collapses, and those who trade in it suffer.',
  monopoly: 'One power holds a resource by the throat, setting its price and starving rivals of it.',
  embargo: 'A trade route has been cut — goods that once flowed here no longer arrive.',
};

/** Lowercased keyword set for fast membership tests in the prose parser. */
export const ECONOMY_KEYWORD_SET: ReadonlySet<string> = new Set(
  Object.keys(ECONOMY_KEYWORD_TOOLTIPS),
);
