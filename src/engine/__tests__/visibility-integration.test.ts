import { describe, it, expect } from 'vitest';
import { seedWorld } from '../worldSeed';
import { runTick } from '../orchestrator';
import { recalcVisibility, collectLOSSources } from '../visibility';
import { visKey } from '../../types/visibility';
import type { GameState } from '../../types/gameState';
import type { CosmologyProfile } from '../../types/index';
import { SPHERE_NAMES } from '../../types/index';
import { createAscendant } from '../ascendant';
import { generateRivals, createRivalState } from '../rival';
import { generateDoomClock, createDoomClockState } from '../doomClock';
import { createGreatChronicle } from '../chronicle';
import { createDefaultFundament, createResonanceState } from '../worldSoul';

function balancedCosmology(): CosmologyProfile {
  const c = {} as CosmologyProfile;
  for (const s of SPHERE_NAMES) c[s] = 0.125;
  return c;
}

function emptyEssencePool() {
  const pool: Record<string, number> = {};
  for (const s of SPHERE_NAMES) pool[s] = 0;
  return pool as Record<typeof SPHERE_NAMES[number], number>;
}

function mockTiles(cols: number, rows: number) {
  const tiles = [];
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      tiles.push({
        coord: { col, row },
        geoParams: { elevation: 0.5, temperature: 0.5, moisture: 0.5 },
        terrain: 'grassland' as const,
      });
    }
  }
  return tiles;
}

function createTestGameState(cols: number, rows: number): GameState {
  const cosmology = balancedCosmology();
  const tiles = mockTiles(cols, rows);
  const seed = 42;

  const { graph } = seedWorld(cosmology, tiles, seed);

  // Add ascendant
  graph.addNode({
    id: 'loc.start',
    type: 'location',
    name: 'Sacred Grove',
    properties: {
      locationType: 'location',
      hexCol: 2,
      hexRow: 2,
    },
  });

  const { ascendantId } = createAscendant(graph, {
    archetype: {
      id: 'arch_test',
      name: 'The Watcher Divine',
      title: 'The Watcher',
      description: 'Test archetype',
      sphereAlignment: { primary: 'mind', secondary: 'spirit' },
      startingDomainAffinities: { iron: 2, gold: 1 },
      personalitySeed: {
        ambition_contentment: 0.1,
        courage_prudence: 0.2,
        cruelty_compassion: -0.3,
        cunning_honesty: 0.0,
        devotion_independence: 0.4,
        loyalty_treachery: 0.5,
        tradition_innovation: 0.1,
        dominance_humility: -0.2,
        wrath_patience: 0.0,
        greed_generosity: 0.3,
      },
      flavorText: 'A test archetype for the watcher',
    },
    avatar: {
      name: 'TestAvatar',
      startLocationId: 'loc.start',
      formDescription: 'A test avatar',
    },
  });

  // Generate rivals
  const rivalDefs = generateRivals(cosmology, seed);
  const rivalStates = rivalDefs.map(r => createRivalState(r.id));

  // Generate doom clock
  const doomDef = generateDoomClock('breach', 360, seed);
  const doomState = createDoomClockState('breach', 360);

  // Initialize visibility map
  const losSources = collectLOSSources(graph, ascendantId, []);
  const visibilityMap = recalcVisibility(new Map(), losSources, graph, 0, cols, rows);

  return {
    cycle: 1,
    tick: 0,
    phase: 'playing',
    seed,
    graph,
    cosmology,
    tiles,
    clock: { currentTick: 0, ticksPerSeason: 90, season: 0, year: 0 },
    ascendantId,
    essencePool: emptyEssencePool(),
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: rivalDefs,
    rivalStates,
    doomDefinition: doomDef,
    doomClock: doomState,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0.0,
    encounterProgress: [],
    worldSoul: {
      fundament: createDefaultFundament(),
      resonance: createResonanceState(),
      currentCycle: 1,
    },
    echoDefinitions: [],
    echoStates: [],
    chronicle: createGreatChronicle(),
    visibilityMap,
  };
}

describe('visibility integration', () => {
  it('seedWorld initializes visibility map with avatar area visible', () => {
    const gs = createTestGameState(20, 15);
    expect(gs.visibilityMap).toBeDefined();
    expect(gs.visibilityMap.size).toBe(300); // 20×15

    // At least some hexes should be visible (near avatar)
    const visibleCount = Array.from(gs.visibilityMap.values()).filter(v => v.state === 'visible').length;
    expect(visibleCount).toBeGreaterThan(0);
    expect(visibleCount).toBeLessThan(300); // not everything visible
  });

  it('runTick recalculates visibility', () => {
    const gs1 = createTestGameState(20, 15);
    const gs2 = runTick(gs1);
    expect(gs2.visibilityMap).toBeDefined();
    expect(gs2.visibilityMap.size).toBe(300);

    // Should still have some visible hexes
    const visibleCount = Array.from(gs2.visibilityMap.values()).filter(v => v.state === 'visible').length;
    expect(visibleCount).toBeGreaterThan(0);
  });

  it('visibility state transitions from visible to remembered when avatar moves away', () => {
    const gs1 = createTestGameState(20, 15);
    const initialVisibleKey = visKey(2, 2);
    const initial = gs1.visibilityMap.get(initialVisibleKey);
    expect(initial?.state).toBe('visible'); // Avatar's own hex at 2,2

    // Manually move avatar location
    const avatarLoc = gs1.graph.getNode('loc.start')!;
    avatarLoc.properties.hexCol = 15;
    avatarLoc.properties.hexRow = 15;

    const gs2 = runTick(gs1);
    const afterMove = gs2.visibilityMap.get(initialVisibleKey);
    expect(afterMove?.state).toBe('remembered'); // Should transition to remembered
    expect(afterMove?.snapshot).toBeDefined(); // Should have snapshot
  });

  it('visibility map covers entire grid', () => {
    const cols = 10;
    const rows = 8;
    const gs = createTestGameState(cols, rows);
    expect(gs.visibilityMap.size).toBe(cols * rows);

    // Check all keys are present
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const key = visKey(col, row);
        expect(gs.visibilityMap.has(key)).toBe(true);
      }
    }
  });
});
