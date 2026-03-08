import { useState, useEffect, useRef, useCallback } from 'react';
import type { CosmologyProfile } from '../../types';
import type { AscendantArchetype } from '../../types/influence';
import type { GameState } from '../../types/gameState';
import { recalcVisibility, collectLOSSources } from '../../engine/visibility';
import { useSimulation } from './hooks/useSimulation';
import { useHexZoomData } from './hooks/useHexZoomData';
import { useAvatarData } from './hooks/useAvatarData';
import { useAgentInteraction } from './hooks/useAgentInteraction';

import { HexMap } from '../HexMap/HexMap';
import { EssencePanel } from './EssencePanel';
import { SimulationControls } from './SimulationControls';
import { DoomBar } from './DoomBar';
import { NarrativeFeed } from './NarrativeFeed';
import { RivalPanel } from './RivalPanel';
import { HarvestScreen } from './HarvestScreen';
import { RetinuePanel } from './RetinuePanel';
import { AgentDetailPanel } from './AgentDetailPanel';
import { AgentWheel } from './AgentWheel';
import { StrandView } from './StrandView';
import { InterventionConfirm } from './InterventionConfirm';
import { ScryOverlay } from './ScryOverlay';
import { HexZoomView } from './HexZoomView';
import { LocationView } from './LocationView';
import { HexBreadcrumb } from './HexBreadcrumb';
import {
  createScryState,
  initializeCourt,
  assignAgentToPosition,
  demoteAgent,
} from '../../engine/scry';
import type { ScryState } from '../../types/scry';
import type { Title } from '../../types/scry';
import { INTERVENTION_DEFINITIONS } from '../../types/dream';
import { MandateTracker } from './MandateTracker';
import { DebugPanel } from './DebugPanel';
import { AvatarHUD } from './AvatarHUD';
import type { HexMapHandle } from '../HexMap/HexMap';
import { moveAvatarToHex } from '../../engine/avatarMove';

export type ViewLevel = 'world' | 'hex-zoom' | 'location';

interface GameViewProps {
  archetype: AscendantArchetype;
  avatarName: string;
  cosmology: CosmologyProfile;
  seed: number;
}

export function GameView({ archetype, avatarName, cosmology, seed }: GameViewProps) {
  // ── Use simulation hook ──
  const {
    gameState, setGameState, tiles, running, speed,
    harvestResult, doTick, handleBeginNextCycle, handleToggleRunning,
    setSpeed, seasonName, year, maxEssence, COLS, ROWS,
  } = useSimulation({ archetype, avatarName, cosmology, seed });

  // ── Local state ──
  const [hoveredHex, setHoveredHex] = useState<{ col: number; row: number } | null>(null);
  const [selectedHex, setSelectedHex] = useState<{ col: number; row: number } | null>(null);
  const [viewLevel, setViewLevel] = useState<ViewLevel>('world');
  const [focusedHex, setFocusedHex] = useState<{ col: number; row: number } | null>(null);
  const [focusedLocationId, setFocusedLocationId] = useState<string | null>(null);
  const [scryState, setScryState] = useState<ScryState>(createScryState());
  const [scryVisible, setScryVisible] = useState(false);
  const [moveMode, setMoveMode] = useState(false);

  const hexMapRef = useRef<HexMapHandle>(null);

  // Open scry callback (shared with hook and avatar HUD)
  const handleOpenScry = useCallback(() => {
    // Auto-initialize with high_house if not initialized
    if (!scryState.initialized) {
      setScryState(prev => initializeCourt(prev, 'high_house'));
    }
    setScryVisible(true);
  }, [scryState.initialized]);

  // ── Agent interaction hook ──
  const {
    selectedAgentId,
    wheelVisible,
    wheelFeedback,
    strandViewAgent,
    pendingIntervention,
    retinueAgents,
    agentDetail,
    wheelSlots,
    strandData,
    handleAgentSelect,
    handleWheelSlotClick,
    handleInterventionConfirm,
    handleInterventionCancel,
    handleWheelDismiss,
    handleStrandClose,
    handleBackFromAgentDetail,
    handleViewPsyche,
    handleOpenWheel,
    handleAvatarWheelClick,
  } = useAgentInteraction({
    gameState,
    setGameState,
    archetype,
    onOpenScry: handleOpenScry,
  });

  // Hex zoom derived data
  const {
    hexLocations,
    hexAgentsByLocation,
    hexConnections,
    hexSphereInfluence,
    hexLineOfSight,
    hexTotalAgents,
    focusedLocation,
    focusedLocationAgents,
  } = useHexZoomData({
    graph: gameState.graph,
    ascendantId: gameState.ascendantId,
    focusedHex,
    focusedLocationId,
  });

  // Avatar position, sphere color, location overlays, avatar pixel position, and debug panel
  const {
    avatarPos,
    sphereColor,
    locationOverlays,
    avatarPixelPos,
    debugPanelOpen,
    handleToggleDebug,
  } = useAvatarData({
    graph: gameState.graph,
    ascendantId: gameState.ascendantId,
    archetype,
  });

  // Handlers for scry and other view-level state

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
        <button
          data-testid="debug-toggle"
          onClick={handleToggleDebug}
          className="ml-auto px-3 py-1 rounded text-xs font-mono border border-amber-900/30 bg-stone-700/50 text-amber-200/70 hover:text-amber-100 hover:bg-stone-600/50 transition-colors flex items-center gap-1.5"
          title="Toggle debug trace panel (`)"
        >
          {debugPanelOpen && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          )}
          Debug
        </button>
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

        {/* Right sidebar - Debug Panel OR Agent Detail/Retinue */}
        {debugPanelOpen ? (
          <DebugPanel
            currentTick={gameState.tick}
            followAgentId={selectedAgentId ?? undefined}
            onClose={handleToggleDebug}
          />
        ) : (
          <div data-testid="right-sidebar" className="w-72 flex-shrink-0 border-l border-amber-900/30 bg-stone-800/90 overflow-y-auto">
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
        )}
      </div>

      {/* StrandView overlay */}
      {strandData && (
        <StrandView
          agentName={strandData.agentName}
          strands={strandData.strands}
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
