import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { SPHERE_NAMES, type CosmologyProfile } from '../../types';
import type { AscendantArchetype } from '../../types/influence';
import { resumeTheme } from '../../audio/themeAudio';
import type { ScryState } from '../../types/scry';
import { createScryState } from '../../engine/scry';
import { useSimulation } from './hooks/useSimulation';
import type { EncounterProgress, EncounterTemplate } from '../../types/encounter';
import { getEncountersForLocation, getAnyEncounterById } from '../../data/encounter-content';
import { SUBTYPE_SUBLOCATION_MAP } from '../../engine/sublocation';
import { useHexZoomData } from './hooks/useHexZoomData';
import { useAvatarData } from './hooks/useAvatarData';
import { useScry } from './hooks/useScry';
import { useAgentInteraction } from './hooks/useAgentInteraction';
import { useViewNavigation } from './hooks/useViewNavigation';
import { hexToPixel } from '../../lib/hexMath';
export type { ViewLevel } from './hooks/useViewNavigation';

import { GameErrorBoundary } from '../shared/GameErrorBoundary';
import { IconButton } from '../shared/IconButton';
import { AnimateMount } from '../shared/AnimateMount';
import HexMapV2 from '../HexMapV2/HexMapV2';
import type { AgentRenderData } from '../HexMapV2/agents/agentSpriteTypes';
import { FACTION_HERALDIC_COLORS } from '../HexMapV2/agents/agentSpriteTypes';
import type { LocationNode } from '../HexMapV2/scene/LocationIconMesh';
import type { ArmyRenderData } from '../HexMapV2/scene/ArmySpriteMesh';
import { ARMY_SIZE_SMALL_MAX } from '../HexMapV2/scene/ArmySpriteMesh';
import type { BattleRenderData } from '../HexMapV2/scene/BattleIndicatorMesh';
import type { SiegeRenderData } from '../HexMapV2/scene/SiegeIndicatorMesh';
import type { ArmyState } from '../../types/army';
import type { BattleState } from '../../types/battle';
import { extractRoadPaths } from '../../engine/roadNetwork';
import { getRetinueAgents } from '../../engine/retinue';
import { getPortraitUrl } from '../../data/portrait-assets';
import { getAvatarPortraitUrl } from '../../data/avatar-portrait-assets';
import { HEX_CONSTANTS } from '../HexMapV2/scene/HexFillMesh';
import { EssencePanel } from './EssencePanel';
import { SimulationControls } from './SimulationControls';
import { DoomBar } from './DoomBar';
import { DoomClockDetail } from './DoomClockDetail';
import { MandateDetail } from './MandateDetail';
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
import { getEncounterCacheManager } from '../../engine/orchestrator';
import { AvatarHUD } from './AvatarHUD';
import { WorldPulse } from './WorldPulse';
import { ToastStack } from './ToastStack';
import { AlertBar } from './AlertBar';
import { useNotificationNavigation } from './hooks/useNotificationNavigation';
import { useNotificationPreferences } from './hooks/useNotificationPreferences';
import { RivalsButton } from './RivalsButton';
import { IdentityChip } from './IdentityChip';
import { AscendantSheet } from './AscendantSheet';
import { EventPopup } from './EventPopup';
import { SettingsPanel } from './SettingsPanel';
import { TieredEncounterModal, courtPositionToThreadTier } from './TieredEncounterModal';
import { MeetingEncounterModal } from './MeetingEncounterModal';
import { JourneyVignetteModal } from './JourneyVignetteModal';
import type { MeetingEncounterState, MeetingEncounterResult } from '../../types/meetingEncounter';
import type { JourneyVignetteData, PendingVignette } from '../../types/journeyEngine';
import { applyBeatChoice } from '../../engine/journeyEngine';
import { getThreadsFrom } from '../../engine/graphQueries';
import type { ThreadEdgeProperties } from '../../types/influence';
import { createMeetingEncounterState, createAgentFromMeeting, isMeetTheFirstAvailable } from '../../engine/meetingEncounter';
import { useNotifications } from './hooks/useNotifications';
import { useEncounterNotifications } from './hooks/useEncounterNotifications';
import { toggleAttentionMode } from '../../engine/encounterVisibility';
import { useTopBarHotkeys } from './hooks/useTopBarHotkeys';
import { computeEssenceIncome } from '../../engine/essenceIncome';
import { buildHexTargetContext, buildLocationTargetContext } from '../../engine/targetContextBuilders';
import { useTargetActions } from './hooks/useTargetActions';
import { templateIdFromSlotId } from '../../engine/targetActions';
import type { WheelSlot } from '../../engine/wheel';
import { getUnifiedTemplateById } from '../../data/unified-action-templates';
import { createUnifiedAction } from '../../engine/unifiedActionLifecycle';
import { mulberry32 } from '../../lib/prng';
import { DIVINE_INFLUENCE_CONSTANTS } from '../../data/intervention-feedback-content';
import { WorldSoulIndicator } from '../WorldSoulIndicator';

interface GameViewProps {
  archetype: AscendantArchetype;
  avatarName: string;
  cosmology: CosmologyProfile;
  seed: number;
  mapSize?: import('../../engine/gameInit').MapSizePreset;
}

export function GameView({ archetype, avatarName, cosmology, seed, mapSize }: GameViewProps) {
  // ── Resume theme music if it was started on the start screen ──
  useEffect(() => {
    resumeTheme();
  }, []);

  // ── Scry state (lifted here so simulation + navigation can use it for LOS) ──
  const [scryState, setScryState] = useState<ScryState>(createScryState);

  // ── Use simulation hook ──
  const {
    gameState, setGameState, tiles, riverPaths, lakeIds, regionData,
    running, speed, harvestResult, doTick, handleBeginNextCycle,
    handleToggleRunning, setRunning, setSpeed, seasonName, year, maxEssence, COLS, ROWS,
  } = useSimulation({ archetype, avatarName, cosmology, seed, scryState, mapSize });

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
  const [fogDisabled, setFogDisabled] = useState(
    () => !new URLSearchParams(window.location.search).has('fog')
  );

  // ── Debug: organic shore toggle ──
  const [showOrganicShore, setShowOrganicShore] = useState(false);

  // ── Settings panel state ──
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);

  // ── Ascendant sheet modal state ──
  const [ascendantSheetOpen, setAscendantSheetOpen] = useState(false);

  // ── Doom clock and mandate detail modals ──
  const [doomDetailOpen, setDoomDetailOpen] = useState(false);
  const [mandateDetailOpen, setMandateDetailOpen] = useState(false);

  // ── View navigation hook ──
  const {
    hoveredHex, setHoveredHex, selectedHex, viewLevel,
    focusedHex, focusedLocationId, moveMode, hexMapRef,
    handleHexClick, handleBackToWorld,
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

  // ── Agent render data adapter (graph → AgentRenderData[]) ──
  const agentRenderData = useMemo<AgentRenderData[]>(() => {
    const retinueIds = new Set(
      getRetinueAgents(gameState.graph, gameState.ascendantId).map(r => r.agentId)
    );
    const actors = gameState.graph.getNodesByType('actor');
    const result: AgentRenderData[] = [];
    for (let i = 0; i < actors.length; i++) {
      const n = actors[i];
      // Skip ascendant nodes — they are divine entities, not map actors
      if (n.properties.actorType === 'ascendant') continue;
      // Resolve hex position: check actor properties first, then follow located_at edge
      let hexCol = n.properties.hexCol as number | undefined;
      let hexRow = n.properties.hexRow as number | undefined;
      if (hexCol == null || hexRow == null) {
        // Agents store their location as a located_at edge, not a property
        const locEdges = gameState.graph.getOutgoingEdges(n.id, 'located_at');
        const locationId = locEdges.length > 0 ? locEdges[0].target : undefined;
        if (locationId) {
          const loc = gameState.graph.getNode(locationId);
          if (loc) {
            hexCol = loc.properties.hexCol as number | undefined;
            hexRow = loc.properties.hexRow as number | undefined;
          }
        }
      }
      if (hexCol == null || hexRow == null) continue;

      // Road traversal: use currentHexPosition for visual position if on a road
      const movState = n.properties.movementState as
        | { currentHexPosition?: { col: number; row: number }; currentRoadType?: string; roadHexQueue?: unknown[] }
        | undefined;
      if (movState?.currentHexPosition) {
        hexCol = movState.currentHexPosition.col;
        hexRow = movState.currentHexPosition.row;
      }

      const isAvatar = n.id === avatarNodeId;
      const archetypeId = n.properties.narrativeArchetype as string | undefined;
      result.push({
        id: n.id,
        hexCol,
        hexRow,
        portraitUrl: isAvatar
          ? getAvatarPortraitUrl(archetype.sphereAlignment.primary)
          : (getPortraitUrl(archetypeId) ?? undefined),
        factionIndex: i % 6,
        isRetinue: retinueIds.has(n.id),
        isAvatar,
        avatarSphereColor: isAvatar ? sphereColor : undefined,
        name: n.name,
        currentRoadType: movState?.currentRoadType as 'major' | 'trail' | undefined,
        roadHexQueueLength: Array.isArray(movState?.roadHexQueue) ? movState.roadHexQueue.length : undefined,
      });
    }
    return result;
  }, [gameState.graph, gameState.ascendantId, gameState.tick, avatarNodeId, sphereColor, archetype.sphereAlignment.primary]);

  // ── Location render data adapter (graph → LocationNode[]) ──
  const locationNodes = useMemo<LocationNode[]>(() => {
    return gameState.graph.getNodesByType('location')
      .filter(n => n.properties.hexCol != null && n.properties.hexRow != null)
      .filter(n => !n.properties.sublocationTypeId) // Exclude sublocations — they share parent hex coords
      .map(n => ({
        locationType: (n.properties.locationSubtype ?? n.properties.locationType ?? 'unexplored_poi') as string,
        hexCol: n.properties.hexCol as number,
        hexRow: n.properties.hexRow as number,
        name: n.name,
        isCapital: n.properties.locationType === 'capital' || n.properties.locationSubtype === 'capital',
      }));
  }, [gameState.graph]);

  const roadPaths = useMemo(() => extractRoadPaths(gameState.graph), [gameState.graph]);

  // ── Military render data adapters (graph → ArmyRenderData[], BattleRenderData[], SiegeRenderData[]) ──
  // Plan 13-04: Extract army, battle, and siege state from actor nodes for HexMapV2 rendering.
  // Armies are actor nodes with armyState property. Battles are actor nodes with battleState property.
  // NFP #4: Missing/invalid data is silently skipped — never crashes.
  const armyRenderData = useMemo<ArmyRenderData[]>(() => {
    const actors = gameState.graph.getNodesByType('actor');
    const result: ArmyRenderData[] = [];
    for (const node of actors) {
      const armyState = node.properties.armyState as ArmyState | undefined;
      if (armyState == null) continue;

      // Armies store their location via properties or located_at edge
      let hexCol = node.properties.hexCol as number | undefined;
      let hexRow = node.properties.hexRow as number | undefined;
      if (hexCol == null || hexRow == null) {
        const locEdges = gameState.graph.getOutgoingEdges(node.id, 'located_at');
        if (locEdges.length > 0) {
          const loc = gameState.graph.getNode(locEdges[0].target);
          hexCol = loc?.properties.hexCol as number | undefined;
          hexRow = loc?.properties.hexRow as number | undefined;
        }
      }
      if (hexCol == null || hexRow == null) continue;

      // Faction color via member_of edge → faction node index in actors list
      const memberEdges = gameState.graph.getOutgoingEdges(node.id, 'member_of');
      const factionId = memberEdges.length > 0 ? memberEdges[0].target : undefined;
      const factionNodes = gameState.graph.getNodesByType('faction');
      const factionIdx = factionId ? factionNodes.findIndex(f => f.id === factionId) : 0;
      const factionColor = FACTION_HERALDIC_COLORS[Math.max(0, factionIdx) % FACTION_HERALDIC_COLORS.length];

      // Headcount → size number for scale tiers
      const headcount = armyState.headcount ?? ARMY_SIZE_SMALL_MAX;

      result.push({
        armyId: node.id,
        hexCol,
        hexRow,
        factionColor,
        armySize: headcount,
        isInBattle: node.properties.battleState != null,
      });
    }
    return result;
  }, [gameState.graph, gameState.tick]);

  const battleRenderData = useMemo<BattleRenderData[]>(() => {
    const actors = gameState.graph.getNodesByType('actor');
    const result: BattleRenderData[] = [];
    for (const node of actors) {
      const battleState = node.properties.battleState as BattleState | undefined;
      if (battleState == null) continue;

      let hexCol = node.properties.hexCol as number | undefined;
      let hexRow = node.properties.hexRow as number | undefined;
      if (hexCol == null || hexRow == null) continue;

      result.push({ battleNodeId: node.id, hexCol, hexRow });
    }
    return result;
  }, [gameState.graph, gameState.tick]);

  const siegeRenderData = useMemo<SiegeRenderData[]>(() => {
    const actors = gameState.graph.getNodesByType('actor');
    const result: SiegeRenderData[] = [];
    for (const node of actors) {
      const battleState = node.properties.battleState as BattleState | undefined;
      if (battleState?.battleType !== 'siege' || !battleState.settlementId) continue;

      const settlementNode = gameState.graph.getNode(battleState.settlementId);
      const sCol = settlementNode?.properties.hexCol as number | undefined;
      const sRow = settlementNode?.properties.hexRow as number | undefined;
      if (sCol == null || sRow == null) continue;

      // Attacker faction color
      const attackerNode = gameState.graph.getNode(battleState.attackerArmyId);
      const memberEdges = attackerNode ? gameState.graph.getOutgoingEdges(attackerNode.id, 'member_of') : [];
      const factionId = memberEdges.length > 0 ? memberEdges[0].target : undefined;
      const factionNodes = gameState.graph.getNodesByType('faction');
      const factionIdx = factionId ? factionNodes.findIndex(f => f.id === factionId) : 0;
      const factionColor = FACTION_HERALDIC_COLORS[Math.max(0, factionIdx) % FACTION_HERALDIC_COLORS.length];

      result.push({
        siegeNodeId: node.id,
        settlementHexCol: sCol,
        settlementHexRow: sRow,
        factionColor,
      });
    }
    return result;
  }, [gameState.graph, gameState.tick]);

  // ── Notification preferences hook ──
  const {
    preferences: notificationPrefs,
    toggleCategory: toggleNotifCategory,
    setMode: setNotifMode,
    resetToDefaults: resetNotifPrefs,
  } = useNotificationPreferences();

  // ── Notification navigation hook ──
  const handleNotificationNavigate = useNotificationNavigation({
    onSelectAgent: handleAgentSelect,
    onFocusHex: () => { /* TODO: hex camera focus not yet implemented */ },
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
    visibilityMap: effectiveVisibilityMap,
    preferences: notificationPrefs,
  });

  // ── Tiered encounter modal (TB-055) ──
  const [tieredEncounterState, setTieredEncounterState] = useState<{
    notification: EncounterNotification;
    progress: EncounterProgress;
    template: EncounterTemplate;
    agentId: string;
    agentName: string;
    threadTier: ReturnType<typeof courtPositionToThreadTier>;
  } | null>(null);

  // ── Encounter notification surfacing (TB-040 / TB-055) ──
  /** Open the tiered encounter modal from a notification (toast click or auto-interrupt) */
  const handleOpenEncounterFromNotification = useCallback((notif: EncounterNotification) => {
    const progress = gameState.encounterProgress.find(
      p => p.actorId === notif.agentId && p.encounterId === notif.encounterId && p.status === 'active',
    );
    if (!progress) return;
    const template = getAnyEncounterById(notif.encounterId);
    if (!template) return;
    const threadTier = courtPositionToThreadTier(notif.courtPosition);
    setTieredEncounterState({
      notification: notif,
      progress,
      template,
      agentId: notif.agentId,
      agentName: notif.agentName,
      threadTier,
    });
  }, [gameState.encounterProgress]);

  const encounterToasts = useEncounterNotifications({
    encounterNotifications: gameState.encounterNotifications,
    setGameState,
    onOpenEncounter: handleOpenEncounterFromNotification,
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
    () => computeEssenceIncome(gameState.graph, gameState.ascendantId, gameState.controlEffects),
    [gameState.graph, gameState.ascendantId, gameState.tick, gameState.controlEffects],
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
    fogDisabled,
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

    // Get available encounters for this location type + its sublocation types
    const sublocationTypeIds = (SUBTYPE_SUBLOCATION_MAP[subtype] ?? []).map(d => d.id);
    const available = subtype ? getEncountersForLocation(subtype, sublocationTypeIds) : [];

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

  // NFP #1: Named constant for retinue eye-icon zoom level.
  // Maximum zoom — agent eye icon zooms in tight to the agent's hex.
  const RETINUE_EYE_ZOOM_SCALE = 20;

  // Eye icon next to agent name: zoom camera to agent's hex at max zoom
  const handleCenterOnHex = useCallback((locationId: string) => {
    const locNode = gameState.graph.getNode(locationId);
    if (!locNode) return;
    const props = (locNode.properties ?? {}) as Record<string, unknown>;
    const col = typeof props.hexCol === 'number' ? props.hexCol : undefined;
    const row = typeof props.hexRow === 'number' ? props.hexRow : undefined;
    if (col !== undefined && row !== undefined && hexMapRef.current) {
      const px = hexToPixel({ col, row }, HEX_CONSTANTS.HEX_SIZE);
      // Y-flip: hexToPixel returns SVG y-down, Three.js camera uses y-up
      hexMapRef.current.centerOn(px.x, -px.y, RETINUE_EYE_ZOOM_SCALE);
    }
  }, [gameState.graph, hexMapRef]);

  // Eye icon next to location name: navigate to the location detail view
  const handleZoomToLocation = useCallback((locationId: string) => {
    handleLocationClick(locationId);
  }, [handleLocationClick]);

  const retinueActiveEncounters = useMemo(() => {
    const map = new Map<string, { progress: EncounterProgress; template: EncounterTemplate }>();
    for (const p of gameState.encounterProgress) {
      if (p.status !== 'active') continue;
      const tmpl = getAnyEncounterById(p.encounterId);
      if (tmpl) map.set(p.actorId, { progress: p, template: tmpl });
    }
    return map;
  }, [gameState.encounterProgress]);

  /** Open the tiered encounter modal from RetinuePanel or EncounterLog click */
  const handleEncounterClick = useCallback((
    agentId: string,
    progress: EncounterProgress,
    template: EncounterTemplate,
  ) => {
    // Look up the notification for this encounter to get court position + choices
    const notif = (gameState.encounterNotifications ?? []).find(
      n => n.agentId === agentId && n.encounterId === progress.encounterId && !n.resolved,
    );
    // Build a synthetic notification if none exists (e.g., for non-threaded agents)
    const notification: EncounterNotification = notif ?? {
      id: `synthetic-${agentId}-${progress.encounterId}`,
      agentId,
      agentName: gameState.graph.getNode(agentId)?.name ?? 'Unknown',
      courtPosition: null,
      encounterId: progress.encounterId,
      encounterName: template.name,
      prose: template.steps[progress.currentEncounterIndex]?.narrative ?? '',
      choices: [],
      createdTick: progress.startedTick,
      autoResolveTick: null,
      viewed: true,
      resolved: false,
    };
    const threadTier = courtPositionToThreadTier(notification.courtPosition);
    setTieredEncounterState({
      notification,
      progress,
      template,
      agentId,
      agentName: notification.agentName,
      threadTier,
    });
  }, [gameState.graph, gameState.encounterNotifications]);

  const handleEncounterClose = useCallback(() => {
    setTieredEncounterState(null);
    if (wasRunningBeforeEncounterPause.current) {
      wasRunningBeforeEncounterPause.current = false;
      setRunning(true);
    }
  }, [setRunning]);

  /** Intervention handler — player chose an intervention for the current encounter step */
  const handleEncounterIntervene = useCallback((choiceId: string, essenceSpent: number) => {
    if (!tieredEncounterState) return;
    const { notification, agentId } = tieredEncounterState;
    const choice = notification.choices.find(c => c.id === choiceId);
    if (!choice) return;

    // Deduct essence from primary sphere
    if (essenceSpent > 0) {
      setGameState(prev => {
        const newPool = { ...prev.essencePool };
        newPool[archetype.sphereAlignment.primary] = Math.max(0, newPool[archetype.sphereAlignment.primary] - essenceSpent);
        return { ...prev, essencePool: newPool };
      });
    }

    // Mark notification as resolved
    setGameState(prev => ({
      ...prev,
      encounterNotifications: (prev.encounterNotifications ?? []).map(n =>
        n.id === notification.id ? { ...n, resolved: true } : n,
      ),
    }));

    // Emit trace
    console.debug('[TieredEncounterModal] Intervention:', {
      agentId,
      encounterId: notification.encounterId,
      choiceId,
      essenceSpent,
      interventionType: choice.interventionType,
      probabilityBoost: choice.probabilityBoost,
    });
  }, [tieredEncounterState, setGameState, archetype.sphereAlignment.primary]);

  /** Boost handler — Watched tier essence boost */
  const handleEncounterBoost = useCallback((essenceSpent: number) => {
    if (!tieredEncounterState || essenceSpent <= 0) return;

    setGameState(prev => {
      const newPool = { ...prev.essencePool };
      newPool[archetype.sphereAlignment.primary] = Math.max(0, newPool[archetype.sphereAlignment.primary] - essenceSpent);
      return { ...prev, essencePool: newPool };
    });

    // Mark notification as resolved
    setGameState(prev => ({
      ...prev,
      encounterNotifications: (prev.encounterNotifications ?? []).map(n =>
        n.id === tieredEncounterState.notification.id ? { ...n, resolved: true } : n,
      ),
    }));
  }, [tieredEncounterState, setGameState, archetype.sphereAlignment.primary]);

  /** Peek handler — Watched tier peek gate (costs 1 essence) */
  const handleEncounterPeek = useCallback(() => {
    setGameState(prev => {
      const newPool = { ...prev.essencePool };
      newPool[archetype.sphereAlignment.primary] = Math.max(0, newPool[archetype.sphereAlignment.primary] - 1);
      return { ...prev, essencePool: newPool };
    });
  }, [setGameState, archetype.sphereAlignment.primary]);

  // Auto-interrupt for all encounter notifications (not just the_first)
  // Pause is handled by the general encounterModalOpen useEffect below
  useEffect(() => {
    const notifications = gameState.encounterNotifications ?? [];
    for (const notif of notifications) {
      if (notif.viewed || notif.resolved) continue;
      // Auto-open — all encounters auto-interrupt regardless of court position
      handleOpenEncounterFromNotification(notif);
      break; // Only one auto-interrupt at a time
    }
  }, [gameState.encounterNotifications, handleOpenEncounterFromNotification]);

  // ── Meeting encounter (Meet The First) ──
  const [meetingState, setMeetingState] = useState<MeetingEncounterState | null>(null);

  // ── Auto-pause when encounter modal opens, auto-resume on close ──
  /** Tracks whether the game was running before an encounter modal opened */
  const wasRunningBeforeEncounterPause = useRef<boolean>(false);
  const encounterModalOpen = tieredEncounterState !== null || meetingState !== null;

  useEffect(() => {
    if (encounterModalOpen && running) {
      wasRunningBeforeEncounterPause.current = true;
      setRunning(false);
    }
  }, [encounterModalOpen, running, setRunning]);

  const handleStartMeeting = useCallback((locationId: string) => {
    if (!isMeetTheFirstAvailable(gameState.graph, gameState.ascendantId, gameState.tick)) return;
    const state = createMeetingEncounterState(locationId, gameState.ascendantId, gameState.tick);
    setMeetingState(state);
  }, [gameState.graph, gameState.ascendantId, gameState.tick]);

  const handleMeetingComplete = useCallback((result: MeetingEncounterResult) => {
    const agentId = createAgentFromMeeting(gameState.graph, result, gameState.ascendantId, gameState.tick);
    setMeetingState(null);

    // Update familiarity map for the new agent
    setGameState(prev => {
      const newFamiliarityMap = new Map(prev.familiarityMap);
      newFamiliarityMap.set(agentId, 0.5); // Start with high familiarity (we created them)
      return {
        ...prev,
        familiarityMap: newFamiliarityMap,
        recentEvents: [
          ...prev.recentEvents.slice(-99),
          {
            id: `evt_meet_first_${prev.tick}_${Date.now()}`,
            tick: prev.tick,
            type: 'narrative' as const,
            message: `The thread of fate is woven. ${result.name} has been claimed as The First.`,
            significance: 1.0,
            sphere: archetype.sphereAlignment.primary,
          },
        ],
      };
    });
  }, [gameState.graph, gameState.ascendantId, gameState.tick, setGameState, archetype.sphereAlignment.primary]);

  const handleMeetingClose = useCallback(() => {
    setMeetingState(null);
    if (wasRunningBeforeEncounterPause.current) {
      wasRunningBeforeEncounterPause.current = false;
      setRunning(true);
    }
  }, [setRunning]);

  // ── Meet The First as action card slot ──
  const MEET_THE_FIRST_SLOT_ID = 'meet_the_first';

  const meetTheFirstAvailable = useMemo(() =>
    isMeetTheFirstAvailable(gameState.graph, gameState.ascendantId, gameState.tick),
  [gameState.graph, gameState.ascendantId, gameState.tick]);

  // Inject Meet The First card into non-agent slots when on a location view
  const enrichedNonAgentSlots = useMemo(() => {
    const base = nonAgentSlots ?? [];
    if (viewLevel !== 'location' || !meetTheFirstAvailable || !focusedLocation) return base;
    if (focusedLocationAgents.length === 0) return base;
    const meetSlot: WheelSlot = {
      id: MEET_THE_FIRST_SLOT_ID,
      label: 'Meet The First',
      type: 'intervention',
      angleDeg: 0,
      available: true,
      lockedReason: null,
      essenceCost: 0,
      detectionRisk: 0,
      sphere: archetype.sphereAlignment.primary,
      interventionType: null,
      rangeStatus: 'unlimited',
      hexDistance: null,
      description: 'Claim a mortal as your champion — The First to carry your will.',
    };
    return [meetSlot, ...base];
  }, [nonAgentSlots, viewLevel, meetTheFirstAvailable, focusedLocation, focusedLocationAgents, archetype.sphereAlignment.primary]);

  const handleNonAgentSlotClick = useCallback((slotId: string) => {
    if (slotId === MEET_THE_FIRST_SLOT_ID) {
      if (focusedLocation) {
        handleStartMeeting(focusedLocation.id);
      }
      return;
    }

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

      setTimeout(() => {
        setNonAgentDrawerOpen(false);
      }, DIVINE_INFLUENCE_CONSTANTS.DRAWER_CLOSE_DELAY_MS);
    } catch (err) {
      console.warn('[targetAction] failed to create action:', err);
    }
  }, [nonAgentTargetContext, gameState.ascendantId, gameState.seed, gameState.tick, archetype, setGameState, focusedLocation, handleStartMeeting]);

  // ── Attention mode toggle (TB-040) ──
  const handleToggleAttentionMode = useCallback((threadEdgeId: string) => {
    const result = toggleAttentionMode(
      gameState.graph, threadEdgeId, gameState.ascendantId, gameState.tick,
    );
    if (result) {
      // Deduct essence cost
      setGameState(prev => ({
        ...prev,
        essence: Math.max(0, (prev.essence ?? 0) - result.essenceCost),
      }));
    }
  }, [gameState.graph, gameState.ascendantId, gameState.tick, setGameState]);

  // ── Journey vignette (auto-interrupt for The First) ──
  const activeVignette: PendingVignette | null = useMemo(() => {
    const pending = gameState.pendingVignettes;
    if (!pending || pending.length === 0) return null;
    // Highest priority first (already sorted by engine)
    return pending[0];
  }, [gameState.pendingVignettes]);

  // Auto-pause simulation when a vignette is pending
  useEffect(() => {
    if (activeVignette && running) {
      setRunning(false);
    }
  }, [activeVignette, running, setRunning]);

  const handleJourneyChoice = useCallback((choiceId: string) => {
    if (!activeVignette) return;
    const vignetteData = activeVignette.data;

    // Find the thread edge for this agent
    const threads = getThreadsFrom(gameState.graph, gameState.ascendantId);
    const threadEdge = threads.find(e => e.target === vignetteData.agentId);
    if (!threadEdge) return;

    const threadProps = threadEdge.properties as ThreadEdgeProperties;

    // Apply beat choice — updates thread edge properties + records outcome
    const { updatedProps } = applyBeatChoice(threadProps, vignetteData, choiceId);

    // Update the thread edge in the graph
    gameState.graph.updateEdge(threadEdge.id, { properties: updatedProps });

    // Remove this vignette from the queue
    setGameState(prev => ({
      ...prev,
      pendingVignettes: (prev.pendingVignettes ?? []).filter(v => v.id !== activeVignette.id),
    }));
  }, [activeVignette, gameState.graph, gameState.ascendantId, setGameState]);

  // IX-013: Wrapped location click closes drawer before drilling down
  const handleLocationClickWithClose = useCallback((locationId: string) => {
    handleDrawerClose();
    handleLocationClick(locationId);
  }, [handleDrawerClose, handleLocationClick]);

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
        <div className="flex items-center flex-1 min-w-0" style={{ gap: 'var(--topbar-gap)' }}>
          {/* Identity chip — avatar name + archetype, click to open sheet */}
          <IdentityChip
            avatarName={avatarName}
            archetypeTitle={archetype.title}
            cycle={gameState.cycle}
            sphereColor={sphereColor}
            primarySphere={archetype.sphereAlignment.primary}
            onClick={() => setAscendantSheetOpen(true)}
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

          {/* WorldSoulIndicator — prose description of dominant sphere */}
          {gameState.worldSoul?.aggregate && (
            <>
              <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
              <WorldSoulIndicator aggregate={gameState.worldSoul.aggregate} />
            </>
          )}
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
          <div
            role="button" tabIndex={0}
            onClick={() => setDoomDetailOpen(true)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDoomDetailOpen(true); } }}
            className="cursor-pointer"
            style={{ minWidth: '140px' }}
            aria-label="View doom clock details"
          >
            <DoomBar definition={gameState.doomDefinition} state={gameState.doomClock} />
          </div>
          {gameState.mandateDefinition && gameState.mandateState && (
            <>
              <div className="w-px self-stretch" style={{ background: 'var(--border-subtle)' }} />
              <div
                style={{ maxWidth: '180px', minWidth: 0, overflow: 'hidden', cursor: 'pointer' }}
                role="button" tabIndex={0}
                onClick={() => setMandateDetailOpen(true)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setMandateDetailOpen(true); } }}
                aria-label="View mandate details"
              >
                <div style={{ pointerEvents: 'none' }}>
                  <MandateTracker
                    definition={gameState.mandateDefinition}
                    state={gameState.mandateState}
                  />
                </div>
              </div>
            </>
          )}
          <AlertBar
            alerts={notificationState.alerts}
            onDismiss={handleDismissAlert}
            onSelectAgent={handleAgentSelect}
            onNavigate={handleNotificationNavigate}
          />
          <RivalsButton
            definitions={gameState.rivalDefinitions}
            states={gameState.rivalStates}
          />
          <div className="flex items-center gap-1" style={{ position: 'relative' }}>
            <IconButton
              data-testid="settings-toggle"
              icon={<span>⚙</span>}
              active={settingsPanelOpen}
              onClick={() => setSettingsPanelOpen(v => !v)}
              title="Settings"
              aria-label="Settings"
            />
            <SettingsPanel
              open={settingsPanelOpen}
              onClose={() => setSettingsPanelOpen(false)}
              fogDisabled={fogDisabled}
              onToggleFog={() => setFogDisabled(v => !v)}
              debugPanelOpen={debugPanelOpen}
              onToggleDebug={handleToggleDebug}
              showOrganicShore={showOrganicShore}
              onToggleOrganicShore={() => setShowOrganicShore(v => !v)}
              notificationPrefs={notificationPrefs}
              onToggleNotificationCategory={toggleNotifCategory}
              onSetNotificationMode={setNotifMode}
              onResetNotificationPrefs={resetNotifPrefs}
            />
          </div>
        </div>
      </div>

      {/* ═══ Main content area ═══ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Center: map / hex zoom / location ── */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="flex-1 overflow-hidden relative">
            {/* NarrativeLog overlay */}
            <NarrativeLog events={gameState.recentEvents} />
            {/* Toast notifications */}
            <ToastStack
              toasts={[...notificationState.toasts, ...encounterToasts]}
              onDismiss={handleDismissToast}
              onSelectAgent={handleAgentSelect}
              onNavigate={handleNotificationNavigate}
            />
            {viewLevel === 'world' && (
              <>
                <HexMapV2
                  ref={hexMapRef}
                  tiles={tiles}
                  cols={COLS}
                  rows={ROWS}
                  seed={gameState.seed}
                  hoveredHex={hoveredHex}
                  selectedHex={selectedHex}
                  riverPaths={riverPaths}
                  lakeIds={lakeIds}
                  regionData={regionData}
                  locations={locationNodes}
                  roadPaths={roadPaths}
                  agents={agentRenderData}
                  armies={armyRenderData}
                  battles={battleRenderData}
                  sieges={siegeRenderData}
                  visibilityMap={fogDisabled ? undefined : effectiveVisibilityMap}
                  fogEnabled={!fogDisabled}
                  showOrganicShore={showOrganicShore}
                  overlayOpen={scryVisible || harvestResult !== null}
                  onHexClick={handleHexClickMove}
                  onHexHover={setHoveredHex}
                />

                <AvatarHUD
                  sphereColor={sphereColor}
                  onCenterOnAvatar={handleCenterOnAvatar}
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
                      onAgentClick={handleAgentSelect}
                      graph={gameState.graph}
                      seed={gameState.seed}
                      controlEffects={(gameState.controlEffects ?? []).filter(
                        e => e.active && e.targetHexCol === focusedHex.col && e.targetHexRow === focusedHex.row
                      )}
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
                getEncounterTemplate={getAnyEncounterById}
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
          {enrichedNonAgentSlots && enrichedNonAgentSlots.length > 0 && nonAgentDrawerOpen && !selectedAgentId && (
            <ActionDrawer
              open={nonAgentDrawerOpen}
              slots={enrichedNonAgentSlots}
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
            graph={gameState.graph}
            retinueAgents={retinueAgents}
            cacheEntries={getEncounterCacheManager()?.getAllEntries()}
            encounterProgress={gameState.encounterProgress}
            onZoomToLocation={handleZoomToLocation}
            getWebGLDiagnostics={() => hexMapRef.current?.getDiagnostics() ?? null}
            getZoomLevel={() => hexMapRef.current?.getZoomLevel() ?? 1.5}
            showOrganicShore={showOrganicShore}
            onToggleOrganicShore={setShowOrganicShore}
            encounterNotifications={gameState.encounterNotifications}
            pendingVignettes={gameState.pendingVignettes}
            seed={gameState.seed}
            sphereAggregate={gameState.worldSoul?.aggregate}
            agentKnowledge={gameState.agentKnowledge}
          />
        ) : (
          <div
            data-testid="right-sidebar"
            className="flex-shrink-0 overflow-y-auto"
            style={{
              width: 'var(--sidebar-width)',
              background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))',
              borderLeft: '1px solid var(--border-gold)',
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
                  onCenterOnHex={handleCenterOnHex}
                  onZoomToLocation={handleZoomToLocation}
                  activeEncounters={retinueActiveEncounters}
                  onEncounterClick={handleEncounterClick}
                  onToggleAttentionMode={handleToggleAttentionMode}
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
            knowledge={profileModalAgentId ? gameState.agentKnowledge.get(profileModalAgentId) : undefined}
          />
        )}
      </AnimateMount>

      {/* Tiered encounter modal (TB-055) */}
      {tieredEncounterState && (
        <TieredEncounterModal
          open={true}
          onClose={handleEncounterClose}
          notification={tieredEncounterState.notification}
          progress={tieredEncounterState.progress}
          template={tieredEncounterState.template}
          agentName={tieredEncounterState.agentName}
          agentId={tieredEncounterState.agentId}
          graph={gameState.graph}
          threadTier={tieredEncounterState.threadTier}
          essence={SPHERE_NAMES.reduce((sum, s) => sum + gameState.essencePool[s], 0)}
          tick={gameState.tick}
          onIntervene={handleEncounterIntervene}
          onBoost={handleEncounterBoost}
          onPeek={handleEncounterPeek}
        />
      )}

      {/* Meeting encounter modal */}
      {meetingState && (
        <MeetingEncounterModal
          open={true}
          onClose={handleMeetingClose}
          onComplete={handleMeetingComplete}
          state={meetingState}
          onStateChange={setMeetingState}
          graph={gameState.graph}
          ascendantId={gameState.ascendantId}
          ascendantSphere={archetype.sphereAlignment.primary}
          ascendantSecondSphere={archetype.sphereAlignment.secondary}
          locationId={meetingState.locationId}
          locationCultureId={(gameState.graph.getNode(meetingState.locationId)?.properties.cultureId as string) ?? 'default'}
          locationSubtype={(gameState.graph.getNode(meetingState.locationId)?.properties.locationSubtype as string) ?? 'village'}
          seed={gameState.seed}
          tick={gameState.tick}
        />
      )}

      {/* Journey vignette modal (auto-interrupt for The First) */}
      {activeVignette && (
        <JourneyVignetteModal
          open={true}
          onClose={() => {
            // Dismissing = step back choice (withdrawn)
            const fallbackChoice = activeVignette.data.choices.find(c => c.effects.interventionType === 'withdrawn');
            if (fallbackChoice) {
              handleJourneyChoice(fallbackChoice.id);
            } else {
              // No withdrawn choice available — just dismiss
              setGameState(prev => ({
                ...prev,
                pendingVignettes: (prev.pendingVignettes ?? []).filter(v => v.id !== activeVignette.id),
              }));
            }
          }}
          onChoice={handleJourneyChoice}
          vignette={activeVignette.data}
        />
      )}

      {/* Ascendant Sheet modal (character sheet for the player's god) */}
      <AscendantSheet
        open={ascendantSheetOpen}
        onClose={() => setAscendantSheetOpen(false)}
        gameState={gameState}
        archetype={archetype}
        avatarName={avatarName}
        sphereColor={sphereColor}
      />

      {/* Doom clock detail modal */}
      <DoomClockDetail
        open={doomDetailOpen}
        onClose={() => setDoomDetailOpen(false)}
        definition={gameState.doomDefinition}
        state={gameState.doomClock}
      />

      {/* Mandate detail modal */}
      {gameState.mandateDefinition && gameState.mandateState && (
        <MandateDetail
          open={mandateDetailOpen}
          onClose={() => setMandateDetailOpen(false)}
          definition={gameState.mandateDefinition}
          state={gameState.mandateState}
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