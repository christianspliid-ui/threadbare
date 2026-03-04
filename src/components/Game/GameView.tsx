import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { CosmologyProfile, HexTile } from '../../types';
import type { AscendantArchetype } from '../../types/influence';
import type { GameState } from '../../types/gameState';
import { WorldGraph } from '../../engine/graph';
import { generateWorld } from '../../engine/hexGrid';
import { createAscendant } from '../../engine/ascendant';
import { seedWorld } from '../../engine/worldSeed';
import { generateRivals, createRivalState } from '../../engine/rival';
import { generateDoomClock, createDoomClockState } from '../../engine/doomClock';
import { createGreatChronicle } from '../../engine/chronicle';
import { createDefaultFundament, createResonanceState } from '../../engine/worldSoul';
import { runTick, resetEventCounter } from '../../engine/orchestrator';
import {
  startTwilight,
  runTwilightTick,
  computeHarvest,
  transitionToNewCycle,
} from '../../engine/cycleEnd';
import type { HarvestResult } from '../../engine/cycleEnd';
import { computeMaxEssence } from '../../engine/influence';
import { SPHERE_NAMES } from '../../types';

import { HexMap } from '../HexMap/HexMap';
import { EssencePanel } from './EssencePanel';
import { SimulationControls } from './SimulationControls';
import { DoomBar } from './DoomBar';
import { NarrativeFeed } from './NarrativeFeed';
import { RivalPanel } from './RivalPanel';
import { HarvestScreen } from './HarvestScreen';

interface GameViewProps {
  archetype: AscendantArchetype;
  avatarName: string;
  cosmology: CosmologyProfile;
  seed: number;
}

const COLS = 20;
const ROWS = 15;

/** Build the initial GameState from creation params */
function initializeGameState(
  archetype: AscendantArchetype,
  avatarName: string,
  cosmology: CosmologyProfile,
  seed: number,
): { state: GameState; tiles: HexTile[] } {
  const tiles = generateWorld(cosmology, COLS, ROWS, seed);
  const { graph } = seedWorld(cosmology, tiles, seed);

  // Add starting location if not already present
  if (!graph.getNode('loc.start')) {
    graph.addNode({
      id: 'loc.start',
      type: 'location',
      name: 'Sacred Grove',
      properties: { locationType: 'location' },
    });
  }

  const { ascendantId } = createAscendant(graph, {
    archetype,
    avatar: {
      name: avatarName,
      startLocationId: 'loc.start',
      formDescription: `The mortal vessel of ${archetype.title}`,
    },
  });

  const rivalDefs = generateRivals(cosmology, seed);
  const rivalStates = rivalDefs.map(r => createRivalState(r.id));
  const doomDef = generateDoomClock('breach', 360, seed);
  const doomState = createDoomClockState('breach', 360);

  const emptyPool = {} as Record<string, number>;
  for (const s of SPHERE_NAMES) emptyPool[s] = 0;

  const state: GameState = {
    cycle: 1,
    tick: 0,
    phase: 'playing',
    seed,
    graph,
    cosmology,
    tiles,
    clock: { currentTick: 0, ticksPerSeason: 90, season: 0, year: 0 },
    ascendantId,
    essencePool: emptyPool as any,
    mandateDefinition: null,
    mandateState: null,
    rivalDefinitions: rivalDefs,
    rivalStates,
    doomDefinition: doomDef,
    doomClock: doomState,
    tickEvents: [],
    recentEvents: [],
    chronicleEntries: [],
    stealthExposure: 0,
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

const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export function GameView({ archetype, avatarName, cosmology, seed }: GameViewProps) {
  // ── Initialize ──
  const initial = useMemo(
    () => initializeGameState(archetype, avatarName, cosmology, seed),
    [archetype, avatarName, cosmology, seed]
  );

  const [gameState, setGameState] = useState<GameState>(initial.state);
  const [tiles] = useState<HexTile[]>(initial.tiles);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [harvestResult, setHarvestResult] = useState<HarvestResult | null>(null);
  const [hoveredHex, setHoveredHex] = useState<{ col: number; row: number } | null>(null);
  const [selectedHex, setSelectedHex] = useState<{ col: number; row: number } | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Tick ──
  const doTick = useCallback(() => {
    setGameState(prev => {
      if (prev.phase === 'playing') {
        return runTick(prev);
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

  // Derived display values
  const seasonName = SEASONS[gameState.clock.season % 4] ?? 'spring';
  const year = Math.floor(gameState.tick / 120) + 1;
  const maxEssence = computeMaxEssence(gameState.graph, gameState.ascendantId);

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col">
      {/* Doom bar at top */}
      <DoomBar definition={gameState.doomDefinition} state={gameState.doomClock} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-80 flex-shrink-0 p-4 space-y-4 overflow-y-auto border-r border-amber-900/30 bg-stone-800/90">
          {/* Ascendant info */}
          <div className="text-center py-2">
            <h1
              className="text-lg font-bold text-amber-100 tracking-wide"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              {archetype.title}
            </h1>
            <p className="text-xs text-amber-400/50 mt-0.5">
              Avatar: {avatarName} · Cycle {gameState.cycle}
            </p>
          </div>

          <SimulationControls
            tick={gameState.tick}
            season={seasonName}
            year={year}
            running={running}
            speed={speed}
            onToggle={() => setRunning(r => !r)}
            onStep={doTick}
            onSpeedChange={setSpeed}
          />

          <EssencePanel
            pool={gameState.essencePool}
            maxEssence={maxEssence}
            primarySphere={archetype.sphereAlignment.primary}
            secondarySphere={archetype.sphereAlignment.secondary}
          />

          <RivalPanel
            definitions={gameState.rivalDefinitions}
            states={gameState.rivalStates}
          />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Hex map */}
          <div className="flex-1 p-4 flex items-center justify-center overflow-hidden">
            <HexMap
              tiles={tiles}
              cols={COLS}
              rows={ROWS}
              hoveredHex={hoveredHex}
              selectedHex={selectedHex}
              overlayMode="none"
              onHexClick={setSelectedHex}
              onHexHover={setHoveredHex}
            />
          </div>

          {/* Narrative feed at bottom */}
          <div className="border-t border-amber-900/30 bg-stone-800/80 p-3">
            <NarrativeFeed events={gameState.recentEvents} />
          </div>
        </div>
      </div>

      {/* Harvest overlay */}
      {harvestResult && (
        <HarvestScreen
          harvest={harvestResult}
          cycle={gameState.cycle}
          onBeginNextCycle={handleBeginNextCycle}
        />
      )}
    </div>
  );
}
