import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { CosmologyProfile, HexTile } from '../../types';
import type { AscendantArchetype } from '../../types/influence';
import type { GameState } from '../../types/gameState';
import { initializeGameState } from '../../engine/gameInit';
import { runTick, resetEventCounter } from '../../engine/orchestrator';
import {
  startTwilight,
  runTwilightTick,
  computeHarvest,
  transitionToNewCycle,
} from '../../engine/cycleEnd';
import type { HarvestResult } from '../../engine/cycleEnd';
import { computeMaxEssence } from '../../engine/influence';
import { recalcVisibility, collectLOSSources } from '../../engine/visibility';

import { HexMap } from '../HexMap/HexMap';
import { EssencePanel } from './EssencePanel';
import { SimulationControls } from './SimulationControls';
import { DoomBar } from './DoomBar';
import { NarrativeFeed } from './NarrativeFeed';
import { RivalPanel } from './RivalPanel';
import { HarvestScreen } from './HarvestScreen';
import { RetinuePanel } from './RetinuePanel';
import { AgentDetailPanel } from './AgentDetailPanel';
import { getAgentDetail } from '../../engine/agentDetail';
import { AgentWheel } from './AgentWheel';
import { StrandView } from './StrandView';
import { InterventionConfirm } from './InterventionConfirm';
import { ScryOverlay } from './ScryOverlay';
import { HexZoomView } from './HexZoomView';
import { LocationView } from './LocationView';
import { HexBreadcrumb } from './HexBreadcrumb';
import { getRetinueAgents } from '../../engine/retinue';
import {
  createScryState,
  initializeCourt,
  assignAgentToPosition,
  demoteAgent,
} from '../../engine/scry';
import type { ScryState } from '../../types/scry';
import type { Title } from '../../types/scry';
import {
  getLocationsInHex,
  getAgentsAtLocation,
  getHexSphereInfluence,
  getLineOfSight,
  getLocationConnections,
} from '../../engine/hexZoom';
import { getAgentWheelSlots } from '../../engine/wheel';
import { getDeliveryInfo } from '../../engine/delivery';
import { executeIntervention } from '../../engine/dream';
import {
  getPresenceStrand,
  getDesiresStrand,
  getBondsStrand,
  getAmbitionsStrand,
  getBeliefsStrand,
  getFearsStrand,
} from '../../engine/strands';
import type { LocationSubtype } from '../../types';
import type { LocalEncounterMode, InterventionType } from '../../types/dream';
import { INTERVENTION_DEFINITIONS } from '../../types/dream';
import { MandateTracker } from './MandateTracker';
import { AvatarHUD } from './AvatarHUD';
import type { HexMapHandle } from '../HexMap/HexMap';
import { getAvatarHexPosition } from '../../engine/visibility';
import { moveAvatarToHex } from '../../engine/avatarMove';
import { hexToPixel } from '../../lib/hexMath';

export type ViewLevel = 'world' | 'hex-zoom' | 'location';

interface GameViewProps {
  archetype: AscendantArchetype;
  avatarName: string;
  cosmology: CosmologyProfile;
  seed: number;
}

const COLS = 20;
const ROWS = 15;

/** Settlement priority for overlay conflicts — larger settlements win */
const SETTLEMENT_PRIORITY: Partial<Record<LocationSubtype, number>> = {
  capital: 10, city: 8, town: 6, hamlet: 4,
  fort: 3, castle: 3, temple: 3, tower: 2, shrine: 2,
  mining: 2, camp: 1, farmland: 1, ruins: 1,
  battleground: 1, oasis: 1, unexplored_poi: 0,
};
function settlementPriority(subtype: LocationSubtype): number {
  return SETTLEMENT_PRIORITY[subtype] ?? 0;
}

const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export function GameView({ archetype, avatarName, cosmology, seed }: GameViewProps) {
  // ── Initialize ──
  const initial = useMemo(
    () => initializeGameState(archetype, avatarName, cosmology, seed, COLS, ROWS),
    [archetype, avatarName, cosmology, seed]
  );

  const [gameState, setGameState] = useState<GameState>(initial.state);
  const [tiles] = useState<HexTile[]>(initial.tiles);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [harvestResult, setHarvestResult] = useState<HarvestResult | null>(null);
  const [hoveredHex, setHoveredHex] = useState<{ col: number; row: number } | null>(null);
  const [selectedHex, setSelectedHex] = useState<{ col: number; row: number } | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [wheelVisible, setWheelVisible] = useState(false);
  const [strandViewAgent, setStrandViewAgent] = useState<string | null>(null);
  const [pendingIntervention, setPendingIntervention] = useState<{
    slotId: string;
    interventionType: InterventionType;
  } | null>(null);
  const [viewLevel, setViewLevel] = useState<ViewLevel>('world');
  const [focusedHex, setFocusedHex] = useState<{ col: number; row: number } | null>(null);
  const [focusedLocationId, setFocusedLocationId] = useState<string | null>(null);
  const [scryState, setScryState] = useState<ScryState>(createScryState());
  const [scryVisible, setScryVisible] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [wheelFeedback, setWheelFeedback] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hexMapRef = useRef<HexMapHandle>(null);

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

  const retinueAgents = useMemo(
    () => getRetinueAgents(gameState.graph, gameState.ascendantId),
    [gameState.graph, gameState.ascendantId]
  );

  const agentDetail = useMemo(() => {
    if (!selectedAgentId) return null;
    return getAgentDetail(gameState.graph, selectedAgentId, gameState.ascendantId);
  }, [selectedAgentId, gameState.graph, gameState.ascendantId]);

  const wheelSlots = useMemo(() => {
    if (!selectedAgentId || !wheelVisible) return null;
    const agent = retinueAgents.find(a => a.id === selectedAgentId);
    if (!agent) return null;
    return getAgentWheelSlots({
      tier: agent.tier,
      pool: gameState.essencePool,
      primarySphere: archetype.sphereAlignment.primary,
    });
  }, [selectedAgentId, wheelVisible, gameState.essencePool, retinueAgents, archetype]);

  // Hex zoom derived data
  const hexLocations = useMemo(() => {
    if (!focusedHex) return [];
    return getLocationsInHex(gameState.graph, focusedHex.col, focusedHex.row);
  }, [gameState.graph, focusedHex]);

  const hexAgentsByLocation = useMemo(() => {
    const map: Record<string, ReturnType<typeof getAgentsAtLocation>> = {};
    for (const loc of hexLocations) {
      map[loc.id] = getAgentsAtLocation(gameState.graph, loc.id);
    }
    return map;
  }, [gameState.graph, hexLocations]);

  const hexConnections = useMemo(() => {
    return getLocationConnections(gameState.graph, hexLocations.map(l => l.id));
  }, [gameState.graph, hexLocations]);

  const hexSphereInfluence = useMemo(() => {
    if (!focusedHex) return null;
    return getHexSphereInfluence(gameState.graph, focusedHex.col, focusedHex.row);
  }, [gameState.graph, focusedHex]);

  const hexLineOfSight = useMemo(() => {
    if (!focusedHex) return 'none' as const;
    return getLineOfSight(gameState.graph, gameState.ascendantId, focusedHex);
  }, [gameState.graph, gameState.ascendantId, focusedHex]);

  const hexTotalAgents = useMemo(() => {
    return Object.values(hexAgentsByLocation).reduce((sum, agents) => sum + agents.length, 0);
  }, [hexAgentsByLocation]);

  const focusedLocation = useMemo(() => {
    if (!focusedLocationId) return null;
    return gameState.graph.getNode(focusedLocationId) ?? null;
  }, [gameState.graph, focusedLocationId]);

  const focusedLocationAgents = useMemo(() => {
    if (!focusedLocationId) return [];
    return getAgentsAtLocation(gameState.graph, focusedLocationId);
  }, [gameState.graph, focusedLocationId]);

  // Avatar position and sphere color
  const avatarPos = useMemo(
    () => getAvatarHexPosition(gameState.graph, gameState.ascendantId),
    [gameState.graph, gameState.ascendantId]
  );

  const sphereColor = useMemo(() => {
    // Simple mapping from primary foundation sphere to color
    const primarySphere = archetype.sphereAlignment.primary;
    const sphereColorMap: Record<string, string> = {
      chaos: '#ff6633',
      order: '#3366ff',
      light: '#ffdd44',
      darkness: '#9933cc',
    };
    return sphereColorMap[primarySphere] ?? '#ff6633';
  }, [archetype.sphereAlignment.primary]);

  // Build location overlay map: hex coord key → LocationSubtype for hex map rendering
  const locationOverlays = useMemo(() => {
    const overlayMap = new Map<string, LocationSubtype>();
    const nodes = gameState.graph.getNodesByType('location');
    for (const node of nodes) {
      const props = node.properties;
      if (props.hexCol !== undefined && props.hexRow !== undefined && props.locationSubtype) {
        const key = `${props.hexCol},${props.hexRow}`;
        // If multiple locations share a hex, prefer the "largest" settlement
        const existing = overlayMap.get(key);
        if (!existing || settlementPriority(props.locationSubtype as LocationSubtype) > settlementPriority(existing)) {
          overlayMap.set(key, props.locationSubtype as LocationSubtype);
        }
      }
    }
    return overlayMap;
  }, [gameState.graph]);

  // Avatar pixel position for initial zoom
  const avatarPixelPos = useMemo(() => {
    if (!avatarPos) return null;
    const HEX_SIZE = 30; // matches HexMap default
    return hexToPixel(avatarPos, HEX_SIZE);
  }, [avatarPos]);

  // Handlers
  const handleAgentSelect = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
    setWheelVisible(true);
    setStrandViewAgent(null);
  }, []);

  const handleWheelSlotClick = useCallback((slotId: string) => {
    if (slotId === 'scry') {
      handleOpenScry();
      return;
    }

    // Find the slot to get the intervention type
    const slot = wheelSlots?.find(s => s.id === slotId);
    if (!slot?.interventionType || !slot.available) return;

    // For dream: placeholder for Layer 3 DreamInterface
    if (slot.interventionType === 'dream') {
      // TODO: Layer 3 will open DreamInterface here
      return;
    }

    // For all other interventions: show confirmation popover
    setPendingIntervention({
      slotId,
      interventionType: slot.interventionType,
    });
  }, [selectedAgentId, wheelSlots]);

  const handleInterventionConfirm = useCallback((encounterMode?: LocalEncounterMode) => {
    if (!pendingIntervention || !selectedAgentId) return;

    const def = INTERVENTION_DEFINITIONS[pendingIntervention.interventionType];
    const slot = wheelSlots?.find(s => s.id === pendingIntervention.slotId);
    if (!slot?.sphere) return;

    // Execute intervention
    const result = executeIntervention({
      interventionType: pendingIntervention.interventionType,
      sphere: slot.sphere,
      baseCost: slot.essenceCost,
      alignmentFactor: 1.0, // Simplified for now; full alignment from actor profile in Layer 3
      actorType: 'individual',
      pool: gameState.essencePool,
    });

    if (result.success) {
      // Spend essence and add narrative event
      setGameState(prev => {
        const newPool = { ...prev.essencePool };
        newPool[slot.sphere!] = Math.max(0, newPool[slot.sphere!] - result.essenceSpent[slot.sphere!]);
        return {
          ...prev,
          essencePool: newPool,
          recentEvents: [
            ...prev.recentEvents.slice(-99),
            {
              id: `evt_intervention_${prev.tick}_${Date.now()}`,
              tick: prev.tick,
              type: 'narrative' as const,
              message: `${def.description} (${result.detected ? 'detected!' : 'undetected'})`,
              significance: result.detected ? 0.8 : 0.5,
              sphere: slot.sphere!,
            },
          ],
        };
      });
    }

    setPendingIntervention(null);
    setWheelVisible(false);
  }, [pendingIntervention, selectedAgentId, wheelSlots, gameState.essencePool]);

  const handleInterventionCancel = useCallback(() => {
    setPendingIntervention(null);
  }, []);

  const handleWheelDismiss = useCallback(() => {
    setWheelVisible(false);
  }, []);

  const handleStrandClose = useCallback(() => {
    setStrandViewAgent(null);
    setWheelVisible(true);
  }, []);

  const handleOpenScry = useCallback(() => {
    // Auto-initialize with high_house if not initialized
    if (!scryState.initialized) {
      setScryState(prev => initializeCourt(prev, 'high_house'));
    }
    setScryVisible(true);
    setWheelVisible(false);
  }, [scryState.initialized]);

  const handleScryAssign = useCallback((positionId: string, agentId: string, title: Title, cost: number) => {
    // Spend essence from primary sphere
    const primarySphere = archetype.sphereAlignment.primary;
    setGameState(prev => {
      const newPool = { ...prev.essencePool };
      if (newPool[primarySphere] >= cost) {
        newPool[primarySphere] -= cost;
      }
      return { ...prev, essencePool: newPool };
    });

    setScryState(prev => assignAgentToPosition(prev, positionId, agentId, title, cost, gameState.tick));
  }, [archetype, gameState.tick]);

  const handleScryDemote = useCallback((positionId: string) => {
    setScryState(prev => demoteAgent(prev, positionId, gameState.tick));
  }, [gameState.tick]);

  const handleHexClick = useCallback((coord: { col: number; row: number }) => {
    setSelectedHex(coord);
    setViewLevel('hex-zoom');
    setFocusedHex(coord);
  }, []);

  const handleLocationDoubleClick = useCallback((locationId: string) => {
    setViewLevel('location');
    setFocusedLocationId(locationId);
  }, []);

  const handleBackToWorld = useCallback(() => {
    setViewLevel('world');
    setFocusedHex(null);
    setFocusedLocationId(null);
  }, []);

  const handleBackToHex = useCallback(() => {
    setViewLevel('hex-zoom');
    setFocusedLocationId(null);
  }, []);

  const handleLocationClick = useCallback((_locationId: string) => {
    // Future: show info tooltip
  }, []);

  const handleToggleRunning = useCallback(() => {
    setRunning(r => !r);
  }, []);

  const handleBackFromAgentDetail = useCallback(() => {
    setSelectedAgentId(null);
  }, []);

  const handleViewPsyche = useCallback(() => {
    setStrandViewAgent(selectedAgentId);
  }, [selectedAgentId]);

  const handleOpenWheel = useCallback(() => {
    setWheelVisible(true);
  }, []);

  const handleCloseScry = useCallback(() => {
    setScryVisible(false);
  }, []);

  const handleCenterOnAvatar = useCallback(() => {
    if (avatarPixelPos && hexMapRef.current) {
      hexMapRef.current.centerOn(avatarPixelPos.x, avatarPixelPos.y, 3.0);
    }
  }, [avatarPixelPos]);

  const handleAvatarMoveClick = useCallback(() => {
    setMoveMode(true);
  }, []);

  const handleAvatarWheelClick = useCallback(() => {
    if (retinueAgents.length === 0) {
      // No agents under influence yet
      setWheelFeedback('You have no agents under your influence yet. Use interventions to recruit agents.');
      setTimeout(() => setWheelFeedback(null), 4000);
      return;
    }

    if (selectedAgentId) {
      setWheelVisible(true);
    } else {
      // If no agent selected, select the first retinue agent
      handleAgentSelect(retinueAgents[0].id);
    }
  }, [selectedAgentId, retinueAgents, handleAgentSelect]);

  const handleAvatarScryClick = useCallback(() => {
    handleOpenScry();
  }, [handleOpenScry]);

  // Handle hex click in move mode
  const handleHexClickMove = useCallback((coord: { col: number; row: number }) => {
    if (moveMode) {
      // Move avatar to target hex
      moveAvatarToHex(gameState.graph, gameState.ascendantId, coord);
      // Recalculate visibility
      const losSources = collectLOSSources(gameState.graph, gameState.ascendantId, []);
      const newVisibilityMap = recalcVisibility(gameState.visibilityMap, losSources, gameState.graph, gameState.tick, COLS, ROWS);
      setGameState(prev => ({
        ...prev,
        visibilityMap: newVisibilityMap,
      }));
      // Exit move mode
      setMoveMode(false);
    } else {
      // Normal hex click behavior
      handleHexClick(coord);
    }
  }, [moveMode, gameState, handleHexClick]);

  return (
    <div className="min-h-screen bg-stone-900 flex flex-col">
      {/* Doom + Mandate bar at top */}
      <div className="w-full px-4 py-2 bg-stone-800/95 border-b border-amber-900/30 flex gap-4 relative">
        <DoomBar definition={gameState.doomDefinition} state={gameState.doomClock} />
        {gameState.mandateDefinition && gameState.mandateState && (
          <>
            <div className="w-px bg-amber-900/30 self-stretch" />
            <MandateTracker
              definition={gameState.mandateDefinition}
              state={gameState.mandateState}
            />
          </>
        )}
      </div>

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
            onToggle={handleToggleRunning}
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
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 p-4 flex items-center justify-center overflow-hidden relative">
            {viewLevel === 'world' && (
              <>
                <HexMap
                  ref={hexMapRef}
                  tiles={tiles}
                  cols={COLS}
                  rows={ROWS}
                  hoveredHex={hoveredHex}
                  selectedHex={selectedHex}
                  overlayMode="none"
                  visibilityMap={gameState.visibilityMap}
                  locationOverlays={locationOverlays}
                  avatarHex={avatarPos ?? undefined}
                  sphereColor={sphereColor}
                  initialCenter={avatarPixelPos ?? undefined}
                  initialScale={3.0}
                  onHexClick={handleHexClickMove}
                  onHexHover={setHoveredHex}
                />

                <AvatarHUD
                  avatarName={avatarName}
                  sphereColor={sphereColor}
                  onCenterOnAvatar={handleCenterOnAvatar}
                  onMoveClick={handleAvatarMoveClick}
                  onWheelClick={handleAvatarWheelClick}
                  onScryClick={handleAvatarScryClick}
                  moveMode={moveMode}
                />

                {/* Agent Wheel overlay */}
                {wheelSlots && wheelVisible && selectedAgentId && (
                  <svg className="absolute inset-0" style={{ pointerEvents: 'auto' }} data-testid="wheel-svg">
                    <AgentWheel
                      slots={wheelSlots}
                      agentName={retinueAgents.find(a => a.id === selectedAgentId)?.name ?? ''}
                      agentTitle={retinueAgents.find(a => a.id === selectedAgentId)?.tierName ?? ''}
                      cx={300}
                      cy={200}
                      onSlotClick={handleWheelSlotClick}
                      onDismiss={handleWheelDismiss}
                    />
                  </svg>
                )}

                {/* Wheel feedback message (when no agents available) */}
                {wheelFeedback && (
                  <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-900/80 border border-red-700 rounded-lg px-6 py-4 text-amber-100 text-center max-w-xs shadow-lg z-30"
                    data-testid="wheel-feedback"
                  >
                    {wheelFeedback}
                  </div>
                )}

                {/* Intervention confirmation popover */}
                {pendingIntervention && wheelSlots && (() => {
                  const slot = wheelSlots.find(s => s.id === pendingIntervention.slotId);
                  if (!slot) return null;
                  return (
                    <InterventionConfirm
                      interventionType={pendingIntervention.interventionType}
                      label={slot.label}
                      deliveryMode={INTERVENTION_DEFINITIONS[pendingIntervention.interventionType].deliveryMode}
                      essenceCost={slot.essenceCost}
                      sphere={slot.sphere ?? 'mind'}
                      detectionRisk={slot.detectionRisk}
                      rangeStatus={slot.rangeStatus}
                      hexDistance={slot.hexDistance}
                      description={INTERVENTION_DEFINITIONS[pendingIntervention.interventionType].description}
                      onConfirm={handleInterventionConfirm}
                      onCancel={handleInterventionCancel}
                    />
                  );
                })()}
              </>
            )}

            {viewLevel === 'hex-zoom' && focusedHex && hexSphereInfluence && (
              <div className="flex flex-col h-full">
                <HexBreadcrumb
                  hexCol={focusedHex.col}
                  hexRow={focusedHex.row}
                  terrain={tiles.find(t => t.coord.col === focusedHex.col && t.coord.row === focusedHex.row)?.terrain ?? 'grassland'}
                  locationCount={hexLocations.length}
                  agentCount={hexTotalAgents}
                  lineOfSight={hexLineOfSight}
                  sphereInfluence={hexSphereInfluence}
                  onBack={handleBackToWorld}
                  data-testid="hex-breadcrumb"
                />
                <div className="flex-1 flex items-center justify-center">
                  <HexZoomView
                    locations={hexLocations}
                    agentsByLocation={hexAgentsByLocation}
                    connections={hexConnections}
                    lineOfSight={hexLineOfSight}
                    onLocationClick={handleLocationClick}
                    onLocationDoubleClick={handleLocationDoubleClick}
                    data-testid="hex-zoom-view"
                  />
                </div>
              </div>
            )}

            {viewLevel === 'location' && focusedLocation && focusedHex && (
              <LocationView
                location={focusedLocation}
                agents={focusedLocationAgents}
                hexTerrain={tiles.find(t => t.coord.col === focusedHex.col && t.coord.row === focusedHex.row)?.terrain ?? 'grassland'}
                hexCol={focusedHex.col}
                hexRow={focusedHex.row}
                onAgentClick={handleAgentSelect}
                onBack={handleBackToHex}
                data-testid="location-view"
              />
            )}
          </div>

          {/* Narrative feed at bottom */}
          <div className="border-t border-amber-900/30 bg-stone-800/80 p-3">
            <NarrativeFeed events={gameState.recentEvents} />
          </div>
        </div>

        {/* Right sidebar - Agent Detail or Retinue */}
        <div className="w-72 flex-shrink-0 border-l border-amber-900/30 bg-stone-800/90 overflow-y-auto">
          {agentDetail ? (
            <AgentDetailPanel
              detail={agentDetail}
              onBack={handleBackFromAgentDetail}
              onViewPsyche={handleViewPsyche}
              onIntervene={handleOpenWheel}
              onLocationClick={handleBackFromAgentDetail}
            />
          ) : (
            <div className="p-4">
              <RetinuePanel
                agents={retinueAgents}
                selectedAgentId={selectedAgentId}
                onAgentSelect={handleAgentSelect}
              />
            </div>
          )}
        </div>
      </div>

      {/* StrandView overlay */}
      {strandViewAgent && (
        <StrandView
          agentName={gameState.graph.getNode(strandViewAgent)?.name ?? 'Unknown'}
          strands={{
            presence: getPresenceStrand(gameState.graph, strandViewAgent),
            desires: getDesiresStrand(gameState.graph, strandViewAgent),
            bonds: getBondsStrand(gameState.graph, strandViewAgent),
            ambitions: getAmbitionsStrand(gameState.graph, strandViewAgent),
            beliefs: getBeliefsStrand(gameState.graph, strandViewAgent),
            fears: getFearsStrand(gameState.graph, strandViewAgent),
          }}
          onClose={handleStrandClose}
        />
      )}

      {/* Scry overlay */}
      {scryVisible && (
        <ScryOverlay
          scryState={scryState}
          retinueAgents={retinueAgents}
          essencePool={gameState.essencePool}
          primarySphere={archetype.sphereAlignment.primary}
          tick={gameState.tick}
          seed={gameState.seed + gameState.tick}
          onAssign={handleScryAssign}
          onDemote={handleScryDemote}
          onClose={handleCloseScry}
        />
      )}

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
