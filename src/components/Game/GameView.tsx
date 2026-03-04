import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { CosmologyProfile, HexCoord, HexTile } from '../../types';
import { SPHERE_NAMES } from '../../types';
import type { AscendantArchetype, AscendantProperties } from '../../types/influence';
import { WorldGraph } from '../../engine/graph';
import { Simulation } from '../../engine/simulation';
import { generateWorld } from '../../engine/hexGrid';
import { createAscendant } from '../../engine/ascendant';
import {
  computeEssenceGeneration,
  generateEssence,
  computeMaxEssence,
} from '../../engine/influence';
import { HexMap } from '../HexMap/HexMap';
import { EssencePanel } from './EssencePanel';
import { SimulationControls } from './SimulationControls';
import { EventLog, type LogEntry } from './EventLog';

interface GameViewProps {
  archetype: AscendantArchetype;
  avatarName: string;
  cosmology: CosmologyProfile;
  seed: number;
}

const COLS = 20;
const ROWS = 15;

export function GameView({ archetype, avatarName, cosmology, seed }: GameViewProps) {
  // ── Initialize world ──
  const { sim, ascendantId, tiles } = useMemo(() => {
    const graph = new WorldGraph();
    const sim = new Simulation(graph);

    // Generate hex world
    const tiles = generateWorld(cosmology, COLS, ROWS, seed);

    // Create a starting location node in the graph
    graph.addNode({
      id: 'loc.start',
      type: 'location',
      name: 'Sacred Grove',
      properties: { locationType: 'location' },
    });

    // Create the ascendant + avatar
    const { ascendantId } = createAscendant(graph, {
      archetype,
      avatar: {
        name: avatarName,
        startLocationId: 'loc.start',
        formDescription: `The mortal vessel of ${archetype.title}`,
      },
    });

    return { sim, ascendantId, tiles };
  }, [archetype, avatarName, cosmology, seed]);

  // ── State ──
  const [tick, setTick] = useState(0);
  const [season, setSeason] = useState('spring');
  const [year, setYear] = useState(1);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [essenceSnapshot, setEssenceSnapshot] = useState(() => {
    const node = sim.graph.getNode(ascendantId)!;
    return { ...(node.properties as AscendantProperties).essencePool };
  });
  const [maxEssence, setMaxEssence] = useState(() => computeMaxEssence(sim.graph, ascendantId));
  const [log, setLog] = useState<LogEntry[]>([
    { tick: 0, message: `${archetype.title} awakens. ${avatarName} takes first breath.`, type: 'narrative' },
  ]);
  const [hoveredHex, setHoveredHex] = useState<HexCoord | null>(null);
  const [selectedHex, setSelectedHex] = useState<HexCoord | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Simulation step ──
  const doTick = useCallback(() => {
    const tickResult = sim.runTick();
    const currentTick = sim.clock.getClock().currentTick;

    // Generate essence
    const ascNode = sim.graph.getNode(ascendantId)!;
    const pool = (ascNode.properties as AscendantProperties).essencePool;
    const max = computeMaxEssence(sim.graph, ascendantId);
    const gen = computeEssenceGeneration(sim.graph, ascendantId);
    generateEssence(pool, gen, max);

    // Persist pool back
    sim.graph.updateNode(ascendantId, {
      properties: { ...ascNode.properties, essencePool: pool },
    });

    // Update state
    setTick(currentTick);
    setSeason(sim.clock.getClock().currentSeason);
    setYear(Math.floor(currentTick / 120) + 1);
    setEssenceSnapshot({ ...pool });
    setMaxEssence(max);

    // Log events
    const newEntries: LogEntry[] = [];
    const totalGen = SPHERE_NAMES.reduce((s, sp) => s + gen[sp], 0);
    if (currentTick % 5 === 0) {
      newEntries.push({
        tick: currentTick,
        message: `+${totalGen.toFixed(1)} essence flows from the cosmos`,
        type: 'essence',
      });
    }
    if (tickResult.newSeason) {
      newEntries.push({
        tick: currentTick,
        message: `The season turns to ${sim.clock.getClock().currentSeason}`,
        type: 'narrative',
      });
    }

    if (newEntries.length > 0) {
      setLog(prev => [...prev.slice(-80), ...newEntries]);
    }
  }, [sim, ascendantId]);

  // ── Auto-play loop ──
  useEffect(() => {
    if (running) {
      const ms = Math.max(50, 1000 / speed);
      intervalRef.current = setInterval(doTick, ms);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, speed, doTick]);

  return (
    <div className="min-h-screen bg-stone-900 flex">
      {/* Left sidebar */}
      <div className="w-80 flex-shrink-0 p-4 space-y-4 overflow-y-auto border-r border-amber-900/30 bg-stone-800/90">
        {/* Ascendant info */}
        <div className="text-center py-3">
          <h1
            className="text-lg font-bold text-amber-100 tracking-wide"
            style={{ fontFamily: 'Cinzel, serif' }}
          >
            {archetype.title}
          </h1>
          <p className="text-xs text-amber-400/50 mt-1">
            Avatar: {avatarName}
          </p>
        </div>

        <SimulationControls
          tick={tick}
          season={season}
          year={year}
          running={running}
          speed={speed}
          onToggle={() => setRunning(r => !r)}
          onStep={doTick}
          onSpeedChange={setSpeed}
        />

        <EssencePanel
          pool={essenceSnapshot}
          maxEssence={maxEssence}
          primarySphere={archetype.sphereAlignment.primary}
          secondarySphere={archetype.sphereAlignment.secondary}
        />

        <EventLog entries={log} />
      </div>

      {/* Main viewport: hex map */}
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
    </div>
  );
}
