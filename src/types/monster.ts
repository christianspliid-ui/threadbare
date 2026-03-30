/**
 * Monster Encounter Type System — plan m2.5-01
 *
 * Defines types for lairs, monster archetypes, and the danger gradient
 * used by the lair seeding pass at worldgen.
 *
 * NFP #1 Tunability: SPHERE_ARCHETYPE_MAP and DANGER_ZONE_LABELS are named constants.
 * NFP #3 Determinism: No runtime randomness in type definitions.
 */

import type { SphereName } from './index';

// ─── Lair Tier ────────────────────────────────────────────────────────────────

/** Escalation tier of a monster lair */
export type LairTier = 'minor' | 'major' | 'legendary';

// ─── Danger Zone ─────────────────────────────────────────────────────────────

/** Province role mapped to danger zone label for lair density + encounter difficulty */
export type DangerZone = 'capital' | 'heartland' | 'borderland' | 'wilderness';

// ─── Lair Properties ─────────────────────────────────────────────────────────

/**
 * Properties stored on a lair location graph node.
 * Lives under graphNode.properties.
 */
export interface LairProperties {
  lairTier: LairTier;
  dominantSphere: SphereName;
  spawnedAtTick: number;
  lastEscalationTick: number;
  dangerZone: DangerZone;
  /** Optional: faction node ID for this lair's monster faction instance */
  monsterFactionId?: string;
  /** Optional: node ID for the named elite boss of this lair */
  namedEliteId?: string;
  /** Set when the lair is cleared by a faction */
  clearedAtTick?: number;
  /** Faction ID that cleared this lair */
  clearedByFactionId?: string;
}

// ─── Monster Archetype ───────────────────────────────────────────────────────

/** Thematic description of a sphere's monster archetype for prose generation */
export interface MonsterArchetype {
  sphere: SphereName;
  name: string;
  description: string;
}

// ─── Sphere Archetype Map ────────────────────────────────────────────────────

/**
 * One archetype per creation sphere — used for lair naming and encounter prose.
 * Exactly 8 entries (force, matter, energy, life, mind, spirit, time, entropy).
 *
 * NFP #1: All descriptions are named constants here — prose templates reference
 * this map rather than hardcoding sphere-monster relationships.
 */
export const SPHERE_ARCHETYPE_MAP: Record<string, MonsterArchetype> = {
  force:   { sphere: 'force',   name: 'War Beast',           description: 'Heavy-limbed predators, armored hides' },
  matter:  { sphere: 'matter',  name: 'Stone Golem',         description: 'Mineral, crystalline, near-indestructible' },
  energy:  { sphere: 'energy',  name: 'Storm Drake',         description: 'Crackling electricity, fast, erratic' },
  life:    { sphere: 'life',    name: 'Primordial Behemoth', description: 'Enormous, overgrown, ancient fauna' },
  mind:    { sphere: 'mind',    name: 'Mindcrawler',         description: 'Unseen, infiltrating, targets agents' },
  spirit:  { sphere: 'spirit',  name: 'Wraith Host',         description: 'Spectral, ethereal, draining' },
  time:    { sphere: 'time',    name: 'Echo Stalker',        description: 'Time-distorted, attacks in temporal bursts' },
  entropy: { sphere: 'entropy', name: 'Plague Shambler',     description: 'Decaying, spreading rot' },
};

// ─── Danger Zone Labels ──────────────────────────────────────────────────────

/**
 * Human-readable danger labels for each zone — shown in UI (HexChronicle, TooltipPanel).
 *
 * NFP #1: All labels are named here — UI components read from this map.
 */
export const DANGER_ZONE_LABELS: Record<DangerZone, string> = {
  capital:    'Safe',
  heartland:  'Low Risk',
  borderland: 'Moderate Risk',
  wilderness: 'Danger Zone',
};
