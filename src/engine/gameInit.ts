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
import type { AscendantIdentity } from '../types/remembrance';
import { deriveCosmologyFromIdentity, deriveMapSize } from './remembrance';
import { generateWorld } from './hexGrid';
import type { RiverPath } from './worldGenData';
import type { RegionData } from './regionTypes';
import { createAscendant } from './ascendant';
import { seedWorld } from './worldSeed';
import { generateRivals, createRivalState } from './rival';
import { generateDoomClock, createDoomClockState } from './doomClock';
import { createGreatChronicle } from './chronicle';
import { createDefaultFundament, createResonanceState } from './worldSoul';
import { createStartingEssencePool } from './influence';
import { DEFAULT_DOOM_TICKS } from '../types/gameState';
import { recalcVisibility, collectLOSSources } from './visibility';
import { generateMandate } from './mandateGenerator';
import { createMandateState } from './mandate';
import { ACTION_TEMPLATES } from '../data/action-template-content';
import {
  seedHexSphereAffinity,
  seedAgentSphereAffinity,
  seedLocationSphereAffinity,
} from './sphereAffinity';
import { createDefaultSphereAffinity } from '../types/sphereAffinity';
import { seedMonsterLairs } from './lairSeeding';
import { generateCultureIdentities, toCultureForWorldgen } from './cultureGenerator';
import { mulberry32 } from '../lib/prng';
import { seedAllRarityTiers } from './raritySeeding';
import { assignInitialAmbitions } from './ambitionAssignment';
import { AMBITION_TEMPLATES } from '../data/ambition-templates';
import type { AmbitionAgentSnapshot } from './ambitionSelection';

/** PRNG offset for pre-worldgen culture identity generation. Unique prime — no collision with worldgen passes. */
const CULTURE_SEED_OFFSET = 87671;

/** PRNG offset for rarity tier seeding. Unique prime — no collision with other seeding passes. */
const RARITY_SEED_OFFSET = 113513;

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
  // 1. Generate culture identities BEFORE worldgen (needed for province seeding)
  const cultureRng = mulberry32(seed + CULTURE_SEED_OFFSET);
  const fundament = createDefaultFundament();
  const pregenCultures = generateCultureIdentities(cosmology, cultureRng, fundament, cols * rows);
  const livingCultures = pregenCultures.map(toCultureForWorldgen);
  const cultureNameMap = new Map(pregenCultures.map(c => [c.id, c.name]));
  const cultureFoundationMap = new Map(pregenCultures.map(c => [c.id, c.identity.foundationBias]));

  // 2. Generate terrain WITH culture data — provinces seeded per culture
  const worldGenResult = generateWorld(cosmology, cols, rows, seed, livingCultures, undefined, cultureNameMap, cultureFoundationMap);
  const tiles = worldGenResult.tiles;

  // 3. Seed the world graph with actors, locations, artifacts — territory-aware
  const { graph, individualIds } = seedWorld(
    cosmology, tiles, seed, undefined, fundament,
    pregenCultures, worldGenResult.provinceIds, worldGenResult.provinces,
    worldGenResult.provinceRoles,
  );

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

  // ── Seed monster lairs based on danger gradient ─────────────────────────────
  // Placed after sphere affinity seeding so lairSeeding can read affinity if needed.
  // Placed before loc.start so lairs don't conflict with the starting shrine.
  seedMonsterLairs(graph, worldGenResult.provinceRoles, tiles, seed, cols);

  // ── Seed rarity tiers on all actor/location nodes ──────────────────
  {
    const rarityRng = mulberry32(seed + RARITY_SEED_OFFSET);
    seedAllRarityTiers(graph, rarityRng);
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

  // No initial threads — the ascendant starts alone with no retinue.
  // Threads are established through gameplay (Meet The First, divine actions, etc.)

  // Initialize empty familiarity map — populated as threads are formed
  const familiarityMap = new Map<string, number>();

  // Generate rival gods
  const rivalDefs = generateRivals(cosmology, seed);
  const rivalStates = rivalDefs.map(r => createRivalState(r.id));

  // Generate doom clock
  const doomDef = generateDoomClock('breach', DEFAULT_DOOM_TICKS, seed);
  const doomState = createDoomClockState('breach', DEFAULT_DOOM_TICKS);

  // Initialize starting essence pool (50 per sphere)
  const startingPool = createStartingEssencePool();

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
    ascendantIdentity: null,  // set by initializeGameStateFromIdentity for remembrance path
    essencePool: startingPool,
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
    pendingEncounterSeeds: [],
    hiddenMarks: [],
    intelligenceRecords: [],
    meetTheFirstAutoTriggered: false,
    worldSoul: {
      fundament,
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

/**
 * Initialize a fresh GameState from a fully-resolved AscendantIdentity.
 *
 * This is the identity-based init path used after the Remembrance character creation
 * flow. It derives cosmology and map size from the identity, then builds a compatible
 * AscendantArchetype to hand off to the existing `initializeGameState` pipeline.
 *
 * @param identity - The resolved AscendantIdentity from the Remembrance flow
 * @param seed - PRNG seed for deterministic world generation
 * @param cosmologyOverride - Optional cosmology override (skips derivation from identity)
 * @param mapSizeOverride - Optional map size override (skips hunger-based derivation)
 * @returns The same shape as `initializeGameState`
 */
export function initializeGameStateFromIdentity(
  identity: AscendantIdentity,
  seed: number,
  cosmologyOverride?: CosmologyProfile,
  mapSizeOverride?: MapSizePreset,
): ReturnType<typeof initializeGameState> {
  const cosmology = cosmologyOverride ?? deriveCosmologyFromIdentity({
    sphereAlignment: identity.sphereAlignment,
    mortalTags: identity.mortalTags,
    hungerId: identity.hungerId,
  });

  const mapSize = mapSizeOverride ?? deriveMapSize(identity.hungerId);
  const { cols, rows } = MAP_SIZE_PRESETS[mapSize];

  // Build a compatible archetype from the identity for the existing init path
  const compatArchetype: AscendantArchetype = {
    id: identity.hungerId,
    name: identity.divineName,
    title: identity.divineName,
    description: `${identity.hungerName} — ${identity.mandateDirection}`,
    sphereAlignment: identity.sphereAlignment,
    startingDomainAffinities: identity.domainAffinities,
    personalitySeed: identity.personalitySeed,
    flavorText: identity.mandateDirection,
  };

  const result = initializeGameState(
    compatArchetype,
    identity.mortalName,
    cosmology,
    seed,
    cols,
    rows,
  );

  // Stamp the full identity onto game state so remembrance-only fields
  // (timeSinceAscension, courtType, mortalTags, ascendantLens) are
  // available to downstream systems like Meet The First.
  result.state.ascendantIdentity = identity;

  return result;
}

// ─── Dev Pre-Seeding ─────────────────────────────────────────────

/**
 * Pre-seed "The First" agent into a GameState for dev/testing.
 *
 * Creates a synthetic bonded agent with a thread edge at courtPosition
 * 'the_first', placed at the avatar's current location. Sets
 * meetTheFirstAutoTriggered = true so the auto-trigger doesn't fire.
 *
 * Only call from dev quick-start paths — never from production flows.
 */
export function devSeedTheFirst(state: GameState): string {
  const { graph, ascendantId, tick } = state;

  // Find avatar node via avatar_of edge
  const avatarEdges = graph.getIncomingEdges(ascendantId, 'avatar_of');
  const avatarId = avatarEdges[0]?.source;
  // Find avatar's location
  const avatarLocEdge = avatarId
    ? graph.getOutgoingEdges(avatarId, 'located_at')[0]
    : undefined;
  const locationId = avatarLocEdge?.target ?? 'loc.start';

  const agentId = 'ind_dev_the_first';

  graph.addNode({
    id: agentId,
    type: 'actor',
    name: 'Kael Thornweaver',
    properties: {
      actorType: 'individual',
      axiologicalProfile: {
        mercy_ruthlessness: 0.6,
        asceticism_extravagance: 0.4,
        honesty_cunning: 0.55,
        tradition_novelty: 0.45,
        loyalty_ambition: 0.7,
      },
      domainCapabilities: {
        heart: 65,
        shadow: 45,
        iron: 30,
        gold: 20,
        veil: 35,
        eye: 25,
        stone: 15,
        star: 40,
      },
      locationId,
      narrativeArchetype: 'true_believer',
      cooperationStrategy: 'reciprocal',
      reputationScore: 0.5,
      primaryReach: 'heart',
      secondaryReach: 'shadow',
      sphere: 'spirit',
      createdByMeeting: true,
      appearanceSeed: 77701,
    },
  });

  // located_at edge
  graph.addEdge({
    id: `${agentId}_located_at_${locationId}`,
    source: agentId,
    target: locationId,
    type: 'located_at',
    properties: {},
  });

  // thread edge (ascendant → first agent)
  graph.addEdge({
    id: `edge_thread_${ascendantId}_${agentId}`,
    source: ascendantId,
    target: agentId,
    type: 'thread',
    properties: {
      courtPosition: 'the_first',
      tier: 1,
      ticksAtCurrentTier: 0,
      establishedTick: tick,
      totalEssenceSpent: 0,
      maintenanceCurrent: true,
      awareness: 'faith',
      readBackstoryTier: 0,
      attentionMode: 'pause',
      storyPhase: 'call',
      meetingChoiceRecord: null,
      beatHistory: [],
    },
  });

  state.meetTheFirstAutoTriggered = true;
  // Add familiarity for the new agent — intimate level so attachments/backstory are visible
  state.familiarityMap.set(agentId, 0.7);

  // Assign ambitions (same pattern as worldSeed.ts)
  const snapshot: AmbitionAgentSnapshot = {
    domainCapabilities: {
      heart: 65, shadow: 45, iron: 30, gold: 20, veil: 35,
      eye: 25, stone: 15, star: 40,
    },
    traits: [],
    culturalSpheres: [],
    bonds: [],
  };
  const assignments = assignInitialAmbitions(AMBITION_TEMPLATES, snapshot, 42 + 29173);
  for (const assignment of assignments) {
    const ambitionNodeId = `ambition.${assignment.templateId}`;
    if (!graph.getNode(ambitionNodeId)) {
      const tmpl = AMBITION_TEMPLATES.find(t => t.id === assignment.templateId);
      graph.addNode({
        id: ambitionNodeId,
        type: 'ambition',
        name: tmpl?.displayName ?? assignment.templateId,
        properties: {
          templateId: assignment.templateId,
          displayName: tmpl?.displayName ?? assignment.templateId,
          category: tmpl?.category ?? 'survival',
          reachAffinity: tmpl?.reachAffinity ?? {},
          totalMilestones: tmpl?.milestones.length ?? 0,
        },
      });
    }
    graph.addEdge({
      id: `pursues_${agentId}_${ambitionNodeId}`,
      source: agentId,
      target: ambitionNodeId,
      type: 'pursues',
      properties: {
        priority: assignment.priority,
        status: 'active',
        assignedTick: 0,
        completedMilestones: [],
      },
    });
  }

  // ── Seed possessions ────────────────────────────────────────────
  const possessions = [
    {
      node: {
        id: 'first_hollowfang', type: 'artifact' as const, name: 'Hollowfang',
        properties: {
          subcategory: 'arms', tier: 3,
          tags: ['#iron', '#weapon', '#melee', '#cursed'],
          mechanicalSummary: '+0.12 Iron, -0.05 Heart, rage burst when damaged, grants dark_ferocity',
          lossCondition: 'permanent',
          flavorText: 'The blade is hollow and whistles when swung. The sound makes children weep.',
          effects: [
            { type: 'passive', reach: 'iron', value: 0.12 },
            { type: 'passive', reach: 'heart', value: -0.05 },
          ],
        },
      },
      modifiers: { iron: 0.12, heart: -0.05 },
      grants: ['dark_ferocity'],
    },
    {
      node: {
        id: 'first_mantle_unremembered', type: 'artifact' as const, name: 'Mantle of the Unremembered',
        properties: {
          subcategory: 'vestments', tier: 3,
          tags: ['#shadow', '#vestment', '#cursed'],
          mechanicalSummary: '+0.12 Shadow, -0.06 Heart, shadow burst on hex entry',
          lossCondition: 'permanent',
          flavorText: 'Those who wear it become harder to recall. Even by those who love them.',
          effects: [
            { type: 'passive', reach: 'shadow', value: 0.12 },
            { type: 'passive', reach: 'heart', value: -0.06 },
          ],
        },
      },
      modifiers: { shadow: 0.12, heart: -0.06 },
      grants: [],
    },
    {
      node: {
        id: 'first_heart_barrow', type: 'artifact' as const, name: 'Heart of the Barrow',
        properties: {
          subcategory: 'relics_talismans', tier: 3,
          tags: ['#stone', '#relic', '#aura'],
          mechanicalSummary: '+0.12 Stone, -0.04 Shadow, aura boosts allies',
          lossCondition: 'permanent',
          flavorText: 'A stone pulled from a king\'s grave. It pulses like a heartbeat when pressed to earth.',
          effects: [
            { type: 'passive', reach: 'stone', value: 0.12 },
            { type: 'passive', reach: 'shadow', value: -0.04 },
          ],
        },
      },
      modifiers: { stone: 0.12, shadow: -0.04 },
      grants: [],
    },
    {
      node: {
        id: 'first_smoke_tooth', type: 'artifact' as const, name: 'Smoke-Tooth',
        properties: {
          subcategory: 'mounts_beasts', tier: 3,
          tags: ['#shadow', '#mount', '#beast', '#aura'],
          mechanicalSummary: '+0.07 Shadow, +0.03 Iron, 15% move reduction, shroud aura',
          lossCondition: 'permanent',
          flavorText: 'A wolf the size of a yearling calf, black as wet charcoal. Smoke leaks from between its teeth.',
          effects: [
            { type: 'passive', reach: 'shadow', value: 0.07 },
            { type: 'passive', reach: 'iron', value: 0.03 },
          ],
        },
      },
      modifiers: { shadow: 0.07, iron: 0.03 },
      grants: [],
    },
  ];

  for (const p of possessions) {
    graph.addNode(p.node);
    graph.addEdge({
      id: `seed.${agentId}.possesses.${p.node.id}`,
      source: agentId, target: p.node.id, type: 'possesses',
      properties: { modifiers: p.modifiers, grants: p.grants, tags: p.node.properties.tags },
    });
  }

  // ── Seed bestowed powers ────────────────────────────────────────
  const bestowedPowers = [
    {
      id: 'first_stormcaller', name: 'Stormcaller',
      properties: {
        subcategory: 'bestowed', tier: 3,
        tags: ['#star', '#stone', '#bestowed'],
        description: 'Thunder follows your anger. Rain follows your grief.',
        maxLevel: 1, visibility: 'public', importance: 0.8,
        flavorText: 'Thunder follows your anger. Rain follows your grief.',
        mechanicalSummary: '+0.10 Star, +0.05 Stone, enemy aura debuff',
        effects: [
          { type: 'passive', reach: 'star', value: 0.10 },
          { type: 'passive', reach: 'stone', value: 0.05 },
        ],
      },
    },
    {
      id: 'first_veilwalk', name: 'Veilwalk',
      properties: {
        subcategory: 'bestowed', tier: 3,
        tags: ['#veil', '#shadow', '#bestowed'],
        description: 'The wall is there, and then it is not.',
        maxLevel: 1, visibility: 'public', importance: 0.8,
        flavorText: 'The wall is there, and then it is not.',
        mechanicalSummary: '+0.10 Veil, +0.05 Shadow, phase-walking movement',
        effects: [
          { type: 'passive', reach: 'veil', value: 0.10 },
          { type: 'passive', reach: 'shadow', value: 0.05 },
        ],
      },
    },
  ];

  for (const power of bestowedPowers) {
    graph.addNode({ id: power.id, type: 'trait', name: power.name, properties: power.properties });
    graph.addEdge({
      id: `seed.${agentId}.has_trait.${power.id}`,
      source: agentId, target: power.id, type: 'has_trait',
      properties: { level: 1, acquiredTick: 0, source: 'Divine gift' },
    });
  }

  return agentId;
}

/** Pre-baked AscendantIdentity for dev quick-start (seed 42, hunger.witness). */
export const DEV_ASCENDANT_IDENTITY: AscendantIdentity = {
  mortalName: 'The Dev Oracle',
  originFragmentId: 'origin.dev',
  driveFragmentId: 'drive.dev',
  timeSinceAscension: 'ancient',
  mortalTags: ['scholar', 'seeker', 'loss', 'mind'],
  divineName: 'The Dev Oracle',
  hungerId: 'hunger.witness',
  hungerName: 'Witness',
  mandateDirection: 'Establish an information network that sees across the world',
  courtType: 'web',
  sphereAlignment: { primary: 'mind', secondary: 'spirit' },
  domainAffinities: { eye: 4, veil: 3, shadow: 2 },
  personalitySeed: {
    mercy_ruthlessness: 0.5,
    asceticism_extravagance: 0.5,
    honesty_cunning: 0.5,
    tradition_novelty: 0.5,
    loyalty_ambition: 0.5,
  },
  ascendantLens: {
    perceptionStyle: 'You see the hidden — every glance averted, every word unsaid, every secret kept.',
    emotionalTone: 'Detached curiosity sharpened by an insatiable need to know.',
  },
};
