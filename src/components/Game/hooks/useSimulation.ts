import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { HexTile } from '../../../types';
import type { AscendantArchetype } from '../../../types/influence';
import type { CosmologyProfile } from '../../../types';
import type { GameState } from '../../../types/gameState';
import type { RiverPath } from '../../../engine/worldGenData';
import type { RegionData } from '../../../engine/regionTypes';
import { initializeGameState, initializeGameStateFromIdentity, devSeedTheFirst, devSeedAscendantTestPackage, devPlaceAvatarAtSettlement, MAP_SIZE_PRESETS, DEFAULT_MAP_SIZE } from '../../../engine/gameInit';
import type { MapSizePreset } from '../../../engine/gameInit';
import type { AscendantIdentity } from '../../../types/remembrance';
import { runTick, resetEventCounter } from '../../../engine/orchestrator';
import { createSimulationRuntime, resetRuntimeCaches } from '../../../engine/simulationRuntime';
import type { SimulationRuntime } from '../../../engine/simulationRuntime';
import {
  startTwilight,
  runTwilightTick,
  computeHarvest,
  transitionToNewCycle,
} from '../../../engine/cycleEnd';
import type { HarvestResult } from '../../../engine/cycleEnd';
import { computeMaxEssence } from '../../../engine/influence';
import type { ScryState } from '../../../types/scry';
import { getScryTargetHexes } from '../../../engine/visibility';
import { runTickBatch } from '../../../engine/debugTickBatch';
import type { DebugTickBatchResult } from '../../../engine/debugTickBatch';

interface UseSimulationParams {
  archetype: AscendantArchetype;
  avatarName: string;
  cosmology: CosmologyProfile;
  seed: number;
  scryState: ScryState;
  mapSize?: MapSizePreset;
  ascendantIdentity?: AscendantIdentity;
  /**
   * Dev-only: bond The First (Kael Thornweaver) at init. Split out of the former
   * single `preSeeded` flag by THR-874 — pre-bonding The First makes
   * `isMeetTheFirstAvailable` false, so no dev URL could reach the Meet-The-First
   * beat while the two seeding actions shared one switch.
   */
  seedFirst?: boolean;
  /** Dev-only: inject the ascendant test package (actions, essence, test content). */
  seedTestPackage?: boolean;
  /**
   * Dev-only: move the avatar to a settled location so the Meet-The-First
   * auto-trigger can fire. The start shrine is not a settlement, so without this
   * the beat stays closed even with The First unbonded (THR-874).
   */
  placeAvatarForMeeting?: boolean;
}

const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export function useSimulation({
  archetype,
  avatarName,
  cosmology,
  seed,
  scryState,
  mapSize = DEFAULT_MAP_SIZE,
  ascendantIdentity,
  seedFirst,
  seedTestPackage,
  placeAvatarForMeeting,
}: UseSimulationParams) {
  // ── Resolve map dimensions from preset ──
  const { cols: COLS, rows: ROWS } = MAP_SIZE_PRESETS[mapSize];

  // ── Initialize ──
  const initial = useMemo(
    () => {
      const result = ascendantIdentity
        ? initializeGameStateFromIdentity(ascendantIdentity, seed, cosmology, mapSize)
        : initializeGameState(archetype, avatarName, cosmology, seed, COLS, ROWS);
      // Dev pre-seeding: the two actions are independently switchable (THR-874).
      // `?view=game&firstunmet` seeds the test package but leaves The First unbonded
      // so the Meet-The-First beat stays reachable.
      if (seedFirst) devSeedTheFirst(result.state);
      if (seedTestPackage) devSeedAscendantTestPackage(result.state);
      if (placeAvatarForMeeting) devPlaceAvatarAtSettlement(result.state);
      return result;
    },
    [archetype, avatarName, cosmology, seed, COLS, ROWS, ascendantIdentity, mapSize, seedFirst, seedTestPackage, placeAvatarForMeeting]
  );

  const [gameState, setGameState] = useState<GameState>(initial.state);
  const [tiles] = useState<HexTile[]>(initial.tiles);
  const [riverPaths] = useState<RiverPath[]>(initial.riverPaths);
  const [lakeIds] = useState<Int16Array>(initial.lakeIds);
  const [regionData] = useState<RegionData | undefined>(initial.regionData);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [harvestResult, setHarvestResult] = useState<HarvestResult | null>(null);

  // TB-087: Per-session runtime owns caches and version counters
  const runtimeRef = useRef<SimulationRuntime>(createSimulationRuntime());

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scryStateRef = useRef(scryState);
  scryStateRef.current = scryState;

  // Ref-based state to prevent React StrictMode double-invocation of runTick.
  // runTick has side effects (graph mutation, timeline appends, trace emits) that
  // are not idempotent — calling it twice per tick causes agents to move 2 hexes.
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // ── Tick ──
  const doTick = useCallback(() => {
    const prev = gameStateRef.current;
    if (prev.phase === 'playing') {
      const targets = getScryTargetHexes(scryStateRef.current, prev.graph);
      const next = runTick(prev, targets, runtimeRef.current);
      setGameState(next);
    } else if (prev.phase === 'twilight') {
      const result = runTwilightTick(prev);
      setGameState(result.state);
      if (result.complete) {
        const harvest = computeHarvest(result.state);
        setTimeout(() => {
          setHarvestResult(harvest);
          setRunning(false);
        }, 0);
      }
    }
  }, []);

  // ── Debug: synchronous tick batch (THR-689) ──
  // Calling doTick() n times in a row would NOT advance n ticks: doTick reads
  // gameStateRef.current, which React only refreshes on render, so every iteration
  // would tick from the same `prev` and the counter would move by 1. The batch keeps
  // its own cursor and commits once at the end.
  const runTicksSync = useCallback((n: number): Omit<DebugTickBatchResult, 'state'> => {
    // Auto-pause: leaving the interval armed would let it resume mid-inspection from
    // the state we just advanced, which is exactly the ambiguity the caller is avoiding.
    setRunning(false);
    const { state, ...result } = runTickBatch(
      gameStateRef.current,
      n,
      runtimeRef.current,
      s => getScryTargetHexes(scryStateRef.current, s.graph),
    );
    // Update the ref before setGameState so a subsequent call in the same task —
    // before React re-renders — starts from the advanced state, not the stale one.
    gameStateRef.current = state;
    setGameState(state);
    return result;
  }, []);

  // Watch for phase transition to twilight (doom expired)
  useEffect(() => {
    if (gameState.phase === 'twilight' && !harvestResult) {
      setGameState(startTwilight(gameStateRef.current));
    }
  }, [gameState.phase, harvestResult]);

  // ── Auto-play ──
  useEffect(() => {
    if (running && gameState.phase !== 'harvest' && gameState.phase !== 'transition') {
      const ms = Math.max(50, 1000 / speed);
      intervalRef.current = setInterval(doTick, ms);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, speed, doTick, gameState.phase]);

  // ── Handle new cycle ──
  const handleBeginNextCycle = useCallback(() => {
    if (!harvestResult) return;
    const cosmicEchoes = harvestResult.cosmicEchoCandidates.map(c => c.echoDefinition);
    const nextState = transitionToNewCycle(gameStateRef.current, cosmicEchoes, [], harvestResult.chronicleSummary);
    setGameState({ ...nextState, phase: 'playing' });
    setHarvestResult(null);
    resetEventCounter();
    // TB-087: Reset runtime caches for new cycle (versions persist)
    resetRuntimeCaches(runtimeRef.current);
  }, [harvestResult]);

  // Toggle running
  const handleToggleRunning = useCallback(() => {
    setRunning(r => !r);
  }, []);

  // Derived display values
  const seasonName = SEASONS[gameState.clock.season % 4] ?? 'spring';
  const year = Math.floor(gameState.tick / 120) + 1;
  const maxEssence = useMemo(
    () => computeMaxEssence(gameState.graph, gameState.ascendantId),
    // TB-086: Key off worldVersion, not graph identity (graph is mutated in place)
    [gameState.graph, gameState.ascendantId, runtimeRef.current.worldVersion],
  );

  return {
    gameState,
    setGameState,
    tiles,
    riverPaths,
    lakeIds,
    regionData,
    running,
    speed,
    setSpeed,
    harvestResult,
    doTick,
    /** THR-689: advance n ticks synchronously, bypassing the document.hidden-throttled interval. */
    runTicksSync,
    handleBeginNextCycle,
    handleToggleRunning,
    setRunning,
    seasonName,
    year,
    maxEssence,
    COLS,
    ROWS,
    /** TB-086: Per-session runtime with version counters for change detection */
    runtime: runtimeRef.current,
  };
}
