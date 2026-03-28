// src/engine/gameInit.ts

/**
 * Game Initialization — building a fresh GameState for a new playthrough.
 *
 * This module extracts game initialization from the React component layer,
 * making it callable from headless scripts (e.g., playtest runners).
 */

import type { CosmologyProfile, HexTile } from '../types';
import type { AscendantArchetype } from '../types/influence';
import type { GameState } from '../types/gameState';
import { generateWorld } from './hexGrid';
import type { RiverPath } from './worldGenData';
import type { RegionData } from './regionTypes';
import { createAscendant } from './ascendant';
import { seedWorld } from './worldSeed';
import { generateRivals, createRivalState } from './rival';
import { generateDoomClock, createDoomClockState } from './doomClock';
import { createGreatChronicle } from './chronicle';
import { createDefaultFundament, createResonanceState } from './worldSoul';
import { createEmptyEssencePool } from './influence';
import { DEFAULT_DOOM_TICKS } from '../types/gameState';
import { recalcVisibility, collectLOSSources } from './visibility';
import { generateMandate } from './mandateGenerator';
import { createMandateState } from './mandate';
import { FAMILIARITY_GAINS } from '../types/familiarity';
import { ACTION_TEMPLATES } from '../data/action-template-content';
import {
  seedHexSphereAffinity,
  seedAgentSphereAffinity,
  seedLocationSphereAffinity,
} from './sphereAffinity';
import { createDefaultSphereAffinity } from '../types/sphereAffinity';

// ─── Map Size Presets (NFP #1: Tunability) ───────────────────────

export type MapSizePreset = 'small' | 'medium' | 'large' | 'epic';

export const MAP_SIZE_PRESETS: Record<MapSizePreset, { cols: number; rows: number; label: string; description: string }> = {
  small:  { cols: 20, rows: 15, label: 'Small',  description: 'A compact realm — fast games' },
  medium: { cols: 32, rows: 24, label: 'Medium', description: 'A balanced kingdom' },
  large:  { cols: 48, rows: 36, label: 'Large',  description: 'A sprawling empire' },
  epic:   { cols: 64, rows: 48, label: 'Epic',   description: 'A vast continent — long games' },
};

export const DEFAULT_MAP_SIZE: MapSizePreset = 'medium';

// ─── Constants ────────────────────────────────────────────────────

/** @deprecated Use MAP_SIZE_PRESETS[DEFAULT_MAP_SIZE] instead. Kept for backward compat. */
export const DEFAULT_COLS = MAP_SIZE_PRESETS[DEFAULT_MAP_SIZE].cols;
/** @deprecated Use MAP_SIZE_PRESETS[DEFAULT_MAP_SIZE] instead. Kept for backward compat. */
export const DEFAULT_ROWS = MAP_SIZE_PRESETS[DEFAULT_MAP_SIZE].rows;
export const DEFAULT_TICKS_PER_SEASON = 90;

/** How many seeded individuals start as initial worshippers of the ascendant. */
export const INITIAL_WORSHIPPER_COUNT = { min: 3, max: 5 };
/** Starting influence tier for initial worshippers. */
export const INITIAL_WORSHIPPER_TIER = 1;

// ─── Game Initialization ──────────────────────────────────────────

/**
 * Initialize a fresh GameState for a new playthrough.
 *
 * Creates:
 * - Procedural hex terrain tiles (using cosmology + seed)
 * - Seeded world graph with actors, locations, artifacts
 * - Ascendant (player god) and avatar
 * - Rival gods (2-4, derived from World-Soul)
 * - Doom clock (tracks world degradation toward Unmaking)
 * - Victory mandate (goal condition)
 * - Visibility map (fog of war for avatar perspective)
 * - World-Soul (fundament + resonance for metaprogression)
 *
 * @param archetype - The Ascendant archetype (sphere alignment, personality)
 * @param avatarName - Name for the Ascendant's mortal vessel
 * @param cosmology - Foundation + Creation sphere weights for world tone
 * @param seed - PRNG seed for deterministic world generation
 * @param cols - Hex grid width (default: DEFAULT_COLS = 32)
 * @param rows - Hex grid height (default: DEFAULT_ROWS = 24)
 * @returns { state, tiles, riverPaths, lakeIds, regionData } - Initialized GameState, hex tiles, and WorldGenResult fields
 */
export function initializeGameState(
  archetype: AscendantArchetype,
  avatarName: string,
  cosmology: CosmologyProfile,
  seed: number,
  cols: number = DEFAULT_COLS,
  rows: number = DEFAULT_ROWS,
): { state: GameState; tiles: HexTile[]; riverPaths: RiverPath[]; lakeIds: Int16Array; regionData?: RegionData } {
  // Generate terrain
  const worldGenResult = generateWorld(cosmology, cols, rows, seed);
  const tiles = worldGenResult.tiles;

  // Seed the world graph with actors, locations, artifacts
  const { graph, individualIds } = seedWorld(cosmology, tiles, seed);

  // Sync graph region names back to regionData.geographicRegions.
  // seedWorld() names regions with culture-aware names (via regionNaming.ts),
  // but regionData still has simple placeholder names from hexGrid.ts.
  if (worldGenResult.regionData) {
    for (const geo of worldGenResult.regionData.geographicRegions) {
      const regionNode = graph.getNode(`region_${geo.id}`);
      if (regionNode && regionNode.name) {
        geo.name = regionNode.name;
      }
    }
  }

  // Register action template nodes so createAction can add performing edges
  for (const template of ACTION_TEMPLATES) {
    if (!graph.getNode(template.id)) {
      graph.addNode({
        id: template.id,
        type: 'action_template',
        name: template.name,
        properties: { reach: template.reach },
      });
    }
  }

  // ── Seed sphere affinity on all hex nodes ─────────────────────────
  // Map from hex key → hex terrain for location seeding lookup
  const hexTerrainByKey = new Map<string, string>();
  const hexAffinityByKey = new Map<string, ReturnType<typeof seedHexSphereAffinity>>();
  for (const tile of tiles) {
    const hexKey = `${tile.coord.col},${tile.coord.row}`;
    const hexAffinity = seedHexSphereAffinity(tile.terrain);
    hexTerrainByKey.set(hexKey, tile.terrain);
    hexAffinityByKey.set(hexKey, hexAffinity);
    // Hex nodes in the graph are locations at those coords — seed via tile lookup
    // (Hex tiles are not graph nodes themselves; affinity is stored separately
    // and referenced during location seeding below)
    void hexTerrainByKey; // used below for location seeding
  }

  // ── Seed sphere affinity on all location nodes ─────────────────────
  {
    const locationNodes = graph.getNodesByType('location');
    for (const locNode of locationNodes) {
      const hexCol = locNode.properties.hexCol as number | undefined;
      const hexRow = locNode.properties.hexRow as number | undefined;
      let hexAffinity = createDefaultSphereAffinity();
      if (hexCol !== undefined && hexRow !== undefined) {
        const key = `${hexCol},${hexRow}`;
        hexAffinity = hexAffinityByKey.get(key) ?? createDefaultSphereAffinity();
      }
      const locSubtype = locNode.properties.locationType as string | undefined;
      const locAffinity = seedLocationSphereAffinity(hexAffinity, locSubtype);
      graph.updateNode(locNode.id, { properties: { sphereAffinity: locAffinity } });
    }
  }

  // ── Seed sphere affinity on all actor nodes ─────────────────────────
  {
    const actorNodes = graph.getNodesByType('actor');
    for (const actorNode of actorNodes) {
      const actorType = actorNode.properties.actorType as string | undefined;
      let affinity = createDefaultSphereAffinity();
      if (actorType === 'individual' || actorType === 'ascendant' || actorType === 'god') {
        // Use sphereAlignment if available, else default
        const sphereAlignment = actorNode.properties.sphereAlignment as Record<string, number> | undefined;
        affinity = seedAgentSphereAffinity(sphereAlignment);
      } else {
        // Factions, cultures, groups: start with defaults
        // (derived aggregation computed later by phaseSphereAggregation)
        affinity = createDefaultSphereAffinity();
      }
      graph.updateNode(actorNode.id, { properties: { sphereAffinity: affinity } });
    }
  }

  // Ensure starting location exists — pick a habitable tile near center
  if (!graph.getNode('loc.start')) {
    const centerCol = Math.floor(cols / 2);
    const centerRow = Math.floor(rows / 2);

    // Find closest habitable tile to center (non-ocean, non-coastal)
    const habitableTiles = tiles.filter(t =>
      t.terrain !== 'ocean' && t.terrain !== 'coastal_shallows'
    );
    const startTile = habitableTiles.length > 0
      ? habitableTiles.reduce((best, t) => {
          const d = Math.abs(t.coord.col - centerCol) + Math.abs(t.coord.row - centerRow);
          const bestD = Math.abs(best.coord.col - centerCol) + Math.abs(best.coord.row - centerRow);
          return d < bestD ? t : best;
        })
      : tiles[Math.floor(tiles.length / 2)]; // fallback to literal center tile

    graph.addNode({
      id: 'loc.start',
      type: 'location',
      name: 'Sacred Grove',
      properties: {
        locationType: 'shrine',
        locationSubtype: 'shrine',
        hexCol: startTile.coord.col,
        hexRow: startTile.coord.row,
        terrain: startTile.terrain,
      },
    });
  }

  // Create the Ascendant (player god) and avatar
  const { ascendantId } = createAscendant(graph, {
    archetype,
    avatar: {
      name: avatarName,
      startLocationId: 'loc.start',
      formDescription: `The mortal vessel of ${archetype.title}`,
    },
  });

  // ── Seed initial threads ─────────────────────────────────
  // Give the player a starting retinue so the action wheel is usable from tick 0.
  // Pick 3-5 random individuals and establish thread edges at tier 1.
  // Direction: ascendant → mortal (the god reaches down).
  {
    // Use a deterministic sub-PRNG so this doesn't change existing seeding
    let ws = (seed + 13337) | 0;
    const threadRng = () => {
      ws = (ws + 0x6d2b79f5) | 0;
      let t = Math.imul(ws ^ (ws >>> 15), 1 | ws);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const count = INITIAL_WORSHIPPER_COUNT.min +
      Math.floor(threadRng() * (INITIAL_WORSHIPPER_COUNT.max - INITIAL_WORSHIPPER_COUNT.min + 1));
    const candidates = [...individualIds];
    // Shuffle candidates deterministically
    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(threadRng() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const threadedAgents = candidates.slice(0, Math.min(count, candidates.length));
    for (const indId of threadedAgents) {
      graph.addEdge({
        id: `edge_thread_init_${indId}`,
        source: ascendantId,
        target: indId,
        type: 'thread',
        properties: { tier: INITIAL_WORSHIPPER_TIER, devotion: 50 },
      });
    }
  }

  // Initialize familiarity map and populate with initial thread familiarity
  const familiarityMap = new Map<string, number>();
  {
    const threadEdges = graph.getEdgesByType('thread');
    for (const edge of threadEdges) {
      const mortalId = edge.target;
      const tier = (edge.properties?.tier ?? 1) as number;
      // Map tier to familiarity gain: tier 1 = 0.3, tier 2 = 0.5, tier 3 = 0.7
      const initialFamiliarity = FAMILIARITY_GAINS[
        `worship_tier_${tier}` as keyof typeof FAMILIARITY_GAINS
      ] ?? FAMILIARITY_GAINS.worship_tier_1;
      familiarityMap.set(mortalId, initialFamiliarity);
    }
  }

  // Generate rival gods
  const rivalDefs = generateRivals(cosmology, seed);
  const rivalStates = rivalDefs.map(r => createRivalState(r.id));

  // Generate doom clock
  const doomDef = generateDoomClock('breach', DEFAULT_DOOM_TICKS, seed);
  const doomState = createDoomClockState('breach', DEFAULT_DOOM_TICKS);

  // Initialize empty essence pool
  const emptyPool = createEmptyEssencePool();

  // Generate victory mandate
  const mandateDef = generateMandate(cosmology, archetype.sphereAlignment, seed);
  const mandateStateInit = createMandateState(mandateDef.id, 0);

  // Initialize visibility map (fog of war)
  const losSources = collectLOSSources(graph, ascendantId, []);
  const visibilityMap = recalcVisibility(new Map(), losSources, graph, 0, cols, rows);

  // Assemble final GameState
  const state: GameState = {
    cycle: 1,
    tick: 0,
    phase: 'playing',
    seed,
    graph,
    cosmology,
    tiles,
    clock: { currentTick: 0, ticksPerSeason: DEFAULT_TICKS_PER_SEASON, season: 0, year: 0 },
    ascendantId,
    essencePool: emptyPool,
    mandateDefinition: mandateDef,
    mandateState: mandateStateInit,
    rivalDefinitions: rivalDefs,
    rivalStates,
    doomDefinition: doomDef,
    doomClock: doomState,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
    visibilityMap,
    familiarityMap,
    culturalInsightMap: new Map<string, number>(),
    agentKnowledge: new Map(),
    encounterProgress: [],
    actionsInProgress: [],
    unifiedActions: [],
    worldSoul: {
      fundament: createDefaultFundament(),
      resonance: createResonanceState(),
    },
    echoDefinitions: [],
    echoStates: [],
    chronicle: createGreatChronicle(),
  };

  return {
    state,
    tiles,
    riverPaths: worldGenResult.riverPaths,
    lakeIds: worldGenResult.lakeIds,
    regionData: worldGenResult.regionData,
  };
}
