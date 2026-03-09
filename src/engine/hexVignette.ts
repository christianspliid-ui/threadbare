/**
 * Hex Vignette Engine — builds prose descriptions for hex tooltips.
 *
 * Seven-stage pipeline:
 * 1. Terrain Opening    → base sentence from TERRAIN_OPENINGS[terrain]
 * 2. Climate Feel       → append to tier1 from CLIMATE_MATRIX[tempBand][moistBand]
 * 3. Population Sense   → tier2[0] from POPULATION_PHRASES[band]
 * 4. Location Spotlights → tier2[1..N] with filled LOCATION_TEMPLATES
 * 5. Cultural Color     → tier3 sentences from CULTURE_PHRASES
 * 6. Sphere Aura        → tier3 sentences from SPHERE_AURA_PHRASES
 * 7. Strategic Layer    → tier3 sentences from FACTION_PHRASES + ENCOUNTER_PHRASES
 *
 * Deterministic PRNG: baseSeed = hashSeed(seed, col × 1000 + row)
 * Different extra values per stage for PRNG independence.
 */

import type { WorldGraph } from './graph';
import type { HexTile, HexCoord, SphereName } from '../types';
import type { HexVisibilityState } from '../types/visibility';
import type { FamiliarityMap } from '../types/familiarity';
import type {
  TemperatureBand,
  MoistureBand,
  PopulationBand,
  CompassDirection,
  HexVignette,
} from '../types/hexVignette';
import {
  TEMPERATURE_THRESHOLDS,
  MOISTURE_THRESHOLDS,
  POPULATION_THRESHOLDS,
  SPHERE_AURA_THRESHOLD,
  MAX_LOCATION_SPOTLIGHTS,
  MAX_TIER2_SENTENCES,
  MAX_TIER3_SENTENCES,
} from '../types/hexVignette';
import {
  TERRAIN_OPENINGS,
  CLIMATE_MATRIX,
  POPULATION_PHRASES,
  LOCATION_TEMPLATES,
  CULTURE_PHRASES,
  SPHERE_AURA_PHRASES,
  FACTION_PHRASES,
  ENCOUNTER_PHRASES,
  COMPASS_WORDS,
  VISIBILITY_WRAPPERS,
  SUBTYPE_DISPLAY_NAMES,
} from '../data/hex-vignette-content';
import { getLocationsInHex, getAgentsAtLocation, getHexSphereInfluence, getHexCultures, getHexFactions } from './hexZoom';
import { SPHERE_NAMES } from '../types';
import { hexDistance } from '../lib/hexMath';

// ─── Helper Functions ───────────────────────────────────────────────

/**
 * Get temperature band from normalized 0.0–1.0 value.
 * Thresholds: <0.2=frigid, <0.4=cold, <0.6=temperate, <0.8=warm, >=0.8=scorching
 */
export function getTemperatureBand(temperature: number): TemperatureBand {
  if (temperature < TEMPERATURE_THRESHOLDS[0]) return 'frigid';
  if (temperature < TEMPERATURE_THRESHOLDS[1]) return 'cold';
  if (temperature < TEMPERATURE_THRESHOLDS[2]) return 'temperate';
  if (temperature < TEMPERATURE_THRESHOLDS[3]) return 'warm';
  return 'scorching';
}

/**
 * Get moisture band from normalized 0.0–1.0 value.
 * Thresholds: <0.2=arid, <0.4=dry, <0.6=moderate, <0.8=damp, >=0.8=saturated
 */
export function getMoistureBand(moisture: number): MoistureBand {
  if (moisture < MOISTURE_THRESHOLDS[0]) return 'arid';
  if (moisture < MOISTURE_THRESHOLDS[1]) return 'dry';
  if (moisture < MOISTURE_THRESHOLDS[2]) return 'moderate';
  if (moisture < MOISTURE_THRESHOLDS[3]) return 'damp';
  return 'saturated';
}

/**
 * Get population band from location/agent count.
 * Thresholds: 0=empty, 1+=sparse, 3+=moderate, 6+=bustling
 */
export function getPopulationBand(count: number): PopulationBand {
  if (count === 0) return 'empty';
  if (count < POPULATION_THRESHOLDS.moderate) return 'sparse';
  if (count < POPULATION_THRESHOLDS.bustling) return 'moderate';
  return 'bustling';
}

/**
 * Get compass direction from angle in degrees.
 * 0=east, 45=northeast, 90=north, 135=northwest, 180=west, etc.
 * Each direction occupies 45° centered on cardinal/intercardinal: east [315,45), north [45,135), etc.
 */
export function getCompassDirection(angleDeg: number): CompassDirection {
  // Normalize to [0, 360)
  const normalized = ((angleDeg % 360) + 360) % 360;

  // 8 directions, 45° each
  // east [315,45), northeast [45,135), north [45,135)... wait, let me recalculate
  // 0° = East, 90° = North, 180° = West, 270° = South
  // Sectors of 45°:
  // [315, 45) = East
  // [45, 135) = North
  // [135, 225) = West
  // [225, 315) = South
  // But we want 8 directions: E, NE, N, NW, W, SW, S, SE
  // [337.5, 22.5) = East
  // [22.5, 67.5) = Northeast
  // [67.5, 112.5) = North
  // [112.5, 157.5) = Northwest
  // [157.5, 202.5) = West
  // [202.5, 247.5) = Southwest
  // [247.5, 292.5) = South
  // [292.5, 337.5) = Southeast

  if (normalized >= 337.5 || normalized < 22.5) return 'east';
  if (normalized >= 22.5 && normalized < 67.5) return 'northeast';
  if (normalized >= 67.5 && normalized < 112.5) return 'north';
  if (normalized >= 112.5 && normalized < 157.5) return 'northwest';
  if (normalized >= 157.5 && normalized < 202.5) return 'west';
  if (normalized >= 202.5 && normalized < 247.5) return 'southwest';
  if (normalized >= 247.5 && normalized < 292.5) return 'south';
  return 'southeast'; // [292.5, 337.5)
}

// ─── Internal Helpers ───────────────────────────────────────────────

/**
 * Deterministic hash combining a base seed with extra values.
 * Uses a simple multiplicative hash for seeding PRNG.
 */
function hashSeed(seed: number, ...extra: number[]): number {
  let hash = seed;
  for (const val of extra) {
    hash = ((hash ^ val) * 2654435761) >>> 0; // Fowler-Noll-Vo 32-bit
  }
  return Math.abs(hash);
}

/**
 * Seeded PRNG pick: select pseudorandom element from array.
 * Uses hashSeed(seed, ...extra) mod array length.
 */
function pick<T>(arr: readonly T[], seed: number, ...extra: number[]): T {
  if (arr.length === 0) return undefined as unknown as T;
  const hash = hashSeed(seed, ...extra);
  return arr[hash % arr.length];
}

// ─── Main Pipeline ───────────────────────────────────────────────────

/**
 * Build a complete HexVignette for the given hex.
 *
 * 7-stage pipeline with visibility voice transformations applied at the end.
 */
export function buildHexVignette(
  graph: WorldGraph,
  tiles: HexTile[],
  hexCoord: HexCoord,
  visibility: HexVisibilityState,
  avatarHex: HexCoord | null,
  familiarityMap: FamiliarityMap,
  seed: number,
): HexVignette {
  // Empty vignette for unexplored hexes
  if (visibility === 'unexplored') {
    return {
      tier1: '',
      tier2: [],
      tier3: [],
      clickTarget: hexCoord,
    };
  }

  // Find the hex tile for geoParams
  const tile = tiles.find(t => t.coord.col === hexCoord.col && t.coord.row === hexCoord.row);
  if (!tile) {
    return {
      tier1: '',
      tier2: [],
      tier3: [],
      clickTarget: hexCoord,
    };
  }

  const baseSeed = hashSeed(seed, hexCoord.col * 1000 + hexCoord.row);
  const geoParams = tile.geoParams;

  // ─── Stage 1: Terrain Opening ───────────────────────────────────

  const terrainOpen = pick(TERRAIN_OPENINGS[tile.terrain], baseSeed, 1);

  // ─── Stage 2: Climate Feel ──────────────────────────────────────

  const tempBand = getTemperatureBand(geoParams.temperature);
  const moistBand = getMoistureBand(geoParams.moisture);
  const climateClause = pick(CLIMATE_MATRIX[tempBand][moistBand], baseSeed, 2);
  const tier1 = `${terrainOpen} ${climateClause}`;

  // ─── Stage 3: Population Sense ──────────────────────────────────

  const locations = getLocationsInHex(graph, hexCoord.col, hexCoord.row);
  const agentCount = locations.reduce((acc, loc) => {
    const agents = getAgentsAtLocation(graph, loc.id);
    return acc + agents.length;
  }, 0);
  const populationCount = locations.length + agentCount;
  const popBand = getPopulationBand(populationCount);
  const popPhrase = pick(POPULATION_PHRASES[popBand], baseSeed, 3);

  const tier2: string[] = [popPhrase];

  // ─── Stage 4: Location Spotlights ───────────────────────────────

  const spotlights = locations.slice(0, MAX_LOCATION_SPOTLIGHTS);
  for (let i = 0; i < spotlights.length; i++) {
    const loc = spotlights[i];
    const locProps = loc.properties as Record<string, unknown>;

    // Get location direction relative to avatar or hex center
    let direction: CompassDirection = 'north';
    if (avatarHex) {
      const locHexCoord: HexCoord = {
        col: locProps.hexCol as number,
        row: locProps.hexRow as number,
      };
      const distance = hexDistance(avatarHex, locHexCoord);
      // Simple angle: assume hex grid, compute angle based on col/row delta
      const colDelta = locHexCoord.col - avatarHex.col;
      const rowDelta = locHexCoord.row - avatarHex.row;
      // Convert offset to angle (approximate for hex grid)
      const angle = Math.atan2(rowDelta * 0.866, colDelta * 1.5) * (180 / Math.PI);
      direction = getCompassDirection(angle);
    } else {
      // Default: use location hex position
      const angle = ((locProps.hexCol as number) * 60 + (locProps.hexRow as number) * 30) % 360;
      direction = getCompassDirection(angle);
    }

    const directionWord = pick(COMPASS_WORDS[direction], baseSeed, 4 + i);
    const locName = loc.name;
    const locType = locProps.locationType as string || 'location';
    const displayType = SUBTYPE_DISPLAY_NAMES[locType as any] || locType;

    // Get a dominant sphere for this location
    const sphereBiases = locProps.sphereBiases as Record<string, number> | undefined;
    let dominantSphere: SphereName = 'force';
    if (sphereBiases) {
      let maxBias = -1;
      for (const s of SPHERE_NAMES) {
        const bias = sphereBiases[s] ?? 0;
        if (bias > maxBias) {
          maxBias = bias;
          dominantSphere = s;
        }
      }
    }

    // Fill template with location data
    const template = pick(LOCATION_TEMPLATES, baseSeed, 5 + i);
    const spotlight = template
      .replace(/{direction}/g, directionWord)
      .replace(/{name}/g, locName)
      .replace(/{subtype}/g, displayType)
      .replace(/{sphere}/g, dominantSphere);

    tier2.push(spotlight);
  }

  // Cap tier2 at MAX_TIER2_SENTENCES
  tier2.splice(MAX_TIER2_SENTENCES);

  // ─── Stage 5: Cultural Color ────────────────────────────────────

  const tier3: string[] = [];
  const cultures = getHexCultures(graph, hexCoord.col, hexCoord.row);
  for (let i = 0; i < Math.min(cultures.length, 2); i++) {
    const culture = cultures[i];
    const template = pick(CULTURE_PHRASES, baseSeed, 10 + i);
    const cultureSentence = template
      .replace(/{cultureName}/g, culture.cultureName)
      .replace(/{foundationBias}/g, culture.foundationBias);
    tier3.push(cultureSentence);
  }

  // ─── Stage 6: Sphere Aura ───────────────────────────────────────

  const sphereInfluence = getHexSphereInfluence(graph, hexCoord.col, hexCoord.row);
  for (const s of SPHERE_NAMES) {
    const influence = sphereInfluence[s] ?? 0;
    if (influence >= SPHERE_AURA_THRESHOLD) {
      const auraPhrase = pick(SPHERE_AURA_PHRASES[s], baseSeed, 20 + SPHERE_NAMES.indexOf(s));
      tier3.push(auraPhrase);
    }
  }

  // ─── Stage 7: Strategic Layer ───────────────────────────────────

  // Factions
  const factions = getHexFactions(graph, hexCoord.col, hexCoord.row);
  for (let i = 0; i < Math.min(factions.length, 1); i++) {
    const faction = factions[i];
    const template = pick(FACTION_PHRASES, baseSeed, 30 + i);
    const factionSentence = template.replace(/{factionName}/g, faction.factionName);
    tier3.push(factionSentence);
  }

  // Encounters (check for active encounters at any location)
  for (const loc of locations) {
    const activeEncs = (loc.properties as Record<string, unknown>).activeEncounters as any[] | undefined;
    if (activeEncs && activeEncs.length > 0) {
      const enc = activeEncs[0]; // First active encounter
      const template = pick(ENCOUNTER_PHRASES, baseSeed, 40);
      const encType = enc.encounterType ?? 'challenge';
      const encSentence = template
        .replace(/{encounterType}/g, encType)
        .replace(/{locationName}/g, loc.name);
      tier3.push(encSentence);
      break; // Only one encounter phrase per hex
    }
  }

  // Cap tier3 at MAX_TIER3_SENTENCES
  tier3.splice(MAX_TIER3_SENTENCES);

  // ─── Apply Visibility Wrappers ──────────────────────────────────

  const wrappers = VISIBILITY_WRAPPERS[visibility];
  const wrappedTier1 = wrappers.wrapTier1(tier1);
  const wrappedTier2 = tier2.map(s => wrappers.wrapTier2(s));
  const wrappedTier3 = tier3.map(s => wrappers.wrapTier3(s));

  return {
    tier1: wrappedTier1,
    tier2: wrappedTier2,
    tier3: wrappedTier3,
    clickTarget: hexCoord,
  };
}
