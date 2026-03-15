import { useState, useCallback, useMemo } from 'react';
import type { CosmologyProfile } from '../../types';
import type { AscendantArchetype } from '../../types/influence';
import type { ScryState } from '../../types/scry';
import { createScryState } from '../../engine/scry';
import { useSimulation } from './hooks/useSimulation';
import { getEncountersByLocationType, getEncounterById } from '../../data/encounter-content';
import { useHexZoomData } from './hooks/useHexZoomData';
import { useAvatarData } from './hooks/useAvatarData';
import { useScry } from './hooks/useScry';
import { useAgentInteraction } from './hooks/useAgentInteraction';
import { useViewNavigation } from './hooks/useViewNavigation';
export type { ViewLevel } from './hooks/useViewNavigation';

import { GameErrorBoundary } from '../shared/GameErrorBoundary';
import { AnimateMount } from '../shared/AnimateMount';
import { HexMap } from '../HexMap/HexMap';
import { EssencePanel } from './EssencePanel';
import { SimulationControls } from './SimulationControls';
import { DoomBar } from './DoomBar';
import { ActionDrawer } from './ActionDrawer';
import { NarrativeLog } from './NarrativeLog';
import { RivalPanel } from './RivalPanel';
import { HarvestScreen } from './HarvestScreen';
import { RetinuePanel } from './RetinuePanel';
import { AgentInfoCard } from './AgentInfoCard';
import { AgentProfileModal } from './AgentProfileModal';
import { StrandView } from './StrandView';
import { InterventionConfirm } from './InterventionConfirm';
import { AgendaPicker } from './AgendaPicker';
import { ScryOverlay } from './ScryOverlay';
import { ScryProvider } from './contexts/ScryContext';
import { HexZoomView } from './HexZoomView';
import { LocationView } from './LocationView';
import { HexBreadcrumb } from './HexBreadcrumb';
import { HexFlavorPanel } from './HexFlavorPanel';
import { HexPoiPanel } from './HexPoiPanel';
import { INTERVENTION_DEFINITIONS } from '../../types/dream';
import { MandateTracker } from './MandateTracker';
import { DebugPanel } from './DebugPanel';
import { AvatarHUD } from './AvatarHUD';
import { WorldPulse } from './WorldPulse';
import { ToastStack } from './ToastStack';
import { AlertBar } from './AlertBar';
import { EventPopup } from './EventPopup';
import { useNotifications } from './hooks/useNotifications';

interface GameViewProps {
  archetype: AscendantArchetype;
  avatarName: string;
  cosmology: CosmologyProfile;
  seed: number;
}

export function GameView({ archetype, avatarName, cosmology, seed }: GameViewProps) {
  // ── Scry state (lifted here so simulation + navigation can use it for LOS) ──
  const [scryState, setScryState] = useState<ScryState>(createScryState);

  // ── Use simulation hook ──
  const {
    gameState, setGameState, tiles, running, speed,
    harvestResult, doTick, handleBeginNextCycle, handleToggleRunning,
    setRunning, setSpeed, seasonName, year, maxEssence, COLS, ROWS,
  } = useSimulation({ archetype, avatarName, cosmology, seed, scryState });

  // ── Avatar data hook (needed before view navigation for avatarPixelPos) ──
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

  // ── View navigation hook ──
  const {
    hoveredHex, setHoveredHex, selectedHex, viewLevel,
    focusedHex, focusedLocationId, moveMode, hexMapRef,
    handleHexClick, handleLocationDoubleClick, handleBackToWorld,
    handleBackToHex, handleLocationClick, handleCenterOnAvatar,
    handleAvatarMoveClick, handleHexClickMove,
  } = useViewNavigation({ gameState, setGameState, avatarPixelPos, COLS, ROWS, scryState });

  // ── Scry hook ──
  const {
    scryVisible,
    handleOpenScry,
    handleScryAssign,
    handleScryDemote,
    handleCloseScry,
    handleAvatarScryClick,
  } = useScry({ gameState, setGameState, archetype, scryState, setScryState });

  // ── Agent interaction hook ──
  const {
    selectedAgentId,
    drawerOpen,
    pendingIntervention,
    profileModalAgentId,
    playingCardId,
    selectedAgenda,
    agendaPickerOpen,
    pendingAgendas,
    retinueAgents,
    agentDetail,
    agentInfoCard,
    agentFullProfile,
    wheelSlots,
    strandData,
    handleAgentSelect,
    handleWheelSlotClick,
    handleInterventionConfirm,
    handleInterventionCancel,
    handleAgendaSelect,
    handleAgendaCancel,
    handleDrawerClose,
    handleStrandClose,
    handleBackFromAgentDetail,
    handleViewPsyche,
    handleOpenDrawer,
    handleAvatarActionClick,
    handleViewProfile,
    handleCloseProfile,
    closeAllAgentOverlays,
  } = useAgentInteraction({
    gameState,
    setGameState,
    archetype,
    onOpenScry: handleOpenScry,
  });

  // ── Notification system hook ──
  const {
    notificationState,
    currentPopup,
    handleDismissToast,
    handleDismissAlert,
    handleDismissPopup,
    handlePopupChoice,
  } = useNotifications({
    tickEvents: gameState.tickEvents,
    running,
    setRunning,
  });

  // ── Hex zoom derived data ──
  const {
    hexLocations,
    hexAgentsByLocation,
    hexConnections,
    hexSphereInfluence,
    hexLineOfSight,
    hexTotalAgents,
    hexCultures,
    hexFactions,
    focusedLocation,
    focusedLocationAgents,
  } = useHexZoomData({
    graph: gameState.graph,
    ascendantId: gameState.ascendantId,
    focusedHex,
    focusedLocationId,
  });

  // ── Location encounter data (available + active) ──
  const locationEncounters = useMemo(() => {
    if (!focusedLocation || viewLevel !== 'location') {
      return { available: [], active: [] };
    }

    // Get location subtype for encounter lookup
    const locProps = (focusedLocation.properties ?? {}) as Record<string, unknown>;
    const subtype = typeof locProps.locationSubtype === 'string'
      ? locProps.locationSubtype
      : '';

    // Get available encounters for this location type
    const available = subtype ? getEncountersByLocationType(subtype) : [];

    // Get active encounters whose actor is at this location
    const active = gameState.encounterProgress.filter(p => {
      if (p.status !== 'active') return false;
      const actorEdges = gameState.graph.getAllEdgesForNode(p.actorId);
      return actorEdges.some(
        e => e.type === 'located_at' && e.target === focusedLocation.id
      );
    });

    return { available, active };
  }, [focusedLocation, viewLevel, gameState.encounterProgress, gameState.graph]);

  // RC-002: Extracted to avoid inline arrow in render
  const getAgentName = useCallback(
    (id: string) => gameState.graph.getNode(id)?.name ?? 'Unknown',
    [gameState.graph],
  );

  // IX-002: Wrapped scry click with cross-hook overlay mutual exclusion
  const handleScryWithMutex = useCallback(() => {
    closeAllAgentOverlays();
    handleAvatarScryClick();
  }, [closeAllAgentOverlays, handleAvatarScryClick]);

  // Zoom to an agent's location hex from sidebar/retinue eye icon
  const handleZoomToLocation = useCallback((locationId: string) => {
    const locNode = gameState.graph.getNode(locationId);
    if (!locNode) return;
    const props = (locNode.properties ?? {}) as Record<string, unknown>;
    const col = typeof props.hexCol === 'number' ? props.hexCol : undefined;
    const row = typeof props.hexRow === 'number' ? props.hexRow : undefined;
    if (col !== undefined && row !== undefined) {
      handleHexClick({ col, row });
    }
  }, [gameState.graph, handleHexClick]);

  // Zoom to the ascendant's current hex from AvatarHUD eye icon
  const handleAvatarZoomToLocation = useCallback(() => {
    if (avatarPos) {
      handleHexClick({ col: avatarPos.col, row: avatarPos.row });
    }
  }, [avatarPos, handleHexClick]);

  // IX-013: Wrapped location double-click closes drawer before drilling down
  const handleLocationDoubleClickWithClose = useCallback((locationId: string) => {
    handleDrawerClose();
    handleLocationDoubleClick(locationId);
  }, [handleDrawerClose, handleLocationDoubleClick]);

  return (
    <GameErrorBoundary>
      <div className="h-screen flex flex-col overflow-hidden relative grain" style={{ backgroundColor: 'var(--bg-abyss)' }}>
      {/* ═══ Top status bar — Doom + Mandate ═══ */}
      <div
        className="w-full px-5 py-2.5 flex gap-4 items-center relative z-30 flex-shrink-0"
        style={{
          background: 'linear-gradient(180deg, rgba(17,17,20,0.98), rgba(10,10,14,0.95))',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex-[2] min-w-0">
          <DoomBar definition={gameState.doomDefinition} state={gameState.doomClock} />
        </div>
        {gameState.mandateDefinition && gameState.mandateState && (
          <>
            <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
            <div className="flex-[1] min-w-0">
              <MandateTracker
                definition={gameState.mandateDefinition}
                state={gameState.mandateState}
              />
            </div>
          </>
        )}
        <AlertBar
          alerts={notificationState.alerts}
          onDismiss={handleDismissAlert}
        />
        <button
          data-testid="debug-toggle"
          onClick={handleToggleDebug}
          className="ml-auto px-2.5 py-1 rounded flex items-center gap-1.5 flex-shrink-0 transition-colors"
          style={{
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            color: debugPanelOpen ? 'var(--accent-gold)' : 'var(--text-muted)',
            background: debugPanelOpen ? 'var(--accent-gold-glow)' : 'transparent',
            border: `1px solid ${debugPanelOpen ? 'var(--accent-gold-dim)' : 'var(--border-subtle)'}`,
          }}
          title="Toggle debug trace panel (`)"
        >
          {debugPanelOpen && (
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-gold)' }} />
          )}
          Debug
        </button>
      </div>

      {/* ═══ Main content area ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Left sidebar ── */}
        <nav
          aria-label="Game status"
          className="flex-shrink-0 flex flex-col overflow-y-auto"
          style={{
            width: 'var(--sidebar-width)',
            background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
            borderRight: '1px solid var(--border-subtle)',
            padding: 'var(--panel-padding)',
            gap: '0.75rem',
          }}
        >
          {/* Ascendant identity */}
          <div className="text-center py-2">
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-lg)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '0.06em',
              }}
            >
              {archetype.title}
            </h1>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Cycle {gameState.cycle}
            </p>
          </div>

          <div className="divider-gold" />

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
        </nav>

        {/* ── Center: map / hex zoom / location ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 flex items-center justify-center overflow-hidden relative">
            {/* NarrativeLog overlay */}
            <NarrativeLog events={gameState.recentEvents} />
            {/* Toast notifications */}
            <ToastStack toasts={notificationState.toasts} onDismiss={handleDismissToast} />
            {viewLevel === 'world' && (
              <>
                <HexMap
                  ref={hexMapRef}
                  tiles={tiles}
                  cols={COLS}
                  rows={ROWS}
                  seed={gameState.seed}
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
                  onWheelClick={handleAvatarActionClick}
                  onScryClick={handleScryWithMutex}
                  onZoomToLocation={handleAvatarZoomToLocation}
                  moveMode={moveMode}
                />

                {/* Agenda picker overlay */}
                <AnimateMount show={agendaPickerOpen && !!pendingAgendas} animation="anim-fade">
                  {pendingAgendas && (() => {
                    const slot = wheelSlots?.find(s => s.id === pendingIntervention?.slotId);
                    return (
                      <AgendaPicker
                        agendas={pendingAgendas}
                        onSelect={handleAgendaSelect}
                        onCancel={handleAgendaCancel}
                        sphere={slot?.sphere ?? 'mind'}
                      />
                    );
                  })()}
                </AnimateMount>

                {/* Intervention confirmation popover */}
                {pendingIntervention && wheelSlots && !agendaPickerOpen && (() => {
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
                      agendaName={selectedAgenda?.name}
                      agendaNarrativeHook={selectedAgenda?.narrativeHook}
                      onConfirm={handleInterventionConfirm}
                      onCancel={handleInterventionCancel}
                    />
                  );
                })()}
              </>
            )}

            {viewLevel === 'hex-zoom' && focusedHex && hexSphereInfluence && (() => {
              const hexTerrain = tiles.find(t => t.coord.col === focusedHex.col && t.coord.row === focusedHex.row)?.terrain ?? 'grassland';
              return (
                <div className="flex flex-col h-full w-full">
                  <HexBreadcrumb
                    hexCol={focusedHex.col}
                    hexRow={focusedHex.row}
                    terrain={hexTerrain}
                    locationCount={hexLocations.length}
                    agentCount={hexTotalAgents}
                    lineOfSight={hexLineOfSight}
                    sphereInfluence={hexSphereInfluence}
                    cultures={hexCultures}
                    factions={hexFactions}
                    onBack={handleBackToWorld}
                    data-testid="hex-breadcrumb"
                  />
                  <div className="flex-1 flex overflow-hidden">
                    {/* Left: Flavor text */}
                    <div className="flex-shrink-0 overflow-hidden" style={{ width: '220px' }}>
                      <HexFlavorPanel
                        terrain={hexTerrain}
                        lineOfSight={hexLineOfSight}
                        sphereInfluence={hexSphereInfluence}
                        cultures={hexCultures}
                        factions={hexFactions}
                        locationCount={hexLocations.length}
                        agentCount={hexTotalAgents}
                      />
                    </div>

                    {/* Center: Hex zoom SVG */}
                    <div className="flex-1 flex items-center justify-center overflow-hidden">
                      <HexZoomView
                        locations={hexLocations}
                        agentsByLocation={hexAgentsByLocation}
                        connections={hexConnections}
                        lineOfSight={hexLineOfSight}
                        terrain={hexTerrain}
                        cultures={hexCultures}
                        factions={hexFactions}
                        onLocationClick={handleLocationClick}
                        onLocationDoubleClick={handleLocationDoubleClickWithClose}
                        data-testid="hex-zoom-view"
                      />
                    </div>

                    {/* Right: Points of interest list */}
                    <div className="flex-shrink-0 overflow-hidden" style={{ width: '220px' }}>
                      <HexPoiPanel
                        locations={hexLocations}
                        agentsByLocation={hexAgentsByLocation}
                        lineOfSight={hexLineOfSight}
                        onLocationClick={handleLocationClick}
                        onLocationDoubleClick={handleLocationDoubleClickWithClose}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}

            {viewLevel === 'location' && focusedLocation && focusedHex && (
              <LocationView
                location={focusedLocation}
                agents={focusedLocationAgents}
                hexTerrain={tiles.find(t => t.coord.col === focusedHex.col && t.coord.row === focusedHex.row)?.terrain ?? 'grassland'}
                hexCol={focusedHex.col}
                hexRow={focusedHex.row}
                onAgentClick={handleAgentSelect}
                onBack={handleBackToHex}
                availableEncounters={locationEncounters.available}
                activeEncounters={locationEncounters.active}
                getAgentName={getAgentName}
                getEncounterTemplate={getEncounterById}
                graph={gameState.graph}
                seed={gameState.seed}
              />
            )}
          </div>

          {/* ActionDrawer overlay */}
          {wheelSlots && drawerOpen && selectedAgentId && (
            <ActionDrawer
              open={drawerOpen}
              slots={wheelSlots}
              agentName={retinueAgents.find(a => a.id === selectedAgentId)?.name ?? ''}
              agentTier={retinueAgents.find(a => a.id === selectedAgentId)?.tierName ?? ''}
              playingCardId={playingCardId}
              onSlotClick={handleWheelSlotClick}
              onClose={handleDrawerClose}
            />
          )}
        </div>

        {/* ── Right sidebar — Debug Panel OR Agent Info Card/Retinue ── */}
        {debugPanelOpen ? (
          <DebugPanel
            currentTick={gameState.tick}
            followAgentId={selectedAgentId ?? undefined}
            onClose={handleToggleDebug}
          />
        ) : (
          <div
            data-testid="right-sidebar"
            className="flex-shrink-0 overflow-y-auto"
            style={{
              width: 'var(--sidebar-width)',
              background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
              borderLeft: '1px solid var(--border-subtle)',
            }}
          >
            {agentInfoCard ? (
              <AgentInfoCard
                card={agentInfoCard}
                onViewProfile={handleViewProfile}
                onBack={handleBackFromAgentDetail}
                onZoomToLocation={handleZoomToLocation}
                graph={gameState.graph}
                seed={gameState.seed}
              />
            ) : retinueAgents.length > 0 ? (
              <div style={{ padding: 'var(--panel-padding)' }}>
                <RetinuePanel
                  agents={retinueAgents}
                  selectedAgentId={selectedAgentId}
                  onAgentSelect={handleAgentSelect}
                  onZoomToLocation={handleZoomToLocation}
                />
              </div>
            ) : (
              <div style={{ padding: 'var(--panel-padding)' }}>
                <WorldPulse gameState={gameState} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* StrandView overlay */}
      <AnimateMount show={strandData !== null} animation="anim-fade">
        {strandData && (
          <StrandView
            agentName={strandData.agentName}
            strands={strandData.strands}
            onClose={handleStrandClose}
          />
        )}
      </AnimateMount>

      {/* Scry overlay */}
      <AnimateMount show={scryVisible} animation="anim-fade">
        <ScryProvider
          value={{
            scryState,
            retinueAgents,
            essencePool: gameState.essencePool,
            primarySphere: archetype.sphereAlignment.primary,
            tick: gameState.tick,
            seed: gameState.seed + gameState.tick,
            onAssign: handleScryAssign,
            onDemote: handleScryDemote,
            onClose: handleCloseScry,
          }}
        >
          <ScryOverlay />
        </ScryProvider>
      </AnimateMount>

      {/* Harvest overlay */}
      <AnimateMount show={harvestResult !== null} animation="anim-fade">
        {harvestResult && (
          <HarvestScreen
            harvest={harvestResult}
            cycle={gameState.cycle}
            onBeginNextCycle={handleBeginNextCycle}
          />
        )}
      </AnimateMount>

      {/* Agent Profile Modal overlay */}
      <AnimateMount show={!!profileModalAgentId && !!agentInfoCard} animation="anim-fade-up">
        {agentInfoCard && (
          <AgentProfileModal
            card={agentInfoCard}
            profile={agentFullProfile}
            onClose={handleCloseProfile}
          />
        )}
      </AnimateMount>

      {/* Event popup overlay */}
      <EventPopup
        popup={currentPopup}
        queueLength={notificationState.popupQueue.length}
        onDismiss={handleDismissPopup}
        onChoice={handlePopupChoice}
      />
    </div>
    </GameErrorBoundary>
  );
}
