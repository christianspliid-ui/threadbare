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

// ─── Constants ────────────────────────────────────────────────────

export const DEFAULT_COLS = 20;
export const DEFAULT_ROWS = 15;
export const DEFAULT_TICKS_PER_SEASON = 90;

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
 * @param cols - Hex grid width (default: DEFAULT_COLS = 20)
 * @param rows - Hex grid height (default: DEFAULT_ROWS = 15)
 * @returns { state, tiles } - Initialized GameState and hex tiles
 */
export function initializeGameState(
  archetype: AscendantArchetype,
  avatarName: string,
  cosmology: CosmologyProfile,
  seed: number,
  cols: number = DEFAULT_COLS,
  rows: number = DEFAULT_ROWS,
): { state: GameState; tiles: HexTile[] } {
  // Generate terrain
  const tiles = generateWorld(cosmology, cols, rows, seed);

  // Seed the world graph with actors, locations, artifacts
  const { graph } = seedWorld(cosmology, tiles, seed);

  // Ensure starting location exists
  if (!graph.getNode('loc.start')) {
    graph.addNode({
      id: 'loc.start',
      type: 'location',
      name: 'Sacred Grove',
      properties: { locationType: 'location' },
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
    worldSoul: {
      fundament: createDefaultFundament(),
      resonance: createResonanceState(),
    },
    echoDefinitions: [],
    echoStates: [],
    chronicle: createGreatChronicle(),
  };

  return { state, tiles };
}
