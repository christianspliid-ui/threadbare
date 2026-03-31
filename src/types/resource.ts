/**
 * Resource type definitions.
 *
 * Resources are properties on location nodes (not separate graph nodes).
 * Each location stores a Record<string, ResourceInstance> in its properties.
 */

import type { SphereName, TerrainType } from './index';

/** A resource instance at a specific location. */
export interface ResourceInstance {
  /** Abundance scale 0-100 (0 = exhausted, 100 = maximum abundance). */
  quantity: number;
  /** Whether this resource regenerates over time. */
  renewable: boolean;
  /** Per-cycle renewal fraction (0-1). Only meaningful if renewable=true. */
  renewalRate: number;
}

/** Static definition of a resource type — lives in content data. */
export interface ResourceDefinition {
  id: string;
  name: string;
  /** Terrains where this resource naturally occurs. */
  terrains: readonly TerrainType[];
  /** Quantity range [min, max] when seeded. */
  baseQuantity: readonly [number, number];
  /** Spheres that boost this resource's abundance. */
  sphereAffinities: readonly SphereName[];
  /** Whether it regenerates. */
  renewable: boolean;
  /** Base renewal rate (per-cycle fraction). */
  renewalRate: number;
  /** Short description for tooltips. */
  description: string;
}

/** Terrain-to-resource mapping entry used during world seeding. */
export interface TerrainResourceEntry {
  type: string;
  min: number;
  max: number;
}

/** Abundance label thresholds. */
export const RESOURCE_ABUNDANCE_THRESHOLDS = {
  abundant: 60,
  moderate: 30,
  scarce: 1,
} as const;

/** Get a human-readable abundance label from quantity. */
export function getAbundanceLabel(quantity: number): 'abundant' | 'moderate' | 'scarce' | 'exhausted' {
  if (quantity >= RESOURCE_ABUNDANCE_THRESHOLDS.abundant) return 'abundant';
  if (quantity >= RESOURCE_ABUNDANCE_THRESHOLDS.moderate) return 'moderate';
  if (quantity >= RESOURCE_ABUNDANCE_THRESHOLDS.scarce) return 'scarce';
  return 'exhausted';
}

/** Resource type icon mapping (emoji v1). */
export const RESOURCE_ICONS: Record<string, string> = {
  timber: '🪵',
  stone: '🪨',
  ore: '⛏️',
  water: '💧',
  fish: '🐟',
  grazing: '🌾',
  grain: '🌽',
  peat: '🟤',
  // Rare resources (anomaly-exclusive)
  gemstones: '💎',
  arcane_crystal: '🔮',
  golden_sap: '🍯',
  medicinal_herb: '🌿',
  ancient_relic: '🏺',
  sunken_gold: '🪙',
  fossil_amber: '🦴',
  star_metal: '☄️',
  pearls: '🫧',
  glowcap: '🍄',
};
