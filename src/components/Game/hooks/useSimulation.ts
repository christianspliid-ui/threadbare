import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { HexTile } from '../../../types';
import type { AscendantArchetype } from '../../../types/influence';
import type { CosmologyProfile } from '../../../types';
import type { GameState } from '../../../types/gameState';
import type { RiverPath } from '../../../engine/worldGenData';
import type { RegionData } from '../../../engine/regionTypes';
import { initializeGameState, MAP_SIZE_PRESETS, DEFAULT_MAP_SIZE } from '../../../engine/gameInit';
import type { MapSizePreset } from '../../../engine/gameInit';
import { runTick, resetEventCounter } from '../../../engine/orchestrator';
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

interface UseSimulationParams {
  archetype: AscendantArchetype;
  avatarName: string;
  cosmology: CosmologyProfile;
  seed: number;
  scryState: ScryState;
  mapSize?: MapSizePreset;
}

const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export function useSimulation({
  archetype,
  avatarName,
  cosmology,
  seed,
  scryState,
  mapSize = DEFAULT_MAP_SIZE,
}: UseSimulationParams) {
  // ── Resolve map dimensions from preset ──
  const { cols: COLS, rows: ROWS } = MAP_SIZE_PRESETS[mapSize];

  // ── Initialize ──
  const initial = useMemo(
    () => initializeGameState(archetype, avatarName, cosmology, seed, COLS, ROWS),
    [archetype, avatarName, cosmology, seed, COLS, ROWS]
  );

  const [gameState, setGameState] = useState<GameState>(initial.state);
  const [tiles] = useState<HexTile[]>(initial.tiles);
  const [riverPaths] = useState<RiverPath[]>(initial.riverPaths);
  const [lakeIds] = useState<Int16Array>(initial.lakeIds);
  const [regionData] = useState<RegionData | undefined>(initial.regionData);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [harvestResult, setHarvestResult] = useState<HarvestResult | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scryStateRef = useRef(scryState);
  scryStateRef.current = scryState;

  // ── Tick ──
  const doTick = useCallback(() => {
    setGameState(prev => {
      if (prev.phase === 'playing') {
        const targets = getScryTargetHexes(scryStateRef.current, prev.graph);
        return runTick(prev, targets);
      }
      if (prev.phase === 'twilight') {
        const result = runTwilightTick(prev);
        if (result.complete) {
          // Compute harvest and pause for screen
          const harvest = computeHarvest(result.state);
          setTimeout(() => {
            setHarvestResult(harvest);
            setRunning(false);
          }, 0);
        }
        return result.state;
      }
      return prev;
    });
  }, []);

  // Watch for phase transition to twilight (doom expired)
  useEffect(() => {
    if (gameState.phase === 'twilight' && !harvestResult) {
      setGameState(prev => startTwilight(prev));
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
    setGameState(prev => {
      const nextState = transitionToNewCycle(prev, cosmicEchoes, [], harvestResult.chronicleSummary);
      return { ...nextState, phase: 'playing' };
    });
    setHarvestResult(null);
    resetEventCounter();
  }, [harvestResult]);

  // Toggle running
  const handleToggleRunning = useCallback(() => {
    setRunning(r => !r);
  }, []);

  // Derived display values
  const seasonName = SEASONS[gameState.clock.season % 4] ?? 'spring';
  const year = Math.floor(gameState.tick / 120) + 1;
  const maxEssence = computeMaxEssence(gameState.graph, gameState.ascendantId);

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
    handleBeginNextCycle,
    handleToggleRunning,
    setRunning,
    seasonName,
    year,
    maxEssence,
    COLS,
    ROWS,
  };
}
