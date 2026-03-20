import { useState, useCallback, useMemo } from 'react';
import type { CosmologyProfile } from '../../types';
import type { AscendantArchetype } from '../../types/influence';
import type { ScryState } from '../../types/scry';
import { createScryState } from '../../engine/scry';
import { useSimulation } from './hooks/useSimulation';
import type { EncounterProgress, EncounterTemplate } from '../../types/encounter';
import { getEncountersByLocationType, getEncounterById } from '../../data/encounter-content';
import { useHexZoomData } from './hooks/useHexZoomData';
import { useAvatarData } from './hooks/useAvatarData';
import { useScry } from './hooks/useScry';
import { useAgentInteraction } from './hooks/useAgentInteraction';
import { useViewNavigation } from './hooks/useViewNavigation';
export type { ViewLevel } from './hooks/useViewNavigation';

import { GameErrorBoundary } from '../shared/GameErrorBoundary';
import { IconButton } from '../shared/IconButton';
import { AnimateMount } from '../shared/AnimateMount';
import { HexMap } from '../HexMap/HexMap';
import { EssencePanel } from './EssencePanel';
import { SimulationControls } from './SimulationControls';
import { DoomBar } from './DoomBar';
import { ActionDrawer } from './ActionDrawer';
import { NarrativeLog } from './NarrativeLog';
import { HarvestScreen } from './HarvestScreen';
import { RetinuePanel } from './RetinuePanel';
import { AgentInfoCard } from './AgentInfoCard';
import { AgentProfileModal } from './AgentProfileModal';
import { StrandView } from './StrandView';
import { InterventionConfirm } from './InterventionConfirm';
import { AgendaPicker } from './AgendaPicker';
import { ScryOverlay } from './ScryOverlay';
import { ScryProvider } from './contexts/ScryContext';
import { LocationView } from './LocationView';
import { HexBreadcrumb } from './HexBreadcrumb';
import { HexSidebar } from './HexSidebar';
import { HexChronicle } from './HexChronicle';
import { INTERVENTION_DEFINITIONS } from '../../types/dream';
import { MandateTracker } from './MandateTracker';
import { DebugPanel } from './DebugPanel';
import { AvatarHUD } from './AvatarHUD';
import { WorldPulse } from './WorldPulse';
import { ToastStack } from './ToastStack';
import { AlertBar } from './AlertBar';
import { RivalsButton } from './RivalsButton';
import { IdentityChip } from './IdentityChip';
import { EventPopup } from './EventPopup';
import { EncounterVignetteModal } from './EncounterVignetteModal';
import { useNotifications } from './hooks/useNotifications';
import { useTopBarHotkeys } from './hooks/useTopBarHotkeys';
import { computeEssenceIncome } from '../../engine/essenceIncome';
import { buildHexTargetContext, buildLocationTargetContext } from '../../engine/targetContextBuilders';
import { useTargetActions } from './hooks/useTargetActions';
import { templateIdFromSlotId } from '../../engine/targetActions';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { createUnifiedAction } from '../../engine/unifiedActionLifecycle';
import { mulberry32 } from '../../lib/prng';
import { DIVINE_INFLUENCE_CONSTANTS } from '../../data/intervention-feedback-content';

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
    avatarNodeId,
    sphereColor,
    locationOverlays,
    avatarPixelPos,
    avatarRoute,
    avatarTargetHex,
    debugPanelOpen,
    handleToggleDebug,
  } = useAvatarData({
    graph: gameState.graph,
    ascendantId: gameState.ascendantId,
    archetype,
  });

  // ── Debug: fog-of-war toggle ──
  const [fogDisabled, setFogDisabled] = useState(false);

  // ── View navigation hook ──
  const {
    hoveredHex, setHoveredHex, selectedHex, viewLevel,
    focusedHex, focusedLocationId, moveMode, hexMapRef,
    handleHexClick, handleLocationDoubleClick, handleBackToWorld,
    handleBackToHex, handleLocationClick, handleCenterOnAvatar,
    handleAvatarMoveClick, handleHexClickMove,
  } = useViewNavigation({ gameState, setGameState, avatarPixelPos, tiles, COLS, ROWS, scryState, fogDisabled });

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
    handleAgentDoubleClick,
    handleCloseProfile,
    closeAllAgentOverlays,
  } = useAgentInteraction({
    gameState,
    setGameState,
    archetype,
    onOpenScry: handleOpenScry,
    scryState,
  });

  // When fog is disabled, create a proxy map that returns 'visible' for every key
  const effectiveVisibilityMap = useMemo(() => {
    if (!fogDisabled) return gameState.visibilityMap;
    // Proxy: any .get() call returns { state: 'visible' }, .size returns 1 to avoid "empty map" edge cases
    return new Proxy(new Map() as import('../../types/visibility').VisibilityMap, {
      get(target, prop) {
        if (prop === 'get') return () => ({ state: 'visible' as const });
        if (prop === 'size') return 1;
        return Reflect.get(target, prop);
      },
    });
  }, [fogDisabled, gameState.visibilityMap]);

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
    visibilityMap: effectiveVisibilityMap,
  });

  // ── Keyboard hotkeys ──
  useTopBarHotkeys({
    running,
    speed,
    onToggle: handleToggleRunning,
    onSpeedChange: setSpeed,
    onStep: doTick,
  });

  // ── Essence income (view-layer, pure computation) ──
  const essenceIncome = useMemo(
    () => computeEssenceIncome(gameState.graph, gameState.ascendantId),
    [gameState.graph, gameState.ascendantId, gameState.tick],
  );

  // ── Non-agent target context (hex-zoom and location views) ──
  const [nonAgentDrawerOpen, setNonAgentDrawerOpen] = useState(false);

  // Build a TargetContext for the currently focused hex or location
  const nonAgentTargetContext = useMemo(() => {
    if (viewLevel === 'hex-zoom' && focusedHex) {
      // Use gameState.tiles for live mutable state (divineInfluence, corruption)
      const liveTile = gameState.tiles.find(
        t => t.coord.col === focusedHex.col && t.coord.row === focusedHex.row,
      );
      return buildHexTargetContext({
        col: focusedHex.col,
        row: focusedHex.row,
        terrain: liveTile?.terrain ?? 'plains',
        divineInfluence: liveTile?.divineInfluence,
        corruption: liveTile?.corruption,
      });
    }
    if (viewLevel === 'location' && focusedLocationId) {
      return buildLocationTargetContext(focusedLocationId, gameState.graph);
    }
    return null;
  }, [viewLevel, focusedHex, focusedLocationId, tiles, gameState.graph]);

  // Open non-agent drawer when entering a detail view; close on world return
  useMemo(() => {
    if (viewLevel === 'hex-zoom' || viewLevel === 'location') {
      setNonAgentDrawerOpen(true);
    } else {
      setNonAgentDrawerOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewLevel]);

  const nonAgentSlots = useTargetActions({
    target: nonAgentTargetContext,
    gameState,
    archetype,
    drawerOpen: nonAgentDrawerOpen,
  });

  // Handle target_action slot clicks from non-agent detail views (Phase 5)
  const handleNonAgentSlotClick = useCallback((slotId: string) => {
    if (!nonAgentTargetContext) return;

    const templateId = templateIdFromSlotId(slotId);
    if (!templateId) return;

    const template = getUnifiedTemplateById(templateId);
    if (!template) {
      console.warn(`[targetAction] template not found: ${templateId}`);
      return;
    }

    try {
      const essenceCost = template.essenceCost ?? 0;
      const sphere = template.sphereAffinity ?? archetype.sphereAlignment.primary;

      const rng = mulberry32(gameState.seed + gameState.tick * 43);
      const action = createUnifiedAction({
        actorId: gameState.ascendantId,
        templateId,
        targetId: nonAgentTargetContext.nodeId,
        scale: template.scale,
        source: 'player',
        tick: gameState.tick,
        template,
        rng,
        essencePaid: essenceCost,
      });

      setGameState(prev => {
        const newPool = { ...prev.essencePool };
        if (essenceCost > 0) {
          newPool[sphere] = Math.max(0, (newPool[sphere] ?? 0) - essenceCost);
        }
        return {
          ...prev,
          essencePool: newPool,
          unifiedActions: [...(prev.unifiedActions ?? []), action],
          recentEvents: [
            ...prev.recentEvents.slice(-99),
            {
              id: `evt_target_action_${prev.tick}_${Date.now()}`,
              tick: prev.tick,
              type: 'narrative' as const,
              message: `The Ascendant ${template.narrativeTemplates.initiation}.`,
              significance: 0.5,
              sphere,
              isInterventionBeat: false,
            },
          ],
        };
      });

      // Briefly show the "playing" state then close
      setTimeout(() => {
        setNonAgentDrawerOpen(false);
      }, DIVINE_INFLUENCE_CONSTANTS.DRAWER_CLOSE_DELAY_MS);
    } catch (err) {
      console.warn('[targetAction] failed to create action:', err);
    }
  }, [nonAgentTargetContext, gameState.ascendantId, gameState.seed, gameState.tick, archetype, setGameState]);

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
    hexRegionData,
    focusedLocation,
    focusedLocationAgents,
  } = useHexZoomData({
    graph: gameState.graph,
    ascendantId: gameState.ascendantId,
    focusedHex,
    focusedLocationId,
    tiles,
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

  // ── Encounter vignette modal ──
  const [vignetteEncounter, setVignetteEncounter] = useState<{
    progress: EncounterProgress;
    template: EncounterTemplate;
    agentId: string;
    agentName: string;
  } | null>(null);

  const retinueActiveEncounters = useMemo(() => {
    const map = new Map<string, { progress: EncounterProgress; template: EncounterTemplate }>();
    for (const p of gameState.encounterProgress) {
      if (p.status !== 'active') continue;
      const tmpl = getEncounterById(p.encounterId);
      if (tmpl) map.set(p.actorId, { progress: p, template: tmpl });
    }
    return map;
  }, [gameState.encounterProgress]);

  const handleEncounterClick = useCallback((
    agentId: string,
    progress: EncounterProgress,
    template: EncounterTemplate,
  ) => {
    const agentName = gameState.graph.getNode(agentId)?.name ?? 'Unknown';
    setVignetteEncounter({ progress, template, agentId, agentName });
  }, [gameState.graph]);

  const handleVignetteClose = useCallback(() => {
    setVignetteEncounter(null);
  }, []);

  // IX-013: Wrapped location click/double-click closes drawer before drilling down
  const handleLocationClickWithClose = useCallback((locationId: string) => {
    handleDrawerClose();
    handleLocationClick(locationId);
  }, [handleDrawerClose, handleLocationClick]);

  const handleLocationDoubleClickWithClose = useCallback((locationId: string) => {
    handleDrawerClose();
    handleLocationDoubleClick(locationId);
  }, [handleDrawerClose, handleLocationDoubleClick]);

  return (
    <GameErrorBoundary>
      <div className="h-screen flex flex-col overflow-hidden relative grain" style={{ backgroundColor: 'var(--bg-abyss)' }}>
      {/* ═══ Top bar — Stellaris-style: identity + time + essence ║ doom + mandate + alerts + rivals + debug ═══ */}
      <div
        className="w-full flex items-center relative z-30 flex-shrink-0"
        style={{
          background: 'linear-gradient(180deg, rgba(17,17,20,0.98), rgba(10,10,14,0.95))',
          borderBottom: `1px solid rgba(var(--accent-gold-rgb, 212,175,55), 0.3)`,
          height: 'var(--topbar-height)',
          minHeight: 'var(--topbar-height)',
          paddingLeft: 'var(--topbar-padding-x)',
          paddingRight: 'var(--topbar-padding-x)',
          gap: 'var(--topbar-gap)',
        }}
      >
        {/* LEFT GROUP: identity · time · essence */}
        <div className="flex items-center flex-shrink-0" style={{ gap: 'var(--topbar-gap)' }}>
          {/* Identity chip — avatar name + archetype, click to center */}
          <IdentityChip
            avatarName={avatarName}
            archetypeTitle={archetype.title}
            cycle={gameState.cycle}
            sphereColor={sphereColor}
            primarySphere={archetype.sphereAlignment.primary}
            onClick={handleCenterOnAvatar}
          />

          <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />

          {/* Time controls */}
          <SimulationControls
            tick={gameState.tick}
            season={seasonName}
            year={year}
            running={running}
            speed={speed}
            onToggle={handleToggleRunning}
            onStep={doTick}
            onSpeedChange={setSpeed}
            compact
          />

          <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />

          {/* Essence resource chips */}
          <EssencePanel
            pool={gameState.essencePool}
            maxEssence={maxEssence}
            primarySphere={archetype.sphereAlignment.primary}
            secondarySphere={archetype.sphereAlignment.secondary}
            income={essenceIncome}
            compact
          />
        </div>

        {/* Group divider */}
        <div
          className="w-px self-stretch ml-auto flex-shrink-0"
          style={{ background: 'rgba(212,175,55,0.4)' }}
        />

        {/* RIGHT GROUP: doom · mandate · alerts · rivals · debug */}
        <div
          className="flex items-center flex-shrink-0 rounded"
          style={{
            gap: 'var(--topbar-gap)',
            padding: '0 var(--space-2)',
            backgroundColor: 'rgba(10, 10, 14, 0.4)',
          }}
        >
          <DoomBar definition={gameState.doomDefinition} state={gameState.doomClock} />
          {gameState.mandateDefinition && gameState.mandateState && (
            <>
              <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
              <div style={{ maxWidth: '180px' }}>
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
          <RivalsButton
            definitions={gameState.rivalDefinitions}
            states={gameState.rivalStates}
          />
          <IconButton
            data-testid="fog-toggle"
            icon={<span>{fogDisabled ? '☀' : '🌫'}</span>}
            active={fogDisabled}
            onClick={() => setFogDisabled(v => !v)}
            title="Toggle fog of war (debug)"
            aria-label="Toggle fog of war"
          />
          <IconButton
            data-testid="debug-toggle"
            icon={<span>⚙</span>}
            active={debugPanelOpen}
            onClick={handleToggleDebug}
            title="Toggle debug trace panel (`)"
            aria-label="Toggle debug trace panel"
          />
        </div>
      </div>

      {/* ═══ Main content area ═══ */}
      <div className="flex flex-1 overflow-hidden">
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
                  visibilityMap={fogDisabled ? undefined : gameState.visibilityMap}
                  locationOverlays={locationOverlays}
                  avatarHex={avatarPos ?? undefined}
                  avatarId={avatarNodeId ?? undefined}
                  sphereColor={sphereColor}
                  avatarRoute={avatarRoute ?? undefined}
                  avatarTargetHex={avatarTargetHex ?? undefined}
                  initialCenter={avatarPixelPos ?? undefined}
                  initialScale={3.0}
                  graph={gameState.graph}
                  currentTick={gameState.tick}
                  onHexClick={handleHexClickMove}
                  onHexHover={setHoveredHex}
                  onAgentClick={handleAgentSelect}
                  onAgentDoubleClick={handleAgentDoubleClick}
                />

                <AvatarHUD
                  sphereColor={sphereColor}
                  onMoveClick={handleAvatarMoveClick}
                  onWheelClick={handleAvatarActionClick}
                  onScryClick={handleScryWithMutex}
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
                    regionName={hexRegionData?.regionName}
                    onBack={handleBackToWorld}
                    data-testid="hex-breadcrumb"
                  />
                  <div className="flex-1 flex overflow-hidden">
                    {/* Left: Collapsible stats sidebar */}
                    <HexSidebar
                      terrain={hexTerrain}
                      hexCol={focusedHex.col}
                      hexRow={focusedHex.row}
                      sphereInfluence={hexSphereInfluence}
                      regionData={hexRegionData}
                      locations={hexLocations}
                      agentsByLocation={hexAgentsByLocation}
                      lineOfSight={hexLineOfSight}
                      cultures={hexCultures}
                      factions={hexFactions}
                    />

                    {/* Main: Narrative chronicle */}
                    <HexChronicle
                      terrain={hexTerrain}
                      hexCol={focusedHex.col}
                      hexRow={focusedHex.row}
                      lineOfSight={hexLineOfSight}
                      sphereInfluence={hexSphereInfluence}
                      cultures={hexCultures}
                      factions={hexFactions}
                      locations={hexLocations}
                      agentsByLocation={hexAgentsByLocation}
                      regionData={hexRegionData}
                      onLocationClick={handleLocationClickWithClose}
                      onLocationDoubleClick={handleLocationDoubleClickWithClose}
                      onAgentClick={handleAgentSelect}
                      graph={gameState.graph}
                      seed={gameState.seed}
                    />
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
                onEncounterClick={handleEncounterClick}
                getEncounterTemplate={getEncounterById}
                graph={gameState.graph}
                seed={gameState.seed}
              />
            )}
          </div>

          {/* ActionDrawer overlay — agent (intervention) path */}
          {wheelSlots && drawerOpen && selectedAgentId && (
            <ActionDrawer
              open={drawerOpen}
              slots={wheelSlots}
              targetName={retinueAgents.find(a => a.id === selectedAgentId)?.name ?? ''}
              targetLabel={retinueAgents.find(a => a.id === selectedAgentId)?.tierName ?? ''}
              playingCardId={playingCardId}
              onSlotClick={handleWheelSlotClick}
              onClose={handleDrawerClose}
            />
          )}

          {/* ActionDrawer overlay — non-agent (hex / location) path */}
          {nonAgentSlots && nonAgentSlots.length > 0 && nonAgentDrawerOpen && !selectedAgentId && (
            <ActionDrawer
              open={nonAgentDrawerOpen}
              slots={nonAgentSlots}
              targetName={nonAgentTargetContext?.displayName ?? ''}
              targetLabel={nonAgentTargetContext?.displayLabel ?? ''}
              playingCardId={null}
              onSlotClick={handleNonAgentSlotClick}
              onClose={() => setNonAgentDrawerOpen(false)}
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
                  activeEncounters={retinueActiveEncounters}
                  onEncounterClick={handleEncounterClick}
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
            secondarySphere: archetype.sphereAlignment.secondary,
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
            scrollToNewStrata={agentInfoCard.backstory?.strata.some(s => s.isNew) ?? false}
          />
        )}
      </AnimateMount>

      {/* Encounter vignette modal */}
      {vignetteEncounter && (
        <EncounterVignetteModal
          open={true}
          onClose={handleVignetteClose}
          progress={vignetteEncounter.progress}
          template={vignetteEncounter.template}
          agentName={vignetteEncounter.agentName}
          agentId={vignetteEncounter.agentId}
          graph={gameState.graph}
          ascendantSphere={archetype.sphereAlignment.primary}
          seed={gameState.seed}
        />
      )}

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
